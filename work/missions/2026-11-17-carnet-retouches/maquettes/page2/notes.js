(function () {
  // Classement par écran : sous chaque vignette, 1 · 2 · 3 · 4 · 5. Plusieurs vignettes peuvent avoir le même rang (17.11).
  // Retoucher le rang d'une vignette le lui enlève.
  var K = 'carnet-top3-1711', etat = {};
  try { etat = JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) {}
  etat.note = etat.note || {}; etat.r = etat.r || {};
  if (etat.rang) { // ancien format : un seul élément par rang et par écran
    for (var ec in etat.rang) for (var n0 in etat.rang[ec]) etat.r[etat.rang[ec][n0]] = +n0;
    delete etat.rang;
  }
  var RANGS = [1, 2, 3, 4, 5];
  var sections = [].slice.call(document.querySelectorAll('section.rang'));
  function cle(f) { return f.getAttribute('data-cle').split('|')[1]; }
  function sauver() { try { localStorage.setItem(K, JSON.stringify(etat)); } catch (e) {} }
  function podium(sec) {
    var par = {}, out = [];
    [].forEach.call(sec.querySelectorAll('figure[data-cle]'), function (f) { var k = cle(f), n = etat.r[k]; if (n) (par[n] = par[n] || []).push(k); });
    RANGS.forEach(function (n) { if (par[n]) out.push(n + ' ' + par[n].join(', ')); });
    return out;
  }
  function rendre() {
    var total = 0;
    sections.forEach(function (sec) {
      [].forEach.call(sec.querySelectorAll('figure[data-cle]'), function (f) {
        var mon = etat.r[cle(f)] || 0; if (mon) total++;
        f.setAttribute('data-rang', mon || '');
        [].forEach.call(f.querySelectorAll('.rg'), function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-n') === mon ? 'true' : 'false'); });
      });
      var p = podium(sec);
      sec.querySelector('.podium').textContent = p.length ? p.join(' · ') : 'pas encore classé';
    });
    document.getElementById('compte').textContent = total + (total > 1 ? ' rangs donnés' : ' rang donné');
  }
  sections.forEach(function (sec) {
    [].forEach.call(sec.querySelectorAll('figure[data-cle]'), function (f) {
      var k = cle(f), i = f.querySelector('input');
      if (etat.note[k]) i.value = etat.note[k];
      [].forEach.call(f.querySelectorAll('.rg'), function (b) {
        b.addEventListener('click', function () {
          var n = +b.getAttribute('data-n');
          if (etat.r[k] === n) delete etat.r[k]; else etat.r[k] = n;
          sauver(); rendre();
        });
      });
      i.addEventListener('input', function () { etat.note[k] = i.value; sauver(); });
      f.querySelector('.zoom').addEventListener('click', function () { var l = document.getElementById('loupe'); l.querySelector('img').src = f.querySelector('img').src; l.hidden = false; });
    });
  });
  document.getElementById('loupe').addEventListener('click', function () { this.hidden = true; });
  document.getElementById('copier').addEventListener('click', function () {
    var lignes = [];
    sections.forEach(function (sec) {
      var nom = sec.querySelector('h2').firstChild.textContent.trim(), p = podium(sec);
      var notes = [].slice.call(sec.querySelectorAll('figure[data-cle]')).map(cle).filter(function (k) { return etat.note[k]; }).map(function (k) { return k + ' : ' + etat.note[k]; });
      if (p.length || notes.length) lignes.push(nom + ' : ' + (p.join(' · ') || '—') + (notes.length ? ' · notes : ' + notes.join(' ; ') : ''));
    });
    var t = 'Carnet, classement par écran\n' + (lignes.join('\n') || 'rien de classé');
    var o = document.getElementById('sortie'); o.value = t; o.hidden = false; o.select();
    try { navigator.clipboard.writeText(t).catch(function () {}); } catch (e) {}
  });
  rendre();
})();
