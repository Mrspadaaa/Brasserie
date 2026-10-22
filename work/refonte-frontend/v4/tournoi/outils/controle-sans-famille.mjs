// D100 (22.10, reprise du lot 21 ; leçon L14) : un houblon dont plus de la moitié des mots n'a
// pas de famille montre une part « autres » dessinée. Les mots du brasseur, sur l5f : « nelson
// sauvin est un houbon ordinaire alors que c'est un un houbon incroyable » ; « motueka est ultra
// fruité ». Cause chiffrée (cerveau/metier/descripteurs-hors-familles.md) : 10 des 12 mots de
// Nelson Sauvin (83 %) tombent hors des 12 familles (vin blanc, groseille à maquereau, raisin,
// sauvignon blanc) ; ils sortent du dessin et ne survivent que dans une ligne « sans famille : … »
// en petit, qui ne se lit pas comme une forme.
//
// Règle (au rendu, 390 px, tactile) :
//   - la part sans famille d'un houblon se calcule sur prototypes/houblons-v4/data/pack-fiches.json :
//     mots de motsSansFamille / (mots rattachés dans aromes[].mots + mots sans famille) ;
//   - les houblons MONTRÉS sont ceux dont le nom figure dans le texte visible de la page (au repos,
//     ou après la requête de --page=etat-b.html?fiche=Nelson%20Sauvin) ou qui portent
//     [data-houblon="<nom>"] ;
//   - pour chaque houblon montré à PLUS de 50 % sans famille, une part « autres » visible :
//     un élément [data-role="autres"] dans son [data-houblon="<nom>"] (ou portant lui-même
//     data-houblon="<nom>"), qui est une FORME dessinée : 24 × 6 px au moins, un fond (ou un
//     remplissage svg) opaque, NEUTRE (gris : écart entre canaux ≤ 30), ni hachuré (le hachuré
//     veut dire « inconnu » : pas de dégradé répété, pas de motif svg), ni à l'une des couleurs du
//     code des arômes ; nommé (aria-label ou texte « autres » / « sans famille » dans son bloc) ;
//     et, s'il porte data-part, une part dans ]0 ; part réelle + 0,10] (jamais gonflée).
//     Une ligne de texte en petit ne tient pas lieu de forme.
// BALISAGE IMPOSÉ aux lots suivants (convention) : data-houblon="<nom>" sur la carte ou la fiche
// d'un houblon ; data-role="autres" sur la forme de la part sans famille ; data-part="0,83" (point
// ou virgule) facultatif ; la liste des mots (concepts dédoublonnés, sans mots génériques) à côté.
// Un houblon absent de pack-fiches.json n'a pas de part calculable : il n'est pas jugé.
// Usage : node controle-sans-famille.mjs <dossier> [ids…] [--page=etat-b.html[?requête]] ; une ligne
// par page, puis « SANS-FAMILLE OK (<n> houblon(s) au-dessus de 50 %, part « autres » visible) »
// (code 0), ou « SANS-FAMILLE ECHEC n problème(s) » et la liste (code 1).
// Témoins : négatif l5f (fils18-baseline, etat-b.html : Nelson Sauvin 83 %, Hallertau Blanc 67 %,
// sans forme) ; positif temoins/sans-famille-ok.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pgArg = (args.find((a) => a.startsWith('--page=')) || '--page=etat.html').slice(7);
const [pg, requete = ''] = pgArg.split('?');
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();
const packPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../prototypes/houblons-v4/data/pack-fiches.json');
const fiches = JSON.parse(fs.readFileSync(packPath, 'utf8')).fichesHoublons;
const parts = fiches.map((h) => {
  const att = h.aromes.reduce((s, a) => s + a.mots.reduce((t, m) => t + m.mots.length, 0), 0);
  const sans = h.motsSansFamille.length;
  return { nom: h.name, cherche: h.name.replace(/\s*\(.*\)\s*$/, ''), total: att + sans, sans, part: att + sans ? sans / (att + sans) : 0 };
});
// Couleurs du code des arômes (base v4 : barres de y3).
const CODE = ['191,134,214', '63,138,95', '154,138,102', '217,180,20', '238,155,47', '232,141,104', '163,189,56', '155,63,116', '111,192,155', '47,107,95', '122,78,58', '106,163,58'];

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
const summary = [];

const analyser = ({ PARTS, CODE }) => {
  const vis = (e) => !!e && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0;
  const texte = document.body.innerText;
  const balises = [...document.querySelectorAll('[data-houblon]')].filter(vis).map((e) => e.getAttribute('data-houblon'));
  const rgb = (c) => { const m = c && c.match(/[\d.]+/g); return m ? m.map(Number) : null; };
  const echapper = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const montres = PARTS.filter((p) => new RegExp('(^|[^\\p{L}])' + echapper(p.cherche) + '(?![\\p{L}])', 'u').test(texte) || balises.some((b) => b === p.nom || b === p.cherche));
  const forme = (el) => {
    const cs = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    const f = [];
    if (b.width < 24 || b.height < 6) f.push('forme de ' + Math.round(b.width) + ' × ' + Math.round(b.height) + ' px (24 × 6 au moins)');
    const svgShape = el instanceof SVGElement;
    const couleur = svgShape ? cs.fill : cs.backgroundColor;
    const img = svgShape ? '' : cs.backgroundImage;
    const c = rgb(couleur);
    const alpha = c && c.length > 3 ? c[3] : couleur === 'none' || couleur === 'transparent' ? 0 : 1;
    if (/gradient|url\(/.test(img) || (svgShape && /url\(/.test(couleur))) f.push('part hachurée ou en motif : le hachuré veut dire « inconnu »');
    else if (!c || alpha < 0.3) f.push('pas de fond plein : ce n\'est pas une forme dessinée (texte seul ?)');
    else {
      const chroma = Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]);
      if (chroma > 30) f.push('couleur rgb(' + c.slice(0, 3).join(', ') + ') non neutre (gris attendu)');
      if (CODE.some((k) => { const q = k.split(',').map(Number); return Math.hypot(q[0] - c[0], q[1] - c[1], q[2] - c[2]) < 20; })) f.push('aux couleurs du code des arômes');
    }
    return f;
  };
  const rapport = montres.map((p) => {
    const conteneurs = [...document.querySelectorAll('[data-houblon]')].filter((e) => vis(e) && [p.nom, p.cherche].includes(e.getAttribute('data-houblon')));
    const autres = [];
    for (const c of conteneurs) { if (c.matches('[data-role="autres"]')) autres.push(c); c.querySelectorAll('[data-role="autres"]').forEach((x) => autres.push(x)); }
    for (const x of document.querySelectorAll('[data-role="autres"][data-houblon]')) if ([p.nom, p.cherche].includes(x.getAttribute('data-houblon')) && !autres.includes(x)) autres.push(x);
    const vus = autres.filter(vis);
    const fautes = [];
    let ok = false;
    if (p.part > 0.5) {
      if (!vus.length) fautes.push('« ' + p.nom + ' » (' + Math.round(100 * p.part) + ' % sans famille, ' + p.sans + ' mots sur ' + p.total + ') : aucune part « autres » visible' + (autres.length ? ' (balisée mais invisible)' : '') + ' ; ses mots sans famille ne sont qu\'une ligne de texte, ou rien');
      else {
        const e = vus[0];
        const f = forme(e);
        const nomme = (e.getAttribute('aria-label') || '') + ' ' + ((e.closest('[data-houblon]') || e.parentElement || e).innerText || '');
        if (!/autres|sans famille|non rattach/i.test(nomme)) f.push('part « autres » sans nom (aria-label, ou « autres » / « sans famille » dans le bloc)');
        const dp = parseFloat((e.getAttribute('data-part') || '').replace(',', '.'));
        if (e.hasAttribute('data-part') && (!(dp > 0) || dp > p.part + 0.1)) f.push('data-part=' + e.getAttribute('data-part') + ' : hors de ]0 ; ' + (p.part + 0.1).toFixed(2) + '] (part réelle ' + p.part.toFixed(2) + ')');
        for (const x of f) fautes.push('« ' + p.nom + ' » (' + Math.round(100 * p.part) + ' %) : ' + x);
        ok = f.length === 0;
      }
    }
    return { nom: p.nom, part: p.part, haut: p.part > 0.5, ok, fautes };
  });
  return { rapport, nBalises: balises.length };
};

for (const id of ids) {
  const file = path.join(dir, id, pg);
  if (!fs.existsSync(file)) { problems.push(id + ' ' + pg + ' : page absente'); console.log(id + ' · page absente'); continue; }
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(file).href + (requete ? '?' + requete : ''), { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
  const a = await page.evaluate(analyser, { PARTS: parts.map(({ nom, cherche, total, sans, part }) => ({ nom, cherche, total, sans, part })), CODE });
  await page.close();
  const hauts = a.rapport.filter((r) => r.haut);
  console.log(id + ' · ' + a.rapport.length + ' houblon(s) repéré(s) · ' + hauts.length + ' au-dessus de 50 % (' + (hauts.map((r) => r.nom + ' ' + Math.round(100 * r.part) + ' %' + (r.ok ? ' ✓' : ' ✗')).join(', ') || 'aucun') + ')');
  for (const r of hauts) for (const x of r.fautes) problems.push(id + ' ' + pg + ' : ' + x);
  for (const r of hauts) if (r.ok) summary.push(r.nom);
}
await browser.close();
if (problems.length) { console.log('SANS-FAMILLE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('SANS-FAMILLE OK (' + summary.length + ' houblon(s) au-dessus de 50 %, ' + (summary.length ? 'part « autres » visible' : 'rien à montrer') + ')');
