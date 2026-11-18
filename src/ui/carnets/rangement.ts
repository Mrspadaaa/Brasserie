/**
 * Carnet d'idées (lot B) : le déroulé d'un envoi (MISSION.md, § IA, « Déroulé d'un envoi » ; B5).
 *  1. `taper` : aperçu local pendant la frappe (« ↓ va atterrir ici »), sans aucun appel ;
 *  2. `envoyer` : un geste ;
 *  3. le message est enregistré tout de suite, avec ses effets locaux (`ecrireLocal`) ;
 *  4. l'IA tourne (`en-cours`, « ✻ … ») ; `annuler` (✕) coupe l'attente et n'écrit rien de plus ;
 *  5. le garde (`lireReponse`) valide la réponse ;
 *  6. les effets locaux sont remplacés par ceux de l'IA, en une écriture annulable (`ecrireIA`).
 * Panne, délai dépassé, réponse illisible : `echec`, les effets locaux restent, le message est gardé, un avis bref le dit.
 * Hors ligne : `hors-ligne`, rangé sur l'appareil ; rien ne bouge plus tard dans son dos (aucun rerangement au retour du réseau).
 *
 * Ce module ne connaît ni le magasin ni le modèle du lot A : `CarnetsVue.tsx` (lot D) lui passe l'analyse locale et les deux
 * écritures. L'IA réelle ne part que si `mode === 'production'` ; au banc, la simulation ; en `eteint`, rien.
 */
import { AiClient } from '../../services/aiClient';
import type { ComportementSimule, ModeCarnetIA } from '../../config/carnetIA';
import { contexteModele, liensDuTexte, lireReponse, type CarnetPourIA, type LigneCarnet, type PageLue } from '../../domain/carnets/ia';
import { pageSimulee, reponseSimulee } from '../../domain/carnets/iaSimulee';
import type { ContexteRangerCarnet } from '../../../functions/src/carnetIA';
import { jetons, objetDe, parleDuBrassin, TITRE_BRASSIN } from '../../domain/carnets/analyseLocale';

export type EtatRangement<L = unknown> =
  | { etape: 'repos' }
  | { etape: 'apercu'; texte: string; lignes: L[] }
  | { etape: 'en-cours'; messageId: string; texte: string; lecture?: { url: string; statut?: PageLue['statut'] } }
  | { etape: 'range'; messageId: string; texte: string; rangement: 'ia' | 'simulee' | 'locale'; lignes: LigneCarnet[] | null }
  | { etape: 'echec'; messageId: string; texte: string; avis: string }
  | { etape: 'hors-ligne'; messageId: string; texte: string; avis: string }
  | { etape: 'annule'; messageId: string; texte: string };

/** Les deux appels au serveur, injectables (tests, banc). Ils ne lèvent pas : `{ ok: false }` en cas de panne. */
export interface AppelsIA {
  ranger(contexte: ContexteRangerCarnet, signal: AbortSignal): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  lire(url: string, signal: AbortSignal): Promise<PageLue>;
}

export const AVIS = {
  panne: "L'IA n'a pas répondu : rangé sur l'appareil, votre message est gardé.",
  illisible: "Réponse de l'IA illisible : rangé sur l'appareil, votre message est gardé.",
  delai: "L'IA a mis trop de temps : rangé sur l'appareil, votre message est gardé.",
  horsLigne: "Hors ligne : rangé sur l'appareil, tel quel."
} as const;

const attendre = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal.aborted) { reject(signal.reason); return; }
  const t = setTimeout(resolve, ms);
  signal.addEventListener('abort', () => { clearTimeout(t); reject(signal.reason); }, { once: true });
});

/** Appels du banc : la réponse simulée (« exemple »), 600 ms, 4 s en `lent`, en panne en `echec`. Aucun réseau. */
export function appelsSimules(comportement: ComportementSimule = 'normal', delaiMs = comportement === 'lent' ? 4000 : 600): AppelsIA {
  return {
    async ranger(contexte, signal) {
      await attendre(delaiMs, signal);
      if (comportement === 'echec') return { ok: false, error: 'panne simulée' };
      return { ok: true, data: reponseSimulee(contexte) };
    },
    async lire(url, signal) {
      await attendre(Math.min(delaiMs, 400), signal);
      return pageSimulee(url, Date.now());
    }
  };
}

/** Appels réels, par la passerelle `aiTask` (jamais en `npm test` : le mode n'y vaut jamais `production`). */
export const appelsReels: AppelsIA = {
  async ranger(contexte) {
    const r = await AiClient.run({ task: 'rangerCarnet', tier: 'fast', context: contexte });
    return { ok: r.ok, data: r.data, error: r.error };
  },
  async lire(url) {
    const r = await AiClient.run<PageLue>({ task: 'lireLien', context: { url } });
    if (r.ok && r.data && typeof r.data === 'object' && typeof r.data.statut === 'string') return r.data;
    let domaine = '';
    try { domaine = new URL(url).hostname.replace(/^www\./, ''); } catch { /* adresse illisible */ }
    return { url, domaine, statut: 'indisponible', luLe: Date.now() };
  }
};

/**
 * Ce que le retour « après » doit dire (P1, P2) : il suit le rangement final du message (ses effets), jamais l'écriture locale que l'IA
 * a remplacée. `cree` : un seul carnet touché, né de ce message (R11, g5:v04-4) ; `range` : tout dans le carnet ouvert (R14, g5:v03-8) ;
 * `ailleurs` : tout dans un seul carnet existant, autre que l'ouvert (G21, g5:v06-14, état 20) ; `vrac` : plusieurs carnets, ou une note de
 * plusieurs lignes écrite depuis la liste (R19, g5:v01-16). Aucun effet : `null` (rien à annoncer).
 */
export type RetourRangement =
  | { sorte: 'cree'; carnetId: string }
  | { sorte: 'range'; carnetId: string }
  | { sorte: 'ailleurs'; carnetId: string }
  | { sorte: 'vrac'; lignes: number; carnets: number };

export function retourDuRangement(
  effets: readonly { carnetId: string; cible: string }[],
  options: { depuis: string | null; plusieursLignes?: boolean }
): RetourRangement | null {
  if (!effets.length) return null;
  const carnets = [...new Set(effets.map(e => e.carnetId))];
  const lignes = Math.max(effets.filter(e => e.cible !== 'carnet').length, 1);
  if (carnets.length > 1 || (!options.depuis && options.plusieursLignes && lignes > 1)) return { sorte: 'vrac', lignes, carnets: carnets.length };
  const id = carnets[0];
  if (options.depuis === id) return { sorte: 'range', carnetId: id };
  if (effets.some(e => e.cible === 'carnet' && e.carnetId === id)) return { sorte: 'cree', carnetId: id };
  return { sorte: 'ailleurs', carnetId: id };
}

/**
 * Note en vrac écrite depuis la liste (R18, R19 ; g5:v01-15, g5:v02-19, g5:v01-16) : la découpe ANNONCÉE pendant la frappe, que l'envoi
 * applique telle quelle (« ce que le cadre pendant annonce est ce qui arrive après »). Une ligne qui a un carnet proche y va ; les lignes
 * sans carnet proche vont ensemble dans UN carnet neuf (G23, g5:v02-19 : « Prochain brassin · aucun carnet proche »), titré par la
 * première d'entre elles. `carnets` : le nombre de carnets distincts touchés, carnet neuf compris — le même pendant et après.
 */
/** La sorte d'une ligne de note en vrac, dans les mots de ses notes (R35, R36) : achat, travail, conseil, question, note. */
export type SorteVrac = 'achat' | 'travail' | 'conseil' | 'question' | 'note';

/** La sorte d'une ligne : un article ou un achat → achat ; à faire → travail ; conseil ; question ; sinon note. */
export function sorteVrac(l: { sorte?: string; genre?: string }): SorteVrac {
  if (l.sorte === 'article' || l.genre === 'a-acheter') return 'achat';
  if (l.genre === 'a-faire') return 'travail';
  if (l.genre === 'conseil' || l.genre === 'question') return l.genre;
  return 'note';
}

/** « 3 lignes · 2 carnets » (R18, R19 : le même décompte pendant et après). */
export const texteDecompte = (lignes: number, carnets: number): string =>
  `${lignes} ligne${lignes > 1 ? 's' : ''} · ${carnets} carnet${carnets > 1 ? 's' : ''}`;

export interface LignePlanVrac<T> {
  ligne: T;
  /** Le carnet existant (par `rattacher`) ; absent : un carnet neuf (`neufIndex`). */
  carnetId?: string;
  /** Le titre du carnet visé (existant, ou celui du carnet neuf). */
  titre: string;
  neuf: boolean;
  /** L'indice du carnet neuf dans `PlanVrac.neufs` (lignes sans carnet proche). */
  neufIndex?: number;
  /** Achat, travail, conseil, question ou note (R35, R36). */
  sorte: SorteVrac;
}

export interface PlanVrac<T> {
  lignes: Array<LignePlanVrac<T>>;
  /** Les titres des carnets neufs, un par objet (critique 6, n° 1) ; vide si toutes les lignes ont un carnet. */
  neufs: string[];
  /** Le titre du premier carnet neuf ; `null` si toutes les lignes ont un carnet. */
  titreNeuf: string | null;
  carnets: number;
  /** « 3 lignes · 2 carnets ». */
  decompte: string;
}

/**
 * Critique 5, n° 7 et 30 ; critique 6, n° 1 (R18, R19 ; D-122, D-139, D-140 ; g5:v01-15, v02-19, v01-16) : chaque ligne avec sa sorte et son
 * carnet. Une ligne qui a un carnet proche (`proche`, fuse.js) y va. Les autres ouvrent un carnet neuf titré par l'OBJET de leur ligne
 * (`objetDe` : « Sol local », jamais la note entière) ; deux lignes du même objet (un mot en commun dans l'objet) partagent le leur, et les
 * lignes du brassin (ingrédient, jour de brassage) vont ensemble dans « Prochain brassin » (G23). Le décompte compte chaque carnet une fois.
 * `prefixe` : la marque des données de test (« ZZ TEST — »), posée sur les titres neufs quand le message la porte (L05).
 */
export function planVrac<T extends { texte: string; sorte?: string; genre?: string }>(
  lignes: readonly T[],
  proche: (texte: string) => { carnetId: string; titre: string } | null,
  prefixe = ''
): PlanVrac<T> {
  const neufs: { titre: string; mots: Set<string>; brassin: boolean }[] = [];
  const groupe = (texte: string): number => {
    const brassin = parleDuBrassin(texte);
    const objet = brassin ? TITRE_BRASSIN : objetDe(texte);
    const mots = new Set(jetons(objet));
    const i = neufs.findIndex(n => (brassin ? n.brassin : !n.brassin && [...mots].some(m => n.mots.has(m))));
    if (i >= 0) return i;
    neufs.push({ titre: `${prefixe}${objet}`, mots, brassin });
    return neufs.length - 1;
  };
  const sortie = lignes.map((ligne): LignePlanVrac<T> => {
    const sorte = sorteVrac(ligne);
    const p = proche(ligne.texte);
    if (p) return { ligne, carnetId: p.carnetId, titre: p.titre, neuf: false, sorte };
    const neufIndex = groupe(ligne.texte);
    return { ligne, titre: neufs[neufIndex].titre, neuf: true, neufIndex, sorte };
  });
  const carnets = new Set(sortie.map(l => l.carnetId ?? `\u0000neuf${l.neufIndex}`)).size;
  return { lignes: sortie, neufs: neufs.map(n => n.titre), titreNeuf: neufs[0]?.titre ?? null, carnets, decompte: texteDecompte(sortie.length, carnets) };
}

/**
 * Pour chaque ligne rendue par l'IA, l'indice de la ligne annoncée dont elle prend la destination. Même nombre de lignes : une à une,
 * dans l'ordre. Sinon : la ligne annoncée qui partage le plus de mots (jetons de l'analyse locale) ; sans mot commun, la ligne à la même
 * place relative. L'IA met en forme et trie ; elle ne range jamais ailleurs que là où le cadre l'a annoncé.
 */
export function versLignesAnnoncees(textesIA: readonly string[], annoncees: readonly string[]): number[] {
  const n = annoncees.length;
  if (!n) return textesIA.map(() => -1);
  if (textesIA.length === n) return textesIA.map((_, i) => i);
  const jeux = annoncees.map(t => new Set(jetons(t)));
  return textesIA.map((t, i) => {
    const js = new Set(jetons(t));
    let best = -1, score = 0;
    jeux.forEach((j, k) => { const s = [...js].filter(m => j.has(m)).length; if (s > score) { score = s; best = k; } });
    return best >= 0 ? best : Math.min(n - 1, Math.floor((i * n) / Math.max(1, textesIA.length)));
  });
}

export interface DependancesRangement<L> {
  mode: ModeCarnetIA;
  /** Le carnet ouvert, ou `null` depuis la liste. */
  depuis: string | null;
  carnets: () => readonly CarnetPourIA[];
  enLigne: () => boolean;
  /** Repli local et aperçu (`analyseLocale.ts`, lot A). */
  analyseLocale: (texte: string) => L[];
  /**
   * Enregistre le message (`carnetMessage.rangement: 'locale'`) et ses effets locaux ; rend l'id du message. `iaAttendue` : vrai si
   * l'IA va tourner (l'écran peut montrer « ✻ … ») ; faux en mode éteint ou hors ligne (rangement local définitif).
   */
  ecrireLocal: (texte: string, lignes: L[], options: { iaAttendue: boolean }) => Promise<{ messageId: string }> | { messageId: string };
  /** Remplace les effets locaux du message par ceux de l'IA, en une écriture annulable. */
  ecrireIA: (messageId: string, lignes: LigneCarnet[], rangement: 'ia' | 'simulee') => Promise<void> | void;
  surEtat?: (etat: EtatRangement<L>) => void;
  /** Par défaut : simulés en `simule`, réels en `production`. */
  appels?: AppelsIA;
  /** Délai côté client, au-delà duquel l'envoi passe en échec (par défaut 45 s). */
  delaiMs?: number;
  maintenant?: () => Date;
}

export interface Rangement<L> {
  etat(): EtatRangement<L>;
  taper(texte: string): EtatRangement<L>;
  envoyer(texte: string): Promise<EtatRangement<L>>;
  /** Critique 6, n° 24 : un message gardé hors ligne, mis en forme par l'IA au retour du réseau, sur son toucher (« Ranger maintenant »). */
  reprendre(messageId: string, texte: string): Promise<EtatRangement<L>>;
  /** ✕ pendant `en-cours` : coupe l'attente ; rien de plus n'est écrit. Sans effet à un autre moment. */
  annuler(): void;
}

export function creerRangement<L>(deps: DependancesRangement<L>): Rangement<L> {
  let etat: EtatRangement<L> = { etape: 'repos' };
  let controleur: AbortController | null = null;
  /** Un envoi à la fois : posé avant la première écriture, pour qu'un double toucher n'écrive pas deux messages. */
  let occupe = false;
  const poser = (e: EtatRangement<L>) => { etat = e; deps.surEtat?.(e); return e; };
  const appels = deps.appels ?? (deps.mode === 'production' ? appelsReels : appelsSimules());

  async function envoyer(brut: string): Promise<EtatRangement<L>> {
    const texte = brut.trim();
    if (!texte || occupe) return etat;
    occupe = true;
    try { return await derouler(texte); } finally { occupe = false; }
  }

  async function derouler(texte: string): Promise<EtatRangement<L>> {
    const local = deps.analyseLocale(texte);
    /* Les carnets tels qu'ils étaient AVANT ce message : l'écriture locale peut créer un carnet que le rangement de l'IA remplace ; l'IA ne doit pas le voir (sinon elle y range, et il disparaît : « Ce carnet n'existe plus »). */
    const carnets = deps.carnets();
    const horsLigne = !deps.enLigne();
    const { messageId } = await deps.ecrireLocal(texte, local, { iaAttendue: deps.mode !== 'eteint' && !horsLigne });
    if (deps.mode === 'eteint') return poser({ etape: 'range', messageId, texte, rangement: 'locale', lignes: null });
    if (horsLigne) return poser({ etape: 'hors-ligne', messageId, texte, avis: AVIS.horsLigne });
    return passerIA(messageId, texte, carnets);
  }

  /** Critique 6, n° 24 (D-113, D-142) : « Ranger maintenant », au retour du réseau, d'un toucher : l'IA met en forme un message déjà gardé. */
  async function reprendre(messageId: string, brut: string): Promise<EtatRangement<L>> {
    const texte = brut.trim();
    if (!texte || occupe || deps.mode === 'eteint' || !deps.enLigne()) return etat;
    occupe = true;
    try { return await passerIA(messageId, texte, deps.carnets()); } finally { occupe = false; }
  }

  async function passerIA(messageId: string, texte: string, carnets: readonly CarnetPourIA[]): Promise<EtatRangement<L>> {
    const ctrl = new AbortController();
    controleur = ctrl;
    const delai = setTimeout(() => ctrl.abort(new DOMException('délai', 'TimeoutError')), deps.delaiMs ?? 45_000);
    const coupe = () => ctrl.signal.aborted;
    const fin = (e: EtatRangement<L>) => { clearTimeout(delai); if (controleur === ctrl) controleur = null; return poser(e); };
    const sortieCoupee = () => (ctrl.signal.reason as { name?: string } | undefined)?.name === 'TimeoutError'
      ? fin({ etape: 'echec', messageId, texte, avis: AVIS.delai })
      : fin({ etape: 'annule', messageId, texte });
    // Une promesse qui s'arrête au ✕ ou au délai, même si l'appel sous-jacent (AiClient) ne sait pas s'interrompre.
    const course = <T>(p: Promise<T>) => new Promise<T>((resolve, reject) => {
      if (coupe()) { reject(ctrl.signal.reason); return; }
      ctrl.signal.addEventListener('abort', () => reject(ctrl.signal.reason), { once: true });
      p.then(resolve, reject);
    });

    poser({ etape: 'en-cours', messageId, texte });
    try {
      /* Les pages (3 au plus) sont lues ensemble, pas l'une après l'autre (d1280-18) : la lecture dure celle de la plus lente. Le cadre
         montre le premier lien. */
      const urls = liensDuTexte(texte).slice(0, 3);
      let pages: PageLue[] = [];
      if (urls.length) {
        poser({ etape: 'en-cours', messageId, texte, lecture: { url: urls[0] } });
        pages = await course(Promise.all(urls.map(url => appels.lire(url, ctrl.signal))));
        poser({ etape: 'en-cours', messageId, texte, lecture: { url: urls[0], statut: pages[0].statut } });
      }
      const contexte = contexteModele(texte, deps.maintenant?.() ?? new Date(), deps.depuis, carnets, pages);
      const r = await course(appels.ranger(contexte, ctrl.signal));
      if (coupe()) return sortieCoupee();
      if (!r.ok) return fin({ etape: 'echec', messageId, texte, avis: AVIS.panne });
      const lignes = lireReponse(r.data, { texte, carnets, depuis: deps.depuis, pages, origine: deps.mode === 'simule' ? 'exemple' : 'ia' });
      if (!lignes) return fin({ etape: 'echec', messageId, texte, avis: AVIS.illisible });
      if (coupe()) return sortieCoupee();
      const rangement = deps.mode === 'simule' ? 'simulee' : 'ia';
      await deps.ecrireIA(messageId, lignes, rangement);
      return fin({ etape: 'range', messageId, texte, rangement, lignes });
    } catch {
      if (coupe()) return sortieCoupee();
      return fin({ etape: 'echec', messageId, texte, avis: AVIS.panne });
    }
  }

  return {
    etat: () => etat,
    taper(texte) {
      if (etat.etape === 'en-cours') return etat;
      return poser(texte.trim() ? { etape: 'apercu', texte, lignes: deps.analyseLocale(texte) } : { etape: 'repos' });
    },
    envoyer,
    reprendre,
    annuler() { controleur?.abort(new DOMException('annulé', 'AbortError')); }
  };
}
