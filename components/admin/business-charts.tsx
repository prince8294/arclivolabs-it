"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface MonthlyCashPoint {
  month: string;
  inflowMinor: number;
  outflowMinor: number;
}

export interface LeadDealPoint {
  month: string;
  leads: number;
  dealsCreated: number;
  dealsWon: number;
}

function monthLabel(value: string) {
  const [year, month] = value.split("-");
  return new Intl.DateTimeFormat("en-IN", { month: "short" }).format(
    new Date(Number(year), Number(month) - 1, 1),
  );
}

function formatRupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export function BusinessCharts({
  monthlyCash,
  leadDealTrend,
}: {
  monthlyCash: MonthlyCashPoint[];
  leadDealTrend: LeadDealPoint[];
}) {
  const cashData = monthlyCash.map((point) => ({
    ...point,
    month: monthLabel(point.month),
  }));
  const leadData = leadDealTrend.map((point) => ({
    ...point,
    month: monthLabel(point.month),
  }));

  return (
    <div className="agency-chart-grid">
      <section className="admin-panel agency-chart-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-page-eyebrow">LAST 6 MONTHS</span><h3>Cash inflow vs outflow</h3></div>
        </div>
        <div className="agency-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashData} margin={{ top: 12, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#edf0f4" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#858a93", fontSize: 9 }} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => formatRupees(Number(value))} tick={{ fill: "#858a93", fontSize: 9 }} width={72} />
              <Tooltip formatter={(value) => formatRupees(Number(value))} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
              <Bar name="Payments received" dataKey="inflowMinor" fill="#365bff" radius={[3, 3, 0, 0]} />
              <Bar name="Paid expenses" dataKey="outflowMinor" fill="#b5bed0" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="admin-panel agency-chart-panel">
        <div className="admin-panel__heading">
          <div><span className="admin-page-eyebrow">LAST 6 MONTHS</span><h3>Leads &amp; deals</h3></div>
        </div>
        <div className="agency-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={leadData} margin={{ top: 12, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#edf0f4" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#858a93", fontSize: 9 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#858a93", fontSize: 9 }} width={30} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 9 }} />
              <Line name="New leads" type="monotone" dataKey="leads" stroke="#365bff" strokeWidth={2} dot={{ r: 3 }} />
              <Line name="Deals created" type="monotone" dataKey="dealsCreated" stroke="#8d68ce" strokeWidth={2} dot={{ r: 3 }} />
              <Line name="Deals won" type="monotone" dataKey="dealsWon" stroke="#32835b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
