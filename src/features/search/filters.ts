import { Listing, TransactionType } from '../../data/models/Listing';
import { normalize } from './searchListings';

// Filtres de l’écran d’accueil (T5.2). Une valeur absente = pas de filtre.
export interface Filters {
  transactionType?: TransactionType;
  propertyType?: string;
  city: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
}

export const EMPTY_FILTERS: Filters = { city: '' };

export const PROPERTY_TYPE_KEYS = ['apartment', 'house', 'land', 'commercial'];

export const ROOM_CHOICES = [1, 2, 3, 4, 5];

// « 120 000 » ou « 1200,5 » -> nombre ; vide, invalide ou ≤ 0 -> undefined.
export function parsePrice(text: string): number | undefined {
  const cleaned = text.replace(/\s/g, '').replace(',', '.');
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function countActiveFilters(f: Filters): number {
  return [
    f.transactionType,
    f.propertyType,
    f.city.trim() || undefined,
    f.minPrice,
    f.maxPrice,
    f.minRooms,
  ].filter((v) => v !== undefined).length;
}

// Garde les annonces qui respectent TOUS les filtres actifs.
export function applyFilters(items: Listing[], f: Filters): Listing[] {
  const city = normalize(f.city);
  return items.filter((l) => {
    if (f.transactionType && l.transactionType !== f.transactionType) return false;
    if (f.propertyType && l.propertyType !== f.propertyType) return false;
    if (city && !normalize(l.city ?? '').includes(city)) return false;
    if (f.minPrice !== undefined && l.price < f.minPrice) return false;
    if (f.maxPrice !== undefined && l.price > f.maxPrice) return false;
    if (f.minRooms !== undefined && (l.rooms ?? 0) < f.minRooms) return false;
    return true;
  });
}
