// v4 (tiède) — le style se choisit sur ses chiffres : chaque style candidat montre ses bandes OG, IBU, EBC sur une échelle
// commune ; la recette est un fil vertical qui traverse la liste. On voit quels styles l'attrapent.
// node work/missions/2026-10-31-ecran-identite/v0/v4/fabrique.mjs → etat.html
import fs from 'node:fs';
import { page, tete, pied, duStyle, boutonLegende, legende, C, STYLES, ebc, ICO } from '../v1/commun.mjs';

const p = 'v4';
const COL = [
  { k: 'OG', dom: [1.040, 1.110], v: 1.080, band: (s) => s.og },
  { k: 'IBU', dom: [0, 120], v: 93, band: (s) => s.ibu },
  { k: 'EBC', dom: [0, 40], v: 9.5, band: (s) => [ebc(s.srm[0]), ebc(s.srm[1])] },
];
const pc = (c, x) => Math.max(0, Math.min(100, ((x - c.dom[0]) / (c.dom[1] - c.dom[0])) * 100));
const LISTE = ['22A', '21C', '22B', '22C', '21A', '12C'];
const CW = (358 - 4 - 132 - 24) / 3; // largeur d'une colonne de bandes, en px

function liste(neuve = false, choisi = '22A') {
  const fils = neuve ? '' : COL.map((c, i) => `<b class="${p}-fil" style="left:${(4 + 132 + 8 + i * (CW + 8) + (CW * pc(c, c.v)) / 100 - 1).toFixed(1)}px" aria-hidden="true"></b>`).join('');
  const rows = LISTE.map((code) => {
    const s = STYLES[code];
    const cells = COL.map((c) => {
      const [a, b] = c.band(s), dans = !neuve && c.v >= a && c.v <= b;
      return `<span class="${p}-ce"><i class="${p}-ba${dans ? ` ${p}-ba-in` : neuve ? '' : ` ${p}-ba-out`}" style="left:${pc(c, a).toFixed(1)}%;width:${(pc(c, b) - pc(c, a)).toFixed(1)}%"></i></span>`;
    }).join('');
    return `<button type="button" role="radio" aria-checked="${code === choisi}" class="${p}-rw" data-booster="style-${code}">
      <span class="${p}-nm"><b>${s.nom}</b><small class="${p}-mono">${code}</small></span>${cells}</button>`;
  }).join('');
  return `<div class="${p}-ls" role="radiogroup" aria-label="Style" data-booster="styles-sur-chiffres">
    <div class="${p}-hdr"><span class="${p}-hl">${neuve ? '' : boutonLegende(p)}</span>${COL.map((c) => `<span>${c.k}</span>`).join('')}</div>
    <div class="${p}-corps">${fils}${rows}</div></div>${neuve ? '' : legende(p, ['Barre : la plage de chaque style, BJCP 2021. Verte, elle attrape ta recette.', 'Fil doré : ta recette (OG, IBU, EBC).', 'Contour seul : ta recette sort de cette plage.', '~ : estimé ou simulé, jamais mesuré.'])}`;
}

const corps = `${tete(p)}
<main class="${p}-m">
  <div class="${p}-e1">
  <div class="${p}-top">
    <label class="${p}-nmf"><span>Nom</span><input value="neipa v3"></label>
    <label class="${p}-rch"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input placeholder="Chercher un style" aria-label="Chercher un style"></label>
  </div>
  <section class="${p}-pn" aria-label="Style, sur tes chiffres">${liste()}
    <div class="${p}-pl2"><button type="button" class="${p}-plus">Autres styles ${ICO.chevron}</button>${duStyle(p)}</div>
  </section>
  <section class="${p}-br" aria-label="Le brassin">
    <div class="${p}-ch">
      <button type="button" class="${p}-pu" data-booster="volume"><span>Volume</span><b class="${p}-mono">24 L</b></button>
      <button type="button" class="${p}-pu" data-booster="ebullition"><span>Ébullition</span><b class="${p}-mono">60 min</b></button>
      <button type="button" class="${p}-pu ${p}-nolo" role="switch" aria-checked="false" data-booster="nolo"><span>NOLO</span><b class="${p}-mono">≤ 0,5 %</b><i></i></button>
    </div>
    <p class="${p}-ev"><span class="${p}-mono">~3 L</span> évaporés</p>
    <button type="button" class="${p}-fm" data-booster="fermenteur"><span class="${p}-fl">Fermenteur</span>
      <span class="${p}-fj" role="img" aria-label="24 litres sur 30">${Array.from({ length: 30 }, (_, i) => `<i class="${i < 24 ? `${p}-ok` : ''}${i === 23 ? ` ${p}-cs` : ''}"></i>`).join('')}</span>
      <span class="${p}-mono ${p}-fv">24/30 L</span></button>
  </section>
  ${pied(p)}
  </div>
  <section class="${p}-et" aria-label="Autres états">
    <h2>Recette neuve : pas de fil, les styles récents</h2>
    <button type="button" class="${p}-imp">${ICO.coller} Coller une recette, ou choisir un style</button>
    <section class="${p}-pn">${liste(true, '')}</section>
  </section>
</main>`;

const css = `
  .${p}-m{padding:8px 8px 0} .${p}-e1{min-height:728px;display:flex;flex-direction:column}
  .${p}-top{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px}
  .${p}-nmf{display:flex;align-items:center;gap:6px;height:32px;border:1px solid ${C.bord};border-radius:10px;padding:0 8px;background:${C.page}}
  .${p}-nmf span{font-size:12px;color:${C.t2}} .${p}-nmf input{border:0;font:inherit;font-size:16px;width:100%;min-width:0;background:transparent;color:${C.t0}}
  .${p}-rch{display:flex;align-items:center;gap:6px;height:32px;border:1px solid ${C.bord};border-radius:10px;padding:0 8px;background:${C.panneau};color:${C.t2}}
  .${p}-rch input{border:0;background:transparent;font:inherit;font-size:16px;width:100%;min-width:0}
  .${p}-rch input::placeholder{color:${C.t2}}
  .${p}-pn{background:${C.panneau};border-radius:16px;padding:8px;display:flex;flex-direction:column;gap:4px}
  .${p}-hdr,.${p} .${p}-rw{display:grid;grid-template-columns:132px 1fr 1fr 1fr;align-items:center;column-gap:8px;width:100%}
  .${p}-hdr{font-size:12px;color:${C.t2};text-align:center;height:24px} .${p}-hl{text-align:left;padding-left:4px}
  .${p}-corps{position:relative;display:flex;flex-direction:column}
  .${p}-fil{position:absolute;top:-4px;bottom:-4px;width:3px;background:${C.or};box-shadow:0 0 0 1px rgba(17,17,17,.55);z-index:1;pointer-events:none}
  .${p} .${p}-rw{min-height:58px;text-align:left;border-radius:10px;padding:0 0 0 4px}
  .${p}-rw[aria-checked=true]{background:${C.t0};color:#fff} .${p}-rw[aria-checked=true] .${p}-nm small{color:#CFCFCF} .${p}-rw[aria-checked=true] .${p}-ce{background:#3A3A3A} .${p}-rw[aria-checked=true] .${p}-ba-out{border-color:#BFBFBF}
  .${p}-rd{width:18px;height:18px;border-radius:50%;border:2px solid ${C.trait};justify-self:center}
  .${p}-rw[aria-checked=true] .${p}-rd{border:6px solid ${C.t0}}
  .${p}-nm{display:flex;flex-direction:column;line-height:1.15;min-width:0}
  .${p}-nm b{font-size:14px;font-weight:600} .${p}-nm small{font-size:12px;color:${C.t2}}
  .${p}-rw[aria-checked=false] .${p}-nm b{font-weight:400;color:${C.t1}}
  .${p}-ce{position:relative;height:18px;border-radius:9px;background:${C.surface}}
  .${p}-ba{position:absolute;top:0;bottom:0;border-radius:9px;background:${C.trait}}
  .${p}-ba-in{background:${C.hopT}}
  .${p}-ba-out{background:transparent;border:1.5px solid ${C.trait}}
  .${p} .${p}-plus{display:flex;align-items:center;gap:4px;min-height:28px;font-size:13px;color:${C.t1};padding-left:4px}
  .${p}-plus svg{color:${C.t2}}
  .${p}-br{margin-top:8px;background:${C.panneau};border-radius:16px;padding:8px;display:flex;flex-direction:column;gap:6px}
  .${p}-ch{display:flex;gap:6px}
  .${p} .${p}-pu{flex:1;display:flex;flex-direction:column;align-items:flex-start;gap:0;padding:6px 10px;min-height:56px;border-radius:10px;border:1px solid ${C.bord};background:${C.page};position:relative}
  .${p}-pu span{font-size:12px;color:${C.t2}} .${p}-pu b{font-size:18px;font-weight:600}
  .${p}-nolo b{font-size:15px}
  .${p}-nolo i{position:absolute;right:8px;top:8px;width:28px;height:16px;border-radius:9px;background:${C.bordM}}
  .${p}-nolo i::after{content:'';position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;transition:transform .15s}
  .${p}-nolo[aria-checked=true] i{background:${C.t0}} .${p}-nolo[aria-checked=true] i::after{transform:translateX(12px)}
  .${p}-ev{margin:0;font-size:12px;color:${C.eauT}}
  .${p} .${p}-fm{display:flex;align-items:center;gap:8px;min-height:40px;width:100%;border-top:1px solid ${C.bord};padding-top:4px}
  .${p}-fl{font-size:14px;font-weight:600}
  .${p}-fj{flex:1;display:flex;gap:2px;height:18px}
  .${p}-pl2{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:8px;padding-top:6px;border-top:1px solid ${C.bord}}
  .${p}-fj i{flex:1;border-radius:2px;background:${C.surface};border:1px solid ${C.bord}}
  .${p}-fj i.${p}-ok{background:${C.hopT};border-color:${C.hopT}}
  .${p}-fj i.${p}-cs{box-shadow:3px 0 0 -1px ${C.t0}}
  .${p}-fv{font-size:15px;font-weight:600}
  .${p} .${p}-imp{display:flex;align-items:center;gap:8px;height:40px;padding:0 12px;border:1px solid ${C.bordM};border-radius:10px;font-size:15px;font-weight:600}
  .${p}-et{margin-top:24px;border-top:1px dashed ${C.bordM};padding-top:8px;display:flex;flex-direction:column;gap:6px}
  .${p}-et h2{margin:4px 0 0;font-size:13px;color:${C.t2};font-weight:600}
  .${p}-rw:active,.${p}-pu:active{background:${C.surface}}`;

const js = `
  document.querySelectorAll('.${p}-e1 .${p}-rw').forEach(function(r,_,all){r.addEventListener('click',function(){all.forEach(function(o){o.setAttribute('aria-checked',String(o===r));});});});
  var n=document.querySelector('.${p}-nolo');n.addEventListener('click',function(){n.setAttribute('aria-checked',n.getAttribute('aria-checked')==='true'?'false':'true');});`;

fs.writeFileSync(new URL('./etat.html', import.meta.url), page({ p, titre: 'v4 · Identité · le style sur tes chiffres', css, corps, js }));
console.log('v4/etat.html écrit');
