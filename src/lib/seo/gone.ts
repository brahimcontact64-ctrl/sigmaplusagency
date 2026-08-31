/**
 * 410 Gone mechanism — prepared, not wired to any route, per the
 * brief's explicit "do not use 410 without a real removed page." See
 * docs/SEO_STRATEGY.md "410 foundation" for the full policy.
 *
 * Unlike 404, the App Router has no special `gone.tsx` file convention
 * or a `notFound()`-style helper for emitting a 410 status from a
 * Server Component. The correct mechanism when content is genuinely,
 * permanently removed is a Route Handler for that specific path (or a
 * `NextResponse` returned from `src/proxy.ts` for a whole removed
 * section) that returns this response instead of rendering a page.
 *
 * Example future usage, once a real page is actually removed:
 *
 *   // src/app/[locale]/work/some-retired-project/route.ts
 *   import { goneResponse } from "@/lib/seo/gone";
 *   export function GET() { return goneResponse(); }
 */
export function goneResponse(): Response {
  return new Response("Gone", { status: 410, headers: { "Content-Type": "text/plain" } });
}
