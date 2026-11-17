import type React from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Avatar, EmptyState } from '../components/ui';
import { auth } from '../core/firebase';
import { errorText, showMessage } from '../core/dialogs';
import { Conversation, Message } from '../data/models/Conversation';
import {
  MAX_MESSAGE_LENGTH,
  isUnread,
  markConversationRead,
  otherParticipant,
  sendMessage,
  watchConversation,
  watchMessages,
} from '../data/services/messaging';
import { formatDayLabel, formatTime, sameDay } from '../features/messaging/format';
import { useUserName } from '../features/messaging/useUserName';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

function HeaderTitle({ name, subtitle }: { name: string; subtitle?: string }) {
  return (
    <View style={styles.headerTitle}>
      <Avatar name={name} size={36} />
      <View style={{ flexShrink: 1 }}>
        <Text style={styles.headerName} numberOfLines={1}>
          {name}
        </Text>
        {subtitle ? (
          <Text style={styles.headerSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Bubble({ item, mine, showDay }: { item: Message; mine: boolean; showDay: boolean }) {
  return (
    <View>
      {showDay ? (
        <View style={styles.day}>
          <Text style={styles.dayText}>{formatDayLabel(item.estimatedAt)}</Text>
        </View>
      ) : null}
      <View style={[styles.bubbleRow, mine ? styles.right : styles.left]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, mine && { color: '#fff' }]}>{item.text}</Text>
          <View style={styles.meta}>
            <Text style={[styles.time, mine && { color: 'rgba(255,255,255,0.75)' }]}>
              {formatTime(item.estimatedAt)}
            </Text>
            {mine ? (
              <Ionicons
                name={item.sentAt ? 'checkmark-done' : 'time-outline'}
                size={13}
                color="rgba(255,255,255,0.8)"
              />
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

// T8.2 — Chat en temps réel.
export default function ChatScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const me = auth.currentUser?.uid ?? '';

  const [conv, setConv] = useState<Conversation | null | undefined>(undefined);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);

  const other = conv ? otherParticipant(conv, me) : undefined;
  const name = useUserName(other, other ? conv?.names?.[other] : undefined);

  useEffect(() => watchConversation(id, setConv, (e) => setError(errorText(e))), [id]);
  useEffect(() => watchMessages(id, setMessages, (e) => setError(errorText(e))), [id]);

  // Marque comme lu dès qu'un nouveau message de l'autre arrive pendant que l'écran est ouvert.
  useEffect(() => {
    if (conv && isUnread(conv, me)) markConversationRead(id).catch(() => {});
  }, [conv, id, me]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <HeaderTitle name={conv ? name : 'Conversation'} subtitle={conv?.listingTitle} />,
    });
  }, [navigation, name, conv]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText('');
    try {
      await sendMessage(id, body);
    } catch (e) {
      setText(body);
      showMessage('Message non envoyé', errorText(e));
    } finally {
      setSending(false);
      input.current?.focus();
    }
  };

  if (error || conv === null) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon={conv === null ? 'chatbubbles-outline' : 'cloud-offline-outline'}
          tone={conv === null ? 'primary' : 'danger'}
          title={conv === null ? 'Conversation introuvable' : 'Chargement impossible'}
          text={error ?? undefined}
          actionLabel="Retour"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  if (conv === undefined || messages === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const canSend = text.trim().length > 0 && !sending;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {conv.listingId ? (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.listing, pressed && { opacity: 0.85 }]}
          onPress={() => navigation.navigate('ListingDetail', { id: conv.listingId! })}
        >
          {conv.listingPhoto ? (
            <Image source={{ uri: conv.listingPhoto }} style={styles.listingPhoto} />
          ) : (
            <View style={[styles.listingPhoto, styles.listingNoPhoto]}>
              <Ionicons name="home-outline" size={18} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.listingLabel}>Annonce</Text>
            <Text style={styles.listingTitle} numberOfLines={1}>
              {conv.listingTitle || 'Voir l’annonce'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
        </Pressable>
      ) : null}

      <FlatList
        inverted
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, gap: 6, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => {
          const older = messages[index + 1];
          return (
            <Bubble
              item={item}
              mine={item.senderId === me}
              showDay={!older || !sameDay(older.estimatedAt, item.estimatedAt)}
            />
          );
        }}
        ListEmptyComponent={
          <View style={[styles.emptyChat, { transform: [{ scaleY: -1 }] }]}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Démarrez la conversation</Text>
            <Text style={styles.emptyText}>Présentez-vous et posez vos questions sur le bien.</Text>
          </View>
        }
      />

      <View style={[styles.composer, { paddingBottom: insets.bottom + 10 }]}>
        <TextInput
          ref={input}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Écrire un message…"
          placeholderTextColor={colors.subtle}
          multiline
          maxLength={MAX_MESSAGE_LENGTH}
          onSubmitEditing={Platform.OS === 'web' ? send : undefined}
          submitBehavior={Platform.OS === 'web' ? 'submit' : 'newline'}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Envoyer"
          disabled={!canSend}
          onPress={send}
          style={({ pressed }) => [
            styles.send,
            !canSend && { backgroundColor: colors.primaryLight },
            pressed && { transform: [{ scale: 0.94 }] },
          ]}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: 260 },
  headerName: { fontSize: 16, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 12, color: colors.muted },
  listing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadow(1),
  },
  listingPhoto: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.border },
  listingNoPhoto: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  listingLabel: { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  listingTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  day: { alignSelf: 'center', marginVertical: 10, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: '#E6EBE9' },
  dayText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  bubbleRow: { flexDirection: 'row' },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingTop: 9, paddingBottom: 6, borderRadius: 18 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  bubbleOther: { backgroundColor: colors.surface, borderBottomLeftRadius: 6, ...shadow(1) },
  bubbleText: { fontSize: 15, lineHeight: 21, color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 },
  time: { fontSize: 11, color: colors.subtle },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 6 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 22,
    backgroundColor: colors.canvas,
    fontSize: 15,
    color: colors.text,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
