// TL-19 (exécutant, étape 5) : reprise d'un brouillon en Chrome. Nouveau script, le précédent (capturer.mjs, fonction reprise) échouait sur #wz-title.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const SORTIE = path.join(import.meta.dirname, 'captures');
const URL_APP = 'http://localhost:3103';

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const cliquer = (page, re, sel = 'button,[role=button],[role=menuitem],[role=switch],summary,a') => page.evaluate((src, s) => {
  const r = new RegExp(src, 'i');
  const b = [...document.querySelectorAll(s)].find((x) => r.test((x.getAttribute('aria-label') || x.textContent || '').trim()) && x.getClientRects().length);
  if (b) { b.click(); return true; } return false;
}, re.source, sel);

async function reprise(largeur, theme) {
  const mobile = largeur < 600;
  const tag = `${largeur}-${theme}`;
  const { browser, page, journal } = await ouvrir({ largeur, hauteur: mobile ? 844 : 900, mobile, echelle: 1 });
  const etapes = [];
  try {
    await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* rien */ } }, theme);
    await page.goto(`${URL_APP}/?dev-local`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!document.querySelector('[aria-label="Actions rapides"]'), { timeout: 170000 });
    await dormir(2000);
    etapes.push('accueil ok');
    // 1. ouvrir le « + » puis « Nouvelle recette »
    etapes.push('plus: ' + await page.evaluate(() => { const b = document.querySelector('[aria-label="Actions rapides"]'); b.click(); return true; }));
    await dormir(1200);
    etapes.push('nouvelle: ' + await cliquer(page, /Nouvelle recette|Créer une recette/));
    await dormir(2500);
    etapes.push('wz-title: ' + await page.evaluate(() => !!document.querySelector('#wz-title')));
    await page.type('#wz-title', 'ZZ TEST reprise');
    await dormir(1200);
    // 2. fermer par la flèche « < » (aria-label, ou premier bouton de l'en-tête)
    etapes.push('fermer: ' + await page.evaluate(() => {
      const b = [...document.querySelectorAll('button,[role=button]')].find((x) => /^(Retour|Fermer|Quitter|Revenir)/i.test(x.getAttribute('aria-label') || '') && x.getClientRects().length)
        || document.querySelector('header button, [role=banner] button');
      if (b) { b.click(); return b.getAttribute('aria-label') || b.textContent; } return false;
    }));
    await dormir(2000);
    // 3. rouvrir une nouvelle recette : la reprise doit annoncer le brouillon
    await page.evaluate(() => { document.querySelector('[aria-label="Actions rapides"]')?.click(); });
    await dormir(1200);
    etapes.push('nouvelle 2: ' + await cliquer(page, /Nouvelle recette|Créer une recette/));
    await dormir(1500);
    const lu = await page.evaluate(() => {
      const n = [...document.querySelectorAll('[role=status]')].find((x) => /Brouillon repris/.test(x.textContent || ''));
      return n ? { texte: n.textContent.trim(), dansSrOnly: !!n.closest('.sr-only') } : 'absent';
    });
    etapes.push('reprise: ' + JSON.stringify(lu));
    await dormir(500);
    await page.screenshot({ path: path.join(SORTIE, `w1-tl19-reprise-${tag}.png`) });
    if (typeof lu === 'object' && !lu.dansSrOnly) {
      await dormir(9000);
      etapes.push('apres 8 s, visible: ' + await page.evaluate(() => { const n = [...document.querySelectorAll('[role=status]')].find((x) => /Brouillon repris/.test(x.textContent || '')); return n ? !n.closest('.sr-only') : 'absent'; }));
    }
  } catch (e) {
    etapes.push('ERREUR: ' + String(e?.message ?? e).slice(0, 200));
  } finally {
    console.log(tag, etapes.join(' | '));
    console.log(tag, 'erreurs page', JSON.stringify(journal.erreurs.slice(0, 3)));
    await browser.close();
  }
}

fs.mkdirSync(SORTIE, { recursive: true });
await reprise(390, 'clair');
await reprise(1280, 'clair');
