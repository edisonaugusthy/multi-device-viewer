import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../src/ui/styles/global.css";
import { AppProviders } from "../../src/app/AppProviders";
import { SimulatorApp } from "../../src/ui/components/SimulatorApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <SimulatorApp />
    </AppProviders>
  </StrictMode>,
);
