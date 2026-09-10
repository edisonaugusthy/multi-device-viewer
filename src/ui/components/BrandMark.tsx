import { extensionAsset } from "../../app/viewer-context";
export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <img src={extensionAsset("/icons/icon-128.png?v=592558bf78")} width={size} height={size} alt="Mobile View & Responsive Tester" className="block rounded-[22%]" />
  );
}
