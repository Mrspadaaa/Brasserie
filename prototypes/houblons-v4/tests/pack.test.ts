import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPack } from '../src/pack/buildPack';

const file = path.resolve(__dirname, '../data/pack-mini-protos.json');

describe('Pack des mini-prototypes', () => {
  // Fin de ligne normalisée : Git peut extraire le fichier en CRLF sous Windows.
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const stored = JSON.parse(text);

  it('les chiffres du pack sont exactement ceux que rend le moteur', () => {
    expect(stored).toEqual(JSON.parse(JSON.stringify(buildPack())));
  });

  it('forme : JSON simple sous 400 ko, 12 familles, 3 styles, stock et catalogue, 3 scénarios', () => {
    expect(Buffer.byteLength(text)).toBeLessThan(400 * 1024);
    expect(stored.meta.status).toBe('à valider par le brasseur');
    expect(stored.meta.bands.version).toBeTruthy();
    expect(stored.families.map((f: { order: number }) => f.order)).toEqual([...Array(12).keys()]);
    expect(Object.keys(stored.styles)).toEqual(['16D', '3A', '3B', '21A']);
    expect(stored.scenarios.S2.style).toBe('3B');
    expect(stored.styles['3B'].families.floral).toMatchObject({ status: 'attendue', band: [33, 68] });
    for (const s of Object.values(stored.styles) as { families: Record<string, { band: number[]; status: string; threshold: number }>; ibu: number[] }[]) {
      expect(s.ibu).toHaveLength(2);
      for (const f of Object.values(s.families)) { expect(f.band).toHaveLength(2); expect(['attendue', 'neutre', 'indésirable']).toContain(f.status); expect(f.threshold).toBeGreaterThan(0); }
    }
    expect(stored.stock.length).toBeGreaterThanOrEqual(9);
    expect(stored.catalogue).toHaveLength(25);
    for (const h of [...stored.stock, ...stored.catalogue]) {
      expect(Object.keys(h.profile)).toHaveLength(12);
      for (const e of Object.values(h.profile) as { status: string; min?: number; max?: number }[]) {
        if (e.status === 'inconnu') expect(e.min).toBeUndefined();
        else expect(e.max!).toBeGreaterThanOrEqual(e.min!);
      }
    }
    const S1 = stored.scenarios.S1;
    expect(S1.recipe).toMatchObject({ volumeL: 20, og: 1.066, styleCode: '16D' });
    expect(S1.voies.length).toBeGreaterThanOrEqual(5);
    for (const v of S1.voies) {
      expect(typeof v.estimated).toBe('boolean');
      expect(v.actions[0]).toHaveProperty('grams');
      expect(v.actions[0]).toHaveProperty('gramsPerLitre');
      expect(v.after).not.toBeNull();
      expect(v.ibu).toHaveProperty('after');
      expect(['suffisant', 'manque', 'à acheter']).toContain(v.stock.status);
    }
    expect(stored.scenarios.S2.pairs).toHaveLength(3);
    expect(stored.scenarios.S3.ranked.length).toBe(stored.stock.length);
    // JSON simple : il se relit et se réécrit à l'identique (aucune valeur non sérialisable).
    expect(JSON.stringify(stored) + '\n').toBe(text);
  });
});
