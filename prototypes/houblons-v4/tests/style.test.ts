import './temoin'; // témoin négatif de check:engine (B3)
import { describe, expect, it } from 'vitest';
import bandsFile from '../data/style-bands.json';
import { deriveStyle } from '../scripts/build-bands.mjs';
import { STATEMENTS } from '../scripts/bjcp-statements.mjs';
import { FAMILIES, gapVerdict, getStyleScale, hopProfile, trackPosition, trackShare, valueVerdict } from '../src/engine';

const point = (x: number) => ({ range: { min: x, max: x } });

describe('Échelles au style', () => {
  it('une même différence de 8 points de floral pèse nettement plus en Czech Pale Lager qu’en American IPA, et le verdict diffère', () => {
    const lager = getStyleScale('3A').families.floral, ipa = getStyleScale('21A').families.floral;
    const shareLager = trackShare(8, lager), shareIpa = trackShare(8, ipa);
    expect(shareLager).toBeGreaterThan(2 * shareIpa);
    expect(gapVerdict(point(20), point(28), lager).verdict).toBe('écart');
    expect(gapVerdict(point(20), point(28), ipa).verdict).toBe('≈');
    expect(gapVerdict(point(20), point(28), ipa).why).toBe('sous le seuil');
  });

  it('deux plages larges qui se recouvrent donnent « ≈ » en lager comme en IPA, même si leurs repères centraux s’écartent', () => {
    const a = { range: { min: 10, max: 60 }, central: 30 }, b = { range: { min: 20, max: 70 }, central: 45 };
    for (const code of ['3A', '21A']) {
      const g = gapVerdict(a, b, getStyleScale(code).families.floral);
      expect(g.verdict).toBe('≈');
      expect(g.why).toBe('plages recouvrantes');
    }
    // Sur la piste lager, 15 points de repère central dépasseraient pourtant le seuil (7,5) : le recouvrement prime.
    expect(15).toBeGreaterThan(getStyleScale('3A').families.floral.threshold);
  });

  it('les profils V5.5 de Saaz, Styrian Golding et Hallertau Mittelfrüh restent indiscernables en lager (aucune finesse inventée)', () => {
    const lager = getStyleScale('3A');
    const [saaz, styrian, hallertau] = ['saaz-cz', 'styrian-golding', 'hallertau-mittelfruh'].map((id) => hopProfile(`beermaverick-${id}`, { yeastId: 'lalbrew-diamond' }));
    for (const [x, y] of [[saaz, styrian], [saaz, hallertau], [styrian, hallertau]]) {
      const g = gapVerdict(x.families.floral, y.families.floral, lager.families.floral);
      expect(g.verdict).toBe('≈');
    }
  });

  it('un style non documenté revient à l’échelle absolue et l’annonce', () => {
    const s = getStyleScale('1B');
    expect(s.documented).toBe(false);
    expect(s.notice).toMatch(/échelle absolue/);
    for (const f of FAMILIES) {
      expect(s.families[f].band).toBeNull();
      expect(s.families[f].domain).toEqual([0, 100]);
    }
    expect(valueVerdict({ range: { min: 30, max: 40 } }, s.families.floral).verdict).toBe('sans bande');
    expect(getStyleScale('style-inexistant').documented).toBe(false);
  });

  it('les bandes sont propres à chaque style et à chaque famille : aucun coefficient uniforme de style', () => {
    const stout = getStyleScale('16D'), ipa = getStyleScale('21A'), lager = getStyleScale('3A');
    const ratios = (a: typeof stout, b: typeof stout) => new Set(FAMILIES.map((f) => (a.families[f].band![1] - a.families[f].band![0]) / (b.families[f].band![1] - b.families[f].band![0])).map((r) => r.toFixed(3)));
    expect(ratios(stout, ipa).size).toBeGreaterThan(1);
    expect(ratios(lager, ipa).size).toBeGreaterThan(1);
    expect(stout.families.floral).toMatchObject({ status: 'attendue', band: [0, 55] });
    expect(stout.families.resin).toMatchObject({ status: 'neutre', band: [0, 30] });
    expect(lager.families.floral).toMatchObject({ status: 'neutre', band: [0, 30] });
    expect(getStyleScale('3B').families.floral).toMatchObject({ status: 'attendue', band: [33, 68] });
    expect(getStyleScale('21C').families.herbal).toMatchObject({ status: 'indésirable', band: [0, 5] });
  });

  it('data/style-bands.json est versionné, « à valider », et identique aux règles appliquées aux phrases BJCP', () => {
    expect(bandsFile.status).toBe('à valider par le brasseur');
    expect(bandsFile.words.version).toBe('mots-bjcp-v1');
    for (const [code, statements] of Object.entries(STATEMENTS)) {
      const fresh = deriveStyle(code, statements as never);
      const stored = (bandsFile.styles as Record<string, { families: unknown; overall: unknown; url: string }>)[code];
      expect(stored.families).toEqual(fresh.families);
      expect(stored.overall).toEqual(fresh.overall);
      expect(stored.url).toMatch(/^https:\/\/www\.bjcp\.org\/style\/2021\//);
    }
    for (const code of ['15B', '15C', '16A', '16B', '16C', '16D', '20B', '20C', '3A', '3B', '5D', '21A', '21C', '25B', '24A']) expect(Object.keys(bandsFile.styles)).toContain(code);
  });

  it('ordre canonique stable : familles attendues d’abord, puis indésirables, puis neutres', () => {
    expect(getStyleScale('16D').order.slice(0, 3)).toEqual(['floral', 'herbal', 'earthy']);
    expect(getStyleScale('21C').order.slice(6, 8)).toEqual(['herbal', 'green']);
    expect(getStyleScale('16D').order).toEqual(getStyleScale('foreign-extra-stout').order);
    expect(new Set(getStyleScale('3A').order).size).toBe(12);
  });

  it('piste zoomée, verdicts d’une plage et inconnue', () => {
    const floral = getStyleScale('3A').families.floral;
    expect(floral.domain).toEqual([0, 45]);
    expect(trackPosition(50, floral)).toEqual({ x: 1, clipped: 'above' });
    expect(valueVerdict({ range: { min: 5, max: 20 } }, floral).verdict).toBe('au style');
    expect(valueVerdict({ range: { min: 35, max: 40 } }, floral).verdict).toBe('trop');
    expect(valueVerdict({ range: { min: 10, max: 20 } }, getStyleScale('21C').families.green).verdict).toBe('hors style');
    expect(valueVerdict({ range: { min: 0, max: 100 }, central: 12 }, floral)).toEqual({ verdict: 'incertain', byCentral: 'au style' });
    expect(valueVerdict({ range: null }, floral).verdict).toBe('inconnu');
    expect(gapVerdict({ range: null }, point(3), floral).verdict).toBe('inconnu');
  });
});
