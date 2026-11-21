import { LeadManagement } from "@/components/admin/lead-management";
import {
  isEnquiryStatus,
  isServiceOption,
  listEnquiries,
} from "@/lib/admin/enquiries";

interface LeadsPageProps {
  searchParams?: {
    q?: string;
    status?: string;
    projectType?: string;
    sort?: string;
    page?: string;
    selected?: string;
  };
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const rawStatus = searchParams?.status ?? "";
  const rawProjectType = searchParams?.projectType ?? "";
  const sort = searchParams?.sort === "oldest" ? "oldest" : "newest";
  const pageNumber = Number(searchParams?.page ?? 1);
  const page = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const status = isEnquiryStatus(rawStatus) ? rawStatus : "";
  const projectType = isServiceOption(rawProjectType) ? rawProjectType : "";
  const query = (searchParams?.q ?? "").slice(0, 80);
  const initialData = await listEnquiries({
    query,
    status: status || undefined,
    projectType: projectType || undefined,
    sort,
    page,
    pageSize: 20,
  });
  const selected = searchParams?.selected;
  const initialSelected =
    selected && /^[a-f\d]{24}$/i.test(selected) ? selected : undefined;

  return (
    <LeadManagement
      initialData={initialData}
      initialProjectType={projectType}
      initialQuery={query}
      initialSelected={initialSelected}
      initialSort={sort}
      initialStatus={status}
    />
  );
}
