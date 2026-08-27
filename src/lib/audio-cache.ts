/**
 * @fileOverview Audio Asset Vault V1.1 — "Diagnostic & Stats".
 * #ЗАЧЕМ: Добавлены методы для подсчета кэшированных файлов и управления синхронизацией.
 */

const DB_NAME = 'AuraGroove_AssetCache';
const STORE_NAME = 'audio_files';
const DB_VERSION = 1;

export interface SyncStatus {
  total: number;
  cached: number;
  isSyncing: boolean;
  error: string | null;
}

class AudioVault {
  private db: IDBDatabase | null = null;

  public async init(): Promise<void> {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };
        request.onerror = () => reject(new Error("Database access denied (possibly Incognito mode)"));
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Умный Fetch: сначала ищет в БД, если нет - качает и сохраняет.
   */
  public async fetch(url: string): Promise<ArrayBuffer> {
    await this.init();
    
    const cached = await this.get(url);
    if (cached) return cached;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed for ${url}`);
    
    const buffer = await response.arrayBuffer();
    // Сохраняем клон буфера, так как оригинал будет поглощен Web Audio API
    this.put(url, buffer.slice(0)); 
    
    return buffer;
  }

  public async get(url: string): Promise<ArrayBuffer | null> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  public async put(url: string, data: ArrayBuffer): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(data, url);
      transaction.oncomplete = () => resolve();
    });
  }

  /** #ЗАЧЕМ: Проверка прогресса заполнения кэша. */
  public async getCachedCount(): Promise<number> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });
  }

  public async clear(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).clear();
      transaction.oncomplete = () => resolve();
    });
  }
}

export const vault = new AudioVault();
