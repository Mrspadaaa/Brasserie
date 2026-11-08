// Test en ligne n° 50 : un article au « Niveau inconnu » (en stock, sans seuil) offre de fixer son seuil d'un toucher, qui mène au champ « Seuil minimum ».
// Fixture simulée par les vrais gestes (`?dev-local`) : « Nouvel article » → fiche → « Corriger l'inventaire » (+1 pas) → « Enregistrer l'écart » → fiche.
// Usage : node controle-50.mjs <build> <dossier captures> [clair|cave] [390|1280]   → SEUIL OK | SEUIL ECHEC <raisons>
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
await cliquerTexte(p, '^(Ajouter le premier article|Ajouter un article)$'); await dormir(1200);
await p.type('#new-stock-item', 'ZZ malt sans seuil', { delay: 10 }); await dormir(400);
await cliquerTexte(p, "^Créer l'article$"); await dormir(2500);
await p.keyboard.press('Escape'); await dormir(800);
const ouvrirFiche = () => p.evaluate(() => { const r = [...document.querySelectorAll('button, [role=button], a')].find((x) => /^ZZ malt sans seuil/.test(x.textContent.trim())); r?.click(); return !!r; });
if (!await ouvrirFiche()) raisons.push('article absent de la liste');
await dormir(1500);
if (!await cliquerTexte(p, '^Corriger l’inventaire$')) raisons.push('« Corriger l’inventaire » introuvable');
await dormir(1200);
await p.evaluate(() => { [...document.querySelectorAll('button')].filter((b) => /^Ajouter [\d,]+ /.test(b.getAttribute('aria-label') ?? '')).filter((b) => b.getBoundingClientRect().width > 0)[0]?.click(); });
await dormir(500);
if (!await cliquerTexte(p, '^Enregistrer l’écart$')) raisons.push('« Enregistrer l’écart » introuvable');
await dormir(2000);
await p.keyboard.press('Escape'); await dormir(800);
if (!await p.evaluate(() => [...document.querySelectorAll('button')].some((b) => /^Corriger l’inventaire$/.test(b.textContent.trim())))) { await ouvrirFiche(); await dormir(1500); }
const avant = await p.evaluate(() => ({ texte: document.body.innerText.match(/Stock actuel[^\n]*\n?[^\n]*/)?.[0]?.replace(/\n/g, ' ') ?? null, inconnu: /Niveau inconnu|inconnu/i.test(document.body.innerText) }));
await p.screenshot({ path: `${sortie}/c50-fiche-${theme}-${l}.png` });
const bouton = await cliquerTexte(p, '^(Niveau inconnu : )?fixer le seuil minimum$');
const double = (await p.evaluate(() => [...document.querySelectorAll('[role=dialog]')].at(-1)?.innerText.match(/Niveau inconnu/g)?.length ?? 0)) > 1;
if (double) raisons.push('« Niveau inconnu » écrit deux fois dans la fiche');
await dormir(800);
const focus = await p.evaluate(() => document.activeElement?.id ?? null);
await p.screenshot({ path: `${sortie}/c50-seuil-${theme}-${l}.png` });
console.log(JSON.stringify({ avant, bouton, focus }));
if (!bouton) raisons.push('aucun geste « Fixer le seuil minimum » sur la fiche');
else if (focus !== 'stock-min') raisons.push(`le geste ne mène pas au champ « Seuil minimum » (focus : ${focus})`);
await nav.close();
console.log(raisons.length ? `SEUIL ECHEC ${raisons.join(' ; ')}` : 'SEUIL OK');
