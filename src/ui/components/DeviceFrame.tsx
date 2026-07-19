import { useEffect, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Copy, BookOpen, Lock, Plus, RefreshCw, Share, Square, Home, MoreVertical } from "lucide-react";
import type { Device, MockupViewportConfig, Orientation, Size } from "../../domain/device/device.types";
import { getFrameProfile, type DeviceFrameStyle, type ChromeVariant } from "../../domain/device/frame-profiles";

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
}

export type MobileKeyboardAction =
  | { action: "text"; text: string }
  | { action: "backspace" | "enter" | "dismiss" };

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
}) {
  const profile = getFrameProfile(device);
  const hostname = safeHostname(url);
  // Derive the rendered posture from the viewport itself. Most handset/tablet
  // PNGs are portrait-first, but unfolded foldables can be natively landscape.
  // Using the orientation label alone made those assets escape their fitted box.
  const landscape = viewportSize.width > viewportSize.height && (device.type === "phone" || device.type === "tablet");
  const compact = landscape || profile.kind === "iphone-classic" || profile.kind === "tablet";
  const shellP = profile.style.shellPadding ?? profile.shellPadding;
  const innerP = profile.style.innerPadding ?? 0;
  const contentR = profile.style.contentRadius ?? profile.contentRadius;
  const chromeCollapse = clamp(scrollProgress, 0, 1);

  // Reserve the top safe area (status bar + notch / Dynamic Island) so content never
  // renders under the cutout. In landscape the cutout is on the side, so no top inset.
  const safeTopCss = orientation === "landscape" ? 0 : profile.safeAreaInsetTop;
  const statusH = Math.max(
    showStatusBar ? getStatusHeight(profile.platform, profile.kind, compact) : 0,
    safeTopCss,
  );
  const addrH = showUrlBar && profile.platform === "android" ? 48 : 0;
  const bottomH = showUrlBar ? getBottomHeight(profile.platform, compact) : 0;
  const contentH = Math.max(120, viewportSize.height - statusH - addrH - bottomH);
  const imageFrame = device.mockupAssets.find((asset) => asset.kind === "transparent-png" && asset.localPath && asset.width && asset.height);
  const measuredScreenRect = useImageScreenRect(imageFrame?.screenInset ? undefined : imageFrame?.localPath);
  const keyboardOverlay = keyboard && (device.type === "phone" || device.type === "tablet") ? (
    <MobileKeyboard
      platform={profile.platform === "ios" ? "ios" : "android"}
      landscape={landscape}
      tablet={device.type === "tablet"}
      dark={darkMode}
      state={keyboard}
      onAction={onKeyboardAction}
    />
  ) : null;

  // ── No frame ──────────────────────────────────────────────────────────────
  if (!showFrame) {
    return (
      <div
        className={`relative overflow-hidden rounded-[10px] border shadow-sm ${darkMode ? "border-white/10 bg-[#0f172a]" : "border-slate-200 bg-white"}`}
        style={{ width: viewportSize.width, height: viewportSize.height }}
      >
        {children}
        {keyboardOverlay}
      </div>
    );
  }

  // User-created viewports use one neutral browser shell. They have no physical
  // mockup metadata, so rendering them as an iPhone/Android model is misleading.
  // Keep the entered viewport exact and anchor a compact browser bar to its bottom.
  if (device.brand === "Custom") {
    const customStatusH = showStatusBar ? (compact ? 20 : 24) : 0;
    const customBottomH = showUrlBar ? (compact ? 66 : 76) : 0;
    const customContentH = Math.max(1, viewportSize.height - customStatusH - customBottomH);
    return (
      <div
        className="relative shrink-0 rounded-[20px] bg-gradient-to-br from-[#303640] to-[#171b21] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.3)] ring-1 ring-black/25"
        style={{ width: viewportSize.width + 16, height: viewportSize.height + 16 }}
      >
        <div
          className={`relative h-full w-full overflow-hidden rounded-[13px] ${darkMode ? "bg-[#0f172a]" : "bg-white"}`}
        >
          {showStatusBar && <StatusBar platform="ios" showBattery={showBattery} compact={compact} dark={darkMode} height={customStatusH} />}
          <div style={{ width: viewportSize.width, height: customContentH, marginTop: customStatusH }}>
            {children}
          </div>
          {showUrlBar && <SafariBar hostname={hostname} compact={compact} dark={darkMode} variant="ios-classic" />}
          {keyboardOverlay}
        </div>
      </div>
    );
  }

  if (imageFrame?.localPath && imageFrame.width && imageFrame.height) {
    const baseFrameW = imageFrame.width / 2;
    const baseFrameH = imageFrame.height / 2;
    const assetLandscape = baseFrameW > baseFrameH;
    const rotateImage = (device.type === "phone" || device.type === "tablet") && assetLandscape !== landscape;
    const frameW = rotateImage ? baseFrameH : baseFrameW;
    const frameH = rotateImage ? baseFrameW : baseFrameH;
    const viewportConfig = imageFrame.viewport?.[orientation];
    const catalogScreenRect = screenRectFromInset(imageFrame.screenInset, frameW, frameH);
    const resolvedMeasuredScreenRect = catalogScreenRect ?? measuredScreenRect;
    const waitForMeasuredScreen = !viewportConfig && device.type !== "phone" && !resolvedMeasuredScreenRect;
    const screenRect = adjustImageFrameScreenRect(
      getImageFrameScreenRect(viewportSize, frameW, frameH, resolvedMeasuredScreenRect),
      frameW,
      frameH,
      viewportConfig,
    );
    const screenFit = fitViewportToScreen(viewportSize, screenRect);
    const viewportClipPath = getImageViewportClipPath(viewportConfig, orientation, screenRadiusForDevice(device));
    const mobileChrome = profile.imageChrome;
    // The top safe area = status bar + notch / Dynamic Island clearance. In landscape the
    // notch moves to the side, so no vertical top inset is reserved.
    const safeTop = landscape ? 0 : profile.safeAreaInsetTop;
    const imageStatusH = mobileChrome.showStatusBar && showStatusBar
      ? Math.max(safeTop, statusH)
      : safeTop;
    const imageAddrH = mobileChrome.showAndroidTopBar && showUrlBar ? addrH : 0;
    const imageBottomH = mobileChrome.showBottomBar && showUrlBar ? bottomH : 0;
    const screenRadius =
      device.type === "laptop" || device.type === "desktop" || device.type === "tv"
        ? 8
        : profile.kind === "tablet"
          ? contentR
          : Math.max(16, contentR);
    const desktopToolbarH = showUrlBar && (device.type === "laptop" || device.type === "desktop") ? 36 : 0;
    const useSafariDesktopChrome = showUrlBar && profile.style.desktopChrome === "safari";
    // Content offset is FIXED (based on the full chrome) so the iframe never reflows while
    // the address banner collapses on scroll — the bars visually overlay the page instead,
    // exactly like a real browser. This prevents the scroll "jumping" that reflow caused.
    const imageContentTop =
      device.type === "laptop" || device.type === "desktop" || device.type === "tv"
        ? 0
        : getMobileContentTop(imageStatusH, imageAddrH);
    const imageContentH =
      device.type === "laptop" || device.type === "desktop" || device.type === "tv"
        ? Math.max(120, viewportSize.height - (useSafariDesktopChrome ? 56 : desktopToolbarH))
        : Math.max(120, viewportSize.height - imageContentTop);

    return (
      <div
        data-device-frame={device.id}
        className="relative shrink-0"
        style={{ width: frameW, height: frameH }}
      >
        <img
          src={imageFrame.localPath}
          alt=""
          draggable={false}
          className="pointer-events-none absolute select-none"
          style={{
            width: baseFrameW,
            height: baseFrameH,
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%)${rotateImage ? " rotate(90deg)" : ""}`,
          }}
        />
        {!waitForMeasuredScreen && (
          <div
            data-device-screen={device.id}
            className="absolute overflow-hidden"
            style={{
              left: screenFit.left,
              top: screenFit.top,
              width: screenFit.width,
              height: screenFit.height,
              borderRadius: viewportClipPath ? undefined : Math.max(4, (landscape ? Math.max(10, screenRadius - 6) : screenRadius) * screenFit.radiusScale),
              clipPath: viewportClipPath,
              backgroundColor: device.type === "phone" && profile.platform === "ios"
                ? "#000000"
                : darkMode
                  ? "#0f172a"
                  : "#ffffff",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
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
                  {mobileChrome.showStatusBar && showStatusBar && (
                    <StatusBar
                      platform={profile.platform}
                      showBattery={showBattery}
                      compact={compact}
                      dark={darkMode}
                      imageBackedKind={device.type === "tablet" ? "tablet" : "phone"}
                      height={imageStatusH || undefined}
                      chromeVariant={profile.chromeVariant}
                      timeInsetLeft={profile.statusBarInsetLeft}
                    />
                  )}
                  {mobileChrome.showAndroidTopBar && showUrlBar && <AndroidAddrBar hostname={hostname} dark={darkMode} top topOffset={imageStatusH} scrollProgress={chromeCollapse} />}
                  <div
                    style={{
                      width: viewportSize.width,
                      height: imageContentH,
                      marginTop: imageContentTop,
                    }}
                  >
                    {children}
                  </div>
                  {mobileChrome.showSafariBar && showUrlBar && (
                    <SafariBar
                      hostname={hostname}
                      compact={compact}
                      dark={darkMode}
                      scrollProgress={chromeCollapse}
                      variant={profile.chromeVariant}
                      safeAreaInsetBottom={profile.safeAreaInsetBottom}
                    />
                  )}
                  {mobileChrome.showAndroidBottomBar && showUrlBar && <AndroidAddrBar hostname={hostname} dark={darkMode} scrollProgress={chromeCollapse} />}
                  {mobileChrome.showHomeIndicator && <HomeIndicator variant={profile.chromeVariant} safeAreaInsetBottom={profile.safeAreaInsetBottom} />}
                  {keyboardOverlay}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Laptop ────────────────────────────────────────────────────────────────
  if (device.type === "laptop") {
    const toolbarH = showUrlBar ? 36 : 0;
    // Lid padding: 14px top (camera area), 10px sides, 10px bottom
    const LID_TOP = 22;   // space for camera dot
    const LID_SIDE = 12;
    const LID_BOT = 10;
    const screenW = viewportSize.width;
    const screenH = viewportSize.height + toolbarH;
    const lidW = screenW + LID_SIDE * 2;
    const lidH = screenH + LID_TOP + LID_BOT;
    const totalW = lidW + 80;   // base/palm-rest wider than lid
    const totalH = lidH + 80;
    return (
      <div className="flex flex-col items-center" style={{ width: totalW, height: totalH }}>
        {/* Lid — dark aluminium shell */}
        <div
          className="relative flex flex-col bg-gradient-to-b from-[#3a3f48] to-[#1e2228] shadow-[0_20px_60px_rgba(0,0,0,0.4)] ring-1 ring-black/40"
          style={{ width: lidW, height: lidH, borderRadius: "18px 18px 6px 6px", padding: `${LID_TOP}px ${LID_SIDE}px ${LID_BOT}px` }}
        >
          {/* Camera dot */}
          <div className="absolute left-1/2 top-[7px] h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-[#555b66] ring-1 ring-black/40" />
          {/* Screen bezel — black inner ring */}
          <div
            className="flex-1 overflow-hidden bg-black p-[3px]"
            style={{ borderRadius: "6px 6px 4px 4px" }}
          >
            {/* Screen surface */}
            <div
              className={`h-full overflow-hidden ${darkMode ? "bg-[#0f172a]" : "bg-white"}`}
              style={{ borderRadius: "4px 4px 2px 2px" }}
            >
              {showUrlBar && <DesktopBar hostname={hostname} dark={darkMode} />}
              <div style={{ width: viewportSize.width, height: viewportSize.height }}>{children}</div>
            </div>
          </div>
        </div>
        {/* Hinge strip */}
        <div
          className="relative h-[8px] bg-gradient-to-b from-[#b0b6bf] to-[#8a9099] ring-1 ring-black/15"
          style={{ width: totalW }}
        >
          <div className="absolute left-1/2 top-0 h-[4px] w-20 -translate-x-1/2 rounded-b-sm bg-black/10" />
        </div>
        {/* Palm rest / base */}
        <div
          className="h-[44px] bg-gradient-to-b from-[#c8cdd5] to-[#9fa5b0] shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/10"
          style={{ width: totalW, borderRadius: "0 0 24px 24px" }}
        >
          <div className="mx-auto mt-[10px] h-[22px] w-[140px] rounded-[9px] border border-slate-400/30 bg-slate-300/40 shadow-inner" />
        </div>
        {/* Shadow blur */}
        <div className="h-[8px] rounded-full bg-black/10 blur-sm" style={{ width: totalW - 60 }} />
      </div>
    );
  }

  // ── Desktop / TV ───────────────────────────────────────────────────────────
  if (device.type === "desktop" || device.type === "tv") {
    const toolbarH = device.type === "desktop" && showUrlBar ? 36 : 0;
    const screenW = viewportSize.width + 28;
    const screenH = viewportSize.height + toolbarH + 24;
    const totalW = screenW + 28;
    const isTv = device.type === "tv";
    return (
      <div className="flex flex-col items-center" style={{ width: totalW }}>
        <div
          className={`relative overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.3)] ring-1 ring-black/20 ${isTv ? "rounded-[14px] bg-[#101318] p-[10px]" : "rounded-[20px] bg-gradient-to-br from-[#252b33] to-[#343b45] p-[14px]"}`}
          style={{ width: screenW, height: screenH }}
        >
          <div className={`h-full overflow-hidden rounded-[8px] ${darkMode ? "bg-[#0f172a]" : "bg-white"}`}>
            {!isTv && showUrlBar && <DesktopBar hostname={hostname} dark={darkMode} />}
            <div style={{ width: viewportSize.width, height: viewportSize.height }}>{children}</div>
          </div>
        </div>
        <div className="h-10 w-10 bg-gradient-to-b from-slate-500 to-slate-700" />
        <div
          className="h-3 rounded-full bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 shadow-sm"
          style={{ width: Math.min(360, Math.max(160, totalW * 0.4)) }}
        />
      </div>
    );
  }

  // ── Watch ──────────────────────────────────────────────────────────────────
  if (profile.kind === "watch") {
    return (
      <div className="relative rounded-[44px] bg-[#1c1c1e] p-[7px] shadow-[0_20px_50px_rgba(0,0,0,0.4)] ring-1 ring-black/30">
        <div className="absolute -right-[5px] top-[30%] h-10 w-[4px] rounded-r bg-[#2a2a2c]" />
        <div className="absolute -right-[5px] top-[50%] h-6 w-[4px] rounded-r bg-[#2a2a2c]" />
        <div className="overflow-hidden rounded-[36px] bg-black">
          {children}
        </div>
      </div>
    );
  }

  // ── Tablet ─────────────────────────────────────────────────────────────────
  if (profile.kind === "tablet") {
    const isIos = profile.platform === "ios";
    const screenH = viewportSize.height;
    return (
      <div
        className="relative shadow-[0_24px_72px_rgba(0,0,0,0.28)] ring-1 ring-black/20"
        style={{
          background: profile.style.shellGradient ?? (isIos
            ? "linear-gradient(135deg, #d0cdc6 0%, #111 52%, #e8e4d8 100%)"
            : "linear-gradient(135deg, #3a424e 0%, #121820 52%, #6c7480 100%)"),
          borderRadius: 36,
          padding: shellP
        }}
      >
        {/* Camera */}
        <div className="absolute left-1/2 top-[10px] z-30 h-[8px] w-[8px] -translate-x-1/2 rounded-full bg-black/80 ring-1 ring-white/10" />
        <div
          className="overflow-hidden bg-black"
          style={{ borderRadius: 26, padding: innerP }}
        >
          <div
            className={`relative overflow-hidden ${darkMode ? "bg-[#0f172a]" : "bg-white"}`}
            style={{ borderRadius: landscape ? Math.max(10, contentR - 6) : contentR, width: viewportSize.width, height: screenH }}
          >
            {showStatusBar && <StatusBar platform={profile.platform} showBattery={showBattery} compact={compact} dark={darkMode} chromeVariant={profile.chromeVariant} height={statusH} />}
            {showUrlBar && profile.platform === "android" && <AndroidAddrBar hostname={hostname} dark={darkMode} top topOffset={statusH} scrollProgress={chromeCollapse} />}
            <div
              style={{
                width: viewportSize.width,
                height: contentH,
                marginTop: statusH + addrH,
                marginBottom: bottomH,
              }}
            >
              {children}
            </div>
            {showUrlBar && isIos && <SafariBar hostname={hostname} compact={compact} dark={darkMode} scrollProgress={chromeCollapse} variant={profile.chromeVariant} safeAreaInsetBottom={profile.safeAreaInsetBottom} />}
            {showUrlBar && profile.platform === "android" && <AndroidAddrBar hostname={hostname} dark={darkMode} scrollProgress={chromeCollapse} />}
            {isIos && <HomeIndicator variant={profile.chromeVariant} safeAreaInsetBottom={profile.safeAreaInsetBottom} />}
            {keyboardOverlay}
          </div>
        </div>
      </div>
    );
  }

  // ── Phone (iOS / Android) ───────────────────────────────────────────────────
  const isIos = profile.platform === "ios";
  const screenH = viewportSize.height;
  const innerR = Math.max(16, contentR);

  return (
    <div
      className="relative shadow-[0_28px_80px_rgba(0,0,0,0.32)] ring-1 ring-black/20"
      style={{
        background: profile.style.shellGradient,
        borderRadius: profile.radius,
        padding: shellP
      }}
    >
      <SideButtons platform={profile.platform} kind={profile.kind} color={profile.style.sideButtonColor} />
      <div
        className="overflow-hidden bg-black"
        style={{ borderRadius: Math.max(16, profile.radius - shellP), padding: innerP }}
      >
        <DeviceCutout kind={profile.kind} platform={profile.platform} style={profile.style} />
        <div
          className={`relative overflow-hidden ${darkMode ? "bg-[#0f172a]" : "bg-white"}`}
          style={{ borderRadius: landscape ? Math.max(10, innerR - 6) : innerR, width: viewportSize.width, height: screenH }}
        >
          {showStatusBar && <StatusBar platform={profile.platform} showBattery={showBattery} compact={compact} dark={darkMode} chromeVariant={profile.chromeVariant} height={statusH} />}
          {showUrlBar && profile.platform === "android" && <AndroidAddrBar hostname={hostname} dark={darkMode} top topOffset={statusH} scrollProgress={chromeCollapse} />}
          <div
            style={{
              width: viewportSize.width,
              height: contentH,
              marginTop: statusH + addrH,
              marginBottom: bottomH,
            }}
          >
            {children}
          </div>
          {showUrlBar && isIos && <SafariBar hostname={hostname} compact={compact} dark={darkMode} scrollProgress={chromeCollapse} variant={profile.chromeVariant} safeAreaInsetBottom={profile.safeAreaInsetBottom} />}
          {showUrlBar && profile.platform === "android" && <AndroidAddrBar hostname={hostname} dark={darkMode} scrollProgress={chromeCollapse} />}
          {isIos && <HomeIndicator variant={profile.chromeVariant} safeAreaInsetBottom={profile.safeAreaInsetBottom} />}
          {keyboardOverlay}
        </div>
      </div>
    </div>
  );
}

function MobileKeyboard({
  platform,
  landscape,
  tablet,
  dark,
  state,
  onAction,
}: {
  platform: "ios" | "android";
  landscape: boolean;
  tablet: boolean;
  dark: boolean;
  state: MobileKeyboardState;
  onAction?: (action: MobileKeyboardAction) => void;
}) {
  const [shifted, setShifted] = useState(false);
  const [symbolMode, setSymbolMode] = useState(false);
  const inputKind = `${state.inputType ?? ""} ${state.inputMode ?? ""}`.toLowerCase();
  const forcedNumeric = /number|numeric|decimal|tel/.test(inputKind);
  const numeric = forcedNumeric || symbolMode;
  const email = /email/.test(inputKind);
  const search = /search/.test(inputKind);
  const keyboardHeight = landscape ? (tablet ? 250 : 190) : tablet ? 360 : 290;
  const ios = platform === "ios";
  const surface = ios
    ? dark ? "bg-[#5a5d63]/98 text-white" : "bg-[#d1d4d9]/98 text-slate-950"
    : dark ? "bg-[#202124]/98 text-white" : "bg-[#eceff1]/98 text-slate-950";
  const keySurface = ios
    ? dark ? "bg-[#868a91] shadow-[0_2px_0_#303237]" : "bg-white shadow-[0_2px_0_#8d929a]"
    : dark ? "bg-[#3c4043] shadow-[0_1px_0_#111]" : "bg-white shadow-[0_1px_0_#aeb4b9]";
  const utilitySurface = ios
    ? dark ? "bg-[#6b6f76]" : "bg-[#aeb3bb]"
    : dark ? "bg-[#303134]" : "bg-[#d7dadd]";

  const sendText = (value: string) => {
    onAction?.({ action: "text", text: shifted ? value.toUpperCase() : value });
    if (shifted) setShifted(false);
  };
  const stopFocusChange = (event: ReactPointerEvent<HTMLButtonElement>) => event.preventDefault();
  const key = (label: string, value = label, wide = false) => (
    <button
      key={`${label}-${value}`}
      type="button"
      tabIndex={-1}
      aria-label={`Key ${label === " " ? "Space" : label}`}
      className={`flex min-w-0 flex-1 items-center justify-center rounded-[7px] font-medium active:translate-y-px ${keySurface} ${wide ? "basis-[34%]" : ""}`}
      style={{ fontSize: tablet ? 22 : landscape ? 14 : 18 }}
      onPointerDown={stopFocusChange}
      onClick={() => sendText(value)}
    >
      {label === " " ? (ios ? "space" : "") : shifted ? label.toUpperCase() : label}
    </button>
  );
  const rows = numeric
    ? [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], [".", "0", "-"]]
    : [["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"], ["a", "s", "d", "f", "g", "h", "j", "k", "l"], ["z", "x", "c", "v", "b", "n", "m"]];
  const enterLabel = state.multiline ? (ios ? "return" : "Enter") : search ? "Search" : ios ? "go" : "Go";

  useEffect(() => {
    setShifted(false);
    setSymbolMode(false);
  }, [inputKind]);

  return (
    <div
      data-mobile-keyboard={platform}
      role="group"
      aria-label={`${ios ? "iOS" : "Android"} on-screen keyboard`}
      className={`absolute inset-x-0 bottom-0 z-[70] flex flex-col gap-2 border-t border-black/10 p-2.5 shadow-[0_-12px_32px_rgba(0,0,0,0.22)] backdrop-blur-xl ${surface}`}
      style={{ height: keyboardHeight }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {rows.map((row, index) => (
        <div key={index} className="flex min-h-0 flex-1 justify-center gap-1.5 px-0.5">
          {!numeric && index === 2 && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Shift"
              aria-pressed={shifted}
              className={`flex basis-[12%] items-center justify-center rounded-[7px] text-base ${utilitySurface} ${shifted ? "ring-2 ring-blue-500" : ""}`}
              onPointerDown={stopFocusChange}
              onClick={() => setShifted((value) => !value)}
            >
              ⇧
            </button>
          )}
          {row.map((letter) => key(letter))}
          {index === rows.length - 1 && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Backspace"
              className={`flex basis-[12%] items-center justify-center rounded-[7px] text-lg ${utilitySurface}`}
              onPointerDown={stopFocusChange}
              onClick={() => onAction?.({ action: "backspace" })}
            >
              ⌫
            </button>
          )}
        </div>
      ))}
      <div className="flex min-h-0 flex-1 gap-1.5">
        {forcedNumeric ? key("+") : email ? key("@") : (
          <button
            type="button"
            tabIndex={-1}
            aria-label={numeric ? "Letters keyboard" : "Numbers keyboard"}
            className={`flex basis-[14%] items-center justify-center rounded-[7px] px-2 font-medium ${utilitySurface}`}
            onPointerDown={stopFocusChange}
            onClick={() => setSymbolMode((value) => !value)}
          >
            {numeric ? "ABC" : ios ? "123" : "?123"}
          </button>
        )}
        {key(" ", " ", true)}
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Key ${enterLabel}`}
          className="flex basis-[20%] items-center justify-center rounded-[7px] bg-blue-500 px-2 font-semibold text-white active:bg-blue-600"
          style={{ fontSize: tablet ? 18 : 14 }}
          onPointerDown={stopFocusChange}
          onClick={() => onAction?.({ action: "enter" })}
        >
          {enterLabel}
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Dismiss keyboard"
          className={`flex basis-[12%] items-center justify-center rounded-[7px] ${utilitySurface}`}
          onPointerDown={stopFocusChange}
          onClick={() => onAction?.({ action: "dismiss" })}
        >
          <ChevronDown size={tablet ? 24 : 18} />
        </button>
      </div>
      {ios && <div className="mx-auto h-1 w-[34%] shrink-0 rounded-full bg-current opacity-70" />}
    </div>
  );
}

// ─── estimateDeviceFrameSize ─────────────────────────────────────────────────
export function estimateDeviceFrameSize({ device, showFrame, showStatusBar, showUrlBar, viewportSize }: FrameSizeInput): Size {
  if (!showFrame) return viewportSize;

  if (device.brand === "Custom") {
    return { width: viewportSize.width + 16, height: viewportSize.height + 16 };
  }

  const profile = getFrameProfile(device);
  const imageFrame = device.mockupAssets.find((asset) => asset.kind === "transparent-png" && asset.width && asset.height);
  if (imageFrame?.width && imageFrame.height) {
    const viewportLandscape = (device.type === "phone" || device.type === "tablet") && viewportSize.width > viewportSize.height;
    const assetLandscape = imageFrame.width > imageFrame.height;
    const rotateImage = (device.type === "phone" || device.type === "tablet") && assetLandscape !== viewportLandscape;
    return {
      width: (rotateImage ? imageFrame.height : imageFrame.width) / 2,
      height: (rotateImage ? imageFrame.width : imageFrame.height) / 2,
    };
  }

  if (device.type === "laptop") {
    const toolbarH = showUrlBar ? 36 : 0;
    // totalW = viewportW + LID_SIDE*2 + 80 = viewportW + 24 + 80
    // totalH = lidH + hinge(8) + base(44) + shadow(8)
    //        = (viewportH + toolbarH + LID_TOP(22) + LID_BOT(10)) + 60
    return {
      width: viewportSize.width + 104,
      height: viewportSize.height + toolbarH + 92,
    };
  }

  if (device.type === "desktop" || device.type === "tv") {
    const toolbarH = device.type === "desktop" && showUrlBar ? 36 : 0;
    return {
      width: viewportSize.width + 28 + 28,
      height: viewportSize.height + toolbarH + 24 + 58,
    };
  }

  if (profile.kind === "watch") {
    return {
      width: viewportSize.width + 14,
      height: viewportSize.height + 14,
    };
  }

  const compact = profile.kind === "tablet" || profile.kind === "iphone-classic" || viewportSize.width > viewportSize.height;
  const statusH = showStatusBar ? getStatusHeight(profile.platform, profile.kind, compact) : 0;
  const addrH = showUrlBar && profile.platform === "android" ? 48 : 0;
  const bottomH = showUrlBar ? getBottomHeight(profile.platform, compact) : 0;

  const isTablet = profile.kind === "tablet";
  const shellP = profile.style.shellPadding ?? profile.shellPadding;
  const innerP = profile.style.innerPadding ?? (isTablet ? 10 : 6);
  const chrome = (shellP + innerP) * 2;

  return {
    width: viewportSize.width + chrome,
    height: viewportSize.height + chrome,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function getImageFrameScreenRect(
  viewportSize: Size,
  frameW: number,
  frameH: number,
  measuredScreenRect: ScreenRect | null
): ScreenRect {
  const extraW = Math.max(0, frameW - viewportSize.width);
  const extraH = Math.max(0, frameH - viewportSize.height);

  if (measuredScreenRect) return measuredScreenRect;

  return {
    left: extraW / 2,
    top: extraH / 2,
    width: viewportSize.width,
    height: viewportSize.height,
  };
}

function adjustImageFrameScreenRect(
  rect: ScreenRect,
  frameW: number,
  frameH: number,
  adjustment?: MockupViewportConfig,
): ScreenRect {
  if (!adjustment) return rect;

  return {
    left: clamp(adjustment.left, 0, frameW - 1),
    top: clamp(adjustment.top, 0, frameH - 1),
    width: clamp(adjustment.width, 1, frameW - adjustment.left),
    height: clamp(adjustment.height, 1, frameH - adjustment.top),
  };
}

function getImageViewportClipPath(
  adjustment: MockupViewportConfig | undefined,
  orientation: Orientation,
  radius: number,
) {
  const path = adjustment?.paths?.[orientation];
  const pathValue = Array.isArray(path) ? path.join(" ") : path;
  // Use the evenodd fill rule so the inner camera/notch sub-path is always cut out as a
  // hole, regardless of its winding direction. With the default (nonzero) rule, a hole only
  // appears when the sub-paths wind in opposite directions — which is why the notch showed
  // on some devices and not others.
  if (pathValue) return `path(evenodd, "${pathValue}")`;
  if (!adjustment?.occlusions?.length) return undefined;

  const outer = roundedRectPath(0, 0, adjustment.width, adjustment.height, radius);
  const holes = adjustment.occlusions.map((occlusion) => {
    if (occlusion.kind === "circle") {
      const rx = occlusion.width / 2;
      const ry = occlusion.height / 2;
      const cx = occlusion.left + rx;
      const cy = occlusion.top + ry;
      return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
    }
    return roundedRectPath(
      occlusion.left,
      occlusion.top,
      occlusion.width,
      occlusion.height,
      occlusion.kind === "rounded-rect" ? (occlusion.radius ?? Math.min(occlusion.width, occlusion.height) / 2) : 0,
    );
  });

  return `path(evenodd, "${[outer, ...holes].join(" ")}")`;
}

function roundedRectPath(left: number, top: number, width: number, height: number, radius: number) {
  const right = left + width;
  const bottom = top + height;
  const r = clamp(radius, 0, Math.min(width, height) / 2);
  if (r === 0) return `M${left} ${top}H${right}V${bottom}H${left}Z`;
  return `M${left + r} ${top}H${right - r}Q${right} ${top} ${right} ${top + r}V${bottom - r}Q${right} ${bottom} ${right - r} ${bottom}H${left + r}Q${left} ${bottom} ${left} ${bottom - r}V${top + r}Q${left} ${top} ${left + r} ${top}Z`;
}

function screenRadiusForDevice(device: Device) {
  if (device.type === "laptop" || device.type === "desktop" || device.type === "tv") return 4;
  if (device.type === "tablet") return 22;
  if (device.id.includes("fold7-unfolded")) return 20;
  return 28;
}

function fitViewportToScreen(viewportSize: Size, screenRect: ScreenRect) {
  const scaleX = screenRect.width / viewportSize.width;
  const scaleY = screenRect.height / viewportSize.height;

  return {
    scaleX,
    scaleY,
    radiusScale: Math.min(scaleX, scaleY),
    width: screenRect.width,
    height: screenRect.height,
    left: screenRect.left,
    top: screenRect.top,
  };
}

function screenRectFromInset(inset: Device["mockupAssets"][number]["screenInset"] | undefined, frameW: number, frameH: number): ScreenRect | null {
  if (!inset) return null;
  return {
    left: inset.left,
    top: inset.top,
    width: Math.max(1, frameW - inset.left - inset.right),
    height: Math.max(1, frameH - inset.top - inset.bottom),
  };
}

function useImageScreenRect(src?: string): ScreenRect | null {
  const [rect, setRect] = useState<ScreenRect | null>(null);

  useEffect(() => {
    if (!src || typeof document === "undefined") {
      setRect(null);
      return;
    }

    let cancelled = false;
    setRect(null);

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (cancelled) return;
      const detected = detectDarkScreenRect(img);
      if (!cancelled) setRect(detected);
    };
    img.onerror = () => {
      if (!cancelled) setRect(null);
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return rect;
}

function detectDarkScreenRect(img: HTMLImageElement): ScreenRect | null {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || canvas.width === 0 || canvas.height === 0) return null;

  context.drawImage(img, 0, 0);
  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
  const rows: number[] = [];
  const cols: number[] = [];

  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = 0; x < width; x++) {
      if (isDarkScreenPixel(data, (y * width + x) * 4)) count++;
    }
    if (count > width * 0.35) rows.push(y);
  }

  for (let x = 0; x < width; x++) {
    let count = 0;
    for (let y = 0; y < height; y++) {
      if (isDarkScreenPixel(data, (y * width + x) * 4)) count++;
    }
    if (count > height * 0.35) cols.push(x);
  }

  const rowRun = largestRun(rows);
  const colRun = largestRun(cols);
  if (!rowRun || !colRun) return null;

  const scale = 0.5;
  return {
    left: colRun.start * scale,
    top: rowRun.start * scale,
    width: (colRun.end - colRun.start) * scale,
    height: (rowRun.end - rowRun.start) * scale,
  };
}

function isDarkScreenPixel(data: Uint8ClampedArray, index: number) {
  return data[index + 3] > 180 && data[index] < 35 && data[index + 1] < 35 && data[index + 2] < 35;
}

function largestRun(values: number[]) {
  if (values.length === 0) return null;

  let bestStart = values[0];
  let bestEnd = values[0] + 1;
  let start = values[0];
  let previous = values[0];

  for (const value of values.slice(1)) {
    if (value === previous + 1) {
      previous = value;
      continue;
    }

    if (previous + 1 - start > bestEnd - bestStart) {
      bestStart = start;
      bestEnd = previous + 1;
    }
    start = value;
    previous = value;
  }

  if (previous + 1 - start > bestEnd - bestStart) {
    bestStart = start;
    bestEnd = previous + 1;
  }

  return { start: bestStart, end: bestEnd };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function DeviceCutout({
  kind,
  platform,
  style,
  viewportSize,
}: {
  kind: string;
  platform: string;
  style: DeviceFrameStyle;
  viewportSize?: Size;
}) {
  if (kind === "iphone-dynamic-island") {
    const configuredCutout = style.imageCutout && viewportSize
      ? resolveImageCutout(style, viewportSize)
      : null;
    const cutout = configuredCutout ?? {
      top: style.cutoutTop ?? 22,
      left: "50%",
      width: style.cutoutWidth ?? 118,
      height: style.cutoutHeight ?? 26,
      transform: "translateX(-50%)",
    };
    return (
      <div
        className="pointer-events-none absolute z-30 rounded-full bg-black shadow-[inset_0_1px_2px_rgba(255,255,255,0.06)]"
        style={cutout}
      >
        <span
          className="absolute rounded-full bg-[radial-gradient(circle_at_46%_42%,#1d36a8_0,#060713_42%,#010101_72%)] ring-[1.5px] ring-[#050505]"
          style={{
            ...resolveImageLens(style, viewportSize, cutout),
          }}
        />
      </div>
    );
  }
  if (kind === "iphone-notch") {
    return (
      <div
        className="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 rounded-b-[18px] bg-black"
        style={{
          top: style.cutoutTop ?? 15,
          width: style.cutoutWidth ?? 138,
          height: style.cutoutHeight ?? 25
        }}
      />
    );
  }
  if (kind === "iphone-classic") {
    return <div className="pointer-events-none absolute left-1/2 top-[12px] z-30 h-[4px] w-[48px] -translate-x-1/2 rounded-full bg-[#222]" />;
  }
  if (platform === "android") {
    return <div className="pointer-events-none absolute left-1/2 top-[12px] z-30 h-[12px] w-[12px] -translate-x-1/2 rounded-full bg-[#080a0f] ring-[1.5px] ring-black/20" />;
  }
  return null;
}

function TabletCamera() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[7px] z-30 flex justify-center">
      <span className="h-[7px] w-[7px] rounded-full bg-[#050505] ring-[1px] ring-white/10" />
    </div>
  );
}

function resolveImageCutout(style: DeviceFrameStyle, viewportSize: Size) {
  const config = style.imageCutout;
  if (!config) return null;
  const width = Math.max(config.minWidth ?? 1, viewportSize.width * config.widthRatio);
  const height = Math.max(config.minHeight ?? 1, viewportSize.height * config.heightRatio);
  const left = config.leftRatio === undefined
    ? (viewportSize.width - width) / 2
    : viewportSize.width * config.leftRatio;

  return {
    top: viewportSize.height * config.topRatio,
    left,
    width,
    height,
    transform: "none",
  };
}

function resolveImageLens(style: DeviceFrameStyle, viewportSize: Size | undefined, cutout: { top: number; left: number | string; width: number; height: number }) {
  const config = style.imageCutout;
  const size = Math.max(7, cutout.height * (config?.lensSizeRatio ?? 0.28));

  if (viewportSize && config?.lensLeftRatio !== undefined && typeof cutout.left === "number") {
    const left = viewportSize.width * config.lensLeftRatio - cutout.left;
    const top = viewportSize.height * (config.lensTopRatio ?? config.topRatio) - cutout.top;
    return {
      left,
      top,
      width: size,
      height: size,
    };
  }

  return {
    top: "50%",
    right: Math.max(8, cutout.width * (config?.lensRightRatio ?? 0.16)),
    width: size,
    height: size,
    transform: "translateY(-50%)",
  };
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
}: {
  platform: string;
  showBattery: boolean;
  compact: boolean;
  dark: boolean;
  imageBackedKind?: "phone" | "tablet";
  height?: number;
  chromeVariant?: ChromeVariant;
  timeInsetLeft?: number;
}) {
  const time = "9:41";
  const h = height ?? (platform === "android" ? 28 : compact ? 28 : 44);
  const px = compact ? 14 : 18;
  const ios = platform === "ios";
  const android = platform === "android";
  const iosImageBackedPhone = ios && imageBackedKind === "phone";
  const iosImageBackedTablet = ios && imageBackedKind === "tablet";
  const androidImageBacked = android && (imageBackedKind === "phone" || imageBackedKind === "tablet");

  // ── Android status strip — a CONSTANT top bar (never scrolls). Holds the clock on the
  //    left and the indicators on the right, aligned to the hole-punch camera row, over a
  //    solid Chrome-coloured background that stays fixed while the page scrolls beneath. ──
  if (androidImageBacked) {
    // The clock/indicators sit in the lower ~26px band so they line up with the camera dot.
    const rowH = 26;
    return (
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex items-end ${
          dark ? "bg-[#111827] text-slate-100" : "bg-white text-slate-900"
        }`}
        style={{ height: h }}
      >
        <div className="flex w-full items-center justify-between" style={{ height: rowH, paddingLeft: px + timeInsetLeft, paddingRight: px }}>
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

  if (iosImageBackedPhone && chromeVariant === "ios-classic") {
    return (
      <div
        data-ios-status-layout="classic"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center bg-black px-1.5 text-[9px] font-semibold leading-none text-white"
        style={{ height: h }}
      >
        <span className="flex min-w-0 items-center gap-1">
          <LegacySignalDots />
          <span>Carrier</span>
        </span>
        <span className="text-[10px]">{time}</span>
        <span className="flex items-center justify-end gap-1">
          {showBattery && <span>100%</span>}
          {showBattery && <BatteryIcon />}
        </span>
      </div>
    );
  }

  if (iosImageBackedPhone) {
    // The time sits to the LEFT of the notch/island and the indicators to the RIGHT,
    // both vertically centered on the island band (roughly the lower half of the safe area).
    const islandBand = Math.min(h, 44);
    return (
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-end bg-transparent font-semibold text-white"
        style={{ height: h }}
      >
        <div className="flex w-full items-center" style={{ height: islandBand }}>
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
          ? "bg-transparent text-slate-950"
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

function SafariBar({
  hostname,
  compact,
  dark,
  scrollProgress = 0,
  variant = "ios-modern",
  safeAreaInsetBottom = 0,
}: {
  hostname: string;
  compact: boolean;
  dark: boolean;
  scrollProgress?: number;
  variant?: ChromeVariant;
  safeAreaInsetBottom?: number;
}) {
  // safeAreaInsetBottom is in device px (baked at 90 for iOS 26). Scale it down to the
  // on-screen chrome footprint so the floating bar clears the home-indicator zone.
  const safeGap = variant === "ios-liquid-glass" ? Math.round(Math.min(24, safeAreaInsetBottom * 0.22)) : 0;

  // ── iOS 26 Liquid Glass — a single translucent floating pill, no bottom tab strip ──
  // (Static — no scroll collapse, so the page never reflows / jumps while scrolling.)
  if (variant === "ios-liquid-glass") {
    const barH = compact ? 40 : 46;
    return (
      <div
        className="pointer-events-none absolute inset-x-0 z-20 flex justify-center"
        style={{ bottom: 10 + safeGap }}
      >
        <div
          className={`flex items-center gap-2 rounded-full px-4 font-medium shadow-[0_8px_24px_rgba(0,0,0,0.18)] ring-1 backdrop-blur-2xl ${
            dark
              ? "bg-white/12 text-slate-100 ring-white/15"
              : "bg-white/55 text-slate-700 ring-black/5"
          }`}
          style={{
            height: barH,
            width: "82%",
            fontSize: compact ? 12 : 14,
            // Liquid Glass sheen
            backgroundImage: dark
              ? "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))"
              : "linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0.30))",
          }}
        >
          <ChevronLeft size={16} className={dark ? "text-slate-200" : "text-slate-500"} />
          <Lock size={11} className={`shrink-0 ${dark ? "text-slate-300" : "text-slate-500"}`} />
          <span className="min-w-0 flex-1 truncate text-center">{hostname}</span>
          <RefreshCw size={14} className={`shrink-0 ${dark ? "text-slate-200" : "text-slate-500"}`} />
        </div>
      </div>
    );
  }

  // ── iOS 15–18 modern + iOS ≤14 classic — real Safari bottom chrome: one contiguous
  //    frosted bar with the address pill and the toolbar icon row below it. (Static.) ──
  const searchH = compact ? 36 : 40;
  const toolbarH = compact ? 30 : 36;
  const radius = variant === "ios-classic" ? 9 : 11;
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
          style={{ height: compact ? 28 : 32, borderRadius: radius, fontSize: compact ? 11 : 13 }}
        >
          <span className={`text-[13px] font-semibold ${dark ? "text-slate-300" : "text-slate-500"}`}>AA</span>
          <Lock size={10} className={`shrink-0 ${dark ? "text-slate-300" : "text-slate-500"}`} />
          <span className="min-w-0 flex-1 truncate text-center">{hostname}</span>
          <RefreshCw size={12} className={`shrink-0 ${dark ? "text-slate-300" : "text-slate-500"}`} />
        </div>
      </div>
      {/* Toolbar icon row */}
      <div
        className={`flex items-center justify-around ${
          dark ? "text-sky-400" : "text-[#007AFF]"
        }`}
        style={{ height: toolbarH }}
      >
        <ChevronLeft size={19} />
        <ChevronRight size={19} className={dark ? "text-slate-600" : "text-slate-300"} />
        <Share size={17} />
        <BookOpen size={18} />
        <Copy size={17} />
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
      <ChevronLeft size={14} className="shrink-0" />
      <ChevronRight size={14} className={`shrink-0 ${dark ? "text-slate-600" : "text-slate-300"}`} />
      <RefreshCw size={12} className="mx-0.5 shrink-0" />
      <span
        className={`mx-1 flex min-w-0 flex-1 items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold shadow-inner ${
          dark ? "bg-white/10 text-slate-300" : "bg-white text-slate-500"
        }`}
      >
        <Lock size={10} className="shrink-0" />
        <span className="truncate">{hostname}</span>
      </span>
      <MoreVertical size={14} className="shrink-0" />
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
      <ChevronLeft size={22} />
      <ChevronRight size={22} className={dark ? "text-slate-500" : "text-slate-300"} />
      <BookOpen size={22} />
      <span
        className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-semibold ${
          dark ? "bg-white/10 text-slate-200" : "bg-[#e5e5e7] text-slate-700"
        }`}
      >
        <span className={dark ? "text-slate-200" : "text-slate-900"}>AA</span>
        <Lock size={12} />
        <span className="truncate">{hostname}</span>
        <RefreshCw size={14} />
      </span>
      <Share size={22} />
      <Plus size={22} />
      <Copy size={22} />
    </div>
  );
}

function AndroidAddrBar({
  hostname,
  dark,
  top = false,
  topOffset = 0,
}: {
  hostname: string;
  dark: boolean;
  top?: boolean;
  topOffset?: number;
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
        style={{ top: topOffset }}
      >
        <Home size={17} className={`shrink-0 ${dark ? "text-slate-100" : "text-slate-800"}`} />
        <span className={`min-w-0 flex-1 truncate rounded-full px-3 py-1.5 ${dark ? "bg-white/10" : "bg-slate-100"}`}>{hostname}</span>
        <MoreVertical size={16} className={`shrink-0 ${dark ? "text-slate-100" : "text-slate-800"}`} />
      </div>
    );
  }
  // Bottom gesture navigation pill — stays constant (Android keeps nav visible).
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-6 ${dark ? "bg-[#111827]/95" : "bg-white/95"}`}
      style={{ height: 36 }}
    >
      <span className="grid h-4 w-4 place-items-center"><span className={`h-2 w-2 rounded-full border-[1.5px] ${dark ? "border-slate-100" : "border-slate-800"}`} /></span>
      <span className={`h-[3px] w-14 rounded-full ${dark ? "bg-slate-100" : "bg-slate-800"}`} />
      <Square size={12} strokeWidth={2} className={dark ? "text-slate-100" : "text-slate-800"} />
    </div>
  );
}

function HomeIndicator({
  variant = "ios-modern",
  safeAreaInsetBottom = 0,
}: {
  variant?: ChromeVariant;
  safeAreaInsetBottom?: number;
} = {}) {
  // On iOS 26 the home indicator sits within the Liquid Glass safe area, slightly higher.
  const bottom = variant === "ios-liquid-glass" ? Math.max(6, Math.round(Math.min(12, safeAreaInsetBottom * 0.1))) : 6;
  return (
    <div className="pointer-events-none absolute inset-x-0 z-30 flex justify-center" style={{ bottom }}>
      <span className="h-[4px] w-28 rounded-full bg-black/25" />
    </div>
  );
}

function SideButtons({ platform, kind, color }: { platform: string; kind: string; color?: string }) {
  if (platform === "desktop" || kind === "watch") return null;
  const btnStyle = { backgroundColor: color ?? (platform === "ios" ? "#8a7d60" : "#2c333d") };
  return (
    <>
      <div className="absolute -left-[3px] top-[20%] h-9 w-[3px] rounded-l" style={btnStyle} />
      <div className="absolute -left-[3px] top-[30%] h-14 w-[3px] rounded-l" style={btnStyle} />
      {kind !== "android-fold" && (
        <div className="absolute -right-[3px] top-[28%] h-20 w-[3px] rounded-r" style={btnStyle} />
      )}
    </>
  );
}

export function getStatusHeight(platform: string, kind: string, compact: boolean) {
  if (platform === "android") return 28;
  if (kind === "iphone-classic") return 20;
  if (compact) return 28;
  if (kind === "iphone-notch") return 44;
  return 54;
}

export function getMobileContentTop(statusHeight: number, addressHeight: number) {
  return Math.max(0, statusHeight) + Math.max(0, addressHeight);
}

function getBottomHeight(platform: string, compact: boolean) {
  if (platform === "android") return 36;
  if (compact) return 62;
  return 112;
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
