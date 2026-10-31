const $ = (id) => document.getElementById('PXID-' + id);
function rendre() {
  const c = calc(S);
  $('nom').value = S.nom; $('style').textContent = S.style || 'Style à choisir'; $('ref').hidden = !S.ref;
  $('nl').setAttribute('aria-checked', String(S.nolo)); $('np').hidden = !S.nolo;
  const p = Math.min(100, S.V / M.F * 100);
  $('liq').style.height = p + '%';
  $('poi').style.top = 'max(16px, ' + (100 - p) + '%)';
  $('niv').style.bottom = p + '%';
  $('tk').style.bottom = (c.conseil / M.F * 100) + '%';
  $('hit').setAttribute('aria-valuenow', S.V);
  $('corps').classList.toggle('PXID-over', c.plein);
  $('v').textContent = fr(S.V, S.V % 1 ? 1 : 0);
  const lib = $('lib');
  lib.className = 'PXID-libre' + (c.plein ? ' PXID-plein' : c.serre ? ' PXID-serre' : '');
  lib.style.top = ((100 - p) / 2) + '%';
  lib.hidden = c.plein;
  lib.innerHTML = '<span><span class=PXID-m>' + fr(c.libre, c.libre % 1 ? 1 : 0) + ' L</span> libres · <span class=PXID-m>' + fr(c.pct) + ' %</span></span>';
  $('b').textContent = fr(S.B);
  $('ev').innerHTML = '<span class=PXID-m>~' + fr(c.ev) + ' L</span> évaporés';
  $('pre').textContent = '~' + fr(c.pre) + ' L'; $('pre2').textContent = '~' + fr(c.pre) + ' L';
  $('al').hidden = !c.plein; $('al').textContent = c.plein ? 'Fermenteur plein : ' + fr(S.V) + ' L pour 30 L' : '';
}
glisser($('hit'), 'y', (t) => { S.V = Math.max(1, Math.round(t * M.F * 2) / 2); rendre(); });
document.querySelector('[data-booster="ebullition-moins"]').addEventListener('click', () => { S.B = Math.max(0, S.B - 5); rendre(); });
document.querySelector('[data-booster="ebullition-plus"]').addEventListener('click', () => { S.B = Math.min(240, S.B + 5); rendre(); });
$('nl').addEventListener('click', () => { S.nolo = !S.nolo; rendre(); });
const b = document.querySelector('[data-booster="materiel"]'), d = document.querySelector('[data-role="materiel"]');
b.addEventListener('click', () => { d.hidden = !d.hidden; b.setAttribute('aria-expanded', String(!d.hidden)); });
