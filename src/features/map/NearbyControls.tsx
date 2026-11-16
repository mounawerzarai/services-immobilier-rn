import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Chip, IconText, Pill } from '../../components/ui';
import { colors, radius, shadow } from '../../theme';
import { Listing } from '../../data/models/Listing';
import { formatPrice } from '../listings/format';
import { RADIUS_CHOICES, formatDistance } from './geo';
import { LocateStatus, NearbyListing } from './useNearby';

interface PanelProps {
  active: boolean;
  status: LocateStatus;
  radiusKm: number;
  count: number;
  topInset: number;
  onToggle: () => void;
  onRadius: (km: number) => void;
}

/** Bandeau du haut : bouton « Autour de moi » et choix du rayon en km. */
export function NearbyPanel({ active, status, radiusKm, count, topInset, onToggle, onRadius }: PanelProps) {
  const locating = status === 'locating';
  return (
    <View style={[styles.panel, { top: topInset + 10 }]} pointerEvents="box-none">
      <View style={styles.panelCard}>
        <View style={styles.panelRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.panelTitle}>Autour de moi</Text>
            <Text style={styles.panelText} numberOfLines={1}>
              {status === 'denied'
                ? 'Localisation refusée : autorisez-la pour utiliser cette recherche.'
                : status === 'unavailable'
                  ? 'Position indisponible pour le moment.'
                  : active
                    ? `${count} annonce${count > 1 ? 's' : ''} à moins de ${radiusKm} km`
                    : 'Trouvez les biens proches de votre position.'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: active }}
            onPress={onToggle}
            disabled={locating}
            style={[styles.toggle, active && styles.toggleOn]}
          >
            {locating ? (
              <ActivityIndicator size="small" color={active ? '#fff' : colors.primary} />
            ) : (
              <Ionicons name={active ? 'navigate' : 'navigate-outline'} size={18} color={active ? '#fff' : colors.primary} />
            )}
            <Text style={[styles.toggleText, active && { color: '#fff' }]}>{active ? 'Activé' : 'Activer'}</Text>
          </Pressable>
        </View>

        {active ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radii}>
            <Text style={styles.radiusLabel}>Rayon</Text>
            {RADIUS_CHOICES.map((km) => (
              <Chip key={km} label={`${km} km`} selected={radiusKm === km} onPress={() => onRadius(km)} />
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

/** Liste horizontale des résultats, triés par distance. */
export function NearbyResults({
  results,
  onOpen,
  onFocus,
  bottom,
}: {
  results: NearbyListing[];
  onOpen: (id: string) => void;
  onFocus: (l: NearbyListing) => void;
  bottom: number;
}) {
  if (results.length === 0) {
    return (
      <View style={[styles.emptyBox, { bottom }]}>
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <Text style={styles.emptyText}>Aucune annonce dans ce rayon. Essayez un rayon plus grand.</Text>
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.results, { bottom }]}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
    >
      {results.map((l) => (
        <Pressable key={l.id} style={styles.resultCard} onPress={() => onOpen(l.id)} onLongPress={() => onFocus(l)}>
          <ListingThumb listing={l} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.resultPrice} numberOfLines={1}>
              {formatPrice(l)}
            </Text>
            <Text style={styles.resultTitle} numberOfLines={1}>
              {l.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Pill label={formatDistance(l.distanceKm)} icon="navigate" />
              {l.city ? <IconText icon="location-outline" text={l.city} size={12} /> : null}
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

/** Aperçu de l'annonce sélectionnée sur la carte. */
export function ListingPreview({
  listing,
  distance,
  onOpen,
  onClose,
  bottom,
}: {
  listing: Listing;
  distance?: number;
  onOpen: () => void;
  onClose: () => void;
  bottom: number;
}) {
  return (
    <Pressable style={[styles.preview, { bottom }]} onPress={onOpen}>
      <ListingThumb listing={listing} size={72} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.resultPrice}>{formatPrice(listing)}</Text>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {listing.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {distance !== undefined ? <Pill label={formatDistance(distance)} icon="navigate" /> : null}
          <IconText
            icon="location-outline"
            text={[listing.city, listing.surface ? `${listing.surface} m²` : ''].filter(Boolean).join(' · ')}
            size={12}
          />
        </View>
      </View>
      <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Fermer">
        <Ionicons name="close" size={20} color={colors.muted} />
      </Pressable>
    </Pressable>
  );
}

function ListingThumb({ listing, size = 64 }: { listing: Listing; size?: number }) {
  return listing.photos?.[0] ? (
    <Image source={{ uri: listing.photos[0] }} style={{ width: size, height: size, borderRadius: 12 }} />
  ) : (
    <View style={[styles.noPhoto, { width: size, height: size }]}>
      <Ionicons name="image-outline" size={20} color={colors.subtle} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', left: 16, right: 16, zIndex: 1000 },
  panelCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 14, gap: 10, ...shadow(2) },
  panelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  panelTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  panelText: { fontSize: 13, color: colors.muted, marginTop: 2 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  toggleOn: { backgroundColor: colors.primary },
  toggleText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  radii: { gap: 8, alignItems: 'center' },
  radiusLabel: { fontSize: 13, fontWeight: '700', color: colors.muted, marginRight: 2 },
  results: { position: 'absolute', left: 0, right: 0, zIndex: 1000, flexGrow: 0 },
  resultCard: {
    width: 290,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 10,
    ...shadow(2),
  },
  resultPrice: { fontSize: 16, fontWeight: '800', color: colors.primary },
  resultTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  noPhoto: { borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  emptyBox: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 14,
    ...shadow(2),
  },
  emptyText: { flex: 1, color: colors.muted, fontSize: 13 },
  preview: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 10,
    ...shadow(3),
  },
});
