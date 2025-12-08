import { Injectable } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

interface CacheEntry {
  data: any;
  timestamp: number;
  observable?: Observable<any>;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes default
  private ongoingRequests = new Map<string, Observable<any>>();
  
  private clearCacheSubject = new Subject<void>();
  public clearCache$ = this.clearCacheSubject.asObservable();

  constructor() {
    setInterval(() => this.clearExpired(), 15 * 60 * 1000);
  }

  get<T>(key: string, callback: () => Observable<T>, expiryMs?: number): Observable<T> {
    const expiry = expiryMs || this.cacheExpiry;
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < expiry) {
      console.log(`[Cache HIT] ${key}`);
      return of(cached.data);
    }

    if (this.ongoingRequests.has(key)) {
      console.log(`[Cache PENDING] ${key}`);
      return this.ongoingRequests.get(key)!;
    }

    console.log(`[Cache MISS] ${key}`);
    const request$ = callback().pipe(
      tap(data => {
        this.cache.set(key, {
          data,
          timestamp: Date.now()
        });
        this.ongoingRequests.delete(key);
      }),
      shareReplay(1)
    );

    this.ongoingRequests.set(key, request$);
    return request$;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  has(key: string, expiryMs?: number): boolean {
    const expiry = expiryMs || this.cacheExpiry;
    const cached = this.cache.get(key);
    return cached !== undefined && Date.now() - cached.timestamp < expiry;
  }

  getCached(key: string): any | null {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    this.ongoingRequests.delete(key);
    console.log(`[Cache INVALIDATE] ${key}`);
  }

  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.invalidate(key));
    console.log(`[Cache INVALIDATE PATTERN] ${pattern} (${keysToDelete.length} keys)`);
  }

  clearAll(): void {
    this.cache.clear();
    this.ongoingRequests.clear();
    this.clearCacheSubject.next();
    console.log('[Cache CLEAR ALL]');
  }

  private clearExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.cacheExpiry) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`[Cache CLEANUP] Removed ${keysToDelete.length} expired entries`);
    }
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  prefetch<T>(key: string, callback: () => Observable<T>, expiryMs?: number): void {
    if (!this.has(key, expiryMs)) {
      this.get(key, callback, expiryMs).subscribe({
        next: () => console.log(`[Cache PREFETCH SUCCESS] ${key}`),
        error: (err) => console.warn(`[Cache PREFETCH FAILED] ${key}`, err)
      });
    }
  }
}

