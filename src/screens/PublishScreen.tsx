import { useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../core/firebase';
import { createListing } from '../services/listingService';
import { colors, radius } from '../theme';

const TYPES: [string, string][] = [
  ['apartment', 'Appartement'],
  ['house', 'Maison'],
  ['land', 'Terrain'],
  ['commercial', 'Local commercial'],
];

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, selected && s.chipOn]}>
      <Text style={{ color: selected ? '#fff' : colors.text }}>{label}</Text>
    </Pressable>
  );
}

export default function PublishScreen() {
  const navigation = useNavigation<any>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [surface, setSurface] = useState('');
  const [rooms, setRooms] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('apartment');
  const [transaction, setTransaction] = useState<'sale' | 'rent'>('sale');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickPhotos = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 8 - photos.length,
      quality: 0.7,
    });
    if (!res.canceled) {
      setPhotos((p) => [...p, ...res.assets.map((a) => a.uri)].slice(0, 8));
    }
  };

  const submit = async () => {
    const p = parseFloat(price.replace(',', '.'));
    const sf = parseFloat(surface.replace(',', '.'));
    if (!title.trim() || !description.trim() || !address.trim() || !city.trim())
      return Alert.alert('Champs manquants', 'Remplissez tous les champs obligatoires.');
    if (!(p > 0) || !(sf > 0))
      return Alert.alert('Valeur invalide', 'Prix et surface doivent être positifs.');
    if (photos.length === 0)
      return Alert.alert('Photos', 'Ajoutez au moins 1 photo.');
    if (!auth.currentUser) {
      Alert.alert('Connexion', 'Connectez-vous pour publier.');
      return navigation.navigate('Login');
    }
    setLoading(true);
    try {
      await createListing({
        title: title.trim(),
        description: description.trim(),
        price: p,
        surface: sf,
        rooms: parseInt(rooms, 10) || undefined,
        propertyType: type,
        transactionType: transaction,
        address: address.trim(),
        city: city.trim(),
        photoUris: photos,
      });
      Alert.alert('Annonce publiée');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erreur', String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      <TextInput style={s.input} placeholder="Titre" value={title} onChangeText={setTitle} />
      <TextInput style={[s.input, { height: 90 }]} placeholder="Description" multiline value={description} onChangeText={setDescription} />
      <View style={s.row}>
        <TextInput style={[s.input, s.half]} placeholder="Prix" keyboardType="numeric" value={price} onChangeText={setPrice} />
        <TextInput style={[s.input, s.half]} placeholder="Surface (m²)" keyboardType="numeric" value={surface} onChangeText={setSurface} />
      </View>
      <TextInput style={s.input} placeholder="Pièces" keyboardType="numeric" value={rooms} onChangeText={setRooms} />

      <Text style={s.label}>Type de bien</Text>
      <View style={s.wrap}>
        {TYPES.map(([k, l]) => (
          <Chip key={k} label={l} selected={type === k} onPress={() => setType(k)} />
        ))}
      </View>

      <View style={s.wrap}>
        <Chip label="Vente" selected={transaction === 'sale'} onPress={() => setTransaction('sale')} />
        <Chip label="Location" selected={transaction === 'rent'} onPress={() => setTransaction('rent')} />
      </View>

      <TextInput style={s.input} placeholder="Adresse (rue)" value={address} onChangeText={setAddress} />
      <TextInput style={s.input} placeholder="Ville" value={city} onChangeText={setCity} />

      <Text style={s.label}>Photos ({photos.length}/8, 1 minimum)</Text>
      <ScrollView horizontal>
        {photos.length < 8 && (
          <Pressable style={[s.thumb, s.add]} onPress={pickPhotos}>
            <Text style={{ fontSize: 28, color: colors.primary }}>+</Text>
          </Pressable>
        )}
        {photos.map((uri) => (
          <View key={uri} style={s.thumb}>
            <Image source={{ uri }} style={s.img} />
            <Pressable style={s.remove} onPress={() => setPhotos((p) => p.filter((u) => u !== uri))}>
              <Text style={{ color: '#fff' }}>×</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <Pressable style={[s.button, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Publier</Text>}
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: colors.background },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, padding: 12, color: colors.text },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  label: { color: colors.muted },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  thumb: { width: 90, height: 90, marginRight: 8, borderRadius: radius.input, overflow: 'hidden' },
  add: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  img: { width: '100%', height: '100%' },
  remove: { position: 'absolute', top: 4, right: 4, backgroundColor: '#000a', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  button: { backgroundColor: colors.primary, borderRadius: radius.input, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
});