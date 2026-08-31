CREATE TABLE "article_slug_redirects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locale" text NOT NULL,
	"old_slug" text NOT NULL,
	"article_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"og_image" text,
	"editor_email" text,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"author" text NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"related_services" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"related_case_studies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_connections" (
	"provider" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'NOT_CONFIGURED' NOT NULL,
	"property_identifier" text,
	"last_synced_at" timestamp with time zone,
	"last_error" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seo_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"severity" text NOT NULL,
	"page" text NOT NULL,
	"locale" text,
	"reason" text NOT NULL,
	"recommended_action" text NOT NULL,
	"source" text NOT NULL,
	"confidence" real NOT NULL,
	"status" text DEFAULT 'RECOMMENDED' NOT NULL,
	"reviewed_by_email" text,
	"reviewed_at" timestamp with time zone,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "article_slug_redirects" ADD CONSTRAINT "article_slug_redirects_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_translations" ADD CONSTRAINT "article_translations_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "article_slug_redirects_locale_old_slug_idx" ON "article_slug_redirects" USING btree ("locale","old_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "article_translations_locale_slug_idx" ON "article_translations" USING btree ("locale","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "article_translations_article_locale_idx" ON "article_translations" USING btree ("article_id","locale");--> statement-breakpoint
CREATE INDEX "article_translations_status_idx" ON "article_translations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seo_recommendations_status_idx" ON "seo_recommendations" USING btree ("status");