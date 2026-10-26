// Banc de justesse de Substituer (voie f2-affinage-a-b1-c-d, D102, partie D) : le banc de f1-poids.ts, mis sur le VRAI moteur (substitutes()), pas sur une réplique.
// Il se rejoue avant et après un changement de src/ : chaque ligne dit ce que le moteur rend à cet instant.
//
//   npx vite-node scripts/eval-hop/banc-justesse.ts -- --etat=<nom> [--sortie=<dossier>]
//   sortie : banc-<nom>.json (déterministe : ni date ni durée ; l'empreinte sha256 est imprimée).
//
// Trois références, indépendantes les unes des autres, et jamais Beer Maverick seul (la formule de Beer Maverick contient l'α qu'on veut alléger) :
//   P1  substituts publiés par d'autres que lui : a) Hopsteiner « Brewhouse » (producteur, par moment) ; b) Hopslist + Hops Direct (agrégateur, distributeur),
//       gardés pour les seuls amérisants et doubles usages (leurs listes ne disent pas le moment) ; c) Hopsteiner « Dry Hopping » au dry hop, rapporté, hors composite 60′.
//   P2  jugements du brasseur : les 3 premiers de « option 1 + IA » (ia1, dry hop) pour 8 phares ; K4 (Nelson Sauvin → Hallertau Blanc) ; K5 (Galaxy n'est pas Saaz).
//       Réserve écrite : D vient d'une formule proche du moteur ; au 60′ le brasseur n'a jugé aucune liste.
//   P3  Beer Maverick en secondaire, l'α retiré : le rang du substitut BM parmi les candidats d'α voisin (rapport ≤ 1,25).
// Le composite (choix du jeu de poids) = moyenne des MRR de P1a, P1b et P3, par moitié ; il ne tient jamais P3 seul. P2 est un contrôle (phares, K4, K5).
// Moitiés : parité de l'indice parmi les ids triés (L20 : se règle sur l'une, se juge sur l'autre).
// Le moteur est celui du catalogue sans stock, contexte d'amertume à 60′ (sans style ni recette), dry hop actif pour P1c et P2.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CATALOGUE, bmLienId } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { arrondi, mediane, moyenne } from './metriques';

const args = process.argv.slice(2);
const opt = (nom: string) => args.find((a) => a.startsWith(`--${nom}=`))?.slice(nom.length + 3);
const ETAT = opt('etat') ?? 'courant';
const SORTIE = resolve(opt('sortie') ?? 'work/missions/2026-10-25-integration-houblons/voies/f2-affinage-a-b1-c-d/banc');
const RACINE = resolve('.');
const lire = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const N = CATALOGUE.length;
const ids = CATALOGUE.map((h) => h.id);
const idx = new Map(ids.map((id, i) => [id, i]));
const norm = (x: string) => x.toLowerCase().replace(/[_-]+/g, ' ');
const mid = (r: [number, number] | null | undefined) => (r ? (r[0] + r[1]) / 2 : null);

// ---------- Classements du moteur (un par original et par moment, calculés une fois) ----------
const ordres = new Map<string, number[]>();
function ordre(o: number, moment: 'b60' | 'dryActive'): number[] {
  const cle = `${o}|${moment}`;
  let r = ordres.get(cle);
  if (!r) { r = m.substitutes(ids[o], { moment }).remplacants.map((s) => idx.get(s.key)!).filter((j) => j !== undefined); ordres.set(cle, r); }
  return r;
}
const rangDans = (ord: number[], e: number) => { const i = ord.indexOf(e); return i < 0 ? null : i + 1; };

// ---------- Moitiés ----------
const triees = [...ids].sort();
const moitie = new Map(triees.map((id, k) => [id, k % 2]));
const demi = (o: number) => moitie.get(ids[o])!;

// ---------- Références ----------
const nomVersId = new Map<string, string>();
for (const h of CATALOGUE) for (const n of [h.name, ...h.aliases]) nomVersId.set(norm(n.replace(/[®™]/g, '').trim()), h.id);
const resoudre = (n: string): number | null => { const id = nomVersId.get(norm(String(n).replace(/[®™]/g, '').trim())); return id ? idx.get(id)! : null; };
interface Obs { o: number; attendus: number[] }
const SRC = join(RACINE, 'src/data/hopSources');
const nonResolus = { hopsteinerBrewhouse: 0, hopsteinerDryHopping: 0, hopslist: 0, hopsdirect: 0 };
const originalDe = (f: { varietyId?: string | null; nom: string }) => (f.varietyId && idx.has(f.varietyId) ? idx.get(f.varietyId)! : resoudre(f.nom));
type FicheHs = { nom: string; varietyId?: string | null; listes: { substituts: Record<string, { nom: string }[]> } };
function hopsteiner(moment: 'Brewhouse' | 'Dry Hopping', compteur: 'hopsteinerBrewhouse' | 'hopsteinerDryHopping'): Obs[] {
  const out: Obs[] = [];
  for (const f of lire(join(SRC, 'hopsteiner.json')).fiches as FicheHs[]) {
    const o = originalDe(f); const l = f.listes.substituts?.[moment]; if (o === null || !l?.length) continue;
    const att = l.map((x) => { const e = resoudre(x.nom); if (e === null) nonResolus[compteur]++; return e; }).filter((e): e is number => e !== null && e !== o);
    if (att.length) out.push({ o, attendus: [...new Set(att)] });
  }
  return out;
}
const parOriginal = new Map<number, Set<number>>();
for (const [src, fichier] of [['hopslist', 'hopslist.json'], ['hopsdirect', 'hopsdirect.json']] as const) {
  for (const f of lire(join(SRC, fichier)).fiches as { nom: string; varietyId?: string | null; listes?: { substituts?: (string | { nom: string })[] | null } }[]) {
    const o = originalDe(f); const l = f.listes?.substituts; if (o === null || !l?.length) continue;
    for (const x of l) { const e = resoudre(typeof x === 'string' ? x : x.nom); if (e === null) nonResolus[src]++; else if (e !== o) (parOriginal.get(o) ?? parOriginal.set(o, new Set()).get(o)!).add(e); }
  }
}
const estAmerisant = (o: number) => CATALOGUE[o].purpose === 'bittering' || CATALOGUE[o].purpose === 'dual';
const obsHopslist: Obs[] = [...parOriginal].filter(([o]) => estAmerisant(o)).map(([o, s]) => ({ o, attendus: [...s] })).sort((a, b) => a.o - b.o);
const obsBrewhouse = hopsteiner('Brewhouse', 'hopsteinerBrewhouse').sort((a, b) => a.o - b.o);
const obsDryHopping = hopsteiner('Dry Hopping', 'hopsteinerDryHopping').sort((a, b) => a.o - b.o);
const obsBM: Obs[] = CATALOGUE.flatMap((h, i) => (estAmerisant(i) && h.bm?.substituts?.length
  ? [{ o: i, attendus: [...new Set(h.bm.substituts.map((l) => bmLienId(l)).filter((x): x is string => !!x && x !== h.id && idx.has(x)).map((x) => idx.get(x)!))] }] : [])).filter((x) => x.attendus.length);

interface Mesure { n: number; mrr: number | null; rappel10: number | null; rangMedian: number | null }
/** MRR (1 / rang du mieux placé des attendus), rappel@10 (part des attendus dans les 10 premiers), rang médian du mieux placé. `alphaVoisin` : P3. */
function mesure(obs: Obs[], moment: 'b60' | 'dryActive', alphaVoisin = false): Mesure {
  const rr: number[] = [], r10: number[] = [], prem: number[] = [];
  for (const ob of obs) {
    let ord = ordre(ob.o, moment), att = ob.attendus;
    if (alphaVoisin) {
      const ao = mid(CATALOGUE[ob.o].alpha); if (ao === null) continue;
      ord = ord.filter((j) => { const a = mid(CATALOGUE[j].alpha); return a !== null && Math.abs(Math.log(a / ao)) <= Math.log(1.25); });
      att = att.filter((e) => ord.includes(e));
    }
    if (!att.length) continue;
    const rangs = att.map((e) => rangDans(ord, e)!);
    const p = Math.min(...rangs);
    rr.push(1 / p); prem.push(p); r10.push(rangs.filter((r) => r <= 10).length / rangs.length);
  }
  return { n: rr.length, mrr: arrondi(moyenne(rr)), rappel10: arrondi(moyenne(r10)), rangMedian: mediane(prem) };
}
const sous = (obs: Obs[], h: 0 | 1 | null) => (h === null ? obs : obs.filter((x) => demi(x.o) === h));
const parMoitie = Object.fromEntries((['A', 'B', 'toutes'] as const).map((nom) => {
  const h = nom === 'A' ? 0 : nom === 'B' ? 1 : null;
  const a = mesure(sous(obsBrewhouse, h), 'b60'), b = mesure(sous(obsHopslist, h), 'b60'), c = mesure(sous(obsBM, h), 'b60', true), d = mesure(sous(obsDryHopping, h), 'dryActive');
  const mrrs = [a.mrr, b.mrr, c.mrr].filter((x): x is number => x !== null);
  const sansBM = [a.mrr, b.mrr].filter((x): x is number => x !== null);
  return [nom, { P1a_hopsteiner_brewhouse_60: a, P1b_hopslist_hopsdirect_60: b, P3_BM_alphaVoisin_60: c, P1c_hopsteiner_dryhopping_dryhop: d,
    composite60: arrondi(moyenne(mrrs), 4), composite60SansBM: arrondi(moyenne(sansBM), 4) }];
}));

// ---------- P2 : jugements du brasseur (dry hop) ----------
const ia1 = lire(join(RACINE, 'work/missions/2026-10-25-integration-houblons/voies/ia1-reclassement/resultats/cote-a-cote.json')) as { phares: { nom: string; id: string; option1PlusIA: { rang: number; nom: string }[] }[] };
const phares = ia1.phares.map((p) => {
  const o = idx.get(p.id)!; const ord = ordre(o, 'dryActive');
  const attendus = p.option1PlusIA.slice(0, 3).map((x) => resoudre(x.nom)).filter((e): e is number => e !== null);
  const rangs = attendus.map((e) => rangDans(ord, e));
  return { phare: p.nom, attendus: attendus.map((e) => CATALOGUE[e].name), rangs, premier: Math.min(...(rangs as number[])) };
});
const mrrP2 = arrondi(moyenne(phares.map((p) => 1 / p.premier)));
const get = (id: string) => idx.get(`beermaverick-${id}`);
const ns = get('nelson-sauvin')!, hb = get('hallertau-blanc')!, gal = get('galaxy')!, saaz = get('saaz-cz') ?? resoudre('Saaz (CZ)');
const K4 = rangDans(ordre(ns, 'dryActive'), hb);
const K5 = saaz === null ? null : rangDans(ordre(gal, 'dryActive'), saaz);

// ---------- Sortie ----------
const sortie = {
  etat: ETAT,
  lecture: 'Banc sur le vrai moteur (substitutes), catalogue sans stock. 60′ : contexte d’amertume ; dry hop : dryActive. MRR plus haut = mieux ; rang médian plus bas = mieux. Jamais BM seul : composite60 = moyenne de P1a, P1b et P3 ; composite60SansBM = P1a et P1b.',
  donnees: { houblons: N, idsSha: createHash('sha256').update(ids.join('|')).digest('hex').slice(0, 16) },
  references: {
    P1a_hopsteiner_brewhouse: { originaux: obsBrewhouse.length, paires: obsBrewhouse.reduce((s, x) => s + x.attendus.length, 0) },
    P1b_hopslist_hopsdirect_amerisants: { originaux: obsHopslist.length, paires: obsHopslist.reduce((s, x) => s + x.attendus.length, 0) },
    P1c_hopsteiner_dryhopping: { originaux: obsDryHopping.length, paires: obsDryHopping.reduce((s, x) => s + x.attendus.length, 0) },
    P3_BM_amerisants: { originaux: obsBM.length }, nonResolus,
  },
  moitiesEtTotal: parMoitie,
  P2_brasseur: { lecture: 'Dry hop : rang dans le moteur des 3 premiers de « option 1 + IA » par phare ; K4 : rang de Hallertau Blanc chez Nelson Sauvin (1 attendu) ; K5 : rang de Saaz chez Galaxy (doit rester loin). Au 60′ : aucun jugement du brasseur.',
    mrr: mrrP2, phares, K4, K5 },
};
const json = JSON.stringify(sortie, null, 1) + '\n';
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, `banc-${ETAT}.json`), json);
const t = parMoitie.toutes as { composite60: number | null; composite60SansBM: number | null };
const ligne = (nom: string) => { const x = parMoitie[nom] as Record<string, Mesure>; return `${nom}: P1a ${x.P1a_hopsteiner_brewhouse_60.mrr} (n${x.P1a_hopsteiner_brewhouse_60.n}) P1b ${x.P1b_hopslist_hopsdirect_60.mrr} (n${x.P1b_hopslist_hopsdirect_60.n}) P3 ${x.P3_BM_alphaVoisin_60.mrr} (n${x.P3_BM_alphaVoisin_60.n}) P1c ${x.P1c_hopsteiner_dryhopping_dryhop.mrr}`; };
process.stdout.write(`${ligne('A')}\n${ligne('B')}\n${ligne('toutes')}\ncomposite60 ${t.composite60} (sans BM ${t.composite60SansBM}) ; P2 MRR ${mrrP2} K4 ${K4} K5 ${K5}\nsha256 ${createHash('sha256').update(JSON.stringify({ ...sortie, etat: '' }, null, 1)).digest('hex')} (sans le nom de l’état)\n`);
