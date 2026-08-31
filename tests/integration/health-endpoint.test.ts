import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns only status/version/timestamp — nothing sensitive", async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.status).toBe("ok");
    expect(typeof body.version).toBe("string");
    expect(typeof body.timestamp).toBe("string");
    expect(new Date(body.timestamp).toString()).not.toBe("Invalid Date");

    const keys = Object.keys(body);
    expect(keys.sort()).toEqual(["status", "timestamp", "version"]);
  });

  it("never leaks env vars, DB details, or a stack trace in the payload", async () => {
    const response = await GET();
    const text = await response.text();
    expect(text).not.toMatch(/DATABASE_URL|postgres:\/\/|ADMIN_SESSION_SECRET|at [A-Za-z.]+\(/);
  });
});
