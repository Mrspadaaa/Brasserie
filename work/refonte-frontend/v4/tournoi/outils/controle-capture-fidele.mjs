#!/usr/bin/env node
// 26.10, voie m3-listes-u4 : « Mais je comprends pas, on a déjà une vue pour substituer, et c'est pas du tout celles ci ??? »
// « Comment cette info a été perdue ?? ». La voie m2 masquait tout l'écran Substituer de l'app (`.pq-substituer > :not(.m2l-ajout)
// { display: none }`) et posait à sa place une liste inventée. Règle n° 1 : son écran se montre tel quel ; seul l'ordre change.
//
// Ce contrôle lit un script de capture et refuse :
//   F1 un script qui cache des nœuds de l'écran de l'app : une règle CSS qui masque (display: none, visibility: hidden,
//      opacity: 0, hauteur ou taille de police nulle) et dont le sélecteur vise l'écran (`:not(...)`, classes `pq-…`,
//      `[data-ecran]`, `[data-role]`, `[data-…]`, `*`), ou une écriture directe (`style.display = 'none'`, `hidden = true`…) ;
//   F2 une mesure absente ou perdante : le script mesure à chaque capture, dans la page rendue, l'écran sans l'injection
//      (`avant`) puis avec (`apres`), et l'écrit dans `fidelite.json`, à côté de lui. Un écran qui compte moins de nœuds
//      visibles hors rangées, ou qui perd un bloc (data-role, data-etat, titres, résumés), après l'injection est refusé.
//      `avant` : l'écran tel que l'app le rend, avec la liste de la colonne, avant que le script y touche ; `apres` : l'écran à la
//      prise de vue. Un script qui masque, retire ou remplace des nœuds entre les deux perd des nœuds. `referenceA` (facultatif) :
//      les blocs de la colonne A, sans injection, que la colonne doit garder (les nœuds, eux, suivent les données).
// Format de fidelite.json :
//   { "mesures": [ { "image": "…png", "houblon": "…", "colonne": "b", "avant": { "noeudsHorsRangs": 212, "blocs": ["…"] }, "apres": { … },
//                    "referenceA": { "blocs": ["…"] } } ] }
//
// Usage : node controle-capture-fidele.mjs <script de capture> [--mesure=<fidelite.json>]
// Sortie : une ligne par défaut, puis « FIDELE OK » ou « FIDELE ECHEC (k) » ; code de sortie 0 ou 1.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** Le script sans ses commentaires (un commentaire qui cite `display: none` n'est pas une règle). */
export function sansCommentaires(texte) {
  return texte.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[\s;{}()])\/\/.*$/gm, '$1');
}

const MASQUE = /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?![.\d])|font-size\s*:\s*0(?![.\d])|(?:^|[\s;])(?:max-)?height\s*:\s*0(?:px)?\s*(?:!important)?\s*(?:;|$)|clip-path\s*:\s*inset\(\s*100%/i;
/** Un sélecteur qui vise l'écran de l'app : `:not(`, une classe `pq-…`, un attribut `data-…`, `*`. */
const VISE_L_ECRAN = /:not\(|\bpq-|\[data-|\[hidden|data-ecran|(^|[\s>+~,])\*/i;
const ECRITURES = [
  [/\.style\.(?:display|visibility)\s*=\s*['"`](?:none|hidden)['"`]/, "écriture directe style.display / visibility"],
  [/setProperty\(\s*['"`](?:display|visibility)['"`]\s*,\s*['"`](?:none|hidden)/, 'setProperty(display|visibility, none|hidden)'],
  [/\.hidden\s*=\s*true|setAttribute\(\s*['"`]hidden['"`]/, 'attribut hidden posé'],
];

/** F1 : les règles et écritures qui cachent l'écran de l'app. Rend une liste de défauts (vide : rien de caché). */
export function nodesCaches(texte) {
  const code = sansCommentaires(texte);
  const defauts = [];
  const regle = /([^{}`;]+)\{([^{}]*)\}/g;
  let m;
  while ((m = regle.exec(code))) {
    const sel = m[1].trim().replace(/\s+/g, ' '), corps = m[2];
    if (!MASQUE.test(corps) || !sel) continue;
    // Les chaînes JS (`{ display: 'none' }` entre guillemets) ne sont pas du CSS : le corps CSS n'a pas de guillemet avant `none`.
    if (!VISE_L_ECRAN.test(sel)) continue;
    defauts.push(`règle qui masque l'écran de l'app : « ${sel.slice(-90)} { ${corps.trim().replace(/\s+/g, ' ').slice(0, 60)} }`);
  }
  for (const [re, nom] of ECRITURES) if (re.test(code)) defauts.push(nom);
  return defauts;
}

/** F2 : chaque mesure garde tous les blocs de l'écran et au moins ses nœuds visibles hors rangées. */
export function mesurePerdante(json) {
  const defauts = [];
  const mesures = json?.mesures;
  if (!Array.isArray(mesures) || !mesures.length) return ['aucune mesure dans fidelite.json'];
  for (const x of mesures) {
    const a = x.avant, b = x.apres, nom = x.image ?? `${x.houblon ?? '?'} ${x.colonne ?? '?'}`;
    if (!a || !b || !Number.isFinite(a.noeudsHorsRangs) || !Number.isFinite(b.noeudsHorsRangs)) { defauts.push(`${nom} : mesure incomplète`); continue; }
    if (b.noeudsHorsRangs < a.noeudsHorsRangs) defauts.push(`${nom} : ${b.noeudsHorsRangs} nœuds visibles hors rangées après l'injection, ${a.noeudsHorsRangs} avant`);
    const perdus = (a.blocs ?? []).filter((k) => !(b.blocs ?? []).includes(k));
    if (perdus.length) defauts.push(`${nom} : blocs perdus après l'injection : ${perdus.slice(0, 5).join(', ')}`);
    // La colonne A (le moteur, sans injection) est la référence des blocs : les nœuds, eux, dépendent des données (les deux comparés
    // du face à face changent avec la liste), pas les blocs.
    const perdusA = (x.referenceA?.blocs ?? []).filter((k) => !(b.blocs ?? []).includes(k));
    if (perdusA.length) defauts.push(`${nom} : blocs de la colonne A absents : ${perdusA.slice(0, 5).join(', ')}`);
  }
  return defauts;
}

async function main() {
  const args = process.argv.slice(2);
  const script = args.find((a) => !a.startsWith('--'));
  if (!script) { console.log('usage : node controle-capture-fidele.mjs <script de capture> [--mesure=<fidelite.json>]'); process.exit(2); }
  const chemin = path.resolve(script);
  if (!fs.existsSync(chemin)) { console.log(`FIDELE ECHEC : script introuvable ${chemin}`); process.exit(1); }
  const defauts = [];
  for (const d of nodesCaches(fs.readFileSync(chemin, 'utf8'))) defauts.push(`F1 ${d}`);
  const mesure = path.resolve(args.find((a) => a.startsWith('--mesure='))?.split('=')[1] ?? path.join(path.dirname(chemin), 'fidelite.json'));
  if (!fs.existsSync(mesure)) defauts.push(`F2 pas de mesure : ${mesure} n'existe pas (le script doit la mesurer à chaque capture)`);
  else {
    let json = null;
    try { json = JSON.parse(fs.readFileSync(mesure, 'utf8')); } catch { defauts.push(`F2 ${mesure} illisible`); }
    if (json) for (const d of mesurePerdante(json)) defauts.push(`F2 ${d}`);
    else if (!defauts.some((d) => d.startsWith('F2'))) defauts.push('F2 aucune mesure');
  }
  for (const d of defauts) console.log(`✗ ${d}`);
  if (defauts.length) { console.log(`FIDELE ECHEC (${defauts.length})`); process.exit(1); }
  console.log(`FIDELE OK (${path.basename(chemin)} : rien de caché, mesure gardée)`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
