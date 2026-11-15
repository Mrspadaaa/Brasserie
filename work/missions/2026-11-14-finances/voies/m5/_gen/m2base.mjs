// Voie m2 : assemble les 12 mini maquettes (fiche, payer, modifier/+ pièce) sur le fond v6a, classes préfixées par id (L26).
// Copie de voies/m2/build.mjs (voie m5) : exporte les variantes sans rien écrire.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ICI = dirname(fileURLToPath(import.meta.url));
const v6a = readFileSync(join(ICI, '../../../ref/v6a/etat.html'), 'utf8');
// CSS et en-tête de v6a, tels quels, préfixe changé par split/join (jamais de replace à motif).
const v6aCss = v6a.slice(v6a.indexOf('*{box-sizing'), v6a.indexOf('</style>'));
const v6aHaut = v6a.slice(v6a.indexOf('<header'), v6a.indexOf('<div data-mots="lignes"'));
const pref = (s, p) => s.split('v6a-').join(`${p}-`);

const polices = `@font-face{font-family:"Source Sans 3";font-weight:400;src:url(../fonts/SourceSans3-400.woff2) format("woff2")}
@font-face{font-family:"Source Sans 3";font-weight:600;src:url(../fonts/SourceSans3-600.woff2) format("woff2")}
@font-face{font-family:"Source Sans 3";font-weight:700;src:url(../fonts/SourceSans3-700.woff2) format("woff2")}
@font-face{font-family:"IBM Plex Mono";font-weight:500;src:url(../fonts/IBMPlexMono-500.woff2) format("woff2")}
@font-face{font-family:"IBM Plex Mono";font-weight:600;src:url(../fonts/IBMPlexMono-600.woff2) format("woff2")}`;

// Feuille commune : voile sur l'écran choisi, poignée, boutons. Chaque variante compose ensuite la sienne.
const feuille = (p) => `
.${p}-fond{position:relative;height:250px;overflow:hidden}
.${p}-fond .${p}-nav,.${p}-fond .${p}-fab{display:none}
.${p}-voile{position:absolute;inset:0;background:rgba(17,17,17,.46);z-index:3}
.${p}-sh{position:relative;z-index:4;margin-top:-30px;background:#fff;border-radius:22px 22px 0 0;box-shadow:0 -10px 30px rgba(0,0,0,.20);padding:6px 14px 22px;min-height:624px}
.${p}-grab{width:40px;height:5px;border-radius:3px;background:#D4D4D4;margin:2px auto 10px}
.${p}-x{width:36px;height:36px;border-radius:12px;background:#F5F5F5;border:1px solid #DADADA;display:grid;place-items:center;flex:none}
.${p}-mu{color:#555}
.${p}-b1{min-height:44px;padding:0 18px;border-radius:16px;background:#111;color:#fff;font-size:16px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.${p}-b2{min-height:44px;padding:0 14px;border-radius:14px;background:#F5F5F5;border:1px solid #DADADA;font-size:15px;color:#222;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.${p}-lk{color:#2F6EA8;font-weight:600}
input.${p}-in{font:inherit;border:1px solid #DADADA;border-radius:12px;height:44px;padding:0 12px;font-size:16px;width:100%;background:#fff;color:#111}
input.${p}-in:focus{outline:2px solid #2F6EA8;outline-offset:-1px}
`;
const fond = (p) => `<div class="${p}-fond">${pref(v6aHaut, p)}</div><div class="${p}-voile"></div></div>`;

const ic = {
  doc: (ok = true, s = 16) => ok
    ? `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M7 3h7l4 4v14H7z"/><path d="M9.5 14l2 2 3.5-4"/></svg>`
    : `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="3 2.4"><path d="M7 3h7l4 4v14H7z"/></svg>`,
  chev: (s = 16, c = '#888') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4"><path d="M9 5l7 7-7 7"/></svg>`,
  bas: (s = 16, c = '#555') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4"><path d="M5 9l7 7 7-7"/></svg>`,
  x: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.4"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  stock: (s = 15) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#6E9B5B" stroke-width="2.2"><path d="M12 3l7 4v8l-7 4-7-4V7z"/></svg>`,
  ble: (s = 16, c = '#8A6D1E') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2"><path d="M12 21V8M12 8c-3 0-4-3-4-5 2 0 4 1 4 5zM12 13c-3 0-4-2-4-4 2 0 4 1 4 4zM12 13c3 0 4-2 4-4-2 0-4 1-4 4zM12 8c3 0 4-3 4-5-2 0-4 1-4 5z"/></svg>`,
  cam: (s = 20, c = '#fff') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.6"/></svg>`,
  fichier: (s = 20, c = '#222') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M12 11v6M9.5 14.5L12 17l2.5-2.5"/></svg>`,
  cad: (s = 14, c = '#777') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`,
  crayon: (s = 14, c = '#2F6EA8') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2"><path d="M4 20l1-5L16 4l4 4L9 19z"/></svg>`,
  copie: (s = 14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#2F6EA8" stroke-width="2.2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V4h12"/></svg>`,
  dossier: (s = 15) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#2F6EA8" stroke-width="2.2"><path d="M3 6h7l2 2h9v11H3z"/></svg>`,
  retour: (s = 15) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.2"><path d="M9 7L4 12l5 5M4 12h11a5 5 0 0 1 0 10h-2"/></svg>`,
};
const sq = (p, cat) => ({
  brassage: `<span class="${p}-sq" style="background:#564925"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F4E5B9" stroke-width="2.8"><path d="M12 21V8M12 8c-3 0-4-3-4-5 2 0 4 1 4 5z"/></svg></span>`,
  fixes: `<span class="${p}-sq" style="background:#3F2556"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D8B9F4" stroke-width="2.8"><path d="M4 11l8-6 8 6v9H4z"/></svg></span>`,
  nettoyage: `<span class="${p}-sq" style="background:#254F56"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B9ECF4" stroke-width="2.8"><path d="M12 3c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12z"/></svg></span>`,
  materiel: `<span class="${p}-sq" style="background:#253356"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B9CAF4" stroke-width="2.8"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/></svg></span>`,
  retard: `<span class="${p}-sq" style="background:#6E1F1A"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F8C9C4" stroke-width="2.8"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg></span>`,
}[cat]);
// Lignes de la facture du Comptoir du brasseur (186,80 = 72,50 + 38,40 + 48,90 + 27,00).
const LIGNES = [
  { n: 'Malt Pilsner', q: '25 kg', a: '72,50', c: 72.5, col: '#D2B356' },
  { n: 'Malt Munich', q: '10 kg', a: '38,40', c: 38.4, col: '#B8913A' },
  { n: 'Houblon Citra', q: '500 g', a: '48,90', c: 48.9, col: '#7FB24A' },
  { n: 'Houblon Cascade', q: '500 g', a: '27,00', c: 27, col: '#5E9440' },
];

const page = (id, titre, css, corps) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${id} · ${titre}</title>
<style>
${polices}
${pref(v6aCss, id)}
${feuille(id)}
${css}
</style>
</head>
<body>
${corps}
</body>
</html>
`;

const V = {};

/* ───────────── m2fo : fiche d'une opération (Malt et houblons · Pale Ale, payée) ───────────── */
V['m2fo-a'] = (p) => ({
  titre: 'Fiche, tiède : le contenu actuel rangé dans v6a',
  css: `
.${p}-hd2{display:flex;gap:10px;align-items:flex-start}
.${p}-hd2 .${p}-sq{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;flex:none;margin-top:2px}
.${p}-t{flex:1;min-width:0}
.${p}-t b{display:block;font-size:18px;line-height:22px}
.${p}-t span{font-size:13px;color:#555}
.${p}-sum{display:flex;align-items:baseline;gap:6px;margin:10px 0 4px;flex-wrap:wrap}
.${p}-amt{font-size:28px;line-height:32px}
.${p}-cur{font-size:13px;color:#555;margin-right:auto}
.${p}-pj{display:flex;align-items:center;gap:8px;min-height:44px;margin:6px 0 2px;padding:0 4px 0 10px;border-radius:12px;background:#FAF8F3;border:1px solid #ECE7DA;color:#333;font-size:14px}
.${p}-pj .${p}-tx{flex:1}
.${p}-h{display:flex;justify-content:space-between;align-items:baseline;font-size:15px;font-weight:600;color:#222;margin:14px 0 2px}.${p}-h small{font-size:13px;font-weight:400;color:#555}
.${p}-ln{display:grid;grid-template-columns:4px 1fr auto 44px;align-items:center;gap:0 8px;min-height:44px;border-bottom:1px solid #F0F0F0}.${p}-ln .${p}-st{width:44px;height:44px;display:grid;place-items:center}.${p}-ln .${p}-st span{width:32px;height:32px;border-radius:10px;background:#EEF5EA;display:grid;place-items:center}
.${p}-ln i{align-self:stretch;margin:7px 0;border-radius:2px}
.${p}-ln b{font-size:14px;font-weight:600}
.${p}-ln small{font-size:13px;color:#555;font-weight:400}
.${p}-ln .${p}-m{font-size:14px}
.${p}-rec{display:flex;align-items:center;gap:6px;min-height:44px;font-size:15px;color:#2F6EA8;font-weight:600}
.${p}-acts{display:grid;grid-template-columns:.8fr 1.5fr;gap:8px;margin:4px 0 10px}.${p}-acts button{white-space:nowrap}
.${p}-dt{display:flex;align-items:center;gap:8px;min-height:44px;border-top:1px solid #EBEBEB;font-size:15px}
.${p}-dt span{flex:1}
.${p}-dt em{font-style:normal;font-size:13px;color:#555}
.${p}-hist{background:#F8F8F8;border-radius:12px;padding:6px 10px 8px;margin-bottom:6px}
.${p}-hist div{display:flex;justify-content:space-between;font-size:14px;min-height:28px;align-items:center}
.${p}-hist a{font-size:13px;color:#2F6EA8;text-decoration:none}
`,
  corps: `${fond(p)}
<section class="${p}-sh" aria-label="Fiche de l'opération">
 <div class="${p}-grab"></div>
 <div class="${p}-hd2">${sq(p, 'brassage')}<div class="${p}-t"><b>Malt et houblons · Pale Ale</b><span>Brassage · Comptoir du brasseur · 7 nov. 2026</span></div><button class="${p}-x" aria-label="Fermer">${ic.x}</button></div>
 <div class="${p}-sum"><span class="${p}-amt ${p}-m">186,80</span><span class="${p}-cur">CHF</span><span class="${p}-tg ${p}-ok">✓ payé 9 nov. · banque</span></div>
 <div class="${p}-pj">${ic.doc(true, 18)}<span>facture · <span class="${p}-mu">comptoir-1187.pdf</span></span><button class="${p}-mini" style="min-height:32px;padding:0 12px">Voir</button></div>
 <h3 class="${p}-h"><span>Dans la facture</span><small>4 lignes · au stock</small></h3>
 ${LIGNES.map(l => `<button class="${p}-ln" style="width:100%;text-align:left"><i style="background:${l.col}"></i><span><b>${l.n}</b> <small>· ${l.q}</small></span><span class="${p}-m">${l.a}</span><span class="${p}-st" aria-label="Voir au stock"><span>${ic.stock(18)}</span></span></button>`).join('\n ')}
 <button class="${p}-rec">${ic.ble(17, '#2F6EA8')}Recette · Pale Ale ${ic.chev(14, '#2F6EA8')}</button>
 <div class="${p}-acts"><button class="${p}-b2">${ic.crayon(15, '#333')}Modifier</button><button class="${p}-b2">${ic.retour()}Avoir ou remboursement</button></div>
 <div class="${p}-dt"><span>Échéance et prévision</span><em>Brassin Pale Ale</em>${ic.chev()}</div>
 <div class="${p}-dt"><span>Paiements</span><em>1</em>${ic.bas()}</div>
 <div class="${p}-hist"><div><span>9 nov. 2026 · banque</span><span class="${p}-m">−186,80</span></div><a href="#">Corriger ce paiement saisi par erreur</a></div>
 <div class="${p}-dt"><span>Corriger une erreur de saisie</span>${ic.chev()}</div>
</section>`,
});

V['m2fo-b'] = (p) => ({
  titre: 'Fiche, froide : trois tuiles et Modifier',
  css: `
.${p}-top{display:flex;justify-content:space-between;align-items:flex-start}
.${p}-big{font-size:38px;line-height:42px;letter-spacing:-.01em}
.${p}-nm{font-size:16px;font-weight:600;margin-top:2px}
.${p}-nm small{font-weight:400;color:#555;font-size:14px}
.${p}-row{display:flex;gap:6px;margin:8px 0 14px}
.${p}-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.${p}-tl{border-radius:16px;border:1px solid #E4E0D6;background:#FAF8F3;padding:9px 10px;display:flex;flex-direction:column;justify-content:flex-start;gap:6px;text-align:left}
.${p}-tl b{font-size:15px;line-height:18px}
.${p}-tl span{font-size:12px;color:#555;line-height:15px}
.${p}-tl .${p}-ico{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:#fff;border:1px solid #E4E0D6}
.${p}-strip{display:flex;height:6px;border-radius:3px;overflow:hidden;margin-top:4px}
.${p}-main{display:flex;gap:8px;margin-top:14px}
.${p}-main .${p}-b1{flex:1}
.${p}-plus{margin-top:10px;border:1px solid #EBEBEB;border-radius:16px;overflow:hidden}
.${p}-plus div{display:flex;align-items:center;gap:10px;min-height:44px;padding:0 12px;border-top:1px solid #F0F0F0;font-size:15px}
.${p}-plus div:first-child{border-top:0}
.${p}-plus div span{flex:1}
.${p}-plus em{font-style:normal;color:#555;font-size:13px}
.${p}-cap{font-size:12px;color:#666;margin:12px 2px 4px;letter-spacing:.03em}
`,
  corps: `${fond(p)}
<section class="${p}-sh" aria-label="Fiche de l'opération">
 <div class="${p}-grab"></div>
 <div class="${p}-top"><div><span class="${p}-big ${p}-m">186,80</span><div class="${p}-nm">Malt et houblons · Pale Ale <small>· Comptoir du brasseur</small></div></div><button class="${p}-x" aria-label="Fermer">${ic.x}</button></div>
 <div class="${p}-row"><span class="${p}-tg ${p}-ok">✓ payé 9 nov. · banque</span><span class="${p}-tg" style="background:#F3EEDD;color:#5F4B12">Brassage · 7 nov.</span></div>
 <div class="${p}-tiles">
  <button class="${p}-tl"><span class="${p}-ico" style="color:#22663A">${ic.doc(true, 18)}</span><span><b>Facture</b><br>n° 1187<br>du 7 nov.</span></button>
  <button class="${p}-tl"><span class="${p}-ico">${ic.stock(18)}</span><span><b>4 lignes</b><br>malt 110,90 · houblon 75,90</span><span class="${p}-strip">${LIGNES.map(l => `<i style="flex:${l.c};background:${l.col}"></i>`).join('')}</span></button>
  <button class="${p}-tl"><span class="${p}-ico">${ic.ble(18)}</span><span><b>Pale Ale</b><br>recette · Citra, Cascade</span></button>
 </div>
 <div class="${p}-main"><button class="${p}-b1">${ic.crayon(16, '#fff')}Modifier</button><button class="${p}-b2" aria-expanded="true">Plus ${ic.bas(14)}</button></div>
 <div class="${p}-plus">
  <div>${ic.retour()}<span>Avoir ou remboursement</span>${ic.chev()}</div>
  <div><span>Échéance et prévision</span><em>Brassin Pale Ale</em>${ic.chev()}</div>
  <div><span>Paiements</span><em>1 · 9 nov. · −186,80</em>${ic.chev()}</div>
  <div><span style="color:#8E2A23">Corriger une erreur de saisie</span>${ic.chev()}</div>
 </div>
</section>`,
});

V['m2fo-c'] = (p) => {
  const tot = 186.8; let x = 0;
  const seg = LIGNES.map(l => { const w = l.c / tot * 100; const s = `<button class="${p}-seg" style="left:${x.toFixed(2)}%;width:${w.toFixed(2)}%;background:${l.col}" aria-label="${l.n} ${l.a}, voir le stock"></button>`; x += w; return s; }).join('');
  return {
    titre: 'Fiche, chaude : la facture en barre, la frise du paiement, la jauge du brassin',
    css: `
.${p}-hd2{display:flex;align-items:center;gap:8px}
.${p}-hd2 .${p}-sq{width:26px;height:26px;border-radius:9px;display:grid;place-items:center;flex:none}
.${p}-hd2 b{flex:1;font-size:16px;line-height:19px}
.${p}-hd2 b small{display:block;font-size:13px;color:#555;font-weight:400}
.${p}-amt{display:flex;align-items:baseline;justify-content:space-between;margin:10px 0 6px}
.${p}-amt .${p}-m{font-size:26px}
.${p}-bar{position:relative;height:34px;border-radius:10px;overflow:hidden;background:#eee}
.${p}-seg{position:absolute;top:0;bottom:0;border-right:2px solid #fff}
.${p}-leg{display:grid;grid-template-columns:1fr 1fr;gap:2px 12px;margin-top:6px}
.${p}-leg button{display:flex;align-items:center;gap:6px;min-height:34px;font-size:14px;text-align:left;border-bottom:1px solid #F2F2F2}
.${p}-leg i{width:10px;height:10px;border-radius:3px;flex:none}
.${p}-leg span{flex:1}
.${p}-leg small{color:#555;font-size:12px}
.${p}-card{border-radius:16px;background:#FAF8F3;padding:10px 12px;margin-top:12px}
.${p}-card h4{font-size:13px;font-weight:600;color:#444;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.${p}-fr{position:relative;height:50px;margin-top:20px}
.${p}-fr .${p}-ax{position:absolute;left:10px;right:10px;top:12px;height:4px;border-radius:2px;background:#E4E0D6}
.${p}-fr .${p}-pd{position:absolute;left:10px;width:7%;top:12px;height:4px;border-radius:2px;background:#56A870}
.${p}-dot{position:absolute;top:6px;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px #C9C2B0}
.${p}-fr span{position:absolute;top:26px;font-size:12px;color:#444;white-space:nowrap;transform:translateX(-50%)}
.${p}-g{position:relative;height:22px;border-radius:8px;background:#fff;border:1px solid #E4E0D6;overflow:hidden}
.${p}-g i{position:absolute;top:0;bottom:0;left:0}
.${p}-g em{position:absolute;top:0;bottom:0;border-left:2px dashed #111}
.${p}-gl{display:flex;justify-content:space-between;font-size:13px;margin-top:5px;color:#444}
.${p}-acts{display:flex;gap:8px;margin-top:14px}
.${p}-acts .${p}-b1{flex:1}
`,
    corps: `${fond(p)}
<section class="${p}-sh" aria-label="Fiche de l'opération">
 <div class="${p}-grab"></div>
 <div class="${p}-hd2">${sq(p, 'brassage')}<b>Malt et houblons · Pale Ale<small>Comptoir du brasseur · facture · 7 nov.</small></b><button class="${p}-x" aria-label="Fermer">${ic.x}</button></div>
 <div class="${p}-amt"><span class="${p}-m">186,80</span><span class="${p}-pc" style="color:#22663A">${ic.doc(true)}facture jointe</span></div>
 <div class="${p}-bar" data-booster="barre-lignes">${seg}</div>
 <div class="${p}-leg">${LIGNES.map(l => `<button><i style="background:${l.col}"></i><span>${l.n.replace('Houblon ', '').replace('Malt ', '')} <small>${l.q}</small></span><b class="${p}-m" style="font-size:13px">${l.a}</b>${ic.stock(13)}</button>`).join('')}</div>
 <div class="${p}-card" data-booster="frise-paiement"><h4><span>Payé 28 jours avant l'échéance</span></h4>
  <div class="${p}-fr"><i class="${p}-ax"></i><i class="${p}-pd"></i>
   <i class="${p}-dot" style="left:2px;background:#9C8A5C"></i><span style="left:0;transform:none">facture 7 nov.</span>
   <i class="${p}-dot" style="left:calc(7% + 2px);background:#56A870"></i><span style="left:calc(7% + 2px);top:-18px;transform:none;color:#22663A;font-weight:600">✓ payé 9 nov. · banque</span>
   <i class="${p}-dot" style="right:2px;background:#fff;box-shadow:0 0 0 1px #C9C2B0"></i><span style="right:0;transform:none;color:#555">échéance 7 déc.</span></div>
 </div>
 <div class="${p}-card" data-booster="jauge-brassin"><h4><span style="display:flex;gap:6px;align-items:center">${ic.ble(15)}Achat prévu · Pale Ale · 210,00</span><span class="${p}-lk" style="font-size:13px">Recette ›</span></h4>
  <div class="${p}-g"><i style="width:88.95%;background:linear-gradient(90deg,#D2B356 0 59.4%,#7FB24A 59.4%)"></i><em style="left:100%"></em></div>
  <div class="${p}-gl"><span>cette facture <b class="${p}-m">186,80</b></span><span>reste prévu <b class="${p}-m">23,20</b></span></div>
 </div>
 <div class="${p}-acts"><button class="${p}-b1">${ic.crayon(16, '#fff')}Modifier</button><button class="${p}-b2">${ic.retour()}Avoir</button><button class="${p}-b2" aria-label="Plus : paiements, corriger">⋯</button></div>
</section>`,
  };
};

V['m2fo-d'] = (p) => ({
  titre: 'Fiche, libre : la facture elle-même, lignes lues posées dessus',
  css: `
body{background:#ECE8DF}
.${p}-bk{display:flex;align-items:center;gap:8px;height:52px;padding:0 10px;background:#fff;border-bottom:1px solid #EBEBEB}
.${p}-bk b{flex:1;font-size:16px}
.${p}-bk button{min-height:44px;display:flex;align-items:center;gap:2px;color:#2F6EA8;font-size:15px;font-weight:600}
.${p}-paper{position:relative;margin:14px 14px 0;background:#FFFEFA;border-radius:4px 4px 0 0;padding:16px 16px 72px;box-shadow:0 6px 18px rgba(60,45,10,.16);font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:12px;color:#2B2A26;transform:rotate(-.6deg)}
.${p}-paper:after{content:"";position:absolute;left:0;right:0;bottom:-10px;height:10px;background:linear-gradient(-45deg,transparent 7px,#FFFEFA 0) 0 0/14px 10px,linear-gradient(45deg,transparent 7px,#FFFEFA 0) 0 0/14px 10px}
.${p}-ent{display:flex;justify-content:space-between;border-bottom:1px dashed #BDB6A4;padding-bottom:8px;margin-bottom:6px}
.${p}-ent b{font-size:14px;letter-spacing:.04em}
.${p}-pl{position:relative;display:grid;grid-template-columns:1fr auto;gap:0 8px;padding:7px 6px;margin:3px -6px;border-radius:8px}
.${p}-pl.${p}-lu{background:rgba(210,179,86,.18);box-shadow:inset 3px 0 0 var(--c)}
.${p}-pl .${p}-go{grid-column:1/3;display:flex;gap:6px;margin-top:4px;font-family:"Source Sans 3",system-ui,sans-serif}
.${p}-chip{display:inline-flex;align-items:center;gap:4px;min-height:26px;padding:0 9px;border-radius:999px;background:#fff;border:1px solid #D9D2BF;font-size:12px;color:#333}
.${p}-tot{display:flex;justify-content:space-between;border-top:1px dashed #BDB6A4;margin-top:8px;padding-top:8px;font-size:15px;font-weight:600}
.${p}-stamp{position:absolute;right:22px;bottom:20px;transform:rotate(-14deg);border:3px solid #2F8A4C;color:#2F8A4C;border-radius:10px;padding:2px 10px;font-family:"Source Sans 3",system-ui,sans-serif;font-weight:700;font-size:20px;letter-spacing:.06em;opacity:.85;text-align:center;line-height:22px}
.${p}-stamp small{display:block;font-size:11px;letter-spacing:.02em;font-weight:600}
.${p}-hint{font-size:12px;color:#5D564A;margin:18px 16px 6px;display:flex;gap:6px;align-items:center}
.${p}-hint i{width:14px;height:10px;border-radius:3px;background:rgba(210,179,86,.35);box-shadow:inset 2px 0 0 #D2B356}
.${p}-dock{margin:6px 10px 0;background:#fff;border-radius:18px;padding:10px;box-shadow:0 2px 10px rgba(0,0,0,.08)}
.${p}-dock .${p}-rw{display:flex;gap:8px}
.${p}-dock .${p}-b1{flex:1}
.${p}-meta2{display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:10px;padding:0 2px}
.${p}-meta2 .${p}-tx{flex:1}.${p}-meta2 .${p}-sq{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;flex:none}
.${p}-more{display:flex;justify-content:space-between;align-items:center;min-height:40px;margin-top:8px;padding:0 4px;border-top:1px solid #F0F0F0;font-size:14px;color:#444}
`,
  corps: `<div class="${p}-bk"><button>${ic.chev(16, '#2F6EA8').replace('M9 5l7 7-7 7', 'M15 5l-7 7 7 7')}Opérations</button><b></b><span class="${p}-tg ${p}-ok" style="font-size:13px">✓ payé 9 nov.</span></div>
<article class="${p}-paper" aria-label="La facture, lignes lues">
 <div class="${p}-ent"><span><b>COMPTOIR DU BRASSEUR</b><br>Facture 1187</span><span style="text-align:right">07.11.2026<br>Client : L'Affinée</span></div>
 ${LIGNES.map(l => `<div class="${p}-pl ${p}-lu" style="--c:${l.col}"><span>${l.n.toUpperCase()} ${l.q}</span><span>${l.a}</span><span class="${p}-go"><button class="${p}-chip">${ic.stock(13)}au stock · ${l.q}</button>${l.n.startsWith('Houblon') ? `<button class="${p}-chip">${ic.ble(13)}Pale Ale</button>` : ''}</span></div>`).join('\n ')}
 <div class="${p}-tot"><span>TOTAL CHF</span><span>186,80</span></div>
 <div style="margin-top:6px;color:#6B6455">Payable à 30 jours · IBAN CH93 …</div>
 <div class="${p}-stamp">PAYÉ<small>9 nov. · banque</small></div>
</article>
<div style="height:18px"></div>
<div class="${p}-dock">
 <div class="${p}-meta2">${sq(p, 'brassage')}<span class="${p}-tx"><b>Malt et houblons · Pale Ale</b><br><span class="${p}-mu" style="font-size:13px">Brassage · Comptoir du brasseur</span></span><b class="${p}-m" style="font-size:18px">186,80</b></div>
 <div class="${p}-rw"><button class="${p}-b1">${ic.crayon(16, '#fff')}Modifier</button><button class="${p}-b2">${ic.ble(16)}Recette</button><button class="${p}-b2" aria-label="Plus : avoir, échéance, corriger">⋯</button></div>
 <div class="${p}-more"><span>Paiement · 9 nov. · banque</span><b class="${p}-m">−186,80</b></div>
</div>
<div style="height:24px"></div>`,
});

/* ───────────── m2pa : payer (Loyer de l'atelier, 400,00, à payer le 25 nov. ; aujourd'hui 9 nov.) ───────────── */
V['m2pa-a'] = (p) => ({
  titre: 'Payer, tiède : montant, date, moyen, rangés',
  css: `
.${p}-hd2{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px}
.${p}-hd2 .${p}-sq{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;flex:none}
.${p}-hd2 div{flex:1}
.${p}-hd2 b{display:block;font-size:18px;line-height:22px}
.${p}-hd2 span{font-size:13px;color:#555}
.${p}-lb{display:flex;justify-content:space-between;font-size:13px;font-weight:600;color:#444;margin:12px 0 5px}
.${p}-mt{display:grid;grid-template-columns:1fr auto;gap:8px}
input.${p}-in.${p}-big{height:52px;font-family:"IBM Plex Mono",monospace;font-size:24px;font-weight:600;text-align:right}
.${p}-all{min-height:52px;padding:0 12px;border-radius:12px;border:1px solid #DADADA;background:#fff;font-size:14px;color:#333}
.${p}-rest{display:flex;align-items:center;gap:8px;margin-top:7px;font-size:14px}
.${p}-seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;border:1px solid #DADADA;border-radius:12px;overflow:hidden}
.${p}-seg button{min-height:44px;font-size:15px;border-left:1px solid #DADADA;color:#333}
.${p}-seg button:first-child{border-left:0}
.${p}-seg .${p}-on{background:#111;color:#fff;font-weight:600}
.${p}-ft{display:grid;grid-template-columns:1fr 1.6fr;gap:8px;margin-top:18px}
.${p}-note{font-size:12px;color:#666;margin-top:10px}
`,
  corps: `${fond(p)}
<section class="${p}-sh" aria-label="Payer">
 <div class="${p}-grab"></div>
 <div class="${p}-hd2">${sq(p, 'fixes')}<div><b>Payer · Loyer de l'atelier</b><span>Atelier · <span class="${p}-tg ${p}-pay">à payer · 25 nov. · dans 16 j</span></span></div><button class="${p}-x" aria-label="Fermer">${ic.x}</button></div>
 <div class="${p}-lb"><span>Montant payé</span><span class="${p}-mu" style="font-weight:400">sur <b class="${p}-m">400,00</b></span></div>
 <div class="${p}-mt"><input class="${p}-in ${p}-big" type="text" inputmode="decimal" value="250,00" aria-label="Montant payé (CHF)"><button class="${p}-all">Tout · <b class="${p}-m">400,00</b></button></div>
 <div class="${p}-rest" data-etat="paiement-partiel"><span class="${p}-tg ${p}-pay">reste à payer · <b class="${p}-m">150,00</b></span><span class="${p}-mu">paiement partiel</span></div>
 <div class="${p}-lb"><span>Payé le</span><span class="${p}-mu" style="font-weight:400">9 nov. 2026</span></div>
 <div class="${p}-seg"><button class="${p}-on">Aujourd'hui</button><button>Hier</button><button>Autre date</button></div>
 <div class="${p}-lb"><span>Avec</span></div>
 <div class="${p}-seg"><button class="${p}-on">Banque</button><button>TWINT</button><button>Espèces</button><button>Autre</button></div>
 <div class="${p}-ft"><button class="${p}-b2">Annuler</button><button class="${p}-b1">✓ Payer <span class="${p}-m">250,00</span></button></div>
</section>`,
});

V['m2pa-b'] = (p) => ({
  titre: 'Payer, froide : un seul geste, le reste à un toucher',
  css: `
.${p}-sh{padding-bottom:16px}
.${p}-l1{display:flex;align-items:center;gap:8px;font-size:15px;margin-bottom:12px}
.${p}-l1 span{flex:1}
.${p}-go{width:100%;min-height:64px;border-radius:20px;background:#111;color:#fff;display:flex;align-items:center;gap:12px;padding:0 18px;text-align:left}
.${p}-go b{font-size:18px}
.${p}-go small{display:block;font-size:13px;color:#C9C9C9;font-weight:400}
.${p}-go .${p}-m{margin-left:auto;font-size:22px}
.${p}-oth{display:flex;align-items:center;justify-content:center;gap:4px;width:100%;min-height:44px;margin-top:4px;font-size:15px;color:#2F6EA8;font-weight:600}
.${p}-sep{margin:6px 0 2px;border-top:1px solid #EBEBEB}
.${p}-ln{display:grid;grid-template-columns:58px 1fr;align-items:center;gap:8px;min-height:48px;border-bottom:1px solid #F0F0F0}
.${p}-ln label{font-size:14px;color:#555}
.${p}-chips{display:flex;gap:6px;flex-wrap:wrap}
.${p}-chips button{min-height:36px;padding:0 10px;border-radius:999px;border:1px solid #DADADA;font-size:14px}
.${p}-chips .${p}-on{background:#111;border-color:#111;color:#fff;font-weight:600}
input.${p}-in.${p}-a{font-family:"IBM Plex Mono",monospace;font-weight:600;font-size:18px;text-align:right;width:130px}
.${p}-rest{font-size:13px;margin-left:8px}
`,
  corps: `${fond(p)}
<section class="${p}-sh" aria-label="Payer">
 <div class="${p}-grab"></div>
 <div class="${p}-l1"><span><b>Loyer de l'atelier</b> <span class="${p}-mu">· Atelier</span></span><span class="${p}-tg ${p}-pay" style="flex:none">à payer · 25 nov.</span></div>
 <button class="${p}-go" data-booster="paye-un-geste"><span><b>✓ Tout payé</b><small>aujourd'hui · banque</small></span><span class="${p}-m">400,00</span></button>
 <button class="${p}-oth" aria-expanded="true">Autre montant, date ou moyen ${ic.bas(14, '#2F6EA8')}</button>
 <div class="${p}-ln"><label>Montant</label><span style="display:flex;align-items:center"><input class="${p}-in ${p}-a" type="text" inputmode="decimal" value="250,00" aria-label="Montant payé (CHF)"><span class="${p}-rest ${p}-tg ${p}-pay">reste <b class="${p}-m">150,00</b></span></span></div>
 <div class="${p}-ln"><label>Le</label><span class="${p}-chips"><button class="${p}-on">9 nov.</button><button>8 nov.</button><button>…</button></span></div>
 <div class="${p}-ln"><label>Avec</label><span class="${p}-chips"><button class="${p}-on">banque</button><button>TWINT</button><button>espèces</button><button>autre</button></span></div>
 <button class="${p}-go" style="min-height:52px;margin-top:12px;justify-content:center"><b>✓ Payer 250,00</b></button>
</section>`,
});

V['m2pa-c'] = (p) => ({
  titre: 'Payer, chaude : la barre du loyer se tire, le mois bouge sous les yeux',
  css: `
.${p}-hd2{display:flex;align-items:center;gap:8px}
.${p}-hd2 b{flex:1;font-size:17px}
.${p}-hd2 b small{font-size:13px;color:#555;font-weight:400}
.${p}-q{font-size:13px;color:#444;margin:12px 0 6px;font-weight:600}
.${p}-slide{position:relative;height:56px;margin:0 2px}
.${p}-trk{position:absolute;left:0;right:0;top:10px;height:36px;border-radius:12px;overflow:hidden;display:flex}
.${p}-trk i{display:block}
.${p}-kn{position:absolute;top:2px;width:30px;height:52px;margin-left:-15px;border-radius:12px;background:#fff;border:2px solid #111;box-shadow:0 3px 8px rgba(0,0,0,.25);display:grid;place-items:center}
.${p}-kn:before{content:"";width:2px;height:20px;background:#111;box-shadow:5px 0 0 #111,-5px 0 0 #111}
.${p}-tk{display:flex;justify-content:space-between;font-size:12px;color:#555;margin:2px 2px 0}
.${p}-vals{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.${p}-v{border-radius:14px;padding:6px 10px;display:flex;flex-direction:column}
.${p}-v span{font-size:12px}
.${p}-v input{font:inherit;font-family:"IBM Plex Mono",monospace;font-weight:600;font-size:22px;border:0;background:transparent;width:100%;padding:0;color:inherit;min-height:32px}
.${p}-eff{margin-top:14px;border-radius:16px;background:#FAF8F3;padding:10px 12px}
.${p}-eff h4{font-size:13px;color:#444;font-weight:600;display:flex;justify-content:space-between}
.${p}-cmp{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:end;margin-top:8px}
.${p}-pile{width:66px;height:84px;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:2px}
.${p}-pile .${p}-st{width:56px}
.${p}-pile b{font-size:12px}
.${p}-kv div{display:flex;justify-content:space-between;align-items:center;font-size:14px;min-height:26px;border-bottom:1px solid #EFEAE0}
.${p}-kv s{color:#888;font-size:12px;margin-right:6px}
.${p}-when{display:flex;gap:6px;margin-top:12px;align-items:center;font-size:14px}
.${p}-when button{min-height:40px;padding:0 12px;border-radius:12px;border:1px solid #DADADA}
.${p}-when .${p}-on{background:#111;color:#fff;border-color:#111;font-weight:600}
.${p}-ft{display:flex;gap:8px;margin-top:14px}
.${p}-ft .${p}-b1{flex:1}
`,
  corps: `${fond(p)}
<section class="${p}-sh" aria-label="Payer">
 <div class="${p}-grab"></div>
 <div class="${p}-hd2">${sq(p, 'fixes').replace(`class="${p}-sq"`, `class="${p}-sq" style="width:26px;height:26px;border-radius:9px;display:grid;place-items:center"`).replace('" style="background', ';background')}<b>Loyer de l'atelier <small>· à payer le 25 nov.</small></b><button class="${p}-x" aria-label="Fermer">${ic.x}</button></div>
 <div style="height:14px"></div>
 <div class="${p}-slide" data-booster="barre-a-tirer" data-etat="paiement-partiel">
  <div class="${p}-trk"><i style="flex:250;background:#9856D2"></i><i class="${p}-hat" style="flex:150"></i></div>
  <span class="${p}-kn" style="left:62.5%"></span>
 </div>
 <div class="${p}-tk"><span>0</span><span>200</span><span>400,00 · tout</span></div>
 <div class="${p}-vals">
  <label class="${p}-v" style="background:#F1E8FA;color:#3F2556"><span>payé maintenant</span><input type="text" inputmode="decimal" value="250,00" aria-label="Montant payé (CHF)"></label>
  <div class="${p}-v ${p}-hat" style="color:#5A410A"><span style="background:#FFF7E6;align-self:flex-start;padding:0 4px;border-radius:4px">reste à payer</span><b class="${p}-m" style="font-size:22px;line-height:32px;background:#FFF7E6;align-self:flex-start;padding:0 4px;border-radius:6px">150,00</b></div>
 </div>
 <div class="${p}-when"><span class="${p}-mu">Le</span><button class="${p}-on">aujourd'hui</button><button>autre</button><span class="${p}-mu" style="margin-left:4px">avec</span><button class="${p}-on">banque</button><button aria-label="Autres moyens">${ic.bas(14, '#333')}</button></div>
 <div class="${p}-eff" data-booster="effet-sur-le-mois"><h4><span>Novembre, après ce paiement</span><span class="${p}-mu" style="font-weight:400">Fixes</span></h4>
  <div class="${p}-cmp">
   <div class="${p}-pile"><b class="${p}-m">468,00</b><span class="${p}-st" style="height:62px"><i class="${p}-hat" style="flex:150"></i><i style="flex:318;background:#9856D2"></i></span></div>
   <div class="${p}-kv">
    <div><span>payé</span><span><s class="${p}-m">296,80</s><b class="${p}-m">546,80</b></span></div>
    <div><span>à payer</span><span><s class="${p}-m">400,00</s><b class="${p}-m">150,00</b></span></div>
    <div style="border:0"><span>dépensé</span><b class="${p}-m">696,80</b></div>
   </div>
  </div>
 </div>
 <div class="${p}-ft"><button class="${p}-b2">Annuler</button><button class="${p}-b1">✓ Payer <span class="${p}-m">250,00</span></button></div>
</section>`,
});

V['m2pa-d'] = (p) => ({
  titre: 'Payer, libre : un virement à l\'Atelier solde le retard d\'abord',
  css: `
.${p}-hd2{display:flex;align-items:flex-start;gap:8px}
.${p}-hd2 div{flex:1}
.${p}-hd2 b{display:block;font-size:18px;line-height:22px}
.${p}-hd2 span{font-size:13px;color:#555}
.${p}-who{display:flex;align-items:center;gap:10px;margin:12px 0 8px}
.${p}-who span{flex:1;font-size:15px;font-weight:600;color:#333}
.${p}-who input{font:inherit;font-family:"IBM Plex Mono",monospace;font-weight:600;font-size:24px;width:150px;text-align:right;background:#fff;border:1px solid #DADADA;border-radius:12px;color:#111;height:52px;padding:0 12px}
.${p}-cap{font-size:12px;color:#666;margin:10px 2px 4px}
.${p}-it{display:grid;grid-template-columns:28px 5px 1fr auto;gap:0 9px;align-items:center;min-height:62px;border-bottom:1px solid #F0F0F0}
.${p}-ck{width:26px;height:26px;border-radius:8px;border:2px solid #111;display:grid;place-items:center;background:#111;color:#fff;font-size:15px;font-weight:700}
.${p}-it .${p}-br{align-self:stretch;margin:10px 0;border-radius:2px}
.${p}-it b{font-size:15px}
.${p}-it .${p}-meta{margin-top:3px}
.${p}-fill{text-align:right}
.${p}-fill .${p}-m{font-size:15px;display:block}
.${p}-fill small{font-size:12px}
.${p}-flow{display:flex;height:14px;border-radius:7px;overflow:hidden;margin:10px 0 4px}
.${p}-fk{display:flex;justify-content:space-between;font-size:12px;color:#555}
.${p}-ft{display:grid;grid-template-columns:1fr 1.7fr;gap:8px;margin-top:16px}
.${p}-row2{display:flex;gap:6px;margin-top:10px;font-size:14px;align-items:center}
.${p}-row2 button{min-height:40px;padding:0 12px;border-radius:12px;border:1px solid #DADADA}
.${p}-row2 .${p}-on{background:#111;color:#fff;border-color:#111;font-weight:600}
`,
  corps: `${fond(p)}
<section class="${p}-sh" aria-label="Payer l'Atelier">
 <div class="${p}-grab"></div>
 <div class="${p}-hd2"><div><b>Payer l'Atelier</b><span>2 pièces à payer au même fournisseur</span></div><button class="${p}-x" aria-label="Fermer">${ic.x}</button></div>
 <div class="${p}-who" data-booster="un-virement"><span>Ton virement</span><input type="text" inputmode="decimal" value="300,00" aria-label="Montant du virement (CHF)"></div>
 <div class="${p}-flow" data-booster="repartition" data-etat="paiement-partiel"><i style="flex:60;background:#D6453D"></i><i style="flex:240;background:#9856D2"></i><i class="${p}-hat" style="flex:160"></i></div>
 <div class="${p}-fk"><span>retard 60,00</span><span>loyer 240,00</span><span>reste 160,00</span></div>
 <p class="${p}-cap">Le plus ancien d'abord</p>
 <div class="${p}-it"><span class="${p}-ck">✓</span><span class="${p}-br" style="background:#D6453D"></span><span><b>Solde atelier · ancienne année</b><span class="${p}-meta"><span class="${p}-tg ${p}-late">depuis le 20 déc. 2025</span></span></span><span class="${p}-fill"><span class="${p}-m">60,00</span><small style="color:#22663A">✓ soldé</small></span></div>
 <div class="${p}-it"><span class="${p}-ck">✓</span><span class="${p}-br ${p}-hat"></span><span><b>Loyer de l'atelier</b><span class="${p}-meta"><span class="${p}-tg ${p}-pay">à payer · 25 nov.</span></span></span><span class="${p}-fill"><span class="${p}-m">240,00</span><small class="${p}-mu">sur 400,00 · reste 160,00</small></span></div>
 <div class="${p}-row2"><span class="${p}-mu">Le</span><button class="${p}-on">aujourd'hui</button><button>autre</button><span class="${p}-mu">avec</span><button class="${p}-on">banque</button><button aria-label="Autres moyens">${ic.bas(14, '#333')}</button></div>
 <div class="${p}-ft"><button class="${p}-b2">Annuler</button><button class="${p}-b1">✓ Payer <span class="${p}-m">300,00</span></button></div>
</section>`,
});

/* ───────────── m2mo : Modifier et « + pièce » (Nettoyant alcalin, 42,00, payé 9 nov., sans pièce) ───────────── */
V['m2mo-a'] = (p) => ({
  titre: 'Modifier, tiède : la pièce en tête, les champs rangés',
  css: `
.${p}-hd2{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.${p}-hd2 .${p}-sq{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;flex:none}
.${p}-hd2 b{flex:1;font-size:18px}
.${p}-drop{border:2px dashed #C9B98A;border-radius:18px;background:#FDFAF1;padding:12px;display:grid;grid-template-columns:1.25fr 1fr;gap:8px}
.${p}-drop p{grid-column:1/3;font-size:14px;color:#6E500F;display:flex;align-items:center;gap:6px}
.${p}-drop .${p}-b1,.${p}-drop .${p}-b2{min-height:48px}
.${p}-f{display:block;margin-top:10px}
.${p}-f>span{display:block;font-size:13px;font-weight:600;color:#444;margin-bottom:4px}
.${p}-g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.${p}-f>span.${p}-sel,.${p}-f>span.${p}-lock{display:flex}
.${p}-sel{display:flex;align-items:center;gap:8px;height:44px;border:1px solid #DADADA;border-radius:12px;padding:0 10px;font-size:16px}
.${p}-sel .${p}-sq{width:20px;height:20px;border-radius:7px;display:grid;place-items:center}
.${p}-sel em{margin-left:auto;font-style:normal}
.${p}-lock{display:flex;align-items:center;gap:8px;height:44px;border:1px solid #E6E6E6;background:#F7F7F7;border-radius:12px;padding:0 10px}
.${p}-lock .${p}-m{font-size:17px;margin-left:auto;color:#333}
.${p}-why{font-size:12px;color:#666;margin-top:4px}
.${p}-why a{color:#2F6EA8}
.${p}-drv{display:flex;align-items:center;gap:8px;margin-top:12px;padding:4px 10px;border-radius:12px;background:#EEF4FA;font-size:14px}
.${p}-drv span{flex:1;color:#2B4A66}
.${p}-drv button{min-height:36px;display:flex;align-items:center;gap:4px;color:#2F6EA8;font-weight:600;font-size:13px}
.${p}-ft{display:grid;grid-template-columns:1fr 1.6fr;gap:8px;margin-top:16px}
`,
  corps: `${fond(p)}
<section class="${p}-sh" aria-label="Modifier l'opération">
 <div class="${p}-grab"></div>
 <div class="${p}-hd2">${sq(p, 'nettoyage')}<b>Nettoyant alcalin</b><button class="${p}-x" aria-label="Fermer">${ic.x}</button></div>
 <div class="${p}-drop" data-booster="piece-d-abord"><p>${ic.doc(false, 18)}Pas encore de pièce</p><button class="${p}-b1">${ic.cam(20)}Photo du ticket</button><button class="${p}-b2">${ic.fichier(18)}Fichier ou PDF</button></div>
 <label class="${p}-f"><span>Nom</span><input class="${p}-in" type="text" value="Nettoyant alcalin"></label>
 <div class="${p}-g2"><label class="${p}-f"><span>Catégorie</span><span class="${p}-sel">${sq(p, 'nettoyage').replace(`class="${p}-sq"`, `class="${p}-sq"`)}Nettoyage<em>${ic.bas(14)}</em></span></label><label class="${p}-f"><span>Précision</span><input class="${p}-in" type="text" value="CIP" placeholder="CIP, malt, outillage…"></label></div>
 <div class="${p}-g2"><label class="${p}-f"><span>Date</span><input class="${p}-in" type="text" inputmode="numeric" value="09.11.2026"></label><div class="${p}-f"><span>Montant</span><span class="${p}-lock">${ic.cad()}<span class="${p}-mu" style="font-size:13px">sans TVA</span><b class="${p}-m">42,00</b></span></div></div>
 <p class="${p}-why">Déjà payé : <a href="#">avoir</a> ou <a href="#">annuler l'opération</a></p>
 <label class="${p}-f"><span>Fournisseur, n° de pièce</span><input class="${p}-in" type="text" value="Comptoir du brasseur · ticket 5521"></label>
 <div class="${p}-drv">${ic.dossier()}<span>Drive · Novembre › Nettoyage</span><button>${ic.copie()}Copier le lien</button></div>
 <div class="${p}-ft"><button class="${p}-b2">Annuler</button><button class="${p}-b1">Enregistrer</button></div>
</section>`,
});

V['m2mo-b'] = (p) => ({
  titre: 'Modifier, froide : « + pièce » ouvre l\'appareil photo, la feuille ne fait que confirmer',
  css: `
.${p}-step{display:flex;align-items:center;gap:8px;font-size:12px;color:#666;margin-bottom:10px}
.${p}-step i{width:22px;height:22px;border-radius:50%;background:#111;color:#fff;display:grid;place-items:center;font-style:normal;font-size:12px;font-weight:700}
.${p}-step i.${p}-off{background:#E8F5EC;color:#22663A}
.${p}-step span{flex:none}
.${p}-step b{flex:1;border-top:1px solid #DADADA}
.${p}-shot{display:grid;grid-template-columns:132px 1fr;gap:12px;align-items:center}
.${p}-tk{height:150px;border-radius:10px;background:#FFFEFA;box-shadow:0 2px 10px rgba(0,0,0,.18);padding:10px 9px;font-family:"IBM Plex Mono",monospace;font-size:7.5px;line-height:11px;color:#333;transform:rotate(-3deg);position:relative;overflow:hidden}
.${p}-tk b{font-size:9.5px;display:block;text-align:center;letter-spacing:.04em}
.${p}-tk hr{border:0;border-top:1px dashed #AAA;margin:4px 0}
.${p}-tk p{display:flex;justify-content:space-between}
.${p}-ok2{font-size:17px;font-weight:600;display:flex;align-items:center;gap:6px;color:#22663A}
.${p}-row{margin-top:8px}
.${p}-row .${p}-op{padding:6px 0;border:0}
.${p}-mini2{display:flex;gap:6px;margin-top:8px}
.${p}-mini2 button{min-height:36px;padding:0 12px;border-radius:12px;background:#F5F5F5;font-size:14px;color:#444}
.${p}-match{display:flex;align-items:center;gap:6px;margin-top:12px;padding:8px 10px;border-radius:12px;background:#F1FAF3;font-size:13px;color:#22663A}
.${p}-ft{display:flex;gap:8px;margin-top:14px}
.${p}-ft .${p}-b1{flex:1;min-height:52px}
.${p}-det{display:flex;align-items:center;gap:8px;min-height:44px;margin-top:8px;border-top:1px solid #EBEBEB;font-size:15px}
.${p}-det span{flex:1}
.${p}-det em{font-style:normal;color:#555;font-size:13px}
`,
  corps: `${fond(p)}
<section class="${p}-sh" aria-label="+ pièce">
 <div class="${p}-grab"></div>
 <div class="${p}-step"><i class="${p}-off">✓</i><span>photo prise</span><b></b><i>2</i><span>joindre</span></div>
 <div class="${p}-shot">
  <div class="${p}-tk" aria-label="Le ticket photographié"><b>COMPTOIR DU BRASSEUR</b>Rue des Malteurs 4<hr><p><span>09.11.26</span><span>N° 5521</span></p><hr><p><span>NETTOYANT 5L</span><span>42.00</span></p><hr><p><b style="display:inline;font-size:9.5px">TOTAL CHF</b><b style="display:inline;font-size:9.5px">42.00</b></p></div>
  <div><p class="${p}-ok2">${ic.doc(true, 20)}Ticket prêt</p><p class="${p}-mu" style="font-size:14px;margin-top:2px">ticket-5521.jpg</p>
   <div class="${p}-mini2"><button>${ic.cam(15, '#444')} Reprendre</button></div></div>
 </div>
 <div class="${p}-match" data-booster="concorde">✓ même montant que l'opération</div>
 <div class="${p}-row"><div class="${p}-op"><span class="${p}-bar" style="background:#56C1D2"></span><span class="${p}-q">Nettoyant alcalin <small>· Comptoir du brasseur</small></span><span class="${p}-a ${p}-m">42,00</span><span class="${p}-meta"><span class="${p}-tg ${p}-ok">✓ payé 9 nov.</span><span class="${p}-pc" style="color:#22663A">${ic.doc(true)}ticket</span></span></div></div>
 <div class="${p}-ft"><button class="${p}-b1">Joindre la pièce</button></div>
 <div class="${p}-det"><span>Modifier les détails</span><em>nom, catégorie, date, fournisseur</em>${ic.chev()}</div>
</section>`,
});

V['m2mo-c'] = (p) => ({
  titre: 'Modifier, chaude : la rangée s\'édite sur place, le mois compte ses pièces',
  css: `
.${p}-pcs{border-radius:16px;background:#FAF8F3;padding:10px 12px 10px}
.${p}-pcs h4{display:flex;justify-content:space-between;align-items:baseline;font-size:13px;color:#444;font-weight:600}
.${p}-pcs h4 b{font-size:18px;color:#111}
.${p}-dots{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-top:8px}
.${p}-dt{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11px;color:#555;line-height:13px;text-align:center}
.${p}-dt span:first-child{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#fff;border:1px solid #E4E0D6;color:#555}
.${p}-dt.${p}-no span:first-child{color:#7A5500;border-style:dashed;border-color:#D9C08A}
.${p}-dt.${p}-cur span:first-child{border:2px solid #111;color:#22663A;background:#E8F5EC;box-shadow:0 0 0 3px rgba(17,17,17,.08)}
.${p}-ed{margin-top:14px;border:2px solid #111;border-radius:16px;padding:10px 12px}
.${p}-ed .${p}-l{display:flex;align-items:baseline;gap:8px}
.${p}-e{border-bottom:2px solid #BCD2E8;padding-bottom:1px}
.${p}-ed .${p}-nm{font-size:18px;font-weight:600}
.${p}-ed .${p}-amt{margin-left:auto;font-size:20px;display:flex;align-items:center;gap:5px;color:#333}
.${p}-ed .${p}-l2{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;align-items:center}
.${p}-chip{display:inline-flex;align-items:center;gap:5px;min-height:34px;padding:0 10px;border-radius:999px;border:1px solid #BCD2E8;background:#F5F9FD;font-size:14px;color:#1F3F5E}
.${p}-chip .${p}-sq{width:18px;height:18px;border-radius:6px;display:grid;place-items:center}
.${p}-act{border-style:solid;border-color:#2F6EA8;background:#fff;box-shadow:0 0 0 3px rgba(47,110,168,.15)}
.${p}-kb{margin-top:10px;display:flex;gap:6px;flex-wrap:wrap}
.${p}-kb button{min-height:36px;padding:0 10px;border-radius:12px;background:#fff;border:1px solid #DADADA;font-size:14px;display:flex;align-items:center;gap:5px}
.${p}-kb .${p}-on{border:2px solid #111;font-weight:600}
.${p}-kb .${p}-sq{width:18px;height:18px;border-radius:6px;display:grid;place-items:center}
.${p}-pj{display:flex;align-items:center;gap:10px;margin-top:12px;padding:8px 10px;border-radius:14px;background:#F1FAF3;color:#22663A;font-size:14px}
.${p}-pj .${p}-tx{flex:1}
.${p}-th{width:40px;height:50px;border-radius:5px;background:#FFFEFA;box-shadow:0 1px 4px rgba(0,0,0,.25);position:relative;transform:rotate(-4deg)}
.${p}-th:before{content:"";position:absolute;left:6px;right:6px;top:8px;height:22px;background:repeating-linear-gradient(#999 0 1px,transparent 1px 5px)}
.${p}-ft{display:grid;grid-template-columns:1fr 1.6fr;gap:8px;margin-top:14px}
.${p}-hint{font-size:12px;color:#666;margin-top:6px}
`,
  corps: `${fond(p)}
<section class="${p}-sh" aria-label="Modifier sur place">
 <div class="${p}-grab"></div>
 <div class="${p}-pcs" data-booster="pieces-du-mois"><h4><span>Pièces de novembre</span><span><b class="${p}-m">4</b> / 6 · il en manque 2</span></h4>
  <div class="${p}-dots">
   <span class="${p}-dt ${p}-no"><span>${ic.doc(false, 18)}</span><span>Loyer</span></span>
   <span class="${p}-dt"><span>${ic.doc(true, 18)}</span><span>Électr.</span></span>
   <span class="${p}-dt"><span>${ic.doc(true, 18)}</span><span>Marché</span></span>
   <span class="${p}-dt"><span>${ic.doc(true, 18)}</span><span>Malt</span></span>
   <span class="${p}-dt ${p}-cur"><span>${ic.doc(true, 18)}</span><span><b>Nettoyant</b></span></span>
   <span class="${p}-dt ${p}-no"><span>${ic.doc(false, 18)}</span><span>Joints</span></span>
  </div>
 </div>
 <div class="${p}-ed" data-booster="edition-sur-place">
  <div class="${p}-l"><span class="${p}-nm ${p}-e">Nettoyant alcalin</span><span class="${p}-amt ${p}-m">${ic.cad(13)}42,00</span></div>
  <div class="${p}-l2"><span class="${p}-chip ${p}-act">${sq(p, 'nettoyage')}Nettoyage · CIP</span><span class="${p}-chip">9 nov. 2026</span><span class="${p}-chip">Comptoir du brasseur · 5521</span></div>
  <div class="${p}-kb" aria-label="Catégorie">
   <button>${sq(p, 'brassage')}Brassage</button><button>${sq(p, 'materiel')}Matériel</button><button>${sq(p, 'fixes')}Fixes</button><button>Local</button><button>Autres</button>
  </div>
 </div>
 <div class="${p}-pj"><span class="${p}-th"></span><span class="${p}-tx"><b>ticket-5521.jpg</b><br>joint · dossier Nettoyage / nov.</span><button class="${p}-mini" style="min-height:32px">Retirer</button></div>
 <div class="${p}-ft"><button class="${p}-b2">Annuler</button><button class="${p}-b1">Enregistrer</button></div>
</section>`,
});

V['m2mo-d'] = (p) => ({
  titre: 'Modifier, libre : la tournée des pièces, une photo par opération qui en manque',
  css: `
body{background:#fff;color:#111}
.${p}-top{display:flex;align-items:center;gap:10px;height:56px;padding:0 12px}
.${p}-top b{flex:1;font-size:17px}
.${p}-prog{display:flex;gap:5px;padding:0 12px}
.${p}-prog i{flex:1;height:4px;border-radius:2px;background:#E4E4E4}
.${p}-prog i.${p}-done{background:#56C1D2}
.${p}-prog i.${p}-now{background:#111}
.${p}-vf{position:relative;margin:14px 12px 0;height:330px;border-radius:22px;overflow:hidden;background:radial-gradient(120% 80% at 50% 40%,#5B5246,#2A2620)}
.${p}-tk{position:absolute;left:50%;top:60px;width:170px;height:240px;margin-left:-85px;background:#F7F3E8;transform:rotate(4deg);box-shadow:0 10px 30px rgba(0,0,0,.5);padding:14px 12px;font-family:"IBM Plex Mono",monospace;font-size:10px;line-height:15px;color:#333}
.${p}-tk b{display:block;text-align:center;font-size:11px}
.${p}-tk hr{border:0;border-top:1px dashed #999;margin:5px 0}
.${p}-tk p{display:flex;justify-content:space-between}
.${p}-cn{position:absolute;width:34px;height:34px;border:4px solid #FFD25A}
.${p}-lu{position:absolute;left:12px;right:12px;top:12px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.${p}-lu span{color:#fff;background:rgba(17,17,17,.78);border-radius:999px;padding:4px 10px;font-size:13px;display:flex;gap:5px;align-items:center}
.${p}-card{margin:-26px 22px 0;position:relative;background:#fff;color:#111;border-radius:18px;padding:10px 12px;box-shadow:0 8px 20px rgba(0,0,0,.4)}
.${p}-card .${p}-op{padding:0;border:0}
.${p}-next{display:flex;gap:8px;margin:10px 12px 0;overflow:hidden}
.${p}-nx{flex:none;width:170px;border-radius:14px;background:#FAF8F3;border:1px solid #E4E0D6;padding:8px 10px;font-size:13px;color:#555}
.${p}-nx b{display:block;color:#111;font-size:14px}
.${p}-ctl{display:grid;grid-template-columns:1fr 84px 1fr;align-items:center;margin:16px 12px 0}
.${p}-ctl button.${p}-sk{min-height:44px;color:#333;font-size:15px}
.${p}-sh2{width:78px;height:78px;border-radius:50%;border:5px solid #111;display:grid;place-items:center;justify-self:center}
.${p}-sh2 span{width:58px;height:58px;border-radius:50%;background:#111}
.${p}-alt{display:flex;justify-content:center;gap:8px;margin:12px 0 22px}
.${p}-alt button{min-height:44px;padding:0 14px;border-radius:12px;background:#F5F5F5;border:1px solid #DADADA;color:#333;font-size:14px;display:flex;align-items:center;gap:6px}
`,
  corps: `<div class="${p}-top"><b>Tournée des pièces · 2 sur 4</b><button class="${p}-x" aria-label="Fermer">${ic.x}</button></div>
<div class="${p}-prog" data-booster="tournee"><i class="${p}-done"></i><i class="${p}-now"></i><i></i><i></i></div>
<div class="${p}-vf" aria-label="Viseur">
 <div class="${p}-tk"><b>COMPTOIR DU BRASSEUR</b>Rue des Malteurs 4<hr><p><span>09.11.2026</span><span>5521</span></p><hr><p><span>NETTOYANT ALC.5L</span><span>42.00</span></p><hr><p><b style="display:inline">TOTAL</b><b style="display:inline">42.00</b></p><p><span>Carte</span><span>42.00</span></p></div>
 <span class="${p}-cn" style="left:72px;top:50px;border-right:0;border-bottom:0;border-radius:8px 0 0 0"></span><span class="${p}-cn" style="right:72px;top:50px;border-left:0;border-bottom:0;border-radius:0 8px 0 0"></span><span class="${p}-cn" style="left:72px;bottom:24px;border-right:0;border-top:0;border-radius:0 0 0 8px"></span><span class="${p}-cn" style="right:72px;bottom:24px;border-left:0;border-top:0;border-radius:0 0 8px 0"></span>
 <div class="${p}-lu"><span>✓ Comptoir du brasseur</span><span>✓ 42,00</span><span>✓ 9 nov.</span></div>
</div>
<div class="${p}-card"><div class="${p}-op"><span class="${p}-bar" style="background:#56C1D2"></span><span class="${p}-q">Nettoyant alcalin <small>· Comptoir du brasseur</small></span><span class="${p}-a ${p}-m">42,00</span><span class="${p}-meta"><span class="${p}-tg ${p}-ok">✓ payé 9 nov.</span><span class="${p}-pc ${p}-no">${ic.doc(false)}sans pièce</span><span class="${p}-lk" style="margin-left:auto;font-size:13px">Détails</span></span></div></div>
<div class="${p}-ctl"><button class="${p}-sk">‹ Précédente</button><button class="${p}-sh2" aria-label="Photographier la pièce"><span></span></button><button class="${p}-sk">Passer ›</button></div>
<div class="${p}-alt"><button>${ic.fichier(16, '#333')}Un fichier ou PDF</button><button>Pas de pièce</button></div>
<div class="${p}-next"><div class="${p}-nx" style="opacity:.55"><b>✓ Loyer de l'atelier</b>bail joint</div><div class="${p}-nx"><b>Joints de la cuve</b>28,60 · Inox &amp; Co</div><div class="${p}-nx"><b>Solde atelier · 2025</b>60,00 · Atelier</div></div>
<div style="height:22px"></div>`,
});

export { V, page, ic, sq, LIGNES, fond, pref };
