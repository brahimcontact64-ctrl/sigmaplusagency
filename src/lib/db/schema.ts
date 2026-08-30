import { pgTable, text, timestamp, jsonb, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";

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

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("leads_email_normalized_idx").on(table.emailNormalized),
    index("leads_phone_normalized_idx").on(table.phoneNormalized),
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
