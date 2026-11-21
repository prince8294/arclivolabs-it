"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("We couldn’t verify those details. Please try again.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Sign in is temporarily unavailable. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      animate={{ opacity: 1, y: 0 }}
      className="admin-login-form"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
      onSubmit={handleSubmit}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.45 }}
    >
      <div className="admin-login-form__heading">
        <span className="admin-login-form__icon">
          <LockKeyhole aria-hidden="true" size={18} />
        </span>
        <div>
          <h2>Sign in</h2>
          <p>Enter your administrator credentials.</p>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            animate={{ opacity: 1, height: "auto" }}
            className="admin-login-form__error"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
            role="alert"
            transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="admin-login-field">
        <label htmlFor="admin-email">Email address</label>
        <input
          autoComplete="username"
          autoFocus
          id="admin-email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>
      <div className="admin-login-field">
        <label htmlFor="admin-password">Password</label>
        <div className="admin-login-field__password">
          <input
            autoComplete="current-password"
            id="admin-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="admin-login-field__toggle"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>
      <button className="admin-login-submit" disabled={submitting} type="submit">
        {submitting ? (
          <>
            Verifying access
            <LoaderCircle aria-hidden="true" className="admin-spinner" size={16} />
          </>
        ) : (
          "Sign in securely"
        )}
      </button>
      <p className="admin-login-form__footnote">
        This workspace is private. Access is limited to authorized administrators.
      </p>
    </motion.form>
  );
}
