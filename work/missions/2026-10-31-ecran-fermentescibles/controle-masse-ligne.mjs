// D219 : « je pensais plutôt à un mini slider ou bouton+ /- facil » (sur la masse de chaque ingrédient, en une action). Sur chaque ligne du
// ticket (malt, flocons, sucre, fruit), la masse se change sans taper, en un geste depuis le repos : un toucher sur « + » ou « − »
// (data-role masse-plus / masse-moins), ou un glisser sur un mini curseur de masse (data-role masse-curseur, role slider, « Masse » dans son nom).
// Le pas est un cran de la piste (50 g sous 1 kg, 100 g au-dessus ; la valeur reste sur la grille) ; les autres masses ne bougent pas ; le plateau ne se déplace pas ;
// chaque cible fait 24 px au moins et ne chevauche aucune autre cible de la ligne (un conteneur ou un contenu ne compte pas).
// Usage : node controle-masse-ligne.mjs <etat.html>... ; imprime MASSE OK ou MASSE ECHEC n.
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { versUrl, existe } from '../../refonte-frontend/v4/tournoi/outils/lib/cible.mjs';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ICI, '../../../package.json'));
const puppeteer = require('puppeteer-core');
// p8-port : la cible peut être une adresse servie (controle-choix.mjs --url=… --gabarit=…, lib/cible.mjs). L'app pose son état de banc
// (recette et stock de la maquette) en tâche asynchrone et le dit dans document.body.dataset.apercu : on l'attend. Réseau externe coupé.
const SERVI = !!process.env.AFFINEE_CIBLE_URL;
const attendre = async (p, etat) => {
  if (!SERVI) return;
  await p.waitForFunction((e) => document.body.dataset.apercu === (e || 'repos') && document.querySelector('[data-sel]') !== null, { timeout: 90000 }, etat || '');
  await new Promise((r) => setTimeout(r, 400));
};
const etatUrl = (u, h) => (SERVI ? (h ? u.split('malts=maquette').join('malts=' + h) : u) : u + (h ? '#' + h : ''));
const couper = async (p) => {
  if (!SERVI) return;
  await p.setRequestInterception(true);
  const local = (u) => ['http://localhost', 'http://127.0.0.1', 'ws://localhost', 'ws://127.0.0.1', 'data:', 'blob:', 'about:'].some((d) => u.startsWith(d));
  p.on('request', (r) => (local(r.url()) ? r.continue() : r.abort('blockedbyclient')));
};
const pages = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!pages.length) { console.log('MASSE ECHEC 1 (aucune maquette)'); process.exit(1); }
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage();
await couper(p);
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const pret = () => p.evaluate(() => document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 150))));
const lit = (t) => { const v = parseFloat(String(t).replace(',', '.')); return Number.isFinite(v) ? v : NaN; };
const masses = () => p.evaluate(() => [...document.querySelectorAll('[data-sel]')].map((li) => li.querySelector('[data-role="kg-ligne"]').value));
const plateau = () => p.evaluate(() => { const e = document.querySelector('[data-role="bal"]'); const c = document.querySelector('[data-sel][aria-current="true"]');
  return JSON.stringify({ cache: !e || e.hidden, haut: e && !e.hidden ? Math.round(e.getBoundingClientRect().top) : null, choisie: c ? c.dataset.sel : null, y: Math.round(scrollY) }); });
const cran = (kg) => (kg < 1 ? 0.05 : 0.1);
let echecs = 0;
const ko = (m) => { echecs++; console.log('ECHEC ' + m); };
for (const f of pages) {
  const nom = path.basename(path.dirname(path.resolve(f))) + '/' + path.basename(f);
  const url = versUrl(path.resolve(f)).href;
  for (const h of ['', 'sucre', 'fruit']) {
    await p.goto(etatUrl(url, h)); await attendre(p, h); await pret();
    const n = await p.$$eval('[data-sel]', (l) => l.length);
    for (let i = 0; i < n; i++) {
      await p.goto(etatUrl(url, h)); await attendre(p, h); await pret();
      const info = await p.evaluate((i) => {
        const li = document.querySelectorAll('[data-sel]')[i];
        const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
        const cibles = [...li.querySelectorAll('button, input, [role="slider"], [data-role]')].filter((e) => e.getBoundingClientRect().width > 0)
          .map((e) => ({ role: e.dataset.role || e.tagName, b: r(e) }));
        return { nom: li.querySelector('[data-role="nom"]').textContent, plus: r(li.querySelector('[data-role~="masse-plus"]')),
          moins: r(li.querySelector('[data-role~="masse-moins"]')), curseur: r(li.querySelector('[data-role~="masse-curseur"]')),
          nomCurseur: li.querySelector('[data-role~="masse-curseur"]')?.getAttribute('aria-label') || '',
          roleCurseur: li.querySelector('[data-role~="masse-curseur"]')?.getAttribute('role') || '', cibles };
      }, i);
      const ici = `${nom} ${h || 'repos'} ${info.nom}`;
      const avant = await masses(), pl = await plateau(), kg0 = lit(avant[i]);
      const taille = (bx, q) => { if (bx.w < 24 || bx.h < 24) ko(`${ici} : ${q} ${Math.round(bx.w)} × ${Math.round(bx.h)} px, sous 24 px`); };
      const croise = (bx, q) => { for (const c of info.cibles) { if (c.role === q || !c.b) continue; const s = c.b;
        const ix = Math.min(bx.x + bx.w, s.x + s.w) - Math.max(bx.x, s.x), iy = Math.min(bx.y + bx.h, s.y + s.h) - Math.max(bx.y, s.y);
        const dans = (u, v) => u.x >= v.x - 1 && u.y >= v.y - 1 && u.x + u.w <= v.x + v.w + 1 && u.y + u.h <= v.y + v.h + 1;
        if (ix > 1 && iy > 1 && !dans(s, bx) && !dans(bx, s)) { ko(`${ici} : ${q} chevauche ${c.role}`); return; } } };
      if (info.plus && info.moins) {
        taille(info.plus, 'masse-plus'); taille(info.moins, 'masse-moins'); croise(info.plus, 'masse-plus'); croise(info.moins, 'masse-moins');
        // Un toucher au centre de « + », puis un au centre de « − » : un cran chacun, et retour à la masse de départ.
        for (const [q, bx, signe] of [['masse-plus', info.plus, 1], ['masse-moins', info.moins, -1]]) {
          const ref = await masses(), kgr = lit(ref[i]), pr = await plateau();
          const bb = await p.evaluate((i, q) => { const e = document.querySelectorAll('[data-sel]')[i].querySelector('[data-role~="' + q + '"]').getBoundingClientRect(); return { x: e.left + e.width / 2, y: e.top + e.height / 2 }; }, i, q);
          await p.touchscreen.tap(bb.x, bb.y); await pret();
          const apres = await masses(), kg1 = lit(apres[i]);
          const d = Math.round((kg1 - kgr) * 1000) / 1000, grille = (v) => Math.abs((v < 1 ? Math.round(v * 20) / 20 : Math.round(v * 10) / 10) - v) < 1e-6;
          if (!(Math.sign(d) === signe && Math.abs(d) <= 0.1 + 1e-6 && grille(kg1))) ko(`${ici} : « ${q} » fait ${ref[i]} → ${apres[i]} (un cran de la piste attendu : 50 g sous 1 kg, 100 g au-dessus)`);
          if (apres.some((v, k) => k !== i && v !== ref[k])) ko(`${ici} : « ${q} » change une autre masse`);
          if ((await plateau()) !== pr) ko(`${ici} : « ${q} » déplace ou ouvre le plateau`);
          console.log(`INFO ${ici} : ${q} ${ref[i]} → ${apres[i]}`);
        }
      } else if (info.curseur) {
        taille(info.curseur, 'masse-curseur');
        if (info.roleCurseur !== 'slider' || !/masse/i.test(info.nomCurseur)) ko(`${ici} : le curseur de masse n'est pas un slider nommé « Masse… » (${info.roleCurseur}, ${info.nomCurseur})`);
        const c = info.curseur, y = c.y + c.h / 2;
        await p.touchscreen.touchStart(c.x + c.w * 0.3, y);
        for (let k = 1; k <= 8; k++) await p.touchscreen.touchMove(c.x + c.w * (0.3 + 0.4 * k / 8), y);
        await p.touchscreen.touchEnd(); await pret();
        const apres = await masses();
        if (!(lit(apres[i]) > kg0)) ko(`${ici} : glisser le curseur ne change pas la masse (${avant[i]} → ${apres[i]})`);
        if (apres.some((v, k) => k !== i && v !== avant[k])) ko(`${ici} : le curseur change une autre masse`);
        if ((await plateau()) !== pl) ko(`${ici} : le curseur déplace le plateau`);
        console.log(`INFO ${ici} : curseur ${avant[i]} → ${apres[i]}`);
      } else ko(`${ici} : ni « + » et « − », ni curseur de masse sur la ligne`);
    }
  }
}
await b.close();
console.log(echecs ? `MASSE ECHEC ${echecs}` : 'MASSE OK');
