import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocationService, Location } from '../../services/location.service';
import { ApiService } from '../../services/api.service';
import { Subscription, timeout, retry, catchError, of } from 'rxjs';

@Component({
  selector: 'app-location-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './location-modal.component.html',
  styleUrls: ['./location-modal.component.scss']
})
export class LocationModalComponent implements OnInit, OnDestroy {
  locations: Location[] = [];
  selectedLocationId: string = ''; // EMPTY - user MUST select manually
  isLoading: boolean = true;
  isSubmitting: boolean = false; // Prevent double-click
  error: string = '';
  showModal: boolean = true; // Show modal IMMEDIATELY on load
  retryCount: number = 0;
  maxRetries: number = 3;
  
  private subscriptions: Subscription[] = [];
  private readonly TIMEOUT_MS = 15000; // 15 second timeout

  constructor(
    private locationService: LocationService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    console.log('📍 Location Modal: Initializing (showModal=true by default)...');
    console.log('📍 Location Modal: selectedLocationId is EMPTY - user must select manually');
    
    // Modal is already visible (showModal = true)
    // User CANNOT proceed without selecting
    
    // Check if localStorage is available
    if (!this.isLocalStorageAvailable()) {
      this.error = 'Storage not available. Please enable cookies and refresh.';
      this.isLoading = false;
      return;
    }
    
    // Load locations (modal shows loading state while this happens)
    this.loadLocations();
  }

  ngOnDestroy() {
    // Clean up all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    console.log('📍 Location Modal: Destroyed and cleaned up');
  }

  /**
   * Check if localStorage is available (edge case: incognito mode, disabled cookies)
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.error('📍 Location Modal: localStorage not available:', e);
      return false;
    }
  }

  /**
   * Load locations from API with retry and timeout
   */
  loadLocations() {
    this.isLoading = true;
    this.error = '';
    
    console.log('📍 Location Modal: Loading locations (attempt', this.retryCount + 1, ')...');
    
    const sub = this.apiService.getLocations().pipe(
      timeout(this.TIMEOUT_MS), // Timeout after 15 seconds
      retry(2), // Retry 2 times on failure
      catchError((error) => {
        console.error('📍 Location Modal: API error after retries:', error);
        return of({ data: [], error: true }); // Return empty on error
      })
    ).subscribe({
      next: (response: any) => {
        console.log('📍 Location Modal: API Response:', response);
        
        // Check for error flag from catchError
        if (response.error) {
          this.handleLoadError('Network error. Please check your connection.');
          return;
        }
        
        // Parse response - handle different formats
        let locationData: Location[] = [];
        
        if (response && response.data && Array.isArray(response.data)) {
          locationData = response.data;
        } else if (Array.isArray(response)) {
          locationData = response;
        } else if (response && typeof response === 'object') {
          // Try to find locations in any property
          const possibleArrays = Object.values(response).filter(v => Array.isArray(v));
          if (possibleArrays.length > 0) {
            locationData = possibleArrays[0] as Location[];
          }
        }
        
        // Validate each location has required fields
        this.locations = locationData.filter(loc => {
          const isValid = loc && (loc.id || loc.slug) && loc.name;
          if (!isValid) {
            console.warn('📍 Location Modal: Invalid location skipped:', loc);
          }
          return isValid;
        });

        // Check if we have any valid locations
        if (this.locations.length === 0) {
          this.handleLoadError('No locations available. Please try again later.');
          return;
        }
        
        console.log('📍 Location Modal: Valid locations loaded:', this.locations.length);
        
        // Ensure selectedLocationId is empty
        this.selectedLocationId = '';
        this.error = '';
        this.isLoading = false;
        this.showModal = true;
      },
      error: (error) => {
        // This shouldn't trigger due to catchError, but just in case
        console.error('📍 Location Modal: Unexpected error:', error);
        this.handleLoadError('An unexpected error occurred. Please refresh the page.');
      }
    });
    
    this.subscriptions.push(sub);
  }

  /**
   * Handle location loading errors
   */
  private handleLoadError(message: string) {
    this.error = message;
    this.isLoading = false;
    this.showModal = true;
    this.retryCount++;
    console.error('📍 Location Modal:', message, '(Retry count:', this.retryCount, ')');
  }

  /**
   * Retry loading locations
   */
  retryLoadLocations() {
    if (this.retryCount >= this.maxRetries) {
      this.error = 'Maximum retries reached. Please refresh the page.';
      return;
    }
    
    console.log('📍 Location Modal: Manual retry triggered');
    this.loadLocations();
  }

  /**
   * Handle location selection
   */
  onSelectLocation() {
    // Prevent double-click
    if (this.isSubmitting) {
      console.log('📍 Location Modal: Already submitting, ignoring click');
      return;
    }
    
    // Validate selection exists
    if (!this.selectedLocationId || this.selectedLocationId.trim() === '') {
      this.error = 'Please select a location from the dropdown';
      this.shakeError();
      return;
    }

    // Find selected location
    const selectedLocation = this.locations.find(
      loc => loc.id === this.selectedLocationId || loc.slug === this.selectedLocationId
    );

    // Validate location was found
    if (!selectedLocation) {
      console.error('📍 Location Modal: Selected ID not found:', this.selectedLocationId);
      this.error = 'Invalid location. Please select again.';
      this.selectedLocationId = ''; // Reset
      return;
    }

    // Validate location has required fields
    if (!selectedLocation.name) {
      this.error = 'Location data is incomplete. Please select another.';
      this.selectedLocationId = '';
      return;
    }

    this.isSubmitting = true;
    this.error = '';
    
    console.log('📍 Location Modal: Saving location:', selectedLocation.name);
    
    try {
      // Save location to service (handles localStorage)
      this.locationService.setSelectedLocation(selectedLocation);
      
      // Mark first visit as complete
      this.locationService.markLocationSelected();
      
      // Verify it was saved correctly
      const savedLocation = this.locationService.getSelectedLocation();
      if (!savedLocation || savedLocation.id !== selectedLocation.id) {
        throw new Error('Location verification failed');
      }
      
      console.log('📍 Location Modal: Location saved and verified successfully');
      
      // Close modal
      this.closeModal();
      
    } catch (error) {
      console.error('📍 Location Modal: Error saving location:', error);
      this.error = 'Failed to save location. Please try again.';
      this.isSubmitting = false;
    }
  }

  /**
   * Close modal with animation
   */
  closeModal() {
    this.showModal = false;
    
    // Remove modal from DOM after animation
    setTimeout(() => {
      try {
        const modalElement = document.querySelector('app-location-modal');
        if (modalElement && modalElement.parentNode) {
          modalElement.parentNode.removeChild(modalElement);
        }
      } catch (e) {
        console.error('📍 Location Modal: Error removing from DOM:', e);
      }
    }, 300);
  }

  /**
   * BLOCK backdrop click - user MUST select location
   */
  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      // ALWAYS block - user must select location
      event.preventDefault();
      event.stopPropagation();
      this.error = 'Please select a city to continue using the app';
      this.shakeError();
      console.log('📍 Location Modal: Backdrop click BLOCKED - location required');
    }
  }

  /**
   * BLOCK Escape key - user MUST select location
   */
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      // ALWAYS block - user must select location
      event.preventDefault();
      event.stopPropagation();
      this.error = 'Please select a city to continue using the app';
      this.shakeError();
      console.log('📍 Location Modal: Escape key BLOCKED - location required');
    }
  }

  /**
   * Shake animation for error messages and dropdown
   */
  private shakeError() {
    // Shake error text
    const errorElement = document.querySelector('.error-text, .error-banner');
    if (errorElement) {
      errorElement.classList.add('shake');
      setTimeout(() => errorElement.classList.remove('shake'), 500);
    }
    
    // Shake the dropdown if no selection
    if (!this.selectedLocationId) {
      const dropdown = document.querySelector('.location-dropdown-wrapper');
      if (dropdown) {
        dropdown.classList.add('shake', 'has-error');
        setTimeout(() => dropdown.classList.remove('shake'), 500);
      }
    }
    
    // Shake entire modal container slightly
    const modal = document.querySelector('.location-modal-container');
    if (modal) {
      modal.classList.add('shake-subtle');
      setTimeout(() => modal.classList.remove('shake-subtle'), 300);
    }
  }

  /**
   * Track by function for ngFor performance
   */
  trackByLocation(index: number, location: Location): string {
    return location.id || location.slug || index.toString();
  }
}

