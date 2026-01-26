import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-shop-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shop-details.component.html',
  styleUrls: ['./shop-details.component.scss']
})
export class ShopDetailsComponent implements OnInit {
  offerId: string = '';
  offer: any = null;
  isLoading: boolean = false;
  offerNotFound: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private apiService: ApiService,
    private seoService: SeoService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.offerId = id;
      this.isLoading = !this.offer;
      this.loadOffer(id);
    } else {
      this.offerNotFound = true;
      this.isLoading = false;
    }
  }

  loadOffer(id: string) {
    this.apiService.getShop(id).subscribe({
      next: (shop) => {
        this.offer = {
          id: shop._id || shop.id,
          title: shop.title || shop.name,
          description: shop.description,
          longDescription: shop.longDescription || shop.description,
          image: shop.image || shop.banner || shop.logo,
          logo: shop.logo || '',
          discount: shop.discount,
          validUntil: shop.validUntil ? new Date(shop.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A',
          terms: shop.terms || '',
          location: shop.location || '',
          address: shop.address || '',
          openingHours: shop.openingHours || '',
          cuisines: shop.cuisines || '',
          aboutMerchant: shop.aboutMerchant || shop.description || '',
          googleMapsUrl: shop.googleMapsUrl || '',
          contact: shop.contact || shop.phone || '',
          numberOfOffers: shop.numberOfOffers || 0,
          category: shop.category,
          isPremium: shop.isPremium || false
        };

        // Update SEO meta tags for shop page
        const categoryName = this.offer.category?.name || 'Deals';
        this.seoService.setShopPageMeta(this.offer.name, categoryName);

        this.isLoading = false;
        console.log('Offer loaded:', this.offer);
      },
      error: (error) => {
        console.error('Error loading offer:', error);
        this.offerNotFound = true;
        this.isLoading = false;
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);
      }
    });
  }

  onImageError(event: any) {
    const firstLetter = this.offer?.title ? this.offer.title.charAt(0).toUpperCase() : 'N';
    event.target.src = `https://ui-avatars.com/api/?name=${firstLetter}&size=800&background=6C47FF&color=ffffff&bold=true&format=png`;
  }

  onLogoError(event: any) {
    const firstLetter = this.offer?.title ? this.offer.title.charAt(0).toUpperCase() : 'S';
    event.target.src = `https://ui-avatars.com/api/?name=${firstLetter}&size=200&background=6C47FF&color=ffffff&bold=true&format=png&rounded=true`;
  }

  goBack() {
    this.router.navigate(['/']);
  }

  exploreDeals() {
    if (this.offer && this.offerId) {
      this.router.navigate(['/shop-deals', this.offerId]);
    } else {
      alert('No deals available for this shop');
    }
  }

  openGoogleMaps() {
    if (!this.offer) return;

    if (this.offer.googleMapsUrl) {
      if (typeof window !== 'undefined') {
        window.open(this.offer.googleMapsUrl, '_blank');
      }
    } else if (this.offer.address) {
      const encodedAddress = encodeURIComponent(this.offer.address);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      if (typeof window !== 'undefined') {
        window.open(mapsUrl, '_blank');
      }
    } else if (this.offer.location) {
      const encodedLocation = encodeURIComponent(this.offer.location);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
      if (typeof window !== 'undefined') {
        window.open(mapsUrl, '_blank');
      }
    } else {
      alert('Location information not available');
    }
  }

  callShop() {
    if (!this.offer || !this.offer.contact) {
      alert('Contact information not available');
      return;
    }

    if (typeof window !== 'undefined') {
      const cleanNumber = this.offer.contact.replace(/[\s\-\(\)]/g, '');
      window.location.href = `tel:${cleanNumber}`;
    }
  }
}
