import express from 'express';
import { protect } from '../middlewares/auth';
import {
  createPlan,
  getActivePlans,
  createCheckIn,
  getCheckIns,
  generateWeeklyReplan,
  generateMonthlyReport
} from '../controllers/agentController';

const router = express.Router();

router.use(protect); // All agent routes require authentication

router.post('/plans', createPlan);
router.get('/plans', getActivePlans);

router.post('/checkins', createCheckIn);
router.get('/checkins/:planId', getCheckIns);

router.post('/replans', generateWeeklyReplan);
router.post('/reports', generateMonthlyReport);

export default router;
