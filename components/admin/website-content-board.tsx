"use client";

import Link from "next/link";
import { BriefcaseBusiness, Layers3, Settings } from "lucide-react";

export function WebsiteContentBoard() {
  return (
    <div className="agency-page">
      <div className="admin-page-heading">
        <div><span className="admin-page-eyebrow">PUBLIC WEBSITE / CONTENT</span><h2>Website content</h2><p>Publish portfolio work and maintain the public service list.</p></div>
      </div>
      <div className="agency-card-grid agency-card-grid--links">
        <Link className="agency-project-card" href="/admin/website-content/portfolio"><span className="agency-project-card__icon"><BriefcaseBusiness size={18} /></span><h3>Portfolio</h3><p>Add, publish and reorder public portfolio projects.</p></Link>
        <Link className="agency-project-card" href="/admin/website-content/services"><span className="agency-project-card__icon"><Layers3 size={18} /></span><h3>Services</h3><p>Edit descriptions, visibility and display order.</p></Link>
      </div>
    </div>
  );
}
