/** Conversation entre un acheteur / locataire et un vendeur, liée à une annonce. */
export interface Conversation {
  id: string;
  /** Les deux participants (uid), triés. */
  participants: string[];
  listingId?: string;
  listingTitle?: string;
  listingPhoto?: string | null;
  /** Nom affiché de chaque participant, enregistré à la création. */
  names?: Record<string, string>;
  lastMessage?: string;
  lastSenderId?: string;
  /** Date du dernier message (ms). */
  updatedAt?: number;
  /** Dernière lecture de chaque participant (ms). */
  readAt?: Record<string, number>;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  /** null tant que le serveur n'a pas confirmé l'envoi. */
  sentAt: number | null;
  /** Heure à afficher (heure locale estimée tant que l'envoi est en cours). */
  estimatedAt: number;
}
