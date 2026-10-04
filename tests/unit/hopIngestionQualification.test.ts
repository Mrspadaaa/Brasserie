import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { HopMeasurement } from '../../functions/src/hopIndexSchema';
import { readHopAnalysis } from '../../src/domain/hopDecision/measurements';
import { introducedHopAmounts } from '../../src/domain/hopDecision/calculations';
import type { HopDecisionMaterial } from '../../src/domain/hopDecision/types';
import hopManufacturer from '../../src/data/hopManufacturerBootstrap.json';
import hopBeerMaverick from '../../src/data/hopBeerMaverickBootstrap.json';

const unqualifiedAnalytes = new Set(['alpha', 'beta', 'totalOil']);
const numeric = (measurement: HopMeasurement) => typeof measurement.value === 'number' || typeof measurement.range?.min === 'number';
const material = (row: typeof hopManufacturer.hopVarieties[number]): HopDecisionMaterial => ({ id: row.id, name: row.name, form: row.form, variety: row });

function findCascade(rows: typeof hopManufacturer.hopVarieties) {
  const row = rows.find(candidate => candidate.name.toLowerCase() === 'cascade');
  if (!row) throw new Error('Cascade fixture is absent from the documentary pack.');
  return row;
}

describe('qualification des bases dans les collectes documentaires', () => {
  it('ne régénère plus asIs par défaut pour les champs sans base déclarée', () => {
    const hopsteiner = readFileSync(new URL('../../scripts/scrape-hopsteiner.mjs', import.meta.url), 'utf8');
    const community = readFileSync(new URL('../../scripts/scrape-hop-community.mjs', import.meta.url), 'utf8');
    expect(hopsteiner).toContain("['Alpha acids %', 'alpha', 'percentMass', 'unknown']");
    expect(hopsteiner).toContain("['Beta acids %', 'beta', 'percentMass', 'unknown']");
    expect(hopsteiner).toContain("['Total oil (ml/100g)', 'totalOil', 'ml100g', 'unknown']");
    expect(community).toContain("[/^Alpha Acid/, 'alpha', 'percentMass', 'unknown']");
    expect(community).toContain("[/^Beta Acid/, 'beta', 'percentMass', 'unknown']");
    expect(community).toContain("[/^Total Oils \\(mL\\/100g\\)/, 'totalOil', 'ml100g', 'unknown']");
  });

  it('garde toutes les valeurs alpha/bêta/huile lisibles sans calculer une charge telle quel', () => {
    const packs = [hopManufacturer, hopBeerMaverick];
    const expected = [
      { rows: 102, measurements: 382, numericRows: 381, unknown: 305, alpha: { min: 4.5, max: 7 }, beta: { min: 4.5, max: 7 }, oil: { min: 0.8, max: 1.5 } },
      { rows: 318, measurements: 1734, numericRows: 1676, unknown: 954, alpha: { min: 4.5, max: 9 }, beta: { min: 4.8, max: 7.5 }, oil: { min: 0.7, max: 2.5 } },
    ];

    packs.forEach((pack, index) => {
      const all = pack.hopVarieties.flatMap(row => row.analysis);
      expect(pack.hopVarieties).toHaveLength(expected[index].rows);
      expect(all).toHaveLength(expected[index].measurements);
      expect(all.filter(numeric)).toHaveLength(expected[index].numericRows);
      expect(all.filter(row => unqualifiedAnalytes.has(row.analyte) && row.basis === 'unknown')).toHaveLength(expected[index].unknown);
      expect(all.filter(row => unqualifiedAnalytes.has(row.analyte) && row.basis === 'asIs')).toHaveLength(0);
      expect(all.filter(row => row.unit === 'percentOil' && row.basis === 'oil')).not.toHaveLength(0);

      const cascade = findCascade(pack.hopVarieties);
      for (const analyte of ['alpha', 'beta', 'totalOil'] as const) {
        const raw = cascade.analysis.find(row => row.analyte === analyte);
        expect(raw).toBeDefined();
        expect(raw?.basis).toBe('unknown');
        expect(numeric(raw!)).toBe(true);
        const reading = readHopAnalysis(material(cascade), analyte);
        expect(reading.status).toBe('unknown');
        expect(reading.measurements[0]).toMatchObject({ basis: 'unknown', analyte });
        expect(numeric(reading.measurements[0])).toBe(true);
        const charge = introducedHopAmounts(material(cascade), 20);
        expect(charge.alphaGrams.status).toBe('unknown');
        expect(charge.oilMl.status).toBe('unknown');
      }
      expect(cascade.analysis.find(row => row.analyte === 'alpha')?.range).toEqual(expected[index].alpha);
      expect(cascade.analysis.find(row => row.analyte === 'beta')?.range).toEqual(expected[index].beta);
      expect(cascade.analysis.find(row => row.analyte === 'totalOil')?.range).toEqual(expected[index].oil);
    });
  });

  it('laisse calculer une base déclarée explicitement, mais garde la matière sèche documentaire sans humidité appariée', () => {
    const source = { title: 'Fixture de contrat explicite', author: 'Test uniquement', year: 2026, kind: 'review' as const,
      reference: 'fixture:explicit-basis', locator: 'Fixture de test; le fournisseur dit explicitement que ce pourcentage porte sur le produit tel que fourni.' };
    const asIs: HopMeasurement = { analyte: 'alpha', unit: 'percentMass', basis: 'asIs', kind: 'point', value: 9, source, confidence: 'medium' };
    const asIsMaterial: HopDecisionMaterial = { id: 'attested', name: 'fixture only', form: 'pelletT90', variety: {
      id: 'attested', name: 'fixture only', aliases: [], form: 'pelletT90', descriptions: [], analysis: [asIs] } };
    expect(readHopAnalysis(asIsMaterial, 'alpha')).toMatchObject({ status: 'nominal', value: 9, unit: '% massique' });
    expect(introducedHopAmounts(asIsMaterial, 20).alphaGrams).toMatchObject({ status: 'nominal', value: 1.8, unit: 'g alpha' });

    const dryMatter: HopMeasurement = { ...asIs, basis: 'dryMatter', value: 6.92, source: {
      title: 'Fractionation of High-Value Compounds from Hops', author: 'Paniagua-García et al.', year: 2024,
      kind: 'research', reference: 'https://doi.org/10.3390/antiox13010045', locator: 'Table 1: Cascade alpha acids, dry basis.' } };
    const dryMaterial: HopDecisionMaterial = { ...asIsMaterial, id: 'dry', variety: { ...asIsMaterial.variety!, id: 'dry', name: 'Cascade dry-basis research sample', analysis: [dryMatter] } };
    expect(readHopAnalysis(dryMaterial, 'alpha', 'documentary')).toMatchObject({ status: 'nominal', value: 6.92, unit: '% matière sèche' });
    expect(introducedHopAmounts(dryMaterial, 20).alphaGrams.status).toBe('unknown');
  });

  it('lit les pourcentages explicitement relatifs à l’huile sans les convertir en masse de houblon', () => {
    const cascade = findCascade(hopManufacturer.hopVarieties);
    const materialWithOilProfile = material(cascade);
    const linalool = cascade.analysis.find(row => row.analyte === 'linalool');
    expect(linalool).toMatchObject({ unit: 'percentOil', basis: 'oil' });
    expect(readHopAnalysis(materialWithOilProfile, 'linalool', 'documentary')).toMatchObject({ status: 'range', unit: '% huile' });
    expect(readHopAnalysis(materialWithOilProfile, 'linalool').status).toBe('unknown');
  });
});
