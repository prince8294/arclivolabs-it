import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectToDatabase } from "@/lib/db/connect";
import { getEnquiryDetails, toEnquiryDetails } from "@/lib/admin/enquiries";
import { readLimitedBody } from "@/lib/security/read-limited-body";
import { hasTrustedRequestOrigin } from "@/lib/security/request-origin";
import { leadUpdateSchema } from "@/lib/validations/business";
import { Enquiry } from "@/models/enquiry";
import type { EnquiryRecord } from "@/models/enquiry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store, max-age=0" };

interface RouteContext {
  params: { id: string };
}

function isValidId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id) && Types.ObjectId.isValid(id);
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Sign in to view this enquiry." },
      { status: 401, headers: PRIVATE_HEADERS },
    );
  }
  if (!isValidId(params.id)) {
    return NextResponse.json(
      { message: "Enquiry not found." },
      { status: 404, headers: PRIVATE_HEADERS },
    );
  }

  try {
    const item = await getEnquiryDetails(params.id);
    if (!item) {
      return NextResponse.json(
        { message: "Enquiry not found." },
        { status: 404, headers: PRIVATE_HEADERS },
      );
    }
    return NextResponse.json({ item }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error(
      "Admin enquiry detail could not be loaded.",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { message: "This enquiry could not be loaded right now." },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Sign in to update enquiries." },
      { status: 401, headers: PRIVATE_HEADERS },
    );
  }
  if (!hasTrustedRequestOrigin(request)) {
    return NextResponse.json(
      { message: "This request was not allowed." },
      { status: 403, headers: PRIVATE_HEADERS },
    );
  }
  if (!isValidId(params.id)) {
    return NextResponse.json(
      { message: "Enquiry not found." },
      { status: 404, headers: PRIVATE_HEADERS },
    );
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 24 * 1024) {
    return NextResponse.json(
      { message: "The update is too large." },
      { status: 413, headers: PRIVATE_HEADERS },
    );
  }

  let body: unknown;
  try {
    const bodyResult = await readLimitedBody(request, 24 * 1024);
    if (bodyResult.tooLarge) {
      return NextResponse.json(
        { message: "The update is too large." },
        { status: 413, headers: PRIVATE_HEADERS },
      );
    }
    body = JSON.parse(bodyResult.text);
  } catch {
    return NextResponse.json(
      { message: "The update could not be understood." },
      { status: 400, headers: PRIVATE_HEADERS },
    );
  }

  const parsed = leadUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Provide valid lead details, status, or internal notes." },
      { status: 400, headers: PRIVATE_HEADERS },
    );
  }

  const updates: Partial<EnquiryRecord> = {};
  const unset: Record<string, 1> = {};
  const fields = parsed.data;
  if (fields.fullName !== undefined) updates.fullName = fields.fullName;
  if (fields.email !== undefined) updates.email = fields.email.toLowerCase();
  if (fields.phone !== undefined) updates.phone = fields.phone || undefined;
  if (fields.companyName !== undefined) updates.companyName = fields.companyName || undefined;
  if (fields.projectType !== undefined) updates.projectType = fields.projectType;
  if (fields.estimatedBudget !== undefined) {
    updates.estimatedBudget = fields.estimatedBudget || undefined;
  }
  if (fields.projectDescription !== undefined) {
    updates.projectDescription = fields.projectDescription;
  }
  if (fields.status !== undefined) updates.status = fields.status;
  if (fields.source !== undefined) updates.source = fields.source;
  if (fields.adminNotes !== undefined) updates.adminNotes = fields.adminNotes;
  if (fields.followUpDate !== undefined) {
    if (fields.followUpDate) {
      updates.followUpDate = new Date(`${fields.followUpDate}T00:00:00.000Z`);
    } else {
      unset.followUpDate = 1;
    }
  }
  const updateOperation: {
    $set?: Partial<EnquiryRecord>;
    $unset?: Record<string, 1>;
  } = {};
  if (Object.keys(updates).length > 0) updateOperation.$set = updates;
  if (Object.keys(unset).length > 0) updateOperation.$unset = unset;

  try {
    await connectToDatabase();
    const updated = await Enquiry.findByIdAndUpdate(
      params.id,
      updateOperation,
      { new: true, runValidators: true },
    ).exec();
    if (!updated) {
      return NextResponse.json(
        { message: "Enquiry not found." },
        { status: 404, headers: PRIVATE_HEADERS },
      );
    }
    return NextResponse.json(
      { item: toEnquiryDetails(updated as EnquiryRecord & { _id: Types.ObjectId }) },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    console.error(
      "Admin enquiry update failed.",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { message: "The enquiry could not be updated. Your changes are still available." },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Sign in to delete enquiries." },
      { status: 401, headers: PRIVATE_HEADERS },
    );
  }
  if (!hasTrustedRequestOrigin(request)) {
    return NextResponse.json(
      { message: "This request was not allowed." },
      { status: 403, headers: PRIVATE_HEADERS },
    );
  }
  if (!isValidId(params.id)) {
    return NextResponse.json(
      { message: "Enquiry not found." },
      { status: 404, headers: PRIVATE_HEADERS },
    );
  }

  try {
    await connectToDatabase();
    const result = await Enquiry.deleteOne({ _id: params.id }).exec();
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Enquiry not found." },
        { status: 404, headers: PRIVATE_HEADERS },
      );
    }
    return NextResponse.json({ ok: true }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error(
      "Admin enquiry deletion failed.",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { message: "The enquiry could not be deleted right now." },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}
