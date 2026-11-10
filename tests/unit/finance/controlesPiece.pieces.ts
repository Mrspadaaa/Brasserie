// Lectures SIMULÉES et ANONYMISÉES des quatre pièces pièges du brasseur (mission 2026-11-09-depense-totaux, vérité : voies/b1/VOIE.md et RESULTAT.md).
// Fournisseurs fictifs, désignations génériques, EAN construits : aucune donnée réelle (ni photo, ni adresse, ni nom). Mêmes montants que les pièces.
import type { DepenseConnue, LectureControlee, LigneControlee } from '../../../src/domain/finance/controlesPiece';

/** Un EAN-13 valide construit sur 12 chiffres (formule GS1, écrite ici à part du module testé). */
export function eanValide(douze: string): string {
  const somme = [...douze].reduce((s, d, i) => s + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return douze + String((10 - (somme % 10)) % 10);
}
/** Le même EAN avec son dernier chiffre changé : un chiffre mal lu. */
export const eanFaux = (valide: string) => valide.slice(0, 12) + String((Number(valide[12]) + 1) % 10);

const ligne = (name: string, montant: number, i: number, extra: Partial<LigneControlee> = {}): LigneControlee => ({
  name, kind: 'other', quantity: 1, unit: '', price: montant, amountTTC: montant, vatCode: '', reference: eanValide(`76123${String(100000 + i * 37).padStart(7, '0')}`), ...extra,
});

// --- BAUHAUS (fictif : « Brico Fictif SA »), ticket taché : 29 lignes, somme 277,60, total 352,05, payé TWINT 352,05 ---
const MONTANTS_TACHE = [86.85, 1.2, 5.2, 8.85, 8.85, 4.55, 5.5, 4.8, 14.5, 4.4, 7.95, 3.5, 3.4, 4.5, 5.2, 5.2, 2.4, 18.9, 4.25, 11.5, 6.5, 8.5, 7.9, 3.1, 14.9, 2.45, 8.9, 8.9, 4.95];
export const LIGNES_TACHE_29: LigneControlee[] = MONTANTS_TACHE.map((m, i) => ligne(`Article T${String(i + 1).padStart(2, '0')}`, m, i));
/** Ce que la vraie lecture a rendu (banc b1) : les six dernières lignes, juste avant « Montant en EUR », sont perdues (3,10 · 14,90 · 2,45 · 8,90 · 8,90 · 4,95 = 43,20). */
export const LIGNES_TACHE_23: LigneControlee[] = LIGNES_TACHE_29.slice(0, 23);
export const SOMME_TACHE_29 = 277.6, SOMME_TACHE_23 = 234.4, TOTAL_BAUHAUS = 352.05;

const entete = { vendor: 'Brico Fictif SA', date: '02.11.2026', printedTime: '12:31', amountTTC: TOTAL_BAUHAUS, amountPaid: TOTAL_BAUHAUS, terminalAmount: TOTAL_BAUHAUS, paymentMethod: 'twint', vat: [], tvaRate: null, tvaAmount: null };
const ecartees = [
  { label: 'Montant en EUR', amount: 370.92, kind: 'foreign_currency' as const },
  { label: 'TWINT', amount: TOTAL_BAUHAUS, kind: 'payment' as const },
];
export const tacheComplete = (): LectureControlee => ({
  ...entete, items: LIGNES_TACHE_29.map(l => ({ ...l })), printedLineCount: 29, countedAmounts: 29, countedEans: 29, ignoredLines: ecartees.map(e => ({ ...e })),
  photoIncomplete: true, photoIncompleteNote: 'bas du ticket taché',
});
/** La lecture réelle : 23 lignes lues sur 29 ; la lecture a annoncé 23 lignes imprimées (circulaire), mais son comptage indépendant en trouve 29. */
export const tacheAsLue = (): LectureControlee => ({ ...tacheComplete(), items: LIGNES_TACHE_23.map(l => ({ ...l })), printedLineCount: 23 });

// --- BAUHAUS, copie du même ticket : 22 lignes (6,95 … 9,95), somme 136,65, même total, même date et heure ---
const AUTRES_COPIE = [3.5, 4.2, 5.95, 6.4, 7.8, 2.95, 8.5, 5.2, 4.75, 6.1, 3.85, 9.4, 5.5, 7.25, 4.6, 6.9, 3.3, 8.1, 5, 10.5];
export const MONTANTS_COPIE = [6.95, ...AUTRES_COPIE, 9.95];
export const LIGNES_COPIE: LigneControlee[] = MONTANTS_COPIE.map((m, i) => ligne(`Article C${String(i + 1).padStart(2, '0')}`, m, 200 + i));
export const SOMME_COPIE = 136.65;
/** La lecture réelle : le premier montant est lu 66,95 pour 6,95 (somme 196,65). */
export const copieAsLue = (): LectureControlee => ({
  ...entete, items: LIGNES_COPIE.map((l, i) => (i === 0 ? { ...l, price: 66.95, amountTTC: 66.95 } : { ...l })), printedLineCount: 22, countedAmounts: 22, countedEans: 22,
  ignoredLines: ecartees.map(e => ({ ...e })), photoIncomplete: false,
});
export const DEPENSE_TACHE: DepenseConnue = { id: 'tx-tache', vendor: 'Brico Fictif SA', date: '2026-11-02', heure: '12:31', total: TOTAL_BAUHAUS };

// --- Sun Store (fictif : « Sun Store Fictive SA »), deux tickets du même jour, un seul paiement TWINT de 163,85 ---
const sun = { vendor: 'Sun Store Fictive SA', date: '05.11.2026', paymentMethod: 'twint', terminalAmount: 163.85 };
export const sun1 = (): LectureControlee => ({
  ...sun, printedTime: '09:12', amountTTC: 14.6, amountPaid: 14.6, tvaRate: 0.026, tvaAmount: 0.37, vat: [{ code: 'A', rate: 0.026, base: 14.23, amount: 0.37 }],
  items: [ligne('Paracétamol 500 mg', 5.4, 300), ligne('Ibuprofène 400 mg', 9.2, 301)],
  printedLineCount: 2, printedItemCount: 2, countedAmounts: 2, countedEans: 2,
  ignoredLines: [{ label: 'Total EFT', amount: 163.85, kind: 'payment' }], photoIncomplete: false,
});
/** Trois articles, deux rabais lus comme lignes négatives (le ticket imprime 3 articles) ; brut 151,83, rabais −2,58, total 149,25, TVA 0 %. */
export const sun2 = (): LectureControlee => ({
  ...sun, printedTime: '09:14', amountTTC: 149.25, amountPaid: 149.25, tvaRate: 0, tvaAmount: 0, vat: [{ code: '', rate: 0, base: 149.25, amount: 0 }],
  items: [
    ligne('Vaccin grippe 1 dose', 26.68, 310),
    ligne('NoVatTax - 0%', -0.68, 311, { kind: 'discount', reference: '' }),
    ligne('Prestation vaccination', 50, 312, { quantity: 2, price: null }),
    ligne('Vaccin covid 1 dose', 75.15, 313),
    ligne('NoVatTax - 0%', -1.9, 314, { kind: 'discount', reference: '' }),
  ],
  printedLineCount: 5, printedItemCount: 3, countedAmounts: 5, countedEans: 3,
  ignoredLines: [{ label: 'Total EFT', amount: 163.85, kind: 'payment' }], photoIncomplete: false,
});
export const DEPENSE_SUN1: DepenseConnue = { id: 'tx-sun1', vendor: 'Sun Store Fictive', date: '2026-11-05', heure: '09:12', total: 14.6 };
export const DEPENSE_SUN2: DepenseConnue = { id: 'tx-sun2', vendor: 'Sun Store Fictive', date: '2026-11-05', heure: '09:14', total: 149.25 };
