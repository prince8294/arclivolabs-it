"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

function HeroArtwork() {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 45, damping: 18, mass: 0.5 });
  const y = useSpring(pointerY, { stiffness: 45, damping: 18, mass: 0.5 });

  useEffect(() => {
    if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;
    const moveArtwork = (event: PointerEvent) => {
      pointerX.set((event.clientX / window.innerWidth - 0.5) * 14);
      pointerY.set((event.clientY / window.innerHeight - 0.5) * 14);
    };
    window.addEventListener("pointermove", moveArtwork, { passive: true });
    return () => window.removeEventListener("pointermove", moveArtwork);
  }, [pointerX, pointerY, reduceMotion]);

  return (
    <motion.div
      aria-hidden="true"
      className="hero-art"
      style={reduceMotion ? undefined : { x, y }}
    >
      <span className="hero-art__label hero-art__label--top">SYSTEM / 001</span>
      <span className="hero-art__label hero-art__label--bottom">IDEA → ENGINE</span>
      <svg
        className="hero-art__svg"
        fill="none"
        viewBox="0 0 640 600"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hero-blue" x1="190" x2="470" y1="140" y2="500">
            <stop stopColor="#2447FF" />
            <stop offset="1" stopColor="#111318" />
          </linearGradient>
        </defs>
        <circle cx="320" cy="300" r="238" stroke="#DDE1E8" strokeDasharray="3 10" />
        <ellipse className="hero-art__orbit" cx="320" cy="300" rx="205" ry="82" stroke="#C8CED9" transform="rotate(-28 320 300)" />
        <ellipse className="hero-art__orbit hero-art__orbit--reverse" cx="320" cy="300" rx="94" ry="230" stroke="#BCC5FF" transform="rotate(35 320 300)" />
        <path d="M320 92v416M112 300h416" stroke="#EAECF0" strokeDasharray="4 8" />
        <g className="hero-art__core">
          <path d="m320 92 147 85v170l-147 85-147-85V177l147-85Z" fill="white" stroke="#C8CED9" />
          <path d="m320 92 147 85-147 85-147-85 147-85Z" fill="#F1F3FA" stroke="#C8CED9" />
          <path d="m320 262 147-85v170l-147 85V262Z" fill="url(#hero-blue)" fillOpacity=".92" stroke="#2447FF" />
          <path d="M320 262 173 177v170l147 85V262Z" fill="#FAFAF8" stroke="#C8CED9" />
          <path d="M320 262v170M173 177l147 85 147-85M320 92v170" stroke="#AEB6C7" />
          <circle cx="320" cy="92" r="7" fill="#2447FF" />
          <circle cx="467" cy="177" r="5" fill="#111318" />
          <circle cx="173" cy="347" r="5" fill="#2447FF" />
        </g>
        <circle cx="525" cy="300" r="4" fill="#2447FF" />
        <circle cx="115" cy="300" r="4" fill="#2447FF" />
      </svg>
    </motion.div>
  );
}

export function Hero() {
  const reduceMotion = useReducedMotion();
  const reveal = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0 },
  };
  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <section aria-labelledby="hero-title" className="hero" id="home">
      <div aria-hidden="true" className="hero__grid" />
      <div className="hero__content">
        <div className="hero__copy">
          <motion.p
            animate="visible"
            className="hero__eyebrow"
            initial="hidden"
            transition={{ ...transition, delay: 0.1 }}
            variants={reveal}
          >
            Digital engineering studio / Independent
          </motion.p>
          <h1 id="hero-title">
            <motion.span
              animate="visible"
              className="hero__line"
              initial="hidden"
              transition={{ ...transition, delay: 0.2 }}
              variants={reveal}
            >
              YOUR IDEAS.
            </motion.span>
            <motion.span
              animate="visible"
              className="hero__line hero__line--second"
              initial="hidden"
              transition={{ ...transition, delay: 0.34 }}
              variants={reveal}
            >
              OUR ENGINEERING.
              <span className="hero__accent"> NO LIMITS.</span>
            </motion.span>
          </h1>
          <motion.p
            animate="visible"
            className="hero__description"
            initial="hidden"
            transition={{ ...transition, delay: 0.47 }}
            variants={reveal}
          >
            We design, develop, and engineer powerful digital experiences that
            help ambitious businesses move forward.
          </motion.p>
          <motion.div
            animate="visible"
            className="hero__actions"
            initial="hidden"
            transition={{ ...transition, delay: 0.57 }}
            variants={reveal}
          >
            <Link className="button button--primary" href="#contact">
              Let&apos;s Build Something
              <span className="button__arrow">
                <ArrowUpRight aria-hidden="true" size={16} />
              </span>
            </Link>
            <Link className="button button--secondary" href="#services">
              Explore Our Services
              <span className="button__arrow">
                <ArrowDown aria-hidden="true" size={15} />
              </span>
            </Link>
          </motion.div>
          <motion.div
            animate="visible"
            className="hero__footnote"
            initial="hidden"
            transition={{ ...transition, delay: 0.69 }}
            variants={reveal}
          >
            Thoughtfully engineered. Intentionally different.
          </motion.div>
        </div>
        <HeroArtwork />
      </div>
      <Link aria-label="Scroll to our capabilities" className="hero__scroll" href="#services">
        Scroll to explore
      </Link>
    </section>
  );
}
