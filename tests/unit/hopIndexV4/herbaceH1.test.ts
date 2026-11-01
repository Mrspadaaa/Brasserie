// Voie h1 (D197) : « trop herbal ». Une grosse dose au dry hop (ou du houblon frais) apporte de l'herbacé et du végétal au lieu de plus d'agrumes (panel OSU, E04 : les agrumes plafonnent dès 8 g/L, l'herbacé monte encore).
// Règle : un excès d'herbacé (`herbal`) ou de végétal (`green`) au-dessus de la bande est un DÉFAUT même quand le style n'en dit rien (famille neutre) : il compte au rang et « hors du style ».
// Exceptions : la demande du brasseur (s3 R1) et un style qui attend la famille (`attendue`). Les AUTRES familles neutres restent sous a4 (D125) : la poire d'El Dorado ne punit pas.
// Chaque test d'effet échoue sur HEAD (3eb61530) et passe ensuite ; `defautVegetal: false` rend l'ordre d'avant.
// Deux angles : la liste principale (la dose est choisie par houblon : avec la règle, elle évite l'excès) et le vrai dry hop à dose imposée (`dryHop: { doseGL }`, l'excès ne peut pas être évité par la dose : le rang le lit).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CATALOGUE } from '../../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../../src/domain/hopIndex/v4/recipe';
import { poserTypicite, type TableTypicite } from '../../../src/domain/hopIndex/v4/typicite';
import { DEFAUT_VEGETAL_DEFAUT, FAMILLES_VEGETALES, type Voie } from '../../../src/domain/hopIndex/v4/voies';

const CLE = (id: string) => `beermaverick-${id}`;
const table = JSON.parse(readFileSync(join(process.cwd(), 'src', 'data', 'hopV4', 'typicite-styles.json'), 'utf8')) as TableTypicite;
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
/** Sa neipa saturée (22A) : Lotus 78 g à 15′ et 144 g au dry hop actif. */
const SATUREE: Recipe = { name: 'neipa saturée', styleCode: '22A', volumeL: 24, og: 1.081, boilMin: 60, yeastId: 'lalbrew-verdant-ipa', ebc: 7,
  additions: [{ id: 'a1', hopKey: CLE('lotus'), moment: 'b15', grams: 78 }, { id: 'a2', hopKey: CLE('lotus'), moment: 'dryActive', grams: 144 }] };
const GRAND = { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['dryActive'] } as const;
/** Un dry hop actif à 6 g/L (144 g sur 24 L) pour chaque houblon : la dose ne peut pas éviter l'excès. */
const DRY6 = { ...GRAND, dryHop: { doseGL: 6 } } as const;
const ajouts = (vs: Voie[]) => vs.filter((v) => v.type === 'ajouter' && v.actions.length === 1);
const veg = (v: Voie) => v.styleOverflow.filter((o) => (FAMILLES_VEGETALES as readonly string[]).includes(o.family));
/** Les crans d'herbacé / de végétal qui comptent (ni voulus, ni minuscules). */
const cranVeg = (v: Voie) => veg(v).filter((o) => !o.voulu && !o.minuscule).reduce((s, o) => s + o.crans, 0);
const rangDe = (v: Voie) => v.overflowRang ?? v.overflowTotal;
const actif = (vs: Voie[], id: string) => vs.find((v) => v.actions[0].hopKey === CLE(id))!;

beforeAll(() => poserTypicite(table));
afterAll(() => poserTypicite(null));

describe('h1 : l\'excès d\'herbacé ou de végétal d\'un style qui n\'en dit rien est un défaut', () => {
  it('la règle est le défaut ; elle ne vise que l\'herbacé et le végétal', () => {
    expect(DEFAUT_VEGETAL_DEFAUT).toBe(true);
    expect([...FAMILLES_VEGETALES]).toEqual(['herbal', 'green']);
  });

  it('dry hop à 6 g/L sur la neipa saturée : l\'herbacé de Strata sort de la bande (famille neutre) ; la règle le marque et l\'ajoute au rang et au choix de la dose', () => {
    const c = actif(m.proposeVoies(SATUREE, { citrus: 2 }, DRY6).dryHop!.actif, 'strata');
    const avant = actif(m.proposeVoies(SATUREE, { citrus: 2 }, { ...DRY6, defautVegetal: false }).dryHop!.actif, 'strata');
    const h = c.styleOverflow.find((o) => o.family === 'herbal')!;
    expect(h.status).toBe('neutre'); // honnête : le style n'en dit rien
    expect(h.crans).toBeGreaterThan(1);
    expect(h.defaut).toBe(true);
    expect(rangDe(c) - rangDe(avant)).toBeCloseTo(h.crans, 2); // son herbacé entre au rang (Strata le marque : la moitié de ses fiches le citent)
    expect((c.overflowStyle ?? c.overflowTotal) - (avant.overflowStyle ?? avant.overflowTotal)).toBeCloseTo(h.crans, 2);
  });

  it('au rang, un houblon dont les fiches ne marquent pas l\'herbacé n\'est pas puni pour lui (g2d : seules les familles marquées comptent au dry hop) ; l\'excès reste dit', () => {
    const c = actif(m.proposeVoies(SATUREE, { citrus: 2 }, DRY6).dryHop!.actif, 'ahtanum');
    expect(c.styleOverflow.find((o) => o.family === 'herbal')!.defaut).toBe(true);
    expect(rangDe(c)).toBe(0);
  });

  it('liste principale : la dose d\'Ahtanum est choisie pour ne pas faire sortir l\'herbacé de la bande (144 g avant, moins ensuite), et la tête n\'en sort pas', () => {
    const apres = ajouts(m.proposeVoies(SATUREE, { citrus: 2 }, GRAND).voies), avant = ajouts(m.proposeVoies(SATUREE, { citrus: 2 }, { ...GRAND, defautVegetal: false }).voies);
    expect(actif(avant, 'ahtanum').actions[0].grams).toBe(144);
    expect(cranVeg(actif(avant, 'ahtanum'))).toBeGreaterThan(1); // HEAD : 1,5 cran d'herbacé hors de la bande, sans que rien ne freine
    expect(actif(apres, 'ahtanum').actions[0].grams).toBeLessThan(144);
    expect(cranVeg(actif(apres, 'ahtanum'))).toBeLessThanOrEqual(0.25);
    for (const v of apres.sort((a, b) => a.rank - b.rank).slice(0, 8)) expect(cranVeg(v), v.id).toBeLessThanOrEqual(0.25);
  });

  it('la demande prime (s3 R1) : si le brasseur demande plus d\'herbacé, l\'excès d\'herbacé est sa demande, pas un défaut compté ; le végétal qu\'il n\'a pas demandé, lui, l\'est', () => {
    const c = actif(m.proposeVoies(SATUREE, { herbal: 2 }, DRY6).dryHop!.actif, 'ahtanum');
    const h = c.styleOverflow.find((o) => o.family === 'herbal')!;
    expect(h.voulu).toBe(true);
    const g = c.styleOverflow.find((o) => o.family === 'green')!;
    expect(g.defaut).toBe(true);
    expect(g.voulu).toBeUndefined();
    const auRang = c.styleOverflow.filter((o) => (o.status !== 'neutre' || o.defaut) && !o.voulu && !o.minuscule).reduce((s, o) => s + o.crans, 0);
    expect(rangDe(c)).toBeLessThanOrEqual(auRang + 1e-9);
    expect(auRang).toBeLessThan(c.styleOverflow.reduce((s, o) => s + o.crans, 0)); // l'herbacé voulu n'y est pas
  });

  it('un style qui attend l\'herbacé (1A, bande 0–30) garde sa bande : l\'herbacé n\'est jamais marqué `defaut`, le végétal neutre du même style, si', () => {
    const lager: Recipe = { ...SATUREE, styleCode: '1A', og: 1.040, name: 'lager' };
    const vs = m.proposeVoies(lager, { citrus: 2 }, DRY6).dryHop!.actif; // 6 g/L : l'herbacé (≈ 45 pts) sort de la bande 0–30 ; 3A (0–68) n'en sort pas, même à 12 g/L
    const herbal = vs.flatMap((v) => v.styleOverflow.filter((o) => o.family === 'herbal'));
    expect(herbal.length).toBeGreaterThan(0);
    for (const o of herbal) { expect(o.status).toBe('attendue'); expect(o.defaut).toBeUndefined(); }
    expect(vs.flatMap((v) => v.styleOverflow.filter((o) => o.family === 'green' && o.defaut)).length).toBeGreaterThan(0);
  });

  it('les AUTRES familles neutres restent sous a4 (D125) : la poire d\'El Dorado est dite, jamais marquée `defaut`, jamais au rang', () => {
    const ed = actif(ajouts(m.proposeVoies(SATUREE, { citrus: 1 }, GRAND).voies), 'el-dorado');
    const poire = ed.styleOverflow.find((o) => o.family === 'pomeFruit' && o.status === 'neutre');
    expect(poire).toBeDefined();
    expect(poire!.defaut).toBeUndefined();
    const compte = ed.styleOverflow.filter((o) => (o.status !== 'neutre' || o.defaut) && !o.voulu && !o.minuscule).reduce((s, o) => s + o.crans, 0);
    expect(rangDe(ed)).toBeLessThanOrEqual(compte + 1e-9);
  });

  it('le rang ne lit du neutre que l\'herbacé et le végétal, à aucun moment ni pour aucune demande', () => {
    for (const [r, dir] of [[SATUREE, { citrus: 2 }], [SATUREE, { tropical: 2 }], [{ ...SATUREE, styleCode: '16D' }, { floral: 1 }]] as const) {
      const vs = m.proposeVoies(r, dir, { ...GRAND, moments: ['b10', 'wp', 'dryActive'] }).voies;
      for (const v of vs) {
        const compte = v.styleOverflow.filter((o) => o.status !== 'neutre' || o.defaut).reduce((s, o) => s + o.crans, 0);
        expect(rangDe(v), v.id).toBeLessThanOrEqual(compte + 1e-9);
      }
    }
  });

  it('`defautVegetal: false` rend l\'ordre d\'avant : aucune marque, l\'herbacé neutre hors du rang', () => {
    const c = actif(m.proposeVoies(SATUREE, { citrus: 2 }, { ...DRY6, defautVegetal: false }).dryHop!.actif, 'ahtanum');
    expect(veg(c).length).toBeGreaterThan(0);
    expect(veg(c).some((o) => o.defaut)).toBe(false);
    expect(rangDe(c)).toBe(0);
  });
});
