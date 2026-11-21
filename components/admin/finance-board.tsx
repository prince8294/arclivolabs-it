"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, WalletCards } from "lucide-react";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/validations/business";
import { formatINR } from "@/lib/finance/money";

interface Expense {
  _id: string;
  title: string;
  category: string;
  amountMinor: number;
  date: string;
  paymentStatus: "Draft" | "Unpaid" | "Paid";
  paymentMethod: string;
  projectId?: string;
}

export function FinanceBoard() {
  const [items, setItems] = useState<Expense[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: "Other",
    amountMinor: 0,
    date: new Date().toISOString().slice(0, 10),
    paymentStatus: "Unpaid",
    paymentMethod: "Other",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/admin/finance/expenses", { cache: "no-store" });
    const result = await response.json();
    if (response.ok) setItems(result.items ?? []);
    else setError(result.message || "Expenses could not be loaded.");
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const createExpense = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/finance/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amountMinor: Number(form.amountMinor) }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.message || "The expense could not be created.");
      return;
    }
    setOpen(false);
    setNotice("Expense recorded.");
    await load();
  };

  const paidTotal = items.filter((item) => item.paymentStatus === "Paid").reduce((sum, item) => sum + item.amountMinor, 0);
  const unpaidTotal = items.filter((item) => item.paymentStatus !== "Paid").reduce((sum, item) => sum + item.amountMinor, 0);

  return (
    <div className="agency-page">
      <div className="admin-page-heading">
        <div><span className="admin-page-eyebrow">FINANCE / EXPENSES</span><h2>Finance</h2><p>Record cash expenses and review paid and unpaid costs.</p></div>
        <button className="admin-primary-action" onClick={() => setOpen(true)} type="button"><Plus size={16} /> Add expense</button>
      </div>
      {notice && <div className="agency-notice" role="status">{notice}</div>}
      {error && <div className="agency-error" role="alert">{error}</div>}
      <section className="admin-metrics" aria-label="Expense summary">
        <article className="admin-metric"><div className="admin-metric__top"><span>Paid expenses</span><WalletCards size={17} /></div><strong>{formatINR(paidTotal)}</strong></article>
        <article className="admin-metric"><div className="admin-metric__top"><span>Unpaid / draft</span><WalletCards size={17} /></div><strong>{formatINR(unpaidTotal)}</strong></article>
      </section>

      {open && (
        <div className="agency-modal-backdrop" onMouseDown={() => setOpen(false)}>
          <form className="agency-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={createExpense}>
            <div className="agency-modal__heading"><div><span className="admin-page-eyebrow">NEW EXPENSE</span><h3>Add expense</h3></div><button onClick={() => setOpen(false)} type="button">×</button></div>
            <div className="agency-form-grid">
              <label>Expense title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
              <label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{EXPENSE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label>Amount (paise)<input required min="1" type="number" value={form.amountMinor} onChange={(event) => setForm({ ...form, amountMinor: Number(event.target.value) })} /></label>
              <label>Date<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
              <label>Payment status<select value={form.paymentStatus} onChange={(event) => setForm({ ...form, paymentStatus: event.target.value })}><option>Draft</option><option>Unpaid</option><option>Paid</option></select></label>
              <label>Payment method<select value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}>{PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}</select></label>
              <label className="agency-form-grid__full">Notes<textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
            </div>
            <div className="agency-modal__actions"><button type="button" onClick={() => setOpen(false)}>Cancel</button><button className="admin-primary-action" type="submit">Add expense</button></div>
          </form>
        </div>
      )}

      {loading ? <div className="agency-loading">Loading expenses…</div> : (
        <div className="agency-list">
          {items.map((expense) => (
            <article className="agency-invoice-row" key={expense._id}>
              <span className="agency-project-card__icon"><WalletCards size={17} /></span>
              <div><strong>{expense.title}</strong><small>{expense.category}</small></div>
              <div><small>Date</small><strong>{expense.date?.slice(0, 10)}</strong></div>
              <div><small>Amount</small><strong>{formatINR(expense.amountMinor)}</strong></div>
              <span className="agency-status">{expense.paymentStatus}</span>
              <span>{expense.paymentMethod}</span>
            </article>
          ))}
          {items.length === 0 && <div className="agency-empty">No expenses have been recorded.</div>}
        </div>
      )}
    </div>
  );
}
