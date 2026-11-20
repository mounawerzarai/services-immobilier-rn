import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { db } from '../../core/firebase';
import { colors } from '../../theme';

const GRACE_MS = 3000; // on attend un peu avant d'afficher, pour ne pas clignoter au démarrage

/**
 * true quand l'appli n'arrive pas à joindre Firestore. On écoute un document qui n'existe
 * pas (listings/connection-check, lisible par tous ; un id du type __x__ est interdit par Firestore) : tant que le serveur ne répond pas, Firestore
 * répond depuis son cache (`fromCache`). Sur le web on réagit aussi tout de suite aux
 * événements « online » / « offline » du navigateur.
 */
export function useOffline(): boolean {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const clear = () => {
      if (timer) clearTimeout(timer);
      timer = undefined;
    };
    const markOfflineSoon = () => {
      if (!timer) timer = setTimeout(() => setOffline(true), GRACE_MS);
    };
    const markOnline = () => {
      clear();
      setOffline(false);
    };

    const unsubscribe = onSnapshot(
      doc(db, 'listings', 'connection-check'),
      { includeMetadataChanges: true },
      (snap) => (snap.metadata.fromCache ? markOfflineSoon() : markOnline()),
      // Seule une erreur « service indisponible » veut dire hors ligne ; les autres sont ignorées.
      (error) => {
        if (error.code === 'unavailable') markOfflineSoon();
      },
    );

    const onWeb = Platform.OS === 'web' && typeof window !== 'undefined';
    const goOffline = () => setOffline(true);
    if (onWeb) {
      window.addEventListener('offline', goOffline);
      window.addEventListener('online', markOnline);
    }
    return () => {
      clear();
      unsubscribe();
      if (onWeb) {
        window.removeEventListener('offline', goOffline);
        window.removeEventListener('online', markOnline);
      }
    };
  }, []);

  return offline;
}

/** Bandeau affiché en haut de l'écran tant qu'il n'y a pas de connexion. */
export default function OfflineBanner() {
  const offline = useOffline();
  const insets = useSafeAreaInsets();
  if (!offline) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityRole="alert"
      style={[styles.bar, { paddingTop: insets.top + 6 }]}
    >
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <Text style={styles.text}>Pas de connexion internet. Les données affichées peuvent être anciennes.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: colors.danger,
  },
  text: { color: '#fff', fontSize: 12, fontWeight: '600', flexShrink: 1, textAlign: 'center' },
});
