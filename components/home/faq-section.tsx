"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ScrollReveal } from "@/components/motion/scroll-reveal";

const faqs = [
  ["What types of digital solutions does ArclivoLabs build?", "We build websites, custom software, dashboards and CRM systems, mobile applications, e-commerce experiences, automation integrations, and digital interface designs."],
  ["Can you build a completely custom website?", "Yes. We can design and develop custom websites around your content, workflows, and business requirements rather than relying on a generic template."],
  ["Do you develop mobile applications?", "Yes. We develop mobile experiences for customer-facing and business use, with responsive behavior and accessible interfaces."],
  ["Can you redesign an existing website?", "Yes. We can review an existing site, improve its interface and usability, and modernize its implementation without changing your business workflows unnecessarily."],
  ["Do you provide custom CRM systems?", "Yes. We can build CRM and dashboard functionality for organizing customers, leads, sales activities, and operational records."],
  ["How do we start a project?", "Send an enquiry through the contact form with your goals and requirements. We will use that information to discuss the right scope and next steps."],
  ["How is project pricing determined?", "Pricing depends on the scope, complexity, integrations, design requirements, and expected level of custom development."],
  ["Can you work with startups and small businesses?", "Yes. We can discuss focused solutions for startups and small businesses, adapting the technical scope to the work that needs to be delivered."],
];

export function FaqSection() {
  const [open, setOpen] = useState(0);
  const reduceMotion = useReducedMotion();
  return (
    <section aria-labelledby="faq-title" className="faq-section" id="faq">
      <div className="section-shell faq-layout">
        <ScrollReveal className="faq-heading">
          <span className="section-kicker">07 / FAQ</span>
          <h2 id="faq-title">COMMON QUESTIONS.<br />CLEAR ANSWERS.</h2>
        </ScrollReveal>
        <div className="faq-list">
          {faqs.map(([question, answer], index) => {
            const isOpen = open === index;
            const panelId = `faq-panel-${index}`;
            return (
              <article className={`faq-item${isOpen ? " is-open" : ""}`} key={question}>
                <button aria-controls={panelId} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : index)} type="button">
                  <span>0{index + 1}</span>
                  <strong>{question}</strong>
                  <Plus aria-hidden="true" size={19} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} id={panelId} initial={{ height: 0, opacity: 0 }} transition={reduceMotion ? { duration: 0 } : { duration: 0.28 }}>
                      <p>{answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
