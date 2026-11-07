import { Listing, ListingStatus, TransactionType } from '../../data/models/Listing';

export const transactionLabel = (t: TransactionType) => (t === 'rent' ? 'Location' : 'Vente');

export function formatPrice(l: Pick<Listing, 'price' | 'transactionType'>) {
  const base = `${Number(l.price).toLocaleString('fr-FR')} DT`;
  return l.transactionType === 'rent' ? `${base} / mois` : base;
}

export function formatDetails(l: Listing) {
  const parts: string[] = [];
  if (l.city) parts.push(l.city);
  if (l.surface) parts.push(`${l.surface} m²`);
  if (l.rooms) parts.push(`${l.rooms} pièce${l.rooms > 1 ? 's' : ''}`);
  return parts.join(' · ');
}

const propertyTypes: Record<string, string> = {
  apartment: 'Appartement',
  house: 'Maison',
};

export const propertyTypeLabel = (t?: string) => (t ? (propertyTypes[t] ?? t) : '');

export const statusLabel: Record<ListingStatus, string> = {
  available: 'Disponible',
  sold: 'Vendu',
  rented: 'Loué',
};
