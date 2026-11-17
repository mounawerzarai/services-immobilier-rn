const DAY = 24 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, '0');

/** Heure d'un message : « 14:05 ». */
export const formatTime = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const startOfDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const WEEKDAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** Date courte pour la liste : « 14:05 », « Hier », « lun. », « 12/11/2026 ». */
export function formatConversationDate(ms: number | undefined, now = Date.now()) {
  if (!ms) return '';
  const days = Math.round((startOfDay(now) - startOfDay(ms)) / DAY);
  if (days <= 0) return formatTime(ms);
  if (days === 1) return 'Hier';
  if (days < 7) return WEEKDAYS[new Date(ms).getDay()];
  const d = new Date(ms);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Séparateur de jour dans le chat : « Aujourd'hui », « Hier », « 12 novembre 2026 ». */
export function formatDayLabel(ms: number, now = Date.now()) {
  const days = Math.round((startOfDay(now) - startOfDay(ms)) / DAY);
  if (days <= 0) return 'Aujourd’hui';
  if (days === 1) return 'Hier';
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export const sameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b);
