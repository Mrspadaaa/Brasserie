// D25 (18.10, soir) : « quand je fasse un appuie long, hover long super ordinateur, sur
// houblons, je puisse voir sa fiche en détails ».
// Usage : node work/refonte-frontend/v4/tournoi/outils/controle-fiche.mjs <dossier> [ids…] [--pages=index.html,comparer.html]
// Convention auteur :
//   data-houblon="<clé>"        sur l'élément qui porte le nom de chaque houblon affiché ;
//   data-role="fiche"           la fiche ouverte (absente ou cachée sinon), qui contient :
//     le nom du houblon, data-role="fiche-alpha" (acides alpha en %), data-role="fiche-arome"
//     (arômes et leurs sources, « N/M » ou « fiche »), un svg data-radar data-objet="fiche"
//     (silhouette du houblon) et un geste data-role="gout" ;
//   data-role="fermer-fiche"    ferme la fiche (Échap la ferme aussi).
// Vérifie sur chaque page : (1) un toucher court sur un houblon n'ouvre pas la fiche ; (2) un
// appui long (650 ms) l'ouvre, avec le bon nom ; (3) son contenu ; (4) ≤ 100 mots visibles
// dans la fiche, aucun texte technique ; (5) la fermeture ; (6) à 1280 px, souris sans toucher,
// un survol de 900 ms ouvre la fiche.
// Imprime FICHE OK si tout passe, sinon FICHE ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { versUrl, existe, liste } from './lib/cible.mjs';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pages = ((args.find((a) => a.startsWith('--pages=')) || '').slice(8) || 'index.html,comparer.html').split(',');
// 19.10, soir (b5 du lot 17 : « Un appui long montre une vrai fiche de houblons... ») : un dossier
// nommé est contrôlé quel que soit son nom (q2b, b5…) ; sans nom, les dossiers pNN, consolide et
// version-… qui ont la première page. Aucun dossier contrôlé = échec, jamais « OK 0/0 ».
const ids = (only.length ? only.filter((d) => existe(path.join(dir, d, pages[0])))
  : liste(dir).filter((d) => /^p\d+$|^consolide$|^version-/.test(d) && existe(path.join(dir, d, pages[0])))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const LEAK = /\b(null|undefined|NaN)\b|\[object [A-Za-z]+\]/;

const ficheEtat = (page) => page.evaluate(() => {
  const f = [...document.querySelectorAll('[data-role="fiche"]')].find((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.height > 20 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.5; });
  if (!f) return null;
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight; };
  return {
    texte: f.innerText,
    mots: f.innerText.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length,
    alpha: [...f.querySelectorAll('[data-role="fiche-alpha"]')].some((e) => vis(e) && /\d+([,.]\d+)?\s*%/.test(e.innerText)),
    arome: [...f.querySelectorAll('[data-role="fiche-arome"]')].some((e) => vis(e) && /\d\s*\/\s*\d|fiche/i.test(e.innerText)),
    radar: !!f.querySelector('svg[data-radar][data-objet="fiche"]'),
    gout: !!f.querySelector('[data-role="gout"]'),
  };
});

for (const id of ids) {
  const p = (m) => problems.push(id + ' : ' + m);
  for (const file of pages) {
    if (!existe(path.join(dir, id, file))) { p('D25 ' + file + ' absente'); continue; }
    const url = versUrl(path.join(dir, id, file)).href;
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await wait(300);
    const cible = async () => {
      const hs = await page.$$('[data-houblon]');
      for (const h of hs) { const ok = await h.evaluate((e) => { const r = e.getBoundingClientRect(); return r.height > 0 && r.top > 0 && r.bottom < innerHeight; }); if (ok) return h; }
      return null;
    };
    let h = await cible();
    if (!h) { p('D25 ' + file + ' : aucun houblon marqué data-houblon visible'); await page.close(); continue; }
    const nom = (await h.evaluate((e) => e.innerText.trim().split('\n')[0])).slice(0, 14);
    // (1) toucher court
    let t = await h.touchStart(); await wait(80); await t.end(); await wait(400);
    if (await ficheEtat(page)) p('D25 ' + file + ' : un toucher court ouvre la fiche (il doit garder son action)');
    await page.goto(url, { waitUntil: 'networkidle0' }); await wait(300);
    h = await cible();
    // (2) appui long
    t = await h.touchStart(); await wait(650); await t.end(); await wait(450);
    const f = await ficheEtat(page);
    if (!f) { p('D25 ' + file + ' : un appui long sur « ' + nom + ' » n\'ouvre pas de fiche (data-role="fiche")'); await page.close(); continue; }
    const debut = nom.split(/\s+/)[0];
    if (debut && !f.texte.includes(debut)) p('D25 ' + file + ' : la fiche ouverte ne nomme pas « ' + debut + ' »');
    // (3) contenu, (4) mots et fuite
    if (!f.alpha) p('D25 ' + file + ' : fiche sans acides alpha visibles (data-role="fiche-alpha", « 11–14 % »)');
    if (!f.arome) p('D25 ' + file + ' : fiche sans arômes sourcés visibles (data-role="fiche-arome", « 2/4 fiches »)');
    if (!f.radar) p('D25 ' + file + ' : fiche sans silhouette (svg data-radar data-objet="fiche")');
    if (!f.gout) p('D25 ' + file + ' : fiche sans geste de goût (data-role="gout")');
    if (f.mots > 100) p('D25 ' + file + ' : ' + f.mots + ' mots visibles dans la fiche (≤ 100)');
    if (LEAK.test(f.texte)) p('D25 ' + file + ' : texte technique dans la fiche (' + f.texte.match(LEAK)[0] + ')');
    // (5) fermeture
    const fermer = await page.$('[data-role="fiche"] [data-role="fermer-fiche"], [data-role="fermer-fiche"]');
    if (fermer) { try { await fermer.tap(); } catch { await fermer.click(); } } else await page.keyboard.press('Escape');
    await wait(450);
    if (await ficheEtat(page)) p('D25 ' + file + ' : la fiche ne se ferme pas (data-role="fermer-fiche" ou Échap)');
    // D49 (18.10, soir, commentaire sur la page partagée) : « La zone de trigger est que le nom
    // alors que ça devrait être la fiche entière... ». L'appui long ouvre la fiche depuis
    // n'importe quel point de la carte du houblon (ligne de recette ou ajout proposé), pas
    // seulement depuis son nom : on appuie sur une zone de la carte qui n'est ni le nom ni une
    // commande (bouton, champ).
    {
      await page.goto(url, { waitUntil: 'networkidle0' }); await wait(300);
      const pt = await page.evaluate(() => {
        const cartes = [...document.querySelectorAll('[data-role="ligne-houblon"], [data-role="ajout-rapide"]')].filter((c) => { const r = c.getBoundingClientRect(); return r.height > 20 && r.top > 0 && r.bottom < innerHeight; });
        for (const c of cartes) {
          const r = c.getBoundingClientRect();
          for (const [fx, fy] of [[0.6, 0.75], [0.45, 0.8], [0.7, 0.5], [0.3, 0.85], [0.55, 0.3]]) {
            const x = r.left + r.width * fx, y = r.top + r.height * fy;
            const e = document.elementFromPoint(x, y);
            if (!e || !c.contains(e)) continue;
            if (e.closest('button, input, select, textarea, a, [role="button"], [data-action], [data-houblon], [data-role="glisser-moment"], [data-role="type-ajout"], [data-role="gout"]')) continue;
            return { x, y, carte: (c.innerText || '').trim().split('\n')[0].slice(0, 16) };
          }
        }
        return cartes.length ? null : 'sans-carte';
      });
      if (pt === 'sans-carte') { /* pas de carte de houblon sur cette page (Comparer : en-têtes de colonne) */ }
      else if (!pt) p('D49 ' + file + ' : aucune zone de carte libre (hors nom et commandes) pour l\'appui long');
      else {
        const t2 = await page.touchscreen.touchStart(pt.x, pt.y); await wait(650); await t2.end(); await wait(450);
        if (!(await ficheEtat(page))) p('D49 ' + file + ' : un appui long sur la carte « ' + pt.carte + ' », hors de son nom, n\'ouvre pas la fiche (« la fiche entière »)');
      }
    }
    await page.close();
    // (6) survol long à l'ordinateur
    const d = await browser.newPage();
    await d.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    await d.goto(url, { waitUntil: 'networkidle0' }); await wait(300);
    const hd = await d.$$('[data-houblon]');
    let survol = false;
    for (const e of hd) {
      const b = await e.boundingBox();
      if (!b || b.y < 0 || b.y > 880) continue;
      await d.mouse.move(b.x + Math.min(20, b.width / 2), b.y + b.height / 2, { steps: 4 });
      await wait(900);
      survol = !!(await ficheEtat(d));
      break;
    }
    if (!survol) p('D25 ' + file + ' : à l\'ordinateur, un survol de 900 ms sur un houblon n\'ouvre pas sa fiche');
    await d.close();
  }
  console.log(id + ' · fiche contrôlée sur ' + pages.join(', '));
}
await browser.close();
if (!ids.length) { console.log('FICHE ECHEC aucun dossier contrôlé dans ' + dir); process.exitCode = 1; }
else if (problems.length === 0) console.log('FICHE OK ' + ids.length + '/' + ids.length);
else { console.log('FICHE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exitCode = 1; }
