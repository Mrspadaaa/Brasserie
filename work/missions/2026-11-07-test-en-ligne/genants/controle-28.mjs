// Test en ligne n° 28 : Imperial stout, les premières suggestions d'ajout sont-elles du style ? Lit l'ordre réel des suggestions de l'étape Houblons.
// Usage : node controle-28.mjs <build> <dossier captures> [clair|cave] [390|1280]   → liste (verdict dans RESULTAT.md)
import fs from 'node:fs';
import { ouvrirAmorce, allerEtape } from './amorce.mjs';
import { dormir } from '../../2026-10-31-ecran-fermentescibles/banc-critique/banc.mjs';
const [construit, sortie, theme = 'clair', l = '390'] = process.argv.slice(2);
fs.mkdirSync(sortie, { recursive: true });
const { nav, p } = await ouvrirAmorce(construit, { theme, largeur: Number(l), transformer: `recipe.style = 'Imperial Stout'; recipe.ogTarget = 1.085;` });
await allerEtape(p, 'Houblons'); await dormir(3500);
const sug = await p.evaluate(() => [...document.querySelectorAll('button[aria-label^="Ajouter "]')].map((b) => b.getAttribute('aria-label')).filter((x) => /suggéré/.test(x)).slice(0, 8));
console.log(JSON.stringify(sug, null, 1));
await p.screenshot({ path: `${sortie}/c28-${theme}-${l}.png`, fullPage: true });
await nav.close();
