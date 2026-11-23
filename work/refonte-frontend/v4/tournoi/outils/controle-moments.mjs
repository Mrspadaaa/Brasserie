// D78 (19.10, soir) : les moments du brassin et le passage à Comparer, sur la liste des voies. Les mots
// du brasseur, sur p4 du lot 15 : « vachement bien. manque peut être dry hop, bio transfo, levure. et
// la panier, à la place plutôt un + qui ajoute le houblon à la comparaison ».
// Règle, sur la page des voies (sans rien toucher, défilement permis) :
//   M1 chaque moment présent dans les voies du cas (60′, 10′, whirlpool, dry hop, levure) a au moins
//      une voie visible ([data-voie], numéro = place dans voies du cas) ;
//   M2 chaque voie visible avec un dry hop en fermentation active montre sa biotransformation
//      ([data-role="bio"] visible dedans), si le moteur en cite un signal « possible » ;
//   M3 chaque voie visible porte son « + » vers Comparer ([data-role="ajouter-comparer"] visible
//      dedans), et la page a son passage à Comparer ([data-role="comparer"]).
// Le cas : <html data-cas="c1"> (donnees/<cas>.json du lot 15).
// Usage : node controle-moments.mjs <dossier> [ids…] [--page=etat-b.html] [--donnees=<dossier>] ;
// imprime MOMENTS OK, ou MOMENTS ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k) => { const a = args.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pg = opt('page') || 'etat-b.html';
const donnees = path.resolve(opt('donnees') || path.join(ici, '../../ecran-1/fils15-s5-complexe/donnees'));
const GROUPE = { b60: '60′', b10: '10′', wp: 'whirlpool', dryActive: 'dry hop', dryPost: 'dry hop' };
// « levure » : un changement de souche ; le dry hop en fermentation active (levier levure du moteur)
// est un dry hop pour le brasseur.
const groupes = (v) => (v.levureVers ? ['levure'] : [...new Set(v.actions.map((a) => GROUPE[a.momentId]).filter(Boolean))]);
const bioPossible = (v) => (v.bio || []).some((b) => /active/.test(b.moment) && b.signaux.some((s) => s.statut === 'possible'));

const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) {
  const f = path.join(dir, id, pg);
  if (!fs.existsSync(f)) continue;
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(f).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const r = await page.evaluate(() => {
    const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity !== 0; };
    const dans = (e, role) => [...e.querySelectorAll('[data-role="' + role + '"]')].some(vis);
    return { cas: document.documentElement.dataset.cas || document.body.dataset.cas || null,
      voies: [...document.querySelectorAll('[data-voie]')].filter(vis).map((e) => ({ n: +e.dataset.voie, bio: dans(e, 'bio'), plus: dans(e, 'ajouter-comparer') })),
      comparer: [...document.querySelectorAll('[data-role="comparer"]')].some(vis) };
  });
  await page.close();
  const p = (m) => problems.push(id + ' ' + pg + ' : ' + m);
  if (!r.cas) { p('pas de data-cas'); continue; }
  const d = JSON.parse(fs.readFileSync(path.join(donnees, r.cas + '.json'), 'utf8'));
  const tous = new Set(d.voies.flatMap(groupes));
  const vus = new Map();
  for (const v of r.voies) {
    const voie = d.voies[v.n - 1];
    if (!voie) { p('voie ' + v.n + ' absente du cas ' + r.cas); continue; }
    for (const g of groupes(voie)) vus.set(g, true);
    if (bioPossible(voie) && !r.voies.some((x) => x.n === v.n && x.bio)) p('M2, voie ' + v.n + ' (dry hop en fermentation active) sans biotransformation visible');
  }
  for (const g of tous) if (!vus.has(g)) p('M1, aucune voie « ' + g + ' » visible sans toucher');
  const sansPlus = [...new Set(r.voies.filter((v) => !r.voies.some((x) => x.n === v.n && x.plus)).map((v) => v.n))];
  if (sansPlus.length) p('M3, ' + sansPlus.length + ' voie(s) sans « + » vers Comparer (' + sansPlus.slice(0, 6).join(', ') + (sansPlus.length > 6 ? '…' : '') + ')');
  if (!r.comparer) p('M3, pas de passage à Comparer ([data-role="comparer"])');
  console.log(id + ' · cas ' + r.cas + ' · moments du cas : ' + [...tous].join(', ') + ' · visibles : ' + [...vus.keys()].join(', ') + ' · ' + new Set(r.voies.map((v) => v.n)).size + ' voie(s) visibles');
}
await browser.close();
if (problems.length) { console.log('MOMENTS ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('MOMENTS OK');
