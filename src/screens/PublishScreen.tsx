import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../core/firebase';
import { createListing, getListing, updateListing } from '../services/listingService';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';
import { AppButton, IconName } from '../components/ui';
import { showMessage } from '../core/dialogs';

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
      <Text style={{ color: selected ? '#fff' : colors.text, fontWeight: selected ? '700' : '500' }}>{label}</Text>
    </Pressable>
  );
}

function Section({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <View style={s.sectionIcon}>
          <Ionicons name={icon} size={17} color={colors.primary} />
        </View>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
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
        showMessage('Erreur', String(e?.message ?? e));
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
      return showMessage('Champs manquants', 'Remplissez tous les champs obligatoires.');
    if (!(p > 0) || !(sf > 0))
      return showMessage('Valeur invalide', 'Prix et surface doivent être positifs.');
    if (total === 0) return showMessage('Photos', 'Ajoutez au moins 1 photo.');
    if (!auth.currentUser) {
      showMessage('Connexion', 'Connectez-vous pour publier.');
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
        showMessage('Annonce modifiée');
      } else {
        await createListing({ ...common, photoUris: photos });
        showMessage('Annonce publiée');
      }
      navigation.goBack();
    } catch (e: any) {
      showMessage('Erreur', String(e?.message ?? e));
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
      style={{ flex: 1, backgroundColor: colors.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.segment}>
          {(['sale', 'rent'] as const).map((t) => (
            <Pressable
              key={t}
              style={[s.segmentItem, transaction === t && s.segmentOn]}
              onPress={() => setTransaction(t)}
            >
              <Ionicons
                name={t === 'sale' ? 'pricetag-outline' : 'key-outline'}
                size={16}
                color={transaction === t ? colors.primary : colors.muted}
              />
              <Text style={[s.segmentText, transaction === t && s.segmentTextOn]}>
                {t === 'sale' ? 'Vente' : 'Location'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Section icon="document-text-outline" title="Informations">
          <Field label="Titre">
            <TextInput style={s.input} placeholder="Ex. Appartement lumineux" placeholderTextColor={colors.subtle} value={title} onChangeText={setTitle} />
          </Field>
          <Field label="Description">
            <TextInput style={[s.input, { height: 110, textAlignVertical: 'top', paddingTop: 12 }]} placeholder="Décrivez le bien : état, exposition, équipements…" placeholderTextColor={colors.subtle} multiline value={description} onChangeText={setDescription} />
          </Field>
        </Section>

        <Section icon="options-outline" title="Caractéristiques">
          <Field label="Type de bien">
            <View style={s.wrap}>
              {TYPES.map(([k, l]) => (
                <Pill key={k} label={l} selected={type === k} onPress={() => setType(k)} />
              ))}
            </View>
          </Field>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Field label={transaction === 'rent' ? 'Loyer (DT / mois)' : 'Prix (DT)'}>
                <TextInput style={s.input} placeholder="0" placeholderTextColor={colors.subtle} keyboardType="numeric" value={price} onChangeText={setPrice} />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Surface (m²)">
                <TextInput style={s.input} placeholder="0" placeholderTextColor={colors.subtle} keyboardType="numeric" value={surface} onChangeText={setSurface} />
              </Field>
            </View>
          </View>
          <Field label="Pièces">
            <TextInput style={s.input} placeholder="0" placeholderTextColor={colors.subtle} keyboardType="number-pad" value={rooms} onChangeText={(t) => setRooms(t.replace(/\D/g, ''))} />
          </Field>
        </Section>

        <Section icon="location-outline" title="Localisation">
          <Field label="Adresse">
            <TextInput style={s.input} placeholder="Rue, quartier" placeholderTextColor={colors.subtle} value={address} onChangeText={setAddress} />
          </Field>
          <Field label="Ville">
            <TextInput style={s.input} placeholder="Ex. Tunis" placeholderTextColor={colors.subtle} value={city} onChangeText={setCity} />
          </Field>
          <View style={s.hint}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={s.hintText}>La position sur la carte est calculée automatiquement à partir de l&apos;adresse.</Text>
          </View>
        </Section>

        <Section icon="images-outline" title={`Photos (${total}/8)`}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {total < 8 && (
              <Pressable style={s.add} onPress={pickPhotos}>
                <Ionicons name="camera-outline" size={26} color={colors.primary} />
                <Text style={s.addText}>Ajouter</Text>
              </Pressable>
            )}
            {kept.map((uri) => (
              <View key={uri} style={s.thumb}>
                <Image source={{ uri }} style={s.img} />
                <Pressable style={s.remove} onPress={() => setKept((k) => k.filter((u) => u !== uri))}>
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
            {photos.map((uri) => (
              <View key={uri} style={s.thumb}>
                <Image source={{ uri }} style={s.img} />
                <Pressable style={s.remove} onPress={() => setPhotos((p) => p.filter((u) => u !== uri))}>
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
          <Text style={s.small}>1 photo minimum, 8 maximum. La première sert de couverture.</Text>
        </Section>
      </ScrollView>

      <View style={[s.bottom, { paddingBottom: 16 + insets.bottom }]}>
        <AppButton
          label={editing ? 'Enregistrer les modifications' : "Publier l'annonce"}
          icon={editing ? 'checkmark' : 'paper-plane-outline'}
          loading={loading}
          onPress={submit}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { padding: 20, gap: 16, paddingBottom: 32 },
  label: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface,
    paddingHorizontal: 14, height: 50, color: colors.text, fontSize: 15,
  },
  row: { flexDirection: 'row', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill,
    paddingHorizontal: 16, paddingVertical: 9, backgroundColor: colors.surface,
  },
  pillOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  section: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, gap: 14, ...shadow(1) },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  segment: { flexDirection: 'row', backgroundColor: '#E6EBE9', borderRadius: radius.md, padding: 4 },
  segmentItem: {
    flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: radius.sm,
  },
  segmentOn: { backgroundColor: colors.surface, ...shadow(1) },
  segmentText: { color: colors.muted, fontWeight: '600', fontSize: 15 },
  segmentTextOn: { color: colors.primary, fontWeight: '800' },
  add: {
    width: 96, height: 96, marginRight: 10, borderRadius: radius.md,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  thumb: { width: 96, height: 96, marginRight: 10, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.primaryLight },
  img: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(20,33,43,0.7)',
    borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
  },
  hint: {
    flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.primarySoft,
    borderRadius: radius.sm, padding: 12,
  },
  hintText: { flex: 1, color: colors.primaryDark, fontSize: 13, lineHeight: 18 },
  small: { color: colors.muted, fontSize: 12 },
  bottom: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.surface, ...shadow(3) },
});
