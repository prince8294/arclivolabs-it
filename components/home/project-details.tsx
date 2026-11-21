"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Project } from "@/lib/projects";

interface ProjectDetailsProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectDetails({ project, onClose }: ProjectDetailsProps) {
  const reduceMotion = useReducedMotion();
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!project) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const handleKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        event.preventDefault();
        closeButton.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeys);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeys);
    };
  }, [onClose, project]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          animate={{ opacity: 1 }}
          className="project-dialog-backdrop"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
        >
          <motion.section
            aria-labelledby="project-dialog-title"
            aria-modal="true"
            className="project-dialog"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            role="dialog"
            transition={reduceMotion ? { duration: 0 } : { duration: 0.24 }}
          >
            <div className="project-dialog__top">
              <span className="project-concept-label">
                {project.caseStudy ? "Case study" : "Concept preview"}
              </span>
              <button
                aria-label="Close concept preview"
                className="project-dialog__close"
                onClick={onClose}
                ref={closeButton}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            <p className="eyebrow">{project.category}</p>
            <h2 id="project-dialog-title">{project.name}</h2>
            <p>{project.description}</p>
            {project.caseStudy ? (
              <p className="project-dialog__case-study">{project.caseStudy}</p>
            ) : (
              <div className="project-dialog__note">
                <span>Exploratory direction</span>
                <span>
                  This is a concept placeholder, not a completed client project.
                  The tools below are illustrative.
                </span>
              </div>
            )}
            <div className="project-dialog__stack">
              <span>{project.stackLabel}</span>
              <div>
                {project.technologyStack.map((technology) => (
                  <span key={technology}>{technology}</span>
                ))}
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
