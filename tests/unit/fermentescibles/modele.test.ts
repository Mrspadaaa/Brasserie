import { describe, expect, it } from 'vitest';
import type { Fermentable, StockItem } from '../../../src/types';
import {
  chercher, cran, cranPas, decouper, kgPourPart, kgTxt, lireAjout, lit, nomPossible, nu, partN, pas, pmax, rang,
} from '../../../src/ui/fermentescibles/modele';
import { apercuMalts, fermentablesApercu, stockApercu } from '../../../src/ui/fermentescibles/apercuDev';

const stock = stockApercu();
const grain = stock.filter((a) => ['Malt', 'Céréale'].includes(a.category));
const ligne = (f: Fermentable, i: number) => ({ f, i });
const base = fermentablesApercu('');
const lignesGrain = base.map(ligne);

describe('formats et crans de la masse', () => {
  it('écrit la masse comme la maquette', () => {
    expect(kgTxt(5)).toBe('5,0');
    expect(kgTxt(0.3)).toBe('0,30');
    expect(kgTxt(0)).toBe('0');
    expect(kgTxt(15.17)).toBe('15,17');
  });
  it('lit un nombre tapé, jamais 0 à la place de rien', () => {
    expect(lit('2,5')).toBe(2.5);
    expect(lit('2.5 kg')).toBe(2.5);
    expect(lit('')).toBeNull();
    expect(lit('abc')).toBeNull();
  });
  it('un cran fait 50 g sous 1 kg et 100 g au-dessus', () => {
    expect(pas(0.4, 1)).toBe(0.45);
    expect(pas(1, 1)).toBe(1.1);
    expect(pas(5, 1)).toBe(5.1);
    expect(pas(5, -1)).toBe(4.9);
    expect(pas(0, -1)).toBe(0);
    expect(cran(0.37)).toBe(0.35);
    expect(cran(7.04)).toBe(7);
    expect(cranPas(0.4, 1)).toBeCloseTo(0.45, 6);
    expect(cranPas(5.05, 1)).toBeCloseTo(5.1, 6);
  });
  it('la plage de la piste : 0 à 2 kg sous 1 kg, la graduation ronde au-dessus', () => {
    expect(pmax(0.4)).toBe(2);
    expect(pmax(5)).toBe(8);
    expect(pmax(7)).toBe(12);
    expect(pmax(60)).toBe(90);
  });
});

describe('part du grain', () => {
  it('donne la masse qui fait la part voulue, les autres grains ne bougent pas', () => {
    // 5 + 1,5 + 1,5 : la ligne 1 à 30 % du total → 0,3 = x / (x + 6,5)
    expect(kgPourPart(base, 1, 30)).toBeCloseTo(2.79, 2);
    expect(kgPourPart(base, 1, 100)).toBeNull();
    expect(kgPourPart([base[0]], 0, 50)).toBeNull();
  });
  it('la part affichée est celle de la masse sur le grain', () => {
    expect(partN(base, base[0])).toBe(63);
    expect(partN(base, base[1])).toBe(19);
  });
});

describe('recherche du champ d\'ajout', () => {
  it('ignore les accents et les majuscules', () => {
    expect(nu('Münchner')).toBe('munchner');
    expect(rang('Münchner Malz', 'munch')).toBe(0); // « münchner » est un nom courant de a1 (noms.ts)
    expect(rang('Münchner Malz', 'malz')).toBe(2);
  });
  it('le nom courant trouve son malt : « Munich » donne Münchner Malz en tête', () => {
    const r = chercher('Munich', grain, []);
    expect(r[0].nom).toBe('Münchner Malz');
    expect(r[0].rang).toBe(0);
    expect(chercher('mu', grain, [])[0].nom).toBe('Münchner Malz');
  });
  it('tolère une faute (« pilsnr »)', () => {
    expect(chercher('pilsnr', grain, [])[0].nom).toBe('Pilsner Malz');
    expect(rang('Pilsner Malz', 'pilsnr')).toBe(4);
  });
  it('un article déjà dans la recette passe devant, avec sa ligne', () => {
    const r = chercher('pils', grain, lignesGrain);
    expect(r[0].nom).toBe('Pilsner Malz');
    expect(r[0].ligne).toBe(0);
    expect(r.filter((c) => c.nom === 'Pilsner Malz')).toHaveLength(1);
  });
  it('un nom inconnu ne donne rien : « Créer » est l\'affaire du champ', () => {
    expect(chercher('Abbey Malt', grain, [])).toEqual([]);
  });
  it('à rang égal, l\'épinglé passe avant, puis l\'ordre du stock', () => {
    const r = chercher('malz', grain, []);
    expect(r.slice(0, 3).map((c) => c.nom)).toEqual(['Pilsner Malz', 'Pale Ale Malz', 'Münchner Malz']);
  });
  it('relie une ligne importée sans stockItemRef à l\'article de même nom', () => {
    const importee: Fermentable = { name: 'münchner malz', kind: 'grain', use: 'empatage', weightKg: 1 };
    const r = chercher('munch', grain, [ligne(importee, 0)]);
    expect(r[0].ligne).toBe(0);
    expect(r[0].article?.name).toBe('Münchner Malz');
    expect(r.filter((c) => /münchner/i.test(c.nom))).toHaveLength(1);
  });
  it('lit « cara 0,3 » : le nom, puis la masse', () => {
    expect(lireAjout('cara 0,3')).toEqual({ nom: 'cara', kg: 0.3 });
    expect(lireAjout('Abbey Malt')).toEqual({ nom: 'Abbey Malt', kg: null });
    expect(lireAjout('cara 0.3 kg')).toEqual({ nom: 'cara', kg: 0.3 });
  });
  it('un nom qui finit par un chiffre reste un nom (critique B1 n° 2 : « Crystal 60 » → 60 kg)', () => {
    const connu = (n: string) => ['crystal 60', 'pils'].some((a) => a.startsWith(n.toLowerCase()));
    expect(lireAjout('Crystal 60')).toEqual({ nom: 'Crystal 60', kg: null });
    expect(lireAjout('Crystal 60', connu)).toEqual({ nom: 'Crystal 60', kg: null });
    expect(lireAjout('pils 25', connu)).toEqual({ nom: 'pils', kg: 25 });
    expect(lireAjout('Crystal 60 kg')).toEqual({ nom: 'Crystal', kg: 60 });
  });
  it('un texte sans lettre n\'est pas un nom (critique B1 n° 3 : « 0,2 » créait un ingrédient)', () => {
    expect(nomPossible('0,2')).toBe(false);
    expect(nomPossible('60')).toBe(false);
    expect(nomPossible('Crystal 60')).toBe(true);
  });
  it('met en gras les lettres tapées', () => {
    expect(decouper('Münchner Malz', 'nch')).toEqual(['Mü', 'nch', 'ner Malz']);
    expect(decouper('Münchner Malz', 'zzz')).toEqual(['Münchner Malz', '', '']);
  });
});

describe('fixture du banc local', () => {
  it('reprend la recette et le stock de la maquette, sans valeur inventée', () => {
    expect(base.map((f) => [f.name, f.weightKg])).toEqual([['Pilsner Malz', 5], ['Weizenmalz hell', 1.5], ['Haferflocken', 1.5]]);
    expect(base.every((f) => f.colorEbc === undefined && f.potentialPpg === undefined)).toBe(true);
    const pale = stock.find((a) => a.name === 'Pale Ale Malz') as StockItem;
    expect(pale.favorite).toBe(true);
    expect(pale.currentStock).toBe(12.5);
    expect((stock.find((a) => a.name === 'Münchner Malz') as StockItem).currentStock).toBe(0);
    expect(stock.find((a) => a.name === 'Pilsner Malz')?.colorEbc).toBeUndefined();
  });
  it('les états : sucre, fruit à J+3, huit, vide', () => {
    expect(fermentablesApercu('sucre').at(-1)).toMatchObject({ name: 'Dextrose', kind: 'sucre', use: 'ebullition', weightKg: 0.4 });
    expect(fermentablesApercu('fruit').at(-1)).toMatchObject({ name: 'Purée de mangue', kind: 'fruit', use: 'fermentation', dayOffset: 3 });
    expect(fermentablesApercu('huit')).toHaveLength(8);
    expect(fermentablesApercu('vide')).toEqual([]);
    expect(apercuMalts('').style).toBe('Hazy IPA');
  });
});
