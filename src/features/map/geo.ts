// Calculs de distance pour « Recherche autour de moi » (T6.2).

export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Rayons proposés à l'utilisateur, en kilomètres. */
export const RADIUS_CHOICES = [1, 2, 5, 10, 20, 50];
export const DEFAULT_RADIUS_KM = 5;

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Distance à vol d'oiseau entre deux points (formule de haversine), en km. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** « 850 m », « 1,2 km », « 12 km ». */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km)} km`;
}

/** Garde les éléments situés dans le rayon, triés du plus proche au plus loin. */
export function withinRadius<T extends Partial<LatLng>>(
  items: T[],
  center: LatLng,
  radiusKm: number,
): (T & { distanceKm: number })[] {
  return items
    .filter((i) => typeof i.latitude === 'number' && typeof i.longitude === 'number')
    .map((i) => ({
      ...i,
      distanceKm: distanceKm(center, { latitude: i.latitude!, longitude: i.longitude! }),
    }))
    .filter((i) => i.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Polygone (GeoJSON) approchant un cercle, pour la carte native. */
export function circlePolygon(center: LatLng, radiusKm: number, steps = 64) {
  const coords: [number, number][] = [];
  const latR = radiusKm / 110.574;
  const lonR = radiusKm / (111.32 * Math.cos(toRad(center.latitude)));
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    coords.push([center.longitude + lonR * Math.cos(t), center.latitude + latR * Math.sin(t)]);
  }
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'Polygon' as const, coordinates: [coords] },
  };
}

/** Niveau de zoom qui fait tenir le cercle à l'écran (approximation). */
export function zoomForRadius(radiusKm: number): number {
  return Math.max(6, Math.min(16, 14.5 - Math.log2(radiusKm)));
}

/** Prix court pour les marqueurs : « 420 k DT », « 2 500 DT ». */
export function shortPrice(price: number, transactionType?: string): string {
  if (transactionType !== 'rent' && price >= 1000) {
    return `${Math.round(price / 1000).toLocaleString('fr-FR')} k DT`;
  }
  return `${Math.round(price).toLocaleString('fr-FR')} DT`;
}
