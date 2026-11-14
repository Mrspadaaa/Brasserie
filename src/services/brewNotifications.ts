/**
 * Notification d'un ajout en cuve, côté page (port-F1 de p2c, G2).
 *
 * Standard web : Push API + service worker (`showNotification` avec `actions`, `notificationclick`). Pas de
 * minuterie locale dans un worker (Notification Triggers abandonné par Chrome) : tant que l'appli tourne, c'est
 * la page qui pose et relance la notification ; appli fermée, le push du serveur arrive (public/brew-alerts-sw.js).
 * Chrome n'affiche que 2 actions, Safari iOS aucune : « Ouvrir » est le toucher sur le corps.
 */
import { phraseRetard } from './brewTimer';

// --- Identifier un ajout -----------------------------------------------------

const ID_RE = /^[A-Za-z0-9_]+(?:-[A-Za-z0-9_]+)*$/;
const TAG_RE = /^add-((?:(?:hop|grain)-\d+)(?:-(?:hop|grain)-\d+)*)$/;
const TOKEN_RE = /(?:hop|grain)-\d+/g;

/** Le tag d'un groupe d'ajouts : `add-hop-0-hop-1`, le même que celui de `sessionEvents` côté serveur. */
export const tagAjout = (ids: string[]) => `add-${ids.join('-')}`;

/**
 * Les ids d'ajout d'une notification : la liste du serveur (`additionIds`, tableau ou JSON) si elle existe,
 * sinon le tag `add-<ids>` — lisible seulement pour `hop-N` et `grain-N`. Un id à tiret quelconque rendrait
 * le découpage ambigu : `[]`, donc rien ne se coche.
 */
export function idsAjoutDepuis(additionIds?: unknown, tag?: unknown): string[] {
  let list = additionIds;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      list = null;
    }
  }
  if (Array.isArray(list)) {
    const ids = list
      .filter((id): id is string => typeof id === 'string' && id.length <= 40 && ID_RE.test(id))
      .slice(0, 20);
    return ids.length === list.length ? ids : [];
  }
  const m = typeof tag === 'string' ? TAG_RE.exec(tag) : null;
  return m ? (m[1].match(TOKEN_RE) ?? []) : [];
}

// --- Contenu de la notification ----------------------------------------------

const heure = (at: number) => {
  const d = new Date(at);
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Ce que la page sait d'un ajout dû : de quoi dire « Citra 25 g · en retard de 4 min ». */
export interface AlerteAjout {
  batchId: string;
  /** Ids des ajouts du groupe (`hop-0`…) : jamais vide, sinon « Ajouté » ne cocherait rien. */
  additionIds: string[];
  /** « Citra 25 g » (plusieurs : « Citra 25 g + Amarillo 43 g »). */
  libelle: string;
  /** « 8 Ébullition · ajout 5′ ». */
  detail: string;
  /** Heure prévue, en ms. */
  dueAt: number;
  /** Ligne « ensuite » de la maquette : « Amarillo 43 g · coupure du feu 14 h 38 ». */
  ensuite?: string;
}
export interface ActionNotif {
  action: 'ajoute' | 'plus1';
  title: string;
}
export interface DonneesNotif {
  batchId: string;
  additionIds: string[];
  tag: string;
  dueAt: number;
}
export interface NotificationAjout {
  title: string;
  options: {
    body: string;
    tag: string;
    renotify: true;
    requireInteraction: true;
    vibrate: number[];
    actions: ActionNotif[];
    data: DonneesNotif;
  };
}

/** Les deux actions que Chrome affiche. « Ouvrir » = toucher le corps. */
export const ACTIONS_AJOUT: ActionNotif[] = [
  { action: 'ajoute', title: 'Ajouté' },
  { action: 'plus1', title: '+1 min' }
];
const VIBRATION = [700, 150, 700, 150, 1000, 300, 700, 150, 700, 150, 1000];

/**
 * Titre « Citra 25 g · en retard de 4 min » (« maintenant » sous la minute), corps « 8 Ébullition · ajout 5′, dû
 * à 14 h 33 » puis « ensuite … ». Le retard se recalcule à chaque relance : la notification dit le vrai retard.
 */
export function contenuAlerte(a: AlerteAjout, now: number): NotificationAjout {
  const retard = phraseRetard(a.dueAt - now);
  const title = retard ? `${a.libelle} · ${retard.court}` : a.libelle;
  const lignes = [`${a.detail}, dû à ${heure(a.dueAt)}`];
  if (a.ensuite) lignes.push(`ensuite ${a.ensuite}`);
  const tag = tagAjout(a.additionIds);
  return {
    title,
    options: {
      body: lignes.join('\n'),
      tag,
      renotify: true,
      requireInteraction: true,
      vibrate: VIBRATION,
      actions: ACTIONS_AJOUT.map((x) => ({ ...x })),
      data: { batchId: a.batchId, additionIds: [...a.additionIds], tag, dueAt: a.dueAt }
    }
  };
}

// --- Répétition et report, quand la page tourne ------------------------------

export const RELANCE_MS = 60_000;
/** Dix relances au plus, comme le serveur : une alarme oubliée ne sonne pas des heures. */
export const RELANCES_MAX = 10;

export interface RappelDeps {
  now: () => number;
  show: (spec: NotificationAjout) => void | Promise<void>;
  close: (tag: string) => void | Promise<void>;
  setTimer: (fn: () => void, ms: number) => unknown;
  clearTimer: (handle: unknown) => void;
}
interface Suivi {
  alerte: AlerteAjout;
  timer?: unknown;
  relances: number;
}

/**
 * Tient la sonnerie d'un ajout : pose la notification à l'heure, la relance chaque minute (le texte dit le
 * vrai retard), tient le report d'1 min (« +1 min » ou « Dans 1 min ») et s'arrête dès que l'ajout est coché.
 * Aucune horloge ni notification en dur : `RappelDeps` les apporte, donc un test les pilote.
 */
export function creerRappelAjout(deps: RappelDeps) {
  const suivis = new Map<string, Suivi>();
  const planifier = (tag: string, ms: number) => {
    const s = suivis.get(tag);
    if (!s) return;
    if (s.timer != null) deps.clearTimer(s.timer);
    s.timer = deps.setTimer(() => {
      const cur = suivis.get(tag);
      if (!cur) return;
      cur.timer = undefined;
      void deps.show(contenuAlerte(cur.alerte, deps.now()));
      cur.relances += 1;
      if (cur.relances < RELANCES_MAX) planifier(tag, RELANCE_MS);
    }, Math.max(0, ms));
  };
  return {
    /** Lance (ou relance, si l'ajout a changé de dose ou d'heure) le suivi d'un ajout. Sans heure ni id : rien. */
    start(alerte: AlerteAjout) {
      if (!Number.isFinite(alerte.dueAt) || !alerte.additionIds.length) return null;
      const tag = tagAjout(alerte.additionIds);
      const ancien = suivis.get(tag);
      if (ancien?.timer != null) deps.clearTimer(ancien.timer);
      suivis.set(tag, { alerte, relances: 0 });
      planifier(tag, alerte.dueAt - deps.now());
      return tag;
    },
    /** L'ajout est coché : on coupe la suite et on retire la notification. */
    done(tag: string) {
      const s = suivis.get(tag);
      if (!s) return;
      if (s.timer != null) deps.clearTimer(s.timer);
      suivis.delete(tag);
      void deps.close(tag);
    },
    /** « +1 min » : la notification disparaît, la suivante revient dans `minutes` min, à partir du toucher. */
    snooze(tag: string, minutes = 1) {
      const s = suivis.get(tag);
      if (!s || !Number.isFinite(minutes) || minutes <= 0) return;
      void deps.close(tag);
      s.relances = 0;
      planifier(tag, minutes * 60_000);
    },
    stop() {
      for (const s of suivis.values()) if (s.timer != null) deps.clearTimer(s.timer);
      suivis.clear();
    },
    tags: () => [...suivis.keys()]
  };
}

// --- Notification posée par la page (service worker déjà enregistré) -----------

async function registrationAlertes(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return null;
  // `ready` ne se résout jamais sans service worker : on ne l'attend pas.
  const reg = await navigator.serviceWorker.getRegistration();
  return reg?.active?.scriptURL.endsWith('/brew-alerts-sw.js') ? reg : null;
}
/** `false` quand la page ne peut pas poser la notification (permission, service worker absent) : le son reste. */
export async function afficherNotificationAjout(spec: NotificationAjout): Promise<boolean> {
  const reg = await registrationAlertes();
  if (!reg) return false;
  await reg.showNotification(spec.title, spec.options as NotificationOptions);
  return true;
}
export async function fermerNotificationAjout(tag: string): Promise<void> {
  const reg = await registrationAlertes();
  if (!reg) return;
  for (const n of await reg.getNotifications({ tag })) n.close();
}
/** Le rappel branché sur la vraie horloge et le vrai service worker. */
export const creerRappelNavigateur = () =>
  creerRappelAjout({
    now: () => Date.now(),
    show: (spec) => afficherNotificationAjout(spec).then(() => undefined, () => undefined),
    close: (tag) => fermerNotificationAjout(tag).catch(() => undefined),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (h) => clearTimeout(h as ReturnType<typeof setTimeout>)
  });

// --- Ce que le service worker dit à la page ----------------------------------

/** « Ajouté » touché dans la notification : `at` est l'heure du toucher, pas celle de l'ouverture de la page. */
export interface ActionAjoute {
  kind: 'ajoute';
  batchId: string;
  additionIds: string[];
  at: number;
  /** Clé dans la file IndexedDB, à acquitter après coup (`acquitterFileActions`). */
  key?: number;
}
export interface ActionReport {
  kind: 'report';
  batchId: string;
  tag: string;
  minutes: number;
  at: number;
}
export type ActionNotification = ActionAjoute | ActionReport;

const heureValide = (at: unknown, now: number): number | null =>
  typeof at === 'number' && Number.isFinite(at) && at > 0 && at <= now + 60_000 ? at : null;

/** Valide un message du service worker : inconnu ou mal formé → `null`, la page ne coche rien. */
export function lireMessageSW(data: unknown, now = Date.now()): ActionNotification | null {
  if (!data || typeof data !== 'object') return null;
  const m = data as Record<string, unknown>;
  if (typeof m.batchId !== 'string' || !m.batchId) return null;
  const at = heureValide(m.at, now);
  if (at == null) return null;
  if (m.kind === 'brew-ajoute') {
    const ids = idsAjoutDepuis(m.additionIds);
    if (!ids.length) return null;
    return { kind: 'ajoute', batchId: m.batchId, additionIds: ids, at, key: typeof m.key === 'number' ? m.key : undefined };
  }
  if (m.kind === 'brew-report') {
    if (typeof m.tag !== 'string' || !m.tag) return null;
    const minutes = typeof m.minutes === 'number' && m.minutes > 0 && m.minutes <= 10 ? m.minutes : 1;
    return { kind: 'report', batchId: m.batchId, tag: m.tag, minutes, at };
  }
  return null;
}

/** S'abonne aux messages du service worker ; renvoie la fonction qui se désabonne. */
export function ecouterActionsNotification(onAction: (a: ActionNotification) => void): () => void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return () => undefined;
  const h = (e: MessageEvent) => {
    const a = lireMessageSW(e.data);
    if (a) onAction(a);
  };
  navigator.serviceWorker.addEventListener('message', h);
  return () => navigator.serviceWorker.removeEventListener('message', h);
}

/**
 * `?brewday=<lot>&ajoute=hop-0,hop-1&a=<ms du toucher>` : appli ouverte par « Ajouté » depuis la notification.
 * `at` vaut `null` si l'heure manque ou est fausse (futur) : la page prend alors l'heure de l'ouverture, dite.
 */
export function lireActionUrl(
  search: string,
  now = Date.now()
): { batchId: string; additionIds: string[]; at: number | null } | null {
  const q = new URLSearchParams(search);
  const batchId = q.get('brewday');
  const brut = q.get('ajoute');
  if (!batchId || !brut) return null;
  const ids = idsAjoutDepuis(brut.split(','));
  if (!ids.length) return null;
  const a = q.get('a');
  return { batchId, additionIds: ids, at: a && /^\d{10,14}$/.test(a) ? heureValide(Number(a), now) : null };
}
/** La même adresse sans `ajoute` ni `a`, pour qu'un rechargement ne recoche rien. */
export function adresseSansAction(search: string): string {
  const q = new URLSearchParams(search);
  q.delete('ajoute');
  q.delete('a');
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** Les ajouts d'un message ou d'une adresse qu'il reste à cocher : un déjà coché garde son heure. */
export function idsAcocher(ids: string[], additions: Record<string, { doneAt?: number | null } | undefined> | undefined): string[] {
  return ids.filter((id) => additions?.[id]?.doneAt == null);
}

// --- File IndexedDB : les touchers reçus sans page ---------------------------

export const FILE_DB = 'brew-alerts';
export const FILE_STORE = 'actions';
const FILE_MAX_MS = 48 * 3600_000;
export interface ActionEnFile {
  key: number;
  batchId: string;
  additionIds: string[];
  at: number;
}

function ouvrirFile(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    try {
      const open = indexedDB.open(FILE_DB, 1);
      open.onupgradeneeded = () => open.result.createObjectStore(FILE_STORE, { autoIncrement: true });
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Les « Ajouté » touchés pendant que la page était fermée, avec l'heure du toucher. Les valides restent jusqu'à `acquitterFileActions`. */
export async function lireFileActions(now = Date.now()): Promise<ActionEnFile[]> {
  const db = await ouvrirFile();
  if (!db) return [];
  return new Promise((resolve) => {
    const out: ActionEnFile[] = [];
    const tx = db.transaction(FILE_STORE, 'readwrite');
    const req = tx.objectStore(FILE_STORE).openCursor();
    req.onsuccess = () => {
      const cur = req.result;
      if (!cur) return;
      const v = cur.value as Record<string, unknown>;
      const ids = idsAjoutDepuis(v.additionIds);
      const at = heureValide(v.at, now);
      if (v.kind === 'ajoute' && typeof v.batchId === 'string' && ids.length && at != null && now - at <= FILE_MAX_MS)
        out.push({ key: Number(cur.key), batchId: v.batchId, additionIds: ids, at });
      else cur.delete(); // mal formé ou vieux de plus de 48 h : jamais appliqué, retiré
      cur.continue();
    };
    tx.oncomplete = () => {
      db.close();
      resolve(out);
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      resolve([]);
    };
  });
}
/** Retire de la file les touchers que la page a appliqués (ou périmés : 48 h). */
export async function acquitterFileActions(keys: number[]): Promise<void> {
  const db = await ouvrirFile();
  if (!db || !keys.length) return db?.close();
  await new Promise<void>((resolve) => {
    const tx = db.transaction(FILE_STORE, 'readwrite');
    const store = tx.objectStore(FILE_STORE);
    for (const k of keys) store.delete(k);
    tx.oncomplete = tx.onerror = tx.onabort = () => {
      db.close();
      resolve();
    };
  });
}
