/**
 * Application configuration
 * Load env variables and export config
 */

/** Single official inbox + default Resend “From” local-part (verify belforce.in in Resend). */
const BELFORCE_CONTACT_EMAIL = 'support@belforce.in';

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
  supportEmail: process.env.SUPPORT_EMAIL || BELFORCE_CONTACT_EMAIL,
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
  /**
   * Email via Resend (HTTPS). Render free tier blocks outbound SMTP (25/465/587).
   * @see https://resend.com/docs
   */
  resend: {
    apiKey: process.env.RESEND_API_KEY || null,
    /**
     * Sender must be verified in Resend (use domain belforce.in). Override with RESEND_FROM if needed.
     */
    from: process.env.RESEND_FROM || `BelForce <${BELFORCE_CONTACT_EMAIL}>`,
    /** GET /domains on boot to validate API key (default true). */
    verifyOnStartup: process.env.RESEND_VERIFY_ON_STARTUP !== 'false',
  },
};
