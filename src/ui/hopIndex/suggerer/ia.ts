// L'IA dans Suggérer (voie ia3, sa base choisie : « M1 + M2 · avec l'IA semble le mieux », page m6 du 26.10 ; accord D80/D100 :
// Flash-Lite, environ 0,003 CHF par appel). Même callable que Substituer (`hopReclasserIA`), mode « suggerer », invite `suggerer-v1`.
// Le moteur range et montre tout de suite ; l'IA ne fait que reclasser les 30 premiers du moteur d'un moment (le pool) et dire une phrase
// par houblon. Elle ne donne aucun score : les effets, les barres, les doses et le stock restent ceux du moteur.
//
// Règles (celles de i2) :
//  - l'appel part au repos, une fois l'écran peint, en ligne seulement, pour chaque moment dont le groupe a de quoi départager (le moteur
//    ne sépare pas ses rangées : 4 ou plus au même effet) ; hors ligne, ou si l'appel échoue : l'ordre du moteur, rien au premier plan ;
//  - réponse en moins de 3 s ET liste pas encore touchée : l'ordre de l'IA remplace les rangées, une seule fois ; la puce « classé par l'IA »
//    apparaît, un toucher dessus rend l'ordre du moteur ;
//  - réponse plus tardive, ou après un toucher : rien ne bouge ; la puce dit « appliquer l'ordre IA » ;
//  - une réponse invalide (hors liste, doublon, incomplète) est ignorée : jamais un ordre inventé.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ficheDeCatalogue, type EntreeSuggerer, type MomentSuggerer } from '../../../../functions/src/hopReclassCore';
import type { Voie } from '../../../domain/hopIndex/v4';
import { hopRef } from '../parcours/v4';
import { houblon, style } from '../parcours/adaptateur';
import { quandDe } from '../parcours/quand';
import type { Quand, RecetteParcours } from '../parcours/types';
import { COURT } from './commun';
import type { Objectif } from './voies';

/** Au-delà, la liste a déjà été lue : l'ordre de l'IA attend un toucher sur la puce. */
export const FENETRE_MS = 3000;
/** Le pool : les 30 premiers du moteur au moment (voir functions/src/hopReclassCore.ts, `TAILLE_POOL_SUGGERER`). */
export const TAILLE_POOL = 30;
const MIN_POOL = 10;
/** Un groupe « même effet » n'appelle l'IA que s'il a au moins trois rangées au même effet : le moteur ne les départage pas (deux ex æquo ne
 * valent pas un appel). Au plus deux moments par écran (les deux premiers groupes), pour borner le coût d'une ouverture (≈ 0,003 CHF l'appel). */
export const RANGEES_MINI = 3;
export const MOMENTS_MAX = 2;

export interface ReponseSuggerer { ok: boolean; ordre?: string[]; phrases?: Record<string, string>; model?: string; error?: string; promptVersion?: string }
export type TransportSuggerer = (demande: EntreeSuggerer) => Promise<ReponseSuggerer>;

/** L'appel réel : le callable, par la Cloud Function (jamais une clé dans le navigateur). Importé à la demande : hors ligne ou en test,
 * Firebase n'est même pas chargé. Le délai (10 s) est celui du serveur : 30 phrases à écrire. */
const transportFirebase: TransportSuggerer = async (demande) => {
  const [{ httpsCallable }, { functions }] = await Promise.all([import('firebase/functions'), import('../../../services/firebase')]);
  const r = await httpsCallable<EntreeSuggerer, ReponseSuggerer>(functions, 'hopReclasserIA', { timeout: 10000 })(demande);
  return r.data;
};
/** Sous Vitest, aucun transport par défaut : un écran monté dans un test n'appelle jamais le callable (ni Firebase, ni Gemini).
 * D126 : l'IA de Suggérer reste éteinte dans l'app tant que le banc à l'aveugle (ia4) ne l'a pas validée ; `VITE_IA_SUGGERER=on` l'allume
 * pour le banc et l'émulateur. */
const EN_SERVICE = import.meta.env.VITE_IA_SUGGERER === 'on';
const PAR_DEFAUT: TransportSuggerer | null = import.meta.env.MODE === 'test' || !EN_SERVICE ? null : transportFirebase;
let transport: TransportSuggerer | null = PAR_DEFAUT;
/** Pour les tests et le banc : un autre transport (null : celui par défaut). */
export function installerTransportSuggerer(t: TransportSuggerer | null): void { transport = t ?? PAR_DEFAUT; resultats.clear(); }
/** Il y a de quoi appeler : un transport existe et le navigateur est en ligne. Sinon l'écran ne calcule ni pool ni puce. */
export const iaPossible = (): boolean => transport !== null && !(typeof navigator !== 'undefined' && navigator.onLine === false);

// Une réponse par demande, gardée pour la séance : un double montage du mode strict, ou un retour à la même demande, ne refacture pas.
const resultats = new Map<string, Promise<ReponseSuggerer | null>>();

/** Le moment du moteur (MomentId) dit pour l'IA. null : un moment que l'IA ne sait pas dire (rien n'est inventé). */
export function momentIA(moment: string): MomentSuggerer | null {
  if (moment === 'wp') return { type: 'whirlpool' };
  if (moment === 'fwh') return { type: 'premierMout' };
  if (moment === 'dryActive') return { type: 'dryhop', phase: 'actif' };
  if (moment === 'dryPost') return { type: 'dryhop', phase: 'apres' };
  const m = /^b(\d+)$/.exec(moment);
  return m ? { type: 'ebullition', minutes: Number(m[1]) } : null;
}
const dit = (q: Quand): string => (q.type === 'premierMout' ? 'premier moût' : q.type === 'whirlpool' ? 'whirlpool' : q.type === 'ebullition' ? `${q.minutes}′` : q.phase === 'actif' ? 'dry hop actif' : 'dry hop après fermentation');

/** La demande au callable (mode « suggerer ») : le style, la recette en bref, la visée, le moment et les fiches courtes du pool. null : rien à
 * demander (moins de 10 candidats, ou une fiche manque : on n'envoie rien d'inventé). `ibu` : l'IBU de la recette (null : inconnu). */
export function demandeSuggerer(p: { recette: RecetteParcours; ibu: number | null; objectifs: readonly Objectif[]; moment: string; pool: readonly Voie[] }): EntreeSuggerer | null {
  const m = momentIA(p.moment);
  if (!m || !p.objectifs.length) return null;
  const candidats = p.pool.flatMap((v) => {
    const cle = v.actions[0].hopKey, c = hopRef(cle)?.catalogue;
    return c ? [{ id: cle, fiche: ficheDeCatalogue(c) }] : [];
  }).slice(0, TAILLE_POOL);
  if (candidats.length < MIN_POOL) return null;
  const sc = style(p.recette.styleCode);
  return {
    mode: 'suggerer',
    style: { code: sc.code, nom: sc.name },
    recette: {
      og: p.recette.og ?? null, ibu: p.ibu, volumeL: p.recette.volumeL ?? null,
      houblons: p.recette.additions.filter((a) => a.grams > 0).slice(0, 12).map((a) => ({ nom: houblon(a.hopKey).nom, grammes: a.grams, moment: dit(quandDe(a, p.recette)) })),
    },
    demande: {
      objectifs: p.objectifs.slice(0, 4).map((o) => ({ famille: COURT[o.f].toLowerCase(), sens: o.sens, crans: Math.max(1, Math.min(3, Math.round(Math.abs(o.requis) / o.cran))) })),
      moment: m,
    },
    candidats,
  };
}
export const cleDemande = (d: EntreeSuggerer): string => JSON.stringify([d.style.code, d.recette, d.demande, d.candidats.map((c) => c.id)]);

/** Un ordre est reçu s'il range TOUS les candidats de la demande, une fois chacun, tous de la demande. Une phrase peut manquer (retirée par le
 * serveur : valeur chiffrée absente du message) ; une phrase vide n'est jamais gardée. */
export function ordreValide(r: ReponseSuggerer | null | undefined, d: EntreeSuggerer): r is ReponseSuggerer & { ordre: string[]; phrases: Record<string, string> } {
  if (!r?.ok || !Array.isArray(r.ordre) || !r.phrases || r.ordre.length !== d.candidats.length) return false;
  const permis = new Set(d.candidats.map((c) => c.id));
  return new Set(r.ordre).size === d.candidats.length && r.ordre.every((k) => permis.has(k));
}

function demander(d: EntreeSuggerer): Promise<ReponseSuggerer | null> {
  const cle = cleDemande(d);
  let p = resultats.get(cle);
  if (!p) {
    p = Promise.resolve().then(() => (transport ? transport(d) : null)).then((r) => (ordreValide(r, d) ? r : null)).catch(() => null);
    // Un échec ne reste pas en mémoire : le prochain affichage réessaie.
    void p.then((r) => { if (!r && resultats.get(cle) === p) resultats.delete(cle); });
    resultats.set(cle, p);
  }
  return p;
}

export interface EtatIA {
  /** Les clés de houblon rangées par l'IA, dans son ordre. */
  ordre: readonly string[];
  phrases: Readonly<Record<string, string>>;
  /** L'ordre de l'IA est celui des rangées. */
  appliquee: boolean;
  /** Un toucher sur la puce : applique l'ordre de l'IA, ou rend celui du moteur. */
  basculer: () => void;
}
export interface DemandeMoment { moment: string; demande: EntreeSuggerer }
export interface ClassementsIA {
  /** Par moment du moteur : il y a un ordre de l'IA (la puce existe). */
  de: (moment: string) => EtatIA | null;
  /** Le brasseur a touché les listes : une réponse tardive ne les fera plus bouger. */
  marquerTouche: () => void;
}

/** Un appel par moment demandé, au repos ; hors ligne, `demandes` est vide. Une autre demande (une autre visée, une autre recette) repart de zéro. */
export function useClassementsIA(demandes: readonly DemandeMoment[]): ClassementsIA {
  const cles = demandes.map((x) => cleDemande(x.demande));
  const signature = cles.join('§');
  const [recus, setRecus] = useState<Record<string, ReponseSuggerer & { ordre: string[]; phrases: Record<string, string> }>>({});
  const [appliquees, setAppliquees] = useState<Record<string, boolean>>({});
  const touche = useRef(new Set<string>());
  const toutTouche = useRef(false);
  useEffect(() => {
    if (!demandes.length || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
    let vivant = true;
    for (const { demande } of demandes) {
      const cle = cleDemande(demande), debut = Date.now();
      void demander(demande).then((r) => {
        if (!vivant || !r) return;
        setRecus((x) => ({ ...x, [cle]: r as ReponseSuggerer & { ordre: string[]; phrases: Record<string, string> } }));
        // Une seule fois, et seulement si la réponse est vite là et que la liste n'a pas été touchée.
        if (Date.now() - debut < FENETRE_MS && !toutTouche.current && !touche.current.has(cle)) setAppliquees((x) => ({ ...x, [cle]: true }));
      });
    }
    return () => { vivant = false; };
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps
  const basculer = useCallback((cle: string) => setAppliquees((x) => ({ ...x, [cle]: !x[cle] })), []);
  const marquerTouche = useCallback(() => { toutTouche.current = true; }, []);
  return useMemo(() => ({
    de: (moment: string) => {
      const d = demandes.find((x) => x.moment === moment);
      if (!d) return null;
      const cle = cleDemande(d.demande), r = recus[cle];
      if (!r) return null;
      const appliquee = !!appliquees[cle];
      return { ordre: r.ordre, phrases: appliquee ? r.phrases : {}, appliquee, basculer: () => basculer(cle) };
    },
    marquerTouche,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [signature, recus, appliquees, basculer, marquerTouche]);
}
