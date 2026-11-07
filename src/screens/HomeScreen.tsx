import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DocumentSnapshot } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { Listing } from '../data/models/Listing';
import { getAvailableListingsPage } from '../data/services/listings';
import ListingCard from '../features/listings/ListingCard';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true); // premier chargement
  const [refreshing, setRefreshing] = useState(false); // pull-to-refresh
  const [loadingMore, setLoadingMore] = useState(false); // page suivante
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const cursor = useRef<DocumentSnapshot | null>(null);

  // Premier chargement (les états « chargement » sont déjà à true au départ).
  useEffect(() => {
    getAvailableListingsPage(null)
      .then((page) => {
        cursor.current = page.cursor;
        setItems(page.items);
        setHasMore(page.hasMore);
      })
      .catch(() => setError('Impossible de charger les annonces. Vérifiez votre connexion.'))
      .finally(() => setLoading(false));
  }, []);

  // Rechargement depuis la première page (pull-to-refresh ou bouton Réessayer).
  const reload = (mode: 'refresh' | 'retry') => {
    setError(null);
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    getAvailableListingsPage(null)
      .then((page) => {
        cursor.current = page.cursor;
        setItems(page.items);
        setHasMore(page.hasMore);
      })
      .catch(() => setError('Impossible de charger les annonces. Vérifiez votre connexion.'))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore || loading || refreshing || error) return;
    setLoadingMore(true);
    try {
      const page = await getAvailableListingsPage(cursor.current);
      cursor.current = page.cursor;
      setItems((prev) => {
        const known = new Set(prev.map((i) => i.id));
        return [...prev, ...page.items.filter((i) => !known.has(i.id))];
      });
      setHasMore(page.hasMore);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const header = <Text style={styles.title}>Annonces</Text>;

  const empty = loading ? (
    <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
  ) : error ? (
    <View style={styles.center}>
      <Text style={styles.message}>{error}</Text>
      <Pressable style={styles.buttonOutline} onPress={() => reload('retry')}>
        <Text style={styles.buttonOutlineText}>Réessayer</Text>
      </Pressable>
    </View>
  ) : (
    <View style={styles.center}>
      <Text style={styles.message}>Aucune annonce pour le moment.</Text>
      <Pressable style={styles.buttonOutline} onPress={() => navigation.navigate('Publish')}>
        <Text style={styles.buttonOutlineText}>Publier une annonce</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} /> : undefined
        }
        renderItem={({ item }) => (
          <ListingCard
            item={item}
            onPress={() => navigation.navigate('ListingDetail', { id: item.id })}
          />
        )}
        refreshing={refreshing}
        onRefresh={() => reload('refresh')}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
      />

      <Pressable style={[styles.fab, { bottom: 20 }]} onPress={() => navigation.navigate('Publish')}>
        <Text style={styles.fabText}>+ Publier</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 16 },
  center: { alignItems: 'center', gap: 12, paddingVertical: 40 },
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
  fab: {
    position: 'absolute',
    right: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
  },
  fabText: { color: '#fff', fontWeight: '700' },
});
