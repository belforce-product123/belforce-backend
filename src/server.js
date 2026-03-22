import 'dotenv/config';
import dns from 'dns';
// Prefer IPv4 for outbound connections where the runtime supports it (helps SMTP on cloud hosts).
dns.setDefaultResultOrder?.('ipv4first');
import app from './app.js';
import { config } from './config/index.js';

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
