/**
 * Contrat des vues de l'étape Levure (mission 2026-11-09-levure-port), entre la voie u1 (étape, coque des onglets
 * « Ma levure · Chercher · Comparer · Suggérer », branchement dans BrewWizard) et la voie u2 (Chercher, Comparer, Suggérer).
 * Fichier du pilote : un changement passe par lui.
 */
import type { YeastReference } from '../../domain/yeastReferences';
import type { ReperesRecette } from '../../domain/levure/contrat';

export type VueLevure = 'ma-levure' | 'chercher' | 'comparer' | 'suggerer';

export interface PropsVue {
  /** La levure de la recette (la base de Comparer et de Suggérer) ; absente tant que rien n'est choisi. */
  base?: YeastReference;
  /** OG, ABV, °C de la conduite, style : des repères, jamais un filtre imposé. */
  reperes: ReperesRecette;
  /** Choisir une levure pour la recette : la coque applique (selectYeast / applyCatalogueYeast) et revient sur « Ma levure ». */
  onChoisir: (levure: YeastReference) => void;
  /** Les levures posées dans Comparer (ids), partagées entre les vues ; ⊕ ajoute, × retire. */
  comparees: string[];
  onComparees: (ids: string[]) => void;
  /** Aller à une autre vue (« Comparer (2) » au pied, une ligne de Suggérer vers Comparer…). */
  onVue: (vue: VueLevure) => void;
  /** Toucher une donnée non documentée : la coque ouvre la recherche IA existante (YeastSheetAssistant), à confirmer. */
  onChercherDonnee?: (levure: YeastReference, axe: string) => void;
}
