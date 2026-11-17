// Contrôle CAL-PAYS-ROTATION (17.11) : « Ça forcé pas à renverser le téléphone ??? Ça devrait si non c'est pas vraiment utilisable ? »
// Une seule adresse : le téléphone en hauteur montre la vue portrait, en largeur la vue paysage, au changement, sans recharger.
// À 390 × 844 tactile : la vue visible (celle qui reçoit le doigt au centre de l'écran) est le portrait et remplit l'écran ;
// puis setViewport 844 × 390 (sans goto) : la vue visible est le paysage, à 844 × 390 ; puis retour 390 × 844 : le portrait.
// Aucune vue ne se recharge (jeton posé dans chaque vue avant de tourner), l'adresse ne change pas, aucune erreur de page.
// Une vue se reconnaît à <html data-vue="portrait|paysage"> (sinon : paysage si la frise a plus de 6 semaines).
// Témoin négatif : une page portrait seule (pub/portrait.html) échoue en largeur.
// Passe 8 (CRITIQUE7 n° 1, « en tournant, on change de calendrier ») : un seul état. Page neuve, en hauteur : poser un papier (+ volant, feuille,
// S49) et décaler la Blonde de 3 semaines ; tourner (setViewport, sans goto) : la chose est là, la pastille de Papiers a bougé du même écart,
// la tête est identique, la Blonde à la même semaine. Puis l'inverse : en largeur, poser un autre papier (S50) et ramener la Blonde d'une semaine ;
// revenir en hauteur : les deux choses, la pastille, la tête et la Blonde suivent. Témoin : pub/calendrier.html de la passe 7 (TEMOINS-1711.txt).
// node scripts/agents/controle-rotation.mjs <page.html> [...]  → ROTATION OK | ROTATION ECHEC
import { createRequire } from 'module'; import path from 'path'; import { pathToFileURL } from 'url';
const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = req('puppeteer-core');
const fichiers = process.argv.slice(2).filter(a => !a.startsWith('--')); if (!fichiers.length) { console.log('usage : <page.html>'); process.exit(2); }
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const wait = ms => new Promise(r => setTimeout(r, ms));
const ecran = (w, h) => ({ width: w, height: h, isMobile: true, hasTouch: true, deviceScaleFactor: 1, isLandscape: w > h });
// la vue visible : l'élément au centre de l'écran (et à quatre autres points) dans la page ; si c'est un cadre, la vue est ce cadre
async function vueVisible(p) {
  const top = await p.evaluate(() => {
    const pts = [[.5, .5], [.2, .25], [.8, .25], [.2, .75], [.8, .75]].map(([u, v]) => document.elementFromPoint(innerWidth * u, innerHeight * v));
    const fr = pts.map(e => e && e.tagName === 'IFRAME' ? e : null);
    const un = fr[0]; const memes = fr.every(x => x === un);
    const r = un ? un.getBoundingClientRect() : null;
    return { cadre: un ? un.src : null, memes, rect: r ? [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] : null, W: innerWidth, H: innerHeight, url: location.href };
  });
  const lit = () => ({ vue: document.documentElement.dataset.vue || (document.querySelectorAll('#fb .col').length > 6 ? 'paysage' : document.querySelector('#fb') ? 'portrait' : 'inconnue'), w: innerWidth, h: innerHeight, jeton: window.__rot || null });
  let f = p.mainFrame();
  if (top.cadre) f = p.frames().find(x => x !== p.mainFrame() && x.url() === top.cadre) || null;
  const v = f ? await f.evaluate(lit) : { vue: 'absente' };
  return { ...top, ...v };
}
let ko = 0;
for (const fi of fichiers) {
  const p = await nav.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.setViewport(ecran(390, 844));
  await p.goto(pathToFileURL(path.resolve(fi)).href, { waitUntil: 'load' }); await wait(800);
  // un jeton dans chaque vue : il doit survivre aux rotations (aucun rechargement)
  for (const f of p.frames()) await f.evaluate(() => { window.__rot = window.__rot || Math.random().toString(36).slice(2); }).catch(() => {});
  const jetons = Object.fromEntries(await Promise.all(p.frames().map(async f => [f.url(), await f.evaluate(() => window.__rot).catch(() => null)])));
  const url0 = p.url(); const fautes = []; const lignes = [];
  for (const [w, h, attendu] of [[390, 844, 'portrait'], [844, 390, 'paysage'], [390, 844, 'portrait']]) {
    await p.setViewport(ecran(w, h)); await wait(600);
    const v = await vueVisible(p);
    const plein = !v.rect || (Math.abs(v.rect[0]) <= 1 && Math.abs(v.rect[1]) <= 1 && Math.abs(v.rect[2] - w) <= 2 && Math.abs(v.rect[3] - h) <= 2);
    const ok = v.vue === attendu && Math.abs(v.w - w) <= 2 && Math.abs(v.h - h) <= 2 && plein && (!v.cadre || v.memes);
    if (!ok) fautes.push(`${w} × ${h} : vue ${v.vue} (attendu ${attendu}), fenêtre ${v.w} × ${v.h}${plein ? '' : ', cadre ' + v.rect.join(',')}${v.cadre && !v.memes ? ', deux vues à l’écran' : ''}`);
    if (v.cadre && v.jeton !== jetons[v.cadre]) fautes.push(`${w} × ${h} : la vue ${v.vue} s’est rechargée`);
    lignes.push(`${w}×${h} → ${v.vue} ${v.w}×${v.h}${v.cadre ? ' (cadre ' + path.basename(v.cadre) + ')' : ''}`);
  }
  if (p.url() !== url0) fautes.push('adresse changée : ' + p.url());
  for (const f of p.frames()) { const j = await f.evaluate(() => window.__rot).catch(() => null); if (jetons[f.url()] && j !== jetons[f.url()]) fautes.push('rechargée : ' + path.basename(f.url())); }
  if (errs.length) fautes.push('erreurs : ' + errs.join(' | '));
  if (fautes.length) ko++;
  console.log(`${fautes.length ? 'KO' : 'ok'} ${path.basename(fi)} : ${lignes.join(' ; ')}${fautes.length ? ' → ' + [...new Set(fautes)].join(' ; ') : ''}`);
  await p.close();
}

// ---------- un seul état (passe 8) ----------
async function cadreVisible(p) { const v = await vueVisible(p); const f = v.cadre ? p.frames().find(x => x !== p.mainFrame() && x.url() === v.cadre) : p.mainFrame();
  return { f, off: v.rect ? [v.rect[0], v.rect[1]] : [0, 0], vue: v.vue }; }
const lireEtat = (noms) => { const D = document, nb = t => { const m = (t || '').replace(/\s/g, '').match(/([−-]?)(\d+)/); return m ? (m[1] ? -1 : 1) * +m[2] : null; };
  const col = D.querySelector('#fb .col'), CW = col ? parseFloat(col.style.width) : 1, bl = D.querySelector('.bar[data-chose="b-01"]');
  const q = D.querySelector('.q5-n b'), pa = D.querySelector('.lane[data-voie="charge"] .g2-rm'), ach = D.querySelector('.lane[data-voie="charge"]');
  const tx = ach ? [...ach.querySelectorAll('.bar .lbl,.as-hors,.k17-p')].map(e => (e.getAttribute('aria-label') || '') + ' ' + e.textContent).join(' | ') : '';
  return { tete: q ? q.textContent.trim() : null, pastille: pa ? nb(pa.textContent) : null, blonde: bl ? Math.round(parseFloat(bl.style.left) / CW) : null, choses: noms.filter(n => tx.includes(n)) }; };
async function poser(f, nom, mt, i) {
  return f.evaluate(async (nom, mt, i) => { const w = ms => new Promise(r => setTimeout(r, ms)), D = document, q = s => D.querySelector(s);
    const fab = q('#fab, .fab'); if (!fab) return 'pas de + volant'; fab.click(); await w(250);
    const ty = q('.as-ty[data-v="charge"]'); if (!ty) return 'pas de feuille'; ty.click(); await w(80);
    const n = q('.as-fn input'), m = q('.as-fm input'); n.value = nom; n.dispatchEvent(new Event('input', { bubbles: true })); m.value = mt; m.dispatchEvent(new Event('input', { bubbles: true }));
    const se = q('.as-se[data-i="' + i + '"]'); if (se) se.click(); await w(80); const ok = q('.as-sh-ok'); if (!ok || ok.disabled) return 'Ajouter inactif'; ok.click(); await w(400); return 'ok'; }, nom, mt, i);
}
async function decaler(p, c, k) {
  const r = await c.f.evaluate(() => { const b = document.querySelector('.bar[data-chose="b-01"]'); window.scrollTo({ top: 0, behavior: 'instant' }); b.scrollIntoView({ block: 'center', behavior: 'instant' });
    const x = b.getBoundingClientRect(), col = document.querySelector('#fb .col'); return { x: x.left, w: x.width, cy: x.top + x.height / 2, CW: parseFloat(col.style.width), W: innerWidth }; });
  const cdp = await p.target().createCDPSession(); const T = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  const x0 = c.off[0] + Math.max(r.x + 20, Math.min(r.x + r.w * .45, r.W - 40)), y0 = c.off[1] + r.cy, dx = k * r.CW;
  await wait(150); await T('touchStart', x0, y0); await wait(60); for (let s = 1; s <= 14; s++) { await T('touchMove', x0 + dx * s / 14, y0); await wait(25); } await wait(120); await T('touchEnd'); await wait(900);
}
async function etatCommun(fi) {
  const p = await nav.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.setViewport(ecran(390, 844));
  await p.goto(pathToFileURL(path.resolve(fi)).href, { waitUntil: 'load' }); await wait(800);
  const noms = ['ZZ rotation P', 'ZZ rotation L'], base = {};
  for (const f of p.frames()) { const v = await f.evaluate(lireEtat, noms).catch(() => null); if (v && v.tete != null) base[f.url()] = v; }
  const fautes = [], lignes = [], sg = v => (v >= 0 ? '+' : '') + v;
  const comparer = (av, ap, attendus, ou) => { const d0 = av.pastille - av.base.pastille, d1 = ap.pastille - ap.base.pastille, b0 = av.blonde - av.base.blonde, b1 = ap.blonde - ap.base.blonde;
    if (ap.tete !== av.tete) fautes.push(ou + ' : tête ' + ap.tete + ' (avant de tourner ' + av.tete + ')');
    if (d1 !== d0) fautes.push(ou + ' : pastille Papiers ' + sg(d1) + ' (avant ' + sg(d0) + ')');
    if (b1 !== b0) fautes.push(ou + ' : Blonde décalée de ' + sg(b1) + ' sem. (avant ' + sg(b0) + ')');
    attendus.filter(n => !ap.choses.includes(n)).forEach(n => fautes.push(ou + ' : « ' + n + ' » absent'));
    lignes.push(ou + ' : tête ' + ap.tete + ', Papiers ' + sg(d1) + ', Blonde ' + sg(b1) + ' sem., ' + ap.choses.length + ' chose(s)'); };
  const lire = async c => { const v = await c.f.evaluate(lireEtat, noms); return { ...v, base: base[c.f.url()] || v }; };
  let c = await cadreVisible(p); const r1 = await poser(c.f, noms[0], '-300', 2); if (r1 !== 'ok') fautes.push('hauteur : pose ' + r1);
  await decaler(p, c, 3); const av1 = await lire(c);
  if (av1.choses.length < 1 || av1.blonde - av1.base.blonde !== 3) fautes.push('hauteur : geste non joué (choses ' + av1.choses.length + ', Blonde ' + sg(av1.blonde - av1.base.blonde) + ')');
  lignes.push('hauteur : tête ' + av1.tete + ', Papiers ' + sg(av1.pastille - av1.base.pastille));
  await p.setViewport(ecran(844, 390)); await wait(900); c = await cadreVisible(p); const ap1 = await lire(c); comparer(av1, ap1, [noms[0]], 'tourné en largeur');
  const r2 = await poser(c.f, noms[1], '-200', 3); if (r2 !== 'ok') fautes.push('largeur : pose ' + r2);
  await decaler(p, c, -1); const av2 = await lire(c);
  if (!av2.choses.includes(noms[1]) || av2.blonde - av2.base.blonde !== 2) fautes.push('largeur : geste non joué (choses ' + av2.choses.length + ', Blonde ' + sg(av2.blonde - av2.base.blonde) + ')');
  await p.setViewport(ecran(390, 844)); await wait(900); c = await cadreVisible(p); const ap2 = await lire(c); comparer(av2, ap2, noms, 'revenu en hauteur');
  if (errs.length) fautes.push('erreurs : ' + errs.join(' | '));
  if (fautes.length) ko++;
  console.log(`${fautes.length ? 'KO' : 'ok'} ${path.basename(fi)} état commun : ${lignes.join(' ; ')}${fautes.length ? ' → ' + [...new Set(fautes)].join(' ; ') : ''}`);
  await p.close();
}
if (!process.argv.includes('--sans-etat')) for (const fi of fichiers) await etatCommun(fi);
await nav.close(); console.log(ko ? 'ROTATION ECHEC' : 'ROTATION OK'); process.exit(ko ? 1 : 0);
