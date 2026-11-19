import type { ReactNode } from "react";
import { DeviceCatalogProvider } from "./DeviceCatalogProvider";
import { I18nProvider } from "./i18n";
import { SimulatorProvider } from "./SimulatorProvider";
import { PopOutProvider } from "../ui/components/PopOutDevice";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <DeviceCatalogProvider>
        <SimulatorProvider><PopOutProvider>{children}</PopOutProvider></SimulatorProvider>
      </DeviceCatalogProvider>
    </I18nProvider>
  );
}
