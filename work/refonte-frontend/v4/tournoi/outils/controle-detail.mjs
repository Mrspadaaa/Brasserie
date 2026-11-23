// D31 et D32 (18.10, soir) : la vue détaillée « Ma bière et la cible » (biere.html).
// D31 : « Tropicale 4/5 sur une ipa et 4/5 sur une Lager ça doit pas correspondre sur une
//        Lager c'est très subtil alors que sur une ipa c'est tout ce que la bière est
//        quasiment. » En crans du style, chaque zone remplit la même largeur : « 4/5 » se dessine
//        pareil pour une lager et une IPA. Désormais : une piste COMMUNE en intensité absolue
//        (0 à 3, la même pour toutes les familles et tous les styles), la zone du style posée à
//        sa vraie place et à sa vraie largeur, ma bière à sa vraie valeur ; et l'écart à la zone
//        dit en relatif quand ma bière en sort (« ×2,8 », « 1,6 au-dessus »).
//        Précision du brasseur : « Reste sur une échelle par style mais avoir en tout cas une
//        vue qui affiche l'échelle en absolue. Car j'aime bien expérimenté et si je veux une
//        lager super tropical genre 50/100 ça sera pas vraiment affiché ». Donc : biere.html
//        reste au style (crans), avec une bascule data-booster="lentille absolue" ; la même
//        partie en absolu est biere-absolu.html (géométrie vérifiée ci-dessous) ; dans les
//        deux vues, une sortie de zone dit son ampleur (data-role="ecart" chiffré), jamais
//        écrasée au bord.
// D32 : « je sais pas comment bannir une contraintes ou réduire une autre » : chaque famille
//        offre, sur sa ligne ou après un toucher sur elle, bannir, réduire et augmenter.
// Usage : node work/refonte-frontend/v4/tournoi/outils/controle-detail.mjs <dossier> [ids…]
// Convention, sur biere.html (scénario S1) :
//   data-famille="<id>"         chaque ligne de famille ; data-visee="<0–3>" quand une visée
//                               est posée (0 = bannie) ;
//   data-role="piste"           la piste absolue 0–3 de la ligne ;
//   data-role="zone"            la zone du style, dans la piste ;
//   data-role="biere"           le repère de ma bière, dans la piste (familles situées) ;
//   data-role="ecart"           l'écart relatif, quand ma bière sort de la zone ;
//   data-action="bannir|reduire|augmenter"  les gestes de la ligne.
// Les valeurs attendues viennent du pack (S1.cibleStyleContinu, S1.profilBiereContinu).
// Imprime DETAIL OK si tout passe, sinon DETAIL ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const dir = path.resolve(process.argv[2] || '.');
const only = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const ids = fs.readdirSync(dir).filter((d) => /^p\d+$|^consolide$|^version-/.test(d) && fs.existsSync(path.join(dir, d, 'index.html')))
  .filter((d) => !only.length || only.includes(d)).sort();
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../../../../..');
const pack = JSON.parse(fs.readFileSync(path.join(ROOT, 'prototypes/houblons-v4/data/pack-mini-protos.json'), 'utf8'));
const cible = Object.fromEntries(pack.scenarios.S1.cibleStyleContinu.map((c) => [c.family, c]));
const biere = Object.fromEntries(pack.scenarios.S1.profilBiereContinu.map((c) => [c.family, c.value]));
const TOL = 0.06;
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];

const lire = (page) => page.evaluate(() => [...document.querySelectorAll('[data-famille]')].filter((r) => r.getBoundingClientRect().height > 0).map((r) => {
  const b = (sel) => { const e = r.querySelector(sel); if (!e) return null; const x = e.getBoundingClientRect(); return x.width || x.height ? { l: x.left, w: x.width, c: x.left + x.width / 2 } : null; };
  return { f: r.getAttribute('data-famille'), visee: r.getAttribute('data-visee'), piste: b('[data-role="piste"]'), zone: b('[data-role="zone"]'), biere: b('[data-role="biere"]'), ecart: (r.querySelector('[data-role="ecart"]')?.innerText || '').trim(), texte: r.innerText };
}));

const ouvrir = async (file) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(file).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(300);
  return page;
};
for (const id of ids) {
  const p = (m) => problems.push(id + ' : ' + m);
  const file = path.join(dir, id, 'biere.html');
  if (!fs.existsSync(file)) { p('biere.html absente'); continue; }
  // Vue au style (biere.html) : bascule vers l'absolu, écarts chiffrés, gestes (D32 plus bas).
  const page = await ouvrir(file);
  const rel = await lire(page);
  if (!rel.length) { p('D31 : aucune ligne de famille data-famille (biere.html)'); await page.close(); continue; }
  if (!(await page.$('[data-booster*="absolu"]'))) p('D31 : biere.html sans bascule vers l\'échelle absolue (data-booster="lentille absolue")');
  const sansEcart = rel.filter((r) => { const c = cible[r.f], v = biere[r.f]; return c && v !== null && v !== undefined && v > c.haut + 0.05 && !/\d/.test(r.ecart); }).map((r) => r.f);
  if (sansEcart.length) p('D31 : vue au style, sortie de zone écrasée sans ampleur chiffrée (data-role="ecart") : ' + sansEcart.join(', '));
  // Vue absolue (biere-absolu.html) : piste commune 0–3, zone et bière à leur vraie place.
  const fAbs = path.join(dir, id, 'biere-absolu.html');
  if (!fs.existsSync(fAbs)) { p('D31 : biere-absolu.html absente (la même partie sur l\'échelle absolue)'); }
  const pageAbs = fs.existsSync(fAbs) ? await ouvrir(fAbs) : null;
  const rows = pageAbs ? await lire(pageAbs) : [];
  if (pageAbs) await pageAbs.close();
  if (pageAbs && !rows.length) p('D31 : aucune ligne de famille data-famille (biere-absolu.html)');
  // D31 (a) : même piste pour toutes les familles.
  const larg = rows.filter((r) => r.piste).map((r) => r.piste.w);
  if (larg.length < rows.length) p('D31 : ' + (rows.length - larg.length) + ' ligne(s) sans piste data-role="piste"');
  if (larg.length && Math.max(...larg) - Math.min(...larg) > 2) p('D31 : les pistes n\'ont pas la même largeur (échelle non commune)');
  let zonesFausses = [], biereFausse = [], ecartsManquants = [];
  for (const r of rows) {
    const c = cible[r.f];
    if (!c || !r.piste) continue;
    if (!r.zone) { zonesFausses.push(r.f + ' (absente)'); continue; }
    const g = (r.zone.l - r.piste.l) / r.piste.w, w = r.zone.w / r.piste.w;
    if (Math.abs(g - c.bas / 3) > TOL || Math.abs(w - (c.haut - c.bas) / 3) > TOL) zonesFausses.push(r.f + ' (' + w.toFixed(2) + ' au lieu de ' + ((c.haut - c.bas) / 3).toFixed(2) + ')');
    const v = biere[r.f];
    if (v !== null && v !== undefined) {
      if (!r.biere) biereFausse.push(r.f + ' (absente)');
      else if (Math.abs((r.biere.c - r.piste.l) / r.piste.w - v / 3) > TOL) biereFausse.push(r.f);
      if (v > c.haut + 0.05 && !/\d/.test(r.ecart)) ecartsManquants.push(r.f);
    }
  }
  if (zonesFausses.length) p('D31 : vue absolue, zone du style pas à sa place (0–3) : ' + zonesFausses.slice(0, 4).join(', '));
  if (biereFausse.length) p('D31 : vue absolue, ma bière pas à sa valeur : ' + biereFausse.slice(0, 4).join(', '));
  if (ecartsManquants.length) p('D31 : vue absolue, sortie de zone sans écart chiffré (data-role="ecart") : ' + ecartsManquants.join(', '));
  // D32 : bannir la résine, augmenter le floral.
  const geste = async (fam, action) => {
    const sel = '[data-famille="' + fam + '"] [data-action="' + action + '"]';
    const visible = async () => { const e = await page.$(sel); return e && (await e.evaluate((x) => x.getBoundingClientRect().height > 0)) ? e : null; };
    let b = await visible();
    if (!b) { const row = await page.$('[data-famille="' + fam + '"]'); if (row) { try { await row.tap(); } catch { await row.click(); } await wait(350); } b = await visible(); }
    if (!b) { p('D32 : « ' + action + ' » introuvable sur la ligne ' + fam + ' (ni sur la ligne, ni après un toucher)'); return; }
    const avant = (await lire(page)).find((r) => r.f === fam);
    try { await b.tap(); } catch { await b.click(); }
    await wait(450);
    const apres = (await lire(page)).find((r) => r.f === fam);
    if (!apres) { p('D32 : la ligne ' + fam + ' disparaît après « ' + action + ' »'); return; }
    if (action === 'bannir' && !(apres.visee === '0' || /banni|exclu/i.test(apres.texte))) p('D32 : « bannir » ne bannit pas ' + fam + ' (data-visee="0" attendu)');
    if (action === 'augmenter') {
      const av = Number(avant?.visee ?? biere[fam] ?? 0), ap = Number(apres.visee);
      if (!(ap > av)) p('D32 : « augmenter » n\'élève pas la visée de ' + fam + ' (' + avant?.visee + ' → ' + apres.visee + ')');
    }
  };
  await geste('resin', 'bannir');
  await geste('floral', 'augmenter');
  await page.close();
  console.log(id + ' · détail de Ma bière contrôlé (' + rows.length + ' familles)');
}
await browser.close();
// Audit du 23.10 (a1-audit-defauts) : sur une page au format actuel, ce contrôle ne lisait rien et sortait « DETAIL OK 0/0 ». Un contrôle qui ne lit rien n'est pas un OK.
if (ids.length === 0) problems.push('aucune maquette lue : 0 page au format attendu ; ce contrôle ne garde rien ici (voir portee-defauts.json)');
if (problems.length === 0) console.log('DETAIL OK ' + ids.length + '/' + ids.length);
else { console.log('DETAIL ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exitCode = 1; }
