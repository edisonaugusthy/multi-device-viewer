export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Multi Device Viewer">
      <rect width="48" height="48" rx="13" fill="#0f766e" />
      <rect x="9" y="11" width="20" height="25" rx="4" fill="#ccfbf1" />
      <rect x="18" y="8" width="22" height="30" rx="5" fill="#ffffff" opacity="0.92" />
      <rect x="22" y="13" width="14" height="19" rx="2" fill="#111827" />
      <path d="M10 39h28" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <path d="M33 35l5 5m0 0h-5m5 0v-5" stroke="#7dd3fc" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
