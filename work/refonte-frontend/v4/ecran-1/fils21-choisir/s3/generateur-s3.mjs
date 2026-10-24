// Lot 21 · s3 · « La carte des possibles ». Pour un houblon (et, s'il le veut, un second en dry hop), toute
// la grille du moteur d'un coup : 5 moments en colonnes, 4 doses en lignes ; chaque case est l'empreinte de
// la bière (12 petites barres de l5b, une par famille, le plafond du style en filet, l'orangé au-delà) et
// dit en mot si elle reste au style. On voit où c'est faisable avant de toucher ; un toucher sur une case
// la détaille : les 12 familles nommées avec leur bande entière, l'écart à la case d'avant, les vraies
// valeurs et ce qui est mesuré en bière (Cascade : le panel de Lafontaine 2018 posé sur ses cases).
// Usage : node generateur-s3.mjs  →  s3/etat.html
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as S from '../s1/socle-s.mjs';
const { ORDRE, ico, esc, MOMENT, COUL, picto, J, rgba } = S;
const ICI = path.dirname(fileURLToPath(import.meta.url));

const { P, fichier } = S.charger();
const data = S.simdata(P);
const HB = S.HB_PAGE, MES = data.mesures;
// Les mesures du panel de Lafontaine 2018 (E04, Cascade, 24 h), pour les poser sur leurs cases.
const E04 = S.CMP ? S.CMP.etudes.find((e) => e.id === 'E04') : null;
data.e04 = E04 ? E04.mesures.filter((m) => m.dose_gL != null && /citrus|OHAI|herbal/.test(m.descripteur)).map((m) => ({ d: m.dose_gL, k: /citrus/.test(m.descripteur) ? 'agrumes' : /herbal/.test(m.descripteur) ? 'herbacé' : 'intensité', v: m.valeur })) : [];

const lanes = ORDRE.map((f) => S.rangee(f, { series: ['g', 'w', 'b'] })).join('');
const chipH = (h, k, n) => `<button class="ch hb" data-role="reglage" data-reglage="${k}" data-v="${esc(h)}"${h ? ` data-houblon="${esc(h)}"` : ''} aria-pressed="false">${h ? `<i class="pt" style="background:${COUL[h]}" data-houblon-compare="${esc(h)}" data-couleur="${COUL[h]}"></i>${esc(h)}` : n}</button>`;
const MOM = [['b60', '60′'], ['b10', '10′'], ['wp', 'whirlpool'], ['dryActive', 'actif'], ['dryPost', 'après']];

const corps = `${S.barre('Carte des possibles <small>ma stout 16D</small>')}
  <div class="outils">${S.lentille()}<span class="mot m-est">~ estimé</span></div>
  <section class="carte reg" aria-label="Le houblon et ses réglages">
    <div class="rg"><span class="rg-l">houblon</span>${HB.map((h) => chipH(h, 'houblon')).join('')}</div>
    <div class="rg rg-v">${HB.map((h) => `<span class="hv" data-hv="${esc(h)}" hidden>${S.usage(h).replace(/ data-houblon="[^"]*"/, '')}${S.alpha(h)}${S.huile((MES[h] || []).find((m) => m.type === 'huile'))}<button class="vf" data-fiche="${esc(h)}" aria-label="Voir la fiche de ${esc(h)}">fiche${ico('i-chev-r', 12)}</button></span>`).join('')}</div>
    <div class="rg" data-role="ajout"><span class="rg-l">avec</span>${chipH('', 'second', 'seul')}${HB.map((h) => chipH(h, 'second')).join('')}<span class="rg-n" data-second-note></span></div>
    <div class="rg"><span class="rg-l">contact</span><span class="seg jr" role="radiogroup" aria-label="Jours de contact du dry hop">${data.axes.jours.map((j) => `<button role="radio" data-role="reglage" data-reglage="jours" data-v="${j}" aria-checked="${j === 3}"><span class="nb">${j}</span> j</button>`).join('')}</span></div>
    <div class="rg"><span class="rg-l">levure</span>${S.LEVURES.map((l) => `<button class="ch lv" data-role="reglage" data-reglage="levure" data-v="${l}" aria-pressed="${l === 'US-05'}">${l}</button>`).join('')}</div>
  </section>

  <section class="carte carte-p" data-role="simulation" aria-label="La carte : chaque moment, chaque dose">
    <div class="cp-h"><span class="mot m-est">~ simulé</span><span class="cp-lg"><i class="cp-g"></i>ma bière<i class="cp-pl"></i>16D<i class="cp-x"></i>au-delà</span></div>
    <div class="cp" data-carte>
      <span class="cp-c0"></span>${MOM.map(([m, t]) => `<span class="cp-ch">${ico(MOMENT[m].ic, 14)}<span${/\d/.test(t) ? ' class="nb"' : ''}>${t}</span></span>`).join('')}
      ${data.axes.dose_gL.map((d) => `<span class="cp-rh"><b class="nb">${String(d).replace('.', ',')}</b> g/L</span>${MOM.map(([m]) => `<button class="cs" data-role="reglage" data-reglage="case" data-m="${m}" data-d="${d}" aria-pressed="false"></button>`).join('')}`).join('')}
    </div>
    <p class="cp-f" data-role="ecart" aria-live="polite"></p>
  </section>

  <section class="carte prof" data-role="simulation" aria-label="La case touchée, famille par famille">
    <div class="prof-h"><span class="mot m-est">~ simulé</span><b data-case-titre></b><span class="lk2"><i class="lx-g"></i>ma bière</span></div>
    <div class="lns">${lanes}</div>
    <div class="pq" data-role="pourquoi"></div>
    <p class="mes-c" data-mesure-case hidden></p>
    <div class="bio">${S.LEVURES.map((l) => ['actif', 'apres', 'aucun'].map((ph) => `<div data-bio-k="${l}|${ph}" hidden>${S.bioHTML(l, ph)}</div>`).join('')).join('')}<p class="bio-ns" data-bio-ns hidden><span class="mot m-inc">inconnu</span> effet de cette levure non simulé pour un houblon seul : profil d’US-05</p></div>
    <p class="bn"><span class="mot m-inc" data-inconnu>inconnu</span><span data-nature="mesure" data-source="H">en bière noire</span></p>
  </section>

  <section class="carte vraies" aria-label="Les vraies valeurs du houblon">
    <div class="vr-h"><span class="mot m-mes">vraies valeurs</span><span class="aide">lot, fiches, mesures en bière</span></div>
    ${HB.map((h, k) => `<div data-vr="${esc(h)}" hidden>${S.vraies(h, MES[h], { n: k + 1 })}<div class="ets">${S.etudes(h)}</div></div>`).join('')}
  </section>
  ${S.legende(`<div class="leg-s"><h3>La carte</h3><div class="leg-g l2"><span class="leg-i"><span class="leg-c"><i class="cp-pl"></i></span><span>plafond du style dans chaque case</span></span><span class="leg-i"><span class="leg-c"><i class="cp-x"></i></span><span>orangé : au-delà du style</span></span><span class="leg-i"><span class="leg-c"><span class="mot m-mes">mesuré</span></span><span>une mesure publiée existe pour cette case</span></span></div></div>`)}`;

const fond = ORDRE.map((f) => `--b-${f}:${J[f].base}`).join(';');
const CSS = `
  .outils { align-items: center; }
  .reg { gap: 6px; }
  .rg { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .rg-l { font-size: 12px; color: var(--gris); width: 48px; flex: none; }
  .rg-n { font-size: 12px; color: var(--gris); }
  .rg-v { padding-left: 52px; min-height: 22px; }
  .hv { display: inline-flex; align-items: center; gap: 7px; flex-wrap: wrap; }
  .hv .vf { margin-left: 4px; }
  .hu-v { font-size: 12px; color: var(--gris); } .hu-v b { color: var(--encre); font-weight: 600; }
  .ch { display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 9px; border-radius: 14px; background: #ececf1; font-size: 12px; font-weight: 600; color: var(--encre); white-space: nowrap; }
  .ch[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .ch .pt, .vv-h .pt { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex: none; }
  .jr { border-radius: 15px; }
  .jr button { height: 26px; padding: 0 9px; font-size: 12px; border-radius: 13px; }
  .jr button[aria-checked="true"] { background: var(--encre); color: #fff; }
  .jr.off { opacity: .45; }
  .lv { height: 26px; }
  .rg [data-reglage="second"] { padding: 0 7px; }
  .rg [data-reglage="second"] .pt { display: none; }
  .rg [data-reglage="second"]:disabled { opacity: .35; }

  /* La carte : 5 moments × 4 doses ; une case = l'empreinte de la bière, 12 barres de l5b. */
  .carte-p { gap: 4px; }
  .cp-h { display: flex; align-items: center; gap: 8px; font-size: 12px; }
  .cp-lg { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; color: var(--gris); }
  .cp-pl { display: inline-block; width: 14px; height: 0; border-top: 1.5px dashed var(--encre); }
  .cp-g { display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: #b4b6be; }
  .cp-pl { margin-left: 6px; }
  .cp-x { display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: var(--acc); margin-left: 6px; }
  .cp { display: grid; grid-template-columns: 34px repeat(5, 1fr); gap: 3px; align-items: stretch; }
  .cp-ch { display: flex; flex-direction: column; align-items: center; gap: 1px; font-size: 12px; font-weight: 600; color: var(--gris); padding-bottom: 2px; }
  .cp-rh { display: flex; flex-direction: column; justify-content: center; font-size: 12px; color: var(--gris); line-height: 1.1; }
  .cp-rh b { font: 600 13px var(--mono); color: var(--encre); }
  .cs { position: relative; height: 66px; border-radius: 8px; background: #f6f7f9; box-shadow: inset 0 0 0 1px #e3e5eb; display: flex; flex-direction: column; justify-content: flex-end; padding: 3px 3px 2px; gap: 1px; overflow: hidden; }
  .cs[aria-pressed="true"] { background: #fff; box-shadow: inset 0 0 0 2px var(--encre); }
  .cs.prec { box-shadow: inset 0 0 0 1.5px #8a909b; }
  .cs-e { position: relative; height: 42px; display: flex; align-items: flex-end; justify-content: center; gap: 1px; }
  .cs-e i { width: 3px; border-radius: 1px 1px 0 0; background: var(--c); position: relative; }
  .cs-e i.x { background: linear-gradient(to top, var(--c) 0 var(--z), #c2410c var(--z) 100%); }
  .cs-e i.inc { height: 3px !important; background: repeating-linear-gradient(135deg, #fff 0 1px, #aeb3be 1px 2px); }
  .cs-e i.cap::after { content: ''; position: absolute; left: -1px; top: -4px; border: 2.5px solid transparent; border-bottom: 3px solid #c2410c; border-top: 0; }
  .cs-pl { position: absolute; left: 0; right: 0; height: 0; border-top: 1.5px dashed var(--encre); pointer-events: none; }
  .cs-m { font-size: 12px; font-weight: 600; text-align: center; white-space: nowrap; line-height: 14px; }
  .cs-m.hst { color: #a3340a; }
  .cs-mes { position: absolute; left: 2px; top: 2px; font-size: 12px; font-weight: 700; color: #fff; background: var(--encre); border-radius: 6px; padding: 0 4px; line-height: 14px; }
  .cp-f { font-size: 13px; line-height: 1.3; min-height: 17px; }
  .cp-f b { font-weight: 700; }

  .prof-h { display: flex; align-items: center; gap: 8px; font-size: 13px; }
  .prof-h .lk2 { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--gris); font-weight: 600; }
  .lk2 i { display: inline-block; width: 16px; height: 8px; border-radius: 2px; }
  .lf-g { top: 2px; height: 10px; border-radius: 2px; background: #fff; box-shadow: inset 0 0 0 1.5px var(--c); }
  .lf-b { top: 4px; height: 6px; border-radius: 0 2px 2px 0; background: var(--c); overflow: hidden; }
  .lf-w.ouvert { -webkit-mask-image: linear-gradient(90deg, #000 75%, rgba(0,0,0,.25)); mask-image: linear-gradient(90deg, #000 75%, rgba(0,0,0,.25)); }
  .lf-w.ouvert::after { display: none; }
  .lf-inc { left: 0; top: 3px; width: 46px; height: 8px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #aeb3be 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .lf.vide .lf-t { color: var(--gris); font-weight: 400; }
  .pq { display: flex; flex-wrap: wrap; gap: 4px; }
  .pq span { font-size: 12px; padding: 2px 8px; border-radius: 9px; background: #f3f4f7; }
  .pq span b { font-weight: 600; }
  .mes-c { font-size: 12px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .bio { font-size: 12px; }
  .bn { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); }

  .vraies { gap: 6px; }
  .vr-h { display: flex; align-items: center; gap: 8px; }
  .aide { font-size: 12px; color: var(--gris); }
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
`;

const JS = fs.readFileSync(path.join(ICI, 'page-s3.js'), 'utf8');
S.ecrire(path.join(ICI, 'etat.html'), S.page({
  titre: 'Carte des possibles', css: CSS, corps, js: JS, data,
  commentaire: 'Lot 21 · s3 · La carte des possibles : toute la grille du moteur pour un houblon (moments × doses), chaque case en empreinte au style 16D, un toucher la détaille avec les vraies valeurs. Données : ' + fichier + ', comparatifs-dryhop.json, base/consolide (fiches, α). Générée par generateur-s3.mjs (../s1/socle-s.mjs, ../s1/sim-runtime.js, page-s3.js).',
}));
