/**
 * Location utility functions for normalizing and matching location names
 * Note: Location variations are now stored in the database and fetched via API
 */

export interface LocationVariations {
  [key: string]: string[];
}

/**
 * Normalize location name to handle variations
 * @param location - Location name to normalize
 * @param variationsMap - Map of location variations from database (optional)
 * @returns Normalized location name or original if not found
 */
export function normalizeLocationName(location: string, variationsMap?: LocationVariations): string {
  if (!location) return '';
  
  const normalized = location.toLowerCase().trim();
  
  // If variations map is provided, use it
  if (variationsMap) {
    for (const [key, variations] of Object.entries(variationsMap)) {
      if (variations.includes(normalized)) {
        return key;
      }
    }
  }
  
  return normalized;
}

/**
 * Check if two locations match (handles variations)
 * @param location1 - First location name
 * @param location2 - Second location name
 * @param variationsMap - Map of location variations from database (optional)
 * @returns true if locations match
 */
export function locationsMatch(location1: string, location2: string, variationsMap?: LocationVariations): boolean {
  if (!location1 || !location2) return false;
  
  const loc1 = location1.toLowerCase().trim();
  const loc2 = location2.toLowerCase().trim();
  
  // Direct match
  if (loc1 === loc2) {
    return true;
  }
  
  // If variations map is provided, check if both locations are in the same variation group
  if (variationsMap) {
    for (const [key, variations] of Object.entries(variationsMap)) {
      if (variations.includes(loc1) && variations.includes(loc2)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Get all variations for a location
 * @param location - Location name
 * @param variationsMap - Map of location variations from database (optional)
 * @returns Array of location variations
 */
export function getLocationVariations(location: string, variationsMap?: LocationVariations): string[] {
  if (!location) return [];
  
  const normalized = location.toLowerCase().trim();
  
  // If variations map is provided, use it
  if (variationsMap) {
    for (const [key, variations] of Object.entries(variationsMap)) {
      if (variations.includes(normalized) || key === normalized) {
        return variations;
      }
    }
  }
  
  return [normalized];
}

