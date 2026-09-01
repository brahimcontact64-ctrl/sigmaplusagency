ALTER TABLE "project_requests" ADD COLUMN "budget_currency" text;--> statement-breakpoint
ALTER TABLE "project_requests" ADD COLUMN "budget_min_amount" integer;--> statement-breakpoint
ALTER TABLE "project_requests" ADD COLUMN "budget_max_amount" integer;