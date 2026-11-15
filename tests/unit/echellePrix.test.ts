import { describe, expect, it } from 'vitest';
import { scaleLog } from 'd3-scale';
import { KXC_DOMAINE, KXC_GRADUATIONS, domaineKxc, domaineReel, echelleLog, ecartPx, graduationsLog } from '../../src/domain/tarifs/echellePrix';

/**
 * La fixture de la maquette kxc (work/missions/2026-11-14-atelier/v1/couv/kxa/build.mjs, FIX) : 30 clients, 10 lieux, 49 prix ;
 * [pour qui, genre, bière, format, prix | null]. Exemples, jamais des données réelles.
 */
const VOLS = { fut: 20, growler: 2, carton: 3.96, bout: 0.33, verre: 0.3 } as const;
type K = keyof typeof VOLS;
const FIX: [string, string, string, K, number | null][] = [
  ['Café du Commerce', 'bistrot', 'Blonde', 'fut', 140], ['Bistrot de la Gare', 'bistrot', 'Blonde', 'fut', 140],
  ['Le Cheval Blanc', 'restaurant', 'Ambrée', 'fut', 140], ['Café de la Poste', 'bistrot', 'Blanche', 'fut', 140],
  ['Brasserie du Lac', 'restaurant', 'Blonde', 'fut', 140], ['Pinte des Vignerons', 'bistrot', 'Ambrée', 'fut', 140],
  ['Bar Le Phare', 'bistrot', 'Blanche', 'fut', 141], ['Auberge communale', 'restaurant', 'Blonde', 'fut', 142],
  ['Hôtel de Ville', 'restaurant', 'Ambrée', 'fut', 150], ['Le Tilleul', 'restaurant', 'Blanche', 'fut', 150],
  ['Buvette du FC', 'bistrot', 'Blonde', 'fut', 150], ['Café du Commerce', 'bistrot', 'IPA', 'fut', 160],
  ['Bar Le Phare', 'bistrot', 'IPA', 'fut', 160], ['Famille Rochat', 'particulier', 'Blonde', 'fut', 170],
  ['Désalpe de Charmey', 'lieu', 'Blonde', 'fut', 115],
  ['Marc Python', 'particulier', 'IPA', 'growler', 18], ['Julie Favre', 'particulier', 'Blonde', 'growler', 18],
  ['Magasin à la ferme', 'lieu', 'Blanche', 'growler', 18], ['Marché du samedi', 'lieu', 'Ambrée', 'growler', 18],
  ['Portes ouvertes', 'lieu', 'Blonde', 'growler', 18], ['Thomas Meier', 'particulier', 'IPA', 'growler', 19],
  ['Sandra Pittet', 'particulier', 'Blanche', 'growler', 20], ['Fête des vendanges', 'lieu', 'IPA', 'growler', null],
  ['Cave du Bourg', 'cave', 'Blonde', 'carton', 38], ['La Cave à Bières', 'cave', 'IPA', 'carton', 46],
  ['Épicerie Bio Clémentine', 'épicerie', 'Blanche', 'carton', 40], ['Marché de Noël', 'lieu', 'Blonde', 'carton', 38],
  ['Pierre Morand', 'particulier', 'Ambrée', 'carton', 42], ['Vins & Malts', 'cave', 'Ambrée', 'carton', 41.5],
  ['Salon Bières Suisses', 'lieu', 'IPA', 'carton', 47], ['Julie Favre', 'particulier', 'Blonde', 'carton', 40],
  ['Cave Saint-Martin', 'cave', 'Blanche', 'carton', null],
  ['Épicerie du Village', 'épicerie', 'Blonde', 'bout', 3.5], ['Chez Mme Ruffieux', 'épicerie', 'Blanche', 'bout', 3.6],
  ['Volg Corcelles', 'épicerie', 'Blonde', 'bout', 3.5], ['Épicerie fine Bonvin', 'épicerie', 'Ambrée', 'bout', 3.8],
  ['Laiterie de Vers-chez-Perrin', 'épicerie', 'Blonde', 'bout', 3.4], ['Le Petit Marché', 'épicerie', 'IPA', 'bout', 4.2],
  ['Magasin à la ferme', 'lieu', 'Blonde', 'bout', 3], ['Épicerie Cuche', 'épicerie', 'Blanche', 'bout', null],
  ['Restaurant du Pont', 'restaurant', 'IPA', 'bout', null],
  ['Fête de village', 'lieu', 'Blonde', 'verre', 6], ['Marché de Noël', 'lieu', 'Ambrée', 'verre', 6],
  ['Open air du lac', 'lieu', 'Blanche', 'verre', 6], ['Marché du samedi', 'lieu', 'Blonde', 'verre', 6],
  ['Portes ouvertes', 'lieu', 'IPA', 'verre', 5.5], ['Désalpe de Charmey', 'lieu', 'Ambrée', 'verre', 5],
  ['Festival Rock’n’Malt', 'lieu', 'IPA', 'verre', 6.5], ['Salon Bières Suisses', 'lieu', 'Blonde', 'verre', 6.5],
];
const REF_BLONDE = 3.5 / 0.33; // Blonde 33 cl fixée dans Clients
const REV_BLONDE = 4.8; // revient d'exemple au litre
/** Le cadre mobile de la maquette : 340 px, tracé de 46 à W − 16. */
const W = 340, X0 = 46, X1 = W - 16;
const PAIRES: [K, number, number, string][] = [['fut', 140, 142, 'Fût 140 / 142'], ['bout', 3.4, 3.5, 'Bouteille 3,40 / 3,50'], ['carton', 38, 40, 'Carton 38 / 40'], ['fut', 140, 150, 'Fût 140 / 150']];
const blonde = FIX.filter(([, , b, , p]) => b === 'Blonde' && p != null).map(([, , , k, p]) => (p as number) / VOLS[k]);

describe('fixture de kxc', () => {
  it('compte 30 clients, 10 lieux, 49 prix', () => {
    expect(FIX).toHaveLength(49);
    expect(new Set(FIX.filter((f) => f[1] !== 'lieu').map((f) => f[0])).size).toBe(30);
    expect(new Set(FIX.filter((f) => f[1] === 'lieu').map((f) => f[0])).size).toBe(10);
  });
});

describe('echelleLog', () => {
  it('suit la formule de d3 scaleLog', () => {
    const e = echelleLog(4.5, 23, X0, X1);
    const d3 = scaleLog().domain([4.5, 23]).range([X0, X1]);
    for (const v of [4.5, 5, 7.25, 10.6, 21.67, 23]) expect(e.x(v)).toBeCloseTo(d3(v), 9);
  });
  it('rend les graduations de kxc sur 4,5 – 23', () => {
    expect(echelleLog(...KXC_DOMAINE, X0, X1).graduations).toEqual(KXC_GRADUATIONS);
  });
  it('écarte toujours deux graduations de 20 px au moins, à 340 et à 790 px', () => {
    for (const [lo, hi, w] of [[4.5, 23, 340], [2, 60, 340], [5.1, 6.3, 340], [4.5, 23, 790]] as const) {
      const e = echelleLog(lo, hi, X0, w - 16);
      expect(e.graduations.length).toBeGreaterThan(1);
      e.graduations.slice(1).forEach((g, i) => expect(e.x(g) - e.x(e.graduations[i])).toBeGreaterThanOrEqual(20));
    }
  });
  it('refuse un domaine nul ou négatif', () => {
    expect(() => echelleLog(0, 10, 0, 100)).toThrow();
    expect(() => echelleLog(5, 5, 0, 100)).toThrow();
  });
  it('graduationsLog ne sort pas du domaine', () => {
    const e = echelleLog(6.2, 9.1, 0, 300);
    expect(graduationsLog(6.2, 9.1, e.x).every((g) => g >= 6.2 && g <= 9.1)).toBe(true);
  });
});

describe('domaines', () => {
  it('kxc garde 4,5 – 23 quand les prix y tiennent, s’élargit sinon (aucun point hors cadre)', () => {
    expect(domaineKxc(blonde)).toEqual([4.5, 23]);
    const [lo, hi] = domaineKxc([3.2, 30]);
    expect(lo).toBeLessThan(3.2);
    expect(hi).toBeGreaterThan(30);
  });
  it('le réel serre sur min et max, petite marge, inconnu ignoré (jamais 0)', () => {
    const [lo, hi] = domaineReel([...blonde, null, undefined, 0, REF_BLONDE, REV_BLONDE]);
    expect(lo).toBeLessThan(REV_BLONDE);
    expect(lo).toBeGreaterThan(4.5);
    expect(hi).toBeGreaterThan(6.5 / 0.3);
    // Constat : avec le revient et la marge, la plage réelle de la Blonde retombe sur celle de kxc (4,52 – 23,01).
    expect(hi).toBeLessThan(23.1);
    const [plo, phi] = domaineReel([5.6, 5.9]);
    expect(plo).toBeLessThan(5.6);
    expect(phi).toBeGreaterThan(5.9);
  });
});

/**
 * La mesure de la voie (VOIE port-kxc) : écart en px des paires de la NOTE de kxc, cadre 340 px, Blonde.
 * kxc d'origine (4,5 – 23) contre la plage réelle (prix de la Blonde, référence et revient compris : ils sont sur l'axe).
 * Règle de décision : le réglage est pris s'il écarte ×1,5 au moins sur deux paires.
 */
describe('mesure kxc contre réglée', () => {
  const kxc = echelleLog(...domaineKxc([...blonde, REF_BLONDE, REV_BLONDE]), X0, X1);
  const reglee = echelleLog(...domaineReel([...blonde, REF_BLONDE, REV_BLONDE]), X0, X1);
  // Variante plus serrée, pour la mesure seulement : les prix seuls (le revient sortirait du cadre, à gauche).
  const prixSeuls = echelleLog(...domaineReel(blonde), X0, X1);
  const lignes = PAIRES.map(([k, a, b, nom]) => {
    const o = ecartPx(kxc, a / VOLS[k], b / VOLS[k]), r = ecartPx(reglee, a / VOLS[k], b / VOLS[k]), s = ecartPx(prixSeuls, a / VOLS[k], b / VOLS[k]);
    return { nom, kxc: +o.toFixed(1), reglee: +r.toFixed(1), facteur: +(r / o).toFixed(2), seuls: +s.toFixed(1), facteurSeuls: +(s / o).toFixed(2) };
  });
  it('retrouve les écarts de la NOTE de kxc (2,4 · 4,9 · 8,7 · 11,8 px)', () => {
    expect(lignes.map((l) => l.kxc)).toEqual([2.4, 4.9, 8.7, 11.8]);
  });
  it('tableau et décision', () => {
    console.log(`MESURE domaine réglé ${reglee.lo.toFixed(2)} – ${reglee.hi.toFixed(2)} CHF/L`);
    console.log(`MESURE domaine prix seuls ${prixSeuls.lo.toFixed(2)} – ${prixSeuls.hi.toFixed(2)} CHF/L`);
    for (const l of lignes) console.log(`MESURE ${l.nom} : kxc ${l.kxc} px · réglée ${l.reglee} px · ×${l.facteur} · prix seuls ${l.seuls} px · ×${l.facteurSeuls}`);
    expect(lignes.filter((l) => l.facteurSeuls >= 1.5)).toHaveLength(0);
    const gagnantes = lignes.filter((l) => l.facteur >= 1.5).length;
    console.log(`MESURE paires à ×1,5 ou plus : ${gagnantes} → ${gagnantes >= 2 ? 'réglée' : 'kxc'}`);
    // La plage réelle de la Blonde (5,75 à 21,7 CHF/L, revient à 4,80) couvre déjà presque tout 4,5 – 23 : le gain plafonne à ~×1,1.
    expect(gagnantes).toBeLessThan(2);
  });
});
