import { Alert, Platform } from 'react-native';

// Boîtes de dialogue qui marchent partout.
// Sur le web, react-native-web ignore Alert.alert : aucune fenêtre ne s'affiche
// et le bouton « Supprimer » ne faisait donc rien. On passe par window.confirm / window.alert.

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

/** Demande une confirmation. Résout true si l'utilisateur confirme. */
export function confirmAsync({
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(typeof window !== 'undefined' && window.confirm(text));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/** Affiche un message simple (information ou erreur). */
export function showMessage(title: string, message?: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

/** Message d'erreur lisible à partir d'une exception Firebase ou JS. */
export function errorText(e: unknown): string {
  const code = (e as { code?: string })?.code;
  if (code === 'permission-denied') return "Vous n'avez pas les droits pour cette action.";
  if (code === 'unavailable') return 'Problème de connexion réseau.';
  const msg = (e as { message?: string })?.message;
  return msg ? String(msg) : String(e);
}
