import type { WaterAnalysisResult } from './waterAnalysisProtocol';

/**
 * Réponses d'analyse déjà calculées avant l'ouverture de l'onglet Eau (préchargement de l'assistant, 15.11).
 * La clé est le contenu complet de l'entrée (`waterAnalysisKey`) et la fonction est pure : une réponse gardée sous sa clé est
 * exactement celle que le worker rendrait. Peu d'entrées : on ne retient que les dernières recettes vues.
 */
const MAX_ENTRIES = 6;
const preloaded = new Map<string, WaterAnalysisResult>();

export function rememberPreloadedWaterAnalysis(key: string, result: WaterAnalysisResult): void {
  preloaded.delete(key);
  preloaded.set(key, result);
  while (preloaded.size > MAX_ENTRIES) preloaded.delete(preloaded.keys().next().value as string);
}

export function recallPreloadedWaterAnalysis(key: string): WaterAnalysisResult | undefined {
  return preloaded.get(key);
}

export function clearPreloadedWaterAnalysis(): void {
  preloaded.clear();
}
