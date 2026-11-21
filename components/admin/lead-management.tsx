"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  FileText,
  LoaderCircle,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { SERVICE_OPTIONS } from "@/lib/service-options";
import { enquiryStatusValues, type EnquiryStatus } from "@/lib/validations/enquiry";
import type {
  EnquiryDetails,
  EnquirySummary,
  PaginatedEnquiries,
} from "@/types/admin";
import { StatusBadge } from "./status-badge";

interface LeadManagementProps {
  initialData: PaginatedEnquiries;
  initialQuery?: string;
  initialStatus?: string;
  initialProjectType?: string;
  initialSort?: "newest" | "oldest";
  initialSelected?: string;
}

interface ApiError {
  message?: string;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatConsentDate(value?: string | null) {
  if (!value) return "Recorded";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function LeadRow({
  enquiry,
  onOpen,
}: {
  enquiry: EnquirySummary;
  onOpen: (id: string) => void;
}) {
  return (
    <tr>
      <td>
        <strong>{enquiry.fullName}</strong>
        <small>{enquiry.email}</small>
      </td>
      <td>{enquiry.phone || "—"}</td>
      <td>{enquiry.companyName || "—"}</td>
      <td>{enquiry.projectType}</td>
      <td>{enquiry.estimatedBudget || "Not specified"}</td>
      <td><StatusBadge status={enquiry.status} /></td>
      <td>{formatDate(enquiry.createdAt)}</td>
      <td>
        <button
          aria-label={`View ${enquiry.fullName}'s enquiry`}
          className="admin-row-action"
          onClick={() => onOpen(enquiry.id)}
          type="button"
        >
          <ArrowDown aria-hidden="true" size={15} />
        </button>
      </td>
    </tr>
  );
}

function LeadCard({
  enquiry,
  onOpen,
}: {
  enquiry: EnquirySummary;
  onOpen: (id: string) => void;
}) {
  return (
    <article className="lead-mobile-card">
      <div className="lead-mobile-card__top">
        <div>
          <strong>{enquiry.fullName}</strong>
          <span>{enquiry.companyName || enquiry.email}</span>
        </div>
        <StatusBadge status={enquiry.status} />
      </div>
      <div className="lead-mobile-card__details">
        <span>{enquiry.projectType}</span>
        <span>{enquiry.estimatedBudget || "Budget not specified"}</span>
        <span>{formatDate(enquiry.createdAt)}</span>
      </div>
      <button
        className="lead-mobile-card__action"
        onClick={() => onOpen(enquiry.id)}
        type="button"
      >
        View enquiry <ChevronRight aria-hidden="true" size={16} />
      </button>
    </article>
  );
}

function EnquiryDrawer({
  id,
  onClose,
  onChanged,
}: {
  id: string;
  onClose: () => void;
  onChanged: (message: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [detail, setDetail] = useState<EnquiryDetails | null>(null);
  const [status, setStatus] = useState<EnquiryStatus>("New");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const loadDetail = async () => {
      try {
        const response = await fetch(`/api/admin/enquiries/${id}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = (await response.json()) as {
          item?: EnquiryDetails;
          message?: string;
        };
        if (!response.ok || !result.item) {
          setError(result.message || "This enquiry could not be loaded.");
          return;
        }
        setDetail(result.item);
        setStatus(result.item.status);
        setNotes(result.item.adminNotes);
      } catch {
        if (!controller.signal.aborted) {
          setError("This enquiry could not be loaded. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadDetail();
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0);
    const handleKeys = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeys);

    return () => {
      controller.abort();
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeys);
    };
  }, [id, onClose]);

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copied.`);
    } catch {
      setError(`Could not copy ${label.toLowerCase()}. Use the text directly instead.`);
    }
  };

  const saveChanges = async () => {
    if (!detail || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/enquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: notes }),
      });
      const result = (await response.json()) as {
        item?: EnquiryDetails;
        message?: string;
      };
      if (!response.ok || !result.item) {
        setError(result.message || "Changes could not be saved.");
        return;
      }
      setDetail(result.item);
      setStatus(result.item.status);
      setNotes(result.item.adminNotes);
      setNotice("Enquiry changes saved.");
      onChanged("Enquiry changes saved.");
    } catch {
      setError("Changes could not be saved. Your unsaved edits are still here.");
    } finally {
      setSaving(false);
    }
  };

  const deleteEnquiry = async () => {
    if (!detail || deleting) return;
    if (!window.confirm(`Delete the enquiry from ${detail.fullName}? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/enquiries/${id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as ApiError;
      if (!response.ok) {
        setError(result.message || "This enquiry could not be deleted.");
        return;
      }
      onChanged("Enquiry deleted.");
      onClose();
    } catch {
      setError("This enquiry could not be deleted. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const createDealFromLead = async () => {
    if (!detail) return;
    setError("");
    const serviceIds = [
      "website-development",
      "custom-software",
      "crm-dashboard",
      "ui-ux-design",
      "mobile-app",
      "shopify-development",
      "website-templates",
      "graphic-brand-design",
      "automation-api",
    ];
    const serviceIndex = SERVICE_OPTIONS.indexOf(detail.projectType);
    const response = await fetch("/api/admin/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: id,
        clientName: detail.fullName,
        businessName: detail.companyName || "",
        email: detail.email,
        phone: detail.phone || "",
        title: `${detail.companyName || detail.fullName} — ${detail.projectType}`,
        serviceId: serviceIndex >= 0 ? serviceIds[serviceIndex] : "custom-software",
        amountMinor: 0,
        status: "New",
        requirements: detail.projectDescription,
        internalNotes: detail.adminNotes,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.message || "The deal could not be created.");
      return;
    }
    setNotice("Deal created from this lead.");
  };

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        className="lead-drawer-backdrop"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
      >
        <motion.aside
          animate={{ x: 0 }}
          aria-labelledby="lead-drawer-title"
          aria-modal="true"
          className="lead-drawer"
          exit={{ x: "100%" }}
          initial={{ x: "100%" }}
          ref={drawerRef}
          role="dialog"
          transition={reduceMotion ? { duration: 0 } : { duration: 0.25 }}
        >
          <div className="lead-drawer__header">
            <div>
              <span className="admin-page-eyebrow">ENQUIRY / DETAILS</span>
              <h2 id="lead-drawer-title">Project enquiry</h2>
            </div>
            <button
              aria-label="Close enquiry details"
              className="lead-drawer__close"
              onClick={onClose}
              ref={closeRef}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>

          {loading ? (
            <div aria-label="Loading enquiry" className="lead-drawer__loading" role="status">
              <LoaderCircle aria-hidden="true" className="admin-spinner" size={20} />
              Loading enquiry…
            </div>
          ) : error && !detail ? (
            <div className="lead-drawer__error" role="alert">{error}</div>
          ) : detail ? (
            <div className="lead-drawer__content">
              {error && <p className="admin-inline-error" role="alert">{error}</p>}
              {notice && <p className="admin-inline-success" role="status">{notice}</p>}

              <section className="lead-detail-section">
                <h3>Client information</h3>
                <div className="lead-detail-grid">
                  <div><span>Full name</span><strong>{detail.fullName}</strong></div>
                  <div><span>Business</span><strong>{detail.companyName || "Not provided"}</strong></div>
                  <div className="lead-detail-grid__wide">
                    <span>Email address</span>
                    <strong>{detail.email}</strong>
                    <div className="lead-contact-actions">
                      <a href={`mailto:${detail.email}`}><Mail size={14} /> Email</a>
                      <button onClick={() => void copyValue(detail.email, "Email")} type="button">
                        <Clipboard size={13} /> Copy email
                      </button>
                    </div>
                  </div>
                  <div className="lead-detail-grid__wide">
                    <span>Phone number</span>
                    <strong>{detail.phone || "Not provided"}</strong>
                    {detail.phone && (
                      <div className="lead-contact-actions">
                        <a href={`tel:${detail.phone}`}><Phone size={14} /> Call</a>
                        <button onClick={() => void copyValue(detail.phone ?? "", "Phone number")} type="button">
                          <Clipboard size={13} /> Copy number
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="lead-detail-section">
                <h3>Project information</h3>
                <div className="lead-detail-grid">
                  <div><span>Project type</span><strong>{detail.projectType}</strong></div>
                  <div><span>Estimated budget</span><strong>{detail.estimatedBudget || "Not specified"}</strong></div>
                  <div className="lead-detail-grid__wide">
                    <span>Project description</span>
                    <p className="lead-description">{detail.projectDescription}</p>
                  </div>
                </div>
              </section>

              <section className="lead-detail-section lead-detail-section--manage">
                <h3>Lead management</h3>
                <div className="lead-detail-grid">
                  <div><span>Date received</span><strong>{formatDate(detail.createdAt)}</strong></div>
                  <div><span>Last updated</span><strong>{formatDate(detail.updatedAt)}</strong></div>
                  <div className="lead-detail-grid__wide">
                    <span>WhatsApp project updates</span>
                    <strong>
                      {detail.whatsappConsent
                        ? `Consent recorded · ${formatConsentDate(detail.whatsappConsentAt)}`
                        : "No consent recorded"}
                    </strong>
                    <small>Enquiry submission does not indicate consent for promotional messages.</small>
                  </div>
                  <div className="lead-detail-grid__wide">
                    <label htmlFor="lead-status">Status</label>
                    <select
                      id="lead-status"
                      onChange={(event) => setStatus(event.target.value as EnquiryStatus)}
                      value={status}
                    >
                      {enquiryStatusValues.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                  <div className="lead-detail-grid__wide">
                    <label htmlFor="lead-notes">Private admin notes</label>
                    <textarea
                      id="lead-notes"
                      maxLength={5000}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Add internal context for your team…"
                      rows={5}
                      value={notes}
                    />
                    <small>{notes.length} / 5,000 characters · visible only to administrators</small>
                  </div>
                </div>
                <button
                  className="admin-primary-action lead-save"
                  disabled={saving}
                  onClick={() => void saveChanges()}
                  type="button"
                >
                  {saving ? <LoaderCircle className="admin-spinner" size={15} /> : <Check size={15} />}
                  {saving ? "Saving changes" : "Save changes"}
                </button>
                <button
                  className="lead-create-deal"
                  onClick={() => void createDealFromLead()}
                  type="button"
                >
                  Create Deal
                </button>
                <button
                  className="lead-delete"
                  disabled={deleting}
                  onClick={() => void deleteEnquiry()}
                  type="button"
                >
                  {deleting ? <LoaderCircle className="admin-spinner" size={15} /> : <Trash2 size={15} />}
                  {deleting ? "Deleting enquiry" : "Delete enquiry"}
                </button>
              </section>
            </div>
          ) : (
            <div className="lead-drawer__error" role="alert">This enquiry could not be loaded.</div>
          )}
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}

export function LeadManagement({
  initialData,
  initialQuery = "",
  initialStatus = "",
  initialProjectType = "",
  initialSort = "newest",
  initialSelected,
}: LeadManagementProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [projectType, setProjectType] = useState(initialProjectType);
  const [sort, setSort] = useState<"newest" | "oldest">(initialSort);
  const [page, setPage] = useState(initialData.page);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected ?? null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    companyName: "",
    projectType: "Website Development",
    estimatedBudget: "Not decided yet",
    projectDescription: "",
    status: "New",
    source: "Other",
    adminNotes: "",
    followUpDate: "",
  });
  const firstRender = useRef(true);

  const loadPage = useCallback(
    async (signal: AbortSignal) => {
      const params = new URLSearchParams({
        page: String(page),
        q: query,
        status: status || "All",
        projectType: projectType || "All",
        sort,
      });
      const response = await fetch(`/api/admin/enquiries?${params}`, {
        cache: "no-store",
        signal,
      });
      const result = (await response.json()) as PaginatedEnquiries & ApiError;
      if (!response.ok) throw new Error(result.message || "Enquiries could not be loaded.");
      setData(result);
      setError("");
    },
    [page, projectType, query, sort, status],
  );

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      void loadPage(controller.signal)
        .catch((loadError: unknown) => {
          if (!controller.signal.aborted) {
            setError(
              loadError instanceof Error
                ? loadError.message
                : "Enquiries could not be loaded.",
            );
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, query ? 240 : 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [loadPage, refreshKey, query]);

  const openEnquiry = (id: string) => {
    setSelectedId(id);
    setNotice("");
  };

  const closeEnquiry = useCallback(() => {
    setSelectedId(null);
    const params = new URLSearchParams(window.location.search);
    if (!params.has("selected")) return;
    params.delete("selected");
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [pathname, router]);

  const handleChanged = (message: string) => {
    setNotice(message);
    setRefreshKey((current) => current + 1);
    const params = new URLSearchParams(window.location.search);
    params.delete("selected");
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  const changeFilter = (
    setter: (value: string) => void,
    value: string,
  ) => {
    setter(value);
    setPage(1);
  };

  const toggleSort = () => {
    setSort((current) => (current === "newest" ? "oldest" : "newest"));
    setPage(1);
  };

  const createLead = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...leadForm,
        allowDuplicate: false,
        followUpDate: leadForm.followUpDate || "",
      }),
    });
    const result = await response.json();
    if (response.status === 409) {
      setError(
        "Possible duplicate lead found. Confirm the existing record or close this form and search first.",
      );
      return;
    }
    if (!response.ok) {
      setError(result.message || "The lead could not be created.");
      return;
    }
    setAddOpen(false);
    setNotice("Lead created.");
    setRefreshKey((current) => current + 1);
  };

  return (
    <div className="lead-management">
      <div className="admin-page-heading admin-page-heading--compact">
        <div>
          <span className="admin-page-eyebrow">PIPELINE / WEBSITE ENQUIRIES</span>
          <h2>Every conversation starts somewhere.</h2>
          <p>Review incoming project enquiries and keep their next step clear.</p>
        </div>
        <div className="agency-heading-actions">
          <span className="leads-total">
            <strong>{data.total}</strong>
            <span>{data.total === 1 ? "enquiry" : "enquiries"}</span>
          </span>
          <button className="admin-primary-action" onClick={() => setAddOpen(true)} type="button">
            <Plus size={16} /> Add lead
          </button>
        </div>
      </div>

      {notice && <div className="agency-notice" role="status">{notice}</div>}
      {error && <div className="agency-error" role="alert">{error}</div>}
      {addOpen && (
        <div className="agency-modal-backdrop" onMouseDown={() => setAddOpen(false)}>
          <form className="agency-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={createLead}>
            <div className="agency-modal__heading">
              <div><span className="admin-page-eyebrow">NEW LEAD</span><h3>Add lead</h3></div>
              <button aria-label="Close" onClick={() => setAddOpen(false)} type="button">×</button>
            </div>
            <div className="agency-form-grid">
              <label>Full name<input required value={leadForm.fullName} onChange={(event) => setLeadForm({ ...leadForm, fullName: event.target.value })} /></label>
              <label>Email<input required type="email" value={leadForm.email} onChange={(event) => setLeadForm({ ...leadForm, email: event.target.value })} /></label>
              <label>Phone<input value={leadForm.phone} onChange={(event) => setLeadForm({ ...leadForm, phone: event.target.value })} placeholder="+91..." /></label>
              <label>Company<input value={leadForm.companyName} onChange={(event) => setLeadForm({ ...leadForm, companyName: event.target.value })} /></label>
              <label>Service<select value={leadForm.projectType} onChange={(event) => setLeadForm({ ...leadForm, projectType: event.target.value })}>{SERVICE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label>Lead source<select value={leadForm.source} onChange={(event) => setLeadForm({ ...leadForm, source: event.target.value })}><option>Website Contact Form</option><option>WhatsApp</option><option>LinkedIn</option><option>Google Maps Research</option><option>Referral</option><option>Instagram</option><option>Email</option><option>Other</option></select></label>
              <label>Budget<select value={leadForm.estimatedBudget} onChange={(event) => setLeadForm({ ...leadForm, estimatedBudget: event.target.value })}><option>Not decided yet</option><option>Under ₹15,000</option><option>₹15,000–₹50,000</option><option>₹50,000–₹1,00,000</option><option>Above ₹1,00,000</option></select></label>
              <label>Follow-up date<input type="date" value={leadForm.followUpDate} onChange={(event) => setLeadForm({ ...leadForm, followUpDate: event.target.value })} /></label>
              <label className="agency-form-grid__full">Requirements<textarea required rows={4} value={leadForm.projectDescription} onChange={(event) => setLeadForm({ ...leadForm, projectDescription: event.target.value })} /></label>
            </div>
            <div className="agency-modal__actions"><button type="button" onClick={() => setAddOpen(false)}>Cancel</button><button className="admin-primary-action" type="submit">Create lead</button></div>
          </form>
        </div>
      )}

      <section aria-label="Search and filter enquiries" className="lead-filters">
        <label className="lead-search">
          <Search aria-hidden="true" size={17} />
          <span className="sr-only">Search by client, email, or company</span>
          <input
            onChange={(event) => changeFilter(setQuery, event.target.value)}
            placeholder="Search name, email or business"
            type="search"
            value={query}
          />
          {query && (
            <button
              aria-label="Clear search"
              onClick={() => changeFilter(setQuery, "")}
              type="button"
            >
              <X size={14} />
            </button>
          )}
        </label>
        <label className="lead-filter">
          <span className="sr-only">Filter by status</span>
          <select
            onChange={(event) => changeFilter(setStatus, event.target.value)}
            value={status}
          >
            <option value="">All statuses</option>
            {enquiryStatusValues.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="lead-filter lead-filter--project">
          <span className="sr-only">Filter by project type</span>
          <select
            onChange={(event) => changeFilter(setProjectType, event.target.value)}
            value={projectType}
          >
            <option value="">All project types</option>
            {SERVICE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <button className="lead-sort" onClick={toggleSort} type="button">
          <ArrowDownUp aria-hidden="true" size={15} />
          {sort === "newest" ? "Newest first" : "Oldest first"}
          {sort === "newest" ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
        </button>
      </section>

      <section aria-label="Website enquiries" className="admin-panel lead-list-panel">
        <div className="lead-list-panel__header">
          <div>
            <h3>Website enquiries</h3>
            <span>{loading ? "Updating list…" : `Showing ${data.items.length} of ${data.total}`}</span>
          </div>
          {loading && <LoaderCircle aria-label="Loading enquiries" className="admin-spinner" size={17} />}
        </div>
        {error && <p className="admin-inline-error" role="alert">{error}</p>}
        {notice && <p className="admin-inline-success" role="status">{notice}</p>}

        {data.items.length === 0 ? (
          <div className="admin-empty-state admin-empty-state--large">
            <span><FileText aria-hidden="true" size={21} /></span>
            <strong>{query || status || projectType ? "No matching enquiries" : "No enquiries yet"}</strong>
            <p>
              {query || status || projectType
                ? "Try changing the search or filters."
                : "New website enquiries will appear here after they are submitted."}
            </p>
          </div>
        ) : (
          <>
            <div className="admin-table-scroll lead-table-desktop">
              <table className="admin-table lead-table">
                <thead>
                  <tr>
                    <th scope="col">Client</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Business</th>
                    <th scope="col">Project type</th>
                    <th scope="col">Budget</th>
                    <th scope="col">Status</th>
                    <th scope="col">Received</th>
                    <th scope="col"><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((enquiry) => (
                    <LeadRow enquiry={enquiry} key={enquiry.id} onOpen={openEnquiry} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="lead-cards-mobile">
              {data.items.map((enquiry) => (
                <LeadCard enquiry={enquiry} key={enquiry.id} onOpen={openEnquiry} />
              ))}
            </div>
          </>
        )}

        <div className="lead-pagination">
          <span>Page {data.page} of {data.pageCount}</span>
          <div>
            <button
              aria-label="Previous page"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              aria-label="Next page"
              disabled={page >= data.pageCount || loading}
              onClick={() => setPage((current) => Math.min(data.pageCount, current + 1))}
              type="button"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selectedId && (
          <EnquiryDrawer
            id={selectedId}
            key={selectedId}
            onChanged={handleChanged}
            onClose={closeEnquiry}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
