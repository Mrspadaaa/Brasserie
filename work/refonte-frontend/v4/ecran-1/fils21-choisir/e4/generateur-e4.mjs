// Lot 21 · e4 · « Ce qui départage » : un ladder qui classe seulement sur ce qui sépare vraiment
// (relance du critique, SYNTHESE.md §2 et critique/e.md). Pour une famille :
//   1. les échelons de DOSE où chaque houblon SORT de la 16D (au repère simulé, profils-simules.json
//      à 4,75 % vol.) : 1, 2, 4, 8 g/L, la grille du moteur ; deux houblons sur le même échelon ne se
//      départagent pas : ils restent groupés, par ordre alphabétique, sans faux rang ;
//   2. à l'intérieur d'un échelon, et entre échelons, ce que la MESURE prouve : le 4MMP sur une même
//      méthode (Hopsteiner 2024), la bière mesurée par une même étude (E06, au-dessus de la bière sans
//      houblon), l'huile par gramme ; une preuve s'écrit avec sa source et son facteur, en bande ;
//   3. ensemble (2 + 2 g/L) : sort ou reste.
// Le geste au premier écran : « ta dose » glisse sur l'échelle (1, 2, 4, 8 g/L, la grille), et les
// houblons au-dessus de la ligne passent hors du style. État de départ : dry hop en fermentation active,
// US-05 (retouche 1 du critique). Les données restent, l'explication va derrière un toucher.
// Usage : node generateur-e4.mjs → e4/etat.html ; node jouer-e4.mjs → e4/geste-e4.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../e1/socle-e.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const { ico, J, ORDRE, COURT, picto, esc } = S;
const RT = fs.readFileSync(path.join(ici, '../e1/runtime-commun.js'), 'utf8') + '\n' + fs.readFileSync(path.join(ici, 'runtime-e4.js'), 'utf8');
const NOMS = S.SIMULES;

// ---------- les preuves : ce que la mesure sépare, et seulement cela ----------
const MOT = S.MOTEUR.varietes;
const cleDe = (n) => S.HOPS[n].cle;
const PREUVES = Object.fromEntries(ORDRE.map((f) => [f, []]));
const TOUTES = []; // les preuves qui valent pour toutes les familles (l'huile)
const separe = (a, b) => a && b && a[0] != null && b[1] != null && a[0] > b[1];
const facteur = (a, b) => [a[0] / b[1], a[1] != null && b[0] ? a[1] / b[0] : null];
for (const A of NOMS) for (const B of NOMS) {
  if (A === B) continue;
  const ma = MOT[cleDe(A)], mb = MOT[cleDe(B)];
  // 4MMP sur la même méthode (LC-MS/MS, un laboratoire, 97 variétés) : tropical et petits fruits.
  const ba = ma && ma.teneurs['4MMP'] && ma.teneurs['4MMP'].bc, bb = mb && mb.teneurs['4MMP'] && mb.teneurs['4MMP'].bc;
  if (separe(ba, bb)) for (const f of ['tropical', 'berries']) PREUVES[f].push({ a: A, b: B, quoi: '4MMP, même méthode', unite: 'µg/kg', va: ba, vb: bb, f: facteur(ba, bb), source: 'H11', niveau: 'P', ref: 'Hopsteiner 2024' });
  // L'huile par gramme : une force, pas un goût ; elle vaut pour toutes les familles.
  if (separe(ma && ma.huile.plage, mb && mb.huile.plage)) TOUTES.push({ a: A, b: B, quoi: 'huile par gramme', unite: 'mL/100 g', va: ma.huile.plage, vb: mb.huile.plage, f: facteur(ma.huile.plage, mb.huile.plage), source: [...new Set([...ma.huile.sources, ...mb.huile.sources])].join(', '), niveau: 'F', ref: 'fiches publiées' });
}
// La bière mesurée par une même étude : séparées si les écarts-types ne se touchent pas ; le facteur se
// lit au-dessus de la bière sans houblon de l'étude.
for (const e of S.ETUDES) {
  const tem = {};
  for (const m of e.mesures) if (/témoin/.test(m.variete) && typeof m.valeur === 'number') tem[m.compose || m.descripteur] = m;
  const par = {};
  for (const m of e.mesures) { const n = S.nomPage(m.variete); if (n && NOMS.includes(n) && typeof m.valeur === 'number' && m.famille) (par[m.famille + '|' + (m.compose || m.descripteur)] ||= []).push({ ...m, nom: n }); }
  for (const [k, ms] of Object.entries(par)) {
    const [f, quoi] = k.split('|'), t = tem[quoi];
    for (const x of ms) for (const y of ms) {
      if (x === y || x.nom === y.nom || S.aVerifier(x) || S.aVerifier(y) || /part extraite|extraction/.test(quoi)) continue;
      if (x.valeur - (x.ecart || 0) > y.valeur + (y.ecart || 0)) {
        const au = t && x.valeur > t.valeur && y.valeur > t.valeur ? (x.valeur - t.valeur) / (y.valeur - t.valeur) : null;
        PREUVES[f].push({ a: x.nom, b: y.nom, quoi: quoi + ' en bière', unite: x.unite, va: [x.valeur, x.valeur], vb: [y.valeur, y.valeur], ea: x.ecart, eb: y.ecart, temoin: t ? t.valeur : null, au, source: e.id, niveau: e.niveau, ref: e.ref.split(',')[0].split(' ')[0] + ' ' + (e.ref.match(/\b(19|20)\d{2}\b/) || [''])[0], dose: e.conditions.dose_gL == null ? 'dose non publiée' : null });
      }
    }
  }
}
const ETUDES_HOPS = S.ETUDES.filter((e) => e.mesures.some((m) => NOMS.includes(S.nomPage(m.variete)))).map((e) => e.id);

// ---------- la page ----------
const fam = (f) => `<button type="button" class="fa" role="radio" data-role="famille" data-f="${f}" aria-checked="false" style="--f:${J[f].fond};--b:${J[f].base};--t:${J[f].texte}">${picto(f, 18)}<span>${COURT[f]}</span></button>`;
const ORDRE_E4 = ['tropical', 'citrus', 'berries', 'floral', 'stoneFruit', 'green', 'spice', 'herbal', 'melon', 'resin', 'pomeFruit', 'earthy'];
const corps = `
  <header class="barre">
    <a class="retour" href="#" aria-label="Retour">${ico('i-chev-l', 16)}</a>
    <h1 class="ti">Ce qui départage</h1>
    <span class="sty" data-nature="mesure" data-source="BJCP 2021, 16D (H39)" aria-label="Style 16D : arôme de houblon faible et facultatif (BJCP 2021)">16D</span>
    <button class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende">${ico('i-aide', 18)}</button>
  </header>
  <div class="outils">
    <div class="seg lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>
  </div>
  <div class="regs" id="regs" aria-label="Réglages"></div>
  <div class="fams" role="radiogroup" aria-label="Famille">${ORDRE_E4.map(fam).join('')}</div>
  <section class="geste" aria-label="Ta dose">
    <label class="ge-l" for="dose"><span>ta dose</span><b class="nb" id="dose-v">4 g/L</b></label>
    <input type="range" id="dose" min="0" max="3" step="1" value="2" data-role="reglage" data-reglage="dose" aria-label="Ta dose de dry hop, en g/L : 1, 2, 4 ou 8 (la grille du moteur)">
    <span class="ge-t" aria-hidden="true"><span>1</span><span>2</span><span>4</span><span>8 g/L</span></span>
  </section>
  <p class="repn" id="rep" data-role="reponse"></p>
  <section class="sim" data-role="simulation" aria-label="Les échelons de dose, simulés">
    <div class="lad-h" id="lad-t"></div>
    <div class="ech" id="ech"></div>
  </section>
  <section class="prv" id="prv" aria-label="Ce que la mesure prouve"></section>
  <section class="ens" id="ens" aria-label="Ensemble"></section>
  ${S.legende(`
    <div class="leg-s"><h3>Le ladder</h3><div class="leg-g l1">
      <span class="leg-i"><span class="leg-c"><b class="nb">2–4 g/L</b></span><span>l’échelon où le houblon sort de la 16D, au repère simulé (grille 1, 2, 4, 8 g/L)</span></span>
      <span class="leg-i"><span class="leg-c"><span class="ex-l">ta dose</span></span><span>au-dessus de la ligne : hors du style à ta dose</span></span>
      <span class="leg-i"><span class="leg-c"><span class="ex-g">≈</span></span><span>même échelon, rien de mesuré pour les séparer : ordre alphabétique, pas un rang</span></span>
      <span class="leg-i"><span class="leg-c"><span class="pf-ex">devant</span></span><span>prouvé par une mesure : même méthode, même étude, ou huile par gramme</span></span>
      <span class="leg-i"><span class="leg-c"><i class="hach" style="width:28px;height:12px"></i></span><span>inconnu : pas simulé pour ce goût, jamais zéro</span></span>
    </div></div>
    <div class="leg-s"><h3>Pourquoi des échelons</h3><p class="leg-p">Les bornes du moteur vont de ≤ 1 g/L à plus de 8 g/L pour presque tous : la bande ne départage pas. Le repère, lui, franchit le plafond à un échelon de la grille ; entre deux échelons, l’ordre serait une interpolation : on ne l’écrit pas.</p></div>`)}`;

const CSS = `
  .ti { font-size: 16px; font-weight: 700; flex: 1; min-width: 0; white-space: nowrap; }
  .sty { height: 22px; padding: 0 8px; border-radius: 11px; background: #fff; box-shadow: inset 0 0 0 1px rgba(22,22,26,.12); font: 600 12px var(--sans); display: inline-flex; align-items: center; color: var(--encre); }
  .outils { align-items: center; }
  .outils .regs { flex: 1; min-width: 0; justify-content: flex-end; }
  .geste { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 6px 10px 4px; display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 0 10px; }
  .ge-l { display: flex; flex-direction: column; font-size: 12px; color: var(--gris); line-height: 1.1; }
  .ge-l b { font-size: 16px; color: var(--encre); font-weight: 600; }
  #dose { width: 100%; height: 32px; accent-color: var(--encre); margin: 0; }
  .ge-t { grid-column: 2; display: flex; justify-content: space-between; font: 500 12px var(--mono); color: var(--gris); margin-top: -6px; }
  .repn { font-size: 15px; line-height: 1.3; font-weight: 600; padding: 0 2px; }
  .repn .xs { color: var(--acc); }
  .sim { display: flex; flex-direction: column; gap: 3px; }
  .lad-h { display: flex; align-items: center; gap: 6px; min-height: 22px; font-size: 12px; padding: 0 2px; flex-wrap: wrap; }
  .lad-h .src { margin-left: auto; }
  .lad-tt { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; }
  .pe.mini { width: 40px; }
  .pf-q { display: inline-flex; align-items: center; gap: 3px; }
  .grp-e > .eq { flex-basis: 100%; }
  .ech { display: flex; flex-direction: column; gap: 3px; }
  .er { position: relative; display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 6px; align-items: center; min-height: 40px; padding: 4px 6px; background: #fff; border-radius: 8px; box-shadow: var(--ombre); }
  .er.vide { background: rgba(255,255,255,.55); box-shadow: none; min-height: 28px; }
  .er.hors::before { content: ''; position: absolute; left: 0; top: 6px; bottom: 6px; width: 3px; border-radius: 0 2px 2px 0; background: var(--acc); }
  .er-d { display: flex; flex-direction: column; font-size: 12px; color: var(--gris); line-height: 1.15; }
  .er-d b { font: 600 13px var(--mono); color: var(--encre); white-space: nowrap; }
  .er.hors .er-d .hs-t { color: var(--acc); font-weight: 700; }
  .er-c { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; min-width: 0; }
  .ch { display: inline-flex; align-items: center; gap: 4px 6px; flex-wrap: wrap; padding: 3px 8px; border-radius: 8px; background: #f6f6f9; box-shadow: inset 0 0 0 1px rgba(22,22,26,.08); font-size: 14px; cursor: pointer; }
  .er.hors .ch { background: #fdf0ea; box-shadow: inset 0 0 0 1px rgba(194,65,12,.35); }
  .ch .ve { font-size: 12px; }
  .grp-e { display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; padding: 2px 2px 2px 6px; border-radius: 8px; box-shadow: inset 0 0 0 1.5px #9a9aa6; }
  .grp-e > .eq { font-size: 12px; font-weight: 700; color: var(--gris); }
  .pf-in { flex-basis: 100%; display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--encre); }
  .ligne { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--acc); padding: 0 2px; }
  .ligne::before, .ligne::after { content: ''; flex: 1; border-top: 2px solid var(--acc); }
  body.abs .ligne { color: var(--encre); } body.abs .ligne::before, body.abs .ligne::after { border-top-color: var(--encre); }
  .prv, .ens { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 6px 8px 8px; display: flex; flex-direction: column; gap: 5px; }
  .sec-h { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; flex-wrap: wrap; }
  .pf { display: flex; flex-direction: column; gap: 1px; }
  .pf + .pf { border-top: 1px solid var(--trait); padding-top: 4px; }
  .pf-h { display: flex; align-items: center; gap: 4px 6px; flex-wrap: wrap; font-size: 14px; }
  .pf-h .sup { font-weight: 700; color: var(--encre); padding: 0 6px; border-radius: 9px; background: var(--encre); color: #fff; font-size: 12px; }
  .pf-v { display: flex; align-items: baseline; gap: 4px; font-size: 12px; color: var(--gris); flex-wrap: wrap; }
  .pf-v b { font: 600 13px var(--mono); color: var(--encre); }
  .pf-ex { display: inline-flex; padding: 0 6px; border-radius: 9px; background: var(--encre); color: #fff; font-size: 12px; font-weight: 700; }
  .ex-l { font-size: 12px; font-weight: 700; color: var(--acc); border-top: 2px solid var(--acc); padding-top: 1px; }
  .ex-g { display: inline-flex; padding: 0 6px; border-radius: 8px; box-shadow: inset 0 0 0 1.5px #9a9aa6; font-weight: 700; color: var(--gris); }
  .np { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--encre); flex-wrap: wrap; }
  .np .hach { width: 26px; height: 12px; }
  .ld { position: relative; height: 30px; }
  .ld::before { content: ''; position: absolute; left: 0; right: 0; top: 15px; height: 6px; border-radius: 3px; background: linear-gradient(90deg, #f3f3f6 0 50%, #e9e9ef 50% 100%); }
  .ld-t { position: absolute; top: 12px; height: 12px; width: 1px; background: #c4c6ce; }
  .ld-t.eq { top: 8px; height: 20px; width: 2px; margin-left: -1px; background: var(--encre); }
  .ld-b { position: absolute; top: 13px; height: 10px; background: var(--c); border-radius: 4px; }
  .ld-b.ouvert-d { border-radius: 4px 0 0 4px; }
  .ld .ll-g { top: -1px; }
  .en-l { display: flex; flex-direction: column; gap: 4px; }
  .en-r { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .en-r .k { font-size: 12px; font-weight: 700; min-width: 52px; }
  .en-r .k.xs { color: var(--acc); }
  .pa { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 8px; background: #f6f6f9; box-shadow: inset 0 0 0 1px rgba(22,22,26,.08); font-size: 13px; }
  .pa .pl { color: var(--gris); font-weight: 600; }
  .inc-l { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); padding: 2px; }
  .inc-l .hach { width: 26px; height: 12px; }
  .resine { display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 6px 8px; background: #fff; border-radius: 8px; box-shadow: var(--ombre); }
  .pe-z { background: var(--zf, #f3e8f7) !important; }
  .pe.large { width: 100%; height: 18px; }
  .pe.large::before { top: 7px; }
  .pe.large .pe-b, .pe.large .pe-x { top: 5px; height: 8px; }
  .pr-dr { display: flex; flex-wrap: wrap; gap: 4px; }
  .drp { font-size: 12px; padding: 1px 7px; border-radius: 9px; background: #ececf1; }
  .drp.inc { background: #fff; box-shadow: inset 0 0 0 1px #aeb3be; color: var(--gris); }
  .drp.xs { background: #fdf0ea; color: #9a3412; font-weight: 600; }
  .lev-n { font-size: 12px; color: var(--gris); white-space: nowrap; align-self: center; padding-left: 2px; }
  .bio > span { font-size: 12px; font-weight: 600; margin-left: 2px; }
  .pq { font-size: 13px; }
`;
const donnees = { ...S.donneesCommunes(NOMS), GRILLE: S.indexGrille(), PAIRES: S.indexPaires(), PREUVES, TOUTES, ETUDES_HOPS, defaut: { fam: 'tropical' } };
const page = S.page({
  titre: 'Ce qui départage · dry hop',
  commentaire: 'Lot 21 · e4 : le ladder qui classe sur ce qui sépare (échelons de dose où l’on sort de la 16D, au repère simulé ; preuves mesurées : même méthode, même étude, huile par gramme). Généré par e4/generateur-e4.mjs (../e1/socle-e.mjs, ../e1/runtime-commun.js, runtime-e4.js).',
  css: CSS, corps, donnees, script: RT, fiches: NOMS,
});
S.ecrire(path.join(ici, 'etat.html'), page);
console.log('preuves', Object.fromEntries(ORDRE.map((f) => [f, PREUVES[f].map((p) => p.a + '>' + p.b + ' ' + p.quoi)]).filter(([, v]) => v.length)), 'toutes', TOUTES.map((p) => p.a + '>' + p.b));
