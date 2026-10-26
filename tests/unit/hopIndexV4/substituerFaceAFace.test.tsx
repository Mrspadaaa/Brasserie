// @vitest-environment jsdom
// Voie w1 (D102 A, D106 (3), DÉCISION 2 de e6, option ii) : le face à face par défaut de Substituer ne propose pas un candidat
// reculé à 60′ (produit d'arôme, ou usage « arôme »). Un brasseur n'amérise pas avec un produit d'arôme : « 46 g de Nugget → 24 g de
// Citra cryo » contredisait D102 A. Sans candidat du stock restant, le face à face prend le premier de la liste, hors stock.
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';

vi.mock('../../../src/services/storage', () => ({
  StorageService: { subscribe: () => () => {}, getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }), getBatches: () => [], getHopTastings: () => [], getHopKnowledge: () => [] },
}));

// Le stock des fixtures (houblons-2026-10-17, celui de la maquette) : c'est lui qui fait de Citra cryo « le premier du stock qui suffit » à 60′.
vi.mock('../../../src/ui/hopIndex/useHopData', async () => {
  const { STOCK } = await import('../../../src/domain/hopIndex/v4/data');
  const donnees = { moteur: null, catalogue: null, stock: STOCK, relies: [], nonRelies: [], degustation: null, empreinte: null };
  return { useHopData: () => donnees };
});

import EcranSubstituerApp from '../../../src/ui/hopIndex/substituer/EcranApp';
import { faceAFaceParDefaut, type Candidat } from '../../../src/ui/hopIndex/substituer/donnees';
import { poserPorteEtape } from '../../../src/ui/hopIndex/comparer/porte';
import { poserOuvreurCouche } from '../../../src/ui/hopIndex/ouvrirCouche';

const RECETTE = {
  id: 'REC-W1', name: 'Stout export', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70, fermentables: [],
  hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;
const NUGGET = 'beermaverick-nugget';

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView ??= () => {};
});
beforeEach(() => { poserPorteEtape({ recipe: RECETTE, boilOg: 1.056, draftId: 'REC-W1', onChange: () => {} }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); poserPorteEtape(null); poserOuvreurCouche(null); });

/** Un candidat minimal : seuls les champs que le choix du face à face lit. */
const cand = (cle: string, o: Partial<Pick<Candidat, 'stock' | 'min' | 'max' | 'recule'>> = {}): Candidat => ({
  cle, nom: cle, moteur: 80, palier: 'bon', composantes: { arome: 1, huiles: 1, amertume: 1 }, min: 80, max: 80, stock: 'acheter', libre: null,
  dose: { grams: 40, min: 40, max: 40, regle: 'même IBU' }, perd: [], gagne: [], vient: 'catalogue', rangMoteur: 1, recule: null, ...o,
} as unknown as Candidat);

describe('Substituer : le face à face par défaut saute les candidats reculés (D102 A)', () => {
  it('Nugget à 60′, stock des fixtures : le choix par défaut n’est pas un produit d’arôme ni un usage « arôme »', async () => {
    const r = render(<EcranSubstituerApp hopKey={NUGGET} onClose={() => {}} />);
    await waitFor(() => expect(r.container.querySelector('[data-role="choix-dock"]')).not.toBeNull(), { timeout: 8000 });
    const dock = r.container.querySelector('[data-role="choix-dock"]')!.textContent ?? '';
    expect(dock).toMatch(/g de Nugget remplacés par \d+(,\d+)? g de \S/);   // un remplaçant est bien choisi
    expect(dock).not.toMatch(/cryo/i);                                       // HEAD : « 46 g de Nugget → 24 g de Citra cryo »
  });

  it('un candidat du stock qui suffit mais reculé n’est jamais le choix ; le suivant du stock, s’il y en a un', () => {
    const l = [cand('arome-cryo', { stock: 'suffisant', recule: 'produit d’arôme (cryo), cher pour amériser' }), cand('achat'), cand('bon-stock', { stock: 'suffisant' })];
    const f = faceAFaceParDefaut(l);
    expect(f.choix).toBe('bon-stock');
    expect(f.compares).not.toContain('arome-cryo');
  });

  it('plus aucun candidat du stock qui suffise : le face à face prend le premier de la liste, hors stock', () => {
    const l = [cand('arome-cryo', { stock: 'suffisant', recule: 'usage « arôme » (Beer Maverick), cher pour amériser' }), cand('achat-1'), cand('achat-2', { min: 70, max: 70 })];
    const f = faceAFaceParDefaut(l);
    expect(f.choix).not.toBe('arome-cryo');
    expect(f.compares).not.toContain('arome-cryo');
    expect(f.compares).toHaveLength(2);
    expect(f.choix).toBe('achat-2');
  });

  it('le premier de la liste hors stock passe avant un candidat du stock qui ne suffit pas', () => {
    const l = [cand('arome-cryo', { stock: 'suffisant', recule: 'produit d’arôme (cryo), cher pour amériser' }), cand('petit-stock', { stock: 'insuffisant' }), cand('achat-1'), cand('achat-2', { min: 70, max: 70 })];
    const f = faceAFaceParDefaut(l);
    // A (premier sûr non suffisant) est le petit stock, comme avant ; B est le premier de la liste hors stock, jamais le cryo reculé.
    expect(f.compares).toEqual(['petit-stock', 'achat-1']);
    expect(f.choix).toBe('achat-1');
  });

  it('sans reculé, rien ne change : le premier du stock qui suffit reste le choix (u4)', () => {
    const l = [cand('achat'), cand('stock-1', { stock: 'suffisant' }), cand('stock-2', { stock: 'suffisant' })];
    const f = faceAFaceParDefaut(l);
    expect(f.choix).toBe('stock-1');
    expect(f.compares).toEqual(['achat', 'stock-1']);
  });
});
