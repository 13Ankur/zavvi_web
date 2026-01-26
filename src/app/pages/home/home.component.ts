import { Component, OnInit, OnDestroy, HostListener, ViewContainerRef, ComponentRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LocationService } from '../../services/location.service';
import { SeoService } from '../../services/seo.service';
import { locationsMatch } from '../../utils/location.utils';
import { SafeStorage } from '../../utils/platform.utils';
import { environment } from '../../../environments/environment';
import { LocationModalComponent } from '../../components/location-modal/location-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  private locationModalRef?: ComponentRef<LocationModalComponent>;
  searchTerm: string = '';
  allOffers: any[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  currentLocation: string = '';
  selectedLocation: any = null;
  selectedLocationId: string = '';
  locations: any[] = [];
  isLoadingLocations: boolean = false;
  private locationSubscription?: Subscription;
  private searchTimeout: any;
  bannerShops: any[] = [];
  currentSlideIndex = 0;
  slideInterval: any;
  categories: any[] = [];
  private prefetchTimeouts: Map<string, any> = new Map();

  // Loading states for different sections
  isLoadingBanners: boolean = false;
  isLoadingCategories: boolean = false;
  isLoadingOffers: boolean = false;

  // Mobile/Responsive state
  isMobile: boolean = false;
  isTablet: boolean = false;
  screenWidth: number = 0;

  // Category icon mapping
  categoryIcons: { [key: string]: string } = {
    'restaurant': '🍽️',
    'food': '🍕',
    'cafe': '☕',
    'fitness': '💪',
    'gym': '🏋️',
    'spa': '💆',
    'salon': '💇',
    'beauty': '💄',
    'shopping': '🛍️',
    'fashion': '👗',
    'electronics': '📱',
    'entertainment': '🎭',
    'movies': '🎬',
    'travel': '✈️',
    'hotel': '🏨',
    'health': '🏥',
    'dental': '🦷',
    'automotive': '🚗',
    'education': '📚',
    'jewellery': '💎',
    'default': '🎯'
  };

  constructor(
    public router: Router,
    private apiService: ApiService,
    public authService: AuthService,
    public locationService: LocationService, // Public for template access
    private seoService: SeoService,
    private viewContainerRef: ViewContainerRef
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  @HostListener('window:orientationchange', ['$event'])
  onOrientationChange(event: any) {
    // Handle orientation change
    setTimeout(() => {
      this.checkScreenSize();
      this.adjustLayoutForOrientation();
    }, 100);
  }

  checkScreenSize() {
    if (typeof window !== 'undefined') {
      this.screenWidth = window.innerWidth;
      this.isMobile = this.screenWidth < 768;
      this.isTablet = this.screenWidth >= 768 && this.screenWidth < 1024;
    } else {
      // Default values for SSR
      this.screenWidth = 1024;
      this.isMobile = false;
      this.isTablet = false;
    }
  }

  adjustLayoutForOrientation() {
    // Adjust layout elements based on orientation
    if (typeof window !== 'undefined') {
      const isLandscape = window.innerHeight < window.innerWidth;
      if (isLandscape && this.isMobile) {
        // Mobile landscape adjustments
        console.log('Mobile landscape mode detected');
      }
    }
  }

  ngOnInit() {
    // CRITICAL: Check location FIRST before loading anything
    if (!this.locationService.hasSelectedLocation()) {
      console.log('📍 HomePage: No location selected - showing modal and blocking app');
      // Show location modal and BLOCK app from loading
      this.checkAndShowLocationModal();
      // Don't load anything until location is selected
      return;
    }

    console.log('📍 HomePage: Location already selected - loading app normally');

    // Show loading state
    this.isLoading = true;
    this.errorMessage = '';

    // Subscribe to location changes to reload offers
    this.locationSubscription = this.locationService.selectedLocation$.subscribe(location => {
      console.log('====================================');
      console.log('HomePage: Location subscription triggered');
      console.log('HomePage: New location:', location?.name, 'ID:', location?.id);
      console.log('HomePage: Current location:', this.selectedLocation?.name, 'ID:', this.selectedLocation?.id);

      if (location) {
        const locationId = location.id || (location as any).slug;
        const currentId = this.selectedLocation?.id || (this.selectedLocation as any)?.slug;

        console.log('HomePage: Comparing IDs - New:', locationId, 'Current:', currentId);

        // Only reload if location actually changed
        if (!this.selectedLocation || locationId !== currentId) {
          console.log('✅ HomePage: Location CHANGED - Updating UI and reloading offers');
          console.log('HomePage: Updating from', this.selectedLocation?.name || 'none', 'to', location.name);

          this.selectedLocation = location;
          this.selectedLocationId = locationId;
          this.currentLocation = location.name;

          // Update SEO meta tags with location
          this.seoService.setHomePageMeta(location.name);

          // Reload offers when location changes
          console.log('🔄 HomePage: Calling loadOffers() for', location.name);
          this.loadAllData();
        } else {
          console.log('⏭️  HomePage: Location UNCHANGED - Skipping reload');
        }
      } else {
        console.log('⚠️  HomePage: No location provided to subscription');
      }
      console.log('====================================');
    });

    // Load locations once (this will set the default location and trigger the subscription above)
    console.log('HomePage: Initializing - Loading locations...');
    this.loadLocations();
  }

  /**
   * Load all data with proper error handling
   */
  loadAllData() {
    this.errorMessage = '';
    this.loadCategories();
    this.loadOffers();
    this.loadFeaturedShops();
  }

  /**
   * Retry loading all data
   */
  retryLoading() {
    this.isLoading = true;
    this.errorMessage = '';
    this.loadLocations();
  }

  /**
   * Go to home (reset state)
   */
  goToHome() {
    this.searchTerm = '';
    this.errorMessage = '';
    this.retryLoading();
  }

  ngOnDestroy() {
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
    // Clear location modal if exists
    if (this.locationModalRef) {
      this.locationModalRef.destroy();
    }
    // Clear all prefetch timeouts
    this.prefetchTimeouts.forEach(timeout => clearTimeout(timeout));
    this.prefetchTimeouts.clear();
  }

  loadLocations() {
    this.isLoadingLocations = true;
    this.isLoading = true;

    this.apiService.getLocations().subscribe({
      next: (locations) => {
        if (locations && locations.length > 0) {
          this.locations = locations;

          // Check if there's a stored location first
          const storedLocation = SafeStorage.getItem('selectedLocation');
          if (storedLocation) {
            try {
              const stored = JSON.parse(storedLocation);
              if (stored && stored.id) {
                const matchingLocation = locations.find((loc: any) => loc.id === stored.id);
                if (matchingLocation) {
                  this.selectedLocation = matchingLocation;
                  this.selectedLocationId = matchingLocation.id;
                  this.currentLocation = matchingLocation.name;
                  this.locationService.setSelectedLocation(matchingLocation);
                  this.isLoadingLocations = false;
                  return;
                }
              }
            } catch (error) {
              console.error('Error parsing stored location:', error);
            }
          }

          // Do NOT auto-select any location. User must choose via modal.
          if (!this.selectedLocation) {
            console.warn('Home: No selected location after load. User must select manually.');
            this.isLoadingLocations = false;
            this.isLoading = false;
            return;
          } else {
            if (!this.selectedLocationId && this.selectedLocation) {
              this.selectedLocationId = this.selectedLocation.id || this.selectedLocation.slug;
            }
            if (this.selectedLocation) {
              this.loadCategories();
              this.loadOffers();
              this.loadFeaturedShops();
            }
          }
        } else {
          console.warn('No locations available from API');
          this.locations = [];
          this.errorMessage = 'No locations available. Please contact support.';
        }
        this.isLoadingLocations = false;
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.locations = [];
        this.errorMessage = 'Failed to load locations. Please check your internet connection and try again.';
        this.isLoadingLocations = false;
        this.isLoading = false;
      }
    });
  }

  loadOffers() {
    this.isLoadingOffers = true;
    this.errorMessage = '';

    const locationName = this.locationService.getSelectedLocationName();
    console.log('🔍 Loading offers for location:', locationName);

    const params: any = {};
    if (locationName && locationName.trim() !== '') {
      params.location = locationName;
    }

    this.apiService.getShops(params).subscribe({
      next: (shops) => {
        try {
          console.log('📦 Raw shops response:', shops);

          if (!shops) {
            console.warn('⚠️ Shops response is null or undefined');
            this.allOffers = [];
            this.isLoadingOffers = false;
            this.checkAllLoadingComplete();
            return;
          }

          let shopsArray: any[] = [];

          if (Array.isArray(shops)) {
            shopsArray = shops;
          } else if (shops.data && Array.isArray(shops.data)) {
            shopsArray = shops.data;
          } else if (shops.shops && Array.isArray(shops.shops)) {
            shopsArray = shops.shops;
          } else {
            console.warn('⚠️ Unexpected shops response structure:', shops);
            this.allOffers = [];
            this.isLoadingOffers = false;
            this.checkAllLoadingComplete();
            return;
          }

          console.log('📊 Shops array length:', shopsArray.length);

          if (shopsArray.length === 0) {
            console.log('⚠️ No shops found in the response');
            this.allOffers = [];
            this.isLoadingOffers = false;
            this.checkAllLoadingComplete();
            return;
          }

          // Filter shops by location if location is selected
          let locationFilteredShops = shopsArray;
          if (locationName && locationName.trim() !== '') {
            console.log('🔍 Filtering shops by location:', locationName);

            locationFilteredShops = shopsArray.filter((shop: any) => {
              const shopLocation = shop.location || shop.locations;
              if (!shopLocation) {
                console.log('⚠️ Shop has no location:', shop);
                return false;
              }

              if (Array.isArray(shopLocation)) {
                const hasMatch = shopLocation.some(loc => {
                  const locName = typeof loc === 'string' ? loc : loc.name || loc.location;
                  const matches = locationsMatch(locName, locationName);
                  if (matches) {
                    console.log('✅ Location match found:', locName, '===', locationName);
                  }
                  return matches;
                });
                return hasMatch;
              } else {
                const locName = typeof shopLocation === 'string' ? shopLocation : shopLocation.name || shopLocation.location;
                const matches = locationsMatch(locName, locationName);
                if (matches) {
                  console.log('✅ Location match found:', locName, '===', locationName);
                }
                return matches;
              }
            });
          }

          console.log('✅ Filtered shops count:', locationFilteredShops.length);

          // If searching, show ALL matching shops
          // If not searching, get one shop from each category for featured offers
          if (this.searchTerm && this.searchTerm.trim() !== '') {
            console.log('🔍 Search mode: Showing all matching shops');

            this.allOffers = locationFilteredShops.map((shop: any) => ({
              id: shop._id || shop.id,
              title: shop.title || shop.name || 'Untitled',
              discount: shop.discount || shop.discountPercentage || '0%',
              image: shop.image || shop.imageUrl || shop.bannerImage || '',
              category: shop.category,
              shop: shop
            }));
          } else {
            console.log('📂 Featured mode: Showing one shop per category');

            // Get one shop from each category for featured offers
            const categoryMap = new Map();
            locationFilteredShops.forEach((shop: any) => {
              const categoryId = shop.category?._id || shop.category || 'uncategorized';
              if (!categoryMap.has(categoryId)) {
                categoryMap.set(categoryId, shop);
              }
            });

            console.log('📂 Categories found:', categoryMap.size);

            // Filter to show only premium partners in Exclusive Offers
            const premiumShops = Array.from(categoryMap.values()).filter((shop: any) => shop.isPremium === true);

            this.allOffers = premiumShops.map((shop: any) => ({
              id: shop._id || shop.id,
              title: shop.title || shop.name || 'Untitled',
              discount: shop.discount || shop.discountPercentage || '0%',
              image: shop.image || shop.imageUrl || shop.bannerImage || '',
              category: shop.category,
              shop: shop
            }));

            console.log('✨ Premium partners in Exclusive Offers:', this.allOffers.length);
          }

          console.log('🎯 Final offers count:', this.allOffers.length);
          console.log('📋 Offers:', this.allOffers.map(o => o.title));
          this.isLoadingOffers = false;
          this.checkAllLoadingComplete();
        } catch (error) {
          console.error('Error processing shops data:', error);
          this.errorMessage = 'Error loading offers. Please try again.';
          this.isLoadingOffers = false;
          this.checkAllLoadingComplete();
        }
      },
      error: (error) => {
        console.error('Error loading shops:', error);
        this.errorMessage = 'Failed to load offers. Please check your internet connection and try again.';
        this.isLoadingOffers = false;
        this.checkAllLoadingComplete();
      }
    });
  }

  /**
   * Check if all data has finished loading
   */
  checkAllLoadingComplete() {
    if (!this.isLoadingBanners && !this.isLoadingCategories && !this.isLoadingOffers && !this.isLoadingLocations) {
      // Small delay for smooth transition
      setTimeout(() => {
        this.isLoading = false;
      }, 300);
    }
  }

  loadFeaturedShops() {
    this.isLoadingBanners = true;
    const locationName = this.locationService.getSelectedLocationName();

    const params: any = {};
    if (locationName && locationName.trim() !== '') {
      params.location = locationName;
    }

    this.apiService.getFeaturedShops(params).subscribe({
      next: (shops) => {
        if (shops && Array.isArray(shops)) {
          this.bannerShops = shops
            .map((shop: any) => ({
              id: shop._id || shop.id,
              title: shop.title || shop.name,
              discount: shop.discount,
              image: shop.image || shop.bannerImage || shop.logo,
              logo: shop.logo,
              isPremium: shop.isPremium // Map premium status
            }))
            .filter((shop: any) => shop.isPremium === true);
        } else {
          console.warn('Featured shops response is not an array:', shops);
          this.bannerShops = [];
        }
        if (this.bannerShops.length > 0) {
          this.startSlider();
        }
        this.isLoadingBanners = false;
        this.checkAllLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading featured shops:', error);
        this.bannerShops = [];
        this.isLoadingBanners = false;
        this.checkAllLoadingComplete();
      }
    });
  }

  startSlider() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }

    // Auto-advance slides every 5 seconds
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  nextSlide() {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.bannerShops.length;
  }

  prevSlide() {
    this.currentSlideIndex = this.currentSlideIndex === 0
      ? this.bannerShops.length - 1
      : this.currentSlideIndex - 1;
  }

  goToSlide(index: number) {
    this.currentSlideIndex = index;
    // Reset auto-advance timer
    this.startSlider();
  }

  onImageError(event: any, offer: any) {
    const firstLetter = offer?.title ? offer.title.charAt(0).toUpperCase() : 'O';
    event.target.src = `https://ui-avatars.com/api/?name=${firstLetter}&size=400&background=6C47FF&color=ffffff&bold=true&format=png`;
  }

  navigateToOffer(offerId: string) {
    if (offerId) {
      this.router.navigate(['/shop', offerId]);
    }
  }

  loadCategories() {
    this.isLoadingCategories = true;

    this.apiService.getCategories().subscribe({
      next: (categories) => {
        if (categories && Array.isArray(categories)) {
          this.categories = categories.map((cat: any) => ({
            ...cat,
            materialIcon: this.mapIonicToMaterialIcon(cat.icon) // Add Material Icon mapping
          }));
          console.log('✅ Categories loaded with Material Icons:', this.categories);
        } else {
          console.warn('Categories response is not an array:', categories);
          this.categories = [];
        }
        this.isLoadingCategories = false;
        this.checkAllLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categories = [];
        this.isLoadingCategories = false;
        this.checkAllLoadingComplete();
      }
    });
  }

  /**
   * Map Ionic icon names (from API) to Google Material Icons
   * Mobile app uses: <ion-icon name="restaurant"></ion-icon>
   * Web uses: <span class="material-icons">restaurant</span>
   */
  mapIonicToMaterialIcon(ionicIcon: string): string {
    if (!ionicIcon) return 'category';

    // Remove -outline suffix if present (Ionic uses both restaurant and restaurant-outline)
    const cleanIcon = ionicIcon.replace('-outline', '').toLowerCase();

    const iconMap: { [key: string]: string } = {
      // Food & Dining
      'restaurant': 'restaurant',
      'pizza': 'local_pizza',
      'cafe': 'local_cafe',
      'fast-food': 'fastfood',
      'beer': 'local_bar',
      'wine': 'local_bar',
      'ice-cream': 'icecream',

      // Health & Wellness
      'fitness': 'fitness_center',
      'barbell': 'fitness_center',
      'spa': 'spa',
      'medkit': 'local_hospital',
      'medical': 'medical_services',
      'heart': 'favorite',
      'pulse': 'monitor_heart',

      // Beauty & Grooming
      'cut': 'content_cut',
      'scissors': 'content_cut',
      'color-palette': 'face_retouching_natural',
      'brush': 'face_retouching_natural',

      // Auto & Transport
      'car': 'directions_car',
      'car-sport': 'directions_car',
      'build': 'build',

      // Fashion & Retail
      'shirt': 'checkroom',
      'bag': 'shopping_bag',
      'cart': 'shopping_cart',
      'storefront': 'store',

      // Home & Services
      'home': 'home',
      'hammer': 'handyman',
      'construct': 'construction',

      // Entertainment
      'film': 'movie',
      'game-controller': 'sports_esports',
      'musical-notes': 'music_note',
      'tv': 'tv',

      // Education & Books
      'school': 'school',
      'book': 'menu_book',
      'library': 'local_library',

      // Pets
      'paw': 'pets',

      // Technology
      'phone-portrait': 'phone_iphone',
      'laptop': 'laptop',
      'desktop': 'computer',

      // Gifts & Special
      'gift': 'card_giftcard',
      'balloon': 'celebration',

      // Nature
      'leaf': 'eco',
      'flower': 'local_florist',

      // Trending
      'trending-up': 'trending_up',
      'flash': 'flash_on',
      'flame': 'local_fire_department',
      'star': 'star',

      // Default fallback
      'ellipse': 'category'
    };

    return iconMap[cleanIcon] || 'category';
  }

  getCategoryIcon(iconName: string): string {
    if (!iconName) return this.categoryIcons['default'];
    const iconKey = iconName.toLowerCase();
    return this.categoryIcons[iconKey] || this.categoryIcons['default'];
  }

  getCategoryMaterialIcon(iconName: string): string {
    // Deprecated - use mapIonicToMaterialIcon instead
    return this.mapIonicToMaterialIcon(iconName);
  }

  navigateToCategory(categoryId: string) {
    if (categoryId) {
      this.router.navigate(['/category', categoryId]);
    }
  }

  /**
   * Prefetch category data on hover
   */
  onCategoryHover(categorySlug: string) {
    if (!this.isMobile) { // Only prefetch on desktop
      const timeoutId = setTimeout(() => {
        const location = this.locationService.getSelectedLocationName();
        this.apiService.prefetchCategoryData(categorySlug, location);
      }, 200);
      this.prefetchTimeouts.set(categorySlug, timeoutId);
    }
  }

  /**
   * Cancel prefetch if user leaves quickly
   */
  onCategoryLeave(categorySlug: string) {
    const timeoutId = this.prefetchTimeouts.get(categorySlug);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.prefetchTimeouts.delete(categorySlug);
    }
  }

  /**
   * Prefetch on touch for mobile (on touchstart, not tap)
   */
  onCategoryTouch(categorySlug: string) {
    if (this.isMobile) {
      const location = this.locationService.getSelectedLocationName();
      this.apiService.prefetchCategoryData(categorySlug, location);
    }
  }

  onSearchChange(event: any) {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.loadOffers();
    }, 300);
  }

  onMobileLocationChange(locationId: string) {
    const location = this.locations.find(loc => loc.id === locationId);
    if (location) {
      this.locationService.setSelectedLocation(location);
      // Reload page to apply location change
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  }

  get offers() {
    return this.allOffers;
  }

  /**
   * Check and show location modal on first visit
   * CRITICAL: BLOCKS app from loading until location is selected
   */
  private checkAndShowLocationModal() {
    console.log('📍 HomePage: BLOCKING - No location selected, showing modal...');

    // Small delay to ensure page has loaded
    setTimeout(() => {
      this.showLocationModal();
    }, 500);
  }

  /**
   * Show location selection modal
   * BLOCKS entire app until user selects location
   */
  private showLocationModal() {
    console.log('📍 HomePage: Creating BLOCKING location modal...');

    try {
      // Create modal component dynamically
      this.locationModalRef = this.viewContainerRef.createComponent(LocationModalComponent);

      // Append to body
      if (typeof document !== 'undefined') {
        document.body.appendChild(this.locationModalRef.location.nativeElement);
      }

      console.log('📍 HomePage: Location modal created - app is BLOCKED');

      // Subscribe to location changes to reload page after selection
      const locationSub = this.locationService.selectedLocation$.subscribe(location => {
        if (location) {
          console.log('📍 HomePage: Location selected! Reloading app...');
          // Location selected - reload the page to start app properly
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
          locationSub.unsubscribe();
        }
      });

    } catch (error) {
      console.error('📍 HomePage: Error creating location modal:', error);
    }
  }
}
