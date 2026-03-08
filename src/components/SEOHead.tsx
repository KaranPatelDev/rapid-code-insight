import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
}

const BASE_TITLE = "CodeLens AI";
const DEFAULT_DESCRIPTION = "AI-powered code analysis with 13 specialized modes. Paste code or connect GitHub repos for instant architecture, security, performance, and debugging insights.";

export function SEOHead({ title, description }: SEOHeadProps) {
  const fullTitle = title ? `${title} — ${BASE_TITLE}` : `${BASE_TITLE} — Understand Any Codebase in Seconds`;
  const desc = description || DEFAULT_DESCRIPTION;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (name: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", desc);
    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", desc, "property");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", desc);
  }, [fullTitle, desc]);

  return null;
}
