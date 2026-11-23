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
  // c6 (26.10, catalogue-complet) : Equinox est Ekuanot (317 variétés, alias « Equinox »), et la table d'alias rattache 26 variétés à des fiches de plus (ou en retire
  // une : la fiche Freestyle Hops Nouvelle-Zélande de Cascade, origine non répertoriée). Anciennes empreintes : donneesMoteur 2266af7e…, sansDescriptions 35969e33…,
  // descriptionsHorsD4 bfa3b563…, profils 12ada130…, substituts 3a8bf578… Aucune formule du moteur n'a changé.
  // D199 (c9, 31.10) : donneesMoteur d8794ef5… → 28fe2870…, profils 85e2bdc5… → cb4bd848…, substituts 5f7703d6… → 65ace4af…. Huit doublons prouvés sont fondus (alias-noms.json, preuvesC9) :
  // seules BRU-1 (fiche HPA : « Spicy pineapple », « tropical fruit ») et Cluster Fugget Blend (fiche HopDatabase de Yakima Chief : earthy, grassy, spicy, woody) gagnent une fiche ;
  // `sansDescriptions` et `descriptionsHorsD4` n'ont pas bougé (aucun champ chiffré ne change), et le dictionnaire de mots n'a qu'un mot de plus, en dernier : aucun autre index ne bouge.
  donneesMoteur: '28fe28700c5dd3d1c03adf5338ee130179f2fac99485f1842be580c459778eda',
  sansDescriptions: 'f1c74cbc12a1b2087a49e8ddb7dc50f29fe95540421613fd14193bd0f1a28741',
  descriptionsHorsD4: '17b11983ff827b2934f94632d933c6c1129b627cf0016e0c41a2264a31748629', // c6 : seule l'entrée Equinox (sans descripteur) disparaît du tableau
  profils: 'cb4bd8484c6c2bb58cfaf66fbb8592a92d09b62ac04f4cbe45d55caac457a99f',
  // Substituer seul (e2-moteur-substitution, #181, D80, 26.10) : le moteur v2 change le classement et les scores de substitutes() ; ancienne
  // empreinte (v1) f3754c80744a017e8da8239476ba5e06c105f9a49bb226550e97cd4a85d61b66. Preuve : les deux autres empreintes (données du
  // moteur, profil des 318 houblons) n'avaient pas bougé, et substitutionV2.test.ts compare ce moteur à la formule mesurée hors ligne.
  // d4 (26.10) : f64bcbf8fd6ae2a1a9531e1f8c8c537309494a0fa1d7390b2851abc257421c0d (e2 sur les données de HEAD) → 4db3b8f4… (e2 sur les données d4) :
  // la formule d'e2 lit les mots des fiches (substitution.ts:127), donc les fiches ajoutées changent ses rangs. À recalculer si substitution.ts bouge.
  // e2, 26.10 (après d4) : 4db3b8f4… → ea61f2e1… : les poids de groupe sont réappris sur les données d4 (substitution.ts, WEIGHTS_MOMENT :
  // amertume 0,7 · 0,2 · 0,1 ; chaud 0,3 · 0,2 · 0,5 ; froid 0,2 · 0,3 · 0,5). Calculée avec voies/d4-descripteurs/empreintes.ts.
  // D90, g2c (26.10) : ea61f2e1… → 3a8bf578… Seule la phrase de la règle de classement change (« le remplaçant marque une famille indésirable… la moitié au moins
  // de ses fiches la citent », substitution.ts, RANKING) : sans le champ `regle`, l'empreinte reste 97779b94… avant et après (même scores, mêmes rangs, mêmes doses).
  // Aucun style n'est donné ici : le conflit de style, seul changé par D90, n'entre pas dans ces 12 classements ; il est testé dans exclusionStyle.test.ts.
  // D196 (k1-substituer-60, 31.10) : 9e1a3a6d… → 5f7703d6… Seule la phrase de la règle de classement change (RANKING : « à un moment d’amertume, amertume inconnue derrière »,
  // champ `regle`). Sans `regle`, l'empreinte reste cda1c421… avant et après (contexte par défaut, hors moment d'amertume : mêmes scores, rangs, doses, raisons).
  // Mesurée avec scripts/eval-hop/k1-mesure.ts (moteurInchange.sansRegle).
  substituts: '65ace4af16269b1f84e15c92f38c3c5d136bb938e66e4a0b2b3a16c80997254e',
  // D99 (26.10, voie d99-apport-c-defaut) : l'option c de g2d devient le défaut au dry hop (voies.ts : overflowRang). Ces cinq empreintes lisent les données et
  // substitutes(), jamais proposeVoies : AUCUNE ne bouge (rejouées, vertes). Le classement de Suggérer a son contrôle dans apportCDefaut.test.ts.
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
  it('le profil de chacun des 317 houblons est celui des données c6', () => {
    expect(sha(CATALOGUE.map((h) => m.hopProfile(h.id)))).toBe(ATTENDU.profils);
  });
  it('le classement des substituts de 12 houblons est inchangé', () => {
    expect(sha(PHARES.map((k) => m.substitutes(k)))).toBe(ATTENDU.substituts);
  });
});
