import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import {
  getAdminId,
  PRIVATE_HEADERS,
  rejectOrigin,
  rejectUnauthorized,
  writeAuditLog,
} from "@/lib/admin/api";
import { connectToDatabase } from "@/lib/db/connect";
import { ClientProject, Deal } from "@/models/business";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  if (!Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ message: "Deal not found." }, { status: 404, headers: PRIVATE_HEADERS });
  }
  try {
    await connectToDatabase();
    const deal = await Deal.findById(params.id).lean().exec();
    if (!deal) return NextResponse.json({ message: "Deal not found." }, { status: 404, headers: PRIVATE_HEADERS });
    if (deal.status !== "Won") {
      return NextResponse.json({ message: "Only a won deal can create a client project." }, { status: 409, headers: PRIVATE_HEADERS });
    }

    let project;
    let created = false;
    try {
      project = await ClientProject.findOneAndUpdate(
        { dealId: deal._id },
        {
          $setOnInsert: {
            dealId: deal._id,
            leadId: deal.leadId,
            name: deal.title,
            clientName: deal.clientName,
            businessName: deal.businessName,
            email: deal.email,
            phone: deal.phone,
            serviceId: deal.serviceId,
            serviceName: deal.serviceName,
            agreedValueMinor: deal.amountMinor,
            status: "Not Started",
            progress: 0,
            description: deal.requirements,
            internalNotes: deal.internalNotes,
            tasks: [],
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ).exec();
      created = project?.createdAt.getTime() === project?.updatedAt.getTime();
    } catch (error) {
      if (
        typeof error !== "object" ||
        error === null ||
        !("code" in error) ||
        error.code !== 11000
      ) {
        throw error;
      }
      project = await ClientProject.findOne({ dealId: deal._id }).exec();
    }
    if (!project) throw new Error("Client project was not created.");
    if (created) {
      await writeAuditLog(
        actorId,
        "project.created_from_deal",
        "project",
        project._id.toString(),
        `Created project from won deal ${deal.title}.`,
        { dealId: deal._id.toString() },
      );
    }
    return NextResponse.json(
      {
        item: {
          ...project.toObject(),
          _id: project._id.toString(),
          dealId: deal._id.toString(),
          leadId: deal.leadId?.toString(),
        },
        created,
      },
      { status: created ? 201 : 200, headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    console.error("Client project creation from deal failed.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "The client project could not be created." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}
