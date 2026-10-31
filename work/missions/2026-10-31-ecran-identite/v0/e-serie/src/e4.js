const $ = (id) => document.getElementById('PXID-' + id);
function relier() {
  const g = $('g').getBoundingClientRect(), row = $('volrow').querySelector('.PXID-big').getBoundingClientRect();
  const s = $('surf').getBoundingClientRect(), tube = $('in').getBoundingClientRect();
  const x1 = row.right - g.left + 38, y1 = row.top + row.height / 2 - g.top;
  const x2 = tube.left - g.left, y2 = s.top + s.height / 2 - g.top;
  const xm = x2 - 10;
  $('lead').innerHTML = `<path d="M${x1} ${y1} H${xm} V${y2} H${x2 + 2}" fill="none" stroke="#111" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="${x1}" cy="${y1}" r="3" fill="#111"/>`;
}
function rendre() {
  const c = calc(S);
  $('nom').value = S.nom; $('style').value = S.style; $('ref').hidden = !S.ref;
  $('v').textContent = fr(S.V, S.V % 1 ? 1 : 0); $('b').textContent = fr(S.B);
  const p = Math.min(100, S.V / M.F * 100);
  $('liq').style.height = p + '%';
  $('surf').style.top = (100 - p) + '%';
  $('tk').style.top = (100 - c.conseil / M.F * 100) + '%';
  $('tube').setAttribute('aria-valuenow', S.V);
  $('tube').classList.toggle('PXID-over', c.plein);
  const lib = $('lib');
  lib.className = 'PXID-lib' + (c.plein ? ' PXID-plein' : c.serre ? ' PXID-serre' : '');
  lib.innerHTML = c.plein ? 'plein' : '<span class=PXID-m>' + fr(c.libre, c.libre % 1 ? 1 : 0) + ' L</span> libres · <span class=PXID-m>' + fr(c.pct) + ' %</span>';
  $('ev').innerHTML = '<span class=PXID-m>~' + fr(c.ev) + ' L</span> évaporés';
  $('pre').textContent = '~' + fr(c.pre) + ' L';
  $('cf').style.width = Math.min(100, c.pre / M.C * 100) + '%';
  $('al').hidden = !c.plein; $('al').textContent = c.plein ? 'Fermenteur plein : ' + fr(S.V) + ' L pour 30 L' : '';
  $('nl').checked = S.nolo; $('np').hidden = !S.nolo;
  requestAnimationFrame(relier);
}
glisser($('in'), 'y', (t) => { S.V = Math.max(1, Math.round(t * M.F * 2) / 2); rendre(); });
const pas = (d) => { S.V = Math.max(1, Math.min(34, Math.round((S.V + d) * 2) / 2)); rendre(); };
document.querySelector('[data-booster="volume-moins"]').addEventListener('click', () => pas(-0.5));
document.querySelector('[data-booster="volume-plus"]').addEventListener('click', () => pas(0.5));
document.querySelector('[data-booster="ebullition-moins"]').addEventListener('click', () => { S.B = Math.max(0, S.B - 5); rendre(); });
document.querySelector('[data-booster="ebullition-plus"]').addEventListener('click', () => { S.B = Math.min(240, S.B + 5); rendre(); });
$('nl').addEventListener('change', (e) => { S.nolo = e.target.checked; rendre(); });
const b = document.querySelector('[data-booster="materiel"]'), d = document.querySelector('[data-role="materiel"]');
b.addEventListener('click', () => { d.hidden = !d.hidden; b.setAttribute('aria-expanded', String(!d.hidden)); });
document.fonts && document.fonts.ready.then(relier);
addEventListener('resize', relier);
