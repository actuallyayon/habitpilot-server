import express from 'express';
import { getExplorePlans, getExplorePlanById } from '../controllers/exploreController';

const router = express.Router();

router.get('/plans', getExplorePlans);
router.get('/plans/:id', getExplorePlanById);

export default router;
