// Lecture SIMULÉE du ticket de bricolage du brasseur (09.11) : 29 lignes dont les montants font 277,60, total imprimé 352,05, payé TWINT 352,05.
// Fournisseur fictif, désignations génériques, EAN inventés : aucune donnée réelle (ni photo, ni adresse). Mêmes montants que son ticket.
const LIGNES: Array<[string, number]> = [
  ['PEINTURE MURALE BLANCHE 10L', 86.85], ['CHIFFON MICROFIBRE', 1.2], ['VIS PEITURE BOIS 4440', 5.2], ['BAC A PEINTURE', 8.85], ['TURBINE RELAIS', 8.85],
  ['PINCEAU PLAT 40MM', 4.55], ['BROSSE LATTE 60', 5.5], ['BROSSE ANGLE', 4.8], ['POLATRE ROULEAU 18CM', 14.5], ['LUNE DE PONCAGE', 4.4],
  ['CHARNIERE ACIER 40MM', 7.95], ['ROULEUR PEINTURE', 3.5], ['RUBAN DE MASQUAGE SOL', 3.4], ['COLLE DE CONTACT 120G', 4.5], ['CUTTER 18MM', 5.2],
  ['APPRET ORTXESSEL 1L', 5.2], ['TREROOVER O ELEETRICKEN', 2.4], ['MULTIBROSSE 500', 18.9], ['CHANTILLES NO L5100', 4.25], ['ETERE MULTI', 11.5],
  ['METRE RUBAN 5M', 6.5], ['GANTS DE TRAVAIL', 8.5], ['OPSHGE CHANTIER', 7.9], ['CRATONS DE CHARPENTIER', 3.1], ['SERRE-JOINT 150MM', 2.45],
  ['CRATTE-VITRES', 14.9], ['JEU DE CLES ALLEN', 8.9], ['BROSSE RADIATEUR 35MM', 8.9], ['ADHESIF DOUBLE FACE', 4.95],
];
// SERRE-JOINT 150MM doit valoir 14,90 (sa ligne se trouve par « 14,90 ») : on échange les deux montants pour que le ticket garde la même somme.
LIGNES[24][1] = 14.9;
LIGNES[25][1] = 2.45;

export const LIGNES_TICKET = LIGNES;
export const SOMME_LIGNES = 277.6;
export const TOTAL_IMPRIME = 352.05;

export function lectureTicket(over: Record<string, unknown> = {}) {
  const items = LIGNES.map(([name, amount], i) => ({
    id: `line-${i + 1}`, name, kind: 'other', quantity: 1, unit: 'pièce', price: amount, amountTTC: amount,
    reference: `40${String(55556000 + i * 137).padStart(11, '0')}`.slice(0, 13), evidence: `${name} ${amount.toFixed(2)}`,
  }));
  return {
    vendor: 'Brico Fictif SA', date: '02.11.2026', currency: 'CHF', invoiceNumber: '', description: 'Travaux du local', category: 'renovation', subcategory: '',
    amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: TOTAL_IMPRIME, issues: [] as string[], items,
    paymentEvidence: 'paid', paymentMethod: 'twint', amountPaid: TOTAL_IMPRIME, printedLineCount: 29, countedAmounts: 29,
    review: { status: 'checked', findings: [], readers: 3 },
    controls: { lines: { checked: 29, failed: 0, skipped: 0, skippedIds: [] as string[] }, sum: { statut: 'ecart', base: 'TTC' }, vat: { statut: 'non-verifiable', base: 'TTC' }, totals: { statut: 'non-verifiable' } },
    ...over,
  };
}

// ---- Lectures rejouées du banc b1 (voies/b1, 09.11), ANONYMISÉES : mêmes formes et mêmes montants, noms et fournisseur fictifs. ----
const construire = (lignes: Array<[string, number, string?]>, over: Record<string, unknown> = {}) => {
  const items = lignes.map(([name, amount, kind], i) => ({
    id: `line-${i + 1}`, name, kind: kind ?? 'other', quantity: 1, unit: 'pièce', price: amount, amountTTC: amount, reference: '', evidence: `${name} ${amount.toFixed(2)}`,
  }));
  const somme = Math.round(items.reduce((t, i) => t + i.amountTTC, 0) * 100) / 100;
  return {
    vendor: 'Brico Fictif SA', date: '02.11.2026', currency: 'CHF', invoiceNumber: '', description: 'Travaux du local', category: 'renovation', subcategory: '',
    amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: somme, issues: [] as string[], items, paymentEvidence: 'paid', paymentMethod: 'twint', printedLineCount: items.length,
    review: { status: 'checked', findings: [], readers: 3 },
    controls: { lines: { checked: items.length, failed: 0, skipped: 0, skippedIds: [] as string[] }, sum: { statut: 'ecart', base: 'TTC' }, vat: { statut: 'non-verifiable', base: 'TTC' }, totals: { statut: 'non-verifiable' } },
    ...over,
  };
};
/** bauhaus-tache : la lecture finale rend 23 lignes sur 29 (somme 234,40), le modèle annonce 23 (il compte ce qu'il a transcrit), le total imprimé est 352,05. */
export const lectureTacheFinale = (over: Record<string, unknown> = {}) => construire(LIGNES_TICKET.slice(0, 23), { amountTTC: TOTAL_IMPRIME, printedLineCount: 23, ...over });
/** La lecture qui en avait 28 (les trois dernières lignes comprises, une de moins que la vérité) : les lignes « vues par une seule lecture » (34,30 CHF). */
export const lectureTacheProvisoire = () => construire(LIGNES_TICKET.slice(0, 29).filter((_, i) => i !== 27), { amountTTC: TOTAL_IMPRIME, printedLineCount: 28 });
/** sunstore-2 : 3 articles et 2 rabais lus comme des lignes (5 lignes), le modèle annonce 5 ; 151,83 − 2,58 = 149,25. Libellé de taxe imprimé sous l'article. */
export const lectureRabais = () => construire([['VACCIN FICTIF A', 82.33], ['VACCIN FICTIF B', 19.5, undefined], ['H21 CONSULTATION', 50], ['NoVatTax - 0%', -1.29, 'discount'], ['NoVatTax - 0%', -1.29, 'discount']].map(
  ([n, a, k]) => [n, a, k] as [string, number, string?]), { amountTTC: 149.25, printedLineCount: 5, amountPaid: undefined });
