import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '../../core/firebase';
import { Listing } from '../models/Listing';

const refFor = (listingId: string) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  return doc(db, 'users', uid, 'favorites', listingId);
};

/** Écoute en temps réel : true si l'annonce est dans mes favoris */
export function watchFavorite(listingId: string, cb: (fav: boolean) => void) {
  const ref = refFor(listingId);
  if (!ref) {
    cb(false);
    return () => {};
  }
  return onSnapshot(ref, (s) => cb(s.exists()));
}

/** Ajoute si absent, retire si présent */
export async function toggleFavorite(listingId: string) {
  const ref = refFor(listingId);
  if (!ref) return;
  const snap = await getDoc(ref);
  if (snap.exists()) await deleteDoc(ref);
  else await setDoc(ref, { addedAt: serverTimestamp() });
}

/** Retire une annonce des favoris. */
export async function removeFavorite(listingId: string) {
  const ref = refFor(listingId);
  if (ref) await deleteDoc(ref);
}

/**
 * T7.2 — Écoute la liste de mes favoris (du plus récent au plus ancien)
 * et renvoie les annonces correspondantes.
 * Une annonce supprimée par son vendeur est retirée automatiquement des favoris.
 */
export function watchFavoriteListings(
  cb: (items: Listing[]) => void,
  onError?: (e: unknown) => void,
) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    cb([]);
    return () => {};
  }
  let version = 0;
  const q = query(collection(db, 'users', uid, 'favorites'), orderBy('addedAt', 'desc'));
  return onSnapshot(
    q,
    async (snap) => {
      const current = ++version;
      try {
        const ids = snap.docs.map((d) => d.id);
        const docs = await Promise.all(ids.map((id) => getDoc(doc(db, 'listings', id))));
        if (current !== version) return; // une mise à jour plus récente est arrivée
        const items: Listing[] = [];
        docs.forEach((d, i) => {
          if (d.exists()) items.push({ id: d.id, ...(d.data() as Omit<Listing, 'id'>) });
          else deleteDoc(doc(db, 'users', uid, 'favorites', ids[i])).catch(() => {});
        });
        cb(items);
      } catch (e) {
        onError?.(e);
      }
    },
    (e) => onError?.(e),
  );
}
