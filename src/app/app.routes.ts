import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'category/:id',
    loadComponent: () => import('./pages/category/category.component').then(m => m.CategoryComponent)
  },
  {
    path: 'online-coupons/:category',
    loadComponent: () => import('./pages/online-coupons/online-coupons.component').then(m => m.OnlineCouponsComponent)
  },
  {
    path: 'shop/:id',
    loadComponent: () => import('./pages/shop-details/shop-details.component').then(m => m.ShopDetailsComponent)
  },
  {
    path: 'shop-deals/:id',
    loadComponent: () => import('./pages/shop-deals/shop-deals.component').then(m => m.ShopDealsComponent)
  },
  {
    path: 'deal-detail',
    loadComponent: () => import('./pages/deal-detail/deal-detail.component').then(m => m.DealDetailComponent)
  },
  {
    path: 'deals',
    loadComponent: () => import('./pages/deals/deals.component').then(m => m.DealsComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'personal-info',
    loadComponent: () => import('./pages/personal-info/personal-info.component').then(m => m.PersonalInfoComponent)
  },
  {
    path: 'account',
    loadComponent: () => import('./pages/account/account.component').then(m => m.AccountComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'redeemed-coupons',
    loadComponent: () => import('./pages/redeemed-coupons/redeemed-coupons.component').then(m => m.RedeemedCouponsComponent)
  },
  {
    path: 'not-found',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
