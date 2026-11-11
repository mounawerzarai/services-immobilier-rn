import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DocumentSnapshot } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { Listing } from '../data/models/Listing';
import { getAvailableListingsPage, getSearchPool } from '../data/services/listings';
import ListingCard from '../features/listings/ListingCard';
import { filterListings } from '../features/search/searchListings';

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

  // Recherche texte : on charge une réserve d’annonces une seule fois (à la première
  // lettre tapée), puis on filtre côté appli à chaque frappe.
  const [term, setTerm] = useState('');
  const [pool, setPool] = useState<Listing[] | null>(null);
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolError, setPoolError] = useState(false);
  const searching = term.trim().length > 0;

  const loadPool = () => {
    setPoolLoading(true);
    setPoolError(false);
    getSearchPool()
      .then(setPool)
      .catch(() => setPoolError(true))
      .finally(() => setPoolLoading(false));
  };

  const onChangeTerm = (text: string) => {
    setTerm(text);
    if (text.trim() && pool === null && !poolLoading && !poolError) loadPool();
  };

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
    if (searching) loadPool(); // rafraîchit aussi les résultats de recherche
    else setPool(null);
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
    if (searching || !hasMore || loadingMore || loading || refreshing || error) return;
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

  const data = searching ? filterListings(pool ?? [], term) : items;

  const header = (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Annonces</Text>
        <Pressable onPress={() => navigation.navigate('MyListings')} hitSlop={8}>
          <Text style={styles.link}>Mes annonces</Text>
        </Pressable>
      </View>
      <TextInput
        style={styles.search}
        value={term}
        onChangeText={onChangeTerm}
        placeholder="Rechercher (ville, titre, type…)"
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      {searching && pool !== null ? (
        <Text style={styles.count}>
          {data.length} résultat{data.length > 1 ? 's' : ''}
        </Text>
      ) : null}
    </View>
  );

  const empty = searching ? (
    poolLoading ? (
      <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
    ) : poolError ? (
      <View style={styles.center}>
        <Text style={styles.message}>Impossible de lancer la recherche. Vérifiez votre connexion.</Text>
        <Pressable style={styles.buttonOutline} onPress={loadPool}>
          <Text style={styles.buttonOutlineText}>Réessayer</Text>
        </Pressable>
      </View>
    ) : (
      <View style={styles.center}>
        <Text style={styles.message}>Aucun résultat pour « {term.trim()} ».</Text>
      </View>
    )
  ) : loading ? (
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
        data={data}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  link: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  search: {
    height: 46,
    paddingHorizontal: 14,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    backgroundColor: '#fff',
    color: colors.text,
    fontSize: 15,
    marginBottom: 12,
  },
  count: { color: colors.muted, marginBottom: 12 },
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