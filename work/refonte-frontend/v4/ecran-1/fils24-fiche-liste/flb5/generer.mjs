// flb5 — tiède (signature, puis le reste) : la signature se prouve par contraste. Ses mots en lignes, lui et ses
// quatre remplaçants calculés (substitution v1 du dépôt) en colonnes : ce que lui seul dit saute aux yeux
// (Nelson Sauvin : vin blanc, raisin, groseille ; aucun de Boomerang, Herkules, Phoenix, Pacific Jade).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { page, ecrire, fond, croix, usage, stock, titre, alpha, lentille, legende, gout, selecteur, radar, pi, NOM, T, esc } from '../flb1/socle-flb.mjs';
import { motsDe } from '../flb1/donnees-flb.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));

function feuille(h) {
  const rem = h.remplacants.map((r) => ({ ...r, mots: new Set(motsDe(r.nom)) }));
  const lignes = [...h.concepts.filter((c) => !c.seulCategorie).slice(0, 7), ...h.concepts.filter((c) => c.seulCategorie)];
  const seul = lignes.filter((c) => c.signe && rem.every((r) => !r.mots.has(c.mot)));
  const ent = '<div class="flb5-ent"><span class="flb5-c0">ses mots</span><span class="flb5-lui">' + esc(h.nom.split(' ')[0]) + '</span>'
    + rem.map((r) => '<span class="flb5-rn"><i>' + esc(r.nom) + '</i><b class="num">' + r.score + '</b></span>').join('') + '</div>';
  const corps = lignes.map((c) => '<div class="flb5-l' + (seul.includes(c) ? ' flb5-seul' : '') + '"' + (c.famille ? ' data-famille="' + c.famille + '"' : '') + '><span class="flb5-c0">'
    + (c.famille ? pi(c.famille, 14) : '<i class="flb5-hf" aria-label="hors des 12 familles"></i>') + '<b style="color:' + (c.famille ? T(c.famille) : '#16161a') + '">' + esc(c.mot) + '</b></span>'
    + '<span class="flb5-lui">' + (c.seulCategorie ? '<i class="flb5-v flb5-vc"></i>' : '<i class="flb5-d flb5-d' + (c.n === c.N ? '2' : '1') + '"></i>') + '<span class="num">' + (c.seulCategorie ? 'cat.' : c.n + '/' + c.N) + '</span></span>'
    + rem.map((r) => '<span class="flb5-rc">' + (r.mots.has(c.mot) ? '<i class="flb5-d flb5-dr"></i>' : '<i class="flb5-v"></i>') + '</span>').join('') + '</div>').join('');
  const titreSeul = seul.length ? 'Lui seul dit <b>' + seul.map((c) => esc(c.mot)).join(', ') + '</b>' : 'Ses remplaçants disent aussi ses mots';
  return '<section class="flb-feuille flb5-f0" role="dialog" aria-label="Fiche de ' + esc(h.nom) + '"><span class="flb-poignee"></span>'
    + selecteur(h.nom, 'onglets')
    + '<header class="flb5-t">' + titre(h) + croix(h) + '</header>'
    + '<div class="flb5-a">' + alpha(h) + '<span>' + usage(h) + stock(h) + '</span></div>'
    + '<div class="flb5-r">' + radar(h, { taille: 362, rayon: 76, petit: true }) + '</div>'
    + '<div class="flb5-m"><p class="flb5-q">' + titreSeul + '</p><p class="flb5-s">face à ses 4 remplaçants calculés (score)</p>' + ent + corps + '</div>'
    + '<div class="flb5-o">' + legende('flb5-' + h.cle, ['Lignes : ses mots, traduits. Colonnes : lui, puis ses 4 remplaçants calculés par la substitution du prototype (score sur 100).', '● plein : toutes ses fiches le disent ; ● petit : une partie ; ○ : le remplaçant ne le dit pas ; cat. : Hopsteiner le range dans la famille sans le dire.', 'Ligne noire : un mot de sa signature qu\'aucun remplaçant ne dit.']) + '<span class="flb5-fam">' + h.familles.map((a) => '<span data-famille="' + a.f + '">' + pi(a.f, 14) + '<b style="color:' + T(a.f) + '">' + NOM[a.f] + '</b> ' + a.n + '/' + a.N + '</span>').join('') + '</span>' + lentille() + '</div>'
    + gout(h) + '</section>';
}

const CSS = `
.flb5 .flb-cadre { background:#d9dadd; }
.flb5-t { display:flex; align-items:center; justify-content:space-between; }
.flb5-a { display:flex; align-items:center; justify-content:space-between; }
.flb5-a > span { display:flex; align-items:center; gap:6px; }
.flb5-r { display:flex; justify-content:center; margin:-6px 0 -10px; }
.flb5-m { border-radius:8px; overflow:hidden; border:1.5px solid var(--encre); }
.flb5-q { background:var(--encre); color:#fff; font-size:17px; padding:7px 10px 2px; }
.flb5-s { background:var(--encre); color:#d9dadd; font-size:12px; padding:0 10px 7px; }
.flb5-ent, .flb5-l { display:grid; grid-template-columns:1fr 54px repeat(4, 44px); align-items:center; }
.flb5-ent { font-size:11px; color:var(--gris); padding:6px 4px 4px 10px; border-bottom:1px solid var(--trait); align-items:end; }
.flb5-ent .flb5-lui { font-weight:700; color:var(--encre); font-size:12px; text-align:center; }
.flb5-rn { display:flex; flex-direction:column; align-items:center; gap:1px; }
.flb5-rn i { font-style:normal; font-size:12px; writing-mode:vertical-rl; transform:rotate(180deg); white-space:nowrap; color:var(--encre); max-height:84px; }
.flb5-rn b { font-size:11px; font-weight:400; color:var(--gris); }
.flb5-l { min-height:30px; padding:0 4px 0 10px; border-bottom:1px solid #eceef2; }
.flb5-l:last-child { border-bottom:0; }
.flb5-c0 { display:flex; align-items:center; gap:5px; min-width:0; }
.flb5-c0 b { font-size:15px; font-weight:600; line-height:1.05; }
.flb5-seul { background:#fff; box-shadow:inset 4px 0 0 var(--encre); }
.flb5-seul .flb5-c0 b { font-weight:800; font-size:16px; }
.flb5-hf { width:10px; height:10px; border:2px solid var(--encre); transform:rotate(45deg); display:block; margin:0 2px; flex:none; }
.flb5-lui { display:flex; align-items:center; justify-content:center; gap:3px; background:#f4f4f6; align-self:stretch; }
.flb5-lui .num { font-size:10px; color:var(--gris); }
.flb5-rc { display:flex; justify-content:center; }
.flb5-d { display:block; border-radius:50%; background:var(--encre); }
.flb5-d2 { width:14px; height:14px; } .flb5-d1 { width:9px; height:9px; }
.flb5-dr { width:12px; height:12px; background:#6b6f79; }
.flb5-vc { border-style:dashed; border-color:#55555f; }
.flb5-v { display:block; width:10px; height:10px; border-radius:50%; border:1.5px solid #c9cbd1; }
.flb5-o { display:flex; align-items:center; gap:8px; }
.flb5-fam { display:flex; flex-wrap:wrap; gap:2px 10px; font-size:12px; flex:1; }
.flb5-fam span { display:inline-flex; align-items:center; gap:3px; }
`;

ecrire(ici, page({ id: 'flb5', nom: 'lui seul, face à ses remplaçants', css: CSS, debut: 'Nelson Sauvin', feuille, cadre: (s) => fond(48) + s }));
console.log('flb5 écrit');
