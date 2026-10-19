// w3b · preuve du geste au doigt (puppeteer-core, écran tactile émulé, 390 × 844). La cible du floral, posée à
// 1 cran (« je la veux plus floral »), glissée jusqu'à 2,5 crans en gardant le doigt (la loupe du demi-cran),
// puis relâchée. Ensuite, un toucher à la fois : Pomona, après fermentation, le plan osé, ensemble, trois tirages.
// Valeurs lues à l'écran (window.__releve) avant, pendant, après.
// Usage : node jouer-w3b.mjs  →  w3b/geste-w3b.json, captures/w3b-avant.png, w3b-pendant.png, w3b-apres.png, …
import { ouvrir, preuve, attendre } from '../y1/socle/jouer.mjs';

const J = await ouvrir('w3b/etat.html');
const avant = await J.releve();
await J.capture('w3b-avant');
const z = await J.p.evaluate(() => { const r = document.querySelector('#prof [data-famille="floral"] .w-z').getBoundingClientRect(); return { x: r.left, y: r.top + r.height / 2, w: r.width }; });
const px = z.w / 5, x = (c) => z.x + c * px;
// le doigt posé sur la cible (1 cran), glissé jusqu'à 2,5 crans, gardé
await J.glisser([[x(1), z.y], [x(1.8), z.y], [x(2.5), z.y]], { garder: true, pas: 10, delai: 20 });
const pendant = await J.releve();
const loupe = await J.p.evaluate(() => {
  const l = document.getElementById('loupe'), r = l.getBoundingClientRect();
  const t = [...document.querySelectorAll('#loupe-r i:not(.zone)')].map((i) => i.getBoundingClientRect().left).sort((a, b) => a - b);
  const pas = t.slice(1).map((v, k) => v - t[k]).filter((d) => d > 1);
  const zr = document.querySelector('#prof [data-famille="floral"] .w-z').getBoundingClientRect();
  return { visible: !l.hidden, texte: document.getElementById('loupe-t').textContent, pasLoupe: pas.length ? Math.round(Math.min(...pas) * 10) / 10 : null, pasPiste: Math.round((zr.width / 5 / 2) * 10) / 10, haut: Math.round(r.top), doigt: Math.round(document.querySelector('#prof [data-famille="floral"]').getBoundingClientRect().top) };
});
loupe.grossissement = loupe.pasLoupe && loupe.pasPiste ? Math.round((loupe.pasLoupe / loupe.pasPiste) * 10) / 10 : null;
await J.capture('w3b-pendant');
await J.lever();
const apres = await J.releve();
await J.capture('w3b-apres');
// un toucher à la fois
const touche = async (sel) => { const b = await J.boite(sel); await J.toucher(b.cx, b.cy); return J.releve(); };
const pomona = await touche('#phrase [data-fixe="l"]');
await J.capture('w3b-pomona');
const apresFerm = await touche('#phrase [data-fixe="m"]');
const ose = await touche('[data-reglage="plan"][data-v="ose"]');
await J.capture('w3b-ose');
const ensemble = await touche('#phrase [data-fixe="a"]');
await J.capture('w3b-ensemble');
await touche('#tire'); await touche('#tire'); const tirage = await touche('#tire');
// un tirage ne change pas tant que rien ne change : on relit sans toucher
const relu = await J.releve();
await J.capture('w3b-tirage');
const stable = JSON.stringify(tirage.tirTexte) === JSON.stringify(relu.tirTexte);
preuve('w3b', 'geste-w3b', { avant, pendant, loupe, apres, pomona, apresFerm, ose, ensemble, tirage, tirageStable: stable, erreurs: J.erreurs });
const L = (n, v) => console.log(n.padEnd(11), 'cible', JSON.stringify(v.cible).padEnd(26), '|', v.verdict.padEnd(26), '|', v.phrase, '| floral', v.crans && v.crans.floral, 'barre', v.largeurs.floral + ' px');
L('avant', avant); L('pendant', pendant); L('après', apres); L('Pomona', pomona); L('après ferm.', apresFerm); L('osé', ose); L('ensemble', ensemble);
console.log('loupe', JSON.stringify(loupe));
console.log('tirage', tirage.tirTexte, '| stable', stable);
console.log('erreurs', J.erreurs.length ? J.erreurs : 'aucune');
await J.fermer();
