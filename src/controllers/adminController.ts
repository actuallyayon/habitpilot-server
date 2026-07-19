import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import User from '../models/User';
import Subscription from '../models/Subscription';

export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const proUsers = await User.countDocuments({ plan: 'pro' });
    const freeUsers = await User.countDocuments({ plan: 'free' });
    const totalRevenue = proUsers * 9.99; // MRR ($9.99 per Pro user)

    // Generate signups history for the past 7 days
    const signupHistory = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const signups = await User.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });

      signupHistory.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        signups
      });
    }

    res.json({
      totalUsers,
      proUsers,
      freeUsers,
      totalRevenue,
      signupHistory
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving admin stats', error: (error as Error).message });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving users', error: (error as Error).message });
  }
};

export const toggleBlockUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.email === 'admin@habitpilot.com') {
      res.status(400).json({ message: 'Cannot block the main administrator' });
      return;
    }

    user.status = user.status === 'blocked' ? 'active' : 'blocked';
    await user.save();

    res.json({
      message: `User successfully ${user.status === 'blocked' ? 'blocked' : 'unblocked'}`,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        plan: user.plan
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user block status', error: (error as Error).message });
  }
};

export const updateUserPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { plan } = req.body;

  if (plan !== 'free' && plan !== 'pro') {
    res.status(400).json({ message: 'Invalid plan tier' });
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.plan = plan;
    await user.save();

    // If upgrading to Pro, create/update subscription object
    if (plan === 'pro') {
      await Subscription.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          stripeSubscriptionId: 'sub_admin_manual_' + user._id,
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        },
        { upsert: true, new: true }
      );
    } else {
      // If downgrading to free, mark subscription as cancelled/inactive
      await Subscription.findOneAndUpdate(
        { userId: user._id },
        { status: 'canceled' }
      );
    }

    res.json({
      message: 'User plan updated successfully',
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        plan: user.plan
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user plan', error: (error as Error).message });
  }
};
