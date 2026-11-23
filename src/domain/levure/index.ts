/**
 * Le domaine de l'étape Levure (mission 2026-11-09-levure-port, voie d1) : implémente `ApiLevure` de `contrat.ts`.
 * Les quatre vues (Ma levure, Chercher, Comparer, Suggérer) lisent cette seule liste d'axes.
 *
 *   import { levure } from '../domain/levure';
 *   levure.chercher('1056', {}, { temperatureC: 19, abvVise: 7 });
 *
 * `creerApiLevure({ faitsSources: false })` lit le catalogue seul (comparer aux comptes des maquettes).
 */
import type {
  ApiLevure, ChoixAxe, EtatFiltres, IdAxe, ReperesRecette, ValeurAxe
} from './contrat';
import type { YeastReference } from '../yeastReferences';
import { AXES, FILTRES } from './axes';
import { creerContexte, type Contexte, type OptionsLevure } from './contexte';
import { disponibilite } from './disponibilite';
import { distance } from './proximite';
import { chercher, documente, type ContexteRecherche, type ResultatRechercheEtendu } from './recherche';
import { comptesAxes, suggerer } from './suggerer';
import { autresValeurs, lire, versValeurAxe } from './valeurs';

export interface ApiLevureEtendue extends Omit<ApiLevure, 'chercher'> {
  /** Comme `ApiLevure.chercher`, avec en plus le stock du brasseur (filtre « En stock chez moi ») et la levure tapée dans le résultat. */
  chercher(requete: string, filtres: EtatFiltres, reperes?: ReperesRecette, contexte?: ContexteRecherche): ResultatRechercheEtendu;
  /** Les valeurs d'autres sources qui contredisent la retenue (la plus sourcée est montrée par `valeurAxe`, l'autre est notée ici). */
  autresValeurs(levure: YeastReference, axe: IdAxe): ValeurAxe[];
  readonly contexte: Contexte;
}

export function creerApiLevure(options: OptionsLevure = {}): ApiLevureEtendue {
  const ctx = creerContexte(options);
  return {
    AXES, FILTRES, contexte: ctx,
    valeurAxe: (levure, axe) => versValeurAxe(lire(ctx.fiche(levure), axe)),
    autresValeurs: (levure, axe) => autresValeurs(lire(ctx.fiche(levure), axe)),
    disponibilite: (levure) => disponibilite(levure),
    chercher: (requete, filtres, reperes, contexte) => chercher(ctx, requete, filtres, reperes, contexte),
    proximite: (a, b) => distance(ctx.fiche(a), ctx.fiche(b)),
    comptesAxes: (base) => comptesAxes(ctx, base),
    suggerer: (base: YeastReference, choix: ChoixAxe[], limite?: number) => suggerer(ctx, base, choix, limite),
    documente: (levure, filtre) => documente(ctx, levure, filtre),
    trouver: (id) => ctx.ficheParId(id)?.ref
  };
}

/** L'API de l'app : faits sourcés versés, une instance. */
export const levure: ApiLevureEtendue = creerApiLevure();
export default levure;

export type * from './contrat';
export { AXES, FILTRES, GROUPES, BOISSONS, FAMILLES, NIVEAUX, AXES_AROMES, axeParId } from './axes';
export { FABRICANTS_EUROPE, FABRICANTS_ECARTES } from './disponibilite';
export { DOUTES, doute, levierPour } from './doutes';
export { familleArome, jetonArome, jetonDeAxe, FAMILLE_DE_L_AXE } from './couleurs';
export { NB_FAITS_VERSES } from './fiche';
