import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../core/firebase';
import { uploadImage } from './imageUploader';

export type NewListing = {
  title: string;
  description: string;
  price: number;
  surface: number;
  rooms?: number;
  propertyType: string;
  transactionType: 'sale' | 'rent';
  address: string;
  city: string;
  photoUris: string[];
};

// Adresse -> latitude / longitude avec OpenStreetMap Nominatim
async function geocode(address: string, city: string) {
  const url =
    'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
    encodeURIComponent(`${address}, ${city}`);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ServicesImmobilier/1.0 (projet etudiant)' },
  });
  if (!res.ok) throw new Error(`Service d'adresse indisponible (${res.status})`);
  const results = await res.json();
  if (!results.length) throw new Error('Adresse introuvable.');
  return {
    latitude: parseFloat(results[0].lat),
    longitude: parseFloat(results[0].lon),
  };
}

export async function createListing(data: NewListing) {
  const user = auth.currentUser;
  if (!user) throw new Error('Vous devez être connecté.');

  // 1. Adresse -> latitude / longitude
  const { latitude, longitude } = await geocode(data.address, data.city);

  // 2. Réserver l'identifiant du document
  const listingRef = doc(collection(db, 'listings'));

  // 3. Envoyer les photos vers Cloudinary
  const urls: string[] = [];
  for (const uri of data.photoUris) {
    urls.push(await uploadImage(uri));
  }

  // 4. Enregistrer l'annonce
  await setDoc(listingRef, {
    title: data.title,
    titleLower: data.title.toLowerCase(),
    description: data.description,
    price: data.price,
    surface: data.surface,
    ...(data.rooms ? { rooms: data.rooms } : {}),
    propertyType: data.propertyType,
    transactionType: data.transactionType,
    address: data.address,
    city: data.city,
    latitude,
    longitude,
    photos: urls,
    status: 'available',
    sellerId: user.uid,
    createdAt: serverTimestamp(),
  });
}