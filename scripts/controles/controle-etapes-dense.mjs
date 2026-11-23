#!/usr/bin/env node
/**
 * CARNET-ETAPES-DENSE (DEFAUTS-RECURRENTS, 23.11 : « ça manque un peu de compact, c'est pas assez dense » ; v01 : « Toujours pas assez
 * compact le carnet »). Mesure à 390 px la hauteur de la barre repliée et des lignes d'étape de la lecture d'un lien, contre
 * docs/ui-compacte.md (hauteurs communes 24/28/32 px) :
 *  - barre repliée : 32 px au plus ;
 *  - ligne d'étape d'une ligne : 26 px au plus (24 px et son filet) ; une ligne dont le détail porte la décision (douteuse, échec, via
 *    Google) passe à deux lignes : 46 px au plus.
 * Deux cibles :
 *  - `app` : le banc local (`?preview=carnets`, serveur Vite à BANC_URL, défaut http://localhost:5173) ; le lien douteux collé dans
 *    Ventilation, lecture lente : lignes mesurées au milieu de la lecture, puis Replier, barre mesurée ;
 *  - `v01` : work/missions/maquettes-carnet/v01.html (#repliee), témoin négatif : sa barre fait ~58 px, le contrôle doit dire KO.
 * Sans argument : les deux ; sortie « app OK|KO », « v01 OK|KO », puis « CONTROLE OK » si l'app passe et que le témoin échoue.
 * Navigateur : le Chrome de débug (127.0.0.1:9222), dans un onglet neuf, refermé ; jamais Chrome lui-même.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(racine, 'package.json'));
const puppeteer = require('puppeteer-core');
const BANC = process.env.BANC_URL ?? 'http://localhost:5173';
const MAX = { barre: 32, ligne: 26, ligne2: 46 };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function mesurer(page, selBarre, selLigne) {
  return page.evaluate((selBarre, selLigne) => {
    const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; };
    const barres = [...document.querySelectorAll(selBarre)].filter(vis).map((e) => Math.round(e.getBoundingClientRect().height * 10) / 10);
    const lignes = selLigne ? [...document.querySelectorAll(selLigne)].filter(vis).map((e) => ({
      h: Math.round(e.getBoundingClientRect().height * 10) / 10,
      deux: ['douteux', 'echec'].includes(e.dataset.statut) || e.hasAttribute('data-google'),
      texte: e.textContent.trim().slice(0, 40)
    })) : [];
    return { barres, lignes };
  }, selBarre, selLigne);
}

function juger(nom, m, attenduLignes) {
  const fautes = [];
  if (!m.barres.length) fautes.push('barre repliée introuvable');
  for (const h of m.barres) if (h > MAX.barre) fautes.push(`barre ${h} px > ${MAX.barre}`);
  if (attenduLignes && !m.lignes.length) fautes.push('aucune ligne d’étape');
  for (const l of m.lignes) { const max = l.deux ? MAX.ligne2 : MAX.ligne; if (l.h > max) fautes.push(`ligne « ${l.texte} » ${l.h} px > ${max}`); }
  console.log(`${nom} : barre ${m.barres.join(', ') || '—'} px ; lignes ${m.lignes.map((l) => l.h).join(', ') || '—'} px`);
  for (const f of fautes) console.log(`  · ${f}`);
  console.log(`${nom} ${fautes.length ? 'KO' : 'OK'}`);
  return !fautes.length;
}

const cibles = process.argv.slice(2).length ? process.argv.slice(2) : ['app', 'v01'];
const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const page = await browser.newPage();
const res = {};
try {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  if (cibles.includes('app')) {
    await page.goto(`${BANC}/?preview=carnets&ouvrir=ventilation&lecture=lente`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    const champ = await page.waitForSelector('textarea', { timeout: 90_000 });
    await champ.click();
    await page.keyboard.type('https://exemple.invalid/hotte-douteuse');
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Ajouter')?.click());
    await pause(11_000);
    const milieu = await mesurer(page, '[data-lecture-barre]', '[data-lecture] [data-lecture-etape]');
    await page.evaluate(() => [...document.querySelectorAll('[data-lecture] button')].find((b) => b.textContent.includes('Replier'))?.click());
    await pause(500);
    const replie = await mesurer(page, '[data-lecture-barre]', null);
    res.app = juger('app', { barres: replie.barres, lignes: milieu.lignes }, true);
  }
  if (cibles.includes('v01')) {
    await page.goto(pathToFileURL(path.join(racine, 'work/missions/maquettes-carnet/v01.html')).href + '#repliee', { waitUntil: 'load' });
    await pause(300);
    res.v01 = juger('v01', await mesurer(page, '.v1-s.repliee .v1-bar', null), false);
  }
} finally {
  await page.close();
  browser.disconnect();
}
const ok = (res.app ?? true) && (res.v01 === undefined || res.v01 === false);
if (cibles.length === 2) console.log(ok ? 'CONTROLE OK (app OK, témoin v01 KO)' : 'CONTROLE ECHEC');
process.exit(cibles.length === 2 ? (ok ? 0 : 1) : (Object.values(res).every(Boolean) ? 0 : 1));
