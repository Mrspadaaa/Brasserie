// Banc t1 : mesure ce que le « + » flottant recouvre. Usage (via with_server, port 3101) :
//   node banc.mjs <vue> <largeur> <theme> [avant|apres] [clic1,clic2…]
// vue = recette | assistant | eau (banc ?preview=brew, données simulées). Les clics sont des textes (étapes de l'assistant).
// Écrit des captures dans ./captures/ et affiche, à chaque cran de défilement, les contrôles et valeurs recouverts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const [vue = 'recette', largeur = '390', theme = 'clair', tag = 'avant', clics = ''] = process.argv.slice(2);
const port = (process.env.WITH_SERVER_PORTS ?? '3101').split(',')[0];
const mobile = Number(largeur) < 700;
const { browser, page, journal } = await ouvrir({ largeur: Number(largeur), hauteur: mobile ? 844 : 800, mobile });
await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* */ } }, theme);
await page.goto(`http://localhost:${port}/${vue === 'wizard' ? '?dev-local&etape=levure' : `?preview=brew&view=${vue}`}`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.floating-actions > button', { timeout: 150000 }).catch(() => console.log('pas de + au chargement'));
await calme(page, 1500);
for (const c of clics.split(',').filter(Boolean)) {
  await page.locator(`::-p-text(${c})`).setTimeout(8000).click().catch((e) => console.log('clic raté', c, String(e).slice(0, 80)));
  await calme(page, 700);
}
fs.mkdirSync(path.join(dir, 'captures'), { recursive: true });
const base = `${vue}${clics ? '-' + clics.replace(/[^a-z0-9]+/gi, '').slice(0, 16) : ''}-${largeur}-${theme}-${tag}`;

const mesurer = () => page.evaluate(() => {
  const fab = document.querySelector('.floating-actions > button');
  if (!fab) return { fab: null };
  const f = fab.getBoundingClientRect();
  const visible = f.width > 0 && getComputedStyle(fab.parentElement).display !== 'none';
  const sc = [...document.querySelectorAll('main, [data-page-shell], body')].find((e) => e.scrollHeight > e.clientHeight + 4 && getComputedStyle(e).overflowY !== 'visible' && e.clientHeight > 200) ?? document.scrollingElement;
  const rec = [];
  const sel = 'button, a, input, select, textarea, [role=button], [role=tab], label, span, p, h1, h2, h3, h4, td, dd, dt, li, div';
  for (const el of document.querySelectorAll(sel)) {
    if (fab.contains(el) || el.contains(fab) || el.closest('.floating-actions')) continue;
    if (el.closest('[inert]') && !el.closest('[data-page-shell]')) continue;
    // élément « feuille » : sans enfant élément visible, avec du texte, ou contrôle
    const ctrl = /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(el.tagName) || el.getAttribute('role') === 'button';
    const texte = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
    if (!ctrl && !texte) continue;
    let r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (!ctrl) { // l'étendue réelle du texte, pas celle du bloc qui le porte
      const rg = document.createRange(); rg.selectNodeContents(el);
      const rs = [...rg.getClientRects()].filter((q) => q.width > 1);
      if (!rs.length) continue;
      const touche = rs.find((q) => Math.min(q.right, f.right) - Math.max(q.left, f.left) > 2 && Math.min(q.bottom, f.bottom) - Math.max(q.top, f.top) > 2);
      if (!touche) continue;
      r = touche;
    }
    const ix = Math.max(0, Math.min(r.right, f.right) - Math.max(r.left, f.left));
    const iy = Math.max(0, Math.min(r.bottom, f.bottom) - Math.max(r.top, f.top));
    if (ix * iy < 24) continue;
    // recouvert pour de bon : sans le « + », le point central est bien cet élément (pas un élément coupé par le défilement) ; avec lui, c'est le « + »
    const cx = Math.max(r.left, f.left) + ix / 2, cy = Math.max(r.top, f.top) + iy / 2;
    const avec = document.elementFromPoint(cx, cy);
    if (!avec || !(fab.contains(avec) || avec === fab)) continue;
    const racine = fab.closest('.floating-actions'); const vis = racine.style.visibility; racine.style.visibility = 'hidden';
    const sans = document.elementFromPoint(cx, cy); racine.style.visibility = vis;
    if (!sans || !el.contains(sans)) continue;
    rec.push(`${ctrl ? '[ctrl]' : '[txt]'} ${(texte || el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 60)} (${Math.round(ix)}×${Math.round(iy)})`);
  }
  return { fab: visible ? [Math.round(f.left), Math.round(f.top), Math.round(f.width), Math.round(f.height)] : 'masqué', haut: sc.scrollTop, max: sc.scrollHeight - sc.clientHeight, rec: [...new Set(rec)] };
});

const defiler = (y) => page.evaluate((y) => {
  const sc = [...document.querySelectorAll('main, [data-page-shell], body')].find((e) => e.scrollHeight > e.clientHeight + 4 && getComputedStyle(e).overflowY !== 'visible' && e.clientHeight > 200) ?? document.scrollingElement;
  sc.scrollTop = y === 'fin' ? sc.scrollHeight : y; return sc.scrollTop;
}, y);

let m = await mesurer();
console.log(base, 'FAB', JSON.stringify(m.fab), 'max', m.max);
const pas = mobile ? 360 : 520;
const crans = [];
for (let y = 0; y < (m.max ?? 0); y += pas) crans.push(y);
crans.push('fin');
let n = 0;
for (const y of crans) {
  await defiler(y); await new Promise((r) => setTimeout(r, 250));
  const mm = await mesurer();
  if (mm.rec?.length) console.log(`  défilé ${Math.round(mm.haut)}/${Math.round(mm.max)} (${y === 'fin' ? 'FIN' : 'milieu'}) recouvre :`, mm.rec.join(' | '));
  if (n < 12 && (y === 0 || y === 'fin' || mm.rec?.length)) { await page.screenshot({ path: path.join(dir, 'captures', `${base}-${String(n).padStart(2, '0')}.png`) }); }
  n++;
}
console.log('erreurs page :', journal.erreurs.length, journal.erreurs.slice(0, 2).join(' / '), '| bloquées', journal.bloquees.length);
await browser.close();
