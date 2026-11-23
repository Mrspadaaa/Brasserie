// Voie g2c-exclusion-style (D90, 26.10) : MESURE d'une exclusion de houblons par le style ou par une visée « moins de … ». Aucun effet sur le dépôt.
// Le script lit le moteur de la RACINE où il est lancé (imports relatifs) : il se lance donc trois fois, une par état du code, depuis trois racines :
//   prod  : `git archive 49907352 src functions/src …` vers un dossier court de os.tmpdir(), node_modules en jonction ;
//   head  : idem avec HEAD ;
//   d90   : la racine du dépôt, avec la correction.
// Lancement (dans chaque racine) : npx vite-node scripts/eval-hop/exclusion-style.ts -- --etat=<prod|head|d90> --sortie=<dossier>
// Sortie : exclusion-style-<etat>.json (déterministe : ni durée ni date) ; le sha256 est imprimé. Parties :
//  A. le pool : variétés retirées de la liste « ajouter » par le style (21C, 16D, 23A, 23G, comparées au même cas sous le style 21A, qui n'a aucune
//     famille indésirable) et par une visée « moins de résineux » (16D et 21C, comparées à la même visée sans le « moins »). Un houblon est « exclu » s'il
//     figure, pour au moins une famille montée (les 12), dans la liste de base et pas dans l'autre : mesuré par le moteur, jamais recalculé ici ;
//  B. les houblons phares : exclu ou non, et les fiches qui citent chaque famille en cause (fiches / fiches lues, niveau d'affichage) ;
//  C. les 10 premières voies de Suggérer sur la 21C (« plus d'agrumes », « plus de tropical »), avec le stock des fixtures puis avec tout le catalogue en stock
//     (là, un houblon exclu par le style reste proposé, mais en conflit : c'est la première clé du classement) ;
//  D. Substituer sur la 21C au dry hop : les remplaçants de Galaxy et de Nelson Sauvin, conflits de style compris.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CATALOGUE, STOCK } from '../../src/domain/hopIndex/v4/data';
import type { StockHop } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { FAMILIES, type FamilyId } from '../../src/domain/hopIndex/v4/families';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';

const args = process.argv.slice(2);
const ETAT = args.find((a) => a.startsWith('--etat='))?.split('=')[1] ?? 'inconnu';
const SORTIE = resolve(args.find((a) => a.startsWith('--sortie='))?.split('=')[1] ?? 'work/missions/2026-10-25-integration-houblons/voies/g2c-exclusion-style');
const t0 = performance.now();
const chrono = (nom: string) => process.stderr.write(`[g2c ${ETAT}] ${nom} ${(performance.now() - t0).toFixed(0)} ms\n`);

const m = creerMoteur({ catalogue: CATALOGUE, stock: [] }); // les variétés du catalogue, aucune en stock : tout vient du pool « à acheter »
const toutEnStock: StockHop[] = CATALOGUE.map((h) => ({ key: h.id, varietyId: h.id, form: 'unknown', grams: 500, alpha: null, alphaFrom: null, items: [] }));
const mStock = creerMoteur({ catalogue: CATALOGUE, stock: toutEnStock });
const mFixtures = creerMoteur({ catalogue: CATALOGUE, stock: STOCK });
const nom = (id: string) => CATALOGUE.find((h) => h.id === id)?.name ?? id;

const R21C: Recipe = { name: 'Hazy du jeudi (21C)', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
const R16D: Recipe = { name: 'Stout export (16D)', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
const sous = (r: Recipe, code: string): Recipe => ({ ...r, styleCode: code });
const GRAND = { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['dryActive'] as ['dryActive'] };
const PHARES = ['citra', 'nelson-sauvin', 'motueka', 'galaxy', 'mosaic', 'hallertau-blanc', 'cascade', 'idaho-7', 'simcoe', 'strata'].map((s) => `beermaverick-${s}`);

/** Variétés de la liste « ajouter » (une voie par houblon et par moment ; ici un seul moment). */
function pool(r: Recipe, dir: Partial<Record<FamilyId, number>>): Set<string> {
  const res = m.proposeVoies(r, dir, GRAND);
  return new Set(res.voies.filter((v) => v.type === 'ajouter').map((v) => m.hopRef(v.actions[0].hopKey)!.varietyId));
}
/** Ensemble des variétés retirées : présentes dans la base pour une famille montée, absentes de l'autre. */
function retirees(base: (f: FamilyId) => Set<string>, autre: (f: FamilyId) => Set<string>, familles: FamilyId[]) {
  const out = new Set<string>(), uBase = new Set<string>(), uAutre = new Set<string>();
  for (const f of familles) {
    const b = base(f), a = autre(f);
    for (const id of b) { uBase.add(id); if (!a.has(id)) out.add(id); }
    for (const id of a) uAutre.add(id);
  }
  return { out, tailleBase: uBase.size, taillePool: uAutre.size };
}

// ---------- A. Le pool ----------
const baseStyle = new Map<FamilyId, Set<string>>(); // le cas sous le style 21A (aucune famille indésirable)
for (const f of FAMILIES) baseStyle.set(f, pool(sous(R21C, '21A'), { [f]: 1 }));
chrono('A base');
const sansResine = FAMILIES.filter((f) => f !== 'resin');
interface Cas { cas: string; sorte: 'style' | 'visée'; style: string; retirees: Set<string>; tailleBase: number; taillePool: number }
const cas: Cas[] = [];
for (const [code, r] of [['21C', R21C], ['16D', R16D], ['23A', R21C], ['23G', R21C]] as const) {
  const rec = sous(r, code);
  const x = retirees((f) => baseStyle.get(f)!, (f) => pool(rec, { [f]: 1 }), [...FAMILIES]);
  cas.push({ cas: `style ${code}`, sorte: 'style', style: code, retirees: x.out, tailleBase: x.tailleBase, taillePool: x.taillePool });
  chrono(`A style ${code}`);
}
for (const [code, r] of [['16D', R16D], ['21C', R21C]] as const) {
  const x = retirees((f) => pool(r, { [f]: 1 }), (f) => pool(r, { [f]: 1, resin: -1 }), sansResine);
  cas.push({ cas: `visée « moins de résineux » · ${code}`, sorte: 'visée', style: code, retirees: x.out, tailleBase: x.tailleBase, taillePool: x.taillePool });
  chrono(`A visée ${code}`);
}
const partieA = cas.map((c) => ({
  // variétés distinctes de la liste de base (une famille montée au moins), et de l'autre liste ; retirees = base sans l'autre.
  cas: c.cas, retirees: c.retirees.size, variétésDeBase: c.tailleBase, variétésRestantes: c.taillePool,
  exemples: [...c.retirees].sort().slice(0, 12).map(nom),
}));

// ---------- B. Les phares ----------
const FAM_STYLE: FamilyId[] = ['herbal', 'green'];
const fiches = (id: string, f: FamilyId) => { const d = m.describeFamilies(id)[f]; return { sources: d.sources, sur: d.of, niveau: d.level, moitie: d.sources > 0 && 2 * d.sources >= d.of }; };
const partieB = PHARES.map((id) => {
  const get = (c: string) => cas.find((x) => x.cas === c)!;
  return {
    houblon: nom(id),
    cite: FAM_STYLE.concat('resin').filter((f) => m.citations(id)[f].status === 'cité'),
    herbal: fiches(id, 'herbal'), green: fiches(id, 'green'), resin: fiches(id, 'resin'),
    exclu21C: get('style 21C').retirees.has(id), exclu23A: get('style 23A').retirees.has(id),
    excluMoinsResine16D: get('visée « moins de résineux » · 16D').retirees.has(id), excluMoinsResine21C: get('visée « moins de résineux » · 21C').retirees.has(id),
  };
});
// Les trois lectures possibles de « citée » sur tout le catalogue : une fiche (l'ancienne règle), le niveau d'affichage « marqué » (deux fiches, ou
// premier descripteur), la moitié au moins des fiches (D90). Variétés qui citent au moins une des familles données.
const lectures = (familles: FamilyId[]) => {
  const n = { uneFiche: 0, niveauMarque: 0, moitie: 0 };
  for (const h of CATALOGUE) {
    const d = m.describeFamilies(h.id);
    if (familles.some((f) => d[f].sources > 0)) n.uneFiche++;
    if (familles.some((f) => d[f].level === 'marqué')) n.niveauMarque++;
    if (familles.some((f) => d[f].sources > 0 && 2 * d[f].sources >= d[f].of)) n.moitie++;
  }
  return n;
};
const partieE = { catalogue: CATALOGUE.length, '21C : herbacé ou végétal vert': lectures(['herbal', 'green']), 'moins de résineux : résineux': lectures(['resin']) };
chrono('B');

// ---------- C. Les 10 premières voies de Suggérer sur la 21C ----------
const VISEES: [string, FamilyId][] = [['plus d’agrumes', 'citrus'], ['plus de tropical', 'tropical']];
const partieC = (['fixtures', 'catalogue entier en stock'] as const).flatMap((jeu) => VISEES.map(([vl, f]) => {
  const res = (jeu === 'fixtures' ? mFixtures : mStock).proposeVoies(R21C, { [f]: 1 });
  return { jeu, visee: vl, voies: res.voies.slice(0, 10).map((v) => ({ rang: v.rank, label: v.label, conflits: v.conflicts.length, domaine: v.domain, distance: v.distance.total })) };
}));
chrono('C');

// ---------- D. Substituer sur la 21C ----------
const style21C = m.getStyleScale('21C');
const partieD = ['beermaverick-galaxy', 'beermaverick-nelson-sauvin'].map((key) => {
  const r = m.substitutes(key, { moment: 'dryActive', recipe: R21C, style: style21C, limit: 400 });
  const lignes = r.remplacants;
  return {
    original: nom(key), candidats: r.candidats, avecConflitStyle: lignes.filter((l) => l.conflitsStyle.length).length,
    dix: lignes.slice(0, 10).map((l) => ({ rang: l.rank, nom: l.name, score: l.score, conflitsStyle: l.conflitsStyle })),
    phares: PHARES.filter((id) => id !== key).map((id) => { const l = lignes.find((x) => x.key === id); return { nom: nom(id), rang: l?.rank ?? null, score: l?.score ?? null, conflitsStyle: l?.conflitsStyle ?? null }; }),
  };
});
chrono('D');

const sortie = { etat: ETAT, catalogue: CATALOGUE.length, partieA, partieB, partieC, partieD, partieE };
const texte = JSON.stringify(sortie, null, 1);
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, `exclusion-style-${ETAT}.json`), texte);
process.stdout.write(`exclusion-style-${ETAT}.json sha256 ${createHash('sha256').update(texte).digest('hex')}\n`);
