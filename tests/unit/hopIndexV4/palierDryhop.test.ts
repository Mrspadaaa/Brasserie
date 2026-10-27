// Voie g2b-60-et-dryhop (D88 B, D161, D165, D166) : le palier 60′ et le vrai dry hop de Suggérer, sous options du moteur.
// Chaque option : le défaut reste inchangé (pas un octet de plus dans la réponse), la dose à 60′ rend +n IBU à ± 0,5, aucun houblon d'arôme
// avant un amérisant à 60′, le dry hop propose actif et après, sa dose suit la règle (palier.ts), le stock n'impose aucune dose.
import { describe, expect, it, vi } from 'vitest';
import { CATALOGUE, type StockHop } from '../../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import { BORNES_DRYHOP_GL, GRILLE_DRYHOP_GL, REGLE_DRYHOP, comparerGrammesPalier, comparerPalier, comparerUsagePalier, drapeauIbu, rangUsage } from '../../../src/domain/hopIndex/v4/palier';
import type { Recipe } from '../../../src/domain/hopIndex/v4/recipe';
import type { Voie } from '../../../src/domain/hopIndex/v4';

const m = creerMoteur({ catalogue: CATALOGUE, stock: [] }); // les 318 variétés, sans stock
const R21C: Recipe = { name: 'Hazy du jeudi (21C)', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
const GRAND = { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false } as const;
/** Pour les tests qui n'ont pas besoin de toute la liste : le profil « après » de chaque voie gardée coûte ~15 ms. */
const MOYEN = { maxBuy: 400, limit: 40, buyLimit: 40, perHop: 100, assemblages: false } as const;
const LONG = 120_000;
vi.setConfig({ testTimeout: LONG });
const nom = (v: Voie) => v.actions[0].hopName;
const gl = (v: Voie) => v.actions[0].grams / R21C.volumeL;
const stockDe = (key: string, grams: number): StockHop => ({ key, varietyId: key, form: 'unknown', grams, alpha: null, alphaFrom: null, items: [`${key} ${grams} g`] });

describe('le défaut reste inchangé : aucune des options, aucune clé de plus', () => {
  const base = m.proposeVoies(R21C, { citrus: 1 }, { assemblages: true, leviersLevure: true });
  it('sans option, la réponse ne porte ni palier, ni dose, ni stock à part', () => {
    // D120 (t2) : chaque voie porte sa typicité (défaut), objet qui a un champ `palier` à lui (3, 2, 1 ou null : celui du style, pas celui du dry hop) : on la met de côté pour chercher le palier du dry hop.
    const json = JSON.stringify(base, (k, v) => (k === 'typicite' ? undefined : v));
    for (const cle of ['"palier":', '"palier60"', '"dryHop"', '"dose":', '"enStock"', '"drapeaux"']) expect(json).not.toContain(cle);
  });
  it('options absentes, undefined ou fausses : même résultat, à l\'octet près', () => {
    const a = JSON.stringify(base);
    expect(JSON.stringify(m.proposeVoies(R21C, { citrus: 1 }, { assemblages: true, leviersLevure: true, palier60: undefined, dryHop: undefined }))).toBe(a);
    expect(JSON.stringify(m.proposeVoies(R21C, { citrus: 1 }, { assemblages: true, leviersLevure: true, dryHop: false }))).toBe(a);
  });
  it('l\'option dryHop ne change pas la liste principale (mêmes voies, mêmes rangs), elle ajoute un groupe', () => {
    const avec = m.proposeVoies(R21C, { citrus: 1 }, { assemblages: true, leviersLevure: true, dryHop: true });
    expect(JSON.stringify(avec.voies)).toBe(JSON.stringify(base.voies));
    expect(avec.dryHop).toBeDefined();
  });
});

describe('le palier 60′ : la dose exacte pour +n IBU', () => {
  it.each([5, 10, 25])('+%i IBU : chaque ajout à 60′ rend +n IBU à ± 0,5 (au gramme, sinon au demi-gramme, sinon au dixième)', (n) => {
    const p = m.proposeVoies(R21C, { citrus: 1 }, { ...MOYEN, palier60: { ibu: n } }).palier60!;
    expect(p.voies.length).toBe(40);
    for (const v of p.voies) {
      const a = v.actions[0];
      expect(a.moment).toBe('b60');
      const ajoute = m.additionIbu({ id: a.additionId, hopKey: a.hopKey, moment: 'b60', grams: a.grams }, R21C).value;
      expect(Math.abs(ajoute - n)).toBeLessThanOrEqual(0.5 + 1e-9);
      expect(v.ibu.before).toBe(p.ibuAvant);
    }
    // Témoin : une dose au gramme fait parfois sortir de ± 0,5 IBU (Polaris, 20 % d'α, +5 IBU : 2,5 IBU par gramme) ; la règle descend alors d'un pas.
    const entiers = p.voies.filter((v) => Number.isInteger(v.actions[0].grams)).length;
    if (n === 5) expect(entiers).toBeLessThan(p.voies.length);
  }, LONG);
  it('l\'IBU avant → après, la bande du style et le drapeau', () => {
    const r = m.proposeVoies(R21C, { citrus: 1 }, { ...MOYEN, palier60: { ibu: 10 } });
    const p = r.palier60!;
    expect(p.bande).toEqual([25, 60]);
    expect(p.ibuAvant).toBe(r.ibu);
    expect(p.voies.every((v) => v.palier!.drapeau === null && v.ibu.after > v.ibu.before)).toBe(true);
    // +40 IBU sort de la bande (27,4 → 67) : un drapeau, la voie reste proposée.
    const haut = m.proposeVoies(R21C, { citrus: 1 }, { ...MOYEN, palier60: { ibu: 40 } }).palier60!.voies;
    expect(haut.length).toBe(40);
    expect(haut.every((v) => v.palier!.drapeau === 'au-dessus de la bande' && v.conflicts.length === 0)).toBe(true);
  }, LONG);
  it('aucun houblon d\'arôme avant un amérisant : usage, puis α (moins de grammes) ; l\'usage inconnu passe en dernier', () => {
    const vs = m.proposeVoies(R21C, { citrus: 1 }, { ...GRAND, palier60: { ibu: 10 } }).palier60!.voies;
    const usages = vs.map((v) => rangUsage(v.palier!.usage));
    expect(usages).toEqual([...usages].sort((a, b) => a - b));
    // Témoins positifs : la liste contient bien les trois usages, et le premier arôme vient après tous les amérisants.
    expect(new Set(usages).size).toBeGreaterThanOrEqual(2); // amérisant ou double usage (palier 0), arôme (palier 1) ; aucun houblon du catalogue n'a un usage inconnu
    expect(vs[0].palier!.usage).not.toBe('aroma');
    const premierArome = vs.findIndex((v) => v.palier!.usage === 'aroma');
    expect(vs.slice(premierArome).some((v) => v.palier!.usage !== 'aroma')).toBe(false); // après le premier arôme : que des arômes
    // Dans un usage, moins de grammes d'abord (α le plus haut) : les grammes exacts ne baissent jamais.
    for (let i = 1; i < vs.length; i++) if (rangUsage(vs[i].palier!.usage) === rangUsage(vs[i - 1].palier!.usage)) expect(vs[i].palier!.rang[1]).toBeGreaterThanOrEqual(vs[i - 1].palier!.rang[1]);
    // Le premier de la liste n'a pas plus de grammes que le dernier amérisant.
    const amerisants = vs.filter((v) => v.palier!.usage !== 'aroma');
    expect(amerisants[0].palier!.alpha!).toBeGreaterThanOrEqual(amerisants[amerisants.length - 1].palier!.alpha!);
  });
  it('le conflit de famille exclut (D90) ; la bande d\'IBU n\'exclut pas', () => {
    const sans = m.proposeVoies(R21C, { citrus: 1 }, { ...GRAND, palier60: { ibu: 10 } }).palier60!;
    const moins = m.proposeVoies(R21C, { citrus: 1, resin: -1 }, { ...GRAND, palier60: { ibu: 10 } }).palier60!;
    expect(moins.voies.length).toBeLessThan(sans.voies.length);
    expect(moins.voies.every((v) => v.conflicts.length === 0)).toBe(true);
    expect(moins.notes.join(' ')).toContain('exclus à 60′');
    const exclus = sans.voies.map(nom).filter((x) => !moins.voies.map(nom).includes(x));
    expect(exclus.length).toBeGreaterThan(0);
  });
  it('« remplacer à IBU égal » suit la même règle d\'usage : sans l\'option un arôme peut passer avant un amérisant, avec elle jamais', () => {
    const rempl = (opt: object) => m.proposeVoies(R21C, { citrus: 1 }, { ...GRAND, moments: ['b60'], ...opt }).voies.filter((v) => v.type === 'remplacer à IBU égal' && v.conflicts.length === 0);
    const usage = (v: Voie) => rangUsage(m.hopRef(v.actions[0].hopKey)!.catalogue.purpose);
    const memeGroupe = (vs: Voie[]) => { const g = new Map<string, Voie[]>(); for (const v of vs) { const k = `${v.overflowTotal}|${v.distance.total}`; (g.get(k) ?? g.set(k, []).get(k)!).push(v); } return [...g.values()]; };
    const inversions = (vs: Voie[]) => memeGroupe(vs).reduce((s, g) => s + g.filter((v, i) => g.slice(i + 1).some((w) => usage(w) < usage(v))).length, 0);
    expect(inversions(rempl({}))).toBeGreaterThan(0); // le défaut d'aujourd'hui (g1 : Monroe en 96 g devant des amérisants)
    expect(inversions(rempl({ palier60: { ibu: 10 } }))).toBe(0);
    // Avec l'option, l'usage passe avant la distance : aucun remplacement par un arôme ne précède un amérisant ou un double usage, tous groupes confondus.
    const avec = rempl({ palier60: { ibu: 10 } }).map(usage);
    expect(avec).toEqual([...avec].sort((a, b) => a - b));
    expect(avec.some((u) => u === 1)).toBe(true); // témoin : des arômes sont bien proposés, derrière
    expect(rempl({}).map(usage)).not.toEqual([...rempl({}).map(usage)].sort((a, b) => a - b)); // et sans l'option, ils se mêlent
    expect(rempl({ palier60: { ibu: 10 } }).every((v) => v.palier && v.palier.usage !== undefined)).toBe(true);
  });
  it('le reste du stock se dit à part et ne fixe pas la dose ; une visée négative ne propose rien', () => {
    const ms = creerMoteur({ catalogue: CATALOGUE, stock: [stockDe('beermaverick-zeus', 3)] });
    const sans = m.proposeVoies(R21C, { citrus: 1 }, { ...MOYEN, palier60: { ibu: 10 } }).palier60!.voies.find((v) => nom(v) === 'Zeus')!;
    const avec = ms.proposeVoies(R21C, { citrus: 1 }, { ...MOYEN, palier60: { ibu: 10 } }).palier60!.voies.find((v) => nom(v) === 'Zeus')!;
    expect(avec.actions[0].grams).toBe(sans.actions[0].grams); // 3 g en stock : la dose reste celle de +10 IBU
    expect(avec.enStock).toBe(3);
    expect(avec.stock.status).toBe('manque');
    expect(sans.enStock).toBeNull();
    const neg = m.proposeVoies(R21C, { citrus: 1 }, { ...GRAND, palier60: { ibu: -5 } }).palier60!;
    expect(neg.voies).toEqual([]);
    expect(neg.notes.join(' ')).toContain('positive');
  });
  it('comparerPalier et drapeauIbu', () => {
    const p = (u: number, g: number) => ({ usage: null, alpha: null, rang: [u, g] as [number, number], bande: null, drapeau: null });
    expect(comparerPalier(p(0, 9), p(1, 2))).toBeLessThan(0); // l'usage avant les grammes
    expect(comparerPalier(p(1, 3), p(1, 2))).toBeGreaterThan(0);
    expect(comparerPalier(undefined, undefined)).toBe(0);
    // Dans le classement général : l'usage (sans palier = palier des amérisants) puis les grammes (sans palier = après ceux qui en ont) ; sans l'option, égalité.
    expect(comparerUsagePalier(undefined, undefined)).toBe(0);
    expect(comparerUsagePalier(undefined, p(0, 5))).toBe(0);
    expect(comparerUsagePalier(undefined, p(1, 5))).toBeLessThan(0);
    expect(comparerGrammesPalier(undefined, undefined)).toBe(0);
    expect(comparerGrammesPalier(p(0, 5), undefined)).toBeLessThan(0);
    expect(comparerGrammesPalier(undefined, p(0, 5))).toBeGreaterThan(0);
    expect(comparerGrammesPalier(p(0, 5), p(0, 7))).toBeLessThan(0);
    expect(drapeauIbu(24.4, [25, 60])).toBe('sous la bande');
    expect(drapeauIbu(24.6, [25, 60])).toBeNull();
    expect(drapeauIbu(60.6, [25, 60])).toBe('au-dessus de la bande');
    expect(drapeauIbu(80, null)).toBeNull();
    expect(rangUsage(null)).toBe(2);
    expect(rangUsage('dual')).toBe(rangUsage('bittering'));
    expect(rangUsage('aroma')).toBeGreaterThan(rangUsage('dual'));
  });
});

describe('le vrai dry hop : actif et après, chacun à la dose de la règle', () => {
  const r = m.proposeVoies(R21C, { citrus: 1 }, { ...GRAND, dryHop: true });
  const d = r.dryHop!;
  const delta = r.direction[0].delta;
  /** La règle, recalculée sans passer par proposeVoies : la dose de la grille dont l'effet agrumes s'approche le plus de la visée (la plus petite à égalité). */
  const doseAttendue = (hopKey: string, moment: 'dryActive' | 'dryPost') => {
    let best = { g: 0, d: Infinity };
    for (const g of GRILLE_DRYHOP_GL) {
      const e = m.additionEffect({ id: 'x', hopKey, moment, grams: g * R21C.volumeL }, R21C)!.citrus.central!;
      if (Math.abs(e - delta) < best.d - 1e-9) best = { g, d: Math.abs(e - delta) };
    }
    return best.g;
  };
  it('propose actif ET après, avec des voies dans chaque groupe', () => {
    expect(d.actif.length).toBeGreaterThan(50);
    expect(d.apres.length).toBeGreaterThan(50);
    expect(d.actif.every((v) => v.actions[0].moment === 'dryActive')).toBe(true);
    expect(d.apres.every((v) => v.actions[0].moment === 'dryPost')).toBe(true);
  });
  it('la dose suit la règle : la dose du moment qui s\'approche le plus de la visée, multiple de 0,5 g/L, jamais l\'un des trois crans', () => {
    for (const [moment, groupe] of [['dryActive', d.actif], ['dryPost', d.apres]] as const) {
      for (const v of groupe.slice(0, 12)) {
        expect(gl(v)).toBe(doseAttendue(v.actions[0].hopKey, moment));
        expect(v.dose!.gPerL).toBe(gl(v));
        expect((gl(v) * 2) % 1).toBe(0);
        expect(gl(v)).toBeGreaterThanOrEqual(BORNES_DRYHOP_GL.min);
        expect(gl(v)).toBeLessThanOrEqual(BORNES_DRYHOP_GL.max);
      }
    }
    // Les deux moments ne donnent pas la même dose (le dry hop après fermentation rend plus par gramme) et aucune n'est un cran du solveur (2, 4, 6).
    expect(gl(d.actif[0])).toBe(1.5);
    expect(gl(d.apres[0])).toBe(1);
    expect([2, 4, 6]).not.toContain(gl(d.actif[0]));
    expect(d.actif[0].dose!.borne).toBeNull();
  });
  it('une visée hors des bornes borne la dose et le dit : « max » pour une visée énorme, « min » pour une visée minuscule', () => {
    const grand = m.proposeVoies(R21C, { citrus: 3 }, { ...MOYEN, dryHop: true }).dryHop!.actif;
    expect(grand.length).toBeGreaterThan(0);
    expect(grand.every((v) => gl(v) === BORNES_DRYHOP_GL.max && v.dose!.borne === 'max')).toBe(true);
    const petit = m.proposeVoies(R21C, { citrus: 0.05 }, { ...MOYEN, dryHop: true }).dryHop!.actif;
    expect(petit.every((v) => gl(v) === BORNES_DRYHOP_GL.min && v.dose!.borne === 'min')).toBe(true);
  });
  it('la règle est dite générique, avec ses bornes et ce qui a été cherché', () => {
    expect(d.regle).toBe(REGLE_DRYHOP);
    expect(d.regle.source).toBe('générique');
    expect(d.regle.bornes).toEqual({ min: 0.5, max: 8, pas: 0.5 });
    expect(d.regle.sourcesStyleCherchees).toContain('Beer Analytics');
  });
  it('un dry hop cumulé au-dessus du repère de revue (8 g/L) est signalé, jamais exclu', () => {
    const lourde: Recipe = { ...R21C, additions: [R21C.additions[0], { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 140 }] }; // 7 g/L déjà
    const avec = m.proposeVoies(lourde, { citrus: 1 }, { ...MOYEN, dryHop: true }).dryHop!.actif;
    expect(avec.length).toBe(40);
    expect(avec.every((v) => v.drapeaux?.[0]?.includes('repère de revue'))).toBe(true);
    expect(d.actif.every((v) => v.drapeaux === undefined)).toBe(true); // 80 g + 30 g : 5,5 g/L
  });
  it('le stock restant n\'impose aucune dose : il se dit à part', () => {
    const base = d.actif.find((v) => nom(v) === 'Galaxy')!;
    for (const [grams, statut] of [[37, 'suffisant'], [10, 'manque'], [200, 'suffisant']] as const) {
      const ms = creerMoteur({ catalogue: CATALOGUE, stock: [stockDe('beermaverick-galaxy', grams)] });
      const v = ms.proposeVoies(R21C, { citrus: 1 }, { ...MOYEN, dryHop: true }).dryHop!.actif.find((x) => nom(x) === 'Galaxy')!;
      expect(v.actions[0].grams).toBe(base.actions[0].grams); // 30 g, jamais 37, 10 ou 200
      expect(v.enStock).toBe(grams);
      expect(v.stock.status).toBe(statut);
      expect(v.stock.missing.length).toBe(statut === 'manque' ? 1 : 0);
    }
    expect(base.enStock).toBeNull();
  });
  it('une dose imposée (4 ou 8 g/L) : la même liste à cette dose, marquée générique ; la règle ne bouge pas', () => {
    const regle = m.proposeVoies(R21C, { citrus: 1 }, { ...MOYEN, dryHop: true }).dryHop!.actif;
    for (const dose of [4, 8]) {
      const imp = m.proposeVoies(R21C, { citrus: 1 }, { ...MOYEN, dryHop: { doseGL: dose } }).dryHop!;
      expect(imp.actif.length).toBeGreaterThan(30);
      expect(imp.actif.every((v) => gl(v) === dose && v.dose!.imposee === 'dose générique, sans source de style' && v.dose!.borne === null)).toBe(true);
      expect(imp.apres.every((v) => gl(v) === dose)).toBe(true);
      // 80 g déjà en dry hop (4 g/L) : 4 g/L de plus font 8, pas au-dessus du repère ; 8 g/L de plus font 12, signalés.
      expect(imp.actif.every((v) => (v.drapeaux?.length ?? 0) === (dose === 8 ? 1 : 0))).toBe(true);
    }
    expect(regle.every((v) => v.dose!.imposee === undefined && gl(v) < 4)).toBe(true);
    // L'effet monte puis sature : de 1,5 à 4 g/L plus que de 4 à 8, par g/L.
    const pts = (g: number) => m.additionEffect({ id: 'x', hopKey: 'beermaverick-citra', moment: 'dryActive', grams: g * 20 }, R21C)!.citrus.central!;
    expect((pts(4) - pts(1.5)) / 2.5).toBeGreaterThan(2 * ((pts(8) - pts(4)) / 4));
  });
  it('une famille qui ne monte pas : aucun groupe, une note', () => {
    const moins = m.proposeVoies(R21C, { resin: -1 }, { ...MOYEN, dryHop: true }).dryHop!;
    expect(moins.actif).toEqual([]);
    expect(moins.apres).toEqual([]);
    expect(moins.notes.join(' ')).toContain('famille qui monte');
  });
  it('le départage (g2a) se lit dans chaque groupe : k1 et k3 rétrécissent le premier groupe d\'ex æquo, mêmes voies, mêmes doses', () => {
    // D118 (f8) : le défaut est k3k1 ; l'ordre d'avant (alphabétique à distance égale) est 'aucun'.
    const d = m.proposeVoies(R21C, { citrus: 1 }, { ...GRAND, dryHop: true, departage: 'aucun' }).dryHop!;
    const tete = (vs: Voie[]) => vs.filter((v) => v.rank === 1).length;
    expect(tete(d.actif)).toBeGreaterThan(10); // aujourd'hui : un groupe d'ex æquo en ordre alphabétique
    expect(d.actif.every((v) => v.departage === undefined)).toBe(true);
    for (const cle of ['k1', 'k3'] as const) {
      const k = m.proposeVoies(R21C, { citrus: 1 }, { ...GRAND, dryHop: true, departage: cle }).dryHop!;
      expect(tete(k.actif)).toBeLessThan(tete(d.actif));
      expect(tete(k.apres)).toBeLessThan(tete(d.apres));
      expect(k.actif.map((v) => v.id).sort()).toEqual(d.actif.map((v) => v.id).sort());
      expect(k.actif.every((v) => v.departage?.mode === cle)).toBe(true);
      // La clé ne touche ni la dose ni l'effet.
      const dosesDe = (vs: Voie[]) => new Map(vs.map((v) => [v.id, JSON.stringify([v.actions[0].grams, v.effect, v.distance])]));
      const a = dosesDe(d.actif), b = dosesDe(k.actif);
      for (const [id, x] of a) expect(b.get(id)).toBe(x);
    }
  });
});
