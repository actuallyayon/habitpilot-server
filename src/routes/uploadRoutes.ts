import express from 'express';
import multer from 'multer';
import { protect } from '../middlewares/auth';
import { uploadAvatar } from '../controllers/uploadController';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/avatar', protect, upload.single('image'), uploadAvatar);

export default router;
