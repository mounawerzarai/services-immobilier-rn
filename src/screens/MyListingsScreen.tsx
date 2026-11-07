import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../core/firebase';
import { deleteListing, setListingStatus } from '../services/listingService';
import { colors, radius } from '../theme';

const LABELS: Record<string, string> = {
  available: 'Disponible',
  sold: 'Vendu',
  rented: 'Loué',
};

export default function MyListingsScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<any[] | null>(null);
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
      (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => Alert.alert('Erreur', String(e)),
    );
  }, [uid]);

  const confirmDelete = (id: string) =>
    Alert.alert("Supprimer l'annonce ?", 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () =>
          deleteListing(id).catch((e) => Alert.alert('Erreur', String(e))),
      },
    ]);

  const toggleStatus = (item: any) => {
    const closed = item.transactionType === 'rent' ? 'rented' : 'sold';
    setListingStatus(
      item.id,
      item.status === 'available' ? closed : 'available',
    ).catch((e) => Alert.alert('Erreur', String(e)));
  };

  if (!uid) {
    return <Text style={s.message}>Connectez-vous pour voir vos annonces.</Text>;
  }
  if (items === null) {
    return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;
  }
  if (items.length === 0) {
    return <Text style={s.message}>Vous n&apos;avez aucune annonce.</Text>;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      renderItem={({ item }) => {
        const isRent = item.transactionType === 'rent';
        const available = item.status === 'available';
        return (
          <View style={s.card}>
            <View style={s.top}>
              {item.photos?.[0] ? (
                <Image source={{ uri: item.photos[0] }} style={s.photo} />
              ) : (
                <View style={[s.photo, { backgroundColor: colors.primaryLight }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{item.title}</Text>
                <Text style={{ color: colors.muted }}>
                  {item.price} · {item.city} · {LABELS[item.status] ?? item.status}
                </Text>
              </View>
            </View>

            <View style={s.actions}>
              <Pressable onPress={() => navigation.navigate('Publish', { id: item.id })}>
                <Text style={s.link}>Modifier</Text>
              </Pressable>
              <Pressable onPress={() => toggleStatus(item)}>
                <Text style={s.link}>
                  {available
                    ? isRent ? 'Marquer loué' : 'Marquer vendu'
                    : 'Remettre en ligne'}
                </Text>
              </Pressable>
              <Pressable onPress={() => confirmDelete(item.id)}>
                <Text style={[s.link, { color: '#C0392B' }]}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  message: { padding: 24, color: colors.text },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 12,
    gap: 10,
  },
  top: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  photo: { width: 56, height: 56, borderRadius: 10 },
  title: { fontWeight: '700', color: colors.text },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  link: { color: colors.primary, fontWeight: '600' },
});