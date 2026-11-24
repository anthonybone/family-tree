import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  // Database tests share one database, so test files run one at a time.
  test: { include: ["src/**/*.test.ts"], environment: "node", fileParallelism: false },
});
