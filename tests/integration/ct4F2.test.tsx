// @vitest-environment jsdom
// Critique tour 4, voie F2 : CT4-A-10 (Mois par mois, la feuille est hors de `.ann` : ses variables et son segment perdaient leur style) et
// CT4-A-11 (fiche de prévision : « Limites (3) » replié par défaut, à un toucher, sans retirer les phrases).
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { buildForecast } from '../../src/domain/finance/forecast';
import { construireEscalier } from '../../src/ui/finance/previsions/escalier';
import { mesureDuProjet } from '../../src/ui/finance/previsions/mesureProjet';
import { FicheProjet } from '../../src/ui/finance/previsions/FicheEtiquette';
import { MoisParMois } from '../../src/ui/finance/annuel/Feuilles';
import { ASOF, atelier, brassin, cuve, fermenteur, frigo, loyer, loyerNovembre, planPrevoir, profil, stocks } from './previsionsFixture';

afterEach(() => cleanup());

describe('CT4-A-10 : Mois par mois garde le style de l’Annuel', () => {
  it('le contenu de la feuille (portée hors de `.ann`) porte lui-même `.ann` : le segment Résultat / Entré / Dépensé et les mois ont leurs variables', async () => {
    const c = { transactions: [], payments: [], assets: [], year: 2026, today: '2026-11-09', anneeCourante: true, act: { aller: () => {} } } as never;
    render(<MoisParMois c={c} onClose={() => {}} />);
    const segment = await screen.findByRole('group', { name: 'Ce que montrent les mois' }, { timeout: 3000 });
    expect(segment.closest('.ann')).not.toBeNull();
  });
});

const b = brassin(), plan = frigo();
const plans = [loyer, plan, fermenteur, planPrevoir(b)], transactions = [atelier(), loyerNovembre()];
const forecast = buildForecast({ transactions, payments: [], plans, profile: profil(), asOf: ASOF, months: 13, batches: [b], stockItems: stocks(), assets: [cuve()] } as never);
const escalier = construireEscalier({ departCents: forecast.openingCashCents, items: forecast.items, debut: ASOF, fin: ASOF });
const mesure = mesureDuProjet({ plan, plans, assets: [cuve()], transactions, forecast, escalier, batches: [b], stockItems: stocks(), profile: profil(), asOf: ASOF, fin: ASOF, prixBouteilleCents: null });

describe('CT4-A-11 : les limites d’une fiche de prévision sont repliées', () => {
  it('« Limites (n) › » au repos ; les phrases n’apparaissent qu’après un toucher, et se replient', () => {
    const n = mesure.avertissements.length;
    expect(n).toBeGreaterThan(0);
    render(<FicheProjet plan={plan} mesure={mesure} titreFin="Jusqu’au 17 févr." prix="" onPrix={() => {}} onClose={() => {}} onOuvrir={() => {}} />);
    const bouton = screen.getByRole('button', { name: new RegExp(`^Limites \\(${n}\\)`) });
    expect(bouton.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    fireEvent.click(bouton);
    expect(bouton.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getAllByRole('listitem').map(li => li.textContent)).toEqual(mesure.avertissements);
    fireEvent.click(bouton);
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
