import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Pressable, PermissionsAndroid, Platform, StyleSheet } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import Geolocation from 'react-native-geolocation-service';
import { useNavigation } from '@react-navigation/native';
import { db } from '../core/firebase';


MapLibreGL.setAccessToken(null);

const OSM_STYLE = JSON.stringify({
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
});

type Listing = {
  id: string;
  title: string;
  city: string;
  price: number;
  surface: number;
  latitude: number;
  longitude: number;
  transactionType: 'sale' | 'rent';
  photos?: string[];

};

const label = (l: Listing) =>
  l.transactionType === 'rent' || l.price < 1000
    ? `${l.price} €`
    : `${Math.round(l.price / 1000)} k€`;

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const cameraRef = useRef<any>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [me, setMe] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Annonces disponibles (même requête que la liste : status + createdAt)
useEffect(() => {
  const q = query(
    collection(db, 'listings'),
    where('status', '==', 'available'),
    orderBy('createdAt', 'desc'),
    limit(100),
  );
  return onSnapshot(
    q,
    snap => {
      const items = snap.docs
        .map(d => ({ id: d.id, ...(d.data() as any) }))
        .filter((l: any) =>
          typeof l.latitude === 'number' &&
          typeof l.longitude === 'number' &&
          typeof l.price === 'number');
      setListings(items as Listing[]);
    },
    e => setError(e.message),
  );
}, []);

  // Position de l'utilisateur (l'app reste utilisable si refus : US19)
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'android') {
          const r = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
          if (r !== PermissionsAndroid.RESULTS.GRANTED) return;
        }
        Geolocation.getCurrentPosition(
          p => {
            const c: [number, number] = [p.coords.longitude, p.coords.latitude];
            setMe(c);
            cameraRef.current?.setCamera({ centerCoordinate: c, zoomLevel: 13 });
          },
          () => {},
          { enableHighAccuracy: true, timeout: 15000 },
        );
      } catch {}
    })();
  }, []);

  if (error) {
    return (

      <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
        <Text>Erreur : {error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapLibreGL.MapView
        style={{ flex: 1 }}
        mapStyle={OSM_STYLE}
        onPress={() => setSelected(null)}>
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={12}
          centerCoordinate={[10.1815, 36.8065]} // Tunis
        />
        {me && (
          <MapLibreGL.PointAnnotation id="me" coordinate={me}>
            <View style={styles.me} />
          </MapLibreGL.PointAnnotation>
        )}
        {listings.map(l => (
          <MapLibreGL.PointAnnotation
            key={l.id}
            id={l.id}
            coordinate={[l.longitude, l.latitude]}
            onSelected={() => setSelected(l)}>
            <View style={[styles.pin, selected?.id === l.id && styles.pinActive]}>
              <Text style={[styles.pinText, selected?.id === l.id && { color: '#fff' }]}>
                {label(l)}
              </Text>

            </View>
          </MapLibreGL.PointAnnotation>
        ))}
      </MapLibreGL.MapView>

      {selected && (
        <Pressable
          style={styles.card}
          onPress={() => navigation.navigate('ListingDetail', { id: selected.id })}>
          {/* ADAPTER 'ListingDetail' au nom réel de votre écran Détail */}
          {selected.photos?.[0] ? (
            <Image source={{ uri: selected.photos[0] }} style={styles.photo} />
          ) : null}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.price}>{selected.price} €</Text>
            <Text>{selected.title}</Text>
            <Text style={{ color: '#667' }}>
              {selected.city} · {selected.surface} m²
            </Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  me: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#2f6fe4', borderWidth: 3, borderColor: '#fff' },
  pin: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 18, backgroundColor: '#fff', borderWidth: 2, borderColor: '#0B6B5C' },
  pinActive: { backgroundColor: '#0B6B5C' },
  pinText: { fontWeight: 'bold', color: '#0B6B5C' },
  card: { position: 'absolute', left: 16, right: 16, bottom: 16, flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 12, elevation: 4 },

  photo: { width: 60, height: 60, borderRadius: 8 },
  price: { fontWeight: 'bold', fontSize: 18 },
});