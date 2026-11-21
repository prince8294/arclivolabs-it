import mongoose, { Schema, type Model } from "mongoose";

export interface AdminRecord {
  email: string;
  passwordHash: string;
  accountSlot: "primary";
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<AdminRecord>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    accountSlot: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      enum: ["primary"],
      default: "primary",
    },
  },
  { timestamps: true, versionKey: false },
);

export const Admin: Model<AdminRecord> =
  (mongoose.models.Admin as Model<AdminRecord> | undefined) ??
  mongoose.model<AdminRecord>("Admin", adminSchema);
