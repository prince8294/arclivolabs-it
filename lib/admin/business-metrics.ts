import { connectToDatabase } from "@/lib/db/connect";
import { Deal, ClientProject } from "@/models/business";
import { Enquiry } from "@/models/enquiry";
import { Invoice, Payment, Expense } from "@/models/finance";

export interface BusinessMetrics {
  totalLeads: number;
  activeDeals: number;
  activeProjects: number;
  paymentsReceivedMinor: number;
  outstandingInvoiceMinor: number;
  recordedExpensesMinor: number;
  estimatedContributionMinor: number;
  netCashFlowMinor: number;
  monthlyCash: { month: string; inflowMinor: number; outflowMinor: number }[];
  leadDealTrend: { month: string; leads: number; dealsCreated: number; dealsWon: number }[];
}

export async function getBusinessMetrics(): Promise<BusinessMetrics> {
  await connectToDatabase();
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 5);
  sixMonthsAgo.setUTCDate(1);
  sixMonthsAgo.setUTCHours(0, 0, 0, 0);

  const [
    totalLeads,
    activeDeals,
    activeProjects,
    payments,
    refunds,
    invoices,
    paidExpenses,
    projects,
    projectCosts,
  ] = await Promise.all([
    Enquiry.countDocuments({}),
    Deal.countDocuments({ status: { $nin: ["Won", "Lost"] } }),
    ClientProject.countDocuments({ status: { $in: ["Not Started", "In Progress", "In Review", "On Hold"] } }),
    Payment.aggregate<{ total: number }>([
      { $match: { kind: "receipt" } },
      { $group: { _id: null, total: { $sum: "$amountMinor" } } },
    ]),
    Payment.aggregate<{ total: number }>([
      { $match: { kind: { $in: ["refund", "reversal"] } } },
      { $group: { _id: null, total: { $sum: "$amountMinor" } } },
    ]),
    Invoice.aggregate<{ outstanding: number }>([
      { $match: { status: { $ne: "Void" } } },
      { $group: { _id: null, outstanding: { $sum: { $subtract: ["$totalMinor", "$paidMinor"] } } } },
    ]),
    Expense.aggregate<{ total: number }>([
      { $match: { paymentStatus: "Paid" } },
      { $group: { _id: null, total: { $sum: "$amountMinor" } } },
    ]),
    ClientProject.find({}).select("_id agreedValueMinor").lean().exec(),
    Expense.aggregate<{ _id: string; total: number }>([
      { $match: { paymentStatus: { $ne: "Draft" } } },
      {
        $group: {
          _id: "$projectId",
          total: { $sum: "$amountMinor" },
        },
      },
    ]),
  ]);

  const paymentsReceivedMinor =
    (payments[0]?.total ?? 0) - (refunds[0]?.total ?? 0);
  const outstandingInvoiceMinor = invoices[0]?.outstanding ?? 0;
  const recordedExpensesMinor = paidExpenses[0]?.total ?? 0;
  const projectCostMap = new Map(
    projectCosts
      .filter((cost) => cost._id)
      .map((cost) => [cost._id.toString(), cost.total]),
  );
  const estimatedContributionMinor = projects.reduce(
    (total, project) =>
      total +
      Math.max(
        0,
        Number(project.agreedValueMinor) -
          (project._id ? projectCostMap.get(project._id.toString()) ?? 0 : 0),
      ),
    0,
  );
  const netCashFlowMinor = paymentsReceivedMinor - recordedExpensesMinor;

  const [paymentTrend, expenseTrend, leadTrend, dealTrend, wonDealTrend] = await Promise.all([
    Payment.aggregate<{ _id: string; receipts: number; adjustments: number }>([
      { $match: { paymentDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$paymentDate", timezone: "UTC" } },
          receipts: {
            $sum: { $cond: [{ $eq: ["$kind", "receipt"] }, "$amountMinor", 0] },
          },
          adjustments: {
            $sum: { $cond: [{ $in: ["$kind", ["refund", "reversal"]] }, "$amountMinor", 0] },
          },
        },
      },
    ]),
    Expense.aggregate<{ _id: string; total: number }>([
      { $match: { paymentStatus: "Paid", date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date", timezone: "UTC" } },
          total: { $sum: "$amountMinor" },
        },
      },
    ]),
    Enquiry.aggregate<{ _id: string; total: number }>([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } },
          total: { $sum: 1 },
        },
      },
    ]),
    Deal.aggregate<{ _id: string; total: number }>([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } },
          total: { $sum: 1 },
        },
      },
    ]),
    Deal.aggregate<{ _id: string; total: number }>([
      { $match: { wonAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$wonAt", timezone: "UTC" } },
          total: { $sum: 1 },
        },
      },
    ]),
  ]);

  const paymentMap = new Map(paymentTrend.map((item) => [item._id, item.receipts - item.adjustments]));
  const expenseMap = new Map(expenseTrend.map((item) => [item._id, item.total]));
  const leadMap = new Map(leadTrend.map((item) => [item._id, item.total]));
  const dealMap = new Map(dealTrend.map((item) => [item._id, item.total]));
  const wonMap = new Map(wonDealTrend.map((item) => [item._id, item.total]));
  const monthlyCash: BusinessMetrics["monthlyCash"] = [];
  const leadDealTrend: BusinessMetrics["leadDealTrend"] = [];

  for (let index = 0; index < 6; index += 1) {
    const date = new Date(sixMonthsAgo);
    date.setUTCMonth(sixMonthsAgo.getUTCMonth() + index);
    const month = date.toISOString().slice(0, 7);
    monthlyCash.push({
      month,
      inflowMinor: paymentMap.get(month) ?? 0,
      outflowMinor: expenseMap.get(month) ?? 0,
    });
    leadDealTrend.push({
      month,
      leads: leadMap.get(month) ?? 0,
      dealsCreated: dealMap.get(month) ?? 0,
      dealsWon: wonMap.get(month) ?? 0,
    });
  }

  return {
    totalLeads,
    activeDeals,
    activeProjects,
    paymentsReceivedMinor,
    outstandingInvoiceMinor,
    recordedExpensesMinor,
    estimatedContributionMinor,
    netCashFlowMinor,
    monthlyCash,
    leadDealTrend,
  };
}
