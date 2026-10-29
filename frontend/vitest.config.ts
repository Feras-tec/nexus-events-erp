import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// DOM-Tests bleiben von der Produktionskonfiguration und echten Clerk-Diensten getrennt.
export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", include: ["tests/**/*.test.tsx"] },
});
