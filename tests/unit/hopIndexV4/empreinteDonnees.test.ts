// Voie t8-donnees (#169) : un snapshot identique ne relance aucun calcul. Le moteur est réutilisé par EMPREINTE des données
// (moteur.ts) : mêmes données dans des tableaux neufs, même contexte, mêmes caches ; un article changé, un moteur neuf.
import { beforeEach, describe, expect, it } from 'vitest';
import { CATALOGUE, courant, type StockHop } from '../../../src/domain/hopIndex/v4/data';
import { creerMoteur, empreinteDonnees, oublierContextes, statistiquesMoteur } from '../../../src/domain/hopIndex/v4/moteur';

const cascade = CATALOGUE.find((h) => h.id === 'beermaverick-cascade')!;
const citra = CATALOGUE.find((h) => h.id === 'beermaverick-citra')!;
const stockDe = (): StockHop[] => [
  { key: cascade.id, varietyId: cascade.id, form: 'unknown', grams: 60, alpha: 6.5, alphaFrom: 'fiche de stock', items: ['Cascade'] },
  { key: `${citra.id}:cryo`, varietyId: citra.id, form: 'cryo', grams: 65, alpha: 24.8, alphaFrom: 'lu sur l’article', items: ['Houblon Cryo Hops Citra 24.8%'] },
];
const copie = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
/** Le contexte (donc les caches) du moteur : le même objet = rien à recalculer. */
const cachesDe = (m: ReturnType<typeof creerMoteur>) => m.dans(() => courant().locaux);

beforeEach(() => oublierContextes());

describe('snapshot identique : même empreinte, même moteur, aucun calcul relancé', () => {
  it('des tableaux neufs de même contenu partagent le contexte et ses caches', () => {
    const a = creerMoteur({ catalogue: CATALOGUE, stock: stockDe() });
    a.hopProfile(cascade.id);
    const cachesA = cachesDe(a);
    const tailleA = cachesA.size;
    expect(tailleA).toBeGreaterThan(0);
    const b = creerMoteur({ catalogue: copie(CATALOGUE), stock: copie(a.stock) });
    expect(b.empreinte).toBe(a.empreinte);
    expect(cachesDe(b)).toBe(cachesA);                // les mêmes caches, pas une copie
    b.hopProfile(cascade.id);
    expect(cachesDe(b).size).toBe(tailleA);           // et rien de nouveau n'a été calculé
    expect(statistiquesMoteur()).toMatchObject({ crees: 1, parEmpreinte: 1 });
  });
  it('le compteur le dit : un snapshot sur dix ne crée rien', () => {
    const base = stockDe();
    creerMoteur({ catalogue: CATALOGUE, stock: base });
    for (let i = 0; i < 10; i++) creerMoteur({ catalogue: CATALOGUE, stock: copie(base) });
    expect(statistiquesMoteur()).toMatchObject({ crees: 1, parEmpreinte: 10 });
  });
  it('les mêmes tableaux rendent le même moteur par identité (sans recalculer l\'empreinte)', () => {
    const s = stockDe();
    creerMoteur({ catalogue: CATALOGUE, stock: s });
    creerMoteur({ catalogue: CATALOGUE, stock: s });
    expect(statistiquesMoteur()).toMatchObject({ crees: 1, parIdentite: 1, parEmpreinte: 0 });
  });
});

describe('empreinte : stable pour des données égales, sensible à ce qui compte', () => {
  it('l\'ordre des articles du stock n\'y change rien', () => {
    const s = stockDe();
    expect(empreinteDonnees({ catalogue: CATALOGUE, stock: [...s].reverse() })).toBe(empreinteDonnees({ catalogue: CATALOGUE, stock: s }));
  });
  it('et l\'ordre n\'a pas d\'effet sur un calcul (c\'est pourquoi l\'empreinte peut l\'ignorer)', () => {
    const s = stockDe();
    const a = creerMoteur({ catalogue: CATALOGUE, stock: s });
    oublierContextes();
    const b = creerMoteur({ catalogue: CATALOGUE, stock: [...s].reverse() });
    expect(JSON.stringify(b.hopProfile(cascade.id))).toBe(JSON.stringify(a.hopProfile(cascade.id)));
  });
  it('un gramme, un α, une forme ou un article de plus change l\'empreinte', () => {
    const e0 = empreinteDonnees({ catalogue: CATALOGUE, stock: stockDe() });
    const variantes: ((s: StockHop[]) => StockHop[])[] = [
      (s) => { s[0].grams += 1; return s; },
      (s) => { s[0].alpha = 7; return s; },
      (s) => { s[0].alpha = null; return s; },
      (s) => { s[1].form = 'unknown'; return s; },
      (s) => s.slice(0, 1),
    ];
    const vues = new Set([e0]);
    for (const v of variantes) vues.add(empreinteDonnees({ catalogue: CATALOGUE, stock: v(stockDe()) }));
    expect(vues.size).toBe(variantes.length + 1);
  });
  it('une fiche du catalogue changée change l\'empreinte', () => {
    const autre = copie(CATALOGUE);
    autre[0].name += ' (corrigé)';
    expect(empreinteDonnees({ catalogue: autre, stock: [] })).not.toBe(empreinteDonnees({ catalogue: CATALOGUE, stock: [] }));
  });
});

describe('un article changé : un moteur neuf, aux caches vides', () => {
  it('le stock change de contenu : contexte neuf', () => {
    const a = creerMoteur({ catalogue: CATALOGUE, stock: stockDe() });
    a.hopProfile(cascade.id);
    const s = stockDe(); s[0].grams = 10;
    const b = creerMoteur({ catalogue: CATALOGUE, stock: s });
    expect(b.empreinte).not.toBe(a.empreinte);
    expect(cachesDe(b)).not.toBe(cachesDe(a));
    expect(cachesDe(b).size).toBe(0);
    expect(statistiquesMoteur()).toMatchObject({ crees: 2, parEmpreinte: 0 });
  });
  it('le moteur voit son stock, pas celui de l\'autre', () => {
    const a = creerMoteur({ catalogue: CATALOGUE, stock: stockDe() });
    const s = stockDe(); s[0].grams = 10;
    const b = creerMoteur({ catalogue: CATALOGUE, stock: s });
    expect(a.dans(() => courant().stockByKey.get(cascade.id)!.grams)).toBe(60);
    expect(b.dans(() => courant().stockByKey.get(cascade.id)!.grams)).toBe(10);
  });
});

describe('mémoire bornée : deux contextes gardés au plus', () => {
  it('cinq stocks différents ne gardent que les deux derniers', () => {
    for (let g = 1; g <= 5; g++) { const s = stockDe(); s[0].grams = g; creerMoteur({ catalogue: CATALOGUE, stock: s }); }
    expect(statistiquesMoteur()).toMatchObject({ crees: 5, gardes: 2 });
  });
  it('revenir à l\'état précédent (un aller-retour) retrouve les caches', () => {
    const a = creerMoteur({ catalogue: CATALOGUE, stock: stockDe() });
    a.hopProfile(cascade.id);
    const s = stockDe(); s[0].grams = 5;
    creerMoteur({ catalogue: CATALOGUE, stock: s });
    const a2 = creerMoteur({ catalogue: CATALOGUE, stock: stockDe() });
    expect(cachesDe(a2)).toBe(cachesDe(a));
    expect(statistiquesMoteur()).toMatchObject({ crees: 2, parEmpreinte: 1 });
  });
});

describe('le moteur des fixtures reste à part', () => {
  it('sans données : empreinte null, jamais compté', () => {
    expect(creerMoteur().empreinte).toBeNull();
    expect(statistiquesMoteur()).toMatchObject({ crees: 0, parEmpreinte: 0, parIdentite: 0 });
  });
});
