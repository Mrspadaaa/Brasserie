import { describe, expect, it } from 'vitest';
import type { Batch } from '../../src/types';
import { SEMAINES_PASSEES_MAX, anneeEnMois, brassagePoseAuPasse, choseBrassin, lundiDe, positionChose, semainesDe } from '../../src/domain/calendrier';
import { courbeCaisse, creuxDepuis } from '../../src/domain/calendrierCaisse';
import { deplacer, type ContexteGestes, type Resolution } from '../../src/domain/calendrierGestes';
import { semainesPassees, mouvementsPasses } from '../../src/ui/calendrier/useDonneesCalendrier';
import type { FinancialPayment, FinancialProfile } from '../../src/domain/finance/types';

/* CAL-PASSE (20.11, décision du pilote) : le passé est visible et modifiable. Ces tests échouaient avant : la frise commençait à aujourd'hui,
   « Le passé ne se replanifie pas » refusait tout glisser vers une semaine d'avant. */
const AUJ = '2026-11-18'; // mercredi, lundi 2026-11-16
const etapes = (f: number, g: number) => [{ days: f }, { days: g }];
const brassin = (prevu: string) => ({ id: 'LOT-P', name: 'Pale posée', style: 'Pale', volumeL: 50, brewDate: '', plannedBrewDate: prevu, status: 'planifie', recipeSnapshot: { fermentation: etapes(10, 4) } }) as unknown as Batch;
const ctx = (p: Partial<ContexteGestes> = {}): ContexteGestes => ({ aujourdhui: AUJ, batches: [], plans: [], courbe: null, ...p });
const bien = (r: Resolution) => { if (!r.ok) throw new Error(`refus : ${r.raison}`); return r; };

describe('CAL-PASSE : l’horizon commence avant aujourd’hui', () => {
  it('semainesDe(…, 52 + 8, 8) : la première semaine est le lundi d’il y a 8 semaines, et la semaine courante est l’index 8', () => {
    const s = semainesDe(AUJ, 60, 8);
    expect(s).toHaveLength(60);
    expect(s[0].debut).toBe('2026-09-21');
    expect(s[8].debut).toBe(lundiDe(AUJ));
    expect(positionChose(s, { debut: '2026-10-19', fin: '2026-10-19' })?.a).toBe(4);
  });
  it('anneeEnMois reçoit le passé : le premier mois est celui du jeudi de la première semaine', () => {
    const m = anneeEnMois(AUJ, 60, 8);
    expect(m[0]).toMatchObject({ annee: 2026, mois: 9 });
  });
  it('semainesPassees : borné à 52 et au solde de départ ; sans solde, tout le passé permis (la frise reste visible)', () => {
    const profil = (date: string) => ({ openingCash: { date, amountCents: 100000, confirmed: true } }) as unknown as FinancialProfile;
    expect(semainesPassees(AUJ, profil('2025-01-01'), true)).toBe(SEMAINES_PASSEES_MAX);
    expect(semainesPassees(AUJ, profil('2026-10-01'), true)).toBe(6); // lundi 7 sept. = veille du 8 sept. ≥ 1er oct. ? non : 5 oct. > 1er oct.
    expect(semainesPassees(AUJ, profil('2026-11-17'), true)).toBe(0);
    expect(semainesPassees(AUJ, {} as FinancialProfile, false)).toBe(SEMAINES_PASSEES_MAX);
  });
});

describe('CAL-PASSE : la courbe de caisse passée est le solde réel', () => {
  it('le départ de la courbe retire les paiements réels : la caisse d’aujourd’hui reste celle de Finances', () => {
    const paiements = [
      { id: 'p1', transactionId: 't1', date: '2026-10-20', amountCents: 20000, direction: 'out', method: 'bank' },
      { id: 'p2', transactionId: 't2', date: '2026-11-03', amountCents: 50000, direction: 'in', method: 'bank' }
    ] as unknown as FinancialPayment[];
    const lundi0 = '2026-10-19';
    const reels = mouvementsPasses(paiements, [], lundi0, AUJ);
    expect(reels.map(m => m.centimes)).toEqual([-20000, 50000]);
    const caisseAujourdhui = 100000;
    const c = courbeCaisse({ depart: caisseAujourdhui - 30000, lundi0, nbSemaines: 10, passe: 4, mouvements: reels })!;
    expect(c.semaines[0].caisse).toBe(50000); // 70 000 − 20 000
    expect(c.semaines[4].caisse).toBe(100000); // la semaine courante : le solde de Finances
    expect(creuxDepuis(c)!.index).toBeGreaterThanOrEqual(4); // « à dépenser » ne regarde que l’avenir
  });
});

describe('CAL-PASSE : une barre se glisse dans le passé et y reste', () => {
  it('un brassin pas brassé d’une semaine passée se dessine à SA date (plus ancré à aujourd’hui)', () => {
    expect(brassagePoseAuPasse('2026-10-20', AUJ)).toBe(true);
    expect(brassagePoseAuPasse('2026-11-16', AUJ)).toBe(false); // le lundi de la semaine courante : T3-2 reste
    const chose = choseBrassin(brassin('20.10.2026'), AUJ)!;
    expect(chose).toMatchObject({ debut: '2026-10-20', pasBrassee: true });
  });
  it('4 semaines vers le passé : écrit à la nouvelle date, au lieu de « Le passé ne se replanifie pas »', () => {
    const b = brassin('01.12.2026');
    const chose = choseBrassin(b, AUJ)!;
    const r = bien(deplacer(chose, -4, ctx({ batches: [b], debutHorizon: '2026-09-21' })));
    expect(JSON.stringify(r.ecritures)).toMatch(/2026-11-03|03.11.2026/);
    const retour = choseBrassin({ ...b, plannedBrewDate: '03.11.2026' } as Batch, AUJ)!;
    expect(retour.debut).toBe('2026-11-03'); // la barre y reste
  });
  it('avant la première semaine de la frise : refus avec sa raison', () => {
    const b = brassin('01.12.2026');
    const r = deplacer(choseBrassin(b, AUJ)!, -10, ctx({ batches: [b], debutHorizon: '2026-11-02' }));
    expect(r.ok).toBe(false);
  });
});
