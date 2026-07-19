import mongoose, { Schema, Document } from 'mongoose';

export interface IHabit {
  name: string;
  trigger: string;
  minVersion: string;
  reason: string;
}

export interface IHabitPlan extends Document {
  userId: mongoose.Types.ObjectId;
  goals: string[];
  obstacles: string;
  availableMinutesPerDay: number;
  habits: IHabit[];
  status: 'active' | 'archived';
  version: number;
  createdAt: Date;
}

const HabitSchema = new Schema<IHabit>({
  name: { type: String, required: true },
  trigger: { type: String, required: true },
  minVersion: { type: String, required: true },
  reason: { type: String, required: true },
});

const HabitPlanSchema = new Schema<IHabitPlan>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  goals: [{ type: String }],
  obstacles: { type: String },
  availableMinutesPerDay: { type: Number, required: true },
  habits: [HabitSchema],
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  version: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IHabitPlan>('HabitPlan', HabitPlanSchema);
