/**
 * Les réglages de la procédure d'enrichissement des fiches (voie f4-enrichir, P4, PLAN § 3.5).
 * L'interrupteur se lit À L'APPEL (jamais au chargement du module). Éteint par défaut : seule la valeur `production` (son accord) ou `emulateur`
 * sur les émulateurs Firebase permettent une recherche en ligne. Le rapprochement aux catalogues, lui, marche toujours.
 */
export type EtatIA = 'emulateur' | 'production' | 'eteinte';
let force: EtatIA | null = null;
/** Pour les tests : force l'état de l'interrupteur ; `null` rend la main à la variable de build. */
export function setEnrichissementIA(etat: EtatIA | null): void { force = etat; }

/**
 * La règle, pure : `emulateur` seulement sur les émulateurs ET dans un serveur de développement (`import.meta.env.DEV`, REVUE-code D3 : un build
 * de production qui garderait `VITE_USE_FIREBASE_EMULATORS` n'appelle jamais) ; `production` (son accord) ; toute autre valeur, ou absente → éteinte.
 */
export function etatDe(valeur: unknown, emulateurs: unknown, dev: unknown): EtatIA {
  if (valeur === 'emulateur') return (emulateurs === 'true' || emulateurs === true) && dev === true ? 'emulateur' : 'eteinte';
  if (valeur === 'production') return 'production';
  return 'eteinte';
}
// Écrit en clair (`import.meta.env.VITE_…`) : Vite le remplace au build (et Vitest à la transformation), comme `firebase.ts`.
// La clé reste écrite dans le paquet (`VITE_ENRICHISSEMENT_IA:"production"`) : `check-build-flags.mjs` la lit avant tout déploiement (D378), comme flags.ts.
const etatDuBuild = (env: Record<string, unknown> = { VITE_ENRICHISSEMENT_IA: import.meta.env.VITE_ENRICHISSEMENT_IA }): EtatIA =>
  etatDe(env.VITE_ENRICHISSEMENT_IA, import.meta.env.VITE_USE_FIREBASE_EMULATORS, import.meta.env.DEV);
export const etatIA = (): EtatIA => force ?? etatDuBuild();
export const iaPermise = (): boolean => etatIA() !== 'eteinte';
/** Vitest pose `MODE === 'test'` : l'exécutant réel y est interdit (P4). */
export const enTest = (): boolean => (import.meta as { env?: Record<string, unknown> }).env?.MODE === 'test';

/**
 * Recherches arrivées au serveur, par jour de Zurich et par appareil. D378 (08.11, « Baisse à 20 et go ») : le banc payant mesure 0,35 CHF par
 * appel (recherche ancrée), soit 7 CHF par jour au pire ; l'ancien 200 de D300 faisait 70 CHF.
 */
export const PLAFOND_JOUR = 20;
/** Garde-fou de coût : tentatives parties par jour, quelle qu'en soit l'issue ; 20 appels au plus, échecs compris (D378). */
export const PLAFOND_TENTATIVES = 20;
/** 30 min au moins entre deux essais d'un même travail, dans une même vie de page. */
export const ECART_ESSAIS_MS = 30 * 60_000;
/** Trois jours distincts d'échec compté → `echec`. */
export const JOURS_ECHEC = 3;
/** Un « introuvable » se re-cherche au plus tôt 30 jours après. */
export const REESSAI_INTROUVABLE_MS = 30 * 86_400_000;
/** Attente de la lecture serveur de l'article avant de le traiter. */
export const ATTENTE_ARTICLE_MS = 15_000;

/**
 * ESTIMATIONS, non mesurées (PLAN § 3.5) : jamais montrées comme un coût avant la mesure du pilote. Tarifs de `functions/src/geminiCosts.ts`
 * (3.8 Flash 1,5 / 7,5 CHF par million de jetons ; recherche ancrée 0,0175 CHF la requête, 20 réservées par appel).
 */
export const ESTIMATION_CHF_PROBABLE: readonly [number, number] = [0.05, 0.12];
export const ESTIMATION_CHF_RESERVE = 0.4;
export const ESTIMATION_CHF_PIRE = 0.8;

/** Le jour de Zurich (AAAA-MM-JJ) d'un instant. */
export const jourDeZurich = (ms: number): string => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ms);

export type ClasseEchec = 'session' | 'refus' | 'config' | 'quota' | 'delai' | 'reseau' | 'sansDetail' | 'inexploitable' | 'autre';
/** La suite d'un échec : compte-t-il au plafond (appel arrivé au serveur), compte-t-il un jour d'échec, et l'état qui suit. */
export const SUITE_ECHEC: Readonly<Record<ClasseEchec, { plafond: boolean; jour: boolean; etat: 'attend' | 'echec' | 'iaEteinte' | 'plafond' | 'introuvable' }>> = {
  // Une réponse arrivée mais refusée par la garde des fiches de levure (`yeastLookupResultError`, `aiClient.ts`) : rien d'exploitable, comme `found: false`.
  inexploitable: { plafond: true, jour: false, etat: 'introuvable' },
  session: { plafond: false, jour: false, etat: 'attend' },
  refus: { plafond: false, jour: false, etat: 'echec' },
  config: { plafond: false, jour: false, etat: 'iaEteinte' },
  quota: { plafond: true, jour: false, etat: 'plafond' },
  delai: { plafond: true, jour: true, etat: 'attend' },
  reseau: { plafond: false, jour: false, etat: 'attend' },
  sansDetail: { plafond: true, jour: true, etat: 'attend' },
  autre: { plafond: true, jour: true, etat: 'attend' },
};
/**
 * La classe d'un échec, lue sur les textes FIXES d'`AiClient.humanize` (`aiClient.ts`) : `aiClient` ne rend pas le code d'erreur. Un test verrouille
 * chaque texte (`interrupteur.test.ts`). Un texte inconnu est `autre` : il compte (prudence sur le coût).
 */
export function classerEchec(texte: string | undefined): ClasseEchec {
  const t = (texte ?? '').replace(/[’']/g, "'");
  if (t.startsWith('Session expirée')) return 'session';
  if (t.includes("n'est pas autorisé à utiliser l'IA")) return 'refus';
  if (t.startsWith("L'IA n'est pas configurée")) return 'config';
  if (t.startsWith('Quota IA atteint')) return 'quota';
  if (t.includes("n'a pas répondu à temps")) return 'delai';
  if (t.startsWith('Service IA momentanément indisponible')) return 'reseau';
  if (t.includes('sans détail exploitable')) return 'sansDetail';
  if (t.startsWith('La réponse ne contient pas de fiche de levure') || t.startsWith('La fiche de levure renvoyée ne fournit pas')
    || t.startsWith('La réponse IA ne peut pas déclarer un choix confirmé')) return 'inexploitable';
  return 'autre';
}
