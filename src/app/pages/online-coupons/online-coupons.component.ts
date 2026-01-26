import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-online-coupons',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './online-coupons.component.html',
    styleUrls: ['./online-coupons.component.scss']
})
export class OnlineCouponsComponent implements OnInit {
    categorySlug: string = '';
    categoryName: string = '';
    coupons: any[] = [];
    isLoading: boolean = true;
    errorMessage: string = '';
    copiedCode: string = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private apiService: ApiService
    ) { }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.categorySlug = params.get('category') || '';
            if (this.categorySlug) {
                this.loadOnlineCoupons();
            } else {
                this.errorMessage = 'Invalid category';
                this.isLoading = false;
            }
        });
    }

    loadOnlineCoupons() {
        this.isLoading = true;
        this.errorMessage = '';

        this.apiService.getOnlineCoupons({ category: this.categorySlug }).subscribe({
            next: (response) => {
                const couponsData = Array.isArray(response) ? response : response.data || [];

                this.coupons = couponsData.map((coupon: any) => ({
                    id: coupon._id || coupon.id,
                    brandName: coupon.shopName || 'Unknown Brand',
                    brandLogo: coupon.shopIcon || '',
                    couponCode: coupon.couponCode || '',
                    redeemUrl: coupon.redeemUrl || '',
                    discount: coupon.discount || '',
                    validUntil: coupon.validUntil,
                    description: coupon.description || '',
                    title: coupon.title
                }));

                if (couponsData.length > 0 && couponsData[0].category) {
                    this.categoryName = couponsData[0].category.name || this.categorySlug;
                } else {
                    this.categoryName = this.getCategoryDisplayName(this.categorySlug);
                }

                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading online coupons:', error);
                this.errorMessage = 'Failed to load deals. Please try again.';
                this.isLoading = false;
            }
        });
    }


    getCategoryDisplayName(slug: string): string {
        const names: any = {
            'restaurants': 'Restaurants',
            'fitness': 'Fitness',
            'grooming': 'Grooming',
            'autocare': 'Autocare',
            'health-wellness': 'Health & Wellness',
            'fashion-stores': 'Fashion Stores'
        };
        return names[slug.toLowerCase()] || slug.charAt(0).toUpperCase() + slug.slice(1);
    }

    async copyCouponCode(code: string, couponId: string) {
        try {
            await navigator.clipboard.writeText(code);
            this.copiedCode = code;

            // Track redemption
            this.apiService.redeemOnlineCoupon(couponId).subscribe();

            // Reset copied state after 2 seconds
            setTimeout(() => {
                this.copiedCode = '';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    goBack() {
        this.router.navigate(['/']);
    }
}
