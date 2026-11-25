function nettoyerCibles() { Array.prototype.forEach.call(document.querySelectorAll('.cible,.cible-av,.cible-ap'), function (n) { n.classList.remove('cible', 'cible-av', 'cible-ap'); }); }
function marquerCible(g) {
  nettoyerCibles(); g.cible = null;
  var el = document.elementFromPoint(g.x, g.y), t = el && el.closest && el.closest('.p4-r,.p4-ss,.p4-dn');
  if (!t || t === g.row) return;
  if (t.classList.contains('p4-r')) {
    var b = t.getBoundingClientRect(), av = g.y < b.top + b.height / 2;
    t.classList.add(av ? 'cible-av' : 'cible-ap'); g.cible = { type: 'r', id: t.getAttribute('data-id'), avant: av };
  } else if (t.getAttribute('data-cat')) { t.classList.add('cible'); g.cible = { type: 's', cat: t.getAttribute('data-cat'), sous: t.getAttribute('data-sous') || null }; }
}
