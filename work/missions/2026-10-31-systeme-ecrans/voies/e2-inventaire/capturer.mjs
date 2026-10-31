// Captures de vérification de l'inventaire des écrans (voie e2) : 3 écrans tirés au hasard + l'étape Identité, à 390 × 844.
// Lancé par with_server depuis la copie de production (C:/Users/mrspa/AppData/Local/Temp/atelier-ecrans), serveur sur WITH_SERVER_PORTS.
//   node scripts/with_server.mjs --server "npm run dev -- --port 5631 --strictPort" --port 5631 -- node <ce fichier> [--ids=a,b,c] [--sortie=<dossier>]
// Rien n'est écrit dans les données : ?dev-local ouvre l'app vide (aucun jeton Firestore), réseau hors localhost bloqué.
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const arg = (nom, defaut) => process.argv.find(a => a.startsWith(`--${nom}=`))?.slice(nom.length + 3) ?? defaut;
const port = (process.env.WITH_SERVER_PORTS || '5631').split(',')[0];
const base = `http://127.0.0.1:${port}`;
const sortie = resolve(arg('sortie', 'captures'));
await mkdir(sortie, { recursive: true });
const attendre = ms => new Promise(fin => setTimeout(fin, ms));

// Écrans que l'on sait atteindre à la main depuis l'app vide ; on en tire trois au hasard (sauf --ids).
const ATTEIGNABLES = ['onglet-bord', 'finances-synthese', 'brassins-liste', 'brassins-recettes', 'stocks-stock', 'stocks-courses', 'clients-carnet', 'clients-tarifs', 'brassins-volumes'];
const tirage = () => {
  const pool = [...ATTEIGNABLES];
  const choisis = [];
  while (choisis.length < 3) choisis.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return choisis;
};
const ids = arg('ids') ? arg('ids').split(',') : tirage();
console.log('ECRANS TIRES : ' + ids.join(', '));

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio', '--no-first-run'] });
const journal = { base, ids, erreurs: [], bloques: [], captures: [] };

async function ouvrir(chemin) {
  const contexte = await browser.createBrowserContext();
  const page = await contexte.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
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

// Clique le premier bouton visible dont le texte (ou l'aria-label) commence par `texte`, dans `portee`.
async function cliquer(page, texte, portee = 'body') {
  // Les onglets sont chargés à la demande : en développement le premier appui peut attendre le module, on réessaie.
  for (let essai = 0; essai < 12; essai++) {
    if (await essayerClic(page, texte, portee)) { await attendre(900); return; }
    await attendre(700);
  }
  throw new Error('bouton introuvable : ' + texte);
}

async function essayerClic(page, texte, portee) {
  return page.evaluate((t, p) => {
    const racine = document.querySelector(p) || document.body;
    const visibles = [...racine.querySelectorAll('button, [role="tab"], a')].filter(b => b.getClientRects().length > 0);
    const lit = x => (x || '').trim().replace(/\s+/g, ' ');
    const cible = visibles.find(b => lit(b.getAttribute('aria-label')).startsWith(t) || lit(b.textContent).startsWith(t));
    if (!cible) return false;
    cible.click();
    return true;
  }, texte, portee);
}

const PARCOURS = {
  'onglet-bord': async page => { await cliquer(page, 'Bord', 'nav'); },
  'finances-synthese': async page => { await cliquer(page, 'Finances', 'nav'); await attendre(1200); },
  'brassins-liste': async page => { await cliquer(page, 'Brassins', 'nav'); },
  'brassins-recettes': async page => { await cliquer(page, 'Brassins', 'nav'); await cliquer(page, 'Recettes'); },
  'brassins-volumes': async page => { await cliquer(page, 'Brassins', 'nav'); await cliquer(page, 'Adapter les volumes'); },
  'stocks-stock': async page => { await cliquer(page, 'Stocks', 'nav'); },
  'stocks-courses': async page => { await cliquer(page, 'Stocks', 'nav'); await cliquer(page, 'Courses'); },
  'clients-carnet': async page => { await cliquer(page, 'Clients', 'nav'); },
  'clients-tarifs': async page => { await cliquer(page, 'Clients', 'nav'); await cliquer(page, 'Prix et marges'); }
};

try {
  for (const id of ids) {
    const { page, contexte } = await ouvrir('/?dev-local');
    await PARCOURS[id](page);
    // Le module de l'onglet se charge à la demande (« Chargement… ») et le toast de la graine locale s'efface après 4 s.
    await page.waitForFunction(() => !/Chargement|Ouverture de/.test(document.querySelector('main')?.innerText ?? '') && !document.querySelector('[role="status"].fixed'), { timeout: 20000 }).catch(() => journal.erreurs.push('chargement non terminé : ' + id));
    await attendre(1500);
    const fichier = resolve(sortie, `${id}-390.png`);
    await page.screenshot({ path: fichier });
    const titre = await page.evaluate(() => ({
      titres: [...document.querySelectorAll('h1, h2, h3')].filter(h => h.getClientRects().length).map(h => h.textContent.trim()).slice(0, 8),
      boutons: [...document.querySelectorAll('main button, [aria-label="Atelier de brassage"] button')].filter(b => b.getClientRects().length).map(b => (b.getAttribute('aria-label') || b.textContent || '').trim().replace(/\s+/g, ' ')).slice(0, 14)
    }));
    journal.captures.push({ id, fichier, ...titre });
    console.log('CAPTURE ' + id + ' -> ' + fichier);
    await contexte.close();
  }
  // Bonus : l'étape Identité de l'assistant (recette neuve), l'écran que le brasseur veut refaire en premier.
  const { page, contexte } = await ouvrir('/?dev-local&etape=houblons&recette=vide');
  await attendre(1500);
  await cliquer(page, 'Identité', '.recipe-mobile-header');
  await page.waitForFunction(() => !document.querySelector('[role="status"].fixed'), { timeout: 20000 }).catch(() => journal.erreurs.push('toast encore là : etape-identite'));
  await attendre(1200);
  const fichier = resolve(sortie, 'etape-identite-390.png');
  await page.screenshot({ path: fichier });
  const lecture = await page.evaluate(() => ({
    entete: (document.querySelector('.recipe-titlebar')?.textContent || '').trim().replace(/\s+/g, ' '),
    libelles: [...document.querySelectorAll('.recipe-wizard label, .recipe-wizard summary, .recipe-wizard h2, .recipe-wizard h3, .recipe-wizard button')].filter(e => e.getClientRects().length).map(e => (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, 40)
  }));
  journal.captures.push({ id: 'etape-identite', fichier, ...lecture });
  console.log('CAPTURE etape-identite -> ' + fichier);
  await contexte.close();
} finally {
  await browser.close();
  await writeFile(resolve(sortie, 'journal.json'), JSON.stringify(journal, null, 2));
}
console.log('ERREURS PAGE : ' + journal.erreurs.length + ' ; REQUETES BLOQUEES : ' + [...new Set(journal.bloques)].length);
