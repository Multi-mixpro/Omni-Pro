import { describe, expect, it } from 'vitest';
import { faceSimilarity, haversineMeters, validateFaceDescriptor } from './_attendanceBiometric';

describe('attendance biometric helpers', () => {
  it('returns a perfect match for identical descriptors', () => {
    const descriptor = Array.from({ length: 1024 }, (_, index) => index / 1024);
    expect(faceSimilarity(descriptor, descriptor)).toBe(1);
  });

  it('rejects incomplete descriptors and mismatched descriptor sizes', () => {
    expect(() => validateFaceDescriptor([0.1, 0.2])).toThrow('Descriptor wajah tidak lengkap');
    expect(faceSimilarity(new Array(1024).fill(0), new Array(512).fill(0))).toBe(0);
  });

  it('calculates a practical geofence distance', () => {
    expect(haversineMeters(-6.9175, 107.6191, -6.9175, 107.6191)).toBe(0);
    expect(haversineMeters(-6.9175, 107.6191, -6.9185, 107.6191)).toBeGreaterThan(100);
  });
});
