// Voie c1 (09.11), côté serveur : les champs de lecture des contrôles croisés (schéma, consigne, normalisation, recollage, vote). Gemini n'est jamais appelé :
// une « lecture » est l'objet JSON que le modèle aurait rendu (Sun Store anonymisé : 163,85 au terminal, 14,60 de ticket).
import { describe, expect, it } from 'vitest';
import { normalizeInvoiceScan } from '../../../functions/src/invoiceScanCore';
import { mergeDecoded } from '../../../functions/src/invoiceMorceaux';
import { reconcileInvoiceVision, voterChampControle } from '../../../functions/src/invoiceVisionReview';
import { TASKS } from '../../../functions/src/prompts';
import { entete, ligne, trouve } from '../depense/lecture/aide';

const NOUVEAUX = ['amountPaid', 'terminalAmount', 'printedItemCount', 'countedAmounts', 'countedEans', 'printedTime', 'ignoredLines', 'photoIncomplete', 'photoIncompleteNote'];
const lire = (raw: any) => normalizeInvoiceScan(raw) as any;
const sun1 = (over: Record<string, unknown> = {}) => entete({
  vendor: 'Sun Store Fictive SA', documentType: 'receipt', paymentMethod: 'twint', date: '05.11.2026', amountTTC: 14.6, tvaRate: 0.026, tvaAmount: 0.37, printedLineCount: 2,
  items: [ligne({ name: 'Paracétamol 500 mg', kind: 'stock', unit: '', price: 5.4, amountTTC: 5.4 }), ligne({ name: 'Ibuprofène 400 mg', kind: 'stock', unit: '', price: 9.2, amountTTC: 9.2 })],
  amountPaid: 14.6, terminalAmount: 163.85, printedItemCount: 2, countedAmounts: 2, countedEans: 2, printedTime: '09:12',
  ignoredLines: [{ label: 'Total EFT', amount: 163.85, kind: 'payment' }], photoIncomplete: false, photoIncompleteNote: '', ...over,
});

describe('schéma et consigne de lecture des pièces', () => {
  const tache: any = TASKS.scanInvoice;
  it('les neuf champs sont au schéma, hors « required » (une lecture sans eux sort comme avant)', () => {
    for (const champ of NOUVEAUX) {
      expect(tache.schema.properties[champ], champ).toBeDefined();
      expect(tache.schema.required, champ).not.toContain(champ);
    }
    expect(tache.schema.properties.amountPaid).toMatchObject({ type: 'NUMBER', nullable: true });
    expect(tache.schema.properties.printedItemCount).toMatchObject({ type: 'INTEGER', nullable: true });
    expect(tache.schema.properties.photoIncomplete).toMatchObject({ type: 'BOOLEAN', nullable: true });
    expect(tache.schema.properties.ignoredLines.items.properties.kind.enum).toEqual(['foreign_currency', 'payment', 'subtotal', 'other']);
    expect(tache.schema.properties.ignoredLines.items.required).toEqual(['label', 'amount', 'kind']);
  });
  it('la consigne dit le payé du ticket, le terminal à part, le comptage indépendant, les lignes écartées et la photo', () => {
    expect(tache.system).toContain('amountPaid est le montant que le ticket dit avoir reçu ou payé POUR CE TICKET');
    expect(tache.system).toContain('terminalAmount');
    expect(tache.system).toContain('n’est PAS amountPaid');
    expect(tache.system).toContain('printedItemCount est le nombre d’articles que le document IMPRIME');
    expect(tache.system).toContain('Comptage indépendant');
    expect(tache.system).toContain('ignoredLines');
    expect(tache.system).toContain('Montant en EUR');
    expect(tache.system).toContain('photoIncomplete');
    expect(tache.system).toContain('elle reste dans items, kind discount, montant négatif, rendue IMMÉDIATEMENT sous l’article qu’elle réduit');
    // contrat 09.11 : le comptage des montants ne compte que les articles et les remises ; la quantité n’est jamais le code de TVA ; le montant de ligne est toujours rempli
    expect(tache.system).toContain('nombre de montants d’ARTICLES et de REMISES');
    expect(tache.system).toContain('ni le total, ni le montant reçu ou payé, ni le montant du terminal');
    expect(tache.system).toContain('est vatCode, JAMAIS la quantité');
    expect(tache.system).toContain('remplis-le TOUJOURS quand il est imprimé');
  });
  it('les champs d\'avant sont intacts (printedLineCount, paymentMethod, vat)', () => {
    for (const champ of ['printedLineCount', 'paymentMethod', 'vat']) expect(tache.schema.properties[champ]).toBeDefined();
  });
});

describe('normalisation : les champs sont gardés, jamais inventés', () => {
  it('Sun Store : le payé du ticket (14,60) n\'est pas le terminal (163,85)', () => {
    const r = lire(sun1());
    expect(r).toMatchObject({
      amountPaid: 14.6, terminalAmount: 163.85, printedItemCount: 2, countedAmounts: 2, countedEans: 2, printedTime: '09:12', photoIncomplete: false,
      ignoredLines: [{ label: 'Total EFT', amount: 163.85, kind: 'payment' }],
    });
    expect(r.amountTTC).toBe(14.6);
  });
  it('une lecture sans ces champs (ancien serveur, ancien cache) : aucune clé, jamais 0 ni [] (l’absence est « inconnu » ; un ancien résultat sort comme avant)', () => {
    const r = lire(entete({ amountTTC: 5, items: [ligne({ price: 5, amountTTC: 5 })] }));
    for (const champ of NOUVEAUX) expect(r, champ).not.toHaveProperty(champ);
    const nulls = lire(entete({ amountTTC: 5, items: [ligne({ price: 5, amountTTC: 5 })], amountPaid: null, countedAmounts: null, ignoredLines: null, photoIncomplete: null, printedTime: '' }));
    for (const champ of NOUVEAUX) expect(nulls, champ).not.toHaveProperty(champ);
  });
  it('valeurs invalides rejetées : montant négatif, comptage non entier, heure impossible, genre inconnu', () => {
    const r = lire(sun1({ amountPaid: -3, terminalAmount: 'x', countedAmounts: 2.5, countedEans: -1, printedItemCount: '3', printedTime: '25:99', photoIncomplete: 'oui',
      ignoredLines: [{ label: 'Autre', amount: 'x', kind: 'inconnu' }, { label: '', amount: 1, kind: 'other' }] }));
    for (const champ of ['amountPaid', 'terminalAmount', 'countedAmounts', 'countedEans', 'printedItemCount', 'printedTime', 'photoIncomplete']) expect(r, champ).not.toHaveProperty(champ);
    expect(r.ignoredLines).toEqual([{ label: 'Autre', amount: null, kind: 'other' }]);
  });
  it('heure : 9h05 et 9.05 deviennent 09:05', () => {
    expect(lire(sun1({ printedTime: '9h05' })).printedTime).toBe('09:05');
    expect(lire(sun1({ printedTime: '9.05' })).printedTime).toBe('09:05');
  });
  it('un payé de 0 est un montant lu (0 CHF reçus), pas un manque', () => {
    expect(lire(sun1({ amountPaid: 0 })).amountPaid).toBe(0);
  });
  it('ces champs ne créent aucun point ni aucune phrase : le calcul des lignes et des totaux est celui d\'avant', () => {
    const avec = lire(sun1()), sans = lire(sun1({ amountPaid: undefined, terminalAmount: undefined, ignoredLines: undefined, countedAmounts: undefined, countedEans: undefined, photoIncomplete: undefined }));
    expect(avec.points).toEqual(sans.points);
    expect(avec.issues).toEqual(sans.issues);
  });
});

describe('recollage des morceaux : les comptes se somment, le pied de page vaut pour tout le document', () => {
  it('comptes sommés, payé du pied, lignes écartées de toutes les parties, photo incomplète si une partie l\'est', () => {
    const haut = { ...sun1(), amountPaid: null, terminalAmount: null, countedAmounts: 1, countedEans: 1, printedItemCount: null, ignoredLines: [], photoIncomplete: false };
    const bas = { ...sun1(), countedAmounts: 1, countedEans: 1, printedTime: '', ignoredLines: [{ label: 'Total EFT', amount: 163.85, kind: 'payment' }], photoIncomplete: true, photoIncompleteNote: 'pli en bas' };
    const m = mergeDecoded([haut, bas], { dedupe: false });
    expect(m).toMatchObject({ countedAmounts: 2, countedEans: 2, amountPaid: 14.6, terminalAmount: 163.85, printedItemCount: 2, printedTime: '09:12', photoIncomplete: true, photoIncompleteNote: 'pli en bas' });
    expect(m.ignoredLines).toEqual([{ label: 'Total EFT', amount: 163.85, kind: 'payment' }]);
  });
  it('aucune partie ne donne un compte : aucune clé, jamais 0', () => {
    const m = mergeDecoded([entete(), entete()], { dedupe: false });
    for (const champ of NOUVEAUX) expect(m, champ).not.toHaveProperty(champ);
  });
});

describe('vote entre lectures : le payé et les comptes ne se votent pas, ils se complètent', () => {
  it('deux lectures qui concordent l’emportent sur une 3.8 vide (B6) ; l’heure se complète', () => {
    const a = lire(sun1()), b = lire(sun1()), vide = lire(sun1({ amountPaid: null, terminalAmount: null, countedAmounts: null, printedTime: '' }));
    const { result } = reconcileInvoiceVision([a, b, vide]) as any;
    expect(result).toMatchObject({ amountPaid: 14.6, terminalAmount: 163.85, countedAmounts: 2, printedTime: '09:12' });
  });
  it('deux lectures seulement qui ne concordent pas : aucune valeur (jamais une Flash-Lite seule)', () => {
    const base = lire(sun1({ amountPaid: null, terminalAmount: null, countedAmounts: null }));
    const autre = lire(sun1());
    const { result } = reconcileInvoiceVision([base, autre]) as any;
    for (const champ of ['amountPaid', 'terminalAmount', 'countedAmounts']) expect(result, champ).not.toHaveProperty(champ);
  });
  it('voterChampControle : majorité, sinon la 3ᵉ lecture (la 3.8), sinon rien', () => {
    expect(voterChampControle([352.05, 352.05, null])).toBe(352.05);
    expect(voterChampControle([352.05, 352.05, 300])).toBe(352.05);
    expect(voterChampControle([null, null, 352.05])).toBe(352.05);
    expect(voterChampControle([352.05, 300, 352.05])).toBe(352.05);
    expect(voterChampControle([163.95, 163.85, 163.85])).toBe(163.85); // B4 : un chiffre lu faux par une lecture
    expect(voterChampControle([352.05, 300, null])).toBeUndefined();
    expect(voterChampControle([352.05, 352.05])).toBe(352.05);
    expect(voterChampControle([352.05, null])).toBeUndefined();
    expect(voterChampControle([null, null, null])).toBeUndefined();
    expect(voterChampControle([0, 0, null])).toBe(0); // un 0 lu deux fois est un montant lu
    expect(voterChampControle([])).toBeUndefined();
  });
  it('une photo incomplète pour une seule lecture l\'est pour le résultat', () => {
    const a = lire(sun1()), b = lire(sun1({ photoIncomplete: true, photoIncompleteNote: 'bas taché' }));
    const { result } = reconcileInvoiceVision([a, b]) as any;
    expect(result).toMatchObject({ photoIncomplete: true, photoIncompleteNote: 'bas taché' });
  });
  it('lectures sans ces champs : le résultat ne les porte pas (jamais 0)', () => {
    const a = lire(entete({ amountTTC: 5, items: [ligne({ price: 5, amountTTC: 5 })] }));
    const { result } = reconcileInvoiceVision([a, a]) as any;
    for (const champ of NOUVEAUX) expect(result, champ).not.toHaveProperty(champ);
  });
});

describe('B1 (P5, 09.11) — sunstore-1 : le code de TVA n’est jamais la quantité, le montant de ligne reste rempli', () => {
  // Ce que les deux Flash-Lite ont rendu au banc P5 : « 5.40 2 » lu en quantité 2 (le 2 est le code TVA de la colonne de droite), montant de ligne vide.
  const recu = (items: any[], over: Record<string, unknown> = {}) => lire(sun1({
    documentType: 'receipt', vat: [{ code: '2', rate: 0.026, base: 14.23, amount: 0.37 }], printedLineCount: 2, items, ...over,
  }));
  const regresse = () => [
    ligne({ name: 'Paracétamol 500 mg', kind: 'stock', quantity: 2, unit: '', price: 5.4, amountTTC: null, vatCode: '', evidence: 'Paracétamol 500 mg 5.40 2' }),
    ligne({ name: 'Ibuprofène 400 mg', kind: 'stock', quantity: 2, unit: '', price: 9.2, amountTTC: null, vatCode: '2', evidence: 'Ibuprofène 400 mg 9.20 2' }),
  ];
  it('quantité 2 = code du récapitulatif de TVA : la quantité n’est pas lue, le montant de ligne est le prix imprimé, la somme fait 14,60', () => {
    const r = recu(regresse());
    expect(r.items.map((i: any) => i.quantity)).toEqual([null, null]);
    expect(r.items.map((i: any) => i.amountTTC)).toEqual([5.4, 9.2]);
    expect(r.controls.sum.statut).toBe('ok');
    expect(trouve(r.points, 'somme-incomplete')).toEqual([]);
    expect(r.linesLost).toBe(0);
  });
  it('un nombre imprimé en tête de ligne est la quantité ; le code de droite reste vatCode', () => {
    const r = recu([ligne({ name: 'Paracétamol 500 mg', kind: 'stock', quantity: 2, unit: '', price: 5.4, amountTTC: null, vatCode: '2', evidence: '1 Paracétamol 500 mg 5.40 2' })]);
    expect(r.items[0]).toMatchObject({ quantity: 1, amountTTC: 5.4, vatCode: '2' });
  });
  it('quantité nulle et extrait « 5.40 2 » : l’entier n’est pas repris comme quantité quand c’est un code de TVA', () => {
    const r = recu([ligne({ name: 'Paracétamol 500 mg', kind: 'stock', quantity: null, unit: '', price: 5.4, amountTTC: null, vatCode: '2', evidence: 'Paracétamol 500 mg 5.40 2' })]);
    expect(r.items[0]).toMatchObject({ quantity: null, amountTTC: 5.4 });
  });
  it('sans code de TVA correspondant, la règle d’avant tient (« 86.95 1 » : quantité 1 ; une vraie quantité 2 reste 2)', () => {
    const quatre = recu([ligne({ name: 'Vis', kind: 'stock', quantity: null, unit: '', price: 86.95, amountTTC: null, vatCode: 'B', evidence: 'Vis 86.95 1' })], { vat: [{ code: 'B', rate: 0.081, base: 80.4, amount: 6.55 }] });
    expect(quatre.items[0].quantity).toBe(1);
    const deux = recu([ligne({ name: 'Vis', kind: 'stock', quantity: 2, unit: '', price: 4.5, amountTTC: 9, vatCode: '2', evidence: '2 Vis 4.50 9.00' })]);
    expect(deux.items[0]).toMatchObject({ quantity: 2, amountTTC: 9 });
    const autre = recu([ligne({ name: 'Vis', kind: 'stock', quantity: 2, unit: '', price: 4.5, amountTTC: 9, vatCode: 'A', evidence: 'Vis 4.50 2' })], { vat: [{ code: 'A', rate: 0.081, base: 8.3, amount: 0.7 }] });
    expect(autre.items[0].quantity).toBe(2); // le 2 final n’est pas le code de cette ligne (A) : gardé
  });
  it('la consigne n’invente rien : amountTTC null reste null quand ni prix ni quantité 1 ne le donnent', () => {
    const r = recu([ligne({ name: 'Vis', kind: 'stock', quantity: 3, unit: '', price: 4.5, amountTTC: null, vatCode: 'A', evidence: 'Vis 3 4.50' })], { vat: [{ code: 'A', rate: 0.081, base: 8.3, amount: 0.7 }] });
    expect(r.items[0]).toMatchObject({ quantity: 3, amountTTC: null });
  });
});

describe('limite 2 (b1, 09.11) — le vote marque le comptage des montants confirmé par la 3.8', () => {
  const lectureComptee = (n: number) => lire(sun1({ countedAmounts: n }));
  it('trois lectures, la 3.8 lit le même nombre que les deux autres : countedAmountsConfirmed', () => {
    const { result } = reconcileInvoiceVision([lectureComptee(3), lectureComptee(3), lectureComptee(3)]) as any;
    expect(result).toMatchObject({ countedAmounts: 3, countedAmountsConfirmed: true });
  });
  it('la 3.8 tranche entre deux lectures qui divergent : confirmé', () => {
    const { result } = reconcileInvoiceVision([lectureComptee(3), lectureComptee(2), lectureComptee(2)]) as any;
    expect(result).toMatchObject({ countedAmounts: 2, countedAmountsConfirmed: true });
  });
  it('deux lectures seulement qui concordent (la 3.8 n’est pas appelée) : retenu mais jamais confirmé', () => {
    const { result } = reconcileInvoiceVision([lectureComptee(3), lectureComptee(3)]) as any;
    expect(result.countedAmounts).toBe(3);
    expect(result).not.toHaveProperty('countedAmountsConfirmed');
  });
  it('deux lectures concordent contre une 3.8 qui lit autre chose : retenu, jamais confirmé', () => {
    const { result } = reconcileInvoiceVision([lectureComptee(3), lectureComptee(3), lectureComptee(2)]) as any;
    expect(result.countedAmounts).toBe(3);
    expect(result).not.toHaveProperty('countedAmountsConfirmed');
  });
  it('le marqueur ne survit pas sans comptage de montants (le vote seul le pose)', () => {
    expect(lire(sun1({ countedAmounts: undefined, countedAmountsConfirmed: true }))).not.toHaveProperty('countedAmountsConfirmed');
  });
});
