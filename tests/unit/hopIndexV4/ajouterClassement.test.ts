// Voie f5-ajouter-corrige (D107, P1 à P3 et P6) : le classement de la liste « Ajouter — houblon… » (quickAdds).
//   P6a : aucune forme (Citra cryo) ne passe devant sa variété (Citra), et la variété simple reste candidate (D174, « on voit pas citra simple »).
//   P6b : les phares par style : Mosaic dans les 5 premiers achats de la 21A (la capture du brasseur), et la règle confrontée à la réputation (L14) sur les 31 styles.
//   P1  : les familles neutres ne pénalisent plus devant les attendues ; P3 : ibuParMoment seulement pour les lignes rendues ; P5 A : la règle dit « dose de départ ».
// Les deux premiers groupes (P6a, P6b) DOIVENT échouer sur HEAD (voir RESULTAT.md de f5) : sur HEAD Citra simple n'est pas candidate et Mosaic est 24e.
import { beforeAll, describe, expect, it } from 'vitest';
import { chargerCataloguePlein, DONNEES_FIXTURE, hopRef, type CatalogueHop, type StockHop } from '../../../src/domain/hopIndex/v4/data';
import { creerMoteur, type Moteur } from '../../../src/domain/hopIndex/v4/moteur';
import { QUICK_ADD_RULE, quickAddKey, type QuickAdd } from '../../../src/domain/hopIndex/v4/quickAdd';
import type { Recipe } from '../../../src/domain/hopIndex/v4/recipe';
import { getStyleScale } from '../../../src/domain/hopIndex/v4/style/scale';
import bandes from '../../../src/data/hopV4/style-bands.json';
import { PHARES_PAR_STYLE } from './pharesParStyle';

const STYLES = Object.keys((bandes as unknown as { styles: Record<string, unknown> }).styles);
const recette = (style: string): Recipe => ({ name: style, styleCode: style, volumeL: 24, og: 1.06, boilMin: 60, yeastId: 'fermentis-us05', ebc: 10,
  additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }] });
const OPTIONS = { catalogueLimit: 10000, aromatique: true } as const;
const CITRA = 'beermaverick-citra', CRYO = 'beermaverick-citra:cryo';
/** Les clés de style : tout le classement sauf le stock libre (la dernière clé). */
const cleDeStyle = (r: QuickAdd) => quickAddKey(r).slice(0, -1);
const cmpCles = (a: number[], b: number[]) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };

let plein: CatalogueHop[];
let moteurStock: Moteur, moteurVide: Moteur;
beforeAll(async () => {
  plein = await chargerCataloguePlein();
  moteurStock = creerMoteur({ catalogue: plein, stock: DONNEES_FIXTURE.stock });
  moteurVide = creerMoteur({ catalogue: plein, stock: [] });
}, 60000);
const liste = (m: Moteur, style: string) => m.dans(() => m.quickAdds(recette(style), getStyleScale(style), null, OPTIONS));

describe('P6a (D174) : aucune forme ne passe devant sa variété, et la variété simple reste candidate', () => {
  it('les 31 styles : Citra (simple) est candidate à côté de Citra cryo du stock, avec les mêmes clés de style, jamais mieux classée qu\'elle', () => {
    expect(plein.length).toBe(505);
    expect(STYLES).toHaveLength(31);
    for (const style of STYLES) {
      const q = liste(moteurStock, style);
      const toutes = [...q.disponibles, ...q.epuises, ...q.catalogue];
      const varieteDe = (cle: string) => moteurStock.dans(() => hopRef(cle)!.varietyId);
      const formes = toutes.filter((r) => varieteDe(r.key) !== r.key);
      expect(formes.map((r) => r.key), `${style} : la seule forme du stock des fixtures`).toEqual([CRYO]);
      for (const forme of formes) {
        const variete = toutes.find((r) => r.key === varieteDe(forme.key));
        expect(variete, `${style} : ${forme.name} sans sa variété simple (Citra ne serait pas candidate)`).toBeDefined();
        expect(cmpCles(cleDeStyle(variete!), cleDeStyle(forme)), `${style} : ${forme.name} mieux classée que ${variete!.name}`).toBeLessThanOrEqual(0);
      }
    }
  });

  it('une forme en stock plus fourni que sa variété (65 g contre 5 g) ne la dépasse pas dans la liste : ni le stock ni l\'α n\'y font rien', () => {
    const citraSimple: StockHop = { key: CITRA, varietyId: CITRA, form: 'unknown', grams: 5, alpha: null, alphaFrom: null, items: ['banc f5'] };
    const m = creerMoteur({ catalogue: plein, stock: [...DONNEES_FIXTURE.stock, citraSimple] });
    for (const style of STYLES) {
      const q = liste(m, style);
      const noms = q.disponibles.map((r) => r.key);
      const iCryo = noms.indexOf(CRYO), iSimple = noms.indexOf(CITRA);
      expect(iCryo, `${style} : cryo au stock`).toBeGreaterThanOrEqual(0);
      expect(iSimple, `${style} : Citra simple au stock`).toBeGreaterThanOrEqual(0);
      expect(iSimple, `${style} : Citra simple (5 g) derrière Citra cryo (65 g)`).toBeLessThan(iCryo);
    }
  });
});

describe('P6b (L14) : les phares par style, confrontés à la règle', () => {
  it('21A, la capture du brasseur : Mosaic, phare d\'une IPA, est dans les 5 premiers achats (24e sur HEAD)', () => {
    const q = liste(moteurStock, '21A');
    const place = q.catalogue.findIndex((r) => r.key === 'beermaverick-mosaic') + 1;
    expect(place, 'Mosaic, achat n°').toBeGreaterThan(0);
    expect(place).toBeLessThanOrEqual(5);
  });

  it('chaque phare de la table existe au catalogue plein (aucun phare imaginaire)', () => {
    expect(Object.keys(PHARES_PAR_STYLE).sort()).toEqual([...STYLES].sort());
    for (const [style, ids] of Object.entries(PHARES_PAR_STYLE)) for (const id of ids) expect(moteurVide.dans(() => hopRef(id)), `${style} : ${id}`).not.toBeNull();
  });

  // Stock vide : la liste d'achats ne montre que la règle de style (le stock ne fait que départager). Rang = position dans la liste de 505.
  // Quatre styles échappent : 16C et 20C (aucune famille « attendue » dans la table du style : seul le frein des neutres décide, et il met en tête les houblons
  // les moins décrits), 23A et 23G (toutes les familles « indésirables » : tout houblon décrit est « hors style »). Connus, non couverts ; voir RESULTAT.md de f5.
  const CONNUS_HORS_REGLE = ['16C', '20C', '23A', '23G'];
  it('31 styles, stock vide : un phare dans les 10 premiers sur 15 styles au moins (5 sur HEAD) ; pour les 27 autres, le meilleur phare dans les 75 premiers', () => {
    const rangs = STYLES.map((style) => {
      const achats = liste(moteurVide, style).catalogue.map((r) => r.key);
      const trouves = PHARES_PAR_STYLE[style].map((id) => achats.indexOf(id) + 1).filter((n) => n > 0);
      return { style, meilleur: Math.min(...trouves) };
    });
    expect(rangs.filter((r) => r.meilleur <= 10).length).toBeGreaterThanOrEqual(15);
    for (const { style, meilleur } of rangs.filter((r) => !CONNUS_HORS_REGLE.includes(r.style))) expect(meilleur, `${style} : meilleur phare, rang`).toBeLessThanOrEqual(75);
  });
});

describe('P1 (K3) : seules les familles indésirables pénalisent ; les attendues comptent par niveau ; les neutres freinent après elles', () => {
  it('poids : indésirables, attendues et neutres sont des sommes par niveau, et offStyleWeight (lu par la construction) en est la somme indésirables + neutres', () => {
    const q = liste(moteurVide, '21A');
    for (const r of q.catalogue) {
      expect(r.poids.indesirables + r.poids.neutres, r.name).toBe(r.offStyleWeight);
      const attendues = r.supports.reduce((s, f) => s + (r.cited.find((c) => c.family === f)?.level === 'marqué' ? 2 : 1), 0);
      expect(r.poids.attendues, r.name).toBe(attendues);
    }
  });

  it('la clé : [usage, conflit de dégustation, indésirables, −attendues, neutres, −stock] ; un houblon à 2 neutres et 7 attendues passe devant un houblon à 0 neutre et 4 attendues', () => {
    const q = liste(moteurVide, '21A');
    const mosaic = q.catalogue.find((r) => r.key === 'beermaverick-mosaic')!;
    expect(quickAddKey(mosaic).slice(1, 5)).toEqual([0, mosaic.poids.indesirables, -mosaic.poids.attendues, mosaic.poids.neutres]);
    // Un houblon plus chargé en attendues passe devant, même s'il cite plus de familles neutres (sur HEAD, les neutres pesaient devant les attendues).
    let paire: [QuickAdd, QuickAdd] | null = null;
    for (const a of q.catalogue) for (const b of q.catalogue) {
      if (a.fit === b.fit && a.poids.indesirables === b.poids.indesirables && a.poids.attendues > b.poids.attendues && a.poids.neutres > b.poids.neutres) { paire = [a, b]; break; }
    }
    expect(paire, 'une paire « plus d\'attendues mais plus de neutres » existe dans la 21A').not.toBeNull();
    expect(q.catalogue.indexOf(paire![0])).toBeLessThan(q.catalogue.indexOf(paire![1]));
  });
});

describe('P3 : ibuParMoment ne se calcule que pour les lignes rendues', () => {
  it('par défaut : sur les disponibles seulement ; avec ibuParMomentPartout : aussi sur les épuisés et les achats gardés', () => {
    const q = moteurStock.dans(() => moteurStock.quickAdds(recette('21A'), getStyleScale('21A'), null, { catalogueLimit: 5, aromatique: true }));
    expect(q.disponibles.every((r) => Array.isArray(r.ibuParMoment) && r.ibuParMoment.length > 0)).toBe(true);
    expect([...q.epuises, ...q.catalogue].every((r) => r.ibuParMoment === undefined)).toBe(true);
    expect(q.catalogue).toHaveLength(5);
    const p = moteurStock.dans(() => moteurStock.quickAdds(recette('21A'), getStyleScale('21A'), null, { catalogueLimit: 5, aromatique: true, ibuParMomentPartout: true }));
    expect([...p.disponibles, ...p.epuises, ...p.catalogue].every((r) => Array.isArray(r.ibuParMoment) && r.ibuParMoment.length > 0)).toBe(true);
  });
});

describe('P5 A : la règle écrite dit que 10′ et 0,5 g/L sont une dose de départ', () => {
  it('QUICK_ADD_RULE : « 10′ et 0,5 g/L : dose de départ, pas une dose de style »', () => {
    expect(QUICK_ADD_RULE.join(' ')).toContain('10′ et 0,5 g/L : dose de départ, pas une dose de style');
  });
});
