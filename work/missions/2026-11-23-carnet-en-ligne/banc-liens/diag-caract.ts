/**
 * Diagnostic gratuit des caractéristiques manquantes : pour chaque lien dont la mesure est « ? », où la valeur attendue est-elle écrite ?
 * (texte visible de la page, markdown envoyé à l'IA, HTML brut : scripts et JSON compris) et que rend la lecture actuelle.
 *   npx tsx work/missions/2026-11-23-carnet-en-ligne/banc-liens/diag-caract.ts [mesure=ia-3]
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { BANC, verites } from '../../../../scripts/banc-liens';
import { markdownProduit } from '../../../../functions/src/lienIA';

const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[\s ]+/g, ' ');
const nombres = (t: string) => (norm(t).replace(/(\d)['’.](?=\d{3}\b)/g, '$1').match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => x.replace(',', '.').replace(/\.0+$/, ''));
const ecrit = (texte: string, valeur: string) => { const nb = new Set(nombres(texte)); const ns = nombres(valeur); return ns.length ? ns.every((n) => nb.has(n)) : norm(texte).includes(norm(valeur)); };
const sansCode = (h: string) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');

const mesure = JSON.parse(fs.readFileSync(path.join(BANC, 'mesures', `${process.argv[2] ?? 'ia-3'}.json`), 'utf8'));
for (const l of mesure.lignes) {
  const v = verites().find((x) => x.n === l.n)!;
  if (!v.caract.length || l.caract === '=') continue;
  const f = path.join(BANC, 'pages', `${String(v.n).padStart(2, '0')}.html.gz`);
  const html = fs.existsSync(f) ? zlib.gunzipSync(fs.readFileSync(f)).toString('utf8') : '';
  const visible = sansCode(html);
  const md = markdownProduit(html, v.nom.exact ?? undefined);
  console.log(`\n${v.n} ${l.statut} ${v.lien.slice(0, 70)}`);
  for (const c of v.caract) console.log(`   attendu ${c.nom} = ${c.valeur} | visible ${ecrit(visible, c.valeur) ? 'oui' : 'non'} | md ${ecrit(md, c.valeur) ? 'oui' : 'non'} | brut ${ecrit(html, c.valeur) ? 'oui' : 'non'}`);
  console.log('   lu :', ((l.lu.valeurs ?? []) as Array<{ nom: string; valeur: string }>).map((x) => `${x.nom}=${x.valeur}`).join(' | ').slice(0, 300));
}
