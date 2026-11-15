import { Listing } from '../../data/models/Listing';

// Tri de la liste d’accueil (T5.3).
export type SortKey = 'newest' | 'oldest' | 'priceAsc' | 'priceDesc';

export const DEFAULT_SORT: SortKey = 'newest';

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Plus récentes' },
  { key: 'oldest', label: 'Plus anciennes' },
  { key: 'priceAsc', label: 'Prix croissant' },
  { key: 'priceDesc', label: 'Prix décroissant' },
];

// La réserve d’annonces arrive déjà de la plus récente à la plus ancienne (createdAt desc) :
// « récentes » garde cet ordre, « anciennes » l’inverse, et le tri par prix est stable
// (à prix égal, la plus récente reste en premier).
export function applySort(items: Listing[], sort: SortKey): Listing[] {
  switch (sort) {
    case 'oldest':
      return [...items].reverse();
    case 'priceAsc':
      return [...items].sort((a, b) => a.price - b.price);
    case 'priceDesc':
      return [...items].sort((a, b) => b.price - a.price);
    default:
      return items;
  }
}
