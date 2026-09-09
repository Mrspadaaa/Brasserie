import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { Recipe } from '../../src/types';
import { HopRecipeSimulationPanel } from '../../src/ui/hopIndex/HopRecipeSimulationPanel';
import { hopChemicalRangeLabel } from '../../src/ui/hopIndex/HopRecipeChemistry';
import { HopWorkshop } from '../../src/ui/hopIndex/HopWorkshop';
import { StorageService } from '../../src/services/storage';
import { hopTestLot, hopTestVariety } from '../fixtures/hopIndex';
import { testHopData } from '../fixtures/hopPrediction';

const memory = vi.hoisted(() => ({ docs: new Map<string, any>(), writes: vi.fn(), confirms: vi.fn(async () => undefined) }));
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: {
  all: (name: string) => [...memory.docs.entries()].filter(([key]) => key.startsWith(name + '/')).map(([key, row]) => ({ ...structuredClone(row), __docId: key.split('/')[1] })),
  isReady: () => true, subscribe: () => () => undefined,
  put: (name: string, id: string, row: any) => { memory.writes(name, id, row); memory.docs.set(`${name}/${id}`, structuredClone(row)); },
  waitForWrites: () => memory.confirms()
} }));
beforeEach(() => { memory.docs.clear(); memory.writes.mockClear(); memory.confirms.mockClear(); });
afterEach(cleanup);

function fixture(): Recipe {
  const data = testHopData();
  for (const row of data.knowledge) memory.docs.set(`hopKnowledge/${row.id}`, row);
  memory.docs.set('hopVarieties/test-variety', hopTestVariety()); memory.docs.set('hopLots/test-lot', hopTestLot());
  return { id: 'simulation-test', name: 'Recette témoin', style: 'Libre', volumeL: 20, ogTarget: 1.05, fgTarget: 1.01, abvTarget: 5, totalGristKg: 5,
    fermentables: [], steps: [], notes: [], hopMatrixId: 'fixture-beer',
    hops: [{ name: 'Variété témoin', hopVarietyId: 'test-variety', hopLotId: 'test-lot', weightG: 80, alpha: 7, stage: 'dryHop', aromaTiming: 'fermentation', aromaTemperatureC: 20, aromaContactHours: 48 },
      { name: 'Variété témoin', hopVarietyId: 'test-variety', weightG: 40, alpha: 6, stage: 'dryHop', aromaTiming: 'fermentation', aromaTemperatureC: 20, aromaContactHours: 48 }],
    yeast: { name: 'Levure témoin', hopIndexId: 'yeast-test', form: 'sèche', qty: 1, unit: 'sachet' } };
}
const ready = () => screen.findByRole('img', { name: /Radar des saveurs/ });

describe('Simulation directe du programme réel', () => {
  it('affiche aussi les traces chimiques sans les arrondir à zéro ni resserrer les bornes', () => {
    expect(hopChemicalRangeLabel({ min: 0.0024, max: 0.0048 })).toBe('0,0024–0,0048');
    expect(hopChemicalRangeLabel({ min: 0.09999, max: 0.10001 })).toBe('0,09999–0,1001');
    expect(hopChemicalRangeLabel({ min: NaN, max: 1 })).toBe('Non quantifiable');
  });
  it('les deux cases sont indépendantes, sans recherche ni écriture, et la chimie change de périmètre', async () => {
    const recipe = fixture(), before = structuredClone(recipe), changes = vi.fn();
    render(<HopRecipeSimulationPanel recipe={recipe} onChange={changes} />); await ready();
    const full = screen.getByRole('checkbox', { name: 'Toutes les saveurs et la chimie' }), cumulative = screen.getByRole('checkbox', { name: 'Cumuler tous les ajouts' });
    expect(full).not.toBeChecked(); expect(cumulative).not.toBeChecked();
    expect(screen.queryByLabelText('Chimie des ajouts simulés')).not.toBeInTheDocument();
    fireEvent.click(full);
    const chemistry = screen.getByLabelText('Chimie des ajouts simulés');
    expect(within(chemistry).getByLabelText('Quantité introduite · Acides alpha')).toHaveTextContent('5 440–5 760 mg');
    fireEvent.click(cumulative);
    expect(full).toBeChecked(); expect(cumulative).toBeChecked();
    expect(within(chemistry).getByLabelText('Quantité introduite · Acides alpha')).toHaveTextContent('7 440–9 360 mg');
    fireEvent.click(full);
    expect(cumulative).toBeChecked(); expect(screen.queryByLabelText('Chimie des ajouts simulés')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Trouver mes combinaisons' })).not.toBeInTheDocument();
    expect(recipe).toEqual(before); expect(changes).not.toHaveBeenCalled(); expect(memory.writes).not.toHaveBeenCalled();
  });
  it('la lecture seule et sa variante ne modifient pas la recette, les détails commencent fermés', async () => {
    const recipe = fixture(), before = structuredClone(recipe);
    const { container } = render(<HopRecipeSimulationPanel recipe={recipe} readOnly />); await ready();
    expect(container.querySelectorAll('details[open]')).toHaveLength(0);
    expect(container.querySelectorAll('input:not([type="checkbox"]),textarea')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: /Conserver.*dégustation/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Explorer une variante' }));
    fireEvent.change(screen.getByLabelText('Dose (g/L)'), { target: { value: '9' } });
    expect(screen.queryByRole('button', { name: 'Appliquer ce scénario à la recette' })).not.toBeInTheDocument();
    expect(recipe).toEqual(before); expect(memory.writes).not.toHaveBeenCalled();
  });
  it('préserve une phase sèche inconnue et ne remplace pas la dose absente par zéro', async () => {
    const recipe = fixture(); recipe.volumeL = 0; recipe.hops[0].aromaTiming = undefined;
    render(<HopRecipeSimulationPanel recipe={recipe} />); await ready();
    expect(screen.getByText(/À cru · phase à préciser/)).toHaveTextContent('Dose non précisée');
    expect(recipe.hops[0].aromaTiming).toBeUndefined(); expect(memory.writes).not.toHaveBeenCalled();
  });
  it('garde le COA partiel distinct des références de variété', async () => {
    const recipe = fixture();
    recipe.hops = [recipe.hops[0]];
    render(<HopRecipeSimulationPanel recipe={recipe} readOnly />); await ready();
    fireEvent.click(screen.getByText('Composition, thiols et phénols'));
    const composition = await screen.findByLabelText('Composition analytique');
    const alpha = within(composition).getByText('Acides alpha').closest('details')!;
    const oil = within(composition).getByText('Huiles totales').closest('details')!;
    expect(alpha).toHaveTextContent('COA du lot'); expect(oil).toHaveTextContent('Valeur de référence variété');
    expect(alpha).toHaveTextContent('7 % du houblon'); expect(oil).toHaveTextContent('1–3 mL/100 g');
    expect(memory.writes).not.toHaveBeenCalled();
  });
  it('une contribution inconnue ne devient pas un total chimique connu', async () => {
    const recipe = fixture(); recipe.hops[1] = { ...recipe.hops[1], name: 'Lot inconnu', hopVarietyId: undefined };
    render(<HopRecipeSimulationPanel recipe={recipe} />); await ready();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Cumuler tous les ajouts' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Toutes les saveurs et la chimie' }));
    const alpha = screen.getByLabelText('Quantité introduite · Acides alpha');
    expect(alpha).toHaveTextContent('Non quantifiable'); expect(alpha).toHaveTextContent('1/2 ajout(s) renseigné(s)');
    expect(alpha).toHaveTextContent('Contributions connues seulement'); expect(alpha).toHaveTextContent('Le total reste inconnu');
    expect(memory.writes).not.toHaveBeenCalled();
  });
  it('un COA ponctuel sans marge reste nominal et ne reçoit pas de bande fabriquée', async () => {
    const recipe = fixture(); recipe.hops = [recipe.hops[0]];
    const lot = memory.docs.get('hopLots/test-lot'); delete lot.analysis[0].range;
    render(<HopRecipeSimulationPanel recipe={recipe} readOnly />); await ready();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Toutes les saveurs et la chimie' }));
    const alpha = screen.getByLabelText('Quantité introduite · Acides alpha');
    expect(alpha).toHaveTextContent('5 600 mg');
    expect(alpha).toHaveTextContent('Quantité nominale calculée ; incertitude analytique non publiée.');
    expect(alpha.querySelector('span[style*="width:"]')).toBeNull();
    expect(memory.writes).not.toHaveBeenCalled();
  });
  it('reconnaît Cascade et Diamond sans inventer du houblonnage à cru depuis les notes de fermentation', async () => {
    const recipe = fixture();
    recipe.name = 'Test houb'; recipe.volumeL = 24;
    recipe.hops = [{ name: 'Cascade', weightG: 28.8, alpha: 6.2, stage: 'boil', timeMin: 10 }, { name: 'Cascade', weightG: 72, alpha: 6.2, stage: 'whirlpool', timeMin: 20, tempC: 80 }];
    recipe.yeast = { name: 'LalBrew Diamond', form: 'sèche', qty: 0, unit: 'sachet' };
    recipe.fermentation = [{ kind: 'primaire', name: 'Fermentation primaire', tempC: 19, days: 4 }, { kind: 'ajout', name: 'Premier houblonnage à cru', tempC: 19, days: 3 }];
    const before = structuredClone(recipe);
    render(<HopRecipeSimulationPanel recipe={recipe} readOnly />); await ready();
    expect(screen.getByText(/Ébullition · 1,2 g\/L/)).toHaveTextContent('10 min');
    fireEvent.change(screen.getByLabelText('Ajout simulé'), { target: { value: '1' } });
    expect(screen.getByText(/Whirlpool · 3 g\/L/)).toHaveTextContent('80 °C · 20 min');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Cumuler tous les ajouts' }));
    expect(screen.getByText(/2 ajouts · enveloppe expérimentale/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Composition, thiols et phénols'));
    expect(await screen.findByRole('link', { name: 'Fiche complète de Cascade sur Beer Maverick' })).toHaveAttribute('href', 'https://beermaverick.com/hop/cascade/');
    expect(recipe).toEqual(before); expect(memory.writes).not.toHaveBeenCalled();
  });
  it('une recette contenant des ajouts ouvre directement leur simulation', async () => {
    render(<HopWorkshop recipe={fixture()} />); await ready();
    expect(screen.getByRole('button', { name: 'Simuler mes ajouts' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByLabelText('Solver de houblonnage')).not.toBeInTheDocument();
  });
  it('fige le programme sur action explicite, avec ses deux ajouts et une seule écriture idempotente', async () => {
    render(<HopRecipeSimulationPanel recipe={fixture()} />); await ready();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Cumuler tous les ajouts' }));
    expect(memory.writes).not.toHaveBeenCalled();
    const save = screen.getByRole('button', { name: 'Conserver le programme pour une dégustation' }); fireEvent.click(save);
    await screen.findByText('Simulation conservée avec ses conditions et ses sources pour la dégustation.');
    const snapshot = StorageService.getHopPredictions()[0];
    expect(snapshot.recipePrediction?.input.additions).toHaveLength(2);
    expect(snapshot.recipePrediction?.overall).not.toHaveProperty('triplet');
    expect(memory.writes).toHaveBeenCalledTimes(1); expect(memory.confirms).toHaveBeenCalledTimes(1);
    fireEvent.click(save); await waitFor(() => expect(memory.confirms).toHaveBeenCalledTimes(2));
    expect(memory.writes).toHaveBeenCalledTimes(1);
  });
});
