// Voie p7-radar-trou-du-0 : la fidélité du port à la variante G de m8 (D114). L'app après le port (Substituer, Lotus contre Solero et
// Calypso, ?dev-local, VITE_HOP_V4=on, 390 × 844, échelle 2) est capturée comme m8 l'a fait (la section du radar), puis comparée à
// `m8-radar-manque-partiel/img/g-trou-rien-cite.png` :
//   - le disque du 0 : la boîte des pixels gris #e6e8eb dans chaque image (écart toléré : 4 px) ;
//   - les ronds creux : pour chaque point à 0 de l'app (data-creux), le centre est cherché dans l'image G autour de la position
//     attendue (rond de la couleur de la série, centre blanc) ; l'écart de position (4 px au plus) ;
//   - une planche côte à côte (G à gauche, l'app à droite) et une planche de différences, écrites dans img/.
// Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5273 --strictPort" --port 5273 --timeout 120 --env VITE_HOP_V4=on -- node work/missions/2026-10-25-integration-houblons/voies/p7-radar-trou-du-0/fidelite.mjs
// Sortie : « FIDELE OK » ou « FIDELE ECHEC n » (code 1).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const ICI = import.meta.dirname;
const RACINE = path.resolve(ICI, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const IMG = path.join(ICI, 'img');
fs.mkdirSync(IMG, { recursive: true });
const G = path.join(RACINE, 'work/missions/2026-10-25-integration-houblons/voies/m8-radar-manque-partiel/img/g-trou-rien-cite.png');
const base = `http://localhost:${process.env.WITH_SERVER_PORTS}`;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const TOL = 4; // px à l'écran (image à l'échelle 2 : 8 px d'image)

const { browser, page } = await ouvrir({ largeur: 390, hauteur: 844 });
await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 120000 });
await dormir(800);
const champ = '[aria-label="Ajouter un houblon : stock ou catalogue"]';
await page.click(champ, { clickCount: 3 });
await page.type(champ, 'Lotus', { delay: 15 });
await page.waitForSelector('[data-role="ajout-rapide"] [data-role="ajout-rapide-plus"]', { timeout: 30000 });
const lotus = await page.$eval('[data-role="ajout-rapide"]', (e) => e.getAttribute('data-houblon-ajout'));
await page.click('[data-role="ajout-rapide"] [data-role="ajout-rapide-plus"]');
await dormir(900);
await page.evaluate((k) => window.__hopPile.open({ view: 'hopSubstitute', hopKey: k }), lotus);
await page.waitForSelector('[data-ecran="substituer"] [data-remplacant]', { timeout: 90000 });
await dormir(800);
const liste = await page.evaluate(() => [...document.querySelectorAll('[data-ecran="substituer"] [data-remplacant]')].map((x) => ({ cle: x.getAttribute('data-remplacant'), nom: x.getAttribute('data-houblon-rang') })));
for (const x of liste.slice(0, 2)) { await page.evaluate((c) => document.querySelector(`[data-ecran="substituer"] [data-remplacant="${c}"]`)?.click(), x.cle); await dormir(600); }
await page.waitForSelector('[data-ecran="substituer"] svg[data-radar="base"]', { timeout: 30000 });
await dormir(800);
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.$eval('[data-ecran="substituer"] [data-etat="etat-subst-radar"]', (e) => e.scrollIntoView({ block: 'center' }));
await dormir(600);
await page.mouse.move(1, 1);
await dormir(400);
const sec = await page.$('[data-ecran="substituer"] [data-etat="etat-subst-radar"]');
const APP = path.join(IMG, 'app-apres-port.png');
await sec.screenshot({ path: APP });
// La géométrie de l'app, en pixels d'image (échelle 2), depuis le coin de la section.
const geo = await page.evaluate(() => {
  const s = document.querySelector('[data-ecran="substituer"] [data-etat="etat-subst-radar"]').getBoundingClientRect();
  const svg = document.querySelector('[data-ecran="substituer"] svg[data-radar="base"]');
  const k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width, o = svg.getBoundingClientRect();
  const px = (x, y) => [(o.left - s.left + x * k) * 2, (o.top - s.top + y * k) * 2];
  const d = svg.querySelector('[data-role="trou-du-zero"]').getAttribute('points').split(' ').map((p) => p.split(',').map(Number)).map(([x, y]) => px(x, y));
  // Un point écarté (D186, data-decale) : sa place exacte, celle de G, est celle d'avant l'écart le long de la tangente de l'axe.
  const axes = svg.getAttribute('data-axes').split(','), PAS = (2 * Math.PI) / axes.length;
  const pts = [...svg.querySelectorAll('circle[data-creux]')].map((c) => {
    const f = c.getAttribute('data-point'), i = axes.indexOf(f), dt = Number(c.getAttribute('data-decale') ?? 0);
    const x = Number(c.getAttribute('cx')) - Math.cos(i * PAS) * dt, y = Number(c.getAttribute('cy')) - Math.sin(i * PAS) * dt;
    return { famille: f, serie: c.closest('[data-serie]').getAttribute('data-serie'), couleur: c.closest('[data-serie]').getAttribute('data-couleur'), c: px(x, y), r: Number(c.getAttribute('r')) * k * 2, decaleEcran: Math.round(Math.abs(dt) * k * 10) / 10 };
  });
  return { disque: d, pts, k };
});

const lire = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const mesure = await page.evaluate(async (a, b, geo, tol) => {
  const charger = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
  const [ig, ia] = [await charger(a), await charger(b)];
  const donnees = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0); return { c, x, d: x.getImageData(0, 0, img.width, img.height) }; };
  const G = donnees(ig), A = donnees(ia);
  // La boîte du disque : les pixels #e6e8eb (230, 232, 235), à 2 près.
  const boite = (im) => { let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0; const { data, width, height } = im.d; for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const i = 4 * (y * width + x); if (Math.abs(data[i] - 230) <= 2 && Math.abs(data[i + 1] - 232) <= 2 && Math.abs(data[i + 2] - 235) <= 2) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } } return { x0, y0, x1, y1, n }; };
  const bg = boite(G), ba = boite(A);
  // Les ronds creux : dans l'image G, le centre le plus proche de la position attendue où l'on lit un centre blanc entouré d'un
  // anneau de la couleur de la série (rayon attendu ± 2 px d'image).
  const hex = (c) => { const m = /#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(c); return m ? [1, 2, 3].map((i) => parseInt(m[i], 16)) : null; };
  const px = (im, x, y) => { const i = 4 * (Math.round(y) * im.d.width + Math.round(x)); return [im.d.data[i], im.d.data[i + 1], im.d.data[i + 2]]; };
  const proche = (p, q, t) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) <= t;
  const pts = geo.pts.map((p) => {
    const col = hex(p.couleur) ?? [0, 0, 0];
    let meilleur = null;
    for (let dy = -2 * tol * 2; dy <= 2 * tol * 2; dy++) for (let dx = -2 * tol * 2; dx <= 2 * tol * 2; dx++) {
      const x = p.c[0] + dx, y = p.c[1] + dy;
      if (!proche(px(G, x, y), [255, 255, 255], 30)) continue; // centre blanc
      // l'anneau : 8 directions au rayon attendu (à ± 1,5 px d'image), au moins 5 sur 8 de la couleur de la série
      let bons = 0;
      for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; let ok = false; for (const dr of [-1.5, 0, 1.5]) { if (proche(px(G, x + Math.cos(a) * (p.r + dr), y + Math.sin(a) * (p.r + dr)), col, 70)) ok = true; } if (ok) bons++; }
      if (bons >= 6) { const e = Math.hypot(dx, dy); if (!meilleur || e < meilleur.e) meilleur = { e, dx, dy }; }
    }
    return { famille: p.famille, serie: p.serie, decaleEcran: p.decaleEcran, ecartImage: meilleur ? Math.round(meilleur.e * 10) / 10 : null, ecartEcran: meilleur ? Math.round(meilleur.e) / 2 : null };
  });
  // Les planches : G à gauche, l'app à droite ; puis la différence.
  const h = Math.max(ig.height, ia.height);
  const cp = document.createElement('canvas'); cp.width = ig.width + ia.width + 12; cp.height = h; const xp = cp.getContext('2d');
  xp.fillStyle = '#ccc'; xp.fillRect(0, 0, cp.width, h); xp.drawImage(ig, 0, 0); xp.drawImage(ia, ig.width + 12, 0);
  const cd = document.createElement('canvas'); cd.width = Math.max(ig.width, ia.width); cd.height = h; const xd = cd.getContext('2d');
  xd.fillStyle = '#fff'; xd.fillRect(0, 0, cd.width, h);
  const dd = xd.getImageData(0, 0, cd.width, h); let diff = 0, total = 0;
  for (let y = 0; y < Math.min(ig.height, ia.height); y++) for (let x = 0; x < Math.min(ig.width, ia.width); x++) { const i = 4 * (y * G.d.width + x), j = 4 * (y * A.d.width + x), k = 4 * (y * cd.width + x); const e = Math.abs(G.d.data[i] - A.d.data[j]) + Math.abs(G.d.data[i + 1] - A.d.data[j + 1]) + Math.abs(G.d.data[i + 2] - A.d.data[j + 2]); total++; if (e > 90) { diff++; dd.data[k] = 220; dd.data[k + 1] = 30; dd.data[k + 2] = 30; dd.data[k + 3] = 255; } else { const g = 255 - Math.min(255, e); dd.data[k] = g; dd.data[k + 1] = g; dd.data[k + 2] = g; dd.data[k + 3] = 255; } }
  xd.putImageData(dd, 0, 0);
  return { bg, ba, pts, diff, total, taille: { g: [ig.width, ig.height], a: [ia.width, ia.height] }, planche: cp.toDataURL('image/png'), delta: cd.toDataURL('image/png') };
}, lire(G), lire(APP), geo, TOL);
fs.writeFileSync(path.join(IMG, 'cote-a-cote-G-app.png'), Buffer.from(mesure.planche.split(',')[1], 'base64'));
fs.writeFileSync(path.join(IMG, 'differences-G-app.png'), Buffer.from(mesure.delta.split(',')[1], 'base64'));
await browser.close();

const echecs = [];
const ec = (a, b) => Math.max(Math.abs(a.x0 - b.x0), Math.abs(a.y0 - b.y0), Math.abs(a.x1 - b.x1), Math.abs(a.y1 - b.y1)) / 2;
const eDisque = ec(mesure.bg, mesure.ba);
if (!(mesure.ba.n > 1000)) echecs.push(`disque : trop peu de pixels gris dans l'app (${mesure.ba.n})`);
if (eDisque > TOL) echecs.push(`disque : boîte écartée de ${eDisque} px à l'écran (G ${JSON.stringify(mesure.bg)}, app ${JSON.stringify(mesure.ba)})`);
if (!mesure.pts.length) echecs.push('aucun rond creux dans l\'app');
// Sa place exacte (avant l'écart de D186) est cherchée dans G. Dans G, un rond creux confondu avec un autre est caché dessous : il
// n'y est pas lisible, et c'est ce que D186 corrige. Ce cas, et lui seul, est admis (le rond doit être écarté dans l'app).
const caches = [];
for (const p of mesure.pts) {
  if (p.ecartEcran != null && p.ecartEcran <= TOL) continue;
  if (p.ecartEcran == null && p.decaleEcran > 0) { caches.push(`${p.famille} ${p.serie}`); continue; }
  echecs.push(`rond creux ${p.famille} de ${p.serie} : introuvable dans G à ${TOL} px près (${p.ecartEcran})`);
}
console.log(JSON.stringify({ tailles: mesure.taille, disque: { G: mesure.bg, app: mesure.ba, ecartEcranPx: eDisque }, ronds: mesure.pts, pixelsDifferents: `${mesure.diff} / ${mesure.total}`, planches: ['img/cote-a-cote-G-app.png', 'img/differences-G-app.png'] }, null, 1));
if (echecs.length) { console.log(`FIDELE ECHEC ${echecs.length}`); for (const e of echecs) console.log(' - ' + e); process.exit(1); }
console.log(`FIDELE OK (disque à ${eDisque} px ; ${mesure.pts.length - caches.length} ronds creux retrouvés dans G à ${TOL} px au plus ; cachés dans G, écartés dans l'app : ${caches.join(', ') || 'aucun'})`);
