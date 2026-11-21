import mongoose, { Schema, type Model } from "mongoose";

export interface RateLimitRecord {
  _id: string;
  count: number;
  expiresAt: Date;
}

const rateLimitSchema = new Schema<RateLimitRecord>(
  {
    _id: { type: String, required: true },
    count: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit: Model<RateLimitRecord> =
  (mongoose.models.RateLimit as Model<RateLimitRecord> | undefined) ??
  mongoose.model<RateLimitRecord>("RateLimit", rateLimitSchema);
