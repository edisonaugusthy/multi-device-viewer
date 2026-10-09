import type { ReactNode, SVGProps } from "react";

// Icons drawn for the viewer design. Each is a 24×24 stroke icon that inherits
// currentColor, so color and size come from the surrounding Tailwind classes.
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  size?: number;
  strokeWidth?: number;
}

function Icon({ size = 16, strokeWidth = 2, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

const icon = (paths: ReactNode, defaults: Partial<IconProps> = {}) =>
  function ViewerIcon(props: IconProps) {
    return <Icon {...defaults} {...props}>{paths}</Icon>;
  };

export const WorkspaceIcon = icon(<><rect x="2" y="4" width="8" height="15" rx="2" /><rect x="12" y="7" width="10" height="12" rx="1.5" /></>);
export const GridIcon = icon(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>);
export const PlusIcon = icon(<path d="M12 5v14M5 12h14" />, { strokeWidth: 2.2 });
export const MinusIcon = icon(<path d="M5 12h14" />, { strokeWidth: 2.4 });
export const CloseIcon = icon(<path d="M18 6 6 18M6 6l12 12" />);
export const ScrollSyncIcon = icon(<path d="M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5" />, { strokeWidth: 2.2 });
export const NavigationSyncIcon = icon(<><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" /></>, { strokeWidth: 2.2 });
export const LinkIcon = icon(<><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></>);
export const ReloadIcon = icon(<><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></>);
export const CompareIcon = icon(<><rect x="3" y="3" width="13" height="13" rx="2" /><rect x="8" y="8" width="13" height="13" rx="2" /></>);
export const CameraIcon = icon(<><path d="M3 8h4l2-3h6l2 3h4v11H3z" /><circle cx="12" cy="13" r="3.5" /></>);
export const FixPromptIcon = icon(<><path d="M4 5h16v11H9l-5 4z" /><path d="m10 9-2 2 2 2M14 9l2 2-2 2" /></>);
export const EyeIcon = icon(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>);
export const SettingsIcon = icon(<><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" /><circle cx="15" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="17" cy="18" r="2" /></>);
export const ChangeDeviceIcon = icon(<><rect x="2" y="4" width="8" height="15" rx="2" /><path d="M14 8h7M18 5l3 3-3 3M21 16h-7M17 13l-3 3 3 3" /></>);
export const RotateIcon = icon(<><rect x="3" y="11" width="13" height="9" rx="2" /><path d="M8 3h5a5 5 0 0 1 5 5v1" /><path d="m15 7 3 3 3-3" /></>);
export const ExpandIcon = icon(<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />);
export const CollapseIcon = icon(<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />);
export const OpenInTabIcon = icon(<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" />);
export const ChevronDownIcon = icon(<path d="m6 9 6 6 6-6" />, { strokeWidth: 2.2 });
export const ChevronLeftIcon = icon(<path d="m15 18-6-6 6-6" />, { strokeWidth: 2.2 });
export const ChevronRightIcon = icon(<path d="m9 18 6-6-6-6" />, { strokeWidth: 2.2 });
export const BackIcon = icon(<path d="M19 12H5M11 6l-6 6 6 6" />);
export const SearchIcon = icon(<><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>, { strokeWidth: 2.2 });
export const CheckIcon = icon(<path d="m5 12 5 5 9-10" />, { strokeWidth: 2.6 });
export const SwitchIcon = icon(<path d="M4 12h14M13 6l6 6-6 6" />, { strokeWidth: 2.4 });
export const SetsIcon = icon(<><rect x="2" y="6" width="6" height="12" rx="1.5" /><rect x="10" y="4" width="6" height="14" rx="1.5" /><rect x="18" y="8" width="4" height="10" rx="1" /></>);
export const CustomSizeIcon = icon(<rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 2.5" />);
export const SideBySideIcon = icon(<><rect x="2" y="4" width="8" height="16" rx="2" /><rect x="14" y="4" width="8" height="16" rx="2" /></>);
export const OverlayIcon = icon(<><rect x="3" y="3" width="13" height="13" rx="2" /><rect x="8" y="8" width="13" height="13" rx="2" strokeDasharray="3 2" /></>);
export const LockIcon = icon(<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>, { strokeWidth: 2.2 });
export const UnlockIcon = icon(<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 7.5-2" /></>, { strokeWidth: 2.2 });
export const AlertIcon = icon(<><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></>, { strokeWidth: 2.2 });
export const UploadIcon = icon(<path d="M12 16V4M7 9l5-5 5 5M5 20h14" />);
export const SunIcon = icon(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>);
export const MoonIcon = icon(<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />);
export const HelpIcon = icon(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7" /><path d="M12 17h.01" /></>);
export const TourIcon = icon(<><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></>);
export const WhatsNewIcon = icon(<path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" />);
export const CopyIcon = icon(<path d="M8 8h12v12H8zM16 8V4H4v12h4" />, { strokeWidth: 2.4 });
export const DownloadIcon = icon(<path d="M12 4v11M7 10l5 5 5-5M5 20h14" />);
export const RectangleIcon = icon(<rect x="4" y="5" width="16" height="14" rx="1" />);
export const ArrowToolIcon = icon(<path d="M5 19 19 5M9 5h10v10" />);
export const TextToolIcon = icon(<path d="M5 6V4h14v2M12 4v16M9 20h6" />);
export const CropIcon = icon(<path d="M6 2v16h16M2 6h16v16" />);
export const UndoIcon = icon(<><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></>);
export const PencilIcon = icon(<path d="M4 20l4-1 11-11-3-3L5 16z" />);
export const TrashIcon = icon(<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />);
export const PauseIcon = icon(<path d="M9 5v14M15 5v14" />, { strokeWidth: 2.6 });
export const PlayIcon = icon(<path d="M7 5v14l12-7z" fill="currentColor" stroke="none" />);
export const StopIcon = icon(<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />);

export function StarIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path fill={filled ? "currentColor" : "none"} d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" />
    </Icon>
  );
}

export function MoreIcon({ size = 16, ...props }: Omit<IconProps, "strokeWidth">) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" />
    </svg>
  );
}

export function GripIcon(props: Omit<IconProps, "strokeWidth">) {
  return (
    <svg width={10} height={16} viewBox="0 0 10 16" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <circle cx="3" cy="3" r="1.3" /><circle cx="7" cy="3" r="1.3" /><circle cx="3" cy="8" r="1.3" /><circle cx="7" cy="8" r="1.3" /><circle cx="3" cy="13" r="1.3" /><circle cx="7" cy="13" r="1.3" />
    </svg>
  );
}

// The record button pairs a neutral ring with a red dot.
export function RecordIcon({ size = 16, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" className={active ? "animate-pulse fill-record" : "fill-record"} />
    </svg>
  );
}
