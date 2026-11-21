import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import {
  badInput,
  getAdminId,
  PRIVATE_HEADERS,
  readJsonBody,
  rejectOrigin,
  rejectUnauthorized,
  writeAuditLog,
} from "@/lib/admin/api";
import { connectToDatabase } from "@/lib/db/connect";
import { expenseInputSchema } from "@/lib/validations/business";
import { ClientProject } from "@/models/business";
import { Expense } from "@/models/finance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(record: Record<string, unknown> & { _id: Types.ObjectId }) {
  return {
    ...record,
    _id: record._id.toString(),
    projectId: record.projectId ? String(record.projectId) : "",
  };
}

export async function GET(request: NextRequest) {
  if (!(await getAdminId())) return rejectUnauthorized();
  const params = request.nextUrl.searchParams;
  const filter: Record<string, unknown> = {};
  const category = params.get("category");
  if (category) filter.category = category;
  const from = params.get("from");
  const to = params.get("to");
  if (from || to) {
    const date: Record<string, Date> = {};
    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
      date.$gte = new Date(`${from}T00:00:00.000Z`);
    }
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
      date.$lte = new Date(`${to}T23:59:59.999Z`);
    }
    if (Object.keys(date).length) filter.date = date;
  }
  try {
    await connectToDatabase();
    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .limit(500)
      .lean()
      .exec();
    return NextResponse.json(
      { items: expenses.map((item) => serialize(item as never)) },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    console.error("Expenses could not be loaded.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "Expenses could not be loaded right now." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}

export async function POST(request: NextRequest) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = expenseInputSchema.safeParse(body.value);
  if (!parsed.success) return badInput("Check the expense details and try again.");
  try {
    await connectToDatabase();
    const project = parsed.data.projectId
      ? await ClientProject.findById(parsed.data.projectId).select("_id").lean().exec()
      : null;
    if (parsed.data.projectId && !project) {
      return NextResponse.json({ message: "The selected project was not found." }, { status: 404, headers: PRIVATE_HEADERS });
    }
    const expense = await Expense.create({
      ...parsed.data,
      projectId: project?._id,
      date: new Date(`${parsed.data.date}T12:00:00.000Z`),
      paidAt: parsed.data.paymentStatus === "Paid" ? new Date() : undefined,
    });
    await writeAuditLog(
      actorId,
      parsed.data.paymentStatus === "Paid" ? "expense.recorded_paid" : "expense.created",
      "expense",
      expense._id.toString(),
      `Created expense ${expense.title}.`,
      { amountMinor: expense.amountMinor, paymentStatus: expense.paymentStatus },
    );
    return NextResponse.json(
      { item: serialize(expense as never) },
      { status: 201, headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    console.error("Expense could not be created.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "The expense could not be saved right now." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}
