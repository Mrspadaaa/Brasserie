// @vitest-environment jsdom
/**
 * Voie « su » (14.11) : constats ST-T1 à ST-T9 de « Mur du stock et tri des factures ». Fixtures fictives ; Gemini jamais appelé.
 * ST-T1 : un paquet pesé vendu à la pièce (« Lactose, Milchzucker 1 Kg » en Stk) se rattache à l'article en kg (le poids lu compte en g d'office).
 * ST-T2 : « Cryo Hops Citra 25g » (article en Pck, ligne sans unité → Stk) : le rattachement proposé passe aussi à l'enregistrement.
 */
import { describe, expect, it, vi } from 'vitest';
vi.mock('firebase/functions', () => ({ httpsCallable: () => vi.fn() }));
vi.mock('../../../src/services/firebase', () => ({ functions: {} }));
import { GeminiScannerService } from '../../../src/services/geminiScanner';
import { brouillonDeLecture } from '../../../src/ui/depense/finale';
import { stockQuantityFor, uniteEffective } from '../../../src/services/purchaseEntry';
import { construireMur, legendeAutres, styleLevureConnu } from '../../../src/domain/stock/murDonnees';
import { Units } from '../../../src/services/units';

const article = (more: Record<string, unknown> = {}): any => ({ id: 'a1', ref: 'MP-A1', name: 'X', category: 'Houblon', unit: 'g', currentStock: 0, minStock: 0, reorder: false, ...more });
const ligneVide = () => ({ id: 'x', description: '', kind: 'ingredient', unit: '', stockAction: 'none', equipmentAction: 'none' }) as any;
const vide = () => ({ submissionId: 'S1', date: '14.11.2026', vendor: '', invoiceNumber: '', description: '', category: 'brassage', lines: [], paymentStatus: 'paid', paymentMethod: 'bank', paymentDate: '14.11.2026', dueDate: '' }) as any;
const lecture = (nom: string, unit: string, stockCategory: string, quantity = 1, amount = 10): any => GeminiScannerService.normalizeResult({
  vendor: 'Fournisseur Fictif', documentType: 'invoice', paymentEvidence: 'paid', fieldWarnings: [], date: '14.11.2026', currency: 'CHF', invoiceNumber: '', proForma: false, vat: [], printedLineCount: 1,
  amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: amount, category: 'brassage', description: 'Ingrédients',
  items: [{ id: 'line-1', name: nom, kind: 'stock', stockCategory, reference: '', variant: '', quantity, unit, price: amount / quantity, amountTTC: amount, evidence: nom, ambiguity: '' }],
} as any);
const poser = (nom: string, unit: string, stockCategory: string, stock: any[], quantity = 1, amount = 10) =>
  brouillonDeLecture(vide(), lecture(nom, unit, stockCategory, quantity, amount), { stockItems: stock, today: '14.11.2026', ligneVide });

describe('ST-T1 — un paquet pesé vendu à la pièce se rattache à l’article en kg', () => {
  it('« Lactose, Milchzucker 1 Kg » en Stk, face à « Lactose, Milchzucker » en kg : rattaché, 1 kg ajouté', () => {
    const lactose = article({ ref: 'MP-Lactose', name: 'Lactose, Milchzucker', category: 'Additif', unit: 'kg', currentStock: 2 });
    const { draft, propositions } = poser('Lactose, Milchzucker 1 Kg', 'Stk', 'Additif', [lactose], 1, 8.5);
    const l = draft.lines[0];
    expect(l.stockAction).toBe('existing');
    expect(l.stockRef).toBe('MP-Lactose');
    expect(propositions.neufDOffice.has(l.id)).toBe(false);
    const q = stockQuantityFor({ description: l.description, quantity: l.quantity as number, unit: uniteEffective(l) }, lactose);
    expect(q).toEqual({ ok: true, quantity: 1, via: 'conversion' });
  });
  it('« Malzextraktpulver hell 0,5 Kg » en Stk × 2, face à l’article en Kg : 1 Kg ajouté', () => {
    const extrait = article({ ref: 'MP-Malzextrakt', name: 'Malzextraktpulver hell', category: 'Malt', unit: 'Kg', currentStock: 1 });
    const { draft } = poser('Malzextraktpulver hell 0,5 Kg', 'Stk', 'Malt', [extrait], 2, 24);
    const l = draft.lines[0];
    expect(l.stockAction).toBe('existing');
    expect(l.stockRef).toBe('MP-Malzextrakt');
    const q = stockQuantityFor({ description: l.description, quantity: l.quantity as number, unit: uniteEffective(l) }, extrait);
    expect(q.ok && q.quantity).toBe(1);
  });
  it('sans article au stock : le poids lu compte en g d’office, le montant imprimé reste', () => {
    const { draft } = poser('Lactose, Milchzucker 1 Kg', 'Stk', 'Additif', [], 1, 8.5);
    const l = draft.lines[0];
    expect(l.stockAction).toBe('new');
    expect(uniteEffective(l)).toBe('g');
    expect(l.quantity).toBe(1000);
    expect(l.amount).toBe(8.5);
  });
  it('une levure en sachet garde sa pièce (11,5 g est le poids du sachet, pas la quantité)', () => {
    const { draft } = poser('Safale US-05 11,5 g', 'Stk', 'Levure', [], 3, 15);
    expect(uniteEffective(draft.lines[0])).toBe('Stk');
    expect(draft.lines[0].quantity).toBe(3);
  });
  it('une ligne en g ou en kg ne change pas', () => {
    const { draft } = poser('Citra pellets', 'g', 'Houblon', [], 100, 10);
    expect(uniteEffective(draft.lines[0])).toBe('g');
    expect(draft.lines[0].quantity).toBe(100);
  });
});

describe('ST-T2 — Cryo Citra (article en Pck, ligne sans unité lue → Stk) : ce que l’écran propose, l’enregistrement l’accepte', () => {
  const cryo = article({ ref: 'MP-Cryo', name: 'Cryo Hops Citra 25g', category: 'Houblon', unit: 'Pck', currentStock: 2, alphaPct: 24.8 });
  it('le rattachement proposé est accepté par la règle d’unités de l’écriture (1 Pck ajouté)', () => {
    const { draft } = poser('Cryo Hops Citra 25g', '', 'Houblon', [cryo], 1, 9);
    const l = draft.lines[0];
    expect(l.stockAction).toBe('existing');
    expect(l.stockRef).toBe('MP-Cryo');
    const q = stockQuantityFor({ description: l.description, quantity: l.quantity as number, unit: uniteEffective(l) }, cryo);
    expect(q.ok).toBe(true);
    expect(q.ok && q.quantity).toBe(1);
  });
  it('en Stk ou pièce, même chose', () => {
    for (const unit of ['Stk', 'pièce']) {
      const { draft } = poser('Cryo Hops Citra 25g', unit, 'Houblon', [cryo], 1, 9);
      const l = draft.lines[0];
      expect(l.stockAction, unit).toBe('existing');
      expect(stockQuantityFor({ description: l.description, quantity: l.quantity as number, unit: uniteEffective(l) }, cryo).ok, unit).toBe(true);
    }
  });
  it('un rattachement proposé est toujours acceptable à l’écriture (jamais refusé après coup)', () => {
    const { draft, propositions } = poser('Cryo Hops Citra 25g', 'Stk', 'Houblon', [cryo], 1, 9);
    for (const l of draft.lines.filter(x => propositions.proposedStock.has(x.id))) {
      const cible = [cryo].find(a => a.ref === l.stockRef)!;
      expect(stockQuantityFor({ description: l.description, quantity: l.quantity as number, unit: uniteEffective(l) }, cible).ok).toBe(true);
    }
  });
});

describe('ST-T6 — le style d’une levure se lit sur un mot entier, jamais dans un numéro de lot', () => {
  const style = (name: string, yeastStrain?: string) => styleLevureConnu({ name, yeastStrain } as any);
  it('le code d’une souche seule reste lu (Wyeast 1214, 2565 ; WLP530 ; K-97)', () => {
    expect(style('Wyeast 1214 Belgian Abbey')).toBe('Belge');
    expect(style('Wyeast 1214')).toBe('Belge');
    expect(style('Levure 2565')).toBe('Kölsch');
    expect(style('WLP530')).toBe('Belge');
    expect(style('Safale K-97')).toBe('Kölsch');
    expect(style('Safbrew T-58')).toBe('Belge');
    expect(style('Safale BE-256')).toBe('Belge');
  });
  it('un numéro de lot ou un nombre plus long ne donne aucun style', () => {
    expect(style('Levure maison F12141')).toBeNull();
    expect(style('Levure 25651')).toBeNull();
    expect(style('Levure maison lot 1214')).toBeNull();
    expect(style('Levure maison N° 2565')).toBeNull();
    expect(style('Levure WLP5301')).toBeNull();
    expect(style('Levure SK-974')).toBeNull();
    expect(style('Levure maison', 'lot 3787')).toBeNull();
  });
});

describe('ST-T7 — l’unité comptée s’accorde au pluriel', () => {
  it('fiole, paquet, sachet, boîte et autres unités comptées', () => {
    expect(Units.format(2, 'fiole')).toBe('2 fioles');
    expect(Units.format(1, 'fiole')).toBe('1 fiole');
    expect(Units.format(0, 'fiole')).toBe('0 fiole');
    expect(Units.format(3, 'paquet')).toBe('3 paquets');
    expect(Units.format(2, 'sachet')).toBe('2 sachets');
    expect(Units.format(4, 'boîte')).toBe('4 boîtes');
    expect(Units.format(2, 'Fiole')).toBe('2 Fioles');
    expect(Units.format(3, 'bouteille')).toBe('3 bouteilles');
    expect(Units.format(2, 'rouleau')).toBe('2 rouleaux');
  });
  it('1,5 reste au singulier (le pluriel français commence à 2) ; Stk, Pck, g et kg ne changent pas', () => {
    expect(Units.format(1.5, 'fiole')).toBe('1,5 fiole');
    expect(Units.format(2, 'Stk')).toBe('2 Stk');
    expect(Units.format(2, 'Pck')).toBe('2 Pck');
    expect(Units.format(250, 'g')).toBe('250 g');
    expect(Units.format(1500, 'g')).toBe('1,5 kg');
  });
});

describe('ST-T4 — la légende du gris dit ce que dit la bulle', () => {
  const src: any = { typeMalt: () => null, houblon: () => null, auFrais: () => null, parts: () => null, colonneLevure: () => null, attenuation: () => null };
  const levure = (ref: string, name: string) => article({ ref, name, category: 'Levure', unit: 'sachet', currentStock: 2 });
  const mur = (...l: any[]) => construireMur(l, src);
  const autres = (m: any) => m.rayons.find((r: any) => r.id === 'f2');
  it('French Saison M29 en Autres : la bulle dit « style Saison » et la légende aussi (plus « type non connu » seul)', () => {
    const r = autres(mur(levure('l1', 'French Saison M29')));
    const marque = r.groupes[0].marques[0];
    expect(marque.titre).toContain('style Saison');
    expect(marque.style).toBe('Saison');
    expect(legendeAutres(r)).toBe('gris : colonne Autres (style Saison, sans colonne)');
  });
  it('une levure sans style lu (Sekt/Champagner) reste « type non connu » ; avec une Saison à côté : les deux', () => {
    const seule = autres(mur(levure('l2', 'Sekt/Champagner Trockenhefe')));
    expect(seule.groupes[0].marques[0].titre).toContain('type non connu');
    expect(legendeAutres(seule)).toBe('gris : colonne Autres (type non connu)');
    const deux = autres(mur(levure('l1', 'French Saison M29'), levure('l2', 'Sekt/Champagner Trockenhefe')));
    expect(legendeAutres(deux)).toBe('gris : colonne Autres (style Saison, sans colonne ; ou type non connu)');
  });
});
