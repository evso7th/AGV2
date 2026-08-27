/**
 * @fileOverview Audio Asset Vault (Independent Module).
 * #ЗАЧЕМ: Автономное хранилище ассетов в IndexedDB для обеспечения оффлайн-режима.
 * #ЧТО: Изолированный менеджер БД с логикой "Proxy Fetch".
 */

const DB_NAME = 'AuraGroove_AssetCache';
const STORE_NAME = 'audio_files';
const DB_VERSION = 1;

export interface SyncStatus {
  total: number;
  cached: number;
  isSyncing: boolean;
}

class AudioVault {
  private db: IDBDatabase | null = null;

  /** Инициализация БД */
  public async init(): Promise<void> {
    if (this.db) return;
    return new Promise((resolve, reject) => {
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
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Умный Fetch: сначала ищет в БД, если нет - качает и сохраняет.
   */
  public async fetch(url: string): Promise<ArrayBuffer> {
    await this.init();
    
    // 1. Пытаемся достать из базы
    const cached = await this.get(url);
    if (cached) {
      console.log(`[Vault] Hit: ${url}`);
      return cached;
    }

    // 2. Если нет - качаем
    console.log(`[Vault] Miss, fetching: ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed for ${url}`);
    
    const buffer = await response.arrayBuffer();
    
    // 3. Сохраняем в фоне (не блокируем выполнение)
    this.put(url, buffer.slice(0)); 
    
    return buffer;
  }

  /** Получить файл из IndexedDB */
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

  /** Сохранить файл в IndexedDB */
  public async put(url: string, data: ArrayBuffer): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(data, url);
      transaction.oncomplete = () => resolve();
    });
  }

  /** Проверить наличие файла */
  public async has(url: string): Promise<boolean> {
    const data = await this.get(url);
    return data !== null;
  }

  /** Очистить всё хранилище */
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
