// Lot 21 · s1 · « La ligne du brassage ». Une seule bière, la stout 16D (Nugget à 60′), et son brassage en
// ligne : ébullition, whirlpool, fermentation, après. On y pose un ou deux houblons, on les fait glisser d'un
// moment à l'autre, on règle la dose, les jours et la levure ; le profil estimé de la bière (12 familles
// nommées, en crans du style, avant en contour et après en plein, la bande bas–haut entière) se redessine à
// chaque geste, et l'écart s'écrit. À côté : les vraies valeurs du houblon touché (α, huile, rapports au
// seuil en bande log), ce qui est mesuré en bière (comparatifs-dryhop.json) et les trous.
// Usage : node generateur-s1.mjs  →  s1/etat.html
import path from 'node:path';
import fs from 'node:fs';
import * as S from './socle-s.mjs';
const { ORDRE, ico, esc, picto, MOMENT, COUL } = S;

const { P, stub, fichier } = S.charger();
const data = S.simdata(P);
const HB = S.HB_PAGE;
const MES = data.mesures;

const lanes = ORDRE.map((f) => S.rangee(f, { series: ['g', 'w', 'b'] })).join('');
const chipH = (h) => `<button class="ch hb" data-role="reglage" data-reglage="houblon" data-v="${esc(h)}" data-houblon="${esc(h)}" aria-pressed="false"><i class="pt" style="background:${COUL[h]}" data-houblon-compare="${esc(h)}" data-couleur="${COUL[h]}"></i>${esc(h)}</button>`;
const MOM = [['b60', '60′'], ['b10', '10′'], ['wp', 'whirlpool'], ['dryActive', 'actif'], ['dryPost', 'après']];
const pas = (k, lib, unite) => `<div class="pas" data-pas="${k}"><span class="pas-l">${lib}</span><button class="pas-b" data-role="reglage" data-reglage="${k}" data-sens="-1" aria-label="${lib} : moins">${ico('i-chev-l', 16)}</button><output class="pas-v" data-v="${k}"><b class="nb"></b> ${unite}</output><button class="pas-b" data-role="reglage" data-reglage="${k}" data-sens="1" aria-label="${lib} : plus">${ico('i-chev-r', 16)}</button></div>`;
const EX = [['K2-citra', 'Citra'], ['K2-galaxy', 'Galaxy'], ['K2-idaho-7', 'Idaho 7'], ['K3-citra3-galaxy7', 'Citra 3 j + Galaxy 7 j'], ['K3-citra3-idaho7-5', 'Citra 3 j + Idaho 7 5 j'], ['K1-citra-b60', 'Citra à 60′'], ['K1-cascade-dryPost', 'Cascade']];

const corps = `${S.barre('Ma stout <small>16D · Nugget 60′</small>')}
  <div class="outils">${S.lentille()}<span class="conf-b"><span class="mot m-est">~ estimé</span><span class="conf" data-conf role="img" aria-label="confiance"><i></i><i></i><i></i></span><span class="conf-m" data-conf-mot></span></span></div>

  <section class="carte prof" data-role="simulation" aria-label="Profil estimé de ma bière, avant et après">
    <div class="prof-h"><span class="mot m-est">~ simulé</span><span class="lk2"><i class="lx-g"></i>avant</span><span class="lk2"><i class="lx-b"></i>après</span><span class="lk2 z"><i class="lx-z"></i>16D</span></div>
    <div class="lns">${lanes}</div>
    <p class="chg" data-role="ecart" aria-live="polite"></p>
    <div class="pq" data-role="pourquoi"></div>
    <p class="bn"><span class="mot m-inc" data-inconnu>inconnu</span><span data-nature="mesure" data-source="H">en bière noire</span></p>
  </section>

  <section class="carte brass" aria-label="Le brassage : où et combien de houblon">
    <div class="ph" aria-hidden="true"><span class="ph-e">ébullition</span><span class="ph-w">whirlpool</span><span class="ph-f">fermentation</span><span class="ph-a">après</span></div>
    <div class="piste-b" data-piste>
      <div class="rang moi"><span class="tk-fixe" style="--h:${COUL.Nugget}" data-houblon="Nugget" role="img" aria-label="Nugget à 60′, dans ma bière"><i class="tk-m pin" data-houblon-compare="Nugget" data-couleur="${COUL.Nugget}"></i>Nugget <span class="nb">60′</span></span>${S.alpha('Nugget')}<span class="aide">ma bière</span></div>
      <div class="rang" data-rang="0"></div>
      <div class="rang" data-rang="1"></div>
      <div class="jours" aria-hidden="true"></div>
    </div>
    <div class="aj-b"><button class="ch plus2" data-role="reglage" data-reglage="ajout-cumule" aria-pressed="false">${ico('i-plus', 14)}second houblon</button><span class="aide">glisse-le</span></div>
  </section>

  <section class="carte edit" aria-label="Réglages du houblon choisi">
    <div class="ed-h" data-role="ajout"><span class="ed-n">ajout <b data-ed-num>1</b></span><span class="ed-hs">${HB.map(chipH).join('')}</span></div>
    <div class="ed-m seg" role="radiogroup" aria-label="Moment">${MOM.map(([m, t]) => `<button role="radio" data-role="reglage" data-reglage="moment" data-v="${m}" aria-checked="false">${ico(MOMENT[m].ic, 14)}<span${/\d/.test(t) ? ' class="nb"' : ''}>${t}</span></button>`).join('')}</div>
    <div class="ed-p">${pas('dose', 'dose', 'g/L')}${pas('jours', 'contact', 'j')}<button class="ch rm" data-role="reglage" data-reglage="retirer" hidden>${ico('i-x', 14)}retirer</button></div>
    <div class="ed-l"><span class="ed-ll">${ico('j-levure', 14)}levure</span>${S.LEVURES.map((l) => `<button class="ch lv" data-role="reglage" data-reglage="levure" data-v="${l}" aria-pressed="${l === 'US-05'}">${l}</button>`).join('')}</div>
    <div class="bio" data-bio>${S.LEVURES.map((l) => ['actif', 'apres', 'aucun'].map((ph) => `<div data-bio-k="${l}|${ph}" hidden>${S.bioHTML(l, ph)}</div>`).join('')).join('')}<p class="bio-ns" data-bio-ns hidden><span class="mot m-inc">inconnu</span> effet de cette levure non simulé pour un houblon seul : profil d’US-05</p></div>
  </section>

  <section class="carte vraies" aria-label="Les vraies valeurs du houblon choisi">
    <div class="vr-h"><span class="mot m-mes">vraies valeurs</span><span class="aide">lot, fiches, mesures en bière</span></div>
    ${HB.map((h, k) => `<div data-vr="${esc(h)}" hidden>${S.vraies(h, MES[h], { n: k + 1 })}<div class="ets">${S.etudes(h)}</div></div>`).join('')}
  </section>

  <section class="carte ex" aria-label="Les cas du brasseur">
    <div class="vr-h"><span class="aide">tes cas</span></div>
    <div class="ex-l">${EX.map(([id, t]) => `<button class="ch" data-role="reglage" data-reglage="exemple" data-v="${id}">${esc(t)}</button>`).join('')}</div>
  </section>
  
  ${S.legende()}`;

const CSS = `
  .outils { align-items: center; }
  .conf-b { display: inline-flex; align-items: center; gap: 5px; }
  .conf-m { font-size: 12px; font-weight: 600; color: var(--gris); }
  .prof { padding-bottom: 6px; }
  .prof-h { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--gris); }
  .lk2 { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; }
  .lk2 i { display: inline-block; width: 16px; height: 8px; border-radius: 2px; }
  .lk2.z { margin-left: auto; }
  .lf-g { top: 2px; height: 10px; border-radius: 2px; background: #fff; box-shadow: inset 0 0 0 1.5px var(--c); }
  .lf-b { top: 4px; height: 6px; border-radius: 0 2px 2px 0; background: var(--c); overflow: hidden; }
  .lf-b .lf-x { position: absolute; }
  .lf-w { z-index: 1; }
  .lf-w.ouvert { border-radius: 2px 0 0 2px; -webkit-mask-image: linear-gradient(90deg, #000 75%, rgba(0,0,0,.25)); mask-image: linear-gradient(90deg, #000 75%, rgba(0,0,0,.25)); }
  .lf-w.ouvert::after { display: none; }
  .lf-inc { left: 0; top: 3px; width: 46px; height: 8px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #aeb3be 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .lf.vide .lf-t { color: var(--gris); font-weight: 400; }
  .lf-pv { top: 1px; width: 2px; height: 12px; border-radius: 1px; background: var(--encre); opacity: 0; z-index: 3; }
  .lf-pv.va { animation: va 1.6s ease-out; }
  @keyframes va { 0%, 40% { opacity: .9; } 100% { opacity: 0; } }
  .tk-d { font: 500 12px var(--mono); color: var(--gris); }
  .rv { display: flex; flex-direction: column; gap: 3px; }
  .rv .rv-c:first-child { margin-top: 10px; }
  .lg-t { top: -13px !important; }
  .chg .g { display: block; font-weight: 600; }
  .pq { display: flex; flex-wrap: wrap; gap: 4px; }
  .pq span { font-size: 12px; padding: 2px 8px; border-radius: 9px; background: #f3f4f7; color: var(--encre); }
  .pq span b { font-weight: 600; }
  .bn { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); }
  .chg { font-size: 13px; line-height: 1.3; min-height: 17px; }
  .chg b { font-weight: 700; }
  .chg .hst { color: var(--acc); font-weight: 600; }

  /* Le brassage en ligne : 0 à 366 px, l'ébullition, le whirlpool, puis les jours J0 à J18. */
  .brass { gap: 4px; }
  .ph { position: relative; height: 18px; font-size: 12px; font-weight: 600; color: var(--gris); }
  .ph > span { position: absolute; top: 0; display: inline-flex; align-items: center; gap: 3px; height: 18px; }
  .ph-e { left: 0; } .ph-w { left: 70px; } .ph-f { left: 132px; } .ph-a { left: 222px; }
  .piste-b { position: relative; padding-bottom: 14px; }
  .piste-b::before { content: ''; position: absolute; left: 68px; top: 0; bottom: 14px; width: 1px; background: #e3e5eb; }
  .piste-b::after { content: ''; position: absolute; left: 128px; top: 0; bottom: 14px; width: 1px; background: #e3e5eb; }
  .rang { position: relative; height: 30px; border-top: 1px solid #f0f1f4; }
  .rang.haut { height: 58px; }
  .rang.moi { height: 26px; display: flex; align-items: center; gap: 8px; }
  .fer { position: absolute; top: 0; bottom: 14px; left: 132px; width: 84px; background: repeating-linear-gradient(135deg, rgba(85,85,95,.07) 0 4px, rgba(85,85,95,0) 4px 8px); pointer-events: none; }
  /* Un jeton : la marque (une épingle au moment, ou la barre des jours de contact), puis son nom. */
  .tk { position: absolute; top: 3px; height: 26px; display: flex; align-items: flex-start; touch-action: none; cursor: grab; -webkit-user-select: none; user-select: none; }
  .tk-m { flex: none; background: var(--h); }
  .tk-m.pin { width: 6px; height: 22px; border-radius: 3px; margin-right: 4px; }
  .tk-m.dur { position: absolute; left: 0; top: 18px; height: 8px; border-radius: 4px; }
  .tk-l { display: inline-flex; align-items: center; gap: 4px; height: 17px; padding: 0 7px; border-radius: 9px; background: #fff; box-shadow: inset 0 0 0 1px #c9cad2; font-size: 12px; font-weight: 600; white-space: nowrap; }
  .tk.sel .tk-l { box-shadow: inset 0 0 0 2px var(--encre); }
  .tk.glisse .tk-l { box-shadow: 0 0 0 2px var(--encre), 0 6px 16px -6px rgba(22,22,26,.5); }
  .tk.glisse { cursor: grabbing; z-index: 5; }
  .tk-fixe { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: var(--gris); }
  .tk-fixe .tk-m.pin { height: 16px; }
  .bio-m { font-size: 12px; font-weight: 600; padding: 0 5px; border-radius: 8px; background: repeating-linear-gradient(135deg, #fff 0 3px, #e3e5eb 3px 5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .rep.r3 { top: 42px; }
  .rep.r3 i { top: -15px; height: 26px; }
  .rep { position: absolute; top: 30px; font-size: 12px; color: var(--gris); white-space: nowrap; padding-left: 3px; }
  .rep i { position: absolute; left: 0; top: -3px; width: 1.5px; height: 14px; background: var(--gris); }
  .jours { position: absolute; left: 0; right: 0; bottom: 0; height: 14px; font: 500 12px var(--mono); color: var(--gris); }
  .jours span { position: absolute; top: 0; transform: translateX(-50%); }
  .aj-b { display: flex; align-items: center; gap: 8px; }
  .aide { font-size: 12px; color: var(--gris); }
  .ch { display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 10px; border-radius: 14px; background: #ececf1; font-size: 13px; font-weight: 600; color: var(--encre); white-space: nowrap; }
  .ch[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .ch .pt, .tk .pt, .vv-h .pt { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex: none; }

  .edit { gap: 7px; }
  .ed-h { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .ed-n { font-size: 12px; color: var(--gris); }
  .ed-hs { display: flex; gap: 4px; flex-wrap: wrap; }
  .ed-m { border-radius: 16px; }
  .ed-m button { height: 28px; padding: 0 6px; font-size: 12px; border-radius: 14px; }
  .ed-m button[aria-checked="true"] { background: var(--encre); color: #fff; }
  .ed-p { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .pas { display: inline-flex; align-items: center; gap: 2px; }
  .pas-l { font-size: 12px; color: var(--gris); margin-right: 4px; }
  .pas-b { width: 32px; height: 32px; border-radius: 50%; background: #ececf1; display: inline-flex; align-items: center; justify-content: center; }
  .pas-b:disabled { opacity: .35; }
  .pas-v { min-width: 58px; text-align: center; font-size: 13px; }
  .pas-v b { font: 600 15px var(--mono); }
  .pas.off .pas-v { color: var(--gris); }
  .rm { margin-left: auto; }
  .ed-l { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .ed-ll { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: var(--gris); margin-right: 2px; }
  .lv { height: 26px; padding: 0 9px; font-size: 12px; }
  .bio { font-size: 12px; }
  .bio [hidden] { display: none; }

  .vraies { gap: 6px; }
  .vr-h { display: flex; align-items: center; gap: 8px; }
  .vv { display: flex; flex-direction: column; gap: 4px; }
  .vv-h { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .vv-h .nm { font-size: 14px; }
  .vv-h .vf { margin-left: auto; }
  .hu-v { font-size: 12px; color: var(--gris); } .hu-v b { color: var(--encre); font-weight: 600; } .hu-v .u { font-size: 12px; }
  .vv-ref { font-size: 12px; color: var(--gris); }
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
  .cd-l { display: flex; flex-direction: column; gap: 0; }
  .cd-x { position: relative; display: block; width: 196px; height: 15px; font-size: 12px; color: var(--gris); }
  .cd-x span { position: absolute; top: 0; transform: translateX(-50%); }
  .vv-res { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 12px; color: var(--gris); }
  .ex-l { display: flex; flex-wrap: wrap; gap: 4px; }
  .ex-l .ch { height: 26px; font-size: 12px; }
  .stub { font-size: 12px; color: #6b4e00; background: #fff4d6; border-radius: 8px; padding: 6px 10px; }
`;

const JS = fs.readFileSync(path.join(S.ICI, 'page-s1.js'), 'utf8');
S.ecrire(path.join(S.ICI, 'etat.html'), S.page({
  titre: 'Ligne du brassage', css: CSS, corps, js: JS, data,
  commentaire: 'Lot 21 · s1 · La ligne du brassage : le profil estimé de ma stout 16D avant et après, réglé en posant les houblons sur le brassage. Données : ' + fichier + (stub ? ' (STUB)' : '') + ', comparatifs-dryhop.json, base/consolide (fiches, α). Générée par generateur-s1.mjs (socle-s.mjs, sim-runtime.js, page-s1.js).',
}));
