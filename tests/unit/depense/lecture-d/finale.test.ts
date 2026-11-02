/**
 * Voie e-ecran (lenteur D, D308) : la fusion « sa saisie l'emporte », pure (`src/ui/depense/finale.ts`). Témoins E1 à E4 du plan (l1-plan/PLAN.md § 4 bis, § 5 E), la table
 * « rang final → id du brouillon » (B3), les lignes ajoutées (son choix 1 B, D314) et pas retrouvées (son choix 2 D, D313), le total corrigé (défaut A, D315).
 * Lectures FICTIVES (Brauhaus Ouest, la maquette d-lue) : aucune valeur d'une vraie pièce, Gemini jamais appelé.
 */
import { describe, expect, it } from 'vitest';
import type { PurchaseDraft, PurchaseLineDraft } from '../../../../src/services/purchaseEntry';
import type { ScannedInvoiceResult } from '../../../../src/services/geminiScanner';
import { ajouterCoupure as ajouterCoupureServeur, phraseCoupure as phraseServeur } from '../../../../functions/src/invoiceVisionReview';
import { appliquerFinale, ajouterCoupure, phraseCoupure, baseDeBrouillon, brouillonDeLecture, libelleAvant, rangerLaPerdue, type Registres } from '../../../../src/ui/depense/finale';

const AUJOURDHUI = '02.11.2026';
const item = (n: number, name: string, kind: string, quantity: number | null, unit: string, price: number | null, amountTTC: number | null, extra: Record<string, unknown> = {}) =>
  ({ id: `line-${n}`, name, kind, reference: '', variant: '', quantity, unit, price, amountTTC, stockCategory: '', evidence: '', ambiguity: '', vatCode: '', ...extra });
const lecture = (items: any[], over: Record<string, unknown> = {}): ScannedInvoiceResult => ({
  documentType: 'invoice', paymentEvidence: 'paid', fieldWarnings: [], orderNumber: '', vendor: 'Brauhaus Ouest', date: '21.10.2026', currency: 'CHF', invoiceNumber: 'F-1', amountHT: null, tvaRate: null, tvaAmount: null,
  amountTTC: Math.round(items.reduce((s, i) => s + (i.amountTTC ?? 0), 0) * 100) / 100, category: 'brassage', subcategory: '', description: 'Malts et houblons', items, issues: [], points: [],
  controls: { lines: { checked: items.length, failed: 0, skipped: 0, skippedIds: [] }, sum: { statut: 'ok', base: 'TTC' }, vat: { statut: 'non-verifiable', base: 'TTC' }, totals: { statut: 'non-verifiable' } },
  review: { status: 'checked', findings: [], readers: 2 }, ...over,
}) as unknown as ScannedInvoiceResult;
const vide = (): PurchaseDraft => ({ submissionId: 'S1', date: AUJOURDHUI, vendor: '', invoiceNumber: '', description: '', category: 'brassage', lines: [], paymentStatus: 'paid', paymentMethod: 'bank', paymentDate: AUJOURDHUI, dueDate: '', sourceCurrency: 'CHF' });
const ligneVide = (): PurchaseLineDraft => ({ id: 'x', description: '', kind: 'ingredient', unit: '', stockAction: 'none', equipmentAction: 'none' });

/** Pose le provisoire comme l'écran (le même calcul que `applyOutcome`), prend l'instantané, et rend de quoi fusionner. */
function poser(provisoire: ScannedInvoiceResult, jeton = 'j1') {
  const { draft, propositions } = brouillonDeLecture(vide(), provisoire, { stockItems: [], today: AUJOURDHUI, model: 'simule', documentHash: 'h', ligneVide });
  return { draft, propositions, base: baseDeBrouillon(draft, jeton, propositions, provisoire.items.length) };
}
const registres = (p: ReturnType<typeof poser>, sur: Partial<Registres> = {}): Registres => ({
  reviewedFields: [], manuallyClassified: new Set(), proposes: new Set(p.propositions.proposedStock), neufsOffice: new Set(p.propositions.neufDOffice), reglees: new Set(), focus: null, ...sur,
});
const fusion = (p: ReturnType<typeof poser>, provisoire: ScannedInvoiceResult, final: ScannedInvoiceResult, sur: { courant?: PurchaseDraft; registres?: Partial<Registres> } = {}) =>
  appliquerFinale({ base: p.base, courant: sur.courant ?? p.draft, provisoire, final, stockItems: [], today: AUJOURDHUI, registres: registres(p, sur.registres), ligneVide });
const ligne = (d: PurchaseDraft, id: string) => d.lines.find(l => l.id === id)!;

const prov3 = () => lecture([item(1, 'Malt Pilsner', 'stock', 10, 'Kg', 1.45, 14.5), item(2, 'Port', 'shipping', 1, '', 5, 5), item(3, 'Citra 12.5%', 'stock', 50, '', 0.09, 4.5)]);

describe('E1 : la base est le brouillon posé, pas la valeur brute', () => {
  it('une unité déduite (« kg ») que le brasseur ne touche pas est corrigée par la 3.8 (« g ») : bleu, ancienne valeur gardée', () => {
    const provisoire = lecture([item(1, 'Pilsner Malz, Kg', 'stock', 5, '', 1.2, 6)]);
    const p = poser(provisoire);
    expect(p.draft.lines[0].unit).toBe(''); expect(p.draft.lines[0].uniteDeduite?.unite).toBe('kg'); // la déduction vit à côté de la cellule : rien n'est écrit dans l'unité
    const final = lecture([item(1, 'Pilsner Malz, Kg', 'stock', 5, 'g', 1.2, 6, { rangProvisoire: 0 })], { provisoireJeton: 'j1' });
    const s = fusion(p, provisoire, final);
    expect(s.etat).toBe('finie');
    expect(ligne(s.draft, 'line-1').unit).toBe('g');
    expect(s.corrections.lignes['line-1'].map(c => c.champ)).toContain('unit');
    expect(s.nCorrigees).toBe(1);
  });
});

describe('E2 : sa saisie l’emporte (en-tête)', () => {
  it('une date tapée (registre « date ») n’est pas réécrite, et aucune correction n’est comptée', () => {
    const provisoire = lecture([item(1, 'Malt Pilsner', 'stock', 10, 'Kg', 1.45, 14.5)]);
    const p = poser(provisoire);
    const final = lecture([item(1, 'Malt Pilsner', 'stock', 10, 'Kg', 1.45, 14.5, { rangProvisoire: 0 })], { provisoireJeton: 'j1', date: '22.10.2026' });
    const courant = { ...p.draft, date: '21.10.2026' }; // même valeur que la base : seul le registre dit qu'il l'a tapée
    const s = fusion(p, provisoire, final, { courant, registres: { reviewedFields: ['date'] } });
    expect(s.draft.date).toBe('21.10.2026');
    expect(s.corrections.entete.date).toBeUndefined();
    expect(s.nCorrigees).toBe(0);
    const sans = fusion(p, provisoire, final); // sans registre : la 3.8 corrige la date, une fois
    expect(sans.draft.date).toBe('22.10.2026'); expect(sans.corrections.entete.date).toBeTruthy(); expect(sans.nCorrigees).toBe(1);
  });
  it('une cellule de rangée qu’il a modifiée (courant ≠ base) ne bouge pas, sans fond bleu', () => {
    const provisoire = lecture([item(1, 'Malt Pilsner', 'stock', 10, 'Kg', 1.45, 14.5)]);
    const p = poser(provisoire);
    const final = lecture([item(1, 'Malt Pilsner', 'stock', 5, 'Kg', 2.9, 14.5, { rangProvisoire: 0 })], { provisoireJeton: 'j1' });
    const courant = { ...p.draft, lines: p.draft.lines.map(l => ({ ...l, quantity: 12 })) };
    const s = fusion(p, provisoire, final, { courant });
    expect(ligne(s.draft, 'line-1').quantity).toBe(12); expect(ligne(s.draft, 'line-1').unitPrice).toBe(2.9);
    expect(s.corrections.lignes['line-1'].map(c => c.champ)).toEqual(['unitPrice']);
  });
});

describe('E3 : une seule table « rang final → id du brouillon » (B3)', () => {
  it('une ligne de port à la position 3 du final et 2 du provisoire : `skippedIds` est remappé, les points aussi', () => {
    const provisoire = prov3();
    const p = poser(provisoire);
    // le final range : Pilsner, Citra, Port (le port passe en 3e) ; ses rangs provisoires : 0, 2, 1
    const final = lecture([item(1, 'Malt Pilsner', 'stock', 10, 'Kg', 1.45, 14.5, { rangProvisoire: 0 }), item(2, 'Citra 12.5%', 'stock', 50, '', 0.09, 4.5, { rangProvisoire: 2 }), item(3, 'Port', 'shipping', 1, '', 5, 5, { rangProvisoire: 1 })],
      { provisoireJeton: 'j1', controls: { lines: { checked: 2, failed: 0, skipped: 1, skippedIds: ['line-3'] }, sum: { statut: 'ok', base: 'TTC' }, vat: { statut: 'non-verifiable', base: 'TTC' }, totals: { statut: 'non-verifiable' } } as any,
        points: [{ code: 'ligne-montant', ligne: 3, lignes: [3], champs: ['items.3.amountTTC'], cle: 'ligne-montant:3:amountTTC', champ: 'items.3.amountTTC', gravite: 'ecart', origine: 'controle', enjeu: 'argent', bloque: false, unite: 'centimes', regle: 'r', message: 'm', lu: 1, calcule: 2, ecart: 1, signature: 'ancienne' }] as any });
    const s = fusion(p, provisoire, final);
    expect(s.result.controls!.lines.skippedIds).toEqual(['line-2']);
    expect(s.result.points![0].ligne).toBe(2); expect(s.result.points![0].lignes).toEqual([2]); expect(s.result.points![0].champs).toEqual(['items.2.amountTTC']); expect(s.result.points![0].cle).toBe('ligne-montant:2:amountTTC');
    expect(s.result.points![0].signature).not.toBe('ancienne'); // recalculée sur le point remappé
    expect(s.result.items.map(i => i.id)).toEqual(['line-1', 'line-2', 'line-3']); // remis dans l'ordre du brouillon, avec leur id
    expect(s.result.items[1].name).toBe('Port');
    expect(s.draft.lines.map(l => l.description)).toEqual(['Malt Pilsner', 'Port', 'Citra 12.5%']);
  });
});

describe('E4 : un final sans jeton égal (le repli de M4)', () => {
  const finalSansJeton = (items: any[]) => lecture(items);
  it('de même longueur : les lignes se rapprochent par la position', () => {
    const provisoire = prov3(), p = poser(provisoire);
    const final = finalSansJeton([item(1, 'Malt Pilsner', 'stock', 5, 'Kg', 2.9, 14.5), item(2, 'Port', 'shipping', 1, '', 5, 5), item(3, 'Citra 12.5%', 'stock', 50, 'g', 0.09, 4.5)]);
    const s = fusion(p, provisoire, final);
    expect(s.etat).toBe('finie');
    expect(ligne(s.draft, 'line-1').quantity).toBe(5); expect(ligne(s.draft, 'line-3').unit).toBe('g');
    expect(s.draft.lines).toHaveLength(3);
  });
  it('de longueur différente : les lignes provisoires restent, l’écran passe en `echec`, le point « lecture coupée » est posé (R1)', () => {
    const provisoire = prov3(), p = poser(provisoire);
    const final = finalSansJeton([item(1, 'Malt Pilsner', 'stock', 5, 'Kg', 2.9, 14.5)]);
    const s = fusion(p, provisoire, final);
    expect(s.etat).toBe('echec');
    expect(s.draft.lines.map(l => l.id)).toEqual(['line-1', 'line-2', 'line-3']); expect(ligne(s.draft, 'line-1').quantity).toBe(10);
    expect(s.result.points!.some(pt => pt.code === 'lecture-coupee')).toBe(true);
    expect(s.result.review!.status).toBe('disputed');
  });
  it('un jeton égal mais un rang que le serveur ne dit pas (jamais fabriqué) : même repli', () => {
    const provisoire = prov3(), p = poser(provisoire);
    const final = lecture([item(1, 'Malt Pilsner', 'stock', 5, 'Kg', 2.9, 14.5), item(2, 'Port', 'shipping', 1, '', 5, 5), item(3, 'Citra 12.5%', 'stock', 50, '', 0.09, 4.5)], { provisoireJeton: 'j1' });
    expect(fusion(p, provisoire, final).etat).toBe('finie');
    expect(fusion(p, provisoire, lecture([item(1, 'Malt Pilsner', 'stock', 5, 'Kg', 2.9, 14.5)], { provisoireJeton: 'j1' })).etat).toBe('echec');
  });
});

describe('lignes supprimées, ajoutées, pas retrouvées', () => {
  it('une ligne qu’il a supprimée ne revient pas, même corrigée par la 3.8', () => {
    const provisoire = prov3(), p = poser(provisoire);
    const final = lecture([item(1, 'Malt Pilsner', 'stock', 5, 'Kg', 2.9, 14.5, { rangProvisoire: 0 }), item(2, 'Port', 'shipping', 1, '', 6, 6, { rangProvisoire: 1 }), item(3, 'Citra 12.5%', 'stock', 50, 'g', 0.09, 4.5, { rangProvisoire: 2 })], { provisoireJeton: 'j1' });
    const courant = { ...p.draft, lines: p.draft.lines.filter(l => l.id !== 'line-2') };
    const s = fusion(p, provisoire, final, { courant });
    expect(s.draft.lines.map(l => l.id)).toEqual(['line-1', 'line-3']);
  });
  it('une ligne qu’il a ajoutée (UUID) reste intacte', () => {
    const provisoire = prov3(), p = poser(provisoire);
    const courant = { ...p.draft, lines: [...p.draft.lines, { ...ligneVide(), id: 'uuid-1', description: 'Ma ligne', amount: 3 }] };
    const final = lecture([item(1, 'Malt Pilsner', 'stock', 10, 'Kg', 1.45, 14.5, { rangProvisoire: 0 }), item(2, 'Port', 'shipping', 1, '', 5, 5, { rangProvisoire: 1 }), item(3, 'Citra 12.5%', 'stock', 50, '', 0.09, 4.5, { rangProvisoire: 2 })], { provisoireJeton: 'j1' });
    const s = fusion(p, provisoire, final, { courant });
    expect(ligne(s.draft, 'uuid-1')).toMatchObject({ description: 'Ma ligne', amount: 3 });
  });
  it('son choix 1 B : une ligne de la 3.8 sans paire est ajoutée avec l’id `line-${n+1}`, à sa place, comptée une fois', () => {
    const provisoire = prov3(), p = poser(provisoire);
    const final = lecture([item(1, 'Malt Pilsner', 'stock', 10, 'Kg', 1.45, 14.5, { rangProvisoire: 0 }), item(2, 'Port', 'shipping', 1, '', 5, 5, { rangProvisoire: 1 }), item(3, 'Citra 12.5%', 'stock', 50, '', 0.09, 4.5, { rangProvisoire: 2 }),
      item(4, 'Mosaic 11.8%', 'stock', 20, 'g', 0.08, 1.6, { rangProvisoire: null })], { provisoireJeton: 'j1', amountTTC: 24 }); // l'imprimé ne change pas : seule la ligne est neuve
    const s = fusion(p, provisoire, final);
    expect(s.ajoutees).toEqual(['line-4']); expect(ligne(s.draft, 'line-4').description).toMatch(/Mosaic/);
    expect(s.draft.lines.map(l => l.id)).toEqual(['line-1', 'line-2', 'line-3', 'line-4']);
    expect(s.nCorrigees).toBe(1);
    expect(s.aRetraduire).toContain('line-4');
  });
  it('son choix 2 D : une ligne provisoire que la 3.8 ne lit plus sort du brouillon (hors des sommes), attend sa décision, et ne compte pas dans le brouillon', () => {
    const provisoire = prov3(), p = poser(provisoire);
    const final = lecture([item(1, 'Malt Pilsner', 'stock', 10, 'Kg', 1.45, 14.5, { rangProvisoire: 0 }), item(2, 'Citra 12.5%', 'stock', 50, '', 0.09, 4.5, { rangProvisoire: 2 })], { provisoireJeton: 'j1' });
    const s = fusion(p, provisoire, final);
    expect(s.etat).toBe('finie');
    expect(s.perdues.map(x => x.ligne.id)).toEqual(['line-2']); expect(s.perdues[0].ligne.description).toBe('Port');
    expect(s.draft.lines.map(l => l.id)).toEqual(['line-1', 'line-3']); // line-3 garde l'id de sa ligne provisoire (B3)
    expect(s.perdues[0].apres).toBe('line-1');
    // « Garder » : la ligne revient à sa place ; « Retirer » : rien à faire, elle n'est jamais entrée.
    expect(rangerLaPerdue(s.draft.lines, s.perdues[0], s.perdues[0].ligne).map(l => l.id)).toEqual(['line-1', 'line-2', 'line-3']);
  });
  it('plusieurs lignes pas retrouvées : chacune garde son rang, « Garder » une à une les remet dans l’ordre', () => {
    const provisoire = lecture([item(1, 'A', 'stock', 1, 'Kg', 1, 1), item(2, 'B', 'stock', 1, 'Kg', 2, 2), item(3, 'C', 'stock', 1, 'Kg', 3, 3), item(4, 'D', 'stock', 1, 'Kg', 4, 4)]);
    const p = poser(provisoire);
    const final = lecture([item(1, 'A', 'stock', 1, 'Kg', 1, 1, { rangProvisoire: 0 }), item(2, 'C', 'stock', 1, 'Kg', 3, 3, { rangProvisoire: 2 })], { provisoireJeton: 'j1' });
    const s = fusion(p, provisoire, final);
    expect(s.perdues.map(x => x.ligne.id)).toEqual(['line-2', 'line-4']);
    let lignes = rangerLaPerdue(s.draft.lines, s.perdues[1], s.perdues[1].ligne);
    lignes = rangerLaPerdue(lignes, s.perdues[0], s.perdues[0].ligne);
    expect(lignes.map(l => l.id)).toEqual(['line-1', 'line-2', 'line-3', 'line-4']);
  });
});

describe('le total corrigé (défaut A, D315) et la puce (m2)', () => {
  it('un total que la 3.8 corrige : la correction d’en-tête porte l’ancienne valeur ; elle compte 1 dans la puce, avec les rangées', () => {
    const provisoire = lecture([item(1, 'Malt Pilsner', 'stock', 10, 'Kg', 1.45, 14.5), item(2, 'Malt de Munich', 'stock', 4, 'Kg', 1.8, 7.2)]);
    const p = poser(provisoire);
    const final = lecture([item(1, 'Malt Pilsner', 'stock', 5, 'Kg', 2.9, 14.5, { rangProvisoire: 0 }), item(2, 'Malt de Munich', 'stock', 4, 'Kg', 2.2, 8.8, { rangProvisoire: 1 })], { provisoireJeton: 'j1', amountTTC: 23.3 });
    const s = fusion(p, provisoire, final);
    expect(s.corrections.entete.total).toMatchObject({ avant: 21.7, apres: 23.3 }); expect(s.draft.amount).toBe(23.3);
    expect(s.nCorrigees).toBe(3); // Pilsner, Munich, le total : une cible chacun
  });
  it('une rangée à deux cellules corrigées compte 1 (m2) ; l’ancienne valeur se lit « 10 Kg × 1,45 »', () => {
    const provisoire = lecture([item(1, 'Malt Pilsner', 'stock', 10, 'Kg', 1.45, 14.5)]);
    const p = poser(provisoire);
    const final = lecture([item(1, 'Malt Pilsner', 'stock', 5, 'Kg', 2.9, 14.5, { rangProvisoire: 0 })], { provisoireJeton: 'j1' });
    const s = fusion(p, provisoire, final);
    expect(s.corrections.lignes['line-1'].map(c => c.champ).sort()).toEqual(['quantity', 'unitPrice']);
    expect(s.nCorrigees).toBe(1);
    const avant = libelleAvant(p.base.lignes['line-1'], s.corrections.lignes['line-1']);
    expect(avant).toBe('10 Kg × 1,45');
  });
  it('un montant corrigé s’ajoute après un point médian (« 4 Kg × 1,80 · 7,20 ») ; une unité seule dit « 30 ? »', () => {
    const provisoire = lecture([item(1, 'Malt de Munich', 'stock', 4, 'Kg', 1.8, 7.2), item(2, 'Sucre candi', 'stock', 1, '', 5.9, 5.9)]);
    const p = poser(provisoire);
    const final = lecture([item(1, 'Malt de Munich', 'stock', 4, 'Kg', 2.2, 8.8, { rangProvisoire: 0 }), item(2, 'Sucre candi', 'stock', 1, 'g', 5.9, 5.9, { rangProvisoire: 1 })], { provisoireJeton: 'j1' });
    const s = fusion(p, provisoire, final);
    expect(libelleAvant(p.base.lignes['line-1'], s.corrections.lignes['line-1'])).toBe('4 Kg × 1,80 · 7,20');
    expect(libelleAvant(p.base.lignes['line-2'], s.corrections.lignes['line-2'])).toBe('1 Stk'); // l'unité DÉDUITE d'avant (jaune) est celle qu'on barre
    expect(libelleAvant({ quantity: 30, unit: '' }, [{ champ: 'unit' }])).toBe('30 ?'); // aucune unité connue : « 30 ? », comme sa maquette;
  });
});

describe('l’ancienne valeur ne barre que ce qui a été corrigé', () => {
  it('quantité tapée (12) et prix corrigé : « 12 Kg × 1,45 », jamais « 10 Kg × 1,45 »', () => {
    const provisoire = lecture([item(1, 'Malt Pilsner', 'stock', 10, 'Kg', 1.45, 14.5)]), p = poser(provisoire);
    const final = lecture([item(1, 'Malt Pilsner', 'stock', 5, 'Kg', 2.9, 14.5, { rangProvisoire: 0 })], { provisoireJeton: 'j1' });
    const courant = { ...p.draft, lines: p.draft.lines.map(l => ({ ...l, quantity: 12 })) };
    const s = fusion(p, provisoire, final, { courant });
    expect(libelleAvant(p.base.lignes['line-1'], s.corrections.lignes['line-1'], ligne(s.draft, 'line-1'))).toBe('12 Kg × 1,45');
  });
});

describe('ce que la fusion ne fait jamais (m3) et la traduction (M6)', () => {
  it('le nom de base qui change efface `nameFr` et demande une traduction ; un nom retouché par lui n’est pas repris', () => {
    const provisoire = lecture([item(1, 'Malt Pilsner', 'stock', 10, 'Kg', 1.45, 14.5), item(2, 'Citra 12.5%', 'stock', 50, 'g', 0.09, 4.5)]);
    const p = poser(provisoire);
    const courant = { ...p.draft, lines: p.draft.lines.map(l => ({ ...l, nameFr: `fr-${l.id}` })) };
    const base = { ...p.base, lignes: Object.fromEntries(Object.entries(p.base.lignes).map(([id, c]) => [id, { ...c, nameFr: `fr-${id}` }])) }; // la seule écriture du programme : la traduction, reprise par l'instantané
    const final = lecture([item(1, 'Pilsner Malz', 'stock', 10, 'Kg', 1.45, 14.5, { rangProvisoire: 0 }), item(2, 'Citra 12.5%', 'stock', 50, 'g', 0.09, 4.5, { rangProvisoire: 1 })], { provisoireJeton: 'j1' });
    const s = appliquerFinale({ base, courant, provisoire, final, stockItems: [], today: AUJOURDHUI, registres: registres(p), ligneVide });
    expect(ligne(s.draft, 'line-1').nameFr).toBeUndefined(); expect(s.aRetraduire).toEqual(['line-1']);
    expect(ligne(s.draft, 'line-2').nameFr).toBe('fr-line-2');
  });
  it('une ligne dont le focus est dans une cellule à l’arrivée est traitée comme touchée', () => {
    const provisoire = lecture([item(1, 'Malt Pilsner', 'stock', 10, 'Kg', 1.45, 14.5)]);
    const p = poser(provisoire);
    const final = lecture([item(1, 'Malt Pilsner', 'stock', 5, 'Kg', 2.9, 14.5, { rangProvisoire: 0 })], { provisoireJeton: 'j1' });
    const s = fusion(p, provisoire, final, { registres: { focus: 'line-1' } });
    expect(ligne(s.draft, 'line-1')).toMatchObject({ quantity: 10, unitPrice: 1.45 }); expect(s.nCorrigees).toBe(0);
  });
  it('le final sans aucune différence : rien n’est corrigé, aucune puce', () => {
    const provisoire = prov3(), p = poser(provisoire);
    const final = lecture([item(1, 'Malt Pilsner', 'stock', 10, 'Kg', 1.45, 14.5, { rangProvisoire: 0 }), item(2, 'Port', 'shipping', 1, '', 5, 5, { rangProvisoire: 1 }), item(3, 'Citra 12.5%', 'stock', 50, '', 0.09, 4.5, { rangProvisoire: 2 })], { provisoireJeton: 'j1' });
    const s = fusion(p, provisoire, final);
    expect(s.nCorrigees).toBe(0); expect(s.ajoutees).toEqual([]); expect(s.perdues).toEqual([]);
  });
});

describe('R1 : le point « lecture coupée » du client est celui du serveur', () => {
  it('la phrase, le point (signature comprise), les issues et le statut sont égaux à ceux de `invoiceVisionReview.ts`', () => {
    const neuf = () => lecture([item(1, 'A', 'stock', 1, 'Kg', 1, 1)]) as any;
    expect(phraseCoupure('delai-saute')).toBe(phraseServeur('delai-saute'));
    expect(ajouterCoupure(neuf(), 'delai-saute', phraseCoupure('delai-saute'))).toEqual(ajouterCoupureServeur(neuf(), 'delai-saute', phraseServeur('delai-saute')));
  });
});
