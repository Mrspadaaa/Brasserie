// Fabrique les quatre mini maquettes s3a…s3d depuis ref/v6a/etat.html (base telle quelle), puis les capture.
// Assemblage par split/join et indices (L26), préfixe v6a- -> <id>- en dernier.
// Usage (racine du dépôt) : node work/missions/2026-11-14-finances/voies/s3/_outils/fabriquer.mjs [s3a,s3b,…]
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

// Bande : remplacer la rangée du haut, insérer après elle, ou en fin de bande.
const avecTop = (band, top) => rep(band, TOP, top);
const apresTop = (band, html) => rep(band, '<div class="v6a-piles">', html + '\n   <div class="v6a-piles">');
const finBande = (band, html) => band.replace(/<\/section>$/, html + '\n  </section>');
const muet = () => rep(PILL, '<span class="v6a-pill">', '<span class="v6a-pill v6a-mute">');

// Données d'une plage qui laisse le loyer (25 nov.) dehors : Fixes 68,00 ; à payer 0,00 ; dépensé 296,80 ; payé 325,40.
const plage = (s) => {
  s = rep(s, '<b class="v6a-m">468,00</b><span class="v6a-st" style="height:57px"><i class="v6a-hat" style="flex:400"></i><i style="flex:68;background:#9856D2"></i></span>',
    '<b class="v6a-m">68,00</b><span class="v6a-st" style="height:8px"><i style="flex:1;background:#9856D2"></i></span>');
  s = rep(s, 'à payer <b class="v6a-m">400,00</b>', 'à payer <b class="v6a-m">0,00</b>');
  s = rep(s, 'dépensé <b class="v6a-m">696,80</b>', 'dépensé <b class="v6a-m">296,80</b>');
  return s;
};
const listePlage = (s) => {
  s = rep(s, '<b>Charges fixes</b><span class="v6a-sub v6a-m">468,00</span>', '<b>Charges fixes</b><span class="v6a-sub v6a-m">68,00</span>');
  s = s.replace(/<div class="v6a-op">\s*<span class="v6a-bar v6a-hat"><\/span>[\s\S]*?<\/div>\s*/, '');
  if (s.includes('Loyer de l')) throw new Error('loyer resté');
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

const COMMUN_CSS = `
.v6a-ecran{position:relative}
.v6a-lab{font:600 13px/18px "Source Sans 3",system-ui,sans-serif;color:#2F6EA8;padding:14px 10px 6px;border-top:6px solid #EBEBEB}
.v6a-ecran:first-of-type .v6a-lab{border-top:0}
.v6a-band{position:relative}
.v6a-hid{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer}
.v6a-mute b{color:#8A8478;font-weight:600}
.v6a-planche{padding:16px 10px 90px;border-top:6px solid #EBEBEB}
.v6a-planche h2{font-size:13px;font-weight:600;color:#2F6EA8;margin-bottom:8px}
.v6a-planche>div{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}
.v6a-planche img{width:100%;border:1px solid #DADADA;border-radius:10px;display:block}
.v6a-planche figcaption{font-size:12px;color:#555;padding:2px 2px 0}
html[data-vue] .v6a-ecran:not(.v6a-vis),html[data-vue] .v6a-planche,html[data-vue] .v6a-lab{display:none}
`;

const ICAL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>';

// ---------- s3a : puces préréglées, chacune dessine sa durée ----------
const s3a = () => {
  const css = `
.v6a-pre{display:flex;gap:2px;margin:6px -8px 0;padding:0 6px;overflow-x:auto;scrollbar-width:none}
.v6a-pre button{position:relative;flex:none;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:3px;min-height:36px;padding:2px 9px;border-radius:10px;font-size:13px;line-height:16px;color:#444;border:1px solid transparent}
.v6a-pre button i{display:block;height:4px;border-radius:2px;background:#CFC8B6}
.v6a-pre button::after{content:"";position:absolute;inset:-4px 0}
.v6a-pre .v6a-sel{background:#fff;border-color:#2F6EA8;color:#1F4E7A;font-weight:600;box-shadow:0 1px 2px rgba(47,110,168,.15)}
.v6a-pre .v6a-sel i{background:#2F6EA8}
.v6a-br{display:flex;align-items:center;height:4px}
.v6a-br s{display:block;width:4px;height:10px;border:2px solid currentColor;border-right:0;border-radius:2px 0 0 2px;opacity:.7}
.v6a-br u{display:block;width:22px;border-top:2px dotted currentColor;opacity:.6}
.v6a-br u+s{border:2px solid currentColor;border-left:0;border-radius:0 2px 2px 0}
.v6a-dates{display:flex;align-items:center;gap:6px;margin-top:6px}
.v6a-f{position:relative;flex:1;display:flex;align-items:center;gap:6px;height:36px;padding:0 8px;border-radius:10px;background:#fff;border:1px solid #DADADA;color:#111}
.v6a-f span{font-size:12px;color:#666}
.v6a-f b{font-size:14px;font-weight:600}
.v6a-f svg{margin-left:auto;color:#2F6EA8}
.v6a-f.v6a-cur{border-color:#2F6EA8;box-shadow:inset 0 0 0 1px #2F6EA8}
.v6a-n{font-size:12px;color:#555;white-space:nowrap}
`;
  const puces = (sel) => `<div class="v6a-pre" role="group" aria-label="Période" data-booster="prereglages">
    <button${sel === '7' ? ' class="v6a-sel"' : ''}>7 j<i style="width:8px"></i></button>
    <button${sel === '30' ? ' class="v6a-sel"' : ''}>30 j<i style="width:24px"></i></button>
    <button${sel === 'mois' ? ' class="v6a-sel"' : ''}>ce mois<i style="width:24px"></i></button>
    <button${sel === 'tri' ? ' class="v6a-sel"' : ''}>trimestre<i style="width:46px"></i></button>
    <button${sel === 'du' ? ' class="v6a-sel"' : ''}>du … au<span class="v6a-br"><s></s><u></u><s></s></span></button>
   </div>`;
  const dates = `<div class="v6a-dates" data-booster="deux-dates">
    <label class="v6a-f"><span>du</span><b>1er nov.</b>${ICAL}<input class="v6a-hid" type="date" value="2026-11-01" aria-label="Premier jour"></label>
    <label class="v6a-f v6a-cur"><span>au</span><b>15 nov.</b>${ICAL}<input class="v6a-hid" type="date" value="2026-11-15" aria-label="Dernier jour"></label>
    <span class="v6a-n">15 j</span>
   </div>`;
  const pillPlage = rep(rep(rep(PILL, '<b>novembre</b>', '<b>1er – 15 nov.</b>'), 'aria-label="Mois précédent"', 'aria-label="15 jours plus tôt"'), 'aria-label="Mois suivant"', 'aria-label="15 jours plus tard"');
  const repos = apresTop(BAND, puces('mois'));
  const apres = apresTop(rep(plage(BAND), PILL, pillPlage), puces('du') + '\n   ' + dates);
  return { css, vues: ['repos', 'apres'], corps: ecran('repos', 'Repos : « ce mois » choisi, comme v6a', { band: repos }) + ecran('apres', 'Après : « du … au » touché, 1er → 15 nov. posé (‹ › avancent de 15 j)', { band: apres, liste: listePlage(LISTE) }) };
};

// ---------- s3b : une phrase, chaque date est un mot qu'on touche ----------
const s3b = () => {
  const css = `
.v6a-phr{display:flex;align-items:center;gap:4px;margin:4px 2px 0;font-size:14px;color:#555;min-height:30px}
.v6a-w{position:relative;padding:1px 3px;border-radius:6px;color:#111;font-weight:600;border-bottom:2px dashed #A9A291;line-height:20px}
.v6a-w::after{content:"";position:absolute;inset:-10px -4px}
.v6a-w.v6a-on2{background:#E6EFF8;border-bottom:2px solid #2F6EA8;color:#1F4E7A}
.v6a-back{margin-left:auto;display:flex;align-items:center;gap:4px;min-height:28px;padding:0 10px;border-radius:16px;border:1px solid #D9D9D9;background:#fff;font-size:13px;color:#444}
.v6a-cal{position:absolute;left:4px;right:4px;top:70px;background:#fff;border:1px solid #DADADA;border-radius:16px;box-shadow:0 10px 28px rgba(0,0,0,.18);padding:6px 8px 8px;z-index:3}
.v6a-cal::before{content:"";position:absolute;top:-7px;left:150px;width:12px;height:12px;background:#fff;border-left:1px solid #DADADA;border-top:1px solid #DADADA;transform:rotate(45deg)}
.v6a-calh{display:flex;align-items:center;gap:6px;height:34px}
.v6a-calh b{flex:1;text-align:center;font-size:15px}
.v6a-calh button{width:32px;height:32px;border-radius:50%;font-size:17px;background:#F5F5F5}
.v6a-grid{display:grid;grid-template-columns:repeat(7,1fr);row-gap:2px}
.v6a-dw{font-size:12px;color:#666;text-align:center;line-height:20px}
.v6a-d{position:relative;height:38px;display:grid;place-items:center;font-size:14px;color:#111}
.v6a-d b{position:relative;z-index:1;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-weight:400}
.v6a-d.v6a-in{background:#E6EFF8}
.v6a-d.v6a-l{border-radius:19px 0 0 19px}.v6a-d.v6a-r{border-radius:0 19px 19px 0}.v6a-d.v6a-l.v6a-r{border-radius:19px}
.v6a-d.v6a-end b{background:#2F6EA8;color:#fff;font-weight:600}
.v6a-d.v6a-auj b{box-shadow:inset 0 0 0 1.5px #111;font-weight:600}
.v6a-d.v6a-out{color:#8A8478}
.v6a-d i{position:absolute;bottom:7px;left:50%;margin-left:-3px;width:6px;height:6px;border-radius:50%;z-index:2}
.v6a-calf{display:flex;align-items:center;gap:8px;margin-top:6px;padding-top:6px;border-top:1px solid #F0F0F0;font-size:13px;color:#444}
.v6a-calf .v6a-m{color:#111}
.v6a-calf span:last-child{margin-left:auto}
`;
  const phrase = (fin, actif, retour) => `<div class="v6a-phr" data-booster="phrase-editable">du
    <button class="v6a-w">1er nov.<input class="v6a-hid" type="date" value="2026-11-01" aria-label="Premier jour"></button> au
    <button class="v6a-w${actif ? ' v6a-on2' : ''}">${fin}<input class="v6a-hid" type="date" value="2026-11-${fin.startsWith('15') ? '15' : '30'}" aria-label="Dernier jour"></button>
    ${retour ? '<button class="v6a-back">↺ novembre</button>' : ''}
   </div>`;
  // novembre 2026 : le 1er est un dimanche ; semaine du lundi.
  const jours = [];
  for (let k = 0; k < 6; k++) jours.push('<span class="v6a-d"></span>');
  for (let d = 1; d <= 30; d++) {
    const col = (d + 5) % 7; // 0 = lundi
    const cls = ['v6a-d'];
    if (d <= 15) { cls.push('v6a-in'); if (col === 0 || d === 1) cls.push('v6a-l'); if (col === 6 || d === 15) cls.push('v6a-r'); }
    else cls.push('v6a-out');
    if (d === 1 || d === 15) cls.push('v6a-end');
    if (d === 9) cls.push('v6a-auj');
    const pt = d === 9 ? '<i style="background:#111"></i>' : d === 25 ? '<i class="v6a-hat"></i>' : '';
    jours.push(`<span class="${cls.join(' ')}"><b>${d}</b>${pt}</span>`);
  }
  const cal = `<div class="v6a-cal" role="dialog" aria-label="Dernier jour" data-booster="calendrier-plage">
    <div class="v6a-calh"><button aria-label="Mois précédent">‹</button><b>novembre 2026</b><button aria-label="Mois suivant">›</button></div>
    <div class="v6a-grid">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((x) => `<span class="v6a-dw">${x}</span>`).join('')}${jours.join('')}</div>
    <div class="v6a-calf"><span>1er → 15 nov. · <b class="v6a-m">15</b> j</span><span><b class="v6a-m">5</b> opérations</span></div>
   </div>`;
  const repos = apresTop(BAND, phrase('30 nov.', false, false));
  const ouvert = apresTop(BAND, phrase('30 nov.', true, false) + cal);
  const apres = apresTop(rep(plage(BAND), PILL, muet()), phrase('15 nov.', true, true));
  return { css, vues: ['repos', 'ouvert', 'apres'], corps:
    ecran('repos', 'Repos : la phrase dit la période, chaque date se touche', { band: repos }) +
    ecran('ouvert', 'Après le toucher sur « 30 nov. » : le calendrier, le 15 choisi', { band: ouvert }) +
    ecran('apres', 'Après : du 1er au 15 nov., « ↺ novembre » pour revenir', { band: apres, liste: listePlage(LISTE) }) };
};

// ---------- s3c : la recherche comprend une période ----------
const s3c = () => {
  const css = `
.v6a-top>*{flex:none;white-space:nowrap}
.v6a-dda{position:relative;display:flex;align-items:center;gap:3px;min-height:28px;padding:0 7px;white-space:nowrap;border-radius:16px;border:1px dashed #A9A291;font-size:13px;color:#444}
.v6a-dda::after{content:"";position:absolute;inset:-8px -2px}
.v6a-act3{display:flex;align-items:center;gap:6px;margin-top:6px;flex-wrap:wrap}
.v6a-tok{display:flex;align-items:center;gap:5px;min-height:30px;padding:0 2px 0 8px;border-radius:16px;background:#E6EFF8;border:1px solid #A9C9E8;color:#1F4E7A;font-size:14px;font-weight:600}
.v6a-tok .v6a-x{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:16px;color:#1F4E7A}
.v6a-hors{font-size:12px;color:#555}
.v6a-srch{gap:6px}
.v6a-fld{flex:1;display:flex;align-items:center;gap:6px;height:38px;padding:0 10px;border-radius:12px;border:2px solid #2F6EA8;background:#fff;font-size:16px}
.v6a-fld em{font-style:normal;background:#E6EFF8;border-radius:4px;padding:0 2px;color:#1F4E7A}
.v6a-car{width:2px;height:20px;background:#2F6EA8;margin-left:-4px}
.v6a-sc{position:absolute;left:0;right:0;top:52px;bottom:0;background:rgba(17,17,17,.32);z-index:3}
.v6a-sug{position:absolute;left:0;right:0;top:52px;background:#fff;border-bottom:1px solid #DADADA;box-shadow:0 12px 24px rgba(0,0,0,.16);z-index:4;padding:6px 10px 10px}
.v6a-s1{display:grid;grid-template-columns:28px 1fr auto;gap:2px 8px;align-items:center;width:100%;text-align:left;padding:8px;border-radius:12px;background:#F2F7FC;border:1px solid #A9C9E8}
.v6a-s1 .v6a-ic2{width:28px;height:28px;border-radius:8px;background:#2F6EA8;color:#fff;display:grid;place-items:center;grid-column:1;grid-row:1/3}
.v6a-s1 b{font-size:15px;grid-column:2;grid-row:1;line-height:18px}
.v6a-s1 kbd{grid-column:3;grid-row:1/3;font:600 13px "Source Sans 3",sans-serif;background:#111;color:#fff;border-radius:10px;padding:5px 10px}
.v6a-fr{grid-column:2;grid-row:2;height:14px;margin-top:4px;display:grid;grid-template-columns:repeat(30,1fr);gap:1px}
.v6a-fr span{background:#E4E0D6;border-radius:1px}
.v6a-fr span.v6a-x2{background:#2F6EA8}
.v6a-fr span.v6a-op9{background:#111}
.v6a-fr span.v6a-op25{background:repeating-linear-gradient(135deg,#E3B55D 0 3px,#FCEFD2 3px 6px)}
.v6a-s2{display:flex;align-items:center;gap:8px;padding:10px 8px 4px;font-size:14px;color:#444;border-bottom:1px solid #F0F0F0}
.v6a-s3{padding:8px 8px 0;font-size:12px;color:#555}
.v6a-s3 span{display:inline-block;margin:4px 4px 0 0;padding:1px 8px;border-radius:999px;background:#F5F5F5;color:#333;font-size:13px}
`;
  const dda = `<button class="v6a-dda" data-booster="du-au">${ICAL.split("width=\"16\" height=\"16\"").join("width=\"14\" height=\"14\"")}du … au</button>`;
  const topRepos = `<div class="v6a-top">
    ${PILL}
    ${dda}
    ${DUE}
   </div>
   `;
  const topApres = `<div class="v6a-top">
    ${muet()}
    ${DUE}
   </div>
   <div class="v6a-act3" data-booster="pastille-periode"><span class="v6a-tok">${ICAL}3 → 17 nov.<button class="v6a-x" aria-label="Retirer la période">×</button></span><span class="v6a-hors">5 opérations · 1 après le 17</span></div>
   `;
  const frise = Array.from({ length: 30 }, (_, k) => { const d = k + 1; const c = d === 9 ? 'v6a-op9' : d === 25 ? 'v6a-op25' : d >= 3 && d <= 17 ? 'v6a-x2' : ''; return `<span${c ? ` class="${c}"` : ''}></span>`; }).join('');
  const HDR = `<header class="v6a-hd v6a-srch">
  <button class="v6a-ic" aria-label="Fermer la recherche"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg></button>
  <div class="v6a-fld" data-booster="recherche-periode"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2F6EA8" stroke-width="2"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></svg><em>3-17 nov.</em><span class="v6a-car"></span></div>
  <button class="v6a-ic v6a-bx" aria-label="Effacer">×</button>
</header>`;
  const sur = `<div class="v6a-sc"></div><div class="v6a-sug">
  <button class="v6a-s1"><span class="v6a-ic2">${ICAL}</span><b>Période : du mar. 3 au mar. 17 nov.</b><kbd>Poser</kbd><span class="v6a-fr" aria-hidden="true">${frise}</span></button>
  <div class="v6a-s2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></svg>Texte « 3-17 nov. » · aucune opération</div>
  <p class="v6a-s3">Compris aussi :<br><span>15.10–10.11</span><span>semaine 45</span><span>octobre</span><span>depuis le 3</span></p>
</div>`;
  const repos = avecTop(BAND, topRepos);
  const apres = avecTop(plage(BAND), topApres);
  return { css, vues: ['repos', 'ouvert', 'apres'], corps:
    ecran('repos', 'Repos : v6a, et la puce « du … au » à côté du mois', { band: repos }) +
    ecran('ouvert', 'La loupe : « 3-17 nov. » tapé est lu comme une période', { band: repos, header: HDR, sur }) +
    ecran('apres', 'Après « Poser » : la période en pastille, × pour revenir', { band: apres, liste: listePlage(LISTE) }) };
};

// ---------- s3d : la règle du mois, sous les piles ----------
const s3d = () => {
  const css = `
.v6a-rul{position:relative;height:60px;margin:6px 2px 0;border-top:1px dashed #DDD7C8}
.v6a-rul>*{position:absolute;left:calc(12px + (var(--d) - 1) * (100% - 24px) / 29)}
.v6a-rul>.v6a-trk{left:12px;right:12px;top:30px;height:2px;background:#D6D0C1;border-radius:1px}
.v6a-rng{top:29px;height:4px;width:calc((var(--n) - 1) * (100% - 24px) / 29);background:#2F6EA8;border-radius:2px}
.v6a-rng.v6a-calme{background:#B5AE9C;height:2px;top:30px}
.v6a-h.v6a-calme{border-color:#8A8478}
.v6a-dim{top:6px;bottom:0;width:calc((var(--n) - 1) * (100% - 24px) / 29 + 12px);background:repeating-linear-gradient(135deg,rgba(60,50,30,.08) 0 3px,transparent 3px 7px);border-radius:0 6px 6px 0}
.v6a-tk{top:27px;width:1px;height:8px;margin-left:-.5px;background:#CFC8B6}
.v6a-tk.v6a-lun{top:24px;height:14px;background:#B5AE9C}
.v6a-mk{bottom:21px;display:flex;align-items:flex-end;gap:1px;transform:translateX(-50%)}
.v6a-mk i{display:block;width:5px;border-radius:2px 2px 0 0}
.v6a-mk.v6a-gh{opacity:.35}
.v6a-h{top:20px;width:24px;height:24px;margin-left:-12px;border-radius:50%;background:#fff;border:2px solid #111;box-shadow:0 1px 4px rgba(0,0,0,.25);z-index:2}
.v6a-h::after{content:"";position:absolute;inset:-12px}
.v6a-h.v6a-hot{border-color:#2F6EA8;box-shadow:0 0 0 6px rgba(47,110,168,.18),0 1px 4px rgba(0,0,0,.25)}
.v6a-dl{top:46px;font-size:12px;line-height:14px;color:#555;transform:translateX(-50%);white-space:nowrap}
.v6a-dl.v6a-b{color:#1F4E7A;font-weight:600}
.v6a-bub{top:-2px;transform:translateX(-50%);padding:1px 7px;border-radius:8px;background:#111;color:#fff;font-size:12px;line-height:18px;white-space:nowrap;z-index:3}
.v6a-rul>.v6a-rz{top:44px;left:auto;right:2px;font-size:12px;line-height:16px;color:#1F4E7A;font-weight:600;padding:0 4px}
.v6a-rz::after{content:"";position:absolute;inset:-10px -4px}
`;
  const regle = (fin) => {
    const t = ['<span class="v6a-trk"></span>'];
    for (let d = 1; d <= 30; d++) t.push(`<span class="v6a-tk${(d + 5) % 7 === 0 ? ' v6a-lun' : ''}" style="--d:${d}"></span>`);
    if (fin < 30) t.push(`<span class="v6a-dim" style="--d:${fin};--n:${31 - fin}"></span>`);
    t.push(`<span class="v6a-rng${fin === 30 ? " v6a-calme" : ""}" style="--d:1;--n:${fin}"></span>`);
    // le 9 : encaissé +720 (vert) et payé 325,40 (sombre) ; le 25 : loyer à payer 400 (hachuré)
    t.push('<span class="v6a-mk" style="--d:9"><i style="height:16px;background:#56D27B"></i><i style="height:8px;background:#111"></i></span>');
    t.push(`<span class="v6a-mk${fin < 25 ? ' v6a-gh' : ''}" style="--d:25"><i class="v6a-hat" style="height:10px;width:7px"></i></span>`);
    t.push(`<span class="v6a-h${fin === 30 ? " v6a-calme" : ""}" style="--d:1" role="slider" aria-label="Premier jour" aria-valuenow="1"></span>`);
    t.push(`<span class="v6a-h${fin < 30 ? ' v6a-hot' : ' v6a-calme'}" style="--d:${fin}" role="slider" aria-label="Dernier jour" aria-valuenow="${fin}"></span>`);
    t.push('<span class="v6a-dl" style="--d:1">1er</span><span class="v6a-dl" style="--d:9">9 · auj.</span>');
    if (fin < 30) { t.push(`<span class="v6a-bub" style="--d:${fin}">1er → ${fin} nov.</span>`); t.push(`<span class="v6a-dl v6a-b" style="--d:${fin}">${fin}</span>`); t.push('<button class="v6a-rz">↺ tout le mois</button>'); }
    else t.push('<span class="v6a-dl" style="--d:25">25</span><span class="v6a-dl" style="--d:30">30</span>');
    return `<div class="v6a-rul" data-booster="regle-du-mois" aria-label="Période dans le mois">\n    ${t.join('\n    ')}\n   </div>`;
  };
  const repos = finBande(BAND, regle(30));
  const apres = finBande(rep(plage(BAND), PILL, muet()), regle(15));
  return { css, vues: ['repos', 'apres'], corps:
    ecran('repos', 'Repos : la règle du mois sous les piles, poignées aux deux bouts', { band: repos }) +
    ecran('apres', 'Après : la poignée de droite glissée au 15, piles et lignes recalculées', { band: apres, liste: listePlage(LISTE) }) };
};

const VARIANTES = { s3a, s3b, s3c, s3d };
const TITRES = { s3a: 's3a · préréglages qui dessinent leur durée', s3b: 's3b · la phrase aux dates touchables', s3c: 's3c · la loupe comprend une période', s3d: 's3d · la règle du mois' };
const page = (id) => {
  const v = VARIANTES[id]();
  const planche = `<section class="v6a-planche"><h2>Les images, côte à côte</h2><div>${v.vues.map((x) => `<figure><img src="${id}-${x}.png" alt="${id} ${x}"><figcaption>${x}</figcaption></figure>`).join('')}</div></section>`;
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
    for (const vue of vues) {
      await p.goto('file:///' + f.split('\\').join('/') + '?vue=' + vue, { waitUntil: 'load' });
      await p.evaluate(() => document.fonts.ready);
      const debord = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      await p.screenshot({ path: join(VOIE, id, `${id}-${vue}.png`) });
      console.log(id, vue, 'débord', debord);
    }
    await p.close();
  }
} finally { await nav.close(); }
