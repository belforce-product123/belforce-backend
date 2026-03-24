function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPlan(plan) {
  if (plan === 'dummy_plan') return 'Dummy Plan (Test)';
  if (plan === 'promax') return 'BelForce Pro Max';
  return 'BelForce Pro';
}

function formatPrice(plan) {
  if (plan === 'dummy_plan') return '₹1 (test payment)';
  if (plan === 'promax') return '₹999 / year';
  return '₹599 / lifetime';
}

function formatAddressLines(address) {
  const raw = String(address ?? '').trim();
  if (!raw) return '—';
  return escapeHtml(raw).replace(/\r\n/g, '\n').split('\n').join('<br/>');
}

/**
 * Pre-paid early access welcome email — HTML tuned for Gmail / Apple Mail (inline styles).
 */
export function buildMembershipReceiptEmail({
  fullName,
  email,
  phone,
  address,
  membershipId,
  plan,
  razorpayOrderId,
  razorpayPaymentId,
  supportPhone,
  supportEmail,
}) {
  const safeName = escapeHtml(fullName || 'Member');
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone || '—');
  const safeAddressBlock = formatAddressLines(address);
  const safeMembershipId = escapeHtml(membershipId);
  const safePlan = escapeHtml(formatPlan(plan));
  const safePrice = escapeHtml(formatPrice(plan));
  const safeOrderId = escapeHtml(razorpayOrderId || '—');
  const safePaymentId = escapeHtml(razorpayPaymentId || '—');
  const safeSupportPhone = escapeHtml(supportPhone);
  const safeSupportEmail = escapeHtml(supportEmail);

  const title = 'Welcome to BelForce — Your Pre-Paid Early Access Membership';
  const preheader =
    'Thank you for joining BelForce. Your membership is confirmed — keep your BelForce ID for app login.';

  const font =
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#eef2ff;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2ff;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(79,70,229,0.12);">
            <!-- Header -->
            <tr>
              <td style="padding:28px 28px 24px;background:linear-gradient(135deg,#4f46e5 0%,#6366f1 45%,#7c3aed 100%);color:#ffffff;">
                <div style="font-family:${font};font-size:13px;letter-spacing:0.2em;font-weight:700;opacity:0.95;">BELFORCE</div>
                <div style="font-family:${font};font-size:24px;line-height:1.3;font-weight:800;margin-top:12px;">Welcome aboard</div>
                <div style="font-family:${font};font-size:15px;line-height:1.5;margin-top:8px;opacity:0.95;">Pre-Paid Early Access Member</div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:28px 28px 8px;">
                <p style="margin:0 0 16px;font-family:${font};font-size:16px;line-height:1.65;color:#111827;">
                  Dear <strong style="color:#1e1b4b;">${safeName}</strong>,
                </p>
                <p style="margin:0 0 16px;font-family:${font};font-size:15px;line-height:1.65;color:#374151;">
                  Thank you for choosing <strong>BelForce</strong> and becoming a valued <strong>Pre-Paid Early Access Member</strong>.
                </p>
                <p style="margin:0 0 20px;font-family:${font};font-size:15px;line-height:1.65;color:#374151;">
                  We’re excited to confirm your subscription and officially welcome you to the BelForce community. Your trust at this early stage means a lot to us.
                </p>

                <!-- Section title -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                  <tr>
                    <td style="padding:0 0 8px;border-bottom:1px solid #e5e7eb;">
                      <span style="font-family:${font};font-size:13px;font-weight:700;letter-spacing:0.06em;color:#4f46e5;text-transform:uppercase;">Your membership details</span>
                    </td>
                  </tr>
                </table>

                <!-- Details card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;background-color:#fafafa;">
                  <tr>
                    <td style="padding:16px 18px;border-bottom:1px solid #e5e7eb;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:${font};font-size:14px;">
                        <tr>
                          <td style="padding:8px 0;width:38%;color:#6b7280;vertical-align:top;">Name</td>
                          <td style="padding:8px 0;color:#111827;font-weight:600;">${safeName}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;color:#6b7280;vertical-align:top;">Email</td>
                          <td style="padding:8px 0;color:#111827;"><a href="mailto:${safeEmail}" style="color:#4f46e5;text-decoration:none;">${safeEmail}</a></td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;color:#6b7280;vertical-align:top;">Phone number</td>
                          <td style="padding:8px 0;color:#111827;">${safePhone}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;color:#6b7280;vertical-align:top;">Address</td>
                          <td style="padding:8px 0;color:#111827;line-height:1.5;">${safeAddressBlock}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;color:#6b7280;vertical-align:top;">Selected plan</td>
                          <td style="padding:8px 0;color:#111827;font-weight:600;">${safePlan}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;color:#6b7280;vertical-align:top;">Amount paid</td>
                          <td style="padding:8px 0;color:#111827;">${safePrice}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px;background:linear-gradient(180deg,#eef2ff 0%,#e0e7ff 100%);border-top:1px solid #c7d2fe;">
                      <div style="font-family:${font};font-size:13px;color:#4338ca;font-weight:700;margin-bottom:6px;">Your BelForce ID</div>
                      <div style="font-family:${font};font-size:20px;font-weight:800;letter-spacing:0.08em;color:#1e1b4b;">${safeMembershipId}</div>
                      <div style="font-family:${font};font-size:12px;color:#6366f1;margin-top:8px;line-height:1.5;">
                        This ID will be used to log in once the app is officially launched. Please keep it safe.
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="height:20px;"></div>

                <!-- Launch callout -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #fde68a;background-color:#fffbeb;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <div style="font-family:${font};font-size:13px;font-weight:700;color:#b45309;margin-bottom:4px;">Expected app launch</div>
                      <div style="font-family:${font};font-size:16px;font-weight:800;color:#92400e;">April 10<sup style="font-size:11px;">th</sup> – 15<sup style="font-size:11px;">th</sup></div>
                      <div style="font-family:${font};font-size:13px;color:#78350f;margin-top:8px;line-height:1.55;">
                        We’re working to deliver a seamless, trustworthy experience for buying and selling. You’ll receive updates, exclusive offers, and important announcements at this email.
                      </div>
                    </td>
                  </tr>
                </table>

                <p style="margin:22px 0 0;font-family:${font};font-size:15px;line-height:1.65;color:#374151;">
                  Thank you again for being an early supporter and believing in our vision. We’re excited to serve you.
                </p>

                <p style="margin:18px 0 0;font-family:${font};font-size:15px;line-height:1.65;color:#111827;">
                  Warm regards,<br />
                  <strong>Team BelForce</strong>
                </p>
                <p style="margin:12px 0 0;font-family:${font};font-size:13px;line-height:1.5;color:#6b7280;font-style:italic;">
                  Building India’s Most Trusted Resale Experience
                </p>
              </td>
            </tr>

            <!-- Payment reference (compact) -->
            <tr>
              <td style="padding:0 28px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;background-color:#f9fafb;border:1px dashed #d1d5db;">
                  <tr>
                    <td style="padding:14px 16px;">
                      <div style="font-family:${font};font-size:11px;font-weight:700;letter-spacing:0.06em;color:#9ca3af;text-transform:uppercase;">Payment reference</div>
                      <div style="font-family:${font};font-size:12px;color:#6b7280;margin-top:8px;line-height:1.5;">
                        Order ID: <span style="color:#374151;">${safeOrderId}</span><br />
                        Payment ID: <span style="color:#374151;">${safePaymentId}</span>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Support -->
            <tr>
              <td style="padding:0 28px 24px;">
                <p style="margin:0;font-family:${font};font-size:13px;line-height:1.6;color:#6b7280;">
                  Need help?<br />
                  Phone: <a href="tel:${safeSupportPhone}" style="color:#4f46e5;text-decoration:none;">${safeSupportPhone}</a><br />
                  Support email: <a href="mailto:${safeSupportEmail}" style="color:#4f46e5;text-decoration:none;">${safeSupportEmail}</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:16px 28px 22px;background-color:#f8fafc;border-top:1px solid #e5e7eb;">
                <div style="font-family:${font};font-size:11px;line-height:1.6;color:#9ca3af;">
                  © ${new Date().getFullYear()} BelForce. This email confirms your Pre-Paid Early Access membership.
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
