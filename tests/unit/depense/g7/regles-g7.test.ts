// Voie g7-reste, les règles pures : M1 (D328a, D353) un désaccord sur la seule nature d'une ligne sans stock n'engage rien ; M11 (D334) « ⇄ Choisir un autre article » touché sans choisir est un champ à remplir
// quelle que soit la nature. Pièces INVENTÉES (« Brico Fictif »), aucune valeur d'une vraie pièce. Chaque cas échoue sur 60a8c25f.
import { describe, expect, it } from 'vitest';
import { confianceLigne, natureSansEnjeu, type LigneConfiance } from '../../../../src/ui/depense/confiance';
import { articleCompte, champsARemplir, contexteConfiance, ligneConfianceDe, niveauxRangee } from '../../../../src/ui/depense/rangees';
import { makePoint } from '../../../../functions/src/invoiceControls';
import { PESE_PAR_CODE, type InvoicePoint } from '../../../../src/domain/finance/invoicePoints';
import type { PurchaseLineDraft } from '../../../../src/services/purchaseEntry';

/** Un désaccord des trois lectures sur une cellule d'une ligne (`items.<n>.<cellule>`). */
const desaccord = (n: number, cellule: string, valeurs: string[]): InvoicePoint => {
  const base = makePoint('lectures-divergentes', 'ecart', 'items', n, { regle: 'règle fictive', message: 'message fictif', unite: 'texte', enjeu: 'stock', luTexte: valeurs[0] });
  return { ...base, pese: PESE_PAR_CODE['lectures-divergentes'], champs: [`items.${n}.${cellule}`], valeurs: valeurs.map((valeur, i) => ({ lecture: i + 1, valeur, retenue: i === 0 })) } as unknown as InvoicePoint;
};
const ligneC = (n: number, description: string, kind: string, quantity: number, unitPrice: number, over: Partial<LigneConfiance> = {}): LigneConfiance =>
  ({ id: `line-${n}`, description, kind, quantity, unit: '', unitPrice, amount: Math.round(quantity * unitPrice * 100) / 100, stockCategory: '', ...over });

describe('M1 (D328a, D353) — le désaccord sur la nature d\'une ligne sans stock ne marque rien', () => {
  it('matériel sans unité imprimée, q × prix = montant, lectures en désaccord sur la nature (equipment / other / stock) : la rangée est sûre', () => {
    const l = ligneC(3, 'Fermenteur 30 L fictif', 'equipment', 1, 89, { stockAction: 'none' });
    const p = desaccord(3, 'kind', ['equipment', 'other', 'stock']);
    const c = confianceLigne(l, { lignes: [l], points: [p], categorie: 'brassage' });
    expect(c.unite).toMatchObject({ niveau: 'sur', valeur: 'Stk' });
    expect(c.famille.niveau).toBe('sur');
    expect(c.pire).toBe('sur');
    expect(natureSansEnjeu(p, { lignes: [l], points: [p], categorie: 'brassage' })).toBe(true);
  });
  it('rénovation (vernis, brosse) : même règle', () => {
    const l = ligneC(5, 'Brosse plate 50 mm', 'equipment', 2, 3.9);
    const c = confianceLigne(l, { lignes: [l], points: [desaccord(5, 'kind', ['equipment', 'other', 'stock'])], categorie: 'renovation' });
    expect(c.pire).toBe('sur');
  });
  it('ce qui entre en stock garde son désaccord : un nettoyant, un ingrédient restent à contrôler', () => {
    const net = ligneC(2, 'Détartrant liquide 1 L', 'cleaning', 2, 6.5);
    const malt = ligneC(4, 'Pilsner Malz, Kg', 'ingredient', 5, 1.65);
    expect(confianceLigne(net, { lignes: [net], points: [desaccord(2, 'kind', ['cleaning', 'other', 'stock'])], categorie: 'brassage' }).famille.niveau).toBe('repris');
    expect(confianceLigne(malt, { lignes: [malt], points: [desaccord(4, 'kind', ['ingredient', 'stock', 'other'])], categorie: 'brassage' }).famille.niveau).toBe('repris');
  });
  it('un désaccord sur une autre cellule (le prix) ou une autre ligne reste signalé', () => {
    const l = ligneC(3, 'Fermenteur 30 L fictif', 'equipment', 1, 89, { stockAction: 'none' });
    const prix = desaccord(3, 'price', ['89', '98', '89']);
    expect(natureSansEnjeu(prix, { lignes: [l], points: [prix] })).toBe(false);
    expect(confianceLigne(l, { lignes: [l], points: [prix], categorie: 'brassage' }).prix.niveau).toBe('repris');
  });
});

const brouillon = (over: Partial<PurchaseLineDraft>): PurchaseLineDraft =>
  ({ id: 'line-1', description: 'Détartrant liquide 1 L', kind: 'cleaning', quantity: 2, unit: 'Stk', unitPrice: 6.5, amount: 13, stockAction: 'none', equipmentAction: 'none', ...over }) as PurchaseLineDraft;
const lireNiveaux = (line: PurchaseLineDraft) => {
  const conf = confianceLigne(ligneConfianceDe(line), contexteConfiance({ lines: [line], vendor: 'Brico Fictif SA', amount: 13 }, []));
  return { conf, nv: niveauxRangee(line, conf), rouges: champsARemplir(conf, { libelleVide: false, ingredient: articleCompte(line) }) };
};

describe('M11 (D334) — un lien demandé et laissé vide est « à remplir », quelle que soit la nature', () => {
  it('nettoyant : « Choisir un autre article » touché sans choisir (existing, sans référence) : la rangée est rouge, le champ « article à choisir » est nommé', () => {
    const { nv, rouges } = lireNiveaux(brouillon({ stockAction: 'existing', stockRef: '' }));
    expect(nv.pire).toBe('inconnu');
    expect(nv.nom).toBe('inconnu');
    expect(rouges).toEqual([{ champ: 'article', mot: 'article à choisir' }]);
  });
  it('rien d\'incomplet pour une nature sans stock : « aucun mouvement », un article relié ou un nouvel article ne sont pas un doute', () => {
    for (const over of [{ stockAction: 'none' as const }, { stockAction: 'existing' as const, stockRef: 'MP-1' }, { stockAction: 'new' as const }]) {
      const { rouges, nv } = lireNiveaux(brouillon(over));
      expect(rouges.filter(r => r.champ === 'article'), JSON.stringify(over)).toEqual([]);
      expect(nv.pire === 'inconnu', JSON.stringify(over)).toBe(false);
    }
  });
  it('un ingrédient garde sa règle : lien vide = à remplir', () => {
    expect(articleCompte({ kind: 'ingredient', stockAction: 'existing', stockRef: '' })).toBe(true);
    expect(articleCompte({ kind: 'cleaning', stockAction: 'existing', stockRef: '' })).toBe(true);
    expect(articleCompte({ kind: 'cleaning', stockAction: 'existing', stockRef: 'MP-1' })).toBe(false);
    expect(articleCompte({ kind: 'packaging', stockAction: 'none', stockRef: undefined })).toBe(false);
  });
});
