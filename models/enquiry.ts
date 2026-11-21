import mongoose, { Schema, type Model } from "mongoose";
import {
  enquiryStatusValues,
  type EnquiryStatus,
} from "@/lib/validations/enquiry";
import {
  BUDGET_OPTIONS,
  SERVICE_OPTIONS,
  type BudgetOption,
  type ServiceOption,
} from "@/lib/service-options";
import { LEAD_SOURCES } from "@/lib/validations/business";

export interface EnquiryRecord {
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  projectType: ServiceOption;
  estimatedBudget?: BudgetOption;
  projectDescription: string;
  status: EnquiryStatus;
  adminNotes: string;
  whatsappConsent: boolean;
  whatsappConsentAt?: Date | null;
  source: (typeof LEAD_SOURCES)[number];
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const enquirySchema = new Schema<EnquiryRecord>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 30 },
    companyName: { type: String, trim: true, maxlength: 120 },
    projectType: { type: String, required: true, enum: SERVICE_OPTIONS },
    estimatedBudget: { type: String, enum: BUDGET_OPTIONS },
    projectDescription: { type: String, required: true, trim: true, maxlength: 5000 },
    status: { type: String, required: true, enum: enquiryStatusValues, default: "New" },
    adminNotes: { type: String, default: "", maxlength: 5000 },
    whatsappConsent: { type: Boolean, required: true, default: false },
    whatsappConsentAt: { type: Date, default: null },
    source: {
      type: String,
      required: true,
      enum: LEAD_SOURCES,
      default: "Website Contact Form",
    },
    followUpDate: Date,
  },
  { timestamps: true, versionKey: false },
);

enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ email: 1 });

export const Enquiry: Model<EnquiryRecord> =
  (mongoose.models.Enquiry as Model<EnquiryRecord> | undefined) ??
  mongoose.model<EnquiryRecord>("Enquiry", enquirySchema);
