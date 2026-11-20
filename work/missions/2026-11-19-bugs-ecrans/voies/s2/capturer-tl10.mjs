// Voie s2, TL-10 — l'étape Malts/sucres avec « Pilsner Malz » SANS EBC saisi (stock simulé de apercuDev.ts, jamais Firestore) : la tuile d'Ajout et la ligne ajoutée.
// Usage : node scripts/with_server.mjs --server "npm run dev -- --port 3105 --strictPort" --port 3105 --timeout 180 -- node work/missions/2026-11-19-bugs-ecrans/voies/s2/capturer-tl10.mjs
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const racine = process.cwd();
const dossier = path.join(racine, 'work/missions/2026-11-19-bugs-ecrans/voies/s2/captures');
const { ouvrir, calme } = await import(pathToFileURL(path.join(racine, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const url = 'http://localhost:3105/?dev-local&etape=houblons&recette=vide&malts=vide';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const sorties = [];
for (const [largeur, hauteur, mobile, echelle] of [[390, 844, true, 2], [1280, 800, false, 1]]) {
  for (const theme of ['clair', 'cave']) {
    const { browser, page, journal } = await ouvrir({ largeur, hauteur, mobile, echelle });
    try {
      await page.goto(url, { waitUntil: 'networkidle0' });
      await page.waitForSelector('[data-etape="fermentescibles"] [data-role="ajout"]', { timeout: 60000 });
      await page.evaluate((t) => { if (t === 'cave') document.documentElement.setAttribute('data-theme', 'cave'); else document.documentElement.removeAttribute('data-theme'); }, theme);
      await calme(page, 600);
      await page.click('[data-role="ajout"]'); await dormir(200);
      await page.keyboard.type('pilsner', { delay: 15 }); await dormir(500);
      const tuile = await page.evaluate(() => {
        const t = document.querySelector('[data-role="resultat"][data-nom="Pilsner Malz"]');
        return t ? { ebc: t.querySelector('.fer-ebcp')?.textContent ?? null, texte: t.textContent.replace(/\s+/g, ' ').trim() } : null;
      });
      await page.screenshot({ path: path.join(dossier, `tl10-tuile-${theme}-${largeur}.png`) });
      await page.keyboard.press('Enter'); await dormir(800);
      const ligne = await page.evaluate(() => {
        const n = [...document.querySelectorAll('[data-etape="fermentescibles"] [data-role="nom"]')].find((e) => /pilsner/i.test(e.textContent));
        const r = n?.closest('[data-sel], li, [role="row"], .fer-l') ?? n?.parentElement?.parentElement;
        return { texte: r ? r.textContent.replace(/\s+/g, ' ').trim() : null, ebcInconnu: document.querySelectorAll('[data-etape="fermentescibles"] .fer-inc').length };
      });
      await page.screenshot({ path: path.join(dossier, `tl10-ligne-${theme}-${largeur}.png`), fullPage: true });
      sorties.push({ largeur, theme, tuile, ligne, erreurs: journal.erreurs.length, bloquees: journal.bloquees.length });
    } finally {
      await browser.close();
    }
  }
}
console.log(JSON.stringify(sorties, null, 1));
