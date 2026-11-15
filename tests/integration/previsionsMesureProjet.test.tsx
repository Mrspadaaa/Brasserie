// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { buildForecast } from '../../src/domain/finance/forecast';
import { construireEscalier, dernierJourInclus } from '../../src/ui/finance/previsions/escalier';
import { bouteillesPourZero, mesureDuProjet } from '../../src/ui/finance/previsions/mesureProjet';
import { ASOF, atelier, brassin, cuve, fermenteur, frigo, loyer, loyerNovembre, planPrevoir, profil, stocks } from './previsionsFixture';
import type { FinancialPlan } from '../../src/domain/finance/types';

const b = brassin(), fin = dernierJourInclus(ASOF, 90);
function mesure(plan: FinancialPlan, over: { batches?: typeof b[]; profile?: ReturnType<typeof profil>; prix?: number | null } = {}) {
  const plans = [loyer, plan, fermenteur, planPrevoir(b)], batches = over.batches ?? [b], profile = over.profile ?? profil(), transactions = [atelier(), loyerNovembre()];
  const forecast = buildForecast({ transactions, payments: [], plans, profile, asOf: ASOF, months: 13, batches, stockItems: stocks(), assets: [cuve()] } as never);
  const escalier = construireEscalier({ departCents: forecast.openingCashCents, items: forecast.items, debut: ASOF, fin });
  return mesureDuProjet({ plan, plans, assets: [cuve()], transactions, forecast, escalier, batches, stockItems: stocks(), profile, asOf: ASOF, fin, prixBouteilleCents: over.prix });
}
const avecDuree = (ans: number | undefined) => frigo({ upgrade: { ...frigo().upgrade!, usefulLifeYears: ans } });

describe('fiche d’un projet : usure et litre du domaine (d3)', () => {
  it('frigo 3 000 sur 5 ans : 600,00 par an ; 1 200 L → +0,50 au litre', () => {
    const m = mesure(frigo());
    expect(m.usureParAnCents).toBe(60_000);
    expect(m.litreAvant).not.toBeNull();
    expect(m.litreApres! - m.litreAvant!).toBeCloseTo(0.5, 2);
  });
  it('3 ans : 1 000,00 par an ; 8 ans : 375,00 par an (un facteur libre)', () => {
    expect(mesure(avecDuree(3)).usureParAnCents).toBe(100_000);
    expect(mesure(avecDuree(8)).usureParAnCents).toBe(37_500);
  });
  it('sans durée ni catégorie : usure inconnue, litre « après » inconnu, jamais 0', () => {
    const m = mesure(avecDuree(undefined));
    expect(m.usureParAnCents).toBeNull();
    expect(m.litreApres).toBeNull();
  });
  it('aucun brassin planifié : litre « — » (inconnu), l’usure reste connue', () => {
    const m = mesure(frigo(), { batches: [] });
    expect(m.litreAvant).toBeNull();
    expect(m.litreApres).toBeNull();
    expect(m.usureParAnCents).toBe(60_000);
  });
  it('production annuelle absente : pas de part par litre', () => {
    const m = mesure(frigo(), { profile: profil({ annualProductionL: undefined }) });
    expect(m.litreApres).toBeNull();
  });
  it('plus bas et fin : l’escalier quotidien (30.01), pas les soldes de fin de mois', () => {
    const m = mesure(frigo());
    expect(m.pointBas).toEqual({ date: '2027-01-30', soldeCents: -89_266 });
    expect(m.soldeFinCents).toBe(-89_266);
  });
});

describe('« pour rester à zéro » (trésorerie) ≠ « pour payer le matériel » (marge)', () => {
  it('892,66 ÷ 5,00 → 179 bouteilles ; sans prix : « à compléter » (null), jamais 0 ni 179', () => {
    expect(bouteillesPourZero(-89_266, 500)).toBe(179);
    expect(bouteillesPourZero(-89_266, null)).toBeNull();
    expect(bouteillesPourZero(-89_266, 0)).toBeNull();
    expect(bouteillesPourZero(12_000, 500)).toBe(0);
    expect(bouteillesPourZero(null, 500)).toBeNull();
  });
  it('dans la fiche : 179 avec le prix saisi, null sans ; « pour payer » est une autre grandeur', () => {
    expect(mesure(frigo(), { prix: 500 }).bouteillesPourZero).toBe(179);
    expect(mesure(frigo()).bouteillesPourZero).toBeNull();
    const payer = mesure(frigo(), { prix: 500 }).bouteillesPourPayer;
    expect(payer === null || payer !== 179).toBe(true);
  });
});
