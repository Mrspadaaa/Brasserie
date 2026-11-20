// @vitest-environment jsdom
// Port de r2a (carnet de recettes) : règles du modèle (prête / il manque, jamais 0 pour l'inconnu) et rendu du carnet.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Batch, Recipe, StockItem } from '../../src/types';
import { recipeEntries } from '../../src/domain/productionCatalog';
import { besoinsDe, changementsDepuis, etatDe, grouper, lignees } from '../../src/ui/production/recettes/recettesModel';

vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: <T,>(read: () => T) => read() }));
const stockCourant: { items: StockItem[] } = { items: [] };
vi.mock('../../src/services/storage', () => ({
  StorageService: {
    getStocks: () => ({ rawMaterials: stockCourant.items, cleaning: [] }),
    getConfig: () => ({ brewhouses: [{ id: 'b', efficiencyPct: 75 }], activeBrewhouseId: 'b' }),
    getUiState: (_k: string, d: unknown) => d,
    setUiState: () => undefined,
    subscribe: () => () => undefined
  }
}));
import { CarnetRecettes } from '../../src/ui/production/recettes/CarnetRecettes';

afterEach(cleanup);

const NOW = new Date(2026, 10, 15, 12).getTime();
const article = (ref: string, name: string, category: string, currentStock: number, unit = 'g'): StockItem =>
  ({ id: ref, ref, name, category, unit, currentStock, minStock: 0, reorder: false }) as StockItem;

const recette = (id: string, extra: Partial<Recipe> = {}): Recipe =>
  ({
    id,
    name: 'ZZ NEIPA',
    style: 'New England IPA',
    volumeL: 24,
    ogTarget: 1.062,
    fermentables: [{ name: 'ZZ Pale', stockItemRef: 'ZZ-PALE', weightKg: 5.4 }],
    hops: [{ name: 'ZZ Citra', stockItemRef: 'ZZ-CITRA', weightG: 250, stage: 'dryHop' }],
    yeast: { name: 'ZZ Verdant', stockItemRef: 'ZZ-VERDANT', qty: 1, unit: 'sachet' },
    adjuncts: [],
    ...extra
  }) as unknown as Recipe;

const lot019 = {
  id: 'LOT-019',
  name: 'ZZ lot',
  status: 'fermentation',
  stockConsumption: { appliedAt: '2026-11-15', pendingItems: [{ stockItemRef: 'ZZ-CITRA', quantity: 100, unit: 'g' }] }
} as unknown as Batch;

const stockNeipa = [
  article('ZZ-PALE', 'ZZ Pale', 'Malt', 25, 'kg'),
  article('ZZ-CITRA', 'ZZ Citra', 'Houblon', 100),
  article('ZZ-VERDANT', 'ZZ Verdant', 'Levure', 2, 'sachet')
];

describe('besoinsDe : le cas NEIPA (Citra 100 g, tous réservés au LOT-019)', () => {
  const b = besoinsDe(recette('r3'), [lot019], stockNeipa);
  it('il manque 250 g de Citra, réservés au LOT-019', () => {
    const citra = b.find((x) => x.article === 'ZZ Citra')!;
    expect(citra.etat).toBe('manque');
    expect(citra.manque).toBe('ZZ Citra 250 g');
    expect(citra.reservePar).toEqual({ lots: ['LOT-019'], stock: '100 g' });
    expect(b.filter((x) => x.etat === 'ok').length).toBe(2);
  });
  it('sans réservation, le stock de 100 g ne couvre pas non plus 250 g : il manque 150 g', () => {
    const citra = besoinsDe(recette('r3'), [], stockNeipa).find((x) => x.article === 'ZZ Citra')!;
    expect(citra.manque).toBe('ZZ Citra 150 g');
    expect(citra.reservePar).toBeUndefined();
  });
});

describe('l’inconnu n’est jamais 0', () => {
  it('un ingrédient sans article de stock est « inconnu », jamais « en stock »', () => {
    const b = besoinsDe(recette('r1'), [], stockNeipa.filter((s) => s.ref !== 'ZZ-VERDANT'));
    const levure = b.find((x) => x.article === 'ZZ Verdant')!;
    expect(levure.etat).toBe('inconnu');
    expect(levure.droite).toBe('non relié');
    expect(etatDe(0, b.filter((x) => x.etat === 'inconnu').length)).toBe('inconnu');
  });
  it('les adjuvants hors stock n’entrent jamais en « À vérifier » (décision du 15.11)', () => {
    const r = recette('r1', { adjuncts: [{ name: 'ZZ Sel de gypse', amount: 5, unit: 'g' }] as Recipe['adjuncts'] });
    const stock = [...stockNeipa.map((s) => (s.ref === 'ZZ-CITRA' ? { ...s, currentStock: 300 } : s))];
    const b = besoinsDe(r, [], stock);
    expect(b.some((x) => /gypse/i.test(x.texte))).toBe(false);
    expect(b.every((x) => x.etat === 'ok')).toBe(true);
    expect(etatDe(0, b.filter((x) => x.etat === 'inconnu').length)).toBe('pret');
  });
  it('un adjuvant relié à un article hors Houblon, Malt ou Levure n’est pas jugé non plus', () => {
    const r = recette('r1', { adjuncts: [{ name: 'ZZ Sucre candi', stockItemRef: 'ZZ-SUCRE', amount: 900, unit: 'g' }] as Recipe['adjuncts'] });
    const stock = [...stockNeipa.map((s) => (s.ref === 'ZZ-CITRA' ? { ...s, currentStock: 300 } : s)), article('ZZ-SUCRE', 'ZZ Sucre candi', 'Sucre', 0)];
    expect(besoinsDe(r, [], stock).every((x) => x.etat === 'ok')).toBe(true);
  });
});

describe('etatDe et grouper', () => {
  it('prête, presque, loin', () => {
    expect(etatDe(0, 0)).toBe('pret');
    expect(etatDe(1, 0)).toBe('presque');
    expect(etatDe(2, 0)).toBe('loin');
    expect(etatDe(3, 0)).toBe('loin');
  });
  it('2 versions = 1 lignée ; la dernière version se brasse ; planifiée en retard', () => {
    const v1 = recette('v1', { name: 'ZZ Pale Ale', version: 1, hops: [{ name: 'ZZ Citra', stockItemRef: 'ZZ-CITRA', weightG: 50, stage: 'boil' }] as Recipe['hops'] });
    const v2 = recette('v2', { name: 'ZZ Pale Ale', parentRecipeId: 'v1', version: 2, hops: [{ name: 'ZZ Citra', stockItemRef: 'ZZ-CITRA', weightG: 60, stage: 'boil' }] as Recipe['hops'] });
    const prevu = { id: 'LOT-020', name: 'ZZ Pale Ale', status: 'planifie', plannedBrewDate: '2026-11-08', recipeRef: 'v2' } as unknown as Batch;
    const fait = { id: 'LOT-010', name: 'ZZ Pale Ale', status: 'termine', brewDate: '2026-07-19', recipeRef: 'v1' } as unknown as Batch;
    const e = recipeEntries([v1, v2], [prevu, fait]);
    const l = lignees(e, [prevu, fait], stockNeipa, NOW);
    expect(l).toHaveLength(1);
    expect(l[0]).toMatchObject({ nbVersions: 2, version: 2, brassees: 1, derniere: '2026-07-19', etat: 'pret' });
    expect(l[0].prevu?.id).toBe('LOT-020');
    expect(l[0].retard).toBe(7);
    expect(grouper(l).pretes).toHaveLength(1);
  });
  it('NEIPA : une seule ligne manque, état « presque » ; la Pils à deux manques est « loin »', () => {
    const neipa = recipeEntries([recette('n1')], [lot019]);
    expect(lignees(neipa, [lot019], stockNeipa, NOW)[0].etat).toBe('presque');
    const pils = recette('p1', { name: 'ZZ Pils', fermentables: [{ name: 'ZZ Pale', stockItemRef: 'ZZ-PALE', weightKg: 50 }] as Recipe['fermentables'] });
    expect(lignees(recipeEntries([pils], []), [], stockNeipa, NOW)[0].etat).toBe('loin');
  });
});

describe('changementsDepuis', () => {
  it('levure, houblon ajouté, dose changée', () => {
    const v2 = recette('v2', { hops: [{ name: 'Citra', weightG: 150, stage: 'dryHop' }] as Recipe['hops'], yeast: { name: 'US-05' } as Recipe['yeast'] });
    const v3 = recette('v3', {
      hops: [{ name: 'Citra', weightG: 100, stage: 'dryHop' }, { name: 'Mosaic', weightG: 80, stage: 'dryHop' }] as Recipe['hops'],
      yeast: { name: 'Verdant IPA' } as Recipe['yeast']
    });
    expect(changementsDepuis(v3, v2)).toEqual(['levure Verdant IPA', 'Citra en dry hop 150 → 100 g', '+ Mosaic 80 g en dry hop']);
    expect(changementsDepuis(v3, undefined)).toEqual([]);
  });
});

describe('CarnetRecettes', () => {
  const props = () => ({ onOpenRecipe: vi.fn(), onEditRecipe: vi.fn(), onOpenBatch: vi.fn(), onBrew: vi.fn(), onNewRecipe: vi.fn() });
  const blonde = recette('b1', { name: 'ZZ Blonde de soif' });
  const neipa = recette('n1', { name: 'ZZ NEIPA' });
  const stock = [article('ZZ-PALE', 'ZZ Pale', 'Malt', 25, 'kg'), article('ZZ-CITRA', 'ZZ Citra', 'Houblon', 300), article('ZZ-VERDANT', 'ZZ Verdant', 'Levure', 2, 'sachet')];

  it('au repos : la section « Prêtes » dit ce qui est prêt ; Brasser appelle onBrew avec l’id de la recette', () => {
    stockCourant.items = stock;
    const p = props();
    render(<CarnetRecettes recipes={[blonde]} batches={[]} {...p} />);
    expect(screen.getByText('Prêtes')).toBeTruthy();
    expect(screen.getByText('jamais brassée')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Brasser' }));
    expect(p.onBrew).toHaveBeenCalledWith('b1');
  });

  it('une recette à un achat près dit ce qui manque et propose « Planifier » ; sa feuille se lit', () => {
    stockCourant.items = stockNeipa;
    const p = props();
    render(<CarnetRecettes recipes={[neipa]} batches={[lot019]} {...p} />);
    expect(screen.getByText('À un achat près')).toBeTruthy();
    expect(screen.getByText('ZZ Citra 250 g')).toBeTruthy();
    expect(screen.getByText(/les 100 g du stock vont au LOT-019/)).toBeTruthy();
    fireEvent.click(screen.getByText('ZZ NEIPA'));
    expect(screen.getByText(/Pour la rebrasser, il manque/)).toBeTruthy();
    expect(screen.getByText('Ce qu’elle demande')).toBeTruthy();
    // un seul verbe de brassage au pied : l'encart garde l'information sans bouton (ks1 n° 7)
    expect(screen.queryByRole('button', { name: 'Planifier le brassin' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Brasser quand même' }));
    expect(p.onBrew).toHaveBeenCalledWith('n1');
  });

  it('un stock inconnu va dans « À vérifier », jamais dans « Prêtes »', () => {
    stockCourant.items = [];
    render(<CarnetRecettes recipes={[blonde]} batches={[]} {...props()} />);
    expect(screen.getByText('À vérifier')).toBeTruthy();
    expect(screen.queryByText('Prêtes')).toBeNull();
    // 19.11 (LST-TITRE-COMPTEUR) : plus de titre « Rien de prêt à brasser » ; l'absence de la section « Prêtes » le dit.
    expect(screen.queryByText('Rien de prêt à brasser')).toBeNull();
  });

  it('vide : exemple, stock du jour, Nouvelle recette', () => {
    stockCourant.items = [article('H1', 'ZZ H', 'Houblon', 1), article('H2', 'ZZ H2', 'Houblon', 1), article('M1', 'ZZ M', 'Malt', 1)];
    const p = props();
    render(<CarnetRecettes recipes={[]} batches={[]} {...p} />);
    expect(screen.getByText('Aucune recette')).toBeTruthy();
    expect(screen.getByText(/2 houblons, 1 malt, 0 levure/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle recette' }));
    expect(p.onNewRecipe).toHaveBeenCalled();
    expect(screen.queryByText(/Comparer/)).toBeNull();
  });
});

describe('ks1 n° 1 : l’IBU affiché est celui de la fiche, calculé ; une blonde de soif ne fait pas 70', () => {
  const saaz = (alpha: number) => recette('b1', { name: 'ZZ Blonde de soif', style: 'Blonde', ibuTarget: 22, hops: [{ name: 'ZZ Saaz', stockItemRef: 'ZZ-SAAZ', weightG: 60, stage: 'boil', alpha, timeMin: 60 }] as Recipe['hops'] });
  it('Saaz à 3,5 % : une blonde entre 15 et 30 IBU', () => {
    const ibu = recipeEntries([saaz(3.5)], [])[0].ibu!;
    expect(ibu).toBeGreaterThan(15);
    expect(ibu).toBeLessThan(30);
  });
  it('la même dose à 12 % (donnée irréaliste du banc) calcule bien 60 à 80 : le code ne mélange pas la cible et le calcul', () => {
    const ibu = recipeEntries([saaz(12)], [])[0].ibu!;
    expect(ibu).toBeGreaterThan(60);
    expect(ibu).toBeLessThan(80);
  });
  it('la feuille de la blonde dit cet IBU, pas 70', () => {
    stockCourant.items = [article('ZZ-SAAZ', 'ZZ Saaz', 'Houblon', 250), article('ZZ-PALE', 'ZZ Pale', 'Malt', 25, 'kg'), article('ZZ-VERDANT', 'ZZ Verdant', 'Levure', 2, 'sachet')];
    render(<CarnetRecettes recipes={[saaz(3.5)]} batches={[]} onOpenRecipe={vi.fn()} onEditRecipe={vi.fn()} onOpenBatch={vi.fn()} onBrew={vi.fn()} onNewRecipe={vi.fn()} />);
    fireEvent.click(screen.getByText('ZZ Blonde de soif'));
    const ligne = screen.getByText(/IBU/).closest('button')!;
    const n = Number(/(\d+)\s*IBU/.exec(ligne.textContent ?? '')?.[1]);
    expect(n).toBeGreaterThan(15);
    expect(n).toBeLessThan(30);
  });
});

// ks1 n° 2, revu le 19.11 (LST-TITRE-COMPTEUR, « Pareil, inutile ») : la tête « 1 prête / 1 à un achat près » est partie ; le résultat se dit sous le champ.
describe('ks1 n° 2 : sans titre-compteur, le résultat du filtre se dit sous le champ', () => {
  const props = () => ({ onOpenRecipe: vi.fn(), onEditRecipe: vi.fn(), onOpenBatch: vi.fn(), onBrew: vi.fn(), onNewRecipe: vi.fn() });
  const prete = recette('b1', { name: 'ZZ Blonde de soif', hops: [] });
  const presque = recette('n1', { name: 'ZZ NEIPA' });
  it('ni « 1 prête à brasser » ni « 1 à un achat près » en tête, avant comme après une recherche', () => {
    stockCourant.items = stockNeipa;
    render(<CarnetRecettes recipes={[prete, presque]} batches={[lot019]} {...props()} />);
    const champ = screen.getByRole('searchbox');
    expect(screen.queryByText(/1 prête à brasser/)).toBeNull();
    expect(screen.queryByText(/1 à un achat près/)).toBeNull();
    expect(screen.getByText('À un achat près')).toBeTruthy();
    fireEvent.change(champ, { target: { value: 'zzzzzz' } });
    expect(screen.queryByText('Rien de prêt à brasser')).toBeNull();
    expect(screen.getByText(/Aucune recette ne correspond/)).toBeTruthy();
    fireEvent.change(champ, { target: { value: 'neipa' } });
    expect(screen.queryByText(/1 à un achat près/)).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('1 sur 2 lignées');
  });
});

describe('ks1 n° 3 à 6 et 9 : le dire des quantités et l’ordre des prêtes', () => {
  const stock = [
    article('ZZ-PALE', 'ZZ Malt Pale', 'Malt', 2, 'kg'),
    article('ZZ-MUN', 'ZZ Malt Munich', 'Malt', 2, 'kg'),
    article('ZZ-BELLE', 'ZZ Levure Belle Saison', 'Levure', 0, 'sachet'),
    article('ZZ-VER', 'ZZ Levure Verdant IPA', 'Levure', 3, 'sachet')
  ];
  it('le nom puis la quantité : « Levure, 1 sachet » ; un malt reste en kg à la virgule ; le pluriel s’accorde', () => {
    const r = recette('x', {
      fermentables: [{ name: 'ZZ Malt Munich', stockItemRef: 'ZZ-MUN', weightKg: 0.6 }] as Recipe['fermentables'],
      hops: [],
      yeast: { name: 'ZZ Levure Belle Saison', stockItemRef: 'ZZ-BELLE', qty: 1, unit: 'sachet' } as Recipe['yeast']
    });
    const b = besoinsDe(r, [], stock);
    const munich = b.find((x) => x.article === 'ZZ Malt Munich')!;
    expect(munich.texte).toBe('ZZ Malt Munich 0,6 kg');
    expect(munich.droite).toBe('2 kg libres');
    const belle = b.find((x) => x.article === 'ZZ Levure Belle Saison')!;
    expect(belle.texte).toBe('ZZ Levure Belle Saison, 1 sachet');
    expect(belle.manque).toBe('ZZ Levure Belle Saison, 1 sachet');
    expect(belle.manqueGras).toBe('ZZ Levure Belle Saison');
    const verdant = besoinsDe(recette('y', { yeast: { name: 'ZZ Levure Verdant IPA', stockItemRef: 'ZZ-VER', qty: 1, unit: 'sachet' } as Recipe['yeast'], hops: [], fermentables: [] }), [], stock);
    expect(verdant.find((x) => x.article === 'ZZ Levure Verdant IPA')!.droite).toBe('3 sachets libres');
  });
  it('« Depuis la v2 » ne double pas le mot levure', () => {
    const v2 = recette('v2', { yeast: { name: 'US-05' } as Recipe['yeast'] });
    const v3 = recette('v3', { yeast: { name: 'ZZ Levure Verdant IPA' } as Recipe['yeast'] });
    expect(changementsDepuis(v3, v2)).toContain('ZZ Levure Verdant IPA');
    expect(changementsDepuis(v3, v2).some((c) => /levure ZZ Levure/i.test(c))).toBe(false);
  });
  it('les prêtes sans brassin planifié passent avant celles qui en ont un', () => {
    const planifiee = recette('p', { name: 'ZZ Aaa Pale Ale' });
    const libre = recette('l', { name: 'ZZ Zzz Blonde' });
    const lot = { id: 'LOT-020', name: 'ZZ Aaa Pale Ale', status: 'planifie', plannedBrewDate: '2026-11-20', recipeRef: 'p' } as unknown as Batch;
    const e = recipeEntries([planifiee, libre], [lot]);
    const stk = [article('ZZ-PALE', 'ZZ Pale', 'Malt', 25, 'kg'), article('ZZ-CITRA', 'ZZ Citra', 'Houblon', 300), article('ZZ-VERDANT', 'ZZ Verdant', 'Levure', 2, 'sachet')];
    const g = grouper(lignees(e, [lot], stk, NOW));
    expect(g.pretes.map((x) => x.nom)).toEqual(['ZZ Zzz Blonde', 'ZZ Aaa Pale Ale']);
  });
});
