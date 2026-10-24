// flb3 — tiède (signature, puis le reste) : sous le radar, la signature se dit en une phrase faite de ses seuls
// mots, en grand, comme une note de dégustation ; puis ce qu'une fiche ajoute ; puis, en petit, ce que le radar
// dit déjà (les familles). Aucun mot n'est inventé : la phrase est l'assemblage des mots signants de ses fiches.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { page, ecrire, fond, croix, usage, stock, titre, alpha, lentille, legende, gout, selecteur, radar, pi, NOM, T, esc } from '../flb1/socle-flb.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function feuille(h) {
  const signe = h.concepts.filter((c) => c.signe && c.n === Math.max(...h.concepts.filter((x) => x.signe).map((x) => x.n))).slice(0, 3);
  const puis = h.concepts.filter((c) => c.signe && !signe.includes(c)).slice(0, 4);
  const mot = (c, i) => '<span style="color:' + (c.famille ? T(c.famille) : '#16161a') + '">' + esc(i === 0 ? cap(c.mot) : c.mot) + '</span>';
  const tous = signe.every((c) => c.n === c.N);
  const premier = signe.find((c) => c.premier.length);
  const sous = (tous ? (h.N > 1 ? 'ses ' + h.N + ' fiches le disent toutes' : 'sa seule fiche le dit') : signe[0].n + ' fiche' + (signe[0].n > 1 ? 's' : '') + ' sur ' + h.N + ' le disent')
    + (premier ? ' · « ' + premier.mot + ' » d\'abord' + (premier.premier.length > 1 ? ', chez les deux' : '') : '');
  const cat = h.familles.filter((a) => h.concepts.filter((c) => c.famille === a.f).every((c) => c.seulCategorie));
  return '<section class="flb-feuille flb3-f0" role="dialog" aria-label="Fiche de ' + esc(h.nom) + '"><span class="flb-poignee"></span>'
    + '<header class="flb3-t">' + titre(h) + croix(h) + '</header>'
    + '<div class="flb3-a">' + alpha(h, { jauge: false }) + usage(h) + stock(h) + '</div>'
    + selecteur(h.nom, 'trait')
    + '<div class="flb3-r">' + radar(h, { taille: 362, rayon: 82 }) + '</div>'
    + '<blockquote class="flb3-q" data-role="signature"><p>' + signe.map(mot).join(', ') + '.</p><cite>' + esc(sous) + '</cite></blockquote>'
    + (puis.length ? '<p class="flb3-p"><span class="flb3-k">puis</span>' + puis.map((c) => '<b style="color:' + (c.famille ? T(c.famille) : '#16161a') + '">' + esc(c.mot) + '</b><span class="num">' + c.n + '/' + c.N + '</span>').join('') + '</p>' : '')
    + '<div class="flb3-o">' + legende('flb3-' + h.cle, ['La phrase : les mots que ses fiches disent le plus, et que peu de houblons disent ; rien n\'y est ajouté.', '<b>puis</b> : ce qu\'une seule fiche ajoute.', 'En bas, en petit : les familles, ce que le radar dessine déjà.']) + '<span class="flb3-k">le radar dit aussi</span>' + lentille() + '</div>'
    + '<p class="flb3-fam">' + h.familles.map((a) => '<span class="flb3-fa" data-famille="' + a.f + '">' + pi(a.f, 14) + '<b style="color:' + T(a.f) + '">' + NOM[a.f] + '</b><span class="num">' + a.n + '/' + a.N + '</span></span>').join('') + '</p>'
    + (cat.length ? '<p class="flb3-n">' + cat.map((a) => NOM[a.f]).join(' et ') + ' : Hopsteiner le range ainsi, sans mot.</p>' : '')
    + (h.inconnues.length ? '<p class="flb3-n">non décrites : ' + h.inconnues.map((f) => NOM[f]).join(', ') + '</p>' : '')
    + gout(h) + '</section>';
}

const CSS = `
.flb3 .flb-cadre { background:#d9dadd; }
.flb3-t { display:flex; align-items:center; justify-content:space-between; }
.flb3-t .flb-nom { font-size:26px; }
.flb3-a { display:flex; align-items:center; gap:8px; }
.flb3-a .flb-al-a b { font-size:20px; }
.flb3-a .flb-us { margin-left:auto; }
.flb-sel-trait { gap:0; border-bottom:1px solid var(--trait); }
.flb-sel-trait button { background:none; border-radius:0; height:30px; padding:0 8px; font-size:13px; border-bottom:3px solid transparent; }
.flb-sel-trait button[aria-pressed="true"] { background:none; color:var(--encre); border-bottom-color:var(--encre); }
.flb3-r { display:flex; justify-content:center; margin:-2px 0 -6px; }
.flb3-q { border-left:5px solid var(--encre); padding:2px 0 2px 12px; }
.flb3-q p { font-size:29px; line-height:1.08; font-weight:700; letter-spacing:-.01em; }
.flb3-q cite { display:block; font-style:normal; font-size:14px; color:var(--gris); margin-top:5px; }
.flb3-p { display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 6px; font-size:17px; }
.flb3-p .num { font-size:12px; color:var(--gris); margin-right:8px; }
.flb3-k { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--gris); margin-right:4px; }
.flb3-o { display:flex; align-items:center; gap:8px; border-top:1px solid var(--trait); padding-top:8px; }
.flb3-o .flb-seg { margin-left:auto; }
.flb3-fam { display:flex; flex-wrap:wrap; gap:4px 12px; font-size:13px; }
.flb3-fa { display:inline-flex; align-items:center; gap:3px; }
.flb3-fa .num { font-size:11px; color:var(--gris); }
.flb3-n { font-size:12px; color:var(--gris); }
`;

ecrire(ici, page({ id: 'flb3', nom: 'la signature en une phrase de ses mots', css: CSS, debut: 'Nelson Sauvin', feuille, cadre: (s) => fond(58) + s }));
console.log('flb3 écrit');
