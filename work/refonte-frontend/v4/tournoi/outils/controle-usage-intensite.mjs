// D80 (19.10, soir) : l'intensité de chaque saveur et l'usage de chaque houblon, sur chaque voie. Les
// mots du brasseur, sur p4 du lot 15 : « mieux afficher l'intensité des saveur comme sur p5 s4, aussi le
// type de houbon pour son usage, mixte, amérisant, aromatique ect. des petit mini info dessus ( type pico
// ou autre, pas surchargé) ».
// Règle, pour chaque voie visible ([data-voie], numéro = place dans voies du cas) :
//   I1 chaque famille que la voie fait bouger (tout, 0,5 point au moins), objectif ou extra, montre
//      son intensité : un élément visible dans la voie avec data-famille et data-crans, à 0,6 cran
//      au plus des crans du moteur ;
//   U1 chaque houblon ajouté ou changé (fiches) montre son usage : [data-role="usage"] visible, avec
//      data-usage (amérisant, aromatique, double, ou inconnu si le moteur ne le sait pas) et
//      data-source (fournisseur, ou règle quand c'est la règle rôle-α encore à valider), comme le
//      moteur (hopRole).
// Le cas : <html data-cas="c1">. Usage : node controle-usage-intensite.mjs <dossier> [ids…]
// [--page=etat-b.html] [--donnees=<dossier>] ; imprime USAGE-INTENSITE OK, ou … ECHEC et la liste.
//
// MODE --parcours (23.10, mission controles-parcours, voie c2) : la maquette jouable calcule en direct, sans cas
// figé. Appel : node controle-usage-intensite.mjs <dossier> <route…> --page=etat.html --parcours
// (<dossier>/<route>/etat.html, contrat de prototypes/houblons-v4/parcours/ARCHITECTURE.md). Le moteur est lu par
// window.__parcours : etat.recette, moteur (lireBiere, suggerer, style) et regles.hopRole. Rien de ce que l'écran
// déclare de lui-même ne sert d'attendu.
//   U1 (toute route) : chaque [data-role="usage"] visible appartient à un houblon. Sa clé est celle du plus proche
//      ancêtre (lui compris) portant data-houblon-ligne, data-candidat, data-col ou data-houblon (la valeur de
//      data-houblon doit être une clé du moteur). data-usage = regles.hopRole(clé).value, ou « inconnu » ;
//      data-source = « fournisseur » ou « règle » (D80), jamais la forme longue de hopRole ; chaque
//      [data-role="ligne-houblon"] visible montre son usage.
//   I1 (routes qui ont des [data-voie]) : chaque famille que la voie fait bouger de 0,5 point au moins montre
//      [data-famille][data-crans] à 0,6 cran au plus du moteur. La table TABLE_I1 (dans la page) dit, par route
//      (body data-route), comment calculer l'attendu : une route à voies sans entrée est un problème.
// Une page où rien n'est lu (ni voie ni usage), ou où aucune famille ne bouge, est un problème, jamais un OK.
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
const ids = (only.length ? [...only] : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();
if (args.includes('--parcours')) {
  const sortie = await jouerParcours();
  process.exit(sortie ? 0 : 1);
}
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, pg)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const r = await page.evaluate(() => {
    const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    return { cas: document.documentElement.dataset.cas || document.body.dataset.cas || null,
      voies: [...document.querySelectorAll('[data-voie]')].filter(vis).map((e) => ({ n: +e.dataset.voie,
        crans: [...e.querySelectorAll('[data-famille][data-crans]')].filter(vis).map((x) => ({ f: x.dataset.famille, c: parseFloat(String(x.dataset.crans).replace(',', '.')) })),
        usages: [...e.querySelectorAll('[data-role="usage"]')].filter(vis).map((x) => ({ u: x.dataset.usage || '', s: x.dataset.source || '', h: x.dataset.houblon || '' })) })) };
  });
  await page.close();
  const p = (m) => problems.push(id + ' ' + pg + ' : ' + m);
  if (!r.cas) { p('pas de data-cas'); continue; }
  const d = JSON.parse(fs.readFileSync(path.join(donnees, r.cas + '.json'), 'utf8'));
  const par = new Map();
  for (const v of r.voies) { const o = par.get(v.n) || { crans: [], usages: [] }; o.crans.push(...v.crans); o.usages.push(...v.usages); par.set(v.n, o); }
  let manqueI = 0, manqueU = 0;
  for (const [n, o] of par) {
    const voie = d.voies[n - 1];
    if (!voie) { p('voie ' + n + ' absente du cas'); continue; }
    for (const t of voie.tout.filter((x) => Math.abs(x.effet) >= 0.5 && x.crans != null)) {
      const vu = o.crans.filter((x) => x.f === t.famille);
      if (!vu.length) { manqueI++; if (manqueI <= 8) p('I1, voie ' + n + ' : intensité de ' + t.nom + ' absente (' + t.crans + ' cran)'); }
      else if (!vu.some((x) => Math.abs(x.c - t.crans) <= 0.6)) p('I1, voie ' + n + ' : ' + t.nom + ' à ' + vu.map((x) => x.c).join('/') + ' cran, le moteur dit ' + t.crans);
    }
    for (const h of voie.fiches) {
      const attendu = h.role || 'inconnu', src = /^fournisseur/.test(h.roleSource) ? 'fournisseur' : 'règle';
      const vu = o.usages.filter((x) => !x.h || x.h === h.houblon);
      if (!vu.length) { manqueU++; if (manqueU <= 8) p('U1, voie ' + n + ' : usage de ' + h.houblon + ' absent (' + attendu + ', ' + src + ')'); }
      else if (!vu.some((x) => x.u === attendu && x.s === src)) p('U1, voie ' + n + ' : ' + h.houblon + ' montré ' + vu.map((x) => x.u + '/' + x.s).join(', ') + ', le moteur dit ' + attendu + '/' + src);
    }
  }
  if (manqueI > 8) p('I1 : ' + (manqueI - 8) + ' intensité(s) absente(s) de plus');
  if (manqueU > 8) p('U1 : ' + (manqueU - 8) + ' usage(s) absent(s) de plus');
  console.log(id + ' · ' + par.size + ' voie(s) visibles');
}
await browser.close();
if (problems.length) { console.log('USAGE-INTENSITE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('USAGE-INTENSITE OK');

// ---------- Mode --parcours ----------
// Les faits sont lus dans la page (moteur en direct) ; le jugement et les messages sont ici. La fonction passée à
// page.evaluate est sérialisée : aucune variable du module dedans.
function lireParcours() {
  const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const P = window.__parcours;
  const route = document.body.dataset.route || location.hash.replace(/^#\//, '').split(/[?/]/)[0];
  // Attributs qui désignent un houblon (U1), du plus proche ancêtre, lui compris. data-col : la colonne de Comparer.
  const CLES = '[data-houblon-ligne],[data-candidat],[data-col],[data-houblon]';
  const cleDe = (e) => { const k = e.closest(CLES); return k ? (k.dataset.houblonLigne || k.dataset.candidat || k.dataset.col || k.dataset.houblon) : null; };
  const attenduUsage = (cle) => { const r = P.regles.hopRole(cle); return { u: r.value ?? 'inconnu', s: /^fournisseur/.test(r.source || '') ? 'fournisseur' : 'règle', brut: r.source || '' }; };
  // I1 : par route, ce que la voie fait bouger (au moins 0,5 point), et le cran que le moteur en donne.
  const TABLE_I1 = {
    // Ma bière : data-voie = id de l'ajout. Attendu = le profil de la bière avec l'ajout, moins sans lui ; le cran
    // est la position de la bière au style (profil[f].crans, que le moteur tire de regles.cransOf).
    'ma-biere': (el) => {
      const r = P.etat.recette, a = r.additions.find((x) => x.id === el.dataset.voie);
      if (!a) return { erreur: 'ajout ' + el.dataset.voie + ' absent de la recette' };
      const b = P.moteur.lireBiere(r), sans = P.moteur.lireBiere({ ...r, additions: r.additions.filter((x) => x.id !== a.id) });
      const out = [];
      for (const f of Object.keys(b.profil)) {
        const x = b.profil[f].valeur, y = sans.profil[f].valeur, c = b.profil[f].crans;
        if (!x || !y || c == null || Math.abs(x.centre - y.centre) < 0.5) continue;
        out.push({ f, crans: c });
      }
      return { familles: out };
    },
    // Suggérer : data-voie = rang, data-candidat = clé. Attendu = l'écart simulé du candidat (suggerer, visée
    // floral, la seule de la maquette) divisé par le cran du style : un gain en crans, pas une position.
    suggerer: (el) => {
      const r = P.etat.recette, sc = P.moteur.style(r.styleCode), cs = P.moteur.suggerer(r, 'floral');
      const c = cs.find((x) => x.cle === el.dataset.candidat);
      if (!c) return { erreur: 'candidat ' + el.dataset.candidat + ' absent de suggerer(floral)' };
      return { familles: Object.entries(c.lu.ecart).filter(([, e]) => e && Math.abs(e.centre) >= 0.5).map(([f, e]) => ({ f, crans: e.centre / sc.families[f].cran })) };
    },
  };
  const table = TABLE_I1[route];
  const voies = [...document.querySelectorAll('[data-voie]')].filter(vis).map((el) => {
    let attendu = null;
    if (table) { try { attendu = table(el); } catch (e) { attendu = { erreur: String((e && e.message) || e) }; } }
    return { id: el.dataset.voie, cle: el.dataset.candidat || el.dataset.houblonLigne || null, attendu,
      crans: [...el.querySelectorAll('[data-famille][data-crans]')].filter(vis).map((x) => ({ f: x.dataset.famille, c: parseFloat(String(x.dataset.crans).replace(',', '.')) })) };
  });
  const usages = [...document.querySelectorAll('[data-role="usage"]')].filter(vis).map((x) => {
    const cle = cleDe(x);
    return { cle, u: x.dataset.usage || '', s: x.dataset.source || '', attendu: cle ? attenduUsage(cle) : null };
  });
  const lignes = [...document.querySelectorAll('[data-role="ligne-houblon"]')].filter(vis).map((l) => ({ cle: cleDe(l), usage: [...l.querySelectorAll('[data-role="usage"]')].some(vis) }));
  return { route, aTable: !!table, voies, usages, lignes };
}

async function jouerParcours() {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const problems = [];
  const r2 = (n) => Math.round(n * 100) / 100;
  // L'ordre donné sur la ligne de commande est gardé (les ids ne sont triés que sans liste explicite).
  for (const id of only.length ? only : ids) {
    const p = (m) => problems.push(id + ' · ' + m);
    const fichier = path.join(dir, id, pg);
    if (!fs.existsSync(fichier)) { p('page absente : ' + fichier); continue; }
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.goto(pathToFileURL(fichier).href, { waitUntil: 'networkidle0', timeout: 30000 });
    let r = null;
    try {
      await page.waitForFunction(() => !!window.__parcours, { timeout: 8000 });
      await new Promise((x) => setTimeout(x, 400));
      r = await page.evaluate(lireParcours);
    } catch (e) { p('window.__parcours illisible : ' + String(e.message || e).split('\n')[0]); }
    await page.close();
    if (!r) continue;
    let nI = 0, manqueI = 0, ecartI = 0, manqueU = 0, fauxU = 0, srcU = 0;
    // U1
    for (const u of r.usages) {
      if (!u.cle || !u.attendu) { p('U1 usage : un usage sans houblon (aucun data-houblon-ligne, data-candidat, data-col ou data-houblon autour), « ' + u.u + ' »'); continue; }
      if (u.u !== u.attendu.u) { fauxU++; if (fauxU <= 8) p('U1 usage : ' + u.cle + ' montré « ' + u.u + ' », le moteur dit « ' + u.attendu.u + ' »'); }
      if (!['fournisseur', 'règle'].includes(u.s)) { srcU++; if (srcU <= 8) p('U1 source : ' + u.cle + ' data-source « ' + u.s + ' » : D80 veut « fournisseur » ou « règle », pas la forme longue ou un autre mot'); }
      else if (u.s !== u.attendu.s) { srcU++; if (srcU <= 8) p('U1 source : ' + u.cle + ' montré « ' + u.s + ' », le moteur dit « ' + u.attendu.s + ' »'); }
    }
    for (const l of r.lignes) if (!l.usage) { manqueU++; if (manqueU <= 8) p('U1 usage : la ligne de ' + (l.cle || 'houblon sans clé') + ' ne montre pas son usage'); }
    if (fauxU > 8) p('U1 usage : ' + (fauxU - 8) + ' usage(s) faux de plus');
    if (srcU > 8) p('U1 source : ' + (srcU - 8) + ' source(s) fausses de plus');
    if (manqueU > 8) p('U1 usage : ' + (manqueU - 8) + ' ligne(s) sans usage de plus');
    // I1
    if (r.voies.length && !r.aTable) p('I1 table : la route « ' + r.route + ' » a ' + r.voies.length + ' voie(s) et aucune entrée dans la table I1 du contrôle');
    if (r.voies.length && r.aTable) {
      for (const v of r.voies) {
        if (v.attendu.erreur) { p('I1 table : voie ' + v.id + ' : ' + v.attendu.erreur); continue; }
        for (const t of v.attendu.familles) {
          nI++;
          const vus = v.crans.filter((x) => x.f === t.f);
          if (!vus.length) { manqueI++; if (manqueI <= 8) p('I1 absente : voie ' + v.id + (v.cle ? ' (' + v.cle + ')' : '') + ' : intensité de ' + t.f + ' absente (le moteur dit ' + r2(t.crans) + ' cran)'); }
          else if (!vus.some((x) => Math.abs(x.c - t.crans) <= 0.6)) { ecartI++; if (ecartI <= 8) p('I1 écart : voie ' + v.id + (v.cle ? ' (' + v.cle + ')' : '') + ' : ' + t.f + ' à ' + vus.map((x) => x.c).join('/') + ' cran, le moteur dit ' + r2(t.crans)); }
        }
      }
      if (!nI) p('I1 vide : aucune famille ne bouge sur ' + r.voies.length + ' voie(s) : le contrôle ne compare rien');
      if (manqueI > 8) p('I1 absente : ' + (manqueI - 8) + ' intensité(s) absente(s) de plus');
      if (ecartI > 8) p('I1 écart : ' + (ecartI - 8) + ' écart(s) de plus');
    }
    if (!r.voies.length && !r.usages.length) p('rien lu : ni voie ni usage sur la route « ' + r.route + ' » (un contrôle qui ne lit rien ne passe pas)');
    console.log(id + ' · ' + r.voies.length + ' voie(s), ' + r.usages.length + ' usage(s), ' + nI + ' intensité(s) comparée(s)');
  }
  await browser.close();
  if (problems.length) { console.log('USAGE-INTENSITE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); return false; }
  console.log('USAGE-INTENSITE OK');
  return true;
}
