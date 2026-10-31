const $ = (id) => document.getElementById('PXID-' + id);
const CX = 140, CY = 140, R = 122, MAX = 120;
const pt = (a, r) => [CX + r * Math.cos(a), CY + r * Math.sin(a)];
const ang = (min) => -Math.PI / 2 + Math.min(min, MAX) / MAX * 2 * Math.PI;
function cadran(c) {
  const a = ang(S.B), [hx, hy] = pt(a, R);
  const plein = S.B >= MAX;
  const [ax, ay] = pt(a, R);
  const arc = S.B <= 0 ? '' : plein ? `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#4F7E9B" stroke-width="12"/>`
    : `<path d="M${CX} ${CY - R} A${R} ${R} 0 ${S.B / MAX > 0.5 ? 1 : 0} 1 ${ax} ${ay}" fill="none" stroke="#4F7E9B" stroke-width="12" stroke-linecap="round"/>`;
  let ticks = '';
  for (let m = 0; m < MAX; m += 5) {
    const t = ang(m), long = m % 15 === 0, [x1, y1] = pt(t, R + 8), [x2, y2] = pt(t, R + (long ? 14 : 11));
    ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${long ? '#333' : '#BFBFBF'}" stroke-width="${long ? 1.6 : 1}"/>`;
  }
  const lab = [0, 30, 60, 90].map((m) => { const [x, y] = pt(ang(m), 99); return `<text x="${x}" y="${y + 4}" text-anchor="middle" class="PXID-sl">${m}</text>`; }).join('');
  const top = 50, bot = 230, H = bot - top, yl = (l) => bot - Math.min(l, M.C) / M.C * H;
  const yp = yl(c.pre), yv = yl(S.V);
  return `
<defs><clipPath id="PXID-pot"><circle cx="${CX}" cy="${CY}" r="90"/></clipPath>
<pattern id="PXID-evp" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#C4D7E3"/><line x1="0" y1="1" x2="4" y2="1" stroke="#4F7E9B" stroke-width="1.6"/></pattern></defs>
<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#EBEBEB" stroke-width="12"/>
${ticks}${arc}
<g clip-path="url(#PXID-pot)">
 <rect x="40" y="40" width="200" height="200" fill="#F5F5F5"/>
 <rect x="40" y="${yv}" width="200" height="${bot + 20 - yv}" fill="#E0A02E"/>
 <rect x="40" y="${yp}" width="200" height="${Math.max(0, yv - yp)}" fill="url(#PXID-evp)"/>
</g>
<circle cx="${CX}" cy="${CY}" r="90" fill="none" stroke="#111" stroke-width="2"/>
${lab}
<text x="${CX}" y="88" text-anchor="middle"><tspan class="PXID-sbig">${fr(S.B)}</tspan><tspan class="PXID-su" dx="4">min</tspan></text>
<text x="${CX}" y="${Math.min(108, yp - 6)}" text-anchor="middle" class="PXID-sev"><tspan class="PXID-sm">~${fr(c.ev)} L</tspan> évaporés</text>
<circle cx="${hx}" cy="${hy}" r="13" fill="#111" stroke="#fff" stroke-width="3"/>
<path d="M${hx - 4} ${hy}h8M${hx} ${hy - 4}v8" stroke="#fff" stroke-width="0" />`;
}
function rendre() {
  const c = calc(S);
  $('nom').value = S.nom; $('style').textContent = S.style || 'Style à choisir'; $('ref').hidden = !S.ref;
  $('nl').setAttribute('aria-checked', String(S.nolo)); $('np').hidden = !S.nolo;
  $('dial').innerHTML = cadran(c); $('dial').setAttribute('aria-valuenow', S.B);
  $('cg').style.height = Math.min(100, c.pre / M.C * 100) + '%';
  $('ce').style.bottom = (S.V / M.C * 100) + '%'; $('ce').style.height = (c.ev / M.C * 100) + '%';
  $('pre').textContent = '~' + fr(c.pre) + ' L';
  $('fl').style.height = Math.min(100, S.V / M.F * 100) + '%';
  $('tk').style.bottom = (c.conseil / M.F * 100) + '%';
  $('fg').classList.toggle('PXID-over', c.plein); $('fg').setAttribute('aria-valuenow', S.V);
  $('v').textContent = fr(S.V, S.V % 1 ? 1 : 0) + ' L';
  const lib = $('lib');
  lib.className = 'PXID-ts ' + (c.plein ? 'PXID-plein' : c.serre ? 'PXID-serre' : 'PXID-ok');
  lib.innerHTML = c.plein ? 'plein' : '<span class=PXID-m>' + fr(c.libre, c.libre % 1 ? 1 : 0) + ' L</span> libres';
  $('al').hidden = !c.plein; $('al').textContent = c.plein ? 'Fermenteur plein : ' + fr(S.V) + ' L pour 30 L' : '';
}
const st = document.createElement('style');
st.textContent = '.PXID-sl{font:400 12px var(--mono);fill:#666}.PXID-sbig{font:600 28px var(--mono);fill:#111}.PXID-su{font:400 14px var(--mono);fill:#333}.PXID-sev{font:400 14px var(--sans);fill:#2F5F7D}.PXID-sm{font-family:var(--mono);font-weight:600}.PXID-sliq{font:600 18px var(--mono);fill:#111}';
document.head.appendChild(st);
const dial = $('dial');
const versMin = (e) => {
  const r = dial.getBoundingClientRect(), s = r.width / 280;
  const x = (e.clientX - r.left) / s - CX, y = (e.clientY - r.top) / s - CY;
  let a = Math.atan2(y, x) + Math.PI / 2; if (a < 0) a += 2 * Math.PI;
  return Math.round(a / (2 * Math.PI) * MAX / 5) * 5;
};
dial.addEventListener('pointerdown', (e) => { dial.setPointerCapture(e.pointerId); dial.classList.add('PXID-tient'); S.B = versMin(e) || S.B; rendre(); });
dial.addEventListener('pointermove', (e) => { if (!dial.hasPointerCapture(e.pointerId)) return; const m = versMin(e); if (Math.abs(m - S.B) < 60) { S.B = m; rendre(); } });
const fin = (e) => { dial.classList.remove('PXID-tient'); if (dial.hasPointerCapture(e.pointerId)) dial.releasePointerCapture(e.pointerId); };
dial.addEventListener('pointerup', fin); dial.addEventListener('pointercancel', fin);
document.querySelector('[data-booster="ebullition-moins"]').addEventListener('click', () => { S.B = Math.max(0, S.B - 5); rendre(); });
document.querySelector('[data-booster="ebullition-plus"]').addEventListener('click', () => { S.B = Math.min(240, S.B + 5); rendre(); });
glisser($('fg'), 'y', (t) => { S.V = Math.max(1, Math.round(t * M.F * 2) / 2); rendre(); });
const pas = (d) => { S.V = Math.max(1, Math.min(34, Math.round((S.V + d) * 2) / 2)); rendre(); };
document.querySelector('[data-booster="volume-moins"]').addEventListener('click', () => pas(-0.5));
document.querySelector('[data-booster="volume-plus"]').addEventListener('click', () => pas(0.5));
$('nl').addEventListener('click', () => { S.nolo = !S.nolo; rendre(); });
