import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface InvoiceLineItem {
  title: string;
  quantity: number;
  unitAmountMinor: number;
}

export interface InvoiceRecord {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  clientName: string;
  clientEmail: string;
  billingAddress: string;
  clientTaxDetails: string;
  projectId?: Types.ObjectId;
  projectName?: string;
  lineItems: InvoiceLineItem[];
  subtotalMinor: number;
  discountMinor: number;
  taxRateBps: number;
  taxMinor: number;
  totalMinor: number;
  paidMinor: number;
  status: "Draft" | "Issued" | "Partially Paid" | "Paid" | "Overdue" | "Void";
  paymentInstructions: string;
  internalNotes: string;
  issuedAt?: Date;
  voidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceLineSchema = new Schema<InvoiceLineItem>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    quantity: { type: Number, required: true, min: 1, max: 10000, validate: Number.isSafeInteger },
    unitAmountMinor: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
  },
  { _id: false },
);

const invoiceSchema = new Schema<InvoiceRecord>(
  {
    invoiceNumber: { type: String, required: true, unique: true, immutable: true },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    clientName: { type: String, required: true, trim: true, maxlength: 160 },
    clientEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },
    billingAddress: { type: String, trim: true, maxlength: 1000, default: "" },
    clientTaxDetails: { type: String, trim: true, maxlength: 80, default: "" },
    projectId: { type: Schema.Types.ObjectId, ref: "ClientProject", index: true },
    projectName: { type: String, trim: true, maxlength: 160 },
    lineItems: {
      type: [invoiceLineSchema],
      required: true,
      validate: (items: InvoiceLineItem[]) => items.length > 0 && items.length <= 30,
    },
    subtotalMinor: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
    discountMinor: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
    taxRateBps: { type: Number, required: true, min: 0, max: 10000, validate: Number.isSafeInteger },
    taxMinor: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
    totalMinor: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
    paidMinor: { type: Number, required: true, min: 0, default: 0, validate: Number.isSafeInteger },
    status: {
      type: String,
      required: true,
      enum: ["Draft", "Issued", "Partially Paid", "Paid", "Overdue", "Void"],
      default: "Draft",
    },
    paymentInstructions: { type: String, trim: true, maxlength: 2000, default: "" },
    internalNotes: { type: String, trim: true, maxlength: 5000, default: "" },
    issuedAt: Date,
    voidedAt: Date,
  },
  { timestamps: true, versionKey: false },
);
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ createdAt: -1 });

export const Invoice: Model<InvoiceRecord> =
  (mongoose.models.Invoice as Model<InvoiceRecord> | undefined) ??
  mongoose.model<InvoiceRecord>("Invoice", invoiceSchema);

export interface PaymentRecord {
  invoiceId: Types.ObjectId;
  projectId?: Types.ObjectId;
  kind: "receipt" | "refund" | "reversal";
  amountMinor: number;
  paymentDate: Date;
  paymentMethod: "UPI" | "Bank Transfer" | "Payment Gateway" | "Cash" | "Other";
  transactionReference: string;
  notes: string;
  originalPaymentId?: Types.ObjectId;
  idempotencyKey: string;
  createdAt: Date;
}

const paymentSchema = new Schema<PaymentRecord>(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "ClientProject", index: true },
    kind: { type: String, required: true, enum: ["receipt", "refund", "reversal"] },
    amountMinor: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
    paymentDate: { type: Date, required: true },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["UPI", "Bank Transfer", "Payment Gateway", "Cash", "Other"],
    },
    transactionReference: { type: String, trim: true, maxlength: 160, default: "" },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    originalPaymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
    idempotencyKey: { type: String, required: true, unique: true, maxlength: 100 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false, collection: "payments" },
);
paymentSchema.index({ invoiceId: 1, paymentDate: -1 });

export const Payment: Model<PaymentRecord> =
  (mongoose.models.Payment as Model<PaymentRecord> | undefined) ??
  mongoose.model<PaymentRecord>("Payment", paymentSchema);

export interface ExpenseRecord {
  title: string;
  category:
    | "Developer Payments"
    | "Designer Payments"
    | "Hosting"
    | "Domain"
    | "Software Subscriptions"
    | "Marketing"
    | "Office / Operations"
    | "Freelancer Payments"
    | "Other";
  amountMinor: number;
  date: Date;
  paymentStatus: "Draft" | "Unpaid" | "Paid";
  paymentMethod: "UPI" | "Bank Transfer" | "Payment Gateway" | "Cash" | "Other";
  projectId?: Types.ObjectId;
  notes: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<ExpenseRecord>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    category: {
      type: String,
      required: true,
      enum: [
        "Developer Payments",
        "Designer Payments",
        "Hosting",
        "Domain",
        "Software Subscriptions",
        "Marketing",
        "Office / Operations",
        "Freelancer Payments",
        "Other",
      ],
    },
    amountMinor: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
    date: { type: Date, required: true },
    paymentStatus: { type: String, enum: ["Draft", "Unpaid", "Paid"], default: "Unpaid" },
    paymentMethod: {
      type: String,
      enum: ["UPI", "Bank Transfer", "Payment Gateway", "Cash", "Other"],
      default: "Other",
    },
    projectId: { type: Schema.Types.ObjectId, ref: "ClientProject", index: true },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    paidAt: Date,
  },
  { timestamps: true, versionKey: false, collection: "expenses" },
);
expenseSchema.index({ date: -1, category: 1 });
expenseSchema.index({ paymentStatus: 1, date: -1 });

export const Expense: Model<ExpenseRecord> =
  (mongoose.models.Expense as Model<ExpenseRecord> | undefined) ??
  mongoose.model<ExpenseRecord>("Expense", expenseSchema);
