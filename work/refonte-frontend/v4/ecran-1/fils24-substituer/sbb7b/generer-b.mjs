// Passe 2 de la série b (Substituer, lot D125) : sbb7b (la cible, chaude) et sbb5b (trois raisons, tiède), refaites
// selon le verdict du conseil (conseil-sb/verdict.md, Recommandation) : la paire Nugget 46 g à 60′ et au whirlpool (la
// puce de contexte, un toucher) ; « Annuler » à côté de « Remplacer » ; « ~ » et plages 79–99 sur le score et la dose ;
// α du lot ou plage des fiches, jamais un α inventé ; stock et manque sur chaque ligne ; « Si tu achètes : … » ;
// « autres 83 % » de Nelson Sauvin dans les deux états ; la méthode (poids) derrière « ? » seulement.
// Données : donnees-sbb.json (moteur-sbb.ts, moteur du parcours en direct). Socle : socle-b.mjs (copie de la v0).
// Usage : node generer-b.mjs [sbb7b sbb5b]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from './socle-b.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const lot = path.resolve(ici, '..');
const fr = S.fr;

// ---------- briques ----------
const blocs = (liste, fn, init, tag = 'div') => liste.map((c) => `<${tag} data-pour-cand="${c.id}"${c.id === init ? '' : ' hidden'}>${fn(c)}</${tag}>`).join('');
const plageTxt = (p) => `${p[0]}–${p[1]}`;
const f1 = (x) => fr(x, Number.isInteger(x) ? 0 : 1);
const scoreTxt = (c) => c.plage ? `<span class="§-num §-hz">~${plageTxt(c.plage)}</span>` : `<span class="§-num">~${c.score}</span>`;
const doseTxt = (c) => `<span class="§-num">~${c.dose.min !== c.dose.max ? fr(c.dose.min) + '–' + fr(c.dose.max) : fr(c.dose.grams)} g</span>`;
const alphaTxt = (c) => c.lot ? `<span class="§-num">α ${fr(c.alpha.valeur, 1)}</span>${c.alpha.horsFiches ? `<span class="§-num §-gr">≠ ${f1(c.alpha.plage[0])}–${f1(c.alpha.plage[1])}</span>` : ''}` : `<span class="§-num">α ${f1(c.alphaPl[0])}–${f1(c.alphaPl[1])}</span>`;
const stockTxt = (c) => c.stock.etat === 'à acheter' ? `<span class="§-stk" role="img" aria-label="à acheter">${S.ico('j-achat')}<span>à acheter</span></span>`
  : c.manque != null ? `<span class="§-stk §-court" role="img" aria-label="${fr(c.stock.libre)} g au stock, il en manque ${c.manque}">${S.ico('j-manque')}<span>${fr(c.stock.libre)} g · −${c.manque}</span></span>`
  : `<span class="§-stk" role="img" aria-label="${fr(c.stock.libre)} g au stock, il en restera ${c.reste}">${S.ico('j-stock')}<span>${fr(c.stock.libre)} g</span></span>`;
const marques = (c) => `data-ibu46="${c.ibu46.map((x) => x.toFixed(1)).filter((x, i, t) => t.indexOf(x) === i).join('-')}" data-dose="${c.dose.min !== c.dose.max ? c.dose.min + '-' + c.dose.max : c.dose.grams}" data-alpha="${c.lot ? c.alpha.valeur : c.alphaPl.join('-')}"`;
const i46Txt = (E, c) => `46 g = <span class="§-num">~${c.ibu46[0] === c.ibu46[1] ? fr(c.ibu46[0]) : fr(c.ibu46[0]) + '–' + fr(c.ibu46[1])}</span> IBU → ${doseTxt(c)}`;
const restTxt = (c) => c.stock.etat === 'à acheter' ? 'à acheter' : c.manque != null ? `manque <b class="§-num">${c.manque} g</b>` : `reste <b class="§-num">${c.reste} g</b>`;
const BIERE = ['floral', 'herbal', 'earthy', 'resin'];
const ligneBiere = (E, f, c) => `<div class="§-lb">${S.pic(f, 16)}<span class="§-lbn" style="color:${S.T(f)}">${S.NOMF[f]}</span>${S.barre(f, c.apres.profil, E.nug.profil)}${S.delta(f, c.apres.profil, E.nug.profil)}</div>`;
const maxDelta = (E, c) => Math.max(...BIERE.map((f) => { const x = c.apres.profil[f].v, a = E.nug.profil[f].v; return x && a ? Math.abs(x.centre - a.centre) : 0; }));
// Pourquoi, en trois barres : les composantes du moteur, sans leurs poids (la méthode est derrière « ? »).
const compos = (E, c) => { const b = (lab, v) => `<span class="§-cp"><span>${lab}</span>${v == null ? '<i class="§-cpi"></i><b class="§-num">?</b>' : `<i class="§-cpt"><i style="width:${v}%"></i></i><b class="§-num">${v}</b>`}</span>`;
  return `<span class="§-cps">${b('amertume', c.comp.amertume)}${b('huiles', c.comp.huiles)}${b(E.mo.aromeMot, c.comp.arome)}</span>`; };
const contexte = (E) => `<p class="§-ctx" data-role="contexte"><span data-contexte="base">Stout 16D</span><span data-contexte="moment">Nugget ${E.mo.mot} <button type="button" class="§-sw" data-edite="moment" aria-controls="§-fm-${E.id}" aria-haspopup="dialog" aria-expanded="false" aria-label="Moment de Nugget : ${E.mo.mot}, changer">⇄</button></span><span data-contexte="dose">46 g · <span class="§-num">${fr(E.nug.ibu, 1)}</span> IBU égal</span></p>
<div class="§-fm" id="§-fm-${E.id}" role="dialog" aria-label="Moment de Nugget" hidden><p>Nugget 46 g, même ajout :</p>${['b60', 'wp'].map((m) => `<button type="button" data-vers="${m}" aria-pressed="${m === E.id}">${S.MOMENTS[m].mot}</button>`).join('')}</div>`;
const pied = (E, liste) => `<footer class="§-pied"><p>${blocs(liste, (c) => `46 g de Nugget → <b>${doseTxt(c)} de ${S.esc(c.nom)}</b> <span class="§-gr">${E.mo.mot}</span>`, E.rep.id, 'span')}</p><div class="§-act"><button type="button" class="§-no">Annuler</button><button type="button" class="§-go">Remplacer${S.ico('i-chev-r')}</button></div></footer>`;
const siAchat = (E) => { const a = E.achatSur; return `<p class="§-si">Si tu achètes : <b style="color:${a.coul}">${S.esc(a.nom)}</b>, ${doseTxt(a)}, ${scoreTxt(a)} ${a.palier}.</p>`; };
const CSS_COMMUN = `body { display:flex; flex-direction:column; min-height:100vh; }
.§-e { flex:1; max-width:390px; width:100%; margin:0 auto; padding:6px 12px 8px; display:flex; flex-direction:column; gap:7px; }
.§-h { display:flex; align-items:center; gap:10px; }
.§-h h1 { font-size:17px; font-weight:600; }
.§-ctx { display:flex; flex-wrap:wrap; gap:4px; align-items:center; font-size:13px; margin-top:2px; }
.§-ctx [data-contexte] { background:#f5f5f5; border-radius:999px; padding:1px 8px; white-space:nowrap; }
.§-ctx [data-contexte="moment"] { background:#111; color:#fff; font-weight:600; }
.§-sw { display:inline-flex; align-items:center; justify-content:center; width:28px; height:22px; margin:-2px -6px -2px 4px; border-radius:999px; background:#fff; color:#111; font-weight:700; }
.§-fm { position:absolute; z-index:25; left:12px; right:12px; margin-top:4px; background:#fff; border:1px solid #c9c9c9; border-radius:8px; padding:8px 10px; box-shadow:0 6px 24px rgba(0,0,0,.14); display:flex; gap:8px; align-items:center; flex-wrap:wrap; font-size:13px; }
.§-fm p { width:100%; color:#555; }
.§-fm button { height:36px; padding:0 14px; border-radius:999px; border:1px solid #9e9e9e; font-weight:600; }
.§-fm button[aria-pressed="true"] { background:#111; color:#fff; border-color:#111; }
.§-h { position:relative; }
.§-hz { background:repeating-linear-gradient(45deg,#e0e0e0 0 2px,#fff 2px 5px); padding:0 3px; border-radius:2px; }
.§-lb { display:grid; grid-template-columns:16px 64px 1fr 34px; align-items:center; gap:6px; min-height:20px; }
.§-lbn { font-size:13px; font-weight:600; }
.§-lb .§-dl { text-align:right; }
.§-cps { display:flex; flex-direction:column; gap:3px; }
.§-cp { display:grid; grid-template-columns:96px 1fr 26px; align-items:center; gap:6px; font-size:12px; }
.§-cpt { position:relative; display:block; height:6px; border-radius:999px; background:#ebebeb; }
.§-cpt i { position:absolute; left:0; top:0; bottom:0; border-radius:999px; background:#444; }
.§-cpi { display:block; height:6px; border-radius:999px; background:repeating-linear-gradient(45deg,#c9c9c9 0 2px,#fff 2px 5px); }
.§-cp b { font-size:12px; text-align:right; }
.§-si { font-size:13px; color:#333; }
.§-pied { flex-direction:column; align-items:stretch; gap:6px; }
.§-act { display:flex; gap:8px; }
.§-act .§-no { flex:0 0 34%; }
.§-act .§-go { flex:1; justify-content:center; }
.§-stk.§-court span { color:${S.ORANGE}; }
`;
// Le changement d'état (la puce de contexte) : un toucher montre l'autre moment ; ?moment=wp à l'ouverture.
const CLIENT = `var Q=function(s){return document.querySelector(s)}, QQ=function(s){return [].slice.call(document.querySelectorAll(s))};
function etat(m){ QQ('main [data-etat], body > [data-etat]').forEach(function(s){ s.hidden = s.dataset.etat!==m; }); document.body.dataset.moment=m; var d=Q('[data-etat="'+m+'"] [data-defaut]'); if(d) d.click(); }
function feuilles(){ QQ('.§-fm').forEach(function(f){ f.hidden=true; }); QQ('[data-edite]').forEach(function(b){ b.setAttribute('aria-expanded','false'); }); }
QQ('[data-edite]').forEach(function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); var f=document.getElementById(b.getAttribute('aria-controls')); var o=f.hidden; feuilles(); f.hidden=!o; b.setAttribute('aria-expanded',String(o)); }); });
QQ('[data-vers]').forEach(function(a){ a.addEventListener('click',function(e){ e.preventDefault(); feuilles(); etat(a.dataset.vers); try{ history.replaceState(null,'','?moment='+a.dataset.vers); }catch(x){} }); });
document.addEventListener('keydown',function(e){ if(e.key==='Escape') feuilles(); });
QQ('[data-aide2]').forEach(function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); Q('[data-role="legende-bouton"]').click(); var l=Q('[data-role="legende"]'); var r=b.getBoundingClientRect(); l.style.top=(r.bottom+window.scrollY+6)+'px'; }); });
QQ('.§-no').forEach(function(b){ b.addEventListener('click',function(){ document.body.classList.add('§-annule'); }); });
var mq=location.search.match(/moment=(b60|wp)/); etat(mq?mq[1]:'b60');`;
const LEG = (plus) => [...S.LEG_COMMUNE, ...plus];
// Dans le second état, le « ? » ouvre la même légende (une seule légende par page, D89).
const AIDE2 = '<button type="button" class="§-aide" data-aide2 aria-label="Lire la légende">?</button>';

// ---------------------------------------------------------------------------------------------------------------
// sbb7b · chaude · la cible : Nugget au centre, chaque remplaçant à la distance de son score ; à gauche ton stock,
// à droite l'achat. Points en éléments mesurables (aucune collision), étiquettes en colonnes = les boutons.
function sbb7b() {
  const P = 'sbb7b', W = 366, H = 330, cx = 183, cy = 165, r0 = 24;
  // distance au centre : 1,2 px par point de 100 à 80 (très proche), puis de plus en plus serrée sous 80 (le score
  // garde son ordre ; les cercles 80, 65, 50 donnent l'échelle).
  const rad = (s) => r0 + 9 + Math.min(20, 100 - s) * 1.2 + 20 * (1 - Math.exp(-Math.max(0, 80 - s) / 20));
  const vue = (E) => {
    const enStock = E.cands.filter((c) => c.stock.etat === 'en stock');
    // ton stock : les trois premiers du moteur, la réponse, Nelson Sauvin (L14, « autres 83 % » dans les deux états) ; quatre au moins
    const gauche = [...new Set([...enStock.slice(0, 3), E.rep, E.C['nelson-sauvin'], ...enStock])].slice(0, Math.max(4, new Set([...enStock.slice(0, 3), E.rep, E.C['nelson-sauvin']]).size));
    const droite = E.achat.slice(0, 4);
    const angles = (n, a0, a1) => Array.from({ length: n }, (_, i) => (n === 1 ? (a0 + a1) / 2 : a0 + ((a1 - a0) * i) / (n - 1)));
    const place = (l, a0, a1) => { const A = angles(l.length, a0, a1); return l.map((c, i) => { const a = (A[i] * Math.PI) / 180, r = rad(c.score); return { c, a, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }; }); };
    const PG = place(gauche, 250, 110), PD = place(droite, -60, 60);
    const boites = (pts, cote) => pts.map((p, i, t) => ({ ...p, by: 22 + (i * (H - 22 - 60)) / Math.max(1, t.length - 1), cote }));
    const BG = boites(PG, 'g'), BD = boites(PD, 'd');
    let svg = `<svg class="§-sv" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Cible : Nugget au centre, chaque remplaçant à la distance de son score"><rect x="0" y="0" width="${cx}" height="${H}" fill="#f5f5f5"/>`;
    for (const s of [95, 90, 80, 65, 50]) { const r = rad(s); svg += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="${s === 80 ? '#9e9e9e' : '#d6d6d6'}" stroke-width="1"${s === 80 ? '' : ' stroke-dasharray="3 3"'}/>`; if (s === 80) svg += `<text x="${cx + 2}" y="${(cy + r - 2).toFixed(1)}" font-size="12" fill="#555">${s}</text>`; }
    for (const p of PD) if (p.c.plage) { const a = p.a; svg += `<line x1="${(cx + rad(p.c.plage[1]) * Math.cos(a)).toFixed(1)}" y1="${(cy + rad(p.c.plage[1]) * Math.sin(a)).toFixed(1)}" x2="${(cx + rad(p.c.plage[0]) * Math.cos(a)).toFixed(1)}" y2="${(cy + rad(p.c.plage[0]) * Math.sin(a)).toFixed(1)}" stroke="url(#sbb-hach)" stroke-width="9" stroke-linecap="round"/>`; }
    for (const b of [...BG, ...BD]) svg += `<path d="M${b.x.toFixed(1)},${b.y.toFixed(1)} L${b.cote === 'g' ? 112 : 254},${(b.by + 29).toFixed(1)}" fill="none" stroke="${b.c.coul}" stroke-width="1" opacity=".6"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${r0}" fill="#fff" stroke="#111" stroke-width="2"/><text x="${cx}" y="${cy + 4}" font-size="12" font-weight="700" text-anchor="middle" fill="#111">Nugget</text></svg>`;
    const points = [...PG, ...PD].map((p) => { const court = p.c.manque != null, rep = p.c.id === E.rep.id;
      return `<i class="§-dot${court ? ' §-dc' : ''}${rep ? ' §-rep' : ''}" data-point="${S.esc(p.c.nom)}" style="left:${(p.x - 7).toFixed(1)}px;top:${(p.y - 7).toFixed(1)}px;--c:${p.c.coul}" aria-hidden="true"></i>`; }).join('');
    const boite = (b) => `<button type="button" aria-pressed="${b.c.id === E.rep.id}" data-cand="${b.c.id}" data-eh="${b.c.k}"${b.c.id === E.rep.id ? ' data-defaut' : ''} class="§-lab §-l${b.cote}${b.c.id === E.rep.id ? ' on' : ''}" style="top:${b.by.toFixed(1)}px;--c:${b.c.coul}"><span class="§-mk" data-houblon="${S.esc(b.c.nom)}" ${marques(b.c)}><b>${S.esc(b.c.nom)}</b><span>${alphaTxt(b.c)}${b.c.sansF > 0.5 ? S.autres(b.c, 24).split('autres ').join('') : ''}</span><span>${doseTxt(b.c)} · ${scoreTxt(b.c)}</span><span>${stockTxt(b.c)}</span></span></button>`;
    const carte = (c) => `<div class="§-cd" style="--c:${c.coul}" ${marques(c)} data-houblon="${S.esc(c.nom)}"><div class="§-cdh"><span class="§-cdn">${S.esc(c.nom)}</span>${doseTxt(c)}<span class="§-cds">${scoreTxt(c)}<small>${c.palier}</small></span></div>
<p class="§-cdl">${alphaTxt(c)}${S.usage(c)}${stockTxt(c)}<span class="§-pk">${S.pictos(c.cites.slice(0, 5), 15)}</span>${S.autres(c, 26)}</p>
<p class="§-cdx">${i46Txt(E, c)} · ${restTxt(c)}</p>
${compos(E, c)}<div class="§-cdm">${BIERE.map((f) => ligneBiere(E, f, c)).join('')}</div></div>`;
    const liste = [...gauche, ...droite];
    return { html: `<section data-etat="${E.id}"${E.id === 'b60' ? '' : ' hidden'}>
<header class="§-h">${S.croix(P)}<div><h1>Lequel à la place de Nugget ?</h1>${contexte(E)}</div></header>
<div class="§-ci"><p class="§-cot"><span>ton stock</span><span>à acheter</span></p>${svg}${points}<div data-libre="houblon" role="group" aria-label="Le remplaçant">${[...BG, ...BD].map(boite).join('')}</div></div>
<div class="§-outils"><p class="§-leg3"><i class="§-d"></i><i class="§-d §-dc0"></i><i class="§-hz0"></i></p>${S.legendeBouton(P)}${S.lentille(P)}</div>
${blocs(liste, carte, E.rep.id)}
${siAchat(E)}
</section>`, liste };
  };
  const V = ['b60', 'wp'].map((id) => ({ E: S.ETATS[id], ...vue(S.ETATS[id]) }));
  // Une seule lentille et une seule légende par page (contrôles D75, D89) : celles du second état sont retirées.
  const h1 = V[0].html, h2 = V[1].html.split(S.legendeBouton(P)).join(AIDE2);
  const corps = `<main class="§-e">${h1}${h2}</main>${V.map((v) => `<div data-etat="${v.E.id}"${v.E.id === 'b60' ? '' : ' hidden'}>${pied(v.E, v.liste)}</div>`).join('')}`;
  const css = `${CSS_COMMUN}
.§-ci { position:relative; width:${W}px; height:${H}px; border:1px solid #e0e0e0; border-radius:8px; overflow:hidden; }
.§-sv { position:absolute; left:0; top:0; }
.§-cot { position:absolute; left:0; right:0; top:3px; display:flex; justify-content:space-between; padding:0 8px; font-size:12px; font-weight:700; color:#333; z-index:2; pointer-events:none; }
.§-dot { position:absolute; width:14px; height:14px; border-radius:50%; background:var(--c); border:2px solid #fff; box-shadow:0 0 0 1px var(--c); z-index:2; }
.§-dot.§-dc { background:#fff; border:3px solid var(--c); box-shadow:none; }
.§-dot.§-rep { box-shadow:0 0 0 2px #fff, 0 0 0 4px #111; }
.§-lab { position:absolute; width:110px; height:60px; display:flex; flex-direction:column; justify-content:center; gap:1px; padding:0 5px; border-radius:8px; background:#fff; border:1px solid #d9d9d9; line-height:1.1; z-index:3; font-size:12px; }
.§-mk { display:flex; flex-direction:column; gap:1px; width:100%; }
.§-lg, .§-lg .§-mk { left:2px; align-items:flex-start; }
.§-ld, .§-ld .§-mk { right:2px; align-items:flex-end; }
.§-lab b { font-size:13px; color:var(--c); white-space:nowrap; }
.§-lab span { display:inline-flex; align-items:center; gap:3px; white-space:nowrap; color:#333; }
.§-lab .§-stk { font-size:12px; }
.§-lab .§-gr { display:none; }
.§-lab.on { border:2px solid #111; }
.§-outils { display:flex; align-items:center; gap:8px; }
.§-leg3 { flex:1; display:flex; align-items:center; gap:4px; font-size:12px; color:#555; flex-wrap:wrap; }
.§-d { display:inline-block; width:10px; height:10px; border-radius:50%; background:#555; margin-left:2px; }
.§-dc0 { background:#fff; border:2px solid #555; }
.§-hz0 { display:inline-block; width:16px; height:8px; border-radius:2px; border:1px solid #9e9e9e; background:repeating-linear-gradient(45deg,#9e9e9e 0 2px,#fff 2px 5px); margin-left:2px; }
.§-cd { border-left:4px solid var(--c); padding:2px 0 2px 10px; display:flex; flex-direction:column; gap:4px; }
.§-cdh { display:flex; align-items:baseline; gap:8px; font-size:17px; font-weight:700; }
.§-cdn { font-size:20px; font-weight:800; color:var(--c); }
.§-cds { margin-left:auto; display:flex; align-items:baseline; gap:4px; }
.§-cds small { font-size:12px; font-weight:400; color:#555; }
.§-cdl { display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:13px; }
.§-cdx { font-size:13px; color:#333; }
.§-pk { display:inline-flex; gap:2px; }
.§-cdm { display:flex; flex-direction:column; gap:4px; }
`;
  const fiches = [S.NUG, ...new Map(V.flatMap((v) => v.liste).map((c) => [c.nom, c])).values()];
  return S.page(P, { titre: 'sbb7b · Lequel à la place de Nugget ? · la cible, passe 2', corps, css, client: CLIENT.split('§-').join(P + '-'), fiches,
    legendeLignes: LEG(['Cible : plus près du centre, plus proche de Nugget (cercles 95, 90, 80, 65, 50) ; à gauche ton stock, à droite l’achat ; point creux : stock court ; cerclé : la réponse.']) });
}

// ---------------------------------------------------------------------------------------------------------------
// sbb5b · tiède · trois réponses, trois raisons, sur les deux moments.
function sbb5b() {
  const P = 'sbb5b';
  const vue = (E) => {
    // le moteur range après les autres un produit d'arôme ou un houblon aromatique à un moment d'amertume : pas proposé ici
    const dispo = E.cands.filter((c) => c.stock.etat === 'en stock' && c.stock.suffisant && !c.deconseille);
    const sans = E.rep, leger = [...dispo].sort((a, b) => a.dose.grams - b.dose.grams)[0];
    const procheStock = E.cands.find((c) => c.stock.etat === 'en stock');
    const deux = leger && leger.id !== sans.id ? [leger, 'Le moins de matière'] : [procheStock, 'Le plus proche, stock court'];
    const R = [[sans, sans.id === (leger && leger.id) ? 'Sans rien acheter, le moins de matière' : 'Sans rien acheter'], deux, [E.achatSur, 'Si tu achètes']];
    const nelson = E.C['nelson-sauvin'];
    const L = R.map((r) => r[0]);
    const carte = ([c, titre], i) => `<button type="button" aria-pressed="${c.id === E.rep.id}" data-cand="${c.id}" data-eh="${c.k}"${c.id === E.rep.id ? ' data-defaut' : ''} class="§-cd${c.id === E.rep.id ? ' on' : ''}" style="--c:${c.coul}"><span class="§-cgr" ${marques(c)}>
<span class="§-ck">${titre}</span>
<span class="§-cn" data-houblon="${S.esc(c.nom)}">${S.esc(c.nom)}</span><span class="§-cg">${doseTxt(c)}</span>
<span class="§-cl">${alphaTxt(c)}${S.usage(c)}${stockTxt(c)}${S.autres(c, 26)}</span>
<span class="§-ca">${S.pictos(c.cites.slice(0, 7), 16)}</span>
<span class="§-cs">${scoreTxt(c)}<small>${c.palier}</small></span>
<span class="§-cx">${i46Txt(E, c)} · ${restTxt(c)}</span></span></button>`;
    const avecN = !L.includes(nelson);
    const ligneN = avecN ? `<button type="button" aria-pressed="false" data-cand="${nelson.id}" data-eh="${nelson.k}" class="§-nl" style="--c:${nelson.coul}"><span class="§-nli" ${marques(nelson)}><b data-houblon="${S.esc(nelson.nom)}">${S.esc(nelson.nom)}</b>${alphaTxt(nelson)}${doseTxt(nelson)}${scoreTxt(nelson)} <span class="§-gr">${nelson.palier}</span>${stockTxt(nelson)}${S.autres(nelson, 28)}</span></button>` : '';
    const liste = avecN ? [...L, nelson] : L;
    return { liste, html: `<section data-etat="${E.id}"${E.id === 'b60' ? '' : ' hidden'}>
<header class="§-h">${S.croix(P)}<div><h1>Lequel à la place de Nugget ?</h1>${contexte(E)}</div></header>
<div data-libre="houblon" role="group" aria-label="Le remplaçant" class="§-cds">${R.map(carte).join('')}${ligneN}</div>
<div class="§-bi"><div class="§-bih"><h2>Ma bière ${blocs(liste, (c) => 'avec ' + S.esc(c.nom), E.rep.id, 'span')}</h2>${S.legendeBouton(P)}${S.lentille(P)}</div>${blocs(liste, (c) => `<div class="§-big">${BIERE.map((f) => ligneBiere(E, f, c)).join('')}</div>`, E.rep.id)}</div>
</section>` };
  };
  const V = ['b60', 'wp'].map((id) => ({ E: S.ETATS[id], ...vue(S.ETATS[id]) }));
  const h1 = V[0].html, h2 = V[1].html.split(S.legendeBouton(P)).join(AIDE2);
  const corps = `<main class="§-e">${h1}${h2}</main>${V.map((v) => `<div data-etat="${v.E.id}"${v.E.id === 'b60' ? '' : ' hidden'}>${pied(v.E, v.liste)}</div>`).join('')}`;
  const css = `${CSS_COMMUN}
.§-cds { display:flex; flex-direction:column; gap:6px; }
.§-cd { display:block; width:100%; padding:7px 10px 7px 12px; border-radius:8px; border:1px solid #d9d9d9; border-left:6px solid var(--c); background:#fff; }
.§-cgr { display:grid; grid-template-columns:1fr auto; grid-template-areas:"k k" "n g" "l s" "a s" "x x"; gap:3px 8px; }
.§-nli { display:flex; align-items:center; gap:7px; flex-wrap:wrap; }
.§-cd.on { border-color:var(--c); border-width:2px 2px 2px 6px; background:#f5f5f5; }
.§-ck { grid-area:k; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.03em; color:#333; }
.§-ck .§-gr { text-transform:none; letter-spacing:0; font-weight:400; }
.§-cn { grid-area:n; font-size:20px; font-weight:800; color:var(--c); line-height:1.1; }
.§-cg { grid-area:g; font-size:19px; font-weight:700; text-align:right; }
.§-cl { grid-area:l; display:flex; align-items:center; gap:6px; font-size:13px; flex-wrap:wrap; }
.§-ca { grid-area:a; display:flex; gap:3px; }
.§-cs { grid-area:s; display:flex; flex-direction:column; align-items:flex-end; justify-content:center; font-size:22px; font-weight:700; }
.§-cs small { font-size:12px; font-weight:400; color:#555; }
.§-cx { grid-area:x; font-size:12px; color:#333; }
.§-nl { display:flex; align-items:center; gap:7px; flex-wrap:wrap; width:100%; min-height:36px; padding:4px 10px; border-radius:8px; border:1px dashed #9e9e9e; font-size:13px; }
.§-nl b { color:var(--c); }
.§-nl.on { border-style:solid; border-color:var(--c); background:#f5f5f5; }
.§-bi { display:flex; flex-direction:column; gap:5px; border-top:1px solid #e0e0e0; padding-top:6px; }
.§-bih { display:flex; align-items:center; gap:8px; }
.§-bih h2 { font-size:14px; font-weight:700; margin-right:auto; }
.§-big { display:flex; flex-direction:column; gap:5px; }
`;
  const fiches = [S.NUG, ...new Map(V.flatMap((v) => v.liste).map((c) => [c.nom, c])).values()];
  return S.page(P, { titre: 'sbb5b · Lequel à la place de Nugget ? · trois raisons, passe 2', corps, css, client: CLIENT.split('§-').join(P + '-'), fiches });
}

const CONCEPTS = { sbb7b, sbb5b };
const voulus = process.argv.slice(2);
for (const [id, f] of Object.entries(CONCEPTS)) {
  if (voulus.length && !voulus.includes(id)) continue;
  const html = f();
  fs.mkdirSync(path.join(lot, id), { recursive: true });
  fs.writeFileSync(path.join(lot, id, 'etat.html'), html);
  console.log(id, '·', html.length, 'octets');
}
