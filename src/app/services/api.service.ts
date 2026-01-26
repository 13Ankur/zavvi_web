import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CacheService } from './cache.service';
import { SafeStorage } from '../utils/platform.utils';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private readonly DEFAULT_TIMEOUT = 8000;
  private readonly SHORT_TIMEOUT = 5000;

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = SafeStorage.getItem('token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';

    console.error('API Error:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      error: error.error
    });

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      if (error.error && typeof error.error === 'object') {
        errorMessage = error.error.message || error.error.error || error.message || errorMessage;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        errorMessage = error.message || errorMessage;
      }
    }

    const customError: any = new Error(errorMessage);
    customError.status = error.status || 0;
    customError.statusText = error.statusText || '';
    customError.error = error.error;
    customError.url = error.url;
    customError.code = error.error?.code || error.error?.error?.code;
    return throwError(() => customError);
  }

  // Auth APIs
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => response),
      catchError(this.handleError)
    );
  }

  sendOTP(mobile: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/send-otp`, { mobile }, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => response),
      catchError(this.handleError)
    );
  }

  verifyOTP(mobile: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/verify-otp`, { mobile, otp }, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => response),
      catchError(this.handleError)
    );
  }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/me`, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => response.data || response),
      catchError(this.handleError)
    );
  }

  updateProfile(userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/me`, userData, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => response.data || response),
      catchError(this.handleError)
    );
  }

  updateUserProfile(userData: any): Observable<any> {
    return this.updateProfile(userData);
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => response),
      catchError(this.handleError)
    );
  }

  // Category APIs
  getCategories(): Observable<any> {
    const cacheKey = 'categories';
    return this.cacheService.get(cacheKey, () =>
      this.http.get(`${this.apiUrl}/categories`, {
        headers: this.getHeaders()
      }).pipe(
        timeout(this.SHORT_TIMEOUT),
        retry(1),
        map((response: any) => response.data || response),
        catchError(this.handleError)
      ),
      10 * 60 * 1000
    );
  }

  getCategory(slug: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories/${slug}`, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => response.data || response),
      catchError(this.handleError)
    );
  }

  // Shop APIs
  getShops(params?: { category?: string; search?: string; location?: string }): Observable<any> {
    let url = `${this.apiUrl}/shops`;
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.category) queryParams.append('category', params.category);
      if (params.search) queryParams.append('search', params.search);
      if (params.location) queryParams.append('location', params.location);
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;
    }

    const cacheKey = `shops_${params?.category || 'all'}_${params?.location || 'all'}_${params?.search || ''}`;

    return this.cacheService.get(cacheKey, () =>
      this.http.get(url, {
        headers: this.getHeaders()
      }).pipe(
        timeout(this.DEFAULT_TIMEOUT),
        retry(1),
        map((response: any) => {
          if (response && response.success !== undefined) {
            return response.data || [];
          } else if (Array.isArray(response)) {
            return response;
          } else if (response && response.data) {
            return Array.isArray(response.data) ? response.data : [];
          } else {
            console.warn('Unexpected response format:', response);
            return [];
          }
        }),
        catchError(this.handleError)
      ),
      3 * 60 * 1000
    );
  }

  getShop(id: string): Observable<any> {
    const cacheKey = `shop_${id}`;
    return this.cacheService.get(cacheKey, () =>
      this.http.get(`${this.apiUrl}/shops/${id}`, {
        headers: this.getHeaders()
      }).pipe(
        timeout(this.SHORT_TIMEOUT),
        retry(1),
        map((response: any) => response.data || response),
        catchError(this.handleError)
      ),
      5 * 60 * 1000
    );
  }

  getFeaturedShops(params?: { location?: string }): Observable<any> {
    let url = `${this.apiUrl}/shops/featured/banner`;
    if (params && params.location) {
      url += `?location=${encodeURIComponent(params.location)}`;
    }

    const cacheKey = `featured_shops_${params?.location || 'all'}`;

    return this.cacheService.get(cacheKey, () =>
      this.http.get(url, {
        headers: this.getHeaders()
      }).pipe(
        timeout(this.SHORT_TIMEOUT),
        retry(1),
        map((response: any) => {
          if (response && response.success !== undefined) {
            return response.data || [];
          } else if (Array.isArray(response)) {
            return response;
          } else if (response && response.data) {
            return Array.isArray(response.data) ? response.data : [];
          } else {
            console.warn('Unexpected featured shops response format:', response);
            return [];
          }
        }),
        catchError(this.handleError)
      ),
      5 * 60 * 1000
    );
  }

  // Location APIs
  getLocations(): Observable<any[]> {
    const cacheKey = 'locations';
    return this.cacheService.get(cacheKey, () =>
      this.http.get(`${this.apiUrl}/locations`, {
        headers: this.getHeaders()
      }).pipe(
        timeout(this.SHORT_TIMEOUT),
        retry(2),
        map((response: any) => {
          if (response && response.success !== undefined) {
            return response.data || [];
          } else if (Array.isArray(response)) {
            return response;
          } else if (response && response.data) {
            return Array.isArray(response.data) ? response.data : [];
          } else {
            console.warn('Unexpected response format:', response);
            return [];
          }
        }),
        catchError(this.handleError)
      ),
      15 * 60 * 1000
    );
  }

  // Deal APIs
  getDealsByShop(shopId: string): Observable<any> {
    const cacheKey = `deals_shop_${shopId}`;
    return this.cacheService.get(cacheKey, () =>
      this.http.get(`${this.apiUrl}/deals/shop/${shopId}`, {
        headers: this.getHeaders()
      }).pipe(
        timeout(this.SHORT_TIMEOUT),
        retry(1),
        map((response: any) => response.data || response),
        catchError(this.handleError)
      ),
      2 * 60 * 1000
    );
  }

  getDeal(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/deals/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => response.data || response),
      catchError(this.handleError)
    );
  }

  getDeals(params?: { category?: string; search?: string; shop?: string; location?: string; featured?: boolean }): Observable<any> {
    let url = `${this.apiUrl}/deals`;
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.category) queryParams.append('category', params.category);
      if (params.search) queryParams.append('search', params.search);
      if (params.shop) queryParams.append('shop', params.shop);
      if (params.location) queryParams.append('location', params.location);
      if (params.featured) queryParams.append('featured', 'true');
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;
    }

    return this.http.get(url, {
      headers: this.getHeaders()
    }).pipe(
      timeout(this.DEFAULT_TIMEOUT),
      retry(1),
      map((response: any) => response.data || response),
      catchError(this.handleError)
    );
  }

  // Coupon APIs
  generateCoupon(dealId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/coupons/generate`, { dealId }, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => {
        if (response && response.success !== undefined) {
          return response.data || response;
        } else if (response && response.data) {
          return response.data;
        } else {
          return response;
        }
      }),
      catchError(this.handleError)
    );
  }

  getMyCoupons(): Observable<any> {
    return this.http.get(`${this.apiUrl}/coupons/my-coupons`, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => response.data || response),
      catchError(this.handleError)
    );
  }

  getCoupon(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/coupons/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => response.data || response),
      catchError(this.handleError)
    );
  }

  // Redeemed Coupons APIs
  redeemCoupon(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/redeemed-coupons`, data, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => response),
      catchError(this.handleError)
    );
  }

  getRedeemedCoupons(params?: { status?: string; limit?: number; page?: number }): Observable<any> {
    let url = `${this.apiUrl}/redeemed-coupons`;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;
    }

    return this.http.get(url, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => response),
      catchError(this.handleError)
    );
  }

  getRedeemedCoupon(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/redeemed-coupons/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => response.data || response),
      catchError(this.handleError)
    );
  }

  checkGoldenCouponEligibility(dealId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/redeemed-coupons/check-golden/${dealId}`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(this.SHORT_TIMEOUT),
      map((response: any) => response),
      catchError(this.handleError)
    );
  }

  invalidateCache(pattern?: string): void {
    if (pattern) {
      this.cacheService.invalidatePattern(pattern);
    } else {
      this.cacheService.clearAll();
    }
  }

  prefetchShopData(shopId: string): void {
    this.cacheService.prefetch(`shop_${shopId}`, () => this.getShop(shopId));
    this.cacheService.prefetch(`deals_shop_${shopId}`, () => this.getDealsByShop(shopId));
  }

  prefetchCategoryData(category: string, location?: string): void {
    const cacheKey = `shops_${category}_${location || 'all'}_`;
    this.cacheService.prefetch(cacheKey, () => this.getShops({ category, location }));
  }

  /**
   * Online Coupon APIs
   */
  getOnlineCoupons(params?: { category?: string; search?: string }): Observable<any> {
    let url = `${this.apiUrl}/online-coupons`;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.category) queryParams.append('category', params.category);
      if (params.search) queryParams.append('search', params.search);
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;
    }

    return this.http.get(url, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => response.data || response),
      catchError(this.handleError)
    );
  }

  redeemOnlineCoupon(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/online-coupons/${id}/redeem`, {}, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => response),
      catchError(this.handleError)
    );
  }

  getOnlineShops(params?: { category?: string }): Observable<any> {
    let url = `${this.apiUrl}/online-shops`;
    if (params && params.category) {
      url += `?category=${params.category}`;
    }

    return this.http.get(url, {
      headers: this.getHeaders()
    }).pipe(
      map((response: any) => response.data || response),
      catchError(this.handleError)
    );
  }
}
