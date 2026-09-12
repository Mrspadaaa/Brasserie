import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrewSheet, type BrewSheetProps, type WaterRecap } from '../../src/ui/BrewSheet';
import { RecipeDisclosure, RecipeWaterVolumes } from '../../src/ui/RecipeDisclosure';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(cleanup);

const shortages: BrewSheetProps['shortages'] = [
  { name: 'Pale Ale', have: 1.25, needed: 4.2, unit: 'kg' },
  { name: 'Cascade', have: 20.5, needed: 57.67, unit: 'g' },
  { name: 'Levure sèche de fermentation haute', have: 0, needed: 12.5, unit: 'g' }
];
const water: WaterRecap = {
  sourceName: 'Réseau', styleName: 'Pale Ale', mashWaterL: 17.5, spargeWaterL: 11.7,
  diRatioPct: 33.333, spargeDiRatioPct: 40.125, spargeLinked: false,
  mashOsmoseeL: 5.83, spargeOsmoseeL: 4.47,
  mashIons: { ca: 50, mg: 5, na: 10, so4: 80, cl: 50, hco3: 25 },
  spargeIons: { ca: 50, mg: 5, na: 10, so4: 80, cl: 50, hco3: 25 },
  ra: 12.5, raBand: { min: 10.5, max: 20.5, label: 'repère' },
  ratio: { ratio: 1.6, label: 'Équilibré' }, doses: {}, split: { mash: {}, sparge: {} },
  acidId: 'lactique', mashAcid: { amount: 0, unit: 'mL' },
  spargeAcid: { amount: 0, unit: 'mL', targetPh: 5.5 }, disabled: [], mashPh: 5.4, spargePh: 5.8
};
function props(overrides: Partial<BrewSheetProps> = {}): BrewSheetProps {
  return {
    name: 'Pale de septembre', onName: vi.fn(), style: 'American Pale Ale', onStyle: vi.fn(),
    volumeL: 20.5, onVolumeL: vi.fn(), boilMin: 60, onBoilMin: vi.fn(),
    carboTarget: '', onCarboTarget: vi.fn(),
    fermentables: [{ name: 'Pale Ale', kind: 'grain', use: 'empatage', weightKg: 4.2, colorEbc: 5, potentialPpg: 37 }],
    onFermentables: vi.fn(), totalGristKg: 4.2,
    hops: [{ name: 'Cascade', weightG: 57.67, alpha: 5.5, stage: 'boil', timeMin: 10 }],
    onHops: vi.fn(), hopIbu: () => 3.1,
    yeast: { name: 'Levure sèche de fermentation haute', form: 'sèche', qty: 12.5, unit: 'g' }, onYeast: vi.fn(),
    mashSteps: [{ name: 'Saccharification', tempC: 66.5, durationMin: 60 }], onMashSteps: vi.fn(),
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19.5, days: 10 }], onFermentation: vi.fn(),
    mashWaterL: 17.5, onMashWaterL: vi.fn(), spargeWaterL: 11.7, onSpargeWaterL: vi.fn(), water,
    notes: 'Refroidir puis ensemencer.', onNotes: vi.fn(), shortages, ...overrides
  };
}
function section(container: HTMLElement, title: string) {
  const node = Array.from(container.querySelectorAll<HTMLDetailsElement>('[data-recipe-section]'))
    .find(details => details.dataset.recipeSection === title);
  if (!node) throw new Error(`Section ${title} introuvable`);
  return { node, summary: node.querySelector('summary')! };
}

describe('récapitulatif : décider des achats sans ouvrir le stock', () => {
  it.each([1, 3])('annonce %i besoin(s) fermé, puis conserve nom, disponible, nécessaire et unités', async count => {
    const { container } = render(<BrewSheet {...props({ shortages: shortages.slice(0, count) })} />);
    const stock = section(container, 'Stock');
    expect(stock.node).not.toHaveAttribute('open');
    const message = `${count} ingrédient${count > 1 ? 's' : ''} à commander`;
    expect(within(stock.summary).getByRole('status')).toHaveTextContent(message);
    expect(within(stock.summary).getByText(message)).toBeVisible();
    expect(within(stock.node).queryByText('Stock suffisant')).toBeNull();
    expect(within(stock.node).getByText('Nécessaire')).not.toBeVisible();

    await userEvent.click(stock.summary);
    expect(stock.node).toHaveAttribute('open');
    const table = within(stock.node).getByRole('table', { name: 'Disponibilités pour les ingrédients à commander' });
    expect(within(table).getByRole('columnheader', { name: 'Disponible' })).toBeVisible();
    expect(within(table).getByRole('columnheader', { name: 'Nécessaire' })).toBeVisible();
    const pale = within(table).getByRole('rowheader', { name: 'Pale Ale' }).closest('tr')!;
    expect(within(pale).getAllByRole('cell').map(cell => cell.textContent)).toEqual(['1,25 kg', '4,2 kg']);
    if (count === 3) {
      const cascade = within(table).getByRole('rowheader', { name: 'Cascade' }).closest('tr')!;
      expect(within(cascade).getAllByRole('cell').map(cell => cell.textContent)).toEqual(['20,5 g', '57,67 g']);
      expect(within(table).getByRole('rowheader', { name: shortages[2].name })).toBeVisible();
      expect(within(table).getByText('0 g')).toBeVisible();
      expect(within(table).getByText('12,5 g')).toBeVisible();
    }
    await userEvent.click(stock.summary);
    expect(stock.node).not.toHaveAttribute('open');
    expect(within(stock.summary).getByText(message)).toBeVisible();
  });

  it('oppose au manque un vrai contrôle sans pénurie, et actualise le résumé si le stock change', () => {
    const view = render(<BrewSheet {...props({ shortages: [] })} />);
    const stock = section(view.container, 'Stock');
    expect(stock.node).not.toHaveAttribute('open');
    expect(within(stock.summary).getByRole('status')).toHaveTextContent('Stock suffisant');
    expect(within(stock.summary).queryByText(/à commander/)).toBeNull();
    fireEvent.click(stock.summary);
    expect(within(stock.node).getByText('Tout est disponible pour brasser.')).toBeVisible();
    fireEvent.click(stock.summary);

    view.rerender(<BrewSheet {...props()} />);
    expect(stock.node).not.toHaveAttribute('open');
    expect(within(stock.summary).getByRole('status')).toHaveTextContent('3 ingrédients à commander');
    expect(within(stock.summary).queryByText('Stock suffisant')).toBeNull();
  });

  it('ne confond pas l’absence de besoin avec un stock suffisant', () => {
    const { container } = render(<BrewSheet {...props({
      shortages: [], fermentables: [], hops: [], yeast: { name: '', form: 'sèche', qty: Number.NaN, unit: '' }
    })} />);
    const stock = section(container, 'Stock');
    expect(within(stock.summary).getByRole('status')).toHaveTextContent('Besoins à renseigner');
    expect(within(stock.node).queryByText('Stock suffisant')).toBeNull();
    fireEvent.click(stock.summary);
    expect(within(stock.node).getByText('Renseigne les ingrédients et leurs quantités pour vérifier le stock.')).toBeVisible();
  });

  it('ne déclare pas le stock suffisant quand une masse manque parmi les ingrédients', () => {
    const recipe = props({ shortages: [] });
    recipe.fermentables[0].weightKg = Number.NaN;
    const { container } = render(<BrewSheet {...recipe} />);
    const stock = section(container, 'Stock');
    expect(within(stock.summary).getByRole('status')).toHaveTextContent('Besoins à compléter');
    expect(within(stock.node).queryByText('Stock suffisant')).toBeNull();
    fireEvent.click(stock.summary);
    expect(within(stock.node).getByText('Complète les ingrédients et leurs quantités pour vérifier tout le stock.')).toBeVisible();
  });
});

describe('récapitulatif : mesures françaises et contenu préservé', () => {
  it('localise quantités, IBU, ratios et chimie sans muter les données de calcul', () => {
    const recipe = props();
    const original = JSON.stringify({ water: recipe.water, fermentables: recipe.fermentables, hops: recipe.hops });
    const { container } = render(<BrewSheet {...recipe} />);
    expect(section(container, 'Identité').summary).toHaveTextContent('20,5 L');
    expect(section(container, 'Fermentescibles').summary).toHaveTextContent('4,2 kg');
    expect(section(container, 'Houblons').summary).toHaveTextContent('57,67 g');
    expect(section(container, 'Eau').summary).toHaveTextContent('4,2 L/kg');
    for (const title of ['Identité', 'Houblons', 'Eau']) fireEvent.click(section(container, title).summary);
    expect(screen.getByPlaceholderText('2,5 vol')).toBeVisible();
    expect(screen.getByText('3,1 IBU')).toBeVisible();
    expect(screen.getByText('33,33 % d’osmosée')).toBeVisible();
    expect(screen.getByText('40,13 % d’osmosée · délié')).toBeVisible();
    expect(screen.getByText('5,83 L empâtage + 4,47 L rinçage')).toBeVisible();
    expect(within(section(container, 'Eau').node).getByText('18,9 L')).toBeVisible();
    fireEvent.click(screen.getByText('pH et chimie détaillée'));
    expect(screen.getByText('12,5')).toBeVisible();
    expect(screen.getByText('1,6')).toBeVisible();
    expect(screen.getByText(/repère des malts 10,5 à 20,5/)).toBeVisible();
    expect(screen.getByText(/maische 5,4 · rinçage 5,8/)).toBeVisible();
    expect(JSON.stringify({ water: recipe.water, fermentables: recipe.fermentables, hops: recipe.hops })).toBe(original);
  });

  it('garde les eaux visibles, les résumés longs entiers et les détails au clavier', async () => {
    const long = 'Programme de fermentation avec levure de saison, montée progressive puis garde prolongée';
    const { container } = render(<>
      <RecipeWaterVolumes totalL={29.2} roL={10.3} />
      <RecipeDisclosure title="Fermentation" summary={long}><input aria-label="Consigne" defaultValue="19,5" /></RecipeDisclosure>
      <RecipeDisclosure title="Eau" summary="11,7 L de rinçage"><p>Doses conservées</p></RecipeDisclosure>
    </>);
    expect(screen.getByText(long)).toBeVisible();
    expect(screen.getByLabelText('Eaux à préparer')).toBeVisible();
    expect(screen.getByText('10,3 L')).toBeVisible();
    expect(screen.getByText('18,9 L')).toBeVisible();
    expect(screen.getByText('29,2 L')).toBeVisible();
    const fermentation = section(container, 'Fermentation');
    expect(document.getElementById(fermentation.summary.getAttribute('aria-controls')!)).toContainElement(screen.getByLabelText('Consigne'));
    await userEvent.tab();
    expect(fermentation.summary).toHaveFocus();
    // jsdom does not implement native summary activation with Enter/Space.
    // Its tab order and content are checked here; native activation is checked in the browser.
    fireEvent.click(fermentation.summary);
    expect(fermentation.node).toHaveAttribute('open');
    await userEvent.tab();
    expect(screen.getByLabelText('Consigne')).toHaveFocus();
    fireEvent.click(section(container, 'Eau').summary);
    expect(container.querySelectorAll('details[open]')).toHaveLength(2);
    expect(screen.getByText('Doses conservées')).toBeVisible();
    expect(screen.getByLabelText('Eaux à préparer')).toBeVisible();
  });

  it('révèle les erreurs dynamiques imbriquées et laisse la correction accessible', async () => {
    function Host() {
      const [invalid, setInvalid] = useState(false);
      return <>
        <button type="button" onClick={() => setInvalid(true)}>Vérifier</button>
        <RecipeDisclosure title="Eau">
          <details><summary>Acidification</summary>
            <label>pH<input aria-invalid={invalid || undefined} value={invalid ? '' : '5,4'} onChange={() => setInvalid(false)} /></label>
            {invalid && <p role="alert">Renseigne le pH mesuré.</p>}
          </details>
        </RecipeDisclosure>
      </>;
    }
    const { container } = render(<Host />);
    expect(container.querySelectorAll('details[open]')).toHaveLength(0);
    await userEvent.click(screen.getByRole('button', { name: 'Vérifier' }));
    await waitFor(() => expect(container.querySelectorAll('details[open]')).toHaveLength(2));
    expect(screen.getByRole('alert')).toBeVisible();
    await userEvent.click(screen.getByLabelText('pH'));
    expect(screen.getByLabelText('pH')).toHaveFocus();
    fireEvent.change(screen.getByLabelText('pH'), { target: { value: '5,4' } });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByLabelText('pH')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByLabelText('pH')).toHaveValue('5,4');
  });

  it('affiche une absence avec son unité quand les volumes ne sont pas calculables', () => {
    const { container } = render(<BrewSheet {...props({ volumeL: Number.NaN, mashWaterL: Number.NaN })} />);
    expect(section(container, 'Identité').summary).toHaveTextContent('— L');
    expect(section(container, 'Eau').summary).toHaveTextContent('— L/kg');
    const volumes = screen.getByLabelText('Eaux à préparer');
    expect(volumes).not.toHaveTextContent('NaN');
    expect(within(volumes).getAllByText('— L')).toHaveLength(2);
  });

  it.each([
    ['Identité', 'Volume', 'onVolumeL', undefined],
    ['Identité', 'Ébullition', 'onBoilMin', undefined],
    ['Fermentescibles', 'Masse de Pale Ale', 'onFermentables', 'weightKg'],
    ['Houblons', 'Masse de Cascade', 'onHops', 'weightG'],
    ['Levure', 'Quantité de levure', 'onYeast', 'qty'],
    ['Paliers d’empâtage', 'Température du palier Saccharification', 'onMashSteps', 'tempC'],
    ['Paliers d’empâtage', 'Durée du palier Saccharification', 'onMashSteps', 'durationMin'],
    ['Fermentation', 'Température de Primaire', 'onFermentation', 'tempC'],
    ['Fermentation', 'Durée de Primaire', 'onFermentation', 'days'],
    ['Eau', 'Eau d’empâtage', 'onMashWaterL', undefined],
    ['Eau', 'Eau de rinçage', 'onSpargeWaterL', undefined]
  ] as const)('préserve l’absence de %s / %s après effacement, puis accepte sa correction', (title, label, callback, key) => {
    const recipe = props();
    const { container } = render(<BrewSheet {...recipe} />);
    fireEvent.click(section(container, title).summary);
    const field = screen.getByRole('textbox', { name: label, exact: true });
    fireEvent.change(field, { target: { value: '' } });
    fireEvent.blur(field);
    const mock = vi.mocked(recipe[callback]);
    const emitted = mock.mock.lastCall![0];
    const value = key ? (Array.isArray(emitted) ? emitted[0][key] : emitted[key]) : emitted;
    expect(value).toBeNaN();
    expect(field).toHaveValue('');
    fireEvent.change(field, { target: { value: '12' } });
    fireEvent.blur(field);
    const corrected = mock.mock.lastCall![0];
    expect(key ? (Array.isArray(corrected) ? corrected[0][key] : corrected[key]) : corrected).toBe(12);
    expect(field).toHaveValue('12');
  });
});
