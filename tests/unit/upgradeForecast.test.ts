import { describe, expect, it } from 'vitest';
import type { FinancialPlan } from '../../src/domain/finance/types';
import type { ForecastItem, ForecastMonth } from '../../src/domain/finance/forecast';
import { avenir, echelleCaisse, effetProjet, estPose, marchesParMois, moisDePlan, partsInconnues, prochainAchat, repereDe, suivants, titreCourt } from '../../src/domain/finance/upgradeForecast';

type Detail = Partial<NonNullable<FinancialPlan['upgrade']>>;
const projet = (id: string, title: string, cents: number | null, o: { date?: string; status?: FinancialPlan['status']; stage?: NonNullable<FinancialPlan['upgrade']>['stage']; timing?: NonNullable<FinancialPlan['upgrade']>['timing']; detail?: Detail } = {}): FinancialPlan => ({
  id, title, date: o.date ?? '', amountCents: cents ?? 0, direction: 'out', category: 'materiel', source: 'equipment', status: o.status ?? 'draft', createdAt: '2026-11-01T00:00:00.000Z',
  upgrade: { version: 1, timing: o.timing ?? 'later', stage: o.stage ?? 'idea', budgetKnown: cents != null, datePrecision: 'month', estimateSource: 'estimate', purchaseCents: cents ?? undefined, deliveryCents: 0, installationCents: 0, ...o.detail },
});
const mois = (m: string, balance: number | null, items: ForecastItem[] = []): ForecastMonth => ({ month: m, incomeCents: 0, expenseCents: 0, committedCents: 0, projectedCents: 0, balanceCents: balance, items });
const marche = (planId: string, date: string, amountCents: number): ForecastItem => ({ id: `${planId}:${date}`, planId, date, label: planId, amountCents, direction: 'out', source: 'equipment', category: 'materiel' });

const HOTTE = projet('H', 'Installation de la hotte', 90_000, { date: '2027-03-01', status: 'active', stage: 'ready', timing: 'soon' });
const B100 = projet('B', 'B100 aio brewtool', 320_000, { date: '2027-04-01', status: 'active', stage: 'ready', timing: 'later', detail: { deliveryCents: undefined, installationCents: undefined } });
const EVIER = projet('E', '2e évier', null, { stage: 'research', timing: 'soon' });
const ARMOIRE = projet('A', 'Armoire extérieure', 45_000, { stage: 'ready', timing: 'next' });
const SOLS = projet('S', 'Seconde passe sur les sols', null, { stage: 'quote', timing: 'next' });

describe('upgradeForecast : le prochain achat', () => {
  it('est le projet posé dont le mois vient en premier, quel que soit l’ordre des horizons', () => {
    expect(prochainAchat([B100, ARMOIRE, HOTTE, EVIER])?.id).toBe('H');
    expect(prochainAchat([B100, HOTTE])?.id).toBe('H');
  });
  it('à mois égal, l’horizon départage (bientôt avant plus tard)', () => {
    const a = projet('X', 'Pompe', 10_000, { date: '2027-03-01', status: 'active', timing: 'later' });
    const b = projet('Y', 'Cuve', 10_000, { date: '2027-03-01', status: 'active', timing: 'soon' });
    expect(prochainAchat([a, b])?.id).toBe('Y');
  });
  it('sans prévisions (rien de posé : idées, brouillon daté, projet sans prix), il n’y en a pas', () => {
    const brouillonDate = projet('D', 'Brouillon daté', 20_000, { date: '2027-02-01', status: 'draft' });
    const actifSansPrix = projet('N', 'Sans prix', null, { date: '2027-02-01', status: 'active' });
    expect(prochainAchat([EVIER, ARMOIRE, SOLS, brouillonDate, actifSansPrix])).toBeNull();
    expect(prochainAchat([])).toBeNull();
    expect(estPose(brouillonDate)).toBe(false);
    expect(estPose(actifSansPrix)).toBe(false);
  });
  it('ignore les projets réalisés ou archivés', () => {
    expect(prochainAchat([projet('F', 'Fait', 1000, { date: '2027-01-01', status: 'completed' }), projet('R', 'Rangé', 1000, { date: '2027-01-01', status: 'cancelled' })])).toBeNull();
    expect(avenir([projet('F', 'Fait', 1000, { status: 'completed' }), EVIER]).map(p => p.id)).toEqual(['E']);
  });
});

describe('upgradeForecast : les suivants', () => {
  it('« au moins » : la somme des seuls prix connus, les prix manquants comptés à part (jamais 0)', () => {
    const s = suivants([HOTTE, EVIER, SOLS, ARMOIRE, B100], HOTTE);
    expect(s.lignes.map(p => p.id)).toEqual(['E', 'A', 'S', 'B']);
    expect(s.connuCents).toBe(45_000 + 320_000);
    expect(s.inconnus).toBe(2);
  });
  it('à horizon égal, l’ordre de saisie du brasseur prime sur l’ordre alphabétique (sa maquette : sols avant armoire)', () => {
    const sols = { ...SOLS, createdAt: '2026-11-01T10:00:00.000Z' }, armoire = { ...ARMOIRE, createdAt: '2026-11-01T10:00:01.000Z' };
    expect(suivants([armoire, sols], null).lignes.map(p => p.id)).toEqual(['S', 'A']);
    // même saisie : le nom départage
    expect(suivants([SOLS, ARMOIRE], null).lignes.map(p => p.id)).toEqual(['A', 'S']);
  });
  it('tous chiffrés : plus aucun inconnu', () => {
    expect(suivants([ARMOIRE, B100], null)).toMatchObject({ connuCents: 365_000, inconnus: 0 });
  });
  it('aucun prix connu : la somme est 0 mais « inconnus » dit pourquoi', () => {
    expect(suivants([EVIER, SOLS], null)).toMatchObject({ connuCents: 0, inconnus: 2 });
  });
});

describe('upgradeForecast : marches et cumul par mois', () => {
  it('chaque mois porte sa marche, le cumul s’additionne, une marche hors projet ne compte pas', () => {
    const items = [marche('H', '2027-03-15', 90_000), marche('B', '2027-04-01', 320_000), { ...marche('T', '2027-03-01', 50_000), source: 'trend' as const }];
    expect(marchesParMois(items, ['2027-02', '2027-03', '2027-04', '2027-05'])).toEqual([
      { mois: '2027-02', sortiesCents: 0, cumulCents: 0 },
      { mois: '2027-03', sortiesCents: 90_000, cumulCents: 90_000 },
      { mois: '2027-04', sortiesCents: 320_000, cumulCents: 410_000 },
      { mois: '2027-05', sortiesCents: 0, cumulCents: 410_000 },
    ]);
  });
});

describe('upgradeForecast : effet sur la caisse de fin de mois', () => {
  const months = [mois('2027-02', 440_000), mois('2027-03', 425_000), mois('2027-04', 130_000), mois('2027-05', 140_000)];
  const items = [marche('H', '2027-03-01', 90_000), marche('B', '2027-04-01', 320_000)];
  it('le « sans » rend au solde ce que le projet lui prend', () => {
    expect(effetProjet(HOTTE, [HOTTE], months, items)).toMatchObject({ mois: '2027-03', avecCents: 425_000, sansCents: 515_000, marcheCents: 90_000, auPlus: false });
  });
  it('« au plus » dès qu’un prix manque : livraison et installation non chiffrées', () => {
    expect(partsInconnues(B100)).toBe(2);
    const e = effetProjet(B100, [HOTTE, B100], months, items)!;
    expect(e).toMatchObject({ mois: '2027-04', avecCents: 130_000, sansCents: 130_000 + 320_000, auPlus: true });
  });
  it('un prix inconnu d’un projet posé plus tôt rend aussi « au plus » la caisse des mois suivants', () => {
    const e = effetProjet(HOTTE, [HOTTE, B100], months, items)!;
    expect(e.auPlus).toBe(false);
    const hotteIncomplete = { ...HOTTE, upgrade: { ...HOTTE.upgrade!, installationCents: undefined } };
    expect(effetProjet(B100, [hotteIncomplete, B100], months, items)!.auPlus).toBe(true);
  });
  it('caisse inconnue : ni « avec » ni « sans », jamais 0', () => {
    const e = effetProjet(HOTTE, [HOTTE], [mois('2027-03', null)], items)!;
    expect(e.avecCents).toBeNull();
    expect(e.sansCents).toBeNull();
  });
  it('sans mois posé, ou mois hors de la prévision : pas d’effet inventé', () => {
    expect(effetProjet(EVIER, [EVIER], months, items)).toBeNull();
    expect(effetProjet(projet('L', 'Loin', 1000, { date: '2030-01-01', status: 'active' }), [], months, items)).toBeNull();
  });
});

describe('upgradeForecast : repères, échelle, noms courts', () => {
  it('trois repères tirés des étapes existantes', () => {
    expect(repereDe(EVIER)).toBe('chercher');
    expect(repereDe(projet('I', 'Idée', null, { stage: 'idea' }))).toBe('chercher');
    expect(repereDe(SOLS)).toBe('devis');
    expect(repereDe(ARMOIRE)).toBe('prix');
    expect(repereDe(projet('P', 'Prêt sans prix', null, { stage: 'ready' }))).toBe('chercher');
  });
  it('le mois posé vient de la date, sinon null', () => {
    expect(moisDePlan(HOTTE)).toBe('2027-03');
    expect(moisDePlan(EVIER)).toBeNull();
  });
  it('l’échelle de la maquette : 5 000 francs → pas de 2 000, sommet 6 000, repères 0, 2 000, 4 000', () => {
    expect(echelleCaisse([418_100, 440_000, 500_000, 425_000, null])).toEqual({ lo: 0, hi: 600_000, pas: 200_000, ticks: [0, 200_000, 400_000] });
  });
  it('un solde négatif étend le champ sous zéro, zéro reste un repère', () => {
    const e = echelleCaisse([100_000, -250_000]);
    expect(e.lo).toBeLessThan(0);
    expect(e.ticks).toContain(0);
    expect(e.hi).toBeGreaterThanOrEqual(100_000);
  });
  it('sans aucune valeur, un champ minimal (zéro, un pas) et aucune division par zéro', () => {
    const e = echelleCaisse([null, null]);
    expect(e.hi).toBeGreaterThan(0);
    expect(e.hi - e.lo).toBeGreaterThan(0);
  });
  it('le nom court du repère', () => {
    expect(titreCourt('Installation de la hotte')).toBe('hotte');
    expect(titreCourt('B100 aio brewtool')).toBe('B100');
    expect(titreCourt('Armoire extérieure')).toBe('Armoire');
    expect(titreCourt('Pose du thermoplongeur')).toBe('thermoplong…');
  });
});

/* ───── kyh1 : anneaux d'étape, gestes de prix et de devis, réalisé dérivé des factures ───── */
import { anneauDe, avecDevisDemande, avecPrix, dateFacture, estRealise, parsePrix } from '../../src/domain/finance/upgradeRing';
import type { FinanceTransaction, FinancialPayment } from '../../src/domain/finance/types';

describe('upgradeRing : l’anneau se lit des étapes existantes', () => {
  it('Idée et À étudier : Besoin noté, prix ou devis à chercher', () => {
    for (const stage of ['idea', 'research'] as const) expect(anneauDe(projet('X', 'Évier', null, { stage }))).toMatchObject({ arcs: ['plein', 'vide', 'vide'], ton: 'mut', icone: 'search' });
  });
  it('Devis en cours : deux tiers, ton ocre, arc en cours', () => {
    expect(anneauDe(SOLS)).toMatchObject({ arcs: ['plein', 'cours', 'vide'], ton: 'att', icone: 'mail', libelle: expect.stringContaining('devis demandé') });
  });
  it('Prêt à acheter avec prix : prix trouvé ; sans prix : retombe sur « à chercher »', () => {
    expect(anneauDe(ARMOIRE)).toMatchObject({ arcs: ['plein', 'plein', 'vide'], ton: 'hop', icone: 'tag' });
    expect(anneauDe(projet('Z', 'Pompe', null, { stage: 'ready' }))).toMatchObject({ arcs: ['plein', 'vide', 'vide'], icone: 'search' });
  });
  it('Réalisé : trois tiers', () => { expect(anneauDe(ARMOIRE, true)).toMatchObject({ etape: 3, arcs: ['plein', 'plein', 'plein'] }); });
});
describe('upgradeRing : prix et devis', () => {
  it('parsePrix lit « 1 234,50 », « 1\'234.5 » et refuse vide, nul, négatif, texte (jamais 0)', () => {
    expect(parsePrix('1 234,50')).toBe(123450); expect(parsePrix("1'234.5")).toBe(123450); expect(parsePrix('900')).toBe(90000);
    for (const t of ['', '0', '-5', 'abc', '12,345']) expect(parsePrix(t)).toBeNull();
  });
  it('avecPrix chiffre l’achat, garde livraison et installation, passe à Prêt à acheter', () => {
    const p = avecPrix(EVIER, 85_000);
    expect(p).toMatchObject({ amountCents: 85_000, upgrade: { budgetKnown: true, purchaseCents: 85_000, stage: 'ready' } });
    expect(avecPrix(SOLS, 240_000).upgrade).toMatchObject({ estimateSource: 'quote', stage: 'ready' });
  });
  it('avecDevisDemande note le fournisseur et l’étape, le prix reste inconnu', () => {
    const p = avecDevisDemande(EVIER, 'Inox Gruyère');
    expect(p).toMatchObject({ vendor: 'Inox Gruyère', amountCents: 0, upgrade: { stage: 'quote', budgetKnown: false } });
  });
});
describe('upgradeRing : réalisé = dépense liée payée en entier', () => {
  const tx = (id: string, planId: string, cents: number, date = '2026-11-14'): FinanceTransaction => ({ id, date, description: 'Facture', category: 'materiel', subcategory: '', amountHT: cents / 100, amountTTC: cents / 100, tvaRate: 0, tvaAmount: 0,
    finance: { version: 1, kind: 'expense', amountCents: cents, planId, paymentStatus: 'unpaid', lines: [{ id: '1', kind: 'equipment', description: 'Achat', amountCents: cents }] } } as FinanceTransaction);
  const pay = (transactionId: string, amountCents: number): FinancialPayment => ({ id: `P-${transactionId}`, transactionId, date: '2026-11-14', amountCents, direction: 'out', method: 'bank', recordedAt: '2026-11-14T10:00:00.000Z' } as FinancialPayment);
  it('sans facture : non ; facture non payée : non ; payée en entier : oui', () => {
    expect(estRealise(B100, [], [])).toBe(false);
    expect(estRealise(B100, [tx('T', 'B', 320_000)], [])).toBe(false);
    expect(estRealise(B100, [tx('T', 'B', 320_000)], [pay('T', 100_000)])).toBe(false);
    expect(estRealise(B100, [tx('T', 'B', 320_000)], [pay('T', 320_000)])).toBe(true);
  });
  it('une facture plus petite que le budget ne suffit pas : « Marquer comme réalisé » reste au brasseur', () => {
    expect(estRealise(B100, [tx('T', 'B', 100_000)], [pay('T', 100_000)])).toBe(false);
  });
  it('dateFacture rend la dernière date de facture liée, sinon null', () => {
    expect(dateFacture(B100, [tx('T1', 'B', 1, '2026-11-02'), tx('T2', 'B', 1, '2026-11-14'), tx('T3', 'AUTRE', 1, '2026-12-01')])).toBe('2026-11-14');
    expect(dateFacture(B100, [])).toBeNull();
  });
});
