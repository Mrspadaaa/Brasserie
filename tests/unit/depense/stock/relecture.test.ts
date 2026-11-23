/**
 * Voie s1b — la relecture de s1 (RELECTURE.md, 31.10) : un test par sonde, plus les témoins qui restent proposés.
 * Règle du pilote : une proposition perdue est permise, une fausse ne l'est pas ; dans le doute, rien.
 * Données synthétiques ; aucune donnée réelle, aucun Gemini.
 */
import { describe, expect, it } from 'vitest';
import { formatUnitLink, matchStockLine, proposeStockItem, type StockLineInput } from '../../../../src/services/stockLineMatching';
import { knownCategoriesOf } from '../../../../src/services/ingredientIdentity';
import { Units } from '../../../../src/services/units';
import type { StockItem } from '../../../../src/types';

const item = (ref: string, name: string, category = 'Malt', unit = 'kg', extra: Partial<StockItem> = {}): StockItem =>
  ({ id: ref, ref, name, category, unit, currentStock: 1, minStock: 0, reorder: false, ...extra });
const hop = (ref: string, name: string, extra: Partial<StockItem> = {}) => item(ref, name, 'Houblon', 'g', extra);
const yeast = (ref: string, name: string, unit = 'sachet') => item(ref, name, 'Levure', unit);
const line = (description: string, unit: string, quantity: number, extra: Partial<StockLineInput> = {}): StockLineInput => ({ description, unit, quantity, vendor: '', kind: 'ingredient', ...extra });
const ref = (l: StockLineInput, stock: StockItem[]) => proposeStockItem(l, stock)?.ref;

describe('s1b n° 1 : un mot du fournisseur qui décrit le produit n’est jamais retiré du nom de l’article', () => {

  it('« Cascade » chez « Cryo Hops AG » face à « Cascade Cryo » → rien', () => {
    expect(ref(line('Cascade', 'g', 100, { vendor: 'Cryo Hops AG' }), [hop('C', 'Cascade Cryo')])).toBeUndefined();
  });
  it('« Cascade » chez « Yakima Chief Hopunion Cryo » face à « Cascade Cryo » → rien', () => {
    expect(ref(line('Cascade', 'g', 100, { vendor: 'Yakima Chief Hopunion Cryo' }), [hop('C', 'Cascade Cryo')])).toBeUndefined();
  });


  // « t90 » est dans la liste du code mais pas ici : c'est une forme standard (GENERIC) retirée des DEUX côtés dès la passe 1 (« Cascade » = « Cascade T90 »,
  // règle d'ARB-M4, E22) ; la règle du fournisseur n'y entre jamais.
  const DESCRIPTEURS = ['bio', 'organic', 'öko', 'oeko', 'cryo', 'lupomax', 't45', 'dunkel', 'hell', 'light', 'smoked', 'rauch', 'extra', 'pale', 'dark', 'crystal', 'caramel', 'wheat', 'weizen'];
  for (const mot of DESCRIPTEURS) {
    it(`la liste fermée : « ${mot} » du fournisseur du justificatif n’est jamais retiré du nom de l’article`, () => {
      expect(ref(line('Pilsner', 'kg', 25, { vendor: `${mot} Mühle AG` }), [item('X', `Pilsner ${mot}`)]), mot).toBeUndefined();
    });
    it(`la liste fermée : « ${mot} » du fournisseur de l’article n’est jamais retiré de son nom`, () => {
      expect(ref(line('Pilsner', 'kg', 25), [item('X', `Pilsner ${mot}`, 'Malt', 'kg', { supplier: `${mot} Mühle AG` })]), mot).toBeUndefined();
    });
  }
  it('« Munich » chez Rauch AG face à « Malt Munich Rauch » → rien (« rauch » décrit un malt fumé ; Conception n° 10 retournée par la sûreté)', () => {
    expect(ref(line('Munich', 'kg', 25, { vendor: 'Rauch AG' }), [item('MR', 'Malt Munich Rauch')])).toBeUndefined();
  });
  // Témoins : le mot du fournisseur qui n’est qu’un nom d’entreprise continue d’être ignoré.
  it('témoin : « Pilsner Malz » = « Malt Pilsner »', () => {
    expect(ref(line('Pilsner Malz', 'kg', 25), [item('P', 'Malt Pilsner')])).toBe('P');
  });
  it('témoin : un Weyermann ordinaire — « Pilsner » chez Weyermann GmbH face à « Pilsner Weyermann »', () => {
    // s1c n° 2 (ASSERTION CHANGÉE, déclarée dans RESULTAT.md) : « proposé » → « rien ». Le fournisseur du justificatif seul ne suffit plus à
    // retirer un mot du nom de l'article : l'article doit avoir ce fournisseur (voir le témoin de s1c, article de fournisseur « Weyermann »).
    expect(ref(line('Pilsner', 'kg', 25, { vendor: 'Weyermann GmbH' }), [item('W', 'Pilsner Weyermann')])).toBeUndefined();
    expect(ref(line('Pilsner', 'kg', 25), [item('W', 'Malt Pilsner Weyermann', 'Malt', 'kg', { supplier: 'Weyermann' })])).toBe('W');
  });
  it('témoin : « Cascade du Banc » chez la Malterie du Banc reste proposée', () => {
    expect(ref(line('Cascade du Banc', 'g', 100, { vendor: 'Malterie du Banc SA' }), [hop('H', 'Houblon Cascade')])).toBe('H');
  });
});

describe('s1b n° 2 (D214) : unités illisibles et unités écrites autrement', () => {
  const stock = [item('MO', 'Maris Otter')];
  for (const unit of ['n/a', 'N/A', 'k.A.', 'K.A.', 'na', 'x', '—', '-']) {
    it(`« ${unit} » est une unité illisible : ligne proposée, unité vide, « unité à préciser »`, () => {
      const m = matchStockLine(line('Maris Otter', unit, 25), stock);
      expect(m?.item.ref).toBe('MO');
      expect(m?.unitMissing).toBe(true);
    });
  }
  it('une unité illisible n’assouplit rien : nom différent → rien', () => {
    expect(ref(line('Maris Otter Pale', 'n/a', 25), stock)).toBeUndefined();
  });
  for (const unit of ['Kg.', 'kg.', 'KG.', ' kg. ']) {
    it(`« ${unit} » : le point final est normalisé, la ligne est reliée sans « unité à préciser »`, () => {
      const m = matchStockLine(line('Maris Otter', unit, 25), stock);
      expect(m?.item.ref).toBe('MO');
      expect(m?.unitMissing).toBeUndefined();
    });
  }
  for (const unit of ['Kilo', 'kilo', 'Kilogramm', 'kilogramm']) {
    it(`« ${unit} » est reconnu comme kg dans l’appariement`, () => {
      expect(matchStockLine(line('Maris Otter', unit, 25), stock)?.unitMissing).toBeUndefined();
      expect(ref(line('Maris Otter', unit, 25), stock)).toBe('MO');
    });
  }
  const acide = [item('A', 'Acide lactique', 'CIP acide', 'L')];
  for (const unit of ['Liter', 'litre', 'litres', 'Litres']) {
    it(`« ${unit} » est reconnu comme L dans l’appariement`, () => {
      expect(ref(line('Acide lactique', unit, 5, { kind: 'cleaning' }), acide)).toBe('A');
    });
  }
  it('un kilo ne se relie pas à un article en pièces, ni un litre à un malt en kg', () => {
    expect(ref(line('Maris Otter', 'Liter', 25), stock)).toBeUndefined();
    expect(ref(line('Bouchons', 'Kilo', 25, { kind: 'packaging' }), [item('B', 'Bouchons', 'Emballage', 'pce')])).toBeUndefined();
  });
  it('la conversion reste visible avec l’unité imprimée : « 25 Kilo → 25 000 g »', () => {
    expect(formatUnitLink(25, 'Kilo', 'g', 'Houblon')).toBe('25 Kilo → 25 000 g');
    expect(formatUnitLink(5, 'Liter', 'ml', 'CIP acide')).toBe('5 Liter → 5 000 ml');
    expect(formatUnitLink(2, 'Kg.', 'g', 'Houblon')).toBe('2 Kg. → 2 000 g');
  });
  it('Units global ne change pas : « Kilo » et « Kg. » n’y sont toujours pas des kg', () => {
    expect(Units.areCompatible('Kilo', 'kg')).toBe(false);
    expect(Units.areCompatible('Kg.', 'kg')).toBe(false);
    expect(Units.convert(2, 'Liter', 'l')).toBeNull();
  });
});

describe('s1b n° 3 : un produit d’entretien ou un emballage n’est jamais un additif', () => {
  const lactique = [item('AL', 'Acide lactique 80%', 'Additif', 'kg')];
  it('« Acide lactique 80% » cleaning face à l’article Additif → rien', () => {
    expect(ref(line('Acide lactique 80%', 'kg', 1, { kind: 'cleaning' }), lactique)).toBeUndefined();
  });
  it('« Acide lactique 80% » packaging face à l’article Additif → rien', () => {
    expect(ref(line('Acide lactique 80%', 'kg', 1, { kind: 'packaging' }), lactique)).toBeUndefined();
  });
  it('témoin : un ingrédient peut toujours être un Additif', () => {
    expect(ref(line('Acide lactique 80%', 'kg', 1, { kind: 'ingredient' }), lactique)).toBe('AL');
  });
  it('témoin : Consommable reste permis pour un emballage et pour un produit d’entretien', () => {
    expect(ref(line('Chlorure de calcium', 'kg', 1, { kind: 'packaging' }), [item('CC', 'Chlorure de calcium', 'Consommable', 'kg')])).toBe('CC');
    expect(ref(line('Chlorure de calcium', 'kg', 1, { kind: 'cleaning' }), [item('CC', 'Chlorure de calcium', 'Consommable', 'kg')])).toBe('CC');
  });
});

describe('s1b n° 4 : le poids d’une ligne de levure dépasse celui d’un sachet', () => {
  it('« Safale US-05 500 g » × 1 Stk face à « Safale US-05 » en sachet sans poids → rien', () => {
    expect(ref(line('Safale US-05 500 g', 'Stk', 1), [yeast('U', 'Safale US-05')])).toBeUndefined();
  });
  it('« Safale US-05 0,5 kg » n’est pas lu comme un poids de sachet et reste refusé (nom différent)', () => {
    expect(ref(line('Safale US-05 0,5 kg', 'Stk', 1), [yeast('U', 'Safale US-05')])).toBeUndefined();
  });
  it('témoin : « Safale US-05 11,5 g » face à l’article sans poids → proposé, poids non confirmé', () => {
    const m = matchStockLine(line('Safale US-05 11,5 g', 'Stk', 2), [yeast('U', 'Safale US-05')]);
    expect(m?.item.ref).toBe('U');
    expect(m?.weightUnconfirmed).toBe(true);
  });
  it('témoin : 50 g exactement reste un sachet', () => {
    expect(ref(line('Safale US-05 50 g', 'Stk', 2), [yeast('U', 'Safale US-05')])).toBe('U');
  });
});

describe('s1b n° 5 : la quantité de départ n’est pas arrondie à 3 décimales', () => {
  it('0,0004 kg → 0,4 g', () => {
    expect(formatUnitLink(0.0004, 'kg', 'g', 'Houblon')).toBe('0,0004 kg → 0,4 g');
  });
  it('témoins inchangés', () => {
    expect(formatUnitLink(25, 'kg', 'g', 'Houblon')).toBe('25 kg → 25 000 g');
    expect(formatUnitLink(0.5, 'kg', 'g', 'Houblon')).toBe('0,5 kg → 500 g');
    expect(formatUnitLink(0.3, 'kg', 'g', 'Houblon')).toBe('0,3 kg → 300 g');
  });
});

describe('s1b n° 6 : les homonymes du catalogue sont lus comme la comparaison les lit', () => {
  it('« Pride Of Ringwood » et « Falconers Flight 7cs » sont des noms de houblons', () => {
    expect(knownCategoriesOf('pride ringwood')).toContain('Houblon');
    expect(knownCategoriesOf('falconers flight 7 cs')).toContain('Houblon');
  });
  for (const [nom, categorie, unite] of [['Pride Of Ringwood', 'Malt', 'kg'], ['Pride Of Ringwood', 'Sucre', 'kg'], ['Pride Of Ringwood', 'Levure', 'g'], ['Pride Of Ringwood', 'Additif', 'kg'],
    ['Falconers Flight 7cs', 'Malt', 'kg'], ['Falconers Flight 7cs', 'Sucre', 'kg'], ['Falconers Flight 7cs', 'Levure', 'g'], ['Falconers Flight 7cs', 'Additif', 'kg']]) {
    it(`ligne sans nature « ${nom} » face à un article « ${nom} » en ${categorie} → rien`, () => {
      expect(ref({ description: nom, unit: unite, quantity: 100, vendor: '' }, [item('X', nom, categorie, unite)])).toBeUndefined();
    });
  }
  it('témoin : « Pride Of Ringwood » face à un article Houblon → proposé', () => {
    expect(ref({ description: 'Pride Of Ringwood', unit: 'g', quantity: 100, vendor: '' }, [hop('H', 'Pride Of Ringwood')])).toBe('H');
  });
});

describe('s1b n° 7 : un nombre collé à l’unité de la ligne est une taille d’emballage, jamais un numéro d’identité', () => {
  const carafa = [item('C1', 'Carafa Special 1'), item('C2', 'Carafa Special 2'), item('C3', 'Carafa Special 3')];
  for (const quantity of [1, 2, 5]) {
    it(`« Carafa Special 2 Kg » × ${quantity} kg face à Carafa Special 1, 2, 3 → rien`, () => {
      expect(ref(line('Carafa Special 2 Kg', 'kg', quantity), carafa)).toBeUndefined();
    });
  }
  it('le même nom sans numéro d’un côté et numéroté de l’autre : rien', () => {
    expect(ref(line('Carafa Special 2 Kg', 'kg', 2), [item('C', 'Carafa Special'), item('C2', 'Carafa Special 2')])).toBeUndefined();
  });
  it('témoin : avec « Typ » devant, le nombre reste de l’identité : « Carafa Special Typ 2 Kg » → Typ 2', () => {
    const typ = [item('T1', 'Carafa Special Typ 1'), item('T2', 'Carafa Special Typ 2'), item('T3', 'Carafa Special Typ 3')];
    expect(ref(line('Carafa Special Typ 2 Kg', 'kg', 1), typ)).toBe('T2');
  });
  it('témoin : le seul article numéroté, sans voisin, reste proposé', () => {
    expect(ref(line('Carafa Special 2 Kg', 'kg', 2), [item('C2', 'Carafa Special 2'), item('M', 'Malt Munich')])).toBe('C2');
  });
  it('témoin : un article d’un autre nom n’est pas un voisin', () => {
    expect(ref(line('Carafa Special 2 Kg', 'kg', 2), [item('C2', 'Carafa Special 2'), item('X', 'Carafa 3')])).toBe('C2');
  });
});

describe('s1c n° 1 : un nombre suivi d’une unité de masse ou de volume dans le libellé est une taille d’emballage, quelle que soit la colonne d’unité', () => {
  const carafa = [item('C1', 'Carafa Special 1'), item('C2', 'Carafa Special 2'), item('C3', 'Carafa Special 3')];
  // 5 écritures d'une unité illisible x 3 quantités = les 15 cas de la sonde de RELECTURE-s1b.
  for (const unit of ['', '-', 'n/a', 'x', 'k.A.']) {
    for (const quantity of [1, 2, 5]) {
      it(`« Carafa Special 2 Kg », unité « ${unit} », × ${quantity} face à Carafa Special 1, 2, 3 → rien`, () => {
        expect(ref(line('Carafa Special 2 Kg', unit, quantity), carafa)).toBeUndefined();
      });
    }
  }
  it('« Carafa Special, 2 Kg » (virgule), unité vide, × 2 → rien', () => {
    expect(ref(line('Carafa Special, 2 Kg', '', 2), carafa)).toBeUndefined();
  });
  it('« Carafa Special 25kg » (collé), unité vide ou « n/a » → rien', () => {
    expect(ref(line('Carafa Special 25kg', '', 1), carafa)).toBeUndefined();
    expect(ref(line('Carafa Special 25kg', 'n/a', 1), carafa)).toBeUndefined();
  });
  it('« Sirop 500 g » et « Sirop 1 L », unité vide, face à Sirop 1 / 2 / 500 → rien (masse et volume)', () => {
    const sirops = [item('S1', 'Sirop 1', 'Sucre', 'L'), item('S2', 'Sirop 2', 'Sucre', 'L'), item('S500', 'Sirop 500', 'Sucre', 'L')];
    expect(ref(line('Sirop 500 g', '', 1), sirops)).toBeUndefined();
    expect(ref(line('Sirop 1 L', '', 1), sirops)).toBeUndefined();
  });
  it('« Carafa Special 2 Kg » unité vide face à Carafa Special + Carafa Special 2 → rien', () => {
    expect(ref(line('Carafa Special 2 Kg', '', 2), [item('C', 'Carafa Special'), item('C2', 'Carafa Special 2')])).toBeUndefined();
  });
  // Témoins : ce qui était proposé le reste.
  it('témoin : « Carafa Special 2 Kg » unité vide, article numéroté unique sans voisin → proposé, « unité à préciser »', () => {
    const m = matchStockLine(line('Carafa Special 2 Kg', '', 2), [item('C2', 'Carafa Special 2'), item('M', 'Malt Munich')]);
    expect(m?.item.ref).toBe('C2');
    expect(m?.unitMissing).toBe(true);
  });
  it('témoin : « Carafa Special Typ 2 Kg » unité vide face à Typ 1/2/3 → Typ 2 (le nombre reste de l’identité)', () => {
    const typ = [item('T1', 'Carafa Special Typ 1'), item('T2', 'Carafa Special Typ 2'), item('T3', 'Carafa Special Typ 3')];
    expect(ref(line('Carafa Special Typ 2 Kg', '', 1), typ)).toBe('T2');
  });
  it('témoin : un libellé sans nombre ni unité, unité vide → proposé', () => {
    expect(ref(line('Carafa Special', '', 1), [item('C', 'Carafa Special'), item('C2', 'Carafa Special 2')])).toBe('C');
  });
  it('témoin : unité lisible (kg) inchangée → rien', () => {
    expect(ref(line('Carafa Special 2 Kg', 'kg', 2), carafa)).toBeUndefined();
  });
});

describe('s1c n° 2 : un mot du fournisseur du justificatif n’est retiré du nom de l’article que s’il est aussi dans le fournisseur de l’article', () => {


  for (const mot of ['Rye', 'Roggen', 'Munich', 'Vienna', 'Cara', 'Chocolate', 'Biscuit', 'Honey', 'Melanoidin', 'Spelt']) {
    it(`« Pilsner » chez « ${mot} Mühle AG » face à « Pilsner ${mot} » → rien`, () => {
      expect(ref(line('Pilsner', 'kg', 25, { vendor: `${mot} Mühle AG` }), [item('X', `Pilsner ${mot}`)])).toBeUndefined();
    });
  }
  for (const mot of ['Leaf', 'Whole', 'Cone', 'Fresh', 'Wet', 'Dried', 'Extract', 'Oil']) {
    it(`« Cascade » chez « ${mot} Hops AG » face à « Cascade ${mot} » → rien`, () => {
      expect(ref(line('Cascade', 'g', 100, { vendor: `${mot} Hops AG` }), [hop('X', `Cascade ${mot}`)])).toBeUndefined();
    });
  }
  it('le mot du fournisseur de l’article seul (justificatif sans fournisseur) continue d’être retiré', () => {
    expect(ref(line('Pilsner', 'kg', 25), [item('W', 'Malt Pilsner Weyermann', 'Malt', 'kg', { supplier: 'Weyermann' })])).toBe('W');
  });
  it('témoin positif : article « Weyermann Pilsner » de fournisseur « Weyermann », ligne « Pilsner » chez « Weyermann Malzfabrik » → proposé', () => {
    expect(ref(line('Pilsner', 'kg', 25, { vendor: 'Weyermann Malzfabrik' }), [item('W', 'Weyermann Pilsner', 'Malt', 'kg', { supplier: 'Weyermann' })])).toBe('W');
  });
  it('un mot protégé reste conservé même s’il est dans les deux fournisseurs', () => {
    expect(ref(line('Pilsner', 'kg', 25, { vendor: 'Bio Malz AG' }), [item('B', 'Bio Pilsner', 'Malt', 'kg', { supplier: 'Bio Malz AG' })])).toBeUndefined();
  });
});

describe('s1c n° 3 : la garde côté ligne (mot qui décrit le produit après une liaison) est testée', () => {
  it('« Cascade du Cryo » chez « Cryo Hops AG » face à « Cascade » → rien', () => {
    expect(ref(line('Cascade du Cryo', 'g', 100, { vendor: 'Cryo Hops AG' }), [hop('C', 'Cascade')])).toBeUndefined();
  });
  it('« Pilsner du Bio » chez « Bio Malz AG » face à « Pilsner » → rien', () => {
    expect(ref(line('Pilsner du Bio', 'kg', 25, { vendor: 'Bio Malz AG' }), [item('P', 'Pilsner')])).toBeUndefined();
  });
  it('« Pilsner de Rauch » chez « Rauch AG » face à « Pilsner » → rien (la garde côté ligne, mot « rauch »)', () => {
    expect(ref(line('Pilsner de Rauch', 'kg', 25, { vendor: 'Rauch AG' }), [item('P', 'Pilsner')])).toBeUndefined();
  });

});
