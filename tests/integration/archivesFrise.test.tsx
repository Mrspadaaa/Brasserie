import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
const setYearArchived = vi.fn(async () => ({}));
vi.mock('../../src/services/financialArchiveService', () => ({ FinancialArchiveService: { setYearArchived: (...a: unknown[]) => (setYearArchived as any)(...a) } }));
import { ArchiveManagerSheet } from '../../src/ui/finance/ArchiveManagerSheet';
import { planRangement, piecesParMois } from '../../src/domain/finance/archive';
import { todayISO } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';
import type { FinancialArchive } from '../../src/domain/finance/types';

/**
 * m1ar-c : la frise des années avec la poignée. Ranger une année finie (la poignée saute à la fin de l'année, le bouton écrit), parcourir une année
 * rangée, remettre ; une année en cours ne se range pas ; une facture ouverte reste au suivi et la frise le dit.
 */
const an = Number(todayISO().slice(0, 4));
const A = an - 2, B = an - 1;
const piece = (id: string, date: string, paye: boolean): Transaction => ({
  id, description: `Achat ${id}`, date, category: 'brassage', subcategory: '', amountHT: 100, amountTTC: 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents: 10000, paymentStatus: paye ? 'paid' : 'unpaid', recordedAt: `${date}T10:00:00.000Z`, lines: [] },
});
const paiement = (t: Transaction) => ({ id: `PAY-${t.id}`, transactionId: t.id, date: t.date, amountCents: 10000, direction: 'out' as const, method: 'bank' as const, recordedAt: `${t.date}T10:00:00.000Z` });
const tA = piece('A1', `${A}-03-10`, true), tB = piece('B1', `${B}-05-10`, true), tOuverte = piece('B2', `${B}-12-10`, false), tCourante = piece('C1', `${an}-01-05`, true);
const transactions = [tA, tB, tOuverte, tCourante];
const payments = [tA, tB, tCourante].map(paiement);
const archiveA: FinancialArchive = { id: `ARCHIVE-${A}`, year: A, status: 'archived', archivedAt: `${A + 1}-02-12T10:00:00.000Z`, updatedAt: `${A + 1}-02-12T10:00:00.000Z`, operationId: 'op-archive-a-1' };
const rendre = (archives: FinancialArchive[] = [archiveA]) => {
  const onBrowse = vi.fn(), onSaved = vi.fn(), onClose = vi.fn();
  render(<ArchiveManagerSheet transactions={transactions} payments={payments} archives={archives} closings={[]} onClose={onClose} onBrowse={onBrowse} onSaved={onSaved}/>);
  return { onBrowse, onSaved };
};
afterEach(() => { cleanup(); setYearArchived.mockClear(); });

describe('m1ar-c : la frise des années', () => {
  it('une colonne par année, la limite enregistrée, le compte du journal ; l’année en cours ne se range pas', () => {
    rendre();
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', `rangé jusqu’à fin ${A}`);
    expect(screen.getByText(/rangé jusqu’à/).textContent).toContain(`fin ${A}`);
    expect(screen.getByRole('button', { name: new RegExp(`^${an} : 1 pièce, année en cours`) })).toBeDisabled();
    expect(screen.getByRole('button', { name: `Ranger ${B}` })).toBeEnabled();
    expect(screen.getByText('rien n’est supprimé')).toBeInTheDocument();
  });

  it('toucher une année pose la poignée à sa fin : l’effet se lit avant d’écrire, le bouton écrit, rien ne part avant', async () => {
    const { onSaved } = rendre();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${B} : 2 pièces, ranger jusqu’à fin ${B}`) }));
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', `rangé jusqu’à fin ${B}`);
    // 3 pièces au journal (B1 payée disparaît ; la facture ouverte de décembre reste au suivi) : 4 → 3 ; rien d'écrit encore.
    expect(screen.getByText(/60,00|100,00 reste au suivi/)).toBeInTheDocument();
    expect(setYearArchived).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: `Ranger ${B}` }));
    await waitFor(() => expect(setYearArchived).toHaveBeenCalledWith(B, true));
    expect(onSaved).toHaveBeenCalledWith(`Année ${B} archivée. Les factures ouvertes restent dans le suivi.`);
  });

  it('« Ranger » sans choix pose d’abord la poignée (aperçu) ; deux années à la fois s’écrivent dans l’ordre', async () => {
    rendre([]);
    fireEvent.click(screen.getByRole('button', { name: `Ranger ${A}` }));
    expect(setYearArchived).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
    fireEvent.click(screen.getByRole('button', { name: `Ranger ${A} à ${B}` }));
    await waitFor(() => expect(setYearArchived).toHaveBeenCalledTimes(2));
    expect((setYearArchived.mock.calls as unknown[][]).map(c => c[0])).toEqual([A, B]);
  });

  it('parcourir une année rangée : « Consulter » mène au journal de cette année rangée', () => {
    const { onBrowse } = rendre();
    fireEvent.click(screen.getByRole('button', { name: `Consulter ${A}` }));
    expect(onBrowse).toHaveBeenCalledWith(A, true);
    fireEvent.click(screen.getByRole('button', { name: `Consulter ${B}` }));
    expect(onBrowse).toHaveBeenLastCalledWith(B, false);
    expect(screen.queryByRole('button', { name: `Consulter ${an}` })).toBeNull();
  });

  it('remettre : la poignée recule, le bouton « Remettre » écrit la réintégration', async () => {
    const { onSaved } = rendre();
    fireEvent.click(screen.getByRole('button', { name: 'Remettre' }));
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', 'rien n’est rangé');
    fireEvent.click(screen.getByRole('button', { name: `Remettre ${A}` }));
    await waitFor(() => expect(setYearArchived).toHaveBeenCalledWith(A, false));
    expect(onSaved).toHaveBeenCalledWith(`Année ${A} réintégrée dans le journal courant.`);
  });

  it('une erreur d’écriture se dit et laisse la poignée où elle est', async () => {
    setYearArchived.mockRejectedValueOnce(new Error('Refusé par le serveur.'));
    rendre();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${B} : 2 pièces`) }));
    fireEvent.click(screen.getByRole('button', { name: `Ranger ${B}` }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Refusé par le serveur.');
  });
});

describe('m1ar-c : le plan de la poignée (domaine)', () => {
  it('range les années finies au plus tard à la limite, remet celles qui la dépassent, jamais l’année en cours', () => {
    expect(planRangement([2023, 2024, 2025, 2026], new Set([2023]), 2025, 2026)).toEqual({ aRanger: [2024, 2025], aRemettre: [] });
    expect(planRangement([2023, 2024, 2025, 2026], new Set([2023, 2024]), 2023, 2026)).toEqual({ aRanger: [], aRemettre: [2024] });
    expect(planRangement([2024, 2025, 2026], new Set(), 2026, 2026)).toEqual({ aRanger: [2024, 2025], aRemettre: [] });
    expect(planRangement([2024, 2025], new Set([2024, 2025]), null, 2026)).toEqual({ aRanger: [], aRemettre: [2024, 2025] });
  });
  it('compte les pièces par mois, sans compter les pièces sans date', () => {
    const m = piecesParMois([tA, { ...tB, date: '' }, tCourante]);
    expect(m.get(A)?.[2]).toBe(1);
    expect(m.get(B)).toBeUndefined();
  });
});
