import { deleteListing, setListingStatus } from '../../services/listingService';
import { confirmAsync, errorText, showMessage } from '../../core/dialogs';

/**
 * Demande confirmation puis supprime l'annonce.
 * Renvoie true si l'annonce a bien été supprimée.
 */
export async function confirmAndDeleteListing(id: string, title?: string): Promise<boolean> {
  const ok = await confirmAsync({
    title: "Supprimer l'annonce ?",
    message: title
      ? `« ${title} » sera définitivement supprimée.`
      : 'Cette action est définitive.',
    confirmText: 'Supprimer',
    destructive: true,
  });
  if (!ok) return false;
  try {
    await deleteListing(id);
    return true;
  } catch (e) {
    showMessage('Suppression impossible', errorText(e));
    return false;
  }
}

/** Disponible <-> vendu / loué. */
export async function toggleListingStatus(item: {
  id: string;
  status: string;
  transactionType: string;
}) {
  const closed = item.transactionType === 'rent' ? 'rented' : 'sold';
  try {
    await setListingStatus(item.id, item.status === 'available' ? closed : 'available');
  } catch (e) {
    showMessage('Erreur', errorText(e));
  }
}
