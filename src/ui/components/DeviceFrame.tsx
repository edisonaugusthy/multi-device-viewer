import type { ReactNode } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Copy, Home, Lock, MoreVertical, RefreshCw, Share, Square } from "lucide-react";
import type { Device, Orientation, Size } from "../../domain/device/device.types";
import { getFrameProfile } from "../../domain/device/frame-profiles";

export function DeviceFrame({
  device,
  children,
  showFrame,
  showStatusBar,
  showBattery,
  showUrlBar,
  url,
  viewportSize,
  orientation
}: {
  device: Device;
  children: ReactNode;
  showFrame: boolean;
  showStatusBar: boolean;
  showBattery: boolean;
  showUrlBar: boolean;
  url: string;
  viewportSize: Size;
  orientation: Orientation;
}) {
  const profile = getFrameProfile(device);
  const hostname = safeHostname(url);
  const landscape = orientation === "landscape";
  const topInset = showStatusBar ? statusHeight(profile.platform, profile.kind) : 0;
  const topBrowserInset = showUrlBar && profile.platform === "android" ? androidAddressHeight(profile.kind) : 0;
  const bottomInset = showUrlBar ? bottomChromeHeight(profile.platform, profile.kind) : 0;
  const screenHeight = viewportSize.height + topInset + topBrowserInset + bottomInset;

  if (!showFrame) {
    return <div className="overflow-hidden rounded-[10px] border border-slate-300 bg-white">{children}</div>;
  }

  if (profile.kind === "desktop") {
    return (
      <div className="relative rounded-[20px] bg-[#202226] p-[10px] shadow-[0_26px_70px_rgb(15_23_42/0.24)] ring-1 ring-black/25">
        <div className="overflow-hidden rounded-[12px] bg-white">
          <div className="flex h-9 items-center gap-2 border-b border-slate-200 bg-[#f5f6f8] px-3">
            <span className="h-3 w-3 rounded-full bg-[#ff605c]" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd44]" />
            <span className="h-3 w-3 rounded-full bg-[#00ca4e]" />
            {showUrlBar && <span className="ml-3 min-w-0 flex-1 truncate rounded-md bg-white px-3 py-1 text-[12px] font-semibold text-slate-500">{hostname}</span>}
          </div>
          <div>{children}</div>
        </div>
      </div>
    );
  }

  if (profile.kind === "watch") {
    return (
      <div className="relative rounded-[46px] bg-[#202124] p-[8px] shadow-[0_24px_58px_rgb(15_23_42/0.2)] ring-1 ring-black/30">
        <div className="absolute -right-[6px] top-[35%] h-12 w-[5px] rounded-r bg-[#202124]" />
        <div className="overflow-hidden rounded-[35px] bg-black">
          <div>{children}</div>
        </div>
      </div>
    );
  }

  const shellClass =
    profile.platform === "ios"
      ? "bg-gradient-to-br from-[#cabd9c] via-[#141414] to-[#f3ead5]"
      : profile.kind === "android-fold"
        ? "bg-gradient-to-br from-[#1b1f24] via-[#0b0d10] to-[#3a4048]"
        : "bg-gradient-to-br from-[#313845] via-[#11151b] to-[#68707c]";

  return (
    <div
      className={`relative ${shellClass} shadow-[0_28px_84px_rgb(15_23_42/0.23)] ring-1 ring-black/20`}
      style={{ borderRadius: profile.radius, padding: profile.shellPadding }}
    >
      <SideButtons platform={profile.platform} kind={profile.kind} />
      <div className="relative overflow-hidden bg-black" style={{ borderRadius: Math.max(16, profile.radius - 6), padding: profile.platform === "ios" ? 8 : 6 }}>
        <DeviceCutout kind={profile.kind} platform={profile.platform} />
        <div className="relative overflow-hidden bg-white" style={{ borderRadius: landscape ? Math.max(16, profile.contentRadius - 8) : profile.contentRadius }}>
          {showStatusBar && <StatusBar platform={profile.platform} showBattery={showBattery} compact={landscape || profile.kind === "iphone-classic"} />}
          {showUrlBar && profile.platform === "android" && <AndroidBrowserBar hostname={hostname} top />}
          <div
            className="relative overflow-hidden bg-white"
            style={{
              width: viewportSize.width,
              height: screenHeight,
              paddingTop: topInset + topBrowserInset,
              paddingBottom: bottomInset
            }}
          >
            <div style={{ width: viewportSize.width, height: viewportSize.height }}>{children}</div>
          </div>
          {showUrlBar && profile.platform === "ios" && <SafariBar hostname={hostname} compact={landscape || profile.kind === "iphone-classic"} />}
          {showUrlBar && profile.platform === "android" && <AndroidBrowserBar hostname={hostname} />}
          <HomeIndicator platform={profile.platform} />
        </div>
      </div>
    </div>
  );
}

function DeviceCutout({ kind, platform }: { kind: string; platform: string }) {
  if (kind === "iphone-dynamic-island") {
    return (
      <div className="pointer-events-none absolute left-1/2 top-[18px] z-30 h-[32px] w-[126px] -translate-x-1/2 rounded-full bg-black shadow-inner">
        <span className="absolute right-[18px] top-1/2 h-[10px] w-[10px] -translate-y-1/2 rounded-full bg-[#10172a] ring-2 ring-[#0b1020]" />
      </div>
    );
  }

  if (kind === "iphone-notch") {
    return <div className="pointer-events-none absolute left-1/2 top-[8px] z-30 h-[31px] w-[152px] -translate-x-1/2 rounded-b-[20px] bg-black" />;
  }

  if (kind === "iphone-classic") {
    return <div className="pointer-events-none absolute left-1/2 top-[14px] z-30 h-[5px] w-[56px] -translate-x-1/2 rounded-full bg-[#222]" />;
  }

  if (platform === "android") {
    return <div className="pointer-events-none absolute left-1/2 top-[14px] z-30 h-[13px] w-[13px] -translate-x-1/2 rounded-full bg-[#080a0f] ring-2 ring-black/15" />;
  }

  return null;
}

function StatusBar({ platform, showBattery, compact }: { platform: string; showBattery: boolean; compact: boolean }) {
  const time = platform === "android" ? "9:41" : "6:28 PM";
  const statusClass = platform === "android" ? "h-8 px-7 text-[12px]" : compact ? "h-8 px-10 text-[12px]" : "h-[48px] px-12 text-[13px]";
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-white/94 to-white/58 font-black text-slate-950 ${statusClass}`}
    >
      <span>{time}</span>
      <span className="flex max-w-[92px] items-center justify-end gap-1.5 overflow-hidden">
        <SignalIcon />
        <WifiIcon />
        {showBattery && <BatteryIcon />}
      </span>
    </div>
  );
}

function SafariBar({ hostname, compact }: { hostname: string; compact: boolean }) {
  return (
    <>
      <div className={`pointer-events-none absolute inset-x-4 z-20 flex items-center gap-3 rounded-[14px] border border-white/70 bg-[#f1f2f5]/86 px-4 font-semibold text-slate-600 shadow-sm backdrop-blur-xl ${compact ? "bottom-8 h-9 text-[12px]" : "bottom-12 h-12 text-[14px]"}`}>
        <span className="text-[17px]">Aa</span>
        <Lock size={13} className="shrink-0 text-slate-900" />
        <span className="min-w-0 flex-1 truncate">{hostname}</span>
        <RefreshCw size={18} className="shrink-0 text-slate-900" />
      </div>
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-around bg-white/96 text-[#3578ff] ${compact ? "h-8" : "h-11"}`}>
        <ChevronLeft size={22} />
        <ChevronRight size={22} className="text-slate-300" />
        <Share size={21} />
        <BookOpen size={22} />
        <Copy size={21} />
      </div>
    </>
  );
}

function AndroidBrowserBar({ hostname, top = false }: { hostname: string; top?: boolean }) {
  if (top) {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-[30px] z-20 flex h-12 items-center gap-2 border-b border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600">
        <Home size={20} className="shrink-0 text-slate-950" />
        <span className="min-w-0 flex-1 truncate rounded-full bg-slate-100 px-3 py-2">{hostname}</span>
        <MoreVertical size={19} className="shrink-0 text-slate-950" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex h-9 items-center justify-center gap-8 bg-white/96 text-slate-950">
      <span className="grid h-5 w-5 place-items-center"><span className="h-2.5 w-2.5 rounded-full border-2 border-slate-900" /></span>
      <span className="h-1 w-16 rounded-full bg-slate-900" />
      <Square size={14} className="text-slate-900" />
    </div>
  );
}

function HomeIndicator({ platform }: { platform: string }) {
  if (platform !== "ios") return null;
  return <div className="pointer-events-none absolute inset-x-0 bottom-2 z-30 flex justify-center"><span className="h-1 w-32 rounded-full bg-black" /></div>;
}

function SideButtons({ platform, kind }: { platform: string; kind: string }) {
  if (platform === "desktop" || platform === "watch") return null;
  const button = platform === "ios" ? "bg-[#8d826d]" : "bg-[#2d333c]";
  return (
    <>
      <div className={`absolute -left-[4px] top-[22%] h-11 w-[4px] rounded-l ${button}`} />
      <div className={`absolute -left-[4px] top-[31%] h-16 w-[4px] rounded-l ${button}`} />
      {kind !== "android-fold" && <div className={`absolute -right-[4px] top-[30%] h-24 w-[4px] rounded-r ${button}`} />}
    </>
  );
}

function SignalIcon() {
  return (
    <span className="flex h-4 items-end gap-[2px]">
      <i className="block h-1.5 w-1 rounded-sm bg-slate-950" />
      <i className="block h-2.5 w-1 rounded-sm bg-slate-950" />
      <i className="block h-3.5 w-1 rounded-sm bg-slate-950" />
    </span>
  );
}

function WifiIcon() {
  return <span className="h-3 w-4 rounded-full border-[2px] border-slate-950 border-t-transparent" />;
}

function BatteryIcon() {
  return <span className="h-[11px] w-[22px] rounded-[3px] border-2 border-slate-950 after:ml-[20px] after:mt-[2px] after:block after:h-[5px] after:w-[2px] after:rounded after:bg-slate-950" />;
}

function statusHeight(platform: string, kind: string) {
  if (platform === "android") return 32;
  if (kind === "iphone-classic") return 32;
  return 48;
}

function bottomChromeHeight(platform: string, kind: string) {
  if (platform === "android") return 42;
  if (kind === "iphone-classic") return 76;
  return 104;
}

function androidAddressHeight(kind: string) {
  return kind === "android-fold" ? 50 : 48;
}

function safeHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
