// Une seule grande image de ses choix et de ce qu'il a dit « bien », par écran, avec ses mots (24.10, soir : « Fait moi juste une
// image global, des vues que j'ai dit bien ou petite améliorations »). Usage : node image-etat-global.mjs <racine du dépôt> <sortie.png>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const R = process.argv[2];
const sortie = process.argv[3];
const puppeteer = createRequire(path.join(R, 'package.json'))('puppeteer-core');
const E = 'work/refonte-frontend/v4/ecran-1/';
const C = (p) => pathToFileURL(path.join(R, p)).href;
const rangees = [
  ['Étape Houblons', [
    { t: 'base v4.10', s: 'choix', m: '« Ça c\'est le bon. »', i: E + 'base/captures/consolide-390.png' },
  ]],
  ['Ma bière', [
    { t: 'base v4.10', s: 'choix', m: '« Ça aussi »', i: E + 'base/captures/consolide-biere-390.png' },
    { t: 'radar m4', s: 'bien', m: '« Radar: m4 h4 très bien »', i: E + 'base/captures/consolide-biere-radar-390.png' },
  ]],
  ['Suggérer', [
    { t: 'q2b', s: 'choix', m: '« Ça oui, c\'est effectivement l\'un de mes choix »', i: E + 'fils15-s5-complexe/captures/q2b-b-390.png' },
    { t: 'barres l5b', s: 'bien', m: '« Meilleures bar »', i: E + 'fils18-baseline/captures/l5b-etat-b-390.png' },
  ]],
  ['Comparer', [
    { t: 'r6a', s: 'choix', m: '« r6a reste le meilleur […] avec les quelques petites améliorations »', i: E + 'fils22-comparer/captures/r6a-premier-ecran.png' },
    { t: 'x3b, les étapes', s: 'ajout', m: '« Montrait vraiment l\'état du moment de l\'ajout facile »', i: E + 'fils21-choisir/captures/x3b-390.png' },
    { t: 'r6n2', s: 'bien', m: '« r6n2 donne vraiment bien »', i: E + 'fils22-comparer/captures/r6n2-390.png' },
    { t: 'y3, panel OSU', s: 'bien', m: '« la panel osu j\'aime assez »', i: E + 'fils21-choisir/captures/y3-390.png' },
    { t: 'w2', s: 'bien', m: '« pas trop mal dans la manière de comparé »', i: E + 'fils21-choisir/captures/w2-390.png' },
    { t: 'v1', s: 'bien', m: '« meilleur vu de comparaison sur des vrai valeur »', i: E + 'fils21-choisir/captures/v1-390.png' },
  ]],
  ['Fiche', [
    { t: 'g1', s: 'choix', m: '« la v1 est la meilleure »', i: E + 'base/captures/consolide-fiche-390.png' },
    { t: 'fiche courte, Citra cryo', s: 'bien', m: '« Ça c\'est très bien »', i: E + 'fils13-carte-fiche/captures/g1-fiche-citra-390.png' },
  ]],
  ['Substituer', [
    { t: 'u4', s: 'choix', m: '« bien mais trop centré ibu […] aussi en dry hop » : à améliorer', i: E + 'fils11-substitution/captures/u4-vue-390.png' },
    { t: 'u4, Arômes 16D', s: 'bien', m: '« Ça c\'est vraiment bien »', i: 'work/refonte-frontend/v4/choix/commentaires/captures/2026-10-24-u4-aromes-coche.png', pos: 'center 54%' },
  ]],
  ['Dryhopper', [
    { t: 'y1b', s: 'bien', m: '« y1b est de mon point de vue semble meilleur »', i: E + 'fils21-choisir/captures/y1b-390.png' },
    { t: 'a1, plancher', s: 'ouvert', m: 'passe 4 à choisir (11 mini maquettes)', i: E + 'fils23-dryhopper/serie-a/passe2/captures/a1-premier-ecran.png' },
  ]],
  ['Levure', [
    { t: 'pas encore choisi', s: 'ouvert', m: 'écran au choix ouvert', i: null },
  ]],
];
const STATUT = { choix: ['ton choix', '#1f6f3a'], bien: ['« bien »', '#1d4ed8'], ajout: ['à ajouter', '#b45309'], ouvert: ['à choisir', '#6b7280'] };
const carte = (c) => `<figure><div class="cadre"${c.i ? "" : " style=\"height:110px\""}>${c.i && fs.existsSync(path.join(R, c.i)) ? `<img src="${C(c.i)}" style="object-position:${c.pos ?? 'top'}">` : '<div class="vide">—</div>'.replace("<div", "<div style=\"height:110px\"")}</div>
  <figcaption><span class="chip" style="background:${STATUT[c.s][1]}">${STATUT[c.s][0]}</span> <b>${c.t}</b><br><i>${c.m}</i></figcaption></figure>`;
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:28px 32px;background:#f4f6f1;color:#1b1f1a;font:16px/1.35 "Segoe UI",system-ui,sans-serif;width:2140px}
h1{font-size:34px;margin:0 0 4px}p.sous{margin:0 0 22px;color:#4b5563;font-size:18px}
section{display:grid;grid-template-columns:190px 1fr;gap:18px;align-items:start;border-top:2px solid #d6dbd2;padding:18px 0}
h2{font-size:24px;margin:6px 0 0}
.rang{display:flex;gap:18px;flex-wrap:wrap}
figure{margin:0;width:300px}.cadre{width:300px;height:520px;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 1px 6px rgb(0 0 0/.15)}
.cadre img{width:100%;height:100%;object-fit:cover}.vide{display:grid;place-items:center;height:100%;font-size:40px;color:#9ca3af}
figcaption{margin-top:8px;font-size:15px}figcaption i{color:#374151}.chip{color:#fff;border-radius:999px;padding:2px 9px;font-size:13px;font-weight:600}
</style><h1>L'état global · 24.10</h1><p class="sous">Tes écrans choisis (vert), ce que tu as dit « bien » (bleu), ce que tu as demandé d'ajouter (orange), et ce qui reste à choisir (gris). Tes mots sous chaque capture.</p>
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
