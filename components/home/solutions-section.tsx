"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ScrollReveal } from "@/components/motion/scroll-reveal";

const solutions = [
  { number: "01", title: "Business Growth", text: "Digital experiences designed to present services clearly and capture enquiries.", visual: "growth", image: "/images/digital-growth.jpg", alt: "Laptop displaying code in a modern workspace" },
  { number: "02", title: "Customer Management", text: "CRM tools to organize customers, leads, and sales activities.", visual: "customer", image: "/images/customer-management.jpg", alt: "Analytics dashboard displaying business performance data" },
  { number: "03", title: "E-commerce", text: "Modern online stores, product experiences, and ordering workflows.", visual: "commerce", image: "/images/ecommerce.jpg", alt: "Customer completing a digital commerce transaction" },
  { number: "04", title: "Business Automation", text: "Reduce repetitive tasks through tailored integrations and workflows.", visual: "automation", image: "/images/automation.jpg", alt: "Electronic systems and connected technology components" },
  { number: "05", title: "Mobile Experiences", text: "Accessible mobile applications for customers and business operations.", visual: "mobile", image: "/images/mobile-experience.jpg", alt: "Mobile applications displayed on a smartphone" },
  { number: "06", title: "Digital Transformation", text: "Modernize outdated processes through custom software solutions.", visual: "transform", image: "/images/digital-transformation.jpg", alt: "Team collaborating around a laptop in a bright workspace" },
];

export function SolutionsSection() {
  return (
    <section aria-labelledby="solutions-title" className="solutions-section" id="solutions">
      <div className="section-shell">
        <ScrollReveal className="solutions-heading">
          <span className="section-kicker">03 / BUSINESS SOLUTIONS</span>
          <h2 id="solutions-title">NOT JUST TECHNOLOGY.<br />REAL BUSINESS SOLUTIONS.</h2>
        </ScrollReveal>
        <div className="solutions-grid">
          {solutions.map((solution, index) => (
            <ScrollReveal className={`solution-card solution-card--${solution.visual}`} delay={index * 0.04} key={solution.number}>
              <div className="solution-card__top">
                <span>{solution.number}</span>
                <span className="solution-card__status"><i /> DIGITAL / SOLUTION</span>
              </div>
              <div className="solution-card__graphic">
                <img alt={solution.alt} loading="lazy" src={solution.image} />
                <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
              </div>
              <h3>{solution.title}</h3>
              <p>{solution.text}</p>
              <Link href="#contact">
                Discuss a solution
                <ArrowUpRight aria-hidden="true" size={15} />
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
