// Voie port-total, P5 : compter (nombres seulement) les lignes de port lues sous un autre genre que `shipping`.
// (a) une ligne de la lecture alignée par indice sur la ligne `shipping` de la vérité d'avant, dont le kind n'est pas `shipping` ;
// (b) une ligne non `shipping` dont le libellé replié est exactement dans la liste fermée.
// Usage : node compter-ports.mjs <REELS_DIR> [--temoin]. Aucune valeur de pièce n'est affichée.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const LISTE = new Set(['port', 'frais de port', 'livraison', 'versand', 'fracht', 'porto', 'frais d envoi', "frais d'envoi"]);
const replie = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, ' ').replace(/\s+/g, ' ').trim();
const LISTE_REPLIEE = new Set([...LISTE].map(replie));

/** Pur : compte pour un enregistrement (une lecture) contre la vérité de sa pièce. */
export function compterLecture(items, expectedItems) {
  let a = 0, b = 0;
  const lues = Array.isArray(items) ? items : [];
  (expectedItems ?? []).forEach((ligne, index) => {
    const estPort = Array.isArray(ligne.kind) && ligne.kind.length === 1 && ligne.kind[0] === 'shipping';
    if (estPort && lues[index] && lues[index].kind !== 'shipping') a++;
  });
  for (const ligne of lues) if (ligne.kind !== 'shipping' && LISTE_REPLIEE.has(replie(ligne.name))) b++;
  return { a, b };
}

function temoin() {
  const verite = [{ name: 'x', kind: ['stock'] }, { name: 'y', kind: ['shipping'] }];
  const lecture = [{ name: 'x', kind: 'stock' }, { name: 'Versand', kind: 'service' }];
  const r = compterLecture(lecture, verite);
  if (r.a !== 1 || r.b !== 1) throw new Error(`témoin raté : ${JSON.stringify(r)}`);
  const propre = compterLecture([{ name: 'x', kind: 'stock' }, { name: 'port', kind: 'shipping' }], verite);
  if (propre.a !== 0 || propre.b !== 0) throw new Error(`témoin propre raté : ${JSON.stringify(propre)}`);
  const produit = compterLecture([{ name: 'Portwein', kind: 'stock' }], []);
  if (produit.b !== 0) throw new Error('Portwein ne doit pas compter');
  console.log('TEMOIN OK : (a)=1 (b)=1 sur le port en service ; 0 sur la lecture propre ; Portwein ignoré');
}

const [reels, flag] = process.argv.slice(2);
if (flag === '--temoin' || reels === '--temoin') { temoin(); process.exit(0); }
temoin();
const dirs = ['banc-k1-20261101-081144', 'banc-k4-20261101-092139', 'banc-k4-20261101-092559', 'banc-k4-20261101-093815', 'banc-k5-A', 'banc-k5-B1', 'banc-k5-B2', 'banc-k5-C'];
const verites = new Map();
for (const f of ['cas.avant-port.json', 'cas-2.avant-port.json', 'cas-3.json', 'cas-4.avant-port.json']) {
  const p = path.join(reels, f), q = existsSync(p) ? p : path.join(reels, f.replace('.avant-port', ''));
  const parsed = JSON.parse(readFileSync(q, 'utf8'));
  for (const c of Array.isArray(parsed) ? parsed : parsed.cases) verites.set(c.id, c.expected?.items ?? []);
}
let lectures = 0, a = 0, b = 0;
const cellulesA = new Set(), cellulesB = new Set();
const parDoc = {};
for (const d of dirs) {
  const file = path.join(reels, d, 'results.json');
  if (!existsSync(file)) { console.log(`absent : ${d}`); continue; }
  const data = JSON.parse(readFileSync(file, 'utf8'));
  for (const record of data.records ?? []) {
    for (const [variante, run] of Object.entries(record.variants ?? {})) {
      if (!run?.result) continue;
      lectures++;
      parDoc[record.doc] = (parDoc[record.doc] ?? 0) + 1;
      const r = compterLecture(run.result.items, verites.get(record.doc));
      a += r.a; b += r.b;
      if (r.a) cellulesA.add(`${record.doc}/${variante}`);
      if (r.b) cellulesB.add(`${record.doc}/${variante}`);
    }
  }
}
console.log(`lectures examinées : ${lectures} (sur ${dirs.length} sorties prêtées, ${Object.keys(parDoc).length} pièces)`);
console.log(`(a) port de la vérité lu sous un autre genre : ${a} ; cellules : ${[...cellulesA].sort().join(', ') || 'aucune'}`);
console.log(`(b) libellé de la liste fermée sur une ligne non shipping : ${b} ; cellules : ${[...cellulesB].sort().join(', ') || 'aucune'}`);
console.log(`lectures des pièces à port (doc5, doc8, doc9) examinées : ${(parDoc.doc5 ?? 0) + (parDoc.doc8 ?? 0) + (parDoc.doc9 ?? 0)}`);
