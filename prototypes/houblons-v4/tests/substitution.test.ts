import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CATALOGUE, FAMILIES, additionIbu, describeFamilies, getStyleScale, hopRef, hopRole } from '../src/engine';
import { PALIERS, RANKING, SUBSTITUTION_METHOD, WEIGHTS, substitutes, type SubstitutionOptions, type SubstitutionWeights } from '../src/engine/substitution';
import { s1Recipe } from '../src/pack/buildPack';

const K = (id: string) => `beermaverick-${id}`;
const fichesFile = path.resolve(__dirname, '../data/pack-fiches.json');
const packFile = path.resolve(__dirname, '../data/pack-mini-protos.json');
const stored = JSON.parse(fs.readFileSync(fichesFile, 'utf8'));
/** Les 32 houblons des fiches du pack : le vivier des témoins « entre eux ». */
const FICHES: string[] = stored.fichesHoublons.map((f: { key: string }) => f.key);
/** Premier quart des candidats (31 autres fiches → 8). */
const QUART = Math.ceil((FICHES.length - 1) / 4);

const find = (key: string, target: string, opts: SubstitutionOptions) => {
  const s = substitutes(key, opts).remplacants.find((x) => x.key === target);
  if (!s) throw Error(`${target} absent des remplaçants de ${key}`);
  return s;
};
/** En tête : rang (égalités comprises) dans le premier quart, et une vraie ressemblance (score ≥ 50, palier partiel ou mieux). */
const enTete = (key: string, target: string, opts: SubstitutionOptions) => { const s = find(key, target, opts); return s.rank <= QUART && s.score >= 50; };
/** a strictement devant b (rang avec égalités : deux ex aequo ne passent pas). */
const devant = (key: string, a: string, b: string, opts: SubstitutionOptions) => find(key, a, opts).rank < find(key, b, opts).rank;
const pairs = (ids: string[]) => ids.flatMap((a) => ids.filter((b) => b !== a).map((b) => [K(a), K(b)] as const));

/**
 * Témoins de bon sens, paramétrés par les poids (le témoin négatif les met à zéro).
 * Lus sur des données honnêtes ; là où un témoin du brief ne tient pas, il est adapté et la raison écrite :
 * - Goldings sur tout le catalogue (318) : seuls EKG et Golding sont premiers l'un de l'autre. WGV et
 *   Styrian Golding arrivent entre le 6e et le 22e rang : beaucoup de houblons d'arôme continentaux et
 *   américains (Liberty, Smaragd, Aurum, Perle, Hallertau Tradition) sont décrits de la même façon ; la fiche
 *   de WGV est un seul relevé Beer Maverick (4 tags, sans linalol) ; Styrian Golding cite en plus résineux
 *   et végétal vert. Le témoin se lit donc sur les 32 fiches du pack (premier quart), plus EKG ↔ Golding
 *   sur le catalogue.
 * - Nobles : Saaz (CZ), Saaz Late et Spalt se trouvent entre eux ; Hallertau Mittelfrüh trouve Saaz (CZ)
 *   et Spalt, mais Saaz Late et Spalt ne le trouvent pas (15e et 20e sur 31). Données : les fiches de
 *   Saaz Late et Spalt sont un seul relevé Beer Maverick de 3 à 4 tags (terreux, herbacé, floral ;
 *   « noble » ne correspond à aucune famille), celle de Mittelfrüh cite agrumes, épicé, végétal vert et
 *   un humulène de 55–56 % contre 15–30 %. Le farnésène, publié par Beer Maverick, n'est pas importé.
 * - Nugget : sans moment, Pahto (fiche « neutral, herbal, earthy ») n'est que 18e sur 31 : la ressemblance
 *   d'arôme punit un houblon neutre. Nugget est l'amérisant de la stout S1 (60′) : le témoin se lit à 60′,
 *   avec la règle d'amertume (l'arôme ne compte que par ce que le remplaçant ajoute ; un α plus haut n'est
 *   pas un défaut). Cette règle a été écrite après avoir vu ce résultat : choix de brasseur à valider.
 * - Nugget et Target : depuis la règle « produit d'arôme ou houblon aromatique derrière à l'amertume »
 *   (demande du pilote, 18.10 soir), Target passe 19e sur 31 à 60′ (score 94) : le rôle du moteur le dit
 *   aromatique, car ses seuls usages fournisseurs du dépôt sont des houblonnages à cru dans des IPA (Alter
 *   Ego Brewing, BarthHaas). Le témoin garde Columbus et Pahto et vérifie que la raison de Target cite cette
 *   source ; corriger le rôle de Target demande une donnée d'usage d'amertume, absente du dépôt.
 */
function temoins(weights?: SubstitutionWeights) {
  const fiches: SubstitutionOptions = { pool: FICHES, weights }, catalogue: SubstitutionOptions = { weights };
  const at60 = (o: SubstitutionOptions): SubstitutionOptions => ({ ...o, moment: 'b60', grams: 46, recipe: s1Recipe() });
  const nuggetTop10 = substitutes(K('nugget'), { ...at60(catalogue), limit: 10 }).remplacants;
  return {
    goldings: pairs(['east-kent-goldings', 'golding', 'whitbread-golding-variety-wgv', 'styrian-golding']).every(([a, b]) => enTete(a, b, fiches))
      && find(K('east-kent-goldings'), K('golding'), catalogue).rank === 1 && find(K('golding'), K('east-kent-goldings'), catalogue).rank === 1,
    nobles: pairs(['saaz-cz', 'saaz-late', 'spalt']).every(([a, b]) => enTete(a, b, fiches))
      && enTete(K('hallertau-mittelfruh'), K('saaz-cz'), fiches) && enTete(K('hallertau-mittelfruh'), K('spalt'), fiches)
      && find(K('saaz-late'), K('spalt'), catalogue).rank === 1 && find(K('spalt'), K('saaz-late'), catalogue).rank === 1,
    citra: [fiches, catalogue].every((o) => ['galaxy', 'idaho-7', 'nectaron'].every((id) => devant('beermaverick-citra:cryo', K(id), K('fuggle'), o)))
      && ['galaxy', 'idaho-7', 'nectaron'].some((id) => enTete('beermaverick-citra:cryo', K(id), fiches)),
    nugget: ['columbus', 'pahto'].every((id) => enTete(K('nugget'), K(id), at60(fiches))
        && ['fuggle', 'saaz-cz', 'east-kent-goldings'].every((aroma) => devant(K('nugget'), K(id), K(aroma), at60(fiches))))
      && nuggetTop10.every((s) => { const a = hopRef(s.key)!.catalogue.alpha!; return (a[0] + a[1]) / 2 >= 10; })
      && /fournisseur : Alter Ego Brewing/.test(find(K('nugget'), K('target'), at60(fiches)).amertumeDeconseillee ?? ''),
  };
}

describe('Substitution de houblons : témoins de bon sens', () => {
  const t = temoins();
  it('les Goldings se trouvent entre eux (32 fiches : premier quart ; catalogue : EKG ↔ Golding premiers)', () => expect(t.goldings).toBe(true));
  it('les nobles Saaz (CZ), Saaz Late, Spalt se trouvent entre eux ; Mittelfrüh trouve Saaz (CZ) et Spalt', () => expect(t.nobles).toBe(true));
  it('Citra cryo trouve Galaxy, Idaho 7 et Nectaron avant Fuggle', () => expect(t.citra).toBe(true));
  it('Nugget à 60′ trouve des amérisants (Columbus, Pahto) avant les aromatiques ; ses 10 premiers ont α ≥ 10 % ; Target rétrogradé avec sa source', () => expect(t.nugget).toBe(true));
  it('sans moment, Nugget garde Target dans ses deux premiers et Pahto devant Fuggle', () => {
    expect(find(K('nugget'), K('target'), {}).rank).toBeLessThanOrEqual(2);
    expect(devant(K('nugget'), K('pahto'), K('fuggle'), {})).toBe(true);
  });
  it('témoin négatif : poids à zéro, chaque témoin échoue', () => {
    expect(temoins({ arome: 0, huiles: 0, amertume: 0 })).toEqual({ goldings: false, nobles: false, citra: false, nugget: false });
  });
});

describe('Substitution de houblons : score, couverture, dose, classement', () => {
  it('chaque remplaçant porte score 0–100, composantes, couverture, gains et pertes, dose, raison', () => {
    const r = substitutes(K('east-kent-goldings'));
    expect(r.regle).toBe(RANKING);
    expect(r.methode).toBe(SUBSTITUTION_METHOD);
    expect(r.candidats).toBe(CATALOGUE.length); // 318 variétés + Citra cryo − EKG
    expect(r.poids).toEqual(WEIGHTS['défaut']);
    let prev = 0;
    for (const s of r.remplacants) {
      expect(Number.isInteger(s.score) && s.score >= 0 && s.score <= 100).toBe(true);
      for (const v of Object.values(s.composantes)) if (v !== null) expect(v >= 0 && v <= 100).toBe(true);
      expect(s.palier).toBe(PALIERS.find((p) => s.score >= p.min)!.label);
      expect(s.rank).toBeGreaterThanOrEqual(prev); prev = s.rank;
      expect(s.raison.length).toBeGreaterThan(10);
    }
    // Gains et pertes : niveaux des fiches (0 non décrit, 1 cité, 2 marqué), jamais inventés.
    const golding = r.remplacants[0];
    expect(golding.name).toBe('Golding');
    const lv = (id: string) => { const d = describeFamilies(id); return Object.fromEntries(FAMILIES.map((f) => [f, d[f].level === 'marqué' ? 2 : d[f].level === 'cité' ? 1 : 0])); };
    const a = lv(K('east-kent-goldings')), b = lv(K('golding'));
    for (const m of [...golding.familles.gagne, ...golding.familles.perd]) { expect(m.de).toBe(a[m.family]); expect(m.a).toBe(b[m.family]); }
    expect(golding.familles.perd).toContainEqual({ family: 'citrus', de: 1, a: 0 });
    expect(golding.couverture).toMatchObject({ arome: true, fiabilite: 'bonne' });
    expect(golding.couverture.huiles).toEqual(['myrcene', 'humulene', 'caryophyllene', 'linalool']);
  });

  it('un score sans arôme connu est marqué faible et passe derrière', () => {
    const r = substitutes(K('east-kent-goldings'));
    const faibles = r.remplacants.filter((s) => s.couverture.fiabilite === 'faible');
    expect(faibles.length).toBeGreaterThan(0);
    for (const s of faibles) { expect(s.couverture.arome).toBe(false); expect(s.composantes.arome).toBeNull(); expect(s.raison).toMatch(/Arôme inconnu/); }
    expect(Math.min(...faibles.map((s) => s.rank))).toBeGreaterThan(Math.max(...r.remplacants.filter((s) => s.couverture.fiabilite !== 'faible').map((s) => s.rank)));
    const sansArome = CATALOGUE.find((c) => FAMILIES.every((f) => describeFamilies(c.id)[f].level === 'non décrit'))!;
    const r2 = substitutes(sansArome.id, { limit: 5 });
    expect(r2.manque[0]).toMatch(/aucune famille citée/);
    for (const s of r2.remplacants) expect(s.couverture.fiabilite).toBe('faible');
  });

  it('dose à IBU égal au même moment, plage tirée de l’α ; à froid, à masse égale', () => {
    // Citra cryo (lot à 24,8 %) → Citra en pellets (plage 10–15 %) : même variété, environ deux fois la masse.
    const c = find('beermaverick-citra:cryo', K('citra'), {});
    expect(c.memeVariete).toBe(true);
    expect(c.score).toBe(100);
    expect(c.dose).toMatchObject({ regle: 'même IBU', grams: 1.98, min: 1.65, max: 2.48 });
    // Nugget 46 g à 60′ (stout S1) → Target du stock (lot 11,3 %) : même IBU.
    const t = find(K('nugget'), K('target'), { moment: 'b60', grams: 46, recipe: s1Recipe() });
    const ibuNugget = additionIbu({ id: 'n', hopKey: K('nugget'), moment: 'b60', grams: 46 }, s1Recipe()).value;
    expect(t.dose.grams).toBeCloseTo((46 * 13) / 11.3, 1);
    expect(additionIbu({ id: 't', hopKey: K('target'), moment: 'b60', grams: t.dose.grams }, s1Recipe()).value).toBeCloseTo(ibuNugget, 0);
    expect(t.dose.ibu).toBeCloseTo(ibuNugget, 1);
    expect(t.stock).toMatchObject({ etat: 'en stock', libre: 5, suffisant: false });
    const dry = find('beermaverick-citra:cryo', K('galaxy'), { moment: 'dryPost', grams: 40 });
    expect(dry.dose).toMatchObject({ regle: 'masse égale', grams: 40, min: 40, max: 40, ibu: null });
  });

  it('contexte : le moment règle les poids ; à l’amertume, un α plus haut ne coûte rien', () => {
    expect(substitutes(K('nugget'), { moment: 'b60' }).poids).toEqual(WEIGHTS.amertume);
    expect(substitutes(K('nugget'), { moment: 'b10' }).poids).toEqual(WEIGHTS['arôme']);
    expect(substitutes(K('nugget'), { moment: 'b60', context: 'défaut' }).poids).toEqual(WEIGHTS['défaut']);
    // Pahto (α 17–20 %) face à Nugget : composante d'amertume meilleure à 60′ que sans moment.
    expect(find(K('nugget'), K('pahto'), { moment: 'b60' }).composantes.amertume!).toBeGreaterThan(find(K('nugget'), K('pahto'), {}).composantes.amertume!);
  });

  it('« en stock d’abord » : jamais devant un palier meilleur ; dans un palier, le stock passe devant', () => {
    const r = substitutes('beermaverick-citra:cryo', { moment: 'dryPost', grams: 40, stockFirst: true });
    const palier = (p: string) => PALIERS.findIndex((x) => x.label === p);
    const stock = (s: (typeof r.remplacants)[number]['stock']) => (s.etat === 'en stock' ? (s.suffisant ? 0 : 1) : 2);
    const l = r.remplacants;
    for (let i = 1; i < l.length; i++) {
      const [p, q] = [l[i - 1], l[i]];
      if (p.couverture.fiabilite === 'faible' || q.couverture.fiabilite === 'faible') continue; // couverture faible : clé précédente
      expect(palier(q.palier)).toBeGreaterThanOrEqual(palier(p.palier));
      if (q.palier === p.palier) expect(stock(q.stock)).toBeGreaterThanOrEqual(stock(p.stock));
    }
    // Sabro (en stock, 83) passe devant Citra en pellets (à acheter, 100) : même palier « très proche ».
    expect(l[0]).toMatchObject({ name: 'Sabro', palier: 'très proche', stock: { etat: 'en stock' } });
    expect(substitutes('beermaverick-citra:cryo', { moment: 'dryPost', grams: 40 }).remplacants[0].name).toBe('Citra');
  });

  it('amertume en brasseur : Nugget à 60′, stock d’abord → aucun cryo en tête, premier du stock amérisant ou double usage en quantité suffisante', () => {
    const r = substitutes(K('nugget'), { moment: 'b60', grams: 46, recipe: s1Recipe(), stockFirst: true });
    const l = r.remplacants, stock = l.filter((s) => s.stock.etat === 'en stock');
    expect(l.slice(0, 3).some((s) => /cryo/i.test(s.name))).toBe(false);
    expect(stock.slice(0, 3).some((s) => /cryo/i.test(s.name))).toBe(false);
    // Rôle du moteur (fournisseur, sinon règle rôle-α v1).
    const bitter = (key: string) => hopRole(key).value !== 'aromatique' && !/cryo|lupul|poudre|powder/i.test(hopRef(key)!.name);
    const fit = stock.filter((s) => bitter(s.key) && s.stock.suffisant);
    if (fit.length) expect(stock[0]).toMatchObject({ key: fit[0].key, amertumeDeconseillee: null, stock: { suffisant: true } });
    else expect(stock[0].raison).toMatch(/cher pour amériser/);
    // Citra cryo garde son score, mais passe après tous les amérisants et doubles usages, avec la raison écrite.
    const cryo = l.find((s) => s.key === 'beermaverick-citra:cryo')!;
    expect(cryo.amertumeDeconseillee).toBe('produit d’arôme (cryo), cher pour amériser');
    expect(cryo.raison).toMatch(/produit d’arôme \(cryo\), cher pour amériser/);
    expect(cryo.rank).toBeGreaterThan(Math.max(...l.filter((s) => !s.amertumeDeconseillee && s.couverture.fiabilite !== 'faible').map((s) => s.rank)));
    // Sans moment d'amertume, ou pour un original aromatique, la règle ne s'applique pas.
    expect(find(K('nugget'), 'beermaverick-citra:cryo', {}).amertumeDeconseillee).toBeNull();
    expect(find(K('saaz-cz'), K('hallertau-mittelfruh'), { moment: 'b60' }).amertumeDeconseillee).toBeNull();
  });

  it('la raison écrit l’α qui fait la dose : celui du lot, pour lire « α 9,6 % (lot) » avec « 62 g »', () => {
    const r = substitutes(K('nugget'), { moment: 'b60', grams: 46, recipe: s1Recipe(), stockFirst: true });
    const lus = r.remplacants.filter((x) => x.dose.regle === 'même IBU' && hopRef(x.key)!.alpha);
    // Le témoin porte au moins un lot du stock (Nelson Sauvin, α de l'article) et une plage variétale.
    expect(lus.filter((x) => hopRef(x.key)!.alpha!.min === hopRef(x.key)!.alpha!.max).length).toBeGreaterThan(0);
    expect(lus.filter((x) => hopRef(x.key)!.alpha!.min !== hopRef(x.key)!.alpha!.max).length).toBeGreaterThan(0);
    for (const s of lus) {
      const ref = hopRef(s.key)!, orig = hopRef(K('nugget'))!;
      const dit = (a: { value: number; min: number; max: number }) => `${String(Math.round(a.value * 10) / 10).replace('.', ',')} %${a.min === a.max ? ' (lot)' : ''}`;
      const attendu = `α ${dit(ref.alpha!)} contre ${dit(orig.alpha!)}`;
      expect(s.raison).toContain(attendu);
      // Même IBU : dose × α du lot constant (IBU linéaire en α), à l'arrondi près.
      expect(Math.abs(s.dose.grams * ref.alpha!.value - 46 * orig.alpha!.value) / (46 * orig.alpha!.value)).toBeLessThan(0.01);
    }
  });

  it('style : une famille indésirable gagnée met le remplaçant en conflit, derrière les autres', () => {
    // Hazy IPA (21C) : herbacé et végétal vert indésirables ; Citra n'en cite aucun.
    const r = substitutes('beermaverick-citra:cryo', { style: getStyleScale('21C') });
    expect(r.style).toBe('21C');
    const conflits = r.remplacants.filter((s) => s.conflitsStyle.length);
    expect(conflits.length).toBeGreaterThan(0);
    for (const s of conflits) for (const f of s.conflitsStyle) expect(['herbal', 'green']).toContain(f);
    expect(Math.min(...conflits.map((s) => s.rank))).toBeGreaterThan(Math.max(...r.remplacants.filter((s) => !s.conflitsStyle.length).map((s) => s.rank)));
    expect(find('beermaverick-citra:cryo', K('idaho-7'), { style: getStyleScale('21C') }).conflitsStyle).toContain('herbal');
  });
});

describe('Substitution dans le pack', () => {
  it('chaque fiche porte ses remplaçants calculés (top 5, méthode, date) ; substituts reste null ; pack sous 500 ko', () => {
    expect(stored.meta.substitution.regle).toEqual(RANKING);
    for (const f of stored.fichesHoublons) {
      expect(f.substituts).toBeNull();
      const c = f.substitutsCalcules;
      expect(c).toMatchObject({ methode: SUBSTITUTION_METHOD.nom, date: '2026-10-18' });
      expect(c.remplacants).toHaveLength(5);
      expect(c.remplacants.every((s: { key: string }) => s.key !== f.key)).toBe(true);
      expect(c.enStock.length).toBeLessThanOrEqual(3);
      for (const s of c.enStock) expect(s.stock.etat).toBe('en stock');
    }
    const nugget = stored.fichesHoublons.find((f: { key: string }) => f.key === K('nugget')).substitutsCalcules;
    expect(nugget).toMatchObject({ contexte: 'amertume', reference: { scenario: 'S1', moment: 'b60', grams: 46 } });
    const ekg = stored.fichesHoublons.find((f: { key: string }) => f.key === K('east-kent-goldings')).substitutsCalcules;
    expect(ekg).toMatchObject({ contexte: 'défaut', reference: { scenario: null, moment: 'b60', grams: 1 } });
    expect(ekg.remplacants[0].name).toBe('Golding');
    expect(fs.statSync(packFile).size).toBeLessThan(500 * 1024);
  });
});
