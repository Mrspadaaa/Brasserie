import { ION_LABEL } from './labels';
import type { WaterIons } from '../../types';
import type { RaBand } from './mashPh';
import type { calculateWaterTreatment } from './treatment';
export type SolveIssue =
  | { code: 'volume' | 'iteration' }
  | { code: 'grist'; target: number; colour: number }
  | { code: 'alkalinity-low'; value: number; excluded: boolean }
  | { code: 'alkalinity-high'; value: number; min: number; max: number }
  | { code: 'bicarbonate-target'; value: number; target: number; limitedByAlkalinity: boolean; excluded?: boolean }
  | { code: 'high'; ion: keyof WaterIons; value: number; max: number; source: number }
  | { code: 'low'; ion: keyof WaterIons; value: number; target: number };

/** Compatibility text for existing screens; issue codes remain available. */
export function describeSolveIssue(issue: SolveIssue): string {
  switch (issue.code) {
    case 'volume': return 'Aucune eau à traiter : pose d’abord les volumes d’empâtage et de rinçage. Les sels et l’acide se dosent au litre.';
    case 'iteration': return 'Sels et alcalinité : compromis entre les deux objectifs. Vérifie le pH à l’empâtage avant de corriger.';
    case 'grist': return `Alcalinité : la facture limite l’objectif à ${issue.target} ppm au lieu des ${issue.colour} que demanderait la couleur. Le HCO₃ peut rester sous la fourchette du style — c’est le pH qui commande, pas la teinte.`;
    case 'alkalinity-low': return `Alcalinité résiduelle : ${Math.round(issue.value)} ppm sous la fenêtre — ${issue.excluded ? 'sels alcalins écartés' : 'les plafonds de calcium ou de sodium limitent les ajouts'}.`;
    case 'alkalinity-high': return `Alcalinité résiduelle à ${Math.round(issue.value)} ppm — vise ${issue.min} à ${issue.max}. À traiter à l’acide, pas au sel.`;
    case 'bicarbonate-target': return `HCO₃ : ${Math.max(0, Math.round(issue.value))} ppm pour ${Math.round(issue.target)} visés — ${issue.excluded ? 'sels alcalins écartés' : issue.limitedByAlkalinity ? 'la limite d’alcalinité de l’empâtage borne les ajouts' : 'les sels disponibles et les plafonds minéraux limitent les ajouts'}.`;
    case 'high': return `${ION_LABEL[issue.ion]} : ${Math.round(issue.value)} ppm contre ${issue.max} au maximum du style${issue.source > issue.max ? ` — l’eau de départ en apporte déjà ${Math.round(issue.source)}. Seule l’osmosée peut faire baisser.` : '.'}`;
    case 'low': return `${ION_LABEL[issue.ion]} : ${Math.round(issue.value)} ppm pour ${Math.round(issue.target)} visés — les sels disponibles et les plafonds limitent le dosage.`;
  }
}

/** Diagnose the retained water, after acid and manual additions, rather than the solver's proposal. */
export function describeTreatmentIssues(
  issues: readonly SolveIssue[],
  treatment: Pick<ReturnType<typeof calculateWaterTreatment>, 'raAfter' | 'treatedTotal' | 'hco3Target'> & { hco3Range?: { min: number; max: number } },
  band: Pick<RaBand, 'min' | 'max'>,
  options: { includeBicarbonateTarget?: boolean } = {}
): string[] {
  const messages: string[] = [];
  for (const issue of issues) {
    if (issue.code === 'alkalinity-high') {
      if (Number.isFinite(treatment.raAfter)) {
        if (treatment.raAfter <= band.max + 5) continue;
        if (treatment.hco3Range) {
          messages.push(`Alcalinité résiduelle à ${Math.round(treatment.raAfter)} ppm pour ${band.min}–${band.max} estimés pour les malts. Le profil HCO₃ choisi est conservé ; vérifier le pH d’empâtage avant de décider d’une correction.`);
          continue;
        }
        messages.push(describeSolveIssue({ ...issue, value: treatment.raAfter, min: band.min, max: band.max }));
        continue;
      }
    }
    if (issue.code === 'bicarbonate-target') {
      // The treatment diagnosis also includes the retained mash acid and explains manual doses.
      if (options.includeBicarbonateTarget === false || treatment.hco3Target) continue;
      const value = treatment.treatedTotal.hco3;
      if (Math.abs(value - issue.target) <= 2) continue;
      messages.push(describeSolveIssue({ ...issue, value }));
      continue;
    }
    if (issue.code === 'high' || issue.code === 'low') {
      const value = treatment.treatedTotal[issue.ion];
      if (Number.isFinite(value)) {
        if (issue.code === 'high' ? value <= issue.max + 2 : value >= issue.target - 2) continue;
        messages.push(describeSolveIssue({ ...issue, value }));
        continue;
      }
    }
    messages.push(describeSolveIssue(issue));
  }
  if (options.includeBicarbonateTarget !== false && treatment.hco3Target?.message)
    messages.push(treatment.hco3Target.message);
  return messages;
}
