// sbd7 — chaude : l'entonnoir du moment. Les 318 variétés du catalogue passent par les clés de classement du moteur
// (couverture, produit d'arôme cher à amériser, palier très proche, sans inconnue), puis le stock. Le moment change
// les tamis : à 60′, l'entonnoir est large (137 très proches) et retient les amérisants ; en whirlpool, il ne laisse
// passer que 8 houblons, et aucun en stock qui suffise.
import { cas, page, pic, usage, badgeStock, nomHop, croix, lentille, aide, barre, fr, fr1, g0, COURT, LEG_FAM, NUGGET, troisCas, gagnePerd } from '../sbd1/serie/socle.mjs';

const ID = 'sbd7';
function vue(c) {
  const k = c.comptes, amer = c.contexte === 'amertume';
  const stockOk = c.stock.filter((s) => s.stock.etat === 'en stock' && s.stock.suffisant);
  const stockTP = stockOk.filter((s) => s.score >= 80 && !s.cher && s.fiab !== 'faible');
  const etages = [
    [k.total, 'au catalogue', 'les variétés lues par le moteur'],
    [k.decrits, 'arôme décrit', `${k.faible} sans aucune famille citée, classés derrière`],
    [k.decritsNonChers, amer ? 'faits pour amériser' : 'aucun écarté ici', amer ? `${k.cher} aromatiques ou cryo : chers pour amériser` : 'à l’arôme, un aromatique a sa place'],
    [k.tresProchesRetenus, 'très proches', `note ≥ 80, poids ${Math.round(c.poids.amertume * 100)} % amertume · ${Math.round(c.poids.arome * 100)} % arôme`],
    [k.sansInconnue, 'sans inconnue', 'α, β, huiles et arômes connus'],
    [stockTP.length, 'en stock, assez', stockTP.length ? stockTP.map((s) => s.nom).join(', ') : 'aucun : il faudra acheter'],
  ];
  const w = (n) => Math.max(34, Math.round(330 * Math.sqrt(n / k.total)));
  const funnel = etages.map(([n, t, s], i) => `<div class="sbd7-et${i === etages.length - 1 ? ' sbd7-bec' : ''}" style="--w:${w(n)}px;--o:${(0.25 + 0.75 * i / (etages.length - 1)).toFixed(2)}"><span class="sbd7-b"><b class="sbd-num">${n}</b></span><span class="sbd7-tx"><b>${t}</b><small>${s}</small></span></div>`).join('');
  const sortie = [...c.top.filter((s) => s.fiab === 'bonne' && !s.cher).slice(0, 3), ...stockTP, ...(stockTP.length ? [] : stockOk.slice(0, 2))].filter((r, i, a) => a.indexOf(r) === i).slice(0, 5);
  const n = c.nugget, fams = ['floral', 'herbal', 'earthy', 'resin'];
  const ligne = (r, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-choix="${r.nom}" class="sbd7-l"><span class="sbd7-sc sbd-num">${r.score}</span>${nomHop(r)}${usage(r)}<span class="sbd-num sbd7-al">α ${r.alpha.lot ? fr1(r.alpha.v) : fr1(r.alpha.min) + '–' + fr1(r.alpha.max)}</span><span class="sbd-num sbd7-g">${g0(r.dose.g)} g</span>${badgeStock(r)}</button>`;
  const sel = (r, i) => `<div class="sbd7-sel" data-pour="${r.nom}"${i === 0 ? '' : ' hidden'}><span class="sbd7-st">${nomHop(n)} → ${nomHop(r)} dans ta stout <small>~</small></span>${gagnePerd(r, c)}<span class="sbd7-bars">${fams.map((f) => `<span>${pic(f, 13)}${barre(f, n.prof && n.prof[f], 'sbd7-bn')}${barre(f, r.prof && r.prof[f])}</span>`).join('')}</span></div>`;
  return `<header class="sbd7-t">${croix()}<h1>Lequel à la place de Nugget ?</h1>${aide(ID + '-leg', [
    'L’entonnoir suit les clés de classement du moteur, dans l’ordre ; la largeur dit combien de variétés restent. Le moment change les tamis et les poids.',
    'En bas : ce qui sort de l’entonnoir, à choisir. Barres : ta stout avec Nugget (pâle) puis avec le remplaçant, ~ simulé.', 'Icônes : ' + LEG_FAM])}</header>
<div class="sbd7-ctx"><p class="sbd-ctxp" data-role="contexte"><span data-contexte="moment">${c.court}</span><span data-contexte="dose">IBU égal</span><span data-contexte="base">Stout 16D</span></p>${lentille()}</div>
<div class="sbd7-fun ${amer ? 'sbd7-chaud' : 'sbd7-froid'}">${funnel}</div>
<div class="sbd7-out" data-libre="houblon" role="radiogroup" aria-label="Remplaçant">${sortie.map(ligne).join('')}</div>
${sortie.map(sel).join('')}
${troisCas(c)}`;
}
export function construire() {
  const b = cas('b60'), w = cas('wp');
  const noms = [...new Set([NUGGET.nom, ...[b, w].flatMap((c) => [...c.top.slice(0, 5), ...c.stock].map((r) => r.nom))])];
  return page({ id: ID, titre: 'sbd7 · l’entonnoir du moment', vue: vue(b), autres: { wp: vue(w) }, fiches: noms, css: CSS });
}
const CSS = `
.sbd7 { max-width:390px; margin:0 auto; padding:6px 10px 18px; display:flex; flex-direction:column; gap:5px; }
.sbd7-t { display:flex; align-items:center; gap:8px; }
.sbd7-t h1 { font:600 17px/1.2 var(--sans); flex:1; }
.sbd7-ctx { display:flex; gap:4px; align-items:center; }
.sbd7-ctx span[data-contexte] { height:22px; padding:0 9px; border-radius:11px; background:var(--surf2); font-size:13px; display:inline-flex; align-items:center; }
.sbd7-ctx .sbd-seg { margin-left:auto; }
.sbd7-fun { display:flex; flex-direction:column; align-items:center; gap:3px; }
.sbd7-et { position:relative; width:100%; display:flex; flex-direction:column; align-items:center; }
.sbd7-b { width:var(--w); height:30px; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:15px; }
.sbd7-chaud .sbd7-b { background:#2c2c34; }
.sbd7-froid .sbd7-b { background:#0e7c86; }
.sbd7-bec .sbd7-b { border-radius:4px 4px 8px 8px; }
.sbd7-tx { display:flex; gap:6px; align-items:baseline; font-size:13px; line-height:1.2; padding:1px 0 2px; }
.sbd7-tx small { font-size:12px; color:var(--gris); }
.sbd7-out { display:flex; flex-direction:column; border-top:2px solid var(--encre); }
.sbd7-l { display:flex; align-items:center; gap:6px; padding:7px 4px; border-bottom:1px solid var(--trait); text-align:left; font-size:14px; }
.sbd7-l[aria-checked="true"] { background:var(--surf); border-radius:4px; }
.sbd7-sc { font-size:16px; font-weight:700; width:28px; }
.sbd7-al { font-size:13px; margin-left:auto; }
.sbd7-g { font-size:14px; width:44px; text-align:right; }
.sbd7-sel { display:flex; flex-direction:column; gap:4px; padding:6px 8px; background:var(--surf); border-radius:8px; }
.sbd7-st { font-size:13px; display:flex; align-items:center; gap:5px; flex-wrap:wrap; }
.sbd7-bars { display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; }
.sbd7-bars > span { display:flex; flex-direction:column; gap:2px; }
.sbd7-bn { opacity:.6; }
`;
