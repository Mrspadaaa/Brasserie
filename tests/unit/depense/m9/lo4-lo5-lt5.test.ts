/**
 * Mission 2026-11-09-banc-gemini : LO-4, LO-5 et LT-5, rejoués sur la forme de leurs vraies pièces (doc5, doc21) sans aucune de leurs valeurs.
 * Gemini n'est jamais appelé : une « lecture » est un objet JSON, ce que le modèle aurait rendu ; zxing est remplacé par des codes fabriqués.
 */
import { describe, expect, it } from 'vitest';
import { reconcileInvoiceVision } from '../../../../functions/src/invoiceVisionReview';
import { titreLignesSaisies } from '../../../../src/ui/finance/PieceDejaSaisie';
import { classer, lireQrDuFichier, type CodeLu, type MoteursQr, type ResultatQr } from '../../../../src/services/qrLecture';
import { codeDeZxing, pasDuModule, PAS_LISIBLE_PX } from '../../../../src/services/qrOptions';
import { vueQr } from '../../../../src/ui/depense/qrVue';
import { entete, ligne, lire } from '../rapprochement/aide';

describe('LO-4 — « Déjà enregistré » compte les lignes comme la lecture (le port à part, D249)', () => {
  const ligneSaisie = (i: number, kind = 'ingredient', cents = 100) => ({ id: `l${i}`, description: `Article ${i}`, kind, amountCents: cents }) as any;
  it('25 articles et un port : « Ses 25 lignes et le port » (avant : 26)', () => {
    const lignes = [...Array.from({ length: 25 }, (_, i) => ligneSaisie(i)), ligneSaisie(25, 'shipping', 1500)];
    expect(titreLignesSaisies(lignes)).toBe('Ses 25 lignes et le port');
  });
  it('sans port : le nombre de lignes, singulier compris', () => {
    expect(titreLignesSaisies([ligneSaisie(0), ligneSaisie(1)])).toBe('Ses 2 lignes');
    expect(titreLignesSaisies([ligneSaisie(0)])).toBe('Ses 1 ligne');
  });
  it('une pièce qui n’a que du port garde ses lignes (critère unique de groupes.ts)', () => {
    expect(titreLignesSaisies([ligneSaisie(0, 'shipping', 900)])).toBe('Ses 1 ligne');
  });
});

describe('LO-5 — un QR vu net mais barré ne réclame plus une photo', () => {
  // La géométrie du QR de doc5 telle que zxing la rend (version 12, 65 modules, 325 px de côté) ; aucune valeur de la pièce.
  const doc5 = { isValid: false, text: '', version: '12', position: { topLeft: { x: 434, y: 3769 }, topRight: { x: 759, y: 3768 }, bottomRight: { x: 759, y: 4094 }, bottomLeft: { x: 435, y: 4094 } } };
  it('le pas du module se lit de la position et de la version : 5 px sur doc5', () => {
    expect(pasDuModule(doc5)).toBe(5);
    expect(codeDeZxing(doc5)).toEqual({ texte: '', decode: false, pasPx: 5 });
    expect(codeDeZxing({ ...doc5, isValid: true, text: 'SPC' })).toEqual({ texte: 'SPC', decode: true });
    expect(pasDuModule({ isValid: false, version: '', position: doc5.position })).toBeUndefined();
  });
  it('classer garde le plus grand pas des QR vus et non décodés', () => {
    expect(classer([{ texte: '', decode: false, pasPx: 2.4 }, { texte: '', decode: false, pasPx: 5 }])).toMatchObject({ qr: null, vuNonDecode: true, pasPx: 5 });
  });
  const moteurs = (premiere: CodeLu[], seconde: CodeLu[] | null): MoteursQr => ({
    lireCodes: async () => premiere, agrandir: async () => null, lireAgrandie: async () => seconde,
    pagesPdf: async function* () { /* jamais un PDF ici */ },
  });
  const photo = new File([new Uint8Array([255, 216, 255, 217])], 'doc.jpg', { type: 'image/jpeg' });
  it('la lecture du fichier rend « illisible » avec le pas de la pièce telle quelle, jamais celui de l’image agrandie', async () => {
    const r = await lireQrDuFichier(photo, moteurs([{ texte: '', decode: false, pasPx: 5 }], [{ texte: '', decode: false, pasPx: 10 }]));
    expect(r).toEqual({ statut: 'illisible', pasPx: 5 });
    const petit = await lireQrDuFichier(photo, moteurs([], [{ texte: '', decode: false, pasPx: 3 }]));
    expect(petit).toEqual({ statut: 'illisible' });
  });
  const vue = (r: ResultatQr) => vueQr(r, null, { vendor: 'Fictif', date: '', currency: 'CHF', invoiceNumber: '', amountTTC: 110.4 })!;
  it('vu net (≥ 4 px) : pas de « Photographier le QR », la fiche dit barré ou abîmé', () => {
    expect(PAS_LISIBLE_PX).toBe(4);
    const v = vue({ statut: 'illisible', pasPx: 5 });
    expect(v).toMatchObject({ etat: 'off', verdict: 'illisible', photographier: false, aria: 'QR-facture : vu, mais barré ou abîmé' });
    expect(v.lignes[0]).toMatchObject({ cle: 'qr', valeur: 'vu net, mais barré ou abîmé : rien décodé' });
  });
  it('vu petit, ou pas inconnu : le geste reste (une meilleure photo peut aider)', () => {
    expect(vue({ statut: 'illisible', pasPx: 2.5 })).toMatchObject({ photographier: true, aria: 'QR-facture : illisible' });
    expect(vue({ statut: 'illisible' })).toMatchObject({ photographier: true });
    expect(vue({ statut: 'illisible' }).lignes[0].valeur).toBe('vu, rien décodé');
  });
});

describe('LT-5 — le code imprimé d’une rangée de TVA ne fait pas voter (doc21 : « N » et « %-TVA1 »)', () => {
  const ticket = (code: string) => lire(entete({ documentType: 'receipt', amountTTC: 51.8, tvaAmount: 3.88, tvaRate: 0.081,
    vat: [{ code, rate: 0.081, base: 51.8, amount: 3.88 }],
    items: [ligne({ name: 'Outil fictif A', kind: 'equipment', unit: '', price: 43.5, amountTTC: 43.5 }), ligne({ name: 'Outil fictif B', kind: 'equipment', unit: '', price: 8.3, amountTTC: 8.3 })] }));
  it('même taux, même base, même montant : aucun désaccord, aucun point TVA', () => {
    const r = reconcileInvoiceVision([ticket('N'), ticket('%-TVA1')]);
    expect((r.result as any).points.filter((p: any) => p.champ === 'vat')).toEqual([]);
    expect(r.review.findings.filter(f => f.startsWith('Bloc TVA'))).toEqual([]);
    expect(r.review.status).not.toBe('disputed');
  });
  it('un montant de TVA qui diffère reste un désaccord', () => {
    const autre = lire({ ...ticket('N'), vat: [{ code: 'N', rate: 0.081, base: 51.8, amount: 3.83 }] });
    const r = reconcileInvoiceVision([ticket('N'), autre]);
    expect((r.result as any).points.some((p: any) => p.champ === 'vat' && p.code === 'lectures-divergentes')).toBe(true);
  });
});
