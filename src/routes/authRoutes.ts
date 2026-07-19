import express from 'express';
import { registerUser, loginUser, refresh, googleAuth, logoutUser } from '../controllers/authController';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refresh);
router.post('/google', googleAuth);
router.post('/logout', logoutUser);

export default router;
