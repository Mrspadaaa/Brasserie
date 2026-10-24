// sba2 · froide · u4 affinée autrement : le classement devient un rail sous le pouce, avec une loupe qui suit le doigt.
// La réponse occupe l'écran ; le pouce parcourt le rail à droite (ou touche une encoche).
import { CROIX, lentille, aide } from '../sba1/socle.mjs';

export default {
  id: 'sba2', nom: 'Le rail du pouce, avec loupe', chaleur: 'froide',
  etats: [['geste', '?choix=beermaverick-altus'], ['whirlpool', '?moment=wp'], ['legende', '?legende=1']],
  css: `
.sba2-page { padding:6px 0 150px 12px; display:grid; align-content:start; grid-template-columns:1fr 128px; gap:0 8px; }
.sba2-haut { grid-column:1 / -1; display:flex; align-items:center; gap:10px; padding-right:12px; }
.sba2-haut h1 { font:600 15px/1.2 var(--sans); color:var(--gris); }
.sba2-rep { display:flex; flex-direction:column; gap:8px; padding-top:8px; min-width:0; }
.sba2-nom { display:flex; align-items:center; gap:8px; }
.sba2-nom b { font:800 30px/1 var(--sans); letter-spacing:-.01em; }
.sba2-bar { height:6px; border-radius:2px; width:64px; }
.sba2-ctx { font-size:13px; color:var(--gris); display:flex; flex-wrap:wrap; gap:4px 8px; }
.sba2-ctx [data-contexte] { color:var(--encre); }
.sba2-id { display:flex; flex-wrap:wrap; gap:4px 10px; align-items:center; font-size:14px; }
.sba2-chif { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.sba2-chif div { background:var(--mur); border-radius:8px; padding:6px 8px; }
.sba2-chif b { display:block; font:700 20px/1.1 var(--mono); }
.sba2-chif span { font-size:12px; color:var(--gris); }
.sba2-chif .sba2-h b { color:var(--acc); }
.sba2-sc { display:flex; align-items:center; gap:8px; font-size:13px; }
.sba2-sc .sba2-tr { flex:1; position:relative; height:12px; background:#f1f2f5; border-radius:2px; }
.sba2-sc .sba2-tr i { position:absolute; top:0; bottom:0; border-radius:2px; }
.sba2-outil { display:flex; flex-wrap:wrap; align-items:center; gap:6px; position:relative; }
.sba2-outil span:first-child { font-size:12px; color:var(--gris); flex-basis:100%; }
.sba2-fam { display:flex; flex-direction:column; gap:3px; }
.sba2-fam .sb-ba { grid-template-columns:84px 1fr 34px; }
.sba2-gp { display:flex; gap:10px; font-size:12px; color:var(--gris); flex-wrap:wrap; }
.sba2-gp span { display:inline-flex; gap:3px; align-items:center; }
.sba2-ib { display:flex; flex-direction:column; gap:3px; font-size:12px; color:var(--gris); }
.sba2-rai { font-size:12px; color:var(--gris); line-height:1.3; }
.sba2-rail { position:relative; border-left:1px solid var(--trait); touch-action:none; user-select:none; padding:8px 8px 0 6px; display:flex; flex-direction:column; }
.sba2-en { display:flex; align-items:center; gap:4px; height:var(--h,30px); font-size:var(--t,12px); transition:height .12s, font-size .12s; white-space:nowrap; overflow:hidden; border-radius:4px; padding:0 2px; }
.sba2-en[aria-current="true"] { background:var(--encre); color:#fff; font-weight:700; white-space:normal; line-height:1.05; }
.sba2-en[aria-current="true"] .sb-stk { color:#fff; }
.sba2-en .num { margin-left:auto; font-size:11px; }
.sba2-en[aria-current="true"] .num { font-size:12px; }
.sba2-pouce { font-size:12px; color:var(--gris); text-align:center; padding:4px 0; }
.sba2-foot { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid var(--trait); padding:8px 12px 12px; max-width:390px; margin:0 auto; }
`,
  corps: '<header class="sba2-haut">' + CROIX + '<h1 data-role="titre">Lequel à la place de Nugget ?</h1></header>'
    + '<section class="sba2-rep" aria-live="polite">'
    + '<p class="sba2-ctx" data-role="contexte"><span data-contexte="houblon" data-fiche-de="beermaverick-nugget">au lieu de <span data-houblon="beermaverick-nugget">Nugget</span> α 13 % (épuisé)</span><span data-contexte="moment" id="sba2-mom">à 60′</span><span data-contexte="dose">même IBU</span><span data-contexte="base">Stout 16D</span></p>'
    + '<div class="sba2-nom"><b id="sba2-nom"></b></div><i class="sba2-bar" id="sba2-bar"></i>'
    + '<p class="sba2-id" id="sba2-id"></p>'
    + '<div class="sba2-chif"><div><b id="sba2-g"></b><span id="sba2-gp">dose, même IBU</span></div><div id="sba2-ibub"><b id="sba2-ibu"></b><span>ta stout · style 50–70</span></div><div><b id="sba2-st" style="font-size:16px"></b><span>ton stock</span></div><div><b id="sba2-sc"></b><span id="sba2-scl">proche de Nugget</span></div></div>'
    + '<div class="sba2-outil"><span id="sba2-oh"></span>' + aide('sba2', ['Rail : les remplaçants du moteur, rangés par le pire cas ; glisse le pouce, la loupe grossit celui qui est dessous.', 'Score en plage : une composante inconnue peut valoir de 0 à 100.', 'Rond noir : ta stout ; barre : avec lui (~ simulé, 2 g/L) ; hachures : non simulé, pas zéro.'], 'top:32px;left:0') + lentille('sba2') + '</div>'
    + '<div class="sba2-fam" id="sba2-fam"></div><p class="sba2-gp" id="sba2-gp"></p><div class="sba2-ib"><span>amertume de ta stout, style 50–70</span><span class="sb-j" id="sba2-j"></span></div><p class="sba2-rai" id="sba2-rai"></p>'
    + '</section>'
    + '<nav class="sba2-rail" id="sba2-rail" data-libre="houblon" aria-label="Rail des remplaçants"></nav>'
    + '<footer class="sba2-foot" id="sba2-pied"></footer>',
  script: function () {
    var S = window.S, H = S.H, rail = document.getElementById('sba2-rail');
    var l = S.cands.slice().sort(function (a, b) { return S.score(b)[0] - S.score(a)[0] || S.score(b)[1] - S.score(a)[1]; });
    document.getElementById('sba2-mom').textContent = S.MOM[S.m];
    rail.innerHTML = l.map(function (s, i) { return '<button type="button" class="sba2-en" data-i="' + i + '" data-fiche-de="' + s.key + '">' + S.pt(s.key, 8) + '<span data-houblon="' + s.key + '">' + H[s.key].name + '</span><span class="num">' + S.scoreTxt(s) + '</span></button>'; }).join('') + '<p class="sba2-pouce">↕ glisse</p>';
    var en = rail.querySelectorAll('.sba2-en');
    var tard = S.m !== 'b60';
    var lire = S.barres(document.getElementById('sba2-fam'), S.ORDRE);
    document.getElementById('sba2-oh').textContent = tard ? 'ce qu’il apporte ' + S.MOM[S.m] : 'à 60′ l’arôme part ; ce qui reste';
    var maj = S.pied(document.getElementById('sba2-pied')), jg = S.jauge(document.getElementById('sba2-j'));
    function loupe(i) {
      en.forEach(function (e, j) { var d = Math.abs(j - i); e.style.setProperty('--h', (d === 0 ? 60 : d === 1 ? 38 : 26) + 'px'); e.style.setProperty('--t', (d === 0 ? 16 : d === 1 ? 14 : 12) + 'px'); e.setAttribute('aria-current', String(d === 0)); });
    }
    function montrer(s) {
      if (!s) { document.getElementById('sba2-nom').textContent = 'Nugget'; return; }
      var i = l.indexOf(s); loupe(i);
      document.getElementById('sba2-nom').innerHTML = '<span data-houblon="' + s.key + '">' + H[s.key].name + '</span>';
      document.getElementById('sba2-bar').style.background = S.C[s.key];
      document.getElementById('sba2-id').innerHTML = S.alphaHtml(s.key) + '<span class="num" style="color:#55555f">fiches ' + S.plage(s.key) + '</span>' + S.usageHtml(s.key) + (s.amerDeconseille ? '<span style="color:#55555f;font-size:12px">' + s.amerDeconseille + '</span>' : '');
      document.getElementById('sba2-g').textContent = S.dose(s); document.getElementById('sba2-gp').textContent = S.dosePlage(s) ? S.dosePlage(s) + ' selon l’α' : (s.dose.regle === 'même IBU' ? 'même IBU, α du lot' : 'à masse égale');
      var r = S.ibu(s); document.getElementById('sba2-ibu').textContent = S.ibuTxt(s).split(' IBU').join('');
      document.getElementById('sba2-ibub').className = r && (r[0] < 50 || r[1] > 70) ? 'sba2-h' : '';
      document.getElementById('sba2-st').innerHTML = S.stock(s, true);
      document.getElementById('sba2-sc').textContent = S.scoreTxt(s); document.getElementById('sba2-scl').textContent = s.palier + (S.score(s)[0] !== S.score(s)[1] ? ', une inconnue' : '');
      lire(s); jg(s);
      document.getElementById('sba2-gp').innerHTML = '<span>perd ' + (S.gp(s, 'perd') || '—') + '</span><span>gagne ' + (S.gp(s, 'gagne') || '—') + '</span>';
      document.getElementById('sba2-rai').textContent = 'Moteur : ' + s.raison;
    }
    S.surChoix(function (s) { montrer(s); maj(s); });
    function sous(y) { var best = 0, bd = 1e9; en.forEach(function (e, j) { var b = e.getBoundingClientRect(), d = Math.abs(y - (b.top + b.height / 2)); if (d < bd) { bd = d; best = j; } }); return best; }
    var tire = false;
    rail.addEventListener('pointerdown', function (e) { tire = true; rail.setPointerCapture(e.pointerId); });
    rail.addEventListener('pointermove', function (e) { if (!tire) return; var i = sous(e.clientY); if (l[i] !== S.courant()) S.choisir(l[i].key); });
    rail.addEventListener('pointerup', function (e) { if (tire) { tire = false; var i = sous(e.clientY); S.choisir(l[i].key); } });
    var dep = S.depart || (l.filter(function (s) { return S.etat(s) === 'ok'; })[0] || l[0]).key;
    S.choisir(dep);
  },
};
