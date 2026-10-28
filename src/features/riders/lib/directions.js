/** Google Maps turn-by-turn link to a point (opens the Maps app on phones). */
export const directionsUrl = ({ lat, lng }, mode = 'driving') =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=${mode}`;

/** Bicycles get cycling directions; motorbikes and cars get driving. */
export const travelModeFor = (vehicleType) => (vehicleType === 'bicycle' ? 'bicycling' : 'driving');
