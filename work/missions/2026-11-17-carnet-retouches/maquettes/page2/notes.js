(function () {
  var K = 'carnet-par-ecran-1711', etat = {};
  try { etat = JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) {}
  var figs = [].slice.call(document.querySelectorAll('figure[data-cle]'));
  function compter() { var n = 0; for (var k in etat) if (etat[k].s) n++; document.getElementById('compte').textContent = n + ' ★'; }
  function sauver() { try { localStorage.setItem(K, JSON.stringify(etat)); } catch (e) {} compter(); }
  figs.forEach(function (f) {
    var c = f.getAttribute('data-cle'), b = f.querySelector('.etoile'), i = f.querySelector('input'), s = etat[c] || {};
    if (s.s) { f.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
    if (s.n) i.value = s.n;
    b.addEventListener('click', function () {
      var on = !f.classList.contains('on'); f.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      etat[c] = etat[c] || {}; etat[c].s = on; sauver();
    });
    i.addEventListener('input', function () { etat[c] = etat[c] || {}; etat[c].n = i.value; sauver(); });
    f.querySelector('.zoom').addEventListener('click', function () { var l = document.getElementById('loupe'); l.querySelector('img').src = f.querySelector('img').src; l.hidden = false; });
  });
  document.getElementById('loupe').addEventListener('click', function () { this.hidden = true; });
  document.getElementById('copier').addEventListener('click', function () {
    var lignes = [];
    figs.forEach(function (f) {
      var c = f.getAttribute('data-cle'), s = etat[c];
      if (s && (s.s || s.n)) {
        var nom = f.closest('section').querySelector('h2').firstChild.textContent.trim();
        lignes.push(nom + ' : ' + c.split('|')[1] + (s.s ? ' ★' : '') + (s.n ? ' · ' + s.n : ''));
      }
    });
    var t = 'Carnet par écran\n' + (lignes.join('\n') || 'aucune ★');
    var o = document.getElementById('sortie'); o.value = t; o.hidden = false; o.select();
    try { navigator.clipboard.writeText(t).catch(function () {}); } catch (e) {}
  });
  compter();
})();
