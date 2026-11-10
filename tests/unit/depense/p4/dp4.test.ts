// @vitest-environment jsdom
/**
 * DP-4 (10.11), ses mots : « Ça pose aucun problème que un houblon du stock soit ajouter en pièce ??? Et on voit pas la vue stock normalement comme sur le second screen ?? D'ailleurs on doit pouvoir
 * choisir justement avec la vue stock si on lie, créé un nouveau bis justement ?? » (ligne « Idaho 7 », 1 pièce, 82,35, face à « Idaho 7 » houblon compté en g).
 * Cause : l'unité qui ne s'ajoute pas (pièce face au g) faisait de la ligne un autre produit (`regleProduit` : « incertain » → « Idaho 7 bis » d'office), alors que D371b dit qu'une unité n'est pas une identité.
 * Fixtures fictives ; Gemini jamais appelé.
 */
import { describe, expect, it, vi } from 'vitest';
vi.mock('firebase/functions', () => ({ httpsCallable: () => vi.fn() }));
vi.mock('../../../../src/services/firebase', () => ({ functions: {} }));
import { GeminiScannerService } from '../../../../src/services/geminiScanner';
import { brouillonDeLecture } from '../../../../src/ui/depense/finale';
import { articleDeMemeNom } from '../../../../src/ui/depense/etat';
import { compterEnGrammes, erreursPoidsManquant, poidsDePiece } from '../../../../src/ui/depense/poidsPiece';

const article = (more: Record<string, unknown> = {}): any => ({ id: 'a1', ref: 'MP-Idaho7', name: 'Idaho 7', category: 'Houblon', unit: 'g', currentStock: 0, minStock: 0, reorder: false, ...more });
const ligneVide = () => ({ id: 'x', description: '', kind: 'ingredient', unit: '', stockAction: 'none', equipmentAction: 'none' }) as any;
const vide = () => ({ submissionId: 'S1', date: '10.11.2026', vendor: '', invoiceNumber: '', description: '', category: 'brassage', lines: [], paymentStatus: 'paid', paymentMethod: 'bank', paymentDate: '10.11.2026', dueDate: '' }) as any;
const lecture = (nom: string, unit: string, quantity = 1, amount = 82.35): any => GeminiScannerService.normalizeResult({
  vendor: 'Houblons Fictifs SA', documentType: 'invoice', paymentEvidence: 'paid', fieldWarnings: [], date: '10.11.2026', currency: 'CHF', invoiceNumber: '', proForma: false, vat: [], printedLineCount: 1,
  amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: amount, category: 'brassage', description: 'Houblons',
  items: [{ id: 'line-1', name: nom, kind: 'stock', stockCategory: 'Houblon', reference: '', variant: '', quantity, unit, price: amount / quantity, amountTTC: amount, evidence: nom, ambiguity: '' }],
} as any);
const poser = (nom: string, unit: string, stock: any[], quantity = 1) => brouillonDeLecture(vide(), lecture(nom, unit, quantity), { stockItems: stock, today: '10.11.2026', ligneVide });

describe('DP-4 — le même nom au stock propose de RELIER, jamais un « bis » à cause de l’unité (D371b)', () => {
  it('« Idaho 7 » en pièce face à « Idaho 7 » compté en g : relié, proposé (jaune, « Garder »), jamais « nouvel article » d’office', () => {
    const { draft, propositions } = poser('Idaho 7', 'pièce', [article()]);
    const l = draft.lines[0];
    expect(l.stockAction).toBe('existing');
    expect(l.stockRef).toBe('MP-Idaho7');
    expect(propositions.proposedStock.has(l.id)).toBe(true);
    expect(propositions.neufDOffice.has(l.id)).toBe(false);
  });
  it('en « sachet » ou sans unité lue : même chose (l’unité n’est pas une identité)', () => {
    for (const unit of ['sachet', 'Stk', '']) {
      const { draft, propositions } = poser('Idaho 7', unit, [article()]);
      expect(draft.lines[0].stockAction, unit).not.toBe('new');
      expect(propositions.neufDOffice.has(draft.lines[0].id), unit).toBe(false);
    }
  });
  it('un malt compté en Kg, ligne en pièce : relié aussi, jamais « bis »', () => {
    const malt = article({ ref: 'MP-Pils', name: 'Malt Pilsner', category: 'Malt', unit: 'Kg', currentStock: 25 });
    const r = brouillonDeLecture(vide(), GeminiScannerService.normalizeResult({ ...lecture('Malt Pilsner', 'pièce'), items: [{ id: 'line-1', name: 'Malt Pilsner', kind: 'stock', stockCategory: 'Malt', reference: '', variant: '', quantity: 1, unit: 'pièce', price: 82.35, amountTTC: 82.35, evidence: 'Malt Pilsner', ambiguity: '' }] } as any), { stockItems: [malt], today: '10.11.2026', ligneVide });
    expect(r.draft.lines[0].stockAction).toBe('existing');
    expect(r.propositions.neufDOffice.has(r.draft.lines[0].id)).toBe(false);
  });
  it('une autre α (15 face à 13) reste un autre produit : « bis » proposé, trio D215 (acquis)', () => {
    const { draft, propositions } = poser('Idaho 7 15%', 'g', [article({ alphaPct: 13 })], 100);
    const l = draft.lines[0];
    expect(l.stockAction).toBe('new');
    expect(propositions.neufDOffice.has(l.id)).toBe(true);
  });
  it('un autre nom ne se relie pas (jamais de flou) : « Idaho 7 Cryo » en pièce n’est pas relié à « Idaho 7 »', () => {
    const { draft } = poser('Citra', 'pièce', [article()]);
    expect(draft.lines[0].stockAction).not.toBe('existing');
  });
});

describe('DP-4 — articleDeMemeNom : l’article du stock qui porte le nom de la ligne, de n’importe quelle catégorie ou unité', () => {
  it('trouve « Idaho 7 » même rangé « Autres », compté en pièce, et par le nom gardé de la facture', () => {
    expect(articleDeMemeNom({ description: 'Idaho 7' }, [article({ category: 'Autres' })])?.ref).toBe('MP-Idaho7');
    expect(articleDeMemeNom({ description: 'Idaho 7 15%' }, [article({ unit: 'pièce' })])?.ref).toBe('MP-Idaho7');
    expect(articleDeMemeNom({ description: 'IDAHO-7 US', nomLu: 'Idaho 7' }, [article({ name: 'Mon houblon', nomsFacture: ['Idaho 7'] })])?.ref).toBe('MP-Idaho7');
  });
  it('rien pour un autre nom, ni pour un nom vide', () => {
    expect(articleDeMemeNom({ description: 'Citra' }, [article()])).toBeUndefined();
    expect(articleDeMemeNom({ description: '' }, [article()])).toBeUndefined();
    expect(articleDeMemeNom({ description: 'Idaho 7 Cryo' }, [article()])).toBeUndefined();
  });
});

describe('DP-4 — jamais un article compté au poids entré en pièce sans poids', () => {
  const ligne = (description: string, unit: string, extra: Record<string, unknown> = {}): any => ({ id: 'l1', description, unit, quantity: 1, kind: 'ingredient', stockAction: 'new', equipmentAction: 'none', amount: 82.35, unitPrice: 82.35, ...extra });
  it('le poids se lit sur le nom, jamais inventé', () => {
    expect(poidsDePiece(ligne('Idaho 7 pellets 100 g', 'pièce'))?.grammes).toBe(100);
    expect(poidsDePiece(ligne('Idaho 7', 'pièce'))).toBeUndefined();
  });
  it('un houblon neuf en pièce sans poids : refusé (« 1 pièce = ? g »), avec poids ou en g : rien', () => {
    expect(erreursPoidsManquant([ligne('Idaho 7', 'pièce')])[0]).toMatch(/1 pièce = \? g/);
    expect(erreursPoidsManquant([ligne('Idaho 7', 'sachet')]).length).toBe(1);
    expect(erreursPoidsManquant([ligne('Idaho 7 pellets 100 g', 'pièce')])).toEqual([]);
    expect(erreursPoidsManquant([ligne('Idaho 7', 'g', { quantity: 100 })])).toEqual([]);
  });
  it('un malt neuf en pièce sans poids : refusé aussi ; une levure en sachet, jamais (c’est son unité)', () => {
    expect(erreursPoidsManquant([ligne('Malt Pilsner', 'pièce')]).length).toBe(1);
    expect(erreursPoidsManquant([ligne('Safale US-05', 'sachet')])).toEqual([]);
  });
  it('une ligne sans stock, ou reliée (validatePurchase la refuse déjà), n’ajoute rien', () => {
    expect(erreursPoidsManquant([ligne('Idaho 7', 'pièce', { stockAction: 'none' })])).toEqual([]);
    expect(erreursPoidsManquant([ligne('Idaho 7', 'pièce', { stockAction: 'existing', stockRef: 'MP-Idaho7' })])).toEqual([]);
  });
  it('« Compter en g » : la quantité devient q × poids, le montant reste, le prix suit', () => {
    const p = compterEnGrammes(ligne('Idaho 7 pellets 100 g', 'pièce', { quantity: 2, amount: 20, unitPrice: 10 }), 100);
    expect(p).toEqual({ unit: 'g', quantity: 200, unitPrice: 0.1 });
  });
});
