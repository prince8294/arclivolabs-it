import type { BudgetOption, ServiceOption } from "@/lib/service-options";
import type { EnquiryStatus } from "@/lib/validations/enquiry";

export interface EnquirySummary {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  projectType: ServiceOption;
  estimatedBudget?: BudgetOption;
  status: EnquiryStatus;
  source: string;
  followUpDate?: string | null;
  whatsappConsent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryDetails extends EnquirySummary {
  projectDescription: string;
  adminNotes: string;
  whatsappConsentAt?: string | null;
}

export interface PaginatedEnquiries {
  items: EnquirySummary[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

export interface DashboardData {
  total: number;
  newCount: number;
  qualified: number;
  converted: number;
  recent: EnquirySummary[];
  trend: { date: string; count: number }[];
  rangeDays: 7 | 30;
}
