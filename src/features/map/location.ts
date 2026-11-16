import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

import { LatLng } from './geo';

/** Position actuelle (Android / iOS). Rejette si la permission est refusée. */
export async function getCurrentPosition(): Promise<LatLng> {
  if (Platform.OS === 'android') {
    const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    if (r !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error('permission-denied');
    }
  } else if (Platform.OS === 'ios') {
    const r = await Geolocation.requestAuthorization('whenInUse');
    if (r !== 'granted') throw new Error('permission-denied');
  }
  return new Promise((resolve, reject) =>
    Geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      (e) => reject(new Error(e.code === 1 ? 'permission-denied' : 'unavailable')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    ),
  );
}
