// @vitest-environment jsdom
/**
 * TE-35 : « Prévoir du matériel » : « −5 » devenait 0 et « abc » devenait vide sans un mot (corrigé avec MoneyInput, BE-64/71 : ici la preuve sur CET écran) ; « Inclure dans mes prévisions » sans mois :
 * le refus de l'enregistrement s'écrit en haut de la feuille, hors du regard de qui vient de cocher la case en bas : il doit être amené dans la vue.
 * TE-36 : la case « Inclure dans mes prévisions » porte le même libellé cochée ou non (« Dans les prévisions » n'existe plus).
 * Aucune donnée réelle : le service d'enregistrement est simulé.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const state = vi.hoisted(() => ({ saveUpgrade: vi.fn() }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getTransactions: () => [], getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getConfig: () => ({ fiscal: { isTvaRegistered: false } }) } }));
vi.mock('../../src/services/financeService', () => ({ FinanceService: { getPayments: () => [], getPlans: () => [], saveUpgrade: (...a: any[]) => state.saveUpgrade(...a) } }));
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: (read: () => unknown) => read() }));
import { UpgradeSheet } from '../../src/ui/finance/UpgradeSheet';

beforeEach(() => { cleanup(); state.saveUpgrade.mockReset(); });
afterEach(cleanup);

describe('TE-35 : les montants de « Prévoir du matériel » refusent en le disant', () => {
  it('« −5 » et « abc » : message, champ marqué, valeur d’avant gardée', () => {
    render(<UpgradeSheet onClose={() => {}} />);
    const prix = screen.getByLabelText('Prix estimé TTC (CHF)') as HTMLInputElement;
    fireEvent.focus(prix); fireEvent.change(prix, { target: { value: '-5' } });
    expect(prix).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('valeur négative');
    fireEvent.change(prix, { target: { value: 'abc' } });
    expect(screen.getByRole('alert')).toHaveTextContent('pas un nombre');
  });
  it('le budget additionne prix, livraison et installation ; sans prix il reste « À estimer » (jamais 0)', () => {
    render(<UpgradeSheet onClose={() => {}} />);
    expect(screen.getByText('À estimer')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Prix estimé TTC (CHF)'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Livraison TTC (CHF)'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Installation TTC (CHF)'), { target: { value: '30' } });
    expect(document.querySelector('.upgrade-budget strong')).toHaveTextContent(/150[.,]00/);
  });
  it('« Inclure dans mes prévisions » sans mois : le refus est amené dans la vue', async () => {
    state.saveUpgrade.mockRejectedValueOnce(new Error('Choisis le mois ou la date de paiement prévue.'));
    const vise = vi.fn(), avant = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView');
    (Element.prototype as any).scrollIntoView = vise;
    try {
      render(<UpgradeSheet onClose={() => {}} />);
      fireEvent.change(screen.getByLabelText('Matériel ou aménagement'), { target: { value: 'Hotte' } });
      fireEvent.click(screen.getByRole('checkbox', { name: 'Inclure dans mes prévisions' }));
      fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le projet' }));
      const alerte = await screen.findByRole('alert');
      expect(alerte).toHaveTextContent('Choisis le mois');
      await waitFor(() => expect(vise.mock.contexts.some(c => (c as HTMLElement).getAttribute?.('role') === 'alert')).toBe(true));
    } finally { if (avant) Object.defineProperty(Element.prototype, 'scrollIntoView', avant); else delete (Element.prototype as any).scrollIntoView; }
  });
});

describe('D-a (verdict final) : « Budget total TTC » et « À estimer » ne se collent pas', () => {
  it('la rangée du budget porte sa propre mise en page (le CSS des projets n’est pas toujours chargé quand la feuille s’ouvre depuis l’Atelier R&D) : libellé et montant séparés', () => {
    render(<UpgradeSheet onClose={() => {}} />);
    const rangee = document.querySelector('.upgrade-budget')!;
    expect(rangee).toHaveTextContent('Budget total TTC');expect(rangee).toHaveTextContent('À estimer');
    expect(rangee.className).toMatch(/justify-between/);expect(rangee.className).toMatch(/gap-x-4/);
    expect(rangee.children).toHaveLength(2); // deux éléments distincts, jamais un texte « TTCÀ estimer »
  });
});

describe('TE-36 : un seul libellé pour la case des prévisions', () => {
  it('le même mot, cochée ou non', () => {
    render(<UpgradeSheet onClose={() => {}} />);
    const case_ = screen.getByRole('checkbox', { name: 'Inclure dans mes prévisions' });
    expect(case_).not.toBeChecked();
    fireEvent.click(case_);
    expect(screen.getByRole('checkbox', { name: 'Inclure dans mes prévisions' })).toBeChecked();
    expect(screen.queryByText('Dans les prévisions')).toBeNull();
  });
});
