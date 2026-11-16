import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadow } from '../theme';
import { AppButton, Avatar, Card, IconName, Pill } from '../components/ui';
import { formatPrice } from '../features/listings/format';
import { RootStackParamList } from '../navigation/types';
import { Listing, ListingStatus } from '../data/models/Listing';
import { getUser, updateUserProfile } from '../data/services/users';
import { getMyListings } from '../data/services/listings';
import { logout } from '../data/services/auth';
import { confirmAsync, showMessage } from '../core/dialogs';
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
      .catch(() => showMessage('Erreur', 'Impossible de charger votre profil.'))
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
      showMessage('Erreur', 'Impossible d’enregistrer. Vérifiez votre connexion.');
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    const ok = await confirmAsync({
      title: 'Déconnexion',
      message: 'Voulez-vous vous déconnecter ?',
      confirmText: 'Se déconnecter',
      destructive: true,
    });
    if (ok) logout();
  };

  const header = (
    <View>
      <View style={styles.hero}>
        <Avatar name={name || email} size={84} />
        <Text style={styles.name}>{name || 'Mon profil'}</Text>
        <Text style={styles.email}>{email}</Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{listings.length}</Text>
            <Text style={styles.statLabel}>Annonces</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {listings.filter((l) => l.status === 'available').length}
            </Text>
            <Text style={styles.statLabel}>En ligne</Text>
          </View>
        </View>
      </View>

      <View style={styles.menu}>
        <MenuRow icon="albums-outline" label="Gérer mes annonces" onPress={() => navigation.navigate('MyListings')} />
        <MenuRow icon="add-circle-outline" label="Publier une annonce" onPress={() => navigation.navigate('Publish')} />
      </View>

      <Text style={styles.section}>Informations personnelles</Text>
      {loadingProfile ? (
        <ActivityIndicator style={{ marginVertical: 24 }} color={colors.primary} />
      ) : (
        <Card style={styles.form}>
          <Text style={styles.label}>Nom</Text>
          <View style={[styles.inputBox, errors.name && styles.inputError]}>
            <Ionicons name="person-outline" size={18} color={colors.muted} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(t) => {
                setName(t);
                setSaved(false);
              }}
              placeholder="Votre nom"
              placeholderTextColor={colors.subtle}
            />
          </View>
          {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

          <Text style={styles.label}>Téléphone</Text>
          <View style={[styles.inputBox, errors.phone && styles.inputError]}>
            <Ionicons name="call-outline" size={18} color={colors.muted} />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                setSaved(false);
              }}
              placeholder="Votre numéro (facultatif)"
              placeholderTextColor={colors.subtle}
              keyboardType="phone-pad"
            />
          </View>
          {errors.phone ? <Text style={styles.error}>{errors.phone}</Text> : null}

          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputBox, styles.inputDisabled]}>
            <Ionicons name="mail-outline" size={18} color={colors.muted} />
            <Text style={[styles.input, { color: colors.muted, paddingTop: 14 }]} numberOfLines={1}>
              {email}
            </Text>
          </View>

          <AppButton
            label="Enregistrer"
            icon="checkmark"
            loading={saving}
            onPress={onSave}
            style={{ marginTop: 16 }}
          />
          {saved ? (
            <View style={styles.successRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.success}>Modifications enregistrées.</Text>
            </View>
          ) : null}
        </Card>
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
      style={{ backgroundColor: colors.canvas }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 32 }}
      data={listings}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
          onPress={() => navigation.navigate('ListingDetail', { id: item.id })}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="home-outline" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardMeta}>
              {formatPrice(item)}
              {item.city ? ` · ${item.city}` : ''}
            </Text>
          </View>
          <Pill
            label={statusLabel[item.status] ?? item.status}
            tone={item.status === 'available' ? 'primary' : 'neutral'}
          />
        </Pressable>
      )}
      ListEmptyComponent={
        !loadingListings && !listingsError ? (
          <Card style={{ alignItems: 'center', gap: 12 }}>
            <Text style={{ color: colors.muted }}>Vous n’avez pas encore publié d’annonce.</Text>
            <AppButton
              label="Publier une annonce"
              icon="add"
              variant="outline"
              small
              onPress={() => navigation.navigate('Publish')}
            />
          </Card>
        ) : undefined
      }
      ListFooterComponent={
        <AppButton
          label="Se déconnecter"
          icon="log-out-outline"
          variant="ghost"
          onPress={onLogout}
          style={{ marginTop: 20 }}
        />
      }
    />
  );
}

function MenuRow({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.7 }]} onPress={onPress}>
      <View style={styles.cardIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.menuText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 24,
    paddingHorizontal: 16,
    ...shadow(1),
  },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 12 },
  email: { fontSize: 14, color: colors.muted, marginTop: 2 },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  stat: { alignItems: 'center', minWidth: 90 },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  statSep: { width: 1, height: 30, backgroundColor: colors.primaryLight },
  menu: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingHorizontal: 14,
    ...shadow(1),
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  form: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginTop: 8 },
  inputBox: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  inputDisabled: { backgroundColor: colors.canvas },
  input: { flex: 1, height: '100%', fontSize: 15, color: colors.text },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13 },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, alignSelf: 'center' },
  success: { color: colors.success, fontSize: 14, fontWeight: '600' },
  section: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 26, marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    marginBottom: 10,
    ...shadow(1),
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 13, color: colors.muted, marginTop: 3 },
});
