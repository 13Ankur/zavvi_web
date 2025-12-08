import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Use signal for reactive theme state
  private readonly themeSignal = signal<Theme>(this.getInitialTheme());
  
  // Expose theme as readonly signal
  readonly theme = this.themeSignal.asReadonly();

  constructor() {
    // Apply theme on initialization
    this.applyTheme(this.themeSignal());
    
    // Watch for theme changes and apply them
    effect(() => {
      const currentTheme = this.themeSignal();
      this.applyTheme(currentTheme);
      this.saveTheme(currentTheme);
    });
  }

  /**
   * Get initial theme from localStorage or system preference
   */
  private getInitialTheme(): Theme {
    // Check localStorage first
    const savedTheme = localStorage.getItem('zavvi-theme') as Theme;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    
    // Fall back to system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    
    // Default to light
    return 'light';
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;
    
    const html = document.documentElement;
    
    if (theme === 'dark') {
      html.classList.add('dark-mode');
      html.classList.remove('light-mode');
    } else {
      html.classList.add('light-mode');
      html.classList.remove('dark-mode');
    }
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#6C47FF');
    }
  }

  /**
   * Save theme to localStorage
   */
  private saveTheme(theme: Theme): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('zavvi-theme', theme);
  }

  /**
   * Toggle between light and dark mode
   */
  toggleTheme(): void {
    const currentTheme = this.themeSignal();
    const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
    this.themeSignal.set(newTheme);
  }

  /**
   * Set theme explicitly
   */
  setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
  }

  /**
   * Check if dark mode is active
   */
  isDarkMode(): boolean {
    return this.themeSignal() === 'dark';
  }

  /**
   * Listen to system theme changes
   */
  watchSystemTheme(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Handle initial value
    const handleChange = (e: MediaQueryList | MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem('zavvi-theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }
  }
}

