import { extensionAsset } from "../../app/viewer-context";
export function BrandMark({ size = 36, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <img src={extensionAsset("/icons/icon.svg?v=0ede95a40e")} width={size} height={size} alt="Mobile View & Responsive Tester" className="block" style={dark ? { filter: "brightness(0) invert(1)", opacity: 0.85 } : undefined} />
  );
}
