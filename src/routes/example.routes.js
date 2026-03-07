import { Router } from 'express';
import * as exampleController from '../controllers/example.controller.js';

const router = Router();

router.get('/', exampleController.getExample);
router.post('/', exampleController.createExample);

export default router;
