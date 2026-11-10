// Voie fn-montant-seul : compare deux rejeux hors ligne du banc (avant / après la règle) et dénombre les lignes que la règle touche.
// Sortie : comptes, statuts, noms de champs. Aucune valeur des documents, aucun identifiant autre que « docN ».
// Usage : npx vite-node --config vitest.config.ts <ce fichier> -- <dossier avant> <dossier après> <liste de sorties prêtées, séparées par une virgule>
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { CAS_FILES, casPath, loadCases, orderVariants, type DrawRecord } from '../../../../../scripts/banc-lecture-facture';
import { judgeBench } from '../../../../../scripts/banc-lecture-facture-juger';

const args = process.argv.slice(2).filter(arg => arg !== '--');
const [avantDir, apresDir, prets] = args;
const charge = (dir: string) => JSON.parse(readFileSync(path.join(dir, 'results.json'), 'utf8')) as { meta: any; records: DrawRecord[] };
const avant = charge(avantDir), apres = charge(apresDir);
const cases = loadCases(apres.meta.casFiles.map((name: string) => CAS_FILES.find(candidate => path.basename(candidate) === name) ?? casPath(name)));
const byId = new Map(cases.map(c => [c.id, c]));
const jugeAvant = judgeBench(avant.records, cases), jugeApres = judgeBench(apres.records, cases);

console.log('== Parcours par parcours (variante, statut, champs faux, lignes justes / jugées, appels) ==');
let perdus = 0, gagnes = 0, statutsChanges = 0;
const lignesFinalesTouchees: Array<{ doc: string; tirage: number; variant: string; ligne: number; apres: 'juste' | 'fausse' | 'non-jugee'; avant: 'juste' | 'fausse' | 'non-jugee' }> = [];
for (const variant of orderVariants(new Set(apres.records.flatMap(r => Object.keys(r.variants))))) {
  for (const record of apres.records) {
    const before = avant.records.find(r => r.doc === record.doc && r.tirage === record.tirage)!;
    const a = jugeAvant.draws.find(d => d.doc === record.doc && d.tirage === record.tirage && d.variant === variant)!;
    const b = jugeApres.draws.find(d => d.doc === record.doc && d.tirage === record.tirage && d.variant === variant)!;
    const ra = before.variants[variant], rb = record.variants[variant];
    const lignes = (d: typeof a) => `${d.verdict?.lineRight ?? '-'}/${d.verdict?.lineJudged ?? '-'}`;
    const champs = (d: typeof a) => `${d.verdict ? d.verdict.judged - d.verdict.right : '-'}`;
    const memeChose = a.status === b.status && champs(a) === champs(b) && lignes(a) === lignes(b) && ra.calls === rb.calls;
    const dl = (b.verdict?.lineRight ?? 0) - (a.verdict?.lineRight ?? 0), dc = (a.verdict ? a.verdict.judged - a.verdict.right : 0) - (b.verdict ? b.verdict.judged - b.verdict.right : 0);
    if (dl < 0 || dc < 0) perdus++; if (dl > 0 || dc > 0) gagnes++; if (a.status !== b.status) statutsChanges++;
    if (!memeChose) console.log(`${variant.padEnd(7)} ${record.doc} t${record.tirage} : statut ${a.status} → ${b.status} ; champs faux ${champs(a)} → ${champs(b)} ; lignes ${lignes(a)} → ${lignes(b)} ; appels ${ra.calls} → ${rb.calls}`);
    // lignes finales dont amountTTC a changé de vide à plein
    const attendu = byId.get(record.doc)?.expected as any;
    const itemsA: any[] = ra.result?.items ?? [], itemsB: any[] = rb.result?.items ?? [];
    const visibles: any[] = Array.isArray(attendu?.items) ? attendu.items.filter((l: any) => l?.invisible !== true) : [];
    itemsB.forEach((it, i) => {
      if (itemsA[i]?.amountTTC === null && it.amountTTC !== null) {
        const vrai = visibles[i];
        const jug = (x: any) => (vrai && Object.prototype.hasOwnProperty.call(vrai, 'amountTTC') ? (Math.abs((x ?? NaN) - vrai.amountTTC) <= 0.005 ? 'juste' : 'fausse') : 'non-jugee') as 'juste' | 'fausse' | 'non-jugee';
        lignesFinalesTouchees.push({ doc: record.doc, tirage: record.tirage, variant, ligne: i + 1, avant: jug(itemsA[i].amountTTC), apres: jug(it.amountTTC) });
      }
    });
  }
}
console.log(`Parcours où quelque chose est perdu (champ ou ligne) : ${perdus}. Parcours où quelque chose est gagné : ${gagnes}. Statuts changés : ${statutsChanges}.`);
console.log('\n== Lignes FINALES dont le montant passe de vide à plein ==');
const resume = new Map<string, number>();
for (const l of lignesFinalesTouchees) { const key = `${l.variant} : avant ${l.avant} → après ${l.apres}`; resume.set(key, (resume.get(key) ?? 0) + 1); }
for (const [key, n] of resume) console.log(`${key} : ${n}`);
if (!resume.size) console.log('aucune');

// Lignes des LECTURES (brutes, une par fichier distinct) sur lesquelles la règle se déclenche, comparées à la vérité du banc.
console.log('\n== Lectures enregistrées : lignes où la règle se déclenche (montant vide, price fini, quantité vide ou 1) ==');
const dirs = (prets ?? '').split(',').map(s => s.trim()).filter(Boolean).map(s => path.resolve(s));
const vus = new Set<string>();
let lectures = 0, lecturesTouchees = 0, lignesTouchees = 0, justes = 0, fausses = 0, nonJugees = 0, horsAlignement = 0;
const parDoc = new Map<string, { touchees: number; justes: number; fausses: number }>();
const finis = (x: unknown) => typeof x === 'number' && Number.isFinite(x);
for (const dir of dirs) {
  const raw = path.join(dir, 'raw');
  if (!existsSync(raw)) continue;
  for (const name of readdirSync(raw)) {
    const m = /^(doc\d+)-t(\d+)-(.+)\.json$/.exec(name);
    if (!m) continue;
    const key = `${m[1]}|${m[2]}|${m[3]}`;
    if (vus.has(key)) continue;
    vus.add(key);
    const response = JSON.parse(readFileSync(path.join(raw, name), 'utf8'));
    const cand = response?.candidates?.[0];
    if (cand?.finishReason !== 'STOP') continue;
    let decoded: any;
    try { decoded = JSON.parse((cand.content?.parts ?? []).filter((p: any) => p.thought !== true && typeof p.text === 'string').map((p: any) => p.text).join('')); } catch { continue; }
    if (!Array.isArray(decoded?.items)) continue;
    lectures++;
    const cas: any = byId.get(m[1])?.expected;
    const visibles: any[] = Array.isArray(cas?.items) ? cas.items.filter((l: any) => l?.invisible !== true) : [];
    let touche = false;
    decoded.items.slice(0, 35).forEach((it: any, i: number) => {
      if (finis(it?.amountTTC) || !finis(it?.price) || !(it?.quantity === null || it?.quantity === undefined || !finis(it?.quantity) || it?.quantity === 1)) return;
      touche = true; lignesTouchees++;
      const entry = parDoc.get(m[1]) ?? { touchees: 0, justes: 0, fausses: 0 };
      entry.touchees++;
      const vrai = visibles[i];
      if (!vrai || !Object.prototype.hasOwnProperty.call(vrai, 'amountTTC') || typeof vrai.amountTTC !== 'number') { nonJugees++; if (!vrai) horsAlignement++; }
      else if (Math.abs(it.price - vrai.amountTTC) <= 0.005) { justes++; entry.justes++; } else { fausses++; entry.fausses++; }
      parDoc.set(m[1], entry);
    });
    if (touche) lecturesTouchees++;
  }
}
console.log(`Lectures distinctes lues : ${lectures} ; touchées : ${lecturesTouchees} ; lignes touchées : ${lignesTouchees} ; montant = vérité : ${justes} ; montant ≠ vérité : ${fausses} ; non jugées (pas de montant attendu, ou ligne non alignée) : ${nonJugees} dont hors alignement ${horsAlignement}.`);
for (const [doc, e] of [...parDoc].sort()) console.log(`${doc} : ${e.touchees} lignes touchées, ${e.justes} justes, ${e.fausses} fausses`);
