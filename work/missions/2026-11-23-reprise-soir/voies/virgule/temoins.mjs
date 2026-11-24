#!/usr/bin/env node
/**
 * Témoins du contrôle de virgule (voie virgule). Lancer depuis la racine :
 *   node work/missions/2026-11-23-reprise-soir/voies/virgule/temoins.mjs > .../temoins.log
 *
 * NÉGATIFS : de vraies violations, toujours signalées (un nombre au point décimal reste une faute).
 * POSITIFS : les 3 formes de faux positifs du DOSSIER, plus signalées.
 * MORD : sur l'ancien contrôle (HEAD), les 3 formes sont signalées — le témoin positif sait donc échouer.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'virgule-temoins-'));

// Un fichier de formateurs fictif : de quoi construire l'index comme le fait le contrôle sur src/.
const FORMATEURS = [
  "export function chf(v: number): string {",
  "  const [e, d] = Math.abs(v).toFixed(2).split('.');",
  "  return `${v < 0 ? '−' : ''}${e.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ' ')},${d}`;",
  "}",
  "",
  "export function fmtPoint(v: number): string {",
  "  const [e, d] = v.toFixed(2).split('.');",
  "  return `${e}.${d}`;",
  "}",
  "",
  "export function fmtListe(v: number): string {",
  "  const [e, d] = v.toFixed(2).split('.');",
  "  return `${e}, ${d}`;",
  "}",
  "",
  "export function fmtSplitSeul(v: number): string {",
  "  return v.toFixed(2).split('.')[0];",
  "}",
  ""
].join('\n');

async function charger(urlOuChemin) {
  return import(urlOuChemin.startsWith('file:') ? urlOuChemin : pathToFileURL(urlOuChemin).href);
}

function construire(mod) {
  const f = path.join(tmp, 'formateurs.ts');
  fs.writeFileSync(f, FORMATEURS);
  const sains = mod.indexerFormateurs([f]).pour(f);
  return code => mod.analyserFichier('src/essai.tsx', code, sains);
}

const NB = '\u00a0';
const NEGATIFS = [
  ['nombre au point, variable calculée (division)', 'const x = a / 3;\n<b>{x} L</b>'],
  ['Math.round(x*10)/10 : un décimal', 'const x = Math.round(a * 10) / 10;\n<b>{x} L</b>'],
  ['toFixed(1) en variable', 'const x = valeur.toFixed(1);\n<b>{x} kg</b>'],
  ['constante qui porte un chiffre, pas de l\u2019espace', "const NB = '5';\nconst t = `${q}${NB}kg`;"],
  ['constante d\u2019espace en let (réaffectable)', `let NB = '${NB}';\nconst t = \`\${q}\${NB}kg\`;`],
  ['constante d\u2019espace définie APRÈS l\u2019usage', `const t = \`\${q}\${NB}kg\`;\nconst NB = '${NB}';`],
  ['ternaire dont une branche est décimale', 'const k = p ? Math.round(a) : a / 3;\n<b>{k} ppm</b>'],
  ['const entière mais inconnue : paramètre', 'function f(k: number) { return <b>{k} ppm</b>; }'],
  ['const entière d’une AUTRE fonction (function)', 'function A() {\n  const k = Math.round(a);\n  return k;\n}\nfunction B(k: number) {\n  return <b>{k} ppm</b>;\n}'],
  ['const entière d’un AUTRE composant (flèche)', 'export const A = () => {\n  const k = Math.round(a);\n  return k;\n};\nexport const B = (k: number) => {\n  return <b>{k} ppm</b>;\n};'],
  ['const entière en let (réaffectable)', 'let k = Math.round(a);\n<b>{k} ppm</b>'],
  ['formateur au point : split + ${e}.${d}', '<b>{fmtPoint(prix)} CHF</b>'],
  ['formateur : split + liste « e, d »', '<b>{fmtListe(prix)} CHF</b>'],
  ['formateur : split seul', '<b>{fmtSplitSeul(prix)} CHF</b>'],
  ['formateur inconnu', '<b>{chfInconnu(prix)} CHF</b>'],
  ['nombre brut au point', '<b>{prix} CHF</b>'],
  ['littéral décimal', '<b>{12.5} g</b>'],
  ['litres au point', '<span>Cible {recipe.volumeL} L</span>'],
  ['String(t)', '<b>{String(t)} °C</b>'],
  ['gabarit % brut', '`${valeur} %`']
];
const POSITIFS = [
  ['forme 1 : constante d\u2019espace insécable (murAutres.ts)',
    `const nf = (n: number) => (Math.round(n * 10) / 10).toLocaleString('fr-FR');\nconst NB = '${NB}';\nexport function t(q: number, u: string): string {\n  if (u === 'g') return q >= 1000 ? \`\${nf(q / 1000)}\${NB}kg\` : \`\${nf(q)}\${NB}g\`;\n  if (u === 'ml') return q >= 1000 ? \`\${nf(q / 1000)}\${NB}L\` : \`\${nf(q)}\${NB}ml\`;\n}`],
  ['forme 1 bis : constante écrite en échappement', "const FIN = '\\u202f';\nconst t = `${q}${FIN}kg`;"],
  ['forme 2 : chf = split + ,${d} (EssaiPrix.tsx)', '<span>{chf(prix)} CHF</span>\n<span>{chf(cout)} CHF</span>'],
  ['forme 3 : const x = cond ? Math.round(…) : null (WaterRadar.tsx)',
    "const kppm = potassium != null && Number.isFinite(potassium) && potassium > 0 ? Math.round(potassium) : null;\nconst a = `${kppm != null ? `, potassium ${kppm} ppm hors des six axes` : ''}`;"],
  ['forme 3 bis : ternaire imbriqué, branches entières ou null', 'const k = a ? Math.round(x) : b ? 0 : null;\n<b>{k} g</b>'],
  ['forme 3 dans une fonction, constante d’espace de module au-dessus', `const NB = '${NB}';\nfunction A() {\n  return \`\${q}\${NB}kg\`;\n}`],
  ['forme 3 ter : const x = Math.round(…) simple', 'const k = Math.round(x);\n<b>{k} g</b>'],
  ['forme 3 quater : ?? entre deux entiers', 'const k = Math.round(x) ?? 0;\n<b>{k} g</b>']
];

let echecs = 0;
const dit = (ok, texte) => { if (!ok) echecs++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${texte}`); };

const neuf = await charger(path.join(RACINE, 'scripts', 'agents', 'controle-virgule.mjs'));
const analyser = construire(neuf);
console.log('— NÉGATIFS : toujours signalés');
for (const [nom, code] of NEGATIFS) dit(analyser(code).length >= 1, `signalé  : ${nom}`);
console.log('— POSITIFS : plus signalés');
for (const [nom, code] of POSITIFS) {
  const v = analyser(code);
  dit(v.length === 0, `accepté  : ${nom}${v.length ? '  → ' + v.map(x => `{${x.expr}} ${x.unite}`).join(', ') : ''}`);
}

// MORD : l'ancien contrôle (HEAD) signale les 3 formes. Copie dans tmp, jamais dans le dépôt.
console.log('— MORD : le contrôle d\u2019avant signale les 3 formes');
const ancienChemin = path.join(tmp, 'controle-virgule-HEAD.mjs');
fs.writeFileSync(ancienChemin, execFileSync('git', ['show', 'HEAD:scripts/agents/controle-virgule.mjs'], { cwd: RACINE, maxBuffer: 1 << 24 }));
if (/virguleDecimale/.test(fs.readFileSync(ancienChemin, 'utf8'))) {
  console.log('SKIP HEAD contient déjà la correction (voie commitée) : témoin « mord » sans objet');
} else {
  const ancien = await charger(ancienChemin);
  const analyserAncien = construire(ancien);
  for (const [nom, code] of POSITIFS) dit(analyserAncien(code).length >= 1, `signalé avant : ${nom}`);
}

// Sur le vrai src/ : plus aucune écriture, et le script tient son code de sortie.
console.log('— SRC : le contrôle sur src/');
const v = neuf.controler();
dit(v.length === 0, `controler() sur src/ : ${v.length} violation(s)${v.length ? ' : ' + v.map(x => `${x.fichier}:${x.ligne}`).join(' ') : ''}`);

fs.rmSync(tmp, { recursive: true, force: true });
console.log(echecs ? `TÉMOINS ÉCHEC : ${echecs}` : 'TÉMOINS OK');
process.exit(echecs ? 1 : 0);
