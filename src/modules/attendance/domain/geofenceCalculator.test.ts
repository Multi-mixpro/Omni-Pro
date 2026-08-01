import { describe, it, expect } from 'vitest';
import { calculateHaversineDistance, evaluateGeofence } from './geofenceCalculator';

describe('geofenceCalculator', () => {
  it('calculates 0m for identical coordinates', () => {
    const dist = calculateHaversineDistance(-6.9175, 107.6191, -6.9175, 107.6191);
    expect(dist).toBe(0);
  });

  it('calculates correct distance for nearby points', () => {
    // Approx 111m apart
    const dist = calculateHaversineDistance(-6.9175, 107.6191, -6.9185, 107.6191);
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeLessThan(120);
  });

  it('evaluates WITHIN_GEOFENCE when inside radius', () => {
    const res = evaluateGeofence(-6.9175, 107.6191, 10, -6.9175, 107.6191, 150, 50);
    expect(res.geofence_status).toBe('WITHIN_GEOFENCE');
    expect(res.is_accuracy_acceptable).toBe(true);
    expect(res.distance_m).toBe(0);
  });

  it('evaluates OUTSIDE_GEOFENCE when outside radius', () => {
    const res = evaluateGeofence(-6.925, 107.63, 15, -6.9175, 107.6191, 150, 50);
    expect(res.geofence_status).toBe('OUTSIDE_GEOFENCE');
    expect(res.distance_m).toBeGreaterThan(150);
  });

  it('flags unacceptable GPS accuracy', () => {
    const res = evaluateGeofence(-6.9175, 107.6191, 120, -6.9175, 107.6191, 150, 50);
    expect(res.is_accuracy_acceptable).toBe(false);
  });
});
