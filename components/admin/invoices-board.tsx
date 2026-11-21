"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Download, Plus, ReceiptText } from "lucide-react";
import { formatINR } from "@/lib/finance/money";

interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  totalMinor: number;
  paidMinor: number;
  status: string;
  projectId?: string;
  lineItems: { title: string; quantity: number; unitAmountMinor: number }[];
}

export function InvoicesBoard() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    clientName: "",
    billingAddress: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    discountMinor: 0,
    taxRateBps: 0,
    title: "",
    quantity: 1,
    unitAmountMinor: 0,
  });

  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/admin/invoices", { cache: "no-store" });
    const result = await response.json();
    if (response.ok) setItems(result.items ?? []);
    else setError(result.message || "Invoices could not be loaded.");
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const createInvoice = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issueDate: form.issueDate,
        dueDate: form.dueDate,
        clientName: form.clientName,
        billingAddress: form.billingAddress,
        clientTaxDetails: "",
        lineItems: [{
          title: form.title,
          quantity: Number(form.quantity),
          unitAmountMinor: Number(form.unitAmountMinor),
        }],
        discountMinor: Number(form.discountMinor),
        taxRateBps: Number(form.taxRateBps),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.message || "The invoice could not be created.");
      return;
    }
    setOpen(false);
    setNotice("Draft invoice created.");
    await load();
  };

  const issueInvoice = async (invoice: Invoice) => {
    const response = await fetch(`/api/admin/invoices/${invoice._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "issue" }),
    });
    if (!response.ok) {
      const result = await response.json();
      setError(result.message || "The invoice could not be issued.");
      return;
    }
    setNotice("Invoice issued.");
    await load();
  };

  const recordPayment = async (invoice: Invoice) => {
    const amount = window.prompt("Payment amount in paise");
    if (!amount) return;
    const amountMinor = Number(amount);
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 1) {
      setError("Enter a valid amount in paise.");
      return;
    }
    const idempotencyKey = crypto.randomUUID();
    const response = await fetch(`/api/admin/invoices/${invoice._id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "receipt",
        amountMinor,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: "UPI",
        transactionReference: "",
        notes: "",
        idempotencyKey,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.message || "The payment could not be recorded.");
      return;
    }
    setNotice(result.duplicate ? "Payment was already recorded." : "Payment recorded.");
    await load();
  };

  return (
    <div className="agency-page">
      <div className="admin-page-heading">
        <div><span className="admin-page-eyebrow">BILLING / INVOICES</span><h2>Invoices</h2><p>Create draft invoices, issue them, and record actual payments.</p></div>
        <button className="admin-primary-action" onClick={() => setOpen(true)} type="button"><Plus size={16} /> Create invoice</button>
      </div>
      {notice && <div className="agency-notice" role="status">{notice}</div>}
      {error && <div className="agency-error" role="alert">{error}</div>}

      {open && (
        <div className="agency-modal-backdrop" onMouseDown={() => setOpen(false)}>
          <form className="agency-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={createInvoice}>
            <div className="agency-modal__heading"><div><span className="admin-page-eyebrow">NEW DRAFT</span><h3>Create invoice</h3></div><button onClick={() => setOpen(false)} type="button">×</button></div>
            <div className="agency-form-grid">
              <label>Client name<input required value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} /></label>
              <label>Issue date<input required type="date" value={form.issueDate} onChange={(event) => setForm({ ...form, issueDate: event.target.value })} /></label>
              <label>Due date<input required type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label>
              <label>Line item<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
              <label>Quantity<input required min="1" type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} /></label>
              <label>Unit amount (paise)<input required min="0" type="number" value={form.unitAmountMinor} onChange={(event) => setForm({ ...form, unitAmountMinor: Number(event.target.value) })} /></label>
              <label>Discount (paise)<input min="0" type="number" value={form.discountMinor} onChange={(event) => setForm({ ...form, discountMinor: Number(event.target.value) })} /></label>
              <label>Tax (basis points)<input min="0" max="10000" type="number" value={form.taxRateBps} onChange={(event) => setForm({ ...form, taxRateBps: Number(event.target.value) })} /></label>
              <label className="agency-form-grid__full">Billing address<textarea rows={3} value={form.billingAddress} onChange={(event) => setForm({ ...form, billingAddress: event.target.value })} /></label>
            </div>
            <div className="agency-modal__actions"><button type="button" onClick={() => setOpen(false)}>Cancel</button><button className="admin-primary-action" type="submit">Create draft</button></div>
          </form>
        </div>
      )}

      {loading ? <div className="agency-loading">Loading invoices…</div> : (
        <div className="agency-list">
          {items.map((invoice) => (
            <article className="agency-invoice-row" key={invoice._id}>
              <span className="agency-project-card__icon"><ReceiptText size={17} /></span>
              <div><strong>{invoice.invoiceNumber}</strong><small>{invoice.clientName}</small></div>
              <div><small>Due</small><strong>{invoice.dueDate?.slice(0, 10)}</strong></div>
              <div><small>Total</small><strong>{formatINR(invoice.totalMinor)}</strong></div>
              <div><small>Outstanding</small><strong>{formatINR(invoice.totalMinor - invoice.paidMinor)}</strong></div>
              <span className="agency-status">{invoice.status}</span>
              <div className="agency-invoice-row__actions">
                {invoice.status === "Draft" && <button type="button" onClick={() => void issueInvoice(invoice)}>Issue</button>}
                {["Issued", "Partially Paid", "Overdue"].includes(invoice.status) && <button type="button" onClick={() => void recordPayment(invoice)}>Record payment</button>}
                {["Issued", "Paid", "Overdue", "Partially Paid"].includes(invoice.status) && <a aria-label={`Download ${invoice.invoiceNumber}`} href={`/api/admin/invoices/${invoice._id}/pdf`}><Download size={15} /></a>}
              </div>
            </article>
          ))}
          {items.length === 0 && <div className="agency-empty">No invoices have been created yet.</div>}
        </div>
      )}
    </div>
  );
}
