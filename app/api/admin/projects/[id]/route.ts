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
import { projectInputSchema } from "@/lib/validations/business";
import { AuditLog, ClientProject, Deal, ManagedService } from "@/models/business";
import { Expense, Invoice } from "@/models/finance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: { id: string };
}

function validId(id: string) {
  return /^[a-f\d]{24}$/i.test(id) && Types.ObjectId.isValid(id);
}

function serialize(record: Record<string, unknown> & { _id: Types.ObjectId }) {
  return {
    ...record,
    _id: record._id.toString(),
    dealId: record.dealId ? String(record.dealId) : "",
    leadId: record.leadId ? String(record.leadId) : "",
  };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  if (!(await getAdminId())) return rejectUnauthorized();
  if (!validId(params.id)) return NextResponse.json({ message: "Project not found." }, { status: 404, headers: PRIVATE_HEADERS });
  try {
    await connectToDatabase();
    const project = await ClientProject.findById(params.id).lean().exec();
    if (!project) return NextResponse.json({ message: "Project not found." }, { status: 404, headers: PRIVATE_HEADERS });
    const invoices = await Invoice.find({ projectId: project._id })
      .select("invoiceNumber status totalMinor paidMinor dueDate")
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    const expenses = await Expense.find({ projectId: project._id })
      .select("title category amountMinor date paymentStatus")
      .sort({ date: -1 })
      .lean()
      .exec();
    return NextResponse.json(
      {
        item: serialize(project as never),
        invoices: invoices.map((invoice) => ({ ...invoice, _id: invoice._id.toString() })),
        expenses: expenses.map((expense) => ({ ...expense, _id: expense._id.toString() })),
      },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    console.error("Project details could not be loaded.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "Project details could not be loaded right now." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  if (!validId(params.id)) return NextResponse.json({ message: "Project not found." }, { status: 404, headers: PRIVATE_HEADERS });
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = projectInputSchema.safeParse(body.value);
  if (!parsed.success) return badInput("Check the project details and try again.");
  try {
    await connectToDatabase();
    const project = await ClientProject.findById(params.id).exec();
    if (!project) return NextResponse.json({ message: "Project not found." }, { status: 404, headers: PRIVATE_HEADERS });
    const service = await ManagedService.findById(parsed.data.serviceId).lean().exec();
    if (!service) return badInput("The selected service is unavailable.");
    if (parsed.data.dealId && parsed.data.dealId !== project.dealId?.toString()) {
      return NextResponse.json({ message: "A project cannot be reassigned to another deal." }, { status: 409, headers: PRIVATE_HEADERS });
    }
    Object.assign(project, {
      name: parsed.data.name,
      clientName: parsed.data.clientName,
      businessName: parsed.data.businessName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      serviceId: parsed.data.serviceId,
      serviceName: service.name,
      agreedValueMinor: parsed.data.agreedValueMinor,
      startDate: parsed.data.startDate ? new Date(`${parsed.data.startDate}T00:00:00.000Z`) : undefined,
      deadline: parsed.data.deadline ? new Date(`${parsed.data.deadline}T23:59:59.999Z`) : undefined,
      status: parsed.data.status,
      progress: parsed.data.progress,
      assignedTo: parsed.data.assignedTo,
      description: parsed.data.description,
      internalNotes: parsed.data.internalNotes,
    });
    await project.save();
    await writeAuditLog(actorId, "project.updated", "project", project._id.toString(), `Updated project ${project.name}.`);
    return NextResponse.json({ item: serialize(project as never) }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error("Project update failed.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "The project could not be updated." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  if (!validId(params.id)) return NextResponse.json({ message: "Project not found." }, { status: 404, headers: PRIVATE_HEADERS });
  try {
    await connectToDatabase();
    const project = await ClientProject.findById(params.id).exec();
    if (!project) return NextResponse.json({ message: "Project not found." }, { status: 404, headers: PRIVATE_HEADERS });
    if (
      (await Invoice.exists({ projectId: project._id })) ||
      (await Expense.exists({ projectId: project._id }))
    ) {
      return NextResponse.json(
        { message: "Projects with invoices or expenses cannot be deleted." },
        { status: 409, headers: PRIVATE_HEADERS },
      );
    }
    await ClientProject.deleteOne({ _id: project._id }).exec();
    await writeAuditLog(actorId, "project.deleted", "project", project._id.toString(), `Deleted project ${project.name}.`);
    await AuditLog.updateMany(
      { entityType: "project", entityId: project._id.toString() },
      { $set: { entityType: "deleted-project" } },
    ).exec();
    return NextResponse.json({ ok: true }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error("Project deletion failed.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "The project could not be deleted." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}
