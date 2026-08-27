
/**
 * @fileOverview Audio Asset Vault V2.1 — "Robustness Update".
 * #ЗАЧЕМ: Улучшенная поддержка режима Инкогнито и предотвращение ошибок итерации.
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
      console.warn('[Vault] Storage restricted (Incognito mode?). Offline caching disabled.');
    }
  }

  /**
   * Умный Fetch Прокси: БД -> Сеть -> БД.
   */
  public async fetch(url: string): Promise<ArrayBuffer> {
    await this.init();
    
    // 1. Пытаемся взять из кэша (если не заблокировано)
    if (this.db && !this.isBlocked) {
      try {
        const cached = await this.db.get(STORE_NAME, url);
        if (cached) return cached;
      } catch (e) {}
    }

    // 2. Если нет в кэше или база недоступна — качаем из сети
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
    
    const buffer = await response.arrayBuffer();
    
    // 3. Сохраняем в фоне (если база доступна)
    if (this.db && !this.isBlocked) {
      try {
        // Используем копию буфера, так как оригинал будет "поглощен" Web Audio API
        await this.db.put(STORE_NAME, buffer.slice(0), url);
      } catch (e) {}
    }

    return buffer;
  }

  public async getCachedCount(): Promise<number> {
    await this.init();
    if (!this.db || this.isBlocked) return 0;
    try {
        return await this.db.count(STORE_NAME);
    } catch (e) {
        return 0;
    }
  }

  public async get(url: string): Promise<ArrayBuffer | null> {
    await this.init();
    if (!this.db || this.isBlocked) return null;
    try {
        const data = await this.db.get(STORE_NAME, url);
        return data || null;
    } catch (e) {
        return null;
    }
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
