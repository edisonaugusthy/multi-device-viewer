export interface LiveSessionShot { width: number; height: number; dataUrl: string }
export interface LiveSessionTransport {
  attach(): Promise<void>;
  command(method: string, params?: Record<string, unknown>): Promise<any>;
  detach(): Promise<void>;
  settle(): Promise<void>;
  cancelled(): boolean;
}

/** Experimental sequential comparisons of one document; never reloads or copies credentials. */
export async function captureLiveSession(transport: LiveSessionTransport, widths: number[], height: number): Promise<LiveSessionShot[]> {
  if (!widths.length || widths.length > 4 || widths.some(w => !Number.isInteger(w) || w < 320 || w > 1920) || !Number.isInteger(height) || height < 320 || height > 1600) throw new Error("Choose one to four widths from 320–1920 and a height from 320–1600.");
  let attached = false;
  let metricsChanged = false;
  let scroll: { x: number; y: number } | undefined;
  let documentId: number | undefined;
  const shots: LiveSessionShot[] = [];
  let failure: unknown;
  const check = () => { if (transport.cancelled()) throw new Error("Comparison stopped or debugger disconnected."); };
  try {
    await transport.attach(); attached = true;
    const overlay = await transport.command("Runtime.evaluate", { expression: "Boolean(document.getElementById('multi-device-viewer-overlay'))", returnByValue: true });
    if (overlay?.result?.value) throw new Error("Close the Mobile View overlay before comparing the live page.");
    const metrics = await transport.command("Page.getLayoutMetrics");
    scroll = { x: metrics.cssVisualViewport.pageX, y: metrics.cssVisualViewport.pageY };
    documentId = (await transport.command("DOM.getDocument", { depth: 0 })).root.backendNodeId;
    for (const width of [...new Set(widths)]) {
      check();
      metricsChanged = true;
      await transport.command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
      await transport.settle(); check();
      if ((await transport.command("DOM.getDocument", { depth: 0 })).root.backendNodeId !== documentId) throw new Error("The page navigated. Start a new comparison on the new document.");
      const capture = await transport.command("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
      shots.push({ width, height, dataUrl: `data:image/png;base64,${capture.data}` });
    }
  } catch (error) { failure = error; }
  finally {
    if (attached) {
      try {
        if (metricsChanged) await transport.command("Emulation.clearDeviceMetricsOverride");
        const current = await transport.command("DOM.getDocument", { depth: 0 });
        if (scroll && current.root.backendNodeId === documentId) await transport.command("Runtime.evaluate", { expression: `window.scrollTo({left:${Number(scroll.x)},top:${Number(scroll.y)},behavior:'instant'})` });
      } catch (error) { failure ??= new Error(`Could not confirm viewport restoration: ${String(error)}`); }
      try { await transport.detach(); } catch (error) { failure ??= error; }
    }
  }
  if (failure) throw failure;
  return shots;
}
