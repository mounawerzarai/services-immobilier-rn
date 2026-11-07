import { Listing, TransactionType } from '../../data/models/Listing';

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
