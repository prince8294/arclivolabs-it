"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

interface PortfolioItem {
  _id: string;
  title: string;
  slug: string;
  category: string;
  shortDescription: string;
  description: string;
  coverImageUrl: string;
  technologyStack: string[];
  completionYear?: number;
  projectType: "Client Project" | "In-house Project" | "Concept Project";
  liveUrl?: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  visual: "commerce" | "workspace" | "mobile";
  galleryImageUrls: string[];
}

export function PortfolioManager() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "",
    shortDescription: "",
    description: "",
    coverImageUrl: "",
    technologyStack: "",
    completionYear: new Date().getFullYear(),
    projectType: "Concept Project",
    liveUrl: "",
    featured: false,
    published: false,
    sortOrder: 0,
    visual: "commerce",
  });

  const load = async () => {
    const response = await fetch("/api/admin/portfolio", { cache: "no-store" });
    const result = await response.json();
    if (response.ok) setItems(result.items ?? []);
  };
  useEffect(() => { void load(); }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        technologyStack: form.technologyStack.split(",").map((item) => item.trim()).filter(Boolean),
        galleryImageUrls: [],
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.message || "The portfolio item could not be created.");
      return;
    }
    setOpen(false);
    setNotice("Portfolio item saved.");
    await load();
  };

  const update = async (item: PortfolioItem, changes: Partial<PortfolioItem>) => {
    const response = await fetch(`/api/admin/portfolio/${item._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: item.title,
        slug: item.slug,
        category: item.category,
        shortDescription: item.shortDescription,
        description: item.description,
        coverImageUrl: item.coverImageUrl || "",
        galleryImageUrls: item.galleryImageUrls || [],
        technologyStack: item.technologyStack || [],
        completionYear: item.completionYear,
        projectType: item.projectType,
        liveUrl: item.liveUrl || "",
        featured: item.featured,
        published: item.published,
        sortOrder: item.sortOrder,
        visual: item.visual,
        ...changes,
      }),
    });
    if (!response.ok) {
      const result = await response.json();
      setError(result.message || "The portfolio item could not be updated.");
      return;
    }
    setNotice("Portfolio item updated.");
    await load();
  };

  return (
    <div className="agency-page">
      <div className="admin-page-heading">
        <div><span className="admin-page-eyebrow">WEBSITE CONTENT / PORTFOLIO</span><h2>Portfolio</h2><p>Manage published and draft work without editing source code.</p></div>
        <button className="admin-primary-action" onClick={() => setOpen(true)} type="button"><Plus size={16} /> Add project</button>
      </div>
      {notice && <div className="agency-notice" role="status">{notice}</div>}
      {error && <div className="agency-error" role="alert">{error}</div>}
      {open && (
        <div className="agency-modal-backdrop" onMouseDown={() => setOpen(false)}>
          <form className="agency-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={save}>
            <div className="agency-modal__heading"><div><span className="admin-page-eyebrow">PUBLIC PROJECT</span><h3>Add portfolio project</h3></div><button onClick={() => setOpen(false)} type="button">×</button></div>
            <div className="agency-form-grid">
              <label>Title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
              <label>Slug<input required value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/\s+/g, "-") })} /></label>
              <label>Category<input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
              <label>Project type<select value={form.projectType} onChange={(event) => setForm({ ...form, projectType: event.target.value })}><option>Client Project</option><option>In-house Project</option><option>Concept Project</option></select></label>
              <label>Cover image URL<input type="url" placeholder="https://..." value={form.coverImageUrl} onChange={(event) => setForm({ ...form, coverImageUrl: event.target.value })} /></label>
              <label>Technology stack<input value={form.technologyStack} onChange={(event) => setForm({ ...form, technologyStack: event.target.value })} placeholder="Next.js, TypeScript" /></label>
              <label className="agency-form-grid__full">Short description<textarea required rows={2} value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} /></label>
              <label className="agency-form-grid__full">Detailed description<textarea required rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
              <label><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} /> Featured</label>
              <label><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /> Published</label>
            </div>
            <div className="agency-modal__actions"><button type="button" onClick={() => setOpen(false)}>Cancel</button><button className="admin-primary-action" type="submit">Save project</button></div>
          </form>
        </div>
      )}
      <div className="agency-list">
        {items.map((item) => (
          <article className="agency-invoice-row" key={item._id}>
            <div><strong>{item.title}</strong><small>{item.projectType} · {item.category}</small></div>
            <span className="agency-status">{item.published ? "Published" : "Draft"}</span>
            <label><input type="checkbox" checked={item.featured} onChange={(event) => void update(item, { featured: event.target.checked })} /> Featured</label>
            <button type="button" onClick={() => void update(item, { published: !item.published })}>{item.published ? "Unpublish" : "Publish"}</button>
          </article>
        ))}
      </div>
    </div>
  );
}
