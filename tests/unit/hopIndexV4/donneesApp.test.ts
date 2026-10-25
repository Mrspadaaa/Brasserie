// Voie t8-donnees (#169) : les données du moteur viennent des sources de l'app. La fixture de production du 17.10
// (tests/fixtures/production/houblons-2026-10-17.json : stock non normalisé, α dans le nom, aucun lien en base) est lue sans
// exception ; ses articles reliés et non reliés sont comptés et listés.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CATALOGUE, STOCK } from '../../../src/domain/hopIndex/v4/data';
import { alphaDuNom, degustationDeRecette, niveauDePlage, niveauxDegustes, nomDeVariete, relierStock, varieteDe, type ArticleHoublon, type DegustationApp } from '../../../src/domain/hopIndex/v4/donneesApp';

const production = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../fixtures/production/houblons-2026-10-17.json'), 'utf8')) as { stockItems: ArticleHoublon[]; hopVarieties: { name: string }[] };

describe('fixture de production du 17.10 (houblons-2026-10-17)', () => {
  const r = relierStock(production.stockItems, CATALOGUE);
  it('est lue sans exception : 18 articles, chacun relié ou listé', () => {
    expect(production.stockItems).toHaveLength(18);
    expect(r.relies.length + r.nonRelies.length).toBe(18);
  });
  it('donne le stock du prototype (proto-data) : mêmes clés, grammes, α et provenance de l\'α', () => {
    // Seul l'ordre des listes diffère de proto-data (tri canonique : clés, puis articles).
    const canon = (l: typeof STOCK) => [...l].sort((a, b) => (a.key < b.key ? -1 : 1)).map((x) => ({ ...x, items: [...x.items].sort() }));
    expect(canon(r.stock)).toEqual(canon(STOCK));
  });
  it('relie 18 articles sur 18 ; aucun non relié, et la liste le dit', () => {
    expect(r.nonRelies).toEqual([]);
    expect(r.relies).toHaveLength(18);
    expect(r.stock).toHaveLength(16);
    // eslint-disable-next-line no-console
    console.log(`FIXTURE PRODUCTION : ${r.relies.length} reliés, ${r.nonRelies.length} non reliés ; clés : ${r.stock.map((s) => s.key.replace('beermaverick-', '')).join(', ')}`);
  });
  it('relie « Houblon Cryo Hops Citra 24.8% » à Citra cryo, et « Nuget » (faute de frappe connue) à Nugget', () => {
    expect(r.stock.find((s) => s.key === 'beermaverick-citra:cryo')).toMatchObject({ form: 'cryo', grams: 65, alpha: 24.8, alphaFrom: 'lu sur l’article' });
    expect(r.relies.find((x) => x.article === 'Nuget')).toMatchObject({ varietyId: 'beermaverick-nugget' });
  });
  it('l\'α n\'est jamais 0 : absent, c\'est null', () => {
    expect(r.stock.every((s) => s.alpha === null || s.alpha > 0)).toBe(true);
    const sansAlpha = relierStock([{ name: 'Houblon Citra', currentStock: 10, unit: 'g' }], CATALOGUE);
    expect(sansAlpha.stock[0]).toMatchObject({ alpha: null, alphaFrom: null });
  });
  it('un α 0 de la base (#120) est inconnu', () => {
    const z = relierStock([{ name: 'Citra', currentStock: 10, unit: 'g', alphaPct: 0 }], CATALOGUE);
    expect(z.stock[0].alpha).toBeNull();
  });
  it('l\'ordre des articles de l\'app n\'y change rien : mêmes données, mêmes mots', () => {
    expect(relierStock([...production.stockItems].reverse(), CATALOGUE)).toEqual(r);
  });
});

describe('articles non reliés : visibles, `inconnu:<nom>`, jamais 0', () => {
  const lot: ArticleHoublon[] = [
    { name: 'Houblon Zythos Imaginaire 9.9%', currentStock: 40, unit: 'g' },
    { name: 'Houblon Citra 12%', currentStock: 25, unit: 'g' },
    { name: 'Houblon Saphir', unit: 'g' },
    { name: 'Houblon Cascade 6%', currentStock: 2, unit: 'sachet' },
  ];
  const r = relierStock(lot, CATALOGUE);
  it('l\'inconnu garde son nom, sa quantité et son α lus, avec la raison', () => {
    const z = r.nonRelies.find((x) => x.nom.includes('Zythos'))!;
    expect(z).toMatchObject({ cle: 'inconnu:Houblon Zythos Imaginaire 9.9%', grams: 40, alphaPct: 9.9 });
    expect(z.raison).toMatch(/aucune variété/);
  });
  it('une quantité absente n\'est pas 0 : l\'article n\'entre pas dans le stock du moteur', () => {
    const s = r.nonRelies.find((x) => x.nom === 'Houblon Saphir')!;
    expect(s.grams).toBeNull();
    expect(r.stock.some((x) => x.items.includes('Houblon Saphir'))).toBe(false);
  });
  it('une unité inconnue n\'est pas convertie : non relié, raison dite', () => {
    const c = r.nonRelies.find((x) => x.nom.includes('sachet') || x.nom === 'Houblon Cascade 6%')!;
    expect(c.raison).toMatch(/unité « sachet »/);
    expect(c.grams).toBeNull();
  });
  it('seul l\'article relié et complet entre dans le stock', () => {
    expect(r.stock.map((s) => s.key)).toEqual(['beermaverick-citra']);
    expect(r.relies).toHaveLength(1);
  });
  it('les kilos sont convertis en grammes', () => {
    expect(relierStock([{ name: 'Citra', currentStock: 0.5, unit: 'kg' }], CATALOGUE).stock[0].grams).toBe(500);
  });
});

describe('relier par le nom ou l\'alias, sans fusionner les catalogues', () => {
  it('le nom d\'abord, puis l\'alias du catalogue du moteur', () => {
    expect(varieteDe('Cascade', CATALOGUE)).toMatchObject({ lien: 'nom', h: { id: 'beermaverick-cascade' } });
    expect(varieteDe('Houblon EKG', CATALOGUE)).toMatchObject({ lien: 'alias', h: { id: 'beermaverick-east-kent-goldings' } });
  });
  it('un nom ambigu n\'est pas deviné', () => {
    const doublon = [...CATALOGUE.slice(0, 3), { ...CATALOGUE[0], id: 'autre-' + CATALOGUE[0].id }];
    expect(varieteDe(CATALOGUE[0].name, doublon)).toMatchObject({ raison: expect.stringMatching(/ambigu/) });
  });
  it('le nettoyage de l\'étiquette', () => {
    expect(nomDeVariete('Houblon Cryo Hops Citra 24.8%')).toBe('citra');
    expect(nomDeVariete('Houblon Hallertauer Blanc 9.5% CH')).toBe('hallertau blanc');
    expect(alphaDuNom('Houblon Galaxy 17,2%')).toBe(17.2);
    expect(alphaDuNom('Houblon Galaxy')).toBeNull();
    expect(alphaDuNom('Houblon X 0%')).toBeNull();
  });
});

describe('dégustation de la recette', () => {
  const axe = (id: string) => ({ id, scale: { min: 0, max: 100 }, lowMax: 30, mediumMax: 60 });
  const deg = (id: string, date: string, batchId: string, perceived: { min: number; max: number } | null, origin: 'batch' | 'commercial' = 'batch'): DegustationApp =>
    ({ id, name: `Dégustation ${id}`, date, origin, batchId, notes: 'trop résineuse', axes: [{ axis: axe('resin'), perceived }, { axis: axe('floral'), perceived: null }] });
  it('plage → classe de l\'axe ; une plage à cheval ou absente est inconnue (null)', () => {
    expect(niveauDePlage(axe('resin'), { min: 65, max: 90 })).toBe('marqué');
    expect(niveauDePlage(axe('resin'), { min: 35, max: 55 })).toBe('moyen');
    expect(niveauDePlage(axe('resin'), { min: 0, max: 20 })).toBe('faible');
    expect(niveauDePlage(axe('resin'), { min: 20, max: 70 })).toBeNull();
    expect(niveauDePlage(axe('resin'), null)).toBeNull();
  });
  it('seules les familles dites sont rendues', () => {
    expect(niveauxDegustes(deg('t1', '2026-10-01', 'LOT-1', { min: 70, max: 95 }))).toEqual({ resin: 'marqué' });
  });
  it('la plus récente des dégustations des brassins de la recette ; une commerciale ou d\'une autre recette est ignorée', () => {
    const brassins = [{ id: 'LOT-1', recipeRef: 'R1', brewDate: '2026-09-01' }, { id: 'LOT-2', recipeRef: 'R1', brewDate: '2026-10-01' }, { id: 'LOT-9', recipeRef: 'R2' }];
    const ds = [deg('a', '2026-09-20', 'LOT-1', null), deg('b', '2026-10-10', 'LOT-2', { min: 70, max: 90 }), deg('c', '2026-10-12', 'LOT-9', null), deg('d', '2026-10-14', 'LOT-2', null, 'commercial')];
    expect(degustationDeRecette({ id: 'R1' }, brassins, ds)?.degustation.id).toBe('b');
    expect(degustationDeRecette({ id: 'R3' }, brassins, ds)).toBeNull();
    expect(degustationDeRecette(null, brassins, ds)).toBeNull();
    expect(degustationDeRecette({ id: 'RX', batchRef: 'LOT-1' }, brassins, ds)?.degustation.id).toBe('a');
  });
});
