import express from 'express';
import { protect } from '../middlewares/auth';
import { createCheckoutSession, handleStripeWebhook } from '../controllers/stripeController';

const router = express.Router();

// The webhook needs the raw body to verify the signature, so we use express.raw() 
// This must be mounted before any generic express.json() middleware.
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

router.post('/create-checkout-session', protect, createCheckoutSession);

export default router;
