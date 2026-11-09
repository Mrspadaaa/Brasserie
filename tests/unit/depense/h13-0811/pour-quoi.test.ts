/**
 * Lecture en ligne du 08.11 (point 2) : « Pour quoi ? : matériel, emballages » sur une facture de malts et de houblons (doc8 facture et doc10 commande d'un fournisseur de brasserie ; la catégorie, elle, dit Brassage).
 * Cause : `invoicePurchaseDescription` (src/services/purchasePrefill.ts) garde les familles dans l'ordre d'apparition ; la commande commence par du matériel et le plafond de 60 caractères
 * coupait les ingrédients (corrigé en partie par LP-4 : « matières premières » devant). Ici : la description dit « ingrédients » (le mot de l'app pour les lignes de stock), puis les autres familles
 * classées par NOMBRE DE LIGNES (la majorité d'abord), la première apparition ne départageant que les égalités.
 * Les lectures sont de vraies sorties stockées du banc k6 (variante Csv8), ANONYMISÉES (fournisseur, numéros et références fictifs ; lignes, montants, quantités, structure inchangés) : ./doc8.json, ./doc10.json.
 * Aucune donnée personnelle dans Git. Aucun appel à Gemini.
 */
import { describe, expect, it } from 'vitest';
import { invoicePurchaseDescription } from '../../../../src/services/purchasePrefill';
import doc8 from './doc8.json';
import doc10 from './doc10.json';

const ligne = (id: string, name: string, kind: string, stockCategory?: string) => ({ id, name, kind, quantity: 1, unit: kind === 'stock' ? 'Kg' : '', amountTTC: 10, stockCategory }) as any;
const lecture = (items: any[], plus: Record<string, unknown> = {}): any => ({ documentType: 'invoice', vendor: 'B&R', date: '06.08.2024', currency: 'CHF', invoiceNumber: '1', amountHT: null, amountTTC: 100, tvaRate: null, tvaAmount: null,
  category: 'brassage', subcategory: '', description: '', items, issues: [], review: { status: 'checked', findings: [] }, ...plus });

describe('« Pour quoi ? » reflète la majorité des lignes', () => {
  it('doc8 (vraie lecture : 21 lignes de stock, 8 de matériel, 5 de service, 1 d’emballage) : « ingrédients » d’abord, jamais « matériel, emballages » seul', () => {
    // Le plafond de 60 caractères décide : le vrai fournisseur faisait 24 caractères, le fictif en fait 33. Avec 33, « ingrédients » seul tient (HEAD le disait déjà) ;
    // la longueur du vrai est rendue par un nom fictif de 25 caractères, qui remet le matériel à côté des ingrédients (HEAD : « matières premières »).
    expect(invoicePurchaseDescription(doc8 as any)).toBe('Brasserie-Fourniture Fictive GmbH · 111111 · ingrédients');
    const texte = invoicePurchaseDescription({ ...(doc8 as any), vendor: 'Brasserie-Fourniture GmbH' });
    expect(texte).toBe('Brasserie-Fourniture GmbH · 111111 · ingrédients, matériel');
    expect(texte).not.toBe('Brasserie-Fourniture GmbH · 111111 · matériel, emballages');
    expect(texte.length).toBeLessThanOrEqual(60);
  });
  it('doc10 (vraie lecture : 22 lignes de stock, 8 de matériel) : « ingrédients » d’abord, puis le matériel, la famille la plus nombreuse', () => {
    const texte = invoicePurchaseDescription(doc10 as any);
    expect(texte.startsWith('Brasserie-Fourniture Fictive GmbH · ingrédients, matériel')).toBe(true);
    expect(texte.length).toBeLessThanOrEqual(60);
  });
  it('les familles hors ingrédients se rangent par nombre de lignes : 3 lignes de matériel avant 1 d’emballage, même si l’emballage vient en premier', () => {
    const items = [ligne('a', 'Kronkorken', 'packaging'), ligne('b', 'Gärtank', 'equipment'), ligne('c', 'Hahn', 'equipment'), ligne('d', 'Siphon', 'equipment'), ligne('e', 'Pilsner Malz', 'stock', 'Malt'), ligne('f', 'Pale Ale Malz', 'stock', 'Malt')];
    expect(invoicePurchaseDescription(lecture(items))).toBe('B&R · 1 · malts, matériel, emballages');
  });
  it('plusieurs familles de matières qui ne tiennent pas dans 60 caractères nomment celles qui tiennent, suivies de « … » (RF-15), jamais « matières premières »', () => {
    const items = [ligne('a', 'Gärtank', 'equipment'), ligne('b', 'Kronkorken', 'packaging'), ligne('c', 'Pilsner Malz', 'stock', 'Malt'), ligne('d', 'Aramis', 'stock', 'Houblon'), ligne('e', 'Wyeast 3944', 'stock', 'Levure')];
    const texte = invoicePurchaseDescription(lecture(items, { vendor: 'Brasserie-Fourniture GmbH', invoiceNumber: '100001' }));
    expect(texte).toBe('Brasserie-Fourniture GmbH · 100001 · malts, houblons…'); // RF-15 : les deux plus nombreuses qui tiennent, et le « … » dit qu'il y en a d'autres
    expect(texte).not.toContain('matières premières');
  });
  it('quand tout tient, les familles de matières restent nommées (malts, houblons, levures)', () => {
    const items = [ligne('c', 'Pilsner Malz', 'stock', 'Malt'), ligne('d', 'Aramis', 'stock', 'Houblon'), ligne('e', 'Wyeast 3944', 'stock', 'Levure')];
    expect(invoicePurchaseDescription(lecture(items))).toBe('B&R · 1 · malts, houblons, levures');
  });
});
