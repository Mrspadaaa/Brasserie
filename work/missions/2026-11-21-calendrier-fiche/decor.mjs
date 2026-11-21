// Décor commun des 12 versions : en-tête, courbe, frise et barres du Calendrier, identiques (base maquettes.json › calendrier).
// Seule la fiche change d'une version à l'autre. Statique : HTML et CSS, états par :target (#edition, #limite).
export const I = (n, c = '') => `<svg class="ic ${c}" aria-hidden="true"><use href="#${n}"/></svg>`;

const W = 374, X0 = 8;
// jour 0 = 1er août 2026
export const x = (j) => +(X0 + (j * W) / 365).toFixed(1);
export const J = { s3: 33, s4: 34, s5: 35, s6: 36, s15: 45, s17: 47, s20: 50, o12: 72, n16: 107, n21: 112, d7: 128, d12: 133, d14: 135, d21: 142, j4: 156, j10: 162, f28: 211, m14: 225, s28: 58 };

const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<defs>
<symbol id="wheat" viewBox="0 0 24 24"><path d="M2 22 16 8"/><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z"/><path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/><path d="M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/><path d="M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/></symbol>
<symbol id="flask" viewBox="0 0 24 24"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></symbol>
<symbol id="snow" viewBox="0 0 24 24"><path d="m10 20-1.25-2.5L6 18"/><path d="M10 4 8.75 6.5 6 6"/><path d="m14 20 1.25-2.5L18 18"/><path d="m14 4 1.25 2.5L18 6"/><path d="m17 21-3-6h-4"/><path d="m17 3-3 6 1.5 3"/><path d="M2 12h6.5L10 9"/><path d="m20 10-1.5 2 1.5 2"/><path d="M22 12h-6.5L14 15"/><path d="m4 10 1.5 2L4 14"/><path d="m7 21 3-6-1.5-3"/><path d="m7 3 3 6h4"/></symbol>
<symbol id="pkg" viewBox="0 0 24 24"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/></symbol>
<symbol id="beer" viewBox="0 0 24 24"><path d="M17 11h1a3 3 0 0 1 0 6h-1"/><path d="M9 12v6"/><path d="M13 12v6"/><path d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z"/><path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"/></symbol>
<symbol id="cart" viewBox="0 0 24 24"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></symbol>
<symbol id="link" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></symbol>
<symbol id="receipt" viewBox="0 0 24 24"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></symbol>
<symbol id="x" viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></symbol>
<symbol id="eye" viewBox="0 0 24 24"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></symbol>
<symbol id="eyeoff" viewBox="0 0 24 24"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></symbol>
<symbol id="max" viewBox="0 0 24 24"><path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/></symbol>
<symbol id="sort" viewBox="0 0 24 24"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></symbol>
<symbol id="clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></symbol>
<symbol id="wallet" viewBox="0 0 24 24"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></symbol>
<symbol id="chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></symbol>
<symbol id="chevd" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></symbol>
<symbol id="archive" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></symbol>
<symbol id="party" viewBox="0 0 24 24"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/></symbol>
<symbol id="hop" viewBox="0 0 24 24"><path d="M12 3c3.2 2 5 5 5 9s-1.8 7-5 9c-3.2-2-5-5-5-9s1.8-7 5-9Z"/><path d="M7.6 8.5h8.8"/><path d="M7 12.5h10"/><path d="M8.2 16.5h7.6"/><path d="M12 3V1.5"/></symbol>
<symbol id="check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>
<symbol id="plus" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M12 5v14"/></symbol>
<symbol id="minus" viewBox="0 0 24 24"><path d="M5 12h14"/></symbol>
<symbol id="grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></symbol>
<symbol id="cal" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></symbol>
<symbol id="users" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></symbol>
</defs></svg>`;

export const CSS = `
:root{--bg:#FFFFFF;--card:#F5F5F5;--card2:#EBEBEB;--ink:#111;--mut:#5f5f5f;--line:#dcdcdc;--line2:#bdbdbd;
--br:#9A4F1E;--brl:#F4E6DA;--fe:#6A4FB0;--fel:#ECE6F8;--ve:#567F45;--vel:#E5EFDF;--ac:#1F64A3;--acl:#E3EDF7;--tr:#9C7020;--av:#4F7E9B;--avl:#E2ECF2;--pa:#6b6b6b;
--bad:#b3261e;--badl:#fbeae8;--fin:#1f64a3;--finl:#e8f0f8;--ok:#2f7d6b;--act:#111;--onact:#fff;
--p1:#C87A2C;--p2:#E0A02E;--p3:#2F5F7D;--p4:#567F45;--hat:rgba(0,0,0,.16);--today:rgba(31,100,163,.10);--past:rgba(0,0,0,.05)}
@media (prefers-color-scheme:dark){:root{--bg:#12100E;--card:#221D19;--card2:#2C2521;--ink:#F5F0EA;--mut:#9A8A7E;--line:#2C2521;--line2:#3D342E;
--br:#E7A070;--brl:#3A2618;--fe:#BCA5E8;--fel:#2B2340;--ve:#A3C97A;--vel:#1F2A18;--ac:#86B9E6;--acl:#172634;--tr:#E3B55D;--av:#86B9E6;--avl:#182830;--pa:#a89a8f;
--bad:#f08a80;--badl:#3a1a17;--fin:#86b9e6;--finl:#172634;--ok:#6fc3ad;--act:#F2C14E;--onact:#12100E;
--p1:#E7A070;--p2:#F2C14E;--p3:#86B9E6;--p4:#A3C97A;--hat:rgba(255,255,255,.2);--today:rgba(134,185,230,.12);--past:rgba(255,255,255,.05)}}
*{box-sizing:border-box}html,body{margin:0;overflow-x:clip;background:var(--bg);color:var(--ink);font-family:"Source Sans 3","Segoe UI",system-ui,sans-serif;font-size:15px;line-height:1.2;-webkit-tap-highlight-color:transparent}
body{min-height:100vh;padding-bottom:150px}a{color:inherit;text-decoration:none}
.ic{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none;vertical-align:middle}
.tg{position:fixed;top:0;left:0;width:0;height:0}
.st{display:none}.st-repos{display:block}.sti.st-repos{display:inline-flex}
#edition:target~.app .st-repos,#limite:target~.app .st-repos{display:none}
#edition:target~.app .st-edition,#limite:target~.app .st-limite{display:block}
#edition:target~.app .sti.st-edition,#limite:target~.app .sti.st-limite{display:inline-flex}
.r-repos{box-shadow:0 0 0 2px var(--bg),0 0 0 4px currentColor}
#edition:target~.app .r-repos,#limite:target~.app .r-repos{box-shadow:none}
#edition:target~.app .r-edition,#limite:target~.app .r-limite{box-shadow:0 0 0 2px var(--bg),0 0 0 4px currentColor}
/* en-tête */
.hd{display:flex;align-items:center;justify-content:space-between;padding:6px 8px 2px;gap:6px}
.hd-n{display:flex;align-items:center;gap:5px}.hd-big{font-size:30px;font-weight:800;color:var(--bad);letter-spacing:-.5px}
.hd-l{font-size:14px;color:var(--mut);line-height:1.1}.hd-s{color:var(--fin);font-size:16px}
.hd-t{display:flex;gap:4px;align-items:center}.tb{display:inline-flex;align-items:center;justify-content:center;gap:2px;min-width:30px;height:32px;border-radius:9px;font-weight:700;font-size:15px}
.tb-pm{border:1.5px solid var(--line2);background:var(--card)}.tb-an{background:var(--act);color:var(--onact);border-radius:16px;padding:0 9px}
.tb-rt{border:1.5px solid var(--bad);color:var(--bad);border-radius:16px;padding:0 6px;background:var(--badl)}
.crb{position:relative;height:104px;margin:0 8px}.crb svg{position:absolute;inset:0;width:100%;height:100%}
.crb .el{position:absolute;font-size:14px;white-space:nowrap;text-shadow:0 0 3px var(--bg),0 0 3px var(--bg)}.crb .el b{color:var(--bad)}
.crb .sel{position:absolute;border:2px solid var(--fin);border-radius:7px;top:4px;bottom:6px}
.crb .sl{color:var(--fin);font-weight:700}
.mo{display:grid;grid-template-columns:repeat(12,1fr);margin:0 8px;height:24px;align-items:center;border-bottom:1px solid var(--line);font-size:14px;color:var(--mut);text-align:center;font-weight:600}
.fr{position:relative;background-image:repeating-linear-gradient(90deg,transparent 0 calc(374px/12 - 1px),var(--line) calc(374px/12 - 1px) calc(374px/12));background-position:8px 0;background-size:374px 100%;background-repeat:no-repeat;padding-bottom:6px}
.today{position:absolute;top:0;bottom:0;left:${x(J.n16)}px;width:8px;background:var(--today);pointer-events:none}
.rh{position:relative;display:flex;align-items:center;gap:6px;height:30px;padding:0 8px;margin-top:4px}
.rh .sq{width:24px;height:24px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;color:#fff}
.rh .sq .ic{width:16px;height:16px;stroke-width:3}
.rh .tt{font-weight:800;font-size:16px}.rh .oe{display:inline-flex;width:30px;height:30px;align-items:center;justify-content:center;color:var(--mut)}
.rh .pl{background:var(--card2);border-radius:12px;padding:2px 8px;font-weight:700;font-size:14px}.rh .cf{font-size:14px;color:var(--mut)}
.bl{position:relative;height:28px}
.br{position:absolute;top:3px;height:22px;border-radius:6px;border:1.5px solid currentColor;border-left-width:4px}
.br .bt{position:absolute;left:0;right:0;bottom:0;height:4px;border-radius:0 0 3px 3px}
.lb{position:absolute;top:4px;font-size:15px;white-space:nowrap;font-weight:600}.lb b{font-weight:700}.lb .m{color:var(--bad)}.lb .p{color:var(--ok)}.lb .g{color:var(--mut);font-weight:600}
.lbi{position:absolute;top:1px;left:6px;font-size:15px;font-weight:700;white-space:nowrap}
.nm{text-decoration:underline dotted 1.5px;text-underline-offset:3px}
.ov{position:absolute;top:3px;height:22px;border-radius:0 6px 6px 0}
.slot{padding:4px 8px 6px}
.c-br{color:var(--br)}.c-fe{color:var(--fe)}.c-ve{color:var(--ve)}.c-ac{color:var(--ac)}.c-tr{color:var(--tr)}.c-av{color:var(--av)}.c-pa{color:var(--pa)}
.f-br{background:var(--brl)}.f-fe{background:var(--fel)}.f-ve{background:var(--vel)}.f-ac{background:var(--acl)}.f-av{background:var(--avl)}
.hat{background:repeating-linear-gradient(135deg,transparent 0 4px,var(--hat) 4px 6px)}
.tabs{position:fixed;left:0;right:0;bottom:0;height:56px;display:grid;grid-template-columns:repeat(6,1fr);background:var(--card);border-top:1px solid var(--line);z-index:20}
.tabs span{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:14px;color:var(--mut)}
.tabs span.on{color:var(--ink);font-weight:700;background:var(--card2);box-shadow:inset 0 3px 0 var(--br)}
.tabs .bd{position:absolute;margin:-26px 0 0 26px;background:var(--fin);color:#fff;border-radius:9px;padding:0 5px;font-size:14px;font-weight:700}
.tabs span{position:relative}
.fab{position:fixed;right:18px;bottom:68px;width:54px;height:54px;border-radius:16px;background:var(--act);color:var(--onact);display:flex;align-items:center;justify-content:center;z-index:30;box-shadow:0 4px 12px rgba(0,0,0,.25)}
.fab .ic{width:28px;height:28px;stroke-width:2.5}
/* commun aux fiches : valeur modifiable d'un toucher */
.ed{cursor:pointer}
.q{border:1.5px dashed var(--line2);color:var(--mut)}
`;

const rowHead = (c, titre, pill, cf = '') => `<div class="rh"><span class="sq" style="background:var(--${c})">${I('plus')}</span><span class="tt c-${c}">${titre}</span><span class="oe" data-filtre="${titre}" aria-label="Masquer ${titre}">${I('eye')}</span>${pill ? `<span class="pl">${pill}</span>` : ''}${cf ? `<span class="cf">${cf}</span>` : ''}</div>`;

// sel : { repos:'neipa', edition:'vi', limite:'jhhh' } ; slots : { neipa:{repos,edition,limite}, ... } ; ov : html superposé à la barre en état d'édition
function bar(id, c, a, b, inner, label, V) {
  const sel = Object.entries(V.sel).filter(([, it]) => it === id).map(([s]) => `r-${s}`).join(' ');
  const ov = V.ov && V.ov[id] ? V.ov[id] : '';
  return `<div class="bl"><div class="br c-${c} f-${c} ${sel}" style="left:${x(a)}px;width:${(x(b) - x(a)).toFixed(1)}px">${inner || ''}</div>${ov}${label || ''}</div>`;
}
function slot(id, V) {
  const s = V.slots[id];
  if (!s) return '';
  return `<div class="slot">${['repos', 'edition', 'limite'].filter((k) => s[k]).map((k) => `<div class="st st-${k}">${s[k]}</div>`).join('')}</div>`;
}

export function portrait(V) {
  const neipaTail = `<span style="position:absolute;left:${(x(J.n21) - x(J.s3)).toFixed(1)}px;top:-1.5px;bottom:-1.5px;width:${(x(J.d7) - x(J.n21)).toFixed(1)}px;border:1.5px dashed currentColor;border-left:0;border-radius:0 6px 6px 0" class="hat"></span>`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${V.titre} · fiche du Calendrier · 21.11</title><style>${CSS}${V.css}</style></head><body>
<i id="edition" class="tg"></i><i id="limite" class="tg"></i>
<div class="app">${SPRITE}
<header class="hd"><div class="hd-n"><b class="hd-big">−683</b><span class="hd-l">CHF à dépenser<br><b class="hd-s">S50</b></span></div>
<div class="hd-t"><span class="tb tb-pm">±</span><span class="tb tb-an">An ${I('chevd')}</span><span class="tb tb-rt">${I('clock')}7</span><span class="tb" data-trier aria-label="Trier les rangées">${I('sort')}</span><span class="tb">${I('eyeoff')}</span><span class="tb">${I('max')}</span></div></header>
<div class="crb"><svg viewBox="0 0 374 104" preserveAspectRatio="none"><path d="M0 22H374" stroke="var(--bad)" stroke-dasharray="5 4" stroke-width="1.5"/>
<path d="M0 16H34V27H72V34H117V45H150V55H180V50H210V92H374V22H0Z" fill="var(--bad)" opacity=".12"/>
<polyline points="0,16 34,16 34,27 72,27 72,34 117,34 117,45 150,45 150,55 180,55 180,50 210,50 210,92 374,92" fill="none" stroke="var(--bad)" stroke-width="2.5"/></svg>
<span class="el" style="left:2px;top:0">Vêtements et s… <b>−132</b></span><span class="el" style="right:0;top:0"><b>0</b></span>
<span class="el" style="left:186px;top:28px">lol <b>−600</b></span><span class="el" style="left:176px;top:66px">Vente 10 × Bière <b>−5 695</b></span>
<span class="sel" style="left:${x(J.n16) - 8}px;width:${(x(J.d21 + 7) - x(J.n16)).toFixed(1)}px"></span><span class="el sl" style="left:40px;top:76px">S47 – S52</span></div>
<div class="mo"><span>A</span><span>S</span><span>O</span><span>N</span><span>D</span><span>J</span><span>F</span><span>M</span><span>A</span><span>M</span><span>J</span><span>J</span></div>
<div class="fr"><span class="today"></span>
${rowHead('br', 'Brassins', '−28 + coût à venir')}
${bar('blonde', 'br', J.n16, J.d14, '<span class="bt" style="background:var(--p1)"></span>', `<span class="lb" style="left:${x(J.d14) + 5}px">Blonde d'automne <b class="m">−148</b></span>`, V)}
${bar('jhhh', 'br', J.s5, J.s20, '<span class="bt" style="background:linear-gradient(90deg,var(--p1) 0 8%,var(--p2) 8% 66%,var(--p3) 66% 100%)"></span>', `<span class="lb" style="left:${x(J.s20) + 5}px"><span class="${V.sel.limite === 'jhhh' ? 'nm' : ''}">Jhhh</span> <span class="g">J15/15</span></span>`, V)}
${slot('jhhh', V)}
${bar('neipa', 'br', J.s3, J.n21, '<span class="bt" style="background:linear-gradient(90deg,var(--p1) 0 6%,var(--p2) 6% 30%,var(--p3) 30% 100%)"></span>' + neipaTail, `<span class="lb" style="left:${x(J.d7) + 5}px"><span class="nm">NEIPA Test</span> <span class="g">J79</span></span>`, V)}
${slot('neipa', V)}
${rowHead('fe', 'Fêtes', '+1 180')}
${bar('noel', 'fe', J.d7, J.d21, '', `<span class="lb" style="left:${x(J.d21) + 5}px">Marché de Noël <b class="p">+1 180</b></span>`, V)}
${bar('vi', 'fe', J.o12, J.f28, `<span class="lbi${V.sel.edition === 'vi' ? ' nm' : ''}">vi</span>`, '', V)}
${slot('vi', V)}
${rowHead('ve', 'Ventes', '+900')}
${bar('prive', 've', J.d14, J.d21 + 7, '', `<span class="lb" style="left:${x(J.d21 + 7) + 5}px">Noël privés <b class="p">+640</b></span>`, V)}
${rowHead('ac', 'Achats', '')}
${bar('malt', 'ac', J.j4, J.j10, '', `<span class="lb" style="left:${x(J.j10) + 5}px">Malt groupé <b class="m">−540</b></span>`, V)}
${rowHead('tr', 'Travaux', '')}
${rowHead('av', 'Activités', '')}
${bar('reserve', 'av', J.n21, J.n21 + 14, '', `<span class="lb" style="left:${x(J.n21 + 14) + 5}px">Ranger la réserve <b>3 j</b></span>`, V)}
${rowHead('pa', 'Papiers', '−806')}
</div>
${V.dock || ''}
<a class="fab" aria-label="Ajouter">${I('plus')}</a>
<nav class="tabs"><span>${I('grid')}Bord</span><span>${I('wallet')}Finances</span><span class="on">${I('cal')}Calendrier</span><span>${I('beer')}Brassins</span><span>${I('pkg')}Stocks<b class="bd">24</b></span><span>${I('users')}Clients</span></nav>
</div></body></html>`;
}

// Paysage 844 × 390 : même frise en semaines (S44 → S5), la fiche au repos sur le côté.
export function paysage(V) {
  const S = ['S40', 'S41', 'S42', 'S43', 'S44', 'S45', 'S46', 'S47', 'S48', 'S49', 'S50', 'S51', 'S52', 'S1'];
  const xw = (j) => +(8 + ((j - 58) * 32) / 7).toFixed(1); // S40 commence le 28 sept. (jour 58)
  const b = (c, a, z, t) => `<div class="bl"><div class="br c-${c} f-${c}" style="left:${Math.max(0, xw(a))}px;width:${Math.min(456, xw(z)) - Math.max(0, xw(a))}px"></div><span class="lb" style="left:${Math.min(456, xw(z)) + 5}px">${t}</span></div>`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${V.titre} · paysage · 21.11</title><style>${CSS}${V.css}
.pz{display:grid;grid-template-columns:470px 1fr;gap:8px;height:100vh;overflow:hidden}.pz-w{display:grid;grid-template-columns:repeat(14,32px);margin-left:8px;font-size:14px;color:var(--mut);font-weight:600;height:24px;align-items:center;border-bottom:1px solid var(--line)}
.pz-w b{color:var(--ink)}.pz .fr{background-size:448px 100%;background-image:repeating-linear-gradient(90deg,transparent 0 31px,var(--line) 31px 32px)}.pz-side{overflow:hidden;padding:8px 8px 0 0}.pz .lb{max-width:none}
body{padding-bottom:0}</style></head><body><div class="app">${SPRITE}<div class="pz"><div>
<header class="hd"><div class="hd-n"><b class="hd-big">−683</b><span class="hd-l">CHF à dépenser<br><b class="hd-s">S50</b></span></div><div class="hd-t"><span class="tb tb-an">An ${I('chevd')}</span><span class="tb">${I('max')}</span></div></header>
<div class="pz-w">${S.map((s) => (s === 'S47' ? `<b>${s}</b>` : `<span>${s}</span>`)).join('')}</div>
<div class="fr">${rowHead('br', 'Brassins', '−28')}
${b('br', J.n16, J.d14, "Blonde d'automne −148")}${b('br', 58, J.n21, '<span class="nm">NEIPA Test</span> J79')}
${rowHead('fe', 'Fêtes', '+1 180')}${b('fe', J.d7, J.d21, 'Marché de Noël +1 180')}${b('fe', J.o12, 400, 'vi')}
${rowHead('ve', 'Ventes', '+900')}</div></div>
<div class="pz-side">${V.slots[V.sel.repos].repos}</div></div></div></body></html>`;
}
