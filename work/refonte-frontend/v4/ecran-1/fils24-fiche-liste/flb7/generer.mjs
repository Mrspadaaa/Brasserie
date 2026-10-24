// flb7 — chaude (forme libre) : la pyramide d'un parfumeur, lue à l'envers du catalogue. Au sommet, sa signature
// (ce que toutes ses fiches disent et que peu de houblons disent) ; au cœur, ce qu'une fiche ajoute ; au fond, ce
// que tout le monde dit (agrumes, fruité, les catégories). Le sélecteur des houblons vit dans un dock en bas.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { page, ecrire, fond, croix, usage, stock, titre, alpha, lentille, legende, gout, selecteur, radar, pi, NOM, T, esc } from '../flb1/socle-flb.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));

function mot(c, grand) {
  return '<span class="flb7-m' + (grand ? ' flb7-g' : '') + '"' + (c.famille ? ' data-famille="' + c.famille + '"' : '') + '>' + (c.famille ? pi(c.famille, grand ? 16 : 13) : '')
    + '<b style="color:' + (c.famille ? T(c.famille) : '#16161a') + '">' + esc(c.mot) + '</b><span class="num">' + (c.seulCategorie ? 'cat.' : c.n + '/' + c.N) + '</span></span>';
}

function feuille(h) {
  const signes = h.concepts.filter((c) => c.signe), max = Math.max(...signes.map((c) => c.n));
  const sommet = signes.filter((c) => c.n === max).slice(0, 3);
  const coeur = signes.filter((c) => !sommet.includes(c));
  const base = h.concepts.filter((c) => !c.signe);
  const etage = (cls, larg, titreE, sous, mots, grand) => '<div class="flb7-e ' + cls + '" style="--l:' + larg + '%"><div class="flb7-in">' + mots.map((c) => mot(c, grand)).join('') + '</div><span class="flb7-lab"><b>' + titreE + '</b>' + sous + '</span></div>';
  return '<section class="flb-feuille flb7-f0" role="dialog" aria-label="Fiche de ' + esc(h.nom) + '"><span class="flb-poignee"></span>'
    + '<header class="flb7-t"><div class="flb7-id">' + titre(h) + alpha(h, { jauge: false }) + '</div><div class="flb7-dr">' + croix(h) + usage(h) + stock(h) + '</div></header>'
    + '<div class="flb7-r">' + radar(h, { taille: 362, rayon: 66, petit: true }) + '</div>'
    + '<div class="flb7-o">' + legende('flb7-' + h.cle, ['Sommet : ce que toutes ses fiches disent, et que peu de houblons disent ; sa signature.', 'Cœur : ce qu\'une partie de ses fiches ajoute.', 'Fond : les mots que beaucoup de houblons partagent, et les catégories de Hopsteiner (cat.).']) + '<span class="flb7-k">de ce qui le signe à ce que tous disent</span>' + lentille() + '</div>'
    + '<div class="flb7-py" data-role="signature">'
    + etage('flb7-s', 64, 'sommet', '', sommet, true)
    + etage('flb7-c', 82, 'cœur', '', coeur.length ? coeur : [], false)
    + etage('flb7-b', 100, 'fond', '', base, false)
    + '</div>'
    + (h.inconnues.length ? '<p class="flb7-nd">' + h.inconnues.length + ' familles non décrites : ' + h.inconnues.map((f) => NOM[f]).join(', ') + '</p>' : '')
    + gout(h) + '</section>';
}

const CSS = `
.flb7 .flb-cadre { background:#d9dadd; padding-bottom:56px; }
.flb7-t { display:flex; justify-content:space-between; gap:8px; }
.flb7-id { display:flex; flex-direction:column; gap:4px; }
.flb7-dr { display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
.flb7-r { display:flex; justify-content:center; margin:-8px 0 -10px; }
.flb7-o { display:flex; align-items:center; gap:8px; }
.flb7-k { flex:1; font-size:12px; color:var(--gris); }
.flb7-py { display:flex; flex-direction:column; align-items:center; gap:4px; }
.flb7-e { width:var(--l); position:relative; min-height:64px; display:flex; }
.flb7-e::before { content:""; position:absolute; inset:0; clip-path:polygon(9% 0, 91% 0, 100% 100%, 0 100%); }
.flb7-s::before { background:var(--encre); clip-path:polygon(18% 0, 82% 0, 100% 100%, 0 100%); }
.flb7-c::before { background:#b9bcc4; }
.flb7-b::before { background:#e3e5ea; }
.flb7-in { position:relative; margin:4px 12%; flex:1; display:flex; flex-wrap:wrap; justify-content:center; align-content:center; gap:3px 6px; background:#fff; border-radius:4px; padding:6px 6px; }
.flb7-s .flb7-in { margin:5px 20%; }
.flb7-e .flb7-in:empty::after { content:"rien de plus"; font-size:12px; color:var(--gris); }
.flb7-lab { position:absolute; left:-2px; top:50%; transform:translate(-100%,-50%); font-size:11px; color:var(--gris); text-transform:uppercase; letter-spacing:.06em; }
.flb7-s .flb7-lab, .flb7-c .flb7-lab { left:-4px; }
.flb7-lab b { font-weight:700; }
.flb7-e.flb7-b .flb7-lab { left:auto; right:6px; top:-9px; transform:none; background:#fff; padding:0 3px; }
.flb7-s .flb7-lab { transform:translate(-100%,-50%); }
.flb7-m { display:inline-flex; align-items:center; gap:3px; white-space:nowrap; }
.flb7-m b { font-size:14px; font-weight:600; }
.flb7-g b { font-size:19px; font-weight:800; }
.flb7-m .num { font-size:11px; color:var(--gris); }
.flb7-nd { font-size:12px; color:var(--gris); }
.flb7-dock { position:fixed; left:0; right:0; bottom:0; z-index:20; max-width:390px; margin:0 auto; background:#fff; border-top:1px solid var(--trait); padding:8px 10px; box-shadow:0 -8px 20px -14px rgba(22,22,26,.5); }
.flb7-dock .flb-sel button { height:30px; border-radius:15px; }
`;

ecrire(ici, page({ id: 'flb7', nom: 'la pyramide : sommet, cœur, fond', css: CSS, debut: 'Nelson Sauvin', feuille,
  cadre: (s) => fond(40) + s + '<div class="flb7-dock">' + selecteur('Nelson Sauvin', 'pastilles') + '</div>' }));
console.log('flb7 écrit');
