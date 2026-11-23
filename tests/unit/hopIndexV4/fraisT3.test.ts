// Voie t3 (31.10) : R4 lit l'emploi réel au frais (Beer Analytics, graphique « usage-types »), pas l'étiquette de Beer Maverick.
// Le brasseur : « Warrior, Columbus et Nugget en "mixte", pas en amérisants ??? Mais mixte veut aussi dire amérisant : le rôle d'un houblon n'est jamais vraiment totalement défini. »
// D'où : aucune étiquette (usage Beer Maverick, catégorie du site) et aucun seuil ; une valeur CONTINUE, la part au frais = (recettes Aroma + Dry Hop) ÷ (somme des recettes des cinq moments).
// Au whirlpool et au dry hop, plus un houblon est employé au frais, plus il passe devant ; sans donnée il est neutre (il vaut la médiane) ; jamais une exclusion.
// Rouge sur 4a752523 (R4 lisait `purpose === 'bittering'`, binaire) : ni `cleFrais`, ni `auFrais` dans la table ; vert ensuite.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CATALOGUE, STOCK } from '../../../src/domain/hopIndex/v4';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../../src/domain/hopIndex/v4/recipe';
import { poserTypicite, usageAuFrais, type TableTypicite } from '../../../src/domain/hopIndex/v4/typicite';
import { COUPURE_FRAIS, type Voie } from '../../../src/domain/hopIndex/v4/voies';

const CLE = (id: string) => `beermaverick-${id}`;
const table = JSON.parse(readFileSync(join(process.cwd(), 'src', 'data', 'hopV4', 'typicite-styles.json'), 'utf8')) as TableTypicite;
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const SATUREE: Recipe = { name: 'neipa v3', styleCode: '22A', volumeL: 24, og: 1.081, boilMin: 60, yeastId: 'lalbrew-verdant-ipa', ebc: 7,
  additions: [{ id: 'a1', hopKey: CLE('lotus'), moment: 'b15', grams: 78 }, { id: 'a2', hopKey: CLE('lotus'), moment: 'dryActive', grams: 144 }] };
const GRAND = { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: true, moments: ['dryActive'], typicite: true, intensite: false } as const;
const voies = (o: object = {}, r: Recipe = SATUREE) => m.proposeVoies(r, { citrus: 1 }, { ...GRAND, ...o }).voies.filter((v) => v.type !== 'levure');
const ajouts = (vs: Voie[]) => vs.filter((v) => v.type === 'ajouter' && v.actions.length === 1);
const idDe = (v: Voie) => v.actions[0].hopKey.replace(/^beermaverick-/, '');

beforeAll(() => poserTypicite(table));
afterAll(() => poserTypicite(null));

describe('t3 : la table porte la part au frais, continue et sans seuil', () => {
  it('auFrais : des parts entre 0 et 1, une médiane, aucun seuil ni étiquette', () => {
    const a = table.auFrais!;
    expect(a).toBeDefined();
    const parts = Object.values(a.parts).sort((x, y) => x - y);
    expect(parts.length).toBeGreaterThan(50);
    expect(parts.every((p) => p >= 0 && p <= 1)).toBe(true);
    expect(new Set(parts).size).toBeGreaterThan(parts.length * 0.8); // une valeur continue, pas deux classes
    const h = parts.length >> 1, med = parts.length % 2 ? parts[h] : (parts[h - 1] + parts[h]) / 2;
    expect(Math.abs(a.mediane - med)).toBeLessThan(1e-4);
    expect(Object.keys(a)).not.toContain('seuil');
    expect(a.minRecettes).toBe(1000);
  });
  it('la source et la licence sont dans l’en-tête de la table', () => {
    expect(table.source.licence).toBe('CC BY-SA 4.0');
    expect((table as unknown as { auFraisLecture: string }).auFraisLecture).toMatch(/usage-types/);
  });
  it('usageAuFrais : connu (part, médiane) ; inconnu = null, jamais 0 ; sans table, rien', () => {
    const w = usageAuFrais('beermaverick-warrior'), c = usageAuFrais('cashmere');
    expect(w && c).toBeTruthy();
    expect(w!.part).toBeLessThan(c!.part); // Warrior est employé moins souvent au frais que Cashmere
    expect(w!.mediane).toBe(table.auFrais!.mediane);
    expect(usageAuFrais('houblon-qui-n-existe-pas')).toBeNull();
    expect(usageAuFrais('warrior', null)).toBeNull();
    expect(usageAuFrais('warrior', { ...table, auFrais: undefined })).toBeNull();
  });
});

describe('t3 : R4 range par l’emploi au frais, en continu', () => {
  it('la clé d’un ajout au dry hop = médiane − part au frais ; absente (neutre) sans donnée ; absente hors whirlpool et dry hop', () => {
    const vs = ajouts(voies());
    const connus = vs.filter((v) => usageAuFrais(idDe(v)));
    expect(connus.length).toBeGreaterThan(5);
    for (const v of connus) expect(v.cleFrais ?? 0).toBeCloseTo(Math.round((table.auFrais!.mediane - usageAuFrais(idDe(v))!.part) * 1e4) / 1e4, 4);
    const inconnus = vs.filter((v) => !usageAuFrais(idDe(v)));
    expect(inconnus.length).toBeGreaterThan(0);
    expect(inconnus.every((v) => v.cleFrais === undefined && v.reculeUsage === undefined)).toBe(true); // l'inconnu ne recule pas
    const dix = ajouts(voies({ moments: ['b10'] }));
    expect(dix.length).toBeGreaterThan(0);
    expect(dix.every((v) => v.cleFrais === undefined)).toBe(true);
  });
  it('plus d’ajouts différents : la clé prend de nombreuses valeurs (continue), pas deux', () => {
    const cles = new Set(ajouts(voies()).map((v) => v.cleFrais ?? 0));
    expect(cles.size).toBeGreaterThan(10);
  });
  it('un assemblage : la clé est la moyenne pondérée par la dose', () => {
    const avecStock = creerMoteur({ catalogue: CATALOGUE, stock: STOCK }); // les assemblages se font avec le stock
    const a = avecStock.proposeVoies(SATUREE, { citrus: 1 }, { ...GRAND }).voies.find((v) => v.type === 'assemblage' && v.actions.length === 2 && v.actions.every((x) => usageAuFrais(x.hopKey)));
    expect(a).toBeDefined();
    const med = table.auFrais!.mediane, p = a!.actions.map((x) => ({ g: x.grams, k: med - usageAuFrais(x.hopKey)!.part }));
    const attendu = p.reduce((s, x) => s + x.g * x.k, 0) / p.reduce((s, x) => s + x.g, 0);
    expect(Math.abs((a!.cleFrais ?? 0) - attendu)).toBeLessThan(0.02); // le poids est la part de dose de la voie (arrondie)
  });
  it('à rang égal (famille citée et typicité), le plus employé au frais passe devant ; R4 ne réordonne jamais deux ajouts de rang de départage différent', () => {
    const avec = ajouts(voies()), sans = ajouts(voies({ usageAuFrais: false }));
    const idx = (vs: Voie[], v: Voie) => vs.findIndex((x) => x.id === v.id);
    const avant = COUPURE_FRAIS.k3k1t ?? 0;
    expect(avant).toBe(2);
    const prefixe = (v: Voie) => JSON.stringify(v.departage!.cle.slice(0, avant));
    let paires = 0;
    for (const x of avec) for (const y of avec) {
      if (x === y || x.distance.total !== y.distance.total || x.overflowRang !== y.overflowRang) continue;
      if (prefixe(x) !== prefixe(y)) { // R4 ne réordonne pas ce qu'une étape plus haute sépare
        expect(idx(avec, x) < idx(avec, y)).toBe(idx(sans, x) < idx(sans, y));
      } else if ((x.cleFrais ?? 0) < (y.cleFrais ?? 0)) { paires++; expect(idx(avec, x)).toBeLessThan(idx(avec, y)); }
    }
    expect(paires).toBeGreaterThan(5);
  });
  it('Warrior (7 % au frais) passe après Cascade, Centennial (38 et 41 %) à rang égal : c’est la part, pas une étiquette', () => {
    const vs = ajouts(voies()), i = (id: string) => vs.findIndex((v) => idDe(v) === id);
    expect(i('warrior')).toBeGreaterThan(-1);
    expect(i('cascade')).toBeLessThan(i('warrior'));
    expect(i('centennial')).toBeLessThan(i('warrior'));
    const sans = ajouts(voies({ usageAuFrais: false })), j = (id: string) => sans.findIndex((v) => idDe(v) === id);
    expect(j('warrior')).toBeLessThan(j('cashmere')); // avant : Warrior devant Cashmere (le radar Beer Maverick), alors que Cashmere est employé à 60 % au frais
    expect(i('cashmere')).toBeLessThan(i('warrior'));
  });
  it('jamais une exclusion : mêmes voies avec et sans R4 ; la raison écrite de celles qui reculent', () => {
    const avec = voies(), sans = voies({ usageAuFrais: false });
    expect(avec.map((v) => v.id).sort()).toEqual(sans.map((v) => v.id).sort());
    const recule = avec.filter((v) => (v.cleFrais ?? 0) > 0);
    expect(recule.length).toBeGreaterThan(0);
    expect(recule.every((v) => !!v.reculeUsage && /Beer Analytics/.test(v.reculeUsage) && /\d+ %/.test(v.reculeUsage) && /jamais écarté/.test(v.reculeUsage))).toBe(true);
    expect(avec.filter((v) => (v.cleFrais ?? 0) <= 0).every((v) => v.reculeUsage === undefined)).toBe(true);
    expect(sans.every((v) => v.cleFrais === undefined && v.reculeUsage === undefined)).toBe(true);
  });
  it('aucune étiquette : l’usage Beer Maverick (aroma, dual, bittering) ne change pas l’ordre', () => {
    const effacees = creerMoteur({ catalogue: CATALOGUE.map((c) => ({ ...c, purpose: null })), stock: [] });
    const a = voies().map((v) => v.id), b = effacees.proposeVoies(SATUREE, { citrus: 1 }, { ...GRAND }).voies.filter((v) => v.type !== 'levure').map((v) => v.id);
    expect(b).toEqual(a);
  });
  it('sans la part au frais dans la table (ancienne table, ou houblon hors Beer Analytics) : rien ne bouge', () => {
    poserTypicite({ ...table, auFrais: undefined });
    try {
      const sansPart = voies();
      expect(sansPart.every((v) => v.cleFrais === undefined && v.reculeUsage === undefined)).toBe(true);
      expect(sansPart.map((v) => v.id)).toEqual(voies({ usageAuFrais: false }).map((v) => v.id)); // l'ordre est celui d'avant t3, voie pour voie
    } finally { poserTypicite(table); }
  });
  it('au 60′ et pour diminuer ou augmenter : pas de clé (R4 ne lit que les ajouts au whirlpool et au dry hop)', () => {
    const soixante = m.proposeVoies({ ...SATUREE, additions: [{ id: 'a1', hopKey: CLE('lotus'), moment: 'b30', grams: 84 }] }, { citrus: 1 }, { ...GRAND, moments: ['b60'] }).voies;
    expect(soixante.some((v) => v.cleFrais !== undefined)).toBe(false);
  });
});
