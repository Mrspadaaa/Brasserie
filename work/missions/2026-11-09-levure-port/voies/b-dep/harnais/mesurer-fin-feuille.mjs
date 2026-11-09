// Mesure : au bout du défilement d'une feuille, le dernier élément du contenu est-il caché sous le pied (barre Annuler/Enregistrer) ?
// Usage : node mesurer-fin-feuille.mjs <prefixe-capture>   (serveur de développement sur le port 5651)
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const prefixe = process.argv[2] ?? 'avant';
const cas = [['depense', 390, 520], ['depense', 1280, 560], ['upgrade', 390, 520], ['upgrade', 1280, 560], ['facture', 390, 520], ['facture', 1280, 560]];
const themes = ['clair', 'cave'];
const navigateur = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const sortie = [];
// Le serveur de développement recharge la page quand un autre agent écrit dans le dépôt : chaque cas se rejoue (3 essais).
for (const [feuille, largeur, hauteur] of cas) for (const theme of themes) for (let essai = 1; essai <= 3; essai++) { try {
  const page = await navigateur.newPage();
  await page.setViewport({ width: largeur, height: hauteur, deviceScaleFactor: 1, hasTouch: largeur < 600 });
  await page.goto(`http://localhost:5651/work/missions/2026-11-09-levure-port/voies/b-dep/harnais/index.html?s=${feuille}&theme=${theme}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 2200));
  const mesure = await page.evaluate(() => {
    const dialogue = document.querySelector('[role="dialog"]');
    const corps = [...dialogue.children].find(c => c.className?.includes?.('overflow-y-auto'));
    corps.scrollTop = corps.scrollHeight;
    const pied = corps.nextElementSibling;
    const cadreCorps = corps.getBoundingClientRect();
    const piedHaut = pied ? pied.getBoundingClientRect().top : window.innerHeight;
    // Le dernier élément visible du contenu : son bas ne doit pas dépasser le haut du pied.
    const feuilles = [...corps.querySelectorAll('*')].filter(e => e.getBoundingClientRect().height > 0);
    const dernier = feuilles.reduce((a, e) => (e.getBoundingClientRect().bottom > a.getBoundingClientRect().bottom ? e : a), feuilles[0]);
    return { corpsBas: Math.round(cadreCorps.bottom), piedHaut: Math.round(piedHaut), dernierBas: Math.round(dernier.getBoundingClientRect().bottom), dernier: `${dernier.tagName}.${String(dernier.className).slice(0, 40)}`, scrollable: corps.scrollHeight > corps.clientHeight, a_pied: Boolean(pied), hauteurFenetre: window.innerHeight };
  });
  const cache = mesure.dernierBas > mesure.piedHaut + 0.5;
  sortie.push({ feuille, largeur, theme, ...mesure, cache });
  await page.screenshot({ path: path.join(ici, `${prefixe}-${feuille}-${largeur}-${theme}.png`) });
  await page.close();
  break;
} catch (e) { if (essai === 3) throw e; } }
await navigateur.close();
for (const s of sortie) console.log(JSON.stringify(s));
