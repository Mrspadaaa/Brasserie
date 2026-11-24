// Lot 2 du Carnet (23.11) : le lien carnet ↔ plan (L-10, L-11, L-12, L-14), le prix d'article (L-9) et les formats (L-15).
// Ses mots : « il y a même pas le prix de la chambre froide ?? » (21.11). Le montant du plan quand un article est choisi attend Q-1 : seul ce
// qui n'en dépend pas est vérifié ici (un plan sans montant prend le prix, l'étape « à chercher » tombe, un montant posé reste).
import { describe, expect, it } from 'vitest';
import { fixtureCarnets, fixturePlans, ID_EVIER, ID_FRIGO, ID_PLAN_FRIGO } from '../../src/domain/carnets/fixture';
import { lireCarnet, type CarnetDoc } from '../../src/domain/carnets/modele';
import * as ops from '../../src/domain/carnets/operations';
import { montant, texteSortie, valeurTexte } from '../../src/ui/carnets/EtatIA';
import { anneauDe } from '../../src/domain/finance/upgradeRing';
import type { FinancialPlan } from '../../src/domain/finance/types';
import type { CreativeItem } from '../../src/types';

const carnet = (items: readonly CreativeItem[], id: string): CarnetDoc => lireCarnet(items.find(i => i.id === id))!;
const F = fixtureCarnets();
const frigo = () => carnet(F, ID_FRIGO);
const planFrigo = (patch: Partial<FinancialPlan> = {}): FinancialPlan => ({ ...fixturePlans().find(p => p.id === ID_PLAN_FRIGO)!, ...patch });
const O = ops as unknown as Record<string, (...a: unknown[]) => any>;

describe('L-12 : le carnet dit l’état de son plan', () => {
  it('plan supprimé : « supprimé », jamais « Dans À venir »', () => {
    expect(ops.etatSortie(frigo(), [])?.sorte).toBe('supprime');
    expect(texteSortie({ le: '2026-11-23', etat: 'supprime' as never })).not.toMatch(/Dans À venir/);
  });
  it('plan marqué « Réalisé, sans achat » : réalisé, sans achat ; le lien dit Réalisés ; la suppression archive', () => {
    const e = ops.etatSortie(frigo(), [planFrigo({ status: 'completed' })]);
    expect(e?.sorte).toBe('realise');
    expect((e as { sansAchat?: true }).sansAchat).toBe(true);
    expect(texteSortie({ le: '2026-11-23', etat: 'realise', sansAchat: true } as never)).toBe('Réalisé, sans achat');
    expect(ops.liensDe(frigo(), [planFrigo({ status: 'completed' })])[0].sorte).toBe('realise');
    expect(ops.liensQuiRetiennent(frigo(), [planFrigo({ status: 'completed' })])[0].reglage).toBe('archiver');
  });
  it('plan archivé : « archivé », aucun « Dans À venir », il ne retient plus l’idée', () => {
    expect(ops.etatSortie(frigo(), [planFrigo({ status: 'cancelled' })])?.sorte).toBe('archive');
    expect(texteSortie({ le: '2026-11-23', etat: 'archive' } as never)).toMatch(/archivé/i);
    expect(ops.liensDe(frigo(), [planFrigo({ status: 'cancelled' })])).toEqual([]);
    expect(ops.liensQuiRetiennent(frigo(), [planFrigo({ status: 'cancelled' })])).toEqual([]);
  });
  it('plan brouillon : à venir', () => {
    expect(ops.etatSortie(frigo(), [planFrigo()])?.sorte).toBe('a-venir');
  });
});

describe('L-11 : le plan suit le carnet, le carnet lit son plan', () => {
  it('planOuvertDuCarnet : le plan brouillon ; ni réalisé, ni archivé, ni absent', () => {
    expect(O.planOuvertDuCarnet(frigo(), [planFrigo()])?.id).toBe(ID_PLAN_FRIGO);
    expect(O.planOuvertDuCarnet(frigo(), [planFrigo({ status: 'cancelled' })])).toBeUndefined();
    expect(O.planOuvertDuCarnet(frigo(), [planFrigo({ status: 'completed' })])).toBeUndefined();
    expect(O.planOuvertDuCarnet(carnet(F, ID_EVIER), [planFrigo()])).toBeUndefined();
  });
  it('date du carnet → date et précision du plan ; prix estimé → montant du plan (livraison gardée)', () => {
    const p0 = planFrigo({ upgrade: { ...planFrigo().upgrade!, deliveryCents: 5000, purchaseCents: 485000, budgetKnown: true } });
    const p1 = O.planSuitCarnet(p0, { date: '2026-12-21', precision: 'mois' });
    expect(p1.date).toBe('2026-12-21');
    expect(p1.upgrade.datePrecision).toBe('month');
    expect(O.planSuitCarnet(p0, { date: '2026-12-21', precision: 'semaine' }).upgrade.datePrecision).toBe('day');
    const p2 = O.planSuitCarnet(p0, { centimes: 20000 });
    expect(p2.upgrade.purchaseCents).toBe(20000);
    expect(p2.amountCents).toBe(25000);
    expect(p2.upgrade.budgetKnown).toBe(true);
    expect(O.planSuitCarnet(p0, {})).toBe(p0);
    expect(O.planSuitCarnet(p0, { date: null })).toBe(p0);
  });
});

describe('L-10 : le choix monte au plan sans trancher Q-1', () => {
  const choisi = () => { const c = frigo(); const a = c.carnet.articles.find(x => x.id === c.carnet.choix!.articleId)!; a.prixCentimes = 249560; a.devise = 'CHF'; return c; };
  it('plan à 0 (« à estimer ») : prend le prix du choix, prêt à acheter', () => {
    const p = O.planSuitChoix(planFrigo({ amountCents: 0, upgrade: { ...planFrigo().upgrade!, budgetKnown: false, purchaseCents: undefined, stage: 'research' } }), choisi());
    expect(p.amountCents).toBe(249560);
    expect(anneauDe(p).libelle).toMatch(/prix trouvé/);
  });
  it('plan déjà chiffré (500) : Q-1 A, le choix fait le prix ; l’étape n’est plus « à chercher »', () => {
    const p = O.planSuitChoix(planFrigo({ amountCents: 50000, upgrade: { ...planFrigo().upgrade!, budgetKnown: true, purchaseCents: 50000, stage: 'research' } }), choisi());
    expect(p.amountCents).toBe(249560);
    expect(anneauDe(p).libelle).not.toMatch(/à chercher/);
  });
});

describe('L-9 : poser le prix d’un article', () => {
  it('écrit le prix en CHF sur l’article ; refuse un prix illisible', () => {
    const avec = fixtureCarnets().find(i => (lireCarnet(i)?.carnet.articles.length ?? 0) > 0)!;
    const a = lireCarnet(avec)!.carnet.articles[0];
    const r = O.poserPrixArticle(fixtureCarnets(), { carnetId: avec.id, articleId: a.id, centimes: 1234500 });
    expect(r.ok).toBe(true);
    const doc = r.ecritures.find((w: { op: string; doc?: { id: string } }) => w.op === 'put' && w.doc?.id === avec.id).doc;
    const art = lireCarnet(doc)!.carnet.articles.find(x => x.id === a.id)!;
    expect(art.prixCentimes).toBe(1234500);
    expect(art.devise).toBe('CHF');
    expect(O.poserPrixArticle(fixtureCarnets(), { carnetId: avec.id, articleId: a.id, centimes: 0 }).ok).toBe(false);
  });
});

describe('L-15 : un seul format suisse', () => {
  it('montant : virgule décimale, espace des milliers', () => {
    expect(montant(249560)).toBe('2 495,60');
    expect(montant(276365)).toBe('2 763,65');
    expect(montant(50000)).toBe('500');
  });
  it('valeur lue « 1.845 » (point des milliers) : « 1 845 » ; « 0.50 » : « 0,50 »', () => {
    expect(valeurTexte({ valeur: '1.845', unite: 'mm', origine: 'page' })).toBe('1 845');
    expect(valeurTexte({ valeur: '0.50', unite: 'mm', origine: 'page' })).toBe('0,50');
    expect(valeurTexte({ valeur: 'RAL 9002', origine: 'page' })).toBe('RAL 9002');
  });
});
