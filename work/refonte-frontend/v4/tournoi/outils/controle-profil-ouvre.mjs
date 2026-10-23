// D121 (23.10, soir, voie p13) : le profil de ma bière, sur l'étape Houblons, doit ouvrir l'analyse là où on le touche.
// Les mots du brasseur, sur le « › » noir à côté de « Résineux trop marqué » : « Seul bouton qui ouvre vraiment
// l'analyse. Peut, être amélioré ». Vérifié dans Chrome le 23.10 : seul ce « › » (44 × 36 px, sans mot) ouvre #/biere ;
// toucher l'alerte, une ligne des familles ou le bandeau IBU ne fait rien. La base v4.10 avait le même « › » : un
// plancher à enrichir.
// Règle, sur <dossier>/ma-biere/etat.html, 390 × 844 tactile ; la page est rechargée avant chaque toucher :
//   a) un toucher sur l'alerte (« … trop marqué ») ouvre #/biere ;
//   b) un toucher sur une ligne des familles (le nom d'une famille ; deux familles prises au hasard) ouvre #/biere ;
//   c) l'entrée dit où elle mène : un texte visible, dans le bloc du profil ou collé à lui (48 px au plus), contient
//      « analyse », « Ma bière » ou « détail ».
// Bloc du profil : [data-role="profil"] (la base : [data-role="panneau"]). Alerte : [data-role="alerte"], sinon le premier
// texte « trop… » ou « manque… » du bloc. Familles : les textes feuilles du bloc qui sont un des 12 noms de famille.
// Usage : node controle-profil-ouvre.mjs <dossier> [--page=index.html] [--seed=N]
//   page par défaut : <dossier>/ma-biere/etat.html, sinon <dossier>/etat.html.
// Sortie : PROFIL OK, ou PROFIL ECHEC et les lignes « - D121 … ».
// Témoins : maquette d332792c → ECHEC (seul le « › ») ; temoins/profil-chevron-seul → ECHEC ; temoins/profil-ouvre-ok → OK.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const opt = (n, d) => ((args.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3)) || d;
const pageArg = opt('page', '');
const fichier = pageArg ? path.join(dir, pageArg)
  : fs.existsSync(path.join(dir, 'ma-biere', 'etat.html')) ? path.join(dir, 'ma-biere', 'etat.html') : path.join(dir, 'etat.html');
const FAMILLES = ['Floral', 'Herbacé', 'Terreux', 'Agrumes', 'Tropicaux', 'Noyau', 'Pépins', 'Baies', 'Melon', 'Résineux', 'Épicé', 'Végétal'];
const attente = (ms) => new Promise((r) => setTimeout(r, ms));
// Hasard reproductible : --seed=N (par défaut, l'heure) ; la graine est imprimée pour rejouer un échec.
let graine = Number(opt('seed', String(Date.now() % 100000)));
const hasard = () => { graine = (graine * 1664525 + 1013904223) % 4294967296; return graine / 4294967296; };
const problems = [];
const infos = ['graine ' + opt('seed', String(graine))];
const fin = async (nav) => {
  if (nav) await nav.close();
  for (const x of infos) console.log(x);
  if (problems.length) { console.log('PROFIL ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('- D121 ' + x); process.exit(1); }
  console.log('PROFIL OK');
  process.exit(0);
};
if (!fs.existsSync(fichier)) { problems.push('page absente : ' + fichier); await fin(null); }
const navigateur = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const ouvrir = async () => {
  const page = await navigateur.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(fichier).href, { waitUntil: 'load', timeout: 30000 });
  await attente(1200);
  return page;
};
// Les cibles du profil, lues dans le rendu.
const lire = (page) => page.evaluate((FAM) => {
  const vis = (e) => { for (let x = e; x && x !== document.documentElement; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) <= 0.05) return false; } const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const bloc = [...document.querySelectorAll('[data-role="profil"], [data-role="panneau"]')].find(vis);
  if (!bloc) return null;
  const feuille = (e) => !e.children.length && e.textContent.trim();
  const feuilles = [...bloc.querySelectorAll('*')].filter((e) => vis(e) && feuille(e));
  const alerte = (document.querySelector('[data-role="alerte"]') && vis(document.querySelector('[data-role="alerte"]')) && bloc.contains(document.querySelector('[data-role="alerte"]')))
    ? [...document.querySelector('[data-role="alerte"]').querySelectorAll('*')].filter((e) => vis(e) && feuille(e) && /\p{L}{4,}/u.test(e.textContent)).pop() || document.querySelector('[data-role="alerte"]')
    : feuilles.find((e) => /(trop|manque)/i.test(e.textContent));
  const noms = feuilles.filter((e) => FAM.includes(e.textContent.trim()));
  noms.forEach((e, i) => e.setAttribute('data-d121-f', String(i)));
  if (alerte) alerte.setAttribute('data-d121-a', '1');
  const b = bloc.getBoundingClientRect();
  // Les textes visibles du bloc et ceux qui lui sont collés (48 px au plus au-dessus, au-dessous, ou à côté).
  const mots = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const t = n.textContent.replace(/\s+/g, ' ').trim();
    if (!t || !vis(n.parentElement)) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    const q = r.getBoundingClientRect();
    if (q.width < 1) continue;
    if (q.right > b.left - 48 && q.left < b.right + 48 && q.bottom > b.top - 48 && q.top < b.bottom + 48) mots.push(t);
  }
  return { alerte: alerte ? alerte.textContent.trim() : null, familles: noms.map((e) => e.textContent.trim()), texte: mots.join(' ') };
}, FAMILLES);
const toucher = async (page, sel) => {
  const c = await page.evaluate((s) => {
    const e = document.querySelector(s);
    if (!e) return null;
    e.scrollIntoView({ block: 'center' });
    const r = e.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, sel);
  if (!c) return null;
  await attente(200);
  const c2 = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
  await page.touchscreen.tap(c2.x, c2.y);
  await attente(700);
  return page.evaluate(() => location.hash);
};
const mene = (hash) => /^#\/biere(\b|\/|$)/.test(hash || '');
let page = await ouvrir();
const L = await lire(page);
if (!L) { problems.push('pas de bloc du profil visible ([data-role="profil"] ou [data-role="panneau"])'); await page.close(); await fin(navigateur); }
// c) l'entrée dit où elle mène.
if (!/analyse|ma bi[èe]re|d[ée]tail/i.test(L.texte)) problems.push('rien d\'écrit ne dit où mène le profil : aucun texte visible « analyse », « Ma bière » ou « détail » dans le bloc ou collé à lui (seul un « › » sans mot)');
infos.push('texte du bloc et alentours : « ' + L.texte.slice(0, 100) + ' »');
await page.close();
// a) l'alerte.
if (!L.alerte) problems.push('pas d\'alerte (« … trop marqué ») dans le bloc du profil à toucher');
else {
  page = await ouvrir();
  await lire(page);
  const h = await toucher(page, '[data-d121-a="1"]');
  infos.push('alerte « ' + L.alerte + ' » touchée → ' + (h === null ? '(cible introuvable)' : h || '(aucune adresse)'));
  if (!mene(h)) problems.push('toucher l\'alerte « ' + L.alerte + ' » n\'ouvre pas #/biere (adresse : ' + (h === null ? 'cible introuvable' : h || 'inchangée') + ')');
  await page.close();
}
// b) deux familles au hasard.
if (L.familles.length < 2) problems.push('moins de deux lignes de familles dans le bloc du profil (' + L.familles.length + ')');
else {
  const idx = L.familles.map((_, i) => i);
  const choisies = [];
  while (choisies.length < 2) choisies.push(idx.splice(Math.floor(hasard() * idx.length), 1)[0]);
  for (const i of choisies) {
    page = await ouvrir();
    await lire(page);
    const h = await toucher(page, '[data-d121-f="' + i + '"]');
    infos.push('famille « ' + L.familles[i] + ' » touchée → ' + (h === null ? '(cible introuvable)' : h || '(aucune adresse)'));
    if (!mene(h)) problems.push('toucher la ligne « ' + L.familles[i] + ' » n\'ouvre pas #/biere (adresse : ' + (h === null ? 'cible introuvable' : h || 'inchangée') + ')');
    await page.close();
  }
}
await fin(navigateur);
