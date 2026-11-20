// Voie d20 : captures APRÈS (TE-27 : étape Houblons de l'assistant sans atelier V5.5 ; BT-2 : Bord sans Planning). Fixtures dev-local, jamais Firestore réel.
// Usage : node scripts/with_server.mjs --server "npm run dev" --port 3107 --env PORT=3107 -- node work/missions/2026-11-19-bugs-ecrans/voies/d20/capturer.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const url = `http://localhost:${(process.env.WITH_SERVER_PORTS ?? '3107').split(',')[0]}`;
const SORTIE = path.join(import.meta.dirname, 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const photo = async (page, nom, mobile) => {
  await dormir(500);
  await page.screenshot({ path: path.join(SORTIE, `${nom}.png`) });
  if (mobile) { // « en défilant » : le bas de l'écran aussi
    await page.evaluate(() => { document.querySelectorAll('*').forEach((n) => { if (n.scrollHeight > n.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(n).overflowY)) n.scrollTop = n.scrollHeight; }); window.scrollTo(0, 99999); });
    await dormir(400);
    await page.screenshot({ path: path.join(SORTIE, `${nom}-bas.png`) });
  }
};

async function une(largeur, theme) {
  const mobile = largeur < 600;
  const tag = `${largeur}-${theme}`;
  const { browser, page } = await ouvrir({ largeur, hauteur: mobile ? 844 : 900, mobile, echelle: 1 });
  await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* rien */ } }, theme);

  // TE-27 : l'étape Houblons de l'assistant.
  await page.goto(`${url}/?dev-local&etape=houblons&recette=identite`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('[aria-current="step"]'), { timeout: 170000 });
  await page.waitForFunction(() => /Mes ajouts de houblons/.test(document.body.textContent || ''), { timeout: 120000 });
  await dormir(2500);
  await photo(page, `d20-te27-houblons-${tag}`, mobile);
  console.log(tag, 'atelier', await page.evaluate(() => ({ depliant: !!document.querySelector('[data-role="atelier-houblons-v55"]'), titre: /Atelier houblons avancé/.test(document.body.textContent || '') })));

  // BT-2 : le Bord (Agenda) sans Planning.
  await page.goto(`${url}/?dev-local`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('[aria-label="Agenda"],section'), { timeout: 170000 });
  await dormir(3000);
  await photo(page, `d20-bt2-bord-${tag}`, mobile);
  console.log(tag, 'bord', await page.evaluate(() => ({ agenda: !!document.querySelector('[aria-label="Agenda"]'), planning: !!document.querySelector('[data-testid="bord-planning"]'), texte: (document.querySelector('[aria-label="Agenda"]')?.textContent || '').slice(0, 120) })));
  await browser.close();
}

const seul = process.env.SEUL; // ex. « 390-clair »
for (const largeur of [390, 1280]) for (const theme of ['clair', 'cave']) if (!seul || seul === `${largeur}-${theme}`) await une(largeur, theme);
