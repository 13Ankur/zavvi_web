import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SafeStorage } from '../utils/platform.utils';

export interface User {
  id?: string;
  name: string;
  email: string;
  mobile: string;
  dob?: string;
  isVerified?: boolean;
  location?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;
  private redirectUrl: string = '';

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from storage
   * Also validates token if possible
   */
  private initializeAuth(): void {
    const token = SafeStorage.getItem('token');
    const storedUser = SafeStorage.getItem('currentUser');
    
    if (token && storedUser) {
      try {
        // Check if token is expired by decoding JWT
        if (this.isTokenExpired(token)) {
          console.warn('🔐 Token expired on app load - clearing session');
          this.clearSession();
          return;
        }
        
        this.currentUser = JSON.parse(storedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.clearSession();
      }
    }
  }

  /**
   * Check if JWT token is expired
   * Returns true if expired or invalid, false if valid
   */
  private isTokenExpired(token: string): boolean {
    try {
      // JWT format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true; // Invalid token format
      }
      
      // Decode the payload (base64)
      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiration
      if (payload.exp) {
        const expirationDate = new Date(payload.exp * 1000);
        const now = new Date();
        
        // Token is expired if expiration date is in the past
        if (expirationDate < now) {
          console.log('Token expired at:', expirationDate.toISOString());
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Assume expired if we can't parse
    }
  }

  /**
   * Clear all session data
   */
  clearSession(): void {
    this.currentUser = null;
    SafeStorage.removeItem('currentUser');
    SafeStorage.removeItem('token');
    SafeStorage.removeItem('redirectAfterLogin');
  }

  /**
   * Handle session expiration - called by interceptor or manually
   */
  handleSessionExpired(): void {
    console.warn('🔐 Session expired - redirecting to login');
    this.clearSession();
    
    const currentUrl = this.router.url;
    if (!currentUrl.includes('/login')) {
      SafeStorage.setItem('redirectAfterLogin', currentUrl);
      this.router.navigate(['/login'], { 
        queryParams: { sessionExpired: 'true' } 
      });
    }
  }

  isLoggedIn(): boolean {
    const token = SafeStorage.getItem('token');
    
    // No token or no user = not logged in
    if (!token || !this.currentUser) {
      return false;
    }
    
    // Check if token is expired
    if (this.isTokenExpired(token)) {
      console.warn('🔐 Token expired - clearing session');
      this.clearSession();
      return false;
    }
    
    return true;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  register(userData: User): Observable<boolean> {
    return this.apiService.register(userData).pipe(
      map((response) => {
        if (response.success) {
          return true;
        }
        throw new Error(response.message || 'Registration failed');
      }),
      catchError((error) => {
        throw error;
      })
    );
  }

  sendOTP(mobile: string): Observable<boolean> {
    return this.apiService.sendOTP(mobile).pipe(
      map((response) => {
        if (response.success) {
          return true;
        }
        throw new Error(response.message || 'Failed to send OTP');
      }),
      catchError((error) => {
        let errorMessage = 'Failed to send OTP. Please try again.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        const customError: any = new Error(errorMessage);
        customError.status = error.status;
        throw customError;
      })
    );
  }

  verifyOTP(mobile: string, otp: string): Observable<any> {
    return this.apiService.verifyOTP(mobile, otp).pipe(
      map((response) => {
        if (response.success && response.data) {
          SafeStorage.setItem('token', response.data.token);
          this.currentUser = {
            ...response.data.user,
            location: response.data.user.location || ''
          };
          SafeStorage.setItem('currentUser', JSON.stringify(this.currentUser));
          return {
            success: true,
            profileComplete: response.profileComplete !== false
          };
        }
        throw new Error(response.message || 'OTP verification failed');
      }),
      catchError((error) => {
        let errorMessage = 'Invalid OTP. Please try again.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        const customError: any = new Error(errorMessage);
        customError.status = error.status;
        throw customError;
      })
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/']);
  }

  setRedirectUrl(url: string): void {
    this.redirectUrl = url;
  }

  getRedirectUrl(): string {
    return this.redirectUrl;
  }

  clearRedirectUrl(): void {
    this.redirectUrl = '';
  }

  updateCurrentUser(userData: Partial<User>): void {
    if (this.currentUser) {
      this.currentUser = {
        ...this.currentUser,
        ...userData
      };
      SafeStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }
  }
}

