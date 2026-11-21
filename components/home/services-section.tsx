"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AppWindow,
  ArrowUpRight,
  Blocks,
  Bot,
  Brush,
  Code2,
  LayoutDashboard,
  MoveUpRight,
  Palette,
  ShoppingBag,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ScrollReveal } from "@/components/motion/scroll-reveal";

interface PublicService {
  id: string;
  number: string;
  name: string;
  description: string;
  iconId: string;
  marker: string;
}

const serviceIcons = {
  "app-window": AppWindow,
  code: Code2,
  dashboard: LayoutDashboard,
  palette: Palette,
  smartphone: Smartphone,
  shop: ShoppingBag,
  blocks: Blocks,
  brush: Brush,
  bot: Bot,
} satisfies Record<string, typeof AppWindow>;

export function ServicesSection({ services }: { services: PublicService[] }) {
  const [activeService, setActiveService] = useState(0);
  const reduceMotion = useReducedMotion();
  const selected = services[activeService] ?? services[0];
  const SelectedIcon = selected
    ? serviceIcons[selected.iconId as keyof typeof serviceIcons] ?? AppWindow
    : AppWindow;

  return (
    <section
      aria-labelledby="services-title"
      className="services-section"
      id="services"
    >
      <div className="section-shell">
        <ScrollReveal className="section-intro section-intro--services">
          <span className="section-kicker">02 / OUR EXPERTISE</span>
          <div className="section-intro__body">
            <h2 id="services-title">
              BIG IDEAS.
              <br />BETTER TECHNOLOGY.
            </h2>
            <p>
              From ambitious ideas to powerful digital platforms, we design and
              develop technology that helps businesses move forward.
            </p>
          </div>
          <span aria-hidden="true" className="section-intro__index">
            {String(services.length).padStart(2, "0")} / 09
          </span>
        </ScrollReveal>

        <div className="services-layout">
          <div className="service-list">
            {services.map((service, index) => {
              const isOpen = activeService === index;
              const Icon = serviceIcons[service.iconId as keyof typeof serviceIcons] ?? AppWindow;
              const panelId = `service-description-${service.number}`;

              return (
                <motion.article
                  className={`service-row${isOpen ? " is-active" : ""}`}
                  key={service.id}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : {
                          duration: 0.5,
                          delay: Math.min(index * 0.035, 0.24),
                          ease: [0.22, 1, 0.36, 1],
                        }
                  }
                >
                  <button
                    aria-controls={isOpen ? panelId : undefined}
                    aria-expanded={isOpen}
                    className="service-row__trigger"
                    onClick={() => setActiveService(isOpen ? -1 : index)}
                    type="button"
                  >
                    <span className="service-row__number">{service.number}</span>
                    <span className="service-row__icon">
                      <Icon aria-hidden="true" size={19} strokeWidth={1.6} />
                    </span>
                    <span className="service-row__title">{service.name}</span>
                    <span className="service-row__arrow">
                      <MoveUpRight aria-hidden="true" size={16} />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        animate={{ height: "auto", opacity: 1 }}
                        className="service-row__panel"
                        exit={{ height: 0, opacity: 0 }}
                        id={panelId}
                        initial={{ height: 0, opacity: 0 }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
                        }
                      >
                        <p>{service.description}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              );
            })}
          </div>

          {selected && (
            <div aria-hidden="true" className="services-preview">
            <div className="services-preview__frame">
              <div className="services-preview__topline">
                <span>ARCLIVOLABS / CAPABILITIES</span>
                <span>{selected.marker}</span>
              </div>
              <div className="services-preview__graphic">
                <div className="services-preview__grid" />
                <motion.div
                  animate={reduceMotion ? undefined : { rotate: 360 }}
                  className="services-preview__orbit services-preview__orbit--outer"
                  key={`${selected.number}-outer`}
                  transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  animate={reduceMotion ? undefined : { rotate: -360 }}
                  className="services-preview__orbit services-preview__orbit--inner"
                  key={`${selected.number}-inner`}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                />
                <AnimatePresence mode="wait">
                  <motion.div
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="services-preview__symbol"
                    exit={{ opacity: 0, scale: 0.94, y: 8 }}
                    initial={{ opacity: 0, scale: 0.94, y: 8 }}
                    key={selected.number}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.24 }}
                  >
                    <SelectedIcon size={34} strokeWidth={1.25} />
                  </motion.div>
                </AnimatePresence>
                <span className="services-preview__coordinate services-preview__coordinate--a">
                  DIRECTION / 01
                </span>
                <span className="services-preview__coordinate services-preview__coordinate--b">
                  DESIGN → SYSTEMS
                </span>
              </div>
              <div className="services-preview__caption">
                <span>CAPABILITY / {selected.number}</span>
                <strong>{selected.name}</strong>
                <span>Thoughtful by design. Precise by nature.</span>
              </div>
            </div>
            </div>
          )}
        </div>

        {services.length === 0 ? (
          <p className="services-empty">
            We&apos;re currently refining our service offering. Get in touch to
            discuss your project.
          </p>
        ) : (
          <div className="services-cta">
            <div>
              <span className="section-kicker">A GOOD PLACE TO BEGIN</span>
              <h3>Have a project in mind?</h3>
            </div>
            <Link className="button button--primary" href="#contact">
              Let&apos;s Discuss Your Project
              <span className="button__arrow">
                <ArrowUpRight aria-hidden="true" size={16} />
              </span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
