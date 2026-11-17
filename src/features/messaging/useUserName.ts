import { useEffect, useState } from 'react';
import { getUser } from '../../data/services/users';

const cache = new Map<string, string>();

/** Nom d'un utilisateur (users/{uid}), mis en cache pour la session. */
export function useUserName(uid: string | undefined, fallback?: string) {
  const [name, setName] = useState(() => (uid && cache.get(uid)) || fallback || '');

  useEffect(() => {
    if (!uid || cache.has(uid)) return;
    let alive = true;
    getUser(uid)
      .then((u) => {
        if (u?.name) {
          cache.set(uid, u.name);
          if (alive) setName(u.name);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [uid]);

  return (uid && cache.get(uid)) || name || fallback || 'Utilisateur';
}
