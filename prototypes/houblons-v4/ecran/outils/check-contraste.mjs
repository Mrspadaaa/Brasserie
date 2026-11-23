// Contrôle des contrastes des thèmes de l'écran (ratio WCAG 2.2), lus dans src/themes.css.
// Usage (depuis prototypes/houblons-v4) : npm run ecran:contraste
// Seuils (recherche G, THEMES.md) : valeur lue et texte courant ≥ 7:1 ; texte secondaire et
// accents en texte ≥ 4,5:1 ; marques porteuses de sens ≥ 3:1 ; ni #000 ni #fff.
// Le thème « clair » est bloquant. Le thème « cave » reprend l'app à l'identique : ses écarts
// sont listés comme hérités, sans faire échouer le contrôle.
// Témoin négatif : CONTRASTE_TEMOIN=1 remplace l'encre secondaire claire par #8A7B6E (3,5:1) :
// le contrôle doit alors imprimer CONTRASTE ECHEC.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(ici, '../src/themes.css'), 'utf8');

function bloc(selecteur) {
  const debut = css.indexOf(selecteur);
  if (debut < 0) throw new Error(`bloc ${selecteur} introuvable`);
  const corps = css.slice(css.indexOf('{', debut) + 1, css.indexOf('}', debut));
  return Object.fromEntries([...corps.matchAll(/--([\w-]+):\s*(\d+)\s+(\d+)\s+(\d+);/g)].map((m) => [m[1], [+m[2], +m[3], +m[4]]]));
}
const themes = { clair: bloc("[data-theme='clair'] {"), cave: bloc("[data-theme='cave'] {") };
if (process.env.CONTRASTE_TEMOIN) themes.clair['cave-texte-400'] = [138, 123, 110];

const lum = (rgb) => rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
  .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

const FONDS = ['cave-950', 'cave-900', 'cave-850'];
const REGLES = [
  ...['cave-texte-50', 'cave-texte-200'].map((t) => ({ avant: t, fonds: FONDS, seuil: 7, role: 'valeur lue, texte courant' })),
  { avant: 'cave-texte-400', fonds: FONDS, seuil: 4.5, role: 'texte secondaire' },
  { avant: 'cave-texte-950', fonds: ['ebc-straw'], seuil: 7, role: 'texte sur aplat paille' },
  ...['ebc-straw-texte', 'repere-texte', 'hop-texte', 'water-texte', 'alert-texte', 'alert-strong-texte', 'attention-texte',
    'area-production-texte', 'area-finances-texte', 'area-stocks-texte', 'area-agenda-texte']
    .map((t) => ({ avant: t, fonds: FONDS, seuil: 4.5, role: 'accent en texte' })),
  ...['marque', 'repere', 'hop', 'water', 'alert', 'attention'].map((t) => ({ avant: t, fonds: ['cave-950', 'cave-900'], seuil: 3, role: 'marque porteuse de sens' })),
];

let echec = false;
const resume = [];
for (const [nom, v] of Object.entries(themes)) {
  const ecarts = [];
  let paires = 0;
  for (const r of REGLES) for (const f of r.fonds) {
    if (!v[r.avant] || !v[f]) { ecarts.push(`jeton absent : --${v[r.avant] ? f : r.avant}`); continue; }
    paires++;
    const x = ratio(v[r.avant], v[f]);
    if (x < r.seuil) ecarts.push(`${r.avant} sur ${f} : ${x.toFixed(2)}:1 < ${r.seuil} (${r.role})`);
  }
  for (const [k, rgb] of Object.entries(v)) {
    const s = rgb.join(' ');
    if (s === '0 0 0' || s === '255 255 255') ecarts.push(`--${k} : #000 ou #fff pur`);
  }
  if (nom === 'clair' && ecarts.length) echec = true;
  resume.push(`${nom} : ${paires} paires, ${ecarts.length} écart(s)${nom === 'cave' && ecarts.length ? ' hérités de l\'app (non bloquants)' : ''}`);
  for (const e of ecarts) resume.push(`  ${e}`);
}
console.log(resume.join('\n'));
console.log(echec ? 'CONTRASTE ECHEC (thème clair)' : 'CONTRASTE OK (thème clair)');
if (echec) process.exitCode = 1;
