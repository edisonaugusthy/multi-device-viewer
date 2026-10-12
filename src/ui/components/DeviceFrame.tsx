import { getMockupViewport } from "../../domain/device/device-service";
import { roundedScreenPath } from "../../domain/device/screen-path";
import { usesTabletKeyboard, keyboardDecimalSeparator } from "../../domain/device/mobile-keyboard";
import { extensionAsset } from "../../app/viewer-context";
import { useEffect, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { browserGlyphs as G, ChevronDownIcon } from "../icons";
import type { Device, MockupViewportConfig, Orientation, Size } from "../../domain/device/device.types";
import { getFrameProfile, type ChromeVariant } from "../../domain/device/frame-profiles";
import { useI18n } from "../../app/i18n";
import { getBrowserGeometry, type BrowserPreferences } from "../../domain/device/browser-geometry";
import { SafariChrome } from "./SafariChrome";
import type { SideSurfaceBand } from "../../domain/device/page-surfaces";

interface FrameSizeInput {
  device: Device;
  showFrame: boolean;
  showStatusBar: boolean;
  showUrlBar: boolean;
  viewportSize: Size;
}

interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface MobileKeyboardState {
  inputType?: string;
  inputMode?: string;
  multiline?: boolean;
  autoCapitalize?: string;
  enterKeyHint?: string;
  language?: string;
  fieldKey?: string;
  canPrevious?: boolean;
  canNext?: boolean;
}

export type MobileKeyboardLayoutMode = "text" | "email" | "url" | "search" | "number" | "decimal" | "phone";

export function resolveMobileKeyboardLayout(state: MobileKeyboardState): MobileKeyboardLayoutMode {
  const inputType = (state.inputType ?? "text").toLowerCase();
  const inputMode = (state.inputMode ?? "").toLowerCase();
  const modeLayouts: Record<string, MobileKeyboardLayoutMode> = {
    text: "text", tel: "phone", decimal: "decimal", numeric: "number", email: "email", url: "url", search: "search",
  };
  if (modeLayouts[inputMode]) return modeLayouts[inputMode];
  if (inputType === "tel") return "phone";
  if (inputType === "number") return "number";
  if (inputType === "email") return "email";
  if (inputType === "url") return "url";
  if (inputType === "search" || state.enterKeyHint === "search") return "search";
  return "text";
}

export function getMobileKeyboardHeight(
  platform: "ios" | "android",
  landscape: boolean,
  tablet: boolean,
  viewportHeight = Number.POSITIVE_INFINITY,
) {
  const preferred = landscape ? tablet ? 248 : platform === "ios" ? 214 : 224
    : tablet ? platform === "ios" ? 354 : 338 : platform === "ios" ? 310 : 296;
  // Keep room for the focused field and browser safe area on short screens.
  return Math.min(preferred, Math.max(0, viewportHeight - 140));
}

export interface BrowserSurfaceColors {
  top: string;
  bottom: string;
  topIsDark: boolean;
  bottomIsDark: boolean;
  rightBands?: SideSurfaceBand[];
  topGuardColor?: string;
  bottomGuardColor?: string;
  viewportFit?: "auto" | "cover";
}

export type MobileKeyboardAction =
  | { action: "text"; text: string }
  | { action: "enter"; enterKeyHint?: string }
  | { action: "backspace" | "dismiss" | "previous" | "next" };

// ─── Main component ─────────────────────────────────────────────────────────
export function DeviceFrame({
  device,
  children,
  showFrame,
  showStatusBar,
  showBattery,
  showUrlBar,
  darkMode,
  url,
  viewportSize,
  orientation,
  scrollProgress = 0,
  keyboard,
  onKeyboardAction,
  pageSurfaces,
  browserPreferences,
}: {
  device: Device;
  children: ReactNode;
  showFrame: boolean;
  showStatusBar: boolean;
  showBattery: boolean;
  showUrlBar: boolean;
  darkMode: boolean;
  url: string;
  viewportSize: Size;
  orientation: Orientation;
  scrollProgress?: number;
  keyboard?: MobileKeyboardState;
  onKeyboardAction?: (action: MobileKeyboardAction) => void;
  pageSurfaces?: BrowserSurfaceColors;
  browserPreferences?: BrowserPreferences;
}) {
  const profile = getFrameProfile(device);
  const hostname = safeHostname(url);
  // Derive the rendered posture from the viewport itself. Most handset/tablet
  // PNGs are portrait-first, but unfolded foldables can be natively landscape.
  // Using the orientation label alone made those assets escape their fitted box.
  const landscape = viewportSize.width > viewportSize.height && (device.type === "phone" || device.type === "tablet");
  const compact = landscape || profile.kind === "iphone-classic" || profile.kind === "tablet";
  const chromeCollapse = clamp(scrollProgress, 0, 1);
  const keyboardPlatform = profile.platform === "ios" ? "ios" : "android";
  const mobileKeyboardHeight = keyboard && (device.type === "phone" || device.type === "tablet")
    ? getMobileKeyboardHeight(keyboardPlatform, landscape, usesTabletKeyboard(device.type, viewportSize), viewportSize.height)
    : 0;
  const androidKeyboardOpen = mobileKeyboardHeight > 0 && keyboardPlatform === "android";
  const browserGeometry = getBrowserGeometry(device, viewportSize, browserPreferences, {
    orientation, collapsed: chromeCollapse, keyboardHeight: mobileKeyboardHeight, showStatusBar, showUrlBar, viewportFit: pageSurfaces?.viewportFit,
  });
  // Match the page at reserved screen edges. Duo glass belongs to the small
  // floating control groups; a neutral backing would leave a visible rail.
  const duoGlass = Boolean(browserGeometry.duoControls);
  const topSurfaceDark = pageSurfaces?.topIsDark ?? (duoGlass ? darkMode : false);
  const bottomSurfaceDark = pageSurfaces?.bottomIsDark ?? (duoGlass ? darkMode : false);
  const topSurfaceColor = pageSurfaces?.top ?? (duoGlass && topSurfaceDark ? "#1c1c1e" : "#ffffff");
  const bottomSurfaceColor = pageSurfaces?.bottom ?? (duoGlass && bottomSurfaceDark ? "#1c1c1e" : "#ffffff");
  const safariChrome = (showUrlBar || (browserGeometry.duoControls && showStatusBar)) && profile.platform === "ios" ? <SafariChrome
    geometry={browserGeometry} hostname={hostname} dark={bottomSurfaceDark} keyboard={Boolean(keyboard)}
    topColor={topSurfaceColor} bottomColor={bottomSurfaceColor} topDark={topSurfaceDark} showBattery={showBattery}
    rightBands={pageSurfaces?.rightBands}
  /> : null;

  const imageFrame = device.mockupAssets.find((asset) => asset.localPath && asset.width && asset.height);
  const keyboardOverlay = keyboard && (device.type === "phone" || device.type === "tablet") ? (
    <MobileKeyboard
      platform={profile.platform === "ios" ? "ios" : "android"}
      landscape={landscape}
      tablet={usesTabletKeyboard(device.type, viewportSize)}
      dark={darkMode}
      state={keyboard}
      height={mobileKeyboardHeight}
      insets={showFrame ? { left: browserGeometry.left, right: browserGeometry.right, bottom: browserGeometry.cameraBottomInset ?? 0 } : undefined}
      homeIndicator={profile.safeAreaInsetBottom > 0}
      onAction={onKeyboardAction}
    />
  ) : null;

  // ── No frame ──────────────────────────────────────────────────────────────
  if (!showFrame) {
    return (
      <div
        data-device-logical-screen={device.id}
        className={`relative overflow-hidden rounded-[10px] border shadow-sm ${darkMode ? "border-white/10 bg-[#0f172a]" : "border-slate-200 bg-white"}`}
        style={{ width: viewportSize.width, height: viewportSize.height }}
      >
        <div
          style={{
            width: viewportSize.width,
            height: mobileKeyboardHeight > 0
              ? Math.max(120, viewportSize.height - mobileKeyboardHeight)
              : viewportSize.height,
          }}
        >
          {children}
        </div>
        {keyboardOverlay}
      </div>
    );
  }

  // User-created viewports use one neutral browser shell. They have no physical
  // mockup metadata, so rendering them as an iPhone/Android model is misleading.
  // Keep the entered viewport exact and anchor a compact browser bar to its bottom.
  const customShell = () => {
    const customStatusH = showStatusBar ? (compact ? 20 : 24) : 0;
    const customBottomH = showUrlBar ? (compact ? 66 : 76) : 0;
    const customContentH = Math.max(
      1,
      viewportSize.height - customStatusH - (androidKeyboardOpen ? mobileKeyboardHeight : customBottomH),
    );
    return (
      <div
        className="relative shrink-0 rounded-[20px] bg-gradient-to-br from-[#303640] to-[#171b21] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.3)] ring-1 ring-black/25"
        style={{ width: viewportSize.width + 16, height: viewportSize.height + 16 }}
      >
        <div
          data-device-logical-screen={device.id}
          className={`relative h-full w-full overflow-hidden rounded-[13px] ${darkMode ? "bg-[#0f172a]" : "bg-white"}`}
        >
          {showStatusBar && <StatusBar platform="ios" showBattery={showBattery} compact={compact} dark={darkMode} height={customStatusH} />}
          <div style={{ width: viewportSize.width, height: customContentH, marginTop: customStatusH }}>
            {children}
          </div>
          {showUrlBar && <CustomBrowserBar hostname={hostname} compact={compact} dark={darkMode} />}
          {keyboardOverlay}
        </div>
      </div>
    );
  };
  if (device.brand === "Custom") return customShell();

  if (imageFrame?.localPath && imageFrame.width && imageFrame.height) {
    const renderScale = imageFrame.renderScale ?? 0.5;
    const baseFrameW = imageFrame.width * renderScale;
    const baseFrameH = imageFrame.height * renderScale;
    const assetLandscape = baseFrameW > baseFrameH;
    const rotateImage = (device.type === "phone" || device.type === "tablet") && assetLandscape !== landscape;
    const frameW = rotateImage ? baseFrameH : baseFrameW;
    const frameH = rotateImage ? baseFrameW : baseFrameH;
    const viewportConfig = getMockupViewport(imageFrame, orientation);
    const screenRect = screenRectFor(viewportSize, frameW, frameH, viewportConfig);
    const screenFit = fitViewportToScreen(viewportSize, screenRect);
    const viewportClipPath = screenClipPath(viewportConfig, orientation);
    const screenSurfaceColor = (profile.platform === "ios" && (device.type === "phone" || device.type === "tablet"))
      ? topSurfaceColor : darkMode ? "#0f172a" : "#ffffff";
    const mobileChrome = profile.imageChrome;
    // The top safe area = status bar + notch / Dynamic Island clearance. In landscape the
    // notch moves to the side, so no vertical top inset is reserved.
    const imageStatusH = browserGeometry.status;
    const desktopToolbarH = showUrlBar && (device.type === "laptop" || device.type === "desktop") ? 36 : 0;
    const useSafariDesktopChrome = showUrlBar && profile.style.desktopChrome === "safari";
    // iPhone chrome borrows the page's sampled colors. The top safe area remains reserved;
    // all Safari controls reserve space so the page's fixed actions stay visible.
    const iosPhoneSurface = profile.platform === "ios" && (device.type === "phone" || device.type === "tablet");
    const imageContentBottomH = browserGeometry.bottom;
    const imageContentTop =
      device.type === "laptop" || device.type === "desktop" || device.type === "tv"
        ? 0
        : browserGeometry.top;
    const imageContentH =
      device.type === "laptop" || device.type === "desktop" || device.type === "tv"
        ? Math.max(120, viewportSize.height - (useSafariDesktopChrome ? 56 : desktopToolbarH))
        : browserGeometry.content.height;

    return (
      <div
        data-device-frame={device.id}
        className="relative shrink-0"
        style={{ width: frameW, height: frameH }}
      >
        <div
          className="pointer-events-none absolute overflow-hidden"
          style={{
            width: baseFrameW,
            height: baseFrameH,
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) rotate(${rotateImage ? 90 : 0}deg)`,
            // The frame paints its bezel and cameras above the live screen.
            zIndex: 2,
          }}
        >
          <img
            src={extensionAsset(imageFrame.localPath)}
            alt=""
            draggable={false}
            className="pointer-events-none absolute select-none"
            style={{
              width: baseFrameW,
              height: baseFrameH,
              maxWidth: "none",
              left: 0,
              top: 0,
            }}
          />
        </div>
        <div
          data-device-screen={device.id}
          className="absolute overflow-hidden"
          style={{
            left: screenFit.left,
            top: screenFit.top,
            width: screenFit.width,
            height: screenFit.height,
            zIndex: 1,
            // Clip the composed screen as well as its layout overflow. Safari's
            // backdrop-filter layer can otherwise paint past the rounded bezel
            // at fractional preview scales.
            clipPath: viewportClipPath,
            // The status surface and iframe can land on different fractional
            // pixels after scaling. Back their join with the top page color;
            // the separate bottom surface still paints Safari's lower area.
            backgroundColor: screenSurfaceColor,
          }}
        >
          {iosPhoneSurface && <div
            aria-hidden
            data-ios-top-surface={device.id}
            className="pointer-events-none absolute inset-x-0 top-0"
            style={{ height: screenFit.contentTop + Math.min(imageStatusH, browserGeometry.top) * screenFit.scaleY, backgroundColor: topSurfaceColor }}
          />}
          <div
            data-device-logical-screen={device.id}
            style={{
              position: "absolute",
              left: screenFit.contentLeft,
              top: screenFit.contentTop,
              width: viewportSize.width,
              height: viewportSize.height,
              transform: `scale(${screenFit.scaleX}, ${screenFit.scaleY})`,
              transformOrigin: "top left",
            }}
          >
            {device.type === "laptop" || device.type === "desktop" ? (
              <>
                {useSafariDesktopChrome
                  ? <SafariDesktopBar hostname={hostname} dark={darkMode} />
                  : showUrlBar && <DesktopBar hostname={hostname} dark={darkMode} />}
                <div style={{ width: viewportSize.width, height: imageContentH }}>{children}</div>
              </>
            ) : device.type === "tv" ? (
              <div style={{ width: viewportSize.width, height: imageContentH }}>{children}</div>
            ) : (
              <>
                {iosPhoneSurface && (
                  <>
                    {imageContentBottomH > 0 && (
                      <div
                        aria-hidden
                        data-ios-bottom-surface={device.id}
                        className="pointer-events-none absolute inset-x-0 bottom-0 z-0"
                        style={{ height: imageContentBottomH, backgroundColor: bottomSurfaceColor }}
                      />
                    )}
                  </>
                )}
                {!browserGeometry.duoControls && mobileChrome.showStatusBar && showStatusBar && imageStatusH > 0 && (
                  <StatusBar
                    platform={profile.platform}
                    showBattery={showBattery}
                    compact={compact}
                    dark={iosPhoneSurface ? topSurfaceDark : darkMode}
                    imageBackedKind={device.type === "tablet" ? "tablet" : "phone"}
                    height={imageStatusH || undefined}
                    chromeVariant={browserGeometry.variant}
                    timeInsetLeft={landscape && profile.platform === "android" ? Math.max(32, profile.statusBarInsetLeft) : profile.statusBarInsetLeft}
                    indicatorInsetRight={landscape ? profile.platform === "android" ? 32 : 0 : profile.statusBarInsetRight}
                    cameraWidth={browserGeometry.statusCameraWidth}
                  />
                )}
                {mobileChrome.showAndroidTopBar && showUrlBar && <AndroidAddrBar hostname={hostname} dark={topSurfaceDark} top topOffset={imageStatusH} scrollProgress={chromeCollapse} />}
                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    width: browserGeometry.content.width,
                    height: imageContentH,
                    marginTop: imageContentTop,
                    marginLeft: browserGeometry.left,
                  }}
                >
                  {children}
                </div>
                {mobileChrome.showSafariBar && safariChrome}
                {!keyboard && mobileChrome.showAndroidBottomBar && showUrlBar && <AndroidAddrBar hostname={hostname} dark={darkMode} bottomOffset={browserGeometry.cameraBottomInset} scrollProgress={chromeCollapse} />}
                {keyboardOverlay}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Every built-in device has a drawn frame; anything else gets the neutral shell.
  return customShell();
}

function MobileKeyboard({
  platform,
  landscape,
  tablet,
  dark,
  state,
  height,
  homeIndicator,
  insets,
  onAction,
}: {
  platform: "ios" | "android";
  landscape: boolean;
  tablet: boolean;
  dark: boolean;
  state: MobileKeyboardState;
  height: number;
  homeIndicator: boolean;
  insets?: { left: number; right: number; bottom: number };
  onAction?: (action: MobileKeyboardAction) => void;
}) {
  const { t } = useI18n();
  const ios = platform === "ios";
  const layout = resolveMobileKeyboardLayout(state);
  const alphabeticLayout = ["text", "email", "url", "search"].includes(layout);
  const startsShifted = alphabeticLayout && !["email", "url"].includes(layout) && state.inputType !== "password" && !["off", "none"].includes((state.autoCapitalize ?? "sentences").toLowerCase());
  const [shifted, setShifted] = useState(startsShifted);
  const [symbolMode, setSymbolMode] = useState(false);
  const keypad = !alphabeticLayout;
  const numeric = keypad || symbolMode;
  const keyboardHeight = height;
  const language = keyboardLanguageLabel(state.language);
  const surface = ios
    ? dark ? "bg-[#484a50]/[0.98] text-white" : "bg-[#d3d5da]/[0.98] text-[#111318]"
    : dark ? "bg-[#1f2125]/[0.99] text-white" : "bg-[#f4f5f7]/[0.99] text-[#202124]";
  const keySurface = ios
    ? dark ? "bg-[#777a81] shadow-[0_2px_0_#26272b]" : "bg-white shadow-[0_2px_0_#8f949c]"
    : dark ? "bg-[#3a3d42] shadow-[0_1px_0_rgba(0,0,0,0.45)]" : "bg-[#e3e6e9] shadow-[0_1px_0_#c6cbd0]";
  const utilitySurface = ios
    ? dark ? "bg-[#60636a] shadow-[0_2px_0_#26272b]" : "bg-[#adb2ba] shadow-[0_2px_0_#858a92]"
    : dark ? "bg-[#303236]" : "bg-[#d8dce0]";
  const activeKey = ios ? "active:translate-y-[1px]" : "active:bg-blue-500/20";
  const alphaRows = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
  ];
  const decimalSeparator = keyboardDecimalSeparator(state.language);
  const numericRows = [
    ["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"],
    [layout === "decimal" ? decimalSeparator : layout === "phone" ? "*" : "", "0", layout === "phone" ? "#" : ""],
  ];
  const symbolRows = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["-", "/", ":", ";", "(", ")", "$", "&", "@", '"'],
    [".", ",", "?", "!", "'", "#", "%"],
  ];
  const rows = keypad ? numericRows : symbolMode ? symbolRows
    : tablet ? [symbolRows[0], ...alphaRows] : alphaRows;
  const phoneHints: Record<string, string> = {
    "2": "ABC", "3": "DEF", "4": "GHI", "5": "JKL", "6": "MNO",
    "7": "PQRS", "8": "TUV", "9": "WXYZ",
  };

  const sendText = (value: string) => {
    onAction?.({ action: "text", text: layout === "decimal" && state.inputType === "number" && value === decimalSeparator ? "." : shifted ? value.toUpperCase() : value });
    if (shifted && state.autoCapitalize !== "characters") setShifted(false);
  };
  const stopFocusChange = (event: ReactPointerEvent<HTMLButtonElement>) => event.preventDefault();
  const key = (label: string, value = label, wide = false, hint?: string) => label === "" ? <span key={`blank-${hint}`} className="flex-1"/> : (
    <button
      key={`${label}-${value}`}
      type="button"
      tabIndex={-1}
      aria-label={t("key", { key: label === " " ? t("space") : label })}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center font-medium ${ios ? "rounded-[6px]" : "rounded-[8px]"} ${keySurface} ${activeKey} ${wide ? "basis-[40%]" : ""}`}
      style={{ fontSize: landscape ? 14 : tablet ? 22 : numeric ? 20 : 18 }}
      onPointerDown={stopFocusChange}
      onClick={() => sendText(value)}
    >
      <span>{label === " " ? (ios ? "space" : language) : shifted ? label.toUpperCase() : label}</span>
      {hint && <span className="text-[7px] font-semibold tracking-[0.12em] opacity-65">{hint}</span>}
    </button>
  );
  const utilityKey = (label: string, onClick: () => void, extraClass = "") => (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label === "⇧" ? t("shift") : label === "⌫" ? t("backspace") : label}
      className={`flex min-w-0 items-center justify-center rounded-[7px] px-2 font-medium ${utilitySurface} ${activeKey} ${extraClass}`}
      onPointerDown={stopFocusChange}
      onClick={onClick}
    >
      {label}
    </button>
  );
  const enterHint = state.enterKeyHint || (state.multiline ? "return" : layout === "search" ? "search" : "go");
  const enterLabel = ios
    ? enterHint.toLowerCase()
    : enterHint.charAt(0).toUpperCase() + enterHint.slice(1).toLowerCase();
  const sendEnter = () => onAction?.({ action: "enter", enterKeyHint: enterHint });
  const shortcuts = state.inputType === "password" ? [] : layout === "url" ? ["www.", ".com", ".org"] : layout === "email" ? ["@", ".com", ".net"] : ["—", "’", "…"];

  useEffect(() => {
    setShifted(startsShifted);
    setSymbolMode(false);
  }, [layout, startsShifted, state.fieldKey]);

  return (
    <div
      data-mobile-keyboard={platform}
      data-keyboard-layout={symbolMode ? "symbols" : layout}
      data-keyboard-form={tablet ? "tablet" : "phone"}
      dir="ltr"
      role="group"
      aria-label={t("onScreenKeyboard", { platform: ios ? "iOS" : "Android" })}
      className={`absolute inset-x-0 bottom-0 z-[70] flex flex-col border-t border-black/10 shadow-[0_-12px_32px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-[height] duration-200 ${surface}`}
      style={{ height: keyboardHeight, left: insets?.left ?? 0, right: insets?.right ?? 0, bottom: insets?.bottom ?? 0 }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {ios ? (
        <>
          <div className={`flex h-9 shrink-0 items-center justify-between border-b px-3 text-[12px] ${dark ? "border-white/10 bg-black/10" : "border-black/10 bg-white/25"}`}>
            <span className="flex gap-2">
              <button type="button" tabIndex={-1} aria-label={t("previousField")} disabled={!state.canPrevious} className="grid h-8 w-8 place-items-center disabled:opacity-25" onPointerDown={stopFocusChange} onClick={() => onAction?.({ action: "previous" })}><G.ChevronLeft size={18}/></button>
              <button type="button" tabIndex={-1} aria-label={t("next")} disabled={!state.canNext} className="grid h-8 w-8 place-items-center disabled:opacity-25" onPointerDown={stopFocusChange} onClick={() => onAction?.({ action: "next" })}><G.ChevronRight size={18}/></button>
            </span>
            <button type="button" tabIndex={-1} className={`font-semibold ${dark ? "text-blue-300" : "text-blue-600"}`} onPointerDown={stopFocusChange} onClick={() => onAction?.({ action: "dismiss" })}>
              {t("done")}
            </button>
          </div>
          {!numeric && shortcuts.length > 0 && (
            <div className="flex h-8 shrink-0 divide-x divide-black/10 px-2 text-[12px]">
              {shortcuts.map((shortcut) => (
                <button key={shortcut} type="button" tabIndex={-1} className="flex-1 font-medium" onPointerDown={stopFocusChange} onClick={() => sendText(shortcut)}>
                  {shortcut}
                </button>
              ))}
            </div>
          )}
          <div className={`flex min-h-0 flex-1 flex-col gap-2 px-1.5 pb-1.5 ${tablet && keypad ? "mx-auto w-full max-w-[480px]" : ""}`}>
            {rows.map((row, index) => (
              <div key={index} className={`flex min-h-0 flex-1 justify-center gap-1.5 ${!numeric && index === 1 ? "px-[4%]" : ""}`}>
                {!numeric && index === rows.length - 1 && utilityKey("⇧", () => setShifted((value) => !value), `basis-[12%] ${shifted ? "ring-2 ring-blue-500" : ""}`)}
                {row.map((letter, keyIndex) => key(letter, letter, keypad, letter === "" ? String(keyIndex) : layout === "phone" ? phoneHints[letter] : undefined))}
                {!keypad && index === rows.length - 1 && utilityKey("⌫", () => onAction?.({ action: "backspace" }), "basis-[12%] text-lg")}
              </div>
            ))}
            <div className="flex h-[16%] min-h-0 shrink-0 gap-1.5">
              {numeric && !alphabeticLayout
                ? layout === "phone" ? key("+") : <span className="flex-1"/>
                : utilityKey(numeric ? "ABC" : "123", () => setSymbolMode((value) => !value), "basis-[14%]")}
              {!numeric && key(layout === "email" ? "@" : layout === "url" ? "/" : ",")}
              {!keypad && key(" ", " ", true)}
              {!numeric && key(layout === "url" ? ".com" : ".")}
              {keypad && utilityKey("⌫", () => onAction?.({ action: "backspace" }), "basis-[18%] text-lg")}
              <button type="button" tabIndex={-1} aria-label={t("key", { key: enterLabel })} className="flex basis-[20%] items-center justify-center rounded-[7px] bg-blue-500 px-2 text-[13px] font-semibold text-white active:bg-blue-600" onPointerDown={stopFocusChange} onClick={sendEnter}>
                {enterLabel}
              </button>
            </div>
          </div>
          {homeIndicator && <div className="mx-auto mb-2 h-1 w-[34%] shrink-0 rounded-full bg-current opacity-65" />}
        </>
      ) : (
        <>
          <div className={`flex h-10 shrink-0 items-center gap-1 border-b px-2 ${dark ? "border-white/5" : "border-black/5"}`}>
            <span className="flex h-7 w-8 items-center justify-center text-base opacity-60" aria-hidden>⋮</span>
            {!numeric ? shortcuts.map((shortcut) => (
              <button key={shortcut} type="button" tabIndex={-1} className="h-8 flex-1 rounded-full px-2 text-[12px] font-medium hover:bg-black/5" onPointerDown={stopFocusChange} onClick={() => sendText(shortcut)}>
                {shortcut}
              </button>
            )) : <span className="flex-1 text-center text-[11px] font-medium opacity-55">{layout === "phone" ? "Phone keypad" : "Number pad"}</span>}
            <span className="flex h-7 w-8 items-center justify-center text-sm opacity-60" aria-hidden>●</span>
          </div>
          <div className={`flex min-h-0 flex-1 flex-col gap-1.5 px-1.5 py-1.5 ${tablet && keypad ? "mx-auto w-full max-w-[480px]" : ""}`}>
            {rows.map((row, index) => (
              <div key={index} className={`flex min-h-0 flex-1 justify-center gap-1.5 ${!numeric && index === 1 ? "px-[4%]" : ""}`}>
                {!numeric && index === rows.length - 1 && utilityKey("⇧", () => setShifted((value) => !value), `basis-[12%] rounded-full ${shifted ? "bg-blue-500 text-white" : ""}`)}
                {row.map((letter, keyIndex) => key(letter, letter, keypad, letter === "" ? String(keyIndex) : layout === "phone" ? phoneHints[letter] : undefined))}
                {!keypad && index === rows.length - 1 && utilityKey("⌫", () => onAction?.({ action: "backspace" }), "basis-[12%] rounded-full text-lg")}
              </div>
            ))}
            <div className="flex h-[17%] min-h-0 shrink-0 gap-1.5">
              {numeric && !alphabeticLayout
                ? layout === "phone" ? key("+") : <span className="flex-1"/>
                : utilityKey(numeric ? "ABC" : "?123", () => setSymbolMode((value) => !value), "basis-[15%] rounded-full text-[12px]")}
              {!numeric && key(layout === "email" ? "@" : layout === "url" ? "/" : ",")}
              {!keypad && key(" ", " ", true)}
              {!numeric && key(layout === "url" ? ".com" : ".")}
              {keypad && utilityKey("⌫", () => onAction?.({ action: "backspace" }), "basis-[18%] rounded-full text-lg")}
              <button type="button" tabIndex={-1} aria-label={t("key", { key: enterLabel })} className="flex basis-[17%] items-center justify-center rounded-full bg-[#c3e7ff] px-2 text-[12px] font-semibold text-[#001d35] active:bg-[#9dd7fa]" onPointerDown={stopFocusChange} onClick={sendEnter}>
                {enterLabel}
              </button>
            </div>
          </div>
          <div className={`flex h-8 shrink-0 items-center justify-end px-4 ${dark ? "bg-[#17191c]" : "bg-[#e9ebed]"}`}>
            <button type="button" tabIndex={-1} aria-label={t("dismissKeyboard")} className="flex h-7 w-10 items-center justify-center rounded-full" onPointerDown={stopFocusChange} onClick={() => onAction?.({ action: "dismiss" })}>
              <ChevronDownIcon size={18} strokeWidth={2} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function keyboardLanguageLabel(language?: string) {
  const locale = language || (typeof navigator !== "undefined" ? navigator.language : "en-US");
  try {
    const [base, region] = locale.replace("_", "-").split("-");
    const name = new Intl.DisplayNames([locale], { type: "language" }).of(base) ?? base;
    return region ? `${name} (${region.toUpperCase()})` : name;
  } catch {
    return locale;
  }
}

// ─── estimateDeviceFrameSize ─────────────────────────────────────────────────
export function estimateDeviceFrameSize({ device, showFrame, viewportSize }: FrameSizeInput): Size {
  if (!showFrame) return viewportSize;

  // Custom sizes and any device without a drawn frame use the neutral shell.
  const imageFrame = device.brand === "Custom" ? undefined : device.mockupAssets.find((asset) => asset.width && asset.height);
  if (imageFrame?.width && imageFrame.height) {
    const assetWidth = imageFrame.width;
    const assetHeight = imageFrame.height;
    const renderScale = imageFrame.renderScale ?? 0.5;
    const viewportLandscape = (device.type === "phone" || device.type === "tablet") && viewportSize.width > viewportSize.height;
    const assetLandscape = assetWidth > assetHeight;
    const rotateImage = (device.type === "phone" || device.type === "tablet") && assetLandscape !== viewportLandscape;
    return {
      width: (rotateImage ? assetHeight : assetWidth) * renderScale,
      height: (rotateImage ? assetWidth : assetHeight) * renderScale,
    };
  }

  return { width: viewportSize.width + 16, height: viewportSize.height + 16 };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

// The drawn screen for this posture, or the viewport centred in the frame.
function screenRectFor(viewportSize: Size, frameW: number, frameH: number, viewport?: MockupViewportConfig): ScreenRect {
  if (!viewport) {
    return { left: Math.max(0, (frameW - viewportSize.width) / 2), top: Math.max(0, (frameH - viewportSize.height) / 2), width: viewportSize.width, height: viewportSize.height };
  }
  return {
    left: clamp(viewport.left, 0, frameW - 1),
    top: clamp(viewport.top, 0, frameH - 1),
    width: clamp(viewport.width, 1, frameW - viewport.left),
    height: clamp(viewport.height, 1, frameH - viewport.top),
  };
}

// The page is clipped to the screen opening drawn in the frame. Cameras need
// no hole: the frame image paints them above the page.
function screenClipPath(viewport: MockupViewportConfig | undefined, orientation: Orientation) {
  if (!viewport) return undefined;
  const path = viewport.paths?.[orientation] ?? roundedScreenPath(viewport.width, viewport.height, viewport.cornerRadius ?? 0);
  return `path(evenodd, "${path}")`;
}

export function fitViewportToScreen(viewportSize: Size, screenRect: ScreenRect) {
  const uniformScale = Math.min(screenRect.width / viewportSize.width, screenRect.height / viewportSize.height);
  const scaleX = uniformScale;
  const scaleY = uniformScale;

  return {
    scaleX,
    scaleY,
    radiusScale: uniformScale,
    contentLeft: (screenRect.width - viewportSize.width * uniformScale) / 2,
    contentTop: (screenRect.height - viewportSize.height * uniformScale) / 2,
    width: screenRect.width,
    height: screenRect.height,
    left: screenRect.left,
    top: screenRect.top,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}


function StatusBar({
  platform,
  showBattery,
  compact,
  dark,
  imageBackedKind,
  height,
  chromeVariant = "none",
  timeInsetLeft = 0,
  indicatorInsetRight = 0,
  surfaceOverlay = false,
  cameraWidth,
}: {
  platform: string;
  showBattery: boolean;
  compact: boolean;
  dark: boolean;
  imageBackedKind?: "phone" | "tablet";
  height?: number;
  chromeVariant?: ChromeVariant;
  timeInsetLeft?: number;
  indicatorInsetRight?: number;
  surfaceOverlay?: boolean;
  cameraWidth?: number;
}) {
  const { t } = useI18n();
  const time = "9:41";
  const h = height ?? (platform === "android" ? 28 : compact ? 28 : 44);
  const px = compact ? 14 : 18;
  const ios = platform === "ios";
  const android = platform === "android";
  const iosSurfacePhone = ios && (imageBackedKind === "phone" || surfaceOverlay);
  const iosImageBackedTablet = ios && imageBackedKind === "tablet";
  const androidImageBacked = android && (imageBackedKind === "phone" || imageBackedKind === "tablet");

  // ── Android status strip — a CONSTANT top bar (never scrolls). Holds the clock on the
  //    left and the indicators on the right, aligned to the hole-punch camera row, over a
  //    solid Chrome-coloured background that stays fixed while the page scrolls beneath. ──
  if (androidImageBacked) {
    // The clock/indicators sit in the lower ~26px band so they line up with the camera dot.
    // Short landscape status rows stay inside the strip and clear rounded corners.
    const rowH = Math.min(26, h);
    return (
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex items-end ${
          dark ? "bg-[#111827] text-slate-100" : "bg-white text-slate-900"
        }`}
        style={{ height: h }}
      >
        <div className="flex w-full items-center justify-between" style={{ height: rowH, paddingLeft: px + timeInsetLeft, paddingRight: px + indicatorInsetRight }}>
          <span className="text-[12px] font-semibold leading-none">{time}</span>
          <span className="flex items-center gap-[5px]">
            <WifiIcon />
            <SignalIcon />
            {showBattery && <BatteryIcon />}
          </span>
        </div>
      </div>
    );
  }

  if (iosSurfacePhone && chromeVariant === "ios-classic") {
    return (
      <div
        data-ios-status-layout="classic"
        className={`pointer-events-none absolute inset-x-0 top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center bg-transparent px-1.5 text-[9px] font-semibold leading-none ${dark ? "text-white" : "text-slate-950"}`}
        style={{ height: h }}
      >
        <span className="flex min-w-0 items-center gap-1">
          <LegacySignalDots />
          <span>{t("carrier")}</span>
        </span>
        <span className="text-[10px]">{time}</span>
        <span className="flex items-center justify-end gap-1">
          {showBattery && <span>100%</span>}
          {showBattery && <BatteryIcon />}
        </span>
      </div>
    );
  }

  if (iosSurfacePhone) {
    if (cameraWidth) return <div aria-hidden data-browser-control="status" data-ios-status-layout="island"
      className={`pointer-events-none absolute inset-x-0 top-0 z-20 grid items-center text-[15px] font-semibold leading-none ${dark ? "text-white" : "text-slate-950"}`}
      style={{ height: h, gridTemplateColumns: `minmax(0, 1fr) ${cameraWidth}px minmax(0, 1fr)`, padding: "6px 16px 0" }}>
      <span data-status-clock className="justify-self-center">{time}</span>
      <span data-status-indicators className="flex items-center justify-center gap-[5px]" style={{ gridColumn: 3 }}><SignalIcon/><WifiIcon/>{showBattery && <BatteryIcon/>}</span>
    </div>;
    // The time sits to the LEFT of the notch/island and the indicators to the RIGHT,
    // both vertically centered on the island band (roughly the lower half of the safe area).
    const islandBand = Math.min(h, 44);
    return (
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex items-end bg-transparent font-semibold ${dark ? "text-white" : "text-slate-950"}`}
        style={{ height: h }}
      >
        <div className="flex w-full items-center" style={{ height: islandBand, paddingLeft: timeInsetLeft, paddingRight: indicatorInsetRight }}>
          <span className="flex h-full flex-1 items-center justify-center pr-[28%] text-[15px] leading-none tracking-tight">{time}</span>
          <span className="flex h-full flex-1 items-center justify-center gap-[5px] pl-[28%]">
            <SignalIcon />
            <WifiIcon />
            {showBattery && <BatteryIcon />}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between text-[11px] font-bold ${
        iosImageBackedTablet
          ? dark ? "bg-transparent text-white" : "bg-transparent text-slate-950"
          : ios
          ? "bg-black text-white"
          : dark
            ? "bg-[#0f172a]/90 text-slate-100"
            : "bg-white/90 text-slate-900"
      }`}
      style={{ height: h, paddingLeft: px, paddingRight: px }}
    >
      <span>{time}</span>
      <span className="flex items-center gap-1">
        <SignalIcon />
        <WifiIcon />
        {showBattery && <BatteryIcon />}
      </span>
    </div>
  );
}

// Neutral bottom browser controls for user-created viewports.
function CustomBrowserBar({ hostname, compact, dark }: {
  hostname: string;
  compact: boolean;
  dark: boolean;
}) {
  const searchH = compact ? 36 : 40;
  const toolbarH = compact ? 30 : 36;
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end overflow-hidden border-t backdrop-blur-xl ${
        dark ? "border-white/10 bg-[#1c1c1e]/90" : "border-black/5 bg-[#f7f7f8]/92"
      }`}
    >
      {/* Address pill row */}
      <div className="flex items-center px-3" style={{ height: searchH }}>
        <div
          className={`flex w-full items-center gap-2 px-3 font-medium ${
            dark ? "bg-white/10 text-slate-200" : "bg-[#e3e3e6] text-slate-700"
          }`}
          style={{ height: compact ? 28 : 32, borderRadius: 9, fontSize: compact ? 11 : 13 }}
        >
          <span className={`text-[13px] font-semibold ${dark ? "text-slate-300" : "text-slate-500"}`}>AA</span>
          <G.Lock size={10} className={`shrink-0 ${dark ? "text-slate-300" : "text-slate-500"}`} />
          <span className="min-w-0 flex-1 truncate text-center">{hostname}</span>
          <G.Reload size={12} className={`shrink-0 ${dark ? "text-slate-300" : "text-slate-500"}`} />
        </div>
      </div>
      {/* Toolbar icon row */}
      <div
        className={`flex items-center justify-around ${
          dark ? "text-sky-400" : "text-[#007AFF]"
        }`}
        style={{ height: toolbarH }}
      >
        <G.ChevronLeft size={19} />
        <G.ChevronRight size={19} className={dark ? "text-slate-600" : "text-slate-300"} />
        <G.Share size={17} />
        <G.Book size={18} />
        <G.Copy size={17} />
      </div>
    </div>
  );
}

function DesktopBar({ hostname, dark }: { hostname: string; dark: boolean }) {
  return (
    <div
      data-desktop-chrome="windows"
      className={`flex h-9 items-center gap-1.5 border-b px-2 ${
        dark ? "border-white/10 bg-[#111827] text-slate-300" : "border-slate-200 bg-[#f3f4f6] text-slate-600"
      }`}
    >
      <G.ChevronLeft size={14} className="shrink-0" />
      <G.ChevronRight size={14} className={`shrink-0 ${dark ? "text-slate-600" : "text-slate-300"}`} />
      <G.Reload size={12} className="mx-0.5 shrink-0" />
      <span
        className={`mx-1 flex min-w-0 flex-1 items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold shadow-inner ${
          dark ? "bg-white/10 text-slate-300" : "bg-white text-slate-500"
        }`}
      >
        <G.Lock size={10} className="shrink-0" />
        <span className="truncate">{hostname}</span>
      </span>
      <G.MoreVertical size={14} className="shrink-0" />
    </div>
  );
}

function SafariDesktopBar({ hostname, dark }: { hostname: string; dark: boolean }) {
  return (
    <div
      data-desktop-chrome="safari"
      className={`flex h-14 items-center gap-5 border-b px-8 ${
        dark ? "border-white/10 bg-[#111827] text-slate-200" : "border-slate-200 bg-[#f7f7f8] text-[#007AFF]"
      }`}
    >
      <G.ChevronLeft size={22} />
      <G.ChevronRight size={22} className={dark ? "text-slate-500" : "text-slate-300"} />
      <G.Book size={22} />
      <span
        className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-semibold ${
          dark ? "bg-white/10 text-slate-200" : "bg-[#e5e5e7] text-slate-700"
        }`}
      >
        <span className={dark ? "text-slate-200" : "text-slate-900"}>AA</span>
        <G.Lock size={12} />
        <span className="truncate">{hostname}</span>
        <G.Reload size={14} />
      </span>
      <G.Share size={22} />
      <G.Plus size={22} />
      <G.Copy size={22} />
    </div>
  );
}

function AndroidAddrBar({
  hostname,
  dark,
  top = false,
  topOffset = 0,
  bottomOffset = 0,
  scrollProgress = 0,
}: {
  hostname: string;
  dark: boolean;
  top?: boolean;
  topOffset?: number;
  bottomOffset?: number;
  scrollProgress?: number;
}) {
  if (top) {
    // The Chrome address bar stays CONSTANT (no scroll collapse). Collapsing it reflowed the
    // iframe every scroll frame, which caused the UI to jump. It now overlays the top of the
    // page as a fixed banner below the constant status strip.
    return (
      <div
        className={`pointer-events-none absolute inset-x-0 z-20 flex h-12 items-center gap-2 border-b px-3 text-[12px] font-semibold ${
          dark ? "border-white/10 bg-[#111827] text-slate-300" : "border-slate-100 bg-white text-slate-600"
        }`}
        style={{ top: topOffset, height: 48 * (1 - clamp(scrollProgress, 0, 1)), opacity: 1 - clamp(scrollProgress, 0, 1), overflow: "hidden" }}
      >
        <G.Home size={17} className={`shrink-0 ${dark ? "text-slate-100" : "text-slate-800"}`} />
        <span className={`min-w-0 flex-1 truncate rounded-full px-3 py-1.5 ${dark ? "bg-white/10" : "bg-slate-100"}`}>{hostname}</span>
        <G.MoreVertical size={16} className={`shrink-0 ${dark ? "text-slate-100" : "text-slate-800"}`} />
      </div>
    );
  }
  // Bottom gesture navigation pill — stays constant (Android keeps nav visible).
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-6 ${dark ? "bg-[#111827]/95" : "bg-white/95"}`}
      style={{ height: 36, bottom: bottomOffset }}
    >
      <span className="grid h-4 w-4 place-items-center"><span className={`h-2 w-2 rounded-full border-[1.5px] ${dark ? "border-slate-100" : "border-slate-800"}`} /></span>
      <span className={`h-[3px] w-14 rounded-full ${dark ? "bg-slate-100" : "bg-slate-800"}`} />
      <G.Square size={12} strokeWidth={2} className={dark ? "text-slate-100" : "text-slate-800"} />
    </div>
  );
}


function SignalIcon() {
  return (
    <svg width="15" height="11" viewBox="0 0 15 11" aria-hidden="true" className="block fill-current">
      <rect x="0" y="7" width="2.5" height="4" rx="0.8" />
      <rect x="4" y="5" width="2.5" height="6" rx="0.8" />
      <rect x="8" y="2.5" width="2.5" height="8.5" rx="0.8" />
      <rect x="12" y="0" width="2.5" height="11" rx="0.8" />
    </svg>
  );
}

function LegacySignalDots() {
  return (
    <span aria-hidden="true" className="flex items-center gap-px">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className="h-[3px] w-[3px] rounded-full bg-current" />
      ))}
    </span>
  );
}

function WifiIcon() {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" aria-hidden="true" className="block fill-current">
      <path d="M7 10.8 5.35 9.15a2.34 2.34 0 0 1 3.3 0L7 10.8Z" />
      <path d="m3.35 7.15-1.2-1.2a6.86 6.86 0 0 1 9.7 0l-1.2 1.2a5.16 5.16 0 0 0-7.3 0Z" />
      <path d="M1.2 4.95 0 3.75a9.9 9.9 0 0 1 14 0l-1.2 1.2a8.2 8.2 0 0 0-11.6 0Z" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="23" height="11" viewBox="0 0 23 11" aria-hidden="true" className="block">
      <rect x="0.65" y="0.65" width="19" height="9.7" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.72" />
      <rect x="2.2" y="2.2" width="15.9" height="6.6" rx="1.25" fill="currentColor" />
      <path d="M21 3.45v4.1c1.05-.34 1.65-1.08 1.65-2.05S22.05 3.79 21 3.45Z" fill="currentColor" opacity="0.72" />
    </svg>
  );
}

function safeHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
