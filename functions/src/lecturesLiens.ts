import { randomUUID } from 'node:crypto';
import type { EtapeLien, PageLue } from './carnetIA.js';
import type { AppelIA } from './lienIA.js';
import type { AppelPageBloquee } from './lienBloquee.js';
import { lienDe, lireLien, type OptionsLecture } from './lireLien.js';

/**
 * La tâche `lireLien` d'`aiTask`, avec ses étapes visibles au fil de l'eau (règle IA-ETAPES-VISIBLES, 23.11 : « c'est possible de fermer l'app »).
 *
 * Deux canaux, chacun avec son rôle :
 *  1. LE FLUX (`response.sendChunk`, le même que la facture, D308) : à chaque étape, `{ etape: 'lecture', jeton, etapes, enCours? }`. L'écran ouvert
 *     les affiche une à une. Sans flux (ancien client, appel sans SSE) : rien n'est envoyé, le final seul revient.
 *  2. LE DOCUMENT `lecturesLiens/{jeton}` (admin SDK, aucune règle Firestore : le client ne le lit jamais, il passe par la fonction) : même contenu,
 *     écrit à chaque étape, puis la page lue à la fin. La lecture continue côté serveur quand l'app se ferme (la requête reste ouverte) ; à la
 *     réouverture, l'app rappelle `{ task: 'lireLien', context: { jeton, reprise: true } }` et reçoit l'état, la page quand elle est finie.
 *
 * Le jeton vient de l'app (`context.jeton`, 16 à 64 caractères `[A-Za-z0-9_-]`) : elle le connaît avant la première réponse, donc même si elle se ferme
 * aussitôt. Sans jeton, le serveur en tire un et le dit dans le premier envoi du flux. Un jeton déjà utilisé par un autre compte n'est jamais repris.
 * Rappeler la lecture avec un jeton déjà fini rend la page gardée (aucun coût) ; avec un jeton en cours, l'état (jamais une seconde lecture).
 */

export type StatutLecture = 'en-cours' | 'fini' | 'echec';
export interface DocLecture {
  uid: string; url: string; statut: StatutLecture;
  etapes: EtapeLien[];
  /** La sous-tâche lente en cours (l'IA, ou la lecture d'une page bloquée par Google). */
  enCours?: 'ia' | 'bloquee';
  page?: PageLue; erreur?: string;
  creeLe: number; majLe: number;
}
export interface MagasinLecture {
  lire(jeton: string): Promise<DocLecture | undefined>;
  ecrire(jeton: string, doc: DocLecture): Promise<void>;
}

/** Au-delà de ce délai sans écriture (la fonction s'arrête à 300 s), une lecture « en cours » est tenue pour interrompue. */
export const LECTURE_PERIMEE_MS = 330_000;

export const jetonValide = (brut: unknown): string | undefined => typeof brut === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(brut) ? brut : undefined;

/** Ce que l'app reçoit en rappelant un jeton : l'état de la lecture, la page quand elle est finie. */
export interface VueLecture { statut: StatutLecture | 'inconnue'; jeton?: string; etapes: EtapeLien[]; enCours?: 'ia' | 'bloquee'; page?: PageLue; erreur?: string }

export function vueDe(jeton: string, d: DocLecture | undefined, uid: string, maintenant: number): VueLecture {
  if (!d || d.uid !== uid) return { statut: 'inconnue', etapes: [] };
  const peri = d.statut === 'en-cours' && maintenant - d.majLe > LECTURE_PERIMEE_MS;
  return {
    statut: peri ? 'echec' : d.statut, jeton, etapes: d.etapes,
    ...(!peri && d.enCours ? { enCours: d.enCours } : {}),
    ...(d.page ? { page: d.page } : {}),
    ...(peri ? { erreur: 'Lecture interrompue.' } : d.erreur ? { erreur: d.erreur } : {})
  };
}

/** Les étapes en cumul : une étape redite (même nom) remplace la précédente à sa place, une neuve s'ajoute. */
export function cumuler(etapes: EtapeLien[], e: EtapeLien): EtapeLien[] {
  const i = etapes.findIndex((x) => x.nom === e.nom);
  return i >= 0 ? etapes.map((x, k) => k === i ? e : x) : [...etapes, e];
}

export interface EntreeLecture {
  uid: string;
  context: unknown;
  magasin: MagasinLecture;
  /** Pas d'IA sans appel : une clé absente ou un test sans modèle. */
  appelIA?: AppelIA;
  /** La lecture d'une page bloquée par Google (`url_context`) ; absente : la page reste `bloquee`. */
  appelBloquee?: AppelPageBloquee;
  /** Le flux de la réponse (`response.sendChunk`) ; absent sans SSE. */
  envoyer?: (morceau: Record<string, unknown>) => unknown;
  lire?: (url: string, opts: OptionsLecture) => Promise<PageLue>;
  maintenant?: () => number;
  nouveauJeton?: () => string;
  /** Une panne d'écriture ne fait jamais échouer la lecture ; elle se dit ici (journal). */
  avertir?: (message: string, detail?: Record<string, unknown>) => void;
}
export interface SortieLecture { ok: true; data: PageLue | VueLecture; model: 'lecture'; tier: 'fast'; elapsedMs: number }

export async function lireLienTache(e: EntreeLecture): Promise<SortieLecture> {
  const now = e.maintenant ?? Date.now, debut = now();
  const sortie = (data: PageLue | VueLecture): SortieLecture => ({ ok: true, data, model: 'lecture', tier: 'fast', elapsedMs: now() - debut });
  const ctx = (e.context && typeof e.context === 'object' ? e.context : {}) as { jeton?: unknown; reprise?: unknown };
  const avertir = e.avertir ?? (() => undefined);
  let jeton = jetonValide(ctx.jeton);

  // Reprise : l'app rouverte demande où en est la lecture ; rien n'est lancé, rien n'est facturé.
  if (ctx.reprise === true) {
    if (!jeton) return sortie({ statut: 'inconnue', etapes: [] });
    const d = await e.magasin.lire(jeton).catch((err) => { avertir('Lecture du suivi impossible', { message: String(err?.message ?? err) }); return undefined; });
    return sortie(vueDe(jeton, d, e.uid, now()));
  }

  const url = lienDe(e.context);
  if (jeton) {
    const d = await e.magasin.lire(jeton).catch(() => undefined);
    if (d && d.uid !== e.uid) jeton = undefined;
    else if (d?.statut === 'fini' && d.page && d.url === url) return sortie(d.page);
    else if (d?.statut === 'en-cours' && now() - d.majLe <= LECTURE_PERIMEE_MS) return sortie(vueDe(jeton, d, e.uid, now()));
  }
  jeton ??= (e.nouveauJeton ?? randomUUID)();

  // Les écritures se suivent l'une derrière l'autre (l'ordre des étapes est celui de la lecture) ; une panne n'arrête rien.
  const creeLe = now();
  let doc: DocLecture = { uid: e.uid, url: url.slice(0, 2000), statut: 'en-cours', etapes: [], creeLe, majLe: creeLe };
  let file: Promise<void> = Promise.resolve();
  const ecrire = () => {
    const copie = doc;
    file = file.then(() => e.magasin.ecrire(jeton!, copie)).catch((err) => avertir('Écriture du suivi impossible', { message: String(err?.message ?? err) }));
  };
  const dire = () => {
    ecrire();
    try { void Promise.resolve(e.envoyer?.({ etape: 'lecture', jeton, etapes: doc.etapes, ...(doc.enCours ? { enCours: doc.enCours } : {}) })).catch(() => undefined); } catch { /* un flux coupé ne coupe pas la lecture */ }
  };
  dire();

  const opts: OptionsLecture = {
    ...(e.appelIA ? { ia: e.appelIA } : {}),
    ...(e.appelBloquee ? { pageBloquee: e.appelBloquee } : {}),
    onEtape: (etape) => {
      doc = { ...doc, etapes: cumuler(doc.etapes, etape), majLe: now() };
      if (etape.nom === 'ia' || etape.nom === 'bloquee') delete doc.enCours;
      dire();
    },
    onDebut: (nom) => { doc = { ...doc, enCours: nom, majLe: now() }; dire(); }
  };
  let page: PageLue;
  try {
    page = await (e.lire ?? lireLien)(url, opts);
  } catch (err: any) {
    doc = { ...doc, statut: 'echec', erreur: String(err?.message ?? 'Lecture impossible.').slice(0, 200), majLe: now() };
    delete doc.enCours;
    ecrire(); await file;
    return sortie({ statut: 'echec', jeton, etapes: doc.etapes, erreur: doc.erreur });
  }
  // La page rendue fait foi pour les étapes (elle porte aussi celles que la plateforme a corrigées) ; le document la garde en entier.
  doc = { ...doc, statut: 'fini', etapes: page.etapes ?? doc.etapes, page, majLe: now() };
  delete doc.enCours;
  ecrire(); await file;
  return sortie(page);
}

/** Le magasin réel : Firestore (admin SDK). Chargé à la demande, pour que les tests n'aient pas à l'initialiser. */
export async function magasinFirestore(): Promise<MagasinLecture> {
  const { getFirestore } = await import('firebase-admin/firestore');
  const ref = (j: string) => getFirestore().doc(`lecturesLiens/${j}`);
  return {
    lire: async (j) => (await ref(j).get()).data() as DocLecture | undefined,
    // Firestore refuse `undefined` : la page et les étapes ne sont gardées que par leurs champs écrits.
    ecrire: async (j, d) => { await ref(j).set(JSON.parse(JSON.stringify(d))); }
  };
}
