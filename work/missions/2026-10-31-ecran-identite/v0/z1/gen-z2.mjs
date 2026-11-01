// Série z, 6 concepts : corps propres à chaque concept. Chrome commun : gen-commun.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { OUT, ICO, PLAGES, plage, page } from './gen-commun.mjs';

const concepts = {};
const SANS = (p, nom, bande) => `<span class="${p}-pl"><span class="${p}-pln">${nom}</span><i class="${p}-plb"><u style="left:${bande[0]}%;width:${bande[1] - bande[0]}%"></u></i></span>`;
const PLAGES5 = (p) => plage(p, 'OG', [42, 75], 66) + SANS(p, 'FG', [27, 60]) + SANS(p, 'alc.', [62, 83]) + plage(p, 'IBU', [43, 71], 66) + plage(p, 'EBC', [30, 70], 24, true);
const IMPORT = (p) => `<button type="button" class="${p}-coller" data-booster="coller-recette" data-role="import-corps">${ICO.paste}<span>Coller une recette trouvée</span></button>`;
const CSS_COLLER = (p) => `.${p}-coller{display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 12px;border:1px solid var(--bord2);border-radius:4px;color:var(--t1);font-weight:600}`;

// ---------- z1 — froide — « la langue de Houblons » ----------
concepts.z1 = {
  titre: 'La langue de Houblons',
  css: `
.z1-corps{padding:8px}
${CSS_COLLER('z1')}
.z1-coller{margin-bottom:8px}
.z1-id{background:var(--panel);border:1px solid var(--bord);border-radius:8px;padding:10px 8px;display:flex;flex-direction:column;gap:12px}
.z1-ligne{display:flex;align-items:center;gap:6px;min-height:38px}
.z1-nom .z1-champ{flex:1}
.z1-lab{color:var(--t3);width:76px;flex:none}
.z1-unit{color:var(--t3)}
.z1-style{display:flex;flex-direction:column;gap:6px;padding:8px 10px;margin:0 -2px;border-radius:8px;background:rgba(251,191,36,.28)}
.z1-style .z1-plb{background:rgba(255,255,255,.75)}
.z1-style .z1-pln,.z1-style .z1-fin{color:#6B3F05}
.z1-style .z1-tiret{border-color:#6B3F05;color:#6B3F05}
.z1-style-t{display:flex;align-items:center;gap:6px;min-height:24px}
.z1-style-t .z1-tiret{margin-left:auto}
.z1-pl{min-height:22px}
.z1-jauge{flex:1;position:relative;height:12px;border-radius:999px;background:var(--bord);margin-left:4px}
.z1-jauge u{position:absolute;left:0;top:0;bottom:0;width:80%;border-radius:999px;background:var(--hop)}
.z1-jauge s{position:absolute;left:80%;top:-4px;width:0;height:20px;border-left:2px dashed var(--t1)}
.z1-jauge.z1-temps u{width:66%;background:var(--eau)}
.z1-jauge.z1-temps s{left:66%;border-left:2px solid var(--t1)}
.z1-fin{color:var(--t3);font-size:12px;white-space:nowrap}
.z1-sous{display:flex;gap:8px;min-height:18px;margin-top:-6px;padding-left:82px;font-size:12px;color:var(--t3)}
.z1-sous .z1-vert{color:var(--hopT)}
.z1-sous .z1-fin{margin-left:auto}
.z1-seg{display:inline-flex;border:1px solid var(--bord2);border-radius:999px;padding:2px;background:var(--page)}
.z1-seg button{height:26px;padding:0 12px;border-radius:999px;font-size:12px;color:var(--t2)}
.z1-seg button[aria-checked="true"]{background:var(--t1);color:#fff;font-weight:600}
.z1-nolo-etat{font-size:12px;color:var(--violetT);margin-left:auto}
.z1-mat{margin:10px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:6px}
.z1-mat>span{display:flex;flex-direction:column;gap:2px;padding:8px;border:1px dashed var(--bord2);border-radius:8px;font-size:12px;color:var(--t3);min-height:60px;justify-content:center}
.z1-mat b{color:var(--t1);font-size:14px}
`,
  corps: `
<main class="z1-corps">
  ${IMPORT('z1')}
  <section class="z1-id" aria-label="Identité">
    <div class="z1-ligne z1-nom">
      <input class="z1-champ" value="neipa v3" aria-label="Nom de la bière" inputmode="text">
      <button type="button" class="z1-tag" data-booster="pastille-style" aria-label="Style : Double IPA">Double IPA ${ICO.chev}</button>
    </div>
    <div class="z1-style" data-booster="plages-au-style">
      <div class="z1-style-t"><span class="z1-fin">22A BJCP 2021</span><span class="z1-tiret">au style</span></div>
      ${PLAGES5('z1')}
    </div>
    <div class="z1-ligne z1-vol">
      <span class="z1-lab">Volume</span>
      <input class="z1-champ z1-num z1-mono" value="24" inputmode="decimal" aria-label="Volume en fermenteur, litres"><span class="z1-unit">L</span>
      <span class="z1-jauge" data-booster="jauge-fermenteur" role="img" aria-label="24 litres sur 30, conseil 24"><u></u><s></s></span>
      <span class="z1-fin z1-mono">30 L</span>
    </div>
    <div class="z1-sous"><span class="z1-vert z1-mono">6 L libres</span><span class="z1-fin">conseil <b class="z1-mono">24 L</b></span></div>
    <div class="z1-ligne z1-ebu">
      <span class="z1-lab">Ébullition</span>
      <input class="z1-champ z1-num z1-mono" value="60" inputmode="numeric" aria-label="Durée d'ébullition, minutes"><span class="z1-unit">min</span>
      <span class="z1-jauge z1-temps" data-booster="jauge-ebullition" role="img" aria-label="60 minutes sur 90"><u></u><s></s></span>
      <span class="z1-fin z1-mono">90</span>
    </div>
    <div class="z1-sous"><span class="z1-mono">~3 L évaporés</span><span class="z1-fin">avant ébullition <b class="z1-mono">~27 L</b></span></div>
    <div class="z1-ligne z1-nolo">
      <div class="z1-seg" role="radiogroup" aria-label="Alcool" data-booster="segment-nolo">
        <button type="button" role="radio" aria-checked="true">Avec alcool</button>
        <button type="button" role="radio" aria-checked="false">NOLO ≤ 0,5 %</button>
      </div>
      <span class="z1-nolo-etat"></span>
    </div>
  </section>
  <div class="z1-mat" data-booster="materiel-du-plan">
    <span>Royal Catering<b>cuve <span class="z1-mono">45 L</span></b></span>
    <span>espace libre<b class="z1-mono">~20 %</b></span>
  </div>
</main>`,
  js: `var seg=document.querySelector('.z1-seg');seg.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;seg.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-checked',x===b)});document.querySelector('.z1-nolo-etat').textContent=b.textContent.indexOf('NOLO')>=0?'atelier à Levure':'';});`,
};

// ---------- z2 — froide — « je décide | ça donne » ----------
concepts.z2 = {
  titre: 'Je décide, ça donne',
  css: `
.z2-corps{padding:8px}
${CSS_COLLER('z2')}
.z2-coller{margin-bottom:8px}
.z2-grille{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--bord);border-radius:8px;overflow:hidden}
.z2-grille>div{padding:8px 10px;min-height:70px;display:flex;align-items:center;gap:6px;border-bottom:1px solid var(--bord)}
.z2-grille>div:nth-last-child(-n+2){border-bottom:0}
.z2-d{background:var(--page)}
.z2-c{background:rgba(79,126,155,.42);border-left:1px solid var(--bord);color:var(--t2);font-size:12px;flex-wrap:wrap;align-content:center}
.z2-c b{color:var(--t1);font-size:14px}
.z2-c .z2-vert{color:#2F5A22}
.z2-d .z2-champ{width:100%}
.z2-d .z2-num{width:62px}
.z2-unit{color:var(--t3)}
.z2-barre{flex-basis:100%;height:10px;border-radius:999px;background:var(--bord2);position:relative;margin-top:2px}
.z2-barre u{position:absolute;left:0;top:0;bottom:0;width:80%;background:var(--hop);border-radius:999px}
.z2-barre s{position:absolute;left:80%;top:-3px;width:0;height:16px;border-left:2px dashed var(--t1)}
.z2-barre.z2-eau u{width:66%;background:var(--eau)}
.z2-barre.z2-eau s{left:66%;border-left-style:solid}
.z2-case{display:flex;align-items:center;gap:8px;font-weight:600;color:var(--t1)}
.z2-case input{width:22px;height:22px;margin:0;accent-color:var(--violet)}
.z2-off{color:var(--t3);font-weight:400}
.z2-on{color:var(--violetT)}
.z2-mat{font-size:12px;color:var(--t2);flex-direction:column;align-items:flex-start;gap:2px}
.z2-mat b{color:var(--t1)}
.z2-pls{flex-basis:100%;display:flex;flex-direction:column;gap:2px}
.z2-pln{width:26px}
.z2-plb{background:rgba(255,255,255,.7)}
.z2-plb u{background:var(--bord2)}
.z2-pln{color:var(--t2)}
`,
  corps: `
<main class="z2-corps">
  <div class="z2-grille" aria-label="Identité : à gauche ce que je décide, à droite ce que ça donne">
    <div class="z2-d"><input class="z2-champ" value="neipa v3" aria-label="Nom de la bière"></div>
    <div class="z2-c"><span>brouillon repris</span></div>

    <div class="z2-d"><button type="button" class="z2-tag" data-booster="pastille-style">Double IPA ${ICO.chev}</button></div>
    <div class="z2-c" data-booster="plages-au-style"><span><b>22A</b> BJCP 2021</span><span class="z2-pls">${PLAGES5('z2')}</span></div>

    <div class="z2-d"><input class="z2-champ z2-num z2-mono" value="24" inputmode="decimal" aria-label="Volume en fermenteur"><span class="z2-unit">L</span></div>
    <div class="z2-c" data-booster="etat-fermenteur"><b class="z2-mono z2-vert">6 L libres</b><span>sur <b class="z2-mono">30 L</b></span><span class="z2-barre" role="img" aria-label="24 sur 30 litres, conseil 24"><u></u><s></s></span><span>conseil <b class="z2-mono">24 L</b></span></div>

    <div class="z2-d"><input class="z2-champ z2-num z2-mono" value="60" inputmode="numeric" aria-label="Durée d'ébullition"><span class="z2-unit">min</span></div>
    <div class="z2-c" data-booster="evaporation-simulee"><b class="z2-mono">~3 L</b><span>évaporés</span><span class="z2-barre z2-eau" role="img" aria-label="60 minutes sur 90"><u></u><s></s></span><span>avant ébullition <b class="z2-mono">~27 L</b></span></div>

    <div class="z2-d"><label class="z2-case" data-booster="case-nolo"><input type="checkbox" id="z2-nolo">NOLO</label></div>
    <div class="z2-c"><b class="z2-mono z2-off" id="z2-nolo-c">≤ 0,5 %</b></div>

    <div class="z2-d z2-mat"><b>Royal Catering</b><span>cuve <b class="z2-mono">45 L</b></span></div>
    <div class="z2-c"><span>espace libre <b class="z2-mono">~20 %</b></span></div>
  </div>
</main>`,
  js: `var c=document.getElementById('z2-nolo'),e=document.getElementById('z2-nolo-c');c.addEventListener('change',function(){e.className='z2-mono '+(c.checked?'z2-on':'z2-off')});`,
};

// ---------- z3 — tiède — « bento » ----------
concepts.z3 = {
  titre: 'Bento',
  css: `
.z3-corps{padding:8px;display:grid;grid-template-columns:1fr 1fr;gap:6px}
.z3-t{border-radius:8px;padding:10px;min-height:164px;display:flex;flex-direction:column;gap:6px;border:1px solid var(--bord);background:var(--panel)}
.z3-l{font-size:12px;color:var(--t3)}
.z3-2{grid-column:1/-1}
.z3-nom{flex-direction:row;align-items:center;min-height:48px}
.z3-nom .z3-champ{flex:1;border:0;background:transparent;padding:0;font-weight:600}
.z3-style{background:rgba(251,191,36,.32);border-color:rgba(217,119,6,.35)}
.z3-style b{font-size:16px;color:#6B3F05}
.z3-style .z3-pln{color:#6B3F05}
.z3-style .z3-plb{background:rgba(255,255,255,.7)}
.z3-vol{background:rgba(86,127,69,.25);border-color:rgba(86,127,69,.35)}
.z3-ebu{background:rgba(79,126,155,.3);border-color:rgba(79,126,155,.35)}
.z3-nolo{background:rgba(106,79,176,.3);border-color:rgba(106,79,176,.3)}
.z3-gros{display:flex;align-items:baseline;gap:4px}
.z3-gros input{width:56px;font-size:28px;line-height:32px;border:0;background:transparent;padding:0;text-align:left;color:var(--t1)}
.z3-gros span{font-size:14px;color:var(--t2)}
.z3-cell{display:flex;gap:2px;margin-top:2px}
.z3-cell i{flex:1;height:12px;border-radius:2px;background:var(--hop)}
.z3-cell i.v{background:var(--page)}
.z3-cell i.c{outline:2px dashed var(--t1);outline-offset:-1px}
.z3-cell.z3-eau i{background:var(--eau)}
.z3-cell.z3-eau i.v{background:var(--page)}
.z3-petit{font-size:12px;color:var(--t2)}
.z3-vert{color:var(--hopT);font-weight:600}
.z3-pil{height:28px;padding:0 12px;border-radius:999px;border:1px solid var(--bord2);background:var(--page);font-weight:600;color:var(--t1);align-self:flex-start}
.z3-pil[aria-pressed="true"]{background:var(--violet);border-color:var(--violet);color:#fff}
.z3-mat{flex-direction:row;align-items:center;justify-content:space-between;min-height:56px}
.z3-mat b{color:var(--t1)}
.z3-v{color:var(--violetT)}
.z3-coller{min-height:48px;flex-direction:row;align-items:center;gap:8px;border-style:dashed;background:var(--page);color:var(--t1);font-weight:600;justify-content:center}
`,
  corps: `
<main class="z3-corps" aria-label="Identité">
  <div class="z3-t z3-2 z3-nom"><input class="z3-champ" value="neipa v3" aria-label="Nom de la bière"><span class="z3-l">nom</span></div>
  <div class="z3-t z3-style" data-booster="tuile-style">
    <b>Double IPA</b>
    <span class="z3-l" style="color:#6B3F05">22A BJCP 2021</span>
    ${PLAGES('z3')}
  </div>
  <div class="z3-t z3-vol" data-booster="tuile-volume">
    <div class="z3-gros"><input class="z3-mono" value="24" inputmode="decimal" aria-label="Volume en fermenteur"><span>L</span></div>
    <div class="z3-cell" role="img" aria-label="24 litres sur 30, cases de 3 litres, conseil 24"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i class="c"></i><i class="v"></i><i class="v"></i></div>
    <div class="z3-petit"><span class="z3-vert z3-mono">6 L libres</span> sur <span class="z3-mono">30 L</span></div>
    <div class="z3-petit">conseil <b class="z3-mono">24 L</b></div>
  </div>
  <div class="z3-t z3-ebu" data-booster="tuile-ebullition">
    <div class="z3-gros"><input class="z3-mono" value="60" inputmode="numeric" aria-label="Durée d'ébullition"><span>min</span></div>
    <div class="z3-cell z3-eau" role="img" aria-label="60 minutes, par pas de 15"><i></i><i></i><i></i><i></i><i class="v"></i><i class="v"></i></div>
    <div class="z3-petit z3-sim"><span class="z3-mono">~3 L</span> évaporés</div>
    <div class="z3-petit">avant ébullition <b class="z3-mono">~27 L</b></div>
  </div>
  <div class="z3-t z3-nolo" data-booster="tuile-nolo">
    <span class="z3-l" style="color:var(--violetT)">NOLO</span>
    <button type="button" class="z3-pil" aria-pressed="false" id="z3-nolo">non</button>
    <span class="z3-petit z3-v" id="z3-nolo-s">≤ 0,5 %</span>
  </div>
  <div class="z3-t z3-mat"><span class="z3-petit"><b>Royal Catering</b><br>cuve <b class="z3-mono">45 L</b></span><span class="z3-petit">espace libre<br><b class="z3-mono">~20 %</b></span></div>
  <button type="button" class="z3-t z3-2 z3-coller" data-booster="coller-recette" data-role="import-corps">${ICO.paste}Coller une recette trouvée</button>
</main>`,
  js: `var b=document.getElementById('z3-nolo'),s=document.getElementById('z3-nolo-s');b.addEventListener('click',function(){var on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);b.textContent=on?'≤ 0,5 %':'non';s.textContent=on?'atelier à Levure':'≤ 0,5 %'});`,
};

// ---------- z4 — tiède — « le verre » ----------
concepts.z4 = {
  titre: 'Le verre',
  css: `
.z4-corps{padding:8px}
.z4-nom{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.z4-nom input{flex:1;border:0;border-bottom:1px solid var(--bord2);border-radius:0;background:transparent;padding:0 2px;font-size:28px;line-height:36px;height:44px;font-weight:600}
.z4-scene{display:grid;grid-template-columns:176px 1fr;gap:10px;align-items:stretch}
.z4-verre{display:flex;flex-direction:column;align-items:center;gap:4px}
.z4-verre svg{display:block}
.z4-cap{font-size:12px;color:var(--t3)}
.z4-col{display:flex;flex-direction:column;gap:10px;justify-content:center}
.z4-l{display:flex;align-items:center;gap:6px;min-height:32px}
.z4-l .z4-unit{color:var(--t3)}
.z4-badge{display:inline-flex;align-items:center;height:24px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:600;background:rgba(86,127,69,.16);color:var(--hopT);white-space:nowrap}
.z4-sim{font-size:12px}
.z4-mini{display:inline-block;position:relative;width:54px;height:10px;border-radius:999px;background:var(--bord)}
.z4-mini u{position:absolute;left:0;top:0;bottom:0;width:66%;background:var(--eau);border-radius:999px}
.z4-pil{height:28px;padding:0 12px;border-radius:999px;border:1px solid var(--bord2);background:var(--page);font-weight:600;color:var(--t1);white-space:nowrap}
.z4-pil[aria-pressed="true"]{background:var(--violet);border-color:var(--violet);color:#fff}
.z4-pls{display:flex;flex-direction:column;gap:3px;padding-top:2px}
.z4-pls .z4-pln{width:28px}
.z4-strip{margin-top:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
.z4-strip>span{display:flex;flex-direction:column;gap:2px;padding:8px;background:var(--panel);border:1px solid var(--bord);border-radius:8px;font-size:12px;color:var(--t3);min-height:54px;justify-content:center}
.z4-strip b{color:var(--t1);font-size:14px}
`,
  corps: `
<main class="z4-corps" aria-label="Identité">
  <div class="z4-nom"><input value="neipa v3" aria-label="Nom de la bière"></div>
  <div class="z4-scene">
    <div class="z4-verre" data-booster="verre-ebc" role="img" aria-label="Verre à la couleur EBC 9,5">
      <svg viewBox="0 0 120 190" width="170" height="269" fill="none">
        <defs><clipPath id="z4c"><path d="M22 6h76l-4 66c-2 22-4 38-6 50l-2 10c-1 6 2 10 8 12 6 2 8 6 8 10v6H18v-6c0-4 2-8 8-10 6-2 9-6 8-12l-2-10C30 110 28 94 26 72z"/></clipPath></defs>
        <g clip-path="url(#z4c)"><rect x="0" y="0" width="120" height="190" fill="#E0A02E"/><rect x="0" y="0" width="120" height="24" fill="#FFF7E0"/><ellipse cx="60" cy="24" rx="48" ry="6" fill="#FFFFFF" opacity=".9"/><rect x="34" y="32" width="6" height="110" fill="#fff" opacity=".25"/></g>
        <path d="M22 6h76l-4 66c-2 22-4 38-6 50l-2 10c-1 6 2 10 8 12 6 2 8 6 8 10v6H18v-6c0-4 2-8 8-10 6-2 9-6 8-12l-2-10C30 110 28 94 26 72z" stroke="#111" stroke-width="1"/>
      </svg>
      <span class="z4-cap">couleur EBC</span>
    </div>
    <div class="z4-col">
      <div class="z4-l"><button type="button" class="z4-tag" data-booster="pastille-style">Double IPA ${ICO.chev}</button></div>
      <div class="z4-pls" data-booster="plages-au-style"><span class="z4-cap">22A BJCP 2021</span>${PLAGES('z4')}</div>
      <div class="z4-l"><input class="z4-champ z4-num z4-mono" value="24" inputmode="decimal" aria-label="Volume en fermenteur"><span class="z4-unit">L</span><span class="z4-badge z4-mono" data-booster="badge-fermenteur">6 L libres</span></div>
      <div class="z4-l"><input class="z4-champ z4-num z4-mono" value="60" inputmode="numeric" aria-label="Durée d'ébullition"><span class="z4-unit">min</span><span class="z4-mini" role="img" aria-label="60 minutes sur 90"><u></u></span><span class="z4-sim z4-mono">~3 L</span></div>
      <div class="z4-l"><button type="button" class="z4-pil" aria-pressed="false" id="z4-nolo" data-booster="pilule-nolo">NOLO non</button></div>
    </div>
  </div>
  <div class="z4-strip" data-booster="materiel-du-plan">
    <span>Royal Catering<b>cuve <span class="z4-mono">45 L</span></b></span>
    <span>fermenteur<b class="z4-mono">30 L</b></span>
    <span>conseil<b class="z4-mono">24 L</b></span>
  </div>
  <div class="z4-strip">
    <span>espace libre<b class="z4-mono">~20 %</b></span>
    <span>avant ébullition<b class="z4-mono">~27 L</b></span>
    <span>brouillon<b>repris</b></span>
  </div>
</main>`,
  js: `var b=document.getElementById('z4-nolo');b.addEventListener('click',function(){var on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);b.textContent=on?'NOLO ≤ 0,5 %':'NOLO non'});`,
};

// ---------- z5 — chaude — « le dialogue » ----------
concepts.z5 = {
  titre: 'Le dialogue',
  css: `
.z5-corps{padding:12px 8px 0;display:flex;flex-direction:column;gap:16px}
.z5-q{font-size:14px;color:var(--t2);display:flex;align-items:center;gap:8px;margin:0;min-height:28px}
.z5-q::before{content:'';width:28px;height:28px;border-radius:50%;background:var(--water);flex:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'/%3E%3C/svg%3E");background-size:16px;background-position:center;background-repeat:no-repeat}
.z5-r{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:6px;padding-left:36px}
.z5-bulle{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 14px;border-radius:999px;border:1px solid var(--t1);background:var(--t1);color:#fff;font-weight:600;white-space:nowrap}
.z5-bulle input{border:0;background:transparent;padding:0;font-size:16px;font-weight:600;color:#fff;width:84px}
.z5-bulle input.z5-n{width:34px;text-align:right}
.z5-bulle .z5-u{color:#ccc;font-weight:400}
.z5-fait{display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 10px;border-radius:999px;background:var(--panel);border:1px solid var(--bord);color:var(--t2);font-size:12px;white-space:nowrap}
.z5-fait b{color:var(--t1)}
.z5-fait.ok{background:rgba(86,127,69,.16);border-color:transparent;color:var(--hopT)}
.z5-fait.ok b{color:var(--hopT)}
.z5-fait.z5-eau{background:rgba(79,126,155,.14);border-color:transparent;color:var(--waterT)}
.z5-fait.z5-eau b{color:var(--waterT)}
.z5-tag{height:36px;font-size:16px}
.z5-tog{background:var(--page);color:var(--t1)}
.z5-tog .z5-u{color:var(--t3)}
.z5-tog[aria-pressed="true"]{background:var(--violet);border-color:var(--violet);color:#fff}
.z5-tog[aria-pressed="true"] .z5-u{color:#fff}
`,
  corps: `
<main class="z5-corps" aria-label="Identité, en quatre questions">
  <p class="z5-q">Quelle bière ?</p>
  <div class="z5-r">
    <span class="z5-bulle"><input value="neipa v3" aria-label="Nom de la bière"></span>
    <button type="button" class="z5-tag" data-booster="pastille-style">Double IPA ${ICO.chev}</button>
  </div>
  <div class="z5-r" style="margin-top:-10px">
    <span class="z5-fait">22A BJCP 2021</span>
    <span class="z5-fait">OG <b class="z5-mono">1,065 – 1,085</b></span>
    <span class="z5-fait">IBU <b class="z5-mono">60 – 100</b></span>
  </div>
  <p class="z5-q">Combien ?</p>
  <div class="z5-r">
    <span class="z5-bulle"><input class="z5-n z5-mono" value="24" inputmode="decimal" aria-label="Volume en fermenteur"><span class="z5-u">L</span></span>
    <span class="z5-fait ok" data-booster="fait-fermenteur"><b class="z5-mono">6 L</b> libres sur <b class="z5-mono">30</b></span>
  </div>
  <div class="z5-r" style="margin-top:-10px">
    <span class="z5-fait">conseil <b class="z5-mono">24 L</b></span>
    <span class="z5-fait">espace libre <b class="z5-mono">~20 %</b></span>
  </div>
  <p class="z5-q">Comment ?</p>
  <div class="z5-r">
    <span class="z5-bulle"><input class="z5-n z5-mono" value="60" inputmode="numeric" aria-label="Durée d'ébullition"><span class="z5-u">min</span></span>
    <button type="button" class="z5-bulle z5-tog" aria-pressed="false" id="z5-nolo" data-booster="bulle-nolo">NOLO <span class="z5-u">non</span></button>
  </div>
  <div class="z5-r" style="margin-top:-10px">
    <span class="z5-fait z5-eau" data-booster="fait-evaporation"><b class="z5-mono">~3 L</b> évaporés</span>
    <span class="z5-fait z5-eau">avant ébullition <b class="z5-mono">~27 L</b></span>
  </div>
  <p class="z5-q">Avec quoi ?</p>
  <div class="z5-r">
    <span class="z5-bulle">Royal Catering</span>
    <span class="z5-fait">cuve <b class="z5-mono">45 L</b></span>
  </div>
</main>`,
  js: `var b=document.getElementById('z5-nolo');b.addEventListener('click',function(){var on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);b.querySelector('span').textContent=on?'≤ 0,5 %':'non'});`,
};

// ---------- z6 — chaude — « la ligne » ----------
concepts.z6 = {
  titre: 'La ligne',
  css: `
.z6-corps{padding:12px 8px 0 8px}
.z6-ligne{position:relative;padding-left:34px}
.z6-ligne::before{content:'';position:absolute;left:6px;top:14px;bottom:30px;width:12px;background:var(--hop);border-radius:6px}
.z6-st{position:relative;min-height:74px;display:flex;flex-direction:column;justify-content:center;gap:4px;padding:4px 0 12px}
.z6-st::before{content:'';position:absolute;left:-34px;top:8px;width:24px;height:24px;border-radius:50%;background:var(--page);border:7px solid var(--hop);box-shadow:0 0 0 2px var(--page);box-sizing:border-box}
.z6-st.z6-off::before{background:var(--page);border:3px solid var(--t1)}
.z6-st.z6-on::before{background:var(--violet);border:3px solid var(--violet)}
.z6-st.z6-gris::before{background:var(--page);border:3px dashed var(--bord2)}
.z6-v{display:flex;align-items:center;gap:6px;min-height:32px}
.z6-v input{border:0;border-bottom:1px solid var(--bord2);border-radius:0;background:transparent;padding:0;height:30px;font-size:16px;color:var(--t1);font-weight:600}
.z6-v input.z6-n{width:40px;text-align:right}
.z6-unit{color:var(--t3)}
.z6-br{font-size:12px;color:var(--t3);display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.z6-br::before{content:'';width:10px;height:2px;background:var(--bord2)}
.z6-br b{color:var(--t1)}
.z6-vert{color:var(--hopT);font-weight:600}
.z6-mini{display:inline-block;position:relative;width:110px;height:10px;border-radius:999px;background:var(--bord)}
.z6-mini u{position:absolute;left:0;top:0;bottom:0;width:80%;background:var(--hop);border-radius:999px}
.z6-mini s{position:absolute;left:80%;top:-3px;width:0;height:16px;border-left:2px dashed var(--t1)}
.z6-mini.z6-eau u{width:66%;background:var(--eau)}
.z6-mini.z6-eau s{left:66%;border-left-style:solid}
.z6-tog{height:30px;padding:0 12px;border-radius:999px;border:1px solid var(--t1);background:var(--page);font-weight:600;color:var(--t1)}
.z6-tog[aria-pressed="true"]{background:var(--violet);border-color:var(--violet);color:#fff}
.z6-pls{display:flex;flex-direction:column;gap:2px;width:250px}
.z6-pls .z6-pln{width:28px}
.z6-coller{display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 12px;border:1px dashed var(--bord2);border-radius:999px;color:var(--t2)}
`,
  corps: `
<main class="z6-corps" aria-label="Identité, station par station">
  <div class="z6-ligne" data-booster="ligne-decisions">
    <div class="z6-st"><div class="z6-v"><input value="neipa v3" aria-label="Nom de la bière" style="width:200px"></div><div class="z6-br">brouillon repris</div></div>
    <div class="z6-st">
      <div class="z6-v"><button type="button" class="z6-tag" data-booster="pastille-style">Double IPA ${ICO.chev}</button><span class="z6-unit" style="font-size:12px">22A BJCP 2021</span></div>
      <div class="z6-br" data-booster="plages-au-style"><span class="z6-pls">${PLAGES5('z6')}</span></div>
    </div>
    <div class="z6-st">
      <div class="z6-v"><input class="z6-n z6-mono" value="24" inputmode="decimal" aria-label="Volume en fermenteur"><span class="z6-unit">L</span><span class="z6-mini" role="img" aria-label="24 sur 30 litres"><u></u><s></s></span></div>
      <div class="z6-br" data-booster="branche-fermenteur"><span class="z6-vert z6-mono">6 L libres</span> sur <b class="z6-mono">30 L</b> conseil <b class="z6-mono">24 L</b></div>
    </div>
    <div class="z6-st">
      <div class="z6-v"><input class="z6-n z6-mono" value="60" inputmode="numeric" aria-label="Durée d'ébullition"><span class="z6-unit">min</span><span class="z6-mini z6-eau" role="img" aria-label="60 minutes sur 90"><u></u><s></s></span></div>
      <div class="z6-br"><b class="z6-mono">~3 L</b> évaporés avant ébullition <b class="z6-mono">~27 L</b></div>
    </div>
    <div class="z6-st z6-off" id="z6-st-nolo">
      <div class="z6-v"><button type="button" class="z6-tog" aria-pressed="false" id="z6-nolo" data-booster="station-nolo">NOLO non</button></div>
    </div>
    <div class="z6-st">
      <div class="z6-v"><b>Royal Catering</b></div>
      <div class="z6-br">cuve <b class="z6-mono">45 L</b> espace libre <b class="z6-mono">~20 %</b></div>
    </div>
    <div class="z6-st z6-gris">
      <div class="z6-v"><button type="button" class="z6-coller" data-booster="coller-recette" data-role="import-corps">${ICO.paste}Coller une recette</button></div>
    </div>
  </div>
</main>`,
  js: `var b=document.getElementById('z6-nolo'),s=document.getElementById('z6-st-nolo');b.addEventListener('click',function(){var on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);b.textContent=on?'NOLO ≤ 0,5 %':'NOLO non';s.className='z6-st '+(on?'z6-on':'z6-off')});`,
};

for (const [id, c] of Object.entries(concepts)) {
  const dir = path.join(OUT, id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'etat.html'), page({ id, ...c }));
  console.log('écrit', id);
}
