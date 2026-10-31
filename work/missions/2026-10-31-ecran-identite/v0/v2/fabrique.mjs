// v2 (froide) — la fiche du style, chiffre contre chiffre : chaque valeur de la recette tombe dans sa colonne
// (sous le style, dans le style, au-dessus), entre les vraies bornes du 22A. Le brassin en quatre tuiles.
// node work/missions/2026-10-31-ecran-identite/v0/v2/fabrique.mjs → etat.html
import fs from 'node:fs';
import { page, tete, pied, duStyle, boutonLegende, legende, C, STYLES, ebc, sg, ICO } from '../v1/commun.mjs';

const p = 'v2';
const S = STYLES['22A'];
const ROWS = [
  { k: 'OG', min: sg(S.og[0]), max: sg(S.og[1]), v: '1,080', zone: 'in' },
  { k: 'FG', min: sg(S.fg[0]), max: sg(S.fg[1]), v: null, pourquoi: 'FG : à la levure, étape 4' },
  { k: 'Alc.', min: '7,5 %', max: '10 %', v: null, pourquoi: 'Alcool : à la levure, étape 4' },
  { k: 'IBU', min: '60', max: '100', v: '~93', zone: 'in' },
  { k: 'EBC', min: String(ebc(S.srm[0])), max: String(ebc(S.srm[1])), v: '9,5', zone: 'bas', mot: 'pâle' },
];

function table(neuve = false) {
  const lignes = ROWS.map((r) => {
    const v = neuve ? null : r.v;
    const cell = (z) => (v && r.zone === z ? `<span class="${p}-v${z !== 'in' ? ` ${p}-v-h` : ''}">${v}${r.mot ? `<em>${r.mot}</em>` : ''}</span>` : '');
    const inconnu = !v ? `<span class="${p}-inc" role="img" aria-label="inconnu : ${r.pourquoi ?? ''}"></span>` : '';
    return `<button type="button" class="${p}-tr" data-booster="ligne-${r.k.replace('.', '')}" aria-expanded="false">
      <span class="${p}-k">${r.k}</span>
      <span class="${p}-z ${p}-zb">${cell('bas')}</span>
      <span class="${p}-b ${p}-mono">${r.min}</span>
      <span class="${p}-z ${p}-zi">${v ? cell('in') : inconnu}</span>
      <span class="${p}-b ${p}-mono">${r.max}</span>
      <span class="${p}-z ${p}-zh">${cell('haut')}</span>
    </button><div class="${p}-dt" hidden>${r.pourquoi ?? (r.k === 'EBC' ? 'BJCP en SRM 6–14, converti en EBC' : r.k === 'IBU' ? '~ simulé, étape Houblons' : 'BJCP 2021 · 22A')}</div>`;
  }).join('');
  return `<div class="${p}-tab" data-booster="tableau-style" role="table" aria-label="Ta recette dans les bornes du style">
    <div class="${p}-th"><span class="${p}-thl">${neuve ? '' : boutonLegende(p)}</span><span></span><span>min</span><span class="${p}-thi">22A</span><span>max</span><span></span></div>${lignes}</div>`;
}

const tuile = (lab, val, unite, sous, booster, extra = '') =>
  `<button type="button" class="${p}-tu" data-booster="${booster}"><span class="${p}-tl">${lab}</span><span class="${p}-tv"><b class="${p}-mono">${val}</b> ${unite}</span>${sous ? `<span class="${p}-ts">${sous}</span>` : ''}${extra}</button>`;

const brassin = (vol = 24, plein = false) => `<div class="${p}-g">
    ${tuile('Volume', vol, 'L', '', 'volume')}
    ${tuile('Ébullition', 60, 'min', '<span class="v2-eau"><span class="v2-mono">~3 L</span> évaporés</span>', 'ebullition')}
    <label class="${p}-tu ${p}-no" data-booster="nolo"><span class="${p}-tl">NOLO</span><span class="${p}-tv"><input type="checkbox"> <b class="${p}-mono">≤ 0,5 %</b></span></label>
    ${tuile('Fermenteur', `${vol}/30`, 'L', plein ? '<span class="v2-ap">plein</span>' : '', 'fermenteur', `<span class="${p}-jg${plein ? ` ${p}-jg-a` : ''}"><i style="width:${(vol / 30) * 100}%"></i><b></b></span>`)}
  </div>`;

const corps = `${tete(p)}
<main class="${p}-m">
  <div class="${p}-e1">
  <section class="${p}-pn" aria-label="La bière">
    <div class="${p}-ns">
      <label><span class="${p}-lb">Nom</span><input class="${p}-in" value="neipa v3"></label>
      <label><span class="${p}-lb">Style</span><button type="button" class="${p}-in ${p}-cb" data-booster="style">Double IPA ${ICO.chevron}</button></label>
    </div>
    ${table()}
    ${legende(p)}
    ${duStyle(p)}
  </section>
  <section class="${p}-pn ${p}-p2" aria-label="Le brassin">
    ${brassin()}
    <button type="button" class="${p}-dp" aria-expanded="false" data-booster="espace-libre"><span>Espace libre <span class="${p}-mono">~20 %</span> · cuve 45 L</span>${ICO.chevron}</button>
  </section>
  ${pied(p)}
  </div>
  <section class="${p}-et" aria-label="Autres états">
    <h2>Recette neuve : le collage d’abord, les bornes sans valeur</h2>
    <button type="button" class="${p}-imp">${ICO.coller} Coller une recette trouvée</button>
    <div class="${p}-pn">${table(true)}</div>
    <h2>Fermenteur plein</h2>
    <div class="${p}-pn">${brassin(30, true)}<p class="${p}-al" role="alert">30 L remplit le fermenteur : baisse le volume.</p></div>
    <h2>Style créé, hors liste</h2>
    <div class="${p}-pn"><div class="${p}-tab ${p}-vide">Aucune borne connue pour « NEIPA maison ».</div></div>
  </section>
</main>`;

const css = `
  .${p}-m{padding:8px 8px 0} .${p}-e1{min-height:728px;display:flex;flex-direction:column}
  .${p}-pn{background:${C.panneau};border-radius:16px;padding:8px;display:flex;flex-direction:column;gap:8px}
  .${p}-p2{margin-top:8px;gap:4px}
  .${p}-ns{display:grid;grid-template-columns:1fr 1.15fr;gap:6px}
  .${p}-ns label{display:flex;flex-direction:column;gap:2px;min-width:0}
  .${p}-lb{font-size:12px;color:${C.t2}}
  .${p}-in{height:34px;border:1px solid ${C.bord};border-radius:10px;background:${C.page};padding:0 10px;font:inherit;font-size:16px;color:${C.t0};width:100%;min-width:0}
  .${p} .${p}-cb{display:flex;align-items:center;justify-content:space-between;text-align:left;border:1px solid ${C.bord};background:${C.page};padding:0 8px 0 10px;white-space:nowrap}
  .${p}-cb svg{color:${C.t2};flex:none}
  .${p}-tab{display:flex;flex-direction:column;background:${C.page};border:1px solid ${C.bord};border-radius:10px;overflow:hidden}
  .${p}-th,.${p} .${p}-tr{display:grid;grid-template-columns:38px 1fr 62px 1.25fr 62px 1fr;align-items:center;width:100%}
  .${p}-th{height:28px;font-size:12px;color:#fff;background:${C.t0};text-align:center;border-bottom:1px solid ${C.bord}}
  .${p}-thl{display:flex;justify-content:center} .${p} .${p}-thl .${p}-lgb{color:#fff;border-color:#777;width:22px;height:22px}
  .${p}-thi{background:${C.hopT};color:#fff;font-weight:600;align-self:stretch;display:flex;align-items:center;justify-content:center}
  .${p} .${p}-tr{min-height:44px;border-bottom:1px solid ${C.panneau};text-align:center}
  .${p}-tr:last-of-type{border-bottom:0}
  .${p}-k{font-size:13px;color:${C.t2};text-align:left;padding-left:8px}
  .${p}-b{font-size:13px;color:${C.t2}}
  .${p}-z{align-self:stretch;display:flex;align-items:center;justify-content:center}
  .${p}-zi{background:rgba(86,127,69,.2)}
  .${p}-v{font-family:'IBM Plex Mono',monospace;font-variant-numeric:tabular-nums;font-size:17px;font-weight:600;color:${C.t0};display:flex;flex-direction:column;align-items:center;line-height:1.1}
  .${p}-v-h{color:${C.attT};border:1.5px solid ${C.att};border-radius:10px;padding:2px 6px;background:#FBF4E6}
  .${p}-v em{font-style:normal;font-family:'Source Sans 3',sans-serif;font-size:12px;font-weight:600}
  .${p}-inc{width:44px;height:20px;border:1.5px dashed ${C.trait};border-radius:8px;background:repeating-linear-gradient(135deg,${C.bord} 0 3px,transparent 3px 6px)}
  .${p}-dt{font-size:12px;color:${C.t2};padding:2px 8px 6px;background:${C.page}}
  .${p}-g{display:grid;grid-template-columns:1fr 1fr;gap:6px}
  .${p} .${p}-tu{display:flex;flex-direction:column;align-items:flex-start;gap:2px;background:${C.t0};color:#fff;border:1px solid ${C.t0};border-radius:10px;padding:6px 8px 16px;min-height:70px;text-align:left;position:relative}
  .${p}-tl{font-size:12px;color:#CFCFCF}
  .${p}-tv{font-size:13px;color:#CFCFCF;display:flex;align-items:center;gap:4px}
  .${p}-tv b{font-size:24px;color:#fff;font-weight:600}
  .${p}-no .${p}-tv b{font-size:16px}
  .${p}-no input{width:20px;height:20px;margin:0;accent-color:${C.paille}}
  .${p}-ts{font-size:12px;color:#CFCFCF}
  .${p}-eau{color:#8FC3E6}
  .${p}-ap{color:#F29289;font-weight:600}
  .${p}-jg{position:absolute;left:8px;right:8px;bottom:6px;height:6px;border-radius:9px;background:#444}
  .${p}-jg i{position:absolute;left:0;top:0;bottom:0;border-radius:9px;background:${C.hopT}}
  .${p}-jg b{position:absolute;left:80%;top:-3px;bottom:-3px;border-left:2px dashed #fff}
  .${p}-jg-a i{background:${C.alerte}}
  .${p} .${p}-dp{display:flex;align-items:center;justify-content:space-between;min-height:28px;width:100%;font-size:13px;color:${C.t1};text-align:left;padding:0 2px}
  .${p}-dp svg{color:${C.t2}}
  .${p} .${p}-imp{display:flex;align-items:center;gap:8px;height:32px;padding:0 10px;border:1px solid ${C.bordM};border-radius:10px;font-size:14px;align-self:flex-start}
  .${p}-al{margin:0;font-size:13px;color:${C.alerteT}}
  .${p}-vide{padding:10px;font-size:13px;color:${C.t2};text-align:center;border-style:dashed}
  .${p}-et{margin-top:24px;border-top:1px dashed ${C.bordM};padding-top:8px;display:flex;flex-direction:column;gap:6px}
  .${p}-et h2{margin:4px 0 0;font-size:13px;color:${C.t2};font-weight:600}
  .${p}-tr:active{background:${C.surface}} .${p}-tu:active{background:#333}`;

const js = `
  document.querySelectorAll('.${p}-tr').forEach(function(b){b.addEventListener('click',function(){var d=b.nextElementSibling;d.hidden=!d.hidden;b.setAttribute('aria-expanded',String(!d.hidden));});});`;

fs.writeFileSync(new URL('./etat.html', import.meta.url), page({ p, titre: 'v2 · Identité · chiffre contre chiffre', css, corps, js }));
console.log('v2/etat.html écrit');
