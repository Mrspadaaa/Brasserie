// Socle de la série dgb (lot « Dryhopper, avec ses retours », 24.10 soir).
// La base : l'écran Dryhopper de la maquette jouable, tel qu'il se joue (« Pour le dryhopping, la meilleure version est
// celle de l'app jouable mais il lui faut quelques améliorations ») : `prototypes/houblons-v4/maquettes/parcours/
// dryhopper/etat.html`, sa p4b2f rendue sur le moteur en direct. La page de chaque variante EST cette page (même
// bundle, même route, même moteur), plus une greffe : un script posé après le bundle, qui attend l'écran, puis ajoute
// ses éléments sans rien retirer (classes « dgbN- », L26 ; assemblage par split/join sur des ancres uniques).
// Les trois plans de w2 (« Ça c'est vraiment très intéressant ») tenus à UN facteur libre, le moment (D98) : même
// Idaho 7, même 4 g/L, même US-05 ; Sage = 0′ (rien à froid), Franc = actif · 2 j (★ du moteur pour sa demande :
// floral sans résineux), Osé = après · 3 j (le plus d'arôme, le résineux monte). Leurs chiffres ne sont pas recopiés :
// la greffe pose le rail de l'écran sur chaque plan, lit ce que le moteur y affiche (bandeau, 12 barres), puis revient.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RACINE = path.resolve(LOT, '../../../../..');
const BASE = path.join(RACINE, 'prototypes/houblons-v4/maquettes/parcours/dryhopper/etat.html');
const ASSETS = '../../../../../../prototypes/houblons-v4/maquettes/parcours/assets/';

function une(html, ancre) {
  const n = html.split(ancre).length - 1;
  if (n !== 1) throw new Error('ancre « ' + ancre.slice(0, 50) + ' » trouvée ' + n + ' fois');
}
// script(G) est appelé une fois les trois plans lus ; G = window.DGB.
export function assembler({ id, nom, chaleur, css, script }) {
  let h = fs.readFileSync(BASE, 'utf8');
  const remplacer = (a, b) => { une(h, a); h = h.split(a).join(b); };
  remplacer('<title>Stout export · Houblons</title>', '<title>' + id + ' · ' + nom + ' (' + chaleur + ', sur Dryhopper de la maquette jouable)</title>');
  remplacer('href="../assets/style.css"', 'href="' + ASSETS + 'style.css"');
  remplacer('src="../assets/parcours.js"', 'src="' + ASSETS + 'parcours.js"');
  remplacer('<body data-route="dryhopper"', '<body data-route="dryhopper" data-variante="' + id + '" data-base="maquette-jouable/dryhopper"');
  remplacer('</body>', '<style>\n' + css + '\n</style>\n<script defer>\n(' + CLIENT.toString() + ')(' + script.toString() + ');\n</script>\n</body>');
  fs.mkdirSync(path.join(LOT, id), { recursive: true });
  fs.writeFileSync(path.join(LOT, id, 'etat.html'), h);
  return h;
}

// Le client commun. Attend l'écran rendu par le bundle, lit les trois plans sur le moteur, puis appelle la variante.
function CLIENT(variante) {
  var PLANS = [
    { l: 'S', n: 'Sage', k: 12, crans: 1 },
    { l: 'F', n: 'Franc', k: 15, crans: 2 },
    { l: 'O', n: 'Osé', k: 21, crans: 3 },
  ];
  var dors = function (ms) { return new Promise(function (r) { setTimeout(r, ms || 0); }); };
  function rail() { return document.querySelector('[role="slider"].pq-dry-rail'); }
  function cur() { var r = rail(); return r ? +r.getAttribute('aria-valuenow') : -1; }
  // Poser le rail de l'écran sur le moment k, par ses propres touches, un cran par rendu.
  async function aller(k) {
    for (var n = 0; n < 40 && cur() !== k; n++) {
      var avant = cur();
      rail().dispatchEvent(new KeyboardEvent('keydown', { key: k > avant ? 'ArrowRight' : 'ArrowLeft', bubbles: true, cancelable: true }));
      for (var w = 0; w < 60 && cur() === avant; w++) await dors(4); // attendre le rendu de ce cran avant le suivant
    }
  }
  var ORANGE = 'rgb(194, 65, 12)';
  // Ce que l'écran affiche au moment tenu : bandeau (texte et couleur), 12 barres (texte, gain, couleur de barre).
  function lire() {
    var r = rail(), o = { k: cur(), m: r.getAttribute('aria-valuetext'), x: parseFloat(r.querySelector('.pq-dry-pouce').style.left), call: {}, bars: {} };
    document.querySelectorAll('.pq-dry-call > span').forEach(function (s) {
      if (s.dataset.bandeau) o.call[s.dataset.bandeau] = { f: s.dataset.bandeau, t: s.textContent.trim(), c: s.style.color };
      else { var t = s.textContent.replace('IBU', '').trim(); o.call.ibu = { t: t, trop: getComputedStyle(s).color === ORANGE || /trop/.test(s.className) }; }
    });
    document.querySelectorAll('.pq-dry-ba').forEach(function (b) {
      var v = b.querySelector('.pq-dry-v'), n = v.querySelector('[data-valeur]'), bar = b.querySelector('.pq-dry-b');
      o.bars[b.dataset.ligne] = { t: v.textContent.trim(), c: v.style.color, g: n ? parseFloat(n.dataset.valeur) : null, ba: bar ? bar.style.background : '' };
    });
    return o;
  }
  // Une greffe posée dans l'écran React reste posée : si un rendu la détache, on la remet à sa place.
  var gardes = [];
  function garder(el, placer) { gardes.push({ el: el, placer: placer }); placer(el); }
  function suivre(cb) { var der = -2; new MutationObserver(function () { var i = cur(); if (i !== der && i >= 0) { der = i; cb(i); } }).observe(document.getElementById('parcours'), { attributes: true, subtree: true, attributeFilter: ['aria-valuenow'] }); der = cur(); cb(der); }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html; return t.content.firstElementChild; }
  function pi(f, s) { return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" data-famille="' + f + '" role="img" aria-label="' + f + '" style="flex:none"><use href="#p-' + f + '"/></svg>'; }
  window.DGB = { el: el, PLANS: PLANS, cur: cur, aller: aller, lire: lire, suivre: suivre, garder: garder, pi: pi, rail: rail, pret: false };
  (async function () {
    for (var n = 0; n < 200 && !(rail() && document.querySelector('.pq-dry-ba')); n++) await dors(25);
    // L'écran se pose d'abord sur un cran, puis s'ouvre sur ★ : attendre que le rail ne bouge plus.
    for (var st = 0, prec = cur(); st < 8; ) { await dors(60); if (cur() === prec) st++; else { st = 0; prec = cur(); } }
    var depart = cur();
    for (var p = 0; p < PLANS.length; p++) { await aller(PLANS[p].k); Object.assign(PLANS[p], lire()); }
    await aller(depart);
    variante(window.DGB);
    new MutationObserver(function () { gardes.forEach(function (g) { if (!g.el.isConnected) g.placer(g.el); }); }).observe(document.getElementById('parcours'), { childList: true, subtree: true });
    window.DGB.pret = true; document.body.setAttribute('data-greffe-prete', '1');
  })();
}
