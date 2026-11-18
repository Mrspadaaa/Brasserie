// Voie f2-confiance (D277) : les trois niveaux d'une ligne, les règles d'unité une à une, l'unité tapée jamais réécrite.
// Pièces INVENTÉES : aucun nom, aucune valeur d'une vraie pièce.
import { describe, expect, it } from 'vitest';
import { confianceLigne, deduireUnite, pireNiveau, totalCorrobore, type LigneConfiance } from '../../../../src/ui/depense/confiance';
import type { StockItem } from '../../../../src/types';

let n = 0;
const ligne = (description: string, quantity: number | undefined, unitPrice: number | undefined, over: Partial<LigneConfiance> = {}): LigneConfiance => ({
  id: `line-${++n}`, description, kind: 'stock', quantity, unit: '', unitPrice,
  amount: quantity !== undefined && unitPrice !== undefined ? Math.round(quantity * unitPrice * 100) / 100 : undefined, stockCategory: '', ...over,
});
const unite = (l: LigneConfiance, lignes: readonly LigneConfiance[] = [l]) => deduireUnite(l, { lignes });

describe('une ligne vide ajoutée à la main : rien de lisible, tout est inconnu', () => {
  it('unité, quantité, prix et montant : rouge, jamais 0', () => {
    const vide: LigneConfiance = { id: 'line-99', description: '', kind: 'ingredient', unit: '' };
    const c = confianceLigne(vide, { lignes: [vide] });
    for (const champ of ['unite', 'quantite', 'prix', 'montant'] as const) {
      expect(c[champ].niveau, champ).toBe('inconnu');
      expect(c[champ].valeur, champ).toBeUndefined();
    }
    expect(c.pire).toBe('inconnu');
  });
});

describe('les règles d\'unité, une à une (PLAN.md, correspondance 2)', () => {
  it('0. une unité imprimée ou tapée est sûre, rendue en symbole, jamais réécrite dans la ligne', () => {
    for (const [imprimee, attendue] of [['Gramm', 'g'], ['Kg', 'Kg'], ['Stk', 'Stk'], ['sachet', 'sachet']] as const) {
      const l = ligne('Saaz fictif 3.5%', 87, 0.04, { unit: imprimee });
      const u = unite(l);
      expect(u).toMatchObject({ niveau: 'sur', valeur: attendue, source: 'imprimee', regle: 'imprimee' });
      expect(l.unit).toBe(imprimee);
    }
  });
  it('0. une unité tapée qui contredit le prix reste telle quelle : « kg » sur 87 × 0,04 n\'est pas corrigée en g', () => {
    const l = ligne('Saaz fictif 3.5%', 87, 0.04, { unit: 'kg' });
    expect(unite(l)).toMatchObject({ niveau: 'sur', valeur: 'kg', source: 'imprimee' });
  });
  it('0. un point d\'interrogation ou un nombre n\'est pas une unité : la déduction travaille', () => {
    const l = ligne('Cuve fictive 30 Liter', 1, 39, { kind: 'equipment', unit: '?' });
    expect(unite(l)).toMatchObject({ niveau: 'sur', valeur: 'Stk', source: 'deduite' });
  });
  it('1. port, remise, service : sans objet, sûr, sans valeur ; entretien et divers (D328b) : une pièce déduite, sûre, quand la quantité est entière', () => {
    for (const kind of ['shipping', 'discount', 'service']) {
      const u = unite(ligne('Ligne fictive', 1, 5, { kind }));
      expect(u).toMatchObject({ niveau: 'sur', source: 'aucune', regle: 'sans-objet' });
      expect(u.valeur).toBeUndefined();
    }
    for (const kind of ['other', 'maintenance']) expect(unite(ligne('Ligne fictive', 1, 5, { kind }))).toMatchObject({ niveau: 'sur', valeur: 'Stk', source: 'deduite', regle: 'piece-hors-stock' });
  });
  it('2. quantité absente, nulle ou négative : inconnu', () => {
    for (const q of [undefined, 0, -2]) expect(unite(ligne('Malt fictif', q, 1.7))).toMatchObject({ niveau: 'inconnu', regle: 'sans-quantite' });
  });
  it('3. « …, Kg » dans le nom : sûr quand q × p = montant, repris sinon', () => {
    expect(unite(ligne('Malt fictif, Kg', 5, 1.65))).toMatchObject({ niveau: 'sur', valeur: 'kg', regle: 'unite-dans-le-nom' });
    expect(unite(ligne('Malt fictif, Gramm', 350, 0.0051, { amount: 1.79 }))).toMatchObject({ niveau: 'sur', valeur: 'g' });
    expect(unite(ligne('Malt fictif, Kg', 5, 1.65, { amount: 9.9 }))).toMatchObject({ niveau: 'repris', valeur: 'kg' });
    expect(unite(ligne('Malt fictif, Kg', 5, undefined, { amount: 8.25 }))).toMatchObject({ niveau: 'repris', valeur: 'kg' });
  });
  it('3. la sous-ligne d\'une feuille de fournisseur (« Mischung : … ») ne cache pas l\'unité du nom', () => {
    expect(unite(ligne('Malt fictif, Gramm\nMischung: Einzelprodukt Schrotung', 350, 0.0051, { amount: 1.785 }))).toMatchObject({ valeur: 'g' });
  });
  it('4-6. la levure : sachet à 2-25 (sûr si le calcul tombe juste), brique au-delà de 50 g, plus grosse pièce au-delà de 25', () => {
    expect(unite(ligne('Wyeast 9999 Souche fictive', 2, 9.5))).toMatchObject({ niveau: 'sur', valeur: 'sachet', regle: 'levure-sachet' });
    expect(unite(ligne('Safale US-05 11,5g', 3, 3.2))).toMatchObject({ niveau: 'sur', valeur: 'sachet' });
    expect(unite(ligne('Safale US-05 11,5g', 3, 3.2, { amount: 12 }))).toMatchObject({ niveau: 'repris', valeur: 'sachet' });
    expect(unite(ligne('Safale US-05 500 g', 1, 55))).toMatchObject({ niveau: 'repris', valeur: 'Stk', regle: 'levure-brique' });
    expect(unite(ligne('Wyeast 9999 Souche fictive', 1, 60))).toMatchObject({ niveau: 'repris', valeur: 'Stk', regle: 'levure-piece' });
  });
  it('7. un tuyau se vend au mètre : repris, jamais sûr (le métrage n\'est pas imprimé)', () => {
    expect(unite(ligne('Silikonschlauch 5x8mm', 2, 3.6, { kind: 'equipment' }))).toMatchObject({ niveau: 'repris', valeur: 'm', regle: 'tuyau-metre' });
    expect(unite(ligne('Schlauchverbinder fictif', 1, 3.5, { kind: 'equipment' }))).toMatchObject({ niveau: 'sur', valeur: 'Stk' });
  });
  it('8. une pièce de matériel : sûre à 1, sûre si le calcul tombe juste, reprise sinon ; non entière : inconnu', () => {
    expect(unite(ligne('Cuve fictive 30 Liter', 1, 39, { kind: 'equipment' }))).toMatchObject({ niveau: 'sur', valeur: 'Stk' });
    expect(unite(ligne('Hopfensack fictif', 4, 0.8, { kind: 'equipment' }))).toMatchObject({ niveau: 'sur', valeur: 'Stk' });
    expect(unite(ligne('Hopfensack fictif', 4, 0.8, { kind: 'equipment', amount: 4 }))).toMatchObject({ niveau: 'repris', valeur: 'Stk' });
    expect(unite(ligne('Cuve fictive', 2.5, 39, { kind: 'equipment' }))).toMatchObject({ niveau: 'inconnu' });
  });
  it('9. un paquet dans le nom (« 100 Kapseln », « je 100 St », « 24-fach ») : une pièce, reprise', () => {
    for (const nom of ['Kronkorken 100 Kapseln fictif', 'Gummiring fictif je 100 St', 'Karton 24-fach fictif']) {
      expect(unite(ligne(nom, 1, 2.5, { kind: 'packaging' })), nom).toMatchObject({ niveau: 'repris', valeur: 'Stk', regle: 'paquet' });
    }
  });
  it('10. un emballage sans paquet dans le nom : une pièce, sûre à 1', () => {
    expect(unite(ligne('Bouteille fictive brune', 1, 12, { kind: 'packaging' }))).toMatchObject({ niveau: 'sur', valeur: 'Stk' });
  });
  it('11-12. le houblon : des grammes à quelques centimes (repris), un paquet à quelques francs', () => {
    const g = unite(ligne('Saaz fictif 3.5%', 85, 0.04));
    expect(g).toMatchObject({ niveau: 'repris', valeur: 'g', regle: 'houblon-gramme' });
    expect(g.raison).toBe('85 × 0,04 = 3,40 : des grammes');
    expect(unite(ligne('Cryo Hops fictif 24.8% 25g', 1, 7.5))).toMatchObject({ niveau: 'repris', valeur: 'Stk', regle: 'houblon-paquet' });
    expect(unite(ligne('Saaz fictif 3.5%', 1, 0.04))).toMatchObject({ niveau: 'inconnu', regle: 'houblon-indecis' });
  });
  it('13. une mesure en fin de nom est une contenance : 460 ml, 250 g, 0,5 Kg → une pièce, reprise', () => {
    for (const nom of ['Sirop fictif 460ml', 'Poudre fictive 250 g', 'Extrait fictif 0,5 Kg']) {
      expect(unite(ligne(nom, 1, 7.5, { kind: 'ingredient', stockCategory: 'Sucre' })), nom).toMatchObject({ niveau: 'repris', valeur: 'Stk', regle: 'mesure-contenance' });
    }
  });
  it('14. « 1 Kg » en fin de nom : un paquet de 1 kg vaut 1 kg, repris (l\'étiquette du magasin peut dire pièce)', () => {
    expect(unite(ligne('Flocons fictifs, 1 Kg', 2, 2.5))).toMatchObject({ niveau: 'repris', valeur: 'kg', regle: 'mesure-un' });
  });
  it('14. le nombre après « Typ » est une identité, pas une taille', () => {
    expect(unite(ligne('Malt fictif Typ 2 Kg', 1, 1.85))).toMatchObject({ valeur: 'kg', niveau: 'repris' });
  });
  it('15-16. un malt : au kilo à quelques francs, au gramme à quelques millimes, sinon inconnu', () => {
    expect(unite(ligne('Pilsner Malz fictif', 5, 1.65))).toMatchObject({ niveau: 'repris', valeur: 'kg', regle: 'malt-kilo' });
    expect(unite(ligne('Pilsner Malz fictif', 500, 0.0021))).toMatchObject({ niveau: 'repris', valeur: 'g', regle: 'malt-gramme' });
    expect(unite(ligne('Pilsner Malz fictif', 5, 0.3))).toMatchObject({ niveau: 'inconnu', regle: 'malt-indecis' });
    expect(unite(ligne('Pilsner Malz fictif', 5, 45))).toMatchObject({ niveau: 'inconnu' });
  });
  it('17. autre famille, entier, plus de 50 centimes : une pièce, sûre quand q × prix = montant (D328a), reprise sinon ; fractionnaire : inconnu', () => {
    expect(unite(ligne('Produit fictif XJ-17', 3, 9.9))).toMatchObject({ niveau: 'sur', valeur: 'Stk', regle: 'piece-defaut' });
    expect(unite(ligne('Produit fictif XJ-17', 3, 9.9, { amount: undefined }))).toMatchObject({ niveau: 'repris', valeur: 'Stk', regle: 'piece-defaut' });
    expect(unite(ligne('Produit fictif XJ-17', 3, 9.9, { amount: 31 }))).toMatchObject({ niveau: 'repris', valeur: 'Stk', regle: 'piece-defaut' });
    expect(unite(ligne('Produit fictif XJ-17', 2.5, 9.9))).toMatchObject({ niveau: 'inconnu' });
    expect(unite(ligne('Produit fictif XJ-17', 3, 0.1))).toMatchObject({ niveau: 'inconnu' });
  });
  it('18. sans règle, l\'article relié tenu en sachet ou en pièce donne l\'unité (repris) ; tenu au kilo, jamais', () => {
    const article = (unit: string): StockItem => ({ id: 'a', ref: 'MP-1', name: 'Article fictif', category: 'Additif', unit, currentStock: 0, minStock: 0 } as unknown as StockItem);
    const l = ligne('Produit fictif XJ-17', 3, 0.1, { stockAction: 'existing', stockRef: 'MP-1' });
    expect(deduireUnite(l, { lignes: [l], articles: [article('sachet')] })).toMatchObject({ niveau: 'repris', valeur: 'sachet', regle: 'unite-de-l-article' });
    expect(deduireUnite(l, { lignes: [l], articles: [article('kg')] })).toMatchObject({ niveau: 'inconnu' });
  });
  it('19. sans règle, les autres lignes de la famille qui impriment toutes la même unité la donnent', () => {
    const net = (nom: string, q: number, p: number, over: Partial<LigneConfiance> = {}) => ligne(nom, q, p, { kind: 'cleaning', ...over });
    const a = net('Nettoyant fictif A', 3, 0.1, { unit: 'sachet' }), b = net('Nettoyant fictif B', 3, 0.12, { unit: 'sachet' }), c = net('Nettoyant fictif C', 3, 0.1);
    expect(unite(c, [a, b, c])).toMatchObject({ niveau: 'repris', valeur: 'sachet', regle: 'unite-des-voisines' });
    const d = net('Nettoyant fictif D', 3, 0.1, { unit: 'kg' });
    expect(unite(c, [a, d, c])).toMatchObject({ niveau: 'inconnu' });
  });
  it('19. la famille « Autres » n\'éclaire rien : ses lignes n\'ont rien en commun', () => {
    const a = ligne('Produit fictif A', 3, 0.1, { unit: 'sachet' }), b = ligne('Produit fictif B', 3, 0.12, { unit: 'sachet' }), c = ligne('Produit fictif C', 3, 0.1);
    expect(unite(c, [a, b, c])).toMatchObject({ niveau: 'inconnu' });
  });
  it('seconde source : deux autres lignes de la famille imprimant la même unité font passer un repris à sûr', () => {
    const net = (nom: string, q: number, p: number, over: Partial<LigneConfiance> = {}) => ligne(nom, q, p, { kind: 'cleaning', ...over });
    const a = net('Nettoyant fictif A', 2, 4, { unit: 'Stk' }), b = net('Nettoyant fictif B', 3, 5, { unit: 'Stk' }), c = net('Nettoyant fictif C', 1, 4.5, { amount: undefined }); // montant absent : le calcul ne confirme rien (D328a : un calcul qui tombe juste est déjà sûr seul)
    expect(unite(c, [a, b, c])).toMatchObject({ niveau: 'sur', valeur: 'Stk', regle: 'piece-defaut' });
    expect(unite(c, [a, c])).toMatchObject({ niveau: 'repris', valeur: 'Stk' });
    expect(unite(c)).toMatchObject({ niveau: 'repris', valeur: 'Stk' });
  });
  it('un article relié tenu au kilo plafonne une unité déduite à la pièce : repris, et la raison le dit', () => {
    const article = { id: 'a', ref: 'MP-2', name: 'Article fictif', category: 'Sucre', unit: 'kg', currentStock: 0, minStock: 0 } as unknown as StockItem;
    const l = ligne('Cuve fictive', 1, 39, { kind: 'equipment', stockAction: 'existing', stockRef: 'MP-2' });
    const u = deduireUnite(l, { lignes: [l], articles: [article] });
    expect(u.niveau).toBe('repris');
    expect(u.raison).toContain('se tient en kg');
  });
});

describe('quantité, prix, montant : un calcul exact est sûr, une contradiction se signale', () => {
  it('q × p = montant : les trois sont sûrs', () => {
    const l = ligne('Malt fictif, Kg', 5, 1.65);
    const c = confianceLigne(l, { lignes: [l] });
    expect([c.quantite.niveau, c.prix.niveau, c.montant.niveau]).toEqual(['sur', 'sur', 'sur']);
    expect(c.montant.raison).toContain('tombe juste');
  });
  it('q × p ≠ montant, total qui corrobore : montant sûr, quantité et prix repris', () => {
    const l = ligne('Malt fictif, Kg', 5, 1.65, { amount: 9.9 });
    const ctx = { lignes: [l], total: 9.9 };
    expect(totalCorrobore(ctx)).toBe(true);
    const c = confianceLigne(l, ctx);
    expect([c.quantite.niveau, c.prix.niveau, c.montant.niveau]).toEqual(['repris', 'repris', 'sur']);
  });
  it('q × p ≠ montant, rien ne corrobore : montant inconnu (rouge), quantité et prix repris', () => {
    const l = ligne('Malt fictif, Kg', 5, 1.65, { amount: 9.9 });
    const c = confianceLigne(l, { lignes: [l], total: 50 });
    expect([c.quantite.niveau, c.prix.niveau, c.montant.niveau]).toEqual(['repris', 'repris', 'inconnu']);
    expect(c.montant.raison).toContain('rien ne le tranche');
  });
  it('un prix par 100 g (rapport 1/100) n\'est pas un écart : prix repris, montant intact', () => {
    const l = ligne('Houblon fictif 5%', 300, 0.0, { unit: 'g', unitPrice: 2.4, amount: 7.2 });
    const c = confianceLigne(l, { lignes: [l] });
    expect(c.prix.niveau).toBe('repris');
    expect(c.montant.niveau).toBe('sur');
  });
  it('une valeur absente est inconnue ; sur un service, sans objet', () => {
    const l = ligne('Malt fictif, Kg', 5, undefined);
    const c = confianceLigne(l, { lignes: [l] });
    expect(c.prix).toMatchObject({ niveau: 'inconnu' });
    expect(c.montant).toMatchObject({ niveau: 'inconnu' });
    const s = ligne('Hébergement fictif', undefined, undefined, { kind: 'service', amount: 5 });
    const cs = confianceLigne(s, { lignes: [s] });
    expect(cs.quantite).toMatchObject({ niveau: 'sur' });
    expect(cs.prix).toMatchObject({ niveau: 'sur' });
    expect(cs.montant).toMatchObject({ niveau: 'sur', valeur: 5 });
  });
  it('la famille « Autres » d\'un ingrédient est reprise, celle d\'un port est sûre', () => {
    const l = ligne('Produit fictif XJ-17', 3, 9.9);
    expect(confianceLigne(l, { lignes: [l] }).famille.niveau).toBe('repris');
    const port = ligne('Versand fictif', 1, 30, { kind: 'shipping' });
    expect(confianceLigne(port, { lignes: [port] }).famille.niveau).toBe('sur');
  });
  it('un article relié introuvable est inconnu ; un article neuf, sûr', () => {
    const l = ligne('Pilsner Malz fictif', 5, 1.65, { stockAction: 'existing', stockRef: 'MP-404' });
    expect(confianceLigne(l, { lignes: [l], articles: [] }).article.niveau).toBe('inconnu');
    expect(confianceLigne({ ...l, stockAction: 'new' }, { lignes: [l] }).article.niveau).toBe('sur');
  });
});

describe('pireNiveau', () => {
  it('inconnu > repris > sur ; vide : sur', () => {
    expect(pireNiveau([])).toBe('sur');
    expect(pireNiveau(['sur', 'repris'])).toBe('repris');
    expect(pireNiveau(['repris', { niveau: 'inconnu' }, 'sur'])).toBe('inconnu');
  });
});
