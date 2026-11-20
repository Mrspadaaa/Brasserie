// Ma levure, deuxième critique du 20.11 (port/CRITIQUE-2.md, problèmes 2 et 3) : chaque test échouait avant sa correction.
import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { EtapeLevure } from '../../../src/ui/etapeLevure/EtapeLevure';
import { recetteApercuEtapeLevure } from '../../../src/ui/etapeLevure/apercuDev';
import { yeastReferences } from '../../../src/domain/yeastReferences';
import type { VueLevure } from '../../../src/ui/etapeLevure/props';
import type { TrialRecipe } from '../../../src/domain/hopIndex/trials';
import type { StockItem } from '../../../src/types';
import type { YeastChoiceChange } from '../../../src/ui/YeastRecipeChoice';

vi.mock('../../../src/hooks/useLiveData', () => ({ useStorageValue: () => [] }));
vi.mock('../../../src/ui/etapeLevure/Chercher', () => ({ Chercher: () => <p>vue Chercher</p> }));
vi.mock('../../../src/ui/etapeLevure/Comparer', () => ({ Comparer: () => <p>vue Comparer</p> }));
vi.mock('../../../src/ui/etapeLevure/Suggerer', () => ({ Suggerer: () => <p>vue Suggérer</p> }));
beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); window.localStorage.clear(); });

const refs = yeastReferences([]);
const w3470 = refs.find(r => r.id.includes('34') && /fermentis/i.test(r.id + r.name) && /W.?34.?70/.test(r.name))!;
const us05 = refs.find(r => r.id === 'fermentis-us05')!;
/** La recette de l'aperçu (30 L, OG 1,066 ; fixture, aucune donnée réelle) avec une autre levure. */
const recette = (yeast: Partial<TrialRecipe['yeast']>): TrialRecipe => {
  const r = recetteApercuEtapeLevure() as unknown as TrialRecipe;
  return { ...r, yeast: { ...r.yeast, ...yeast } };
};
const us05Stock = { ref: 'Y-US05', name: 'SafAle US-05', category: 'Levure', currentStock: 3, unit: 'sachet', favorite: false } as unknown as StockItem;

function Banc({ depart, stockItems = [], change }: { depart: TrialRecipe; stockItems?: StockItem[]; change?: YeastChoiceChange }) {
  const [recipe, setRecipe] = useState<TrialRecipe>(depart);
  const [vue, setVue] = useState<VueLevure>('ma-levure');
  return <EtapeLevure recipe={recipe} vue={vue} onVue={setVue} comparees={[]} onComparees={vi.fn()} onChoisir={vi.fn()}
    onChange={next => { setRecipe(next); return next; }}
    stockItems={stockItems} onStock={vi.fn()} onRetirer={vi.fn()} yeastChange={change} onYeastChange={vi.fn()}
    identityEditor={<p>éditeur stock (test)</p>} factsEditor={<p>éditeur fiche (test)</p>} aiEditor={<p>recherche IA (test)</p>} quantityEditor={<p>éditeur dose (test)</p>}
    atelier={() => <p>ancien atelier (test)</p>} />;
}
const w3470x5 = () => recette({ name: w3470.name, hopIndexId: w3470.id, qty: 5, unit: 'sachet' });

describe('2 · « besoin 4,8 sachets » ne mord plus sur la borne de fin', () => {
  it('l’étiquette suit le trait du besoin et reste dans la piste (ancrée à la même fraction que le trait)', () => {
    render(<Banc depart={w3470x5()} />);
    const marque = document.querySelector<HTMLElement>('[data-lv="bande-dose"] .ml-conseilmark')!;
    const etiquette = document.querySelector<HTMLElement>('[data-lv="bande-dose"] .ml-bornes .c')!;
    expect(etiquette.textContent).toMatch(/^besoin 4,\d sachets$/);
    const p = Number.parseFloat(marque.style.left);
    expect(p).toBeGreaterThan(70);
    expect(Number.parseFloat(etiquette.style.left)).toBeCloseTo(p, 5);
    expect(etiquette.style.transform).toBe(`translateX(-${p}%)`);
  });
  it('si l’étiquette recouvre encore une borne (piste étroite), cette borne se masque, l’autre reste', () => {
    const rects: Record<string, [number, number]> = { c: [60, 190], d: [0, 8], f: [178, 200] };
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const k = this.parentElement?.classList.contains('ml-bornes') ? ['c', 'd', 'f'].find(c => this.classList.contains(c)) : undefined;
      const [l, r] = k ? rects[k] : [0, 0];
      return { left: l, right: r, width: r - l, top: 0, bottom: 18, height: 18, x: l, y: 0, toJSON: () => ({}) } as DOMRect;
    });
    render(<Banc depart={w3470x5()} />);
    const bornes = document.querySelector<HTMLElement>('[data-lv="bande-dose"] .ml-bornes')!;
    expect(bornes.querySelector('.f')!.hasAttribute('data-couvert')).toBe(true);
    expect(bornes.querySelector('.d')!.hasAttribute('data-couvert')).toBe(false);
  });
});

describe('3 · une seule puce par levure : la récente (↺) l’emporte', () => {
  it('US-05 en stock et levure d’avant : une puce « US-05 », celle de l’historique', () => {
    const depart = w3470x5();
    const change = { source: 'catalogue', startedAt: Date.now(), from: { yeast: { name: 'SafAle US-05', hopIndexId: us05.id, qty: 2, unit: 'sachet' } },
      to: { yeast: structuredClone(depart.yeast) } } as unknown as YeastChoiceChange;
    render(<Banc depart={depart} stockItems={[us05Stock]} change={change} />);
    const puces = [...document.querySelectorAll<HTMLElement>('[data-role="puces"] .lv-puce')].filter(p => /US-05/.test(p.textContent ?? ''));
    expect(puces.map(p => p.className)).toEqual(['lv-puce lv-hab']);
  });
});
