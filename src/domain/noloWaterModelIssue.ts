import type { NoloConfig } from '../../functions/src/noloSchema';
import { noloScience } from './noloScience';

/**
 * Water-only guard kept separate from the full NOLO planner. Water screens use
 * this check without needing to import the yeast catalogue and its large
 * reference library.
 */
export function noloWaterModelIssue(config: NoloConfig | undefined, ratio: number): string | undefined {
  if (!config?.enabled) return;
  if (config.process === 'secondRunnings') return 'Drêches : mesurer le moût récupéré. Aucun nouveau rendement, absorption de grain sec ou pouvoir tampon de malt neuf n’est appliqué.';
  if (config.process === 'coldExtraction') return 'Extraction à froid : mesurer ou titrer le moût filtré. Le modèle de pH et les doses d’acide d’un empâtage à chaud ne sont pas validés dans ce contexte.';
  const science = config.scienceSnapshot ?? noloScience();
  if (science && ratio > science.waterMashMaxLKg.value) return 'Empâtage très dilué : pH à mesurer ou à titrer, sans estimation ni marge standard du modèle.';
}
