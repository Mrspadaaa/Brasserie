import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
const envoi = vi.hoisted(() => vi.fn());
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: (p: any) => <div role="dialog" aria-label="Compagnon brasseur" data-question={p.initialQuestion}><button onClick={envoi}>Envoyer</button></div> }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { FinanceService } from '../../src/services/financeService';
import { AUJOURDHUI, Banc, seedDemo } from './annuelSupport';

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${AUJOURDHUI}T10:00:00`)); window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); seedDemo(); envoi.mockClear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); FirestoreRepo.stopSync(); });
const piste = (n: number) => screen.getByRole('button', { name: new RegExp(`^${n}\\. `) });
const closing = () => FinanceService.getClosings().find(c => c.year === 2026 && !c.report);

describe('Annuel g6 : les gestes écrivent par une seule voie, jamais une valeur déduite', () => {
  it('étape 1 « Tout est noté » : relecture du journal posée avec sa base, puis étape 2', () => {
    render(<Banc/>);
    fireEvent.click(piste(1)); fireEvent.click(screen.getByRole('button', { name: 'Tout est noté' }));
    expect(closing()!.tax!.reviews).toEqual({ journal: true }); expect(closing()!.tax!.reviewedBasis).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3 }).textContent).toContain('commencé');
  });
  it('étape 2 : « Oui » n’écrit rien ; « Non, corriger » ouvre le solde ; une année passée se saisit', () => {
    const onProfile = vi.fn();
    const { unmount } = render(<Banc spies={{ onProfile }}/>);
    fireEvent.click(piste(2));
    fireEvent.click(screen.getByRole('button', { name: /^Oui/ }));
    expect(FinanceService.getClosings()).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /^Non, corriger/ })); expect(onProfile).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Saisir le solde du 31 déc.' })).toBeNull();
    unmount();
    render(<Banc year={2025}/>);
    fireEvent.click(piste(2)); fireEvent.click(screen.getByRole('button', { name: 'Saisir le solde du 31 déc.' }));
    expect(screen.getByRole('dialog', { name: 'Préparer les impôts 2025' })).toBeVisible();
    expect(FinanceService.getClosings()).toHaveLength(0);
  });
  it('étape 3 : ✦ propose 22,42 sans rien enregistrer', () => {
    const onInventories = vi.fn();
    render(<Banc spies={{ onInventories }}/>);
    fireEvent.click(piste(3)); fireEvent.click(screen.getByRole('button', { name: 'Proposer depuis le stock' }));
    expect(onInventories).toHaveBeenCalledWith(expect.objectContaining({ cote: 'closingInventory', proposer: true, propositions: [expect.objectContaining({ valueCents: 2242 })] }));
    expect(FinanceService.getClosings()).toHaveLength(0);
  });
  it('étape 4 : la cuve ouvre sa feuille ; « Matériel » préremplit l’achat sans rien écrire', () => {
    const onAsset = vi.fn();
    render(<Banc spies={{ onAsset }}/>);
    fireEvent.click(piste(4));
    fireEvent.click(screen.getByRole('button', { name: /^Modifier Cuve/ })); expect(onAsset).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'DEMO-IMMO' }));
    fireEvent.click(screen.getByRole('button', { name: 'Matériel' }));
    expect(onAsset).toHaveBeenLastCalledWith(null, expect.objectContaining({ name: 'Joints de la cuve', transactionId: 'DEMO-T4', acquisitionCents: 2860 }));
    expect(FinanceService.getClosings()).toHaveLength(0);
  });
  it('étape 6 : la base de l’électricité (68,00) vient des charges de l’année ; le curseur écrit une correction à réintégrer et invalide privé et social', () => {
    render(<Banc/>);
    fireEvent.click(piste(6));
    fireEvent.click(screen.getByRole('button', { name: /^Électricité/ }));
    expect(screen.getByText(/d’après : Électricité/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter cette part' })); // 50 % de 68,00
    expect(closing()!.tax!.corrections).toEqual([expect.objectContaining({ kind: 'private-use', label: 'Électricité', amountCents: 3400, treatment: 'add' })]);
    expect(closing()!.tax!.reviews.privateUse).toBeFalsy();
  });
  it('étape 6 : sans charge reconnue, le montant se saisit (aucune valeur par défaut)', () => {
    render(<Banc/>);
    fireEvent.click(piste(6));
    fireEvent.click(screen.getByRole('button', { name: /^Téléphone/ }));
    expect(screen.getByRole('button', { name: 'Ajouter cette part' })).toBeDisabled();
    const champ = screen.getByLabelText('Montant à toi, estimé (CHF)');
    fireEvent.change(champ, { target: { value: '12' } }); fireEvent.blur(champ);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter cette part' }));
    expect(closing()!.tax!.corrections).toEqual([expect.objectContaining({ label: 'Téléphone', amountCents: 1200 })]);
  });
  it('étape 6 : « Rien pris pour moi » coche la relecture sans correction', () => {
    render(<Banc/>);
    fireEvent.click(piste(6)); fireEvent.click(screen.getByRole('button', { name: /^Rien pris pour moi/ }));
    expect(closing()!.tax!.reviews.privateUse).toBe(true); expect(closing()!.tax!.corrections).toHaveLength(0);
  });
  it('étape 7 : l’activité s’écrit sans effacer les relectures posées', () => {
    render(<Banc/>);
    fireEvent.click(piste(1)); fireEvent.click(screen.getByRole('button', { name: 'Tout est noté' }));
    fireEvent.click(piste(7)); fireEvent.click(screen.getByRole('button', { name: 'accessoire' }));
    expect(closing()!.tax!.activity).toBe('secondary'); expect(closing()!.tax!.reviews.journal).toBe(true);
    expect(screen.getByRole('button', { name: 'accessoire' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('parcours : relecture posée à l’étape 1, puis les comptes changent : l’étape 1 repasse « à faire » et le message le dit', async () => {
    render(<Banc/>);
    fireEvent.click(piste(1)); fireEvent.click(screen.getByRole('button', { name: 'Tout est noté' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuel' }));
    expect(piste(1).getAttribute('aria-label')).toMatch(/prête/);
    FinanceService.saveClosing({ ...closing()!, inventoriesConfirmed: true, closingInventory: [{ id: 'I', name: 'Malt', kind: 'raw', quantity: 1, unit: 'kg', valueCents: 5000 }] });
    await waitFor(() => expect(screen.getByText(/les vérifications sont à refaire/)).toBeVisible());
    expect(piste(1).getAttribute('aria-label')).not.toMatch(/prête/);
  });
  it('✦ : prépare une question dans le compagnon, rien n’est envoyé', async () => {
    render(<Banc/>);
    fireEvent.click(piste(1)); fireEvent.click(screen.getByRole('button', { name: 'Chercher les oublis' }));
    expect((await screen.findByRole('dialog', { name: 'Compagnon brasseur' })).getAttribute('data-question')).toMatch(/oublis/);
    expect(envoi).not.toHaveBeenCalled();
  });
});
