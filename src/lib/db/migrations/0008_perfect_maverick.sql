CREATE TABLE "seo_job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_type" text NOT NULL,
	"run_id" text NOT NULL,
	"status" text DEFAULT 'RUNNING' NOT NULL,
	"triggered_by" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"counts" jsonb,
	"error_summary" text,
	"source_freshness" jsonb,
	"report_snapshot" jsonb,
	CONSTRAINT "seo_job_runs_status_check" CHECK ("seo_job_runs"."status" IN ('RUNNING', 'SUCCEEDED', 'FAILED', 'PARTIAL', 'TIMED_OUT'))
);
--> statement-breakpoint
CREATE INDEX "seo_job_runs_job_type_status_idx" ON "seo_job_runs" USING btree ("job_type","status");--> statement-breakpoint
CREATE INDEX "seo_job_runs_started_at_idx" ON "seo_job_runs" USING btree ("started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "seo_job_runs_one_running_per_type_idx" ON "seo_job_runs" USING btree ("job_type") WHERE "seo_job_runs"."status" = 'RUNNING';