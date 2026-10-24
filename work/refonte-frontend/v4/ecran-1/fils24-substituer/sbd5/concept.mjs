// sbd5 — tiède : la frise des réponses. Le brassin en frise (60′ → après), et au-dessus de chaque moment ce que le
// moteur répond : combien de houblons sont très proches, et lesquels sans inconnue. La falaise entre 15′ et 10′
// dit tout : à l'ébullition longue, 137 amérisants font l'affaire ; tard, 8. Ta ligne est épinglée à son moment ;
// la liste dessous répond pour ce moment-là (le seul choix : le remplaçant).
import { R, cas, page, pic, usage, badgeStock, nomHop, croix, lentille, aide, barre, fr, fr1, g0, COURT, LEG_FAM, NUGGET, COUL, troisCas, gagnePerd } from '../sbd1/serie/socle.mjs';

const ID = 'sbd5';
const FRISE = [['b60', '60′'], ['b30', '30′'], ['b15', '15′'], ['b10', '10′'], ['b5', '5′'], ['b0', '0′'], ['wp', 'WP'], ['dryActive', 'actif'], ['dryPost', 'après']];
const meilleurs = (m) => R.moments[m].top.filter((s) => s.couverture.fiabilite === 'bonne' && !s.amertumeDeconseillee).slice(0, 2).map((s) => s.name);
const rangA = (m, nom) => { const o = R.moments[m]; const s = [...o.top, ...o.stock].find((x) => x.name === nom); return s ? s.rank : null; };
function frise(c) {
  const max = 137;
  const cols = FRISE.map(([m, lab]) => { const o = R.moments[m], n = o.comptes.tresProchesRetenus, p = o.poids;
    return `<div class="sbd5-col${m === c.m ? ' sbd5-ici' : ''}"><span class="sbd5-n sbd-num">${n}</span><span class="sbd5-h"><i style="height:${Math.max(3, 64 * n / max)}px"></i></span>
<span class="sbd5-w" aria-label="poids : amertume ${Math.round(p.amertume * 100)} %, arôme ${Math.round(p.arome * 100)} %"><i class="sbd5-wa" style="height:${p.amertume * 26}px"></i><i class="sbd5-wh" style="height:${p.huiles * 26}px"></i><i class="sbd5-wr" style="height:${p.arome * 26}px"></i></span><span class="sbd5-m">${lab}</span>${m === c.m ? '<b class="sbd5-pin">ta ligne</b>' : ''}</div>`; }).join('');
  // les réponses, groupées tant qu'elles ne changent pas
  const grp = []; for (const [m] of FRISE) { const k = meilleurs(m).join(' · '); if (grp.length && grp[grp.length - 1].k === k) grp[grp.length - 1].n++; else grp.push({ k, n: 1, m }); }
  const rep = grp.map((g) => `<span class="sbd5-rep${g.m === 'b60' ? ' sbd5-r1' : ' sbd5-r2'}" style="flex:${g.n}">${g.k.split(' · ').map((x) => `<span><i class="sbd-pt" style="background:${COUL[x] || '#8c8c96'}"></i>${x}</span>`).join('')}</span>`).join('');
  return `<div class="sbd5-frise"><div class="sbd5-reps">${rep}</div><div class="sbd5-cols">${cols}</div>
<p class="sbd5-cle"><span><i class="sbd5-k sbd5-wa"></i>amertume</span><span><i class="sbd5-k sbd5-wh"></i>huiles</span><span><i class="sbd5-k sbd5-wr"></i>arôme</span><span class="sbd5-cn"><i class="sbd5-k" style="background:#c9c9d2"></i>très proches</span></p></div>`;
}
function vue(c) {
  const autre = c.contexte === 'amertume' ? 'wp' : 'b60', autreLab = c.contexte === 'amertume' ? 'en WP' : 'à 60′';
  const rows = [...c.top.slice(0, 4), ...c.stock.filter((s) => s.stock.etat === 'en stock').slice(0, 2)];
  const n = c.nugget, fams = ['floral', 'herbal', 'earthy'];
  const ligne = (r, i) => { const ra = rangA(autre, r.nom);
    return `<button type="button" role="radio" aria-checked="${i === 0}" data-choix="${r.nom}" class="sbd5-l"><span class="sbd5-sc sbd-num">${r.score}${r.fiab === 'partielle' ? '?' : ''}</span><span class="sbd5-nm">${nomHop(r)}<small>${usage(r)} <span class="sbd-num">α ${r.alpha.lot ? fr1(r.alpha.v) : fr1(r.alpha.min) + '–' + fr1(r.alpha.max)}</span></small></span><span class="sbd5-d sbd-num">${g0(r.dose.g)} g</span>${badgeStock(r)}<span class="sbd5-ra">${autreLab}<b class="sbd-num">${ra ? 'rang ' + ra : 'hors 12'}</b></span></button>`; };
  const sel = (r, i) => `<div class="sbd5-sel" data-pour="${r.nom}"${i === 0 ? '' : ' hidden'}><span class="sbd5-st">dans ta stout <small>~</small></span>${fams.map((f) => `<span class="sbd5-bf">${pic(f, 13)}${barre(f, r.prof && r.prof[f])}</span>`).join('')}${lentille()}</div>`;
  return `<header class="sbd5-t">${croix()}<h1>Lequel à la place de Nugget ?</h1>${aide(ID + '-leg', [
    'Frise : chaque moment du brassin. Haut : combien de houblons le moteur trouve très proches (note ≥ 80, sans arôme ni produit hors sujet). Dessous : le poids de l’amertume, des huiles et de l’arôme dans la note.',
    'Liste : la réponse au moment de ta ligne, et le rang du même houblon à l’autre bout du brassin.', 'Icônes : ' + LEG_FAM])}</header>
<p class="sbd5-ctx" data-role="contexte"><span data-contexte="moment">${c.court}</span><span data-contexte="dose">IBU égal</span><span data-contexte="base">Stout 16D</span></p>
${frise(c)}
<p class="sbd5-q">${c.contexte === 'amertume' ? `<b>${c.comptes.tresProchesRetenus} très proches ${c.titre}</b> : l'amertume se remplace facilement.` : `<b>${c.comptes.tresProchesRetenus} très proches ${c.titre}</b> : un arôme se remplace mal.`}</p>
<div class="sbd5-liste" data-libre="houblon" role="radiogroup" aria-label="Remplaçant">${rows.map(ligne).join('')}</div>
${rows.map(sel).join('')}
${troisCas(c)}`;
}
export function construire() {
  const b = cas('b60'), w = cas('wp');
  const noms = [...new Set([NUGGET.nom, ...[b, w].flatMap((c) => [...c.top.slice(0, 4), ...c.stock].map((r) => r.nom))])];
  return page({ id: ID, titre: 'sbd5 · la frise des réponses', vue: vue(b), autres: { wp: vue(w) }, fiches: noms, css: CSS });
}
const CSS = `
.sbd5 { max-width:390px; margin:0 auto; padding:6px 10px 18px; display:flex; flex-direction:column; gap:5px; }
.sbd5-t { display:flex; align-items:center; gap:8px; }
.sbd5-t h1 { font:600 17px/1.2 var(--sans); flex:1; }
.sbd5-ctx { display:flex; gap:4px; }
.sbd5-ctx span { height:22px; padding:0 9px; border-radius:11px; background:var(--surf2); font-size:13px; display:inline-flex; align-items:center; }
.sbd5-frise { background:var(--surf); border-radius:8px; padding:8px 6px 6px; display:flex; flex-direction:column; gap:4px; }
.sbd5-reps { display:flex; gap:4px; }
.sbd5-rep { display:flex; flex-direction:column; gap:1px; font-size:13px; font-weight:600; padding:3px 6px; border-radius:4px; background:#fff; }
.sbd5-rep span { display:inline-flex; align-items:center; gap:4px; white-space:nowrap; }
.sbd5-cols { display:grid; grid-template-columns:repeat(9, 1fr); }
.sbd5-col { display:flex; flex-direction:column; align-items:center; gap:2px; position:relative; padding-bottom:16px; }
.sbd5-n { font-size:12px; color:var(--gris); }
.sbd5-h { height:64px; display:flex; align-items:flex-end; }
.sbd5-h i { width:18px; background:#c9c9d2; border-radius:2px 2px 0 0; display:block; }
.sbd5-ici .sbd5-h i { background:#8c8c96; }
.sbd5-w { display:flex; flex-direction:column; width:18px; margin-top:6px; border-radius:2px; overflow:hidden; }
.sbd5-w i { display:block; }
.sbd5-wa { background:#2c2c34; } .sbd5-wh { background:#9a9aa6; } .sbd5-wr { background:#0e7c86; }
.sbd5-m { font-size:12px; color:var(--gris); }
.sbd5-ici .sbd5-m { color:var(--encre); font-weight:700; }
.sbd5-ici .sbd5-n { color:var(--encre); font-weight:700; }
.sbd5-pin { position:absolute; bottom:0; font-size:11px; background:var(--encre); color:#fff; border-radius:7px; padding:0 5px; line-height:14px; white-space:nowrap; }
.sbd5-cle { display:flex; gap:10px; font-size:12px; color:var(--gris); flex-wrap:wrap; }
.sbd5-cle span { display:inline-flex; align-items:center; gap:3px; }
.sbd5-k { width:9px; height:9px; border-radius:2px; display:inline-block; }
.sbd5-cn { margin-left:auto; }
.sbd5-q { font-size:14px; color:var(--gris); }
.sbd5-q b { color:var(--encre); font-size:16px; }
.sbd5-liste { display:flex; flex-direction:column; }
.sbd5-l { display:grid; grid-template-columns:34px 1fr auto auto 62px; gap:6px; align-items:center; text-align:left; padding:6px 4px; border-bottom:1px solid var(--trait); }
.sbd5-l[aria-checked="true"] { background:var(--surf); border-radius:4px; }
.sbd5-sc { font-size:16px; font-weight:700; }
.sbd5-nm { display:flex; flex-direction:column; gap:1px; min-width:0; font-size:14px; }
.sbd5-nm small { font-size:12px; color:var(--gris); display:inline-flex; gap:5px; align-items:center; }
.sbd5-d { font-size:14px; }
.sbd5-ra { display:flex; flex-direction:column; font-size:11px; color:var(--gris); text-align:right; }
.sbd5-ra b { font-size:12px; font-weight:400; }
.sbd5-sel { display:flex; align-items:center; gap:6px; }
.sbd5-st { font-size:12px; color:var(--gris); white-space:nowrap; }
.sbd5-bf { display:flex; align-items:center; gap:3px; flex:1; }
.sbd5-bf .sbd-bar { flex:1; }
`;
