import { Injectable } from '@angular/core';

type CacheEntry<T> = {
  expiresAt: number;
  value?: T;
  inFlight?: Promise<T>;
};

type StoredCache = {
  expiresAt: number;
  data: unknown;
};

const STORAGE_KEY = 'fruver_cache';
const STORAGE_TIMESTAMP_KEY = 'fruver_cache_timestamp';
const ONE_HOUR = 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class CacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private initialized = false;

  constructor() {
    this.loadFromStorage();
  }

  private touch(): void {
    try {
      localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
    } catch {
      // ignore
    }
  }

  /**
   * Carga el cache desde localStorage si no ha expirado (1 hora desde última visita).
   */
  private loadFromStorage(): void {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const timestampStr = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
      if (!timestampStr) return;

      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();

      // Si han pasado más de 1 hora desde la última visita, limpiar
      if (now - timestamp > ONE_HOUR) {
        console.log('[Cache] Cache expirado (> 1 hora desde última visita). Limpiando...');
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        return;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const parsed: Record<string, StoredCache> = JSON.parse(stored);
      let restored = 0;

      for (const [key, entry] of Object.entries(parsed)) {
        if (entry.expiresAt > now) {
          this.store.set(key, { value: entry.data, expiresAt: entry.expiresAt });
          restored++;
        }
      }

      if (restored > 0) {
        console.log(`[Cache] Restaurados ${restored} items desde localStorage.`);
        // Considerar esto como “visita”
        this.touch();
      }
    } catch (e) {
      console.warn('[Cache] Error leyendo localStorage:', e);
    }
  }

  /**
   * Guarda el cache en localStorage y actualiza el timestamp.
   */
  private saveToStorage(): void {
    try {
      const toStore: Record<string, StoredCache> = {};
      const now = Date.now();

      for (const [key, entry] of this.store.entries()) {
        if (entry.value !== undefined && entry.expiresAt > now) {
          toStore[key] = { expiresAt: entry.expiresAt, data: entry.value };
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      localStorage.setItem(STORAGE_TIMESTAMP_KEY, now.toString());
    } catch (e) {
      // localStorage puede fallar por quota o modo privado
      console.warn('[Cache] Error guardando en localStorage:', e);
    }
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    // Considerar lectura como visita
    this.touch();
    return entry.value;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    this.saveToStorage();
  }

  /**
   * Cache + TTL + request coalescing.
   * - If cached and valid, returns cached value.
   * - If a request is in-flight for the same key, returns the same Promise.
   */
  cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const existing = this.store.get(key) as CacheEntry<T> | undefined;

    if (existing) {
      if (existing.value !== undefined && now <= existing.expiresAt) {
        console.log(`[Cache] Hit: ${key}`);
        this.touch();
        return Promise.resolve(existing.value);
      }

      if (existing.inFlight && now <= existing.expiresAt) {
        this.touch();
        return existing.inFlight;
      }
    }

    console.log(`[Cache] Miss: ${key} - cargando desde BD...`);

    const inFlight = loader()
      .then((value) => {
        this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
        this.saveToStorage();
        return value;
      })
      .catch((err) => {
        this.store.delete(key);
        throw err;
      });

    this.store.set(key, { inFlight, expiresAt: Date.now() + ttlMs });
    return inFlight;
  }

  invalidate(keyPrefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(keyPrefix)) this.store.delete(key);
    }
    this.saveToStorage();
  }

  clear(): void {
    this.store.clear();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    console.log('[Cache] Cache limpiado completamente.');
  }
}
