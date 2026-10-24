// sbd6 — chaude : le chaudron. La cuve dessinée au moment de l'ajout : à 60′, le feu, la vapeur qui emporte les
// arômes du remplaçant (ses pictos montent et pâlissent), et ce qui reste dans le moût : l'IBU. En whirlpool, pas de
// feu, 80 °C : les arômes restent dans la stout. Les remplaçants attendent sur l'étagère, cônes à la taille de leur
// dose au même IBU ; on en touche un, il tombe dans la cuve.
import { cas, page, pic, usage, badgeStock, nomHop, croix, lentille, aide, barre, fr, fr1, g0, COURT, LEG_FAM, NUGGET, ROUE } from '../sbd1/serie/socle.mjs';

const ID = 'sbd6';
const STOUT = '#3b1f14';
function cuve(c) {
  const feu = c.contexte === 'amertume';
  return `<svg class="sbd6-svg" viewBox="0 0 370 250" width="370" height="250" role="img" aria-label="La cuve ${c.titre}">
<defs><linearGradient id="sbd6-moût" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3322"/><stop offset="1" stop-color="${STOUT}"/></linearGradient></defs>
${feu ? `<g class="sbd6-vap" fill="none" stroke="#c9c9d2" stroke-width="2" stroke-linecap="round"><path d="M128 74c-10-14 10-22 0-38s8-24 0-34"/><path d="M186 70c-12-14 12-22 0-40s10-22 0-30"/><path d="M244 74c-10-14 10-22 0-38s8-24 0-34"/></g>` : `<g fill="none" stroke="#d6d6de" stroke-width="2" stroke-linecap="round"><path d="M186 74c-6-8 6-12 0-20"/></g>`}
<path d="M86 82h198v118a26 26 0 0 1-26 26H112a26 26 0 0 1-26-26Z" fill="#e9e9ee" stroke="#8c8c96" stroke-width="2"/>
<path d="M94 ${feu ? 100 : 104}h182v96a20 20 0 0 1-20 20H114a20 20 0 0 1-20-20Z" fill="url(#sbd6-moût)"/>
<path d="M80 82h210" stroke="#6b6b75" stroke-width="4" stroke-linecap="round"/>
${feu ? `<g fill="#e8590c" opacity=".9"><path d="M130 246c-8-10 2-16 6-24 2 10 10 12 4 24Z"/><path d="M178 246c-10-12 2-20 8-30 2 12 12 16 4 30Z"/><path d="M230 246c-8-10 2-16 6-24 2 10 10 12 4 24Z"/></g><text x="300" y="238" class="sbd6-tx">100 °C</text>` : `<text x="300" y="238" class="sbd6-tx">80 °C · 20 min</text>`}
<path d="M300 110v60" stroke="#8c8c96" stroke-width="2"/><circle cx="300" cy="178" r="7" fill="${feu ? '#e8590c' : '#f2a65a'}"/><path d="M300 ${feu ? 116 : 140}v58" stroke="${feu ? '#e8590c' : '#f2a65a'}" stroke-width="4" stroke-linecap="round"/>
</svg>`;
}
function scene(r, c, on) {
  const feu = c.contexte === 'amertume', fams = ROUE.filter((f) => r.niveaux[f] > 0);
  const tot = r.prof ? ['floral', 'herbal', 'earthy', 'resin', 'citrus', 'tropical'].reduce((t, f) => t + (r.prof[f].inc ? 0 : r.prof[f].c), 0) : null;
  const pos = (i, n) => 150 + (i - (n - 1) / 2) * 30;
  const pics = fams.map((f, i) => feu
    ? `<span class="sbd6-pv" style="left:${pos(i, fams.length) - 9}px;top:${18 + (i % 2) * 22}px">${pic(f, 18)}</span>`
    : `<span class="sbd6-pl" style="left:${185 + (i - (fams.length - 1) / 2) * 27 - 11}px;top:184px">${pic(f, 16)}</span>`).join('');
  return `<div class="sbd6-sc" data-pour="${r.nom}"${on ? '' : ' hidden'}>${pics}
<div class="sbd6-cone" style="--k:${Math.min(1.25, Math.max(.7, r.dose.g / 46)).toFixed(2)};background:${r.couleur || '#8c8c96'}" aria-hidden="true"></div>
<div class="sbd6-lab"><span class="sbd6-ibu sbd-num">${c.ref.ibu ? Math.round(c.ref.ibu) + ' IBU' : 'à froid'}</span><span class="sbd6-dz sbd-num">${nomHop(r)} ${g0(r.dose.g)} g</span><span class="sbd6-arm sbd-num">${feu ? `arômes : ~${tot == null ? '?' : fr(tot)} restent` : `arômes : ~${tot == null ? '?' : fr(tot)} dans la stout`}</span></div>
${feu ? `<span class="sbd6-part">emportés par la vapeur</span>` : ''}</div>`;
}
function vue(c) {
  const rows = [...c.top.slice(0, 4), ...c.stock.filter((s) => s.stock.etat === 'en stock' && s.stock.suffisant).slice(0, 2)];
  const n = c.nugget, fams = ['floral', 'herbal', 'earthy', 'resin'];
  const cone = (r, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-choix="${r.nom}" class="sbd6-et"><i class="sbd6-mini" style="--k:${Math.min(1.25, Math.max(.7, r.dose.g / 46)).toFixed(2)};background:${r.couleur || '#8c8c96'}"></i><span class="sbd6-en">${nomHop(r)}<small class="sbd-num">${r.score}${r.fiab === 'partielle' ? '?' : ''} · ${g0(r.dose.g)} g</small><small>${usage(r)} <span class="sbd-num">α ${r.alpha.lot ? fr1(r.alpha.v) : fr1(r.alpha.min) + '–' + fr1(r.alpha.max)}</span> ${badgeStock(r)}</small></span></button>`;
  const stout = (r, i) => `<div class="sbd6-st" data-pour="${r.nom}"${i === 0 ? '' : ' hidden'}><span class="sbd6-sl">ta stout ~</span>${fams.map((f) => `<span class="sbd6-bf">${pic(f, 13)}${barre(f, r.prof && r.prof[f])}</span>`).join('')}</div>`;
  return `<header class="sbd6-t">${croix()}<h1>Lequel à la place de Nugget ?</h1>${aide(ID + '-leg', [
    'La cuve au moment de ton ajout. Pictos dans la vapeur : les arômes des fiches du houblon, emportés par l’ébullition ; dans la stout : ceux qui restent. « ~ » : simulé, en points sur 100.',
    'Cônes : la dose au même IBU (plus grand, plus de grammes).', 'Icônes : ' + LEG_FAM])}</header>
<div class="sbd6-ctx"><p class="sbd-ctxp" data-role="contexte"><span data-contexte="moment">${c.court}</span><span data-contexte="dose">IBU égal</span><span data-contexte="base">Stout 16D</span></p>${lentille()}</div>
<div class="sbd6-scene">${cuve(c)}${rows.map((r, i) => scene(r, c, i === 0)).join('')}</div>
<p class="sbd6-rep">${c.contexte === 'amertume' ? '<b>À 60′, la cuve garde l’amertume.</b> Les arômes s’en vont : choisis l’α et la dose.' : `<b>${c.court[0].toUpperCase() + c.court.slice(1)} : la cuve garde l’arôme.</b> Choisis ce qu’il sent.`}</p>
<div class="sbd6-etag" data-libre="houblon" role="radiogroup" aria-label="Remplaçant">${rows.map(cone).join('')}</div>
${rows.map(stout).join('')}
<p class="sbd6-orig">${nomHop(n)} <span class="sbd-num">α 13 · 46 g</span> ${badgeStock({ stock: { etat: 'épuisé' } })}<small>épuisé, à remplacer</small></p>`;
}
export function construire() {
  const b = cas('b60'), w = cas('wp');
  const noms = [...new Set([NUGGET.nom, ...[b, w].flatMap((c) => [...c.top.slice(0, 4), ...c.stock].map((r) => r.nom))])];
  return page({ id: ID, titre: 'sbd6 · le chaudron', vue: vue(b), autres: { wp: vue(w) }, fiches: noms, css: CSS });
}
const CSS = `
.sbd6 { max-width:390px; margin:0 auto; padding:6px 10px 18px; display:flex; flex-direction:column; gap:7px; }
.sbd6-t { display:flex; align-items:center; gap:8px; }
.sbd6-t h1 { font:600 17px/1.2 var(--sans); flex:1; }
.sbd6-ctx { display:flex; gap:4px; align-items:center; }
.sbd6-ctx span[data-contexte] { height:22px; padding:0 9px; border-radius:11px; background:var(--surf2); font-size:13px; display:inline-flex; align-items:center; }
.sbd6-ctx .sbd-seg { margin-left:auto; }
.sbd6-scene { position:relative; width:370px; height:250px; margin:0 auto; }
.sbd6-svg { position:absolute; inset:0; }
.sbd6-tx { font:600 13px var(--sans); fill:#5b5b66; text-anchor:middle; }
.sbd6-sc { position:absolute; inset:0; }
.sbd6-pv { position:absolute; opacity:.5; }
.sbd6-pv:nth-child(odd) { opacity:.35; }
.sbd6-pl { position:absolute; width:22px; height:22px; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; }
.sbd6-cone { position:absolute; left:262px; top:58px; width:calc(24px * var(--k)); height:calc(34px * var(--k)); border-radius:50% 50% 50% 50% / 60% 60% 40% 40%; transform:rotate(-24deg); box-shadow:inset -4px -6px 0 rgba(0,0,0,.18); }
.sbd6-lab { position:absolute; left:104px; top:112px; width:162px; padding:6px 4px; border-radius:8px; background:#4a2a1c; display:flex; flex-direction:column; align-items:center; gap:3px; color:#fff; text-align:center; }
.sbd6-ibu { font-size:28px; font-weight:700; line-height:1; }
.sbd6-dz { font-size:14px; }
.sbd6-dz .sbd-hop { color:#fff; }
.sbd6-arm { font-size:12px; color:#ead7cc; }
.sbd6-part { position:absolute; left:0; top:4px; font-size:12px; color:var(--gris); }
.sbd6-rep { font-size:14px; color:var(--gris); }
.sbd6-rep b { color:var(--encre); font-size:16px; display:block; }
.sbd6-etag { display:grid; grid-template-columns:1fr 1fr; gap:5px; padding:6px; border-radius:8px; background:var(--surf); border-bottom:4px solid #b9a48e; }
.sbd6-et { display:flex; align-items:center; gap:7px; text-align:left; padding:5px 6px; border-radius:8px; background:#fff; border:1.5px solid transparent; min-width:0; }
.sbd6-et[aria-checked="true"] { border-color:var(--encre); }
.sbd6-mini { width:calc(16px * var(--k)); height:calc(22px * var(--k)); border-radius:50% 50% 50% 50% / 60% 60% 40% 40%; flex:none; display:block; }
.sbd6-en { display:flex; flex-direction:column; gap:1px; font-size:14px; min-width:0; }
.sbd6-en .sbd-hop { white-space:nowrap; }
.sbd6-en small { font-size:12px; color:var(--gris); display:inline-flex; align-items:center; gap:4px; white-space:nowrap; }
.sbd6-en .sbd-us { font-size:11px; line-height:14px; padding:0 4px; }
.sbd6-st { display:flex; align-items:center; gap:6px; }
.sbd6-sl { font-size:12px; color:var(--gris); white-space:nowrap; }
.sbd6-bf { flex:1; display:flex; align-items:center; gap:3px; }
.sbd6-bf .sbd-bar { flex:1; }
.sbd6-orig { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--gris); }
.sbd6-orig small { font-size:12px; }
`;
