import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../core/firebase';
import { Listing } from '../models/Listing';

// Annonces du vendeur connecté, de la plus récente à la plus ancienne.
// Demande l’index composite sellerId + createdAt (firebase/firestore.indexes.json).
export async function getMyListings(uid: string): Promise<Listing[]> {
  const q = query(
    collection(db, 'listings'),
    where('sellerId', '==', uid),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Listing, 'id'>) }));
}
