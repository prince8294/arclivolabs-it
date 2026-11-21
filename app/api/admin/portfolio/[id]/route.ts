import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
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
import { portfolioInputSchema } from "@/lib/validations/business";
import { PortfolioProject } from "@/models/business";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  if (!Types.ObjectId.isValid(params.id)) return NextResponse.json({ message: "Portfolio item not found." }, { status: 404, headers: PRIVATE_HEADERS });
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = portfolioInputSchema.safeParse(body.value);
  if (!parsed.success) return badInput("Check the portfolio project details.");
  try {
    await connectToDatabase();
    const item = await PortfolioProject.findByIdAndUpdate(
      params.id,
      { $set: parsed.data },
      { new: true, runValidators: true },
    ).exec();
    if (!item) return NextResponse.json({ message: "Portfolio item not found." }, { status: 404, headers: PRIVATE_HEADERS });
    await writeAuditLog(actorId, "portfolio.updated", "portfolio", item._id.toString(), `Updated portfolio item ${item.title}.`);
    revalidatePath("/");
    return NextResponse.json(
      { item: { ...item.toObject(), _id: item._id.toString() } },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return NextResponse.json({ message: "That portfolio slug is already in use." }, { status: 409, headers: PRIVATE_HEADERS });
    }
    console.error("Portfolio project update failed.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "The portfolio project could not be updated." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  if (!Types.ObjectId.isValid(params.id)) return NextResponse.json({ message: "Portfolio item not found." }, { status: 404, headers: PRIVATE_HEADERS });
  try {
    await connectToDatabase();
    const item = await PortfolioProject.findById(params.id).exec();
    if (!item) return NextResponse.json({ message: "Portfolio item not found." }, { status: 404, headers: PRIVATE_HEADERS });
    if (item.published) {
      return NextResponse.json({ message: "Unpublish this portfolio item before deleting it." }, { status: 409, headers: PRIVATE_HEADERS });
    }
    await PortfolioProject.deleteOne({ _id: item._id, published: false }).exec();
    await writeAuditLog(actorId, "portfolio.draft_deleted", "portfolio", item._id.toString(), `Deleted draft portfolio item ${item.title}.`);
    revalidatePath("/");
    return NextResponse.json({ ok: true }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error("Portfolio project deletion failed.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "The draft portfolio item could not be deleted." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}
