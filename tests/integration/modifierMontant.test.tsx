// @vitest-environment jsdom
/**
 * Voie q4, m5mo-c : Modifier une opération, montant payé compris. Parcours réel sur les vrais services (mode ?dev-local, rien de simulé côté écritures) :
 * le champ est libre tant que l'année n'est pas close ; changé sur une pièce payée, il propose « Le paiement suit / Reste à payer » avec l'aperçu avant / après,
 * et l'enregistrement écrit la suite d'écritures du plan (contre-paiement, montant, paiement) dans l'ordre.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
vi.mock('../../src/services/financeDocuments', async importOriginal => ({ ...(await importOriginal<typeof import('../../src/services/financeDocuments')>()), saveFinanceDocumentConfirmed: vi.fn(async () => undefined) }));
vi.mock('../../src/domain/finance/correctionMontant', async importOriginal => { const o = await importOriginal<typeof import('../../src/domain/finance/correctionMontant')>(); return { ...o, planCorrection: vi.fn(o.planCorrection) }; });
import { EditTransactionModal } from '../../src/components/EditTransactionModal';
import { StorageService } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { FinanceService } from '../../src/services/financeService';
import { executerPlan } from '../../src/ui/finance/modifier/executerCorrection';
import { PayerVirement } from '../../src/ui/finance/payer/PayerVirement';
import { saveFinanceDocumentConfirmed } from '../../src/services/financeDocuments';
import * as correction from '../../src/domain/finance/correctionMontant';
import type { Transaction } from '../../src/types';

const piece = (): Transaction => ({
  id: 'T-NET', date: '09.11.2026', description: 'Nettoyant alcalin', category: 'nettoyage', subcategory: 'CIP',
  amountHT: 42, tvaRate: 0, tvaAmount: 0, amountTTC: 42, proofNotes: 'Comptoir du brasseur · ticket 5521',
  finance: { version: 1, kind: 'expense', amountCents: 4200, lines: [], paymentStatus: 'paid' }
});
const vivante = () => StorageService.getTransactions().find(t => t.id === 'T-NET')!;
const ouvrir = () => {
  const onSave = vi.fn(), onClose = vi.fn();
  const rendu = () => <EditTransactionModal isOpen transaction={vivante()} onClose={onClose} onSave={onSave} />;
  const vue = render(rendu());
  return { onSave, onClose, vue, rendu };
};
const taper = (valeur: string) => {
  const champ = screen.getByLabelText('Montant (CHF)');
  fireEvent.focus(champ);
  fireEvent.change(champ, { target: { value: valeur } });
  fireEvent.blur(champ);
};

beforeEach(async () => {
  const vrai = await vi.importActual<typeof import('../../src/domain/finance/correctionMontant')>('../../src/domain/finance/correctionMontant');
  vi.mocked(correction.planCorrection).mockImplementation(vrai.planCorrection);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-15T10:00:00+01:00'));
  window.history.replaceState({}, '', '/?dev-local');
  FirestoreRepo.startSync();
  StorageService.addTransaction(piece());
  FinanceService.recordPayment({ id: 'PAI-1', transactionId: 'T-NET', date: '2026-11-09', amountCents: 4200, direction: 'out', method: 'bank', recordedAt: '2026-11-09T08:00:00.000Z' });
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('m5mo-c : le montant d’une pièce payée se modifie', () => {
  it('le champ est libre (ni cadenas ni désactivé) et ne propose rien tant que le montant ne change pas', () => {
    ouvrir();
    const champ = screen.getByLabelText('Montant (CHF)');
    expect(champ).not.toBeDisabled();
    expect(champ).toHaveAttribute('inputmode', 'decimal');
    expect(champ).not.toHaveAttribute('type', 'number');
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.queryByText('Dans Opérations')).toBeNull();
  });

  it('hausse : « Reste à payer » est le défaut, l’aperçu dit « payé 42,00 » et « reste 3,50 », et l’enregistrement n’écrit aucun paiement', async () => {
    const { onSave } = ouvrir();
    taper('45,50');
    const groupe = screen.getByRole('radiogroup', { name: 'Le paiement déjà noté' });
    expect(within(groupe).getByRole('radio', { name: /Reste à payer/ })).toHaveAttribute('aria-checked', 'true');
    expect(within(groupe).getByRole('radio', { name: /Le paiement suit/ })).toHaveTextContent('payé 45,50');
    expect(within(groupe).getByRole('radio', { name: /Reste à payer/ })).toHaveTextContent('payé 42,00 · reste 3,50');
    const apercu = screen.getByText('Dans Opérations').closest('.mod-ap') as HTMLElement;
    expect(within(apercu).getByText('avant')).toBeInTheDocument();
    expect(within(apercu).getByText('après')).toBeInTheDocument();
    expect(within(apercu).getByText('reste 3,50')).toBeInTheDocument();
    expect(within(apercu).getByText('✓ payé 42,00')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(vivante().amountTTC).toBe(45.5);
    expect(vivante().finance?.amountCents).toBe(4550);
    expect(vivante().settlementBalanceCents).toBe(4200);
    expect(FinanceService.getPayments().map(p => p.id)).toEqual(['PAI-1']);
  });

  it('hausse + « Le paiement suit » : le montant, puis un paiement de la différence ; la pièce reste soldée', async () => {
    const { onSave } = ouvrir();
    taper('45,50');
    fireEvent.click(screen.getByRole('radio', { name: /Le paiement suit/ }));
    expect(screen.getByRole('radio', { name: /Le paiement suit/ })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const paiements = FinanceService.getPayments();
    expect(paiements).toHaveLength(2);
    expect(paiements.find(p => p.id !== 'PAI-1')).toMatchObject({ amountCents: 350, direction: 'out', date: '2026-11-15' });
    expect(vivante().finance?.amountCents).toBe(4550);
    expect(vivante().settlementBalanceCents).toBe(4550);
  });

  it('baisse sous le payé : contre-paiement CONTRE-PAI-1, montant, puis paiement du nouveau montant, daté du paiement inversé (M2)', async () => {
    const { onSave } = ouvrir();
    taper('40');
    expect(screen.getByRole('radio', { name: /Le paiement suit/ })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const paiements = FinanceService.getPayments();
    const contre = paiements.find(p => p.id === 'CONTRE-PAI-1');
    expect(contre).toMatchObject({ reversalOfId: 'PAI-1', amountCents: 4200, direction: 'in' });
    const remplacement = paiements.filter(p => !p.reversalOfId && p.id !== 'PAI-1');
    expect(remplacement).toHaveLength(1);
    expect(remplacement[0]).toMatchObject({ date: '2026-11-09', amountCents: 4000 }); // pas le 2026-11-15 : la caisse ne bouge pas
    expect(contre?.date).toBe('2026-11-09');
    expect(vivante().finance?.amountCents).toBe(4000);
    expect(vivante().settlementBalanceCents).toBe(4000);
  });

  it('année close (clôture confirmée) : le montant se verrouille et dit pourquoi en une ligne', () => {
    FinanceService.saveClosing({ id: 'C-2026', year: 2026, createdAt: '2026-11-01T08:00:00.000Z', openingInventory: [], closingInventory: [], inventoriesConfirmed: true, adjustments: [], report: { generatedAt: '2026-11-01T08:00:00.000Z' } as never });
    ouvrir();
    expect(screen.getByLabelText('Montant (CHF)')).toBeDisabled();
    expect(screen.getByText(/Exercice 2026 clôturé/)).toBeInTheDocument();
    taper('45,50');
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  it('un montant vidé n’écrit rien et le dit', async () => {
    const { onSave } = ouvrir();
    taper('');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(screen.getByText(/Montant invalide/)).toBeInTheDocument());
    expect(onSave).not.toHaveBeenCalled();
    expect(FinanceService.getPayments()).toHaveLength(1);
    expect(vivante().finance?.amountCents).toBe(4200);
  });

  it('une pièce sans paiement : montant libre, pas de choix, l’aperçu montre quand même l’effet', () => {
    StorageService.addTransaction({ ...piece(), id: 'T-LIBRE', description: 'Joints', finance: { version: 1, kind: 'expense', amountCents: 1000, lines: [], paymentStatus: 'unpaid' }, amountHT: 10, amountTTC: 10 });
    const libre = StorageService.getTransactions().find(t => t.id === 'T-LIBRE')!;
    render(<EditTransactionModal isOpen transaction={libre} onClose={() => undefined} onSave={() => undefined} />);
    act(() => { const c = screen.getAllByLabelText('Montant (CHF)').at(-1)!; fireEvent.change(c, { target: { value: '12' } }); fireEvent.blur(c); });
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.getAllByText('après').length).toBeGreaterThan(0);
  });

  it('M4 : un brouillon de clôture ne verrouille pas le montant', () => {
    FinanceService.saveClosing({ id: 'CLOTURE-2026', year: 2026, createdAt: '2026-11-01T08:00:00.000Z', openingInventory: [], closingInventory: [], inventoriesConfirmed: false, adjustments: [] });
    ouvrir();
    expect(screen.getByLabelText('Montant (CHF)')).not.toBeDisabled();
    expect(screen.queryByText(/clôturé/)).toBeNull();
  });

  it('M3 : changer la date vers un exercice clos verrouille le montant, et l’enregistrement n’écrit aucun montant', async () => {
    FinanceService.saveClosing({ id: 'C-2025', year: 2025, createdAt: '2026-01-05T08:00:00.000Z', openingInventory: [], closingInventory: [], inventoriesConfirmed: true, adjustments: [], report: { generatedAt: '2026-01-05T08:00:00.000Z' } as never });
    const { onSave } = ouvrir();
    taper('40');
    fireEvent.change(screen.getByPlaceholderText('JJ.MM.AAAA'), { target: { value: '03.04.2025' } });
    expect(screen.getByLabelText('Montant (CHF)')).toBeDisabled();
    expect(screen.getByText(/Exercice 2025 clôturé/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(screen.getAllByRole('alert')[0]).toHaveTextContent(/2025 clôturé/));
    expect(onSave).not.toHaveBeenCalled();
    expect(vivante().finance?.amountCents).toBe(4200);
    expect(FinanceService.getPayments().map(p => p.id)).toEqual(['PAI-1']);
  });

  it('M1 : un plan impossible et un montant changé : l’erreur s’affiche et rien ne s’écrit', async () => {
    vi.mocked(correction.planCorrection).mockImplementation(() => { throw new Error('Aucun paiement à inverser pour descendre sous le montant déjà réglé.'); });
    const { onSave } = ouvrir();
    taper('40');
    expect(screen.getByText(/Aucun paiement à inverser/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(screen.getAllByText(/Aucun paiement à inverser/).length).toBeGreaterThan(0));
    expect(onSave).not.toHaveBeenCalled();
    expect(vivante().finance?.amountCents).toBe(4200);
    expect(vivante().amountTTC).toBe(42);
    expect(FinanceService.getPayments().map(p => p.id)).toEqual(['PAI-1']);
  });
});

describe('B1 : un lot Firestore par étape', () => {
  // FirestoreRepo met en file un envoi (queueMicrotask) à la première écriture d'un tour, puis envoie TOUT ce qui est en file dans un seul lot.
  // On rejoue ce mécanisme : chaque écriture programme sa microtâche « lot » ; le journal montre ce qui est écrit entre deux lots.
  const journal = (etapes: Parameters<typeof executerPlan>[0]) => {
    const lots: string[][] = [[]];
    const ecrit = (nom: string) => { lots.at(-1)!.push(nom); queueMicrotask(() => { if (lots.at(-1)!.length) lots.push([]); }); };
    vi.spyOn(FinanceService, 'recordPayment').mockImplementation(p => ecrit(p.id));
    vi.spyOn(StorageService, 'updateTransaction').mockImplementation(() => ecrit('montant'));
    return { joue: () => executerPlan(etapes, 'T-NET', { aujourdhui: '2026-11-15', maintenant: '2026-11-15T09:00:00.000Z', idPaiement: () => 'PAI-NEUF' }, v => v), propres: () => lots.filter(l => l.length) };
  };
  const p = (id: string, cents: number, date: string) => ({ id, transactionId: 'T-NET', date, amountCents: cents, direction: 'out' as const, method: 'bank' as const, recordedAt: date + 'T08:00:00.000Z' });

  it('baisse + le paiement suit : contre-paiement, montant, paiement : trois lots, jamais deux paiements dans le même', async () => {
    const j = journal([{ type: 'contre', paiementId: 'PAI-1' }, { type: 'montant', cents: 4000 }, { type: 'paiement', cents: 4000, direction: 'out', method: 'bank', date: '2026-11-09' }]);
    await j.joue();
    expect(j.propres()).toEqual([['CONTRE-PAI-1'], ['montant'], ['PAI-NEUF']]);
  });
  it('baisse avec deux paiements inversés : un lot par contre-paiement', async () => {
    vi.spyOn(FinanceService, 'getPayments').mockReturnValue([p('PAI-A', 3000, '2026-11-05'), p('PAI-B', 1200, '2026-11-09')]);
    const j = journal([{ type: 'contre', paiementId: 'PAI-B' }, { type: 'contre', paiementId: 'PAI-A' }, { type: 'montant', cents: 2500 }, { type: 'paiement', cents: 2500, direction: 'out', method: 'bank', date: '2026-11-09' }]);
    await j.joue();
    expect(j.propres()).toEqual([['CONTRE-PAI-B'], ['CONTRE-PAI-A'], ['montant'], ['PAI-NEUF']]);
  });
  it('hausse + le paiement suit : le montant, puis le paiement, deux lots', async () => {
    const j = journal([{ type: 'montant', cents: 4550 }, { type: 'paiement', cents: 350, direction: 'out', method: 'bank' }]);
    await j.joue();
    expect(j.propres()).toEqual([['montant'], ['PAI-NEUF']]);
  });
  it('ne dit « mise à jour » qu’après la mise en file de toutes les étapes, et sans attendre le serveur', async () => {
    const attente = vi.spyOn(FirestoreRepo, 'waitForWrites');
    const { onSave } = ouvrir();
    taper('40');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onSave).not.toHaveBeenCalled(); // les étapes sont encore en train de partir, lot par lot
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(FinanceService.getPayments().some(x => x.id === 'CONTRE-PAI-1')).toBe(true);
    expect(vivante().finance?.amountCents).toBe(4000);
    expect(attente).not.toHaveBeenCalled();
  });
});

describe('M5 : Payer hors ligne avec un justificatif', () => {
  it('le message propose « Retirer le justificatif pour payer maintenant », et retiré, le paiement s’écrit', async () => {
    StorageService.addTransaction({ ...piece(), id: 'T-LOYER', description: 'Loyer', amountHT: 100, amountTTC: 100, finance: { version: 1, kind: 'expense', amountCents: 10000, lines: [], vendor: 'Atelier', paymentStatus: 'unpaid', dueDate: '2099-11-25' } });
    vi.mocked(saveFinanceDocumentConfirmed).mockRejectedValueOnce(Object.assign(new Error('Hors connexion : l’original n’a pas pu être envoyé sur Drive, donc rien n’est enregistré. Réessaie une fois en ligne.'), { code: 'unavailable' }));
    const loyer = StorageService.getTransactions().find(t => t.id === 'T-LOYER')!;
    render(<PayerVirement transaction={loyer} payments={FinanceService.getPayments()} transactions={StorageService.getTransactions()} onClose={() => undefined} />);
    const dessus = document.querySelector('input[aria-label="Choisir le fichier du justificatif du virement"]') as HTMLInputElement;
    fireEvent.change(dessus, { target: { files: [new File(['x'], 'preuve.pdf', { type: 'application/pdf' })] } });
    await waitFor(() => expect(screen.getByText('preuve.pdf')).toBeVisible());
    fireEvent.click(screen.getByRole('button', { name: /^✓ Payer/ }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Retirer le justificatif pour payer maintenant/));
    expect(FinanceService.getPayments().filter(x => x.transactionId === 'T-LOYER')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Retirer' }));
    fireEvent.click(screen.getByRole('button', { name: /^✓ Payer/ }));
    await waitFor(() => expect(FinanceService.getPayments().filter(x => x.transactionId === 'T-LOYER')).toHaveLength(1));
  });
});
