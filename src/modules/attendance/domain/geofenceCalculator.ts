// Geofence Calculator: Pure Functions
// Menghitung jarak Haversine (meter) antara posisi GPS client dan titik lokasi kerja

import type { GeofenceStatus } from './types';

export interface GeofenceResult {
  distance_m: number;
  geofence_status: GeofenceStatus;
  is_accuracy_acceptable: boolean;
}

/**
 * Calculates Haversine distance in meters between two lat/lng coordinates
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Evaluates geofence status and accuracy compliance
 */
export function evaluateGeofence(
  clientLat: number,
  clientLon: number,
  clientAccuracyM: number,
  targetLat: number,
  targetLon: number,
  geofenceRadiusM: number,
  maxAllowedAccuracyM = 50
): GeofenceResult {
  const distance_m = calculateHaversineDistance(clientLat, clientLon, targetLat, targetLon);
  const geofence_status: GeofenceStatus =
    distance_m <= geofenceRadiusM ? 'WITHIN_GEOFENCE' : 'OUTSIDE_GEOFENCE';
  const is_accuracy_acceptable = clientAccuracyM <= maxAllowedAccuracyM;

  return {
    distance_m,
    geofence_status,
    is_accuracy_acceptable,
  };
}
