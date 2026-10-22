// Série G (libre, brief minimal, chaleur chaude) : huit concepts de Dryhopper, « Quand ajouter
// Idaho 7 ? ». Un seul facteur libre, le moment ; le reste fixé dans la ligne de contexte.
// Usage : node generer.mjs            (écrit g1/etat.html … g8/etat.html)
//         node generer.mjs --captures (puis les captures à 390 px dans captures/)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ici, POS, ORDRE, ROUE, COURT, JETONS, INCONNUS, MEILLEUR, IBU_16D, COUL_I7, pi, contexte, tete, lentille, pontLevure, vraie, page } from './socle-g.mjs';

const pages = {};
const iMeil = MEILLEUR;

// ---------- briques partagées par plusieurs concepts ----------
// Barre l5b (acquis) : piste 0 → 2 × haut de la bande au style (la zone = la moitié gauche) ;
// en absolu 0 → 110. Le rond creux : ma stout avant ; la barre : avec Idaho 7 ; « ~ » simulé.
const barresHTML = (fams, cls = '') => fams.map((f) => `<div class="gs-ba ${cls}" data-f="${f}"><span class="gs-ba-n${['floral', 'herbal', 'earthy'].includes(f) ? ' gs-att' : ''}">${pi(f)}${COURT[f]}</span><span class="gs-piste"><i class="gs-zone" data-role="zone"></i>${INCONNUS.includes(f) ? '<i class="gs-hach"></i>' : '<i class="gs-rem" style="background:' + JETONS[f].base + '"></i><i class="gs-av"></i>'}</span><span class="gs-ba-v"></span></div>`).join('');
const BARRES_CSS = `
.gs-ba { display:grid; grid-template-columns:92px 1fr 44px; align-items:center; gap:6px; font-size:13px; min-height:20px; }
.gs-ba-n { display:flex; align-items:center; gap:4px; white-space:nowrap; }
.gs-att { font-weight:700; }
.gs-ba-v { text-align:right; font-family:var(--mono); font-size:12px; }
.gs-piste { position:relative; height:12px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.gs-piste i { position:absolute; top:0; bottom:0; left:0; display:block; }
.gs-zone { background:#d9dce3; }
.gs-rem { height:6px; top:3px !important; border-radius:2px; transition:width .12s ease-out; }
.gs-av { width:10px; height:10px; top:1px !important; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-5px; }
.gs-hach { right:0; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }`;
const BARRES_JS = `
function majBarres(p, racine) {
  (racine || document).querySelectorAll('.gs-ba[data-f]').forEach(function (r) {
    var f = r.dataset.f, v = r.querySelector('.gs-ba-v'), z = r.querySelector('.gs-zone'), rem = r.querySelector('.gs-rem'), av = r.querySelector('.gs-av');
    var echelle = function (x) { return Math.max(0, Math.min(100, abs() ? x / 110 * 100 : x / B[f] / 2 * 100)); };
    z.style.width = (abs() ? B[f] / 110 * 100 : 50) + '%';
    if (INC.indexOf(f) >= 0) { v.textContent = '?'; v.style.color = '#55555f'; return; }
    rem.style.width = echelle(p.v[f]) + '%'; av.style.left = 'clamp(5px,' + echelle(AV[f]) + '%,calc(100% - 5px))';
    var d = delta(p, f); v.textContent = Math.abs(d) >= 0.5 ? (p.interp ? '≈' : '~') + sg(d) : '';
    v.style.color = p.v[f] > B[f] ? '#c2410c' : TX[f];
  });
}`;
// Glisser : pointeur capturé, la position (x ou y, ou un angle) donne l'index du moment.
const GLISSER_JS = `
function glisser(el, versIndex, poser) {
  var actif = false;
  el.addEventListener('pointerdown', function (e) { actif = true; try { el.setPointerCapture(e.pointerId); } catch (_) {} el.classList.add('gs-touche'); poser(versIndex(e)); e.preventDefault(); });
  el.addEventListener('pointermove', function (e) { if (actif) poser(versIndex(e)); });
  var fin = function () { actif = false; el.classList.remove('gs-touche'); poser(cur); };
  el.addEventListener('pointerup', fin); el.addEventListener('pointercancel', fin);
  el.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowDown') poser(Math.min(N, cur + 1)); if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') poser(Math.max(0, cur - 1)); });
}
function aria(el, i) { el.setAttribute('aria-valuenow', i); el.setAttribute('aria-valuetext', D[i].lib); }
var q = location.search.match(/moment=([^&]+)/), cur = q ? Math.max(0, D.findIndex(function (p) { return p.id === decodeURIComponent(q[1]); })) : MEILLEUR;`;
const slider = (cls, extra = '') => `role="slider" tabindex="0" aria-label="Moment de l'ajout d'Idaho 7" aria-valuemin="0" aria-valuemax="${POS.length - 1}" aria-valuenow="${iMeil}" aria-valuetext="${POS[iMeil].lib}" class="${cls}" ${extra}`;
const SEGC = { ebu: '#8a5a2b', wp: '#b5481c', actif: '#2f6b5f', apres: '#3a5f8a' }; // couleurs des lieux (toute la série)
const legCommune = `<span>rond creux : ta stout avant · barre : avec Idaho 7</span><span>~ simulé · ≈ interpolé entre 60′ et 10′ · hachuré : inconnu</span><span>zone grise : le style 16D · orangé : hors du style</span>`;

// ======================================================================
// g1 — La courbe du compromis : le nez et la bouche sur tout le brassin, le doigt sur la courbe.
// ======================================================================
{
  const W = 370, HN = 250, HB = 84, x0 = 8, x1 = W - 8;
  const X = (i) => x0 + (x1 - x0) * i / (POS.length - 1);
  const sep = [['ébullition', 0, 10], ['WP', 11, 11], ['actif', 12, 16], ['après', 17, 21]];
  const corps = `
${tete('Quand ajouter Idaho 7 ?')}
${contexte()}
${lentille('g1-leg', `<span>courbes : ce qu'Idaho 7 ajoute au nez, face à ta stout</span><span>barres du bas : l'IBU de toute la stout ; bande grise : 16D 50–70</span><span>~ simulé · ≈ interpolé entre 60′ et 10′ (trait pâle)</span>`)}
<section class="gs-bloc g1-graph" data-libre="moment">
  <p class="g1-rep"><b class="g1-mom"></b> <span class="g1-txt"></span></p>
  <div ${slider('g1-zone')}>
  <svg class="g1-svg" width="${W}" height="${HN + HB + 30}" viewBox="0 0 ${W} ${HN + HB + 30}" aria-hidden="true">
    ${sep.map(([t, a, b]) => `<text x="${((X(a) + X(b)) / 2).toFixed(1)}" y="12" text-anchor="middle" class="g1-seg">${t}</text>`).join('')}
    ${[11, 12, 17].map((i) => `<line x1="${(X(i) - (X(1) - X(0)) / 2).toFixed(1)}" x2="${(X(i) - (X(1) - X(0)) / 2).toFixed(1)}" y1="18" y2="${HN + HB + 24}" stroke="#e1e3e9"/>`).join('')}
    <g class="g1-nez" transform="translate(0,18)"></g>
    <g class="g1-bouche" transform="translate(0,${HN + 26})"></g>
    <g class="g1-curseur"><line class="g1-cl" y1="16" y2="${HN + HB + 26}" stroke="#16161a" stroke-width="2"/><circle class="g1-cr" r="7" fill="#fff" stroke="#16161a" stroke-width="2"/></g>
  </svg>
  </div>
  <p class="g1-cles"><span>${pi('floral', 14)}<b style="color:${JETONS.floral.texte}">floral</b></span><span>${pi('berries', 14)}<b style="color:${JETONS.berries.texte}">baies</b></span><span>${pi('resin', 14)}<b style="color:${JETONS.resin.texte}">résineux</b></span><span class="g1-ibu-k"><i></i>IBU</span><span class="gs-meilleur g1-mk"><i></i>meilleur</span></p>
</section>
${vraie('E08')}
${pontLevure('outil')}`;
  const css = `
.g1-graph { gap:4px; padding:8px 0 6px; }
.g1-rep { padding:0 10px; font-size:14px; min-height:36px; }
.g1-mom { display:inline-block; background:var(--encre); color:#fff; border-radius:11px; padding:0 8px; font-weight:600; }
.g1-zone { touch-action:none; cursor:ew-resize; outline:none; }
.g1-seg { font:600 12px var(--sans); fill:#55555f; }
.g1-cles { display:flex; gap:10px; padding:0 10px; font-size:12px; flex-wrap:wrap; align-items:center; }
.g1-cles span { display:inline-flex; align-items:center; gap:3px; }
.g1-ibu-k i { width:10px; height:10px; background:#7a7f8c; border-radius:2px; display:inline-block; }
.g1-mk i { width:2px; height:12px; background:#0f6b4f; display:inline-block; }
.g1-zone.gs-touche .g1-cr { r:10; }`;
  const js = `<script>${GLISSER_JS}
var W = ${W}, HN = ${HN}, HB = ${HB}, x0 = ${x0}, x1 = ${x1}, NS = 'http://www.w3.org/2000/svg';
function X(i) { return x0 + (x1 - x0) * i / N; }
var FAM = [['floral', '#9840bc'], ['berries', '#9b3f74'], ['resin', '#2f6b5f']];
function el(t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; }
function dessiner() {
  var nez = document.querySelector('.g1-nez'), bou = document.querySelector('.g1-bouche'); nez.innerHTML = ''; bou.innerHTML = '';
  var max = 0; D.forEach(function (p) { FAM.forEach(function (f) { max = Math.max(max, lire(f[0], delta(p, f[0]))); }); });
  var Y = function (v) { return HN - 6 - (HN - 14) * v / max; };
  nez.appendChild(el('line', { x1: x0, x2: x1, y1: Y(0), y2: Y(0), stroke: '#c9cad2' }));
  FAM.forEach(function (f) {
    var pts = D.map(function (p, i) { return X(i).toFixed(1) + ',' + Y(lire(f[0], delta(p, f[0]))).toFixed(1); });
    nez.appendChild(el('polyline', { points: pts.slice(0, 11).join(' '), fill: 'none', stroke: f[1], 'stroke-width': 2.5, opacity: .45 }));
    nez.appendChild(el('polyline', { points: pts.slice(10).join(' '), fill: 'none', stroke: f[1], 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
    [0, 10].forEach(function (i) { nez.appendChild(el('circle', { cx: X(i), cy: Y(lire(f[0], delta(D[i], f[0]))), r: 2.5, fill: f[1] })); });
  });
  // la bouche : IBU de toute la stout, bande 16D 50–70 (zone du style)
  var IM = 170, YB = function (v) { return HB - HB * v / IM; };
  bou.appendChild(el('rect', { x: x0 - 4, width: x1 - x0 + 8, y: YB(${IBU_16D[1]}), height: YB(${IBU_16D[0]}) - YB(${IBU_16D[1]}), fill: '#d9dce3', 'data-role': 'zone' }));
  D.forEach(function (p, i) { var w = (x1 - x0) / N - 3;
    if (p.ibu == null) { bou.appendChild(el('rect', { x: X(i) - w / 2, y: YB(60) - 1, width: w, height: HB - YB(60) + 1, fill: '#7a7f8c' })); bou.appendChild(el('rect', { x: X(i) - w / 2, y: YB(80), width: w, height: YB(60) - YB(80), fill: 'url(#g1-h)' })); return; }
    bou.appendChild(el('rect', { x: X(i) - w / 2, y: YB(p.ibu), width: w, height: HB - YB(p.ibu), fill: p.ibu > ${IBU_16D[1]} ? '#c2410c' : '#7a7f8c' })); });
  var d = el('defs', {}); d.innerHTML = '<pattern id="g1-h" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#9a9aa6" stroke-width="1.5"/></pattern>'; bou.appendChild(d);
  var t = el('text', { x: X(MEILLEUR) + 5, y: -4, 'text-anchor': 'start', class: 'gs-meilleur', fill: '#0f6b4f' }); t.textContent = 'meilleur'; bou.appendChild(t);
  return Y;
}
var Yf = dessiner();
window.redessiner = function () { Yf = dessiner(); poser(cur); };
function poser(i) { cur = i; var p = D[i], zone = document.querySelector('.g1-zone'); aria(zone, i);
  var x = X(i); document.querySelector('.g1-cl').setAttribute('x1', x); document.querySelector('.g1-cl').setAttribute('x2', x);
  var c = document.querySelector('.g1-cr'); c.setAttribute('cx', x); c.setAttribute('cy', 18 + Yf(lire('floral', delta(p, 'floral'))));
  document.querySelector('.g1-mom').textContent = p.lib + (i === MEILLEUR ? ' · meilleur' : '');
  var m = p.interp ? '≈' : '~';
  document.querySelector('.g1-txt').innerHTML = '<b style="color:#9840bc">floral ' + m + sg(delta(p, 'floral')) + '</b> · résineux ' + m + sg(delta(p, 'resin')) + ' · <span style="color:' + (p.ibu > ${IBU_16D[1]} ? '#c2410c' : '#16161a') + '">' + ibuTxt(p) + ibuEtat(p) + '</span>';
  window.pontLevure(p); }
var zone = document.querySelector('.g1-zone');
glisser(zone, function (e) { var r = zone.getBoundingClientRect(); return Math.max(0, Math.min(N, Math.round((e.clientX - r.left - x0) / (x1 - x0) * N))); }, poser);
poser(cur);
</script>`;
  pages.g1 = page('g1', 'La courbe du compromis', corps, css, js);
}

// ======================================================================
// g2 — La bascule : le nez contre la bouche ; le dock sous le pouce (y1b) avec sa loupe.
// ======================================================================
{
  const corps = `
${tete('Quand ajouter Idaho 7 ?')}
${contexte()}
${lentille('g2-leg', `<span>la planche penche du côté que tu charges : le nez (les arômes qu'Idaho 7 ajoute) ou la bouche (l'IBU au-dessus de ta stout)</span>${legCommune}`)}
<section class="gs-bloc g2-bascule" aria-label="Nez contre bouche">
  <svg width="350" height="124" viewBox="0 0 350 124" aria-hidden="true">
    <path d="M175 118 L162 94 L188 94 Z" fill="none" stroke="#16161a" stroke-width="2" stroke-linejoin="round"/>
    <g class="g2-planche"><line x1="30" y1="90" x2="320" y2="90" stroke="#16161a" stroke-width="4" stroke-linecap="round"/>
      <g transform="translate(78,0)"><rect x="-52" y="40" width="104" height="46" rx="8" fill="#f3e8f7"/><text x="0" y="56" text-anchor="middle" class="g2-t">au nez</text><g class="g2-pics"></g></g>
      <g transform="translate(272,0)"><rect x="-52" y="40" width="104" height="46" rx="8" fill="#e2e5eb"/><text x="0" y="56" text-anchor="middle" class="g2-t">en bouche</text><text x="0" y="77" text-anchor="middle" class="g2-v g2-vb"></text></g>
    </g>
  </svg>
</section>
<section class="gs-bloc g2-barres">${barresHTML(ORDRE)}</section>
${vraie('E07')}
${pontLevure('etape')}
<div class="g2-dock" data-libre="moment">
  <div class="g2-loupe" aria-hidden="true"></div>
  <div ${slider('g2-rail')}>${['ebu', 'wp', 'actif', 'apres'].map((s) => `<span class="g2-s" data-s="${s}" style="background:${SEGC[s]}"></span>`).join('')}<span class="g2-pouce"><span class="g2-pl"></span></span></div>
  <div class="g2-rep"><span>60′</span><span>10′</span><span>WP</span><span>actif</span><span>après</span></div>
</div>`;
  const css = `${BARRES_CSS}
.gs-ecran { padding-bottom:96px; }
.g2-bascule { padding:4px 10px 0; align-items:center; }
.g2-planche { transition:transform .18s ease-out; transform-origin:175px 90px; }
.g2-t { font:600 12px var(--sans); fill:#55555f; }
.g2-v { font:600 15px var(--sans); fill:#16161a; }
.g2-barres { gap:4px; }
.g2-barres .gs-ba { min-height:22px; }
.g2-dock { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid #c9cad2; padding:10px 18px 6px; touch-action:none; z-index:10; }
.g2-rail { position:relative; height:28px; display:flex; gap:3px; align-items:center; outline:none; cursor:pointer; max-width:354px; margin:0 auto; }
.g2-s { height:6px; border-radius:2px; }
.g2-s[data-s=ebu] { flex:11; } .g2-s[data-s=wp] { flex:1.4; } .g2-s[data-s=actif] { flex:5; } .g2-s[data-s=apres] { flex:5; }
.g2-pouce { position:absolute; top:3px; width:22px; height:22px; margin-left:-11px; border-radius:50%; background:#fff; border:3px solid var(--encre); }
.g2-pl { position:absolute; bottom:28px; left:50%; transform:translateX(-50%); white-space:nowrap; background:var(--encre); color:#fff; font:600 13px var(--sans); padding:2px 8px; border-radius:11px; }
.g2-rep { position:relative; display:flex; justify-content:space-between; font-size:12px; color:var(--gris); max-width:354px; margin:2px auto 0; }
.g2-loupe { position:absolute; left:8px; right:8px; bottom:100%; height:40px; display:none; background:#fff; border:1px solid #c9cad2; border-radius:8px; overflow:hidden; }
.g2-dock.gs-touche .g2-loupe { display:block; }
.g2-dock.gs-touche .g2-pl { visibility:hidden; }
.g2-loupe span { position:absolute; top:10px; transform:translateX(-50%); font:600 13px var(--mono); color:var(--gris); }
.g2-loupe span.ici { color:#fff; background:var(--encre); padding:1px 6px; border-radius:4px; }`;
  const js = `<script>${BARRES_JS}${GLISSER_JS}
var rail = document.querySelector('.g2-rail'), dock = document.querySelector('.g2-dock'), loupe = document.querySelector('.g2-loupe'), NS = 'http://www.w3.org/2000/svg';
function bornes(s) { var e = rail.querySelector('[data-s=' + s + ']'), r = rail.getBoundingClientRect(), b = e.getBoundingClientRect(); return [b.left - r.left, b.right - r.left]; }
function X(i) { var p = D[i], idx = []; D.forEach(function (q, k) { if (q.seg === p.seg) idx.push(k); }); var b = bornes(p.seg), n = idx.length; return n === 1 ? (b[0] + b[1]) / 2 : b[0] + (b[1] - b[0]) * (0.04 + 0.92 * idx.indexOf(i) / (n - 1)); }
function majLoupe(i) { loupe.innerHTML = ''; var w = loupe.clientWidth || 340; for (var k = i - 3; k <= i + 3; k++) { if (k < 0 || k > N) continue; var s = document.createElement('span'); s.textContent = D[k].court; if (k === i) s.className = 'ici'; s.style.left = (w / 2 + (k - i) * 54) + 'px'; loupe.appendChild(s); } }
function pics(p) { var g = document.querySelector('.g2-pics'); g.innerHTML = '';
  var top = Object.keys(B).filter(function (f) { return INC.indexOf(f) < 0 && delta(p, f) >= 0.5; }).sort(function (a, b) { return lire(b, delta(p, b)) - lire(a, delta(p, a)); }).slice(0, 4);
  top.forEach(function (f, k) { var s = document.createElementNS(NS, 'svg'); s.setAttribute('x', -40 + k * 21); s.setAttribute('y', 62); s.setAttribute('width', 18); s.setAttribute('height', 18); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('data-famille', f); s.setAttribute('aria-label', COURT[f]); var u = document.createElementNS(NS, 'use'); u.setAttribute('href', '#p-' + f); s.appendChild(u); g.appendChild(s); });
  if (!top.length) { var t = document.createElementNS(NS, 'text'); t.setAttribute('x', 0); t.setAttribute('y', 77); t.setAttribute('text-anchor', 'middle'); t.setAttribute('class', 'g2-v'); t.textContent = 'presque rien'; g.appendChild(t); } }
function poser(i) { cur = i; var p = D[i]; aria(rail, i);
  rail.querySelector('.g2-pouce').style.left = X(i) + 'px'; rail.querySelector('.g2-pl').textContent = p.lib + (i === MEILLEUR ? ' · meilleur' : '');
  majBarres(p); majLoupe(i); pics(p);
  var nez = 0; Object.keys(B).forEach(function (f) { if (INC.indexOf(f) < 0) nez += Math.max(0, delta(p, f) / B[f]); });
  var bou = p.ibu == null ? 0 : (p.ibu - 60) / 70;   // IBU ajoutés, rapportés au haut de la 16D
  var ang = Math.max(-12, Math.min(12, (bou - nez) * 8));
  document.querySelector('.g2-planche').style.transform = 'rotate(' + ang + 'deg)';
  var vb = document.querySelector('.g2-vb'); vb.textContent = p.ibu == null ? 'IBU 60 + ?' : 'IBU ~' + p.ibu; vb.setAttribute('fill', p.ibu > ${IBU_16D[1]} ? '#c2410c' : '#16161a');
  window.pontLevure(p); }
window.redessiner = function () { poser(cur); };
glisser(rail, function (e) { var r = rail.getBoundingClientRect(), x = e.clientX - r.left, best = 0, bd = 1e9; for (var k = 0; k <= N; k++) { var d = Math.abs(X(k) - x); if (d < bd) { bd = d; best = k; } } return best; }, function (i) { dock.classList.toggle('gs-touche', rail.classList.contains('gs-touche')); poser(i); });
poser(cur);
</script>`;
  pages.g2 = page('g2', 'La bascule', corps, css, js);
}

// ======================================================================
// g3 — L'arc du pouce : le brassin en demi-cercle sous le pouce ; l'orgue des 12 familles au-dessus.
// ======================================================================
{
  const R = 138, CX = 185, CY = 168;
  const ang = (i) => Math.PI - Math.PI * (0.03 + 0.94 * i / (POS.length - 1)); // 60′ à gauche, après 7 j à droite
  const P = (i, r = R) => [CX + r * Math.cos(ang(i)), CY - r * Math.sin(ang(i))];
  const arcs = ['ebu', 'wp', 'actif', 'apres'].map((s) => {
    const idx = POS.map((p, i) => (p.seg === s ? i : -1)).filter((i) => i >= 0), a = idx[0] - (s === 'wp' ? 0.4 : 0.3), b = idx[idx.length - 1] + (s === 'wp' ? 0.4 : 0.3);
    const p0 = P(a), p1 = P(b);
    return `<path d="M${p0[0].toFixed(1)},${p0[1].toFixed(1)} A${R},${R} 0 0 1 ${p1[0].toFixed(1)},${p1[1].toFixed(1)}" fill="none" stroke="${SEGC[s]}" stroke-width="10" stroke-linecap="butt"/>`;
  }).join('');
  const etiq = [['60′', 0], ['10′', 10], ['WP', 11], ['actif', 14], ['après', 19]].map(([t, i]) => { const [x, y] = P(i, R + 18); return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" class="g3-et">${t}</text>`; }).join('');
  const crans = POS.map((_, i) => { const [a1, b1] = P(i, R - 9), [a2, b2] = P(i, R - 14); return `<line x1="${a1.toFixed(1)}" y1="${b1.toFixed(1)}" x2="${a2.toFixed(1)}" y2="${b2.toFixed(1)}" stroke="#9a9aa6" stroke-width="1"/>`; }).join('');
  const [mx, my] = P(iMeil, R - 28);
  const corps = `
${tete('Quand ajouter Idaho 7 ?')}
${contexte()}
${lentille('g3-leg', `<span>chaque colonne : une famille ; trait noir : ta stout avant ; couleur : avec Idaho 7</span><span>zone grise : le style 16D · orangé : hors du style</span><span>~ simulé · ≈ interpolé · hachuré : inconnu</span>`)}
<section class="gs-bloc g3-orgue" aria-label="Les 12 familles">${ORDRE.map((f) => `<div class="g3-col" data-f="${f}"><span class="g3-v"></span><span class="g3-tube"><i class="g3-zone" data-role="zone"></i>${INCONNUS.includes(f) ? '<i class="g3-hach"></i>' : `<i class="g3-rem" style="background:${JETONS[f].base}"></i><i class="g3-av"></i>`}</span>${pi(f)}</div>`).join('')}</section>
${vraie('E05')}
<section class="g3-cadran" data-libre="moment">
  <div ${slider('g3-arc')}>
  <svg width="370" height="180" viewBox="0 0 370 180" aria-hidden="true">${arcs}${crans}${etiq}
    <text x="${mx.toFixed(1)}" y="${(my + 4).toFixed(1)}" text-anchor="middle" class="gs-meilleur" fill="#0f6b4f">meilleur</text>
    <g class="g3-pouce"><circle r="15" fill="#fff" stroke="#16161a" stroke-width="3"/><circle r="5" fill="${COUL_I7}"/></g>
    <text x="${CX}" y="${CY - 56}" text-anchor="middle" class="g3-lieu"></text>
    <text x="${CX}" y="${CY - 32}" text-anchor="middle" class="g3-ibu"></text>
    <text x="${CX}" y="${CY - 12}" text-anchor="middle" class="g3-ibu2"></text>
  </svg></div>
  ${pontLevure('outil')}
</section>`;
  const css = `
.g3-orgue { flex-direction:row; justify-content:space-between; padding:8px 8px 6px; }
.g3-col { display:flex; flex-direction:column; align-items:center; gap:3px; width:27px; }
.g3-v { font:12px var(--mono); height:15px; white-space:nowrap; letter-spacing:-.05em; }
.g3-tube { position:relative; width:12px; height:170px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.g3-tube i { position:absolute; left:0; right:0; bottom:0; display:block; }
.g3-zone { background:#d9dce3; }
.g3-rem { left:2px !important; right:2px !important; transition:height .12s ease-out; }
.g3-av { height:2px; background:var(--encre); }
.g3-hach { top:0; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
.g3-cadran { background:#fff; border-radius:8px; padding:6px 0 8px; display:flex; flex-direction:column; gap:2px; }
.g3-cadran .gs-pont { padding:0 10px; }
.g3-arc { touch-action:none; outline:none; cursor:grab; display:flex; justify-content:center; }
.g3-et { font:600 12px var(--sans); fill:#55555f; }
.g3-lieu { font:600 20px var(--sans); fill:#16161a; }
.g3-ibu { font:600 15px var(--sans); }
.g3-ibu2 { font:13px var(--sans); fill:#55555f; }
.g3-arc.gs-touche .g3-pouce circle:first-child { r:19; }`;
  const js = `<script>${GLISSER_JS}
var R = ${R}, CX = ${CX}, CY = ${CY};
function A(i) { return Math.PI - Math.PI * (0.03 + 0.94 * i / N); }
function poser(i) { cur = i; var p = D[i], arc = document.querySelector('.g3-arc'); aria(arc, i);
  document.querySelector('.g3-pouce').setAttribute('transform', 'translate(' + (CX + R * Math.cos(A(i))).toFixed(1) + ',' + (CY - R * Math.sin(A(i))).toFixed(1) + ')');
  document.querySelector('.g3-lieu').textContent = p.lib;
  var m = p.interp ? '≈' : '~';
  var t = document.querySelector('.g3-ibu'); t.textContent = 'floral ' + m + sg(delta(p, 'floral')) + ' · baies ' + m + sg(delta(p, 'berries')); t.setAttribute('fill', '#9840bc');
  var t2 = document.querySelector('.g3-ibu2'); t2.textContent = ibuTxt(p) + ibuEtat(p); t2.setAttribute('fill', p.ibu > ${IBU_16D[1]} ? '#c2410c' : '#55555f');
  document.querySelectorAll('.g3-col').forEach(function (c) { var f = c.dataset.f, v = c.querySelector('.g3-v'), z = c.querySelector('.g3-zone');
    var H = function (x) { return Math.max(0, Math.min(100, abs() ? x / 110 * 100 : x / B[f] / 2 * 100)); };
    z.style.height = (abs() ? B[f] / 110 * 100 : 50) + '%';
    if (INC.indexOf(f) >= 0) { v.textContent = '?'; return; }
    c.querySelector('.g3-rem').style.height = H(p.v[f]) + '%'; c.querySelector('.g3-av').style.bottom = H(AV[f]) + '%';
    var d = delta(p, f); v.textContent = Math.abs(d) >= 0.5 ? m + sg(d) : ''; v.style.color = p.v[f] > B[f] ? '#c2410c' : TX[f]; });
  window.pontLevure(p); }
window.redessiner = function () { poser(cur); };
var arc = document.querySelector('.g3-arc');
glisser(arc, function (e) { var s = arc.querySelector('svg').getBoundingClientRect(); var dx = e.clientX - s.left - CX, dy = CY - (e.clientY - s.top); var a = Math.atan2(Math.max(dy, 0), dx); var t = (Math.PI - a) / Math.PI; return Math.max(0, Math.min(N, Math.round((t - 0.03) / 0.94 * N))); }, poser);
poser(cur);
</script>`;
  pages.g3 = page('g3', 'L\'arc du pouce', corps, css, js);
}

// ======================================================================
// g4 — La phrase qui se règle : le moment est un mot qu'on frotte du doigt ; la stout répond en phrase.
// ======================================================================
{
  const i10 = POS.findIndex((p) => p.id === 'b10');
  const corps = `
${tete('Quand ajouter Idaho 7 ?')}
${contexte()}
${lentille('g4-leg', `<span>frotte le moment surligné vers la gauche ou la droite : la phrase et les barres suivent</span>${legCommune}`)}
<section class="gs-bloc g4-phrase" data-libre="moment">
  <p class="g4-p">J'ajoute Idaho 7 <span ${slider('g4-mot')}><span class="g4-lib"></span><span class="g4-crans" aria-hidden="true">${POS.map((p, i) => `<i data-i="${i}" style="background:${SEGC[p.seg]}"></i>`).join('')}</span></span></p>
  <p class="g4-p g4-suite"></p>
  <button type="button" class="g4-meil" data-mom="${POS[iMeil].id}">le meilleur : ${POS[iMeil].lib}</button>
</section>
<section class="gs-bloc g4-barres">${barresHTML(['floral', 'berries', 'tropical', 'citrus', 'resin', 'green'])}
  <div class="g4-ibu"><span class="g4-ibu-n">amertume</span><span class="g4-jauge"><i class="g4-z" data-role="zone"></i><i class="g4-r"></i><i class="g4-hach"></i></span><span class="g4-ibu-v gs-num"></span></div>
</section>
${vraie('E07')}
${pontLevure('etape')}`;
  const css = `${BARRES_CSS}
.g4-phrase { padding:12px 12px 10px; gap:8px; }
.g4-p { font:500 20px/1.35 var(--sans); }
.g4-suite { font-size:18px; }
.g4-mot { display:inline-flex; flex-direction:column; vertical-align:top; touch-action:none; cursor:ew-resize; outline:none; background:#ece6f6; border-radius:8px; padding:0 8px 4px; margin:0 2px; }
.g4-lib { font-weight:700; color:var(--i7); border-bottom:2px solid var(--i7); white-space:nowrap; }
.g4-crans { display:flex; gap:2px; margin-top:5px; }
.g4-crans i { width:6px; height:6px; border-radius:50%; opacity:.35; }
.g4-crans i.ici { opacity:1; transform:scale(1.5); }
.g4-mot.gs-touche { background:#ddd2f0; }
.g4-suite b { font-weight:700; }
.g4-meil { align-self:flex-start; height:28px; padding:0 12px; border-radius:14px; border:1px solid #0f6b4f; color:#0f6b4f; font-weight:600; font-size:13px; }
.g4-barres .gs-ba { min-height:24px; }
.g4-ibu { display:grid; grid-template-columns:92px 1fr 44px; gap:6px; align-items:center; font-size:13px; margin-top:2px; }
.g4-jauge { position:relative; height:12px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.g4-jauge i { position:absolute; top:0; bottom:0; display:block; }
.g4-z { background:#d9dce3; left:${(50 / 170 * 100).toFixed(2)}%; width:${(20 / 170 * 100).toFixed(2)}%; }
.g4-r { left:0; height:6px; top:3px !important; border-radius:2px; background:#55555f; }
.g4-hach { background:repeating-linear-gradient(135deg,#9a9aa6 0 2px,transparent 2px 6px); }
.g4-ibu-v { text-align:right; font-size:12px; }`;
  const js = `<script>${BARRES_JS}${GLISSER_JS}
var mot = document.querySelector('.g4-mot');
function fam(p, f) { var d = delta(p, f); return '<b style="color:' + (p.v[f] > B[f] ? '#c2410c' : TX[f]) + '">' + COURT[f].toLowerCase() + ' ' + (p.interp ? '≈' : '~') + sg(d) + '</b>'; }
function poser(i) { cur = i; var p = D[i]; aria(mot, i);
  mot.querySelector('.g4-lib').textContent = (p.seg === 'ebu' ? 'à ' : p.seg === 'wp' ? 'au ' : 'en dry hop ') + p.lib;
  mot.querySelectorAll('.g4-crans i').forEach(function (c) { c.classList.toggle('ici', +c.dataset.i === i); });
  var top = Object.keys(B).filter(function (f) { return INC.indexOf(f) < 0 && f !== 'resin'; }).sort(function (a, b) { return delta(p, b) - delta(p, a); }).slice(0, 2);
  var am = p.ibu == null ? 'l\\'amertume reste ~60 + ?' : p.ibu > ${IBU_16D[1]} ? '<b style="color:#c2410c">trop amer : IBU ~' + p.ibu + '</b>' : 'IBU ~' + p.ibu + ', dans la 16D';
  document.querySelector('.g4-suite').innerHTML = 'Ma stout gagne ' + fam(p, top[0]) + ' et ' + fam(p, top[1]) + ', le résineux monte ' + (p.interp ? '≈' : '~') + sg(delta(p, 'resin')) + ', ' + am + '.';
  majBarres(p);
  var r = document.querySelector('.g4-r'), h = document.querySelector('.g4-hach');
  if (p.ibu == null) { r.style.width = 60 / 170 * 100 + '%'; h.style.left = 60 / 170 * 100 + '%'; h.style.width = 20 / 170 * 100 + '%'; h.hidden = false; }
  else { r.style.width = Math.min(100, p.ibu / 170 * 100) + '%'; h.hidden = true; }
  r.style.background = p.ibu > ${IBU_16D[1]} ? '#c2410c' : '#55555f';
  document.querySelector('.g4-ibu-v').textContent = p.ibu == null ? '~60 + ?' : '~' + p.ibu;
  document.querySelector('.g4-meil').hidden = i === MEILLEUR;
  window.pontLevure(p); }
window.redessiner = function () { poser(cur); };
var x0 = null, i0 = 0;
mot.addEventListener('pointerdown', function (e) { x0 = e.clientX; i0 = cur; try { mot.setPointerCapture(e.pointerId); } catch (_) {} mot.classList.add('gs-touche'); e.preventDefault(); });
mot.addEventListener('pointermove', function (e) { if (x0 == null) return; var k = Math.max(0, Math.min(N, i0 + Math.round((e.clientX - x0) / 14))); if (k !== cur) poser(k); });
['pointerup', 'pointercancel'].forEach(function (t) { mot.addEventListener(t, function () { x0 = null; mot.classList.remove('gs-touche'); }); });
mot.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') poser(Math.min(N, cur + 1)); if (e.key === 'ArrowLeft') poser(Math.max(0, cur - 1)); });
document.querySelector('.g4-meil').addEventListener('click', function () { poser(MEILLEUR); });
poser(q ? cur : ${i10});   // départ à 10′ : le piège (trop amer) se voit, « le meilleur » est à un toucher
</script>`;
  pages.g4 = page('g4', 'La phrase qui se règle', corps, css, js);
}

// ======================================================================
// g5 — La carte de chaleur : 12 familles × 22 moments d'un coup d'œil ; le doigt balaie les colonnes.
// ======================================================================
{
  const corps = `
${tete('Quand ajouter Idaho 7 ?')}
${contexte()}
${lentille('g5-leg', `<span>chaque case : ce qu'Idaho 7 ajoute à ta stout, plus foncé = plus ; cadre orangé : sort du style</span><span>dernière ligne : l'IBU de toute la stout, orangé au-dessus de la 16D (50–70)</span><span>~ simulé · ≈ interpolé (cases pâles) · hachuré : inconnu</span>`)}
<section class="gs-bloc g5-carte" data-libre="moment">
  <p class="g5-rep"><b class="g5-mom"></b> <span class="g5-txt"></span></p>
  <div ${slider('g5-grille')}>
    <div class="g5-tete"><span class="g5-sg" style="flex:11">ébullition</span><span class="g5-sg g5-wp" style="flex:1">WP</span><span class="g5-sg" style="flex:5">actif</span><span class="g5-sg" style="flex:5">après</span></div>
    ${ORDRE.map((f) => `<div class="g5-l" data-f="${f}"><span class="g5-n">${pi(f, 14)}${COURT[f]}</span><span class="g5-cases">${POS.map((_, i) => `<i data-i="${i}"></i>`).join('')}</span></div>`).join('')}
    <div class="g5-l g5-ibu"><span class="g5-n">IBU</span><span class="g5-cases">${POS.map((_, i) => `<i data-i="${i}"></i>`).join('')}</span></div>
    <i class="g5-col"></i><span class="g5-meil gs-meilleur">meilleur</span>
  </div>
  <div class="g5-zone"><span class="g5-zl">plus foncé = plus</span><span class="g5-echelle"><i data-role="zone"></i><b>16D</b></span><span class="g5-zl">au-delà</span></div>
</section>
${vraie('E05')}
${pontLevure('outil')}`;
  const css = `
.g5-carte { padding:8px 8px 8px; gap:6px; }
.g5-rep { font-size:14px; min-height:36px; }
.g5-mom { display:inline-block; background:var(--encre); color:#fff; border-radius:11px; padding:0 8px; font-weight:600; }
.g5-grille { position:relative; touch-action:none; cursor:ew-resize; outline:none; display:flex; flex-direction:column; gap:2px; }
.g5-l { display:grid; grid-template-columns:84px 1fr; align-items:center; }
.g5-tete { display:flex; padding-left:84px; gap:2px; font-size:12px; color:var(--gris); }
.g5-sg { text-align:center; border-bottom:2px solid #c9cad2; white-space:nowrap; overflow:hidden; }
.g5-wp { overflow:visible; letter-spacing:-.06em; }
.g5-n { display:flex; align-items:center; gap:3px; font-size:12px; white-space:nowrap; }
.g5-cases { display:grid; grid-template-columns:repeat(22, 1fr); gap:1px; }
.g5-cases i { height:23px; border-radius:2px; display:block; background:#f1f2f5; }
.g5-cases i.g5-x { background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,#f6f7f9 2px 6px); }
.g5-cases i.g5-hors { box-shadow:inset 0 0 0 2px #c2410c; }
.g5-ibu { margin-top:3px; }
.g5-col { position:absolute; top:16px; bottom:-3px; width:14px; border:2px solid var(--encre); border-radius:4px; pointer-events:none; transition:left .08s ease-out; }
.g5-meil { position:absolute; bottom:-18px; transform:translateX(-50%); white-space:nowrap; }
.g5-zone { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--gris); margin-top:30px; }
.g5-echelle { position:relative; flex:1; height:10px; border-radius:2px; background:linear-gradient(90deg,#f1f2f5,#9840bc); }
.g5-echelle b { position:absolute; left:25%; top:-17px; transform:translateX(-50%); font:600 12px var(--sans); color:var(--gris); }
.g5-echelle i { position:absolute; left:0; top:0; bottom:0; width:50%; border:2px solid #9a9aa6; border-radius:2px; background:rgba(217,220,227,.35); }`;
  const js = `<script>${GLISSER_JS}
var grille = document.querySelector('.g5-grille');
function hex(h, a) { var n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
function peindre() {
  document.querySelectorAll('.g5-l[data-f]').forEach(function (l) { var f = l.dataset.f;
    l.querySelectorAll('i').forEach(function (c) { var p = D[+c.dataset.i];
      if (INC.indexOf(f) >= 0) { c.className = 'g5-x'; return; }
      var v = Math.max(0, lire(f, delta(p, f))); var a = Math.min(1, v / (abs() ? 0.25 : 1));
      c.style.background = v < 0.02 ? '#f1f2f5' : hex(BA[f], 0.12 + 0.88 * a); c.style.opacity = p.interp ? .7 : 1;
      c.classList.toggle('g5-hors', p.v[f] > B[f] && AV[f] <= B[f]); }); });
  document.querySelectorAll('.g5-ibu i').forEach(function (c) { var p = D[+c.dataset.i];
    if (p.ibu == null) { c.className = 'g5-x'; return; }
    c.style.background = p.ibu > ${IBU_16D[1]} ? hex('#c2410c', Math.min(1, 0.25 + (p.ibu - 70) / 100)) : '#9a9aa6'; });
}
function colX(i) { var c = grille.querySelector('.g5-ibu i[data-i="' + i + '"]'), r = grille.getBoundingClientRect(), b = c.getBoundingClientRect(); return [b.left - r.left, b.width]; }
function poser(i) { cur = i; var p = D[i]; aria(grille, i);
  var x = colX(i), col = grille.querySelector('.g5-col'); col.style.left = (x[0] - 3) + 'px'; col.style.width = (x[1] + 6) + 'px';
  var m = colX(MEILLEUR), mm = grille.querySelector('.g5-meil'); mm.style.left = (m[0] + m[1] / 2) + 'px';
  document.querySelector('.g5-mom').textContent = p.lib + (i === MEILLEUR ? ' · meilleur' : '');
  var s = p.interp ? '≈' : '~';
  document.querySelector('.g5-txt').innerHTML = '<b style="color:#9840bc">floral ' + s + sg(delta(p, 'floral')) + '</b> · résineux ' + s + sg(delta(p, 'resin')) + ' · <span style="color:' + (p.ibu > ${IBU_16D[1]} ? '#c2410c' : '#16161a') + '">' + ibuTxt(p) + ibuEtat(p) + '</span>';
  window.pontLevure(p); }
window.redessiner = function () { peindre(); poser(cur); };
peindre();
glisser(grille, function (e) { var best = 0, bd = 1e9, r = grille.getBoundingClientRect(); for (var k = 0; k <= N; k++) { var x = colX(k); var d = Math.abs(x[0] + x[1] / 2 - (e.clientX - r.left)); if (d < bd) { bd = d; best = k; } } return best; }, poser);
poser(cur);
</script>`;
  pages.g5 = page('g5', 'La carte de chaleur', corps, css, js);
}

// ======================================================================
// g6 — Sur la courbe de densité : le houblon posé sur la vie du moût, de la cuve à la garde.
// ======================================================================
{
  // Allure (schéma, pas une mesure) : DI 1,066 de la recette ; la densité finale n'est pas connue.
  const W = 370, HH = 200;
  const corps = `
${tete('Quand ajouter Idaho 7 ?')}
${contexte()}
${lentille('g6-leg', `<span>la courbe : l'allure de la densité de ta stout (schéma), de l'ébullition à la garde ; DI 1,066 (ta recette), densité finale inconnue</span><span>pendant l'actif, la levure transforme une part des arômes</span>${legCommune}`)}
<section class="gs-bloc g6-vie" data-libre="moment">
  <div ${slider('g6-piste')}>
  <svg class="g6-svg" width="${W - 20}" height="${HH}" viewBox="0 0 ${W - 20} ${HH}" aria-hidden="true"></svg>
  </div>
</section>
<section class="gs-bloc g6-res">
  <p class="g6-lieu"><b class="g6-mom"></b> <span class="g6-ibu"></span></p>
  ${barresHTML(['floral', 'berries', 'tropical', 'citrus', 'resin', 'green'])}
</section>
<div class="g6-vraie">${vraie('E03')}</div>
${pontLevure('etape')}`;
  const css = `${BARRES_CSS}
.g6-vie { padding:6px 0 4px; }
.g6-piste { touch-action:none; cursor:ew-resize; outline:none; display:flex; justify-content:center; }
.g6-t { font:600 12px var(--sans); fill:#55555f; }
.g6-res { gap:4px; }
.g6-res .gs-ba { min-height:24px; }
.g6-lieu { font-size:14px; min-height:22px; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.g6-mom { display:inline-block; background:var(--encre); color:#fff; border-radius:11px; padding:0 8px; font-weight:600; }
.g6-piste.gs-touche .g6-tok circle:first-child { r:15; }`;
  const js = `<script>${BARRES_JS}${GLISSER_JS}
var W = ${W - 20}, HH = ${HH}, NS = 'http://www.w3.org/2000/svg', svg = document.querySelector('.g6-svg');
var SEG = { ebu: [0.02, 0.42], wp: [0.47, 0.47], actif: [0.53, 0.75], apres: [0.79, 0.98] };
function X(i) { var p = D[i], idx = []; D.forEach(function (q, k) { if (q.seg === p.seg) idx.push(k); }); var s = SEG[p.seg], n = idx.length; return W * (n === 1 ? s[0] : s[0] + (s[1] - s[0]) * idx.indexOf(i) / (n - 1)); }
// densité : moût stable pendant l'ébullition et le WP (1,066), chute pendant l'actif, plateau après.
function Yx(x) { var t = x / W, haut = 58, bas = 150; if (t < 0.52) return haut; if (t > 0.77) return bas; var u = (t - 0.52) / 0.25; return haut + (bas - haut) * (1 - Math.cos(Math.PI * u)) / 2; }
function el(t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; }
(function () {
  svg.appendChild(el('rect', { x: W * 0.52, y: 20, width: W * 0.25, height: HH - 44, fill: '#eaf6f3', rx: 4 }));
  var t = el('text', { x: W * 0.645, y: 36, 'text-anchor': 'middle', class: 'g6-t', fill: '#2f6b5f' }); t.textContent = 'la levure travaille'; svg.appendChild(t);
  var pts = []; for (var x = 0; x <= W; x += 3) pts.push(x + ',' + Yx(x).toFixed(1));
  svg.appendChild(el('polyline', { points: pts.join(' '), fill: 'none', stroke: '#16161a', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
  [['ébullition', 0.22], ['WP', 0.47], ['actif', 0.64], ['après', 0.885]].forEach(function (s) { var e = el('text', { x: W * s[1], y: HH - 6, 'text-anchor': 'middle', class: 'g6-t' }); e.textContent = s[0]; svg.appendChild(e); });
  var d1 = el('text', { x: 4, y: 50, class: 'g6-t' }); d1.textContent = 'DI 1,066'; svg.appendChild(d1);
  var d2 = el('text', { x: W - 4, y: 140, 'text-anchor': 'end', class: 'g6-t' }); d2.textContent = 'DF ? · allure'; svg.appendChild(d2);
  D.forEach(function (p, i) { svg.appendChild(el('circle', { cx: X(i), cy: Yx(X(i)), r: 2, fill: '#9a9aa6' })); });
  var m = el('text', { x: X(MEILLEUR) - 16, y: Yx(X(MEILLEUR)) + 28, 'text-anchor': 'end', class: 'gs-meilleur', fill: '#0f6b4f' }); m.textContent = 'meilleur'; svg.appendChild(m);
  var g = el('g', { class: 'g6-tok' }); g.appendChild(el('circle', { r: 11, fill: '#fff', stroke: '${COUL_I7}', 'stroke-width': 3 })); g.appendChild(el('circle', { r: 4, fill: '${COUL_I7}' })); svg.appendChild(g);
})();
function poser(i) { cur = i; var p = D[i], piste = document.querySelector('.g6-piste'); aria(piste, i);
  document.querySelector('.g6-tok').setAttribute('transform', 'translate(' + X(i).toFixed(1) + ',' + Yx(X(i)).toFixed(1) + ')');
  document.querySelector('.g6-mom').textContent = p.lib + (i === MEILLEUR ? ' · meilleur' : '');
  var ib = document.querySelector('.g6-ibu'); ib.textContent = ibuTxt(p) + ibuEtat(p); ib.style.color = p.ibu > ${IBU_16D[1]} ? '#c2410c' : '#55555f';
  majBarres(p); document.querySelector('.g6-vraie').style.opacity = p.seg === 'actif' ? 1 : .55;
  window.pontLevure(p); }
window.redessiner = function () { poser(cur); };
var piste = document.querySelector('.g6-piste');
glisser(piste, function (e) { var r = svg.getBoundingClientRect(), x = e.clientX - r.left, best = 0, bd = 1e9; for (var k = 0; k <= N; k++) { var d = Math.abs(X(k) - x); if (d < bd) { bd = d; best = k; } } return best; }, poser);
poser(cur);
</script>`;
  pages.g6 = page('g6', 'Sur la courbe de densité', corps, css, js);
}

// ======================================================================
// g7 — Le radar qui respire (m4 / h4) : ta stout en gris, avec Idaho 7 en violet ; l'ascenseur du brassin.
// ======================================================================
{
  const T = 270, c = T / 2, r = c - 30, n = ROUE.length, M = 2;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const xy = (i, v) => { const k = (Math.min(v, M) / M) * r; return [c + k * Math.cos(ang(i)), c + k * Math.sin(ang(i))]; };
  const poly = (vals) => vals.map((v, i) => xy(i, v).map((z) => z.toFixed(1)).join(',')).join(' ');
  let s = `<svg class="g7-radar" width="${T}" height="${T}" viewBox="0 0 ${T} ${T}" data-radar data-objet="houblons" data-axes="${ROUE.join(',')}" role="img" aria-label="Radar au style, 12 familles">`;
  s += `<defs><pattern id="g7-h" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#c9cad2" stroke-width="1.5"/></pattern></defs>`;
  ROUE.forEach((f, i) => { if (!INCONNUS.includes(f)) return; const a0 = ang(i - 0.5), a1 = ang(i + 0.5); s += `<path d="M${c},${c} L${(c + r * Math.cos(a0)).toFixed(1)},${(c + r * Math.sin(a0)).toFixed(1)} A${r},${r} 0 0 1 ${(c + r * Math.cos(a1)).toFixed(1)},${(c + r * Math.sin(a1)).toFixed(1)} Z" fill="url(#g7-h)"/>`; });
  for (const k of [0.5, 1.5, 2]) s += `<polygon points="${poly(ROUE.map(() => k))}" fill="none" stroke="#e1e3e9"/>`;
  ROUE.forEach((f, i) => { const [x, y] = xy(i, M); s += `<line x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e1e3e9"/>`; });
  s += `<polygon class="g7-zone" data-role="zone" points="${poly(ROUE.map(() => 1))}" fill="#c9cdd6" fill-opacity=".45" stroke="#9a9aa6"/>`;
  s += `<g data-serie="ma stout" data-couleur="#55555f"><polygon class="g7-av" fill="none" stroke="#55555f" stroke-width="2.5" stroke-linejoin="round"/></g>`;
  s += `<g data-serie="Idaho 7" data-couleur="${COUL_I7}"><polygon class="g7-ap" fill="none" stroke="${COUL_I7}" stroke-width="2.5" stroke-linejoin="round"/><g class="g7-sort"></g></g>`;
  ROUE.forEach((f, i) => { const k = r + 18; const x = c + k * Math.cos(ang(i)), y = c + k * Math.sin(ang(i)); s += `<svg x="${(x - 9).toFixed(1)}" y="${(y - 9).toFixed(1)}" width="18" height="18" viewBox="0 0 24 24" data-famille="${f}" aria-label="${COURT[f]}"><use href="#p-${f}"/></svg>`; });
  s += '</svg>';
  const libRail = (p) => (p.seg === 'ebu' ? (['b60', 'b30', 'b10'].includes(p.id) ? p.court : '') : p.j ? p.j + ' j' : p.court);
  const corps = `
${tete('Quand ajouter Idaho 7 ?')}
${contexte()}
${lentille('g7-leg', `<span>gris : ta stout ; violet : avec Idaho 7 ; zone grise : le style 16D ; trait orangé qui sort : au-delà de ×2</span><span>~ simulé · ≈ interpolé · hachuré : inconnu</span>`)}
<section class="g7-scene">
  <div class="gs-bloc g7-g" data-acquis="radar">${s}<p class="g7-rep"><b class="g7-mom"></b><span class="g7-txt"></span></p></div>
  <div class="g7-asc" data-libre="moment"><div ${slider('g7-rail')}>${POS.map((p, i) => `${p.j === 1 ? `<span class="g7-h">${p.seg === 'actif' ? 'actif' : 'après'}</span>` : ''}<span class="g7-c${i === iMeil ? ' g7-m' : ''}" data-i="${i}" style="--c:${SEGC[p.seg]}">${libRail(p)}</span>`).join('')}<span class="g7-pouce"></span></div></div>
</section>
<div class="gs-bloc g7-ibu"><span>amertume</span><span class="g7-jauge"><i class="g7-z" data-role="zone"></i><i class="g7-r"></i><i class="g7-hach"></i></span><span class="g7-v gs-num"></span></div>
${vraie('E10')}
${pontLevure('outil')}`;
  const css = `
.g7-scene { display:grid; grid-template-columns:1fr 70px; gap:6px; }
.g7-g { padding:6px 4px; align-items:center; }
.g7-rep { font-size:13px; text-align:center; display:flex; flex-direction:column; gap:2px; }
.g7-mom { font-size:15px; }
.g7-asc { background:#fff; border-radius:8px; padding:6px 4px; }
.g7-rail { position:relative; height:100%; display:flex; flex-direction:column; touch-action:none; outline:none; cursor:ns-resize; }
.g7-c { flex:1; display:flex; align-items:center; justify-content:flex-end; padding-right:16px; font:12px var(--mono); color:var(--gris); border-right:4px solid var(--c); min-height:13px; white-space:nowrap; }
.g7-h { font:600 12px var(--sans); color:var(--encre); text-align:right; padding:4px 16px 0 0; }
.g7-c.g7-m { color:#0f6b4f; font-weight:700; }
.g7-pouce { position:absolute; right:-9px; width:18px; height:18px; margin-top:-9px; border-radius:50%; background:#fff; border:3px solid var(--encre); transition:top .08s ease-out; }
.g7-rail.gs-touche .g7-pouce { width:24px; height:24px; margin-top:-12px; right:-12px; }
.g7-ibu { display:grid; grid-template-columns:70px 1fr 104px; align-items:center; gap:6px; font-size:13px; padding:6px 10px; }
.g7-jauge { position:relative; height:12px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.g7-jauge i { position:absolute; top:0; bottom:0; display:block; }
.g7-z { background:#d9dce3; left:${(50 / 170 * 100).toFixed(2)}%; width:${(20 / 170 * 100).toFixed(2)}%; }
.g7-r { left:0; height:6px; top:3px !important; border-radius:2px; }
.g7-hach { background:repeating-linear-gradient(135deg,#9a9aa6 0 2px,transparent 2px 6px); }
.g7-v { text-align:right; font-size:12px; }`;
  const js = `<script>${GLISSER_JS}
var ROUE = ${JSON.stringify(ROUE)}, c = ${c}, r = ${r}, M = 2, n = 12;
function ang(i) { return -Math.PI / 2 + i * 2 * Math.PI / n; }
function xy(i, v) { var k = Math.min(v, M) / M * r; return [c + k * Math.cos(ang(i)), c + k * Math.sin(ang(i))]; }
function poly(vals) { return vals.map(function (v, i) { return xy(i, v).map(function (z) { return z.toFixed(1); }).join(','); }).join(' '); }
var rail = document.querySelector('.g7-rail');
function Y(i) { var e = rail.querySelector('[data-i="' + i + '"]'); return e.offsetTop + e.offsetHeight / 2; }
function poser(i) { cur = i; var p = D[i]; aria(rail, i);
  var val = function (src) { return ROUE.map(function (f) { return INC.indexOf(f) >= 0 ? 0 : lire(f, src[f]) * (abs() ? 2 : 1); }); };
  var zv = ROUE.map(function (f) { return abs() ? B[f] / 110 * 2 : 1; });
  document.querySelector('.g7-zone').setAttribute('points', poly(zv));
  var av = val(AV), ap = val(p.v);
  document.querySelector('.g7-av').setAttribute('points', poly(av)); document.querySelector('.g7-ap').setAttribute('points', poly(ap));
  document.querySelector('[data-serie="Idaho 7"]').setAttribute('data-valeurs', ap.map(function (x) { return x.toFixed(2); }).join(','));
  document.querySelector('[data-serie="ma stout"]').setAttribute('data-valeurs', av.map(function (x) { return x.toFixed(2); }).join(','));
  var so = document.querySelector('.g7-sort'); so.innerHTML = '';
  ap.forEach(function (x, k) { if (x <= M) return; var a = ang(k), qq = xy(k, M); var l = document.createElementNS('http://www.w3.org/2000/svg', 'line'); l.setAttribute('x1', qq[0]); l.setAttribute('y1', qq[1]); l.setAttribute('x2', c + (r + 10) * Math.cos(a)); l.setAttribute('y2', c + (r + 10) * Math.sin(a)); l.setAttribute('stroke', '#c2410c'); l.setAttribute('stroke-width', 2.5); l.setAttribute('stroke-linecap', 'round'); so.appendChild(l); });
  document.querySelector('.g7-mom').textContent = p.lib + (i === MEILLEUR ? ' · meilleur' : '');
  var s = p.interp ? '≈' : '~';
  document.querySelector('.g7-txt').innerHTML = '<span style="color:#9840bc">floral ' + s + sg(delta(p, 'floral')) + '</span> · <span style="color:#9b3f74">baies ' + s + sg(delta(p, 'berries')) + '</span> · <span style="color:#c2410c">résineux ' + s + sg(delta(p, 'resin')) + '</span>';
  rail.querySelector('.g7-pouce').style.top = Y(i) + 'px';
  var rr = document.querySelector('.g7-r'), h = document.querySelector('.g7-hach');
  if (p.ibu == null) { rr.style.width = 60 / 170 * 100 + '%'; h.style.left = 60 / 170 * 100 + '%'; h.style.width = 20 / 170 * 100 + '%'; h.hidden = false; } else { rr.style.width = Math.min(100, p.ibu / 170 * 100) + '%'; h.hidden = true; }
  rr.style.background = p.ibu > ${IBU_16D[1]} ? '#c2410c' : '#55555f';
  document.querySelector('.g7-v').textContent = p.ibu == null ? '~60 + ?' : '~' + p.ibu + (p.ibu > ${IBU_16D[1]} ? ' trop amer' : ' · 16D');
  window.pontLevure(p); }
window.redessiner = function () { poser(cur); };
glisser(rail, function (e) { var rt = rail.getBoundingClientRect(), y = e.clientY - rt.top, best = 0, bd = 1e9; for (var k = 0; k <= N; k++) { var d = Math.abs(Y(k) - y); if (d < bd) { bd = d; best = k; } } return best; }, poser);
poser(cur);
</script>`;
  pages.g7 = page('g7', 'Le radar qui respire', corps, css, js);
}

// ======================================================================
// g8 — Le ruban, contre le geste habituel : chaque moment face au dry hop après 3 j ; le brassin
// défile sous l'aiguille comme un mètre ruban.
// ======================================================================
{
  const iRef = POS.findIndex((p) => p.id === 'dryPost|3');
  const sous = (p) => (p.seg === 'ebu' ? (p.id === 'b60' ? 'ébullition' : '') : p.seg === 'wp' ? 'whirlpool' : p.j === 1 ? (p.seg === 'actif' ? 'actif' : 'après') : '');
  const corps = `
${tete('Quand ajouter Idaho 7 ?')}
${contexte()}
${lentille('g8-leg', `<span>barres : ce moment contre le dry hop après 3 j (le geste habituel) ; à droite : plus, à gauche : moins</span><span>petite piste : où tu tombes face au style 16D (zone grise)</span><span>~ simulé · ≈ interpolé · hachuré : inconnu</span>`)}
<section class="gs-bloc g8-duel">
  <p class="g8-t"><b class="g8-mom"></b><span class="g8-vs">contre après · 3 j</span></p>
  <div class="g8-axe"><span>moins</span><span>plus</span></div>
  ${ORDRE.map((f) => `<div class="g8-l" data-f="${f}"><span class="g8-n">${pi(f)}${COURT[f]}</span><span class="g8-div">${INCONNUS.includes(f) ? '<i class="g8-x"></i>' : `<i class="g8-b" style="background:${JETONS[f].base}"></i>`}<i class="g8-0"></i></span><span class="g8-v"></span><span class="g8-p"><i class="g8-z" data-role="zone"></i><i class="g8-o"></i></span></div>`).join('')}
  <div class="g8-l g8-ibu"><span class="g8-n">IBU</span><span class="g8-ibu-t"></span></div>
</section>
${vraie('E10')}
${pontLevure('etape')}
<div class="g8-dock" data-libre="moment"><div ${slider('g8-ruban')}><div class="g8-bande">${POS.map((p, i) => `<span class="g8-c${i === iMeil ? ' g8-m' : ''}${i === iRef ? ' g8-r' : ''}" data-i="${i}" style="--c:${SEGC[p.seg]}"><b>${p.court}</b><i>${sous(p)}</i></span>`).join('')}</div><i class="g8-aig"></i></div></div>`;
  const css = `
.gs-ecran { padding-bottom:84px; }
.g8-duel { gap:3px; }
.g8-t { display:flex; align-items:baseline; gap:8px; font-size:14px; }
.g8-mom { font-size:16px; }
.g8-vs { color:var(--gris); font-size:13px; }
.g8-axe { display:grid; grid-template-columns:86px 1fr 1fr 106px; font-size:12px; color:var(--gris); }
.g8-axe span:first-child { grid-column:2; } .g8-axe span:last-child { grid-column:3; text-align:right; }
.g8-l { display:grid; grid-template-columns:86px 1fr 44px 58px; gap:4px; align-items:center; font-size:13px; min-height:25px; }
.g8-n { display:flex; align-items:center; gap:4px; white-space:nowrap; }
.g8-div { position:relative; height:12px; background:#f6f7f9; border-radius:2px; }
.g8-div i { position:absolute; top:2px; bottom:2px; display:block; border-radius:2px; transition:all .12s ease-out; }
.g8-0 { left:50% !important; width:2px; top:0 !important; bottom:0 !important; background:var(--encre); margin-left:-1px; border-radius:0 !important; }
.g8-x { left:0; right:0; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
.g8-v { text-align:right; font:12px var(--mono); }
.g8-p { position:relative; height:8px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.g8-p i { position:absolute; top:0; bottom:0; display:block; }
.g8-z { left:0; background:#d9dce3; }
.g8-o { width:6px; margin-left:-3px; border-radius:2px; background:var(--encre); }
.g8-ibu { grid-template-columns:86px 1fr; }
.g8-ibu-t { font:13px var(--mono); }
.g8-dock { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid #c9cad2; height:74px; overflow:hidden; touch-action:none; z-index:10; }
.g8-ruban { position:relative; height:100%; outline:none; cursor:grab; }
.g8-bande { position:absolute; top:10px; left:0; display:flex; transition:transform .1s ease-out; }
.g8-ruban.gs-touche .g8-bande { transition:none; }
.g8-c { width:52px; flex:none; display:flex; flex-direction:column; align-items:center; gap:2px; border-top:4px solid var(--c); padding-top:6px; }
.g8-c b { font:600 14px var(--mono); color:var(--encre); }
.g8-c i { font:normal 12px var(--sans); color:var(--gris); white-space:nowrap; height:15px; }
.g8-c.g8-m b { color:#0f6b4f; }
.g8-c.g8-r b { text-decoration:underline; }
.g8-c.g8-ici b { background:var(--i7); color:#fff; border-radius:4px; padding:0 4px; text-decoration:none; }
.g8-aig { position:absolute; left:50%; top:0; height:20px; width:3px; margin-left:-1.5px; background:var(--i7); pointer-events:none; }`;
  const js = `<script>${GLISSER_JS}
var REF = ${iRef}, ruban = document.querySelector('.g8-ruban'), bande = document.querySelector('.g8-bande'), PAS = 52;
function decal(i) { return ruban.clientWidth / 2 - PAS / 2 - i * PAS; }
function poser(i) { cur = i; var p = D[i], r = D[REF]; aria(ruban, i); bande.style.transform = 'translateX(' + decal(i) + 'px)';
  bande.querySelectorAll('.g8-c').forEach(function (c) { c.classList.toggle('g8-ici', +c.dataset.i === i); });
  document.querySelector('.g8-mom').textContent = p.lib + (i === MEILLEUR ? ' · meilleur' : '');
  var mx = 0.01; Object.keys(B).forEach(function (f) { if (INC.indexOf(f) < 0) D.forEach(function (qq) { mx = Math.max(mx, Math.abs(lire(f, qq.v[f] - r.v[f]))); }); });
  document.querySelectorAll('.g8-l[data-f]').forEach(function (l) { var f = l.dataset.f, v = l.querySelector('.g8-v');
    var Hs = function (x) { return Math.max(0, Math.min(100, abs() ? x / 110 * 100 : x / B[f] / 2 * 100)); };
    l.querySelector('.g8-z').style.width = (abs() ? B[f] / 110 * 100 : 50) + '%';
    if (INC.indexOf(f) >= 0) { v.textContent = '?'; v.style.color = '#55555f'; l.querySelector('.g8-o').hidden = true; return; }
    var d = p.v[f] - r.v[f], w = Math.abs(lire(f, d)) / mx * 50, b = l.querySelector('.g8-b');
    b.style.left = (d >= 0 ? 50 : 50 - w) + '%'; b.style.width = w + '%';
    v.textContent = Math.abs(d) >= 0.5 ? (p.interp ? '≈' : '~') + sg(d) : '='; v.style.color = TX[f];
    l.querySelector('.g8-o').style.left = Hs(p.v[f]) + '%'; l.querySelector('.g8-o').style.background = p.v[f] > B[f] ? '#c2410c' : '#16161a'; });
  var it = document.querySelector('.g8-ibu-t'); it.textContent = p.ibu == null ? '~60 + ? (à cru, comme après 3 j)' : '~' + p.ibu + ' contre ~60 + ?' + ibuEtat(p); it.style.color = p.ibu > ${IBU_16D[1]} ? '#c2410c' : '#16161a';
  window.pontLevure(p); }
window.redessiner = function () { poser(cur); };
var x0 = null, i0 = 0;
ruban.addEventListener('pointerdown', function (e) { x0 = e.clientX; i0 = cur; try { ruban.setPointerCapture(e.pointerId); } catch (_) {} ruban.classList.add('gs-touche'); e.preventDefault(); });
ruban.addEventListener('pointermove', function (e) { if (x0 == null) return; var dx = e.clientX - x0; var k = Math.max(0, Math.min(N, i0 - Math.round(dx / PAS))); if (k !== cur) poser(k); bande.style.transform = 'translateX(' + (decal(i0) + dx) + 'px)'; });
['pointerup', 'pointercancel'].forEach(function (t) { ruban.addEventListener(t, function () { x0 = null; ruban.classList.remove('gs-touche'); poser(cur); }); });
ruban.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') poser(Math.min(N, cur + 1)); if (e.key === 'ArrowLeft') poser(Math.max(0, cur - 1)); });
poser(cur);
</script>`;
  pages.g8 = page('g8', 'Le ruban, contre le geste habituel', corps, css, js);
}

// ---------- écriture ----------
for (const [id, html] of Object.entries(pages)) {
  fs.mkdirSync(path.join(ici, id), { recursive: true });
  fs.writeFileSync(path.join(ici, id, 'etat.html'), html);
}
console.log('écrit : ' + Object.keys(pages).join(', '));

if (process.argv.includes('--captures')) {
  const puppeteer = (await import('puppeteer-core')).default;
  const cap = path.join(ici, 'captures'), trav = path.join(cap, 'travail');
  fs.mkdirSync(trav, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  // Geste réel au doigt par concept : d'où à où on glisse (fractions de la boîte du contrôle).
  const GESTE = { g1: [[0.62, 0.5], [0.08, 0.5]], g2: [[0.62, 0.5], [0.1, 0.5]], g3: [[0.7, 0.2], [0.1, 0.75]], g4: [[0.5, 0.5], [3.5, 0.5]], g5: [[0.62, 0.5], [0.3, 0.5]], g6: [[0.64, 0.5], [0.1, 0.5]], g7: [[0.5, 0.6], [0.5, 0.05]], g8: [[0.5, 0.5], [1.4, 0.5]] };
  for (const id of Object.keys(pages)) {
    const p = await browser.newPage();
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.goto(pathToFileURL(path.join(ici, id, 'etat.html')).href, { waitUntil: 'networkidle0' });
    await attendre(300);
    await p.screenshot({ path: path.join(cap, id + '-390.png') });
    const b = await p.$eval('[role=slider]', (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    const [[ax, ay], [bx, by]] = GESTE[id];
    const P = (fx, fy) => ({ x: Math.max(2, Math.min(388, b.x + b.w * fx)), y: b.y + b.h * fy });
    const a = P(ax, ay), z = P(bx, by);
    await p.touchscreen.touchStart(a.x, a.y);
    for (let k = 1; k <= 10; k++) { await p.touchscreen.touchMove(a.x + (z.x - a.x) * k / 10, a.y + (z.y - a.y) * k / 10); await attendre(30); }
    await p.screenshot({ path: path.join(trav, id + '-pendant.png') });
    await p.touchscreen.touchEnd();
    await attendre(250);
    const v = await p.$eval('[role=slider]', (e) => e.getAttribute('aria-valuetext'));
    console.log(id + ' · geste au doigt → ' + v);
    await p.screenshot({ path: path.join(cap, id + '-apres-geste-390.png') });
    await p.close();
  }
  await browser.close();
}
