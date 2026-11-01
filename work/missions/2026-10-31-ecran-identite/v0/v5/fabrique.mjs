// v5 (chaude) — la carte des styles : OG en abscisse, IBU en ordonnée, chaque style BJCP voisin en rectangle de ses
// vraies plages, la recette en point teinté de sa couleur EBC. Le nom est l'étiquette du point, le style le rectangle choisi.
// node work/missions/2026-10-31-ecran-identite/v0/v5/fabrique.mjs → etat.html
import fs from 'node:fs';
import { page, tete, pied, duStyle, boutonLegende, legende, C, STYLES, ebc, ICO } from '../v1/commun.mjs';

const p = 'v5';
const W = 374, H = 430, X0 = 34, X1 = 366, Y0 = 30, Y1 = 400; // zone de tracé
const OG = [1.040, 1.120], IBU = [0, 110];
const X = (og) => X0 + ((og - OG[0]) / (OG[1] - OG[0])) * (X1 - X0);
const Y = (ibu) => Y1 - ((ibu - IBU[0]) / (IBU[1] - IBU[0])) * (Y1 - Y0);
const R = { og: 1.080, ibu: 93 };
// Position de l'étiquette de chaque rectangle : coin choisi pour qu'aucune ne se chevauche.
const BOITES = [
  ['18B', 'bg'], ['12C', 'hg'], ['21A', 'hg'], ['21C', 'bg'], ['22B', 'bd'], ['22C', 'hd'], ['22A', 'hg'],
];

function carte(neuve = false) {
  let s = '';
  [1.040, 1.060, 1.080, 1.100, 1.120].forEach((v) => {
    s += `<line x1="${X(v)}" y1="${Y0}" x2="${X(v)}" y2="${Y1}" stroke="${C.surface}"/><text x="${X(v)}" y="${Y1 + 16}" class="${p}-ax" text-anchor="${v === 1.120 ? 'end' : v === 1.040 ? 'start' : 'middle'}">${v.toFixed(3).replace('.', ',')}</text>`;
  });
  [0, 25, 50, 75, 100].forEach((v) => {
    s += `<line x1="${X0}" y1="${Y(v)}" x2="${X1}" y2="${Y(v)}" stroke="${C.surface}"/><text x="${X0 - 4}" y="${Y(v) + 4}" class="${p}-ax" text-anchor="end">${v}</text>`;
  });
  s += `<text x="${X1}" y="${Y1 + 30}" class="${p}-at" text-anchor="end">OG</text><text x="${X0 - 4}" y="${Y0 - 2}" class="${p}-at" text-anchor="end" dy="-2"></text>`;
  BOITES.forEach(([code, coin]) => {
    const st = STYLES[code];
    const x = X(st.og[0]), w = X(Math.min(st.og[1], OG[1])) - x, y = Y(st.ibu[1]), h = Y(st.ibu[0]) - y;
    const choisi = code === '22A';
    const attrape = !neuve && R.og >= st.og[0] && R.og <= st.og[1] && R.ibu >= st.ibu[0] && R.ibu <= st.ibu[1];
    const cls = `${p}-bx${attrape ? ` ${p}-bx-a` : ''}${choisi ? ` ${p}-bx-c` : ''}`;
    const [lx, anchor] = coin.endsWith('g') ? [x + 5, 'start'] : [x + w - 5, 'end'];
    const ly = choisi ? y - 6 : coin.startsWith('h') ? y + 15 : y + h - 6;
    s += `<g class="${cls}" data-booster="style-${code}" role="radio" aria-checked="${choisi}" tabindex="0" aria-label="${st.nom}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`;
    s += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" class="${p}-bl"><tspan class="${p}-nmx">${st.nom} </tspan><tspan class="${p}-cd">${code}</tspan></text></g>`;
  });
  if (!neuve) {
    s += `<line x1="${X(R.og)}" y1="${Y(R.ibu)}" x2="${X(R.og)}" y2="${Y1}" stroke="${C.t0}" stroke-dasharray="2 4"/><line x1="${X0}" y1="${Y(R.ibu)}" x2="${X(R.og)}" y2="${Y(R.ibu)}" stroke="${C.t0}" stroke-dasharray="2 4"/>`;
    s += `<g data-booster="nom" role="button" tabindex="0" aria-label="Nom : neipa v3"><circle cx="${X(R.og)}" cy="${Y(R.ibu)}" r="10" fill="${C.or}" stroke="${C.t0}" stroke-width="2.5"/>`;
    s += `<rect x="${X(R.og) + 14}" y="${Y(R.ibu) - 2}" width="78" height="24" rx="10" fill="${C.t0}"/><text x="${X(R.og) + 22}" y="${Y(R.ibu) + 15}" class="${p}-nm">neipa v3</text></g>`;
  }
  return `<svg viewBox="0 0 ${W} ${H + 10}" width="${W - 16}" class="${p}-sv" role="radiogroup" aria-label="Carte des styles, OG et IBU">${s}</svg>`;
}

// Le nuancier EBC : la troisième plage, sous la carte.
const nuancier = (neuve = false) => {
  const a = ebc(STYLES['22A'].srm[0]), b = ebc(STYLES['22A'].srm[1]), pc = (x) => (x / 40) * 100;
  return `<div class="${p}-nu" data-booster="couleur" role="img" aria-label="Couleur : style 12 à 28 EBC${neuve ? '' : ', recette 9,5, plus pâle'}">
    <span class="${p}-nl">EBC</span>
    <span class="${p}-ng"><i class="${p}-nb" style="left:${pc(a)}%;width:${pc(b) - pc(a)}%"></i>${neuve ? '' : `<b style="left:${pc(9.5)}%"></b>`}</span>
    <span class="${p}-nx ${p}-mono">${a}–${b}</span>${neuve ? '' : `<span class="${p}-np">pâle</span>`}
  </div>`;
};

const corps = `${tete(p)}
<main class="${p}-m">
  <div class="${p}-e1">
  <section class="${p}-pn" aria-label="Ta bière parmi les styles">
    <div class="${p}-yl">IBU</div><span class="${p}-lgw">${boutonLegende(p)}</span>
    ${carte()}
    ${nuancier()}
    ${legende(p, ['Rectangle : les plages OG et IBU d’un style, BJCP 2021 ; vert, il contient ta recette.', 'Point : ta recette, teinté de sa couleur EBC.', 'Nuancier : la plage de couleur du style, cadre noir.', '~ : estimé ou simulé, jamais mesuré.'])}
    <div class="${p}-au2"><button type="button" class="${p}-au">Autres styles ${ICO.chevron}</button>${duStyle(p)}</div>
  </section>
  <section class="${p}-br" aria-label="Le brassin">
    <div class="${p}-ln">
      <label class="${p}-cl" data-booster="volume"><input class="${p}-mono" inputmode="decimal" value="24" aria-label="Volume en fermenteur"><span>L</span></label>
      <label class="${p}-cl" data-booster="ebullition"><input class="${p}-mono" inputmode="numeric" value="60" aria-label="Durée d’ébullition"><span>min</span></label>
      <span class="${p}-ev"><span class="${p}-mono">~3 L</span> évaporés</span>
      <button type="button" class="${p}-sw" role="switch" aria-checked="false" data-booster="nolo">NOLO<i></i></button>
    </div>
    <div class="${p}-fr" data-booster="fermenteur">
      <span class="${p}-fc" role="img" aria-label="Fermenteur 24 litres sur 30"><i style="height:80%"></i><b></b></span>
      <span class="${p}-ft"><b class="${p}-mono">24/30 L</b> <span>6 L libres</span></span>
      <button type="button" class="${p}-dp">Espace libre · cuve 45 L ${ICO.chevron}</button>
    </div>
  </section>
  ${pied(p)}
  </div>
  <section class="${p}-et" aria-label="Autres états">
    <h2>Recette neuve : la carte sans point, le nom à saisir</h2>
    <section class="${p}-pn">${carte(true)}${nuancier(true)}</section>
  </section>
</main>`;

const css = `
  .${p}-m{padding:8px 8px 0} .${p}-e1{min-height:728px;display:flex;flex-direction:column}
  .${p}-pn{position:relative;background:${C.panneau};border-radius:16px;padding:8px;display:flex;flex-direction:column;gap:6px}
  .${p}-lgw{position:absolute;right:10px;top:6px;z-index:1}
  .${p}-yl{position:absolute;left:12px;top:6px;font-size:12px;color:${C.t2}}
  .${p}-sv{display:block;overflow:visible;color:${C.t0}}
  .${p}-ax{font:400 12px 'IBM Plex Mono',monospace;fill:${C.t2}}
  .${p}-at{font:400 12px 'Source Sans 3',sans-serif;fill:${C.t2}}
  .${p}-bx rect{fill:rgba(17,17,17,.08);stroke:${C.trait};stroke-width:1}
  .${p}-bx-a rect{fill:rgba(86,127,69,.22);stroke:${C.hopT};stroke-width:1.5}
  .${p}-bx-c rect{fill:rgba(17,17,17,.28);stroke:${C.t0};stroke-width:2.5}
  .${p}-bx:not(.${p}-bx-c) .${p}-nmx{display:none}
  .${p}-bx{cursor:pointer} .${p}-bx:focus-visible rect{stroke:${C.eau};stroke-width:3}
  .${p}-bl{font:600 13px 'Source Sans 3',sans-serif;fill:${C.t0}}
  .${p}-cd{font:400 12px 'IBM Plex Mono',monospace;fill:${C.t1}}
  .${p}-bx-a .${p}-cd{fill:${C.hopT};font-weight:600}
  .${p}-nm{font:600 14px 'Source Sans 3',sans-serif;fill:#fff}
  .${p}-nu{display:grid;grid-template-columns:30px 1fr auto auto;align-items:center;gap:8px;padding:0 4px}
  .${p}-nl{font-size:12px;color:${C.t2}}
  .${p}-ng{position:relative;height:14px;border-radius:9px;background:linear-gradient(90deg,#F8E08A 0%,#F2C14E 12%,#E0A02E 25%,#C87A2C 42%,#A0522D 60%,#6B3A1E 80%,#3B1F14 100%)}
  .${p}-nb{position:absolute;top:-4px;bottom:-4px;border:2px solid ${C.t0};border-radius:6px}
  .${p}-ng b{position:absolute;top:-6px;bottom:-6px;width:4px;margin-left:-2px;border-radius:2px;background:${C.att};box-shadow:0 0 0 1.5px #fff}
  .${p}-nx{font-size:12px;color:${C.t2}} .${p}-np{font-size:12px;font-weight:600;color:${C.attT}}
  .${p} .${p}-au{display:flex;align-items:center;gap:4px;min-height:28px;font-size:13px;color:${C.t1};align-self:flex-start;padding:0 4px}
  .${p}-au svg,.${p}-dp svg{color:${C.t2}}
  .${p}-br{margin-top:8px;display:flex;flex-direction:column;gap:6px}
  .${p}-ln{display:flex;align-items:center;gap:6px}
  .${p}-au2{display:flex;align-items:center;justify-content:space-between}
  .${p}-cl{display:flex;align-items:baseline;gap:3px;height:44px;padding:0 10px;border-radius:999px;background:${C.t0};color:#fff}
  .${p}-cl input{width:34px;border:0;background:transparent;color:#fff;font-size:20px;font-weight:600;text-align:right;padding:0;height:38px}
  .${p}-cl span{font-size:13px;color:#ddd}
  .${p}-ev{font-size:12px;color:${C.eauT};line-height:1.2;flex:1}
  .${p} .${p}-sw{display:flex;align-items:center;gap:6px;height:40px;padding:0 10px;border-radius:999px;border:1.5px dashed ${C.trait};font-size:14px;font-weight:600}
  .${p}-sw i{width:30px;height:18px;border-radius:9px;background:${C.bordM};position:relative}
  .${p}-sw i::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .15s}
  .${p}-sw[aria-checked=true]{border-style:solid;border-color:${C.t0}} .${p}-sw[aria-checked=true] i{background:${C.t0}} .${p}-sw[aria-checked=true] i::after{transform:translateX(12px)}
  .${p}-fr{display:flex;align-items:center;gap:10px;background:${C.panneau};border-radius:16px;padding:8px}
  .${p}-fc{position:relative;width:26px;height:40px;border:2px solid ${C.t1};border-radius:6px 6px 8px 8px;overflow:hidden;flex:none}
  .${p}-fc i{position:absolute;left:0;right:0;bottom:0;background:${C.or}}
  .${p}-fc b{position:absolute;left:-2px;right:-2px;bottom:80%;border-top:2px dashed ${C.t0}}
  .${p}-ft{display:flex;flex-direction:column;line-height:1.2} .${p}-ft b{font-size:17px} .${p}-ft span{font-size:12px;color:${C.t2}}
  .${p} .${p}-dp{margin-left:auto;display:flex;align-items:center;gap:4px;min-height:28px;font-size:13px;color:${C.t1}}
  .${p}-et{margin-top:24px;border-top:1px dashed ${C.bordM};padding-top:8px;display:flex;flex-direction:column;gap:6px}
  .${p}-et h2{margin:4px 0 0;font-size:13px;color:${C.t2};font-weight:600}`;

const js = `
  var bx=document.querySelectorAll('.${p}-e1 .${p}-bx');
  bx.forEach(function(g){g.addEventListener('click',function(){bx.forEach(function(o){o.classList.toggle('${p}-bx-c',o===g);o.setAttribute('aria-checked',String(o===g));});});});
  var sw=document.querySelector('.${p}-sw');sw.addEventListener('click',function(){sw.setAttribute('aria-checked',sw.getAttribute('aria-checked')==='true'?'false':'true');});`;

fs.writeFileSync(new URL('./etat.html', import.meta.url), page({ p, titre: 'v5 · Identité · carte des styles', css, corps, js }));
console.log('v5/etat.html écrit');
