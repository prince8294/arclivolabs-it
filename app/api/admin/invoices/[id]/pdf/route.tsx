import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { getAdminId } from "@/lib/admin/api";
import { connectToDatabase } from "@/lib/db/connect";
import { Invoice } from "@/models/finance";
import { BusinessSettings } from "@/models/business";
import { formatINR } from "@/lib/finance/money";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const styles = StyleSheet.create({
  page: { padding: 42, fontSize: 10, color: "#17181b", backgroundColor: "#fff" },
  top: { flexDirection: "row", justifyContent: "space-between", marginBottom: 36 },
  brand: { fontSize: 15, fontWeight: 700, letterSpacing: -0.5 },
  division: { marginTop: 4, fontSize: 8, color: "#747985" },
  invoiceTitle: { fontSize: 26, fontWeight: 700, color: "#365bff" },
  grid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  block: { width: "48%" },
  label: { fontSize: 8, color: "#858a93", marginBottom: 5 },
  value: { marginBottom: 3 },
  tableHead: { flexDirection: "row", backgroundColor: "#f3f5f8", padding: 8 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e8eaee", padding: 8 },
  colDescription: { width: "52%" },
  colQty: { width: "12%", textAlign: "right" },
  colUnit: { width: "18%", textAlign: "right" },
  colTotal: { width: "18%", textAlign: "right" },
  totals: { marginTop: 18, marginLeft: "58%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  grand: { marginTop: 5, paddingTop: 7, borderTopWidth: 1, borderTopColor: "#101114" },
  footer: { position: "absolute", left: 42, right: 42, bottom: 32, color: "#747985", fontSize: 8 },
});

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  if (!(await getAdminId())) {
    return NextResponse.json({ message: "Sign in to download invoices." }, { status: 401 });
  }
  if (!Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ message: "Invoice not found." }, { status: 404 });
  }
  await connectToDatabase();
  const invoice = await Invoice.findById(params.id).lean().exec();
  if (!invoice) {
    return NextResponse.json({ message: "Invoice not found." }, { status: 404 });
  }
  const settings = await BusinessSettings.findById("primary").lean().exec();
  const gstRegistered = Boolean(settings?.gstRegistered && settings.gstin);

  const pdf = await renderToBuffer(
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.top}>
          <View>
            <Text style={styles.brand}>{settings?.legalName || "ARCLIVOLABS TECH"}</Text>
            <Text style={styles.division}>INDEPENDENT DIGITAL ENGINEERING STUDIO</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={{ textAlign: "right", marginTop: 5 }}>{invoice.invoiceNumber}</Text>
          </View>
        </View>
        <View style={styles.grid}>
          <View style={styles.block}>
            <Text style={styles.label}>BILL TO</Text>
            <Text style={styles.value}>{invoice.clientName}</Text>
            {invoice.billingAddress ? <Text>{invoice.billingAddress}</Text> : null}
            {invoice.clientEmail ? <Text>{invoice.clientEmail}</Text> : null}
            {gstRegistered && invoice.clientTaxDetails ? (
              <Text>Tax details: {invoice.clientTaxDetails}</Text>
            ) : null}
          </View>
          <View style={styles.block}>
            <Text style={styles.label}>INVOICE DETAILS</Text>
            <Text style={styles.value}>Issue date: {invoice.issueDate.toISOString().slice(0, 10)}</Text>
            <Text style={styles.value}>Due date: {invoice.dueDate.toISOString().slice(0, 10)}</Text>
            <Text>Status: {invoice.status}</Text>
          </View>
        </View>
        {gstRegistered && settings?.gstin ? (
          <View style={{ marginBottom: 18 }}>
            <Text style={styles.label}>SELLER TAX INFORMATION</Text>
            <Text>GSTIN: {settings.gstin}</Text>
          </View>
        ) : null}
        <View style={styles.tableHead}>
          <Text style={styles.colDescription}>Description</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colUnit}>Unit price</Text>
          <Text style={styles.colTotal}>Amount</Text>
        </View>
        {invoice.lineItems.map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.colDescription}>{item.title}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colUnit}>{formatINR(item.unitAmountMinor)}</Text>
            <Text style={styles.colTotal}>{formatINR(item.quantity * item.unitAmountMinor)}</Text>
          </View>
        ))}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{formatINR(invoice.subtotalMinor)}</Text>
          </View>
          {invoice.discountMinor > 0 ? (
            <View style={styles.totalRow}>
              <Text>Discount</Text>
              <Text>-{formatINR(invoice.discountMinor)}</Text>
            </View>
          ) : null}
          {gstRegistered && invoice.taxMinor > 0 ? (
            <View style={styles.totalRow}>
              <Text>Tax ({invoice.taxRateBps / 100}%)</Text>
              <Text>{formatINR(invoice.taxMinor)}</Text>
            </View>
          ) : null}
          <View style={[styles.totalRow, styles.grand]}>
            <Text>Total</Text>
            <Text>{formatINR(invoice.totalMinor)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Paid</Text>
            <Text>{formatINR(invoice.paidMinor)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Outstanding</Text>
            <Text>{formatINR(invoice.totalMinor - invoice.paidMinor)}</Text>
          </View>
        </View>
        {invoice.paymentInstructions ? (
          <View style={{ marginTop: 28 }}>
            <Text style={styles.label}>PAYMENT INSTRUCTIONS</Text>
            <Text>{invoice.paymentInstructions}</Text>
          </View>
        ) : null}
        {settings?.address ? (
          <Text style={styles.footer}>
            {settings.address}
            {settings.phone ? `  |  ${settings.phone}` : ""}
            {settings.email ? `  |  ${settings.email}` : ""}
          </Text>
        ) : null}
      </Page>
    </Document>,
  );

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
