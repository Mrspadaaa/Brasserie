// Voie a1-proposition (D222) : les tuiles que le champ propose à l'ouverture, classées selon le style visé.
// Deux jeux : une table de poche (le comportement de la règle, déterministe) et la vraie table de Beer Analytics (les témoins).
import { describe, expect, it } from 'vitest';
import type { StockItem } from '../../../src/types';
import { PROPOSITION_RULE, proposerFermentables } from '../../../src/domain/fermentables/proposition';
import type { TableTypicite } from '../../../src/domain/fermentables/typicite';
import reelle from '../../../src/data/fermentables/typicite-styles.json';

const TABLE_REELLE = reelle as unknown as TableTypicite;

const art = (name: string, o: Partial<StockItem> = {}): StockItem => ({
  id: `id-${name}`, ref: name, name, category: 'Malt', unit: 'kg', currentStock: 10, minStock: 0, reorder: false, ...o,
});
const noms = (r: ReturnType<typeof proposerFermentables>) => r.map((p) => p.article.name);

// Une table de poche : en 5D, le Pilsner est dans 90 % des recettes, Munich et Carapils dans 20 %, Caramünch II et Wheat dans 4 %,
// Carafa III dans 0,4 % ; en 15B, Roasted Barley dans 80 %, Pale Ale dans 90 % ; en 16A (voisine de la 15B), le malt chocolat dans 70 %.
// Carahell n'a que sa borne (p16 = 0,06 : hors des 16, entre 0 et 6 %), Lactose aussi (0,056), Pale Ale (0,7) en 5D.
const POCHE: TableTypicite = {
  source: { nom: 'Beer Analytics (essai)', licence: 'CC BY-SA 4.0', releve: null },
  styles: { '5D': 'German Pils', '15B': 'Irish Stout', '16A': 'Sweet Stout' },
  voisins: { '15B': ['16A'], '16A': ['15B'] }, poidsVoisin: 0.5,
  p16: { 'pilsner-malt': 0.7, 'munich-malt': 0.2, 'carapils-carafoam': 0.1, 'caramunich-ii': 0.04, 'wheat-malt': 0.04, 'carafa-iii': 0.004, carahell: 0.06, 'roasted-barley-malt': 0.5, 'pale-ale-malt': 0.7, 'lactose-milk-sugar': 0.056, 'chocolate-malt': 0.4 },
  parts: {
    '5D': { 'pilsner-malt': 0.9, 'munich-malt': 0.2, 'carapils-carafoam': 0.2, 'caramunich-ii': 0.04, 'wheat-malt': 0.04, 'carafa-iii': 0.004 },
    '15B': { 'roasted-barley-malt': 0.8, 'pale-ale-malt': 0.9 },
    '16A': { 'chocolate-malt': 0.7, 'roasted-barley-malt': 0.6 },
  },
};

describe('la règle est écrite', () => {
  it('dit le stock, la typicité, l\'épinglé et le nom, dans cet ordre, et que la teinte n\'est pas une clé', () => {
    const t = PROPOSITION_RULE.join(' ').toLowerCase();
    const ordre = ['recette', '1) disponible', 'épuisés à part', '2) à l’intérieur de chaque groupe', 'borne', '3) épinglé', '4) le nom'].map((m) => t.indexOf(m));
    expect(ordre.every((i) => i >= 0)).toBe(true);
    expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
    expect(t).not.toContain('provisoire');
    expect(t).toContain('jamais 0');
    expect(t).toContain('la teinte n’est pas une clé');
    expect(t).toContain('la plus haute d’abord');
  });
});

describe('proposerFermentables : le style d\'abord', () => {
  it('écarte ce qui est déjà dans la recette, par référence ou par nom entier (accents et casse ignorés)', () => {
    const arts = [art('Pilsner Malz', { ref: 'ref-Pilsner' }), art('Münchner Malz'), art('Carapils'), art('Weizenmalz hell')];
    const r = proposerFermentables({ articles: arts, dejaLa: [{ name: 'x', stockItemRef: 'ref-Pilsner' }, { name: 'carapils' }, { name: 'MUNCHNER MALZ' }], styleCode: '5D', table: POCHE });
    expect(noms(r)).toEqual(['Weizenmalz hell']);
  });

  it('une ligne liée par la ref de l\'article l\'exclut même sous un autre nom ; l\'id ne sert qu\'en repli, sans ref', () => {
    const arts = [art('Pilsner Malz', { ref: 'P-01' }), art('Carapils', { ref: '' }), art('Münchner Malz', { ref: 'M-01' })];
    expect(noms(proposerFermentables({ articles: arts, dejaLa: [{ name: 'Pilsner du lot 12', stockItemRef: 'P-01' }], styleCode: '5D', table: POCHE }))).toEqual(['Carapils', 'Münchner Malz']);
    // Avec une ref, l'id n'écarte pas l'article.
    expect(noms(proposerFermentables({ articles: arts, dejaLa: [{ name: 'autre', stockItemRef: 'id-Pilsner Malz' }], styleCode: '5D', table: POCHE }))).toContain('Pilsner Malz');
    // Sans ref : repli sur l'id.
    expect(noms(proposerFermentables({ articles: arts, dejaLa: [{ name: 'autre', stockItemRef: 'id-Carapils' }], styleCode: '5D', table: POCHE }))).not.toContain('Carapils');
  });

  it('un nom courant tapé n\'écarte rien : « Cara » ne cache pas Carapils, « Munich » ne cache pas Münchner Malz', () => {
    const arts = [art('Carapils'), art('Carahell'), art('Münchner Malz')];
    const r = proposerFermentables({ articles: arts, dejaLa: [{ name: 'Cara' }, { name: 'Munich' }], styleCode: '5D', table: POCHE });
    expect(noms(r).sort()).toEqual(['Carahell', 'Carapils', 'Münchner Malz']);
  });

  it('German Pils : le malt de base avant le caramel, même si le caramel est épinglé', () => {
    const arts = [art('Caramünch II', { favorite: true, colorEbc: 120 }), art('Carapils', { favorite: true }), art('Pilsner Malz', { colorEbc: 3.5 }), art('Weizenmalz hell')];
    const r = noms(proposerFermentables({ articles: arts, dejaLa: [], styleCode: '5D', table: POCHE }));
    expect(r[0]).toBe('Pilsner Malz');
    expect(r.indexOf('Pilsner Malz')).toBeLessThan(r.indexOf('Caramünch II'));
  });

  it('stout : un malt torréfié avant Carapils', () => {
    const arts = [art('Carapils', { favorite: true }), art('Röstgerste', { colorEbc: 1000 }), art('Pale Ale Malz', { colorEbc: 6.5 })];
    const r = noms(proposerFermentables({ articles: arts, dejaLa: [], styleCode: '15B', table: POCHE }));
    expect(r.indexOf('Röstgerste')).toBeLessThan(r.indexOf('Carapils'));
  });

  it('une stout lit ses voisines, à moitié : le malt chocolat de la 16A compte pour la 15B', () => {
    const arts = [art('Carapils'), art('Schokoladenmalz', { colorEbc: 700 }), art('Pilsner Malz')];
    const r = proposerFermentables({ articles: arts, dejaLa: [], styleCode: '15B', table: POCHE });
    expect(noms(r)[0]).toBe('Schokoladenmalz');
    expect(r[0].cles[1]).toMatch(/style voisin/);
    expect(r[0].cles[1]).toMatch(/35 %/);
  });

  it('un article sans donnée passe après ceux qui en ont une, et n\'est jamais écarté', () => {
    const arts = [art('Malt de la maison', { favorite: true }), art('Carafa III'), art('Pilsner Malz'), art('Carahell')];
    const r = proposerFermentables({ articles: arts, dejaLa: [], styleCode: '5D', table: POCHE });
    expect(noms(r)).toContain('Malt de la maison');
    expect(noms(r).at(-1)).toBe('Malt de la maison');
    const sans = r.find((p) => p.article.name === 'Malt de la maison')!;
    expect(sans.cles.join(' ')).toMatch(/inconnue/);
  });

  it('l\'inconnu n\'est jamais 0 : une borne ne passe pas derrière un rare connu, ni devant un présent', () => {
    // Carahell : hors des 16 de Beer Analytics, au plus 6 % -> inconnu borné ; Carafa III : 0,4 % connu, rare ; Caramünch II : 4 %, présent.
    const arts = [art('Carafa III'), art('Carahell'), art('Caramünch II')];
    expect(noms(proposerFermentables({ articles: arts, dejaLa: [], styleCode: '5D', table: POCHE }))).toEqual(['Caramünch II', 'Carahell', 'Carafa III']);
  });

  it('les inconnus bornés se départagent par leur borne, la plus haute d\'abord, quels que soient l\'épingle et le nom', () => {
    // Pale Ale Malz : au plus 70 % ; Carahell : au plus 6 % ; Lactose : au plus 5,6 %. Lactose est épinglé et passe avant Carahell par l'alphabet : la borne décide.
    const arts = [art('Lactose', { favorite: true }), art('Carahell'), art('Pale Ale Malz')];
    expect(noms(proposerFermentables({ articles: arts, dejaLa: [], styleCode: '5D', table: POCHE }))).toEqual(['Pale Ale Malz', 'Carahell', 'Lactose']);
  });

  it('un épuisé passe après un disponible de même rang', () => {
    const arts = [art('Münchner Malz', { currentStock: 0, favorite: true }), art('Carapils', { currentStock: 1.2 })];
    // Même palier (20 % : courant) : le disponible d'abord, même si l'épuisé est épinglé.
    expect(noms(proposerFermentables({ articles: arts, dejaLa: [], styleCode: '5D', table: POCHE }))).toEqual(['Carapils', 'Münchner Malz']);
  });

  it('l\'épinglé départage deux articles que rien d\'autre ne sépare, il ne fait pas passer devant la typicité', () => {
    const arts = [art('Carapils'), art('Münchner Malz', { favorite: true }), art('Pilsner Malz')];
    expect(noms(proposerFermentables({ articles: arts, dejaLa: [], styleCode: '5D', table: POCHE }))).toEqual(['Pilsner Malz', 'Münchner Malz', 'Carapils']);
  });

  it('la teinte n\'est pas une clé : ebcVise ne change pas l\'ordre, et la couleur d\'un malt n\'est pas celle de la bière', () => {
    // Münchner Malz (15 EBC, épinglé) et Carapils (4 EBC) : même palier. Que la bière vise 7 ou 70 EBC, l'épinglé départage.
    const arts = [art('Münchner Malz', { colorEbc: 15, favorite: true }), art('Carapils', { colorEbc: 4 })];
    for (const ebcVise of [undefined, 7, 70]) {
      expect(noms(proposerFermentables({ articles: arts, dejaLa: [], styleCode: '5D', ebcVise, table: POCHE }))).toEqual(['Münchner Malz', 'Carapils']);
    }
    // Un torréfié à 1000 EBC reste en tête d'une stout de 70 EBC : aucune clé ne le repousse, aucun libellé ne le dit « trop foncé ».
    const stout = proposerFermentables({ articles: [art('Pale Ale Malz', { colorEbc: 6.5 }), art('Röstgerste', { colorEbc: 1000 })], dejaLa: [], styleCode: '15B', ebcVise: 70, table: POCHE });
    expect(noms(stout)).toContain('Röstgerste');
    expect(noms(stout).indexOf('Röstgerste')).toBeLessThan(2); // même palier que le malt de base (80 % et 90 %), départagés par le nom, pas par la teinte
    expect(stout.flatMap((p) => p.cles).join(' ')).not.toMatch(/foncé|teinte/i);
  });

  it('sans style ou sans table : disponible, épinglé, nom ; un épinglé épuisé recule ; rien n\'est écarté', () => {
    const arts = [art('Pilsner Malz', { currentStock: 0, favorite: true }), art('Carapils'), art('Münchner Malz', { favorite: true })];
    // Épinglé d'abord (ancienne règle) donnerait Münchner, Pilsner, Carapils.
    const attendu = ['Münchner Malz', 'Carapils', 'Pilsner Malz'];
    expect(noms(proposerFermentables({ articles: arts, dejaLa: [], table: POCHE }))).toEqual(attendu);
    expect(noms(proposerFermentables({ articles: arts, dejaLa: [], styleCode: '5D', table: null }))).toEqual(attendu);
  });

  it('un style sans correspondance chez Beer Analytics ne classe rien de plus', () => {
    const arts = [art('Pilsner Malz'), art('Carapils', { favorite: true })];
    expect(noms(proposerFermentables({ articles: arts, dejaLa: [], styleCode: '21B', table: POCHE }))).toEqual(['Carapils', 'Pilsner Malz']);
  });

  it('au plus `max` tuiles (6 par défaut)', () => {
    const arts = Array.from({ length: 9 }, (_, i) => art(`Malt ${i}`));
    expect(proposerFermentables({ articles: arts, dejaLa: [], styleCode: '5D', table: POCHE })).toHaveLength(6);
    expect(proposerFermentables({ articles: arts, dejaLa: [], max: 3 })).toHaveLength(3);
  });

  it('chaque tuile porte ses clés de rang', () => {
    const r = proposerFermentables({ articles: [art('Pilsner Malz', { favorite: true })], dejaLa: [], styleCode: '5D', table: POCHE });
    expect(r[0].cles).toHaveLength(4);
    expect(r[0].cles.at(-1)).toBe('Pilsner Malz');
    expect(r[0].cles.join(' ')).toMatch(/90 %/);
  });
});

describe('proposerFermentables : les témoins sur la table de Beer Analytics', () => {
  const stock = () => [
    art('Caramünch II', { favorite: true, colorEbc: 120 }), art('Carapils', { favorite: true, colorEbc: 4 }), art('Pilsner Malz', { colorEbc: 3.5 }),
    art('Münchner Malz', { colorEbc: 15 }), art('Weizenmalz hell', { colorEbc: 4 }), art('Haferflocken'), art('Carahell', { colorEbc: 25 }),
    art('Röstgerste', { colorEbc: 1000 }), art('Carafa Special III', { colorEbc: 1400 }),
  ];
  const complet = () => [
    art('Pale Ale Malz', { colorEbc: 6.5, favorite: true }), art('Pilsner Malz', { colorEbc: 3.5 }), art('Münchner Malz', { colorEbc: 15 }), art('Weizenmalz hell', { colorEbc: 4 }),
    art('Carapils', { favorite: true, colorEbc: 4 }), art('Caramünch II', { colorEbc: 120 }), art('Haferflocken'), art('Weizenflocken'), art('Gerstenflocken'),
    art('Schokoladenmalz', { colorEbc: 700 }), art('Röstgerste', { colorEbc: 1000 }), art('Schwarzmalz', { colorEbc: 1300 }), art('Lactose'), art('Sucre candi'),
  ];

  it('German Pils (5D) : Pilsner Malz avant Caramünch II', () => {
    const r = noms(proposerFermentables({ articles: stock(), dejaLa: [], styleCode: '5D', table: TABLE_REELLE, max: 20 }));
    expect(r.indexOf('Pilsner Malz')).toBeGreaterThanOrEqual(0);
    expect(r.indexOf('Pilsner Malz')).toBeLessThan(r.indexOf('Caramünch II'));
    expect(r[0]).toBe('Pilsner Malz');
  });

  it('German Pils : les bornes hautes (Pale Ale, Münchner) avant les bornes basses (Lactose, Sucre candi)', () => {
    const r = noms(proposerFermentables({ articles: complet(), dejaLa: [], styleCode: '5D', table: TABLE_REELLE, max: 20 }));
    for (const haut of ['Pale Ale Malz', 'Münchner Malz']) for (const bas of ['Lactose', 'Sucre candi']) expect(r.indexOf(haut), `${haut} / ${bas}`).toBeLessThan(r.indexOf(bas));
    expect(r.indexOf('Pilsner Malz')).toBe(0);
  });

  it('American IPA (21A) : Carapils (connu) devant Pilsner Malz, et Pilsner Malz (au plus 78 %) devant Weizenmalz hell (au plus 47 %)', () => {
    const r = noms(proposerFermentables({ articles: complet(), dejaLa: [], styleCode: '21A', table: TABLE_REELLE, max: 20 }));
    expect(r.indexOf('Carapils')).toBeLessThan(r.indexOf('Pilsner Malz'));
    expect(r.indexOf('Pilsner Malz')).toBeLessThan(r.indexOf('Weizenmalz hell'));
  });

  it('Hazy IPA (21C) : Haferflocken en tête, Weizenflocken dans les 4 premiers', () => {
    const r = noms(proposerFermentables({ articles: complet(), dejaLa: [], styleCode: '21C', ebcVise: 8, table: TABLE_REELLE }));
    expect(r[0]).toBe('Haferflocken');
    expect(r.indexOf('Weizenflocken')).toBeGreaterThanOrEqual(0);
    expect(r.indexOf('Weizenflocken')).toBeLessThan(4);
  });

  it('stouts (15B, 16A, 16B, 20C), jeu complet de 6 tuiles : le torréfié et le malt chocolat avant les malts de base et Carapils', () => {
    for (const code of ['15B', '16A', '16B', '20C']) {
      const r = noms(proposerFermentables({ articles: complet(), dejaLa: [], styleCode: code, ebcVise: 70, table: TABLE_REELLE }));
      expect(r, code).toHaveLength(6);
      for (const torrefie of ['Röstgerste', 'Schokoladenmalz']) {
        expect(r.indexOf(torrefie), `${code} : ${torrefie} est dans les 6 tuiles`).toBeGreaterThanOrEqual(0);
        for (const base of ['Pilsner Malz', 'Pale Ale Malz', 'Carapils']) {
          const ib = r.indexOf(base);
          if (ib >= 0) expect(r.indexOf(torrefie), `${code} : ${torrefie} avant ${base}`).toBeLessThan(ib);
        }
      }
    }
  });

  it('stout : Gerstenflocken, Schokoladenmalz et Röstgerste font partie des 6 tuiles de la 15B et de la 16B', () => {
    for (const code of ['15B', '16B']) {
      const r = noms(proposerFermentables({ articles: complet(), dejaLa: [], styleCode: code, table: TABLE_REELLE }));
      if (code === '15B') expect(r).toEqual(expect.arrayContaining(['Gerstenflocken', 'Röstgerste', 'Schokoladenmalz']));
      else expect(r).toEqual(expect.arrayContaining(['Haferflocken', 'Röstgerste', 'Schokoladenmalz']));
    }
  });
});

// Plausibilité (décision du pilote, 31.10) : un fermentescible NON cité pour le style, dont la couleur connue dépasse PLAFOND_TEINTE_NON_CITE
// fois la borne haute d'EBC du style, ne vient pas dans les tuiles (la recherche le trouve). Un cité n'est jamais écarté ; une couleur inconnue reste ;
// la teinte ne devient pas une clé de classement.
describe('proposerFermentables : plausibilité de la teinte pour un non cité', () => {
  const stock = () => [
    art('Pilsner Malz', { colorEbc: 3.5 }), art('Carapils', { colorEbc: 4 }), art('Münchner Malz', { colorEbc: 15 }), art('Wiener Malz', { colorEbc: 7 }),
    art('Pale Ale Malz', { colorEbc: 6.5 }), art('Schokoladenmalz', { colorEbc: 700 }), art('Röstgerste', { colorEbc: 1000 }), art('Schwarzmalz', { colorEbc: 1300 }),
    art('Carafa Special III', { colorEbc: 1400 }), art('Malt de la maison'),
  ];
  const tuiles = (code: string, o: object = {}) => noms(proposerFermentables({ articles: stock(), dejaLa: [], styleCode: code, table: TABLE_REELLE, max: 20, ...o }));

  it('la constante est nommée et vaut 10', async () => {
    const m = await import('../../../src/domain/fermentables/proposition');
    expect((m as Record<string, unknown>).PLAFOND_TEINTE_NON_CITE).toBe(10);
  });

  it('German Pils (5 EBC visés, 7,9 au plus) : ni Schokoladenmalz ni Röstgerste ni Schwarzmalz, même avec du stock ; Münchner et Wiener restent possibles', () => {
    for (const o of [{ ebcVise: 5.9 }, { ebcVise: 5.9, ebcMax: 7.9 }]) {
      const r = tuiles('5D', o);
      for (const noir of ['Schokoladenmalz', 'Röstgerste', 'Schwarzmalz', 'Carafa Special III']) expect(r, `${noir} ${JSON.stringify(o)}`).not.toContain(noir);
      for (const clair of ['Münchner Malz', 'Wiener Malz', 'Pale Ale Malz', 'Pilsner Malz', 'Carapils']) expect(r, clair).toContain(clair);
    }
    // Avec les 6 tuiles par défaut non plus.
    const six = noms(proposerFermentables({ articles: stock(), dejaLa: [], styleCode: '5D', ebcVise: 5.9, ebcMax: 7.9, table: TABLE_REELLE }));
    expect(six).not.toContain('Schokoladenmalz');
    expect(six).not.toContain('Röstgerste');
  });

  it('stout (15B) : le chocolat et le torréfié restent (cités par le style ou ses voisines)', () => {
    const r = tuiles('15B', { ebcVise: 70, ebcMax: 100 });
    for (const noir of ['Schokoladenmalz', 'Röstgerste', 'Schwarzmalz']) expect(r, noir).toContain(noir);
  });

  it('un fermentescible cité n\'est jamais écarté par la teinte', () => {
    const arts = [art('Pilsner Malz', { colorEbc: 900 }), art('Carapils', { colorEbc: 4 })];
    expect(noms(proposerFermentables({ articles: arts, dejaLa: [], styleCode: '5D', ebcVise: 5, table: POCHE }))).toEqual(['Pilsner Malz', 'Carapils']);
  });

  it('une couleur inconnue reste : un non cité sans couleur n\'est pas écarté', () => {
    const r = tuiles('5D', { ebcVise: 5.9, ebcMax: 7.9 });
    expect(r).toContain('Malt de la maison');
    const arts = [art('Röstgerste'), art('Pilsner Malz')];
    expect(noms(proposerFermentables({ articles: arts, dejaLa: [], styleCode: '5D', ebcVise: 5.9, table: TABLE_REELLE }))).toContain('Röstgerste');
  });

  it('sans teinte visée, rien n\'est écarté ; la borne haute passée prime sur la teinte visée ; le seuil est strict (10 ×)', () => {
    expect(tuiles('5D')).toContain('Schokoladenmalz');
    expect(tuiles('5D', { ebcVise: 5.9, ebcMax: 100 })).toContain('Schokoladenmalz'); // 700 EBC ne dépasse pas 10 × 100
    expect(tuiles('5D', { ebcVise: 5.9, ebcMax: 70 })).toContain('Schokoladenmalz'); // 700 = 10 × 70 : pas au-dessus
    expect(tuiles('5D', { ebcVise: 5.9, ebcMax: 69 })).not.toContain('Schokoladenmalz');
  });

  it('sans table chargée, rien n\'est écarté (on ne sait pas encore ce qui est cité)', () => {
    const r = noms(proposerFermentables({ articles: stock(), dejaLa: [], styleCode: '5D', ebcVise: 5.9, table: null, max: 20 }));
    expect(r).toContain('Schokoladenmalz');
  });

  it('la teinte ne redevient pas une clé : l\'ordre des tuiles restantes ne dépend pas d\'ebcVise', () => {
    const sans = tuiles('5D');
    const avec = tuiles('5D', { ebcVise: 5.9, ebcMax: 7.9 });
    expect(avec).toEqual(sans.filter((n) => avec.includes(n)));
  });
});

// D226 : à l'ouverture, « disponibles d'abord, épuisés à part » (lecture de D222). Un épuisé ne passe jamais devant un disponible ; la typicité ordonne à l'intérieur de chaque groupe.
describe('proposerFermentables : les disponibles d\'abord, les épuisés ensuite', () => {
  it('German Pils : Münchner Malz et Pilsner Malz épuisés, Carapils et Carahell disponibles : aucun épuisé avant un disponible', () => {
    const arts = [
      art('Pilsner Malz', { currentStock: 0 }), art('Münchner Malz', { currentStock: 0, favorite: true }),
      art('Carapils', { currentStock: 1.2 }), art('Carahell', { currentStock: 3 }), art('Caramünch II', { currentStock: 0.8 }),
    ];
    for (const table of [TABLE_REELLE, POCHE]) {
      const r = proposerFermentables({ articles: arts, dejaLa: [], styleCode: '5D', table });
      const dispo = r.map((p) => p.article.currentStock > 0);
      const premierEpuise = dispo.indexOf(false);
      expect(premierEpuise, noms(r).join(' | ')).toBeGreaterThanOrEqual(0);
      expect(dispo.slice(premierEpuise).every((d) => !d), `un disponible après un épuisé : ${noms(r).join(' | ')}`).toBe(true);
      expect(noms(r).slice(0, 3)).toEqual(expect.arrayContaining(['Carapils', 'Carahell', 'Caramünch II']));
    }
  });

  it('la typicité ordonne à l\'intérieur de chaque groupe', () => {
    const arts = [
      art('Pilsner Malz', { currentStock: 0 }), art('Münchner Malz', { currentStock: 0 }), art('Carapils', { currentStock: 1 }), art('Carahell', { currentStock: 1 }), art('Caramünch II', { currentStock: 1 }),
    ];
    const r = noms(proposerFermentables({ articles: arts, dejaLa: [], styleCode: '5D', table: POCHE }));
    expect(r).toEqual(['Carapils', 'Caramünch II', 'Carahell', 'Pilsner Malz', 'Münchner Malz']);
  });

  it('sans style, le groupe des disponibles passe de même avant celui des épuisés', () => {
    const arts = [art('Pilsner Malz', { currentStock: 0, favorite: true }), art('Carapils')];
    expect(noms(proposerFermentables({ articles: arts, dejaLa: [] }))).toEqual(['Carapils', 'Pilsner Malz']);
  });
});
