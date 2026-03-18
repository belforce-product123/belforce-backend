import { getSupabaseClient } from '../lib/supabase.js';
import { generateMembershipId } from '../utils/membershipId.js';

const TABLE = 'membership_registrations';

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

function normalizePlan(plan) {
  if (!plan) return null;
  const v = String(plan).toLowerCase();
  if (v === 'pro' || v === 'promax' || v === 'dummy_plan') return v;
  return null;
}

function normalizeUseType(useType) {
  if (!useType) return null;
  const v = String(useType).toLowerCase();
  if (v === 'seller' || v === 'buyer') return v;
  return null;
}

export async function createMembershipRegistration(req, res, next) {
  try {
    const {
      fullName,
      phone,
      email,
      address = null,
      useType,
      plan,
    } = req.body ?? {};

    const normalizedPlan = normalizePlan(plan);
    const normalizedUseType = normalizeUseType(useType);

    if (!fullName || String(fullName).trim().length < 2) throw badRequest('Full name is required');
    if (!phone || String(phone).trim().length < 6) throw badRequest('Phone is required');
    if (!email || !String(email).includes('@')) throw badRequest('Valid email is required');
    if (!normalizedUseType) throw badRequest('useType must be "seller" or "buyer"');
    if (!normalizedPlan) throw badRequest('plan must be "pro", "promax", or "dummy_plan"');

    const supabase = getSupabaseClient();
    const emailLower = String(email).trim().toLowerCase();
    const phoneTrim = String(phone).trim();

    // If a paid membership already exists for this email/phone, don't allow another purchase.
    const existingPaid = await supabase
      .from(TABLE)
      .select('id, plan, email, phone, membership_id, full_name, payment_status, created_at')
      .or(`email.eq.${emailLower},phone.eq.${phoneTrim}`)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPaid.error) {
      const err = new Error(existingPaid.error.message || 'Failed to check existing membership');
      err.statusCode = 500;
      throw err;
    }

    if (existingPaid.data) {
      return res.status(409).json({
        error: 'An active membership already exists for this email/phone.',
        existing: {
          email: existingPaid.data.email,
          phone: existingPaid.data.phone,
          plan: existingPaid.data.plan,
          membershipId: existingPaid.data.membership_id,
          fullName: existingPaid.data.full_name,
        },
      });
    }

    // Extremely low collision odds, but we still retry once on unique violation.
    const membershipId = generateMembershipId();
    const payload = {
      plan: normalizedPlan,
      full_name: String(fullName).trim(),
      phone: String(phone).trim(),
      email: emailLower,
      address: address ? String(address).trim() : null,
      use_type: normalizedUseType,
      membership_id: membershipId,
      payment_status: 'pending',
    };

    let insert = await supabase.from(TABLE).insert(payload).select('id, membership_id, payment_status, created_at').single();
    if (insert.error && String(insert.error.message || '').toLowerCase().includes('duplicate')) {
      const retryPayload = { ...payload, membership_id: generateMembershipId() };
      insert = await supabase.from(TABLE).insert(retryPayload).select('id, membership_id, payment_status, created_at').single();
    }

    if (insert.error) {
      const err = new Error(insert.error.message || 'Failed to save membership registration');
      err.statusCode = 500;
      throw err;
    }

    res.status(201).json({
      id: insert.data.id,
      membershipId: insert.data.membership_id,
      paymentStatus: insert.data.payment_status,
      createdAt: insert.data.created_at,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMembershipPayment(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) throw badRequest('Missing registration id');

    const {
      paymentStatus,
      razorpayOrderId = null,
      razorpayPaymentId = null,
      razorpaySignature = null,
      paymentAmount = null,
      paymentCurrency = null,
      paymentCapturedAt = null,
      paymentMeta = null,
    } = req.body ?? {};

    if (!paymentStatus || String(paymentStatus).trim().length < 2) {
      throw badRequest('paymentStatus is required');
    }

    const update = {
      payment_status: String(paymentStatus).trim(),
      razorpay_order_id: razorpayOrderId ? String(razorpayOrderId).trim() : null,
      razorpay_payment_id: razorpayPaymentId ? String(razorpayPaymentId).trim() : null,
      razorpay_signature: razorpaySignature ? String(razorpaySignature).trim() : null,
      payment_amount: paymentAmount === null ? null : Number(paymentAmount),
      payment_currency: paymentCurrency ? String(paymentCurrency).trim().toUpperCase() : null,
      payment_captured_at: paymentCapturedAt ? new Date(paymentCapturedAt).toISOString() : null,
      payment_meta: paymentMeta ?? null,
      updated_at: new Date().toISOString(),
    };

    if (Number.isNaN(update.payment_amount)) throw badRequest('paymentAmount must be a number');

    const supabase = getSupabaseClient();
    const result = await supabase
      .from(TABLE)
      .update(update)
      .eq('id', id)
      .select('id, membership_id, payment_status, razorpay_order_id, razorpay_payment_id, updated_at')
      .single();

    if (result.error) {
      const err = new Error(result.error.message || 'Failed to update payment');
      err.statusCode = 500;
      throw err;
    }

    res.json({
      id: result.data.id,
      membershipId: result.data.membership_id,
      paymentStatus: result.data.payment_status,
      razorpayOrderId: result.data.razorpay_order_id,
      razorpayPaymentId: result.data.razorpay_payment_id,
      updatedAt: result.data.updated_at,
    });
  } catch (err) {
    next(err);
  }
}

