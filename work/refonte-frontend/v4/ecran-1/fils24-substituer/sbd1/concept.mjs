// sbd1 — froide : u4 affiné. Le classement de u4 (score, plage quand une composante manque), dont chaque barre
// se découpe selon les poids du moment : à 60′, l'amertume en fait 60 % ; en whirlpool, l'arôme 60 %.
import { cas, page, pic, usage, badgeStock, alphaTxt, doseTxt, nomHop, croix, lentille, aide, barre, fr, g0, fr1, COURT, LEG_FAM, NUGGET } from './serie/socle.mjs';

const ID = 'sbd1';
const W = { amertume: 'amertume', huiles: 'huiles', arome: 'arôme' };
const wLab = (c, k) => (k === 'arome' && c.contexte === 'amertume' ? 'arôme étranger' : W[k]);
function plage(r, p) { // score si la composante inconnue vaut 0 ou 100 (u4), poids du moteur
  const ks = ['arome', 'huiles', 'amertume'], conn = ks.filter((k) => r.comp[k] != null), inc = ks.filter((k) => r.comp[k] == null);
  if (!inc.length) return null;
  const s = (v) => Math.round(ks.reduce((t, k) => t + p[k] * (r.comp[k] ?? v), 0));
  return [s(0), s(100)];
}
function ligne(r, c, i) {
  const p = c.poids, pl = plage(r, p), ordre = ['amertume', 'huiles', 'arome'];
  const segs = ordre.map((k) => r.comp[k] == null
    ? `<i class="sbd1-sg sbd1-inc" style="width:${(p[k] * 100).toFixed(1)}%" aria-label="${W[k]} inconnue"></i>`
    : `<i class="sbd1-sg sbd1-${k}" style="width:${(p[k] * r.comp[k]).toFixed(1)}%"></i><i class="sbd1-trou" style="width:${(p[k] * (100 - r.comp[k])).toFixed(1)}%"></i>`).join('');
  return `<button type="button" role="radio" aria-checked="${i === 0}" class="sbd1-l" data-choix="${r.nom}">
<span class="sbd1-n">${badgeStock(r)}${nomHop(r)}</span>${usage(r)}<span class="sbd1-a">${alphaTxt(r, false)}</span>
<span class="sbd1-bar">${segs}</span><b class="sbd1-s sbd-num">${pl ? `${pl[0]}–${pl[1]}` : r.score}</b></button>`;
}
function face(r, c) {
  const fams = ['floral', 'herbal', 'earthy', 'resin'];
  const nug = c.nugget;
  const rangee = (h, cls) => `<div class="sbd1-fr ${cls}"><span class="sbd1-fn">${nomHop(h)}</span>${fams.map((f) => barre(f, h.prof && h.prof[f])).join('')}</div>`;
  const tot = (h) => h.prof ? fams.reduce((t, f) => t + (h.prof[f].inc ? 0 : h.prof[f].c), 0) : 0;
  return `<section class="sbd1-face" data-pour="${r.nom}"${r === c.premier ? '' : ' hidden'}>
<div class="sbd1-swap"><span>${nomHop(nug)} <span class="sbd-num">46 g</span></span>${'<span class="sbd1-fl">→</span>'}<span>${nomHop(r)} <b class="sbd-num">${doseTxt(r)}</b></span><span class="sbd1-ibu sbd-num">${c.ref.ibu ? Math.round(c.ref.ibu) + ' IBU' : 'à froid'}</span></div>
<p class="sbd1-raison">${r.cher ? `<span class="sbd1-alerte">${r.cher}</span> · ` : ''}${r.fiab === 'partielle' ? 'huiles inconnues : plage ouverte' : r.fiab === 'bonne' ? 'α, β, huiles et arômes connus' : 'arôme inconnu'}${r.stock.etat === 'en stock' ? ` · stock ${g0(r.stock.libre)} g${r.stock.suffisant === false ? ', il en manque ' + g0(r.dose.g - r.stock.libre) + ' g' : ''}` : ''}</p>
<div class="sbd1-stout"><div class="sbd1-sh"><span>Dans ta stout ${c.titre} <small>~ simulé</small></span>${lentille()}</div>
<div class="sbd1-fr sbd1-tete"><span></span>${fams.map((f) => `<span>${pic(f, 14)}${COURT[f]}</span>`).join('')}</div>
${rangee(nug, 'sbd1-orig')}${rangee(r, '')}
<p class="sbd1-reste">${c.id === 'b60' ? `L'ébullition emporte presque tout : ~${fr(tot(nug))} contre ~${fr(tot(r))} sur ces familles. À 60′, on remplace une amertume.` : `Ici l'arôme reste : ~${fr(tot(nug))} contre ~${fr(tot(r))}. On remplace un arôme.`}</p></div>
</section>`;
}
function vue(c) {
  const p = c.poids, bas = (r) => (plage(r, p) || [r.score])[0], top = c.top.slice(0, 5).sort((x, y) => bas(y) - bas(x) || y.score - x.score), st = c.stock.filter((s) => s.stock.etat === 'en stock' && !top.includes(s)).slice(0, 4);
  c.premier = top[0];
  const tous = [...top, ...st], best = top.filter((r) => r.fiab === 'bonne').slice(0, 2);
  const part = ['amertume', 'huiles', 'arome'].map((k) => `<span class="sbd1-pk"><i class="sbd1-${k}" style="width:${p[k] * 60}px"></i>${wLab(c, k)} ${Math.round(p[k] * 100)} %</span>`).join('');
  return `<header class="sbd1-t">${croix()}<h1>Lequel à la place de Nugget ?</h1>${aide(ID + '-leg', [
    'Barre : la note du remplaçant (0 à 100), découpée selon ce qui compte au moment de l’ajout. Plein : la part gagnée ; clair : la part perdue ; hachuré : inconnu, la note devient une plage.',
    'Icônes : ' + LEG_FAM, 'Caddie : à acheter ; boîte : en stock (grise : pas assez).'])}</header>
<p class="sbd1-ctx" data-role="contexte"><span data-contexte="moment">${c.court}</span><span data-contexte="dose">46 g · IBU égal</span><span data-contexte="base">Stout 16D</span></p>
<p class="sbd1-rep"><b>${best.map((r) => r.nom + ' ' + r.score).join(', ')}, sans inconnue.</b> <span>${c.comptes.tresProchesRetenus} houblons très proches ${c.titre}.</span></p>
<div class="sbd1-poids" aria-label="poids du moment">${part}</div>
<div class="sbd1-liste" data-libre="houblon" role="radiogroup" aria-label="Remplaçant">${top.map((r, i) => ligne(r, c, i)).join('')}<p class="sbd1-sep">Dans ton stock</p>${st.map((r) => ligne(r, c, -1)).join('')}</div>
${tous.map((r) => face(r, c)).join('')}`;
}
export function construire() {
  const b = cas('b60'), w = cas('wp');
  const noms = [...new Set([NUGGET.nom, ...[b, w].flatMap((c) => [...c.top.slice(0, 5), ...c.stock.filter((s) => s.stock.etat === 'en stock')].map((r) => r.nom))])];
  return page({ id: ID, titre: 'sbd1 · u4 au poids du moment', vue: vue(b), autres: { wp: vue(w) }, fiches: noms, css: CSS });
}
const CSS = `
.sbd1 { max-width:390px; margin:0 auto; padding:6px 10px 18px; display:flex; flex-direction:column; gap:7px; }
.sbd1-t { display:flex; align-items:center; gap:8px; }
.sbd1-t h1 { font:600 17px/1.2 var(--sans); flex:1; }
.sbd1-ctx { display:flex; gap:4px; flex-wrap:wrap; }
.sbd1-ctx span { height:22px; padding:0 9px; border-radius:11px; background:var(--surf2); font-size:13px; display:inline-flex; align-items:center; }
.sbd1-rep { font-size:16px; line-height:1.3; }
.sbd1-rep span { display:block; font-size:13px; color:var(--gris); }
.sbd1-poids { display:flex; gap:10px; font-size:12px; color:var(--gris); align-items:center; }
.sbd1-pk { display:inline-flex; align-items:center; gap:4px; }
.sbd1-pk i { display:inline-block; height:8px; border-radius:2px; }
.sbd1-liste { display:flex; flex-direction:column; border-top:1px solid var(--trait); }
.sbd1-l { display:grid; grid-template-columns:1fr auto 96px; grid-template-rows:auto auto; column-gap:6px; row-gap:3px; align-items:center; text-align:left; padding:5px 4px; border-bottom:1px solid var(--trait); }
.sbd1-l[aria-checked="true"] { background:var(--surf); border-radius:4px; }
.sbd1-n { display:inline-flex; align-items:center; gap:4px; min-width:0; white-space:nowrap; }
.sbd1-n .sbd-hop { overflow:hidden; text-overflow:ellipsis; }
.sbd1-a { font-size:13px; justify-self:end; }
.sbd1-l .sbd-us { justify-self:start; }
.sbd1-bar { grid-column:1 / 3; margin-right:8px; display:flex; height:8px; border-radius:2px; overflow:hidden; background:#f1f1f4; }
.sbd1-s { grid-column:3; grid-row:2; justify-self:end; font-size:13px; }
.sbd1-sg, .sbd1-trou { display:block; height:100%; }
.sbd1-amertume { background:#2c2c34; } .sbd1-huiles { background:#7d7d89; } .sbd1-arome { background:#0e7c86; }
.sbd1-pk i.sbd1-amertume, .sbd1-pk i.sbd1-huiles, .sbd1-pk i.sbd1-arome { display:inline-block; }
.sbd1-trou { background:#e6e6ec; }
.sbd1-inc { background:repeating-linear-gradient(45deg,#f1f1f4 0 3px,#c6c6cf 3px 4.5px); }
.sbd1-sep { font-size:12px; font-weight:600; color:var(--gris); padding:6px 4px 2px; }
.sbd1-face { display:flex; flex-direction:column; gap:6px; padding-top:4px; }
.sbd1-swap { display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:14px; }
.sbd1-fl { color:var(--gris); }
.sbd1-ibu { margin-left:auto; font-size:13px; color:var(--gris); }
.sbd1-raison { font-size:13px; color:var(--gris); }
.sbd1-alerte { color:var(--acc); font-weight:600; }
.sbd1-stout { background:var(--surf); border-radius:8px; padding:7px 8px; display:flex; flex-direction:column; gap:5px; }
.sbd1-sh { display:flex; align-items:center; justify-content:space-between; font-size:13px; font-weight:600; }
.sbd1-sh small { font-weight:400; color:var(--gris); }
.sbd1-fr { display:grid; grid-template-columns:96px repeat(4, 1fr); gap:6px; align-items:center; font-size:13px; }
.sbd1-tete span { display:inline-flex; align-items:center; gap:2px; font-size:12px; color:var(--gris); }
.sbd1-reste { font-size:13px; }
`;
