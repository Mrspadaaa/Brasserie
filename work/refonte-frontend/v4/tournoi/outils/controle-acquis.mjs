// D99 (22.10, reprise du lot 21 ; leçon L06) : un écran Comparer porte les quatre acquis validés
// par le brasseur ; ce qui a été gagné ne disparaît plus d'un lot au suivant. Ses mots, sur le
// lot 21 : « pas de radar grpah ? » ; « Manque aussi la partie chimie » ; « la panel osu j'aime
// assez » ; « une meilleur vu de comparaison sur des vrai valeur » (v1). Le radar validé aux lots 7
// et 16 avait disparu du lot 21 sans que rien ne le signale (cerveau/produit/acquis-valides.md).
//
// Les quatre acquis, vérifiés sur le rendu (390 px, tactile, éléments visibles au repos ;
// les <details> sont ouverts) :
//   radar   : un radar svg[data-radar] visible, large d'au moins 150 px, d'au moins 5 axes
//             (data-axes), de 2 séries au moins hors zone (g[data-serie] ou [data-serie]), dont les
//             valeurs (data-valeurs) sont alignées sur les axes, pas toutes identiques, et dont
//             chacune dessine un polygone d'au moins 5 sommets (contrat de controle-radar.mjs) ;
//   chimie  : au moins 3 composés [data-compose] ; chacun montre un nombre ; tous, sauf « huile »,
//             portent le picto de leur famille (svg[data-famille], visible), au moins 2 rattachés ;
//   osu     : un panel OSU : texte « OSU », un graphique svg d'au moins 3 formes (cercles, polylignes,
//             chemins) large d'au moins 120 px, marqué data-nature="mesure" avec une data-source
//             (le panel est mesuré, jamais simulé) ;
//   valeurs : au moins 3 valeurs [data-nature="mesure"] portant une data-source non vide, chacune
//             avec un nombre et une unité (µg/L, mL/100 g, %, ×, ppm…) lisibles dans sa ligne, et
//             une source citée visible (auteur + année, ou référence E…/H…). Une valeur inconnue
//             n'est jamais « 0 » (une valeur mesurée rendue « 0 » ou vide est une faute).
// BALISAGE IMPOSÉ aux lots suivants (convention) : data-acquis="radar|chimie|osu|valeurs" sur le
// conteneur de chaque acquis, et data-compose="<composé>" sur chaque ligne de chimie. Un acquis
// présent au rendu mais sans balise est une faute (« non balisé ») : on ne le devine pas, on le
// déclare ; un conteneur balisé dont le contenu ne passe pas la vérification en est une autre.
// Usage : node controle-acquis.mjs <dossier> [ids…] [--page=etat.html[?requête]] ; une ligne par
// page, puis « ACQUIS OK (4/4 : radar, chimie, osu, valeurs) » (code 0), ou « ACQUIS ECHEC n
// problème(s) » et la liste (code 1).
// Témoins : négatifs y3 (panel OSU, pas de radar) et y1b ; positif temoins/acquis-ok.
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

const analyser = () => {
  const vis = (e) => !!e && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0;
  const txt = (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim();
  const UNITE = /(µg\s*\/\s*[Lk]g?|ug\/L|mg\s*\/\s*(L|kg|100 ?g)|mL\s*\/\s*(100 ?g|hL)|g\s*\/\s*L|ppm|ppb|ng\s*\/\s*L|%|×|\bEBC\b|\bIBU\b|mL\/100)/i;
  const SOURCE = /\b[A-ZÉ][\p{L}'’.-]+(?:\s+(?:et al\.?|[A-Z]{1,3}))?[ ,·(]+(?:19|20)\d{2}\b|\b[EH]\d{1,3}\b|Beer Maverick|Hopsteiner|COA|certificat|fiche/u;
  const out = { balises: {}, presents: {} };
  const conteneurs = (k) => [...document.querySelectorAll('[data-acquis="' + k + '"]')].filter(vis);

  // --- radar ---
  {
    const cs = conteneurs('radar');
    const svgs = [...document.querySelectorAll('svg[data-radar]')].filter(vis);
    out.presents.radar = svgs.length > 0;
    out.balises.radar = cs.length > 0;
    const svg = cs.map((c) => (c.matches('svg[data-radar]') ? c : c.querySelector('svg[data-radar]'))).find(Boolean);
    const f = [];
    if (cs.length && !svg) f.push('conteneur data-acquis="radar" sans svg[data-radar] visible');
    if (svg) {
      const axes = (svg.getAttribute('data-axes') || '').split(',').filter(Boolean);
      const series = [...svg.querySelectorAll('[data-serie]')].filter((s) => s.getAttribute('data-serie') !== 'zone' && !s.hasAttribute('data-noyau'));
      const vals = series.map((s) => (s.getAttribute('data-valeurs') || '').split(',').map(Number));
      const w = svg.getBoundingClientRect().width;
      if (w < 150) f.push('radar de ' + Math.round(w) + ' px de large (150 au moins)');
      if (axes.length < 5) f.push('radar à ' + axes.length + ' axe(s) (5 au moins)');
      if (series.length < 2) f.push('radar à ' + series.length + ' série(s) de houblon (2 au moins)');
      if (vals.some((v) => v.length !== axes.length || v.some((x) => Number.isNaN(x)))) f.push('data-valeurs non alignées sur data-axes');
      if (vals.length >= 2 && vals.every((v) => v.join() === vals[0].join())) f.push('séries toutes identiques : pas de silhouette');
      for (const s of series) {
        const sommets = (s.querySelector('polygon') ? s.querySelector('polygon').getAttribute('points').trim().split(/\s+/).length : 0) || ((s.querySelector('path') && s.querySelector('path').getAttribute('d').match(/[LM]/g) || []).length);
        if (sommets < 5) f.push('la série « ' + s.getAttribute('data-serie') + ' » dessine ' + sommets + ' sommet(s) (5 au moins)');
      }
    }
    out.fautes = { radar: f };
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

for (const id of ids) {
  const file = path.join(dir, id, pg);
  if (!fs.existsSync(file)) { problems.push(id + ' ' + pg + ' : page absente'); console.log(id + ' · page absente'); continue; }
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(file).href + (requete ? '?' + requete : ''), { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
  const a = await page.evaluate(analyser);
  await page.close();
  const f = [];
  const tenus = [];
  for (const k of ACQUIS) {
    const fautes = a.fautes[k];
    if (a.balises[k] && !fautes.length) tenus.push(k);
    else if (a.balises[k]) for (const x of fautes) f.push(x);
    else if (a.presents[k]) f.push(k + ' : présent au rendu mais non balisé (data-acquis="' + k + '")');
    else f.push(k + ' : absent' + (k === 'radar' ? ' (aucun svg[data-radar] visible : « pas de radar grpah ? »)' : k === 'chimie' ? ' (moins de 3 composés lisibles : « Manque aussi la partie chimie »)' : k === 'osu' ? ' (pas de panel OSU)' : ' (moins de 3 vraies valeurs sourcées)'));
  }
  console.log(id + ' · ' + tenus.length + '/4 : ' + (tenus.join(', ') || 'aucun') + (f.length ? ' · ' + f.length + ' faute(s)' : ''));
  for (const x of f) problems.push(id + ' ' + pg + ' : ' + x);
}
await browser.close();
if (problems.length) { console.log('ACQUIS ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('ACQUIS OK (4/4 : radar, chimie, osu, valeurs)');
