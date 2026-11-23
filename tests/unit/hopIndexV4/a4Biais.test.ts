// Voie a4 (D124, D125) : trois biais du classement de Suggérer, mesurés par f9 et m9 sur la Double IPA du brasseur (22A, neipa v3).
//  1. Une famille NEUTRE du style (le style n'en dit rien : bande 0–30 par hypothèse, sans citation) punissait comme une famille hors du style : El Dorado, freiné par sa poire.
//  2. La présélection du pool (borne de coût de 80) suivait la documentation des fiches : Calypso, courant en 22A mais peu documenté, était écarté avant tout classement.
//  3. Une typicité INCONNUE passait après une typicité RARE connue : l'inconnu n'est pas une rareté.
// Chaque test échoue sur HEAD (2deafff1) et passe ensuite. Les options `debordementNeutre: true` et `selection: 'documentation'` rendent l'ordre d'avant (réversible).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CATALOGUE } from '../../../src/domain/hopIndex/v4/data';
import { cleHoublon, comparerCles } from '../../../src/domain/hopIndex/v4/departage';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../../src/domain/hopIndex/v4/recipe';
import { poserTypicite, typiciteDe, type TableTypicite } from '../../../src/domain/hopIndex/v4/typicite';
import { PALIER_INCONNU_DANS_LA_CLE } from '../../../src/domain/hopIndex/v4/typicite-acces';
import { DEBORDEMENT_NEUTRE_DEFAUT, SELECTION_DEFAUT, type Voie } from '../../../src/domain/hopIndex/v4/voies';

const CLE = (id: string) => `beermaverick-${id}`;
const table = JSON.parse(readFileSync(join(process.cwd(), 'src', 'data', 'hopV4', 'typicite-styles.json'), 'utf8')) as TableTypicite;
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const R22A: Recipe = { name: 'neipa v3', styleCode: '22A', volumeL: 24, og: 1.081, boilMin: 60, yeastId: 'lalbrew-verdant-ipa', ebc: 7, additions: [{ id: 'a1', hopKey: CLE('lotus'), moment: 'b30', grams: 84 }] };
const GRAND = { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false } as const;
const ajouts = (vs: Voie[]) => vs.filter((v) => v.type === 'ajouter' && v.actions.length === 1);
const rang = (vs: Voie[], id: string) => ajouts(vs).findIndex((v) => v.actions[0].hopKey === CLE(id)) + 1;

beforeAll(() => poserTypicite(table));
afterAll(() => poserTypicite(null));

describe('biais 1 : le dépassement d\'une famille neutre ne punit pas comme une faute de style', () => {
  it('les défauts sont posés : le neutre ne compte plus, la présélection suit la typicité', () => {
    expect(DEBORDEMENT_NEUTRE_DEFAUT).toBe(false);
    expect(SELECTION_DEFAUT).toBe('rang');
  });
  it('El Dorado en 22A, dry hop actif : sa poire (famille neutre) reste dite, mais ne compte plus dans le rang ; il monte de plus de 100 places', () => {
    const def = m.proposeVoies(R22A, { citrus: 1 }, { ...GRAND, moments: ['dryActive'] }).voies;
    const avant = m.proposeVoies(R22A, { citrus: 1 }, { ...GRAND, moments: ['dryActive'], debordementNeutre: true }).voies;
    const ed = ajouts(def).find((v) => v.actions[0].hopKey === CLE('el-dorado'))!;
    expect(ed.styleOverflow.some((o) => o.family === 'pomeFruit' && o.status === 'neutre')).toBe(true); // honnête : le dépassement est dit
    expect(ed.overflowTotal).toBeGreaterThan(0);
    expect(ed.overflowRang ?? ed.overflowTotal).toBe(0); // …et ne punit pas
    expect(rang(avant, 'el-dorado') - rang(def, 'el-dorado')).toBeGreaterThan(100);
  });
  it('le rang ne lit que le dépassement d\'une famille attendue (sous sa bande) ou indésirable : jamais celui d\'une famille neutre, à aucun moment', () => {
    for (const [r, dir] of [[R22A, { citrus: 1 }], [R22A, { tropical: 1 }], [{ ...R22A, styleCode: '16D' }, { floral: 1 }]] as const) {
      const vs = m.proposeVoies(r, dir, { ...GRAND, moments: ['b10', 'wp', 'dryActive'] }).voies;
      for (const v of vs) {
        const horsNeutre = v.styleOverflow.filter((o) => o.status !== 'neutre').reduce((s, o) => s + o.crans, 0);
        expect(v.overflowRang ?? v.overflowTotal, v.id).toBeLessThanOrEqual(horsNeutre + 1e-9);
      }
    }
  });
  it('le neutre reste compté plus loin : les effets de bord le portent toujours (la voie qui pousse le plus une famille neutre passe après, à rang égal)', () => {
    const vs = ajouts(m.proposeVoies(R22A, { citrus: 1 }, { ...GRAND, moments: ['dryActive'] }).voies);
    const ed = vs.find((v) => v.actions[0].hopKey === CLE('el-dorado'))!;
    expect(ed.sideTotal).toBeGreaterThan(0);
    expect(ed.sideEffects.some((s) => s.family === 'pomeFruit')).toBe(true);
  });
  it('la dose d\'un houblon ne fuit plus le dépassement d\'une famille neutre : même effet à la dose gardée, au whirlpool, pour El Dorado et Citra', () => {
    const def = ajouts(m.proposeVoies(R22A, { citrus: 1 }, { ...GRAND, moments: ['wp'] }).voies);
    const d = (id: string) => def.find((v) => v.actions[0].hopKey === CLE(id))!.distance.total!;
    expect(d('el-dorado')).toBeLessThanOrEqual(d('citra') + 0.02);
  });
});

describe('biais 2 : la présélection du pool n\'écarte pas un houblon dont le style établit la typicité', () => {
  // La borne (POOL_BORNE = 80) existe pour le coût. Son ordre met d'abord la typicité du style (typé, courant), puis la documentation : un houblon courant mais peu documenté (Calypso) n'est plus coupé.
  it('en 22A, tout houblon qui cite la famille et dont la typicité est établie (typé ou courant) est dans la liste par défaut', () => {
    for (const f of ['citrus', 'tropical'] as const) {
      const defaut = m.proposeVoies(R22A, { [f]: 1 }, { limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['dryActive'] }).voies; // maxBuy absent : la borne de 80
      const tout = m.proposeVoies(R22A, { [f]: 1 }, { ...GRAND, moments: ['dryActive'] }).voies;
      const etablis = ajouts(tout).map((v) => v.actions[0].hopKey).filter((k) => (typiciteDe(k, '22A').palier ?? 0) >= 2);
      expect(etablis.length, 'la borne doit pouvoir les tenir tous').toBeLessThan(80);
      const absents = etablis.filter((k) => rang(defaut, k.replace('beermaverick-', '')) === 0);
      expect(absents, `${f} : coupés par la présélection : ${absents.join(', ')}`).toEqual([]);
    }
  });
  it('Calypso (courant en 22A, un seul style publié, peu documenté) est classé en agrumes ET en tropicaux ; à l\'ordre d\'avant (documentation), il était coupé', () => {
    const o = { limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['dryActive' as const] };
    expect(typiciteDe(CLE('calypso'), '22A').palier).toBe(2);
    for (const f of ['citrus', 'tropical'] as const) {
      expect(rang(m.proposeVoies(R22A, { [f]: 1 }, o).voies, 'calypso'), f).toBeGreaterThan(0);
    }
  });
  it('sans table (typicité inconnue pour tous), l\'ordre est celui d\'avant, à l\'octet près : la présélection ne dépend que de ce que la table établit', () => {
    poserTypicite(null);
    try {
      const o = { limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['dryActive' as const] };
      expect(JSON.stringify(m.proposeVoies(R22A, { citrus: 1 }, o).voies)).toBe(JSON.stringify(m.proposeVoies(R22A, { citrus: 1 }, { ...o, selection: 'documentation' }).voies));
    } finally { poserTypicite(table); }
  });
});

describe('biais 3 : une typicité inconnue ne passe jamais derrière un rare connu', () => {
  // Une table minuscule, à nous : Citra typé ; un houblon rare publié ; un houblon hors des 16 premiers de borne basse (rare par la borne) ; un autre de borne haute (inconnu) ; Saaz absent de la source.
  const petite: TableTypicite = {
    source: { nom: 'Beer Analytics', licence: 'CC BY-SA 4.0', releve: null }, voisins: {}, poidsVoisin: 0.5, styles: { '22A': 'Double IPA' },
    p16: { citra: 0.2, nugget: 0.004, columbus: 0.03, 'el-dorado': 0.0256 },
    parts: { '22A': { citra: 0.35, 'el-dorado': 0.003 } }, familles: {}, concentration: {}, recettes: {},
  };
  const avecPetite = <T,>(f: () => T): T => { poserTypicite(petite); try { return f(); } finally { poserTypicite(table); } };

  it('la borne tranche quand elle le peut : un style hors des 16 premiers dont la plus grande part possible est sous 1 % est « rare », connu par la borne', () => {
    avecPetite(() => {
      const n = typiciteDe(CLE('nugget'), '22A'); // p16 0,4 % : au plus 0,4 % des recettes de Double IPA
      expect(n.palier).toBe(1);
      expect(n.origine).toBe('borne');
      expect(n.auPlus).toBe(0.004);
      expect(n.part).toBeNull(); // la part n'est pas connue, seulement bornée : jamais un chiffre inventé
    });
  });
  it('quand la borne ne tranche pas (p16 = 3 %), la typicité reste inconnue, bornée, et ne devient ni 0 ni un palier inventé ; absente de la source : inconnue', () => {
    avecPetite(() => {
      const c = typiciteDe(CLE('columbus'), '22A');
      expect(c.palier).toBeNull();
      expect(c.auPlus).toBe(0.03);
      expect(typiciteDe(CLE('saaz-cz'), '22A').palier).toBeNull();
    });
  });
  it('dans la clé du rang, un inconnu passe devant un rare connu (publié ou par la borne), et derrière un courant et un typé', () => {
    avecPetite(() => {
      const cle = (id: string) => cleHoublon('k3k1t', CLE(id), 'citrus', '22A');
      expect(cle('el-dorado').cle[1]).toBe(1); // rare publié (0,3 %)
      expect(cle('nugget').cle[1]).toBe(1); // rare par la borne
      expect(cle('columbus').cle[1]).toBe(PALIER_INCONNU_DANS_LA_CLE); // inconnu mais borné (au plus 3 %)
      expect(cle('saaz-cz').cle[1]).toBeNull(); // aucune donnée (absent de la source, pas même une borne) : après tout le connu
      expect(cle('citra').cle[1]).toBe(3);
      expect(PALIER_INCONNU_DANS_LA_CLE).toBeGreaterThan(1);
      expect(PALIER_INCONNU_DANS_LA_CLE).toBeLessThan(2);
      // La comparaison complète, étape par étape (la famille citée est la même, la typicité tranche) : l'inconnu borné devant le rare, jamais l'inverse ; ni devant un courant ou un typé.
      const ec = (a: string, b: string) => comparerCles(cle(a).cle.slice(0, 2), cle(b).cle.slice(0, 2));
      expect(ec('columbus', 'el-dorado')).toBeLessThan(0);
      expect(ec('columbus', 'nugget')).toBeLessThan(0);
      expect(ec('citra', 'columbus')).toBeLessThan(0);
      expect(ec('nugget', 'saaz-cz')).toBeLessThan(0); // sans aucune donnée : toujours après le connu
      expect(ec('columbus', 'saaz-cz')).toBeLessThan(0);
    });
  });
  it('le texte de la clé dit ce qu\'elle sait : « inconnue … entre courant et rare », « rare : au plus 0,4 % … borne », ou « inconnue … après les rares connus » sans aucune donnée', () => {
    avecPetite(() => {
      expect(cleHoublon('k3k1t', CLE('saaz-cz'), 'citrus', '22A').origine[1]).toMatch(/inconnue.*après les rares connus/);
      expect(cleHoublon('k3k1t', CLE('columbus'), 'citrus', '22A').origine[1]).toMatch(/inconnue.*au plus 3 %.*entre courant et rare/);
      expect(cleHoublon('k3k1t', CLE('nugget'), 'citrus', '22A').origine[1]).toMatch(/rare : au plus 0[.,]4 %.*borne/);
    });
  });
});
