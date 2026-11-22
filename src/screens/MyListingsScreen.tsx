import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { auth, db } from '../core/firebase';
import { confirmAndDeleteListing, toggleListingStatus } from '../data/services/myListings';
import { errorText, showMessage } from '../core/dialogs';
import { EmptyState, IconName, IconText, Pill } from '../components/ui';
import { formatPrice, statusLabel } from '../features/listings/format';
import { Listing } from '../data/models/Listing';
import { colors, radius, shadow } from '../theme';

function Action({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const color = danger ? colors.danger : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, danger && styles.actionDanger, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export default function MyListingsScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Listing[] | null>(null);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, 'listings'),
      where('sellerId', '==', uid),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(
      q,
      (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Listing, 'id'>) }))),
      (e) => showMessage('Erreur', errorText(e)),
    );
  }, [uid]);

  if (!uid) {
    return <EmptyState icon="person-outline" title="Connectez-vous pour voir vos annonces." />;
  }
  if (items === null) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.canvas }}
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: 20, gap: 14, flexGrow: 1 }}
      ListHeaderComponent={
        items.length > 0 ? (
          <Text style={styles.count}>
            {items.length} annonce{items.length > 1 ? 's' : ''} publiée{items.length > 1 ? 's' : ''}
          </Text>
        ) : undefined
      }
      ListEmptyComponent={
        <EmptyState
          icon="albums-outline"
          title="Aucune annonce publiée"
          text="Publiez votre premier bien en quelques minutes."
          actionLabel="Publier une annonce"
          onAction={() => navigation.navigate('Publish')}
        />
      }
      renderItem={({ item }) => {
        const isRent = item.transactionType === 'rent';
        const available = item.status === 'available';
        return (
          <View style={styles.card}>
            <Pressable
              style={styles.top}
              onPress={() => navigation.navigate('ListingDetail', { id: item.id })}
            >
              {item.photos?.[0] ? (
                <Image source={{ uri: item.photos[0] }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.noPhoto]}>
                  <Ionicons name="image-outline" size={22} color={colors.subtle} />
                </View>
              )}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.price}>{formatPrice(item)}</Text>
                <View style={styles.metaRow}>
                  {item.city ? <IconText icon="location-outline" text={item.city} /> : null}
                  <Pill
                    label={statusLabel[item.status] ?? item.status}
                    tone={available ? 'primary' : 'neutral'}
                  />
                </View>
              </View>
            </Pressable>

            <View style={styles.actions}>
              <Action
                icon="create-outline"
                label="Modifier"
                onPress={() => navigation.navigate('Publish', { id: item.id })}
              />
              <Action
                icon={available ? 'checkmark-done-outline' : 'refresh-outline'}
                label={available ? (isRent ? 'Loué' : 'Vendu') : 'En ligne'}
                onPress={() => toggleListingStatus(item)}
              />
              <Action
                icon="trash-outline"
                label="Supprimer"
                danger
                onPress={() => confirmAndDeleteListing(item.id, item.title)}
              />
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  count: { color: colors.muted, fontWeight: '600', marginBottom: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 12,
    gap: 12,
    ...shadow(1),
  },
  top: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  photo: { width: 84, height: 84, borderRadius: radius.md },
  noPhoto: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '700', fontSize: 15, color: colors.text },
  price: { fontWeight: '800', fontSize: 16, color: colors.primary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  action: {
    flex: 1,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionDanger: { backgroundColor: colors.dangerSoft },
  actionText: { fontWeight: '700', fontSize: 13 },
});
