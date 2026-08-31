import ReactMarkdown, { type Components } from "react-markdown";
import { Link } from "@/i18n/navigation";
import { sanitizeUrl } from "@/lib/content/sanitize-url";

/**
 * Article body renderer — Markdown only, never raw HTML (Phase 8
 * §12/§64: "prevent stored XSS... no arbitrary JavaScript from
 * content"). `react-markdown` does not process embedded HTML unless a
 * `rehype-raw`-style plugin is explicitly added — none is, here, which
 * is what actually blocks a `<script>`/`<style>` tag or an inline
 * event handler in stored content: it renders as literal escaped text,
 * never executes. The one other injection surface is a `javascript:`
 * URL in a markdown link/image, blocked separately via `urlTransform`
 * (see `sanitizeUrl` — kept in its own dependency-free module so it
 * stays directly unit-testable without pulling in `@/i18n/navigation`'s
 * client-side `Link`, which breaks outside Next's own bundler).
 *
 * Styled directly against the SIGMA+ design tokens rather than pulling
 * in `@tailwindcss/typography` for one component — matches the
 * project's standing "smallest production-suitable" preference.
 */

const components: Components = {
  h1: ({ children }) => <h2 className="mt-10 mb-4 text-2xl font-bold text-foreground first:mt-0">{children}</h2>,
  h2: ({ children }) => <h2 className="mt-10 mb-4 text-2xl font-bold text-foreground first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-8 mb-3 text-xl font-semibold text-foreground">{children}</h3>,
  p: ({ children }) => <p className="mb-5 leading-relaxed text-muted">{children}</p>,
  a: ({ href, children }) => {
    const safe = href ? sanitizeUrl(href) : "";
    if (!safe) return <span>{children}</span>;
    const isInternal = safe.startsWith("/");
    return isInternal ? (
      <Link href={safe} className="font-medium text-primary-bright underline-offset-2 hover:underline">
        {children}
      </Link>
    ) : (
      <a href={safe} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-bright underline-offset-2 hover:underline">
        {children}
      </a>
    );
  },
  ul: ({ children }) => <ul className="mb-5 list-inside list-disc space-y-2 text-muted">{children}</ul>,
  ol: ({ children }) => <ol className="mb-5 list-inside list-decimal space-y-2 text-muted">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-s-4 border-primary-bright/40 py-1 ps-4 text-foreground italic">{children}</blockquote>
  ),
  code: ({ children }) => <code className="rounded bg-graphite px-1.5 py-0.5 font-mono text-sm text-primary-bright">{children}</code>,
  pre: ({ children }) => (
    <pre className="mb-5 overflow-x-auto rounded-xl border border-border bg-surface p-4 text-sm">{children}</pre>
  ),
  img: ({ src, alt }) =>
    // eslint-disable-next-line @next/next/no-img-element -- content images come from arbitrary editor-authored URLs (Markdown), not next/image's static/remote-pattern-configured set; a plain <img> is the standard, correct choice for a rich-text renderer.
    typeof src === "string" ? <img src={sanitizeUrl(src)} alt={alt ?? ""} className="my-6 rounded-xl border border-border" loading="lazy" /> : null,
};

export function ArticleBody({ content }: { content: string }) {
  return (
    <div className="max-w-none text-base">
      <ReactMarkdown urlTransform={sanitizeUrl} skipHtml components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
