// Voie f2-confiance (D277) : l'unité d'une ligne qui n'en imprime pas se déduit, et se signale. Pièce INVENTÉE (banc-k6/piece.ts) : aucune valeur d'une vraie pièce.
// Le test est écrit AVANT le module : sur le code d'aujourd'hui, `confiance.ts` n'existe pas et la forme doc14 ne donne aucune unité exploitable.
import { describe, expect, it } from 'vitest';
import { isReadableUnit } from '../../../../src/services/stockLineMatching';
import { confianceLigne, deduireUnite, type LigneConfiance } from '../../../../src/ui/depense/confiance';
import { items, lire, lecture } from '../banc-k6/piece';

const lignesDeLaPiece = (): LigneConfiance[] => (lire(lecture()).items as any[]).map((it, i) => ({
  id: it.id ?? `line-${i + 1}`, description: it.name, kind: it.kind, quantity: it.quantity ?? undefined, unit: it.unit ?? '',
  unitPrice: it.price ?? undefined, amount: it.amountTTC ?? undefined, stockCategory: it.stockCategory ?? '', sourceReference: it.reference ?? '',
}));

describe('TEMOIN AVANT : la forme doc14 sur le code d\'aujourd\'hui', () => {
  it('toutes les lignes de stock, de matériel et d\'emballage de la pièce inventée sont sans unité lisible', () => {
    const sans = items().filter((l: any) => !['shipping'].includes(l.kind) && !isReadableUnit(l.unit));
    expect(sans.length).toBe(10);
  });
});

describe('la pièce inventée (forme doc14) : l\'unité se lit presque toujours', () => {
  const lignes = lignesDeLaPiece();
  const contexte = { lignes };
  const par = (debut: string) => {
    const l = lignes.find(x => x.description.startsWith(debut));
    if (!l) throw new Error(`ligne introuvable : ${debut}`);
    return deduireUnite(l, contexte);
  };

  it('la levure liquide à 9,50 se compte au sachet', () => {
    const u = par('Levure fictive');
    expect(u.valeur).toBe('sachet');
    expect(u.source).toBe('deduite');
  });
  it('le houblon à 0,04 la pièce, 87 fois : des grammes, repris (seul le prix le dit)', () => {
    const u = par('Saaz fictif');
    expect(u.valeur).toBe('g');
    expect(u.niveau).toBe('repris');
    expect(u.raison).toContain('grammes');
  });
  it('le matériel à 1 se compte à la pièce, sûr (ambiguïté nulle)', () => {
    for (const nom of ['Cuve fictive', 'Hop Filter Bag fictif']) {
      const u = par(nom);
      expect(u.valeur).toBe('Stk');
      expect(u.niveau).toBe('sur');
    }
  });
  it('l\'emballage en paquet (100 capsules, carton de 24) : une pièce, reprise', () => {
    for (const nom of ['Kronkorken 100', 'Karton 24']) {
      const u = par(nom);
      expect(u.valeur).toBe('Stk');
      expect(u.niveau).toBe('repris');
    }
  });
  it('le sirop de 460 ml à 1 : une pièce (le pot), reprise, jamais 460 ml', () => {
    const u = par('Sirop Candi');
    expect(u.valeur).toBe('Stk');
    expect(u.niveau).toBe('repris');
  });
  it('l\'unité écrite dans le nom après une virgule (« …, Kg ») est lue, sûre quand le calcul tombe juste', () => {
    expect(par('CARAFICTIF')).toMatchObject({ valeur: 'kg', niveau: 'sur' });
    expect(par('Premium Pilsner')).toMatchObject({ valeur: 'kg', niveau: 'sur' });
  });
  it('le port n\'a pas d\'unité à compter : sans objet, sûr', () => {
    const u = par('Versand');
    expect(u.niveau).toBe('sur');
    expect(u.valeur).toBeUndefined();
  });
  it('aucune ligne de la pièce n\'est « inconnue »', () => {
    for (const l of lignes) {
      const c = confianceLigne(l, contexte);
      expect(c.unite.niveau, l.description).not.toBe('inconnu');
      expect(c.quantite.niveau, l.description).not.toBe('inconnu');
    }
  });
});
