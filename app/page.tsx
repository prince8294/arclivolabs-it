import { TechExperience } from "@/components/home/tech-experience";
import { getPublishedServices } from "@/lib/admin/content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const services = await getPublishedServices();

  return <TechExperience services={services} />;
}
