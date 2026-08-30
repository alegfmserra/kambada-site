import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Os testes E2E do Playwright vivem em qa/ e têm runner próprio.
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: { "@": new URL("./src/", import.meta.url).pathname },
  },
});
