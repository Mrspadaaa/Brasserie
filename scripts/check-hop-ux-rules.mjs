// Contrôle des règles d'utilisabilité houblons (refonte #119, phase 4).
//
// Exigence n° 0 du brasseur : « UX UI doit être UTILISABLE Pratique facile avec les
// info uniquement que l'on a besoin et que l'on veut » (C165). Les règles U1 à U7 de
// docs/besoins/parcours-cles.md la rendent vérifiable. Ce script automatise ce qui
// peut l'être, à 390 × 844, sur l'écran ouvert par un adaptateur (scripts/hop-one-tap/) :
//   U1 premier regard : aucun paragraphe de plus d'une ligne avant la première commande ;
//   U4 mots du brasseur : aucun terme interne visible ;
//   U5 un seul système visuel : ni grand panneau clair dans l'app sombre, ni police à empattements ;
//   U6 rien ne couvre une commande : chaque commande visible est au premier plan en son centre ;
//   saisie : aucun input type="number" ;
//   cibles : chaque commande visible mesure au moins 24 × 24 px et n'en chevauche aucune autre ;
//   contraste : texte visible à 4,5:1 au moins (3:1 pour le grand texte).
// U2, U3 et U7 se jugent en revue (protocole docs/qualite/protocole-revue-ux.md).
//
// Usage : node scripts/check-hop-ux-rules.mjs --adapter <adaptateur> [--tap "libellé"] [--witness] [--out dossier]
//   --tap : commande à toucher d'abord (ex. ouvrir la liste), état mesuré ensuite.
//   --witness : l'écran DOIT échouer (témoin négatif) ; sortie « WITNESS OK ».
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const repo = process.cwd();
const require = createRequire(path.resolve(repo, 'package.json'));
const puppeteer = require('puppeteer-core');
const adapter = await import(pathToFileURL(path.resolve(arg('adapter'))).href);
const width = Number(arg('width', 390)), height = Number(arg('height', 844));
const witness = process.argv.includes('--witness');
const tap = arg('tap');
const out = path.resolve(arg('out', path.join(process.env.TEMP || '/tmp', 'hop-ux-rules')));
fs.mkdirSync(out, { recursive: true });

// Termes internes interdits à l'écran (U4, liste initiale de parcours-cles.md).
const FORBIDDEN = ['V5.5', 'V6', 'dossier local', 'dossiers locaux', 'programme transmis', 'hypothèse comparative', 'canonique', 'provenance', 'creuset', 'adoption', 'reçu', 'ID exact'];

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio'] });
const ctx = await adapter.setup?.({ repo });
const context = await browser.createBrowserContext();
const page = await context.newPage();
await page.setViewport({ width, height, isMobile: width < 500, hasTouch: width < 500, deviceScaleFactor: 2 });
await adapter.open(page, { width, height, ctx });
if (tap) {
  const ok = await page.evaluate((label) => {
    const b = [...document.querySelectorAll('button, [role="button"], summary, a[href]')].find((e) => (e.getAttribute('aria-label') || e.innerText || '').trim().replace(/\s+/g, ' ').startsWith(label));
    if (b) b.click();
    return !!b;
  }, tap);
  if (!ok) { console.log(`UX-RULES FAIL commande « ${tap} » introuvable`); process.exit(1); }
  await new Promise((r) => setTimeout(r, Number(adapter.settleMs ?? 900)));
}
await page.screenshot({ path: path.join(out, 'etat.png') });

const result = await page.evaluate((forbidden, scopeSel) => {
  const vw = innerWidth, vh = innerHeight;
  const scope = (scopeSel && document.querySelector(scopeSel)) || document.body;
  // Rogné : le centre de l'élément sort d'un ancêtre qui coupe son débordement (conteneur défilant, details fermé).
  const clipped = (e, r) => { const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') { const a = n.getBoundingClientRect(); if (cx < a.left || cx > a.right || cy < a.top || cy > a.bottom) return true; }
    } return false; };
  const visible = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw && s.visibility !== 'hidden' && Number(s.opacity) > 0 && !e.closest('[inert]') && !clipped(e, r); };
  const rgb = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const bgOf = (e) => { for (let n = e; n; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c && c.a > 0.5) return c; } return rgb(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 }; };
  const fails = {};
  const add = (k, v) => { (fails[k] ??= []).push(v); };
  // Le contenu inerte (sous une feuille modale) n'est pas atteignable : il est hors du contrôle.
  const controls = [...scope.querySelectorAll('button, [role="button"], a[href], input, select, textarea, summary, [role="tab"], [role="checkbox"]')].filter((e) => visible(e) && !e.closest('[inert]'));
  const label = (e) => (e.getAttribute('aria-label') || e.innerText || e.value || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);

  // U1 : paragraphe de plus d'une ligne avant la première commande de la zone.
  const firstControlTop = Math.min(...controls.filter((c) => c.getBoundingClientRect().top >= 0).map((c) => c.getBoundingClientRect().top), vh);
  for (const e of scope.querySelectorAll('p, div, span, li')) {
    if (!visible(e) || e.closest('button, a, label, summary, [role="button"]')) continue;
    const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    if (own.length < 60) continue;
    const r = e.getBoundingClientRect(); const lh = parseFloat(getComputedStyle(e).lineHeight) || 18;
    if (r.top < firstControlTop && r.height > lh * 1.6) add('U1', own.slice(0, 60));
  }
  // U4 : termes internes visibles dans la zone.
  const text = scope.innerText;
  for (const w of forbidden) if (new RegExp('(^|[^\\p{L}\\d.])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^\\p{L}\\d])', 'iu').test(text)) add('U4', w);
  // U5 : grand panneau clair dans une app sombre ; police à empattements.
  const bodyDark = lum(bgOf(scope)) < 0.2 || lum(bgOf(document.body)) < 0.2;
  for (const e of scope.querySelectorAll('*')) {
    if (!visible(e)) continue;
    const r = e.getBoundingClientRect(); const c = rgb(getComputedStyle(e).backgroundColor);
    if (bodyDark && c && c.a > 0.8 && lum(c) > 0.6 && r.width > vw * 0.6 && r.height > 60) { add('U5', 'panneau clair ' + Math.round(r.width) + '×' + Math.round(r.height)); break; }
  }
  const serif = new Set();
  for (const e of scope.querySelectorAll('h1, h2, h3, h4, p, span, div, button, label')) {
    if (!visible(e) || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const f = getComputedStyle(e).fontFamily.toLowerCase();
    const first = f.split(',')[0].replace(/["']/g, '').trim();
    if (/serif/.test(first) && !/sans/.test(first) || /fraunces|georgia|times|garamond|playfair|merriweather/.test(first)) serif.add(first);
  }
  for (const s of serif) add('U5', 'police ' + s);
  // U6 : commande visible recouverte en son centre.
  for (const c of controls) {
    const r = c.getBoundingClientRect();
    if (r.top < 0 || r.bottom > vh) continue;
    const hit = document.elementFromPoint(Math.min(vw - 1, r.left + r.width / 2), r.top + r.height / 2);
    if (hit && !(hit === c || c.contains(hit) || hit.contains(c))) add('U6', label(c) + ' sous ' + (hit.getAttribute('aria-label') || hit.tagName.toLowerCase()));
  }
  // Saisie.
  const num = document.querySelectorAll('input[type="number"]').length;
  if (num) add('saisie', num + ' input type=number');
  // Cibles tactiles : 24 × 24 px au moins, sans chevauchement.
  const boxes = controls.map((c) => ({ c, r: c.getBoundingClientRect() })).filter(({ r }) => r.top >= 0 && r.bottom <= vh);
  for (const { c, r } of boxes) {
    const inline = c.tagName === 'A' && getComputedStyle(c).display === 'inline';
    if (!inline && (r.width < 23.5 || r.height < 23.5)) add('cibles', `${label(c)} ${Math.round(r.width)}×${Math.round(r.height)}`);
  }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.c.contains(b.c) || b.c.contains(a.c)) continue;
    const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (ox > 2 && oy > 2) add('cibles', `chevauchement ${label(a.c)} / ${label(b.c)}`);
  }
  // Contraste du texte visible.
  let low = 0; const samples = [];
  for (const e of scope.querySelectorAll('*')) {
    if (!visible(e) || !e.childNodes.length || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const r = e.getBoundingClientRect(); if (r.top < 0 || r.bottom > vh) continue;
    const s = getComputedStyle(e); const fg = rgb(s.color); if (!fg) continue;
    const bg = bgOf(e); const l1 = lum(fg), l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const size = parseFloat(s.fontSize); const bold = Number(s.fontWeight) >= 700;
    const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
    if (ratio < need) { low++; if (samples.length < 5) samples.push(`${e.textContent.trim().slice(0, 24)} ${ratio.toFixed(2)}:1`); }
  }
  if (low) add('contraste', `${low} texte(s) sous le seuil, ex. ${samples.join(' ; ')}`);
  return fails;
}, FORBIDDEN, adapter.scope ?? null);

await browser.close();
await adapter.teardown?.(ctx);
fs.writeFileSync(path.join(out, 'rapport.json'), JSON.stringify(result, null, 2));
const rules = Object.keys(result);
const summary = rules.length ? rules.map((k) => `${k} (${result[k].length} : ${result[k].slice(0, 3).join(' | ')})`).join(' ; ') : 'aucune règle en échec';
if (!rules.length && !witness) console.log('UX-RULES OK ' + summary);
else if (rules.length && witness) console.log(`WITNESS OK ${rules.length} règle(s) en échec : ${summary}`);
else { console.log((witness ? 'WITNESS FAILED (l’écran témoin passe) ' : 'UX-RULES FAIL ') + summary); process.exitCode = 1; }
