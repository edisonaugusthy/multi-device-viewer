/**
 * The conditions a page is tested under: network and processor speed, color
 * scheme and other display preferences, simulated vision, time zone and
 * location. Chrome applies them to a whole tab, so every preview shares them.
 */
export type NetworkSpeed = "off" | "fast4g" | "slow4g" | "3g" | "offline";
export type ColorScheme = "system" | "light" | "dark";
export type Vision = "none" | "blurredVision" | "reducedContrast" | "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";

export interface Conditions {
  network: NetworkSpeed;
  cpu: 1 | 4 | 6;
  scheme: ColorScheme;
  reducedMotion: boolean;
  forcedColors: boolean;
  print: boolean;
  vision: Vision;
  /** An IANA time zone, or "" for the computer's own. */
  timezone: string;
  location: { latitude: number; longitude: number } | null;
}

export const DEFAULT_CONDITIONS: Conditions = {
  network: "off", cpu: 1, scheme: "system", reducedMotion: false, forcedColors: false, print: false, vision: "none", timezone: "", location: null,
};

export const NETWORK_SPEEDS: readonly NetworkSpeed[] = ["off", "fast4g", "slow4g", "3g", "offline"];
export const CPU_RATES: readonly Conditions["cpu"][] = [1, 4, 6];
export const COLOR_SCHEMES: readonly ColorScheme[] = ["system", "light", "dark"];
export const VISIONS: readonly Vision[] = ["none", "blurredVision", "reducedContrast", "protanopia", "deuteranopia", "tritanopia", "achromatopsia"];

/** Chrome DevTools' presets: throughput in bytes per second, latency in milliseconds. */
const NETWORK: Record<Exclude<NetworkSpeed, "off" | "offline">, { download: number; upload: number; latency: number }> = {
  fast4g: { download: (9 * 1000 * 1000 / 8) * 0.9, upload: (1.5 * 1000 * 1000 / 8) * 0.9, latency: 60 * 2.75 },
  slow4g: { download: (1.6 * 1000 * 1000 / 8) * 0.9, upload: (750 * 1000 / 8) * 0.9, latency: 150 * 3.75 },
  "3g": { download: (500 * 1000 / 8) * 0.8, upload: (500 * 1000 / 8) * 0.8, latency: 400 * 5 },
};

export interface DebuggerCommand { method: string; params: Record<string, unknown> }

/** The commands that bring a debugged page to these conditions, from any earlier ones. */
export function conditionCommands(conditions: Conditions): DebuggerCommand[] {
  const network = conditions.network;
  const throttle = network === "off" || network === "offline" ? undefined : NETWORK[network];
  return [
    { method: "Network.emulateNetworkConditions", params: {
      offline: network === "offline",
      latency: throttle?.latency ?? 0,
      downloadThroughput: throttle?.download ?? -1,
      uploadThroughput: throttle?.upload ?? -1,
    } },
    { method: "Emulation.setCPUThrottlingRate", params: { rate: conditions.cpu } },
    { method: "Emulation.setEmulatedMedia", params: {
      media: conditions.print ? "print" : "",
      features: [
        { name: "prefers-color-scheme", value: conditions.scheme === "system" ? "" : conditions.scheme },
        { name: "prefers-reduced-motion", value: conditions.reducedMotion ? "reduce" : "" },
        { name: "forced-colors", value: conditions.forcedColors ? "active" : "" },
      ],
    } },
    { method: "Emulation.setEmulatedVisionDeficiency", params: { type: conditions.vision } },
    { method: "Emulation.setTimezoneOverride", params: { timezoneId: conditions.timezone } },
    conditions.location
      ? { method: "Emulation.setGeolocationOverride", params: { ...conditions.location, accuracy: 50 } }
      : { method: "Emulation.clearGeolocationOverride", params: {} },
  ];
}

export const isDefaultConditions = (conditions: Conditions) => JSON.stringify(conditions) === JSON.stringify(DEFAULT_CONDITIONS);

const TIMEZONE = /^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+){0,2}$/;

/** Conditions received in a message or read from storage; anything malformed falls back to the default. */
export function conditionsFrom(value: unknown): Conditions {
  if (!value || typeof value !== "object") return { ...DEFAULT_CONDITIONS };
  const v = value as Record<string, unknown>;
  const location = v.location && typeof v.location === "object" ? v.location as Record<string, unknown> : null;
  const coordinate = (n: unknown, limit: number) => typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= limit;
  return {
    network: NETWORK_SPEEDS.includes(v.network as NetworkSpeed) ? v.network as NetworkSpeed : "off",
    cpu: CPU_RATES.includes(v.cpu as Conditions["cpu"]) ? v.cpu as Conditions["cpu"] : 1,
    scheme: COLOR_SCHEMES.includes(v.scheme as ColorScheme) ? v.scheme as ColorScheme : "system",
    reducedMotion: v.reducedMotion === true,
    forcedColors: v.forcedColors === true,
    print: v.print === true,
    vision: VISIONS.includes(v.vision as Vision) ? v.vision as Vision : "none",
    timezone: typeof v.timezone === "string" && (v.timezone === "" || (v.timezone.length <= 64 && TIMEZONE.test(v.timezone))) ? v.timezone : "",
    location: location && coordinate(location.latitude, 90) && coordinate(location.longitude, 180)
      ? { latitude: location.latitude as number, longitude: location.longitude as number } : null,
  };
}
