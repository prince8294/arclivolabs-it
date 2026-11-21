import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { isEnquiryStatus, isServiceOption, listEnquiries } from "@/lib/admin/enquiries";
import type { EnquiryFilters } from "@/lib/admin/enquiries";
import { connectToDatabase } from "@/lib/db/connect";
import {
  badInput,
  getAdminId,
  readJsonBody,
  rejectOrigin,
  rejectUnauthorized,
} from "@/lib/admin/api";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { leadCreateSchema } from "@/lib/validations/business";
import { Enquiry } from "@/models/enquiry";
import { toEnquiryDetails } from "@/lib/admin/enquiries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Sign in to view enquiries." },
      { status: 401, headers: PRIVATE_HEADERS },
    );
  }

  const params = request.nextUrl.searchParams;
  const rawPage = Number(params.get("page") ?? 1);
  if (!Number.isInteger(rawPage) || rawPage < 1 || rawPage > 50_000) {
    return NextResponse.json(
      { message: "Invalid page number." },
      { status: 400, headers: PRIVATE_HEADERS },
    );
  }

  const rawStatus = params.get("status") ?? "";
  const rawProjectType = params.get("projectType") ?? "";
  if (rawStatus && rawStatus !== "All" && !isEnquiryStatus(rawStatus)) {
    return NextResponse.json(
      { message: "Invalid status filter." },
      { status: 400, headers: PRIVATE_HEADERS },
    );
  }
  if (rawProjectType && rawProjectType !== "All" && !isServiceOption(rawProjectType)) {
    return NextResponse.json(
      { message: "Invalid project type filter." },
      { status: 400, headers: PRIVATE_HEADERS },
    );
  }

  const rawSort = params.get("sort") ?? "newest";
  if (rawSort !== "newest" && rawSort !== "oldest") {
    return NextResponse.json(
      { message: "Invalid sort order." },
      { status: 400, headers: PRIVATE_HEADERS },
    );
  }

  const filters: EnquiryFilters = {
    query: (params.get("q") ?? "").slice(0, 80),
    status:
      rawStatus && rawStatus !== "All" && isEnquiryStatus(rawStatus)
        ? rawStatus
        : undefined,
    projectType:
      rawProjectType &&
      rawProjectType !== "All" &&
      isServiceOption(rawProjectType)
        ? rawProjectType
        : undefined,
    sort: rawSort,
    page: rawPage,
    pageSize: 20,
  };

  try {
    const result = await listEnquiries(filters);
    return NextResponse.json(result, { headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error(
      "Admin enquiry list could not be loaded.",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { message: "Enquiries could not be loaded right now." },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}

export async function POST(request: NextRequest) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = leadCreateSchema.safeParse(body.value);
  if (!parsed.success) return badInput("Check the lead details and try again.");

  try {
    await connectToDatabase();
    let phone: string | undefined;
    if (parsed.data.phone) {
      const parsedPhone = parsePhoneNumberFromString(parsed.data.phone);
      if (!parsedPhone?.isValid()) {
        return badInput("Enter a valid phone number with its country code.");
      }
      phone = parsedPhone.number;
    }

    const duplicates = await Enquiry.find({
      $or: [
        { email: parsed.data.email.toLowerCase() },
        ...(phone ? [{ phone }] : []),
      ],
    })
      .select("fullName companyName email phone")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
      .exec();
    if (duplicates.length > 0 && !parsed.data.allowDuplicate) {
      return NextResponse.json(
        {
          message: "Possible matching leads were found. Review them before continuing.",
          duplicateSuggestions: duplicates.map((record) => ({
            id: record._id.toString(),
            fullName: record.fullName,
            companyName: record.companyName,
            email: record.email,
            phone: record.phone,
          })),
        },
        { status: 409, headers: PRIVATE_HEADERS },
      );
    }

    const {
      allowDuplicate: _allowDuplicate,
      followUpDate,
      ...input
    } = parsed.data;
    const lead = await Enquiry.create({
      ...input,
      email: input.email.toLowerCase(),
      phone,
      companyName: input.companyName || undefined,
      estimatedBudget: input.estimatedBudget || undefined,
      projectDescription: input.projectDescription,
      followUpDate: followUpDate ? new Date(`${followUpDate}T00:00:00.000Z`) : undefined,
      whatsappConsent: false,
      whatsappConsentAt: null,
      source: input.source,
    });

    return NextResponse.json(
      { item: toEnquiryDetails(lead as typeof lead & { _id: import("mongoose").Types.ObjectId }) },
      { status: 201, headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    console.error(
      "Admin lead could not be created.",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { message: "The lead could not be saved right now." },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}
