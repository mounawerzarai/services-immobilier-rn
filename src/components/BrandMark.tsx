import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';

/** Logo de l'application : maison dans un carré arrondi + nom (option). */
export default function BrandMark({
  size = 64,
  light = false,
  withName = false,
}: {
  size?: number;
  light?: boolean;
  withName?: boolean;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <View
        style={[
          styles.mark,
          {
            width: size,
            height: size,
            borderRadius: size * 0.3,
            backgroundColor: light ? '#fff' : colors.primary,
          },
        ]}
      >
        <Ionicons name="home" size={size * 0.5} color={light ? colors.primary : '#fff'} />
      </View>
      {withName ? (
        <Text style={[styles.name, { color: light ? '#fff' : colors.text }]}>
          Services <Text style={{ color: light ? colors.accent : colors.primary }}>Immobilier</Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
});
