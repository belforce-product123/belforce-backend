import express from 'express';
import { Router } from 'express';
import * as razorpayController from '../controllers/razorpay.controller.js';

const router = Router();

router.post('/razorpay/order', razorpayController.createOrder);
router.post('/razorpay/verify', razorpayController.verifyPayment);

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

