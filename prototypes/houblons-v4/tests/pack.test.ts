import './temoin'; // témoin négatif de check:engine (B3)
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildAll } from '../src/pack/buildPack';

const file = path.resolve(__dirname, '../data/pack-mini-protos.json');
const fichesFile = path.resolve(__dirname, '../data/pack-fiches.json');

describe('Pack des mini-prototypes', () => {
  // Fin de ligne normalisée : Git peut extraire le fichier en CRLF sous Windows.
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const stored = JSON.parse(text);
  const built = buildAll();

  it('les chiffres du pack et des fiches sont exactement ceux que rend le moteur', () => {
    expect(stored).toEqual(JSON.parse(JSON.stringify(built.pack)));
    if (built.fiches) {
      expect(stored.meta.fichesHoublons.fichier).toBe('prototypes/houblons-v4/data/pack-fiches.json');
      expect(JSON.parse(fs.readFileSync(fichesFile, 'utf8'))).toEqual(JSON.parse(JSON.stringify(built.fiches)));
    } else expect(stored.fichesHoublons.length).toBeGreaterThan(0);
  });

  it('forme : JSON simple sous 400 ko, 12 familles, 3 styles, stock et catalogue, 3 scénarios', () => {
    // Plafond relevé de 400 à 500 ko (décision réversible du 18.10.2026, voir scripts/build-pack.ts).
    // D85, 26.10 : plafond relevé à 560 ko ; descripteurs de 12 sources (d4) ; prototype seulement, l'app n'est pas concernée.
    // D195, 27.10 : plafond relevé à 600 ko (553 → 578 ko) ; la liste de S1 garde ses remplacements qui font baisser le résineux (REMPLACEMENTS_RESERVES : 17 → 21 voies) ; prototype seulement.
    expect(Buffer.byteLength(text)).toBeLessThan(600 * 1024);
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
      // Une voie de houblon porte ses actions en g et g/L ; un changement de levure, son yeastChange.
      if (v.yeastChange) expect(v.actions).toEqual([]);
      else { expect(v.actions[0]).toHaveProperty('grams'); expect(v.actions[0]).toHaveProperty('gramsPerLitre'); }
      expect(v.profilApresNiveaux).toHaveLength(12);
      expect(v.ibu).toHaveProperty('after');
      expect(['suffisant', 'manque', 'à acheter']).toContain(v.stock.status);
    }
    // Aucune plage pleine sans « non situé » ; dégustation : null partout sauf la résine dite par le brasseur.
    const estimates = [...stored.stock, ...stored.catalogue].flatMap((h: { profile: object }) => Object.values(h.profile))
      .concat(Object.values(S1.before)) as { completeDomain?: boolean; display?: string }[];
    for (const e of estimates) if (e.completeDomain) expect(e.display).toBe('non situé');
    expect(S1.tasting.axes.filter((a: { perceived: string | null }) => a.perceived !== null)).toEqual([expect.objectContaining({ family: 'resin', perceived: 'marqué' })]);
    expect(S1.horsModele[0].leads.every((l: { horsModele: boolean }) => l.horsModele)).toBe(true);
    expect(S1.reading.map((r: { family: string }) => r.family)).toEqual(stored.styles['16D'].order);
    expect(S1.readingSummary.sentence).toBeTruthy();
    expect(S1.readingSummary.voiesSentence).toBeTruthy();
    expect(stored.scenarios.S2.readingSummary.sentence).toBeTruthy();
    for (const q of [S1.ajoutsRapides, stored.scenarios.S2.ajoutsRapides]) {
      expect(q.disponibles.length).toBeGreaterThan(0);
      expect(q.rule.length).toBeGreaterThan(0);
      expect(q.disponibles[0]).toEqual(expect.objectContaining({ rank: 1, moment: expect.any(String), dose: expect.objectContaining({ grams: expect.any(Number), gramsPerLitre: expect.any(Number) }) }));
    }
    for (const s of [stored.scenarios.S4, stored.scenarios.S5]) {
      for (const k of ['recetteHoublons', 'ajoutsRapides', 'profilBiere', 'cibleStyle', 'readingSummary']) expect(s).toHaveProperty(k);
      expect(s.tasting).toBeNull();
    }
    expect(stored.scenarios.S4.ibu).toBe(0);
    expect(stored.scenarios.S5.recetteHoublons).toHaveLength(4);
    expect(stored.scenarios.S2.pairs).toHaveLength(3);
    expect(stored.scenarios.S3.ranked.length).toBe(stored.stock.length);
    // JSON simple : il se relit et se réécrit à l'identique (aucune valeur non sérialisable).
    expect(JSON.stringify(stored) + '\n').toBe(text);
  });
});
