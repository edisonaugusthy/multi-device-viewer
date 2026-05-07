import type { ReactNode } from "react";
import { DeviceCatalogProvider } from "./DeviceCatalogProvider";
import { SimulatorProvider } from "./SimulatorProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <DeviceCatalogProvider>
      <SimulatorProvider>{children}</SimulatorProvider>
    </DeviceCatalogProvider>
  );
}
