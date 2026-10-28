import { distanceBetween } from './geo';

describe('distanceBetween', () => {
  it('measures Yaba to Victoria Island at about 10 km', () => {
    const d = distanceBetween({ lat: 6.5095, lng: 3.3711 }, { lat: 6.4281, lng: 3.4219 });
    expect(d).toBeGreaterThan(10000);
    expect(d).toBeLessThan(11500);
  });

  it('is zero for the same point and null without one', () => {
    expect(distanceBetween({ lat: 6.5, lng: 3.3 }, { lat: 6.5, lng: 3.3 })).toBe(0);
    expect(distanceBetween(null, { lat: 1, lng: 1 })).toBeNull();
  });
});
