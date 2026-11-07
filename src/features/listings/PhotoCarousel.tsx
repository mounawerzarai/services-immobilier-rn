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
import { colors } from '../../theme';

const HEIGHT = 280;

export default function PhotoCarousel({ photos }: { photos?: string[] }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <View style={[styles.empty, { width }]}>
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
        <Text style={styles.counter}>
          {index + 1} / {photos.length}
        </Text>
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
  emptyText: { color: colors.muted },
  counter: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: '#16212B',
    color: '#fff',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
});
