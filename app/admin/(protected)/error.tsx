"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin page failed to load.", error.digest ?? error.name);
  }, [error]);

  return (
    <div className="admin-error-state">
      <span className="admin-page-eyebrow">WORKSPACE / TEMPORARY ERROR</span>
      <h2>This page couldn&apos;t load.</h2>
      <p>Your enquiries are unchanged. Try again in a moment.</p>
      <button className="admin-primary-action" onClick={reset} type="button">
        Try again
      </button>
    </div>
  );
}
