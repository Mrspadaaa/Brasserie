// u1 (26.10) : rejoue le geste du brasseur sur l'étape Houblons de l'assistant (390 x 844), sur un serveur donné.
// Usage : node repro.mjs <portDuServeur> <étiquette> [vide|maquette]
// Le serveur est un `vite preview` d'un build de production avec dev-local rouvert dans un worktree temporaire
// (le build garde import.meta.env.DEV = false dans maBiere/index.tsx, comme la prod), ou un serveur de dev.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const [port, etiquette, mode = 'maquette'] = process.argv.slice(2);
const IMG = path.join(import.meta.dirname, 'img');
fs.mkdirSync(IMG, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844 });
const sortie = {};
try {
  const url = `http://localhost:${port}/?dev-local&etape=houblons${mode === 'vide' || mode === 'reelle' ? `&recette=${mode}` : ''}`;
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 120000 });
  await dormir(1500);
  const lire = () => page.evaluate(() => {
    const sec = document.querySelector('[data-element="etape-profil"]');
    const barres = [...document.querySelectorAll('[data-famille-profil]')];
    return {
      profilPresent: !!sec,
      barres: barres.length,
      hachurees: barres.filter((b) => b.querySelector('.pq-hachure')).length,
      pont: [...document.querySelectorAll('[data-role="pont-biere"]')].map((b) => b.textContent.trim()),
      ariaProfil: sec?.getAttribute('aria-label') ?? null,
      alerte: document.querySelector('[data-role="alerte"], [data-role="decompte"]')?.textContent.trim() ?? null,
      ajouts: document.querySelectorAll('[data-rang^="ajout"], [data-ajout]').length,
      provisoire: /provisoire|non réelles/i.test(document.body.innerText),
      texteTitre: document.body.innerText.slice(0, 200).replace(/\s+/g, ' '),
    };
  });
  sortie.avant = await lire();
  await page.evaluate(() => document.querySelector('[data-element="etape-profil"]')?.scrollIntoView({ block: 'center' }));
  await dormir(500);
  await page.screenshot({ path: path.join(IMG, `${etiquette}-${mode}-1-etape.png`) });
  // le geste : toucher le panneau du profil, à gauche de l'alerte (hors bouton) puis sur une barre.
  const boite = await page.evaluate(() => { const r = document.querySelector('[data-element="etape-profil"]').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await page.touchscreen.tap(boite.x + boite.w - 6, boite.y + boite.h / 2);
  await dormir(1200);
  sortie.apresToucher = await lire();
  await page.screenshot({ path: path.join(IMG, `${etiquette}-${mode}-2-apres-toucher.png`) });
  const pont = await page.$('[data-role="pont-biere"]');
  if (pont) { await pont.tap(); await dormir(1200); sortie.apresPont = await lire(); await page.screenshot({ path: path.join(IMG, `${etiquette}-${mode}-3-apres-pont.png`) }); }
} catch (e) { sortie.erreur = String(e?.message ?? e); }
sortie.consoleErreurs = journal.console.filter((c) => /error|warn/.test(c.type)).map((c) => `${c.type}: ${c.texte.slice(0, 200)}`).slice(0, 12);
sortie.pageErreurs = journal.erreurs.slice(0, 8);
console.log(JSON.stringify(sortie, null, 1));
await browser.close();
