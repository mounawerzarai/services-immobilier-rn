import {
  DocumentData,
  Timestamp,
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { auth, db } from '../../core/firebase';
import { Conversation } from '../models/Conversation';

// Messagerie (Firestore) :
//   conversations/{id}                 participants, annonce, dernier message, lectures
//   conversations/{id}/messages/{id}   senderId, text, sentAt
// Les règles sont dans firebase/firestore.rules.

export const toMillis = (v: unknown): number | undefined =>
  v instanceof Timestamp ? v.toMillis() : typeof v === 'number' ? v : undefined;

function toMillisMap(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (v && typeof v === 'object') {
    for (const [k, t] of Object.entries(v as Record<string, unknown>)) {
      const ms = toMillis(t);
      if (ms !== undefined) out[k] = ms;
    }
  }
  return out;
}

export function toConversation(id: string, d: DocumentData): Conversation {
  return {
    id,
    participants: Array.isArray(d.participants) ? d.participants : [],
    listingId: d.listingId,
    listingTitle: d.listingTitle,
    listingPhoto: d.listingPhoto ?? null,
    names: d.names ?? {},
    lastMessage: d.lastMessage,
    lastSenderId: d.lastSenderId,
    updatedAt: toMillis(d.updatedAt) ?? toMillis(d.createdAt),
    readAt: toMillisMap(d.readAt),
  };
}

/** L'autre participant de la conversation. */
export const otherParticipant = (c: Conversation, me: string) =>
  c.participants.find((p) => p !== me) ?? me;

/** true si le dernier message vient de l'autre et n'a pas encore été lu. */
export function isUnread(c: Conversation, me: string): boolean {
  if (!c.lastSenderId || c.lastSenderId === me || !c.updatedAt) return false;
  const read = c.readAt?.[me];
  return !read || read < c.updatedAt;
}

/**
 * T8.1 — Mes conversations en temps réel, de la plus récente à la plus ancienne.
 * Le tri se fait côté appli : pas besoin d'index composite.
 */
export function watchConversations(
  cb: (items: Conversation[]) => void,
  onError?: (e: unknown) => void,
) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    cb([]);
    return () => {};
  }
  const q = query(collection(db, 'conversations'), where('participants', 'array-contains', uid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => toConversation(d.id, d.data()))
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
      cb(items);
    },
    (e) => onError?.(e),
  );
}

/** Nombre de conversations non lues (badge de l'onglet Messages). */
export function watchUnreadCount(cb: (n: number) => void) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    cb(0);
    return () => {};
  }
  return watchConversations(
    (items) => cb(items.filter((c) => isUnread(c, uid)).length),
    () => cb(0),
  );
}
