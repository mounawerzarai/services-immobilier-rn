// Petit bus d'événements pour prévenir les écrans qui gardent une liste en mémoire
// (l'accueil charge ses annonces une seule fois, sans écoute temps réel).

type Listener = (id: string) => void;

const deletedListeners = new Set<Listener>();

/** S'abonne aux suppressions d'annonces. Renvoie la fonction de désabonnement. */
export function onListingDeleted(listener: Listener) {
  deletedListeners.add(listener);
  return () => {
    deletedListeners.delete(listener);
  };
}

export function emitListingDeleted(id: string) {
  deletedListeners.forEach((l) => l(id));
}
