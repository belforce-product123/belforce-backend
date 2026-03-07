import { Router } from 'express';
import * as membershipController from '../controllers/membership.controller.js';

const router = Router();

router.post('/registrations', membershipController.createMembershipRegistration);
router.patch('/registrations/:id/payment', membershipController.updateMembershipPayment);

export default router;

