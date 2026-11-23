import { describe, expect, it } from 'vitest';
import type { HopMeasurement, HopSource } from '../../functions/src/hopIndexSchema';
import { compareHopMaterials, readHopAnalysis } from '../../src/domain/hopDecision/measurements';
import { doseHopExtractForIbu, estimateBoilIbu, introducedHopAmounts, replacementHopDose } from '../../src/domain/hopDecision/calculations';
import { chooseHopSubstitutionDose, findHopSubstitutions } from '../../src/domain/hopDecision/substitution';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';

const source: HopSource = { title: 'Fixture analytique indépendante', author: 'Test', year: 2026, kind: 'observation', reference: 'fixture:hop-decision' };
const point = (analyte: HopMeasurement['analyte'], value: number): HopMeasurement => ({ analyte, value, unit: analyte === 'totalOil' ? 'ml100g' : 'percentMass', basis: 'asIs', kind: 'point', confidence: 'low', source });
function material(id: string, analysis: HopMeasurement[], availableGrams: number | null = 100): HopDecisionMaterial {
  return { id, name: id, form: 'pelletT90', availableGrams, variety: { id, name: id, aliases: [], form: 'pelletT90', descriptions: [], analysis } };
}
const a = material('A', [point('alpha', 10), point('totalOil', 1)]);
const b = material('B', [point('alpha', 5), point('totalOil', 1)]);
const program = (): HopDecisionProgram => ({ id: 'fixture', revision: 0, stage: 'planning', volumeL: 20, wortGravity: 1.05,
  additions: [{ id: 'addition', materialId: 'A', grams: 20, use: 'boil', boilMinutes: 60, status: 'planned' }] });

describe('lecture analytique sans précision inventée', () => {
  it('conserve nominal et absence d’incertitude', () => {
    expect(readHopAnalysis(a, 'alpha')).toMatchObject({ status: 'nominal', value: 10, range: null, scope: 'variety', uncertainty: 'notReported' });
  });
  it('ne moyenne pas deux références concurrentes', () => {
    const m = material('contradiction', [point('alpha', 10), point('alpha', 11)]);
    expect(readHopAnalysis(m, 'alpha')).toMatchObject({ status: 'conflict', value: null, measurements: m.variety!.analysis });
  });
  it('distingue zéro, inconnue, non-détection sans borne et avec borne', () => {
    expect(readHopAnalysis(material('zero', [point('alpha', 0)]), 'alpha').value).toBe(0);
    expect(readHopAnalysis(material('missing', []), 'alpha').status).toBe('unknown');
    const below: HopMeasurement = { ...point('alpha', 0), kind: 'below', value: undefined };
    expect(readHopAnalysis(material('below', [below]), 'alpha').range).toBeNull();
    expect(readHopAnalysis(material('bounded', [{ ...below, limit: 0.1, limitKind: 'lod' }]), 'alpha').range).toEqual({ min: 0, max: 0.1 });
  });
  it('non-détection lot sans borne ne disparaît pas derrière plage variétale', () => {
    const m = { ...a, lot: { id: 'lot', varietyId: 'A', name: 'Lot A', form: 'pelletT90' as const,
      analysis: [{ ...point('alpha', 0), kind: 'below' as const, value: undefined }] } };
    expect(readHopAnalysis(m, 'alpha')).toMatchObject({ status: 'unknown', scope: 'lot' });
  });
  it('refuse la forme contradictoire et la matière sèche sans humidité', () => {
    expect(readHopAnalysis({ ...a, form: 'extract' }, 'alpha').status).toBe('unknown');
    expect(readHopAnalysis(material('dry', [{ ...point('alpha', 10), basis: 'dryMatter' }]), 'alpha').status).toBe('unknown');
  });
  it('expose déclaration contraire au COA au lieu de masquer la mesure', () => {
    const entered = { ...b, declaredAnalysis: [point('alpha', 10)], lot: { id: 'lotB', varietyId: 'B', name: 'lotB', form: 'pelletT90' as const, analysis: [point('alpha', 5)] } };
    expect(readHopAnalysis(entered, 'alpha')).toMatchObject({ status: 'conflict', measurements: [point('alpha', 10), point('alpha', 5)] });
  });
  it('contrôle les bornes physiques après conversion et garde HSI lisible', () => {
    const impossible = material('impossible', [{ ...point('alpha', 130000), unit: 'mg100g' }]);
    expect(introducedHopAmounts(impossible, 20).alphaGrams.status).toBe('unknown');
    const hsi = (value: number) => material(`hsi${value}`, [{ ...point('hsi', value), unit: 'index', basis: 'unknown', method: 'Même protocole HSI' }]);
    expect(compareHopMaterials(hsi(0.3), hsi(0.6)).analytical.find(r => r.analyte === 'hsi')?.difference.value).toBeCloseTo(0.3);
  });
  it('convertit des unités absolues compatibles mais pas le pourcentage d’huile', () => {
    expect(readHopAnalysis(material('ug', [{ ...point('geraniol', 1000), unit: 'ugKg' }]), 'geraniol').value).toBeCloseTo(0.0001, 12);
    expect(readHopAnalysis(material('oil', [{ ...point('geraniol', 4), basis: 'oil', unit: 'percentOil' }]), 'geraniol').status).toBe('unknown');
    const left = material('oilA', [{ ...point('geraniol', 4), basis: 'oil', unit: 'percentOil' }]);
    const right = material('oilB', [{ ...point('geraniol', 7), basis: 'oil', unit: 'percentOil' }]);
    expect(compareHopMaterials(left, right).analytical.find(v => v.analyte === 'geraniol')?.difference).toMatchObject({ value: 3, unit: '% huile' });
  });
  it('conserve contexte et provenance des descripteurs sans les additionner', () => {
    const left = { ...a, variety: { ...a.variety!, descriptions: [{ text: 'agrumes', context: 'rawHop' as const, source }] } };
    const right = { ...b, variety: { ...b.variety!, descriptions: [{ text: 'agrumes', context: 'beer' as const, source }] } };
    const comparison = compareHopMaterials(left, right);
    expect(comparison.descriptions.find(d => d.context === 'rawHop')?.right).toEqual([]);
    expect(comparison.descriptions.find(d => d.context === 'beer')?.left).toEqual([]);
  });
});

describe('conventions de remplacement et charges introduites', () => {
  it('préserve alpha mais expose le doublement des huiles', () => {
    const dose = replacementHopDose({ from: a, to: b, grams: 20, basis: 'alphaLoad', use: 'boil' });
    expect(dose.value).toBe(40);
    expect(introducedHopAmounts(a, 20).alphaGrams.value).toBe(2);
    expect(introducedHopAmounts(b, dose).alphaGrams.value).toBe(2);
    expect(introducedHopAmounts(a, 20).oilMl.value).toBe(0.2);
    expect(introducedHopAmounts(b, dose).oilMl.value).toBe(0.4);
  });
  it('ne confond pas huile et alpha ni même masse avec même bière', () => {
    expect(replacementHopDose({ from: a, to: b, grams: 20, basis: 'totalOil', use: 'whirlpool' }).value).toBe(20);
    const mass = replacementHopDose({ from: a, to: material('maison', []), grams: 20, basis: 'sameMass', use: 'postFermentation' });
    expect(mass.value).toBe(20);
    expect(introducedHopAmounts(material('maison', []), mass).alphaGrams.status).toBe('unknown');
  });
  it('ne convertit jamais une masse d’huile en volume sans densité', () => {
    const massOil = material('massOil', [{ ...point('totalOil', 1), unit: 'percentMass' }]);
    expect(introducedHopAmounts(massOil, 20).oilMl.status).toBe('unknown');
    expect(replacementHopDose({ from: a, to: massOil, grams: 20, basis: 'totalOil', use: 'whirlpool' }).status).toBe('unknown');
  });
  it('calcule les extrêmes du quotient sans choisir un centre', () => {
    const left = material('L', [{ ...point('alpha', 0), kind: 'range', value: undefined, range: { min: 8, max: 12 } }]);
    const right = material('R', [{ ...point('alpha', 0), kind: 'range', value: undefined, range: { min: 4, max: 6 } }]);
    const dose = replacementHopDose({ from: left, to: right, grams: 20, basis: 'alphaLoad', use: 'boil' });
    expect(dose.range?.min).toBeCloseTo(80 / 3);
    expect(dose.range?.max).toBe(60);
    expect(dose.value).toBeNull();
  });
  it('refuse division par une concentration éventuellement nulle et ratios génériques', () => {
    const zero = material('zero', [point('alpha', 0)]);
    expect(replacementHopDose({ from: a, to: zero, grams: 20, basis: 'alphaLoad', use: 'boil' }).status).toBe('unknown');
    expect(replacementHopDose({ from: a, to: { ...b, form: 'cryo' }, grams: 20, basis: 'manufacturer', use: 'boil' }).status).toBe('unknown');
  });
  it('masse zéro et masse inconnue restent distinctes', () => {
    expect(introducedHopAmounts(material('unknown', []), 0).alphaGrams.value).toBe(0);
    expect(introducedHopAmounts(a, null).alphaGrams.status).toBe('unknown');
    expect(introducedHopAmounts(a, Number.POSITIVE_INFINITY).alphaGrams.status).toBe('unknown');
  });
});

describe('IBU de modèle avec domaine explicite', () => {
  it('reproduit le bilan HPA FLEX et l’unité alpha de Hopsteiner sous rendement explicite', () => {
    const flex = doseHopExtractForIbu({ targetIbu: 30, volumeL: 1000, utilizationFraction: 0.3, alphaPercent: readHopAnalysis(material('extract', [point('alpha', 40)]), 'alpha'), utilizationSource: source });
    expect(flex.productGrams.value).toBe(250);
    const packageDose = doseHopExtractForIbu({ targetIbu: 30, volumeL: 31 * 3.785411784, utilizationFraction: 0.3, alphaPercent: readHopAnalysis(material('extract', []), 'alpha'), utilizationSource: source, alphaGramsPerPackage: 150 });
    expect(packageDose.alphaGrams.value).toBeCloseTo(11.7347765304, 9);
    expect(packageDose.packagePortions.value).toBeCloseTo(0.078231843536, 10);
    expect(packageDose.productGrams.status).toBe('unknown');
  });
  it('reproduit l’équation publiée avec unités g/L sans arrondi intermédiaire', () => {
    const result = estimateBoilIbu({ grams: 20, alpha: readHopAnalysis(a, 'alpha'), volumeL: 20, wortGravity: 1.05, minutes: 60, use: 'boil' });
    // Independent Tinseth factors: 1.65 * 0.000125^0.05 and (1-exp(-2.4))/4.15.
    expect(result.value).toBeCloseTo(23.0664077, 6);
    expect(result.sources.some(s => s.author === 'Glenn Tinseth')).toBe(true);
  });
  it('ne met ni gravité standard ni IBU zéro au whirlpool/dry hop', () => {
    const base = { grams: 20, alpha: readHopAnalysis(a, 'alpha'), volumeL: 20, wortGravity: null, minutes: 60, use: 'boil' as const };
    expect(estimateBoilIbu(base).status).toBe('unknown');
    expect(estimateBoilIbu({ ...base, wortGravity: 1.05, use: 'postFermentation' }).status).toBe('unknown');
    expect(estimateBoilIbu({ ...base, wortGravity: 1.05, use: 'whirlpool' }).status).toBe('unknown');
  });
});

describe('options réellement envisageables', () => {
  it('ne garde pas la matière indisponible et vérifie stock partagé', () => {
    const p = program();
    p.additions.push({ id: 'other', materialId: 'B', grams: 70, use: 'whirlpool', status: 'planned' });
    const [option] = findHopSubstitutions({ program: p, additionId: 'addition', materials: [a, b], basis: 'alphaLoad' });
    expect(option.applicability).toBe('blocked');
    expect(option.changes).toBeNull();
  });
  it('ne remplace pas un ajout effectué ni une ébullition passée', () => {
    const p = program(); p.additions[0].status = 'performed';
    expect(findHopSubstitutions({ program: p, additionId: 'addition', materials: [a, b], basis: 'alphaLoad' })[0].applicability).toBe('blocked');
    p.additions[0].status = 'planned'; p.stage = 'fermenting';
    expect(findHopSubstitutions({ program: p, additionId: 'addition', materials: [a, b], basis: 'alphaLoad' })[0].applicability).toBe('blocked');
  });
  it('une dose choisie explicitement conserve sa plage et recalcule la charge', () => {
    const right = material('R', [{ ...point('alpha', 0), kind: 'range', value: undefined, range: { min: 4, max: 5 } }, point('totalOil', 1)]);
    const p = program();
    const [option] = findHopSubstitutions({ program: p, additionId: 'addition', materials: [a, right], basis: 'alphaLoad' });
    expect(option.changes).toBeNull();
    const request = { program: p, additionId: 'addition', materials: [a, right], basis: 'alphaLoad' as const };
    const selected = chooseHopSubstitutionDose(option, 45, request);
    expect(selected.doseGrams.range).toEqual({ min: 40, max: 50 });
    expect(selected.introduced.oilMl.value).toBe(0.45);
    expect(selected.changes?.[0]).toMatchObject({ kind: 'replace', additions: [{ grams: 45 }] });
    expect(selected.applicability).toBe('conditional');
    expect(selected.introduced.alphaGrams.range).toEqual({ min: 1.8, max: 2.25 });
    expect(() => chooseHopSubstitutionDose(option, 55, request)).toThrow();
    expect(() => chooseHopSubstitutionDose(option, 45, { ...request, materials: [a, { ...right, availableGrams: 0 }] })).toThrow();
    const edited = program(); edited.additions[0].grams = 200;
    expect(() => chooseHopSubstitutionDose(option, 45, { ...request, program: edited })).toThrow();
  });
  it('un échantillon public ne fournit pas un stock même avec une quantité saisie', () => {
    const reference = { ...b, lot: { id: 'public', varietyId: 'B', name: 'public', form: 'pelletT90' as const, referenceOnly: true, analysis: b.variety!.analysis } };
    expect(findHopSubstitutions({ program: program(), additionId: 'addition', materials: [a, reference], basis: 'alphaLoad' })[0].applicability).toBe('conditional');
  });
  it('un lot de forme contradictoire ne récupère pas les valeurs T90', () => {
    const otherForm = { ...b, lot: { id: 'extract', varietyId: 'B', name: 'extract', form: 'extract' as const, analysis: [] } };
    expect(readHopAnalysis(otherForm, 'alpha').status).toBe('unknown');
    expect(findHopSubstitutions({ program: program(), additionId: 'addition', materials: [a, otherForm], basis: 'alphaLoad' })[0].changes).toBeNull();
  });
});
