// Promise-based chrome.storage augmentation
// Extends the @types/chrome package with Promise-returning helpers on chrome.storage.

type AreaName = 'local' | 'sync' | 'managed';

interface ChromeStorageArea {
  get<T = Record<string, unknown>>(keys?: string | string[] | null): Promise<T>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
  clear(): Promise<void>;
  getBytesInUse?(keys?: string | string[] | null): Promise<number>;
}

interface PromiseStorage {
  local: ChromeStorageArea;
  sync: ChromeStorageArea;
  managed: ChromeStorageArea;
}

declare global {
  const chrome: typeof import('chrome');

  interface ChromeStorage {
    // Allow promise-based access in addition to callback-based
    [key: string]: unknown;
  }
}

export {};
