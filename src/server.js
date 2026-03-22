import 'dotenv/config';
import dns from 'dns';
// Prefer IPv4 for outbound connections where the runtime supports it (helps SMTP on cloud hosts).
dns.setDefaultResultOrder?.('ipv4first');
import app from './app.js';
import { config } from './config/index.js';
import { verifySmtpOnStartup } from './lib/mailer.js';

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  // Non-blocking: logs SMTP readiness or connection/auth errors (see verifySmtpOnStartup).
  verifySmtpOnStartup().catch((err) => {
    console.error('[SMTP verify] unexpected error', err?.message || err);
  });
});
