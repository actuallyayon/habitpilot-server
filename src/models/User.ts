import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  avatarUrl?: string;
  plan: 'free' | 'pro';
  stripeCustomerId?: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, default: null },
  googleId: { type: String, default: null },
  avatarUrl: { type: String },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  stripeCustomerId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('User', UserSchema);
