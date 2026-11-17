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
  horsLigne: "Hors ligne : rangé sur l'appareil. Rien ne bougera au retour du réseau."
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
      const pages: PageLue[] = [];
      for (const url of liensDuTexte(texte).slice(0, 3)) {
        poser({ etape: 'en-cours', messageId, texte, lecture: { url } });
        const page = await course(appels.lire(url, ctrl.signal));
        pages.push(page);
        poser({ etape: 'en-cours', messageId, texte, lecture: { url, statut: page.statut } });
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
    annuler() { controleur?.abort(new DOMException('annulé', 'AbortError')); }
  };
}
