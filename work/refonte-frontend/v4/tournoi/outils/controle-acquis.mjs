// D99 (22.10, reprise du lot 21 ; leçon L06) : un écran Comparer porte les quatre acquis validés
// par le brasseur ; ce qui a été gagné ne disparaît plus d'un lot au suivant. Ses mots, sur le
// lot 21 : « pas de radar grpah ? » ; « Manque aussi la partie chimie » ; « la panel osu j'aime
// assez » ; « une meilleur vu de comparaison sur des vrai valeur » (v1). Le radar validé aux lots 7
// et 16 avait disparu du lot 21 sans que rien ne le signale (cerveau/produit/acquis-valides.md).
//
// Les quatre acquis, vérifiés sur le rendu (390 px, tactile) :
//   radar   : deux rendus admis, tous deux dans [data-acquis="radar"] et visibles :
//             r2 (un seul radar, tous les houblons superposés) : un svg[data-radar] large d'au moins
//               150 px, d'au moins 5 axes (data-axes), de 2 séries au moins hors zone (g[data-serie]
//               ou [data-serie]), dont les valeurs (data-valeurs) sont alignées sur les axes, pas
//               toutes identiques, et dont chacune dessine un polygone d'au moins 5 sommets
//               (contrat de controle-radar.mjs) ;
//             r3 (petits multiples du lot 16, un petit radar par houblon, deux par rangée) : au moins
//               2 svg[data-radar] larges d'au moins 120 px, aux MÊMES axes (data-axes identiques, 5
//               au moins), chacun avec au moins une série dessinée (polygone de 5 sommets au moins,
//               data-valeurs alignées sur les axes), les séries n'étant pas toutes identiques ;
//   chimie  : au moins 3 composés [data-compose] ; chacun montre un nombre ; tous, sauf « huile »,
//             portent le picto de leur famille (svg[data-famille], visible), au moins 2 rattachés ;
//   osu     : un panel OSU : texte « OSU », un graphique svg d'au moins 3 formes (cercles, polylignes,
//             chemins) large d'au moins 120 px, marqué data-nature="mesure" avec une data-source
//             (le panel est mesuré, jamais simulé) ;
//   valeurs : au moins 3 valeurs [data-nature="mesure"] portant une data-source non vide, chacune
//             avec un nombre et une unité (µg/L, mL/100 g, %, ×, ppm…) lisibles dans sa ligne, et
//             une source citée visible (auteur + année, ou référence E…/H…). Une valeur inconnue
//             n'est jamais « 0 » (une valeur mesurée rendue « 0 » ou vide est une faute).
// ACQUIS « À UN TOUCHER » (décision du pilote, 22.10 : on ouvre avant de mesurer) : un acquis caché
// au repos compte s'il apparaît après UN SEUL toucher sur un déclencheur visible au repos : un
// <button>, un <summary> ou un [role="button"] qui porte aria-controls="<id>" vers le conteneur (ou
// vers un élément qui le contient), ou data-ouvre-acquis="<acquis>[ <acquis>…]". Le contrôle joue ce
// toucher pour de vrai (page rechargée, un seul tap, rien d'autre), puis mesure : un déclencheur qui
// ne montre rien, un second toucher nécessaire, ou aucun déclencheur déclaré, c'est « absent ». Les
// <details> ne sont plus ouverts d'office : leur <summary> doit être déclaré comme ci-dessus. La
// ligne de chaque page dit, par acquis, « au repos » ou « à un toucher ».
// BALISAGE IMPOSÉ aux lots suivants (convention) : data-acquis="radar|chimie|osu|valeurs" sur le
// conteneur de chaque acquis, et data-compose="<composé>" sur chaque ligne de chimie. Un acquis
// présent au rendu mais sans balise est une faute (« non balisé ») : on ne le devine pas, on le
// déclare ; un conteneur balisé dont le contenu ne passe pas la vérification en est une autre.
// Usage : node controle-acquis.mjs <dossier> [ids…] [--page=etat.html[?requête]] ; une ligne par
// page, puis « ACQUIS OK (4/4 : radar, chimie, osu, valeurs) » (code 0), ou « ACQUIS ECHEC n
// problème(s) » et la liste (code 1).
// Témoins : négatifs y3 (panel OSU, pas de radar), y1b, temoins/acquis-deux-touchers (valeurs
// derrière deux touchers) ; positifs temoins/acquis-ok (tout au repos, radar r2) et
// temoins/acquis-toucher-ok (chimie et valeurs à un toucher, radar r3).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pgArg = (args.find((a) => a.startsWith('--page=')) || '--page=etat.html').slice(7);
const [pg, requete = ''] = pgArg.split('?');
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
const ACQUIS = ['radar', 'chimie', 'osu', 'valeurs'];
const DECLENCHEURS = 'button, summary, [role="button"]';

const analyser = ({ ACQUIS, DECLENCHEURS }) => {
  const vis = (e) => !!e && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0;
  const txt = (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim();
  const UNITE = /(µg\s*\/\s*[Lk]g?|ug\/L|mg\s*\/\s*(L|kg|100 ?g)|mL\s*\/\s*(100 ?g|hL)|g\s*\/\s*L|ppm|ppb|ng\s*\/\s*L|%|×|\bEBC\b|\bIBU\b|mL\/100)/i;
  const SOURCE = /\b[A-ZÉ][\p{L}'’.-]+(?:\s+(?:et al\.?|[A-Z]{1,3}))?[ ,·(]+(?:19|20)\d{2}\b|\b[EH]\d{1,3}\b|Beer Maverick|Hopsteiner|COA|certificat|fiche/u;
  const out = { balises: {}, presents: {}, caches: {}, fautes: {}, radarMode: 'r2' };
  const conteneurs = (k) => [...document.querySelectorAll('[data-acquis="' + k + '"]')].filter(vis);
  for (const k of ACQUIS) out.caches[k] = [...document.querySelectorAll('[data-acquis="' + k + '"]')].some((e) => !vis(e));

  // --- déclencheurs visibles au repos : quels acquis chacun déclare-t-il ouvrir ? ---
  out.declencheurs = [...document.querySelectorAll(DECLENCHEURS)].map((t, i) => {
    if (!vis(t)) return null;
    const claims = new Set((t.getAttribute('data-ouvre-acquis') || '').split(/[\s,;]+/).filter((k) => ACQUIS.includes(k)));
    for (const id of (t.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean)) {
      const el = document.getElementById(id);
      if (!el) continue;
      for (const k of ACQUIS) if (el.matches('[data-acquis="' + k + '"]') || el.querySelector('[data-acquis="' + k + '"]')) claims.add(k);
    }
    return claims.size ? { i, claims: [...claims] } : null;
  }).filter(Boolean);

  // --- radar ---
  {
    const cs = conteneurs('radar');
    const svgs = [...document.querySelectorAll('svg[data-radar]')].filter(vis);
    out.presents.radar = svgs.length > 0;
    out.balises.radar = cs.length > 0;
    const dedans = svgs.filter((s) => cs.some((c) => c === s || c.contains(s)));
    const axesDe = (svg) => (svg.getAttribute('data-axes') || '').split(',').filter(Boolean);
    const seriesDe = (svg) => [...svg.querySelectorAll('[data-serie]')].filter((s) => s.getAttribute('data-serie') !== 'zone' && !s.hasAttribute('data-noyau'));
    const valsDe = (s) => (s.getAttribute('data-valeurs') || '').split(',').map(Number);
    const sommetsDe = (s) => (s.querySelector('polygon') ? s.querySelector('polygon').getAttribute('points').trim().split(/\s+/).length : 0) || ((s.querySelector('path') && s.querySelector('path').getAttribute('d').match(/[LM]/g) || []).length);
    const f = [];
    if (cs.length && !dedans.length) f.push('conteneur data-acquis="radar" sans svg[data-radar] visible');
    if (dedans.length === 1) {
      // r2 : un radar, tous les houblons superposés
      const svg = dedans[0];
      const axes = axesDe(svg), series = seriesDe(svg), vals = series.map(valsDe);
      const w = svg.getBoundingClientRect().width;
      if (w < 150) f.push('radar de ' + Math.round(w) + ' px de large (150 au moins)');
      if (axes.length < 5) f.push('radar à ' + axes.length + ' axe(s) (5 au moins)');
      if (series.length < 2) f.push('radar à ' + series.length + ' série(s) de houblon (2 au moins ; ou des petits multiples r3 : un radar par houblon, 2 au moins)');
      if (vals.some((v) => v.length !== axes.length || v.some((x) => Number.isNaN(x)))) f.push('data-valeurs non alignées sur data-axes');
      if (vals.length >= 2 && vals.every((v) => v.join() === vals[0].join())) f.push('séries toutes identiques : pas de silhouette');
      for (const s of series) { const n = sommetsDe(s); if (n < 5) f.push('la série « ' + s.getAttribute('data-serie') + ' » dessine ' + n + ' sommet(s) (5 au moins)'); }
    } else if (dedans.length >= 2) {
      // r3 : petits multiples, un radar par houblon
      out.radarMode = 'r3';
      const axes0 = axesDe(dedans[0]).join();
      const toutes = [];
      dedans.forEach((svg, k) => {
        const nom = 'radar ' + (k + 1);
        const axes = axesDe(svg), series = seriesDe(svg);
        const w = svg.getBoundingClientRect().width;
        if (w < 120) f.push(nom + ' : ' + Math.round(w) + ' px de large (120 au moins)');
        if (axes.length < 5) f.push(nom + ' : ' + axes.length + ' axe(s) (5 au moins)');
        if (axes.join() !== axes0) f.push(nom + ' : axes différents des autres (data-axes identiques exigés)');
        if (series.length < 1) f.push(nom + ' : aucune série dessinée');
        for (const s of series) {
          const v = valsDe(s);
          if (v.length !== axes.length || v.some((x) => Number.isNaN(x))) f.push(nom + ' : data-valeurs non alignées sur data-axes');
          const n = sommetsDe(s);
          if (n < 5) f.push(nom + ' : la série « ' + s.getAttribute('data-serie') + ' » dessine ' + n + ' sommet(s) (5 au moins)');
          toutes.push(v.join());
        }
      });
      if (toutes.length >= 2 && toutes.every((v) => v === toutes[0])) f.push('petits multiples : séries toutes identiques, pas de silhouette');
    }
    out.fautes.radar = f;
  }
  // --- chimie ---
  {
    const cs = conteneurs('chimie');
    const lignes = [...document.querySelectorAll('[data-compose]')].filter(vis);
    const LEX = /(huile|thiols?|4MMP|3MH|linalol|g[ée]raniol|citronellol|myrc[èe]ne|humul[èe]ne|caryophyll[èe]ne|farn[ée]s[èe]ne)/gi;
    out.presents.chimie = new Set((document.body.innerText.match(LEX) || []).map((x) => x.toLowerCase())).size >= 3;
    out.balises.chimie = cs.length > 0;
    const f = [];
    if (cs.length) {
      const dedans = lignes.filter((l) => cs.some((c) => c.contains(l)));
      if (dedans.length < 3) f.push('chimie à ' + dedans.length + ' composé(s) [data-compose] (3 au moins)');
      let rattaches = 0;
      for (const l of dedans) {
        const nom = l.getAttribute('data-compose');
        if (!/\d/.test(txt(l))) f.push('composé « ' + nom + ' » sans nombre');
        const pics = [...l.querySelectorAll('svg[data-famille]')].filter(vis);
        if (pics.length) rattaches++;
        else if (!/^huile/i.test(nom)) f.push('composé « ' + nom + ' » sans picto de sa famille');
      }
      if (dedans.length >= 3 && rattaches < 2) f.push('chimie : ' + rattaches + ' composé(s) rattaché(s) à une famille (2 au moins)');
    }
    out.fautes.chimie = f;
  }
  // --- osu ---
  {
    const cs = conteneurs('osu');
    const texte = document.body.innerText;
    out.presents.osu = /panel\s+OSU/i.test(texte) || [...document.querySelectorAll('svg[aria-label]')].some((s) => /OSU/i.test(s.getAttribute('aria-label')) && vis(s));
    out.balises.osu = cs.length > 0;
    const f = [];
    if (cs.length) {
      const c = cs[0];
      if (!/OSU/.test(txt(c)) && !c.querySelector('svg[aria-label*="OSU"]') && !/OSU/.test(c.getAttribute('aria-label') || '')) f.push('osu : le mot « OSU » ne figure pas dans le bloc');
      const svg = [...c.querySelectorAll('svg')].filter((s) => s.getBoundingClientRect().width >= 120 && s.querySelectorAll('circle,polyline,path,rect').length >= 3)[0];
      if (!svg) f.push('osu : aucun graphique svg (120 px, 3 formes au moins)');
      const mes = c.matches('[data-nature="mesure"]') || c.querySelector('[data-nature="mesure"]');
      const src = (c.getAttribute('data-source') || '') + [...c.querySelectorAll('[data-source]')].map((e) => e.getAttribute('data-source')).join('');
      if (c.matches('[data-nature="simule"]')) f.push('osu : le bloc est marqué simulé (le panel est mesuré)');
      if (!mes) f.push('osu : pas marqué data-nature="mesure" (le panel est mesuré)');
      if (!src.trim()) f.push('osu : pas de data-source');
      if (c.querySelector('[data-nature="simule"]')) f.push('osu : une valeur simulée dans le panel mesuré');
    }
    out.fautes.osu = f;
  }
  // --- valeurs ---
  {
    const cs = conteneurs('valeurs');
    const toutes = [...document.querySelectorAll('[data-nature="mesure"]')].filter((e) => vis(e) && (e.getAttribute('data-source') || '').trim());
    out.presents.valeurs = toutes.length >= 3;
    out.balises.valeurs = cs.length > 0;
    const f = [];
    if (cs.length) {
      const c = cs[0];
      const mes = [...c.querySelectorAll('[data-nature="mesure"]')].filter(vis);
      const avecSource = mes.filter((e) => (e.getAttribute('data-source') || '').trim());
      if (avecSource.length < 3) f.push('valeurs : ' + avecSource.length + ' valeur(s) mesurée(s) avec data-source (3 au moins)');
      let sansUnite = 0;
      for (const e of avecSource) {
        const ligne = e.closest('[data-compose],tr,li,.ligne,.ro,div') || e;
        const lu = txt(e) + ' ' + (e.getAttribute('aria-label') || '') + ' ' + txt(ligne);
        if (!/\d/.test(txt(e))) f.push('valeur « ' + txt(e).slice(0, 25) + ' » sans nombre');
        if (/^\s*0([.,]0+)?\s*$/.test(txt(e).replace(UNITE, ''))) f.push('valeur mesurée « ' + txt(e) + ' » : 0 pour un inconnu ?');
        if (!UNITE.test(lu)) sansUnite++;
      }
      if (sansUnite) f.push('valeurs : ' + sansUnite + ' valeur(s) sans unité lisible');
      if (!SOURCE.test(txt(c))) f.push('valeurs : aucune source citée visible (auteur + année, ou référence)');
    }
    out.fautes.valeurs = f;
  }
  return out;
};

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const charger = async (page, file) => {
  await page.goto(pathToFileURL(file).href + (requete ? '?' + requete : ''), { waitUntil: 'networkidle0', timeout: 30000 });
  await attendre(300);
};

for (const id of ids) {
  const file = path.join(dir, id, pg);
  if (!fs.existsSync(file)) { problems.push(id + ' ' + pg + ' : page absente'); console.log(id + ' · page absente'); continue; }
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await charger(page, file);
  const a = await page.evaluate(analyser, { ACQUIS, DECLENCHEURS });

  // Un toucher, pour de vrai : page rechargée, un seul tap sur chaque déclencheur déclaré, mesure.
  const apres = {}; // acquis -> { ok, fautes }
  const touches = new Set(); // acquis dont un déclencheur déclaré a été touché
  for (const t of a.declencheurs) {
    const aOuvrir = t.claims.filter((k) => !a.balises[k]);
    if (!aOuvrir.length) continue;
    await charger(page, file);
    const hs = await page.$$(DECLENCHEURS);
    if (!hs[t.i]) continue;
    await hs[t.i].tap();
    await attendre(450);
    const b = await page.evaluate(analyser, { ACQUIS, DECLENCHEURS });
    for (const k of aOuvrir) {
      touches.add(k);
      const ok = b.balises[k] && !b.fautes[k].length;
      if (!apres[k] || (ok && !apres[k].ok)) apres[k] = { ok, visible: b.balises[k], fautes: b.fautes[k], mode: b.radarMode };
    }
  }
  await page.close();

  const f = [];
  const tenus = [];
  for (const k of ACQUIS) {
    const fautes = a.fautes[k];
    const nomK = k === 'radar' && a.radarMode === 'r3' ? 'radar r3' : k;
    if (a.balises[k] && !fautes.length) tenus.push(nomK + ' (au repos)');
    else if (a.balises[k]) for (const x of fautes) f.push(x);
    else if (apres[k] && apres[k].ok) tenus.push((k === 'radar' && apres[k].mode === 'r3' ? 'radar r3' : k) + ' (à un toucher)');
    else if (apres[k] && apres[k].visible) for (const x of apres[k].fautes) f.push(x + ' (après un toucher)');
    else if (touches.has(k)) f.push(k + ' : un seul toucher sur son déclencheur ne le fait pas apparaître (deux touchers ou plus : absent)');
    else if (a.caches[k]) f.push(k + ' : caché au repos, sans déclencheur à un toucher (button, summary ou [role="button"] visible avec aria-controls vers le conteneur, ou data-ouvre-acquis="' + k + '") : absent');
    else if (a.presents[k]) f.push(k + ' : présent au rendu mais non balisé (data-acquis="' + k + '")');
    else f.push(k + ' : absent' + (k === 'radar' ? ' (aucun svg[data-radar] visible : « pas de radar grpah ? »)' : k === 'chimie' ? ' (moins de 3 composés lisibles : « Manque aussi la partie chimie »)' : k === 'osu' ? ' (pas de panel OSU)' : ' (moins de 3 vraies valeurs sourcées)'));
  }
  console.log(id + ' · ' + tenus.length + '/4 : ' + (tenus.join(', ') || 'aucun') + (f.length ? ' · ' + f.length + ' faute(s)' : ''));
  for (const x of f) problems.push(id + ' ' + pg + ' : ' + x);
}
await browser.close();
if (problems.length) { console.log('ACQUIS ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('ACQUIS OK (4/4 : radar, chimie, osu, valeurs)');
