import { describe, expect, it, vi } from 'vitest';
import type { Batch, CreativeItem } from '../../src/types';
import type { FinancialPlan } from '../../src/domain/finance/types';
import type { ForecastItem } from '../../src/domain/finance/forecast';
import { rescheduleBatchPatch } from '../../src/domain/batchSchedule';
import { choseArgent, choseBrassin, choseCreative, choseVenteProbable, jalonsBrassin, type ChoseCalendrier } from '../../src/domain/calendrier';
import { courbeCaisse, type CourbeCaisse } from '../../src/domain/calendrierCaisse';
import { accepterVente, allonger, choseAllongee, deplacer, /* CRITIQUE-6 n° 2 */ dupliquer, dureeAllongee, ecartsDeJalons, fait, lier, livrer, mettreDeCote, noterIdee, peutDeplacer, promesseTouchee, resoudre, retirer, type ContexteGestes, type Resolution } from '../../src/domain/calendrierGestes';
import { texteDuree } from '../../src/domain/calendrier';
import { appliquer } from '../../src/ui/calendrier/ecritures';
import { alignerCourbe } from '../../src/domain/calendrierGestes';
import { isoDate } from '../../src/domain/finance/ledger';
import type { FinancialProfile } from '../../src/domain/finance/types';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';
import type { StockItem } from '../../src/types';
import { construireModele, type EntreesModele } from '../../src/ui/calendrier/useDonneesCalendrier';
import { avecTendance, etatBanc } from '../../src/design/CalendrierPreview';
import { preparerChoses } from '../../src/domain/calendrier';

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
  /* En ligne 1, n° 4 (18.11) : le bandeau d'un glissé dit l'effet sur le chiffre clé (sa valeur, sa semaine), plus « S51 : 5 064 → 4 524 » qui
     faisait croire à un gain ; l'effet de la semaine (`effet.texte`) reste celui de A6 */
  it('« S51 : 5 064 → 4 524 » pour l’effet ; au glissé, le chiffre clé et son creux ; jamais une semaine redite', () => {
    const { courbe, chose, p } = courbeMalt();
    const r = bien(deplacer(chose, -1, ctx({ plans: [p], courbe })));
    expect(r.effet).toMatchObject({ numero: 51, avant: 506400, apres: 452400, texte: 'S51 : 5 064 → 4 524' });
    expect(r.message.texte).toBe('Malt · À dépenser 4 524 : creux S52 → S51');
    expect(r.message.lecture).toBe('Malt · À dépenser 4 524 : creux S52 → S51 · Annuler');
    expect(r.message.lecture.match(/S\d+/g)).toEqual(['S52', 'S51']);
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
    /* paquet F n° 2 : le message dit ce qui est annulé (une prévision d'achat) */
    expect(r.message.lecture).toBe('Achat annulé · S52 : 4 524 → 5 064 · dans Finances › · Annuler');
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
    expect(!r.ok && r.message.lecture).toBe('Blonde d’automne : le dry hop suit la recette du brassin · Ouvrir le brassin ›');
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
  it('ranger une fête sans date enlève sa date et le dit : « Rangée sans date, plus en S51 · Sans date › · Annuler » ; rien n’est supprimé', () => {
    const r = bien(retirer(choseCreative(fete())!, ctx()));
    expect(r.ecritures).toEqual([{ op: 'patch', collection: 'creativeItems', id: 'CR-1', patch: { date: '' } }]);
    expect(r.message).toMatchObject({ lecture: 'Rangée sans date, plus en S51 · Sans date › · Annuler', lien: { ancre: 'sans-date' }, action: 'Annuler' });
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
  it('noter une idée (R48) : un carnet d’idées daté de la semaine, sans rangée', () => {
    const r = bien(noterIdee('Bière au sapin', '2026-12-07', ctx()));
    expect(r.ecritures[0]).toMatchObject({ op: 'creer', collection: 'creativeItems', document: { type: 'carnet', status: 'idea', date: '2026-12-07' } });
    expect(noterIdee(' ', '2026-12-07', ctx())).toMatchObject({ ok: false });
  });
  it('resoudre : une intention, un seul vocabulaire ; même résultat que l’appel direct', () => {
    const { courbe, chose, p } = courbeMalt();
    const c = ctx({ plans: [p], courbe });
    expect(resoudre({ genre: 'deplacer', chose, semaines: -1 }, c)).toEqual(deplacer(chose, -1, c));
    expect(resoudre({ genre: 'retirer', chose }, c)).toEqual(retirer(chose, c));
    vi.useFakeTimers({ now: new Date('2026-11-18T12:00:00.000Z') });
    try { expect(resoudre({ genre: 'noter-idee', titre: 'x', lundi: '2026-12-07' }, c)).toEqual(noterIdee('x', '2026-12-07', c)); } finally { vi.useRealTimers(); }
    expect(resoudre({ genre: 'allonger', chose, jours: 7 }, c)).toMatchObject({ ok: true, ecritures: [{ collection: 'financialPlans', patch: { fenetre: { du: '2026-12-21', au: '2027-01-03' } } }] });
  });
  it('un seul message à la fois, deux lignes au plus : aucun message ne passe 140 caractères', () => {
    const { courbe, chose, p } = courbeMalt();
    const messages = [deplacer(chose, -1, ctx({ plans: [p], courbe })), retirer(chose, ctx({ plans: [p], courbe })), dupliquer(chose, '2026-11-30', ctx({ plans: [p], courbe }))].map(r => r.message.lecture);
    for (const m of messages) expect(m.length).toBeLessThan(140);
  });
});

describe('CRITIQUE-3 n° 30 : après allonger, la durée garde « J / n · prête le … »', () => {
  it('t3 : brassée le 9 nov., 28 j, allongée de 7 j le 16 nov. : « J7 / 35 · prête 14 déc. », dans l’aperçu, le message et la chose relue', () => {
    const ipa = { id: 'LOT-IPA', name: 'IPA de printemps', style: 'IPA', volumeL: 100, brewDate: '09.11.2026', actualBrewDate: '09.11.2026', status: 'fermentation', recipeSnapshot: { fermentation: etapes(14, 14) } } as unknown as Batch;
    const chose = choseBrassin(ipa, AUJOURDHUI)!;
    expect(chose.duree).toBe('J7 / 28 · prête 7 déc.');
    expect(dureeAllongee(chose, 7, AUJOURDHUI)).toBe('J7 / 35 · prête 14 déc.');
    expect(choseAllongee(chose, 7, AUJOURDHUI)).toMatchObject({ fin: '2026-12-14', preteLe: '2026-12-14', duree: 'J7 / 35 · prête 14 déc.' });
    const r = bien(allonger(chose, 7, ctx({ batches: [ipa] })));
    expect(r.ecritures).toEqual([{ op: 'patch', collection: 'batches', id: 'LOT-IPA', patch: { finPrevue: '2026-12-14' } }]);
    expect(r.message.texte).toBe('IPA de printemps : J7 / 35 · prête 14 déc.');
    /* la chose relue après l'écriture dit la même chose */
    expect(texteDuree(choseBrassin({ ...ipa, finPrevue: '2026-12-14' } as Batch, AUJOURDHUI)!)).toBe('J7 / 35 · prête 14 déc.');
    /* un brassin pas brassé s'allonge sans « J » (CRITIQUE-5 n° 1, test dédié plus bas) */
    const saison = choseBrassin({ ...ipa, id: 'LOT-S', status: 'planifie', brewDate: '', actualBrewDate: undefined, plannedBrewDate: '10.11.2026' } as unknown as Batch, AUJOURDHUI)!;
    /* CRITIQUE-6 n° 2 : pas brassée, elle est prête au plus tôt aujourd'hui (16 nov.) + 28 j + 7 j = 21 déc., jamais 10 nov. + 35 j */
    expect(choseAllongee(saison, 7, AUJOURDHUI).duree).toBe('pas brassée · prête le 21 déc.');
  });
});

describe('CRITIQUE-5 n° 1 : tirer le bord d’une Saison pas brassée', () => {
  const JOUR = '2026-11-17';
  const saison = { id: 'LOT-S', name: 'Saison de ferme', style: 'Saison', volumeL: 50, brewDate: '', plannedBrewDate: '10.11.2026', status: 'planifie', recipeSnapshot: { fermentation: etapes(10, 4) } } as unknown as Batch;
  it('planifiée le 10 nov., jour 17 nov., cycle 14 j, +7 : « pas brassée · prête le 8 déc. » (CRITIQUE-6 n° 2 : depuis le 17 nov.), aucun « J », finPrevue = 24 nov. + 7 j ; Annuler rend le Batch identique', async () => {
    const chose = choseBrassin(saison, JOUR)!;
    expect(chose.pasBrassee).toBe(true);
    // CRITIQUE-6 n° 2 : la base de « prête le » est max(jour prévu, aujourd'hui) + cycle : 17 nov. + 14 j = 1 déc. (jamais 10 nov. + 14 j)
    expect(chose.pretePrevue).toBe('2026-12-01');
    expect(chose.duree).not.toMatch(/J\d/);
    // Pendant le geste : l'aperçu et la chose rendue.
    expect(dureeAllongee(chose, 7, JOUR)).toMatch(/^pas brassée · prête le /);
    expect(dureeAllongee(chose, 7, JOUR)).not.toMatch(/J\d/);
    const apercu = choseAllongee(chose, 7, JOUR);
    /* CRITIQUE-7 n° 2 : la barre court jusqu'à « prête » ; tirée de 7 j, sa fin suit */
    expect(apercu).toMatchObject({ debut: JOUR, fin: '2026-12-08', pretePrevue: '2026-12-08', duree: 'pas brassée · prête le 8 déc.' });
    // L'écriture et son message.
    const r = bien(allonger(chose, 7, ctx({ aujourdhui: JOUR, batches: [saison] })));
    expect(r.ecritures).toEqual([{ op: 'patch', collection: 'batches', id: 'LOT-S', patch: { finPrevue: '2026-12-01' } }]);
    expect(r.message.texte).toBe('Saison de ferme : pas brassée · prête le 8 déc.');
    expect(r.message.texte).not.toMatch(/J\d/);
    // La chose relue après l'écriture dit la même chose, sa barre allongée d'autant (17 nov. + 7 j), toujours sans « J ».
    const relue = choseBrassin({ ...saison, finPrevue: '2026-12-01' } as Batch, JOUR)!;
    expect(relue).toMatchObject({ pasBrassee: true, debut: JOUR, fin: '2026-12-08', pretePrevue: '2026-12-08', duree: 'pas brassée · prête le 8 déc.' });
    expect(texteDuree(relue)).not.toMatch(/J\d/);
    // Annuler : l'inverse remet le Batch tel qu'avant.
    const docs = new Map<string, Record<string, unknown>>([['LOT-S', structuredClone(saison) as unknown as Record<string, unknown>]]);
    const port = {
      lire: (_c: string, id: string) => docs.get(id),
      patcher: (_c: string, id: string, patch: Record<string, unknown>) => {
        const d = { ...docs.get(id)! };
        for (const [k, v] of Object.entries(patch)) { if (v === undefined) delete d[k]; else d[k] = v; }
        docs.set(id, d);
      },
      creer: () => undefined, supprimer: () => undefined
    };
    const fait = await appliquer(r.ecritures, port);
    expect(docs.get('LOT-S')!.finPrevue).toBe('2026-12-01');
    await fait.annuler();
    expect(docs.get('LOT-S')).toEqual(saison);
    expect('finPrevue' in docs.get('LOT-S')!).toBe(false);
  });
  it('pas de « Jn » tant que brewDate et actualBrewDate sont vides, quel que soit le statut', () => {
    // Statut « fermentation » sans jour de brassage réel : aucune date connue, rien n'est posé (jamais un « Jn » inventé).
    const sansDate = choseBrassin({ ...saison, status: 'fermentation' } as Batch, JOUR);
    expect(sansDate?.duree ?? '').not.toMatch(/J\d/);
    const futur = choseBrassin({ ...saison, plannedBrewDate: '01.12.2026' } as Batch, JOUR)!;
    expect(futur.duree).toBe('J0 / 14 · prête 15 déc.');
  });
});

describe('CRITIQUE-6 n° 2 (D-161, E25, E29) : une Saison pas brassée est prête au plus tôt aujourd’hui + cycle', () => {
  const JOUR = '2026-11-17';
  /* prévue le 10 nov. (passé, pas brassée), cycle de 35 j (21 + 14) */
  const saison = { id: 'LOT-S', name: 'Saison de ferme', style: 'Saison', volumeL: 50, brewDate: '', plannedBrewDate: '10.11.2026', status: 'planifie', recipeSnapshot: { fermentation: etapes(21, 14) } } as unknown as Batch;
  const cigogne = (date: string) => plan({ id: 'P-CIG', title: '3 fûts La Cigogne', direction: 'in', category: 'recettes', date, amountCents: 90000, batchId: 'LOT-S' });

  it('f2-a : « pas brassée · prête le 22 déc. » (17 nov. + 35 j), jamais « 15 déc. » (10 nov. + 35 j), dans l’aperçu, le message et la chose relue', () => {
    const chose = choseBrassin(saison, JOUR)!;
    expect(chose.pasBrassee).toBe(true);
    expect(chose.pretePrevue).toBe('2026-12-22');
    /* la barre part de la semaine courante : la date dit la même chose qu'elle */
    expect(chose).toMatchObject({ debut: JOUR, fin: '2026-12-22' });
    const pendant = dureeAllongee(chose, 0, JOUR);
    expect(pendant).toContain('pas brassée');
    expect(pendant).toContain('prête le 22 déc.');
    expect(pendant).not.toContain('15 déc.');
    /* tirer d'une semaine : 29 déc. ; l'écriture garde « jour prévu + cycle » (finPrevue = 15 déc. + 7 j), relue elle redit 29 déc. */
    const r = bien(allonger(chose, 7, ctx({ aujourdhui: JOUR, batches: [saison] })));
    expect(r.ecritures).toEqual([{ op: 'patch', collection: 'batches', id: 'LOT-S', patch: { finPrevue: '2026-12-22' } }]);
    expect(r.message.texte).toBe('Saison de ferme : pas brassée · prête le 29 déc.');
    expect(choseAllongee(chose, 7, JOUR).duree).toBe('pas brassée · prête le 29 déc.');
    const relue = choseBrassin({ ...saison, finPrevue: '2026-12-22' } as Batch, JOUR)!;
    expect(relue.duree).toBe('pas brassée · prête le 29 déc.');
    expect(texteDuree(relue)).not.toMatch(/J\d|15 déc/);
  });

  it('f6-b : la promesse se juge sur « prête le » au plus tôt ; un replanifié encore passé aussi', () => {
    /* promise le 24 déc. : tirée de 7 j elle est prête le 29 déc. (l'ancien calcul disait 22 déc. et ne prévenait pas) */
    const chose = choseBrassin(saison, JOUR)!;
    const r = bien(allonger(chose, 7, ctx({ aujourdhui: JOUR, batches: [saison], plans: [cigogne('2026-12-24')] })));
    expect(r.promesse).toMatchObject({ planId: 'P-CIG', preteLe: '2026-12-29', livrerLe: '2026-12-30' });
    expect(r.promesse!.texte).toContain('prête le 29 déc.');
    /* CRITIQUE-10 n° 1 : une semaine plus tôt que la colonne affichée (S47), c'est le passé : refus, aucune écriture */
    const d = deplacer(chose, -1, ctx({ aujourdhui: JOUR, batches: [saison], plans: [cigogne('2026-12-20')] }));
    expect(d.ok).toBe(true); /* CAL-PASSE (20.11) : le passé se replanifie, le refus est levé */
    /* promise le 20 déc. : glissée d'une colonne (lundi de S48, 23 nov.), prête le 28 déc. : promesse touchée */
    const p = bien(deplacer(chose, 1, ctx({ aujourdhui: JOUR, batches: [saison], plans: [cigogne('2026-12-20')] })));
    expect(p.promesse).toMatchObject({ preteLe: '2026-12-28' });
  });

  it('un brassin prévu dans le futur garde « prévue + cycle » : 24 nov. + 35 j = 29 déc.', () => {
    const futur = choseBrassin({ ...saison, plannedBrewDate: '24.11.2026' } as Batch, JOUR)!;
    expect(futur.pasBrassee).toBeUndefined();
    expect(futur.preteLe).toBe('2026-12-29');
    expect(futur.duree).toBe('J0 / 35 · prête 29 déc.');
  });
});

describe('CRITIQUE-7 n° 2 (D-47, D-190, E29) : la Saison pas brassée court jusqu’à « prête », et son bord tiré fait suivre la date', () => {
  const JOUR = '2026-11-18';
  /* prévue le 10 nov. (passé, pas brassée), cycle de 35 j (21 + 14) */
  const saison = { id: 'LOT-S', name: 'Saison de ferme', style: 'Saison', volumeL: 50, brewDate: '', plannedBrewDate: '10.11.2026', status: 'planifie', recipeSnapshot: { fermentation: etapes(21, 14) } } as unknown as Batch;
  const port = (docs: Map<string, Record<string, unknown>>) => ({
    lire: (_c: string, id: string) => docs.get(id),
    patcher: (_c: string, id: string, patch: Record<string, unknown>) => {
      const d = { ...docs.get(id)! };
      for (const [k, v] of Object.entries(patch)) { if (v === undefined) delete d[k]; else d[k] = v; }
      docs.set(id, d);
    },
    creer: () => undefined, supprimer: () => undefined
  });

  it('au repos : de S47 (18 nov.) à « prête le 23 déc. » ; +7 j : « prête le 30 déc. », fin 30 déc., finPrevue décalée ; Annuler rend le Batch identique', async () => {
    const chose = choseBrassin(saison, JOUR)!;
    /* au repos : la barre dit le temps en cuve, d'aujourd'hui à « prête » */
    expect(chose).toMatchObject({ pasBrassee: true, debut: '2026-11-18', fin: '2026-12-23', pretePrevue: '2026-12-23', brassagePrevu: '2026-11-10', duree: 'pas brassée · prête le 23 déc.' });
    expect(texteDuree(chose)).toBe('pas brassée · prête le 23 déc.');
    /* pendant le geste (le texte en direct que le lot C lit) : la date suit le doigt */
    expect(dureeAllongee(chose, 7, JOUR)).toBe('pas brassée · prête le 30 déc.');
    expect(choseAllongee(chose, 7, JOUR)).toMatchObject({ debut: '2026-11-18', fin: '2026-12-30', pretePrevue: '2026-12-30', duree: 'pas brassée · prête le 30 déc.' });
    /* le lâcher : finPrevue = jour prévu + cycle + 7 (15 déc. + 7 = 22 déc.) */
    const r = bien(allonger(chose, 7, ctx({ aujourdhui: JOUR, batches: [saison] })));
    expect(r.ecritures).toEqual([{ op: 'patch', collection: 'batches', id: 'LOT-S', patch: { finPrevue: '2026-12-22' } }]);
    expect(r.message.texte).toBe('Saison de ferme : pas brassée · prête le 30 déc.');
    /* la chose relue après l'écriture : fin, durée et détail suivent la nouvelle date dite */
    const docs = new Map<string, Record<string, unknown>>([['LOT-S', structuredClone(saison) as unknown as Record<string, unknown>]]);
    const fait = await appliquer(r.ecritures, port(docs));
    const relue = choseBrassin(docs.get('LOT-S') as unknown as Batch, JOUR)!;
    expect(relue).toMatchObject({ debut: '2026-11-18', fin: '2026-12-30', pretePrevue: '2026-12-30', duree: 'pas brassée · prête le 30 déc.' });
    expect(relue.detail).toBe('pas brassée · brassage prévu le 10 nov. · prête le 30 déc. au plus tôt');
    expect(`${relue.duree} ${relue.detail}`).not.toContain('23 déc.');
    /* Annuler : le Batch d'avant, à l'identique, et la chose redit 23 déc. */
    await fait.annuler();
    expect(docs.get('LOT-S')).toEqual(saison);
    expect(choseBrassin(docs.get('LOT-S') as unknown as Batch, JOUR)!.fin).toBe('2026-12-23');
    /* le jalon de fin (même geste par le jalon) dit la même date */
    const parJalon = bien(deplacer({ ...chose, jalons: [...(chose.jalons ?? []), { id: 'conditionnement', libelle: 'Conditionnement', jour: '2026-12-23', ecart: 35, glissable: 'fin' }] }, 1, ctx({ aujourdhui: JOUR, batches: [saison] }), 'conditionnement'));
    expect(parJalon.message.texte).toBe('Saison de ferme : pas brassée · prête le 30 déc.');
  });

  it('raccourcir : −7 j, « prête le 16 déc. » ; trop court : refus avec sa raison ; sans cycle connu : refus, jamais un geste sans effet', () => {
    const chose = choseBrassin(saison, JOUR)!;
    const court = bien(allonger(chose, -7, ctx({ aujourdhui: JOUR, batches: [saison] })));
    expect(court.message.texte).toBe('Saison de ferme : pas brassée · prête le 16 déc.');
    expect(court.ecritures).toEqual([{ op: 'patch', collection: 'batches', id: 'LOT-S', patch: { finPrevue: '2026-12-08' } }]);
    const trop = allonger(chose, -35, ctx({ aujourdhui: JOUR, batches: [saison] }));
    expect(trop).toMatchObject({ ok: false, raison: 'Un brassin dure au moins un jour : tire moins loin.' });
    /* sans recette datée ni finPrevue : la barre est aujourd'hui seul, le bord refuse en le disant, avec le chemin vers la fiche */
    const sans = { ...saison, recipeSnapshot: undefined } as unknown as Batch;
    const c = choseBrassin(sans, JOUR)!;
    expect(c).toMatchObject({ debut: JOUR, fin: JOUR, duree: 'pas brassée · prévue le 10 nov.' });
    expect(choseAllongee(c, 7, JOUR)).toBe(c);
    const refus = allonger(c, 7, ctx({ aujourdhui: JOUR, batches: [sans] }));
    expect(refus.ok).toBe(false);
    if (refus.ok) return;
    expect(refus.raison).toBe('Sa recette ne dit pas combien de jours il reste en cuve : sa fin se règle dans la fiche du brassin.');
    expect(refus.message.lien).toMatchObject({ texte: 'Ouvrir le brassin ›', ancre: 'brassin' });
    expect(refus.ouvrir).toEqual({ ecran: 'brassin', id: 'LOT-S' });
  });
});

describe('CRITIQUE-9 n° 6 et n° 8 : glisser et dupliquer un brassin disent leur effet sur la caisse (E28, E31, A6)', () => {
  /* Saison planifiée le 10 nov. (S46, passée : ses sorties sont ramenées au 16 nov.), 28 j en cuve ; budget −137 : courses −92, emballage −45 */
  const saison = { id: 'LOT-S', name: 'Saison de ferme', style: 'Saison', volumeL: 50, brewDate: '', plannedBrewDate: '10.11.2026', status: 'planifie', recipeSnapshot: { fermentation: etapes(14, 14) } } as unknown as Batch;
  const sorties = (chose: ChoseCalendrier, lignes: Array<[string, string, number]>) => courbeCaisse({
    depart: 506400, lundi0: AUJOURDHUI, mouvements: lignes.map(([poste, jour, centimes]) => ({ id: `brew:${chose.source.genre === 'batch' ? chose.source.id : ''}:${poste}`, jour, centimes, nom: chose.titre, choseId: chose.id }))
  })!;
  const effetSeul = /^S\d+ : −?[\d’\s]+ → −?[\d’\s]+$/;

  /* En ligne 1, n° 4 (18.11) : le bandeau dit l'effet sur le chiffre clé (4 927, creux de S50 en S1), plus « S47 : 4 972 → 5 064 » ; il ne
     redit toujours pas le trajet du brassin (« Saison de ferme : S47 → S51 ») ; l'effet de la semaine reste celui de A6 */
  it('n° 6 : glisser un brassin budgété, affiché en S47, de 4 colonnes dit son effet sur le chiffre clé, sans le trajet du brassin ; chaque sortie suit sa propre date', () => {
    const chose = choseBrassin(saison, AUJOURDHUI)!;
    const courbe = sorties(chose, [['achats', '2026-11-16', -9200], ['emballage', '2026-12-07', -4500]]);
    const r = bien(deplacer(chose, 4, ctx({ batches: [saison], courbe })));
    expect(r.effet?.texte).toMatch(effetSeul);
    expect(r.message.texte).not.toMatch(/S47 → S51/);
    expect(r.message.texte).toBe('Saison de ferme · À dépenser 4 927 : creux S50 → S1');
    expect(r.effet).toMatchObject({ numero: 47, avant: 497200, apres: 506400 });
    /*
     * CRITIQUE-10 n° 1 : la barre est affichée en S47 (aujourd'hui) ; 4 colonnes plus loin, c'est le lundi de S51, 14 déc. (jamais 10 nov. + 28 j =
     * 8 déc., S50). Courses le 7 déc. (J − 7), emballage le 4 janv. (prête le 11 janv. − 7 j), pas un bloc décalé de 28 j depuis le 16 nov.
     */
    expect(r.courbeApres!.mouvements.filter(m => m.choseId === chose.id).map(m => [m.id, m.jour])).toEqual([['brew:LOT-S:achats', '2026-12-07'], ['brew:LOT-S:emballage', '2027-01-04']]);
    expect(r.ecritures).toEqual([{ op: 'patch', collection: 'batches', id: 'LOT-S', patch: rescheduleBatchPatch(saison, '2026-12-14') }]);
  });

  it('n° 6 : un brassin sans budget (le libre ne bouge pas) garde le nom et le trajet, depuis la semaine affichée (S47), jamais S46', () => {
    const chose = choseBrassin(saison, AUJOURDHUI)!;
    const r = bien(deplacer(chose, 4, ctx({ batches: [saison], courbe: courbeCaisse({ depart: 506400, lundi0: AUJOURDHUI, mouvements: [] })! })));
    expect(r.effet).toBeNull();
    expect(r.message.texte).toBe('Saison de ferme : S47 → S51');
  });

  it('n° 8 : dupliquer un brassin budgété en S53 entre son budget dans la courbe : « Dupliquée · S52 : a → b », effet rempli pour le menu', () => {
    const b = blonde();
    const chose = choseBrassin(b, AUJOURDHUI)!;
    const courbe = sorties(chose, [['achats', '2026-12-01', -9200], ['frais', '2026-12-08', -4500]]);
    const d = bien(dupliquer(chose, '2026-12-28', ctx({ batches: [b], courbe })));
    expect(d.effet?.texte).toMatch(/^S\d+ : /);
    expect(d.effet).toMatchObject({ numero: 52 });
    /* CRITIQUE-10 n° 5 : S52 n'est pas la semaine de la copie (S53) : l'effet nomme sa cause */
    expect(d.effetMots).toBe(`courses ${d.effet!.texte}`);
    expect(d.message.texte).toBe(`Dupliquée en S53 · courses ${d.effet!.texte}`);
    /* la copie : courses le 21 déc. (J − 7), frais le 28 déc. ; l'original ne bouge pas */
    expect(d.courbeApres!.mouvements.filter(m => m.choseId === `${chose.id}~copie`).map(m => [m.jour, m.centimes])).toEqual([['2026-12-21', -9200], ['2026-12-28', -4500]]);
    expect(d.courbeApres!.mouvements.filter(m => m.choseId === chose.id)).toEqual(courbe.mouvements);
    expect(d.ecritures[0]).toMatchObject({ op: 'creer', collection: 'batches', document: { plannedBrewDate: '2026-12-28', status: 'planifie' } });
  });

  it('CRITIQUE-10 n° 5 : l’effet tombe sur une autre semaine que la copie (les courses à J − 7) : il nomme sa cause, « courses S52 : a → b »', () => {
    const b = blonde();
    const chose = choseBrassin(b, AUJOURDHUI)!;
    const courbe = sorties(chose, [['achats', '2026-12-01', -9200], ['frais', '2026-12-08', -4500]]);
    const d = bien(dupliquer(chose, '2026-12-28', ctx({ batches: [b], courbe })));
    expect(d.effet).toMatchObject({ numero: 52 });
    expect(d.effetMots).toBe(`courses ${d.effet!.texte}`);
    expect(d.effetMots).toMatch(/^courses S52 : [\d’\s]+ → [\d’\s]+$/);
    expect(d.message.texte).toBe(`Dupliquée en S53 · ${d.effetMots}`);
  });

  it('CRITIQUE-10 n° 5 : l’effet tombe dans la semaine de la copie (frais au jour du brassage) : l’effet seul, la semaine dite une fois', () => {
    const b = blonde();
    const chose = choseBrassin(b, AUJOURDHUI)!;
    const courbe = sorties(chose, [['frais', '2026-12-08', -4500]]);
    const d = bien(dupliquer(chose, '2026-12-28', ctx({ batches: [b], courbe })));
    expect(d.effet).toMatchObject({ numero: 53 });
    expect(d.effetMots).toBe(d.effet!.texte);
    expect(d.message.texte).toBe(`Dupliquée · ${d.effet!.texte}`);
  });

  it('n° 8 : un brassin sans budget dit « coût à venir », jamais un 0 ni une flèche inventée', () => {
    const b = blonde();
    const chose = choseBrassin(b, AUJOURDHUI)!;
    const d = bien(dupliquer(chose, '2026-12-28', ctx({ batches: [b], courbe: courbeCaisse({ depart: 506400, lundi0: AUJOURDHUI, mouvements: [] })! })));
    expect(d.effet).toBeNull();
    expect(d.effetMots).toBe('coût à venir');
    expect(d.message.texte).toBe('Dupliquée en S53 · coût à venir');
    expect(d.message.texte).not.toMatch(/→|(^|\s)0(\s|$)/);
  });
});

describe('CRITIQUE-10 n° 1 (E28, D-46, D-189) : un brassin pas brassé, jour prévu passé, va où on le lâche', () => {
  const JOUR = '2026-11-18';
  /* prévue le 10 nov. (S46, passé, pas brassée), cycle de 28 j : affichée d'aujourd'hui (S47) à « prête » */
  const saison = { id: 'LOT-S', name: 'Saison de ferme', style: 'Saison', volumeL: 50, brewDate: '', plannedBrewDate: '10.11.2026', status: 'planifie', recipeSnapshot: { fermentation: etapes(14, 14) } } as unknown as Batch;
  const port = (docs: Map<string, Record<string, unknown>>) => ({
    lire: (_c: string, id: string) => docs.get(id),
    patcher: (_c: string, id: string, patch: Record<string, unknown>) => {
      const d = { ...docs.get(id)! };
      for (const [k, v] of Object.entries(patch)) { if (v === undefined) delete d[k]; else d[k] = v; }
      docs.set(id, d);
    },
    creer: () => undefined, supprimer: () => undefined
  });
  const ecrite = (r: Resolution) => {
    if (!r.ok) throw new Error(`refus : ${r.raison}`);
    const e = r.ecritures[0];
    return e.op === 'patch' ? isoDate(String(e.patch.plannedBrewDate)) : null;
  };

  it('+1 colonne : écrit le lundi de S48 (23 nov.), la date de la bulle ; prête le 21 déc. ; le trajet part de S47, jamais de S46 ; Annuler rend le Batch identique', async () => {
    const chose = choseBrassin(saison, JOUR)!;
    expect(chose).toMatchObject({ pasBrassee: true, debut: JOUR });
    const r = bien(deplacer(chose, 1, ctx({ aujourdhui: JOUR, batches: [saison] })));
    expect(ecrite(r)).toBe('2026-11-23');
    expect(r.ecritures).toEqual([{ op: 'patch', collection: 'batches', id: 'LOT-S', patch: rescheduleBatchPatch(saison, '2026-11-23') }]);
    expect(r.message.texte).toBe('Saison de ferme : S47 → S48');
    expect(r.message.lecture).not.toContain('S46');
    const docs = new Map<string, Record<string, unknown>>([['LOT-S', structuredClone(saison) as unknown as Record<string, unknown>]]);
    const fait = await appliquer(r.ecritures, port(docs));
    const relue = choseBrassin(docs.get('LOT-S') as unknown as Batch, JOUR)!;
    /* relue : planifiée en S48, plus « pas brassée », prête le 21 déc. (23 nov. + 28 j) */
    expect(relue.pasBrassee).toBeUndefined();
    expect(relue).toMatchObject({ debut: '2026-11-23', preteLe: '2026-12-21' });
    expect(relue.duree).toContain('prête 21 déc.');
    await fait.annuler();
    expect(docs.get('LOT-S')).toEqual(saison);
  });

  it('+4 colonnes : lundi de S51 (14 déc.) ; le jalon de brassage glissé dit la même date', () => {
    const chose = choseBrassin(saison, JOUR)!;
    expect(ecrite(deplacer(chose, 4, ctx({ aujourdhui: JOUR, batches: [saison] })))).toBe('2026-12-14');
    expect(ecrite(deplacer(chose, 4, ctx({ aujourdhui: JOUR, batches: [saison] }), 'brassage'))).toBe('2026-12-14');
  });

  it('−1 colonne : le passé, refus avec sa raison, aucune écriture', () => {
    const chose = choseBrassin(saison, JOUR)!;
    const r = deplacer(chose, -1, ctx({ aujourdhui: JOUR, batches: [saison] }));
    expect(r.ok).toBe(true); /* CAL-PASSE (20.11) : le passé se replanifie, le refus est levé */
    expect('ecritures' in r).toBe(true);
  });

  it('finPrevue écrite (bord tiré) : elle suit le vrai décalage du jour de brassage (10 nov. → 23 nov., +13 j), la longueur reste', () => {
    const tiree = { ...saison, finPrevue: '2026-12-15' } as Batch;
    const r = bien(deplacer(choseBrassin(tiree, JOUR)!, 1, ctx({ aujourdhui: JOUR, batches: [tiree] })));
    expect(r.ecritures).toEqual([{ op: 'patch', collection: 'batches', id: 'LOT-S', patch: { ...rescheduleBatchPatch(tiree, '2026-11-23'), finPrevue: '2026-12-28' } }]);
  });

  it('un brassin planifié dans le futur garde « prévu + n semaines » et son jour : mercredi 2 déc. +1 → mercredi 9 déc. ; −3 (S46) : refus', () => {
    const futur = { ...saison, plannedBrewDate: '02.12.2026' } as Batch;
    const chose = choseBrassin(futur, JOUR)!;
    expect(chose.pasBrassee).toBeUndefined();
    const r = bien(deplacer(chose, 1, ctx({ aujourdhui: JOUR, batches: [futur] })));
    expect(ecrite(r)).toBe('2026-12-09');
    expect(r.message.texte).toBe('Saison de ferme : S49 → S50');
    expect(ecrite(deplacer(chose, -2, ctx({ aujourdhui: JOUR, batches: [futur] })))).toBe('2026-11-18');
    expect(deplacer(chose, -3, ctx({ aujourdhui: JOUR, batches: [futur] })).ok).toBe(true); /* CAL-PASSE (20.11) */
  });

  it('Dupliquer la Saison pas brassée en S48 : la copie au lundi de S48 (23 nov.), planifiée', () => {
    const chose = choseBrassin(saison, JOUR)!;
    const d = bien(dupliquer(chose, '2026-11-23', ctx({ aujourdhui: JOUR, batches: [saison] })));
    expect(d.ecritures[0]).toMatchObject({ op: 'creer', collection: 'batches', document: { plannedBrewDate: '2026-11-23', status: 'planifie' } });
    expect(d.message.texte).toBe('Dupliquée en S48');
  });
});

describe('CRITIQUE-10 n° 5 : sur le banc servi, « Dupliquer en S48 » de la Blonde nomme la cause de l’effet en S47', () => {
  const J = '2026-11-18';
  const profil: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, historyCompleteFrom: '2026-01-01', openingCash: { date: '2026-01-01', amountCents: 403200 + 6 * 65000, confirmed: true } };

  it('la copie est brassée le 23 nov. (S48), ses courses à J − 7 tombent le 16 nov., passé, donc aujourd’hui (S47) : « courses S47 : a → b »', () => {
    const b = avecTendance(etatBanc(J), J);
    const banc: EntreesModele = {
      aujourdhui: J, transactions: b.transactions, payments: b.paiements ?? [], plans: b.plans, profile: profil,
      assets: [], batches: b.batches, stockItems: [] as StockItem[], items: b.items, recettes: b.recettes, reglages: b.reglages ?? REGLAGES_VIDES, lignesCourses: b.lignesCourses ?? []
    };
    const modele = construireModele(banc);
    /* le chemin de l'onglet (CalendrierTab) : les choses prêtes (budget rattaché au brassin), puis la courbe rattachée à elles */
    const prets = preparerChoses(modele.choses, { brassins: new Map(b.batches.map(x => [x.id, x.name || x.id])) });
    const courbe = alignerCourbe(modele.courbe, prets);
    const chose = prets.find(c => c.source.genre === 'batch' && c.source.id === 'LOT-BLONDE')!;
    const d = bien(dupliquer(chose, '2026-11-23', ctx({ aujourdhui: J, batches: b.batches, plans: b.plans, courbe })));
    const copies = d.courbeApres!.mouvements.filter(m => m.choseId === `${chose.id}~copie`).map(m => [m.id.replace(/~copie$/, ''), m.jour, m.centimes]);
    expect(copies.find(([id]) => String(id).endsWith(':achats'))?.[1]).toBe(J);
    expect(d.effet).toMatchObject({ numero: 47 });
    expect(d.effetMots).toBe(`courses ${d.effet!.texte}`);
    expect(d.message.texte).toBe(`Dupliquée en S48 · courses ${d.effet!.texte}`);
  });
});

describe('CRITIQUE-11 n° 5 (E32, D-193) : Livrer dit la semaine de la date livrée quand elle n’est pas celle de l’effet', () => {
  const vente = (date: string) => plan({ id: 'PV', title: '3 fûts La Cigogne', direction: 'in', batchId: 'LOT-5', date, amountCents: 90000 });
  const courbeVente = (date: string) => courbeCaisse({
    depart: 175400, lundi0: AUJOURDHUI,
    mouvements: [{ id: `PV:${date}`, jour: date, centimes: 90000, nom: '3 fûts La Cigogne', choseId: 'argent-PV' }]
  })!;
  const promesse = (jourPromis: string, livrerLe: string) => ({ planId: 'PV', titre: '3 fûts La Cigogne', jourPromis, preteLe: livrerLe, livrerLe, texte: '' });

  it('promise le 23 déc. (S52), livrée le 29 déc. (S53) : « 29 déc. (S53) · S52 : a → b », jamais « 29 déc. · S52 »', () => {
    const l = bien(livrer(promesse('2026-12-23', '2026-12-29'), ctx({ plans: [vente('2026-12-23')], courbe: courbeVente('2026-12-23') })));
    expect(l.effet).toMatchObject({ numero: 52 });
    expect(l.message.texte).toBe(`3 fûts La Cigogne : 29 déc. (S53) · ${l.effet!.texte}`);
    expect(l.message.lecture).toMatch(/^3 fûts La Cigogne : 29 déc\. \(S53\) · S52 : [\d\s]+ → [\d\s]+ · Annuler$/u);
  });

  it('livrée plus tôt, dans la semaine de l’effet (S53) : la semaine n’est dite qu’une fois (A6)', () => {
    const l = bien(livrer(promesse('2027-01-05', '2026-12-29'), ctx({ plans: [vente('2027-01-05')], courbe: courbeVente('2027-01-05') })));
    expect(l.effet).toMatchObject({ numero: 53 });
    expect(l.message.texte).toBe(`3 fûts La Cigogne : 29 déc. · ${l.effet!.texte}`);
    expect(l.message.texte.match(/S53/g)).toHaveLength(1);
  });
});

describe('CRITIQUE-11 n° 4 (E31, D-48, D-192) : Dupliquer et Retirer une fête ou une activité disent leur effet, sans flèche ni 0 inventés', () => {
  /* la courbe de la prévision : `buildForecast` ne lit pas le carnet ; une fête n'y a aucun mouvement */
  const courbe = () => courbeCaisse({ depart: 506400, lundi0: AUJOURDHUI, mouvements: [] })!;
  const noel = (p: Partial<CreativeItem> = {}): CreativeItem => ({ id: 'CR-NOEL', type: 'event', title: 'Marché de Noël', status: 'todo', date: '2026-12-21', ...p });

  it('CRITIQUE-12 n° 2 : le Marché de Noël (1 180 estimés, hors de Finances) : « recette estimée 1 180 · ne change pas la courbe (pas dans Finances) », jamais l’ancien « hors … prévision »', () => {
    const chose = choseCreative(noel({ estimatedRevenue: 1180 }))!;
    expect(chose.centimes).toBe(118000);
    const d = bien(dupliquer(chose, '2026-12-28', ctx({ courbe: courbe() })));
    const r = bien(retirer(chose, ctx({ courbe: courbe() })));
    for (const x of [d, r]) {
      expect(x.effet).toBeNull();
      expect(x.effetMots).toBe('recette estimée 1 180 · ne change pas la courbe (pas dans Finances)');
      expect(x.effetMots).not.toMatch(/hors\sprévision|→|\b0\b/);
    }
    /* sans courbe (solde de départ inconnu) : pas de courbe à ne pas changer ; le montant, et qu'il n'est pas dans Finances */
    expect(bien(retirer(chose, ctx())).effetMots).toBe('recette estimée 1 180 · pas dans Finances');
  });

  it('une fête sans montant : « sans montant », jamais « 0 »', () => {
    const chose = choseCreative(noel())!;
    expect(chose.centimes).toBeUndefined();
    expect(bien(dupliquer(chose, '2026-12-28', ctx({ courbe: courbe() }))).effetMots).toBe('sans montant');
    expect(bien(retirer(chose, ctx({ courbe: courbe() }))).effetMots).toBe('sans montant');
  });

  it('une activité : sans montant, « sans montant » ; avec un coût estimé, « coût estimé 300 · ne change pas la courbe (pas dans Finances) »', () => {
    const activite = choseCreative({ id: 'CR-RANGER', type: 'event', title: 'Ranger la réserve', status: 'todo', date: '2026-11-23', activite: true } as CreativeItem)!;
    expect(activite.rangee).toBe('activites');
    expect(bien(retirer(activite, ctx({ courbe: courbe() }))).effetMots).toBe('sans montant');
    expect(bien(dupliquer(activite, '2026-11-30', ctx({ courbe: courbe() }))).effetMots).toBe('sans montant');
    const payante = choseCreative({ id: 'CR-NETT', type: 'event', title: 'Nettoyage', status: 'todo', date: '2026-11-23', activite: true, estimatedCost: 300 } as CreativeItem)!;
    expect(bien(retirer(payante, ctx({ courbe: courbe() }))).effetMots).toBe('coût estimé 300 · ne change pas la courbe (pas dans Finances)');
  });

  it('une chose que la courbe compte garde son effet chiffré (« S51 : a → b »), sans mots', () => {
    const { courbe: c, chose, p } = courbeMalt();
    const r = bien(retirer(chose, ctx({ plans: [p], courbe: c })));
    expect(r.effet?.texte).toMatch(/^S52 : /);
    expect(r.effetMots).toBeUndefined();
  });
});
