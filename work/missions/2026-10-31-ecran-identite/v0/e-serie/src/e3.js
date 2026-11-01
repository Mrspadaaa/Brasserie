const $ = (id) => document.getElementById('PXID-' + id);
const B0 = 286, K = 5, CX = 14, FX = 222, W = 130;
const y = (l) => B0 - l * K;
function dessiner(c) {
  const vF = Math.min(S.V, M.F), plein = c.plein;
  const liqF = y(vF), haut = y(M.F), pre = Math.min(c.pre, M.C);
  const rouge = '#C8382F', encre = '#111111';
  const vap = [44, 79, 114].map((x, i) => `<path d="M${x} 56 c-7 -7 7 -12 0 -19 c-7 -7 7 -12 0 -19" fill="none" stroke="#4F7E9B" stroke-width="2" stroke-linecap="round" opacity="${c.ev > 0 ? 1 - i * 0.15 : 0}"/>`).join('');
  return `
<defs>
 <pattern id="PXID-hach" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#FFFFFF"/><line x1="0" y1="0" x2="0" y2="6" stroke="#CFCFCF" stroke-width="1.5"/></pattern>
 <pattern id="PXID-evp" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#C4D7E3"/><line x1="1" y1="0" x2="1" y2="4" stroke="#4F7E9B" stroke-width="1.6"/></pattern>
 <clipPath id="PXID-cc"><rect x="${CX}" y="${y(M.C)}" width="${W}" height="${M.C * K}" rx="10"/></clipPath><clipPath id="PXID-cf"><rect x="${FX}" y="${haut}" width="${W}" height="${M.F * K}" rx="8"/></clipPath>
 <marker id="PXID-fl" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="${encre}"/></marker>
</defs>
${vap}
<text x="138" y="36" class="PXID-sv PXID-eau PXID-s14"><tspan class="PXID-svm">~${fr(c.ev)} L</tspan> évaporés</text>
<rect x="${CX - 9}" y="92" width="11" height="8" rx="3" fill="${encre}"/><rect x="${CX + W - 2}" y="92" width="11" height="8" rx="3" fill="${encre}"/>
<rect x="${CX}" y="${y(M.C)}" width="${W}" height="${M.C * K}" rx="10" fill="#FFFFFF"/>
<rect x="${CX}" y="${y(pre)}" width="${W}" height="${pre * K}" fill="#F2C14E" clip-path="url(#PXID-cc)"/>
<rect x="${CX}" y="${y(pre)}" width="${W}" height="${Math.max(0, (pre - S.V)) * K}" fill="url(#PXID-evp)"/>
<line x1="${CX}" x2="${CX + W}" y1="${y(M.CU)}" y2="${y(M.CU)}" stroke="${encre}" stroke-width="1.5" stroke-dasharray="5 4"/>
<text x="${CX + W + 6}" y="${y(M.CU) + 4}" class="PXID-sv PXID-svm">35</text>
<rect x="${CX}" y="${y(M.C)}" width="${W}" height="${M.C * K}" rx="10" fill="none" stroke="${encre}" stroke-width="2"/>
<text x="${CX + W / 2}" y="${(y(pre) + B0) / 2 + 12}" text-anchor="middle" class="PXID-sb">~${fr(c.pre)} L</text>
<path d="M${CX + W} 274 h8" stroke="${encre}" stroke-width="5" stroke-linecap="round"/>
<path d="M${CX + W + 12} 274 C 190 274, 186 106, ${FX + 20} 112" fill="none" stroke="${encre}" stroke-width="1.5" stroke-dasharray="4 4" marker-end="url(#PXID-fl)"/>
<rect x="${FX}" y="${haut}" width="${W}" height="${M.F * K}" rx="8" fill="url(#PXID-hach)"/>
<rect x="${FX}" y="${liqF}" width="${W}" height="${vF * K}" fill="#E0A02E" clip-path="url(#PXID-cf)"/>
<line x1="${FX}" x2="${FX + W}" y1="${y(c.conseil)}" y2="${y(c.conseil)}" stroke="#567F45" stroke-width="2" stroke-dasharray="5 4"/>
<rect x="${FX}" y="${haut}" width="${W}" height="${M.F * K}" rx="8" fill="none" stroke="${plein ? rouge : encre}" stroke-width="${plein ? 3 : 2}"/>
<rect x="${FX - 6}" y="${haut - 9}" width="${W + 12}" height="9" rx="3" fill="${encre}"/>
<path d="M${FX + W - 34} ${haut - 9} v-10 a5 5 0 0 1 10 0 v4" fill="none" stroke="${encre}" stroke-width="2"/>
${plein ? '' : `<text x="${FX + W / 2}" y="${(haut + liqF) / 2 + 4}" text-anchor="middle" class="PXID-sv PXID-ok"><tspan class="PXID-svm">${fr(c.libre, c.libre % 1 ? 1 : 0)} L</tspan> libres</text>`}
<text x="${FX + W / 2}" y="${(liqF + B0) / 2 + 6}" text-anchor="middle" class="PXID-sb">${fr(S.V, S.V % 1 ? 1 : 0)} L</text>
<rect x="${FX + W - 10}" y="${liqF - 9}" width="20" height="18" rx="9" fill="#111111"/><path d="M${FX + W - 4} ${liqF - 2} l4 -4 l4 4 M${FX + W - 4} ${liqF + 2} l4 4 l4 -4" stroke="#fff" stroke-width="1.6" fill="none"/>
<text x="${CX + W / 2}" y="308" text-anchor="middle" class="PXID-sv">Cuve <tspan class="PXID-svm">45 L</tspan></text>
<text x="${FX + W / 2}" y="308" text-anchor="middle" class="PXID-sv">Fermenteur <tspan class="PXID-svm">30 L</tspan></text>`;
}
function rendre() {
  const c = calc(S);
  $('nom').value = S.nom; $('style').value = S.style; $('ref').textContent = S.ref; document.querySelector('[data-booster="reperes"]').hidden = !S.ref;
  $('svg').innerHTML = dessiner(c);
  $('v').textContent = fr(S.V, S.V % 1 ? 1 : 0); $('b').textContent = fr(S.B);
  $('hit').setAttribute('aria-valuenow', S.V);
  $('al').hidden = !c.plein; $('al').textContent = c.plein ? 'Fermenteur plein : ' + fr(S.V) + ' L pour 30 L' : '';
  $('nl').checked = S.nolo; $('np').hidden = !S.nolo;
}
const st = document.createElement('style');
st.textContent = '.PXID-sv{font:400 12px var(--sans);fill:#666666}.PXID-svm{font-family:var(--mono)}.PXID-sb{font:600 18px var(--mono);fill:#111111}.PXID-eau{fill:#2F5F7D}.PXID-ok{fill:#3F6B2E}.PXID-s14{font-size:14px;font-weight:600}';
document.head.appendChild(st);
const hit = $('hit');
hit.style.top = ((B0 - 32 * K) / 318 * 100) + '%'; hit.style.height = (32 * K / 318 * 100) + '%';
hit.style.left = (FX / 374 * 100) + '%'; hit.style.width = (W / 374 * 100) + '%';
glisser(hit, 'y', (t) => { S.V = Math.max(1, Math.round(t * 32 * 2) / 2); rendre(); });
const pas = (d) => { S.V = Math.max(1, Math.min(34, Math.round((S.V + d) * 2) / 2)); rendre(); };
document.querySelector('[data-booster="volume-moins"]').addEventListener('click', () => pas(-0.5));
document.querySelector('[data-booster="volume-plus"]').addEventListener('click', () => pas(0.5));
document.querySelector('[data-booster="ebullition-moins"]').addEventListener('click', () => { S.B = Math.max(0, S.B - 5); rendre(); });
document.querySelector('[data-booster="ebullition-plus"]').addEventListener('click', () => { S.B = Math.min(240, S.B + 5); rendre(); });
$('nl').addEventListener('change', (e) => { S.nolo = e.target.checked; rendre(); });
const b = document.querySelector('[data-booster="reperes"]'), d = document.querySelector('[data-role="reperes"]');
b.addEventListener('click', () => { d.hidden = !d.hidden; b.setAttribute('aria-expanded', String(!d.hidden)); });
