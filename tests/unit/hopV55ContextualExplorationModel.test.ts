import { describe, expect, it, vi } from 'vitest';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopDecisionMaterial, HopDecisionProgram, HopMaterialComparison } from '../../src/domain/hopDecision/types';
import { compareHopMaterials } from '../../src/domain/hopDecision/measurements';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { programFingerprint } from '../../src/domain/hopDecision/programs';
import {
  buildHopV55ContextualComparison,
  createHopV55ContextualComparisonSnapshot,
  HOP_V55_CONTEXTUAL_COMPARISON_SNAPSHOT_FORMAT,
  readHopV55ContextualComparisonSnapshot,
  createHopV55ExplorationProfile,
  hopV55DocumentaryShift,
  hopV55ExplorationProfileDraftErrors,
  hopV55ExplorationProfileHistory,
  hopV55IntentCriteria,
  hopV55ProfileCriteria,
  hopV55TrialFreshness,
  hopV55TrialOperations,
  readHopV55DocumentarySide,
  readHopV55ExplorationProfile,
  type HopV55ExplorationFamily,
  type HopV55ExplorationProfileDraft,
} from '../../src/ui/hopV55/contextualExplorationModel';

vi.mock('../../src/domain/hopDecision/measurements', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/domain/hopDecision/measurements')>();
  return { ...actual, compareHopMaterials: vi.fn(actual.compareHopMaterials) };
});

const source = (title: string) => ({
  title, author: 'Brasserie témoin', year: 2025, kind: 'observation' as const, reference: `https://example.test/${encodeURIComponent(title)}`,
});

function variety(id: string, name: string, descriptions: HopVariety['descriptions']): HopVariety {
  return { id, name, aliases: [], form: 'pelletT90', descriptions, analysis: [] };
}

function material(id: string, item?: HopVariety, form: HopDecisionMaterial['form'] = 'pelletT90'): HopDecisionMaterial {
  return { id, name: item?.name ?? id, form, ...(item ? { variety: item } : {}) } as HopDecisionMaterial;
}

const resinous = variety('resinous', 'Résineux témoin', [{ text: 'Résine et pin marqués', context: 'rawHop', source: source('Fiche résineux') }]);
const floral = variety('floral', 'Floral témoin', [{ text: 'Floral et miel, sans résine', context: 'beer', source: source('Dégustation florale') }]);
const silent = variety('silent', 'Sans description', []);

const families: HopV55ExplorationFamily[] = [
  { key: 'resin@1:["résine","pin"]', axisId: 'resin', version: '1', name: 'Résine', terms: ['résine', 'pin'], sources: [source('Axe résine')] },
  { key: 'floral@1:["floral"]', axisId: 'floral', version: '1', name: 'Floral', terms: ['floral'], sources: [source('Axe floral')] },
  { key: 'citrus@1:["agrumes"]', axisId: 'citrus', version: '1', name: 'Agrumes', terms: ['agrumes'], sources: [source('Axe agrumes A')] },
  { key: 'citrus@1:["citron"]', axisId: 'citrus', version: '1', name: 'Agrumes (autre lexique)', terms: ['citron'], sources: [source('Axe agrumes B')] },
];

const draft = (overrides: Partial<HopV55ExplorationProfileDraft> = {}): HopV55ExplorationProfileDraft => ({
  label: 'Light lager florale',
  status: 'target',
  description: 'Très florale, légère amertume, pas de résine.',
  criteria: [
    { direction: 'seek', label: 'Florale', family: { key: families[1].key, axisId: 'floral', version: '1', name: 'Floral', terms: ['floral'] } },
    { direction: 'avoid', label: 'Pas de résine', freeTerm: 'résine' },
  ],
  ...overrides,
});

let counter = 0;
const ids = () => `id-${++counter}`;

describe('lecture documentaire contextualisée', () => {
  it('distingue mention, négation, texte silencieux et description absente sans fabriquer de zéro', () => {
    const lens = { id: 'lens-resin', name: 'Résine', terms: ['résine', 'pin'], sources: [] };
    const sourceSide = readHopV55DocumentarySide(resinous, lens);
    const alternativeSide = readHopV55DocumentarySide(floral, lens);
    const unknownSide = readHopV55DocumentarySide(silent, lens);
    const mixedSide = readHopV55DocumentarySide(variety('mixed', 'Mixte', [
      { text: 'Résine présente dans le houblon brut', context: 'rawHop', source: source('Fiche mixte brute') },
      { text: 'Sans résine dans la bière', context: 'beer', source: source('Fiche mixte bière') },
    ]), lens);
    expect(sourceSide.status).toBe('documented');
    expect(sourceSide.contexts).toEqual(['rawHop']);
    expect(alternativeSide.status).toBe('negated');
    expect(alternativeSide.contexts).toEqual(['beer']);
    expect(alternativeSide.mentions[0]).toMatchObject({ qualification: 'negated', context: 'beer', text: 'Floral et miel, sans résine' });
    expect(mixedSide.status).toBe('mixed');
    expect(mixedSide.contexts).toEqual(['rawHop', 'beer']);
    expect(unknownSide.status).toBe('noDescriptions');
    expect(readHopV55DocumentarySide(undefined, lens).status).toBe('noDescriptions');
    expect(hopV55DocumentaryShift(sourceSide, alternativeSide)).toBe('sourceOnly');
    expect(hopV55DocumentaryShift(sourceSide, unknownSide)).toBe('unknown');
  });

  it('compare deux identités exactes par le service canonique et garde ses lectures intactes', () => {
    const left = material('variety:resinous', resinous);
    const right = material('variety:floral', floral, 'cone');
    const canonical = compareHopMaterials(left, right);
    vi.mocked(compareHopMaterials).mockClear();
    const comparison = buildHopV55ContextualComparison({ source: left, alternative: right, sourceSubject: resinous, alternativeSubject: floral, families });
    expect(compareHopMaterials).toHaveBeenCalledWith(left, right);
    expect(comparison.material).toEqual(canonical);
    expect(comparison.families.find((row) => row.family.axisId === 'resin')?.shift).toBe('sourceOnly');
    expect(comparison.families.find((row) => row.family.axisId === 'floral')?.shift).toBe('alternativeOnly');
    expect(comparison.families.find((row) => row.family.key === families[2].key)?.shift).toBe('neither');
    expect(comparison.identityNotes.some((note) => note.includes('aucun ratio de forme'))).toBe(true);
    expect(comparison.nonConclusions.join(' ')).toMatch(/Aucun gain ni perte sensoriels ne sont chiffrés/);
    expect(() => buildHopV55ContextualComparison({ source: left, alternative: left, families })).toThrow(/même identité exacte/);
  });

  it('scelle les matières, sources, lexiques et le résultat rendu, puis refuse une comparaison retouchée même resealée', () => {
    const left = material('variety:resinous', resinous);
    const right = material('variety:floral', floral);
    const snapshot = createHopV55ContextualComparisonSnapshot({ source: left, alternative: right,
      sourceSubject: resinous, alternativeSubject: floral, families, criteria: [] });
    expect(readHopV55ContextualComparisonSnapshot(snapshot, { sourceMaterial: left, alternativeMaterial: right })).toMatchObject({
      status: 'current', sourceId: left.id, alternativeId: right.id, readingReference: null, profileSnapshotReference: null,
    });
    expect(snapshot.families[0].sources).toEqual([source('Axe résine')]);
    expect(snapshot.comparison.families.find((row) => row.family.axisId === 'resin')?.source.mentions[0].source).toEqual(source('Fiche résineux'));

    const changedMaterial = { ...right, name: 'Autre matière', variety: { ...floral, name: 'Autre matière' } } as HopDecisionMaterial;
    expect(readHopV55ContextualComparisonSnapshot(snapshot, { sourceMaterial: left, alternativeMaterial: changedMaterial })).toMatchObject({ status: 'invalid' });

    const forged = structuredClone(snapshot);
    forged.comparison.families[0].shift = 'shared';
    const { reference: _old, ...body } = forged;
    forged.reference = hopAdviceContentReference(HOP_V55_CONTEXTUAL_COMPARISON_SNAPSHOT_FORMAT, body);
    expect(readHopV55ContextualComparisonSnapshot(forged, { sourceMaterial: left, alternativeMaterial: right })).toMatchObject({ status: 'invalid' });
    expect(readHopV55ContextualComparisonSnapshot({ ...snapshot, format: 'hop-v55-contextual-comparison-snapshot-v9' },
      { sourceMaterial: left, alternativeMaterial: right })).toMatchObject({ status: 'unsupported' });
  });

  it('réutilise les plages et conflits analytiques sans centre, moyenne ni remplacement', () => {
    const range = { status: 'range', unit: '% massique', value: null, range: { min: 3, max: 6 }, uncertainty: 'reportedBounds', sources: [source('Plage A')], reasons: ['Plage rapportée.'] };
    const conflict = { status: 'conflict', unit: '% massique', value: null, range: null, uncertainty: 'unknown', sources: [source('Lot'), source('Saisie')], reasons: ['Valeurs divergentes.'] };
    const unknown = { status: 'unknown', unit: '% massique', value: null, range: null, uncertainty: 'unknown', sources: [], reasons: ['Aucune analyse.'] };
    const stub = {
      leftId: 'a', rightId: 'b', limits: ['Limite canonique.'],
      descriptions: [],
      analytical: [
        { analyte: 'alpha', left: { ...range, analyte: 'alpha', scope: 'variety', measurements: [] }, right: { ...conflict, analyte: 'alpha', scope: 'declaration', measurements: [] }, difference: { ...conflict, status: 'conflict' } },
        { analyte: 'beta', left: { ...unknown, analyte: 'beta', scope: 'unknown', measurements: [] }, right: { ...unknown, analyte: 'beta', scope: 'unknown', measurements: [] }, difference: unknown },
      ],
    } as unknown as HopMaterialComparison;
    vi.mocked(compareHopMaterials).mockReturnValueOnce(stub);
    const comparison = buildHopV55ContextualComparison({ source: material('a'), alternative: material('b'), families: [] });
    expect(comparison.analytical.readable).toHaveLength(1);
    expect(comparison.analytical.readable[0]).toBe(stub.analytical[0]);
    expect(comparison.analytical.conflicts).toEqual(['alpha']);
    expect(comparison.analytical.unknownBoth).toEqual(['beta']);
    expect(JSON.stringify(comparison.analytical)).not.toMatch(/"(central|mean|average|midpoint)"/);
    expect(comparison.identityNotes).toContain('Une matière n’a pas de fiche de variété liée : ses descriptions restent inconnues.');
  });

  it('confronte cibles et hypothèses sans transformer une négation ou un silence en garantie', () => {
    const profile = createHopV55ExplorationProfile(draft({ criteria: [
      ...draft().criteria,
      { direction: 'keep', label: 'Garder le pin', family: { key: families[0].key, axisId: 'resin', version: '1', name: 'Résine', terms: ['résine', 'pin'] } },
      { direction: 'seek', label: 'Miel', freeTerm: 'miel' },
    ] }), { recordedAt: '2026-10-04T08:00:00.000Z', profileId: 'exploration-profile:test', newId: ids });
    const intent = { question: 'Plus de fruits, moins de citron', criteria: [
      { id: 'c1', label: 'Agrumes', direction: 'decrease' as const, axisId: 'citrus' },
      { id: 'c2', label: 'Fruits rouges', direction: 'increase' as const, familyId: 'red-fruit' },
      { id: 'c3', label: 'Sans famille', direction: 'investigate' as const },
    ] };
    const criteria = [...hopV55IntentCriteria(intent), ...hopV55ProfileCriteria(profile, false)];
    const comparison = buildHopV55ContextualComparison({
      source: material('variety:resinous', resinous), alternative: material('variety:floral', floral),
      sourceSubject: resinous, alternativeSubject: floral, families, criteria,
    });
    const byLabel = new Map(comparison.confrontation.map((row) => [row.criterion.label, row]));
    expect(byLabel.get('Agrumes')).toMatchObject({ kind: 'notEvaluated' });
    expect(byLabel.get('Agrumes')?.reason).toMatch(/Plusieurs lexiques/);
    expect(byLabel.get('Fruits rouges')?.kind).toBe('notEvaluated');
    expect(byLabel.get('Sans famille')?.kind).toBe('notEvaluated');
    expect(byLabel.get('Florale')?.kind).toBe('documentedSupport');
    expect(byLabel.get('Pas de résine')?.kind).toBe('notMentioned');
    expect(byLabel.get('Pas de résine')?.reason).toMatch(/pas une garantie d’absence/);
    expect(byLabel.get('Garder le pin')?.kind).toBe('possibleLoss');
    expect(byLabel.get('Miel')?.kind).toBe('documentedSupport');
    expect(byLabel.get('Florale')?.criterion.origin).toMatchObject({ kind: 'profile', status: 'target', persisted: false, profileReference: null });
    expect(byLabel.get('Agrumes')?.criterion.origin).toEqual({ kind: 'intent', question: intent.question });
  });
});

describe('profil libre de bière', () => {
  it('reste une cible locale hors guide même si son nom évoque un style, et se relit sans reconstruction', () => {
    const profile = createHopV55ExplorationProfile(draft(), { recordedAt: '2026-10-04T08:00:00.000Z', profileId: 'exploration-profile:lager', newId: ids });
    expect(profile).toMatchObject({ format: 'hop-v55-exploration-profile-v1', version: 1, previousReference: null, status: 'target',
      scope: 'explorationOnly', styleGuideRef: null, actor: { kind: 'brewer' } });
    expect(profile.description).toBe('Très florale, légère amertume, pas de résine.');
    expect(JSON.stringify(profile)).not.toMatch(/guideId|styleId|ogTarget|ibuTarget/);
    expect(readHopV55ExplorationProfile(structuredClone(profile))).toEqual({ status: 'current', profile });

    const tampered = { ...structuredClone(profile), status: 'hypothesis' };
    expect(readHopV55ExplorationProfile(tampered)).toMatchObject({ status: 'invalid' });
    const forged = { ...structuredClone(profile), styleGuideRef: { guideId: 'bjcp', version: '2021', styleId: '1A' } };
    expect(readHopV55ExplorationProfile(forged)).toMatchObject({ status: 'invalid' });
    const future = { format: 'hop-v55-exploration-profile-v2', label: 'Futur' };
    expect(readHopV55ExplorationProfile(future)).toEqual({ status: 'unsupported', format: 'hop-v55-exploration-profile-v2', raw: future });
  });

  it('refuse un statut implicite et un critère ambigu, puis révise par une nouvelle version chaînée', () => {
    expect(hopV55ExplorationProfileDraftErrors(draft({ status: '' }))).toContain('Choisis si ce profil est une cible ou une hypothèse.');
    expect(hopV55ExplorationProfileDraftErrors(draft({ criteria: [{ direction: 'seek', label: 'Les deux',
      family: { key: 'k', axisId: 'a', version: '1', name: 'A', terms: ['a'] }, freeTerm: 'a' }] })).join(' ')).toMatch(/soit à une famille documentée, soit à un terme exact/);
    expect(() => createHopV55ExplorationProfile(draft({ label: ' ' }), { recordedAt: 'x', profileId: 'p', newId: ids })).toThrow(/Nomme ce profil/);

    const first = createHopV55ExplorationProfile(draft(), { recordedAt: '2026-10-04T08:00:00.000Z', profileId: 'exploration-profile:rev', newId: ids });
    const second = createHopV55ExplorationProfile(draft({ status: 'hypothesis', criteria: first.criteria }),
      { recordedAt: '2026-10-04T09:00:00.000Z', profileId: first.profileId, previous: first, newId: ids });
    expect(second).toMatchObject({ version: 2, previousReference: first.reference, status: 'hypothesis' });
    expect(second.criteria.map((row) => row.id)).toEqual(first.criteria.map((row) => row.id));
    expect(() => createHopV55ExplorationProfile(draft(), { recordedAt: 'x', profileId: 'other', previous: first, newId: ids }))
      .toThrow(/Identité de profil et date exacte requises/);

    const history = hopV55ExplorationProfileHistory([first, second, { format: 'unknown-format' }]);
    expect(history.latest.map((row) => row.reference)).toEqual([second.reference]);
    expect(history.history).toHaveLength(2);
    expect(history.unreadable).toEqual([{ status: 'unsupported', format: 'unknown-format', raw: { format: 'unknown-format' } }]);
    expect(hopV55ProfileCriteria(second, true)[0].origin).toMatchObject({ profileReference: second.reference, persisted: true });
  });
});

describe('essai explicite', () => {
  const program: HopDecisionProgram = { id: 'program:exploration', revision: 1, stage: 'planning', volumeL: 20, wortGravity: null,
    additions: [{ id: 'addition:saazer', materialId: 'variety:saazer', grams: 40, use: 'boil', status: 'planned', boilMinutes: 60 }] } as HopDecisionProgram;

  it('transmet seulement les choix explicites et garde les choix de ligne manquants côté UI', () => {
    const { operations, localNeeds } = hopV55TrialOperations([
      { key: 'a', originProgramReference: programFingerprint(program), originContextReference: 'origin:exact', kind: 'add', additionId: 'exploration-hop:a', materialId: 'variety:styrian' },
      { key: 'b', originProgramReference: programFingerprint(program), originContextReference: 'origin:exact', kind: 'replace', materialId: 'variety:styrian', dose: 'explicit', grams: 30 },
      { key: 'c', originProgramReference: programFingerprint(program), originContextReference: 'origin:exact', kind: 'replace', sourceAdditionId: 'addition:saazer', materialId: 'variety:styrian', dose: 'basis' },
      { key: 'd', originProgramReference: programFingerprint(program), originContextReference: 'origin:exact', kind: 'setDose', sourceAdditionId: 'addition:saazer', mode: 'decrease', grams: 20 },
      { key: 'e', originProgramReference: programFingerprint(program), originContextReference: 'origin:exact', kind: 'remove', sourceAdditionId: 'addition:saazer' },
      { key: 'f', originProgramReference: programFingerprint(program), originContextReference: 'origin:exact', kind: 'replace', sourceAdditionId: 'addition:saazer', materialId: 'variety:styrian', dose: '' },
    ], (line) => `Ligne ${line.key}`);
    expect(localNeeds.map((row) => row.key)).toEqual(['b', 'c']);
    expect(operations).toEqual([
      { id: 'exploration-operation:a', label: 'Ligne a', kind: 'add', additionId: 'exploration-hop:a', materialId: 'variety:styrian', grams: null },
      { id: 'exploration-operation:d', label: 'Ligne d', kind: 'setDose', additionId: 'addition:saazer', quantity: { kind: 'delta', grams: 20, direction: 'decrease' } },
      { id: 'exploration-operation:e', label: 'Ligne e', kind: 'remove', additionId: 'addition:saazer', quantity: { kind: 'entire' } },
      { id: 'exploration-operation:f', label: 'Ligne f', kind: 'replace', additionId: 'addition:saazer', materialId: 'variety:styrian' },
    ]);
  });

  it('refuse une préparation scellée sur A quand le programme devient B', () => {
    const preparation = { programReference: programFingerprint(program) };
    expect(hopV55TrialFreshness(preparation, program)).toBe('fresh');
    const mutated = { ...program, additions: [{ ...program.additions[0], grams: 35 }] } as HopDecisionProgram;
    expect(hopV55TrialFreshness(preparation, mutated)).toBe('stale');
    expect(hopV55TrialFreshness(preparation, undefined)).toBe('noProgram');
  });
});
