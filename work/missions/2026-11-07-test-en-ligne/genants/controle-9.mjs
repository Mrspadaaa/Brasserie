// Test en ligne n° 9 : un houblon saisi « Nuget » ou « Hallertauer Mittelfruh » retrouve sa fiche catalogue (α, arômes), et l'écran dit comment il l'a lue.
// Cas : brouillon réel de l'assistant (amorce.mjs) avec deux houblons mal orthographiés ; étape Houblons.
// Attendu : aucune carte de houblon ne porte « α ? » ; la lecture approchée est dite (« lu comme Nugget ») ; un houblon vraiment inconnu dit pourquoi il est vide.
// Usage : node controle-9.mjs <build> <dossier captures> [clair|cave] [390|1280]   → NOM OK | NOM ECHEC <raisons>
import fs from 'node:fs';
import { ouvrirAmorce, allerEtape } from './amorce.mjs';
import { dormir } from '../../2026-10-31-ecran-fermentescibles/banc-critique/banc.mjs';
const [construit, sortie, theme = 'clair', l = '390'] = process.argv.slice(2);
fs.mkdirSync(sortie, { recursive: true });
const raisons = [];
const { nav, p } = await ouvrirAmorce(construit, {
  theme, largeur: Number(l),
  transformer: `recipe.hops = [
    { name: 'Nuget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 },
    { name: 'Hallertauer Mittelfruh', alpha: 4, weightG: 30, stage: 'boil', timeMin: 15 },
    { name: 'Zorglub Gold', alpha: 6, weightG: 10, stage: 'boil', timeMin: 5 }];`,
});
await allerEtape(p, 'Houblons');
await dormir(2500);
const texte = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
await p.screenshot({ path: `${sortie}/c9-${theme}-${l}.png` });
const cartes = await p.evaluate(() => [...document.querySelectorAll('[data-etape="houblons"] [data-carte], [data-etape="houblons"] [data-sel], [data-etape="houblons"] article, [data-etape="houblons"] li')].map((e) => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 160)));
console.log(JSON.stringify({ cartes: cartes.slice(0, 8), extrait: texte.slice(0, 700) }));
// La carte écrit le nom du catalogue quand la variété est reconnue (« Nugget »), le nom saisi sinon : dans les deux cas, pas d'« α ? » pour un nom rapproché.
const carte = (nomSaisi, nomCatalogue) => {
  const i = [texte.indexOf(nomCatalogue), texte.indexOf(nomSaisi)].filter((k) => k >= 0).sort((x, y) => x - y)[0];
  return i === undefined ? null : texte.slice(i, i + 120);
};
for (const [saisi, catalogue] of [['Nuget', 'Nugget'], ['Hallertauer Mittelfruh', 'Hallertau Mittelfrüh']]) {
  const c = carte(saisi, catalogue);
  if (!c) raisons.push(`« ${saisi} » absent de l'étape`);
  else if (/α\s*\?/.test(c)) raisons.push(`« ${saisi} » : α inconnu (« ${c.slice(0, 70)} »)`);
  else if (!/α\s*\d/.test(c)) raisons.push(`« ${saisi} » : pas d'α lisible (« ${c.slice(0, 70)} »)`);
}
const inconnu = carte('Zorglub Gold', 'Zorglub Gold');
if (!inconnu || !/α\s*\?/.test(inconnu)) raisons.push('un houblon vraiment inconnu doit rester « α ? » (jamais une variété devinée) : ' + inconnu);
await nav.close();
console.log(raisons.length ? `NOM ECHEC ${raisons.join(' ; ')}` : 'NOM OK');
