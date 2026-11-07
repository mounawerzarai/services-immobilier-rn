import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../core/firebase';
import { createListing, getListing, updateListing } from '../services/listingService';
import { colors, radius } from '../theme';

const TYPES: [string, string][] = [
  ['apartment', 'Appartement'],
  ['house', 'Maison'],
  ['land', 'Terrain'],
  ['commercial', 'Local commercial'],
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

function Pill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.pill, selected && s.pillOn]}>
      <Text style={{ color: selected ? '#fff' : colors.text }}>{label}</Text>
    </Pressable>
  );
}

export default function PublishScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const id: string | undefined = route.params?.id;
  const editing = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [surface, setSurface] = useState('');
  const [rooms, setRooms] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('apartment');
  const [transaction, setTransaction] = useState<'sale' | 'rent'>('sale');
  const [photos, setPhotos] = useState<string[]>([]); // nouvelles photos
  const [kept, setKept] = useState<string[]>([]); // photos déjà enregistrées
  const [original, setOriginal] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(editing);

  const total = kept.length + photos.length;

  useEffect(() => {
    navigation.setOptions({ title: editing ? "Modifier l'annonce" : 'Publier une annonce' });
    if (!id) return;
    (async () => {
      try {
        const d = await getListing(id);
        if (!d) throw new Error('Annonce introuvable.');
        if (d.sellerId !== auth.currentUser?.uid)
          throw new Error('Vous ne pouvez modifier que vos annonces.');
        setOriginal(d);
        setTitle(d.title ?? '');
        setDescription(d.description ?? '');
        setPrice(String(d.price ?? ''));
        setSurface(String(d.surface ?? ''));
        setRooms(d.rooms != null ? String(d.rooms) : '');
        setAddress(d.address ?? '');
        setCity(d.city ?? '');
        setType(TYPES.some(([k]) => k === d.propertyType) ? d.propertyType : 'apartment');
        setTransaction(d.transactionType === 'rent' ? 'rent' : 'sale');
        setKept(d.photos ?? []);
      } catch (e: any) {
        Alert.alert('Erreur', String(e?.message ?? e));
        navigation.goBack();
      } finally {
        setLoadingDoc(false);
      }
    })();
  }, [id]);

  const pickPhotos = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 8 - total),
      quality: 0.7,
    });
    if (!res.canceled) {
      setPhotos((p) => [...p, ...res.assets.map((a) => a.uri)].slice(0, 8 - kept.length));
    }
  };

  const submit = async () => {
    const p = parseFloat(price.replace(',', '.'));
    const sf = parseFloat(surface.replace(',', '.'));
    if (!title.trim() || !description.trim() || !address.trim() || !city.trim())
      return Alert.alert('Champs manquants', 'Remplissez tous les champs obligatoires.');
    if (!(p > 0) || !(sf > 0))
      return Alert.alert('Valeur invalide', 'Prix et surface doivent être positifs.');
    if (total === 0) return Alert.alert('Photos', 'Ajoutez au moins 1 photo.');
    if (!auth.currentUser) {
      Alert.alert('Connexion', 'Connectez-vous pour publier.');
      return navigation.navigate('Login');
    }
    setLoading(true);
    try {
      const common = {
        title: title.trim(),
        description: description.trim(),
        price: p,
        surface: sf,
        rooms: parseInt(rooms, 10) || undefined,
        propertyType: type,
        transactionType: transaction,
        address: address.trim(),
        city: city.trim(),
      };
      if (editing && id) {
        const changed =
          common.address !== (original?.address ?? '') || common.city !== (original?.city ?? '');
        await updateListing(id, {
          ...common,
          keptPhotos: kept,
          newPhotoUris: photos,
          addressChanged: changed,
        });
        Alert.alert('Annonce modifiée');
      } else {
        await createListing({ ...common, photoUris: photos });
        Alert.alert('Annonce publiée');
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erreur', String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  if (loadingDoc) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Field label="Titre">
          <TextInput style={s.input} placeholder="Ex. Appartement lumineux" placeholderTextColor="#9AA3AB" value={title} onChangeText={setTitle} />
        </Field>

        <Field label="Description">
          <TextInput style={[s.input, { height: 90, textAlignVertical: 'top' }]} placeholder="Décrivez le bien" placeholderTextColor="#9AA3AB" multiline value={description} onChangeText={setDescription} />
        </Field>

        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Field label="Prix">
              <TextInput style={s.input} placeholder="0" placeholderTextColor="#9AA3AB" keyboardType="numeric" value={price} onChangeText={setPrice} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Surface (m²)">
              <TextInput style={s.input} placeholder="0" placeholderTextColor="#9AA3AB" keyboardType="numeric" value={surface} onChangeText={setSurface} />
            </Field>
          </View>
        </View>

        <Field label="Type de bien">
          <View style={s.wrap}>
            {TYPES.map(([k, l]) => (
              <Pill key={k} label={l} selected={type === k} onPress={() => setType(k)} />
            ))}
          </View>
        </Field>

        <Field label="Pièces">
          <TextInput style={s.input} placeholder="0" placeholderTextColor="#9AA3AB" keyboardType="number-pad" value={rooms} onChangeText={(t) => setRooms(t.replace(/\D/g, ''))} />
        </Field>

        <View style={s.wrap}>
          <Pill label="Vente" selected={transaction === 'sale'} onPress={() => setTransaction('sale')} />
          <Pill label="Location" selected={transaction === 'rent'} onPress={() => setTransaction('rent')} />
        </View>

        <Field label="Adresse">
          <TextInput style={s.input} placeholder="Rue" placeholderTextColor="#9AA3AB" value={address} onChangeText={setAddress} />
        </Field>

        <Field label="Ville">
          <TextInput style={s.input} placeholder="Ville" placeholderTextColor="#9AA3AB" value={city} onChangeText={setCity} />
        </Field>

        <Field label="Photos (1 minimum, 8 maximum)">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {total < 8 && (
              <Pressable style={s.add} onPress={pickPhotos}>
                <Text style={{ fontSize: 30, color: colors.primary }}>+</Text>
              </Pressable>
            )}
            {kept.map((uri) => (
              <View key={uri} style={s.thumb}>
                <Image source={{ uri }} style={s.img} />
                <Pressable style={s.remove} onPress={() => setKept((k) => k.filter((u) => u !== uri))}>
                  <Text style={{ color: '#fff', lineHeight: 18 }}>×</Text>
                </Pressable>
              </View>
            ))}
            {photos.map((uri) => (
              <View key={uri} style={s.thumb}>
                <Image source={{ uri }} style={s.img} />
                <Pressable style={s.remove} onPress={() => setPhotos((p) => p.filter((u) => u !== uri))}>
                  <Text style={{ color: '#fff', lineHeight: 18 }}>×</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </Field>

        <Field label="Position sur la carte">
          <View style={s.mapBox}>
            <Text style={{ color: colors.muted, textAlign: 'center' }}>
              La position est calculée à partir de l&apos;adresse.{ '\n' }
              Le marqueur déplaçable viendra avec la carte (T6.1).
            </Text>
          </View>
        </Field>
      </ScrollView>

      <View style={[s.bottom, { paddingBottom: 16 + insets.bottom }]}>
        <Pressable style={[s.button, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>{editing ? 'Enregistrer' : 'Publier'}</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  label: { color: colors.muted, fontSize: 13 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.input,
    paddingHorizontal: 16, paddingVertical: 12, color: colors.text, fontSize: 16,
  },
  row: { flexDirection: 'row', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 8 },
  pillOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  add: {
    width: 90, height: 90, marginRight: 8, borderRadius: radius.input,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  thumb: { width: 90, height: 90, marginRight: 8, borderRadius: radius.input, overflow: 'hidden', backgroundColor: colors.primaryLight },
  img: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute', top: 4, right: 4, backgroundColor: '#0009',
    borderRadius: 11, width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
  },
  mapBox: {
    height: 110, borderRadius: radius.input, backgroundColor: '#E6ECEA',
    alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  bottom: { padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: colors.background },
  button: { backgroundColor: colors.primary, borderRadius: radius.input, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});