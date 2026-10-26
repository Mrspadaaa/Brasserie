// Voie f2-affinage-a-b1-c-d (D102, 26.10) : les contrôles de D174 (Citra cryo « boosté », Citra simple absent) et de D175 (aucun phare coupé avant le rang final).
// Écrits AVANT le correctif et rejoués sur HEAD : ils y échouent (voir RESULTAT.md de la voie), puis passent.
//   D174 : dans Suggérer, Citra simple apparaît partout où Citra cryo apparaît (le pool « à acheter » se fait par clé) ; à 60′ le cryo est un produit d'arôme
//          (démotion de Substituer) et son rang de palier se calcule sur l'α de la VARIÉTÉ, pas sur celui du lot (24,8 %).
//   D175 : le pool n'est plus coupé à 6 avant le classement ; `buyLimit` et `perHop` coupent l'affichage, après le rang. D105 : une borne de coût de 80 houblons (`maxBuy`, ordre de qualité du pool,
//          documentation d'abord) ; les phares y restent.
// Stock : celui des fixtures du prototype (16 articles dont Citra cryo, 65 g, α 24,8 % lu sur l'article).
import { describe, expect, it, vi } from 'vitest';
import { CATALOGUE, STOCK } from '../../../src/domain/hopIndex/v4/data';
import { FAMILIES, type FamilyId } from '../../../src/domain/hopIndex/v4/families';
import { citations, marquee } from '../../../src/domain/hopIndex/v4/hops';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../../src/domain/hopIndex/v4/recipe';
import { getStyleScale } from '../../../src/domain/hopIndex/v4/style/scale';
import type { Voie, VoieResult } from '../../../src/domain/hopIndex/v4';

vi.setConfig({ testTimeout: 180_000 });
const m = creerMoteur(); // les fixtures du prototype : le stock contient Citra cryo
const CLE = (id: string) => `beermaverick-${id}`;
const CITRA = CLE('citra'), CRYO = `${CLE('citra')}:cryo`;
const R21C: Recipe = { name: 'Hazy du jeudi (21C)', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: CLE('nugget'), moment: 'b60', grams: 20 }, { id: 'a2', hopKey: CLE('cascade'), moment: 'dryActive', grams: 80 }] };
const R16D: Recipe = { name: 'Stout export (16D)', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [
  { id: 'a1', hopKey: CLE('nugget'), moment: 'b60', grams: 46 }] };
const VISEES: { nom: string; r: Recipe; dir: Partial<Record<FamilyId, number>> }[] = [
  { nom: '21C plus d’agrumes', r: R21C, dir: { citrus: 1 } },
  { nom: '16D plus floral', r: R16D, dir: { floral: 1 } },
  { nom: '16D moins de résineux', r: R16D, dir: { resin: -1 } },
];
// Une raison écrite à l'absence de Citra simple d'une liste de « remplacements » : le moteur dose le cryo gramme pour gramme comme un pellet (24 g de cryo à 24,8 % contre 48 g de
// simple à 12,5 % pour le même IBU), donc à α de lot différent les deux voies n'ont pas le même apport ; l'une peut rapprocher de la visée (moins de résineux), l'autre non.
// Ce n'est pas le pool : à α de lot égal (stock ci-dessous), les deux apparaissent ensemble partout.
const alphaVariete = (() => { const a = CATALOGUE.find((h) => h.id === CITRA)!.alpha!; return (a[0] + a[1]) / 2; })();
const mAligne = creerMoteur({ catalogue: CATALOGUE, stock: STOCK.map((s) => (s.key === CRYO ? { ...s, alpha: alphaVariete } : s)) });
/** Aucune coupe d'affichage : on lit le classement entier. */
const OUVERT = { limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false } as const;
const cles = (vs: Voie[]) => new Set(vs.flatMap((v) => v.actions.map((a) => a.hopKey)));
const PHARES = ['citra', 'nelson-sauvin', 'galaxy', 'mosaic', 'motueka', 'idaho-7', 'strata', 'simcoe', 'cascade', 'hallertau-blanc'];

describe('D174 : Citra simple apparaît partout où Citra cryo apparaît (Suggérer)', () => {
  it.each(VISEES)('$nom : chaque liste qui montre le cryo montre aussi le simple (voies, 60′, dry hop actif et après ; à α de lot égal pour les remplacements)', ({ r, dir }) => {
    const res = (dir.resin ? mAligne : m).proposeVoies(r, dir, { ...OUVERT, palier60: { ibu: 10 }, dryHop: true });
    const listes: [string, Voie[]][] = [['voies', res.voies], ['palier 60′', res.palier60!.voies], ['dry hop actif', res.dryHop!.actif], ['dry hop après', res.dryHop!.apres]];
    let temoins = 0;
    for (const [nom, vs] of listes) {
      const k = cles(vs);
      if (k.has(CRYO)) { temoins++; expect(k.has(CITRA), `${nom} : Citra cryo sans Citra simple`).toBe(true); }
    }
    // Témoin positif : le cryo (en stock) est bien dans au moins une liste, sinon la règle ne prouve rien.
    expect(temoins).toBeGreaterThan(0);
  });

  it.each(VISEES)('$nom : à nombres d’affichage par défaut, la liste principale ne perd pas le stock pour autant', ({ r, dir }) => {
    const res = m.proposeVoies(r, dir, { assemblages: true });
    expect(res.voies.filter((v) => v.domain === 'stock').length).toBeLessThanOrEqual(10);
    expect(res.voies.filter((v) => v.domain === 'à acheter').length).toBeLessThanOrEqual(4);
  });

  it.each(VISEES.slice(0, 2))('$nom, 60′ : Citra cryo n’est plus 1er, et il passe après Citra simple (produit d’arôme)', ({ r, dir }) => {
    const p = m.proposeVoies(r, dir, { ...OUVERT, palier60: { ibu: 10 } }).palier60!.voies;
    expect(p[0].actions[0].hopKey).not.toBe(CRYO);
    const cryo = p.findIndex((v) => v.actions[0].hopKey === CRYO), simple = p.findIndex((v) => v.actions[0].hopKey === CITRA);
    expect(cryo).toBeGreaterThanOrEqual(0); expect(simple).toBeGreaterThanOrEqual(0);
    expect(simple).toBeLessThan(cryo);
    // La démotion : un produit d'arôme tombe dans le palier des arômes (rang d'usage 1), jamais celui des amérisants et doubles usages (Citra est « double usage »).
    expect(p[cryo].palier!.rang[0]).toBe(1);
    expect(p[simple].palier!.rang[0]).toBe(0);
  });

  it('60′ : le rang de palier du cryo se calcule sur l’α de la variété, mais l’α affiché reste celui du lot', () => {
    const p = m.proposeVoies(R21C, { citrus: 1 }, { ...OUVERT, palier60: { ibu: 10 } }).palier60!.voies;
    const cryo = p.find((v) => v.actions[0].hopKey === CRYO)!, simple = p.find((v) => v.actions[0].hopKey === CITRA)!;
    expect(cryo.palier!.rang[1]).toBeCloseTo(simple.palier!.rang[1], 6); // mêmes grammes de rang : le même α (de la variété)
    expect(cryo.palier!.alpha).toBe(24.8); // honnêteté : l'α du lot reste dit
    expect(simple.palier!.alpha).toBeLessThan(20);
    // La dose proposée, elle, suit l'α du lot : moins de grammes de cryo pour le même IBU (le brasseur pèse son cryo).
    expect(cryo.actions[0].grams).toBeLessThan(simple.actions[0].grams);
    // Le rang n'est pas une dose : les grammes de rang valent l'IBU visé à l'α de la variété.
    const ibu = m.additionIbu({ id: 'x', hopKey: CITRA, moment: 'b60', grams: cryo.palier!.rang[1] }, R21C).value;
    expect(ibu).toBeCloseTo(10, 2);
  });

  it('60′ : un lot ordinaire (pas un produit) garde le rang sur son propre α', () => {
    const p = m.proposeVoies(R21C, { citrus: 1 }, { ...OUVERT, palier60: { ibu: 10 } }).palier60!.voies;
    const galaxy = p.find((v) => v.actions[0].hopKey === CLE('galaxy'))!; // stock : lot α 17,2 % (plage variétale plus basse)
    const ibu = m.additionIbu({ id: 'x', hopKey: CLE('galaxy'), moment: 'b60', grams: galaxy.palier!.rang[1] }, R21C).value;
    expect(ibu).toBeCloseTo(10, 2); // les grammes de rang valent l'IBU visé à l'α du LOT
    expect(galaxy.palier!.alpha).toBe(17.2);
  });

  it('« remplacer à IBU égal » : le cryo suit la même règle d’usage et de rang', () => {
    const vs = mAligne.proposeVoies(R16D, { floral: 1 }, { ...OUVERT, palier60: { ibu: 10 } }).voies.filter((v) => v.type === 'remplacer à IBU égal' && v.actions[0].moment === 'b60');
    const cryo = vs.find((v) => v.actions[0].hopKey === CRYO), simple = vs.find((v) => v.actions[0].hopKey === CITRA);
    expect(cryo?.palier?.rang[0]).toBe(1);
    expect(simple?.palier?.rang[0]).toBe(0);
    expect(vs.indexOf(simple!)).toBeLessThan(vs.indexOf(cryo!));
  });
});

describe('D175 : aucun phare coupé avant le rang final, sauf par une exclusion écrite (D90)', () => {
  /** L'exclusion écrite (D90) : une famille « moins » ou indésirable du style, MARQUÉE chez la variété (la moitié au moins de ses fiches). */
  const exclu = (id: string, r: Recipe, dir: Partial<Record<FamilyId, number>>) => {
    const style = getStyleScale(r.styleCode);
    const moins = FAMILIES.filter((f) => (dir[f] ?? 0) < 0);
    return moins.some((f) => marquee(id, f)) || FAMILIES.some((f) => style.families[f].status === 'indésirable' && marquee(id, f));
  };
  const cite = (id: string, f: FamilyId) => citations(id)[f].status === 'cité';

  it.each(VISEES.slice(0, 2))('$nom : tout phare de la visée, non exclu par D90, est classé (ni maxBuy ni autre plafond avant le rang)', ({ r, dir }) => {
    const res = m.proposeVoies(r, dir, OUVERT); // borne de coût par défaut (80, D105) : les phares, bien documentés, sont en tête de l'ordre du pool
    const vus = cles(res.voies.filter((v) => v.type === 'ajouter'));
    const plus = FAMILIES.filter((f) => (dir[f] ?? 0) > 0);
    const attendus = PHARES.map(CLE).filter((id) => CATALOGUE.some((h) => h.id === id) && !exclu(id, r, dir) && plus.some((f) => cite(id, f)));
    expect(attendus.length).toBeGreaterThan(3);
    const absents = attendus.filter((id) => ![...vus].some((k) => k.replace(/:cryo$/, '') === id));
    expect(absents, `phares coupés : ${absents.join(', ')}`).toEqual([]);
  });

  it('les exclusions D90 restent écrites : Strata (21C) et Simcoe (16D « moins de résineux ») sont refusés par une famille marquée', () => {
    expect(exclu(CLE('strata'), R21C, { citrus: 1 })).toBe(true);
    expect(exclu(CLE('simcoe'), R16D, { resin: -1 })).toBe(true);
    const res = m.proposeVoies(R21C, { citrus: 1 }, OUVERT);
    expect([...cles(res.voies)].some((k) => k === CLE('strata'))).toBe(false);
  });

  it('D105 : la borne de coût (80) garde les phares de la stout « moins de résineux » (Strata y est), 6 les coupait', () => {
    const k = (o: object) => cles(m.proposeVoies(R16D, { resin: -1 }, { ...OUVERT, ...o }).voies);
    expect(k({}).has(CLE('strata'))).toBe(true);
    expect(k({ maxBuy: 6 }).has(CLE('strata'))).toBe(false); // l'ancien défaut
    expect(k({ maxBuy: 400 }).has(CLE('strata'))).toBe(true); // toute la liste
  });

  it.each(VISEES)('$nom : `maxBuy` est une borne de coût (défaut 80, 400 = tout), et la liste par défaut est le haut du classement', ({ r, dir }) => {
    const defaut = m.proposeVoies(r, dir, { assemblages: true });
    expect(JSON.stringify(m.proposeVoies(r, dir, { assemblages: true, maxBuy: 80 }))).toBe(JSON.stringify(defaut));
    expect(m.proposeVoies(r, dir, { assemblages: true, maxBuy: 400 }).evaluated).toBeGreaterThanOrEqual(defaut.evaluated);
    // Le nombre de rangées montrées ne change pas : au plus 10 du stock et 4 à acheter.
    expect(defaut.voies.filter((v) => v.domain === 'stock').length).toBeLessThanOrEqual(10);
    expect(defaut.voies.filter((v) => v.domain === 'à acheter').length).toBeLessThanOrEqual(4);
    // La coupe vient après le rang : les voies « à acheter » montrées sont, dans le même ordre, un sous-ensemble du classement entier.
    const tout = m.proposeVoies(r, dir, { ...OUVERT, maxBuy: 400, assemblages: true }).voies.filter((v) => v.domain === 'à acheter').map((v) => v.id);
    const montrees = defaut.voies.filter((v) => v.domain === 'à acheter').map((v) => v.id);
    let i = 0;
    for (const id of montrees) { const j = tout.indexOf(id, i); expect(j, id).toBeGreaterThanOrEqual(0); i = j + 1; }
  });

  it('sans visée à la hausse (remplacements), le pool « à acheter » n’est pas coupé non plus', () => {
    const res = m.proposeVoies(R16D, { resin: -1 }, OUVERT);
    const remplacants = new Set(res.voies.filter((v) => v.type === 'remplacer à masse égale' || v.type === 'remplacer à IBU égal').flatMap((v) => v.actions.map((a) => a.hopKey)));
    expect(remplacants.size).toBeGreaterThan(20);
  });
});

/** Le seul usage de VoieResult ici : la forme du retour reste celle d'avant. */
export type _Forme = VoieResult['voies'][number];
