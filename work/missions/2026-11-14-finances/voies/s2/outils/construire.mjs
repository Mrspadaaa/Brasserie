// Voie s2 : construit les quatre mini maquettes (s2a…s2d) depuis la base v6a, telle quelle.
// Assemblage par split/join (L26), classes préfixées par l'id. Polices copiées dans ../fonts (aucun appel réseau dans les pages).
// Usage : node work/missions/2026-11-14-finances/voies/s2/outils/construire.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const VOIE = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = readFileSync(join(VOIE, '..', '..', 'ref', 'v6a', 'etat.html'), 'utf8');
const FONTS = join(VOIE, 'fonts');

// ---------- polices locales (une seule fois) ----------
async function polices() {
  if (existsSync(join(FONTS, 'fonts.css'))) return;
  mkdirSync(FONTS, { recursive: true });
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
  const css = await (await fetch('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Source+Sans+3:wght@400;600;700&display=swap', { headers: { 'user-agent': ua } })).text();
  const blocs = css.split('/* ').slice(1).filter((b) => b.startsWith('latin */') || b.startsWith('latin-ext */'));
  let out = '';
  let n = 0;
  for (const b of blocs) {
    const url = b.match(/url\((https:[^)]+)\)/)[1];
    const nom = `f${n++}.woff2`;
    writeFileSync(join(FONTS, nom), Buffer.from(await (await fetch(url)).arrayBuffer()));
    out += '/* ' + b.split(url).join(nom);
  }
  writeFileSync(join(FONTS, 'fonts.css'), out);
}

// ---------- base v6a ----------
const cut = (s, a, b) => s.slice(s.indexOf(a), s.indexOf(b, s.indexOf(a)) + b.length);
const STYLE = BASE.slice(BASE.indexOf('<style>') + 7, BASE.indexOf('</style>'));
const HEADER = cut(BASE, '<header', '</header>');
const TABS = cut(BASE, '<nav class="v6a-tabs"', '</nav>');
const NAV = cut(BASE, '<nav class="v6a-nav"', '</nav>') + '\n<button class="v6a-fab" aria-label="Ajouter">+</button>';
const DUE = cut(BASE, '<button class="v6a-due"', '</button>');
const PILL = cut(BASE, '<span class="v6a-pill">', '</button></span>');
const LISTE_MOIS = BASE.slice(BASE.indexOf('<!-- Charges fixes -->'), BASE.indexOf('<section class="v6a-annex"'));
const pre = (s, p) => s.split('v6a-').join(p + '-');

const f = (v) => v.toFixed(2).replace('.', ',');
const H = 88 / 720; // échelle des piles de v6a (720 → 88 px)

// Piles : fixes = à payer (hachuré) + payé ; ghost = hauteur du mois en pointillé (s2d)
function piles(p, aPayer, ghost = false) {
  const fixes = 68 + aPayer;
  const hF = aPayer ? 57 : Math.round(fixes * H);
  const stF = `<span class="${p}-st" style="height:${hF}px">${aPayer ? `<i class="${p}-hat" style="flex:400"></i>` : ''}<i style="flex:68;background:#9856D2"></i></span>`;
  const fx = ghost && !aPayer ? `<span class="${p}-gh" style="height:57px">${stF}</span>` : stF;
  return `<div class="${p}-piles">
    <div class="${p}-p"><b class="${p}-m" style="color:#2A7240">+720,00</b><span class="${p}-st" style="height:88px"><i style="flex:1;background:#56D27B"></i></span></div>
    <span class="${p}-sep"></span>
    <div class="${p}-p"><b class="${p}-m">${f(fixes)}</b>${fx}</div>
    <div class="${p}-p"><b class="${p}-m">186,80</b><span class="${p}-st" style="height:23px"><i style="flex:1;background:#D2B356"></i></span></div>
    <div class="${p}-p"><b class="${p}-m">42,00</b><span class="${p}-st" style="height:6px"><i style="flex:1;background:#56C1D2"></i></span></div>
    <span class="${p}-sep"></span>
    <div class="${p}-p"><b class="${p}-m">28,60</b><span class="${p}-st" style="height:4px"><i style="flex:1;background:#567BD2"></i></span></div>
   </div>
   <div class="${p}-base"><span>Ventes</span><span></span><span>Fixes</span><span>Brassage</span><span>Nettoyage</span><span></span><span>Matériel</span></div>`;
}
const cle = (p, aPayer) => `<div class="${p}-key"><span><i style="background:linear-gradient(90deg,#9856D2 25%,#D2B356 25% 50%,#56C1D2 50% 75%,#567BD2 75%)"></i>payé <b class="${p}-m">325,40</b></span><span><i class="${p}-hat"></i>à payer <b class="${p}-m">${f(aPayer)}</b></span><span>dépensé <b class="${p}-m">${f(296.8 + aPayer)}</b></span></div>`;

function bande(p, { pill, extraTop = '', avant = '', apresBase = '', aPayer = 400, ghost = false, booster = 'piles-basses' }) {
  return `<section class="${p}-band" aria-label="Le mois par catégorie" data-booster="${booster}">
   <div class="${p}-top">${pill ?? pre(PILL, p)}${extraTop}${pre(DUE, p)}</div>
   ${avant}
   ${piles(p, aPayer, ghost)}
   ${apresBase}
   ${cle(p, aPayer)}
  </section>`;
}

// Liste : celle de v6a ; dans une plage sans le 25 nov., le loyer sort (ligne « hors plage »), Charges fixes = 68,00
function liste(p, plage, tete = '') {
  let l = pre(LISTE_MOIS, p);
  if (plage) {
    const a = l.indexOf(`<div class="${p}-op">`);
    const b = l.indexOf(`<div class="${p}-op">`, a + 10);
    l = l.slice(0, a) + l.slice(b);
    l = l.split(`<b>Charges fixes</b><span class="${p}-sub ${p}-m">468,00</span>`).join(`<b>Charges fixes</b><span class="${p}-sub ${p}-m">68,00</span>`);
    const finElec = l.indexOf('</div>', l.indexOf('facture</span></span>')) + 6;
    l = l.slice(0, finElec) + `\n  <div class="${p}-hors"><span class="${p}-hp">hors plage</span><span>Loyer de l'atelier · à payer 25 nov.</span><b class="${p}-m">400,00</b></div>` + l.slice(finElec);
  }
  return `<div data-mots="lignes" data-booster="lignes-entieres">${tete}${l}</div>`;
}

function ecran(p, o, surcouche = '') {
  return `<div class="${p}-frame">
 ${pre(HEADER, p)}
 <div class="${p}-app">
  ${pre(TABS, p)}
  ${bande(p, o)}
  ${liste(p, o.plage, o.tete ?? '')}
 </div>
 ${pre(NAV, p)}
 ${surcouche}
</div>`;
}

// ---------- jours du mois (frise, histogramme) ----------
const NOV = { 9: [[68, '#9856D2'], [186.8, '#D2B356'], [42, '#56C1D2'], [28.6, '#567BD2']], 25: [[400, 'hat']] };
function jours(p, n, { maxH, dim = () => false, data = NOV, vente = 9 }) {
  let h = '';
  for (let d = 1; d <= n; d++) {
    const seg = data[d];
    let c = `<i class="${p}-z"></i>`;
    if (seg) {
      const tot = seg.reduce((s, x) => s + x[0], 0);
      c = `<span class="${p}-bk" style="height:${Math.round(tot * maxH / 400)}px">${seg.map(([v, col]) => col === 'hat' ? `<i class="${p}-hat" style="flex:${v}"></i>` : `<i style="flex:${v};background:${col}"></i>`).join('')}</span>`;
      if (d === vente) c = `<i class="${p}-v"></i>` + c;
    }
    h += `<span class="${p}-d${dim(d) ? ` ${p}-dim` : ''}">${c}</span>`;
  }
  return h;
}
const cssJours = (p, n, h) => `
.${p}-days{position:relative;z-index:1;display:grid;grid-template-columns:repeat(${n},1fr);align-items:end;height:${h}px}
.${p}-d{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
.${p}-bk{width:66%;min-width:4px;border-radius:3px 3px 1px 1px;overflow:hidden;display:flex;flex-direction:column}
.${p}-bk i{display:block}
.${p}-z{width:3px;height:3px;border-radius:50%;background:#BDB6A6;margin-bottom:1px}
.${p}-v{width:6px;height:6px;border-radius:50%;background:#2FA855;margin-bottom:2px}
.${p}-dim{opacity:.25}
.${p}-ax{display:grid;grid-template-columns:repeat(${n},1fr);height:16px;font-size:12px;line-height:16px;color:#555}
.${p}-ax span{grid-row:1;justify-self:center;white-space:nowrap}
.${p}-ax .${p}-auj{color:#2F6EA8;font-weight:700}
.${p}-ax .${p}-sb{color:#111;font-weight:700}
`;
const ax = (p, marks) => `<div class="${p}-ax">${marks.map(([d, t, c]) => `<span style="grid-column:${d}"${c ? ` class="${p}-${c}"` : ''}>${t}</span>`).join('')}</div>`;
const pc = (x, n) => `${(x / n * 100).toFixed(3)}%`;

const SVG_CAL = (c = '#111') => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9"><rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/><path d="M8 14h3M13 14h3M8 17h3" stroke-width="2.2"/></svg>`;

// =====================================================================
const V = {};

// ---------- s2a : frise des jours sous le graphe, deux poignées ----------
V.s2a = () => {
  const p = 's2a';
  const frise = (deb, fin, apres) => `
   <div class="s2a-fr" data-booster="frise-poignees">
    <div class="s2a-rd">${apres ? `<b>du 1<sup>er</sup> au 15 nov.</b><span class="s2a-nb">15 jours</span><button class="s2a-x" aria-label="Revenir au mois entier">× mois entier</button>` : `<span>jours de novembre</span>`}</div>
    <div class="s2a-tr">
     ${apres ? `<span class="s2a-sel" style="left:${pc(deb - 1, 30)};width:${pc(fin - deb + 1, 30)}"></span>` : ''}
     <div class="s2a-days">${jours(p, 30, { maxH: 34, dim: (d) => apres && (d < deb || d > fin) })}</div>
     <span class="s2a-h" style="left:${pc(deb - 1, 30)}" role="slider" aria-label="Début" aria-valuetext="${deb} nov."><i class="s2a-gp">${grip}</i></span>
     <span class="s2a-h" style="left:${pc(fin, 30)}" role="slider" aria-label="Fin" aria-valuetext="${fin} nov."><i class="s2a-gp">${grip}</i></span>
    </div>
    ${ax(p, [[1, '1', apres ? 'sb' : ''], [9, 'auj. 9', 'auj'], ...(apres ? [[15, '15', 'sb']] : [[16, '16']]), [25, '25'], [30, '30']])}
   </div>`;
  const grip = '<svg width="10" height="12" viewBox="0 0 10 12" fill="none" stroke="#111" stroke-width="1.8"><path d="M3 1v10M7 1v10"/></svg>';
  const css = cssJours(p, 30, 34) + `
.s2a-fr{margin:8px 6px 2px}
.s2a-rd{display:flex;align-items:center;gap:6px;min-height:26px;font-size:12px;color:#555}
.s2a-rd b{font-size:14px;color:#111}
.s2a-nb{font-size:12px;color:#555;font-weight:500}
.s2a-x{margin-left:auto;min-height:24px;padding:0 9px;border-radius:16px;border:1px solid #D9D9D9;background:#fff;font-size:12px;color:#444}
.s2a-tr{position:relative;height:42px;padding-top:4px;border-bottom:1.5px solid #111}
.s2a-sel{position:absolute;top:0;bottom:0;background:#DCE8F5;border-radius:6px 6px 0 0}
.s2a-h{position:absolute;top:-2px;bottom:-6px;width:44px;margin-left:-22px;z-index:2}
.s2a-h::before{content:"";position:absolute;top:0;bottom:0;left:21px;width:2px;background:#111;border-radius:1px}
.s2a-gp{position:absolute;left:11px;top:9px;width:22px;height:26px;border-radius:8px;background:#fff;border:2px solid #111;display:grid;place-items:center;box-shadow:0 1px 3px rgba(0,0,0,.18)}
.s2a-ax{margin-top:3px}`;
  const repos = ecran(p, { apresBase: frise(1, 30, false) });
  const apres = ecran(p, { apresBase: frise(1, 15, true), aPayer: 0, plage: true });
  return { css, shots: [['repos', 'Repos : novembre, les poignées aux deux bouts de la frise', repos], ['apres', 'Après : poignée de droite glissée au 15', apres]] };
};

// ---------- s2b : calendrier en feuille, mode plage (react-day-picker) ----------
V.s2b = () => {
  const p = 's2b';
  const btn = `<button class="s2b-cal s2b-bx" aria-label="Choisir des jours" data-booster="calendrier-plage">${SVG_CAL()}</button>`;
  const pillPlage = `<span class="s2b-rg" data-booster="pastille-plage">${SVG_CAL('#fff')}<b>1 → 15 nov.</b><button aria-label="Revenir au mois">×</button></span>`;
  // grille lundi d'abord ; 1er nov. 2026 = dimanche
  let cells = '';
  for (let i = 0; i < 6; i++) cells += '<span></span>';
  for (let d = 1; d <= 30; d++) {
    const dans = d >= 1 && d <= 15;
    const bout = d === 1 ? ' s2b-deb' : d === 15 ? ' s2b-fin' : '';
    const dots = d === 9 ? '<i class="s2b-dt"><i style="background:#2FA855"></i><i style="background:#9856D2"></i><i style="background:#D2B356"></i><i style="background:#56C1D2"></i><i style="background:#567BD2"></i></i>'
      : d === 25 ? '<i class="s2b-dt"><i class="s2b-hat s2b-dh"></i></i>' : '';
    cells += `<button class="s2b-c${dans ? ' s2b-in' : ''}${bout}${d === 9 ? ' s2b-auj' : ''}"><b>${d}</b>${dots}</button>`;
  }
  const feuille = `<div class="s2b-scrim"></div>
  <div class="s2b-sh" role="dialog" aria-label="Choisir des jours">
   <i class="s2b-grab"></i>
   <div class="s2b-mn"><button aria-label="Mois précédent">‹</button><b>novembre 2026</b><button aria-label="Mois suivant">›</button><button class="s2b-txt">Mois entier</button></div>
   <div class="s2b-wk"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
   <div class="s2b-grid">${cells}</div>
   <div class="s2b-ft"><span class="s2b-sum"><span>dim. 1<sup>er</sup> → dim. 15 nov.</span><small>15 jours · le loyer du 25 reste dehors</small></span><button class="s2b-go">Voir</button></div>
  </div>`;
  const css = `
.s2b-cal{width:32px;height:32px;border-radius:10px;display:grid;place-items:center}
.s2b-rg{display:flex;align-items:center;gap:6px;min-height:30px;padding:0 2px 0 10px;border-radius:16px;background:#111;color:#fff}
.s2b-rg b{font-size:15px}
.s2b-rg button{width:28px;height:28px;border-radius:50%;color:#fff;font-size:18px}
.s2b-scrim{position:absolute;inset:0;background:rgba(17,17,17,.38);z-index:7}
.s2b-sh{position:absolute;left:0;right:0;bottom:0;z-index:8;background:#fff;border-radius:16px 16px 0 0;padding:6px 10px 12px;box-shadow:0 -6px 24px rgba(0,0,0,.18)}
.s2b-grab{display:block;width:36px;height:4px;border-radius:2px;background:#D0D0D0;margin:0 auto 6px}
.s2b-mn{display:flex;align-items:center;gap:4px;height:36px}
.s2b-mn b{font-size:15px;padding:0 4px}
.s2b-mn button{min-width:32px;height:32px;border-radius:50%;font-size:18px}
.s2b-mn .s2b-txt{margin-left:auto;border-radius:16px;font-size:13px;color:#2F6EA8;padding:0 10px;border:1px solid #CFE0F0}
.s2b-wk,.s2b-grid{display:grid;grid-template-columns:repeat(7,1fr)}
.s2b-wk span{text-align:center;font-size:12px;color:#666;line-height:22px}
.s2b-c{position:relative;height:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.s2b-c b{font-weight:400;font-size:14px;width:34px;height:30px;line-height:30px;border-radius:50%;text-align:center;font-variant-numeric:tabular-nums}
.s2b-in::before{content:"";position:absolute;left:0;right:0;top:5px;height:34px;background:#DCE8F5;z-index:-1}
.s2b-grid{position:relative;z-index:0}
.s2b-deb::before{left:50%;border-radius:0}.s2b-fin::before{right:50%}
.s2b-deb b,.s2b-fin b{background:#111;color:#fff;font-weight:600}
.s2b-auj b{box-shadow:inset 0 0 0 2px #2F6EA8;font-weight:600}
.s2b-dt{position:absolute;bottom:2px;display:flex;gap:2px}
.s2b-dt i{width:4px;height:4px;border-radius:50%}
.s2b-dt .s2b-dh{width:12px;height:5px;border-radius:2px}
.s2b-ft{display:flex;align-items:center;gap:10px;margin-top:8px;padding-top:8px;border-top:1px solid #EBEBEB}
.s2b-sum{display:flex;flex-direction:column;font-size:15px;font-weight:600;flex:1}
.s2b-sum small{font-size:12px;font-weight:400;color:#555}
.s2b-go{min-height:44px;padding:0 22px;border-radius:16px;background:#111;color:#fff;font-size:15px;font-weight:600}`;
  const repos = ecran(p, { extraTop: btn });
  return {
    css, shots: [
      ['repos', 'Repos : novembre ; le calendrier à côté du mois', repos],
      ['feuille', 'Le calendrier : toucher le 1er, puis le 15', ecran(p, { extraTop: btn }, feuille)],
      ['apres', 'Après « Voir » : la pilule devient la plage, × revient au mois', ecran(p, { pill: pillPlage, aPayer: 0, plage: true })],
    ],
  };
};

// ---------- s2c : frise des 12 mois, un mois touché zoome sur ses jours ----------
V.s2c = () => {
  const p = 's2c';
  const MO = ['D', 'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N'];
  const an = (sel) => `<div class="s2c-yr" data-booster="frise-12-mois">${MO.map((m, i) => {
    const bar = i === 0 ? `<i class="s2c-b" style="height:4px;background:repeating-linear-gradient(135deg,#D6453D 0 3px,#FDECEA 3px 6px)"></i>`
      : i === 11 ? `<i class="s2c-b" style="height:26px"><i class="s2c-hat" style="flex:400"></i><i style="flex:297;background:#5B5B5B"></i></i>`
        : `<i class="s2c-nd"></i>`;
    return `<button class="s2c-mo${i === 1 ? ' s2c-an' : ''}${sel.includes(i) ? ' s2c-cur' : ''}" aria-label="${['déc. 2025', 'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.'][i]}">${bar}<span>${m}</span></button>`;
  }).join('')}</div>`;
  const repos = ecran(p, { avant: an([11]) });
  // zoom : octobre et novembre, 61 jours ; début posé au 15 oct., le doigt glisse au 10 nov.
  const OCTNOV = {}; for (const [d, s] of Object.entries(NOV)) OCTNOV[31 + Number(d)] = s;
  const zoom = `<div class="s2c-zm" data-booster="frise-zoom-jours">
    <div class="s2c-ml"><b>15 oct. → <span class="s2c-live">mar. 10 nov.</span></b><button class="s2c-un">‹ 12 mois</button></div>
    <div class="s2c-tr">
     <span class="s2c-sel" style="left:${pc(14, 61)};width:${pc(41 - 14, 61)}"></span>
     <span class="s2c-mid" style="left:${pc(31, 61)}"></span>
     <div class="s2c-days">${jours(p, 61, { maxH: 30, data: OCTNOV, vente: 40 })}</div>
     <span class="s2c-pin" style="left:${pc(14, 61)}"></span>
     <span class="s2c-touch" style="left:${pc(40.5, 61)}"></span>
    </div>
    ${ax(p, [[3, 'oct.'], [15, '15', 'sb'], [33, 'nov.'], [40, 'auj. 9', 'auj'], [56, '25']])}
   </div>`;
  const zoomEcran = ecran(p, { avant: zoom });
  const L = (10 + 14 / 31) / 12, R = (11 + 10 / 30) / 12;
  const apresBande = `<div class="s2c-rd"><b>15 oct. → 10 nov.</b><span>27 jours</span><button class="s2c-x" aria-label="Revenir au mois">× mois</button></div>
   <div style="position:relative">${an([])}<span class="s2c-br" style="left:${(L * 100).toFixed(2)}%;width:${((R - L) * 100).toFixed(2)}%"></span></div>`;
  const tete = `<div class="s2c-none">du 15 au 31 oct. · aucune opération</div>`;
  const apres = ecran(p, { avant: apresBande, aPayer: 0, plage: true, tete });
  const css = cssJours(p, 61, 30) + `
.s2c-yr{display:grid;grid-template-columns:repeat(12,1fr);gap:2px;margin-top:6px}
.s2c-mo{height:46px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px;border-radius:10px;border:1.5px solid transparent;padding-bottom:2px}
.s2c-mo span{font-size:12px;line-height:14px;color:#555}
.s2c-an{box-shadow:inset 1px 0 0 #D6D0C2;border-radius:0}
.s2c-b{width:13px;border-radius:3px 3px 1px 1px;display:flex;flex-direction:column;overflow:hidden}
.s2c-b i{display:block}
.s2c-nd{width:13px;border-top:2px dotted #C9C4B8}
.s2c-cur{background:#fff;border-color:#111}
.s2c-cur span{color:#111;font-weight:700}
.s2c-br{position:absolute;top:0;height:30px;border:2px solid #2F6EA8;border-radius:5px;background:rgba(47,110,168,.16);pointer-events:none}
.s2c-rd{display:flex;align-items:center;gap:6px;min-height:28px;margin-top:6px;font-size:12px;color:#555}
.s2c-rd b{font-size:15px;color:#111}
.s2c-x{margin-left:auto;min-height:24px;padding:0 9px;border-radius:16px;border:1px solid #D9D9D9;background:#fff;font-size:12px;color:#444}
.s2c-zm{margin:6px 2px 0;background:#fff;border:1.5px solid #111;border-radius:12px;padding:4px 6px 2px}
.s2c-ml{display:flex;align-items:center;height:28px;font-size:15px}
.s2c-live{background:#111;color:#fff;border-radius:8px;padding:0 6px}
.s2c-un{margin-left:auto;min-height:24px;padding:0 8px;border-radius:16px;border:1px solid #D9D9D9;font-size:12px;color:#444;background:#fff}
.s2c-tr{position:relative;height:40px;padding-top:6px;border-bottom:1.5px solid #111}
.s2c-sel{position:absolute;top:0;bottom:0;background:#DCE8F5}
.s2c-mid{position:absolute;top:0;bottom:0;border-left:1px dashed #9A9A9A}
.s2c-pin{position:absolute;top:0;bottom:-2px;border-left:2px solid #111;z-index:2}
.s2c-pin b{position:absolute;bottom:2px;left:3px;font-size:12px;background:#111;color:#fff;border-radius:8px;padding:0 5px;line-height:18px;white-space:nowrap}
.s2c-touch{position:absolute;top:2px;width:40px;height:40px;margin-left:-20px;border-radius:50%;background:rgba(17,17,17,.16);box-shadow:0 0 0 2px rgba(17,17,17,.35);z-index:3}
.s2c-bub{position:absolute;top:-38px;transform:translateX(-50%);background:#111;color:#fff;font-size:14px;font-weight:600;border-radius:10px;padding:3px 10px;white-space:nowrap;z-index:4}
.s2c-bub::after{content:"";position:absolute;left:50%;bottom:-5px;margin-left:-5px;border:5px solid transparent;border-bottom:0;border-top-color:#111}
.s2c-none{margin:6px 10px 0;padding:3px 8px;border:1px dashed #C9C4B8;border-radius:10px;font-size:12px;color:#555}`;
  return {
    css, shots: [
      ['repos', 'Repos : la frise des 12 mois, novembre entouré', repos],
      ['zoom', 'Novembre touché : la frise s’ouvre sur ses jours (et octobre) ; début au 15 oct., le doigt glisse au 10 nov.', zoomEcran],
      ['apres', 'Après : plage à cheval, du 15 oct. au 10 nov.', apres],
    ],
  };
};

// ---------- s2d : brush — l'histogramme du mois est le sélecteur, les piles suivent ----------
V.s2d = () => {
  const p = 's2d';
  const hist = (win) => `<div class="s2d-hs" data-booster="brush-jours">
    <div class="s2d-lb">${win ? '' : `<span class="s2d-hint"><svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#555" stroke-width="1.6"><rect x="3" y="1" width="10" height="10" rx="2" stroke-dasharray="2 1.6"/><path d="M1 6h3M12 6h3"/></svg>glisser sur les jours</span>`}</div>
    <div class="s2d-tr">
     ${win ? `<span class="s2d-bg" style="left:${pc(win[0] - 1, 30)};width:${pc(win[1] - win[0] + 1, 30)}"></span>` : ""}
     ${[1, 8, 15, 22, 29].map((d) => `<i class="s2d-wk" style="left:${pc(d, 30)}"></i>`).join('')}
     <div class="s2d-days">${jours(p, 30, { maxH: 36, dim: (d) => win && (d < win[0] || d > win[1]) })}</div>
     ${win ? `<span class="s2d-win" style="left:${pc(win[0] - 1, 30)};width:${pc(win[1] - win[0] + 1, 30)}" role="slider" aria-label="Fenêtre de jours"><i class="s2d-e" style="left:-6px"></i><i class="s2d-e" style="right:-6px"></i><span class="s2d-tab"><b>lun. 9 → dim. 15 nov.</b><button aria-label="Revenir au mois">×</button></span></span>` : ''}
    </div>
    ${ax(p, [[2, 'lun. 2'], [9, 'auj. 9', 'auj'], [16, '16'], [23, '23'], [30, '30']])}
   </div>`;
  const css = cssJours(p, 30, 36) + `
.s2d-hs{margin:4px 4px 2px}
.s2d-lb{position:relative;height:30px;display:flex;align-items:center}
.s2d-hint{display:flex;align-items:center;gap:5px;font-size:12px;color:#555}
.s2d-tr{position:relative;height:42px;padding-top:4px;border-bottom:1.5px solid #111}
.s2d-bg{position:absolute;top:0;bottom:0;background:#DCE8F5;border-radius:8px}
.s2d-wk{position:absolute;top:4px;bottom:0;border-left:1px solid #E6E1D5}
.s2d-win{position:absolute;top:-2px;bottom:-4px;border:2px solid #111;border-radius:8px;background:none;z-index:2}
.s2d-e{position:absolute;top:50%;width:8px;height:22px;margin-top:-11px;border-radius:4px;background:#111}
.s2d-tab{position:absolute;bottom:100%;left:50%;transform:translate(-50%,-4px);display:flex;align-items:center;gap:2px;min-height:26px;padding:0 0 0 10px;border-radius:16px;background:#111;color:#fff;font-size:13px;white-space:nowrap}
.s2d-tab button{width:26px;height:26px;border-radius:50%;color:#fff;font-size:16px}
.s2d-gh{display:flex;flex-direction:column;justify-content:flex-end;border:1.5px dashed #A79F8C;border-bottom:0;border-radius:10px 6px 0 0}
.s2d-gh .s2d-st{border-radius:2px}`;
  const repos = ecran(p, { avant: hist(null) });
  const apres = ecran(p, { avant: hist([9, 15]), aPayer: 0, plage: true, ghost: true });
  return { css, shots: [['repos', 'Repos : l’histogramme des jours au-dessus des piles', repos], ['apres', 'Après : la semaine du 9 au 15 glissée ; les piles suivent, le mois en pointillé', apres]] };
};

// ---------- page ----------
function page(id) {
  const { css, shots } = V[id]();
  const p = id;
  const frameCss = `
body{background:#ECECEC}
.${p}-shot{margin:0 0 20px}
.${p}-shot figcaption{font-size:14px;line-height:20px;padding:10px 10px 6px;color:#333;font-weight:600}
.${p}-frame{position:relative;width:390px;height:844px;overflow:hidden;background:#fff;margin:0}
.${p}-frame .${p}-nav,.${p}-frame .${p}-fab{position:absolute}
.${p}-frame .${p}-app{padding-bottom:0}
.${p}-frame .${p}-g{position:static}
.${p}-ref img{display:block;width:390px;height:auto}
.${p}-hors{display:grid;grid-template-columns:auto 1fr auto;gap:6px;align-items:center;min-height:26px;padding:2px 10px 2px 22px;border-bottom:1px solid #F0F0F0;font-size:12px;color:#666}
.${p}-hors b{font-size:13px;color:#8A8A8A;font-weight:500}
.${p}-hp{border:1px dashed #BDBDBD;border-radius:999px;padding:0 6px;line-height:16px;color:#555}`;
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${id} · Opérations v6a + plage du … au … (mini maquette statique)</title>
<link rel="stylesheet" href="../fonts/fonts.css">
<style>${pre(STYLE, p)}${frameCss}${css}</style>
</head>
<body>
${shots.map(([k, cap, html]) => `<figure class="${p}-shot" data-shot="${k}"><figcaption>${cap}</figcaption>\n${html}\n</figure>`).join('\n')}
<figure class="${p}-shot ${p}-ref"><figcaption>Aujourd’hui en ligne : « … » ouvre des mois, pas des jours</figcaption><img src="../../../analyse/cap/ops-plage-390-clair.png" alt="Opérations en ligne, plage par mois"></figure>
</body>
</html>`;
}

await polices();
for (const id of Object.keys(V)) {
  mkdirSync(join(VOIE, id), { recursive: true });
  writeFileSync(join(VOIE, id, 'etat.html'), page(id));
}
console.log('construit :', Object.keys(V).join(', '));
