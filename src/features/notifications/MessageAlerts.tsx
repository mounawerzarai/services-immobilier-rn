import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { auth } from '../../core/firebase';
import { Conversation } from '../../data/models/Conversation';
import { isUnread, watchConversations } from '../../data/services/messaging';
import { RootStackParamList } from '../../navigation/types';
import { colors, radius, shadow } from '../../theme';

interface Alert {
  conversationId: string;
  title: string;
  body: string;
}

const VISIBLE_MS = 4500;

// T9 (version gratuite) : alerte dans l'appli quand un message arrive pendant que l'appli est ouverte.
// Les vraies notifications push (appli fermée) demandent Cloud Functions, donc le plan Blaze.
export default function MessageAlerts({
  navRef,
}: {
  navRef: NavigationContainerRefWithCurrent<RootStackParamList>;
}) {
  const insets = useSafeAreaInsets();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [slide] = useState(() => new Animated.Value(0));
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const known = useRef<Map<string, number> | null>(null); // conversation -> dernier updatedAt vu

  const hide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(slide, {
      toValue: 0,
      duration: 180,
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      if (finished) setAlert(null);
    });
  };

  const show = (next: Alert) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setAlert(next);
    Animated.timing(slide, {
      toValue: 1,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    hideTimer.current = setTimeout(hide, VISIBLE_MS);
  };

  useEffect(() => {
    const me = auth.currentUser?.uid;
    if (!me) return;

    const unsubscribe = watchConversations((items: Conversation[]) => {
      // Premier envoi de données : on mémorise l'état sans alerter pour les anciens messages.
      if (known.current === null) {
        known.current = new Map(items.map((c) => [c.id, c.updatedAt ?? 0]));
        return;
      }
      const seen = known.current;
      const current = navRef.isReady() ? navRef.getCurrentRoute() : undefined;
      const inChat = (id: string) =>
        current?.name === 'Chat' && (current.params as { id?: string } | undefined)?.id === id;

      let latest: Conversation | undefined;
      for (const c of items) {
        const before = seen.get(c.id) ?? 0;
        seen.set(c.id, c.updatedAt ?? 0);
        const fresh = (c.updatedAt ?? 0) > before;
        if (fresh && isUnread(c, me) && !inChat(c.id)) {
          if (!latest || (c.updatedAt ?? 0) > (latest.updatedAt ?? 0)) latest = c;
        }
      }
      if (latest) {
        const sender = latest.lastSenderId ? latest.names?.[latest.lastSenderId] : undefined;
        show({
          conversationId: latest.id,
          title: sender || 'Nouveau message',
          body: latest.lastMessage || '',
        });
      }
    });

    return () => {
      unsubscribe();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!alert) return null;

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [-140, 0] });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { top: insets.top + 8, opacity: slide, transform: [{ translateY }] }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Nouveau message de ${alert.title}`}
        style={styles.card}
        onPress={() => {
          const id = alert.conversationId;
          hide();
          if (navRef.isReady()) navRef.navigate('Chat', { id });
        }}
      >
        <View style={styles.icon}>
          <Ionicons name="chatbubble" size={18} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {alert.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {alert.body}
          </Text>
        </View>
        <Pressable onPress={hide} hitSlop={10} accessibilityLabel="Fermer">
          <Ionicons name="close" size={20} color={colors.muted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 100 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow(3),
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  body: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
