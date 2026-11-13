import { describe, expect, it } from 'vitest';
import type { StockItem } from '../../../src/types';
import { construireMur, familleBrasseur, initialeSouche, teinteArome, cartesAutres, type SourcesMur } from '../../../src/domain/stock/murDonnees';
import { sourcesDeLApp } from '../../../src/domain/stock/murSources';

const it0 = (o: Partial<StockItem>): StockItem => ({ id: o.ref ?? 'x', ref: 'x', name: 'x', category: 'Malt', unit: 'kg', currentStock: 1, reorder: false, ...o } as StockItem);
const src: SourcesMur = {
  houblon: (i) => ({ id: i.name.toLowerCase(), role: null, origine: i.origin ?? null, arome: null }),
  parts: (id) => (id === 'citra' ? { '21C': 0.4, '21A': 0.2 } : id === 'saaz' ? { '3B': 0.5 } : null),
  auFrais: (id) => (id === 'citra' ? 0.8 : null),
  typeMalt: (i) => (/pilsner/i.test(i.name) ? 'base' : /chocolat/i.test(i.name) ? 'torrefies' : null),
  colonneLevure: (i) => (/us-05/i.test(i.name) ? 'ipa' : null),
  attenuation: (i) => i.yeastAttenuationPct ?? null,
};

describe('mur du stock : adaptateur', () => {
  it('range les malts par type, du plus clair au plus foncé, EBC inconnu gris sans être 0', () => {
    const m = construireMur([it0({ ref: 'a', name: 'Pilsner', colorEbc: 3.5, currentStock: 120 }), it0({ ref: 'b', name: 'Malt chocolat', colorEbc: 900, currentStock: 1.5 }), it0({ ref: 'c', name: 'Mystère' })], src);
    const malts = m.rayons[0];
    expect(malts.groupes.map((g) => g.id)).toEqual(['base', 'torrefies', 'speciaux']);
    const inconnu = malts.groupes[2].marques[0];
    expect(inconnu.fill).toBe('#9a9a9a');
    expect(inconnu.titre).toContain('EBC non connu');
    expect(malts.groupes[0].marques[0].hauteur).toBeGreaterThan(malts.groupes[1].marques[0].hauteur);
  });
  it('place les houblons par style ; α inconnu = hachuré ; épuisé = marque vide', () => {
    const m = construireMur([it0({ ref: 'h1', name: 'Citra', category: 'Houblon', unit: 'g', currentStock: 500, alphaPct: 12 }), it0({ ref: 'h2', name: 'Saaz', category: 'Houblon', unit: 'g', currentStock: 0 })], src);
    const r = m.rayons[1];
    expect(r.groupes.map((g) => g.id)).toEqual(['hazy', 'lager']);
    expect(r.groupes[1].marques[0].etat).toBe('epuise');
    expect(r.groupes[1].marques[0].hachure).not.toBeNull();
    expect(r.groupes[0].marques[0].hachure).toBeNull();
    expect(r.vides.length).toBeLessThanOrEqual(3);
  });
  it('compte les levures en sachets et en fioles', () => {
    const m = construireMur([it0({ ref: 'l1', name: 'SafAle US-05', category: 'Levure', unit: 'sachet', currentStock: 4, yeastAttenuationPct: 80 }), it0({ ref: 'l2', name: 'WLP002', category: 'Levure', unit: 'fiole', currentStock: 2, yeastForm: 'liquide' })], src);
    const [ipa, autres] = m.rayons[2].groupes;
    expect(ipa.sachets).toBe(4);
    expect(autres.fioles).toBe(2);
    expect(autres.marques[0].inconnue).toBe(true);
  });
  it('famille de brasseur, teinte et initiale', () => {
    expect(familleBrasseur({ id: 's', role: null, origine: 'CZ', arome: null }, 3.5, 0.2)).toBe('nobles');
    expect(familleBrasseur({ id: 'c', role: null, origine: 'US', arome: null }, 12, 0.8)).toBe('modernes');
    expect(familleBrasseur(null, null, null)).toBe('autre');
    expect(teinteArome([4, 1, 0, 0, 0, 0, 0, 0, 0])).toBe('agrumes');
    expect(teinteArome([2, 2, 0, 0, 0, 0, 0, 0, 0])).toBe('nonclasse');
    expect(teinteArome(null)).toBe('nonclasse');
    expect(initialeSouche('SafAle US-05')).toBe('U');
    expect(initialeSouche('SafAle WB-06')).toBe('B6');
    expect(initialeSouche('LalBrew Nottingham')).toBe('N');
  });
  it('autres stocks : bas, à réparer', () => {
    const c = cartesAutres([it0({ ref: 'e', name: 'Capsules', category: 'Emballage', unit: 'pièce', currentStock: 1, minStock: 5 })], [{ id: 'q', ref: 'q', name: 'Pompe', category: 'Brassage', state: 'À réparer' }], []);
    expect(c.find((x) => x.nom === 'Emballage')?.lignes[0]).toMatchObject({ n: 1, texte: 'bas' });
    expect(c.find((x) => x.nom === 'Matériel')?.lignes[0]).toMatchObject({ n: 1, texte: 'à réparer', alerte: true });
  });
  it('sources réelles : Cascade a des parts de style et un type de malt est lu', () => {
    expect(sourcesDeLApp.parts('cascade')).not.toBeNull();
    expect(sourcesDeLApp.typeMalt(it0({ name: 'Pilsner Malz' }))).toBe('base');
  });
});
