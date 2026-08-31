import { NextResponse, type NextRequest } from "next/server";
import { requireActor, assertRole } from "@/lib/auth/dal";
import { getCrmService } from "@/lib/services/crm-service";
import { ANALYTICS_VIEWER_ROLES } from "@/domain/admin-user";

/**
 * Internal single-lead data export (Phase 10 §57) — distinct from the
 * bulk CRM CSV export at /admin/leads/export. Route Handlers sit
 * outside the (protected) layout tree, so auth is checked here
 * explicitly. Gated tighter than the bulk export (which only requires
 * any authenticated admin): a full assembled lead record — including
 * the activity timeline and notes — is a meaningfully bigger PII
 * surface than a CSV row, so this reuses the OWNER/ADMIN-only role set
 * already established for the Analytics dashboard.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  try {
    assertRole(actor, ANALYTICS_VIEWER_ROLES);
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const detail = await getCrmService().exportLeadData(id, actor);
  if (!detail) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const filename = `lead-${detail.lead.publicReference}-export.json`;
  return new NextResponse(JSON.stringify(detail, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
