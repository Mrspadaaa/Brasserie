// sbd4 — tiède : la carte de l'ajout, éclairée par le moment. Les remplaçants prennent la place de Nugget sur le
// rail du brassin (vocabulaire de l'étape Houblons, base v4.10) ; le moment décide ce que la carte met en lumière :
// à 60′, l'α et l'IBU en grand, la bande des arômes éteinte (elle part à l'ébullition) ; en whirlpool, l'inverse.
import { cas, page, pic, usage, badgeStock, nomHop, croix, lentille, aide, barre, fr, fr1, g0, JET, ROUE, COURT, LEG_FAM, NUGGET } from '../sbd1/serie/socle.mjs';

const ID = 'sbd4';
const bande = (h) => `<span class="sbd4-bd" aria-label="arômes des fiches">${ROUE.map((f) => h.niveaux[f] > 0
  ? `<i data-famille="${f}" style="background:${JET[f].base}${h.niveaux[f] > 1 ? '' : ';opacity:.55'}"></i>` : '<i class="sbd4-nd"></i>').join('')}</span>`;
function carte(r, c, i) {
  const tot = r.prof ? ['floral', 'herbal', 'earthy', 'resin', 'citrus', 'tropical'].reduce((t, f) => t + (r.prof[f].inc ? 0 : r.prof[f].c), 0) : null;
  const ibu = c.ref.ibu ? Math.round(c.ref.ibu) : null;
  return `<button type="button" role="radio" aria-checked="${i === 0}" data-choix="${r.nom}" class="sbd4-c">
<span class="sbd4-l1">${nomHop(r)}${usage(r)}<span class="sbd4-al sbd-num">α ${r.alpha.lot ? fr1(r.alpha.v) : fr1(r.alpha.min) + '–' + fr1(r.alpha.max)}</span>${badgeStock(r)}<span class="sbd4-sc sbd-num">${r.score}${r.fiab === 'partielle' ? '?' : ''}</span></span>
<span class="sbd4-l2"><span class="sbd4-g sbd-num">${g0(r.dose.g)} g</span><span class="sbd4-ibu sbd-num">${ibu ? ibu + ' IBU' : 'à froid'}</span>${bande(r)}<span class="sbd4-reste sbd-num">${tot == null ? '?' : '~' + fr(tot)}</span></span></button>`;
}
function vue(c) {
  const amer = c.contexte === 'amertume';
  const rows = [...c.top.slice(0, 4), ...c.stock.filter((s) => s.stock.etat === 'en stock' && s.stock.suffisant).slice(0, 2)];
  const n = c.nugget, fams = ['floral', 'herbal', 'earthy', 'resin'];
  const noeuds = [['b60', 'Ébullition', '60′'], ['b0', '0′', ''], ['wp', 'whirlpool', ''], ['dryActive', 'fermentation', ''], ['dryPost', 'post-fermentation', '']];
  const ici = c.m === 'b60' ? 'b60' : c.m;
  const sel = (r, i) => `<div class="sbd4-sel" data-pour="${r.nom}"${i === 0 ? '' : ' hidden'}><p class="sbd4-sh"><span>Ta stout avec ${nomHop(r)} <small>~ simulé, ${c.titre}</small></span></p>
<div class="sbd4-bars">${fams.map((f) => `<span class="sbd4-bf"><span>${pic(f, 14)}${COURT[f]}</span>${barre(f, n.prof && n.prof[f], 'sbd4-bn')}${barre(f, r.prof && r.prof[f])}</span>`).join('')}</div>
<p class="sbd4-mot">${amer ? `${r.raison.split(';').find((x) => /α/.test(x)) || ''} · même IBU, ${g0(r.dose.g)} g.` : `${r.familles ? '' : ''}${(r.communes || []).length ? 'En commun : ' + r.communes.slice(0, 3).map((f) => COURT[f].toLowerCase()).join(', ') : 'Aucune famille en commun'} · ${g0(r.dose.g)} g.`}</p></div>`;
  return `<header class="sbd4-t">${croix()}<h1>Lequel à la place de Nugget ?</h1>${aide(ID + '-leg', [
    'La carte met en lumière ce qui compte au moment de l’ajout : à l’ébullition, l’α et l’IBU ; à froid ou en whirlpool, les arômes.',
    'Bande de 12 cases : les familles citées par les fiches (pâle : citée une fois). « ~ » : ce qui reste dans ta stout, simulé, en points.', 'Icônes : ' + LEG_FAM])}</header>
<div class="sbd4-ctx"><p class="sbd-ctxp" data-role="contexte"><span data-contexte="moment">${c.court}</span><span data-contexte="dose">IBU égal</span><span data-contexte="base">Stout 16D</span></p>${lentille()}</div>
<div class="sbd4-brassin ${amer ? 'sbd4-amer' : 'sbd4-arome'}">
<ol class="sbd4-rail">${noeuds.map(([m, lab, pill]) => `<li class="${m === ici ? 'sbd4-ici' : ''}"><i></i><span>${lab}${m === ici && pill ? ` <b>${pill}</b>` : ''}</span>${m === ici ? `<div class="sbd4-slot">
<div class="sbd4-orig">${nomHop(n)}<span class="sbd-num">α 13 · 46 g · ${c.ref.ibu ? Math.round(c.ref.ibu) + ' IBU' : 'à froid'}</span>${badgeStock({ stock: { etat: 'épuisé' } })}<small>${amer ? "l'arôme part à l'ébullition" : "l'arôme reste"}</small></div>
<div class="sbd4-pile" data-libre="houblon" role="radiogroup" aria-label="Remplaçant">${rows.map((r, i) => carte(r, c, i)).join('')}</div></div>` : ''}</li>`).join('')}</ol></div>
${rows.map(sel).join('')}`;
}
export function construire() {
  const b = cas('b60'), w = cas('wp');
  const noms = [...new Set([NUGGET.nom, ...[b, w].flatMap((c) => [...c.top.slice(0, 4), ...c.stock].map((r) => r.nom))])];
  return page({ id: ID, titre: 'sbd4 · la carte éclairée par le moment', vue: vue(b), autres: { wp: vue(w) }, fiches: noms, css: CSS });
}
const CSS = `
.sbd4 { max-width:390px; margin:0 auto; padding:6px 10px 18px; display:flex; flex-direction:column; gap:8px; }
.sbd4-t { display:flex; align-items:center; gap:8px; }
.sbd4-t h1 { font:600 17px/1.2 var(--sans); flex:1; }
.sbd4-ctx { display:flex; gap:4px; align-items:center; }
.sbd4-ctx span[data-contexte] { height:22px; padding:0 9px; border-radius:11px; background:var(--surf2); font-size:13px; display:inline-flex; align-items:center; }
.sbd4-ctx .sbd-seg { margin-left:auto; }
.sbd4-rail { list-style:none; position:relative; }
.sbd4-rail::before { content:""; position:absolute; left:7px; top:8px; bottom:8px; width:2px; background:#d6d6de; }
.sbd4-rail > li { position:relative; padding:1px 0 1px 24px; font-size:13px; color:var(--gris); }
.sbd4-rail > li > i { position:absolute; left:2px; top:6px; width:12px; height:12px; border-radius:50%; border:2px solid #b9b9c4; background:#fff; }
.sbd4-rail > li.sbd4-ici > i { border-color:var(--encre); border-width:3px; }
.sbd4-rail > li.sbd4-ici > span { color:var(--encre); font-size:14px; }
.sbd4-ici b { font-weight:700; }
.sbd4-slot { display:flex; flex-direction:column; gap:5px; margin-top:4px; }
.sbd4-orig { display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:13px; padding:5px 8px; border:1.5px dashed #a9a9b4; border-radius:8px; color:var(--gris); }
.sbd4-orig small { flex-basis:100%; font-size:12px; }
.sbd4-pile { display:flex; flex-direction:column; gap:5px; }
.sbd4-c { display:flex; flex-direction:column; gap:2px; text-align:left; padding:4px 8px; border-radius:8px; background:var(--surf); border:1.5px solid transparent; }
.sbd4-c[aria-checked="true"] { border-color:var(--encre); background:#fff; }
.sbd4-l1, .sbd4-l2 { display:flex; align-items:center; gap:6px; }
.sbd4-l1 .sbd-hop { font-size:15px; }
.sbd4-sc { margin-left:auto; font-size:13px; color:var(--gris); }
.sbd4-al { font-size:13px; }
.sbd4-g { font-size:14px; }
.sbd4-bd { display:inline-flex; gap:2px; }
.sbd4-bd i { width:9px; height:9px; border-radius:2px; display:block; }
.sbd4-bd .sbd4-nd { background:#e3e3e8; }
.sbd4-reste { font-size:12px; color:var(--gris); margin-left:auto; }
/* la lumière du moment */
.sbd4-amer .sbd4-al { font-size:15px; font-weight:700; }
.sbd4-amer .sbd4-ibu { font-size:15px; font-weight:700; color:var(--encre); }
.sbd4-amer .sbd4-bd { opacity:.32; filter:grayscale(.6); }
.sbd4-amer .sbd4-reste { opacity:.7; }
.sbd4-arome .sbd4-al, .sbd4-arome .sbd4-ibu { font-size:12px; color:var(--gris); font-weight:400; }
.sbd4-arome .sbd4-bd i { width:13px; height:13px; }
.sbd4-arome .sbd4-reste { font-size:14px; font-weight:700; color:var(--encre); }
.sbd4-sel { display:flex; flex-direction:column; gap:5px; padding:7px 8px; border-radius:8px; background:var(--surf); }
.sbd4-sh { font-size:13px; font-weight:600; }
.sbd4-sh small { font-weight:400; color:var(--gris); }
.sbd4-bars { display:grid; grid-template-columns:1fr 1fr; gap:4px 12px; }
.sbd4-bf { display:flex; flex-direction:column; gap:2px; font-size:12px; color:var(--gris); }
.sbd4-bf > span { display:inline-flex; gap:3px; align-items:center; }
.sbd4-bn { opacity:.7; }
.sbd4-mot { font-size:13px; }
`;
