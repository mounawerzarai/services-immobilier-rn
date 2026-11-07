import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { auth } from '../core/firebase';
import { colors, radius } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { ListingDetail, getListingDetail } from '../data/services/listings';
import PhotoCarousel from '../features/listings/PhotoCarousel';
import { formatPrice, propertyTypeLabel, transactionLabel } from '../features/listings/format';

type Props = NativeStackScreenProps<RootStackParamList, 'ListingDetail'>;
type LoadState = 'loading' | 'ready' | 'notfound' | 'error';

export default function ListingDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();

  const [state, setState] = useState<LoadState>('loading');
  const [detail, setDetail] = useState<ListingDetail | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getListingDetail(id)
      .then((found) => {
        if (!active) return;
        if (found) {
          setDetail(found);
          setState('ready');
        } else {
          setState('notfound');
        }
      })
      .catch(() => active && setState('error'));
    return () => {
      active = false;
    };
  }, [id, attempt]);

  const retry = () => {
    setState('loading');
    setAttempt((n) => n + 1);
  };

  if (state === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (state === 'notfound' || state === 'error' || !detail) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          {state === 'notfound'
            ? 'Cette annonce n’existe plus.'
            : 'Impossible de charger l’annonce. Vérifiez votre connexion.'}
        </Text>
        <Pressable
          style={styles.buttonOutline}
          onPress={state === 'notfound' ? () => navigation.goBack() : retry}
        >
          <Text style={styles.buttonOutlineText}>{state === 'notfound' ? 'Retour' : 'Réessayer'}</Text>
        </Pressable>
      </View>
    );
  }

  const { listing, seller } = detail;
  const isMine = listing.sellerId === auth.currentUser?.uid;
  const closed = listing.status !== 'available';
  const facts = [
    propertyTypeLabel(listing.propertyType),
    listing.surface ? `${listing.surface} m²` : '',
    listing.rooms ? `${listing.rooms} pièce${listing.rooms > 1 ? 's' : ''}` : '',
  ].filter(Boolean);
  const place = [listing.address, listing.city].filter(Boolean).join(', ');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <PhotoCarousel photos={listing.photos} />

        <View style={styles.body}>
          {closed ? (
            <Text style={styles.closed}>
              Cette annonce est {listing.status === 'rented' ? 'louée' : 'vendue'}.
            </Text>
          ) : null}

          <View style={styles.row}>
            <Text style={styles.price}>{formatPrice(listing)}</Text>
            <Text style={styles.badge}>{transactionLabel(listing.transactionType)}</Text>
          </View>

          <Text style={styles.title}>{listing.title}</Text>
          {place ? <Text style={styles.place}>{place}</Text> : null}

          {facts.length > 0 ? (
            <View style={styles.facts}>
              {facts.map((f) => (
                <Text key={f} style={styles.fact}>
                  {f}
                </Text>
              ))}
            </View>
          ) : null}

          {listing.description ? (
            <>
              <Text style={styles.section}>Description</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </>
          ) : null}

          <Text style={styles.section}>Vendeur</Text>
          <View style={styles.seller}>
            <Text style={styles.sellerName}>{seller?.name || 'Vendeur'}</Text>
            {seller?.phone ? <Text style={styles.sellerPhone}>{seller.phone}</Text> : null}
          </View>
        </View>
      </ScrollView>

      {!isMine ? (
        <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
          {/* Favori (T7) et Contacter (T8) seront branchés dans leurs tâches. */}
          <Pressable style={[styles.barButton, styles.barOutline, styles.disabled]} disabled>
            <Text style={styles.barOutlineText}>♡ Favori</Text>
          </Pressable>
          <Pressable style={[styles.barButton, styles.barPrimary, styles.disabled]} disabled>
            <Text style={styles.barPrimaryText}>Contacter</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: colors.background,
  },
  message: { color: colors.muted, textAlign: 'center' },
  buttonOutline: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutlineText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  body: { padding: 20, gap: 8 },
  closed: {
    color: '#B3261E',
    backgroundColor: '#FCEAE8',
    padding: 10,
    borderRadius: radius.input,
    overflow: 'hidden',
    fontWeight: '600',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 26, fontWeight: '700', color: colors.text },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  title: { fontSize: 18, color: colors.text },
  place: { fontSize: 14, color: colors.muted },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  fact: {
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  section: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 18 },
  description: { fontSize: 15, lineHeight: 22, color: colors.text },
  seller: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 14,
    gap: 2,
  },
  sellerName: { fontSize: 15, fontWeight: '600', color: colors.text },
  sellerPhone: { fontSize: 14, color: colors.muted },
  bar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  barButton: {
    flex: 1,
    height: 50,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barOutline: { borderWidth: 1.5, borderColor: colors.primary },
  barOutlineText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  barPrimary: { backgroundColor: colors.primary },
  barPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
