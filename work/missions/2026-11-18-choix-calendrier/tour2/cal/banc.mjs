// Banc lot cal (tour 2) : mesures DOM et captures, port 5601. Usage : node banc.mjs <sortie> [filtre]
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2];
const filtre = process.argv[3] ?? '';
mkdirSync(OUT, { recursive: true });
const req = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/package.json');
const puppeteer = req('puppeteer-core');
const URL0 = 'http://localhost:5601/?preview=calendrier' + (process.argv[4] === 'complet' ? '' : '&jeu=brasseur');
const dormir = ms => new Promise(r => setTimeout(r, ms));
const MODES = [
  { nom: 'p390', vp: { width: 390, height: 660, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, touch: true },
  { nom: 'p390h800', vp: { width: 390, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, touch: true },
  { nom: 'l844', vp: { width: 844, height: 340, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true }, touch: true },
  { nom: 'd1280', vp: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false }, touch: false }
];
const lignes = [];
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', protocolTimeout: 240000, args: ['--hide-scrollbars'] });
for (const M of MODES) for (const theme of ['clair', 'cave']) {
  const tag = `${M.nom}-${theme}`;
  if (filtre && !tag.includes(filtre)) continue;
  const page = await nav.newPage();
  page.on('pageerror', e => lignes.push({ tag, erreur: String(e).slice(0, 200) }));
  await page.evaluateOnNewDocument(t => { try { localStorage.setItem('laffinee.theme', t); } catch { /* */ } }, theme);
  await page.emulate({ viewport: M.vp, userAgent: (await nav.userAgent()) + (M.touch ? ' Mobile' : '') });
  await page.goto(URL0, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.evaluate(() => { try { const t = localStorage.getItem('laffinee.theme'); localStorage.clear(); if (t) localStorage.setItem('laffinee.theme', t); } catch { /* */ } });
  await page.goto(URL0, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('[data-frise]', { timeout: 90000 });
  await dormir(1200);
  const mesurer = () => page.evaluate(() => {
    const R = e => { if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; };
    const q = s => document.querySelector(s);
    const header = q('header');
    const banc = q('[data-banc]');
    const fr = q('[data-frise]');
    const bancBas = banc ? Math.round(banc.getBoundingClientRect().bottom) : 0;
    const hautFrise = fr ? Math.round(fr.getBoundingClientRect().top) : null;
    const MOIS = /^(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)/i;
    const moisCourbe = [...document.querySelectorAll('.ent-cbz text')].filter(t => MOIS.test((t.textContent ?? '').trim())).map(t => (t.textContent ?? '').trim());
    const sousTitre = header ? [...header.querySelectorAll('span')].filter(s => s.children.length === 0 && /Villars/.test(s.textContent ?? '') && s.getBoundingClientRect().height > 0).length : 0;
    // chaque brassin : sa barre et son étiquette (le .cal-lbl qui la suit)
    const brassins = [...document.querySelectorAll('section[data-rangee="brassins"] [data-barre]')].map(b => {
      let l = b.nextElementSibling;
      while (l && !l.classList.contains('cal-lbl')) l = l.nextElementSibling;
      const rb = b.getBoundingClientRect(), rl = l?.getBoundingClientRect();
      const nomTxt = (l?.textContent ?? b.textContent ?? '').trim().slice(0, 60);
      const dedans = !!rl && rl.left >= rb.left - 1 && rl.right <= rb.right + 1;
      const ecart = rl ? (rl.left >= rb.right ? Math.round(rl.left - rb.right) : rl.right <= rb.left ? Math.round(rb.left - rl.right) : 0) : null;
      return { id: b.getAttribute('data-chose-id'), w: Math.round(rb.width), cote: l ? [...l.classList].find(c => /^cal-lbl-(dedans|gauche|droite)$/.test(c)) : null, nom: nomTxt, dedans, ecart };
    });
    return {
      vh: innerHeight, vw: innerWidth, orientation: q('[data-calendrier]')?.getAttribute('data-orientation'),
      header: header && getComputedStyle(header).display !== 'none' ? R(header) : 'cache', sousTitre, banc: R(banc),
      zone: R(q('[data-entete-zone]')), courbe: R(q('.ent-cbz')), bande: R(q('.ent-bz')), frise: hautFrise,
      pct: hautFrise === null ? null : Math.round(((hautFrise - bancBas) / (innerHeight - bancBas)) * 1000) / 10,
      pctBrut: hautFrise === null ? null : Math.round((hautFrise / innerHeight) * 1000) / 10,
      moisCourbe, plein: !!q('[data-plein]'), fs: !!document.fullscreenElement, brassins
    };
  });
  const cap = async nom => { try { await page.screenshot({ path: join(OUT, `${tag}-${nom}.png`), captureBeyondViewport: false }); } catch (e) { lignes.push({ tag, nom, capEchec: String(e).slice(0, 80) }); } lignes.push({ tag, nom, ...(await mesurer()) }); };
  await cap('repos');
  // plein écran (vrai toucher du bouton)
  const b = await page.evaluate(() => { const e = document.querySelector('.ent-pl'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  if (b) {
    if (M.touch) await page.touchscreen.tap(b.x, b.y); else await page.mouse.click(b.x, b.y);
    await dormir(1500);
    await cap('plein');
    const b2 = await page.evaluate(() => { const e = document.querySelector('.ent-pl'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    if (b2) { if (M.touch) await page.touchscreen.tap(b2.x, b2.y); else await page.mouse.click(b2.x, b2.y); await dormir(1200); await cap('retour'); }
  }
  await page.close();
}
await nav.close();
writeFileSync(join(OUT, 'mesures.jsonl'), lignes.map(l => JSON.stringify(l)).join('\n'));
for (const l of lignes) console.log(JSON.stringify({ ...l, brassins: (l.brassins ?? []).map(x => `${x.nom.slice(0, 28)}|${x.cote}|w${x.w}|e${x.ecart}`) }));
