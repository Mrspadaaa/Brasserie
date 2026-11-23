// Captures de vérification de #144 : chaque écran de l'app, au téléphone (390) et à l'ordinateur (1280), en clair puis
// en cave. Serveur Vite lancé ici (?dev-local, fixture locale, drapeau hopV4 allumé ; réseau externe coupé).
// Usage : node scripts/theme/captures-ecrans.mjs <dossier> [--themes=clair,cave] [--largeurs=390,1280] [--ecrans=a,b]
// Écrit <ecran>-<largeur>-<theme>.png et journal.json ; rend « CAPTURES OK n » ou la liste des écrans non atteints.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'vite';

const RACINE = path.resolve(import.meta.dirname, '..', '..');
const { ouvrir, calme } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const sortie = path.resolve(process.argv[2] ?? 'captures');
const opt = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1] ?? d).split(',').filter(Boolean);
const themes = opt('themes', 'clair,cave');
const largeurs = opt('largeurs', '390,1280').map(Number);
const filtre = opt('ecrans', '');
fs.mkdirSync(sortie, { recursive: true });

process.env.VITE_HOP_V4 = 'on';
const port = Number(opt('port', String(3180 + Math.floor(Math.random() * 9)))[0]);
const serveur = await createServer({ root: RACINE, logLevel: 'error', server: { port, strictPort: true, host: '127.0.0.1' } });
await serveur.listen();
const base = `http://127.0.0.1:${port}`;

const toucher = async (page, texte, { dernier = false } = {}) => {
  const h = await page.evaluateHandle((t, d) => {
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    const c = [...document.querySelectorAll('button,a,[role=tab],[role=button],summary')].filter(vis)
      .filter((e) => (e.getAttribute('aria-label') ?? '').trim() === t || e.innerText.trim().replace(/\s+/g, ' ') === t);
    return d ? c.at(-1) : c[0];
  }, texte, dernier);
  const el = h.asElement();
  if (!el) throw new Error(`« ${texte} » introuvable`);
  await el.click();
  await calme(page, 700);
};
const wizard = async (page) => { await toucher(page, 'Actions rapides'); await toucher(page, 'Créer une recette'); await calme(page, 1200); };
const etape = async (page, nom) => {
  await wizard(page);
  if (nom === 'Identité') return;
  // Libellés du fil : courts au téléphone, longs à l'ordinateur.
  const ALIAS = { 'Malts/sucres': ['Fermentescibles'], Eau: ['Eau et sels'], 'Récap.': ['Récap', 'Récapitulatif'] };
  let fait = false;
  for (const t of [nom, ...(ALIAS[nom] ?? [])]) { try { await toucher(page, t); fait = true; break; } catch { /* libellé suivant */ } }
  if (!fait) throw new Error(`étape « ${nom} » introuvable`);
  await calme(page, 1500);
};

// Chaque écran : un chemin depuis l'accueil, et s'il faut la page entière.
const ECRANS = {
  accueil: { aller: async () => {} },
  finances: { aller: async (p) => toucher(p, 'Finances') },
  brassins: { aller: async (p) => toucher(p, 'Brassins') },
  stocks: { aller: async (p) => toucher(p, 'Stocks') },
  clients: { aller: async (p) => toucher(p, 'Clients') },
  menu: { aller: async (p) => toucher(p, 'Menu') },
  reglages: { aller: async (p) => { await toucher(p, 'Menu'); await toucher(p, 'Réglages'); } },
  recherche: { aller: async (p) => toucher(p, 'Rechercher (⌘K)') },
  actions: { aller: async (p) => toucher(p, 'Actions rapides') },
  'w1-identite': { aller: (p) => etape(p, 'Identité') },
  'w2-malts': { aller: (p) => etape(p, 'Malts/sucres') },
  'w3-houblons': { pleine: true, aller: async (p) => {
    await etape(p, 'Houblons');
    await p.locator('input[placeholder*="houblon"]').click(); await p.keyboard.type('Citra'); await calme(p, 1200);
    const plus = await p.waitForSelector('[data-role=ajout-rapide-plus]', { timeout: 4000 }).catch(() => null); // déjà dans le brouillon : rien à ajouter
    if (plus) { await plus.click(); await calme(p, 1500); }
  } },
  'w3-analyse': { aller: async (p) => { await ECRANS['w3-houblons'].aller(p); await p.evaluate(() => document.querySelector('[data-role=pont-biere]')?.click()); await calme(p, 2500);
    if (!(await p.$('[data-hop-tool-layer]'))) throw new Error('outil non ouvert'); } },
  'w4-levure': { aller: (p) => etape(p, 'Levure') },
  'w5-paliers': { aller: (p) => etape(p, 'Paliers') },
  'w6-eau': { aller: (p) => etape(p, 'Eau') },
  'w7-recap': { aller: (p) => etape(p, 'Récap.') },
  'prev-brew': { url: '/?preview=brew', pleine: true, aller: async () => {} },
  'prev-stock': { url: '/?preview=stock', aller: async () => {} },
  'prev-design': { url: '/?preview=design', pleine: true, aller: async () => {} },
};

const journal = [];
const rates = [];
try {
  for (const largeur of largeurs) for (const theme of themes) {
    const { browser, page, journal: j } = await ouvrir({ largeur, hauteur: largeur < 600 ? 844 : 900, mobile: largeur < 600 });
    await page.evaluateOnNewDocument((t) => localStorage.setItem('laffinee.theme', t), theme);
    try {
      for (const [nom, e] of Object.entries(ECRANS)) {
        if (filtre.length && !filtre.includes(nom)) continue;
        const fichier = path.join(sortie, `${nom}-${largeur}-${theme}.png`);
        try {
          await page.goto(`${base}${e.url ?? '/?dev-local'}`, { waitUntil: 'networkidle0' });
          await calme(page, 900);
          await e.aller(page);
          const pose = await page.evaluate(() => document.documentElement.dataset.theme);
          if (pose !== theme) throw new Error(`thème posé ${pose}`);
          await page.screenshot({ path: fichier, fullPage: !!e.pleine && largeur < 600 });
          const debord = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
          journal.push({ nom, largeur, theme, fichier: path.basename(fichier), debordementHorizontal: debord });
        } catch (err) {
          rates.push(`${nom}-${largeur}-${theme} : ${String(err?.message ?? err).slice(0, 120)}`);
        }
      }
      journal.push({ largeur, theme, erreursPage: j.erreurs.slice(0, 5) });
    } finally { await browser.close(); }
  }
} finally { await serveur.close(); }
fs.writeFileSync(path.join(sortie, 'journal.json'), JSON.stringify({ journal, rates }, null, 2));
for (const r of rates) console.log(`ECHEC ${r}`);
const n = journal.filter((x) => x.fichier).length;
console.log(rates.length ? `CAPTURES ECHEC ${rates.length} non atteints, ${n} prises` : `CAPTURES OK ${n}`);
process.exit(rates.length ? 1 : 0);
