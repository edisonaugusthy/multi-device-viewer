const VERIFICATION_PHRASES = [
  "verify you are human",
  "verify that you are human",
  "confirm you are human",
  "checking your browser",
  "complete the security check",
  "security verification",
  "unusual traffic",
  "attention required",
  "are you a robot",
];

export interface ReplayPageSignals {
  title?: string;
  bodyText?: string;
  challengeElementFound?: boolean;
}

export function hasVerificationChallenge({
  title = "",
  bodyText = "",
  challengeElementFound = false,
}: ReplayPageSignals): boolean {
  if (challengeElementFound) return true;
  const pageCopy = `${title}\n${bodyText}`.toLocaleLowerCase();
  return VERIFICATION_PHRASES.some((phrase) => pageCopy.includes(phrase));
}
