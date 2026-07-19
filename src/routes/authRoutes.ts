import express from 'express';
import { registerUser, loginUser, refresh, googleAuth, logoutUser, updateProfile } from '../controllers/authController';
import { protect } from '../middlewares/auth';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refresh);
router.post('/google', googleAuth);
router.post('/logout', logoutUser);
router.put('/profile', protect, updateProfile);

export default router;
