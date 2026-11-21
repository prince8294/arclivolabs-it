"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { DashboardData } from "@/types/admin";

function formatDay(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function EnquiryTrend({ data }: { data: DashboardData["trend"] }) {
  const reduceMotion = useReducedMotion();
  const highest = Math.max(1, ...data.map((item) => item.count));

  return (
    <div
      aria-label={`Enquiries received over ${data.length} days`}
      className="enquiry-trend"
      role="img"
    >
      <div className="enquiry-trend__bars">
        {data.map((item, index) => {
          const height = item.count === 0 ? 2 : Math.max(8, (item.count / highest) * 100);
          const showLabel =
            data.length === 7 ||
            index === 0 ||
            index === data.length - 1 ||
            index % 5 === 0;

          return (
            <div className="enquiry-trend__column" key={item.date}>
              <span className="enquiry-trend__count">{item.count}</span>
              <motion.span
                animate={{ height: `${height}%` }}
                className={`enquiry-trend__bar${item.count === 0 ? " is-empty" : ""}`}
                initial={{ height: reduceMotion ? `${height}%` : "0%" }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.48, delay: Math.min(index * 0.025, 0.24) }
                }
              />
              <span className="enquiry-trend__date">
                {showLabel ? formatDay(item.date) : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
