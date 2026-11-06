import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { auth } from '../core/firebase';
import { colors, radius } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { Listing, ListingStatus } from '../data/models/Listing';
import { getUser, updateUserProfile } from '../data/services/users';
import { getMyListings } from '../data/services/listings';
import { logout } from '../data/services/auth';
import { ProfileErrors, validateProfile } from '../features/favorites_profile/validation';

const statusLabel: Record<ListingStatus, string> = {
  available: 'Disponible',
  sold: 'Vendu',
  rented: 'Loué',
};

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const uid = auth.currentUser?.uid;
  const email = auth.currentUser?.email ?? '';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);

  // Profil : chargé une seule fois, pour ne pas écraser une saisie en cours.
  useEffect(() => {
    if (!uid) return;
    getUser(uid)
      .then((user) => {
        if (user) {
          setName(user.name);
          setPhone(user.phone ?? '');
        }
      })
      .catch(() => Alert.alert('Erreur', 'Impossible de charger votre profil.'))
      .finally(() => setLoadingProfile(false));
  }, [uid]);

  // Annonces : rechargées à chaque retour sur l’onglet (ex. après une publication).
  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      let active = true;
      setListingsError(null);
      getMyListings(uid)
        .then((items) => active && setListings(items))
        .catch(() => active && setListingsError('Impossible de charger vos annonces.'))
        .finally(() => active && setLoadingListings(false));
      return () => {
        active = false;
      };
    }, [uid]),
  );

  const onSave = async () => {
    setSaved(false);
    const found = validateProfile(name, phone);
    setErrors(found);
    if (found.name || found.phone || !uid) return;
    setSaving(true);
    try {
      await updateUserProfile(uid, { name, phone });
      setSaved(true);
    } catch {
      Alert.alert('Erreur', 'Impossible d’enregistrer. Vérifiez votre connexion.');
    } finally {
      setSaving(false);
    }
  };

  const onLogout = () =>
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => logout() },
    ]);

  const header = (
    <View>
      <Text style={styles.title}>Mon profil</Text>

      {loadingProfile ? (
        <ActivityIndicator style={{ marginVertical: 24 }} color={colors.primary} />
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={name}
            onChangeText={(t) => {
              setName(t);
              setSaved(false);
            }}
            placeholder="Votre nom"
            placeholderTextColor={colors.muted}
          />
          {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              setSaved(false);
            }}
            placeholder="Votre numéro (facultatif)"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
          />
          {errors.phone ? <Text style={styles.error}>{errors.phone}</Text> : null}

          <Text style={styles.label}>Email</Text>
          <Text style={styles.email}>{email}</Text>

          <Pressable
            style={[styles.button, saving && { opacity: 0.6 }]}
            onPress={onSave}
            disabled={saving}
          >
            <Text style={styles.buttonText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
          </Pressable>
          {saved ? <Text style={styles.success}>Modifications enregistrées.</Text> : null}
        </View>
      )}

      <Text style={styles.section}>Mes annonces</Text>
      {loadingListings ? (
        <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} />
      ) : null}
      {listingsError ? <Text style={styles.error}>{listingsError}</Text> : null}
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 32 }}
      data={listings}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => navigation.navigate('ListingDetail', { id: item.id })}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardMeta}>
              {item.price.toLocaleString('fr-FR')}
              {item.transactionType === 'rent' ? ' / mois' : ''}
              {item.city ? ` · ${item.city}` : ''}
            </Text>
          </View>
          <Text style={[styles.badge, item.status !== 'available' && styles.badgeClosed]}>
            {statusLabel[item.status] ?? item.status}
          </Text>
        </Pressable>
      )}
      ListEmptyComponent={
        !loadingListings && !listingsError ? (
          <View style={{ alignItems: 'center', gap: 12, paddingVertical: 16 }}>
            <Text style={{ color: colors.muted }}>Vous n’avez pas encore publié d’annonce.</Text>
            <Pressable style={styles.buttonOutline} onPress={() => navigation.navigate('Publish')}>
              <Text style={styles.buttonOutlineText}>Publier une annonce</Text>
            </Pressable>
          </View>
        ) : undefined
      }
      ListFooterComponent={
        <Pressable style={styles.logout} onPress={onLogout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 16 },
  form: { gap: 6 },
  label: { fontSize: 13, color: colors.muted, marginTop: 10 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
  },
  inputError: { borderColor: '#B3261E' },
  error: { color: '#B3261E', fontSize: 13 },
  success: { color: colors.primary, fontSize: 14, marginTop: 8 },
  email: { fontSize: 15, color: colors.text, paddingVertical: 8 },
  button: {
    height: 50,
    borderRadius: radius.input,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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
  section: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 28, marginBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardMeta: { fontSize: 13, color: colors.muted, marginTop: 4 },
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
  badgeClosed: { color: colors.muted, backgroundColor: '#ECEFF1' },
  logout: { alignItems: 'center', paddingVertical: 20, marginTop: 12 },
  logoutText: { color: '#B3261E', fontSize: 15, fontWeight: '600' },
});
