// Socle de la série dga (lot « Dryhopper, avec ses retours », 24.10 soir).
// La base, d'après lui : « Pour le dryhopping, la meilleure version est celle de l'app jouable mais il lui faut quelques
// améliorations ». Chaque page charge donc l'écran Dryhopper de la maquette jouable TEL QU'IL SE JOUE (React, moteur en
// direct : prototypes/houblons-v4/maquettes/parcours/assets/parcours.js, route dryhopper), sans rien en copier, et y
// greffe sa frise :
//   - le rail fin et la rangée « 1 j 2 j 3 j 7 j » de la maquette sont retirés de l'écran, mais restent l'état : la greffe
//     les pilote au clavier (flèches sur le vrai rail, role="slider"), exactement comme un utilisateur ; tout le reste
//     (courbes, aire du floral, quatre chiffres, barres, levure, pied) est celui de la maquette, recalculé par son moteur ;
//   - au chargement, le pont parcourt les crans du vrai rail et lit, pour chacun, son libellé (aria-valuetext) et le floral
//     du bandeau : la frise n'affiche que des valeurs du moteur de la maquette, rien de recopié ni d'inventé ;
//   - window.DGAB : { M (les crans lus), x(k) (même géométrie que le rail : ébullition 0–44, WP 44–52, actif 52–76,
//     après 76–100), cur(), aller(k), quand(fn), idx(lib) }.
// Classes de chaque greffe préfixées dgaN- (L26). La page s'écrit dans fils24-dryhopper-greffes/<id>/etat.html (L17).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAQ = '../../../../../../prototypes/houblons-v4/maquettes/parcours';
if (!fs.existsSync(path.resolve(LOT, 'dga1', MAQ, 'assets/parcours.js'))) throw new Error('maquette jouable introuvable');

function pont() {
  var B = window.DGAB = { pret: false, M: [], fns: [] };
  var SEG = [[0, 44], [44, 52], [52, 76], [76, 100]];
  function rail() { return document.querySelector('.pq-dry-rail'); }
  B.rail = rail;
  B.cur = function () { return +rail().getAttribute('aria-valuenow'); };
  B.quand = function (fn) { B.fns.push(fn); };
  B.idx = function (lib) { for (var k = 0; k < B.M.length; k++) if (B.M[k].lib === lib) return k; return -1; };
  B.x = function (k) {
    var s = B.M[k].seg, du = []; B.M.forEach(function (m, j) { if (m.seg === s) du.push(j); });
    var a = SEG[s][0], b = SEG[s][1]; return du.length === 1 ? (a + b) / 2 : a + (b - a) * (0.06 + 0.88 * du.indexOf(k) / (du.length - 1));
  };
  // Aller au cran k : une flèche à la fois sur le vrai rail, jusqu'à y être (le dernier appel gagne).
  var enCours = null, court = false;
  function attendre(i) {
    return new Promise(function (ok) { var n = 0; (function v() { if (B.cur() !== i || n++ > 40) ok(); else if (n < 4) Promise.resolve().then(v); else setTimeout(v, 0); })(); });
  }
  B.aller = function (k) {
    B.cible = k;
    if (court) return enCours;
    court = true;
    var p = (async function () {
      while (B.cible != null && B.cur() !== B.cible) {
        var i = B.cur();
        rail().dispatchEvent(new KeyboardEvent('keydown', { key: B.cible > i ? 'ArrowRight' : 'ArrowLeft', bubbles: true, cancelable: true }));
        await attendre(i);
        if (B.cur() === i) break;
      }
      court = false;
    })();
    enCours = p;
    return p;
  };
  function lire() {
    var r = rail(), lib = r.getAttribute('aria-valuetext'), b = document.querySelector('[data-bandeau="floral"]'), fl = b ? b.textContent.trim() : '?';
    var seg = /′$/.test(lib) ? 0 : lib === 'whirlpool' ? 1 : lib.indexOf('actif') === 0 ? 2 : 3, j = seg >= 2 ? +lib.split('· ')[1].split(' ')[0] : 0;
    var n = parseFloat(fl.replace('−', '-').replace(/[~≈+]/g, ''));
    // « sans gain » : la marque de la maquette sur ses boutons de jours (pointillés : le floral ne bouge plus d'un jour au suivant) ;
    // 5 j n'a pas de bouton : sans gain si 7 j l'est (le gain ne revient pas après un palier).
    var bt = seg >= 2 ? document.querySelector('.pq-dry-jr button[data-jour="' + (j === 5 ? 7 : j) + '"]') : null;
    return { lib: lib, seg: seg, jours: j, court: seg === 1 ? 'WP' : seg >= 2 ? j + ' j' : lib, fl: fl, flv: isNaN(n) ? null : n, interp: fl.charAt(0) === '≈', sg: !!(bt && bt.classList.contains('pq-dry-sg')) };
  }
  window.P4ETAT = function () { var m = lire(); return { m: m.lib, fl: m.fl, ibu: (document.querySelector('[data-role="ibu-dry"]') || {}).textContent }; };
  (function demarrer() {
    if (!rail()) return setTimeout(demarrer, 30);
    setTimeout(async function () {
      var k0 = B.cur(), N = +rail().getAttribute('aria-valuemax');
      for (var k = 0; k <= N; k++) { await B.aller(k); B.M[k] = lire(); }
      await B.aller(k0);
      new MutationObserver(function () { var i = B.cur(); B.fns.forEach(function (f) { f(i, B.M[i]); }); }).observe(rail(), { attributes: true, attributeFilter: ['aria-valuenow'] });
      document.body.classList.add('dga-greffe');
      if (window.DGA_INIT) window.DGA_INIT(B);
      B.fns.forEach(function (f) { f(B.cur(), B.M[B.cur()]); });
      B.pret = true;
    }, 120);
  })();
}

// v : { id, nom, chaleur, css, gabarit (HTML de la greffe), apres (sélecteur de la maquette après lequel la poser),
//       script (fonction appelée avec DGAB une fois les crans lus et la greffe posée) }.
export function variante(v) {
  const html = '<!doctype html>\n<html lang="fr" data-theme="clair">\n  <head>\n    <meta charset="UTF-8" />\n'
    + '    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />\n    <link rel="icon" href="data:," />\n'
    + '    <title>' + v.id + ' · ' + v.nom + ' · Dryhopper</title>\n'
    + '    <link rel="preconnect" href="https://fonts.googleapis.com" />\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n'
    + '    <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />\n'
    + '    <!-- ' + v.id + ' · ' + v.chaleur + ' · base : l\'écran Dryhopper de la maquette jouable, chargé tel quel ; greffe : ' + v.nom + ' -->\n'
    + '    <style>\n/* La maquette garde son rail et ses jours comme état ; la greffe les remplace à l\'écran. */\n'
    + 'body.dga-greffe .pq-dry-geste, body.dga-greffe .pq-dry-jr { position:absolute !important; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); margin:0 !important; }\n'
    + v.css + '\n    </style>\n  </head>\n'
    + '  <body data-route="dryhopper" class="overflow-x-hidden font-sans bg-cave-950 ' + v.id + '">\n    <div id="parcours"></div>\n'
    + '    <link rel="stylesheet" href="' + MAQ + '/assets/style.css" />\n    <script defer src="' + MAQ + '/assets/parcours.js"></script>\n'
    + '    <template id="dga-gabarit">' + v.gabarit + '</template>\n'
    + '    <script>\n(' + pont.toString() + ')();\n'
    + 'window.DGA_INIT = function (B) {\n  var t = document.getElementById(\'dga-gabarit\'), ou = document.querySelector(' + JSON.stringify(v.apres) + ');\n'
    + '  ou.parentNode.insertBefore(t.content.cloneNode(true), ou.nextSibling);\n  (' + v.script.toString() + ')(B);\n};\n    </script>\n  </body>\n</html>\n';
  fs.mkdirSync(path.join(LOT, v.id), { recursive: true });
  fs.writeFileSync(path.join(LOT, v.id, 'etat.html'), html);
  return html;
}
