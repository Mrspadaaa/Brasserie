// Voie l1-plan (M3, M6) : mesure HORS LIGNE (aucun appel) du rapprochement des lignes entre le premier écran de D (les deux Flash-Lite)
// et la lecture finale (avec la 3.8), par `alignLines` de la production, sur les réponses brutes déjà payées de `H13-reels/banc-k6-C/raw`.
// Méthode et chargement de `voies/m-lenteur/mesurer.ts` (mêmes lectures, même N, même règle « la 3.8 que le code appellerait »).
// `alignLines` n'est pas exportée : le script en écrit une COPIE dans `gen/` (texte du fichier de production, imports redirigés, un export ajouté),
// sans toucher à `functions/src/`. Aucune valeur d'une pièce n'est écrite : des comptes seulement.
// Usage : npx tsx work/missions/2026-10-31-ecran-depense/voies/l1-plan/apparier.ts [--banc=banc-k6-C]
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readingFromResponse, loadCases } from '../../../../../scripts/banc-lecture-facture';
import { finalOfStarVote, needsThirdLite, type LectureVote } from '../../../../../functions/src/invoiceScanVote';
import { reconcileInvoiceVision } from '../../../../../functions/src/invoiceVisionReview';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '../../../../..');
const REELS = path.join(RACINE, 'work/finalisation-tickets-2026-10-08/H13-reels');
const bancName = process.argv.find(a => a.startsWith('--banc='))?.slice(7) ?? 'banc-k6-C';

// 1. La copie d'alignLines : le fichier de production tel quel, ses deux imports locaux redirigés vers functions/src, un export ajouté.
const source = readFileSync(path.join(RACINE, 'functions/src/invoiceVisionReview.ts'), 'utf8');
const versProd = '../../../../../../functions/src/';
const copie = source.split("from './").join(`from '${versProd}`) + '\nexport { alignLines as alignerLignesCopie };\n';
if (copie.includes("from './")) throw new Error('import local non redirigé');
mkdirSync(path.join(ICI, 'gen'), { recursive: true });
const cheminCopie = path.join(ICI, 'gen', 'invoiceVisionReview-copie.ts');
writeFileSync(cheminCopie, copie);
const { alignerLignesCopie } = await import(pathToFileURL(cheminCopie).href) as { alignerLignesCopie: (a: any[], b: any[]) => { match: Map<number, number>; orphansBase: number[]; orphansOther: number[] } };

// 2. Les lectures (chargement de m-lenteur/mesurer.ts).
const banc = JSON.parse(readFileSync(path.join(REELS, bancName, 'results.json'), 'utf8'));
const cases = loadCases(['cas.json', 'cas-2.json', 'cas-3.json', 'cas-4.json', 'cas-5.json'].map(f => path.join(REELS, f)));
const casDe = new Map(cases.map(c => [c.id, c]));
const rawPath = (dir: string, doc: string, tirage: number, id: string) => path.join(REELS, dir, 'raw', `${doc}-t${tirage}-${id}.json`);
function vote(meta: any, ms: number, cost: number | null, lent: boolean | undefined, doc: string, tirage: number): LectureVote {
  const citees: string[] = String(banc.meta.reprendre ?? '').split(',').filter(Boolean);
  const candidates = [bancName, ...(lent ? [...citees, ...readdirSync(REELS).filter(d => d.startsWith('banc-') && existsSync(path.join(REELS, d, 'raw')))] : [])];
  const file = candidates.map(d => rawPath(d, doc, tirage, meta.id)).find(existsSync);
  if (!file) throw new Error(`réponse brute introuvable : ${doc} t${tirage} ${meta.id}`);
  const reading = readingFromResponse(meta, JSON.parse(readFileSync(file, 'utf8')), ms, cost, true);
  return { normalized: reading.normalized as any, cause: reading.cause };
}

// 3. Par pièce : provisoire = rapprochement des deux Flash-Lite (le premier écran de D, sans la phrase de coupure) ; final = finalOfStarVote.
const canon = (s: unknown) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const CHAMPS = ['name', 'quantity', 'unit', 'price', 'amountTTC', 'kind', 'reference', 'variant', 'stockCategory', 'vatCode', 'alphaPct'];
let tot = { pieces: 0, avec38: 0, lp: 0, lf: 0, apparies: 0, orphProv: 0, orphFin: 0, piecesOrph: 0, memeLongueur: 0, reperables: 0, horsOrdre: 0, apparieesChangees: 0, piecesNomChange: 0, lignesNomChange: 0 };
const champsChanges: Record<string, number> = {};
for (const rec of banc.records) {
  const run = rec.variants['Csv8+N'] ?? rec.variants['Csv8'];
  if (!run || !casDe.get(rec.doc)) continue;
  const readings: any[] = rec.readings.filter((r: any) => run.ids.includes(r.meta.id));
  const by = (k: number) => readings.find((r: any) => r.meta.lecture === k);
  if (!by(1) || !by(2)) continue;
  const mk = (r: any) => vote(r.meta, r.ms, r.costMicroChf, r.lent, rec.doc, rec.tirage);
  const l1 = mk(by(1)), l2 = mk(by(2));
  tot.pieces++;
  if (!needsThirdLite(l1, l2) || !by(3) || !l1.normalized || !l2.normalized) { console.log(`${rec.doc} : pas de provisoire (3.8 non appelée ou Flash-Lite manquante)`); continue; }
  tot.avec38++;
  const third = mk(by(3));
  const prov: any[] = (reconcileInvoiceVision([l1.normalized, l2.normalized]).result as any).items;
  const fin: any[] = finalOfStarVote(l1, l2, third).result.items;
  const a = alignerLignesCopie(prov, fin);
  const horsOrdre = [...a.match].filter(([p, f]) => p !== f).length;
  let changees = 0, nomChange = a.orphansOther.length;
  for (const [p, f] of a.match) {
    const diff = CHAMPS.filter(c => canon(prov[p][c]) !== canon(fin[f][c]));
    if (diff.length) changees++;
    for (const c of diff) champsChanges[c] = (champsChanges[c] ?? 0) + 1;
    if (diff.includes('name') || diff.includes('variant')) nomChange++;
  }
  // Repli par la position : seulement quand les deux listes ont la même longueur ; un orphelin se « repêche » si son vis-à-vis de même rang est orphelin aussi.
  const meme = prov.length === fin.length, reperables = meme ? a.orphansBase.filter(i => a.orphansOther.includes(i)).length : 0;
  tot.lp += prov.length; tot.lf += fin.length; tot.apparies += a.match.size; tot.orphProv += a.orphansBase.length; tot.orphFin += a.orphansOther.length;
  if (a.orphansBase.length || a.orphansOther.length) tot.piecesOrph++;
  if (meme) tot.memeLongueur++;
  tot.reperables += reperables; tot.horsOrdre += horsOrdre; tot.apparieesChangees += changees;
  if (nomChange) { tot.piecesNomChange++; tot.lignesNomChange += nomChange; }
  console.log(`${rec.doc} : provisoire ${prov.length} lignes, final ${fin.length} ; rapprochées ${a.match.size} (hors de leur rang ${horsOrdre}, changées ${changees}) ; sans paire : provisoire ${a.orphansBase.length}, final ${a.orphansOther.length}${meme ? `, repêchables par la position ${reperables}` : ''} ; noms changés ${nomChange}`);
}
const pc = (n: number, d: number) => d ? `${(100 * n / d).toFixed(1)} %` : '—';
console.log(`APPARIER ${tot.avec38}/${tot.pieces} pièces avec provisoire : ${tot.apparies} lignes rapprochées sur ${tot.lp} provisoires (${pc(tot.apparies, tot.lp)}) et ${tot.lf} finales (${pc(tot.apparies, tot.lf)}) ; sans paire ${tot.orphProv} provisoires, ${tot.orphFin} finales, sur ${tot.piecesOrph} pièces ; repêchables par la position ${tot.reperables} (listes de même longueur : ${tot.memeLongueur} pièces) ; rapprochées hors de leur rang ${tot.horsOrdre} ; rapprochées et changées ${tot.apparieesChangees}`);
console.log(`CHAMPS CHANGES (lignes rapprochées) : ${Object.entries(champsChanges).sort((x, y) => y[1] - x[1]).map(([c, n]) => `${c} ${n}`).join(', ')}`);
console.log(`NOMS ${tot.piecesNomChange}/${tot.avec38} pièces ont au moins un nom changé ou une ligne ajoutée (${tot.lignesNomChange} lignes)`);
