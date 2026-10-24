// D96 (19.10, soir) : l'ajout cumulé, la levure et la biotransformation dans presque chaque variante.
// Les mots du brasseur, sur la série a1–a3 du lot 21 (« Ajout cumulé, levure, biotransformation ») :
// « Fait en plus, c'est normalement à intégré dans les autres aussi ». Plus tôt : « Aussi explore la
// voie de l'ajout cumulé. 2 houblons en dry hopping. Et la bio Transfo et la levure » ; « Aussi ils nous
// faut un outil de dry hopping, bio Transfo, levure, ça a été demandé, c'est toujours pas là ».
// Règle, sur toute la page (pas seulement le premier écran) :
//   C1 un ajout cumulé : un élément visible [data-role="ajout"] qui contient au moins deux houblons
//      différents ([data-houblon]), ou un réglage visible [data-reglage="ajout-cumule"] qui en crée un ;
//   C2 un choix de levure : un réglage visible [data-reglage="levure"] ; le toucher (ou changer sa
//      valeur) fait bouger au moins une valeur simulée ([data-nature="simule"]) ;
//   C3 la biotransformation se voit : un élément visible [data-role="biotransformation"], au repos ou
//      après le choix d'une levure (C2).
// Une variante peut s'en passer seulement avec la raison écrite dans sa NOTE.
// Usage : node controle-cumul-levure.mjs <dossier> [ids…] [--page=etat.html] ; imprime CUMUL OK, ou
// CUMUL ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pg = (args.find((a) => a.startsWith('--page=')) || '--page=etat.html').slice(7);
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
const etat = () => {
  const vis = (e) => { if (!e || e.closest('[hidden]')) return false; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const ajouts = [...document.querySelectorAll('[data-role="ajout"]')].filter(vis).filter((a) => new Set([...a.querySelectorAll('[data-houblon]')].map((h) => h.dataset.houblon)).size >= 2).length;
  return {
    ajouts,
    reglageCumul: [...document.querySelectorAll('[data-reglage="ajout-cumule"]')].filter(vis).length,
    levures: [...document.querySelectorAll('[data-reglage="levure"]')].filter(vis).length,
    bio: [...document.querySelectorAll('[data-role="biotransformation"]')].filter(vis).length,
    empreinte: [...document.querySelectorAll('[data-nature="simule"]')].filter(vis).map((v) => { const b = v.getBoundingClientRect(); return v.textContent.trim() + '@' + Math.round(b.width) + 'x' + Math.round(b.height); }).join('|'),
  };
};
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, pg)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(300);
  const a = await page.evaluate(etat);
  const f = [];
  if (!a.ajouts && !a.reglageCumul) f.push('C1 pas d\'ajout cumulé (data-role="ajout" avec deux houblons, ou data-reglage="ajout-cumule")');
  let bouge = false, bio = a.bio;
  if (!a.levures) f.push('C2 pas de choix de levure (data-reglage="levure")');
  else {
    for (const h of (await page.$$('[data-reglage="levure"]')).slice(0, 5)) {
      const info = await h.evaluate((e) => { const r = e.getBoundingClientRect(); return { tag: e.tagName.toLowerCase(), type: e.type || '', vis: r.width > 0 && r.height > 0 }; });
      if (!info.vis) continue;
      await h.evaluate((e) => e.scrollIntoView({ block: 'center' }));
      if (info.tag === 'select') await h.evaluate((e) => { e.selectedIndex = (e.selectedIndex + 1) % e.options.length; e.dispatchEvent(new Event('change', { bubbles: true })); });
      else if (info.tag === 'input' && info.type === 'range') await h.evaluate((e) => { e.value = String(Number(e.value) < Number(e.max || 100) ? e.max || 100 : e.min || 0); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); });
      else { try { await h.tap(); } catch { await h.click(); } }
      await wait(500);
      const b = await page.evaluate(etat);
      bio = Math.max(bio, b.bio);
      if (b.empreinte && b.empreinte !== a.empreinte) { bouge = true; break; }
    }
    if (!bouge) f.push('C2 le choix de levure ne fait bouger aucune valeur simulée');
  }
  if (!bio) f.push('C3 la biotransformation ne se voit pas (data-role="biotransformation"), ni au repos ni après le choix d\'une levure');
  await page.close();
  for (const x of f) problems.push(id + ' ' + pg + ' : ' + x);
  console.log(id + ' · ' + a.ajouts + ' ajout(s) cumulé(s) · ' + a.levures + ' choix de levure · biotransformation ' + (bio ? 'visible' : 'absente') + ' · ' + (bouge ? 'la levure fait bouger le simulé' : 'levure sans effet'));
}
await browser.close();
if (problems.length) { console.log('CUMUL ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('CUMUL OK');
