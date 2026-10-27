// L'IA dans Suggérer (voie ia3, sa base choisie : « M1 + M2 · avec l'IA semble le mieux », page m6 du 26.10). Même callable que Substituer
// (`hopReclasserIA`), mode « suggerer », invite `suggerer-v2` (ia4, D126 et D192). Voie ia5 (D132, 27.10) : modèle Gemini 3.8 Flash en réflexion
// basse (choisi par le serveur) et IA À LA DEMANDE : « Mettre 3.8 Flash et je peux l'activer à la demande ».
// Le moteur range et montre tout de suite ; l'IA ne reclasse que les EX ÆQUO du moteur : le groupe « même effet » d'un moment (ses rangées et
// leurs suivantes au même effet et à la même dose, jamais un houblon pris plus bas) et dit une phrase pour les premiers, d'après la fiche.
// Elle ne donne aucun score : les effets, les barres, les doses et le stock restent ceux du moteur.
//
// Règles :
//  - aucun appel à l'ouverture ni au repos : la puce « ✦ classer par l'IA » (groupe d'au moins 3 ex æquo, en ligne seulement) lance l'appel ;
//  - pendant l'attente, la puce garde sa taille et sa place et dit « ✦ l'IA classe… » ; un second toucher ne fait pas un second appel ;
//  - l'ordre arrive et s'applique ; la puce dit « classé par l'IA » ; un toucher rend l'ordre du moteur, un autre remet celui de l'IA sans
//    nouvel appel ;
//  - un échec (réseau, ok:false, ordre invalide : hors liste, doublon, incomplet) : la puce revient au repos et dit « IA indisponible » ; jamais
//    un ordre inventé ; un toucher de plus réessaie ;
//  - une réponse est gardée pour la séance, par demande : un retour à la même demande ne refacture pas.
import { useCallback, useMemo, useRef, useState } from 'react';
import { ficheDeCatalogue, type EntreeSuggerer, type MomentSuggerer } from '../../../../functions/src/hopReclassCore';
import type { Voie } from '../../../domain/hopIndex/v4';
import { hopRef } from '../parcours/v4';
import { houblon, style } from '../parcours/adaptateur';
import { quandDe } from '../parcours/quand';
import type { Quand, RecetteParcours } from '../parcours/types';
import { COURT } from './commun';
import { exclue, type Objectif } from './voies';

/** Le pool : les ex æquo du moteur au moment, 12 au plus (règle de coût et de latence : functions/src/hopReclassCore.ts, `TAILLE_POOL_SUGGERER`). */
export const TAILLE_POOL = 12;
const MIN_POOL = 3;
/** Un groupe « même effet » n'appelle l'IA que s'il a au moins trois rangées au même effet : le moteur ne les départage pas (deux ex æquo ne
 * valent pas un appel). Au plus deux moments par écran (les deux premiers groupes), pour borner le coût d'une ouverture (≈ 0,003 CHF l'appel). */
export const RANGEES_MINI = 3;
export const MOMENTS_MAX = 2;

export interface ReponseSuggerer { ok: boolean; ordre?: string[]; phrases?: Record<string, string>; model?: string; error?: string; promptVersion?: string; phrasesRetirees?: number; phrasesHorsFiche?: number; phrasesReputation?: number }
export type TransportSuggerer = (demande: EntreeSuggerer) => Promise<ReponseSuggerer>;

/** Délai du client : celui du serveur (20 s, `DELAI_SUGGERER_MS`) plus 5 s ; la fonction a 30 s. Banc ia4 de 3.8 Flash : médiane 4,7 s, maximum 5,6 s. */
export const DELAI_CLIENT_MS = 25000;
/** L'appel réel : le callable, par la Cloud Function (jamais une clé dans le navigateur). Importé à la demande : hors ligne ou en test,
 * Firebase n'est même pas chargé. */
const transportFirebase: TransportSuggerer = async (demande) => {
  const [{ httpsCallable }, { functions }] = await Promise.all([import('firebase/functions'), import('../../../services/firebase')]);
  const r = await httpsCallable<EntreeSuggerer, ReponseSuggerer>(functions, 'hopReclasserIA', { timeout: DELAI_CLIENT_MS })(demande);
  return r.data;
};
/** Sous Vitest, aucun transport par défaut : un écran monté dans un test n'appelle jamais le callable (ni Firebase, ni Gemini).
 * D132 : l'IA est à la demande (un toucher sur la puce) ; la porte `VITE_IA_SUGGERER` (D126) est retirée. */
const PAR_DEFAUT: TransportSuggerer | null = import.meta.env.MODE === 'test' ? null : transportFirebase;
let transport: TransportSuggerer | null = PAR_DEFAUT;
/** Pour les tests et le banc : un autre transport (null : celui par défaut). */
export function installerTransportSuggerer(t: TransportSuggerer | null): void { transport = t ?? PAR_DEFAUT; resultats.clear(); }
/** Il y a de quoi appeler : un transport existe et le navigateur est en ligne. Sinon l'écran ne calcule ni pool ni puce. */
export const iaPossible = (): boolean => transport !== null && !(typeof navigator !== 'undefined' && navigator.onLine === false);

// Une réponse par demande, gardée pour la séance : un double montage du mode strict, ou un retour à la même demande, ne refacture pas.
const resultats = new Map<string, Promise<ReponseSuggerer | null>>();

const effetCentral = (v: Voie, f: Objectif['f']): number | null => (v.effect[f].established && v.effect[f].central != null ? v.effect[f].central : null);
const cleEffet = (v: Voie, objectifs: readonly Objectif[]): string => JSON.stringify([v.actions.reduce((s, a) => s + a.grams, 0), objectifs.map((o) => effetCentral(v, o.f))]);
/** Le pool de l'IA : les EX ÆQUO du moteur. D'abord les rangées du groupe « même effet » (`rangees`, dans l'ordre du moteur), puis, dans le pool du
 * moment (`pool`, l'ordre du moteur), les houblons au même effet sur les objectifs ET à la même dose totale : jamais un houblon d'un autre effet,
 * jamais un houblon écarté par la visée (`bannis`). Au plus TAILLE_POOL. Vide : pas de rangée. */
export function poolExAequo(rangees: readonly Voie[], pool: readonly Voie[], objectifs: readonly Objectif[], bannis: Parameters<typeof exclue>[1] = []): Voie[] {
  if (!rangees.length) return [];
  const cle = cleEffet(rangees[0], objectifs), vus = new Set<string>(), sortie: Voie[] = [];
  for (const v of [...rangees, ...pool.filter((x) => cleEffet(x, objectifs) === cle && !exclue([houblon(x.actions[0].hopKey)], bannis))]) {
    const k = v.actions[0].hopKey;
    if (!vus.has(k)) { vus.add(k); sortie.push(v); }
  }
  return sortie.slice(0, TAILLE_POOL);
}

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

/** La puce d'un moment : « repos » (rien demandé, ou un échec : `echec`), « attente » (l'appel est parti), « recu » (l'ordre est là ; `appliquee` dit s'il range les rangées). */
export type StatutIA = 'repos' | 'attente' | 'recu';
export interface EtatIA {
  statut: StatutIA;
  /** Le dernier appel a échoué : la puce dit « IA indisponible » (jusqu'au toucher suivant, qui réessaie). */
  echec: boolean;
  /** Les clés de houblon rangées par l'IA, dans son ordre (vide tant que rien n'est reçu). */
  ordre: readonly string[];
  phrases: Readonly<Record<string, string>>;
  /** L'ordre de l'IA est celui des rangées. */
  appliquee: boolean;
  /** Un toucher sur la puce : au repos, lance l'appel ; en attente, rien ; reçu, applique l'ordre de l'IA ou rend celui du moteur (sans nouvel appel). */
  toucher: () => void;
}
export interface DemandeMoment { moment: string; demande: EntreeSuggerer }
export interface ClassementsIA {
  /** Par moment du moteur : l'état de la puce (null : pas de demande pour ce moment, pas de puce). */
  de: (moment: string) => EtatIA | null;
}
type Recu = ReponseSuggerer & { ordre: string[]; phrases: Record<string, string> };

/** Aucun appel au montage : `demandes` ne fait que dire ce qu'on PEUT demander (une puce par moment). Un appel part au toucher de la puce, un seul
 * par demande (un double toucher, ou un retour à la même demande, ne repart pas). Hors ligne, `demandes` est vide. Une autre demande (une autre
 * visée, une autre recette) repart de zéro. */
export function useClassementsIA(demandes: readonly DemandeMoment[]): ClassementsIA {
  const signature = demandes.map((x) => cleDemande(x.demande)).join('§');
  const [recus, setRecus] = useState<Record<string, Recu>>({});
  const [attentes, setAttentes] = useState<Record<string, boolean>>({});
  const [echecs, setEchecs] = useState<Record<string, boolean>>({});
  const [appliquees, setAppliquees] = useState<Record<string, boolean>>({});
  const enCours = useRef(new Set<string>());
  const lancer = useCallback((demande: EntreeSuggerer) => {
    const cle = cleDemande(demande);
    if (enCours.current.has(cle)) return;
    enCours.current.add(cle);
    setAttentes((x) => ({ ...x, [cle]: true })); setEchecs((x) => ({ ...x, [cle]: false }));
    const hors = typeof navigator !== 'undefined' && navigator.onLine === false;
    void (hors ? Promise.resolve(null) : demander(demande)).then((r) => {
      enCours.current.delete(cle);
      setAttentes((x) => ({ ...x, [cle]: false }));
      if (!r) { setEchecs((x) => ({ ...x, [cle]: true })); return; }
      setRecus((x) => ({ ...x, [cle]: r as Recu })); setAppliquees((x) => ({ ...x, [cle]: true }));
    });
  }, []);
  const basculer = useCallback((cle: string) => setAppliquees((x) => ({ ...x, [cle]: !x[cle] })), []);
  return useMemo(() => ({
    de: (moment: string) => {
      const d = demandes.find((x) => x.moment === moment);
      if (!d) return null;
      const cle = cleDemande(d.demande), r = recus[cle];
      const appliquee = !!r && !!appliquees[cle];
      const statut: StatutIA = r ? 'recu' : attentes[cle] ? 'attente' : 'repos';
      const toucher = () => { if (r) basculer(cle); else if (!attentes[cle]) lancer(d.demande); };
      return { statut, echec: !r && !!echecs[cle], ordre: r?.ordre ?? [], phrases: appliquee ? r.phrases : {}, appliquee, toucher };
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [signature, recus, attentes, echecs, appliquees, basculer, lancer]);
}
