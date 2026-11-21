import type { InvoiceLineItem, InvoiceRecord } from "@/models/finance";

export function calculateInvoiceAmounts(
  lineItems: InvoiceLineItem[],
  discountMinor: number,
  taxRateBps: number,
) {
  const subtotalMinor = lineItems.reduce((total, item) => {
    const lineTotal = item.quantity * item.unitAmountMinor;
    if (!Number.isSafeInteger(lineTotal) || !Number.isSafeInteger(total + lineTotal)) {
      throw new Error("Invoice amount exceeds the supported limit.");
    }
    return total + lineTotal;
  }, 0);

  if (!Number.isSafeInteger(discountMinor) || discountMinor < 0 || discountMinor > subtotalMinor) {
    throw new Error("Discount cannot exceed the invoice subtotal.");
  }
  if (!Number.isSafeInteger(taxRateBps) || taxRateBps < 0 || taxRateBps > 10000) {
    throw new Error("Tax rate is outside the supported range.");
  }

  const taxableMinor = subtotalMinor - discountMinor;
  const taxMinor = Math.round((taxableMinor * taxRateBps) / 10000);
  const totalMinor = taxableMinor + taxMinor;
  if (!Number.isSafeInteger(totalMinor)) {
    throw new Error("Invoice amount exceeds the supported limit.");
  }

  return { subtotalMinor, discountMinor, taxRateBps, taxMinor, totalMinor };
}

export function getInvoiceStatus(
  invoice: Pick<InvoiceRecord, "status" | "issuedAt" | "dueDate" | "paidMinor" | "totalMinor">,
  now = new Date(),
): InvoiceRecord["status"] {
  if (invoice.status === "Void") return "Void";
  if (!invoice.issuedAt) return "Draft";
  if (invoice.paidMinor >= invoice.totalMinor) return "Paid";
  if (invoice.paidMinor > 0) return "Partially Paid";
  if (invoice.dueDate.getTime() < now.getTime()) return "Overdue";
  return "Issued";
}

export function formatINR(amountMinor: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}
