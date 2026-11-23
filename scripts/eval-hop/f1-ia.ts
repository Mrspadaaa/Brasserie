// Voie f1-affinage-diagnostic, partie 5 : sur quoi l'IA et le moteur diffèrent-ils ? SANS appel neuf : relit les réponses déjà obtenues
// (ia1-reclassement/resultats/cote-a-cote.json : 8 phares, IA 3.8 sur la liste « option 1 » ; i2-ia-substituer/img/rapport-reel.json : Flash-Lite réel dans l'émulateur).
// Lancement : npx vite-node scripts/eval-hop/f1-ia.ts -- --sortie=<dossier>   (sortie : ia.json, déterministe ; sha256 imprimé)
// Le moteur comparé est le moteur v2 actuel, au moment de chaque cas (dry hop actif), sans style ni stock.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CATALOGUE } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { arrondi, moyenne } from './metriques';

const args = process.argv.slice(2);
const SORTIE = resolve(args.find((a) => a.startsWith('--sortie='))?.split('=')[1] ?? 'work/missions/2026-10-25-integration-houblons/voies/f1-affinage-diagnostic');
const VOIES = resolve('work/missions/2026-10-25-integration-houblons/voies');
const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
const lire = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const parNom = new Map<string, string>();
for (const h of CATALOGUE) { parNom.set(h.name, h.id); for (const a of h.aliases) if (!parNom.has(a)) parNom.set(a, h.id); }
const mid = (r: [number, number] | null | undefined) => (r ? (r[0] + r[1]) / 2 : null);
const cat = (id: string) => CATALOGUE.find((h) => h.id === id)!;
const MOMENT = (txt: string) => (/60/.test(txt) ? 'b60' : /whirlpool/i.test(txt) ? 'wp' : 'dryActive') as 'b60' | 'wp' | 'dryActive';
const THEMES: [string, RegExp][] = [['α, cohumulone, amertume', /alpha|α|cohumulone|amertume|acides/i], ['huiles (totale, myrcène, humulène…)', /huile|myrc[eè]ne|humul[eè]ne|caryophyll|farn[eé]s|linalol/i],
  ['descripteurs précis (mots)', /groseille|vin blanc|sauvignon|raisin|nectar|mangue|passion|litchi|coco|dank|cannabis|thiol|agrume|pamplemousse|fruit/i], ['usage ou classe', /usage|aroma|amérisant|double/i]];
const tousMots = (id: string) => { const w = m.familyWords(id); const s = new Set<string>(); for (const f of Object.keys(w.mots) as (keyof typeof w.mots)[]) for (const r of w.mots[f]) for (const x of r.mots) s.add(x.toLowerCase()); for (const x of w.sansFamille) s.add(x.mot.toLowerCase()); return s; };
const partages = (a: string, b: string) => { const A = tousMots(a), B = tousMots(b); let n = 0; for (const x of A) if (B.has(x)) n++; return n; };

const ia1 = lire(join(VOIES, 'ia1-reclassement/resultats/cote-a-cote.json')) as { phares: { nom: string; id: string; moment: string; option1PlusIA: { rang: number; nom: string; phrase: string }[] }[] };
const cas = ia1.phares.map((p) => {
  const res = m.substitutes(p.id, { moment: MOMENT(p.moment) });
  const rang = new Map(res.remplacants.map((s) => [s.key, s]));
  const moteur10 = res.remplacants.slice(0, 10);
  const ia = p.option1PlusIA.slice(0, 10).map((x) => ({ x, s: rang.get(parNom.get(x.nom) ?? '') })).filter((r) => r.s);
  const aO = mid(cat(p.id).alpha);
  const rapportAlpha = (id: string) => { const a = mid(cat(id).alpha); return a && aO ? Math.abs(Math.log(a / aO)) : null; };
  const usage = (id: string) => cat(id).purpose ?? 'inconnu';
  const m10 = new Set(moteur10.map((s) => s.key));
  return {
    phare: p.nom, moment: MOMENT(p.moment), iaTop10DansLeMoteurV2: ia.map((r) => ({ nom: r.x.nom, rangMoteur: r.s!.rank, score: r.s!.score })),
    chevauchementTop10: ia.filter((r) => m10.has(r.s!.key)).length, rangMoteurMedianDesChoixIA: [...ia.map((r) => r.s!.rank)].sort((a, b) => a - b)[Math.floor(ia.length / 2)],
    scoreMoyen: { moteurTop10: arrondi(moyenne(moteur10.map((s) => s.score)), 1), iaTop10: arrondi(moyenne(ia.map((r) => r.s!.score)), 1) },
    ecartAlpha: { moteurTop10: arrondi(moyenne(moteur10.map((s) => rapportAlpha(s.key)).filter((x): x is number => x !== null)), 3), iaTop10: arrondi(moyenne(ia.map((r) => rapportAlpha(r.s!.key)).filter((x): x is number => x !== null)), 3) },
    partAroma: { moteurTop10: arrondi(moteur10.filter((s) => usage(s.key) === 'aroma').length / 10, 2), iaTop10: arrondi(ia.filter((r) => usage(r.s!.key) === 'aroma').length / ia.length, 2) },
    motsPartagesAvecLOriginal: { moteurTop10: arrondi(moyenne(moteur10.map((s) => partages(p.id, s.key))), 2), iaTop10: arrondi(moyenne(ia.map((r) => partages(p.id, r.s!.key))), 2) },
    themesDesPhrases: Object.fromEntries(THEMES.map(([n, re]) => [n, p.option1PlusIA.filter((x) => re.test(x.phrase)).length])),
  };
});
const agg = (f: (c: (typeof cas)[number]) => number | null) => arrondi(moyenne(cas.map(f).filter((x): x is number => x !== null)), 2);
const synthese = {
  cas: cas.length, chevauchementMoyenTop10: agg((c) => c.chevauchementTop10), rangMoteurMedianMoyenDesChoixIA: agg((c) => c.rangMoteurMedianDesChoixIA),
  scoreMoyen: { moteur: agg((c) => c.scoreMoyen.moteurTop10), ia: agg((c) => c.scoreMoyen.iaTop10) },
  ecartAlpha: { moteur: agg((c) => c.ecartAlpha.moteurTop10), ia: agg((c) => c.ecartAlpha.iaTop10) },
  partAroma: { moteur: agg((c) => c.partAroma.moteurTop10), ia: agg((c) => c.partAroma.iaTop10) },
  motsPartages: { moteur: agg((c) => c.motsPartagesAvecLOriginal.moteurTop10), ia: agg((c) => c.motsPartagesAvecLOriginal.iaTop10) },
  phrases: Object.fromEntries(THEMES.map(([n]) => [n, cas.reduce((s, c) => s + (c.themesDesPhrases[n] as number), 0)])), nPhrases: ia1.phares.reduce((s, p) => s + p.option1PlusIA.length, 0),
};
// i2 : l'essai réel (Flash-Lite, émulateur) : la liste du moteur affichée, puis l'ordre de l'IA.
const reel = lire(join(VOIES, 'i2-ia-substituer/img/rapport-reel.json')) as { etapes: { nom: string; lignes?: string[] }[] };
const lignesReel = (nom: RegExp) => reel.etapes.find((e) => nom.test(e.nom))?.lignes ?? [];
const sortie = {
  voie: 'f1-affinage-diagnostic, partie 5', lecture: 'Moteur v2 actuel, même moment que chaque cas ; aucun appel neuf.', cas, synthese,
  essaiReelI2: { listeDuMoteur: lignesReel(/liste du moteur affichée/), ordreDeLIA: lignesReel(/réponse de l’IA/), lecture: 'Cinq premières rangées (nom, score du moteur). L’IA fait monter Nectaron (55), Solero (57), Mandarina Bavaria (57) devant Sládek (60), Southern Sublime (58), Trident (58).' },
};
const json = JSON.stringify(sortie, null, 1) + '\n';
mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, 'ia.json'), json);
process.stdout.write(`${JSON.stringify(synthese)}\nsha256 ${createHash('sha256').update(json).digest('hex')}\n`);
