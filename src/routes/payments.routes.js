import express from 'express';
import { Router } from 'express';
import * as razorpayController from '../controllers/razorpay.controller.js';

const router = Router();

router.post('/razorpay/order', razorpayController.createOrder);
router.post('/razorpay/verify', razorpayController.verifyPayment);
/** Manual receipt resend (admin). Requires ADMIN_API_KEY. Body: { registrationId } or { membershipId } */
router.post('/razorpay/resend-receipt', razorpayController.resendMembershipReceipt);

// Webhook needs raw body for signature verification.
router.post(
  '/razorpay/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.rawBody = req.body?.toString('utf8') || '';
    next();
  },
  razorpayController.webhook
);

export default router;

