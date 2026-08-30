/**
 * Next.js/Turbopack (confirmed on 16.3.3) has a bug where a dynamic
 * route segment's `params` value is still percent-encoded during the
 * `generateStaticParams`-driven prerender pass when the segment contains
 * non-ASCII characters (e.g. Arabic slugs) — even though the *filename*
 * it writes to disk is correctly decoded. A normal runtime request
 * decodes the segment properly, so this only bites statically generated
 * non-ASCII slugs, but it bit them hard: the mismatch made every
 * Arabic-slug service/project page 404 at build time. Matching against
 * both the raw and decoded form is a small, cheap guard that makes slug
 * lookups correct regardless of which form a given Next.js version hands
 * us. Revisit if a future Next release fixes the underlying bug.
 */
export function matchesSlug(candidate: string, requested: string): boolean {
  if (candidate === requested) return true;
  try {
    return candidate === decodeURIComponent(requested);
  } catch {
    return false;
  }
}
