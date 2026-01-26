import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LocationService } from '../../services/location.service';
import { SeoService } from '../../services/seo.service';
import { Deal } from '../../models/models';

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './deals.component.html',
  styleUrls: ['./deals.component.scss']
})
export class DealsComponent implements OnInit {
  deals: any[] = [];
  filteredDeals: any[] = [];
  isLoading = true;
  errorMessage = '';
  searchTerm = '';
  selectedFilter: 'all' | 'golden' | 'featured' = 'all';

  constructor(
    private apiService: ApiService,
    private locationService: LocationService,
    private router: Router,
    private location: Location,
    private seoService: SeoService
  ) { }

  ngOnInit() {
    // Set SEO meta tags for premium deals page
    const location = this.locationService.getSelectedLocationName();
    this.seoService.setPremiumDealsPageMeta(location);

    this.loadDeals();
  }

  loadDeals() {
    this.isLoading = true;
    this.errorMessage = '';

    const locationId = this.locationService.getSelectedLocationId();

    // Get all deals (featured/premium)
    this.apiService.getDeals({
      location: locationId,
      featured: true
    }).subscribe({
      next: (response: any) => {
        try {
          let dealsData: any[] = [];

          // Handle different response formats
          if (response && response.success) {
            dealsData = response.data || [];
          } else if (Array.isArray(response)) {
            dealsData = response;
          } else if (response && response.data) {
            dealsData = response.data;
          } else {
            dealsData = [];
          }

          // Process deals and add necessary properties
          this.deals = dealsData
            .map((deal: any) => ({
              _id: deal._id || deal.id,
              title: deal.title || 'Exclusive Deal',
              description: deal.description || '',
              discount: deal.discount || '',
              image: deal.image || deal.banner || '',
              shop: deal.shop ? {
                _id: deal.shop._id || deal.shop.id,
                name: deal.shop.name || deal.shop.title || 'Shop',
                logo: deal.shop.logo || '',
                banner: deal.shop.banner || '',
                isPremium: deal.shop.isPremium || false
              } : null,
              category: deal.category || null,
              location: deal.location || '',
              validUntil: deal.validUntil || deal.expiresAt || null,
              isGoldenCoupon: deal.isGoldenCoupon || false,
              isFeatured: deal.isFeatured || deal.featured || false,
              terms: deal.terms || '',
              maxRedemptions: deal.maxRedemptions || null,
              currentRedemptions: deal.currentRedemptions || 0
            }))
            // Filter to show only premium partner deals
            .filter((deal: any) => deal.shop && deal.shop.isPremium === true);

          // Sort: Golden coupons first, then featured, then regular
          this.sortDeals();

          // Initialize filtered deals
          this.filteredDeals = [...this.deals];

          this.isLoading = false;

          console.log('✅ Loaded', this.deals.length, 'premium deals');
          console.log('🏆 Golden deals:', this.deals.filter(d => d.isGoldenCoupon).length);
        } catch (error) {
          console.error('Error processing deals:', error);
          this.errorMessage = 'Error processing deals data';
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error('Error loading deals:', error);
        this.errorMessage = error.error?.message || 'Failed to load premium deals. Please try again.';
        this.isLoading = false;
      }
    });
  }

  sortDeals() {
    this.deals.sort((a, b) => {
      // Golden coupons first
      if (a.isGoldenCoupon && !b.isGoldenCoupon) return -1;
      if (!a.isGoldenCoupon && b.isGoldenCoupon) return 1;

      // Then featured
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;

      // Then by title
      return (a.title || '').localeCompare(b.title || '');
    });
  }

  setFilter(filter: 'all' | 'golden' | 'featured') {
    this.selectedFilter = filter;
    this.filterDeals();
  }

  filterDeals() {
    let filtered = [...this.deals];

    // Apply filter
    switch (this.selectedFilter) {
      case 'golden':
        filtered = filtered.filter(deal => deal.isGoldenCoupon);
        break;
      case 'featured':
        filtered = filtered.filter(deal => deal.isFeatured);
        break;
      case 'all':
      default:
        // No filter
        break;
    }

    // Apply search
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(deal => {
        const titleMatch = (deal.title || '').toLowerCase().includes(searchLower);
        const descMatch = (deal.description || '').toLowerCase().includes(searchLower);
        const shopMatch = deal.shop && (deal.shop.name || '').toLowerCase().includes(searchLower);
        const categoryMatch = deal.category && (deal.category.name || '').toLowerCase().includes(searchLower);

        return titleMatch || descMatch || shopMatch || categoryMatch;
      });
    }

    this.filteredDeals = filtered;
  }

  clearFilters() {
    this.selectedFilter = 'all';
    this.searchTerm = '';
    this.filteredDeals = [...this.deals];
  }

  viewDealDetails(deal: any) {
    if (deal.shop && deal.shop._id) {
      // Navigate to shop details page
      this.router.navigate(['/shop', deal.shop._id]);
    } else if (deal._id) {
      // Navigate to deal details page if available
      // this.router.navigate(['/deal', deal._id]);
      console.log('Deal ID:', deal._id, '- No shop associated');
    }
  }

  getDealImage(deal: any): string {
    if (deal.image) {
      return deal.image.startsWith('http')
        ? deal.image
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(deal.title.charAt(0))}&size=400&background=6C47FF&color=fff`;
    }

    if (deal.shop && deal.shop.banner) {
      return deal.shop.banner;
    }

    const firstLetter = deal.title ? deal.title.charAt(0).toUpperCase() : 'D';
    return `https://ui-avatars.com/api/?name=${firstLetter}&size=400&background=6C47FF&color=ffffff&bold=true&format=png`;
  }

  getShopLogo(shop: any): string {
    if (shop.logo) {
      return shop.logo;
    }

    const firstLetter = shop.name ? shop.name.charAt(0).toUpperCase() : 'S';
    return `https://ui-avatars.com/api/?name=${firstLetter}&size=80&background=6C47FF&color=fff`;
  }

  onImageError(event: any, deal: any) {
    const firstLetter = deal.title ? deal.title.charAt(0).toUpperCase() : 'D';
    event.target.src = `https://ui-avatars.com/api/?name=${firstLetter}&size=400&background=6C47FF&color=ffffff&bold=true&format=png`;
  }

  onShopLogoError(event: any, shop: any) {
    const firstLetter = shop.name ? shop.name.charAt(0).toUpperCase() : 'S';
    event.target.src = `https://ui-avatars.com/api/?name=${firstLetter}&size=80&background=6C47FF&color=fff`;
  }

  retryLoading() {
    this.loadDeals();
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  goBack() {
    // Try to go back in history, if no history, go to home
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  // Track by function for better performance
  trackByDealId(index: number, deal: any): string {
    return deal._id || deal.id || index.toString();
  }
}
