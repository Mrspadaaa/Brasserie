// Test en ligne n° 49 : le badge Stocks de la barre du bas compte comme l'onglet Stocks (« À commander »), pas « stock ≤ seuil » avec un seuil vide.
// Fixture simulée par le vrai geste : Stocks → « Ajouter un article » → « ZZ malt sans seuil » → « Créer l'article » (stock 0, seuil vide, comme 14 des 26 du test).
// Attendu : badge = « À commander » de Stocks (0 ici : un article sans seuil est « à définir », pas à commander).
// Usage : node controle-49.mjs <build> <dossier captures> [clair|cave] [390|1280]   → BADGE OK | BADGE ECHEC <raisons>
import fs from 'node:fs';
import { ouvrir, dormir } from '../../2026-10-31-ecran-fermentescibles/banc-critique/banc.mjs';
import { cliquerTexte } from './amorce.mjs';
const [construit, sortie, theme = 'clair', l = '390'] = process.argv.slice(2);
fs.mkdirSync(sortie, { recursive: true });
const raisons = [];
const { nav, p } = await ouvrir(construit, { theme, largeur: Number(l), url: '/?dev-local' });
for (let i = 0; i < 20 && !await p.$('button[aria-label="Menu"]'); i++) await dormir(500);
await dormir(1000);
await cliquerTexte(p, '^Stocks'); await dormir(2000);
if (!await cliquerTexte(p, '^(Ajouter le premier article|Ajouter un article)$')) raisons.push('« Ajouter un article » introuvable');
await dormir(1200);
await p.type('#new-stock-item', 'ZZ malt sans seuil', { delay: 10 });
await dormir(400);
if (!await cliquerTexte(p, "^Créer l'article$")) raisons.push('« Créer l\'article » introuvable');
await dormir(2500);
await p.keyboard.press('Escape'); await dormir(800);
const badge = await p.evaluate(() => {
  const b = [...document.querySelectorAll('nav button, nav a')].find((x) => /^Stocks/.test(x.getAttribute('aria-label') ?? x.textContent.trim()));
  const m = (b?.getAttribute('aria-label') ?? '').match(/(\d+) articles? au seuil/);
  return m ? Number(m[1]) : 0;
});
const texte = await p.evaluate(() => document.body.innerText);
const m = texte.match(/À commander\s*·?\s*(\d+)/);
const stocks = m ? Number(m[1]) : 0;
// La pastille du sous-onglet « Stock » (« Stock (1) » ou « Stock 1 ») : 3e compte vu le 08.11, ruptures au-dessus de « À commander · 0 ».
const pastille = await p.evaluate(() => {
  const vue = [...document.querySelectorAll('button, option, [role=tab]')].find((x) => /^Stock\s*\(?\d*\)?$/.test(x.textContent.replace(/\s+/g, ' ').trim()));
  const n = vue?.textContent.replace(/\s+/g, ' ').trim().match(/^Stock\s*\(?(\d+)\)?/);
  return n ? Number(n[1]) : 0;
});
await p.screenshot({ path: `${sortie}/c49-stocks-${theme}-${l}.png` });
if (pastille !== stocks) raisons.push(`pastille « Stock » ${pastille} ≠ « À commander » ${stocks}`);
console.log(JSON.stringify({ badge, stocks, pastille, aCommander: m?.[0] ?? null, article: (texte.match(/ZZ malt sans seuil[^\n]*(\n[^\n]*){0,2}/) ?? [''])[0].replace(/\n/g, ' · ') }));
if (!/ZZ malt sans seuil/.test(texte)) raisons.push('article « ZZ malt sans seuil » absent de Stocks');
if (badge !== stocks) raisons.push(`badge ${badge} ≠ Stocks « À commander » ${stocks}`);
await nav.close();
console.log(raisons.length ? `BADGE ECHEC ${raisons.join(' ; ')}` : 'BADGE OK');
