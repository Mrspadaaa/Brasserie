// Seconde passe de #144 : les couleurs en dur HORS palette (teintes propres d'un composant) dans les CSS de src/.
// Chaque valeur devient une variable `--c-<hex>` (aplat) ou `--ct-<hex>` (texte), définie dans
// src/theme/couleurs-portees.css : en « cave », sa valeur d'origine exacte (rendu inchangé) ; en clair, une valeur
// dérivée par une règle unique, écrite ci-dessous :
//  - teinte neutre (saturation < 0,22) : le degré `cave-*` le plus proche en luminance, pris dans le clair
//    (aplat → `--cave-X`, texte → `--cave-texte-X`) ;
//  - teinte colorée : sa famille (vert → houblon, bleu → eau, jaune → attention, orange/rouge → alerte, violet →
//    agenda) ; un texte prend la variante texte claire de la famille, un aplat sombre devient un voile léger de la
//    famille sur blanc, un aplat clair prend l'aplat de la famille.
// Blanc, noir et leurs voiles (ombres, reflets) ne changent pas. Commentaires ignorés.
// Exclus : src/ui/hopV55 (feuille claire à part), src/ui/hopIndex/maBiere (déjà en jetons, partagé avec la maquette),
// src/theme. Usage : node scripts/theme/porter-reste.mjs [--ecrire]
import fs from 'node:fs';
import path from 'node:path';

const CAVE = { 950: '12100e', 900: '1a1613', 850: '221d19', 800: '2c2521', 700: '3d342e', 600: '574a42', 400: '9a8a7e', 200: 'd8cec5', 50: 'f5f0ea' };
const CLAIR = { 950: [255, 255, 255], 900: [245, 245, 245], 850: [235, 235, 235], 800: [221, 221, 221], 700: [191, 191, 191], 600: [158, 158, 158], 400: [102, 102, 102], 200: [51, 51, 51], 50: [17, 17, 17] };
const CLAIR_TEXTE = { 950: [17, 17, 17], 900: [17, 17, 17], 850: [26, 26, 26], 800: [34, 34, 34], 700: [51, 51, 51], 600: [102, 102, 102], 400: [102, 102, 102], 200: [51, 51, 51], 50: [17, 17, 17] };
// Familles en clair : [aplat, texte] (valeurs de src/theme/themes.css).
const FAMILLE = {
  hop: [[86, 127, 69], [63, 107, 46]], water: [[79, 126, 155], [47, 95, 125]], attention: [[156, 112, 32], [127, 91, 16]],
  alert: [[200, 56, 47], [168, 41, 31]], agenda: [[106, 79, 176], [106, 79, 176]], production: [[154, 79, 30], [154, 79, 30]],
};
const rgb = (h) => (h.length === 3 ? [...h].map((c) => parseInt(c + c, 16)) : [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)));
const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
function hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}
const famille = (h) => (h < 18 || h >= 330 ? 'alert' : h < 36 ? 'production' : h < 62 ? 'attention' : h < 170 ? 'hop' : h < 255 ? 'water' : 'agenda');
const melange = (a, b, t) => a.map((x, i) => Math.round(x * (1 - t) + b[i] * t));

export function clair(hex, texte) {
  const c = rgb(hex);
  const [h, s, l] = hsl(c);
  if (s < 0.22 || l < 0.08) {
    const L = lum(c);
    let best = '950', ecart = Infinity;
    for (const [k, v] of Object.entries(CAVE)) { const e = Math.abs(Math.log((lum(rgb(v)) + 0.05) / (L + 0.05))); if (e < ecart) { ecart = e; best = k; } }
    return (texte ? CLAIR_TEXTE : CLAIR)[best];
  }
  const [aplat, encre] = FAMILLE[famille(h)];
  if (texte) return encre;
  return l < 0.35 ? melange([255, 255, 255], aplat, 0.12) : aplat;
}

const BLANC_NOIR = /^(fff|ffffff|000|000000)$/i;
const TEXTE = new Set(['color', '-webkit-text-fill-color', 'caret-color']);
const ecrire = process.argv.includes('--ecrire');
const fichiers = [];
(function marcher(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!/^src[\\/](ui[\\/]hopV55|ui[\\/]hopIndex[\\/]maBiere|theme)$/.test(p)) marcher(p); }
    else if (e.name.endsWith('.css')) fichiers.push(p);
  }
})('src');

const vars = new Map(); // nom → [hex d'origine, rgb clair]
let total = 0;
const bilan = [];
for (const f of fichiers) {
  const avant = fs.readFileSync(f, 'utf8');
  const notes = [];
  const sans = avant.replace(/\/\*[\s\S]*?\*\//g, (c) => `/*@${notes.push(c) - 1}@*/`);
  let n = 0;
  const apres = sans.replace(/\{([^{}]*)\}/g, (bloc, corps) => `{${corps.replace(/(^|;|\n)(\s*)(--[-a-z0-9]+|[-a-z]+)(\s*:\s*)([^;]*)/gi, (m, deb, esp, prop, sep, val) => {
    const estTexte = TEXTE.has(prop.toLowerCase()) || /(^--.*(text|ink|muted|fg|encre))/i.test(prop);
    const v = val.replace(/#([0-9a-f]{3,8})\b/gi, (hx, h) => {
      if (![3, 4, 6, 8].includes(h.length)) return hx;
      const base = h.length <= 4 ? h.slice(0, 3) : h.slice(0, 6);
      const a = h.length === 4 ? parseInt(h[3] + h[3], 16) / 255 : h.length === 8 ? parseInt(h.slice(6), 16) / 255 : null;
      if (BLANC_NOIR.test(base)) return hx;
      const cle = base.length === 3 ? [...base].map((c) => c + c).join('').toLowerCase() : base.toLowerCase();
      const nom = `--${estTexte ? 'ct' : 'c'}-${cle}`;
      vars.set(nom, [cle, clair(cle, estTexte)]);
      n++;
      return a == null ? `rgb(var(${nom}))` : `rgb(var(${nom}) / ${a.toFixed(2)})`;
    });
    return deb + esp + prop + sep + v;
  })}}`);
  const fin = apres.replace(/\/\*@(\d+)@\*\//g, (m, i) => notes[i]);
  if (n) { bilan.push(`${String(n).padStart(4)} ${f}`); total += n; if (ecrire) fs.writeFileSync(f, fin); }
}
console.log(bilan.join('\n'));
console.log(`${total} couleurs hors palette ${ecrire ? 'portées' : 'à porter'}, ${vars.size} variables`);
if (ecrire) {
  const tri = [...vars.entries()].sort(([a], [b]) => a.localeCompare(b));
  const ligne = ([nom, [hex, c]], cave) => `  ${nom}: ${cave ? rgb(hex).join(' ') : c.join(' ')};`;
  const css = `/* Généré par scripts/theme/porter-reste.mjs (#144) : les teintes propres des composants, par thème.
 * Cave : la valeur d'origine exacte. Clair : la valeur dérivée par la règle écrite en tête du script. Ne pas éditer à la
 * main ; relancer le script. */
:root,
[data-theme='clair'] {
${tri.map((e) => ligne(e, false)).join('\n')}
}

[data-theme='cave'] {
${tri.map((e) => ligne(e, true)).join('\n')}
}
`;
  const cible = 'src/theme/couleurs-portees.css';
  fs.writeFileSync(cible, css);
}
