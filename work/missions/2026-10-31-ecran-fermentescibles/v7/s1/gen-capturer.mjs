// Écrit v7/s1, s2, s3/capturer.mjs : la copie de v6/p6-b2/capturer.mjs (tous ses gestes rejoués, sa maquette lue telle quelle), plus
// les captures de la recherche (D220). Assemblage par split/join (L26). Usage : node gen-capturer.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { remplacer } from './commun-p7.mjs';
const ICI = path.dirname(fileURLToPath(import.meta.url));
let src = fs.readFileSync(path.resolve(ICI, '../../v6/p6-b2/capturer.mjs'), 'utf8');
const t0 = src.indexOf('import path');
src = `// Captures de p7 (D220 : « et maintenant la recherche, comment elle s'affiche ? Dans la liste ? »), variante du dossier (s1, s2, s3),
// copiée de v6/p6-b2. D'abord tous les gestes de p6-b2, rejoués tels quels (barre-masse D219, moment m1, part, couleur, retrait,
// détail, ajout à 0, doublon, « Créer », piste, 8 grains, 1280). Puis la recherche, à 390, le clavier du téléphone dessiné sur les
// 300 px du bas : l'ouverture (D221 : le champ touché, rien tapé, le stock de la famille), « mu », « Munich », « pils », « Abbey Malt » pendant (premier écran, et recadrée sur le champ et ses résultats) ;
// après le toucher sur Münchner Malz ; à 1280, « mu » pendant (sans clavier). Vérifie : le premier résultat et l'aperçu disent la même
// chose ; « Munich » → Münchner Malz ; « pils » → déjà 5,0 kg ; « Abbey Malt » → Créer ; Münchner ajouté prend sa teinte (15 EBC),
// la masse à zéro et le curseur dans sa masse ; rien de la recherche au repos.
// Imprime les mesures, puis CAPTURES OK ou CAPTURES ECHEC n.
` + src.slice(t0);
src = remplacer(src, "const out = (n) => path.join(ICI, `p6-b2-${n}.png`);", "const V = 'p7-' + path.basename(ICI);\nconst out = (n) => path.join(ICI, `${V}-${n}.png`);", 'sortie');
const RECH = `// RECHERCHE (D220), à 390.
const clavier = (on) => p.evaluate((on) => { let k = document.getElementById('p7-clavier'); if (!on) { if (k) k.remove(); return; }
  k = document.createElement('div'); k.id = 'p7-clavier'; k.setAttribute('aria-hidden', 'true');
  k.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:300px;z-index:99;pointer-events:none;background:repeating-linear-gradient(135deg,rgba(17,17,17,.14) 0 6px,rgba(17,17,17,.07) 6px 12px);border-top:2px solid rgba(17,17,17,.5);font:600 12px "IBM Plex Mono",monospace;color:#333;text-align:center;padding-top:8px';
  k.textContent = 'clavier du téléphone · 300 px'; document.body.appendChild(k); }, on);
const vus = () => p.evaluate(() => [...document.querySelectorAll('[data-role~="resultat"],[data-role~="creer"],[data-deja]')].filter((e) => e.getBoundingClientRect().width > 0)
  .map((e) => { const r = e.getBoundingClientRect(); return { nom: e.dataset.nom || '', deja: e.hasAttribute('data-deja'), creer: /creer/.test(e.dataset.role || ''), t: e.textContent.replace(/\\s+/g, ' ').trim(), haut: Math.round(r.top), bas: Math.round(r.bottom) }; }));
const zone = () => p.evaluate(() => { const els = [document.querySelector('.r4b-aj'), ...document.querySelectorAll('[data-role~="resultat"],[data-role~="creer"],[data-deja]')].filter((e) => e && e.getBoundingClientRect().width > 0);
  let h = 1e9, b = -1e9; for (const e of els) { const r = e.getBoundingClientRect(); h = Math.min(h, r.top); b = Math.max(b, r.bottom); }
  return { x: 0, y: Math.max(0, h - 14 + scrollY), width: innerWidth, height: Math.round(b - h + 28) }; });
const chercher = async (txt, souris) => { await p.goto(url); await pret(); if (souris) await p.click('[data-role="ajout"]'); else await p.tap('[data-role="ajout"]'); await p.keyboard.type(txt, { delay: 15 }); await pret(); };
const ap = () => p.evaluate(() => document.querySelector('[data-role="apercu"]').textContent.replace(/\\s+/g, ' ').trim());
await p.goto(url); await pret();
if ((await vus()).some((r) => r.creer || r.deja) || (await ap())) err.push('repos : la recherche se voit');
for (const [txt, nom] of [['', 'ouverture'], ['mu', 'mu'], ['Munich', 'munich'], ['pils', 'pils'], ['Abbey Malt', 'abbey']]) {
  await chercher(txt);
  const rs = await vus(), a = await ap();
  console.log(\`« \${txt} » : aperçu « \${a} » | \${rs.map((r) => r.t + ' @' + r.haut + '–' + r.bas).join(' | ')}\`);
  const prem = rs.find((r) => r.creer || r.nom);
  const offres = rs.filter((r) => !r.creer && !r.deja);
  if (!txt && offres.length < 3) err.push('ouverture : ' + offres.length + ' article(s)');
  for (const r of offres) if (!/en stock|stock épuisé/.test(r.t)) err.push('« ' + txt + ' » : sans stock « ' + r.t + ' »');
  if (txt === 'mu' && !/^Münchner/.test(prem?.nom || '')) err.push('mu : premier résultat ' + prem?.nom);
  if (txt === 'Munich' && (!/^Münchner/.test(prem?.nom || '') || !/Münchner/.test(a))) err.push('Munich : ' + prem?.nom + ' / aperçu ' + a);
  if (txt === 'pils' && !rs.some((r) => r.deja && /déjà 5,0 kg/.test(r.t))) err.push('pils : pas de « déjà 5,0 kg »');
  if (txt === 'Abbey Malt' && (!rs.some((r) => r.creer && /Créer « Abbey Malt »/.test(r.t)) || !/Abbey/.test(a))) err.push('Abbey Malt : ' + rs.map((r) => r.t).join(' | ') + ' / ' + a);
  for (const r of rs) if (r.bas > 844 - 300 || r.haut < 0) console.log(\`  sous le clavier ou hors vue : \${r.t} @\${r.haut}–\${r.bas}\`);
  await clavier(true); await p.screenshot({ path: out(nom + '-pendant') }); await clavier(false);
  await p.screenshot({ path: out(nom + '-zoom'), clip: await zone() });
  await brut(nom);
}
await chercher('mu');
const avantM = (await lignes()).length;
await p.tap('[data-role~="resultat"][data-nom="Münchner Malz"]'); await pret();
await clavier(true); await p.screenshot({ path: out('munchner-apres') }); await clavier(false);
L = await lignes(); const am = await actif();
const ebcM = await p.evaluate(() => { const li = [...document.querySelectorAll('[data-sel]')].find((x) => /Münchner/.test(x.textContent)); return li?.querySelector('[data-role="couleur-ligne"]')?.getAttribute('aria-label') || ''; });
console.log('Münchner après :', L.join(' | '), '|', am.l, '|', ebcM);
if (L.length !== avantM + 1 || L[L.length - 1] !== 'Münchner Malz ' || am.role !== 'kg-ligne' || !/Masse de Münchner Malz/.test(am.l || '') || !/15 EBC|15,0 EBC/.test(ebcM)) err.push('Münchner après : ' + L.join(' | ') + ' ' + am.l + ' ' + ebcM);
if ((await vus()).some((r) => r.creer || r.deja) || (await ap())) err.push('après : la recherche reste ouverte');
`;
src = remplacer(src, 'await p.setViewport({ width: 1280, height: 900 });', RECH + 'await p.setViewport({ width: 1280, height: 900 });', 'recherche');
src = remplacer(src, "if (ax.haut < 900) err.push('annexe dans le premier écran à 1280');",
  "if (ax.haut < 900) err.push('annexe dans le premier écran à 1280');\nawait chercher('mu', true); console.log('1280 « mu » :', (await vus()).map((r) => r.t).join(' | '), '| aperçu', await ap()); await p.screenshot({ path: out('1280-mu-pendant') });", '1280');
src = remplacer(src, String.raw`if (!/Créer « Mangue » · fruit : en fermentation, J\+3/.test(c)) err.push('créer : ' + c);`, String.raw`if (!/Créer « Mangue »[\s\S]*fruit : en fermentation, J\+3/.test(c)) err.push('créer : ' + c);`, 'créer');
for (const v of ['s1', 's2', 's3']) { fs.mkdirSync(path.resolve(ICI, '..', v), { recursive: true }); fs.writeFileSync(path.resolve(ICI, '..', v, 'capturer.mjs'), src); }
console.log('capturer.mjs écrit dans s1, s2, s3');
