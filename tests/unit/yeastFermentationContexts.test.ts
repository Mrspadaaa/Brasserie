import { describe, expect, it } from 'vitest';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import type { YeastCatalogueFact } from '../../functions/src/yeastCatalogueSchema';
import { agreedFermentationFact } from '../../functions/src/fermentationContext';
import { parseProduct } from '../../scripts/yeast-catalogue/parse.mjs';
import core from '../../src/data/yeastCoreReferences.json';

const conversion = 'Conversion exacte Fahrenheit → Celsius, arrondie au dixième.';
const base = core.find(row => row.catalogue)! as HopYeast;
const source = base.source;
const fact = (changes: Partial<YeastCatalogueFact> = {}): YeastCatalogueFact => ({
  key: 'temperature', label: 'Température', reported: '60–72 °F',
  range: { min: 15.6, max: 22.2 }, unit: '°C', qualifier: 'range', source, ...changes
});
const yeast = (...facts: YeastCatalogueFact[]): HopYeast => ({ ...base, catalogue: { ...base.catalogue!, facts } });

describe('Contextes documentaires des plages de fermentation', () => {
  it('accepte la note exacte réellement produite par le collecteur Fahrenheit', () => {
    const data = { code: 'A07', title: 'Flagship', low_temperature: 60, high_temperature: 72 };
    const html = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { data } } })}</script>`;
    const parsed = parseProduct({ id: 'imperial', name: 'Imperial Yeast' }, {
      name: 'A07 Flagship', url: 'https://www.imperialyeast.com/yeast-strains/flagship', inventory: {}
    }, html);
    const converted = parsed.facts.find((row: YeastCatalogueFact) => row.key === 'temperature') as YeastCatalogueFact;
    expect(converted).toMatchObject({ context: conversion, range: { min: 15.6, max: 22.2 }, unit: '°C', qualifier: 'range', reported: '60–72 °F' });
    expect(agreedFermentationFact(yeast(converted), 'temperature', '°C')).toEqual({ range: converted.range, source: converted.source });
  });

  it.each([undefined, 'Beer', conversion])('accepte le contexte de température autorisé %s sans convertir une deuxième fois', context => {
    const original = yeast(fact({ context })), before = structuredClone(original);
    expect(agreedFermentationFact(original, 'temperature', '°C')).toEqual({ range: { min: 15.6, max: 22.2 }, source });
    expect(original).toEqual(before);
  });

  it.each([
    ['attenuation', '%'], ['pitchRate', 'g/hL']
  ] as const)('n’étend pas la note de conversion à %s', (key, unit) => {
    const documented = fact({ key, unit, range: { min: 70, max: 80 }, reported: '70–80', context: conversion });
    expect(agreedFermentationFact(yeast(documented), key, unit)).toBeUndefined();
    expect(agreedFermentationFact(yeast({ ...documented, context: 'Beer' }), key, unit)?.range).toEqual({ min: 70, max: 80 });
  });

  it.each([
    'Wine', 'Beer, moût de 12 °P', 'Fermentation sous pression',
    'Conversion exacte Fahrenheit → Celsius, arrondie au dixième. À 12 °P.',
    'Conversion exacte Fahrenheit -> Celsius, arrondie au dixième.',
    'Unités Celsius/Fahrenheit contradictoires dans la source ; plage numérique non utilisée.'
  ])('laisse inconnue une condition ou annotation différente : %s', context => {
    expect(agreedFermentationFact(yeast(fact({ context })), 'temperature', '°C')).toBeUndefined();
  });

  it.each(['reportedPoint', 'atLeast', 'upTo', undefined] as const)('ne transforme pas le qualificatif %s en fenêtre de fonctionnement', qualifier => {
    expect(agreedFermentationFact(yeast(fact({ qualifier, range: { min: 20, max: 20 }, context: conversion })), 'temperature', '°C')).toBeUndefined();
  });

  it('garde inconnues une valeur absente, une unité différente et une contradiction numérique', () => {
    expect(agreedFermentationFact(undefined, 'temperature', '°C')).toBeUndefined();
    expect(agreedFermentationFact(yeast(), 'temperature', '°C')).toBeUndefined();
    expect(agreedFermentationFact(yeast(fact({ range: undefined, unit: undefined, qualifier: undefined })), 'temperature', '°C')).toBeUndefined();
    expect(agreedFermentationFact(yeast(fact()), 'temperature', '°F')).toBeUndefined();
    expect(agreedFermentationFact(yeast(fact({ context: conversion }), fact({ range: { min: 16, max: 22 }, context: 'Beer' })), 'temperature', '°C')).toBeUndefined();
  });

  it('accepte des plages concordantes avec les seuls contextes autorisés et conserve la première source', () => {
    const first = fact({ context: conversion }), second = fact({ context: 'Beer', source: { ...source, title: 'Deuxième observation de contrôle' } });
    const result = agreedFermentationFact(yeast(first, second), 'temperature', '°C');
    expect(result).toEqual({ range: first.range, source: first.source });
    expect(result!.source).toBe(first.source);
  });

  it('ne masque pas une réserve, une borne ou une contradiction textuelle derrière une plage autorisée', () => {
    const accepted = fact({ context: conversion });
    const unsafe = [
      fact({ context: 'Fermentation sous pression' }),
      fact({ qualifier: 'upTo', range: { min: 22.2, max: 22.2 } }),
      fact({ reported: 'Plage contradictoire', range: undefined, unit: undefined, qualifier: undefined })
    ];
    for (const observation of unsafe) {
      expect(agreedFermentationFact(yeast(accepted, observation), 'temperature', '°C')).toBeUndefined();
      expect(agreedFermentationFact(yeast(observation, accepted), 'temperature', '°C')).toBeUndefined();
    }
  });

  it('ne mélange pas les contextes d’un autre fait à la fenêtre de température', () => {
    expect(agreedFermentationFact(yeast(fact({ context: conversion }), fact({ key: 'attenuation', unit: '%', range: { min: 70, max: 80 }, context: 'Wine' })), 'temperature', '°C')?.range).toEqual({ min: 15.6, max: 22.2 });
  });
});
