import express from 'express';
import { protect } from '../middlewares/auth';
import {
  createPlan,
  createCheckIn,
  generateWeeklyReplan,
  generateMonthlyReport
} from '../controllers/agentController';

const router = express.Router();

router.use(protect); // All agent routes require authentication

router.post('/plans', createPlan);
router.post('/checkins', createCheckIn);
router.post('/replans', generateWeeklyReplan);
router.post('/reports', generateMonthlyReport);

export default router;
