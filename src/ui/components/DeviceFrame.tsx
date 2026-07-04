import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Copy, BookOpen, Lock, Plus, RefreshCw, Share, Square, Home, MoreVertical } from "lucide-react";
import type { Device, Orientation, Size } from "../../domain/device/device.types";
import { getFrameProfile } from "../../domain/device/frame-profiles";

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

const PHONE_SCREEN_INSET_X_RATIO = 0.2912;
const PHONE_SCREEN_INSET_Y_RATIO = 0.2862;

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
}) {
  const profile = getFrameProfile(device);
  const hostname = safeHostname(url);
  const landscape = orientation === "landscape";
  const compact = landscape || profile.kind === "iphone-classic" || profile.kind === "tablet";
  const shellP = profile.style.shellPadding ?? profile.shellPadding;
  const innerP = profile.style.innerPadding ?? 0;
  const contentR = profile.style.contentRadius ?? profile.contentRadius;

  const statusH = showStatusBar ? getStatusHeight(profile.platform, profile.kind, compact) : 0;
  const addrH = showUrlBar && profile.platform === "android" ? 48 : 0;
  const bottomH = showUrlBar ? getBottomHeight(profile.platform, compact) : 0;
  const contentH = Math.max(120, viewportSize.height - statusH - addrH - bottomH);
  const imageFrame = device.mockupAssets.find((asset) => asset.kind === "transparent-png" && asset.localPath && asset.width && asset.height);
  const measuredScreenRect = useImageScreenRect(imageFrame?.screenInset ? undefined : imageFrame?.localPath);

  // ── No frame ──────────────────────────────────────────────────────────────
  if (!showFrame) {
    return (
      <div
        className={`overflow-hidden rounded-[10px] border shadow-sm ${darkMode ? "border-white/10 bg-[#0f172a]" : "border-slate-200 bg-white"}`}
        style={{ width: viewportSize.width, height: viewportSize.height }}
      >
        {children}
      </div>
    );
  }

  if (imageFrame?.localPath && imageFrame.width && imageFrame.height) {
    const frameW = imageFrame.width / 2;
    const frameH = imageFrame.height / 2;
    const catalogScreenRect = screenRectFromInset(imageFrame.screenInset, frameW, frameH);
    const resolvedMeasuredScreenRect = catalogScreenRect ?? measuredScreenRect;
    const waitForMeasuredScreen = requiresMeasuredImageScreenRect(device) && !resolvedMeasuredScreenRect;
    const screenRect = getImageFrameScreenRect(device, viewportSize, frameW, frameH, resolvedMeasuredScreenRect);
    const screenFit = fitViewportToScreen(viewportSize, screenRect);
    const mobileChrome = imageBackedMobileChrome(device);
    const imageStatusH = mobileChrome.showStatusBar && showStatusBar ? statusH : 0;
    const imageAddrH = mobileChrome.showAndroidTopBar && showUrlBar ? addrH : 0;
    const imageBottomH = mobileChrome.showBottomBar && showUrlBar ? bottomH : 0;
    const screenRadius =
      device.type === "laptop" || device.type === "desktop" || device.type === "tv"
        ? 8
        : profile.kind === "tablet"
          ? contentR
          : Math.max(16, contentR);
    const desktopToolbarH = showUrlBar && (device.type === "laptop" || device.type === "desktop") ? 36 : 0;
    const useSafariDesktopChrome = showUrlBar && isAppleDesktopDevice(device);
    const imageContentH =
      device.type === "laptop" || device.type === "desktop" || device.type === "tv"
        ? Math.max(120, viewportSize.height - (useSafariDesktopChrome ? 56 : desktopToolbarH))
        : Math.max(120, viewportSize.height - imageStatusH - imageAddrH - imageBottomH);

    return (
      <div
        className="relative shrink-0"
        style={{ width: frameW, height: frameH }}
      >
        <img
          src={imageFrame.localPath}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
        />
        {!waitForMeasuredScreen && (
          <div
            className="absolute overflow-hidden"
            style={{
              left: screenFit.left,
              top: screenFit.top,
              width: screenFit.width,
              height: screenFit.height,
              borderRadius: Math.max(4, (landscape ? Math.max(10, screenRadius - 6) : screenRadius) * screenFit.radiusScale),
              backgroundColor: device.type === "phone" && profile.platform === "ios"
                ? "#ffffff"
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
                      imageBacked
                    />
                  )}
                  {mobileChrome.showAndroidTopBar && showUrlBar && <AndroidAddrBar hostname={hostname} dark={darkMode} top topOffset={imageStatusH} />}
                  {mobileChrome.showCutout && <DeviceCutout kind={profile.kind} platform={profile.platform} style={profile.style} />}
                  <div
                    style={{
                      width: viewportSize.width,
                      height: imageContentH,
                      marginTop: imageStatusH + imageAddrH,
                      marginBottom: imageBottomH,
                    }}
                  >
                    {children}
                  </div>
                  {mobileChrome.showSafariBar && showUrlBar && <SafariBar hostname={hostname} compact={compact} dark={darkMode} />}
                  {mobileChrome.showAndroidBottomBar && showUrlBar && <AndroidAddrBar hostname={hostname} dark={darkMode} />}
                  {mobileChrome.showHomeIndicator && <HomeIndicator />}
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
            {showStatusBar && <StatusBar platform={profile.platform} showBattery={showBattery} compact={compact} dark={darkMode} />}
            {showUrlBar && profile.platform === "android" && <AndroidAddrBar hostname={hostname} dark={darkMode} top topOffset={statusH} />}
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
            {showUrlBar && isIos && <SafariBar hostname={hostname} compact={compact} dark={darkMode} />}
            {showUrlBar && profile.platform === "android" && <AndroidAddrBar hostname={hostname} dark={darkMode} />}
            {isIos && <HomeIndicator />}
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
          {showStatusBar && <StatusBar platform={profile.platform} showBattery={showBattery} compact={compact} dark={darkMode} />}
          {showUrlBar && profile.platform === "android" && <AndroidAddrBar hostname={hostname} dark={darkMode} top topOffset={statusH} />}
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
          {showUrlBar && isIos && <SafariBar hostname={hostname} compact={compact} dark={darkMode} />}
          {showUrlBar && profile.platform === "android" && <AndroidAddrBar hostname={hostname} dark={darkMode} />}
          {isIos && <HomeIndicator />}
        </div>
      </div>
    </div>
  );
}

// ─── estimateDeviceFrameSize ─────────────────────────────────────────────────
export function estimateDeviceFrameSize({ device, showFrame, showStatusBar, showUrlBar, viewportSize }: FrameSizeInput): Size {
  if (!showFrame) return viewportSize;

  const profile = getFrameProfile(device);
  const imageFrame = device.mockupAssets.find((asset) => asset.kind === "transparent-png" && asset.width && asset.height);
  if (imageFrame?.width && imageFrame.height) {
    return {
      width: imageFrame.width / 2,
      height: imageFrame.height / 2,
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
  device: Device,
  viewportSize: Size,
  frameW: number,
  frameH: number,
  measuredScreenRect: ScreenRect | null
): ScreenRect {
  const extraW = Math.max(0, frameW - viewportSize.width);
  const extraH = Math.max(0, frameH - viewportSize.height);

  if (device.type === "phone") {
    if (!/ios/i.test(device.os) && measuredScreenRect) return measuredScreenRect;

    // Phone PNGs include curved glass and camera hardware in the dark pixel area.
    // For iPhones, use the calibrated viewport placement so the page surface
    // stays inside the frame instead of covering the gold/black hardware edge.
    const left = clamp(extraW * PHONE_SCREEN_INSET_X_RATIO, 0, extraW);
    const top = clamp(extraH * PHONE_SCREEN_INSET_Y_RATIO, 0, extraH);
    return {
      left,
      top,
      width: Math.min(viewportSize.width, frameW - left),
      height: Math.min(viewportSize.height, frameH - top),
    };
  }

  if (device.type === "laptop" && measuredScreenRect) {
    return laptopScreenRect(device, measuredScreenRect);
  }

  if (measuredScreenRect) return measuredScreenRect;

  return {
    left: extraW / 2,
    top: extraH / 2,
    width: viewportSize.width,
    height: viewportSize.height,
  };
}

function laptopScreenRect(device: Device, measured: ScreenRect): ScreenRect {
  if (device.id.includes("macbook-air")) {
    return {
      left: measured.left,
      top: measured.top + 74,
      width: measured.width,
      height: Math.max(120, measured.height - 148),
    };
  }

  if (device.id.includes("macbook-pro")) {
    return {
      left: measured.left + 8,
      top: measured.top + 68,
      width: Math.max(120, measured.width - 16),
      height: Math.max(120, measured.height - 136),
    };
  }

  return {
    left: measured.left + 8,
    top: measured.top + 32,
    width: Math.max(120, measured.width - 16),
    height: Math.max(120, measured.height - 96),
  };
}

function fitViewportToScreen(viewportSize: Size, screenRect: ScreenRect) {
  const scale = Math.min(
    screenRect.width / viewportSize.width,
    screenRect.height / viewportSize.height,
  );
  const fittedWidth = viewportSize.width * scale;
  const fittedHeight = viewportSize.height * scale;

  return {
    scaleX: scale,
    scaleY: scale,
    radiusScale: scale,
    width: fittedWidth,
    height: fittedHeight,
    left: screenRect.left + (screenRect.width - fittedWidth) / 2,
    top: screenRect.top + (screenRect.height - fittedHeight) / 2,
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

function DeviceCutout({ kind, platform, style }: { kind: string; platform: string; style: { cutoutTop?: number; cutoutWidth?: number; cutoutHeight?: number } }) {
  if (kind === "iphone-dynamic-island") {
    const width = style.cutoutWidth ?? 118;
    const height = style.cutoutHeight ?? 26;
    return (
      <div
        className="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 rounded-full bg-black shadow-[inset_0_1px_2px_rgba(255,255,255,0.06)]"
        style={{ top: style.cutoutTop ?? 22, width, height }}
      >
        <span className="absolute right-[16px] top-1/2 h-[8px] w-[8px] -translate-y-1/2 rounded-full bg-[#111] ring-[1.5px] ring-[#050505]" />
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

function StatusBar({ platform, showBattery, compact, dark, imageBacked = false }: { platform: string; showBattery: boolean; compact: boolean; dark: boolean; imageBacked?: boolean }) {
  const time = platform === "android" ? "9:41" : "9:41";
  const h = platform === "android" ? 28 : compact ? 28 : 44;
  const px = compact ? 14 : 18;
  const ios = platform === "ios";
  const iosImageBacked = ios && imageBacked;
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between font-black text-[11px] ${
        iosImageBacked
          ? "bg-black text-white"
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

function SafariBar({ hostname, compact, dark }: { hostname: string; compact: boolean; dark: boolean }) {
  const barH = compact ? 34 : 38;
  const tabH = compact ? 28 : 34;
  return (
    <>
      <div
        className={`pointer-events-none absolute inset-x-3 z-20 flex items-center gap-2 rounded-[10px] border px-3 font-medium shadow-sm backdrop-blur-xl ${
          dark ? "border-white/10 bg-[#1f2937]/82 text-slate-200" : "border-slate-200/80 bg-[#f1f2f5]/82 text-slate-600"
        }`}
        style={{ bottom: tabH + 8, height: barH, fontSize: compact ? 11 : 13 }}
      >
        <Lock size={10} className={`shrink-0 ${dark ? "text-slate-200" : "text-slate-700"}`} />
        <span className="min-w-0 flex-1 truncate">{hostname}</span>
        <RefreshCw size={12} className={`shrink-0 ${dark ? "text-slate-200" : "text-slate-700"}`} />
      </div>
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-around ${
          dark ? "bg-[#111827]/82 text-sky-300" : "bg-white/82 text-[#007AFF]"
        }`}
        style={{ height: tabH }}
      >
        <ChevronLeft size={17} />
        <ChevronRight size={17} className="text-slate-300" />
        <Share size={16} />
        <BookOpen size={17} />
        <Copy size={16} />
      </div>
    </>
  );
}

function DesktopBar({ hostname, dark }: { hostname: string; dark: boolean }) {
  return (
    <div className={`flex h-9 items-center gap-2 border-b px-3 ${dark ? "border-white/10 bg-[#111827]" : "border-slate-200 bg-[#f3f4f6]"}`}>
      <span className="flex gap-1.5">
        <span className="h-3 w-3 rounded-full bg-[#ff605c]" />
        <span className="h-3 w-3 rounded-full bg-[#ffbd44]" />
        <span className="h-3 w-3 rounded-full bg-[#00ca4e]" />
      </span>
      <span className={`min-w-0 flex-1 truncate rounded-md px-3 py-1 text-[11px] font-semibold shadow-inner ${dark ? "bg-white/10 text-slate-300" : "bg-white text-slate-500"}`}>
        {hostname}
      </span>
    </div>
  );
}

function SafariDesktopBar({ hostname, dark }: { hostname: string; dark: boolean }) {
  return (
    <div
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

function AndroidAddrBar({ hostname, dark, top = false, topOffset = 0 }: { hostname: string; dark: boolean; top?: boolean; topOffset?: number }) {
  if (top) {
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
  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 flex h-9 items-center justify-center gap-6 ${dark ? "bg-[#111827]/95" : "bg-white/95"}`}>
      <span className="grid h-4 w-4 place-items-center"><span className={`h-2 w-2 rounded-full border-[1.5px] ${dark ? "border-slate-100" : "border-slate-800"}`} /></span>
      <span className={`h-[3px] w-14 rounded-full ${dark ? "bg-slate-100" : "bg-slate-800"}`} />
      <Square size={12} strokeWidth={2} className={dark ? "text-slate-100" : "text-slate-800"} />
    </div>
  );
}

function HomeIndicator() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[6px] z-30 flex justify-center">
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

function getStatusHeight(platform: string, kind: string, compact: boolean) {
  if (platform === "android") return 28;
  if (kind === "iphone-classic" || compact) return 28;
  return 54;
}

function getBottomHeight(platform: string, compact: boolean) {
  if (platform === "android") return 36;
  if (compact) return 62;
  return 112;
}

function SignalIcon() {
  return (
    <span className="flex h-3 items-end gap-[2px]">
      <i className="block h-[4px] w-[3px] rounded-[1px] bg-current" />
      <i className="block h-[6px] w-[3px] rounded-[1px] bg-current" />
      <i className="block h-[9px] w-[3px] rounded-[1px] bg-current" />
    </span>
  );
}

function WifiIcon() {
  return <span className="block h-[9px] w-[12px] rounded-full border-[1.5px] border-current border-b-transparent" style={{ transform: "rotate(-45deg)" }} />;
}

function BatteryIcon() {
  return (
    <span className="relative flex h-[10px] w-[18px] items-center rounded-[2px] border-[1.5px] border-current">
      <span className="absolute -right-[3px] h-[4px] w-[2px] rounded-r bg-current" />
      <span className="ml-[1px] h-[5px] w-[11px] rounded-[1px] bg-current" />
    </span>
  );
}

function safeHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function isAppleDesktopDevice(device: Device) {
  return device.brand.toLowerCase() === "apple" && (device.type === "laptop" || device.type === "desktop");
}

function requiresMeasuredImageScreenRect(device: Device) {
  return device.type !== "phone";
}

function imageBackedMobileChrome(device: Device) {
  const isIos = /ios|ipados/i.test(device.os);
  const isAndroid = /android/i.test(device.os);
  const isSpecial = device.tags.includes("special") || device.type === "custom" || device.type === "watch" || device.type === "tv";
  const isHandheldSpecial = device.brand === "Zebra" && device.id.includes("tc");

  if (isSpecial && !isHandheldSpecial) {
    return {
      showStatusBar: false,
      showAndroidTopBar: false,
      showBottomBar: false,
      showCutout: false,
      showSafariBar: false,
      showAndroidBottomBar: false,
      showHomeIndicator: false,
    };
  }

  return {
    showStatusBar: isIos || isAndroid,
    showAndroidTopBar: isAndroid,
    showBottomBar: isIos || isAndroid,
    showCutout: isIos,
    showSafariBar: isIos,
    showAndroidBottomBar: isAndroid,
    showHomeIndicator: isIos,
  };
}
