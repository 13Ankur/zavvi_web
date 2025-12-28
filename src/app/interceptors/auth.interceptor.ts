import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SafeStorage } from '../utils/platform.utils';

/**
 * HTTP Interceptor to handle authentication errors (401, 403)
 * When a token expires, it clears the user session and redirects to login
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized (token expired or invalid)
      if (error.status === 401) {
        console.warn('🔐 Token expired or invalid - logging out user');
        
        // Clear all auth data
        SafeStorage.removeItem('token');
        SafeStorage.removeItem('currentUser');
        
        // Check if we're not already on the login page to avoid redirect loop
        const currentUrl = router.url;
        if (!currentUrl.includes('/login')) {
          // Save the current URL for redirect after login
          SafeStorage.setItem('redirectAfterLogin', currentUrl);
          
          // Redirect to login with a message
          router.navigate(['/login'], { 
            queryParams: { 
              sessionExpired: 'true' 
            }
          });
        }
        
        // Return a user-friendly error
        const authError = new Error('Your session has expired. Please login again.');
        (authError as any).status = 401;
        (authError as any).isAuthError = true;
        return throwError(() => authError);
      }
      
      // Handle 403 Forbidden
      if (error.status === 403) {
        console.warn('🚫 Access forbidden');
        
        // Clear auth data and redirect
        SafeStorage.removeItem('token');
        SafeStorage.removeItem('currentUser');
        
        const currentUrl = router.url;
        if (!currentUrl.includes('/login')) {
          router.navigate(['/login'], { 
            queryParams: { 
              accessDenied: 'true' 
            }
          });
        }
        
        const authError = new Error('Access denied. Please login again.');
        (authError as any).status = 403;
        (authError as any).isAuthError = true;
        return throwError(() => authError);
      }
      
      // For all other errors, pass through
      return throwError(() => error);
    })
  );
};

