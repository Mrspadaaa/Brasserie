// Contrôle du lot 12 (#140, 19.10, soir) : les carrés d'arômes d'un houblon, expliqués au long appui.
// Les mots du brasseur : « On va refaire un batch de description de houblons, et notamment montrer à
// quoi correspond exactement ces valeurs facile lors du long appuie sur le houblons » (capture : les
// carrés de la carte Motueka entourés).
// Convention auteur, deux pages par variante : <id>/vue.html (au repos) et <id>/appui.html (le long
// appui sur Motueka, montré ouvert). Sur la carte : data-houblon="beermaverick-motueka" ; les carrés
// [data-role="aromes"] [data-famille][data-niveau] (0, 1, 2). Au long appui : [data-role="appui"]
// visible, et pour chaque famille citée ou marquée de Motueka un [data-explique="<famille>"].
// Règles :
//   A1 au repos, rien n'explique les carrés : pas de [data-role="appui"] visible, ni « marqué »,
//      « cité » ou « non décrit » écrits (pas de légende) ;
//   A2 au long appui, chaque famille citée ou marquée dit son nom, son niveau (marqué, cité) et ses
//      fiches (« 2 fiches sur 2 », ou le nom des sources) ;
//   A3 le non décrit se dit « non décrit » (D65 : jamais zéro) ;
//   A4 l'appui dit que ce sont des citations des fiches (« fiche » ou « source » écrit) ;
//   A5 les carrés de Motueka portent les niveaux du pack (pack-fiches.json).
// Usage : node controle-appui.mjs <dossier du lot> [ids…]   Imprime APPUI OK, ou APPUI ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../../../../..');
const FICHES = JSON.parse(fs.readFileSync(path.join(root, 'prototypes/houblons-v4/data/pack-fiches.json'), 'utf8')).fichesHoublons;
const MOT = FICHES.find((f) => f.key === 'beermaverick-motueka');
const COURT = { citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', floral: 'Floral', green: 'Végétal', herbal: 'Herbacé', spice: 'Épicé', earthy: 'Terreux', resin: 'Résineux' };
const dir = path.resolve(process.argv[2] || '.');
const only = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => /^[a-z]+\d+$/.test(d) && fs.existsSync(path.join(dir, d, 'vue.html')))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
const lire = async (f) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(f).href, { waitUntil: 'networkidle0', timeout: 30000 });
  const r = await page.evaluate(() => {
    const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.15; };
    const carte = document.querySelector('[data-houblon="beermaverick-motueka"]');
    const cases = carte ? [...carte.querySelectorAll('[data-role="aromes"] [data-famille]')].map((c) => ({ f: c.dataset.famille, n: Number(c.dataset.niveau) })) : null;
    const appui = [...document.querySelectorAll('[data-role="appui"]')].filter(vis);
    const explique = Object.fromEntries([...document.querySelectorAll('[data-explique]')].filter(vis).map((e) => [e.dataset.explique, e.innerText.replace(/\s+/g, ' ').trim()]));
    // La légende se cherche sur les cartes des houblons (« Boisé et résineux trop marqué », plus bas, est le goût de ma bière).
    const texte = [...document.querySelectorAll('[data-houblon]')].filter(vis).map((e) => e.innerText).join(' ');
    return { carte: !!carte, cases, appui: appui.length, appuiTexte: appui.map((a) => a.innerText).join(' ').replace(/\s+/g, ' '), explique, legende: /(^|[^\p{L}])(marqué|cité|non décrit)(?!\p{L})/iu.test(texte) };
  });
  await page.close();
  return r;
};
for (const id of ids) {
  const p = (m) => problems.push(id + ' : ' + m);
  const vue = path.join(dir, id, 'vue.html'), app = path.join(dir, id, 'appui.html');
  if (!fs.existsSync(app)) { p('pas de page appui.html (le long appui sur Motueka, montré ouvert)'); continue; }
  const r = await lire(vue), a = await lire(app);
  for (const [nom, x] of [['vue', r], ['appui', a]]) {
    if (!x.carte) { p(nom + ' : pas de carte data-houblon="beermaverick-motueka"'); continue; }
    if (!x.cases || x.cases.length < 12) p(nom + ' : les carrés de Motueka ne portent pas data-famille et data-niveau (' + (x.cases ? x.cases.length : 0) + ' sur 12)');
    else for (const ar of MOT.aromes) { const c = x.cases.find((y) => y.f === ar.family); if (!c || c.n !== ar.level) p(nom + ' : A5, ' + ar.name + ' au niveau ' + (c ? c.n : '?') + ' au lieu de ' + ar.level + ' (' + ar.label + ')'); }
  }
  if (r.appui) p('A1 : au repos, l\'explication est déjà ouverte');
  if (r.legende) p('A1 : au repos, « marqué », « cité » ou « non décrit » est écrit (une légende)');
  if (!a.appui) p('A2 : au long appui, pas d\'explication visible ([data-role="appui"])');
  for (const ar of MOT.aromes.filter((x) => x.level > 0)) {
    const t = a.explique[ar.family];
    if (!t) { p('A2 : au long appui, ' + ar.name + ' (' + ar.label + ') n\'est pas expliqué ([data-explique="' + ar.family + '"])'); continue; }
    if (!t.toLowerCase().includes(COURT[ar.family].toLowerCase()) && !t.toLowerCase().includes(ar.name.toLowerCase())) p('A2 : ' + ar.family + ' expliqué sans son nom (« ' + t.slice(0, 40) + ' »)');
    if (!t.includes(ar.label)) p('A2 : ' + ar.name + ' expliqué sans son niveau « ' + ar.label + ' »');
    if (!(new RegExp(ar.sources + '\\s*(fiches?|sources?)?\\s*sur\\s*' + ar.of).test(t) || ar.authors.every((n) => t.includes(n)))) p('A2 : ' + ar.name + ' expliqué sans ses fiches (« ' + ar.sources + ' sur ' + ar.of + ' » ou ' + ar.authors.join(', ') + ')');
  }
  if (!/non décrit/i.test(a.appuiTexte)) p('A3 : au long appui, le non décrit n\'est pas dit « non décrit »');
  if (!/fiche|source/i.test(a.appuiTexte)) p('A4 : au long appui, rien ne dit que ce sont des citations des fiches');
  console.log(id + ' · appui contrôlé');
}
await browser.close();
if (problems.length) { console.log('APPUI ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); }
else console.log('APPUI OK ' + ids.length + '/' + ids.length);
