import { ION_LABEL } from './labels';
import type { WaterIons } from '../../types';
export type SolveIssue =
  | { code: 'volume' | 'iteration' }
  | { code: 'grist'; target: number; colour: number }
  | { code: 'alkalinity-low'; value: number; excluded: boolean }
  | { code: 'alkalinity-high'; value: number; min: number; max: number }
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
    case 'high': return `${ION_LABEL[issue.ion]} : ${Math.round(issue.value)} ppm contre ${issue.max} au maximum du style${issue.source > issue.max ? ` — l’eau de départ en apporte déjà ${Math.round(issue.source)}. Seule l’osmosée peut faire baisser.` : '.'}`;
    case 'low': return `${ION_LABEL[issue.ion]} : ${Math.round(issue.value)} ppm pour ${Math.round(issue.target)} visés — les sels disponibles et les plafonds limitent le dosage.`;
  }
}
