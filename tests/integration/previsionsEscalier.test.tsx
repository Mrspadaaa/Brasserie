// @vitest-environment jsdom
// Escalier de p5b : chaque nombre attendu sort de `buildForecast` sur la fixture (voir `previsionsFixture.ts`), jamais de la maquette.
import { describe, expect, it } from 'vitest';
import { buildForecast, type ForecastItem } from '../../src/domain/finance/forecast';
import { construireEscalier, dernierJourInclus, graduations, notions, regrouperTendance, titreHorizon } from '../../src/ui/finance/previsions/escalier';
import { ASOF, atelier, brassin, fermenteur, frigo, loyer, loyerNovembre, planPrevoir, profil, stocks } from './previsionsFixture';

const b = brassin();
const base = { transactions: [atelier(), loyerNovembre()], payments: [], plans: [loyer, frigo(), fermenteur, planPrevoir(b)], profile: profil(), asOf: ASOF, months: 13, batches: [b], stockItems: stocks(), assets: [] };
const avec = () => buildForecast(base as never);
const fin = dernierJourInclus(ASOF, 90);

describe('l’escalier de la fixture (10 sorties, datées par le domaine)', () => {
  const e = construireEscalier({ departCents: 418_160, items: avec().items, debut: ASOF, fin });
  it('les soldes après chaque marche, au centime', () => {
    expect(e.marches.map(m => [m.date, m.soldeApresCents])).toEqual([
      ['2026-11-09', 412_160], ['2026-11-13', 409_918], ['2026-11-15', 109_918], ['2026-11-20', 108_818], ['2026-11-25', 68_818],
      ['2026-12-04', 66_418], ['2026-12-25', 26_418], ['2027-01-25', -13_582], ['2027-01-28', -88_582], ['2027-01-30', -89_266]]);
    expect(e.marches.reduce((n, m) => n + m.items.length, 0)).toBe(10);
  });
  it('fin d’horizon (90 j : dernier jour inclus 06.02), premier jour sous zéro, plus bas', () => {
    expect(fin).toBe('2027-02-06');
    expect(titreHorizon(fin, 90)).toBe('Jusqu’au 6 févr.');
    expect(e.soldeFinCents).toBe(-89_266);
    expect(e.premierJourSousZero).toBe('2027-01-25');
    expect(e.pointBas).toEqual({ date: '2027-01-30', soldeCents: -89_266 });
  });
  it('sans le frigo : 2 107,34 (le fermenteur reste) ; le brassin vaut 64,26', () => {
    const items = avec().items.filter(i => i.planId !== 'FRIGO');
    expect(construireEscalier({ departCents: 418_160, items, debut: ASOF, fin }).soldeFinCents).toBe(210_734);
    expect(notions(avec().items.filter(i => i.date <= fin), 'FRIGO')).toMatchObject({ aPayer: 46_000, prevu: 155_000, brassin: 6_426, projet: 300_000, sorties: 507_426 });
  });
  it('à payer + prévu + brassin + projet = total des sorties, au centime', () => {
    const n = notions(avec().items.filter(i => i.date <= fin), 'FRIGO');
    expect(n.aPayer + n.prevu + n.brassin + n.projet).toBe(n.sorties);
    expect(avec().items.filter(i => i.source === 'brew').reduce((s, i) => s + i.amountCents, 0)).toBe(6_426);
  });
  it('une sortie le jour qui suit la fin est exclue ; 12 mois = jusqu’à la veille de l’anniversaire', () => {
    const tard: ForecastItem = { id: 'x', date: '2027-02-07', label: 'x', amountCents: 100, direction: 'out', source: 'plan', category: 'divers' };
    expect(construireEscalier({ departCents: 0, items: [tard], debut: ASOF, fin }).marches).toEqual([]);
    expect(dernierJourInclus(ASOF, 365)).toBe('2027-11-08');
    expect(dernierJourInclus(ASOF, 30)).toBe('2026-12-08');
  });
});

describe('inconnu n’est jamais 0', () => {
  it('sans solde de départ : aucun solde, l’écart est dessiné', () => {
    const e = construireEscalier({ departCents: null, items: avec().items, debut: ASOF, fin });
    expect(e.soldeFinCents).toBeNull();
    expect(e.pointBas).toBeNull();
    expect(e.premierJourSousZero).toBeNull();
    expect(e.marches.every(m => m.soldeApresCents === null)).toBe(true);
    expect(e.ecartFinCents).toBe(-507_426);
  });
  it('une entrée fait monter l’escalier et compte dans le solde de fin', () => {
    const entree: ForecastItem = { id: 'in', date: '2026-11-25', label: 'Vente', amountCents: 50_000, direction: 'in', source: 'plan', category: 'ventes' };
    const e = construireEscalier({ departCents: 418_160, items: [...avec().items, entree], debut: ASOF, fin });
    expect(e.soldeFinCents).toBe(-89_266 + 50_000);
    expect(notions([entree]).entrees).toBe(50_000);
    expect(e.marches.find(m => m.date === '2026-11-25')!.deltaCents).toBe(-40_000 + 50_000);
  });
});

describe('graduations (Heckbert, cible 5)', () => {
  it('[−892,66 ; 4 181,60] : pas de 1 000, le zéro y est', () => {
    const g = graduations(-89_266, 418_160);
    expect(g.ticks).toEqual([-100_000, 0, 100_000, 200_000, 300_000, 400_000]);
    expect(g.ticks).toContain(0);
  });
  it('plage toute positive, toute négative, nulle, minuscule', () => {
    expect(graduations(10_000, 90_000).ticks[0]).toBe(0);
    expect(graduations(-90_000, -10_000).ticks.at(-1)).toBe(0);
    const nulle = graduations(0, 0);
    expect(nulle.ticks.length).toBeGreaterThanOrEqual(2);
    expect(nulle.haut).toBeGreaterThan(nulle.bas);
    expect(graduations(0, 3).haut).toBeGreaterThan(0);
  });
});

describe('titres et tendance', () => {
  it('l’année n’apparaît que pour 12 mois', () => { expect(titreHorizon('2027-11-08', 365)).toBe('Jusqu’au 8 nov. 2027'); expect(titreHorizon('2027-11-30', 365)).toBe('Fin novembre 2027'); expect(titreHorizon('2026-12-08', 30)).toBe('Jusqu’au 8 déc.'); });
  it('trois mois de tendance : une seule « dépenses courantes » par mois, montants additionnés', () => {
    const t = (date: string, cat: string, c: number): ForecastItem => ({ id: `trend:${date}:${cat}`, date, label: `Autres dépenses · ${cat}`, amountCents: c, direction: 'out', source: 'trend', category: cat });
    const items = regrouperTendance([t('2026-12-01', 'chargesFixes', 100), t('2026-12-01', 'divers', 50), t('2027-01-01', 'chargesFixes', 100), t('2027-02-01', 'chargesFixes', 100)]);
    expect(items.map(i => [i.date, i.amountCents, i.label])).toEqual([['2026-12-01', 150, 'dépenses courantes'], ['2027-01-01', 100, 'dépenses courantes'], ['2027-02-01', 100, 'dépenses courantes']]);
  });
});
