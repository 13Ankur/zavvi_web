import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';
import * as QRCode from 'qrcode';
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
      console.log('✅ Found deal, triggering auto-claim:', deal.title);
      // Trigger the direct claim action (bypass detail page)
      this.directClaimDeal(deal);
    } else {
      console.warn('⚠️ Deal not found for auto-claim:', dealId);
      // If deal not found yet, wait a bit more and try again
      setTimeout(() => {
        const retryDeal = this.deals.find(d => 
          (d.id === dealId) || (d._id === dealId) || (d.dealId === dealId)
        );
        if (retryDeal) {
          console.log('✅ Found deal on retry, triggering auto-claim:', retryDeal.title);
          this.directClaimDeal(retryDeal);
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
    console.log('🎯 View Deal Details clicked:', deal.title);
    
    // Navigate to deal detail page (matching mobile app flow)
    this.router.navigate(['/deal-detail'], {
      state: {
        deal: deal,
        shopId: this.shopId,
        shopName: this.shopName
      }
    });
  }

  // Keep this method for auto-claim after login
  async directClaimDeal(deal: any) {
    console.log('🎯 Direct Claim Deal (auto-claim):', deal.title);
    
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
        console.log('📦 Generate API Response:', JSON.stringify(couponData, null, 2));
        
        if (!couponData) {
          console.warn('⚠️ No coupon data received');
          this.isGeneratingCoupon = false;
          this.modalService.error('Failed to generate coupon. Please try again.', 'Error');
          this.closeQRModal();
          return;
        }

        // Extract coupon code (MATCHING MOBILE APP EXACTLY)
        this.couponCode = couponData.couponCode || 
                         couponData.code || 
                         `COUPON-${deal.id.substring(0, 8).toUpperCase()}`;
        
        // Extract vendor contact
        this.vendorContact = couponData.shop?.contact || 
                            couponData.shop?.phone || 
                            this.vendorContact || '';
        
        // Extract shop ID from coupon data (MATCHING MOBILE APP - line 193)
        const shopIdFromCoupon = couponData.shop?.id || couponData.shop?._id || couponData.shopId || this.shopId;
        
        console.log('📋 Extracted from generate response:', {
          couponCode: this.couponCode,
          shopIdFromCoupon: shopIdFromCoupon,
          vendorContact: this.vendorContact
        });
        
        // IMPORTANT: Save to redeemed coupons FIRST to get redemptionToken
        // The redemptionToken is generated during save, not during generate
        this.saveAndGenerateQR(deal, couponData, shopIdFromCoupon);
      },
      error: (error) => {
        console.error('Error generating coupon:', error);
        this.isGeneratingCoupon = false;
        
        // Check if it's a golden coupon error
        if (error?.error?.isGoldenCoupon && error?.error?.alreadyRedeemed) {
          this.modalService.warning('You have already redeemed this Golden Coupon', 'Already Redeemed');
          this.closeQRModal();
          return;
        }
        
        // Check for deal expired
        if (error?.message?.includes('expired') || error?.error?.message?.includes('expired')) {
          this.modalService.warning('This deal has expired.', 'Deal Expired');
          this.closeQRModal();
          return;
        }
        
        // Show proper error message instead of creating mock coupon
        const errorMessage = error?.error?.message || error?.message || 'Failed to generate coupon. Please try again.';
        this.modalService.error(errorMessage, 'Error');
        this.closeQRModal();
      }
    });
  }

  // Save coupon and generate QR code with redemption URL (MATCHING MOBILE APP FLOW)
  private async saveAndGenerateQR(deal: any, couponData: any, shopIdFromCoupon: string) {
    // Use expiry from couponData if available (backend calculates proper expiry based on deal validity)
    // Don't use a short default - the backend will calculate proper expiry from deal.validUntil
    const expiresAt = couponData.expiresAt; // Let backend decide if not provided

    // Generate temporary QR for coupon code
    const tempQR = await this.generateQRCodeUrl(this.couponCode);

    // Build request data EXACTLY like mobile app (generate-qr.page.ts lines 404-410)
    const redeemedCouponData: any = {
      dealId: deal.id,
      shopId: shopIdFromCoupon, // Use shopId from couponData like mobile app
      couponCode: this.couponCode,
      qrCode: tempQR // Mobile app passes qrCodeUrl here
    };
    
    // Only include expiresAt if available from couponData
    if (expiresAt) {
      redeemedCouponData.expiresAt = expiresAt;
    }

    console.log('💾 Saving coupon to get redemption token:', JSON.stringify(redeemedCouponData, null, 2));

    this.apiService.redeemCoupon(redeemedCouponData).subscribe({
      next: async (response) => {
        console.log('✅ Coupon saved, FULL response:', JSON.stringify(response, null, 2));
        
        // Extract coupon ID and redemption token from the SAVE response
        // The response format is: { success: true, message: '...', data: { _id, redemptionToken, ... } }
        const savedCoupon = response?.data || response;
        
        console.log('🔍 savedCoupon object:', JSON.stringify(savedCoupon, null, 2));
        
        if (savedCoupon) {
          // Extract coupon ID (this is the RedeemedCoupon ID, NOT the temporary Coupon ID)
          this.couponId = savedCoupon._id || savedCoupon.id || '';
          // Extract redemption token (generated by backend during save)
          this.redemptionToken = savedCoupon.redemptionToken || '';
          
          console.log('🔑 Extracted credentials:', {
            couponId: this.couponId,
            redemptionToken: this.redemptionToken ? `${this.redemptionToken.substring(0, 10)}...` : 'MISSING!',
            tokenLength: this.redemptionToken?.length || 0
          });
          
          // Build vendor redemption URL with the token from save response
          if (this.couponId && this.redemptionToken) {
            // This is the URL format the vendor portal expects
            this.vendorRedemptionUrl = `https://admin.zavvi.co.in/redeem/${this.couponId}?token=${this.redemptionToken}`;
            console.log('🔗 Full vendor redemption URL:', this.vendorRedemptionUrl);
            console.log('📏 URL length:', this.vendorRedemptionUrl.length, 'characters');
            
            // Generate QR code with full URL using local library (not external API)
            this.qrCodeUrl = await this.generateQRCodeUrl(this.vendorRedemptionUrl);
            console.log('✅ QR Code generated successfully');
          } else {
            // Fallback to coupon code only (vendor portal won't work)
            console.error('❌ CRITICAL: No redemption token received! QR will not work for vendors.');
            console.error('Response was:', JSON.stringify(response, null, 2));
            this.qrCodeUrl = await this.generateQRCodeUrl(this.couponCode);
          }
        } else {
          // Fallback if no saved coupon data
          console.error('❌ CRITICAL: No saved coupon data returned!');
          this.qrCodeUrl = await this.generateQRCodeUrl(this.couponCode);
        }
        
        // Now hide loading - QR is ready with proper URL
        this.isGeneratingCoupon = false;
      },
      error: async (error) => {
        console.error('❌ Error saving coupon:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        // Fallback to coupon code QR if save fails
        this.qrCodeUrl = await this.generateQRCodeUrl(this.couponCode);
        this.isGeneratingCoupon = false;
      }
    });
  }

  // Helper function to generate QR code using local library (not external API)
  private async generateQRCodeUrl(data: string): Promise<string> {
    try {
      // Generate QR code as data URL using QRCode library
      const qrDataUrl = await QRCode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Fallback to external API if library fails
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
    }
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
