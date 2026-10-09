import { extensionAsset } from "../../app/viewer-context";
import { PRODUCT_SHORT_NAME } from "../../app/product";
import { cx } from "./ui";

// The extension's own logo, shown in light on dark surfaces.
export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <img
      src={extensionAsset("/icons/icon.svg?v=0ede95a40e")}
      width={size}
      height={size}
      alt={PRODUCT_SHORT_NAME}
      title={PRODUCT_SHORT_NAME}
      className={cx("block shrink-0 dark:opacity-85 dark:brightness-0 dark:invert", className)}
    />
  );
}
