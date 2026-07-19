import { Request, Response } from 'express';
import HabitPlan from '../models/HabitPlan';

export const getExplorePlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 8;
    const search = req.query.search as string || '';
    const sort = req.query.sort as string || 'newest';
    const minMinutes = parseInt(req.query.minMinutes as string) || 0;

    let query: any = { status: 'active' };

    if (search) {
      query.$or = [
        { goals: { $regex: search, $options: 'i' } },
        { obstacles: { $regex: search, $options: 'i' } },
        { 'habits.name': { $regex: search, $options: 'i' } }
      ];
    }

    if (minMinutes > 0) {
      query.availableMinutesPerDay = { $gte: minMinutes };
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'timeDesc') sortOption = { availableMinutesPerDay: -1 };
    if (sort === 'timeAsc') sortOption = { availableMinutesPerDay: 1 };

    const total = await HabitPlan.countDocuments(query);
    const plans = await HabitPlan.find(query)
      .populate('userId', 'name avatarUrl')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      plans,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalPlans: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching explore plans', error: (error as Error).message });
  }
};

export const getExplorePlanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const plan = await HabitPlan.findById(id).populate('userId', 'name avatarUrl plan');
    
    if (!plan) {
      res.status(404).json({ message: 'Plan not found' });
      return;
    }

    // Optional: fetch related plans (e.g. same availableMinutesPerDay range or similar goals)
    const relatedPlans = await HabitPlan.find({
      _id: { $ne: plan._id },
      status: 'active',
      availableMinutesPerDay: { $gte: plan.availableMinutesPerDay - 15, $lte: plan.availableMinutesPerDay + 15 }
    })
      .populate('userId', 'name avatarUrl')
      .sort({ createdAt: -1 })
      .limit(3);

    res.status(200).json({ plan, relatedPlans });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plan details', error: (error as Error).message });
  }
};
