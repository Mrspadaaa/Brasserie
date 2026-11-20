// @vitest-environment jsdom
// CT4-A-1 (critique tour 4, BLOQUANT) : « Pour rester à zéro » disait « Tu restes au-dessus de zéro » sur la vue 90 j alors que la même fiche
// dit « aucun mois ne tient le seuil » et que la vue 12 mois passe sous zéro (−1 492,66 le 25.07). Le verdict lit tout l'horizon.
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { buildForecast } from '../../src/domain/finance/forecast';
import { construireEscalier } from '../../src/ui/finance/previsions/escalier';
import { mesureDuProjet } from '../../src/ui/finance/previsions/mesureProjet';
import { FicheProjet } from '../../src/ui/finance/previsions/FicheEtiquette';
import { ASOF, atelier, brassin, cuve, fermenteur, frigo, loyer, loyerNovembre, planPrevoir, profil, stocks } from './previsionsFixture';

const b = brassin(), plan = frigo();
const plans = [loyer, plan, fermenteur, planPrevoir(b)], transactions = [atelier(), loyerNovembre()];
const forecast = buildForecast({ transactions, payments: [], plans, profile: profil(), asOf: ASOF, months: 13, batches: [b], stockItems: stocks(), assets: [cuve()] } as never);
// vue courte : la fin de la vue est le jour même, aucun pas dedans ; le creux vient plus tard dans l'horizon
const fin = ASOF;
const escalier = construireEscalier({ departCents: forecast.openingCashCents, items: forecast.items, debut: ASOF, fin });
const mesure = (prix: number | null) => mesureDuProjet({ plan, plans, assets: [cuve()], transactions, forecast, escalier, batches: [b], stockItems: stocks(), profile: profil(), asOf: ASOF, fin, prixBouteilleCents: prix });

describe('CT4-A-1 : « Pour rester à zéro » lit tout l’horizon, pas la vue affichée', () => {
  it('la vue ne descend pas, l’horizon passe sous zéro : bouteilles comptées, date du passage', () => {
    expect(escalier.pointBas!.soldeCents).toBeGreaterThanOrEqual(0);
    const m = mesure(500);
    expect(m.sousZero).not.toBeNull();
    expect(m.sousZero!.soldeCents).toBeLessThan(0);
    expect(m.bouteillesPourZero).toBe(Math.ceil(-m.sousZero!.soldeCents / 500));
  });
  it('la fiche ne dit plus « Tu restes au-dessus de zéro » et nomme le passage sous zéro', () => {
    render(<FicheProjet plan={plan} mesure={mesure(null)} titreFin="Jusqu’au 17 févr." prix="" onPrix={() => {}} onClose={() => {}} onOuvrir={() => {}} />);
    expect(screen.queryByText(/Tu restes au-dessus de zéro/)).toBeNull();
    expect(screen.getByText(/sous zéro le/)).toBeTruthy();
  });
});
