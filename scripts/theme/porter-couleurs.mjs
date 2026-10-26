// Porte les couleurs écrites en dur dans les CSS de src/ vers les jetons par thème (#144).
// Une valeur de la palette de l'app (cave-*, paille, rubriques, sémantiques) devient `rgb(var(--jeton))`, ou
// `rgb(var(--jeton) / a)` avec son opacité. Une propriété de texte (`color`…) prend la variante texte du jeton ; un texte
// sombre posé sur un aplat paille prend `--sur-paille` (blanc en clair, où la paille est noire).
// Usage : node scripts/theme/porter-couleurs.mjs [--ecrire] ; sans --ecrire, compte seulement.
// Exclus : src/ui/hopV55 (feuille claire à part, drapeau éteint), src/theme.
import fs from 'node:fs';
import path from 'node:path';

const PALETTE = {
  '12100e': 'cave-950', '1a1613': 'cave-900', '221d19': 'cave-850', '2c2521': 'cave-800', '3d342e': 'cave-700',
  '574a42': 'cave-600', '9a8a7e': 'cave-400', 'd8cec5': 'cave-200', 'f5f0ea': 'cave-50',
  'f2c14e': 'ebc-straw', 'e7a070': 'area-production', '86b9e6': 'area-finances', 'a3c97a': 'area-stocks',
  'bca5e8': 'area-agenda', 'e3b55d': 'attention', 'f29289': 'alert-strong', 'd6453d': 'alert', '6e9b5b': 'hop',
  '5b8aa6': 'water',
};
const rgbDe = (h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',');
const PAR_RGB = Object.fromEntries(Object.entries(PALETTE).map(([h, n]) => [rgbDe(h), n]));
const TEXTE = new Set(['color', '-webkit-text-fill-color', 'caret-color']);
const texte = (n) => (n.startsWith('cave-') ? n.replace('cave-', 'cave-texte-') : `${n}-texte`);

const ecrire = process.argv.includes('--ecrire');
const fichiers = [];
(function marcher(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!/^src[\\/](ui[\\/]hopV55|theme)$/.test(p)) marcher(p); }
    else if (e.name.endsWith('.css')) fichiers.push(p);
  }
})('src');

const alpha = (a) => { const x = a.trim(); return x.endsWith('%') ? String(Number(x.slice(0, -1)) / 100) : x; };
let total = 0;
const bilan = [];
for (const f of fichiers) {
  const avant = fs.readFileSync(f, 'utf8');
  let n = 0;
  // Blocs les plus intérieurs : une liste de déclarations.
  const apres = avant.replace(/\{([^{}]*)\}/g, (bloc, corps) => {
    const surPaille = /background(-color)?\s*:[^;]*(#f2c14e\b|rgba?\(\s*242\s*,\s*193\s*,\s*78\s*[,)]|var\(--ebc-straw\)\))/i.test(corps);
    const neuf = corps.replace(/(^|;|\n)(\s*)([-a-z]+)(\s*:\s*)([^;]*)/gi, (m, deb, esp, prop, sep, val) => {
      const estTexte = TEXTE.has(prop.toLowerCase());
      const nom = (base) => {
        if (estTexte && surPaille && base === 'cave-950') return 'sur-paille';
        return estTexte ? texte(base) : base;
      };
      let v = val.replace(/#([0-9a-f]{6})([0-9a-f]{2})?\b/gi, (h, rgb, a) => {
        const base = PALETTE[rgb.toLowerCase()];
        if (!base) return h;
        n++;
        return a ? `rgb(var(--${nom(base)}) / ${(parseInt(a, 16) / 255).toFixed(2)})` : `rgb(var(--${nom(base)}))`;
      });
      v = v.replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+%?)\s*)?\)/gi, (r, R, G, B, a) => {
        const base = PAR_RGB[`${R},${G},${B}`];
        if (!base) return r;
        n++;
        return a ? `rgb(var(--${nom(base)}) / ${alpha(a)})` : `rgb(var(--${nom(base)}))`;
      });
      return deb + esp + prop + sep + v;
    });
    return `{${neuf}}`;
  });
  if (n) { bilan.push(`${String(n).padStart(4)} ${f}`); total += n; if (ecrire) fs.writeFileSync(f, apres); }
}
console.log(bilan.join('\n'));
console.log(`${total} couleurs de la palette ${ecrire ? 'portées' : 'à porter'} dans ${bilan.length} fichiers`);
