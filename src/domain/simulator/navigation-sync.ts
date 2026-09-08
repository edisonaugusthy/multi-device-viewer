export function syncableUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch { /* Ignore incomplete or non-web locations. */ }
}

/** Per-viewport observations, independent of its original iframe src. */
export class NavigationSyncState {
  url: string;
  private documentId?: string;
  private pending?: { outgoingDocument?: string };

  constructor(url: string) { this.url = url; }

  follow(url: string): boolean {
    if (!syncableUrl(url) || (!this.pending && this.url === url)) return false;
    this.pending = { outgoingDocument: this.documentId };
    return true;
  }

  observe(value: unknown, documentId?: string): { url: string; changed: boolean } | undefined {
    const url = syncableUrl(value);
    if (!url) return;
    if (this.pending && documentId && documentId === this.pending.outgoingDocument) return;
    const changed = !this.pending && url !== this.url;
    this.pending = undefined;
    this.documentId = documentId;
    this.url = url;
    return { url, changed };
  }
}
