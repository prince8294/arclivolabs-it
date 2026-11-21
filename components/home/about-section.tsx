"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ScrollReveal } from "@/components/motion/scroll-reveal";

const process = [
  {
    number: "01",
    title: "Purposeful Design",
    description: "Create clear, intuitive experiences around real user and business needs.",
  },
  {
    number: "02",
    title: "Modern Technology",
    description: "Use proven tools and considered engineering to build responsive solutions.",
  },
  {
    number: "03",
    title: "Clear Communication",
    description: "Keep decisions visible and collaboration direct throughout delivery.",
  },
  {
    number: "04",
    title: "Scalable Architecture",
    description: "Structure systems to support future requirements and maintainable growth.",
  },
  {
    number: "05",
    title: "Quality-Focused",
    description: "Refine usability, performance, and reliability before every handover.",
  },
];

function EngineeringGraphic() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden="true" className="engineering-graphic">
      <div className="engineering-graphic__header">
        <span>FIG. 03 / SYSTEMS THINKING</span>
        <span>01 — 03</span>
      </div>
      <svg fill="none" viewBox="0 0 520 420">
        <defs>
          <linearGradient id="engineering-line" x1="86" x2="412" y1="348" y2="84">
            <stop stopColor="#365BFF" stopOpacity=".08" />
            <stop offset=".48" stopColor="#365BFF" />
            <stop offset="1" stopColor="#365BFF" stopOpacity=".14" />
          </linearGradient>
          <pattern id="engineering-dots" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#CBD0DA" />
          </pattern>
        </defs>
        <rect x="37" y="25" width="446" height="370" fill="url(#engineering-dots)" opacity=".42" />
        <path d="M75 332h370M110 364V78" stroke="#E1E4EA" />
        <path d="M94 294h31M94 236h31M94 178h31M94 120h31" stroke="#C9CFDA" />
        <path d="M155 330V198h74V132h75V92h81" stroke="#D8DDE7" />
        <motion.path
          d="M155 330 228 269l48-7 58-95 43-28 76-61"
          initial={{ opacity: reduceMotion ? 1 : 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1.5, ease: "easeInOut" }}
          stroke="url(#engineering-line)"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path d="m151 329 3-4 3 4m68-63 3-4 3 4m44-3 3-4 3 4m55-96 3-4 3 4m40-30 3-4 3 4m72-60 3-4 3 4" stroke="#365BFF" strokeWidth="1.5" />
        <circle cx="228" cy="269" r="5" fill="#fff" stroke="#365BFF" strokeWidth="1.5" />
        <circle cx="334" cy="167" r="5" fill="#fff" stroke="#365BFF" strokeWidth="1.5" />
        <circle cx="453" cy="78" r="4" fill="#365BFF" />
        <path d="M334 167h71v-34" stroke="#BFC8DD" strokeDasharray="3 5" />
        <path d="M405 126v14m-7-7h14" stroke="#365BFF" />
        <text x="332" y="116" fill="#808692" fontSize="8" letterSpacing="1.4">ITERATE / 04</text>
        <text x="148" y="355" fill="#808692" fontSize="8" letterSpacing="1.4">IDEA / 01</text>
      </svg>
      <div className="engineering-graphic__footer">
        <span>IDEA → INTERFACE → IMPACT</span>
        <span className="engineering-graphic__status"><i /> IN PROGRESS</span>
      </div>
    </div>
  );
}

export function AboutSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section aria-labelledby="about-title" className="about-section" id="about">
      <div className="section-shell">
        <ScrollReveal className="section-intro section-intro--about">
          <span className="section-kicker">03 / WHO WE ARE</span>
          <div className="section-intro__body">
            <h2 id="about-title">
              THOUGHTFUL DESIGN.
              <br />POWERFUL ENGINEERING.
            </h2>
          </div>
          <span aria-hidden="true" className="section-intro__index">IDEAS → REALITY</span>
        </ScrollReveal>

        <div className="about-editorial">
          <div className="about-editorial__lead">
            <ScrollReveal>
              <p className="about-editorial__statement">
                Technology is at its best when it feels <em>clear, considered,</em>{" "}
                and made for a reason.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <div className="about-editorial__copy">
                <p>
                  ArclivoLabs Tech is a digital engineering and creative
                  technology studio focused on building thoughtful,
                  high-performing websites, applications, and software
                  solutions.
                </p>
                <p>
                  Combining modern technology with purposeful design, we help
                  businesses transform ideas into functional digital
                  experiences.
                </p>
              </div>
            </ScrollReveal>
          </div>
          <ScrollReveal className="about-editorial__visual" delay={0.12}>
            <EngineeringGraphic />
          </ScrollReveal>
        </div>

        <div className="process">
          <div className="process__heading">
            <ScrollReveal>
              <span className="section-kicker">HOW WE WORK</span>
              <h3>Standards that guide every build.</h3>
            </ScrollReveal>
          </div>
          <div className="process__track">
            <div aria-hidden="true" className="process__line">
              <motion.span
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 1, ease: "easeInOut" }
                }
              />
            </div>
            {process.map((step, index) => (
              <ScrollReveal
                className="process-step"
                delay={index * 0.1}
                key={step.number}
              >
                <span className="process-step__marker">{step.number}</span>
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
