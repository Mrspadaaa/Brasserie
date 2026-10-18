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
//   au plus 2 séries hors zone par radar, sauf les houblons de Comparer : jusqu'à 4 superposés,
//   une couleur chacun (révision du 18.10, soir : « Beer Maverick pour le mode Comparer, c'est une
//   des base, il faut faire mieux » ; son radar superpose 3 houblons ; couleurs : controle-comparer) ;
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
// --pages=a.html,b.html : ne contrôler que ces pages (lot d'un composant sur une baseline gelée).
const PAGES = (process.argv.find((x) => x.startsWith('--pages=')) || '').slice(8).split(',').filter(Boolean);
const garde = (f) => !PAGES.length || PAGES.includes(f);
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
  const premiers = [];
  const p = (m) => problems.push(id + ' : ' + m);
  for (const [file, partie] of parties.filter(([f]) => garde(f) || garde(f.replace('.html', '-radar.html').replace('etat-b-radar', 'suggestions-radar')))) {
    if (!fs.existsSync(path.join(dir, id, file))) { p('D19 page ' + file + ' absente (partie « ' + partie + ' »)'); continue; }
    const page = await open(id, file);
    const ok = await page.$('[data-partie="' + partie + '"]');
    if (!ok) p('D19 ' + file + ' : la partie ne se nomme pas (data-partie="' + partie + '")');
    await page.close();
  }
  for (const [file, objet, minS, maxS, minV, maxV] of radars.filter(([f]) => garde(f))) {
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
          // D62 : la forme dessinée de la série, un polygone fermé sur tous les axes ?
          const formes = (e.matches('path,polygon') ? [e] : [...e.querySelectorAll('path,polygon')]).map((x) => {
            if (x.tagName.toLowerCase() === 'polygon') return { n: x.points.numberOfItems, ferme: true };
            const d = x.getAttribute('d') || '';
            return { n: (d.match(/[ML]/gi) || []).length, ferme: /z\s*$/i.test(d.trim()) };
          });
          return { nom: e.getAttribute('data-serie'), filled, formes, v: (e.getAttribute('data-valeurs') || '').split(',').map((x) => (x.trim() === '' ? null : Number(x.trim()))) };
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
          inconnus: [...radar.querySelectorAll('[data-inconnu]')].map((e) => e.getAttribute('data-inconnu')),
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
      // D48 (18.10, soir) : « Il y a pas 12 radar ? » ; « Ni là » (Ma bière à 7 axes, Comparer à
      // 9) : les 12 familles partout, à la même place ; une famille sans valeur est un secteur
      // marqué data-inconnu="<famille>" (hachuré), pas un axe retiré.
      if (m.axes.length !== 12) p('D48 ' + file + n + ' : ' + m.axes.length + ' axes au lieu des 12 familles (une famille sans valeur reste à sa place, en secteur inconnu)');
      premiers.push(file + n + ' → ' + m.axes[0]);
      if (!ordreRoue(m.axes)) q('axes hors de l\'ordre de la roue des arômes' + n + ' : ' + m.axes.join(','));
      const hors = m.series.filter((s) => s.nom !== 'zone');
      total += hors.length;
      const maxSup = objet === 'houblons' ? 4 : 2;
      if (hors.length > maxSup) q(hors.length + ' séries superposées' + n + ' : ' + maxSup + ' au plus, petits multiples au-delà');
      for (const s of m.series) {
        if (s.v.length !== m.axes.length) q('série « ' + s.nom + ' »' + n + ' : ' + s.v.length + ' valeurs pour ' + m.axes.length + ' axes');
        const videsNonMarques = m.axes.filter((f, k) => s.v[k] === null && !m.inconnus.includes(f));
        if (videsNonMarques.length) q('série « ' + s.nom + ' »' + n + ' : valeur vide sans secteur inconnu marqué (data-inconnu) : ' + videsNonMarques.join(', '));
        // D62 (18.10, soir, radars de Suggestions et de Ma bière entourés) : « Les spidergraph/radar
        // graph resemble a rien, c'est une vrai régression... » ; « Celui-ci est encore pire ??? ».
        // Une série qui saute les familles non situées n'est plus un polygone : elle relie quelques
        // points et fait une aiguille. Chaque série (hors zone) : aucune valeur vide (une famille non
        // située se pose au centre, marquée), et un polygone fermé qui passe par tous les axes.
        if (s.nom !== 'zone') {
          const vides = m.axes.filter((f, k) => s.v[k] === null);
          if (vides.length) p('D62 ' + file + n + ' : série « ' + s.nom + ' » sans valeur sur ' + vides.join(', ') + ' : le tracé saute ces axes (une famille non située se pose au centre, marquée)');
          if (!s.formes.some((f) => f.ferme && f.n >= m.axes.length)) p('D62 ' + file + n + ' : série « ' + s.nom + ' » dessinée sans polygone fermé sur les ' + m.axes.length + ' axes (' + (s.formes.map((f) => f.n + (f.ferme ? ' fermé' : ' ouvert')).join(', ') || 'aucune forme') + ')');
        }
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
  // D48 (suite) : la fiche aussi, et la même famille en haut de tous les radars de la variante.
  if (garde('fiche.html') && fs.existsSync(path.join(dir, id, 'fiche.html'))) {
    const page = await open(id, 'fiche.html');
    const fa = await page.evaluate(() => [...document.querySelectorAll('svg[data-radar]')].filter((s) => s.getBoundingClientRect().width > 0).map((s) => (s.getAttribute('data-axes') || '').split(',').filter(Boolean)));
    await page.close();
    for (const a of fa) { if (a.length !== 12) p('D48 fiche.html : ' + a.length + ' axes au lieu des 12 familles'); premiers.push('fiche.html → ' + a[0]); }
  }
  const tetes = new Set(premiers.map((x) => x.split(' → ')[1]));
  if (tetes.size > 1) p('D48 : les radars ne commencent pas par la même famille (' + premiers.join(' ; ') + ') : chaque famille doit rester à sa place');
  console.log(id + ' · parties et radars contrôlés');
}
await browser.close();
if (problems.length === 0) console.log('RADAR OK ' + ids.length + '/' + ids.length);
else { console.log('RADAR ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exitCode = 1; }
