"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ScrollReveal } from "@/components/motion/scroll-reveal";

const steps = [
  { number: "01", title: "Discover", text: "Understand the business, requirements, users, and goals." },
  { number: "02", title: "Design", text: "Create intuitive interfaces and a clear technical plan." },
  { number: "03", title: "Develop", text: "Build reliable, responsive, and functional digital solutions." },
  { number: "04", title: "Launch", text: "Test, refine, deploy, and hand over the finished solution." },
];

export function ProcessSection() {
  const reduceMotion = useReducedMotion();
  return (
    <section aria-labelledby="process-title" className="process-section" id="process">
      <div className="section-shell">
        <ScrollReveal className="process-section__heading">
          <span className="section-kicker">05 / OUR PROCESS</span>
          <h2 id="process-title">FROM FIRST IDEA<br />TO FINAL LAUNCH.</h2>
        </ScrollReveal>
        <div className="launch-process">
          <div className="launch-process__line" aria-hidden="true">
            <motion.span
              initial={{ scaleX: reduceMotion ? 1 : 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 1.1, ease: "easeInOut" }}
            />
          </div>
          {steps.map((step, index) => (
            <ScrollReveal className="launch-step" delay={index * 0.08} key={step.number}>
              <span className="launch-step__number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
