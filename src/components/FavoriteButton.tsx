import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { watchFavorite, toggleFavorite } from '../data/services/favorites';
import { colors, radius, shadow } from '../theme';

interface Props {
  listingId: string;
  /** « icon » : petit cœur rond (sur une photo) ; « button » : bouton avec libellé. */
  variant?: 'button' | 'icon';
}

export default function FavoriteButton({ listingId, variant = 'button' }: Props) {
  const [fav, setFav] = useState(false);

  useEffect(() => watchFavorite(listingId, setFav), [listingId]);

  const icon = (
    <Ionicons
      name={fav ? 'heart' : 'heart-outline'}
      size={variant === 'icon' ? 20 : 22}
      color={fav ? colors.danger : variant === 'icon' ? colors.text : colors.primary}
    />
  );

  if (variant === 'icon') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        hitSlop={6}
        style={({ pressed }) => [styles.round, pressed && { transform: [{ scale: 0.92 }] }]}
        onPress={() => toggleFavorite(listingId)}
      >
        {icon}
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      style={({ pressed }) => [styles.btn, fav && styles.btnOn, pressed && { opacity: 0.85 }]}
      onPress={() => toggleFavorite(listingId)}
    >
      {icon}
      <Text style={[styles.txt, fav && { color: colors.danger }]}>{fav ? 'Favori' : 'Sauver'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
  },
  btnOn: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  txt: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  round: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(1),
  },
});
