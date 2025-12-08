import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Check if code is running in browser
 */
export function isBrowser(): boolean {
  try {
    const platformId = inject(PLATFORM_ID);
    return isPlatformBrowser(platformId);
  } catch {
    // If inject fails, we're likely in a constructor - use typeof check
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}

/**
 * Safe localStorage wrapper for SSR
 */
export class SafeStorage {
  static getItem(key: string): string | null {
    if (isBrowser()) {
      return localStorage.getItem(key);
    }
    return null;
  }

  static setItem(key: string, value: string): void {
    if (isBrowser()) {
      localStorage.setItem(key, value);
    }
  }

  static removeItem(key: string): void {
    if (isBrowser()) {
      localStorage.removeItem(key);
    }
  }

  static clear(): void {
    if (isBrowser()) {
      localStorage.clear();
    }
  }
}

/**
 * Safe sessionStorage wrapper for SSR
 */
export class SafeSessionStorage {
  static getItem(key: string): string | null {
    if (isBrowser()) {
      return sessionStorage.getItem(key);
    }
    return null;
  }

  static setItem(key: string, value: string): void {
    if (isBrowser()) {
      sessionStorage.setItem(key, value);
    }
  }

  static removeItem(key: string): void {
    if (isBrowser()) {
      sessionStorage.removeItem(key);
    }
  }

  static clear(): void {
    if (isBrowser()) {
      sessionStorage.clear();
    }
  }
}

