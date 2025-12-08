import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';
import { environment } from '../../../environments/environment';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-redeemed-coupons',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './redeemed-coupons.component.html',
  styleUrls: ['./redeemed-coupons.component.scss']
})
export class RedeemedCouponsComponent implements OnInit {
  coupons: any[] = [];
  isLoading: boolean = true;
  selectedFilter: string = 'all';
  errorMessage: string = '';
  selectedCoupon: any = null;
  showDetailModal: boolean = false;
  canShare: boolean = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private location: Location,
    private seoService: SeoService
  ) {}

  ngOnInit() {
    console.log('🚀 Redeemed Coupons component initialized');
    
    // Set SEO meta tags (private page - noindex)
    this.seoService.setRedeemedCouponsPageMeta();
    
    // Check authentication
    const isLoggedIn = this.authService.isLoggedIn();
    console.log('🔐 User logged in:', isLoggedIn);
    
    if (!isLoggedIn) {
      console.log('⚠️ User not logged in, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    // Check if Web Share API is supported
    this.canShare = typeof navigator !== 'undefined' && 'share' in navigator;
    console.log('📱 Web Share API supported:', this.canShare);

    // Load coupons
    this.loadCoupons();
  }

  async loadCoupons(status?: string) {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('🔄 Loading coupons with status:', status || 'all');
    
    const params: any = {};
    if (status && status !== 'all') {
      params.status = status;
    }
    
    this.apiService.getRedeemedCoupons(params).subscribe({
      next: async (response) => {
        console.log('📦 Raw API response:', response);
        
        try {
          let couponsData: any[] = [];
          
          // Handle different response formats
          if (response && response.success !== undefined) {
            // Standard API response format: { success: true, data: [...] }
            if (response.success) {
              couponsData = response.data || [];
            } else {
              console.warn('API returned success: false', response);
              this.errorMessage = response.message || 'Failed to load coupons';
              this.coupons = [];
              this.isLoading = false;
              return;
            }
          } else if (Array.isArray(response)) {
            // Direct array response
            couponsData = response;
          } else if (response && response.data) {
            // Response with data property but no success flag
            couponsData = Array.isArray(response.data) ? response.data : [];
          } else {
            console.warn('❌ Unexpected response format:', response);
            couponsData = [];
          }
          
          console.log('📋 Processing', couponsData.length, 'coupons');
          
          // Generate QR codes for all coupons
          this.coupons = await Promise.all(couponsData.map(async (coupon, index) => {
            console.log(`🎫 Processing coupon ${index + 1}:`, {
              id: coupon._id,
              code: coupon.couponCode || coupon.code,
              shop: coupon.shop?.name || coupon.shopName,
              deal: coupon.deal?.title || coupon.dealTitle,
              status: coupon.status
            });
            
            // Determine the QR code data (matching mobile app logic)
            // PRIORITY 1: Use existing redemption URL if provided
            let qrData = coupon.redemptionUrl || coupon.vendorRedemptionUrl || '';
            
            // PRIORITY 2: Build vendor redemption URL from couponId and redemptionToken
            if (!qrData) {
              const couponId = coupon._id || coupon.id || coupon.couponId || '';
              const redemptionToken = coupon.redemptionToken || coupon.token || '';
              
              if (couponId && redemptionToken) {
                qrData = `https://admin.zavvi.co.in/redeem/${couponId}?token=${redemptionToken}`;
                console.log(`✅ Built vendor redemption URL for coupon ${index + 1}:`, qrData.substring(0, 50) + '...');
              }
            }
            
            // FALLBACK: Use coupon code only (vendor portal won't work)
            if (!qrData) {
              qrData = coupon.couponCode || coupon.code || coupon._id || '';
              console.log(`⚠️ Using coupon code for QR (no URL available) for coupon ${index + 1}`);
            }
            
            const qrCodeUrl = await this.generateQRCode(qrData);
            
            // Get shop logo with full URL
            const shopLogo = coupon.shop?.logo || coupon.shop?.image || coupon.shopLogo || '';
            const fullLogoUrl = shopLogo ? this.getFullImageUrl(shopLogo) : '';
            
            // Normalize the coupon data structure
            return {
              ...coupon,
              id: coupon._id || coupon.id,
              qrCodeUrl,
              displayCode: coupon.couponCode || coupon.code || 'N/A',
              shopName: coupon.shop?.name || coupon.shop?.title || coupon.shopName || 'Unknown Shop',
              shopLogo: fullLogoUrl,
              shopAddress: coupon.shop?.address || coupon.shopAddress || '',
              shopContact: coupon.shop?.contact || coupon.shop?.phone || coupon.shopContact || '',
              dealTitle: coupon.deal?.title || coupon.dealTitle || 'Exclusive Offer',
              discount: coupon.deal?.discount || coupon.discount || '',
              generatedAt: coupon.generatedAt || coupon.createdAt || new Date(),
              redeemedAt: coupon.redeemedAt || coupon.createdAt || new Date(),
              expiresAt: coupon.expiresAt || coupon.validUntil || null,
              usedAt: coupon.usedAt || null,
              status: this.determineStatus(coupon),
              terms: coupon.deal?.terms || coupon.terms || '',
              description: coupon.deal?.description || coupon.description || ''
            };
          }));
          
          // Sort coupons like mobile app
          this.sortCoupons();
          
          this.isLoading = false;
          console.log('✅ Coupons loaded successfully:', this.coupons.length);
          
          if (this.coupons.length === 0) {
            console.log('ℹ️ No coupons found for filter:', status || 'all');
          }
        } catch (error) {
          console.error('❌ Error processing coupons:', error);
          this.errorMessage = 'Error processing coupons. Please try again.';
          this.coupons = [];
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('❌ Error loading coupons:', error);
        
        // Provide more specific error messages
        if (error.status === 401) {
          this.errorMessage = 'Please log in to view your coupons';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else if (error.status === 0) {
          this.errorMessage = 'Network error. Please check your connection.';
        } else {
          this.errorMessage = error.message || 'Failed to load coupons. Please try again.';
        }
        
        this.coupons = [];
        this.isLoading = false;
      }
    });
  }
  
  private determineStatus(coupon: any): string {
    // Check if explicitly marked as used
    if (coupon.status === 'used' || coupon.usedAt) {
      return 'used';
    }
    
    // Check if expired
    if (coupon.expiresAt) {
      const expiryDate = new Date(coupon.expiresAt);
      const now = new Date();
      if (expiryDate < now) {
        return 'expired';
      }
    }
    
    // Default to active
    return coupon.status || 'active';
  }
  
  private sortCoupons() {
    // Sort coupons with this priority (same as mobile app):
    // 1. Active coupons (most recent first)
    // 2. Expired coupons
    // 3. Used coupons
    this.coupons.sort((a, b) => {
      // Get status priority (lower number = higher priority)
      const getStatusPriority = (status: string) => {
        switch (status) {
          case 'active': return 1;
          case 'expired': return 2;
          case 'used': return 3;
          default: return 4;
        }
      };

      const priorityA = getStatusPriority(a.status);
      const priorityB = getStatusPriority(b.status);

      // If different statuses, sort by priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If same status, sort by creation date (most recent first)
      const dateA = new Date(a.createdAt || a.generatedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.generatedAt || 0).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
    
    console.log('📊 Coupons sorted:', {
      active: this.coupons.filter(c => c.status === 'active').length,
      expired: this.coupons.filter(c => c.status === 'expired').length,
      used: this.coupons.filter(c => c.status === 'used').length
    });
  }

  async generateQRCode(data: string): Promise<string> {
    try {
      const qrCodeUrl = await QRCode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      return qrCodeUrl;
    } catch (error) {
      console.error('❌ Error generating QR code for:', data, error);
      // Return a fallback placeholder QR code
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5RUiBDb2RlPC90ZXh0Pjwvc3ZnPg==';
    }
  }

  filterCoupons(filter: string) {
    console.log('🔍 Filtering coupons by:', filter);
    this.selectedFilter = filter;
    this.loadCoupons(filter === 'all' ? undefined : filter);
  }

  getCouponStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'status-active',
      'used': 'status-used',
      'expired': 'status-expired',
      'redeemed': 'status-active'
    };
    return statusMap[status?.toLowerCase()] || 'status-default';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'Active',
      'used': 'Used',
      'expired': 'Expired',
      'redeemed': 'Active'
    };
    return statusMap[status?.toLowerCase()] || status;
  }

  viewCouponDetails(coupon: any) {
    console.log('👁️ Viewing coupon details:', coupon.displayCode);
    this.selectedCoupon = coupon;
    this.showDetailModal = true;
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedCoupon = null;
    document.body.style.overflow = 'auto';
  }

  copyCouponCode(code: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        this.showToast('Coupon code copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy:', err);
        this.showToast('Failed to copy code');
      });
    } else if (typeof document !== 'undefined') {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        this.showToast('Coupon code copied!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
      document.body.removeChild(textArea);
    }
  }

  downloadQRCode(coupon: any) {
    if (typeof document !== 'undefined' && coupon.qrCodeUrl) {
      const link = document.createElement('a');
      link.href = coupon.qrCodeUrl;
      link.download = `coupon-${coupon.displayCode}.png`;
      link.click();
      this.showToast('QR Code downloaded!');
    }
  }

  callShop(phoneNumber: string) {
    if (typeof window !== 'undefined' && phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    }
  }

  openGoogleMaps(address: string) {
    if (typeof window !== 'undefined' && address) {
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  }

  shareCoupon(coupon: any) {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }
    
    const shareData = {
      title: `${coupon.dealTitle} - ${coupon.shopName}`,
      text: `Coupon Code: ${coupon.displayCode}\n${coupon.discount}\nValid at: ${coupon.shopName}`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(err => console.log('Share failed:', err));
    } else {
      this.copyCouponCode(coupon.displayCode);
    }
  }

  printCoupon(coupon: any) {
    if (typeof window === 'undefined') {
      return;
    }
    
    // Store the coupon to print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Coupon - ${coupon.displayCode}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
            }
            .header { text-align: center; margin-bottom: 30px; }
            .qr-code { text-align: center; margin: 30px 0; }
            .qr-code img { max-width: 300px; }
            .coupon-code { 
              font-size: 32px; 
              font-weight: bold; 
              text-align: center; 
              padding: 20px; 
              background: #f0f0f0; 
              margin: 20px 0;
              letter-spacing: 3px;
            }
            .info { margin: 20px 0; }
            .info-label { font-weight: bold; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${coupon.shopName}</h1>
            <h2>${coupon.dealTitle}</h2>
            <h3>${coupon.discount}</h3>
          </div>
          <div class="qr-code">
            <img src="${coupon.qrCodeUrl}" alt="QR Code" />
          </div>
          <div class="coupon-code">${coupon.displayCode}</div>
          <div class="info">
            <p><span class="info-label">Shop:</span> ${coupon.shopName}</p>
            ${coupon.shopAddress ? `<p><span class="info-label">Address:</span> ${coupon.shopAddress}</p>` : ''}
            ${coupon.shopContact ? `<p><span class="info-label">Contact:</span> ${coupon.shopContact}</p>` : ''}
            <p><span class="info-label">Generated:</span> ${new Date(coupon.generatedAt).toLocaleString()}</p>
            ${coupon.expiresAt ? `<p><span class="info-label">Expires:</span> ${new Date(coupon.expiresAt).toLocaleString()}</p>` : ''}
          </div>
          ${coupon.terms ? `<div class="terms"><p><strong>Terms:</strong> ${coupon.terms}</p></div>` : ''}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }

  retryLoading() {
    console.log('🔄 Retrying coupon load');
    this.errorMessage = '';
    this.loadCoupons(this.selectedFilter === 'all' ? undefined : this.selectedFilter);
  }

  goToHome() {
    console.log('🏠 Navigating to home');
    this.router.navigate(['/']);
  }

  goBack() {
    console.log('⬅️ Going back');
    // Try to go back in history, if no history, go to home
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }
  
  // Utility to check if a coupon is expired
  isExpired(coupon: any): boolean {
    if (!coupon.expiresAt) return false;
    return new Date(coupon.expiresAt) < new Date();
  }
  
  // Format date for display
  formatDate(date: any): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }
  
  // Get relative time (e.g., "2 days ago")
  getRelativeTime(date: any): string {
    if (!date) return '';
    
    try {
      const now = new Date();
      const past = new Date(date);
      const diffMs = now.getTime() - past.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      } else {
        return 'Just now';
      }
    } catch (error) {
      return '';
    }
  }
  
  // Get time until expiry
  getExpiryTime(expiresAt: any): string {
    if (!expiresAt) return '';
    
    try {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diffMs = expiry.getTime() - now.getTime();
      
      if (diffMs < 0) return 'Expired';
      
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffDays > 0) {
        return `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        return `Expires in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
      } else if (diffMinutes > 0) {
        return `Expires in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
      } else {
        return 'Expiring soon!';
      }
    } catch (error) {
      return '';
    }
  }

  // Convert relative image URLs to full URLs
  private getFullImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    
    // If already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's a relative URL, prepend the API base URL
    if (imageUrl.startsWith('/')) {
      const baseUrl = environment.apiUrl.replace('/api', '');
      return `${baseUrl}${imageUrl}`;
    }
    
    // Otherwise return as is
    return imageUrl;
  }
  
  // Utility for image error fallback
  onImageError(event: any, shopName: string = 'Shop') {
    const fallbackUrl = `https://ui-avatars.com/api/?name=${shopName.charAt(0)}&size=100&background=6C47FF&color=fff`;
    event.target.src = fallbackUrl;
  }

  private showToast(message: string) {
    if (typeof document === 'undefined') {
      return;
    }
    
    // Simple toast implementation
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
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      max-width: 90%;
      text-align: center;
      font-size: 0.9375rem;
    `;
    document.body.appendChild(toast);
    
    // Fade in
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 10);
    
    // Fade out and remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
  
  // Track by function for better performance
  trackByCouponId(index: number, coupon: any): string {
    return coupon.id || coupon._id || index.toString();
  }
}
