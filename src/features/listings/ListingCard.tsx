import { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadow } from '../../theme';
import { Listing } from '../../data/models/Listing';
import { IconText, Pill } from '../../components/ui';
import { formatPrice, propertyTypeLabel, statusLabel, transactionLabel } from './format';

interface Props {
  item: Listing;
  onPress: () => void;
  /** Élément affiché en haut à droite de la photo (ex. bouton favori). */
  topRight?: ReactNode;
  /** Texte en bas à gauche de la photo (ex. « 1,2 km »). */
  photoNote?: string;
}

export default function ListingCard({ item, onPress, topRight, photoNote }: Props) {
  const photo = item.photos?.[0];
  const closed = item.status && item.status !== 'available';

  // topRight (ex. bouton favori) est posé PAR-DESSUS la carte, pas dedans :
  // sur le web, un bouton dans un bouton (<button><button>) est interdit et plantait l'écran Favoris.
  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.99 }], opacity: 0.95 }]}
        onPress={onPress}
      >
        <View>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={[styles.photo, styles.noPhoto]}>
              <Ionicons name="image-outline" size={32} color={colors.subtle} />
            </View>
          )}
          <View style={styles.photoTop}>
            <Pill
              label={transactionLabel(item.transactionType)}
              tone={item.transactionType === 'rent' ? 'accent' : 'primary'}
            />
            {closed ? <Pill label={statusLabel[item.status]} tone="danger" /> : null}
          </View>
          {photoNote ? (
            <View style={styles.photoNote}>
              <Pill label={photoNote} tone="dark" icon="navigate" />
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.price}>{formatPrice(item)}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          {item.city || item.address ? (
            <IconText icon="location-outline" text={[item.address, item.city].filter(Boolean).join(', ')} />
          ) : null}
          <View style={styles.facts}>
            {item.propertyType ? (
              <IconText
                icon="business-outline"
                text={propertyTypeLabel(item.propertyType)}
                color={colors.text}
              />
            ) : null}
            {item.surface ? (
              <IconText icon="resize-outline" text={`${item.surface} m²`} color={colors.text} />
            ) : null}
            {item.rooms ? (
              <IconText
                icon="bed-outline"
                text={`${item.rooms} pièce${item.rooms > 1 ? 's' : ''}`}
                color={colors.text}
              />
            ) : null}
          </View>
        </View>
      </Pressable>
      {topRight ? <View style={styles.topRight}>{topRight}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow(2),
  },
  photo: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  noPhoto: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTop: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
  },
  topRight: { position: 'absolute', top: 10, right: 10 },
  photoNote: { position: 'absolute', bottom: 12, left: 12 },
  body: { padding: 16, gap: 6 },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
