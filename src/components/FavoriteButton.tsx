import React, { useEffect, useState } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { watchFavorite, toggleFavorite } from '../data/services/favorites';

export default function FavoriteButton({ listingId }: { listingId: string }) {
  const [fav, setFav] = useState(false);

  useEffect(() => watchFavorite(listingId, setFav), [listingId]);

  return (
    <Pressable style={styles.btn} onPress={() => toggleFavorite(listingId)}>
      <Text style={styles.txt}>{fav ? '♥' : '♡'} Favori</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    height: 50,
    borderWidth: 1.5,
    borderColor: '#0B6B5C',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txt: { color: '#0B6B5C', fontWeight: 'bold', fontSize: 16 },
});
