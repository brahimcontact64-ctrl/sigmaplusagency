import { describe, it, expect } from "vitest";
import { sanitizeCsvCell, leadsToCsv } from "@/lib/services/csv-export";
import type { LeadListItem } from "@/lib/repositories/crm-repository";

describe("sanitizeCsvCell", () => {
  it.each(["=cmd|' /C calc'!A1", "+1+1", "-1-1", "@SUM(A1:A2)"])(
    "neutralizes a formula-injection prefix: %s",
    (value) => {
      const cell = sanitizeCsvCell(value);
      expect(cell.startsWith(`"'`)).toBe(true);
    },
  );

  it("leaves an ordinary value unprefixed", () => {
    expect(sanitizeCsvCell("Ordinary Name")).toBe('"Ordinary Name"');
  });

  it("doubles internal quotes per RFC 4180", () => {
    expect(sanitizeCsvCell('Say "hi"')).toBe('"Say ""hi"""');
  });
});

describe("leadsToCsv", () => {
  it("produces a header row plus one row per lead, sanitized", () => {
    const lead = {
      id: "1",
      publicReference: "SP-ABC123",
      name: "=EVIL()",
      email: "person@example.com",
      language: "fr",
      source: "contact_form",
      status: "NEW",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    } as unknown as LeadListItem;

    const csv = leadsToCsv([lead]);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('"\'=EVIL()"');
    expect(lines[1]).toContain("SP-ABC123");
  });
});
