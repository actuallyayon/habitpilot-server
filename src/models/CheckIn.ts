import mongoose, { Schema, Document } from 'mongoose';

export interface ICheckInEntry {
  habitName: string;
  status: 'done' | 'skipped' | 'partial';
  note?: string;
}

export interface ICheckIn extends Document {
  planId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  entries: ICheckInEntry[];
  agentReaction?: string;
  createdAt: Date;
}

const CheckInEntrySchema = new Schema<ICheckInEntry>({
  habitName: { type: String, required: true },
  status: { type: String, enum: ['done', 'skipped', 'partial'], required: true },
  note: { type: String },
});

const CheckInSchema = new Schema<ICheckIn>({
  planId: { type: Schema.Types.ObjectId, ref: 'HabitPlan', required: true },
  date: { type: String, required: true },
  entries: [CheckInEntrySchema],
  agentReaction: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Compound index to ensure one check-in per plan per date
CheckInSchema.index({ planId: 1, date: 1 }, { unique: true });

export default mongoose.model<ICheckIn>('CheckIn', CheckInSchema);
