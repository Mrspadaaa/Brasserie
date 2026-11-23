// Voie g2a-departage (#181, D88) : mesure des trois clés de départage de Suggérer (k1, k2, k3) contre 'aucun'. MESURE seulement.
// Lancement, depuis la racine : npx vite-node scripts/eval-hop/departage.ts -- --sortie=<dossier>
// Sortie : departage.json (déterministe : ni durée ni date) ; le sha256 est imprimé. Quatre parties :
//  A. les houblons phares (L14) : rang de Citra, Nelson Sauvin, Motueka, Galaxy, Mosaic, Hallertau Blanc, Cascade pour « plus d'agrumes », « plus de
//     tropical », « plus de floral », au dry hop et à 10′, sur la 21C et la stout de g1, avec chaque clé ;
//  B. la provenance du départage : pour chaque clé et famille, parmi les variétés qui la citent, combien de paires sont séparées à chaque étape ;
//  C. le banc de 66 houblons de g1 (même échantillon, même graine), coupé en deux moitiés : choisir sur l'une, juger sur l'autre (L20) ;
//  D. les 10 listes à montrer au brasseur : pour chaque cas et chaque clé, les 10 premiers avec α, familles et valeur du départage.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CATALOGUE, bmLienId } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { FAMILIES, FAMILY_NAMES, type FamilyId } from '../../src/domain/hopIndex/v4/families';
import type { Recipe, MomentId } from '../../src/domain/hopIndex/v4/recipe';
import type { Voie, VoieResult } from '../../src/domain/hopIndex/v4';
import { ETAPES, cleHoublon, type Departage } from '../../src/domain/hopIndex/v4/departage';
import { arrondi, echantillon, mediane, rangMoyenGroupe, resume, type Obs } from './metriques';

const args = process.argv.slice(2);
const SORTIE = resolve(args.find((a) => a.startsWith('--sortie='))?.split('=')[1] ?? 'work/missions/2026-10-25-integration-houblons/voies/g2a-departage');
const GRAINE = 181; // celle de g1 : même échantillon de 66
const t0 = performance.now();
const chrono = (nom: string) => process.stderr.write(`[g2a] ${nom} ${(performance.now() - t0).toFixed(0)} ms\n`);

const m = creerMoteur({ catalogue: CATALOGUE, stock: [] }); // les 318 variétés, sans stock (comme g1)
const parId = new Map(CATALOGUE.map((h) => [h.id, h]));
const nom = (id: string) => parId.get(id)?.name ?? id;
const MODES: Departage[] = ['aucun', 'k1', 'k2', 'k3'];
const CLES = ['k1', 'k2', 'k3'] as const;

const R21C: Recipe = { name: 'Hazy du jeudi (21C)', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
const R16D: Recipe = { name: 'Stout export (16D)', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
const RECETTES: [string, Recipe][] = [['21C', R21C], ['16D', R16D]];
const VISEES: [string, FamilyId][] = [['agrumes', 'citrus'], ['tropical', 'tropical'], ['floral', 'floral']];
const MOMENTS: [string, MomentId][] = [['dry hop', 'dryActive'], ['10′', 'b10']];
const GRAND = { maxBuy: 400, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false } as const;

/** Les ajouts de la réponse, avec leur rang partagé (ex æquo = même rang), recalculé parmi les seuls ajouts. */
interface Ligne { v: Voie; rang: number; groupe: number }
function liste(r: VoieResult): Ligne[] {
  const aj = r.voies.filter((v) => v.type === 'ajouter');
  const lignes: Ligne[] = [];
  let rang = 0;
  aj.forEach((v, i) => { if (i === 0 || m.compareRankKeys(aj[i - 1], v) !== 0) rang = i + 1; lignes.push({ v, rang, groupe: 0 }); });
  const taille = new Map<number, number>();
  for (const l of lignes) taille.set(l.rang, (taille.get(l.rang) ?? 0) + 1);
  for (const l of lignes) l.groupe = taille.get(l.rang)!;
  return lignes;
}
const hopId = (l: Ligne) => l.v.actions[0].hopKey;
const proposer = (r: Recipe, dir: Partial<Record<FamilyId, number>>, mo: MomentId, d: Departage) => m.proposeVoies(r, dir, { ...GRAND, moments: [mo], departage: d });
const alphaDe = (id: string) => { const a = parId.get(id)?.alpha; return a ? [a[0], a[1]] : null; };
const citees = (id: string) => FAMILIES.filter((f) => m.citations(id)[f].status === 'cité');

// ---------- A. Houblons phares ----------
const PHARES = ['citra', 'nelson-sauvin', 'motueka', 'galaxy', 'mosaic', 'hallertau-blanc', 'cascade'].map((s) => `beermaverick-${s}`);
const partieA: unknown[] = [];
const casListes: { cas: string; recette: string; visee: string; moment: string; l: Record<string, Ligne[]> }[] = [];
for (const [code, rec] of RECETTES) for (const [vl, fam] of VISEES) for (const [ml, mo] of MOMENTS) {
  const listes = Object.fromEntries(MODES.map((d) => [d, liste(proposer(rec, { [fam]: 1 }, mo, d))])) as Record<string, Ligne[]>;
  casListes.push({ cas: `${code} · plus de ${vl} · ${ml}`, recette: code, visee: vl, moment: ml, l: listes });
  const rangs = PHARES.map((id) => ({
    houblon: nom(id), cite: m.citations(id)[fam].status === 'cité',
    ...Object.fromEntries(MODES.map((d) => {
      const l = listes[d].find((x) => hopId(x) === id);
      return [d, l ? { rang: l.rang, groupe: l.groupe, rangMoyen: rangMoyenGroupe(l.rang, l.groupe), sur: listes[d].length } : null];
    })),
  }));
  partieA.push({
    cas: `${code} · plus de ${vl} · ${ml}`, ajouts: listes.aucun.length,
    premierGroupe: Object.fromEntries(MODES.map((d) => [d, listes[d].filter((x) => x.rang === 1).length])),
    groupesDistincts: Object.fromEntries(MODES.map((d) => [d, new Set(listes[d].map((x) => x.rang)).size])),
    phares: rangs,
  });
}
chrono('A');

// ---------- B. Provenance du départage ----------
// Pour chaque clé et famille, parmi les variétés qui la citent : chaque paire est séparée à la première étape où les deux valeurs diffèrent
// (un inconnu face à un connu compte aussi, à part : l'ordre vient alors de la couverture des données, pas d'une mesure).
const partieB = (['citrus', 'tropical', 'floral', 'resin'] as FamilyId[]).map((f) => {
  const ids = CATALOGUE.filter((h) => m.citations(h.id)[f].status === 'cité').map((h) => h.id);
  const par = Object.fromEntries(CLES.map((k) => {
    const cles = ids.map((id) => ({ id, ...cleHoublon(k, id, f) }));
    const paires = (ids.length * (ids.length - 1)) / 2;
    const compte: Record<string, number> = {}, parInconnu: Record<string, number> = {};
    const ajoute = (o: Record<string, number>, cle: string) => { o[cle] = (o[cle] ?? 0) + 1; };
    for (let i = 0; i < cles.length; i++) for (let j = i + 1; j < cles.length; j++) {
      const a = cles[i], b = cles[j];
      let n = -1;
      for (let e = 0; e < a.cle.length; e++) if (a.cle[e] !== b.cle[e]) { n = e; break; }
      if (n < 0) { ajoute(compte, 'ex æquo (aucune étape ne sépare)'); continue; }
      let etape = ETAPES[k][n];
      // K1, 5e composante : on distingue le signal d'huile de l'huile totale (même niveau des deux côtés).
      if (k === 'k1' && n === 4) etape = a.cle[3] === 2 ? 'signal d’huile (valeur)' : 'huile totale (valeur)';
      ajoute(compte, `${n + 1}. ${etape}`);
      if (a.cle[n] === null || b.cle[n] === null) ajoute(parInconnu, `${n + 1}. ${etape}`);
    }
    const distincts = new Set(cles.map((c) => JSON.stringify(c.cle))).size;
    const tailleMax = Math.max(...Object.values(cles.reduce((o, c) => { const k2 = JSON.stringify(c.cle); o[k2] = (o[k2] ?? 0) + 1; return o; }, {} as Record<string, number>)));
    const extra = k === 'k1' ? {
      varietesParOrigineDeLEtape4: {
        'signal d’huile propre': cles.filter((c) => c.cle[3] === 2).length, 'huile totale (à défaut)': cles.filter((c) => c.cle[3] === 1).length, 'aucune donnée (inconnu)': cles.filter((c) => c.cle[3] === null).length,
      },
      valeursDistinctesDontHuileTotaleSeule: (() => {
        const tous = new Set(cles.map((c) => JSON.stringify(c.cle)));
        // Une valeur « vient de l'huile totale » quand le niveau est 1 : sa 5e composante est l'huile totale.
        return { total: tous.size, niveau1: new Set(cles.filter((c) => c.cle[3] === 1).map((c) => JSON.stringify(c.cle))).size, niveau2: new Set(cles.filter((c) => c.cle[3] === 2).map((c) => JSON.stringify(c.cle))).size, niveauInconnu: new Set(cles.filter((c) => c.cle[3] === null).map((c) => JSON.stringify(c.cle))).size };
      })(),
    } : {};
    return [k, { paires, separeesParEtape: Object.fromEntries(Object.entries(compte).sort(([a], [b]) => (a < b ? -1 : 1))), dontSeparationParInconnu: parInconnu, valeursDistinctes: distincts, plusGrandGroupeExAequo: tailleMax, ...extra }];
  }));
  return { famille: f, citent: ids.length, ...par };
});
chrono('B');

// ---------- C. Le banc de 66 houblons (g1), coupé en deux moitiés ----------
interface Cible { id: string; attendus: string[] }
const cibles: Cible[] = CATALOGUE.filter((h) => h.bm?.substituts && h.bm.substituts.length > 0).map((h) => ({
  id: h.id, attendus: [...new Set(h.bm!.substituts!.map((l) => bmLienId(l)).filter((x): x is string => !!x && x !== h.id && parId.has(x)))],
})).filter((c) => c.attendus.length > 0).sort((a, b) => (a.id < b.id ? -1 : 1));
const direction = (id: string): Partial<Record<FamilyId, number>> | null => {
  const d = m.describeFamilies(id);
  const f = FAMILIES.filter((x) => d[x].level !== 'non décrit').sort((a, b) => (d[b].level === 'marqué' ? 1 : 0) - (d[a].level === 'marqué' ? 1 : 0) || (d[b].sources / (d[b].of || 1)) - (d[a].sources / (d[a].of || 1)) || (FAMILIES.indexOf(a) - FAMILIES.indexOf(b)));
  const marquees = f.filter((x) => d[x].level === 'marqué');
  const choix = (marquees.length ? marquees : f.slice(0, 1)).slice(0, 3);
  return choix.length ? Object.fromEntries(choix.map((x) => [x, 1])) : null;
};
const eligibles = cibles.filter((c) => direction(c.id)).map((c) => c.id);
const PHARES_G1 = ['nelson-sauvin', 'citra', 'motueka', 'mosaic', 'galaxy', 'simcoe', 'saaz-cz', 'cascade', 'idaho-7'].map((s) => `beermaverick-${s}`);
const echant = [...new Set([...echantillon(eligibles, GRAINE, 60), ...PHARES_G1.filter((p) => eligibles.includes(p))])].sort();
const BASE_NEUTRE: Recipe = { name: 'neutre', styleCode: '', volumeL: 20, og: 1.050, boilMin: 60, yeastId: 'fermentis-us05', additions: [] };
interface LigneBanc { id: string; moitie: 'A' | 'B'; nListe: number; rangX: number | null; premierGroupe: number; distincts: number; obs: Obs; absents: number; total: number }
function banc(mo: MomentId, d: Departage): LigneBanc[] {
  return echant.map((id, i) => {
    const dir = direction(id)!;
    const l = liste(proposer(BASE_NEUTRE, dir, mo, d));
    const rangs = new Map(l.map((x) => [hopId(x), x]));
    const moyen = (k: string): number | null => { const x = rangs.get(k); return x ? rangMoyenGroupe(x.rang, x.groupe) : null; };
    const rx = moyen(id), c = cibles.find((x) => x.id === id)!;
    const obs: Obs = { rangs: c.attendus.map((k) => { const x = moyen(k); return x === null ? null : rx !== null && rx < x ? x - 1 : x; }) };
    return { id, moitie: i % 2 === 0 ? 'A' : 'B', nListe: l.length, rangX: rx, premierGroupe: l.length ? l[0].groupe : 0, distincts: new Set(l.map((x) => x.rang)).size, obs, absents: obs.rangs.filter((r) => r === null).length, total: obs.rangs.length };
  });
}
function metriques(ls: LigneBanc[]) {
  const avec = ls.filter((l) => l.nListe > 0);
  return {
    houblons: ls.length,
    premierGroupeMedian: mediane(avec.map((l) => l.premierGroupe)), groupesDistinctsMedian: mediane(avec.map((l) => l.distincts)), listeMediane: mediane(avec.map((l) => l.nListe)),
    rangXMedian: mediane(ls.filter((l) => l.rangX !== null).map((l) => l.rangX!)), XdansLesDix: ls.filter((l) => l.rangX !== null && l.rangX <= 10).length, XdansLaListe: ls.filter((l) => l.rangX !== null).length,
    rappel10_indicatif: resume(ls.map((l) => l.obs)).rappel10, mrr: resume(ls.map((l) => l.obs)).mrr,
  };
}
const partieC: Record<string, unknown> = { echantillon: echant.length, graine: GRAINE, moitiesParite: 'ids triés, rang pair = A, rang impair = B' };
for (const [ml, mo] of MOMENTS) {
  const lignes = Object.fromEntries(MODES.map((d) => [d, banc(mo, d)])) as Record<Departage, LigneBanc[]>;
  const parMoitie = Object.fromEntries((['A', 'B'] as const).map((h) => [h, Object.fromEntries(MODES.map((d) => [d, metriques(lignes[d].filter((l) => l.moitie === h))]))]));
  // Choix sur une moitié : la clé (k1, k2, k3) au premier groupe médian le plus petit, puis au rang médian de X le plus petit, puis dans l'ordre k1, k2, k3.
  const choix = Object.fromEntries((['A', 'B'] as const).map((h) => {
    const autre = h === 'A' ? 'B' : 'A';
    const sur = parMoitie[h] as Record<Departage, ReturnType<typeof metriques>>;
    const gagnante = [...CLES].sort((a, b) => (sur[a].premierGroupeMedian! - sur[b].premierGroupeMedian!) || ((sur[a].rangXMedian ?? 1e9) - (sur[b].rangXMedian ?? 1e9)) || (CLES.indexOf(a) - CLES.indexOf(b)))[0];
    const jug = parMoitie[autre] as Record<Departage, ReturnType<typeof metriques>>;
    return [`choisie_sur_${h}_jugee_sur_${autre}`, { cle: gagnante, surLaMoitieDeChoix: sur[gagnante], surLautreMoitie: jug[gagnante], aucunSurLautreMoitie: jug.aucun }];
  }));
  partieC[ml] = { toutes: Object.fromEntries(MODES.map((d) => [d, metriques(lignes[d])])), parMoitie, choix, lignes: Object.fromEntries(MODES.map((d) => [d, lignes[d].map((l) => ({ id: l.id, moitie: l.moitie, nListe: l.nListe, rangX: l.rangX, premierGroupe: l.premierGroupe, distincts: l.distincts }))])) };
  chrono(`C ${ml}`);
}

// ---------- D. Les 10 listes à montrer au brasseur ----------
const CAS_MONTRES = ['21C · plus de agrumes · dry hop', '21C · plus de agrumes · 10′', '21C · plus de tropical · dry hop', '21C · plus de tropical · 10′', '21C · plus de floral · dry hop',
  '16D · plus de agrumes · dry hop', '16D · plus de agrumes · 10′', '16D · plus de tropical · dry hop', '16D · plus de tropical · 10′', '16D · plus de floral · dry hop'];
const partieD = CAS_MONTRES.map((cas) => {
  const c = casListes.find((x) => x.cas === cas)!;
  return {
    cas, recette: c.recette, visee: c.visee, moment: c.moment,
    listes: Object.fromEntries(MODES.map((d) => [d, c.l[d].slice(0, 10).map((x) => {
      const id = hopId(x);
      return {
        position: c.l[d].indexOf(x) + 1, rang: x.rang, exAequoDansLeGroupe: x.groupe, houblon: nom(id), alpha: alphaDe(id), familles: citees(id).map((f) => FAMILY_NAMES[f]),
        departage: x.v.departage ? { etapes: ETAPES[x.v.departage.mode], valeurs: x.v.departage.cle, origine: x.v.departage.origine } : null,
      };
    })])),
  };
});
chrono('D');

const resultats = {
  voie: 'g2a-departage', moteur: 'creerMoteur({catalogue, stock: []}) : les 318 variétés', graine: GRAINE, cles: Object.fromEntries(CLES.map((k) => [k, ETAPES[k]])),
  A: partieA, B: partieB, C: partieC, D: partieD,
};
const json = JSON.stringify(resultats, null, 1) + '\n';
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, 'departage.json'), json);
process.stdout.write(`sha256 ${createHash('sha256').update(json).digest('hex')}\n`);
