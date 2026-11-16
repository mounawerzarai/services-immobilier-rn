import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { colors, radius } from '../../theme';
import { TransactionType } from '../../data/models/Listing';
import { propertyTypeLabel } from '../listings/format';
import { EMPTY_FILTERS, Filters, PROPERTY_TYPE_KEYS, ROOM_CHOICES, parsePrice } from './filters';

interface Props {
  visible: boolean;
  filters: Filters;
  onApply: (filters: Filters) => void;
  onClose: () => void;
}

// Brouillon : on modifie une copie, et elle ne devient le filtre actif qu’au clic sur « Appliquer ».
interface Draft {
  transactionType?: TransactionType;
  propertyType?: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  minRooms?: number;
}

const toDraft = (f: Filters): Draft => ({
  transactionType: f.transactionType,
  propertyType: f.propertyType,
  city: f.city,
  minPrice: f.minPrice !== undefined ? String(f.minPrice) : '',
  maxPrice: f.maxPrice !== undefined ? String(f.maxPrice) : '',
  minRooms: f.minRooms,
});

const fromDraft = (d: Draft): Filters => {
  let min = parsePrice(d.minPrice);
  let max = parsePrice(d.maxPrice);
  if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];
  return {
    transactionType: d.transactionType,
    propertyType: d.propertyType,
    city: d.city.trim(),
    minPrice: min,
    maxPrice: max,
    minRooms: d.minRooms,
  };
};

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipOn]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

function SheetBody({ filters, onApply, onClose }: Omit<Props, 'visible'>) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<Draft>(() => toDraft(filters));
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fermer" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <View style={styles.titleRow}>
          <Text style={styles.title}>Filtres</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 8 }}>
          <Text style={styles.label}>Vente ou location</Text>
          <View style={styles.chips}>
            <Chip label="Tous" selected={!draft.transactionType} onPress={() => set({ transactionType: undefined })} />
            <Chip label="Vente" selected={draft.transactionType === 'sale'} onPress={() => set({ transactionType: 'sale' })} />
            <Chip label="Location" selected={draft.transactionType === 'rent'} onPress={() => set({ transactionType: 'rent' })} />
          </View>

          <Text style={styles.label}>Type de bien</Text>
          <View style={styles.chips}>
            <Chip label="Tous" selected={!draft.propertyType} onPress={() => set({ propertyType: undefined })} />
            {PROPERTY_TYPE_KEYS.map((k) => (
              <Chip
                key={k}
                label={propertyTypeLabel(k)}
                selected={draft.propertyType === k}
                onPress={() => set({ propertyType: k })}
              />
            ))}
          </View>

          <Text style={styles.label}>Ville</Text>
          <TextInput
            style={styles.input}
            value={draft.city}
            onChangeText={(city) => set({ city })}
            placeholder="Ex. Tunis, Sousse…"
            placeholderTextColor={colors.muted}
            autoCorrect={false}
          />

          <Text style={styles.label}>Prix (DT)</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={[styles.input, styles.priceInput]}
              value={draft.minPrice}
              onChangeText={(minPrice) => set({ minPrice })}
              placeholder="Min"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
            />
            <Text style={styles.dash}>–</Text>
            <TextInput
              style={[styles.input, styles.priceInput]}
              value={draft.maxPrice}
              onChangeText={(maxPrice) => set({ maxPrice })}
              placeholder="Max"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.label}>Pièces (minimum)</Text>
          <View style={styles.chips}>
            <Chip label="Tous" selected={draft.minRooms === undefined} onPress={() => set({ minRooms: undefined })} />
            {ROOM_CHOICES.map((n) => (
              <Chip key={n} label={`${n}+`} selected={draft.minRooms === n} onPress={() => set({ minRooms: n })} />
            ))}
          </View>
        </ScrollView>

        <View style={styles.buttons}>
          <Pressable style={[styles.button, styles.buttonOutline]} onPress={() => setDraft(toDraft(EMPTY_FILTERS))}>
            <Text style={styles.buttonOutlineText}>Réinitialiser</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.buttonPrimary]} onPress={() => onApply(fromDraft(draft))}>
            <Text style={styles.buttonPrimaryText}>Appliquer</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function FilterSheet({ visible, filters, onApply, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Le contenu n’existe que pendant l’ouverture : le brouillon repart des filtres actifs à chaque fois. */}
      {visible ? <SheetBody filters={filters} onApply={onApply} onClose={onClose} /> : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(22,33,43,0.45)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 22,
    paddingTop: 10,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  close: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 16, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  input: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    color: colors.text,
    fontSize: 15,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceInput: { flex: 1 },
  dash: { color: colors.muted, fontSize: 18 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  button: {
    flex: 1,
    height: 52,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutline: { borderWidth: 1.5, borderColor: colors.primary },
  buttonOutlineText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
