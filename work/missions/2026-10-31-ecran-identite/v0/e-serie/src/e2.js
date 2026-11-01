const $ = (id) => document.getElementById('PXID-' + id);
function rendre() {
  const c = calc(S);
  $('nom').value = S.nom; $('style').value = S.style; $('ref').hidden = !S.ref;
  if (document.activeElement !== $('vol')) $('vol').value = Number.isFinite(S.V) ? fr(S.V, S.V % 1 ? 1 : 0) : '';
  if (document.activeElement !== $('boil')) $('boil').value = Number.isFinite(S.B) ? fr(S.B) : '';
  if (!c.ok) { $('pre').textContent = '—'; $('vf').textContent = '—'; $('lib').textContent = 'volume à renseigner'; return; }
  $('lc').style.width = Math.min(100, c.pre / M.C * 100) + '%';
  $('ev').style.left = (S.V / M.C * 100) + '%';
  $('ev').style.width = (c.ev / M.C * 100) + '%';
  $('pre').textContent = '~' + fr(c.pre) + ' L';
  $('evt').innerHTML = '<span class=PXID-m>~' + fr(c.ev) + ' L</span> évaporés';
  const p = Math.min(100, S.V / M.F * 100);
  $('lf').style.width = p + '%'; $('poi').style.left = p + '%';
  $('tk').style.left = (c.conseil / M.F * 100) + '%';
  $('bf').setAttribute('aria-valuenow', S.V);
  $('vf').textContent = c.plein ? 'plein' : fr(c.libre, c.libre % 1 ? 1 : 0) + ' L';
  const lib = $('lib');
  lib.className = 'PXID-sub ' + (c.plein ? 'PXID-plein' : c.serre ? 'PXID-serre' : 'PXID-ok');
  lib.innerHTML = c.plein ? 'dépasse 30 L' : 'libres · <span class=PXID-m>' + fr(c.pct) + ' %</span>';
  $('bf').style.borderColor = c.plein ? 'var(--al)' : '';
  $('al').hidden = !c.plein; $('al').textContent = c.plein ? 'Fermenteur plein : ' + fr(S.V) + ' L pour 30 L' : '';
  $('nl').checked = S.nolo; $('np').hidden = !S.nolo;
}
glisser($('bf'), 'x', (t) => { S.V = Math.max(1, Math.round(t * M.F * 2) / 2); rendre(); });
$('vol').addEventListener('change', (e) => { S.V = lireNombre(e.target.value); rendre(); });
$('boil').addEventListener('change', (e) => { S.B = lireNombre(e.target.value); rendre(); });
$('nl').addEventListener('change', (e) => { S.nolo = e.target.checked; rendre(); });
const ouvrir = (sel, cible) => { const b = document.querySelector(sel), d = document.querySelector(cible); b.addEventListener('click', () => { d.hidden = !d.hidden; b.setAttribute('aria-expanded', String(!d.hidden)); }); };
ouvrir('[data-booster="reperes"]', '[data-role="reperes"]');
ouvrir('[data-booster="materiel"]', '[data-role="materiel"]');
