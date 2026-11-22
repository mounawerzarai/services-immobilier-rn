import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '../components/ui';
import { colors } from '../theme';
import { Listing } from '../data/models/Listing';
import { LatLng, circlePolygon, distanceKm, shortPrice, zoomForRadius } from '../features/map/geo';
import { useMapListings, useNearby } from '../features/map/useNearby';
import { ListingPreview, NearbyPanel, NearbyResults } from '../features/map/NearbyControls';

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

const TUNIS: [number, number] = [10.1815, 36.8065];

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<any>(null);
  const { listings, error } = useMapListings();
  const nearby = useNearby(listings);
  const [selected, setSelected] = useState<Listing | null>(null);

  const { me, active, radiusKm } = nearby;

  const moveTo = (center: [number, number], zoom: number) =>
    cameraRef.current?.setCamera({ centerCoordinate: center, zoomLevel: zoom, animationDuration: 600 });

  // Centre la carte sur l'utilisateur et adapte le zoom au rayon de recherche.
  useEffect(() => {
    if (me) moveTo([me.longitude, me.latitude], active ? zoomForRadius(radiusKm) : 13);
  }, [me, active, radiusKm]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
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
      <MapLibreGL.MapView style={{ flex: 1 }} mapStyle={OSM_STYLE} onPress={() => setSelected(null)}>
        <MapLibreGL.Camera ref={cameraRef} zoomLevel={12} centerCoordinate={TUNIS} />

        {me && active ? (
          <MapLibreGL.ShapeSource id="radius" shape={circlePolygon(me, radiusKm)}>
            <MapLibreGL.FillLayer id="radius-fill" style={{ fillColor: colors.primary, fillOpacity: 0.08 }} />
            <MapLibreGL.LineLayer id="radius-line" style={{ lineColor: colors.primary, lineWidth: 2 }} />
          </MapLibreGL.ShapeSource>
        ) : null}

        {me ? (
          <MapLibreGL.PointAnnotation id="me" coordinate={[me.longitude, me.latitude]}>
            <View style={styles.me} />
          </MapLibreGL.PointAnnotation>
        ) : null}

        {shown.map((l) => {
          const on = selected?.id === l.id;
          return (
            <MapLibreGL.PointAnnotation
              key={l.id}
              id={l.id}
              coordinate={[l.longitude!, l.latitude!]}
              onSelected={() => setSelected(l)}
            >
              <View style={[styles.pin, nearIds.has(l.id) && styles.pinNear, on && styles.pinActive]}>
                <Text style={[styles.pinText, on && { color: '#fff' }]}>
                  {shortPrice(l.price, l.transactionType)}
                </Text>
              </View>
            </MapLibreGL.PointAnnotation>
          );
        })}
      </MapLibreGL.MapView>

      <NearbyPanel
        active={active}
        status={nearby.status}
        radiusKm={radiusKm}
        count={nearby.results.length}
        topInset={insets.top}
        onToggle={() => {
          setSelected(null);
          nearby.toggle();
        }}
        onRadius={nearby.setRadiusKm}
      />

      {me ? (
        <View style={[styles.locate, { bottom: (active ? 112 : 16) + (selected ? 104 : 8) }]}>
          <IconButton
            icon="locate"
            label="Me localiser"
            color={colors.primary}
            onPress={() => moveTo([me.longitude, me.latitude], active ? zoomForRadius(radiusKm) : 13)}
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
            moveTo([l.longitude!, l.latitude!], 15);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  me: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2f6fe4',
    borderWidth: 3,
    borderColor: '#fff',
  },
  pin: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  pinNear: { backgroundColor: colors.primarySoft },
  pinActive: { backgroundColor: colors.primary },
  pinText: { fontWeight: '800', color: colors.primary, fontSize: 13 },
  locate: { position: 'absolute', right: 16, zIndex: 1000 },
});
