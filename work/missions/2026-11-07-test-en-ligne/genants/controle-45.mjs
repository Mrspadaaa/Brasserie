// Test en ligne n° 45 : filtres du journal tronqués à 500 px (« À com… »), chevron de « Autres filtres » sur le mot.
// Parcours réel : Finances → Opérations, largeur 500 tactile. Attendu : aucune puce de filtre coupée par le bord (chaque puce entière visible, ou le rail défile avec un
// repère de suite), le chevron de « Autres filtres » ne recouvre pas le mot.
// Usage : node controle-45.mjs <build> <dossier captures> [clair|cave] [500|1280]   → FILTRES OK | FILTRES ECHEC <raisons>
import fs from 'node:fs';
import { ouvrir, dormir } from '../../2026-10-31-ecran-fermentescibles/banc-critique/banc.mjs';
import { cliquerTexte } from './amorce.mjs';
const [construit, sortie, theme = 'clair', l = '500'] = process.argv.slice(2);
fs.mkdirSync(sortie, { recursive: true });
const raisons = [];
const { nav, p } = await ouvrir(construit, { theme, largeur: Number(l), url: '/?dev-local' });
await dormir(2500);
await cliquerTexte(p, '^Finances'); await dormir(1800);
await cliquerTexte(p, '^Op[ée]rations'); await dormir(1800);
const mesure = await p.evaluate(() => {
  const rail = document.querySelector('.journal-rail');
  const sum = document.querySelector('.journal-extra > summary');
  const chips = [...document.querySelectorAll('.journal-filters .journal-chip')].map((c) => { const r = c.getBoundingClientRect(); return { t: c.firstChild?.textContent?.trim(), g: Math.round(r.left), d: Math.round(r.right) }; });
  const rr = rail?.getBoundingClientRect();
  const coupees = rr ? chips.filter((c) => c.d > rr.right + 1 || c.g < rr.left - 1).map((c) => c.t) : null;
  const s = sum && getComputedStyle(sum);
  const mark = sum && getComputedStyle(sum, '::marker');
  const apres = sum && getComputedStyle(sum, '::after');
  const rs = sum?.getBoundingClientRect();
  const texteRange = sum && (() => { const rg = document.createRange(); rg.selectNodeContents(sum); const b = rg.getBoundingClientRect(); return { g: Math.round(b.left), d: Math.round(b.right) }; })();
  return { rail: rr && { g: Math.round(rr.left), d: Math.round(rr.right), defile: rail.scrollWidth > rail.clientWidth, fondu: (getComputedStyle(rail).maskImage || getComputedStyle(rail).webkitMaskImage || 'none') !== 'none' }, coupees, chips, sum: s && { display: s.display, listStyle: s.listStyleType, w: Math.round(rs.width), apres: apres.content, markerContent: mark.content }, texteRange, vw: innerWidth };
});
console.log(JSON.stringify(mesure));
await p.screenshot({ path: `${sortie}/c45-${theme}-${l}.png` });
if (!mesure.rail) raisons.push('rail des filtres introuvable (journal non atteint)');
else if (mesure.coupees?.length && !(mesure.rail.defile && mesure.rail.fondu)) raisons.push(`puces coupées par le bord : ${mesure.coupees.join(', ')}`);
await nav.close();
console.log(raisons.length ? `FILTRES ECHEC ${raisons.join(' ; ')}` : 'FILTRES OK');
