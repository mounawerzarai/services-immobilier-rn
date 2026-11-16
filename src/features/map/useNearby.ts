import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';

import { db } from '../../core/firebase';
import { Listing } from '../../data/models/Listing';
import { DEFAULT_RADIUS_KM, LatLng, withinRadius } from './geo';
import { getCurrentPosition } from './location';

export type NearbyListing = Listing & { distanceKm: number };
type GeoListing = Listing & { latitude: number; longitude: number };

/** Annonces disponibles qui ont une position (mêmes index que la liste : status + createdAt). */
export function useMapListings() {
  const [listings, setListings] = useState<GeoListing[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'listings'),
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc'),
      limit(200),
    );
    return onSnapshot(
      q,
      (snap) => {
        setError(null);
        setListings(
          snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<Listing, 'id'>) }))
            .filter(
              (l): l is GeoListing =>
                typeof l.latitude === 'number' &&
                typeof l.longitude === 'number' &&
                typeof l.price === 'number',
            ),
        );
      },
      (e) => setError(e.message),
    );
  }, []);

  return { listings, error };
}

export type LocateStatus = 'idle' | 'locating' | 'ok' | 'denied' | 'unavailable';

/**
 * « Recherche autour de moi » (T6.2) : position de l'utilisateur, rayon en km
 * et annonces situées dans ce rayon, de la plus proche à la plus éloignée.
 */
export function useNearby(listings: GeoListing[]) {
  const [me, setMe] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<LocateStatus>('locating');
  const [active, setActive] = useState(false);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);

  const locate = useCallback(async () => {
    setStatus('locating');
    try {
      const pos = await getCurrentPosition();
      setMe(pos);
      setStatus('ok');
      return pos;
    } catch (e) {
      setStatus((e as Error)?.message === 'permission-denied' ? 'denied' : 'unavailable');
      return null;
    }
  }, []);

  // Position au premier affichage (silencieux si refus : la carte reste utilisable, US19).
  useEffect(() => {
    let alive = true;
    getCurrentPosition()
      .then((pos) => {
        if (!alive) return;
        setMe(pos);
        setStatus('ok');
      })
      .catch((e) => {
        if (alive) setStatus((e as Error)?.message === 'permission-denied' ? 'denied' : 'unavailable');
      });
    return () => {
      alive = false;
    };
  }, []);

  const toggle = useCallback(async () => {
    if (active) {
      setActive(false);
      return;
    }
    const pos = me ?? (await locate());
    if (pos) setActive(true);
  }, [active, me, locate]);

  const results: NearbyListing[] = useMemo(
    () => (active && me ? withinRadius(listings, me, radiusKm) : []),
    [active, me, listings, radiusKm],
  );

  return { me, status, active, radiusKm, setRadiusKm, toggle, locate, results };
}
