// Voie g2d-apport-minoritaire : MESURE des trois options d'apport minoritaire de Suggérer (c, m, w) contre 'aucun'. Aucune option n'est activée par défaut.
// Lancement, depuis la racine : npx vite-node scripts/eval-hop/apport-minoritaire.ts -- --sortie=<dossier>
// Sortie : mesure.json (déterministe : ni durée ni date) ; le sha256 est imprimé. Trois parties :
//  A. Suggérer : rang de dix houblons phares (L14) sur la 21C et la stout 16D, visées agrumes, tropical, floral, moments dry hop actif et 10′, sans départage et sous k3 ;
//  B. les barres de q2b : combien de barres (voie × famille) changent, et de combien, sur la demande de q2b (stout 16D) et sur la recette de m6 (21C), listes de l'app ;
//  C. Substituer v2 et Ma bière : ce qui lit `cites` / l'effet établi, et l'étiquette « floral +1 » de Ma bière pour tout le catalogue.
// Les durées vont dans couts-<option>.json (hors du sha256) : npx vite-node scripts/eval-hop/apport-minoritaire.ts -- --couts=<aucun|c|m|w> --sortie=<dossier>
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CATALOGUE } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { FAMILIES, FAMILY_NAMES, type FamilyId } from '../../src/domain/hopIndex/v4/families';
import type { Recipe, MomentId } from '../../src/domain/hopIndex/v4/recipe';
import type { FamilyEffect, Voie, VoieResult } from '../../src/domain/hopIndex/v4';
import type { ApportMinoritaire } from '../../src/domain/hopIndex/v4/minoritaire';
import type { Departage } from '../../src/domain/hopIndex/v4/departage';
import { marquee } from '../../src/domain/hopIndex/v4/hops';

const args = process.argv.slice(2);
const SORTIE = resolve(args.find((a) => a.startsWith('--sortie='))?.split('=')[1] ?? 'work/missions/2026-10-25-integration-houblons/voies/g2d-apport-minoritaire');
const COUTS = args.find((a) => a.startsWith('--couts='))?.split('=')[1] as ApportMinoritaire | undefined;
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] }); // les 318 variétés, sans stock (comme g1, g2a, g2b)
const parId = new Map(CATALOGUE.map((h) => [h.id, h]));
const nom = (id: string) => parId.get(id)?.name ?? id;
const MODES: ApportMinoritaire[] = ['aucun', 'c', 'm', 'w'];
const R21C: Recipe = { name: 'Hazy du jeudi (21C)', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
const R16D: Recipe = { name: 'Stout export (16D)', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
const GRAND = { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false } as const;
const r1 = (x: number, n = 2) => Math.round(x * 10 ** n) / 10 ** n;

// ---------- Coûts (hors sha256) : un processus par option, le premier appel est à froid ----------
if (COUTS) {
  const t = () => performance.now();
  const dir = { citrus: 1 } as const;
  const app = { assemblages: true, apportMinoritaire: COUTS };
  const c0 = t(); m.proposeVoies(R21C, dir, app); const froid = t() - c0;
  const chaud: number[] = [];
  for (let i = 0; i < 7; i++) { const a = t(); m.proposeVoies(R21C, dir, app); chaud.push(t() - a); }
  chaud.sort((a, b) => a - b);
  const g0 = t(); m.proposeVoies(R21C, dir, { ...GRAND, moments: ['dryActive'], apportMinoritaire: COUTS }); const grandFroid = t() - g0;
  const g1: number[] = [];
  for (let i = 0; i < 3; i++) { const a = t(); m.proposeVoies(R21C, dir, { ...GRAND, moments: ['dryActive'], apportMinoritaire: COUTS }); g1.push(t() - a); }
  g1.sort((a, b) => a - b);
  const e0 = t(); for (const h of CATALOGUE) m.additionEffect({ id: 'x', hopKey: h.id, moment: 'b10', grams: 10 }, R21C, COUTS);
  const effets = t() - e0;
  const sortie = { option: COUTS, 'liste de l\'app (limites 10 et 4, 21C, plus d\'agrumes), ms': { froid: r1(froid, 0), chaudMediane: r1(chaud[3], 0) },
    'liste complète (152 houblons, dry hop actif), ms': { froid: r1(grandFroid, 0), chaudMediane: r1(g1[1], 0) },
    'additionEffect sur les 318 variétés (Ma bière), ms au total': r1(effets, 0), note: 'Durées : non déterministes, hors du sha256. Un processus par option.' };
  mkdirSync(SORTIE, { recursive: true });
  writeFileSync(join(SORTIE, `couts-${COUTS}.json`), JSON.stringify(sortie, null, 1));
  console.log(JSON.stringify(sortie));
  process.exit(0);
}

// ---------- A. Rang des houblons phares ----------
const PHARES = ['citra', 'nelson-sauvin', 'motueka', 'mosaic', 'galaxy', 'hallertau-blanc', 'cascade', 'idaho-7', 'strata', 'simcoe'].map((s) => `beermaverick-${s}`);
const VISEES: [string, FamilyId][] = [['agrumes', 'citrus'], ['tropical', 'tropical'], ['floral', 'floral']];
const MOMENTS: [string, MomentId][] = [['dry hop actif', 'dryActive'], ['10′', 'b10']];
const RECETTES: [string, Recipe][] = [['21C', R21C], ['16D', R16D]];
const DEPARTAGES: Departage[] = ['aucun', 'k3'];
const hopDe = (v: Voie) => v.actions[0].hopKey;
/** Les ajouts seuls, dans l'ordre de la réponse ; rang partagé (ex æquo = même rang) recalculé parmi les ajouts. */
function liste(r: VoieResult) {
  const aj = r.voies.filter((v) => v.type === 'ajouter');
  let rang = 0;
  const lignes = aj.map((v, i) => { if (i === 0 || m.compareRankKeys(aj[i - 1], v) !== 0) rang = i + 1; return { v, rang, groupe: 0 }; });
  const taille = new Map<number, number>();
  for (const l of lignes) taille.set(l.rang, (taille.get(l.rang) ?? 0) + 1);
  for (const l of lignes) l.groupe = taille.get(l.rang)!;
  return lignes;
}
const partieA: unknown[] = [];
for (const [code, rec] of RECETTES) for (const [vl, fam] of VISEES) for (const [ml, mo] of MOMENTS) for (const dp of DEPARTAGES) {
  const parMode: Record<string, ReturnType<typeof liste>> = {};
  const sc = (m.proposeVoies(rec, { [fam]: 1 }, { ...GRAND, moments: [mo], departage: dp }).style);
  for (const ap of MODES) parMode[ap] = liste(m.proposeVoies(rec, { [fam]: 1 }, { ...GRAND, moments: [mo], departage: dp, apportMinoritaire: ap }));
  const phares = PHARES.map((id) => ({
    houblon: nom(id), citeLaVisee: m.citations(id)[fam].status === 'cité',
    ...Object.fromEntries(MODES.map((ap) => {
      const l = parMode[ap].find((x) => hopDe(x.v) === id);
      if (!l) return [ap, null];
      const e = l.v.effect[fam];
      return [ap, { rang: l.rang, groupe: l.groupe, position: parMode[ap].indexOf(l) + 1, sur: parMode[ap].length, conflits: l.v.conflicts.length, debordement: l.v.overflowTotal, debordementRang: l.v.overflowRang ?? null,
        effetVisee: e.established && e.central !== null ? r1(e.central / sc.families[fam].cran) : null, minoritaire: e.minoritaire === true }];
    })),
  }));
  partieA.push({ cas: `${code} · plus de ${vl} · ${ml} · départage ${dp}`, recette: code, visee: vl, moment: ml, departage: dp,
    ajouts: Object.fromEntries(MODES.map((ap) => [ap, parMode[ap].length])),
    // Houblons gardés dans les deux listes dont la dose retenue (le voie.id) n'est plus la même : la dose suit le rang de la voie.
    dosesQuiChangent: Object.fromEntries(MODES.filter((ap) => ap !== 'aucun').map((ap) => {
      const avant = new Map(parMode.aucun.map((l) => [hopDe(l.v), l.v.id]));
      return [ap, parMode[ap].filter((l) => avant.has(hopDe(l.v)) && avant.get(hopDe(l.v)) !== l.v.id).length];
    })),
    premierGroupe: Object.fromEntries(MODES.map((ap) => [ap, parMode[ap].filter((x) => x.rang === 1).length])),
    tete5: Object.fromEntries(MODES.map((ap) => [ap, parMode[ap].slice(0, 5).map((x) => nom(hopDe(x.v)))])),
    phares });
  process.stderr.write(`[g2d] A ${code} ${vl} ${ml} ${dp}\n`);
}

// ---------- B. Les barres de q2b ----------
// Une barre = une famille d'une voie de la liste de l'app. État affiché (afterCrans) : « non établi », « ≈ » sous le seuil d'écart du style, ou le nombre entier de crans.
const etat = (e: FamilyEffect, sc: VoieResult['style'], f: FamilyId): string => {
  if (!e.established || e.central === null) return 'non établi';
  const fs = sc.families[f];
  return Math.abs(e.central) < fs.threshold ? '≈' : String(Math.round(e.central / fs.cran));
};
const crans = (e: FamilyEffect, sc: VoieResult['style'], f: FamilyId): number | null => (e.established && e.central !== null ? e.central / sc.families[f].cran : null);
const DEMANDE_Q2B = { floral: 1, citrus: 1, resin: -1 } as const; // les trois cartes de q2b : Moins résineux, Plus floral, Plus agrumes
const CAS_B: [string, Recipe, Partial<Record<FamilyId, number>>, string][] = [
  ['q2b · stout 16D · Moins résineux, Plus floral, Plus agrumes', R16D, DEMANDE_Q2B, 'états de choix/etats/suggerer.json (liste de l\'app, 10′, 60′, assemblages, dry hop)'],
  ['m6 · Hazy 21C · Plus d\'agrumes', R21C, { citrus: 1 }, 'recette de m6'],
  ['m6 · Hazy 21C · Plus d\'agrumes, plus de floral, moins résineux', R21C, DEMANDE_Q2B, 'recette de m6, demande de q2b'],
];
const LISTES_APP: [string, Parameters<typeof m.proposeVoies>[2]][] = [['proposer (assemblages)', { assemblages: true }], ['leviers (dry hop actif, levure)', { assemblages: false, leviersLevure: true }]];
const partieB: unknown[] = [];
for (const [cas, rec, dir, source] of CAS_B) for (const [ln, opt] of LISTES_APP) {
  const ref = m.proposeVoies(rec, dir, opt);
  const sc = ref.style;
  const refParId = new Map(ref.voies.map((v, i) => [v.id, { v, i }]));
  const parOption = MODES.filter((ap) => ap !== 'aucun').map((ap) => {
    const res = m.proposeVoies(rec, dir, { ...opt, apportMinoritaire: ap });
    const resParId = new Map(res.voies.map((v, i) => [v.id, { v, i }]));
    const communes = ref.voies.filter((v) => resParId.has(v.id));
    let barres = 0, barresVisibles = 0, changeEtat = 0, changeEtabli = 0, somme = 0, max = 0;
    const parFamille: Record<string, number> = {};
    const grandes: { voie: string; famille: string; avant: number | null; apres: number | null; delta: number }[] = [];
    for (const v of communes) {
      const w = resParId.get(v.id)!.v;
      for (const f of FAMILIES) {
        barres++;
        const a = etat(v.effect[f], sc, f), b = etat(w.effect[f], sc, f);
        if (a !== 'non établi' || b !== 'non établi') barresVisibles++;
        if (a !== b) { changeEtat++; parFamille[f] = (parFamille[f] ?? 0) + 1; }
        if (v.effect[f].established !== w.effect[f].established) changeEtabli++;
        const ca = crans(v.effect[f], sc, f), cb = crans(w.effect[f], sc, f);
        const d = Math.abs((cb ?? 0) - (ca ?? 0));
        if (d > 0) { somme += d; max = Math.max(max, d); grandes.push({ voie: v.label, famille: FAMILY_NAMES[f], avant: ca === null ? null : r1(ca), apres: cb === null ? null : r1(cb), delta: r1(d) }); }
      }
    }
    grandes.sort((x, y) => y.delta - x.delta || x.voie.localeCompare(y.voie, 'fr') || x.famille.localeCompare(y.famille, 'fr'));
    const bouges = communes.filter((v) => resParId.get(v.id)!.i !== refParId.get(v.id)!.i);
    return { option: ap, voiesAvant: ref.voies.length, voiesApres: res.voies.length, communes: communes.length,
      perdues: ref.voies.filter((v) => !resParId.has(v.id)).map((v) => v.label), nouvelles: res.voies.filter((v) => !refParId.has(v.id)).map((v) => v.label),
      memeVoieAuMemeRang: ref.voies.filter((v, i) => res.voies[i]?.id === v.id).length,
      barresAvecValeurListeAvant: ref.voies.reduce((s, v) => s + FAMILIES.filter((f) => v.effect[f].established).length, 0),
      barresAvecValeurListeApres: res.voies.reduce((s, v) => s + FAMILIES.filter((f) => v.effect[f].established).length, 0),
      barresTotales: barres, barresAvecValeur: barresVisibles, barresDontLEtatChange: changeEtat, barresDontLEtabliChange: changeEtabli,
      sommeDesEcartsEnCrans: r1(somme), plusGrandEcartEnCrans: r1(max), changementsParFamille: parFamille, voiesChangeantDePlace: bouges.length,
      tete5Avant: ref.voies.slice(0, 5).map((v) => v.label), tete5Apres: res.voies.slice(0, 5).map((v) => v.label), plusGrandsEcarts: grandes.slice(0, 8) };
  });
  partieB.push({ cas, source, liste: ln, parOption });
  process.stderr.write(`[g2d] B ${cas} ${ln}\n`);
}

// ---------- C. Substituer v2 et Ma bière ----------
const style21C = m.getStyleScale('21C');
const subst = ['galaxy', 'nelson-sauvin'].map((s) => `beermaverick-${s}`).map((id) => ({
  houblon: nom(id), moment: 'dry hop actif (21C)', remplacants: m.substitutes(id, { moment: 'dryActive', recipe: R21C, style: style21C, limit: 6 }).remplacants.map((x) => x.name) }));
// L'étiquette de la carte de Ma bière (Carte.tsx effetTag, legende-bande.tsx effetSiAjoute) : la famille attendue qui bouge d'abord, sinon la première, en crans arrondis.
const COURT = (f: FamilyId) => FAMILY_NAMES[f].toLowerCase();
function etiquette(rec: Recipe, id: string, mo: MomentId, grams: number, ap: ApportMinoritaire): string {
  const sc = m.getStyleScale(rec.styleCode);
  const eff = m.additionEffect({ id: 'x', hopKey: id, moment: mo, grams }, rec, ap);
  if (!eff) return 'effet non établi';
  const c = (f: FamilyId) => { const e = eff[f]; return e && e.established && e.central != null ? Math.round(Math.round((e.central / sc.families[f].cran) * 100) / 100) : 0; };
  const fs = sc.order.filter((f) => c(f) !== 0);
  const f = fs.find((x) => sc.families[x].status === 'attendue') ?? fs[0];
  return f ? `${COURT(f)} ${c(f) > 0 ? '+' : '−'}${Math.abs(c(f))}` : '≈ inchangé';
}
const AJOUTS: [string, MomentId, number][] = [['10′, 10 g', 'b10', 10], ['dry hop actif, 40 g (2 g/L)', 'dryActive', 40]];
const partieC = { substituer: { note: 'Aucune option : substitution.ts lit describeFamilies et marquee (D90), jamais cites ni l\'effet établi des voies. La liste est la même sous c, m et w.', listes: subst },
  maBiere: RECETTES.flatMap(([code, rec]) => AJOUTS.map(([al, mo, g]) => {
    const ids = CATALOGUE.map((h) => h.id);
    const base = ids.map((id) => etiquette(rec, id, mo, g, 'aucun'));
    const parOption = (['m', 'w'] as const).map((ap) => {
      const e = ids.map((id) => etiquette(rec, id, mo, g, ap));
      const diff = ids.filter((_, i) => e[i] !== base[i]);
      return { option: ap, etiquettesQuiChangent: diff.length, sur: ids.length,
        parmiLesPhares: PHARES.map((id) => ({ houblon: nom(id), avant: base[ids.indexOf(id)], apres: e[ids.indexOf(id)] })).filter((x) => x.avant !== x.apres) };
    });
    const phares = PHARES.map((id) => ({ houblon: nom(id), aucun: base[ids.indexOf(id)] }));
    return { recette: code, ajout: al, 'c': 'identique à aucun (le rang seul ne change aucun effet)', parOption, phares };
  })) };

// ---------- E. Les fiches des phares : d'où vient chaque effet (fiches qui citent la famille / fiches lues ; marquée = la moitié au moins, D90) ----------
const partieE = PHARES.map((id) => m.dans(() => {
  const d = m.describeFamilies(id);
  return { houblon: nom(id), fichesLues: Math.max(...FAMILIES.map((f) => d[f].of)),
    familles: FAMILIES.filter((f) => d[f].sources > 0).map((f) => ({ famille: f, fiches: `${d[f].sources}/${d[f].of}`, marquee: marquee(id, f),
      statut21C: m.getStyleScale('21C').families[f].status, statut16D: m.getStyleScale('16D').families[f].status })) };
}));

const sortie = { voie: 'g2d-apport-minoritaire', options: { aucun: 'défaut, inchangé', c: 'rang seul : débordement d\'une famille marquée', m: 'effet si marquée', w: 'effet pondéré par la part des fiches' },
  A: partieA, B: partieB, C: partieC, E: partieE };
const texte = JSON.stringify(sortie, null, 1);
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, 'mesure.json'), texte);
console.log(`mesure.json ${texte.length} octets ; sha256 ${createHash('sha256').update(texte).digest('hex')}`);
