#!/usr/bin/env node
// Voie l2b-valider (02.11, D313) : son choix 2 D avec deux lignes pas retrouvées, « Tout valider » et un à un, en mini maquettes.
// Socle : choix-lignes-38/outils/gen.mjs recopié (ecran() inchangée). Usage (racine) : node <ce fichier> [--sans-captures] ;
// HAUT=700 node <ce fichier> --identite (d-lue) ; HAUT=780 node <ce fichier> --identite-2d (sa maquette 2 D).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOSSIER = path.resolve(ICI, '..');
const RACINE = path.resolve(DOSSIER, '..', '..', '..', '..');
const MAQ = path.join(DOSSIER, 'maquettes');
const IMG = path.join(DOSSIER, 'img');
fs.mkdirSync(MAQ, { recursive: true });
fs.mkdirSync(IMG, { recursive: true });
const HAUT = Number(process.env.HAUT || 860);

const CSS = `
:root{--c950:#fff;--c900:#f5f5f5;--c850:#ebebeb;--c800:#ddd;--c700:#bfbfbf;--c600:#9e9e9e;--c400:#666;--c200:#333;--c50:#111;
--att:rgb(156 112 32);--attT:rgb(127 91 16);--gold:#E0A02E;--hop:rgb(63 107 46);--lev:rgb(47 98 150);--suc:#c8742c;--rouge:#b3261e;--vise:#2d5f8a}
*{box-sizing:border-box}
body{margin:0;width:390px;height:${HAUT}px;background:#fff;color:var(--c50);font:14px/1.25 "Source Sans 3",system-ui,"Segoe UI",sans-serif;overflow:hidden;position:relative}
body.gris{background:var(--c900)}
.m{font-family:"IBM Plex Mono",ui-monospace,Consolas,monospace;font-variant-numeric:tabular-nums}
.cl-h{display:flex;align-items:center;gap:4px;height:40px;border-bottom:1px solid var(--c800);padding:0 4px;background:#fff}
.cl-h h2{flex:1;margin:0;font-size:16px;font-weight:600}
.cl-ic{width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:var(--c200);border-radius:10px}
.cl-vise{outline:2.5px solid var(--vise);outline-offset:2px}
/* état « lecture » d'aujourd'hui */
.cl-lect{margin:8px;border:1px solid var(--c800);border-radius:14px;background:rgb(245 245 245/.6);padding:5px 10px 7px;display:grid;gap:4px}
.cl-lect .nom{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.cl-lect .nom b{font-size:16px;font-weight:600}
.cl-lect .nom span{font-size:12px;color:var(--c400)}
.cl-frise{display:flex;gap:6px;font-size:12px;color:var(--c400)}
.cl-frise span{flex:1;display:flex;flex-direction:column;gap:3px}
.cl-frise i{display:block;height:6px;border-radius:10px;background:var(--c800)}
.cl-frise .f1{color:var(--c200)} .cl-frise .f1 i{background:var(--c200)}
.cl-frise .f2{color:var(--c50);font-weight:600} .cl-frise .f2 i{background:repeating-linear-gradient(90deg,#333 0 6px,#ddd 6px 12px)}
.cl-arrivent{margin:0 8px;height:118px;border:1px dashed var(--c600);border-radius:14px;display:flex;align-items:center;justify-content:center;color:var(--c400);font-size:14px}
.cl-ligne{margin:0 12px;display:flex;min-height:36px;align-items:center;border-bottom:1px solid var(--c800);font-size:14px;color:var(--c200)}
.cl-ligne em{margin-left:auto;font-style:normal;font-size:12px;color:var(--c400)}
/* la marque « vérification en cours » (D, E) : la frise d'aujourd'hui, réduite à un fil sous l'en-tête */
.cl-fil{display:flex;align-items:center;gap:6px;height:22px;padding:0 10px;font-size:12px;color:var(--c50);font-weight:600;background:#fff;border-bottom:1px solid var(--c800)}
.cl-fil i{display:block;height:4px;border-radius:4px;background:var(--c200);width:36px}
.cl-fil i.cours{width:96px;background:repeating-linear-gradient(90deg,#333 0 6px,#ddd 6px 12px)}
/* dépense lue */
.cl-band{margin:8px 8px 0;border:1px solid var(--c800);border-radius:14px;background:rgb(245 245 245/.4);padding:5px 10px 7px;display:grid;gap:4px}
.cl-band .r1{display:flex;align-items:baseline;justify-content:space-between}
.cl-band .r1 b{font-size:16px;font-weight:600}
.cl-band .r1 span{font-size:14px;color:var(--c200);border-bottom:1px dashed var(--c600)}
.cl-band .r2{display:flex;align-items:center;gap:8px}
.cl-band .tot{font-size:28px;font-weight:600;line-height:1.1}
.cl-chip{margin-left:auto;min-height:28px;border:1px solid var(--c700);border-radius:10px;padding:0 8px;display:inline-flex;align-items:center;gap:4px;font-size:14px;color:var(--c200);background:#fff}
.cl-barre{display:flex;height:10px;border:1px solid var(--c800);border-radius:999px;overflow:hidden}
.cl-barre i{display:block;height:100%;border-right:1.5px solid #fff}
.cl-preuve{margin:6px 8px 0;border:1px solid var(--c800);border-radius:14px;padding:2px 8px 6px;display:grid;grid-template-columns:1.12fr 1fr;column-gap:8px}
.cl-preuve .rg{display:flex;align-items:center;gap:4px;min-height:26px;border-bottom:1px solid var(--c800);font-size:14px;color:var(--c200)}
.cl-preuve .rg b{margin-left:auto;font-weight:500;color:var(--c50)}
.cl-preuve .pu{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px;padding-top:6px}
.cl-pu{display:inline-flex;align-items:center;gap:4px;min-height:24px;padding:0 7px;border-radius:999px;font-size:13px;color:var(--c200);border:1px solid transparent}
.cl-pu b{font-weight:600}
.cl-pu.j{border:1.5px dashed var(--att);color:var(--attT);background:rgb(224 160 46/.08)}
.cl-pu.r{border:1.5px dashed var(--rouge);color:var(--rouge);background:rgb(179 38 30/.06)}
.cl-pu.c{border:1.5px solid var(--vise);color:var(--vise);background:rgb(45 95 138/.08)}
.cl-pts{display:inline-flex;gap:3px;align-items:center;margin-left:auto}
.cl-pts i{width:8px;height:8px;border-radius:50%;background:var(--c200)}
.cl-pts i.att{background:none;border:1.5px dashed var(--c200)}
.cl-duo{margin:6px 8px 0;display:grid;grid-template-columns:1fr 1fr;gap:6px}
.cl-duo div{border:1px solid var(--c800);border-radius:14px;padding:3px 8px 5px;font-size:12px;color:var(--c400);display:grid;gap:1px}
.cl-duo div b{font-size:14px;font-weight:500;color:var(--c50)}
.cl-bande{display:flex;align-items:center;gap:6px;height:28px;padding:0 10px}
.cl-bande strong{font-weight:600}
.cl-pt{width:10px;height:10px;border-radius:50%}
.cl-nb{border:1px solid var(--c600);background:#fff;border-radius:10px;padding:0 6px;font-size:12px;line-height:18px;color:var(--c200)}
.cl-bande .q{margin-left:auto;margin-right:57px;font-size:12px;font-weight:600;color:var(--c200)}
.cl-bande .t{min-width:54px;text-align:right;font-weight:600}
.cl-li{display:flex;align-items:center;gap:6px;min-height:28px;padding:0 10px;border-bottom:1px solid var(--c800);border-left:4px solid var(--gold)}
.cl-li.haute{min-height:40px}
.cl-li .n{flex:1;min-width:0;font-size:14px;display:flex;flex-direction:column;line-height:1.15}
.cl-li .n small{font-size:12px;color:var(--c400)}
.cl-li .n s{font-size:12px;color:var(--c400)}
.cl-dq{flex:none;min-width:94px;display:inline-grid;grid-template-columns:minmax(37px,max-content) 7px 44px;column-gap:3px;font-size:12px;color:var(--c400);white-space:nowrap;align-items:center}
.cl-dq b{text-align:right;font-weight:600} .cl-dq i{font-style:normal;text-align:center}
.cl-dq .j{border:1.5px dashed var(--att);border-radius:6px;padding:0 3px;color:var(--attT)}
.cl-dq .r{border:1.5px dashed var(--rouge);border-radius:6px;padding:0 3px;color:var(--rouge)}
.cl-dq .c{background:rgb(45 95 138/.14);border-radius:6px;padding:0 3px;color:var(--vise)}
.cl-mt{width:54px;flex:none;text-align:right;font-size:14px}
.cl-pied{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;gap:8px;padding:8px;border-top:1px solid var(--c800);background:#fff}
.cl-seg{display:inline-flex;border:1px solid var(--c600);border-radius:10px;overflow:hidden}
.cl-seg span{min-height:28px;display:flex;align-items:center;padding:0 10px;font-size:14px;color:var(--c200)}
.cl-seg span.on{background:#111;color:#fff;font-weight:600}
.cl-conf{margin-left:auto;height:36px;border-radius:10px;background:#111;color:#fff;font-weight:600;font-size:15px;display:flex;align-items:center;gap:8px;padding:0 22px}
.cl-conf.attente{background:var(--c700);color:#fff}
.cl-conf.gris{background:#a6a6a6;height:36px;padding:0 18px}
`;

const svg = (d, s = 20, sw = 2, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const X = svg('<path d="M18 6 6 18M6 6l12 12"/>');
const DOC = svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>');
const CHECK = (s = 14, c = 'rgb(63 107 46)') => svg('<path d="M20 6 9 17l-5-5"/>', s, 2.2, c);
const ALERTE = svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>', 16, 2, 'var(--rouge)');
const REPRIS = svg('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>', 14, 2.2);
const ROUE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="rgb(255 255 255/.45)" stroke-width="3"/><path d="M12 3a9 9 0 0 1 9 9" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`;
const CUBE = `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#111" stroke-width="1.67" style="flex:none"><path d="M10 2.5 17 6v8l-7 3.5L3 14V6z"/><path d="M3 6l7 3.5L17 6M10 9.5v8"/><circle cx="15" cy="15" r="4.6" fill="#111" stroke="none"/><path d="M12.8 15.1l1.6 1.6 2.9-3" stroke="#fff"/></svg>`;
const CUBE_P = `<svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M10 2.5 17 6v8l-7 3.5L3 14V6z"/><path d="M3 6l7 3.5L17 6M10 9.5v8"/></svg>`;

const tete = (vise = false) => `<header class="cl-h"><span class="cl-ic">${X}</span><h2>Nouvelle dépense</h2><span class="cl-ic">${DOC}</span></header>`;

// ---------------------------------------------------------------------------------------------------------------------------
// Voie l2-lignes (02.11, D310) : ce qui précède est le socle de choix-lenteur/outils/gen.mjs, recopié tel quel (CSS, icônes,
// en-tête), seule la hauteur passe de 700 à 780 px (le bandeau de D ne cache aucune rangée) (HAUT=700 pour la preuve d'identité). Ce qui suit est neuf, préfixé l38-.
// ---------------------------------------------------------------------------------------------------------------------------

// Le thème sombre : les jetons « cave » de src/theme/themes.css, posés sur les variables du socle ; le clair n'est pas touché.
const SOMBRE = `
body.sombre{--c950:rgb(18 16 14);--c900:rgb(26 22 19);--c850:rgb(34 29 25);--c800:rgb(44 37 33);--c700:rgb(61 52 46);--c600:rgb(87 74 66);--c400:rgb(154 138 126);--c200:rgb(216 206 197);--c50:rgb(245 240 234);
--att:rgb(227 181 93);--attT:rgb(227 181 93);--hop:rgb(110 155 91);--lev:rgb(134 185 230);--rouge:rgb(214 69 61);--vise:rgb(134 185 230);background:var(--c950);color:var(--c50)}
.sombre .cl-h,.sombre .cl-pied{background:var(--c950)}
.sombre .cl-band{background:var(--c900)}
.sombre .cl-chip,.sombre .cl-nb{background:var(--c900)}
.sombre .cl-barre i{border-right-color:var(--c950)}
.sombre .cl-conf{background:var(--c50);color:var(--c950)}
.sombre .cl-seg span.on{background:var(--c50);color:var(--c950)}
.sombre .cl-dq .c{background:rgb(134 185 230/.2)}
.sombre .cl-pu.c{background:rgb(134 185 230/.12)}
.sombre .cl-pu.j{background:rgb(227 181 93/.1)}
.sombre .cl-pu.r{background:rgb(214 69 61/.1)}
`;
// Les formes neuves (préfixe l38-, L26).
const L38 = `
.l38-neuve{background:rgb(45 95 138/.14)}
.l38-neuve .cl-dq,.l38-neuve .cl-dq b,.l38-neuve .cl-mt{color:var(--vise)}
.sombre .l38-neuve{background:rgb(134 185 230/.16)}
.l38-nc{background:rgb(45 95 138/.14);border-radius:6px;padding:0 3px;color:var(--vise);align-self:flex-start}
.l38-mc{background:rgb(45 95 138/.14);border-radius:6px;padding:0 3px;color:var(--vise)}
.cl-li .n .l38-neu{display:inline-flex;align-items:center;gap:3px;font-size:12px;color:var(--vise);font-weight:600}
.l38-pas.haute{padding-top:4px;padding-bottom:2px}
/* Reprise 1 (e-t13) : le pointillé commence après le filet de famille (pseudo-élément dans la boîte de remplissage). */
.l38-pas{position:relative;background:rgb(224 160 46/.06)}
.l38-pas::after{content:"";position:absolute;top:1px;right:1px;bottom:1px;left:0;border:1.5px dashed var(--att);pointer-events:none}
.l38-neuve .n{color:var(--vise)}
.l38-neuve .n small{color:var(--vise)}
.l38-ic{display:inline-flex;vertical-align:-2px;margin-right:3px;color:var(--vise)}
.l38-ligne2{display:flex;align-items:center;gap:6px;padding:2px 0 3px}
.l38-ligne2 .l38-ib{width:24px;height:24px}
.sombre .l38-pas{background:rgb(227 181 93/.07)}
.l38-barre .n>span:first-child,.l38-barre .cl-dq,.l38-barre .cl-mt{text-decoration:line-through;color:var(--c400)}
.l38-barre .cl-dq b{color:var(--c400)}
.l38-barre svg{opacity:.45}
.l38-gestes{display:flex;gap:6px;padding:3px 0 4px}
.l38-ch{display:inline-flex;align-items:center;gap:4px;min-height:26px;padding:0 10px;border:1px solid var(--c600);border-radius:999px;font-size:13px;font-weight:600;color:var(--c50);background:var(--c950,#fff);text-decoration:none}
.l38-ch svg{opacity:1!important}
.cl-li .n .l38-nr{font-size:12px;color:var(--attT);font-weight:600}
.l38-ib{flex:none;width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--c600);border-radius:8px;color:var(--c50);background:#fff}
.l38-ib+.l38-ib{margin-left:-2px}
.l38-band{position:absolute;left:8px;right:8px;bottom:61px;display:flex;align-items:center;gap:6px;min-height:40px;padding:4px 6px 4px 10px;border:1.5px dashed var(--att);border-radius:12px;background:linear-gradient(rgb(224 160 46/.1),rgb(224 160 46/.1)),#fff;box-shadow:0 2px 10px rgb(0 0 0/.12)}
.l38-band .q{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15}
.l38-band .q b{font-size:14px;font-weight:600}
.l38-band .q small{font-size:12px;color:var(--attT);font-weight:600}
.l38-band .l38-ch{min-height:28px}
.l38-band .l38-ch.oui{background:#111;color:#fff;border-color:#111}
.sombre .l38-band{background:linear-gradient(rgb(227 181 93/.12),rgb(227 181 93/.12)),rgb(26 22 19)}
.sombre .l38-band .l38-ch.oui{background:var(--c50);color:var(--c950);border-color:var(--c50)}
.sombre .l38-ib{background:var(--c950)}
`;
const ATT_IC = svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>', 14, 2.2, 'var(--att)');
const GARDE = svg('<path d="M20 6 9 17l-5-5"/>', 14, 2.4);
const RETIRE = svg('<path d="M18 6 6 18M6 6l12 12"/>', 13, 2.4);
const REPRIS12 = svg('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>', 12, 2.4);

// L'écran « lue » de sa maquette (choix-lenteur/maquettes/d-lue.html), écrit par la même fonction que depense() du socle,
// avec ses données en paramètres. `ligne` reprend la rangée du socle, et accepte la forme de la ligne du cas :
// cls (classe de rangée), nomHtml (le nom), apres (sous le nom), mtHtml (le montant), fin (après le montant),
// compte (false : rangée visible mais hors des sommes et de la barre).
const cell = (txt, k) => k ? `<b class="${k}">${txt}</b>` : `<b>${txt}</b>`;
const ligne = ({ nom, sous = '', q, qk, p, pk, m, c, vieux = '', cls = '', nomHtml, apres = '', mtHtml, fin = '', haute }) => `<div class="cl-li${vieux || haute ? ' haute' : ''}${cls ? ' ' + cls : ''}" style="border-left-color:${c}">${CUBE}`
  + `<span class="n">${nomHtml ?? `<span>${nom}${sous ? ` <small class="m">${sous}</small>` : ''}</span>`}${vieux ? `<s class="m">${vieux}</s>` : ''}${apres}</span>`
  + `<span class="cl-dq m">${cell(q, qk)}<i>×</i><span${pk ? ` class="${pk}"` : ''}>${p}</span></span>${mtHtml ?? `<span class="cl-mt m">${m}</span>`}${fin}</div>`;

const BASE = () => ({
  pilsner: { nom: 'Malt Pilsner', q: '5 Kg', p: '2,90', m: '14,50', qk: 'c', pk: 'c', vieux: '10 Kg × 1,45' },
  munich: { nom: 'Malt de Munich', q: '4 Kg', p: '1,80', m: '7,20' },
  carapils: { nom: 'Carapils', q: '1 Kg', qk: 'j', p: '2,40', m: '2,40' },
  sabro: { nom: 'Sabro', sous: 'α 13,4', q: '30 g', qk: 'c', p: '0,070', m: '2,10', vieux: '30 ?' },
  citra: { nom: 'Citra', sous: 'α 12,5', q: '50 g', qk: 'c', p: '0,090', m: '4,50', vieux: '50 ?' },
  levure: { nom: 'Levure Ale sèche', q: '2 sachets', qk: 'j', p: '4,90', m: '9,80' },
  sucre: { nom: 'Sucre candi', q: '1 ?', qk: 'r', p: '5,90', m: '5,90' },
});

function ecran(o) {
  const L = BASE();
  const bandes = [
    { g: 'Malts', c: 'var(--gold)', t: 'rgb(224 160 46/.22)', q: '10 Kg', s: '24,10', r: [L.pilsner, L.munich, L.carapils] },
    { g: 'Houblons', c: 'var(--hop)', t: 'rgb(63 107 46/.2)', q: '80 g', s: '6,60', r: [L.sabro, L.citra] },
    { g: 'Levures', c: 'var(--lev)', t: 'rgb(47 98 150/.2)', q: '2 sachets', s: '9,80', r: [L.levure] },
    { g: 'Sucres', c: 'var(--suc)', t: 'rgb(200 116 44/.2)', q: '1 ?', s: '5,90', r: [L.sucre] },
  ];
  if (o.ajout) { const b = bandes[o.ajout.bande]; b.r.push(o.ajout.ligne); Object.assign(b, o.ajout.maj ?? {}); }
  const corps = bandes.map((b) => `<div class="cl-bande" style="background:linear-gradient(${b.t},${b.t}),#fff"><i class="cl-pt" style="background:${b.c}"></i><strong>${b.g}</strong><span class="cl-nb m">${b.n ?? b.r.length}</span><span class="q m">${b.q}</span><span class="t m">${b.s}</span></div>`
    + b.r.map((r) => ligne({ ...r, c: b.c })).join('')).join('');
  const barre = bandes.flatMap((b) => b.r.filter((r) => r.compte !== false).map((r) => `<i style="flex-grow:${parseFloat(r.m.replace(',', '.'))};background:${b.c}"></i>`)).join('');
  const puces = `<span class="cl-pu">${CUBE_P}<b class="m">${o.relies ?? 6}</b> reliés</span><span class="cl-pu j"><b class="m">${o.jaunes ?? 2}</b> à contrôler</span><span class="cl-pu r"><b class="m">1</b> à remplir</span>`
    + `<span class="cl-pu c cl-vise">${REPRIS}<b class="m">${o.corrigees ?? 3}</b> corrigées</span>`;
  const somme = o.sommeKo ? `<div class="rg">${ATT_IC}Somme ≠ imprimé<b class="m" style="color:var(--attT)">${o.sommeKo}</b></div>` : `<div class="rg">${CHECK()}Somme = imprimé<b class="m">${o.total ?? '46,40'}</b></div>`;
  return `${tete()}<section class="cl-band"><div class="r1"><b>Brauhaus Ouest</b><span class="m">21.10.2026</span></div>`
    + `<div class="r2"><span class="tot m">${o.total ?? '46,40'}</span><span style="font-size:12px;color:var(--c400)">CHF</span><span class="cl-chip">${ALERTE}<span class="m">${o.nLignes ?? 7}</span>&nbsp;lignes</span></div><div class="cl-barre">${barre}</div></section>`
    + `<section class="cl-preuve">${somme}<div class="rg">${CHECK()}Qté × prix<b class="m">${o.qp ?? '7/7'}</b></div>`
    + `<div class="rg" style="border:0">${CHECK()}Lectures<b class="m">3/3</b></div><div class="rg" style="border:0"></div><div class="pu">${puces}</div></section>`
    + `<div class="cl-duo"><div>TVA<b>–</b></div><div>Règlement<b>Payé</b></div></div><div style="height:8px"></div>${corps}`
    + `${o.bandeau ?? ''}<div class="cl-pied"><span class="cl-seg"><span class="on">Catégorie</span><span>Papier</span></span><span class="cl-conf">✓ Confirmer</span></div>`;
}

// ---- Question 1 : la ligne que la 3.8 ajoute (absente du provisoire). Mosaic, 20 g × 0,080 = 1,60, dans Houblons. ----
// Reprise 1 (e-t13, majeur 1) : l'imprimé reste celui de sa maquette (46,40, en-tête au pixel) ; la somme des lignes passe à 48,00,
// et la preuve le dit (« Somme ≠ imprimé 48,00 » en attention). Elle compte dans la puce (4 corrigées) et dans les sommes.
const MOSAIC = { nom: 'Mosaic', sous: 'α 11,8', q: '20 g', p: '0,080', m: '1,60' };
const Q1 = { sommeKo: '48,00', nLignes: 8, qp: '8/8', relies: 7, corrigees: 4 };
const HOUBLONS3 = { q: '100 g', s: '8,20' };
const q1 = (ligneCas) => ecran({ ...Q1, ajout: { bande: 1, ligne: ligneCas, maj: HOUBLONS3 } });
const Q1V = {
  'q1-a': () => q1({ ...MOSAIC }),
  // Reprise 1 (majeur 2) : la marque des corrections sur la rangée (« ↻ » de la puce devant le nom, nom et montant en bleu).
  'q1-b': () => q1({ ...MOSAIC, cls: 'l38-neuve', nomHtml: `<span><span class="l38-ic">${REPRIS}</span>Mosaic <small class="m">α 11,8</small></span>` }),
  'q1-c': () => q1({ ...MOSAIC, nomHtml: `<span class="l38-nc">Mosaic <small class="m">α 11,8</small></span>`, qk: 'c', pk: 'c', mtHtml: `<span class="cl-mt m"><span class="l38-mc">1,60</span></span>` }),
  'q1-d': () => q1({ ...MOSAIC, haute: true, apres: `<small class="l38-neu">${REPRIS12}neuve</small>` }),
};

// ---- Question 2 : la ligne du provisoire que la 3.8 ne lit plus. Avoine maltée, 0,5 Kg × 3,40 = 1,70, dans Malts. ----
// L'imprimé vaut 46,40 (= sa maquette). Gardée, la somme des lignes passe à 48,10 et ne tombe plus sur l'imprimé.
const AVOINE = { nom: 'Avoine maltée', q: '0,5 Kg', p: '3,40', m: '1,70' };
const MALTS4 = { q: '10,5 Kg', s: '25,80' };
const gardee = () => ecran({ sommeKo: '48,10', nLignes: 8, qp: '8/8', relies: 7, ajout: { bande: 0, ligne: { ...AVOINE }, maj: MALTS4 } });
const horsCompte = { compte: false };
const Q2V = {
  // A : retirée sans marque. L'écran est sa maquette, au pixel.
  'q2-a': () => ecran({}),
  // B (le plan) : barrée sur place, hors des sommes ; deux mots sous le nom.
  'q2-b-arrivee': () => ecran({ corrigees: 4, ajout: { bande: 0, ligne: { ...AVOINE, ...horsCompte, haute: true, cls: 'l38-pas l38-barre',
    apres: `<span class="l38-gestes"><span class="l38-ch">${GARDE}Garder</span><span class="l38-ch">${RETIRE}Retirer</span></span>` }, maj: { n: 3 } } }),
  'q2-b-garder': gardee,
  'q2-b-retirer': () => ecran({}),
  // C : reprise en jaune (D277 : « Pas sûr mais repris, flag jaune. Je contrôle »), comptée ; ✓ et ✕ au bout de la rangée.
  'q2-c-arrivee': () => ecran({ sommeKo: '48,10', nLignes: 8, qp: '8/8', relies: 7, jaunes: 3, ajout: { bande: 0, ligne: { ...AVOINE, haute: true, cls: 'l38-pas',
    apres: `<span class="l38-ligne2"><small class="l38-nr">pas retrouvée</small><span class="l38-ib" aria-label="garder">${GARDE}</span><span class="l38-ib" aria-label="retirer">${RETIRE}</span></span>` }, maj: MALTS4 } }),
  'q2-c-garder': gardee,
  'q2-c-retirer': () => ecran({}),
  // D : barrée sur place, la décision au pouce, au-dessus de Confirmer, tant qu'il n'a pas tranché.
  'q2-d-arrivee': () => ecran({ corrigees: 4, ajout: { bande: 0, ligne: { ...AVOINE, ...horsCompte, cls: 'l38-barre' }, maj: { n: 3 } },
    bandeau: `<div class="l38-band"><span class="q"><b>Avoine maltée <span class="m">1,70</span></b><small>pas retrouvée</small></span><span class="l38-ch">${GARDE}Garder</span><span class="l38-ch">${RETIRE}Retirer</span></div>` }),
  'q2-d-garder': gardee,
  'q2-d-retirer': () => ecran({}),
};

const SOMBRES = { 'q1-b-sombre': 'q1-b', 'q2-b-arrivee-sombre': 'q2-b-arrivee' };
const CUBE_S = CUBE.replace('stroke="#111"', 'stroke="rgb(245 240 234)"').replace('fill="#111"', 'fill="rgb(245 240 234)"').replace('stroke="#fff"', 'stroke="rgb(18 16 14)"');
const assombrir = (h) => h.split(CUBE).join(CUBE_S).split(',#fff"').join(',rgb(18 16 14)"').split('rgb(63 107 46)').join('rgb(110 155 91)');
const page = (titre, corps, classe, extra = SOMBRE + L38) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${titre}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>${CSS}${extra}</style></head><body class="${classe}">${corps}</body></html>`;

// Preuve d'identité : à 700 px et sans les feuilles neuves, ecran({}) doit rendre d-lue.html octet pour octet (titre mis à part).
if (process.argv.includes('--identite')) {
  const orig = fs.readFileSync(path.join(DOSSIER, '..', 'choix-lenteur', 'maquettes', 'd-lue.html'), 'utf8').replace(/<title>[^<]*<\/title>/, '');
  const moi = page('x', ecran({}), '', '').replace(/<title>[^<]*<\/title>/, '');
  console.log(orig === moi ? `IDENTITE OK (${moi.length} octets, HAUT=${HAUT})` : `IDENTITE ECHEC (HAUT=${HAUT}) : ${orig.length} contre ${moi.length} octets`);
  process.exit(orig === moi ? 0 : 1);
}


// ===========================================================================================================================
// Voie l2b-valider (02.11, D313) : ce qui précède est choix-lignes-38/outils/gen.mjs recopié tel quel (ecran(), ligne(), Q1V, Q2V,
// page(), la preuve --identite) ; seule la hauteur par défaut passe à 860 px, pour que le
// bandeau en liste (C) ne cache aucune rangée. Ce qui suit est neuf, préfixé l2b-.
// Sa maquette : Q2V['q2-d-arrivee'] (son choix 2 D). Ses mots : « 2 d, en un clic je peux Tout validé les changements. Mais aussi un à 1 ».
// Deux lignes pas retrouvées : Avoine maltée (Malts, déjà dans sa maquette) et Amarillo (Houblons, après Citra), toutes deux hors des sommes.
// « Tout valider » applique la lecture lente à toutes : elles partent (lecture du pilote, D313).
// ===========================================================================================================================
const L2B = `
.l2b-band{position:absolute;left:8px;right:8px;bottom:61px;display:grid;gap:4px;padding:6px 6px 6px 10px;border:1.5px dashed var(--att);border-radius:12px;background:linear-gradient(rgb(224 160 46/.1),rgb(224 160 46/.1)),#fff;box-shadow:0 2px 10px rgb(0 0 0/.12)}
.sombre .l2b-band{background:linear-gradient(rgb(227 181 93/.12),rgb(227 181 93/.12)),rgb(26 22 19)}
.l2b-r{display:flex;align-items:center;gap:6px;min-height:28px}
.l2b-r .q{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15}
.l2b-r .q b{font-size:14px;font-weight:600}
.l2b-r .q small{font-size:12px;color:var(--attT);font-weight:600}
.l2b-n{font-size:13px;font-weight:600;color:var(--attT)}
.l2b-tout{display:inline-flex;align-items:center;gap:4px;min-height:28px;padding:0 10px;border:1.5px solid var(--attT);border-radius:999px;font-size:13px;font-weight:700;color:var(--attT);background:var(--c950,#fff)}
.sombre .l2b-tout{background:rgb(26 22 19)}
.l2b-band .l38-ch{min-height:28px}
.l2b-li{display:flex;align-items:center;gap:6px;min-height:28px;border-top:1px solid rgb(156 112 32/.25);padding-top:3px}
.l2b-li .q{flex:1;min-width:0;font-size:14px;font-weight:600}
.l2b-li .l38-ch{min-height:26px;padding:0 8px}
.l2b-tete{display:flex;align-items:center;gap:6px;min-height:28px}
.l2b-tete b{flex:1;font-size:14px;font-weight:600;color:var(--attT)}
`;
// Reprise e-t14 (majeur) : la double coche disait « garder tout » à côté de « ✓ Garder ». « Tout valider » prend le « ↻ » de la puce
// « corrigées » : il applique ce que la 3e lecture a fait, comme les autres corrections.
const TOUT = svg('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>', 15, 2.2);
const AMARILLO = { nom: 'Amarillo', sous: 'α 9,2', q: '25 g', p: '0,088', m: '2,20' };
const CITRA = ligne({ ...BASE().citra, c: 'var(--hop)' });
// La seconde ligne pas retrouvée, posée après Citra par split/join (L26). `forme` : la rangée barrée de sa maquette, ou celle de 2 B (gestes).
const GESTES = `<span class="l38-gestes"><span class="l38-ch">${GARDE}Garder</span><span class="l38-ch">${RETIRE}Retirer</span></span>`;
const amarillo = (gestes) => ligne({ ...AMARILLO, c: 'var(--hop)', cls: gestes ? 'l38-pas l38-barre' : 'l38-barre', haute: gestes, apres: gestes ? GESTES : '' });
const avecAmarillo = (html, gestes = false) => { if (!html.includes(CITRA)) throw new Error('rangée Citra introuvable'); return html.split(CITRA).join(CITRA + amarillo(gestes)); };
// Son 2 D, Avoine barrée (hors sommes) ; `bandeau` : la forme de l'option ; `gestes` : Garder / Retirer sur les rangées (D).
const arrivee = (bandeau, gestes = false) => avecAmarillo(ecran({ corrigees: 5, ajout: { bande: 0, ligne: gestes
  ? { ...AVOINE, compte: false, haute: true, cls: 'l38-pas l38-barre', apres: GESTES }
  : { ...AVOINE, compte: false, cls: 'l38-barre' }, maj: { n: 3 } }, bandeau }), gestes);
// Après « Garder » sur Avoine : elle compte (Malts 4 · 10,5 Kg · 25,80, Somme ≠ imprimé 48,10), Amarillo attend encore (4 corrigées).
const gardeeUne = (bandeau, gestes = false) => avecAmarillo(ecran({ sommeKo: '48,10', nLignes: 8, qp: '8/8', relies: 7, corrigees: 4, ajout: { bande: 0, ligne: { ...AVOINE }, maj: MALTS4 }, bandeau }), gestes);
const question = (nom, m, rang, tout) => `<div class="l2b-band"><div class="l2b-r"><span class="q"><b>${nom} <span class="m">${m}</span></b><small>pas retrouvée · <span class="m">${rang}</span></small></span>${tout ? `<span class="l2b-tout">${TOUT}Tout valider</span>` : ''}</div>`
  + `<div class="l2b-r"><span class="l38-ch">${GARDE}Garder</span><span class="l38-ch">${RETIRE}Retirer</span></div></div>`;
// A : sa bande d'une ligne (l38-band), avec « 1/2 » : une question à la fois, sans « Tout valider ».
const questionA = (nom, m, rang) => `<div class="l38-band"><span class="q"><b>${nom} <span class="m">${m}</span></b><small>pas retrouvée · <span class="m">${rang}</span></small></span><span class="l38-ch">${GARDE}Garder</span><span class="l38-ch">${RETIRE}Retirer</span></div>`;
const liste = (lignes) => `<div class="l2b-band"><div class="l2b-tete"><b><span class="m">${lignes.length}</span> pas retrouvée${lignes.length > 1 ? 's' : ''}</b><span class="l2b-tout">${TOUT}Tout valider</span></div>`
  + lignes.map(([n, m]) => `<div class="l2b-li"><span class="q">${n} <span class="m">${m}</span></span><span class="l38-ch">${GARDE}Garder</span><span class="l38-ch">${RETIRE}Retirer</span></div>`).join('') + '</div>';
const compteur = (n) => `<div class="l2b-band"><div class="l2b-tete"><b><span class="m">${n}</span> pas retrouvée${n > 1 ? 's' : ''}</b><span class="l2b-tout">${TOUT}Tout valider</span></div></div>`;

const VUES = {
  'a-arrivee': () => arrivee(questionA('Avoine maltée', '1,70', '1/2')),
  'a-garder': () => gardeeUne(questionA('Amarillo', '2,20', '2/2')),
  'b-arrivee': () => arrivee(question('Avoine maltée', '1,70', '1/2', true)),
  'b-garder': () => gardeeUne(question('Amarillo', '2,20', '2/2', true)),
  'c-arrivee': () => arrivee(liste([['Avoine maltée', '1,70'], ['Amarillo', '2,20']])),
  'c-garder': () => gardeeUne(liste([['Amarillo', '2,20']])),
  'd-arrivee': () => arrivee(compteur(2), true),
  'd-garder': () => gardeeUne(compteur(1), true),
  // Après « Tout valider » (B, C, D) : les deux partent ; c'est sa maquette lue, sans elles (= Q2V['q2-a']).
  'tout': () => ecran({}),
};
const SOMBRES_V = { 'b-arrivee-sombre': 'b-arrivee' };

// Preuve de la copie : à 780 px, sa maquette 2 D sort d'ici octet pour octet (titre mis à part).
if (process.argv.includes('--identite-2d')) {
  const orig = fs.readFileSync(path.join(DOSSIER, '..', 'choix-lignes-38', 'maquettes', 'q2-d-arrivee.html'), 'utf8').replace(/<title>[^<]*<\/title>/, '');
  const moi = page('x', Q2V['q2-d-arrivee'](), '').replace(/<title>[^<]*<\/title>/, '');
  if (orig !== moi) { let i = 0; while (orig[i] === moi[i]) i++; console.log('écart à', i, JSON.stringify(orig.slice(i - 30, i + 30)), JSON.stringify(moi.slice(i - 30, i + 30))); }
  console.log(orig === moi ? `IDENTITE-2D OK (${moi.length} octets, HAUT=${HAUT})` : `IDENTITE-2D ECHEC (HAUT=${HAUT}) : ${orig.length} contre ${moi.length} octets`);
  process.exit(orig === moi ? 0 : 1);
}

const pageV = (titre, corps, classe) => page(titre, corps, classe, SOMBRE + L38 + L2B);
const fichiers = [];
for (const [nom, f] of Object.entries(VUES)) { fs.writeFileSync(path.join(MAQ, `${nom}.html`), pageV(nom, f(), '')); fichiers.push(nom); }
for (const [nom, de] of Object.entries(SOMBRES_V)) { fs.writeFileSync(path.join(MAQ, `${nom}.html`), pageV(nom, assombrir(VUES[de]()), 'sombre')); fichiers.push(nom); }
console.log(`${fichiers.length} maquettes écrites dans ${MAQ}`);

if (!process.argv.includes('--sans-captures')) {
  const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
  const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const p = await nav.newPage();
  await p.setViewport({ width: 390, height: HAUT, deviceScaleFactor: 2 });
  const sommes = {};
  for (const nom of fichiers) {
    const f = path.join(IMG, `${nom}.png`);
    await p.goto(pathToFileURL(path.join(MAQ, `${nom}.html`)).href, { waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});
    await p.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 200));
    const d = await p.evaluate(() => [document.documentElement.scrollWidth, document.querySelector('.cl-pied')?.getBoundingClientRect().top ?? 0,
      Math.max(0, ...[...document.querySelectorAll('.cl-li, .cl-bande')].map((e) => e.getBoundingClientRect().bottom)),
      document.querySelector('.l38-band, .l2b-band')?.getBoundingClientRect().top ?? 0]);
    await p.screenshot({ path: f });
    console.log(`${nom}.png · largeur ${d[0]} · haut du pied ${Math.round(d[1])} · bas de la liste ${Math.round(d[2])}${d[3] ? ` · haut du bandeau ${Math.round(d[3])}${d[3] < d[2] ? ' · CACHE UNE RANGÉE' : ''}` : ''}`);
    sommes[nom] = crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex').slice(0, 8);
  }
  await nav.close();
  fs.writeFileSync(path.join(IMG, 'md5.json'), JSON.stringify(sommes, null, 1));
}
