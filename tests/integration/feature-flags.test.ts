import { describe, it, expect, afterEach } from "vitest";
import { isMaintenanceModeEnabled } from "@/lib/feature-flags";

// `getFeatureFlags()` itself dynamically imports `@/lib/ai/get-provider`,
// which has `import "server-only"` — genuinely unresolvable from
// Vitest regardless of static/dynamic import timing, so it isn't
// exercised directly here (see the same limitation noted throughout
// this codebase for any `server-only`-marked module). The one flag
// with real enforcement, `isMaintenanceModeEnabled()`, has no such
// dependency and is fully covered below.

const originalMaintenance = process.env.MAINTENANCE_MODE;

function restore() {
  if (originalMaintenance === undefined) delete process.env.MAINTENANCE_MODE;
  else process.env.MAINTENANCE_MODE = originalMaintenance;
}

describe("isMaintenanceModeEnabled", () => {
  afterEach(restore);

  it("is off by default", () => {
    delete process.env.MAINTENANCE_MODE;
    expect(isMaintenanceModeEnabled()).toBe(false);
  });

  it("is on only for the exact string 'true'", () => {
    process.env.MAINTENANCE_MODE = "true";
    expect(isMaintenanceModeEnabled()).toBe(true);

    process.env.MAINTENANCE_MODE = "1";
    expect(isMaintenanceModeEnabled()).toBe(false);

    process.env.MAINTENANCE_MODE = "TRUE";
    expect(isMaintenanceModeEnabled()).toBe(false);
  });
});
