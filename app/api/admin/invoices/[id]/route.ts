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
import { connectToDatabase } from "@/lib/db/connect";
import { FinanceError, setInvoiceAction, updateDraftInvoice } from "@/lib/finance/transactions";
import { getInvoiceStatus } from "@/lib/finance/money";
import { invoiceInputSchema } from "@/lib/validations/business";
import { AuditLog } from "@/models/business";
import { Invoice, Payment } from "@/models/finance";
import type { InvoiceRecord } from "@/models/finance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: { id: string };
}

function validId(id: string) {
  return /^[a-f\d]{24}$/i.test(id) && Types.ObjectId.isValid(id);
}

function serialize(invoice: InvoiceRecord & { _id: Types.ObjectId }) {
  return {
    ...invoice,
    _id: invoice._id.toString(),
    projectId: invoice.projectId?.toString(),
    status: getInvoiceStatus(invoice),
  };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  if (!(await getAdminId())) return rejectUnauthorized();
  if (!validId(params.id)) {
    return NextResponse.json({ message: "Invoice not found." }, { status: 404, headers: PRIVATE_HEADERS });
  }
  try {
    await connectToDatabase();
    const invoice = await Invoice.findById(params.id).lean().exec();
    if (!invoice) {
      return NextResponse.json({ message: "Invoice not found." }, { status: 404, headers: PRIVATE_HEADERS });
    }
    const payments = await Payment.find({ invoiceId: invoice._id })
      .sort({ paymentDate: -1 })
      .lean()
      .exec();
    return NextResponse.json(
      {
        item: serialize(invoice as never),
        payments: payments.map((payment) => ({
          ...payment,
          _id: payment._id.toString(),
          invoiceId: payment.invoiceId.toString(),
          projectId: payment.projectId?.toString(),
          originalPaymentId: payment.originalPaymentId?.toString(),
        })),
        outstandingMinor: invoice.totalMinor - invoice.paidMinor,
      },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    console.error("Invoice detail could not be loaded.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json(
      { message: "Invoice details could not be loaded right now." },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  if (!validId(params.id)) {
    return NextResponse.json({ message: "Invoice not found." }, { status: 404, headers: PRIVATE_HEADERS });
  }
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  if (
    typeof body.value === "object" &&
    body.value !== null &&
    "action" in body.value &&
    (body.value.action === "issue" || body.value.action === "void")
  ) {
    try {
      const item = await setInvoiceAction(params.id, body.value.action, actorId);
      return NextResponse.json({ item: serialize(item as never) }, { headers: PRIVATE_HEADERS });
    } catch (error) {
      if (error instanceof FinanceError) {
        return NextResponse.json({ message: error.message }, { status: error.statusCode, headers: PRIVATE_HEADERS });
      }
      console.error("Invoice action failed.", error instanceof Error ? error.name : "UnknownError");
      return NextResponse.json({ message: "The invoice could not be updated." }, { status: 500, headers: PRIVATE_HEADERS });
    }
  }

  const parsed = invoiceInputSchema.safeParse(body.value);
  if (!parsed.success) return badInput("Check the invoice details and line items.");
  try {
    const item = await updateDraftInvoice(params.id, parsed.data, actorId);
    return NextResponse.json({ item: serialize(item as never) }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    if (error instanceof FinanceError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode, headers: PRIVATE_HEADERS });
    }
    console.error("Draft invoice update failed.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "The draft invoice could not be updated." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  if (!validId(params.id)) {
    return NextResponse.json({ message: "Invoice not found." }, { status: 404, headers: PRIVATE_HEADERS });
  }
  try {
    await connectToDatabase();
    const invoice = await Invoice.findById(params.id).exec();
    if (!invoice) {
      return NextResponse.json({ message: "Invoice not found." }, { status: 404, headers: PRIVATE_HEADERS });
    }
    if (invoice.status !== "Draft" || invoice.issuedAt) {
      return NextResponse.json(
        { message: "Only draft invoices can be deleted. Issued invoices must be voided." },
        { status: 409, headers: PRIVATE_HEADERS },
      );
    }
    await Invoice.deleteOne({ _id: invoice._id }).exec();
    await AuditLog.create({
      actorId,
      action: "invoice.draft_deleted",
      entityType: "invoice",
      entityId: invoice._id.toString(),
      summary: `Deleted draft ${invoice.invoiceNumber}.`,
    });
    return NextResponse.json({ ok: true }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error("Draft invoice deletion failed.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "The draft invoice could not be deleted." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}
