// Captures de l'étape « Fermentescibles 2/7 » (voie i1, mission 2026-10-31-ecran-fermentescibles).
// Adaptation de work/missions/2026-10-31-systeme-ecrans/voies/e2-inventaire/capturer.mjs : l'app n'ouvre pas l'étape 2 par URL,
// donc on part de `?dev-local&etape=houblons` (ou `&recette=vide`) et on tape le fil « Fermentescibles » (aria-label).
// Lancement, depuis la copie de production (ne jamais écrire dedans) :
//   cd C:/Users/mrspa/AppData/Local/Temp/atelier-ecrans
//   node scripts/with_server.mjs --server "npm run dev -- --port 5631 --strictPort" --port 5631 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake ... -- node <ce fichier> --sortie=<dossier>
// Rien n'est écrit dans les données : ?dev-local, réseau hors localhost bloqué.
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const arg = (nom, defaut) => process.argv.find(a => a.startsWith(`--${nom}=`))?.slice(nom.length + 3) ?? defaut;
const port = (process.env.WITH_SERVER_PORTS || '5631').split(',')[0];
const base = `http://127.0.0.1:${port}`;
const sortie = resolve(arg('sortie', 'captures'));
await mkdir(sortie, { recursive: true });
const attendre = ms => new Promise(fin => setTimeout(fin, ms));

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio', '--no-first-run'] });
const journal = { base, erreurs: [], bloques: [], captures: [], notes: [] };

async function ouvrir(chemin, largeur, hauteur, mobile) {
  const contexte = await browser.createBrowserContext();
  const page = await contexte.newPage();
  await page.setViewport({ width: largeur, height: hauteur, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  page.on('pageerror', e => journal.erreurs.push(e.message));
  await page.setRequestInterception(true);
  page.on('request', r => {
    const u = new URL(r.url());
    if (u.origin === base || ['data:', 'blob:'].includes(u.protocol) || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(u.hostname)) return r.continue();
    journal.bloques.push(u.origin);
    return r.abort();
  });
  await page.goto(base + chemin, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('main, .recipe-wizard, [data-route-base="wizard"]') !== null, { timeout: 60000 });
  await attendre(1500);
  return { page, contexte };
}

// Attend que le bouton « Fermentescibles » du fil soit là (l'assistant peut charger à la demande), puis le tape.
async function allerEtapeFermentescibles(page) {
  for (let essai = 0; essai < 30; essai++) {
    const ok = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button[aria-label="Fermentescibles"]')].find(x => x.getClientRects().length > 0);
      if (!b) return false;
      b.click();
      return true;
    });
    if (ok) break;
    await attendre(500);
  }
  // Le champ du stock n'a ni placeholder ni aria-label dans le DOM : on repère son bouton « Ouvrir la liste ».
  const trouve = await page.waitForFunction(() => document.querySelector('button[aria-label="Ouvrir la liste"]') !== null, { timeout: 20000 })
    .then(() => true, () => false);
  if (!trouve) {
    // Diagnostic : ce qui est affiché à la place, pour lire la cause au lieu de deviner.
    const diag = await page.evaluate(() => ({
      titre: document.querySelector('.recipe-titlebar, .recipe-mobile-header')?.textContent?.trim().replace(/\s+/g, ' '),
      inputs: [...document.querySelectorAll('input')].map(i => i.getAttribute('aria-label') || i.id).slice(0, 15),
      boutons: [...document.querySelectorAll('button')].filter(b => b.getClientRects().length).map(b => b.getAttribute('aria-label') || b.textContent.trim().slice(0, 40)).slice(0, 25)
    }));
    journal.notes.push('DIAGNOSTIC etape 2 : ' + JSON.stringify(diag));
    await page.screenshot({ path: resolve(sortie, 'diagnostic.png') });
    journal.erreurs.push('champ « Ajouter un fermentescible » introuvable');
    return false;
  }
  await attendre(1200);
  return true;
}

// Remplit la facture : trois malts et un sucre, choisis dans la liste du stock (premier choix proposé), poids saisis.
async function remplirFacture(page) {
  const choisir = async (famille, rang, poids) => {
    const presente = await page.evaluate(() => !!document.querySelector('button[aria-label="Ouvrir la liste"]'));
    if (!presente) { journal.notes.push(`${famille} ${rang} : picker absent, rien ajouté`); return; }
    // La liste du stock s'ouvre par son bouton « Ouvrir la liste » (la famille courante fixe le rayon).
    await page.evaluate(() => [...document.querySelectorAll('button[aria-label="Ouvrir la liste"]')].find(b => b.getClientRects().length > 0)?.click());
    await attendre(400);
    const nom = await page.evaluate(() => {
      const opts = [...document.querySelectorAll('[role="listbox"] [role="option"]')].filter(o => o.getClientRects().length > 0);
      const o = opts.find(x => !/Ajouter|Créer/i.test(x.textContent || ''));
      if (!o) return null;
      o.click();
      return (o.getAttribute('aria-label') || o.textContent || '').trim().replace(/\s+/g, ' ');
    });
    journal.notes.push(`${famille} ${rang} : ${nom ?? 'aucune option du stock, rien ajouté'}`);
    await attendre(700);
    if (nom) {
      const saisie = await page.$(`#wz-fermentable-${rang} input, input#wz-fermentable-${rang}`);
      if (saisie) {
        await saisie.click({ clickCount: 3 });
        await saisie.type(String(poids));
        await page.keyboard.press('Tab');
        await attendre(500);
      } else journal.erreurs.push(`saisie du poids introuvable : rang ${rang}`);
    }
  };
  for (let i = 0; i < 3; i++) await choisir('grain', i, [4.2, 0.8, 0.3][i]);
  // Passer la famille à « Sucre » : le bouton de famille tourne (grain → sucre dans l'ordre affiché).
  await page.evaluate(() => document.querySelector('button[aria-label^="Famille de fermentescible"]')?.click());
  await attendre(500);
  await choisir('sucre', 3, 0.5);
}

async function capturer(nom, page, fichierPlein = true) {
  const fichier = resolve(sortie, `${nom}.png`);
  await page.screenshot({ path: fichier, fullPage: false });
  const lecture = await page.evaluate(() => ({
    entete: (document.querySelector('.recipe-titlebar, .recipe-mobile-header')?.textContent || '').trim().replace(/\s+/g, ' '),
    bandeau: (document.querySelector('.recipe-metrics')?.textContent || '').trim().replace(/\s+/g, ' '),
    lignes: [...document.querySelectorAll('.recipe-wizard li, main li')].filter(e => e.getClientRects().length).map(e => (e.textContent || '').trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, 12),
    boutons: [...document.querySelectorAll('main button, [aria-label="Étapes"] button')].filter(b => b.getClientRects().length).map(b => (b.getAttribute('aria-label') || b.textContent || '').trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, 30)
  }));
  journal.captures.push({ id: nom, fichier, plein: fichierPlein, ...lecture });
  console.log('CAPTURE ' + nom + ' -> ' + fichier);
}

try {
  // 1. Recette remplie (fixture Stout export de l'aperçu dev, complétée de malts et d'un sucre à la main).
  {
    const { page, contexte } = await ouvrir('/?dev-local&etape=houblons', 390, 844, true);
    await allerEtapeFermentescibles(page);
    await remplirFacture(page);
    await attendre(800);
    await capturer('fermentescibles-pleine-390', page);
    // 3. Geste « ajouter », liste ouverte.
    await page.evaluate(() => [...document.querySelectorAll('button[aria-label="Ouvrir la liste"]')].find(b => b.getClientRects().length > 0)?.click());
    await attendre(700);
    await capturer('fermentescibles-ajout-390', page);
    await contexte.close();
  }
  // 2. Recette vide.
  {
    const { page, contexte } = await ouvrir('/?dev-local&etape=houblons&recette=vide', 390, 844, true);
    await allerEtapeFermentescibles(page);
    await capturer('fermentescibles-vide-390', page);
    await contexte.close();
  }
  // 4. Bureau 1280 × 900, recette remplie.
  {
    const { page, contexte } = await ouvrir('/?dev-local&etape=houblons', 1280, 900, false);
    await allerEtapeFermentescibles(page);
    await remplirFacture(page);
    await attendre(800);
    await capturer('fermentescibles-pleine-1280', page, true);
    await contexte.close();
  }
} finally {
  await browser.close();
  await writeFile(resolve(sortie, 'journal.json'), JSON.stringify(journal, null, 2));
}
console.log('ERREURS PAGE : ' + journal.erreurs.length + ' ; REQUETES BLOQUEES : ' + [...new Set(journal.bloques)].length);
