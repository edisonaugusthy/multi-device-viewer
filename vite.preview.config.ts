import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { uiLocalesDevServer } from "./scripts/ui-locale-assets";

export default defineConfig({
  plugins: [react(), tailwindcss(), uiLocalesDevServer()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: "entrypoints/preview/index.html",
    },
  },
});
