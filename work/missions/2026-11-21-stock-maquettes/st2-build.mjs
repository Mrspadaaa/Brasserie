// node st2-build.mjs : écrit les mini maquettes statiques du Stock, tour 1 (st2-<version>-<état>.html).
// Axes D4 (Autres stocks en étagère), D5 (fiche d'un article), D6 (l'inconnu), D7 (les sucres) de
// work/missions/2026-11-21-chasse-stock/VOIES-CORRECTION.md. Aucun <script> dans les maquettes (statiques).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ICI = path.dirname(fileURLToPath(import.meta.url));

// ---------- icônes (lucide) ----------
const P = {
  back: '<path d="m15 18-6-6 6-6"/>', fwd: '<path d="m9 18 6-6-6-6"/>', search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>', star: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2 1.2-6.8-5-4.9 6.9-1z"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  pencil: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>', cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h2l2.7 12.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 7H5.1"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', plus: '<path d="M5 12h14M12 5v14"/>', minus: '<path d="M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>', down: '<path d="m6 9 6 6 6-6"/>', up: '<path d="m18 15-6-6-6 6"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  box: '<path d="M7 16.5 2.5 14v5l4.5 2.5 5-2.5v-5zM17 16.5 12 14v5l5 2.5 4.5-2.5v-5zM12 8 7 5.5v5.5l5 3 5-3V5.5z"/>',
  clip: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.6a1 1 0 0 0-.2-.6l-3.5-4.4A1 1 0 0 0 17.5 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
};
const ic = (n, s = 20, extra = '') => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[n]}</svg>`;
const houblon = (s = 22) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c-3.2 2.2-5 5.4-5 9.2 0 4.2 2 7.9 5 10.8 3-2.9 5-6.6 5-10.8C17 7.4 15.2 4.2 12 2z" fill="#A3C97A" stroke="#567F45" stroke-width="1.6"/><path d="M8.2 8.5Q12 11 15.8 8.5M7.4 12.6Q12 15.4 16.6 12.6M8.6 16.8Q12 19 15.4 16.8" fill="none" stroke="#567F45" stroke-width="1.4"/></svg>`;
const fut = (etat, s = 18) => {
  const f = { plein: '#E0A02E', vide: '#fff', laver: '#86B9E6' }[etat];
  return `<svg width="${s}" height="${Math.round(s * 1.2)}" viewBox="0 0 20 24" aria-hidden="true"><rect x="2" y="2" width="16" height="20" rx="4" fill="${f}" stroke="#555" stroke-width="1.6"/><path d="M2 8h16M2 16h16" stroke="#555" stroke-width="1.4"/></svg>`;
};

// ---------- habillage commun de l'app ----------
const CSS = `
:root{--ink:#111;--txt:#333;--mut:#666;--line:#ddd;--line2:#bfbfbf;--s1:#f5f5f5;--s2:#ebebeb;--stk:#4C6B2A;--ok:#3F6B2E;--rge:#b3261e;--rgec:#f9e4e2;--man:#8A5212;--manc:#f8eedd;
--malt:#A0522D;--hop:#567F45;--lev:#7A5A12;--add:#4F7E9B;--emb:#C87A2C;--net:#2E8B88;--suc:#E3B55D}
*{box-sizing:border-box}html,body{margin:0}
body{width:390px;height:844px;overflow:hidden;position:relative;background:#fff;color:var(--txt);font:16px/1.3 "Source Sans 3","Segoe UI",system-ui,sans-serif}
.mono{font-family:"IBM Plex Mono",ui-monospace,monospace;font-variant-numeric:tabular-nums;letter-spacing:-.4px}
.ic{flex:none;vertical-align:middle}
header.app{height:58px;display:flex;align-items:center;gap:8px;padding:0 12px;border-bottom:1px solid var(--line)}
.logo{width:40px;height:40px;border-radius:10px;background:#1b1b1b;display:grid;place-items:center}
.marque{font-size:18px;font-weight:600;color:var(--ink);flex:1}
.mois{display:flex;align-items:center;border:1.5px solid var(--line2);border-radius:12px;height:40px}
.mois span{padding:0 9px;display:grid;place-items:center;height:100%}
.mois .m{border-left:1.5px solid var(--line2);border-right:1.5px solid var(--line2);font-weight:600;color:var(--ink);padding:0 12px}
.rond{width:40px;height:40px;border-radius:12px;border:1.5px solid var(--line2);display:grid;place-items:center;color:var(--ink)}
.av{display:flex}.av b{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:15px}
.av b:first-child{background:#111;color:#fff}.av b:last-child{background:#e6e6e6;color:#111;margin-left:-8px}
main{padding:8px 12px 0}
.fab{position:absolute;right:12px;bottom:74px;width:62px;height:62px;border-radius:18px;background:#111;color:#fff;display:grid;place-items:center;border:0;box-shadow:0 4px 10px rgba(0,0,0,.25)}
nav.onglets{position:absolute;left:0;right:0;bottom:0;height:64px;border-top:1px solid var(--line);background:#fafafa;display:grid;grid-template-columns:repeat(6,1fr);z-index:5}
nav.onglets a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:14px;color:#333;text-decoration:none;position:relative}
nav.onglets a.on{background:#eef2e8;color:#111;font-weight:600}
nav.onglets a.on::before{content:"";position:absolute;top:0;left:22%;right:22%;height:3px;background:var(--stk)}
nav .t-fin{color:#1F64A3}nav .t-cal{color:#C87A2C}nav .t-bra{color:#A0522D}nav .t-sto{color:var(--stk)}
.bdg{position:absolute;top:4px;right:12px;background:#1F64A3;color:#fff;border-radius:10px;font-size:14px;padding:0 6px;line-height:20px}
.seg{display:flex;background:var(--s2);border-radius:14px;padding:3px;gap:2px}
.seg a{flex:1;text-align:center;font-size:16px;color:#444;padding:9px 0;border-radius:11px;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:4px}
.seg a.on{background:#111;color:#fff;font-weight:600}
.seg.bl a.on{background:#fff;color:#111;box-shadow:0 1px 3px rgba(0,0,0,.15)}
.cherche{display:flex;align-items:center;gap:8px;height:44px;border:1.5px solid var(--line2);border-radius:12px;padding:0 12px;color:#777;font-size:16px;margin-top:8px}
.pills{display:flex;gap:4px;margin-top:6px;flex-wrap:nowrap}
.pills span{border:1.5px solid var(--line2);border-radius:999px;padding:4px 8px;font-size:14px;white-space:nowrap;color:#333}
.pills b{font-family:"IBM Plex Mono",monospace}
.pills .z{color:#999;border-color:#e2e2e2}
.r{color:var(--rge)}.m{color:var(--man)}.g{color:var(--mut)}.v{color:var(--ok)}
`;
const NAV = `<button class="fab" aria-label="Ajouter">${ic('plus', 30)}</button>
<nav class="onglets"><a href="#"><svg class="ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>Bord</a><a href="#"><span class="t-fin"><svg class="ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg></span>Finances</a><a href="#"><span class="t-cal">${ic('cal', 22)}</span>Calendrier</a><a href="#"><span class="t-bra"><svg class="ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 11h1a3 3 0 0 1 0 6h-1"/><path d="M9 12v6M13 12v6"/><path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"/><path d="M5 8c0-3 2-5 6-5s6 2 6 5"/></svg></span>Brassins</a><a class="on" href="#"><span class="t-sto">${ic('box', 22)}</span>Stocks<span class="bdg">24</span></a><a href="#"><svg class="ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>Clients</a></nav>`;
const ENTETE = `<header class="app"><span class="logo"><svg width="24" height="24" viewBox="0 0 24 24"><path d="M5 6h11v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="#F2C14E"/><path d="M16 9h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" fill="none" stroke="#F2C14E" stroke-width="2"/><path d="M5 6c0-2 2-3 5.5-3S16 4 16 6" fill="#fff"/></svg></span><span class="marque">L'Affinée</span><span class="mois"><span>${ic('back', 18)}</span><span class="m">Nov.</span><span>${ic('fwd', 18)}</span></span><span class="rond">${ic('search')}</span><span class="av"><b>G</b><b>A</b></span></header>`;
const FONTS = `<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Source+Sans+3:wght@400;600;700;800&display=swap" rel="stylesheet">`;
function ecrire(nom, titre, css, corps, { app = true } = {}) {
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=390, initial-scale=1"><title>Stock · ${titre} · 21.11</title>${FONTS}<style>${CSS}${css}</style></head><body>${app ? ENTETE : ''}${corps}${app ? NAV : ''}</body></html>`;
  fs.writeFileSync(path.join(ICI, `st2-${nom}.html`), html);
}
// En-tête des Articles selon sa capture 01 (D1 a, son dessin) : Houblons retiré, bascule Étagère retirée, Recompter en onglet.
const ONGLETS = (on = 'Articles') => `<div class="seg">${['Articles', 'Recompter', 'Courses', 'Fûts', 'Matériel'].map((t) => `<a class="${t === on ? 'on' : ''}" href="#">${t}</a>`).join('')}</div>`;
const CHERCHE = `<div class="cherche">${ic('search')}<span>Rechercher : nom, fournisseur…</span></div>`;
const PILLS = `<div class="pills"><span>manque <b class="m">5</b></span><span class="z">bas <b>0</b></span><span>épuisés <b class="r">13</b></span><span class="z">à compter <b>0</b></span><span class="z">DDM <b>0</b></span></div>`;

// ---------- données (exemple réaliste, pas ses données) ----------
const ADD = { g: [['Gypse', 500, 200], ['Chlorure de calcium', 400, null], ['Sel d\'Epsom', 250, null], ['Mousse d\'Irlande', 80, 50]], ml: [['Acide lactique 80 %', 0, 100], ['Acide phosphorique', 350, null]] };
const EMB = { pièces: [['Bouteille 33 cl', 200, 100], ['Capsule 26 mm', 850, 300], ['Étiquette IPA', 0, 100], ['Carton 6 × 33', 40, null]] };
const NET = { L: [['Acide peracétique', 1.5, 2], ['Détergent alcalin', 5, null]], kg: [['Soude caustique', 2, 1]], pièces: [['Gants nitrile', 60, null]] };

// ---------- l'étagère (vocabulaire sy/fA : rangée, colonnes, pots à l'échelle, tirets = seuil, cadre rouge = épuisé) ----------
const MUR_CSS = `
.mur{background:var(--s1);border-radius:12px;padding:2px 8px}
.rg{display:grid;grid-template-columns:70px 1fr;gap:6px;padding:6px 0;border-bottom:1px solid #e0e0de;position:relative}
.rg:last-child{border-bottom:0}
.rg .nm{border-left:4px solid;padding-left:6px;align-self:stretch;display:flex;flex-direction:column;justify-content:center}
.rg .nm b{font-size:16px;color:#111;line-height:1.1}.rg .nm i{font-style:normal;font-size:14px;color:var(--mut)}
.cols{display:flex;gap:10px;align-items:flex-end;min-width:0}
.col{display:flex;flex-direction:column;min-width:0}
.col .h{font-size:14px;font-weight:700;white-space:nowrap}
.pl{display:flex;gap:3px;align-items:flex-end;border-bottom:2px solid;position:relative;padding:0 1px}
.pot{width:13px;border-radius:2px 2px 0 0;position:relative}
.pot.ep{background:#fff!important;border:2px solid var(--rge);border-bottom:0}
.pot.ma{outline:2px solid var(--man);outline-offset:-2px}
.pot .s{position:absolute;left:-2px;right:-2px;border-top:2px dashed #333}
.col .q{font-size:14px;white-space:nowrap}
.pot.vu{box-shadow:0 0 0 3px #111}
`;
function pots(items, H, coul, { vu = '' } = {}) {
  const max = Math.max(...items.map((i) => Math.max(i[1], i[2] ?? 0)), 1);
  return items.map(([n, q, s]) => {
    const h = q === 0 ? 12 : Math.max(4, Math.round((q / max) * H));
    const cl = ['pot', q === 0 ? 'ep' : '', s != null && q > 0 && q < s ? 'ma' : '', n === vu ? 'vu' : ''].join(' ');
    const seuil = s != null ? `<i class="s" style="bottom:${Math.round((s / max) * H) - h}px"></i>` : '';
    return `<span class="${cl}" style="height:${h}px;background:${coul}" title="${n}">${seuil}</span>`;
  }).join('');
}
const col = (titre, items, H, coul, q = '', o = {}) => `<div class="col"><span class="h" style="color:${coul}">${titre}</span><div class="pl" style="height:${H + 2}px;border-color:${coul}">${pots(items, H, coul + 'cc', o)}</div>${q ? `<span class="q mono">${q}</span>` : ''}</div>`;
const rangee = (nom, compte, coul, cols, extra = '') => `<div class="rg"${extra}><div class="nm" style="border-color:${coul}"><b>${nom}</b><i>${compte}</i></div><div class="cols">${cols}</div></div>`;

// =====================================================================================
// D4 · Autres stocks en étagère
// =====================================================================================
const LISTE_CSS = `
.lh{display:flex;align-items:center;gap:8px;margin:10px 0 2px;font-size:18px;font-weight:700;color:#111}
.lh small{font-size:15px;color:var(--mut);font-weight:400}
.li{display:flex;align-items:center;gap:10px;min-height:52px;border-bottom:1px solid #eee;border-left:3px solid;padding-left:8px}
.li .mp{width:10px;height:28px;border:1.5px solid #bbb;border-radius:2px;position:relative;flex:none}
.li .mp i{position:absolute;left:0;right:0;bottom:0}
.li .n{flex:1;font-size:16px;color:#111}.li .n small{display:block;font-size:14px;color:var(--mut)}
.li .q{font-size:17px;font-weight:600}
.li .st{color:#999}
`;
const ligne = (coul, n, sous, q, rempli, cls = '') => `<div class="li" style="border-color:${coul}"><span class="mp" style="${cls === 'r' ? 'border-color:var(--rge)' : ''}"><i style="height:${rempli}%;background:${coul}"></i></span><span class="n">${n}<small class="${cls}">${sous}</small></span><span class="q mono ${cls}">${q}</span><span class="st">${ic('star', 22)}</span></div>`;
const futs = `<span style="display:flex;gap:2px;align-items:flex-end">${[...Array(3)].map(() => fut('plein')).join('')}${[...Array(5)].map(() => fut('vide')).join('')}${[...Array(2)].map(() => fut('laver')).join('')}</span>`;

// D4a · Rayons comme Malts (froide) — la même étagère, une colonne par unité, Fûts et Matériel en une rangée d'icônes.
function d4a(etat) {
  const vu = etat === 'bulle' ? 'Acide lactique 80 %' : '';
  const css = MUR_CSS + LISTE_CSS + `
.bulle{position:absolute;left:150px;top:4px;background:#111;color:#fff;border-radius:10px;padding:6px 10px;font-size:15px;z-index:3;line-height:1.25;box-shadow:0 3px 8px rgba(0,0,0,.3)}
.bulle b{color:#fff}.bulle .r2{color:#ffb4ae}.bulle a{color:#F2C14E;text-decoration:none;font-weight:700}
.leg{display:flex;gap:12px;font-size:14px;color:var(--mut);margin:6px 2px 0;align-items:center}
.leg i{display:inline-block;width:14px;vertical-align:middle;margin-right:3px}
.fr{display:flex;align-items:center;gap:8px;font-size:14px}`;
  const bulle = etat === 'bulle' ? `<div class="bulle"><b>Acide lactique 80 %</b> · <span class="r2">0 ml</span><br>seuil 100 ml · <a>la fiche ›</a></div>` : '';
  const corps = `<main>${ONGLETS()}${CHERCHE}${PILLS}<div class="seg bl" style="margin-top:8px"><a href="#">Ingrédients</a><a class="on" href="#">Autres stocks</a></div>
<div class="mur" style="margin-top:8px">
${rangee('Additifs', '2 / 6', 'var(--add)', col('g', ADD.g, 46, '#4F7E9B', '1,2 kg', { vu }) + col('ml', ADD.ml, 46, '#4F7E9B', '350 ml', { vu }), ` style="position:relative"`).replace('</div></div>', `</div>${bulle}</div>`)}
${rangee('Emballage', '1 / 4', 'var(--emb)', col('pièces', EMB['pièces'], 46, '#C87A2C', 'jusqu\'à 850'))}
${rangee('Nettoyage', '1 / 4', 'var(--net)', col('L', NET.L, 40, '#2E8B88', '6,5 L') + col('kg', NET.kg, 40, '#2E8B88', '2 kg') + col('pièces', NET['pièces'], 40, '#2E8B88', '60'))}
<div class="rg"><div class="nm" style="border-color:#777"><b>Fûts</b><i>10 ›</i></div><div class="fr">${futs}<span><b>3</b> pleins · <span style="color:#2F5F7D"><b>2</b> à laver</span></span></div></div>
<div class="rg"><div class="nm" style="border-color:#777"><b>Matériel</b><i>1 ›</i></div><div class="fr g">rien à signaler</div></div>
</div>
<div class="leg"><span><i style="border-top:2px dashed #333"></i>seuil</span><span><i style="height:12px;border:2px solid var(--rge);border-bottom:0"></i>épuisé</span><span><i style="height:12px;outline:2px solid var(--man);outline-offset:-2px;background:#4F7E9Bcc"></i>sous le seuil</span></div>
<div class="lh">Additifs <small>6 · par quantité</small></div>
${ligne('#4F7E9B', 'Acide lactique 80 %', 'épuisé · seuil 100 ml', '0 ml', 0, 'r')}
</main>`;
  ecrire(`d4a-${etat}`, `D4a ${etat}`, css, corps);
}

// D4b · Objets sur la planche (tiède) — chaque article dessiné comme il se range : sachet, flacon, bidon, seau, bouteille, carton.
const FORMES = {
  sachet: 'M5 6h22l-2 34H7z', flacon: 'M12 3h8v7l4 5v25H8V15l4-5z', bidon: 'M5 10h6l2-6h8v6h6v30H5z', seau: 'M4 12h24l-3 28H7z',
  bouteille: 'M13 2h6v9l3 5v24H10V16l3-5z', capsule: 'M4 22a12 12 0 0 1 24 0v14H4z', etiquette: 'M4 10h24v26H4z', carton: 'M3 14l13-6 13 6v26H3z', gants: 'M8 40V18l-3-8 4-1 3 7V4h4v12V2h4v14V5h4v15l3-5 3 2-6 12v11z',
};
function objet(forme, q, s, max, coul, id, vu = false) {
  const H = 40, ratio = q / max, y = H - ratio * 38, ys = s != null ? H - (s / max) * 38 : null, ep = q === 0;
  return `<svg width="34" height="44" viewBox="0 0 32 42" aria-hidden="true"><defs><clipPath id="${id}"><path d="${FORMES[forme]}"/></clipPath></defs>${vu ? `<path d="${FORMES[forme]}" fill="none" stroke="#111" stroke-width="5"/>` : ''}<path d="${FORMES[forme]}" fill="#fff"/><rect x="0" y="${y}" width="32" height="${H}" fill="${coul}" clip-path="url(#${id})"/>${ys != null ? `<line x1="0" x2="32" y1="${ys}" y2="${ys}" stroke="#222" stroke-width="2" stroke-dasharray="3 2"/>` : ''}<path d="${FORMES[forme]}" fill="none" stroke="${ep ? '#b3261e' : (s != null && q < s ? '#8A5212' : '#555')}" stroke-width="${ep || (s != null && q < s) ? 2.6 : 1.6}"/></svg>`;
}
function d4b(etat) {
  const css = `
.etg{margin-top:8px}
.ray{margin-bottom:4px}
.ray .t{display:flex;align-items:baseline;gap:8px;font-size:17px;font-weight:700;color:#111}
.ray .t small{font-size:14px;font-weight:400;color:var(--mut)}
.ray .t .al{margin-left:auto;font-size:14px;font-weight:600}
.planche{display:flex;align-items:flex-end;gap:2px;border-bottom:5px solid #b89a6e;border-radius:0 0 3px 3px;padding:0 2px;background:linear-gradient(#fff,#f7f3ec)}
.grp{display:flex;flex-direction:column;align-items:stretch;border-left:1.5px dashed #ccc;padding-left:3px}
.grp:first-child{border-left:0;padding-left:0}
.grp .u{font-size:14px;font-weight:700;text-align:left}
.grp .ob{display:flex;gap:1px}
.o{display:flex;flex-direction:column;align-items:center;width:52px}
.o .nm{font-size:14px;line-height:1.05;color:#222;text-align:center;height:30px;display:flex;align-items:flex-end;justify-content:center;overflow:hidden}
.o .q{font-size:14px;margin-top:1px}
.bulle{position:absolute;z-index:4;background:#111;color:#fff;border-radius:12px;padding:8px 10px;font-size:15px;width:226px;box-shadow:0 4px 10px rgba(0,0,0,.3)}
.bulle .ac{display:flex;gap:6px;margin-top:6px}.bulle .ac span{flex:1;display:flex;align-items:center;justify-content:center;gap:4px;min-height:40px;border-radius:9px;background:#F2C14E;color:#12100E;font-weight:700}
.bulle .ac span+span{background:#2c2c2a;color:#fff}`;
  let k = 0;
  const grp = (u, items, forme, coul, vu) => {
    const max = Math.max(...items.map((i) => Math.max(i[1], i[2] ?? 0)));
    return `<div class="grp"><span class="u" style="color:${coul}">${u}</span><div class="ob">${items.map(([n, q, s], i) => {
      const f = Array.isArray(forme) ? forme[i] : forme;
      const court = n.replace('Chlorure de calcium', 'Chlorure Ca').replace('Acide lactique 80 %', 'Acide lactique').replace('Acide phosphorique', 'Acide phospho.').replace('Acide peracétique', 'Acide peracét.').replace('Détergent alcalin', 'Détergent').replace('Soude caustique', 'Soude');
      const cl = q === 0 ? 'r' : s != null && q < s ? 'm' : '';
      return `<div class="o"><span class="nm">${court}</span>${objet(f, q, s, max, coul, 'c' + k++, vu === n)}<span class="q mono ${cl}">${String(q).replace('.', ',')}</span></div>`;
    }).join('')}</div></div>`;
  };
  const vu = etat === 'bulle' ? 'Étiquette IPA' : '';
  const corps = `<main>${ONGLETS()}${CHERCHE}<div class="seg bl" style="margin-top:8px"><a href="#">Ingrédients</a><a class="on" href="#">Autres stocks</a></div>
<div class="etg" style="position:relative">
<div class="ray"><div class="t">Additifs <small>6</small><span class="al"><span class="r">1 épuisé</span> · <span class="m">0 bas</span></span></div><div class="planche">${grp('g', ADD.g, 'sachet', '#4F7E9B')}${grp('ml', ADD.ml, 'flacon', '#4F7E9B')}</div></div>
<div class="ray"><div class="t">Emballage <small>4</small><span class="al"><span class="r">1 épuisé</span></span></div><div class="planche">${grp('pièces', EMB['pièces'], ['bouteille', 'capsule', 'etiquette', 'carton'], '#C87A2C', vu)}</div></div>
<div class="ray"><div class="t">Nettoyage <small>4</small><span class="al m">1 sous le seuil</span></div><div class="planche">${grp('L', NET.L, 'bidon', '#2E8B88')}${grp('kg', NET.kg, 'seau', '#2E8B88')}${grp('pièces', NET['pièces'], 'gants', '#2E8B88')}</div></div>
${etat === 'bulle' ? `<div class="bulle" style="left:118px;top:160px"><b>Étiquette IPA</b> · <span style="color:#ffb4ae">0 pièce</span><br>seuil 100 · dernier achat 02.10<div class="ac"><span>${ic('cart', 18)}Commander</span><span>Fiche ›</span></div></div>` : ''}
</div>
<div style="display:flex;gap:10px;align-items:center;margin-top:6px;font-size:14px;color:var(--mut)"><span style="display:flex;gap:2px">${futs}</span><span>Fûts 10 ›</span></div>
</main>`;
  ecrire(`d4b-${etat}`, `D4b ${etat}`, css, corps);
}

// D4c · Un seul mur (chaude) — plus de bascule Ingrédients / Autres : tout le stock sur une étagère, le nom du rayon filtre.
const MALTS = { Base: [['Pilsner', 25, 10], ['Pale Ale', 9, 5], ['Munich', 4, null]], Caramel: [['Caramünch II', 1.6, 1]], Torréfiés: [['Chocolat', 1.5, null], ['Röstgerste', 0, 0.5]], Spéciaux: [['Blé', 5, null], ['Flocons d\'avoine', 2, 2.5], ['Dextrose', 5, null], ['Sucre de resucrage', 1, null]] };
const HOPS = { Hazy: [['Citra', 485, 250], ['Mosaic', 0, 100], ['Galaxy', 60, 100], ['Cryo Citra', 25, null]], 'W. Coast': [['Simcoe', 0, 100]], Pale: [['Saaz', 225, 100], ['Nelson Sauvin', 0, null]], Lager: [['Hallertau', 150, 100]] };
const LEVS = { IPA: [['US-05', 8, 2], ['Verdant', 1, 2]], Anglaise: [['S-04', 2, 2]], Lager: [['W-34/70', 0, 2]], Autres: [['BE-256', 3, null]] };
function d4c(etat) {
  const filtre = etat === 'filtre';
  const css = MUR_CSS + LISTE_CSS + `
.mur .rg{padding:4px 0}.mur .rg .nm b{font-size:16px}
.sep{font-size:14px;color:var(--mut);padding:4px 0 2px;border-bottom:1px solid #e0e0de;display:flex;align-items:center;gap:6px}
.sep::before,.sep::after{content:"";flex:1;border-top:1.5px dashed #c9c9c5}
.eteint{opacity:.28}
.choisi .nm{background:#fff;border-radius:0 8px 8px 0;box-shadow:0 0 0 2px #111}
.fil{display:flex;align-items:center;gap:8px;font-size:15px;margin:8px 0 0}
.fil b{display:inline-flex;align-items:center;gap:4px;background:#111;color:#fff;border-radius:999px;padding:4px 10px}`;
  const cls = (n) => (filtre ? (n === 'Emballage' ? ' class="rg choisi"' : ' class="rg eteint"') : '');
  const R = (nom, compte, coul, cols) => rangee(nom, compte, coul, cols).replace('<div class="rg"', `<div${cls(nom) || ' class="rg"'}`);
  const C = (o, H, coul) => Object.entries(o).map(([t, it]) => col(t, it, H, coul)).join('');
  const corps = `<main>${ONGLETS()}${CHERCHE}${PILLS}
<div class="mur" style="margin-top:8px">
${R('Malts', '2 / 10', 'var(--malt)', C(MALTS, 26, '#A0522D'))}
${R('Houblons', '3 / 9', 'var(--hop)', C(HOPS, 26, '#567F45'))}
${R('Levures', '2 / 5', 'var(--lev)', C(LEVS, 22, '#9C7020'))}
<div class="sep${filtre ? ' eteint' : ''}">autres stocks</div>
${R('Additifs', '1 / 6', 'var(--add)', C(ADD, 24, '#4F7E9B'))}
${R('Emballage', '1 / 4', 'var(--emb)', C(EMB, 24, '#C87A2C'))}
${R('Nettoyage', '1 / 4', 'var(--net)', C(NET, 22, '#2E8B88'))}
</div>
${filtre ? `<div class="fil">Rayon <b>Emballage ${ic('x', 16)}</b><span class="g">4 articles</span></div>
${ligne('#C87A2C', 'Étiquette IPA', 'épuisé · seuil 100', '0', 0, 'r')}
${ligne('#C87A2C', 'Bouteille 33 cl', 'seuil 100', '200', 40)}` : `<div class="lh">Tout le stock <small>39 articles · le nom d'un rayon filtre</small></div>
${ligne('#A0522D', 'Röstgerste', 'épuisé · seuil 0,5 kg', '0 kg', 0, 'r')}`}
</main>`;
  ecrire(`d4c-${etat}`, `D4c ${etat}`, css, corps);
}

// =====================================================================================
// D5 · La fiche d'un article (sa capture 02 : Cryo Hops Citra 25g)
// =====================================================================================
const FICHE_CSS = `
.barre{height:52px;display:flex;align-items:center;gap:8px;padding:0 10px;border-bottom:1px solid var(--line);font-size:17px;color:#333}
.barre .sp{flex:1}
.tete{padding:8px 14px 0}
.tete h1{margin:0;font-size:25px;line-height:1.1;color:#111;font-weight:800;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.alpha{font-size:15px;font-weight:700;color:#3F6B2E;background:#e7efdc;border-radius:999px;padding:3px 10px;font-family:"IBM Plex Mono",monospace}
.four{display:flex;align-items:center;gap:6px;font-size:16px;color:#444;margin-top:4px}
.four a{color:#1F64A3;text-decoration:none;border-bottom:1.5px solid #a9c3de}
.pied{position:absolute;left:0;right:0;bottom:0;display:flex;gap:10px;padding:10px 12px 14px;border-top:1px solid var(--line);background:#fff}
.pied span{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;min-height:52px;border-radius:12px;font-size:17px;font-weight:700}
.pied .cmd{border:1.5px solid var(--line2);color:#111}
.pied .enr{background:#111;color:#fff}
.pied .enr.off{background:#e6e6e4;color:#8a8a86}
.chip{display:inline-flex;align-items:center;gap:4px;border:1.5px solid var(--line2);border-radius:999px;padding:6px 12px;font-size:15px;min-height:36px;color:#333}
.chip.on{background:#111;border-color:#111;color:#fff}
.chip.off{color:#aaa;border-color:#e2e2e2}
`;
const BARRE = `<div class="barre">${ic('back', 24)}<span style="color:#4C6B2A">${ic('box', 20)}</span><span>Stock · Houblons</span><span class="sp"></span>${ic('more', 24)}</div>`;
const TETE = `<div class="tete"><h1>Cryo Hops Citra 25g <span class="alpha">α 24,8 %</span></h1><div class="four">${houblon(18)}<span>Houblon ·</span><a>Brau- und Rauchshop GmbH</a>${ic('fwd', 16)}</div></div>`;
const PIED = (on, txt = 'Enregistrer') => `<div class="pied"><span class="cmd">${ic('cart', 20)}Commander</span><span class="enr${on ? '' : ' off'}">${txt}</span></div>`;

// D5a · Pastilles chiffrées (froide, modèle v02 du Calendrier)
function d5a(etat) {
  const css = FICHE_CSS + `
.tuiles{display:grid;grid-template-columns:1.25fr 1fr 1fr 1fr;gap:6px;padding:10px 12px 0}
.tu{background:var(--s1);border-radius:14px;min-height:84px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;text-align:center;padding:4px}
.tu .gros{font-size:28px;font-weight:800;color:#111;line-height:1}
.tu .gros small{font-size:16px;font-weight:700}
.tu .p{font-size:14px;color:var(--mut);line-height:1.1}
.tu.vide{background:#fff;border:2px dashed #b9b9b4}
.tu.vide .gros{color:#9a9a96}
.jauge{width:80%;height:6px;border-radius:3px;background:#e2e2df;margin-top:3px;position:relative}.jauge i{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:#6E9B5B}
.geste{margin:10px 12px 0;border:1.5px solid var(--line);border-radius:14px;padding:8px 10px}
.geste .l{display:flex;align-items:center;gap:8px;min-height:50px}
.geste .l+.l{border-top:1px solid #eee}
.geste .lb{width:58px;font-size:16px;font-weight:700;color:#111}
.pas{display:flex;align-items:center;border:1.5px solid var(--line2);border-radius:12px;overflow:hidden}
.pas span{width:44px;height:42px;display:grid;place-items:center;color:#111}
.pas b{min-width:84px;text-align:center;font-size:19px;border-left:1.5px solid var(--line2);border-right:1.5px solid var(--line2);height:42px;display:grid;place-items:center}
.pas b.q{color:#9a9a96;font-weight:600}
.geste .ap{font-size:14px;color:var(--mut);flex:1;text-align:right;line-height:1.15}
.motifs{display:flex;gap:6px;padding:6px 0 2px}
.bouge{margin:10px 12px 0}
.bouge .t{display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:#111}
.bouge .t a{font-size:15px;font-weight:600;color:#1F64A3}
.mv{display:flex;align-items:center;gap:8px;min-height:44px;border-bottom:1px solid #eee;font-size:15px}
.mv .d{width:44px;color:var(--mut)}.mv .n{flex:1;color:#222}.mv .q{font-weight:700}
.mod{display:flex;align-items:center;gap:10px;margin:10px 12px 0;min-height:52px;border-radius:12px;background:var(--s1);padding:0 12px;font-size:16px;color:#111}
.mod small{flex:1;font-size:14px;color:var(--mut);text-align:right}
.form{margin:8px 12px 0;background:var(--s1);border-radius:14px;padding:10px}
.form .t{display:flex;align-items:center;gap:8px;font-size:17px;font-weight:700;color:#111;margin-bottom:6px}
.form .t span{flex:1}
.ch{display:flex;flex-direction:column;gap:2px;font-size:14px;color:var(--mut);min-width:0}
.ch b{display:flex;align-items:center;height:46px;border:1.5px solid var(--line2);border-radius:10px;background:#fff;padding:0 10px;font-size:17px;font-weight:400;color:#111;justify-content:space-between;white-space:nowrap;overflow:hidden}
.lr{display:grid;gap:8px;margin-top:8px}
.facture{font-size:14px;color:var(--mut);margin-top:3px}`;
  const modif = etat === 'modif';
  const haut = modif ? '' : `<div class="tuiles">
  <div class="tu"><span class="gros">1 <small>Pck</small></span><span class="p">25 g</span><span class="jauge"><i style="width:20%"></i></span></div>
  <div class="tu vide"><span class="gros">—</span><span class="p">seuil</span></div>
  <div class="tu"><span style="color:#C87A2C">${ic('cal', 22)}</span><span class="gros" style="font-size:22px">0</span><span class="p">besoin</span></div>
  <div class="tu"><span class="gros" style="font-size:20px">7,50</span><span class="p">CHF / Pck<br>27.04</span></div>
</div>`;
  const geste = `<div class="geste">
  <div class="l"><span class="lb">Stock</span><span class="pas"><span>${ic('minus', 22)}</span><b class="mono">1</b><span>${ic('plus', 22)}</span></span><span class="ap">Pck<br>il en reste</span></div>
  <div class="l"><span class="lb">Seuil</span><span class="pas"><span>${ic('minus', 22)}</span><b class="mono q">aucun</b><span>${ic('plus', 22)}</span></span><span class="ap">alerte<br>sous ce compte</span></div>
</div>`;
  const bouge = `<div class="bouge"><div class="t"><span>Ce qui a bougé</span><a>Tout voir ›</a></div>
  <div class="mv"><span class="d mono">14.11</span><span class="n">Achat annulé</span><span class="g mono">2 → 1</span><span class="q mono r" style="width:28px;text-align:right">−1</span></div>
  <div class="mv"><span class="d mono">27.04</span><span class="n">2 achats · ${ic('receipt', 16)} factures</span><span class="g mono">0 → 2</span><span class="q mono v" style="width:28px;text-align:right">+2</span></div></div>`;
  const ferme = `<div class="mod">${ic('pencil', 20)}<span>Modifier la fiche</span><small>nom · unité · α</small>${ic('down', 20)}</div>`;
  const ouvert = `<div class="form"><div class="t">${ic('pencil', 20)}<span>Modifier la fiche</span>${ic('up', 20)}</div>
  <label class="ch">Nom<b>Cryo Hops Citra 25g</b></label><div class="facture">Sur la facture : Cryo Hops Citra 24.8% 25g</div>
  <div class="lr" style="grid-template-columns:1.3fr .8fr .9fr"><label class="ch">Catégorie<b>Houblon ${ic('down', 18)}</b></label><label class="ch">Unité<b>Pck ${ic('down', 18)}</b></label><label class="ch">α %<b class="mono">24,8</b></label></div>
  <div class="lr"><label class="ch">Fournisseur<b>Brau- und Rauchshop GmbH ${ic('down', 18)}</b></label></div></div>`;
  const corps = `${BARRE}${TETE}${haut}${modif ? '' : geste}${modif ? '' : bouge}${modif ? ouvert : ferme}${PIED(modif, modif ? 'Enregistrer la fiche' : 'Enregistrer')}`;
  ecrire(`d5a-${etat}`, `D5a ${etat}`, css, corps, { app: false });
}

// D5b · Une règle à tirer (tiède) : le stock est une barre, le seuil un tiret ; un geste règle les deux.
function d5b(etat) {
  const g = etat === 'geste';
  const css = FICHE_CSS + `
.regle{margin:14px 12px 0;padding:10px 12px 8px;border-radius:16px;background:var(--s1)}
.regle .gros{display:flex;align-items:baseline;gap:8px;font-size:15px;color:var(--mut)}
.regle .gros b{font-size:40px;color:#111;font-weight:800;line-height:1}
.regle .gros .dt{margin-left:auto;font-size:18px;font-weight:700;color:#3F6B2E}
.piste{position:relative;height:58px;margin:8px 4px 0}
.piste .fond{position:absolute;left:0;right:0;top:18px;height:22px;border-radius:11px;background:#e1e1dd}
.piste .plein{position:absolute;left:0;top:18px;height:22px;border-radius:11px;background:#6E9B5B}
.piste .poig{position:absolute;top:8px;width:42px;height:42px;margin-left:-21px;border-radius:50%;background:#fff;border:3px solid #3F6B2E;box-shadow:0 2px 6px rgba(0,0,0,.25);display:grid;place-items:center;font-weight:800;font-size:17px;color:#111}
.piste .tiret{position:absolute;top:0;height:58px;width:0;border-left:3px dashed #222}
.piste .tiret b{position:absolute;top:-2px;left:6px;font-size:14px;white-space:nowrap;color:#222}
.piste .seuil0{position:absolute;top:2px;left:0;font-size:14px;color:var(--mut);display:flex;gap:4px;align-items:center}
.grad{display:flex;justify-content:space-between;font-size:14px;color:var(--mut);margin:0 4px}
.aide{font-size:14px;color:var(--mut);margin-top:6px;display:flex;align-items:center;gap:6px}
.motifs{display:flex;gap:6px;margin:10px 12px 0;align-items:center}
.motifs .lb{font-size:15px;color:var(--mut);margin-right:2px}
.frise{margin:12px 12px 0}
.frise .t{display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:#111}
.frise .t a{font-size:15px;color:#1F64A3;font-weight:600}
.frise svg{display:block;margin-top:4px}
.id{display:flex;flex-wrap:wrap;gap:6px;margin:12px 12px 0;align-items:center}
.id .chip{background:#fff}
.id .md{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 12px;border-radius:999px;background:#111;color:#fff;font-weight:700;font-size:15px}`;
  const max = 4, x = (v) => `${(v / max) * 100}%`;
  const piste = `<div class="piste"><div class="fond"></div><div class="plein" style="width:${x(g ? 3 : 1)}"></div>
${g ? `<div class="tiret" style="left:${x(2)}"><b>seuil 2</b></div>` : `<div class="seuil0">${ic('minus', 14)}seuil : tire depuis ici</div>`}
<div class="poig mono" style="left:${x(g ? 3 : 1)}">${g ? 3 : 1}</div></div>
<div class="grad mono"><span>0</span><span>1</span><span>2</span><span>3</span><span>4 Pck</span></div>`;
  const frise = `<svg width="366" height="70" viewBox="0 0 366 70" aria-hidden="true"><line x1="6" x2="360" y1="56" y2="56" stroke="#ccc"/><path d="M6 56H40V40H58V24H300V40H360" fill="none" stroke="#567F45" stroke-width="2.5"/>
<circle cx="40" cy="40" r="4" fill="#567F45"/><circle cx="58" cy="24" r="4" fill="#567F45"/><circle cx="300" cy="40" r="4" fill="#b3261e"/>
<text x="20" y="34" font-size="14" fill="#3F6B2E" font-family="IBM Plex Mono">+1+1</text><text x="290" y="18" font-size="14" fill="#b3261e" font-family="IBM Plex Mono">−1</text>
<text x="32" y="70" font-size="14" fill="#666">27.04</text><text x="268" y="70" font-size="14" fill="#666">14.11 annulé</text></svg>`;
  const corps = `${BARRE}${TETE}<div class="regle"><div class="gros"><b class="mono">${g ? 3 : 1}</b>Pck · ${g ? 75 : 25} g${g ? '<span class="dt mono">+2</span>' : ''}</div>${piste}
<div class="aide">${ic('hand', 16)}tire la barre : le stock · tire le tiret : le seuil</div></div>
<div class="motifs"><span class="lb">Pourquoi</span><span class="chip ${g ? 'on' : 'off'}">${g ? ic('check', 16) : ''}Compté</span><span class="chip ${g ? '' : 'off'}">Perte</span><span class="chip ${g ? '' : 'off'}">Autre</span></div>
<div class="frise"><div class="t"><span>Ce qui a bougé</span><a>3 mouvements ›</a></div>${frise}</div>
<div class="id"><span class="chip">${houblon(16)}Houblon</span><span class="chip">Pck</span><span class="chip mono">7,50 CHF · 27.04</span><span class="md">${ic('pencil', 16)}Modifier</span></div>
${PIED(g, g ? 'Enregistrer · +2, seuil 2' : 'Enregistrer')}`;
  ecrire(`d5b-${etat}`, `D5b ${etat}`, css, corps, { app: false });
}

// D5c · Les paquets (chaude) : le stock se voit en paquets, le seuil en paquets fantômes ; la fiche se modifie dans une feuille.
const paquet = (etat = 'plein', s = 60) => {
  const st = { plein: 'fill="#A3C97A" stroke="#3F6B2E"', fantome: 'fill="#fff" stroke="#9a9a96" stroke-dasharray="4 3"', ajout: 'fill="#fff" stroke="#c4c4c0" stroke-dasharray="4 3"' }[etat];
  return `<svg width="${s}" height="${Math.round(s * 1.25)}" viewBox="0 0 48 60" aria-hidden="true"><path d="M6 8h36l-3 48H9z" ${st} stroke-width="2.4" stroke-linejoin="round"/><path d="M6 8l4-5h28l4 5" fill="none" stroke="${etat === 'plein' ? '#3F6B2E' : '#b0b0ac'}" stroke-width="2"/>${etat === 'plein' ? '<rect x="13" y="22" width="22" height="16" rx="3" fill="#fff"/><text x="24" y="35" text-anchor="middle" font-size="14" font-weight="700" fill="#3F6B2E" font-family="IBM Plex Mono">25g</text>' : etat === 'ajout' ? '<path d="M24 24v16M16 32h16" stroke="#9a9a96" stroke-width="2.6" stroke-linecap="round"/>' : ''}</svg>`;
};
function d5c(etat) {
  const f = etat === 'feuille';
  const css = FICHE_CSS + `
.rayon{margin:12px 12px 0;padding:12px 10px 0;border-radius:16px;background:linear-gradient(#fbfbf9,#f2f2ee);position:relative}
.pq{display:flex;align-items:flex-end;gap:8px;padding:0 4px;border-bottom:6px solid #b89a6e;min-height:84px;position:relative}
.pq .sl{position:absolute;top:-4px;bottom:0;border-left:3px dashed #222}
.pq .sl b{position:absolute;top:-6px;left:5px;font-size:14px;white-space:nowrap}
.legende{display:flex;justify-content:space-between;font-size:14px;color:var(--mut);padding:6px 2px 8px}
.compte{display:flex;align-items:baseline;gap:8px;margin:0 2px 8px}
.compte b{font-size:34px;color:#111;font-weight:800}.compte span{font-size:16px;color:var(--mut)}
.lignes{margin:8px 12px 0}
.ln{display:flex;align-items:center;gap:10px;min-height:46px;border-bottom:1px solid #eee;font-size:16px;color:#222}
.ln .g2{margin-left:auto;font-size:15px;color:var(--mut)}
.pastil{display:flex;gap:6px;margin:10px 12px 0}
.pastil span{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:56px;border-radius:12px;background:var(--s1);font-size:14px;color:var(--mut)}
.pastil b{font-size:18px;color:#111}
.ombre{position:absolute;inset:0;background:rgba(0,0,0,.42);z-index:6}
.feuille{position:absolute;left:0;right:0;bottom:0;z-index:7;background:#fff;border-radius:20px 20px 0 0;padding:8px 14px 14px;box-shadow:0 -6px 18px rgba(0,0,0,.2)}
.feuille .poi{width:44px;height:5px;border-radius:3px;background:#ccc;margin:0 auto 8px}
.feuille .t{display:flex;align-items:center;gap:8px;font-size:19px;font-weight:800;color:#111}
.feuille .t span{flex:1}
.ch{display:flex;flex-direction:column;gap:2px;font-size:14px;color:var(--mut);min-width:0}
.ch b{display:flex;align-items:center;height:48px;border:1.5px solid var(--line2);border-radius:10px;background:#fff;padding:0 10px;font-size:17px;font-weight:400;color:#111;justify-content:space-between;white-space:nowrap;overflow:hidden}
.lr{display:grid;gap:8px;margin-top:8px}
.feuille .ok{display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:12px;background:#111;color:#fff;font-weight:700;font-size:17px;margin-top:12px}`;
  const corps = `${BARRE}${TETE}
<div class="rayon"><div class="compte"><b class="mono">1</b><span>paquet de 25 g · touche un paquet : −1, le pointillé : +1</span></div>
<div class="pq">${paquet('plein')}${paquet('ajout')}<span style="flex:1"></span><span class="sl" style="left:146px"><b>seuil ›</b></span></div>
<div class="legende"><span>en stock</span><span>tire le tiret pour un seuil</span></div></div>
<div class="pastil"><span><b>0</b>besoin</span><span><b class="mono">7,50</b>CHF / Pck</span><span><b class="mono">27.04</b>entrée</span></div>
<div class="lignes"><div class="ln"><span class="r mono">−1</span>Achat annulé<span class="g2 mono">14.11</span></div><div class="ln"><span class="v mono">+2</span>2 achats ${ic('receipt', 16)}<span class="g2 mono">27.04</span></div>
<div class="ln" style="font-weight:700">${ic('pencil', 20)}Modifier la fiche<span class="g2">${ic('fwd', 18)}</span></div></div>
${PIED(false)}
${f ? `<div class="ombre"></div><div class="feuille"><div class="poi"></div><div class="t"><span>Modifier la fiche</span>${ic('x', 24)}</div>
<div class="lr"><label class="ch">Nom<b>Cryo Hops Citra 25g</b></label></div><div style="font-size:14px;color:var(--mut);margin-top:2px">Sur la facture : Cryo Hops Citra 24.8% 25g</div>
<div class="lr" style="grid-template-columns:1.3fr .8fr .9fr"><label class="ch">Catégorie<b>Houblon ${ic('down', 18)}</b></label><label class="ch">Unité<b>Pck ${ic('down', 18)}</b></label><label class="ch">α %<b class="mono">24,8</b></label></div>
<div class="lr"><label class="ch">Fournisseur<b>Brau- und Rauchshop GmbH ${ic('down', 18)}</b></label></div>
<div class="ok">Enregistrer la fiche</div></div>` : ''}`;
  ecrire(`d5c-${etat}`, `D5c ${etat}`, css, corps, { app: false });
}

// =====================================================================================
// D6 · L'inconnu (EBC non connu ; les barres ▂▄▆ de Recompter)
// =====================================================================================
const MALTS_R = [['Pilsner', 'Weyermann', 3.5, '25', 'kg', 3], ['Pale Ale', 'Weyermann', 6, '9', 'kg', 2], ['Munich', 'Château', 15, '4', 'kg', 1], ['Weizenmalz hell', 'Brau-Shop', null, '5', 'kg', 2], ['Caramünch II', 'Weyermann', 120, '1,6', 'kg', 2], ['Röstgerste', 'Brau-Shop', null, '0', 'kg', 0], ['Flocons d\'avoine', 'Brau-Shop', null, '2', 'kg', 1]];
const ebcCoul = (e) => (e == null ? null : e < 5 ? '#F2C14E' : e < 10 ? '#E0A02E' : e < 30 ? '#C87A2C' : e < 200 ? '#A0522D' : '#3B1F14');
const RCSS = `
.tuil{display:flex;gap:6px;margin-top:8px}
.tuil span{flex:1;border-radius:10px;background:var(--s1);padding:6px 8px;font-size:14px;color:var(--mut);border-left:4px solid}
.tuil b{display:block;font-size:16px;color:#111}
.rh{display:flex;align-items:center;gap:8px;margin:10px 0 2px;font-size:18px;font-weight:700;color:#111}
.rh small{font-size:15px;font-weight:400;color:var(--mut)}
.rl{display:flex;align-items:center;gap:8px;min-height:54px;border-bottom:1px solid #eee}
.rl .nm{flex:1;min-width:0;font-size:16px;color:#111;line-height:1.15}.rl .nm small{display:block;font-size:14px;color:var(--mut)}
.chp{display:flex;align-items:center;gap:4px;border:1.5px solid var(--line2);border-radius:10px;height:42px;padding:0 8px;font-size:17px;min-width:84px;justify-content:flex-end}
.chp small{font-size:14px;color:var(--mut)}
.ck{width:44px;height:42px;border-radius:10px;border:1.5px solid var(--line2);display:grid;place-items:center;color:#bbb}
.sw{width:22px;height:22px;border-radius:6px;flex:none;border:1px solid rgba(0,0,0,.15)}
.sw.u{background:repeating-linear-gradient(135deg,#e4e4e0 0 4px,#fff 4px 8px);border:1.5px dashed #9a9a96}
`;
const TUILES = `<div class="tuil"><span style="border-color:#A0522D"><b>Malts</b>0 / 7</span><span style="border-color:#567F45"><b>Houblons</b>0 / 9</span><span style="border-color:#9C7020"><b>Levures</b>0 / 5</span></div>`;
function d6(v) {
  let css = RCSS, lignes = '', tete = '';
  if (v === 'a') { // Tiret : la colonne EBC garde sa place ; l'inconnu = « — », plus de barres.
    css += `.ebc{width:62px;display:flex;align-items:center;gap:5px;font-size:14px;color:#444}.ebc .mono{font-size:15px}`;
    lignes = MALTS_R.map(([n, f, e, q, u]) => `<div class="rl"><span class="ebc"><i class="sw${e == null ? ' u' : ''}" style="${e == null ? '' : `background:${ebcCoul(e)}`}"></i><span class="mono ${e == null ? 'g' : ''}">${e == null ? '—' : String(e).replace('.', ',')}</span></span><span class="nm">${n}<small>${f}</small></span><span class="chp mono ${q === '0' ? 'r' : ''}">${q}<small>${u}</small></span><span class="ck">${ic('check', 22)}</span></div>`).join('');
    tete = `<div class="rh">Malts <small>7 · EBC à gauche</small></div>`;
  } else if (v === 'b') { // Pastille seule : couleur du grain, sans mot ; l'inconnu = rond pointillé « ? » ; le niveau = le pot de l'étagère.
    css += `.sw{border-radius:50%;width:26px;height:26px}.sw.u{display:grid;place-items:center;font-size:14px;font-weight:700;color:#777;background:#fff}
.pt{width:12px;height:30px;border:1.5px solid #9a9a96;border-radius:2px;position:relative;flex:none}.pt i{position:absolute;left:0;right:0;bottom:0;background:#A0522Dcc}
.pt.ep{border:2px solid var(--rge)}`;
    lignes = MALTS_R.map(([n, f, e, q, u, lv]) => `<div class="rl"><i class="sw${e == null ? ' u' : ''}" style="${e == null ? '' : `background:${ebcCoul(e)}`}">${e == null ? '?' : ''}</i><span class="nm">${n}<small>${f}${e != null ? ` · ${String(e).replace('.', ',')} EBC` : ''}</small></span><span class="pt${lv === 0 ? ' ep' : ''}"><i style="height:${[0, 22, 55, 100][lv]}%"></i></span><span class="chp mono ${q === '0' ? 'r' : ''}">${q}<small>${u}</small></span><span class="ck">${ic('check', 22)}</span></div>`).join('');
    tete = `<div class="rh">Malts <small>7 · le pot comme sur l'étagère</small></div>`;
  } else { // Groupé : l'inconnu dit une fois en tête de rayon ; barres gardées avec leur légende.
    css += `.lv{display:flex;gap:2px;align-items:flex-end;width:22px;flex:none}.lv i{width:6px;background:#d8d8d4;border-radius:1px}.lv i.f{background:#A0522D}
.manq{display:flex;align-items:center;gap:8px;margin:8px 0 2px;padding:8px 10px;border-radius:12px;border:1.5px dashed #b9b9b4;font-size:15px;color:#333}
.manq b{font-family:"IBM Plex Mono",monospace}.manq a{margin-left:auto;color:#1F64A3;font-weight:700;white-space:nowrap}
.lgd{display:flex;align-items:center;gap:6px;font-size:14px;color:var(--mut)}`;
    const lv = (n) => `<span class="lv">${[6, 11, 16].map((h, k) => `<i class="${k < n ? 'f' : ''}" style="height:${h}px"></i>`).join('')}</span>`;
    lignes = MALTS_R.map(([n, f, e, q, u, l]) => `<div class="rl">${lv(l)}<span class="nm">${n}<small>${f}${e != null ? ` · ${String(e).replace('.', ',')} EBC` : ''}</small></span><span class="chp mono ${q === '0' ? 'r' : ''}">${q}<small>${u}</small></span><span class="ck">${ic('check', 22)}</span></div>`).join('');
    tete = `<div class="rh">Malts <small>7</small><span class="lgd" style="margin-left:auto">${lv(1)}peu ${lv(3)}plein</span></div><div class="manq"><i class="sw u"></i>EBC inconnu sur <b>3</b> malts<a>Compléter ›</a></div>`;
  }
  const corps = `<main>${ONGLETS('Recompter')}${CHERCHE}${TUILES}${tete}${lignes}</main>`;
  ecrire(`d6${v}-repos`, `D6${v}`, css, corps);
}

// =====================================================================================
// D7 · Les sucres (Dextrose, Sucre de resucrage)
// =====================================================================================
function d7(v) {
  const sucres = [['Dextrose', 5, null], ['Sucre de resucrage', 1, null]];
  const maltsSans = { Base: MALTS.Base, Caramel: MALTS.Caramel, Torréfiés: MALTS.Torréfiés, Spéciaux: MALTS.Spéciaux.slice(0, 2) };
  const css = MUR_CSS + LISTE_CSS + `.col.su .pot{border-radius:3px;background-image:radial-gradient(#fff 1.2px,transparent 1.4px)!important;background-size:5px 5px}
.rg.mini .nm b{font-size:16px}.note{font-size:14px;color:var(--mut);margin-top:6px}`;
  const C = (o, H, coul) => Object.entries(o).map(([t, it]) => col(t, it, H, coul, '')).join('');
  const sucreCol = (H) => `<div class="col su"><span class="h" style="color:#9C7020">Sucres</span><div class="pl" style="height:${H + 2}px;border-color:#9C7020">${pots(sucres, H, '#E3B55D')}</div><span class="q mono">6 kg</span></div>`;
  let mur;
  if (v === 'a') {
    const C2 = Object.entries(maltsSans).map(([t, it]) => col(t, it, 40, '#A0522D', { Base: '38 kg', Caramel: '1,6 kg', Torréfiés: '1,5 kg', Spéciaux: '7 kg' }[t])).join('');
    mur = rangee('Malts', '2 / 9', 'var(--malt)', C2 + sucreCol(40)) + rangee('Houblons', '3 / 9', 'var(--hop)', C(HOPS, 34, '#567F45')) + rangee('Levures', '2 / 5', 'var(--lev)', C(LEVS, 28, '#9C7020'));
  } else {
    const C2 = Object.entries(maltsSans).map(([t, it]) => col(t, it, 40, '#A0522D', { Base: '38 kg', Caramel: '1,6 kg', Torréfiés: '1,5 kg', Spéciaux: '7 kg' }[t])).join('');
    mur = rangee('Malts', '2 / 9', 'var(--malt)', C2) + rangee('Sucres', '0 / 2', '#E3B55D', `<div class="col su"><div class="pl" style="height:30px;border-color:#9C7020">${pots(sucres, 28, '#E3B55D')}</div></div><span style="font-size:15px;color:#333;align-self:center">Dextrose <b class="mono">5 kg</b> · Resucrage <b class="mono">1 kg</b></span>`) + rangee('Houblons', '3 / 9', 'var(--hop)', C(HOPS, 34, '#567F45')) + rangee('Levures', '2 / 5', 'var(--lev)', C(LEVS, 28, '#9C7020'));
  }
  const liste = v === 'a'
    ? `<div class="lh">Malts et sucres <small>11</small></div>${ligne('#E3B55D', 'Dextrose', 'sucre · comptée dans la densité', '5 kg', 70)}${ligne('#E3B55D', 'Sucre de resucrage', 'sucre · mise en bouteille', '1 kg', 20)}`
    : `<div class="lh">Sucres <small>2 · sans EBC</small></div>${ligne('#E3B55D', 'Dextrose', 'fermentescible', '5 kg', 70)}${ligne('#E3B55D', 'Sucre de resucrage', 'mise en bouteille', '1 kg', 20)}`;
  const corps = `<main>${ONGLETS()}${CHERCHE}${PILLS}<div class="seg bl" style="margin-top:8px"><a class="on" href="#">Ingrédients</a><a href="#">Autres stocks</a></div><div class="mur" style="margin-top:8px">${mur}</div>${liste}</main>`;
  ecrire(`d7${v}-repos`, `D7${v}`, css, corps);
}

for (const e of ['repos', 'bulle']) { d4a(e); d4b(e); }
for (const e of ['repos', 'filtre']) d4c(e);
for (const e of ['repos', 'modif']) d5a(e);
for (const e of ['repos', 'geste']) d5b(e);
for (const e of ['repos', 'feuille']) d5c(e);
for (const v of ['a', 'b', 'c']) d6(v);
for (const v of ['a', 'b']) d7(v);
console.log('écrit :', fs.readdirSync(ICI).filter((f) => /^st2-.*\.html$/.test(f)).length, 'maquettes');
