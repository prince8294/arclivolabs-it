export type ProjectCategory =
  string;

export type ProjectType = "Client Project" | "In-house Project" | "Concept Project";

export interface Project {
  id: string;
  name: string;
  category: ProjectCategory;
  description: string;
  technologyStack: string[];
  stackLabel: string;
  projectType: ProjectType;
  year?: number;
  featured: boolean;
  visual: "commerce" | "workspace" | "mobile";
  liveUrl?: string;
  caseStudy?: string;
  coverImageUrl?: string;
}

export const projects: Project[] = [
  {
    id: "commerce-direction",
    name: "Commerce, considered",
    category: "E-commerce",
    description:
      "A considered storefront direction pairing editorial product storytelling with a focused shopping experience.",
    technologyStack: ["Next.js", "TypeScript", "Shopify"],
    stackLabel: "Exploratory stack",
    projectType: "Concept Project",
    featured: true,
    visual: "commerce",
  },
  {
    id: "operations-direction",
    name: "Operations, in focus",
    category: "CRM & Dashboards",
    description:
      "A dashboard concept for bringing everyday workflows, signals, and team priorities into one clear view.",
    technologyStack: ["React", "TypeScript", "Design systems"],
    stackLabel: "Exploratory stack",
    projectType: "Concept Project",
    featured: false,
    visual: "workspace",
  },
  {
    id: "product-direction",
    name: "A more human interface",
    category: "UI/UX Design",
    description:
      "A mobile product concept exploring calm navigation, purposeful interactions, and a more human digital rhythm.",
    technologyStack: ["Product strategy", "Prototyping", "Interaction design"],
    stackLabel: "Exploratory tools",
    projectType: "Concept Project",
    featured: false,
    visual: "mobile",
  },
];
