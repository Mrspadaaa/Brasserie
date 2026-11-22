// Les 12 versions de la fiche. Chaque version : sa composition, ses classes préfixées (fvN-), trois états.
// Données des captures 15 à 17 (21.11) : NEIPA Test J79 ; Jhhh et ses 4 phases ; la fête « vi » du 12 oct. au 28 févr.
import { I, x, J } from './decor.mjs';

const E = (h, c = '') => `<a class="ed ${c}" href="#edition">${h}</a>`; // une valeur modifiable d'un toucher
const X = (c = '') => `<a class="${c}" href="#" aria-label="Fermer">${I('x')}</a>`;
// barre NEIPA prolongée jusqu'au 12 déc. pendant l'édition ; barre vi tirée jusqu'à S10, ou son début vers le passé
const OV_NEIPA = `<span class="st st-edition"><span class="ov" style="left:${x(J.n21)}px;width:${(x(J.d12) - x(J.n21)).toFixed(1)}px;background:var(--p4);opacity:.85"></span><span style="position:absolute;top:0;left:${x(J.d12) - 7}px;width:14px;height:28px;border-radius:7px;background:var(--act)"></span></span>`;
const OV_VI_FIN = `<span class="st st-edition"><span class="ov" style="left:${x(J.f28)}px;width:${(x(J.m14) - x(J.f28)).toFixed(1)}px;background:var(--fe);opacity:.55"></span><span style="position:absolute;top:0;left:${x(J.m14) - 7}px;width:14px;height:28px;border-radius:7px;background:var(--act)"></span></span>`;
const OV_VI_DEBUT = `<span class="st st-edition"><span class="ov" style="left:${x(J.s28)}px;width:${(x(J.o12) - x(J.s28)).toFixed(1)}px;background:var(--fe);opacity:.55;border-radius:6px 0 0 6px"></span><span style="position:absolute;top:0;left:${x(J.s28) - 7}px;width:14px;height:28px;border-radius:7px;background:var(--act)"></span></span>`;

export const VERSIONS = [];
const V = (o) => VERSIONS.push(o);

/* ───────────── v01 · Frise des phases ───────────── */
V({
  id: 'v01', titre: 'v01 · Frise des phases', genre: 'Frise des phases', idee: 'Les phases du brassin en frise : chaque date est un repère qu’on tire.',
  sel: { repos: 'neipa', edition: 'neipa', limite: 'jhhh' }, ov: { neipa: OV_NEIPA },
  css: `.fv1{background:var(--card);border:1.5px solid var(--br);border-radius:14px;padding:8px 10px 10px}
.fv1-h{display:flex;align-items:center;gap:8px;height:34px}.fv1-h .nm{font-size:19px;font-weight:800;flex:1}
.fv1-j{background:var(--br);color:#fff;border-radius:10px;padding:2px 8px;font-weight:800;font-size:16px}
.fv1-x{width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:var(--mut)}
.fv1-fr{position:relative;height:84px;margin:4px 4px 2px}
.fv1-tr{position:absolute;left:0;right:0;top:34px;height:14px;border-radius:7px;display:flex;overflow:hidden}
.fv1-tr i{display:block;height:100%}
.fv1-m{position:absolute;top:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:0}
.fv1-m .pk{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff}
.fv1-m .d{position:absolute;top:52px;font-size:14px;font-weight:700;white-space:nowrap}
.fv1-m.q .pk{background:var(--bg);border:2px dashed var(--line2);color:var(--mut)}
.fv1-now{position:absolute;top:28px;width:3px;height:26px;background:var(--ink);border-radius:2px}
.fv1-fr2{display:flex;align-items:center;gap:8px;min-height:40px;border-top:1px solid var(--line);padding-top:6px;font-size:15px}
.fv1-chf{margin-left:auto;border:1.5px dashed var(--line2);border-radius:10px;padding:5px 10px;font-weight:800;color:var(--mut)}
.fv1-a{display:flex;gap:6px;margin-top:6px}.fv1-a a{height:42px;border-radius:21px;display:inline-flex;align-items:center;gap:6px;padding:0 14px;font-weight:700;border:1.5px solid var(--line2)}
.fv1-a a.pr{background:var(--act);color:var(--onact);border-color:var(--act);flex:1;justify-content:center}
.fv1-bub{position:absolute;top:-2px;white-space:nowrap;z-index:2;transform:translateX(-50%);background:var(--act);color:var(--onact);border-radius:8px;padding:2px 7px;font-weight:800;font-size:15px}
.fv1-thumb{position:absolute;top:28px;width:26px;height:26px;margin-left:-13px;border-radius:50%;background:var(--act);border:3px solid var(--bg);box-shadow:0 0 0 2px var(--act)}
.fv1-man{display:flex;align-items:center;gap:6px;background:var(--badl);border-radius:10px;padding:5px 6px;margin-top:6px;color:var(--bad);font-weight:700}
.fv1-man .ch{display:inline-flex;align-items:center;gap:3px;background:var(--bg);border-radius:8px;padding:3px 6px;color:var(--ink);font-size:14px}
.fv1-man .cm{margin-left:auto;background:var(--bad);color:#fff;border-radius:18px;height:36px;display:inline-flex;align-items:center;gap:4px;padding:0 10px}`,
  slots: {
    neipa: {
      repos: `<div class="fv1" data-fiche><div class="fv1-h"><span class="c-br">${I('beer')}</span><span class="nm" data-nom>NEIPA Test</span><span class="fv1-j">J79</span>${X('fv1-x')}</div>
<div class="fv1-fr"><div class="fv1-tr"><i style="width:6%;background:var(--p1)"></i><i style="width:20%;background:var(--p2)"></i><i style="width:44%;background:var(--p3)"></i><i class="hat" style="flex:1;background-color:var(--card2)"></i></div>
<a class="ed fv1-m" href="#edition" style="left:5%"><span class="pk" style="background:var(--p1)">${I('wheat')}</span><span class="d" style="left:0;transform:none">3 sept.</span></a>
<span class="fv1-m" style="left:70%"><span class="pk" style="background:var(--p3)">${I('snow')}</span><span class="d">21 nov.</span></span><span class="fv1-now" style="left:70%"></span>
<a class="ed fv1-m q" href="#edition" style="left:94%"><span class="pk">${I('pkg')}</span><span class="d" style="font-size:18px">?</span></a></div>
<div class="fv1-fr2"><span class="c-pa">${I('receipt')}</span>emballage <b>21 nov.</b>${E('CHF ?', 'fv1-chf hat')}</div>
<div class="fv1-a"><a class="pr" href="#">Ouvrir ${I('chev')}</a><a href="#">${I('wallet')}Budget</a><a href="#">${I('link')}Lier</a></div></div>`,
      edition: `<div class="fv1" data-fiche><div class="fv1-h"><span class="c-br">${I('beer')}</span><span class="nm" data-nom>NEIPA Test</span><span class="fv1-j">J100</span>${X('fv1-x')}</div>
<div class="fv1-fr"><div class="fv1-tr"><i style="width:5%;background:var(--p1)"></i><i style="width:16%;background:var(--p2)"></i><i style="width:41%;background:var(--p3)"></i><i style="width:26%;background:var(--p4)"></i><i class="hat" style="flex:1;background-color:var(--card2)"></i></div>
<span class="fv1-m" style="left:2%"><span class="pk" style="background:var(--p1)">${I('wheat')}</span><span class="d" style="left:0">3 sept.</span></span>
<span class="fv1-m" style="left:62%"><span class="pk" style="background:var(--p3)">${I('snow')}</span><span class="d">21 nov.</span></span>
<span class="fv1-bub" style="left:88%">12 déc.</span><span class="fv1-thumb" style="left:88%"></span>
<span class="fv1-m" style="left:88%;top:52px"><span class="d" style="top:4px;color:var(--p4)">${I('pkg')} S50</span></span></div>
<div class="fv1-fr2"><span class="c-pa">${I('receipt')}</span>emballage <b>21 nov.</b>${E('CHF ?', 'fv1-chf hat')}</div>
<div class="fv1-a"><a class="pr" href="#">Ouvrir ${I('chev')}</a><a href="#">${I('wallet')}Budget</a><a href="#">${I('link')}Lier</a></div></div>`,
    },
    jhhh: {
      limite: `<div class="fv1" data-fiche><div class="fv1-h"><span class="c-br">${I('beer')}</span><span class="nm" data-nom>Jhhh</span><span class="fv1-j">J15/15</span>${X('fv1-x')}</div>
<div class="fv1-fr"><div class="fv1-tr" style="left:12%"><i style="width:14%;background:var(--p1)"></i><i style="width:38%;background:var(--p2)"></i><i style="width:26%;background:var(--p3)"></i><i style="flex:1;background:var(--p4)"></i></div>
<a class="ed fv1-m" href="#edition" style="left:4%"><span class="pk" style="background:var(--bad)">${I('cart')}</span><span class="d" style="color:var(--bad)">4</span></a>
<a class="ed fv1-m" href="#edition" style="left:19%"><span class="pk" style="background:var(--p1)">${I('wheat')}</span><span class="d">5</span></a>
<a class="ed fv1-m" href="#edition" style="left:32%"><span class="pk" style="background:var(--p2)">${I('flask')}</span><span class="d">6</span></a>
<a class="ed fv1-m" href="#edition" style="left:66%"><span class="pk" style="background:var(--p3)">${I('snow')}</span><span class="d">15</span></a>
<a class="ed fv1-m" href="#edition" style="left:89%"><span class="pk" style="background:var(--p4)">${I('pkg')}</span><span class="d">20 sept.</span></a></div>
<div class="fv1-man">${I('cart')}<span class="ch">${I('hop')}target 11,3 %</span><span class="ch">${I('wheat')}maris otter</span><a class="cm" href="#">Commander</a></div>
<div class="fv1-fr2"><span class="c-pa">${I('receipt')}</span>emballage <b>21 nov.</b>${E('CHF ?', 'fv1-chf hat')}</div>
<div class="fv1-a"><a class="pr" href="#">Ouvrir ${I('chev')}</a><a href="#">${I('wallet')}Budget</a><a href="#">${I('link')}Lier</a></div></div>`,
    },
  },
});

/* ───────────── v02 · Pastilles chiffrées ───────────── */
V({
  id: 'v02', titre: 'v02 · Pastilles chiffrées', genre: 'Pastilles chiffrées', idee: 'Quatre gros chiffres en pastilles ; l’inconnu en pointillé, à remplir d’un toucher.',
  sel: { repos: 'neipa', edition: 'neipa', limite: 'jhhh' }, ov: { neipa: OV_NEIPA },
  css: `.fv2{padding:2px 0 4px}
.fv2-h{display:flex;align-items:center;gap:8px;height:36px;padding:0 2px}.fv2-h .nm{font-size:20px;font-weight:800}
.fv2-st{display:inline-flex;align-items:center;gap:4px;background:var(--p3);color:#fff;border-radius:14px;padding:3px 10px 3px 7px;font-weight:700}
@media (prefers-color-scheme:dark){.fv2-st{color:#12100E}}
.fv2-x{margin-left:auto;width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:var(--mut)}
.fv2-g{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:4px}
.fv2-p{height:88px;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:var(--card);font-weight:800;font-size:19px;position:relative}
.fv2-p .ic{width:24px;height:24px}
.fv2-p.q{background:var(--bg);border:2px dashed var(--line2);color:var(--mut)}
.fv2-p small{font-size:14px;font-weight:600;color:var(--mut)}
.fv2-ring{width:70px;height:70px;border-radius:50%;background:conic-gradient(var(--p3) 0 75%,var(--card2) 75% 100%);display:flex;align-items:center;justify-content:center}
.fv2-ring b{width:54px;height:54px;border-radius:50%;background:var(--card);display:flex;align-items:center;justify-content:center;font-size:21px}
.fv2-a{display:grid;grid-template-columns:2fr 1fr 1fr;gap:7px;margin-top:8px}.fv2-a a{height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:5px;font-weight:700;border:1.5px solid var(--line2)}
.fv2-a a.pr{background:var(--act);color:var(--onact);border-color:var(--act)}
.fv2-w{grid-column:span 2;background:var(--card);border:2px solid var(--act);border-radius:20px;height:88px;position:relative;padding:6px 10px}
.fv2-w .v{font-size:21px;font-weight:800;display:flex;align-items:center;gap:6px}
.fv2-ru{position:absolute;left:10px;right:10px;bottom:12px;height:24px;background:repeating-linear-gradient(90deg,var(--line2) 0 2px,transparent 2px 14px);border-bottom:2px solid var(--line2)}
.fv2-th{position:absolute;bottom:4px;width:24px;height:30px;border-radius:8px;background:var(--act);margin-left:-12px}
.fv2-red{background:var(--badl);color:var(--bad)}.fv2-red .ch{font-size:14px;color:var(--ink);font-weight:700;display:flex;align-items:center;gap:3px}
.fv2-cmd{background:var(--bad);color:#fff}`,
  slots: {
    neipa: {
      repos: `<div class="fv2" data-fiche><div class="fv2-h"><span class="nm" data-nom>NEIPA Test</span><span class="fv2-st">${I('snow')}en garde</span>${X('fv2-x')}</div>
<div class="fv2-g"><div class="fv2-p"><span class="fv2-ring"><b>J79</b></span></div>
${E(`${I('wheat')}3 sept.`, 'fv2-p')}
${E(`${I('pkg')}?`, 'fv2-p q')}
${E(`${I('receipt')}CHF ?<small>21 nov.</small>`, 'fv2-p q hat')}</div>
<div class="fv2-a"><a class="pr" href="#">Ouvrir ${I('chev')}</a><a href="#">${I('wallet')}Budget</a><a href="#">${I('link')}Lier</a></div></div>`,
      edition: `<div class="fv2" data-fiche><div class="fv2-h"><span class="nm" data-nom>NEIPA Test</span><span class="fv2-st">${I('snow')}en garde</span>${X('fv2-x')}</div>
<div class="fv2-g"><div class="fv2-p"><span class="fv2-ring" style="background:conic-gradient(var(--p3) 0 79%,var(--p4) 79% 100%)"><b>J100</b></span></div>
<div class="fv2-p">${I('wheat')}3 sept.</div>
<div class="fv2-w"><span class="v c-ve">${I('pkg')}12 déc. <small style="font-size:15px;color:var(--mut)">S50</small></span><span class="fv2-ru"></span><span class="fv2-th" style="left:62%"></span></div></div>
<div class="fv2-a"><a class="pr" href="#">Ouvrir ${I('chev')}</a><a href="#">${I('wallet')}Budget</a><a href="#">${I('link')}Lier</a></div></div>`,
    },
    jhhh: {
      limite: `<div class="fv2" data-fiche><div class="fv2-h"><span class="nm" data-nom>Jhhh</span><span class="fv2-st" style="background:var(--p2)">${I('flask')}en cuve</span>${X('fv2-x')}</div>
<div class="fv2-g">${E(`${I('wheat')}5 sept.`, 'fv2-p')}${E(`${I('flask')}6 sept.`, 'fv2-p')}${E(`${I('snow')}15 sept.`, 'fv2-p')}${E(`${I('pkg')}20 sept.`, 'fv2-p')}
<div class="fv2-p fv2-red" style="grid-column:span 2;align-items:flex-start;padding:0 10px">${I('cart')}<span class="ch">${I('hop')}target 11,3 %</span><span class="ch">${I('wheat')}maris otter</span></div>
<a class="fv2-p fv2-cmd" href="#" style="font-size:15px">${I('cart')}Commander<small style="color:#fff">4 sept.</small></a>
${E(`${I('receipt')}CHF ?<small>21 nov.</small>`, 'fv2-p q hat')}</div>
<div class="fv2-a"><a class="pr" href="#">Ouvrir ${I('chev')}</a><a href="#">${I('wallet')}Budget</a><a href="#">${I('link')}Lier</a></div></div>`,
    },
  },
});

/* ───────────── v03 · Ligne compacte ───────────── */
V({
  id: 'v03', titre: 'v03 · Ligne compacte', genre: 'Ligne compacte', idee: 'Une seule ligne sous la barre ; au toucher, elle devient la frise Durée de la feuille d’ajout.',
  sel: { repos: 'neipa', edition: 'vi', limite: 'jhhh' }, ov: { vi: OV_VI_FIN },
  css: `.fv3{display:flex;align-items:center;gap:5px;height:52px;background:var(--card);border-radius:26px;padding:0 5px 0 6px;border:1.5px solid var(--br)}
.fv3 .c{height:40px;border-radius:20px;display:inline-flex;align-items:center;gap:4px;padding:0 9px;font-weight:800;font-size:16px;background:var(--bg);white-space:nowrap}
.fv3 .j{background:var(--br);color:#fff}.fv3 .c.q{border:1.5px dashed var(--line2);color:var(--mut)}
.fv3 .o{margin-left:auto;background:var(--act);color:var(--onact);width:44px;height:44px;border-radius:22px;display:flex;align-items:center;justify-content:center}
.fv3 .m{width:36px;height:40px;display:flex;align-items:center;justify-content:center;color:var(--mut)}
.fv3d{background:var(--card);border:1.5px solid var(--fe);border-radius:16px;padding:8px 10px 6px}
.fv3d .t{display:flex;align-items:baseline;gap:8px;font-size:16px}.fv3d .t b{font-size:20px}.fv3d .t .x2{margin-left:auto;color:var(--mut)}
.fv3d .bx{position:relative;height:58px;margin-top:6px;border:1.5px solid var(--line2);border-radius:12px;background:var(--bg);overflow:hidden}
.fv3d .tk{position:absolute;top:6px;bottom:20px;width:1.5px;background:var(--line2)}
.fv3d .bar{position:absolute;top:14px;height:16px;border-radius:8px;background:var(--fe)}
.fv3d .gh{position:absolute;top:14px;height:16px;border-radius:8px;border:1.5px dashed var(--fe)}
.fv3d .h{position:absolute;top:8px;width:16px;height:28px;margin-left:-8px;border-radius:8px;background:var(--act);border:2px solid var(--bg)}
.fv3d .pa{position:absolute;top:0;bottom:0;left:0;background:var(--past)}
.fv3d .ml{position:absolute;bottom:2px;font-size:14px;color:var(--mut);transform:translateX(-50%)}
.fv3d .bb{position:absolute;top:-1px;transform:translateX(-50%);background:var(--act);color:var(--onact);font-weight:800;border-radius:6px;padding:0 5px;font-size:14px}
.fv3d .a{display:flex;gap:6px;margin-top:6px}.fv3d .a a{height:40px;border:1.5px solid var(--line2);border-radius:20px;display:inline-flex;align-items:center;gap:5px;padding:0 12px;font-weight:700}
.fv3l{background:var(--card);border:1.5px solid var(--br);border-radius:18px;padding:5px;display:flex;flex-direction:column;gap:5px}
.fv3l .r{display:flex;gap:5px;align-items:center}
.fv3l .c{height:40px;border-radius:20px;display:inline-flex;align-items:center;gap:4px;padding:0 9px;font-weight:800;font-size:16px;background:var(--bg);white-space:nowrap}
.fv3l .bad{background:var(--badl);color:var(--bad);flex:1;font-size:14px;gap:6px}
.fv3l .cm{background:var(--bad);color:#fff}.fv3l .q{border:1.5px dashed var(--line2);color:var(--mut)}
.fv3l .o{margin-left:auto;background:var(--act);color:var(--onact);width:44px;height:44px;border-radius:22px;display:flex;align-items:center;justify-content:center}`,
  slots: {
    neipa: {
      repos: `<div class="fv3" data-fiche><span class="c j">J79</span>${E(`${I('wheat', 'c-br')}3 sept. → ?`, 'c')}${E(`${I('receipt')}CHF ?`, 'c q hat')}<a class="m" href="#" aria-label="Lier">${I('link')}</a><a class="m" href="#" aria-label="Budget">${I('wallet')}</a><a class="o" href="#" aria-label="Ouvrir le brassin">${I('chev')}</a></div>`,
    },
    vi: {
      edition: (() => {
        const L = (j) => (((j - 61) / (240 - 61)) * 100).toFixed(1); // 1er oct. → 29 mars
        return `<div class="fv3d" data-fiche><div class="t"><span class="c-fe">${I('party')}</span><b>22 sem.</b><span>S42 → S10</span>${X('x2')}</div>
<div class="bx"><span class="pa" style="width:${L(J.n21)}%"></span>${[61, 92, 122, 153, 184, 212].map((j) => `<span class="tk" style="left:${L(j)}%"></span>`).join('')}
<span class="gh" style="left:${L(J.o12)}%;width:${(L(J.f28) - L(J.o12)).toFixed(1)}%"></span><span class="bar" style="left:${L(J.o12)}%;width:${(L(J.m14) - L(J.o12)).toFixed(1)}%"></span>
<span class="h" style="left:${L(J.o12)}%"></span><span class="h" style="left:${L(J.m14)}%"></span><span class="bb" style="left:${L(J.m14) - 4}%">14 mars</span>
${[['oct.', 76], ['nov.', 107], ['déc.', 137], ['janv.', 168], ['févr.', 198], ['mars', 226]].map(([m, j]) => `<span class="ml" style="left:${L(j)}%">${m}</span>`).join('')}</div>
<div class="a"><a href="#">${I('link')}Lier</a><a href="#">${I('archive')}Ranger</a></div></div>`;
      })(),
    },
    jhhh: {
      limite: `<div class="fv3l" data-fiche><div class="r"><span class="c" style="background:var(--br);color:#fff">J15/15</span>${E(`${I('wheat', 'c-br')}5`, 'c')}${E(`${I('flask')}6`, 'c')}${E(`${I('snow')}15`, 'c')}${E(`${I('pkg', 'c-ve')}20 sept.`, 'c')}</div>
<div class="r"><span class="c bad">${I('cart')}4 sept. · ${I('hop')}target 11,3 % · maris otter</span></div>
<div class="r"><a class="c cm" href="#">${I('cart')}Commander</a>${E(`${I('receipt')}CHF ?`, 'c q hat')}<a class="c" href="#" aria-label="Lier">${I('link')}</a><a class="o" href="#" aria-label="Ouvrir le brassin">${I('chev')}</a></div></div>`,
    },
  },
});

/* ───────────── v04 · Carte à volets (dépliable) ───────────── */
V({
  id: 'v04', titre: 'v04 · Carte à volets', genre: 'Carte dépliable', idee: 'Un rail de pictos à gauche déplie un volet à la fois : dates, achats, frais.',
  sel: { repos: 'neipa', edition: 'jhhh', limite: 'jhhh' },
  css: `.fv4{display:grid;grid-template-columns:56px 1fr;background:var(--card);border-radius:14px;overflow:hidden;border:1.5px solid var(--br)}
.fv4-r{display:flex;flex-direction:column;background:var(--card2)}
.fv4-r a{height:52px;display:flex;align-items:center;justify-content:center;color:var(--mut);position:relative}
.fv4-r a.on{background:var(--card);color:var(--br);box-shadow:inset 4px 0 0 var(--br)}
.fv4-r a.rd{color:var(--bad)}.fv4-r .bd{position:absolute;top:6px;right:6px;background:var(--bad);color:#fff;border-radius:8px;font-size:14px;font-weight:800;padding:0 4px;line-height:16px}
.fv4-r a.qq .ic{opacity:.6}.fv4-r .ic{width:22px;height:22px}
.fv4-p{padding:8px 10px}.fv4-h{display:flex;align-items:center;gap:8px}.fv4-h .nm{font-size:19px;font-weight:800;flex:1}.fv4-h .j{background:var(--br);color:#fff;border-radius:10px;padding:2px 8px;font-weight:800}
.fv4-big{display:flex;align-items:center;gap:10px;margin:12px 0 8px;font-size:24px;font-weight:800}
.fv4-big .ed{border-bottom:2px dotted var(--line2)}.fv4-big .q{border:2px dashed var(--line2);border-radius:10px;padding:0 10px;color:var(--mut)}
.fv4-bar{height:12px;border-radius:6px;background:linear-gradient(90deg,var(--p1) 0 6%,var(--p2) 6% 30%,var(--p3) 30% 70%,transparent 70%);position:relative;border:1.5px dashed var(--line2)}
.fv4-a{display:flex;gap:6px;margin-top:12px}.fv4-a a{height:42px;border-radius:21px;display:inline-flex;align-items:center;gap:5px;padding:0 12px;font-weight:700;border:1.5px solid var(--line2)}.fv4-a a.pr{background:var(--act);color:var(--onact);border-color:var(--act)}
.fv4-row{display:grid;grid-template-columns:28px 1fr auto;align-items:center;gap:6px;height:40px;border-bottom:1px solid var(--line);font-size:17px;font-weight:700}
.fv4-row:last-child{border-bottom:0}.fv4-row .ic{width:22px;height:22px}
.fv4-st{display:flex;align-items:center;gap:4px}.fv4-st a{width:40px;height:34px;border-radius:10px;background:var(--bg);border:1.5px solid var(--line2);display:flex;align-items:center;justify-content:center}
.fv4-row.on{background:var(--bg);border-radius:10px;box-shadow:0 0 0 2px var(--p3);padding:0 4px;margin:2px -4px}
.fv4-ch{display:flex;align-items:center;gap:6px;height:44px;border-radius:12px;background:var(--badl);color:var(--ink);padding:0 10px;margin-bottom:6px;font-weight:700}
.fv4-cm{display:flex;align-items:center;justify-content:center;gap:6px;height:44px;border-radius:22px;background:var(--bad);color:#fff;font-weight:800;margin-top:4px}`,
  slots: {
    neipa: {
      repos: `<div class="fv4" data-fiche><div class="fv4-r"><a class="on" href="#">${I('cal')}</a><a href="#">${I('cart')}</a><a class="qq" href="#">${I('receipt')}</a><a href="#">${I('link')}</a></div>
<div class="fv4-p"><div class="fv4-h"><span class="nm" data-nom>NEIPA Test</span><span class="j">J79</span>${X()}</div>
<div class="fv4-big">${I('wheat', 'c-br')}${E('3 sept.')}<span style="color:var(--mut)">→</span>${E(`${I('pkg')}?`, 'q')}</div>
<div class="fv4-bar"></div>
<div class="fv4-a"><a class="pr" href="#">Ouvrir ${I('chev')}</a><a href="#">${I('wallet')}Budget</a></div></div></div>`,
    },
    jhhh: {
      edition: `<div class="fv4" data-fiche><div class="fv4-r"><a class="on" href="#">${I('cal')}</a><a class="rd" href="#">${I('cart')}<b class="bd">2</b></a><a class="qq" href="#">${I('receipt')}</a><a href="#">${I('link')}</a></div>
<div class="fv4-p"><div class="fv4-h"><span class="nm" data-nom>Jhhh</span><span class="j">J15/15</span>${X()}</div>
<div class="fv4-row"><span class="c-br">${I('wheat')}</span>5 sept.<span></span></div>
<div class="fv4-row"><span style="color:var(--p2)">${I('flask')}</span>6 sept.<span></span></div>
<div class="fv4-row on"><span style="color:var(--p3)">${I('snow')}</span><span>17 sept. <small style="color:var(--mut);font-size:14px;text-decoration:line-through">15</small></span><span class="fv4-st"><a href="#">${I('minus')}</a><a href="#">${I('plus')}</a></span></div>
<div class="fv4-row"><span class="c-ve">${I('pkg')}</span>20 sept.<span></span></div></div></div>`,
      limite: `<div class="fv4" data-fiche><div class="fv4-r"><a href="#">${I('cal')}</a><a class="on rd" href="#">${I('cart')}<b class="bd">2</b></a><a class="qq" href="#">${I('receipt')}</a><a href="#">${I('link')}</a></div>
<div class="fv4-p"><div class="fv4-h"><span class="nm" data-nom>Jhhh</span><span class="j">J15/15</span>${X()}</div>
<div class="fv4-big" style="color:var(--bad);font-size:20px;margin:8px 0">${I('cart')}${E('4 sept.')}</div>
<div class="fv4-ch">${I('hop', 'c-ve')}target <span style="margin-left:auto">11,3 %</span></div>
<div class="fv4-ch">${I('wheat', 'c-br')}maris otter</div>
<a class="fv4-cm" href="#">${I('cart')}Commander</a></div></div>`,
    },
  },
});

/* ───────────── v05 · Barre loupe (édition directe sur la barre) ───────────── */
const L5 = (a, b) => (j) => (((j - a) / (b - a)) * 100).toFixed(1);
V({
  id: 'v05', titre: 'v05 · Barre loupe', genre: 'Édition directe sur la barre', idee: 'La barre touchée s’agrandit sous elle, à son échelle : on tire ses bords au doigt, passé compris.',
  sel: { repos: 'neipa', edition: 'vi', limite: 'jhhh' }, ov: { vi: OV_VI_DEBUT },
  css: `.fv5{padding:2px 0}
.fv5-ax{position:relative;height:20px;font-size:14px;color:var(--mut);font-weight:600}.fv5-ax span{position:absolute;transform:translateX(-50%)}
.fv5-zb{position:relative;height:60px;border-radius:14px;background:var(--brl);border:2px solid var(--br);margin:0 10px}
.fv5-zb .seg{position:absolute;top:0;bottom:0;display:flex;align-items:center;justify-content:center;color:#fff}
.fv5-zb .nmz{position:absolute;left:12px;top:4px;font-size:18px;font-weight:800;color:var(--ink)}
.fv5-zb .hd5{position:absolute;top:50%;width:20px;height:40px;margin:-20px 0 0 -10px;border-radius:10px;background:var(--bg);border:2.5px solid var(--ink)}
.fv5-zb .now{position:absolute;top:-8px;bottom:-8px;width:3px;background:var(--ink);border-radius:2px}
.fv5-zb .tail{position:absolute;top:-2px;bottom:-2px;border:2px dashed var(--br);border-left:0;border-radius:0 14px 14px 0}
.fv5-dt{position:relative;height:22px;font-size:15px;font-weight:800;margin:0 10px}.fv5-dt span{position:absolute;transform:translateX(-50%);white-space:nowrap}
.fv5-a{display:flex;gap:6px;margin-top:4px}.fv5-a a{height:44px;min-width:44px;border-radius:22px;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:0 12px;font-weight:700;border:1.5px solid var(--line2)}
.fv5-a a.pr{background:var(--act);color:var(--onact);border-color:var(--act)}.fv5-a .q{border-style:dashed;color:var(--mut)}
.fv5-ps{position:absolute;top:0;bottom:0;left:0;background:var(--past)}
.fv5-bb{position:absolute;top:-30px;transform:translateX(-50%);background:var(--act);color:var(--onact);border-radius:8px;padding:2px 8px;font-weight:800;white-space:nowrap}
.fv5-gh{position:absolute;top:-2px;bottom:-2px;border:2px dashed var(--fe);border-radius:14px}
.fv5-red{display:flex;align-items:center;gap:6px;margin:6px 10px 0;background:var(--badl);color:var(--bad);border-radius:12px;padding:4px 6px;font-weight:700}
.fv5-red .ch{display:inline-flex;align-items:center;gap:3px;color:var(--ink);font-size:14px}
.fv5-red .cm{margin-left:auto;background:var(--bad);color:#fff;border-radius:18px;height:36px;display:inline-flex;align-items:center;padding:0 10px}`,
  slots: {
    neipa: {
      repos: (() => { const l = L5(30, 120); return `<div class="fv5" data-fiche>
<div class="fv5-ax">${[['sept.', 45], ['oct.', 76], ['nov.', 107]].map(([m, j]) => `<span style="left:${l(j)}%">${m}</span>`).join('')}</div>
<div class="fv5-zb"><span class="seg" style="left:${l(J.s3)}%;width:6%;background:var(--p1)">${I('wheat')}</span><span class="seg" style="left:${+l(J.s3) + 6}%;width:22%;background:var(--p2);opacity:.85"></span><span class="seg" style="left:${+l(J.s3) + 28}%;width:${(l(J.n21) - l(J.s3) - 28).toFixed(1)}%;background:var(--p3)">${I('snow')}</span>
<span class="nmz nm" data-nom style="left:${+l(J.s3) + 8}%;color:var(--ink)">NEIPA Test</span><span class="now" style="left:${l(J.n21)}%"></span><span class="tail hat" style="left:${l(J.n21)}%;right:-2px"></span>
<a class="hd5 ed" href="#edition" style="left:${l(J.s3)}%"></a><a class="hd5 ed" href="#edition" style="left:100%;border-style:dashed"></a></div>
<div class="fv5-dt"><span style="left:${+l(J.s3) + 4}%">3 sept.</span><span style="left:${l(J.n21)}%">J79</span><span style="left:96%;color:var(--mut)">?</span></div>
<div class="fv5-a"><a class="pr" href="#">Ouvrir ${I('chev')}</a><a href="#" aria-label="Budget">${I('wallet')}</a><a href="#" aria-label="Lier">${I('link')}</a>${E(`${I('receipt')}CHF ?`, 'q hat')}</div></div>`; })(),
    },
    vi: {
      edition: (() => { const l = L5(46, 236); return `<div class="fv5" data-fiche style="padding-top:28px">
<div class="fv5-zb" style="background:var(--fel);border-color:var(--fe)"><span class="fv5-ps" style="width:${l(J.n21)}%;border-radius:12px 0 0 12px"></span>
<span class="fv5-gh" style="left:${l(J.o12)}%;right:${(100 - l(J.f28)).toFixed(1)}%"></span>
<span class="seg" style="left:${l(J.s28)}%;width:${(l(J.f28) - l(J.s28)).toFixed(1)}%;background:var(--fe);top:8px;bottom:8px;border-radius:10px;opacity:.9"></span>
<span class="nmz nm" data-nom style="left:${+l(J.s28) + 8}%;top:16px;color:#fff">vi</span><span class="now" style="left:${l(J.n21)}%"></span>
<span class="hd5" style="left:${l(J.s28)}%;background:var(--act)"></span><span class="fv5-bb" style="left:${l(J.s28)}%;transform:translateX(-14px)">28 sept. · S40</span><span class="hd5" style="left:${l(J.f28)}%"></span></div>
<div class="fv5-ax" style="margin:0 10px">${[['oct.', 76], ['nov.', 107], ['déc.', 137], ['janv.', 168], ['févr.', 198]].map(([m, j]) => `<span style="left:${l(j)}%">${m}</span>`).join('')}</div>
<div class="fv5-a"><span style="height:44px;display:inline-flex;align-items:center;font-size:20px;font-weight:800;padding:0 6px">22 sem.</span><a href="#" aria-label="Lier">${I('link')}</a><a href="#" aria-label="Ranger sans date">${I('archive')}</a><a class="pr" href="#" style="margin-left:auto">${I('check')}</a></div></div>`; })(),
    },
    jhhh: {
      limite: (() => { const l = L5(33, 52); return `<div class="fv5" data-fiche>
<div class="fv5-ax"><span style="left:6%">sept.</span></div>
<div class="fv5-zb"><span class="seg" style="left:${l(J.s5)}%;width:${(l(J.s6) - l(J.s5)).toFixed(1)}%;background:var(--p1)">${I('wheat')}</span><span class="seg" style="left:${l(J.s6)}%;width:${(l(J.s15) - l(J.s6)).toFixed(1)}%;background:var(--p2)">${I('flask')}</span><span class="seg" style="left:${l(J.s15)}%;width:${(l(J.s20) - l(J.s15)).toFixed(1)}%;background:var(--p3)">${I('snow')}</span><span class="seg" style="left:${l(J.s20)}%;right:0;background:var(--p4);border-radius:0 12px 12px 0">${I('pkg')}</span>
<span class="seg" style="left:${l(J.s4) - 2}%;width:7%;background:var(--bad);top:-6px;bottom:-6px;border-radius:8px">${I('cart')}</span>
${[J.s5, J.s6, J.s15, J.s20].map((j) => `<a class="hd5 ed" href="#edition" style="left:${l(j)}%;width:12px;margin-left:-6px"></a>`).join('')}</div>
<div class="fv5-dt"><span style="left:${l(J.s4)}%;color:var(--bad)">4</span><span style="left:${+l(J.s5) + 3}%">5</span><span style="left:${+l(J.s6) + 3}%">6</span><span style="left:${l(J.s15)}%">15</span><span style="left:${l(J.s20)}%">20 sept.</span></div>
<div class="fv5-red">${I('cart')}<span class="ch">${I('hop')}target 11,3 %</span><span class="ch">${I('wheat')}maris otter</span><a class="cm" href="#">Commander</a></div>
<div class="fv5-a"><a class="pr" href="#"><span class="nm" data-nom>Jhhh</span> ${I('chev')}</a><a href="#" aria-label="Budget">${I('wallet')}</a><a href="#" aria-label="Lier">${I('link')}</a>${E(`${I('receipt')}CHF ?`, 'q hat')}</div></div>`; })(),
    },
  },
});

/* ───────────── v06 · Anneau du cycle ───────────── */
const ring = (segs, c = 'var(--card2)') => `conic-gradient(${segs.map(([col, a, b]) => `${col} ${a}% ${b}%`).join(',')},${c} 0)`;
V({
  id: 'v06', titre: 'v06 · Anneau du cycle', genre: 'Anneau', idee: 'Le cycle du brassin en anneau, J79 au centre ; la fin s’allonge en tirant l’anneau.',
  sel: { repos: 'neipa', edition: 'neipa', limite: 'jhhh' }, ov: { neipa: OV_NEIPA },
  css: `.fv6{display:grid;grid-template-columns:128px 1fr;gap:10px;background:var(--card);border-radius:18px;padding:10px;position:relative}
.fv6-x{position:absolute;right:6px;top:6px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:var(--mut)}
.fv6-rg{width:128px;height:128px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative}
.fv6-rg .in{width:94px;height:94px;border-radius:50%;background:var(--card);display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:800;font-size:26px}
.fv6-rg .in .ic{width:22px;height:22px}.fv6-rg .dsh{position:absolute;inset:0;border-radius:50%;border:3px dashed var(--line2);clip-path:polygon(50% 50%,0 0,0 50%,0 0,50% 0);}
.fv6-rg .hnd{position:absolute;width:26px;height:26px;border-radius:50%;background:var(--act);border:3px solid var(--card)}
.fv6-c{display:flex;flex-direction:column;gap:6px;padding-top:2px}.fv6-c .nm{font-size:19px;font-weight:800;padding-right:34px}
.fv6-l{display:flex;align-items:center;gap:8px;height:38px;border-radius:12px;background:var(--bg);padding:0 10px;font-weight:800;font-size:17px}
.fv6-l.q{border:1.5px dashed var(--line2);color:var(--mut);background:transparent}.fv6-l .ic{width:20px;height:20px}
.fv6-l small{font-size:14px;color:var(--mut);font-weight:600;margin-left:auto}
.fv6-a{grid-column:1/-1;display:flex;gap:6px}.fv6-a a{height:42px;border-radius:21px;display:inline-flex;align-items:center;gap:5px;padding:0 14px;font-weight:700;border:1.5px solid var(--line2)}.fv6-a a.pr{background:var(--act);color:var(--onact);border-color:var(--act);flex:1;justify-content:center}
.fv6-red{background:var(--badl);color:var(--bad)}.fv6-red .ch{color:var(--ink);font-size:14px;display:inline-flex;align-items:center;gap:2px}`,
  slots: {
    neipa: {
      repos: `<div class="fv6" data-fiche>${X('fv6-x')}<div class="fv6-rg" style="background:${ring([['var(--p1)', 0, 4], ['var(--p2)', 4, 22], ['var(--p3)', 22, 72]], 'transparent')},repeating-conic-gradient(var(--line2) 0 1.5%,var(--card2) 1.5% 3%)}"><span class="in"><span style="color:var(--p3)">${I('snow')}</span>J79</span></div>
<div class="fv6-c"><span class="nm" data-nom>NEIPA Test</span>${E(`${I('wheat', 'c-br')}3 sept.`, 'fv6-l')}${E(`${I('pkg')}?`, 'fv6-l q')}${E(`${I('receipt')}CHF ?<small>21 nov.</small>`, 'fv6-l q hat')}</div>
<div class="fv6-a"><a class="pr" href="#">Ouvrir ${I('chev')}</a><a href="#">${I('wallet')}Budget</a><a href="#">${I('link')}Lier</a></div></div>`,
      edition: `<div class="fv6" data-fiche>${X('fv6-x')}<div class="fv6-rg" style="background:${ring([['var(--p1)', 0, 3], ['var(--p2)', 3, 17], ['var(--p3)', 17, 79], ['var(--p4)', 79, 100]])}"><span class="in"><span style="color:var(--p4)">${I('pkg')}</span>J100</span><span class="hnd" style="left:51px;top:-1px"></span></div>
<div class="fv6-c"><span class="nm" data-nom>NEIPA Test</span><span class="fv6-l">${I('wheat', 'c-br')}3 sept.</span><span class="fv6-l" style="box-shadow:0 0 0 2px var(--p4)">${I('pkg', 'c-ve')}12 déc.<small>S50</small></span><span class="fv6-l q hat">${I('receipt')}CHF ?<small>21 nov.</small></span></div>
<div class="fv6-a"><a class="pr" href="#">Ouvrir ${I('chev')}</a><a href="#">${I('wallet')}Budget</a><a href="#">${I('link')}Lier</a></div></div>`,
    },
    jhhh: {
      limite: `<div class="fv6" data-fiche>${X('fv6-x')}<div class="fv6-rg" style="background:${ring([['var(--p1)', 0, 7], ['var(--p2)', 7, 60], ['var(--p3)', 60, 93], ['var(--p4)', 93, 100]])}"><span class="in" style="font-size:22px"><span class="c-ve">${I('check')}</span>15/15</span></div>
<div class="fv6-c"><span class="nm" data-nom>Jhhh</span>
<span style="display:flex;gap:4px;font-weight:800;font-size:15px">${E(`<span style="color:var(--p1)">${I('wheat')}</span>5`)}&nbsp;${E(`<span style="color:var(--p2)">${I('flask')}</span>6`)}&nbsp;${E(`<span style="color:var(--p3)">${I('snow')}</span>15`)}&nbsp;${E(`<span style="color:var(--p4)">${I('pkg')}</span>20`)}</span>
<span class="fv6-l fv6-red">${I('cart')}4 sept.<a href="#" style="margin-left:auto;background:var(--bad);color:#fff;border-radius:14px;padding:4px 10px">Commander</a></span>
<span style="display:flex;gap:6px;flex-wrap:wrap" class="fv6-red"><span class="ch">${I('hop', 'c-ve')}target 11,3 %</span><span class="ch">${I('wheat', 'c-br')}maris otter</span></span>
${E(`${I('receipt')}CHF ?<small>21 nov.</small>`, 'fv6-l q hat')}</div>
<div class="fv6-a"><a class="pr" href="#">Ouvrir ${I('chev')}</a><a href="#">${I('wallet')}Budget</a><a href="#">${I('link')}Lier</a></div></div>`,
    },
  },
});

/* ───────────── v07 · Ticket ───────────── */
V({
  id: 'v07', titre: 'v07 · Ticket', genre: 'Ticket détachable', idee: 'Un ticket : la souche colorée porte le chiffre clé, le corps les dates, le talon l’argent.',
  sel: { repos: 'neipa', edition: 'vi', limite: 'jhhh' }, ov: { vi: OV_VI_FIN },
  css: `.fv7{display:grid;grid-template-columns:86px 1fr 52px;min-height:150px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.18))}
.fv7-s{background:var(--br);color:#fff;border-radius:14px 0 0 14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-weight:800;font-size:28px;
 -webkit-mask:radial-gradient(circle 9px at 100% 0,transparent 98%,#000) top/100% 51% no-repeat,radial-gradient(circle 9px at 100% 100%,transparent 98%,#000) bottom/100% 51% no-repeat}
.fv7-s .ic{width:26px;height:26px}.fv7-s small{font-size:14px;font-weight:700;opacity:.9}
@media (prefers-color-scheme:dark){.fv7-s{color:#12100E}}
.fv7-b{background:var(--card);border-left:2px dashed var(--line2);padding:8px 10px;display:flex;flex-direction:column;gap:6px}
.fv7-b .nm{font-size:19px;font-weight:800}.fv7-d{font-size:23px;font-weight:800;display:flex;align-items:center;gap:6px}
.fv7-d .q{border:2px dashed var(--line2);border-radius:10px;padding:0 10px;color:var(--mut);font-size:20px}
.fv7-m{display:flex;align-items:center;gap:6px;white-space:nowrap;border-top:2px dashed var(--line2);padding-top:6px;font-size:15px}
.fv7-m .q{margin-left:auto;border:1.5px dashed var(--line2);border-radius:10px;padding:4px 10px;font-weight:800;color:var(--mut)}
.fv7-t{background:var(--card2);border-radius:0 14px 14px 0;display:flex;flex-direction:column}
.fv7-t a{flex:1;display:flex;align-items:center;justify-content:center;border-bottom:1.5px dashed var(--line2);min-height:44px}.fv7-t a:last-child{border-bottom:0}
.fv7-t a.pr{background:var(--act);color:var(--onact);border-radius:0 14px 0 0}
.fv7-fr{position:relative;height:54px;border:1.5px solid var(--line2);border-radius:10px;background:var(--bg);overflow:hidden}
.fv7-fr .b{position:absolute;top:12px;height:14px;border-radius:7px;background:var(--fe)}.fv7-fr .g{position:absolute;top:12px;height:14px;border-radius:7px;border:1.5px dashed var(--fe)}
.fv7-fr .h{position:absolute;top:5px;width:16px;height:28px;margin-left:-8px;border-radius:8px;background:var(--act);border:2px solid var(--bg)}
.fv7-fr .ml{position:absolute;bottom:2px;font-size:14px;color:var(--mut);transform:translateX(-50%)}.fv7-fr .pa{position:absolute;top:0;bottom:0;left:0;background:var(--past)}
.fv7-x{margin-top:6px;display:flex;align-items:center;gap:6px;background:var(--badl);color:var(--bad);border-radius:12px;padding:5px 8px;font-weight:700}
.fv7-x .ch{color:var(--ink);font-size:14px;display:inline-flex;align-items:center;gap:2px}.fv7-x .cm{margin-left:auto;background:var(--bad);color:#fff;border-radius:16px;height:36px;display:inline-flex;align-items:center;padding:0 10px}`,
  slots: {
    neipa: {
      repos: `<div class="fv7" data-fiche><div class="fv7-s">${I('snow')}J79<small>en garde</small></div>
<div class="fv7-b"><span class="nm" data-nom>NEIPA Test</span><div class="fv7-d">${I('wheat', 'c-br')}${E('3 sept.')}<span style="color:var(--mut)">→</span>${E(`${I('pkg')} ?`, 'q')}</div>
<div class="fv7-m">${I('receipt', 'c-pa')}emballage <b>21 nov.</b>${E('CHF ?', 'q hat')}</div></div>
<div class="fv7-t"><a class="pr" href="#" aria-label="Ouvrir le brassin">${I('chev')}</a><a href="#" aria-label="Budget">${I('wallet')}</a><a href="#" aria-label="Lier">${I('link')}</a></div></div>`,
    },
    vi: {
      edition: (() => { const l = (j) => (((j - 61) / (240 - 61)) * 100).toFixed(1); return `<div class="fv7" data-fiche><div class="fv7-s" style="background:var(--fe)">${I('party')}22<small>sem.</small></div>
<div class="fv7-b"><span class="nm" data-nom>vi</span><div class="fv7-d" style="font-size:19px">12 oct. → <span style="background:var(--act);color:var(--onact);border-radius:8px;padding:0 6px">14 mars</span></div>
<div class="fv7-fr"><span class="pa" style="width:${l(J.n21)}%"></span><span class="g" style="left:${l(J.o12)}%;width:${(l(J.f28) - l(J.o12)).toFixed(1)}%"></span><span class="b" style="left:${l(J.o12)}%;width:${(l(J.m14) - l(J.o12)).toFixed(1)}%"></span><span class="h" style="left:${l(J.o12)}%"></span><span class="h" style="left:${l(J.m14)}%"></span>
${[['nov.', 107], ['janv.', 168], ['mars', 226]].map(([m, j]) => `<span class="ml" style="left:${l(j)}%">${m}</span>`).join('')}</div></div>
<div class="fv7-t"><a class="pr" href="#" aria-label="Valider">${I('check')}</a><a href="#" aria-label="Lier">${I('link')}</a><a href="#" aria-label="Ranger sans date">${I('archive')}</a></div></div>`; })(),
    },
    jhhh: {
      limite: `<div data-fiche><div class="fv7"><div class="fv7-s" style="font-size:22px">${I('flask')}15/15<small>en cuve</small></div>
<div class="fv7-b"><span class="nm" data-nom>Jhhh</span><div class="fv7-d" style="font-size:16px;gap:8px">${E(`<span style="color:var(--p1)">${I('wheat')}</span>5`)}${E(`<span style="color:var(--p2)">${I('flask')}</span>6`)}${E(`<span style="color:var(--p3)">${I('snow')}</span>15`)}${E(`<span style="color:var(--p4)">${I('pkg')}</span>20 sept.`)}</div>
<div class="fv7-m">${I('receipt', 'c-pa')}emballage <b>21 nov.</b>${E('CHF ?', 'q hat')}</div>
</div>
<div class="fv7-t"><a class="pr" href="#" aria-label="Ouvrir le brassin">${I('chev')}</a><a href="#" aria-label="Budget">${I('wallet')}</a><a href="#" aria-label="Lier">${I('link')}</a></div></div>
<div class="fv7-x">${I('cart')}4 sept.<span class="ch">${I('hop')}target 11,3 %</span><span class="ch">maris otter</span><a class="cm" href="#">Commander</a></div></div>`,
    },
  },
});

/* ───────────── v08 · Étagère (cases type épicerie) ───────────── */
V({
  id: 'v08', titre: 'v08 · Étagère', genre: 'Cases type épicerie', idee: 'Chaque valeur est une case d’étagère, comme la vue stock « épicerie » : gros picto, gros chiffre.',
  sel: { repos: 'neipa', edition: 'jhhh', limite: 'jhhh' },
  css: `.fv8-h{display:flex;align-items:center;gap:8px;height:36px}.fv8-h .nm{font-size:19px;font-weight:800;flex:1}
.fv8-g{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;background:var(--card2);padding:6px;border-radius:14px;box-shadow:inset 0 -6px 0 var(--br)}
.fv8-c{height:78px;border-radius:10px;background:var(--bg);display:flex;flex-direction:column;justify-content:space-between;padding:7px 8px;font-weight:800;font-size:18px;border-top:5px solid var(--cc,var(--line2))}
.fv8-c .ic{width:26px;height:26px;color:var(--cc,var(--mut))}.fv8-c.q{border:2px dashed var(--line2);border-top-width:5px;color:var(--mut)}
.fv8-c.on{background:var(--cc);color:#fff}.fv8-c.on .ic{color:#fff}
@media (prefers-color-scheme:dark){.fv8-c.on{color:#12100E}.fv8-c.on .ic{color:#12100E}}
.fv8-c.pr{background:var(--act);color:var(--onact);border-top-color:var(--act)}.fv8-c.pr .ic{color:var(--onact)}
.fv8-c.rd{background:var(--badl);border-top-color:var(--bad)}.fv8-c.rd .ic{color:var(--bad)}.fv8-c.rd span{font-size:14px;line-height:1.1}
.fv8-c.cm{background:var(--bad);color:#fff;border-top-color:var(--bad)}.fv8-c.cm .ic{color:#fff}
.fv8-w{grid-column:span 3;position:relative;background:var(--bg);border-radius:10px;border-top:5px solid var(--p3);box-shadow:0 0 0 2px var(--p3);height:78px;padding:6px 8px}
.fv8-w .v{font-size:20px;font-weight:800;display:flex;align-items:center;gap:6px}.fv8-w .v .ic{color:var(--p3);width:24px;height:24px}
.fv8-w .dy{position:absolute;left:6px;right:6px;bottom:4px;display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
.fv8-w .dy span{height:26px;border-radius:6px;background:var(--card2);font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center}
.fv8-w .dy span.o{background:var(--p3);color:#fff}.fv8-w .dy span.p{background:var(--p2)}`,
  slots: {
    neipa: {
      repos: `<div data-fiche><div class="fv8-h"><span class="nm" data-nom>NEIPA Test</span>${X()}</div>
<div class="fv8-g">${E(`${I('wheat')}3 sept.`, 'fv8-c" style="--cc:var(--p1)')}<div class="fv8-c on" style="--cc:var(--p3)">${I('snow')}J79</div>${E(`${I('pkg')}?`, 'fv8-c q')}${E(`${I('receipt')}CHF ?`, 'fv8-c q hat')}
<a class="fv8-c pr" href="#" style="grid-column:span 2">${I('beer')}Ouvrir</a><a class="fv8-c" href="#">${I('wallet')}<span style="font-size:15px">Budget</span></a><a class="fv8-c" href="#">${I('link')}<span style="font-size:15px">Lier</span></a></div></div>`,
    },
    jhhh: {
      edition: `<div data-fiche><div class="fv8-h"><span class="nm" data-nom>Jhhh</span><b style="color:var(--mut)">J15/15</b>${X()}</div>
<div class="fv8-g"><div class="fv8-c" style="--cc:var(--p1)">${I('wheat')}5 sept.</div><div class="fv8-c" style="--cc:var(--p2)">${I('flask')}6 sept.</div><div class="fv8-c" style="--cc:var(--p4)">${I('pkg')}20 sept.</div><div class="fv8-c" style="--cc:var(--p4);opacity:.0"></div>
<div class="fv8-w" style="grid-column:1/-1"><span class="v">${I('snow')}17 sept.</span><span class="dy"><span>13</span><span>14</span><span class="p">15</span><span>16</span><span class="o">17</span><span>18</span><span>19</span></span></div></div></div>`,
      limite: `<div data-fiche><div class="fv8-h"><span class="nm" data-nom>Jhhh</span><b style="color:var(--mut)">J15/15</b>${X()}</div>
<div class="fv8-g">${E(`${I('wheat')}5 sept.`, 'fv8-c" style="--cc:var(--p1)')}${E(`${I('flask')}6 sept.`, 'fv8-c" style="--cc:var(--p2)')}${E(`${I('snow')}15 sept.`, 'fv8-c" style="--cc:var(--p3)')}${E(`${I('pkg')}20 sept.`, 'fv8-c" style="--cc:var(--p4)')}
<div class="fv8-c rd">${I('hop')}<span>target 11,3 %</span></div><div class="fv8-c rd">${I('wheat')}<span>maris otter</span></div><a class="fv8-c cm" href="#">${I('cart')}<span style="font-size:14px;line-height:1.1">Commander 4 sept.</span></a>${E(`${I('receipt')}CHF ?`, 'fv8-c q hat')}
<a class="fv8-c pr" href="#" style="grid-column:span 2;height:52px;flex-direction:row;align-items:center">${I('beer')}Ouvrir</a><a class="fv8-c" href="#" style="height:52px;align-items:center;justify-content:center">${I('wallet')}</a><a class="fv8-c" href="#" style="height:52px;align-items:center;justify-content:center">${I('link')}</a></div></div>`,
    },
  },
});

/* ───────────── v09 · Fil des dates ───────────── */
V({
  id: 'v09', titre: 'v09 · Fil des dates', genre: 'Fil vertical', idee: 'Les dates de la chose en fil vertical, de la plus ancienne à la prochaine ; on touche une date pour la régler.',
  sel: { repos: 'neipa', edition: 'neipa', limite: 'jhhh' }, ov: { neipa: OV_NEIPA },
  css: `.fv9{display:grid;grid-template-columns:1fr 50px;gap:8px;background:var(--card);border-radius:14px;padding:8px 8px 8px 10px;border-left:5px solid var(--br)}
.fv9-h{display:flex;align-items:center;gap:8px;height:30px}.fv9-h .nm{font-size:19px;font-weight:800}.fv9-h .j{background:var(--br);color:#fff;border-radius:9px;padding:1px 7px;font-weight:800}
.fv9-f{position:relative;margin-top:4px;padding-left:30px}
.fv9-f::before{content:"";position:absolute;left:12px;top:14px;bottom:14px;width:3px;background:var(--line2);border-radius:2px}
.fv9-r{position:relative;display:flex;align-items:center;gap:8px;height:36px;font-size:16px;font-weight:700}
.fv9-r .dt{min-width:64px;font-weight:800}.fv9-r .ic{width:20px;height:20px}
.fv9-r .dot{position:absolute;left:-26px;width:20px;height:20px;border-radius:50%;background:var(--cc,var(--line2));border:3px solid var(--card)}
.fv9-r.q .dot{background:var(--card);border:2.5px dashed var(--line2)}.fv9-r.q{color:var(--mut)}
.fv9-r.now .dot{box-shadow:0 0 0 3px var(--p3)}
.fv9-r .chf{margin-left:auto;border:1.5px dashed var(--line2);border-radius:9px;padding:3px 8px;color:var(--mut);font-weight:800}
.fv9-a{display:flex;flex-direction:column;gap:6px}.fv9-a a{height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--line2)}.fv9-a a.pr{background:var(--act);color:var(--onact);border-color:var(--act);height:56px}
.fv9-sl{position:relative;flex:1;height:30px;margin-right:4px}.fv9-sl .tr{position:absolute;left:0;right:0;top:13px;height:5px;border-radius:3px;background:var(--line2)}
.fv9-sl .fi{position:absolute;left:0;top:13px;height:5px;border-radius:3px;background:var(--p4)}.fv9-sl .th{position:absolute;top:3px;width:24px;height:24px;margin-left:-12px;border-radius:50%;background:var(--act);border:3px solid var(--card)}
.fv9-r.red{color:var(--bad)}.fv9-r .ch{display:inline-flex;align-items:center;gap:2px;font-size:14px;color:var(--ink)}
.fv9-r .cm{margin-left:auto;background:var(--bad);color:#fff;border-radius:16px;height:34px;display:inline-flex;align-items:center;padding:0 10px;font-size:15px}`,
  slots: {
    neipa: {
      repos: `<div class="fv9" data-fiche><div><div class="fv9-h"><span class="nm" data-nom>NEIPA Test</span><span class="j">J79</span></div>
<div class="fv9-f"><a class="fv9-r ed" href="#edition" style="--cc:var(--p1)"><span class="dot"></span><span class="dt">3 sept.</span>${I('wheat', 'c-br')}</a>
<a class="fv9-r ed now" href="#edition" style="--cc:var(--p3)"><span class="dot"></span><span class="dt">21 nov.</span><span style="color:var(--p3)">${I('snow')}</span><span style="color:var(--mut)">${I('receipt')}</span><span class="chf hat">CHF ?</span></a>
<a class="fv9-r ed q" href="#edition"><span class="dot"></span><span class="dt">?</span>${I('pkg')}</a></div></div>
<div class="fv9-a"><a class="pr" href="#" aria-label="Ouvrir le brassin">${I('chev')}</a><a href="#" aria-label="Budget">${I('wallet')}</a><a href="#" aria-label="Lier">${I('link')}</a></div></div>`,
      edition: `<div class="fv9" data-fiche><div><div class="fv9-h"><span class="nm" data-nom>NEIPA Test</span><span class="j">J100</span></div>
<div class="fv9-f"><div class="fv9-r" style="--cc:var(--p1)"><span class="dot"></span><span class="dt">3 sept.</span>${I('wheat', 'c-br')}</div>
<div class="fv9-r now" style="--cc:var(--p3)"><span class="dot"></span><span class="dt">21 nov.</span><span style="color:var(--p3)">${I('snow')}</span><span style="color:var(--mut)">${I('receipt')}</span><span class="chf hat">CHF ?</span></div>
<div class="fv9-r" style="--cc:var(--p4);height:48px"><span class="dot"></span><span class="dt c-ve">12 déc.</span><span class="fv9-sl"><span class="tr"></span><span class="fi" style="width:45%"></span><span class="th" style="left:45%"></span></span></div></div></div>
<div class="fv9-a"><a class="pr" href="#" aria-label="Valider">${I('check')}</a><a href="#" aria-label="Budget">${I('wallet')}</a><a href="#" aria-label="Lier">${I('link')}</a></div></div>`,
    },
    jhhh: {
      limite: `<div class="fv9" data-fiche><div><div class="fv9-h"><span class="nm" data-nom>Jhhh</span><span class="j">J15/15</span></div>
<div class="fv9-f"><div class="fv9-r red" style="--cc:var(--bad)"><span class="dot"></span><span class="dt">4 sept.</span>${I('cart')}<a class="cm" href="#">Commander</a></div>
<div class="fv9-r" style="height:28px;margin-top:-4px"><span class="ch">${I('hop', 'c-ve')}target 11,3 %</span><span class="ch">${I('wheat', 'c-br')}maris otter</span></div>
${[['5 sept.', 'wheat', 'p1'], ['6 sept.', 'flask', 'p2'], ['15 sept.', 'snow', 'p3'], ['20 sept.', 'pkg', 'p4']].map(([d, i, c]) => `<a class="fv9-r ed" href="#edition" style="--cc:var(--${c})"><span class="dot"></span><span class="dt">${d}</span><span style="color:var(--${c})">${I(i)}</span></a>`).join('')}
<a class="fv9-r ed" href="#edition" style="--cc:var(--line2)"><span class="dot"></span><span class="dt">21 nov.</span><span style="color:var(--mut)">${I('receipt')}</span><span class="chf hat">CHF ?</span></a></div></div>
<div class="fv9-a"><a class="pr" href="#" aria-label="Ouvrir le brassin">${I('chev')}</a><a href="#" aria-label="Budget">${I('wallet')}</a><a href="#" aria-label="Lier">${I('link')}</a></div></div>`,
    },
  },
});

/* ───────────── v10 · Bulle ancrée, édition sur la vraie barre ───────────── */
V({
  id: 'v10', titre: 'v10 · Bulle sur la barre', genre: 'Bulle ancrée', idee: 'Une petite bulle accrochée à la barre ; on règle les dates en tirant les poignées de la vraie barre.',
  sel: { repos: 'neipa', edition: 'vi', limite: 'jhhh' },
  ov: { vi: `<span class="st st-edition"><span class="ov" style="left:${x(J.f28)}px;width:${(x(J.m14) - x(J.f28)).toFixed(1)}px;background:var(--fe);opacity:.6"></span><span style="position:absolute;top:-4px;left:${x(J.o12) - 9}px;width:18px;height:36px;border-radius:9px;background:var(--bg);border:3px solid var(--ink)"></span><span style="position:absolute;top:-4px;left:${x(J.m14) - 9}px;width:18px;height:36px;border-radius:9px;background:var(--act);border:3px solid var(--bg)"></span></span>` },
  css: `.fv10{position:relative;display:inline-flex;flex-direction:column;gap:6px;background:var(--ink);color:var(--bg);border-radius:16px;padding:8px;margin-top:6px;max-width:100%}
.fv10::before{content:"";position:absolute;top:-8px;left:var(--ax,60px);border:8px solid transparent;border-top:0;border-bottom-color:var(--ink)}
.fv10 .r{display:flex;gap:6px;align-items:center}
.fv10 .c{height:40px;border-radius:12px;display:inline-flex;align-items:center;gap:5px;padding:0 10px;font-weight:800;font-size:17px;background:rgba(127,127,127,.28);white-space:nowrap}
.fv10 .c.q{border:1.5px dashed currentColor;background:transparent;opacity:.85}
.fv10 .i{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(127,127,127,.28)}
.fv10 .pr{background:var(--bg);color:var(--ink)}
.fv10 .red{background:var(--bad);color:#fff}
.fv10 .ch{display:inline-flex;align-items:center;gap:3px;font-size:15px;font-weight:700}`,
  slots: {
    neipa: {
      repos: `<div class="fv10" data-fiche style="--ax:${x(J.n21) - 16}px"><div class="r"><span class="c" style="background:var(--p3);color:#fff">${I('snow')}J79</span>${E(`${I('wheat')}3 sept. → ?`, 'c')}${E(`${I('receipt')}CHF ?`, 'c q hat')}</div>
<div class="r"><a class="c pr" href="#"><span class="nm" data-nom>NEIPA Test</span>${I('chev')}</a><a class="i" href="#" aria-label="Budget">${I('wallet')}</a><a class="i" href="#" aria-label="Lier">${I('link')}</a><a class="i" href="#" aria-label="Fermer">${I('x')}</a></div></div>`,
    },
    vi: {
      edition: `<div class="fv10" data-fiche style="--ax:${x(J.m14) - 16}px;margin-left:${x(J.o12) - 8}px"><div class="r"><span class="c" style="background:var(--fe);color:#fff">${I('party')}22 sem.</span><span class="c">S8 → <b style="background:var(--bg);color:var(--ink);border-radius:6px;padding:0 5px;margin-left:3px">S10</b></span></div>
<div class="r"><span class="c">12 oct. → 14 mars</span><a class="i" href="#" aria-label="Ranger sans date">${I('archive')}</a></div></div>`,
    },
    jhhh: {
      limite: `<div class="fv10" data-fiche style="--ax:${x(J.s20) + 30}px"><div class="r">${E(`<span style="color:var(--p1)">${I('wheat')}</span>5`, 'c')}${E(`<span style="color:var(--p2)">${I('flask')}</span>6`, 'c')}${E(`<span style="color:var(--p3)">${I('snow')}</span>15`, 'c')}${E(`<span style="color:var(--p4)">${I('pkg')}</span>20 sept.`, 'c')}</div>
<div class="r"><span class="c red">${I('cart')}4 sept.</span><span class="ch">${I('hop')}target 11,3 %</span><span class="ch">maris otter</span></div>
<div class="r"><a class="c red" href="#">${I('cart')}Commander</a>${E(`${I('receipt')}CHF ?`, 'c q hat')}<a class="i" href="#" aria-label="Lier">${I('link')}</a></div>
<div class="r"><a class="c pr" href="#" style="flex:1;justify-content:center"><span class="nm" data-nom>Jhhh</span>${I('chev')}</a><a class="i" href="#" aria-label="Budget">${I('wallet')}</a><a class="i" href="#" aria-label="Fermer">${I('x')}</a></div></div>`,
    },
  },
});

/* ───────────── v11 · Volet fixe (taille fixe) ───────────── */
const DOCK = (inner, k) => `<div class="st st-${k}"><div class="fv11" data-fiche>${inner}</div></div>`;
V({
  id: 'v11', titre: 'v11 · Volet fixe', genre: 'Volet de taille fixe', idee: 'Un volet de hauteur fixe au-dessus des onglets : la frise ne bouge jamais, quel que soit le contenu.',
  sel: { repos: 'neipa', edition: 'vi', limite: 'jhhh' }, ov: { vi: OV_VI_FIN }, slots: {},
  css: `.slot .fv11{display:none}#edition:target~.st-repos,#limite:target~.st-repos{display:none}#edition:target~.st-edition,#limite:target~.st-limite{display:block}
.fv11{position:fixed;left:6px;right:6px;bottom:60px;height:236px;background:var(--card);border-radius:18px 18px 12px 12px;box-shadow:0 -4px 18px rgba(0,0,0,.18);display:grid;grid-template-columns:92px 1fr;overflow:hidden;z-index:25}
.fv11-l{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#fff;font-weight:800;font-size:30px}
@media (prefers-color-scheme:dark){.fv11-l{color:#12100E}}
.fv11-l .ic{width:28px;height:28px}.fv11-l small{font-size:15px;font-weight:700}
.fv11-r{padding:8px 10px;display:flex;flex-direction:column;gap:6px;position:relative}
.fv11-r .nm{font-size:19px;font-weight:800}.fv11-x{position:absolute;right:4px;top:4px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:var(--mut)}
.fv11-row{display:flex;align-items:center;gap:6px;height:40px;font-size:18px;font-weight:800}
.fv11-row .q{border:2px dashed var(--line2);border-radius:10px;padding:2px 10px;color:var(--mut)}
.fv11-a{display:flex;gap:6px;margin-top:auto;padding-right:62px}.fv11-a a{height:44px;border-radius:22px;display:inline-flex;align-items:center;gap:5px;padding:0 12px;font-weight:700;border:1.5px solid var(--line2)}
.fv11-a a.pr{background:var(--act);color:var(--onact);border-color:var(--act)}
.fv11-fr{position:relative;height:62px;border:1.5px solid var(--line2);border-radius:12px;background:var(--bg);overflow:hidden}
.fv11-fr .b{position:absolute;top:12px;height:16px;border-radius:8px;background:var(--fe)}.fv11-fr .g{position:absolute;top:12px;height:16px;border-radius:8px;border:1.5px dashed var(--fe)}
.fv11-fr .h{position:absolute;top:6px;width:16px;height:28px;margin-left:-8px;border-radius:8px;background:var(--act);border:2px solid var(--bg)}
.fv11-fr .ml{position:absolute;bottom:3px;font-size:14px;color:var(--mut);transform:translateX(-50%)}.fv11-fr .pa{position:absolute;top:0;bottom:0;left:0;background:var(--past)}
.fv11-red{display:flex;align-items:center;gap:5px;background:var(--badl);color:var(--bad);border-radius:12px;padding:4px 6px;font-weight:700}.fv11-red .ch{color:var(--ink);font-size:14px;display:inline-flex;align-items:center;gap:2px}
.fv11-red .cm{margin-left:auto;background:var(--bad);color:#fff;border-radius:16px;height:34px;display:inline-flex;align-items:center;padding:0 9px}`,
  dock: (() => {
    const l = (j) => (((j - 61) / (240 - 61)) * 100).toFixed(1);
    return DOCK(`<div class="fv11-l" style="background:var(--br)">${I('snow')}J79<small>en garde</small></div><div class="fv11-r">${X('fv11-x')}<span class="nm" data-nom>NEIPA Test</span>
<div class="fv11-row">${I('wheat', 'c-br')}${E('3 sept.')}<span style="color:var(--mut)">→</span>${E(`${I('pkg')} ?`, 'q')}</div>
<div class="fv11-row" style="font-size:16px">${I('receipt', 'c-pa')}emballage 21 nov.${E('CHF ?', 'q hat')}</div>
<div class="fv11-a"><a class="pr" href="#">Ouvrir ${I('chev')}</a><a href="#" aria-label="Budget">${I('wallet')}</a><a href="#" aria-label="Lier">${I('link')}</a></div></div>`, 'repos')
    + DOCK(`<div class="fv11-l" style="background:var(--fe)">${I('party')}22<small>sem.</small></div><div class="fv11-r">${X('fv11-x')}<span class="nm" data-nom>vi</span>
<div class="fv11-row">12 oct. → <span style="background:var(--act);color:var(--onact);border-radius:8px;padding:0 6px">14 mars</span></div>
<div class="fv11-fr"><span class="pa" style="width:${l(J.n21)}%"></span><span class="g" style="left:${l(J.o12)}%;width:${(l(J.f28) - l(J.o12)).toFixed(1)}%"></span><span class="b" style="left:${l(J.o12)}%;width:${(l(J.m14) - l(J.o12)).toFixed(1)}%"></span><span class="h" style="left:${l(J.o12)}%"></span><span class="h" style="left:${l(J.m14)}%"></span>
${[['oct.', 76], ['déc.', 137], ['févr.', 198]].map(([m, j]) => `<span class="ml" style="left:${l(j)}%">${m}</span>`).join('')}</div>
<div class="fv11-a"><a href="#" aria-label="Lier">${I('link')}</a><a href="#" aria-label="Ranger sans date">${I('archive')}</a></div></div>`, 'edition')
    + DOCK(`<div class="fv11-l" style="background:var(--br);font-size:24px">${I('flask')}15/15<small>en cuve</small></div><div class="fv11-r">${X('fv11-x')}<span class="nm" data-nom>Jhhh</span>
<div class="fv11-row" style="font-size:15px;gap:9px">${E(`<span style="color:var(--p1)">${I('wheat')}</span>5`)}${E(`<span style="color:var(--p2)">${I('flask')}</span>6`)}${E(`<span style="color:var(--p3)">${I('snow')}</span>15`)}${E(`<span style="color:var(--p4)">${I('pkg')}</span>20 sept.`)}</div>
<div class="fv11-red">${I('cart')}4 sept.<span class="ch">${I('hop')}target</span><span class="ch">maris otter</span><a class="cm" href="#">Commander</a></div>
<div class="fv11-row" style="font-size:16px;height:30px">${I('receipt', 'c-pa')}21 nov.${E('CHF ?', 'q hat')}</div>
<div class="fv11-a"><a class="pr" href="#">Ouvrir ${I('chev')}</a><a href="#" aria-label="Lier">${I('link')}</a></div></div>`, 'limite');
  })(),
});
// le volet fixe porte le même contenu en paysage
VERSIONS[10].slots = { neipa: { repos: VERSIONS[10].dock.split('<div class="st st-edition">')[0].replace('<div class="st st-repos">', '').replace('class="fv11"', 'class="fv11" style="position:static"') } };
VERSIONS[10].sel = { ...VERSIONS[10].sel };

/* ───────────── v12 · Jauges de cuve ───────────── */
V({
  id: 'v12', titre: 'v12 · Jauges de cuve', genre: 'Jauges', idee: 'Le brassin en cuve : les jours montent dans la jauge ; la fin se règle en tirant le niveau.',
  sel: { repos: 'neipa', edition: 'neipa', limite: 'jhhh' }, ov: { neipa: OV_NEIPA },
  css: `.fv12{background:var(--card);border-radius:14px;padding:8px 10px;display:grid;grid-template-columns:auto 1fr;gap:6px 12px}
.fv12-h{grid-column:1/-1;display:flex;align-items:center;gap:8px;height:30px}.fv12-h .nm{font-size:19px;font-weight:800;flex:1}
.fv12-gs{display:flex;gap:10px;align-items:flex-end}
.fv12-g{display:flex;flex-direction:column;align-items:center;gap:3px;font-weight:800;font-size:16px}
.fv12-t{position:relative;width:58px;height:120px;border-radius:12px 12px 16px 16px;border:2.5px solid var(--line2);background:var(--bg);overflow:hidden}
.fv12-t .lv{position:absolute;left:0;right:0;bottom:0}.fv12-t .q{position:absolute;left:0;right:0;top:0;border-bottom:2px dashed var(--line2)}
.fv12-t .tx{position:absolute;left:0;right:0;text-align:center;font-weight:800;font-size:17px;color:#fff}
.fv12-t .tq{position:absolute;left:0;right:0;top:6px;text-align:center;font-weight:800;font-size:18px;color:var(--mut)}
.fv12-t .ic{position:absolute;left:50%;margin-left:-9px}
.fv12-hnd{position:absolute;left:-4px;right:-4px;height:10px;border-radius:5px;background:var(--act)}
.fv12-c{display:flex;flex-direction:column;gap:6px;justify-content:flex-end}
.fv12-c a,.fv12-c span.l{height:42px;border-radius:12px;display:flex;align-items:center;gap:6px;padding:0 10px;font-weight:700;border:1.5px solid var(--line2)}
.fv12-c a.pr{background:var(--act);color:var(--onact);border-color:var(--act);justify-content:center}
.fv12-red{background:var(--badl);border-color:var(--bad)!important;color:var(--bad)}.fv12-red .ch{color:var(--ink);font-size:14px}`,
  slots: {
    neipa: {
      repos: `<div class="fv12" data-fiche><div class="fv12-h"><span class="nm" data-nom>NEIPA Test</span>${X()}</div>
<div class="fv12-gs"><a class="fv12-g ed" href="#edition"><span class="fv12-t"><span class="q hat" style="height:34%"></span><span class="tq">?</span><span class="lv" style="height:66%;background:linear-gradient(0deg,var(--p1) 0 5%,var(--p2) 5% 24%,var(--p3) 24%)"></span><span class="tx" style="bottom:40%">J79</span></span><span class="c-br">${I('wheat')}</span></a>
<a class="fv12-g ed" href="#edition"><span class="fv12-t hat" style="border-style:dashed"><span class="tq" style="top:40%">?</span></span><span>CHF</span></a></div>
<div class="fv12-c"><span class="l">${I('wheat', 'c-br')}<b>3 sept.</b></span><span class="l">${I('receipt', 'c-pa')}<b>21 nov.</b></span><a class="pr" href="#">Ouvrir ${I('chev')}</a><span style="display:flex;gap:6px"><a href="#" style="flex:1;justify-content:center" aria-label="Budget">${I('wallet')}</a><a href="#" style="flex:1;justify-content:center" aria-label="Lier">${I('link')}</a></span></div></div>`,
      edition: `<div class="fv12" data-fiche><div class="fv12-h"><span class="nm" data-nom>NEIPA Test</span>${X()}</div>
<div class="fv12-gs"><span class="fv12-g"><span class="fv12-t" style="overflow:visible;border-color:var(--p4)"><span class="lv" style="height:100%;border-radius:9px 9px 13px 13px;background:linear-gradient(0deg,var(--p1) 0 4%,var(--p2) 4% 19%,var(--p3) 19% 79%,var(--p4) 79%)"></span><span class="fv12-hnd" style="top:-6px"></span><span class="tx" style="bottom:42%">J100</span></span><span class="c-ve">${I('pkg')}</span></span>
<span class="fv12-g"><span class="fv12-t hat" style="border-style:dashed"><span class="tq" style="top:40%">?</span></span><span>CHF</span></span></div>
<div class="fv12-c"><span class="l">${I('wheat', 'c-br')}<b>3 sept.</b></span><span class="l" style="box-shadow:0 0 0 2px var(--p4)">${I('pkg', 'c-ve')}<b>12 déc.</b><span style="color:var(--mut);margin-left:auto">S50</span></span><a class="pr" href="#">${I('check')}</a></div></div>`,
    },
    jhhh: {
      limite: `<div class="fv12" data-fiche><div class="fv12-h"><span class="nm" data-nom>Jhhh</span><b style="color:var(--mut)">en cuve</b>${X()}</div>
<div class="fv12-gs"><a class="fv12-g ed" href="#edition"><span class="fv12-t"><span class="lv" style="height:100%;background:linear-gradient(0deg,var(--p1) 0 7%,var(--p2) 7% 67%,var(--p3) 67% 93%,var(--p4) 93%)"></span><span class="tx" style="bottom:42%">15/15</span></span><span style="font-size:14px">5→20 sept.</span></a>
<a class="fv12-g ed" href="#edition"><span class="fv12-t" style="border-color:var(--bad)"><span class="lv" style="height:0"></span><span class="tq" style="top:40%;color:var(--bad)">0/2</span></span><span style="color:var(--bad)">${I('cart')}</span></a>
<a class="fv12-g ed" href="#edition"><span class="fv12-t hat" style="border-style:dashed;width:44px"><span class="tq" style="top:40%">?</span></span><span>CHF</span></a></div>
<div class="fv12-c"><span class="l fv12-red">${I('hop', 'c-ve')}<span class="ch">target 11,3 %</span></span><span class="l fv12-red">${I('wheat', 'c-br')}<span class="ch">maris otter</span></span><a class="pr" href="#" style="background:var(--bad);border-color:var(--bad);color:#fff">${I('cart')}Commander · 4 sept.</a><a class="pr" href="#">Ouvrir ${I('chev')}</a></div></div>`,
    },
  },
});
