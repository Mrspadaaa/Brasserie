// Lot 21 · e2 · « Le duel, par gramme puis par famille ». Deux houblons à réglages égaux, Citra contre
// Cascade d'abord (« d'après nos outils ils sont assez similaires »). En haut, PAR GRAMME, les vraies
// valeurs du houblon (huile, 4MMP, la même méthode Hopsteiner 2024, linalol, myrcène) : le facteur
// A ÷ B en bande, sur une piste logarithmique centrée sur « = » (une bande qui passe « = » ne départage
// pas) ; puis la mesure en bière si une même étude a mesuré les deux, sinon le trou. Ensuite, FAMILLE
// PAR FAMILLE, l'estimé ~ des deux (plein pour A, contour pour B) devant la zone de la 16D, les familles
// où ils diffèrent le plus en tête ; les réglages (dose, moment, jours, levure) reclassent. B peut être
// une paire : A + un autre ensemble, 2 + 2 g/L, contre A seul à 4 g/L. Toucher une famille : ses
// preuves (les deux estimés, le calculé du moteur avec sa bande, les mesures) ; appui long : la fiche.
// Usage : node generateur-e2.mjs → e2/etat.html (socle et runtime commun : ../e1/).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../e1/socle-e.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const { ico, J } = S;
const RT = fs.readFileSync(path.join(ici, '../e1/runtime-commun.js'), 'utf8') + '\n' + fs.readFileSync(path.join(ici, 'runtime-e2.js'), 'utf8');

const corps = `
  <header class="barre">
    <a class="retour" href="#" aria-label="Retour">${ico('i-chev-l', 16)}</a>
    <h1 class="ti">Duel · dry hop</h1>
    <span class="sty" data-nature="mesure" data-source="BJCP 2021, 16D (H39)" aria-label="Style 16D : arôme de houblon faible et facultatif, terreux, herbacé ou floral (BJCP 2021)">16D</span>
    <button class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende des pistes et des signes">${ico('i-aide', 18)}</button>
  </header>
  <div class="outils">
    <div class="seg lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>
  </div>
  <div class="duel" id="duel"></div>
  <div class="regs" id="regs" aria-label="Réglages, les mêmes pour les deux"></div>
  <div class="cumul" id="adv" aria-label="L'adversaire"></div>
  <div id="pq"></div>
  <section class="gramme" id="gramme" aria-label="Par gramme : les vraies valeurs"></section>
  <section class="sim" data-role="simulation" aria-label="Famille par famille, estimé">
    <div class="lad-h" id="fam-t"></div>
    <div class="fams-l" id="fam"></div>
    <div id="drap"></div>
  </section>
  ${S.legende(`
    <div class="leg-s"><h3>Le duel</h3><div class="leg-g l1">
      <span class="leg-i"><span class="leg-c"><span class="du-m plein"></span></span><span>A, le premier houblon : piste pleine</span></span>
      <span class="leg-i"><span class="leg-c"><span class="du-m creux"></span></span><span>B, l’adversaire : piste en contour</span></span>
      <span class="leg-i"><span class="leg-c"><span class="ld-ex"><i></i></span></span><span>par gramme : A ÷ B ; au milieu « = » ; à droite, A devant</span></span>
      <span class="leg-i"><span class="leg-c"><span class="vd eq">≈</span></span><span>non départagés : la bande passe « = », ou les estimés se recouvrent de moitié</span></span>
      <span class="leg-i"><span class="leg-c"><i class="hach" style="width:28px;height:12px"></i></span><span>pas d’étude, ou valeur inconnue : jamais zéro</span></span>
    </div></div>`)}`;

const CSS = `
  .ti { font-size: 16px; font-weight: 700; flex: 1; min-width: 0; white-space: nowrap; }
  .sty { height: 22px; padding: 0 8px; border-radius: 11px; background: #fff; box-shadow: inset 0 0 0 1px rgba(22,22,26,.12); font: 600 12px var(--sans); display: inline-flex; align-items: center; color: var(--encre); }
  .duel { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: stretch; gap: 6px; }
  .du-a, .du-b { display: flex; flex-wrap: wrap; align-items: center; gap: 3px 6px; background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 6px 8px; font-size: 15px; min-width: 0; position: relative; }
  .du-a { box-shadow: var(--ombre), inset 0 0 0 2px var(--encre); }
  .du-b { box-shadow: var(--ombre), inset 0 0 0 1.5px #9a9aa6; }
  .du-b .pl { color: var(--gris); font-weight: 600; }
  .du-al { display: inline-flex; flex-basis: 100%; }
  .du-c { position: absolute; right: 4px; top: 4px; width: 26px; height: 26px; border-radius: 50%; background: #ececf1; display: inline-flex; align-items: center; justify-content: center; }
  .du-vs { align-self: center; font-size: 12px; font-weight: 700; color: var(--gris); }
  .du-m { display: inline-block; width: 12px; height: 12px; border-radius: 2px; flex: none; }
  .du-m.plein { background: var(--encre); }
  .du-m.creux { background: #fff; box-shadow: inset 0 0 0 2px var(--encre); }
  .cumul { display: flex; align-items: center; gap: 6px; background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 3px 4px 3px 8px; }
  .cu-t { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; white-space: nowrap; flex: none; }
  .cu-l { display: flex; gap: 3px; overflow-x: auto; scrollbar-width: none; flex: 1; min-width: 0; }
  .cu-l::-webkit-scrollbar { display: none; }
  .cu { flex: none; height: 28px; padding: 0 10px; border-radius: 14px; background: #ececf1; font-size: 13px; font-weight: 600; white-space: nowrap; color: var(--encre); display: inline-flex; align-items: center; gap: 4px; }
  .cu[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .cu-p { background: #fff; box-shadow: inset 0 0 0 1.5px #c4c6ce; }
  #pq { display: flex; flex-direction: column; gap: 3px; padding: 0 2px; }
  .gramme { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 6px 8px 8px; display: flex; flex-direction: column; gap: 6px; }
  .sec-h { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; }
  .sec-h .src { margin-left: auto; font-weight: 400; }
  .gr { display: flex; flex-direction: column; gap: 1px; }
  .gr + .gr { border-top: 1px solid var(--trait); padding-top: 4px; }
  .gr-h { display: flex; align-items: center; gap: 5px; font-size: 13px; flex-wrap: wrap; }
  .gr-h svg:not(.pi) { color: var(--gris); }
  .gr-n { font-weight: 600; }
  .gr-v { display: inline-flex; align-items: baseline; gap: 4px; }
  .gr-v b { font-size: 13px; font-weight: 600; }
  .vd { margin-left: auto; font-size: 12px; font-weight: 700; white-space: nowrap; padding: 1px 7px; border-radius: 9px; }
  .vd.a { background: var(--encre); color: #fff; }
  .vd.b { background: #fff; color: var(--encre); box-shadow: inset 0 0 0 1.5px var(--encre); }
  .vd.eq { background: #ececf1; color: var(--encre); }
  .vd.inc { background: #fff; color: var(--gris); box-shadow: inset 0 0 0 1px #aeb3be; font-weight: 400; }
  .vd .nb { font-size: 12px; }
  .ld { position: relative; height: 34px; }
  .ld::before { content: ''; position: absolute; left: 0; right: 0; top: 17px; height: 6px; border-radius: 3px; background: linear-gradient(90deg, #f3f3f6 0 50%, #e9e9ef 50% 100%); }
  .ld-t { position: absolute; top: 14px; height: 12px; width: 1px; background: #c4c6ce; }
  .ld-t.eq { top: 10px; height: 20px; width: 2px; margin-left: -1px; background: var(--encre); }
  .ld-b { position: absolute; top: 15px; height: 10px; background: var(--c); border-radius: 4px; }
  .ld-b.eq { background: repeating-linear-gradient(90deg, color-mix(in srgb, var(--c) 70%, #fff) 0 6px, color-mix(in srgb, var(--c) 30%, #fff) 6px 9px); border: 1.5px solid var(--c); box-sizing: border-box; }
  .ld-b.ouvert-d { border-radius: 4px 0 0 4px; } .ld-b.ouvert-g { border-radius: 0 4px 4px 0; }
  .ld .ll-c { top: 11px; height: 18px; background: #fff; box-shadow: 0 0 0 1.5px var(--encre); }
  .ld-ax { display: flex; justify-content: space-between; font-size: 12px; color: var(--gris); margin-top: -2px; }
  .ld-ax span:nth-child(2) { font-weight: 700; color: var(--encre); }
  .gr-lots { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); }
  .gr-b { display: flex; align-items: center; gap: 6px; padding-top: 4px; border-top: 1px solid var(--trait); }
  .gr-bl { display: flex; align-items: center; gap: 4px 5px; font-size: 13px; flex-wrap: wrap; }
  .gr-bl b { font-weight: 600; }
  .mes-trou { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--encre); padding: 4px 0 0; border-top: 1px solid var(--trait); }
  .mes-trou .hach { width: 34px; height: 14px; }
  .sim { display: flex; flex-direction: column; gap: 3px; }
  .lad-h { display: flex; align-items: center; gap: 6px; min-height: 24px; font-size: 12px; padding: 0 2px; }
  .lad-h .src { margin-left: auto; }
  .lad-tt { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; white-space: nowrap; }
  .fams-l { display: flex; flex-direction: column; gap: 3px; }
  .fl { display: grid; grid-template-columns: 84px minmax(0, 1fr) auto 16px; align-items: center; gap: 6px; padding: 4px 2px 4px 6px; background: #fff; border-radius: 8px; box-shadow: var(--ombre); cursor: pointer; }
  .fl-n { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: var(--t); white-space: nowrap; overflow: hidden; }
  .fl-p { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .fl-l { display: flex; }
  .fl-l .pe { flex: 1; width: auto; }
  .fl-l.creux .pe-b { background: #fff; box-shadow: inset 0 0 0 1.5px var(--b); }
  .fl-l.creux .pe-x { background: #fff; box-shadow: inset 0 0 0 1.5px var(--acc); }
  .fl-v .vd { margin-left: 0; }
  .lr-p { width: 16px; height: 28px; display: inline-flex; align-items: center; justify-content: center; color: var(--gris); }
  .coupe { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); padding: 4px 4px 0; }
  .pe.large { width: 100%; height: 18px; }
  .pe.large::before { top: 7px; }
  .pe.large .pe-b, .pe.large .pe-x { top: 5px; height: 8px; }
  .pe-z { background: var(--zf, #f3e8f7) !important; }
  .pr-dr { display: flex; flex-wrap: wrap; gap: 4px; padding: 2px; }
  .drp { font-size: 12px; padding: 1px 7px; border-radius: 9px; background: #ececf1; }
  .drp.inc { background: #fff; box-shadow: inset 0 0 0 1px #aeb3be; color: var(--gris); }
  .drp.xs { background: #fdf0ea; color: #9a3412; font-weight: 600; }
  .bio > span { font-size: 12px; font-weight: 600; margin-left: 2px; }
  .ld-ex { position: relative; display: inline-block; width: 30px; height: 10px; background: #f3f3f6; }
  .ld-ex i { position: absolute; left: 40%; width: 50%; top: 2px; height: 6px; background: rgba(22,22,26,.55); border-radius: 2px; }
`;
const donnees = { ...S.donneesCommunes(), GRILLE: S.indexGrille(), PAIRES: S.indexPaires(), defaut: { a: 'Citra', b: 'Cascade' } };
const page = S.page({
  titre: 'Le duel · dry hop',
  commentaire: 'Lot 21 · e2 : deux houblons à réglages égaux ; par gramme (vraies valeurs, facteur A ÷ B en log), puis famille par famille (estimé de profils-simules.json). Généré par e2/generateur-e2.mjs (../e1/socle-e.mjs, ../e1/runtime-commun.js, runtime-e2.js).',
  css: CSS, corps, donnees, script: RT,
});
S.ecrire(path.join(ici, 'etat.html'), page);
