// a8 · tiède · « Déposer dans la brasserie » : quatre postes du brassin en tuiles. On prend la pastille
// Idaho 7 et on la dépose dans la chaudière, le whirlpool, la cuve qui fermente ou la cuve au repos ; un
// toucher sur la tuile suffit aussi. Dans la tuile choisie, ‹ › règle les minutes ou les jours.
import { I_SABLIER } from '../socle.mjs';

export default {
  id: 'a8', nom: 'Déposer dans la brasserie', chaleur: 'tiède', levure: 'pont',
  titre: 'Quand ajouter Idaho 7 ?',
  legende: ['Glisse la pastille rouge (Idaho 7) dans un poste, ou touche le poste.', '‹ › dans le poste : les minutes ou les jours de contact.', 'Dans chaque poste : floral et amertume à son réglage.', '~ simulé · ≈ interpolé · ? inconnu, hachuré.'],
  css: `
.a8-gr { display:grid; grid-template-columns:1fr 1fr; gap:6px; position:relative; }
.a8-t { position:relative; display:flex; flex-direction:column; gap:3px; min-height:104px; padding:8px; border-radius:8px; background:#f1f2f5; border:2px solid transparent; cursor:pointer; touch-action:none; }
.a8-t[aria-checked="true"] { background:#fff; border-color:var(--encre); }
.a8-t.a8-vise { border-color:var(--i7); border-style:dashed; }
.a8-tn { display:flex; align-items:center; gap:6px; font-size:14px; font-weight:600; }
.a8-tn svg { color:var(--gris); }
.a8-tv { display:flex; align-items:center; gap:4px; font:600 13px var(--mono); color:#9840bc; }
.a8-ti { font-size:12px; font-weight:600; }
.a8-ti.a8-h { color:var(--acc); }
.a8-pas { display:none; align-items:center; gap:4px; margin-top:auto; }
.a8-t[aria-checked="true"] .a8-pas { display:flex; }
.a8-pas button { width:30px; height:28px; border-radius:14px; border:1px solid #c9cad2; background:#fff; font:700 16px var(--sans); }
.a8-pas b { font:700 15px var(--mono); min-width:44px; text-align:center; }
.a8-pa { position:absolute; display:block; width:28px; height:28px; border-radius:50%; background:var(--i7); border:3px solid #fff; outline:1px solid var(--i7); cursor:grab; touch-action:none; user-select:none; -webkit-user-select:none; z-index:5; transition:left .2s cubic-bezier(.2,.8,.2,1), top .2s cubic-bezier(.2,.8,.2,1); }
.a8-pa.a8-vol { transition:none; box-shadow:0 8px 24px -10px rgba(22,22,26,.6); }
.a8-rep { display:flex; flex-wrap:wrap; align-items:center; gap:4px 8px; font-size:16px; }
.a8-rep b { font-weight:600; }
.a8-fl { display:inline-flex; align-items:center; gap:4px; color:#9840bc; font-weight:700; }
.a8-am.a8-h { color:var(--acc); font-weight:600; }
#a8-barres .s-ba { min-height:16px; }
`,
  corps: `
<section class="s-bloc" data-libre="moment" aria-label="Les postes du brassin">
  <div class="a8-gr" id="a8-gr" role="radiogroup" aria-label="Moment, par poste"></div>
</section>
<p class="a8-rep" aria-live="polite"><b>Face à ta stout</b><span class="a8-fl"><svg class="s-pi" width="18" height="18" style="width:18px;height:18px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span id="a8-fl" class="num">~+22</span></span><span id="a8-am" class="a8-am">amertume tenue</span></p>
<section class="s-bloc" id="a8-barres" aria-label="Familles d'arômes au style"></section>
<p class="s-src" id="a8-src">${I_SABLIER}<span><b>mesuré</b> : 1 h ou 96 h de contact, même nez en bière jeune · Titus 2021, E10</span></p>`,
  script: function () {
    var S = window.S, D = S.D, N = S.N, gr = document.getElementById('a8-gr');
    var I = {
      ch: '<path d="M4 9h16v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z"/><path d="M2 9h20M9 5c0-1 1-1 1-2M14 5c0-1 1-1 1-2"/>',
      wp: '<path d="M12 12a2 2 0 1 1 2-2 4 4 0 1 1-4-4 6 6 0 1 1-6 6"/>',
      fe: '<path d="M6 3h12v10l-6 8-6-8Z"/><path d="M9 8c1 1 2-1 3 0s2-1 3 0"/>',
      re: '<path d="M6 3h12v10l-6 8-6-8Z"/><path d="M9 10h6"/>'
    };
    var PO = [
      { k: 'ch', nom: 'Chaudière', lab: 'Moment : ébullition', moins: 'Minute plus tôt', plus: 'Minute plus tard', t: function (p) { return p.id.charAt(0) === 'b'; } },
      { k: 'wp', nom: 'Whirlpool', lab: 'Moment : whirlpool', t: function (p) { return p.id === 'wp'; } },
      { k: 'fe', nom: 'En fermentation', lab: 'Moment : dry hop actif', moins: 'Jours de contact : un de moins', plus: 'Jours de contact : un de plus', t: function (p) { return p.id.indexOf('dryActive') === 0; } },
      { k: 're', nom: 'Au repos', lab: 'Moment : dry hop après', moins: 'Jours de contact : un de moins', plus: 'Jours de contact : un de plus', t: function (p) { return p.id.indexOf('dryPost') === 0; } }
    ];
    var i = S.depart(), poste = 0;
    PO.forEach(function (po, n) {
      po.idx = []; for (var k = 0; k <= N; k++) if (po.t(D[k])) po.idx.push(k);
      po.sel = po.idx.indexOf(i) >= 0 ? po.idx.indexOf(i) : n === 0 ? 0 : Math.min(2, po.idx.length - 1);
      if (po.idx.indexOf(i) >= 0) poste = n;
      var t = document.createElement('div'); t.className = 'a8-t'; t.setAttribute('role', 'radio'); t.tabIndex = 0; t.setAttribute('aria-label', po.lab); t.dataset.po = n;
      t.innerHTML = '<span class="a8-tn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[po.k] + '</svg>' + po.nom + '</span>'
        + '<span class="a8-tv">' + S.pi('floral', 14) + '<span class="a8-tf"></span></span><span class="a8-ti"></span>'
        + (po.moins ? '<span class="a8-pas"><button type="button" data-d="-1" aria-label="' + po.moins + '">‹</button><b class="a8-tm"></b><button type="button" data-d="1" aria-label="' + po.plus + '">›</button></span>' : '');
      t.addEventListener('click', function (e) { var b = e.target.closest('button[data-d]'); if (b) { po.sel = Math.max(0, Math.min(po.idx.length - 1, po.sel + +b.dataset.d)); } poste = n; peindre(); });
      gr.appendChild(t); po.el = t;
    });
    var pa = document.createElement('span'); pa.className = 'a8-pa'; pa.setAttribute('aria-hidden', 'true'); pa.dataset.sansMenu = ''; pa.dataset.couleur = '#e80030'; pa.dataset.serie = 'Idaho 7'; pa.innerHTML = ''; gr.appendChild(pa);
    var majB = S.barres(document.getElementById('a8-barres'));
    var vu = function (p) { return p.id.indexOf('dry') === 0 ? p.court.slice(1) + ' j' : p.court; };
    function peindre() {
      PO.forEach(function (po, n) {
        var p = D[po.idx[po.sel]], t = po.el, b = S.ibu(p);
        t.setAttribute('aria-checked', String(n === poste));
        t.querySelector('.a8-tf').textContent = S.fmt(p, 'floral') + (po.idx.length > 1 ? ' à ' + vu(p) : '');
        var ti = t.querySelector('.a8-ti'); ti.textContent = b.t + (b.h ? ', trop amer' : ''); ti.classList.toggle('a8-h', b.h);
        if (t.querySelector('.a8-tm')) t.querySelector('.a8-tm').textContent = vu(p);
      });
      var po = PO[poste]; i = po.idx[po.sel]; var p = D[i];
      pa.style.left = (po.el.offsetLeft + po.el.offsetWidth - 36) + 'px'; pa.style.top = (po.el.offsetTop + 8) + 'px';
      document.getElementById('a8-fl').textContent = S.fmt(p, 'floral');
      var b = S.ibu(p), am = document.getElementById('a8-am'); am.textContent = b.h ? b.t + ', trop amer' : 'amertume tenue'; am.classList.toggle('a8-h', b.h);
      document.getElementById('a8-src').hidden = poste < 2;
      majB(p);
    }
    // Glisser-déposer la pastille.
    var vol = null;
    pa.addEventListener('pointerdown', function (e) { pa.setPointerCapture(e.pointerId); var r = gr.getBoundingClientRect(); vol = { dx: e.clientX - r.left - pa.offsetLeft, dy: e.clientY - r.top - pa.offsetTop }; pa.classList.add('a8-vol'); e.preventDefault(); });
    pa.addEventListener('pointermove', function (e) {
      if (!vol) return; var r = gr.getBoundingClientRect(); pa.style.left = (e.clientX - r.left - vol.dx) + 'px'; pa.style.top = (e.clientY - r.top - vol.dy) + 'px';
      PO.forEach(function (po) { var b = po.el.getBoundingClientRect(); po.el.classList.toggle('a8-vise', e.clientX > b.left && e.clientX < b.right && e.clientY > b.top && e.clientY < b.bottom); });
    });
    pa.addEventListener('pointerup', function (e) {
      if (!vol) return; vol = null; pa.classList.remove('a8-vol');
      PO.forEach(function (po, n) { var b = po.el.getBoundingClientRect(); po.el.classList.remove('a8-vise'); if (e.clientX > b.left && e.clientX < b.right && e.clientY > b.top && e.clientY < b.bottom) poste = n; });
      peindre();
    });
    peindre(); addEventListener('resize', peindre);
  },
};
