import { describe, expect, it } from 'vitest';
import type { FinanceTransaction, FinancialPayment, FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';
import { chosesPayees } from '../../src/domain/calendrierPaiements';
import { planCorrection, choixParDefaut } from '../../src/domain/finance/correctionMontant';
import { paiementDeEtape } from '../../src/ui/finance/modifier/executerCorrection';
import { periodeSynthese } from '../../src/domain/finance/periodeSynthese';
import { estAutreEntree, estImpot, libelleEcriture } from '../../src/domain/finance/libelleEcriture';
import { GROUPES, ORDRE, groupeDe } from '../../src/ui/finance/operations/groupes';
import { colonnesDe } from '../../src/ui/finance/operations/Piles';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';
import { construireModele, type EntreesModele } from '../../src/ui/calendrier/useDonneesCalendrier';
import { avecGenre, brouillonNeuf, preparer, GENRES, verbeEnregistrer } from '../../src/ui/saisie/modele';

/* Voie ecr2 (23.11 soir) : E38-2, E38-3, E38-7, E35-13. Les règles de calcul et de rangement, sur des écritures écrites comme l'app (`preparer`). */

const AUJ = '2026-11-23';
function saisir(genre: Parameters<typeof avecGenre>[1], plus: Partial<ReturnType<typeof brouillonNeuf>> & { cents: number }, id = `T-${genre}`) {
  const b = { ...avecGenre(brouillonNeuf(AUJ), genre), ...plus };
  return preparer(b, { id, maintenant: `${AUJ}T10:00:00.000Z`, transactions: [], tvaInscrit: false });
}
const payer = (tx: FinanceTransaction, jour: string): FinancialPayment => ({ id: `PAI-${tx.id}`, transactionId: tx.id, date: jour, amountCents: tx.finance!.amountCents, direction: tx.finance!.kind === 'income' || tx.finance!.kind === 'contribution' ? 'in' : 'out', method: 'bank', recordedAt: `${jour}T10:00:00.000Z` });

describe('E38-3 : corriger le montant d’une pièce payée garde la date du paiement, un seul paiement', () => {
  const achat = saisir('achat', { cents: 350, date: '2026-11-18' }, 'T-e38-3').transaction;
  const p1 = payer(achat, '2026-11-18');

  it('la hausse écrit le complément au jour du paiement d’origine, pas aujourd’hui', () => {
    const plan = planCorrection(achat, [p1], 450, choixParDefaut());
    const etape = plan[1];
    expect(etape).toMatchObject({ type: 'paiement', cents: 100, date: '2026-11-18' });
    if (etape.type !== 'paiement') throw new Error('étape inattendue');
    const ecrit = paiementDeEtape(etape, achat.id, { aujourdhui: AUJ, maintenant: `${AUJ}T12:00:00.000Z` }, 'PAI-2');
    expect(ecrit.date).toBe('2026-11-18');
  });
  it('le Calendrier montre UN paiement de 4,50 le 18.11 (deux écritures du même jour se fondent)', () => {
    const complement: FinancialPayment = { ...p1, id: 'PAI-2', amountCents: 100, recordedAt: `${AUJ}T12:00:00.000Z` };
    const corrige = { ...achat, amountTTC: 4.5, finance: { ...achat.finance!, amountCents: 450 } } as FinanceTransaction;
    const choses = chosesPayees({ transactions: [corrige], payments: [p1, complement], attendues: new Set(), depuis: '2026-11-01', aujourdhui: AUJ });
    expect(choses).toHaveLength(1);
    expect(choses[0]).toMatchObject({ debut: '2026-11-18', centimes: -450 });
  });
  it('un paiement inversé par une baisse ne reste pas au Calendrier : seul le nouveau paiement y est', () => {
    const baisse = planCorrection(achat, [p1], 200, 'suit');
    expect(baisse.map((e) => e.type)).toEqual(['contre', 'montant', 'paiement']);
    const contre: FinancialPayment = { ...p1, id: `CONTRE-${p1.id}`, direction: 'in', reversalOfId: p1.id };
    const nouveau: FinancialPayment = { ...p1, id: 'PAI-3', amountCents: 200 };
    const corrige = { ...achat, amountTTC: 2, finance: { ...achat.finance!, amountCents: 200 } } as FinanceTransaction;
    const choses = chosesPayees({ transactions: [corrige], payments: [p1, contre, nouveau], attendues: new Set(), depuis: '2026-11-01', aujourdhui: AUJ });
    expect(choses.map((c) => c.centimes)).toEqual([-200]);
  });
});

describe('E38-2 : une autre entrée n’est pas une vente', () => {
  const vente = saisir('vente', { cents: 480, date: '2026-11-20', nom: 'Vente test' }, 'T-v').transaction;
  const autre = saisir('autrei', { cents: 110, date: '2026-11-21', nom: 'ZZ TEST — Autre entrée' }, 'T-o').transaction;
  const pays = [payer(vente, '2026-11-20'), payer(autre, '2026-11-21')];

  it('le prédicat est partagé et le groupe de l’Opération est « Autres entrées », après les Ventes', () => {
    expect(estAutreEntree(autre)).toBe(true);
    expect(estAutreEntree(vente)).toBe(false);
    expect(groupeDe(autre, { retardHorsMois: false })).toBe('autresEntrees');
    expect(groupeDe(vente, { retardHorsMois: false })).toBe('recettes');
    expect(GROUPES.autresEntrees.label).toBe('Autres entrées');
    expect(ORDRE.indexOf('autresEntrees')).toBe(ORDRE.indexOf('recettes') + 1);
  });
  it('la Synthèse compte une vente et une autre entrée, séparément ; l’entré total reste la somme', () => {
    const p = periodeSynthese({ transactions: [vente, autre], payments: pays, mois: '2026-11', aujourdhui: AUJ });
    expect(p.entreCents).toBe(590);
    expect(p.ventes.nombre).toBe(1);
    expect(p.ventes.libelle).toBe('Vente test');
    expect(p.autresEntrees).toMatchObject({ nombre: 1, cents: 110 });
  });
  it('sans aucune vente, la Synthèse ne parle pas de ventes', () => {
    const p = periodeSynthese({ transactions: [autre], payments: [pays[1]], mois: '2026-11', aujourdhui: AUJ });
    expect(p.ventes.nombre).toBe(0);
    expect(p.ventes.libelle).toBeNull();
    expect(p.autresEntrees.cents).toBe(110);
  });
  it('les piles : Ventes ne porte que les ventes, « Entrées » les autres entrées', () => {
    const p = periodeSynthese({ transactions: [vente, autre], payments: pays, mois: '2026-11', aujourdhui: AUJ });
    const { ventes, autres } = colonnesDe(p);
    expect(ventes?.cents).toBe(480);
    expect(autres).toMatchObject({ cle: 'autresEntrees', libelle: 'Entrées', cents: 110 });
  });
  it('la ligne dit « Autre entrée »', () => {
    expect(libelleEcriture(autre, 'Ventes')).toBe('Autre entrée');
  });
});

describe('E38-7 : « Impôts » partout', () => {
  const impot = saisir('impot', { cents: 13_420, date: '2026-11-20', nom: 'ZZ TEST — Impôts' }, 'T-i').transaction;
  const autre = saisir('autreo', { cents: 500, date: '2026-11-20' }, 'T-ao').transaction;
  it('le prédicat et le groupe d’Opérations', () => {
    expect(estImpot(impot)).toBe(true);
    expect(estImpot(autre)).toBe(false);
    expect(groupeDe(impot, { retardHorsMois: false })).toBe('impots');
    expect(groupeDe(autre, { retardHorsMois: false })).toBe('divers');
    expect(GROUPES.impots.label).toBe('Impôts');
  });
});

describe('E35-13 : Apport et Pour moi ont la même structure que Vente et Achat', () => {
  it('« Revient ? » : un apport et un prélèvement peuvent revenir (Versement mensuel…)', () => {
    expect(GENRES.apport.rythme).toBe('une');
    expect(GENRES.prel.rythme).toBe('une');
    const e = saisir('apport', { cents: 50_000, rythme: 'monthly', date: AUJ, nom: 'Versement mensuel ZZ' }, 'T-ap');
    expect(e.plan).toMatchObject({ direction: 'in', recurrence: { frequency: 'monthly' } });
    expect(e.transaction.finance?.planId).toBe(e.plan!.id);
  });
  it('le bouton d’enregistrement dit le sens (E35-7 inchangé)', () => {
    expect(verbeEnregistrer(false, 'in', 'apport')).toBe('Reçu');
    expect(verbeEnregistrer(false, 'out', 'prel')).toBe('Retiré');
  });
});

describe('E38-6 : une écriture qui revient « à payer d’ici le … » garde son délai à chaque occurrence', () => {
  const profil = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, openingCash: { date: '2026-01-01', amountCents: 100_000, confirmed: true } } as FinancialProfile;
  const entrees = (plus: Partial<EntreesModele>): EntreesModele => ({ aujourdhui: AUJ, transactions: [], payments: [], plans: [], profile: profil, assets: [], batches: [], stockItems: [], items: [], recettes: [], reglages: REGLAGES_VIDES, ...plus });
  const dates = (titre: string, e: ReturnType<typeof saisir>) =>
    construireModele(entrees({ transactions: [e.transaction], plans: [e.plan as FinancialPlan] })).choses.filter((c) => c.titre.includes(titre) && (c.centimes ?? 0) < 0).map((c) => c.debut).sort();
  it('Salaire mensuel dû le 23.12 : 23.12, puis 23.01, 23.02… (jamais deux le 23.12)', () => {
    const e = saisir('salaire', { cents: 500, rythme: 'monthly', date: AUJ, reglement: 'apayer', echeance: '2026-12-23', nom: 'ZZ Salaire' }, 'T-sal');
    const d = dates('ZZ Salaire', e);
    expect(d.slice(0, 3)).toEqual(['2026-12-23', '2027-01-23', '2027-02-23']);
    expect(new Set(d).size).toBe(d.length);
  });
  it('Loyer trimestriel dû le 23.12 : 23.12, puis 23.03 (et non 23.02)', () => {
    const e = saisir('loyer', { cents: 900, rythme: 'quarterly', date: AUJ, reglement: 'apayer', echeance: '2026-12-23', nom: 'ZZ Loyer' }, 'T-loy');
    expect(dates('ZZ Loyer', e).slice(0, 2)).toEqual(['2026-12-23', '2027-03-23']);
  });
  it('sans échéance après la date : rien ne bouge', () => {
    const e = saisir('salaire', { cents: 500, rythme: 'monthly', date: AUJ, reglement: 'paye', nom: 'ZZ Payé' }, 'T-pay');
    const d = construireModele(entrees({ transactions: [e.transaction], plans: [e.plan as FinancialPlan], payments: [payer(e.transaction, AUJ)] })).choses.filter((c) => c.titre.includes('ZZ Payé') && (c.centimes ?? 0) < 0 && c.debut > AUJ).map((c) => c.debut).sort();
    expect(d[0]).toBe('2026-12-23');
  });
});

describe('E35-13 (suite) : un apport et un prélèvement qui reviennent passent le Calendrier sans erreur', () => {
  it('un Pour moi mensuel donne ses échéances', () => {
    const e = saisir('prel', { cents: 300_000, rythme: 'monthly', date: AUJ, nom: 'ZZ Paie' }, 'T-prel');
    expect(e.plan).toMatchObject({ direction: 'out', category: 'apports', recurrence: { frequency: 'monthly' } });
  });
});
