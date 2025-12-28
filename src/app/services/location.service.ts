import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { SafeStorage } from '../utils/platform.utils';

export interface Location {
  id: string;
  slug?: string;
  name: string;
  latitude: number;
  longitude: number;
  variations?: string[];
  isDefault?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private selectedLocationSubject = new BehaviorSubject<Location | null>(null);
  public selectedLocation$: Observable<Location | null>;

  constructor() {
    this.selectedLocation$ = this.selectedLocationSubject.asObservable().pipe(
      distinctUntilChanged((prev, curr) => {
        if (!prev && !curr) return true;
        if (!prev || !curr) return false;
        return prev.id === curr.id;
      })
    );
    
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const stored = SafeStorage.getItem('selectedLocation');
    if (stored) {
      try {
        const location = JSON.parse(stored);
        if (location && location.id && location.name) {
          console.log('LocationService: Loaded location from storage:', location.name);
          this.selectedLocationSubject.next(location);
        }
      } catch (error) {
        console.error('LocationService: Error loading location from storage:', error);
      }
    }
  }

  setSelectedLocation(location: Location): void {
    console.log('LocationService: Setting location to:', location.name);
    SafeStorage.setItem('selectedLocation', JSON.stringify(location));
    this.selectedLocationSubject.next(location);
    console.log('LocationService: Location change broadcasted to all subscribers');
  }

  getSelectedLocation(): Location | null {
    return this.selectedLocationSubject.value;
  }

  getSelectedLocationName(): string {
    const name = this.selectedLocationSubject.value?.name || '';
    return name;
  }

  getSelectedLocationId(): string {
    const id = this.selectedLocationSubject.value?.id || '';
    return id;
  }

  refreshCurrentLocation(): void {
    const currentLocation = this.selectedLocationSubject.value;
    if (currentLocation) {
      console.log('LocationService: Force refreshing location:', currentLocation.name);
      this.selectedLocationSubject.next({ ...currentLocation });
    }
  }

  /**
   * Check if this is the first visit (no location selected yet)
   * @returns true if first visit, false otherwise
   */
  isFirstVisit(): boolean {
    const hasLocation = !!SafeStorage.getItem('selectedLocation');
    const hasVisited = !!SafeStorage.getItem('locationModalShown');
    
    // First visit if no location AND modal hasn't been shown
    return !hasLocation && !hasVisited;
  }

  /**
   * Mark that location has been selected (first visit complete)
   */
  markLocationSelected(): void {
    SafeStorage.setItem('locationModalShown', 'true');
    console.log('LocationService: First visit completed, modal shown flag set');
  }

  /**
   * Check if location is currently selected
   * @returns true if location is selected
   */
  hasSelectedLocation(): boolean {
    return !!this.selectedLocationSubject.value;
  }

  /**
   * Clear all location data (for testing or reset)
   */
  clearLocationData(): void {
    SafeStorage.removeItem('selectedLocation');
    SafeStorage.removeItem('locationModalShown');
    this.selectedLocationSubject.next(null);
    console.log('LocationService: All location data cleared');
  }
}

