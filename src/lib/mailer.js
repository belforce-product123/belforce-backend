import dns from 'dns/promises';
import net from 'net';
import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

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

/**
 * Nodemailer resolves A+AAAA and then picks a RANDOM address for the first hop.
 * On hosts without IPv6 egress, that yields intermittent ENETUNREACH to Gmail IPv6.
 * We pre-resolve to a single IPv4 and set tls.servername to the real hostname (required for SNI).
 */
async function buildTransportOptions() {
  const hostname = config.smtp.host;
  const base = {
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
    connectionTimeout: Number.isFinite(config.smtp.connectionTimeout)
      ? config.smtp.connectionTimeout
      : 60000,
  };

  if (!config.smtp.preferIpv4 || net.isIP(hostname)) {
    return { ...base, host: hostname };
  }

  try {
    const { address } = await dns.lookup(hostname, { family: 4 });
    return {
      ...base,
      host: address,
      tls: {
        servername: hostname,
      },
    };
  } catch (e) {
    logger.warn('SMTP IPv4 lookup failed; falling back to hostname', e?.message || e);
    return { ...base, host: hostname };
  }
}

export async function getMailer() {
  if (!isSmtpConfigured()) return null;
  if (cachedTransporter) return cachedTransporter;

  const transportOptions = await buildTransportOptions();
  cachedTransporter = nodemailer.createTransport(transportOptions);

  return cachedTransporter;
}

export function getFromAddress() {
  return config.smtp.from || `BelForce <${config.supportEmail}>`;
}
