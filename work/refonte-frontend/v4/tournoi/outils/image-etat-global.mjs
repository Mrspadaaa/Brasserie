// Une seule grande image de ses choix et de chaque mini maquette qu'il a dite « bien », par écran, avec ses mots et ses
// réserves (24.10, soir : « Fait moi juste une image global, des vues que j'ai dit bien ou petite améliorations » ; puis
// « Version avec les mini maquettes choisi et dit bien »). Sources : le registre `work/refonte-frontend/v4/choix/ecrans.json`,
// ses verdicts notés `work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/elements-notes.json` (lots 5 à 22) et SPEC § 1.
// Usage : node image-etat-global.mjs <racine du dépôt> <sortie.png>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const R = process.argv[2];
const sortie = process.argv[3];
const puppeteer = createRequire(path.join(R, 'package.json'))('puppeteer-core');
const E = 'work/refonte-frontend/v4/ecran-1/';
const C = (p) => pathToFileURL(path.join(R, p)).href;
// s : choix (son choix), bien, reserve (bien, avec sa réserve), ajout (à ajouter), ouvert (à choisir).
const rangees = [
  ['Étape Houblons', [
    { t: 'base v4.10', s: 'choix', m: '« Ça c\'est le bon. »', i: E + 'base/captures/consolide-390.png' },
  ]],
  ['Ma bière', [
    { t: 'base v4.10', s: 'choix', m: '« Ça aussi »', i: E + 'base/captures/consolide-biere-390.png' },
    { t: 'radar m4', s: 'reserve', m: '« Radar: m4 h4 très bien »', r: 'attention à pas surchargé en texte ni en légende', i: E + 'fils9-radars/captures/m4-vue-390.png' },
    { t: 'radar h4', s: 'reserve', m: '« Radar: m4 h4 très bien »', r: 'attention à pas surchargé en texte ni en légende', i: E + 'fils9-radars/captures/h4-vue-390.png' },
  ]],
  ['Suggérer', [
    { t: 'q2b', s: 'choix', m: '« Ça oui, c\'est effectivement l\'un de mes choix »', i: E + 'fils15-s5-complexe/captures/q2b-b-390.png' },
    { t: 's5', s: 'reserve', m: '« s5 semble vraiment le mieux dans ce cas »', r: 'probablement très compliqué si plusieurs voies', i: E + 'fils14-suggestions-barres/captures/s5-b-390.png' },
    { t: 'gr5, les traits', s: 'bien', m: '« Ça c\'est top à mettre dans la vraie version »', i: E + 'fils24-graphes/captures/gr5-toucher.png' },
    { t: 'p4b, le « + »', s: 'bien', m: '« plutôt un + qui ajoute le houblon à la comparaison »', i: E + 'fils15-s5-complexe/captures/p4b-b-390.png' },
    { t: 'l5b, les barres', s: 'bien', m: '« Meilleures bar » ; « plus informative »', i: E + 'fils18-baseline/captures/l5b-etat-b-390.png' },
    { t: 'l8, la disposition', s: 'reserve', m: '« la manière dont sont disposés les choses j\'aime beaucoup !! »', r: 'visuellement horrible', i: E + 'fils18-baseline/captures/l8-etat-b-390.png' },
    { t: 'l8b', s: 'reserve', m: '« C\'est la meilleure version »', r: 'le glowing des icônes d\'arôme, c\'est non', i: E + 'fils18-baseline/captures/l8b-haut-390.png' },
    { t: 'l5f', s: 'reserve', m: '« pour l5f très bien »', r: 'manque des infos : Motueka paraît ultra fruité', i: E + 'fils18-baseline/captures/l5f-etat-b-390.png' },
  ]],
  ['Comparer', [
    { t: 'r6a', s: 'choix', m: '« r6a reste le meilleur […] avec les quelques petites améliorations »', i: E + 'fils22-comparer/captures/r6a-premier-ecran.png' },
    { t: 'r6n2', s: 'bien', m: '« r6n2 donne vraiment bien »', i: E + 'fils22-comparer/captures/r6n2-390.png' },
    { t: 'x3b, les étapes', s: 'ajout', m: '« Montrait vraiment l\'état du moment de l\'ajout facile »', r: 'dur à lire', i: E + 'fils21-choisir/captures/x3b-390.png' },
    { t: 'y3, panel OSU', s: 'reserve', m: '« la panel osu j\'aime assez »', r: 'la molette prend trop de place', i: E + 'fils21-choisir/captures/y3-premier-ecran.png' },
    { t: 'w2', s: 'bien', m: '« pas trop mal dans la manière de comparé »', i: E + 'fils21-choisir/captures/w2-390.png' },
    { t: 'v1', s: 'reserve', m: '« meilleur vu de comparaison sur des vrai valeur »', r: 'un peu trop austère', i: E + 'fils21-choisir/captures/v1-haut-390.png' },
    { t: 'p03, lot 5', s: 'reserve', m: '« J\'aime beaucoup la variante 3 »', r: 'manque l\'intervalle de confiance', i: E + 'fils5-comparer/captures/p03-comparer-390.png' },
    { t: 'p06, lot 6', s: 'bien', m: '« Comparé: p06 »', i: E + 'fils6-comparer/captures/p06-comparer-390.png' },
    { t: 'p02, le radar', s: 'reserve', m: '« radar p2 »', r: 'avec l\'intervalle de confiance', i: E + 'fils6-comparer/captures/p02-comparer-radar-390.png' },
  ]],
  ['Fiche', [
    { t: 'g1', s: 'choix', m: '« la v1 est la meilleure »', i: E + 'base/captures/consolide-fiche-390.png' },
    { t: 'fiche courte, Citra cryo', s: 'bien', m: '« Ça c\'est très bien »', i: E + 'fils13-carte-fiche/captures/g1-fiche-citra-390.png' },
    { t: 'flb5, par contraste', s: 'reserve', m: '« Ça j\'aime beaucoup »', r: 'encore un peu fouillis, pas 100 % clean', i: E + 'fils24-fiche-liste/captures/flb5-premier-ecran.png' },
  ]],
  ['Substituer', [
    { t: 'u4', s: 'choix', m: '« Substitution, ça serait plus du u4 »', r: '« trop centré ibu », aussi en dry hop ; Comparer facile', i: E + 'fils11-substitution/captures/u4-vue-390.png' },
    { t: 'u4, Arômes 16D', s: 'bien', m: '« Ça c\'est vraiment bien »', i: 'work/refonte-frontend/v4/choix/commentaires/captures/2026-10-24-u4-aromes-coche.png', pos: 'center 54%' },
    { t: 'u4 enrichi, ce soir', s: 'ajout', m: '« moins focus sur l\'ibu, substitution en fonction de l\'étape »', i: 'prototypes/houblons-v4/maquettes/parcours-substituer/captures-d127/d127-dryhop.png' },
  ]],
  ['Dryhopper', [
    { t: 'y1b', s: 'bien', m: '« y1b est de mon point de vue semble meilleur »', i: E + 'fils21-choisir/captures/y1b-premier-ecran.png' },
    { t: 'y1b, le critère', s: 'bien', m: '(y1b)', i: E + 'fils21-choisir/captures/y1b-critere.png' },
    { t: 'y1b, le défi', s: 'bien', m: '(y1b)', i: E + 'fils21-choisir/captures/y1b-defi.png' },
    { t: 'y1b, 20 bières tirées', s: 'bien', m: '(y1b)', i: E + 'fils21-choisir/captures/y1b-tire.png' },
    { t: 'a2b, la levure', s: 'reserve', m: '« voir ce que la levure change […] vraiment intéressant »', r: 'peut-être pas en main', i: E + 'fils21-choisir/captures/a2b-390.png' },
    { t: 'd1, tout ouvert', s: 'reserve', m: '« d1, tout ouvert était aussi intéressant »', r: 'trop bordélique', i: E + 'fils20-dryhop/captures/d1-ouvert-390.png' },
    { t: 'p4b2, le brassin en courbes', s: 'reserve', m: '« Ça j\'aime beaucoup »', r: 'encore assez peu lisible', i: E + 'fils23-dryhopper/passe4/captures/p4b2-premier-ecran.png' },
    { t: 'a1, plancher', s: 'ouvert', m: 'passe 4 à choisir (11 mini maquettes)', i: E + 'fils23-dryhopper/serie-a/passe2/captures/a1-premier-ecran.png' },
  ]],
  ['Levure', [
    { t: 'pas encore choisi', s: 'ouvert', m: 'écran au choix ouvert (a2b ci-dessus)', i: null },
  ]],
];
const STATUT = { choix: ['ton choix', '#1f6f3a'], bien: ['« bien »', '#1d4ed8'], reserve: ['« bien », avec réserve', '#7c3aed'], ajout: ['à ajouter', '#b45309'], ouvert: ['à choisir', '#6b7280'] };
const carte = (c) => `<figure><div class="cadre"${c.i ? '' : ' style="height:110px"'}>${c.i && fs.existsSync(path.join(R, c.i)) ? `<img src="${C(c.i)}" style="object-position:${c.pos ?? 'top'}">` : '<div class="vide">—</div>'}</div>
  <figcaption><span class="chip" style="background:${STATUT[c.s][1]}">${STATUT[c.s][0]}</span> <b>${c.t}</b><br><i>${c.m}</i>${c.r ? `<br><span class="res">réserve : ${c.r}</span>` : ''}</figcaption></figure>`;
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:28px 32px;background:#f4f6f1;color:#1b1f1a;font:16px/1.35 "Segoe UI",system-ui,sans-serif;width:2140px}
h1{font-size:34px;margin:0 0 4px}p.sous{margin:0 0 22px;color:#4b5563;font-size:18px}
section{display:grid;grid-template-columns:190px 1fr;gap:18px;align-items:start;border-top:2px solid #d6dbd2;padding:18px 0}
h2{font-size:24px;margin:6px 0 0}
.rang{display:flex;gap:22px 18px;flex-wrap:wrap}
figure{margin:0;width:300px}.cadre{width:300px;height:520px;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 1px 6px rgb(0 0 0/.15)}
.cadre img{width:100%;height:100%;object-fit:cover}.vide{display:grid;place-items:center;height:100%;font-size:40px;color:#9ca3af}
figcaption{margin-top:8px;font-size:15px}figcaption i{color:#374151}.res{color:#92400e;font-size:14px}
.chip{color:#fff;border-radius:999px;padding:2px 9px;font-size:13px;font-weight:600}
</style><h1>Tes mini maquettes choisies et dites « bien » · 24.10</h1><p class="sous">Une rangée par écran. Vert : ton choix ; bleu : « bien » ; violet : « bien », avec ta réserve ; orange : à ajouter ; gris : à choisir. Tes mots sous chaque capture.</p>
${rangees.map(([nom, cs]) => `<section><h2>${nom}</h2><div class="rang">${cs.map(carte).join('')}</div></section>`).join('')}`;
const tmp = path.join(path.dirname(sortie), '.etat-global.html');
fs.writeFileSync(tmp, html);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 2204, height: 1200, deviceScaleFactor: 1 });
await p.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle0' });
await p.screenshot({ path: sortie, fullPage: true });
await b.close();
fs.unlinkSync(tmp);
console.log('ok', sortie);
