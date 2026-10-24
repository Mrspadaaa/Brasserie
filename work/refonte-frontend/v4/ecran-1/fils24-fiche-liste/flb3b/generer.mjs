// flb3b — passe 2 de flb3 (tiède, série b : la signature, puis le reste). Retouches du conseil (verdict conseil-fl,
// recommandation 1) : onglets des houblons sortis de la fiche ; zone 16D en pointillé gris d'une seule teinte ; règle
// de repli (aucun mot dans toutes ses fiches → les mots d'au moins la moitié de ses fiches, compte affiché) ;
// « non décrites » en ligne de pictos « ? » ; un seul α, celui de g1 (Hopsteiner 2025, sinon sa seule fiche), avec le
// lot, en police du thème. Socle et données copiés de flb1 (la v0 reste intacte).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { page, ecrire, fond, croix, usage, stock, titre, alpha, lentille, legende, gout, radar, pi, NOM, T, esc, HOUBLONS } from './socle-flb.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// La phrase : les mots signants que toutes ses fiches disent ; sinon (repli) ceux d'au moins la moitié de ses fiches.
export function phrase(h) {
  const signes = h.concepts.filter((c) => c.signe);
  const tous = signes.filter((c) => c.n === c.N);
  const repli = !tous.length;
  const mots = (repli ? signes.filter((c) => c.n * 2 >= c.N) : tous).slice(0, 3);
  const reste = signes.filter((c) => !mots.includes(c)).slice(0, 4);
  return { mots, reste, repli };
}

function feuille(h) {
  const { mots, reste, repli } = phrase(h);
  const premier = mots.find((c) => c.premier.length);
  const compte = (c) => '<span class="flb3b-c num">' + c.n + '/' + c.N + '</span>';
  const mot = (c, i) => '<span class="flb3b-w" style="color:' + (c.famille ? T(c.famille) : '#16161a') + '">' + esc(i === 0 ? cap(c.mot) : c.mot) + (repli ? compte(c) : '') + '</span>';
  const sous = repli
    ? 'aucun mot dans ses ' + h.N + ' fiches à la fois : ceux d\'au moins ' + Math.ceil(h.N / 2) + ' sur ' + h.N
    : (h.N > 1 ? 'ses ' + h.N + ' fiches le disent toutes' : 'sa seule fiche le dit');
  const cat = h.familles.filter((a) => h.concepts.filter((c) => c.famille === a.f).every((c) => c.seulCategorie));
  return '<section class="flb-feuille flb3b-f0" role="dialog" aria-label="Fiche de ' + esc(h.nom) + '"><span class="flb-poignee"></span>'
    + '<header class="flb3b-t">' + titre(h) + croix(h) + '</header>'
    + '<div class="flb3b-a">' + alpha(h, { jauge: true }) + usage(h) + stock(h) + '</div>'
    + '<div class="flb3b-r">' + radar(h, { taille: 362, rayon: 80 }) + '</div>'
    + '<blockquote class="flb3b-q" data-role="signature"><p>' + mots.map(mot).join(', ') + '.</p><cite>' + esc(sous)
    + (premier ? ' · « ' + esc(premier.mot) + ' » d\'abord' + (premier.premier.length > 1 ? (premier.premier.length === h.N ? ' dans toutes' : ', chez ' + premier.premier.length) : '') : '') + '</cite></blockquote>'
    + (reste.length ? '<p class="flb3b-p"><span class="flb3b-k">' + (reste.every((c) => c.n === c.N) ? 'aussi' : 'puis') + '</span>' + reste.map((c) => '<b style="color:' + (c.famille ? T(c.famille) : '#16161a') + '">' + esc(c.mot) + '</b><span class="num">' + c.n + '/' + c.N + '</span>').join('') + '</p>' : '')
    + '<div class="flb3b-o">' + legende('flb3b-' + h.cle, ['La phrase : les mots que toutes ses fiches disent et que peu de houblons disent ; s\'il n\'y en a pas, ceux d\'au moins la moitié de ses fiches, avec leur compte. Rien n\'y est ajouté.', '<b>puis</b> : ce qu\'une partie de ses fiches ajoute.', 'En bas : les familles que le radar dessine (cat. : Hopsteiner l\'y range sans aucun mot), puis les familles non décrites (picto et « ? »).']) + '' + lentille() + '</div>'
    + '<p class="flb3b-fam">' + h.familles.map((a) => '<span class="flb3b-fa" data-famille="' + a.f + '">' + pi(a.f, 14) + '<b style="color:' + T(a.f) + '">' + NOM[a.f] + '</b><span class="num">' + a.n + '/' + a.N + (cat.includes(a) ? ' cat.' : '') + '</span></span>').join('') + '</p>'
    + (h.inconnues.length ? '<p class="flb3b-nd" aria-label="' + h.inconnues.length + ' familles non décrites : ' + h.inconnues.map((f) => NOM[f]).join(', ') + '">' + h.inconnues.map((f) => '<span class="flb3b-q1" data-famille="' + f + '">' + pi(f, 16) + '<i style="color:' + T(f) + '">?</i></span>').join('') + '</p>' : '')
    + gout(h) + '</section>';
}

// Hors de la fiche : la question, les onglets des houblons (le facteur libre de la maquette) et la ligne de contexte.
const tete = (debut) => '<div class="flb3b-haut"><h1 class="flb3b-h1">Que sent ce houblon, dit avec ses mots ?</h1>'
  + '<div class="flb3b-tabs" data-libre="houblon" role="group" aria-label="Houblon de la fiche">' + HOUBLONS.map((h) => '<button type="button" data-aller="' + esc(h.nom) + '" data-houblon="' + esc(h.nom) + '" aria-pressed="' + (h.nom === debut) + '">' + esc(h.nom) + '</button>').join('') + '</div>'
  + '<p class="flb3b-ctx" data-role="contexte"><span class="flb3b-fx">fixé</span><span data-contexte="base">Stout export 16D</span><span data-contexte="levure">levure US-05</span></p></div>';

const CSS = `
.flb3b .flb-cadre { background:#d9dadd; }
.flb3b-haut { background:#fff; padding:8px 12px 8px; display:flex; flex-direction:column; gap:6px; border-bottom:1px solid var(--trait); }
.flb3b-h1 { font-size:16px; font-weight:700; }
.flb3b-tabs { display:flex; gap:0; overflow-x:auto; scrollbar-width:none; }
.flb3b-tabs button { flex:none; height:30px; padding:0 8px; font-size:13px; color:var(--gris); border-bottom:3px solid transparent; user-select:none; -webkit-user-select:none; white-space:nowrap; }
.flb3b-tabs button[aria-pressed="true"] { color:var(--encre); font-weight:700; border-bottom-color:var(--encre); }
.flb3b-ctx { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--gris); }
.flb3b-ctx [data-contexte] { background:var(--mur); border-radius:11px; padding:1px 8px; color:var(--encre); }
.flb3b-fx { font-size:12px; }
.flb3b-t { display:flex; align-items:center; justify-content:space-between; }
.flb3b-t .flb-nom { font-size:26px; }
.flb3b-a { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.flb3b-a .flb-al-a b { font-size:22px; font-weight:700; }
.flb3b-a .flb-al-l { font-size:14px; }
.flb3b-a .flb-us { margin-left:auto; }
.flb3b-r { display:flex; justify-content:center; margin:-2px 0 -6px; }
.flb3b-q { border-left:5px solid var(--encre); padding:2px 0 2px 12px; }
.flb3b-q p { font-size:29px; line-height:1.08; font-weight:700; letter-spacing:-.01em; }
.flb3b-c { font-size:13px; font-weight:400; color:var(--gris); margin-left:3px; letter-spacing:0; vertical-align:super; }
.flb3b-q cite { display:block; font-style:normal; font-size:14px; color:var(--gris); margin-top:5px; }
.flb3b-p { display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 6px; font-size:17px; }
.flb3b-p .num { font-size:12px; color:var(--gris); margin-right:8px; }
.flb3b-k { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--gris); margin-right:4px; }
.flb3b-o { display:flex; align-items:center; gap:8px; border-top:1px solid var(--trait); padding-top:8px; }
.flb3b-o .flb-seg { margin-left:auto; }
.flb3b-fam { display:flex; flex-wrap:wrap; gap:4px 12px; font-size:13px; }
.flb3b-fa { display:inline-flex; align-items:center; gap:3px; }
.flb3b-fa .num { font-size:11px; color:var(--gris); }
.flb3b-n { font-size:12px; color:var(--gris); }
.flb3b-nd { display:flex; flex-wrap:wrap; gap:4px 10px; }
.flb3b-q1 { display:inline-flex; align-items:center; gap:1px; }
.flb3b-q1 i { font-style:normal; font-size:13px; font-weight:700; color:var(--gris); }
`;

if (process.argv[1] && process.argv[1].endsWith('generer.mjs')) {
  ecrire(ici, page({ id: 'flb3b', nom: 'la signature en une phrase de ses mots, passe 2', css: CSS, debut: 'Nelson Sauvin', feuille, cadre: (s) => tete('Nelson Sauvin') + fond(58) + s }));
  for (const h of HOUBLONS) { const p = phrase(h); console.log(h.nom.padEnd(14), p.repli ? 'repli' : 'toutes', '·', p.mots.map((c) => c.mot + ' ' + c.n + '/' + c.N).join(', '), '| puis', p.reste.map((c) => c.mot + ' ' + c.n + '/' + c.N).join(', '), '| α', h.alpha.texte, h.alpha.source, 'lot', h.alpha.lotTexte); }
}
