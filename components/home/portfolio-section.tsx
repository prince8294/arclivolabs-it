"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import type { Project } from "@/lib/projects";
import { ProjectDetails } from "./project-details";

function ProjectArtwork({ project }: { project: Project }) {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 70, damping: 20 });
  const y = useSpring(pointerY, { stiffness: 70, damping: 20 });

  const moveArtwork = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 8);
    pointerY.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 8);
  };

  return (
    <motion.div
      initial={{ clipPath: reduceMotion ? "inset(0)" : "inset(0 0 8% 0)" }}
      className={`project-visual project-visual--${project.visual}`}
      onPointerLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
      onPointerMove={moveArtwork}
      whileInView={{ clipPath: "inset(0)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.85, ease: [0.22, 1, 0.36, 1] }
      }
    >
      <motion.div
        className="project-visual__surface"
        style={reduceMotion ? undefined : { x, y }}
      >
        {project.coverImageUrl ? (
          <Image
            alt=""
            className="project-visual__cover"
            fill
            sizes="(max-width: 760px) 100vw, 60vw"
            src={project.coverImageUrl}
          />
        ) : project.visual === "commerce" ? (
          <div aria-hidden="true" className="mock-commerce">
            <div className="mock-commerce__bar">
              <span>OBJECT / STUDIO</span>
              <span>COLLECTION&nbsp;&nbsp; ABOUT&nbsp;&nbsp; BAG (0)</span>
            </div>
            <div className="mock-commerce__body">
              <div className="mock-commerce__copy">
                <span>OBJECTS FOR SLOWER LIVING</span>
                <strong>Form follows<br />feeling.</strong>
                <span className="mock-commerce__link">Explore collection ↗</span>
              </div>
              <div className="mock-commerce__object">
                <div className="mock-vase">
                  <i />
                </div>
                <span>01 — OBJECT STUDY</span>
              </div>
            </div>
            <div className="mock-commerce__footer">A considered digital storefront / CONCEPT</div>
          </div>
        ) : project.visual === "workspace" ? (
          <div aria-hidden="true" className="mock-workspace">
            <div className="mock-workspace__sidebar">
              <span className="mock-workspace__logo">a.</span>
              <i className="is-current" />
              <i />
              <i />
              <i />
              <span className="mock-workspace__avatar">A</span>
            </div>
            <div className="mock-workspace__main">
              <div className="mock-workspace__topline">
                <span>Workspace / Overview</span>
                <span>◷ &nbsp;This week</span>
              </div>
              <strong>Workspace, in focus.</strong>
              <p>A considered view of the work.</p>
              <div className="mock-workspace__stats">
                <div><small>WORKSTREAM</small><b>—</b><i /></div>
                <div><small>PRIORITY</small><b>—</b><i /></div>
                <div><small>STATUS</small><b>—</b><i /></div>
              </div>
              <div className="mock-workspace__chart">
                <div><span>System overview</span><span>Concept view</span></div>
                <svg viewBox="0 0 480 92" preserveAspectRatio="none">
                  <path d="M0 74C38 66 44 59 72 64s43-33 76-24 47 16 75 4 42 13 70-2 48-5 72-20 47 1 67-10 30-7 48-10" />
                  <path className="chart-fill" d="M0 74C38 66 44 59 72 64s43-33 76-24 47 16 75 4 42 13 70-2 48-5 72-20 47 1 67-10 30-7 48-10v92H0Z" />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <div aria-hidden="true" className="mock-mobile">
            <div className="mock-mobile__device">
              <div className="mock-mobile__notch" />
              <div className="mock-mobile__top"><span>9:41</span><span>•••</span></div>
              <div className="mock-mobile__greeting">A QUIETER KIND OF PRODUCT</div>
              <strong>Make room<br />for what matters.</strong>
              <div className="mock-mobile__feature">
                <span>YOUR WEEK, AT A GLANCE</span>
                <b>—</b>
                <small>things in motion</small>
                <i><span /></i>
              </div>
              <div className="mock-mobile__list">
                <span>Today <b>—</b></span>
                <span>Coming up <b>—</b></span>
              </div>
              <div className="mock-mobile__nav"><i /><i /><i /><i /></div>
            </div>
            <div className="mock-mobile__annotation">INTERACTION STUDY / 03</div>
          </div>
        )}
      </motion.div>
      <span className="project-visual__index">AL / {project.id.slice(0, 2).toUpperCase()}</span>
      <span aria-hidden="true" className="project-visual__corner">
        <ArrowDownRight size={19} />
      </span>
    </motion.div>
  );
}

function ProjectCard({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
  onOpen: (project: Project) => void;
}) {
  const featured = project.featured;

  return (
    <ScrollReveal
      className={`project-card${featured ? " project-card--featured" : ""}${index === 2 ? " project-card--offset" : ""}`}
      delay={index * 0.08}
    >
      <ProjectArtwork project={project} />
      <div className="project-card__details">
        <div className="project-card__meta">
          <span>{project.category}</span>
          <span>
            {project.year ? `${project.projectType} · ${project.year}` : project.projectType}
          </span>
        </div>
        <div className="project-card__heading">
          <div>
            <span className="project-card__number">0{index + 1} — SELECTED DIRECTION</span>
            <h3>{project.name}</h3>
          </div>
          {project.liveUrl ? (
            <a
              aria-label={`Visit ${project.name}`}
              className="project-card__action"
              href={project.liveUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ArrowUpRight aria-hidden="true" size={18} />
            </a>
          ) : (
            <button
              aria-label={`Explore ${project.name} concept`}
              className="project-card__action"
              onClick={() => onOpen(project)}
              type="button"
            >
              <ArrowUpRight aria-hidden="true" size={18} />
            </button>
          )}
        </div>
        <p className="project-card__description">{project.description}</p>
        <div className="project-card__bottom">
          <span>
            {project.stackLabel}: {project.technologyStack.slice(0, 2).join(" / ")}
          </span>
          {project.caseStudy && (
            <button
              className="text-link"
              onClick={() => onOpen(project)}
              type="button"
            >
              Read the case study <ArrowUpRight aria-hidden="true" size={14} />
            </button>
          )}
          {!project.liveUrl && !project.caseStudy && (
            <button
              className="text-link"
              onClick={() => onOpen(project)}
              type="button"
            >
              Explore concept <ArrowUpRight aria-hidden="true" size={14} />
            </button>
          )}
        </div>
      </div>
    </ScrollReveal>
  );
}

export function PortfolioSection({ projects }: { projects: Project[] }) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <section aria-labelledby="work-title" className="portfolio-section" id="work">
      <div className="section-shell">
        <ScrollReveal className="section-intro section-intro--portfolio">
          <span className="section-kicker">01 / SELECTED WORK</span>
          <div className="section-intro__body">
            <h2 id="work-title">
              DIGITAL EXPERIENCES.
              <br />
              BUILT TO MAKE AN IMPACT.
            </h2>
            <p>
              Explore the products, platforms, and digital experiences crafted
              with precision, creativity, and purpose.
            </p>
          </div>
          <span aria-hidden="true" className="section-intro__index">01—03</span>
        </ScrollReveal>

        <div className="portfolio-projects">
          {projects.map((project, index) => (
            <ProjectCard
              index={index}
              key={project.id}
              onOpen={setSelectedProject}
              project={project}
            />
          ))}
        </div>
        <div className="portfolio-note">
          <span className="portfolio-note__rule" />
          <p>
            Concept explorations are shown for visual direction only. They are
            not presented as completed client work.
          </p>
        </div>
      </div>
      <ProjectDetails
        onClose={() => setSelectedProject(null)}
        project={selectedProject}
      />
    </section>
  );
}
