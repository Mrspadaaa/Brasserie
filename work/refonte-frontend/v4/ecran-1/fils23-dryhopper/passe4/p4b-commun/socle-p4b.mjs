// Socle de la voie dh4b (passe 4 de Dryhopper, variantes chaudes p4b1 à p4b5, 24.10).
// Il reprend tel quel le socle d'a1 (passe 3 : données du moteur, pictos au trait, fiche à l'appui long,
// en-tête, contexte, lentille au style / absolu, légende) et y ajoute le rail d'a1 en composant réutilisable :
// même géométrie (13 crans d'ébullition par 5′, whirlpool, 5 crans actif, 5 crans après), même geste au doigt,
// même loupe sous le pouce. Chaque variante choisit où le rail se pose et ce que sa loupe montre.
// Classes du rail préfixées « p4r- » (L26) ; assemblage par concaténation, jamais par String.replace.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { page, DONNEES, OUTIL } from '../../serie-a/passe3/socle.mjs';

export { DONNEES, OUTIL };
export const ici = path.dirname(fileURLToPath(import.meta.url));
export const PASSE4 = path.resolve(ici, '..');

export const CHEV = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
// Deux signes au trait, sans légende : la flamme (ce que la chaleur emporte) et les bulles (ce que le CO₂ emporte).
export const FLAMME = (s) => '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.57" stroke-linecap="round" stroke-linejoin="round" aria-label="chaleur" role="img"><path d="M12 22c4.4 0 7-2.9 7-6.6 0-3-1.6-4.8-3-6.4-.4 1.7-1.3 2.6-2.4 3C13.9 8.4 13 5.4 10 2c-.6 4-2.5 5.5-4 7.3C4.7 10.8 5 13 5 15.4 5 19.1 7.6 22 12 22Z"/><path d="M12 22c-2 0-3.2-1.5-3.2-3.4 0-1.6 1-2.6 2-3.6.6 1.3 1.5 1.7 2.4 1.8.6-.9.8-2 .8-2.8 1.3 1 1.5 2.3 1.5 3.7 0 2.3-1.6 4.3-3.5 4.3Z"/></svg>';
export const BULLES = (s) => '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.57" stroke-linecap="round" aria-label="CO₂ de fermentation" role="img"><circle cx="8" cy="16" r="4.5"/><circle cx="16.5" cy="8.5" r="3.5"/><circle cx="17" cy="18" r="2"/><path d="M8 3v2M14 2.5l-.5 1.5"/></svg>';

export const CSS_RAIL = `
.p4r-geste { position:relative; touch-action:none; }
.p4r { position:relative; height:26px; cursor:pointer; }
.p4r-z { position:absolute; top:10px; height:6px; border-radius:2px; background:#c9cdd6; }
.p4r-z.p4r-z1, .p4r-z.p4r-z3 { background:#aeb4c1; }
.p4r-calc { position:absolute; top:11px; width:4px; height:4px; margin-left:-2px; border-radius:50%; background:var(--encre); opacity:.55; }
.p4r-cran { position:absolute; top:6px; width:1px; height:14px; background:var(--encre); }
.p4r-pouce { position:absolute; top:3px; width:20px; height:20px; margin-left:-10px; border-radius:50%; background:var(--encre); border:3px solid #fff; box-shadow:0 0 0 1px var(--encre); z-index:2; }
.p4r-pl { position:absolute; bottom:24px; left:50%; transform:translateX(-50%); white-space:nowrap; display:inline-flex; align-items:center; gap:5px; background:var(--encre); color:#fff; font:600 13px var(--sans); padding:1px 8px; border-radius:10px; pointer-events:none; }
.p4r-pl .s-pt { border:1.5px solid #fff; }
.p4r-geste.p4r-touche .p4r-pl { visibility:hidden; }
.p4r-loupe { position:absolute; left:0; right:0; top:-66px; height:60px; display:none; background:#fff; border:1px solid #c9cad2; border-radius:8px; overflow:hidden; box-shadow:0 8px 24px -12px rgba(22,22,26,.4); z-index:5; }
.p4r-geste.p4r-touche .p4r-loupe { display:block; }
.p4r-loupe > span { position:absolute; top:4px; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:2px; font:600 13px var(--mono); color:var(--gris); }
.p4r-loupe > span em { font-style:normal; padding:0 5px; border-radius:4px; white-space:nowrap; }
.p4r-loupe > span.p4r-ici em { color:#fff; background:var(--encre); }
.p4r-loupe > span i { display:block; width:34px; height:6px; background:#f1f2f5; border-radius:2px; position:relative; overflow:hidden; }
.p4r-loupe > span i b { position:absolute; left:0; top:0; bottom:0; background:#bf86d6; border-radius:2px; }
.p4r-loupe > span.p4r-ip i b { opacity:.5; }
.p4r-loupe > span small { font:600 12px var(--mono); color:#9840bc; }
.p4r-loupe > span small.p4r-amer { color:var(--acc); }
.p4r-loupe > span small.p4r-co { color:#3b5f8a; }
.p4r-loupe > span small.p4r-ok { color:#2f6b5f; }
`;

// Le client du rail : window.P4 = { x, cw, seg, jours, best, SEG, court, mesure, rail }.
function railClient() {
  var S = window.S, D = S.D, N = S.N, SEG = [[0, 44], [44, 52], [52, 76], [76, 100]];
  function seg(p) { return p.id.charAt(0) === 'b' ? 0 : p.id === 'wp' ? 1 : p.id.indexOf('dryActive') === 0 ? 2 : 3; }
  function jours(p) { return +(p.id.split('|')[1] || 0); }
  function x(i) { var s = seg(D[i]), idx = []; for (var k = 0; k <= N; k++) if (seg(D[k]) === s) idx.push(k); var n = idx.length, a = SEG[s][0], b = SEG[s][1]; return n === 1 ? (a + b) / 2 : a + (b - a) * (0.06 + 0.88 * idx.indexOf(i) / (n - 1)); }
  function cw(k) { var g = 1e9; if (k > 0) g = Math.min(g, x(k) - x(k - 1)); if (k < N) g = Math.min(g, x(k + 1) - x(k)); return Math.min(4.2, g * 0.85); }
  // Le meilleur pour sa demande du 18.10 : floral gagné moins résineux gagné, amertume dans 50–70 ; à 0,05 près, le plus tôt.
  var score = function (p) { return S.d(p, 'floral') - S.d(p, 'resin'); }, best = -1;
  for (var k = 0; k <= N; k++) { if (S.ibu(D[k]).n > 70) continue; if (best < 0 || score(D[k]) > score(D[best]) + 0.05) best = k; }
  function court(p) { return p.court === 'wp' ? 'WP' : p.id.indexOf('dry') === 0 ? p.lib.split(' · ')[1] : p.court; }
  // La mesure publiée du moment (E03 McCabe 2023 en actif, E10 Titus 2021 après) ; sinon « jamais mesuré à ce moment ».
  function mesure(p) {
    var s = seg(p);
    if (s === 2) return { ok: true, html: '<b>mesuré</b> linalol <span data-nature="mesure" data-source="E03 McCabe 2023">38 µg/L</span> (McCabe 2023)', court: '38 µg/L' };
    if (s === 3) return { ok: true, html: '<b>mesuré</b> 1 h ≈ <span data-nature="mesure" data-source="E10 Titus 2021">96 h</span> au nez (Titus 2021)', court: '1 h ≈ 96 h' };
    return { ok: false, html: 'jamais mesuré à ce moment', court: '?' };
  }
  // Le rail : el reçoit le geste. o = { valeur, surPoser(i, p), loupe(i) → [{ k, html }] ou null, calcules: true (points calculés marqués) }.
  function rail(el, o) {
    el.classList.add('p4r-geste');
    el.innerHTML = '<div class="p4r-loupe" aria-hidden="true"></div>'
      + '<div class="p4r" role="slider" tabindex="0" data-pas="5" aria-label="Moment de l\'ajout" aria-valuemin="0" aria-valuemax="' + N + '" aria-valuenow="0" aria-valuetext="">'
      + '<span class="p4r-z p4r-z0" style="left:0;width:44%"></span><span class="p4r-z p4r-z1" style="left:44%;width:8%"></span><span class="p4r-z p4r-z2" style="left:52%;width:24%"></span><span class="p4r-z p4r-z3" style="left:76%;width:24%"></span>'
      + (o.calcules ? D.map(function (p, k) { return p.interp ? '' : '<i class="p4r-calc" style="left:' + x(k) + '%"></i>'; }).join('') : '')
      + '<span class="p4r-pouce" data-couleur="#e80030" data-serie="Idaho 7"><span class="p4r-pl"><i class="s-pt"></i><span class="p4r-pl-t"></span></span></span></div>';
    var r = el.querySelector('.p4r'), loupe = el.querySelector('.p4r-loupe'), pouce = el.querySelector('.p4r-pouce'), pl = el.querySelector('.p4r-pl'), plt = el.querySelector('.p4r-pl-t');
    function cur() { return +r.getAttribute('aria-valuenow'); }
    function graduations(i) {
      r.querySelectorAll('.p4r-cran').forEach(function (c) { c.remove(); }); loupe.innerHTML = '';
      if (!el.classList.contains('p4r-touche')) return;
      for (var k = 0; k <= N; k++) if (seg(D[k]) === seg(D[i])) { var c = document.createElement('i'); c.className = 'p4r-cran'; c.style.left = x(k) + '%'; r.insertBefore(c, r.firstChild); }
      var items = o.loupe ? o.loupe(i) : null; if (!items) return;
      var wl = loupe.clientWidth;
      items.forEach(function (it) { var s = document.createElement('span'); s.innerHTML = it.html; if (it.k === i) s.className = 'p4r-ici'; if (D[it.k].interp) s.classList.add('p4r-ip'); s.style.left = (wl / 2 + (it.k - i) * 66) + 'px'; loupe.appendChild(s); });
    }
    function poser(i) {
      var p = D[i]; r.setAttribute('aria-valuenow', i); r.setAttribute('aria-valuetext', p.lib);
      var px = x(i); pouce.style.left = px + '%';
      pl.style.transform = px < 12 ? 'translateX(-14px)' : px > 88 ? 'translateX(calc(-100% + 14px))' : '';
      plt.textContent = court(p);
      o.surPoser(i, p); graduations(i);
    }
    function depuis(e) { var b = r.getBoundingClientRect(), pct = (e.clientX - b.left) / b.width * 100, bi = 0, bd = 1e9; for (var k = 0; k <= N; k++) { var d = Math.abs(x(k) - pct); if (d < bd) { bd = d; bi = k; } } if (bi !== cur()) poser(bi); }
    r.addEventListener('pointerdown', function (e) { r.setPointerCapture(e.pointerId); el.classList.add('p4r-touche'); depuis(e); graduations(cur()); });
    r.addEventListener('pointermove', function (e) { if (el.classList.contains('p4r-touche')) depuis(e); });
    var fin = function () { el.classList.remove('p4r-touche'); graduations(cur()); };
    r.addEventListener('pointerup', fin); r.addEventListener('pointercancel', fin);
    r.addEventListener('keydown', function (e) { var i = cur(); if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); poser(Math.min(N, i + 1)); } if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); poser(Math.max(0, i - 1)); } if (e.key === 'Home') poser(0); if (e.key === 'End') poser(N); });
    var q = location.search.match(/moment=([^&]+)/), i0 = q && S.idx(decodeURIComponent(q[1])) >= 0 ? S.idx(decodeURIComponent(q[1])) : (o.valeur != null ? o.valeur : best);
    poser(i0);
    if (/touche=1/.test(location.search)) { el.classList.add('p4r-touche'); graduations(cur()); }
    return { poser: poser, cur: cur, rafraichir: function () { poser(cur()); } };
  }
  window.P4 = { x: x, cw: cw, seg: seg, jours: jours, best: best, SEG: SEG, court: court, mesure: mesure, rail: rail };
}

// Une variante : { id, nom, chaleur, titre, legende, css, corps, script }. Levure « propre » : la variante pose son pont.
export function rendre(c) {
  const scriptCommun = 'window.P4SVG = ' + JSON.stringify({ FLAMME: FLAMME(14), BULLES: BULLES(14), FLAMME11: FLAMME(14), BULLES11: BULLES(14) }) + ';\n(' + railClient.toString() + ')();\n(' + c.script.toString() + ')();';
  const html = page({ id: c.id, nom: c.nom, chaleur: c.chaleur, levure: 'propre', titre: c.titre, legende: c.legende, css: CSS_RAIL + c.css, corps: c.corps, script: function () {} });
  // Le socle appelle (function(){})() pour le script du concept ; le nôtre vient après, dans le même bloc <script>.
  const marque = '(' + (function () {}).toString() + ')();\n';
  const i = html.lastIndexOf(marque);
  if (i < 0) throw new Error('marque du script introuvable');
  const sortie = html.slice(0, i) + scriptCommun + '\n' + html.slice(i + marque.length);
  fs.mkdirSync(path.join(PASSE4, c.id), { recursive: true });
  fs.writeFileSync(path.join(PASSE4, c.id, 'etat.html'), sortie);
  return sortie;
}
