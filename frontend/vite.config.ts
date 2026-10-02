import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// Vite-Konfiguration mit React und Tailwind CSS
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
