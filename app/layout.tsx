import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./tech.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ArclivoLabs Tech — Digital Products, Designed & Engineered",
  description:
    "An independent digital engineering studio building websites, products, software, and high-performance digital experiences.",
  metadataBase: new URL("https://tech.arclivolabs.com"),
  openGraph: {
    title: "ArclivoLabs Tech — We Build What's Next",
    description:
      "Independent digital engineering for ambitious ideas and the people building them.",
    url: "https://tech.arclivolabs.com",
    siteName: "ArclivoLabs Tech",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
