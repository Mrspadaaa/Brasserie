import { describe, expect, it } from 'vitest';
import enrichment from '../../src/data/yeastEnrichmentLager.json';
import { assertHopKnowledge } from '../../functions/src/hopPredictionSchema';
import { assertYeastCatalogue } from '../../functions/src/yeastCatalogueSchema';
import { hopSourceError } from '../../functions/src/hopIndexSchema';
import { catalogueHash } from '../../scripts/yeast-catalogue/parse.mjs';

const expectedIds = [
  'wyeast-2124', 'wyeast-2308', 'white-labs-wlp830',
  'yeast-fermentis-saflager-s-189', 'yeast-fermentis-saflager-s-e2-80-9123',
  'wyeast-1968', 'white-labs-wlp002'
];
const ref = (id: string) => enrichment.references.find(r => r.id === id)!;
const facts = (id: string, key: string) => ref(id).catalogue.facts.filter(f => f.key === key);
const range = (id: string, key: string) => facts(id, key)[0]?.range;

describe('Complément primaire lager et anglais', () => {
  it('livre sept identités préexistantes, leurs profils et des catalogues strictement valides', () => {
    expect(enrichment.references.map(r => r.id).sort()).toEqual([...expectedIds].sort());
    expect(enrichment.profiles.map(p => p.yeastId).sort()).toEqual([...expectedIds].sort());
    expect(new Set(enrichment.references.map(r => r.id)).size).toBe(7);
    for (const r of enrichment.references) {
      expect(() => assertHopKnowledge(r)).not.toThrow();
      expect(() => assertYeastCatalogue(r.catalogue)).not.toThrow();
      expect(r.catalogue.publishedAt).toBeNull();
      expect(r.catalogue.pageUpdatedAt).toBeNull();
      expect(r.catalogue.contentSha256).toBe(catalogueHash(r.catalogue));
    }
    for (const p of enrichment.profiles) {
      expect(p.styles.length).toBeGreaterThan(0);
      expect(p.styles.every(s => ['lager', 'english-ale', 'clean-ale'].includes(s))).toBe(true);
      expect(hopSourceError(p.source)).toBeNull();
      expect(p).not.toHaveProperty('temperatureEsters');
      expect(p).not.toHaveProperty('headspacePct');
    }
  });

  it('relie chaque fait à exactement un reçu primaire et qualifie les valeurs numériques', () => {
    for (const r of enrichment.references) {
      const receipts = r.catalogue.retrievals;
      expect(new Set(receipts.map(s => s.url)).size).toBe(receipts.length);
      expect(receipts.find(s => s.url === r.source.reference)?.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(receipts.find(s => s.url === r.source.reference)?.sha256).not.toBe(r.catalogue.contentSha256);
      for (const receipt of receipts) {
        expect(receipt.sha256).toMatch(/^[a-f0-9]{64}$/);
        expect(receipt.retrievedAt.startsWith('2026-09-12T')).toBe(true);
        expect(['wyeastlab.com', 'www.whitelabs.com', 'fermentis.com']).toContain(new URL(receipt.url).hostname);
      }
      for (const f of r.catalogue.facts) {
        expect(receipts.filter(s => s.url === f.source.reference)).toHaveLength(1);
        expect(f.source.kind).toBe('manufacturer');
        expect(f.context).toBeTruthy();
        if (f.range) {
          expect(f.unit).toBeTruthy();
          expect(['range', 'reportedPoint']).toContain(f.qualifier);
          expect(f.context).toBe('Beer');
          expect(f.source.locator).toBeTruthy();
        }
      }
    }
  });

  it('conserve les deux conduites de 2124 et la divergence température/esters de 1968', () => {
    expect(range('wyeast-2124', 'temperature')).toEqual({ min: 7, max: 20 });
    expect(facts('wyeast-2124', 'temperature')).toHaveLength(1);
    expect(facts('wyeast-2124', 'application').map(f => f.reported).join(' ')).toContain('Lager/Pilsner : 8–12 °C');
    expect(facts('wyeast-2124', 'application').map(f => f.reported).join(' ')).toContain('Common : 18–20 °C');
    expect(range('wyeast-1968', 'temperature')).toEqual({ min: 18, max: 22 });
    expect(facts('wyeast-1968', 'esters')[0]).toMatchObject({ reported: expect.stringContaining('21–23 °C'), context: expect.stringContaining('ne prolonge pas automatiquement') });
    expect(facts('wyeast-1968', 'temperature')).toHaveLength(1);
  });

  it('ne transforme pas la dose sèche ou la sédimentation Fermentis en donnée universelle', () => {
    for (const id of ['yeast-fermentis-saflager-s-189', 'yeast-fermentis-saflager-s-e2-80-9123']) {
      expect(ref(id).form).toBe('sèche');
      expect(range(id, 'temperature')).toEqual({ min: 12, max: 18 });
      expect(range(id, 'pitchRate')).toEqual({ min: 80, max: 120 });
      expect(facts(id, 'pitchRate')).toHaveLength(1);
      expect(facts(id, 'pitchRate')[0]).toMatchObject({ unit: 'g/hL', qualifier: 'range', context: 'Beer', source: { locator: expect.stringContaining('12–18 °C') } });
      expect(facts(id, 'attenuation')[0].source.locator).toContain('12 °C pendant 48 h puis 14 °C');
      expect(facts(id, 'flocculation')[0]).toMatchObject({ label: 'Sédimentation', reported: 'Sédimentation rapide', context: expect.stringContaining('ne signifie pas') });
      expect(facts(id, 'fermentationTime')).toHaveLength(0);
      expect(facts(id, 'pof')).toHaveLength(0);
      expect(facts(id, 'sta1')).toHaveLength(0);
    }
    expect(ref('yeast-fermentis-saflager-s-e2-80-9123').source.reference).toBe('https://fermentis.com/en/product/saflager-s%e2%80%9123/');
    expect(facts('yeast-fermentis-saflager-s-e2-80-9123', 'esters')[0].context).toContain('conservés séparément');
  });

  it('garde les références liquides sans grammes, sans calcul de poche ou de starter', () => {
    for (const id of ['wyeast-2124', 'wyeast-2308', 'wyeast-1968', 'white-labs-wlp830', 'white-labs-wlp002']) {
      expect(ref(id).form).toBe('liquide');
      expect(facts(id, 'form')).toHaveLength(1);
      expect(facts(id, 'pitchRate')).toHaveLength(0);
      expect(ref(id).catalogue.gaps.join(' ')).toContain('viabilité du lot à renseigner');
    }
  });

  it('préserve les différences de finale et les traits réellement attestés', () => {
    expect(range('wyeast-2308', 'attenuation')).toEqual({ min: 70, max: 74 });
    expect(range('white-labs-wlp830', 'attenuation')).toEqual({ min: 74, max: 79 });
    expect(range('wyeast-1968', 'attenuation')).toEqual({ min: 67, max: 71 });
    expect(range('white-labs-wlp002', 'attenuation')).toEqual({ min: 63, max: 70 });
    expect(range('white-labs-wlp002', 'alcoholTolerance')).toEqual({ min: 5, max: 10 });
    expect(facts('white-labs-wlp002', 'application').map(f => f.reported).join(' ')).toContain('diacétyle');
    expect(ref('white-labs-wlp830').betaLyase).toBe('positive');
    expect(facts('white-labs-wlp830', 'betaLyase')[0].context).toContain('ni rendement');
    for (const r of enrichment.references.filter(r => r.id !== 'white-labs-wlp830')) expect(r.betaLyase).toBe('unknown');
    for (const id of ['white-labs-wlp830', 'white-labs-wlp002']) expect(facts(id, 'sta1')[0].reported).toBe('negative');
    for (const p of enrichment.profiles.filter(p => !p.yeastId.startsWith('white-labs-'))) expect(p).not.toHaveProperty('diastatic');
  });

  it('fait échouer les contrôles si la provenance ou la qualification des plages est retirée', () => {
    const missingReceipts = structuredClone(ref('wyeast-2124').catalogue);
    missingReceipts.retrievals = [];
    expect(() => assertYeastCatalogue(missingReceipts)).toThrow('Traçabilité');
    const unqualified = structuredClone(ref('wyeast-2308').catalogue);
    delete (unqualified.facts[0] as { qualifier?: string }).qualifier;
    expect(() => assertYeastCatalogue(unqualified)).toThrow('qualificatif');
  });
});
