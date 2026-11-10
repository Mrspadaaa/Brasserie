import { describe, expect, it } from 'vitest';
import type { FinanceLine, FinanceTransaction, FinancialAsset, FinancialPayment, TransactionFinance } from '../../src/domain/finance/types';
import { buildAnnualReport } from '../../src/domain/finance/annual';
import { echelle, explication, ordrePile, periodeSynthese, regrouperPetits, repartirAuProrata } from '../../src/domain/finance/periodeSynthese';

// Fixture = la démo de la maquette g3a (09.11) : vente 720 ; nettoyage 42, brassage 186,80, électricité 68 payés ; loyer 400 à payer le 25 ; joints 28,60 (matériel).
const AUJOURDHUI = '2026-11-09', MOIS = '2026-11';
type Patch = Partial<FinanceTransaction>;
const tx = (id: string, description: string, cents: number, category: string, finance: Partial<TransactionFinance> = {}, patch: Patch = {}): FinanceTransaction => ({
  id, description, date: '2026-11-05', category: category as never, subcategory: '', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: category === 'recettes' ? 'income' : 'expense', amountCents: cents, lines: [], paymentStatus: 'unpaid', ...finance }, ...patch,
});
const paiement = (transactionId: string, cents: number, direction: 'in' | 'out' = 'out', date = '2026-11-05'): FinancialPayment =>
  ({ id: `P-${transactionId}-${cents}`, transactionId, date, amountCents: cents, direction, method: 'bank', recordedAt: `${date}T10:00:00Z` });
const payeEntier = (t: FinanceTransaction) => paiement(t.id, t.finance!.amountCents, t.finance!.kind === 'income' ? 'in' : 'out');
const ligne = (id: string, kind: FinanceLine['kind'], cents: number, patch: Partial<FinanceLine> = {}): FinanceLine => ({ id, kind, description: id, amountCents: cents, ...patch });

const vente = tx('V', 'Vente au marché', 72000, 'recettes');
const nettoyage = tx('N', 'Nettoyant alcalin', 4200, 'nettoyage');
const brassage = tx('B', 'Malt et houblons', 18680, 'brassage', { lines: [ligne('malt', 'ingredient', 18680)] });
const elec = tx('E', 'Électricité', 6800, 'chargesFixes');
const loyer = tx('L', 'Loyer de l’atelier', 40000, 'chargesFixes', { dueDate: '2026-11-25' });
const joints = tx('J', 'Joints de la cuve', 2860, 'materiel');
const demo = [vente, nettoyage, brassage, elec, loyer, joints];
const payes = [vente, nettoyage, brassage, elec, joints].map(payeEntier);
const calcul = (transactions: FinanceTransaction[], payments: FinancialPayment[], mois: string | null = MOIS, assets?: FinancialAsset[]) =>
  periodeSynthese({ transactions, payments, mois, aujourdhui: AUJOURDHUI, assets });
const sommePostes = (p: ReturnType<typeof calcul>) => p.postes.reduce((n, x) => n + x.cents, 0);

describe('periodeSynthese : la démo de la maquette g3a', () => {
  const p = calcul(demo, payes);
  it('entré 720,00, dépensé 696,80, gagné 23,20, matériel 28,60 à part', () => {
    expect(p.entreCents).toBe(72000);
    expect(p.depenseCents).toBe(69680);
    expect(p.gainCents).toBe(2320);
    expect(p.materielCents).toBe(2860);
  });
  it('payé 296,80 + à payer 400,00 = dépensé 696,80 ; le loyer est le seul hachuré, avec son échéance', () => {
    expect(p.payeCents).toBe(29680);
    expect(p.aPayerCents).toBe(40000);
    expect(p.aPayer).toEqual([{ id: 'L', libelle: 'Loyer de l’atelier', cents: 40000, echeance: '2026-11-25', categorie: 'chargesFixes', enRetard: false }]);
  });
  it('la pile : petits postes d’abord, charges fixes en bas (46,80 dont 400,00 hachurés)', () => {
    expect(p.postes.map(x => [x.categorie, x.cents, x.aPayerCents])).toEqual([['nettoyage', 4200, 0], ['brassage', 18680, 0], ['chargesFixes', 46800, 40000]]);
    expect(sommePostes(p) + p.materielCents).toBe(69680 + 2860);
  });
  it('une seule vente : son libellé ; la pièce de matériel sans registre est dite', () => {
    expect(p.ventes).toEqual({ nombre: 1, libelle: 'Vente au marché' });
    expect(calcul(demo, payes, MOIS, []).aVerifier.materielSansRegistre).toEqual(['Joints de la cuve']);
    expect(calcul(demo, payes, MOIS, [{ id: 'A', transactionId: 'J' } as FinancialAsset]).aVerifier.materielSansRegistre).toEqual([]);
    expect(p.aVerifier.materielSansRegistre).toEqual([]); // registre non fourni : non évalué
  });
  it('rien n’est inventé : aucune pièce sans date, aucun paiement à confirmer, aucun avoir', () => {
    expect(p.aVerifier).toEqual({ sansDate: [], paiementsAConfirmer: [], avoirsInvalides: [], avoirsNonDessinesCents: 0, materielSansRegistre: [] });
  });
});

describe('periodeSynthese : états de la maquette', () => {
  it('mois sans vente (octobre) : entré 0, dépensé 28,00, perte, aucune hachure', () => {
    const petits = tx('H', 'Petits achats courants', 2800, 'divers', {}, { date: '2026-10-05' });
    const p = calcul([...demo, petits], [...payes, payeEntier(petits)], '2026-10');
    expect(p.entreCents).toBe(0); expect(p.depenseCents).toBe(2800); expect(p.gainCents).toBe(-2800);
    expect(p.aPayer).toEqual([]); expect(p.ventes).toEqual({ nombre: 0, libelle: null });
  });
  it('mois vide : tout à zéro, 0 ligne, jamais NaN', () => {
    const p = calcul([], [], MOIS);
    expect([p.entreCents, p.depenseCents, p.gainCents, p.materielCents, p.lignes]).toEqual([0, 0, 0, 0, 0]);
  });
  it('« tout » prend toutes les dates, d’une année ancienne comprise (archivée ou non : ce que reçoit l’écran)', () => {
    const ancienne = tx('A', 'Fête de 2024', 80000, 'recettes', {}, { date: '2024-06-01' });
    const p = calcul([...demo, ancienne], [...payes, payeEntier(ancienne)], null);
    expect(p.entreCents).toBe(72000 + 80000);
    expect(calcul([...demo, ancienne], payes, MOIS).entreCents).toBe(72000);
  });
  it('plusieurs ventes : « n ventes », sans empiler ; une vente non encaissée est à encaisser', () => {
    const v2 = tx('V2', 'Facture bar', 30000, 'recettes', { dueDate: '2026-11-30' });
    const p = calcul([vente, v2], [payeEntier(vente)]);
    expect(p.ventes).toEqual({ nombre: 2, libelle: '2 ventes' });
    expect(p.entreCents).toBe(102000);
    expect(p.aEncaisser.map(r => [r.id, r.cents])).toEqual([['V2', 30000]]);
    expect(p.entreAEncaisserCents).toBe(30000);
  });
});

describe('periodeSynthese : au centime', () => {
  it('facture mixte : matériel 60,00 (capital), brassage 40,00, reliquat 10,00 (TVA) dans la catégorie de la pièce ; somme = 110,00', () => {
    const mixte = tx('M', 'Achat mixte', 11000, 'divers', { lines: [ligne('pompe', 'equipment', 6000), ligne('malt', 'ingredient', 4000)] });
    const p = calcul([mixte], [payeEntier(mixte)]);
    expect(p.materielCents).toBe(6000);
    expect(p.postes.map(x => [x.categorie, x.cents]).sort()).toEqual([['brassage', 4000], ['divers', 1000]]);
    expect(p.depenseCents + p.materielCents).toBe(11000);
  });
  it('une ligne d’équipement passée en charge n’est pas à part', () => {
    const t = tx('M', 'Petit outil', 5000, 'divers', { lines: [ligne('o', 'equipment', 5000, { capitalTreatment: 'expense', category: 'divers' })] });
    const p = calcul([t], [payeEntier(t)]);
    expect([p.materielCents, p.depenseCents]).toEqual([0, 5000]);
  });
  it('trois lignes de 33,33 / 33,33 / 33,34 payées 40,00 : hachuré 60,00 exactement, parts au centime', () => {
    const t = tx('T', 'Trois tiers', 10000, 'divers', { lines: [ligne('a', 'ingredient', 3333), ligne('b', 'cleaning', 3333), ligne('c', 'service', 3334, { category: 'divers' })] });
    const p = calcul([t], [paiement('T', 4000)]);
    expect(p.aPayer[0].cents).toBe(6000);
    expect(p.aPayerCents).toBe(6000);
    expect(sommePostes(p)).toBe(10000);
    expect(p.payeCents).toBe(4000);
  });
  it('repartirAuProrata : somme exacte sur un balayage de totaux', () => {
    for (let total = 0; total <= 200; total++) {
      const r = repartirAuProrata(total, new Map([['a', 3333], ['b', 3333], ['c', 3334]]));
      expect([...r.values()].reduce((n, v) => n + v, 0)).toBe(total);
    }
  });
});

describe('periodeSynthese : avoirs', () => {
  const facture = tx('F', 'Facture fournisseur', 15000, 'divers');
  const avoir = (id: string, cents: number, patch: Partial<TransactionFinance> = {}, p: Patch = {}) => tx(id, 'Avoir', cents, 'divers', { kind: 'refund', refundOfId: 'F', refundDirection: 'in', refundApplication: 'cash', ...patch }, p);
  it('un avoir fournisseur réduit le poste de sa facture : dépensé 130,00, aucun segment négatif', () => {
    const p = calcul([facture, avoir('R', 2000)], [payeEntier(facture), paiement('R', 2000, 'in')]);
    expect(p.depenseCents).toBe(13000);
    expect(p.postes).toEqual([{ categorie: 'divers', cents: 13000, payeCents: 13000, aPayerCents: 0 }]);
    expect(p.depenseCents).toBe(sommePostes(p));
  });
  it('un avoir sans facture valide est exclu et nommé', () => {
    const orphelin = avoir('R', 2000, { refundOfId: 'INCONNUE' });
    const p = calcul([facture, orphelin], [payeEntier(facture)]);
    expect(p.depenseCents).toBe(15000);
    expect(p.aVerifier.avoirsInvalides).toEqual(['R']);
  });
  it('un avoir sur du matériel réduit le matériel, pas le dépensé', () => {
    const cuve = tx('F', 'Cuve', 10000, 'materiel');
    const p = calcul([cuve, avoir('R', 3000)], [payeEntier(cuve)]);
    expect(p.materielCents).toBe(7000); expect(p.depenseCents).toBe(0);
  });
  it('un avoir imputé réduit l’à-payer de sa facture une seule fois : dépensé 130,00, hachuré 130,00, payé 0', () => {
    const p = calcul([facture, avoir('R', 2000, { refundApplication: 'offset' })], []);
    expect(p.depenseCents).toBe(13000);
    expect(p.aPayerCents).toBe(13000);
    expect(p.payeCents).toBe(0);
  });
  it('un avoir client réduit l’entré', () => {
    const credit = tx('R', 'Avoir client', 10000, 'recettes', { kind: 'refund', refundOfId: 'V', refundDirection: 'out', refundApplication: 'cash' });
    const p = calcul([vente, credit], [payeEntier(vente), paiement('R', 10000, 'out')]);
    expect(p.entreCents).toBe(62000);
  });
  it('un avoir d’un autre mois qui dépasse son poste est écrêté à 0 et l’excédent est dit', () => {
    const octobre = tx('F', 'Facture d’octobre', 10000, 'divers', {}, { date: '2026-10-05' });
    const p = calcul([octobre, avoir('R', 4000)], [payeEntier(octobre)]);
    expect(p.depenseCents).toBe(0); expect(p.postes).toEqual([]);
    expect(p.aVerifier.avoirsNonDessinesCents).toBe(4000);
  });
});

describe('periodeSynthese : ce qui n’est ni vente ni charge, et l’inconnu', () => {
  it('apports et prélèvements privés : exclus', () => {
    const apport = tx('AP', 'Apport', 50000, 'apports', { kind: 'contribution' });
    const retrait = tx('PR', 'Prélèvement', 20000, 'divers', { kind: 'withdrawal' });
    const p = calcul([apport, retrait], []);
    expect([p.entreCents, p.depenseCents, p.lignes]).toEqual([0, 0, 0]);
  });
  it('une pièce sans date n’entre dans aucune période mais est nommée', () => {
    const p = calcul([tx('S', 'Pièce sans date', 1000, 'divers', {}, { date: 'inconnue' })], []);
    expect(p.depenseCents).toBe(0); expect(p.aVerifier.sansDate).toEqual(['Pièce sans date']);
    expect(calcul([tx('S', 'Pièce sans date', 1000, 'divers', {}, { date: 'inconnue' })], [], null).aVerifier.sansDate).toEqual(['Pièce sans date']);
  });
  it('un paiement inconnu est compté plein, jamais hachuré, et nommé', () => {
    const ancienne = tx('X', 'Avant l’app', 9000, 'divers', { paymentStatus: undefined });
    const p = calcul([ancienne], []);
    expect(p.depenseCents).toBe(9000); expect(p.aPayerCents).toBe(0);
    expect(p.aVerifier.paiementsAConfirmer).toEqual(['X']);
  });
  it('une facture échue est en retard', () => {
    const solde = tx('SA', 'Solde atelier', 6000, 'chargesFixes', { dueDate: '2026-11-01' });
    expect(calcul([solde], []).aPayer[0].enRetard).toBe(true);
    expect(calcul([loyer], []).aPayer[0].enRetard).toBe(false);
  });
});

describe('pile et échelle', () => {
  it('ordrePile : charges fixes en dernier, les autres du plus petit au plus gros', () => {
    const p = (categorie: string, cents: number) => ({ categorie, cents, payeCents: cents, aPayerCents: 0 });
    expect(ordrePile([p('chargesFixes', 1), p('brassage', 9), p('nettoyage', 2)]).map(x => x.categorie)).toEqual(['nettoyage', 'brassage', 'chargesFixes']);
  });
  it('regrouperPetits : sous 3 % du dépensé, regroupés en « divers », somme conservée', () => {
    const p = (categorie: string, cents: number, aPayerCents = 0) => ({ categorie, cents, payeCents: cents - aPayerCents, aPayerCents });
    const postes = [p('nettoyage', 350), p('materiel', 400), p('brassage', 30000), p('chargesFixes', 39250, 30000)];
    const fusion = regrouperPetits(postes, 70000);
    expect(fusion.map(x => [x.categorie, x.cents])).toEqual([['divers', 750], ['brassage', 30000], ['chargesFixes', 39250]]);
    expect(fusion.reduce((n, x) => n + x.cents, 0)).toBe(70000);
    expect(regrouperPetits(postes.slice(0, 1), 350)).toHaveLength(1);
  });
  it('échelle : gain, perte, nul, vide ; la plus haute colonne = la hauteur', () => {
    const g = echelle(72000, 69680, 300);
    expect(g.signe).toBe('gain'); expect(g.hEntree).toBe(300); expect(g.hEcart).toBe(10); expect(g.hPileDepense).toBe(290);
    const grand = echelle(72000, 36000, 300);
    expect(grand.hEcart).toBe(150); expect(grand.hPileDepense).toBe(150);
    const perte = echelle(2790, 2800, 300);
    expect(perte.signe).toBe('perte'); expect(perte.hDepense).toBe(300); expect(perte.hPileEntree).toBe(290); expect(perte.hEcart).toBe(10);
    const sansVente = echelle(0, 2800, 300);
    expect(sansVente).toMatchObject({ signe: 'perte', hEcart: 300, hPileEntree: 0, hPileDepense: 300 });
    const moins = echelle(1000, 3000, 300);
    expect(moins.signe).toBe('perte'); expect(moins.hEcart).toBe(200); expect(moins.hPileEntree).toBe(100);
    expect(echelle(5000, 5000, 300)).toMatchObject({ signe: 'nul', hEcart: 0, hPileEntree: 300, hPileDepense: 300 });
    const vide = echelle(0, 0, 300);
    expect(vide).toEqual({ signe: 'nul', hEntree: 0, hDepense: 0, hEcart: 0, hPileEntree: 0, hPileDepense: 0 });
    for (const v of Object.values(vide)) expect(Number.isNaN(v)).toBe(false);
  });
});

describe('explication (« Pourquoi ? »), par gabarit', () => {
  it('démo : poste dominant = charges fixes, 65 % de l’entré ; parts = 100 %, gain en dernier', () => {
    const e = explication(calcul(demo, payes));
    expect(e.signe).toBe('gain');
    expect(e.dominant).toEqual({ categorie: 'chargesFixes', cents: 46800, partPct: 65 });
    expect(e.second?.categorie).toBe('brassage');
    expect(e.parts.at(-1)?.cle).toBe('gain');
    expect(e.parts.reduce((n, x) => n + x.pct, 0)).toBe(100);
  });
  it('sans entré ou avec perte : aucune part d’entré, aucune division par zéro', () => {
    const petits = tx('H', 'Petits achats', 2800, 'divers');
    const e = explication(calcul([petits], [payeEntier(petits)]));
    expect(e.signe).toBe('perte'); expect(e.parts).toEqual([]); expect(e.dominant).toBeNull();
    const plus = explication(calcul([vente, tx('G', 'Gros achat', 90000, 'brassage')], [payeEntier(vente)]));
    expect(plus.signe).toBe('perte'); expect(plus.parts).toEqual([]);
  });
  it('gain nul : ni gain ni perte', () => {
    const t = tx('Q', 'Achat', 72000, 'brassage');
    expect(explication(calcul([vente, t], [payeEntier(vente), payeEntier(t)])).signe).toBe('nul');
  });
});

describe('contre l’Annuel : la divergence sur le matériel est écrite, pas cachée', () => {
  const profil = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified' } as const;
  it('ligne equipment : la Synthèse et l’Annuel mettent la même somme à part (capital)', () => {
    const t = tx('M', 'Pompe', 60000, 'materiel', { lines: [ligne('pompe', 'equipment', 60000)] }, { date: '2026-03-01' });
    const synthese = calcul([t], [payeEntier(t)], '2026-03');
    const annuel = buildAnnualReport({ year: 2026, transactions: [t], payments: [payeEntier(t)], assets: [], profile: profil, generatedAt: '2026-11-09T10:00:00Z' });
    expect(synthese.materielCents).toBe(60000);
    expect(annuel.capitalPurchasesCents).toBe(60000);
  });
  it('pièce `materiel` sans ligne ni registre : la Synthèse la met à part (maquette), l’Annuel la garde en charge ; elle est dite « sans registre »', () => {
    const t = tx('J', 'Joints de la cuve', 2860, 'materiel', {}, { date: '2026-03-01' });
    const synthese = calcul([t], [payeEntier(t)], '2026-03', []);
    const annuel = buildAnnualReport({ year: 2026, transactions: [t], payments: [payeEntier(t)], assets: [], profile: profil, generatedAt: '2026-11-09T10:00:00Z' });
    expect(synthese.materielCents).toBe(2860);
    expect(annuel.capitalPurchasesCents).toBe(0);
    expect(annuel.operatingExpensesCents).toBe(2860);
    expect(synthese.aVerifier.materielSansRegistre).toEqual(['Joints de la cuve']);
  });
});
