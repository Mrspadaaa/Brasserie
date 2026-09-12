import { HopAnalyte, HopProductForm, HopUnit, HopMeasurement, HopVariety } from '../../../functions/src/hopIndexSchema';
export const hopReferenceSource = (v: HopVariety) => v.analysis[0]?.source.author ?? v.descriptions[0]?.source.author ?? 'Source non renseignée';
export const hopReferenceLabel = (v: HopVariety) => `${v.name} · ${hopReferenceSource(v)}`;
export const HOP_ANALYTE_LABELS: Record<HopAnalyte, string> = {
  alpha: 'Acides alpha', beta: 'Acides bêta', totalOil: 'Huiles totales', myrcene: 'Myrcène',
  linalool: 'Linalol', geraniol: 'Géraniol', citronellol: 'Citronellol', humulene: 'Humulène',
  caryophyllene: 'Caryophyllène', '4mmpFree': '4MMP libre', '4mmpCys': '4MMP cystéinylé',
  '4mmpGsh': '4MMP glutathionylé', '3mhFree': '3MH libre', '3mhCys': '3MH cystéinylé',
  '3mhGsh': '3MH glutathionylé', '3mhGluCys': '3MH γ-GluCys', '3mhCysGly': '3MH CysGly', '3s4mpFree': '3S4MP (3M4MP) libre',
  '3mhaFree': '3SHA (3MHA) libre', '2methylbutylIsobutyrate': 'Isobutyrate de 2-méthylbutyle', gammaNonalactone: 'γ-Nonalactone', hsi: 'Indice de stockage (HSI)'
};
export const HOP_FORM_LABELS: Record<HopProductForm, string> = {
  pelletT90: 'Pellets T90', pelletT45: 'Pellets T45', cryo: 'Lupuline concentrée / Cryo',
  cone: 'Cônes', extract: 'Extrait', unknown: 'Forme non précisée'
};
export const HOP_UNIT_LABELS: Record<HopUnit, string> = {
  percentMass: '% du houblon', percentOil: '% de l’huile', ml100g: 'mL/100 g', mg100g: 'mg/100 g de houblon', ugKg: 'µg/kg', ngL: 'ng/L de bière', ugL: 'µg/L de bière', ugKgThiolEquivalent: 'µg/kg en équivalents thiol libre', ugLInternalStandardEquivalent: 'µg/L en équivalents d’étalon interne', index: 'indice HSI', unknown: 'unité non précisée'
};
export function formatHopMeasurement(m?: HopMeasurement): string {
  if (!m || m.kind === 'unknown') return 'Non renseigné';
  const n = (v: number) => v.toLocaleString('fr-CH', { maximumSignificantDigits: 6 });
  const text = m.kind === 'below' ? m.limit == null ? 'Non détecté (limite inconnue)' : `< ${n(m.limit)}`
    : m.kind === 'range' ? `${n(m.range!.min)}–${n(m.range!.max)}` : n(m.value!);
  return `${text} ${HOP_UNIT_LABELS[m.unit]}`;
}
