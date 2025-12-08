import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';
import { SeoService } from '../../services/seo.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-shop-deals',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shop-deals.component.html',
  styleUrls: ['./shop-deals.component.scss']
})
export class ShopDealsComponent implements OnInit {
  shopId: string = '';
  shopName: string = '';
  deals: any[] = [];
  isLoading: boolean = true;
  dealsNotFound: boolean = false;

  // QR Modal (matching mobile app structure)
  isQRModalOpen: boolean = false;
  selectedDeal: any = null;
  qrCodeUrl: string = '';
  couponCode: string = '';
  isGeneratingCoupon: boolean = false;
  userName: string = '';
  vendorContact: string = '';
  vendorRedemptionUrl: string = '';
  couponId: string = '';
  redemptionToken: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private modalService: ModalService,
    private seoService: SeoService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.shopId = id;
      this.loadShopAndDeals(id);
    } else {
      this.dealsNotFound = true;
      this.isLoading = false;
    }

    // Get user info
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.name || user.mobile || 'User';
    }

    // Check if user just logged in and needs to claim a deal
    // This will be handled after deals are loaded
  }

  checkForPendingClaim() {
    // Check query params for pending claim action
    const claimDealId = this.route.snapshot.queryParams['claimDeal'];
    if (claimDealId && this.authService.isLoggedIn() && this.deals.length > 0) {
      console.log('🔄 User logged in, auto-claiming deal:', claimDealId);
      // Clear query parameter first
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
      // Then trigger the claim
      setTimeout(() => {
        this.autoClaimDeal(claimDealId);
      }, 100);
    }
  }

  autoClaimDeal(dealId: string) {
    // Find the deal in the loaded deals
    const deal = this.deals.find(d => 
      (d.id === dealId) || (d._id === dealId) || (d.dealId === dealId)
    );
    
    if (deal) {
      console.log('✅ Found deal, triggering claim:', deal.title);
      // Trigger the claim action
      this.claimDeal(deal);
    } else {
      console.warn('⚠️ Deal not found for auto-claim:', dealId);
      // If deal not found yet, wait a bit more and try again
      setTimeout(() => {
        const retryDeal = this.deals.find(d => 
          (d.id === dealId) || (d._id === dealId) || (d.dealId === dealId)
        );
        if (retryDeal) {
          console.log('✅ Found deal on retry, triggering claim:', retryDeal.title);
          this.claimDeal(retryDeal);
        }
      }, 2000);
    }
  }

  loadShopAndDeals(shopId: string) {
    this.apiService.getShop(shopId).subscribe({
      next: (shop) => {
        this.shopName = shop.title || shop.name || 'Shop';
        this.vendorContact = shop.contact || shop.phone || '';
        
        // Update SEO for shop deals page
        const categoryName = shop.category?.name || 'Deals';
        this.seoService.setShopPageMeta(this.shopName, categoryName);
        
        this.loadDeals(shopId);
      },
      error: (error) => {
        console.error('Error loading shop:', error);
        this.loadDeals(shopId);
      }
    });
  }

  loadDeals(shopId: string) {
    this.apiService.getDealsByShop(shopId).subscribe({
      next: (response) => {
        let dealsData: any[] = [];
        let shopImage = '';
        
        if (Array.isArray(response)) {
          dealsData = response;
        } else if (response.data) {
          dealsData = response.data;
          
          // Extract shop info from response
          if (response.shop) {
            if (!this.shopName) {
              this.shopName = response.shop.title || 'Shop';
            }
            // Get shop image - deals will use this if they don't have their own image
            shopImage = response.shop.image || response.shop.imageUrl || response.shop.banner || '';
            console.log('🏪 Shop image from API:', shopImage);
          }
        }
        
        this.deals = dealsData.map((deal: any) => {
          // Priority: deal.image > shop.image > fallback placeholder
          let rawImage = '';
          
          // Check deal's own image fields first
          if (deal.image && deal.image.trim() && deal.image.toLowerCase() !== 'null') {
            rawImage = deal.image;
          } else if (deal.imageUrl && deal.imageUrl.trim() && deal.imageUrl.toLowerCase() !== 'null') {
            rawImage = deal.imageUrl;
          } else if (deal.banner && deal.banner.trim() && deal.banner.toLowerCase() !== 'null') {
            rawImage = deal.banner;
          } else if (shopImage && shopImage.trim() && shopImage.toLowerCase() !== 'null') {
            // Fallback to shop image
            rawImage = shopImage;
          }
          
          let imageUrl = rawImage;
          
          // Convert relative URLs to absolute
          if (rawImage && !rawImage.startsWith('http')) {
            const baseUrl = environment.apiUrl.replace('/api', '');
            imageUrl = rawImage.startsWith('/') ? `${baseUrl}${rawImage}` : `${baseUrl}/${rawImage}`;
          }
          
          // If still no image, use placeholder
          if (!imageUrl || imageUrl.trim() === '') {
            const firstLetter = deal.title ? deal.title.charAt(0).toUpperCase() : 'D';
            imageUrl = `https://ui-avatars.com/api/?name=${firstLetter}&size=400&background=6C47FF&color=ffffff&bold=true&format=png`;
          }
          
          console.log(`🖼️ Deal "${deal.title}":`, { 
            dealImage: deal.image,
            dealImageUrl: deal.imageUrl,
            dealBanner: deal.banner,
            shopImage: shopImage,
            rawImage: rawImage,
            finalImage: imageUrl,
            hasValidImage: !!rawImage 
          });
          
          return {
            id: deal._id || deal.id,
            title: deal.title,
            discount: deal.discount,
            description: deal.description,
            image: imageUrl,
            validUntil: deal.validUntil ? new Date(deal.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A',
            terms: deal.terms || '',
            couponCode: deal.couponCode || '',
            isGoldenCoupon: deal.isGoldenCoupon || false,
            maxRedemptions: deal.maxRedemptions || null,
            currentRedemptions: deal.currentRedemptions || 0
          };
        });
        
        if (this.deals.length === 0) {
          this.dealsNotFound = true;
        }
        this.isLoading = false;
        console.log('Deals loaded:', this.deals.length);
        
        // Check if user just logged in and needs to claim a deal
        this.checkForPendingClaim();
      },
      error: (error) => {
        console.error('Error loading deals:', error);
        this.dealsNotFound = true;
        this.isLoading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/shop', this.shopId]);
  }

  async claimDeal(deal: any) {
    console.log('🎯 Claim Deal clicked:', deal.title);
    
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      console.log('❌ User not logged in');
      this.modalService.confirm(
        'Please login to claim this deal. Would you like to login now?',
        'Login Required',
        'Login',
        'Cancel'
      ).then((confirmed) => {
        if (confirmed) {
          // Save current route and deal info for redirect after login
          const currentRoute = this.router.url;
          const redirectUrl = `${currentRoute}?claimDeal=${deal.id || deal._id}`;
          this.authService.setRedirectUrl(redirectUrl);
          console.log('💾 Saved redirect URL:', redirectUrl);
          this.router.navigate(['/login']);
        }
      });
      return;
    }

    console.log('✅ User logged in, opening modal');
    
    // Clear previous data (matching mobile app)
    this.qrCodeUrl = '';
    this.couponCode = '';
    this.vendorRedemptionUrl = '';
    this.couponId = '';
    this.redemptionToken = '';
    
    // Set state
    this.selectedDeal = deal;
    this.isGeneratingCoupon = true;
    this.isQRModalOpen = true;

    // Check for existing coupon then generate
    this.checkForExistingActiveCoupon(deal);
  }

  checkForExistingActiveCoupon(deal: any) {
    console.log('🔍 Checking for existing active coupon...');
    
    this.apiService.getRedeemedCoupons({ status: 'active' }).subscribe({
      next: (response) => {
        console.log('📦 Existing coupons response:', response);
        const coupons = response?.data || response || [];
        const existingCoupon = coupons.find((coupon: any) => 
          coupon.deal?._id === deal.id || coupon.deal === deal.id
        );

        if (existingCoupon) {
          console.log('⚠️ Found existing coupon');
          this.modalService.info(
            'You already have an active coupon for this offer! Check "My Coupons".',
            'Already Claimed'
          ).then(() => {
            this.closeQRModal();
            setTimeout(() => {
              this.router.navigate(['/redeemed-coupons']);
            }, 500);
          });
          return;
        }

        console.log('✅ No existing coupon, proceeding...');
        // No existing coupon, check golden eligibility
        this.checkGoldenCouponEligibility(deal);
      },
      error: (error) => {
        console.error('❌ Error checking existing coupons:', error);
        // Proceed anyway
        this.checkGoldenCouponEligibility(deal);
      }
    });
  }

  checkGoldenCouponEligibility(deal: any) {
    console.log('🌟 Checking golden coupon eligibility:', deal.isGoldenCoupon);
    
    if (!deal.isGoldenCoupon) {
      console.log('✅ Regular deal, proceeding directly');
      // Not a golden coupon, proceed directly
      this.generateCouponFromAPI(deal);
      return;
    }

    console.log('🏅 Checking golden coupon eligibility via API...');
    
    this.apiService.checkGoldenCouponEligibility(deal.id).subscribe({
      next: (eligibilityCheck) => {
        console.log('📊 Eligibility check result:', eligibilityCheck);
        
        if (!eligibilityCheck.canRedeem) {
          console.log('❌ Cannot redeem golden coupon');
          this.isGeneratingCoupon = false;
          
          if (eligibilityCheck.alreadyRedeemed) {
            this.modalService.warning('You have already redeemed this Golden Coupon', 'Already Redeemed');
          } else if (eligibilityCheck.limitReached) {
            this.modalService.warning('This Golden Coupon has reached its redemption limit', 'Limit Reached');
          }
          
          this.closeQRModal();
          return;
        }

        console.log('✅ Can redeem golden coupon, proceeding...');
        // Can redeem, proceed
        this.generateCouponFromAPI(deal);
      },
      error: (error) => {
        console.error('❌ Error checking eligibility:', error);
        // Proceed anyway (better UX)
        console.log('⚠️ Proceeding despite eligibility check error');
        this.generateCouponFromAPI(deal);
      }
    });
  }

  generateCouponFromAPI(deal: any) {
    console.log('🎫 Generating coupon via API for deal:', deal.id);
    
    this.apiService.generateCoupon(deal.id).subscribe({
      next: (couponData) => {
        console.log('📦 API Response:', couponData);
        
        if (!couponData) {
          console.warn('⚠️ No coupon data received');
          this.createMockCoupon(deal);
          return;
        }

        // Extract coupon code (matching mobile app)
        this.couponCode = couponData.couponCode || 
                         couponData.code || 
                         `COUPON-${deal.id.substring(0, 8).toUpperCase()}`;
        
        // Extract coupon ID and redemption token (matching mobile app exactly)
        this.couponId = couponData.couponId || couponData._id || couponData.id || '';
        this.redemptionToken = couponData.redemptionToken || '';
        
        // Build vendor redemption URL or use QR code (MATCHING MOBILE APP EXACTLY)
        if (this.couponId && this.redemptionToken) {
          this.vendorRedemptionUrl = `https://admin.zavvi.co.in/redeem/${this.couponId}?token=${this.redemptionToken}`;
          this.qrCodeUrl = this.generateQRCodeUrl(this.vendorRedemptionUrl);
        } else {
          // Fallback to coupon code if no redemption credentials
          this.qrCodeUrl = this.generateQRCodeUrl(this.couponCode);
        }
        
        // Extract vendor contact
        this.vendorContact = couponData.shop?.contact || 
                            couponData.shop?.phone || 
                            this.vendorContact || '';
        
        // Log for debugging
        console.log('✅ Coupon Generated:', {
          couponCode: this.couponCode,
          couponId: this.couponId,
          hasRedemptionUrl: !!this.vendorRedemptionUrl,
          qrCodeUrl: this.qrCodeUrl ? 'Generated' : 'Missing',
        });
        
        // Save to redeemed coupons
        this.saveRedeemedCoupon(deal, couponData);
        
        // Hide loading immediately - QR URL is ready (matching mobile app)
        this.isGeneratingCoupon = false;
      },
      error: (error) => {
        console.error('Error generating coupon:', error);
        
        // Check if it's a golden coupon error
        if (error?.error?.isGoldenCoupon && error?.error?.alreadyRedeemed) {
          this.isGeneratingCoupon = false;
          this.modalService.warning('You have already redeemed this Golden Coupon', 'Already Redeemed');
          this.closeQRModal();
          return;
        }
        
        // If API fails, create a mock coupon for testing (matching mobile app)
        console.log('Creating mock coupon due to API error');
        this.createMockCoupon(deal);
      }
    });
  }

  // Helper function matching mobile app exactly
  private generateQRCodeUrl(data: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
  }

  private createMockCoupon(deal: any) {
    const mockCode = `MOCK-${deal.id.substring(0, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    this.couponCode = mockCode;
    this.qrCodeUrl = this.generateQRCodeUrl(mockCode);
    this.isGeneratingCoupon = false;
    
    console.log('🧪 Mock coupon created:', {
      couponCode: mockCode,
      qrCodeUrl: this.qrCodeUrl
    });
  }

  closeQRModal() {
    this.isQRModalOpen = false;
    this.selectedDeal = null;
    this.qrCodeUrl = '';
    this.couponCode = '';
    this.vendorRedemptionUrl = '';
    this.couponId = '';
    this.redemptionToken = '';
    this.isGeneratingCoupon = false;
  }

  copyCode() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.couponCode).then(() => {
        this.modalService.success('Coupon code copied to clipboard!', 'Copied');
      }).catch(err => {
        console.error('Failed to copy:', err);
        this.modalService.error('Failed to copy code. Please try again.', 'Copy Failed');
      });
    } else {
      this.modalService.error('Clipboard not available. Please copy manually.', 'Copy Failed');
    }
  }

  callVendor() {
    if (!this.vendorContact) {
      this.modalService.info('Vendor contact not available', 'No Contact');
      return;
    }

    if (typeof window !== 'undefined') {
      const cleanNumber = this.vendorContact.replace(/[^0-9+]/g, '');
      window.location.href = `tel:${cleanNumber}`;
    }
  }

  downloadQRCode() {
    if (!this.qrCodeUrl || typeof document === 'undefined') return;

    const link = document.createElement('a');
    link.href = this.qrCodeUrl;
    link.download = `coupon_${this.couponCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  navigateToMyCoupons() {
    console.log('🎫 Navigating to My Coupons');
    this.closeQRModal();
    this.router.navigate(['/redeemed-coupons']);
  }

  onImageError(event: Event, deal: any) {
    const target = event.target as HTMLImageElement;
    if (!target) return;
    
    console.error(`❌ Image failed to load for deal: "${deal?.title}"`, {
      attemptedUrl: target.src,
      dealObject: deal
    });
    const firstLetter = deal?.title ? deal.title.charAt(0).toUpperCase() : 'D';
    const fallbackUrl = `https://ui-avatars.com/api/?name=${firstLetter}&size=400&background=6C47FF&color=ffffff&bold=true&format=png`;
    console.log(`🔄 Using fallback avatar: ${fallbackUrl}`);
    target.src = fallbackUrl;
  }
  
  // Save redeemed coupon (matching mobile app structure)
  private saveRedeemedCoupon(deal: any, couponData: any) {
    // Use expiry from couponData if available
    const expiresAt = couponData.expiresAt || new Date(Date.now() + 600000); // Default 10 min

    const redeemedCouponData = {
      dealId: deal.id,
      shopId: this.shopId,
      couponCode: this.couponCode,
      qrCode: this.qrCodeUrl,
      expiresAt: expiresAt
    };

    console.log('Saving redeemed coupon:', redeemedCouponData);

    this.apiService.redeemCoupon(redeemedCouponData).subscribe({
      next: (response) => {
        console.log('Coupon saved successfully:', response);
        
        // Extract coupon ID and redemption token from the response
        const savedCoupon = response.data || response;
        if (savedCoupon) {
          this.couponId = savedCoupon._id || this.couponId;
          this.redemptionToken = savedCoupon.redemptionToken || this.redemptionToken;
          
          // Update vendor redemption URL if we didn't have it before (matching mobile app)
          if (this.couponId && this.redemptionToken && !this.vendorRedemptionUrl) {
            this.vendorRedemptionUrl = `https://admin.zavvi.co.in/redeem/${this.couponId}?token=${this.redemptionToken}`;
            
            // Update QR code to include the vendor redemption URL
            this.qrCodeUrl = this.generateQRCodeUrl(this.vendorRedemptionUrl);
            
            console.log('Updated vendor redemption URL from saved response:', this.vendorRedemptionUrl);
          }
        }
      },
      error: (error) => {
        console.error('Error saving redeemed coupon:', error);
        // Don't show error to user - this is a background operation
      }
    });
  }
  
  private showToast(message: string) {
    if (typeof document === 'undefined') {
      return;
    }
    
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(51, 51, 51, 0.95);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      max-width: 90%;
      text-align: center;
      font-size: 0.9375rem;
      font-weight: 600;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  // Track by function for better performance
  trackByDealId(index: number, deal: any): string {
    return deal.id || deal._id || index.toString();
  }
}
