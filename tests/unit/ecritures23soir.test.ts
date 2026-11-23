import { describe, expect, it } from 'vitest';
import type { FinanceTransaction, FinancialPayment, FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';
import { semainesDe, choseArgent, type ChoseCalendrier } from '../../src/domain/calendrier';
import { chosesPayees, estAutreEntree } from '../../src/domain/calendrierPaiements';
import { construireModele, type EntreesModele } from '../../src/ui/calendrier/useDonneesCalendrier';
import { pastille, type Colonne } from '../../src/ui/calendrier/frise/Rangee';
import { nomAccessible } from '../../src/ui/calendrier/frise/Marque';
import { planApresRetraitRecurrent } from '../../src/domain/finance/retraitEcriture';
import { libelleEcriture } from '../../src/domain/finance/libelleEcriture';
import { choixParDefaut, planCorrection } from '../../src/domain/finance/correctionMontant';
import { avecGenre, brouillonNeuf, preparer } from '../../src/ui/saisie/modele';

/* Voie ecr-donnees (23.11 soir) : E35-1, 2, 3, 6, 9, 10, 15, 16. Les règles de calcul et de classement, jouées par le modèle du Calendrier lui-même. */

const AUJ = '2026-11-23';
const profil = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, openingCash: { date: '2026-01-01', amountCents: 100_000, confirmed: true } } as FinancialProfile;
const entrees = (plus: Partial<EntreesModele> = {}): EntreesModele => ({ aujourdhui: AUJ, transactions: [], payments: [], plans: [], profile: profil, assets: [], batches: [], stockItems: [], items: [], recettes: [], reglages: REGLAGES_VIDES, ...plus });
const cols = (debut: string, n: number): Colonne[] => semainesDe(debut, n).map(s => ({ debut: s.debut, fin: new Date(Date.parse(`${s.debut}T00:00:00Z`) + 6 * 864e5).toISOString().slice(0, 10), etiquette: `S${s.numero}` }));

/** Une écriture saisie « à la main », écrite par `preparer` comme l'app. */
function saisir(genre: Parameters<typeof avecGenre>[1], plus: Partial<ReturnType<typeof brouillonNeuf>> & { cents: number }, id = `T-${genre}`) {
  const b = { ...avecGenre(brouillonNeuf(AUJ), genre), ...plus };
  return preparer(b, { id, maintenant: `${AUJ}T10:00:00.000Z`, transactions: [], tvaInscrit: false });
}
const payer = (tx: FinanceTransaction, jour: string): FinancialPayment => ({ id: `PAI-${tx.id}`, transactionId: tx.id, date: jour, amountCents: tx.finance!.amountCents, direction: tx.finance!.kind === 'income' || tx.finance!.kind === 'contribution' ? 'in' : 'out', method: 'bank', recordedAt: `${jour}T10:00:00.000Z` });

describe('E35-1 : retirer une écriture qui revient retire sa prévision', () => {
  const ecr = saisir('salaire', { cents: 500, rythme: 'monthly', date: AUJ, nom: 'ZZ TEST — Salaire' });
  const plan = ecr.plan as FinancialPlan;
  const retiree = { ...ecr.transaction, finance: { ...ecr.transaction.finance!, voidedAt: `${AUJ}T11:00:00.000Z` } } as FinanceTransaction;

  it('la saisie écrit bien la pièce et sa prévision (PLAN-<id>)', () => {
    expect(plan.id).toBe(`PLAN-${ecr.transaction.id}`);
    expect(ecr.transaction.finance?.planId).toBe(plan.id);
  });
  it('sans correctif, la prévision d’une pièce retirée reste au Calendrier (le constat)', () => {
    const m = construireModele(entrees({ transactions: [retiree], plans: [plan] }));
    expect(m.choses.some(c => c.titre.includes('Salaire') && (c.centimes ?? 0) < 0)).toBe(true);
  });
  it('la prévision née de la pièce s’annule avec elle ; le Calendrier n’en montre plus rien', () => {
    const apres = planApresRetraitRecurrent(plan, ecr.transaction, [retiree], `${AUJ}T11:00:00.000Z`);
    expect(apres.status).toBe('cancelled');
    const m = construireModele(entrees({ transactions: [retiree], plans: [apres] }));
    expect(m.choses.filter(c => c.titre.includes('Salaire'))).toEqual([]);
  });
  it('une prévision écrite ailleurs, ou qui porte d’autres pièces actives, n’est jamais touchée', () => {
    expect(planApresRetraitRecurrent({ ...plan, id: 'PLAN-autre' }, ecr.transaction, [retiree], 'm')).toEqual({ ...plan, id: 'PLAN-autre' });
    const autre = { ...ecr.transaction, id: 'T-suite', finance: { ...ecr.transaction.finance!, planId: plan.id, voidedAt: undefined } } as FinanceTransaction;
    expect(planApresRetraitRecurrent(plan, ecr.transaction, [retiree, autre], 'm')).toBe(plan);
    expect(planApresRetraitRecurrent({ ...plan, source: 'manual' }, ecr.transaction, [retiree], 'm').status).toBe('active');
  });
});

describe('E35-2, E35-3 : un apport et une autre entrée ne sont pas des ventes', () => {
  const vente = saisir('vente', { cents: 400, date: '2026-11-20', nom: 'Vente test' }, 'T-v');
  const apport = saisir('apport', { cents: 120_000, date: '2026-11-22', nom: 'De ma poche' }, 'T-a');
  const autre = saisir('autrei', { cents: 110, date: '2026-11-21', nom: 'ZZ Autre entrée' }, 'T-o');
  const pieces = [vente, apport, autre].map(e => e.transaction);
  const pays = [payer(vente.transaction, '2026-11-20'), payer(apport.transaction, '2026-11-22'), payer(autre.transaction, '2026-11-21')];

  it('les trois sont des choses de la rangée Ventes ; seuls l’apport et l’autre entrée sont « hors ventes »', () => {
    const m = construireModele(entrees({ transactions: pieces, payments: pays }));
    const v = m.choses.filter(c => c.rangee === 'ventes');
    expect(v.map(c => [c.titre, c.horsVentes ?? null])).toEqual(expect.arrayContaining([['Vente test', null], ['De ma poche', 'apport'], ['ZZ Autre entrée', 'autre-entree']]));
    expect(estAutreEntree(autre.transaction)).toBe(true);
    expect(estAutreEntree(vente.transaction)).toBe(false);
  });
  it('la pastille Ventes ne compte que la vente : jamais « +1 205 à encaisser » ; l’apport est dit reçu, hors ventes', () => {
    const m = construireModele(entrees({ transactions: pieces, payments: pays }));
    const p = pastille('ventes', m.choses.filter(c => c.rangee === 'ventes'), cols('2026-11-16', 4));
    expect(p.solde).toBe(400);
    expect(p.mot).toBe('confirmé');
    expect(p.lecture).not.toMatch(/à encaisser/);
    expect(p.lecture).toMatch(/\+1\s?201,10? reçu, hors ventes|reçu, hors ventes/);
  });
  it('sans vente, la rangée dit ce qu’elle voit : « reçu », jamais un solde de ventes', () => {
    const m = construireModele(entrees({ transactions: [apport.transaction], payments: [pays[1]] }));
    const p = pastille('ventes', m.choses.filter(c => c.rangee === 'ventes'), cols('2026-11-16', 4));
    expect(p.solde).toBeNull();
    /* C38-3 (tour 38) : l'apport n'entre jamais dans un total « reçu » des Ventes : la pastille dit « hors ventes » */
    expect(p.texte).not.toMatch(/reçu/);
    expect(p.conf).toMatch(/^hors ventes /);
  });
  it('un apport promis (à recevoir) est « attendu, hors ventes », jamais « à encaisser »', () => {
    const promis = saisir('apport', { cents: 50_000, date: '2026-12-01', reglement: 'apayer', echeance: '2026-12-01', nom: 'Promis' }, 'T-p').transaction;
    const m = construireModele(entrees({ transactions: [promis] }));
    const c = m.choses.find(x => x.titre === 'Promis') as ChoseCalendrier;
    expect(c.horsVentes).toBe('apport');
    const p = pastille('ventes', [c], cols('2026-11-23', 8));
    expect(p.lecture).toMatch(/attendu, hors ventes/);
    expect(p.lecture).not.toMatch(/à encaisser/);
  });
  it('« Autre entrée » porte son nom, pas « Recette du … »', () => {
    expect(autre.transaction.description).toBe('ZZ Autre entrée');
    expect(saisir('autrei', { cents: 110 }, 'T-n').transaction.description).toBe(`Autre entrée du ${AUJ.slice(8, 10)}.${AUJ.slice(5, 7)}`);
  });
});

describe('E35-10 : les sorties payées se voient comme les rentrées payées', () => {
  const achat = saisir('achat', { cents: 350, date: '2026-11-18', nom: 'ZZ Achat' }, 'T-ach');
  const prel = saisir('prel', { cents: 250, date: '2026-11-21', nom: 'ZZ Pour moi' }, 'T-pre');
  const aut = saisir('autreo', { cents: 700, date: '2026-11-19', nom: 'ZZ Autre sortie' }, 'T-aso');
  const loyer = saisir('loyer', { cents: 900, date: '2026-11-10', rythme: 'une', nom: 'ZZ Loyer payé' }, 'T-loy');
  const tous = [achat, prel, aut, loyer];

  it('achat, pour moi, autre sortie et loyer payés sont des choses de leur rangée, en négatif, à leur jour', () => {
    const m = construireModele(entrees({ transactions: tous.map(e => e.transaction), payments: tous.map(e => payer(e.transaction, e.transaction.date)) }));
    const par = (nom: string) => m.choses.find(c => c.titre === nom);
    expect([par('ZZ Achat')?.rangee, par('ZZ Achat')?.centimes, par('ZZ Achat')?.debut]).toEqual(['achats', -350, '2026-11-18']);
    expect(par('ZZ Pour moi')).toMatchObject({ rangee: 'papiers', centimes: -250 });
    expect(par('ZZ Autre sortie')).toMatchObject({ rangee: 'achats', centimes: -700 });
    expect(par('ZZ Loyer payé')).toMatchObject({ rangee: 'papiers', centimes: -900 });
    expect(par('ZZ Achat')?.detail).toBe('payée le 18 nov.');
  });
  it('une pièce annulée, un paiement de sens contraire ou une pièce encore attendue ne sont pas des choses', () => {
    const base = { transactions: [achat.transaction], payments: [payer(achat.transaction, '2026-11-18')], attendues: new Set<string>(), depuis: '2026-11-16', aujourdhui: AUJ };
    expect(chosesPayees(base)).toHaveLength(1);
    expect(chosesPayees({ ...base, attendues: new Set([achat.transaction.id]) })).toEqual([]);
    expect(chosesPayees({ ...base, transactions: [{ ...achat.transaction, finance: { ...achat.transaction.finance!, voidedAt: 'x' } }] })).toEqual([]);
    expect(chosesPayees({ ...base, payments: [{ ...base.payments[0], direction: 'in' }] })).toEqual([]);
    expect(chosesPayees({ ...base, depuis: '2026-11-19' })).toEqual([]);
  });
});

describe('E35-9 : une pièce à payer ou à recevoir est prévue', () => {
  const item = (direction: 'in' | 'out', id: string) => ({ id: `invoice:${id}`, date: '2026-12-23', label: 'ZZ', amountCents: 500, direction, source: 'invoice' as const, category: 'divers' });
  it('une facture à payer est « prevue: payer », une à recevoir « recevoir » ; le nom accessible le dit', () => {
    const sortie = choseArgent(item('out', 'a')) as ChoseCalendrier;
    const entree = choseArgent(item('in', 'b')) as ChoseCalendrier;
    expect(sortie.prevue).toBe('payer');
    expect(entree.prevue).toBe('recevoir');
    expect(nomAccessible(sortie)).toContain(', à payer,');
    expect(nomAccessible(entree)).toContain(', à recevoir,');
  });
  it('un paiement fait n’est jamais prévu', () => {
    const t = saisir('achat', { cents: 350, date: '2026-11-18' }, 'T-x');
    const [c] = chosesPayees({ transactions: [t.transaction], payments: [payer(t.transaction, '2026-11-18')], attendues: new Set(), depuis: '2026-11-16', aujourdhui: AUJ });
    expect(c.prevue).toBeUndefined();
  });
  it('de bout en bout : une vente à recevoir le 23.12 est une chose prévue du Calendrier', () => {
    const v = saisir('vente', { cents: 500, date: AUJ, reglement: 'apayer', echeance: '2026-12-23', nom: 'ZZ Vente due' }, 'T-vd').transaction;
    const c = construireModele(entrees({ transactions: [v] })).choses.find(x => x.titre === 'ZZ Vente due');
    expect(c).toMatchObject({ prevue: 'recevoir', debut: '2026-12-23' });
  });
});

describe('E35-15, E35-16 : les mots de la ligne disent ce que l’écriture est', () => {
  it('Pour moi : « Prélèvement privé » ; l’impôt sur la bière : « Impôts » ; une autre entrée : « Autre entrée »', () => {
    expect(libelleEcriture(saisir('prel', { cents: 250 }, 'a').transaction, 'Apports privés')).toBe('Prélèvement privé');
    expect(libelleEcriture(saisir('impot', { cents: 100 }, 'b').transaction, 'Autres frais')).toBe('Impôts');
    expect(libelleEcriture(saisir('autrei', { cents: 110 }, 'c').transaction, 'Ventes')).toBe('Autre entrée');
  });
  it('le reste garde le libellé de sa catégorie', () => {
    expect(libelleEcriture(saisir('vente', { cents: 100 }, 'd').transaction, 'Ventes')).toBe('Ventes');
    expect(libelleEcriture(saisir('apport', { cents: 100 }, 'e').transaction, 'Apports privés')).toBe('Apports privés');
    expect(libelleEcriture(saisir('autreo', { cents: 100 }, 'f').transaction, 'Autres frais')).toBe('Autres frais');
  });
});

describe('E35-6 : corriger le montant d’une pièce payée ne crée pas de dette', () => {
  it('3,50 → 4,50 sur un achat payé : le choix posé d’avance est « le paiement suit » ; le plan complète le paiement', () => {
    const t = saisir('achat', { cents: 350, date: '2026-11-18' }, 'T-6');
    const paiement = payer(t.transaction, '2026-11-18');
    expect(choixParDefaut()).toBe('suit');
    const plan = planCorrection(t.transaction, [paiement], 450, choixParDefaut());
    expect(plan.map(e => e.type)).toEqual(['montant', 'paiement']);
    expect(plan[1]).toMatchObject({ type: 'paiement', cents: 100 });
  });
  it('« Reste à payer » demeure un choix explicite (la facture a vraiment augmenté)', () => {
    const t = saisir('achat', { cents: 350, date: '2026-11-18' }, 'T-6b');
    expect(planCorrection(t.transaction, [payer(t.transaction, '2026-11-18')], 450, 'reste').map(e => e.type)).toEqual(['montant']);
  });
});
