// flb2 — froide : la fiche g1, radar d'abord ; sa liste ne range plus par famille mais par mot, du plus signant
// au plus commun : chaque mot porte ses fiches (2/2) et chez combien des 318 houblons du catalogue il revient.
// Les mots communs (agrumes, épicé, fruité) tombent en bas, en petit : ce qui fait le houblon remonte.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { page, ecrire, fond, croix, usage, stock, titre, alpha, bande, lentille, legende, gout, selecteur, radar, pi, NOM, T, B, esc, CATALOGUE } from '../flb1/socle-flb.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const echelle = (n) => Math.max(4, Math.round((1 - Math.log(n) / Math.log(CATALOGUE)) * 100)); // 1 houblon → 100 %, 318 → 4 %

function ligne(c) {
  const coul = c.famille ? T(c.famille) : '#16161a';
  return '<div class="flb2-l' + (c.signe ? ' flb2-s' : '') + '"' + (c.famille ? ' data-famille="' + c.famille + '"' : '') + '>'
    + (c.famille ? pi(c.famille, 16) : '<i class="flb2-hf" aria-label="hors des 12 familles"></i>')
    + '<b style="color:' + coul + '">' + esc(c.mot) + '</b>'
    + '<span class="num flb2-n">' + (c.seulCategorie ? 'cat.' : c.n + '/' + c.N) + '</span>'
    + '<span class="flb2-r" aria-label="chez ' + c.chez + ' houblons sur ' + CATALOGUE + '"><i style="width:' + echelle(c.chez) + '%;background:' + (c.signe ? '#16161a' : '#b9bcc4') + '"></i></span>'
    + '<span class="num flb2-c">' + c.chez + '</span></div>';
}

function feuille(h) {
  const signants = h.concepts.filter((c) => c.signe);
  const communs = h.concepts.filter((c) => !c.signe);
  const dem = (f) => { const a = h.familles.find((x) => x.f === f); return a ? a.n + '/' + a.N : '?'; };
  return '<section class="flb-feuille flb2-f0" role="dialog" aria-label="Fiche de ' + esc(h.nom) + '"><span class="flb-poignee"></span>'
    + '<header class="flb2-t">' + titre(h) + croix(h) + '</header>'
    + '<div class="flb2-a">' + alpha(h) + usage(h) + stock(h) + '</div>' + selecteur(h.nom, 'pastilles')
    + '<div class="flb2-r0">' + radar(h, { taille: 362, rayon: 88 }) + '</div>'
    + '<p class="flb2-dem"><b>+ Floral</b> ' + dem('floral') + ' <b>− Résineux</b> ' + dem('resin') + '</p>'
    + '<div class="flb2-bloc">' + bande(h) + '<div class="flb2-o">' + legende('flb2-' + h.cle, ['Chaque mot de ses fiches, traduit, du plus rare au plus commun.', '<b>2/2</b> : fiches qui le citent ; <b>cat.</b> : Hopsteiner le range dans cette famille sans le décrire.', 'La barre et le nombre : chez combien des 318 houblons du catalogue ce mot revient. Longue barre : rare.', '◇ : un mot hors des 12 familles, que le radar ne dessine pas.']) + lentille() + '</div>'
    + '<div class="flb2-tete"><span>du plus rare au plus commun</span><span>fiches · chez /' + CATALOGUE + '</span></div>'
    + signants.map(ligne).join('')
    + '<div class="flb2-com">' + communs.map(ligne).join('') + '</div>'
    + (h.inconnues.length ? '<p class="flb2-nd">' + h.inconnues.length + ' non décrites : ' + h.inconnues.map((f) => NOM[f]).join(', ') + '</p>' : '')
    + '</div>' + gout(h) + '</section>';
}

const CSS = `
.flb2 .flb-cadre { background:#d9dadd; }
.flb2-t { display:flex; align-items:center; justify-content:space-between; }
.flb2-a { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.flb2-a .flb-us { margin-left:auto; }
.flb2-r0 { display:flex; justify-content:center; }
.flb2-dem { text-align:center; font-size:14px; margin-top:-4px; }
.flb2-dem b + b { margin-left:12px; }
.flb2-bloc { background:var(--mur); border-radius:8px; padding:10px 12px; display:flex; flex-direction:column; gap:5px; }
.flb2-tete { display:flex; justify-content:space-between; align-items:center; font-size:12px; color:var(--gris); padding-top:2px; }
.flb2-l { display:grid; grid-template-columns:18px 1fr 34px 52px 28px; align-items:center; gap:6px; min-height:24px; }
.flb2-l b { font-size:15px; font-weight:600; }
.flb2-s b { font-size:17px; font-weight:700; }
.flb2-hf { width:12px; height:12px; border:2px solid var(--encre); transform:rotate(45deg); display:block; margin-left:2px; }
.flb2-n { font-size:12px; color:var(--gris); text-align:right; }
.flb2-r { height:6px; background:#e3e5ea; border-radius:2px; position:relative; overflow:hidden; display:block; }
.flb2-r i { position:absolute; left:0; top:0; bottom:0; display:block; border-radius:2px; }
.flb2-c { font-size:12px; text-align:right; color:var(--gris); }
.flb2-com { border-top:1px dashed #c9cbd1; padding-top:4px; display:flex; flex-direction:column; gap:2px; }
.flb2-com b { font-size:13px; font-weight:400; }
.flb2-com .flb2-l { min-height:20px; }
.flb2-o { display:flex; justify-content:space-between; align-items:center; }
.flb2-nd { font-size:12px; color:var(--gris); }
.flb2 .flb-sel { margin-top:2px; }
`;

ecrire(ici, page({ id: 'flb2', nom: 'la fiche g1, ses mots rangés du plus rare au plus commun', css: CSS, debut: 'Nelson Sauvin', feuille,
  cadre: (s) => fond(92) + s }));
console.log('flb2 écrit');
