type StoreShape = Record<string, unknown>;

const memoryStore = new Map<string, unknown>();

export async function readStore<T>(key: string, fallback: T): Promise<T> {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    const result = await chrome.storage.local.get(key);
    return (result[key] as T | undefined) ?? fallback;
  }

  const raw = localStorage.getItem(key);
  if (!raw) return (memoryStore.get(key) as T | undefined) ?? fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeStore<T>(key: string, value: T): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    await chrome.storage.local.set({ [key]: value } satisfies StoreShape);
    return;
  }

  memoryStore.set(key, value);
  localStorage.setItem(key, JSON.stringify(value));
}
