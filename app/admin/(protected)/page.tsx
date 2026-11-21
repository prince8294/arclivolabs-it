import { ArrowDownRight, ArrowUpRight, FilePlus2, Inbox, Target } from "lucide-react";
import Link from "next/link";
import { EnquiryTrend } from "@/components/admin/enquiry-trend";
import { StatusBadge } from "@/components/admin/status-badge";
import { getDashboardData } from "@/lib/admin/dashboard";
import { getBusinessMetrics } from "@/lib/admin/business-metrics";
import { formatINR } from "@/lib/finance/money";
import { BusinessCharts } from "@/components/admin/business-charts";

interface DashboardPageProps {
  searchParams?: { range?: string };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const rangeDays = searchParams?.range === "30" ? 30 : 7;
  const data = await getDashboardData(rangeDays);
  const business = await getBusinessMetrics();
  const metrics = [
    { label: "Total leads", value: business.totalLeads, icon: Inbox, tone: "blue", money: false },
    { label: "Active deals", value: business.activeDeals, icon: Target, tone: "ink", money: false },
    { label: "Active projects", value: business.activeProjects, icon: FilePlus2, tone: "violet", money: false },
    { label: "Payments received", value: formatINR(business.paymentsReceivedMinor), icon: ArrowUpRight, tone: "green", money: true },
    { label: "Outstanding invoices", value: formatINR(business.outstandingInvoiceMinor), icon: FilePlus2, tone: "blue", money: true },
    { label: "Recorded expenses", value: formatINR(business.recordedExpensesMinor), icon: ArrowDownRight, tone: "ink", money: true },
    { label: "Estimated contribution", value: formatINR(business.estimatedContributionMinor), icon: Target, tone: "violet", money: true },
    { label: "Net cash flow", value: formatINR(business.netCashFlowMinor), icon: ArrowUpRight, tone: "green", money: true },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-page-heading">
        <div>
          <span className="admin-page-eyebrow">OVERVIEW / YOUR WORKSPACE</span>
          <h2>Good to see you.</h2>
          <p>Here&apos;s what&apos;s happening with incoming project enquiries.</p>
        </div>
        <Link className="admin-primary-action" href="/admin/leads">
          View enquiries
          <ArrowUpRight aria-hidden="true" size={16} />
        </Link>
      </div>

      <section aria-label="Enquiry summary" className="admin-metrics">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <article
              className="admin-metric"
              key={metric.label}
              style={{ animationDelay: `${index * 55}ms` }}
            >
              <div className="admin-metric__top">
                <span>{metric.label}</span>
                <span className={`admin-metric__icon admin-metric__icon--${metric.tone}`}>
                  <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
                </span>
              </div>
              <strong>{metric.value}</strong>
              <span className="admin-metric__caption">
                {metric.label === "Total enquiries"
                  ? "All-time records"
                  : "Current stage total"}
              </span>
            </article>
          );
        })}
      </section>

      <BusinessCharts
        leadDealTrend={business.leadDealTrend}
        monthlyCash={business.monthlyCash}
      />

      <div className="admin-dashboard__grid">
        <section aria-labelledby="trend-title" className="admin-panel admin-trend-panel">
          <div className="admin-panel__heading">
            <div>
              <span className="admin-page-eyebrow">INCOMING ENQUIRIES</span>
              <h3 id="trend-title">Enquiry activity</h3>
            </div>
            <div aria-label="Trend range" className="admin-range-toggle">
              <Link
                aria-current={rangeDays === 7 ? "page" : undefined}
                className={rangeDays === 7 ? "is-active" : ""}
                href="/admin?range=7"
              >
                7 days
              </Link>
              <Link
                aria-current={rangeDays === 30 ? "page" : undefined}
                className={rangeDays === 30 ? "is-active" : ""}
                href="/admin?range=30"
              >
                30 days
              </Link>
            </div>
          </div>
          <EnquiryTrend data={data.trend} />
          <div className="admin-chart-legend">
            <span><i /> Enquiries received</span>
            <span>Counts from stored submissions</span>
          </div>
        </section>

        <aside aria-label="Quick actions" className="admin-quick-actions">
          <span className="admin-page-eyebrow">QUICK ACTIONS</span>
          <h3>Keep things moving.</h3>
          <Link href="/admin/leads"><span className="admin-quick-actions__icon"><Inbox size={17} /></span><span><strong>Add Lead</strong><small>Create or review leads</small></span><ArrowUpRight size={16} /></Link>
          <Link href="/admin/deals"><span className="admin-quick-actions__icon"><Target size={17} /></span><span><strong>Create Deal</strong><small>Move an opportunity forward</small></span><ArrowUpRight size={16} /></Link>
          <Link href="/admin/projects"><span className="admin-quick-actions__icon"><FilePlus2 size={17} /></span><span><strong>Add Project</strong><small>Track actual client work</small></span><ArrowUpRight size={16} /></Link>
          <Link href="/admin/invoices"><span className="admin-quick-actions__icon"><FilePlus2 size={17} /></span><span><strong>Create Invoice</strong><small>Generate a draft invoice</small></span><ArrowUpRight size={16} /></Link>
          <Link href="/admin/finance"><span className="admin-quick-actions__icon"><ArrowDownRight size={17} /></span><span><strong>Add Expense</strong><small>Record business spending</small></span><ArrowUpRight size={16} /></Link>
        </aside>
      </div>

      <section aria-labelledby="recent-enquiries-title" className="admin-panel admin-recent-panel">
        <div className="admin-panel__heading">
          <div>
            <span className="admin-page-eyebrow">LATEST ACTIVITY</span>
            <h3 id="recent-enquiries-title">Recent enquiries</h3>
          </div>
          <Link className="admin-subtle-link" href="/admin/leads">
            All enquiries <ArrowUpRight aria-hidden="true" size={15} />
          </Link>
        </div>

        {data.recent.length === 0 ? (
          <div className="admin-empty-state">
            <span><Inbox aria-hidden="true" size={20} /></span>
            <strong>No enquiries yet</strong>
            <p>New project enquiries will appear here when someone contacts you.</p>
          </div>
        ) : (
          <>
            <div className="admin-table-scroll admin-recent-desktop">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Client</th>
                    <th scope="col">Company</th>
                    <th scope="col">Project type</th>
                    <th scope="col">Budget</th>
                    <th scope="col">Status</th>
                    <th scope="col">Received</th>
                    <th scope="col"><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((enquiry) => (
                    <tr key={enquiry.id}>
                      <td>
                        <strong>{enquiry.fullName}</strong>
                        <small>{enquiry.email}</small>
                      </td>
                      <td>{enquiry.companyName || "—"}</td>
                      <td>{enquiry.projectType}</td>
                      <td>{enquiry.estimatedBudget || "Not specified"}</td>
                      <td><StatusBadge status={enquiry.status} /></td>
                      <td>{formatDate(enquiry.createdAt)}</td>
                      <td>
                        <Link
                          aria-label={`View ${enquiry.fullName}'s enquiry`}
                          className="admin-row-action"
                          href={`/admin/leads?selected=${enquiry.id}`}
                        >
                          <ArrowDownRight aria-hidden="true" size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-recent-mobile">
              {data.recent.map((enquiry) => (
                <article className="admin-recent-card" key={enquiry.id}>
                  <div>
                    <strong>{enquiry.fullName}</strong>
                    <span>{enquiry.companyName || enquiry.email}</span>
                  </div>
                  <StatusBadge status={enquiry.status} />
                  <small>{enquiry.projectType} · {formatDate(enquiry.createdAt)}</small>
                  <Link href={`/admin/leads?selected=${enquiry.id}`}>
                    View enquiry <ArrowUpRight aria-hidden="true" size={14} />
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
