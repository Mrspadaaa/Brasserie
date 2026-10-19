// D75 (19.10, soir) : la lecture au style, sur tous les écrans. Les mots du brasseur :
//   18.10 : « le côté agrumes pour une ipa est infiniment plus subtil pour une cezc lager. Les échelles
//   doivent être revu en fonction du style. […] J'avais déjà fait cette demande... » ; « Reste sur une
//   échelle par style mais avoir en tout cas une vue qui affiche l'échelle en absolue » (D31) ;
//   19.10 : « le "au style" donc normaliser au style les données semble être que ici ? C'est pas ce
//   que j'avais demandé... » ; « le cryo citra est ultra aromatique, beaucoup trop pour une lager par
//   exemple » ; « commen ça a pu être oublié ? c'était une demande centre répété à mainte et mainte
//   fois ». La règle n'était contrôlée que sur Ma bière : ce contrôle la porte sur chaque écran.
// Règle, sur chaque page qui montre des familles d'arômes :
//   S1 une lentille au style / absolu ([data-e="style"] et [data-e="absolu"]), au style par défaut
//      (aria-checked="true") ;
//   S2 au style, les familles se lisent face à la zone du style ([data-role="zone"] visible).
// Usage : node controle-au-style.mjs <dossier> [ids…] [--pages=biere.html,comparer.html,…]
// Imprime AU-STYLE OK, ou AU-STYLE ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pages = ((args.find((a) => a.startsWith('--pages=')) || '').slice(8) || 'biere.html,etat-b.html,comparer.html,fiche.html,substitution.html').split(',');
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => pages.some((p) => fs.existsSync(path.join(dir, d, p))))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) for (const pg of pages) {
  const f = path.join(dir, id, pg);
  if (!fs.existsSync(f)) continue;
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(f).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const r = await page.evaluate(() => {
    const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    const st = [...document.querySelectorAll('[data-e="style"]')].filter(vis), ab = [...document.querySelectorAll('[data-e="absolu"]')].filter(vis);
    return { style: st.length, absolu: ab.length, defaut: st.some((e) => e.getAttribute('aria-checked') === 'true' || e.getAttribute('aria-pressed') === 'true'), zones: [...document.querySelectorAll('[data-role="zone"]')].filter(vis).length };
  });
  await page.close();
  const p = (m) => problems.push(id + ' ' + pg + ' : ' + m);
  if (!r.style || !r.absolu) p('S1, pas de lentille au style / absolu ([data-e="style"], [data-e="absolu"])');
  else if (!r.defaut) p('S1, la lentille n\'est pas au style par défaut');
  if (!r.zones) p('S2, aucune famille ne se lit face à la zone du style ([data-role="zone"])');
  console.log(id + ' ' + pg + ' · ' + JSON.stringify(r));
}
await browser.close();
if (problems.length) { console.log('AU-STYLE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); }
else console.log('AU-STYLE OK');
