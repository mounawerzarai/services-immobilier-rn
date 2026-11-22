import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '../components/ui';
import { colors } from '../theme';
import { Listing } from '../data/models/Listing';
import { LatLng, distanceKm, shortPrice, zoomForRadius } from '../features/map/geo';
import { useMapListings, useNearby } from '../features/map/useNearby';
import { ListingPreview, NearbyPanel, NearbyResults } from '../features/map/NearbyControls';

const TUNIS: [number, number] = [36.8065, 10.1815];

const pin = (text: string, active: boolean, near: boolean) =>
  L.divIcon({
    className: '',
    iconSize: [90, 34],
    iconAnchor: [45, 17],
    html: `<div style="display:flex;align-items:center;justify-content:center;height:32px;padding:0 10px;border-radius:16px;border:2px solid ${colors.primary};font:700 13px system-ui,sans-serif;white-space:nowrap;box-shadow:0 3px 10px rgba(20,33,43,.18);background:${active ? colors.primary : near ? colors.primarySoft : '#fff'};color:${active ? '#fff' : colors.primary}">${text}</div>`,
  });

const meIcon = L.divIcon({
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#2f6fe4;border:3px solid #fff;box-shadow:0 0 0 6px rgba(47,111,228,.25)"></div>',
});

type Target = { center: [number, number]; zoom: number; n?: number };

/** Déplace la carte vers la cible (position, rayon, annonce choisie). */
function Camera({ target }: { target: Target | null }) {
  const map = useMap();
  const lat = target?.center[0];
  const lng = target?.center[1];
  const zoom = target?.zoom;
  const n = target?.n;
  useEffect(() => {
    if (lat !== undefined && lng !== undefined && zoom !== undefined) {
      map.setView([lat, lng], zoom, { animate: true });
    }
  }, [map, lat, lng, zoom, n]);
  return null;
}

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { listings, error } = useMapListings();
  const nearby = useNearby(listings);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [override, setOverride] = useState<Target | null>(null);

  // Feuille de style Leaflet (chargée une fois).
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Centre la carte sur l'utilisateur (et adapte le zoom au rayon quand la recherche est active).
  const { me, active, radiusKm } = nearby;
  const base: Target | null = me
    ? { center: [me.latitude, me.longitude], zoom: active ? zoomForRadius(radiusKm) : 13 }
    : null;

  if (error) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
        <Text style={{ color: colors.danger }}>Erreur : {error}</Text>
      </View>
    );
  }

  const shown = active ? nearby.results : listings;
  const nearIds = new Set(nearby.results.map((l) => l.id));
  const dist = (l: Listing) =>
    me && typeof l.latitude === 'number' && typeof l.longitude === 'number'
      ? distanceKm(me, l as LatLng)
      : undefined;

  return (
    <View style={{ flex: 1 }}>
      <MapContainer center={TUNIS} zoom={12} zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <Camera target={override ?? base} />
        {me && active ? (
          <Circle
            center={[me.latitude, me.longitude]}
            radius={radiusKm * 1000}
            pathOptions={{ color: colors.primary, weight: 2, fillColor: colors.primary, fillOpacity: 0.08 }}
          />
        ) : null}
        {me ? <Marker position={[me.latitude, me.longitude]} icon={meIcon} /> : null}
        {shown.map((l) => (
          <Marker
            key={l.id}
            position={[l.latitude!, l.longitude!]}
            icon={pin(shortPrice(l.price, l.transactionType), selected?.id === l.id, nearIds.has(l.id))}
            eventHandlers={{ click: () => setSelected(l) }}
          />
        ))}
      </MapContainer>

      <NearbyPanel
        active={active}
        status={nearby.status}
        radiusKm={radiusKm}
        count={nearby.results.length}
        topInset={insets.top}
        onToggle={() => {
          setSelected(null);
          setOverride(null);
          nearby.toggle();
        }}
        onRadius={(km) => {
          setOverride(null);
          nearby.setRadiusKm(km);
        }}
      />

      {me ? (
        <View style={{ position: 'absolute', right: 16, bottom: (active ? 112 : 16) + (selected ? 104 : 8), zIndex: 1000 }}>
          <IconButton
            icon="locate"
            label="Me localiser"
            color={colors.primary}
            onPress={() => base && setOverride({ ...base, n: Date.now() })}
          />
        </View>
      ) : null}

      {selected ? (
        <ListingPreview
          listing={selected}
          distance={dist(selected)}
          bottom={active ? 112 : 16}
          onOpen={() => navigation.navigate('ListingDetail', { id: selected.id })}
          onClose={() => setSelected(null)}
        />
      ) : null}

      {active ? (
        <NearbyResults
          results={nearby.results}
          bottom={16}
          onOpen={(id) => navigation.navigate('ListingDetail', { id })}
          onFocus={(l) => {
            setSelected(l);
            setOverride({ center: [l.latitude!, l.longitude!], zoom: 15, n: Date.now() });
          }}
        />
      ) : null}
    </View>
  );
}
