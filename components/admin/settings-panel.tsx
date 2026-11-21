"use client";

import { useEffect, useState, type FormEvent } from "react";

export function SettingsPanel() {
  const [form, setForm] = useState({
    legalName: "ArclivoLabs Tech",
    logoUrl: "",
    address: "",
    phone: "",
    email: "",
    gstin: "",
    gstRegistered: false,
    invoicePrefix: "ATL",
    paymentInstructions: "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void fetch("/api/admin/settings", { cache: "no-store" })
      .then(async (response) => ({ response, result: await response.json() }))
      .then(({ response, result }) => {
        if (response.ok && result.item) setForm({
          legalName: result.item.legalName || "ArclivoLabs Tech",
          logoUrl: result.item.logoUrl || "",
          address: result.item.address || "",
          phone: result.item.phone || "",
          email: result.item.email || "",
          gstin: result.item.gstin || "",
          gstRegistered: Boolean(result.item.gstRegistered),
          invoicePrefix: result.item.invoicePrefix || "ATL",
          paymentInstructions: result.item.paymentInstructions || "",
        });
      });
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.message || "Settings could not be saved.");
      return;
    }
    setNotice("Business settings saved.");
  };

  return (
    <div className="agency-page">
      <div className="admin-page-heading"><div><span className="admin-page-eyebrow">ACCOUNT / SETTINGS</span><h2>Business settings</h2><p>Configure invoice branding and optional tax registration details.</p></div></div>
      {notice && <div className="agency-notice" role="status">{notice}</div>}
      {error && <div className="agency-error" role="alert">{error}</div>}
      <form className="agency-settings" onSubmit={save}>
        <div className="agency-form-grid">
          <label>Legal name<input required value={form.legalName} onChange={(event) => setForm({ ...form, legalName: event.target.value })} /></label>
          <label>Logo URL<input type="url" value={form.logoUrl} onChange={(event) => setForm({ ...form, logoUrl: event.target.value })} /></label>
          <label>Business email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Business phone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
          <label className="agency-form-grid__full">Business address<textarea rows={3} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
          <label>Invoice prefix<input required value={form.invoicePrefix} onChange={(event) => setForm({ ...form, invoicePrefix: event.target.value })} /></label>
          <label>GSTIN<input maxLength={15} value={form.gstin} onChange={(event) => setForm({ ...form, gstin: event.target.value.toUpperCase() })} /></label>
          <label><input type="checkbox" checked={form.gstRegistered} onChange={(event) => setForm({ ...form, gstRegistered: event.target.checked })} /> GST registered</label>
          <label className="agency-form-grid__full">Payment instructions<textarea rows={3} value={form.paymentInstructions} onChange={(event) => setForm({ ...form, paymentInstructions: event.target.value })} /></label>
        </div>
        <button className="admin-primary-action" type="submit">Save settings</button>
      </form>
    </div>
  );
}
