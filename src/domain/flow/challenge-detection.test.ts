import { describe, expect, it } from "vitest";
import { hasVerificationChallenge } from "./challenge-detection";

describe("hasVerificationChallenge", () => {
  it("detects a known verification widget", () => {
    expect(hasVerificationChallenge({ challengeElementFound: true })).toBe(true);
  });

  it("detects common challenge-page language", () => {
    expect(hasVerificationChallenge({ title: "Checking your browser…" })).toBe(true);
    expect(hasVerificationChallenge({ bodyText: "Please verify that you are human to continue." })).toBe(true);
  });

  it("does not pause for ordinary account verification copy", () => {
    expect(hasVerificationChallenge({ bodyText: "Verify your email address in account settings." })).toBe(false);
    expect(hasVerificationChallenge({ bodyText: "This site is protected by reCAPTCHA. Privacy · Terms" })).toBe(false);
  });
});
