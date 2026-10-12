import {
  baselineKey, MAX_BASELINE_BYTES, MAX_BASELINES, VisualRegressionError,
  type BaselineIdentity, type BaselineMeta,
} from "../../domain/visual-regression/visual-regression.types";

const DB_NAME = "mdv-visual-baselines";
// v1 stored data URLs and never shipped, so v2 starts clean.
const DB_VERSION = 2;
export interface BaselineImages { png: Blob; preview: Blob }
export interface BaselineRecord { meta: Omit<BaselineMeta, "bytes">; images: BaselineImages }
interface Totals { count: number; bytes: number }

// Open in the extension service worker, never in the host website's origin.
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of [...db.objectStoreNames]) db.deleteObjectStore(name);
      // Metadata is separate so menus and lists never load images.
      db.createObjectStore("meta");
      db.createObjectStore("images");
      db.createObjectStore("stats");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new VisualRegressionError("storage"));
    request.onblocked = () => reject(new VisualRegressionError("storage"));
  });
}
async function transact<T>(stores: string[], mode: IDBTransactionMode, work: (transaction: IDBTransaction) => () => T): Promise<T> {
  const db = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(stores, mode);
      const result = work(transaction);
      transaction.oncomplete = () => resolve(result());
      transaction.onabort = () => reject(new VisualRegressionError("storage"));
    });
  } finally { db.close(); }
}
export function readBaselineMeta(identity: BaselineIdentity): Promise<BaselineMeta | undefined> {
  const key = baselineKey(identity);
  return transact(["meta"], "readonly", transaction => {
    const request = transaction.objectStore("meta").get(key);
    return () => request.result as BaselineMeta | undefined;
  });
}
export function readBaselineImage(identity: BaselineIdentity, kind: keyof BaselineImages): Promise<Blob | undefined> {
  const key = baselineKey(identity);
  return transact(["images"], "readonly", transaction => {
    const request = transaction.objectStore("images").get(key);
    return () => (request.result as BaselineImages | undefined)?.[kind];
  });
}
export function listBaselines(): Promise<BaselineMeta[]> {
  return transact(["meta"], "readonly", transaction => {
    const request = transaction.objectStore("meta").getAll();
    return () => (request.result as BaselineMeta[]).sort((a, b) => b.savedAt - a.savedAt);
  });
}
export function readUsage(): Promise<Totals> {
  return transact(["stats"], "readonly", transaction => {
    const request = transaction.objectStore("stats").get("totals");
    return () => (request.result as Totals | undefined) ?? { count: 0, bytes: 0 };
  });
}
/** Store, replace or (without a record) delete one baseline, enforcing the quota atomically. */
export function writeBaseline(identity: BaselineIdentity, record?: BaselineRecord): Promise<BaselineMeta | undefined> {
  const key = baselineKey(identity);
  const meta = record && { ...record.meta, bytes: record.images.png.size + record.images.preview.size };
  return transact(["meta", "images", "stats"], "readwrite", transaction => {
    const metas = transaction.objectStore("meta");
    const images = transaction.objectStore("images");
    const stats = transaction.objectStore("stats");
    const old = metas.get(key);
    const totals = stats.get("totals");
    // Both reads share one serial transaction with the writes, so concurrent
    // tabs cannot lose quota accounting or overwrite unrelated devices.
    totals.onsuccess = () => {
      const current: Totals = totals.result ?? { count: 0, bytes: 0 };
      const previous = old.result as BaselineMeta | undefined;
      const count = current.count + (meta ? 1 : 0) - (previous ? 1 : 0);
      const bytes = current.bytes + (meta?.bytes ?? 0) - (previous?.bytes ?? 0);
      if (count > MAX_BASELINES || bytes > MAX_BASELINE_BYTES) { transaction.abort(); return; }
      if (meta) { metas.put(meta, key); images.put(record!.images, key); }
      else { metas.delete(key); images.delete(key); }
      stats.put({ count, bytes }, "totals");
    };
    return () => meta;
  });
}
export function clearBaselines(): Promise<void> {
  return transact(["meta", "images", "stats"], "readwrite", transaction => {
    for (const name of ["meta", "images", "stats"]) transaction.objectStore(name).clear();
    return () => undefined;
  });
}
