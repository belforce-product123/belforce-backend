import { Router } from 'express';
import exampleRoutes from './example.routes.js';
import membershipRoutes from './membership.routes.js';
import paymentsRoutes from './payments.routes.js';

const router = Router();

// Mount route modules
router.use('/example', exampleRoutes);
router.use('/memberships', membershipRoutes);
router.use('/payments', paymentsRoutes);

export default router;
