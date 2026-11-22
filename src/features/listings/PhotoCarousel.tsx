import { useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

const HEIGHT = 320;

export default function PhotoCarousel({ photos }: { photos?: string[] }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <View style={[styles.empty, { width }]}>
        <Ionicons name="image-outline" size={40} color={colors.subtle} />
        <Text style={styles.emptyText}>Pas de photo</Text>
      </View>
    );
  }

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <View>
      <FlatList
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={photos}
        keyExtractor={(url, i) => `${i}-${url}`}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={{ width, height: HEIGHT }} resizeMode="cover" />
        )}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />
      {photos.length > 1 ? (
        <>
          <View style={styles.dots}>
            {photos.map((p, i) => (
              <View key={`${i}-${p}`} style={[styles.dot, i === index && styles.dotOn]} />
            ))}
          </View>
          <Text style={styles.counter}>
            {index + 1} / {photos.length}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    height: HEIGHT,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { color: colors.muted, marginTop: 6 },
  dots: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotOn: { width: 18, backgroundColor: '#fff' },
  counter: {
    position: 'absolute',
    right: 14,
    top: 56,
    backgroundColor: 'rgba(20,33,43,0.65)',
    color: '#fff',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '600',
  },
});
