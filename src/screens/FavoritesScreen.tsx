import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '../components/ui';
import FavoriteButton from '../components/FavoriteButton';
import ListingCard from '../features/listings/ListingCard';
import { watchFavoriteListings } from '../data/services/favorites';
import { errorText } from '../core/dialogs';
import { Listing } from '../data/models/Listing';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';

// T7.2 — Écran « Mes favoris » : annonces sauvegardées, mises à jour en temps réel.
export default function FavoritesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Listing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(
    () => watchFavoriteListings(setItems, (e) => setError(errorText(e))),
    [attempt],
  );

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>Mes favoris</Text>
      <Text style={styles.subtitle}>
        {items && items.length > 0
          ? `${items.length} bien${items.length > 1 ? 's' : ''} sauvegardé${items.length > 1 ? 's' : ''}`
          : 'Retrouvez ici les biens qui vous plaisent'}
      </Text>
    </View>
  );

  if (error) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, paddingHorizontal: 20 }]}>
        {header}
        <EmptyState
          icon="cloud-offline-outline"
          tone="danger"
          title="Chargement impossible"
          text={error}
          actionLabel="Réessayer"
          onAction={() => {
            setError(null);
            setAttempt((a) => a + 1);
          }}
        />
      </View>
    );
  }

  if (items === null) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, paddingHorizontal: 20 }]}>
        {header}
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 24, gap: 16, flexGrow: 1 }}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <EmptyState
          icon="heart-outline"
          title="Aucun favori pour l’instant"
          text="Touchez le cœur d’une annonce pour la retrouver ici."
          actionLabel="Parcourir les annonces"
          onAction={() => (navigation as any).navigate('Accueil')}
        />
      }
      renderItem={({ item }) => (
        <ListingCard
          item={item}
          onPress={() => navigation.navigate('ListingDetail', { id: item.id })}
          topRight={<FavoriteButton listingId={item.id} variant="icon" />}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: { paddingTop: 16, paddingBottom: 4, paddingHorizontal: 0 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4 },
});
