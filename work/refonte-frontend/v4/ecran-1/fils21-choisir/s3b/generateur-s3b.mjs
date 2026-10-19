// Lot 21 · s3b · « La carte des possibles », seconde passe (critique/SYNTHESE.md §3 et §4, critique/s.md).
// s3 reste intacte pour comparer. Ce qui change :
//   - la carte au premier plan, les réglages en une ligne de pastilles qui s'ouvrent ; l'état de départ en
//     dry hop actif avec US-05 (la levure bouge au premier toucher) ;
//   - dans chaque case, quatre barres des familles qui bougent (nommées une fois en tête), les pictos des
//     familles hors du style à la place du nombre ; plus de tour grise : le résineux de ta dégustation est
//     dit une fois, sous la carte ;
//   - le geste : le doigt glisse sur la carte, la case sous le doigt se lit en grand (loupe) et le détail
//     suit ; une vue « pente » (ce que rapporte le gramme suivant), au curseur aimanté sur la grille ;
//   - la réponse en une ligne, la dose limite par houblon, le classement mesuré (E06) ; à un toucher : ton
//     défi, « tire une bière », les preuves ;
//   - sur le profil simulé régénéré à 4,75 % vol. et E04 relu (lecture H, vérifié par K).
// Usage : node generateur-s3b.mjs  →  s3b/etat.html
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as S from './socle-s3b.mjs';
const { ORDRE, ico, esc, MOMENT, COUL, picto, J, rgba, NOM, COURT } = S;
const ICI = path.dirname(fileURLToPath(import.meta.url));

const { P, fichier } = S.charger();
const data = S.simdata(P);
const HB = S.HB_PAGE, MES = data.mesures;
const CMP = S.CMP;
const E = (id) => CMP.etudes.find((e) => e.id === id);
// E04, lecture H vérifiée par K : intensité, agrumes, herbacé selon la dose (Cascade, 24 h, sur 15)
data.e04 = E('E04').mesures.filter((m) => m.dose_gL != null && m.descripteur).map((m) => ({ d: m.dose_gL, k: /citrus/.test(m.descripteur) ? 'agrumes' : /herbal/.test(m.descripteur) ? 'herbacé' : 'intensité', v: m.valeur }));
// L'IBU : celui de ma bière (calcul de l'app, c1) et ceux des ajouts à chaud du moteur (cas K1, 4 g/L)
const C1 = JSON.parse(fs.readFileSync(S.K.E1 + '/fils15-s5-complexe/donnees/c1.json', 'utf8'));
data.ibu = { biere: C1.ibu, bande: C1.bandeIbu, ajouts: {} };
for (const c of P.cas.filter((x) => x.groupe === 'K1')) { const m = c.mesures.find((x) => x.type === 'ibu'); if (m) data.ibu.ajouts[c.ajouts[0].nom + '|' + c.ajouts[0].moment] = { v: m.valeur, min: m.plage.min, max: m.plage.max, dose: c.ajouts[0].dose_gL, src: m.source }; }
// Les vérifications du moteur sur des mesures en bière (fils19-choix/donnees/verifications.json)
const VER = JSON.parse(fs.readFileSync(S.K.E1 + '/fils19-choix/donnees/verifications.json', 'utf8'));

const lanes = ORDRE.filter((f) => f !== 'resin').map((f) => S.rangee(f, { series: ['g', 'w', 'b'] })).join('');
const MOM = [['b60', '60′'], ['b10', '10′'], ['wp', 'whirlpool'], ['dryActive', 'actif'], ['dryPost', 'après']];
const opt = (k, v, lib, extra = '') => `<button class="op" data-role="reglage" data-reglage="${k}" data-v="${esc(v)}" aria-pressed="false"${extra}>${lib}</button>`;
const hopLib = (h) => `<i class="pt" style="background:${COUL[h]}" data-houblon-compare="${esc(h)}" data-couleur="${COUL[h]}"></i>${esc(h)}`;

// ---------- les preuves (u5) : le mur des mesures en bière, la simulation rejouée, les trous ----------
const MUR_C = [['linalol', 'floral'], ['géraniol', 'floral'], ['myrcène', 'resin'], ['4MMP', 'tropical'], ['3MH', 'citrus']];
function mur() {
  const cel = (h, comp) => {
    const out = [];
    for (const e of CMP.etudes) for (const m of e.mesures) {
      const v = (m.variete || '').replace('-', ' ');
      if (v !== h || !m.compose || typeof m.valeur !== 'number') continue;
      const c = m.compose.toLowerCase();
      if ((comp === 'linalol' && /^linalol$/.test(c)) || (comp === 'géraniol' && /^g[ée]raniol$/.test(c)) || (comp === 'myrcène' && /^myrc/.test(c)) || (comp === '4MMP' && /4-?mmp/i.test(c)) || (comp === '3MH' && /^3mh$/i.test(c))) out.push({ v: m.valeur, u: m.unite, e: e.id, av: e.id === 'E03' || /vérifier/.test((m.note || '') + (m.lecture || '')) });
    }
    for (const x of VER.verifications) if (x.houblon === h && ({ linalol: 'linalol', géraniol: 'geraniol', '4MMP': '4MMP', '3MH': '3MH' })[comp] === x.compose) out.push({ v: x.mesure.min === x.mesure.max ? x.mesure.min : String(x.mesure.min).replace('.', ',') + '–' + String(x.mesure.max).replace('.', ','), u: x.unite, e: x.sources.join(' ') });
    if (!out.length) return `<td class="trou" data-nature="mesure" data-source="J"><span>trou</span></td>`;
    return `<td data-nature="mesure" data-source="${out.map((o) => o.e).join(' ')}">${out.map((o) => `<b class="nb">${String(o.v).replace('.', ',')}</b> <span class="u">${o.u}</span>${o.av ? ' <span class="mot m-av">à vérifier</span>' : ''}`).join('<br>')}</td>`;
  };
  const tab = `<table class="mur"><thead><tr><th></th>${MUR_C.map(([c, f]) => `<th>${picto(f, 12)}${c}</th>`).join('')}</tr></thead><tbody>${HB.map((h) => `<tr><th>${hopLib(h)}</th>${MUR_C.map(([c]) => cel(h, c)).join('')}</tr>`).join('')}</tbody></table>`;
  const ver = VER.verifications.map((v) => `<li data-nature="mesure" data-source="${v.sources.join(' ')}">${picto(v.compose === '4MMP' ? 'tropical' : v.compose === '3MH' ? 'citrus' : 'floral', 12)}<b>${v.houblon}, ${S.NOM_COMP[v.compose] || v.compose}</b> mesuré <span class="nb">${String(v.mesure.min === v.mesure.max ? v.mesure.min : v.mesure.min + '–' + v.mesure.max).replace(/\./g, ',')}</span> ${v.unite} : <span class="${/sous/.test(v.verdict) && !/borne haute/.test(v.verdict) ? 'hst' : ''}">${esc(v.verdict)}</span></li>`).join('');
  const trous = ['Citra contre Cascade, même bière, même dose', 'Galaxy en bière, chiffré', 'Idaho 7 en dry hop', 'les thiols en bière, par variété', 'variété × levure × dry hop', 'l’ordre de deux dry hops'];
  return `<div class="pv-t">en bière, mesuré (µg/L ou ng/L)</div>${tab}<div class="pv-t">la simulation tombe-t-elle juste ?</div><ul class="ver">${ver}</ul><div class="pv-t">les trous</div><p class="trous">${trous.map((t) => `<span class="mot m-inc">trou</span> ${t}`).join('<br>')}</p>`;
}

const corps = `${S.barre('Carte des possibles <small>16D</small>')}
  <div class="outils">${S.lentille()}<div class="seg vue" role="radiogroup" aria-label="Vue"><button role="radio" data-role="reglage" data-reglage="vue" data-v="carte" aria-checked="true">carte</button><button role="radio" data-role="reglage" data-reglage="vue" data-v="pente" aria-checked="false">pente</button></div></div>
  <section class="regl" aria-label="Réglages">
    <div class="pills"><button class="pil" data-pil="houblon" aria-expanded="false"><span data-pil-v="houblon"></span>${ico('i-chev-d', 12)}</button><button class="pil" data-pil="second" data-role="reglage" data-reglage="ajout-cumule" aria-expanded="false"><span data-pil-v="second"></span>${ico('i-chev-d', 12)}</button><button class="pil" data-pil="jours" aria-expanded="false"><span data-pil-v="jours"></span>${ico('i-chev-d', 12)}</button><span class="seg lev" role="radiogroup" aria-label="Levure">${data.axes.levureGrille.map((l) => `<button role="radio" data-role="reglage" data-reglage="levure" data-v="${l}" aria-checked="${l === 'US-05'}">${l}</button>`).join('')}</span></div>
    <div class="ops" data-ops="houblon" hidden>${HB.map((h) => opt('houblon', h, hopLib(h), ` data-houblon="${esc(h)}"`)).join('')}</div>
    <div class="ops" data-ops="second" data-role="ajout" hidden>${opt('second', '', 'seul')}${HB.map((h) => opt('second', h, '+ ' + hopLib(h))).join('')}<span class="aide">2 g/L en dry hop</span></div>
    <div class="ops" data-ops="jours" hidden>${data.axes.jours.map((j) => opt('jours', j, `<span class="nb">${j}</span> j`)).join('')}</div>
    <div class="hvs">${HB.map((h) => `<span class="hv" data-hv="${esc(h)}" hidden>${S.usage(h).replace(/ data-houblon="[^"]*"/, '')}${S.alpha(h)}${S.stock(h)}<button class="vf" data-fiche="${esc(h)}" aria-label="Voir la fiche de ${esc(h)}">fiche${ico('i-chev-r', 12)}</button></span>`).join('')}</div>
  </section>

  <section class="carte carte-p" data-role="simulation" aria-label="La carte : chaque moment, chaque dose">
    <div class="cp-h"><span class="mot m-est">~ simulé</span><span class="cp-f4" data-f4></span><span class="cp-lg"><i class="cp-pl"></i>16D</span></div>
    <div class="cp" data-carte>
      <span class="cp-c0"></span>${MOM.map(([m, t]) => `<span class="cp-ch">${ico(MOMENT[m].ic, 14)}<span${/\d/.test(t) ? ' class="nb"' : ''}>${t}</span></span>`).join('')}
      ${data.axes.dose_gL.map((d) => `<span class="cp-rh"><b class="nb">${String(d).replace('.', ',')}</b> <span class="u">g/L</span></span>${MOM.map(([m]) => `<button class="cs" data-role="reglage" data-reglage="case" data-m="${m}" data-d="${d}" aria-pressed="false"></button>`).join('')}`).join('')}
    </div>
    <div class="pente" data-pente hidden>
      <svg class="pe-s" data-pe-svg width="350" height="150" viewBox="0 0 350 150" role="img" aria-label="Ce que rapporte chaque gramme, au moment touché"></svg>
      <div class="pe-c"><input type="range" class="pe-r" data-role="reglage" data-reglage="dose" min="0.5" max="8" step="0.1" value="4" aria-label="Dose en g/L, aimantée sur la grille du moteur"><output class="pe-b" data-pe-bulle hidden></output></div>
      <p class="pe-a" data-pe-aimant hidden></p>
      <p class="pe-m" data-nature="mesure" data-source="E04">${picto('citrus', 12)}${picto('herbal', 12)}<span class="mot m-mes">mesuré</span> Cascade, 24 h : intensité <b class="nb">6,3</b> → <b class="nb">8,1</b> → <b class="nb">10,4</b> sur 15 à 2, 3,86 et 8 g/L <span class="src">Lafontaine 2018 [E04], vérifié (K)</span></p>
    </div>
    <p class="rep1" data-role="reponse" aria-live="polite"></p>
  </section>
  <div class="loupe" data-loupe hidden aria-hidden="true"><b data-loupe-t></b><span data-loupe-h></span></div>

  <section class="carte prof" data-role="simulation" aria-label="La case touchée, famille par famille">
    <div class="prof-h"><span class="mot m-est">~ simulé</span><b data-case-titre></b><span class="lk2 mbk"><i class="lx-g"></i>ma bière</span></div>
    <p class="ecg" data-role="ecart" aria-live="polite"></p>
    <div class="lns">${lanes}</div>
    <p class="res1" data-res1></p>
    <div class="bio">${S.LEVURES.map((l) => ['actif', 'chaud', 'apres', 'aucun'].map((ph) => `<div data-bio-k="${l}|${ph}" hidden>${S.bioHTML(l, ph)}</div>`).join('')).join('')}</div>
    <p class="aide">Verdant, Diamond : pas encore simulées seules</p>
  </section>

  <section class="carte lim" aria-label="Dose limite au style, par houblon">
    <div class="vr-h"><b>dose limite au style 16D</b><span class="aide" data-lim-m></span></div>
    <div data-lim></div>
    ${S.etudes('Citra').split('<div class="me trou"')[0]}
  </section>

  <div class="blocs" role="group" aria-label="À un toucher"><button class="bl" data-bloc="defi" aria-expanded="false">ton défi</button><button class="bl" data-bloc="tire" aria-expanded="false">tire une bière</button><button class="bl" data-bloc="preuve" aria-expanded="false">les preuves</button></div>
  <section class="carte bk" data-bk="defi" hidden aria-label="Ton défi : ta dégustation du 18.10"><div class="vr-h"><b>ton défi</b><span class="aide">« trop résineuse, je la veux plus florale », 18.10</span></div><div class="dfs" data-defi></div></section>
  <section class="carte bk" data-bk="tire" hidden aria-label="Tire une bière possible">
    <div class="vr-h"><b>tire une bière</b><span class="aide">l’étendue du possible, pas une probabilité mesurée</span></div>
    <div class="ti-b"><button class="ch" data-role="reglage" data-reglage="tirer" data-v="1">une bière</button><button class="ch" data-role="reglage" data-reglage="tirer" data-v="20">vingt bières</button></div>
    <div class="ti" data-tire></div>
    <p class="ti-c" data-tire-c></p>
    <p class="aide">d’où vient l’écart : les seuils varient de ×10 à ×80 selon la source, la part retrouvée de 7 à 100 % (H §0.6, §8.2). Ce qui tranche en vrai : une dégustation de ton brassin, un dosage du lot.</p>
  </section>
  <section class="carte bk" data-bk="preuve" hidden aria-label="Les preuves">${mur()}</section>

  <section class="carte vraies" aria-label="Les vraies valeurs du houblon">
    <div class="vr-h"><span class="mot m-mes">vraies valeurs</span></div>
    ${HB.map((h, k) => `<div data-vr="${esc(h)}" hidden>${S.vraies(h, MES[h], { n: k + 1 })}<div class="ets">${h === 'Citra' ? '<div class="me trou"' + S.etudes(h).split('<div class="me trou"')[1] : S.etudes(h)}</div></div>`).join('')}
  </section>
  ${S.legende(`<div class="leg-s"><h3>La carte</h3><div class="leg-g l2"><span class="leg-i"><span class="leg-c"><i class="cp-pl"></i></span><span>plafond du style 16D dans chaque case</span></span><span class="leg-i"><span class="leg-c"><i class="lx-x"></i></span><span>orangé : au-delà du style</span></span><span class="leg-i"><span class="leg-c">${picto('tropical', 12)}</span><span>sous « hors » : les familles qui sortent du style</span></span><span class="leg-i"><span class="leg-c"><span class="leg-doigt" aria-hidden="true"></span></span><span>appuie sur une case, puis glisse : la case se lit en grand ; un glissé direct fait défiler</span></span></div></div>`)}`;

const CSS = `
  .outils { align-items: center; }
  .vue { border-radius: 13px; }
  .vue button { height: 22px; padding: 0 10px; font-size: 12px; border-radius: 11px; }
  .vue button[aria-checked="true"] { background: var(--encre); color: #fff; }
  .regl { display: flex; flex-direction: column; gap: 4px; }
  .pills { display: flex; gap: 4px; flex-wrap: wrap; }
  .pil { display: inline-flex; align-items: center; gap: 3px; height: 28px; padding: 0 8px 0 10px; border-radius: 14px; background: #fff; box-shadow: var(--ombre); font-size: 13px; font-weight: 600; white-space: nowrap; }
  .pil[aria-expanded="true"] { background: var(--encre); color: #fff; }
  .pil .pt { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 3px; }
  .ops { display: flex; gap: 4px; flex-wrap: wrap; align-items: center; padding: 4px; background: #fff; border-radius: 8px; box-shadow: var(--ombre); }
  .op { display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 10px; border-radius: 14px; background: #ececf1; font-size: 12px; font-weight: 600; white-space: nowrap; }
  .op[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .op:disabled { opacity: .35; }
  .op .pt, .ch .pt, .vv-h .pt, .mur .pt { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex: none; }
  .aide { font-size: 12px; color: var(--gris); }
  .hvs { min-height: 22px; padding: 0 2px; }
  .hv { display: inline-flex; align-items: center; gap: 7px; flex-wrap: wrap; }
  .hu-v { font-size: 12px; color: var(--gris); } .hu-v b { color: var(--encre); font-weight: 600; }

  /* La carte : 5 moments × 4 doses ; une case = quatre barres de l5b, nommées en tête, et les familles hors du style. */
  .carte-p { gap: 4px; }
  .cp-h { display: flex; align-items: center; gap: 6px; font-size: 12px; }
  .cp-f4 { display: inline-flex; gap: 6px; flex-wrap: wrap; }
  .cp-f4 span { display: inline-flex; align-items: center; gap: 2px; font-weight: 600; color: var(--t); }
  .cp-lg { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; color: var(--gris); }
  .cp-pl { display: inline-block; width: 14px; height: 0; border-top: 1.5px dashed var(--encre); }
  .cp { display: grid; grid-template-columns: 30px repeat(5, 1fr); gap: 3px; align-items: stretch; touch-action: manipulation; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
  .cp.lecture { touch-action: none; }
  .cp.lecture .cs { transition: none; }
  .cp-ch { display: flex; flex-direction: column; align-items: center; gap: 1px; font-size: 12px; font-weight: 600; color: var(--gris); }
  .cp-rh { display: flex; flex-direction: column; justify-content: center; font-size: 12px; color: var(--gris); line-height: 1.1; }
  .cp-rh b { font: 600 13px var(--mono); color: var(--encre); }
  .cs { position: relative; height: 74px; border-radius: 8px; background: #f6f7f9; box-shadow: inset 0 0 0 1px #e3e5eb; display: flex; flex-direction: column; justify-content: flex-start; align-items: stretch; padding: 3px 3px 2px; gap: 1px; }
  .cs[aria-pressed="true"] { background: #fff; box-shadow: inset 0 0 0 2px var(--encre); }
  .cs.prec { box-shadow: inset 0 0 0 1.5px #8a909b; }
  .cs.sous { box-shadow: inset 0 0 0 2px var(--encre), 0 0 0 3px rgba(22,22,26,.18); }
  .cs-e { position: relative; height: 40px; display: flex; align-items: flex-end; justify-content: center; gap: 3px; }
  .cs-e i { width: 6px; border-radius: 2px 2px 0 0; position: relative; }
  .cs-e i.cap::after { content: ''; position: absolute; left: 0; top: -4px; border: 3px solid transparent; border-bottom: 3px solid #c2410c; border-top: 0; }
  .cs-e i.inc { height: 3px !important; background: repeating-linear-gradient(135deg, #fff 0 1px, #aeb3be 1px 2px) !important; }
  .cs-pl { position: absolute; left: 0; right: 0; bottom: 12px; height: 0; border-top: 1.5px dashed var(--encre); pointer-events: none; }
  .cs-h { display: flex; flex-direction: column; align-items: center; gap: 0; min-height: 26px; }
  .cs-h .mh { font-size: 12px; font-weight: 600; color: #a3340a; line-height: 13px; }
  .cs-h .ph { display: flex; flex-wrap: nowrap; justify-content: center; gap: 1px; max-width: 64px; }
  .cs-h .ph svg { width: 10px; height: 10px; }
  .cs-mes { position: absolute; right: 2px; top: 2px; font-size: 12px; font-weight: 700; color: #fff; background: var(--encre); border-radius: 6px; padding: 0 4px; line-height: 14px; }
  .rep1 { font-size: 13px; line-height: 1.3; font-weight: 600; }
  .rep1 .hst { color: #a3340a; }
  .loupe { position: fixed; z-index: 40; pointer-events: none; transform: translate(-50%, -100%); background: #fff; border-radius: 8px; box-shadow: 0 0 0 2px var(--encre), 0 10px 24px -8px rgba(22,22,26,.5); padding: 4px 12px 6px; display: flex; flex-direction: column; align-items: center; }
  .loupe b { font: 700 36px/1.05 var(--sans); white-space: nowrap; }
  .loupe span { display: inline-flex; align-items: center; gap: 3px; font-size: 13px; font-weight: 600; color: #a3340a; }
  .pente { display: flex; flex-direction: column; gap: 4px; }
  .pe-s text { font-family: var(--sans); }
  .pe-c { position: relative; padding: 0 2px; }
  .pe-r { width: 100%; height: 32px; accent-color: #16161a; }
  .pe-b { position: absolute; top: -48px; transform: translateX(-50%); background: #fff; border-radius: 8px; box-shadow: 0 0 0 2px var(--encre); padding: 2px 10px; font: 700 36px/1.1 var(--sans); white-space: nowrap; pointer-events: none; }
  .pe-a { font-size: 12px; color: var(--gris); }
  .pe-m { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; font-size: 12px; }

  .prof-h { display: flex; align-items: center; gap: 4px 8px; font-size: 13px; flex-wrap: wrap; }
  .ecg { font-size: 13px; line-height: 1.3; min-height: 17px; }
  .ecg b { font-weight: 700; }
  .lf-g { top: 2px; height: 10px; border-radius: 2px; background: #fff; box-shadow: inset 0 0 0 1.5px var(--c); }
  .lf-b { top: 4px; height: 6px; border-radius: 0 2px 2px 0; background: var(--c); overflow: hidden; }
  .lf-w { top: 4px; height: 6px; border-radius: 3px; background: var(--z); box-shadow: none; }
  .lf-w.ouvert { border-radius: 3px 0 0 3px; -webkit-mask-image: linear-gradient(90deg, #000 70%, rgba(0,0,0,.15)); mask-image: linear-gradient(90deg, #000 70%, rgba(0,0,0,.15)); }
  .lf-inc { left: 0; top: 3px; width: 46px; height: 8px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #aeb3be 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .lf.vide .lf-t { color: var(--gris); font-weight: 400; }
  .lf.avinc .lf-n { flex-wrap: wrap; row-gap: 0; }
  .lf.avinc .lf-n::after { content: 'avant inconnu'; flex-basis: 100%; padding-left: 20px; font-size: 12px; line-height: 13px; color: var(--gris); white-space: nowrap; }
  .res1 { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--gris); flex-wrap: wrap; }
  .res1 b { color: var(--encre); }
  .bio { font-size: 12px; }
  .lev { border-radius: 15px; }
  .lev button { height: 26px; padding: 0 10px; font-size: 13px; border-radius: 13px; }
  .lev button[aria-checked="true"] { background: var(--encre); color: #fff; }
  .prof-h .mbk { margin-left: auto; font-size: 12px; color: var(--gris); white-space: nowrap; }
  .lk3 { display: flex; gap: 10px; flex-wrap: wrap; font-size: 12px; color: var(--gris); }
  .lk2 { display: inline-flex; align-items: center; gap: 4px; }
  .lk2 i { display: inline-block; width: 16px; height: 8px; border-radius: 2px; }
  .lk2 .lx-w { height: 6px !important; background: ${rgba(J.tropical.base, 0.16)}; box-shadow: none; }

  .lim { gap: 5px; }
  .vr-h { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .li { display: grid; grid-template-columns: 74px 1fr auto; align-items: center; column-gap: 8px; font-size: 12px; min-height: 22px; }
  .li-n { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; font-size: 13px; }
  .li-n .pt { width: 8px; height: 8px; border-radius: 50%; }
  .li-p { display: flex; gap: 3px; }
  .li-p i { display: inline-flex; align-items: center; justify-content: center; min-width: 34px; height: 20px; border-radius: 10px; font: 500 12px var(--mono); font-style: normal; background: #eef7ee; color: #2f5f2a; box-shadow: inset 0 0 0 1px #9dc49a; }
  .li-p i.x { background: #fdeee6; color: #a3340a; box-shadow: inset 0 0 0 1px #e9a27f; }
  .li-v { font-weight: 600; white-space: nowrap; }
  .li.moi .li-n { text-decoration: underline; text-underline-offset: 3px; }

  .blocs { display: flex; gap: 4px; }
  .bl { flex: 1; height: 32px; border-radius: 16px; background: #fff; box-shadow: var(--ombre); font-size: 13px; font-weight: 600; }
  .bl[aria-expanded="true"] { background: var(--encre); color: #fff; }
  .dfs { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
  .df { border-radius: 8px; padding: 6px 8px; background: #f6f7f9; display: flex; flex-direction: column; gap: 2px; font-size: 12px; }
  .df b { font-size: 13px; display: inline-flex; align-items: center; gap: 4px; }
  .df .v { font-weight: 700; font-size: 13px; }
  .df.ok .v { color: #2f5f2a; } .df.x .v { color: #a3340a; }
  .ti-b { display: flex; gap: 6px; }
  .ch { display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 12px; border-radius: 14px; background: #ececf1; font-size: 13px; font-weight: 600; }
  .ti { display: flex; flex-direction: column; gap: 2px; }
  .ti-l > span:first-child { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
  .ti-l { display: grid; grid-template-columns: 86px 1fr; align-items: center; column-gap: 6px; font-size: 12px; min-height: 16px; }
  .ti-p { position: relative; height: 12px; background: #f3f4f7; border-radius: 2px; }
  .ti-p .z { position: absolute; left: 0; top: 0; bottom: 0; background: var(--z); border-right: 1.5px solid var(--t); }
  .ti-p .d { position: absolute; top: 3px; width: 6px; height: 6px; margin-left: -3px; border-radius: 50%; background: var(--c); box-shadow: 0 0 0 1px #fff; }
  .ti-p .d.x { background: #c2410c; }
  .ti-c { font-size: 12px; }
  .pv-t { font-size: 12px; font-weight: 700; color: var(--gris); margin-top: 4px; }
  .mur { border-collapse: collapse; font-size: 12px; width: 100%; }
  .mur th, .mur td { border: 1px solid var(--trait); padding: 2px 3px; text-align: left; vertical-align: top; }
  .mur thead th { font-weight: 600; white-space: nowrap; }
  .mur thead th svg { display: inline-block; vertical-align: -1px; margin-right: 2px; }
  .mur tbody th { white-space: nowrap; font-weight: 600; }
  .mur td.trou { background: repeating-linear-gradient(135deg, #fff 0 3px, #eef0f4 3px 5px); color: var(--gris); }
  .ver { list-style: none; display: flex; flex-direction: column; gap: 3px; font-size: 12px; }
  .ver li { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
  .ver .hst { color: #a3340a; font-weight: 600; }
  .trous { font-size: 12px; line-height: 1.6; }

  .vraies { gap: 6px; }
  .vv { display: flex; flex-direction: column; gap: 4px; }
  .vv-h { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .vv-h .nm { font-size: 14px; }
  .vv-h .vf { margin-left: auto; }
  .vv-ref, .vv-res { font-size: 12px; color: var(--gris); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
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
`;

const JS = fs.readFileSync(path.join(ICI, 'page-s3b.js'), 'utf8');
S.ecrire(path.join(ICI, 'etat.html'), S.page({
  titre: 'Carte des possibles', css: CSS, corps, js: JS, data,
  commentaire: 'Lot 21 · s3b · La carte des possibles, seconde passe : carte au premier plan, glisser le doigt sur la carte, vue pente, dose limite par houblon, défi, tire une bière, preuves. Données : ' + fichier + ', comparatifs-dryhop.json (E04 lecture H, vérifié K), base/consolide (fiches, α). Générée par generateur-s3b.mjs (socle-s3b.mjs, sim-runtime.js, page-s3b.js).',
}));
