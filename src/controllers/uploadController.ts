import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import axios from 'axios';
import FormData from 'form-data';
import User from '../models/User';

export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const fileBuffer = req.file.buffer;
    const base64Image = fileBuffer.toString('base64');

    const formData = new FormData();
    formData.append('image', base64Image);

    const imgbbResponse = await axios.post(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, formData, {
      headers: formData.getHeaders(),
    });

    const imageUrl = imgbbResponse.data.data.url;

    // Update user avatar
    const user = await User.findById(req.user._id);
    if (user) {
      user.avatarUrl = imageUrl;
      await user.save();
    }

    res.status(200).json({ url: imageUrl });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading image', error: (error as Error).message });
  }
};
