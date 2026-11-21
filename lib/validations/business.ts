import { z } from "zod";
import { BUDGET_OPTIONS, SERVICE_OPTIONS } from "@/lib/service-options";

export const SERVICE_IDS = [
  "website-development",
  "custom-software",
  "crm-dashboard",
  "ui-ux-design",
  "mobile-app",
  "shopify-development",
  "website-templates",
  "graphic-brand-design",
  "automation-api",
] as const;

export const DEAL_STATUSES = [
  "New",
  "Discussion",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
] as const;

export const PROJECT_STATUSES = [
  "Not Started",
  "In Progress",
  "In Review",
  "Completed",
  "On Hold",
  "Cancelled",
] as const;

export const PORTFOLIO_TYPES = [
  "Client Project",
  "In-house Project",
  "Concept Project",
] as const;

export const PAYMENT_METHODS = [
  "UPI",
  "Bank Transfer",
  "Payment Gateway",
  "Cash",
  "Other",
] as const;

export const EXPENSE_CATEGORIES = [
  "Developer Payments",
  "Designer Payments",
  "Hosting",
  "Domain",
  "Software Subscriptions",
  "Marketing",
  "Office / Operations",
  "Freelancer Payments",
  "Other",
] as const;

export const LEAD_SOURCES = [
  "Website Contact Form",
  "WhatsApp",
  "LinkedIn",
  "Google Maps Research",
  "Referral",
  "Instagram",
  "Email",
  "Other",
] as const;

const safeId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid record ID.");
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");
const moneyMinor = z.number().int().safe().min(0).max(100_000_000_000);
const serviceId = z.enum(SERVICE_IDS);
const safeImageUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) =>
      value === "" ||
      /^\/api\/public\/media\/[a-f\d]{24}$/i.test(value) ||
      /^https:\/\//i.test(value),
    "Use an HTTPS image URL or an uploaded ArclivoLabs image.",
  );

export const dealInputSchema = z
  .object({
    leadId: safeId.optional().or(z.literal("")),
    clientName: z.string().trim().min(2).max(100),
    businessName: z.string().trim().max(120).optional().default(""),
    email: z.string().trim().email().max(254).optional().or(z.literal("")),
    phone: z.string().trim().max(30).optional().default(""),
    title: z.string().trim().min(2).max(160),
    serviceId,
    amountMinor: moneyMinor,
    expectedCloseDate: dateOnly.optional().or(z.literal("")),
    status: z.enum(DEAL_STATUSES),
    requirements: z.string().trim().max(5000).default(""),
    internalNotes: z.string().trim().max(5000).default(""),
  })
  .strict();

export const projectInputSchema = z
  .object({
    dealId: safeId.optional().or(z.literal("")),
    leadId: safeId.optional().or(z.literal("")),
    name: z.string().trim().min(2).max(160),
    clientName: z.string().trim().min(2).max(100),
    businessName: z.string().trim().max(120).default(""),
    email: z.string().trim().email().max(254).optional().or(z.literal("")),
    phone: z
      .string()
      .trim()
      .max(30)
      .default("")
      .refine((value) => !value || /^\+[1-9][0-9\s().-]{5,23}$/.test(value), {
        message: "Include the country calling code.",
      }),
    serviceId,
    agreedValueMinor: moneyMinor,
    startDate: dateOnly.optional().or(z.literal("")),
    deadline: dateOnly.optional().or(z.literal("")),
    status: z.enum(PROJECT_STATUSES),
    progress: z.number().int().min(0).max(100),
    assignedTo: z.string().trim().max(100).default(""),
    description: z.string().trim().max(5000).default(""),
    internalNotes: z.string().trim().max(5000).default(""),
  })
  .strict();

export const projectTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    assignedTo: z.string().trim().max(100).default(""),
    dueDate: dateOnly.optional().or(z.literal("")),
  })
  .strict();

export const invoiceInputSchema = z
  .object({
    issueDate: dateOnly,
    dueDate: dateOnly,
    clientName: z.string().trim().min(2).max(160),
    clientEmail: z.string().trim().email().max(254).optional().or(z.literal("")),
    billingAddress: z.string().trim().max(1000).default(""),
    clientTaxDetails: z.string().trim().max(80).default(""),
    projectId: safeId.optional().or(z.literal("")),
    lineItems: z
      .array(
        z.object({
          title: z.string().trim().min(1).max(160),
          quantity: z.number().int().min(1).max(10000),
          unitAmountMinor: moneyMinor,
        }).strict(),
      )
      .min(1)
      .max(30),
    discountMinor: moneyMinor,
    taxRateBps: z.number().int().min(0).max(10000),
    paymentInstructions: z.string().trim().max(2000).default(""),
    internalNotes: z.string().trim().max(5000).default(""),
  })
  .strict()
  .refine((value) => value.dueDate >= value.issueDate, {
    path: ["dueDate"],
    message: "Due date must be on or after the issue date.",
  });

export const paymentInputSchema = z
  .object({
    kind: z.enum(["receipt", "refund", "reversal"]),
    amountMinor: moneyMinor.min(1),
    paymentDate: dateOnly,
    paymentMethod: z.enum(PAYMENT_METHODS),
    transactionReference: z.string().trim().max(160).default(""),
    notes: z.string().trim().max(2000).default(""),
    originalPaymentId: safeId.optional(),
    idempotencyKey: z.string().uuid(),
  })
  .strict();

export const expenseInputSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    category: z.enum(EXPENSE_CATEGORIES),
    amountMinor: moneyMinor.min(1),
    date: dateOnly,
    paymentStatus: z.enum(["Draft", "Unpaid", "Paid"]),
    paymentMethod: z.enum(PAYMENT_METHODS),
    projectId: safeId.optional().or(z.literal("")),
    notes: z.string().trim().max(2000).default(""),
  })
  .strict();

export const portfolioInputSchema = z
  .object({
    title: z.string().trim().min(2).max(120),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
    category: z.string().trim().min(2).max(80),
    shortDescription: z.string().trim().min(10).max(500),
    description: z.string().trim().min(10).max(5000),
    coverImageUrl: safeImageUrl.default(""),
    galleryImageUrls: z.array(safeImageUrl).max(12).default([]),
    technologyStack: z.array(z.string().trim().min(1).max(60)).max(15).default([]),
    completionYear: z.number().int().min(1990).max(2100).optional(),
    projectType: z.enum(PORTFOLIO_TYPES),
    liveUrl: z
      .string()
      .url()
      .max(2048)
      .refine((value) => /^https?:\/\//i.test(value), "Use an HTTP or HTTPS website URL.")
      .optional()
      .or(z.literal("")),
    featured: z.boolean().default(false),
    published: z.boolean().default(false),
    sortOrder: z.number().int().min(0).max(10000).default(0),
    visual: z.enum(["commerce", "workspace", "mobile"]).default("commerce"),
  })
  .strict();

export const serviceInputSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    shortDescription: z.string().trim().max(240).default(""),
    description: z.string().trim().min(10).max(1500),
    iconId: z.enum([
      "app-window",
      "code",
      "dashboard",
      "palette",
      "smartphone",
      "shop",
      "blocks",
      "brush",
      "bot",
    ]),
    displayOrder: z.number().int().min(0).max(100),
    visible: z.boolean(),
  })
  .strict();

export const businessSettingsSchema = z
  .object({
    legalName: z.string().trim().min(2).max(160),
    logoUrl: z.string().trim().max(2048).default(""),
    address: z.string().trim().max(1000).default(""),
    phone: z.string().trim().max(30).default(""),
    email: z.string().trim().email().max(254).or(z.literal("")),
    gstin: z.string().trim().toUpperCase().max(15).default(""),
    gstRegistered: z.boolean(),
    invoicePrefix: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,12}$/),
    paymentInstructions: z.string().trim().max(2000).default(""),
  })
  .strict()
  .refine((value) => !value.gstRegistered || value.gstin.length === 15, {
    path: ["gstin"],
    message: "Enter a 15-character GSTIN when GST registration is enabled.",
  });

export const leadInputSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    phone: z
      .string()
      .trim()
      .max(30)
      .default("")
      .refine((value) => !value || /^\+[1-9][0-9\s().-]{5,23}$/.test(value), {
        message: "Include the country calling code.",
      }),
    companyName: z.string().trim().max(120).default(""),
    projectType: z.enum(SERVICE_OPTIONS),
    estimatedBudget: z.enum(BUDGET_OPTIONS).optional().or(z.literal("")).default(""),
    projectDescription: z.string().trim().min(10).max(5000),
    status: z.enum(["New", "Contacted", "Qualified", "Proposal Sent", "Converted", "Lost"]),
    source: z.enum(LEAD_SOURCES),
    adminNotes: z.string().trim().max(5000).default(""),
    followUpDate: dateOnly.optional().or(z.literal("")),
  })
  .strict();

export const leadCreateSchema = leadInputSchema
  .extend({ allowDuplicate: z.boolean().default(false) })
  .strict();

export const leadUpdateSchema = leadInputSchema
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

export type DealInput = z.infer<typeof dealInputSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
export type InvoiceInput = z.infer<typeof invoiceInputSchema>;
export type PaymentInput = z.infer<typeof paymentInputSchema>;
export type ExpenseInput = z.infer<typeof expenseInputSchema>;
