// rcb4 — chaude : « Par élimination ». Passe 2 (critique) : mots traduits (D97), rôle du fournisseur d'abord (D14),
// colonnes rayées en un trait, noms en entier, α du lot. On ne dit pas ce qu'on veut, on raye ce qu'on ne veut pas. Les 12 familles
// en colonnes ; un toucher sur une colonne la barre, et tout houblon qui la cite disparaît : le compte descend
// sous le doigt. Ce qui reste est une matrice : un point par famille citée (gros : marqué, petit : cité), alignée
// sous son picto. D32 (« je sais pas comment bannir une contrainte ») et D20 (« pas aimer un houblon en particulier »).
// Cas : rayés résineux, épicé, végétal, pépins (« ma stout est trop résineuse ») → les houblons qui restent sur 297 décrits,
// du plus huileux au moins.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOUBLONS, FAMILLES, NOM, esc, plage, pi, B, ecrire } from '../rcb1/donnees-rcb.mjs';
import { ETAPE, BARRE, ATTENDUES, lentille, legende, plus, stockBadge, usage, alpha, page } from '../rcb1/commun-rcb.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const mid = (p) => (p && p[0] != null ? (p[0] + p[1]) / 2 : null);
const COL = ['citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'floral', 'herbal', 'earthy', 'green', 'spice', 'resin'];
const RAYES = ['resin', 'spice', 'green', 'pomeFruit'];
const decrits = HOUBLONS.filter((h) => h.familles.length);
const resultats = decrits.filter((h) => !RAYES.some((f) => h.familles.includes(f))).sort((a, b) => (mid(b.huile) ?? -1) - (mid(a.huile) ?? -1));

const entete = '<div class="rcb4-grille rcb4-ent" role="group" aria-label="Familles : toucher pour rayer">'
  + '<span class="rcb4-g1"></span>'
  + COL.map((f) => '<button type="button" class="rcb4-col' + (RAYES.includes(f) ? ' rcb4-raye' : '') + '" aria-pressed="' + RAYES.includes(f) + '" aria-label="' + NOM[f] + (RAYES.includes(f) ? ', rayé' : '') + '">' + pi(f, 14) + '</button>').join('')
  + '<span class="rcb4-g3"></span></div>'
  + '<div class="rcb4-grille rcb4-zone"><span class="rcb4-g1"></span>' + COL.map((f) => '<span class="rcb4-zc' + (ATTENDUES.includes(f) ? ' rcb4-att' : '') + '"' + (f === 'floral' ? ' data-role="zone" aria-label="attendues par la 16D : floral, herbacé, terreux"' : '') + '></span>').join('') + '<span class="rcb4-g3"></span></div>';

const ligne = (h) => '<li class="rcb4-l" data-role="ligne-houblon" data-id="' + esc(h.id) + '">'
  + '<div class="rcb4-grille"><b class="rcb4-nom rcb4-g1" data-houblon="' + esc(h.id) + '">' + esc(h.nom) + '</b>'
  + COL.map((f) => '<span class="rcb4-cl' + (RAYES.includes(f) ? ' rcb4-cr' : '') + '">' + (h.niveau[f] ? '<i class="rcb4-pt' + (h.niveau[f] === 2 ? ' rcb4-pt2' : '') + '" data-famille="' + f + '" style="background:' + B(f) + '" role="img" aria-label="' + NOM[f] + (h.niveau[f] === 2 ? ', marqué' : ', cité') + '"></i>' : '') + '</span>').join('')
  + '<span class="rcb4-g3">' + plus(h) + '</span></div>'
  + '<div class="rcb4-l2">' + alpha(h, true) + usage(h) + stockBadge(h) + (h.sans.length ? '<i class="rcb4-mots">' + esc(h.sans.slice(0, 2).join(', ')) + '</i>' : '') + '<span class="num rcb4-hu">' + plage(h.huile) + '</span></div></li>';

const corps = ETAPE + '<div class="rcb4-haut">'
  + '<div class="rcb4-cnt"><span class="rcb4-n"><b class="num">' + resultats.length + '</b> restent <span class="num">· ' + decrits.length + ' décrits</span></span>' + lentille() + legende('rcb4-lg', [
    'Une colonne par famille. Toucher son picto la raye : tout houblon qui la cite sort, le compte descend.',
    'Dans la ligne, un point sous la famille que ses fiches citent ; gros : marqué (deux fiches ou en premier), petit : cité.',
    'Trois colonnes entourées de pointillé : ce que la 16D attend (floral, herbacé, terreux).',
    'Du plus huileux au moins ; l’huile en bout de ligne, mL/100 g. + ajoute à la recette · appui long : sa fiche · glisser à gauche : dans Comparer.']) + '</div>'
  + entete + '</div>'
  + '<ol class="rcb4-liste" aria-label="Houblons restants">' + resultats.map(ligne).join('') + '</ol>'
  + '<p class="rcb4-fin">' + (HOUBLONS.length - decrits.length) + ' houblons sans famille décrite, hors du compte</p>' + BARRE;

const CSS = `
.rcb4-haut { padding:4px 8px 0; border-bottom:1px solid var(--trait); position:sticky; top:0; background:#fff; z-index:5; }
.rcb4-cnt { display:flex; align-items:center; gap:8px; padding-bottom:4px; }
.rcb4-n { flex:1; font-size:15px; white-space:nowrap; }
.rcb4-n b { font-weight:700; }
.rcb4-n .num:not(b) { color:var(--gris); font-size:12px; }
.rcb4-grille { display:grid; grid-template-columns:130px repeat(12, 17px) 30px; align-items:center; }
.rcb4-ent { height:32px; }
.rcb4-col { height:28px; display:inline-flex; align-items:center; justify-content:center; position:relative; }
.rcb4-raye::after { content:""; position:absolute; left:4px; right:4px; top:50%; border-top:2px solid var(--acc); transform:rotate(-45deg); }
.rcb4-zone { height:6px; margin-bottom:-1px; }
.rcb4-zc { height:6px; }
.rcb4-att { border:1.5px dashed var(--gris2); border-top:0; }
.rcb4-att + .rcb4-att { border-left:0; }
.rcb4-liste { list-style:none; padding:0 8px; }
.rcb4-l { padding:2px 0 1px; border-bottom:1px solid var(--trait); }
.rcb4-l .rcb4-grille { height:24px; }
.rcb4-nom { font-size:15px; font-weight:700; white-space:nowrap; padding-right:4px; letter-spacing:-.01em; }
.rcb4-cl { height:24px; display:flex; align-items:center; justify-content:center; }
.rcb4-cr { background:linear-gradient(var(--gris2), var(--gris2)) center / 1.5px 100% no-repeat; }
.rcb4-pt { width:7px; height:7px; border-radius:50%; display:block; }
.rcb4-pt2 { width:11px; height:11px; }
.rcb4-g3 { display:flex; justify-content:flex-end; }
.rcb4-l2 { display:flex; align-items:center; gap:8px; font-size:12px; line-height:1.1; color:var(--gris); white-space:nowrap; overflow:hidden; min-height:15px; }
.rcb4-mots { color:var(--encre); font-weight:600; overflow:hidden; text-overflow:ellipsis; flex:1; min-width:0; }
.rcb4-hu { margin-left:auto; flex:none; }
.rcb4-fin { font-size:12px; color:var(--gris); padding:8px 8px 12px; }
`;

ecrire(ici, page({ id: 'rcb4', nom: 'par élimination', css: CSS, corps, houblons: resultats }));
console.log('rcb4 écrit : ' + resultats.length + ' restent sur ' + decrits.length + ' ; ' + resultats.slice(0, 8).map((h) => h.nom).join(', '));
