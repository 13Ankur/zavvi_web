import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private baseUrl = 'https://www.zavvi.deals';
  private defaultTitle = 'Zavvi - Exclusive Deals & Discount Offers';
  private defaultDescription = 'Discover exclusive deals and discount offers on dining, fitness, spa, salon, and more. Save money with Zavvi.';
  private defaultKeywords = 'deals, discounts, offers, coupons, savings, restaurants, fitness, spa, salon, local deals';

  constructor(
    private titleService: Title,
    private metaService: Meta
  ) { }

  setTitle(title: string) {
    const fullTitle = title ? `${title} - Zavvi` : this.defaultTitle;
    this.titleService.setTitle(fullTitle);
  }

  setMetaTags(description: string, keywords: string) {
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ name: 'keywords', content: keywords });

    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'twitter:description', content: description });
  }

  updateCanonicalUrl(path: string) {
    const fullUrl = `${this.baseUrl}${path}`;
    this.metaService.updateTag({ property: 'og:url', content: fullUrl });
    this.metaService.updateTag({ property: 'twitter:url', content: fullUrl });

    if (typeof document !== 'undefined') {
      const existingLink = document.querySelector('link[rel="canonical"]');
      if (existingLink) {
        existingLink.remove();
      }
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', fullUrl);
      document.head.appendChild(link);
    }
  }

  addStructuredData(data: any) {
    if (typeof document !== 'undefined') {
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(data);
      document.head.appendChild(script);
    }
  }

  setHomePageMeta(location?: string) {
    const locationText = location ? ` in ${location}` : '';
    this.setTitle(`Exclusive Deals & Discounts${locationText}`);
    this.setMetaTags(
      `Discover exclusive deals and discount offers${locationText}. Save money on dining, fitness, spa, and more with Zavvi.`,
      `deals${locationText}, discounts, coupons, savings, local offers`
    );
    this.updateCanonicalUrl('/');
    this.setAppIndexingSchema();
  }

  setAppIndexingSchema() {
    const appSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'Zavvi',
      'operatingSystem': 'ANDROID, IOS',
      'applicationCategory': 'ShoppingApplication',
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'reviewCount': '1250'
      },
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'INR'
      },
      'installUrl': 'https://play.google.com/store/apps/details?id=com.zavvi.app',
      'downloadUrl': 'https://play.google.com/store/apps/details?id=com.zavvi.app',
      'featureList': 'Exclusive deals, Discount coupons, Local offers, QR code redemption',
      'screenshot': 'https://www.zavvi.deals/logos/zavvi-logo.png',
      'softwareVersion': '1.0.0',
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': 'https://www.zavvi.deals'
      }
    };
    this.addStructuredData(appSchema);
  }

  setCategoryPageMeta(categoryName: string, location?: string) {
    const locationText = location ? ` in ${location}` : '';
    const safeCategoryName = categoryName || 'Deals';
    this.setTitle(`${safeCategoryName} Deals${locationText}`);
    this.setMetaTags(
      `Browse exclusive ${safeCategoryName} deals and offers${locationText}. Save money with Zavvi.`,
      `${safeCategoryName} deals, ${safeCategoryName} discounts, ${safeCategoryName} offers${locationText}`
    );
    const categorySlug = typeof safeCategoryName === 'string' ? safeCategoryName.toLowerCase().replace(/\s+/g, '-') : 'deals';
    this.updateCanonicalUrl(`/category/${categorySlug}`);
  }

  setShopPageMeta(shopName: string, category: string) {
    this.setTitle(`${shopName} - ${category}`);
    this.setMetaTags(
      `Discover exclusive deals and offers at ${shopName}. Browse ${category} deals and save money with Zavvi.`,
      `${shopName}, ${category} deals, discounts, offers, coupons`
    );
  }

  setDealPageMeta(shopName: string, discount: string) {
    this.setTitle(`${shopName} - ${discount}`);
    this.setMetaTags(
      `Get ${discount} at ${shopName}. Exclusive deal available on Zavvi.`,
      `${shopName} deal, ${discount}, discount offer`
    );
  }

  setAccountPageMeta() {
    this.setTitle('My Account');
    this.setMetaTags(
      'Manage your Zavvi account, view redeemed coupons, and track your savings.',
      'my account, profile, saved deals'
    );
    this.updateCanonicalUrl('/account');
    this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  setPremiumDealsPageMeta(location?: string) {
    const locationText = location ? ` in ${location}` : '';
    this.setTitle(`Premium Deals${locationText} - Golden Offers`);
    this.setMetaTags(
      `Discover premium golden deals and exclusive offers${locationText}. Limited-time discounts up to 50% or more.`,
      `premium deals, golden deals, exclusive offers, maximum savings${locationText}`
    );
    this.updateCanonicalUrl('/deals');
  }

  setRedeemedCouponsPageMeta() {
    this.setTitle('My Coupons - Zavvi');
    this.setMetaTags(
      'View and manage your redeemed coupons. Access your saved deals and discount codes on Zavvi.',
      'my coupons, redeemed coupons, saved deals, discount codes, Zavvi coupons'
    );
    this.updateCanonicalUrl('/redeemed-coupons');
    this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  setAboutPageMeta() {
    this.setTitle('About Zavvi - Your Gateway to Exclusive Deals & Savings');
    this.setMetaTags(
      'Learn about Zavvi, your trusted platform for exclusive deals, discounts, and offers from local businesses. Discover how we help you save money on dining, fitness, spa, and more.',
      'about Zavvi, deal platform, discount coupons, save money, local deals, how it works, verified offers'
    );
    this.updateCanonicalUrl('/about');

    const aboutSchema = {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      'mainEntity': {
        '@type': 'Organization',
        'name': 'Zavvi',
        'url': `${this.baseUrl}/about`,
        'description': 'Zavvi connects savvy shoppers with local businesses through exclusive deals and verified discount offers.',
        'foundingDate': '2024',
        'slogan': 'Your Gateway to Exclusive Deals & Savings'
      }
    };
    this.addStructuredData(aboutSchema);
  }

  setNotFoundPageMeta() {
    this.setTitle('404 - Page Not Found');
    this.setMetaTags(
      'The page you are looking for does not exist or has been moved. Return to Zavvi home page to discover exclusive deals and offers.',
      '404, page not found, error page'
    );
    this.updateCanonicalUrl('/404');
    this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }
}
