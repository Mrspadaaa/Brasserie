import { describe, expect, it } from 'vitest';
import type { Batch, CreativeItem } from '../../src/types';
import type { FinancialPlan } from '../../src/domain/finance/types';
import type { ForecastItem } from '../../src/domain/finance/forecast';
import { rescheduleBatchPatch } from '../../src/domain/batchSchedule';
import { choseArgent, choseBrassin, choseCreative, choseVenteProbable, jalonsBrassin, type ChoseCalendrier } from '../../src/domain/calendrier';
import { courbeCaisse, type CourbeCaisse } from '../../src/domain/calendrierCaisse';
import { accepterVente, allonger, deplacer, dupliquer, ecartsDeJalons, fait, lier, livrer, mettreDeCote, noterIdee, peutDeplacer, promesseTouchee, resoudre, retirer, type ContexteGestes, type Resolution } from '../../src/domain/calendrierGestes';

const AUJOURDHUI = '2026-11-16';
const etapes = (primaire: number, garde: number) => [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: primaire }, { kind: 'garde', name: 'Garde', tempC: 4, days: garde }];
const blonde = (p: Partial<Batch> = {}) => ({
  id: 'LOT-5', name: 'Blonde d’automne', style: 'Blonde', volumeL: 30, brewDate: '', plannedBrewDate: '08.12.2026', status: 'planifie',
  recipeSnapshot: { fermentation: etapes(14, 21), hops: [{ name: 'Citra', alpha: 12, weightG: 30, stage: 'dryHop', dayOffset: 5 }] }, ...p
}) as unknown as Batch;
const plan = (p: Partial<FinancialPlan> = {}): FinancialPlan => ({ id: 'PLAN-M', title: 'Malt', date: '2026-12-21', amountCents: 54000, direction: 'out', category: 'divers', source: 'manual', status: 'active', createdAt: 'x', ...p });
const ctx = (p: Partial<ContexteGestes> = {}): ContexteGestes => ({ aujourdhui: AUJOURDHUI, batches: [], plans: [], courbe: null, nouvelId: x => `${x}-NEW`, idBrassin: () => 'LOT-NEW', maintenant: '2026-11-16T10:00:00.000Z', ...p });
const bien = (r: Resolution) => { if (!r.ok) throw new Error(`refus : ${r.raison}`); return r; };
const item = (id: string, date: string, p: Partial<ForecastItem> = {}): ForecastItem => ({ id, date, label: 'Ligne', amountCents: 10000, direction: 'out', source: 'plan', category: 'divers', ...p });

/** Une courbe de 52 semaines depuis le 16.11.2026 : départ 5 064 CHF + 540 CHF, et la sortie « Malt » de 540 CHF en S52. */
function courbeMalt(): { courbe: CourbeCaisse; chose: ChoseCalendrier; p: FinancialPlan } {
  const p = plan();
  const chose = choseArgent(item('PLAN-M:2026-12-21', '2026-12-21', { amountCents: 54000, planId: 'PLAN-M', label: 'Malt' }), [p])!;
  const courbe = courbeCaisse({ depart: 506400, lundi0: AUJOURDHUI, mouvements: [{ id: 'PLAN-M:2026-12-21', jour: '2026-12-21', centimes: -54000, nom: 'Malt', choseId: chose.id }] })!;
  return { courbe, chose, p };
}

describe('A5 : déplacer garde la longueur, les sources non déplaçables disent où les régler', () => {
  it('une fête avec une fenêtre bouge de n semaines : date et fenêtre, même longueur', () => {
    const f: CreativeItem = { id: 'CR-1', type: 'event', title: 'Sols', status: 'todo', date: '2026-12-07', fenetre: { du: '2026-12-07', au: '2026-12-27', joursActifs: 3 } };
    const chose = choseCreative(f)!;
    const r = bien(deplacer(chose, 2, ctx()));
    expect(r.ecritures).toEqual([{ op: 'patch', collection: 'creativeItems', id: 'CR-1', patch: { date: '2026-12-21', fenetre: { du: '2026-12-21', au: '2027-01-10', joursActifs: 3 } } }]);
    expect(deplacer(chose, 0, ctx())).toMatchObject({ ok: false });
  });
  it('un plan manuel bouge ; une facture, une charge fixe, une sortie de brassin, un projet de matériel et une échéance de TVA refusent en nommant l’écran', () => {
    const { chose, p } = courbeMalt();
    expect(bien(deplacer(chose, -1, ctx({ plans: [p] }))).ecritures).toEqual([{ op: 'patch', collection: 'financialPlans', id: 'PLAN-M', patch: { date: '2026-12-14' } }]);
    const attendu: Array<[ForecastItem, RegExp]> = [
      [item('invoice:T1', '2026-12-01', { source: 'invoice' }), /facture/i],
      [item('P:2026-12-01', '2026-12-01', { source: 'recurring', planId: 'REC' }), /Finances/],
      [item('b', '2026-12-01', { source: 'brew', batchId: 'LOT-5' }), /Brassins/],
      [item('e', '2026-12-01', { source: 'equipment', planId: 'UP', category: 'materiel' }), /Matériel/],
      [item('t', '2026-12-01', { planId: 'TVA' }), /Finances › Annuel/]
    ];
    for (const [ligne, mot] of attendu) {
      const c = choseArgent(ligne, [plan({ id: 'TVA', source: 'tax' })])!;
      const peut = peutDeplacer(c);
      expect(peut.ok).toBe(false);
      const r = deplacer(c, 1, ctx());
      expect(r.ok).toBe(false);
      expect(!r.ok && r.raison).toMatch(mot);
      expect(!r.ok && r.ouvrir).toBeTruthy();
    }
  });
  it('une promesse (plan in avec batchId) est touchée quand « prête le » dépasse sa date ; « Livrer le » est le lendemain de « prête »', () => {
    const promis = plan({ id: 'PV', title: '3 fûts La Cigogne', direction: 'in', batchId: 'LOT-5', date: '2026-12-15', clientId: 'CL-9' });
    const p = promesseTouchee([promis], 'LOT-5', '2027-01-04')!;
    expect(p).toMatchObject({ planId: 'PV', jourPromis: '2026-12-15', preteLe: '2027-01-04', livrerLe: '2027-01-05', clientId: 'CL-9' });
    expect(p.texte).toBe('3 fûts La Cigogne promis le 15 déc. · prête le 4 janv.');
    expect(promesseTouchee([promis], 'LOT-5', '2026-12-15')).toBeNull();
    expect(promesseTouchee([promis], 'LOT-5', '2026-12-10')).toBeNull();
    expect(promesseTouchee([{ ...promis, batchId: undefined }], 'LOT-5', '2027-01-04')).toBeNull();
    expect(promesseTouchee([{ ...promis, status: 'cancelled' }], 'LOT-5', '2027-01-04')).toBeNull();
    expect(promesseTouchee([promis], 'LOT-AUTRE', '2027-01-04')).toBeNull();
  });
  it('allonger un brassin lié à une vente datée ouvre la promesse ; Livrer écrit la nouvelle date de la vente', () => {
    const promis = plan({ id: 'PV', title: '3 fûts La Cigogne', direction: 'in', batchId: 'LOT-5', date: '2026-12-15', amountCents: 90000 });
    const b = blonde({ recipeSnapshot: { fermentation: etapes(3, 2) } as never });
    const chose = choseBrassin(b, AUJOURDHUI)!;
    expect(chose).toMatchObject({ debut: '2026-12-08', fin: '2026-12-13', preteLe: '2026-12-13' });
    const sans = bien(allonger(chose, 1, ctx({ batches: [b], plans: [promis] })));
    expect(sans.promesse).toBeNull();
    const avec = bien(allonger(chose, 10, ctx({ batches: [b], plans: [promis] })));
    expect(avec.ecritures).toEqual([{ op: 'patch', collection: 'batches', id: 'LOT-5', patch: { finPrevue: '2026-12-23' } }]);
    expect(avec.promesse).toMatchObject({ preteLe: '2026-12-23', livrerLe: '2026-12-24' });
    const l = bien(livrer(avec.promesse!, ctx({ plans: [promis] })));
    expect(l.ecritures).toEqual([{ op: 'patch', collection: 'financialPlans', id: 'PV', patch: { date: '2026-12-24' } }]);
    expect(l.message.lecture).toBe('3 fûts La Cigogne : 24 déc. · Annuler');
  });
  it('allonger ne descend pas sous un jour et ne touche pas une charge fixe', () => {
    const b = blonde({ recipeSnapshot: { fermentation: etapes(3, 2) } as never });
    expect(allonger(choseBrassin(b, AUJOURDHUI)!, -9, ctx({ batches: [b] }))).toMatchObject({ ok: false });
    const fixe = choseArgent(item('P:1', '2026-12-01', { source: 'recurring', planId: 'REC' }), [])!;
    expect(allonger(fixe, 7, ctx())).toMatchObject({ ok: false });
  });
});

describe('A6 : l’effet sur la caisse dit la première semaine qui change, une seule fois', () => {
  it('« S51 : 5 064 → 4 524 » et jamais la semaine redite', () => {
    const { courbe, chose, p } = courbeMalt();
    const r = bien(deplacer(chose, -1, ctx({ plans: [p], courbe })));
    expect(r.effet).toMatchObject({ numero: 51, avant: 506400, apres: 452400, texte: 'S51 : 5 064 → 4 524' });
    expect(r.message.texte).toBe('S51 : 5 064 → 4 524');
    expect(r.message.lecture).toBe('S51 : 5 064 → 4 524 · Annuler');
    expect(r.message.lecture.match(/S\d+/g)).toHaveLength(1);
    expect(r.courbeApres!.semaines[4].libre).toBe(452400);
  });
  it('dupliquer et retirer disent aussi leur effet, sans redire la semaine', () => {
    const { courbe, chose, p } = courbeMalt();
    const d = bien(dupliquer(chose, '2026-11-30', ctx({ plans: [p], courbe })));
    expect(d.effet?.texte).toBe('S49 : 5 064 → 4 524');
    expect(d.message.lecture).toBe('Dupliquée · S49 : 5 064 → 4 524 · Annuler');
    expect(d.ecritures[0]).toMatchObject({ op: 'creer', collection: 'financialPlans', document: { id: 'PLAN-NEW', date: '2026-11-30', status: 'active', title: 'Malt' } });
    const r = bien(retirer(chose, ctx({ plans: [p], courbe })));
    expect(r.effet).toMatchObject({ numero: 52, avant: 452400, apres: 506400 });
    expect(r.message.lecture).toBe('Annulé · S52 : 4 524 → 5 064 · dans Finances › · Annuler');
  });
});

describe('A9 (D-103) : le brassin planifié, ses jalons et le jalon de fin', () => {
  it('déplacer rend le patch de rescheduleBatchPatch avec +n semaines ; les jalons gardent leurs écarts', () => {
    const b = blonde();
    const chose = choseBrassin(b, AUJOURDHUI)!;
    expect(chose).toMatchObject({ debut: '2026-12-08', fin: '2027-01-12', preteLe: '2027-01-12', deplacable: true });
    expect(chose.jalons!.map(j => [j.id, j.ecart])).toEqual([['brassage', 0], ['fermentation', 1], ['dry-hop', 5], ['garde', 14], ['conditionnement', 35]]);
    const r = bien(deplacer(chose, 2, ctx({ batches: [b] })));
    expect(r.ecritures).toEqual([{ op: 'patch', collection: 'batches', id: 'LOT-5', patch: rescheduleBatchPatch(b, '2026-12-22') }]);
    const apres = { ...b, ...(r.ecritures[0] as { patch: object }).patch } as Batch;
    expect(ecartsDeJalons(apres)).toEqual(ecartsDeJalons(b));
    expect(jalonsBrassin(apres).map(j => j.jour)).toEqual(['2026-12-22', '2026-12-23', '2026-12-27', '2027-01-05', '2027-01-26']);
    expect(r.message.lecture).toBe('Blonde d’automne : S50 → S52 · Annuler');
  });
  it('avec une fin écrite, elle suit la barre : l’écart du jalon de fin ne change pas', () => {
    const b = blonde({ finPrevue: '2027-01-20' });
    const r = bien(deplacer(choseBrassin(b, AUJOURDHUI)!, 1, ctx({ batches: [b] })));
    expect(r.ecritures[0]).toMatchObject({ patch: { plannedBrewDate: '15.12.2026', brewDate: '', finPrevue: '2027-01-27' } });
    expect(ecartsDeJalons({ ...b, ...(r.ecritures[0] as { patch: object }).patch } as Batch)).toEqual(ecartsDeJalons(b));
  });
  it('déplacer le jalon de fin rend { finPrevue } ; le jalon de fin tiré avec une promesse ouvre l’alerte', () => {
    const b = blonde();
    const chose = choseBrassin(b, AUJOURDHUI)!;
    const r = bien(deplacer(chose, 1, ctx({ batches: [b] }), 'conditionnement'));
    expect(r.ecritures).toEqual([{ op: 'patch', collection: 'batches', id: 'LOT-5', patch: { finPrevue: '2027-01-19' } }]);
    const promis = plan({ id: 'PV', title: '3 fûts', direction: 'in', batchId: 'LOT-5', date: '2027-01-15' });
    expect(bien(deplacer(chose, 1, ctx({ batches: [b], plans: [promis] }), 'conditionnement')).promesse).toMatchObject({ livrerLe: '2027-01-20' });
  });
  it('un jalon intermédiaire ne se déplace pas : refus « recette », aucune écriture, avec « Ouvrir le brassin ›»', () => {
    const b = blonde();
    const chose = choseBrassin(b, AUJOURDHUI)!;
    for (const id of ['dry-hop', 'garde', 'fermentation'] as const) {
      const r = deplacer(chose, 1, ctx({ batches: [b] }), id);
      expect(r.ok).toBe(false);
      expect(!r.ok && r.raison).toContain('recette');
      expect('ecritures' in r).toBe(false);
    }
    const r = deplacer(chose, 1, ctx({ batches: [b] }), 'dry-hop');
    expect(!r.ok && r.message.lecture).toBe('Le dry hop suit la recette du brassin · Ouvrir le brassin ›');
  });
  it('un brassin en cuve : le jour de brassage ne bouge pas (refus « en cuve »), seul le jalon de fin se glisse', () => {
    const b = blonde({ status: 'fermentation', brewDate: '30.11.2026', plannedBrewDate: '28.11.2026' });
    const chose = choseBrassin(b, AUJOURDHUI)!;
    expect(chose).toMatchObject({ debut: '2026-11-30', fin: '2027-01-04' });
    const r = deplacer(chose, 1, ctx({ batches: [b] }));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.raison).toContain('en cuve');
    const jalon = deplacer(chose, 1, ctx({ batches: [b] }), 'brassage');
    expect(!jalon.ok && jalon.raison).toContain('en cuve');
    expect(bien(deplacer(chose, 1, ctx({ batches: [b] }), 'conditionnement')).ecritures).toEqual([{ op: 'patch', collection: 'batches', id: 'LOT-5', patch: { finPrevue: '2027-01-11' } }]);
  });
  it('un brassin conditionné est un fait : refus, il ne s’allonge pas non plus', () => {
    const b = blonde({ status: 'conditionne', bottlingDate: '2026-11-20', brewDate: '01.11.2026' });
    const chose = choseBrassin(b, AUJOURDHUI)!;
    expect(deplacer(chose, 1, ctx({ batches: [b] }))).toMatchObject({ ok: false });
    expect(allonger(chose, 3, ctx({ batches: [b] }))).toMatchObject({ ok: false });
  });
});

describe('A10, retirer, dupliquer, accepter, fait, lier : les écritures et leurs refus (L33)', () => {
  const fete = (): CreativeItem => ({ id: 'CR-1', type: 'event', title: 'Marché de Noël', status: 'todo', date: '2026-12-14' });
  it('retirer une fête enlève sa date et le dit : « Retirée de S51 · Sans date › · Annuler » ; rien n’est supprimé', () => {
    const r = bien(retirer(choseCreative(fete())!, ctx()));
    expect(r.ecritures).toEqual([{ op: 'patch', collection: 'creativeItems', id: 'CR-1', patch: { date: '' } }]);
    expect(r.message).toMatchObject({ lecture: 'Retirée de S51 · Sans date › · Annuler', lien: { ancre: 'sans-date' }, action: 'Annuler' });
    expect(r.ecritures.some(e => e.op === 'supprimer')).toBe(false);
  });
  it('retirer un plan manuel le passe à cancelled ; un brassin, une facture refusent', () => {
    const { chose, p } = courbeMalt();
    const r = bien(retirer(chose, ctx({ plans: [p] })));
    expect(r.ecritures).toEqual([{ op: 'patch', collection: 'financialPlans', id: 'PLAN-M', patch: { status: 'cancelled' } }]);
    expect(r.message.lien).toMatchObject({ ancre: 'finances' });
    expect(retirer(choseBrassin(blonde(), AUJOURDHUI)!, ctx({ batches: [blonde()] }))).toMatchObject({ ok: false });
    expect(retirer(choseArgent(item('invoice:T1', '2026-12-01', { source: 'invoice' }))!, ctx())).toMatchObject({ ok: false });
  });
  it('mettre de côté n’écrit que fenetre.miseDeCote sur la chose : aucune écriture de plan', () => {
    const f: CreativeItem = { id: 'CR-F', type: 'event', title: 'Frigo', status: 'todo', date: '2026-02-02', activite: true, estimatedCost: 1800, fenetre: { du: '2026-02-02', au: '2026-08-30' } };
    const chose = choseCreative(f)!;
    const r = bien(mettreDeCote(chose, true, ctx()));
    expect(r.ecritures).toEqual([{ op: 'patch', collection: 'creativeItems', id: 'CR-F', patch: { fenetre: { du: '2026-02-02', au: '2026-08-30', miseDeCote: true } } }]);
    expect(r.ecritures.some(e => e.collection === 'financialPlans')).toBe(false);
    const rendu = bien(mettreDeCote({ ...chose, miseDeCote: true, fenetre: { du: '2026-02-02', au: '2026-08-30', miseDeCote: true } }, false, ctx()));
    expect(rendu.ecritures[0]).toMatchObject({ patch: { fenetre: { du: '2026-02-02', au: '2026-08-30' } } });
    expect('miseDeCote' in ((rendu.ecritures[0] as { patch: { fenetre: object } }).patch.fenetre)).toBe(false);
    expect(mettreDeCote({ ...chose, fenetre: undefined }, true, ctx())).toMatchObject({ ok: false });
    expect(mettreDeCote({ ...chose, centimes: undefined }, true, ctx())).toMatchObject({ ok: false });
  });
  it('accepter une vente probable la rend pleine : le plan passe à active', () => {
    const probable = plan({ id: 'PV', title: 'Café du Pont', direction: 'in', status: 'draft', date: '2026-12-02', amountCents: 12000, category: 'recettes' });
    const chose = choseVenteProbable(probable)!;
    expect(chose).toMatchObject({ probable: true, proposition: 'vente', centimes: 12000, rangee: 'ventes' });
    const courbe = courbeCaisse({ depart: 100000, lundi0: AUJOURDHUI, mouvements: [] })!;
    const r = bien(accepterVente(chose, ctx({ plans: [probable], courbe })));
    expect(r.ecritures).toEqual([{ op: 'patch', collection: 'financialPlans', id: 'PV', patch: { status: 'active' } }]);
    expect(r.effet).toMatchObject({ numero: 49, avant: 100000, apres: 112000 });
    expect(accepterVente(chose, ctx({ plans: [{ ...probable, status: 'active' }] }))).toMatchObject({ ok: false });
  });
  it('fait, lier et dupliquer un brassin (un brassin planifié, qui ne décompte rien)', () => {
    const chose = choseCreative({ ...fete(), type: 'prospect' })!;
    expect(bien(fait(chose)).ecritures).toEqual([{ op: 'patch', collection: 'creativeItems', id: 'CR-1', patch: { status: 'done' } }]);
    expect(bien(lier(chose, { clientId: 'CL-1' }, ctx())).ecritures[0]).toMatchObject({ patch: { liens: { clientId: 'CL-1' } } });
    const b = blonde();
    const d = bien(dupliquer(choseBrassin(b, AUJOURDHUI)!, '2026-12-28', ctx({ batches: [b] })));
    expect(d.ecritures[0]).toMatchObject({ op: 'creer', collection: 'batches', document: { id: 'LOT-NEW', plannedBrewDate: '2026-12-28', status: 'planifie', brewDate: '' } });
    expect(JSON.stringify(d.ecritures)).not.toContain('stockConsumption');
  });
  it('noter une idée : un recipe-idea daté de la semaine, sans rangée', () => {
    const r = bien(noterIdee('Bière au sapin', '2026-12-07', ctx()));
    expect(r.ecritures[0]).toMatchObject({ op: 'creer', collection: 'creativeItems', document: { type: 'recipe-idea', date: '2026-12-07' } });
    expect(noterIdee(' ', '2026-12-07', ctx())).toMatchObject({ ok: false });
  });
  it('resoudre : une intention, un seul vocabulaire ; même résultat que l’appel direct', () => {
    const { courbe, chose, p } = courbeMalt();
    const c = ctx({ plans: [p], courbe });
    expect(resoudre({ genre: 'deplacer', chose, semaines: -1 }, c)).toEqual(deplacer(chose, -1, c));
    expect(resoudre({ genre: 'retirer', chose }, c)).toEqual(retirer(chose, c));
    expect(resoudre({ genre: 'noter-idee', titre: 'x', lundi: '2026-12-07' }, c)).toEqual(noterIdee('x', '2026-12-07', c));
    expect(resoudre({ genre: 'allonger', chose, jours: 7 }, c)).toMatchObject({ ok: true, ecritures: [{ collection: 'financialPlans', patch: { fenetre: { du: '2026-12-21', au: '2027-01-03' } } }] });
  });
  it('un seul message à la fois, deux lignes au plus : aucun message ne passe 140 caractères', () => {
    const { courbe, chose, p } = courbeMalt();
    const messages = [deplacer(chose, -1, ctx({ plans: [p], courbe })), retirer(chose, ctx({ plans: [p], courbe })), dupliquer(chose, '2026-11-30', ctx({ plans: [p], courbe }))].map(r => r.message.lecture);
    for (const m of messages) expect(m.length).toBeLessThan(140);
  });
});
