import { NextResponse, type NextRequest } from "next/server";
import { requireActor } from "@/lib/auth/dal";
import { getCrmService } from "@/lib/services/crm-service";
import { leadsToCsv } from "@/lib/services/csv-export";
import { isValidLeadStatus, LEAD_SOURCES, type LeadSource } from "@/domain/lead";

// Route Handlers sit outside the (protected) layout tree, so they are
// NOT covered by its requireActor() call — auth must be checked here
// explicitly too, same as every other admin mutation/read boundary.
export async function GET(request: NextRequest) {
  await requireActor();

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const source = searchParams.get("source") ?? undefined;
  const projectType = searchParams.get("projectType") ?? undefined;
  const language = searchParams.get("language") ?? undefined;

  const MAX_EXPORT_ROWS = 5000;
  const result = await getCrmService().listLeads(
    {
      search,
      status: status && isValidLeadStatus(status) ? status : undefined,
      source: source && (LEAD_SOURCES as readonly string[]).includes(source) ? (source as LeadSource) : undefined,
      projectType: projectType || undefined,
      language: language || undefined,
    },
    { field: "createdAt", direction: "desc" },
    1,
    MAX_EXPORT_ROWS,
  );

  const csv = leadsToCsv(result.items);
  const filename = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
