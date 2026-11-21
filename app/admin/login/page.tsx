import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Administrator sign in",
  robots: { index: false, follow: false, noarchive: true },
};

export default function AdminLoginPage() {
  return (
    <main className="admin-login-page">
      <div className="admin-login__brand">
        <span className="admin-brand__mark">A<span>.</span></span>
        <span className="admin-brand__name">
          ARCLIVOLABS
          <small>TECH / PRIVATE WORKSPACE</small>
        </span>
      </div>
      <div className="admin-login__layout">
        <div className="admin-login__intro">
          <span className="admin-login__eyebrow">ADMINISTRATOR ACCESS</span>
          <h1>Welcome<br />Back<span>.</span></h1>
          <p>Sign in to manage project enquiries and keep work moving forward.</p>
        </div>
        <AdminLoginForm />
      </div>
      <div className="admin-login__footer">
        <span>ARCLIVOLABS TECH</span>
        <span>AUTHORIZED ACCESS ONLY</span>
      </div>
    </main>
  );
}
