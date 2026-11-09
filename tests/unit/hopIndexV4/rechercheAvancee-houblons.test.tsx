// @vitest-environment jsdom
// Voie r2 (mission 2026-11-09-levure-retours) : « Faire la même chose que levure pour la recherche pour les houblons » (09.11).
// La recherche avancée des houblons : facettes à comptes disjonctifs sur les vraies fiches du catalogue du moteur (fixture du
// prototype, 318 variétés Beer Maverick, et son stock), « non documentée » comptée à part ; « Ajouter à ma recette » écrit par la
// porte du wizard au moment proposé et referme la couche. Stockage simulé : aucune donnée réelle, aucun appel Gemini.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';

vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: () => () => {},
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => [],
    getHopTastings: () => [],
  },
}));

import { facetter } from '../../../src/domain/rechercheAvancee/facettes';
import { catalogueHoublons, chercherHoublons, facettesHoublons, fichesHoublons, type FicheHoublon } from '../../../src/ui/hopIndex/rechercheAvancee/catalogue';
import EcranRechercheHoublons from '../../../src/ui/hopIndex/rechercheAvancee/EcranApp';
import { poserPorteEtape } from '../../../src/ui/hopIndex/comparer/porte';
import type { ChangementHoublonsV4 } from '../../../src/domain/hopIndex/v4/recipeConversion';

const RECETTE = {
  id: 'REC-R2', name: 'Stout export', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
  fermentables: [], hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => { cleanup(); poserPorteEtape(null); });

describe('recherche avancée houblons : facettes sur les fiches réelles du catalogue', () => {
  const fiches = fichesHoublons();
  const facettes = facettesHoublons(fiches);
  const fac = (id: string) => facettes.find((f) => f.id === id)!;

  it('les fiches : le stock du brasseur puis le catalogue du moteur, chacune une fois', () => {
    expect(fiches.length).toBeGreaterThan(300);
    expect(new Set(fiches.map((f) => f.cle)).size).toBe(fiches.length);
    expect(fiches.some((f) => f.dispo === 'stock')).toBe(true);
    expect(fiches.some((f) => f.dispo === 'catalogue')).toBe(true);
  });

  it('rôle posé « amérisant » : les comptes du rôle ignorent ce filtre (disjonctifs), ceux de l’origine le suivent', () => {
    const r = chercherHoublons(fiches, facettes, '', { role: ['amérisant'] });
    const parRole = (mot: string) => fiches.filter((f) => f.h.role.mot === mot).length;
    expect(r.comptes.role!.options.map((o) => [o.valeur, o.n])).toEqual([['amérisant', parRole('amérisant')], ['aromatique', parRole('aromatique')], ['mixte', parRole('mixte')]]);
    // l'inconnu à part, jamais compté comme un rôle ni comme 0
    expect(r.comptes.role!.nonDocumentees).toBe(fiches.filter((f) => !f.h.role.mot).length);
    expect(r.total).toBe(parRole('amérisant'));
    const amers = fiches.filter((f) => f.h.role.mot === 'amérisant');
    const us = amers.filter((f) => f.cat?.origin === 'États-Unis').length;
    expect(r.comptes.origine!.options.find((o) => o.valeur === 'États-Unis')!.n).toBe(us);
    expect(r.comptes.origine!.nonDocumentees).toBe(amers.filter((f) => !f.cat?.origin).length);
  });

  it('huile totale : une fiche sans huile n’entre dans aucune tranche, elle est « non documentée » ; une plage posée ne la garde pas', () => {
    const sans = fiches.filter((f) => !f.huile);
    const r = chercherHoublons(fiches, facettes, '', {});
    expect(r.comptes.huile!.nonDocumentees).toBe(sans.length);
    expect(r.comptes.huile!.options.reduce((s, o) => s + o.n, 0)).toBe(fiches.length - sans.length);
    const posee = chercherHoublons(fiches, facettes, '', { huile: { min: 2, max: 99 } });
    expect(posee.liste.every((f) => !!f.huile && f.huile[1] >= 2)).toBe(true);
    expect(posee.liste.some((f) => !f.huile)).toBe(false);
  });

  it('arômes : deux familles se cumulent (ET) ; une fiche sans famille citée est « non documentée »', () => {
    const r = chercherHoublons(fiches, facettes, '', { aromes: ['citrus', 'tropical'] });
    expect(r.liste.length).toBeGreaterThan(0);
    for (const f of r.liste) expect(f.h.familles.citrus.niveau !== 'non décrit' && f.h.familles.tropical.niveau !== 'non décrit').toBe(true);
    const muettes = fiches.filter((f) => Object.values(f.h.familles).every((x) => x.niveau === 'non décrit')).length;
    expect(r.comptes.aromes!.nonDocumentees).toBe(muettes);
  });

  it('le moteur commun seul rend les mêmes comptes que la recherche houblon', () => {
    const etats = facettes.map((f) => (f.id === 'stock' ? true : null));
    const { retenues, comptes } = facetter(fiches, facettes, etats);
    const r = chercherHoublons(fiches, facettes, '', { stock: true });
    expect(r.total).toBe(retenues.length);
    expect(r.comptes).toEqual(comptes);
    expect(retenues.every((f) => (f.grams ?? 0) > 0)).toBe(true);
  });

  it('le texte cherche le nom et les alias, sans accents ; l’ordre : chez moi, épuisés, à acheter', () => {
    const r = chercherHoublons(fiches, facettes, 'nelson', {});
    expect(r.liste.map((f) => f.h.nom)).toContain('Nelson Sauvin');
    const rangs = chercherHoublons(fiches, facettes, '', {}).liste.map((f) => ({ stock: 0, epuise: 1, catalogue: 2 })[f.dispo]);
    expect(rangs).toEqual([...rangs].sort((a, b) => a - b));
  });

  it('Nelson Sauvin (L14) : ses mots hors des 12 familles se disent sur sa ligne', () => {
    const ns = fiches.find((f) => f.h.nom === 'Nelson Sauvin') as FicheHoublon;
    expect(ns.h.motsSansFamille.length).toBeGreaterThan(0);
    const c = catalogueHoublons(fiches, () => ({ ajouter: () => {}, proposition: () => null, fiche: () => {} }));
    render(<>{c.Pastilles({ item: ns, poses: [] })}</>);
    expect(document.querySelector('.hx-hors')?.textContent).toMatch(/◇/);
  });

  it('temps d’une recherche à chaud (L20) : sous 20 ms', () => {
    chercherHoublons(fiches, facettes, '', {});
    const t: number[] = [];
    for (const [q, f] of [['', { role: ['aromatique'] }], ['ci', {}], ['', { aromes: ['citrus'], alpha: { min: 8, max: 14 } }], ['', { stock: true, huile: { min: 1, max: 2 } }]] as const) {
      const d = performance.now();
      chercherHoublons(fiches, facettes, q, f as never);
      t.push(performance.now() - d);
    }
    console.log(`RECHERCHE HOUBLONS ${fiches.length} fiches, à chaud (ms) : ${t.map((x) => x.toFixed(2)).join(' · ')}`);
    expect(Math.max(...t)).toBeLessThan(20);
  });
});

describe('recherche avancée houblons dans l’app : « Ajouter à ma recette »', () => {
  it('toucher une ligne l’ouvre ; « Ajouter à ma recette » écrit le houblon par la porte, au moment proposé, puis referme la couche', async () => {
    const changements: ChangementHoublonsV4[] = [];
    const onClose = vi.fn();
    poserPorteEtape({ recipe: RECETTE, boilOg: 1.066, draftId: 'REC-R2', onChange: (c) => changements.push(c) });
    render(<EcranRechercheHoublons onClose={onClose} />);
    fireEvent.change(await screen.findByLabelText('Nom ou alias'), { target: { value: 'Citra' } });
    const ligne = await waitFor(() => { const l = document.querySelector('[data-houblon="beermaverick-citra"]'); expect(l).not.toBeNull(); return l as HTMLElement; });
    // un toucher hors du nom (la piste α) ouvre la ligne
    fireEvent.click(ligne.querySelector('[data-piste="alpha"]')!);
    const bouton = screen.getByRole('button', { name: /Ajouter à ma recette/ });
    expect(bouton.textContent).toMatch(/\d g à \d+′/);
    fireEvent.click(bouton);
    expect(changements).toHaveLength(1);
    expect(changements[0].draftId).toBe('REC-R2');
    const noms = changements[0].patch.hops.map((h) => h.name);
    expect(noms).toContain('Nugget');
    expect(noms.some((n) => /citra/i.test(n))).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
