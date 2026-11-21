import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  Blocks,
  Bot,
  Brush,
  Code2,
  LayoutDashboard,
  Palette,
  ShoppingBag,
  Smartphone,
} from "lucide-react";
import { SERVICE_OPTIONS, type ServiceOption } from "@/lib/service-options";

export interface Service {
  id: string;
  number: string;
  name: ServiceOption;
  description: string;
  icon: LucideIcon;
  iconId: string;
  marker: string;
}

export const services: Service[] = [
  {
    id: "website-development",
    number: "01",
    name: SERVICE_OPTIONS[0],
    description:
      "Modern business websites, landing pages, responsive web experiences, and high-performance web platforms.",
    icon: AppWindow,
    iconId: "app-window",
    marker: "Web / 01",
  },
  {
    id: "custom-software",
    number: "02",
    name: SERVICE_OPTIONS[1],
    description:
      "Tailored applications, internal business tools, SaaS platforms, and custom software solutions.",
    icon: Code2,
    iconId: "code",
    marker: "Systems / 02",
  },
  {
    id: "crm-dashboard",
    number: "03",
    name: SERVICE_OPTIONS[2],
    description:
      "Sales dashboards, customer management systems, admin panels, analytics dashboards, and workflow tools.",
    icon: LayoutDashboard,
    iconId: "dashboard",
    marker: "Data / 03",
  },
  {
    id: "ui-ux-design",
    number: "04",
    name: SERVICE_OPTIONS[3],
    description:
      "Product interfaces, website design, mobile app experiences, wireframes, prototypes, and design systems.",
    icon: Palette,
    iconId: "palette",
    marker: "Experience / 04",
  },
  {
    id: "mobile-app",
    number: "05",
    name: SERVICE_OPTIONS[4],
    description:
      "Android and iOS application development, business applications, and cross-platform mobile experiences.",
    icon: Smartphone,
    iconId: "smartphone",
    marker: "Mobile / 05",
  },
  {
    id: "shopify-development",
    number: "06",
    name: SERVICE_OPTIONS[5],
    description:
      "Shopify storefront development, custom themes, product page customization, and e-commerce integrations.",
    icon: ShoppingBag,
    iconId: "shop",
    marker: "Commerce / 06",
  },
  {
    id: "website-templates",
    number: "07",
    name: SERVICE_OPTIONS[6],
    description:
      "Reusable website templates, landing page kits, dashboard templates, and design customization.",
    icon: Blocks,
    iconId: "blocks",
    marker: "Systems / 07",
  },
  {
    id: "graphic-brand-design",
    number: "08",
    name: SERVICE_OPTIONS[7],
    description:
      "Brand identities, logo design, visual systems, marketing creatives, and digital brand assets.",
    icon: Brush,
    iconId: "brush",
    marker: "Identity / 08",
  },
  {
    id: "automation-api",
    number: "09",
    name: SERVICE_OPTIONS[8],
    description:
      "Business process automation, third-party APIs, WhatsApp integrations, and custom workflow connectivity.",
    icon: Bot,
    iconId: "bot",
    marker: "Integration / 09",
  },
];
