// D195 (27.10) : « Plus d'agrumes » au dry hop actif sur une neipa v3 déjà saturée (Lotus 78 g à 15′ et 144 g au dry hop actif) : Suggérer proposait East Kent Goldings, Golding, Spalter Select, Mount Hood,
// tous « hors du style », et la carte disait « Aucune voie houblon » au-dessus de quatre rangées. Le critique : « ça veut dire quoi aucune voie, il y en a quatre en dessous ? ».
// Deux règles, chacune avec son test (rouge sur ae7c7a8d, vert ensuite) :
//  R1. La demande prime sur la bande : pour une famille de la direction (monter, baisser, bannir), sortir de la bande est sa demande ; ni débordement au rang, ni « hors du style » à l'écran.
//  R2. Un excès sous un quart de cran ajouté (un cran est le pas du style) n'est pas « hors du style ».
//  R3. Un remplacement qui fait baisser une famille à baisser garde sa place à part : sans elle, des ajouts que l'écran écarte ensuite occupaient seuls les places (D194, « Remplacer Columbus »).
// L'option `saturation: false` rend l'ordre d'avant (ae7c7a8d).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CATALOGUE } from '../../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../../src/domain/hopIndex/v4/recipe';
import { poserTypicite, type TableTypicite } from '../../../src/domain/hopIndex/v4/typicite';
import { SATURATION_DEFAUT, SATURATION_MINUSCULE, USAGE_AU_FRAIS_DEFAUT, type Voie } from '../../../src/domain/hopIndex/v4/voies';
import { estHorsDuStyle } from '../../../src/ui/hopIndex/suggerer/voies';

const CLE = (id: string) => `beermaverick-${id}`;
const table = JSON.parse(readFileSync(join(process.cwd(), 'src', 'data', 'hopV4', 'typicite-styles.json'), 'utf8')) as TableTypicite;
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const base = { name: 'neipa v3', styleCode: '22A', volumeL: 24, og: 1.081, boilMin: 60, yeastId: 'lalbrew-verdant-ipa', ebc: 7 };
const SATUREE: Recipe = { ...base, additions: [{ id: 'a1', hopKey: CLE('lotus'), moment: 'b15', grams: 78 }, { id: 'a2', hopKey: CLE('lotus'), moment: 'dryActive', grams: 144 }] };
const COLUMBUS: Recipe = { ...base, additions: [{ id: 'a1', hopKey: CLE('lotus'), moment: 'b30', grams: 84 }, { id: 'a2', hopKey: CLE('columbus'), moment: 'dryActive', grams: 100 }] };
const GRAND = { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['dryActive'], typicite: true, intensite: false } as const;
const NOBLES = ['east-kent-goldings', 'golding', 'spalter-select', 'mount-hood'].map(CLE);
const ajouts = (vs: Voie[]) => vs.filter((v) => v.type === 'ajouter' && v.actions.length === 1);

beforeAll(() => poserTypicite(table));
afterAll(() => poserTypicite(null));

describe('D195 R1 : la demande prime sur la bande', () => {
  it('le défaut est posé', () => {
    expect(SATURATION_DEFAUT).toBe(true);
    expect(SATURATION_MINUSCULE).toBe(0.25);
  });
  it('bière saturée en agrumes, « plus d’agrumes » : l’excès d’agrumes est dit mais voulu ; aucun noble dans les huit premiers ajouts', () => {
    const vs = ajouts(m.proposeVoies(SATUREE, { citrus: 1 }, GRAND).voies);
    const tete = vs.slice(0, 8);
    expect(tete.some((v) => NOBLES.includes(v.actions[0].hopKey))).toBe(false);
    const agrumes = tete.flatMap((v) => v.styleOverflow.filter((o) => o.family === 'citrus'));
    expect(agrumes.length).toBeGreaterThan(0); // honnête : le dépassement est dit
    expect(agrumes.every((o) => o.voulu === true)).toBe(true);
    expect(tete.every((v) => !v.styleOverflow.filter(estHorsDuStyle).some((o) => o.family === 'citrus'))).toBe(true);
  });
  it('sans l’option, l’ordre d’avant : les nobles passent devant et l’agrume est « hors du style »', () => {
    const vs = ajouts(m.proposeVoies(SATUREE, { citrus: 1 }, { ...GRAND, saturation: false }).voies);
    expect(vs.slice(0, 5).some((v) => NOBLES.includes(v.actions[0].hopKey))).toBe(true);
    expect(vs[0].styleOverflow.some((o) => o.family === 'citrus' && o.voulu === undefined && estHorsDuStyle(o))).toBe(true);
  });
  it('une famille qu’il demande de baisser n’est pas non plus un défaut', () => {
    const v = m.proposeVoies(COLUMBUS, { tropical: 1, resin: -1 }, { ...GRAND }).voies.find((x) => x.type.startsWith('remplacer') && x.styleOverflow.some((o) => o.family === 'resin'))!;
    expect(v).toBeDefined();
    expect(v.styleOverflow.filter((o) => o.family === 'resin').every((o) => o.voulu === true)).toBe(true);
  });
});

describe('D195 R2 : sous un quart de cran, ce n’est pas « hors du style »', () => {
  it('un excès sous un quart de cran est marqué minuscule, pas hors du style, et ne compte pas au rang ; au-dessus, il compte', () => {
    const vs = m.proposeVoies(SATUREE, { citrus: 1 }, GRAND).voies;
    const entrees = vs.flatMap((v) => v.styleOverflow.filter((o) => !o.voulu));
    const petits = entrees.filter((o) => o.crans < SATURATION_MINUSCULE), grands = entrees.filter((o) => o.crans >= SATURATION_MINUSCULE);
    expect(petits.length).toBeGreaterThan(0);
    expect(grands.length).toBeGreaterThan(0);
    expect(petits.every((o) => o.minuscule === true && !estHorsDuStyle(o))).toBe(true);
    expect(grands.every((o) => o.minuscule === undefined)).toBe(true);
    const seuls = vs.filter((v) => v.styleOverflow.length > 0 && v.styleOverflow.every((o) => o.voulu || o.minuscule));
    expect(seuls.length).toBeGreaterThan(0);
    expect(seuls.every((v) => (v.overflowRang ?? v.overflowTotal) === 0)).toBe(true);
  });
  it('estHorsDuStyle : une famille attendue ou indésirable oui ; neutre, voulue ou minuscule non', () => {
    expect(estHorsDuStyle({ status: 'attendue' })).toBe(true);
    expect(estHorsDuStyle({ status: 'indésirable' })).toBe(true);
    expect(estHorsDuStyle({ status: 'neutre' })).toBe(false);
    expect(estHorsDuStyle({ status: 'attendue', voulu: true })).toBe(false);
    expect(estHorsDuStyle({ status: 'attendue', minuscule: true })).toBe(false);
  });
});

describe('D195 R3 : un remplacement qui fait baisser la famille à baisser garde sa place', () => {
  it('avec une famille à baisser, les remplacements qui l’enlèvent s’ajoutent aux places de limit et buyLimit', () => {
    const lire = (saturation?: boolean) => m.proposeVoies(COLUMBUS, { tropical: 1, resin: -1 }, { moments: ['dryActive'], typicite: true, intensite: false, assemblages: true, ...(saturation === undefined ? {} : { saturation }) }).voies;
    const enleve = (vs: Voie[]) => vs.filter((v) => v.type.startsWith('remplacer') && v.effect.resin.established && (v.effect.resin.central ?? 0) < 0);
    const apres = lire(), avant = lire(false); // sans argument : le défaut
    expect(enleve(apres).length).toBeGreaterThanOrEqual(4);
    expect(apres.filter((v) => v.type !== 'levure').length).toBeGreaterThan(avant.filter((v) => v.type !== 'levure').length);
    expect(enleve(avant).length).toBeLessThanOrEqual(enleve(apres).length);
  });
});

describe('D195 R4 : au whirlpool et au dry hop, un amérisant passe après les houblons d’arôme ou de double usage', () => {
  const usage = (v: Voie) => CATALOGUE.find((c) => c.id === v.actions[0].hopKey)?.purpose;
  const tri = (o: object = {}) => ajouts(m.proposeVoies(SATUREE, { citrus: 1 }, { ...GRAND, ...o }).voies);
  it('le défaut est posé', () => { expect(USAGE_AU_FRAIS_DEFAUT).toBe(true); });
  it('à rang, distance et typicité égaux, aucun amérisant ne passe devant un houblon d’arôme ou de double usage ; il porte sa raison', () => {
    const vs = tri({ typicite: false }); // sans typicité du style, la clé de départage ne sépare pas : c'est là que R4 décide
    const amer = vs.filter((v) => usage(v) === 'bittering');
    expect(amer.length).toBeGreaterThan(0); // jamais une exclusion
    expect(amer.every((v) => !!v.reculeUsage && /amérisant/.test(v.reculeUsage))).toBe(true);
    expect(vs.filter((v) => usage(v) !== 'bittering').every((v) => v.reculeUsage === undefined)).toBe(true);
    // « égaux » : conflits, distance, rang de débordement et clé de départage (typicité du style) : la règle ne passe jamais devant la typicité (EKG, Target, Saaz sont des phares).
    const egal = (b: Voie, n: Voie) => n.conflicts.length === b.conflicts.length && n.distance.total === b.distance.total && n.overflowRang === b.overflowRang && JSON.stringify(n.departage?.cle) === JSON.stringify(b.departage?.cle);
    let inverses = 0, paires = 0;
    vs.forEach((b, i) => { if (usage(b) === 'bittering') vs.forEach((n, j) => { if (usage(n) !== 'bittering' && egal(b, n)) { paires++; if (j < i === false) inverses++; } }); });
    expect(paires).toBeGreaterThan(0);
    expect(inverses).toBe(0);
  });
  it('avec la typicité du style, R4 ne fait reculer aucun phare : elle passe après la typicité (EKG, Target restent là où le style les met)', () => {
    const sans = tri({ usageAuFrais: false }).map((v) => v.id), avec = tri().map((v) => v.id);
    expect(avec.length).toBe(sans.length);
    const e = (ids: string[], id: string) => ids.indexOf(id);
    for (const id of avec.slice(0, 20)) expect(e(avec, id) - e(sans, id)).toBeLessThanOrEqual(3);
  });
  it('sans l’option, l’ordre d’avant ne reculent pas', () => {
    const vs = tri({ usageAuFrais: false });
    expect(vs.some((v) => v.reculeUsage !== undefined)).toBe(false);
  });
  it('un usage inconnu ne recule pas, et un amérisant au 10′ ne recule pas (la règle est celle du whirlpool et du dry hop)', () => {
    const inconnu = creerMoteur({ catalogue: CATALOGUE.map((c) => (c.purpose === 'bittering' ? { ...c, purpose: null } : c)), stock: [] });
    expect(ajouts(inconnu.proposeVoies(SATUREE, { citrus: 1 }, GRAND).voies).some((v) => v.reculeUsage !== undefined)).toBe(false);
    const dix = ajouts(m.proposeVoies(SATUREE, { citrus: 1 }, { ...GRAND, moments: ['b10'] }).voies);
    expect(dix.length).toBeGreaterThan(0);
    expect(dix.some((v) => v.reculeUsage !== undefined)).toBe(false);
  });
});
