// node cmp-build.mjs : écrit cmp-<v>-<état>.html (9 versions × 3 états), mini maquettes statiques du Carnet (21.11).
// Axes : A Comparer à 390 (base g01-8, h04-7) ; B prix de l'article (base h06-5) ; C choisir → À venir (base g05-9).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const n = (x) => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// ---------- icônes (traits) ----------
const P = {
  chevL: '<path d="m15 18-6-6 6-6"/>', chevR: '<path d="m9 18 6-6-6-6"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  cam: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  pin: '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  pencil: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
  ext: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  bord: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  mug: '<path d="M17 11h1a3 3 0 0 1 0 6h-1"/><path d="M9 12v6M13 12v6"/><path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"/><path d="M5 8c0-3 2-5 6-5s6 2 6 5"/>',
  boxes: '<path d="M7 16.5 2.5 14v5l4.5 2.5 5-2.5v-5zM17 16.5 12 14v5l5 2.5 4.5-2.5v-5zM12 8 7 5.5v5.5l5 3 5-3V5.5z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  door: '<path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"/><path d="M3 21h18"/><path d="M14 12h.01"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>', chevU: '<path d="m18 15-6-6-6 6"/>',
};
const ic = (k, s = 20, cls = '') => `<svg class="ic ${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k]}</svg>`;
const pinPlein = (s = 18) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">${P.pin}</svg>`;

// Picto chambre froide : caisson, porte, flocon ; la largeur suit le volume.
function frigo(id, s = 52) {
  const w = { a: 30, b: 24, c: 36 }[id] ?? 30;
  const x = (48 - w) / 2;
  return `<svg class="frigo" width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><rect x="0" y="0" width="48" height="48" rx="10" fill="#eef2f6"/><rect x="${x}" y="9" width="${w}" height="32" rx="2" fill="#dfe6ee" stroke="#6f8399" stroke-width="2"/><rect x="${x + 4}" y="13" width="${w / 2 - 2}" height="24" rx="1" fill="#f6f8fa" stroke="#6f8399" stroke-width="1.5"/><rect x="${x + w / 2 - 1}" y="22" width="2" height="7" rx="1" fill="#6f8399"/><path d="M${x + w - 7} 14v8M${x + w - 10.5} 16l7 4M${x + w - 10.5} 20l7-4" stroke="#4F7E9B" stroke-width="1.6" stroke-linecap="round"/><rect x="${x - 3}" y="41" width="${w + 6}" height="2.5" rx="1" fill="#6f8399"/></svg>`;
}

// ---------- données d'exemple : « Chambre froide », 3 articles ----------
const BASE = {
  a: { id: 'a', nom: 'Cellule 180', court: 'Frigo-Plus', rv: 2, vol: '4,06', volN: 4.06, sol: '180×150', solL: 180, solP: 150, porte: 80, vendeur: 'Frigo-Plus', pays: 'CH', dispo: 'en stock', sem: 1, d0: 0, d1: 0, coul: '#E0A02E' },
  b: { id: 'b', nom: 'Compacte 150', court: 'Kälte', rv: 3, vol: '2,6', volN: 2.6, sol: '150×120', solL: 150, solP: 120, porte: 70, vendeur: 'Kälte Center', pays: 'CH', dispo: '3–4 sem.', sem: 4, d0: 3, d1: 4, coul: '#4F7E9B' },
  c: { id: 'c', nom: 'Pro 210', court: 'Bösch', rv: 1, vol: '5,9', volN: 5.9, sol: '210×180', solL: 210, solP: 180, porte: 90, vendeur: 'Bösch Kälte', pays: 'CH', dispo: '6 sem.', sem: 6, d0: 6, d1: 6, coul: '#6A4FB0' },
};
// Forme d'étiquette (B3), réutilisée en A1 et C.
const SH = (c = '') => `<svg class="sh ${c}" viewBox="0 0 104 56" preserveAspectRatio="none" aria-hidden="true"><path d="M17 1H96a7 7 0 0 1 7 7v40a7 7 0 0 1-7 7H17L1 28Z" vector-effect="non-scaling-stroke"/></svg>`;
// Prix par état. chf = connu ; des = « dès » ; inconnu = lien sans prix ; devis = sur demande ; eur = boutique allemande.
const ETATS = {
  repos: { a: { chf: 4900, src: 'lu' }, b: { chf: 3350, src: 'saisi' }, c: { des: 5400, src: 'lu' }, ordre: ['b', 'a', 'c'], par: 'prix' },
  sans: { a: { inconnu: true }, b: { inconnu: true }, c: { devis: true }, ordre: ['c', 'a', 'b'], par: 'volume' },
  eur: { a: { chf: 4900, src: 'lu' }, b: { eur: 2513, rendu: 3000, src: 'lu', vendeur: 'Kühlzellen24', pays: 'DE' }, c: { des: 5400, src: 'lu' }, ordre: ['b', 'a', 'c'], par: 'prix' },
};
const art = (etat, id) => ({ ...BASE[id], ...(ETATS[etat][id].vendeur ? { vendeur: ETATS[etat][id].vendeur, court: ETATS[etat][id].vendeur, pays: ETATS[etat][id].pays } : {}), prix: ETATS[etat][id] });
const valeur = (p) => p.chf ?? p.rendu ?? p.des ?? null;
const dispoCls = (a) => (a.sem <= 1 ? 'vert' : 'brun');

// ---------- décor commun (base : en-tête, champ, + volant, onglets) ----------
const CSS = `
:root{--ink:#111;--txt:#333;--mut:#666;--line:#ddd;--line2:#bfbfbf;--s1:#f5f5f5;--s2:#ebebeb;--stk:#4c6b2a;--ok:#3f6b2e;--vc:#e7efdc;--bdg:#8a5212;--bdgc:#f8eedd;--ach:#2b64a6;--achc:#e4edf8;--rge:#b3261e;--rgec:#f9e4e2;--straw:#F2C14E}
*{box-sizing:border-box}
html,body{margin:0}
body{width:390px;height:844px;overflow:hidden;position:relative;background:#fff;color:var(--txt);font:16px/1.3 "Source Sans 3","Segoe UI",system-ui,sans-serif}
.mono{font-family:"IBM Plex Mono",ui-monospace,monospace;font-variant-numeric:tabular-nums;letter-spacing:-.3px}
.ic{flex:none;vertical-align:middle}
header.app{height:58px;display:flex;align-items:center;gap:8px;padding:0 12px;border-bottom:1px solid var(--line)}
.logo{width:40px;height:40px;border-radius:10px;background:#1b1b1b;display:grid;place-items:center}
.marque{font-size:18px;font-weight:600;color:var(--ink);flex:1}
.mois{display:flex;align-items:center;border:1.5px solid var(--line2);border-radius:12px;height:40px}
.mois span{padding:0 9px;display:grid;place-items:center;height:100%}
.mois .m{border-left:1.5px solid var(--line2);border-right:1.5px solid var(--line2);font-size:16px;font-weight:600;color:var(--ink);padding:0 12px}
.rond{width:40px;height:40px;border-radius:12px;border:1.5px solid var(--line2);display:grid;place-items:center;color:var(--ink)}
.av{display:flex}.av b{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:15px}
.av b:first-child{background:#111;color:#fff}.av b:last-child{background:#e6e6e6;color:#111;margin-left:-8px}
main{padding:8px 14px 150px}
.retour{display:flex;align-items:center;justify-content:space-between;height:40px}
.retour a{color:#2f5e86;font-size:18px;display:flex;align-items:center;gap:2px;text-decoration:none}
.etiq{font-size:15px;padding:4px 12px;border-radius:999px;background:var(--vc);color:var(--stk);font-weight:600}
h1{margin:2px 0 0;font-size:26px;line-height:1.1;color:var(--ink);font-weight:800}
.sous{font-size:15px;color:var(--mut);margin:2px 0 8px}
.ajout{position:absolute;left:12px;right:86px;bottom:76px;height:54px;border:1.5px solid var(--line2);border-radius:27px;background:#fff;display:flex;align-items:center;padding:0 14px 0 18px;gap:14px;color:#555}
.ajout span{flex:1;font-size:17px;color:#777;white-space:nowrap;overflow:hidden}
.fab{position:absolute;right:12px;bottom:74px;width:62px;height:62px;border-radius:18px;background:#111;color:#fff;display:grid;place-items:center;border:0;box-shadow:0 4px 10px rgba(0,0,0,.25)}
nav.onglets{position:absolute;left:0;right:0;bottom:0;height:64px;border-top:1px solid var(--line);background:#fafafa;display:grid;grid-template-columns:repeat(6,1fr)}
nav.onglets a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:14px;color:#333;text-decoration:none;position:relative}
nav.onglets a.on{background:#eef2e8;color:#111;font-weight:600}
nav.onglets a.on::before{content:"";position:absolute;top:0;left:22%;right:22%;height:3px;background:var(--stk)}
nav .t-fin{color:#2b64a6}nav .t-cal{color:#C87A2C}nav .t-bra{color:#A0522D}nav .t-sto{color:var(--stk)}
.pd{display:inline-flex;align-items:center;justify-content:center;gap:4px;border:2px dashed #9a9a96;border-radius:10px;color:#777;font-weight:700;background:#fff}
.vert{color:var(--ok)}.brun{color:var(--bdg)}.rouge{color:var(--rge)}
.rang{width:30px;height:30px;border-radius:50%;border:2px solid #bbb;display:grid;place-items:center;font-weight:700;font-size:16px;color:#333;flex:none;background:#fff}
.rang.r1{background:var(--stk);border-color:var(--stk);color:#fff}
.rang.q{border-style:dashed;color:#999}
.toggle{width:46px;height:28px;border-radius:14px;background:var(--stk);position:relative;flex:none}
.toggle::after{content:"";position:absolute;right:3px;top:3px;width:22px;height:22px;border-radius:50%;background:#fff}
.toggle.off{background:#d5d5d2}.toggle.off::after{right:auto;left:3px}
.pie{font-size:14px;color:var(--mut);margin-top:6px}
`;
const ENTETE = `<header class="app"><span class="logo"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h11v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="#F2C14E"/><path d="M16 9h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" fill="none" stroke="#F2C14E" stroke-width="2"/><path d="M5 6c0-2 2-3 5.5-3S16 4 16 6" fill="#fff"/></svg></span><span class="marque">L'Affinée</span><span class="mois"><span>${ic('chevL', 18)}</span><span class="m">Nov.</span><span>${ic('chevR', 18)}</span></span><span class="rond">${ic('search', 20)}</span><span class="av"><b>G</b><b>A</b></span></header>`;
const PIED = `<div class="ajout"><span>Ajouter à Chambre froide…</span>${ic('cam', 22)}${ic('mic', 22)}</div>
<button class="fab" aria-label="Ajouter">${ic('plus', 30)}</button>
<nav class="onglets"><a href="#">${ic('bord', 22)}Bord</a><a href="#"><span class="t-fin">${ic('wallet', 22)}</span>Finances</a><a href="#"><span class="t-cal">${ic('cal', 22)}</span>Calendrier</a><a href="#"><span class="t-bra">${ic('mug', 22)}</span>Brassins</a><a class="on" href="#"><span class="t-sto">${ic('boxes', 22)}</span>Stocks</a><a href="#">${ic('users', 22)}Clients</a></nav>`;
const page = (titre, css, corps) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=390, initial-scale=1"><title>${titre}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Source+Sans+3:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}${css}</style></head><body>${ENTETE}<main>${corps}</main>${PIED}</body></html>`;

// =====================================================================================
// AXE A — Comparer à 390
// =====================================================================================
const comparerTete = (droite = '') => `<div class="retour"><a href="#">${ic('chevL', 20)}Chambre froide</a>${droite}</div><h1>Comparer</h1><div class="sous">1 façon · 3 articles</div>`;

// Cellule prix commune aux versions A.
function prixA(p, gros = 17) {
  if (p.inconnu) return `<span class="pd" style="min-width:58px;height:32px;font-size:16px">?</span>`;
  if (p.devis) return `<span class="pd" style="height:32px;padding:0 6px;font-size:15px">${ic('scan', 16)}devis</span>`;
  if (p.eur) return `<span class="brun mono" style="font-size:${gros}px;font-weight:600">≈${n(p.rendu)}</span><small class="eur mono">${n(p.eur)} €</small>`;
  if (p.des) return `<small class="des">dès</small><span class="mono" style="font-size:${gros}px;font-weight:600">${n(p.des)}</span>`;
  return `<span class="mono" style="font-size:${gros}px;font-weight:600">${n(p.chf)}</span>`;
}

function prixA1(p) {
  if (p.inconnu) return `<span class="hach">?</span>`;
  if (p.devis) return `<span class="tgm">${SH('vide')}<span class="in">${ic('scan', 15)}Devis</span></span>`;
  return prixA(p);
}

// ---- A1 : colonnes-cartes, épingle sur la ligne ----
const A1_CSS = `
.hach{width:64px;height:30px;border-radius:8px;border:2px dashed #a3a39e;background:repeating-linear-gradient(135deg,#ececea 0 5px,#fff 5px 10px);display:grid;place-items:center;font-weight:700;color:#777;font-size:17px}
.tgm{position:relative;width:82px;height:34px;display:block}
.tgm .sh{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.tgm .sh path{fill:#fff;stroke:#a3a39e;stroke-width:2;stroke-dasharray:5 4}
.tgm .in{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:3px;padding-left:12px;font-size:15px;font-weight:700;color:var(--stk)}
.plan{display:block;border:2px solid #6f8399;background:#eef2f6;border-radius:2px;margin-bottom:3px}
.chaine{display:flex;align-items:center;gap:6px;font-size:15px;color:var(--mut);margin:0 0 8px;flex-wrap:wrap}
.chaine b{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;background:var(--s2);color:#222;font-weight:600}
.chaine b.on{background:#1f1f1d;color:#fff}.chaine b.trou{background:#fff;border:2px dashed #aaa;color:#888}
.tb{display:grid;grid-template-columns:84px repeat(3,1fr);column-gap:6px}
.tb>div{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:50px;border-bottom:1px solid #eee;text-align:center;padding:4px 2px}
.tb .lb{align-items:flex-start;text-align:left;font-size:15px;color:#444;flex-direction:row;justify-content:flex-start;gap:5px;align-items:center}
.tb .lb small{display:block;font-size:14px;color:#888}
.tb .lb .ic{color:#b5b5b0}
.tb .ep{background:var(--vc)}.tb .lb.ep{border-radius:10px 0 0 10px;font-weight:700;color:#1f3a10}.tb .lb.ep .ic{color:var(--stk)}
.tb .h{border:0;justify-content:flex-start;gap:3px;padding-top:2px;min-height:0}
.tb .h .nm{font-size:17px;font-weight:700;color:#111;line-height:1}
.tb .h .vd{font-size:14px;color:var(--mut);line-height:1.1}
.tb .c1{background:#f4f8ef}.tb .c1.h{border-radius:12px 12px 0 0}
.tb .best{color:var(--ok);font-weight:700}.tb .best .mono{color:var(--ok)}
.tb .ep.c1{background:#d8e6c6}
.des{font-size:14px;color:var(--mut);line-height:1}
.eur{font-size:14px;color:#888;line-height:1.1}
.tb .dern{border-bottom:0}
.tb .c1.dern{border-radius:0 0 12px 12px}
.mini{height:6px;border-radius:3px;background:#c9d6b8;margin-top:3px}
`;
function A1(etat) {
  const E = ETATS[etat];
  const cols = E.ordre.map((id) => art(etat, id));
  const parPrix = E.par === 'prix';
  const chaine = parPrix
    ? `Classé par <b class="on">${pinPlein(15)}Prix</b> › <b>Volume</b> › <b>Dispo</b>`
    : `Classé par <b class="trou">${pinPlein(15)}Prix ?</b> › <b class="on">Volume</b> › <b>Dispo</b>`;
  const cell = (a, i, cont, extra = '') => `<div class="${i === 0 ? 'c1 ' : ''}${extra}">${cont}</div>`;
  const tete = `<div class="h"></div>` + cols.map((a, i) => cell(a, i, `${frigo(a.id, 50)}<span class="rang ${i === 0 ? 'r1' : ''}" style="width:26px;height:26px;font-size:15px;margin-top:-14px">${i + 1}</span><span class="nm mono">${a.vol}<small style="font-size:14px"> m³</small></span><span class="vd">${a.vendeur} · ${a.pays}</span>`, 'h')).join('');
  const meilleurPrix = parPrix ? E.ordre[0] : null;
  const vMax = Math.max(...cols.map((a) => a.volN));
  const ligne = (lb, unite, f, ep = false, best = null, dern = false) => `<div class="lb${ep ? ' ep' : ''}${dern ? ' dern' : ''}">${ep ? pinPlein(17) : ''}<span>${lb}${unite ? `<small>${unite}</small>` : ''}</span></div>` + cols.map((a, i) => cell(a, i, f(a), `${ep ? 'ep ' : ''}${best === a.id ? 'best ' : ''}${dern ? 'dern' : ''}`)).join('');
  const lignes = [
    ligne('Prix', etat === 'eur' ? 'CHF rendu' : 'CHF', (a) => prixA1(a.prix), parPrix, meilleurPrix),
    ligne('Volume', 'm³', (a) => `<span class="mono" style="font-size:16px">${a.vol}</span><div class="mini" style="width:${Math.round((a.volN / vMax) * 70)}px;${a.volN === vMax && !parPrix ? 'background:var(--stk)' : ''}"></div>`, !parPrix, parPrix ? null : 'c'),
    ligne('Au sol', 'cm', (a) => `<span class="plan" style="width:${Math.round(a.solL * 0.28)}px;height:${Math.round(a.solP * 0.28)}px"></span><span class="mono" style="font-size:14px">${a.sol}</span>`),
    ligne('Dispo', '', (a) => `<span class="${dispoCls(a)}" style="font-size:15px;font-weight:600">${a.dispo}</span>`, false, 'a'),
    ligne('Porte', 'cm', (a) => `<span class="mono" style="font-size:15px">${a.porte}</span>`, false, null, etat !== 'repos' && etat !== 'eur'),
    ...(etat === 'sans' ? [] : [ligne('CHF/m³', '', (a) => { const v = valeur(a.prix); return `<span class="mono" style="font-size:15px">${a.prix.des ? '≥' : a.prix.eur ? '≈' : ''}${n(Math.round(v / a.volN))}</span>`; }, false, null, true)]),
  ].join('');
  const pied = etat === 'eur' ? `<div class="pie"><span class="brun">≈ rendu chez toi : port, TVA 8,1 %, estimé</span> · exemple</div>` : etat === 'sans' ? `<div class="pie">Prix manquants : classé par le volume · exemple</div>` : `<div class="pie">Vendeurs et prix : exemple</div>`;
  return { css: A1_CSS, corps: comparerTete() + `<div class="chaine">${chaine}</div><div class="tb">${tete}${lignes}</div>${pied}` };
}

// ---- A2 : lignes d'article, attributs épinglés en puces numérotées ----
const A2_CSS = `
.puces{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}
.puces span{display:inline-flex;align-items:center;gap:5px;height:36px;padding:0 11px;border-radius:999px;border:1.5px solid var(--line2);font-size:15px;color:#333;background:#fff}
.puces span.on{background:#1f1f1d;border-color:#1f1f1d;color:#fff;font-weight:600}
.puces span.on i{font-style:normal;background:#fff;color:#111;border-radius:50%;width:20px;height:20px;display:grid;place-items:center;font-size:14px;font-weight:700}
.puces span.trou{border:2px dashed #aaa;color:#888;background:#fff}
.puces span.trou i{font-style:normal;color:#888}
.lg{border:1.5px solid var(--line);border-radius:14px;padding:10px 12px;margin-bottom:8px;display:grid;grid-template-columns:30px 48px 1fr auto;column-gap:10px;align-items:center}
.lg.p1{border-color:var(--stk);background:#f6f9f1}
.lg .nm{font-size:18px;font-weight:700;color:#111;line-height:1.1}
.lg .vd{font-size:14px;color:var(--mut)}
.lg .val{text-align:right;line-height:1.05}
.lg .val .mono{font-size:22px;font-weight:600;color:#111}
.lg .val small{display:block;font-size:14px;color:var(--mut)}
.lg .barre{grid-column:1/-1;height:10px;border-radius:5px;background:var(--s2);margin-top:9px;position:relative;overflow:hidden}
.lg .barre b{position:absolute;left:0;top:0;bottom:0;border-radius:5px;background:#9a9a96}
.lg.p1 .barre b{background:var(--stk)}
.lg .barre.vide{background:repeating-linear-gradient(135deg,#eee 0 6px,#fff 6px 12px);border:1.5px dashed #bbb}
.lg .pp{grid-column:1/-1;display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.lg .pp span{font-size:14px;padding:2px 9px;border-radius:999px;background:var(--s1);color:#444}
.lg .pp span.k{background:var(--vc);color:var(--ok);font-weight:600}
.autres{display:flex;align-items:center;justify-content:space-between;font-size:15px;color:#2f5e86;padding:6px 2px}
`;
function A2(etat) {
  const E = ETATS[etat];
  const parPrix = E.par === 'prix';
  const puces = parPrix
    ? `<span class="on"><i>1</i>Prix</span><span class="on"><i>2</i>Volume</span><span class="on"><i>3</i>Dispo</span><span>${ic('pin', 15)}Au sol</span><span>${ic('pin', 15)}Porte</span>`
    : `<span class="trou"><i>1</i>Prix ?</span><span class="on"><i>2</i>Volume</span><span class="on"><i>3</i>Dispo</span><span>${ic('pin', 15)}Au sol</span><span>${ic('pin', 15)}Porte</span>`;
  const maxP = 5400, maxV = 5.9;
  const lignes = E.ordre.map((id, i) => {
    const a = art(etat, id), p = a.prix;
    let val, barre;
    if (parPrix) {
      const v = valeur(p);
      val = p.eur ? `<span class="mono brun">≈${n(p.rendu)}</span><small class="brun">CHF rendu · ${n(p.eur)} €</small>` : p.des ? `<small>dès</small><span class="mono">${n(p.des)}</span>` : `<span class="mono">${n(p.chf)}</span><small>CHF ${p.src === 'saisi' ? ic('pencil', 13) : ic('link', 13)}</small>`;
      barre = `<div class="barre"><b style="width:${Math.round((v / maxP) * 100)}%"></b></div>`;
    } else {
      val = `<span class="mono">${a.vol}</span><small>m³</small>`;
      barre = `<div class="barre"><b style="width:${Math.round((a.volN / maxV) * 100)}%"></b></div>`;
    }
    const prixP = p.inconnu ? `<span class="pd" style="height:26px;padding:0 8px;font-size:14px;border-radius:999px">CHF ?</span>` : p.devis ? `<span class="pd" style="height:26px;padding:0 8px;font-size:14px;border-radius:999px">${ic('scan', 14)}devis</span>` : '';
    const pp = parPrix
      ? `<span class="${i === 2 ? '' : ''}">${a.vol} m³</span><span class="${a.sem <= 1 ? 'k' : ''}">${a.dispo}</span><span>${a.sol} cm</span>`
      : `${prixP}<span class="${a.sem <= 1 ? 'k' : ''}">${a.dispo}</span><span>${a.sol} cm</span>`;
    return `<div class="lg ${i === 0 ? 'p1' : ''}"><span class="rang ${i === 0 ? 'r1' : ''}">${i + 1}</span>${frigo(a.id, 48)}<div><div class="nm">${a.vol} m³</div><div class="vd">${a.vendeur} · ${a.pays}</div></div><div class="val">${val}</div>${barre}<div class="pp">${pp}</div></div>`;
  }).join('');
  const pied = etat === 'eur' ? `<div class="pie brun">≈ rendu : port et TVA d'import estimés</div>` : etat === 'sans' ? `<div class="pie">3 prix manquent : le volume classe en attendant</div>` : '';
  return { css: A2_CSS, corps: comparerTete() + `<div class="puces">${puces}</div>${lignes}${pied}<div class="autres"><span>Isolation, couleur, groupe… 6 lignes</span>${ic('chevR', 18)}</div>` };
}

// ---- A3 : bandes par attribut ; articles dans l'ordre du classement, nommés au bout de chaque barre ;
//      plan au sol à l'échelle avec la porte ; dispo en segments depuis « auj. » ----
const A3_CSS = `
.leg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-bottom:6px}
.leg div{display:flex;align-items:center;gap:5px;border-radius:12px;padding:5px 6px;background:var(--s1);border-left:5px solid;min-width:0}
.leg .nm{font-size:16px;font-weight:700;color:#111;line-height:1.05;white-space:nowrap;min-width:0}
.leg .nm i{font-style:normal;font-size:14px;font-weight:600;color:#555}
.leg small{display:block;font-size:14px;color:var(--mut);font-weight:400;overflow:hidden;text-overflow:ellipsis}
.bd{border-top:1px solid var(--line);padding:6px 0 5px}
.bd h3{margin:0 0 3px;font-size:16px;display:flex;align-items:center;gap:6px;color:#222}
.bd h3 .ic{color:#b5b5b0}
.bd.ep{background:#f4f8ef;border-radius:12px;border:1.5px solid #cfdcbc;padding:6px 8px 5px;margin:0 -2px 4px}
.bd.ep h3{color:#1f3a10}.bd.ep h3 .ic{color:var(--stk)}
.bd h3 em{font-style:normal;font-weight:400;color:var(--mut);font-size:14px}
.br{display:flex;align-items:center;gap:7px;height:23px}
.br .t{height:14px;border-radius:7px;flex:none}
.br .v{font-size:15px;font-weight:600;color:#222;white-space:nowrap}
.br .n{font-size:14px;font-weight:700;white-space:nowrap}
.br .t.vide{border:2px dashed;background:repeating-linear-gradient(135deg,#ececea 0 5px,#fff 5px 10px)}
.br .seg{display:flex;height:14px;border-radius:7px;overflow:hidden;flex:none}
.br .seg b{display:block;height:100%}
.br .zero{width:14px;height:14px;border-radius:50%;flex:none}
.sol{display:flex;align-items:flex-start;gap:18px;padding:6px 0 0 10px}
.sol .sc{display:flex;flex-direction:column;align-items:center;gap:2px}
.sol .rect{border:2.5px solid;border-radius:3px;display:grid;place-items:center;font-size:14px;font-weight:600;white-space:nowrap;position:relative;color:#333}
.sol .rect .rang{position:absolute;left:-11px;top:-11px;width:22px;height:22px;font-size:14px}
.sol .po{display:flex;align-items:center;gap:2px;font-size:14px;color:#444}
.ax8{position:relative;height:18px;border-top:1.5px solid #bbb;margin-top:1px}
.ax8 span{position:absolute;top:0;font-size:14px;color:#777;transform:translateX(-50%);white-space:nowrap;line-height:17px}
.ax8 span.t0{transform:none}.ax8 span.un{transform:none;color:#999}
`;
function A3(etat) {
  const E = ETATS[etat];
  const parPrix = E.par === 'prix';
  const ordre = E.ordre.map((id) => art(etat, id));
  const W = 176;
  const nomB = (a) => `<span class="n" style="color:${a.coul}">${a.court}</span>`;
  const leg = ordre.map((a, i) => `<div style="border-color:${a.coul}"><span class="rang ${i === 0 ? 'r1' : ''}" style="width:24px;height:24px;font-size:14px">${i + 1}</span><span class="nm">${a.vol} <i>m³</i><small>${a.court}</small></span></div>`).join('');
  const prixBd = ordre.map((a) => {
    const p = a.prix;
    if (p.inconnu) return `<div class="br"><div class="t vide" style="width:${W}px;border-color:${a.coul}"></div><span class="v" style="color:#888">?</span>${nomB(a)}</div>`;
    if (p.devis) return `<div class="br"><div class="t vide" style="width:${W}px;border-color:${a.coul}"></div><span class="v" style="color:#888">sur demande</span>${nomB(a)}</div>`;
    if (p.eur) return `<div class="br"><div class="seg" style="width:${Math.round((3000 / 5400) * W)}px"><b style="width:79%;background:${a.coul}"></b><b style="width:12%;background:${a.coul};opacity:.6"></b><b style="width:9%;background:${a.coul};opacity:.35"></b></div><span class="v brun mono">≈${n(p.rendu)}</span><span class="mono" style="font-size:14px;color:#888">${n(p.eur)} €</span>${nomB(a)}</div>`;
    const v = valeur(p);
    const des = p.des ? `<span style="font-family:'Source Sans 3',sans-serif;font-weight:400;color:#666">dès </span>` : '';
    return `<div class="br"><div class="t" style="width:${Math.round((v / 5400) * W)}px;background:${p.des ? `linear-gradient(90deg,${a.coul} 72%,${a.coul}22)` : a.coul}"></div><span class="v mono">${des}${n(v)}</span>${nomB(a)}</div>`;
  }).join('');
  const volBd = ordre.map((a) => `<div class="br"><div class="t" style="width:${Math.round((a.volN / 5.9) * W)}px;background:${a.coul}"></div><span class="v mono">${a.vol}</span>${nomB(a)}</div>`).join('');
  const k = 0.34; // px par cm
  const m = (cm) => String(cm / 100).replace('.', ',');
  const sol = ordre.map((a, i) => `<div class="sc"><div class="rect" style="width:${Math.round(a.solL * k)}px;height:${Math.round(a.solP * k)}px;border-color:${a.coul};background:${a.coul}22"><span class="rang ${i === 0 ? 'r1' : ''}">${i + 1}</span>${m(a.solL)}×${m(a.solP)}</div><span class="po">${ic('door', 16)}${a.porte}</span></div>`).join('');
  const X = (s) => Math.round((s / 8) * W);
  const dispoBd = ordre.map((a) => (a.d1 === 0
    ? `<div class="br"><span class="zero" style="background:${a.coul}"></span><span class="v vert">en stock</span>${nomB(a)}</div>`
    : `<div class="br"><div class="seg" style="width:${X(a.d1)}px"><b style="width:${(a.d0 / a.d1) * 100}%;background:${a.coul}"></b><b style="flex:1;background:repeating-linear-gradient(90deg,${a.coul} 0 4px,transparent 4px 7px)"></b></div><span class="v brun">${a.dispo}</span>${nomB(a)}</div>`)).join('')
    + `<div class="ax8" style="width:${W}px">${[0, 2, 4, 6, 8].map((s) => `<span class="t${s}" style="left:${X(s)}px">${s === 0 ? 'auj.' : s}</span>`).join('')}<span class="un" style="left:${W + 9}px">sem.</span></div>`;
  const bPrix = `<div class="bd ${parPrix ? 'ep' : ''}"><h3>${parPrix ? pinPlein(17) : ic('pin', 17)}Prix <em>${etat === 'eur' ? 'CHF rendu' : parPrix ? 'CHF' : 'CHF · 3 manquent'}</em></h3>${prixBd}</div>`;
  const bVol = `<div class="bd ${parPrix ? '' : 'ep'}"><h3>${parPrix ? ic('pin', 17) : pinPlein(17)}Volume <em>m³${parPrix ? '' : ' · classe en attendant'}</em></h3>${volBd}</div>`;
  const corps = comparerTete() + `<div class="leg">${leg}</div>` + (parPrix ? bPrix + bVol : bVol + bPrix) + `<div class="bd"><h3>${ic('pin', 17)}Au sol <em>m · porte en cm</em></h3><div class="sol">${sol}</div></div><div class="bd"><h3>${ic('pin', 17)}Dispo</h3>${dispoBd}</div>`;
  return { css: A3_CSS, corps };
}


// =====================================================================================
// AXE B — prix de l'article (liste des articles du carnet, base h06-5)
// =====================================================================================
const B_CSS = `
.arts{border:1.5px solid var(--line);border-radius:16px;overflow:hidden}
.ar{display:grid;grid-template-columns:52px minmax(0,1fr) auto;column-gap:10px;padding:10px 12px;border-bottom:1px solid var(--line);align-items:start}
.ar:last-child{border-bottom:0}
.ar .nm{font-size:18px;font-weight:700;color:#111;line-height:1.1}
.ar .vd{font-size:14px;color:var(--mut);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ar .bas{grid-column:2/-1;display:flex;align-items:center;gap:8px;margin-top:6px;font-size:15px}
.ar .bas .vl{margin-left:auto;display:flex;align-items:center;gap:6px;color:var(--stk)}
.ar .bas .vl.off{color:#777}
.cr{font-size:14px;padding:2px 9px;border-radius:999px;background:var(--vc);color:var(--ok);font-weight:600;white-space:nowrap}
.fg{position:relative;width:52px;height:52px}
.fg .rang{position:absolute;left:-8px;top:-8px;width:24px;height:24px;font-size:14px;border-width:2px}
.titreA{display:flex;align-items:center;justify-content:space-between;margin:2px 0 6px;font-size:18px;font-weight:700;color:#111}
.titreA a{font-size:16px;color:#2f5e86;font-weight:600;text-decoration:none;display:flex;align-items:center}
`;
const carnetTete = () => `<div class="retour"><a href="#">${ic('chevL', 20)}Carnets</a><span class="etiq">on compare</span></div><h1>Chambre froide</h1><div class="sous">1 façon · 3 articles</div>`;
// Base h06-5 : titre = le modèle ; puce verte = valeur du critère et son rang.
// Le rang (rond sur le picto) suit partout le classement épinglé de Comparer (ETATS[etat].ordre) ; la puce verte ne dit que le volume.
function ligneB(a, prixHtml, apres = '', criteres = true, rang = null) {
  const bas = `<div class="bas">${criteres ? `<span class="cr">${a.vol} m³</span>` : ''}<span class="vl ${a.id === 'c' ? 'off' : ''}">${ic('eye', 18)}veille<span class="toggle ${a.id === 'c' ? 'off' : ''}"></span></span></div>`;
  const pic = `<div class="fg">${frigo(a.id, 52)}${rang ? `<span class="rang ${rang === 1 ? 'r1' : ''}">${rang}</span>` : ''}</div>`;
  return `<div class="ar">${pic}<div><div class="nm">${a.nom}</div><div class="vd">${a.vendeur} · <span class="${dispoCls(a)}">${a.dispo}</span></div></div>${prixHtml}${bas}${apres}</div>`;
}
const listeB = (etat, prixFn, apresFn = () => '', titre = true) => `${titre ? `<div class="titreA">Articles · 3<a href="#">Comparer${ic('chevR', 18)}</a></div>` : ''}<div class="arts">${ETATS[etat].ordre.map((id, i) => { const a = art(etat, id); return ligneB(a, prixFn(a, etat), apresFn(a, etat), true, i + 1); }).join('')}</div>`;


// ---- B1 : pastille v02 (pleine si connue, pointillée « CHF ? ») ; en EUR, la décomposition s'ouvre au toucher, tout en CHF ----
const B1_CSS = `
.pt2{width:96px;min-height:60px;border-radius:14px;background:#f1f1ee;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;position:relative}
.pt2 .mono{font-size:20px;font-weight:600;color:#111;line-height:1}
.pt2 small{font-size:14px;color:var(--mut);line-height:1.1;display:flex;align-items:center;gap:3px}
.pt2.pd{border:2.5px dashed #a3a39e;background:#fff}
.pt2.pd b{font-size:19px;color:#777}
.pt2.est{background:var(--bdgc);outline:2px dotted var(--bdg);outline-offset:-2px}
.pt2.est .mono{color:var(--bdg)}
.pt2.est.on{outline:3px solid var(--bdg)}
.dec{grid-column:1/-1;display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:8px;font-size:14px;color:#555;background:var(--bdgc);border-radius:12px;padding:6px 8px}
.dec span{background:#fff;border-radius:8px;padding:2px 7px}
.dec .tot{background:var(--bdg);color:#fff;font-weight:700}
.dec small{flex-basis:100%;font-size:14px;color:var(--bdg)}
`;
function B1(etat) {
  const prix = (a) => {
    const p = a.prix;
    if (p.inconnu) return `<div class="pt2 pd"><b>CHF ?</b><small>${ic('pencil', 13)}saisir</small></div>`;
    if (p.devis) return `<div class="pt2 pd">${ic('scan', 22)}<small>devis</small></div>`;
    if (p.eur) return `<div class="pt2 est on"><span class="mono">≈${n(p.rendu)}</span><small class="brun">CHF rendu${ic('chevU', 14)}</small></div>`;
    if (p.des) return `<div class="pt2"><small>dès</small><span class="mono">${n(p.des)}</span><small>CHF ${ic('link', 13)}</small></div>`;
    return `<div class="pt2"><span class="mono">${n(p.chf)}</span><small>CHF ${p.src === 'saisi' ? ic('pencil', 13) : ic('link', 13)}</small></div>`;
  };
  const apres = (a) => (a.prix.eur ? `<div class="dec"><span class="mono">2 362</span>+<span>port <span class="mono">357</span></span>+<span>TVA <span class="mono">220</span></span>+<span>frais <span class="mono">60</span></span>=<span class="tot mono">≈3 000</span><small>en CHF · de 2 513 € et port 380 €, à 0,94</small></div>` : '');
  return { css: B_CSS + B1_CSS, corps: carnetTete() + listeB(etat, prix, apres) + `<div class="pie">Vendeurs et prix : exemple</div>` };
}


// ---- B2 : barre empilée à l'échelle commune (article, port, TVA) ----
const B2_CSS = `
.pb{grid-column:1/-1;display:flex;align-items:center;gap:8px;margin-top:8px}
.pb .ech{flex:1;height:22px;border-radius:6px;background:var(--s1);position:relative;overflow:hidden;display:flex}
.pb .ech b{height:100%;display:block}
.pb .ech b.art{background:#3d4a57}.pb .ech b.port{background:#7f93a6}.pb .ech b.tva{background:#bccbd8}
.pb .ech.vide{border:2px dashed #aaa;background:repeating-linear-gradient(135deg,#f1f1f1 0 6px,#fff 6px 12px)}
.pb .ech.vide span{margin:auto;font-size:14px;color:#777;font-weight:700}
.pb .tot{min-width:78px;text-align:right;font-size:20px;font-weight:600;color:#111;line-height:1}
.pb .tot small{display:block;font-size:14px;color:var(--mut);font-family:"Source Sans 3",sans-serif;font-weight:400}
.pb .src{color:#888}
.lgd{grid-column:1/-1;display:flex;gap:10px;font-size:14px;color:#555;margin-top:4px}
.lgd i{display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-1px;margin-right:3px}
.btn-dv{display:inline-flex;align-items:center;gap:5px;height:34px;padding:0 10px;border-radius:999px;border:1.5px solid var(--stk);color:var(--stk);font-size:15px;font-weight:600;white-space:nowrap}
.regle{display:flex;justify-content:space-between;font-size:14px;color:#888;margin:-2px 92px 6px 0}
`;
function B2(etat) {
  const ECH = 5400;
  const barre = (a) => {
    const p = a.prix;
    const src = p.src === 'saisi' ? ic('pencil', 16, 'src') : ic('link', 16, 'src');
    if (p.inconnu) return `<div class="pb">${ic('link', 16, 'src')}<div class="ech vide"><span>prix ?</span></div><span class="btn-dv">${ic('pencil', 15)}Saisir</span></div>`;
    if (p.devis) return `<div class="pb">${ic('scan', 16, 'src')}<div class="ech vide"><span>sur demande</span></div><span class="btn-dv">${ic('scan', 15)}Devis</span></div>`;
    if (p.eur) {
      const w = (x) => `${((x / ECH) * 100).toFixed(1)}%`;
      return `<div class="pb">${src}<div class="ech"><b class="art" style="width:${w(2362)}"></b><b class="port" style="width:${w(357)}"></b><b class="tva" style="width:${w(281)}"></b></div><span class="tot mono brun">≈${n(p.rendu)}<small class="brun">CHF rendu</small></span></div><div class="lgd"><span><i style="background:#3d4a57"></i><span class="mono">2 513 €</span></span><span><i style="background:#7f93a6"></i>port</span><span><i style="background:#bccbd8"></i>TVA + frais</span></div>`;
    }
    if (p.des) return `<div class="pb">${src}<div class="ech"><b class="art" style="width:${((p.des / ECH) * 100).toFixed(1)}%;background:linear-gradient(90deg,#3d4a57 70%,#3d4a5700)"></b></div><span class="tot mono"><small style="display:inline">dès </small>${n(p.des)}</span></div>`;
    const port = a.id === 'a' ? 250 : 0;
    return `<div class="pb">${src}<div class="ech"><b class="art" style="width:${(((p.chf - port) / ECH) * 100).toFixed(1)}%"></b>${port ? `<b class="port" style="width:${((port / ECH) * 100).toFixed(1)}%"></b>` : ''}</div><span class="tot mono">${n(p.chf)}<small>CHF</small></span></div>`;
  };
  const regle = `<div class="regle mono"><span>0</span><span>2 500</span><span>5 000</span></div>`;
  const ids = ['a', 'b', 'c'];
  const rows = ids.map((id) => { const a = art(etat, id); return ligneB(a, '', barre(a)); }).join('');
  return { css: B_CSS + B2_CSS, corps: carnetTete() + `<div class="titreA">Articles · 3<a href="#">Comparer${ic('chevR', 18)}</a></div>` + `<div class="arts">${rows}</div><div class="pie">Une même règle en CHF pour les trois · exemple</div>` };
}

// ---- B3 : étiquette de prix accrochée ; vide : Saisir ou Devis ; en EUR, étiquette € au-dessus, décomposition au toucher ----
const B3_CSS = `
.tag{position:relative;width:104px;height:56px;margin-top:2px}
.tag .sh{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.tag .sh path{fill:#fff;stroke:#222;stroke-width:2}
.tag .sh.vide path{fill:#fafafa;stroke:#999;stroke-dasharray:6 4;stroke-width:2.5}
.tag .sh.est path{fill:var(--bdgc);stroke:var(--bdg)}
.tag .sh.on path{stroke-width:4}
.tag .sh.on:not(.est) path{stroke:var(--stk)}
.tag .f{position:absolute;inset:0;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;padding:0 10px 0 20px}
.tag .f::before{content:"";position:absolute;left:9px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;border:2px solid #222;background:#fff}
.tag .f.vide::before{border-color:#999}
.tag .mono{font-size:20px;font-weight:600;color:#111;line-height:1}
.tag small{font-size:14px;color:var(--mut);line-height:1}
.tag small .ic{vertical-align:-2px}
.tag .f.vide{align-items:center;padding-left:18px}
.tag .act{display:flex;align-items:center;gap:4px;font-size:17px;font-weight:700;color:var(--stk)}
.tag .f.est .mono{color:var(--bdg)}
.eu{display:flex;flex-direction:column;align-items:flex-end}
.eu .dos{position:relative;width:88px;height:28px;margin:0 20px 2px 0;transform:rotate(-3deg)}
.eu .dos .sh{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.eu .dos .sh path{fill:#eceae4;stroke:#888;stroke-width:1.5}
.eu .dos span{position:absolute;inset:0;display:flex;align-items:center;justify-content:flex-end;padding-right:9px;font-size:15px;font-weight:600;color:#444}
.eu .tag{margin-top:0}
.dc{grid-column:1/-1;margin-top:8px;background:var(--bdgc);border-radius:12px;padding:7px 9px}
.dc .seg{display:flex;height:16px;border-radius:6px;overflow:hidden}
.dc .seg b{display:block;height:100%}
.dc .lg{display:flex;gap:10px;font-size:14px;color:#444;margin-top:5px;flex-wrap:wrap}
.dc .lg i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:3px;vertical-align:-1px}
.pave{grid-column:1/-1;margin-top:8px;display:grid;grid-template-columns:repeat(6,1fr);gap:5px}
.pave span{height:40px;border-radius:10px;background:var(--s1);display:grid;place-items:center;font-size:19px;font-weight:600;color:#222}
.pave .ok{grid-column:span 3;background:var(--stk);color:#fff;font-size:17px}
.pave .dv{font-size:15px;background:#fff;border:1.5px solid var(--line2)}
.pave .dv b{background:#1f1f1d;color:#fff;border-radius:6px;padding:0 6px}
`;
function B3(etat) {
  const tg = (cls, inner) => `<div class="tag">${SH(cls)}<div class="f ${cls}">${inner}</div></div>`;
  const tag = (a) => {
    const p = a.prix;
    const src = p.src === 'saisi' ? ic('pencil', 13) : ic('link', 13);
    if (p.inconnu && a.id === 'b') return tg('on', `<span class="mono">3 350<span style="border-right:2px solid #111;margin-left:1px"></span></span><small>CHF</small>`);
    if (p.inconnu) return tg('vide', `<span class="act">${ic('pencil', 16)}Saisir</span>`);
    if (p.devis) return tg('vide', `<span class="act">${ic('scan', 16)}Devis</span>`);
    if (p.eur) return `<div class="eu"><div class="dos">${SH()}<span class="mono">${n(p.eur)} €</span></div>${tg('est on', `<span class="mono">≈${n(p.rendu)}</span><small class="brun">CHF rendu</small>`)}</div>`;
    if (p.des) return tg('', `<small>dès</small><span class="mono">${n(p.des)}</span><small>CHF ${src}</small>`);
    return tg('', `<span class="mono">${n(p.chf)}</span><small>CHF ${src}</small>`);
  };
  const C =['#3d4a57', '#7f93a6', '#bccbd8'];
  const apres = (a, e) => {
    if (e === 'sans' && a.id === 'b') return `<div class="pave">${['1', '2', '3', '4', '5', '<b>⌫</b>', '6', '7', '8', '9', '0', ',', 'CHF', '€', '00', 'OK'].map((k) => `<span class="${k === 'OK' ? 'ok' : k === 'CHF' || k === '€' ? 'dv' : ''}">${k === 'CHF' ? '<b>CHF</b>' : k}</span>`).join('')}</div>`;
    if (a.prix.eur) return `<div class="dc"><div class="seg"><b style="width:78.7%;background:${C[0]}"></b><b style="width:11.9%;background:${C[1]}"></b><b style="width:9.4%;background:${C[2]}"></b></div><div class="lg"><span><i style="background:${C[0]}"></i>article <span class="mono">2 362</span></span><span><i style="background:${C[1]}"></i>port <span class="mono">357</span></span><span><i style="background:${C[2]}"></i>TVA + frais <span class="mono">280</span></span></div></div>`;
    return '';
  };
  return { css: B_CSS + B3_CSS, corps: carnetTete() + listeB(etat, tag, apres) + `<div class="pie">Vendeurs et prix : exemple</div>` };
}


// =====================================================================================
// AXE C — choisir → achat prévu dans À venir (base g05-9 : l'article ouvert, « Choisir chez … »)
// =====================================================================================
const C_CSS = `
.ouv{border:2px dashed #333;border-radius:18px;padding:12px;margin-bottom:8px}
.ouv .hd{display:flex;align-items:center;gap:10px}
.ouv .hd .px{font-size:24px;font-weight:600;color:#111}
.ouv .hd .vd{font-size:15px;color:#333;line-height:1.2;flex:1}
.ouv .hd .vd small{display:block;color:var(--mut);font-size:14px}
.ouv .hd .vd b.nmx{display:block;font-size:20px;font-weight:800;color:#111;line-height:1.1}
.ouv .hd a{font-size:16px;color:#2f5e86;display:flex;align-items:center;gap:3px;font-weight:600;text-decoration:none}
.ouv .vals{display:flex;gap:6px;margin:9px 0;flex-wrap:wrap}
.ouv .vals span{font-size:14px;padding:3px 9px;border-radius:999px;background:var(--s1);color:#444}
.ouv .vals span.k{background:var(--vc);color:var(--ok);font-weight:600}
.bts{display:flex;gap:8px}
.bts .ch{flex:1;height:50px;border-radius:14px;background:var(--stk);color:#fff;font-size:18px;font-weight:700;display:grid;place-items:center}
.bts .ec{width:100px;height:50px;border-radius:14px;border:1.5px solid var(--line2);font-size:18px;display:grid;place-items:center;color:#222}
.cp{border:1.5px solid var(--line);border-radius:16px;padding:9px 12px;display:flex;align-items:center;gap:10px;margin-bottom:7px}
.cp .nm{font-size:17px;font-weight:700;color:#111;flex:1;line-height:1.1;min-width:0}
.cp .nm small{display:block;font-size:14px;color:var(--mut);font-weight:400;white-space:nowrap}
.cp .mono{font-size:19px;font-weight:600}
.cp .pr{text-align:right;line-height:1.1;flex:none}
.cp .pr small{display:block;font-size:14px;color:var(--mut)}
.cp .pr .px.pdx{margin-bottom:3px}
.pxc{display:flex;flex-direction:column;align-items:flex-end;flex:none;line-height:1.1}
.pxc small{font-size:14px;color:var(--mut)}
.ouv .hd .vd b.nmx{white-space:nowrap}
.px.pdx{display:inline-block;line-height:1.15;border:2.5px dashed #a3a39e;border-radius:10px;padding:2px 8px;color:#777;font-size:20px!important;font-family:'Source Sans 3',sans-serif!important;letter-spacing:0!important;word-spacing:0;font-weight:700;white-space:nowrap}
`;
// Le mois d'À venir est celui que le brasseur choisit (toucher la case bleue) ; aucun verdict de caisse ici (C4, K5).
const C_DATA = {
  repos: { id: 'a', livre: 'déc.', livreSem: 'en stock', paye: 'janv.' },
  sans: { id: 'c', livre: 'janv.', livreSem: '6 sem.', paye: 'févr.' },
  eur: { id: 'b', livre: 'mi-déc.', livreSem: '3–4 sem.', paye: 'déc.' },
};
function prixC(a) {
  const p = a.prix;
  if (p.devis || p.inconnu) return `<span class="px pdx">CHF ?</span>`;
  if (p.eur) return `<span class="px mono brun">≈${n(p.rendu)}</span>`;
  if (p.des) return `<span class="px mono"><small style="font-size:14px;font-family:'Source Sans 3';color:#666">dès </small>${n(p.des)}</span>`;
  return `<span class="px mono">${n(p.chf)}</span>`;
}
function carteOuverte(etat, zone, opts = {}) {
  const d = C_DATA[etat];
  const a = art(etat, d.id);
  const sousPrix = a.prix.eur ? `<small class="brun">CHF rendu · ${n(a.prix.eur)} €</small>` : a.prix.devis ? `<small>sur demande</small>` : '';
  const r = ETATS[etat].ordre.indexOf(d.id) + 1;
  const tete = opts.coche
    // C3 : le modèle en titre, le prix à côté ; le coche dit « choisi »
    ? `<span class="rang" style="background:var(--ach);border-color:var(--ach);color:#fff">${ic('check', 18)}</span><span class="vd"><b class="nmx">${a.nom}</b>${a.vendeur} · ${a.pays}</span><span class="pxc">${prixC(a)}${a.prix.eur ? `<small class="brun"><span class="mono">${n(a.prix.eur)}</span> €</small>` : ''}</span>`
    : opts.nomTitre
      // C1 : le rond de rang d'abord, comme les autres articles ; le prix est dans la 1re case
      ? `<span class="rang ${r === 1 ? 'r1' : ''}">${r}</span>${frigo(a.id, 44)}<span class="vd"><b class="nmx">${a.nom}</b>${a.vendeur} · ${a.pays}</span>`
      : `${frigo(a.id, 44)}${prixC(a)}<span class="vd">${a.vendeur} · ${a.pays}${sousPrix}</span>`;
  const hd = `<div class="hd">${tete}<a href="#" ${opts.coche ? 'aria-label="Ouvrir"' : ''}>${opts.coche ? '' : 'Ouvrir'}${ic('ext', 16)}</a></div>`;
  const vals = `<div class="vals"><span class="k">${a.vol} m³</span><span class="${a.sem <= 1 ? 'k' : ''}">${a.dispo}</span><span>${a.sol} cm</span><span>porte ${a.porte}</span></div>`;
  const bts = opts.sansBoutons ? '' : `<div class="bts"><span class="ch">Choisir chez ${a.vendeur}</span><span class="ec">Écarter</span></div>`;
  return `<div class="ouv" ${opts.style ? `style="${opts.style}"` : ''}>${hd}${vals}${bts}${zone}</div>`;
}
// Base g05-9 : les autres articles gardent leur rond de rang.
function autresC(etat) {
  const d = C_DATA[etat];
  const E = ETATS[etat];
  return E.ordre.filter((id) => id !== d.id).map((id) => {
    const a = art(etat, id);
    const r = E.ordre.indexOf(id) + 1;
    return `<div class="cp"><span class="rang ${r === 1 ? 'r1' : ''}">${r}</span>${frigo(id, 40)}<span class="nm">${a.nom}<small>${a.vendeur} · ${a.dispo}</small></span><span class="pr">${prixC(a).replace('class="px', 'class="mono px')}<small>${a.vol} m³</small></span></div>`;
  }).join('');
}

// ---- C1 : trois cases prix (étiquette B3) › livré › À venir ; sans verdict de caisse ----
const C1_CSS = `
.trio{display:grid;grid-template-columns:1fr 14px 1fr 14px 1fr;align-items:center;margin-top:12px}
.trio .fl{color:#aaa;text-align:center;font-size:16px}
.tt{min-height:76px;border-radius:14px;background:#f1f1ee;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px}
.tt .ic{color:#555}
.tt b{font-size:19px;color:#111;line-height:1}
.tt small{font-size:14px;color:var(--mut);line-height:1.1;text-align:center}
.tt.tg{background:none;position:relative;padding-left:14px}
.tt.tg .sh{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.tt.tg .sh path{fill:#fff;stroke:#222;stroke-width:2}
.tt.tg .sh.vide path{fill:#fafafa;stroke:#999;stroke-dasharray:6 4;stroke-width:2.5}
.tt.tg .sh.est path{fill:var(--bdgc);stroke:var(--bdg)}
.tt.tg>*:not(.sh){position:relative}
.tt.tg .act{display:flex;align-items:center;gap:4px;font-size:17px;font-weight:700;color:var(--stk)}
.tt.ach{background:var(--achc);outline:2px solid var(--ach);outline-offset:-2px}.tt.ach b,.tt.ach .ic{color:var(--ach)}
.tt.ach.dft{outline-style:dashed;outline-width:2.5px;background:#fff}
.tt.ach b{display:flex;align-items:center;gap:1px}
`;
function C1(etat) {
  const d = C_DATA[etat];
  const a = art(etat, d.id);
  const t1 = a.prix.devis
    ? `<div class="tt tg">${SH('vide')}<span class="act">${ic('scan', 17)}Devis</span><small>sur demande</small></div>`
    : a.prix.eur
      ? `<div class="tt tg">${SH('est')}<b class="mono brun">≈${n(a.prix.rendu)}</b><small class="brun">CHF rendu</small></div>`
      : `<div class="tt tg">${SH()}<b class="mono">${n(a.prix.chf)}</b><small>CHF</small></div>`;
  const t2 = `<div class="tt">${ic('truck', 20)}<b>${d.livre}</b><small>${d.livreSem}</small></div>`;
  const t3 = `<div class="tt ach ${etat === 'sans' ? 'dft' : ''}">${ic('cal', 20)}<b>${d.paye}${ic('chevD', 16)}</b><small>À venir</small></div>`;
  const zone = `<div class="trio">${t1}<span class="fl">›</span>${t2}<span class="fl">›</span>${t3}</div>`;
  return { css: C_CSS + C1_CSS, corps: carnetTete() + carteOuverte(etat, zone, { nomTitre: true }) + autresC(etat) };
}


// ---- C2 : frise des mois, commande → livraison → paiement, mois colorés ----
const C2_CSS = `
.frm{margin-top:12px;position:relative}
.frm .ms{display:grid;grid-template-columns:repeat(6,1fr);text-align:center;font-size:15px;font-weight:700;color:#444}
.frm .pis{position:relative;height:58px;margin-top:4px;background:repeating-linear-gradient(90deg,transparent 0 calc(100%/6 - 1px),#e6e6e2 calc(100%/6 - 1px) calc(100%/6))}
.frm .lv{position:absolute;top:8px;height:16px;border-radius:8px;background:var(--ach)}
.frm .lv.est{background:repeating-linear-gradient(90deg,var(--ach) 0 8px,#9db7d8 8px 12px)}
.frm .cmd{position:absolute;top:4px;width:24px;height:24px;border-radius:50%;background:#fff;border:3px solid var(--ach);transform:translateX(-50%)}
.frm .tr{position:absolute;top:2px;color:var(--ach);transform:translateX(-50%)}
.frm .po{position:absolute;top:30px;width:30px;height:28px;border-radius:9px;background:#111;transform:translateX(-50%);display:grid;place-items:center;color:#fff}
.frm .cs{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-top:4px}
.frm .cs span{height:26px;border-radius:7px;display:grid;place-items:center;color:#fff}
.frm .cs .g{background:#8db06a}.frm .cs .r{background:#d0574d}.frm .cs .q{background:#fff;border:2px dashed #bbb;color:#999}
.frm .lgd{display:flex;gap:12px;font-size:14px;color:#555;margin-top:6px;align-items:center}
.frm .lgd i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:4px;vertical-align:-1px}
.rec{display:flex;align-items:center;gap:8px;font-size:16px;color:#222;margin-top:10px}
.rec b{font-weight:700}
`;
function C2(etat) {
  const d = C_DATA[etat];
  // colonnes : N D J F M A ; position en % de la largeur ; aujourd'hui = 21 nov.
  const col = (m, jour = 0) => ((m + jour / 30) / 6) * 100;
  const auj = col(0, 21);
  const fin = { repos: col(1, 6), sans: col(2, 2), eur: col(1, 16) }[etat];
  const paye = { repos: col(2, 15), sans: col(3, 15), eur: col(1, 24) }[etat];
  const cs = { repos: ['g', 'r', 'g', 'g', 'g', 'g'], sans: ['q', 'q', 'q', 'q', 'q', 'q'], eur: ['g', 'g', 'g', 'g', 'g', 'g'] }[etat];
  const ico = (c) => (c === 'g' ? ic('check', 16) : c === 'r' ? '<b style="font-size:16px">!</b>' : '?');
  const pz = etat === 'sans' ? `<span class="px pdx" style="font-size:18px">CHF ?</span>` : etat === 'eur' ? `<span class="mono brun" style="font-size:20px;font-weight:600">≈3 000</span>` : `<span class="mono" style="font-size:20px;font-weight:600">4 900</span>`;
  const zone = `<div class="frm"><div class="ms">${['nov.', 'déc.', 'janv.', 'févr.', 'mars', 'avr.'].map((m) => `<span>${m}</span>`).join('')}</div>
  <div class="pis"><span class="lv ${etat === 'sans' ? 'est' : ''}" style="left:${auj}%;width:${fin - auj}%"></span><span class="cmd" style="left:${auj}%"></span><span class="tr" style="left:${fin}%;background:#fff;border-radius:6px;padding:0 2px">${ic('truck', 22)}</span><span class="po" style="left:${paye}%">${ic('wallet', 16)}</span></div>
  <div class="cs">${cs.map((c) => `<span class="${c}">${ico(c)}</span>`).join('')}</div>
  <div class="lgd"><span><i style="background:#8db06a"></i>payable</span><span><i style="background:#d0574d"></i>trop juste</span><span><i style="border:2px dashed #bbb"></i>prix ?</span></div></div>
  <div class="rec">${pz}<span>payé <b>${d.paye}</b>${etat === 'sans' ? ' <span class="brun">· estimé</span>' : ''}</span><span style="margin-left:auto;color:var(--ach);font-weight:700">→ À venir</span></div>`;
  return { css: C_CSS + C2_CSS, corps: carnetTete() + carteOuverte(etat, zone) + autresC(etat) };
}

// ---- C3 : après « Choisir » : la carte prend le bleu d'Achats ; l'achat posé en jalon au mois d'À venir, sans verdict ----
const C3_CSS = `
.prise{display:flex;align-items:center;gap:8px;margin:8px 0 6px}
.prise .av{white-space:nowrap;flex:none;display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 14px;border-radius:12px;background:var(--ach);color:#fff;font-size:17px;font-weight:700}
.prise .av.dft{background:#fff;color:var(--ach);border:2.5px dashed var(--ach)}
.prise .an{display:inline-flex;align-items:center;gap:5px;font-size:16px;color:#2f5e86;font-weight:600;margin-left:auto}
.cal{border-top:1.5px solid #c9d8ec;margin-top:8px;padding-top:6px}
.cal .ax{display:grid;grid-template-columns:repeat(6,1fr);font-size:14px;color:#666;text-align:center}
.cal .hd2{color:var(--ach);font-weight:800;font-size:18px;margin-bottom:4px}
.cal .rw{position:relative;height:34px;background:repeating-linear-gradient(90deg,transparent 0 calc(100%/6 - 1px),#e3e9f1 calc(100%/6 - 1px) calc(100%/6))}
.cal .jl{position:absolute;top:4px;height:26px;display:flex;align-items:center;gap:5px;white-space:nowrap;font-size:16px;color:#222}
.cal .jl.g{flex-direction:row-reverse}
.cal .jl .pt{display:block;width:14px;height:14px;border-radius:50%;background:#fff;border:2.5px solid var(--ach);flex:none}
.cal .jl.neuf .pt{background:var(--ach)}
.cal .jl.est .pt{border-style:dashed;background:#fff}
.cal .jl .lb{height:26px;display:flex;align-items:center;gap:6px;padding:0 9px 0 16px;background:var(--achc);clip-path:polygon(10px 0,100% 0,100% 100%,10px 100%,0 50%);font-weight:700}
.cal .jl.g .lb{padding:0 16px 0 9px;clip-path:polygon(0 0,calc(100% - 10px) 0,100% 50%,calc(100% - 10px) 100%,0 100%)}
.cal .lien{display:flex;align-items:center;justify-content:flex-end;font-size:15px;color:#2f5e86;font-weight:600;margin-top:4px}
`;
function C3(etat) {
  const d = C_DATA[etat];
  const a = art(etat, d.id);
  const mont = a.prix.devis ? '<span class="pd" style="padding:0 6px;font-size:15px;height:22px;border-radius:7px">CHF ?</span>' : `<span class="mono">${a.prix.eur ? '≈' : ''}${n(valeur(a.prix))}</span>`;
  const colP = { repos: 2, sans: 3, eur: 1 }[etat];
  const jalon = (col, html, cls = '') => {
    const c = ((col + 0.5) / 6) * 100;
    const g = col >= 3;
    return `<span class="jl ${cls} ${g ? 'g' : ''}" style="${g ? `right:calc(${(100 - c).toFixed(2)}% - 7px)` : `left:calc(${c.toFixed(2)}% - 7px)`}"><i class="pt"></i>${html}</span>`;
  };
  const zone = `<div class="prise"><span class="av ${etat === 'sans' ? 'dft' : ''}">${ic('cal', 18)}À venir · ${d.paye}</span><span class="an">${ic('undo', 17)}Annuler</span></div>
  <div class="cal"><div class="hd2">Achats</div>
  <div class="ax">${['N', 'D', 'J', 'F', 'M', 'A'].map((m) => `<span>${m}</span>`).join('')}</div>
  <div class="rw" style="margin-top:6px">${jalon(1, `<span>Malt groupé <span class="mono">540</span></span>`)}</div>
  <div class="rw">${jalon(colP, `<span class="lb">Chambre froide ${mont}</span>`, `neuf ${etat === 'sans' ? 'est' : ''}`)}</div>
  <div class="lien">Calendrier${ic('chevR', 16)}</div></div>`;
  return { css: C_CSS + C3_CSS, corps: carnetTete() + carteOuverte(etat, zone, { coche: true, sansBoutons: true, style: 'border:2.5px solid var(--ach);background:#f5f8fd' }) + autresC(etat) };
}

// ---------- écriture ----------
export const VERSIONS = { a1: A1, a2: A2, a3: A3, b1: B1, b2: B2, b3: B3, c1: C1, c2: C2, c3: C3 };
export const ETATS_NOMS = ['repos', 'sans', 'eur'];
// Écartées au tour 1 (CRITIQUE-1) : leurs pages restent celles de la v0, non régénérées.
const FIGEES = ['a2', 'b2', 'c2'];
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let k = 0;
  for (const [v, f] of Object.entries(VERSIONS)) {
    if (FIGEES.includes(v)) continue;
    for (const e of ETATS_NOMS) {
      const { css, corps } = f(e);
      fs.writeFileSync(path.join(ICI, `cmp-${v}-${e}.html`), page(`Carnet · ${v} · ${e} · 21.11`, css, corps));
      k++;
    }
  }
  console.log('écrit', k, 'pages');
}
