const CLOUD_NAME = 'zwbdjibj';
const PRESET = 'immobilier_unsigned';

export async function uploadImage(uri: string): Promise<string> {
  const form = new FormData();
  form.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' } as any);
  form.append('upload_preset', PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form },
  );
  if (!res.ok) throw new Error(`Envoi de la photo échoué (${res.status})`);
  const json = await res.json();
  return json.secure_url as string;
}