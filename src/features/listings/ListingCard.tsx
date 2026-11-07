import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../theme';
import { Listing } from '../../data/models/Listing';
import { formatDetails, formatPrice, transactionLabel } from './format';

interface Props {
  item: Listing;
  onPress: () => void;
}

export default function ListingCard({ item, onPress }: Props) {
  const photo = item.photos?.[0];
  const details = formatDetails(item);

  return (
    <Pressable accessibilityRole="button" style={styles.card} onPress={onPress}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.noPhoto]}>
          <Text style={styles.noPhotoText}>Pas de photo</Text>
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.price}>{formatPrice(item)}</Text>
          <Text style={styles.badge}>{transactionLabel(item.transactionType)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        {details ? (
          <Text style={styles.meta} numberOfLines={1}>
            {details}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: colors.background,
  },
  photo: { width: '100%', height: 170 },
  noPhoto: { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  noPhotoText: { color: colors.muted, fontSize: 13 },
  body: { padding: 14, gap: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 18, fontWeight: '700', color: colors.text },
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
  title: { fontSize: 15, color: colors.text },
  meta: { fontSize: 13, color: colors.muted },
});
