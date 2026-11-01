// v1 (froide) — les repères du style ouverts en pistes, sous le style, la recette posée dessus.
// node work/missions/2026-10-31-ecran-identite/v0/v1/fabrique.mjs → etat.html
import fs from 'node:fs';
import { page, tete, pied, duStyle, boutonLegende, legende, C, STYLES, ebc, sg, ICO } from './commun.mjs';

const p = 'v1';
const S = STYLES['22A'];
// Piste « au style » : la bande du style occupe 25 % → 75 % de la piste ; la valeur se place à sa vraie position sur cette échelle.
const pos = (v, [a, b]) => Math.max(2, Math.min(98, 25 + ((v - a) / (b - a)) * 50));
const ROWS = [
  { k: 'OG', band: S.og, v: 1.080, txt: '1,080', bornes: `${sg(S.og[0])}–${sg(S.og[1])}` },
  { k: 'FG', band: S.fg, v: null, txt: '—', bornes: `${sg(S.fg[0])}–${sg(S.fg[1])}`, pourquoi: 'FG à la levure, étape 4' },
  { k: 'Alc.', band: S.abv, v: null, txt: '—', bornes: '7,5–10 %', pourquoi: 'Alcool à la levure, étape 4' },
  { k: 'IBU', band: S.ibu, v: 93, txt: '~93', bornes: '60–100' },
  { k: 'EBC', band: [ebc(S.srm[0]), ebc(S.srm[1])], v: 9.5, txt: '9,5', bornes: `${ebc(S.srm[0])}–${ebc(S.srm[1])}`, hors: 'pâle' },
];

function pistes(rows, neuve = false) {
  return rows.map((r) => {
    const v = neuve ? null : r.v;
    const tick = v == null ? '' : `<b class="${p}-tk${r.hors ? ` ${p}-tk-h` : ''}" style="left:${pos(v, r.band).toFixed(1)}%"></b>`;
    const val = neuve ? '—' : r.txt;
    return `<button type="button" class="${p}-pr" data-booster="piste-${r.k.replace('.', '')}" aria-expanded="false">
      <span class="${p}-pk">${r.k}</span>
      <span class="${p}-tr${v == null ? ` ${p}-tr-i` : ''}"><i></i>${tick}</span>
      <span class="${p}-pv ${p}-mono${r.hors && !neuve ? ` ${p}-pv-h` : ''}">${val}${r.hors && !neuve ? ` <em>${r.hors}</em>` : ''}</span>
      <span class="${p}-pb ${p}-mono">${r.bornes}</span>
    </button>
    <div class="${p}-pd" hidden>${r.pourquoi ?? (r.k === 'EBC' ? 'EBC converti des SRM 6–14' : r.k === 'IBU' ? '~ simulé à l’étape Houblons' : 'BJCP 2021 · 22A')}</div>`;
  }).join('');
}

const ferm = (vol, cap, alerte = false) => `
  <div class="${p}-fm${alerte ? ` ${p}-fm-a` : ''}" data-booster="fermenteur">
    <span class="${p}-fl">Fermenteur</span>
    <span class="${p}-fg" role="img" aria-label="${vol} litres sur ${cap}"><i style="width:${Math.min(100, (vol / cap) * 100)}%"></i><b style="left:80%"></b></span>
    <span class="${p}-fv ${p}-mono">${vol}/${cap} L</span>
    <span class="${p}-fs">${alerte ? 'plein' : `${cap - vol} L libres`}</span>
  </div>`;

const corps = `${tete(p)}
<main class="${p}-m">
  <div class="${p}-e1">
  <section class="${p}-pn" aria-label="Identité">
    <label class="${p}-lb" for="${p}-nom">Nom</label>
    <input id="${p}-nom" class="${p}-in" value="neipa v3" autocomplete="off">
    <label class="${p}-lb" for="${p}-sty">Style</label>
    <button type="button" id="${p}-sty" class="${p}-in ${p}-cb" data-booster="style"><span>Double IPA</span><small>22A</small>${ICO.chevron}</button>
    <div class="${p}-ps" data-booster="pistes-style" aria-label="Ta recette dans le style">${pistes(ROWS)}</div>
    <div class="${p}-dsr">${duStyle(p)}${boutonLegende(p)}</div>${legende(p)}
  </section>
  <section class="${p}-pn ${p}-br" aria-label="Brassin">
    <div class="${p}-vb">
      <label class="${p}-il">Volume <input class="${p}-nu ${p}-mono" inputmode="decimal" value="24" aria-label="Volume en fermenteur"> L</label>
      <label class="${p}-il">Ébullition <input class="${p}-nu ${p}-mono" inputmode="numeric" value="60" aria-label="Durée d’ébullition"> min</label>
    </div>
    <p class="${p}-ev"><span class="${p}-mono">~3 L</span> évaporés</p>
    <button type="button" class="${p}-sw" role="switch" aria-checked="false" data-booster="nolo"><span>NOLO <span class="${p}-mono">≤ 0,5 %</span></span><i></i></button>
    ${ferm(24, 30)}
    <button type="button" class="${p}-dp" aria-expanded="false" data-booster="espace-libre"><span>Espace libre <span class="${p}-mono">~20 %</span> · cuve 45 L</span>${ICO.chevron}</button>
    <div class="${p}-dd" hidden><label class="${p}-il">Espace libre <input class="${p}-nu ${p}-mono" inputmode="decimal" value="20"> %</label><span class="${p}-fs">remplissage conseillé <span class="${p}-mono">24 L</span></span></div>
  </section>
  ${pied(p)}
  </div>
  <section class="${p}-et" aria-label="Autres états">
    <h2>Recette neuve</h2>
    <div class="${p}-pn"><div class="${p}-ps">${pistes(ROWS, true)}</div>${ferm(30, 30, true)}<p class="${p}-al" role="alert">30 L remplit le fermenteur : baisse le volume.</p></div>
    <h2>NOLO coché</h2>
    <div class="${p}-pn"><button type="button" class="${p}-sw" role="switch" aria-checked="true"><span>NOLO <span class="${p}-mono">≤ 0,5 %</span></span><i></i></button>
    <p class="${p}-ev">Les plages restent celles de la Double IPA ; l’alcool visé est celui du NOLO.</p></div>
  </section>
</main>`;

const css = `
  .${p}-dsr{display:flex;align-items:center;justify-content:space-between}
  .${p}-m{padding:8px 8px 0} .${p}-e1{min-height:728px;display:flex;flex-direction:column}
  .${p}-pn{background:${C.panneau};border-radius:16px;padding:8px;display:flex;flex-direction:column;gap:4px}
  .${p}-br{margin-top:8px;gap:6px}
  .${p}-lb{font-size:12px;color:${C.t2};margin-top:2px}
  .${p}-in{height:34px;border:1px solid ${C.bord};border-radius:10px;background:${C.page};padding:0 10px;font:inherit;font-size:16px;color:${C.t0};width:100%}
  .${p} .${p}-cb{display:flex;align-items:center;gap:8px;text-align:left;border:1px solid ${C.bord};background:${C.page}}
  .${p}-cb span{flex:1} .${p}-cb small{font-size:12px;color:${C.t2}} .${p}-cb svg{color:${C.t2}}
  .${p}-ps{display:flex;flex-direction:column;margin-top:4px;padding:2px 8px;border-radius:12px;background:linear-gradient(180deg,#FAEDC8,#F5E2AE)}
  .${p}-ps .${p}-tr{background:rgba(255,255,255,.75)} .${p}-ps .${p}-pk,.${p}-ps .${p}-pb,.${p}-ps .${p}-pd,.${p}-ps .${p}-pv{color:#4A3B12} .${p}-ps .${p}-pv-h em{color:#6E4E0C} .${p}-ps .${p}-tr i{background:#B99A4F} .${p}-ps .${p}-tr-i{background:rgba(255,255,255,.4);border:1px dashed #8A7440} .${p}-ps .${p}-tr-i i{background:repeating-linear-gradient(135deg,#D9C48A 0 3px,transparent 3px 6px)}
  .${p} .${p}-pr{display:grid;grid-template-columns:34px 1fr auto;grid-template-areas:"k v b" "t t t";align-items:baseline;column-gap:8px;row-gap:6px;padding:6px 0 8px;text-align:left;width:100%}
  .${p}-pk{grid-area:k} .${p}-pv{grid-area:v} .${p}-pb{grid-area:b} .${p}-tr{grid-area:t}
  .${p}-pk{font-size:13px;color:${C.t2}}
  .${p}-tr{position:relative;height:14px;border-radius:9px;background:${C.surface}}
  .${p}-tr i{position:absolute;left:25%;width:50%;top:0;bottom:0;border-radius:9px;background:${C.bordM}}
  .${p}-tr-i{background:transparent;border:1px dashed ${C.trait}} .${p}-tr-i i{background:repeating-linear-gradient(135deg,${C.bord} 0 3px,transparent 3px 6px)}
  .${p}-tk{position:absolute;top:-5px;bottom:-5px;width:4px;margin-left:-2px;border-radius:2px;background:${C.t0}}
  .${p}-tk-h{background:${C.att}}
  .${p}-pv{font-size:16px;font-weight:600;text-align:left;white-space:nowrap}
  .${p}-pv em{font-style:normal;font-family:'Source Sans 3',sans-serif;font-size:12px;font-weight:600;color:${C.attT}}
  .${p}-pb{font-size:12px;color:${C.t2};text-align:right;white-space:nowrap}
  .${p}-pd{font-size:12px;color:${C.t2};padding:0 0 6px 42px}
  .${p}-vb{display:flex;gap:12px}
  .${p}-il{display:flex;align-items:center;gap:6px;font-size:13px;color:${C.t2}}
  .${p}-nu{width:56px;height:36px;border:1px solid ${C.bord};border-radius:10px;background:${C.page};text-align:center;font-size:16px;font-weight:600;color:${C.t0}}
  .${p}-ev{margin:0;font-size:12px;color:${C.eauT}}
  .${p} .${p}-sw{display:flex;align-items:center;justify-content:space-between;min-height:36px;padding:0 2px;width:100%;font-size:14px;font-weight:600;border-top:1px solid ${C.bord}}
  .${p}-sw i{width:36px;height:20px;border-radius:12px;background:${C.bordM};position:relative;transition:background .15s}
  .${p}-sw i::after{content:'';position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .15s}
  .${p}-sw[aria-checked=true] i{background:${C.t0}} .${p}-sw[aria-checked=true] i::after{transform:translateX(16px)}
  .${p}-fm{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:8px;min-height:34px;border-top:1px solid ${C.bord};padding-top:4px}
  .${p}-fl{font-size:14px;font-weight:600}
  .${p}-fg{position:relative;height:14px;border-radius:9px;background:${C.surface};border:1px solid ${C.bord}}
  .${p}-fg i{position:absolute;left:0;top:0;bottom:0;border-radius:9px;background:${C.hopT}}
  .${p}-fg b{position:absolute;top:-4px;bottom:-4px;width:0;border-left:2px dashed ${C.t0}}
  .${p}-fm-a .${p}-fg i{background:${C.alerte}} .${p}-fm-a .${p}-fs{color:${C.alerteT};font-weight:600}
  .${p}-fv{font-size:14px;font-weight:600} .${p}-fs{font-size:12px;color:${C.t2}}
  .${p} .${p}-dp{display:flex;align-items:center;justify-content:space-between;min-height:32px;width:100%;font-size:13px;color:${C.t1};text-align:left}
  .${p}-dp svg{color:${C.t2};transition:transform .15s} .${p}-dp[aria-expanded=true] svg{transform:rotate(180deg)}
  .${p}-dd{display:flex;align-items:center;justify-content:space-between}
  .${p}-al{margin:4px 0 0;font-size:13px;color:${C.alerteT}}
  .${p}-et{margin-top:24px;border-top:1px dashed ${C.bordM};padding-top:8px;display:flex;flex-direction:column;gap:6px}
  .${p}-et h2{margin:4px 0 0;font-size:13px;color:${C.t2};font-weight:600}
  .${p}-pr:active{background:${C.surface};border-radius:6px}`;

const js = `
  document.querySelectorAll('.${p}-pr').forEach(function(b){b.addEventListener('click',function(){var d=b.nextElementSibling;d.hidden=!d.hidden;b.setAttribute('aria-expanded',String(!d.hidden));});});
  document.querySelectorAll('.${p}-sw').forEach(function(s){s.addEventListener('click',function(){s.setAttribute('aria-checked',s.getAttribute('aria-checked')==='true'?'false':'true');});});
  document.querySelectorAll('.${p}-dp').forEach(function(b){b.addEventListener('click',function(){var d=b.nextElementSibling;if(d&&d.classList.contains('${p}-dd')){d.hidden=!d.hidden;}b.setAttribute('aria-expanded',b.getAttribute('aria-expanded')==='true'?'false':'true');});});`;

fs.writeFileSync(new URL('./etat.html', import.meta.url), page({ p, titre: 'v1 · Identité · repères en pistes', css, corps, js }));
console.log('v1/etat.html écrit');
