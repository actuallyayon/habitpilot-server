import express from 'express';
import { protect, adminOnly } from '../middlewares/auth';
import { getAdminStats, getAllUsers, toggleBlockUser, updateUserPlan } from '../controllers/adminController';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.post('/users/:userId/block', toggleBlockUser);
router.post('/users/:userId/plan', updateUserPlan);

export default router;
