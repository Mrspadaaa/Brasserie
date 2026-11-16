// Construit les quatre mini maquettes s1a à s1d : v6a telle quelle (ref/v6a/etat.html), plus le seul filtre « du … au ».
// Chaque écran est un cadre de 390 px ; classes préfixées par l'id (L26), assemblées par split/join, sans remplacement de chaîne.
// Usage : node work/missions/2026-11-14-finances/voies/s1/build.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const pre = (p, s) => s.split('P-').join(p + '-');

// ---------- v6a : feuille de style reprise (seule la barre fixe devient absolue dans le cadre) ----------
const CSS_V6A = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Source Sans 3",system-ui,sans-serif;color:#111;background:#E9E7E1;font-size:14px;line-height:18px}
.P-m{font-family:"IBM Plex Mono",ui-monospace,monospace;font-variant-numeric:tabular-nums;font-weight:600}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
.P-hd{display:flex;align-items:center;gap:8px;height:52px;padding:0 10px;border-bottom:1px solid #EBEBEB}
.P-logo{width:30px;height:30px;border-radius:10px;background:#111;display:grid;place-items:center}
.P-hd b{font-size:18px;font-weight:600;flex:1}
.P-ic{width:32px;height:32px;border-radius:10px;display:grid;place-items:center}
.P-bx{background:#F5F5F5;border:1px solid #DADADA}
.P-app{padding-bottom:84px}
.P-tabs{display:flex;margin:0 10px;border-bottom:1px solid #DADADA}
.P-tabs a{flex:1;text-align:center;padding:8px 0;font-size:14px;color:#444;text-decoration:none}
.P-tabs a.P-on{color:#2F6EA8;font-weight:600;box-shadow:inset 0 -3px 0 #2F6EA8}
.P-band{margin:8px 10px 0;border-radius:16px;background:#FAF8F3;padding:6px 8px 8px}
.P-top{display:flex;align-items:center;gap:6px}
.P-pill{display:flex;align-items:center;gap:2px;border-radius:16px;background:#fff;border:1px solid #E4E0D6;padding:1px}
.P-pill>button{width:28px;height:28px;border-radius:50%;font-size:17px}
.P-pill b{font-size:15px;padding:0 4px}
.P-pill>.P-mo{width:auto;white-space:nowrap;font-size:15px}
.P-due{margin-left:auto;display:flex;align-items:center;gap:5px;min-height:28px;padding:0 9px;border-radius:16px;background:#FDF1F0;border:1px solid #F1C9C5;font-size:13px;color:#8E2A23;white-space:nowrap}
.P-due i{width:8px;height:8px;border-radius:50%;background:#D6453D}
.P-piles{display:grid;grid-template-columns:1.15fr 8px 1fr 1fr 1fr 10px .9fr;align-items:end;height:112px;gap:4px;margin-top:6px}
.P-p{display:flex;flex-direction:column;justify-content:flex-end;height:100%;gap:2px;text-align:center}
.P-p b{font-size:12px;line-height:14px}
.P-st{border-radius:10px 6px 2px 2px;display:flex;flex-direction:column;overflow:hidden}
.P-st i{display:block}
.P-hat{background:repeating-linear-gradient(135deg,#E3B55D 0 4px,#FCEFD2 4px 8px);box-shadow:inset 0 0 0 1px #C99A3A}
.P-sep{height:100%;border-left:1px dashed #BDBDBD;justify-self:center}
.P-base{display:grid;grid-template-columns:1.15fr 8px 1fr 1fr 1fr 10px .9fr;gap:4px;border-top:2px solid #111;padding-top:3px}
.P-base span{font-size:12px;color:#333;text-align:center;line-height:14px}
.P-key{display:flex;gap:10px;margin-top:6px;font-size:12px;color:#444;align-items:center;flex-wrap:wrap}
.P-key span{display:flex;align-items:center;gap:4px}
.P-key i{width:13px;height:11px;border-radius:3px;display:inline-block}
.P-key b{font-size:13px;color:#111}
.P-g{display:grid;grid-template-columns:22px 1fr auto;gap:6px;align-items:center;padding:5px 10px 1px;position:sticky;top:0;background:#fff}
.P-g .P-sq{width:22px;height:22px;border-radius:10px;display:grid;place-items:center}
.P-g b{font-size:13px;letter-spacing:.02em}
.P-g .P-sub{font-size:13px;color:#444}
.P-op{display:grid;grid-template-columns:4px 1fr auto;column-gap:8px;padding:2px 10px 5px 10px;border-bottom:1px solid #F0F0F0;align-items:center}
.P-bar{grid-row:1/3;align-self:stretch;border-radius:2px}
.P-q{font-size:14px;font-weight:600;line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.P-q small{font-weight:400;color:#555;font-size:13px}
.P-a{font-size:14px;text-align:right}
.P-meta{display:flex;align-items:center;gap:6px;font-size:12px;color:#555;line-height:16px;min-height:18px}
.P-tg{display:inline-flex;align-items:center;gap:3px;padding:0 6px;border-radius:999px;line-height:16px;font-size:12px}
.P-ok{background:#E8F5EC;color:#22663A}
.P-pay{background:repeating-linear-gradient(135deg,#FBEBC9 0 4px,#FFF7E6 4px 8px);color:#6E500F;box-shadow:inset 0 0 0 1px #E3C27E}
.P-late{background:#FDECEA;color:#8E2A23;box-shadow:inset 0 0 0 1px #F1C9C5}
.P-pc{display:inline-flex;align-items:center;gap:2px;color:#555}
.P-pc.P-no{color:#7A5500}
.P-act{grid-column:3;justify-self:end;margin:1px 0 -4px}
.P-btn{min-height:24px;padding:0 10px;border-radius:16px;background:#111;color:#fff;font-size:13px;font-weight:600}
.P-mini{min-height:24px;padding:0 7px;border-radius:10px;border:1px solid #D9D9D9;font-size:12px;color:#444;background:#fff}
.P-part{margin:4px 10px 0;border-top:1px dashed #BDBDBD}
.P-foot{display:flex;gap:6px;flex-wrap:wrap;padding:10px}
.P-foot button{min-height:30px;padding:0 10px;border-radius:10px;background:#F5F5F5;font-size:13px;color:#444}
.P-foot .P-ia{border:1px dashed #A9C9E8;background:#fff;color:#2F6EA8}
.P-ex{font-size:12px;color:#666;padding:0 10px}
.P-nav{position:absolute;left:0;right:0;bottom:0;height:64px;background:#fff;border-top:1px solid #EBEBEB;display:flex;padding-right:76px;z-index:5}
.P-nav a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:12px;color:#444;text-decoration:none;max-width:110px}
.P-nav a.P-on{background:#E6EFF8;color:#111;font-weight:600;box-shadow:inset 0 3px 0 #2F6EA8}
.P-fab{position:absolute;right:10px;bottom:6px;width:60px;height:52px;border-radius:26px;background:#111;color:#fff;font-size:30px;z-index:6}
/* planche : un cadre de téléphone par état */
.P-page{display:flex;flex-direction:column;align-items:center;gap:14px;padding:12px 0 24px}
.P-cap{width:390px;padding:0 10px;font-size:13px;line-height:17px;color:#333}
.P-cap b{color:#111}
.P-ecran{position:relative;width:390px;background:#fff;overflow:hidden}
.P-court{height:844px}
.P-ref{display:block;width:390px;height:auto;border:1px solid #DADADA}
/* commun au filtre : champ de date natif sous une étiquette lisible (le sélecteur du téléphone s'ouvre au toucher) */
.P-dt{position:relative;display:inline-flex;align-items:center;cursor:pointer}
.P-dt input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;font-size:16px}
.P-hors{font-size:12px;color:#555;padding:4px 10px 6px;display:flex;align-items:center;gap:6px}
`;

const SVG = {
  logo: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F2C14E" stroke-width="2.2"><path d="M6 5h10v15H6z"/><path d="M16 9h3v6h-3"/></svg>',
  pieceOk: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M7 3h7l4 4v14H7z"/><path d="M9.5 14l2 2 3.5-4"/></svg>',
  pieceNo: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="3 2.4"><path d="M7 3h7l4 4v14H7z"/></svg>',
  cal: (c = '#2F6EA8', s = 14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${(39.6 / s).toFixed(2)}" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>`,
  plage: (c = '#2F6EA8', s = 14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${(39.6 / s).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5v14M21 5v14M6.5 12h11M9.5 8.5 6 12l3.5 3.5M14.5 8.5 18 12l-3.5 3.5"/></svg>`,
  chev: (c = '#111', s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${(39.6 / s).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`,
};

const entete = `<header class="P-hd">
  <span class="P-logo">${SVG.logo}</span>
  <b>L'Affinée</b>
  <span class="P-ic" aria-label="Thème"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#444" stroke-width="1.8"><path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/></svg></span>
  <button class="P-ic P-bx" aria-label="Rechercher"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="1.8"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></svg></button>
  <button class="P-ic P-bx" aria-label="Menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="#111"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg></button>
</header>
<nav class="P-tabs" aria-label="Finances"><a href="#">Synthèse</a><a href="#" class="P-on">Opérations</a><a href="#">Prévisions</a><a href="#">Annuel</a></nav>`;

const retard = '<button class="P-due" data-booster="pastille-retard"><i></i>en retard <b class="P-m">60,00</b></button>';
export const pilleV6a = '<span class="P-pill"><button aria-label="Mois précédent">‹</button><b>novembre</b><button aria-label="Mois suivant">›</button></span>';

// Données v6a. Mois : tout novembre. Plage : du 1er au 15 nov. (le loyer du 25 nov. sort ; dépensé = 68 + 186,80 + 42).
const DONNEES = {
  mois: { fixesH: 57, fixes: '468,00', fixesPile: '<i class="P-hat" style="flex:400"></i><i style="flex:68;background:#9856D2"></i>', paye: '325,40', apayer: '400,00', depense: '696,80' },
  plage: { fixesH: 8, fixes: '68,00', fixesPile: '<i style="flex:1;background:#9856D2"></i>', paye: '325,40', apayer: '0,00', depense: '296,80' },
};

function bande(top, entre, mode, bornes = '') {
  const d = DONNEES[mode];
  return `<section class="P-band" aria-label="${mode === 'mois' ? 'Le mois par catégorie' : 'La plage par catégorie'}" data-booster="piles-basses">
   <div class="P-top">${top}</div>${entre}
   <div class="P-piles">
    <div class="P-p"><b class="P-m" style="color:#2A7240">+720,00</b><span class="P-st" style="height:88px"><i style="flex:1;background:#56D27B"></i></span></div>
    <span class="P-sep"></span>
    <div class="P-p"><b class="P-m">${d.fixes}</b><span class="P-st" style="height:${d.fixesH}px">${d.fixesPile}</span></div>
    <div class="P-p"><b class="P-m">186,80</b><span class="P-st" style="height:23px"><i style="flex:1;background:#D2B356"></i></span></div>
    <div class="P-p"><b class="P-m">42,00</b><span class="P-st" style="height:6px"><i style="flex:1;background:#56C1D2"></i></span></div>
    <span class="P-sep"></span>
    <div class="P-p"><b class="P-m">28,60</b><span class="P-st" style="height:4px"><i style="flex:1;background:#567BD2"></i></span></div>
   </div>
   <div class="P-base"><span>Ventes</span><span></span><span>Fixes</span><span>Brassage</span><span>Nettoyage</span><span></span><span>Matériel</span></div>
   <div class="P-key"><span><i style="background:linear-gradient(90deg,#9856D2 25%,#D2B356 25% 50%,#56C1D2 50% 75%,#567BD2 75%)"></i>payé <b class="P-m">${d.paye}</b></span><span><i class="P-hat"></i>à payer <b class="P-m">${d.apayer}</b></span><span>dépensé <b class="P-m">${d.depense}</b></span></div>${bornes}
  </section>`;
}

function liste(mode, hors) {
  const loyer = mode === 'mois' ? `
  <div class="P-op">
   <span class="P-bar P-hat"></span>
   <span class="P-q">Loyer de l'atelier <small>· Atelier</small></span><span class="P-a P-m">400,00</span>
   <span class="P-meta"><span class="P-tg P-pay">à payer · 25 nov. · dans 16 j</span><span class="P-pc P-no">${SVG.pieceNo}sans pièce</span></span>
   <button class="P-btn P-act" data-booster="paye-sur-ligne">✓ Payé</button>
  </div>` : '';
  const ia = mode === 'mois' ? 'Pourquoi les charges fixes pèsent autant ?' : 'Pourquoi le brassage pèse autant ?';
  return `<div data-mots="lignes" data-booster="lignes-entieres">
  <div class="P-g"><span class="P-sq" style="background:#3F2556"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D8B9F4" stroke-width="2.8"><path d="M4 11l8-6 8 6v9H4z"/></svg></span><b>Charges fixes</b><span class="P-sub P-m">${DONNEES[mode].fixes}</span></div>${loyer}
  <div class="P-op">
   <span class="P-bar" style="background:#9856D2"></span>
   <span class="P-q">Électricité <small>· Énergie</small></span><span class="P-a P-m">68,00</span>
   <span class="P-meta"><span class="P-tg P-ok">✓ payé 9 nov. · banque</span><span class="P-pc">${SVG.pieceOk}facture</span></span>
  </div>
  <div class="P-g"><span class="P-sq" style="background:#255633"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B9F4CA" stroke-width="2.8"><path d="M12 6v12M6 12h12"/></svg></span><b>Ventes</b><span class="P-sub P-m" style="color:#2A7240">+720,00</span></div>
  <div class="P-op">
   <span class="P-bar" style="background:#56D27B"></span>
   <span class="P-q">Vente au marché <small>· Marché du village</small></span><span class="P-a P-m" style="color:#2A7240">+720,00</span>
   <span class="P-meta"><span class="P-tg P-ok">✓ encaissé 9 nov. · banque</span><span class="P-pc">${SVG.pieceOk}ticket</span></span>
  </div>
  <div class="P-g"><span class="P-sq" style="background:#564925"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F4E5B9" stroke-width="2.8"><path d="M12 21V8M12 8c-3 0-4-3-4-5 2 0 4 1 4 5z"/></svg></span><b>Brassage</b><span class="P-sub P-m">186,80</span></div>
  <div class="P-op">
   <span class="P-bar" style="background:#D2B356"></span>
   <span class="P-q">Malt et houblons · Pale Ale <small>· Comptoir du brasseur</small></span><span class="P-a P-m">186,80</span>
   <span class="P-meta"><span class="P-tg P-ok">✓ payé 9 nov.</span><span class="P-pc">${SVG.pieceOk}facture · Pilsner 25 kg</span></span>
  </div>
  <div class="P-g"><span class="P-sq" style="background:#254F56"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B9ECF4" stroke-width="2.8"><path d="M12 3c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12z"/></svg></span><b>Nettoyage</b><span class="P-sub P-m">42,00</span></div>
  <div class="P-op">
   <span class="P-bar" style="background:#56C1D2"></span>
   <span class="P-q">Nettoyant alcalin <small>· Comptoir du brasseur</small></span><span class="P-a P-m">42,00</span>
   <span class="P-meta"><span class="P-tg P-ok">✓ payé 9 nov.</span><span class="P-pc P-no">${SVG.pieceNo}sans pièce</span></span>
   <button class="P-mini P-act">+ pièce</button>
  </div>
  <div class="P-part"></div>
  <div class="P-g"><span class="P-sq" style="background:#253356"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B9CAF4" stroke-width="2.8"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/></svg></span><b>Matériel · à part</b><span class="P-sub P-m">28,60</span></div>
  <div class="P-op">
   <span class="P-bar" style="background:#567BD2"></span>
   <span class="P-q">Joints de la cuve <small>· Inox &amp; Co</small></span><span class="P-a P-m">28,60</span>
   <span class="P-meta"><span class="P-tg P-ok">✓ payé 9 nov.</span><span class="P-pc P-no">${SVG.pieceNo}sans pièce</span></span>
   <button class="P-mini P-act">+ pièce</button>
  </div>
  <div class="P-g"><span class="P-sq" style="background:#6E1F1A"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F8C9C4" stroke-width="2.8"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg></span><b>En retard · 2025</b><span class="P-sub P-m" style="color:#8E2A23">60,00</span></div>
  <div class="P-op">
   <span class="P-bar" style="background:#D6453D"></span>
   <span class="P-q">Solde atelier · ancienne année <small>· Atelier</small></span><span class="P-a P-m">60,00</span>
   <span class="P-meta"><span class="P-tg P-late">à payer depuis le 20 déc. 2025</span><span class="P-pc P-no">${SVG.pieceNo}sans pièce</span></span>
   <button class="P-mini P-act">✓ Payé</button>
  </div>${mode === 'plage' ? hors : ''}
  <p class="P-ex">Pièces jointes : exemple.</p>
  <div class="P-foot"><button class="P-ia" data-booster="ia-expliquer">✦ ${ia}</button><button>Par date</button><button>Filtres ⌄</button><button>Doublons</button><button>Apport ou prélèvement privé</button><button>Archives</button></div>
 </div>`;
}

const nav = `<nav class="P-nav" aria-label="Navigation">
  <a href="#"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#444" stroke-width="1.8"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>Bord</a>
  <a href="#" class="P-on"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2F6EA8" stroke-width="1.8"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M15 12h6"/></svg>Finances</a>
  <a href="#"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C87A2C" stroke-width="1.8"><path d="M6 6h10v14H6zM16 9h3v6h-3"/></svg>Brassins</a>
  <a href="#"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6E9B5B" stroke-width="1.8"><path d="M12 3l7 4v8l-7 4-7-4V7z"/></svg>Stocks</a>
  <a href="#"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#444" stroke-width="1.8"><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 3-5.5 6-5.5s6 2 6 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .6 3 2.5 3 5.5"/></svg>Clients</a>
</nav>
<button class="P-fab" aria-label="Ajouter">+</button>`;

// Un écran : id d'état, légende hors cadre, haut de bande, rangée insérée, mode, bornes sous la clé, calque (feuille), court (844 px).
function ecran({ id, legende, top, entre = '', mode, bornes = '', calque = '', court = false, hors = '' }) {
  return `<p class="P-cap">${legende}</p>
<section class="P-ecran${court ? ' P-court' : ''}" id="${id}" data-etat="${id}">
${entete}
<div class="P-app">
 ${bande(top, entre, mode, bornes)}
 ${liste(mode, hors)}
</div>
${nav}${calque}
</section>`;
}

function page(id, titre, cssVariante, ecrans) {
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<link rel="stylesheet" href="../fonts/fonts.css">
<style>${CSS_V6A}${cssVariante}</style>
</head>
<body>
<main class="P-page">
<p class="P-cap"><b>Base</b> · « Lignes serrées v6a », son choix du 10.11, telle quelle : seul le filtre du … au … s’ajoute.</p>
<img class="P-ref" src="../../../ref/v6a/v6a-haut.png" width="390" alt="v6a, maquette choisie, haut de l’écran">
${ecrans.join('\n')}
</main>
<script>(function(){document.querySelectorAll('.P-dt input').forEach(function(i){i.addEventListener('click',function(){try{i.showPicker()}catch(e){}})});})();</script>
</body>
</html>
`;
  const p = join(ICI, id);
  mkdirSync(p, { recursive: true });
  writeFileSync(join(p, 'etat.html'), pre(id, html));
}

const hors = (texte) => `
  <p class="P-hors"><span class="P-tg P-pay">${texte}</span></p>`;
const HORS = hors("hors plage : loyer de l'atelier · 25 nov. · 400,00");

// ================= s1a — la feuille « du … au » s'ouvre depuis le nom du mois =================
{
  const css = `
.P-mo{display:flex;align-items:center;gap:3px;height:28px;padding:0 6px 0 4px;border-radius:14px}
.P-mo b{padding:0}
.P-pill.P-on{background:#E6EFF8;border-color:#A9C9E8}
.P-pill.P-on .P-mo{padding:0 4px 0 8px;gap:5px}
.P-pill.P-on .P-mo b{color:#1F4F7A}
.P-x{width:28px;height:28px;border-radius:50%;font-size:18px;color:#1F4F7A;display:grid;place-items:center}
.P-voile{position:absolute;inset:0;background:rgba(17,17,17,.42);z-index:7}
.P-feuille{position:absolute;left:0;right:0;bottom:0;z-index:8;background:#fff;border-radius:16px 16px 0 0;padding:6px 12px 14px;box-shadow:0 -6px 24px rgba(0,0,0,.18)}
.P-poignee{width:36px;height:4px;border-radius:2px;background:#D6D6D6;margin:0 auto 8px}
.P-ft{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.P-ft h3{font-size:15px;font-weight:600}
.P-lien{min-height:28px;padding:0 4px;color:#2F6EA8;font-size:13px;font-weight:600}
.P-champs{display:grid;grid-template-columns:1fr 18px 1fr;align-items:end;gap:4px}
.P-champ{display:flex;flex-direction:column;gap:3px}
.P-champ>span{font-size:12px;color:#555}
.P-champ .P-dt{height:44px;border:1px solid #DADADA;border-radius:10px;padding:0 10px;justify-content:space-between;font-size:15px;background:#fff}
.P-champ .P-dt.P-actif{border:2px solid #2F6EA8;padding:0 9px;background:#F4F8FC}
.P-fl{height:44px;display:grid;place-items:center;color:#555}
.P-apercu{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:10px 0 6px;font-size:13px;color:#444}
.P-apercu b{color:#111;font-size:13px}
.P-sort{margin-bottom:12px}
.P-go{width:100%;height:44px;border-radius:16px;background:#111;color:#fff;font-size:15px;font-weight:600}
`;
  const repos = `<span class="P-pill"><button aria-label="Mois précédent">‹</button><button class="P-mo" data-booster="feuille-plage" aria-label="Choisir une plage du … au …"><b>novembre</b>${SVG.cal()}</button><button aria-label="Mois suivant">›</button></span>${retard}`;
  const apres = `<span class="P-pill P-on"><button class="P-mo" data-booster="feuille-plage" aria-label="Changer la plage">${SVG.cal('#1F4F7A')}<b>1 → 15 nov.</b></button><button class="P-x" aria-label="Revenir à tout novembre">×</button></span>${retard}`;
  const feuille = `<div class="P-voile"></div>
<div class="P-feuille" role="dialog" aria-label="Plage du … au …">
 <div class="P-poignee"></div>
 <div class="P-ft"><h3>Du … au …</h3><button class="P-lien">Tout novembre</button></div>
 <div class="P-champs">
  <label class="P-champ"><span>du</span><span class="P-dt">dim. 1 nov. 2026 ${SVG.cal('#666', 16)}<input type="date" value="2026-11-01" aria-label="du"></span></label>
  <span class="P-fl">→</span>
  <label class="P-champ"><span>au</span><span class="P-dt P-actif">dim. 15 nov. 2026 ${SVG.cal('#2F6EA8', 16)}<input type="date" value="2026-11-15" aria-label="au"></span></label>
 </div>
 <div class="P-apercu" data-booster="apercu-effet"><span>15 jours · 5 opérations</span><span>à payer <b class="P-m">0,00</b> · dépensé <b class="P-m">296,80</b></span></div>
 <div class="P-sort"><span class="P-tg P-pay">sort de la plage : loyer · 25 nov. · 400,00</span></div>
 <button class="P-go">Voir du 1 au 15 nov.</button>
</div>`;
  page('s1a', 's1a · v6a, la feuille « du … au » depuis le mois · 14.11', css, [
    ecran({ id: 'repos', legende: '<b>Repos</b> · novembre comme v6a ; le nom du mois porte un petit calendrier : il ouvre la plage.', top: repos, mode: 'mois' }),
    ecran({ id: 'geste', legende: '<b>Geste</b> · toucher « novembre » : une feuille, deux dates natives, l’effet lu avant de valider.', top: repos, mode: 'mois', calque: feuille, court: true }),
    ecran({ id: 'apres', legende: '<b>Après</b> · la pilule dit « 1 → 15 nov. » ; × revient à tout novembre. Graphe, liste et montants suivent.', top: apres, mode: 'plage', hors: HORS }),
  ]);
}

// ================= s1b — la pilule s'étire en deux bornes, les flèches font glisser la plage =================
{
  const css = `
.P-mo{display:flex;align-items:center;gap:3px;height:28px;padding:0 6px 0 4px;border-radius:14px}
.P-mo b{padding:0}
.P-pill.P-on{background:#E6EFF8;border-color:#A9C9E8;gap:3px}
.P-bo{height:26px;min-width:30px;justify-content:center;padding:0 7px;border-radius:13px;background:#fff;box-shadow:inset 0 0 0 1px #A9C9E8;font-size:15px;font-weight:600;color:#111}
.P-bo.P-actif{background:#2F6EA8;color:#fff;box-shadow:none}
.P-tir{color:#1F4F7A;font-weight:600}
.P-x{width:28px;height:28px;border-radius:50%;border:1px solid #E4E0D6;background:#fff;font-size:17px;color:#444;display:grid;place-items:center;flex:none}
.P-glis{display:flex;justify-content:space-between;margin:4px 2px 0;font-size:12px;color:#555}
.P-glis span{display:flex;align-items:center;gap:3px}
`;
  const repos = `<span class="P-pill"><button aria-label="Mois précédent">‹</button><button class="P-mo" data-booster="pilule-etiree" aria-label="Étirer en plage du … au …"><b>novembre</b>${SVG.plage('#2F6EA8', 16)}</button><button aria-label="Mois suivant">›</button></span>${retard}`;
  const pille = (au, actif) => `<span class="P-pill P-on" data-booster="pilule-etiree"><button aria-label="Décaler la plage en arrière">‹</button><span class="P-dt P-bo"><span>1</span><input type="date" value="2026-11-01" aria-label="du"></span><span class="P-tir">—</span><span class="P-dt P-bo${actif ? ' P-actif' : ''}"><span>${au} nov.</span><input type="date" value="2026-11-${au}" aria-label="au"></span><button aria-label="Décaler la plage en avant">›</button></span><button class="P-x" aria-label="Revenir à tout novembre">×</button>${retard}`;
  const glis = `<div class="P-glis" data-booster="glisser-plage"><span>‹ 17 → 31 oct.</span><span>16 → 30 nov. ›</span></div>`;
  page('s1b', 's1b · v6a, la pilule s’étire en deux bornes · 14.11', css, [
    ecran({ id: 'repos', legende: '<b>Repos</b> · v6a ; à côté du mois, le signe « étirer » : toucher « novembre » ouvre les bornes.', top: repos, mode: 'mois' }),
    ecran({ id: 'geste', legende: '<b>Geste</b> · la pilule s’étire du 1 au 30 nov. ; toucher « 30 nov. » ouvre le sélecteur de date du téléphone.', top: pille('30', true), mode: 'mois', court: true }),
    ecran({ id: 'apres', legende: '<b>Après</b> · « ‹ 1 — 15 nov. › » ; les flèches font glisser les 15 jours entiers (écrit dessous), × revient au mois.', top: pille('15', false), entre: glis, mode: 'plage', hors: HORS }),
  ]);
}

// ================= s1c — rangée « du … au » repliée sous la pilule, dépliée par un chevron =================
{
  const css = `
.P-chev{width:28px;height:28px;border-radius:50%;border:1px solid #E4E0D6;background:#fff;display:grid;place-items:center;flex:none}
.P-chev.P-ouv svg{transform:rotate(180deg)}
.P-chev.P-ouv{background:#E6EFF8;border-color:#A9C9E8}
.P-pill.P-ter b{color:#666;font-weight:600}
.P-rang{display:flex;align-items:center;gap:6px;margin-top:6px;padding:4px 4px 4px 8px;border-radius:10px;background:#fff;border:1px solid #E4E0D6}
.P-rang.P-pose{border-color:#A9C9E8;background:#F4F8FC}
.P-lb{font-size:12px;color:#555;flex:none}
.P-rang .P-dt{flex:1;height:32px;padding:0 8px;border-radius:10px;border:1px solid #DADADA;background:#fff;font-size:15px;justify-content:space-between}
.P-rang .P-dt.P-chg{border:2px solid #2F6EA8;padding:0 7px}
.P-rx{width:28px;height:28px;border-radius:50%;font-size:17px;color:#1F4F7A;display:grid;place-items:center;flex:none}
`;
  const top = (ouv, ter) => `<span class="P-pill${ter ? ' P-ter' : ''}"><button aria-label="Mois précédent">‹</button><b>novembre</b><button aria-label="Mois suivant">›</button></span><button class="P-chev${ouv ? ' P-ouv' : ''}" data-booster="rangee-plage" aria-expanded="${ouv}" aria-label="Plage du … au …">${SVG.chev()}</button>${retard}`;
  const rang = (au, pose) => `
   <div class="P-rang${pose ? ' P-pose' : ''}" data-booster="edition-sur-place"><span class="P-lb">du</span><span class="P-dt">dim. 1 nov.${SVG.cal('#666', 14)}<input type="date" value="2026-11-01" aria-label="du"></span><span class="P-lb">au</span><span class="P-dt${pose ? ' P-chg' : ''}">${au}${SVG.cal(pose ? '#2F6EA8' : '#666', 14)}<input type="date" value="2026-11-${pose ? '15' : '30'}" aria-label="au"></span>${pose ? '<button class="P-rx" aria-label="Revenir à tout novembre">×</button>' : ''}</div>`;
  page('s1c', 's1c · v6a, la rangée « du … au » sous la pilule · 14.11', css, [
    ecran({ id: 'repos', legende: '<b>Repos</b> · v6a ; un chevron ⌄ à côté du mois, la rangée est repliée.', top: top(false), mode: 'mois' }),
    ecran({ id: 'geste', legende: '<b>Geste</b> · le chevron déplie une rangée fine : du 1 au 30 nov., chaque date ouvre le sélecteur natif.', top: top(true), entre: rang('lun. 30 nov.', false), mode: 'mois', court: true }),
    ecran({ id: 'apres', legende: '<b>Après</b> · la rangée reste dépliée et teintée : du 1 au 15 nov. ; × revient à tout novembre.', top: top(true, true), entre: rang('dim. 15 nov.', true), mode: 'plage', hors: HORS }),
  ]);
}

// ================= s1d — bascule Mois | Plage dans la carte ; Plage montre deux feuillets datés =================
{
  const css = `
.P-seg{display:flex;align-items:center;gap:2px;padding:2px;border-radius:16px;background:#ECE8DF;flex:none}
.P-seg .P-pill{border-color:#E4E0D6}
.P-opt{display:flex;align-items:center;gap:4px;height:28px;padding:0 9px;border-radius:14px;font-size:13px;color:#444;font-weight:600}
.P-opt.P-sel{background:#fff;color:#1F4F7A;box-shadow:inset 0 0 0 1px #A9C9E8}
.P-tuiles{display:grid;grid-template-columns:1fr 44px 1fr;align-items:center;margin-top:6px}
.P-tuile{height:44px;display:flex;align-items:center;gap:7px;padding:0 10px;border-radius:10px;background:#fff;border:1px solid #A9C9E8}
.P-tuile .P-k{font-size:12px;color:#555}
.P-tuile .P-j{font-size:22px;line-height:24px;color:#1F4F7A}
.P-tuile .P-mm{display:flex;flex-direction:column;font-size:12px;line-height:14px;color:#333}
.P-tuile svg{margin-left:auto}
.P-duree{display:flex;flex-direction:column;align-items:center;font-size:12px;color:#555}
.P-duree i{width:100%;border-top:2px dashed #A9C9E8;display:block;margin-bottom:2px}
`;
  const repos = `<span class="P-seg" role="radiogroup" aria-label="Mois ou plage" data-booster="bascule-mois-plage"><span class="P-pill" role="radio" aria-checked="true"><button aria-label="Mois précédent">‹</button><b>novembre</b><button aria-label="Mois suivant">›</button></span><button class="P-opt" role="radio" aria-checked="false">${SVG.plage('#444', 13)}Plage</button></span>${retard}`;
  const apresTop = `<span class="P-seg" role="radiogroup" aria-label="Mois ou plage" data-booster="bascule-mois-plage"><button class="P-opt" role="radio" aria-checked="false">Mois</button><button class="P-opt P-sel" role="radio" aria-checked="true">${SVG.plage('#1F4F7A', 13)}Plage</button></span>${retard}`;
  const tuile = (k, j, m, w, v) => `<label class="P-dt P-tuile"><span class="P-k">${k}</span><b class="P-j P-m">${j}</b><span class="P-mm"><span>${m}</span><span>${w}</span></span>${SVG.cal('#2F6EA8', 16)}<input type="date" value="${v}" aria-label="${k}"></label>`;
  const tuiles = `
   <div class="P-tuiles" data-booster="feuillets-dates">${tuile('du', '1', 'nov.', 'dim.', '2026-11-01')}<span class="P-duree"><i></i><span class="P-m">15 j</span></span>${tuile('au', '15', 'nov.', 'dim.', '2026-11-15')}</div>`;
  page('s1d', 's1d · v6a, la bascule Mois | Plage dans la carte · 14.11', css, [
    ecran({ id: 'repos', legende: '<b>Repos</b> · la pilule du mois devient le segment « Mois » d’une bascule ; « Plage » attend à côté.', top: repos, mode: 'mois' }),
    ecran({ id: 'apres', legende: '<b>Après</b> · « Plage » : deux feuillets datés dans la carte, du 1 au 15 nov. ; « Mois » revient à novembre.', top: apresTop, entre: tuiles, mode: 'plage', hors: HORS }),
  ]);
}
console.log('construit s1a s1b s1c s1d');
