import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Static proof that the MagicFlux webhook URL/secret can never reach
 * the browser bundle (brief §3: "the browser MUST NOT contain or
 * expose the MagicFlux webhook secret"). The client form component
 * must never import the server-only bridge module or reference the
 * env var names directly — it only ever calls the "use server" action,
 * which is the sole caller of `lib/integrations/magicflux.ts`.
 */
const ROOT = path.resolve(__dirname, "..", "..");

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), "utf-8");
}

describe("MagicFlux secret never reaches client code (Phase — real lead intake)", () => {
  it("the client form component does not import the MagicFlux bridge", () => {
    const source = read("src/components/project-inquiry/project-inquiry-form.tsx");
    expect(source).toContain('"use client"');
    expect(source).not.toMatch(/lib\/integrations\/magicflux/);
    expect(source).not.toContain("MAGICFLUX_WEBHOOK");
  });

  it("the client form component does not reference the raw webhook URL/secret env var names", () => {
    const source = read("src/components/project-inquiry/project-inquiry-form.tsx");
    expect(source).not.toContain("MAGICFLUX_WEBHOOK_URL");
    expect(source).not.toContain("MAGICFLUX_WEBHOOK_SECRET");
  });

  it("the page component (server, but its output reaches the browser as HTML/props) never reads the MagicFlux env vars directly", () => {
    const source = read("src/app/[locale]/project-inquiry/page.tsx");
    expect(source).not.toContain("MAGICFLUX_WEBHOOK");
  });

  it("the MagicFlux bridge module is a server-only integration, imported only by the lead-service layer", () => {
    const bridgeSource = read("src/lib/integrations/magicflux.ts");
    // Reads env vars only inside this module — never re-exports the raw secret.
    expect(bridgeSource).toContain("process.env.MAGICFLUX_WEBHOOK_SECRET");
    expect(bridgeSource).not.toMatch(/"use client"/);

    const leadServiceSource = read("src/lib/services/lead-service.ts");
    expect(leadServiceSource).toContain('from "@/lib/integrations/magicflux"');
  });

  it("the Server Action module is marked \"use server\" — the only client-reachable entry point for this flow", () => {
    const actionSource = read("src/lib/actions/project-inquiry.ts");
    expect(actionSource.trimStart().startsWith('"use server"')).toBe(true);
  });
});
