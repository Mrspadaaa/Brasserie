// Compare deux sorties de rejouer.ts, document par document (avant → après). Usage : node comparer.mjs avant.json apres.json
import { readFileSync } from 'node:fs';
const [A, B] = process.argv.slice(2).map(f => JSON.parse(readFileSync(f, 'utf8')));
const cles = ['justes', 'enTrop', 'qte', 'total', 'fauxVert', 'sommeVerteFausse', 'compteFaux', 'annonceSansMajorite', 'annonceFausse', 'prixPerdus', 'unitesPerdues', 'nomsContreMajorite', 'nomsDecales', 'pairesFausses', 'pairesNoms', 'jumellesManquees', 'retireesDoublons', 'retireesVraies'];
const par = j => { const o = {}; for (const r of j.lignes) { const b = (o[r.doc] ??= Object.fromEntries([...cles, 'k', 'tiersManquant'].map(k => [k, 0]))); b.k++; if (r.tiersAbsent && r.tiers) b.tiersManquant++; for (const k of cles) b[k] += typeof r[k] === 'number' ? r[k] : r[k] ? 1 : 0; } return o; };
const a = par(A), b = par(B);
const pire = { justes: 1, qte: 1, total: 1 }, mieuxBas = { annonceSansMajorite: 1, annonceFausse: 1, prixPerdus: 1, unitesPerdues: 1, nomsContreMajorite: 1, nomsDecales: 1, enTrop: 1, fauxVert: 1, sommeVerteFausse: 1, compteFaux: 1, pairesFausses: 1, pairesNoms: 1, jumellesManquees: 1, retireesDoublons: 1 };
for (const d of Object.keys(a).sort((x, y) => +x.slice(3) - +y.slice(3))) {
  const diffs = [...cles, 'tiersManquant'].filter(k => a[d][k] !== b[d][k]).map(k => `${k} ${a[d][k]}→${b[d][k]}${(pire[k] && b[d][k] < a[d][k]) || (mieuxBas[k] && b[d][k] > a[d][k]) ? ' RECUL' : ''}`);
  if (diffs.length) console.log(d.padEnd(6), diffs.join(' ; '));
}
console.log('AVANT', JSON.stringify(A.tot)); console.log('APRES', JSON.stringify(B.tot));
