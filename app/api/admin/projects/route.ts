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
import { ClientProject, Deal, ManagedService } from "@/models/business";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(record: Record<string, unknown> & { _id: Types.ObjectId }) {
  return {
    ...record,
    _id: record._id.toString(),
    dealId: record.dealId ? String(record.dealId) : "",
    leadId: record.leadId ? String(record.leadId) : "",
  };
}

export async function GET() {
  if (!(await getAdminId())) return rejectUnauthorized();
  try {
    await connectToDatabase();
    const projects = await ClientProject.find({})
      .sort({ createdAt: -1 })
      .limit(250)
      .lean()
      .exec();
    return NextResponse.json(
      { items: projects.map((project) => serialize(project as never)) },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    console.error("Projects could not be loaded.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "Projects could not be loaded right now." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}

export async function POST(request: NextRequest) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = projectInputSchema.safeParse(body.value);
  if (!parsed.success) return badInput("Check the project details and try again.");
  try {
    await connectToDatabase();
    const service = await ManagedService.findById(parsed.data.serviceId).lean().exec();
    if (!service) return badInput("The selected service is unavailable.");
    const deal = parsed.data.dealId
      ? await Deal.findById(parsed.data.dealId).lean().exec()
      : null;
    if (parsed.data.dealId && !deal) {
      return NextResponse.json({ message: "The linked deal was not found." }, { status: 404, headers: PRIVATE_HEADERS });
    }
    if (deal && deal.status !== "Won") {
      return NextResponse.json({ message: "Only a won deal can be linked to a client project." }, { status: 409, headers: PRIVATE_HEADERS });
    }
    if (deal && await ClientProject.exists({ dealId: deal._id })) {
      return NextResponse.json({ message: "A project already exists for this deal." }, { status: 409, headers: PRIVATE_HEADERS });
    }
    const data = parsed.data;
    const project = await ClientProject.create({
      dealId: deal?._id,
      leadId: deal?.leadId ?? (data.leadId ? new Types.ObjectId(data.leadId) : undefined),
      name: data.name,
      clientName: deal?.clientName ?? data.clientName,
      businessName: deal?.businessName ?? data.businessName,
      email: deal?.email ?? data.email,
      phone: deal?.phone ?? data.phone,
      serviceId: deal?.serviceId ?? data.serviceId,
      serviceName: deal?.serviceName ?? service.name,
      agreedValueMinor: deal?.amountMinor ?? data.agreedValueMinor,
      startDate: data.startDate ? new Date(`${data.startDate}T00:00:00.000Z`) : undefined,
      deadline: data.deadline ? new Date(`${data.deadline}T23:59:59.999Z`) : undefined,
      status: data.status,
      progress: data.progress,
      assignedTo: data.assignedTo,
      description: deal?.requirements ?? data.description,
      internalNotes: data.internalNotes,
    });
    await writeAuditLog(actorId, "project.created", "project", project._id.toString(), `Created project ${project.name}.`);
    return NextResponse.json(
      { item: serialize(project as never) },
      { status: 201, headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json({ message: "A project already exists for this deal." }, { status: 409, headers: PRIVATE_HEADERS });
    }
    console.error("Project could not be created.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "The project could not be saved right now." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}
