// Voie f1-affinage-diagnostic, partie 6 (D174) : l'inventaire des produits de forme (Cryo, HyperBoost, LupuLN2, Incognito, Spectrum,
// DynaBoost, Lupomax, lupuline, poudre) dans src/data/hopSources/*.json et complements-non-rattachees.json. Lecture seule, déterministe.
// Lancement : npx vite-node scripts/eval-hop/f1-formes.ts -- --sortie=<dossier>   (sortie : formes.json ; sha256 imprimé)
// Pour chaque produit : source, variété (varietyId ou nom), forme, et ce qui est PUBLIÉ pour lui : α, huile, dose conseillée (null : non publié, jamais 0).
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const SORTIE = resolve(args.find((a) => a.startsWith('--sortie='))?.split('=')[1] ?? 'work/missions/2026-10-25-integration-houblons/voies/f1-affinage-diagnostic');
const SRC = resolve('src/data/hopSources');
const FORMES: [string, RegExp][] = [
  ['HyperBoost (Indie Hops)', /hyperboost/i],
  ['Cryo / LupuLN2 (Yakima Chief)', /lupuln2|\bcryo\b|cryogenic|cryo[- ]?pop/i],
  ['Incognito (BarthHaas)', /incognito/i],
  ['Spectrum (BarthHaas)', /\bspectrum\b/i],
  ['Lupomax (Yakima Valley Hops)', /lupomax/i],
  ['DynaBoost', /dynaboost/i],
  ['lupuline / poudre', /lupulin|lupulin|powder|poudre/i],
  ['Oil-boosted extract', /oil-boosted/i],
];
const formeDe = (s: string): string | null => FORMES.find(([, re]) => re.test(s))?.[0] ?? null;
type J = Record<string, unknown>;
const lire = (p: string): J => JSON.parse(readFileSync(p, 'utf8'));
const chaines = (x: unknown, out: string[] = []): string[] => {
  if (typeof x === 'string') out.push(x);
  else if (Array.isArray(x)) for (const y of x) chaines(y, out);
  else if (x && typeof x === 'object') for (const y of Object.values(x)) chaines(y, out);
  return out;
};
/** Une valeur publiée : « brut » tel que lu, sinon null. */
const brut = (c: unknown): string | null => (c && typeof c === 'object' && typeof (c as J).brut === 'string' ? ((c as J).brut as string) : null);
const champ = (champs: J | undefined, ...noms: string[]) => { for (const n of noms) { const b = brut(champs?.[n]); if (b) return b; } return null; };
const DOSE = /\bdose\b|dosage|\busage rate|\bdry[- ]?hop rate|\bg\/l\b|\bg\/hl\b|\blb\/bbl\b|per (hl|bbl)|recommended/i;

interface Ligne { source: string; produit: string; forme: string; variete: string | null; url: string | null; alpha: string | null; huile: string | null; doseConseillee: string | null; note?: string }
const lignes: Ligne[] = [];
const parSource: Record<string, { fiches: number; touchees: number }> = {};
for (const f of readdirSync(SRC).filter((x) => x.endsWith('.json') && !x.startsWith('beeranalytics')).sort()) {
  const id = f.replace('.json', '');
  const j = lire(join(SRC, f));
  const fiches = (j.fiches ?? []) as J[];
  parSource[id] = { fiches: fiches.length, touchees: 0 };
  for (const x of fiches) {
    const nom = String(x.nom ?? ''), url = typeof x.url === 'string' ? x.url : null;
    const champs = x.champs as J | undefined;
    // Brewer's Friend : seule une moyenne des recettes d'utilisateurs (pas une analyse du produit), marquée comme telle.
    const moy = ((x.formes as J[] | undefined) ?? []).map((y) => brut(y.alphaMoyenRecettes)).find((b) => b);
    const alpha = champ(champs, 'alpha') ?? (moy ? `${moy} % (moyenne des recettes d'utilisateurs, pas une analyse)` : null), huile = champ(champs, 'huile_totale', 'huileTotale', 'huile');
    const dose = chaines(x).filter((s) => DOSE.test(s) && s.length < 200).slice(0, 3);
    const formesListe = ((x.listes as J | undefined)?.formes as string[] | undefined) ?? [];
    const formesFiche = ((x.formes as J[] | undefined) ?? []).map((y) => String(y.forme ?? ''));
    const texte = [nom, url ?? '', ...formesListe, ...formesFiche].join(' | ');
    const forme = formeDe(texte);
    if (!forme) continue;
    parSource[id].touchees++;
    // Une fiche « variété » qui n'a la forme que dans sa liste de formes vendues n'est pas un produit : ses chiffres sont ceux de la variété.
    const estProduit = formeDe([nom, url ?? ''].join(' ')) !== null || formesFiche.some((s) => formeDe(s));
    lignes.push({
      source: id, produit: nom, forme, variete: typeof x.varietyId === 'string' ? x.varietyId : null, url,
      alpha: estProduit ? alpha : null, huile: estProduit ? huile : null, doseConseillee: dose.length ? dose.join(' ; ') : null,
      ...(estProduit ? {} : { note: `forme citée dans la liste des formes vendues (${[...new Set(formesListe)].join(', ')}) : α et huile de la fiche sont ceux de la variété, pas du produit` }),
    });
  }
}
// Les non-rattachées.
const nr = lire(resolve('src/data/hopV4/complements-non-rattachees.json'));
const nrListe = ((nr.nonRattachees ?? nr.fiches ?? nr.items ?? Object.values(nr).find(Array.isArray) ?? []) as J[]);
const nrLignes = nrListe.filter((x) => formeDe(JSON.stringify(x))).map((x) => ({ source: String(x.source), nom: String(x.nom), forme: formeDe(JSON.stringify(x)), url: String(x.url ?? ''), raison: String(x.raison ?? '') }));

const parForme: Record<string, { fiches: number; sources: string[]; variétés: number }> = {};
for (const l of lignes) {
  const e = (parForme[l.forme] ??= { fiches: 0, sources: [], variétés: 0 });
  e.fiches++; if (!e.sources.includes(l.source)) e.sources.push(l.source);
}
for (const [forme, e] of Object.entries(parForme)) e.variétés = new Set(lignes.filter((l) => l.forme === forme).map((l) => l.variete ?? l.produit)).size;
const avecAlpha = lignes.filter((l) => l.alpha !== null).length, avecHuile = lignes.filter((l) => l.huile !== null).length, avecDose = lignes.filter((l) => l.doseConseillee !== null).length;
const sortie = {
  voie: 'f1-affinage-diagnostic, partie 6',
  parSource, parForme, total: lignes.length, produitsAvecAlpha: avecAlpha, produitsAvecHuile: avecHuile, produitsAvecDose: avecDose,
  nonRattachees: { total: nrListe.length, formes: nrLignes },
  lignes: lignes.sort((a, b) => (a.source + a.produit < b.source + b.produit ? -1 : 1)),
};
const json = JSON.stringify(sortie, null, 1) + '\n';
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, 'formes.json'), json);
process.stdout.write(`${lignes.length} lignes ; α ${avecAlpha}, huile ${avecHuile}, dose ${avecDose} ; non rattachées ${nrLignes.length}/${nrListe.length}\nsha256 ${createHash('sha256').update(json).digest('hex')}\n`);
