
import {
  collection, deleteDoc, deleteField, doc, getDoc,
  serverTimestamp, setDoc, updateDoc,
} from 'firebase/firestore';
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

// Recherche d'adresse avec OpenStreetMap Nominatim
async function nominatim(q: string) {
  const url =
    'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=tn&q=' +
    encodeURIComponent(q);

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'ServicesImmobilier/1.0 (projet etudiant)',
    },
  });

  if (!res.ok) {
    throw new Error(`Service d'adresse indisponible (${res.status})`);
  }

  const results = await res.json();

  if (!results.length) return null;

  return {
    latitude: parseFloat(results[0].lat),
    longitude: parseFloat(results[0].lon),
  };
}

// Essaie l'adresse complète, puis la ville seule
async function geocode(address: string, city: string) {
  const found =
    (await nominatim(`${address}, ${city}`)) ?? (await nominatim(city));

  if (!found) {
    throw new Error('Ville introuvable. Vérifiez son orthographe.');
  }

  return found;
}

// Créer une annonce
export async function createListing(data: NewListing) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Vous devez être connecté.');
  }

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

// Récupérer une annonce
export async function getListing(id: string) {
  const snap = await getDoc(doc(db, 'listings', id));

  return snap.exists() ? (snap.data() as any) : null;
}

// Type pour la modification d'une annonce
export type EditListing = Omit<NewListing, 'photoUris'> & {
  keptPhotos: string[];
  newPhotoUris: string[];
  addressChanged: boolean;
};

// Modifier une annonce
export async function updateListing(id: string, data: EditListing) {
  if (!auth.currentUser) {
    throw new Error('Vous devez être connecté.');
  }

  const update: Record<string, any> = {
    title: data.title,
    titleLower: data.title.toLowerCase(),
    description: data.description,
    price: data.price,
    surface: data.surface,
    rooms: data.rooms ?? deleteField(),
    propertyType: data.propertyType,
    transactionType: data.transactionType,
    address: data.address,
    city: data.city,
  };

  if (data.addressChanged) {
    const { latitude, longitude } = await geocode(data.address, data.city);
    update.latitude = latitude;
    update.longitude = longitude;
  }

  const urls = [...data.keptPhotos];

  for (const uri of data.newPhotoUris) {
    urls.push(await uploadImage(uri));
  }

  update.photos = urls;

  await updateDoc(doc(db, 'listings', id), update);
}

// Supprimer une annonce
export const deleteListing = (id: string) =>
  deleteDoc(doc(db, 'listings', id));

// Modifier le statut d'une annonce
export const setListingStatus = (
  id: string,
  status: 'available' | 'sold' | 'rented'
) => updateDoc(doc(db, 'listings', id), { status });
