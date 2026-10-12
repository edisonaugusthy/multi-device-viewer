import { useEffect, useState } from "react";
import type { DesignSize } from "../interactions/design-frame";

/** The natural size of an image once it has loaded; undefined until then or when it fails. */
export function useImageSize(src: string | undefined): DesignSize | undefined {
  const [size, setSize] = useState<{ src: string; size: DesignSize } | undefined>();

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const image = new Image();
    image.onload = () => { if (!cancelled) setSize({ src, size: { width: image.naturalWidth, height: image.naturalHeight } }); };
    image.src = src;
    return () => { cancelled = true; };
  }, [src]);

  return src && size?.src === src ? size.size : undefined;
}
