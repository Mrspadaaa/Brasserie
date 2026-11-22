// Test en ligne n° 48 : le menu « + » et les boutons de la barre du bas ont un nom accessible (arbre d'accessibilité de Chrome, pas le texte du DOM).
// Usage : node controle-48.mjs <build> <dossier captures> [clair|cave] [390|1280]   → NOMS OK | NOMS ECHEC <raisons>
import fs from 'node:fs';
import { ouvrir, dormir } from '../../2026-10-31-ecran-fermentescibles/banc-critique/banc.mjs';
import { cliquerTexte } from './amorce.mjs';
const [construit, sortie, theme = 'clair', l = '390'] = process.argv.slice(2);
fs.mkdirSync(sortie, { recursive: true });
const raisons = [];
const { nav, p } = await ouvrir(construit, { theme, largeur: Number(l), url: '/?dev-local' });
await dormir(2500);
const aplatir = (n, sortieListe = []) => { sortieListe.push(n); (n.children ?? []).forEach((c) => aplatir(c, sortieListe)); return sortieListe; };
const noeuds = async (racineSel) => {
  const h = await p.$(racineSel);
  const snap = await p.accessibility.snapshot({ root: h, interestingOnly: false });
  return aplatir(snap).filter((n) => ['button', 'menuitem', 'link'].includes(n.role));
};
const barre = await noeuds('nav[aria-label="Navigation principale"]');
console.log('barre', JSON.stringify(barre.map((n) => [n.role, n.name])));
for (const n of barre) if (!n.name?.trim()) raisons.push(`barre du bas : ${n.role} sans nom`);
await cliquerTexte(p, '^Actions rapides'); await dormir(1000);
await p.screenshot({ path: `${sortie}/c48-${theme}-${l}.png` });
const snap = await p.accessibility.snapshot({ interestingOnly: false });
const menu = aplatir(snap).filter((n) => n.role === 'menuitem' || (n.role === 'button' && /Nouvelle|Entrer|Encaisser|Cr[ée]er|Lancer/.test(n.name ?? '')));
console.log('menu', JSON.stringify(menu.map((n) => [n.role, n.name])));
const items = await p.evaluate(() => [...document.querySelectorAll('[role=menuitem]')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.textContent.trim().length));
if (items.length && menu.filter((n) => n.role === 'menuitem').length !== items.length) raisons.push('menuitem manquant dans l\'arbre');
for (const n of menu.filter((x) => x.role === 'menuitem')) if (!n.name?.trim()) raisons.push('menuitem sans nom accessible');
await nav.close();
console.log(raisons.length ? `NOMS ECHEC ${[...new Set(raisons)].join(' ; ')}` : 'NOMS OK');
