import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, Region } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '../components/ui';
import { colors } from '../theme';
import { Listing } from '../data/models/Listing';
import { LatLng, distanceKm, shortPrice } from '../features/map/geo';
import { useMapListings, useNearby } from '../features/map/useNearby';
import { ListingPreview, NearbyPanel, NearbyResults } from '../features/map/NearbyControls';

// Carte native avec react-native-maps (Apple Plans sur iOS, Google Maps sur Android).
// Ce module est inclus dans Expo Go, contrairement à MapLibre qui faisait planter
// l'appli au démarrage (« native module that doesn't exist »).

const TUNIS: Region = { latitude: 36.8065, longitude: 10.1815, latitudeDelta: 0.12, longitudeDelta: 0.12 };

/** Région qui montre tout le cercle de recherche (1° de latitude ≈ 111 km). */
const regionFor = (p: LatLng, radiusKm?: number): Region => {
  const delta = radiusKm ? (radiusKm * 2.6) / 111 : 0.05;
  return { latitude: p.latitude, longitude: p.longitude, latitudeDelta: delta, longitudeDelta: delta };
};

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { listings, error } = useMapListings();
  const nearby = useNearby(listings);
  const [selected, setSelected] = useState<Listing | null>(null);

  const { me, active, radiusKm } = nearby;

  const moveTo = (region: Region) => mapRef.current?.animateToRegion(region, 600);

  // Centre la carte sur l'utilisateur et adapte le zoom au rayon de recherche.
  useEffect(() => {
    if (me) moveTo(regionFor(me, active ? radiusKm : undefined));
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
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={TUNIS}
        showsCompass={false}
        toolbarEnabled={false}
        onPress={() => setSelected(null)}
      >
        {me && active ? (
          <Circle
            center={me}
            radius={radiusKm * 1000}
            strokeColor={colors.primary}
            strokeWidth={2}
            fillColor="rgba(11, 107, 91, 0.08)"
          />
        ) : null}

        {me ? (
          <Marker coordinate={me} anchor={{ x: 0.5, y: 0.5 }} title="Vous êtes ici">
            <View style={styles.me} />
          </Marker>
        ) : null}

        {shown.map((l) => {
          const on = selected?.id === l.id;
          return (
            <Marker
              key={`${l.id}-${on ? 1 : 0}-${nearIds.has(l.id) ? 1 : 0}`}
              coordinate={{ latitude: l.latitude!, longitude: l.longitude! }}
              stopPropagation
              onPress={() => setSelected(l)}
            >
              <View style={[styles.pin, nearIds.has(l.id) && styles.pinNear, on && styles.pinActive]}>
                <Text style={[styles.pinText, on && { color: '#fff' }]}>
                  {shortPrice(l.price, l.transactionType)}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

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
            onPress={() => moveTo(regionFor(me, active ? radiusKm : undefined))}
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
            moveTo(regionFor({ latitude: l.latitude!, longitude: l.longitude! }, 0.4));
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
