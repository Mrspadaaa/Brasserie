import type { TypeEntree } from './carnetModel';

/**
 * e3gb, le rangement des notes en vrac par l'IA la moins chère (Flash-Lite) : la couture entre le carnet et le service d'IA.
 *
 * ACCORD : le service d'IA actuel (`aiTask`, `src/services/aiClient.ts`) n'a pas de tâche « ranger des notes ». La brancher demande une tâche
 * serveur neuve (`functions/`) et son déploiement, hors de la voie q3. Tant que `RANGEMENT_IA_BRANCHE` est éteint, le bouton « Ranger » ne
 * simule rien sur les vraies notes : il dit que le rangement n'est pas encore branché, et la note reste en vrac. Le rangeur simulé ne sert
 * qu'au banc local (`?dev-local`) et aux tests.
 */
export const RANGEMENT_IA_BRANCHE = false;

export type TypeMorceau = Exclude<TypeEntree, 'vrac'> | 'prochain-essai';

export interface MorceauPropose {
  id: string;
  type: TypeMorceau;
  texte: string;
  /** « 14.11.2026 » ; `null` quand la note ne dit pas le jour (le brasseur choisit alors aujourd'hui ou hier). */
  jour: string | null;
  /** Un morceau qui parle d'un autre brassin part à celui-ci. */
  brassin?: { id: string; libelle: string };
}

export interface EntreeRangement {
  texte: string;
  aujourdhui: string;
  brassin: { id: string; nom: string; jour0: string };
  autres: { id: string; nom: string; style: string }[];
  /** Les densités déjà relevées (jour, valeur) : une mesure déjà au carnet n'est pas recopiée. */
  releves: { jour: string; sg: number }[];
}
export type Rangeur = (entree: EntreeRangement) => Promise<MorceauPropose[]>;

let rangeur: Rangeur | null = null;
/** Le banc et les tests branchent ici une réponse simulée ; jamais d'appel réel. */
export function brancherRangeur(r: Rangeur | null) { rangeur = r; }
export function rangeurActif(): Rangeur | null { return rangeur; }

/** La réponse simulée de la maquette e3gb (6 morceaux), posée sur les jours de l'entrée. Marquée : elle ne lit pas la note. */
export const rangeurSimule: Rangeur = async ({ aujourdhui, autres }) => {
  const [d, m, y] = aujourdhui.split('.').map(Number);
  const moins = (k: number) => { const t = new Date(Date.UTC(y, m - 1, d - k)); return `${String(t.getUTCDate()).padStart(2, '0')}.${String(t.getUTCMonth() + 1).padStart(2, '0')}.${t.getUTCFullYear()}`; };
  const stout = autres.find(a => /stout/i.test(`${a.nom} ${a.style}`));
  return [
    { id: 'p1', type: 'prochain-essai', texte: 'Empâter à 67 °C : corps un peu mince.', jour: null },
    { id: 'p2', type: 'incident', texte: 'Robinet de F1 qui gouttait, resserré.', jour: null },
    { id: 'p3', type: 'cuve', texte: 'Krausen retombé, bulle lente, nez d’ananas.', jour: aujourdhui },
    { id: 'p4', type: 'degustation', texte: 'Pêche mûre, encore sucrée.', jour: moins(1) },
    { id: 'p5', type: 'cuve', texte: 'Krausen très haut, odeur de levure.', jour: moins(2) },
    ...(stout ? [{ id: 'p6', type: 'degustation' as const, texte: 'En bouteille : bien carbonatée, torréfiée, un poil astringente.', jour: null, brassin: { id: stout.id, libelle: `${stout.nom.replace(/^ZZ\s+/, '')} · ${stout.id}` } }] : []),
  ];
};
