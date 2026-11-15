// Passe 2 (p2b) : s3bp2 et s3cp2, refaites depuis ref/v6a/etat.html (base telle quelle), défauts du critique corrigés, greffes posées.
// Assemblage par split/join et indices (L26) ; préfixe v6a- -> <id>- en dernier.
// Usage (racine du dépôt) : node work/missions/2026-11-14-finances/voies/p2b/_outils/fabriquer.mjs [s3bp2,s3cp2]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const ICI = dirname(fileURLToPath(import.meta.url));
const VOIE = resolve(ICI, '..');
const RACINE = resolve(VOIE, '../../../../..');
const REF = readFileSync(join(VOIE, '../../ref/v6a/etat.html'), 'utf8').replace(/\r\n/g, '\n');

const entre = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error('absent : ' + a); return [i, j]; };
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error('absent : ' + a.slice(0, 60)); return s.split(a).join(b); };
const tranche = (s, a, b, avecB = true) => { const [i, j] = entre(s, a, b); return s.slice(i, avecB ? j + b.length : j); };

const CSS = tranche(REF, '<style>', '</style>').replace('<style>', '').replace('</style>', '');
const HEADER = tranche(REF, '<header class="v6a-hd">', '</header>');
const TABS = tranche(REF, '<nav class="v6a-tabs"', '</nav>');
const BAND = tranche(REF, '<section class="v6a-band"', '</section>');
const LISTE = tranche(REF, '<div data-mots="lignes"', '<section class="v6a-annex"', false).trimEnd() + '\n </div>';
const NAV = tranche(REF, '<nav class="v6a-nav"', '</nav>') + '\n' + tranche(REF, '<button class="v6a-fab"', '</button>');
const TOP = tranche(BAND, '<div class="v6a-top">', '<div class="v6a-piles">', false);
const PILL = tranche(BAND, '<span class="v6a-pill">', '</span>');
const DUE = tranche(BAND, '<button class="v6a-due"', '</button>');
const LOYER = tranche(LISTE, '<div class="v6a-op">\n   <span class="v6a-bar v6a-hat"></span>', '</div>');

const avecTop = (band, top) => rep(band, TOP, top);
const finBande = (band, html) => band.replace(/<\/section>$/, html + '\n  </section>');

// Plage qui laisse le loyer (25 nov.) dehors : Fixes 68,00 ; payé 325,40 ; à payer 0,00 ; dépensé 296,80 (matériel à part, comme v6a).
const plage = (s) => {
  s = rep(s, '<b class="v6a-m">468,00</b><span class="v6a-st" style="height:57px"><i class="v6a-hat" style="flex:400"></i><i style="flex:68;background:#9856D2"></i></span>',
    '<b class="v6a-m">68,00</b><span class="v6a-st" style="height:8px"><i style="flex:1;background:#9856D2"></i></span>');
  s = rep(s, 'à payer <b class="v6a-m">400,00</b>', 'à payer <b class="v6a-m">0,00</b>');
  s = rep(s, 'dépensé <b class="v6a-m">696,80</b>', 'dépensé <b class="v6a-m">296,80</b>');
  return s;
};
// Le loyer reste visible à sa place, sous Charges fixes, en ligne « hors plage » (gris, 400,00 non mis à 0).
const HORS = `<div class="v6a-hp" data-booster="hors-plage">
   <span class="v6a-bar v6a-hat"></span>
   <span class="v6a-hq">Loyer de l'atelier <small>· à payer 25 nov.</small></span><span class="v6a-ha v6a-m">400,00</span>
   <span class="v6a-htag">hors plage</span>
  </div>`;
const listePlage = (s) => {
  s = rep(s, '<b>Charges fixes</b><span class="v6a-sub v6a-m">468,00</span>', '<b>Charges fixes</b><span class="v6a-sub v6a-m">68,00</span>');
  s = rep(s, LOYER, '');
  // la ligne hors plage ferme le groupe Charges fixes (après Électricité)
  const elec = tranche(s, '<div class="v6a-op">\n   <span class="v6a-bar" style="background:#9856D2"></span>', '</div>');
  s = rep(s, elec, elec + '\n  ' + HORS);
  return rep(s, '✦ Pourquoi les charges fixes pèsent autant ?', '✦ Pourquoi le brassage pèse autant ?');
};

const ecran = (nom, titre, { header = HEADER, band, liste = LISTE, sur = '' }) => `
<section class="v6a-ecran" data-ecran="${nom}">
<p class="v6a-lab">${titre}</p>
${header}
<div class="v6a-app">
 <div class="v6a-full">
  ${TABS}
 </div>
 <div class="v6a-left">
  ${band}
 </div>
 ${liste}
</div>
${sur}
</section>`;

const ICAL = (t = 16) => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>`;
const LOUPE = (t = 16, c = 'currentColor') => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></svg>`;
// Couleurs des catégories de v6a (piles et légende « payé »)
const CAT9 = 'linear-gradient(90deg,#56D27B 0 20%,#9856D2 20% 40%,#D2B356 40% 60%,#56C1D2 60% 80%,#567BD2 80%)';

const COMMUN_CSS = `
.v6a-ecran{position:relative}
.v6a-lab{font:600 13px/18px "Source Sans 3",system-ui,sans-serif;color:#2F6EA8;padding:14px 10px 6px;border-top:6px solid #EBEBEB}
.v6a-ecran:first-of-type .v6a-lab{border-top:0}
.v6a-band{position:relative}
.v6a-hid{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer}
.v6a-planche{padding:16px 10px 90px;border-top:6px solid #EBEBEB}
.v6a-planche h2{font-size:13px;font-weight:600;color:#2F6EA8;margin-bottom:8px}
.v6a-planche>div{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}
.v6a-planche img{width:100%;border:1px solid #DADADA;border-radius:10px;display:block}
.v6a-planche figcaption{font-size:12px;color:#555;padding:2px 2px 0}
html[data-vue] .v6a-ecran:not(.v6a-vis),html[data-vue] .v6a-planche,html[data-vue] .v6a-lab{display:none}
/* ligne « hors plage » : à sa place, grise, montant gardé */
.v6a-hp{display:grid;grid-template-columns:4px 1fr auto;column-gap:8px;padding:3px 10px 4px;border-bottom:1px solid #F0F0F0;align-items:center;background:#FBFAF7}
.v6a-hp .v6a-bar{opacity:.45}
.v6a-hq{font-size:13px;font-weight:600;color:#6F6A5E;line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.v6a-hq small{font-weight:400;font-size:12px}
.v6a-ha{font-size:13px;color:#6F6A5E;text-align:right;font-weight:500}
.v6a-htag{grid-column:2;justify-self:start;font-size:12px;line-height:16px;color:#5E594E;border:1px solid #D6D0C1;border-radius:999px;padding:0 6px;background:#fff}
/* calendrier à plage (forme react-day-picker, mode range) */
.v6a-pop{position:absolute;left:0;right:0;top:38px;background:#fff;border:1px solid #DADADA;border-radius:16px;box-shadow:0 10px 28px rgba(0,0,0,.18);padding:8px 8px 8px;z-index:3}
.v6a-pop::before{content:"";position:absolute;top:-7px;left:var(--ax,150px);width:12px;height:12px;background:#fff;border-left:1px solid #DADADA;border-top:1px solid #DADADA;transform:rotate(45deg)}
.v6a-calh{display:flex;align-items:center;gap:6px;height:32px;margin-top:4px}
.v6a-calh b{flex:1;text-align:center;font-size:14px;font-weight:600}
.v6a-calh button{width:32px;height:32px;border-radius:50%;font-size:17px;background:#F5F5F5}
.v6a-grid{display:grid;grid-template-columns:repeat(7,1fr);row-gap:2px}
.v6a-dw{font-size:12px;color:#555;text-align:center;line-height:18px}
.v6a-d{position:relative;height:38px;display:grid;place-items:center;font-size:14px;color:#111}
.v6a-d b{position:relative;z-index:1;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-weight:400;margin-bottom:2px}
.v6a-d.v6a-in{background:#E6EFF8}
.v6a-d.v6a-l{border-radius:19px 0 0 19px}.v6a-d.v6a-r{border-radius:0 19px 19px 0}.v6a-d.v6a-l.v6a-r{border-radius:19px}
.v6a-d.v6a-end b{background:#2F6EA8;color:#fff;font-weight:600}
.v6a-d.v6a-auj b{box-shadow:inset 0 0 0 1.5px #111;font-weight:600}
.v6a-d.v6a-end.v6a-auj b{box-shadow:inset 0 0 0 2px #fff,0 0 0 1.5px #111}
.v6a-d.v6a-out{color:#736E62}
.v6a-d i{position:absolute;bottom:1px;left:50%;height:4px;border-radius:2px;z-index:2;transform:translateX(-50%)}
.v6a-d i.v6a-k9{width:20px;background:${CAT9}}
.v6a-d i.v6a-k25{width:16px;height:5px}
`;

// Grille de novembre 2026 (le 1er est un dimanche ; semaine du lundi). a..b = plage ; auj = 9.
const grille = (a, b) => {
  const j = [];
  for (let k = 0; k < 6; k++) j.push('<span class="v6a-d"></span>');
  for (let d = 1; d <= 30; d++) {
    const col = (d + 5) % 7; // 0 = lundi
    const c = ['v6a-d'];
    if (d >= a && d <= b) { c.push('v6a-in'); if (col === 0 || d === a) c.push('v6a-l'); if (col === 6 || d === b) c.push('v6a-r'); }
    else c.push('v6a-out');
    if (d === a || d === b) c.push('v6a-end');
    if (d === 9) c.push('v6a-auj');
    const mk = d === 9 ? '<i class="v6a-k9" title="5 opérations payées"></i>' : d === 25 ? '<i class="v6a-k25 v6a-hat" title="à payer"></i>' : '';
    j.push(`<span class="${c.join(' ')}"><b>${d}</b>${mk}</span>`);
  }
  return `<div class="v6a-calh"><button aria-label="Mois précédent">‹</button><b>novembre 2026</b><button aria-label="Mois suivant">›</button></div>
    <div class="v6a-grid">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((x) => `<span class="v6a-dw">${x}</span>`).join('')}${j.join('')}</div>`;
};

// ---------- s3bp2 : la phrase aux dates touchables ----------
const s3bp2 = () => {
  const css = `
.v6a-top>*{flex:none;white-space:nowrap}
.v6a-dda{position:relative;display:flex;align-items:center;gap:2px;min-height:28px;padding:0 7px;line-height:16px;border-radius:16px;border:1px dashed #A9A291;font-size:13px;color:#444;background:transparent}
.v6a-dda u{display:inline-block;width:9px;height:12px;border-bottom:2px solid #A9A291;margin:0 2px}
.v6a-dda::after{content:"";position:absolute;inset:-8px -3px}
.v6a-dda.v6a-sel{background:#E6EFF8;border:1px solid #2F6EA8;color:#1F4E7A}
.v6a-dda.v6a-sel u{border-color:#2F6EA8}
.v6a-phr{display:flex;align-items:center;gap:4px;font-size:14px;color:#555;min-height:36px;padding:0 2px}
.v6a-w{position:relative;padding:2px 6px;border-radius:8px;background:#E6EFF8;color:#1F4E7A;font-weight:600;line-height:20px;box-shadow:inset 0 0 0 1px #A9C9E8}
.v6a-w::after{content:"";position:absolute;inset:-8px -3px}
.v6a-w.v6a-foc{box-shadow:inset 0 0 0 2px #2F6EA8}
.v6a-dur{margin-left:auto;font-size:12px;color:#555}
.v6a-dur b{color:#111}
.v6a-calf{display:flex;align-items:center;gap:8px;margin-top:6px;padding-top:8px;border-top:1px solid #F0F0F0}
.v6a-fx{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;font-size:12px;color:#444;line-height:16px}
.v6a-fx b{color:#111;font-size:13px}
.v6a-fx .v6a-so{display:flex;align-items:center;gap:4px;color:#5E594E}
.v6a-fx .v6a-so i{width:13px;height:11px;border-radius:3px;display:inline-block}
.v6a-go{flex:none;min-height:44px;padding:0 16px;border-radius:16px;background:#111;color:#fff;font-size:14px;font-weight:600}
.v6a-pp{background:#E6EFF8;border-color:#A9C9E8}
.v6a-pp button{color:#1F4E7A;position:relative}
.v6a-pp button::after{content:"";position:absolute;inset:-8px -2px}
.v6a-ph{display:flex;align-items:baseline;gap:4px;font-size:13px;color:#4A5A6A;padding:0 2px}
.v6a-ph u{text-decoration:none;font-size:15px;font-weight:600;color:#1F4E7A;border-bottom:2px dashed #2F6EA8;line-height:19px;position:relative}
.v6a-ph u::after{content:"";position:absolute;inset:-12px -3px}
.v6a-r2{display:flex;align-items:center;gap:6px;margin-top:5px;font-size:12px;color:#555;min-height:28px}
.v6a-r2 b{color:#111;font-size:13px}
.v6a-x{position:relative;margin-left:auto;display:flex;align-items:center;gap:4px;min-height:28px;padding:0 10px;border-radius:16px;border:1px solid #D9D9D9;background:#fff;font-size:13px;color:#444}
.v6a-x::after{content:"";position:absolute;inset:-8px -2px}
.v6a-x span{font-size:16px;line-height:1}
`;
  const puce = (sel) => `<button class="v6a-dda${sel ? ' v6a-sel' : ''}" data-booster="du-au" aria-label="Choisir une période du … au …"${sel ? ' aria-expanded="true"' : ''}>du<u></u>au<u></u></button>`;
  const top = (sel) => `<div class="v6a-top">
    ${PILL}
    ${puce(sel)}
    ${DUE}
   </div>
   `;
  const pop = `<div class="v6a-pop" role="dialog" aria-label="Période" data-booster="calendrier-plage" style="--ax:172px">
    <div class="v6a-phr" data-booster="phrase-editable">du <button class="v6a-w">1er nov.<input class="v6a-hid" type="date" value="2026-11-01" aria-label="Premier jour"></button> au <button class="v6a-w v6a-foc">15 nov.<input class="v6a-hid" type="date" value="2026-11-15" aria-label="Dernier jour"></button><span class="v6a-dur"><b class="v6a-m">15</b> j</span></div>
    ${grille(1, 15)}
    <div class="v6a-calf" data-booster="apercu-effet">
     <div class="v6a-fx"><span><b class="v6a-m">5</b> opérations · à payer <b class="v6a-m">0,00</b> · dépensé <b class="v6a-m">296,80</b></span><span class="v6a-so"><i class="v6a-hat"></i>hors plage : loyer <b class="v6a-m">400,00</b> · 25 nov.</span></div>
     <button class="v6a-go">Voir</button>
    </div>
   </div>`;
  const topApres = `<div class="v6a-top">
    <span class="v6a-pill v6a-pp" data-booster="phrase-editable"><button aria-label="15 jours plus tôt : 17 → 31 oct.">‹</button><span class="v6a-ph">du <u>1er</u> au <u>15 nov.</u></span><button aria-label="15 jours plus tard : 16 → 30 nov.">›</button></span>
    ${DUE}
   </div>
   <div class="v6a-r2"><span><b class="v6a-m">15</b> j · <b class="v6a-m">5</b> opérations</span><button class="v6a-x" aria-label="Revenir à tout novembre"><span>×</span>novembre</button></div>
   `;
  const repos = avecTop(BAND, top(false));
  const ouvert = finBande(avecTop(BAND, top(true)), pop);
  const apres = avecTop(plage(BAND), topApres);
  return { css, vues: ['repos', 'ouvert', 'apres'], corps:
    ecran('repos', 'Repos : v6a, et la seule puce « du … au » à côté du mois', { band: repos }) +
    ecran('ouvert', 'Puce touchée : la phrase « du … au … » et son calendrier ; 1er puis 15 touchés, l’effet se lit avant « Voir »', { band: ouvert }) +
    ecran('apres', 'Après « Voir » : la phrase prend la place du mois, ‹ › font glisser la plage de 15 j, × revient à novembre', { band: apres, liste: listePlage(LISTE) }) };
};

// ---------- s3cp2 : la loupe comprend une période ; l'icône calendrier pour qui ne tape pas ----------
const s3cp2 = () => {
  const css = `
.v6a-top>*{flex:none;white-space:nowrap}
.v6a-cb{position:relative;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#fff;border:1px solid #E4E0D6;color:#2F6EA8}
.v6a-cb::after{content:"";position:absolute;inset:-6px}
.v6a-cb.v6a-sel{background:#2F6EA8;border-color:#2F6EA8;color:#fff}
.v6a-tf{display:flex;align-items:center;gap:6px;height:32px;padding:0 10px;border-radius:10px;border:1px solid #DADADA;background:#FAFAFA;font-size:14px;color:#555}
.v6a-tf svg{color:#2F6EA8;flex:none}
.v6a-tf kbd{font:inherit;color:#1F4E7A;background:#E6EFF8;border-radius:4px;padding:0 3px}
.v6a-calf{display:flex;align-items:center;gap:8px;margin-top:6px;padding-top:8px;border-top:1px solid #F0F0F0;font-size:13px;color:#444}
.v6a-calf b{color:#111}
.v6a-go{margin-left:auto;flex:none;min-height:44px;padding:0 16px;border-radius:16px;background:#111;color:#fff;font-size:14px;font-weight:600}
.v6a-tok{display:flex;align-items:center;gap:2px;border-radius:16px;padding:1px;background:#E6EFF8;border:1px solid #A9C9E8;color:#1F4E7A}
.v6a-tok button{position:relative;width:28px;height:28px;border-radius:50%;font-size:17px;color:#1F4E7A}
.v6a-tok button::after{content:"";position:absolute;inset:-8px -2px}
.v6a-tok span{display:flex;align-items:center;gap:4px;font-size:15px;font-weight:600;padding:0 2px}
.v6a-xx{position:relative;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#fff;border:1px solid #D9D9D9;font-size:17px;color:#444}
.v6a-xx::after{content:"";position:absolute;inset:-8px -3px}
.v6a-r2{display:flex;align-items:center;gap:5px;margin-top:5px;font-size:12px;color:#555;min-height:20px}
.v6a-r2 b{color:#111;font-size:13px}
.v6a-r2 i{width:13px;height:11px;border-radius:3px;display:inline-block}
.v6a-srch{gap:6px}
.v6a-fld{flex:1;display:flex;align-items:center;gap:6px;height:38px;padding:0 10px;border-radius:12px;border:2px solid #2F6EA8;background:#fff;font-size:16px}
.v6a-fld em{font-style:normal;background:#E6EFF8;border-radius:4px;padding:0 2px;color:#1F4E7A}
.v6a-car{width:2px;height:20px;background:#2F6EA8;margin-left:-4px}
.v6a-sc{position:absolute;left:0;right:0;top:52px;bottom:0;background:rgba(17,17,17,.32);z-index:3}
.v6a-sug{position:absolute;left:0;right:0;top:52px;background:#fff;border-bottom:1px solid #DADADA;box-shadow:0 12px 24px rgba(0,0,0,.16);z-index:4;padding:6px 10px 6px}
.v6a-s1{display:grid;grid-template-columns:28px 1fr auto;gap:2px 8px;align-items:center;width:100%;text-align:left;padding:8px;border-radius:12px;background:#F2F7FC;border:1px solid #A9C9E8}
.v6a-s1 .v6a-ic2{width:28px;height:28px;border-radius:8px;background:#2F6EA8;color:#fff;display:grid;place-items:center;grid-column:1;grid-row:1/4}
.v6a-s1 b{font-size:15px;grid-column:2;grid-row:1;line-height:18px}
.v6a-s1 kbd{grid-column:3;grid-row:1/4;font:600 14px "Source Sans 3",sans-serif;background:#111;color:#fff;border-radius:16px;padding:0 16px;min-height:44px;display:grid;place-items:center}
.v6a-fr{grid-column:2;grid-row:2;height:14px;margin-top:4px;display:grid;grid-template-columns:repeat(30,1fr);gap:1px}
.v6a-fr span{background:#E4E0D6;border-radius:1px}
.v6a-fr span.v6a-x2{background:#9DBEDD}
.v6a-fr span.v6a-op9{background:linear-gradient(180deg,#56D27B 0 20%,#9856D2 20% 40%,#D2B356 40% 60%,#56C1D2 60% 80%,#567BD2 80%)}
.v6a-fr span.v6a-op25{background:repeating-linear-gradient(135deg,#E3B55D 0 3px,#FCEFD2 3px 6px)}
.v6a-s1 small{grid-column:2;grid-row:3;font-size:12px;color:#444;line-height:16px;margin-top:2px}
.v6a-s2{display:flex;align-items:center;gap:8px;min-height:36px;padding:0 8px;font-size:14px;color:#444;border-bottom:1px solid #F0F0F0}
.v6a-s3{display:flex;align-items:center;justify-content:space-between;min-height:32px;padding:0 8px;font-size:12px;color:#555}
.v6a-s3 button{position:relative;font-size:13px;color:#2F6EA8;padding:4px 0}
.v6a-s3 button::after{content:"";position:absolute;inset:-6px -4px}
`;
  const cb = (sel) => `<button class="v6a-cb${sel ? ' v6a-sel' : ''}" data-booster="du-au" aria-label="Choisir une période du … au …"${sel ? ' aria-expanded="true"' : ''}>${ICAL(16)}</button>`;
  const top = (sel) => `<div class="v6a-top">
    ${PILL}
    ${cb(sel)}
    ${DUE}
   </div>
   `;
  const pop = `<div class="v6a-pop" role="dialog" aria-label="Période" data-booster="calendrier-plage" style="--ax:155px">
    <label class="v6a-tf" data-booster="recherche-periode">${LOUPE(16)}<span>ou tapez <kbd>3-17 nov.</kbd></span><input class="v6a-hid" type="text" inputmode="text" aria-label="Taper une période"></label>
    ${grille(3, 17)}
    <div class="v6a-calf"><span>mar. 3 → mar. 17 nov. · <b class="v6a-m">15</b> j</span><button class="v6a-go">Poser</button></div>
   </div>`;
  const topApres = `<div class="v6a-top">
    <span class="v6a-tok" data-booster="pastille-periode"><button aria-label="15 jours plus tôt : 19 oct. → 2 nov.">‹</button><span>${ICAL(15)}3 → 17 nov.</span><button aria-label="15 jours plus tard : 18 nov. → 2 déc.">›</button></span>
    <button class="v6a-xx" aria-label="Retirer la période, revenir à novembre">×</button>
    ${DUE}
   </div>
   <div class="v6a-r2"><span><b class="v6a-m">5</b> opérations · <i class="v6a-hat"></i> loyer du 25 hors plage</span></div>
   `;
  const frise = Array.from({ length: 30 }, (_, k) => { const d = k + 1; const c = d === 9 ? 'v6a-op9' : d === 25 ? 'v6a-op25' : d >= 3 && d <= 17 ? 'v6a-x2' : ''; return `<span${c ? ` class="${c}"` : ''}></span>`; }).join('');
  const HDR = `<header class="v6a-hd v6a-srch">
  <button class="v6a-ic" aria-label="Fermer la recherche"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg></button>
  <div class="v6a-fld" data-booster="recherche-periode">${LOUPE(18, '#2F6EA8')}<em>3-17 nov.</em><span class="v6a-car"></span></div>
  <button class="v6a-ic v6a-bx" aria-label="Effacer">×</button>
</header>`;
  const sur = `<div class="v6a-sc"></div><div class="v6a-sug">
  <button class="v6a-s1"><span class="v6a-ic2">${ICAL(16)}</span><b>Période : du mar. 3 au mar. 17 nov.</b><kbd>Poser</kbd><span class="v6a-fr" aria-hidden="true">${frise}</span><small>5 opérations · loyer du 25 hors plage</small></button>
  <div class="v6a-s2">${LOUPE(16)}Texte « 3-17 nov. » · aucune opération</div>
  <div class="v6a-s3"><span>Une période se tape comme on la dit.</span><button aria-expanded="false">exemples ⌄</button></div>
</div>`;
  const repos = avecTop(BAND, top(false));
  const cal = finBande(avecTop(BAND, top(true)), pop);
  const apres = avecTop(plage(BAND), topApres);
  return { css, vues: ['repos', 'calendrier', 'loupe', 'apres'], corps:
    ecran('repos', 'Repos : v6a, et la seule icône calendrier (32 px) à côté du mois', { band: repos }) +
    ecran('calendrier', 'Icône touchée : le calendrier à plage ; 3 puis 17 touchés ; la loupe y reste en raccourci', { band: cal }) +
    ecran('loupe', 'Chemin bis : la loupe lit « 3-17 nov. » comme une période', { band: repos, header: HDR, sur }) +
    ecran('apres', 'Après « Poser » : la période en pastille, ‹ › la font glisser de 15 j, × revient à novembre', { band: apres, liste: listePlage(LISTE) }) };
};

const VARIANTES = { s3bp2, s3cp2 };
const TITRES = { s3bp2: 's3bp2 · la phrase aux dates touchables (passe 2)', s3cp2: 's3cp2 · la loupe comprend une période (passe 2)' };
const page = (id) => {
  const v = VARIANTES[id]();
  const imgs = [...v.vues, 'page'];
  const planche = `<section class="v6a-planche"><h2>Les images, côte à côte</h2><div>${imgs.map((x) => `<figure><img src="${id}-${x}.png" alt="${id} ${x}"><figcaption>${x === 'page' ? 'après, page entière' : x}</figcaption></figure>`).join('')}</div></section>`;
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${TITRES[id]} · Opérations v6a, filtre du … au … · mission 2026-11-14-finances</title>
<link rel="stylesheet" href="../fonts/fonts.css">
<style>${CSS}${COMMUN_CSS}${v.css}</style>
</head>
<body>
${v.corps}
${planche}
${NAV}
<script>(function(){var v=new URLSearchParams(location.search).get('vue');if(!v)return;document.documentElement.setAttribute('data-vue',v);var e=document.querySelector('[data-ecran="'+v+'"]');if(e)e.classList.add('v6a-vis');})();</script>
</body>
</html>
`;
  return { html: html.split('v6a-').join(id + '-'), vues: v.vues };
};

const ids = process.argv[2] ? process.argv[2].split(',') : Object.keys(VARIANTES);
const require = createRequire(join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
try {
  for (const id of ids) {
    const { html, vues } = page(id);
    mkdirSync(join(VOIE, id), { recursive: true });
    const f = join(VOIE, id, 'etat.html');
    writeFileSync(f, html);
    const p = await nav.newPage();
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    for (const vue of [...vues, 'page']) {
      await p.goto('file:///' + f.split('\\').join('/') + '?vue=' + (vue === 'page' ? 'apres' : vue), { waitUntil: 'load' });
      await p.evaluate(() => document.fonts.ready);
      const m = await p.evaluate((pre) => {
        const top = document.querySelector('.' + pre + 'vis .' + pre + 'top');
        const r = top ? [...top.children].map((c) => Math.round(c.getBoundingClientRect().width)) : [];
        return { debord: document.documentElement.scrollWidth - innerWidth, top: r, topW: top ? Math.round(top.getBoundingClientRect().width) : 0 };
      }, id + '-');
      if (vue === "page") await p.addStyleTag({ content: "." + id + "-nav,." + id + "-fab{display:none!important}" });
      await p.screenshot({ path: join(VOIE, id, `${id}-${vue}.png`), fullPage: vue === 'page' });
      console.log(id, vue, JSON.stringify(m));
    }
    await p.close();
  }
} finally { await nav.close(); }
