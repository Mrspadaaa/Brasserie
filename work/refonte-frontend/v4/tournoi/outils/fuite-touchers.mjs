// D14 (suite, 18.10) : jouer-boosters ne touche que les data-booster ; un auteur du lot 3 a
// trouvé « [object HTMLButtonElement] » après une exclusion de goût et dans « Comparer », que
// rien ne voyait. Ce script touche, sur chaque page de chaque fil, tous les éléments
// interactifs visibles l'un après l'autre (sans recharger, comme une main qui explore) et
// relève tout texte technique visible après chaque toucher.
// Usage : node work/refonte-frontend/v4/tournoi/outils/fuite-touchers.mjs <dossier> [ids…] [--max=30]
// Imprime FUITE OK si rien n'a fui, sinon FUITE ECHEC et la liste (page, élément, texte).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const max = Number((args.find((a) => a.startsWith('--max=')) || '--max=30').slice(6));
const ids = fs.readdirSync(dir).filter((d) => /^p\d+$|^consolide$|^version-|^temoin/.test(d) && fs.existsSync(path.join(dir, d, 'index.html')))
  .filter((d) => !only.length || only.includes(d)).sort();
const LEAK = /\b(null|undefined|NaN)\b|\[object [A-Za-z]+\]/g;
const SEL = 'button, [role="button"], [role="tab"], [role="switch"], [data-booster], [data-role="gout"], [data-role="ajout-rapide"], [data-role="type-ajout"], [data-role="quand"], input[type="range"], input[type="checkbox"], input[type="radio"], summary, label, select';

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];

async function explore(id, file) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const url = pathToFileURL(path.join(dir, id, file)).href;
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e.message || e).slice(0, 120)));
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  const leak = () => page.evaluate((src) => (document.body.innerText.match(new RegExp(src, 'g')) || []).slice(0, 2), LEAK.source);
  const first = await leak();
  if (first.length) problems.push(id + '/' + file + ' au chargement : ' + first.join(', '));
  let touched = 0;
  for (let i = 0; i < max; i++) {
    if (page.url().split('#')[0] !== url) await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    const els = await page.$$(SEL);
    if (i >= els.length) break;
    const el = els[i];
    const info = await el.evaluate((e) => {
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      const vis = r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
      if (e.tagName === 'A' && e.getAttribute('href') && !e.getAttribute('href').startsWith('#')) return null;
      return vis ? (e.getAttribute('data-booster') || e.getAttribute('data-role') || e.getAttribute('aria-label') || e.innerText || e.tagName).trim().slice(0, 40) : null;
    }).catch(() => null);
    if (!info) continue;
    try { await el.evaluate((e) => e.scrollIntoView({ block: 'center' })); await el.tap(); } catch { try { await el.click(); } catch { continue; } }
    touched++;
    await new Promise((r) => setTimeout(r, 180));
    if (page.url().split('#')[0] !== url) continue;
    const f = await leak();
    if (f.length) { problems.push(id + '/' + file + ' après « ' + info + ' » : ' + f.join(', ')); break; }
  }
  if (errs.length) problems.push(id + '/' + file + ' erreur de page : ' + errs[0]);
  await page.close();
  return touched;
}

const jobs = [];
for (const id of ids) for (const f of fs.readdirSync(path.join(dir, id)).filter((x) => x.endsWith('.html')).sort()) jobs.push([id, f]);
let n = 0;
const worker = async () => { while (jobs.length) { const [id, f] = jobs.shift(); n += await explore(id, f); } };
await Promise.all([worker(), worker(), worker(), worker()]);
await browser.close();
if (problems.length === 0) console.log('FUITE OK ' + ids.length + '/' + ids.length + ' (' + n + ' touchers)');
else { console.log('FUITE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exitCode = 1; }
