/**
 * Diagnostic gratuit de l'étape IA : pour chaque lien, le texte que l'IA recevrait (markdown nettoyé, tronqué) contient-il les
 * caractéristiques attendues par la vérité ? C'est le plafond de ce que l'IA peut rendre (la garde exige que chaque valeur soit écrite).
 *   npx tsx work/missions/2026-11-23-carnet-en-ligne/banc-liens/texte-ia.ts [--seul 3,17] [--montre 30]
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { BANC, verites } from '../../../../scripts/banc-liens';
import { markdownProduit } from '../../../../functions/src/lienIA';

const args = process.argv.slice(2);
const val = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const seul = val('--seul')?.split(',').map(Number);
const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[\s ]+/g, ' ');
const nombres = (t: string) => (norm(t).replace(/(\d)['’.](?=\d{3}\b)/g, '$1').match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => x.replace(',', '.').replace(/\.0+$/, ''));

let attendues = 0, presentes = 0, liens = 0, avecCaract = 0;
for (const v of verites()) {
  if (seul && !seul.includes(v.n)) continue;
  const f = path.join(BANC, 'pages', `${String(v.n).padStart(2, '0')}.html.gz`);
  if (!fs.existsSync(f)) continue;
  const html = zlib.gunzipSync(fs.readFileSync(f)).toString('utf8');
  const titre = v.nom.exact ?? undefined;
  const md = markdownProduit(html, titre);
  const nb = new Set(nombres(md));
  const nt = norm(md);
  const ok = v.caract.filter((c) => { const ns = nombres(c.valeur); return ns.length ? ns.every((n) => nb.has(n)) : nt.includes(norm(c.valeur)); });
  liens++; attendues += v.caract.length; presentes += ok.length; if (v.caract.length) avecCaract++;
  const prixEcrit = v.prix !== null && (nt.includes(String(v.prix).replace('.', ',')) || nt.includes(v.prix.toFixed(2)) || nombres(md).includes(String(v.prix)));
  console.log(`${String(v.n).padStart(2)} | texte ${String(md.length).padStart(5)} car. | caract dans le texte ${ok.length}/${v.caract.length} | prix écrit ${v.prix === null ? '-' : prixEcrit ? 'oui' : 'NON'}`);
  if (val('--montre') === String(v.n)) console.log(md);
}
console.log(`\nCaractéristiques attendues présentes dans le texte envoyé : ${presentes}/${attendues} (${attendues ? Math.round((presentes / attendues) * 100) : 0} %), ${avecCaract} liens à caractéristiques sur ${liens}`);
