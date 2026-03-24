import crypto from 'crypto';
import { getSupabaseClient } from '../lib/supabase.js';
import { config } from '../config/index.js';
import { getRazorpay, verifyCheckoutSignature, verifyWebhookSignature } from '../lib/razorpay.js';
import { getFromAddress, isEmailConfigured, sendEmail } from '../lib/mailer.js';
import { buildMembershipReceiptEmail } from '../emails/membershipReceipt.js';
import { logger } from '../utils/logger.js';

const TABLE = 'membership_registrations';

const PLAN_PRICING = {
  pro: { amountInr: 599, currency: 'INR' },
  promax: { amountInr: 999, currency: 'INR' },
  dummy_plan: { amountInr: 1, currency: 'INR' },
};

const SUPPORT_PHONE = '+918374348314';

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

function unauthorized(message = 'Unauthorized') {
  const err = new Error(message);
  err.statusCode = 401;
  return err;
}

/** Constant-time compare for admin API key */
function adminKeyMatches(provided) {
  const expected = config.adminApiKey;
  if (!expected || typeof provided !== 'string') return false;
  try {
    const a = Buffer.from(provided, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function requireAdmin(req) {
  if (!config.adminApiKey) {
    const err = new Error('Manual receipt resend is not configured (set ADMIN_API_KEY)');
    err.statusCode = 503;
    throw err;
  }
  const header =
    req.headers.authorization?.replace(/^Bearer\s+/i, '').trim() ||
    req.headers['x-admin-key']?.toString()?.trim();
  if (!adminKeyMatches(header)) {
    throw unauthorized();
  }
}

function toPaise(inr) {
  return Math.round(Number(inr) * 100);
}

function formatRazorpayError(err) {
  const statusCode = err?.statusCode;
  const code = err?.error?.code;
  const description = err?.error?.description;
  const reason = err?.error?.reason;
  const message = [code, description, reason].filter(Boolean).join(' - ') || err?.message || 'Razorpay request failed';
  return { statusCode, message };
}

export async function createOrder(req, res, next) {
  try {
    const { registrationId } = req.body ?? {};
    if (!registrationId) throw badRequest('registrationId is required');

    if (!config.razorpay.keyId) {
      const err = new Error('Missing RAZORPAY_KEY_ID');
      err.statusCode = 500;
      throw err;
    }

    const supabase = getSupabaseClient();
    const reg = await supabase
      .from(TABLE)
      .select('id, plan, full_name, phone, email, membership_id, payment_status')
      .eq('id', registrationId)
      .single();

    if (reg.error || !reg.data) {
      const err = new Error(reg.error?.message || 'Registration not found');
      err.statusCode = 404;
      throw err;
    }

    const plan = reg.data.plan;
    const pricing = PLAN_PRICING[plan];
    if (!pricing) throw badRequest('Invalid plan on registration');

    const razorpay = getRazorpay();
    const amountPaise = toPaise(pricing.amountInr);

    let order;
    try {
      // Razorpay receipt has a max length of 40 chars; UUID-based receipts can exceed it.
      order = await razorpay.orders.create({
        amount: amountPaise,
        currency: pricing.currency,
        receipt: reg.data.membership_id,
        notes: {
          registrationId: reg.data.id,
          membershipId: reg.data.membership_id,
          plan,
          phone: reg.data.phone,
          email: reg.data.email,
        },
      });
    } catch (e) {
      const { statusCode, message } = formatRazorpayError(e);
      const err = new Error(message);
      err.statusCode = statusCode || 502;
      throw err;
    }

    await supabase
      .from(TABLE)
      .update({
        payment_status: 'created',
        razorpay_order_id: order.id,
        payment_amount: pricing.amountInr,
        payment_currency: pricing.currency,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reg.data.id);

    res.json({
      keyId: config.razorpay.keyId,
      orderId: order.id,
      amount: order.amount, // paise
      currency: order.currency,
      name: reg.data.full_name,
      email: reg.data.email,
      contact: reg.data.phone,
      membershipId: reg.data.membership_id,
      registrationId: reg.data.id,
      plan,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyPayment(req, res, next) {
  try {
    const { registrationId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body ?? {};
    if (!registrationId) throw badRequest('registrationId is required');
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw badRequest('Missing Razorpay payment details');
    }

    const signatureOk = verifyCheckoutSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!signatureOk) {
      const err = new Error('Invalid payment signature');
      err.statusCode = 400;
      throw err;
    }

    const supabase = getSupabaseClient();
    const existing = await supabase
      .from(TABLE)
      .select('id, plan, full_name, email, membership_id, payment_status, payment_meta')
      .eq('id', registrationId)
      .single();

    if (existing.error || !existing.data) {
      const err = new Error(existing.error?.message || 'Registration not found');
      err.statusCode = 404;
      throw err;
    }

    const updated = await supabase
      .from(TABLE)
      .update({
        payment_status: 'paid',
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        payment_captured_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', registrationId)
      .select(
        'id, plan, full_name, email, phone, address, membership_id, payment_status, payment_meta, razorpay_order_id, razorpay_payment_id'
      )
      .single();

    if (updated.error) {
      const err = new Error(updated.error.message || 'Failed to update payment status');
      err.statusCode = 500;
      throw err;
    }

    // Send exactly one email per successful payment.
    let emailSent = false;
    const currentMeta = updated.data.payment_meta || existing.data.payment_meta || {};
    const alreadySent = Boolean(currentMeta?.emailSentAt || currentMeta?.emailSent);

    if (!alreadySent) {
      if (!isEmailConfigured()) {
        logger.warn('Resend not configured (RESEND_API_KEY); skipping receipt email', { registrationId });
      } else {
        try {
          const { subject, html } = buildMembershipReceiptEmail({
            fullName: updated.data.full_name,
            email: updated.data.email,
            phone: updated.data.phone,
            address: updated.data.address,
            membershipId: updated.data.membership_id,
            plan: updated.data.plan,
            razorpayOrderId: updated.data.razorpay_order_id,
            razorpayPaymentId: updated.data.razorpay_payment_id,
            supportPhone: SUPPORT_PHONE,
            supportEmail: config.supportEmail,
          });

          const info = await sendEmail({
            from: getFromAddress(),
            to: updated.data.email,
            subject,
            html,
          });

          emailSent = true;
          const nextMeta = {
            ...(currentMeta && typeof currentMeta === 'object' ? currentMeta : {}),
            emailSent: true,
            emailSentAt: new Date().toISOString(),
            emailMessageId: info?.messageId || null,
          };

          await supabase
            .from(TABLE)
            .update({
              payment_meta: nextMeta,
              updated_at: new Date().toISOString(),
            })
            .eq('id', registrationId);
        } catch (e) {
          logger.error('Failed to send receipt email', e?.message || e);
          const nextMeta = {
            ...(currentMeta && typeof currentMeta === 'object' ? currentMeta : {}),
            emailSent: false,
            emailError: String(e?.message || e || 'Unknown email error'),
            emailErrorAt: new Date().toISOString(),
          };

          await supabase
            .from(TABLE)
            .update({
              payment_meta: nextMeta,
              updated_at: new Date().toISOString(),
            })
            .eq('id', registrationId);
        }
      }
    } else {
      emailSent = true;
    }

    res.json({
      id: updated.data.id,
      membershipId: updated.data.membership_id,
      paymentStatus: updated.data.payment_status,
      emailSent,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Manually resend the membership receipt email (same template as verify flow).
 * Secured with ADMIN_API_KEY via Authorization: Bearer <key> or X-Admin-Key.
 * Body: { registrationId } or { membershipId } (exactly one required).
 */
export async function resendMembershipReceipt(req, res, next) {
  try {
    requireAdmin(req);

    const { registrationId, membershipId } = req.body ?? {};
    if (!registrationId && !membershipId) {
      throw badRequest('Provide registrationId or membershipId');
    }
    if (registrationId && membershipId) {
      throw badRequest('Provide only one of registrationId or membershipId');
    }

    const supabase = getSupabaseClient();
    let query = supabase
      .from(TABLE)
      .select(
        'id, plan, full_name, email, phone, address, membership_id, payment_status, payment_meta, razorpay_order_id, razorpay_payment_id'
      );

    if (registrationId) {
      query = query.eq('id', registrationId);
    } else {
      query = query.eq('membership_id', membershipId);
    }

    const row = await query.single();

    if (row.error || !row.data) {
      const err = new Error(row.error?.message || 'Registration not found');
      err.statusCode = 404;
      throw err;
    }

    if (row.data.payment_status !== 'paid') {
      throw badRequest('Registration is not paid; receipt email only applies to completed payments');
    }

    if (!isEmailConfigured()) {
      const err = new Error('Email is not configured (set RESEND_API_KEY and RESEND_FROM)');
      err.statusCode = 503;
      throw err;
    }

    const currentMeta =
      row.data.payment_meta && typeof row.data.payment_meta === 'object' ? row.data.payment_meta : {};

    const { subject, html } = buildMembershipReceiptEmail({
      fullName: row.data.full_name,
      email: row.data.email,
      phone: row.data.phone,
      address: row.data.address,
      membershipId: row.data.membership_id,
      plan: row.data.plan,
      razorpayOrderId: row.data.razorpay_order_id,
      razorpayPaymentId: row.data.razorpay_payment_id,
      supportPhone: SUPPORT_PHONE,
      supportEmail: config.supportEmail,
    });

    const now = new Date().toISOString();

    try {
      const info = await sendEmail({
        from: getFromAddress(),
        to: row.data.email,
        subject,
        html,
      });

      const nextMeta = {
        ...currentMeta,
        emailSent: true,
        emailSentAt: currentMeta.emailSentAt || now,
        emailLastManualResendAt: now,
        emailManualResendCount: Number(currentMeta.emailManualResendCount || 0) + 1,
        emailMessageId: info?.messageId || null,
      };
      delete nextMeta.emailError;
      delete nextMeta.emailErrorAt;

      await supabase
        .from(TABLE)
        .update({
          payment_meta: nextMeta,
          updated_at: now,
        })
        .eq('id', row.data.id);

      res.json({
        ok: true,
        id: row.data.id,
        membershipId: row.data.membership_id,
        email: row.data.email,
        emailSent: true,
        messageId: info?.messageId || null,
        resentAt: now,
      });
    } catch (e) {
      logger.error('Manual resend receipt email failed', e?.message || e);
      const nextMeta = {
        ...currentMeta,
        emailSent: false,
        emailError: String(e?.message || e || 'Unknown email error'),
        emailErrorAt: now,
        emailLastManualResendFailedAt: now,
      };
      await supabase
        .from(TABLE)
        .update({
          payment_meta: nextMeta,
          updated_at: now,
        })
        .eq('id', row.data.id);

      const err = new Error(`Failed to send email: ${nextMeta.emailError}`);
      err.statusCode = 502;
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

// Placeholder for later: configure a Razorpay webhook and verify with RAZORPAY_WEBHOOK_SECRET.
export async function webhook(req, res, next) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const payload = req.rawBody;

    if (!signature || !payload) throw badRequest('Invalid webhook request');
    const ok = verifyWebhookSignature({ payload, signature });
    if (!ok) {
      const err = new Error('Invalid webhook signature');
      err.statusCode = 400;
      throw err;
    }

    // TODO: parse events + update payment_status based on payment.captured, etc.
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}

