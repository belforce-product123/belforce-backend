function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPlan(plan) {
  if (plan === 'promax') return 'BelForce Pro Max';
  return 'BelForce Pro';
}

function formatPrice(plan) {
  if (plan === 'promax') return '₹1,599 / year';
  return '₹699 / lifetime';
}

export function buildMembershipReceiptEmail({
  fullName,
  email,
  membershipId,
  plan,
  razorpayOrderId,
  razorpayPaymentId,
  supportPhone,
  supportEmail,
}) {
  const title = 'Payment Successful — Welcome to BelForce';
  const safeName = escapeHtml(fullName || 'Member');
  const safeEmail = escapeHtml(email);
  const safeMembershipId = escapeHtml(membershipId);
  const safePlan = escapeHtml(formatPlan(plan));
  const safePrice = escapeHtml(formatPrice(plan));
  const safeOrderId = escapeHtml(razorpayOrderId || '-');
  const safePaymentId = escapeHtml(razorpayPaymentId || '-');
  const safeSupportPhone = escapeHtml(supportPhone);
  const safeSupportEmail = escapeHtml(supportEmail);

  const preheader = 'Your BelForce membership payment is confirmed.';

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(17,24,39,0.10);">
            <tr>
              <td style="padding:22px 22px 18px;background:linear-gradient(180deg,#5299e0,#5252e0);color:#ffffff;">
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:16px;letter-spacing:0.08em;font-weight:800;">
                  BELFORCE
                </div>
                <div style="margin-top:10px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:26px;line-height:1.25;font-weight:800;">
                  Payment Successful
                </div>
                <div style="margin-top:6px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;opacity:0.95;">
                  Welcome to the BelForce Membership Community
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:22px;">
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:16px;line-height:1.6;color:#111827;">
                  Dear <strong>${safeName}</strong>,
                  <br />
                  Your payment has been received and your membership is now active.
                </div>

                <div style="height:14px;"></div>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
                  <tr>
                    <td style="padding:14px 16px;background:#f9fafb;">
                      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;color:#374151;font-weight:700;">
                        Membership Details
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;color:#111827;">
                        <tr>
                          <td style="padding:6px 0;color:#6b7280;width:42%;">Plan</td>
                          <td style="padding:6px 0;font-weight:700;">${safePlan}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;color:#6b7280;">Price</td>
                          <td style="padding:6px 0;font-weight:700;">${safePrice}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;color:#6b7280;">Membership ID</td>
                          <td style="padding:6px 0;font-weight:800;letter-spacing:0.04em;">${safeMembershipId}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;color:#6b7280;">Registered Email</td>
                          <td style="padding:6px 0;">${safeEmail}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <div style="height:14px;"></div>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px dashed #dbeafe;border-radius:14px;overflow:hidden;background:#eff6ff;">
                  <tr>
                    <td style="padding:14px 16px;">
                      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;color:#1d4ed8;font-weight:800;">
                        Payment Reference
                      </div>
                      <div style="height:8px;"></div>
                      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:13px;color:#1f2937;line-height:1.6;">
                        Razorpay Order ID: <strong>${safeOrderId}</strong><br/>
                        Razorpay Payment ID: <strong>${safePaymentId}</strong>
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="height:14px;"></div>

                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.6;color:#374151;">
                  <strong>What’s next?</strong><br/>
                  - Keep your <strong>Membership ID</strong> safe — you’ll use it to log in when the app launches.<br/>
                  - You’ll receive updates on your registered email/phone.
                </div>

                <div style="height:16px;"></div>

                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px;line-height:1.6;color:#6b7280;">
                  Need help? Contact support:
                  <br />
                  Phone: <a href="tel:${safeSupportPhone}" style="color:#2563eb;text-decoration:none;">${safeSupportPhone}</a>
                  <br />
                  Email: <a href="mailto:${safeSupportEmail}" style="color:#2563eb;text-decoration:none;">${safeSupportEmail}</a>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 22px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:11px;line-height:1.6;color:#9ca3af;">
                  © 2026 BelForce. This email confirms a successful membership payment.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject: title, html };
}

