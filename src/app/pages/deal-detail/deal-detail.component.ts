import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-deal-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './deal-detail.component.html',
  styleUrls: ['./deal-detail.component.scss']
})
export class DealDetailComponent implements OnInit {
  deal: any = null;
  shopId: string = '';
  isGenerating: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private modalService: ModalService
  ) {
    // Get deal data from navigation state
    const navigation = this.router.getCurrentNavigation();
    console.log('📋 Deal Detail - Navigation state:', navigation?.extras?.state);
    
    if (navigation?.extras?.state) {
      this.deal = navigation.extras.state['deal'];
      this.shopId = navigation.extras.state['shopId'];
    }
  }

  ngOnInit() {
    console.log('📄 Deal Detail Page - Deal data:', this.deal);
    console.log('🏪 Shop ID:', this.shopId);
    
    // If no deal data, show error and redirect
    if (!this.deal) {
      console.warn('⚠️ No deal data found, redirecting back');
      this.modalService.error(
        'Deal information not found. Please try again.',
        'Error'
      );
      setTimeout(() => {
        this.goBack();
      }, 2000);
    }
    
    // Validate deal has required fields
    if (this.deal && !this.deal.id && !this.deal._id) {
      console.error('❌ Deal missing ID field');
      this.modalService.error('Invalid deal data', 'Error');
    }
  }

  goBack() {
    // Navigate back to shop deals page
    if (this.shopId) {
      this.router.navigate(['/shop-deals', this.shopId]);
    } else {
      // Fallback to home if no shopId
      this.router.navigate(['/']);
    }
  }

  async generateQRCode() {
    // Prevent double-click
    if (this.isGenerating) {
      return;
    }
    
    // Validate deal data
    if (!this.deal) {
      this.modalService.error('Deal information is missing', 'Error');
      return;
    }
    
    const dealId = this.deal.id || this.deal._id;
    if (!dealId) {
      this.modalService.error('Deal ID is missing', 'Error');
      return;
    }
    
    // Validate shop ID
    if (!this.shopId) {
      console.error('❌ Shop ID is missing');
      this.modalService.error('Shop information is missing', 'Error');
      return;
    }

    this.isGenerating = true;

    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.isGenerating = false;
      
      // Ask user to login
      const confirmed = await this.modalService.confirm(
        'Please login to generate QR code. Would you like to login now?',
        'Login Required',
        'Login',
        'Cancel'
      );
      
      if (confirmed) {
        // Save redirect URL with deal ID for auto-claim after login
        const redirectUrl = `/shop-deals/${this.shopId}?claimDeal=${dealId}`;
        this.authService.setRedirectUrl(redirectUrl);
        console.log('💾 Saved redirect URL for post-login:', redirectUrl);
        this.router.navigate(['/login']);
      }
      return;
    }

    console.log('✅ User logged in, navigating to shop-deals with auto-claim');

    // Navigate back to shop-deals page with auto-claim query param
    this.router.navigate(['/shop-deals', this.shopId], {
      queryParams: { claimDeal: dealId }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'No expiry date';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  }
}

