// BR-45 (09.11) : les couleurs écrites en dur de l'atelier Houblons V5.5 deviennent des jetons de thème.
// Mécanisme de scripts/theme/porter-reste.mjs (#144), dans l'autre sens : chaque couleur devient
// `rgb(var(--hv-<rôle>-<hex>))` (alpha gardé : `rgb(var(--x) / a)`), définie dans src/ui/hopV55/jetons.css :
//  - clair : la valeur d'origine exacte (rendu inchangé par construction) ;
//  - cave : dérivée par une règle unique, écrite ici (méthode « dynamic theme » de Dark Reader, en CIELCh D65,
//    ancrée sur les jetons cave de src/theme/themes.css ; plus proche jeton en ΔE CIEDE2000, culori) :
//    · fond (f) et ombre (o) : un fond déjà sombre (L* ≤ 55) reste, sauf une teinte saturée (C* ≥ 14) sous L* 38, relevée à L* 34–38 ; un fond clair fonce. Le papier de l'atelier
//      (#f5f2e9) devient la page `cave-950`, le blanc d'un panneau `cave-900` ; une teinte plus sombre que le papier
//      en clair devient une surface plus claire en cave (surélévation : L* = L(cave-900) + 0,7 × l'écart au papier).
//      Neutre (C* < 8) : le jeton `cave-*` le plus proche (ΔE2000) ; teinte : son angle gardé, C* ≤ 22.
//    · texte (t) : un texte déjà clair (L* > 60) reste ; un texte sombre s'éclaircit. Neutre (C* < 16) : par rang,
//      L* ≤ 21 (l'encre de l'atelier) → `cave-texte-50`, ≤ 36 → `cave-texte-200`, au-delà → `cave-texte-400` (les trois tons de lecture de
//      DESIGN.md). Teinte : angle gardé, L* = 110 − L* borné à [65, 88], puis éclairci jusqu'à 4,5:1 sur `cave-800`.
//    · trait (l : bordure, contour, filet, trait SVG) : L* inversé (100 − L*). Neutre (C* < 12) : le jeton `cave-*`
//      le plus proche (ΔE2000) ; teinte : angle gardé, L* borné à [32, 85] (sa discrétion relative du clair est gardée).
// Un alias local (`--hq-ink: #…`) prend le rôle de ses emplois ; employé dans plusieurs rôles, il reçoit un alias par
// rôle (`--hq-ink--t`) et ses emplois sont réécrits. Les styles en ligne des TSX suivent la même règle.
// Usage : BR45_DEPS=<dossier d'un npm install culori> node src/ui/hopV55/jetons/porter.mjs [--ecrire] [--table]
// Sans --ecrire : bilan seul. Ne pas éditer jetons.css à la main : corriger la règle ici et relancer.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import postcss from 'postcss';
import valueParser from 'postcss-value-parser';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..');
const DOSSIER = path.join(RACINE, 'src', 'ui', 'hopV55');
const CIBLE = path.join(DOSSIER, 'jetons.css');
const require_ = createRequire(path.join(process.env.BR45_DEPS ?? RACINE, 'x.js'));
const culori = require_('culori');
const { converter, differenceCiede2000, wcagContrast, clampChroma, formatHex } = culori;
const lch = converter('lch65');
const dE = differenceCiede2000();
const ECRIRE = process.argv.includes('--ecrire');

// Jetons cave de src/theme/themes.css (les valeurs réelles, lues).
const themes = fs.readFileSync(path.join(RACINE, 'src/theme/themes.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const blocCave = themes.match(/\[data-theme='cave'\]\s*\{([^}]*)\}/)[1];
const CAVE = Object.fromEntries([...blocCave.matchAll(/--([-a-z0-9]+):\s*(\d+)\s+(\d+)\s+(\d+);/g)].map((m) => [m[1], `rgb(${m[2]},${m[3]},${m[4]})`]));
const SURFACES = ['cave-950', 'cave-900', 'cave-850', 'cave-800', 'cave-700', 'cave-600'];
const TRAITS = ['cave-800', 'cave-700', 'cave-600', 'cave-400', 'cave-200', 'cave-50'];
const L_ = (n) => lch(CAVE[n]).l;
const PAPIER = lch('#f5f2e9').l;
const TEINTE_CAVE = lch(CAVE['cave-800']).h;

const hex6 = (c) => formatHex(c).slice(1);
const rgbCanaux = (h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ');
const borne = (x, a, b) => Math.min(b, Math.max(a, x));
// Neutre : le jeton le plus proche en ΔE2000, la couleur cherchée prenant la teinte et la chroma du jeton comparé (seule la clarté
// départage ; sinon, dans le très sombre, l'écart de chroma l'emporte et le papier tombe sur cave-900).
const ecartL = (l, n) => { const t = lch(CAVE[n]); return dE({ ...t, l }, t); };
const plusProche = (l, noms) => noms.reduce((m, n) => (ecartL(l, n) < ecartL(l, m) ? n : m));
function eclaircir(c, fond, seuil) {
  let x = clampChroma({ ...c }, 'lch65');
  while (wcagContrast(x, fond) < seuil && c.l < 100) { c = { ...c, l: c.l + 0.5 }; x = clampChroma({ ...c }, 'lch65'); }
  return x;
}

/** Valeur cave d'une couleur claire (hex6) dans un rôle : `var(--cave-…)` ou des canaux « r g b ». */
export function cave(hex, role) {
  const o = lch(`#${hex}`);
  const C = o.c ?? 0, h = o.h ?? TEINTE_CAVE;
  if (role === 'f' || role === 'o') {
    // Un fond de teinte sombre et saturée (action, repère) se relève à L* 34–38 : sinon, vert sombre sur charbon, l'action
    // principale ressort moins que les secondaires (critique du 09.11, « Préparer l'essai »). L'ordre des clartés est gardé.
    if (role === 'f' && o.l < 38 && o.l >= 15 && C >= 14) return rgbCanaux(hex6(clampChroma({ mode: 'lch65', l: 34 + ((o.l - 15) * 4) / 23, c: C, h }, 'lch65')));
    if (o.l <= 55) return rgbCanaux(hex);
    const l = o.l >= PAPIER ? L_('cave-950') + ((o.l - PAPIER) / (100 - PAPIER)) * (L_('cave-900') - L_('cave-950'))
      : L_('cave-900') + 0.7 * (PAPIER - o.l);
    if (C < 8) return `var(--${plusProche(l, SURFACES)})`;
    return rgbCanaux(hex6(clampChroma({ mode: 'lch65', l, c: Math.min(C, 22), h }, 'lch65')));
  }
  if (role === 't') {
    if (o.l > 60) return rgbCanaux(hex);
    if (C < 16) return `var(--cave-texte-${o.l <= 21 ? 50 : o.l <= 36 ? 200 : 400})`;
    return rgbCanaux(hex6(eclaircir({ mode: 'lch65', l: borne(110 - o.l, 65, 88), c: C, h }, CAVE['cave-800'], 4.5)));
  }
  const l = 100 - o.l;
  if (C < 12) return `var(--${plusProche(l, TRAITS)})`;
  return rgbCanaux(hex6(clampChroma({ mode: 'lch65', l: borne(l, 32, 85), c: C, h }, 'lch65')));
}

// ---- Lecture des couleurs littérales ----
const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
/** { hex, alpha } d'un nœud de valeur couleur littérale, ou null. */
function litterale(n) {
  if (n.type === 'word' && HEX.test(n.value)) {
    let h = n.value.slice(1).toLowerCase();
    if (h.length <= 4) h = [...h].map((x) => x + x).join('');
    return { hex: h.slice(0, 6), alpha: h.length === 8 ? +(parseInt(h.slice(6), 16) / 255).toFixed(3) : null };
  }
  if (n.type === 'word' && /^white$/i.test(n.value)) return { hex: 'ffffff', alpha: null };
  if (n.type === 'function' && /^rgba?$/i.test(n.value) && !valueParser.stringify(n.nodes).includes('var(')) {
    const v = n.nodes.filter((x) => x.type === 'word').map((x) => x.value);
    if (v.length < 3 || v.slice(0, 3).some((x) => !/^\d+(\.\d+)?$/.test(x))) return null;
    return { hex: v.slice(0, 3).map((x) => Math.round(+x).toString(16).padStart(2, '0')).join(''), alpha: v[3] ?? null };
  }
  return null;
}
const ROLE_PROP = (p) => {
  p = p.toLowerCase();
  if (/^(color|-webkit-text-fill-color|caret-color)$/.test(p)) return 't';
  if (/^background/.test(p) || p === 'accent-color') return 'f';
  if (/shadow/.test(p)) return 'o';
  return 'l';
};
const jetons = new Map(); // nom → { hex, role }
function jeton(lit, role) {
  const nom = `--hv-${role}-${lit.hex}`;
  jetons.set(nom, { hex: lit.hex, role });
  return lit.alpha == null || +lit.alpha === 1 ? `rgb(var(${nom}))` : `rgb(var(${nom}) / ${lit.alpha})`;
}
function reecrire(valeur, role) {
  const p = valueParser(valeur);
  let n = 0;
  p.walk((nd) => {
    const lit = litterale(nd);
    if (!lit) return;
    const v = jeton(lit, role);
    nd.type = 'word'; nd.value = v; delete nd.nodes; n++;
    return false;
  });
  return { valeur: p.toString(), n };
}

// ---- Passe 1 : fichiers, alias locaux et rôles de leurs emplois ----
const fichiers = fs.readdirSync(DOSSIER).filter((f) => f.endsWith('.css') && f !== 'jetons.css').map((f) => path.join(DOSSIER, f));
const arbres = new Map(fichiers.map((f) => [f, postcss.parse(fs.readFileSync(f, 'utf8'), { from: f })]));
const emplois = new Map(); // alias → Map(rôle → nombre) ; un alias employé dans un alias hérite de ses rôles
const dansAlias = new Map(); // alias → alias qui l'emploient
const aliasLitteraux = new Set();
for (const racine of arbres.values()) racine.walkDecls((d) => {
  if (d.prop.startsWith('--')) {
    let a = false; valueParser(d.value).walk((n) => { if (litterale(n)) a = true; });
    if (a) aliasLitteraux.add(d.prop);
  }
  for (const m of d.value.matchAll(/var\(\s*(--[-\w]+)/g)) {
    if (d.prop.startsWith('--')) { if (!dansAlias.has(m[1])) dansAlias.set(m[1], new Set()); dansAlias.get(m[1]).add(d.prop); continue; }
    const r = ROLE_PROP(d.prop);
    if (!emplois.has(m[1])) emplois.set(m[1], new Map());
    emplois.get(m[1]).set(r, (emplois.get(m[1]).get(r) ?? 0) + 1);
  }
});
function rolesDe(alias, vus = new Set()) {
  const t = new Map(emplois.get(alias) ?? []);
  if (vus.has(alias)) return t;
  vus.add(alias);
  for (const parent of dansAlias.get(alias) ?? []) for (const [r, k] of rolesDe(parent, vus)) t.set(r, (t.get(r) ?? 0) + k);
  return t;
}
const deviner = (nom) => (/ink|muted|text|encre/i.test(nom) ? 't' : /line|border|rule/i.test(nom) ? 'l' : 'f');
// Un alias suit le rôle de ses emplois s'il porte une couleur littérale, ou s'il renvoie (même par repli) à un alias
// qui le suit (point fixe) : `--aa-paper: var(--hv-panel, #fffefa)` employé en texte lit `--hv-panel--t`.
const refs = new Map(); // alias → alias qu'il emploie
for (const [a, parents] of dansAlias) for (const p of parents) { if (!refs.has(p)) refs.set(p, new Set()); refs.get(p).add(a); }
const suivis = new Set(aliasLitteraux);
for (let change = true; change;) { change = false; for (const [p, enfants] of refs) if (!suivis.has(p) && [...enfants].some((e) => suivis.has(e))) { suivis.add(p); change = true; } }
const roleAlias = new Map(); // alias → { dominant, autres[] }
for (const a of suivis) {
  const tri = [...rolesDe(a).entries()].sort((x, y) => y[1] - x[1]).map((x) => x[0]);
  roleAlias.set(a, { dominant: tri[0] ?? deviner(a), autres: tri.slice(1) });
}
const avertissements = [];
/** Dans une valeur lue au rôle r, `var(--x` devient `var(--x--r` quand --x a une variante pour ce rôle. */
const versRole = (valeur, r) => valeur.replace(/var\(\s*(--[-\w]+)(?=\s*[,)])/g, (m, a) => {
  const ra = roleAlias.get(a);
  if (!ra || ra.dominant === r) return m;
  if (ra.autres.includes(r)) return `var(${a}--${r}`;
  avertissements.push(`${a} lu au rôle ${r} sans variante`);
  return m;
});

// ---- Passe 2 : réécriture ----
let total = 0;
const bilan = [];
for (const [f, racine] of arbres) {
  let n = 0;
  racine.walkDecls((d) => {
    if (d.prop.startsWith('--') && roleAlias.has(d.prop)) {
      const { dominant, autres } = roleAlias.get(d.prop);
      for (const r of autres.slice().reverse()) d.cloneAfter({ prop: `${d.prop}--${r}`, value: reecrire(versRole(d.value, r), r).valeur });
      const x = reecrire(versRole(d.value, dominant), dominant); d.value = x.valeur; n += x.n;
      return;
    }
    const r = d.prop.startsWith('--') ? deviner(d.prop) : ROLE_PROP(d.prop);
    const x = reecrire(d.prop.startsWith('--') ? d.value : versRole(d.value, r), r);
    d.value = x.valeur; n += x.n;
  });
  if (n) { bilan.push(`${String(n).padStart(5)} ${path.relative(RACINE, f)}`); total += n; if (ECRIRE) fs.writeFileSync(f, racine.toString()); }
}

// Styles en ligne des TSX : `clé: '… #hex …'` ; le rôle vient de la clé (camelCase → propriété CSS).
const CLE_CSS = (k) => k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
for (const f of fs.readdirSync(DOSSIER).filter((x) => /\.tsx?$/.test(x)).map((x) => path.join(DOSSIER, x))) {
  const src = fs.readFileSync(f, 'utf8');
  let n = 0;
  const out = src.replace(/\b(\w+):\s*'([^'\n]*#[0-9a-fA-F]{3,8}\b[^'\n]*)'/g, (m, cle, val) => {
    const r = ROLE_PROP(CLE_CSS(cle));
    const x = reecrire(val, r); n += x.n;
    return `${cle}: '${x.valeur}'`;
  });
  if (n) { bilan.push(`${String(n).padStart(5)} ${path.relative(RACINE, f)}`); total += n; if (ECRIRE) fs.writeFileSync(f, out); }
}

// Rejouable : les jetons déjà employés (sources déjà portées) sont relus, et jetons.css est régénéré avec la règle actuelle.
for (const x of fs.readdirSync(DOSSIER).filter((n) => /\.(css|tsx?)$/.test(n) && n !== 'jetons.css')) {
  const p = path.join(DOSSIER, x);
  const src = arbres.has(p) ? arbres.get(p).toString() : fs.readFileSync(p, 'utf8');
  for (const m of src.matchAll(/var\((--hv-([tflo])-([0-9a-f]{6}))\)/g)) jetons.set(m[1], { hex: m[3], role: m[2] });
}
console.log(bilan.join('\n'));
console.log(`${total} couleurs ${ECRIRE ? 'portées' : 'à porter'}, ${jetons.size} jetons, ${[...roleAlias.values()].filter((x) => x.autres.length).length} alias à plusieurs rôles`);
if (avertissements.length) console.log('AVERTISSEMENTS\n' + avertissements.join('\n'));

const tri = [...jetons.entries()].sort(([a], [b]) => a.localeCompare(b));
if (process.argv.includes('--table')) for (const [nom, { hex, role }] of tri) console.log(`${nom.padEnd(18)} #${hex} → ${cave(hex, role)}`);
if (ECRIRE) {
  const css = `/* Généré par src/ui/hopV55/jetons/porter.mjs (BR-45, 09.11) : les couleurs de l'atelier Houblons V5.5, par thème.
 * Clair : la valeur d'origine exacte. Cave : la règle écrite en tête du script, ancrée sur les jetons cave de
 * src/theme/themes.css. Rôles : f fond, t texte, l trait, o ombre. Ne pas éditer à la main ; relancer le script. */
:root,
[data-theme='clair'] {
${tri.map(([nom, { hex }]) => `  ${nom}: ${rgbCanaux(hex)};`).join('\n')}
}

[data-theme='cave'] {
${tri.map(([nom, { hex, role }]) => `  ${nom}: ${cave(hex, role)};`).join('\n')}
}

/* Contrôles natifs (champs, listes, barres de défilement) sombres en cave. */
[data-theme='cave'] .hop-v55 { color-scheme: dark; }
`;
  fs.writeFileSync(CIBLE, css);
}
