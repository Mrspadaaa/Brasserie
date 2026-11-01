// @vitest-environment jsdom
// Deux libellés des vues Finances laissés par t1 (voie e-port) : la clé brute de catégorie devient son libellé ; « Prévision incomplète » dit ce qui manque.
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buildForecast } from '../../../../src/domain/finance/forecast';
import { FinanceForecastSummary } from '../../../../src/ui/finance/FinanceForecastSummary';
import { ASOF, profile, tx } from '../onglets/fixtures';

const achats = (category: string) => ['2026-07-05', '2026-08-05', '2026-09-05'].map((d, i) => tx(`${category}-${i}`, d, 10000, { paymentStatus: 'paid' }, 'expense', category));
const avertissements = (category: string) => buildForecast({ transactions: achats(category), payments: [], plans: [], profile, asOf: ASOF }).warnings.filter(w => w.includes('non projetés'));

describe('« Achats de … non projetés » dit le libellé de la catégorie, jamais la clé brute', () => {
  it.each([['brassage', 'Achats de brassage non projetés'], ['divers', 'Achats divers non projetés'], ['nettoyage', 'Achats de nettoyage non projetés']])('%s', (clef, phrase) => {
    const w = avertissements(clef);
    expect(w.some(x => x.startsWith(phrase))).toBe(true);
    expect(w.join(' ')).not.toMatch(/chargesFixes|renovation|materiel/);
  });
});

describe('« Prévision incomplète » dit ce qui manque', () => {
  const base = { ledger: { cashComplete: true, unknownPaymentCount: 0 } as any, openingCashReady: true, warnings: [] as string[], invoiceOut: 0, estimatedOut: 0, incoming: 0, projectedCash: null, horizonLabel: '90 jours', onProfile: () => {}, onPayments: () => {} };
  it('le solde de départ et les paiements à confirmer sont nommés ; aucune cause inventée', () => {
    const { rerender } = render(<FinanceForecastSummary {...base} openingCashReady={false} ledger={{ cashComplete: false, unknownPaymentCount: 3 } as any}/>);
    expect(screen.getByText('Prévision incomplète')).toBeVisible();
    expect(screen.getByText(/Il manque le solde de départ et 3 paiements à confirmer/)).toBeVisible();
    rerender(<FinanceForecastSummary {...base} warnings={['x']}/>);
    expect(screen.getByText(/Voir les limites ci-dessous : certains montants/)).toBeVisible();
    expect(screen.queryByText(/couvrent les données renseignées/)).toBeNull();
  });
});
