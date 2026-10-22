// a6 · tiède · « Tirer la barre » : le geste part de ce qu'on veut. On tire le floral (ta demande : « je la
// veux plus florale ») ou on repousse l'amertume ; le moment suit et se pose au plus tôt qui donne ce qu'on
// tire. À valeur égale, il prend le plus floral, puis le plus court. Les autres familles suivent dessous.
import { I_SABLIER } from '../socle.mjs';

export default {
  id: 'a6', nom: 'Tirer la barre', chaleur: 'tiède', levure: 'pont',
  titre: 'Quand ajouter Idaho 7 ?',
  legende: ['Tire la poignée du floral ou de l\'amertume : le moment suit.', 'Trait fin : là où tu tires ; barre : ce que le moment donne vraiment.', 'Rond : ta stout avant ; gris : la zone du style.', '~ simulé · ≈ interpolé · ? inconnu, hachuré.'],
  css: `
.a6-mom { display:flex; align-items:center; gap:8px; background:#fff; border-radius:8px; padding:6px 10px; }
.a6-mom b { font:700 18px var(--sans); }
.a6-mom span { font-size:13px; color:var(--gris); }
.a6-frise { position:relative; flex:1; height:14px; margin-left:6px; }
.a6-frise i { position:absolute; top:5px; width:4px; height:4px; margin-left:-2px; border-radius:50%; background:#c9cdd6; }
.a6-frise i.a6-ici { top:1px; width:12px; height:12px; margin-left:-6px; background:var(--i7); }
.a6-tire { gap:10px; touch-action:none; }
.a6-l { display:flex; flex-direction:column; gap:3px; }
.a6-lt { display:flex; align-items:center; gap:5px; font-size:14px; font-weight:700; }
.a6-lt .a6-v { margin-left:auto; font:700 18px var(--mono); }
.a6-p { position:relative; height:28px; background:#f1f2f5; border-radius:4px; cursor:ew-resize; }
.a6-p i { position:absolute; display:block; }
.a6-p .a6-z { top:0; bottom:0; left:0; background:#d9dce3; border-radius:4px 0 0 4px; }
.a6-p .a6-b { top:7px; height:14px; left:0; border-radius:2px; transition:width .2s cubic-bezier(.2,.8,.2,1); }
.a6-p .a6-av { top:7px; width:14px; height:14px; margin-left:-7px; border-radius:50%; border:2px solid var(--encre); background:#fff; }
.a6-p .a6-cib { top:-3px; bottom:-3px; width:2px; margin-left:-1px; background:var(--encre); }
.a6-p .a6-poi { top:50%; width:30px; height:30px; margin:-15px 0 0 -15px; border-radius:50%; background:#fff; border:3px solid var(--encre); transition:left .2s cubic-bezier(.2,.8,.2,1); }
.a6-p .a6-poi::after { content:""; position:absolute; left:11px; top:6px; width:2px; height:12px; background:var(--encre); border-radius:2px; }
.a6-am .a6-v.a6-h { color:var(--acc); }
.a6-am .a6-b.a6-h { background:var(--acc) !important; }
`,
  corps: `
<div class="a6-mom" aria-live="polite"><span>moment</span><b id="a6-mom">actif · 3 j</b><span class="a6-frise" id="a6-frise" aria-hidden="true"></span></div>
<section class="s-bloc a6-tire" data-libre="moment" aria-label="Tire ce que tu veux">
  <div class="a6-l a6-fl"><span class="a6-lt"><svg class="s-pi" width="20" height="20" style="width:20px;height:20px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span style="color:#9840bc">Floral</span><span class="a6-v" id="a6-flv" style="color:#9840bc">~+22</span></span>
    <span class="a6-p" id="a6-pf" role="slider" tabindex="0" aria-label="Moment de l'ajout, en tirant le floral" aria-valuemin="0" aria-valuemax="23" data-sans-menu><i class="a6-z" data-role="zone"></i><i class="a6-b" style="background:#bf86d6"></i><i class="a6-av"></i><i class="a6-cib" hidden></i><i class="a6-poi"></i></span></div>
  <div class="a6-l a6-am"><span class="a6-lt"><span>Amertume de ta stout</span><span class="a6-v" id="a6-amv">60 IBU</span></span>
    <span class="a6-p" id="a6-pa" role="slider" tabindex="0" aria-label="Moment de l'ajout, en repoussant l'amertume" aria-valuemin="0" aria-valuemax="23" data-sans-menu><i class="a6-z" style="left:29.4%;width:11.8%;border-radius:0"></i><i class="a6-b" style="background:#16161a"></i><i class="a6-cib" hidden></i><i class="a6-poi"></i></span></div>
  <p class="s-src">${I_SABLIER}<span><b>mesuré</b> : l'essentiel passe en 2 j, tirer plus longtemps ne donne rien · Schmidt 2019, E08</span></p>
</section>
<section class="s-bloc" id="a6-barres" aria-label="Les autres familles"></section>`,
  script: function () {
    var S = window.S, D = S.D, N = S.N, B = S.B, i = S.depart();
    var abs = function () { return document.body.classList.contains('abs'); };
    var pctF = function (x) { return Math.min(100, abs() ? x / 110 * 100 : x / B.floral / 2 * 100); };
    var valF = function (pc) { return abs() ? pc / 100 * 110 : pc / 100 * 2 * B.floral; };
    var pctA = function (n) { return Math.min(100, n / 170 * 100); };
    var pf = document.getElementById('a6-pf'), pa = document.getElementById('a6-pa');
    var fr = document.getElementById('a6-frise'), h = '';
    for (var k = 0; k <= N; k++) h += '<i style="left:' + (2 + 96 * k / N) + '%"></i>';
    fr.innerHTML = h;
    var autres = S.ORDRE.filter(function (f) { return f !== 'floral'; }), majB = S.barres(document.getElementById('a6-barres'), autres);
    // À valeur visée égale : le plus floral, puis l'amertume la plus basse, puis le plus tôt.
    function choisir(score) {
      var best = 0, bs = 1e9;
      for (var k = 0; k <= N; k++) { var s = score(D[k]); if (s == null) continue; var t = s * 1000 - D[k].v.floral * 10 + S.ibu(D[k]).n / 100; if (t < bs - 1e-9) { bs = t; best = k; } }
      return best;
    }
    function poser(n) {
      i = n; var p = D[i], b = S.ibu(p);
      document.getElementById('a6-mom').textContent = p.lib;
      fr.querySelectorAll('i').forEach(function (e, k) { e.classList.toggle('a6-ici', k === i); });
      pf.querySelector('.a6-z').style.width = abs() ? (B.floral / 110 * 100) + '%' : '50%';
      pf.querySelector('.a6-av').style.left = pctF(S.AV.floral) + '%';
      pf.querySelector('.a6-b').style.width = pctF(p.v.floral) + '%'; pf.querySelector('.a6-poi').style.left = pctF(p.v.floral) + '%';
      pf.setAttribute('aria-valuenow', i); pf.setAttribute('aria-valuetext', p.lib); pa.setAttribute('aria-valuenow', i); pa.setAttribute('aria-valuetext', p.lib);
      document.getElementById('a6-flv').textContent = S.fmt(p, 'floral');
      pa.querySelector('.a6-b').style.width = pctA(b.n) + '%'; pa.querySelector('.a6-b').classList.toggle('a6-h', b.h); pa.querySelector('.a6-poi').style.left = pctA(b.n) + '%';
      var av = document.getElementById('a6-amv'); av.textContent = b.t + (b.h ? ', trop amer' : ', tenue'); av.classList.toggle('a6-h', b.h);
      majB(p);
    }
    function tirer(el, e) {
      var r = el.getBoundingClientRect(), pc = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)), c = el.querySelector('.a6-cib');
      c.hidden = false; c.style.left = pc + '%';
      var n = el === pf ? choisir(function (p) { return Math.abs(p.v.floral - valF(pc)); }) : choisir(function (p) { return Math.abs(S.ibu(p).n - pc / 100 * 170); });
      if (n !== i) poser(n);
    }
    [pf, pa].forEach(function (el) {
      var on = false;
      el.addEventListener('pointerdown', function (e) { el.setPointerCapture(e.pointerId); on = true; tirer(el, e); });
      el.addEventListener('pointermove', function (e) { if (on) tirer(el, e); });
      el.addEventListener('pointerup', function () { on = false; el.querySelector('.a6-cib').hidden = true; });
      el.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') poser(Math.min(N, i + 1)); if (e.key === 'ArrowLeft') poser(Math.max(0, i - 1)); });
    });
    S.surLecture(function () { poser(i); });
    poser(i);
  },
};
