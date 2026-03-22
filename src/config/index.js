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
     * Node may resolve smtp.gmail.com to IPv6 first → connect ENETUNREACH. Set SMTP_IPV4=false to use OS default.
     */
    preferIpv4: process.env.SMTP_IPV4 !== 'false',
  },
};
