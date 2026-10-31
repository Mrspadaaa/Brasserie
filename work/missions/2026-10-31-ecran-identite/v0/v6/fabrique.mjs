// v6 (chaude) — les instruments du brasseur : le densimètre (OG lue, FG à venir, l'alcool qui en découle), le cadran
// d'amertume et la pastille de couleur, chacun avec la plage du style dessinée dessus.
// node work/missions/2026-10-31-ecran-identite/v0/v6/fabrique.mjs → etat.html
import fs from 'node:fs';
import { page, tete, pied, duStyle, boutonLegende, legende, C, STYLES, ebc, ICO } from '../v1/commun.mjs';

const p = 'v6';
const S = STYLES['22A'];
const OG = 1.080;
// Alcool si la FG tombe dans la plage du style : (OG − FG) × 131,25 ; estimation d'affichage, marquée « ~ ».
const abv = (fg) => ((OG - fg) * 131.25).toLocaleString('fr-FR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

function densimetre(neuve = false) {
  const W = 358, X0 = 50, X1 = 330, Yt = 112; // tige du densimètre
  const X = (g) => X0 + ((g - 1.0) / 0.1) * (X1 - X0);
  let s = `<path d="M${X0 - 4} ${Yt - 13} H${X1 + 2} a13 13 0 0 1 0 26 H${X0 - 4} Z" fill="${C.page}" stroke="${C.t1}" stroke-width="1.5"/>`;
  s += `<ellipse cx="24" cy="${Yt}" rx="22" ry="18" fill="${C.page}" stroke="${C.t1}" stroke-width="1.5"/><ellipse cx="18" cy="${Yt}" rx="8" ry="7" fill="${C.surface}"/>`;
  for (let g = 1.0; g <= 1.1001; g += 0.005) {
    const maj = Math.round(g * 1000) % 10 === 0;
    s += `<line x1="${X(g)}" y1="${Yt + 13}" x2="${X(g)}" y2="${Yt + 13 - (maj ? 10 : 5)}" stroke="${C.t2}" stroke-width="1"/>`;
  }
  [1.0, 1.05, 1.1].forEach((g) => { s += `<text x="${X(g)}" y="${Yt + 30}" class="${p}-tk" text-anchor="middle">${g.toFixed(3).replace('.', ',')}</text>`; });
  // plages du style sur la tige
  s += `<rect x="${X(S.fg[0])}" y="${Yt - 11}" width="${X(S.fg[1]) - X(S.fg[0])}" height="22" rx="4" fill="url(#${p}-h${neuve ? 'n' : ''})" stroke="${C.trait}" stroke-dasharray="3 3"/>`;
  s += `<rect x="${X(S.og[0])}" y="${Yt - 11}" width="${X(S.og[1]) - X(S.og[0])}" height="22" rx="4" fill="${C.bordM}"/>`;
  s += `<text x="${(X(S.fg[0]) + X(S.fg[1])) / 2}" y="${Yt + 52}" class="${p}-fgl" text-anchor="middle">FG —</text>`;
  if (!neuve) {
    const xo = X(OG), xf = (X(S.fg[0]) + X(S.fg[1])) / 2;
    s += `<path d="M${xo} ${Yt - 13} C ${xo} ${Yt - 70}, ${xf} ${Yt - 70}, ${xf} ${Yt - 18}" fill="none" stroke="${C.t0}" stroke-width="1.5" stroke-dasharray="4 4" marker-end="url(#${p}-fl)"/>`;
    s += `<text x="${(xo + xf) / 2 + 12}" y="${Yt - 66}" class="${p}-ab" text-anchor="middle">alc. ~${abv(S.fg[1])}–${abv(S.fg[0])} %</text>`;
    s += `<line x1="${xo}" y1="${Yt - 16}" x2="${xo}" y2="${Yt + 16}" stroke="${C.t0}" stroke-width="4" stroke-linecap="round"/>`;
    s += `<text x="${xo}" y="${Yt + 54}" class="${p}-og" text-anchor="middle">OG 1,080</text>`;
  } else {
    s += `<text x="${X(1.075)}" y="${Yt + 50}" class="${p}-lb" text-anchor="middle">OG —</text>`;
  }
  return `<svg viewBox="0 0 ${W} 178" width="${W}" class="${p}-ds" role="img" aria-label="Densimètre : OG 1,080 dans la plage 1,065–1,085 ; FG à la levure ; alcool ~8,1 à 9,5 % si la FG tombe dans le style">
    <defs><pattern id="${p}-h${neuve ? 'n' : ''}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="${C.page}"/><line x1="0" y1="0" x2="0" y2="6" stroke="${C.bord}" stroke-width="3"/></pattern>
    <marker id="${p}-fl" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${C.t0}"/></marker></defs>${s}</svg>`;
}

function cadran(neuve = false) {
  const cx = 90, cy = 118, r = 74, max = 120;
  const pt = (v, rr = r) => { const a = Math.PI * (1 - v / max); return [cx + rr * Math.cos(a), cy - rr * Math.sin(a)]; };
  const arc = (a, b, rr = r) => { const [x0, y0] = pt(a, rr), [x1, y1] = pt(b, rr); return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${rr} ${rr} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
  let s = `<path d="${arc(0, max)}" fill="none" stroke="#3D342E" stroke-width="18" stroke-linecap="round"/>`;
  s += `<path d="${arc(S.ibu[0], S.ibu[1])}" fill="none" stroke="#9A8A7E" stroke-width="18"/>`;
  [0, 60, 100, 120].forEach((v) => { const [x, y] = pt(v, r - 24); s += `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" class="${p}-tk" text-anchor="middle">${v}</text>`; });
  if (!neuve) {
    const [nx, ny] = pt(93, r - 4);
    s += `<line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#F2C14E" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="6" fill="#F2C14E"/>`;
  }
  s += `<text x="${cx}" y="${cy + 30}" class="${p}-cv" text-anchor="middle">${neuve ? '—' : '~93'}</text><text x="${cx}" y="${cy + 48}" class="${p}-lb" text-anchor="middle">IBU</text>`;
  return `<svg viewBox="0 0 180 172" width="180" class="${p}-cd ${p}-nuit" role="img" aria-label="Amertume : ~93 IBU, style 60 à 100" data-booster="amertume">${s}</svg>`;
}

// La pastille de couleur : le disque = la couleur prévue ; l'anneau = les teintes du style (12–28 EBC).
const pastille = (neuve = false) => `<button type="button" class="${p}-ps" data-booster="couleur" aria-label="Couleur : 9,5 EBC, plus pâle que le style 12 à 28">
  <span class="${p}-an"><span class="${p}-dq"${neuve ? ' style="background:transparent;border:1.5px dashed #9E9E9E"' : ''}></span></span>
  <span class="${p}-pl"><b class="${p}-mono">${neuve ? '—' : '9,5'}</b> EBC${neuve ? '' : '<em>pâle</em>'}</span></button>`;

const corps = `${tete(p)}
<main class="${p}-m">
  <div class="${p}-e1">
  <section class="${p}-et1" aria-label="La bière">
    <div class="${p}-id">
      <button type="button" class="${p}-nm" data-booster="nom">neipa v3 <span class="${p}-cr">${ICO.crayon}</span></button>
      <button type="button" class="${p}-sy" data-booster="style">Double IPA <span class="${p}-mono">22A</span> ${ICO.chevron}</button>
    </div>
    ${pastille()}
  </section>
  <section class="${p}-pn ${p}-dn" aria-label="Densité et alcool" data-booster="densimetre"><span class="${p}-lgw">${boutonLegende(p)}</span>${densimetre()}${duStyle(p)}${legende(p, ['Densimètre : la plage OG du style en gris plein, la plage FG hachurée.', 'La FG vient de la levure, étape 4 ; l’alcool ~ suppose une FG dans la plage du style.', 'Cadran : la plage IBU du style ; aiguille, ta recette.', 'Anneau de la pastille : les teintes du style, 12–28 EBC.'])}</section>
  <section class="${p}-dx">
    <div class="${p}-pn ${p}-pc">${cadran()}</div>
    <div class="${p}-pn ${p}-bs" aria-label="Le brassin">
      <label class="${p}-ch" data-booster="volume"><span>Volume</span><span><input class="${p}-mono" inputmode="decimal" value="24"> L</span></label>
      <label class="${p}-ch" data-booster="ebullition"><span>Ébullition</span><span><input class="${p}-mono" inputmode="numeric" value="60"> min</span></label>
      <span class="${p}-ev"><span class="${p}-mono">~3 L</span> évaporés</span>
      <button type="button" class="${p}-sw" role="switch" aria-checked="false" data-booster="nolo">NOLO <span class="${p}-mono">≤ 0,5 %</span><i></i></button>
    </div>
  </section>
  <button type="button" class="${p}-fm" data-booster="fermenteur"><span class="${p}-fl">Fermenteur</span>
    <span class="${p}-fj"><i style="width:80%"></i><b></b></span><span class="${p}-mono ${p}-fv">24/30 L</span><span class="${p}-fs">6 L libres</span></button>
  <button type="button" class="${p}-dp"><span>Espace libre <span class="${p}-mono">~20 %</span> · cuve 45 L</span>${ICO.chevron}</button>
  ${pied(p)}
  </div>
  <section class="${p}-etx" aria-label="Autres états">
    <h2>Recette neuve : les instruments à vide, plages du style seules</h2>
    <section class="${p}-et1">${pastille(true)}</section>
    <section class="${p}-pn">${densimetre(true)}</section>
    <div class="${p}-pn ${p}-pc">${cadran(true)}</div>
  </section>
</main>`;

const css = `
  .${p}-m{padding:8px 8px 0} .${p}-e1{min-height:728px;display:flex;flex-direction:column;gap:8px}
  .${p}-et1{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 2px}
  .${p}-id{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0}
  .${p} .${p}-nm{font-size:22px;font-weight:700;display:flex;align-items:center;gap:6px;min-height:32px}
  .${p}-cr{color:${C.t2};display:flex}
  .${p} .${p}-sy{display:flex;align-items:center;gap:6px;min-height:28px;font-size:15px;color:${C.t1}}
  .${p}-sy .${p}-mono{font-size:13px;color:${C.t2}} .${p}-sy svg{color:${C.t2}}
  .${p} .${p}-ps{display:flex;align-items:center;gap:8px}
  .${p}-an{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    background:conic-gradient(from 200deg,#E0A02E 0deg 40deg,#C87A2C 40deg 110deg,#A0522D 110deg 180deg,#ffffff00 180deg 360deg);border:1px solid ${C.bord}}
  .${p}-dq{width:50px;height:50px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#F6D27A,#E9B13E 60%,#D99A28);border:2px solid #fff;box-shadow:0 0 0 1px ${C.bordM}}
  .${p}-pl{display:flex;flex-direction:column;font-size:12px;color:${C.t2};line-height:1.1}
  .${p}-pl b{font-size:20px;color:${C.t0}} .${p}-pl em{font-style:normal;font-weight:600;color:${C.attT}}
  .${p}-pn{background:${C.panneau};border-radius:16px;padding:8px}
  .${p}-ds{display:block} .${p}-dn{position:relative} .${p}-lgw{position:absolute;right:10px;top:8px} .${p}-dn .${p}-lg{margin-top:6px}
  .${p}-nuit{color:#F5F0EA}
  .${p}-tk{font:400 12px 'IBM Plex Mono',monospace;fill:${C.t2}}
  .${p}-fgl{font:600 16px 'IBM Plex Mono',monospace;fill:${C.t2}}
  .${p}-lb{font:600 12px 'Source Sans 3',sans-serif;fill:${C.t2}}
  .${p}-ab{font:600 15px 'IBM Plex Mono',monospace;fill:${C.t0}}
  .${p}-og{font:600 16px 'IBM Plex Mono',monospace;fill:${C.t0}}
  .${p}-cv{font:600 22px 'IBM Plex Mono',monospace;fill:${C.t0}}
  .${p}-dx{display:grid;grid-template-columns:196px 1fr;gap:8px}
  .${p}-pc{display:flex;align-items:center;justify-content:center;padding:4px;background:#1A1613}
  .${p}-nuit .${p}-tk{fill:#9A8A7E} .${p}-nuit .${p}-cv{fill:#F5F0EA} .${p}-nuit .${p}-lb{fill:#9A8A7E}
  .${p}-bs{display:flex;flex-direction:column;gap:6px}
  .${p}-ch{display:flex;align-items:center;justify-content:space-between;font-size:13px;color:${C.t2}}
  .${p}-ch input{width:50px;height:36px;border:1px solid ${C.bord};border-radius:10px;background:${C.page};text-align:center;font-size:16px;font-weight:600;color:${C.t0}}
  .${p}-ev{font-size:12px;color:${C.eauT}}
  .${p} .${p}-sw{display:flex;align-items:center;justify-content:space-between;gap:6px;min-height:32px;font-size:14px;font-weight:600;border-top:1px solid ${C.bord};padding-top:4px}
  .${p}-sw i{width:34px;height:20px;border-radius:12px;background:${C.bordM};position:relative;flex:none}
  .${p}-sw i::after{content:'';position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .15s}
  .${p}-sw[aria-checked=true] i{background:${C.t0}} .${p}-sw[aria-checked=true] i::after{transform:translateX(14px)}
  .${p} .${p}-fm{display:flex;align-items:center;gap:8px;min-height:56px;background:${C.panneau};border-radius:16px;padding:0 10px}
  .${p}-fl{font-size:14px;font-weight:600}
  .${p}-fj{flex:1;position:relative;height:22px;border-radius:9px;background:${C.surface};border:1px solid ${C.bord}}
  .${p}-fj i{position:absolute;left:0;top:0;bottom:0;border-radius:9px;background:${C.hopT}}
  .${p}-fj b{position:absolute;left:80%;top:-4px;bottom:-4px;border-left:2px dashed ${C.t0}}
  .${p}-fv{font-size:15px;font-weight:600} .${p}-fs{font-size:12px;color:${C.t2}}
  .${p} .${p}-dp{display:flex;align-items:center;justify-content:space-between;min-height:32px;font-size:13px;color:${C.t1};padding:0 10px;margin-top:-4px} .${p}-dp svg{color:${C.t2}}
  .${p}-etx{margin-top:24px;border-top:1px dashed ${C.bordM};padding-top:8px;display:flex;flex-direction:column;gap:6px}
  .${p}-etx h2{margin:4px 0 0;font-size:13px;color:${C.t2};font-weight:600}`;

const js = `
  var sw=document.querySelector('.${p}-sw');sw.addEventListener('click',function(){sw.setAttribute('aria-checked',sw.getAttribute('aria-checked')==='true'?'false':'true');});`;

fs.writeFileSync(new URL('./etat.html', import.meta.url), page({ p, titre: 'v6 · Identité · les instruments', css, corps, js }));
console.log('v6/etat.html écrit');
