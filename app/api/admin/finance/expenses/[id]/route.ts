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

interface RouteContext {
  params: { id: string };
}

function validId(id: string) {
  return /^[a-f\d]{24}$/i.test(id) && Types.ObjectId.isValid(id);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  if (!validId(params.id)) return NextResponse.json({ message: "Expense not found." }, { status: 404, headers: PRIVATE_HEADERS });
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = expenseInputSchema.safeParse(body.value);
  if (!parsed.success) return badInput("Check the expense details and try again.");
  try {
    await connectToDatabase();
    const expense = await Expense.findById(params.id).exec();
    if (!expense) return NextResponse.json({ message: "Expense not found." }, { status: 404, headers: PRIVATE_HEADERS });
    if (expense.paymentStatus === "Paid") {
      return NextResponse.json({ message: "Paid expenses are locked. Record a traceable adjustment instead." }, { status: 409, headers: PRIVATE_HEADERS });
    }
    const project = parsed.data.projectId
      ? await ClientProject.findById(parsed.data.projectId).select("_id").lean().exec()
      : null;
    if (parsed.data.projectId && !project) {
      return NextResponse.json({ message: "The selected project was not found." }, { status: 404, headers: PRIVATE_HEADERS });
    }
    Object.assign(expense, {
      ...parsed.data,
      projectId: project?._id,
      date: new Date(`${parsed.data.date}T12:00:00.000Z`),
      paidAt: parsed.data.paymentStatus === "Paid" ? new Date() : undefined,
    });
    await expense.save();
    const auditAction =
      parsed.data.paymentStatus === "Paid"
        ? "expense.marked_paid"
        : "expense.updated";
    await writeAuditLog(
      actorId,
      auditAction,
      "expense",
      expense._id.toString(),
      `Updated expense ${expense.title}.`,
      { amountMinor: expense.amountMinor, paymentStatus: expense.paymentStatus },
    );
    return NextResponse.json(
      {
        item: {
          ...expense.toObject(),
          _id: expense._id.toString(),
          projectId: expense.projectId?.toString() ?? "",
        },
      },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    console.error("Expense update failed.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "The expense could not be updated." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  if (!validId(params.id)) return NextResponse.json({ message: "Expense not found." }, { status: 404, headers: PRIVATE_HEADERS });
  try {
    await connectToDatabase();
    const expense = await Expense.findById(params.id).exec();
    if (!expense) return NextResponse.json({ message: "Expense not found." }, { status: 404, headers: PRIVATE_HEADERS });
    if (expense.paymentStatus !== "Draft") {
      return NextResponse.json({ message: "Only draft expenses can be deleted." }, { status: 409, headers: PRIVATE_HEADERS });
    }
    await Expense.deleteOne({ _id: expense._id, paymentStatus: "Draft" }).exec();
    await writeAuditLog(actorId, "expense.draft_deleted", "expense", expense._id.toString(), `Deleted draft expense ${expense.title}.`);
    return NextResponse.json({ ok: true }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error("Expense deletion failed.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "The draft expense could not be deleted." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}
