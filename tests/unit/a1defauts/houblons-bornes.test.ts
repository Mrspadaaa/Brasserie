// Voie a1 (08.11) : défauts ouverts des houblons, étape 3. Fixtures simulées, aucune donnée réelle.
// MV-18, TE-21, TE-22, AM-14 à AM-19, BR-3, TE-26 : les moments et leurs bornes ; MV-22, BR-36, BR-37, BR-40 : le sélecteur ; M-3 : l'IBU sans grain mal placé.
import { describe, expect, it } from 'vitest';
import type { Fermentable, HopIngredient, Recipe } from '../../../src/types';
import type { HopVariety } from '../../../functions/src/hopIndexSchema';
import { BORNES, joursProgramme, messageEbullition, problemesLigneHoublon, saisieHoublonRetenue } from '../../../src/domain/bornesMetier';
import { recipeSaveIssues } from '../../../src/domain/recipeValidation';
import { hotBitterness } from '../../../src/domain/hopBitterness';
import { changerMoment, champsMomentNeuf } from '../../../src/domain/hopIndex/momentDefauts';
import { yeastRecipeBoilOg, yeastRecipeComputedOg } from '../../../src/domain/yeastProjection';
import { createSearch, runSearch } from '../../../src/services/search';
import { CLES_RECHERCHE, alphaDeReference, detailReference, optionsReference } from '../../../src/ui/hopIndex/pickerOptions';

const pale: Fermentable = { name: 'Pale Ale Malz', kind: 'grain', use: 'empatage', weightKg: 5, potentialPpg: 37, colorEbc: 6.5 };
const recette = (hops: HopIngredient[], extra: Partial<Recipe> = {}): Recipe =>
  ({ id: 'R', name: 'Pale', volumeL: 20, boilMin: 60, fermentables: [pale], hops, ...extra } as unknown as Recipe);
const houblon = (p: Partial<HopIngredient>): HopIngredient => ({ name: 'Citra', alpha: 12, weightG: 30, stage: 'boil', timeMin: 20, ...p } as HopIngredient);
const messages = (r: Recipe) => recipeSaveIssues(r).map((i) => i.message).join(' | ');

describe('MV-18, TE-21, BR-42 — un nombre négatif ne se retient pas', () => {
  it('α −2, −5 min, −1 g : rien n’est retenu ; 0 et les positifs passent ; la garde à froid reste permise', () => {
    expect(saisieHoublonRetenue({ alpha: -2 })).toEqual({});
    expect(saisieHoublonRetenue({ timeMin: -5 })).toEqual({});
    expect(saisieHoublonRetenue({ weightG: -1 })).toEqual({});
    expect(saisieHoublonRetenue({ alpha: 0, weightG: 30 })).toEqual({ alpha: 0, weightG: 30 });
    expect(saisieHoublonRetenue({ aromaTemperatureC: -1 })).toEqual({ aromaTemperatureC: -1 });
  });
  it('un α négatif déjà dans une recette est refusé à l’enregistrement, et l’IBU n’est pas calculé', () => {
    expect(messages(recette([houblon({ alpha: -2 })]))).toMatch(/Alpha de Citra/);
    expect(hotBitterness([houblon({ alpha: -2 })], 20, 1.05, 60).total).toBeNull();
  });
  it('α 150 % : refusé (au-delà de 100)', () => {
    expect(messages(recette([houblon({ alpha: 150 })]))).toMatch(/Alpha de Citra/);
  });
});

describe('TE-22, AM-14, AM-16 — le houblonnage à cru reste dans le programme', () => {
  const programme = [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 10 }, { kind: 'garde', name: 'Garde', tempC: 2, days: 4 }];
  it('le programme dure la somme des phases', () => {
    expect(joursProgramme(programme as never)).toBe(14);
    expect(joursProgramme([])).toBeNull();
  });
  it('un jour après la fin du programme, ou au-delà de 60 jours, est une erreur ; un jour dans le programme passe', () => {
    const ok = problemesLigneHoublon(houblon({ stage: 'dryHop', dayOffset: 12 }), { programmeJours: 14 });
    expect(ok).toEqual([]);
    expect(problemesLigneHoublon(houblon({ stage: 'dryHop', dayOffset: 20 }), { programmeJours: 14 })[0].message).toMatch(/après la fin du programme \(J\+14\)/);
    expect(problemesLigneHoublon(houblon({ stage: 'dryHop', dayOffset: 99 }), { programmeJours: 14 })[0].message).toMatch(/dépasse 60 jours/);
  });
  it('« contact 999 h à 99 °C » : deux erreurs, chacune sur son champ', () => {
    const p = problemesLigneHoublon(houblon({ stage: 'dryHop', dayOffset: 3, aromaContactHours: 999, aromaTemperatureC: 99 }));
    expect(p.map((x) => x.champ).sort()).toEqual(['contact', 'temp']);
  });
  it('la validation les remonte avec le champ de la ligne', () => {
    const r = recette([houblon({ stage: 'dryHop', dayOffset: 20, aromaContactHours: 5000, aromaTemperatureC: 400 })], { fermentation: programme as never });
    const champs = recipeSaveIssues(r).map((i) => i.field);
    expect(champs).toEqual(expect.arrayContaining(['wz-hop-day-0', 'wz-hop-contact-0', 'wz-hop-temp-0']));
  });
});

describe('AM-15 — la phase du dry hop ne contredit pas son jour', () => {
  it('« fermentation active » après la fin de la fermentation active, ou « après fermentation » à J0 : signalé', () => {
    const ctx = { programmeJours: 21, actifJours: 7 };
    expect(problemesLigneHoublon(houblon({ stage: 'dryHop', dayOffset: 12, aromaTiming: 'fermentation' }), ctx)[0].champ).toBe('phase');
    expect(problemesLigneHoublon(houblon({ stage: 'dryHop', dayOffset: 0, aromaTiming: 'postFermentation' }), ctx)[0].champ).toBe('phase');
    expect(problemesLigneHoublon(houblon({ stage: 'dryHop', dayOffset: 3, aromaTiming: 'fermentation' }), ctx)).toEqual([]);
    expect(problemesLigneHoublon(houblon({ stage: 'dryHop', dayOffset: 12, aromaTiming: 'postFermentation' }), ctx)).toEqual([]);
  });
});

describe('AM-17, AM-18 — un whirlpool a une durée et une température qui existent', () => {
  it('600 min ou 0 °C : l’IBU attend, avec sa raison ; 20 min à 80 °C se calcule', () => {
    const wp = (p: Partial<HopIngredient>) => houblon({ stage: 'whirlpool', timeMin: 20, tempC: 80, ...p });
    expect(hotBitterness([wp({})], 20, 1.05, 60).total).toBeGreaterThan(0);
    expect(hotBitterness([wp({ timeMin: 600 })], 20, 1.05, 60).total).toBeNull();
    expect(hotBitterness([wp({ tempC: 0 })], 20, 1.05, 60).total).toBeNull();
    expect(messages(recette([wp({ timeMin: 600 })]))).toMatch(/whirlpool de 600 min dépasse 180 min/);
    expect(messages(recette([wp({ tempC: 20 })]))).toMatch(/de 40 à 100 °C/);
    expect(BORNES.whirlpoolTempC.source).toMatch(/Estimée/);
  });
});

describe('AM-19 — l’ébullition de la recette', () => {
  it('1 440 min : erreur de saisie ; 0 min : les houblons d’ébullition et de premier moût n’ont pas d’IBU, dit', () => {
    expect(messageEbullition(1440)).toMatch(/au-delà de 240 min/);
    expect(messageEbullition(60)).toBeNull();
    expect(messages(recette([houblon({})], { boilMin: 1440 }))).toMatch(/au-delà de 240 min/);
    expect(hotBitterness([houblon({ stage: 'firstWort', timeMin: undefined })], 20, 1.05, 0).total).toBeNull();
    expect(messages(recette([houblon({ stage: 'firstWort', timeMin: undefined })], { boilMin: 0 }))).toMatch(/sans ébullition/);
    // Un seul whirlpool, sans ébullition : pas de faux blocage.
    expect(messages(recette([houblon({ stage: 'whirlpool', timeMin: 20, tempC: 80 })], { boilMin: 0 }))).not.toMatch(/sans ébullition/);
  });
});

describe('BR-3, TE-26 — changer de moment pose les champs du nouveau moment', () => {
  const h = houblon({ stage: 'boil', timeMin: 60 });
  it('ébullition → whirlpool : 20 min à 80 °C, jamais « durée 60 min » ; retour : la durée d’ébullition de la recette', () => {
    const wp = changerMoment(h, 'whirlpool', 60);
    expect(wp).toMatchObject({ stage: 'whirlpool', timeMin: 20, tempC: 80 });
    const retour = changerMoment(wp, 'boil', 60);
    expect(retour).toMatchObject({ stage: 'boil', timeMin: 60 });
    expect(retour.tempC).toBeUndefined();
  });
  it('à cru : un jour, ni durée ni température d’ébullition ; premier moût : aucun champ', () => {
    const cru = changerMoment(h, 'dryHop', 60);
    expect(cru).toMatchObject({ stage: 'dryHop', dayOffset: 3 });
    expect(cru.timeMin).toBeUndefined();
    expect(changerMoment(h, 'firstWort', 60).timeMin).toBeUndefined();
    expect(champsMomentNeuf('boil', 0)).toEqual({ timeMin: undefined });
  });
});

describe('M-3 — un grain à « J+ » ne double pas l’IBU', () => {
  it('Pale + Caramünch passé en fermentation J+3 : la DI d’ébullition et l’IBU sont ceux du Pale seul', () => {
    const cara: Fermentable = { name: 'Caramünch Typ 2', kind: 'grain', use: 'fermentation', dayOffset: 3, weightKg: 1, potentialPpg: 34, colorEbc: 120 };
    const seul = { fermentables: [pale], volumeL: 20, efficiencyPct: 75 };
    const avec = { fermentables: [pale, cara], volumeL: 20, efficiencyPct: 75 };
    const og = (r: typeof seul) => yeastRecipeComputedOg(r)!;
    expect(og(avec)).toBeCloseTo(og(seul), 6);
    const boil = (r: typeof seul) => yeastRecipeBoilOg(r, { og: og(r) }).og;
    expect(boil(avec)).toBeCloseTo(boil(seul)!, 6);
    const ibu = (r: typeof seul) => hotBitterness([houblon({ timeMin: 60 })], 20, boil(r), 60).total;
    expect(ibu(avec)).toBeCloseTo(ibu(seul)!, 6);
  });
});

// ------------------------------------------------------------------------------------------------------------ le sélecteur
const variete = (id: string, name: string, extra: Partial<HopVariety> = {}): HopVariety => ({
  id, name, aliases: [], form: 'unknown', descriptions: [], analysis: [], ...extra,
} as HopVariety);
const source = { title: 'Fiche', author: 'Hopsteiner', year: 2024, kind: 'manufacturer', reference: 'x' } as const;
const alpha = (min: number, max: number) => ({ analyte: 'alpha', unit: 'percentMass', basis: 'asIs', kind: 'range', range: { min, max }, source, confidence: 'medium' }) as never;
const catalogue = [
  variete('a', 'Altus', { analysis: [alpha(15, 17)] }),
  variete('c', 'Citra', { aliases: ['HBC 394'], analysis: [alpha(11, 13)], descriptions: [{ text: 'Agrumes, fruit tropical', context: 'rawHop', source }] }),
  variete('d', 'Cascade', { analysis: [alpha(4.5, 7)] }),
  variete('e', 'Cashmere'), variete('f', 'Comet'), variete('g', 'Calypso'), variete('h', 'El Dorado'),
];

describe('MV-22, BR-36 — taper « Citra » propose Citra d’abord', () => {
  it('la recherche ne lit que le nom et les alias : Citra est premier, Altus absent', () => {
    const opts = optionsReference(catalogue, () => 'Catalogue');
    const fuse = createSearch(opts, CLES_RECHERCHE as string[]);
    const res = runSearch(fuse, 'Citra').map((o) => o.label);
    expect(res[0]).toBe('Citra');
    expect(res).not.toContain('Altus');
    expect(runSearch(fuse, 'hbc 394')[0].label).toBe('Citra');
  });
});

describe('BR-37, BR-40 — la liste dit l’α et les arômes, à la virgule', () => {
  it('α publié en plage ou en valeur, virgule française ; absent : « α non publié », jamais 0', () => {
    expect(alphaDeReference(catalogue[2])).toBe('4,5–7 % AA');
    expect(alphaDeReference(catalogue[0])).toBe('15–17 % AA');
    expect(alphaDeReference(catalogue[3])).toBeNull();
    expect(detailReference(catalogue[3])).toMatch(/^α non publié/);
  });
  it('le détail met l’α et les arômes avant la provenance', () => {
    const d = detailReference(catalogue[1]);
    expect(d.indexOf('11–13 % AA')).toBe(0);
    expect(d.indexOf('Agrumes')).toBeGreaterThan(0);
    expect(d.indexOf('Agrumes')).toBeLessThan(d.indexOf('Hopsteiner'));
  });
});
