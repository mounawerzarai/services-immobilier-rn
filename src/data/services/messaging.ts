import {
  DocumentData,
  Timestamp,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../../core/firebase';
import { Conversation, Message } from '../models/Conversation';
import { getUser } from './users';

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
        .map((d) => toConversation(d.id, d.data({ serverTimestamps: 'estimate' })))
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

// ---------- T8.2 — Chat en temps réel ----------

export const MAX_MESSAGE_LENGTH = 2000;
export const MESSAGES_LIMIT = 200;

/** Une conversation en temps réel (null si elle n'existe pas ou n'est pas accessible). */
export function watchConversation(
  id: string,
  cb: (c: Conversation | null) => void,
  onError?: (e: unknown) => void,
) {
  return onSnapshot(
    doc(db, 'conversations', id),
    (s) => cb(s.exists() ? toConversation(s.id, s.data({ serverTimestamps: 'estimate' })) : null),
    (e) => onError?.(e),
  );
}

/** Messages d'une conversation, du plus récent au plus ancien (pour une liste inversée). */
export function watchMessages(
  conversationId: string,
  cb: (items: Message[]) => void,
  onError?: (e: unknown) => void,
) {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('sentAt', 'desc'),
    limit(MESSAGES_LIMIT),
  );
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) =>
      cb(
        snap.docs.map((d) => {
          // « estimate » : un message en cours d'envoi a déjà une heure locale.
          const data = d.data({ serverTimestamps: 'estimate' });
          return {
            id: d.id,
            senderId: data.senderId,
            text: data.text,
            sentAt: d.metadata.hasPendingWrites ? null : (toMillis(data.sentAt) ?? null),
            estimatedAt: toMillis(data.sentAt) ?? Date.now(),
          } as Message;
        }),
      ),
    (e) => onError?.(e),
  );
}

/** Envoie un message et met à jour l'aperçu de la conversation (écriture atomique). */
export async function sendMessage(conversationId: string, text: string) {
  const uid = auth.currentUser?.uid;
  const body = text.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!uid || !body) return;
  const conv = doc(db, 'conversations', conversationId);
  const batch = writeBatch(db);
  batch.set(doc(collection(conv, 'messages')), {
    senderId: uid,
    text: body,
    sentAt: serverTimestamp(),
  });
  batch.update(conv, {
    lastMessage: body,
    lastSenderId: uid,
    updatedAt: serverTimestamp(),
    [`readAt.${uid}`]: serverTimestamp(),
  });
  await batch.commit();
}

/** Marque la conversation comme lue par l'utilisateur connecté. */
export async function markConversationRead(conversationId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await updateDoc(doc(db, 'conversations', conversationId), {
    [`readAt.${uid}`]: serverTimestamp(),
  });
}

// ---------- T8.3 — Démarrer une conversation depuis une annonce ----------

/**
 * Identifiant unique pour (annonce, acheteur, vendeur) : recontacter le même
 * vendeur pour la même annonce rouvre la même conversation.
 */
export function conversationIdFor(listingId: string, a: string, b: string) {
  const [x, y] = [a, b].sort();
  return `${listingId}_${x}_${y}`;
}

export class ContactError extends Error {}

/** Ouvre la conversation existante ou la crée. Renvoie son identifiant. */
export async function startConversation(params: {
  listingId: string;
  listingTitle: string;
  listingPhoto?: string | null;
  sellerId: string;
  sellerName?: string;
}): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new ContactError('Connectez-vous pour contacter le vendeur.');
  if (user.uid === params.sellerId) throw new ContactError('Vous êtes le vendeur de cette annonce.');

  const id = conversationIdFor(params.listingId, user.uid, params.sellerId);
  const ref = doc(db, 'conversations', id);
  try {
    if ((await getDoc(ref)).exists()) return id;
  } catch (e) {
    // Les règles refusent la lecture d'une conversation qui n'existe pas encore.
    if ((e as { code?: string })?.code !== 'permission-denied') throw e;
  }

  const myName =
    user.displayName?.trim() || (await getUser(user.uid).catch(() => null))?.name || 'Utilisateur';
  await setDoc(ref, {
    participants: [user.uid, params.sellerId].sort(),
    listingId: params.listingId,
    listingTitle: params.listingTitle,
    listingPhoto: params.listingPhoto ?? null,
    names: { [user.uid]: myName, [params.sellerId]: params.sellerName || 'Vendeur' },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    readAt: { [user.uid]: serverTimestamp() },
  });
  return id;
}
