import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LocationService, Location } from '../../services/location.service';
import { AuthService, User } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  searchTerm = '';
  locations: Location[] = [];
  selectedLocation: Location | null = null;
  selectedLocationId: string = '';
  currentUser: User | null = null;
  isLoggedIn = false;
  showLocationDropdown = false;
  isMobileMenuOpen = false;
  
  // Theme service
  themeService = inject(ThemeService);
  isDarkMode = this.themeService.theme;

  constructor(
    private apiService: ApiService,
    private locationService: LocationService,
    private authService: AuthService,
    private router: Router,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    // Load locations
    this.loadLocations();
    
    // Subscribe to location changes
    this.locationService.selectedLocation$.subscribe(location => {
      this.selectedLocation = location;
      this.selectedLocationId = location?.id || '';
      console.log('Header: Location updated to', location?.name, 'ID:', this.selectedLocationId);
    });
    
    // Check auth status
    this.updateAuthStatus();
    
    // Poll auth status periodically (every 5 seconds) to catch login/logout changes
    setInterval(() => {
      const wasLoggedIn = this.isLoggedIn;
      this.updateAuthStatus();
      if (wasLoggedIn !== this.isLoggedIn) {
        console.log('Auth state changed:', this.isLoggedIn ? 'Logged in' : 'Logged out');
      }
    }, 5000);
  }

  updateAuthStatus() {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.currentUser = this.authService.getCurrentUser();
  }

  loadLocations() {
    this.apiService.getLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
        console.log('Header: Loaded locations:', locations.length);
        
        // Get current location from service
        const currentLocation = this.locationService.getSelectedLocation();
        if (currentLocation) {
          this.selectedLocation = currentLocation;
          this.selectedLocationId = currentLocation.id;
          console.log('Header: Current location from service:', currentLocation.name);
        } else if (locations.length > 0) {
          // Set default location if none selected
          const defaultLocation = locations.find(l => l.isDefault) || locations[0];
          this.locationService.setSelectedLocation(defaultLocation);
          this.selectedLocationId = defaultLocation.id;
        }
      },
      error: (error) => {
        console.error('Error loading locations:', error);
      }
    });
  }

  onLocationChange(locationId: string) {
    console.log('Header: Location change triggered, ID:', locationId);
    const location = this.locations.find(l => l.id === locationId);
    if (location) {
      console.log('Header: Setting location to:', location.name);
      this.locationService.setSelectedLocation(location);
      this.selectedLocationId = locationId;
      this.showLocationDropdown = false;
      
      // Update user location if logged in
      if (this.authService.isLoggedIn()) {
        this.apiService.updateProfile({ location: location.name }).subscribe({
          next: () => {
            console.log('Header: Location updated in user profile');
          },
          error: (error) => {
            console.error('Header: Error updating location in profile:', error);
          }
        });
      }
    } else {
      console.warn('Header: Location not found for ID:', locationId);
    }
  }

  onSearch() {
    if (this.searchTerm.trim()) {
      this.router.navigate(['/search'], {
        queryParams: { q: this.searchTerm }
      });
    }
  }

  async logout() {
    const confirmed = await this.modalService.confirm(
      'Are you sure you want to logout?',
      'Confirm Logout',
      'Logout',
      'Cancel'
    );
    
    if (confirmed) {
      this.authService.logout();
      this.isLoggedIn = false;
      this.currentUser = null;
      this.isMobileMenuOpen = false;
    }
  }

  toggleMobileMenu() {
    // Only toggle on mobile devices
    if (window.innerWidth <= 767) {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  toggleDarkMode() {
    this.themeService.toggleTheme();
  }
}
