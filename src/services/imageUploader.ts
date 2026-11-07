import * as FileSystem from 'expo-file-system/legacy';

const CLOUD_NAME = 'zwbdjibj';
const PRESET = 'immobilier_unsigned';

export async function uploadImage(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

  const form = new FormData();
  form.append('file', `data:image/jpeg;base64,${base64}`);
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