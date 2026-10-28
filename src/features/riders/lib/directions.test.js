import { directionsUrl, travelModeFor } from './directions';

describe('directions', () => {
  it('builds a Google Maps directions link', () => {
    expect(directionsUrl({ lat: 6.5, lng: 3.37 }, travelModeFor('bicycle'))).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=6.5,3.37&travelmode=bicycling',
    );
    expect(travelModeFor('motorcycle')).toBe('driving');
  });
});
