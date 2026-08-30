import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 20000,
    // Each test file spins up its own in-memory PGlite instance and
    // runs every migration in beforeAll. As the suite has grown
    // (16 files by Phase 6), running them all fully in parallel causes
    // enough CPU contention to blow past a hook timeout occasionally,
    // independent of test correctness — capping concurrency keeps each
    // PGlite startup fast enough that a generous but bounded timeout
    // is reliable rather than needing to keep raising it every phase.
    hookTimeout: 30000,
    maxWorkers: 4,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
