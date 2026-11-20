// Voie e1, tour 2 (corrections k2, 20.11) : captures APRÈS correctif. Banc local `?dev-local` (fixtures SIMULÉES), aucune donnée réelle.
// Usage : node scripts/with_server.mjs --server "npm run dev" --port 3109 --env PORT=3109 -- node work/missions/2026-11-19-bugs-ecrans/voies/e1/capturer2.mjs
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sortie = resolve(dirname(fileURLToPath(import.meta.url)), 'captures');
await mkdir(sortie, { recursive: true });
const port = (process.env.WITH_SERVER_PORTS || '3109').split(',')[0];
const racine = `http://localhost:${port}/?dev-local&etape=houblons`;
const urlNolo = `${racine}&recette=identite`;
const urlNoloBloque = `${racine}&recette=vide&malts=maquette`;
const urlMalts = `${racine}&recette=vide&malts=maquette`;
const navigateur = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const tailles = [{ nom: '390', w: 390, h: 844, mobile: true }, { nom: '1280', w: 1280, h: 900, mobile: false }];
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const rapport = [];
const ouvrir = async (url, t, theme) => {
  const contexte = await navigateur.createBrowserContext(); const page = await contexte.newPage();
  await page.setViewport({ width: t.w, height: t.h, deviceScaleFactor: 1, isMobile: t.mobile, hasTouch: t.mobile });
  await page.evaluateOnNewDocument((th) => { localStorage.setItem('laffinee.theme', th); }, theme);
  page.on('pageerror', (e) => rapport.push(`erreur page ${theme} ${t.nom} : ${e.message}`));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('body[data-apercu]', { timeout: 90000 }).catch(() => rapport.push(`pas de body[data-apercu] ${url}`));
  await attendre(900);
  return { page, contexte };
};
const versNolo = async (page) => {
  await page.evaluate(() => { const b = [...document.querySelectorAll('button, [role="tab"]')].find((x) => /^Identité$/.test(x.textContent.trim())); b?.click(); });
  await attendre(600);
  const interrupteur = await page.$('[aria-label="Objectif NOLO · ≤ 0,5 %"]');
  if (!interrupteur) return false;
  const actif = await page.$eval('[aria-label="Objectif NOLO · ≤ 0,5 %"]', (e) => e.getAttribute('aria-checked'));
  if (actif !== 'true') await interrupteur.click();
  await attendre(1200);
  const adopter = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find((x) => /Adapter à mon matériel/.test(x.textContent)));
  if (adopter.asElement()) { await adopter.asElement().click(); await attendre(1500); }
  await page.$eval('.nolo-simulator, [aria-label="Objectif NOLO"]', (e) => e.scrollIntoView({ block: 'start' })).catch(() => {});
  await attendre(300);
  return true;
};
const mesureNolo = (page) => page.evaluate(() => {
  const d = [...document.querySelectorAll('.nolo-simulator details')].filter((x) => !x.parentElement.closest('details'));
  const champ = document.querySelector('.nolo-simulator select');
  const cs = champ ? getComputedStyle(champ) : null;
  const fab = document.querySelector('.floating-actions > button')?.getBoundingClientRect();
  const recouverts = fab ? [...document.querySelectorAll('.nolo-simulator p, .nolo-simulator li')].filter((p) => {
    const r = p.getBoundingClientRect(); const lignes = document.createRange(); lignes.selectNodeContents(p);
    const rr = [...lignes.getClientRects()].some((q) => q.right > fab.left && q.left < fab.right && q.bottom > fab.top && q.top < fab.bottom);
    return r.height > 0 && rr;
  }).map((p) => p.textContent.slice(0, 50)) : [];
  const sum = d[0]?.querySelector('summary');
  return {
    premierPlan: d.length, ouvert: d.map((x) => x.open), appliquerGrise: document.querySelector('.nolo-solver-apply')?.disabled,
    resumeHauteur: sum ? Math.round(sum.getBoundingClientRect().height) : null, resume: sum?.textContent,
    champFond: cs?.backgroundColor, champEncre: cs?.color, fab: fab ? { gauche: Math.round(fab.left), haut: Math.round(fab.top) } : null, textesSousLePlus: recouverts,
    texteJargon: /PPG/.test([...document.querySelectorAll('.nolo-simulator')].map((n) => { const c = n.cloneNode(true); c.querySelectorAll('details').forEach((x) => x.remove()); return c.textContent; }).join(' ')),
  };
});
try {
  for (const theme of ['clair', 'cave']) {
    for (const t of tailles) {
      // 16, 18, 23 : NOLO replié (plan d'eau compatible)
      let { page, contexte } = await ouvrir(urlNolo, t, theme);
      if (await versNolo(page)) {
        await page.screenshot({ path: `${sortie}/nolo-replie-${t.nom}-${theme}.png` });
        rapport.push(`${theme} ${t.nom} NOLO replié : ${JSON.stringify(await mesureNolo(page))}`);
      } else rapport.push(`${theme} ${t.nom} NOLO replié : interrupteur introuvable`);
      await page.close(); await contexte.close();
      // 17, 19 : NOLO, plan d'eau bloqué (la fixture du tour 1)
      ({ page, contexte } = await ouvrir(urlNoloBloque, t, theme));
      if (await versNolo(page)) {
        await page.screenshot({ path: `${sortie}/nolo-${t.nom}-${theme}.png` });
        rapport.push(`${theme} ${t.nom} NOLO bloqué : ${JSON.stringify(await mesureNolo(page))}`);
        // l'état ouvert (le brasseur ouvre le dépliant) : le + ne recouvre aucun texte
        await page.evaluate(() => { const d = document.querySelector('.nolo-simulator > details'); if (d) d.open = true; });
        await attendre(300);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.evaluate(() => document.querySelectorAll('*').forEach((e) => { if (e.scrollHeight > e.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(e).overflowY)) e.scrollTop = e.scrollHeight; }));
        await attendre(500);
        await page.screenshot({ path: `${sortie}/nolo-ouvert-fin-${t.nom}-${theme}.png` });
        rapport.push(`${theme} ${t.nom} NOLO ouvert, fin : ${JSON.stringify((await mesureNolo(page)).textesSousLePlus)}`);
      }
      await page.close(); await contexte.close();
      // 20, 21 : Malts/sucres au repos : écart + / Suivant, légende des familles
      ({ page, contexte } = await ouvrir(urlMalts, t, theme));
      await page.screenshot({ path: `${sortie}/malts-repos-${t.nom}-${theme}.png` });
      const m = await page.evaluate(() => {
        const fab = document.querySelector('.floating-actions > button')?.getBoundingClientRect();
        const suivant = [...document.querySelectorAll('button')].find((b) => /^Suivant/.test(b.textContent.trim()))?.getBoundingClientRect();
        const noms = document.querySelector('[data-role="fam-noms"]');
        return {
          ecartPlusSuivant: fab && suivant ? Math.round(fab.left - suivant.right) : null,
          commandesFamille: document.querySelectorAll('[data-role="fam"]').length, boutonsDansLegende: noms ? noms.querySelectorAll('button').length : null,
          legende: noms ? [...noms.children].map((c) => c.textContent + (c.getAttribute('aria-current') === 'true' ? '*' : '')).join(' | ') : null,
        };
      });
      rapport.push(`${theme} ${t.nom} malts : ${JSON.stringify(m)}`);
      // 22 : « coriandre » puis Entrée
      await page.click('[data-role="ajout"]');
      await page.type('[data-role="ajout"]', 'coriandre');
      await attendre(300);
      await page.screenshot({ path: `${sortie}/malts-coriandre-${t.nom}-${theme}.png` });
      await page.keyboard.press('Enter');
      await attendre(900);
      await page.keyboard.press('Escape');
      await page.evaluate(() => (document.activeElement)?.blur?.());
      await attendre(400);
      await page.screenshot({ path: `${sortie}/malts-coriandre-apres-${t.nom}-${theme}.png` });
      const ligne = await page.evaluate(() => {
        const l = [...document.querySelectorAll('[data-role="ligne"], li')].find((x) => /coriandre/i.test(x.textContent) && !/Créer/.test(x.textContent));
        return l ? l.textContent.replace(/\s+/g, ' ').slice(0, 200) : null;
      });
      rapport.push(`${theme} ${t.nom} après Entrée : ${ligne}`);
      // Stocks › Articles : la fiche « coriandre » (390 clair seulement)
      if (t.nom === '390' && theme === 'clair') {
        await page.evaluate(() => { const a = [...document.querySelectorAll('button, a')].find((x) => /^Abandonner$/.test(x.textContent.trim())); a?.click(); });
        await attendre(800);
        await page.evaluate(() => { const o = [...document.querySelectorAll('button')].find((x) => /abandonner|quitter|oui/i.test(x.textContent) && x.closest('[role="dialog"]')); o?.click(); });
        await attendre(800);
        await page.evaluate(() => { const o = [...document.querySelectorAll('button, [role="tab"], a')].find((x) => /^Stocks?$/.test(x.textContent.trim())); o?.click(); });
        await attendre(1200);
        await page.screenshot({ path: `${sortie}/stock-onglet-390-clair.png` });
        rapport.push(`stock : ${await page.evaluate(() => document.body.innerText.match(/coriandre[^\n]*\n?[^\n]*/i)?.[0] ?? 'coriandre introuvable dans la page')}`);
      }
      await page.close(); await contexte.close();
    }
  }
} finally {
  await navigateur.close();
}
console.log(rapport.join('\n'));
