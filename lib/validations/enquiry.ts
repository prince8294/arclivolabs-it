import { z } from "zod";
import { BUDGET_OPTIONS, SERVICE_OPTIONS } from "@/lib/service-options";

const optionalPhone = z
  .string()
  .trim()
  .max(30, "Enter a shorter phone number.")
  .optional()
  .or(z.literal(""))
  .transform((value) => value || undefined)
  .pipe(
    z
      .string()
      .regex(
        /^\+[1-9][0-9\s().-]{5,23}$/,
        "Include the country calling code, for example +91.",
      )
      .optional(),
  );

export const enquirySchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter your full name.")
      .max(100, "Use 100 characters or fewer."),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .max(254, "Enter a shorter email address.")
      .transform((value) => value.toLowerCase()),
    phone: optionalPhone,
    companyName: z
      .string()
      .trim()
      .max(120, "Use 120 characters or fewer.")
      .optional()
      .or(z.literal(""))
      .transform((value) => value || undefined),
    projectType: z.enum(SERVICE_OPTIONS),
    estimatedBudget: z
      .enum(BUDGET_OPTIONS)
      .optional()
      .or(z.literal(""))
      .transform((value) => value || undefined),
    projectDescription: z
      .string()
      .trim()
      .min(20, "Tell us a little more about the project (at least 20 characters).")
      .max(5000, "Use 5,000 characters or fewer."),
    whatsappConsent: z.boolean().optional().default(false),
    website: z.string().max(200).optional(),
  })
  .strict();

export type EnquiryInput = z.infer<typeof enquirySchema>;

export const enquiryStatusValues = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Converted",
  "Lost",
  "Closed / Not Interested",
] as const;

export type EnquiryStatus = (typeof enquiryStatusValues)[number];

export const updateEnquirySchema = z
  .object({
    status: z.enum(enquiryStatusValues).optional(),
    adminNotes: z.string().trim().max(5000, "Use 5,000 characters or fewer.").optional(),
  })
  .strict()
  .refine(
    (value) => value.status !== undefined || value.adminNotes !== undefined,
    "Provide a status or notes update.",
  );

export const adminLoginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(256),
});
