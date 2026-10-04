import { describe, expect, it } from 'vitest';
import {
  assertBrewingSensoryUnresolvedLabel,
  assertBrewingSensoryCandidates,
  brewingSensoryContentReference,
  brewingSensoryCandidatesError,
  brewingSensoryDefinitionSetError,
  brewingSensoryDimensionError,
  createBrewingSensoryComparison,
  createBrewingSensoryDefinitionReference,
  extractBrewingSensoryDocumentaryEvidence,
  type BrewingSensoryComparisonValue,
  type BrewingSensoryDimension,
  type BrewingSensoryLexicalRule,
  type BrewingSensoryMetric,
  type BrewingSensoryScale,
} from '../../src/domain/brewingSensory';
import type { HopSource } from '../../functions/src/hopIndexSchema';

const source = (title: string, kind: HopSource['kind'] = 'manufacturer'): HopSource => ({
  title, author: 'Fixture source', year: 2026, kind, reference: `fixture:${title}`,
});

const pear: BrewingSensoryDimension = {
  id: 'fine-pear', version: 'v1', name: 'Poire', definition: 'Mention de poire comme nuance sensorielle distincte.',
  sourceRefs: [source('dimension pear', 'judgment')], terms: ['pear', 'poire'],
  familyRefs: [{ family: { id: 'pomeFruit', version: 'local-1' }, relation: 'memberOf', sourceRefs: [source('family map', 'judgment')] }],
};
const mango: BrewingSensoryDimension = {
  id: 'fine-mango', version: 'v1', name: 'Mangue', definition: 'Mention de mangue comme nuance sensorielle distincte.',
  sourceRefs: [source('dimension mango', 'judgment')], terms: ['mango', 'mangue'],
};
const melon: BrewingSensoryDimension = {
  id: 'fine-melon', version: 'v1', name: 'Melon', definition: 'Mention de melon comme nuance sensorielle distincte.',
  sourceRefs: [source('dimension melon', 'judgment')], terms: ['melon'],
};

const lexicalRules: BrewingSensoryLexicalRule[] = [
  { id: 'lexicon-fr-en', version: 'v3', dimensionRef: { id: pear.id, version: pear.version }, terms: ['pear', 'poire'],
    negationPrefixes: ['no', 'not', 'sans'], qualifierTerms: ['light', 'léger', 'légère'], sourceRefs: [source('lexicon', 'judgment')] },
  { id: 'lexicon-fr-en', version: 'v3', dimensionRef: { id: mango.id, version: mango.version }, terms: ['mango', 'mangue'],
    sourceRefs: [source('lexicon', 'judgment')] },
  { id: 'lexicon-fr-en', version: 'v3', dimensionRef: { id: melon.id, version: melon.version }, terms: ['melon'],
    sourceRefs: [source('lexicon', 'judgment')] },
];

function singleSeriesComparison(values: BrewingSensoryComparisonValue[]) {
  const metric: BrewingSensoryMetric = { id: 'single-note', version: 'v1', kind: 'ordinalNote', name: 'Note',
    meaning: 'Note source sur son échelle déclarée.', unit: 'points', sourceRefs: [source('single metric', 'research')] };
  const scale: BrewingSensoryScale = { id: 'single-scale', version: 'v1', metricRef: { id: metric.id, version: metric.version },
    domain: { min: 0, max: 10 }, sourceRefs: [source('single scale', 'research')] };
  const definition = createBrewingSensoryDefinitionReference(pear, metric, scale);
  return createBrewingSensoryComparison({
    context: { id: 'ctx', version: '1', kind: 'beer', contentReference: 'ctx:fixture', label: 'Bière', sourceRefs: [] },
    reference: { id: 'ref', version: '1', kind: 'adopted', contentReference: 'ref:fixture', sourceRefs: [] },
    candidateOrder: ['series-a'], candidates: [{ id: 'series-a', name: 'Série A' }], dimensionOrder: [definition.contentReference],
    dimensions: [{ definition, values }],
  });
}

describe('références et preuves sensorielles génériques', () => {
  it('conserve texte, source et contexte; distingue qualifier, négation et non-mention', () => {
    const result = extractBrewingSensoryDocumentaryEvidence({
      id: 'fixture-variety', name: 'Variety fixture', descriptions: [
        { text: 'Aroma: light pear; no pear; mango.', context: 'rawHop', source: source('raw-hop sheet') },
        { text: 'No pear was reported in this beer.', context: 'beer', source: source('beer note', 'observation') },
        { text: 'Other notes: herbal and floral.', context: 'unspecified', source: source('community tags', 'community') },
      ],
    }, [pear, mango, melon], lexicalRules);

    expect(result.descriptions).toHaveLength(3);
    expect(result.descriptions.map(row => row.context)).toEqual(['rawHop', 'beer', 'unspecified']);
    expect(result.descriptions.map(row => row.source.title)).toEqual(['raw-hop sheet', 'beer note', 'community tags']);
    const pearResult = result.dimensions.find(row => row.dimension.id === pear.id)!;
    expect(pearResult.status).toBe('mixed');
    expect(pearResult.mentions.map(row => row.qualification)).toEqual(['qualified', 'negated', 'negated']);
    expect(pearResult.mentions[0]).toMatchObject({ term: 'pear', qualifierTerm: 'light', context: 'rawHop', text: 'Aroma: light pear; no pear; mango.' });
    expect(pearResult.mentions[1]).toMatchObject({ term: 'pear', context: 'rawHop', text: 'Aroma: light pear; no pear; mango.' });
    expect(pearResult.mentions[2]).toMatchObject({ term: 'pear', context: 'beer', text: 'No pear was reported in this beer.' });
    expect(pearResult.mentions.map(row => row.source.title)).toEqual(['raw-hop sheet', 'raw-hop sheet', 'beer note']);
    expect(result.dimensions.find(row => row.dimension.id === mango.id)?.status).toBe('documented');
    const melonResult = result.dimensions.find(row => row.dimension.id === melon.id)!;
    expect(melonResult.status).toBe('nonDocumented');
    expect(melonResult.mentions).toEqual([]);
    expect(melonResult).not.toHaveProperty('value');
    expect(melonResult).not.toHaveProperty('range');
  });

  it('garde un libellé non résolu sans créer métrique ni valeur', () => {
    const label = { status: 'unresolved' as const, rawLabel: 'stone fruit?', context: 'beer' as const,
      text: 'Notes mention stone fruit?', sourceRefs: [source('tasting note', 'observation')] };
    assertBrewingSensoryUnresolvedLabel(label);
    expect(label).not.toHaveProperty('metric');
    expect(label).not.toHaveProperty('value');
  });

  it('référence définition et échelle exactes, en conservant des versions incompatibles séparées', () => {
    const ordinal: BrewingSensoryMetric = { id: 'panel-note', version: 'v1', kind: 'ordinalNote', name: 'Note de panel',
      meaning: 'Intensité sensorielle déclarée sur la grille publiée.', unit: 'points', sourceRefs: [source('panel scale', 'research')] };
    const index: BrewingSensoryMetric = { id: 'model-index', version: 'v1', kind: 'modelIndex', name: 'Indice de projection',
      meaning: 'Indice hypothétique issu du modèle versionné.', unit: 'index points', sourceRefs: [source('model definition', 'judgment')] };
    const panel15: BrewingSensoryScale = { id: 'panel-citrus', version: '2018', metricRef: { id: ordinal.id, version: ordinal.version },
      domain: { min: 0, max: 15 }, sourceRefs: [source('published scale', 'research')] };
    const model100: BrewingSensoryScale = { id: 'model-personal', version: 'v2', metricRef: { id: index.id, version: index.version },
      domain: { min: 0, max: 100 }, sourceRefs: [source('local model scale', 'judgment')] };
    const panelReference = createBrewingSensoryDefinitionReference(pear, ordinal, panel15);
    const modelReference = createBrewingSensoryDefinitionReference(pear, index, model100);
    expect(panelReference.contentReference).not.toBe(modelReference.contentReference);
    expect(brewingSensoryDefinitionSetError([panelReference, modelReference])).toBeNull();
    expect(brewingSensoryContentReference(pear, ordinal, panel15)).toBe(panelReference.contentReference);
    expect(createBrewingSensoryDefinitionReference({ ...pear, version: 'v2' }, ordinal, panel15).dimensionReference).not.toBe(panelReference.dimensionReference);
    expect(createBrewingSensoryDefinitionReference(pear, ordinal, { ...panel15, domain: { min: 0, max: 10 } }).contentReference).not.toBe(panelReference.contentReference);

    const comparison = createBrewingSensoryComparison({
      context: { id: 'beer-context', version: 'v4', kind: 'beer', contentReference: 'beer-context:sha256:fixture', label: 'Pale ale', sourceRefs: [source('context', 'observation')] },
      reference: { id: 'scenario-reference', version: 'r2', kind: 'adopted', contentReference: 'sensory-reference:sha256:fixture', sourceRefs: [source('reference', 'judgment')] },
      candidateOrder: ['candidate-b', 'candidate-a'], candidates: [{ id: 'candidate-b', name: 'Bière B' }, { id: 'candidate-a', name: 'Bière A' }],
      dimensionOrder: [modelReference.contentReference, panelReference.contentReference],
      dimensions: [
        { definition: modelReference, values: [
          { candidateId: 'candidate-b', status: 'hypothetical', range: { min: 42, max: 67 },
            provenance: { sourceRefs: [source('model input', 'research')], modelRef: { id: 'fine-model', version: 'v3' },
              explanation: 'Projection conditionnelle fournie par le modèle.', limitations: ['Matrice non validée indépendamment.'] } },
          { candidateId: 'candidate-a', status: 'unknown', reason: 'Aucune projection disponible pour cette série.',
            provenance: { sourceRefs: [], explanation: 'Donnée inconnue conservée.', limitations: [] } },
        ] },
        { definition: panelReference, values: [
          { candidateId: 'candidate-b', status: 'observed', value: 5.4,
            provenance: { sourceRefs: [source('panel result', 'research')], explanation: 'Moyenne déclarée par le panel.', limitations: [] } },
          { candidateId: 'candidate-a', status: 'nonDocumented', reason: 'Aucune note de panel dans les documents liés à cette série.',
            provenance: { sourceRefs: [source('checked panel archive', 'research')], explanation: 'Recherche documentaire bornée.', limitations: ['La source ne couvre que le panel publié.'] } },
        ] },
      ],
    });
    expect(comparison.candidateOrder).toEqual(['candidate-b', 'candidate-a']);
    expect(comparison.dimensionOrder).toEqual([modelReference.contentReference, panelReference.contentReference]);
    expect(comparison.dimensions).toHaveLength(2);
    expect(comparison.dimensions.map(row => row.referenceGroupId)).toEqual([modelReference.contentReference, panelReference.contentReference]);
    expect(comparison.dimensions[0].values[0]).not.toHaveProperty('central');
    expect(comparison.dimensions[0].values[0]).toMatchObject({ status: 'hypothetical', range: { min: 42, max: 67 } });
    expect(comparison.dimensions[0].values[1]).toMatchObject({ candidateId: 'candidate-a', status: 'unknown' });
    expect(comparison.dimensions[1].values[0]).toMatchObject({ status: 'observed', value: 5.4 });
    expect(comparison.dimensions[1].values[1]).toMatchObject({ candidateId: 'candidate-a', status: 'nonDocumented' });
  });

  it('refuse une valeur hors de sa propre échelle au lieu de la normaliser', () => {
    const metric: BrewingSensoryMetric = { id: 'panel-note', version: 'v1', kind: 'ordinalNote', name: 'Note', meaning: 'Note brute.', unit: 'points', sourceRefs: [source('scale', 'research')] };
    const scale: BrewingSensoryScale = { id: 'panel-0-15', version: 'v1', metricRef: { id: metric.id, version: metric.version }, domain: { min: 0, max: 15 }, sourceRefs: [source('scale', 'research')] };
    const definition = createBrewingSensoryDefinitionReference(pear, metric, scale);
    expect(() => createBrewingSensoryComparison({
      context: { id: 'ctx', version: '1', kind: 'beer', contentReference: 'ctx:fixture', label: 'Bière', sourceRefs: [] },
      reference: { id: 'ref', version: '1', kind: 'adopted', contentReference: 'ref:fixture', sourceRefs: [] },
      candidateOrder: ['a'], candidates: [{ id: 'a', name: 'A' }], dimensionOrder: [definition.contentReference],
      dimensions: [{ definition, values: [{ candidateId: 'a', status: 'observed', value: 42,
        provenance: { sourceRefs: [source('panel result', 'research')], explanation: 'Note source.', limitations: [] } }] }],
    })).toThrow(/hors de l’échelle exacte/);
  });

  it('refuse deux cellules pour la même série et le même groupe', () => {
    const provenance = { sourceRefs: [source('contradictory observations', 'observation')], explanation: 'Deux relevés contradictoires.', limitations: [] };
    const observed: BrewingSensoryComparisonValue = { candidateId: 'series-a', status: 'observed', value: 3, provenance };
    const target: BrewingSensoryComparisonValue = { candidateId: 'series-a', status: 'target', range: { min: 6, max: 7 }, provenance };
    expect(() => singleSeriesComparison([observed, target])).toThrow(/Une seule valeur\/statut/);
  });

  it('refuse une cellule manquante; unknown ou nonDocumented motivé la couvre explicitement', () => {
    expect(() => singleSeriesComparison([])).toThrow(/Couverture sensorielle incomplète/);
    const unknown: BrewingSensoryComparisonValue = { candidateId: 'series-a', status: 'unknown', reason: 'Échelle inconnue.',
      provenance: { sourceRefs: [], explanation: 'La note existe sans échelle exploitable.', limitations: ['Non comparable.'] } };
    expect(singleSeriesComparison([unknown]).dimensions[0].values[0]).toMatchObject({ status: 'unknown', reason: 'Échelle inconnue.' });
  });

  it('refuse le réemploi d’une même version d’échelle avec un autre domaine', () => {
    const metric: BrewingSensoryMetric = { id: 'panel-note', version: 'v1', kind: 'ordinalNote', name: 'Note', meaning: 'Note source.', unit: 'points', sourceRefs: [source('metric', 'research')] };
    const scale15: BrewingSensoryScale = { id: 'scale-panel', version: 'v1', metricRef: { id: metric.id, version: metric.version },
      domain: { min: 0, max: 15 }, sourceRefs: [source('panel scale', 'research')] };
    const scale100: BrewingSensoryScale = { ...scale15, domain: { min: 0, max: 100 } };
    const first = createBrewingSensoryDefinitionReference(pear, metric, scale15);
    const second = createBrewingSensoryDefinitionReference(pear, metric, scale100);
    expect(brewingSensoryDefinitionSetError([first, second])).toMatch(/version d’échelle référence deux domaines différents/);
    expect(() => createBrewingSensoryComparison({
      context: { id: 'ctx', version: '1', kind: 'beer', contentReference: 'ctx:fixture', label: 'Bière', sourceRefs: [] },
      reference: { id: 'ref', version: '1', kind: 'adopted', contentReference: 'ref:fixture', sourceRefs: [] },
      candidateOrder: ['a'], candidates: [{ id: 'a', name: 'A' }], dimensionOrder: [first.contentReference, second.contentReference],
      dimensions: [first, second].map(definition => ({ definition, values: [{ candidateId: 'a', status: 'unknown' as const, reason: 'Pas de valeur.',
        provenance: { sourceRefs: [], explanation: 'Inconnue conservée.', limitations: [] } }] })),
    })).toThrow(/version d’échelle référence deux domaines différents/);
  });

  it('refuse d’utiliser une définition familiale comme une valeur numérique', () => {
    expect(brewingSensoryDimensionError({ ...pear, intensity: 0 })).not.toBeNull();
  });

  it('réutilise les restrictions safeId sans normaliser les IDs des séries', () => {
    const candidates = [
      { id: ' external series ', name: 'Série externe' },
      { id: 'toString', name: 'Méthode héritée autorisée comme libellé' },
      { id: 'valueOf', name: 'Autre propriété héritée autorisée' },
    ];
    expect(brewingSensoryCandidatesError(candidates)).toBeNull();
    assertBrewingSensoryCandidates(candidates);
    expect(candidates.map(candidate => candidate.id)).toEqual([' external series ', 'toString', 'valueOf']);
    for (const id of ['constructor', '__proto__', 'external/candidate']) {
      expect(brewingSensoryCandidatesError([{ id, name: 'Candidat' }])).not.toBeNull();
    }
  });

  it('refuse une même version de dimension avec un contenu/lexique contradictoire', () => {
    const metric: BrewingSensoryMetric = { id: 'panel-note', version: 'v1', kind: 'ordinalNote', name: 'Note',
      meaning: 'Note publiée.', unit: 'points', sourceRefs: [source('metric', 'research')] };
    const scale: BrewingSensoryScale = { id: 'panel-scale', version: 'v1', metricRef: { id: metric.id, version: metric.version },
      domain: { min: 0, max: 15 }, sourceRefs: [source('scale', 'research')] };
    const first = createBrewingSensoryDefinitionReference(pear, metric, scale);
    expect(brewingSensoryDefinitionSetError([first, first])).toMatch(/répétée/);
    const conflicting = createBrewingSensoryDefinitionReference({ ...pear, terms: ['pear', 'quince'] }, metric, scale);
    expect(brewingSensoryDefinitionSetError([first, conflicting])).toMatch(/version de dimension référence deux définitions différentes/);
    const nextVersion = createBrewingSensoryDefinitionReference({ ...pear, version: 'v2', terms: ['pear', 'quince'] }, metric, scale);
    expect(brewingSensoryDefinitionSetError([first, nextVersion])).toBeNull();
    const changedMetric = createBrewingSensoryDefinitionReference(pear, { ...metric, meaning: 'Sens différent.' },
      { ...scale, id: 'panel-scale-next', metricRef: { id: metric.id, version: metric.version } });
    expect(brewingSensoryDefinitionSetError([first, changedMetric])).toMatch(/version de métrique référence deux sens ou unités différents/);
  });
});
