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
import { listPortfolioProjects } from "@/lib/admin/content";
import { portfolioInputSchema } from "@/lib/validations/business";
import { PortfolioProject } from "@/models/business";
import { connectToDatabase } from "@/lib/db/connect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminId())) return rejectUnauthorized();
  try {
    const items = await listPortfolioProjects();
    return NextResponse.json(
      { items: items.map((item) => ({ ...item, _id: item._id.toString() })) },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    console.error("Portfolio projects could not be loaded.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "Portfolio projects could not be loaded." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}

export async function POST(request: NextRequest) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = portfolioInputSchema.safeParse(body.value);
  if (!parsed.success) return badInput("Check the portfolio project details.");
  try {
    await connectToDatabase();
    const record = await PortfolioProject.create(parsed.data);
    await writeAuditLog(actorId, "portfolio.created", "portfolio", record._id.toString(), `Created portfolio item ${record.title}.`);
    if (record.published) revalidatePath("/");
    return NextResponse.json(
      { item: { ...record.toObject(), _id: record._id.toString() } },
      { status: 201, headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return NextResponse.json({ message: "That portfolio slug is already in use." }, { status: 409, headers: PRIVATE_HEADERS });
    }
    console.error("Portfolio project could not be created.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "The portfolio project could not be saved." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}
