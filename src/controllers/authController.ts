import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';

const generateTokens = (id: string) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    if (user) {
      const { accessToken, refreshToken } = generateTokens(user._id.toString());
      setRefreshTokenCookie(res, refreshToken);
      res.status(201).json({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        plan: user.plan,
        accessToken
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    // Auto-create demo user if it doesn't exist
    if (!user && email === 'demo@habitpilot.com' && password === 'password123') {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      user = await User.create({
        name: 'Demo User',
        email: 'demo@habitpilot.com',
        passwordHash,
        plan: 'free'
      });
    }

    if (user && user.passwordHash && (await bcrypt.compare(password, user.passwordHash))) {
      const { accessToken, refreshToken } = generateTokens(user._id.toString());
      setRefreshTokenCookie(res, refreshToken);
      res.json({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        plan: user.plan,
        accessToken
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ message: 'Not authorized, no refresh token' });
    return;
  }

  try {
    const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string);
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id.toString());
    setRefreshTokenCookie(res, newRefreshToken);
    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, refresh token failed' });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID as string,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      res.status(400).json({ message: 'Invalid Google Token' });
      return;
    }

    const { sub: googleId, picture: avatarUrl } = payload;
    const email = payload.email as string;
    const name = payload.name as string;
    
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        avatarUrl: avatarUrl || '',
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (!user.avatarUrl && avatarUrl) user.avatarUrl = avatarUrl;
      await user.save();
    }

      const { accessToken, refreshToken } = generateTokens(user._id.toString());
    setRefreshTokenCookie(res, refreshToken);
    
    res.json({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      plan: user.plan,
      avatarUrl: user.avatarUrl,
      accessToken
    });
  } catch (error) {
    res.status(500).json({ message: 'Google Auth failed' });
  }
};

export const logoutUser = (req: Request, res: Response): void => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    expires: new Date(0)
  });
  res.status(200).json({ message: 'Logged out successfully' });
};
