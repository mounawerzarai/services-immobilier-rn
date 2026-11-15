import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  collection, query, where, orderBy, limit, onSnapshot,
} from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { db } from '../core/firebase';

type Listing = {
  id: string; title: string; city: string; price: number; surface: number;
  latitude: number; longitude: number; transactionType: 'sale' | 'rent'; photos?: string[];
};

const label = (l: Listing) =>
  l.transactionType === 'rent' || l.price < 1000
    ? `${l.price} €`
    : `${Math.round(l.price / 1000)} k€`;

const pin = (text: string, active: boolean) =>
  L.divIcon({
    className: '',
    iconSize: [80, 36],
    iconAnchor: [40, 18],
    html: `<div style="display:flex;align-items:center;justify-content:center;height:36px;border-radius:18px;border:2px solid #0B6B5C;font-weight:bold;font-family:sans-serif;background:${active ? '#0B6B5C' : '#fff'};color:${active ? '#fff' : '#0B6B5C'}">${text}</div>`,
  });

const meIcon = L.divIcon({
  className: '',
  iconSize: [22, 22],

  iconAnchor: [11, 11],
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#2f6fe4;border:3px solid #fff"></div>',
});

function Recenter({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.setView(pos, 13);
  }, [pos]);
  return null;
}

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [me, setMe] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

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

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setMe([p.coords.latitude, p.coords.longitude]),
      () => {},
    );
  }, []);

  if (error) {
    return <View style={{ flex: 1, padding: 16 }}><Text>Erreur : {error}</Text></View>;
  }

  return (
    <View style={{ flex: 1 }}>
      <MapContainer
        center={[36.8065, 10.1815]}

        zoom={12}
        style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <Recenter pos={me} />
        {me && <Marker position={me} icon={meIcon} />}
        {listings.map(l => (
          <Marker
            key={l.id}
            position={[l.latitude, l.longitude]}
            icon={pin(label(l), selected?.id === l.id)}
            eventHandlers={{ click: () => setSelected(l) }}
          />
        ))}
      </MapContainer>

      {selected && (
        <Pressable
          onPress={() => navigation.navigate('ListingDetail', { id: selected.id })}
          style={{
            position: 'absolute', left: 16, right: 16, bottom: 16, zIndex: 1000,
            flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 12,
          }}>
          {selected.photos?.[0] ? (
            <Image source={{ uri: selected.photos[0] }} style={{ width: 60, height: 60, borderRadius: 8 }} />
          ) : null}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{selected.price} €</Text>
            <Text>{selected.title}</Text>
            <Text style={{ color: '#667' }}>{selected.city} · {selected.surface} m²</Text>

          </View>
        </Pressable>
      )}
    </View>
  );
}
