import type { EnquiryStatus } from "@/lib/validations/enquiry";

export function StatusBadge({ status }: { status: EnquiryStatus }) {
  const modifier = status
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return <span className={`status-badge status-badge--${modifier}`}>{status}</span>;
}
