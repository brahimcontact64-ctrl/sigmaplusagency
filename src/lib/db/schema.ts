import { pgTable, text, timestamp, jsonb, uuid, index } from "drizzle-orm/pg-core";

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
