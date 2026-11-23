import type { NoloOperation, NoloProcess } from '../../functions/src/noloSchema';
import type { HopRange } from '../../functions/src/hopIndexSchema';

export const noloProcessLabels: Record<NoloProcess, string> = {
  restricted: 'Fermentation limitée', restored: 'Limité + restitution', lowExtract: 'Faible extrait',
  coldExtraction: 'Extraction à froid', coldContact: 'Contact à froid', arrested: 'Fermentation interrompue',
  dealcoholized: 'Désalcoolisation', secondRunnings: 'Seconde extraction',
};
export const noloDecimal = (value: number) => value.toLocaleString('fr-FR', { maximumFractionDigits: 3 });
const amount = (value: number | null, unit: string) => value == null ? 'À renseigner' : `${noloDecimal(value)} ${unit}`;
const range = (value: HopRange | null | undefined, unit: string) => value == null ? 'À renseigner'
  : `${noloDecimal(value.min)}${value.min === value.max ? '' : '–' + noloDecimal(value.max)} ${unit}`;
const sugarLabels = { glucose: 'Glucose', fructose: 'Fructose', sucrose: 'Saccharose', maltose: 'Maltose', maltotriose: 'Maltotriose' };

/** Present only brewer-facing quantities; identifiers and snapshot bases stay internal. */
export function noloOperationFacts(operation: NoloOperation): [string, string][] {
  switch (operation.kind) {
    case 'dilution': return [['Eau ajoutée', amount(operation.volumeL, 'L')]];
    case 'removal': return [
      ['Alcool retiré', range(operation.ethanolRemovedPct, '%')], ['Volume après traitement', amount(operation.finalVolumeL, 'L')],
      ...(operation.source ? [['Hypothèse de retrait', operation.source] as [string, string]] : []),
    ];
    case 'blend': return [
      ['Bière ajoutée', amount(operation.volumeL, 'L')], ['Alcool de l’ajout', range(operation.abvPct, '% vol.')],
      ['Sucres fermentescibles', range(operation.remainingSugarG, 'g')],
    ];
    case 'aroma': return [
      ['Produit ajouté', amount(operation.volumeML, 'mL')], ['Alcool du support', range(operation.carrierAbvPct, '% vol.')],
      ['Sucres ajoutés', range(operation.sugarG, 'g')],
      ...(operation.moment ? [['Moment', operation.moment] as [string, string]] : []),
      ...(operation.composition ? [['Composition', operation.composition] as [string, string]] : []),
    ];
    case 'sugar': return [
      ['Volume ajouté', amount(operation.volumeL, 'L')],
      ...(operation.unclassifiedSugarG !== undefined ? [['Sucres non répartis', range(operation.unclassifiedSugarG, 'g')] as [string, string]] : []),
      ...Object.entries(operation.sugarsG).map(([key, value]): [string, string] => [sugarLabels[key], range(value, 'g')]),
      ['Composition', operation.complete ? 'Déclarée complète' : 'Partielle · sucres restants inconnus'],
    ];
  }
}
