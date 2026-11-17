import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Avatar, EmptyState } from '../components/ui';
import { auth } from '../core/firebase';
import { errorText } from '../core/dialogs';
import { Conversation } from '../data/models/Conversation';
import { isUnread, otherParticipant, watchConversations } from '../data/services/messaging';
import { formatConversationDate } from '../features/messaging/format';
import { useUserName } from '../features/messaging/useUserName';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, shadow } from '../theme';

function ConversationRow({ item, me, onPress }: { item: Conversation; me: string; onPress: () => void }) {
  const other = otherParticipant(item, me);
  const name = useUserName(other, item.names?.[other]);
  const unread = isUnread(item, me);
  const preview = item.lastMessage
    ? `${item.lastSenderId === me ? 'Vous : ' : ''}${item.lastMessage}`
    : 'Nouvelle conversation';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Conversation avec ${name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85, transform: [{ scale: 0.995 }] }]}
    >
      <View>
        <Avatar name={name} size={52} />
        {item.listingPhoto ? <Image source={{ uri: item.listingPhoto }} style={styles.thumb} /> : null}
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.line}>
          <Text style={[styles.name, unread && styles.bold]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.date, unread && { color: colors.primary, fontWeight: '700' }]}>
            {formatConversationDate(item.updatedAt)}
          </Text>
        </View>
        {item.listingTitle ? (
          <View style={styles.listing}>
            <Ionicons name="home-outline" size={12} color={colors.primary} />
            <Text style={styles.listingText} numberOfLines={1}>
              {item.listingTitle}
            </Text>
          </View>
        ) : null}
        <View style={styles.line}>
          <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
            {preview}
          </Text>
          {unread ? <View style={styles.dot} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

// T8.1 — Liste des conversations, en temps réel.
export default function MessagesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const me = auth.currentUser?.uid ?? '';
  const [items, setItems] = useState<Conversation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => watchConversations(setItems, (e) => setError(errorText(e))), [attempt]);

  const unread = items ? items.filter((c) => isUnread(c, me)).length : 0;

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>Messages</Text>
      <Text style={styles.subtitle}>
        {unread > 0
          ? `${unread} conversation${unread > 1 ? 's' : ''} non lue${unread > 1 ? 's' : ''}`
          : 'Échangez avec les vendeurs et les acheteurs'}
      </Text>
    </View>
  );

  if (error || items === null) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, paddingHorizontal: 20 }]}>
        {header}
        {error ? (
          <EmptyState
            icon="cloud-offline-outline"
            tone="danger"
            title="Chargement impossible"
            text={error}
            actionLabel="Réessayer"
            onAction={() => {
              setError(null);
              setAttempt((a) => a + 1);
            }}
          />
        ) : (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        )}
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      data={items}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 24, gap: 10, flexGrow: 1 }}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <EmptyState
          icon="chatbubbles-outline"
          title="Aucune conversation"
          text="Contactez un vendeur depuis une annonce pour démarrer une discussion."
          actionLabel="Voir les annonces"
          onAction={() => (navigation as any).navigate('Accueil')}
        />
      }
      renderItem={({ item }) => (
        <ConversationRow
          item={item}
          me={me}
          onPress={() => navigation.navigate('Chat', { id: item.id })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: { paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    ...shadow(1),
  },
  thumb: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.border,
  },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  bold: { fontWeight: '800' },
  date: { fontSize: 12, color: colors.subtle },
  listing: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listingText: { flex: 1, fontSize: 12, color: colors.primary, fontWeight: '600' },
  preview: { flex: 1, fontSize: 14, color: colors.muted },
  previewUnread: { color: colors.text, fontWeight: '600' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
});
