import { Listing } from '../../data/models/Listing';
import { propertyTypeLabel, transactionLabel } from '../listings/format';

// Minuscules + sans accents, pour que « Résidence » trouve « residence ».
export const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// Garde les annonces dont le titre, la description, la ville, l’adresse, le type
// (en français : « Appartement », « Maison »…) ou « Vente » / « Location »
// contiennent TOUS les mots saisis.
export function filterListings(items: Listing[], term: string): Listing[] {
  const tokens = normalize(term).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return items;

  return items.filter((l) => {
    const haystack = normalize(
      [
        l.title,
        l.description,
        l.city,
        l.address,
        propertyTypeLabel(l.propertyType),
        transactionLabel(l.transactionType),
      ]
        .filter(Boolean)
        .join(' '),
    );
    return tokens.every((t) => haystack.includes(t));
  });
}