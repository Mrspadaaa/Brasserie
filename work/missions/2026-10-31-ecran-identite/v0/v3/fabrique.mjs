// v3 (tiède) — le profil au style : cinq axes côte à côte (OG, FG, alcool, IBU, EBC), la bande du style sur chacun,
// la recette en une ligne qui les traverse ; tiretée là où elle enjambe un inconnu (D147). Au style | Absolu, comme Houblons.
// node work/missions/2026-10-31-ecran-identite/v0/v3/fabrique.mjs → etat.html
import fs from 'node:fs';
import { page, tete, pied, duStyle, boutonLegende, legende, C, STYLES, ebc, sg, ICO } from '../v1/commun.mjs';

const p = 'v3';
const S = STYLES['22A'];
const AX = [
  { k: 'OG', band: S.og, abs: [1.030, 1.110], v: 1.080, txt: '1,080', f: sg },
  { k: 'FG', band: S.fg, abs: [1.000, 1.030], v: null, f: sg },
  { k: 'Alc. %', band: S.abv, abs: [3, 12], v: null, f: (x) => String(x).replace('.', ',') },
  { k: 'IBU', band: S.ibu, abs: [0, 120], v: 93, txt: '~93', f: String },
  { k: 'EBC', band: [ebc(S.srm[0]), ebc(S.srm[1])], abs: [0, 60], v: 9.5, txt: '9,5', f: String, hors: 'pâle' },
];
const W = 374, H = 372, TOP = 26, BOT = 326; // axe de TOP (haut) à BOT (bas)
const xs = AX.map((_, i) => 34 + i * ((W - 68) / (AX.length - 1)));

function graphe(mode, neuve = false) {
  // Au style : la bande occupe 30 % → 70 % de l'axe ; Absolu : bornes communes du catalogue.
  const y = (a, v) => {
    const t = mode === 'style' ? 0.3 + ((v - a.band[0]) / (a.band[1] - a.band[0])) * 0.4 : (v - a.abs[0]) / (a.abs[1] - a.abs[0]);
    return BOT - Math.max(0, Math.min(1, t)) * (BOT - TOP);
  };
  let s = '';
  AX.forEach((a, i) => {
    const x = xs[i], y1 = y(a, a.band[1]), y0 = y(a, a.band[0]), inc = a.v == null || neuve;
    s += `<line x1="${x}" y1="${TOP}" x2="${x}" y2="${BOT}" stroke="#3D342E" stroke-width="2"/>`;
    s += `<rect x="${x - 11}" y="${y1}" width="22" height="${y0 - y1}" rx="8" fill="${inc ? `url(#${p}-hach-${mode}${neuve ? "-n" : ""})` : '#6B5D53'}" ${inc ? 'stroke="#9A8A7E" stroke-dasharray="3 3"' : ''}/>`;
    s += `<text x="${x}" y="${y1 - 5}" class="${p}-bn" text-anchor="middle">${a.f(a.band[1])}</text>`;
    const sous = a.hors && !neuve && a.v < a.band[0];
    s += sous ? `<text x="${x + 14}" y="${y0 + 4}" class="${p}-bn" text-anchor="start">${a.f(a.band[0])}</text>` : `<text x="${x}" y="${y0 + 14}" class="${p}-bn" text-anchor="middle">${a.f(a.band[0])}</text>`;
    s += `<text x="${x}" y="${H - 22}" class="${p}-ak" text-anchor="middle">${a.k}</text>`;
    s += inc ? `<text x="${x}" y="${H - 6}" class="${p}-av ${p}-av-i" text-anchor="middle">—</text>`
      : `<text x="${x}" y="${H - 6}" class="${p}-av${a.hors ? ` ${p}-av-h` : ''}" text-anchor="middle">${a.txt}</text>`;
  });
  if (!neuve) {
    const pts = AX.map((a, i) => (a.v == null ? null : [xs[i], y(a, a.v), a]));
    const connus = pts.filter(Boolean);
    for (let i = 0; i < connus.length - 1; i++) {
      const [xa, ya] = connus[i], [xb, yb] = connus[i + 1];
      const saute = pts.indexOf(connus[i + 1]) - pts.indexOf(connus[i]) > 1;
      s += `<line x1="${xa}" y1="${ya}" x2="${xb}" y2="${yb}" stroke="#F5F0EA" stroke-width="${saute ? 2 : 3}" ${saute ? 'stroke-dasharray="5 5"' : ''} stroke-linecap="round"/>`;
    }
    connus.forEach(([x, yy, a]) => {
      s += `<circle cx="${x}" cy="${yy}" r="7" fill="${a.hors ? '#E3B55D' : '#F5F0EA'}" stroke="#1A1613" stroke-width="2"/>`;
      if (a.hors) s += `<text x="${x - 12}" y="${yy + 4}" class="${p}-hx" text-anchor="end">${a.hors}</text>`;
    });
  }
  return `<svg class="${p}-sv" viewBox="0 0 ${W} ${H}" width="${W - 16}" role="img" aria-label="Profil de la recette dans le style 22A, ${mode === 'style' ? 'au style' : 'en absolu'}" data-mode="${mode}"${mode === 'abs' ? ' hidden' : ''}>
    <defs><pattern id="${p}-hach-${mode}${neuve ? "-n" : ""}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#221D19"/><line x1="0" y1="0" x2="0" y2="6" stroke="#3D342E" stroke-width="3"/></pattern></defs>${s}</svg>`;
}

const pas = (lab, val, unite, booster) => `<div class="${p}-st" data-booster="${booster}"><span class="${p}-sl">${lab}</span>
  <button type="button" class="${p}-sb" aria-label="Moins">−</button><input class="${p}-sv2 ${p}-mono" inputmode="decimal" value="${val}" aria-label="${lab}"><span class="${p}-su">${unite}</span><button type="button" class="${p}-sb" aria-label="Plus">+</button></div>`;

const corps = `${tete(p)}
<main class="${p}-m">
  <div class="${p}-e1">
  <section class="${p}-id" aria-label="La bière">
    <button type="button" class="${p}-nm" data-booster="nom">neipa v3 <span class="${p}-cr">${ICO.crayon}</span></button>
    <button type="button" class="${p}-sy" data-booster="style">Double IPA <span class="${p}-mono">22A</span> ${ICO.chevron}</button>
  </section>
  <section class="${p}-gr" aria-label="Ta recette dans le style">
    <div class="${p}-tl"><div class="${p}-sg" role="group" data-booster="echelle"><button type="button" aria-pressed="true" data-m="style">Au style</button><button type="button" aria-pressed="false" data-m="abs">Absolu</button></div>${boutonLegende(p)}</div>${legende(p)}
    ${graphe('style')}${graphe('abs')}
    <div class="${p}-dsw">${duStyle(p)}</div>
  </section>
  <section class="${p}-br" aria-label="Le brassin">
    <div class="${p}-rw">${pas('Volume', 24, 'L', 'volume')}${pas('Ébullition', 60, 'min', 'ebullition')}</div>
    <div class="${p}-rw ${p}-rw2">
      <span class="${p}-ev"><span class="${p}-mono">~3 L</span> évaporés</span>
      <button type="button" class="${p}-sw" role="switch" aria-checked="false" data-booster="nolo">NOLO <span class="${p}-mono">≤ 0,5 %</span><i></i></button>
    </div>
    <button type="button" class="${p}-fm" data-booster="fermenteur" aria-expanded="false">
      <span class="${p}-fl">Fermenteur</span><span class="${p}-fj"><i style="width:80%"></i><b></b></span><span class="${p}-mono ${p}-fv">24/30 L</span>${ICO.chevron}
    </button>
    <div class="${p}-fd" hidden><span>Espace libre · conseil <span class="${p}-mono">~20 %</span></span><span>Royal Catering · cuve 45 L</span></div>
  </section>
  ${pied(p)}
  </div>
  <section class="${p}-et" aria-label="Autres états">
    <h2>Recette neuve : les bandes du style, sans ligne</h2>
    <div class="${p}-gr">${graphe('style', true)}</div>
  </section>
</main>`;

const css = `
  .${p}-m{padding:8px 8px 0} .${p}-e1{min-height:728px;display:flex;flex-direction:column}
  .${p}-id{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:2px 2px 6px}
  .${p} .${p}-nm{font-size:20px;font-weight:700;display:flex;align-items:center;gap:6px;min-height:32px}
  .${p}-cr{color:${C.t2};display:flex}
  .${p} .${p}-sy{display:flex;align-items:center;gap:6px;height:32px;padding:0 10px;border-radius:999px;border:1px solid ${C.bordM};font-size:15px;font-weight:600}
  .${p}-sy .${p}-mono{font-size:13px;color:${C.t2};font-weight:400}
  .${p}-gr{position:relative;background:#1A1613;border-radius:16px;padding:8px;display:flex;flex-direction:column;align-items:center}
  .${p}-tl{align-self:stretch;display:flex;align-items:center;justify-content:space-between}
  .${p} .${p}-tl .${p}-lgb{color:#D8CEC5;border-color:#574A42}
  .${p}-gr .${p}-lg{align-self:stretch;margin-top:6px}
  .${p}-gr svg{color:#F5F0EA}
  .${p}-sg{display:flex;border:1px solid #3D342E;border-radius:10px;padding:2px;background:#221D19}
  .${p} .${p}-sg button{height:26px;padding:0 10px;border-radius:8px;font-size:13px;color:#D8CEC5}
  .${p} .${p}-sg [aria-pressed=true]{background:#F5F0EA;color:#12100E;font-weight:600}
  .${p}-sv{display:block;margin-top:2px}
  .${p}-bn{font:400 12px 'IBM Plex Mono',monospace;fill:#9A8A7E}
  .${p}-ak{font:400 13px 'Source Sans 3',sans-serif;fill:#9A8A7E}
  .${p}-av{font:600 16px 'IBM Plex Mono',monospace;fill:#F5F0EA} .${p}-av-i{fill:#9A8A7E} .${p}-av-h{fill:#E3B55D}
  .${p}-hx{font:600 12px 'Source Sans 3',sans-serif;fill:#E3B55D}
  .${p}-br{margin-top:8px;background:${C.panneau};border-radius:16px;padding:8px;display:flex;flex-direction:column;gap:8px}
  .${p}-dsw{align-self:stretch;padding:2px 2px 0} .${p}-dsw .${p}-ds2{color:#9A8A7E} .${p} .${p}-dsw .${p}-ds2 button{color:#D8CEC5;border-color:#574A42}
  .${p}-rw{display:flex;gap:8px;justify-content:space-between}
  .${p}-rw2{align-items:center}
  .${p}-st{display:flex;align-items:center;gap:4px;flex:1;min-width:0}
  .${p}-sl{font-size:13px;color:${C.t2};margin-right:2px}
  .${p} .${p}-sb{width:32px;height:36px;border-radius:10px;border:1px solid ${C.bord};background:${C.page};font-size:18px;color:${C.t1}}
  .${p}-sv2{width:40px;height:32px;border:0;background:transparent;text-align:right;font-size:18px;font-weight:600;color:${C.t0};padding:0}
  .${p}-su{font-size:13px;color:${C.t2};min-width:22px}
  .${p}-ev{font-size:12px;color:${C.eauT}}
  .${p} .${p}-sw{display:flex;align-items:center;gap:8px;min-height:32px;font-size:14px;font-weight:600}
  .${p}-sw i{width:36px;height:20px;border-radius:12px;background:${C.bordM};position:relative}
  .${p}-sw i::after{content:'';position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .15s}
  .${p}-sw[aria-checked=true] i{background:${C.t0}} .${p}-sw[aria-checked=true] i::after{transform:translateX(16px)}
  .${p} .${p}-fm{display:flex;align-items:center;gap:8px;min-height:40px;width:100%;border-top:1px solid ${C.bord};padding-top:4px}
  .${p}-fl{font-size:14px;font-weight:600}
  .${p}-fj{flex:1;position:relative;height:12px;border-radius:9px;background:${C.surface};border:1px solid ${C.bord}}
  .${p}-fj i{position:absolute;left:0;top:0;bottom:0;border-radius:9px;background:${C.hopT}}
  .${p}-fj b{position:absolute;left:80%;top:-4px;bottom:-4px;border-left:2px dashed ${C.t0}}
  .${p}-fv{font-size:15px;font-weight:600} .${p}-fm svg{color:${C.t2}}
  .${p}-fd{display:flex;flex-direction:column;gap:4px;font-size:13px;color:${C.t1};padding:0 2px}
  .${p}-et{margin-top:24px;border-top:1px dashed ${C.bordM};padding-top:8px;display:flex;flex-direction:column;gap:6px}
  .${p}-et h2{margin:4px 0 0;font-size:13px;color:${C.t2};font-weight:600}
  .${p}-sb:active{background:${C.surface}}`;

const js = `
  var sg=document.querySelectorAll('.${p}-sg button');
  sg.forEach(function(b){b.addEventListener('click',function(){sg.forEach(function(o){o.setAttribute('aria-pressed',String(o===b));});
    document.querySelectorAll('.${p}-e1 .${p}-sv').forEach(function(s){s.toggleAttribute('hidden',s.getAttribute('data-mode')!==b.getAttribute('data-m'));});});});
  document.querySelectorAll('.${p}-sw').forEach(function(s){s.addEventListener('click',function(){s.setAttribute('aria-checked',s.getAttribute('aria-checked')==='true'?'false':'true');});});
  var fm=document.querySelector('.${p}-fm');fm.addEventListener('click',function(){var d=fm.nextElementSibling;d.hidden=!d.hidden;fm.setAttribute('aria-expanded',String(!d.hidden));});
  document.querySelectorAll('.${p}-st').forEach(function(st){var inp=st.querySelector('input');var b=st.querySelectorAll('.${p}-sb');var pas=inp.getAttribute('aria-label')==='Ébullition'?5:1;
    b[0].addEventListener('click',function(){inp.value=Math.max(0,(parseFloat(inp.value.replace(',','.'))||0)-pas);});
    b[1].addEventListener('click',function(){inp.value=(parseFloat(inp.value.replace(',','.'))||0)+pas;});});`;

fs.writeFileSync(new URL('./etat.html', import.meta.url), page({ p, titre: 'v3 · Identité · profil au style', css, corps, js }));
console.log('v3/etat.html écrit');
