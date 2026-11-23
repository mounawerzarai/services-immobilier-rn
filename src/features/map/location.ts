import * as Location from 'expo-location';

import { LatLng } from './geo';

/**
 * Position actuelle (Android / iOS), via expo-location (inclus dans Expo Go).
 * Rejette avec « permission-denied » si l'utilisateur refuse.
 */
export async function getCurrentPosition(): Promise<LatLng> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('permission-denied');
  try {
    const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: p.coords.latitude, longitude: p.coords.longitude };
  } catch {
    // GPS lent ou désactivé : on se rabat sur la dernière position connue.
    const last = await Location.getLastKnownPositionAsync();
    if (last) return { latitude: last.coords.latitude, longitude: last.coords.longitude };
    throw new Error('unavailable');
  }
}
