import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Copy, BookOpen, Lock, RefreshCw, Share, Square, Home, MoreVertical } from "lucide-react";
import type { Device, Orientation, Size } from "../../domain/device/device.types";
import { getFrameProfile } from "../../domain/device/frame-profiles";

interface FrameSizeInput {
  device: Device;
  showFrame: boolean;
  showStatusBar: boolean;
  showUrlBar: boolean;
  viewportSize: Size;
}

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
  const bottomH = showUrlBar && profile.platform !== "ios" ? getBottomHeight(profile.platform, compact) : 0;

  // ── No frame ──────────────────────────────────────────────────────────────
  if (!showFrame) {
    return (
      <div className={`overflow-hidden rounded-[10px] border shadow-sm ${darkMode ? "border-white/10 bg-[#0f172a]" : "border-slate-200 bg-white"}`}>
        {children}
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
    const screenH = viewportSize.height + statusH + addrH + bottomH;
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
                height: viewportSize.height,
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
  const screenH = viewportSize.height + statusH + addrH + bottomH;
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
              height: viewportSize.height,
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
  const bottomH = showUrlBar && profile.platform !== "ios" ? getBottomHeight(profile.platform, compact) : 0;

  const isTablet = profile.kind === "tablet";
  const shellP = profile.style.shellPadding ?? profile.shellPadding;
  const innerP = profile.style.innerPadding ?? (isTablet ? 10 : 6);
  const chrome = (shellP + innerP) * 2;

  return {
    width: viewportSize.width + chrome,
    height: viewportSize.height + statusH + addrH + bottomH + chrome,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

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

function StatusBar({ platform, showBattery, compact, dark }: { platform: string; showBattery: boolean; compact: boolean; dark: boolean }) {
  const time = platform === "android" ? "9:41" : "9:41";
  const h = platform === "android" ? 28 : compact ? 28 : 44;
  const px = compact ? 14 : 18;
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between font-black text-[11px] ${
        dark ? "bg-[#0f172a]/90 text-slate-100" : "bg-white/90 text-slate-900"
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
  const barH = compact ? 34 : 42;
  const tabH = compact ? 28 : 36;
  return (
    <>
      <div
        className={`pointer-events-none absolute inset-x-3 z-20 flex items-center gap-2 rounded-[12px] border px-3 font-medium shadow-sm backdrop-blur-xl ${
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
  return 44;
}

function getBottomHeight(platform: string, compact: boolean) {
  if (platform === "android") return 36;
  if (compact) return 62;
  return 90;
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
