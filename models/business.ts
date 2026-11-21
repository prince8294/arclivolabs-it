import mongoose, { Schema, type Model, type Types } from "mongoose";
import {
  DEAL_STATUSES,
  PROJECT_STATUSES,
  PORTFOLIO_TYPES,
  SERVICE_IDS,
} from "@/lib/validations/business";

export interface DealRecord {
  leadId?: Types.ObjectId;
  clientName: string;
  businessName?: string;
  email?: string;
  phone?: string;
  title: string;
  serviceId: string;
  serviceName: string;
  amountMinor: number;
  expectedCloseDate?: Date;
  status: (typeof DEAL_STATUSES)[number];
  requirements: string;
  internalNotes: string;
  wonAt?: Date;
  lostAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const dealSchema = new Schema<DealRecord>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Enquiry", index: true },
    clientName: { type: String, required: true, trim: true, maxlength: 100 },
    businessName: { type: String, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 30 },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    serviceId: { type: String, required: true, enum: SERVICE_IDS },
    serviceName: { type: String, required: true, trim: true, maxlength: 120 },
    amountMinor: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
    expectedCloseDate: Date,
    status: { type: String, required: true, enum: DEAL_STATUSES, default: "New" },
    requirements: { type: String, trim: true, maxlength: 5000, default: "" },
    internalNotes: { type: String, trim: true, maxlength: 5000, default: "" },
    wonAt: Date,
    lostAt: Date,
  },
  { timestamps: true, versionKey: false },
);
dealSchema.index({ status: 1, createdAt: -1 });
dealSchema.index({ email: 1 });

export const Deal: Model<DealRecord> =
  (mongoose.models.Deal as Model<DealRecord> | undefined) ??
  mongoose.model<DealRecord>("Deal", dealSchema);

export interface ProjectTask {
  _id?: Types.ObjectId;
  title: string;
  assignedTo?: string;
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface ClientProjectRecord {
  dealId?: Types.ObjectId;
  leadId?: Types.ObjectId;
  name: string;
  clientName: string;
  businessName?: string;
  email?: string;
  phone?: string;
  serviceId: string;
  serviceName: string;
  agreedValueMinor: number;
  startDate?: Date;
  deadline?: Date;
  status: (typeof PROJECT_STATUSES)[number];
  progress: number;
  assignedTo?: string;
  description: string;
  internalNotes: string;
  tasks: ProjectTask[];
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ProjectTask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    assignedTo: { type: String, trim: true, maxlength: 100 },
    dueDate: Date,
    completed: { type: Boolean, default: false },
    completedAt: Date,
  },
  { _id: true },
);

const clientProjectSchema = new Schema<ClientProjectRecord>(
  {
    dealId: {
      type: Schema.Types.ObjectId,
      ref: "Deal",
      unique: true,
      sparse: true,
    },
    leadId: { type: Schema.Types.ObjectId, ref: "Enquiry", index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    clientName: { type: String, required: true, trim: true, maxlength: 100 },
    businessName: { type: String, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 30 },
    serviceId: { type: String, required: true, enum: SERVICE_IDS },
    serviceName: { type: String, required: true, trim: true, maxlength: 120 },
    agreedValueMinor: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
    startDate: Date,
    deadline: Date,
    status: {
      type: String,
      required: true,
      enum: PROJECT_STATUSES,
      default: "Not Started",
    },
    progress: { type: Number, required: true, min: 0, max: 100, default: 0 },
    assignedTo: { type: String, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 5000, default: "" },
    internalNotes: { type: String, trim: true, maxlength: 5000, default: "" },
    tasks: { type: [taskSchema], default: [] },
  },
  { timestamps: true, versionKey: false },
);
clientProjectSchema.index({ status: 1, deadline: 1 });

export const ClientProject: Model<ClientProjectRecord> =
  (mongoose.models.ClientProject as Model<ClientProjectRecord> | undefined) ??
  mongoose.model<ClientProjectRecord>("ClientProject", clientProjectSchema);

export interface PortfolioProjectRecord {
  title: string;
  slug: string;
  category: string;
  shortDescription: string;
  description: string;
  coverImageUrl: string;
  galleryImageUrls: string[];
  technologyStack: string[];
  completionYear?: number;
  projectType: (typeof PORTFOLIO_TYPES)[number];
  liveUrl?: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  visual: "commerce" | "workspace" | "mobile";
  createdAt: Date;
  updatedAt: Date;
}

const portfolioSchema = new Schema<PortfolioProjectRecord>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      unique: true,
    },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    shortDescription: { type: String, required: true, trim: true, maxlength: 500 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    coverImageUrl: { type: String, trim: true, maxlength: 2048, default: "" },
    galleryImageUrls: {
      type: [{ type: String, trim: true, maxlength: 2048 }],
      default: [],
      validate: (items: string[]) => items.length <= 12,
    },
    technologyStack: {
      type: [{ type: String, trim: true, maxlength: 60 }],
      default: [],
      validate: (items: string[]) => items.length <= 15,
    },
    completionYear: { type: Number, min: 1990, max: 2100 },
    projectType: { type: String, enum: PORTFOLIO_TYPES, required: true },
    liveUrl: { type: String, trim: true, maxlength: 2048 },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0, min: 0, max: 10000 },
    visual: {
      type: String,
      enum: ["commerce", "workspace", "mobile"],
      default: "commerce",
    },
  },
  { timestamps: true, versionKey: false },
);
portfolioSchema.index({ published: 1, featured: -1, sortOrder: 1 });

export const PortfolioProject: Model<PortfolioProjectRecord> =
  (mongoose.models.PortfolioProject as Model<PortfolioProjectRecord> | undefined) ??
  mongoose.model<PortfolioProjectRecord>("PortfolioProject", portfolioSchema);

export interface ManagedServiceRecord {
  _id: string;
  name: string;
  shortDescription: string;
  description: string;
  iconId: string;
  displayOrder: number;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const managedServiceSchema = new Schema<ManagedServiceRecord>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    shortDescription: { type: String, trim: true, maxlength: 240, default: "" },
    description: { type: String, required: true, trim: true, maxlength: 1500 },
    iconId: {
      type: String,
      required: true,
      enum: ["app-window", "code", "dashboard", "palette", "smartphone", "shop", "blocks", "brush", "bot"],
    },
    displayOrder: { type: Number, required: true, min: 0, max: 100 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false, collection: "services" },
);

export const ManagedService: Model<ManagedServiceRecord> =
  (mongoose.models.ManagedService as Model<ManagedServiceRecord> | undefined) ??
  mongoose.model<ManagedServiceRecord>("ManagedService", managedServiceSchema);

export interface CounterRecord {
  _id: string;
  value: number;
}

const counterSchema = new Schema<CounterRecord>(
  { _id: { type: String, required: true }, value: { type: Number, default: 0 } },
  { versionKey: false, collection: "counters" },
);

export const Counter: Model<CounterRecord> =
  (mongoose.models.Counter as Model<CounterRecord> | undefined) ??
  mongoose.model<CounterRecord>("Counter", counterSchema);

export interface AuditLogRecord {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  changes?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<AuditLogRecord>(
  {
    actorId: { type: String, required: true },
    action: { type: String, required: true, maxlength: 80 },
    entityType: { type: String, required: true, maxlength: 80 },
    entityId: { type: String, required: true, maxlength: 80 },
    summary: { type: String, required: true, maxlength: 300 },
    changes: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false, collection: "auditlogs" },
);
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog: Model<AuditLogRecord> =
  (mongoose.models.AuditLog as Model<AuditLogRecord> | undefined) ??
  mongoose.model<AuditLogRecord>("AuditLog", auditLogSchema);

export interface BusinessSettingsRecord {
  _id: "primary";
  legalName: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  gstRegistered: boolean;
  invoicePrefix: string;
  paymentInstructions: string;
  currency: "INR";
  updatedAt: Date;
}

const businessSettingsSchema = new Schema<BusinessSettingsRecord>(
  {
    _id: { type: String, enum: ["primary"], default: "primary" },
    legalName: { type: String, trim: true, maxlength: 160, default: "ArclivoLabs Tech" },
    logoUrl: { type: String, trim: true, maxlength: 2048, default: "" },
    address: { type: String, trim: true, maxlength: 1000, default: "" },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    email: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },
    gstin: { type: String, trim: true, uppercase: true, maxlength: 15, default: "" },
    gstRegistered: { type: Boolean, default: false },
    invoicePrefix: { type: String, trim: true, uppercase: true, maxlength: 12, default: "ATL" },
    paymentInstructions: { type: String, trim: true, maxlength: 2000, default: "" },
    currency: { type: String, enum: ["INR"], default: "INR" },
  },
  { timestamps: { createdAt: false, updatedAt: true }, versionKey: false, collection: "businesssettings" },
);

export const BusinessSettings: Model<BusinessSettingsRecord> =
  (mongoose.models.BusinessSettings as Model<BusinessSettingsRecord> | undefined) ??
  mongoose.model<BusinessSettingsRecord>("BusinessSettings", businessSettingsSchema);
