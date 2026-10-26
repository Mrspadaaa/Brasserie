// Voie d2-import-bm (#180) : les champs ajoutés au catalogue (cohumulone, farnésène, autres huiles, usage, bloc bm) ne bougent
// aucun résultat du moteur. Les empreintes ci-dessous ont été calculées AVANT l'import, sur le proto-data.json de HEAD (532f96df) ;
// elles couvrent les données lues par le moteur, le profil des 318 houblons et le classement des substituts de 12 houblons.
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { CATALOGUE, engineData } from '../../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';

const sha = (x: unknown) => createHash('sha256').update(JSON.stringify(x)).digest('hex');
// Voie d4-descripteurs (#180, D157, 26.10) : les descripteurs d'arôme de chaque source entrent dans les descriptions du catalogue. Seules les
// DESCRIPTIONS changent ; la preuve est la paire d'empreintes « sansDescriptions » (variétés du moteur sans leur champ descriptions) et
// « descriptionsHorsD4 » (descriptions des sources d'avant), toutes deux IDENTIQUES à celles de HEAD, plus le test « seules les descriptions
// ont changé » plus bas. Les trois autres empreintes sont celles de HEAD d'avant d4 : donneesMoteur aa55e061…, profils fe77eb81…, et
// substituts f64bcbf8… (celle d'e2 : moteur v2 sur les données de HEAD). Elles bougent parce que les familles et les mots lus changent, pas
// une formule (substitution.ts, recipe.ts, profil-simule.ts, levels.ts : inchangés par d4).
const ATTENDU = {
  donneesMoteur: '2266af7ef88bdad0f4d2acafccbfe60cbe862b2cb538610135ed796adc93e25e',
  sansDescriptions: '35969e336a22962111e09f6eadcdbf00ec5da85399a729b57fe0ff7ed5155392',
  descriptionsHorsD4: 'bfa3b5639e0ab52208b9ab15d385255e70577e0377965099726f532070b3bf4c',
  profils: '12ada1300b22d5cf155e91d2ebd9e2e32624062b34e43412858da6c0e6b1271c',
  // Substituer seul (e2-moteur-substitution, #181, D80, 26.10) : le moteur v2 change le classement et les scores de substitutes() ; ancienne
  // empreinte (v1) f3754c80744a017e8da8239476ba5e06c105f9a49bb226550e97cd4a85d61b66. Preuve : les deux autres empreintes (données du
  // moteur, profil des 318 houblons) n'avaient pas bougé, et substitutionV2.test.ts compare ce moteur à la formule mesurée hors ligne.
  // d4 (26.10) : f64bcbf8fd6ae2a1a9531e1f8c8c537309494a0fa1d7390b2851abc257421c0d (e2 sur les données de HEAD) → 4db3b8f4… (e2 sur les données d4) :
  // la formule d'e2 lit les mots des fiches (substitution.ts:127), donc les fiches ajoutées changent ses rangs. À recalculer si substitution.ts bouge.
  // e2, 26.10 (après d4) : 4db3b8f4… → ea61f2e1… : les poids de groupe sont réappris sur les données d4 (substitution.ts, WEIGHTS_MOMENT :
  // amertume 0,7 · 0,2 · 0,1 ; chaud 0,3 · 0,2 · 0,5 ; froid 0,2 · 0,3 · 0,5). Calculée avec voies/d4-descripteurs/empreintes.ts.
  substituts: 'ea61f2e194f7121c5b87f27f47d383160eeebd3d34d8d4c7c5812b4594762e1e',
};
// Les auteurs que d4 ajoute (prototypes/houblons-v4/scripts/build-data.mjs, SOURCES_MOTS et l'agrégat communautaire).
const AUTEURS_D4 = ['BarthHaas', 'Charles Faram', 'Crosby Hops', 'Hop Products Australia', 'John I. Haas', 'NZ Hops', 'Freestyle Hops', 'British Hop Association', 'BSG', 'Yakima Valley Hops', 'USA Hops', 'HopDatabase / hops-json'];
const PHARES = ['citra', 'mosaic', 'nelson-sauvin', 'galaxy', 'motueka', 'idaho-7', 'cascade', 'saaz-cz', 'nugget', 'lotus', 'simcoe', 'east-kent-goldings'].map((s) => `beermaverick-${s}`);

describe('le moteur rend les mêmes résultats qu\'avant l\'import', () => {
  const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
  it('les données que le moteur lit (variétés) ne changent que par leurs descriptions (d4)', () => {
    expect(sha(m.dans(() => engineData().varieties))).toBe(ATTENDU.donneesMoteur);
  });
  it('seules les descriptions ont changé : sans elles, les variétés sont celles de HEAD ; sans les sources d4, les descriptions aussi', () => {
    const v = m.dans(() => engineData().varieties);
    expect(sha(v.map(({ descriptions: _d, ...reste }) => reste))).toBe(ATTENDU.sansDescriptions);
    expect(sha(v.map((x) => x.descriptions.filter((d) => !AUTEURS_D4.includes(d.source.author))))).toBe(ATTENDU.descriptionsHorsD4);
    // Témoin positif : la voie a bien ajouté des descriptions, et seulement de ses auteurs.
    const ajoutees = v.flatMap((x) => x.descriptions.filter((d) => AUTEURS_D4.includes(d.source.author)));
    expect(ajoutees.length).toBeGreaterThan(500);
  });
  it('le profil de chacun des 318 houblons est inchangé', () => {
    expect(sha(CATALOGUE.map((h) => m.hopProfile(h.id)))).toBe(ATTENDU.profils);
  });
  it('le classement des substituts de 12 houblons est inchangé', () => {
    expect(sha(PHARES.map((k) => m.substitutes(k)))).toBe(ATTENDU.substituts);
  });
});
