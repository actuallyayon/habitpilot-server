import mongoose, { Schema, Document } from 'mongoose';

export interface IHabitStat {
  habitName: string;
  consistencyPct: number;
}

export interface IProposedChange {
  habitName: string;
  action: 'swap_trigger' | 'shrink_scope' | 'replace' | 'promote' | 'keep';
  newValue: string;
  reason: string;
}

export interface IWeeklyReplan extends Document {
  planId: mongoose.Types.ObjectId;
  weekStart: string; // YYYY-MM-DD
  statsPerHabit: IHabitStat[];
  agentReasoning: string;
  proposedChanges: IProposedChange[];
  userApproved: boolean;
  createdAt: Date;
}

const HabitStatSchema = new Schema<IHabitStat>({
  habitName: { type: String, required: true },
  consistencyPct: { type: Number, required: true },
});

const ProposedChangeSchema = new Schema<IProposedChange>({
  habitName: { type: String, required: true },
  action: { type: String, enum: ['swap_trigger', 'shrink_scope', 'replace', 'promote', 'keep'], required: true },
  newValue: { type: String, required: true },
  reason: { type: String, required: true },
});

const WeeklyReplanSchema = new Schema<IWeeklyReplan>({
  planId: { type: Schema.Types.ObjectId, ref: 'HabitPlan', required: true },
  weekStart: { type: String, required: true },
  statsPerHabit: [HabitStatSchema],
  agentReasoning: { type: String, required: true },
  proposedChanges: [ProposedChangeSchema],
  userApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IWeeklyReplan>('WeeklyReplan', WeeklyReplanSchema);
