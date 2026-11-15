import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrewBudgetSheet } from '../../src/ui/finance/BrewBudgetSheet';
import type { AppConfig, Batch, Recipe, StockItem } from '../../src/types';
import type { FinanceTransaction } from '../../src/domain/finance/types';
import { demandKey, estimateBrewBudget, type BrewBudgetSettings, type BrewBudgetSnapshot } from '../../src/domain/finance/brewBudget';

vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: (p: { initialQuestion?: string }) => <div data-testid="chat">{p.initialQuestion}</div> }));

const recipe = { id: 'R1', name: 'Pale Ale', style: 'Pale Ale', volumeL: 30, brewDate: '15.09.2026', fermentables: [{ name: 'Pils', weightKg: 5, kind: 'grain', use: 'empatage' }], hops: [], yeast: { name: '', qty: 0, unit: 'sachet', form: 'sèche' } } as Recipe;
const stock = { id: 'M', ref: 'M', name: 'Pils', unit: 'kg', currentStock: 2, category: 'Malt', minStock: 0, reorder: false } as StockItem;
const config = { fiscal: { isTvaRegistered: false }, brewhouses: [] } as unknown as AppConfig;
const settings: BrewBudgetSettings = { costs: { energy: { enabled: false }, cleaning: { enabled: false }, packaging: { enabled: false }, beerTax: { enabled: false } }, includeFixed: false, includeDepreciation: false };

// Fixture de c3a (celle de `chaineLitre.test.ts`) : 27 L nets, 22,41 déjà payé + 64,26 à payer + 116,10 de l'année = 202,77 ; 7,51 CHF/L.
const pilsner = { id: 'MP-1', ref: 'MP-1', name: 'Pilsner', unit: 'kg', currentStock: 6, category: 'Malt', minStock: 0, reorder: false } as StockItem;
const pale = { id: 'MP-2', ref: 'MP-2', name: 'Pale', unit: 'kg', currentStock: 0, category: 'Malt', minStock: 0, reorder: false } as StockItem;
const c3aRecipe = { id: 'R3', name: 'Pale Ale de septembre', style: 'Pale Ale', volumeL: 30, brewDate: '15.09.2026', ogTarget: 1.048, hops: [], yeast: { name: '', qty: 0, unit: 'sachet', form: 'dry' },
  fermentables: [{ name: 'Pilsner', weightKg: 5.6025, kind: 'grain', use: 'empatage' }, { name: 'Pale', weightKg: 5.605, kind: 'grain', use: 'empatage' }] } as unknown as Recipe;
const c3aSettings: BrewBudgetSettings = { costs: { energy: { enabled: true, amountTTC: 8 }, cleaning: { enabled: true, amountTTC: 3 }, packaging: { enabled: true, amountTTC: 24 }, beerTax: { enabled: true } },
  includeFixed: true, includeDepreciation: true, annualVolumeL: 1200, annualFixedCHF: 4800, annualDepreciationCHF: 360 };
const p4 = { amount: 4, quantity: 1, unit: 'kg', basis: 'TTC', tvaRate: 0, source: 'manual', date: '09.09.2026' } as const;
const c3aPrices = { [demandKey('Pilsner', 'kg')]: p4, [demandKey('Pale', 'kg')]: p4 };
const c3aSaved = (patch = {}) => estimateBrewBudget({ recipe: c3aRecipe, stockItems: [pilsner, pale], batches: [], brewDate: '15.09.2026', netVolumeL: 27, og: '1.048', settings: c3aSettings, prices: c3aPrices, now: '2026-09-09T12:00:00Z', ...patch });
const renderC3a = (props: Partial<React.ComponentProps<typeof BrewBudgetSheet>> = {}) => render(<BrewBudgetSheet open recipe={c3aRecipe} stockItems={[pilsner, pale]} batches={[]} config={config} savedEstimate={c3aSaved()} onSave={vi.fn()} onClose={vi.fn()} {...props} />);

const aller = {
  volumes: () => fireEvent.click(screen.getByRole('button', { name: /^Volumes :/ })),
  noeud: (label: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${label} :`) })),
  retour: () => fireEvent.click(screen.getByRole('button', { name: 'Retour' })),
};
const prevoir = () => screen.getByRole('button', { name: /^Prévoir/ });
const texte = (sel: string) => document.querySelector(sel)?.textContent ?? '';
// Les autres tests partent d'un jour choisi par le brasseur et de litres nets saisis (jamais le volume à brasser par défaut).
function renderBudgetWithChosenDate(ui: React.ReactElement, net: string | null = '30') {
  const view = render(ui);
  aller.volumes();
  const date = screen.getByLabelText('Date du scénario budgétaire') as HTMLInputElement;
  if (!date.value) fireEvent.change(date, { target: { value: '2026-09-15' } });
  const n = screen.getByLabelText('Volume net attendu') as HTMLInputElement;
  if (net && !n.value) fireEvent.change(n, { target: { value: net } });
  aller.retour();
  return view;
}
afterEach(cleanup);

describe('c3a : le flux, les trois notions et le litre', () => {
  it('repos : trois sources, huit destinations, 202,77 ÷ 27 L = 7,51, le litre en trois temps', () => {
    const { container } = renderC3a();
    expect(texte('[data-s="stock"]')).toContain('22,41'); expect(texte('[data-s="now"]')).toContain('64,26'); expect(texte('[data-s="an"]')).toContain('116,10');
    for (const nom of ['Malt : 44,83 CHF', 'Énergie : 8,00 CHF', 'Nettoyage : 3,00 CHF', 'Emballage : 24,00 CHF', 'Impôt bière : 6,84 CHF', 'Usure matériel : 8,10 CHF', 'Charges fixes : 108,00 CHF', 'Houblon, levure : hors recette']) {
      expect(screen.getByRole('button', { name: nom })).toBeInTheDocument();
    }
    const bloc = texte('[data-booster="deux-nombres"]');
    expect(bloc).toContain('202,77'); expect(bloc).toContain('÷ 27 L'); expect(bloc).toContain('7,51'); expect(bloc).toContain('estimé');
    const barre = texte('.cbf-litl');
    expect(barre).toContain('0,83'); expect(barre).toContain('2,38'); expect(barre).toContain('4,30');
    expect(screen.getByRole('button', { name: 'Expliquer' })).toBeInTheDocument();
    expect(prevoir()).toHaveTextContent('Prévoir 64,26 CHF');
    expect(prevoir()).toBeEnabled();
    expect(container.querySelectorAll('input[type=number]')).toHaveLength(0);
  });
  it('sans houblon ni levure dans la recette, le « ? » est hors recette : le litre 7,51 reste, dit « sans houblon ni levure »', () => {
    renderC3a();
    expect(texte('[data-booster="deux-nombres"]')).toContain('sans houblon ni levure');
    expect(texte('[data-d="q"]')).toContain('?');
  });
  it('« À payer » touché : 64,26 en deux temps (33,42 avant le brassage, 30,84 plus tard), les autres sources estompées', () => {
    renderC3a();
    fireEvent.click(document.querySelector('[data-s="now"]')!);
    expect(document.querySelector('[data-s="now"]')).toHaveAttribute('aria-pressed', 'true');
    const bloc = texte('[data-booster="deux-nombres"]');
    expect(bloc).toContain('64,26'); expect(bloc).toContain('avant le brassage'); expect(bloc).toContain('33,42'); expect(bloc).toContain('plus tard'); expect(bloc).toContain('30,84');
    expect(document.querySelector('[data-s="stock"]')).toHaveAttribute('data-pale', 'true');
    expect(document.querySelector('[data-s="an"]')).toHaveAttribute('data-pale', 'true');
    expect(document.querySelector('[data-d="fix"]')).toHaveAttribute('data-pale', 'true');
    expect(document.querySelector('[data-d="malt"]')).not.toHaveAttribute('data-pale');
    fireEvent.click(document.querySelector('[data-s="now"]')!);
    expect(texte('[data-booster="deux-nombres"]')).toContain('7,51');
  });
  it('un prix manquant : nœud « ? », litre « — » (jamais 0), Prévoir grisé, Enregistrer possible', async () => {
    const save = vi.fn();
    renderC3a({ savedEstimate: c3aSaved({ prices: {} }), onSave: save });
    expect(screen.getByRole('button', { name: 'Malt : à compléter' })).toBeInTheDocument();
    expect(texte('[data-d="malt"]')).toContain('?');
    const bloc = texte('[data-booster="deux-nombres"]');
    expect(bloc).toContain('—'); expect(bloc).not.toContain('0,00'); expect(bloc).toContain('prix à compléter');
    expect(prevoir()).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('sans prix');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ complete: false }), false));
  });
  it('houblon présent mais sans prix : « ? » à compléter, pas « hors recette »', () => {
    const avecHoublon = { ...c3aRecipe, hops: [{ name: 'Cascade', weightG: 50, time: 60, use: 'ébullition' }] } as unknown as Recipe;
    renderC3a({ recipe: avecHoublon, savedEstimate: undefined, settings: c3aSettings, batch: undefined });
    expect(screen.getByRole('button', { name: 'Houblon, levure : à compléter' })).toBeInTheDocument();
  });
  it('la réduction petit brasseur confirmée pour l’année du brassin baisse l’impôt ; une autre année : taux plein', () => {
    const avec = { ...config, fiscal: { isTvaRegistered: false, beerTaxAnnualReductionPct: 40, beerTaxReductionYear: 2026 } } as unknown as AppConfig;
    const { unmount } = renderC3a({ config: avec });
    expect(screen.getByRole('button', { name: 'Impôt bière : 4,10 CHF' })).toBeInTheDocument();
    unmount();
    renderC3a({ config: { ...avec, fiscal: { ...avec.fiscal, beerTaxReductionYear: 2027 } } as AppConfig });
    expect(screen.getByRole('button', { name: 'Impôt bière : 6,84 CHF' })).toBeInTheDocument();
  });
  it('assujetti à la TVA : « À payer » dit « HT »', () => {
    renderC3a({ config: { ...config, fiscal: { isTvaRegistered: true } } as unknown as AppConfig });
    expect(texte('[data-s="now"]')).toContain('(HT)');
  });
  it('Expliquer prépare une question avec les chiffres, sans rien envoyer', async () => {
    renderC3a();
    fireEvent.click(screen.getByRole('button', { name: 'Expliquer' }));
    const chat = await screen.findByTestId('chat');
    expect(chat).toHaveTextContent('202,77'); expect(chat).toHaveTextContent('7,51'); expect(chat).toHaveTextContent('27 L nets');
  });
});

describe('litres nets : un seul net, jamais le volume à brasser', () => {
  it('sans conditionné ni net saisi : « ? L nets », litre « — », jamais 7,21', () => {
    renderC3a({ savedEstimate: undefined, settings: c3aSettings, batch: undefined });
    expect(screen.getByRole('button', { name: /^Volumes :/ })).toHaveTextContent('? L nets');
    const bloc = texte('[data-booster="deux-nombres"]');
    expect(bloc).toContain('—'); expect(bloc).not.toContain('7,21'); expect(bloc).toContain('litres nets à confirmer');
    expect(prevoir()).toBeDisabled();
  });
  it('un instantané enregistré sans net saisi (volume à brasser par défaut) rouvre à « — » ; un instantané d’avant d’1 aussi', () => {
    const sansNet = c3aSaved({ netVolumeL: undefined });
    expect(sansNet.netVolumeL).toBe(30);
    const { unmount } = renderC3a({ savedEstimate: sansNet });
    expect(screen.getByRole('button', { name: /^Volumes :/ })).toHaveTextContent('? L nets');
    unmount();
    const ancien = { ...c3aSaved() } as Partial<BrewBudgetSnapshot>; delete ancien.netVolumeSource;
    renderC3a({ savedEstimate: ancien as BrewBudgetSnapshot });
    expect(screen.getByRole('button', { name: /^Volumes :/ })).toHaveTextContent('? L nets');
  });
  it('enregistrer sans net, rouvrir : le net n’est jamais devenu 30 L', async () => {
    const save = vi.fn();
    const { unmount } = renderC3a({ savedEstimate: undefined, settings: c3aSettings, onSave: save });
    aller.volumes();
    fireEvent.change(screen.getByLabelText('Date du scénario budgétaire'), { target: { value: '2026-09-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    const enregistre = save.mock.calls[0][0] as BrewBudgetSnapshot;
    expect(enregistre.netVolumeSource).toBe('volume-a-brasser');
    unmount();
    renderC3a({ savedEstimate: enregistre });
    expect(screen.getByRole('button', { name: /^Volumes :/ })).toHaveTextContent('? L nets');
  });
  it('le conditionné réel du brassin gagne sur le net enregistré', () => {
    const batch = { id: 'B', status: 'planifie', volumeL: 30, brewDate: '', plannedBrewDate: '15.09.2026', volumePackagedL: 26.6, recipeSnapshot: c3aRecipe } as unknown as Batch;
    renderC3a({ batch });
    expect(screen.getByRole('button', { name: /^Volumes :/ })).toHaveTextContent('26,6 L nets');
    expect(texte('[data-booster="deux-nombres"]')).toContain('÷ 26,6 L');
  });
  it('la pastille ouvre les volumes : 27 → 24 L recalcule les charges fixes (4,00 le litre) et le litre', () => {
    renderC3a();
    aller.volumes();
    fireEvent.change(screen.getByLabelText('Volume net attendu'), { target: { value: '24' } });
    aller.retour();
    expect(screen.getByRole('button', { name: /^Volumes :/ })).toHaveTextContent('24 L nets');
    expect(screen.getByRole('button', { name: 'Charges fixes : 96,00 CHF' })).toBeInTheDocument();
    expect(texte('[data-booster="deux-nombres"]')).not.toContain('7,51');
  });
  it('sans net, l’impôt n’est pas calculé sur le volume à brasser', () => {
    renderC3a({ savedEstimate: undefined, settings: c3aSettings });
    expect(screen.getByRole('button', { name: 'Impôt bière : à compléter' })).toBeInTheDocument();
  });
});

describe('feuilles des nœuds : ce que la feuille d’aujourd’hui savait déjà faire', () => {
  it('Impôt bière : calculé quand la densité existe (pas de champ manuel), manuel et « Densité à noter » sans elle', () => {
    renderC3a();
    aller.noeud('Impôt bière');
    expect(screen.getByLabelText('Impôt bière calculé')).toBeInTheDocument();
    expect(screen.queryByLabelText('Impôt bière en CHF')).not.toBeInTheDocument();
    expect(screen.getByText(/densité visée \(estimé\) /)).toBeInTheDocument();
    cleanup();
    renderC3a({ recipe: { ...c3aRecipe, ogTarget: null } as unknown as Recipe, savedEstimate: c3aSaved({ og: undefined, settings: { ...c3aSettings, costs: { ...c3aSettings.costs, beerTax: { enabled: true, amountTTC: 6.84 } } } }) });
    aller.noeud('Impôt bière');
    expect(screen.getByLabelText('Impôt bière en CHF')).toHaveValue('6,84');
    expect(screen.getByText(/Densité à noter : impôt non calculé/)).toBeInTheDocument();
  });
  it('Charges fixes et Usure matériel : production annuelle et montants, sans type="number"', () => {
    const { container } = renderC3a();
    aller.noeud('Charges fixes');
    expect((screen.getByLabelText('Production annuelle prévue') as HTMLInputElement).value).toMatch(/^1\D?200$/);
    expect((screen.getByLabelText('Charges fixes annuelles', { selector: 'input[type=text]' }) as HTMLInputElement).value).toMatch(/^4\D?800$/);
    expect(screen.getByLabelText('Usure annuelle du matériel', { selector: 'input[type=text]' })).toHaveValue('360');
    expect(container.querySelectorAll('input[type=number]')).toHaveLength(0);
  });
  it('aucun type="number" dans le flux, les volumes, les ingrédients et les frais', () => {
    const { container } = renderC3a();
    for (const [ouvrir, nom] of [['volumes', ''], ['noeud', 'Malt'], ['noeud', 'Énergie']] as const) {
      if (ouvrir === 'volumes') aller.volumes(); else aller.noeud(nom);
      expect(container.querySelectorAll('input[type=number]')).toHaveLength(0);
      aller.retour();
    }
  });
});

describe('daily brew budget sheet', () => {
  it('does not invent a scenario day from a reusable recipe or save an undated budget', () => {
    const save = vi.fn();
    render(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} settings={settings} onSave={save} onClose={vi.fn()} />);
    aller.volumes();
    expect(screen.getByLabelText('Date du scénario budgétaire')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Enregistrer', exact: true })).toBeDisabled();
    expect(screen.getByText('Choisis un jour pour enregistrer cette estimation.')).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });
  it('prefills the batch plan and keeps a changed budget scenario independent of it', async () => {
    const batch = { id: 'B-NEW', status: 'planifie', volumeL: 30, brewDate: '', plannedBrewDate: '22.09.2026', recipeSnapshot: recipe } as unknown as Batch;
    const save = vi.fn();
    render(<BrewBudgetSheet open batch={batch} stockItems={[stock]} batches={[]} config={config} settings={settings} onSave={save} onClose={vi.fn()} />);
    aller.volumes();
    expect(screen.getByLabelText('Date du scénario budgétaire')).toHaveValue('2026-09-22');
    fireEvent.change(screen.getByLabelText('Date du scénario budgétaire'), { target: { value: '2026-10-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer', exact: true }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ brewDate: '01.10.2026' }), false));
    expect(batch.plannedBrewDate).toBe('22.09.2026'); expect(batch.brewDate).toBe('');
  });
  it.each(['2026-09-15','15.09.2026'])('shows and edits the date of a saved budget using %s',async(brewDate)=>{
    const save=vi.fn();
    const saved=estimateBrewBudget({recipe,stockItems:[stock],batches:[],brewDate,settings});
    renderBudgetWithChosenDate(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} savedEstimate={saved} onSave={save} onClose={vi.fn()}/>);
    aller.volumes();
    expect(screen.getByLabelText('Date du scénario budgétaire')).toHaveValue('2026-09-15');
    fireEvent.change(screen.getByLabelText('Date du scénario budgétaire'),{target:{value:'2026-09-22'}});
    fireEvent.click(screen.getByRole('button',{name:'Enregistrer',exact:true}));
    await waitFor(()=>expect(save).toHaveBeenCalledWith(expect.objectContaining({brewDate:'22.09.2026',volumeL:30}),false));
    expect(saved.brewDate).toBe(brewDate);
  });
  it('keeps an incomplete estimate saveable while disabling expense planning', async () => {
    const save = vi.fn();
    renderBudgetWithChosenDate(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} settings={settings} onSave={save} onClose={vi.fn()} />);
    expect(prevoir()).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ complete: false, title: 'Pale Ale' }), false));
  });
  it('accepts a comma price and plans only the missing ingredients', async () => {
    const save = vi.fn();
    renderBudgetWithChosenDate(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} settings={settings} onSave={save} onClose={vi.fn()} />);
    aller.noeud('Malt');
    fireEvent.change(screen.getByLabelText('Prix de Pils'), { target: { value: '2,50' } });
    aller.retour();
    expect(prevoir()).toBeEnabled();
    expect(prevoir()).toHaveTextContent('Prévoir 7,50 CHF');
    fireEvent.click(prevoir());
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ cashRequiredTTC: 7.5, ingredientsCost: 12.5, complete: true }), true));
  });
  it('un double clic sur Prévoir n’enregistre qu’une fois', async () => {
    const save = vi.fn(() => new Promise<void>(resolve => setTimeout(resolve, 30)));
    renderBudgetWithChosenDate(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} settings={settings} onSave={save} onClose={vi.fn()} />);
    aller.noeud('Malt');
    fireEvent.change(screen.getByLabelText('Prix de Pils'), { target: { value: '2,50' } });
    aller.retour();
    const bouton = prevoir();
    fireEvent.click(bouton); fireEvent.click(bouton);
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  });
  it('retains the draft and exposes save errors', async () => {
    const close = vi.fn();
    renderBudgetWithChosenDate(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} settings={settings} onSave={vi.fn().mockRejectedValue(new Error('Connexion interrompue'))} onClose={close} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Connexion interrompue');
    expect(close).not.toHaveBeenCalled();
  });
  it('compares a saved snapshot with live stock without overwriting its amount', () => {
    const saved = estimateBrewBudget({ recipe, stockItems: [stock], batches: [], brewDate: recipe.brewDate!, settings, prices: { [demandKey('Pils', 'kg')]: { amount: 3, quantity: 1, unit: 'kg', basis: 'TTC', tvaRate: 0, source: 'manual', date: '09.09.2026' } } });
    renderBudgetWithChosenDate(<BrewBudgetSheet open recipe={recipe} stockItems={[{ ...stock, currentStock: 5 }]} batches={[]} config={config} savedEstimate={saved} onSave={vi.fn()} onClose={vi.fn()} />);
    aller.volumes();
    expect(screen.getByText(/Estimation enregistrée/)).toHaveTextContent(/9[,.]00 CHF/);
    expect(screen.getByText(/Estimation enregistrée/)).toHaveTextContent(/aujourd’hui 0[,.]00 CHF \(−9[,.]00\)/);
    expect(saved.cashRequiredTTC).toBe(9);
  });

  it.each(['60', '0', '-3', '', '99999'])('does not save ingredients for 30 L (BR-97, BE-50 : 99999 L refusé avec sa borne) as a budget for %s L without scaling', value => {
    const save = vi.fn();
    renderBudgetWithChosenDate(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} settings={settings} onSave={save} onClose={vi.fn()} />);
    aller.noeud('Malt');
    fireEvent.change(screen.getByLabelText('Prix de Pils'), { target: { value: '3' } });
    aller.retour();
    expect(prevoir()).toBeEnabled();
    aller.volumes();
    fireEvent.change(screen.getByLabelText('Volume à brasser'), { target: { value } });
    fireEvent.blur(screen.getByLabelText('Volume à brasser'));
    expect(screen.getByLabelText('Volume à brasser')).toHaveValue(value);
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    aller.retour();
    expect(prevoir()).toBeDisabled();
    aller.volumes();
    fireEvent.click(screen.getByRole('button', { name: /Reprendre les 30/ }));
    expect(screen.getByLabelText('Volume à brasser')).toHaveValue('30');
    aller.retour();
    expect(prevoir()).toBeEnabled();
    expect(save).not.toHaveBeenCalled();
  });
  it('retains the historical invoice for stock valuation but identifies a changed purchase price as an estimate', async () => {
    const invoice = { id: 'F1', date: '01.09.2026', tvaRate: 0, finance: { version: 1, kind: 'expense', amountCents: 1000, vendor: 'Malterie', invoiceNumber: 'M-123', lines: [{ id: 'L', kind: 'ingredient', description: 'Pils', amountCents: 1000, quantity: 5, unit: 'kg', stockItemRef: 'M' }] } } as FinanceTransaction;
    const save = vi.fn();
    renderBudgetWithChosenDate(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} transactions={[invoice]} config={config} settings={settings} onSave={save} onClose={vi.fn()} />);
    aller.noeud('Malt');
    expect(screen.getByLabelText('Origine du prix de Pils')).toHaveValue('invoice');
    fireEvent.change(screen.getByLabelText('Prix de Pils'), { target: { value: '15' } });
    expect(screen.getByLabelText('Origine du prix de Pils')).toHaveValue('manual');
    aller.retour();
    fireEvent.click(prevoir());
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ ingredientsCost: 13, purchasesTTC: 9, prices: expect.objectContaining({ [demandKey('Pils', 'kg')]: expect.objectContaining({ amount: 15, quantity: 5, source: 'manual', note: 'Adapté de : Malterie · M-123' }) }) }), true));
    expect(invoice.finance.lines[0].amountCents).toBe(1000);
  });

  it('keeps purchases of whole bags separate from consumed stock, recurring bills and annual allocations', async () => {
    const save = vi.fn();
    const allCosts: BrewBudgetSettings = { ...settings, costs: { ...settings.costs, energy: { enabled: true, amountTTC: 4, cashTreatment: 'included-in-recurring' }, cleaning: { enabled: true, amountTTC: 2 } }, includeFixed: true, includeDepreciation: true, annualVolumeL: 300, annualFixedCHF: 120, annualDepreciationCHF: 300 };
    renderBudgetWithChosenDate(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} settings={allCosts} onSave={save} onClose={vi.fn()} />);
    aller.volumes();
    fireEvent.change(screen.getByLabelText('Volume net attendu'), { target: { value: '25' } });
    aller.retour();
    aller.noeud('Malt');
    fireEvent.change(screen.getByLabelText('Prix de Pils'), { target: { value: '60' } });
    fireEvent.change(screen.getByLabelText('Quantité du prix de Pils'), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText('Lot minimum de Pils'), { target: { value: '25' } });
    expect(screen.getByText(/Il manque 3 kg/)).toHaveTextContent('25 kg');
    fireEvent.click(screen.getByRole('button', { name: 'À compléter 0' }));
    expect(screen.queryByLabelText('Prix de Pils')).not.toBeInTheDocument();
    aller.retour();
    fireEvent.click(prevoir());
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ purchasesTTC: 60, cashRequiredTTC: 62, ingredientsCost: 12, operatingCost: 6, fixedAllocation: 10, depreciationAllocation: 25, totalCost: 53, costPerL: 2.12, complete: true }), true));
  });

  it('treats a batch whose stock was consumed as a reproduction even if its status was moved back to planned', () => {
    const consumed = { id: 'B', status: 'planifie', brewDate: recipe.brewDate, stockConsumption: { appliedAt: '2026-09-01', eventId: 'STOCK-B' } } as Batch;
    renderBudgetWithChosenDate(<BrewBudgetSheet open recipe={recipe} batch={consumed} stockItems={[stock]} batches={[]} config={config} settings={settings} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /^Prévoir/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument();
    expect(screen.getByText(/Cette simulation utilise le stock et les prix actuels/)).toBeInTheDocument();
  });

  it('scales the retained additions and water from 100% to 200% while preserving the source recipe identity', async () => {
    const source: Recipe = { ...recipe, adjuncts: [{ name: 'Vanille', amount: 2, unit: 'gousse', step: 'Fermenteur' }], waterPlan: { sourceId: 'tap', diRatioPct: 0, mashWaterL: 15, spargeWaterL: 21, mash: { gypse: 1 }, sparge: { gypse: 2 }, acid: { id: 'lactique', mash: 2, sparge: 3 }, targetPh: 5.3 } };
    const frozen = structuredClone(source);
    const withRig: AppConfig = { ...config, brewhouses: [{ id: 'rig', name: 'Cuverie', volumeL: 100, efficiencyPct: 75, boilOffRatePct: 0, deadSpaceL: 0, mashRatioLPerKg: 3 }] };
    const save = vi.fn();
    renderBudgetWithChosenDate(<BrewBudgetSheet open recipe={source} stockItems={[stock]} batches={[]} config={withRig} settings={settings} onSave={save} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save.mock.calls[0][0].recipeSnapshot).toEqual(expect.objectContaining({ sourceRecipeId: recipe.id, volumeL: 30, adjuncts: frozen.adjuncts, waterPlan: frozen.waterPlan }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled());
    aller.volumes();
    fireEvent.change(screen.getByLabelText('Volume à brasser'), { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    const doubled = save.mock.calls[1][0];
    expect(doubled.recipeId).toBe(recipe.id);
    expect(doubled.recipeSnapshot).toEqual(expect.objectContaining({ sourceRecipeId: recipe.id, volumeL: 60, adjuncts: [{ ...frozen.adjuncts[0], amount: 4 }], waterPlan: expect.objectContaining({ sourceId: 'tap', mashWaterL: 30, spargeWaterL: 39.6, mash: { gypse: 1.93 }, sparge: { gypse: 3.77 }, acid: { id: 'lactique', mash: 4, sparge: 5.66 } }) }));
    expect(doubled.lines.find(line => line.name === 'Eau du réseau').quantity).toBe(69.6); // 30 + 39,6 : CF-9, le volume avant ébullition est à froid (72 avant)
    expect(doubled.lines.find(line => line.name === 'Pils').quantity).toBe(10);
    expect(source).toEqual(frozen);
  });

  it('keeps a newly completed price editable until focus leaves its row', () => {
    renderBudgetWithChosenDate(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} settings={settings} onSave={vi.fn()} onClose={vi.fn()} />);
    aller.noeud('Malt');
    fireEvent.click(screen.getByRole('button', { name: 'À compléter 1' }));
    const price = screen.getByLabelText('Prix de Pils');
    fireEvent.focus(price);
    fireEvent.change(price, { target: { value: '6' } });
    expect(screen.getByLabelText('Prix de Pils')).toBe(price);
    fireEvent.change(price, { target: { value: '60' } });
    expect(price).toHaveValue('60');
    fireEvent.blur(price);
    expect(screen.queryByLabelText('Prix de Pils')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'À compléter 0' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the previous packaged yield and identifies unchanged manual costs when doubling a saved estimate', async () => {
    const costs: BrewBudgetSettings = { ...settings, costs: { energy: { enabled: true, amountTTC: 8 }, cleaning: { enabled: true, amountTTC: 3 }, packaging: { enabled: true, amountTTC: 24 }, beerTax: { enabled: true, amountTTC: 6.84 } } };
    const saved = estimateBrewBudget({ recipe, stockItems: [stock], batches: [], brewDate: recipe.brewDate, netVolumeL: 27, settings: costs, prices: { [demandKey('Pils', 'kg')]: { amount: 3, quantity: 1, unit: 'kg', basis: 'TTC', tvaRate: 0, source: 'manual', date: '09.09.2026' } } });
    const save = vi.fn();
    const rig = { id: 'rig', name: 'Cuverie', volumeL: 100, efficiencyPct: 75, boilOffRatePct: 0, deadSpaceL: 0, mashRatioLPerKg: 3 };
    renderBudgetWithChosenDate(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={{ ...config, brewhouses: [rig] }} savedEstimate={saved} onSave={save} onClose={vi.fn()} />);
    aller.volumes();
    fireEvent.change(screen.getByLabelText('Volume à brasser'), { target: { value: '' } });
    fireEvent.blur(screen.getByLabelText('Volume à brasser'));
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Volume à brasser'), { target: { value: '60' } });
    fireEvent.blur(screen.getByLabelText('Volume à brasser'));
    expect(screen.getByLabelText('Volume net attendu')).toHaveValue('54');
    aller.retour();
    aller.noeud('Énergie');
    expect(screen.getByText(/Volume modifié/)).toHaveTextContent('30 L brassés / 27 L nets → 60 L / 54 L');
    expect(screen.getByText(/Montant saisi à la main/)).toBeInTheDocument();
    expect(screen.getByLabelText('Énergie en CHF')).toHaveValue('8');
    expect(screen.getByLabelText('Nettoyage en CHF')).toHaveValue('3');
    expect(screen.getByLabelText('Emballage en CHF')).toHaveValue('24');
    expect(screen.getByLabelText('Impôt bière en CHF')).toHaveValue('6,84');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ volumeL: 60, netVolumeL: 54, operatingCost: 41.84, totalCost: 71.84, costPerL: 1.33 }), false));
    expect(saved.netVolumeL).toBe(27);
  });

  it('keeps an invalid net volume 0 after blur and blocks both saving actions', () => {
    renderBudgetWithChosenDate(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} settings={settings} onSave={vi.fn()} onClose={vi.fn()} />);
    aller.noeud('Malt');
    fireEvent.change(screen.getByLabelText('Prix de Pils'), { target: { value: '3' } });
    aller.retour();
    aller.volumes();
    fireEvent.change(screen.getByLabelText('Volume net attendu'), { target: { value: '0' } });
    fireEvent.blur(screen.getByLabelText('Volume net attendu'));
    expect(screen.getByLabelText('Volume net attendu')).toHaveValue('0');
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('volume net supérieur à zéro');
    aller.retour();
    expect(prevoir()).toBeDisabled();
  });
  it('un volume net vide est inconnu : Enregistrer reste possible (instantané sans net saisi), Prévoir attend le net', async () => {
    const save = vi.fn();
    renderBudgetWithChosenDate(<BrewBudgetSheet open recipe={recipe} stockItems={[stock]} batches={[]} config={config} settings={settings} onSave={save} onClose={vi.fn()} />, null);
    aller.noeud('Malt');
    fireEvent.change(screen.getByLabelText('Prix de Pils'), { target: { value: '3' } });
    aller.retour();
    expect(prevoir()).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ netVolumeSource: 'volume-a-brasser' }), false));
  });
});
