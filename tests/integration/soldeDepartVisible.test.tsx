import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { FinanceOverview } from '../../src/ui/finance/FinanceOverview';

// BE-72 : « 2,5 » saisi dans « Solde de départ » puis Enregistrer : la valeur disparaissait de l'écran (rien ne la montrait tant qu'elle n'était pas confirmée).
const ledger: any = { cashComplete: false, cashCents: null, payablesCents: 0, receivablesCents: 0, unknownPaymentCount: 0, outstanding: [], warnings: [] };
afterEach(() => cleanup());
const monter = (openingCash?: { amountCents: number; date: string; confirmed: boolean }) => render(
  <FinanceOverview ledger={ledger} openingCashReady={false} openingCash={openingCash} undatedCount={0} onProfile={() => {}} onJournal={() => {}} onTransaction={() => {}} onPayment={() => {}} />,
);

describe('Solde de départ saisi', () => {
  it('un solde saisi mais pas confirmé se montre avec son montant, sa date et ce qu’il reste à faire', () => {
    monter({ amountCents: 250, date: '2026-11-08', confirmed: false });
    expect(screen.getByText(/Solde de départ saisi : .*2,50.*à confirmer/)).toBeTruthy();
    expect(screen.getByText(/Solde saisi : .*2,50.* au 08\.11\.2026, pas encore confirmé/)).toBeTruthy();
  });
  it('sans solde saisi, la consigne reste « à renseigner »', () => {
    monter(undefined);
    expect(screen.getByText('Solde de départ à renseigner')).toBeTruthy();
  });
});
