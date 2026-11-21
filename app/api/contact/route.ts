import { parsePhoneNumberFromString } from "libphonenumber-js";
import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { consumeRateLimit, getClientAddress } from "@/lib/security/rate-limit";
import { readLimitedBody, type LimitedBodyResult } from "@/lib/security/read-limited-body";
import { enquirySchema } from "@/lib/validations/enquiry";
import { Enquiry } from "@/models/enquiry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 32 * 1024;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const PRIVATE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

function failure(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { ok: false, message, ...extra },
    { status, headers: PRIVATE_HEADERS },
  );
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type")?.split(";")[0].trim();
  if (contentType !== "application/json") {
    return failure("Send the form as JSON.", 415);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return failure("The form submission is too large.", 413);
  }

  let bodyResult: LimitedBodyResult;
  try {
    bodyResult = await readLimitedBody(request, MAX_BODY_BYTES);
  } catch {
    return failure("We could not read that submission. Please try again.", 400);
  }

  if (bodyResult.tooLarge) {
    return failure("The form submission is too large.", 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyResult.text);
  } catch {
    return failure("The form submission could not be understood.", 400);
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "website" in body &&
    typeof body.website === "string" &&
    body.website.trim().length > 0
  ) {
    return NextResponse.json(
      { ok: true, message: "Enquiry received." },
      { status: 202, headers: PRIVATE_HEADERS },
    );
  }

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return failure("Please review the highlighted fields.", 400, {
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    await connectToDatabase();
    const address = getClientAddress(request.headers);
    const rate = await consumeRateLimit(
      "public-enquiry",
      address,
      RATE_LIMIT,
      RATE_WINDOW_MS,
    );

    if (!rate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          message: "Too many submissions. Please wait a few minutes and try again.",
        },
        {
          status: 429,
          headers: {
            ...PRIVATE_HEADERS,
            "Retry-After": String(rate.retryAfterSeconds),
          },
        },
      );
    }

    let normalizedPhone: string | undefined;
    if (parsed.data.phone) {
      const phone = parsePhoneNumberFromString(parsed.data.phone);
      if (!phone?.isValid()) {
        return failure("Enter a valid phone number with its country code.", 400, {
          fieldErrors: {
            phone: ["Enter a valid phone number with its country code."],
          },
        });
      }
      normalizedPhone = phone.number;
    }

    const whatsappConsent = parsed.data.whatsappConsent === true;
    await Enquiry.create({
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: normalizedPhone,
      companyName: parsed.data.companyName,
      projectType: parsed.data.projectType,
      estimatedBudget: parsed.data.estimatedBudget,
      projectDescription: parsed.data.projectDescription,
      whatsappConsent,
      whatsappConsentAt: whatsappConsent ? new Date() : null,
      status: "New",
      adminNotes: "",
      source: "Website Contact Form",
    });

    return NextResponse.json(
      { ok: true, message: "Enquiry received." },
      { status: 201, headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    console.error(
      "Contact enquiry could not be saved.",
      error instanceof Error ? error.name : "UnknownError",
    );
    return failure(
      "We could not submit your enquiry right now. Please try again shortly.",
      500,
    );
  }
}
