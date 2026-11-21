"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, LoaderCircle } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { BUDGET_OPTIONS, SERVICE_OPTIONS } from "@/lib/service-options";
import { enquirySchema } from "@/lib/validations/enquiry";

interface ContactFormValues {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  projectType: string;
  estimatedBudget: string;
  projectDescription: string;
  whatsappConsent: boolean;
}

interface ApiResponse {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

const initialValues: ContactFormValues = {
  fullName: "",
  email: "",
  phone: "",
  companyName: "",
  projectType: "",
  estimatedBudget: "",
  projectDescription: "",
  whatsappConsent: false,
};

function ContactArtwork() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden="true" className="contact-artwork">
      <div className="contact-artwork__caption">
        <span>IDEA → INTERFACE → IMPACT</span>
        <span>AL / 004</span>
      </div>
      <svg fill="none" viewBox="0 0 500 310">
        <defs>
          <linearGradient id="contact-beam" x1="58" x2="429" y1="264" y2="49">
            <stop stopColor="#365BFF" stopOpacity=".08" />
            <stop offset=".5" stopColor="#365BFF" />
            <stop offset="1" stopColor="#365BFF" stopOpacity=".1" />
          </linearGradient>
        </defs>
        <path d="M37 265h426M70 282V34" stroke="#E4E7ED" />
        <path d="M61 220h18M61 168h18M61 116h18M61 64h18" stroke="#CCD1DB" />
        <motion.path
          d="m93 231 70-41 61 11 63-78 48 13 78-83"
          initial={{ opacity: reduceMotion ? 1 : 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1.2, ease: "easeInOut" }}
          stroke="url(#contact-beam)"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
        <motion.circle
          cx="397"
          cy="53"
          r="7"
          fill="#EAF0FF"
          stroke="#365BFF"
          animate={reduceMotion ? undefined : { scale: [1, 1.18, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <circle cx="163" cy="190" r="4" fill="white" stroke="#365BFF" />
        <circle cx="287" cy="123" r="4" fill="white" stroke="#365BFF" />
        <path d="M287 123v-39h64" stroke="#CFD5E1" strokeDasharray="3 5" />
        <text x="355" y="82" fill="#777D87" fontSize="8" letterSpacing="1.4">POSSIBILITY / 01</text>
        <text x="91" y="253" fill="#777D87" fontSize="8" letterSpacing="1.4">START WITH A QUESTION</text>
      </svg>
      <div className="contact-artwork__bottom">
        <span>THOUGHTFUL FROM THE FIRST CONVERSATION</span>
        <i />
      </div>
    </div>
  );
}

function SuccessMessage({ onReset }: { onReset: () => void }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="contact-success"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      role="status"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.32 }}
    >
      <span className="contact-success__icon">
        <Check aria-hidden="true" size={23} />
      </span>
      <span className="section-kicker">ENQUIRY RECEIVED</span>
      <h3>YOUR MESSAGE IS ON ITS WAY.</h3>
      <p>Thank you for reaching out. We&apos;ve received your project enquiry.</p>
      <button className="contact-success__reset" onClick={onReset} type="button">
        Send another enquiry
        <ArrowUpRight aria-hidden="true" size={15} />
      </button>
    </motion.div>
  );
}

export function ContactSection() {
  const reduceMotion = useReducedMotion();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const submissionLock = useRef(false);
  const [website, setWebsite] = useState("");

  const updateValue = (field: keyof ContactFormValues, value: string | boolean) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionLock.current || isSubmitting) return;

    setFormError("");
    const parsed = enquirySchema.safeParse({
      ...values,
      estimatedBudget: values.estimatedBudget || undefined,
      phone: values.phone || undefined,
      companyName: values.companyName || undefined,
      website,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      setFormError("A couple of details need your attention.");
      return;
    }

    submissionLock.current = true;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const result = (await response.json()) as ApiResponse;
      if (!response.ok || !result.ok) {
        if (result.fieldErrors) {
          const nextErrors: Record<string, string> = {};
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (messages?.[0]) nextErrors[field] = messages[0];
          }
          setErrors(nextErrors);
        }
        setFormError(result.message || "We could not submit your enquiry. Please try again.");
        return;
      }
      setIsComplete(true);
    } catch {
      setFormError("We could not reach the server. Please try again.");
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setFormError("");
    setWebsite("");
    setIsComplete(false);
  };

  return (
    <section
      aria-labelledby="contact-title"
      className="contact-section"
      id="contact"
    >
      <div className="section-shell contact-section__layout">
        <ScrollReveal className="contact-section__intro">
          <span className="section-kicker">04 / LET&apos;S CONNECT</span>
          <h2 id="contact-title">
            LET&apos;S TURN YOUR
            <br />
            IDEA INTO REALITY.
          </h2>
          <p>
            Tell us what you&apos;re planning. Let&apos;s explore the right
            digital solution for your business.
          </p>
          <span className="contact-section__trust">
            No pressure. Just a thoughtful first conversation.
          </span>
          <ContactArtwork />
        </ScrollReveal>

        <ScrollReveal className="contact-form-wrap" delay={0.1}>
          <AnimatePresence mode="wait" initial={false}>
            {isComplete ? (
              <SuccessMessage key="success" onReset={resetForm} />
            ) : (
              <motion.form
                animate={{ opacity: 1, y: 0 }}
                className="contact-form"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                key="form"
                onSubmit={handleSubmit}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.28 }}
              >
                <div className="contact-form__heading">
                  <span className="section-kicker">PROJECT ENQUIRY</span>
                  <p>Fields marked <span aria-hidden="true">*</span> are required.</p>
                </div>

                <div aria-live="polite" className="contact-form__notice">
                  {formError && <p role="alert">{formError}</p>}
                </div>

                <div className="contact-form__grid">
                  <div className={`contact-field${errors.fullName ? " has-error" : ""}`}>
                    <label htmlFor="fullName">Full Name <span>*</span></label>
                    <input
                      autoComplete="name"
                      id="fullName"
                      maxLength={100}
                      name="fullName"
                      onChange={(event) => updateValue("fullName", event.target.value)}
                      placeholder="Your full name"
                      required
                      value={values.fullName}
                      aria-describedby={errors.fullName ? "fullName-error" : undefined}
                    />
                    {errors.fullName && <span className="contact-field__error" id="fullName-error">{errors.fullName}</span>}
                  </div>
                  <div className={`contact-field${errors.email ? " has-error" : ""}`}>
                    <label htmlFor="email">Email Address <span>*</span></label>
                    <input
                      autoComplete="email"
                      id="email"
                      maxLength={254}
                      name="email"
                      onChange={(event) => updateValue("email", event.target.value)}
                      placeholder="you@company.com"
                      required
                      type="email"
                      value={values.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                    />
                    {errors.email && <span className="contact-field__error" id="email-error">{errors.email}</span>}
                  </div>
                  <div className={`contact-field${errors.phone ? " has-error" : ""}`}>
                    <label htmlFor="phone">Phone Number <span className="contact-field__optional">Optional</span></label>
                    <input
                      autoComplete="tel"
                      id="phone"
                      inputMode="tel"
                      maxLength={30}
                      name="phone"
                      onChange={(event) => updateValue("phone", event.target.value)}
                      placeholder="+91 98765 43210"
                      type="tel"
                      value={values.phone}
                      aria-describedby={errors.phone ? "phone-error" : "phone-hint"}
                    />
                    {errors.phone ? (
                      <span className="contact-field__error" id="phone-error">{errors.phone}</span>
                    ) : (
                      <span className="contact-field__hint" id="phone-hint">Include your country calling code.</span>
                    )}
                  </div>
                  <div className="contact-field">
                    <label htmlFor="companyName">Company / Business Name <span className="contact-field__optional">Optional</span></label>
                    <input
                      autoComplete="organization"
                      id="companyName"
                      maxLength={120}
                      name="companyName"
                      onChange={(event) => updateValue("companyName", event.target.value)}
                      placeholder="Your company name"
                      value={values.companyName}
                    />
                  </div>
                  <div className={`contact-field${errors.projectType ? " has-error" : ""}`}>
                    <label htmlFor="projectType">Project Type <span>*</span></label>
                    <select
                      id="projectType"
                      name="projectType"
                      onChange={(event) => updateValue("projectType", event.target.value)}
                      required
                      value={values.projectType}
                      aria-describedby={errors.projectType ? "projectType-error" : undefined}
                    >
                      <option disabled value="">Choose a project type</option>
                      {SERVICE_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    {errors.projectType && <span className="contact-field__error" id="projectType-error">{errors.projectType}</span>}
                  </div>
                  <div className="contact-field">
                    <label htmlFor="estimatedBudget">Estimated Budget <span className="contact-field__optional">Optional</span></label>
                    <select
                      id="estimatedBudget"
                      name="estimatedBudget"
                      onChange={(event) => updateValue("estimatedBudget", event.target.value)}
                      value={values.estimatedBudget}
                    >
                      <option value="">Select a range</option>
                      {BUDGET_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className={`contact-field contact-field--wide${errors.projectDescription ? " has-error" : ""}`}>
                    <label htmlFor="projectDescription">Project Description <span>*</span></label>
                    <textarea
                      id="projectDescription"
                      maxLength={5000}
                      minLength={20}
                      name="projectDescription"
                      onChange={(event) => updateValue("projectDescription", event.target.value)}
                      placeholder="Tell us about your project, business goals, and what you'd like to build..."
                      required
                      rows={4}
                      value={values.projectDescription}
                      aria-describedby={errors.projectDescription ? "projectDescription-error" : "description-hint"}
                    />
                    {errors.projectDescription ? (
                      <span className="contact-field__error" id="projectDescription-error">{errors.projectDescription}</span>
                    ) : (
                      <span className="contact-field__hint" id="description-hint">20–5,000 characters</span>
                    )}
                  </div>
                </div>

                <div className="contact-consent">
                  <input
                    checked={values.whatsappConsent}
                    id="whatsappConsent"
                    name="whatsappConsent"
                    onChange={(event) => updateValue("whatsappConsent", event.target.checked)}
                    type="checkbox"
                  />
                  <div>
                    <label htmlFor="whatsappConsent">
                      I agree to receive project-related updates from ArclivoLabs
                      Tech via WhatsApp.
                    </label>
                    <p>
                      Sending an enquiry does not opt you into promotional
                      marketing. That would require a separate choice.
                    </p>
                  </div>
                </div>

                <div className="contact-form__actions">
                  <button
                    className="button button--primary contact-submit"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? (
                      <>
                        Sending enquiry
                        <LoaderCircle aria-hidden="true" className="contact-submit__spinner" size={16} />
                      </>
                    ) : (
                      <>
                        Send Project Enquiry
                        <span className="button__arrow">
                          <ArrowUpRight aria-hidden="true" size={16} />
                        </span>
                      </>
                    )}
                  </button>
                  <span>We&apos;ll review your enquiry with care.</span>
                </div>

                <div className="contact-honeypot" aria-hidden="true">
                  <label htmlFor="website">Leave this field empty</label>
                  <input
                    autoComplete="off"
                    id="website"
                    name="website"
                    onChange={(event) => setWebsite(event.target.value)}
                    tabIndex={-1}
                    value={website}
                  />
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </ScrollReveal>
      </div>
    </section>
  );
}
