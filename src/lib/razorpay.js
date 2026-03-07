import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config/index.js';

let cachedInstance = null;

export function getRazorpay() {
  if (cachedInstance) return cachedInstance;
  if (!config.razorpay.keyId || !config.razorpay.keySecret) {
    const err = new Error('Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET');
    err.statusCode = 500;
    throw err;
  }
  cachedInstance = new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
  });
  return cachedInstance;
}

export function verifyCheckoutSignature({ orderId, paymentId, signature }) {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', config.razorpay.keySecret || '')
    .update(body)
    .digest('hex');
  return expected === signature;
}

export function verifyWebhookSignature({ payload, signature }) {
  if (!config.razorpay.webhookSecret) return false;
  const expected = crypto
    .createHmac('sha256', config.razorpay.webhookSecret)
    .update(payload)
    .digest('hex');
  return expected === signature;
}

