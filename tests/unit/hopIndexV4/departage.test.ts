// Voie g2a-departage (D88) : trois clés de départage candidates (k1, k2, k3) dans proposeVoies. Pour chacune : l'ordre à l'intérieur d'un groupe
// d'ex æquo change, les effets (donc les barres de q2b) ne changent pas, l'inconnu passe après le connu. Le défaut reste 'aucun' : octet pour octet.
import { describe, expect, it } from 'vitest';
import { CATALOGUE } from '../../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import { cleDeVoie, cleHoublon, comparerCles, radarDe, signalDe } from '../../../src/domain/hopIndex/v4/departage';
import type { Recipe } from '../../../src/domain/hopIndex/v4/recipe';
import type { Voie } from '../../../src/domain/hopIndex/v4';
import type { Departage } from '../../../src/domain/hopIndex/v4/departage';

const m = creerMoteur({ catalogue: CATALOGUE, stock: [] }); // les 318 variétés, sans stock : comme le banc de g1
const R21C: Recipe = { name: 'Hazy du jeudi (21C)', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
const GRAND = { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false } as const;
const voies = (departage: Departage | undefined, moment: 'dryActive' | 'b10', dir: Record<string, number> = { citrus: 1 }) =>
  m.proposeVoies(R21C, dir, { ...GRAND, moments: [moment], ...(departage ? { departage } : {}) }).voies.filter((v) => v.type === 'ajouter');
const nom = (v: Voie) => v.actions[0].hopName;
/** Les voies qui partagent conflits, débordement et distance : le groupe d'ex æquo que le départage a le droit de réordonner.
 * D99 : le débordement du rang est overflowRang au dry hop (option c par défaut), overflowTotal ailleurs. */
const groupes = (vs: Voie[]) => {
  const g = new Map<string, Voie[]>();
  for (const v of vs) { const k = `${v.conflicts.length}|${v.overflowRang ?? v.overflowTotal}|${v.distance.total}`; (g.get(k) ?? g.set(k, []).get(k)!).push(v); }
  return [...g.values()];
};

describe('le défaut reste « aucun », octet pour octet', () => {
  it('sans option, avec \'aucun\' : même résultat, et aucune clé dans les voies', () => {
    const a = m.proposeVoies(R21C, { citrus: 1 }, { ...GRAND, moments: ['dryActive'] });
    const b = m.proposeVoies(R21C, { citrus: 1 }, { ...GRAND, moments: ['dryActive'], departage: 'aucun' });
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
    expect(JSON.stringify(a)).not.toContain('departage');
    expect(a.ranking.length).toBe(6);
  });
  it('un appel d\'écran (options par défaut, assemblages, leviers) est inchangé par \'aucun\'', () => {
    const a = m.proposeVoies(R21C, { citrus: 1 }, { leviersLevure: true });
    const b = m.proposeVoies(R21C, { citrus: 1 }, { leviersLevure: true, departage: 'aucun' });
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
  });
});

describe.each(['k1', 'k2', 'k3'] as const)('clé %s', (cle) => {
  const base = voies(undefined, 'dryActive'), avec = voies(cle, 'dryActive');
  it('l\'ordre à l\'intérieur du groupe d\'ex æquo du dry hop change, et les voies sont les mêmes', () => {
    expect(avec.map((v) => v.id).sort()).toEqual(base.map((v) => v.id).sort());
    // D106 (option a de f2) : depuis D105, l'ordre de qualité du pool est une clé du rang (après la distance, les grammes et le départage, avant les effets de bord) : deux houblons
    // n'ont plus jamais le même `rank` 1. La tête de ce test est donc le groupe d'ex æquo que le départage réordonne : les voies de la première voie qui partagent avec elle
    // toutes les clés placées AVANT l'ordre du pool (conflits, débordement du rang, distance, et la clé de départage quand elle est posée). Le moteur ne change pas.
    const tete = (vs: Voie[]) => {
      const p = vs[0];
      return vs.filter((v) => v.conflicts.length === p.conflicts.length && (v.overflowRang ?? v.overflowTotal) === (p.overflowRang ?? p.overflowTotal)
        && v.distance.total === p.distance.total && comparerCles(v.departage?.cle, p.departage?.cle) === 0).length;
    };
    expect(tete(base)).toBeGreaterThan(10); // le groupe d'ex æquo existe aujourd'hui (g1 : 23 sur la 21C)
    expect(avec.slice(0, 10).map(nom)).not.toEqual(base.slice(0, 10).map(nom));
    expect(tete(avec)).toBeLessThan(tete(base)); // la clé départage : le premier groupe rétrécit
    // La clé ne sort aucune voie de son groupe d'ex æquo : mêmes groupes (conflits, débordement, distance), dans le même ordre.
    expect(groupes(avec).map((g) => g.map((v) => v.id).sort())).toEqual(groupes(base).map((g) => g.map((v) => v.id).sort()));
  });
  it('les effets (donc les barres) et les distances ne changent pas', () => {
    const effets = (vs: Voie[]) => new Map(vs.map((v) => [v.id, JSON.stringify({ e: v.effect, d: v.distance, i: v.ibu, o: v.overflowTotal, c: v.conflicts })]));
    const e0 = effets(base), e1 = effets(avec);
    expect(e1.size).toBe(e0.size);
    for (const [id, x] of e0) expect(e1.get(id)).toBe(x);
  });
  it('l\'inconnu passe après le connu à l\'intérieur d\'un groupe, jamais à 0', () => {
    let inconnus = 0;
    for (const g of groupes(avec)) {
      let vu = false;
      for (const v of g) {
        const c = v.departage!.cle[0];
        if (c === null) { vu = true; inconnus++; } else expect(vu).toBe(false); // aucun connu après un inconnu
      }
    }
    // Témoin positif : sur le groupe de tête, k3 a bien des houblons sans radar, et eux seuls portent un null à la première étape.
    if (cle === 'k3') expect(inconnus).toBeGreaterThan(0);
    expect(avec.every((v) => v.departage && v.departage.mode === cle)).toBe(true);
  });
});

describe('à 10′ aussi, sans toucher aux effets', () => {
  it('k2 réordonne, mêmes effets', () => {
    const a = voies(undefined, 'b10', { tropical: 1 }), b = voies('k2', 'b10', { tropical: 1 });
    expect(b.map((v) => v.id).sort()).toEqual(a.map((v) => v.id).sort());
    const eff = (vs: Voie[]) => new Map(vs.map((v) => [v.id, JSON.stringify(v.effect)]));
    const ea = eff(a), eb = eff(b);
    for (const [id, x] of ea) expect(eb.get(id)).toBe(x);
  });
});

describe('les règles de la clé', () => {
  const citra = 'beermaverick-citra';
  it('k1 : la cascade fiche marquée, premier descripteur, part, signal (à défaut l\'huile totale)', () => {
    const c = cleHoublon('k1', citra, 'citrus');
    expect(c.cle.length).toBe(5);
    expect(c.cle[0]).toBe(1); // Citra est marqué agrumes
  });
  it('l\'inconnu n\'est jamais 0 : un houblon sans radar a une clé vide, pas nulle', () => {
    const sans = CATALOGUE.find((h) => !h.bm?.arome)!;
    expect(cleHoublon('k3', sans.id, 'citrus').cle).toEqual([null]);
    expect(cleHoublon('k3', 'inconnu-xyz', 'citrus').cle).toEqual([null]);
    const avecRadar = CATALOGUE.find((h) => h.bm?.arome && radarDe(h, 'citrus') === 0)!; // un 0 publié reste un 0 : connu
    expect(cleHoublon('k3', avecRadar.id, 'citrus').cle).toEqual([0]);
  });
  it('une famille sans axe sur le radar (melon) est inconnue, jamais 0', () => {
    expect(cleHoublon('k3', citra, 'melon').cle).toEqual([null]);
  });
  it('k2 n\'utilise jamais l\'huile totale : sans signal propre, la deuxième étape est inconnue', () => {
    const sans = CATALOGUE.find((h) => signalDe(h, 'citrus').valeur === null && (h.hs?.totalOil || h.oil))!;
    expect(cleHoublon('k2', sans.id, 'citrus').cle[1]).toBeNull();
    // k1, lui, retombe sur l'huile totale (niveau 1)
    expect(cleHoublon('k1', sans.id, 'citrus').cle[3]).toBe(1);
  });
  it('signal propre à la famille : linalol (agrumes, floral), myrcène (résineux), thiols (tropical), rien ailleurs', () => {
    const lin = CATALOGUE.find((h) => h.hsLinalool)!;
    expect(signalDe(lin, 'citrus').origine).toContain('linalol');
    expect(signalDe(lin, 'floral').origine).toContain('linalol');
    expect(signalDe(lin, 'spice').valeur).toBeNull();
    const myr = CATALOGUE.find((h) => h.oils.myrcene)!;
    expect(signalDe(myr, 'resin').origine).toContain('myrcène');
    const th = CATALOGUE.find((h) => h.hsThiol)!;
    expect(signalDe(th, 'tropical').origine).toContain('thiols');
  });
  it('comparerCles : le plus grand d\'abord, l\'inconnu après le connu (même 0), égalité à 0, clé absente à 0', () => {
    expect(comparerCles([3], [2])).toBeLessThan(0);
    expect(comparerCles([null], [0])).toBeGreaterThan(0);
    expect(comparerCles([0], [null])).toBeLessThan(0);
    expect(comparerCles([null], [null])).toBe(0);
    expect(comparerCles([1, 2], [1, 2])).toBe(0);
    expect(comparerCles([1, 5], [1, 4])).toBeLessThan(0);
    expect(comparerCles(undefined, [1])).toBe(0);
  });
  it('une voie sans ajout qui monte est neutre (tout inconnu) ; une moyenne inconnue d\'un côté rend l\'étape inconnue', () => {
    expect(cleDeVoie('k2', [], ['citrus']).cle).toEqual([null, null]);
    const sans = CATALOGUE.find((h) => !h.bm?.arome)!.id;
    expect(cleDeVoie('k3', [{ varietyId: citra, poids: 0.5 }, { varietyId: sans, poids: 0.5 }], ['citrus']).cle).toEqual([null]);
    expect(cleDeVoie('k3', [{ varietyId: citra, poids: 0.5 }, { varietyId: citra, poids: 0.5 }], ['citrus']).cle).toEqual([5]);
  });
});
