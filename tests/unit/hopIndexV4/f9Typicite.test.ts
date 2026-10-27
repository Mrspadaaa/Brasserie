// Voie f9 (D191, D120) : la typicité du style (Beer Analytics, table dérivée) et l'intensité de la variété dans l'effet (A3), deux OPTIONS de proposeVoies.
// Défaut éteint : la sortie est celle d'avant, à l'octet près. La typicité est un terme du rang, jamais un filtre ; l'inconnu n'est jamais 0.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CATALOGUE } from '../../../src/domain/hopIndex/v4/data';
import { cleDeVoie, cleHoublon, ETAPES } from '../../../src/domain/hopIndex/v4/departage';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import type { Recipe } from '../../../src/domain/hopIndex/v4/recipe';
import { INTENSITE_DEFAUT, TYPICITE_DEFAUT } from '../../../src/domain/hopIndex/v4/voies';
import { PENTE_INTENSITE, RADAR_NEUTRE, facteurIntensite, poserTypicite, typiciteDe, typiciteDeVoie, type TableTypicite } from '../../../src/domain/hopIndex/v4/typicite';
// @ts-expect-error module .mjs sans types : le générateur de la table
import { calculer } from '../../../scripts/collecte-hop/typicite-styles.mjs';

const CLE = (id: string) => `beermaverick-${id}`;
const FICHIER = join(process.cwd(), 'src', 'data', 'hopV4', 'typicite-styles.json');
const table = JSON.parse(readFileSync(FICHIER, 'utf8')) as TableTypicite;
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const R22A: Recipe = { name: 'neipa v3', styleCode: '22A', volumeL: 24, og: 1.081, boilMin: 60, yeastId: 'lalbrew-verdant-ipa', ebc: 7, additions: [{ id: 'a1', hopKey: CLE('lotus'), moment: 'b30', grams: 84 }] };
const OPTS = { maxBuy: 80, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['dryActive' as const] };

beforeAll(() => poserTypicite(table));
afterAll(() => poserTypicite(null));

describe('la table de typicité (D120)', () => {
  it('est la sortie du script rejouable, sa source et sa licence dans l\'en-tête', () => {
    expect(JSON.stringify(calculer()) + '\n').toBe(readFileSync(FICHIER, 'utf8'));
    expect(table.source.licence).toBe('CC BY-SA 4.0');
    expect(table.source.nom).toBe('Beer Analytics');
  });
  it('Citra et Mosaic sont typés en 22A ; un noble ou un houblon absent est inconnu, jamais 0', () => {
    expect(typiciteDe(CLE('citra'), '22A').palier).toBe(3);
    expect(typiciteDe(CLE('mosaic'), '22A').palier).toBe(3);
    const saaz = typiciteDe(CLE('saaz-cz'), '22A'); // rattachement ambigu : absent de la table
    expect(saaz.palier).toBeNull();
    expect(saaz.part).toBeNull();
    expect(saaz.raison).toMatch(/absent de Beer Analytics/);
    expect(typiciteDe(CLE('houblon-qui-n-existe-pas'), '22A').palier).toBeNull();
  });
  it('lit les styles voisins (21A, 21C) à moitié poids, et la concentration dans la famille IPA', () => {
    const ed = typiciteDe(CLE('el-dorado'), '22A'); // 3,3 % des recettes de Double IPA ; 13,3 % de Hazy IPA ; 38 % de ses recettes sont des IPA
    expect(ed.part).toBeCloseTo(0.0665, 3);
    expect(ed.origine).toBe('voisin');
    expect(ed.concentration).toBeGreaterThan(0.3);
    expect(ed.palier).toBe(3);
  });
  it('Citra et Citra cryo ont la même typicité (la variété) : un palier, pas une part brute qui les placerait toujours en tête', () => {
    const c = typiciteDe(CLE('citra'), '22A'), mo = typiciteDe(CLE('mosaic'), '22A');
    expect(c.palier).toBe(mo.palier); // Citra (35 % des recettes) et Mosaic (15 %) : même palier
  });
  it('un échantillon mince n\'est pas classé (Ahhhroma, 11 recettes) ; un style sans donnée est inconnu', () => {
    expect(typiciteDe(CLE('ahhhroma'), '22A').concentration).toBeNull();
    expect(typiciteDe(CLE('citra'), 'ZZ9').palier).toBeNull();
    expect(typiciteDe(CLE('citra'), '22A', null).raison).toMatch(/non chargée/);
  });
  it('la voie sans ajout qui monte est neutre (null) ; un ajout inconnu rend la voie inconnue', () => {
    expect(typiciteDeVoie([], '22A')).toBeNull();
    expect(typiciteDeVoie([{ varietyId: CLE('saaz-cz'), poids: 1 }], '22A')!.palier).toBeNull();
  });
});

describe('la clé k3k1t (typicité entre la famille citée et le radar)', () => {
  it('ajoute une étape, nommée, et range le typé devant l\'inconnu', () => {
    expect(ETAPES.k3k1t).toHaveLength(ETAPES.k3k1.length + 1);
    expect(ETAPES.k3k1t[1]).toMatch(/typicité/);
    const a = cleHoublon('k3k1t', CLE('mosaic'), 'citrus', '22A'), b = cleHoublon('k3k1t', CLE('saaz-cz'), 'citrus', '22A');
    expect(a.cle[1]).toBe(3);
    expect(b.cle[1]).toBeNull();
    expect(a.origine[1]).toMatch(/recettes/);
    expect(cleDeVoie('k3k1t', [{ varietyId: CLE('mosaic'), poids: 1 }], ['citrus'], '22A').cle).toHaveLength(ETAPES.k3k1t.length);
  });
});

describe('les options de proposeVoies (22A, sa recette)', () => {
  it('éteintes par défaut : le résultat est identique, à l\'octet près, à celui d\'avant', () => {
    expect(INTENSITE_DEFAUT).toBe(false);
    expect(TYPICITE_DEFAUT).toBe(false);
    const a = m.proposeVoies(R22A, { citrus: 1 }, OPTS), b = m.proposeVoies(R22A, { citrus: 1 }, { ...OPTS, intensite: false, typicite: false });
    expect(JSON.stringify(a.voies)).toBe(JSON.stringify(b.voies));
    expect(a.voies.every((v) => v.typicite === undefined && v.a3 === undefined)).toBe(true);
  });
  it('la typicité n\'exclut rien : les mêmes houblons, dans un autre ordre, et chaque voie porte sa typicité (ou null, dite)', () => {
    const sans = m.proposeVoies(R22A, { citrus: 1 }, OPTS), avec = m.proposeVoies(R22A, { citrus: 1 }, { ...OPTS, typicite: true });
    const ids = (r: typeof sans) => r.voies.filter((v) => v.type === 'ajouter').map((v) => v.id).sort();
    expect(ids(avec)).toEqual(ids(sans));
    const ajouts = avec.voies.filter((v) => v.type === 'ajouter');
    expect(ajouts.every((v) => v.typicite !== undefined)).toBe(true);
    expect(ajouts.some((v) => v.typicite?.palier === null && !!v.typicite.raison)).toBe(true); // l'inconnu est dit
    expect(avec.voies[0].departage?.mode).toBe('k3k1t');
  });
  it('A3 : le facteur de l\'intensité multiplie l\'effet (radar 5 : ×1,4 ; 3 : ×1 ; inconnu : ×1, dit)', () => {
    expect(facteurIntensite(CLE('citra'), 'citrus')).toEqual({ radar: 5, facteur: 1 + PENTE_INTENSITE * (5 - RADAR_NEUTRE) });
    expect(facteurIntensite(CLE('el-dorado'), 'citrus').facteur).toBe(1);
    expect(facteurIntensite(CLE('citra'), 'pomeFruit')).toEqual({ radar: null, facteur: 1 }); // pas d'axe de radar pour cette famille
    const base = m.proposeVoies(R22A, { citrus: 1 }, { ...OPTS, limit: 2000 }), a3 = m.proposeVoies(R22A, { citrus: 1 }, { ...OPTS, intensite: true });
    const de = (r: typeof base, id: string) => r.voies.find((v) => v.type === 'ajouter' && v.actions[0].hopKey === CLE(id))!;
    expect(de(a3, 'citra').effect.citrus.intensite).toEqual({ radar: 5, facteur: 1.4 });
    expect(de(base, 'citra').effect.citrus.intensite).toBeUndefined();
    // à dose égale, l'effet de Citra (radar 5) dépasse celui d'une variété à radar 2 (×0,8)
    expect(a3.voies.every((v) => v.a3 === true)).toBe(true);
  });
  it('A3 : une variété plus intense atteint la visée à une dose plus basse, et passe devant (le manque seul compte, puis les grammes)', () => {
    const r = m.proposeVoies(R22A, { citrus: 1 }, { ...OPTS, maxBuy: 400, intensite: true });
    const ajouts = r.voies.filter((v) => v.type === 'ajouter' && v.distance.total === 0);
    const radar = (v: (typeof ajouts)[number]) => facteurIntensite(v.actions[0].hopKey, 'citrus').radar;
    const forts = ajouts.filter((v) => radar(v) === 5), faibles = ajouts.filter((v) => radar(v) !== null && radar(v)! <= 2);
    expect(forts.length).toBeGreaterThan(0);
    expect(faibles.length).toBeGreaterThan(0);
    // à distance égale (la visée atteinte), les forts n'ont pas besoin de plus de houblon que les faibles, et passent devant
    expect(Math.max(...forts.map((v) => v.actions[0].grams))).toBeLessThanOrEqual(Math.min(...faibles.map((v) => v.actions[0].grams)));
    // (le débordement de style précède la distance : seul le meilleur des forts est comparé au meilleur des faibles)
    expect(Math.min(...forts.map((v) => r.voies.indexOf(v)))).toBeLessThan(Math.min(...faibles.map((v) => r.voies.indexOf(v))));
  });
});
