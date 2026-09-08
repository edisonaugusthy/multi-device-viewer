import { describe, expect, it } from "vitest";
import { NavigationSyncState, syncableUrl } from "./navigation-sync";

const home = "https://example.test/";
describe("navigation sync observations", () => {
  it("mirrors return to the original URL and repeated back/forward visits", () => {
    const state = new NavigationSyncState(home);
    expect(state.observe(home, "a")?.changed).toBe(false);
    for (const url of [home + "next", home, home + "next", home]) {
      expect(state.observe(url, "a")).toEqual({ url, changed: true });
      expect(state.observe(url, "a")?.changed).toBe(false);
    }
  });
  it("ignores the outgoing document and acknowledges a redirected follower without echoing", () => {
    const state = new NavigationSyncState(home);
    state.observe(home, "old");
    expect(state.follow(home + "next")).toBe(true);
    expect(state.observe(home + "stale", "old")).toBeUndefined();
    expect(state.observe(home + "canonical", "new")?.changed).toBe(false);
    expect(state.observe(home + "later", "new")?.changed).toBe(true);
  });
  it("tracks independent navigation while disabled and does not reload an already matching follower", () => {
    const state = new NavigationSyncState(home);
    state.observe(home + "independent", "a");
    expect(state.follow(home + "independent")).toBe(false);
    expect(state.follow(home)).toBe(true);
    expect(state.observe(home, "b")?.changed).toBe(false);
  });
  it.each(["javascript:alert(1)", "data:text/html,hi", "about:blank", "file:///tmp/a", "bad", null])("rejects non-web URL %s", value => {
    expect(syncableUrl(value)).toBeUndefined();
  });
});
