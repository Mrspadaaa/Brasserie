// D18 et D19 : les quatre objets du brasseur, et un radar par objet (18.10).
// D18 : « C'est une catastrophe la vue radar ?? » ; D19 : « il y a confusion entre, ce que
// j'ai actuellement dans ma bière, son profil. Le style de la bière, un target. La
// comparaison manuel entre plusieurs houblons. Et la comparaison par suggestions de l'outils ».
// Modèle : work/refonte-frontend/v4/ecran-1/MODELE.md.
// Usage : node work/refonte-frontend/v4/tournoi/outils/controle-radar.mjs <dossier> [ids…]
//
// Pages attendues par maquette (en plus d'index.html, l'étape) :
//   biere.html        partie « Ma bière et la cible »      data-partie="biere"
//   etat-b.html       partie « Suggestions » (après une direction)  data-partie="suggestions"
//   comparer.html     partie « Comparer des houblons »     data-partie="comparer"
//   biere-radar.html, suggestions-radar.html, comparer-radar.html : la même partie en Radar.
// Chaque radar : <svg data-radar data-objet="…"> et ses séries data-serie="nom" data-valeurs="…"
// (12 valeurs dans l'ordre du style) :
//   biere-radar        data-objet="biere-cible" : une série « ma bière » (niveaux 0 à 3 ou
//                      vide pour non situé) et une série « cible » (niveau haut de la cible) ;
//   suggestions-radar  data-objet="voies" : « avant » et 1 à 3 voies « après » (0 à 3) ;
//   comparer-radar     data-objet="houblons" : 2 à 4 houblons, citations 0 à 2.
// Une série plate partout ou des séries toutes identiques échouent (pas de silhouette).
//
// D24 (18.10, soir) : « C'est toujours n'importe quoi les spidergraph Radar graph il faut
// faire qqch.... ». Diagnostic (planches du lot 3) : axes dans l'ordre du style (familles
// fruitées dispersées, aucun lobe), 3 ou 4 séries en pointillés superposées, polygones
// cassés par les familles non situées, zone du style en crans = disque uniforme, petit radar
// et libellés de 9 px. Étalon : le radar de Beer Maverick (référence du brasseur, 9 axes en
// roue, silhouettes pleines, pleine largeur). Contrat v2 de chaque <svg data-radar> :
//   data-axes="citrus,tropical,…"  familles dessinées, sens horaire depuis le haut, dans
//                                  l'ordre de la roue (rotation ou miroir permis) ; ≥ 5 axes ;
//                                  une famille sans valeur n'est pas un axe (elle se liste à côté) ;
//   data-serie / data-valeurs      alignées sur data-axes, sans vide ; data-serie="zone" pour
//                                  la zone du style (haut de la zone), hors du compte des séries ;
//   au plus 2 séries hors zone par radar : 3 ou 4 houblons → petits multiples (plusieurs svg) ;
//   au moins une silhouette pleine translucide (opacité de remplissage 0,06 à 0,7) ;
//   largeur ≥ 75 % de l'écran (≥ 42 % chacun en petits multiples) ;
//   libellés ≥ 11 px, dans l'écran, sans chevauchement.
// Échelles : bière et voies en intensité absolue 0 à 3 (la zone du style a alors une forme) ;
// houblons en citations 0 à 2.
// Imprime RADAR OK si tout passe, sinon RADAR ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const dir = path.resolve(process.argv[2] || '.');
const only = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const ids = fs.readdirSync(dir).filter((d) => /^p\d+$|^consolide$|^version-/.test(d) && fs.existsSync(path.join(dir, d, 'index.html')))
  .filter((d) => !only.length || only.includes(d)).sort();
const parties = [['biere.html', 'biere'], ['etat-b.html', 'suggestions'], ['comparer.html', 'comparer']];
// Bière, cible et voies en crans du style (0 à 3 dans la bande, 4 au-dessus) ; houblons en
// citations (0 à 2). Voir MODELE.md, « Échelle des objets 1, 2 et 4 ».
// [page, objet, séries hors zone sur la page (min, max), valeurs (min, max)]
const radars = [
  ['biere-radar.html', 'biere-cible', 1, 2, 0, 3],
  ['suggestions-radar.html', 'voies', 2, 4, 0, 3],
  ['comparer-radar.html', 'houblons', 2, 4, 0, 2],
];
// Roue des arômes (adjacences de Beer Maverick : … floral, herbe, herbacé, épicé, résine, agrumes …).
const ROUE = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
const ordreRoue = (axes) => {
  const ref = ROUE.filter((f) => axes.includes(f));
  if (ref.length !== axes.length) return false;
  const rot = (a, k) => a.slice(k).concat(a.slice(0, k));
  for (let k = 0; k < ref.length; k++) {
    const r = rot(ref, k);
    if (r.join() === axes.join() || [...r].reverse().join() === axes.join()) return true;
  }
  return false;
};
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
const open = async (id, file) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, file)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  return page;
};
for (const id of ids) {
  const p = (m) => problems.push(id + ' : ' + m);
  for (const [file, partie] of parties) {
    if (!fs.existsSync(path.join(dir, id, file))) { p('D19 page ' + file + ' absente (partie « ' + partie + ' »)'); continue; }
    const page = await open(id, file);
    const ok = await page.$('[data-partie="' + partie + '"]');
    if (!ok) p('D19 ' + file + ' : la partie ne se nomme pas (data-partie="' + partie + '")');
    await page.close();
  }
  for (const [file, objet, minS, maxS, minV, maxV] of radars) {
    if (!fs.existsSync(path.join(dir, id, file))) { p('D18 page ' + file + ' absente'); continue; }
    const page = await open(id, file);
    const ms = await page.evaluate(() => {
      const W = innerWidth, H = innerHeight;
      return [...document.querySelectorAll('svg[data-radar]')].filter((s) => s.getBoundingClientRect().width > 0).map((radar) => {
        const series = [...radar.querySelectorAll('[data-serie]')].map((e) => {
          const filled = [e, ...e.querySelectorAll('path,polygon')].some((x) => {
            const cs = getComputedStyle(x);
            if (cs.fill === 'none' || /rgba\(0, 0, 0, 0\)/.test(cs.fill)) return false;
            const o = Number(cs.fillOpacity) * Number(cs.opacity);
            return o >= 0.06 && o <= 0.7;
          });
          return { nom: e.getAttribute('data-serie'), filled, v: (e.getAttribute('data-valeurs') || '').split(',').map((x) => (x.trim() === '' ? null : Number(x.trim()))) };
        });
        const labels = [...radar.querySelectorAll('text')].filter((t) => t.textContent.trim()).map((t) => { const r = t.getBoundingClientRect(); return { t: t.textContent.trim(), fs: parseFloat(getComputedStyle(t).fontSize), x0: r.left, x1: r.right, y0: r.top, y1: r.bottom }; });
        let chevauche = 0;
        for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
          const a = labels[i], b = labels[j];
          const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
          if (w > 1 && h > 1) chevauche++;
        }
        return {
          objet: radar.getAttribute('data-objet'),
          axes: (radar.getAttribute('data-axes') || '').split(',').map((x) => x.trim()).filter(Boolean),
          largeur: radar.getBoundingClientRect().width / W,
          series,
          petits: labels.filter((l) => l.fs < 11).map((l) => l.t),
          dehors: labels.filter((l) => l.x0 < 0 || l.x1 > W || l.y0 < 0 || l.y1 > H).map((l) => l.t),
          chevauche,
        };
      });
    });
    await page.close();
    if (!ms.length) { p('D18 ' + file + ' : aucun radar data-radar'); continue; }
    const q = (m) => p('D24 ' + file + ' : ' + m);
    let total = 0;
    for (const [i, m] of ms.entries()) {
      const n = ms.length > 1 ? ' (radar ' + (i + 1) + ')' : '';
      if (m.objet !== objet) p('D18 ' + file + n + ' : le radar montre « ' + m.objet + ' » au lieu de « ' + objet + ' » (objets mélangés)');
      if (!m.axes.length) { q('data-axes absent' + n + ' (familles dessinées, dans l\'ordre)'); continue; }
      if (m.axes.length < 5) q(m.axes.length + ' axes' + n + ' : un radar en demande au moins 5');
      if (!ordreRoue(m.axes)) q('axes hors de l\'ordre de la roue des arômes' + n + ' : ' + m.axes.join(','));
      const hors = m.series.filter((s) => s.nom !== 'zone');
      total += hors.length;
      if (hors.length > 2) q(hors.length + ' séries superposées' + n + ' : 2 au plus, petits multiples au-delà');
      for (const s of m.series) {
        if (s.v.length !== m.axes.length) q('série « ' + s.nom + ' »' + n + ' : ' + s.v.length + ' valeurs pour ' + m.axes.length + ' axes');
        if (s.v.some((x) => x === null)) q('série « ' + s.nom + ' »' + n + ' : valeur vide sur un axe dessiné (polygone cassé ; retirer l\'axe)');
        if (s.v.some((x) => x !== null && (!Number.isFinite(x) || x < minV || x > maxV))) q('série « ' + s.nom + ' »' + n + ' : valeurs hors de ' + minV + ' à ' + maxV);
      }
      if (!hors.some((s) => s.filled)) q('aucune silhouette pleine translucide' + n + ' (opacité de remplissage 0,06 à 0,7)');
      const vals = (s) => s.v.filter((x) => x !== null);
      if (hors.length && hors.every((s) => { const v = vals(s); return !v.length || Math.max(...v) === Math.min(...v); })) p('D18 ' + file + n + ' : toutes les séries sont plates, pas de silhouette');
      if (hors.length === 2 && hors[0].v.join() === hors[1].v.join()) p('D18 ' + file + n + ' : séries identiques, rien à comparer');
      const minL = ms.length > 1 ? 0.42 : 0.75;
      if (m.largeur < minL) q('radar de ' + Math.round(m.largeur * 100) + ' % de la largeur' + n + ' (≥ ' + Math.round(minL * 100) + ' %)');
      if (m.petits.length) q(m.petits.length + ' libellé(s) sous 11 px' + n + ' (' + m.petits.slice(0, 3).join(', ') + ')');
      if (m.dehors.length) q('libellé(s) hors de l\'écran' + n + ' (' + m.dehors.slice(0, 3).join(', ') + ')');
      if (m.chevauche) q(m.chevauche + ' chevauchement(s) de libellés' + n);
    }
    if (total < minS || total > maxS) p('D18 ' + file + ' : ' + total + ' série(s) hors zone sur la page, ' + minS + ' à ' + maxS + ' attendues');
  }
  console.log(id + ' · parties et radars contrôlés');
}
await browser.close();
if (problems.length === 0) console.log('RADAR OK ' + ids.length + '/' + ids.length);
else { console.log('RADAR ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exitCode = 1; }
