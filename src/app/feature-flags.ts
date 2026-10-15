// Features that are built but held back from the UI for now. Flip a flag to
// bring its entry points back; the code behind each one stays in place.
export const FEATURES = {
  // "Before & after" pictures in the device menus and the compare button.
  visualChecks: false,
  // Layout check: header button, panel, device menu entry and tour step.
  layoutCheck: false,
} as const;
