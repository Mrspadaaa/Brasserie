// Voie e2-moteur-substitution (#181, D80) : le moteur v2 de substitutes() (src/domain) fait le même calcul que sa mesure hors ligne
// (scripts/eval-hop/moteur-v2.ts, formule dans formuleV2.ts) : mêmes scores et même ordre, sur 30 houblons et aux trois moments.
import { describe, expect, it } from 'vitest';
import { CATALOGUE } from '../../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import { FAMILIES } from '../../../src/domain/hopIndex/v4/families';
import { roleFromAlpha } from '../../../src/domain/hopIndex/v4/roles';
import { WEIGHTS_MOMENT } from '../../../src/domain/hopIndex/v4/substitution';
import { NV, motsPoids, poidsV2, similitudes, sigmaDe, type FicheV2, type Moment3, type R } from '../../../scripts/eval-hop/formuleV2';

const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const ok = (r: R | null | undefined): R | null => (r && Number.isFinite(r[0]) && Number.isFinite(r[1]) && r[1] > 0 ? [r[0], r[1]] : null);
const norm = (x: string) => x.toLowerCase().replace(/[_-]+/g, ' ');
const fiches: FicheV2[] = CATALOGUE.map((h) => {
  const d = m.describeFamilies(h.id), w = m.familyWords(h.id);
  const levels = FAMILIES.map((f) => (d[f].level === 'marqué' ? 2 : d[f].level === 'cité' ? 1 : 0));
  const cited = levels.some((l) => l > 0), marked = levels.some((l) => l === 2);
  const mots = new Set<string>();
  for (const f of FAMILIES) for (const row of w.mots[f]) for (const x of row.mots) mots.add(norm(x));
  for (const x of w.sansFamille) mots.add(norm(x.mot));
  const alpha = ok(h.alpha);
  return {
    alpha, beta: ok(h.beta), cohu: ok(h.cohumulone), huile: ok(h.oil ?? h.hs?.totalOil), myr: ok(h.oils.myrcene), hum: ok(h.oils.humulene), car: ok(h.oils.caryophyllene),
    far: ok(h.oils.farnesene), lin: ok(h.hsLinalool?.range), ger: null, role: alpha ? roleFromAlpha((alpha[0] + alpha[1]) / 2, marked) : null,
    aromaV: cited ? FAMILIES.map((f, k) => (d[f].of ? (levels[k] / 2) * (d[f].sources / d[f].of) : 0)) : null, levels, mots,
    radar: h.bm?.arome && h.bm.arome.some((x) => x > 0) ? h.bm.arome : null,
  };
});
const sigma = sigmaDe(fiches), mp = motsPoids(fiches);
const nomDe = new Map(CATALOGUE.map((c) => [c.id, c.name]));
// Poids appris par la phase 1 (rapport.md § 2) : groupes [amertume, huile, arôme] et part des mots.
const APPRIS: Record<Moment3, { g: [number, number, number]; r: number; moment: 'b60' | 'wp' | 'dryActive' }> = {
  am: { g: [0.7, 0.2, 0.1], r: 0.5, moment: 'b60' }, ch: { g: [0.3, 0.2, 0.5], r: 0.75, moment: 'wp' }, fr: { g: [0.2, 0.3, 0.5], r: 0.75, moment: 'dryActive' },
};
const TRENTE = [...CATALOGUE.map((_, i) => i).filter((i) => i % 10 === 0), ...['nelson-sauvin', 'cascade', 'citra'].map((s) => CATALOGUE.findIndex((h) => h.id === `beermaverick-${s}`))].slice(0, 30);

describe('substitutes() v2 = la formule mesurée hors ligne', () => {
  it('les poids des groupes de l\'app sont ceux appris par la phase 1', () => {
    for (const mo of ['am', 'ch', 'fr'] as const) {
      const [a, h, r] = APPRIS[mo].g, v = WEIGHTS_MOMENT[{ am: 'amertume', ch: 'chaud', fr: 'froid' }[mo] as 'amertume' | 'chaud' | 'froid'];
      expect([v.amertume, v.huiles, v.arome]).toEqual([a, h, r]);
    }
  });
  for (const mo of ['am', 'ch', 'fr'] as const) {
    it(`mêmes scores et même ordre, 30 houblons, moment « ${mo} »`, () => {
      const { g, r, moment } = APPRIS[mo], w = poidsV2(mo, g, r), s = new Float64Array(NV);
      expect(TRENTE.length).toBe(30);
      for (const o of TRENTE) {
        const res = m.substitutes(CATALOGUE[o].id, { moment });
        expect(res.remplacants.length).toBe(CATALOGUE.length - 1);
        const ref = new Map<string, { score: number; faible: boolean }>();
        CATALOGUE.forEach((c, j) => {
          if (j === o) return;
          s.fill(Number.NaN);
          similitudes(fiches[o], fiches[j], mo === 'am', sigma, mp[o], mp[j], s, 0);
          let tw = 0, num = 0;
          for (let v = 0; v < NV; v++) if (w[v] > 0 && s[v] === s[v]) { tw += w[v]; num += w[v] * s[v]; }
          ref.set(c.id, { score: tw > 0 ? Math.round((100 * num) / tw) : 0, faible: Number.isNaN(s[11]) && Number.isNaN(s[12]) });
        });
        for (const x of res.remplacants) expect([CATALOGUE[o].id, x.key, x.score]).toEqual([CATALOGUE[o].id, x.key, ref.get(x.key)!.score]);
        // Ordre : faible derrière, démotion d'amertume derrière (flag du moteur), score décroissant, nom.
        const demo = new Map(res.remplacants.map((x) => [x.key, !!x.amertumeDeconseillee]));
        const noms = new Intl.Collator('fr');
        const attendu = [...ref.entries()].sort(([ka, a], [kb, b]) => Number(a.faible) - Number(b.faible) || Number(demo.get(ka)) - Number(demo.get(kb)) || b.score - a.score || noms.compare(nomDe.get(ka)!, nomDe.get(kb)!)).map(([k]) => k);
        expect(res.remplacants.map((x) => x.key)).toEqual(attendu);
      }
    });
  }
  it('un inconnu n\'est jamais 0 : aucune composante rendue à 0 faute de donnée, et le texte de couverture dit ce qui manque', () => {
    const res = m.substitutes('beermaverick-nelson-sauvin', { moment: 'dryActive' });
    for (const x of res.remplacants) {
      if (!x.couverture.arome) expect(x.composantes.arome).toBeNull();
      if (x.couverture.huiles.length === 0) expect(x.composantes.huiles).toBeNull();
      if (x.couverture.amertume.length === 0) expect(x.composantes.amertume).toBeNull();
    }
    expect(res.manque.join(' ')).not.toMatch(/farnésène : publié/);
  });
});
