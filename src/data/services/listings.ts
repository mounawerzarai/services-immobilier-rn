import {
  DocumentSnapshot,
  QueryConstraint,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore';
import { db } from '../../core/firebase';
import { Listing } from '../models/Listing';
import { AppUser } from '../models/User';
import { getUser } from './users';

export const PAGE_SIZE = 20;

export interface ListingsPage {
  items: Listing[];
  cursor: DocumentSnapshot | null;
  hasMore: boolean;
}

const toListing = (d: DocumentSnapshot): Listing =>
  ({ id: d.id, ...(d.data() as Omit<Listing, 'id'>) });

// Annonces du vendeur connecté, de la plus récente à la plus ancienne.
// Demande l’index composite sellerId + createdAt (firebase/firestore.indexes.json).
export async function getMyListings(uid: string): Promise<Listing[]> {
  const q = query(
    collection(db, 'listings'),
    where('sellerId', '==', uid),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(toListing);
}

// Une page d’annonces disponibles (20 par page), de la plus récente à la plus ancienne.
// Passer le `cursor` de la page précédente pour charger la suivante.
// Demande l’index composite status + createdAt (déjà dans firestore.indexes.json).
export async function getAvailableListingsPage(
  cursor?: DocumentSnapshot | null,
): Promise<ListingsPage> {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'available'),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE),
  ];
  if (cursor) constraints.push(startAfter(cursor));

  const snap = await getDocs(query(collection(db, 'listings'), ...constraints));
  return {
    items: snap.docs.map(toListing),
    cursor: snap.docs[snap.docs.length - 1] ?? cursor ?? null,
    hasMore: snap.docs.length === PAGE_SIZE,
  };
}

export interface ListingDetail {
  listing: Listing;
  seller: AppUser | null;
}

// Une annonce et son vendeur (nom et téléphone lus dans users/{sellerId}).
// Renvoie null si l’annonce n’existe plus.
export async function getListingDetail(id: string): Promise<ListingDetail | null> {
  const snap = await getDoc(doc(db, 'listings', id));
  if (!snap.exists()) return null;
  const listing = toListing(snap);
  const seller = await getUser(listing.sellerId).catch(() => null);
  return { listing, seller };
}

// Réserve d’annonces pour la recherche texte : les 200 plus récentes disponibles.
// Firestore n’a pas de recherche plein texte (plan Spark, pas de service externe) :
// on filtre côté appli avec filterListings (features/search/searchListings.ts).
// Utilise l’index status + createdAt déjà déployé.
export const SEARCH_POOL_SIZE = 200;

export async function getSearchPool(): Promise<Listing[]> {
  const snap = await getDocs(
    query(
      collection(db, 'listings'),
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc'),
      limit(SEARCH_POOL_SIZE),
    ),
  );
  return snap.docs.map(toListing);
}