import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { uiLocalesDevServer } from "./scripts/ui-locale-assets";
import { mockupsPreviewPlugin } from "./scripts/mockup-assets";

export default defineConfig({
  plugins: [react(), tailwindcss(), uiLocalesDevServer(), mockupsPreviewPlugin()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: "index.html",
    },
  },
});
