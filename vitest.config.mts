import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 20000,
    // Each test file spins up its own in-memory PGlite instance and
    // runs every migration in beforeAll — with more Phase 5 test files
    // running in parallel, that regularly exceeds Vitest's 10s default
    // hook timeout under load, independent of test correctness.
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
