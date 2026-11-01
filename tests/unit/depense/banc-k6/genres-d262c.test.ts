// D262c (01.11, nuit) : « ça à pas classé, levure, malt, outils de brassage, autre ect... Correctement ».
// Origine de la famille affichée (prouvée ici, chemins dans RESULTAT.md) : ni le `kind` de la lecture (`SCAN_KINDS`) ni une table de la lecture.
// ExpenseSheet.tsx `groupeDeLigne` → `contexteLigne` → `donneesDeLigne(...).contexte` → `contexteDe` (src/services/stockLineMatching.ts) : le `kind` ne sert
// qu'à écarter `packaging` et `cleaning` ; sinon la famille se lit dans les MOTS du nom (`inferNature`, `hasHopWord`, `hasYeastWord`, listes fermées) et
// dans `stockCategory` ; puis `groupeDe` (src/ui/depense/groupes.ts) ne connaît que 4 bandes : malt, houblon, levure, autres.
// Un article rapproché du stock (`articleDe`) donne sa catégorie ; ici aucun stock : c'est le cas d'une pièce neuve.
import { describe, expect, it } from 'vitest';
import { contexteDe } from '../../../../src/services/stockLineMatching';
import { ORDRE_GROUPES, groupeDe, type GroupeCle } from '../../../../src/ui/depense/groupes';
import { LIGNES } from './piece';

/** Ce que l'écran fait d'une ligne lue : le `kind` de la lecture passé par `scanKind` (stock → ingredient), puis la famille. */
const scanKind = (kind: string) => (kind === 'stock' ? 'ingredient' : kind === 'unknown' ? 'other' : kind);
// Le contrat du correctif : `groupeDe(contexte, kind, description)` ; les deux derniers arguments sont ignorés par le code d'aujourd'hui.
const bande = (nom: string, kind: string, reference: string, stockCategory = ''): GroupeCle =>
  (groupeDe as (...args: unknown[]) => GroupeCle)(contexteDe({ description: nom, kind: scanKind(kind), reference, stockCategory } as any), scanKind(kind), nom);

/** La vérité du brasseur pour chaque ligne de la pièce imitée (D262c) : sa famille, avec les bandes qu'il nomme. */
const VERITE: Record<string, string> = {
  'Levure fictive 1111, Souche Test': 'levure', 'Cuve fictive 30 Liter rund mit Deckel': 'materiel', 'Hopfensack fictif fein': 'materiel',
  'CARAFICTIF®, Kg': 'malt', 'Sirop Candi fictif 460ml': 'sucre', 'Premium Pilsner Malz, Kg': 'malt', 'Saaz fictif 3.5%': 'houblon',
  'Hop Filter Bag fictif': 'materiel', 'Kronkorken 100 Kapseln fictif': 'emballage', 'Karton 24-fach 3 dl fictif': 'emballage',
};

describe('D262c — la famille de chaque ligne, d’où elle vient et où elle se trompe', () => {
  it('l’écran ne connaît aujourd’hui que 4 bandes (malt, houblon, levure, autres) : « sucre », « matériel », « emballage » n’y sont pas (voir le test de contrat plus bas)', () => {
    expect(['malt', 'houblon', 'levure', 'autres'].every(cle => (ORDRE_GROUPES as readonly string[]).includes(cle))).toBe(true);
  });

  it('ce qui est juste avant et après : levure (nom), malt « Malz » (nom), houblon (catalogue) ; un emballage n’est ni malt, ni houblon, ni levure', () => {
    expect(bande('Levure fictive 1111, Souche Test', 'stock', 'HE1111')).toBe('levure');
    expect(bande('Premium Pilsner Malz, Kg', 'stock', 'MA0020')).toBe('malt');
    expect(bande('Saaz fictif 3.5%', 'stock', 'HO0066')).toBe('houblon');
    expect(['autres', 'emballage']).toContain(bande('Kronkorken 100 Kapseln fictif', 'packaging', 'KR2173'));
  });

  it('la catégorie lue (`stockCategory`) décide de la famille d’un nom sans mot de famille : « Malt » donne malt', () => {
    expect(bande('CARAFICTIF®, Kg', 'stock', 'MA0222', 'Malt')).toBe('malt');
  });

  it('Correctif posé — un malt dont le nom n’a ni « malt » ni nom du catalogue (préfixe de référence MA, kind stock) est classé malt', () => {
    expect(bande('CARAFICTIF®, Kg', 'stock', 'MA0222')).toBe('malt');
  });

  it('Correctif posé — du matériel dont le nom contient « Hop » (kind equipment) n’est PAS un houblon', () => {
    expect(bande('Hop Filter Bag fictif', 'equipment', 'FL1920')).not.toBe('houblon');
    expect(bande('Hopfensack fictif fein', 'equipment', 'SA2172')).not.toBe('houblon');
  });

  it('D262c posé (contexteDe) — chaque ligne de la pièce imitée a le bon contexte : levure, malt (sans mot « malt »), houblon ; matériel, emballage et sucre ne sont ni malt, ni houblon, ni levure', () => {
    const contexteVrai = (verite: string) => (verite === 'malt' ? 'Malt' : verite === 'houblon' ? 'Houblon' : verite === 'levure' ? 'Levure' : 'autre');
    const ecarts = LIGNES.filter(([nom, kind, reference]) => contexteDe({ description: nom, kind: scanKind(kind), reference, stockCategory: '' } as any) !== contexteVrai(VERITE[nom])).map(([nom]) => nom);
    expect(ecarts).toEqual([]);
  });

  it('D262c posé — le port, la remise, le service et l’entretien sont « autre » quel que soit leur nom', () => {
    for (const kind of ['shipping', 'discount', 'service', 'maintenance'])
      expect(contexteDe({ description: 'Malt Hopfen Hefe fictif', kind, reference: 'MA0001', stockCategory: 'Malt' } as any)).toBe('autre');
  });

  it('non-régression — un ingrédient sans mot de famille ni préfixe de référence reste « autre » (le repli sur le préfixe ne devine pas)', () => {
    expect(contexteDe({ description: 'Sirop Candi fictif 460ml', kind: 'ingredient', reference: 'CAN005', stockCategory: '' } as any)).toBe('autre');
    expect(contexteDe({ description: 'CARAFICTIF®, Kg', kind: 'other', reference: 'MA0222', stockCategory: '' } as any)).toBe('autre');
  });

  // Reste à dessiner (L24) : trois bandes de plus (sucre, matériel de brassage, emballage) sur un écran que le brasseur a choisi (D105, règle n° 1).
  // Ni `src/ui/depense/groupes.ts` ni `ExpenseSheet.tsx` ne sont touchés par cette voie : ce test attend la décision du brasseur sur les variantes.
  it.todo('bandes sucre, matériel, emballage : groupeDe(contexte, kind, description) range chaque ligne de la pièce imitée dans sa bande (choix de dessin du brasseur, en attente)');
});
