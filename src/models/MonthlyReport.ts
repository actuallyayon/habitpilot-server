import mongoose, { Schema, Document } from 'mongoose';

export interface IMonthlyReport extends Document {
  userId: mongoose.Types.ObjectId;
  month: string; // YYYY-MM
  bestHabits: string[];
  worstHabits: string[];
  patternsFound: string[];
  recommendation: string;
  generatedAt: Date;
}

const MonthlyReportSchema = new Schema<IMonthlyReport>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true },
  bestHabits: [{ type: String }],
  worstHabits: [{ type: String }],
  patternsFound: [{ type: String }],
  recommendation: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IMonthlyReport>('MonthlyReport', MonthlyReportSchema);
