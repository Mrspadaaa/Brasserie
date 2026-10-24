// Planche des graphes (jeu court D125, Q4) : une page par graphe de ses écrans choisis. En haut (a), le graphe tel
// qu'il est, figé depuis la maquette rendue (extraits/, par extraire.mjs) ; dessous (b, c), deux autres lectures du
// MÊME graphe, au doigt, sans légende écrite au repos. Classes et globales préfixées jg- (L26) ; assemblage par
// split/join, aucun remplacement de chaîne avec motif $ (L26).
// Usage : node generer.mjs   → ../gr1/etat.html … ../gr6/etat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOUBLONS, NOM, JETONS, fmt } from '../../fils24-fiche-liste/fla1/commun/donnees.mjs';
import { aides, ORDRE_RADAR } from '../../fils24-fiche-liste/fla1/commun/socle.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const lot = path.resolve(ici, '..');
const X = (f) => fs.readFileSync(path.join(ici, 'extraits', f), 'utf8');
const sub = (s, a, b) => s.split(a).join(b);
// Un extrait figé ne garde pas les rôles qui appartiennent à la page : fiche, légende, cartes de houblon et ids de React.
const figer = (s) => {
  s = sub(s, 'data-houblon=', 'data-jg-houblon=');
  s = sub(s, 'data-role="ligne-houblon"', 'data-role="jg-ligne"');
  s = sub(s, 'data-role="legende"', 'data-role="jg-legende-base"');
  s = sub(s, 'data-role="fiche"', 'data-role="jg-fiche-base"');
  s = sub(s, 'data-role="ajout-rapide"', 'data-role="jg-ajout"');
  s = s.split(' id="_r_').map((x, i) => (i ? x.slice(x.indexOf('"') + 1) : x)).join('');
  return s;
};
const S = aides('jg');
const nug = HOUBLONS.find((h) => h.key === 'nugget');
const legende = (id) => JSON.parse(X(id + '.json')).legende.filter((l) => l.length > 12 && l.length < 260).slice(0, 4);

const G = {
  gr1: { titre: 'Les barres de Ma bière', sous: 'au style', ou: 'Ma bière et l\'étape Houblons',
    a: () => `<div data-jg-vue="style">${figer(X('gr1.html'))}</div><div data-jg-vue="absolu" hidden>${figer(X('gr2.html'))}</div>`,
    b: ['le mot sous le doigt', 'barres'], c: ['le haut du 16D nommé', 'barres'] },
  gr2: { titre: 'Les barres en absolu', sous: 'faible, moyen, marqué', ou: 'Ma bière, après « Absolu »',
    a: () => `<div data-jg-vue="absolu">${figer(X('gr2.html'))}</div><div data-jg-vue="style" hidden>${figer(X('gr1.html'))}</div>`,
    b: ['le mot sous le doigt', 'barres'], c: ['au style, l\'absolu au doigt', 'barres-style'] },
  gr3: { titre: 'Le radar de Ma bière', sous: 'et sa grille', ou: 'Ma bière, après « Radar »',
    a: () => figer(X('gr3.html')), b: ['le sommet au doigt', 'radar'], c: ['la grille au doigt, le 16D nommé', 'radar'] },
  gr4: { titre: 'Le radar de la fiche', sous: 'Nugget', ou: 'la fiche, à l\'appui long',
    a: () => figer(X('gr4.html')), b: ['les mots des fiches au doigt', 'fiche'], c: ['face à ma bière', 'fiche'],
    pied: () => `<section class="jg-l jg-pied"><h2 class="jg-n"><span>sous la fiche : l'étape</span></h2><div class="jg-cadre">${figer(X('etape.html'))}</div></section>` },
  gr5: { titre: 'Les traits de Suggérer', sous: 'un trait par cran', ou: 'Suggestions, sous chaque picto',
    a: () => `<div class="jg-obj">${figer(X('gr5-objectifs.html'))}</div><div class="jg-lent5">${figer(X('gr5-b.html'))}</div>${figer(X('gr5.html'))}`, b: ['le cran au doigt', 'traits'], c: ['les crans comptés', 'traits'] },
  gr6: { titre: 'Le radar de Comparer', sous: 'r2', ou: 'Comparer, Cascade · Idaho 7 · Galaxy',
    a: () => `${figer(X('gr6.html'))}<div class="jg-cols">${figer(X('gr6-b.html'))}</div>`, b: ['un houblon à la fois', 'series'], c: ['l\'axe au doigt', 'axe'] },
};
const ids = Object.keys(G);
// La bande des 12 familles de Nugget, comme sur sa carte de l'étape : vive, marquée ; pâle, citée ; grise, non décrite.
const BANDE = S.ORDRE.map((f) => `<i style="background:${nug.radar[f].level ? JETONS[f][nug.radar[f].level === 2 ? 'base' : 'fond'] : '#ececea'}"></i>`).join('');

const CSS = `
.jg-page{max-width:430px;margin:0 auto;padding:0 8px 40px;color:#1d1d1b}
.jg-tete{position:sticky;top:0;z-index:4;background:#fff;display:flex;align-items:center;gap:6px;padding:8px 0 6px;border-bottom:1px solid #e3e3e0}
.jg-nav{display:flex;gap:4px;flex:1}
.jg-nav a{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:600 14px/1 system-ui,sans-serif;color:#1d1d1b;text-decoration:none;border:1px solid #c4c4c0}
.jg-nav a[aria-current="page"]{background:#1d1d1b;color:#fff;border-color:#1d1d1b}
.jg-q{width:30px;height:30px;border-radius:50%;border:1px solid #bdbdb9;background:none;font:14px/1 system-ui,sans-serif;color:#3a3a38;padding:0}
.jg-leg{font-size:13px;color:#3a3a38;background:#f6f6f4;border-radius:8px;padding:8px 10px;margin:6px 0}.jg-leg p{margin:0 0 4px}
.jg-t{display:flex;align-items:baseline;gap:8px;margin:10px 2px 2px;font:700 21px/1.15 system-ui,sans-serif;letter-spacing:-.01em}
.jg-t small{font-weight:500;font-size:14px;color:#4a4a47}
.jg-band{display:inline-flex;gap:2px;vertical-align:-1px;margin:0 2px}.jg-band i{width:8px;height:11px;border-radius:2px;display:block}
.jg-ctx{margin:0 2px 8px;font-size:13px;color:#4a4a47}
.jg-h{font-weight:650;color:#1d1d1b;text-decoration:underline dotted #8a8a86;text-underline-offset:3px;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.jg-l{margin:14px 0 0}
.jg-n{display:flex;align-items:center;gap:8px;margin:0 2px 6px;font:600 15px/1.2 system-ui,sans-serif}
.jg-n b{min-width:34px;height:26px;padding:0 8px;border-radius:999px;background:#1d1d1b;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:14px}
.jg-n em{font-style:normal;font-weight:500;font-size:13px;color:#4a4a47;margin-left:auto}
.jg-cadre{border:1px solid #d6d6d3;border-radius:8px;padding:6px 4px;background:#fff;position:relative;touch-action:pan-y;user-select:none;-webkit-user-select:none}
.jg-l[data-jg="b"] .jg-cadre,.jg-l[data-jg="c"] .jg-cadre{border-color:#1d1d1b}
.jg-cadre [data-role="onglets"],.jg-cadre [data-page-titlebar]{display:none!important}
.jg-l:not([data-jg="a"]) [data-role="lectures"],.jg-l:not([data-jg="a"]) .jg-obj{display:none!important}
.jg-obj{margin:0 0 6px}
.jg-l:not([data-jg="a"]) [data-role^="pont-objectif"]{display:none!important}
.jg-pied .jg-cadre{border-style:dashed}
.jg-on{box-shadow:inset 0 0 0 2px #1d1d1b;border-radius:8px}
.jg-bulle{position:fixed;z-index:9;max-width:300px;background:#fff;border:1.5px solid #1d1d1b;border-radius:8px;padding:6px 10px;font:14px/1.3 system-ui,sans-serif;color:#1d1d1b;box-shadow:0 6px 18px rgba(0,0,0,.18);pointer-events:none}
.jg-bulle b{font-weight:700}.jg-bulle span{color:#3a3a38}
.jg-bulle[hidden]{display:none}
.jg-haut{position:absolute;top:-5px;bottom:-5px;width:2px;background:#1d1d1b;border-radius:2px;margin-left:-1px;pointer-events:none}
.jg-hautlab{position:absolute;top:-19px;font:600 12px/1 system-ui,sans-serif;color:#1d1d1b;white-space:nowrap;transform:translateX(-50%);pointer-events:none}
.jg-rempli{position:absolute;left:0;top:2px;bottom:2px;border-radius:999px;opacity:.85;pointer-events:none}
.jg-vide{background:none!important;box-shadow:inset 0 0 0 1px #8a8a86!important}
.jg-lent{display:flex;width:max-content;border:1px solid #cfcfcb;border-radius:999px;padding:2px;margin:0 4px 4px auto}
.jg-lent button{border:0;background:none;border-radius:999px;padding:3px 10px;font:13px/1.2 system-ui,sans-serif;color:#3a3a38}
.jg-lent [aria-checked="true"]{background:#1d1d1b;color:#fff}
.jg-cols{margin-top:6px}
.jg-voile{position:fixed;inset:0;background:rgba(20,20,18,.42);display:none;z-index:7}
.jg-feuille{position:fixed;left:0;right:0;bottom:0;top:90px;max-width:430px;margin:0 auto;background:#fff;border-radius:24px 24px 0 0;z-index:8;overflow-y:auto;padding:10px 14px 0;box-shadow:0 -4px 24px rgba(0,0,0,.18);color:#1d1d1b;font-family:system-ui,sans-serif}
.jg-feuille[hidden]{display:none}
.jg-fh{display:flex;align-items:center;gap:8px}.jg-fh h2{font-size:24px;margin:0}
.jg-x{margin-left:auto;width:36px;height:36px;border-radius:50%;border:0;background:#ececea;font-size:17px;color:#1d1d1b}
.jg-fa{display:flex;align-items:center;gap:8px;margin:4px 0 6px;flex-wrap:wrap;font-size:14px}.jg-fa b{font-size:22px}
.jg-us{margin-left:auto;font-size:13px;border:1px solid #bdbdb9;border-radius:999px;padding:2px 10px}
.jg-rz{display:flex;justify-content:center}
.jg-ar{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:14px;margin:4px 0 8px}.jg-ar span{display:inline-flex;align-items:center;gap:4px}
.jg-fp{position:sticky;bottom:0;display:flex;justify-content:space-between;align-items:center;background:#fff;padding:8px 0 10px;border-top:1px solid #ececea}
.jg-gout{display:flex;gap:4px;background:#f0f0ee;border-radius:999px;padding:3px}.jg-gout button{border:0;background:none;width:34px;height:30px;font-size:17px;color:#1d1d1b}
.jg-cmp{border:1px solid #bdbdb9;background:#fff;border-radius:999px;padding:6px 18px;font-size:15px;color:#1d1d1b}
.jg-pi{flex:none;display:inline-block;vertical-align:-2px}
`;

const fiche = (h) => `<section class="jg-feuille" data-role="fiche" role="dialog" aria-label="Fiche de ${S.esc(h.nom)}" data-jg-fiche-ouverte="${h.key}" hidden>
  <header class="jg-fh"><h2>${S.esc(h.nom)}</h2><button class="jg-x" data-role="fermer-fiche" aria-label="Fermer">✕</button></header>
  <div class="jg-fa"><span data-role="fiche-alpha">α <b>${fmt(h.alpha.min)}–${fmt(h.alpha.max)} %</b> lot ${fmt(h.lot)} %</span><span class="jg-us" data-role="usage">${h.usage}</span></div>
  <div class="jg-rz">${S.radar(h, { r: 82, fs: 12 })}</div>
  <div class="jg-ar" data-role="fiche-arome">${ORDRE_RADAR.filter((f) => h.radar[f].level).map((f) => `<span>${S.picto(f, 15)}${NOM[f]} ${h.radar[f].n}/${h.radar[f].of}</span>`).join('')}</div>
  <footer class="jg-fp"><span class="jg-gout" data-role="gout"><button aria-label="J'aime">♡</button><button aria-label="Exclure">⊘</button></span><button class="jg-cmp">Comparer</button></footer>
</section>`;

// Les données honnêtes des lectures : rien d'inventé ; les mots viennent du DOM figé (positions, aria-label,
// data-valeurs, data-crans) et, pour la fiche, des mots sourcés de Nugget (pack-fiches, via donnees.mjs).
const DONNEES = {
  NOM, ORDRE_RADAR,
  TON: Object.fromEntries(Object.entries(JETONS).map(([f, j]) => [f, { base: j.base, texte: j.texte }])),
  NUGGET: Object.fromEntries(ORDRE_RADAR.map((f) => [f, { n: nug.radar[f].n, of: nug.radar[f].of, mots: nug.mots.filter((w) => w.f === f).map((w) => w.m).slice(0, 3) }])),
};

const JS = fs.readFileSync(path.join(ici, 'lectures.js'), 'utf8');

function page(id) {
  const g = G[id], n = ids.indexOf(id) + 1;
  const a = g.a();
  const sec = (k, titre, type, html) => `<section class="jg-l" data-jg="${k}" data-jg-type="${type}"><h2 class="jg-n"><b>${n}${k}</b><span>${titre}</span>${k === 'a' ? `<em>${g.ou}</em>` : ''}</h2><div class="jg-cadre">${html}</div></section>`;
  const leg = legende(id === 'gr4' ? 'gr3' : id);
  return `<!doctype html>
<html lang="fr" data-theme="clair"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${id} · ${g.titre} · planche des graphes (24.10)</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/style.css"><style>${CSS}</style></head>
<body class="overflow-x-hidden font-sans bg-cave-950" data-jg-id="${id}">
${X('sprite.svg')}
<div class="jg-page">
<header class="jg-tete"><nav class="jg-nav" aria-label="Graphes">${ids.map((x, i) => `<a href="../${x}/etat.html"${x === id ? ' aria-current="page"' : ''}>${i + 1}</a>`).join('')}</nav>
<button class="jg-q" data-role="legende-bouton" aria-expanded="false" aria-label="légende">?</button></header>
<div class="jg-leg" data-role="legende" hidden>${leg.map((l) => `<p>${S.esc(l)}</p>`).join('')}<p>${n}a : tel qu'il est ; ${n}b et ${n}c : le même graphe, lu au doigt.</p></div>
<h1 class="jg-t">${g.titre} <small>${g.sous}</small></h1>
<p class="jg-ctx">Stout 16D · <span class="jg-h" data-houblon="nugget" data-jg-fiche="nugget">Nugget</span> <span class="jg-band" aria-label="familles de Nugget, d'après ses fiches">${BANDE}</span> 46 g à 60′ · US-05</p>
${sec('a', 'tel qu\'il est', 'a', a)}
${sec('b', g.b[0], g.b[1], a)}
${sec('c', g.c[0], g.c[1], a)}
${g.pied ? g.pied() : ''}
</div>
<div class="jg-bulle" hidden></div>
<div class="jg-voile"></div>
${fiche(nug)}
<script>window.JG_DONNEES=${JSON.stringify(DONNEES)};</script>
<script>${JS}</script>
</body></html>`;
}

for (const id of ids) {
  const html = page(id);
  if (/\b(undefined|NaN)\b|\[object /.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) { console.log(id + ' : fuite de valeur technique'); process.exit(1); }
  fs.mkdirSync(path.join(lot, id), { recursive: true });
  fs.writeFileSync(path.join(lot, id, 'etat.html'), html);
  console.log(id + ' · etat.html ' + Math.round(html.length / 1024) + ' ko');
}
