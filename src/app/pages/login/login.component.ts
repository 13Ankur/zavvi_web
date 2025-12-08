import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-container">
        <div class="login-card">
          <h1>{{ otpSent ? 'Verify OTP' : 'Sign In to Zavvi' }}</h1>
          <p>{{ otpSent ? 'Enter the OTP sent to your mobile' : 'Access exclusive deals and save more' }}</p>
          
          <!-- Mobile Number Input -->
          <form class="login-form" *ngIf="!otpSent" (ngSubmit)="onSendOTP()">
            <div class="form-group">
              <label>Mobile Number</label>
              <input 
                type="tel" 
                [(ngModel)]="mobile" 
                name="mobile" 
                placeholder="Enter your 10-digit mobile number"
                maxlength="10"
                [disabled]="isLoading">
            </div>
            
            <div class="error-message" *ngIf="errorMessage">
              {{ errorMessage }}
            </div>
            
            <button type="submit" class="btn-primary" [disabled]="isLoading">
              {{ isLoading ? 'Sending...' : 'Send OTP' }}
            </button>
          </form>

          <!-- OTP Input -->
          <form class="login-form" *ngIf="otpSent" (ngSubmit)="onVerifyOTP()">
            <div class="form-group">
              <label>Enter OTP</label>
              <input 
                type="text" 
                [(ngModel)]="otp" 
                name="otp" 
                placeholder="Enter 4-digit OTP"
                maxlength="4"
                [disabled]="isVerifying">
            </div>
            
            <div class="error-message" *ngIf="errorMessage">
              {{ errorMessage }}
            </div>
            
            <button type="submit" class="btn-primary" [disabled]="isVerifying">
              {{ isVerifying ? 'Verifying...' : 'Verify OTP' }}
            </button>
            
            <div class="resend-section">
              <button 
                type="button" 
                class="btn-link" 
                [disabled]="!canResend"
                (click)="onResendOTP()">
                {{ canResend ? 'Resend OTP' : 'Resend in ' + getResendTimerText() }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 120px 20px 48px; }
    .login-card { background: white; border-radius: 20px; padding: 48px 40px; max-width: 450px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    h1 { font-size: 2rem; font-weight: 800; margin: 0 0 8px; text-align: center; }
    p { text-align: center; color: #666; margin: 0 0 32px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; font-weight: 600; color: #333; }
    input { width: 100%; padding: 12px 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; }
    input:focus { outline: none; border-color: #6C47FF; box-shadow: 0 0 0 3px rgba(108,71,255,0.1); }
    input:disabled { background: #f5f5f5; cursor: not-allowed; }
    .btn-primary { width: 100%; padding: 14px; background: linear-gradient(135deg, #6C47FF, #5b86e5); color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; margin-top: 8px; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-link { background: none; border: none; color: #6C47FF; font-weight: 600; cursor: pointer; padding: 8px; }
    .btn-link:disabled { color: #999; cursor: not-allowed; }
    .error-message { background: #fee; color: #c33; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 0.875rem; }
    .resend-section { text-align: center; margin-top: 16px; }
    .form-footer { margin-top: 24px; text-align: center; }
    .form-footer a { color: #6C47FF; font-weight: 600; text-decoration: none; }

    /* Dark Mode */
    :host-context(.dark-mode) .login-card {
      background: var(--bg-primary);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    }

    :host-context(.dark-mode) p {
      color: var(--text-medium);
    }

    :host-context(.dark-mode) label {
      color: var(--text-dark);
    }

    :host-context(.dark-mode) input {
      background: var(--bg-secondary);
      border-color: rgba(255, 255, 255, 0.2);
      color: var(--text-dark);
    }

    :host-context(.dark-mode) input:disabled {
      background: rgba(255, 255, 255, 0.05);
    }

    :host-context(.dark-mode) .btn-link:disabled {
      color: var(--text-light);
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  mobile: string = '';
  otp: string = '';
  otpSent: boolean = false;
  errorMessage: string = '';
  resendTimer: number = 60;
  canResend: boolean = false;
  isLoading: boolean = false;
  isVerifying: boolean = false;
  private timerInterval: any;
  private profileComplete: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.handleRedirect();
    }
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  onSendOTP() {
    this.errorMessage = '';
    
    if (!this.mobile || this.mobile.trim().length === 0) {
      this.errorMessage = 'Please enter your mobile number';
      return;
    }
    
    if (this.mobile.length < 10) {
      this.errorMessage = 'Please enter a valid 10-digit mobile number';
      return;
    }

    this.isLoading = true;

    this.authService.sendOTP(this.mobile).subscribe({
      next: () => {
        this.isLoading = false;
        this.otpSent = true;
        this.otp = '';
        this.startResendTimer();
        console.log('OTP sent successfully');
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Failed to send OTP. Please try again.';
      }
    });
  }

  startResendTimer() {
    this.canResend = false;
    this.resendTimer = 60;
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      if (this.resendTimer > 0) {
        this.resendTimer--;
      } else {
        this.canResend = true;
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  getResendTimerText(): string {
    const minutes = Math.floor(this.resendTimer / 60);
    const seconds = this.resendTimer % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  onResendOTP() {
    if (this.canResend) {
      this.onSendOTP();
    }
  }

  onVerifyOTP() {
    this.errorMessage = '';

    if (!this.otp || this.otp.trim().length === 0) {
      this.errorMessage = 'Please enter the OTP';
      return;
    }

    if (this.otp.length !== 4) {
      this.errorMessage = 'Please enter the complete 4-digit OTP';
      return;
    }

    this.isVerifying = true;

    this.authService.verifyOTP(this.mobile, this.otp).subscribe({
      next: (response: any) => {
        this.isVerifying = false;
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }
        
        this.profileComplete = response.profileComplete !== false;
        
        console.log('Login successful');
        this.handleRedirect();
      },
      error: (error) => {
        this.isVerifying = false;
        let errorMsg = 'Invalid OTP. Please try again.';
        if (error.message) {
          errorMsg = error.message;
        }
        
        this.errorMessage = errorMsg;
      }
    });
  }

  private handleRedirect() {
    // If profile is incomplete, redirect to personal info page (like mobile app)
    if (!this.profileComplete) {
      this.router.navigate(['/personal-info'], { 
        queryParams: { fromLogin: 'true' } 
      });
      return;
    }
    
    // Otherwise, handle normal redirect
    const redirectUrl = this.authService.getRedirectUrl();
    if (redirectUrl) {
      this.authService.clearRedirectUrl();
      this.router.navigateByUrl(redirectUrl);
    } else {
      this.router.navigate(['/']);
    }
  }
}
