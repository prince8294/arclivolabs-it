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
import { dealInputSchema } from "@/lib/validations/business";
import { ClientProject, Deal, ManagedService } from "@/models/business";
import { Enquiry } from "@/models/enquiry";

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
    leadId: record.leadId ? String(record.leadId) : "",
  };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  if (!(await getAdminId())) return rejectUnauthorized();
  if (!validId(params.id)) {
    return NextResponse.json({ message: "Deal not found." }, { status: 404, headers: PRIVATE_HEADERS });
  }
  try {
    await connectToDatabase();
    const deal = await Deal.findById(params.id).lean().exec();
    if (!deal) return NextResponse.json({ message: "Deal not found." }, { status: 404, headers: PRIVATE_HEADERS });
    const project = await ClientProject.findOne({ dealId: deal._id }).select("_id name status").lean().exec();
    return NextResponse.json(
      {
        item: serialize(deal as never),
        project: project ? { ...project, _id: project._id.toString() } : null,
      },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    console.error("Deal details could not be loaded.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "Deal details could not be loaded right now." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  if (!validId(params.id)) {
    return NextResponse.json({ message: "Deal not found." }, { status: 404, headers: PRIVATE_HEADERS });
  }
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = dealInputSchema.safeParse(body.value);
  if (!parsed.success) return badInput("Check the deal details and try again.");
  try {
    await connectToDatabase();
    const existing = await Deal.findById(params.id).exec();
    if (!existing) return NextResponse.json({ message: "Deal not found." }, { status: 404, headers: PRIVATE_HEADERS });
    const service = await ManagedService.findById(parsed.data.serviceId).lean().exec();
    if (!service) return badInput("The selected service is unavailable.");
    const lead = parsed.data.leadId
      ? await Enquiry.findById(parsed.data.leadId).lean().exec()
      : null;
    if (parsed.data.leadId && !lead) {
      return NextResponse.json({ message: "The linked lead was not found." }, { status: 404, headers: PRIVATE_HEADERS });
    }

    Object.assign(existing, {
      leadId: lead?._id,
      clientName: lead?.fullName ?? parsed.data.clientName,
      businessName: lead?.companyName ?? parsed.data.businessName,
      email: lead?.email ?? parsed.data.email,
      phone: lead?.phone ?? parsed.data.phone,
      title: parsed.data.title,
      serviceId: parsed.data.serviceId,
      serviceName: service.name,
      amountMinor: parsed.data.amountMinor,
      expectedCloseDate: parsed.data.expectedCloseDate
        ? new Date(`${parsed.data.expectedCloseDate}T23:59:59.999Z`)
        : undefined,
      status: parsed.data.status,
      requirements: lead?.projectDescription ?? parsed.data.requirements,
      internalNotes: parsed.data.internalNotes,
      wonAt: parsed.data.status === "Won" ? existing.wonAt ?? new Date() : undefined,
      lostAt: parsed.data.status === "Lost" ? existing.lostAt ?? new Date() : undefined,
    });
    await existing.save();
    await writeAuditLog(
      actorId,
      "deal.updated",
      "deal",
      existing._id.toString(),
      `Updated deal ${existing.title}.`,
      { status: existing.status, amountMinor: existing.amountMinor },
    );
    return NextResponse.json({ item: serialize(existing as never) }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error("Deal update failed.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "The deal could not be updated." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  if (!validId(params.id)) {
    return NextResponse.json({ message: "Deal not found." }, { status: 404, headers: PRIVATE_HEADERS });
  }
  try {
    await connectToDatabase();
    const deal = await Deal.findById(params.id).exec();
    if (!deal) return NextResponse.json({ message: "Deal not found." }, { status: 404, headers: PRIVATE_HEADERS });
    if (await ClientProject.exists({ dealId: deal._id })) {
      return NextResponse.json(
        { message: "This deal has a client project and cannot be deleted." },
        { status: 409, headers: PRIVATE_HEADERS },
      );
    }
    await Deal.deleteOne({ _id: deal._id }).exec();
    await writeAuditLog(actorId, "deal.deleted", "deal", deal._id.toString(), `Deleted deal ${deal.title}.`);
    return NextResponse.json({ ok: true }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error("Deal deletion failed.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "The deal could not be deleted." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}
