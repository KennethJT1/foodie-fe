/** Distance in metres between two points (haversine). */
export function distanceMetres(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** Points along a slightly curved line from a to b, for fake rider routes. */
export function interpolateRoute(a, b, steps = 24) {
  const points = [];
  const bend = 0.15;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const curve = Math.sin(Math.PI * t) * bend;
    points.push({
      lat: a.lat + (b.lat - a.lat) * t + (b.lng - a.lng) * curve * 0.2,
      lng: a.lng + (b.lng - a.lng) * t - (b.lat - a.lat) * curve * 0.2,
    });
  }
  return points;
}
