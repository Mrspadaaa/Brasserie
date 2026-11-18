// Voie r4 (mission 2026-11-09-levure-retours), constat n° 1 du jeu en ligne du 09.11 : la tuile du stock « Levure LALLEMAND Verdant IPA » donnait
// une carte vide (FG ?, 5 × non documenté) alors que Verdant est au catalogue, et deux puces Verdant s'affichaient. Ces tests échouent sur la
// version rejetée : la carte lit la fiche du catalogue quand l'article du stock s'y relie (unique et sûr) ; une puce, une tuile par levure.
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { EtapeLevure } from '../../../src/ui/etapeLevure/EtapeLevure';
import { recetteApercuEtapeLevure } from '../../../src/ui/etapeLevure/apercuDev';
import type { VueLevure } from '../../../src/ui/etapeLevure/props';
import type { TrialRecipe } from '../../../src/domain/hopIndex/trials';
import type { StockItem } from '../../../src/types';

vi.mock('../../../src/hooks/useLiveData', () => ({ useStorageValue: () => [] }));
vi.mock('../../../src/ui/etapeLevure/Chercher', () => ({ Chercher: () => <p>vue Chercher</p> }));
vi.mock('../../../src/ui/etapeLevure/Comparer', () => ({ Comparer: () => <p>vue Comparer</p> }));
vi.mock('../../../src/ui/etapeLevure/Suggerer', () => ({ Suggerer: () => <p>vue Suggérer</p> }));
beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { cleanup(); window.localStorage.clear(); });

/** L'article de la vraie tenue en ligne : nom du fournisseur, sans fiche du catalogue. */
const verdantStock = { ref: 'Y-VERDANT', name: 'Levure LALLEMAND Verdant IPA', category: 'Levure', currentStock: 4, unit: 'sachet', favorite: false } as unknown as StockItem;
const maison = { ref: 'Y-MAISON', name: 'Ma souche maison', category: 'Levure', currentStock: 2, unit: 'sachet', favorite: false } as unknown as StockItem;

/** La recette telle que le wizard l'écrit après le choix d'un article du stock : le nom de l'article, sa quantité, jamais de `hopIndexId`. */
const recetteDuStock = (item: StockItem): TrialRecipe => {
  const base = recetteApercuEtapeLevure() as unknown as TrialRecipe;
  return { ...base, yeast: { name: item.name, stockItemRef: item.ref, form: 'sèche' } } as unknown as TrialRecipe;
};

function Banc({ depart, stockItems }: { depart: TrialRecipe; stockItems: StockItem[] }) {
  const [recipe, setRecipe] = useState<TrialRecipe>(depart);
  const [vue, setVue] = useState<VueLevure>('ma-levure');
  return <EtapeLevure recipe={recipe} vue={vue} onVue={setVue} comparees={[]} onComparees={vi.fn()}
    onChoisir={vi.fn()} onChange={next => { setRecipe(next); return next; }}
    stockItems={stockItems} onStock={item => setRecipe(recetteDuStock(item))} onRetirer={vi.fn()} yeastChange={undefined} onYeastChange={vi.fn()}
    identityEditor={<p>éditeur stock (test)</p>} factsEditor={<p>éditeur fiche (test)</p>} aiEditor={<p>recherche IA (test)</p>} quantityEditor={<p>éditeur dose (test)</p>}
    atelier={() => <p>ancien atelier (test)</p>} />;
}
const carte = () => document.querySelector('[data-booster="ligne-levure"]') as HTMLElement;
const valeurFg = () => carte().querySelector('[data-cel="fg"] .lv-cv')!.textContent!.trim();

describe('Ma levure : un article du stock relié à sa fiche du catalogue', () => {
  it('la carte montre la FG, la floculation et les effets de la fiche, pas « ? » ni « non documenté » partout', () => {
    render(<Banc depart={recetteDuStock(verdantStock)} stockItems={[verdantStock]} />);
    expect(valeurFg()).not.toBe('?');
    expect(valeurFg()).toMatch(/1[,.]0\d\d/);
    const floc = carte().querySelector('[data-cel="floculation"]')!;
    expect(floc.textContent).not.toMatch(/à chercher/);
    const inconnus = carte().querySelectorAll('.lv-ev[data-genre="inconnu"]').length;
    expect(inconnus).toBeLessThan(5);
  });

  it('un article sans correspondance sûre garde sa carte honnête : « ? » et « non documenté », jamais une fiche approchée', () => {
    render(<Banc depart={recetteDuStock(maison)} stockItems={[maison]} />);
    expect(valeurFg()).toBe('?');
    expect(carte().querySelectorAll('.lv-ev[data-genre="inconnu"]').length).toBe(5);
  });

  it('une puce par levure : Verdant du stock ne s’affiche pas une seconde fois comme levure proposée', () => {
    const recette = { ...(recetteApercuEtapeLevure() as unknown as TrialRecipe), yeast: { name: '' } } as unknown as TrialRecipe;
    render(<Banc depart={recette} stockItems={[verdantStock]} />);
    const puces = [...document.querySelectorAll('.lv-puces-l .lv-puce')].map(p => p.textContent!.trim());
    expect(puces.filter(t => /verdant/i.test(t)).length).toBe(1);
    expect(puces).toContain('Levure LALLEMAND Verdant IPA');
  });

  it('en tapant « verdant », une tuile par levure : celle du stock, pas aussi celle du catalogue', () => {
    const recette = { ...(recetteApercuEtapeLevure() as unknown as TrialRecipe), yeast: { name: '' } } as unknown as TrialRecipe;
    render(<Banc depart={recette} stockItems={[verdantStock]} />);
    fireEvent.change(screen.getByRole('combobox', { name: /Chercher une levure/ }), { target: { value: 'verdant' } });
    const noms = within(document.querySelector('[data-lv="resultats"]') as HTMLElement).getAllByRole('option').map(o => o.getAttribute('data-nom') ?? '');
    expect(noms.filter(n => /verdant/i.test(n))).toEqual(['Levure LALLEMAND Verdant IPA']);
  });
});
