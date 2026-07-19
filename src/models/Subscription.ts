import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  stripeSubscriptionId: string;
  status: string;
  currentPeriodEnd: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  stripeSubscriptionId: { type: String, required: true },
  status: { type: String, required: true },
  currentPeriodEnd: { type: Date, required: true },
});

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
