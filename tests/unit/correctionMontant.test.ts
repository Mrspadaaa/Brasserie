import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../src/types';
import type { FinancialPayment } from '../../src/domain/finance/types';
import { anneesCloses, choixPertinent, effetCorrection, erreurNouveauMontant, planCorrection, verrouMontant } from '../../src/domain/finance/correctionMontant';

const piece = (cents: number, extra: Partial<Transaction> = {}): Transaction => ({
  id: 'T-1', date: '09.11.2026', description: 'Nettoyant alcalin', category: 'nettoyage', subcategory: 'CIP',
  amountHT: cents / 100, tvaRate: 0, tvaAmount: 0, amountTTC: cents / 100,
  finance: { version: 1, kind: 'expense', amountCents: cents, lines: [] }, ...extra
});
const paiement = (id: string, cents: number, date = '2026-11-09', extra: Partial<FinancialPayment> = {}): FinancialPayment =>
  ({ id, transactionId: 'T-1', date, amountCents: cents, direction: 'out', method: 'bank', recordedAt: `${date}T08:00:00.000Z`, ...extra });
const contre = (p: FinancialPayment): FinancialPayment =>
  ({ ...p, id: `CONTRE-${p.id}`, direction: p.direction === 'in' ? 'out' : 'in', reversalOfId: p.id });

describe('planCorrection : la suite d’écritures, en centimes', () => {
  const p1 = paiement('PAI-1', 4200);

  it('même montant : rien à écrire', () => {
    expect(planCorrection(piece(4200), [p1], 4200, 'suit')).toEqual([]);
  });
  it('hausse + le paiement suit : le montant, puis un paiement de la différence', () => {
    expect(planCorrection(piece(4200), [p1], 4550, 'suit')).toEqual([
      { type: 'montant', cents: 4550 },
      { type: 'paiement', cents: 350, direction: 'out', method: 'bank' }
    ]);
  });
  it('hausse + reste à payer : le montant seul', () => {
    expect(planCorrection(piece(4200), [p1], 4550, 'reste')).toEqual([{ type: 'montant', cents: 4550 }]);
  });
  it('baisse sous le payé : contre-paiement du dernier, montant, puis paiement du nouveau montant', () => {
    expect(planCorrection(piece(4200), [p1], 4000, 'suit')).toEqual([
      { type: 'contre', paiementId: 'PAI-1' },
      { type: 'montant', cents: 4000 },
      { type: 'paiement', cents: 4000, direction: 'out', method: 'bank', date: '2026-11-09' }
    ]);
  });
  it('baisse sous le payé + reste à payer : contre-paiement et montant, aucun nouveau paiement', () => {
    expect(planCorrection(piece(4200), [p1], 4000, 'reste')).toEqual([
      { type: 'contre', paiementId: 'PAI-1' },
      { type: 'montant', cents: 4000 }
    ]);
  });
  it('baisse sous le payé, deux paiements : on n’inverse que le dernier quand le reste tient', () => {
    const a = paiement('PAI-A', 3000, '2026-11-05'), b = paiement('PAI-B', 1200, '2026-11-09');
    expect(planCorrection(piece(4200), [a, b], 4000, 'suit')).toEqual([
      { type: 'contre', paiementId: 'PAI-B' },
      { type: 'montant', cents: 4000 },
      { type: 'paiement', cents: 1000, direction: 'out', method: 'bank', date: '2026-11-09' }
    ]);
  });
  it('baisse sous le payé, deux paiements : inverse les deux quand le dernier ne suffit pas', () => {
    const a = paiement('PAI-A', 3000, '2026-11-05'), b = paiement('PAI-B', 1200, '2026-11-09');
    const etapes = planCorrection(piece(4200), [a, b], 2500, 'suit');
    expect(etapes.map(e => e.type)).toEqual(['contre', 'contre', 'montant', 'paiement']);
    expect(etapes[0]).toEqual({ type: 'contre', paiementId: 'PAI-B' });
    expect(etapes[1]).toEqual({ type: 'contre', paiementId: 'PAI-A' });
    expect(etapes[3]).toMatchObject({ cents: 2500 });
  });
  it('M2 : une baisse « suit » date le remplacement du dernier paiement inversé (une correction, pas un virement) ; une hausse « suit » n’a pas de date (aujourd’hui)', () => {
    const a = paiement('PAI-A', 3000, '2026-11-05'), b = paiement('PAI-B', 1200, '2026-11-09');
    const baisse = planCorrection(piece(4200), [a, b], 2500, 'suit').at(-1);
    expect(baisse).toMatchObject({ type: 'paiement', date: '2026-11-09' });
    const hausse = planCorrection(piece(4200), [p1], 4550, 'suit').at(-1) as { date?: string };
    expect(hausse.date).toBeUndefined();
  });
  it('baisse au-dessus du payé (pièce partielle) : le montant seul', () => {
    const partiel = paiement('PAI-1', 2000);
    expect(planCorrection(piece(4200), [partiel], 3000, 'suit')).toEqual([{ type: 'montant', cents: 3000 }]);
  });
  it('pièce non payée : le montant seul, quel que soit le choix', () => {
    expect(planCorrection(piece(4200), [], 5000, 'suit')).toEqual([{ type: 'montant', cents: 5000 }]);
    expect(planCorrection(piece(4200), [], 1000, 'reste')).toEqual([{ type: 'montant', cents: 1000 }]);
  });
  it('pièce partielle en hausse : le montant seul (rien n’est « soldé » qui doive suivre)', () => {
    expect(planCorrection(piece(4200), [paiement('PAI-1', 2000)], 5000, 'suit')).toEqual([{ type: 'montant', cents: 5000 }]);
  });
  it('un paiement déjà inversé ne compte plus et ne s’inverse pas deux fois', () => {
    const faux = paiement('PAI-0', 4200, '2026-11-01'), bon = paiement('PAI-1', 4200, '2026-11-09');
    const etapes = planCorrection(piece(4200), [faux, contre(faux), bon], 4000, 'suit');
    expect(etapes[0]).toEqual({ type: 'contre', paiementId: 'PAI-1' });
    expect(etapes.filter(e => e.type === 'contre')).toHaveLength(1);
  });
  it('une recette garde son sens « in »', () => {
    const entrant = paiement('PAI-1', 4200, '2026-11-09', { direction: 'in' });
    const vente = piece(4200, { category: 'recettes', finance: { version: 1, kind: 'income', amountCents: 4200, lines: [] } });
    expect(planCorrection(vente, [entrant], 4550, 'suit')[1]).toEqual({ type: 'paiement', cents: 350, direction: 'in', method: 'bank' });
  });
  it('montant invalide : erreur', () => {
    expect(() => planCorrection(piece(4200), [p1], 0, 'suit')).toThrow(/invalide/);
    expect(() => planCorrection(piece(4200), [p1], 12.5, 'suit')).toThrow(/invalide/);
    expect(() => planCorrection(piece(4200), [p1], -100, 'suit')).toThrow(/invalide/);
  });
  it('un paiement d’une autre pièce n’entre jamais dans le plan', () => {
    const autre = { ...p1, transactionId: 'AUTRE' };
    expect(planCorrection(piece(4200), [autre], 4000, 'suit')).toEqual([{ type: 'montant', cents: 4000 }]);
  });
});

describe('effetCorrection : ce que le plan laisse', () => {
  const p1 = paiement('PAI-1', 4200);
  it('hausse + suit : payé = nouveau montant, reste 0', () => {
    const e = planCorrection(piece(4200), [p1], 4550, 'suit');
    expect(effetCorrection(piece(4200), [p1], e)).toEqual({ montantCents: 4550, payeCents: 4550, resteCents: 0 });
  });
  it('hausse + reste : payé 42,00, reste 3,50 (m5mo-c)', () => {
    const e = planCorrection(piece(4200), [p1], 4550, 'reste');
    expect(effetCorrection(piece(4200), [p1], e)).toEqual({ montantCents: 4550, payeCents: 4200, resteCents: 350 });
  });
  it('baisse + suit : payé = nouveau montant', () => {
    const e = planCorrection(piece(4200), [p1], 4000, 'suit');
    expect(effetCorrection(piece(4200), [p1], e)).toEqual({ montantCents: 4000, payeCents: 4000, resteCents: 0 });
  });
  it('baisse + reste : le réglé retombe à 0 et tout le montant reste à payer', () => {
    const e = planCorrection(piece(4200), [p1], 4000, 'reste');
    expect(effetCorrection(piece(4200), [p1], e)).toEqual({ montantCents: 4000, payeCents: 0, resteCents: 4000 });
  });
});

describe('choixPertinent', () => {
  it('seulement pour une pièce entièrement réglée', () => {
    expect(choixPertinent(piece(4200), [paiement('PAI-1', 4200)])).toBe(true);
    expect(choixPertinent(piece(4200), [paiement('PAI-1', 2000)])).toBe(false);
    expect(choixPertinent(piece(4200), [])).toBe(false);
  });
});

describe('verrouMontant : seulement une année close ou archivée, ou une pièce annulée', () => {
  const ouvert = { anneesCloturees: [] as number[], archivee: false };
  it('une pièce payée dont l’année est ouverte se modifie', () => {
    expect(verrouMontant(piece(4200), ouvert)).toBeNull();
  });
  it('année close : verrou expliqué en une ligne', () => {
    const raison = verrouMontant(piece(4200), { anneesCloturees: [2026], archivee: false });
    expect(raison).toMatch(/2026 clôturé/);
    expect(raison).not.toMatch(/\n/);
  });
  it('une clôture d’une autre année ne verrouille pas', () => {
    expect(verrouMontant(piece(4200), { anneesCloturees: [2025], archivee: false })).toBeNull();
  });
  it('année archivée : verrou', () => {
    expect(verrouMontant(piece(4200), { anneesCloturees: [], archivee: true })).toMatch(/archivé/);
  });
  it('pièce annulée : verrou', () => {
    const annulee = piece(4200, { finance: { version: 1, kind: 'expense', amountCents: 4200, lines: [], voidedAt: '2026-11-10T08:00:00.000Z' } });
    expect(verrouMontant(annulee, ouvert)).toMatch(/annulée/);
  });
  it('une date ISO (2026-11-09) est lue comme sa version JJ.MM.AAAA', () => {
    expect(verrouMontant(piece(4200, { date: '2026-11-09' }), { anneesCloturees: [2026], archivee: false })).toMatch(/2026/);
  });
  it('M3 : l’année de la nouvelle date compte aussi (une pièce ne passe pas vers un exercice clos)', () => {
    const clos = { anneesCloturees: [2025], archivee: false };
    expect(verrouMontant(piece(4200), clos)).toBeNull();
    expect(verrouMontant(piece(4200), { ...clos, dateNouvelle: '03.04.2025' })).toMatch(/2025 clôturé/);
    expect(verrouMontant(piece(4200), { ...clos, dateNouvelle: '2025-04-03' })).toMatch(/2025 clôturé/);
    expect(verrouMontant(piece(4200), { ...clos, dateNouvelle: '09.11.2026' })).toBeNull();
    expect(verrouMontant(piece(4200), { ...ouvert, dateNouvelle: '03.04.2024', archiveeNouvelleDate: true })).toMatch(/2024 archivé/);
    expect(verrouMontant(piece(4200), { ...ouvert, dateNouvelle: 'pas une date' })).toBeNull();
  });
  it('plusieurs lignes : le total est leur somme, verrou expliqué', () => {
    const lignes = [{ description: 'A', amountCents: 2000 }, { description: 'B', amountCents: 2200 }] as never;
    const multi = piece(4200, { finance: { version: 1, kind: 'expense', amountCents: 4200, lines: lignes } });
    expect(verrouMontant(multi, ouvert)).toMatch(/2 lignes/);
  });
});

describe('erreurNouveauMontant : les avoirs liés', () => {
  it('refuse un montant sous la somme des avoirs actifs', () => {
    const avoir = piece(1000, { id: 'A-1', finance: { version: 1, kind: 'refund', amountCents: 1000, lines: [], refundOfId: 'T-1' } });
    expect(erreurNouveauMontant(piece(4200), 800, [piece(4200), avoir])).toMatch(/avoirs/);
    expect(erreurNouveauMontant(piece(4200), 1000, [piece(4200), avoir])).toBeNull();
  });
});

describe('anneesCloses : une clôture confirmée, pas un brouillon (M4)', () => {
  const brouillon = { year: 2026 };
  const confirmee = { year: 2025, report: { generatedAt: '2026-01-05T08:00:00.000Z' } };
  it('un brouillon d’inventaire ne ferme aucune année', () => {
    expect(anneesCloses([brouillon])).toEqual([]);
  });
  it('une clôture figée (report) ferme son année, une fois même avec plusieurs versions', () => {
    expect(anneesCloses([brouillon, confirmee, { ...confirmee }])).toEqual([2025]);
  });
  it('branché sur le verrou : brouillon 2026 ne verrouille pas, clôture confirmée 2026 verrouille', () => {
    expect(verrouMontant(piece(4200), { anneesCloturees: anneesCloses([brouillon]), archivee: false })).toBeNull();
    expect(verrouMontant(piece(4200), { anneesCloturees: anneesCloses([{ year: 2026, report: {} }]), archivee: false })).toMatch(/2026 clôturé/);
  });
});
