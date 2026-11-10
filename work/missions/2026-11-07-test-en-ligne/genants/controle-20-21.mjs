// Test en ligne n° 20 et 21 : la pastille de style se lit (contraste ≥ 4,5:1 texte/fond, deux thèmes) et un degré d'alcool inconnu s'écrit « — » seul, jamais « — % » ni « 0 % ».
// Cas : recette « Imperial Stout », alcool cible 0 (champ jamais rempli) et sans IBU annoncé, enregistrée par le vrai parcours ; liste Recettes.
// Usage : node controle-20-21.mjs <build> <dossier captures> [clair|cave] [390|1280]   → PASTILLE OK | PASTILLE ECHEC <raisons>
import fs from 'node:fs';
import { ouvrirAmorce, jusquALaFiche } from './amorce.mjs';
const [construit, sortie, theme = 'clair', l = '390'] = process.argv.slice(2);
fs.mkdirSync(sortie, { recursive: true });
const raisons = [];
const { nav, p } = await ouvrirAmorce(construit, {
  theme, largeur: Number(l),
  transformer: `recipe.style = 'Imperial Stout'; recipe.abvTarget = 0; delete recipe.ibuTarget;`,
});
await jusquALaFiche(p, sortie, `c20-${theme}-${l}`);
// Retour à la liste pour lire la pastille et la ligne de mesures.
await p.goBack().catch(() => {});
await new Promise((r) => setTimeout(r, 1500));
const lecture = await p.evaluate(() => {
  const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const rgba = (s) => (s.match(/[\d.]+/g) ?? []).map(Number);
  const fond = (e) => { // fond effectif : on compose les aplats translucides sur les parents
    const pile = []; for (let n = e; n; n = n.parentElement) pile.push(getComputedStyle(n).backgroundColor);
    let c = [255, 255, 255]; for (const s of pile.reverse()) { const [r, g, b, a = 1] = rgba(s); if (a > 0) c = [0, 1, 2].map((i) => [r, g, b][i] * a + c[i] * (1 - a)); } return c;
  };
  const tag = [...document.querySelectorAll('span[title]')].find((e) => /imperial/i.test(e.textContent));
  let contraste = null;
  if (tag) { const t = rgba(getComputedStyle(tag).color).slice(0, 3); const a = lum(t) + 0.05, b = lum(fond(tag)) + 0.05; contraste = Math.round((Math.max(a, b) / Math.min(a, b)) * 100) / 100; }
  return { contraste, texte: document.body.innerText.replace(/\s+/g, ' ') };
});
const mesures = lecture.texte.match(/[^·]{0,12}L · [^·]*· [^·]{0,12}/)?.[0] ?? '';
console.log(JSON.stringify({ contraste: lecture.contraste, mesures }));
await p.screenshot({ path: `${sortie}/c20-${theme}-${l}-liste.png`, fullPage: true });
if (lecture.contraste === null) raisons.push('pastille « Imperial Stout » introuvable dans la liste');
else if (lecture.contraste < 4.5) raisons.push(`pastille : contraste ${lecture.contraste}:1 (< 4,5)`);
if (/—\s*%/.test(lecture.texte)) raisons.push('« — % » à l\'écran');
if (/(^|[^\d,.])0\s*%/.test(lecture.texte)) raisons.push('« 0 % » à l\'écran pour un degré inconnu');
if (/—\s*IBU/.test(lecture.texte)) raisons.push('« — IBU » à l\'écran');
await nav.close();
console.log(raisons.length ? `PASTILLE ECHEC ${raisons.join(' ; ')}` : 'PASTILLE OK');
