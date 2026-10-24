// rcb3 — chaude : « Comme Nelson Sauvin ». Passe 2 (critique, D100) : « Disent ses mots » en premier regard, les
// calculés après, nommés « par familles seulement » (le score du dépôt ne voit pas les mots hors des 12). On ne décrit rien : on nomme un houblon, et la liste répond en trois
// regards sur la ressemblance : les remplaçants calculés du dépôt (score sur 100, en trois composantes), ceux de
// mon stock (le score qu'ils ont, même moyen), et ceux qui disent ses mots à lui, hors des 12 familles (vin blanc,
// groseille à maquereau…), que le score ne voit pas. Le bandeau noir dit ce que lui seul dit.
// Données : pack-fiches.json (substitution v1, « à valider par le brasseur »), proto-data.json pour les mots.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOUBLONS, PAR_NOM, PAR_ID, remplacants, dit, esc, plage, pi, T, virg, ecrire } from '../rcb1/donnees-rcb.mjs';
import { ETAPE, BARRE, lentille, zone, legende, plus, stockBadge, usage, alpha, ic, page } from '../rcb1/commun-rcb.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const REF = PAR_NOM.get('Nelson Sauvin');
const S = remplacants('Nelson Sauvin');
const calc = S.remplacants.slice(0, 5).map((r) => ({ r, h: PAR_ID.get(r.key) }));
const stock = S.enStock.slice(0, 3).map((r) => ({ r, h: PAR_ID.get(r.key) }));
const MOTS = ['vin blanc', 'groseille à maquereau', 'raisin', 'sauvignon blanc'];
const parMots = HOUBLONS.filter((h) => h.nom !== REF.nom).map((h) => ({ h, m: MOTS.filter((m) => dit(h, m)) })).filter((x) => x.m.length >= 1).sort((a, b) => b.m.length - a.m.length || (b.h.stock ? b.h.stock.g : 0) - (a.h.stock ? a.h.stock.g : 0)).slice(0, 6);

// Les familles d'un remplaçant : celles de la référence en couleur, celles qu'il apporte en plus marquées « + ».
const fams = (h, r) => '<span class="rcb3-fam">' + REF.familles.filter((f) => h.familles.includes(f)).map((f) => pi(f, 14)).join('')
  + r.gagne.filter((g) => g.de === 0).slice(0, 2).map((g) => '<span class="rcb3-plusf" style="color:' + T(g.family) + '">+' + pi(g.family, 14) + '</span>').join('')
  + r.perd.map((g) => '<span class="rcb3-perd">' + pi(g.family, 14) + '</span>').join('') + '</span>';

const ligneScore = ({ r, h }) => '<li class="rcb3-l" data-role="ligne-houblon" data-id="' + esc(h.id) + '">'
  + '<b class="rcb3-sc num">' + r.score + '</b>'
  + '<div class="rcb3-c"><div class="rcb3-l1"><b class="rcb3-nom" data-houblon="' + esc(h.id) + '">' + esc(h.nom) + '</b>' + fams(h, r) + stockBadge(h) + '</div>'
  + '<div class="rcb3-l2">' + alpha(h, true) + usage(h) + (h.sans.length ? '<i class="rcb3-mots">' + esc(h.sans[0]) + '</i>' : '') + '</div></div>'
  + '<span class="rcb3-comp num" aria-label="arôme ' + r.composantes.arome + ', huiles ' + r.composantes.huiles + ', amertume ' + r.composantes.amertume + '"><i>' + r.composantes.arome + '</i><i>' + r.composantes.huiles + '</i><i>' + r.composantes.amertume + '</i></span>'
  + plus(h) + '</li>';

const ligneMots = ({ h, m }) => '<li class="rcb3-l rcb3-lm" data-role="ligne-houblon" data-id="' + esc(h.id) + '">'
  + '<span class="rcb3-sc rcb3-scm num" aria-label="' + m.length + ' de ses 4 mots">' + m.length + '<i>/4</i></span>'
  + '<div class="rcb3-c"><div class="rcb3-l1"><b class="rcb3-nom" data-houblon="' + esc(h.id) + '">' + esc(h.nom) + '</b><span class="rcb3-fam">' + h.familles.slice(0, 4).map((f) => pi(f, 14)).join('') + '</span>' + stockBadge(h) + '</div>'
  + '<div class="rcb3-l2">' + alpha(h, true) + usage(h) + '<b class="rcb3-dits">' + esc(m.join(', ')) + '</b></div></div>' + plus(h) + '</li>';

const bandeau = '<div class="rcb3-ref" role="combobox" aria-expanded="false" aria-label="Comme quel houblon ? Nelson Sauvin" data-role="ligne-houblon" data-id="' + esc(REF.id) + '">'
  + '<div class="rcb3-r1"><span class="rcb3-comme">comme</span><b class="rcb3-rnom" data-houblon="' + esc(REF.id) + '">' + esc(REF.nom) + '</b><button type="button" class="rcb3-x" aria-label="Changer de houblon">' + ic('i-x', 16) + '</button></div>'
  + '<div class="rcb3-r2"><span class="num">α ' + plage(REF.alpha) + ' · lot ' + virg(REF.stock.alpha) + '</span><span data-role="usage" data-usage="' + REF.role + '">' + REF.role + '</span><span class="rcb3-chip">' + REF.familles.map((f) => pi(f, 14)).join('') + '</span><span class="num">' + REF.stock.g + ' g</span></div>'
  + '<p class="rcb3-seul">Lui seul : <b>' + esc(MOTS.join(', ')) + '</b></p></div>';

const corps = ETAPE + '<div class="rcb3-haut">' + bandeau
  + '<div class="rcb3-cnt">' + zone() + lentille() + legende('rcb3-lg', [
    'Score sur 100 : remplaçant calculé par le dépôt sur les 12 familles seulement (arôme 50 %, huiles 25 %, amertume 25 %), à valider par le brasseur ; il ne voit pas les mots hors des 12. Les trois chiffres : ces composantes.',
    'Pictos en couleur : ses familles à lui, que le remplaçant a aussi ; « + » : une famille en plus ; barré : perdue.',
    'Lui seul : ses mots hors des 12 familles. En bas, ceux qui les disent aussi, que le score ne voit pas.',
    '+ ajoute à la recette · appui long : sa fiche · glisser à gauche : dans Comparer.']) + '</div></div>'
  + '<div class="rcb3-sec"><h2>Disent ses mots</h2></div><ol class="rcb3-liste">' + parMots.map(ligneMots).join('') + '</ol>'
  + '<div class="rcb3-sec"><h2>Mon stock · 12 familles seulement</h2></div><p class="rcb3-ent num">score · arôme huiles amer</p><ol class="rcb3-liste">' + stock.map(ligneScore).join('') + '</ol>'
  + '<div class="rcb3-sec"><h2>Calculés · 12 familles seulement</h2></div><ol class="rcb3-liste">' + calc.map(ligneScore).join('') + '</ol>'
  + '<p class="rcb3-fin">' + S.candidats + ' candidats · ' + esc(S.methode) + ' · ' + esc(S.statut) + '</p>' + BARRE;

const CSS = `
.rcb3-haut { display:flex; flex-direction:column; }
.rcb3-ref { background:var(--encre); color:#fff; padding:8px 12px 10px; display:flex; flex-direction:column; gap:4px; }
.rcb3-r1 { display:flex; align-items:baseline; gap:8px; }
.rcb3-comme { font-size:15px; color:#c9cbd1; }
.rcb3-rnom { font-size:22px; font-weight:700; flex:1; }
.rcb3-x { width:28px; height:28px; border-radius:50%; background:#fff; color:var(--encre); display:inline-flex; align-items:center; justify-content:center; align-self:center; }
.rcb3-r2 { display:flex; align-items:center; gap:10px; font-size:12px; color:#e3e5eb; }
.rcb3-chip { display:inline-flex; gap:3px; padding:2px 5px; background:#fff; border-radius:4px; }
.rcb3-seul { font-size:15px; line-height:1.25; }
.rcb3-seul b { font-weight:700; }
.rcb3-cnt { display:flex; align-items:center; justify-content:flex-end; gap:8px; padding:4px 10px; border-bottom:1px solid var(--trait); }
.rcb3-sec { display:flex; align-items:baseline; justify-content:space-between; padding:6px 10px 1px; }
.rcb3-sec h2 { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:var(--gris); white-space:nowrap; }
.rcb3-ent { font-size:12px; color:var(--gris); text-align:right; padding:0 42px 1px 10px; word-spacing:4px; }
.rcb3-liste { list-style:none; padding:0 10px; }
.rcb3-l { display:flex; align-items:center; gap:8px; padding:2px 0 1px; border-bottom:1px solid var(--trait); }
.rcb3-sc { font-size:22px; font-weight:700; width:34px; text-align:right; flex:none; }
.rcb3-scm { font-size:15px; }
.rcb3-scm i { font-style:normal; font-size:12px; color:var(--gris); }
.rcb3-c { flex:1; min-width:0; display:flex; flex-direction:column; gap:0; }
.rcb3-l1 { display:flex; align-items:center; gap:6px; }
.rcb3-nom { font-size:15px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:none; max-width:140px; }
.rcb3-fam { display:inline-flex; align-items:center; gap:2px; flex:1; min-width:0; overflow:hidden; }
.rcb3-l1 .rcb-stk { white-space:nowrap; flex:none; }
.rcb3-plusf { display:inline-flex; align-items:center; font-size:12px; font-weight:700; }
.rcb3-perd { position:relative; }
.rcb3-perd::after { content:""; position:absolute; left:-1px; right:-1px; top:50%; border-top:1.5px solid var(--acc); transform:rotate(-30deg); }
.rcb3-l2 { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--gris); white-space:nowrap; overflow:hidden; min-height:18px; }
.rcb3-mots { color:var(--encre); font-weight:600; overflow:hidden; text-overflow:ellipsis; }
.rcb3-dits { color:var(--encre); font-weight:700; overflow:hidden; text-overflow:ellipsis; }
.rcb3-comp { display:inline-flex; gap:0; flex:none; font-size:12px; color:var(--gris); }
.rcb3-comp i { font-style:normal; width:26px; text-align:right; }
.rcb3-fin { font-size:12px; color:var(--gris); padding:8px 10px 12px; }
`;

ecrire(ici, page({ id: 'rcb3', nom: 'comme Nelson Sauvin', css: CSS, corps, houblons: [REF, ...calc.map((x) => x.h), ...stock.map((x) => x.h), ...parMots.map((x) => x.h)] }));
console.log('rcb3 écrit : calculés ' + calc.map((x) => x.h.nom + ' ' + x.r.score).join(', ') + ' ; stock ' + stock.map((x) => x.h.nom + ' ' + x.r.score).join(', ') + ' ; mots ' + parMots.map((x) => x.h.nom + ' ' + x.m.length).join(', '));
