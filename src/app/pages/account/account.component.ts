import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ModalService } from '../../services/modal.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {
  user: any = null;
  isLoading: boolean = true;
  stats = {
    totalCoupons: 0,
    activeCoupons: 0,
    usedCoupons: 0,
    savedAmount: 0
  };
  loadingStats: boolean = true;

  constructor(
    public router: Router,
    private authService: AuthService,
    private apiService: ApiService,
    private modalService: ModalService,
    private seoService: SeoService
  ) {}

  async ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Set SEO meta tags (with noindex for private page)
    this.seoService.setAccountPageMeta();

    await this.loadUserData();
    this.loadUserStats();
  }

  async loadUserData() {
    this.isLoading = true;
    try {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        this.user = currentUser;
      } else {
        this.apiService.getCurrentUser().subscribe({
          next: (userData) => {
            this.user = userData.data || userData;
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading user:', error);
            this.user = this.authService.getCurrentUser();
            this.isLoading = false;
          }
        });
      }
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading user data:', error);
      this.isLoading = false;
    }
  }

  loadUserStats() {
    this.loadingStats = true;
    this.apiService.getRedeemedCoupons({}).subscribe({
      next: (response) => {
        const coupons = response?.data || response || [];
        this.stats.totalCoupons = coupons.length;
        this.stats.activeCoupons = coupons.filter((c: any) => c.status?.toLowerCase() === 'active').length;
        this.stats.usedCoupons = coupons.filter((c: any) => c.status?.toLowerCase() === 'used').length;
        
        // Calculate approximate savings (assuming 10% average discount per coupon used)
        this.stats.savedAmount = this.stats.usedCoupons * 500; // ₹500 average savings per coupon
        this.loadingStats = false;
      },
      error: () => {
        this.loadingStats = false;
      }
    });
  }

  navigateToRedeemedCoupons() {
    this.router.navigate(['/redeemed-coupons']);
  }

  navigateToPremiumDeals() {
    this.router.navigate(['/deals']);
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }

  openSocialMedia(platform: string) {
    const links: { [key: string]: string } = {
      instagram: 'https://www.instagram.com/itszavvi?igsh=MWFubWV4Ynl3YWJsZw==',
      facebook: 'https://www.facebook.com/share/17JV2TLo64/?mibextid=wwXIfr',
      whatsapp: 'https://wa.me/917696649122'
    };

    const url = links[platform];
    if (url) {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank');
      }
    }
  }

  callSupport() {
    const phoneNumber = '9803902091';
    if (typeof window !== 'undefined') {
      window.location.href = `tel:${phoneNumber}`;
    }
  }

  emailSupport() {
    if (typeof window !== 'undefined') {
      window.location.href = 'mailto:guptakeshav000@gmail.com';
    }
  }

  openPrivacyPolicy() {
    // You can create a privacy policy page or link to external policy
    this.modalService.info('Privacy Policy: Coming soon!', 'Privacy Policy');
  }

  openTermsOfService() {
    // You can create a terms page or link to external terms
    this.modalService.info('Terms of Service: Coming soon!', 'Terms of Service');
  }

  openHelpCenter() {
    // You can create a help/FAQ page
    this.modalService.info('Help Center: Coming soon! For immediate assistance, please call support.', 'Help Center');
  }

  async logout() {
    const confirmed = await this.modalService.confirm(
      'Are you sure you want to logout?',
      'Confirm Logout',
      'Logout',
      'Cancel'
    );
    if (confirmed) {
      try {
        await this.apiService.logout().toPromise();
        this.authService.logout();
        this.router.navigate(['/login']);
      } catch (error) {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    }
  }

  getUserInitials(): string {
    if (!this.user?.name) return 'U';
    const names = this.user.name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
    return this.user.name.charAt(0).toUpperCase();
  }
}

