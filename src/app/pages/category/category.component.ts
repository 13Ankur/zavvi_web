import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LocationService } from '../../services/location.service';
import { SeoService } from '../../services/seo.service';
import { environment } from '../../../environments/environment';

interface Shop {
  _id: string;
  title: string; // Changed from 'name' to 'title' to match mobile app
  name?: string; // Keep as optional fallback
  image?: string;
  imageUrl?: string;
  logo?: string;
  banner?: string;
  bannerImage?: string;
  description?: string;
  category: {
    _id: string;
    name: string;
    icon: string;
  };
  isPremium?: boolean;
}

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit {
  shops: Shop[] = [];
  categoryName = '';
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private locationService: LocationService,
    private location: Location,
    private router: Router,
    private seoService: SeoService
  ) { }

  ngOnInit() {
    const categorySlug = this.route.snapshot.paramMap.get('id');
    if (categorySlug) {
      this.loadCategoryShops(categorySlug);
    }
  }

  loadCategoryShops(categorySlug: string) {
    const locationId = this.locationService.getSelectedLocationId();

    console.log('📋 Loading shops for category:', categorySlug, 'location:', locationId);

    this.apiService.getShops({
      category: categorySlug,
      location: locationId
    }).subscribe({
      next: (shops) => {
        console.log('✅ Received shops:', shops.length);
        console.log('📦 Raw shops data:', shops);

        // Update SEO meta tags for category page
        if (shops.length > 0 && shops[0].category) {
          this.categoryName = shops[0].category.name;
          const location = this.locationService.getSelectedLocationName();
          this.seoService.setCategoryPageMeta(this.categoryName, location);
        }

        // Process shops to normalize image URLs - prioritize 'image' field like mobile app
        this.shops = shops.map((shop: Shop) => {
          // Get the primary image (try all possible fields)
          const rawImage = shop.image || shop.imageUrl || shop.banner || shop.bannerImage || shop.logo || '';

          const processedShop = {
            ...shop,
            image: this.getFullImageUrl(rawImage),
            logo: shop.logo ? this.getFullImageUrl(shop.logo) : undefined,
            banner: shop.banner ? this.getFullImageUrl(shop.banner) : undefined,
            isPremium: shop.isPremium || false
          };

          console.log(`🏪 Shop "${shop.title || shop.name}":`, {
            rawImage: shop.image,
            rawImageUrl: shop.imageUrl,
            rawLogo: shop.logo,
            rawBanner: shop.banner,
            rawBannerImage: shop.bannerImage,
            processedImage: processedShop.image
          });

          return processedShop;
        });

        console.log('🖼️ Processed shops with full image URLs:', this.shops);

        // Sort shops: Premium partners first, then regular partners
        this.sortShops();

        if (this.shops.length > 0 && this.shops[0].category) {
          this.categoryName = this.shops[0].category.name;
          console.log('📂 Category name from shops:', this.categoryName);

          // Check if this is an online category (web app)
          if ((this.shops[0].category as any).isOnline) {
            console.log('Online category detected from shop metadata, redirecting...');
            this.router.navigate(['/online-coupons', categorySlug]);
            return;
          }
        } else {
          // If no shops, we still need to check if the category itself is marked as online
          this.apiService.getCategory(categorySlug).subscribe({
            next: (category) => {
              if (category) {
                this.categoryName = category.name;
                if (category.isOnline) {
                  console.log('Online category detected from category API, redirecting...');
                  this.router.navigate(['/online-coupons', categorySlug]);
                }
              }
            }
          });
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading category shops:', error);
        this.isLoading = false;
      }
    });
  }

  sortShops() {
    // Sort shops with premium partners first, then regular partners
    this.shops.sort((a, b) => {
      // Premium partners come first
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;

      // If both are same type (both premium or both regular), sort alphabetically by title
      const aTitle = a.title || a.name || '';
      const bTitle = b.title || b.name || '';
      return aTitle.localeCompare(bTitle);
    });
  }

  navigateToShop(shopId: string) {
    // Router navigation is already handled by routerLink
  }

  refreshPage() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  goBack() {
    // Try to go back in history, if no history, go to home
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  // Convert relative image URLs to full URLs
  private getFullImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl) {
      console.log('⚠️ No image URL provided');
      return '';
    }

    // If already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log('✓ Image URL is already full:', imageUrl.substring(0, 50) + '...');
      return imageUrl;
    }

    // If it's a relative URL starting with /, prepend the API base URL
    if (imageUrl.startsWith('/')) {
      const baseUrl = environment.apiUrl.replace('/api', '');
      const fullUrl = `${baseUrl}${imageUrl}`;
      console.log('🔗 Converting relative URL:', imageUrl, '→', fullUrl);
      return fullUrl;
    }

    // If it's a relative path without leading /, prepend base URL with /
    const baseUrl = environment.apiUrl.replace('/api', '');
    const fullUrl = `${baseUrl}/${imageUrl}`;
    console.log('🔗 Converting relative path:', imageUrl, '→', fullUrl);
    return fullUrl;
  }

  // Handle image load errors with fallback
  onImageError(event: any, shopName: string) {
    console.log('❌ Image failed to load for shop:', shopName);

    const firstLetter = shopName ? shopName.charAt(0).toUpperCase() : 'S';
    const fallbackUrl = `https://ui-avatars.com/api/?name=${firstLetter}&size=400&background=6C47FF&color=fff&bold=true&format=png`;

    console.log('🔄 Using fallback avatar:', fallbackUrl);
    event.target.src = fallbackUrl;

    // Prevent infinite error loop
    event.target.onerror = null;
  }

  // Get shop image - prioritize 'image' field like mobile app
  getShopLogo(shop: Shop): string {
    console.log(`🖼️ getShopLogo for "${shop.title || shop.name}":`, {
      image: shop.image,
      imageUrl: shop.imageUrl,
      logo: shop.logo,
      banner: shop.banner,
      bannerImage: shop.bannerImage
    });

    // Priority order (same as mobile app):
    // 1. image
    // 2. imageUrl
    // 3. banner
    // 4. bannerImage
    // 5. logo
    // 6. fallback avatar

    const imageToUse = shop.image || shop.imageUrl || shop.banner || shop.bannerImage || shop.logo;

    if (imageToUse && imageToUse.trim() !== '' && imageToUse !== 'null') {
      console.log(`✓ Using image for ${shop.title || shop.name}:`, imageToUse);
      return imageToUse;
    }

    // Generate fallback avatar
    const shopName = shop.title || shop.name || 'Shop';
    const firstLetter = shopName.charAt(0).toUpperCase();
    const fallback = `https://ui-avatars.com/api/?name=${firstLetter}&size=400&background=6C47FF&color=fff&bold=true&format=png`;
    console.log(`⚠️ Using avatar fallback for ${shopName}:`, fallback);
    return fallback;
  }

  // Track by function for better performance
  trackByShopId(index: number, shop: Shop): string {
    return shop._id || index.toString();
  }
}
