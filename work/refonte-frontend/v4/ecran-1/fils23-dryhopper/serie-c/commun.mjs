// Lot 23 · série C (« les vraies valeurs d'abord ») · le commun des huit concepts c1 à c8.
// Une seule question : « Quand ajouter Idaho 7 ? ». Un seul facteur libre : le moment (D98).
// Fixé : Idaho 7 (α 12,7 %, fiches 9,5–14,9), 4 g/L, US-05, Stout 16D.
// Données lues ici, jamais recopiées à la main :
//   - fils21-choisir/donnees/profils-simules.json : la grille (Idaho 7, 4 g/L, US-05 ; Pomona pour l'aperçu
//     de la levure), la bière avant, les bandes du style 16D ;
//   - fils21-choisir/donnees/comparatifs-dryhop.json : les études E01 à E10 (une ligne lue par variété, L14).
// Socle : fils21-choisir/w1/socle-w.mjs (pictos au trait, α, usage en mot, stock en icône, la vraie fiche à
// l'appui long, la légende derrière « ? »). Classes propres préfixées par l'id du concept (L26).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../../fils21-choisir/w1/socle-w.mjs';
import { runtime } from '../../fils18-baseline/l8g/noyau.mjs';

export { S };
export const ICI = path.dirname(fileURLToPath(import.meta.url));
const DON = path.resolve(ICI, '../../fils21-choisir/donnees');
const lire = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const G = lire(path.join(DON, 'profils-simules.json'));
const CMP = lire(path.join(DON, 'comparatifs-dryhop.json'));
export const { esc, fr, ic, pic, JET, NOM, COURT } = S;
export const ORDRE = G.style.ordre;
export const ACC = '#c2410c';
export const COUL_I7 = S.HOP['Idaho 7'].couleur;

// ---------- le simulé : Idaho 7, 4 g/L, US-05 ----------
const ent = (lev) => G.grille.filter((x) => x.nom === 'Idaho 7' && x.dose_gL === 4 && x.levure === lev);
const I7 = ent('fermentis-us05'), I7P = ent('lalbrew-pomona');
if (I7.length < 12) throw new Error('grille Idaho 7 introuvable');
const centres = (e) => Object.fromEntries(ORDRE.map((f) => [f, e.apres[f][1]]));
const inconnus = (e) => ORDRE.filter((f) => e.apres[f][0] === 0 && e.apres[f][1] === 0 && e.apres[f][2] === 0);
export const AV = Object.fromEntries(ORDRE.map((f) => [f, G.biere.avant[f].centre]));
export const BANDE = Object.fromEntries(ORDRE.map((f) => [f, G.style.zone[f].bande[1]]));
// IBU ajoutés : ceux de l'écran Dryhopper de la carte (fils22-carte, lot 22), marqués « ~ » ; à cru : non modélisé.
const IBU = { b60: 102, b30: 78, b15: 50, b10: 37, wp: 15 };
const trouve = (m, j, lev = I7) => lev.find((x) => x.moment === m && (x.jours ?? null) === j);
const MO = [];
for (let mn = 60; mn >= 10; mn -= 5) {
  const e = trouve('b' + mn, null);
  MO.push({ id: 'b' + mn, lib: mn + '′', court: mn + '′', seg: 0, v: e ? centres(e) : null, inc: e ? inconnus(e) : [], ibu: IBU['b' + mn] ?? null, cru: false });
}
{ const e = trouve('wp', null); MO.push({ id: 'wp', lib: 'whirlpool', court: 'WP', seg: 1, v: centres(e), inc: inconnus(e), ibu: IBU.wp, cru: false }); }
for (const [m, s, mot] of [['dryActive', 2, 'actif'], ['dryPost', 3, 'après']]) for (const j of [1, 2, 3, 5, 7]) {
  const e = trouve(m, j), p = trouve(m, j, I7P);
  MO.push({ id: m + '|' + j, lib: mot + ' · ' + j + ' j', court: 'J' + j, seg: s, j, v: centres(e), inc: inconnus(e), ibu: null, cru: true, pomona: centres(p) });
}
export { MO };
export const DEPART = MO.findIndex((m) => m.id === 'dryActive|3');
export const SEGMOTS = ['ébullition', 'whirlpool', 'fermentation active', 'après fermentation'];

// ---------- les vraies valeurs : comparatifs-dryhop.json ----------
export const E = Object.fromEntries(CMP.etudes.map((e) => [e.id, e]));
const auteur = (e) => e.ref.split(/[ ,]/)[0];
const annee = (e) => (e.ref.match(/\b(19|20)\d{2}\b/) || [''])[0];
export const SRC = (id) => auteur(E[id]) + ' ' + annee(E[id]) + ' · ' + id;
export const NIV = (id) => (E[id].niveau === 'P' ? 'publié' : 'congrès / thèse');
// Une mesure, lue par étude, variété et composé (ou descripteur) ; µg/L si l'étude publie en mg/L.
export function mes(id, variete, quoi, dose) {
  const m = E[id].mesures.find((x) => x.variete === variete && (x.compose === quoi || (x.descripteur || '').includes(quoi)) && (dose == null || x.dose_gL === dose));
  if (!m) throw new Error('mesure absente : ' + [id, variete, quoi, dose].join(' / '));
  const ug = m.unite === 'mg/L' ? Math.round(m.valeur * 1000 * 10) / 10 : m.valeur;
  return { ...m, v: ug, u: m.unite === 'mg/L' ? 'µg/L' : m.unite, id };
}
// Seuils de perception publiés dans la diapositive de Feng 2015 (E06, champ « note »), vérifiés à la lecture.
const NOTE6 = E.E06.note;
for (const t of ['myrcène 13', 'linalol 4-10', 'humulène 120', 'caryophyllène 64-90']) if (!NOTE6.includes(t)) throw new Error('seuil absent de E06 : ' + t);
export const SEUIL = { linalol: [4, 10], 'myrcène': [13, 13], 'α-humulène': [120, 120], 'β-caryophyllène': [64, 90] };

// Les vraies valeurs que la série montre (une ligne lue par variété).
export const V = {
  i7: ['linalol', 'myrcène', 'α-humulène', 'β-caryophyllène'].map((c) => mes('E03', 'Idaho-7', c)),
  ohai0: mes('E04', 'Cascade', 'OHAI', 0), ohai: mes('E04', 'Cascade', 'OHAI', 3.86),
  agr0: mes('E04', 'Cascade', 'citrus', 0), agr: mes('E04', 'Cascade', 'citrus', 3.86),
  herb0: mes('E04', 'Cascade', 'herbal/tea', 0), herb: mes('E04', 'Cascade', 'herbal/tea', 3.86),
  linCitra: mes('E06', 'Citra', 'linalol'), linTem6: mes('E06', 'témoin (sans houblon)', 'linalol'),
  myrCitra: mes('E06', 'Citra', 'myrcène'), myrTem6: mes('E06', 'témoin (sans houblon)', 'myrcène'),
  linTem2: mes('E02', 'témoin (sans houblon)', 'linalol'),
  lin2: ['Rubín', 'Saaz', 'Vital', 'Harmonie', 'Kazbek'].map((v) => mes('E02', v, 'linalol')),
  lin1: mes('E01', '5 bières (plage)', 'linalol libre'),
  ebu: mes('E07', 'Simcoe et Hallertau', 'cooked/veg'),
  wolfeLin: mes('E05', 'Cascade pastilles, passif', 'linalol, extraction'),
  wolfeLim: mes('E05', 'Cascade pastilles, passif', 'limonène, extraction'),
  eureka: mes('E08', 'Eureka!', 'fruité cassis'),
  titus: mes('E10', 'Cascade', 'différence d'),
};
// « 43,1 / 43,1 / 39,5 % de l'huile (6 h / pic / final) » → trois nombres.
export const trois = (m) => String(m.valeur).split('/').map((x) => parseFloat(x.replace(',', '.')));
export const FAM_C = { linalol: 'floral', 'myrcène': 'resin', 'α-humulène': 'herbal', 'β-caryophyllène': 'spice' };
export const NOM_C = { linalol: 'linalol', 'myrcène': 'myrcène', 'α-humulène': 'humulène', 'β-caryophyllène': 'caryophyllène' };

// ---------- morceaux d'écran ----------
export const titre = 'Quand ajouter Idaho 7 ?';
export const tete = (P) => `<header class="${P}-tete"><button class="w-ret" type="button" aria-label="Retour">${ic('chev-l', 20)}</button><h1>${titre}</h1><button type="button" class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Lire la légende">?</button></header>`;
export const contexte = (P) => `<p class="${P}-ctx" data-role="contexte" aria-label="Fixé pour cette question"><span class="${P}-cx" data-contexte="houblon">${S.nomH('Idaho 7')}${S.alpha('Idaho 7', { plage: true })}${S.usage('Idaho 7')}${S.stock('Idaho 7', 80)}</span><span class="${P}-cx" data-contexte="dose">4 g/L</span><span class="${P}-cx" data-contexte="levure">US-05</span><span class="${P}-cx" data-contexte="base">${ic('biere', 14)}Stout 16D</span></p>`;
export const lentille = (P) => `<span class="seg lentille ${P}-lent" role="radiogroup" data-lecture aria-label="Lecture au style ou absolue"><button role="radio" type="button" data-e="style" aria-checked="true">Au style</button><button role="radio" type="button" data-e="absolu" aria-checked="false">Absolu</button></span>`;
export const badge = (k) => S.conf(k);
export const hach = (txt = 'inconnu') => `<span class="w-inc"><i class="w-hach" aria-hidden="true"></i>${txt}</span>`;
// Le pont vers la levure, deux formes (choix ouvert du brasseur, L24).
export const levure = (P, forme) => forme === 'etape'
  ? `<nav class="${P}-pont" aria-label="Étapes de Dryhopper"><span class="${P}-et on">1 Quand</span><span class="${P}-et">2 Levure</span><a class="${P}-go" href="../../../fils22-carte/levure-etape/etat.html">Puis la levure ›</a></nav>`
  : `<nav class="${P}-pont" aria-label="Vers l'outil Levure"><a class="${P}-go second" href="../../../fils22-carte/levure-outil/etat.html">${ic('bio', 16)}Que change ma levure ? ›</a></nav>`;

// Barres de l5b, face à la zone de la 16D, rond creux = ta stout avant ; une ligne par famille.
export function barres(P, familles = ORDRE, o = {}) {
  return `<div class="${P}-bars" data-role="profil">${familles.map((f) => `<div class="${P}-ba" data-f="${f}" data-famille="${f}"><span class="${P}-ban">${pic(f, o.z || 16)}${o.noms === false ? '' : `<span>${COURT[f]}</span>`}</span><span class="${P}-pis"><i class="${P}-zo" data-role="zone"></i><i class="${P}-re"></i><i class="${P}-hc" hidden></i><i class="${P}-av"></i></span><span class="${P}-bav mono" data-nature="simule"></span></div>`).join('')}</div>`;
}
export const CSS_BARRES = (P, h = 12) => `
  .${P}-bars { display: flex; flex-direction: column; gap: 3px; }
  .${P}-ba { display: grid; grid-template-columns: 88px 1fr 44px; align-items: center; gap: 6px; font-size: 13px; min-height: ${h + 6}px; }
  .${P}-ban { display: flex; align-items: center; gap: 4px; color: var(--t); font-weight: 600; white-space: nowrap; }
  .${P}-pis { position: relative; height: ${h}px; background: #f1f2f5; border-radius: 2px; overflow: hidden; }
  .${P}-pis i { position: absolute; top: 0; bottom: 0; left: 0; display: block; }
  .${P}-zo { width: var(--zs, 50%); background: #dfe2e8; }
  body.abs .${P}-zo { width: var(--za, 27%); }
  .${P}-re { width: var(--ws, 0%); background: var(--b); height: ${Math.round(h / 2)}px; top: ${Math.round(h / 4)}px !important; border-radius: 0 2px 2px 0; transition: width .2s; }
  body.abs .${P}-re { width: var(--wa, 0%); }
  .${P}-ba.hors .${P}-re { background: linear-gradient(90deg, var(--b) 0 var(--zs, 50%), ${ACC} var(--zs, 50%)); }
  .${P}-av { left: clamp(4px, var(--as, 0%), calc(100% - 4px)) !important; width: 8px; height: 8px; top: ${Math.round(h / 2) - 4}px !important; margin-left: -4px; border-radius: 50%; border: 2px solid var(--encre); background: #fff; }
  body.abs .${P}-av { left: clamp(4px, var(--aa, 0%), calc(100% - 4px)) !important; }
  .${P}-hc { right: 0; background: repeating-linear-gradient(135deg, #c9cdd6 0 2px, transparent 2px 6px); }
  .${P}-bav { text-align: right; font-size: 12px; color: var(--t); }
  .${P}-ba.hors .${P}-bav { color: ${ACC}; }`;
// La mise à jour des barres, côté page (MO, AV, BANDE en global).
export const JS_BARRES = `
function majBarres(root, i) {
  const P = root.className.split("-")[0];
  const p = MO[i];
  root.querySelectorAll('[data-f]').forEach((r) => {
    const f = r.dataset.f, hc = r.querySelector('.' + P + '-hc'), re = r.querySelector('.' + P + '-re'), v = r.querySelector('.' + P + '-bav'), s = r.style;
    const B = BANDE[f], zs = 50, za = B / 110 * 100;
    s.setProperty('--zs', zs + '%'); s.setProperty('--za', za + '%');
    s.setProperty('--as', Math.min(100, AV[f] / B * 50) + '%'); s.setProperty('--aa', Math.min(100, AV[f] / 110 * 100) + '%');
    const inc = !p.v || p.inc.includes(f);
    hc.hidden = !inc; re.hidden = inc; r.classList.toggle('inc', inc);
    if (inc) { v.textContent = p.v ? '?' : '?'; r.classList.remove('hors'); return; }
    const x = p.v[f], d = x - AV[f];
    s.setProperty('--ws', Math.min(100, x / B * 50) + '%'); s.setProperty('--wa', Math.min(100, x / 110 * 100) + '%');
    v.textContent = Math.abs(d) >= 0.5 ? '~' + (d >= 0 ? '+' : '−') + Math.abs(Math.round(d)) : '≈';
    r.classList.toggle('hors', x > B);
  });
}`;

// ---------- le rail du moment, horizontal (y1b : « glisser comme un slider », par 5′) ----------
export const SEG = [[0, 46], [46, 54], [54, 77], [77, 100]];
export function rail(P, o = {}) {
  const SG = o.seg || SEG;
  const lab = SG.map(([a, b], k) => `<span style="left:${(a + b) / 2}%">${['ébullition', 'WP', 'actif', 'après'][k]}</span>`).join('');
  return `<div class="${P}-frise${o.dock ? ' ' + P + '-dock' : ''}" data-libre="moment">${o.haut || ''}
  <div class="${P}-rail" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="${MO.length - 1}" aria-valuenow="${DEPART}" aria-valuetext="${MO[DEPART].lib}">
    ${SG.map(([a, b], k) => `<span class="${P}-sg s${k}" style="left:${a}%;width:${b - a}%"></span>`).join('')}
    ${MO.map((m, k) => `<i class="${P}-tk${m.v ? '' : ' vide'}" data-k="${k}"></i>`).join('')}
    <span class="${P}-pouce"><span class="${P}-pl">${MO[DEPART].lib}</span></span></div>
  <div class="${P}-rep">${lab}</div></div>`;
}
export const CSS_RAIL = (P) => `
  .${P}-frise { background: #fff; border-radius: 8px; padding: 30px 16px 6px; touch-action: none; position: relative; }
  .${P}-dock { position: sticky; bottom: 0; z-index: 5; box-shadow: 0 -1px 0 var(--trait); border-radius: 8px 8px 0 0; }
  .${P}-rail { position: relative; height: 22px; cursor: pointer; }
  .${P}-sg { position: absolute; top: 8px; height: 6px; border-radius: 2px; }
  .${P}-sg.s0 { background: #e8b4a0; } .${P}-sg.s1 { background: #b9a4d8; } .${P}-sg.s2 { background: #9fc3e6; } .${P}-sg.s3 { background: #8fcfb4; }
  .${P}-tk { position: absolute; top: 5px; width: 1.5px; height: 12px; margin-left: -.75px; background: var(--encre); opacity: .55; }
  .${P}-tk.vide { opacity: .25; }
  .${P}-pouce { position: absolute; top: 1px; width: 20px; height: 20px; margin-left: -10px; border-radius: 50%; background: var(--encre); transition: left .12s; }
  .${P}-pl { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: var(--encre); color: #fff; font: 600 13px var(--sans); padding: 2px 8px; border-radius: 999px; }
  .${P}-rep { position: relative; height: 16px; margin-top: 2px; font-size: 12px; color: var(--gris); }
  .${P}-rep span { position: absolute; transform: translateX(-50%); white-space: nowrap; }`;
export const JS_RAIL = (P, seg = SEG) => `
(function () {
  const SEG = ${JSON.stringify(seg)}, rail = document.querySelector('.${P}-rail'), N = MO.length - 1;
  const x = (i) => { const s = MO[i].seg, idx = MO.map((p, k) => k).filter((k) => MO[k].seg === s), n = idx.length, [a, b] = SEG[s]; return n === 1 ? (a + b) / 2 : a + (b - a) * (0.06 + 0.88 * idx.indexOf(i) / (n - 1)); };
  rail.querySelectorAll('[data-k]').forEach((t) => { t.style.left = x(+t.dataset.k) + '%'; });
  const cur = () => +rail.getAttribute('aria-valuenow');
  function poser(i) { rail.setAttribute('aria-valuenow', i); rail.setAttribute('aria-valuetext', MO[i].lib); rail.querySelector('.${P}-pouce').style.left = x(i) + '%'; rail.querySelector('.${P}-pl').textContent = MO[i].lib; window.maj && window.maj(i); }
  function depuis(e) { const r = rail.getBoundingClientRect(), pct = (e.clientX - r.left) / r.width * 100; let best = 0, bd = 1e9; for (let k = 0; k <= N; k++) { const d = Math.abs(x(k) - pct); if (d < bd) { bd = d; best = k; } } if (best !== cur()) poser(best); }
  rail.addEventListener('pointerdown', (e) => { rail.setPointerCapture(e.pointerId); depuis(e); });
  rail.addEventListener('pointermove', (e) => { if (e.buttons) depuis(e); });
  rail.addEventListener('keydown', (e) => { const i = cur(); if (e.key === 'ArrowRight') poser(Math.min(N, i + 1)); if (e.key === 'ArrowLeft') poser(Math.max(0, i - 1)); });
  window.poser = poser;
  const q = location.search.match(/moment=([^&]+)/); poser(q ? Math.max(0, MO.findIndex((p) => p.id === decodeURIComponent(q[1]))) : ${DEPART});
})();`;

// ---------- la page ----------
export function page({ id, chaleur, resume, corps, css, js, legende }) {
  const rt = runtime({ extra: '' })
    .split(/const FD = [^\n]*;\nconst ROUE/).join('const FD = ' + JSON.stringify(S.FICHES) + ';\nconst ROUE')
    .split(/DEMANDE = \[[^\]]*\]/).join('DEMANDE = ' + JSON.stringify([{ f: 'floral', s: 1 }, { f: 'resin', s: -1 }]));
  if (!rt.includes('"Idaho 7"')) throw new Error('fiche : FD non remplacé');
  const SIM = { B: Object.fromEntries(ORDRE.map((f) => [f, G.style.zone[f].bande])), C: {}, NOM, AV: {} };
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${id} · Dryhopper · ${titre}</title>
<!-- Lot 23 · série C (les vraies valeurs d'abord) · ${id} · chaleur ${chaleur} · ${resume} -->
${S.POLICES}
<style>${S.CSS}
  html, body { background: #eef0f4; }
  .ecran { gap: 8px; padding: 4px 12px 16px; }
${css}</style>
</head>
<body>
${S.SYMB}
<main class="ecran">${corps}
</main>
<div class="w-voile" data-role="legende-voile" hidden></div><section class="w-leg" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
  <div class="w-f-t"><b>Légende</b><button type="button" data-role="legende-fermer" aria-label="Fermer la légende">${ic('x', 18)}</button></div>
  <div class="w-leg-s"><h3>Les familles</h3><div class="w-leg-g">${ORDRE.map((f) => `<span class="w-leg-i">${pic(f, 18)}${COURT[f]}</span>`).join('')}</div></div>
  <div class="w-leg-s"><h3>Les mots</h3><div class="w-leg-g l2">
    <span class="w-leg-i">${S.conf('mesure')}en bière, avec l’étude</span><span class="w-leg-i">${S.conf('panel')}goûté par un jury</span>
    <span class="w-leg-i">${S.conf('simule')}profil estimé d’Idaho 7, pas une mesure</span><span class="w-leg-i">${S.conf('inconnu')}aucune donnée, jamais zéro</span>
    <span class="w-leg-i">${S.conf('verifier')}lecture du tableau à vérifier</span><span class="w-leg-i">${ic('main', 16)}appui long sur Idaho 7 : sa fiche</span></div></div>
  ${legende}
</section>
<div class="w-voile" data-role="feuille-voile" hidden></div><div class="w-feuille" role="dialog" aria-label="Preuve"></div>
<script>const SIM = ${JSON.stringify(SIM)};
${S.JS_COMMUN}
const MO = ${JSON.stringify(MO)}, AV = ${JSON.stringify(AV)}, BANDE = ${JSON.stringify(BANDE)}, NOMF = ${JSON.stringify(COURT)};
${JS_BARRES}
${js}</script>
<script>${rt}</script>
</body>
</html>
`;
}
export const ecrire = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); console.log('écrit ' + path.relative(process.cwd(), f) + ' (' + Math.round(s.length / 1024) + ' Ko)'); };
// Le style commun des têtes et du contexte, préfixé.
export const CSS_TETE = (P) => `
  .${P}-tete { display: flex; align-items: center; gap: 6px; min-height: 38px; }
  .${P}-tete h1 { font-size: 17px; font-weight: 700; flex: 1; }
  .${P}-ctx { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 13px; }
  .${P}-cx { display: inline-flex; align-items: center; gap: 5px; min-height: 24px; padding: 0 8px; border-radius: 999px; background: #e2e5eb; color: var(--encre); white-space: nowrap; }
  .${P}-cx .ic { color: var(--gris); }
  .${P}-lent { margin-left: auto; }
  .${P}-pont { display: flex; align-items: center; justify-content: flex-end; gap: 6px; flex-wrap: wrap; }
  .${P}-et { font-size: 12px; font-weight: 600; color: var(--gris); padding: 0 8px; height: 24px; display: inline-flex; align-items: center; border-radius: 999px; box-shadow: inset 0 0 0 1px #c9cad2; }
  .${P}-et.on { color: #fff; background: var(--encre); box-shadow: none; }
  .${P}-go { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: 999px; background: var(--encre); color: #fff !important; font-weight: 600; font-size: 14px; margin-left: auto; }
  .${P}-go.second { background: #fff; color: var(--encre) !important; box-shadow: inset 0 0 0 1.5px var(--encre); }`;
