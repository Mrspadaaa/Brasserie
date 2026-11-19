// @vitest-environment jsdom
/**
 * Carnet tour 3, voie f3 : les saisies de l'atelier et du budget refusent en le disant (BUGS.md TE-35, BR-27).
 * TE-35 : « Prévoir du matériel » : prix « −5 » devenait 0, livraison « abc » devenait vide, sans un mot.
 * BR-27 : budget du prochain brassin : « −1 » CHF en énergie, nettoyage, emballage, impôt accepté sans message (ramené à 0 en silence).
 * Le ton est celui des champs déjà bornés (`ChampNombre`, BE-71) : « « −1 » : une valeur négative n’existe pas ici. La valeur précédente (8) est conservée. »
 * Aucune donnée réelle : services simulés, fixture c3a de `brewBudgetSheet.test.tsx`.
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

vi.mock('../../src/services/storage', () => ({ StorageService: { getTransactions: () => [], getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getConfig: () => ({ fiscal: { isTvaRegistered: false } }) } }));
vi.mock('../../src/services/financeService', () => ({ FinanceService: { getPayments: () => [], getPlans: () => [], saveUpgrade: vi.fn() } }));
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: (read: () => unknown) => read() }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));

import { UpgradeSheet } from '../../src/ui/finance/UpgradeSheet';
import { BrewBudgetSheet } from '../../src/ui/finance/BrewBudgetSheet';
import type { AppConfig, Recipe, StockItem } from '../../src/types';
import { demandKey, estimateBrewBudget, type BrewBudgetSettings } from '../../src/domain/finance/brewBudget';

afterEach(cleanup);

describe('TE-35 : « Prévoir du matériel », chaque montant refuse en le disant', () => {
  it('livraison « abc » : message au champ, champ marqué, le budget n’a rien retenu', () => {
    render(<UpgradeSheet onClose={() => {}} />);
    const livraison = screen.getByLabelText('Livraison TTC (CHF)') as HTMLInputElement;
    fireEvent.focus(livraison); fireEvent.change(livraison, { target: { value: 'abc' } });
    expect(livraison).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('« abc » : ce n’est pas un nombre. Le champ reste vide.');
    fireEvent.blur(livraison);
    expect(livraison).toHaveValue('');
    expect(screen.getByText('À estimer')).toBeInTheDocument();
  });
  it('prix « −5 » après « 120 » : message, 120 gardé, budget 120,00 (jamais 0)', () => {
    render(<UpgradeSheet onClose={() => {}} />);
    const prix = screen.getByLabelText('Prix estimé TTC (CHF)') as HTMLInputElement;
    fireEvent.focus(prix); fireEvent.change(prix, { target: { value: '120' } }); fireEvent.blur(prix);
    fireEvent.focus(prix); fireEvent.change(prix, { target: { value: '−5' } });
    expect(screen.getByRole('alert')).toHaveTextContent('« −5 » : une valeur négative n’existe pas ici. La valeur précédente (120) est conservée.');
    fireEvent.blur(prix);
    expect(prix).toHaveValue('120');
    expect(document.querySelector('.upgrade-budget strong')).toHaveTextContent(/120[.,]00/);
  });
  it('installation « -5 » : même refus que le prix', () => {
    render(<UpgradeSheet onClose={() => {}} />);
    const pose = screen.getByLabelText('Installation TTC (CHF)') as HTMLInputElement;
    fireEvent.focus(pose); fireEvent.change(pose, { target: { value: '-5' } });
    expect(pose).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('valeur négative');
  });
});

/* Fixture c3a (celle de brewBudgetSheet.test.tsx) : énergie 8, nettoyage 3, emballage 24, charges fixes 4 800, usure 360. */
const pilsner = { id: 'MP-1', ref: 'MP-1', name: 'Pilsner', unit: 'kg', currentStock: 6, category: 'Malt', minStock: 0, reorder: false } as StockItem;
const pale = { id: 'MP-2', ref: 'MP-2', name: 'Pale', unit: 'kg', currentStock: 0, category: 'Malt', minStock: 0, reorder: false } as StockItem;
const recipe = { id: 'R3', name: 'Pale Ale de septembre', style: 'Pale Ale', volumeL: 30, brewDate: '15.09.2026', ogTarget: 1.048, hops: [], yeast: { name: '', qty: 0, unit: 'sachet', form: 'dry' },
  fermentables: [{ name: 'Pilsner', weightKg: 5.6025, kind: 'grain', use: 'empatage' }, { name: 'Pale', weightKg: 5.605, kind: 'grain', use: 'empatage' }] } as unknown as Recipe;
const config = { fiscal: { isTvaRegistered: false }, brewhouses: [] } as unknown as AppConfig;
const settings: BrewBudgetSettings = { costs: { energy: { enabled: true, amountTTC: 8 }, cleaning: { enabled: true, amountTTC: 3 }, packaging: { enabled: true, amountTTC: 24 }, beerTax: { enabled: true } },
  includeFixed: true, includeDepreciation: true, annualVolumeL: 1200, annualFixedCHF: 4800, annualDepreciationCHF: 360 };
const p4 = { amount: 4, quantity: 1, unit: 'kg', basis: 'TTC', tvaRate: 0, source: 'manual', date: '09.09.2026' } as const;
const saved = estimateBrewBudget({ recipe, stockItems: [pilsner, pale], batches: [], brewDate: '15.09.2026', netVolumeL: 27, og: '1.048', settings, prices: { [demandKey('Pilsner', 'kg')]: p4, [demandKey('Pale', 'kg')]: p4 }, now: '2026-09-09T12:00:00Z' });
const ouvrir = () => {
  render(<BrewBudgetSheet open recipe={recipe} stockItems={[pilsner, pale]} batches={[]} config={config} savedEstimate={saved} onSave={vi.fn()} onClose={vi.fn()} />);
  const litre = screen.queryByRole('button', { name: 'Détail du litre' }); if (litre) fireEvent.click(litre);
};
const noeud = (label: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${label} :`) }));
const taper = (champ: HTMLElement, valeur: string) => { fireEvent.focus(champ); fireEvent.change(champ, { target: { value: valeur } }); fireEvent.blur(champ); };

describe('BR-27 : un coût négatif du budget se dit au champ, jamais avalé', () => {
  it('énergie « −1 » : message sous le poste, champ marqué, 8 gardé', () => {
    ouvrir(); noeud('Énergie');
    const energie = screen.getByLabelText('Énergie en CHF');
    taper(energie, '−1');
    const alerte = screen.getByRole('alert');
    expect(alerte).toHaveTextContent('« −1 » : une valeur négative n’existe pas ici. La valeur précédente (8) est conservée.');
    expect(energie).toHaveAttribute('aria-invalid', 'true');
    expect(energie).toHaveAttribute('aria-describedby', alerte.id);
    expect(energie).toHaveValue('8');
    // La frappe suivante efface le message.
    fireEvent.focus(energie); fireEvent.change(energie, { target: { value: '9' } });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(energie).not.toHaveAttribute('aria-invalid', 'true');
  });
  it('nettoyage et emballage : chacun son message, à son poste (l’impôt saisi à la main passe par le même champ)', () => {
    ouvrir(); noeud('Nettoyage');
    for (const poste of ['Nettoyage', 'Emballage']) {
      taper(screen.getByLabelText(`${poste} en CHF`), '-1');
      const ligne = screen.getByLabelText(`${poste} en CHF`).closest('[data-poste]') as HTMLElement;
      expect(within(ligne).getByRole('alert')).toHaveTextContent('valeur négative');
    }
  });
  it('charges fixes et usure « −1 » : même refus', () => {
    ouvrir(); noeud('Charges fixes');
    const fixes = screen.getByRole('textbox', { name: 'Charges fixes annuelles' });
    taper(fixes, '-1');
    expect(screen.getByRole('alert')).toHaveTextContent('« -1 » : une valeur négative n’existe pas ici. La valeur précédente (4800) est conservée.');
    expect(fixes).toHaveValue('4800');
    const usure = screen.getByRole('textbox', { name: 'Usure annuelle du matériel' });
    taper(usure, '−1');
    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });
  it('prix d’un ingrédient « −4 » : refusé en le disant', () => {
    ouvrir(); noeud('Malt');
    const prix = screen.getByLabelText('Prix de Pilsner');
    taper(prix, '-4');
    expect(screen.getByRole('alert')).toHaveTextContent('valeur négative');
    expect(prix).toHaveValue('4');
  });
});
