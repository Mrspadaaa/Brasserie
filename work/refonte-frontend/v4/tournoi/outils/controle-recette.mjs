// D13 : « dès le premier coup d'œil, quel matière première j'ai, et je peux ajouter en un
// click ultra facilement. Ensuite seulement je peux ouvrir mon panel de comparatif » (18.10).
// Usage : node work/refonte-frontend/v4/tournoi/outils/controle-recette.mjs <dossier> [ids…]
// Convention auteur, sur index.html (état A) :
//   data-role="houblons-recette" : le bloc des houblons de la recette ;
//   data-role="ligne-houblon"    : chaque houblon de la recette (une ligne) ;
//   data-role="ajout-rapide"     : un ajout en un toucher (ex. puce « + Golding ») ;
//   data-role="panneau"          : le déclencheur du panneau d'analyse (lecture au style,
//                                  comparaison), qui vient après.
// Vérifie : le bloc commence dans la moitié haute du premier écran (390 × 844) ; au moins
// une ligne ; un ajout rapide visible au premier écran ; un seul toucher sur l'ajout rapide
// ajoute une ligne ; le panneau existe et se trouve sous le bloc des houblons.
// Imprime RECETTE OK si tout passe, sinon RECETTE ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const dir = path.resolve(process.argv[2] || '.');
const only = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const ids = fs.readdirSync(dir).filter((d) => /^p\d+$|^consolide$|^version-/.test(d) && fs.existsSync(path.join(dir, d, 'index.html')))
  .filter((d) => !only.length || only.includes(d)).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];

// D23 : au premier écran, le stock n'est qu'un petit badge ou une info très subtile.
// Relevé : (a) l'état ordinaire « en stock » n'est pas écrit (n'étiqueter que l'exception) ;
// (b) pas de pastille pleine (fond foncé ou coloré) sous un texte de stock ; (c) ni gras ni
// plus grand que la plus petite taille de l'écran ; (d) au plus 3 mentions ; (e) ni liste
// d'achats ni filtre Stock / Tout au premier écran (ils peuvent vivre repliés).
async function stockDiscret(page) {
  return page.evaluate(() => {
    const H = innerHeight;
    const out = [];
    const lum = (c) => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, b, a = 1] = m.map(Number); return { l: (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255, a }; };
    const bodyBg = lum(getComputedStyle(document.body).backgroundColor);
    const pageL = bodyBg && bodyBg.a > 0 ? bodyBg.l : 1;
    const shown = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.height > 0 && r.top < H && r.bottom > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0; };
    const texts = [...document.querySelectorAll('body *')].filter((e) => shown(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
    const minSize = Math.min(...texts.map((e) => parseFloat(getComputedStyle(e).fontSize)));
    const stock = texts.filter((e) => /en stock|manque|à acheter|à racheter|\bstock\b/i.test([...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' '))
      && !e.closest('[data-role="filtre-stock"]'));
    let ordinaire = 0, plein = 0, fort = 0;
    for (const e of stock) {
      const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ');
      if (/en stock/i.test(own)) ordinaire++;
      const cs = getComputedStyle(e);
      if (parseFloat(cs.fontWeight) >= 600 || parseFloat(cs.fontSize) > minSize + 0.5) fort++;
      // Pastille : l'élément ou un ancêtre étroit (≤ 140 px) avec un fond plein qui tranche sur la page.
      for (let a = e, k = 0; a && k < 3; a = a.parentElement, k++) {
        if (a.getBoundingClientRect().width > 140) break;
        const bg = lum(getComputedStyle(a).backgroundColor);
        if (bg && bg.a > 0.15 && Math.abs(bg.l - pageL) * bg.a > 0.12) { plein++; break; }
      }
    }
    if (ordinaire) out.push('« en stock » écrit ' + ordinaire + ' fois : l\'état ordinaire ne s\'étiquette pas');
    if (plein) out.push(plein + ' pastille(s) de stock à fond plein');
    if (fort) out.push(fort + ' mention(s) de stock en gras ou plus grandes que le plus petit texte');
    if (stock.length > 3) out.push(stock.length + ' mentions de stock au premier écran (≤ 3)');
    for (const sel of ['[data-role="achats"]', '[data-role="filtre-stock"]']) {
      const e = [...document.querySelectorAll(sel)].find(shown);
      if (e) out.push(sel.slice(12, -2) + ' visible au premier écran (à replier)');
    }
    return out;
  });
}
for (const id of ids) {
  const p = (m) => problems.push(id + ' : ' + m);
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, 'index.html')).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const m = await page.evaluate(() => {
    const H = innerHeight;
    const box = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: r.height }; };
    const visible = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.height > 0 && r.top < H && r.bottom > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    return {
      H,
      bloc: box('[data-role="houblons-recette"]'),
      lignes: document.querySelectorAll('[data-role="ligne-houblon"]').length,
      ajoutVisible: [...document.querySelectorAll('[data-role="ajout-rapide"]')].some(visible),
      panneau: box('[data-role="panneau"]'),
      // D16 : l'IBU de chaque houblon de la recette et de chaque ajout proposé.
      lignesIbu: [...document.querySelectorAll('[data-role="ligne-houblon"]')].map((e) => /\d+(,\d+)?\s*IBU/i.test(e.innerText)),
      ajoutsIbu: [...document.querySelectorAll('[data-role="ajout-rapide"]')].map((e) => /IBU/i.test(e.innerText)),
      // D17 : le type d'ajout et le moment, réglables sur chaque ligne.
      lignesType: [...document.querySelectorAll('[data-role="ligne-houblon"]')].map((e) => !!e.querySelector('[data-role="type-ajout"]') && !!e.querySelector('[data-role="quand"]')),
      // D21 : « je fais une recette puis ensuite j'achète les ingrédients » : le stock informe
      // sans limiter ; chaque ajout dit son état de stock ; une liste d'achats existe ; des
      // ajouts proposés hors stock (« à acheter ») ou un filtre Stock / Tout.
      lignesStock: [...document.querySelectorAll('[data-role="ligne-houblon"]')].map((e) => /en stock|manque|à acheter|à racheter/i.test(e.innerText)),
      achats: !!document.querySelector('[data-role="achats"]'),
      horsStock: [...document.querySelectorAll('[data-role="ajout-rapide"]')].some((e) => /à acheter|à racheter/i.test(e.innerText)) || !!document.querySelector('[data-role="filtre-stock"]'),
    };
  });
  // D21 révisé par D23 (18.10, soir) : le stock informe par l'exception seulement (S1 : Nugget
  // manque) ; la liste d'achats n'est plus exigée sur l'étape (« dans l'app on voit dans le
  // récap à la fin »).
  if (!m.lignesStock.some((x) => x)) p('D21 : aucune exception de stock signalée sur la recette (S1 : Nugget manque)');
  // D22 : « biotransformation avec levures, dry hopping et tout, comment ça d'intégre ? Ça a
  // été oublié ? » : la levure est visible sur l'étape avec son statut.
  if (!(await page.$('[data-role="levure"]'))) p('D22 : la levure de la recette n\'est pas visible sur l\'étape (data-role="levure")');
  if (!m.horsStock) p('D21 : les ajouts proposés se limitent au stock (aucun « à acheter », pas de filtre data-role="filtre-stock")');
  // D23 : « La stock sont beaucoup trop mis en avant surtout que dans l'app on voit dans le
  // récap à la fin. Juste un petit badge ou info très subtil suffit » (18.10, soir).
  for (const x of await stockDiscret(page)) p('D23 : ' + x);
  if (m.lignesIbu.some((x) => !x)) p('D16 : un houblon de la recette sans son IBU (« 46 g · 60 IBU »)');
  if (m.ajoutsIbu.length && m.ajoutsIbu.some((x) => !x)) p('D16 : un ajout proposé sans les IBU qu\'il ajoute (« + 20 IBU »)');
  if (m.lignesType.some((x) => !x)) p('D17 : une ligne sans type d\'ajout (data-role="type-ajout") ou sans moment (data-role="quand")');
  if (m.lignesType.length && m.lignesType[0]) {
    const avant = await page.$eval('[data-role="ligne-houblon"]', (e) => e.innerText);
    const t = await page.$('[data-role="ligne-houblon"] [data-role="type-ajout"]');
    try { await t.tap(); } catch { await t.click(); }
    await new Promise((r) => setTimeout(r, 400));
    const apres = await page.$eval('[data-role="ligne-houblon"]', (e) => e.innerText);
    if (avant === apres) p('D17 : toucher le type d\'ajout ne change rien sur la ligne');
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 300));
  }
  if (!m.bloc) p('bloc data-role="houblons-recette" absent');
  else if (m.bloc.top > m.H / 2) p('houblons de la recette trop bas (' + Math.round(m.bloc.top) + ' px, moitié haute attendue)');
  if (m.lignes < 1) p('aucune ligne data-role="ligne-houblon"');
  if (!m.ajoutVisible) p('aucun ajout rapide visible au premier écran');
  if (!m.panneau) p('déclencheur data-role="panneau" absent');
  else if (m.bloc && m.panneau.top < m.bloc.top) p('le panneau d\'analyse passe avant les houblons de la recette');
  if (m.ajoutVisible) {
    const el = (await page.$$('[data-role="ajout-rapide"]'))[0];
    try { await el.tap(); } catch { await el.click(); }
    await new Promise((r) => setTimeout(r, 500));
    const after = await page.$$eval('[data-role="ligne-houblon"]', (els) => els.length);
    if (after <= m.lignes) p('un toucher sur l\'ajout rapide n\'ajoute pas de ligne (' + m.lignes + ' → ' + after + ')');
  }
  console.log(id + ' · bloc à ' + (m.bloc ? Math.round(m.bloc.top) : '–') + ' px · lignes ' + m.lignes + ' · ajout rapide ' + (m.ajoutVisible ? 'visible' : 'absent'));
  await page.close();
  // D20 : « je peux goûté d'autres bière que les miennes et pas aimer un houblon » : dans les
  // suggestions (etat-b.html), un geste data-role="gout" note un houblon, et les voies en
  // tiennent compte (la liste change).
  if (fs.existsSync(path.join(dir, id, 'etat-b.html'))) {
    const b = await browser.newPage();
    await b.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await b.goto(pathToFileURL(path.join(dir, id, 'etat-b.html')).href, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 300));
    const g = await b.$('[data-role="gout"]');
    if (!g) p('D20 : aucun geste pour noter un goût (data-role="gout") dans les suggestions');
    else {
      const avant = await b.evaluate(() => document.body.innerText);
      try { await g.tap(); } catch { await g.click(); }
      await new Promise((r) => setTimeout(r, 500));
      const apres = await b.evaluate(() => document.body.innerText);
      if (avant === apres) p('D20 : noter un goût ne change rien aux suggestions');
    }
    await b.close();
  } else p('D20 : etat-b.html absent');
  // D22 (suite) : sur la recette chargée (cas-k3.html, S5), l'ajout à froid en fermentation
  // active porte ses signaux de biotransformation (data-role="biotransformation").
  if (fs.existsSync(path.join(dir, id, 'cas-k3.html'))) {
    const k = await browser.newPage();
    await k.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await k.goto(pathToFileURL(path.join(dir, id, 'cas-k3.html')).href, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 300));
    const bio = await k.evaluate(() => [...document.querySelectorAll('[data-role="ligne-houblon"]')]
      .filter((e) => /fermentation active|à froid|dry/i.test(e.innerText))
      .map((e) => !!e.querySelector('[data-role="biotransformation"]')));
    if (!bio.length) p('D22 : cas-k3.html sans ajout à froid reconnaissable');
    else if (bio.some((x) => !x)) p('D22 : l\'ajout à froid de cas-k3.html ne porte pas ses signaux de biotransformation (data-role="biotransformation")');
    await k.close();
  } else p('D22 : cas-k3.html absent (recette chargée, S5)');
}
await browser.close();
if (problems.length === 0) console.log('RECETTE OK ' + ids.length + '/' + ids.length);
else { console.log('RECETTE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exitCode = 1; }
