export const SERVICE_OPTIONS = [
  "Website Development",
  "Custom Software Development",
  "CRM & Dashboard Development",
  "UI/UX Design",
  "Mobile App Development",
  "Shopify Development",
  "Website & UI Templates",
  "Graphic & Brand Design",
  "Automation & API Integration",
  "Other",
] as const;

export type ServiceOption = (typeof SERVICE_OPTIONS)[number];

export const BUDGET_OPTIONS = [
  "Not decided yet",
  "Under ₹15,000",
  "₹15,000–₹50,000",
  "₹50,000–₹1,00,000",
  "Above ₹1,00,000",
] as const;

export type BudgetOption = (typeof BUDGET_OPTIONS)[number];
