import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const RESEND_API = 'https://api.resend.com';

/** True when transactional email can be sent (Resend). */
export function isEmailConfigured() {
  return Boolean(config.resend.apiKey);
}

/** Resend From header (defaults to BelForce <support@belforce.in> when RESEND_FROM unset). */
export function getFromAddress() {
  return config.resend.from;
}

/**
 * Send HTML email via Resend (HTTPS — works on Render free tier; SMTP ports are blocked).
 * @returns {{ messageId: string|null }}
 */
export async function sendEmail({ to, subject, html, from }) {
  if (!config.resend.apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const fromAddr = from || getFromAddress();
  const toList = Array.isArray(to) ? to : [to];

  const res = await fetch(`${RESEND_API}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resend.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddr,
      to: toList,
      subject,
      html,
    }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail =
      json?.message ||
      (Array.isArray(json?.errors) && json.errors.map((e) => e.message).join('; ')) ||
      json?.name ||
      `${res.status} ${res.statusText}`;
    const err = new Error(detail);
    err.statusCode = res.status;
    throw err;
  }

  const messageId = json?.data?.id ?? json?.id ?? null;
  return { messageId };
}

/**
 * Lightweight startup check. Uses GET /domains when the key allows it.
 * "Send-only" keys (Resend) cannot call /domains — they only allow POST /emails; that is OK.
 */
export async function verifyEmailOnStartup() {
  if (!config.resend.verifyOnStartup) {
    logger.info('Resend verify on startup skipped (RESEND_VERIFY_ON_STARTUP=false)');
    return;
  }
  if (!config.resend.apiKey) {
    logger.info('Resend verify skipped: RESEND_API_KEY not set');
    return;
  }

  try {
    const res = await fetch(`${RESEND_API}/domains`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.resend.apiKey}`,
      },
    });

    const text = await res.text();
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }

    if (res.ok) {
      logger.info('Resend API key OK (domains endpoint reachable)');
      return;
    }

    // Send-only / restricted keys: valid for POST /emails only — not an error.
    if (res.status === 401 && body.name === 'restricted_api_key') {
      logger.info(
        'Resend send-only API key: domain list not allowed (expected). Email sending will still work.'
      );
      return;
    }

    logger.error('Resend verify failed', {
      status: res.status,
      message: body.message || text || res.statusText,
    });
  } catch (error) {
    logger.error('Resend verify failed', {
      message: error?.message || String(error),
    });
  }
}
