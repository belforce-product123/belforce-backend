import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

let cachedTransporter = null;

function isSmtpConfigured() {
  return Boolean(
    config.smtp.host &&
      config.smtp.port &&
      config.smtp.user &&
      config.smtp.pass &&
      config.smtp.from
  );
}

export function getMailer() {
  if (!isSmtpConfigured()) return null;
  if (cachedTransporter) return cachedTransporter;

  const transportOptions = {
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  };

  // Avoid ENETUNREACH to IPv6 SMTP (common when Gmail resolves to AAAA but network has no IPv6 route)
  if (config.smtp.preferIpv4) {
    transportOptions.family = 4;
  }

  cachedTransporter = nodemailer.createTransport(transportOptions);

  return cachedTransporter;
}

export function getFromAddress() {
  return config.smtp.from || 'BelForce <no-reply@belforce.com>';
}

