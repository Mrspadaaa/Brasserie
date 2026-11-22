/**
 * p3 relance 1, bloquant 2 (jeu en ligne 6, BAUHAUS : 16 outils en « Matériel de brassage » avec l'icône de stock). La catégorie de la dépense est un choix de la lecture qui varie d'un tirage à l'autre ;
 * le contexte de la PIÈCE (des mots de travaux sans équivoque, aucune ligne de brassage) tranche. Lignes FICTIVES.
 */
import { describe, expect, it } from 'vitest';
import { categorieDeLaPiece, familleDe } from '../../../src/ui/depense/familles';
import { lignesDeLecture } from '../../../src/ui/depense/finale';
import { lecturesLenteur } from '../../../src/ui/depense/apercuDev';

const BRICOLAGE = ['Peinture murale blanche 5 L', 'Cheville universelle 8 mm', 'Carrelage mural 30x60', 'Brosse radiateur 35 mm', 'Seau bleu 10 L', 'Gants de travail', 'Ruban de masquage', 'Mètre ruban 5 m', 'Serre-joint 150 mm', 'Jeu de clés Allen', 'Rouleau peinture 18 cm', 'Pinceau plat 40 mm'];

describe('p3 : la catégorie de la pièce', () => {
  it('un ticket de bricolage lu « materiel » ou « brassage » : renovation (3 mots de travaux sans équivoque, aucune ligne de brassage)', () => {
    expect(categorieDeLaPiece('materiel', BRICOLAGE)).toBe('renovation');
    expect(categorieDeLaPiece('brassage', BRICOLAGE)).toBe('renovation');
  });
  it('sous cette catégorie, les mots ambigus (brosse, seau, gants, ruban) vont en Rénovation, jamais en Matériel de brassage', () => {
    const categorie = categorieDeLaPiece('materiel', BRICOLAGE);
    for (const nom of ['Brosse radiateur 35 mm', 'Seau bleu 10 L', 'Gants de travail', 'Ruban de masquage']) expect(familleDe({ nom, kind: 'equipment', categorie })).toBe('renovation');
    // avant : sous la catégorie lue, le matériel
    expect(familleDe({ nom: 'Brosse radiateur 35 mm', kind: 'equipment', categorie: 'materiel' })).toBe('materiel');
  });
  it('un ticket de brasserie reste du brassage, même avec des lignes de peinture ; une catégorie déjà hors brassage ou absente ne change pas ; moins de 3 mots de travaux : rien', () => {
    expect(categorieDeLaPiece('brassage', [...BRICOLAGE, 'Cuve inox 50 L', 'Houblon Citra 100 g'])).toBe('brassage');
    expect(categorieDeLaPiece('divers', BRICOLAGE)).toBe('divers');
    expect(categorieDeLaPiece('chargesFixes', BRICOLAGE)).toBe('chargesFixes');
    expect(categorieDeLaPiece(undefined, BRICOLAGE)).toBeUndefined();
    expect(categorieDeLaPiece('materiel', ['Peinture murale', 'Cheville universelle', 'Brosse', 'Seau', 'Gants', 'Éponge', 'Chiffon', 'Corde', 'Boîte', 'Cadenas'])).toBe('materiel');
    expect(categorieDeLaPiece('materiel', ['Peinture murale', 'Cheville universelle'])).toBe('materiel');
  });
  it('les lignes du brouillon : aucun stock proposé, nature hors brassage, pour un ticket de bricolage lu « materiel »', () => {
    const { final } = lecturesLenteur('perdue');
    const modele = final.items[0];
    const result = { ...final, vendor: 'Quincaillerie fictive', category: 'materiel', items: BRICOLAGE.map((name, i) => ({ ...modele, id: `line-${i + 1}`, name, kind: 'equipment', stockCategory: undefined, quantity: 1, unit: 'pièce', price: 5 + i, amountTTC: 5 + i })) } as any;
    const { lines } = lignesDeLecture(result, [], 'sub-test');
    expect(lines).toHaveLength(BRICOLAGE.length);
    expect(lines.every(l => l.stockAction === 'none')).toBe(true);
  });
});

describe('p3 relance 1, non bloquant 4 : aucun mot du code dans les remarques du bloc', () => {
  it('« (absent / 0) » et « (service / other) » se disent en mots du brasseur', async () => {
    const { sansMotsBruts } = await import('../../../src/ui/depense/phrasePied');
    expect(sansMotsBruts('NoVatTax - 0% — code tva : lectures divergentes (absent / 0), vérifier les articles du justificatif.')).toBe('NoVatTax - 0% — code tva : lectures divergentes (non lu / 0), vérifier les articles du justificatif.');
    expect(sansMotsBruts('X — nature : lectures divergentes (service / other), vérifier.')).toContain('(service / autre)');
  });
});
