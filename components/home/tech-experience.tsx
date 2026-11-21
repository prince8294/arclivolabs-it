"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AppWindow, Blocks, Bot, Braces, Check, Code2, Cpu, Gauge,
  LayoutDashboard, Menu, Palette, Play, Send, ShoppingBag,
  Smartphone, Sparkles, X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { SERVICE_OPTIONS } from "@/lib/service-options";

interface PublicService {
  id: string;
  number: string;
  name: string;
  description: string;
  iconId: string;
  marker: string;
}

const iconMap = {
  "app-window": AppWindow,
  code: Code2,
  dashboard: LayoutDashboard,
  palette: Palette,
  smartphone: Smartphone,
  shop: ShoppingBag,
  blocks: Blocks,
  brush: Sparkles,
  bot: Bot,
} satisfies Record<string, typeof AppWindow>;

const navItems = [
  ["Services", "#services"],
  ["Work", "#work"],
  ["Process", "#process"],
  ["Studio", "#studio"],
] as const;

const principles = [
  ["Clarity first", "Every screen and workflow earns its place."],
  ["Built to scale", "Systems stay maintainable as your business grows."],
  ["Launch ready", "Responsive, accessible, and production-minded."],
];

const steps = [
  ["01", "Discover", "We map your goals, users, constraints, and the opportunity worth building for."],
  ["02", "Design", "We turn the strategy into an interface and system that feels clear from day one."],
  ["03", "Engineer", "We build the product with modern, maintainable technology and visible progress."],
  ["04", "Launch", "We test every screen, deploy the experience, and stay close after release."],
];

const faqs = [
  ["What can ArclivoLabs build?", "Websites, e-commerce experiences, custom software, dashboards, CRM systems, mobile products, automation workflows, and digital brand systems."],
  ["Can you redesign an existing product?", "Yes. We can audit what exists, preserve the parts that work, and redesign the experience and technical foundation around your current business needs."],
  ["How does a project begin?", "Share the outcome you want, your timing, and any current material. We will shape that into a clear first conversation and recommended scope."],
  ["Do you work with startups and growing businesses?", "Yes. We shape the engagement around the most valuable version to launch now while keeping room for what comes next."],
];

function Logo() {
  return (
    <span className="lab-logo" aria-label="ArclivoLabs Tech">
      <span className="lab-logo__mark" aria-hidden="true"><Braces size={19} strokeWidth={2.4} /></span>
      <span className="lab-logo__text">ARCLIVO<span>LABS</span></span>
      <small>TECH</small>
    </span>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  return (
    <header className={`lab-header${scrolled ? " is-scrolled" : ""}${menuOpen ? " is-menu-open" : ""}`}>
      <Link className="lab-header__logo" href="#top" onClick={() => setMenuOpen(false)}><Logo /></Link>
      <nav className="lab-nav" aria-label="Primary navigation">
        {navItems.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
      </nav>
      <Link className="lab-button lab-button--small lab-button--lime lab-header__cta" href="#contact">Start a project</Link>
      <button className="lab-menu" type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <AnimatePresence>
        {menuOpen && (
          <motion.nav className="lab-mobile-nav" aria-label="Mobile navigation" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {navItems.map(([label, href], index) => (
              <Link href={href} key={href} onClick={() => setMenuOpen(false)}><span>0{index + 1}</span>{label}</Link>
            ))}
            <Link className="lab-button lab-button--lime" href="#contact" onClick={() => setMenuOpen(false)}>Start a project</Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function Hero() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="lab-hero" id="top" aria-labelledby="hero-title">
      <div className="lab-hero__glow" aria-hidden="true" />
      <div className="lab-shell lab-hero__inner">
        <motion.div className="lab-hero__copy" initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .7 }}>
          <p className="lab-eyebrow"><span>Independent digital engineering studio</span></p>
          <h1 id="hero-title">WE BUILD<br />DIGITAL <em>SYSTEMS</em><br />THAT MOVE.</h1>
          <div className="lab-hero__intro">
            <p>Strategy, design, and engineering for ambitious businesses ready to turn bold ideas into working digital products.</p>
            <div className="lab-hero__actions">
              <Link className="lab-button lab-button--lime" href="#contact">Build with us <Sparkles size={16} /></Link>
              <Link className="lab-button lab-button--ghost" href="#work">Explore our work <Play size={14} fill="currentColor" /></Link>
            </div>
          </div>
        </motion.div>

        <motion.div className="lab-hero__visual" initial={{ opacity: 0, scale: reduceMotion ? 1 : .97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduceMotion ? 0 : .85, delay: .15 }}>
          <Image src="/images/digital-workspace.jpg" alt="Modern illuminated laptop in a dark technology workspace" fill priority sizes="(max-width: 900px) 100vw, 48vw" />
          <div className="lab-hero__scan" aria-hidden="true" />
          <div className="lab-hero__visual-top"><span>ARCLIVO / BUILD SYSTEM</span><span>V.2026</span></div>
          <div className="lab-code-card">
            <div className="lab-code-card__top"><span><i /> LIVE BUILD</span><span>01:24:18</span></div>
            <code><b>const</b> next = <span>await</span> studio.build(&#123;<br />&nbsp;&nbsp;idea: <i>&quot;ambitious&quot;</i>,<br />&nbsp;&nbsp;quality: <i>&quot;production&quot;</i><br />&#125;);</code>
            <div className="lab-code-card__meter"><span /></div>
          </div>
          <div className="lab-hero__visual-bottom"><span><Cpu size={15} /> Design-led engineering</span><span>IND / GLOBAL</span></div>
        </motion.div>
      </div>
      <div className="lab-tech-strip" aria-label="Technologies we use">
        <div className="lab-tech-strip__track">
          {["NEXT.JS", "REACT", "TYPESCRIPT", "NODE.JS", "MONGODB", "SHOPIFY", "FIGMA", "REST API", "NEXT.JS", "REACT", "TYPESCRIPT", "NODE.JS", "MONGODB", "SHOPIFY", "FIGMA", "REST API"].map((item, i) => <span key={`${item}-${i}`}>{item}<i /></span>)}
        </div>
      </div>
    </section>
  );
}

function Services({ services }: { services: PublicService[] }) {
  return (
    <section className="lab-section lab-services" id="services" aria-labelledby="services-title">
      <div className="lab-shell">
        <ScrollReveal className="lab-heading">
          <div><span className="lab-index">01 / CAPABILITIES</span><span className="lab-heading__line" /></div>
          <h2 id="services-title">One studio.<br /><em>Every layer.</em></h2>
          <p>We bring product thinking, visual craft, and reliable engineering into one connected build process.</p>
        </ScrollReveal>
        <div className="lab-service-grid">
          {services.map((service, index) => {
            const Icon = iconMap[service.iconId as keyof typeof iconMap] ?? Code2;
            return (
              <ScrollReveal className={`lab-service-card lab-service-card--${(index % 3) + 1}`} delay={Math.min(index * .04, .2)} key={service.id}>
                <div className="lab-service-card__top"><span>{service.number}</span><Icon size={22} strokeWidth={1.6} /></div>
                <div><h3>{service.name}</h3><p>{service.description}</p></div>
                <span className="lab-service-card__tag">{service.marker}</span>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Work() {
  return (
    <section className="lab-section lab-work" id="work" aria-labelledby="work-title">
      <div className="lab-shell">
        <ScrollReveal className="lab-heading lab-heading--light">
          <div><span className="lab-index">02 / SELECTED DIRECTIONS</span><span className="lab-heading__line" /></div>
          <h2 id="work-title">Interfaces with<br /><em>real intent.</em></h2>
          <p>Concept directions that show how business systems can feel clearer, faster, and more human.</p>
        </ScrollReveal>
        <div className="lab-work-grid">
          <ScrollReveal className="lab-project lab-project--wide">
            <div className="lab-project__media">
              <Image src="/images/data-dashboard.jpg" alt="Business analytics dashboard with charts and performance data" fill sizes="(max-width: 900px) 100vw, 62vw" />
              <span className="lab-project__badge">Product systems / 01</span>
              <div className="lab-project__hud"><Gauge size={18} /><span>Live intelligence<br /><b>Decision-ready data</b></span></div>
            </div>
            <div className="lab-project__info"><span>CRM + Analytics</span><h3>Operations, in focus.</h3><p>A connected dashboard direction for making priorities, performance, and team workflows visible in one place.</p><div><span>Next.js</span><span>Data systems</span><span>UX strategy</span></div></div>
          </ScrollReveal>
          <ScrollReveal className="lab-project" delay={.08}>
            <div className="lab-project__media lab-project__media--portrait">
              <Image src="/images/tech-hero.jpg" alt="Developer workstation showing code on a laptop" fill sizes="(max-width: 900px) 100vw, 38vw" />
              <span className="lab-project__badge">Digital platform / 02</span>
              <div className="lab-terminal"><span>deploy@arclivo:~</span><strong>✓ Production ready</strong><i /></div>
            </div>
            <div className="lab-project__info"><span>Web engineering</span><h3>Fast by architecture.</h3><p>A high-performance web direction built around clarity, conversion, and a maintainable content system.</p><div><span>React</span><span>TypeScript</span><span>Performance</span></div></div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function Process() {
  return (
    <section className="lab-section lab-process" id="process" aria-labelledby="process-title">
      <div className="lab-shell">
        <ScrollReveal className="lab-heading">
          <div><span className="lab-index">03 / THE BUILD SYSTEM</span><span className="lab-heading__line" /></div>
          <h2 id="process-title">From idea to<br /><em>live product.</em></h2>
          <p>A direct, collaborative process with decisions made visible and momentum maintained.</p>
        </ScrollReveal>
        <div className="lab-process-grid">
          {steps.map(([number, title, text], index) => (
            <ScrollReveal className="lab-process-step" delay={index * .08} key={number}>
              <div><span>{number}</span><i /></div><h3>{title}</h3><p>{text}</p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Studio() {
  return (
    <section className="lab-section lab-studio" id="studio" aria-labelledby="studio-title">
      <div className="lab-shell lab-studio__grid">
        <ScrollReveal className="lab-studio__media">
          <Image src="/images/team-collaboration.jpg" alt="Software team collaborating around laptops" fill sizes="(max-width: 900px) 100vw, 46vw" />
          <div className="lab-studio__stamp"><Braces size={25} /><span>IDEAS<br />IN MOTION</span></div>
        </ScrollReveal>
        <ScrollReveal className="lab-studio__copy" delay={.08}>
          <span className="lab-index">04 / THE STUDIO</span>
          <h2 id="studio-title">Small team.<br /><em>Sharp thinking.</em></h2>
          <p className="lab-studio__lead">ArclivoLabs is an independent digital engineering studio for people building what comes next.</p>
          <p>We pair thoughtful product design with modern technology to create websites, platforms, and software that are useful, distinctive, and ready to grow.</p>
          <div className="lab-principles">
            {principles.map(([title, text]) => <div key={title}><Check size={17} /><span><strong>{title}</strong>{text}</span></div>)}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="lab-section lab-faq" aria-labelledby="faq-title">
      <div className="lab-shell lab-faq__grid">
        <ScrollReveal className="lab-faq__heading"><span className="lab-index">05 / FAQ</span><h2 id="faq-title">Good questions.<br /><em>Clear answers.</em></h2></ScrollReveal>
        <div className="lab-faq__list">
          {faqs.map(([question, answer], index) => {
            const isOpen = open === index;
            return <article className={isOpen ? "is-open" : ""} key={question}><button type="button" onClick={() => setOpen(isOpen ? -1 : index)} aria-expanded={isOpen}><span>0{index + 1}</span><strong>{question}</strong><i>{isOpen ? "−" : "+"}</i></button><AnimatePresence initial={false}>{isOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}><p>{answer}</p></motion.div>}</AnimatePresence></article>;
          })}
        </div>
      </div>
    </section>
  );
}

type FormState = { fullName: string; email: string; phone: string; companyName: string; projectType: string; estimatedBudget: string; projectDescription: string; whatsappConsent: boolean; website: string };
const emptyForm: FormState = { fullName: "", email: "", phone: "", companyName: "", projectType: "", estimatedBudget: "", projectDescription: "", whatsappConsent: false, website: "" };

function Contact() {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const update = (key: keyof FormState, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending"); setMessage("");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || "Unable to send your enquiry.");
      setStatus("sent"); setForm(emptyForm);
    } catch (error) {
      setStatus("error"); setMessage(error instanceof Error ? error.message : "Unable to send your enquiry.");
    }
  }

  return (
    <section className="lab-contact" id="contact" aria-labelledby="contact-title">
      <div className="lab-contact__orb" aria-hidden="true" />
      <div className="lab-shell lab-contact__grid">
        <ScrollReveal className="lab-contact__copy"><span className="lab-index">06 / START A PROJECT</span><h2 id="contact-title">LET&apos;S BUILD<br /><em>WHAT&apos;S NEXT.</em></h2><p>Tell us what you are planning. We will turn the ambition into a clear, practical first step.</p><div className="lab-contact__availability"><i /> Currently accepting selected projects</div></ScrollReveal>
        <ScrollReveal className="lab-contact__form-wrap" delay={.08}>
          {status === "sent" ? <div className="lab-success"><span><Check size={27} /></span><h3>Message received.</h3><p>Thank you. We&apos;ll review your project and get back to you soon.</p><button className="lab-button lab-button--ghost" type="button" onClick={() => setStatus("idle")}>Send another message</button></div> :
          <form className="lab-contact-form" onSubmit={submit}>
            <div className="lab-field"><label htmlFor="fullName">Name *</label><input id="fullName" required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Your name" autoComplete="name" /></div>
            <div className="lab-field"><label htmlFor="email">Email *</label><input id="email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@company.com" autoComplete="email" /></div>
            <div className="lab-field"><label htmlFor="companyName">Company</label><input id="companyName" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="Company name" autoComplete="organization" /></div>
            <div className="lab-field"><label htmlFor="projectType">What are we building? *</label><select id="projectType" required value={form.projectType} onChange={(e) => update("projectType", e.target.value)}><option value="">Choose a project type</option>{SERVICE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></div>
            <div className="lab-field lab-field--full"><label htmlFor="projectDescription">Project brief *</label><textarea id="projectDescription" required minLength={20} rows={4} value={form.projectDescription} onChange={(e) => update("projectDescription", e.target.value)} placeholder="Your goal, timeline, and what success looks like..." /></div>
            <input className="lab-honeypot" aria-hidden="true" tabIndex={-1} value={form.website} onChange={(e) => update("website", e.target.value)} />
            {status === "error" && <p className="lab-form-error" role="alert">{message}</p>}
            <div className="lab-contact-form__bottom"><p>Your idea stays confidential. No spam, no pressure.</p><button className="lab-button lab-button--lime" disabled={status === "sending"} type="submit">{status === "sending" ? "Sending..." : "Send project brief"}<Send size={15} /></button></div>
          </form>}
        </ScrollReveal>
      </div>
    </section>
  );
}

function Footer() {
  return <footer className="lab-footer"><div className="lab-shell"><Logo /><p>Designing and engineering useful digital products from India to the world.</p><div className="lab-footer__links"><Link href="#services">Services</Link><Link href="#work">Work</Link><Link href="#studio">Studio</Link><Link href="#contact">Contact</Link></div><div className="lab-footer__bottom"><span>© {new Date().getFullYear()} ArclivoLabs Tech</span><span>Technology / Design / Engineering</span><Link href="#top">Back to top</Link></div></div></footer>;
}

export function TechExperience({ services }: { services: PublicService[] }) {
  return (
    <div className="tech-site">
      <a className="lab-skip" href="#content">Skip to content</a>
      <Header />
      <main id="content"><Hero /><Services services={services} /><Work /><Process /><Studio /><Faq /><Contact /></main>
      <Footer />
    </div>
  );
}
