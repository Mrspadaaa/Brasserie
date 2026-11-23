import { describe, expect, it } from 'vitest';
import type { FinanceTransaction, FinancialPayment, FinancialPlan, FinancialProfile, TransactionFinance } from '../../src/domain/finance/types';
import { budgetAnalyse, cascade, escalierCaisse, fenetreDe, fournisseursDe, graduations, placerEtiquettes, plageDeFenetre, pourquoiDepasse, serieFiltre, soldeAvant, tuilesAnnee, type EntreeAnalyse } from '../../src/domain/finance/analyse';

// Fixture : un solde de 2 000,00 confirmé le 01.09, un loyer prévu de 400, un brassage prévu de 150, des paiements réels en septembre et octobre.
const AUJ = '2026-11-10';
const tx = (id: string, description: string, cents: number, category: string, date: string, finance: Partial<TransactionFinance> = {}): FinanceTransaction => ({
  id, description, date, category: category as never, subcategory: '', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: category === 'recettes' ? 'income' : 'expense', amountCents: cents, lines: [], paymentStatus: 'paid', ...finance },
});
const pai = (t: FinanceTransaction, date = t.date): FinancialPayment => ({ id: `P-${t.id}`, transactionId: t.id, date, amountCents: t.finance!.amountCents, direction: t.finance!.kind === 'income' ? 'in' : 'out', method: 'bank', recordedAt: `${date}T10:00:00Z` });
const plan = (id: string, title: string, cents: number, category: string, date: string, extra: Partial<FinancialPlan> = {}): FinancialPlan =>
  ({ id, title, date, amountCents: cents, direction: 'out', category: category as never, source: 'recurring', status: 'active', createdAt: '2026-01-01', ...extra });
const profil = (openingCash?: FinancialProfile['openingCash']): FinancialProfile => ({ id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified', openingCash });

const vente = tx('V1', 'Café du Bourg', 54000, 'recettes', '2026-10-22');
const loyer = tx('L1', 'Loyer', 40000, 'chargesFixes', '2026-10-25', { planId: 'PL', occurrenceId: 'PL:2026-10-25' });
const houblons = tx('H1', 'Houblons', 9000, 'brassage', '2026-11-03', { vendor: 'Comptoir' });
const ingredients = tx('I1', 'Ingrédients', 14000, 'brassage', '2026-10-12', { planId: 'PB', vendor: 'Comptoir' });
const joints = tx('J1', 'Joints de cuve', 2860, 'materiel', '2026-10-30');
const transactions = [vente, loyer, houblons, ingredients, joints];
const payments = transactions.map(t => pai(t));
const plans = [plan('PL', 'Loyer', 40000, 'chargesFixes', '2026-09-25', { recurrence: { frequency: 'monthly' } }), plan('PB', 'Brassage', 15000, 'brassage', '2026-10-12')];
const base: EntreeAnalyse = { transactions, payments, plans, profile: profil({ date: '2026-09-01', amountCents: 200000, confirmed: true }), aujourdhui: AUJ };
const sans = (patch: Partial<EntreeAnalyse>): EntreeAnalyse => ({ ...base, ...patch });

describe('analyse : fenêtres', () => {
  it('30 j finit aujourd\'hui, jour compris', () => expect(fenetreDe('30j', AUJ)).toEqual({ du: '2026-10-12', au: AUJ }));
  it('12 mois commence le 1er du mois d\'il y a 11 mois', () => expect(fenetreDe('12mois', AUJ)).toEqual({ du: '2025-12-01', au: AUJ }));
  it('la plage de mois suit la fenêtre', () => expect(plageDeFenetre({ du: '2026-10-12', au: AUJ })).toEqual({ du: '2026-10', au: '2026-11' }));
});

describe('analyse : le solde', () => {
  it('le solde avant un jour = départ + paiements avant ce jour', () => expect(soldeAvant(base, '2026-10-26')).toBe(200000 + 54000 - 40000 - 14000));
  it('sans solde confirmé : null, jamais 0', () => expect(soldeAvant(sans({ profile: profil({ date: '2026-09-01', amountCents: 200000, confirmed: false }) }), '2026-10-26')).toBeNull());
  it('solde daté après le jour : null', () => expect(soldeAvant(base, '2026-08-01')).toBeNull());
});

describe('analyse : l\'escalier de caisse', () => {
  const esc = escalierCaisse(base, { du: '2026-10-12', au: AUJ });
  it('chaque paiement est une marche, le cumul part du solde au début', () => {
    expect(esc.connu).toBe(true);
    expect(esc.debutCents).toBe(200000);
    expect(esc.marches.map(m => m.id)).toEqual(['P-I1', 'P-V1', 'P-L1', 'P-J1', 'P-H1']);
    expect(esc.marches.at(-1)!.apres).toBe(200000 - 14000 + 54000 - 40000 - 2860 - 9000);
    expect(esc.finCents).toBe(esc.marches.at(-1)!.apres);
    expect(esc.ecartCents).toBe(esc.finCents! - 200000);
  });
  it('le prévu d\'une marche = son plan ; une marche sans plan est « pas prévu » quand il y a un prévu', () => {
    expect(esc.marches.find(m => m.id === 'P-L1')!.prevuCents).toBe(-40000);
    expect(esc.marches.find(m => m.id === 'P-H1')!.pasPrevu).toBe(true);
    expect(esc.marches.find(m => m.id === 'P-L1')!.pasPrevu).toBe(false);
    expect(esc.pasPrevu.map(m => m.id)).toContain('P-H1');
  });
  it('le prévu suit les plans de la fenêtre (loyer d\'octobre et de novembre, brassage)', () => {
    expect(esc.prevu!.flux.map(x => x.id)).toEqual(['PB:2026-10-12', 'PL:2026-10-25']);
    expect(esc.prevu!.finCents).toBe(200000 - 15000 - 40000);
  });
  it('un plan déjà payé (completed) reste le prévu de sa période ; un plan annulé ou brouillon n\'y est pas', () => {
    const e = escalierCaisse(sans({ plans: [plan('PL', 'Loyer', 40000, 'chargesFixes', '2026-10-25', { status: 'completed' }), plan('PX', 'Annulé', 9000, 'autres', '2026-10-20', { status: 'cancelled' }), plan('PD', 'Brouillon', 9000, 'autres', '2026-10-21', { status: 'draft' })] }), { du: '2026-10-12', au: AUJ });
    expect(e.prevu!.flux.map(x => x.id)).toEqual(['PL:2026-10-25']);
  });
  it('la pire baisse est la plus grosse sortie', () => expect(esc.pireBaisse!.id).toBe('P-L1'));
  it('sans plan : prévu null (rien de prévu) et rien n\'est « pas prévu »', () => {
    const e = escalierCaisse(sans({ plans: [] }), { du: '2026-10-12', au: AUJ });
    expect(e.prevu).toBeNull(); expect(e.pasPrevu).toEqual([]);
  });
  it('sans solde confirmé : on parle d\'écart, la caisse est inconnue', () => {
    const e = escalierCaisse(sans({ profile: profil({ date: '2026-09-01', amountCents: 200000, confirmed: false }) }), { du: '2026-10-12', au: AUJ });
    expect(e.connu).toBe(false); expect(e.debutCents).toBeNull(); expect(e.finCents).toBeNull();
    expect(e.ecartCents).toBe(-14000 + 54000 - 40000 - 2860 - 9000);
  });
  it('une fenêtre avant la première écriture est rognée : « depuis le … »', () => {
    const e = escalierCaisse(base, { du: '2026-01-01', au: AUJ });
    expect(e.depuis).toBe('2026-09-01'); expect(e.du).toBe('2026-09-01');
  });
  it('2025 : rien noté si aucun paiement l\'an dernier (null, pas 0)', () => {
    expect(esc.anDernier.finCents).toBeNull(); expect(esc.anDernier.ecartCents).toBeNull(); expect(esc.anDernier.nombre).toBe(0);
  });
  it('2025 : le même jour l\'an dernier, avec son solde si le départ le couvre', () => {
    const an = tx('A1', 'Vente 2025', 30000, 'recettes', '2025-10-20');
    const e = escalierCaisse(sans({ transactions: [...transactions, an], payments: [...payments, pai(an)], profile: profil({ date: '2025-01-01', amountCents: 100000, confirmed: true }) }), { du: '2026-10-12', au: AUJ });
    expect(e.anDernier.ecartCents).toBe(30000); expect(e.anDernier.finCents).toBe(130000); expect(e.anDernier.points[0].date).toBe('2026-10-20');
  });
  it('un paiement inconnu (pièce sans paiement noté) est compté comme incertain', () => {
    const inc = tx('X1', 'Achat sans paiement', 5000, 'brassage', '2026-10-20', { paymentStatus: 'unknown' });
    expect(escalierCaisse(sans({ transactions: [...transactions, inc] }), { du: '2026-10-12', au: AUJ }).incertains).toEqual(['X1']);
  });
  it('une pièce annulée n\'entre pas dans l\'escalier', () => {
    const annulee = { ...houblons, finance: { ...houblons.finance!, voidedAt: '2026-11-04T10:00:00Z' } };
    expect(escalierCaisse(sans({ transactions: [vente, loyer, annulee, ingredients, joints] }), { du: '2026-10-12', au: AUJ }).marches.map(m => m.id)).not.toContain('P-H1');
  });
});

describe('analyse : la cascade des sources', () => {
  const c = cascade(base, { du: '2026-09', au: '2026-11' });
  it('ventes, sources et matériel viennent de periodeSynthese, matériel à part', () => {
    expect(c.ventesCents).toBe(54000);
    expect(c.lignes.find(l => l.source === 'brassage')!.reelCents).toBe(23000);
    expect(c.lignes.find(l => l.source === 'chargesFixes')!.reelCents).toBe(40000);
    expect(c.materielCents).toBe(2860);
  });
  it('le prévu est celui des plans ; le dépassement est dit', () => {
    const l = c.lignes.find(x => x.source === 'chargesFixes')!;
    expect(l.prevuCents).toBe(120000); expect(l.depasseCents).toBe(0);
    expect(c.lignes.find(x => x.source === 'nettoyage')).toBeUndefined();
  });
  it('un brassage au-delà du prévu est le plus gros dépassement', () => {
    const e = cascade(sans({ plans: [plan('PB', 'Brassage', 15000, 'brassage', '2026-10-12')] }), { du: '2026-10', au: '2026-11' });
    expect(e.plusGrosDepassement!.source).toBe('brassage'); expect(e.plusGrosDepassement!.depasseCents).toBe(23000 - 15000);
  });
  it('la caisse de fin se rattache à celle du début : l\'écart est dit, jamais caché', () => {
    const e = cascade(base, { du: '2026-10', au: '2026-11' });
    const sorties = e.lignes.reduce((n, l) => n + l.reelCents, 0);
    expect(e.debutCents! + e.ventesCents - sorties - e.materielCents + e.autresMouvementsCents!).toBe(e.finCents);
  });
  it('sans solde confirmé : début et fin sont null, le gagné reste', () => {
    const e = cascade(sans({ profile: profil() }), { du: '2026-10', au: '2026-11' });
    expect(e.debutCents).toBeNull(); expect(e.finCents).toBeNull(); expect(e.autresMouvementsCents).toBeNull(); expect(e.gagneCents).toBe(54000 - 23000 - 40000);
  });
  it('sans plan : aPrevu faux, prévu null par source', () => {
    const e = cascade(sans({ plans: [] }), { du: '2026-10', au: '2026-11' });
    expect(e.aPrevu).toBe(false); expect(e.lignes.every(l => l.prevuCents === null)).toBe(true);
  });
});

describe('analyse : le budget', () => {
  it('une règle par source, réel contre prévu', () => {
    const b = budgetAnalyse(sans({ plans: [plan('PB', 'Brassage', 15000, 'brassage', '2026-10-12')] }), { du: '2026-10', au: '2026-11' });
    const r = b.regles.find(x => x.source === 'brassage')!;
    expect(r.reelCents).toBe(23000); expect(r.prevuCents).toBe(15000); expect(r.ecartCents).toBe(8000); expect(r.depasse).toBe(true);
    expect(b.depenseCents).toBe(63000); expect(b.depenseComparableCents).toBe(23000); expect(b.prevuDepenseCents).toBe(15000);
  });
  it('sans prévu pour une source : prévu null, pas de dépassement', () => {
    const r = budgetAnalyse(base, { du: '2026-10', au: '2026-11' }).regles.find(x => x.source === 'chargesFixes')!;
    expect(r.prevuCents).toBe(80000); // octobre et novembre
    const sansPlan = budgetAnalyse(sans({ plans: [] }), { du: '2026-10', au: '2026-11' });
    expect(sansPlan.aPrevu).toBe(false); expect(sansPlan.prevuDepenseCents).toBeNull(); expect(sansPlan.regles.every(x => x.prevuCents === null && !x.depasse)).toBe(true);
  });
  it('les mois comparés : ceux qui ont un prévu ; « au-delà » : dépensé > prévu', () => {
    const b = budgetAnalyse(sans({ plans: [plan('PB', 'Brassage', 10000, 'brassage', '2026-10-12')] }), { du: '2026-10', au: '2026-11' });
    expect(b.moisComptes).toBe(1); expect(b.moisAuDela).toBe(1);
  });
  it('un brassin : prévu (plan brew) → réel (pièces rattachées)', () => {
    const lot = { id: 'B1', name: 'Pale Ale', brewDate: '2026-10-12', status: 'conditionne' } as never;
    const t = tx('BR1', 'Malt', 6000, 'brassage', '2026-10-12', { batchId: 'B1' });
    const b = budgetAnalyse(sans({ batches: [lot], transactions: [t], payments: [pai(t)], plans: [plan('PBR', 'Pale Ale', 5000, 'brassage', '2026-10-12', { source: 'brew', batchId: 'B1' })] }), { du: '2026-10', au: '2026-10' });
    expect(b.brassins).toEqual([{ batchId: 'B1', nom: 'Pale Ale', mois: '2026-10', prevuCents: 5000, reelCents: 6000, ecartCents: 1000, depasse: true }]);
  });
});

describe('analyse : Filtrer', () => {
  it('douze tuiles : gagné ou perdu, à venir pour le futur, null sans pièce', () => {
    const t = tuilesAnnee(base, '2026');
    expect(t).toHaveLength(12);
    expect(t.find(x => x.mois === '2026-10')!.gainCents).toBe(54000 - 14000 - 40000);
    expect(t.find(x => x.mois === '2026-12')!.futur).toBe(true); expect(t.find(x => x.mois === '2026-12')!.gainCents).toBeNull();
    expect(t.find(x => x.mois === '2026-03')!.gainCents).toBeNull();
    expect(t.find(x => x.mois === '2026-10')!.prevuCents).toBe(55000);
  });
  it('la série cumule une source sur la plage, avec son plus lourd mois', () => {
    const s = serieFiltre(base, { plage: { du: '2026-10', au: '2026-11' }, source: 'brassage' });
    expect(s.points.map(p => p.cents)).toEqual([-14000, -9000]); expect(s.totalCents).toBe(-23000);
    expect(s.plusLourd).toEqual({ mois: '2026-10', cents: -14000 });
    expect(s.prevuTotalCents).toBe(-15000); expect(s.depasseCents).toBe(8000);
  });
  it('filtrer par fournisseur et par brassin garde les pièces concernées', () => {
    expect(serieFiltre(base, { plage: { du: '2026-10', au: '2026-11' }, source: 'brassage', fournisseur: 'Comptoir' }).totalCents).toBe(-23000);
    expect(serieFiltre(base, { plage: { du: '2026-10', au: '2026-11' }, fournisseur: 'Inconnu' }).totalCents).toBe(0);
    expect(fournisseursDe(base, { du: '2026-10', au: '2026-11' })).toEqual(['Comptoir']);
  });
  it('sans source : gagné/perdu cumulé ; l\'an dernier est null sans pièce', () => {
    const s = serieFiltre(base, { plage: { du: '2026-10', au: '2026-10' } });
    expect(s.totalCents).toBe(54000 - 14000 - 40000); expect(s.anTotalCents).toBeNull();
  });
});

describe('analyse : ✦ Pourquoi ?', () => {
  it('liste les pièces hors prévu, les plus grosses d\'abord, avec le dépassement', () => {
    const p = pourquoiDepasse(sans({ plans: [plan('PB', 'Brassage', 15000, 'brassage', '2026-10-12')] }), { du: '2026-10', au: '2026-11' })!;
    expect(p.source).toBe('brassage'); expect(p.depasseCents).toBe(8000);
    expect(p.horsPrevu.map(x => x.id)).toEqual(['H1']); expect(p.horsPrevuCents).toBe(9000); expect(p.nombrePieces).toBe(2);
  });
  it('rien ne dépasse : null', () => expect(pourquoiDepasse(base, { du: '2026-10', au: '2026-10' })).toBeNull());
});

describe('analyse : graduations (Heckbert)', () => {
  it('−892,66 à 4 181,60 : un pas de 1 000', () => {
    const g = graduations(-89266, 418160, 6);
    expect(g.pas).toBe(100000); expect(g.bas).toBe(-100000); expect(g.haut).toBe(500000); expect(g.valeurs).toEqual([-100000, 0, 100000, 200000, 300000, 400000, 500000]);
  });
  it('une étendue nulle ne casse pas', () => expect(graduations(5, 5).valeurs).toEqual([5]));
  it('0 à 10 108 : pas de 2 000 ou 5 000, jamais plus de 9 repères', () => {
    const g = graduations(0, 1010800, 5); expect(g.valeurs.length).toBeLessThanOrEqual(9); expect(g.valeurs[0]).toBe(0); expect(g.haut).toBeGreaterThanOrEqual(1010800);
  });
});

describe('analyse : placement d\'étiquettes', () => {
  const chevauche = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  it('aucune étiquette ne recouvre une autre, sur 25 sorties', () => {
    const entrees = Array.from({ length: 25 }, (_, i) => ({ id: `e${i}`, x: 20 + (i * 37) % 330, y: 30 + (i * 53) % 400, w: 110, h: 34, priorite: 25 - i }));
    const { placees, reste } = placerEtiquettes(entrees, { w: 370, h: 452 });
    expect(placees.length + reste.length).toBe(25); expect(placees.length).toBeLessThanOrEqual(12);
    for (let i = 0; i < placees.length; i++) for (let j = i + 1; j < placees.length; j++) expect(chevauche(placees[i], placees[j])).toBe(false);
    for (const p of placees) { expect(p.x).toBeGreaterThanOrEqual(0); expect(p.x + p.w).toBeLessThanOrEqual(370); expect(p.y).toBeGreaterThanOrEqual(0); expect(p.y + p.h).toBeLessThanOrEqual(452); }
  });
  it('la priorité forte est servie d\'abord et ce qui ne tient pas va dans « + N »', () => {
    const entrees = [{ id: 'a', x: 100, y: 100, w: 120, h: 40, priorite: 1 }, { id: 'b', x: 100, y: 100, w: 120, h: 40, priorite: 5 }];
    const { placees, reste } = placerEtiquettes(entrees, { w: 200, h: 120 }, [], 1);
    expect(placees.map(p => p.id)).toEqual(['b']); expect(reste).toEqual(['a']);
  });
  it('un obstacle est évité', () => {
    const obstacle = { x: 158, y: 95, w: 80, h: 10 };
    const { placees } = placerEtiquettes([{ id: 'a', x: 150, y: 100, w: 60, h: 20, priorite: 1 }], { w: 300, h: 200 }, [obstacle]);
    expect(placees).toHaveLength(1); expect(chevauche(placees[0], obstacle)).toBe(false); expect(placees[0].position).not.toBe('droite');
  });
});
