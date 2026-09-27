/**
 * @fileOverview Audio Asset Vault V2.5 — "Zero Crash Protocol".
 * #ЗАЧЕМ: Предотвращение падения инициализации при отсутствии сети и кэша.
 */

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'AuraGroove_AssetCache';
const STORE_NAME = 'audio_files';
const DB_VERSION = 1;

class AudioVault {
  private db: IDBPDatabase | null = null;
  private isBlocked = false;

  public async init() {
    if (this.db || this.isBlocked) return;
    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        },
      });
    } catch (e) {
      this.isBlocked = true;
      console.warn('[Vault] Storage restricted. Caching disabled.');
    }
  }

  /**
   * Умный прокси. НИКОГДА не выбрасывает исключение. 
   * Если файла нет в кэше и нет сети — возвращает null.
   */
  public async fetch(url: string): Promise<ArrayBuffer | null> {
    await this.init();
    
    // 1. Поиск в Vault (IndexedDB)
    if (this.db && !this.isBlocked) {
      try {
        const cached = await this.db.get(STORE_NAME, url);
        if (cached) return cached;
      } catch (e) {}
    }

    // 2. Попытка сетевого запроса
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        
        const buffer = await response.arrayBuffer();
        
        // 3. Асинхронное сохранение
        if (this.db && !this.isBlocked) {
            try {
                await this.db.put(STORE_NAME, buffer.slice(0), url);
            } catch (e) {}
        }
        return buffer;
    } catch (networkError) {
        // Ошибка сети — возвращаем null, чтобы позволить системе работать без этого файла
        console.warn(`[Vault] Resource unavailable (Offline?): ${url}`);
        return null;
    }
  }

  public async getCachedCount(): Promise<number> {
    await this.init();
    if (!this.db || this.isBlocked) return 0;
    try { return await this.db.count(STORE_NAME); } catch (e) { return 0; }
  }

  public async get(url: string): Promise<ArrayBuffer | null> {
    await this.init();
    if (!this.db || this.isBlocked) return null;
    try { return await this.db.get(STORE_NAME, url) || null; } catch (e) { return null; }
  }

  public async clear(): Promise<void> {
    await this.init();
    if (this.db && !this.isBlocked) {
        try {
            const tx = this.db.transaction(STORE_NAME, 'readwrite');
            await tx.objectStore(STORE_NAME).clear();
            await tx.done;
        } catch (e) {}
    }
  }
}

export const vault = new AudioVault();
