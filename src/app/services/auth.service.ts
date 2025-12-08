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
    const token = SafeStorage.getItem('token');
    const storedUser = SafeStorage.getItem('currentUser');
    
    if (token && storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch (error) {
        SafeStorage.removeItem('currentUser');
        SafeStorage.removeItem('token');
      }
    }
  }

  isLoggedIn(): boolean {
    const token = SafeStorage.getItem('token');
    return token !== null && this.currentUser !== null;
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
    this.currentUser = null;
    SafeStorage.removeItem('currentUser');
    SafeStorage.removeItem('token');
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

