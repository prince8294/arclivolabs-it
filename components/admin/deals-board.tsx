"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, BriefcaseBusiness, ArrowUpRight } from "lucide-react";
import { DEAL_STATUSES, SERVICE_IDS } from "@/lib/validations/business";
import { formatINR } from "@/lib/finance/money";

interface Deal {
  _id: string;
  title: string;
  clientName: string;
  businessName?: string;
  serviceName: string;
  amountMinor: number;
  status: (typeof DEAL_STATUSES)[number];
  expectedCloseDate?: string;
  requirements?: string;
  leadId?: string;
  serviceId: string;
}

export function DealsBoard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    clientName: "",
    businessName: "",
    title: "",
    serviceId: "website-development",
    amountMinor: 0,
    expectedCloseDate: "",
    status: "New",
    requirements: "",
  });

  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/admin/deals", { cache: "no-store" });
    const result = await response.json();
    if (response.ok) setDeals(result.items ?? []);
    else setError(result.message || "Deals could not be loaded.");
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const createDeal = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amountMinor: Number(form.amountMinor),
        status: form.status,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.message || "The deal could not be created.");
      return;
    }
    setOpen(false);
    setNotice("Deal created.");
    await load();
  };

  const updateStatus = async (deal: Deal, status: Deal["status"]) => {
    setError("");
    const response = await fetch(`/api/admin/deals/${deal._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: deal.leadId || "",
        clientName: deal.clientName,
        businessName: deal.businessName || "",
        email: "",
        phone: "",
        title: deal.title,
        serviceId: deal.serviceId,
        amountMinor: deal.amountMinor,
        expectedCloseDate: deal.expectedCloseDate
          ? deal.expectedCloseDate.slice(0, 10)
          : "",
        status,
        requirements: deal.requirements || "",
        internalNotes: "",
      }),
    });
    if (!response.ok) {
      const result = await response.json();
      setError(result.message || "The deal stage could not be changed.");
      return;
    }
    setNotice(status === "Won" ? "Deal marked won." : "Deal stage updated.");
    await load();
  };

  const createProject = async (deal: Deal) => {
    const response = await fetch(`/api/admin/deals/${deal._id}/project`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.message || "The project could not be created.");
      return;
    }
    setNotice(result.created ? "Client project created." : "Existing project opened.");
  };

  return (
    <div className="agency-page">
      <div className="admin-page-heading">
        <div>
          <span className="admin-page-eyebrow">SALES / PIPELINE</span>
          <h2>Deals</h2>
          <p>Move opportunities from conversation to a won project.</p>
        </div>
        <button className="admin-primary-action" onClick={() => setOpen(true)} type="button">
          <Plus size={16} /> Create deal
        </button>
      </div>

      {notice && <div className="agency-notice" role="status">{notice}</div>}
      {error && <div className="agency-error" role="alert">{error}</div>}

      {open && (
        <div className="agency-modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <form className="agency-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={createDeal}>
            <div className="agency-modal__heading">
              <div><span className="admin-page-eyebrow">NEW OPPORTUNITY</span><h3>Create deal</h3></div>
              <button aria-label="Close" onClick={() => setOpen(false)} type="button">×</button>
            </div>
            <div className="agency-form-grid">
              <label>Client name<input required value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} /></label>
              <label>Business name<input value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} /></label>
              <label>Deal title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
              <label>Service<select value={form.serviceId} onChange={(event) => setForm({ ...form, serviceId: event.target.value })}>{SERVICE_IDS.map((service) => <option key={service} value={service}>{service}</option>)}</select></label>
              <label>Amount (paise)<input required min="0" type="number" value={form.amountMinor} onChange={(event) => setForm({ ...form, amountMinor: Number(event.target.value) })} /></label>
              <label>Expected close<input type="date" value={form.expectedCloseDate} onChange={(event) => setForm({ ...form, expectedCloseDate: event.target.value })} /></label>
              <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{DEAL_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label className="agency-form-grid__full">Requirements<textarea rows={4} value={form.requirements} onChange={(event) => setForm({ ...form, requirements: event.target.value })} /></label>
            </div>
            <div className="agency-modal__actions"><button type="button" onClick={() => setOpen(false)}>Cancel</button><button className="admin-primary-action" type="submit">Create deal</button></div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="agency-loading">Loading deals…</div>
      ) : (
        <div className="agency-kanban">
          {DEAL_STATUSES.map((status) => (
            <section className="agency-kanban__column" key={status}>
              <header><span>{status}</span><strong>{deals.filter((deal) => deal.status === status).length}</strong></header>
              {deals.filter((deal) => deal.status === status).map((deal) => (
                <article className="agency-deal-card" key={deal._id}>
                  <div className="agency-deal-card__top"><BriefcaseBusiness size={15} /><span>{deal.businessName || deal.clientName}</span></div>
                  <h3>{deal.title}</h3>
                  <strong>{formatINR(deal.amountMinor)}</strong>
                  <small>{deal.expectedCloseDate ? `Close ${deal.expectedCloseDate.slice(0, 10)}` : "No close date"}</small>
                  <div className="agency-deal-card__actions">
                    <select aria-label={`Change stage for ${deal.title}`} value={deal.status} onChange={(event) => void updateStatus(deal, event.target.value as Deal["status"])}>
                      {DEAL_STATUSES.map((option) => <option key={option}>{option}</option>)}
                    </select>
                    {deal.status === "Won" && <button onClick={() => void createProject(deal)} type="button">Create project <ArrowUpRight size={14} /></button>}
                  </div>
                </article>
              ))}
              {deals.filter((deal) => deal.status === status).length === 0 && <p className="agency-kanban__empty">No deals</p>}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
