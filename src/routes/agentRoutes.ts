import express from 'express';
import { protect } from '../middlewares/auth';
import {
  createPlan,
  createPlanManual,
  getActivePlans,
  deletePlan,
  createCheckIn,
  getCheckIns,
  generateWeeklyReplan,
  generateMonthlyReport
} from '../controllers/agentController';

const router = express.Router();

router.use(protect); // All agent routes require authentication

router.post('/plans', createPlan);
router.post('/plans/manual', createPlanManual);
router.get('/plans', getActivePlans);
router.delete('/plans/:planId', deletePlan);

router.post('/checkins', createCheckIn);
router.get('/checkins/:planId', getCheckIns);

router.post('/replans', generateWeeklyReplan);
router.post('/reports', generateMonthlyReport);

export default router;
