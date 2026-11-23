// D86 (19.10, soir) : le contraste du texte se mesure au rendu, sur chaque écran. Jusqu'ici, chaque
// auteur le mesurait avec son propre script. Le brasseur : « Ça reprend les code de l'app avec la
// Baseline, ça utilise les bonne pratique, contraintes, retour ecttra ? ».
// Règle (WCAG 2.2, 1.4.3) : tout texte visible a un contraste d'au moins 4,5:1 sur son fond réel,
// 3:1 s'il est grand (24 px et plus, ou 18,66 px gras). Le fond réel est la première couleur pleine
// des ancêtres (avec leur opacité). Un fond d'image ou de dégradé est signalé « non mesurable », pas
// compté comme un succès.
// o1 (31.10, d'après les séries v0 d'Identité) : le fond d'un ancêtre ne dit pas tout. Une bande posée À CÔTÉ du
// texte (un frère en position absolue, une pastille de sélection, un fond de rangée peint par un autre élément)
// donnait un faux 1,09:1 : le texte clair était mesuré sur le blanc de la page, pas sur la bande sombre. Le fond
// est donc relu au rendu : la page est photographiée avec tous les textes rendus transparents, et la couleur
// réellement peinte derrière le texte est lue sur des points de sa boîte visible (rognée par les conteneurs qui
// coupent). Quand elle diffère du fond des ancêtres, c'est elle qui compte, au pire point. Un vrai contraste faible
// (texte pâle sur la bande) échoue toujours ; un fond d'image ou de dégradé reste « non mesurable ».
// Usage : node controle-contraste.mjs <dossier> [ids…] [--page=etat-b.html] ; imprime CONTRASTE OK,
// ou CONTRASTE ECHEC et la liste (le pire cas par page est toujours imprimé).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pg = (args.find((a) => a.startsWith('--page=')) || '--page=etat-b.html').slice(7);
// Profil (o1, D202) : la relecture du fond peint ne s'applique qu'avec --profil=sans-houblons. Sans l'option (profil
// houblons), la mesure reste celle d'avant : sur les maquettes houblons choisies, elle trouverait 30 textes sous le
// seuil de plus (comparer, dryhopper… : cellules de matrice et pastilles dont le fond est peint par un autre élément),
// à examiner par le pilote avant d'en faire le défaut.
const profil = (args.find((a) => a.startsWith('--profil=')) || '--profil=houblons').slice(9);
if (!['houblons', 'sans-houblons'].includes(profil)) { console.log('Profil inconnu : ' + profil + ' (houblons ou sans-houblons)'); process.exit(2); }
const peintReel = profil === 'sans-houblons';
// --debug=<texte> : imprime, pour les textes qui le contiennent, leur couleur, leur boîte et les points de fond lus.
const debug = (args.find((a) => a.startsWith('--debug=')) || '').slice(8);
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, pg)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  // 1. Les textes, leur couleur, le fond des ancêtres, leur boîte visible (coordonnées du document).
  const brut = await page.evaluate((peintReel) => {
    const rgba = (c) => { const m = String(c).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
    const mix = (top, bot) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + bot[i] * (1 - a)).concat(1); };
    const fond = (e) => {
      const couches = [];
      for (let x = e; x; x = x.parentElement) {
        const cs = getComputedStyle(x);
        if (cs.backgroundImage && cs.backgroundImage !== 'none') return { image: true };
        const c = rgba(cs.backgroundColor);
        if (c && c[3] > 0) { couches.push(c); if (c[3] >= 0.999) break; }
      }
      let b = [255, 255, 255, 1];
      for (let i = couches.length - 1; i >= 0; i--) b = mix(couches[i], b);
      return { c: b };
    };
    const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
    // La boîte visible du texte, rognée par les ancêtres qui coupent (overflow autre que visible). Un absolu ne
    // subit que le rognage de son bloc conteneur et au-delà ; un fixe, aucun.
    const boite = (el, r) => {
      const box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      let saute = false, cur = el;
      while (cur && cur !== document.body && cur !== document.documentElement) {
        const pos = getComputedStyle(cur).position;
        if (pos === 'fixed') break;
        if (pos === 'absolute') saute = true;
        const p = cur.parentElement;
        if (!p || p === document.body || p === document.documentElement) break;
        const cp = getComputedStyle(p);
        if (saute && cp.position === 'static') { cur = p; continue; }
        saute = false;
        const cx = cp.overflowX !== 'visible', cy = cp.overflowY !== 'visible';
        if (cx || cy) {
          const b = p.getBoundingClientRect(), g = b.left + p.clientLeft, t = b.top + p.clientTop;
          if (cx) { box.left = Math.max(box.left, g); box.right = Math.min(box.right, g + p.clientWidth); }
          if (cy) { box.top = Math.max(box.top, t); box.bottom = Math.min(box.bottom, t + p.clientHeight); }
          if (box.left >= box.right || box.top >= box.bottom) return null;
        }
        cur = p;
      }
      return box;
    };
    const range = document.createRange();
    // Toutes les boîtes se mesurent à la position de défilement 0 : leurs coordonnées sont alors celles de la capture
    // (un élément fixe y est à sa place de premier écran, un élément ordinaire à sa place dans le document). Le sondage
    // « qui est au sommet » seul fait défiler la page, puis revient à 0 (31.10 : un décalage de défilement faussait les
    // boîtes des textes suivants, d'où des 1:1 sur des boutons sombres).
    const sx = 0, sy = 0;
    window.scrollTo(0, 0);
    const out = [];
    for (const e of document.querySelectorAll('body *')) {
      const noeuds = [...e.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
      if (!vis(e) || !noeuds.length) continue;
      const cs = getComputedStyle(e);
      // Un texte SVG se peint avec `fill`, pas avec `color` (r5, 31.10 : « 30 L » dans un anneau, lu à 1:1 sur lui-même).
      // Réservé au profil sans-houblons ; sans lui, la mesure reste celle d'avant.
      let col = rgba(cs.color);
      if (peintReel && e instanceof SVGElement) { const fl = rgba(cs.fill); if (fl) { fl[3] *= +cs.fillOpacity || 0; col = fl; } else if (/^url|^none/.test(cs.fill)) continue; }
      if (!col) continue;
      const f = fond(e);
      const t = e.textContent.trim().slice(0, 24);
      if (f.image) { out.push({ t, nm: true }); continue; }
      // La boîte du texte lui-même (ses nœuds texte), pas celle de l'élément entier.
      let r = null;
      for (const n of noeuds) { range.selectNodeContents(n); const q = range.getBoundingClientRect(); if (q.width > 0 && q.height > 0) r = r ? { left: Math.min(r.left, q.left), top: Math.min(r.top, q.top), right: Math.max(r.right, q.right), bottom: Math.max(r.bottom, q.bottom) } : { left: q.left, top: q.top, right: q.right, bottom: q.bottom }; }
      const box = r ? boite(e, r) : null;
      const px = parseFloat(cs.fontSize), gras = parseInt(cs.fontWeight, 10) >= 700;
      // Un voile posé PAR-DESSUS le texte (fond d'une feuille ouverte, bandeau) assombrit le fond et le texte à la fois :
      // le fond peint ne dit alors rien du contraste. L'élément au sommet, au centre du texte, doit être le texte lui-même,
      // un de ses ancêtres ou un de ses descendants ; sinon le fond des ancêtres reste la mesure.
      let couvert = false;
      if (box) {
        const cx = (box.left + box.right) / 2, cy = (box.top + box.bottom) / 2;
        const hors = cy >= innerHeight || cy < 0;
        if (hors) window.scrollTo(0, Math.max(0, cy - innerHeight / 2));
        const haut = document.elementFromPoint(cx - window.pageXOffset, cy - window.pageYOffset);
        couvert = !!haut && !(e.contains(haut) || haut.contains(e));
        if (hors) window.scrollTo(0, 0);
      }
      out.push({ t, col, anc: f.c, seuil: px >= 24 || (gras && px >= 18.66) ? 3 : 4.5, couvert, box: box && { l: box.left + sx, t: box.top + sy, r: box.right + sx, b: box.bottom + sy } });
    }
    return out;
  }, peintReel);
  // 2. La page photographiée, textes transparents : ce qui est peint derrière eux.
  let peint = null;
  if (peintReel && brut.some((x) => x.box)) {
    try {
      await page.addStyleTag({ content: '*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important;caret-color:transparent!important}text,tspan,textPath{fill:transparent!important;stroke:none!important}' });
      await page.evaluate(() => document.fonts && document.fonts.ready);
      peint = await page.screenshot({ fullPage: true, encoding: 'base64' });
    } catch { peint = null; }
  }
  // 3. Le contraste : fond des ancêtres, ou fond peint s'il en diffère.
  const r = await page.evaluate(async (brut, peint, debug) => {
    const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const mix = (top, bot) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + bot[i] * (1 - a)).concat(1); };
    const ratioSur = (col, bg) => { const fg = col[3] < 1 ? mix(col, bg) : col; const a = L(fg), b = L(bg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
    let px = null, W = 0, Hh = 0;
    if (peint) {
      const img = new Image();
      await new Promise((ok, ko) => { img.onload = ok; img.onerror = () => ko(new Error('capture illisible')); img.src = 'data:image/png;base64,' + peint; }).catch(() => {});
      if (img.naturalWidth) {
        // Les captures sont à l'échelle 1 (deviceScaleFactor 1) : un pixel de capture = un pixel CSS.
        const c = document.createElement('canvas'); c.width = W = img.naturalWidth; c.height = Hh = img.naturalHeight;
        const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0); px = x.getImageData(0, 0, W, Hh).data;
      }
    }
    return brut.map((x) => {
      if (x.nm) return { t: x.t, nm: true };
      let ratio = ratioSur(x.col, x.anc), peintFond = false;
      if (px && x.box && !x.couvert) {
        // Le tiers central de la hauteur de la boîte : le rectangle d'un texte dépasse son tracé (interligne, hampes) et mord
        // sur un liseré voisin (u6, 31.10 : le bord jaune d'une molette, lu comme fond de « Double IPA »).
        const b = x.box, h4 = (x.box.b - x.box.t) / 4, l = Math.max(0, Math.floor(b.l)), r2 = Math.min(W - 1, Math.ceil(b.r) - 1), t = Math.max(0, Math.floor(b.t + h4)), b2 = Math.min(Hh - 1, Math.ceil(b.b - h4) - 1);
        if (r2 > l && b2 > t) {
          let pire = Infinity, ecart = false;
          for (let j = 0; j < 3; j++) for (let i = 0; i < 8; i++) {
            const xx = Math.round(l + ((r2 - l) * (i + 0.5)) / 8), yy = Math.round(t + ((b2 - t) * (j + 0.5)) / 3), k = (yy * W + xx) * 4;
            const bg = [px[k], px[k + 1], px[k + 2], 1];
            if (Math.abs(bg[0] - x.anc[0]) + Math.abs(bg[1] - x.anc[1]) + Math.abs(bg[2] - x.anc[2]) > 30) ecart = true;
            pire = Math.min(pire, ratioSur(x.col, bg));
            if (debug && x.t.includes(debug)) (x.diag = x.diag || []).push([xx, yy, bg.slice(0, 3).join(','), Math.round(ratioSur(x.col, bg) * 100) / 100]);
          }
          if (ecart) { ratio = pire; peintFond = true; }
        }
      }
      return { t: x.t, ratio: Math.round(ratio * 100) / 100, seuil: x.seuil, peint: peintFond, diag: x.diag && { col: x.col, anc: x.anc, box: x.box, points: x.diag } };
    });
  }, brut, peint, debug);
  await page.close();
  for (const x of r) if (x.diag) console.log('  [debug] « ' + x.t + ' » ' + JSON.stringify(x.diag));
  const mes = r.filter((x) => !x.nm), nm = r.filter((x) => x.nm);
  const pire = mes.reduce((m, x) => (!m || x.ratio / x.seuil < m.ratio / m.seuil ? x : m), null);
  const bas = mes.filter((x) => x.ratio < x.seuil);
  for (const x of bas.slice(0, 8)) problems.push(id + ' ' + pg + ' : « ' + x.t + ' » à ' + x.ratio + ':1 (' + x.seuil + ' au moins)' + (x.peint ? ' sur le fond peint' : ''));
  if (bas.length > 8) problems.push(id + ' ' + pg + ' : ' + (bas.length - 8) + ' texte(s) de plus sous le seuil');
  const surPeint = mes.filter((x) => x.peint).length;
  console.log(id + ' · ' + mes.length + ' textes mesurés · pire « ' + (pire ? pire.t + ' » ' + pire.ratio + ':1' : '—') + (surPeint ? ' · ' + surPeint + ' sur un fond peint par un autre élément' : '') + (nm.length ? ' · ' + nm.length + ' sur fond d\'image ou de dégradé, non mesurables' : ''));
}
await browser.close();
if (problems.length) { console.log('CONTRASTE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('CONTRASTE OK');
