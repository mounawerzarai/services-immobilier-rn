import { updateProfile } from '@firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../core/firebase';
import { AppUser } from '../models/User';

export async function getUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid,
    name: data.name ?? '',
    email: data.email ?? '',
    phone: data.phone ?? '',
    photoUrl: data.photoUrl,
    createdAt: data.createdAt,
  };
}

export async function updateUserProfile(
  uid: string,
  values: { name: string; phone: string },
) {
  const name = values.name.trim();
  const phone = values.phone.trim();
  await setDoc(doc(db, 'users', uid), { name, phone }, { merge: true });
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: name });
  }
}
