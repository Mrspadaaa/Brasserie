(function () {
  // Top 3 par écran : sous chaque vignette, 1 · 2 · 3. Un rang par écran : le donner ailleurs le retire ici.
  var K = 'carnet-top3-1711', etat = {};
  try { etat = JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) {}
  etat.rang = etat.rang || {}; etat.note = etat.note || {};
  var sections = [].slice.call(document.querySelectorAll('section.rang'));
  function sauver() { try { localStorage.setItem(K, JSON.stringify(etat)); } catch (e) {} }
  function rendre() {
    var total = 0;
    sections.forEach(function (sec) {
      var id = sec.id, r = etat.rang[id] || {}, podium = [];
      [].forEach.call(sec.querySelectorAll('figure[data-cle]'), function (f) {
        var k = f.getAttribute('data-cle').split('|')[1], mon = 0;
        for (var n = 1; n <= 3; n++) if (r[n] === k) mon = n;
        f.setAttribute('data-rang', mon || '');
        [].forEach.call(f.querySelectorAll('.rg'), function (b) { var on = +b.getAttribute('data-n') === mon; b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      });
      for (var n = 1; n <= 3; n++) if (r[n]) { podium.push(n + ' ' + r[n]); total++; }
      sec.querySelector('.podium').textContent = podium.length ? podium.join(' · ') : 'pas encore classé';
    });
    document.getElementById('compte').textContent = total + ' rangs donnés';
  }
  sections.forEach(function (sec) {
    [].forEach.call(sec.querySelectorAll('figure[data-cle]'), function (f) {
      var k = f.getAttribute('data-cle').split('|')[1], id = sec.id, i = f.querySelector('input');
      if (etat.note[k]) i.value = etat.note[k];
      [].forEach.call(f.querySelectorAll('.rg'), function (b) {
        b.addEventListener('click', function () {
          var n = +b.getAttribute('data-n'), r = etat.rang[id] = etat.rang[id] || {};
          if (r[n] === k) { delete r[n]; } else { for (var m = 1; m <= 3; m++) if (r[m] === k) delete r[m]; r[n] = k; }
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
      var r = etat.rang[sec.id] || {}, nom = sec.querySelector('h2').firstChild.textContent.trim(), p = [];
      for (var n = 1; n <= 3; n++) if (r[n]) p.push(n + ' ' + r[n] + (etat.note[r[n]] ? ' (' + etat.note[r[n]] + ')' : ''));
      var autres = [].slice.call(sec.querySelectorAll('figure[data-cle]')).map(function (f) { return f.getAttribute('data-cle').split('|')[1]; })
        .filter(function (k) { return etat.note[k] && p.join(' ').indexOf(k) < 0; }).map(function (k) { return k + ' : ' + etat.note[k]; });
      if (p.length || autres.length) lignes.push(nom + ' : ' + (p.join(' · ') || '—') + (autres.length ? ' · notes : ' + autres.join(' ; ') : ''));
    });
    var t = 'Carnet, top 3 par écran\n' + (lignes.join('\n') || 'rien de classé');
    var o = document.getElementById('sortie'); o.value = t; o.hidden = false; o.select();
    try { navigator.clipboard.writeText(t).catch(function () {}); } catch (e) {}
  });
  rendre();
})();
