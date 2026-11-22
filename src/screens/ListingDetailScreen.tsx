import { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import FavoriteButton from '../components/FavoriteButton';
import { AppButton, Avatar, EmptyState, IconButton, IconName, IconText, Pill } from '../components/ui';
import { confirmAndDeleteListing } from '../data/services/myListings';
import { ContactError, startConversation } from '../data/services/messaging';
import { errorText, showMessage } from '../core/dialogs';
import { auth } from '../core/firebase';
import { colors, radius, shadow } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { ListingDetail, getListingDetail } from '../data/services/listings';
import PhotoCarousel from '../features/listings/PhotoCarousel';
import { formatPrice, propertyTypeLabel, transactionLabel } from '../features/listings/format';

type Props = NativeStackScreenProps<RootStackParamList, 'ListingDetail'>;
type LoadState = 'loading' | 'ready' | 'notfound' | 'error';

function Fact({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <View style={styles.factIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.factValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.factLabel}>{label}</Text>
    </View>
  );
}

export default function ListingDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();

  const [state, setState] = useState<LoadState>('loading');
  const [detail, setDetail] = useState<ListingDetail | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [contacting, setContacting] = useState(false);

  // Bouton retour rond, lisible sur n'importe quelle photo.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <IconButton
          icon="chevron-back"
          label="Retour"
          size={40}
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 4 }}
        />
      ),
    });
  }, [navigation]);

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
      <View style={[styles.center, { paddingTop: insets.top + 40 }]}>
        <EmptyState
          icon={state === 'notfound' ? 'trash-outline' : 'cloud-offline-outline'}
          tone={state === 'notfound' ? 'primary' : 'danger'}
          title={state === 'notfound' ? 'Cette annonce n’existe plus' : 'Chargement impossible'}
          text={state === 'notfound' ? undefined : 'Vérifiez votre connexion puis réessayez.'}
          actionLabel={state === 'notfound' ? 'Retour' : 'Réessayer'}
          onAction={state === 'notfound' ? () => navigation.goBack() : retry}
        />
      </View>
    );
  }

  const { listing, seller } = detail;
  const isMine = listing.sellerId === auth.currentUser?.uid;
  const closed = listing.status !== 'available';
  const place = [listing.address, listing.city].filter(Boolean).join(', ');

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <PhotoCarousel photos={listing.photos} />

        <View style={styles.sheet}>
          <View style={styles.pills}>
            <Pill
              label={transactionLabel(listing.transactionType)}
              tone={listing.transactionType === 'rent' ? 'accent' : 'primary'}
            />
            {listing.propertyType ? (
              <Pill label={propertyTypeLabel(listing.propertyType)} tone="neutral" />
            ) : null}
            {closed ? (
              <Pill label={listing.status === 'rented' ? 'Loué' : 'Vendu'} tone="danger" />
            ) : null}
          </View>

          <Text style={styles.title}>{listing.title}</Text>
          {place ? <IconText icon="location-outline" text={place} size={14} /> : null}
          <Text style={styles.price}>{formatPrice(listing)}</Text>

          <View style={styles.facts}>
            <Fact
              icon="business-outline"
              label="Type"
              value={propertyTypeLabel(listing.propertyType) || '—'}
            />
            <Fact icon="resize-outline" label="Surface" value={listing.surface ? `${listing.surface} m²` : '—'} />
            <Fact icon="bed-outline" label="Pièces" value={listing.rooms ? String(listing.rooms) : '—'} />
          </View>

          {listing.description ? (
            <>
              <Text style={styles.section}>Description</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </>
          ) : null}

          <Text style={styles.section}>{isMine ? 'Votre annonce' : 'Vendeur'}</Text>
          <View style={styles.seller}>
            <Avatar name={seller?.name || 'V'} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerName}>{seller?.name || 'Vendeur'}</Text>
              <Text style={styles.sellerMeta}>
                {seller?.phone ? seller.phone : 'Téléphone non renseigné'}
              </Text>
            </View>
            {seller?.phone && !isMine ? (
              <IconButton
                icon="call-outline"
                label="Appeler"
                color={colors.primary}
                background={colors.primarySoft}
                onPress={() => Linking.openURL(`tel:${seller.phone}`)}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
        {isMine ? (
          <>
            <AppButton
              label="Modifier"
              icon="create-outline"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => navigation.navigate('Publish', { id })}
            />
            <AppButton
              label="Supprimer"
              icon="trash-outline"
              variant="danger"
              style={{ flex: 1 }}
              onPress={async () => {
                if (await confirmAndDeleteListing(id, listing.title)) navigation.goBack();
              }}
            />
          </>
        ) : (
          <>
            <FavoriteButton listingId={id} />
            <AppButton
              label="Contacter"
              icon="chatbubble-ellipses-outline"
              style={{ flex: 1 }}
              loading={contacting}
              onPress={async () => {
                setContacting(true);
                try {
                  const conversationId = await startConversation({
                    listingId: listing.id || id,
                    listingTitle: listing.title,
                    listingPhoto: listing.photos?.[0] ?? null,
                    sellerId: listing.sellerId,
                    sellerName: seller?.name,
                  });
                  navigation.navigate('Chat', { id: conversationId });
                } catch (e) {
                  showMessage(
                    'Contact impossible',
                    e instanceof ContactError ? e.message : errorText(e),
                  );
                } finally {
                  setContacting(false);
                }
              }}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvas,
  },
  sheet: {
    marginTop: -26,
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 20,
    gap: 8,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  price: { fontSize: 26, fontWeight: '800', color: colors.primary, marginTop: 6, letterSpacing: -0.5 },
  facts: { flexDirection: 'row', gap: 10, marginTop: 12 },
  fact: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 4,
    ...shadow(1),
  },
  factIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  factValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  factLabel: { fontSize: 12, color: colors.muted },
  section: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 20 },
  description: { fontSize: 15, lineHeight: 23, color: '#3A4651' },
  seller: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 14,
    ...shadow(1),
  },
  sellerName: { fontSize: 16, fontWeight: '700', color: colors.text },
  sellerMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  bar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    ...shadow(3),
  },
});
