/**
 * Application configuration
 * Load env variables and export config
 */

/** Comma-separated list in CORS_ORIGIN, e.g. https://belforce.in,https://www.belforce.in,https://belforce-frontend-1.onrender.com */
function parseCorsOrigins() {
  const raw = process.env.CORS_ORIGIN || 'http://localhost:3000';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: '/api',
  /** Public support inbox (receipt emails, templates). Override with SUPPORT_EMAIL if needed. */
  supportEmail: process.env.SUPPORT_EMAIL || 'belforce.in@gmail.com',
  /** Set on the server to enable manual receipt resend (`POST .../razorpay/resend-receipt`). */
  adminApiKey: process.env.ADMIN_API_KEY || null,
  /** Allowed browser origins for CORS (array) */
  corsOrigins: parseCorsOrigins(),
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : null,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
    /**
     * Prefer IPv4 for SMTP (default: true). Many hosts (e.g. Render) have no working IPv6 egress;
     * Nodemailer also picks a *random* A/AAAA record — IPv6 often fails with ENETUNREACH.
     * Set SMTP_IPV4=false to use hostname only (not recommended on Render).
     */
    preferIpv4: process.env.SMTP_IPV4 !== 'false',
    /** ms to wait for TCP + TLS (default 60000). Raise if you see ETIMEDOUT on cold SMTP. */
    connectionTimeout: process.env.SMTP_CONNECTION_TIMEOUT_MS
      ? Number(process.env.SMTP_CONNECTION_TIMEOUT_MS)
      : 60000,
    /** Run `transporter.verify()` once on boot (default true). Set SMTP_VERIFY_ON_STARTUP=false to skip. */
    verifyOnStartup: process.env.SMTP_VERIFY_ON_STARTUP !== 'false',
  },
};
