import { Types, type FilterQuery } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Enquiry } from "@/models/enquiry";
import type { EnquiryRecord } from "@/models/enquiry";
import {
  enquiryStatusValues,
  type EnquiryStatus,
} from "@/lib/validations/enquiry";
import {
  SERVICE_OPTIONS,
  type ServiceOption,
} from "@/lib/service-options";
import type {
  EnquiryDetails,
  EnquirySummary,
  PaginatedEnquiries,
} from "@/types/admin";

export interface EnquiryFilters {
  query?: string;
  status?: EnquiryStatus;
  projectType?: ServiceOption;
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
}

function toSummary(
  enquiry: EnquiryRecord & { _id: Types.ObjectId },
): EnquirySummary {
  return {
    id: enquiry._id.toString(),
    fullName: enquiry.fullName,
    email: enquiry.email,
    phone: enquiry.phone,
    companyName: enquiry.companyName,
    projectType: enquiry.projectType,
    estimatedBudget: enquiry.estimatedBudget,
    status: enquiry.status,
    source: enquiry.source,
    followUpDate: enquiry.followUpDate?.toISOString() ?? null,
    whatsappConsent: enquiry.whatsappConsent,
    createdAt: enquiry.createdAt.toISOString(),
    updatedAt: enquiry.updatedAt.toISOString(),
  };
}

export function toEnquiryDetails(
  enquiry: EnquiryRecord & { _id: Types.ObjectId },
): EnquiryDetails {
  return {
    ...toSummary(enquiry),
    projectDescription: enquiry.projectDescription,
    adminNotes: enquiry.adminNotes,
    whatsappConsentAt: enquiry.whatsappConsentAt?.toISOString() ?? null,
  };
}

export async function listEnquiries(
  filters: EnquiryFilters = {},
): Promise<PaginatedEnquiries> {
  await connectToDatabase();

  const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 50);
  const page = Math.max(filters.page ?? 1, 1);
  const query = filters.query?.trim().slice(0, 80);
  const conditions: FilterQuery<EnquiryRecord>[] = [];

  if (filters.status && enquiryStatusValues.includes(filters.status)) {
    conditions.push({ status: filters.status });
  }
  if (filters.projectType && SERVICE_OPTIONS.includes(filters.projectType)) {
    conditions.push({ projectType: filters.projectType });
  }
  if (query) {
    const safePattern = new RegExp(
      query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    conditions.push({
      $or: [
        { fullName: safePattern },
        { email: safePattern },
        { companyName: safePattern },
      ],
    });
  }

  const filter: FilterQuery<EnquiryRecord> =
    conditions.length === 0 ? {} : { $and: conditions };
  const skip = Math.min((page - 1) * pageSize, 1_000_000);
  const sort: Record<string, 1 | -1> = {
    createdAt: filters.sort === "oldest" ? 1 : -1,
  };

  const [total, records] = await Promise.all([
    Enquiry.countDocuments(filter),
    Enquiry.find(filter)
      .select(
        "fullName email phone companyName projectType estimatedBudget status source followUpDate whatsappConsent createdAt updatedAt",
      )
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec(),
  ]);

  return {
    items: records.map((record) =>
      toSummary(record as EnquiryRecord & { _id: Types.ObjectId }),
    ),
    page,
    pageSize,
    total,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getEnquiryDetails(
  id: string,
): Promise<EnquiryDetails | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const record = await Enquiry.findById(id).lean().exec();
  if (!record) return null;

  return toEnquiryDetails(record as EnquiryRecord & { _id: Types.ObjectId });
}

export function isEnquiryStatus(value: string): value is EnquiryStatus {
  return enquiryStatusValues.includes(value as EnquiryStatus);
}

export function isServiceOption(value: string): value is ServiceOption {
  return SERVICE_OPTIONS.includes(value as ServiceOption);
}
