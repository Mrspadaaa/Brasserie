// Carte des outils houblons, en fil de fer (voie r1-carte, mission 2026-10-22-reprise-lot21).
// Suit la stout export 16D de l'étape Houblons de Ma bière jusqu'à Dryhopper et Levure : un écran
// par outil, un seul facteur libre par écran ([data-libre]), les autres fixés sur une ligne de
// contexte ([data-role="contexte"]), le pont vers l'outil suivant dans un <nav>.
// Verdict du conseil : cerveau/decisions/2026-10-22-carte-outils-houblons.md (« Recommandation »).
// Passe 2 (critique r5-critique-carte) : radar de Comparer à 12 axes sans tirets (D48, D57, D39, D77),
// écrans remplis (D4 ≥ 0,8), α du lot puis plage des fiches et « ≠ » hors fiches (D87, L14), α dans
// Dryhopper et Levure, extras de Suggérer (D76), familles citées sans cases vides, légendes derrière
// « ? » (D89), aucun mot de stock (D23 ter), rail à loupe sans graduations au repos (D47, L12).
//
// Données (aucun chiffre inventé) :
//   - ../fils22-comparer/donnees/comparer-stout.json (r6e-entrees, vérifié) : la stout, l'avant,
//     la grille simulée (dose 1/2/4/8 g/L × moment × jours × US-05/Pomona), α et plages des fiches,
//     rôles, IBU par gramme, bandes du style 16D ;
//   - ../base/consolide/substitution.html (base v4.7, u4) : remplaçants de Nugget, dose à IBU égal,
//     α (lot, plages), rôle, familles citées, perd / gagne, proximité par composante, stock ;
//   - ../base/consolide/biere.html : IBU 60, OG 1,066, EBC 70, Nugget 46 g à 60′.
// Le simulé est marqué « ~ » ; l'inconnu s'écrit « ? » ou se hachure, jamais 0.
//
// Usage : node generer.mjs            (écrit les huit etat.html et carte.html)
//         node generer.mjs --captures (puis les captures à 390 px dans captures/)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const J = JSON.parse(fs.readFileSync(path.join(ici, '../fils22-comparer/donnees/comparer-stout.json'), 'utf8'));
const JETONS = JSON.parse(fs.readFileSync(path.join(ici, '../fils17-standard/jetons-familles.json'), 'utf8'));
const TEMOIN = fs.readFileSync(path.join(ici, '../../tournoi/outils/temoins/une-question-ok/etat.html'), 'utf8');
const SUBST = fs.readFileSync(path.join(ici, '../base/consolide/substitution.html'), 'utf8');

// ---------- données ----------
const COURT = { citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', floral: 'Floral', herbal: 'Herbacé', resin: 'Résineux', spice: 'Épicé', green: 'Végétal', earthy: 'Terreux' };
const ORDRE = J.style.ordre; // floral, herbal, earthy d'abord (attendues du 16D)
const ROUE = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin']; // roue de la base (lot 16, r2)
const BANDE = Object.fromEntries(Object.entries(J.style.zone).map(([k, v]) => [k, v.bande[1]]));
const ATTENDUES = Object.entries(J.style.zone).filter(([, v]) => v.statut === 'attendue').map(([k]) => k);
const AVANT = Object.fromEntries(Object.entries(J.biere.avant).map(([k, v]) => [k, v.centre]));
const AVANT_INCONNU = new Set(Object.entries(J.biere.avant).filter(([, v]) => v.inconnu).map(([k]) => k));
const H = Object.fromEntries(J.houblons.map((h) => [h.nom, h]));
const point = (nom, moment, jours, dose = 4, levure = 'fermentis-us05') => H[nom].grille.find((x) => x.moment === moment && x.jours === (jours ?? null) && x.dose_gL === dose && x.levure === levure);
const centre = (p) => Object.fromEntries(Object.entries(p.apres).map(([k, v]) => [k, v[1]]));
const inconnus = (p) => new Set(Object.entries(p.apres).filter(([, v]) => v[1] === 0 && v[2] === 0).map(([k]) => k));
const ipg = (nom, code) => { const m = H[nom].ibuParGramme.moments.find((x) => x.code === code); return m && m.ibuPerGram ? m.ibuPerGram.value : null; };
const VOLUME = J.biere.recette.volumeL; // 20 L
const fr = (x, d = 0) => (Math.round(x * 10 ** d) / 10 ** d).toFixed(d).replace('.', ',');
const fr1 = (x) => (Number.isInteger(x) ? String(x) : fr(x, 1));
const signe = (x) => (x >= 0 ? '+' : '−') + fr(Math.abs(x));

// Remplaçants de Nugget (substitution.html, base v4.7) : objets complets du classement et des fiches.
const objet = (i) => { let d = 0, e = i; do { if (SUBST[e] === '{') d++; if (SUBST[e] === '}') d--; e++; } while (d); return JSON.parse(SUBST.slice(i, e)); };
const remplacants = [];
{
  const re = /\{"cle":"beermaverick-[^"]+","nom":"[^"]+","score"/g;
  let m;
  while ((m = re.exec(SUBST))) { const o = objet(m.index); if (!remplacants.some((r) => r.cle === o.cle)) remplacants.push(o); }
}
const fiche = (k) => {
  const i = SUBST.indexOf('"' + k + '":{"nom"'); if (i < 0) return null;
  const o = objet(i + k.length + 3);
  return { role: o.role.v, alpha: o.alpha.map((a) => ({ min: a.min, max: a.max })), huiles: (o.huiles || []).map((a) => ({ min: a.min, max: a.max })), lot: o.lot, aromes: o.aromes.filter((x) => x.lv > 0).map((x) => x.f) };
};
for (const r of remplacants) Object.assign(r, fiche(r.cle));
remplacants.sort((a, b) => b.score - a.score);
const NUGGET = fiche('beermaverick-nugget');
const R = (n) => remplacants.find((r) => r.nom === n);

// Couleurs de houblon : une par houblon, la même sur tous les écrans (D83 S1).
const COUL = { Nugget: '#0072b2', Cascade: '#c0143c', 'Idaho 7': '#5b3fa0', Galaxy: '#12867a', 'Nelson Sauvin': '#8c510a', Magnat: '#2a9d3a' };
const LEVC = { 'fermentis-us05': '#7a7f8c', 'lalbrew-pomona': '#2563eb' };
// Rôle en mot (D90) : la règle rôle-α v1 dit « double » ; le brasseur lit « mixte ».
const ROLE = { aromatique: 'aromatique', double: 'mixte', amérisant: 'amérisant' };

// ---------- briques ----------
const symboles = TEMOIN.match(/<svg width="0" height="0"[^]*?<\/svg>/)[0];
const pi = (f, t = 16) => `<svg class="pi" width="${t}" height="${t}" data-famille="${f}" aria-label="${COURT[f]}"><use href="#p-${f}"/></svg>`;
const pt = (n) => `<span class="pt" data-houblon="${n}" data-couleur="${COUL[n]}" style="background:${COUL[n]}"></span>`;
const pc = (x, max) => Math.max(0, Math.min(100, (x / max) * 100)).toFixed(1) + '%';
// α (D87) : l'α du lot d'abord, puis la plage des fiches ; « ≠ » quand le lot sort des fiches.
function alpha(nom, lot, sources, { court = false, pref = true } = {}) {
  const A = pref ? 'α ' : '';
  const mn = Math.min(...sources.map((s) => s.min)), mx = Math.max(...sources.map((s) => s.max));
  const plage = fr1(mn) + '–' + fr1(mx);
  if (lot == null) return `<span class="num alpha" data-role="alpha" data-source="fiches" data-houblon="${nom}">${A}${plage}%</span>`;
  const hors = lot < mn || lot > mx;
  return `<span class="num alpha" data-role="alpha" data-source="lot" data-houblon="${nom}">${A}${fr1(lot)}%${court ? '' : ` <span class="${hors ? 'ne' : 'pl'}">${hors ? '≠ ' : ''}${plage}</span>`}</span>`;
}
const alphaJ = (n, o) => alpha(n, H[n].alpha.retenu.value, H[n].alpha.sources, o);
// Barre au style (l5b) : axe 0 → 2 × le haut de la bande du style ; zone du style = la moitié gauche.
// En absolu : axe 0 → 110 sur l'échelle V5.5, zone = la bande brute.
function barre(f, { avant, apres, txt = '', deg = false, inconnu = false, nomme = true, profil = false }) {
  if (profil) apres = avant;
  const b = BANDE[f];
  const s = (x) => pc(x / b, 2), a = (x) => pc(x, 110);
  const fill = (apres == null && !profil) || inconnu ? '' : `<i class="rem" style="--ws:${s(apres)};--wa:${a(apres)};background:${JETONS[f].base}"></i>`;
  const tick = avant == null || inconnu ? '' : `<i class="av${deg ? ' deg' : ''}" style="--ws:${s(avant)};--wa:${a(avant)}"></i>`;
  const hors = !inconnu && (apres != null ? apres > b : avant > b);
  return `<div class="ba" data-f="${f}"><span class="ba-n${ATTENDUES.includes(f) ? ' att' : ''}">${pi(f)}${nomme ? COURT[f] : ''}</span><span class="piste"><i class="zone" data-role="zone" style="--ws:50%;--wa:${a(b)}"></i>${inconnu ? '<i class="hach"></i>' : ''}${fill}${tick}</span><span class="ba-v" style="color:${hors ? 'var(--acc)' : JETONS[f].texte}">${txt}</span></div>`;
}
// Radar de houblons, contrat v2 (controle-radar) : 12 axes dans l'ordre de la roue, agrumes en haut,
// zone du style (seule surface pleine), une couleur par houblon en trait de 2,5 px, aucun tiret ;
// valeurs au style (valeur / haut de la bande), axe jusqu'à ×2 ; au-delà, un trait sort du cercle.
function radar(series, { taille = 300, objet = 'houblons', inconnusCommuns = new Set() } = {}) {
  const c = taille / 2, r = c - 30, n = ROUE.length, M = 2;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const xy = (i, v) => { const k = (Math.min(v, M) / M) * r; return [c + k * Math.cos(ang(i)), c + k * Math.sin(ang(i))]; };
  const poly = (vals) => vals.map((v, i) => xy(i, v).map((z) => z.toFixed(1)).join(',')).join(' ');
  let s = `<svg class="radar" width="${taille}" height="${taille}" viewBox="0 0 ${taille} ${taille}" data-radar data-objet="${objet}" data-axes="${ROUE.join(',')}" role="img" aria-label="Radar au style, 12 familles">`;
  s += `<defs><pattern id="hachure" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#c9cad2" stroke-width="1.5"/></pattern></defs>`;
  ROUE.forEach((f, i) => { if (!inconnusCommuns.has(f)) return; const a0 = ang(i - 0.5), a1 = ang(i + 0.5); s += `<path data-inconnu="${f}" d="M${c},${c} L${(c + r * Math.cos(a0)).toFixed(1)},${(c + r * Math.sin(a0)).toFixed(1)} A${r},${r} 0 0 1 ${(c + r * Math.cos(a1)).toFixed(1)},${(c + r * Math.sin(a1)).toFixed(1)} Z" fill="url(#hachure)"/>`; });
  for (const k of [0.5, 1.5, 2]) s += `<polygon points="${poly(ROUE.map(() => k))}" fill="none" stroke="#e1e3e9" stroke-width="1"/>`;
  ROUE.forEach((f, i) => { const [x, y] = xy(i, M); s += `<line x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e1e3e9" stroke-width="1"/>`; });
  s += `<polygon data-role="zone" data-zone-valeurs="${ROUE.map(() => 1).join(',')}" points="${poly(ROUE.map(() => 1))}" fill="#c9cdd6" fill-opacity=".45" stroke="#9a9aa6" stroke-width="1"/>`;
  for (const se of series) {
    const v = ROUE.map((f) => (se.inconnus && se.inconnus.has(f) ? 0 : se.v[f] / BANDE[f]));
    s += `<g data-serie="${se.nom}" data-couleur="${se.c}" data-valeurs="${v.map((x) => x.toFixed(2)).join(',')}"><path d="M${poly(v).replace(/ /g, ' L')} Z" fill="none" stroke="${se.c}" stroke-width="2.5" stroke-linejoin="round"/>`;
    v.forEach((x, i) => {
      const [px, py] = xy(i, x);
      s += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" fill="${se.c}"/>`;
      if (x > M) { const [qx, qy] = xy(i, M); const k = r + 9; s += `<line x1="${qx.toFixed(1)}" y1="${qy.toFixed(1)}" x2="${(c + k * Math.cos(ang(i))).toFixed(1)}" y2="${(c + k * Math.sin(ang(i))).toFixed(1)}" stroke="${se.c}" stroke-width="2.5" stroke-linecap="round"/>`; }
    });
    s += '</g>';
  }
  ROUE.forEach((f, i) => { const k = r + 21; const x = c + k * Math.cos(ang(i)), y = c + k * Math.sin(ang(i)); s += `<svg x="${(x - 9).toFixed(1)}" y="${(y - 9).toFixed(1)}" width="18" height="18" viewBox="0 0 24 24" data-famille="${f}" aria-label="${COURT[f]}"><use href="#p-${f}"/></svg>`; });
  return s + '</svg>';
}
const lentille = (radarAussi = false, aide = '') => `<div class="lent">${aide}<span class="seg" data-lecture role="radiogroup" aria-label="lecture barres ou radar"${radarAussi ? '' : ' hidden'}><button type="button" role="radio" aria-checked="true" data-vue="barres">Barres</button><button type="button" role="radio" aria-checked="false" data-vue="radar">Radar</button></span><span class="seg" data-lecture role="radiogroup" aria-label="lecture au style ou absolu"><button type="button" role="radio" aria-checked="true" data-e="style">Au style</button><button type="button" role="radio" aria-checked="false" data-e="absolu">Absolu</button></span></div>`;
// Légende derrière un bouton discret, fermée au repos (D89).
const aide = (id, html) => `<button type="button" class="aide" data-role="legende-bouton" aria-expanded="false" aria-controls="${id}" aria-label="Lire la légende">?</button><div class="leg" id="${id}" data-role="legende" hidden>${html}</div>`;
const contexte = (items) => `<p class="ctx" data-role="contexte"><span class="fixe">fixé</span>${items.map(([k, t]) => `<span data-contexte="${k}">${t}</span>`).join('')}</p>`;
const tete = (titre, retour = '../ma-biere/etat.html') => `<header class="barre"><a class="retour" aria-label="Retour" href="${retour}">‹</a><h1 class="titre">${titre}</h1></header>`;
const stock = (oui) => `<span class="stk${oui ? ' oui' : ''}" data-stock role="img" aria-label="${oui ? 'en stock' : 'à acheter'}"></span>`;
const ctxIdaho = () => `${'Idaho 7'} ${alphaJ('Idaho 7')}`;

const CSS = `
:root { --encre:#16161a; --gris:#55555f; --trait:#e3e5eb; --mur:#eef0f4; --acc:#c2410c; --sans:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif; --mono:"IBM Plex Mono",ui-monospace,Consolas,monospace; }
[hidden] { display:none !important; }
* { box-sizing:border-box; margin:0; padding:0; }
html, body { background:var(--mur); }
body { color:var(--encre); font:400 14px/1.25 var(--sans); -webkit-tap-highlight-color:transparent; }
button { font:inherit; color:inherit; background:none; border:0; cursor:pointer; }
a { color:inherit; text-decoration:none; }
svg { display:block; flex:none; }
.ecran { max-width:390px; margin:0 auto; padding:4px 10px 16px; display:flex; flex-direction:column; gap:8px; }
.barre { display:flex; align-items:center; gap:8px; min-height:40px; }
.retour { width:28px; height:28px; border-radius:50%; background:#fff; border:1px solid var(--trait); display:inline-flex; align-items:center; justify-content:center; flex:none; font:600 20px/1 var(--sans); padding-bottom:2px; }
h1.titre { font:600 17px/1.2 var(--sans); }
.ctx { display:flex; flex-wrap:wrap; align-items:center; gap:4px; font-size:13px; color:var(--gris); }
.ctx .fixe { font-size:12px; color:var(--gris); margin-right:2px; }
.ctx [data-contexte] { display:inline-flex; align-items:center; gap:4px; height:22px; padding:0 8px; border-radius:11px; background:#e2e5eb; color:var(--encre); }
.lent { display:flex; justify-content:flex-end; align-items:center; gap:6px; position:relative; }
.seg { display:inline-flex; background:#e2e5eb; border-radius:15px; padding:2px; }
.seg button { height:26px; padding:0 10px; border-radius:13px; font-size:13px; color:var(--gris); }
.seg button[aria-checked="true"] { background:#fff; color:var(--encre); font-weight:600; }
.aide { width:26px; height:26px; border-radius:50%; border:1px solid #c9cad2; background:#fff; font-weight:700; color:var(--gris); margin-right:auto; }
.leg { position:absolute; top:32px; left:0; z-index:5; background:#fff; border:1px solid #c9cad2; border-radius:8px; padding:8px 10px; font-size:13px; display:flex; flex-direction:column; gap:4px; width:250px; }
.leg span { display:flex; align-items:center; gap:6px; }
.bloc { background:#fff; border-radius:8px; padding:8px 10px; display:flex; flex-direction:column; gap:6px; }
.pi { width:16px; height:16px; }
.pt { width:10px; height:10px; border-radius:50%; display:inline-block; flex:none; }
.num { font-family:var(--mono); font-variant-numeric:tabular-nums; font-size:13px; }
.alpha { white-space:nowrap; }
.alpha .ne { color:var(--acc); font-weight:600; }
.alpha .pl { color:var(--gris); margin-left:4px; }
.src { font-size:12px; color:var(--gris); }
.ba { display:grid; grid-template-columns:96px 1fr 52px; align-items:center; gap:6px; font-size:13px; min-height:22px; }
.ba-n { display:flex; align-items:center; gap:4px; }
.ba-n.att { font-weight:700; }
.ba-v { text-align:right; font-family:var(--mono); font-size:12px; }
.piste { position:relative; height:12px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.piste i { position:absolute; top:0; bottom:0; left:0; display:block; }
.piste .zone { width:var(--ws); background:#d9dce3; }
.piste .rem { width:var(--ws); opacity:.9; height:6px; top:3px; border-radius:2px; }
.piste .av { left:clamp(5px, var(--ws), calc(100% - 5px)); width:10px; height:10px; top:1px; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-5px; }
.piste .av.deg { background:var(--encre); }
.piste .hach { right:0; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
body.abs .piste .zone, body.abs .piste .rem { width:var(--wa); }
body.abs .piste .av { left:clamp(5px, var(--wa), calc(100% - 5px)); }
.tag { display:inline-flex; align-items:center; height:18px; padding:0 6px; border-radius:999px; background:#e2e5eb; font:600 12px var(--sans); }
.alerte { color:var(--acc); font-weight:600; }
nav.pont { display:flex; justify-content:flex-end; gap:6px; flex-wrap:wrap; }
nav.pont a { display:inline-flex; align-items:center; height:34px; padding:0 14px; border-radius:17px; background:var(--encre); color:#fff; font-weight:600; font-size:14px; }
nav.pont a.second { background:#fff; color:var(--encre); border:1px solid #c9cad2; }
.chips { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.chips button { height:32px; padding:0 12px; border-radius:16px; background:#fff; border:1px solid #c9cad2; font-weight:600; display:inline-flex; align-items:center; gap:6px; }
[data-libre] button[aria-checked="true"] { background:var(--encre); color:#fff; border-color:var(--encre); }
.stk { display:inline-block; width:12px; height:12px; border:2px solid var(--encre); border-radius:2px; flex:none; }
.stk.oui { background:var(--encre); box-shadow:inset 0 0 0 2px #fff; }
.coche { width:28px; height:28px; display:flex; align-items:center; justify-content:center; flex:none; }
.coche .case { width:18px; height:18px; border-radius:4px; border:2px solid #6b6b75; color:#fff; font:700 13px/14px var(--sans); text-align:center; }
[data-libre] .coche[aria-checked="true"] { background:none; }
.coche[aria-checked="true"] .case { background:var(--encre); border-color:var(--encre); }
.coche[aria-checked="true"] .case::after { content:"✓"; }
.fams { display:flex; flex-wrap:wrap; gap:3px; align-items:center; }
.fams .z16 { display:inline-flex; gap:3px; align-items:center; padding:2px 4px; min-width:40px; min-height:22px; background:#d9dce3; border-radius:4px; }
.fams.perd .fc { opacity:.5; }
.fc { display:inline-flex; flex-direction:column; align-items:center; gap:1px; }
.fc i { display:block; width:14px; height:3px; }
body.marque [data-libre] { outline:3px solid #0072b2; outline-offset:3px; border-radius:8px; }
body.marque [data-role="contexte"] { outline:2px dashed #55555f; outline-offset:3px; border-radius:8px; }
`;
const JS = `
<script>
if (/carte/.test(location.search)) { document.body.classList.add('marque'); var envoyer = function () { var m = document.querySelector('main'); parent.postMessage({ carte: location.pathname.split('/').slice(-2)[0], h: Math.ceil(m.getBoundingClientRect().bottom) }, '*'); }; addEventListener('load', envoyer); setTimeout(envoyer, 400); }
document.querySelectorAll('[data-e]').forEach(function (b) { b.addEventListener('click', function () {
  document.querySelectorAll('[data-e]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
  document.body.classList.toggle('abs', b.dataset.e === 'absolu'); }); });
document.querySelectorAll('[data-vue]').forEach(function (b) { b.addEventListener('click', function () {
  document.querySelectorAll('[data-vue]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
  document.querySelectorAll('[data-vue-bloc]').forEach(function (x) { x.hidden = x.dataset.vueBloc !== b.dataset.vue; }); }); });
document.querySelectorAll('[data-libre] [role=radio]').forEach(function (b) { b.addEventListener('click', function () {
  b.closest('[data-libre]').querySelectorAll('[role=radio]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
  if (window.choisir) window.choisir(b); }); });
document.querySelectorAll('[data-libre] [role=checkbox]').forEach(function (b) { b.addEventListener('click', function () {
  b.setAttribute('aria-checked', String(b.getAttribute('aria-checked') !== 'true')); if (window.cocher) window.cocher(); }); });
addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; document.querySelectorAll('[data-role=legende]').forEach(function (l) { l.hidden = true; }); document.querySelectorAll('[data-role=legende-bouton]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); });
document.querySelectorAll('[data-role=legende-bouton]').forEach(function (b) { b.addEventListener('click', function () {
  var l = document.getElementById(b.getAttribute('aria-controls')); l.hidden = !l.hidden; b.setAttribute('aria-expanded', String(!l.hidden)); }); });
</script>`;
const page = (titre, corps, extraCss = '', extraJs = '') => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<style>${CSS}${extraCss}</style></head>
<body>
${symboles}
<main class="ecran">
${corps}
</main>
${JS}${extraJs}
</body></html>
`;

const ecrans = {};

// ---------- 0. Ma bière, étape Houblons (point d'entrée, l8) ----------
{
  const rows = ORDRE.map((f) => barre(f, { avant: AVANT[f], deg: f === 'resin', profil: true, inconnu: AVANT_INCONNU.has(f), txt: f === 'resin' ? 'hors style' : '' })).join('');
  const corps = `
<header class="barre"><h1 class="titre">Stout export 16D · Houblons</h1></header>
<div class="bloc kpi"><span>IBU <b class="num">60</b></span><span>OG <b class="num">1,066</b></span><span>EBC <b class="num">70</b></span></div>
<p class="alerte">● Résineux hors style · dégusté 18.10</p>
${lentille(true, aide('leg-mb', `<span><i class="m creux"></i>prévu, simulé</span><span><i class="m plein"></i>dégusté le 18.10</span><span><i class="m hach"></i>non situé</span><span><i class="m zone"></i>zone du style 16D</span>`))}
<section class="bloc" data-vue-bloc="barres">${rows}</section>
<section class="bloc" data-vue-bloc="radar" hidden><div class="rad">${radar([{ nom: 'ma bière', c: '#16161a', v: AVANT, inconnus: AVANT_INCONNU }], { objet: 'biere-cible', inconnusCommuns: AVANT_INCONNU })}</div></section>
<section class="bloc ingr">
  <a class="ajout" href="../dryhopper/etat.html"><span class="nom">${pt('Nugget')}<b>Nugget</b></span>${alpha('Nugget', NUGGET.lot, NUGGET.alpha)}<span class="tag" data-role="usage" data-houblon="Nugget">${ROLE[NUGGET.role]}</span><span class="num">46 g · 60′</span><span class="num gris">60 IBU</span></a>
  <nav class="pont gauche" aria-label="Ponts"><a class="second" href="../substituer-porte/etat.html">Je n'ai pas Nugget ›</a><a class="second" href="../substituer-outil/etat.html">Remplaçants ›</a></nav>
</section>
<nav class="pont" aria-label="Outils"><a href="../suggerer/etat.html">+ floral ›</a><a class="second" href="../levure-outil/etat.html">US-05 · levure ›</a></nav>`;
  ecrans['ma-biere'] = page('Ma bière · Houblons', corps, `
.kpi { flex-direction:row; justify-content:space-between; font-size:13px; color:var(--gris); }
.kpi b { color:var(--encre); font-size:17px; margin-left:4px; }
.rad { display:flex; justify-content:center; }
.ingr .ajout { display:flex; align-items:center; gap:8px; flex-wrap:wrap; min-height:32px; }
.ingr .nom { display:inline-flex; align-items:center; gap:6px; }
.gris { color:var(--gris); }
nav.pont.gauche { justify-content:flex-start; }
.ba { min-height:26px; grid-template-columns:96px 1fr 72px; }
.leg .m { display:inline-block; width:14px; height:12px; }
.leg .m.creux { width:10px; height:10px; border-radius:50%; border:2px solid var(--encre); }
.leg .m.plein { width:10px; height:10px; border-radius:50%; background:var(--encre); }
.leg .m.hach { background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
.leg .m.zone { background:#d9dce3; }`);
}

// ---------- 1. Suggérer (s5) : « Quel houblon ajouter à ma bière ? » — libre : les candidats ----------
{
  const cand = ['Idaho 7', 'Cascade', 'Galaxy', 'Nelson Sauvin'].map((n) => ({ n, p: point(n, 'dryPost', 3) })).map((x) => ({ ...x, v: centre(x.p), inc: inconnus(x.p) }))
    .sort((a, b) => b.v.floral - a.v.floral);
  const coches = new Set(['Idaho 7', 'Cascade', 'Galaxy']);
  const lignes = cand.map(({ n, v, inc }) => {
    const h = H[n];
    const partiel = h.partSansFamille > 0.5 ? `<span class="tag">fiche partielle</span>` : '';
    // Extras (D76) : toutes les familles hors objectif dont l'apport atteint 0,5 point, du plus fort au plus faible.
    const extras = ORDRE.filter((f) => f !== 'floral' && !inc.has(f) && v[f] - AVANT[f] >= 0.5).sort((a, b) => (v[b] - AVANT[b]) - (v[a] - AVANT[a]));
    const ex = extras.map((f) => `<span class="ex${v[f] > BANDE[f] ? ' hors' : ''}" data-role="extra" data-famille-extra="${f}">${pi(f, 14)}<i style="width:${Math.max(3, Math.min(34, (v[f] - AVANT[f]) * 1.1)).toFixed(0)}px;background:${JETONS[f].base}"></i></span>`).join('');
    const top = extras[0];
    return `<div class="cand">
  <button type="button" role="checkbox" aria-checked="${coches.has(n)}" aria-label="${n}" class="coche" data-houblon="${n}"><span class="case"></span></button>
  <div class="cand-c"><div class="cand-t">${pt(n)}<b>${n}</b>${alphaJ(n)}<span class="tag" data-role="usage" data-houblon="${n}">${ROLE[h.role.value]}</span>${partiel}</div>
  ${barre('floral', { avant: AVANT.floral, apres: v.floral, txt: '~' + signe(v.floral - AVANT.floral), nomme: false })}
  <div class="extras">${ex}<span class="num ex-v" style="color:${v[top] > BANDE[top] ? 'var(--acc)' : JETONS[top].texte}">${pi(top, 14)}~${signe(v[top] - AVANT[top])}</span></div></div></div>`;
  }).join('');
  const corps = `
${tete('Quel houblon ajouter à ma bière ?')}
${contexte([['base', 'Stout 16D'], ['dose', '4 g/L'], ['moment', 'après 3 j'], ['levure', 'US-05']])}
<div class="obj" data-role="objectif">${pi('floral')}<b>Plus floral</b><span class="sep">·</span>${pi('resin')}<span>aucun houblon ne baisse le résineux</span></div>
${lentille(false, aide('leg-sg', `<span>${pi('floral', 14)} barre : le floral visé, face à la zone du 16D</span><span>dessous : ce que le houblon ajoute en plus</span><span><i class="m hors"></i>hors du style</span><span>≠ : α du lot hors des fiches</span>`))}
<section class="bloc" data-libre="houblon" role="group" aria-label="Houblons candidats">${lignes}</section>
<nav class="pont" aria-label="Pont"><a href="../comparer/etat.html" id="vers-comparer">Comparer les 3 ›</a></nav>`;
  ecrans.suggerer = page('Suggérer', corps, `
.obj { display:flex; align-items:center; gap:4px; font-size:13px; flex-wrap:wrap; }
.obj .sep { color:var(--gris); margin:0 2px; }
.cand { display:grid; grid-template-columns:28px 1fr; gap:6px; padding:10px 0; border-top:1px solid var(--trait); }
.cand:first-child { border-top:0; }
.cand-c { display:flex; flex-direction:column; gap:5px; }
.cand-t { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.cand .ba { grid-template-columns:20px 1fr 48px; }
.extras { display:flex; align-items:center; gap:6px; flex-wrap:wrap; min-height:22px; }
.ex { display:inline-flex; align-items:center; gap:2px; padding-bottom:2px; border-bottom:2px solid transparent; }
.ex i { display:block; height:6px; border-radius:2px; }
.ex.hors { border-bottom-color:var(--acc); }
.ex-v { margin-left:auto; display:inline-flex; align-items:center; gap:3px; font-size:12px; }
.leg .m.hors { display:inline-block; width:14px; height:2px; background:var(--acc); }`, `
<script>window.cocher = function () { var n = document.querySelectorAll('[data-libre] [aria-checked=true]').length; document.getElementById('vers-comparer').textContent = 'Comparer les ' + n + ' ›'; };</script>`);
}

// ---------- 3. Comparer : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? » — libre : la variété ----------
{
  const trio = ['Cascade', 'Idaho 7', 'Galaxy'];
  const P = Object.fromEntries(trio.map((n) => [n, point(n, 'dryPost', 3)]));
  const V = Object.fromEntries(trio.map((n) => [n, centre(P[n])]));
  const INC = Object.fromEntries(trio.map((n) => [n, inconnus(P[n])]));
  const communs = new Set(ROUE.filter((f) => trio.every((n) => INC[n].has(f))));
  const cols = trio.map((n) => `<div class="col"><button type="button" role="radio" aria-checked="${n === 'Idaho 7'}" class="col-n" data-houblon="${n}">${pt(n)}${n}</button>${alpha(n, H[n].alpha.retenu.value, H[n].alpha.sources, { court: true })}<span class="num plage ${(() => { const s = H[n].alpha.sources, v = H[n].alpha.retenu.value; return v < Math.min(...s.map((x) => x.min)) || v > Math.max(...s.map((x) => x.max)) ? 'ne' : ''; })()}">${(() => { const s = H[n].alpha.sources, v = H[n].alpha.retenu.value, mn = Math.min(...s.map((x) => x.min)), mx = Math.max(...s.map((x) => x.max)); return (v < mn || v > mx ? '≠ ' : '') + fr1(mn) + '–' + fr1(mx); })()}</span><span class="tag" data-role="usage" data-houblon="${n}">${ROLE[H[n].role.value]}</span></div>`).join('');
  const rows = ['floral', 'tropical', 'resin'].map((f) => `<div class="cmp"><span class="ba-n${ATTENDUES.includes(f) ? ' att' : ''}">${pi(f)}${COURT[f]}</span>${trio.map((n) => { const v = V[n][f]; return `<span class="num" style="color:${v > BANDE[f] ? 'var(--acc)' : JETONS[f].texte}">~${signe(v - AVANT[f])}</span>`; }).join('')}</div>`).join('');
  const corps = `
${tete('Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ?', '../suggerer/etat.html')}
${contexte([['base', 'Stout 16D'], ['dose', '4 g/L'], ['moment', 'après 3 j'], ['levure', 'US-05']])}
${lentille(false, aide('leg-cp', `<span><i class="m zone"></i>zone du style 16D</span><span>un trait par houblon ; un trait qui sort du cercle : au-delà de ×2 la zone</span><span><i class="m hach"></i>non situé</span><span>≠ : α du lot hors des fiches</span>`))}
<section class="bloc"><div class="cols" data-libre="houblon" role="radiogroup" aria-label="Variété retenue">${cols}<button type="button" aria-label="Ajouter un houblon" class="plus">+</button></div>
<div class="rad">${radar(trio.map((n) => ({ nom: n, c: COUL[n], v: V[n], inconnus: INC[n] })), { inconnusCommuns: communs })}</div>
${rows}</section>
<p class="src lot22">Chimie, panel OSU, vraies valeurs : lot 22</p>
<nav class="pont" aria-label="Pont"><a href="../dryhopper/etat.html" id="vers-dry">Placer Idaho 7 ›</a></nav>`;
  ecrans.comparer = page('Comparer', corps, `
.cols { display:grid; grid-template-columns:repeat(3,1fr) 30px; gap:6px; align-items:start; }
.col { display:flex; flex-direction:column; gap:2px; align-items:flex-start; }
.col-n { display:inline-flex; align-items:center; gap:5px; height:32px; padding:0 10px; border-radius:999px; border:1px solid #c9cad2; background:#fff; font-weight:600; white-space:nowrap; }
.plage { font-size:12px; color:var(--gris); }
.plage.ne { color:var(--acc); font-weight:600; }
.cols .plus { width:30px; height:30px; border-radius:50%; border:1px dashed #6b6b75; font-size:18px; }
.rad { display:flex; justify-content:center; }
.cmp { display:grid; grid-template-columns:96px repeat(3,1fr); gap:6px; align-items:center; font-size:13px; min-height:22px; }
.lot22 { padding:0 2px; }
.leg .m { display:inline-block; width:14px; height:12px; }
.leg .m.zone { background:#c9cdd6; }
.leg .m.hach { background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }`, `
<script>window.choisir = function (b) { document.getElementById('vers-dry').textContent = 'Placer ' + b.dataset.houblon + ' ›'; };</script>`);
}

// ---------- 2a. Substituer, la porte : Comparer avec Nugget épinglé en colonne 1 ----------
// Familles citées seulement (pas de case vide) ; les familles attendues du 16D dans une bande grise (zone).
const famsCitees = (aromes, perd = [], gagne = []) => {
  const att = ATTENDUES.filter((f) => aromes.includes(f));
  const autres = ORDRE.filter((f) => !ATTENDUES.includes(f) && aromes.includes(f));
  return `<span class="fams">${att.length ? `<span class="z16" data-role="zone" aria-label="familles du 16D">${att.map((f) => pi(f, 14)).join('')}</span>` : ''}${autres.map((f) => pi(f, 14)).join('')}</span>`;
};
const famsListe = (fs_, cls = '') => `<span class="fams${cls ? ' ' + cls : ''}">${fs_.map((f) => `<span class="fc">${pi(f, 14)}<i style="background:${JETONS[f].base}"></i></span>`).join('')}</span>`;
{
  const cands = [R('Magnat'), R('Galaxy')];
  const tous = [{ nom: 'Nugget', ...NUGGET, dose: '46 g', perd: [], gagne: [], comp: null, ref: true }, ...cands.map((r) => ({ ...r, dose: fr(r.dose.g) + ' g', plageDose: r.dose.max > r.dose.min ? fr(r.dose.min) + '–' + fr(r.dose.max) : '' }))];
  const tetes = `<span></span><div class="col-n epingle">${pt('Nugget')}<b>Nugget</b>${stock(true)}<span class="src">épinglé</span></div>${cands.map((r, i) => `<button type="button" role="radio" aria-checked="${i === 0}" aria-label="Houblon ${r.nom}" class="col-n choix" data-houblon="${r.nom}">${pt(r.nom)}${r.nom}${stock(r.lot != null)}</button>`).join('')}`;
  const ligne = (lib, cells) => `<span class="lib src">${lib}</span>${cells.map((c, i) => `<span class="cel${i === 0 ? ' epingle' : ''}">${c}</span>`).join('')}`;
  const compo = (k, lib) => ligne(lib, tous.map((h) => (h.ref ? '' : h.comp[k] == null ? '<span class="num">?</span>' : `<span class="cp"><i style="width:${pc(h.comp[k] - 50, 50)}"></i></span><span class="num">${h.comp[k]}</span>`)));
  const corps = `
${tete('Lequel à la place de Nugget ?')}
${contexte([['base', 'Stout 16D'], ['moment', 'à 60′'], ['dose', 'dose à IBU égal']])}
${lentille(false, aide('leg-sp', `<span>${stock(true)} en stock · ${stock(false)} à acheter</span><span><i class="m zone"></i>familles attendues du 16D</span><span>perd : familles de Nugget qui disparaissent</span><span>huile totale : mL/100 g, fiches</span><span>arôme, huiles, amer : proximité à Nugget, 50 à 100, sur nos fiches</span>`))}
<section class="bloc"><div class="g4" data-libre="houblon" role="radiogroup" aria-label="Remplaçant">${tetes}</div>
<div class="g4">
${ligne('α', tous.map((h) => (h.ref ? alpha('Nugget', NUGGET.lot, NUGGET.alpha) : alpha(h.nom, h.lot, h.alpha)).replace('class="num alpha"', 'class="num alpha col2"')))}
${ligne('rôle', tous.map((h) => `<span class="tag" data-role="usage" data-houblon="${h.nom}">${ROLE[h.role] || h.role}</span>`))}
${ligne('dose', tous.map((h) => `<span class="num col2">${h.dose}${h.plageDose ? `<span class="pl">${h.plageDose}</span>` : ''}</span>`))}
${ligne('huile', tous.map((h) => `<span class="num col2">${h.huiles.map((x) => fr1(x.min) + '–' + fr1(x.max)).join('<br>')}</span>`))}
${ligne('arômes', tous.map((h) => famsCitees(h.aromes)))}
${ligne('perd', tous.map((h) => (h.ref ? '' : famsListe(h.perd.filter((p) => p.a === 0).map((p) => p.family), 'perd'))))}
${ligne('gagne', tous.map((h) => (h.ref ? '' : h.gagne.length ? famsListe(h.gagne.map((p) => p.family)) : '<span class="src">—</span>')))}
${compo('arome', 'arôme')}
${compo('huiles', 'huiles')}
${compo('amertume', 'amer')}</div></section>
<nav class="pont" aria-label="Pont"><a class="second" href="../substituer-outil/etat.html">Tous les remplaçants</a><a href="../ma-biere/etat.html">Remplacer ›</a></nav>`;
  ecrans['substituer-porte'] = page('Substituer, la porte', corps, `
.g4 { display:grid; grid-template-columns:44px repeat(3,1fr); gap:6px; align-items:center; }
.g4 + .g4 { margin-top:2px; }
.col-n { display:inline-flex; align-items:center; gap:4px; min-height:32px; font-weight:600; white-space:nowrap; justify-self:start; }
.col-n.epingle { flex-wrap:wrap; column-gap:4px; row-gap:0; padding:2px 6px; background:#f1f2f5; border-radius:4px; }
.col-n.epingle .src { width:100%; }
.choix { padding:0 10px; border-radius:999px; border:1px solid #c9cad2; background:#fff; }
.choix[aria-checked="true"] .stk { border-color:#fff; }
.choix[aria-checked="true"] .stk.oui { background:#fff; box-shadow:inset 0 0 0 2px var(--encre); }
.cel { display:flex; align-items:center; gap:4px; min-height:40px; }
.col2 .pl { font-size:12px; color:var(--gris); }
.cel.epingle { background:#f1f2f5; border-radius:2px; padding:0 4px; }
.col2 { display:flex; flex-direction:column; line-height:1.15; white-space:normal; }
.cp { width:34px; height:6px; background:#f1f2f5; border-radius:2px; position:relative; overflow:hidden; flex:none; }
.cp i { position:absolute; inset:0 auto 0 0; background:var(--encre); display:block; }
.leg .m.zone { display:inline-block; width:14px; height:12px; background:#d9dce3; }`);
}

// ---------- 2b. Substituer, l'outil propre (u4) : « Par quoi remplacer Nugget ? » ----------
{
  const nug = `<div class="rp ref"><span class="src">réf.</span><span class="rp-n">${pt('Nugget')}<b>Nugget</b>${alpha('Nugget', NUGGET.lot, NUGGET.alpha, { court: true, pref: false })}</span>${famsCitees(NUGGET.aromes)}<span class="src">—</span><span class="num dose">46</span>${stock(true)}</div>`;
  const lignes = remplacants.map((r) => `<div class="rp">
  <button type="button" role="checkbox" aria-checked="${r.nom === 'Magnat' || r.nom === 'Galaxy'}" aria-label="Houblon ${r.nom}" class="coche" data-houblon="${r.nom}"><span class="case"></span></button>
  <span class="rp-n"><b>${r.nom}</b>${alpha(r.nom, r.lot, r.alpha, { pref: false })}</span>
  ${famsListe(r.perd.filter((p) => p.a === 0).map((p) => p.family), 'perd')}
  ${r.gagne.length ? famsListe(r.gagne.map((p) => p.family)) : '<span class="src">—</span>'}
  <span class="num dose">${fr(r.dose.g)}</span>${stock(r.lot != null)}</div>`).join('');
  const corps = `
${tete('Par quoi remplacer Nugget ?')}
${contexte([['base', 'Stout 16D'], ['moment', 'à 60′'], ['dose', 'dose à IBU égal']])}
${lentille(false, aide('leg-so', `<span>${stock(true)} en stock · ${stock(false)} à acheter</span><span>perd : familles de Nugget qui disparaissent (pâles)</span><span>gagne : familles en plus</span><span>g : dose à IBU égal à 60′ ; ≠ : α du lot hors des fiches</span>`))}
<section class="bloc" data-libre="houblon" role="group" aria-label="Remplaçants"><div class="rp tete"><span></span><span class="src">α</span><span class="src">perd</span><span class="src">gagne</span><span class="src dose">g</span><span></span></div>${nug}${lignes}</section>
<nav class="pont" aria-label="Pont"><a href="../substituer-porte/etat.html">Face à face ›</a></nav>`;
  ecrans['substituer-outil'] = page('Substituer, outil propre', corps, `
.rp { display:grid; grid-template-columns:28px 1fr 86px 40px 26px 14px; gap:5px; align-items:center; min-height:50px; border-top:1px solid var(--trait); }
.rp.tete { border-top:0; min-height:18px; }
.rp.ref { background:#f1f2f5; border-radius:4px; border-top:0; }
.rp.ref .src:first-child { text-align:center; }
.rp-n { display:flex; flex-direction:column; line-height:1.2; gap:1px; }
.rp-n .pt { display:none; }
.rp .alpha { font-size:12px; }
.dose { text-align:right; }`);
}

// ---------- 4. Dryhopper : « Quand ajouter Idaho 7 ? » — libre : le moment (par 5′) ----------
const DH = 'Idaho 7';
const POS = [];
for (let m = 60; m >= 0; m -= 5) POS.push({ id: 'b' + m, lib: m + '′', court: m + '′', seg: 0 });
POS.push({ id: 'wp', lib: 'whirlpool', court: 'wp', seg: 1 });
for (const j of [1, 2, 3, 5, 7]) POS.push({ id: 'dryActive|' + j, lib: 'actif · ' + j + ' j', court: 'J' + j, seg: 2 });
for (const j of [1, 2, 3, 5, 7]) POS.push({ id: 'dryPost|' + j, lib: 'après · ' + j + ' j', court: 'J' + j, seg: 3 });
const SEGS = [['ébullition', 0, 44], ['WP', 44, 52], ['actif', 52, 76], ['après', 76, 100]];
const valeursMoment = (nom, levure = 'fermentis-us05') => POS.map((p) => {
  const [m, j] = p.id.split('|');
  const g = H[nom].grille.find((x) => x.moment === m && x.jours === (j ? +j : null) && x.dose_gL === 4 && x.levure === levure);
  const ibuG = /^b\d+$/.test(m) || m === 'wp' ? ipg(nom, m) : null;
  return { ...p, v: g ? centre(g) : null, inc: g ? [...inconnus(g)] : [], ibu: ibuG == null ? null : Math.round(ibuG * 4 * VOLUME), cru: /^dry/.test(m) };
});
{
  const data = valeursMoment(DH);
  const i0 = POS.findIndex((p) => p.id === 'dryActive|3');
  const d0 = data[i0];
  const rows = ORDRE.map((f) => {
    const inc = d0.inc.includes(f), d = d0.v[f] - AVANT[f];
    return barre(f, { avant: AVANT[f], apres: d0.v[f], inconnu: inc, txt: inc ? '' : Math.abs(d) >= 0.5 ? '~' + signe(d) : '' });
  }).join('');
  const frise = `<div class="frise" data-libre="moment">
  <div class="loupe" aria-hidden="true"></div>
  <div class="rail" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="${POS.length - 1}" aria-valuenow="${i0}" aria-valuetext="${POS[i0].lib}">
  ${SEGS.map(([, a, b], k) => `<span class="seg-z s${k}" style="left:${a}%;width:${b - a}%"></span>`).join('')}
  <span class="pouce"><span class="pouce-l">${POS[i0].lib}</span></span></div>
  <div class="rep">${SEGS.map(([t, a, b]) => `<span style="left:${(a + b) / 2}%">${t}</span>`).join('')}</div></div>`;
  const evo = `<div class="evo" aria-label="Ma bière, +1, +2 dry hops"><span class="evo-t">Ma bière</span><span class="fl"></span><span class="evo-t">+1</span><span class="fl"></span><span class="evo-t">+2</span>
  <span class="evo-v">${pi('floral', 14)}<span class="num">~${fr(AVANT.floral)}</span></span><span></span><span class="evo-v">${pi('floral', 14)}<span class="num" id="evo1">~${fr(d0.v.floral)}</span></span><span></span><span class="evo-v">${pi('floral', 14)}<span class="num">?</span></span></div>`;
  const corps = `
${tete('Quand ajouter Idaho 7 ?', '../comparer/etat.html')}
${contexte([['houblon', ctxIdaho()], ['dose', '4 g/L'], ['levure', 'US-05'], ['base', 'Stout 16D']])}
${lentille(false, aide('leg-dh', `<span><i class="m creux"></i>ma bière avant ; barre : avec Idaho 7</span><span>~ simulé ; ? non calculé dans cette maquette</span><span>glisse le pouce : la loupe grossit les moments voisins</span>`))}
<section class="bloc" id="barres">${rows}<p class="ibu num" id="ibu"></p></section>
${frise}
${evo}
<nav class="pont" aria-label="Pont"><a href="../levure-etape/etat.html">Puis la levure ›</a></nav>`;
  ecrans.dryhopper = page('Dryhopper', corps, `
.ba { min-height:21px; }
.ibu { font-size:12px; color:var(--gris); text-align:right; }
.evo { display:grid; grid-template-columns:1fr 14px 1fr 14px 1fr; gap:2px 4px; align-items:center; background:#fff; border-radius:8px; padding:6px 10px; font-size:13px; }
.evo-t { font-weight:600; }
.fl::before { content:"→"; color:var(--gris); }
.evo-v { display:flex; align-items:center; gap:4px; }
.frise { background:#fff; border-radius:8px; padding:30px 18px 6px; touch-action:none; position:relative; }
.rail { position:relative; height:18px; cursor:pointer; }
.seg-z { position:absolute; top:6px; height:6px; border-radius:2px; }
.seg-z.s0 { background:#c9cdd6; } .seg-z.s1 { background:#aeb4c1; } .seg-z.s2 { background:#c9cdd6; } .seg-z.s3 { background:#aeb4c1; }
.cran { position:absolute; top:2px; width:1px; height:14px; background:var(--encre); }
.pouce { position:absolute; top:0; width:18px; height:18px; margin-left:-9px; border-radius:50%; background:var(--encre); }
.pouce-l { position:absolute; bottom:22px; left:50%; transform:translateX(-50%); white-space:nowrap; background:var(--encre); color:#fff; font:600 13px var(--sans); padding:2px 8px; border-radius:11px; }
.rep { position:relative; height:16px; margin-top:4px; font-size:12px; color:var(--gris); }
.rep span { position:absolute; transform:translateX(-50%); white-space:nowrap; }
.loupe { position:absolute; left:8px; right:8px; top:-40px; height:36px; display:none; background:#fff; border:1px solid #c9cad2; border-radius:8px; overflow:hidden; }
.frise.touche .loupe { display:block; }
.frise.touche .pouce-l { visibility:hidden; }
.loupe span { position:absolute; top:4px; transform:translateX(-50%); font:600 13px var(--mono); color:var(--gris); text-align:center; }
.loupe span::after { content:""; display:block; width:1px; height:8px; background:var(--gris); margin:2px auto 0; }
.loupe span.ici { color:#fff; background:var(--encre); padding:0 6px; border-radius:4px; }
.loupe span.ici::after { background:#fff; }
.leg .m.creux { display:inline-block; width:10px; height:10px; border-radius:50%; border:2px solid var(--encre); }`, `
<script>
var T = ${JSON.stringify(Object.fromEntries(Object.entries(JETONS).map(([k, v]) => [k, v.texte])))}, BA = ${JSON.stringify(Object.fromEntries(Object.entries(JETONS).map(([k, v]) => [k, v.base])))}, D = ${JSON.stringify(data)}, AV = ${JSON.stringify(AVANT)}, B = ${JSON.stringify(BANDE)}, N = D.length - 1;
var SEG = ${JSON.stringify(SEGS.map(([, a, b]) => [a, b]))}, frise = document.querySelector('.frise'), rail = document.querySelector('.rail'), loupe = document.querySelector('.loupe');
function x(i) { var s = D[i].seg, idx = D.map(function (p, k) { return k; }).filter(function (k) { return D[k].seg === s; }), n = idx.length, a = SEG[s][0], b = SEG[s][1];
  return n === 1 ? (a + b) / 2 : a + (b - a) * (0.06 + 0.88 * idx.indexOf(i) / (n - 1)); }
function cur() { return +rail.getAttribute('aria-valuenow'); }
function graduations(i) { rail.querySelectorAll('.cran').forEach(function (c) { c.remove(); });
  if (!frise.classList.contains('touche')) return;
  D.forEach(function (p, k) { if (p.seg !== D[i].seg) return; var c = document.createElement('i'); c.className = 'cran'; c.style.left = x(k) + '%'; rail.insertBefore(c, rail.firstChild); });
  loupe.innerHTML = ''; var w = loupe.clientWidth, pas = 64;
  for (var k = i - 2; k <= i + 2; k++) { if (k < 0 || k > N) continue; var s = document.createElement('span'); s.textContent = D[k].court; if (k === i) s.className = 'ici'; s.style.left = (w / 2 + (k - i) * pas) + 'px'; loupe.appendChild(s); } }
function poser(i) {
  var p = D[i]; rail.setAttribute('aria-valuenow', i); rail.setAttribute('aria-valuetext', p.lib);
  document.querySelector('.pouce').style.left = x(i) + '%'; document.querySelector('.pouce-l').textContent = p.lib;
  document.querySelectorAll('#barres [data-f]').forEach(function (r) {
    var f = r.dataset.f, rem = r.querySelector('.rem'), v = r.querySelector('.ba-v'), h = r.querySelector('.hach'), pis = r.querySelector('.piste');
    var inc = !p.v || p.inc.indexOf(f) >= 0;
    if (inc) { if (rem) rem.hidden = true; if (!h) { h = document.createElement('i'); h.className = 'hach'; pis.appendChild(h); } v.textContent = p.v ? '' : '?'; v.style.color = '#55555f'; return; }
    if (h) h.remove();
    if (!rem) { rem = document.createElement('i'); rem.className = 'rem'; rem.style.background = BA[f]; pis.appendChild(rem); }
    rem.hidden = false;
    var x2 = p.v[f]; rem.style.setProperty('--ws', Math.min(100, x2 / B[f] / 2 * 100) + '%'); rem.style.setProperty('--wa', Math.min(100, x2 / 110 * 100) + '%');
    var d = x2 - AV[f]; v.textContent = Math.abs(d) >= 0.5 ? '~' + (d >= 0 ? '+' : '−') + Math.abs(Math.round(d)) : ''; v.style.color = x2 > B[f] ? '#c2410c' : T[f];
  });
  document.getElementById('evo1').textContent = p.v ? '~' + Math.round(p.v.floral) : '?';
  document.getElementById('ibu').textContent = p.cru ? 'IBU à cru : non modélisé' : p.ibu == null ? 'IBU : ? (non calculé dans la maquette)' : 'IBU 60 → ~' + (60 + p.ibu);
  graduations(i);
}
function depuis(e) { var r = rail.getBoundingClientRect(), pct = (e.clientX - r.left) / r.width * 100, best = 0, bd = 1e9;
  for (var k = 0; k <= N; k++) { var d = Math.abs(x(k) - pct); if (d < bd) { bd = d; best = k; } } if (best !== cur()) poser(best); }
rail.addEventListener('pointerdown', function (e) { rail.setPointerCapture(e.pointerId); frise.classList.add('touche'); depuis(e); graduations(cur()); });
rail.addEventListener('pointermove', function (e) { if (e.buttons) depuis(e); });
rail.addEventListener('pointerup', function () { frise.classList.remove('touche'); graduations(cur()); });
rail.addEventListener('keydown', function (e) { var i = cur(); if (e.key === 'ArrowRight') poser(Math.min(N, i + 1)); if (e.key === 'ArrowLeft') poser(Math.max(0, i - 1)); });
var q = location.search.match(/moment=([^&]+)/); poser(q ? D.findIndex(function (p) { return p.id === decodeURIComponent(q[1]); }) : ${i0});
</script>`);
}

// ---------- 5a. Levure, dernière étape de Dryhopper : « Et avec quelle levure ? » ----------
const LEV = [['fermentis-us05', 'US-05'], ['lalbrew-pomona', 'Pomona']];
const levChips = () => `<div class="chips" data-libre="levure" role="radiogroup" aria-label="Levure">${LEV.map(([k, n], i) => `<button type="button" role="radio" aria-checked="${i === 1}" data-lev="${k}"><span class="pt" style="background:${LEVC[k]}"></span>${n}</button>`).join('')}</div>`;
{
  const pu = point(DH, 'dryActive', 3, 4, 'fermentis-us05'), pp = point(DH, 'dryActive', 3, 4, 'lalbrew-pomona');
  const us = centre(pu), po = centre(pp);
  const bougent = ORDRE.filter((f) => Math.abs(po[f] - us[f]) >= 0.5).sort((a, b) => (po[b] - us[b]) - (po[a] - us[a]));
  const immobiles = ORDRE.filter((f) => !bougent.includes(f));
  const rows = bougent.map((f) => `<div class="ba2" data-f="${f}"><span class="ba-n${ATTENDUES.includes(f) ? ' att' : ''}">${pi(f)}${COURT[f]}</span><span class="piste2"><i class="zone" data-role="zone" style="--ws:50%;--wa:${pc(BANDE[f], 110)}"></i><i class="b us" style="--ws:${pc(us[f] / BANDE[f], 2)};--wa:${pc(us[f], 110)}"></i><i class="b po" style="--ws:${pc(po[f] / BANDE[f], 2)};--wa:${pc(po[f], 110)}"></i></span><span class="ba-v" style="color:${JETONS[f].texte}">~${signe(po[f] - us[f])}</span></div>`).join('');
  const postEgal = ORDRE.every((f) => centre(point(DH, 'dryPost', 3, 4, 'fermentis-us05'))[f] === centre(point(DH, 'dryPost', 3, 4, 'lalbrew-pomona'))[f]);
  const corps = `
${tete('Et avec quelle levure ?', '../dryhopper/etat.html')}
<p class="etape"><span>1 Quand ✓</span><span class="on">2 Levure</span></p>
${contexte([['houblon', ctxIdaho()], ['dose', '4 g/L'], ['moment', 'actif · 3 j'], ['base', 'Stout 16D']])}
${levChips()}
${lentille(false, aide('leg-le', `<span><i class="m" style="background:${LEVC['fermentis-us05']}"></i>US-05, la référence</span><span><i class="m" style="background:${LEVC['lalbrew-pomona']}"></i>Pomona</span><span>à droite : ce que Pomona ajoute (~ simulé)</span>`))}
<section class="bloc">${rows}<p class="calme">${immobiles.map((f) => pi(f, 14)).join('')}<span class="src">sans effet</span></p><p class="src">Pomona : confiance ${pp.confiance} ~</p></section>
${postEgal ? '<p class="src">Après fermentation : rien ne change (~).</p>' : ''}
<nav class="pont" aria-label="Pont"><a href="../ma-biere/etat.html">Ajouter à ma bière ›</a></nav>`;
  ecrans['levure-etape'] = page('Levure, étape de Dryhopper', corps, `
.etape { display:flex; gap:6px; font-size:13px; }
.etape span { padding:2px 8px; border-radius:11px; background:#e2e5eb; color:var(--gris); }
.etape .on { background:var(--encre); color:#fff; font-weight:600; }
.ba2 { display:grid; grid-template-columns:96px 1fr 48px; align-items:center; gap:6px; font-size:13px; min-height:38px; }
.piste2 { position:relative; height:16px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.piste2 i { position:absolute; left:0; display:block; }
.piste2 .zone { top:0; bottom:0; width:var(--ws); background:#d9dce3; }
.piste2 .b { height:5px; width:var(--ws); border-radius:2px; }
.piste2 .us { top:2px; background:${LEVC['fermentis-us05']}; }
.piste2 .po { top:9px; background:${LEVC['lalbrew-pomona']}; }
body.abs .piste2 .zone, body.abs .piste2 .b { width:var(--wa); }
.piste2.ref .po { opacity:.3; }
.calme { display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
.leg .m { display:inline-block; width:14px; height:5px; border-radius:2px; }`, `
<script>window.choisir = function (b) { var po = b.dataset.lev === 'lalbrew-pomona';
  document.querySelectorAll('.piste2').forEach(function (p) { p.classList.toggle('ref', !po); });
  document.querySelectorAll('.ba2 .ba-v').forEach(function (v, i) { v.textContent = po ? ${JSON.stringify(bougent.map((f) => '~' + signe(po[f] - us[f])))}[i] : 'réf.'; }); };</script>`);
}

// ---------- 5b. Levure, outil propre (a2b) : « Que change ma levure ? » ----------
{
  const pu = point(DH, 'dryActive', 3, 4, 'fermentis-us05'), pp = point(DH, 'dryActive', 3, 4, 'lalbrew-pomona');
  const us = centre(pu), po = centre(pp), inc = inconnus(pu);
  const fam = ORDRE.filter((f) => !inc.has(f) && us[f] - AVANT[f] >= 0.5).sort((a, b) => (us[b] - AVANT[b]) - (us[a] - AVANT[a])).slice(0, 8);
  const lignes = fam.map((f) => `<div class="tb"><span class="ba-n${ATTENDUES.includes(f) ? ' att' : ''}">${pi(f)}${COURT[f]}</span>
  <span class="piste"><i class="zone" data-role="zone" style="--ws:50%;--wa:${pc(BANDE[f], 110)}"></i><i class="rem" style="--ws:${pc(us[f] / BANDE[f], 2)};--wa:${pc(us[f], 110)};background:${JETONS[f].base}"></i></span>
  <span class="num" style="color:${us[f] > BANDE[f] ? 'var(--acc)' : JETONS[f].texte}">~${signe(us[f] - AVANT[f])}</span>
  <span class="num lv" data-lv>~${signe(po[f] - us[f])}</span></div>`).join('');
  const reste = ORDRE.filter((f) => !fam.includes(f));
  const corps = `
${tete('Que change ma levure ?')}
${contexte([['houblon', ctxIdaho()], ['moment', 'actif · 3 j'], ['dose', '4 g/L'], ['base', 'Stout 16D']])}
${levChips()}
${lentille(false, aide('leg-lo', `<span>barre : ce qu'Idaho 7 apporte avec US-05, face à la zone du 16D</span><span>à droite : ce que la levure choisie ajoute</span><span>~ simulé ; Verdant, Diamond : non simulées</span>`))}
<section class="bloc"><div class="tb tete"><span></span><span class="src">Idaho 7 apporte</span><span></span><span class="src lv" id="lev-t">Pomona ajoute</span></div>${lignes}<p class="calme">${reste.map((f) => pi(f, 14)).join('')}<span class="src">~0 ou non situé</span></p></section>
<nav class="pont" aria-label="Pont"><a class="second" href="../dryhopper/etat.html">Changer le moment</a><a href="../ma-biere/etat.html">Garder ›</a></nav>`;
  ecrans['levure-outil'] = page('Levure, outil propre', corps, `
.tb { display:grid; grid-template-columns:92px 1fr 40px 66px; gap:6px; align-items:center; font-size:13px; min-height:42px; }
.tb.tete { min-height:16px; }
.lv { text-align:right; font-weight:600; }
.calme { display:flex; align-items:center; gap:4px; flex-wrap:wrap; }`, `
<script>window.choisir = function (b) { var us = b.dataset.lev === 'fermentis-us05'; var D = ${JSON.stringify(fam.map((f) => '~' + signe(po[f] - us[f])))}; document.querySelectorAll('[data-lv]').forEach(function (x, i) { x.textContent = us ? 'réf.' : D[i]; }); document.getElementById('lev-t').textContent = us ? 'US-05 : la référence' : 'Pomona ajoute'; };</script>`);
}

// ---------- la carte ----------
const vign = (id, large = false) => `<a class="vg${large ? ' large' : ''}" href="${id}/etat.html" data-vg="${id}"><iframe src="${id}/etat.html?carte" title="${id}" loading="eager" scrolling="no" tabindex="-1"></iframe></a>`;
const etape = (num, nom, question, libre, fixes, id) => `<section class="et"><div class="et-t"><span class="num-e">${num}</span><div><h2>${nom}</h2><p class="q">${question}</p></div></div><div class="et-c">${vign(id, true)}<div class="et-d"><p class="lib"><span class="k">varie</span> ${libre}</p><p class="fx"><span class="k">fixé</span> ${fixes}</p></div></div></section>`;
const pont = (t) => `<div class="pt-c"><span class="fleche">↓</span><span>${t}</span></div>`;
const deux = (num, nom, question, libre, a, b) => `<section class="et2"><div class="et-t"><span class="num-e">${num}</span><div><h2>${nom}</h2><p class="q">${question}</p></div></div><p class="lib"><span class="k">varie</span> ${libre}</p><p class="leg">deux façons, à toi de choisir en regardant</p>
<div class="paire"><figure>${vign(a.id)}<figcaption><b>${a.t}</b> ${a.d}</figcaption></figure><figure>${vign(b.id)}<figcaption><b>${b.t}</b> ${b.d}</figcaption></figure></div></section>`;
const carte = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Carte des outils houblons — fil de fer</title>
<style>
* { box-sizing:border-box; margin:0; padding:0; }
body { background:#eef0f4; color:#16161a; font:400 14px/1.3 "Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif; }
.page { max-width:390px; margin:0 auto; padding:10px 10px 30px; display:flex; flex-direction:column; gap:6px; }
h1 { font:700 19px/1.2 inherit; }
.cas { font-size:13px; color:#55555f; }
.cle { display:flex; gap:12px; font-size:12px; color:#55555f; align-items:center; flex-wrap:wrap; }
.cle i { display:inline-block; width:18px; height:10px; vertical-align:middle; margin-right:4px; border-radius:2px; }
.cle .l { outline:3px solid #0072b2; } .cle .c { outline:2px dashed #55555f; }
.et, .et2 { background:#fff; border-radius:8px; padding:8px; display:flex; flex-direction:column; gap:6px; }
.et-t { display:flex; gap:8px; align-items:flex-start; }
.et-c { display:grid; grid-template-columns:205px 1fr; gap:10px; align-items:start; }
.vg { display:block; width:172px; height:372px; overflow:hidden; border-radius:4px; border:1px solid #c9cad2; position:relative; background:#eef0f4; }
.vg iframe { width:390px; height:844px; border:0; transform:scale(.44); transform-origin:0 0; pointer-events:none; }
.vg.large { width:205px; height:443px; }
.vg.large iframe { transform:scale(.525); }
.et-d { display:flex; flex-direction:column; gap:6px; }
.num-e { width:22px; height:22px; border-radius:50%; background:#16161a; color:#fff; font-weight:700; display:inline-flex; align-items:center; justify-content:center; font-size:13px; flex:none; }
h2 { font:700 16px/1.2 inherit; }
.q { font-weight:600; }
.k { display:inline-block; font-size:12px; padding:0 6px; border-radius:9px; margin-right:2px; }
.lib .k { background:#0072b2; color:#fff; }
.fx .k { background:#e2e5eb; color:#16161a; }
.lib, .fx { font-size:13px; }
.pt-c { display:flex; align-items:center; gap:8px; padding:0 12px; font-size:13px; color:#16161a; }
.fleche { font-size:20px; font-weight:700; width:24px; text-align:center; }
.leg { font-size:12px; color:#55555f; }
.paire { display:grid; grid-template-columns:172px 172px; gap:10px; justify-content:space-between; }
figure { display:flex; flex-direction:column; gap:4px; }
figcaption { font-size:12px; color:#3a3a42; }
.branche { font-size:12px; color:#55555f; padding:0 12px; }
</style></head>
<body><main class="page">
<h1>La carte des outils houblons</h1>
<p class="cas">Stout export 16D : « trop résineuse, je la veux plus florale » (18.10). Un écran = une question, un seul réglage libre.</p>
<p class="cle"><span><i class="l"></i>réglage libre</span><span><i class="c"></i>fixé, sans réglage</span><span>~ simulé · ? inconnu</span></p>
<section class="et"><div class="et-t"><span class="num-e">0</span><div><h2>Ma bière · Houblons</h2><p class="q">Le point d'entrée (l8).</p></div></div><div class="et-c">${vign('ma-biere', true)}<div class="et-d"><p class="fx">Chaque houblon, ajout ou levure ouvre son outil en plein écran.</p></div></div></section>
${pont('« + floral » → Suggérer')}
${etape(1, 'Suggérer', 'Quel houblon ajouter à ma bière ?', 'les candidats', 'stout, 4 g/L, après 3 j, US-05', 'suggerer')}
${pont('« Comparer les 3 » → Comparer')}
<p class="branche">Branche depuis Nugget dans Ma bière :</p>
${deux(2, 'Substituer', 'Je n\'ai pas Nugget : lequel à sa place ?', 'le remplaçant', { id: 'substituer-porte', t: 'Une porte.', d: 'Comparer s\'ouvre avec Nugget épinglé en colonne 1.' }, { id: 'substituer-outil', t: 'Un outil (u4).', d: 'La liste ; « Face à face » ouvre Comparer.' })}
${pont('les deux mènent à Comparer')}
${etape(3, 'Comparer', 'Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ?', 'la variété', 'stout, 4 g/L, après 3 j, US-05', 'comparer')}
${pont('le gagnant → Dryhopper')}
${etape(4, 'Dryhopper', 'Quand ajouter Idaho 7 ?', 'le moment, par 5′', 'Idaho 7, 4 g/L, US-05 ; en bas, ma bière → +1 → +2', 'dryhopper')}
${pont('« Puis la levure » → Levure')}
${deux(5, 'Levure', 'Que change ma levure ?', 'la levure', { id: 'levure-etape', t: 'Dernière étape de Dryhopper.', d: 'Le dry hop qu\'on vient de placer, US-05 ou Pomona.' }, { id: 'levure-outil', t: 'Un outil (a2b).', d: 'Depuis la levure de Ma bière : ce que le houblon apporte, ce que la levure ajoute.' })}
<p class="cas">Planche de parcours, pas preuve des écrans : chaque vignette s'ouvre d'un toucher. Valeurs : comparer-stout.json et pages de base ; le détail de Comparer est le lot 22.</p>
</main>
<script>
// Chaque vignette est rognée à la hauteur de son contenu (la page la donne par postMessage).
addEventListener('message', function (e) { if (!e.data || !e.data.carte) return;
  document.querySelectorAll('[data-vg="' + e.data.carte + '"]').forEach(function (v) { var k = v.classList.contains('large') ? 0.525 : 0.44; v.style.height = Math.min(844, e.data.h + 6) * k + 'px'; }); });
</script>
</body></html>
`;

// ---------- écriture ----------
for (const [id, html] of Object.entries(ecrans)) {
  fs.mkdirSync(path.join(ici, id), { recursive: true });
  fs.writeFileSync(path.join(ici, id, 'etat.html'), html);
}
fs.writeFileSync(path.join(ici, 'carte.html'), carte);
console.log('écrit : carte.html + ' + Object.keys(ecrans).join(', '));

if (process.argv.includes('--captures')) {
  const puppeteer = (await import('puppeteer-core')).default;
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  fs.mkdirSync(path.join(ici, 'captures'), { recursive: true });
  const mesures = {};
  const shot = async (file, out, full = true, avant = null) => {
    const p = await browser.newPage();
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.goto(pathToFileURL(file).href, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 600));
    if (avant) await avant(p);
    await p.screenshot({ path: path.join(ici, 'captures', out), fullPage: full });
    await p.close();
  };
  for (const id of Object.keys(ecrans)) await shot(path.join(ici, id, 'etat.html'), id + '-390.png', false, async (p) => {
    // D4 : part du premier écran couverte par du contenu (bas du dernier bloc / 844).
    mesures[id] = await p.evaluate(() => Math.round(Math.min(844, document.querySelector('main').lastElementChild.getBoundingClientRect().bottom) / 844 * 100) / 100);
  });
  // La carte : la fenêtre prend toute la hauteur, pour que chaque iframe soit peinte avant la capture.
  await shot(path.join(ici, 'carte.html'), 'carte-390.png', true, async (p) => {
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    await p.setViewport({ width: 390, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await new Promise((r) => setTimeout(r, 2500));
    const h2 = await p.evaluate(() => document.documentElement.scrollHeight);
    if (h2 !== h) { await p.setViewport({ width: 390, height: h2, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await new Promise((r) => setTimeout(r, 1500)); }
  });
  // États utiles : Dryhopper glissé à 60′ (IBU) ; doigt posé (loupe) ; Comparer légende ouverte.
  const rail = async (p) => p.$eval('.rail', (e) => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; });
  await shot(path.join(ici, 'dryhopper', 'etat.html'), 'dryhopper-60-390.png', false, async (p) => {
    const r = await rail(p); await p.mouse.move(r.x + r.w * 0.6, r.y); await p.mouse.down(); await p.mouse.move(r.x + 1, r.y, { steps: 8 }); await p.mouse.up();
  });
  await shot(path.join(ici, 'dryhopper', 'etat.html'), 'dryhopper-toucher-390.png', false, async (p) => {
    const r = await rail(p); await p.mouse.move(r.x + r.w * 0.3, r.y); await p.mouse.down(); await p.mouse.move(r.x + r.w * 0.25, r.y, { steps: 4 });
    mesures.loupe = await p.evaluate(() => { const s = [...document.querySelectorAll('.loupe span')]; const rl = document.querySelector('.rail').getBoundingClientRect(); return { pasLoupe: s.length > 1 ? Math.round(s[1].getBoundingClientRect().left - s[0].getBoundingClientRect().left) : 0, pasRail: Math.round(rl.width * 0.44 * 0.88 / 12 * 10) / 10, graduations: document.querySelectorAll('.cran').length }; });
  });
  await shot(path.join(ici, 'comparer', 'etat.html'), 'comparer-legende-390.png', false, async (p) => { await p.click('[data-role=legende-bouton]'); });
  await browser.close();
  fs.writeFileSync(path.join(ici, 'captures', 'mesures.json'), JSON.stringify(mesures, null, 1));
  console.log('captures écrites ; mesures : ' + JSON.stringify(mesures));
}
