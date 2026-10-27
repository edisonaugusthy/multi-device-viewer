import { describe, expect, it } from "vitest";
import { conditionCommands, conditionsFrom, DEFAULT_CONDITIONS, isDefaultConditions } from "./preview-conditions";

const byMethod = (conditions: Parameters<typeof conditionCommands>[0]) => Object.fromEntries(conditionCommands(conditions).map(command => [command.method, command.params]));

describe("test conditions", () => {
  it("resets every emulation when nothing is on", () => {
    expect(byMethod(DEFAULT_CONDITIONS)).toEqual({
      "Network.emulateNetworkConditions": { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 },
      "Emulation.setCPUThrottlingRate": { rate: 1 },
      "Emulation.setEmulatedMedia": { media: "", features: [{ name: "prefers-color-scheme", value: "" }, { name: "prefers-reduced-motion", value: "" }, { name: "forced-colors", value: "" }] },
      "Emulation.setEmulatedVisionDeficiency": { type: "none" },
      "Emulation.setTimezoneOverride": { timezoneId: "" },
      "Emulation.clearGeolocationOverride": {},
    });
    expect(isDefaultConditions(DEFAULT_CONDITIONS)).toBe(true);
  });

  it("throttles like Chrome DevTools' presets and applies display, vision and region", () => {
    const commands = byMethod({ network: "slow4g", cpu: 4, scheme: "dark", reducedMotion: true, forcedColors: true, print: true, vision: "deuteranopia", timezone: "Europe/Berlin", location: { latitude: 52.52, longitude: 13.405 } });
    expect(commands["Network.emulateNetworkConditions"]).toEqual({ offline: false, latency: 562.5, downloadThroughput: 180_000, uploadThroughput: 84_375 });
    expect(commands["Emulation.setCPUThrottlingRate"]).toEqual({ rate: 4 });
    expect(commands["Emulation.setEmulatedMedia"]).toEqual({ media: "print", features: [{ name: "prefers-color-scheme", value: "dark" }, { name: "prefers-reduced-motion", value: "reduce" }, { name: "forced-colors", value: "active" }] });
    expect(commands["Emulation.setEmulatedVisionDeficiency"]).toEqual({ type: "deuteranopia" });
    expect(commands["Emulation.setTimezoneOverride"]).toEqual({ timezoneId: "Europe/Berlin" });
    expect(commands["Emulation.setGeolocationOverride"]).toEqual({ latitude: 52.52, longitude: 13.405, accuracy: 50 });
    expect(byMethod({ ...DEFAULT_CONDITIONS, network: "offline" })["Network.emulateNetworkConditions"]).toMatchObject({ offline: true });
  });

  it("reads conditions from a message, falling back field by field on anything malformed", () => {
    expect(conditionsFrom({ network: "fast4g", cpu: 6, scheme: "light", vision: "achromatopsia", timezone: "Asia/Tokyo" })).toEqual({ ...DEFAULT_CONDITIONS, network: "fast4g", cpu: 6, scheme: "light", vision: "achromatopsia", timezone: "Asia/Tokyo" });
    expect(conditionsFrom({ network: "5g", cpu: 3, scheme: "sepia", vision: "x", timezone: "Bad Zone!", location: { latitude: 200, longitude: 0 }, print: "yes" })).toEqual(DEFAULT_CONDITIONS);
    expect(conditionsFrom(null)).toEqual(DEFAULT_CONDITIONS);
  });
});
