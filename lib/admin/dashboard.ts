import { connectToDatabase } from "@/lib/db/connect";
import { Enquiry } from "@/models/enquiry";
import type { EnquiryRecord } from "@/models/enquiry";
import type { DashboardData, EnquirySummary } from "@/types/admin";
import { Types } from "mongoose";

interface DashboardFacet {
  counts: {
    total: number;
    newCount: number;
    qualified: number;
    converted: number;
  }[];
  recent: (EnquiryRecord & { _id: Types.ObjectId })[];
  trend: { _id: string; count: number }[];
}

function summary(record: EnquiryRecord & { _id: Types.ObjectId }): EnquirySummary {
  return {
    id: record._id.toString(),
    fullName: record.fullName,
    email: record.email,
    phone: record.phone,
    companyName: record.companyName,
    projectType: record.projectType,
    estimatedBudget: record.estimatedBudget,
    status: record.status,
    source: record.source,
    followUpDate: record.followUpDate?.toISOString() ?? null,
    whatsappConsent: record.whatsappConsent,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getDashboardData(
  rangeDays: 7 | 30 = 7,
): Promise<DashboardData> {
  await connectToDatabase();
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = new Date(today - (rangeDays - 1) * 24 * 60 * 60 * 1000);

  const [facet] = await Enquiry.aggregate<DashboardFacet>([
    {
      $facet: {
        counts: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              newCount: { $sum: { $cond: [{ $eq: ["$status", "New"] }, 1, 0] } },
              qualified: {
                $sum: { $cond: [{ $eq: ["$status", "Qualified"] }, 1, 0] },
              },
              converted: {
                $sum: { $cond: [{ $eq: ["$status", "Converted"] }, 1, 0] },
              },
            },
          },
          { $project: { _id: 0, total: 1, newCount: 1, qualified: 1, converted: 1 } },
        ],
        recent: [
          { $sort: { createdAt: -1 } },
          { $limit: 6 },
          {
            $project: {
              fullName: 1,
              email: 1,
              phone: 1,
              companyName: 1,
              projectType: 1,
              estimatedBudget: 1,
              status: 1,
              whatsappConsent: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        trend: [
          { $match: { createdAt: { $gte: start } } },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                  timezone: "UTC",
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ]).exec();

  const counts = facet?.counts[0];
  const byDate = new Map((facet?.trend ?? []).map((item) => [item._id, item.count]));
  const trend = Array.from({ length: rangeDays }, (_, index) => {
    const date = new Date(start.getTime() + index * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    return { date, count: byDate.get(date) ?? 0 };
  });

  return {
    total: counts?.total ?? 0,
    newCount: counts?.newCount ?? 0,
    qualified: counts?.qualified ?? 0,
    converted: counts?.converted ?? 0,
    recent: (facet?.recent ?? []).map((record) =>
      summary(record as EnquiryRecord & { _id: Types.ObjectId }),
    ),
    trend,
    rangeDays,
  };
}
