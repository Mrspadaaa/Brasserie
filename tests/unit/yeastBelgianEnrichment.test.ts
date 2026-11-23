import { describe, expect, it } from 'vitest';
import { assertHopKnowledge, type HopYeast } from '../../functions/src/hopPredictionSchema';
import { hopSourceError } from '../../functions/src/hopIndexSchema';
import { catalogueHash } from '../../scripts/yeast-catalogue/parse.mjs';
import data from '../../src/data/yeastEnrichmentBelgian.json';

const references = data.references as HopYeast[];
const ids = ['wyeast-1214', 'wyeast-3787', 'wyeast-3522', 'wyeast-3711', 'white-labs-wlp500', 'white-labs-wlp530', 'yeast-fermentis-safale-be-e2-80-91256'];
const ref = (id: string) => references.find(row => row.id === id)!;
const facts = (id: string, key: string) => ref(id).catalogue!.facts.filter(f => f.key === key);
const profile = (id: string) => data.profiles.find(row => row.yeastId === id)!;

describe('Choix belges et saison : faits utiles, distincts et traçables', () => {
  it('réutilise les sept identifiants existants et valide les références strictes', () => {
    expect(references.map(row => row.id).sort()).toEqual([...ids].sort());
    expect(data.profiles.map(row => row.yeastId).sort()).toEqual([...ids].sort());
    references.forEach(row => expect(() => assertHopKnowledge(row)).not.toThrow());
    expect(Object.keys(data).sort()).toEqual(['profiles', 'references']);
  });

  it.each([
    ['wyeast-1214', 20, 26, 74, 78, 12, 12, 'reportedPoint'],
    ['wyeast-3787', 18, 26, 74, 78, 11, 12, 'range'],
    ['wyeast-3522', 18, 24, 72, 76, 12, 12, 'reportedPoint'],
    ['wyeast-3711', 18, 25, 77, 83, 12, 12, 'reportedPoint'],
    ['white-labs-wlp500', 18, 22, 75, 80, 10, 15, 'range'],
    ['white-labs-wlp530', 19, 22, 75, 80, 8, 12, 'range'],
    ['yeast-fermentis-safale-be-e2-80-91256', 18, 26, 82, 86, 9, 11, 'range'],
  ])('%s conserve les valeurs fabricant et la nature des tolérances', (id, tMin, tMax, aMin, aMax, abvMin, abvMax, qualifier) => {
    expect(facts(String(id), 'temperature')[0]).toMatchObject({ range: { min: tMin, max: tMax }, unit: '°C', qualifier: 'range' });
    expect(facts(String(id), 'attenuation')[0]).toMatchObject({ range: { min: aMin, max: aMax }, unit: '%', qualifier: 'range' });
    expect(facts(String(id), 'alcoholTolerance')[0]).toMatchObject({ range: { min: abvMin, max: abvMax }, unit: '%', qualifier });
    expect(facts(String(id), 'temperature')[0].context).toBe('Beer');
    expect(facts(String(id), 'attenuation')[0].context).toBe('Beer');
  });

  it('distingue forme sèche et liquide avec une observation documentaire', () => {
    for (const row of references) {
      expect(row.form).toBe(row.id.startsWith('yeast-fermentis') ? 'sèche' : 'liquide');
      const formFacts = facts(row.id, 'form');
      expect(formFacts.length).toBeGreaterThan(0);
      expect(formFacts.map(f => f.reported).join(' ')).toMatch(row.form === 'sèche' ? /sèche/i : /liquide/i);
    }
    for (const id of ['white-labs-wlp500', 'white-labs-wlp530']) {
      expect(facts(id, 'form').map(f => f.context).join(' ')).toMatch(/Core.*PurePitch/s);
    }
  });

  it('relie chaque fait et profil à un téléchargement exact, sans dater la publication au jour de collecte', () => {
    for (const row of references) {
      const cat = row.catalogue!;
      expect(cat.productId).toBe(row.source.reference);
      expect(cat.publishedAt).toBeNull();
      expect(cat.pageUpdatedAt).toBeNull();
      expect(cat.contentSha256).toBe(catalogueHash(cat));
      for (const source of [row.source, profile(row.id).source, ...cat.facts.map(f => f.source)]) {
        expect(hopSourceError(source)).toBeNull();
        expect(source.kind).toBe('manufacturer');
        expect(source.year).toBeNull();
        expect(cat.retrievals.filter(r => r.url === source.reference)).toHaveLength(1);
      }
      for (const receipt of cat.retrievals) {
        expect(receipt.sha256).toMatch(/^[a-f0-9]{64}$/);
        expect(receipt.retrievedAt.startsWith('2026-09-12')).toBe(true);
      }
    }
  });

  it('sépare l’empreinte des faits normalisés des reçus HTTP et détecte une correction personnelle', () => {
    const cat = structuredClone(ref('wyeast-1214').catalogue!);
    expect(cat.contentSha256).not.toBe(cat.retrievals[0].sha256);
    cat.retrievals[0].retrievedAt = '2026-09-13T00:00:00Z';
    expect(catalogueHash(cat)).toBe(cat.contentSha256);
    cat.facts[0].reported = 'Observation personnelle corrigée';
    expect(catalogueHash(cat)).not.toBe(cat.contentSha256);
  });

  it('propose une famille éditoriale limitée, sans rendre les souches interchangeables', () => {
    for (const row of data.profiles) {
      expect(row.styles).toEqual(row.yeastId === 'wyeast-3711' ? ['saison', 'belgian-ale'] : ['belgian-ale']);
      expect(row.descriptor.trim().length).toBeGreaterThan(15);
      expect(Object.keys(row.affinities).length).toBeGreaterThan(0);
      expect(Object.values(row.affinities).every(value => typeof value === 'string' && value.trim())).toBe(true);
      expect(row).not.toHaveProperty('temperatureEsters');
      expect(row).not.toHaveProperty('headspacePct');
    }
    expect(new Set(data.profiles.map(row => row.descriptor)).size).toBe(7);
    expect(JSON.stringify(data)).not.toMatch(/Chimay|Westmalle|équivalent(?:e)? (?:à|de)|clone (?:de|du)|sensoryScore|conversionYield/i);
  });

  it('ne confond pas description épicée, POF, STA1 et aptitude à libérer les thiols', () => {
    expect(profile('wyeast-3711')).toMatchObject({ diastatic: true });
    expect(profile('wyeast-3711')).not.toHaveProperty('phenolic');
    expect(facts('wyeast-3711', 'pof')).toHaveLength(0);
    expect(facts('wyeast-3711', 'sta1')[0].reported).toBe('positive');
    expect(facts('wyeast-3711', 'sta1')[0].context).toMatch(/PCR/);
    expect(profile('wyeast-3787')).toMatchObject({ phenolic: true });
    for (const id of ['wyeast-1214', 'wyeast-3522']) {
      expect(profile(id)).not.toHaveProperty('phenolic');
      expect(profile(id)).not.toHaveProperty('diastatic');
      expect(facts(id, 'sta1')).toHaveLength(0);
      expect(facts(id, 'pof')).toHaveLength(0);
    }
    for (const id of ['white-labs-wlp500', 'white-labs-wlp530']) {
      expect(facts(id, 'sta1')[0].reported).toBe('negative');
      expect(facts(id, 'pof')).toHaveLength(0);
      expect(profile(id)).not.toHaveProperty('phenolic');
    }
    expect(profile('yeast-fermentis-safale-be-e2-80-91256')).toMatchObject({ phenolic: false });
    expect(facts('yeast-fermentis-safale-be-e2-80-91256', 'pof')[0].reported).toBe('negative');
    expect(profile('yeast-fermentis-safale-be-e2-80-91256')).not.toHaveProperty('diastatic');
    expect(references.every(row => row.betaLyase === 'unknown')).toBe(true);
  });

  it('préserve les comportements utiles et la nuance de flocculation WLP530', () => {
    expect(facts('wyeast-1214', 'fermentationRate')[0].reported).toMatch(/démarrage.*lent/i);
    expect(facts('wyeast-3787', 'foam')[0].reported).toMatch(/espace libre/i);
    expect(facts('wyeast-3787', 'foam')[0].reported).not.toMatch(/\d/);
    expect(facts('wyeast-3787', 'foam')[0]).not.toHaveProperty('range');
    expect(facts('wyeast-3522', 'flocculation')[0].reported).toMatch(/haute/i);
    expect(facts('white-labs-wlp530', 'flocculation')[0].reported).toMatch(/moyenne à haute.*moyenne/i);
    expect(facts('white-labs-wlp500', 'application').map(f => f.reported).join(' ')).toMatch(/18–19 °C.*moins fruité/i);
  });

  it('réserve la dose sèche à BE-256 et sépare réhydratation, fermentation et récolte', () => {
    const id = 'yeast-fermentis-safale-be-e2-80-91256';
    expect(facts(id, 'pitchRate')[0]).toMatchObject({ range: { min: 50, max: 80 }, unit: 'g/hL', qualifier: 'range' });
    expect(facts(id, 'pitchRate')[0].context).toBe('Beer');
    expect(references.filter(row => facts(row.id, 'pitchRate').length).map(row => row.id)).toEqual([id]);
    const practical = facts(id, 'application').map(f => f.reported).join(' ');
    expect(practical).toMatch(/réhydratation.*25–29 °C.*15–30 min/i);
    expect(practical).toMatch(/récolt.*après.*fermentation/i);
    expect(facts(id, 'fermentationTime')).toHaveLength(0);
    expect(facts(id, 'flocculation')[0].context).toMatch(/sédimentation.*flocculation/i);
  });

  it('reste qualitatif sur houblons, mousse et résultat de fermentation', () => {
    expect(facts('wyeast-3711', 'application').map(f => f.reported).join(' ')).toMatch(/houblons/i);
    expect(facts('wyeast-3711', 'application').map(f => f.context).join(' ')).toMatch(/thiols|conversion/);
    for (const row of references) {
      expect(facts(row.id, 'styles').length).toBeGreaterThan(0);
      expect(facts(row.id, 'application').length).toBeGreaterThan(0);
      expect(row.catalogue!.gaps.join(' ')).toMatch(/pression/i);
      expect(row.catalogue!.facts.every(f => f.key !== 'fermentationTime')).toBe(true);
    }
  });
});
