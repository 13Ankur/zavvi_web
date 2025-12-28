import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="personal-info-page">
      <div class="info-container">
        <div class="info-card">
          <div class="header-section">
            <div class="icon-wrapper">
              <span class="material-icons">person</span>
            </div>
            <h1>Complete Your Profile</h1>
            <p>Please provide your details to continue</p>
          </div>
          
          <form class="info-form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label>Full Name <span class="required">*</span></label>
              <input 
                type="text" 
                [(ngModel)]="name" 
                name="name" 
                placeholder="Enter your full name"
                [disabled]="isLoading"
                required>
            </div>

            <div class="form-group">
              <label>Email Address <span class="optional">(Optional)</span></label>
              <input 
                type="email" 
                [(ngModel)]="email" 
                name="email" 
                placeholder="your.email@example.com"
                [disabled]="isLoading">
            </div>

            <div class="form-group">
              <label>Mobile Number</label>
              <input 
                type="tel" 
                [(ngModel)]="mobile" 
                name="mobile" 
                placeholder="Your mobile number"
                disabled>
            </div>
            
            <div class="error-message" *ngIf="errorMessage">
              {{ errorMessage }}
            </div>
            
            <button type="submit" class="btn-primary" [disabled]="isLoading">
              {{ isLoading ? 'Saving...' : 'Continue' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .personal-info-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 120px 20px 48px; }
    .info-card { background: white; border-radius: 20px; padding: 48px 40px; max-width: 500px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .header-section { text-align: center; margin-bottom: 32px; }
    .icon-wrapper { width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #6C47FF, #5b86e5); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(108, 71, 255, 0.3); }
    .icon-wrapper .material-icons { font-size: 40px; color: white; }
    h1 { font-size: 1.75rem; font-weight: 800; margin: 0 0 8px; }
    p { color: #666; margin: 0; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; font-weight: 600; color: #333; }
    .required { color: #e53e3e; }
    .optional { color: #888; font-weight: 400; font-size: 0.875rem; }
    input { width: 100%; padding: 12px 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; box-sizing: border-box; }
    input:focus { outline: none; border-color: #6C47FF; box-shadow: 0 0 0 3px rgba(108,71,255,0.1); }
    input:disabled { background: #f5f5f5; cursor: not-allowed; color: #999; }
    .btn-primary { width: 100%; padding: 14px; background: linear-gradient(135deg, #6C47FF, #5b86e5); color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; margin-top: 8px; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .error-message { background: #fee; color: #c33; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 0.875rem; }
    
    /* Dark Mode */
    :host-context(.dark-mode) .info-card {
      background: var(--bg-primary);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    }

    :host-context(.dark-mode) h1 {
      color: var(--text-dark);
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

    :host-context(.dark-mode) input::placeholder {
      color: var(--text-light);
    }

    :host-context(.dark-mode) input:disabled {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-light);
    }

    :host-context(.dark-mode) .error-message {
      background: rgba(255, 100, 100, 0.15);
      color: #ff6b6b;
    }

    @media (max-width: 768px) {
      .personal-info-page { padding: 80px 16px 24px; }
      .info-card { padding: 32px 24px; }
      h1 { font-size: 1.5rem; }
      .icon-wrapper { width: 64px; height: 64px; }
      .icon-wrapper .material-icons { font-size: 32px; }
    }
  `]
})
export class PersonalInfoComponent implements OnInit {
  name: string = '';
  email: string = '';
  mobile: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  fromLogin: boolean = false;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Get current user info
    const user = this.authService.getCurrentUser();
    if (user) {
      this.mobile = user.mobile || '';
      this.name = user.name || '';
      this.email = user.email || '';
    }

    // Check if coming from login
    this.route.queryParams.subscribe(params => {
      this.fromLogin = params['fromLogin'] === 'true';
    });
  }

  onSubmit() {
    this.errorMessage = '';

    // Validation
    if (!this.name || this.name.trim().length === 0) {
      this.errorMessage = 'Please enter your full name';
      return;
    }

    // Email validation (only if provided)
    if (this.email && this.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        this.errorMessage = 'Please enter a valid email address';
        return;
      }
    }

    this.isLoading = true;

    // Build update data
    const updateData: any = {
      name: this.name.trim(),
      mobile: this.mobile
    };

    // Only include email if provided
    if (this.email && this.email.trim().length > 0) {
      updateData.email = this.email.trim();
    }

    // Update user profile
    this.apiService.updateUserProfile(updateData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        
        // Update local user data
        const updatedData: any = {
          name: this.name.trim()
        };
        if (this.email && this.email.trim().length > 0) {
          updatedData.email = this.email.trim();
        }
        this.authService.updateCurrentUser(updatedData);

        console.log('Profile updated successfully');
        
        // Redirect to home or redirect URL
        const redirectUrl = this.authService.getRedirectUrl();
        if (redirectUrl) {
          this.authService.clearRedirectUrl();
          this.router.navigateByUrl(redirectUrl);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        
        // Check if it's an auth error (token expired)
        if (error.isAuthError || error.status === 401 || error.status === 403) {
          // Auth interceptor will handle redirect, just show message
          this.errorMessage = 'Session expired. Redirecting to login...';
          return;
        }
        
        this.errorMessage = error.message || 'Failed to update profile. Please try again.';
        console.error('Profile update error:', error);
      }
    });
  }
}

