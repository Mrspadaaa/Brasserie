// Voie v3b, T3-2 : le détail d'un brassin dont le jour prévu est passé et non brassé (fixture du banc `?preview=calendrier`, « Saison de ferme » : données SIMULÉES).
// Usage (Vite déjà lancé sur 3135) : WITH_SERVER_PORTS=3135 node work/missions/2026-11-19-bugs-ecrans/voies/v3/banc-t32.mjs
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';

const PORT = (process.env.WITH_SERVER_PORTS ?? '3135').split(',')[0];
const SORTIE = path.join(import.meta.dirname, 'captures');
mkdirSync(SORTIE, { recursive: true });
const MODES = [{ id: '390', l: 390, h: 844, mobile: true, echelle: 2 }, { id: '1280', l: 1280, h: 800, mobile: false, echelle: 1 }];
let ko = 0;
for (const mode of MODES) {
  for (const theme of ['clair', 'cave']) {
    const { browser, page, journal } = await ouvrir({ largeur: mode.l, hauteur: mode.h, mobile: mode.mobile, echelle: mode.echelle });
    await page.goto(`http://localhost:${PORT}/?preview=calendrier`, { waitUntil: 'domcontentloaded' }); await calme(page, 1500);
    await page.evaluate((t) => { localStorage.setItem('laffinee.theme', t); if (t === 'cave') document.documentElement.setAttribute('data-theme', 'cave'); else document.documentElement.removeAttribute('data-theme'); }, theme);
    await page.waitForSelector('[data-chose], [data-barre]', { timeout: 240000 }); await calme(page, 1200);
    const ouvert = await page.evaluate(() => {
      const e = [...document.querySelectorAll('[data-chose], [data-barre]')].find((x) => (x.getAttribute('data-titre') || x.getAttribute('aria-label') || '').startsWith('Saison de ferme'));
      if (!e) return false; e.scrollIntoView({ block: 'center', inline: 'center' }); e.click(); return true;
    });
    await calme(page, 900);
    await page.waitForSelector('[data-etape="brassage"]', { timeout: 20000 }).catch(() => {});
    const lu = await page.evaluate(() => {
      const t = (e) => (e?.textContent ?? '').replace(/\s+/g, ' ').trim();
      const note = document.querySelector('[data-etapes-recalees]');
      const brassage = document.querySelector('[data-etape="brassage"]');
      const r = note?.getBoundingClientRect();
      return { brassage: t(brassage), note: t(note), noteVisible: !!r && r.width > 0 && r.height > 0 && r.right <= innerWidth + 1 && r.left >= -1, noteBox: r ? [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)] : null, etapes: [...document.querySelectorAll('[data-etape]')].map((e) => t(e)).slice(0, 6) };
    });
    const bon = ouvert && /en retard/.test(lu.brassage) && /comptées depuis aujourd/.test(lu.note) && lu.noteVisible;
    if (!bon) ko++;
    console.log(`${mode.id} ${theme} : ouvert=${ouvert} ${JSON.stringify(lu)} -> ${bon ? 'OK' : 'DEFAUT'}${journal.erreurs.length ? ' ; erreurs=' + journal.erreurs.slice(0, 2).join(' | ') : ''}`);
    await page.evaluate(() => { document.querySelector('[data-etapes-recalees]')?.scrollIntoView({ block: 'center' }); }); await calme(page, 400);
    await page.screenshot({ path: path.join(SORTIE, `t32-detail-retard-${mode.id}-${theme}.png`) });
    await browser.close();
  }
}
console.log(ko ? `T32 KO (${ko})` : 'T32 OK');
process.exit(ko ? 1 : 0);
