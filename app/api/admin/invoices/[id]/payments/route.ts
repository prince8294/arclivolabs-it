import { Types } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import {
  badInput,
  getAdminId,
  PRIVATE_HEADERS,
  readJsonBody,
  rejectOrigin,
  rejectUnauthorized,
} from "@/lib/admin/api";
import { FinanceError, recordInvoicePayment } from "@/lib/finance/transactions";
import { paymentInputSchema } from "@/lib/validations/business";

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
    return NextResponse.json({ message: "Invoice not found." }, { status: 404, headers: PRIVATE_HEADERS });
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = paymentInputSchema.safeParse(body.value);
  if (!parsed.success) return badInput("Check the payment details and try again.");
  try {
    const result = await recordInvoicePayment(params.id, parsed.data, actorId);
    return NextResponse.json(
      {
        item: {
          ...result.payment,
          _id: result.payment._id.toString(),
          invoiceId: result.payment.invoiceId.toString(),
          projectId: result.payment.projectId?.toString(),
          originalPaymentId: result.payment.originalPaymentId?.toString(),
        },
        duplicate: result.duplicate,
      },
      { status: result.duplicate ? 200 : 201, headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    if (error instanceof FinanceError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode, headers: PRIVATE_HEADERS });
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { message: "This payment was already recorded. Refresh the invoice before trying again." },
        { status: 409, headers: PRIVATE_HEADERS },
      );
    }
    console.error("Invoice payment could not be recorded.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json(
      { message: "The payment could not be recorded right now." },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}
