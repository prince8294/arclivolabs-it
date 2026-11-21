import { NextResponse, type NextRequest } from "next/server";
import {
  badInput,
  getAdminId,
  PRIVATE_HEADERS,
  readJsonBody,
  rejectOrigin,
  rejectUnauthorized,
} from "@/lib/admin/api";
import { connectToDatabase } from "@/lib/db/connect";
import { createDraftInvoice, FinanceError } from "@/lib/finance/transactions";
import { getInvoiceStatus } from "@/lib/finance/money";
import { invoiceInputSchema } from "@/lib/validations/business";
import { Invoice } from "@/models/finance";
import type { InvoiceRecord } from "@/models/finance";
import type { Types } from "mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serializeInvoice(invoice: InvoiceRecord & { _id: Types.ObjectId }) {
  return {
    ...invoice,
    _id: invoice._id.toString(),
    projectId: invoice.projectId?.toString(),
    status: getInvoiceStatus(invoice),
  };
}

export async function GET(request: NextRequest) {
  if (!(await getAdminId())) return rejectUnauthorized();
  try {
    await connectToDatabase();
    const rawStatus = request.nextUrl.searchParams.get("status");
    const filter =
      rawStatus && ["Draft", "Issued", "Partially Paid", "Paid", "Overdue", "Void"].includes(rawStatus)
        ? { status: rawStatus }
        : {};
    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
      .exec();
    return NextResponse.json(
      { items: invoices.map((invoice) => serializeInvoice(invoice as never)) },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    console.error(
      "Admin invoice list could not be loaded.",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { message: "Invoices could not be loaded right now." },
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
  const parsed = invoiceInputSchema.safeParse(body.value);
  if (!parsed.success) return badInput("Check the invoice details and line items.");
  try {
    const invoice = await createDraftInvoice(parsed.data, actorId);
    return NextResponse.json(
      { item: serializeInvoice(invoice as never) },
      { status: 201, headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    if (error instanceof FinanceError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.statusCode, headers: PRIVATE_HEADERS },
      );
    }
    console.error(
      "Draft invoice could not be created.",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { message: "The draft invoice could not be created right now." },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}
