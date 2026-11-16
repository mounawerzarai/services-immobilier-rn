import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DocumentSnapshot } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { auth } from '../core/firebase';
import { colors, radius, shadow } from '../theme';
import { AppButton, Chip, EmptyState, IconButton, IconName } from '../components/ui';
import { RootStackParamList } from '../navigation/types';
import { Listing } from '../data/models/Listing';
import { getAvailableListingsPage, getSearchPool } from '../data/services/listings';
import ListingCard from '../features/listings/ListingCard';
import FilterSheet from '../features/search/FilterSheet';
import {
  EMPTY_FILTERS,
  Filters,
  PROPERTY_TYPE_KEYS,
  applyFilters,
  countActiveFilters,
} from '../features/search/filters';
import { propertyTypeLabel } from '../features/listings/format';
import { filterListings } from '../features/search/searchListings';
import { DEFAULT_SORT, SORT_OPTIONS, SortKey, applySort } from '../features/search/sort';

const TYPE_ICONS: Record<string, IconName> = {
  apartment: 'business-outline',
  house: 'home-outline',
  land: 'leaf-outline',
  commercial: 'storefront-outline',
};

function firstName() {
  const name = auth.currentUser?.displayName?.trim();
  return name ? name.split(/\s+/)[0] : '';
}

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
  const [sort, setSort] = useState<SortKey>(DEFAULT_SORT);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pool, setPool] = useState<Listing[] | null>(null);
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolError, setPoolError] = useState(false);

  const activeFilters = countActiveFilters(filters);
  const searching = term.trim().length > 0;
  const sorting = sort !== DEFAULT_SORT;
  // Recherche, filtre ou tri : on travaille sur la réserve complète (sans pagination), car un tri
  // par prix n’a de sens que sur toutes les annonces, pas seulement sur la page chargée.
  const filtering = searching || activeFilters > 0 || sorting;

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

  const onChangeSort = (next: SortKey) => {
    setSort(next);
    if (next !== DEFAULT_SORT) ensurePool();
  };

  const onApplyFilters = (next: Filters) => {
    setFilters(next);
    setSheetOpen(false);
    if (countActiveFilters(next) > 0) ensurePool();
  };

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  // Puces rapides « Appartement / Maison… » : raccourci vers le filtre « type de bien ».
  const onPickType = (type?: string) => {
    const next = { ...filters, propertyType: type };
    setFilters(next);
    if (countActiveFilters(next) > 0) ensurePool();
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

  const data = filtering
    ? applySort(applyFilters(filterListings(pool ?? [], term), filters), sort)
    : items;

  const name = firstName();

  const header = (
    <View>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>{name ? `Bonjour, ${name} 👋` : 'Bonjour 👋'}</Text>
            <Text style={styles.title}>Trouvez le bien idéal</Text>
          </View>
          <IconButton
            icon="albums-outline"
            label="Mes annonces"
            onPress={() => navigation.navigate('MyListings')}
            color={colors.primary}
          />
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={19} color={colors.muted} />
            <TextInput
              style={styles.search}
              value={term}
              onChangeText={onChangeTerm}
              placeholder="Ville, titre, type de bien…"
              placeholderTextColor={colors.subtle}
              returnKeyType="search"
              autoCorrect={false}
            />
            {term ? (
              <Pressable onPress={() => onChangeTerm('')} hitSlop={8} accessibilityLabel="Effacer">
                <Ionicons name="close-circle" size={19} color={colors.subtle} />
              </Pressable>
            ) : null}
          </View>
          <IconButton
            icon="options-outline"
            label="Filtres"
            onPress={() => setSheetOpen(true)}
            size={52}
            color={activeFilters > 0 ? '#fff' : colors.primary}
            background={activeFilters > 0 ? colors.primary : colors.surface}
            badge={activeFilters}
            style={{ borderRadius: radius.md }}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.chipsRow}
      >
        <Chip label="Tous" icon="grid-outline" selected={!filters.propertyType} onPress={() => onPickType(undefined)} />
        {PROPERTY_TYPE_KEYS.map((k) => (
          <Chip
            key={k}
            label={propertyTypeLabel(k)}
            icon={TYPE_ICONS[k]}
            selected={filters.propertyType === k}
            onPress={() => onPickType(k)}
          />
        ))}
      </ScrollView>

      <View style={styles.listHead}>
        <Text style={styles.listTitle}>
          {filtering && pool !== null
            ? `${data.length} résultat${data.length > 1 ? 's' : ''}`
            : 'Annonces récentes'}
        </Text>
        {activeFilters > 0 ? (
          <Pressable onPress={clearFilters} hitSlop={8}>
            <Text style={styles.link}>Effacer les filtres</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.sortRow}
      >
        <Ionicons name="swap-vertical" size={16} color={colors.muted} style={{ alignSelf: 'center' }} />
        {SORT_OPTIONS.map((o) => (
          <Pressable
            key={o.key}
            accessibilityRole="button"
            accessibilityState={{ selected: sort === o.key }}
            style={[styles.sortChip, sort === o.key && styles.sortChipOn]}
            onPress={() => onChangeSort(o.key)}
          >
            <Text style={[styles.sortText, sort === o.key && styles.sortTextOn]}>{o.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const empty = filtering ? (
    poolLoading ? (
      <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
    ) : poolError ? (
      <EmptyState
        icon="cloud-offline-outline"
        tone="danger"
        title="Recherche impossible"
        text="Vérifiez votre connexion puis réessayez."
        actionLabel="Réessayer"
        onAction={loadPool}
      />
    ) : (
      <EmptyState
        icon="search-outline"
        title={searching ? `Aucun résultat pour « ${term.trim()} »` : 'Aucune annonce trouvée'}
        text={
          activeFilters > 0
            ? 'Essayez d’élargir vos critères de recherche.'
            : 'Essayez avec un autre mot-clé.'
        }
        actionLabel={activeFilters > 0 ? 'Effacer les filtres' : undefined}
        onAction={clearFilters}
      />
    )
  ) : loading ? (
    <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
  ) : error ? (
    <EmptyState
      icon="cloud-offline-outline"
      tone="danger"
      title="Connexion impossible"
      text={error}
      actionLabel="Réessayer"
      onAction={() => reload('retry')}
    />
  ) : (
    <EmptyState
      icon="home-outline"
      title="Aucune annonce pour le moment"
      text="Soyez le premier à publier un bien."
      actionLabel="Publier une annonce"
      onAction={() => navigation.navigate('Publish')}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 110,
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

      <AppButton
        label="Publier"
        icon="add"
        onPress={() => navigation.navigate('Publish')}
        style={styles.fab}
      />

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
  hero: { marginBottom: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 12 },
  hello: { fontSize: 14, color: colors.muted, fontWeight: '600', marginBottom: 2 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchBox: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...shadow(1),
  },
  search: { flex: 1, height: '100%', color: colors.text, fontSize: 15 },
  chipsRow: { gap: 8, paddingBottom: 18, paddingTop: 2 },
  listHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sortRow: { gap: 6, paddingBottom: 14 },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  sortChipOn: { backgroundColor: colors.primarySoft },
  sortText: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  sortTextOn: { color: colors.primary, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    ...shadow(3),
  },
});
