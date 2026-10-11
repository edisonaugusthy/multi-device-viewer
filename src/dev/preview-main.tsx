// Standalone development preview of the simulator UI (npm run dev:preview).
// Not part of the extension package; extension-only features are unavailable.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../ui/styles/global.css";
import { AppProviders } from "../app/AppProviders";
import { SimulatorApp } from "../ui/components/SimulatorApp";
import { registerViewerFonts } from "../ui/fonts";

registerViewerFonts((path) => `/${path}`);

(window as Window & { __MDV_STANDALONE_PREVIEW__?: boolean }).__MDV_STANDALONE_PREVIEW__ = true;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <SimulatorApp />
    </AppProviders>
  </StrictMode>,
);
