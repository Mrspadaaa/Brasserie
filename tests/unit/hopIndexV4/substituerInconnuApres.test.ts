// Voie k1-substituer-60 (D196, K1) : à un moment d'amertume, un candidat sans aucune variable d'amertume connue des deux houblons (α, β, cohumulone, usage)
// passe derrière tout candidat qui en a, et son score (fondé sur le seul poids de l'arôme, 10 %) ne s'étiquette jamais « très proche » ni « proche ».
// Cause prouvée par la voie d60-diagnostic (C4) : Nugget à 60′ rendait Bru, Kohia Nelson, Limequat… à 100 « très proche », tous à amertume inconnue.
// Ici : le test échoue sur HEAD (348ed482) et passe avec la règle ; à 10′, whirlpool et dry hop rien ne bouge (empreinte de HEAD, `regle` exclu).
import { createHash } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { chargerCataloguePlein, type CatalogueHop } from '../../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import { getStyleScale } from '../../../src/domain/hopIndex/v4/style/scale';
import type { Substitute } from '../../../src/domain/hopIndex/v4/substitution';

const sha = (x: unknown) => createHash('sha256').update(JSON.stringify(x)).digest('hex');
const CLE = (id: string) => `beermaverick-${id}`;
const recette = (style: string, key: string, moment: string, g = 30) => ({ name: style, styleCode: style, volumeL: 24, og: 1.06, boilMin: 60, yeastId: 'fermentis-us05', ebc: 10, additions: [{ id: 'a1', hopKey: key, moment, grams: g }] }) as never;
const inconnue = (s: Substitute) => s.composantes.amertume === null;
// Les vingt houblons courants de d60 (originaux posés à 60′), avec le style de leur recette de fixture.
const POP: [string, string][] = [['nugget', '16D'], ['magnum-us', '18B'], ['warrior', '18B'], ['columbus', '22A'], ['chinook', '18B'], ['perle-us', '3B'], ['saaz-cz', '3B'], ['east-kent-goldings', '11C'],
  ['target', '11C'], ['fuggle', '11C'], ['cascade', '18B'], ['centennial', '18B'], ['citra', '21C'], ['simcoe', '21C'], ['mosaic', '21C'], ['lotus', '22A'], ['galaxy', '21C'], ['motueka', '21C'], ['nelson-sauvin', '21C'], ['hallertau-blanc', '21C']];
// Ce que composer() de substituer/donnees.ts montre : cinq hors stock au plus, trois du stock.
const cinqMontres = (rs: Substitute[]) => rs.filter((s) => s.stock.etat !== 'en stock').slice(0, 5);

let plein: CatalogueHop[];
let m: ReturnType<typeof creerMoteur>;
beforeAll(async () => { plein = await chargerCataloguePlein(); m = creerMoteur({ catalogue: plein, stock: [] }); }, 60_000);
const sub = (id: string, style: string, moment: string, g: number, extra: object = {}) => {
  const r = recette(style, CLE(id), moment, g);
  return m.substitutes(CLE(id), { moment: moment as never, grams: g, recipe: r, style: getStyleScale(style), stockFirst: true, ...extra });
};

describe('K1 : à un moment d\'amertume, l\'inconnu passe après le connu (D196)', () => {
  it('Nugget 46 g à 60′ (stout S1) : aucun inconnu d\'amertume parmi les cinq premiers ni les trente premiers ; la tête est faite d\'amérisants connus', () => {
    const res = sub('nugget', '16D', 'b60', 46, { limit: 700 });
    expect(res.candidats).toBeGreaterThan(400); // témoin positif : le catalogue plein, 76 candidats à amertume inconnue dans la mesure d60
    // D199 (c9) : l'amertume inconnue passait de 76 à 13 candidats (les recettes et les fiches croisées en ont rendu 63) ; les 13 restants (aucune valeur nulle part, ou un mélange) suffisent au témoin.
    expect(res.remplacants.filter(inconnue).length).toBeGreaterThanOrEqual(10);
    expect(res.remplacants.filter(inconnue).length).toBeLessThanOrEqual(20);
    const tete = res.remplacants.slice(0, 5);
    expect(tete.filter(inconnue).map((s) => s.name)).toEqual([]);
    expect(res.remplacants.slice(0, 30).filter(inconnue)).toHaveLength(0);
    for (const s of tete) expect(s.couverture.amertume.length).toBeGreaterThan(0);
    // Les amérisants connus qu'attend le brasseur de Nugget (mesure d60 : Warrior 22e, Chinook 32e, Columbus 48e) entrent bien plus haut que les inconnus à 100.
    const rang = (id: string) => res.remplacants.findIndex((s) => s.key === CLE(id));
    expect(Math.max(...['warrior', 'chinook', 'columbus', 'magnum-us'].map(rang))).toBeLessThan(res.remplacants.findIndex(inconnue));
  }, 60_000);

  it('l\'ordre est partagé en deux blocs : tout candidat à amertume connue précède tout inconnu (sans style, avec et sans « en stock d\'abord »)', () => {
    for (const stockFirst of [true, false]) for (const [id, moment] of [['nugget', 'b60'], ['warrior', 'b30'], ['hallertau-blanc', 'fwh']] as const) {
      const res = m.substitutes(CLE(id), { moment, grams: 20, stockFirst, limit: 700 });
      const premier = res.remplacants.findIndex(inconnue);
      expect(premier).toBeGreaterThan(0);
      expect(res.remplacants.slice(premier).every(inconnue)).toBe(true);
    }
  }, 60_000);

  it('un inconnu garde son score (rien n\'est inventé, jamais 0) mais n\'est jamais « très proche » ni « proche », et sa raison le dit', () => {
    const res = sub('nugget', '16D', 'b60', 46, { limit: 700 });
    const inconnus = res.remplacants.filter(inconnue);
    expect(inconnus.some((s) => s.score >= 80)).toBe(true); // témoin : le score brut, fondé sur l'arôme seul, atteint toujours 80 et plus
    for (const s of inconnus) {
      expect(['très proche', 'proche']).not.toContain(s.palier);
      expect(s.raison).toContain('amertume inconnue');
    }
    // Les candidats à amertume connue gardent l'étiquette de leur score.
    const palierDe = (n: number) => (n >= 80 ? 'très proche' : n >= 65 ? 'proche' : n >= 50 ? 'partiel' : 'éloigné');
    for (const s of res.remplacants.filter((x) => !inconnue(x))) expect(s.palier).toBe(palierDe(s.score));
  }, 60_000);

  it('les 20 houblons courants posés à 60′ : aucun n\'a d\'inconnu d\'amertume parmi les cinq montrés (17 sur 20 avant D196)', () => {
    const touches = POP.filter(([id, style]) => cinqMontres(sub(id, style, 'b60', 30, { limit: 700 }).remplacants).some(inconnue)).map(([id]) => id);
    expect(touches).toEqual([]);
  }, 120_000);

  it('à 10′, au whirlpool et au dry hop, rien ne change : même empreinte que HEAD (348ed482), le texte de la règle exclu', () => {
    const out: [string, string][] = [];
    for (const [id, style] of POP) for (const moment of ['b10', 'wp', 'dryActive', 'dryPost']) {
      const r = recette(style, CLE(id), moment);
      const res = m.substitutes(CLE(id), { moment: moment as never, grams: 30, recipe: r, style: getStyleScale(style), stockFirst: true, limit: 40 });
      out.push([`${id}@${moment}`, sha({ ...res, regle: undefined })]);
    }
    expect(out).toHaveLength(80);
    // D199 (c9, 31.10) : 033aba7b… → 17f1f88d… Les 76 ajouts sans amertume en ont retrouvé une (fiches croisées et recettes), 8 doublons sont fondus (497 variétés au lieu de 505) :
    // la règle de K1 n'a pas bougé, ce sont les données du catalogue plein qui ont changé.
    expect(sha(out)).toBe('17f1f88d5ae63027b709e31b35fb6b180c0e8208ed293d7ee1a1ee2ad075cee3');
  }, 120_000);
});
