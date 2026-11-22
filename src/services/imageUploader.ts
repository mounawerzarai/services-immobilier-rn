import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const CLOUD_NAME = 'zwbdjibj';
const PRESET = 'immobilier_unsigned';

/**
 * Prépare la photo pour l'envoi :
 * - mobile : lecture du fichier local en base64 (expo-file-system) ;
 * - web : expo-file-system n'existe pas (erreur « readAsStringAsync is not
 *   available on web »). L'image choisie est une URL blob:/data:, qu'on
 *   récupère directement comme fichier (Blob).
 */
async function toUploadable(uri: string): Promise<string | Blob> {
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    return res.blob();
  }
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  return `data:image/jpeg;base64,${base64}`;
}

export async function uploadImage(uri: string): Promise<string> {
  const form = new FormData();
  form.append('file', await toUploadable(uri));
  form.append('upload_preset', PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Cloudinary ${res.status} : ${json?.error?.message ?? 'erreur inconnue'}`,
    );
  }
  return json.secure_url as string;
}
