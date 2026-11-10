// Voie s-serveur : mesure HORS LIGNE (aucun appel, des comptes seulement) de `rangsProvisoires` de la production sur les réponses brutes déjà payées
// de `H13-reels/banc-k6-C/raw`, comme `l1-plan/apparier.ts` (même chargement) mais avec le code livré, repli par la position compris.
// Attendu (PLAN § 2 bis) : 183 lignes rapprochées sur 184 provisoires, 1 repêchée par la position (doc13), 7 lignes finales ajoutées (rang null).
// Usage : npx tsx work/missions/2026-10-31-ecran-depense/voies/s-serveur/rangs-banc.ts
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readingFromResponse, loadCases } from '../../../../../scripts/banc-lecture-facture';
import { finalOfStarVote, needsThirdLite, provisoireDeDeux, rangsProvisoires, type LectureVote } from '../../../../../functions/src/invoiceScanVote';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const REELS = path.join(RACINE, 'work/finalisation-tickets-2026-10-08/H13-reels');
const bancName = 'banc-k6-C';
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
let pieces = 0, avec38 = 0, lp = 0, lf = 0, rapprochees = 0, nulles = 0, parPosition = 0, horsRang = 0, provisoiresSansLeur = 0;
for (const rec of banc.records) {
  const run = rec.variants['Csv8+N'] ?? rec.variants['Csv8'];
  if (!run || !casDe.get(rec.doc)) continue;
  const readings: any[] = rec.readings.filter((r: any) => run.ids.includes(r.meta.id));
  const by = (k: number) => readings.find((r: any) => r.meta.lecture === k);
  if (!by(1) || !by(2)) continue;
  const mk = (r: any) => vote(r.meta, r.ms, r.costMicroChf, r.lent, rec.doc, rec.tirage);
  const l1 = mk(by(1)), l2 = mk(by(2));
  pieces++;
  if (!needsThirdLite(l1, l2) || !by(3) || !l1.normalized || !l2.normalized) continue;
  avec38++;
  const third = mk(by(3));
  const prov = provisoireDeDeux(l1, l2).items as any[], fin = finalOfStarVote(l1, l2, third).result.items as any[];
  const rangs = rangsProvisoires(prov, fin);
  lp += prov.length; lf += fin.length;
  rangs.forEach((r, f) => { if (r === null) nulles++; else { rapprochees++; if (r !== f) horsRang++; } });
  const pris = new Set(rangs.filter((r): r is number => r !== null));
  if (pris.size !== rangs.filter(r => r !== null).length) console.log(`${rec.doc} : ERREUR, un rang provisoire pris deux fois`);
  provisoiresSansLeur += prov.length - pris.size;
  console.log(`${rec.doc} : provisoire ${prov.length} lignes, final ${fin.length}, rang null ${rangs.filter(r => r === null).length}`);
}
console.log(`RANGS ${avec38}/${pieces} pièces avec provisoire : ${rapprochees} lignes finales avec un rang sur ${lf} (${nulles} nulles) ; ${lp} lignes provisoires dont ${provisoiresSansLeur} sans ligne finale ; rang différent de la position ${horsRang}`);
