import { ArrowUp } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <strong>ARCLIVOLABS</strong>
          <span>TECHNOLOGY / DIGITAL ENGINEERING</span>
        </div>
        <Link className="site-footer__contact" href="#contact">
          Get in touch
        </Link>
        <div className="site-footer__right">
          <span className="site-footer__copyright">
            © {new Date().getFullYear()} ArclivoLabs Tech
          </span>
          <Link className="back-to-top" href="#home">
            Back to top <ArrowUp aria-hidden="true" size={14} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
