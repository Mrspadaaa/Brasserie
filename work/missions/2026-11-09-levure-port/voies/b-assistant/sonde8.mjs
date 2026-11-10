// Contrastes (WCAG) et cibles < 24 px d'une étape, mesurés dans Chrome. Usage : node sonde8.mjs <largeur> <theme> <étape>
import { ouvrir, etape, capture, dormir } from './banc.mjs';
const largeur = Number(process.argv[2] ?? 1280);
const theme = process.argv[3] ?? 'clair';
const quelle = process.argv[4] ?? 'Malts';
const { browser, page } = await ouvrir({ largeur, hauteur: largeur < 600 ? 844 : 900, theme });
const bascule = await page.evaluate(() => document.documentElement.className + ' | ' + document.body.className);
if (quelle === 'Fiche') {
  // Banc de la fiche (RecipePage réelle, recette simulée) : sections ouvertes avant la mesure.
  await page.goto(`http://localhost:5655/work/missions/2026-11-09-levure-port/voies/b-assistant/fiche.html?theme=${theme}`, { waitUntil: 'load' });
  await page.waitForFunction(() => /Couleur attendue/.test(document.body.innerText), { timeout: 150000 }).catch(() => {});
  await dormir(1500);
  for (const s of ['Grain', 'Houblons', 'Potentiel aromatique', 'Levure', 'Empâtage', 'Fermentation']) {
    await page.evaluate((x) => { const b = [...document.querySelectorAll('summary,button[aria-expanded]')].find((e) => (e.textContent || '').trim().startsWith(x)); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); }, s);
    await dormir(400);
  }
  console.log('parts ->', JSON.stringify((await page.evaluate(() => document.body.innerText)).split('\n').filter((l) => /^\d+ ?%$/.test(l.trim()) || /sachet|phase/.test(l)).slice(0, 12)));
} else await etape(page, quelle);
await dormir(500);
const r = await page.evaluate(() => {
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const fond = (el) => { const pile = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) pile.push(c); if (c && c.a === 1) break; } let b = { r: 255, g: 255, b: 255, a: 1 }; for (const c of pile.reverse()) b = over(c, b); return b; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const contraste = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const bas = []; const petits = [];
  const vus = new Set();
  for (const el of document.querySelectorAll('main *, [data-etape] *, .recipe-wizard *')) {
    if (vus.has(el)) continue; vus.add(el);
    const cs = getComputedStyle(el); const rc = el.getBoundingClientRect();
    if (rc.width === 0 || rc.height === 0 || cs.visibility === 'hidden' || cs.display === 'none') continue;
    const aTexte = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
    if (aTexte) {
      const fg = parse(cs.color); if (!fg) continue;
      const bg = fond(el); const c = contraste(over(fg, bg), bg);
      const px = parseFloat(cs.fontSize); const gras = parseInt(cs.fontWeight, 10) >= 700;
      const seuil = px >= 24 || (px >= 18.66 && gras) ? 3 : 4.5;
      if (c < seuil) bas.push({ cls: el.tagName + '.' + String(el.className).slice(0, 30) + ' < ' + (el.parentElement ? el.parentElement.tagName + '.' + String(el.parentElement.className).slice(0, 30) : ''), t: el.textContent.trim().slice(0, 40), c: Math.round(c * 100) / 100, px, fg: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})` });
    }
    if (['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.getAttribute('role') === 'button') {
      if (rc.width < 24 || rc.height < 24) petits.push({ el: el.tagName + ':' + (el.type || '') + '.' + String(el.className).slice(0, 40), aria: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40), w: Math.round(rc.width), h: Math.round(rc.height) });
    }
  }
  const uniq = (l, k) => [...new Map(l.map((x) => [k(x), x])).values()];
  return { bas: uniq(bas, (x) => x.t + x.fg + x.bg).slice(0, 14), nBas: bas.length, petits: uniq(petits, (x) => x.aria + x.w + x.h).slice(0, 14), nPetits: petits.length };
});
console.log(`${quelle} ${largeur} ${theme} (${bascule.slice(0, 60)})`);
console.log('CONTRASTES BAS', r.nBas, JSON.stringify(r.bas));
console.log('CIBLES < 24 px', r.nPetits, JSON.stringify(r.petits));
await capture(page, `s8-${quelle}-${largeur}-${theme}`);
await browser.close();
