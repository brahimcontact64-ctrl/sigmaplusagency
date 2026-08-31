/**
 * Thin, reusable wrapper around the `<script type="application/ld+json">`
 * pattern — was previously duplicated ad hoc on the homepage, service
 * pages, and case-study pages. Pass an already-`withSchemaContext()`-wrapped
 * object (or an array via that helper's `@graph` support).
 */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
