// Lot 21 · e1 · « Deux classements » : le mesuré au-dessus, l'estimé reclassé au doigt, les trous visibles.
// Pour une famille (une pastille, picto et nom), le classement MESURÉ en bière d'une étude publiée
// (comparatifs-dryhop.json : vraies valeurs, écart-type, témoin sans houblon, « à vérifier » et « figure »
// dits), puis le classement ESTIMÉ ~ des houblons simulés (profils-simules.json : grille[] et
// grillePaires[]), avec, sur chaque ligne, la vraie valeur de l'étude ou le trou hachuré ; les autres
// houblons du pack suivent par leurs fiches seules, « non simulés ». Les réglages (dose, moment, jours,
// levure, second houblon ajouté ensemble) reclassent l'estimé ; le plafond de la 16D coupe le classement.
// Toucher une ligne : ses preuves (mesuré, calculé par le moteur avec sa bande en log, estimé, fiches) ;
// appui long sur un nom : sa vraie fiche.
// Usage : node generateur-e1.mjs → e1/etat.html et ses vues de capture (vue-*.html).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from './socle-e.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const { ico, esc, picto, J, ORDRE, COURT } = S;
const RT = fs.readFileSync(path.join(ici, 'runtime-commun.js'), 'utf8') + '\n' + fs.readFileSync(path.join(ici, 'runtime-e1.js'), 'utf8');

// ---------- la page ----------
const fam = (f) => `<button type="button" class="fa" role="radio" data-role="famille" data-f="${f}" aria-checked="false" style="--f:${J[f].fond};--b:${J[f].base};--t:${J[f].texte}">${picto(f, 18)}<span>${COURT[f]}</span></button>`;
const ORDRE_E1 = ['floral', 'tropical', 'citrus', 'resin', 'stoneFruit', 'berries', 'herbal', 'spice', 'green', 'melon', 'pomeFruit', 'earthy'];
const corps = `
  <header class="barre">
    <a class="retour" href="#" aria-label="Retour">${ico('i-chev-l', 16)}</a>
    <h1 class="ti">Classer · dry hop</h1>
    <span class="sty" data-nature="mesure" data-source="BJCP 2021, 16D (H39)" aria-label="Style 16D : arôme de houblon faible et facultatif, terreux, herbacé ou floral (BJCP 2021)">16D</span>
    <button class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende des pictos et des pistes">${ico('i-aide', 18)}</button>
  </header>
  <div class="outils">
    <div class="seg lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>
    <div class="seg tri" role="radiogroup" aria-label="Classer par"><button role="radio" data-tri="estime" aria-checked="true">estimé</button><button role="radio" data-tri="mesure" aria-checked="false">mesuré</button></div>
  </div>
  <div class="fams" role="radiogroup" aria-label="Famille à classer">${ORDRE_E1.map(fam).join('')}</div>
  <div class="regs" id="regs" aria-label="Réglages du simulateur"></div>
  <div class="cumul" id="cumul" aria-label="Ajout cumulé"></div>
  <div id="pq"></div>
  <section class="mes" id="mes" aria-label="Le classement mesuré"></section>
  <section class="sim" data-role="simulation" aria-label="Le classement estimé, simulé">
    <div class="lad-h" id="lad-t"></div>
    <div class="lad" id="lad"></div>
    <div class="lad-f" id="ladf"></div>
  </section>
  ${S.legende(`
    <div class="leg-s"><h3>Les deux classements</h3><div class="leg-g l1">
      <span class="leg-i"><span class="leg-c"><span class="mb-ex"><i></i><i class="t"></i></span></span><span>mesuré en bière, une étude à la fois ; le trait : la bière sans houblon</span></span>
      <span class="leg-i"><span class="leg-c"><span class="pe" style="--b:${J.floral.base};--zs:50%;--za:55%;--bs:30%;--ws:40%;--cs:52%;--xls:50%;--xws:20%;--ba:30%;--wa:40%;--ca:52%;--xla:55%;--xwa:15%"><i class="pe-z"></i><i class="pe-b"></i><i class="pe-x"></i><i class="pe-c"></i></span></span><span>estimé ~ : la bande et son repère, devant la zone de la 16D ; l’orangé, hors du style</span></span>
      <span class="leg-i"><span class="leg-c"><b class="nb">2</b><i>=</i></span><span>ex æquo : leurs bandes se recouvrent</span></span>
      <span class="leg-i"><span class="leg-c"><i class="hach" style="width:28px;height:12px"></i></span><span>pas d’étude, ou estimé inconnu : jamais zéro</span></span>
      <span class="leg-i"><span class="leg-c"><span class="bio">${picto('floral', 12)}${ico('i-arrow-r', 12)}${picto('citrus', 12)}</span></span><span>biotransformation documentée ; trait fin : possible</span></span>
    </div></div>`)}`;

const CSS = `
  .ti { font-size: 16px; font-weight: 700; flex: 1; min-width: 0; white-space: nowrap; }
  .sty { height: 22px; padding: 0 8px; border-radius: 11px; background: #fff; box-shadow: inset 0 0 0 1px rgba(22,22,26,.12); font: 600 12px var(--sans); display: inline-flex; align-items: center; color: var(--encre); }
  .outils .tri button { padding: 0 9px; }
  .rg.on { background: var(--encre); color: #fff; }
  .rg.on .pts i { background: rgba(255,255,255,.4); } .rg.on .pts i.on { background: #fff; }
  #pq { display: flex; flex-direction: column; gap: 3px; min-height: 34px; padding: 0 2px; }
  .mes { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 6px 8px 6px; display: flex; flex-direction: column; gap: 4px; }
  .mes-h { display: flex; align-items: center; gap: 6px; min-height: 24px; font-size: 13px; }
  .mes-t { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mes-t b { font-weight: 600; }
  .mes-t svg { display: inline-block; vertical-align: -3px; margin-right: 2px; }
  .mes-b, .mes-e { height: 24px; padding: 0 4px 0 8px; border-radius: 12px; background: #ececf1; font: 600 12px var(--sans); display: inline-flex; align-items: center; gap: 2px; white-space: nowrap; color: var(--encre); }
  .mes-e { padding: 0 8px; }
  .mes-trou { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--encre); padding: 4px 0; }
  .mes-trou .hach { width: 34px; height: 14px; }
  .mes-c { font-size: 12px; color: var(--gris); }
  .mes-q { margin-left: 18px; font-size: 13px; display: flex; flex-direction: column; gap: 2px; }
  .mb-l { display: flex; flex-direction: column; gap: 2px; }
  .mb-r { display: grid; grid-template-columns: 104px minmax(0, 1fr) auto auto; align-items: center; gap: 6px; min-height: 18px; font-size: 13px; }
  .mb-r .hn { overflow: hidden; text-overflow: ellipsis; display: block; }
  .hn.hors { font-weight: 400; color: var(--gris); }
  .hn.tm { font-weight: 400; color: var(--gris); }
  .mb-t { position: relative; height: 10px; background: #f3f3f6; border-radius: 2px; }
  .mb-v { position: absolute; left: 0; top: 0; bottom: 0; background: var(--b); border-radius: 2px; }
  .mb-r.tm .mb-v { background: #c4c6ce; }
  .mb-tm { position: absolute; top: -3px; bottom: -3px; width: 0; border-left: 1.5px dashed var(--encre); }
  .mb-e { position: absolute; top: 4px; height: 2px; background: var(--encre); }
  .mv { font-size: 12px; font-weight: 600; white-space: nowrap; }
  .pm { font-weight: 400; color: var(--gris); }
  .mb-ex { display: inline-block; position: relative; width: 28px; height: 10px; background: #f3f3f6; }
  .mb-ex i { position: absolute; left: 0; top: 0; bottom: 0; width: 70%; background: ${J.floral.base}; }
  .mb-ex i.t { width: 0; left: 40%; border-left: 1.5px dashed #16161a; background: none; top: -3px; bottom: -3px; }
  .sim { display: flex; flex-direction: column; gap: 3px; }
  .lad-h { display: grid; grid-template-columns: auto minmax(0, 1fr) 44px; align-items: center; gap: 6px; min-height: 24px; font-size: 12px; padding: 0 30px 0 2px; }
  .lad-tt { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; white-space: nowrap; overflow: hidden; }
  .lad-m { font-weight: 600; color: var(--gris); text-align: center; }
  .lad { display: flex; flex-direction: column; gap: 3px; }
  .lr { position: relative; display: grid; grid-template-columns: 24px minmax(0, 1fr) 76px 16px; grid-template-rows: auto auto; align-items: center; gap: 2px 6px; padding: 4px 2px 5px 4px; background: #fff; border-radius: 8px; box-shadow: var(--ombre); cursor: pointer; }
  .lr-r { grid-row: 1 / 3; }
  .lr-h { grid-column: 2; grid-row: 1; }
  .lr-e { grid-column: 2; grid-row: 2; }
  .lr-m { grid-column: 3; grid-row: 1 / 3; }
  .lr-p { grid-column: 4; grid-row: 1 / 3; }
  .lr-e .pe { flex: 1; width: auto; min-width: 100px; }
  .ns-h { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 12px; color: var(--gris); padding: 6px 2px 2px; }
  .ns-l { display: flex; flex-wrap: wrap; gap: 4px; }
  .ns { display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 8px; border-radius: 13px; background: rgba(255,255,255,.8); box-shadow: inset 0 0 0 1px rgba(22,22,26,.08); font-size: 13px; }
  .ns .hn { font-weight: 600; }
  .ns-w { position: relative; display: inline-block; width: 18px; height: 6px; border-radius: 3px; background: #ececf1; overflow: hidden; }
  .ns-w i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--b); }
  .ns-n { font-size: 12px; color: var(--gris); padding: 2px; }
  .cumul { display: flex; align-items: center; gap: 6px; background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 3px 4px 3px 8px; }
  .cu-t { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; white-space: nowrap; flex: none; }
  .cu-l { display: flex; gap: 3px; overflow-x: auto; scrollbar-width: none; flex: 1; min-width: 0; }
  .cu-l::-webkit-scrollbar { display: none; }
  .cu { flex: none; height: 28px; padding: 0 10px; border-radius: 14px; background: #ececf1; font-size: 13px; font-weight: 600; white-space: nowrap; color: var(--encre); }
  .cu[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .grp { position: relative; display: flex; flex-direction: column; gap: 3px; padding-left: 10px; }
  .grp::before { content: ''; position: absolute; left: 1px; top: 6px; bottom: 20px; width: 5px; border: 2px solid #9a9aa6; border-right: 0; border-radius: 4px 0 0 4px; }
  .grp-c { font-size: 12px; color: var(--gris); padding: 0 4px 2px; }
  .ve .u { font-family: var(--sans); font-size: 12px; font-weight: 600; }
  .ve .nb { font-size: 13px; }
  .pe-z { background: var(--zf, #f3e8f7) !important; }
  .pe.large { width: 100%; height: 18px; }
  .pe.large::before { top: 7px; }
  .pe.large .pe-b, .pe.large .pe-x { top: 5px; height: 8px; }
  .pe-b.hp { border-radius: 3px 0 0 3px; }
  .pr-dr { display: flex; flex-wrap: wrap; gap: 4px; }
  .drp { font-size: 12px; padding: 1px 7px; border-radius: 9px; background: #ececf1; }
  .drp.inc { background: #fff; box-shadow: inset 0 0 0 1px #aeb3be; color: var(--gris); }
  .drp.xs { background: #fdf0ea; color: #9a3412; font-weight: 600; }
  .bio > span { font-size: 12px; font-weight: 600; margin-left: 2px; }
  .rg-p span:first-of-type { white-space: nowrap; }
  .lr.hors-s::before { content: ''; position: absolute; left: 0; top: 6px; bottom: 6px; width: 3px; border-radius: 0 2px 2px 0; background: var(--acc); }
  body.abs .lr.hors-s::before { display: none; }
  .lr.ref { background: #f6f6f9; box-shadow: inset 0 0 0 1.5px #9a9aa6; }
  .lr.f-source { box-shadow: 0 0 0 1.5px var(--encre), var(--ombre); }
  .lr-r { display: inline-flex; align-items: baseline; justify-content: center; font-size: 14px; }
  .lr-r i { font-style: normal; font-weight: 700; font-size: 12px; color: var(--gris); margin-left: 1px; }
  .lr-h { min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 1px 6px; font-size: 14px; }
  .lr-h .hn { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
  .lr-a { display: inline-flex; }
  .paire { display: inline-flex; align-items: center; gap: 3px; min-width: 0; flex-wrap: wrap; }
  .paire .pl { color: var(--gris); font-weight: 600; }
  .paire .hn + .pl + .hn { font-weight: 400; color: var(--gris); font-size: 13px; }
  .lr-e { display: inline-flex; align-items: center; gap: 5px; }
  .lr-m { display: inline-flex; flex-direction: column; align-items: flex-start; justify-content: center; font-size: 12px; line-height: 1.15; min-width: 0; }
  .lr-m .cn { display: inline-flex; align-items: center; gap: 2px; font-size: 12px; color: var(--encre); white-space: nowrap; }
  .lr-m .src { white-space: nowrap; }
  .lr-m.vide { align-items: center; }
  .lr-m b { font-weight: 600; font-size: 13px; }
  .lr-m .av { font-size: 12px; padding: 0 3px; }
  .lr-m.vide .hach { width: 30px; height: 12px; }
  .lr-p { width: 18px; height: 28px; display: inline-flex; align-items: center; justify-content: center; color: var(--gris); }
  .plaf { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--acc); padding: 2px 4px; }
  .plaf::before, .plaf::after { content: ''; flex: 1; border-top: 1.5px dashed var(--acc); }
  body.abs .plaf { color: var(--gris); } body.abs .plaf::before, body.abs .plaf::after { border-top-color: #c4c6ce; }
  .coupe { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); padding: 4px 4px 0; }
  .lad-f { display: flex; flex-direction: column; gap: 4px; }
`;

const donnees = { ...S.donneesCommunes(), GRILLE: S.indexGrille(), PAIRES: S.indexPaires(), defaut: { fam: 'floral' } };
const page = S.page({
  titre: 'Deux classements · dry hop',
  commentaire: 'Lot 21 · e1 : le classement mesuré (comparatifs-dryhop.json) au-dessus du classement estimé (maquette stub du profil simulé), reclassé par dose, moment, jours, levure et second houblon. Généré par e1/generateur-e1.mjs (socle-e.mjs, runtime-commun.js, runtime-e1.js, simu-stub.js).',
  css: CSS, corps, donnees, script: RT,
});
S.ecrire(path.join(ici, 'etat.html'), page);
for (const [n, q] of [['vue-tropical', 'fam=tropical'], ['vue-paire', 'part=Citra&dernier=part:on'], ['vue-actif', 'moment=dryActive&levure=lalbrew-pomona&dernier=levure:lalbrew-pomona'], ['vue-mesure', 'tri=mesure'], ['vue-preuves', 'preuves=Citra'], ['vue-fiche', 'fiche=Citra'], ['vue-legende', 'legende'], ['vue-60', 'moment=b60&dernier=moment:b60'], ['vue-absolu', 'abs']]) S.ecrire(path.join(ici, n + '.html'), S.vue('e1 · ' + n, 'etat.html?' + q));
