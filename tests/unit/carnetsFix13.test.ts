// fix13 (tour 13 en ligne) : CA13-3, le plan archivé reste celui que le carnet suit (dernière date, dernier prix) et se reprend ;
// CA13-2, une marque d'historique de carnet n'est orpheline que si aucun Carnet monté ne la tient, et ne se recopie pas.
import { describe, expect, it } from 'vitest';
import { fixtureCarnets, fixturePlans, ID_FRIGO, ID_PLAN_FRIGO } from '../../src/domain/carnets/fixture';
import { lireCarnet, type CarnetDoc } from '../../src/domain/carnets/modele';
import { planOuvertDuCarnet, planRepris, planSuiviDuCarnet } from '../../src/domain/carnets/operations';
import type { FinancialPlan } from '../../src/domain/finance/types';
import { avecMarque, carnetARouvrir, MARQUE_HISTOIRE, marqueOrpheline, mourir, sansMarque, vivre } from '../../src/ui/carnets/histoireCarnet';

const frigo = (): CarnetDoc => lireCarnet(fixtureCarnets().find(i => i.id === ID_FRIGO))!;
const planFrigo = (patch: Partial<FinancialPlan> = {}): FinancialPlan => ({ ...fixturePlans().find(p => p.id === ID_PLAN_FRIGO)!, ...patch });

describe('CA13-3 : le carnet d’un plan archivé', () => {
  const archive = planFrigo({ status: 'cancelled', amountCents: 1234567, date: '2027-05-30' });
  it('suit encore son plan archivé : sa dernière date et son dernier prix', () => {
    expect(planOuvertDuCarnet(frigo(), [archive])).toBeUndefined();
    const suivi = planSuiviDuCarnet(frigo(), [archive]);
    expect(suivi?.amountCents).toBe(1234567);
    expect(suivi?.date).toBe('2027-05-30');
  });
  it('ouvert : le plan ouvert ; réalisé ou supprimé : aucun', () => {
    expect(planSuiviDuCarnet(frigo(), [planFrigo()])?.id).toBe(ID_PLAN_FRIGO);
    expect(planSuiviDuCarnet(frigo(), [planFrigo({ status: 'completed' })])).toBeUndefined();
    expect(planSuiviDuCarnet(frigo(), [])).toBeUndefined();
  });
  it('repris : brouillon, date et prix gardés ; un plan non archivé reste le même objet', () => {
    const r = planRepris(archive);
    expect(r.status).toBe('draft');
    expect([r.date, r.amountCents]).toEqual(['2027-05-30', 1234567]);
    const ouvert = planFrigo();
    expect(planRepris(ouvert)).toBe(ouvert);
  });
});

describe('CA13-2 : la marque d’historique du carnet', () => {
  it('une marque tenue par un Carnet monté n’est pas orpheline ; démonté, elle l’est et rouvre son carnet', () => {
    const etat = avecMarque({ autre: 1 }, { id: 'C1', jeton: 'j1' });
    vivre('j1');
    expect(marqueOrpheline(etat)).toBeNull();
    expect(carnetARouvrir(etat)).toBeNull();
    mourir('j1');
    expect(marqueOrpheline(etat)?.id).toBe('C1');
    expect(carnetARouvrir(etat)).toBe('C1');
  });
  it('un renvoi ne recopie pas la marque (sinon le Carnet prenait l’entrée pour la sienne) ; les autres clés restent', () => {
    expect(sansMarque({ [MARQUE_HISTOIRE]: { id: 'C1', jeton: 'j' }, 'laffinee-route': 3 })).toEqual({ 'laffinee-route': 3 });
    expect(sansMarque(null)).toEqual({});
  });
  it('l’ancienne marque (true, tour 13) n’est pas un carnet à rouvrir', () => {
    expect(carnetARouvrir({ [MARQUE_HISTOIRE]: true })).toBeNull();
  });
});
