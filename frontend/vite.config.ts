import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { authEntryFallback } from "./config/auth-entry-fallback.ts";

// Vite-Konfiguration mit React und Tailwind CSS
export default defineConfig({
  plugins: [authEntryFallback(), react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: process.env.NEXUS_LOCAL_API_TARGET ?? "http://127.0.0.1:3210",
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      "/api": {
        target: process.env.NEXUS_LOCAL_API_TARGET ?? "http://127.0.0.1:3210",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        authV2: "auth-v2.html",
      },
    },
  },
});
