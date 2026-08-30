import type { LeadListItem } from "@/lib/repositories/crm-repository";

/**
 * Spreadsheet formula injection ("CSV injection"): a cell starting
 * with =, +, -, or @ is interpreted as a formula by Excel/Sheets when
 * the file is opened, which can execute arbitrary commands via
 * DDE/macros. Prefixing with a single quote neutralizes it while
 * staying human-readable (Excel shows the quote-stripped text).
 * Values are always additionally wrapped in quotes with internal
 * quotes doubled, per RFC 4180.
 */
const DANGEROUS_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

export function sanitizeCsvCell(value: string): string {
  let safe = value;
  if (DANGEROUS_PREFIXES.some((prefix) => safe.startsWith(prefix))) {
    safe = `'${safe}`;
  }
  return `"${safe.replace(/"/g, '""')}"`;
}

const HEADERS = [
  "Reference",
  "Name",
  "Email",
  "Phone",
  "Company",
  "Country",
  "Language",
  "Source",
  "Status",
  "Project Type",
  "Created At",
];

export function leadsToCsv(leadsList: LeadListItem[]): string {
  const rows = [HEADERS.map(sanitizeCsvCell).join(",")];

  for (const lead of leadsList) {
    rows.push(
      [
        lead.publicReference,
        lead.name,
        lead.email,
        lead.phone ?? "",
        lead.company ?? "",
        lead.country ?? "",
        lead.language,
        lead.source,
        lead.status,
        lead.latestProjectType ?? "",
        lead.createdAt.toISOString(),
      ]
        .map(sanitizeCsvCell)
        .join(","),
    );
  }

  return rows.join("\r\n");
}
