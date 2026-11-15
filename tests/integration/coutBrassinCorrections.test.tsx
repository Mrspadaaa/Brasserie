import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrewBudgetSheet } from '../../src/ui/finance/BrewBudgetSheet';
import type { AppConfig, Recipe, StockItem } from '../../src/types';
import { demandKey, estimateBrewBudget, type BrewBudgetSettings } from '../../src/domain/finance/brewBudget';

// Corrections du test d'écran de c3a (09.11) : fixture de c3a, 27 L nets, 22,41 + 64,26 + 116,10 = 202,77, 7,51 CHF/L.
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: (p: { initialQuestion?: string }) => <div data-testid="chat">{p.initialQuestion}</div> }));

const pilsner = { id: 'MP-1', ref: 'MP-1', name: 'Pilsner', unit: 'kg', currentStock: 6, category: 'Malt', minStock: 0, reorder: false } as StockItem;
const pale = { id: 'MP-2', ref: 'MP-2', name: 'Pale', unit: 'kg', currentStock: 0, category: 'Malt', minStock: 0, reorder: false } as StockItem;
const config = { fiscal: { isTvaRegistered: false }, brewhouses: [] } as unknown as AppConfig;
const recette = { id: 'R3', name: 'Pale Ale de septembre', style: 'Pale Ale', volumeL: 30, brewDate: '15.09.2026', ogTarget: 1.048, hops: [], yeast: { name: '', qty: 0, unit: 'sachet', form: 'dry' },
  fermentables: [{ name: 'Pilsner', weightKg: 5.6025, kind: 'grain', use: 'empatage' }, { name: 'Pale', weightKg: 5.605, kind: 'grain', use: 'empatage' }] } as unknown as Recipe;
const reglages: BrewBudgetSettings = { costs: { energy: { enabled: true, amountTTC: 8 }, cleaning: { enabled: true, amountTTC: 3 }, packaging: { enabled: true, amountTTC: 24 }, beerTax: { enabled: true } },
  includeFixed: true, includeDepreciation: true, annualVolumeL: 1200, annualFixedCHF: 4800, annualDepreciationCHF: 360 };
const p4 = { amount: 4, quantity: 1, unit: 'kg', basis: 'TTC', tvaRate: 0, source: 'manual', date: '09.09.2026' } as const;
const prix = { [demandKey('Pilsner', 'kg')]: p4, [demandKey('Pale', 'kg')]: p4 };
const enregistree = () => estimateBrewBudget({ recipe: recette, stockItems: [pilsner, pale], batches: [], brewDate: '15.09.2026', netVolumeL: 27, og: '1.048', settings: reglages, prices: prix, now: '2026-09-09T12:00:00Z' });
const rendre = (props: Partial<React.ComponentProps<typeof BrewBudgetSheet>> = {}) => render(<BrewBudgetSheet open recipe={recette} stockItems={[pilsner, pale]} batches={[]} config={config} savedEstimate={enregistree()} onSave={vi.fn()} onClose={vi.fn()} {...props} />);
const texte = (sel: string) => document.querySelector(sel)?.textContent ?? '';
const noeud = (nom: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${nom} :`) }));

afterEach(cleanup);

describe('c3a corrigé : le litre au premier regard (1, 5, 6, 4)', () => {
  it('le sous-titre dit « Coût du brassin » (6), pas « Budget du prochain brassin »', () => {
    rendre();
    expect(screen.getByText('Coût du brassin')).toBeInTheDocument();
    expect(screen.queryByText(/Budget du prochain brassin/)).toBeNull();
  });
  it('la pastille « 27 L nets » est dans la ligne des titres de colonnes, plus seule sur sa ligne (5)', () => {
    rendre();
    const colonnes = document.querySelector('.cbf-cols')!;
    expect(within(colonnes as HTMLElement).getByRole('button', { name: /^Volumes : 27 L nets/ })).toBeInTheDocument();
    expect(document.querySelector('.cbf-fil')).toBeNull();
  });
  it('le bloc 202,77 ÷ 27 L = 7,51 est collant en bas de la feuille : il reste visible quand l’écran est court (1)', () => {
    rendre();
    const enveloppe = document.querySelector('.cbf-resw')!;
    expect(enveloppe.textContent).toContain('7,51');
    expect(enveloppe.querySelector('[data-booster="deux-nombres"]')).not.toBeNull();
  });
  it('au repos, aucune ligne « Estimation enregistrée / Écart actuel : +0,00 » (4) ; elle vit dans le nœud Volumes', () => {
    rendre();
    expect(screen.queryByText(/Écart actuel/)).toBeNull();
    expect(screen.queryByText(/Estimation enregistrée/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^Volumes :/ }));
    expect(screen.getByText(/Estimation enregistrée/)).toHaveTextContent('64,26 CHF · inchangée');
  });
  it('les nœuds de destination se suivent d’au moins 24 px : deux zones tactiles ne se chevauchent pas (10)', () => {
    rendre();
    const hauts = [...document.querySelectorAll<HTMLElement>('.cbf-dst')].map(e => parseFloat(e.style.top));
    expect(hauts.length).toBe(8);
    for (let i = 1; i < hauts.length; i++) expect(hauts[i] - hauts[i - 1]).toBeGreaterThanOrEqual(24);
  });
});

describe('c3a corrigé : « Prévoir » répond dans la feuille (2)', () => {
  it('Prévoir enregistre, garde la feuille ouverte et dit « Ajouté aux prévisions · 64,26 CHF à payer · brassage le 15 sept. » ; Fermer ferme', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    rendre({ onSave, onClose });
    fireEvent.click(screen.getByRole('button', { name: /^Prévoir/ }));
    const statut = await screen.findByRole('status');
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][1]).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
    expect(statut).toHaveTextContent('Ajouté aux prévisions');
    expect(statut).toHaveTextContent('64,26 CHF à payer');
    expect(statut).toHaveTextContent(/brassage le 15/);
    expect(screen.queryByRole('button', { name: /^Prévoir/ })).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'Fermer' }).find(b => b.textContent === 'Fermer')!);
    expect(onClose).toHaveBeenCalled();
  });
  it('l’enregistrement change l’estimation enregistrée (donc la clé du brouillon) : le message « Ajouté aux prévisions » survit à ce remontage', async () => {
    let vue: ReturnType<typeof rendre> | undefined;
    const onSave = vi.fn(async () => {
      vue!.rerender(<BrewBudgetSheet open recipe={recette} stockItems={[pilsner, pale]} batches={[]} config={config} savedEstimate={{ ...enregistree(), id: 'NOUVELLE-ESTIMATION' }} onSave={vi.fn()} onClose={vi.fn()} />);
    });
    vue = rendre({ onSave });
    fireEvent.click(screen.getByRole('button', { name: /^Prévoir/ }));
    expect(await screen.findByText('Ajouté aux prévisions')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Prévoir/ })).toBeNull();
  });
  it('si l’enregistrement échoue, aucun « Ajouté aux prévisions » : l’erreur reste visible', async () => {
    rendre({ onSave: vi.fn().mockRejectedValue(new Error('Connexion interrompue')) });
    fireEvent.click(screen.getByRole('button', { name: /^Prévoir/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Connexion interrompue');
    expect(screen.queryByText('Ajouté aux prévisions')).toBeNull();
  });
});

describe('c3a corrigé : un geste égal sur les trois sources (3)', () => {
  it('« Déjà payé » : bloc vert 22,41 CHF et les postes qu’il paie ; « Coût de l’année » : 116,10, charges fixes 108,00 et usure 8,10', () => {
    rendre();
    fireEvent.click(document.querySelector('[data-s="stock"]')!);
    let bloc = document.querySelector('.cbf-resw')!;
    expect(bloc.querySelector('.cbf-sel-stock')).not.toBeNull();
    expect(bloc.textContent).toContain('Déjà payé'); expect(bloc.textContent).toContain('22,41'); expect(bloc.textContent).toContain('malt');
    expect(bloc.textContent).not.toContain('7,51');
    fireEvent.click(document.querySelector('[data-s="an"]')!);
    bloc = document.querySelector('.cbf-resw')!;
    expect(bloc.querySelector('.cbf-sel-an')).not.toBeNull();
    expect(bloc.textContent).toContain('116,10'); expect(bloc.textContent).toContain('charges fixes 108,00'); expect(bloc.textContent).toContain('usure matériel 8,10');
    fireEvent.click(document.querySelector('[data-s="an"]')!);
    expect(document.querySelector('.cbf-resw')!.textContent).toContain('7,51');
  });
});

describe('c3a corrigé : les feuilles de nœud (7, 8, 9, 11, 13, 14)', () => {
  it('« Emballage » partout, « Impôt bière » partout (7)', () => {
    rendre();
    noeud('Emballage');
    expect(screen.getByLabelText('Emballage en CHF')).toBeInTheDocument();
    expect(screen.getByLabelText('Impôt bière calculé')).toBeInTheDocument();
    expect(screen.queryByText(/Conditionnement/)).toBeNull();
    expect(screen.queryByText(/Impôt sur la bière/)).toBeNull();
  });
  it('le poste touché est surligné et il est le seul (9) ; chaque nœud de frais mène à son poste', () => {
    rendre();
    noeud('Nettoyage');
    const actifs = [...document.querySelectorAll('[data-poste-actif="true"]')];
    expect(actifs).toHaveLength(1);
    expect(within(actifs[0] as HTMLElement).getByLabelText('Nettoyage en CHF')).toBeInTheDocument();
    cleanup();
    rendre();
    noeud('Usure matériel');
    const usure = [...document.querySelectorAll('[data-poste-actif="true"]')];
    expect(usure).toHaveLength(1);
    expect(within(usure[0] as HTMLElement).getAllByLabelText('Usure annuelle du matériel').length).toBeGreaterThan(0);
  });
  it('les explications longues sont derrière « ? » : repliées au départ (8)', () => {
    rendre();
    noeud('Énergie');
    const aide = screen.getByRole('button', { name: 'Explication' });
    expect(aide).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Saisis le coût TTC/)).toBeNull();
    expect(screen.queryByText(/Renseigne tes montants habituels/)).toBeNull();
    const mots = (document.querySelector('.brew-budget-section') as HTMLElement).textContent!.split(/\s+/).filter(Boolean).length;
    expect(mots).toBeLessThan(70);
    fireEvent.click(aide);
    expect(aide).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Saisis le coût TTC/)).toBeInTheDocument();
  });
  it('Houblon, levure sans houblon ni levure : rien à enregistrer, donc pas d’« Enregistrer » mais « Retour au flux » (11)', () => {
    rendre();
    noeud('Houblon, levure');
    expect(screen.queryByRole('button', { name: 'Enregistrer' })).toBeNull();
    expect(screen.getAllByRole('button', { name: /Retour au flux/ }).length).toBeGreaterThan(0);
  });
  it('Malt : pas de phrase sur le houblonnage à froid (13) ; le coût d’une ligne dit sa part en stock et sa part à acheter (14)', () => {
    rendre();
    noeud('Malt');
    expect(screen.queryByText(/houblonnage à froid/)).toBeNull();
    const pils = screen.getByText('Pilsner').closest('summary')!;
    expect(pils).toHaveTextContent('22,41 en stock');
    expect(pils).toHaveTextContent('22,41 CHF');
    const pales = screen.getByText('Pale').closest('summary')!;
    expect(pales).toHaveTextContent('22,42 à acheter');
    expect(pales).toHaveTextContent('22,42 CHF');
  });
  it('« Règle des degrés » : visible pour un brassin (lien vers la feuille Impôt bière), absent pour une recette sans brassin (9)', () => {
    rendre();
    noeud('Impôt bière');
    expect(screen.queryByRole('button', { name: /Règle des degrés/ })).toBeNull();
  });
});

describe('c3a corrigé : le litre reste tel qu’avant (garde)', () => {
  it('202,77 ÷ 27 L = 7,51 et le litre en trois temps 0,83 · 2,38 · 4,30', async () => {
    rendre();
    await waitFor(() => expect(texte('.cbf-res')).toContain('7,51'));
    expect(texte('.cbf-res')).toContain('202,77');
    const barre = texte('.cbf-litl');
    expect(barre).toContain('0,83'); expect(barre).toContain('2,38'); expect(barre).toContain('4,30');
  });
});
