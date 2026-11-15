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
import FilterSheet from '../features/search/FilterSheet';
import { EMPTY_FILTERS, Filters, applyFilters, countActiveFilters } from '../features/search/filters';
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

  // Recherche texte (T5.1) et filtres (T5.2) : on charge une réserve d’annonces une seule
  // fois (dès qu’on tape une lettre ou qu’on applique un filtre), puis on filtre côté appli.
  const [term, setTerm] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pool, setPool] = useState<Listing[] | null>(null);
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolError, setPoolError] = useState(false);

  const activeFilters = countActiveFilters(filters);
  const searching = term.trim().length > 0;
  const filtering = searching || activeFilters > 0; // on affiche la liste filtrée, sans pagination

  const loadPool = () => {
    setPoolLoading(true);
    setPoolError(false);
    getSearchPool()
      .then(setPool)
      .catch(() => setPoolError(true))
      .finally(() => setPoolLoading(false));
  };

  const ensurePool = () => {
    if (pool === null && !poolLoading && !poolError) loadPool();
  };

  const onChangeTerm = (text: string) => {
    setTerm(text);
    if (text.trim()) ensurePool();
  };

  const onApplyFilters = (next: Filters) => {
    setFilters(next);
    setSheetOpen(false);
    if (countActiveFilters(next) > 0) ensurePool();
  };

  const clearFilters = () => setFilters(EMPTY_FILTERS);

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
    if (filtering) loadPool(); // rafraîchit aussi les résultats filtrés
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
    if (filtering || !hasMore || loadingMore || loading || refreshing || error) return;
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

  const data = filtering ? applyFilters(filterListings(pool ?? [], term), filters) : items;

  const header = (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Annonces</Text>
        <Pressable onPress={() => navigation.navigate('MyListings')} hitSlop={8}>
          <Text style={styles.link}>Mes annonces</Text>
        </Pressable>
      </View>
      <View style={styles.searchRow}>
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
        <Pressable
          accessibilityRole="button"
          style={[styles.filterButton, activeFilters > 0 && styles.filterButtonOn]}
          onPress={() => setSheetOpen(true)}
        >
          <Text style={[styles.filterText, activeFilters > 0 && styles.filterTextOn]}>
            Filtres{activeFilters > 0 ? ` (${activeFilters})` : ''}
          </Text>
        </Pressable>
      </View>
      {filtering && pool !== null ? (
        <View style={styles.countRow}>
          <Text style={styles.count}>
            {data.length} résultat{data.length > 1 ? 's' : ''}
          </Text>
          {activeFilters > 0 ? (
            <Pressable onPress={clearFilters} hitSlop={8}>
              <Text style={styles.link}>Effacer les filtres</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  const empty = filtering ? (
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
        <Text style={styles.message}>
          {searching ? `Aucun résultat pour « ${term.trim()} ».` : 'Aucune annonce ne correspond aux filtres.'}
        </Text>
        {activeFilters > 0 ? (
          <Pressable style={styles.buttonOutline} onPress={clearFilters}>
            <Text style={styles.buttonOutlineText}>Effacer les filtres</Text>
          </Pressable>
        ) : null}
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

      <FilterSheet
        visible={sheetOpen}
        filters={filters}
        onApply={onApplyFilters}
        onClose={() => setSheetOpen(false)}
      />
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
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  search: {
    flex: 1,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: '#d0d5dd',
    backgroundColor: '#fff',
    color: colors.text,
    fontSize: 15,
  },
  filterButton: {
    height: 46,
    paddingHorizontal: 14,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonOn: { backgroundColor: colors.primary },
  filterText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  filterTextOn: { color: '#fff' },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  count: { color: colors.muted },
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
