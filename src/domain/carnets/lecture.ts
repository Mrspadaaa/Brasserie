/**
 * Les étapes de la lecture d'un lien, telles que l'écran les montre (IA-ETAPES-VISIBLES, CHOIX.md D448), et le suivi d'une lecture sur
 * l'appareil (réouverture). Aucun dessin ici : `LectureLien.tsx` lit ce que ce module calcule.
 *
 * Le serveur (`functions/src/lecturesLiens.ts`, `carnetIA.ts`) rend des étapes nommées `page`, `donnees`, `prix`, `devise-frais`, `photos`,
 * `caract`, `controle`, `ia`, `bloquee`, chacune trouvée, absente ou douteuse. L'écran en montre six (sept avec l'IA) : le prix et la
 * devise ne font qu'une ligne (« Prix, devise et frais », v05, v06) ; une page bloquée lue par Google reste la ligne « Page », dite
 * « page bloquée, lue par Google » (VOIE.md). Une étape que le serveur n'a pas dite n'est jamais inventée : elle est « à faire » pendant
 * la lecture, « absente » à la fin, « pas lancée » après un lien mort.
 */
import type { EtapeLien, PageLue } from '../../../functions/src/carnetIA';

export type CleEtape = 'page' | 'donnees' | 'prix' | 'photos' | 'caract' | 'controle' | 'ia' | 'rangement';
export type StatutVu = 'trouve' | 'douteux' | 'absent' | 'echec' | 'en-cours' | 'a-faire' | 'pas-lancee';
export interface LigneEtape { cle: CleEtape; libelle: string; statut: StatutVu; detail?: string; viaGoogle?: true }

export const LIBELLE_ETAPE: Record<CleEtape, string> = {
  page: 'Page', donnees: 'Données de la page', prix: 'Prix, devise et frais', photos: 'Photos', caract: 'Caractéristiques', controle: 'Contrôle', ia: 'Lecture IA', rangement: 'Rangement'
};
const ORDRE: readonly CleEtape[] = ['page', 'donnees', 'prix', 'photos', 'caract', 'controle'];

/** Libellé imposé (VOIE.md) pour la page que le site refuse au robot et que Google a lue. */
export const PAGE_BLOQUEE_GOOGLE = 'page bloquée, lue par Google';

/** Ce que dit une page non lue, dans ses mots (jamais le code du serveur). */
const PAGE_NON_LUE: Record<string, string> = {
  introuvable: 'adresse introuvable : le site n’existe plus',
  indisponible: 'le site n’a pas répondu',
  robots: 'le site refuse la lecture automatique',
  refusee: 'le site a refusé la page',
  illisible: 'page sans données lisibles',
  bloquee: 'le site bloque la lecture'
};

const PIRE: Record<EtapeLien['statut'], number> = { trouve: 0, absent: 1, douteux: 2 };

/**
 * Les lignes de l'écran, d'après les étapes reçues. `fini` : la lecture est close (plus d'étape « en cours ») ; `enCours` : la sous-tâche
 * lente que le serveur annonce (l'IA, ou Google pour une page bloquée) ; `escalade` : relue avec l'IA forte (la ligne IA le dit).
 */
export function lignesEtapes(etapes: readonly EtapeLien[] = [], o: { fini?: boolean; enCours?: 'ia' | 'bloquee'; escalade?: boolean; rangement?: boolean } = {}): LigneEtape[] {
  const de = new Map<string, EtapeLien>();
  for (const e of etapes) de.set(e.nom, e);
  const page = de.get('page');
  const google = de.get('bloquee');
  /* Lien mort, ou page que rien n'a lue : la lecture s'arrête à la page ; le reste n'est pas lancé (« rien n'est inventé », v03-5). */
  const pageMorte = !!page && page.statut === 'absent' && page.detail !== 'bloquee';
  const lignes: LigneEtape[] = [];
  for (const cle of ORDRE) {
    const libelle = LIBELLE_ETAPE[cle];
    if (cle === 'page') {
      if (!page) { lignes.push({ cle, libelle, statut: 'a-faire' }); continue; }
      if (page.detail === 'bloquee') {
        if (o.enCours === 'bloquee' && !google) { lignes.push({ cle, libelle, statut: 'en-cours', detail: `${PAGE_BLOQUEE_GOOGLE}…`, viaGoogle: true }); continue; }
        if (google) { lignes.push({ cle, libelle, statut: google.statut, detail: google.statut === 'absent' ? `page bloquée ; ${google.detail ?? 'Google n’a rien rendu'}` : PAGE_BLOQUEE_GOOGLE, viaGoogle: true }); continue; }
        lignes.push({ cle, libelle, statut: o.fini ? 'echec' : 'en-cours', detail: PAGE_NON_LUE.bloquee }); continue;
      }
      if (page.statut === 'absent') { lignes.push({ cle, libelle, statut: 'echec', detail: PAGE_NON_LUE[page.detail ?? ''] ?? page.detail ?? 'page non lue' }); continue; }
      lignes.push({ cle, libelle, statut: page.statut, ...(page.detail ? { detail: page.detail } : {}) });
      continue;
    }
    if (pageMorte) { lignes.push({ cle, libelle, statut: 'pas-lancee' }); continue; }
    const vues = cle === 'prix' ? [de.get('prix'), de.get('devise-frais')].filter((e): e is EtapeLien => !!e) : [de.get(cle)].filter((e): e is EtapeLien => !!e);
    if (!vues.length) { lignes.push({ cle, libelle, statut: 'a-faire' }); continue; }
    /* le prix lu fait la ligne ; un prix absent l'emporte sur une devise lue (rien à convertir) */
    const prix = cle === 'prix' ? de.get('prix') : undefined;
    const statut = prix?.statut === 'absent' ? 'absent' : vues.reduce<EtapeLien['statut']>((s, e) => (PIRE[e.statut] > PIRE[s] ? e.statut : s), 'trouve');
    const detail = vues.map(e => e.detail).filter(Boolean).join(' · ');
    lignes.push({ cle, libelle, statut, ...(detail ? { detail } : {}) });
  }
  const ia = de.get('ia');
  if (ia || o.enCours === 'ia' || o.escalade) {
    const fort = o.escalade && !ia?.detail?.includes('IA plus forte') ? 'IA plus forte' : '';
    lignes.push(ia
      ? { cle: 'ia', libelle: LIBELLE_ETAPE.ia, statut: ia.statut, ...(ia.detail || fort ? { detail: [fort, ia.detail].filter(Boolean).join(' · ') } : {}) }
      : { cle: 'ia', libelle: LIBELLE_ETAPE.ia, statut: pageMorte ? 'pas-lancee' : 'a-faire', ...(fort ? { detail: fort } : {}) });
  }
  /* la première étape pas encore dite est celle en cours ; l'IA annoncée par le serveur passe devant */
  /* une étape que le serveur a sautée (une page bloquée n'a pas de données schema.org) n'est pas lancée, jamais « absente » ni « en cours » */
  const dernier = lignes.reduce((k, l, i) => (l.cle !== 'ia' && l.statut !== 'a-faire' ? i : k), -1);
  for (let k = 0; k < dernier; k++) if (lignes[k].statut === 'a-faire') lignes[k] = { ...lignes[k], statut: 'pas-lancee' };
  if (!o.fini && !pageMorte) {
    const i = o.enCours === 'ia' ? lignes.findIndex(l => l.cle === 'ia') : lignes.findIndex((l, k) => k > dernier && l.statut === 'a-faire');
    if (i >= 0 && lignes[i].statut === 'a-faire') lignes[i] = { ...lignes[i], statut: 'en-cours' };
  }
  if (o.fini) return lignes.map(l => (l.statut === 'a-faire' || l.statut === 'en-cours' ? { ...l, statut: 'absent' as const } : l));
  /* T30-10 : la page est lue, l'IA range l'article dans le carnet (5 s et plus) : l'étape en cours se voit jusqu'au rangement, pas « 6 sur 6 » muet */
  if (o.rangement && !pageMorte) lignes.push({ cle: 'rangement', libelle: LIBELLE_ETAPE.rangement, statut: 'en-cours', detail: 'l’IA range l’article dans le carnet' });
  return lignes;
}

export interface CompteEtapes { trouves: number; douteux: number; absents: number; faites: number; total: number; arreteA?: number }
export function compterEtapes(lignes: readonly LigneEtape[]): CompteEtapes {
  /* C46-6 (D448) : le rangement (7e ligne pendant que l'IA range) n'est pas une étape de lecture : le total reste six pendant et après */
  const lues = lignes.filter(l => l.cle !== 'rangement');
  const n = (s: StatutVu[]) => lues.filter(l => s.includes(l.statut)).length;
  const echec = lues.findIndex(l => l.statut === 'echec');
  return { trouves: n(['trouve']), douteux: n(['douteux']), absents: n(['absent', 'echec']), faites: n(['trouve', 'douteux', 'absent', 'echec']), total: lues.length,
    ...(echec >= 0 ? { arreteA: echec + 1 } : {}) };
}

/** « 14 s », « 1 min 05 » : la durée d'une lecture. */
export function duree(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}`;
}

/* ───── Ce que rend la tâche `lireLien` : une page lue, ou l'état d'une lecture suivie (`VueLecture` du serveur) ───── */

const STATUTS_PAGE = new Set<PageLue['statut']>(['lue', 'illisible', 'robots', 'refusee', 'indisponible', 'bloquee', 'introuvable']);
export interface SuiviServeur { statut: 'en-cours' | 'fini' | 'echec' | 'inconnue'; etapes: EtapeLien[]; enCours?: 'ia' | 'bloquee'; page?: PageLue; erreur?: string }

/** Une réponse de `lireLien` : la page (directe, ou portée par un suivi fini), ou l'état du suivi ; rien de lisible : `null`. */
export function lireReponseLecture(d: unknown): { page: PageLue } | { suivi: SuiviServeur } | null {
  if (!d || typeof d !== 'object') return null;
  const x = d as Record<string, unknown>;
  if (typeof x.statut === 'string' && STATUTS_PAGE.has(x.statut as PageLue['statut']) && typeof x.luLe === 'number') return { page: d as PageLue };
  if (x.statut === 'en-cours' || x.statut === 'fini' || x.statut === 'echec' || x.statut === 'inconnue') {
    const page = x.page && typeof x.page === 'object' ? lireReponseLecture(x.page) : null;
    if (x.statut === 'fini' && page && 'page' in page) return page;
    return { suivi: { statut: x.statut, etapes: Array.isArray(x.etapes) ? (x.etapes as EtapeLien[]) : [], ...(x.enCours === 'ia' || x.enCours === 'bloquee' ? { enCours: x.enCours } : {}),
      ...(typeof x.erreur === 'string' ? { erreur: x.erreur } : {}) } };
  }
  return null;
}

/* ───── Le jeton et le suivi sur l'appareil ───── */

/** Un jeton tiré par l'app (22 caractères `[A-Za-z0-9_-]`, dans les 16 à 64 que le serveur accepte), connu avant la première réponse. */
export function nouveauJeton(): string {
  const b = new Uint8Array(16);
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.getRandomValues) c.getRandomValues(b);
  else for (let i = 0; i < b.length; i++) b[i] = Math.floor(Math.random() * 256);
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export const jetonValide = (j: unknown): j is string => typeof j === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(j);

/** Une lecture lancée et pas encore finie : gardée sur l'appareil, pour la retrouver à la réouverture de l'app. */
/** `carnetId` (T28-1) : le carnet où le lien a été collé (`null` : collé depuis la liste) ; l'article y revient à la réouverture, jamais ailleurs. */
export interface LectureGardee { jeton: string; url: string; messageId: string; texte: string; debut: number; escalade?: true; carnetId?: string | null }
export interface SuiviLectures { lister(): LectureGardee[]; garder(l: LectureGardee): void; retirer(jeton: string): void }

/** Au-delà d'un jour, une lecture gardée ne se reprend plus (le serveur l'a close depuis longtemps). */
const GARDE_MS = 24 * 3600_000;
export const CLE_SUIVI = 'affinee.carnets.lectures';

/** Le suivi dans `localStorage` (un stockage absent ou plein : rien n'est gardé, la lecture continue). */
export function suiviLocal(cle = CLE_SUIVI, maintenant: () => number = Date.now): SuiviLectures {
  const lire = (): LectureGardee[] => {
    try {
      const brut = JSON.parse(globalThis.localStorage?.getItem(cle) ?? '[]') as unknown;
      return Array.isArray(brut) ? brut.filter((l): l is LectureGardee => !!l && jetonValide((l as LectureGardee).jeton) && typeof (l as LectureGardee).url === 'string'
        && typeof (l as LectureGardee).messageId === 'string' && maintenant() - Number((l as LectureGardee).debut) < GARDE_MS) : [];
    } catch { return []; }
  };
  const ecrire = (l: LectureGardee[]) => { try { globalThis.localStorage?.setItem(cle, JSON.stringify(l)); } catch { /* rien de gardé */ } };
  return {
    lister: lire,
    garder: (l) => ecrire([...lire().filter(x => x.jeton !== l.jeton && x.messageId !== l.messageId), l]),
    retirer: (jeton) => { const l = lire(); if (l.some(x => x.jeton === jeton)) ecrire(l.filter(x => x.jeton !== jeton)); }
  };
}
