// Socle commun des mini maquettes m1 : jetons et pièces de v6a (règle n° 1), recopiés tels quels.
// Le préfixe « ~- » devient « <id>- » par split/join (L26), jamais par remplacement de chaîne.
export const CSS = `
@font-face{font-family:"Source Sans 3";font-weight:400;src:url(../fonts/SourceSans3-400.woff2) format("woff2")}
@font-face{font-family:"Source Sans 3";font-weight:600;src:url(../fonts/SourceSans3-600.woff2) format("woff2")}
@font-face{font-family:"Source Sans 3";font-weight:700;src:url(../fonts/SourceSans3-700.woff2) format("woff2")}
@font-face{font-family:"IBM Plex Mono";font-weight:500;src:url(../fonts/IBMPlexMono-500.woff2) format("woff2")}
@font-face{font-family:"IBM Plex Mono";font-weight:600;src:url(../fonts/IBMPlexMono-600.woff2) format("woff2")}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Source Sans 3",system-ui,sans-serif;color:#111;background:#fff;font-size:14px;line-height:18px;width:390px;overflow-x:hidden}
.~-m{font-family:"IBM Plex Mono",ui-monospace,monospace;font-variant-numeric:tabular-nums;font-weight:600}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
input{font:inherit;color:inherit}
.~-hd{display:flex;align-items:center;gap:8px;height:52px;padding:0 10px;border-bottom:1px solid #EBEBEB}
.~-logo{width:30px;height:30px;border-radius:10px;background:#111;display:grid;place-items:center}
.~-hd b{font-size:18px;font-weight:600;flex:1}
.~-ic{width:32px;height:32px;border-radius:10px;display:grid;place-items:center}
.~-bx{background:#F5F5F5;border:1px solid #DADADA}
.~-tabs{display:flex;margin:0 10px;border-bottom:1px solid #DADADA}
.~-tabs a{flex:1;text-align:center;padding:8px 0;font-size:14px;color:#444;text-decoration:none}
.~-tabs a.~-on{color:#2F6EA8;font-weight:600;box-shadow:inset 0 -3px 0 #2F6EA8}
.~-band{margin:8px 10px 0;border-radius:16px;background:#FAF8F3;padding:6px 8px 8px}
.~-top{display:flex;align-items:center;gap:6px}
.~-pill{display:flex;align-items:center;gap:2px;border-radius:16px;background:#fff;border:1px solid #E4E0D6;padding:1px}
.~-pill button{width:28px;height:28px;border-radius:50%;font-size:17px}
.~-pill b{font-size:15px;padding:0 4px}
.~-due{margin-left:auto;display:flex;align-items:center;gap:5px;min-height:28px;padding:0 9px;border-radius:16px;background:#FDF1F0;border:1px solid #F1C9C5;font-size:13px;color:#8E2A23}
.~-due i{width:8px;height:8px;border-radius:50%;background:#D6453D}
.~-piles{display:grid;grid-template-columns:1.15fr 8px 1fr 1fr 1fr 10px .9fr;align-items:end;height:112px;gap:4px;margin-top:6px}
.~-p{display:flex;flex-direction:column;justify-content:flex-end;height:100%;gap:2px;text-align:center}
.~-p b{font-size:12px;line-height:14px;white-space:nowrap;letter-spacing:-.4px}
.~-st{border-radius:10px 6px 2px 2px;display:flex;flex-direction:column;overflow:hidden}
.~-st i{display:block}
.~-hat{background:repeating-linear-gradient(135deg,#E3B55D 0 4px,#FCEFD2 4px 8px);box-shadow:inset 0 0 0 1px #C99A3A}
.~-sep{height:100%;border-left:1px dashed #BDBDBD;justify-self:center}
.~-base{display:grid;grid-template-columns:1.15fr 8px 1fr 1fr 1fr 10px .9fr;gap:4px;border-top:2px solid #111;padding-top:3px}
.~-base span{font-size:12px;color:#333;text-align:center;line-height:14px}
.~-key{display:flex;gap:10px;margin-top:6px;font-size:12px;color:#444;align-items:center;flex-wrap:wrap}
.~-key span{display:flex;align-items:center;gap:4px}
.~-key i{width:13px;height:11px;border-radius:3px;display:inline-block}
.~-key b{font-size:13px;color:#111}
.~-g{display:grid;grid-template-columns:22px 1fr auto;gap:6px;align-items:center;padding:5px 10px 1px;background:#fff}
.~-g .~-sq{width:22px;height:22px;border-radius:10px;display:grid;place-items:center}
.~-g b{font-size:13px;letter-spacing:.02em}
.~-g .~-sub{font-size:13px;color:#444}
.~-op{display:grid;grid-template-columns:4px 1fr auto;column-gap:8px;padding:2px 10px 5px 10px;border-bottom:1px solid #F0F0F0;align-items:center;background:#fff}
.~-bar{grid-row:1/3;align-self:stretch;border-radius:2px}
.~-q{font-size:14px;font-weight:600;line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.~-q small{font-weight:400;color:#555;font-size:13px}
.~-a{font-size:14px;text-align:right}
.~-meta{display:flex;align-items:center;gap:6px;font-size:12px;color:#555;line-height:16px;min-height:18px}
.~-tg{display:inline-flex;align-items:center;gap:3px;padding:0 6px;border-radius:999px;line-height:16px;font-size:12px;white-space:nowrap}
.~-ok{background:#E8F5EC;color:#22663A}
.~-pay{background:repeating-linear-gradient(135deg,#FBEBC9 0 4px,#FFF7E6 4px 8px);color:#6E500F;box-shadow:inset 0 0 0 1px #E3C27E}
.~-late{background:#FDECEA;color:#8E2A23;box-shadow:inset 0 0 0 1px #F1C9C5}
.~-pc{display:inline-flex;align-items:center;gap:2px;color:#555;white-space:nowrap}
.~-pc.~-no{color:#7A5500}
.~-act{grid-column:3;justify-self:end;margin:1px 0 -4px}
.~-btn{min-height:24px;padding:0 10px;border-radius:16px;background:#111;color:#fff;font-size:13px;font-weight:600}
.~-mini{min-height:24px;padding:0 7px;border-radius:10px;border:1px solid #D9D9D9;font-size:12px;color:#444;background:#fff}
.~-part{margin:4px 10px 0;border-top:1px dashed #BDBDBD}
.~-foot{display:flex;gap:6px;flex-wrap:wrap;padding:10px}
.~-foot button{min-height:30px;padding:0 10px;border-radius:10px;background:#F5F5F5;font-size:13px;color:#444;display:inline-flex;align-items:center;gap:4px}
.~-foot .~-ia{border:1px dashed #A9C9E8;background:#fff;color:#2F6EA8}
.~-foot .~-prs{background:#111;color:#fff;font-weight:600}
.~-foot .~-urg{background:#FDF1F0;color:#8E2A23;box-shadow:inset 0 0 0 1px #F1C9C5}
.~-n{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#D6453D;color:#fff;font-size:12px;font-weight:600;line-height:18px}
.~-prs .~-n{background:#fff;color:#111}
.~-ex{font-size:12px;color:#666;padding:0 10px}
.~-nav{position:relative;height:64px;background:#fff;border-top:1px solid #EBEBEB;display:flex;padding-right:76px;margin-top:12px}
.~-nav a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:12px;color:#444;text-decoration:none;max-width:110px}
.~-nav a.~-on{background:#E6EFF8;color:#111;font-weight:600;box-shadow:inset 0 3px 0 #2F6EA8}
.~-fab{position:absolute;right:10px;top:6px;width:60px;height:52px;border-radius:26px;background:#111;color:#fff;font-size:30px}
.~-back{position:relative}
.~-voile::after{content:"";position:absolute;inset:0;background:rgba(17,17,17,.44)}
.~-sheet{position:relative;z-index:2;background:#fff;border-radius:20px 20px 0 0;box-shadow:0 -10px 30px rgba(0,0,0,.25);padding:6px 12px 16px}
.~-grab{width:40px;height:4px;border-radius:2px;background:#CFCFCF;margin:0 auto 8px}
.~-shd{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.~-shd h2{font-size:18px;line-height:22px;font-weight:700;flex:1}
.~-x{width:32px;height:32px;border-radius:10px;background:#F5F5F5;display:grid;place-items:center;font-size:20px;color:#444}
.~-cta{width:100%;min-height:44px;border-radius:14px;background:#111;color:#fff;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px}
.~-sec{min-height:44px;border-radius:14px;background:#F5F5F5;color:#111;font-weight:600;padding:0 14px}
.~-lien{color:#2F6EA8;font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:4px;min-height:28px}
`;

const DOC_OK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M7 3h7l4 4v14H7z"/><path d="M9.5 14l2 2 3.5-4"/></svg>';
const DOC_NO = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="3 2.4"><path d="M7 3h7l4 4v14H7z"/></svg>';
export const ICONES = { DOC_OK, DOC_NO,
  boite: (c = '#111', s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2"><path d="M3 5h18v4H3zM5 9v10h14V9M10 13h4"/></svg>`,
};

export const CAT = {
  fixes: { bg: '#3F2556', st: '#D8B9F4', p: '<path d="M4 11l8-6 8 6v9H4z"/>', bar: '#9856D2', nom: 'Charges fixes' },
  ventes: { bg: '#255633', st: '#B9F4CA', p: '<path d="M12 6v12M6 12h12"/>', bar: '#56D27B', nom: 'Ventes' },
  brassage: { bg: '#564925', st: '#F4E5B9', p: '<path d="M12 21V8M12 8c-3 0-4-3-4-5 2 0 4 1 4 5z"/>', bar: '#D2B356', nom: 'Brassage' },
  nettoyage: { bg: '#254F56', st: '#B9ECF4', p: '<path d="M12 3c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12z"/>', bar: '#56C1D2', nom: 'Nettoyage' },
  materiel: { bg: '#253356', st: '#B9CAF4', p: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>', bar: '#567BD2', nom: 'Matériel' },
  retard: { bg: '#6E1F1A', st: '#F8C9C4', p: '<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>', bar: '#D6453D', nom: 'En retard' },
  local: { bg: '#4A3B2E', st: '#EBD6C2', p: '<path d="M4 20V9l8-5 8 5v11M9 20v-6h6v6"/>', bar: '#B08A66', nom: 'Local et travaux' },
  autres: { bg: '#3A3A3A', st: '#DDDDDD', p: '<circle cx="7" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="17" cy="12" r="1.5"/>', bar: '#8A8A8A', nom: 'Autres frais' },
  apports: { bg: '#24484A', st: '#BFE6E0', p: '<path d="M12 4v16M5 13l7 7 7-7"/>', bar: '#4FA79A', nom: 'Apports privés' },
};
export const sq = (k, s = 22, i = 14) => `<span class="~-sq" style="width:${s}px;height:${s}px;border-radius:${s > 26 ? 12 : 10}px;background:${CAT[k].bg};display:grid;place-items:center"><svg width="${i}" height="${i}" viewBox="0 0 24 24" fill="none" stroke="${CAT[k].st}" stroke-width="2.8">${CAT[k].p}</svg></span>`;

export const head = () => `<header class="~-hd">
  <span class="~-logo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F2C14E" stroke-width="2.2"><path d="M6 5h10v15H6z"/><path d="M16 9h3v6h-3"/></svg></span>
  <b>L'Affinée</b>
  <span class="~-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#444" stroke-width="1.8"><path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/></svg></span>
  <button class="~-ic ~-bx" aria-label="Rechercher"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="1.8"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></svg></button>
  <button class="~-ic ~-bx" aria-label="Menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="#111"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg></button>
</header>`;
export const tabs = () => `<nav class="~-tabs"><a href="#">Synthèse</a><a href="#" class="~-on">Opérations</a><a href="#">Prévisions</a><a href="#">Annuel</a></nav>`;

/** La bande de v6a, telle quelle (novembre), ou les mêmes pièces sur d'autres données (archives). */
export function band(o = {}) {
  const d = Object.assign({ mois: 'novembre', due: '60,00', v: ['+720,00', 88], f: ['468,00', 57, 400, 68], b: ['186,80', 23], n: ['42,00', 6], m: ['28,60', 4],
    paye: '325,40', apayer: '400,00', depense: '696,80', avant: '' }, o);
  const pile = (x, c) => `<div class="~-p"><b class="~-m">${x[0]}</b><span class="~-st" style="height:${x[1]}px"><i style="flex:1;background:${c}"></i></span></div>`;
  const fix = d.f[2] ? `<div class="~-p"><b class="~-m">${d.f[0]}</b><span class="~-st" style="height:${d.f[1]}px"><i class="~-hat" style="flex:${d.f[2]}"></i><i style="flex:${d.f[3]};background:#9856D2"></i></span></div>` : pile(d.f, '#9856D2');
  return `<section class="~-band">
   <div class="~-top"><span class="~-pill"><button>‹</button>${d.avant}<b>${d.mois}</b><button>›</button></span>${d.due ? `<button class="~-due"><i></i>en retard <b class="~-m">${d.due}</b></button>` : ''}</div>
   <div class="~-piles">
    <div class="~-p"><b class="~-m" style="color:#2A7240">${d.v[0]}</b><span class="~-st" style="height:${d.v[1]}px"><i style="flex:1;background:#56D27B"></i></span></div>
    <span class="~-sep"></span>${fix}${pile(d.b, '#D2B356')}${pile(d.n, '#56C1D2')}<span class="~-sep"></span>${pile(d.m, '#567BD2')}
   </div>
   <div class="~-base"><span>Ventes</span><span></span><span>Fixes</span><span>Brassage</span><span>Nettoyage</span><span></span><span>Matériel</span></div>
   <div class="~-key"><span><i style="background:linear-gradient(90deg,#9856D2 25%,#D2B356 25% 50%,#56C1D2 50% 75%,#567BD2 75%)"></i>payé <b class="~-m">${d.paye}</b></span><span><i class="~-hat"></i>à payer <b class="~-m">${d.apayer}</b></span><span>dépensé <b class="~-m">${d.depense}</b></span></div>
  </section>`;
}

export const g = (k, nom, montant, couleur = '') => `<div class="~-g">${sq(k)}<b>${nom}</b><span class="~-sub ~-m"${couleur ? ` style="color:${couleur}"` : ''}>${montant}</span></div>`;
/** Une opération v6a : deux étages, barre de catégorie, pastille d'état, pièce, geste sous le montant. */
export function op(o) {
  const bar = o.hat ? '<span class="~-bar ~-hat"></span>' : `<span class="~-bar" style="background:${o.bar}"></span>`;
  const pc = o.pc ? `<span class="~-pc${o.pcNo ? ' ~-no' : ''}${o.pcCls ? ' ' + o.pcCls : ''}">${o.pcNo ? DOC_NO : DOC_OK}${o.pc}</span>` : '';
  return `<div class="~-op${o.cls ? ' ' + o.cls : ''}"${o.attr ?? ''}>${bar}
   <span class="~-q">${o.nom}${o.sub ? ` <small>· ${o.sub}</small>` : ''}</span><span class="~-a ~-m"${o.vert ? ' style="color:#2A7240"' : ''}>${o.montant}</span>
   <span class="~-meta"><span class="~-tg ~-${o.etat ?? 'ok'}${o.tgCls ? ' ' + o.tgCls : ''}">${o.tag}</span>${pc}</span>${o.act ?? ''}
  </div>`;
}
export const LIGNES = {
  loyer: (act = '<button class="~-btn ~-act">✓ Payé</button>', x = {}) => op({ hat: 1, nom: "Loyer de l'atelier", sub: 'Atelier', montant: '400,00', etat: 'pay', tag: 'à payer · 25 nov. · dans 16 j', pc: 'sans pièce', pcNo: 1, act, ...x }),
  elec: (x = {}) => op({ bar: '#9856D2', nom: 'Électricité', sub: 'Énergie', montant: '68,00', tag: '✓ payé 9 nov. · banque', pc: 'facture', ...x }),
  vente: (x = {}) => op({ bar: '#56D27B', nom: 'Vente au marché', sub: 'Marché du village', montant: '+720,00', vert: 1, tag: '✓ encaissé 9 nov. · banque', pc: 'ticket', ...x }),
  malt: (x = {}) => op({ bar: '#D2B356', nom: 'Malt et houblons · Pale Ale', sub: 'Comptoir du brasseur', montant: '186,80', tag: '✓ payé 9 nov.', pc: 'facture · Pilsner 25 kg', ...x }),
  nett: (act = '<button class="~-mini ~-act">+ pièce</button>', x = {}) => op({ bar: '#56C1D2', nom: 'Nettoyant alcalin', sub: 'Comptoir du brasseur', montant: '42,00', tag: '✓ payé 9 nov.', pc: 'sans pièce', pcNo: 1, act, ...x }),
  joints: (act = '<button class="~-mini ~-act">+ pièce</button>', x = {}) => op({ bar: '#567BD2', nom: 'Joints de la cuve', sub: 'Inox &amp; Co', montant: '28,60', tag: '✓ payé 9 nov.', pc: 'sans pièce', pcNo: 1, act, ...x }),
  solde: (act = '<button class="~-mini ~-act">✓ Payé</button>', x = {}) => op({ bar: '#D6453D', nom: 'Solde atelier · ancienne année', sub: 'Atelier', montant: '60,00', etat: 'late', tag: 'à payer depuis le 20 déc. 2025', pc: 'sans pièce', pcNo: 1, act, ...x }),
};
export const listeV6a = () => g('fixes', 'Charges fixes', '468,00') + LIGNES.loyer() + LIGNES.elec()
  + g('ventes', 'Ventes', '+720,00', '#2A7240') + LIGNES.vente() + g('brassage', 'Brassage', '186,80') + LIGNES.malt()
  + g('nettoyage', 'Nettoyage', '42,00') + LIGNES.nett() + '<div class="~-part"></div>' + g('materiel', 'Matériel · à part', '28,60') + LIGNES.joints()
  + g('retard', 'En retard · 2025', '60,00', '#8E2A23') + LIGNES.solde();

/** Le pied de v6a ; `o` marque le bouton enfoncé et ses compteurs. */
export function foot(o = {}) {
  const b = (k, txt) => `<button class="${o.on === k ? '~-prs' : o.urg === k ? '~-urg' : ''}">${txt}</button>`;
  return `<div class="~-foot">${o.ia === false ? '' : '<button class="~-ia">✦ Pourquoi les charges fixes pèsent autant ?</button>'}${b('date', 'Par date')}${b('filtres', `Filtres${o.nf ? ` <span class="~-n">${o.nf}</span>` : ''} ${o.on === 'filtres' ? '⌃' : '⌄'}`)}${b('doublons', `Doublons${o.nd ? ` <span class="~-n">${o.nd}</span>` : ''}`)}${o.apport === false ? '' : b('apport', 'Apport ou prélèvement privé')}${b('archives', 'Archives')}</div>`;
}
export const nav = () => `<nav class="~-nav">
  <a href="#"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#444" stroke-width="1.8"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>Bord</a>
  <a href="#" class="~-on"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2F6EA8" stroke-width="1.8"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M15 12h6"/></svg>Finances</a>
  <a href="#"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C87A2C" stroke-width="1.8"><path d="M6 6h10v14H6zM16 9h3v6h-3"/></svg>Brassins</a>
  <a href="#"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6E9B5B" stroke-width="1.8"><path d="M12 3l7 4v8l-7 4-7-4V7z"/></svg>Stocks</a>
  <a href="#"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#444" stroke-width="1.8"><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 3-5.5 6-5.5s6 2 6 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .6 3 2.5 3 5.5"/></svg>Clients</a>
  <button class="~-fab" aria-label="Ajouter">+</button>
</nav>`;
/** L'écran choisi derrière une feuille, voilé ; `chevauche` = px de la feuille posés dessus. */
export const derriere = (contenu, chevauche = 80) => `<div class="~-back ~-voile">${contenu}</div><div style="margin-top:-${chevauche}px"></div>`;

export function page(id, titre, cssVariante, corps) {
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${id} · ${titre}</title>
<style>${CSS}
${cssVariante}</style>
</head>
<body>
${corps}
</body>
</html>
`;
  return html.split('~-').join(`${id}-`);
}
