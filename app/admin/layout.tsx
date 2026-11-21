import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./admin.css";

export const metadata: Metadata = {
  title: {
    default: "Admin | ArclivoLabs Tech",
    template: "%s | ArclivoLabs Tech Admin",
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function AdminRootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <div className="admin-app">{children}</div>;
}
