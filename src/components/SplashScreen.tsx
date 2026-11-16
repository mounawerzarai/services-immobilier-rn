import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';

interface Props {
  /** true quand l'application est prête (session Firebase restaurée). */
  ready: boolean;
  /** Appelé à la fin de l'animation de sortie. */
  onFinish: () => void;
  /** Durée minimale d'affichage, pour que l'animation soit visible. */
  minDuration?: number;
}

/**
 * Écran de démarrage animé, affiché juste après le splash natif (même fond, même logo) :
 * le logo grossit, le nom et le slogan apparaissent, puis l'écran s'efface.
 */
export default function SplashScreen({ ready, onFinish, minDuration = 1800 }: Props) {
  const [logo] = useState(() => new Animated.Value(0));
  const [text] = useState(() => new Animated.Value(0));
  const [dots] = useState(() => new Animated.Value(0));
  const [exit] = useState(() => new Animated.Value(1));
  const [minElapsed, setMinElapsed] = useState(false);
  const finish = useRef(onFinish);

  useEffect(() => {
    finish.current = onFinish;
  }, [onFinish]);

  // Animation d'entrée + points qui clignotent + durée minimale.
  useEffect(() => {
    Animated.sequence([
      Animated.spring(logo, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
      Animated.timing(text, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.timing(dots, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();

    const timer = setTimeout(() => setMinElapsed(true), minDuration);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [logo, text, dots, minDuration]);

  // Sortie en fondu quand l'app est prête et que la durée minimale est passée.
  useEffect(() => {
    if (!ready || !minElapsed) return;
    Animated.timing(exit, {
      toValue: 0,
      duration: 380,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => finish.current());
  }, [ready, minElapsed, exit]);

  const logoStyle = {
    opacity: logo,
    transform: [
      { scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
    ],
  };
  const textStyle = {
    opacity: text,
    transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  return (
    <Animated.View style={[styles.root, { opacity: exit }]}>
      <View style={styles.circleA} />
      <View style={styles.circleB} />

      <Animated.View style={[styles.logo, logoStyle]}>
        <Ionicons name="home" size={64} color={colors.primary} />
      </Animated.View>

      <Animated.View style={[{ alignItems: 'center' }, textStyle]}>
        <Text style={styles.name}>
          Services <Text style={{ color: colors.accent }}>Immobilier</Text>
        </Text>
        <Text style={styles.tagline}>Acheter · Louer · Vendre en Tunisie</Text>
      </Animated.View>

      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                opacity: dots.interpolate({
                  inputRange: [0, (i + 0.5) / 3, 1],
                  outputRange: [0.3, 1, 0.3],
                }),
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 10,
  },
  circleA: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -120,
    right: -140,
  },
  circleB: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(242,165,65,0.12)',
    bottom: -90,
    left: -110,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  name: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  tagline: { marginTop: 8, fontSize: 15, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.3 },
  dots: { position: 'absolute', bottom: 70, flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
});
