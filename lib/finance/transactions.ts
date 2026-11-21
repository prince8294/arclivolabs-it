import mongoose, { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import {
  AuditLog,
  BusinessSettings,
  ClientProject,
  Counter,
} from "@/models/business";
import {
  Invoice,
  Payment,
  type InvoiceRecord,
  type PaymentRecord,
} from "@/models/finance";
import { calculateInvoiceAmounts, getInvoiceStatus } from "./money";
import type { InvoiceInput, PaymentInput } from "@/lib/validations/business";

export class FinanceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "FinanceError";
  }
}

export async function createDraftInvoice(input: InvoiceInput, actorId: string) {
  await connectToDatabase();
  const settings = await BusinessSettings.findById("primary").lean().exec();
  if (input.taxRateBps > 0 && !settings?.gstRegistered) {
    throw new FinanceError(
      "Tax can only be added after GST registration is configured in business settings.",
      400,
    );
  }

  let project: { _id: Types.ObjectId; name: string; clientName: string; clientEmail?: string } | null = null;
  if (input.projectId) {
    project = await ClientProject.findById(input.projectId)
      .select("name clientName email")
      .lean()
      .exec();
    if (!project) throw new FinanceError("The selected project was not found.", 404);
  }

  let amounts;
  try {
    amounts = calculateInvoiceAmounts(
      input.lineItems,
      input.discountMinor,
      input.taxRateBps,
    );
  } catch (error) {
    throw new FinanceError(
      error instanceof Error ? error.message : "The invoice totals are invalid.",
      400,
    );
  }

  const session = await mongoose.startSession();
  let created: (InvoiceRecord & { _id: Types.ObjectId }) | null = null;
  try {
    await session.withTransaction(async () => {
      const currentSettings = await BusinessSettings.findById("primary")
        .session(session)
        .lean()
        .exec();
      const prefix = currentSettings?.invoicePrefix || "ATL";
      const year = new Date(`${input.issueDate}T00:00:00.000Z`).getUTCFullYear();
      const counterId = `invoice:${prefix}:${year}`;
      const counter = await Counter.findOneAndUpdate(
        { _id: counterId },
        { $inc: { value: 1 } },
        { new: true, upsert: true, session },
      ).exec();
      if (!counter) throw new Error("Invoice number could not be reserved.");
      const invoiceNumber = `${prefix}-${year}-${String(counter.value).padStart(4, "0")}`;
      const [invoice] = await Invoice.create(
        [
          {
            invoiceNumber,
            issueDate: new Date(`${input.issueDate}T00:00:00.000Z`),
            dueDate: new Date(`${input.dueDate}T23:59:59.999Z`),
            clientName: project?.clientName ?? input.clientName,
            clientEmail: project?.clientEmail ?? input.clientEmail ?? "",
            billingAddress: input.billingAddress,
            clientTaxDetails: input.clientTaxDetails,
            projectId: project?._id,
            projectName: project?.name,
            lineItems: input.lineItems,
            ...amounts,
            paidMinor: 0,
            status: "Draft",
            paymentInstructions:
              input.paymentInstructions || currentSettings?.paymentInstructions || "",
            internalNotes: input.internalNotes,
          },
        ],
        { session },
      );
      await AuditLog.create(
        [
          {
            actorId,
            action: "invoice.created",
            entityType: "invoice",
            entityId: invoice._id.toString(),
            summary: `Created draft ${invoiceNumber}.`,
            changes: { totalMinor: invoice.totalMinor },
          },
        ],
        { session },
      );
      created = invoice.toObject() as InvoiceRecord & { _id: Types.ObjectId };
    });
  } finally {
    await session.endSession();
  }
  if (!created) throw new Error("Draft invoice creation did not complete.");
  return created;
}

export async function updateDraftInvoice(
  invoiceId: string,
  input: InvoiceInput,
  actorId: string,
) {
  if (!Types.ObjectId.isValid(invoiceId)) {
    throw new FinanceError("Invoice not found.", 404);
  }
  await connectToDatabase();
  const invoice = await Invoice.findById(invoiceId).exec();
  if (!invoice) throw new FinanceError("Invoice not found.", 404);
  if (invoice.status !== "Draft" || invoice.issuedAt) {
    throw new FinanceError("Only draft invoices can be edited.", 409);
  }
  const settings = await BusinessSettings.findById("primary").lean().exec();
  if (input.taxRateBps > 0 && !settings?.gstRegistered) {
    throw new FinanceError("Tax is unavailable until GST registration is configured.", 400);
  }
  const amounts = calculateInvoiceAmounts(
    input.lineItems,
    input.discountMinor,
    input.taxRateBps,
  );
  const project = input.projectId
    ? await ClientProject.findById(input.projectId).select("name clientName email").lean().exec()
    : null;
  if (input.projectId && !project) throw new FinanceError("The selected project was not found.", 404);

  Object.assign(invoice, {
    issueDate: new Date(`${input.issueDate}T00:00:00.000Z`),
    dueDate: new Date(`${input.dueDate}T23:59:59.999Z`),
    clientName: project?.clientName ?? input.clientName,
    clientEmail: project?.email ?? input.clientEmail ?? "",
    billingAddress: input.billingAddress,
    clientTaxDetails: input.clientTaxDetails,
    projectId: project?._id,
    projectName: project?.name,
    lineItems: input.lineItems,
    ...amounts,
    paymentInstructions: input.paymentInstructions || settings?.paymentInstructions || "",
    internalNotes: input.internalNotes,
  });
  await invoice.save();
  await AuditLog.create({
    actorId,
    action: "invoice.draft_updated",
    entityType: "invoice",
    entityId: invoice._id.toString(),
    summary: `Updated draft ${invoice.invoiceNumber}.`,
    changes: { totalMinor: invoice.totalMinor },
  });
  return invoice.toObject();
}

export async function setInvoiceAction(
  invoiceId: string,
  action: "issue" | "void",
  actorId: string,
) {
  if (!Types.ObjectId.isValid(invoiceId)) throw new FinanceError("Invoice not found.", 404);
  await connectToDatabase();
  const session = await mongoose.startSession();
  let result: (InvoiceRecord & { _id: Types.ObjectId }) | null = null;
  try {
    await session.withTransaction(async () => {
      const invoice = await Invoice.findById(invoiceId).session(session).exec();
      if (!invoice) throw new FinanceError("Invoice not found.", 404);
      if (action === "issue") {
        if (invoice.status !== "Draft") throw new FinanceError("Only draft invoices can be issued.", 409);
        invoice.issuedAt = new Date();
        invoice.status = getInvoiceStatus(invoice);
        await invoice.save({ session });
      } else {
        if (invoice.status === "Void") throw new FinanceError("This invoice is already void.", 409);
        if (invoice.paidMinor > 0) {
          throw new FinanceError("An invoice with recorded payments cannot be voided. Record a refund first.", 409);
        }
        invoice.status = "Void";
        invoice.voidedAt = new Date();
        await invoice.save({ session });
      }
      await AuditLog.create(
        [
          {
            actorId,
            action: action === "issue" ? "invoice.issued" : "invoice.voided",
            entityType: "invoice",
            entityId: invoice._id.toString(),
            summary: `${action === "issue" ? "Issued" : "Voided"} ${invoice.invoiceNumber}.`,
          },
        ],
        { session },
      );
      result = invoice.toObject() as InvoiceRecord & { _id: Types.ObjectId };
    });
  } finally {
    await session.endSession();
  }
  if (!result) throw new Error("Invoice action did not complete.");
  return result;
}

export async function recordInvoicePayment(
  invoiceId: string,
  input: PaymentInput,
  actorId: string,
) {
  if (!Types.ObjectId.isValid(invoiceId)) throw new FinanceError("Invoice not found.", 404);
  await connectToDatabase();
  const alreadyRecorded = await Payment.findOne({ idempotencyKey: input.idempotencyKey })
    .lean()
    .exec();
  if (alreadyRecorded) {
    if (alreadyRecorded.invoiceId.toString() !== invoiceId) {
      throw new FinanceError("This payment submission key has already been used.", 409);
    }
    return { payment: alreadyRecorded, duplicate: true };
  }

  const session = await mongoose.startSession();
  let payment: (PaymentRecord & { _id: Types.ObjectId }) | null = null;
  try {
    await session.withTransaction(async () => {
      const invoice = await Invoice.findById(invoiceId).session(session).exec();
      if (!invoice) throw new FinanceError("Invoice not found.", 404);
      if (!invoice.issuedAt || invoice.status === "Void") {
        throw new FinanceError("Payments can only be recorded on issued invoices.", 409);
      }
      if (input.kind === "receipt") {
        if (input.amountMinor > invoice.totalMinor - invoice.paidMinor) {
          throw new FinanceError("Payment exceeds the outstanding invoice balance.", 400);
        }
      } else {
        if (!input.originalPaymentId || !Types.ObjectId.isValid(input.originalPaymentId)) {
          throw new FinanceError("Select the original payment to refund or reverse.", 400);
        }
        const original = await Payment.findOne({
          _id: input.originalPaymentId,
          invoiceId: invoice._id,
          kind: "receipt",
        })
          .session(session)
          .lean()
          .exec();
        if (!original) throw new FinanceError("The original payment was not found.", 404);
        const priorAdjustments = await Payment.aggregate<{ total: number }>([
          {
            $match: {
              originalPaymentId: original._id,
              kind: { $in: ["refund", "reversal"] },
            },
          },
          { $group: { _id: null, total: { $sum: "$amountMinor" } } },
        ])
          .session(session)
          .exec();
        if ((priorAdjustments[0]?.total ?? 0) + input.amountMinor > original.amountMinor) {
          throw new FinanceError("Refund exceeds the unrefunded original payment.", 400);
        }
        if (input.amountMinor > invoice.paidMinor) {
          throw new FinanceError("Refund exceeds the net amount collected.", 400);
        }
      }

      const amountChange = input.kind === "receipt" ? input.amountMinor : -input.amountMinor;
      const nextPaid = invoice.paidMinor + amountChange;
      const updated = await Invoice.findOneAndUpdate(
        {
          _id: invoice._id,
          paidMinor: invoice.paidMinor,
          status: { $ne: "Void" },
        },
        {
          $set: {
            paidMinor: nextPaid,
            status: getInvoiceStatus({
              status: invoice.status,
              issuedAt: invoice.issuedAt,
              dueDate: invoice.dueDate,
              paidMinor: nextPaid,
              totalMinor: invoice.totalMinor,
            }),
          },
        },
        { new: true, session, runValidators: true },
      ).exec();
      if (!updated) throw new FinanceError("The invoice changed. Refresh and retry.", 409);

      const [createdPayment] = await Payment.create(
        [
          {
            invoiceId: invoice._id,
            projectId: invoice.projectId,
            kind: input.kind,
            amountMinor: input.amountMinor,
            paymentDate: new Date(`${input.paymentDate}T12:00:00.000Z`),
            paymentMethod: input.paymentMethod,
            transactionReference: input.transactionReference,
            notes: input.notes,
            originalPaymentId: input.originalPaymentId,
            idempotencyKey: input.idempotencyKey,
          },
        ],
        { session },
      );
      await AuditLog.create(
        [
          {
            actorId,
            action: `payment.${input.kind}`,
            entityType: "invoice",
            entityId: invoice._id.toString(),
            summary: `${input.kind} recorded for ${invoice.invoiceNumber}.`,
            changes: { amountMinor: input.amountMinor, paymentId: createdPayment._id.toString() },
          },
        ],
        { session },
      );
      payment = createdPayment.toObject() as PaymentRecord & { _id: Types.ObjectId };
    });
  } finally {
    await session.endSession();
  }
  if (!payment) throw new Error("Payment recording did not complete.");
  return { payment, duplicate: false };
}
