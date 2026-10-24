// flb3c — passe 3 légère de flb3 (critique PASSE2 : REJET de flb3b pour son second en-tête, D119, D116) : l'étape garde
// son seul en-tête (‹ Houblons 3/7, 16D, IBU · OG · EBC), le houblon se choisit dans l'étape, sous cet en-tête ; la fiche
// s'ouvre par-dessus avec son en-tête à elle (nom ⊙, croix de 44 px), la question et le contexte dedans ; flèches du
// radar réparées (marqueur unique par radar) ; légende dépliée dans le flux. Le reste est flb3b.
// Historique : passe 2 de flb3 (tiède, série b : la signature, puis le reste). Retouches du conseil (verdict conseil-fl,
// recommandation 1) : onglets des houblons sortis de la fiche ; zone 16D en pointillé gris d'une seule teinte ; règle
// de repli (aucun mot dans toutes ses fiches → les mots d'au moins la moitié de ses fiches, compte affiché) ;
// « non décrites » en ligne de pictos « ? » ; un seul α, celui de g1 (Hopsteiner 2025, sinon sa seule fiche), avec le
// lot, en police du thème. Socle et données copiés de flb1 (la v0 reste intacte).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { page, ecrire, fond, croix, usage, stock, titre, alpha, ic, lentille, legende, gout, radar, pi, NOM, T, esc, HOUBLONS } from './socle-flb.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// La phrase : les mots signants que toutes ses fiches disent ; sinon (repli) ceux d'au moins la moitié de ses fiches.
export function phrase(h) {
  const signes = h.concepts.filter((c) => c.signe);
  const tous = signes.filter((c) => c.n === c.N);
  const repli = !tous.length;
  const mots = (repli ? signes.filter((c) => c.n * 2 >= c.N) : tous).slice(0, 3);
  const reste = [...signes.filter((c) => !mots.includes(c)).slice(0, 4), ...h.concepts.filter((c) => c.generique && !c.seulCategorie)];
  return { mots, reste, repli };
}

function feuille(h) {
  const { mots, reste, repli } = phrase(h);
  const premier = mots.find((c) => c.premier.length);
  const compte = (c) => '<span class="flb3c-c num">' + c.n + '/' + c.N + '</span>';
  const mot = (c, i) => '<span class="flb3c-w" style="color:' + (c.famille ? T(c.famille) : '#16161a') + '">' + esc(i === 0 ? cap(c.mot) : c.mot) + (repli ? compte(c) : '') + '</span>';
  const sous = repli
    ? 'aucun mot dans ses ' + h.N + ' fiches à la fois : ceux d\'au moins ' + Math.ceil(h.N / 2) + ' sur ' + h.N
    : (h.N > 1 ? 'ses ' + h.N + ' fiches le disent toutes' : 'sa seule fiche le dit');
  const cat = h.familles.filter((a) => h.concepts.filter((c) => c.famille === a.f).every((c) => c.seulCategorie));
  return '<section class="flb-feuille flb3c-f0" role="dialog" aria-label="Fiche de ' + esc(h.nom) + '"><span class="flb-poignee"></span>'
    + '<header class="flb3c-t"><p class="flb-nom">' + esc(h.nom) + ' <span class="flb-cible" role="img" aria-label="repère">' + ic('cible', 16) + '</span></p>' + croix(h) + '</header>'
    + '<div class="flb3c-a">' + alpha(h, { jauge: true }) + usage(h) + stock(h) + '</div>'
    + '<h2 class="flb3c-h2">Que sent ' + esc(h.nom) + ', dit avec ses mots ?</h2>'
    + '<p class="flb3c-ctx" data-role="contexte"><span data-contexte="base">ta Stout export 16D</span><span data-contexte="levure">levure US-05</span></p>'
    + '<div class="flb3c-r">' + radar(h, { taille: 362, rayon: 80 }) + '</div>'
    + '<blockquote class="flb3c-q" data-role="signature"><p>' + mots.map(mot).join(', ') + '.</p><cite>' + esc(sous)
    + (premier ? ' · « ' + esc(premier.mot) + ' » d\'abord' + (premier.premier.length > 1 ? (premier.premier.length === h.N ? ' dans toutes' : ', chez ' + premier.premier.length) : '') : '') + '</cite></blockquote>'
    + (reste.length ? '<p class="flb3c-p"><span class="flb3c-k">' + (reste.every((c) => c.n === c.N) ? 'aussi' : 'puis') + '</span>' + reste.map((c) => '<b' + (c.generique ? ' class="flb3c-gen"' : '') + ' style="color:' + (c.famille ? T(c.famille) : c.generique ? '#55555f' : '#16161a') + '">' + esc(c.mot) + '</b><span class="num">' + c.n + '/' + c.N + '</span>').join('') + '</p>' : '')
    + '<div class="flb3c-o">' + legende('flb3c-' + h.cle, ['La phrase : les mots que toutes ses fiches disent et que peu de houblons disent ; s\'il n\'y en a pas, ceux d\'au moins la moitié de ses fiches, avec leur compte. Rien n\'y est ajouté.', '<b>puis</b> : ce qu\'une partie de ses fiches ajoute.', 'En bas : les familles que le radar dessine (cat. : Hopsteiner l\'y range sans aucun mot), puis les familles non décrites (picto et « ? »).']) + '' + lentille() + '</div>'
    + '<p class="flb3c-fam">' + h.familles.map((a) => '<span class="flb3c-fa" data-famille="' + a.f + '">' + pi(a.f, 14) + '<b style="color:' + T(a.f) + '">' + NOM[a.f] + '</b><span class="num">' + a.n + '/' + a.N + (cat.includes(a) ? ' cat.' : '') + '</span></span>').join('') + '</p>'
    + (h.inconnues.length ? '<p class="flb3c-nd" aria-label="' + h.inconnues.length + ' familles non décrites : ' + h.inconnues.map((f) => NOM[f]).join(', ') + '">' + h.inconnues.map((f) => '<span class="flb3c-q1" data-famille="' + f + '">' + pi(f, 16) + '<i style="color:' + T(f) + '">?</i></span>').join('') + '</p>' : '')
    + gout(h) + '</section>';
}

// Hors de la fiche : la question, les onglets des houblons (le facteur libre de la maquette) et la ligne de contexte.
// Dans l'étape, sous son en-tête intact : la rangée des houblons (le facteur libre de la maquette).
const rangee = (debut) => '<div class="flb3c-tabs" data-libre="houblon" role="group" aria-label="Houblon de la fiche">' + HOUBLONS.map((h) => '<button type="button" data-aller="' + esc(h.nom) + '" data-houblon="' + esc(h.nom) + '" aria-pressed="' + (h.nom === debut) + '">' + esc(h.nom) + '</button>').join('') + '</div>';

const CSS = `
.flb3c .flb-cadre { background:#d9dadd; }
.flb3c-ctx { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--gris); }
.flb3c-ctx [data-contexte] { background:var(--mur); border-radius:11px; padding:1px 8px; color:var(--encre); }
.flb3c-tabs { display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; background:#b6b7ba; padding:8px 14px 22px; }
.flb3c-tabs button { flex:none; height:32px; padding:0 12px; border-radius:16px; font-size:14px; color:var(--encre); background:#fff; border:1px solid #b9bcc4; white-space:nowrap; user-select:none; -webkit-user-select:none; }
.flb3c-tabs button[aria-pressed="true"] { border:2px solid var(--encre); font-weight:700; }
.flb3c-h2 { font-size:17px; font-weight:700; margin-top:2px; }
.flb3c .flb-x { width:44px; height:44px; }
.flb3c .flb-leg { position:static; order:9; flex-basis:100%; width:auto; box-shadow:none; }
.flb3c .flb-lg { display:contents; }
.flb3c-o { flex-wrap:wrap; }
.flb3c-t { display:flex; align-items:center; justify-content:space-between; }
.flb3c-t .flb-nom { font-size:26px; }
.flb3c-a { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.flb3c-a .flb-al-a b { font-size:22px; font-weight:700; }
.flb3c-a .flb-al-l { font-size:14px; }
.flb3c-a .flb-us { margin-left:auto; }
.flb3c-r { display:flex; justify-content:center; margin:-2px 0 -6px; }
.flb3c-q { border-left:5px solid var(--encre); padding:2px 0 2px 12px; }
.flb3c-q p { font-size:29px; line-height:1.08; font-weight:700; letter-spacing:-.01em; }
.flb3c-c { font-size:13px; font-weight:400; color:var(--gris); margin-left:3px; letter-spacing:0; vertical-align:super; }
.flb3c-q cite { display:block; font-style:normal; font-size:14px; color:var(--gris); margin-top:5px; }
.flb3c-p { display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 6px; font-size:17px; }
.flb3c-p .num { font-size:12px; color:var(--gris); margin-right:8px; }
.flb3c-gen { font-weight:400; }
.flb3c .flb-feuille { min-height:calc(100vh - 150px); margin-top:-12px; }
.flb3c-k { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--gris); margin-right:4px; }
.flb3c-o { display:flex; align-items:center; gap:8px; border-top:1px solid var(--trait); padding-top:8px; }
.flb3c-o .flb-seg { margin-left:auto; }
.flb3c-fam { display:flex; flex-wrap:wrap; gap:4px 12px; font-size:13px; }
.flb3c-fa { display:inline-flex; align-items:center; gap:3px; }
.flb3c-fa .num { font-size:11px; color:var(--gris); }
.flb3c-n { font-size:12px; color:var(--gris); }
.flb3c-nd { display:flex; flex-wrap:wrap; gap:4px 10px; }
.flb3c-q1 { display:inline-flex; align-items:center; gap:1px; }
.flb3c-q1 i { font-style:normal; font-size:13px; font-weight:700; color:var(--gris); }
`;

if (process.argv[1] && process.argv[1].endsWith('generer.mjs')) {
  ecrire(ici, page({ id: 'flb3c', nom: 'la signature en une phrase de ses mots, passe 3', css: CSS, debut: 'Nelson Sauvin', feuille, cadre: (s) => fond(92) + rangee('Nelson Sauvin') + s }));
  for (const h of HOUBLONS) { const p = phrase(h); console.log(h.nom.padEnd(14), p.repli ? 'repli' : 'toutes', '·', p.mots.map((c) => c.mot + ' ' + c.n + '/' + c.N).join(', '), '| puis', p.reste.map((c) => c.mot + ' ' + c.n + '/' + c.N).join(', '), '| α', h.alpha.texte, h.alpha.source, 'lot', h.alpha.lotTexte); }
}
