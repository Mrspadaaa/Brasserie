import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const viewport = vi.hoisted(() => ({ coarse: false }));
vi.mock('../../src/ui/useViewport', () => ({ useCoarsePointer: () => viewport.coarse, useKeyboardInset: () => 0, useDensity: () => 'compact' }));
vi.mock('../../src/ui/finance/DriveConnection', () => ({ DriveConnection: () => null }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
import { QuickActionModal } from '../../src/components/QuickActionModal';
import { ModalShell } from '../../src/ui/ModalShell';
import { TextInput } from '../../src/ui/TextInput';
import { StorageService } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import type { AppConfig } from '../../src/types';

beforeEach(() => {
  viewport.coarse = false;
  vi.spyOn(StorageService, 'getConfig').mockReturnValue({ fiscal: { isTvaRegistered: false, tvaNormalRate: .081 }, brewhouses: [] } as unknown as AppConfig);
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [], cleaning: [], equipment: [] });
  vi.spyOn(StorageService, 'getTransactions').mockReturnValue([]);
  vi.spyOn(FinanceService, 'getPlans').mockReturnValue([]);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Entrées financières directes', () => {
  it('ouvre la vente sans menu, reprend le choix à chaque ouverture et conserve la saisie pendant un rendu', () => {
    const props = { recipes: [], onClose: vi.fn() };
    const view = render(<QuickActionModal {...props} isOpen initialScreen="quick-sale"/>);
    expect(screen.getByRole('dialog', { name: 'Enregistrer une vente' })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Saisir une dépense' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Montant TTC encaissé'), { target: { value: '24,50' } });
    view.rerender(<QuickActionModal {...props} isOpen initialScreen="scan"/>);
    expect(screen.getByLabelText('Montant TTC encaissé')).toHaveValue('24,50');
    view.rerender(<QuickActionModal {...props} isOpen={false} initialScreen="scan"/>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    view.rerender(<QuickActionModal {...props} isOpen initialScreen="scan"/>);
    expect(screen.getByRole('button', { name: 'Prendre une photo' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Importer un fichier' })).toBeVisible();
  });

  it('ouvre la dépense manuelle immédiatement et quitte le scan en une seule sélection', () => {
    const view = render(<QuickActionModal isOpen recipes={[]} onClose={() => {}} initialScreen="quick-expense"/>);
    expect(screen.getByLabelText('Total TTC en CHF')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Saisir sans justificatif' })).not.toBeInTheDocument();
    view.unmount();
    render(<QuickActionModal isOpen recipes={[]} onClose={() => {}} initialScreen="scan"/>);
    fireEvent.click(screen.getByRole('button', { name: 'Saisir sans justificatif' }));
    expect(screen.getByLabelText('Total TTC en CHF')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Prendre une photo' })).not.toBeInTheDocument();
  });

  it('permet de choisir une vente au clavier, confine Tab et restaure le déclencheur à Échap', async () => {
    const user = userEvent.setup();
    function Scenario() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Nouvelle opération</button><a href="#outside">Hors dialogue</a><QuickActionModal isOpen={open} recipes={[]} onClose={() => setOpen(false)}/></>;
    }
    render(<Scenario/>);
    const trigger = screen.getByRole('button', { name: 'Nouvelle opération' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Nouvelle action' });
    expect(dialog).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Connexion et justificatifs' })).toHaveFocus();
    await user.tab();
    expect(within(dialog).getByRole('button', { name: 'Fermer' })).toHaveFocus();
    await user.tab(); await user.tab(); await user.tab();
    expect(screen.getByRole('button', { name: 'Encaisser une vente' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByLabelText('Montant TTC encaissé')).toBeVisible();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('transmet le retour du focus quand le menu est remplacé par la saisie d’achat', async () => {
    const user = userEvent.setup();
    function Scenario() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Saisie rapide</button><QuickActionModal isOpen={open} recipes={[]} onClose={() => setOpen(false)}/></>;
    }
    render(<Scenario/>);
    const trigger = screen.getByRole('button', { name: 'Saisie rapide' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: /Lire un justificatif/ }));
    await user.click(screen.getByRole('button', { name: 'Saisir sans justificatif' }));
    expect(screen.getByLabelText('Total TTC en CHF')).toBeVisible();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });
});

describe('Focus partagé et libellés tactiles', () => {
  it('laisse le dialogue enfant posséder Échap, garde le parent et le verrouillage du défilement', async () => {
    const user = userEvent.setup();
    function Scenario() {
      const [outer, setOuter] = useState(false), [inner, setInner] = useState(false);
      return <><button onClick={() => setOuter(true)}>Ouvrir</button><ModalShell open={outer} onClose={() => setOuter(false)} labelledBy="outer-title"><h2 id="outer-title">Parent</h2><button onClick={() => setInner(true)}>Enfant</button><ModalShell open={inner} onClose={() => setInner(false)} labelledBy="inner-title"><h2 id="inner-title">Confirmation</h2><button onClick={() => setInner(false)}>Retour</button></ModalShell></ModalShell></>;
    }
    render(<Scenario/>);
    await user.click(screen.getByRole('button', { name: 'Ouvrir' }));
    await user.click(screen.getByRole('button', { name: 'Enfant' }));
    expect(screen.getByRole('dialog', { name: 'Confirmation' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: 'Parent' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Enfant' })).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    await user.keyboard('{Escape}');
    expect(document.body.style.overflow).not.toBe('hidden');
    expect(screen.getByRole('button', { name: 'Ouvrir' })).toHaveFocus();
  });

  it('nomme le champ tactile avec son libellé visible, garde les ARIA et permet le clic sur le libellé', async () => {
    viewport.coarse = true;
    render(<><label htmlFor="purpose">Pour quoi ?</label><TextInput id="purpose" value="" onChange={() => {}} placeholder="Malt pour la Pale Ale" required aria-describedby="purpose-hint"/><p id="purpose-hint">Motif de l’achat</p></>);
    const field = screen.getByRole('textbox', { name: 'Pour quoi ?' });
    expect(field).toHaveAttribute('data-single-line', 'true');
    expect(field).toHaveAccessibleDescription('Motif de l’achat');
    expect(field).toHaveAttribute('aria-required', 'true');
    expect(screen.queryByRole('textbox', { name: 'Malt pour la Pale Ale' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Pour quoi ?'));
    expect(field).toHaveFocus();
  });

  it('préserve le libellé des Field sans identifiant et ne le mélange pas avec la valeur saisie', () => {
    viewport.coarse = true;
    render(<><div><label>Fournisseur</label><TextInput value="Malt test" onChange={() => {}} placeholder="Nom"/></div><label>Motif<TextInput value="Entretien" onChange={() => {}} placeholder="Exemple"/></label></>);
    expect(screen.getByRole('textbox', { name: 'Fournisseur', exact: true })).toHaveValue('Malt test');
    expect(screen.getByRole('textbox', { name: 'Motif', exact: true })).toHaveValue('Entretien');
  });
});
