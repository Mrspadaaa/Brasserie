// Lot 21 · s2 · « Trois plans côte à côte ». Le brasseur pose trois plans de dry hop (au départ ses cas :
// Citra 3 j puis Galaxy 7 j, Citra 3 j puis Idaho 7 5 j, Citra seul à la même dose totale), les règle tous
// (houblons, deux ensemble, dose, jours, moment, levure) et les lit sur une même grille : une rangée par
// famille nommée, trois barres superposées (plein, contour, hachures : la forme distingue, pas la couleur),
// la zone du style 16D derrière, la bande bas–haut du plan touché, l'écart écrit à un plan de référence.
// Les vraies valeurs (α, huile, rapports au seuil, mesures en bière) suivent le plan touché. Il choisit :
// l'outil ne classe rien à sa place (un classement par famille, à la demande, montre les valeurs).
// Usage : node generateur-s2.mjs  →  s2/etat.html
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as S from '../s1/socle-s.mjs';
const { ORDRE, ico, esc, MOMENT, COUL } = S;
const ICI = path.dirname(fileURLToPath(import.meta.url));

const { P, fichier } = S.charger();
const data = S.simdata(P);
const HB = S.HB_PAGE, MES = data.mesures;

const lanes = ORDRE.map((f) => S.rangee(f, { series: ['w1', 'w2', 'w3', 'b1', 'b2', 'b3'] })).join('');
const MOM = [['b60', '60′'], ['b10', '10′'], ['wp', 'whirlpool'], ['dryActive', 'actif'], ['dryPost', 'après']];
const pas = (k, n, lib, unite) => `<span class="pas" data-pas="${k}${n}"><span class="pas-l">${lib}</span><button class="pas-b" data-role="reglage" data-reglage="${k}" data-n="${n}" data-sens="-1" aria-label="${lib} : moins">${ico('i-chev-l', 14)}</button><output class="pas-v" data-v="${k}${n}"><b class="nb"></b> ${unite}</output><button class="pas-b" data-role="reglage" data-reglage="${k}" data-n="${n}" data-sens="1" aria-label="${lib} : plus">${ico('i-chev-r', 14)}</button></span>`;
const chips = (n) => HB.map((h) => `<button class="ch hb" data-role="reglage" data-reglage="houblon" data-n="${n}" data-v="${esc(h)}" data-houblon="${esc(h)}" aria-pressed="false"><i class="pt" style="background:${COUL[h]}" data-houblon-compare="${esc(h)}" data-couleur="${COUL[h]}"></i>${esc(h)}</button>`).join('') + (n === 1 ? `<button class="ch" data-role="reglage" data-reglage="houblon" data-n="1" data-v="" aria-pressed="false">aucun</button>` : '');
const carte = (id, k) => `<article class="pl" data-plan="${id}" data-voie="${k + 1}" tabindex="0" aria-label="Plan ${id}">
      <div class="pl-h"><i class="sw sw${k + 1}" aria-hidden="true"></i><b>${id}</b><span class="pl-c" data-conf-plan></span></div>
      <div class="pl-a" data-ajouts></div>
      <div class="pl-d" data-dose-plan></div>
      <div class="pl-f"><button class="pl-r" data-role="ref" aria-pressed="false" aria-label="Lire les écarts contre le plan ${id}">réf.</button><button class="pl-ch" data-role="choix" aria-pressed="false" aria-label="Choisir le plan ${id}">choisir</button></div>
    </article>`;

const corps = `${S.barre('Trois plans <small>ma stout 16D</small>')}
  <div class="outils">${S.lentille()}<span class="mot m-est">~ estimé</span></div>
  <div class="pls" role="group" aria-label="Les trois plans">${['A', 'B', 'C'].map(carte).join('')}</div>
  <p class="eg" data-role="dose-egale"></p>

  <section class="carte prof" data-role="simulation" aria-label="Les trois plans, famille par famille">
    <div class="prof-h"><span class="mot m-est">~ simulé</span><span class="lk2"><i class="sw sw1"></i>A</span><span class="lk2"><i class="sw sw2"></i>B</span><span class="lk2"><i class="sw sw3"></i>C</span><span class="seg vue" role="radiogroup" aria-label="Lire les valeurs ou les écarts"><button role="radio" data-role="reglage" data-reglage="vue" data-v="val" aria-checked="true">valeurs</button><button role="radio" data-role="reglage" data-reglage="vue" data-v="ecart" aria-checked="false">écarts</button></span></div>
    <p class="ec-ax" aria-hidden="true"><span>moins que la réf.</span><span>plus</span></p>
    <div class="lns">${lanes}</div>
    <p class="chg" data-role="ecart" aria-live="polite"></p>
    <p class="lad" data-role="classement" aria-live="polite"></p>
    <p class="bn"><span class="mot m-inc" data-inconnu>inconnu</span><span data-nature="mesure" data-source="H">bière noire, ordre et synergie</span></p>
  </section>

  <section class="carte edit" aria-label="Régler le plan touché">
    <div class="ed-t"><span class="ed-n">régler</span><b class="ed-p" data-ed-plan>A</b></div>
    <div class="ed-m seg" role="radiogroup" aria-label="Moment">${MOM.map(([m, t]) => `<button role="radio" data-role="reglage" data-reglage="moment" data-v="${m}" aria-checked="false">${ico(MOMENT[m].ic, 14)}<span${/\d/.test(t) ? ' class="nb"' : ''}>${t}</span></button>`).join('')}</div>
    <div class="aj" data-role="ajout"><div class="aj-l"><span class="aj-n">1<sup>er</sup></span>${chips(0)}</div><div class="aj-s">${pas('dose', 0, 'dose', 'g/L')}${pas('jours', 0, 'contact', 'j')}</div></div>
    <div class="aj" data-role="ajout" data-aj2><div class="aj-l"><span class="aj-n">2<sup>e</sup></span>${chips(1)}</div><div class="aj-s">${pas('dose', 1, 'dose', 'g/L')}${pas('jours', 1, 'contact', 'j')}</div></div>
    <div class="ed-l"><span class="ed-ll">${ico('j-levure', 14)}levure</span>${S.LEVURES.map((l) => `<button class="ch lv" data-role="reglage" data-reglage="levure" data-v="${l}" aria-pressed="${l === 'US-05'}">${l}</button>`).join('')}</div>
    <div class="bio">${S.LEVURES.map((l) => ['actif', 'apres', 'aucun'].map((ph) => `<div data-bio-k="${l}|${ph}" hidden>${S.bioHTML(l, ph)}</div>`).join('')).join('')}<p class="bio-ns" data-bio-ns hidden><span class="mot m-inc">inconnu</span> effet de cette levure non simulé pour un houblon seul : profil d’US-05</p></div>
  </section>

  <section class="carte vraies" aria-label="Les vraies valeurs des houblons du plan touché">
    <div class="vr-h"><span class="mot m-mes">vraies valeurs</span><span class="aide">du plan touché : lot, fiches, mesures en bière</span></div>
    ${HB.map((h, k) => `<div data-vr="${esc(h)}" hidden>${S.vraies(h, MES[h], { n: 10 + k })}<div class="ets">${S.etudes(h)}</div></div>`).join('')}
  </section>

  <nav class="dock" aria-label="Mon choix"><span class="dk" data-dock>aucun plan choisi</span><button class="cmp" data-role="garder" disabled>Garder ce plan${ico('i-chev-r', 16)}</button></nav>
  ${S.legende(`<div class="leg-s"><h3>Les plans</h3><div class="leg-g l2"><span class="leg-i"><span class="leg-c"><i class="sw sw1"></i></span><span>A : barre pleine</span></span><span class="leg-i"><span class="leg-c"><i class="sw sw2"></i></span><span>B : contour</span></span><span class="leg-i"><span class="leg-c"><i class="sw sw3"></i></span><span>C : hachures</span></span><span class="leg-i"><span class="leg-c"><span class="cb-lex">réf.</span></span><span>l’écart se lit contre ce plan</span></span></div></div>`)}`;

const CSS = `
  .ecran { padding-bottom: 76px; }
  .outils { align-items: center; }
  .pls { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
  .pl { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 5px 6px 6px; display: flex; flex-direction: column; gap: 4px; min-width: 0; cursor: pointer; }
  .pl.foc { box-shadow: 0 0 0 2px var(--encre), var(--ombre); }
  .pl-h { display: flex; align-items: center; gap: 5px; font-size: 14px; }
  .pl-c { margin-left: auto; font-size: 12px; color: var(--gris); }
  .pl-a { display: flex; flex-direction: column; gap: 3px; font-size: 12px; }
  .pa { display: flex; flex-direction: column; gap: 1px; }
  .pa-h { display: flex; align-items: center; gap: 4px; font-weight: 600; white-space: nowrap; }
  .pa-h .pt { width: 8px; height: 8px; border-radius: 50%; flex: none; }
  .pa-d { display: flex; align-items: center; gap: 6px; color: var(--gris); white-space: nowrap; }
  .pa-d .al { font-size: 12px; }
  .pl-f { display: flex; align-items: center; gap: 4px; margin-top: auto; }
  .pl-d { font-size: 12px; color: var(--gris); }
  .pl-d:empty { display: none; }
  .pl-r { height: 24px; padding: 0 7px; border-radius: 12px; font-size: 12px; font-weight: 600; color: var(--gris); box-shadow: inset 0 0 0 1px #b4b4be; }
  .pl-r[aria-pressed="true"] { color: var(--encre); box-shadow: inset 0 0 0 2px var(--encre); }
  .pl-c .conf { margin-right: 3px; }
  .conf { display: inline-flex; align-items: center; gap: 2px; }
  .conf i { width: 6px; height: 6px; border-radius: 50%; box-shadow: inset 0 0 0 1px #55555f; display: inline-block; }
  .conf i.on { background: #55555f; }
  .pl-ch { margin-left: auto; height: 24px; padding: 0 8px; border-radius: 12px; background: #ececf1; font-size: 12px; font-weight: 600; }
  .pl-ch[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .eg { font-size: 12px; color: var(--gris); padding: 0 2px; }
  .eg b { color: var(--encre); }
  .eg .av { color: #6b4e00; background: #fff4d6; border-radius: 8px; padding: 1px 6px; font-weight: 600; }
  .sw { display: inline-block; width: 18px; height: 8px; border-radius: 2px; flex: none; }
  .sw1 { background: var(--encre); }
  .sw2 { background: #fff; box-shadow: inset 0 0 0 1.5px var(--encre); }
  .sw3 { background: repeating-linear-gradient(90deg, var(--encre) 0 2px, transparent 2px 4px); box-shadow: inset 0 0 0 1px var(--encre); }
  .prof-h { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--gris); }
  .lk2 { display: inline-flex; align-items: center; gap: 4px; font-weight: 700; color: var(--encre); }
  .lk2.z { margin-left: auto; font-weight: 600; color: var(--gris); }
  .lk2 i.lx-z { display: inline-block; width: 16px; height: 8px; border-radius: 2px; }
  .vue { margin-left: auto; border-radius: 13px; }
  .vue button { height: 22px; padding: 0 8px; font-size: 12px; border-radius: 11px; }
  .vue button[aria-checked="true"] { background: var(--encre); color: #fff; }
  .ec-ax { display: none; justify-content: space-between; font-size: 12px; color: var(--gris); padding: 0 66px 0 92px; }
  body.ecart .ec-ax { display: flex; }
  body.ecart .lf-z, body.ecart .lf-p [data-s^="w"], body.ecart .lf-x { display: none !important; }
  body.ecart .lf-p::after { content: ''; position: absolute; left: 50%; top: 0; bottom: 0; width: 1.5px; background: var(--encre); }
  body.ecart .lf-b1, body.ecart .lf-b2, body.ecart .lf-b3 { border-radius: 2px; }
  .lf { min-height: 22px; }
  .lf-p { height: 20px; }
  .lf-p::before { top: 9px; }
  .lf-n { cursor: pointer; }
  .lf-b1, .lf-b2, .lf-b3 { height: 5px; border-radius: 0 2px 2px 0; overflow: hidden; z-index: 2; }
  .lf-b1 { top: 2px; background: var(--c); }
  .lf-b2 { top: 8px; background: #fff; box-shadow: inset 0 0 0 1.5px var(--c); }
  .lf-b3 { top: 14px; background: repeating-linear-gradient(90deg, var(--c) 0 2px, rgba(255,255,255,0) 2px 4px); box-shadow: inset 0 0 0 1px var(--c); }
  .lf-p [data-s^="b"] .lf-x { top: 0; bottom: 0; }
  .lf-w1 { top: 3px; } .lf-w2 { top: 9px; } .lf-w3 { top: 15px; }
  .lf-w1, .lf-w2, .lf-w3 { height: 3px; display: none !important; }
  .lns.f1 .lf-w1, .lns.f2 .lf-w2, .lns.f3 .lf-w3 { display: block !important; }
  .lns.f1 .lf-b2, .lns.f1 .lf-b3, .lns.f2 .lf-b1, .lns.f2 .lf-b3, .lns.f3 .lf-b1, .lns.f3 .lf-b2 { opacity: .5; }
  .lf.cl { background: #f3f4f7; border-radius: 4px; }
  .lf-w.ouvert { -webkit-mask-image: linear-gradient(90deg, #000 75%, rgba(0,0,0,.25)); mask-image: linear-gradient(90deg, #000 75%, rgba(0,0,0,.25)); }
  .lf-w.ouvert::after { display: none; }
  .lf-inc { left: 0; top: 6px; width: 46px; height: 8px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #aeb3be 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .lf.vide .lf-t { color: var(--gris); font-weight: 400; }
  .chg, .lad { font-size: 13px; line-height: 1.3; }
  .chg b, .lad b { font-weight: 700; }
  .lad:empty { display: none; }
  .bn { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); }

  .edit { gap: 6px; }
  .ed-t { display: flex; align-items: center; gap: 6px; }
  .ed-n { font-size: 12px; color: var(--gris); }
  .ed-p { font-size: 15px; }
  .aide { font-size: 12px; color: var(--gris); }
  .ed-t .aide { margin-left: auto; }
  .ed-m { border-radius: 16px; }
  .ed-m button { height: 28px; padding: 0 6px; font-size: 12px; border-radius: 14px; }
  .ed-m button[aria-checked="true"] { background: var(--encre); color: #fff; }
  .aj { display: flex; flex-direction: column; gap: 4px; padding: 5px 0; border-top: 1px solid var(--trait); }
  .aj-l { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .aj-n { font-size: 12px; font-weight: 700; width: 24px; }
  .aj-s { display: flex; gap: 12px; padding-left: 28px; }
  .aj.off .aj-s { opacity: .4; pointer-events: none; }
  .ch { display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 9px; border-radius: 14px; background: #ececf1; font-size: 12px; font-weight: 600; color: var(--encre); white-space: nowrap; }
  .ch[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .ch .pt, .vv-h .pt { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex: none; }
  .pas { display: inline-flex; align-items: center; gap: 2px; }
  .pas-l { font-size: 12px; color: var(--gris); margin-right: 3px; }
  .pas-b { width: 30px; height: 30px; border-radius: 50%; background: #ececf1; display: inline-flex; align-items: center; justify-content: center; }
  .pas-b:disabled { opacity: .35; }
  .pas-v { min-width: 50px; text-align: center; font-size: 12px; }
  .pas-v b { font: 600 14px var(--mono); }
  .ed-l { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .ed-ll { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: var(--gris); margin-right: 2px; }
  .lv { height: 26px; }
  .bio { font-size: 12px; }

  .vraies { gap: 6px; }
  .vr-h { display: flex; align-items: center; gap: 8px; }
  .vv { display: flex; flex-direction: column; gap: 4px; }
  .vv-h { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .vv-h .nm { font-size: 14px; }
  .vv-h .vf { margin-left: auto; }
  .hu-v { font-size: 12px; color: var(--gris); } .hu-v b { color: var(--encre); font-weight: 600; }
  .vv-ref { font-size: 12px; color: var(--gris); }
  .rv { display: flex; flex-direction: column; gap: 3px; }
  .rv .rv-c:first-child { margin-top: 10px; }
  .lg-t { top: -13px !important; }
  .ets { display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--trait); padding-top: 6px; }
  .me { display: flex; flex-direction: column; gap: 2px; font-size: 12px; }
  .me-t { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .me-l { display: grid; grid-template-columns: 92px 150px auto; align-items: center; column-gap: 6px; }
  .me-n { color: var(--gris); white-space: nowrap; }
  .me-l.moi .me-n { color: var(--encre); font-weight: 700; }
  .me-p { position: relative; height: 8px; background: #f0f1f4; border-radius: 2px; }
  .me-p i { position: absolute; left: 0; top: 0; bottom: 0; background: #8a909b; border-radius: 2px; }
  .me-l.moi .me-p i { background: var(--encre); }
  .me-v { font: 500 12px var(--mono); }
  .me-u { color: var(--gris); }
  .me.trou { flex-direction: row; align-items: center; gap: 6px; }
  .mot.m-av { background: #fff4d6; color: #6b4e00; }
  .cd-x { position: relative; display: block; width: 196px; height: 15px; font-size: 12px; color: var(--gris); }
  .cd-x span { position: absolute; top: 0; transform: translateX(-50%); }
  .vv-res { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 12px; color: var(--gris); }
  .dk { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cmp:disabled { background: #ececf1; color: #55555f; }
`;

const JS = fs.readFileSync(path.join(ICI, 'page-s2.js'), 'utf8');
S.ecrire(path.join(ICI, 'etat.html'), S.page({
  titre: 'Trois plans', css: CSS, corps, js: JS, data,
  commentaire: 'Lot 21 · s2 · Trois plans côte à côte : trois plans de dry hop réglables, lus sur une même grille de familles, au style 16D, avec les vraies valeurs du plan touché. Données : ' + fichier + ', comparatifs-dryhop.json, base/consolide (fiches, α). Générée par generateur-s2.mjs (../s1/socle-s.mjs, ../s1/sim-runtime.js, page-s2.js).',
}));
