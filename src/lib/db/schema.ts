import { pgTable, text, timestamp, jsonb, uuid, boolean, real, integer, index, uniqueIndex } from "drizzle-orm/pg-core";

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicReference: text("public_reference").notNull().unique(),

    name: text("name").notNull(),
    email: text("email").notNull(),
    emailNormalized: text("email_normalized").notNull(),
    phone: text("phone"),
    phoneNormalized: text("phone_normalized"),
    company: text("company"),
    country: text("country"),
    language: text("language").notNull(),
    preferredContactMethod: text("preferred_contact_method"),

    source: text("source").notNull(),
    status: text("status").notNull().default("NEW"),

    landingPage: text("landing_page"),
    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmContent: text("utm_content"),
    utmTerm: text("utm_term"),

    // --- Phase 9: CRM revenue-readiness (all nullable, manual-entry only) ---
    // Money is always an integer minor-unit count (e.g. cents) + an
    // explicit currency — never a float, never inferred from a Project
    // Builder budget range (a range is not a contract value).
    lostReason: text("lost_reason"),
    lostNote: text("lost_note"),
    dealValueMinorUnits: integer("deal_value_minor_units"),
    dealCurrency: text("deal_currency"),
    wonAt: timestamp("won_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("leads_email_normalized_idx").on(table.emailNormalized),
    index("leads_phone_normalized_idx").on(table.phoneNormalized),
    index("leads_status_idx").on(table.status),
    index("leads_created_at_idx").on(table.createdAt),
  ],
);

export const projectRequests = pgTable(
  "project_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),

    projectType: text("project_type").notNull(),
    goals: jsonb("goals").$type<string[]>().notNull(),
    capabilities: jsonb("capabilities").$type<string[]>().notNull(),
    platforms: jsonb("platforms").$type<string[]>().notNull(),
    businessState: text("business_state").notNull(),
    currentWebsite: text("current_website"),
    timeline: text("timeline").notNull(),
    budgetRange: text("budget_range").notNull(),
    message: text("message"),
    structuredBrief: jsonb("structured_brief").notNull(),
    locale: text("locale").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // Postgres does not automatically index foreign key columns (unlike
  // primary keys) — without this, every "this lead's project requests"
  // lookup (already used by the smoke test, and by any future admin
  // view) would be a full table scan.
  (table) => [index("project_requests_lead_id_idx").on(table.leadId)],
);

export const leadActivities = pgTable(
  "lead_activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("lead_activities_lead_id_idx").on(table.leadId)],
);

// --- Phase 5: admin / CRM foundation --------------------------------

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    emailNormalized: text("email_normalized").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("admin_users_email_normalized_idx").on(table.emailNormalized)],
);

export const leadNotes = pgTable(
  "lead_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    // Nullable + set null (not cascade): a note must survive the
    // deletion of the admin account that wrote it — authorName is
    // captured at write time so the note stays attributable either way.
    authorId: uuid("author_id").references(() => adminUsers.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    note: text("note").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("lead_notes_lead_id_idx").on(table.leadId)],
);

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => adminUsers.id, { onDelete: "set null" }),
    actorEmail: text("actor_email").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("admin_audit_logs_actor_id_idx").on(table.actorId),
    index("admin_audit_logs_target_idx").on(table.targetType, table.targetId),
  ],
);

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedByEmail: text("updated_by_email"),
});

// --- Phase 6: SIGMA AI consultant ------------------------------------

export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Anonymous, browser-generated identifier (localStorage) — how an
    // unauthenticated visitor's conversation is scoped/resumed without
    // requiring an account. Not PII on its own.
    sessionId: text("session_id").notNull(),
    locale: text("locale").notNull(),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    projectRequestId: uuid("project_request_id").references(() => projectRequests.id, { onDelete: "set null" }),
    status: text("status").notNull().default("active"),
    qualificationState: jsonb("qualification_state").notNull(),
    summary: text("summary"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("ai_conversations_session_id_idx").on(table.sessionId),
    index("ai_conversations_lead_id_idx").on(table.leadId),
  ],
);

export const aiMessages = pgTable(
  "ai_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => aiConversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    // Already-limited, safe content only (see AI_LIMITS.maxMessageLength
    // and the assistant's own output cap) — never raw provider
    // request/response payloads, never internal CRM data.
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("ai_messages_conversation_id_idx").on(table.conversationId)],
);

// --- Phase 8: Insights/CMS content system ----------------------------

/**
 * The stable, locale-independent identity a set of translations
 * belongs to — see domain/article.ts. Tags/related-services/
 * related-case-studies are jsonb arrays rather than join tables
 * (same pattern already used for project_requests' goals/capabilities/
 * platforms) — editorial metadata at this scale doesn't earn a
 * separate normalized table yet.
 */
export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  author: text("author").notNull(),
  featured: boolean("featured").notNull().default(false),
  relatedServices: jsonb("related_services").$type<string[]>().notNull().default([]),
  relatedCaseStudies: jsonb("related_case_studies").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Status lives HERE, per translation, not on the parent `articles` row
 * — a French translation can be PUBLISHED while Arabic doesn't exist
 * yet or is still DRAFT (Phase 8 §9). `(locale, slug)` is globally
 * unique (a slug collision within one locale is a real bug, caught at
 * write time, not just by the audit engine); `(article_id, locale)` is
 * unique (one translation per locale per article).
 */
export const articleTranslations = pgTable(
  "article_translations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    status: text("status").notNull().default("DRAFT"),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    excerpt: text("excerpt").notNull(),
    // Markdown, rendered via react-markdown with raw HTML disabled by
    // default (see lib/content/render-markdown.tsx) — never stored/
    // rendered as trusted HTML.
    content: text("content").notNull(),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    ogImage: text("og_image"),
    editorEmail: text("editor_email"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("article_translations_locale_slug_idx").on(table.locale, table.slug),
    uniqueIndex("article_translations_article_locale_idx").on(table.articleId, table.locale),
    index("article_translations_status_idx").on(table.status),
  ],
);

/**
 * Anti-chain redirect design (Phase 8 §15): this maps an OLD slug
 * directly to the article, never to another slug string. Resolving a
 * redirect always looks up that article's CURRENT slug at request
 * time, so a slug changed twice (A → B → C) still redirects A straight
 * to C with no intermediate hop and no stale "B" row to maintain.
 */
export const articleSlugRedirects = pgTable(
  "article_slug_redirects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    locale: text("locale").notNull(),
    oldSlug: text("old_slug").notNull(),
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("article_slug_redirects_locale_old_slug_idx").on(table.locale, table.oldSlug)],
);

// --- Phase 8: SEO intelligence ----------------------------------------

/**
 * Connection *state* only — never a credential/token (see
 * domain/seo-intelligence.ts and docs/SEO_STRATEGY.md §51). If secure
 * OAuth token storage is ever added, it does not belong in this table.
 */
export const seoConnections = pgTable("seo_connections", {
  provider: text("provider").primaryKey(),
  status: text("status").notNull().default("NOT_CONFIGURED"),
  propertyIdentifier: text("property_identifier"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  lastError: text("last_error"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Approval-first (Phase 8 §42-43): a row here is never auto-applied to
 * anything public. `confidence` is a plain float 0-1, not a magic
 * "AI score" — see the opportunity-engine functions that populate it.
 */
export const seoRecommendations = pgTable(
  "seo_recommendations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    severity: text("severity").notNull(),
    page: text("page").notNull(),
    locale: text("locale"),
    reason: text("reason").notNull(),
    recommendedAction: text("recommended_action").notNull(),
    source: text("source").notNull(),
    confidence: real("confidence").notNull(),
    status: text("status").notNull().default("RECOMMENDED"),
    reviewedByEmail: text("reviewed_by_email"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("seo_recommendations_status_idx").on(table.status)],
);

// --- Phase 9: first-party analytics ----------------------------------

/**
 * Product/business funnel events only — never a surveillance log. See
 * docs/ANALYTICS_MEASUREMENT_PLAN.md for the full taxonomy and
 * docs/PRODUCTION_OPERATIONS.md for retention policy. Deliberately
 * does NOT store an IP address (this is not rate-limit storage — see
 * src/lib/security/rate-limit.ts for that) and does not attempt
 * fingerprinting; `anonymousSessionId` is a random, rotating,
 * first-party identifier (src/lib/analytics/session-id.ts).
 * `safeProperties` is only ever what already passed
 * `validateAnalyticsPayload()` (the closed dimension schema) — this
 * table is not a place arbitrary JSON can land.
 */
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventName: text("event_name").notNull(),
    anonymousSessionId: text("anonymous_session_id").notNull(),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    projectRequestId: uuid("project_request_id").references(() => projectRequests.id, { onDelete: "set null" }),
    locale: text("locale"),
    pagePath: text("page_path"),
    // "production" | "development" | "preview" — lets dashboards exclude
    // non-production noise (Phase 9 §70) without needing bot detection.
    environment: text("environment").notNull(),
    safeProperties: jsonb("safe_properties").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("analytics_events_name_created_at_idx").on(table.eventName, table.createdAt),
    index("analytics_events_session_idx").on(table.anonymousSessionId),
    index("analytics_events_lead_id_idx").on(table.leadId),
    index("analytics_events_created_at_idx").on(table.createdAt),
  ],
);
