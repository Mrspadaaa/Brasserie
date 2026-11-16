import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductionTab } from '../../src/components/tabs/ProductionTab';
import { BatchCard } from '../../src/ui/production/CatalogCards';
import { batchEntries } from '../../src/domain/productionCatalog';
import { StorageService } from '../../src/services/storage';
import type { Batch, BrewhouseProfile, Recipe } from '../../src/types';

const brewhouse: BrewhouseProfile = { id: 'qa', name: 'Cuve QA', volumeL: 30, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 3 };
const recipe: Recipe = { id: 'qa', name: 'Pale Ale', style: 'Pale Ale', volumeL: 30, fermentables: [{ name: 'Pale', weightKg: 6, kind: 'grain', use: 'empatage', potentialPpg: 37, colorEbc: 5 }], hops: [{ name: 'Citra', weightG: 100, stage: 'boil', timeMin: 15, alpha: 12 }], adjuncts: [{ name: 'Écorce', amount: 30, unit: 'g', step: 'Ébullition' }], yeast: { name: 'US-05', qty: 1, unit: 'sachet' } };
function mount(recipes: Recipe[] = [recipe], brewhouses = [brewhouse]) {
  return render(<ProductionTab recipes={recipes} batches={[]} brewhouses={brewhouses} activeBrewhouseId="qa" globalTimeFilter="all" targetSubTab="scaler" onOpenCreateBatch={vi.fn()} onOpenQuickAction={vi.fn()} onOpenRecipe={vi.fn()} onOpenBrewDay={vi.fn()} onDraftRecipe={vi.fn()}/>);
}
beforeEach(() => { localStorage.clear(); vi.spyOn(StorageService, 'setUiState').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

// Maquette e10c : le volume cible se tape après « Taper le volume » (champ texte décimal, jamais type="number"),
// se valide au blur ou à Entrée ; le curseur remplace les anciens pas « Ajouter / Retirer 0,5 L » et « Rétablir 30 L » ;
// les quantités sont rangées par moment dans [data-role="etapes"] (plus de tableau) ; les totaux sont dans « Totaux ».
const matchMedia = (coarse: boolean) => vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ matches: coarse && query === '(pointer: coarse)', media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false }));
const ouvrir = () => { fireEvent.click(screen.getByRole('button', { name: 'Taper le volume' })); return screen.getByRole('textbox', { name: 'Volume cible' }); };
const totaux = () => screen.getByLabelText('Totaux');
const etapes = () => document.querySelector('[data-role="etapes"]') as HTMLElement | null;
const curseur = () => screen.getByRole('slider', { name: 'Volume cible, curseur' });
const ligne = (nom: string) => within(etapes() as HTMLElement).getByText(nom).closest('.pv-row') as HTMLElement;
const sansTotaux = () => { expect(totaux().textContent).not.toMatch(/\d/); expect(within(totaux()).getAllByText('—')).toHaveLength(3); };

describe('adaptation compacte de la production', () => {
  it.each([false, true])('retire le scénario lors de l’effacement réel puis reste vide après Tab (coarse=%s)', async coarse => {
    matchMedia(coarse);
    const user = userEvent.setup();
    mount();
    const field = ouvrir();
    expect(field.tagName).toBe('INPUT');
    expect(field).toHaveAttribute('type', 'text');
    expect(field).toHaveAttribute('inputmode', 'decimal');
    await user.clear(field);
    expect(field).toHaveValue('');
    await user.tab();
    // Validé vide : refus dit, aucun total (jamais 0), le champ revient au bouton « — ».
    expect(screen.getByRole('alert')).toHaveTextContent('Indique un volume cible de 0,5 L ou plus.');
    sansTotaux();
    expect(screen.getByRole('button', { name: 'Taper le volume' })).toHaveAttribute('data-invalide');
    // Le curseur remplace « Rétablir 30 L » et « Ajouter 0,5 L ».
    fireEvent.change(curseur(), { target: { value: '30.5' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(totaux()).toHaveTextContent('6,10 kg');
    const champ2 = ouvrir();
    await user.clear(champ2);
    await user.tab();
    expect(screen.getByRole('alert')).toHaveTextContent('Indique un volume cible de 0,5 L ou plus.');
    sansTotaux();
    const champ3 = ouvrir();
    await user.clear(champ3);
    await user.type(champ3, '12,5{Enter}');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(totaux()).toHaveTextContent('2,50 kg');
    const champ4 = ouvrir();
    await user.click(champ4);
    await user.keyboard('{Control>}a{/Control}{Backspace}');
    await user.tab();
    expect(champ4).not.toBeInTheDocument();
    sansTotaux();
  });

  it('accepte un volume décimal hors des quatre anciens choix et conserve la recette source', () => {
    const original = structuredClone(recipe);
    mount();
    const field = ouvrir();
    fireEvent.change(field, { target: { value: '25,5' } });
    fireEvent.blur(field);
    expect(totaux()).toHaveTextContent('5,10 kg');
    expect(ligne('Pale')).toHaveTextContent(/5,10\s*kg/);
    expect(ligne('Citra')).toHaveTextContent(/85(,0+)?\s*g/);
    expect(ligne('Écorce')).toHaveTextContent(/26\s*g/); // 25,5 g affichés au gramme (décimales de la maquette), écart −4 g à la recette
    expect(recipe).toEqual(original);
    fireEvent.change(curseur(), { target: { value: '26' } });
    expect(curseur()).toHaveAttribute('aria-valuetext', '26 L');
    expect(totaux()).toHaveTextContent('5,20 kg');
  });
  it.each([false, true])('garde la saisie accessible si le volume est invalide puis recalcule après correction (coarse=%s)', coarse => {
    matchMedia(coarse);
    mount();
    let field = ouvrir();
    expect(field.tagName).toBe('INPUT');
    fireEvent.keyDown(field, { key: 'Escape' });
    const taper = (valeur: string) => { field = ouvrir(); fireEvent.change(field, { target: { value: valeur } }); fireEvent.blur(field); };
    taper('-2');
    expect(screen.getByRole('alert')).toHaveTextContent('0,5 L ou plus');
    sansTotaux();
    taper('15');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(totaux()).toHaveTextContent('3,00 kg');
    taper('abc');
    expect(screen.getByRole('alert')).toHaveTextContent('Volume non reconnu');
    expect(screen.getByRole('button', { name: 'Taper le volume' })).toHaveAttribute('data-invalide');
    sansTotaux();
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/);
    // Le champ rouvert garde la saisie refusée, décrite par le message.
    field = ouvrir();
    expect(field).toHaveValue('abc');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription(/Volume non reconnu/);
    fireEvent.keyDown(field, { key: 'Escape' });
    fireEvent.change(curseur(), { target: { value: '15.5' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(curseur()).toHaveAttribute('aria-valuetext', '15,5 L');
    expect(totaux()).toHaveTextContent('3,10 kg');
    taper('inconnu');
    fireEvent.change(curseur(), { target: { value: '30' } });
    expect(curseur()).toHaveAttribute('aria-valuetext', '30 L');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    taper('');
    expect(screen.getByRole('alert')).toHaveTextContent('Indique un volume cible de 0,5 L ou plus.');
    sansTotaux();
    fireEvent.change(curseur(), { target: { value: '5' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(totaux()).toHaveTextContent('1,00 kg');
    taper('inconnu');
    taper('30,0');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(curseur()).toHaveAttribute('aria-valuetext', '30 L');
    expect(totaux()).toHaveTextContent('6,00 kg');
  });
  it('permet de changer de source même si une recette a un volume nul et signale une cuverie absente', () => {
    const view = mount([{ ...recipe, id: 'incomplete', volumeL: 0 }, recipe]);
    fireEvent.change(screen.getByRole('combobox', { name: 'Recette source' }), { target: { value: 'incomplete' } });
    fireEvent.change(curseur(), { target: { value: '20' } });
    expect(screen.getByRole('alert')).toHaveTextContent('recette source');
    fireEvent.change(screen.getByRole('combobox', { name: 'Recette source' }), { target: { value: 'qa' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(etapes()).not.toBeNull();
    view.unmount();
    mount([recipe], []);
    expect(screen.getByRole('alert')).toHaveTextContent('Configure une cuverie');
  });
  it.each([
    ['planifie', undefined, undefined, '30 L visés'],
    ['fermentation', 28, undefined, '28 L en cuve'],
    ['conditionne', 28, 25, '25 L conditionnés'],
    ['conditionne', undefined, undefined, '— L conditionnés'],
    ['annule', undefined, undefined, '30 L visés'],
  ] as const)('affiche le volume pertinent pour un brassin %s', (status, volumeBrewedL, volumePackagedL, expected) => {
    const batch: Batch = { id: 'QA', name: 'Pale Ale', style: 'Pale Ale', volumeL: 30, status, volumeBrewedL, volumePackagedL };
    const onOpen = vi.fn();
    render(<BatchCard compact entry={batchEntries([batch])[0]} onOpen={onOpen} onBrew={vi.fn()} onFavorite={vi.fn()} onArchive={vi.fn()}/>);
    expect(screen.getByRole('button', { name: 'Ouvrir le brassin QA' })).toHaveTextContent(expected);
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le brassin QA' }));
    expect(onOpen).toHaveBeenCalledWith(batch);
  });
  it.each([null, Number.NaN, Number.POSITIVE_INFINITY])('garde les brassins consultables quand les cibles exportées sont inconnues (%s)', (unknownTarget) => {
    const batches = (['planifie', 'fermentation', 'conditionne'] as const).map(status => ({
      id: status, name: 'Recette importée', style: 'Pale Ale', volumeL: 30, status,
      recipeSnapshot: { ...recipe, ogTarget: 1.046, fgTarget: unknownTarget, abvTarget: unknownTarget },
    } as Batch));
    const onOpen = vi.fn();
    const view = render(<>{batchEntries(batches).map(entry => <BatchCard key={entry.id} entry={entry} onOpen={onOpen} onBrew={vi.fn()} onFavorite={vi.fn()} onArchive={vi.fn()}/>)}</>);
    for (const batch of batches) {
      const card = screen.getByRole('article', { name: `Brassin ${batch.id}, Recette importée` });
      expect(card).toHaveTextContent('—');
      expect(card).not.toHaveTextContent(/NaN|Infinity|∞/);
      fireEvent.click(within(card).getByRole('button', { name: `Ouvrir le brassin ${batch.id}` }));
      expect(onOpen).toHaveBeenCalledWith(batch);
    }
    expect(view.container).toHaveTextContent('Alcool cible—');
    expect(view.container).toHaveTextContent('FG visée —');
  });
});
