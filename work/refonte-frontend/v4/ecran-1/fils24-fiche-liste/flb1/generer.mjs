// flb1 — froide : la fiche g1 telle qu'il l'a choisie, radar d'abord ; sa liste affinée par une seule idée :
// une ligne « signe » en tête, les mots que ses fiches disent toutes et que peu de houblons disent (ses mots hors
// des 12 familles compris), puis les familles de g1 sans redire le radar.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { page, ecrire, fond, croix, usage, stock, titre, alpha, bande, lentille, legende, gout, selecteur, radar, pi, NOM, T, esc } from './socle-flb.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));

function feuille(h) {
  const signe = h.concepts.filter((c) => c.signe).slice(0, 3);
  const reste = h.concepts.filter((c) => !c.signe && !c.famille && !c.seulCategorie);
  const premierTous = (c) => c.premier.length && c.premier.length === c.n;
  const ligneSigne = '<div class="flb1-signe" data-role="signature"><span class="flb1-k">signe</span><span class="flb1-mots">'
    + signe.map((c) => '<span class="flb1-m"><b>' + esc(c.mot) + '</b>' + (c.premier.length ? '<i class="flb1-1">1<sup>er</sup></i>' : '') + '<span class="num flb1-n">' + c.n + '/' + c.N + '</span></span>').join('')
    + '</span></div>';
  const fams = h.familles.slice().sort((a, b) => b.n - a.n).map((a) => {
    const mots = a.mots.filter((m) => m !== NOM[a.f].toLowerCase() && m !== 'agrumes' && m !== 'fruits tropicaux' && m !== 'herbacé');
    const cat = h.concepts.filter((c) => c.famille === a.f).every((c) => c.seulCategorie);
    return '<div class="flb1-f" data-famille="' + a.f + '">' + pi(a.f, 18) + '<b style="color:' + T(a.f) + '">' + NOM[a.f] + '</b><span class="num flb1-n">' + a.n + '/' + a.N + '</span>'
      + '<span class="flb1-fm">' + (cat ? '<em>rangé par Hopsteiner, sans mot</em>' : esc(mots.join(', '))) + '</span></div>';
  }).join('');
  const inconnues = h.inconnues.map((f) => NOM[f]).join(', ');
  const dem = (f) => { const a = h.familles.find((x) => x.f === f); return a ? a.n + '/' + a.N : '?'; };
  return '<section class="flb-feuille flb1-f0" role="dialog" aria-label="Fiche de ' + esc(h.nom) + '"><span class="flb-poignee"></span>'
    + selecteur(h.nom, 'onglets')
    + '<header class="flb1-t">' + titre(h) + croix(h) + '</header>'
    + '<div class="flb1-a">' + alpha(h) + '<span class="flb1-us">' + stock(h) + usage(h) + '</span></div>'
    + '<div class="flb1-r">' + radar(h, { taille: 362 }) + '</div>'
    + '<p class="flb1-dem"><b>+ Floral</b> ' + dem('floral') + '<b>− Résineux</b> ' + dem('resin') + '</p>'
    + '<div class="flb1-bloc">' + bande(h)
    + '<div class="flb1-outils">' + legende('flb1-' + h.cle, ['<b>signe</b> : ce que ses fiches disent et que peu de houblons disent, même hors des 12 familles.', '<b>2/2</b> : 2 fiches sur 2 le citent.', '<b>1<sup>er</sup></b> : le mot que ses fiches nomment en premier.', 'Au style : les secteurs gris clair du radar sont ceux que ta stout attend.']) + lentille() + '</div>'
    + ligneSigne + fams
    + (reste.length ? '<p class="flb1-aussi">aussi : ' + reste.map((c) => esc(c.mot) + ' ' + c.n + '/' + c.N).join(', ') + '</p>' : '')
    + (inconnues ? '<p class="flb1-aussi">' + h.inconnues.length + ' non décrites : ' + inconnues + '</p>' : '')
    + '</div>' + gout(h, 'flb1-pied') + '</section>';
}

const CSS = `
.flb1 .flb-cadre { background:#d9dadd; }
.flb1-t { display:flex; align-items:center; justify-content:space-between; }
.flb1-a { display:flex; align-items:center; justify-content:space-between; gap:6px; }
.flb1-us { display:flex; align-items:center; gap:6px; }
.flb1-r { display:flex; justify-content:center; margin:-6px 0 -10px; }
.flb1-dem { display:flex; justify-content:center; gap:6px; font-size:15px; }
.flb1-dem b + b, .flb1-dem b:nth-of-type(2) { margin-left:14px; }
.flb1-bloc { background:var(--mur); border-radius:8px; padding:10px 12px; display:flex; flex-direction:column; gap:8px; }
.flb1-outils { display:flex; justify-content:space-between; align-items:center; }
.flb1-signe { display:flex; flex-direction:column; gap:4px; background:#fff; border-radius:8px; padding:8px 10px; box-shadow:inset 0 0 0 1.5px var(--encre); }
.flb1-k { font-size:12px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--gris); }
.flb1-mots { display:flex; flex-wrap:wrap; gap:2px 14px; }
.flb1-m { display:inline-flex; align-items:baseline; gap:3px; }
.flb1-m b { font-size:19px; font-weight:700; }
.flb1-1 { font-style:normal; font-size:11px; font-weight:700; background:var(--encre); color:#fff; border-radius:8px; padding:0 4px; line-height:15px; }
.flb1-n { font-size:12px; color:var(--gris); }
.flb1-f { display:grid; grid-template-columns:22px auto auto 1fr; align-items:center; gap:2px 6px; font-size:15px; }
.flb1-f b { font-size:16px; font-weight:700; }
.flb1-fm { grid-column:2 / -1; color:var(--encre); font-size:14px; }
.flb1-fm:empty { display:none; }
.flb1-fm em { color:var(--gris); font-style:normal; }
.flb1-aussi { font-size:13px; color:var(--gris); }
.flb1-pied { margin-top:4px; }
`;

ecrire(ici, page({ id: 'flb1', nom: 'la fiche g1, une ligne « signe » en tête de la liste', css: CSS, debut: 'Nelson Sauvin', feuille, cadre: (s) => fond() + s }));
console.log('flb1 écrit');
