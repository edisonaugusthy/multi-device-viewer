import type { ReactNode } from "react";
import { DeviceCatalogProvider } from "./DeviceCatalogProvider";
import { I18nProvider } from "./i18n";
import { SimulatorProvider } from "./SimulatorProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <DeviceCatalogProvider>
        <SimulatorProvider>{children}</SimulatorProvider>
      </DeviceCatalogProvider>
    </I18nProvider>
  );
}
