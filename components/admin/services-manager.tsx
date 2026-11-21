"use client";

import { useEffect, useState } from "react";

interface Service {
  _id: string;
  name: string;
  shortDescription: string;
  description: string;
  iconId: string;
  displayOrder: number;
  visible: boolean;
}

export function ServicesManager() {
  const [items, setItems] = useState<Service[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    const response = await fetch("/api/admin/services", { cache: "no-store" });
    const result = await response.json();
    if (response.ok) setItems(result.items ?? []);
  };
  useEffect(() => { void load(); }, []);

  const save = async (item: Service) => {
    const response = await fetch("/api/admin/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item._id,
        name: item.name,
        shortDescription: item.shortDescription,
        description: item.description,
        iconId: item.iconId,
        displayOrder: item.displayOrder,
        visible: item.visible,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.message || "The service could not be saved.");
      return;
    }
    setNotice("Service updated.");
  };

  return (
    <div className="agency-page">
      <div className="admin-page-heading">
        <div><span className="admin-page-eyebrow">WEBSITE CONTENT / SERVICES</span><h2>Services</h2><p>Maintain the nine core ArclivoLabs service offerings.</p></div>
      </div>
      {notice && <div className="agency-notice" role="status">{notice}</div>}
      {error && <div className="agency-error" role="alert">{error}</div>}
      <div className="agency-services">
        {items.map((item) => (
          <article className="agency-service-row" key={item._id}>
            <div className="agency-form-grid">
              <label>Service name<input value={item.name} onChange={(event) => setItems((current) => current.map((row) => row._id === item._id ? { ...row, name: event.target.value } : row))} /></label>
              <label>Display order<input type="number" min="0" value={item.displayOrder} onChange={(event) => setItems((current) => current.map((row) => row._id === item._id ? { ...row, displayOrder: Number(event.target.value) } : row))} /></label>
              <label className="agency-form-grid__full">Description<textarea rows={3} value={item.description} onChange={(event) => setItems((current) => current.map((row) => row._id === item._id ? { ...row, description: event.target.value } : row))} /></label>
              <label><input type="checkbox" checked={item.visible} onChange={(event) => setItems((current) => current.map((row) => row._id === item._id ? { ...row, visible: event.target.checked } : row))} /> Visible publicly</label>
            </div>
            <button className="admin-primary-action" onClick={() => void save(item)} type="button">Save changes</button>
          </article>
        ))}
      </div>
    </div>
  );
}
