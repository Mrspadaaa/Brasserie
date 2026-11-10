// Voie p3c-bandes (D262c, D262d, D269) : une bande par famille, pour toutes les familles. Ce que l'écran fait d'une ligne lue :
// `groupeDe(contexteDe(ligne), kind, nom, stockCategory, categorieArticle)` (ExpenseSheet.tsx `groupeDeLigne`).
import { describe, expect, it } from 'vitest';
import { bandes, NOMS_GROUPES, ORDRE_GROUPES, texteQte, type GroupeCle, type LigneBande } from '../../../../src/ui/depense/groupes';
import { LIGNES } from '../banc-k6/piece';
import { famille } from './aide';

const L = (id: string, groupe: GroupeCle, amount: number, quantity: number, unit: string): LigneBande => ({ id, groupe, amount, quantity, unit, uniteLisible: true, mouture: false });

describe('D262c — une bande par famille, dans l’ordre, chacune avec son sous-total', () => {
  it('l’ordre est celui du brasseur : malts, houblons, levures, sucres, additifs, matériel, emballage, nettoyage, consommables, services, autres', () => {
    expect([...ORDRE_GROUPES]).toEqual(['malt', 'houblon', 'levure', 'sucre', 'additif', 'materiel', 'emballage', 'nettoyage', 'consommable', 'renovation', 'service', 'autres']);
    expect(ORDRE_GROUPES.map(c => NOMS_GROUPES[c])).toEqual(['Malts', 'Houblons', 'Levures', 'Sucres', 'Additifs', 'Matériel de brassage', 'Emballage', 'Nettoyage', 'Consommables', 'Rénovation', 'Services', 'Autres']);
  });

  it('une pièce inventée aux lignes de toutes les familles : une bande par famille, dans l’ordre, chacune avec son sous-total en centimes entiers', () => {
    const piece: Array<[GroupeCle, number, number, string]> = [
      ['autres', 3, 1, 'Stk'], ['service', 12.5, 1, ''], ['consommable', 4.2, 2, 'Stk'], ['renovation', 20, 1, 'Stk'], ['nettoyage', 18.9, 1, 'Kg'], ['emballage', 25, 100, 'Stk'], ['materiel', 120, 1, 'Stk'],
      ['additif', 6.1, 50, 'g'], ['sucre', 7.5, 1, 'Kg'], ['levure', 9.5, 2, 'Stk'], ['houblon', 8, 100, 'g'], ['malt', 13.8, 6, 'Kg'], ['malt', 2.4, 1, 'Kg'],
    ];
    const b = bandes(piece.map(([g, a, q, u], i) => L(String(i), g, a, q, u)));
    expect(b.map(x => x.cle)).toEqual([...ORDRE_GROUPES]);
    expect(b.map(x => x.nom)).toEqual(ORDRE_GROUPES.map(c => NOMS_GROUPES[c]));
    expect(b.find(x => x.cle === 'malt')!.cents).toBe(1620);
    expect(texteQte(b.find(x => x.cle === 'malt')!.qte)).toBe('7 Kg');
    expect(b.find(x => x.cle === 'materiel')!.cents).toBe(12000);
    expect(b.reduce((s, x) => s + x.cents, 0)).toBe(Math.round(piece.reduce((s, p) => s + p[1], 0) * 100));
    expect(b.every(x => x.ids.length > 0)).toBe(true);
  });

  it('une bande sans ligne n’existe pas : seules les familles présentes apparaissent', () => {
    expect(bandes([L('a', 'sucre', 7.5, 1, 'Kg'), L('b', 'materiel', 30, 1, 'Stk')]).map(x => x.cle)).toEqual(['sucre', 'materiel']);
  });
});

describe('D262c — la pièce du 01.11 (forme d’une commande en ligne) : chaque ligne dans sa bande, aucune sous « Autres »', () => {
  const VERITE: Record<string, GroupeCle> = {
    'Levure fictive 1111, Souche Test': 'levure', 'Cuve fictive 30 Liter rund mit Deckel': 'materiel', 'Hopfensack fictif fein': 'materiel',
    'CARAFICTIF®, Kg': 'malt', 'Sirop Candi fictif 460ml': 'sucre', 'Premium Pilsner Malz, Kg': 'malt', 'Saaz fictif 3.5%': 'houblon',
    'Hop Filter Bag fictif': 'materiel', 'Kronkorken 100 Kapseln fictif': 'emballage', 'Karton 24-fach 3 dl fictif': 'emballage',
  };
  it('les dix lignes ont leur famille (levure, malts dont un sans le mot « malt », sucre, houblon, matériel, emballage)', () => {
    const ecarts = LIGNES.filter(([nom, kind, reference]) => famille(nom, kind, '', reference) !== VERITE[nom]).map(([nom, kind, reference]) => `${nom} → ${famille(nom, kind, '', reference)}`);
    expect(ecarts).toEqual([]);
  });
  it('les sacs à houblon (kind equipment) ne sont jamais en Houblons ; aucune ligne de la pièce n’est sous « Autres »', () => {
    for (const [nom, kind, reference] of LIGNES) {
      expect(famille(nom, kind, '', reference), nom).not.toBe('autres');
      if (/Hop|Hopfen/.test(nom) && kind === 'equipment') expect(famille(nom, kind, '', reference), nom).not.toBe('houblon');
    }
  });
});

describe('D269 — une nouvelle levure, un nouveau fermenteur, un article technique : seuls le nom et le kind de la lecture', () => {
  const JEU: Array<[string, GroupeCle]> = [
    ['Omega OYL-200', 'levure'], ['Imperial A38', 'levure'], ['Wyeast 1056', 'levure'],
    ['CARABELGE', 'malt'], ['Château Abbey', 'malt'], ['Weyermann Pale Ale', 'malt'], ['Flocons d’avoine', 'malt'],
    ['Fermzilla 27 L', 'materiel'], ['Unitank 60 L', 'materiel'], ['Gärtank', 'materiel'], ['Spundventil', 'materiel'], ['Plattenkühler', 'materiel'], ['Hop Spider Bag', 'materiel'],
    ['Candi Syrup', 'sucre'], ['Whirlfloc', 'additif'], ['CaCl2', 'additif'], ['Kronkorken', 'emballage'], ['Chemipro', 'nettoyage'], ['Star San', 'nettoyage'],
  ];
  it.each(JEU)('%s → %s (kind stock, ni catégorie ni article)', (nom, attendu) => { expect(famille(nom, 'stock')).toBe(attendu); });

  it('un Hop Spider Bag est du matériel même en kind stock, et un houblon à pellets reste un houblon', () => {
    expect(famille('Hop Spider Bag', 'stock')).toBe('materiel');
    expect(famille('Cascade Hop Pellets 100 g', 'stock')).toBe('houblon');
  });

  it('le kind de la lecture tranche avant les mots : equipment/maintenance → matériel, packaging → emballage, cleaning → nettoyage, service → services', () => {
    expect(famille('Hop Filter Bag', 'equipment')).toBe('materiel');
    expect(famille('Révision pompe', 'maintenance')).toBe('materiel');
    expect(famille('Boîte', 'packaging')).toBe('emballage');
    expect(famille('Produit du labo', 'cleaning')).toBe('nettoyage');
    expect(famille('Gants nitrile', 'cleaning')).toBe('consommable');
    expect(famille('Mouture', 'service')).toBe('service');
    expect(famille('Frais de port', 'shipping')).toBe('autres');
  });

  it('une catégorie de stock lue qui contredit les mots : la catégorie gagne', () => {
    expect(famille('Omega OYL-200', 'stock', 'Malt')).toBe('malt');
    expect(famille('CARABELGE', 'stock', 'Levure')).toBe('levure');
    expect(famille('Fermzilla 27 L', 'stock', 'Consommable')).toBe('consommable');
    expect(famille('Candi Syrup', 'stock', 'Additif')).toBe('additif');
    expect(famille('Whirlfloc', 'stock', 'Sucre')).toBe('sucre');
    expect(famille('Kronkorken', 'stock', 'Détergent')).toBe('nettoyage');
    expect(famille('Hop Spider Bag', 'stock', 'Houblon')).toBe('houblon');
  });

  it('la catégorie de l’article rattaché gagne sur celle que la lecture avait devinée (le brasseur a relié la ligne)', () => {
    expect(famille('Omega OYL-200', 'stock', 'Malt', '', 'Levure')).toBe('levure');
    expect(famille('Imperial A38', 'stock', '', '', 'Divers')).toBe('levure');
  });

  it('un ingrédient que la lecture dit matériel ou emballage n’est pas capturé par une catégorie d’ingrédient', () => {
    expect(famille('Hop Filter Bag', 'equipment', 'Houblon')).toBe('materiel');
    expect(famille('Étiquette', 'packaging', 'Malt')).toBe('emballage');
  });

  it('une mouture reste sur son malt : c’est ExpenseSheet qui lit la ligne du parent, la famille d’un service sans parent est « Services »', () => {
    expect(famille('Mouture malt 6 Kg', 'service')).toBe('service');
  });

  it('jury (L20) : trois noms hors liste, jugés sans les corriger — chacun reçoit une famille valide, l’inclassable va sous « Autres »', () => {
    const resultats = ['Fermentasaurus 35 L', 'Chinook T90 Pellets 100 g', 'Rahr Pale 2-Row 25 kg'].map(n => [n, famille(n, 'stock')] as const);
    for (const [, f] of resultats) expect(ORDRE_GROUPES).toContain(f);
    // T90 est un mot du métier : houblon. Les deux autres n’ont ni marque ni terme connu : le repli est « Autres », jamais une fausse famille.
    expect(resultats[1][1]).toBe('houblon');
    expect(resultats.filter(([, f]) => f !== 'autres' && f !== 'houblon')).toEqual([]);
  });

  it('l’inconnu va sous « Autres » : un nom sans mot de famille', () => {
    expect(famille('Divers fictif XJ-17', 'stock')).toBe('autres');
    expect(famille('', 'other')).toBe('autres');
  });
});
