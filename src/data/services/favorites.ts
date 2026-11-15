import { doc, onSnapshot, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../core/firebase';

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
