// BR-45 (09.11) : compare deux passages de banc.mjs (avant / après) et juge le passage aux jetons.
//  - clair identique : pour chaque état, chaque élément et chaque propriété de couleur calculée, l'écart ΔE2000
//    (culori) et l'écart d'alpha entre avant et après ; plus l'écart des captures en pixels (pixelmatch, seuil 0) ;
//  - cave : contrastes axe-core (règle color-contrast) et surfaces claires après, contre avant ;
//  - montages côte à côte avant | après (PNG) dans <sortie>/cote-a-cote, pour les ouvrir.
// Usage : BR45_DEPS=<npm install culori pngjs pixelmatch> node src/ui/hopV55/jetons/compare.mjs <avant> <après> <sortie>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [AVANT, APRES, SORTIE] = process.argv.slice(2).map((p) => path.resolve(p));
const req = createRequire(path.join(process.env.BR45_DEPS ?? '.', 'x.js'));
const { parse, differenceCiede2000 } = req('culori');
const { PNG } = req('pngjs');
const pixelmatch = req('pixelmatch');
const dE = differenceCiede2000();
fs.mkdirSync(path.join(SORTIE, 'cote-a-cote'), { recursive: true });

const couleursDe = (v) => [...String(v).matchAll(/rgba?\([^)]*\)/g)].map((m) => parse(m[0]));
const lignes = [];
let maxDE = 0, maxAlpha = 0, diffValeurs = 0, diffStruct = 0, diffPixels = 0, compares = 0;
const cles = fs.readdirSync(AVANT).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
const cave = [];
for (const cle of cles) {
  if (!fs.existsSync(path.join(APRES, `${cle}.json`))) { lignes.push(`${cle} : absent après`); continue; }
  const a = JSON.parse(fs.readFileSync(path.join(AVANT, `${cle}.json`)));
  const b = JSON.parse(fs.readFileSync(path.join(APRES, `${cle}.json`)));
  if (cle.startsWith('clair')) {
    if (a.couleurs.length !== b.couleurs.length) diffStruct++;
    const n = Math.min(a.couleurs.length, b.couleurs.length);
    for (let i = 0; i < n; i++) {
      const [sa, va] = a.couleurs[i], [sb, vb] = b.couleurs[i];
      if (sa !== sb) { diffStruct++; continue; }
      for (let k = 0; k < va.length; k++) {
        compares++;
        if (va[k] === vb[k]) continue;
        diffValeurs++;
        const ca = couleursDe(va[k]), cb = couleursDe(vb[k]);
        if (ca.length !== cb.length) { maxDE = Infinity; lignes.push(`${cle} #${i} ${sa} : « ${va[k]} » → « ${vb[k]} »`); continue; }
        ca.forEach((c, j) => { maxDE = Math.max(maxDE, dE(c, cb[j])); maxAlpha = Math.max(maxAlpha, Math.abs((c.alpha ?? 1) - (cb[j].alpha ?? 1))); });
        if (lignes.length < 30) lignes.push(`${cle} #${i} ${sa} prop ${k} : « ${va[k]} » → « ${vb[k]} »`);
      }
    }
    const pa = PNG.sync.read(fs.readFileSync(path.join(AVANT, `${cle}.png`)));
    const pb = PNG.sync.read(fs.readFileSync(path.join(APRES, `${cle}.png`)));
    if (pa.width !== pb.width || pa.height !== pb.height) { diffPixels += 1; lignes.push(`${cle} : capture ${pa.width}×${pa.height} → ${pb.width}×${pb.height}`); }
    else diffPixels += pixelmatch(pa.data, pb.data, null, pa.width, pa.height, { threshold: 0 });
  } else {
    cave.push(`${cle.padEnd(32)} contrastes ${String(a.violations.length).padStart(3)} → ${String(b.violations.length).padStart(3)} · surfaces claires ${String(a.claires.length).padStart(3)} → ${String(b.claires.length).padStart(3)}`);
  }
  // Montage avant | après (12 px de séparation).
  const pa = PNG.sync.read(fs.readFileSync(path.join(AVANT, `${cle}.png`)));
  const pb = PNG.sync.read(fs.readFileSync(path.join(APRES, `${cle}.png`)));
  const h = Math.max(pa.height, pb.height), w = pa.width + 12 + pb.width;
  const m = new PNG({ width: w, height: h });
  m.data.fill(255);
  for (let y = 0; y < h; y++) for (let x = 0; x < 12; x++) { const o = (y * w + pa.width + x) * 4; m.data[o] = 220; m.data[o + 1] = 40; m.data[o + 2] = 40; }
  PNG.bitblt(pa, m, 0, 0, pa.width, pa.height, 0, 0);
  PNG.bitblt(pb, m, 0, 0, pb.width, pb.height, pa.width + 12, 0);
  fs.writeFileSync(path.join(SORTIE, 'cote-a-cote', `${cle}.png`), PNG.sync.write(m));
}
const rapport = [
  `CLAIR : ${compares} valeurs de couleur comparées, ${diffValeurs} différentes, ΔE2000 max ${maxDE === Infinity ? '∞' : maxDE.toFixed(3)}, alpha max ${maxAlpha.toFixed(3)}, ${diffStruct} écarts de structure, ${diffPixels} pixels différents`,
  ...lignes,
  'CAVE (avant → après) :',
  ...cave,
].join('\n');
fs.writeFileSync(path.join(SORTIE, 'rapport.txt'), rapport + '\n');
console.log(rapport);
