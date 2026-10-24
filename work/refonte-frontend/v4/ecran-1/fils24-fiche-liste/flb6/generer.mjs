// flb6 — chaude (forme libre) : la carte d'identité du houblon. La photo, c'est sa silhouette (le radar) ; puis
// les « signes particuliers » (sa signature), ce que ses fiches nomment d'abord, ses thiols, son sosie au catalogue ;
// en bas, la bande lisible à la machine rejoue ses mots. Tout vient des fiches et du catalogue du dépôt.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { page, ecrire, fond, croix, usage, stock, alpha, lentille, legende, gout, selecteur, radar, pi, NOM, T, esc, virg, CATALOGUE } from '../flb1/socle-flb.mjs';
import { THIOLS_FORTE } from '../flb1/donnees-flb.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const PACK = new Set(JSON.parse(fs.readFileSync(path.resolve(ici, '../../../../../../prototypes/houblons-v4/data/pack-fiches.json'), 'utf8')).fichesHoublons.map((h) => h.name));
const sansAcc = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]+/g, '');

function sosie(h) {
  const signe = h.concepts.filter((c) => c.signe).slice(0, 4), compte = new Map();
  for (const c of signe) for (const n of c.autres) compte.set(n, [...(compte.get(n) || []), c.mot]);
  const [nom, mots] = [...compte.entries()].sort((a, b) => b[1].length - a[1].length || PACK.has(b[0]) - PACK.has(a[0]))[0] || [];
  return nom ? { nom, mots } : null;
}

function feuille(h) {
  const signe = h.concepts.filter((c) => c.signe).slice(0, 3);
  const premier = h.concepts.filter((c) => c.premier.length);
  const s = sosie(h);
  const champ = (k, v, cls = '') => '<div class="flb6-ch ' + cls + '"><span class="flb6-k">' + k + '</span><span class="flb6-v">' + v + '</span></div>';
  const mrz = ('HOUBLON<' + sansAcc(h.nom) + '<<' + signe.map((c) => sansAcc(c.mot)).join('<') + '<'.repeat(40)).slice(0, 44);
  const thiol = h.thiol ? 'classe ' + h.thiol + ' · Hopsteiner' + (h.thiol === 'forte' ? ' · ' + THIOLS_FORTE + ' sur ' + CATALOGUE : '') : '? · aucune fiche ne la donne';
  return '<section class="flb-feuille flb6-f0" role="dialog" aria-label="Fiche de ' + esc(h.nom) + '"><span class="flb-poignee"></span>'
    + '<div class="flb6-top">' + selecteur(h.nom, 'pastilles') + croix(h) + '</div>'
    + '<article class="flb6-carte" data-role="signature">'
    + '<header class="flb6-band"><span>HOUBLON · ' + esc(h.origine.toUpperCase()) + '</span><span class="num">' + esc(h.alias || '—') + '</span></header>'
    + '<div class="flb6-id"><div class="flb6-photo">' + radar(h, { taille: 132, rayon: 58, etiquettes: false, demande: false }) + '<span class="flb6-pl">' + h.familles.length + ' familles · ' + h.inconnues.length + ' ?</span></div>'
    + '<div class="flb6-ident"><h2 class="flb6-nom">' + esc(h.nom) + '</h2>' + alpha(h, { cls: 'flb6-al' }) + '<div class="flb6-us">' + usage(h) + stock(h) + '</div></div></div>'
    + champ('Signes particuliers', signe.map((c) => '<b style="color:' + (c.famille ? T(c.famille) : '#16161a') + '">' + esc(c.mot) + '</b><span class="num">' + c.n + '/' + c.N + '</span>').join(''), 'flb6-sp')
    + champ('Nommé d\'abord', premier.map((c) => esc(c.mot) + ' <span class="flb6-g">(' + c.premier.map((p) => p.replace(' (boutique US)', ' boutique')).join(', ') + ')</span>').join(' · ') || '—')
    + '<div class="flb6-2">' + champ('Thiols', esc(thiol)) + champ('Linalol', h.linalol ? virg(h.linalol[0]) + '–' + virg(h.linalol[1]) + ' % de l\'huile' : '?') + '</div>'
    + (s ? champ('Sosie', (PACK.has(s.nom) ? '<span class="flb6-h" data-houblon="' + esc(s.nom) + '">' + esc(s.nom) + '</span>' : esc(s.nom)) + ' <span class="flb6-g">partage ' + s.mots.join(', ') + '</span>') : '')
    + champ('Familles', h.familles.map((a) => '<span class="flb6-fa" data-famille="' + a.f + '">' + pi(a.f, 14) + '<b style="color:' + T(a.f) + '">' + NOM[a.f] + '</b> ' + a.n + '/' + a.N + '</span>').join(''))
    + '<p class="flb6-mrz num" aria-label="ses mots, en bande lisible à la machine">' + esc(mrz) + '</p></article>'
    + '<div class="flb6-o">' + legende('flb6-' + h.cle, ['La photo : sa silhouette par familles ; hachuré : non décrit.', 'Signes particuliers : les mots que ses fiches disent le plus et que peu de houblons disent (2/2 : 2 fiches sur 2).', 'Sosie : le houblon du catalogue qui partage le plus de ces mots.']) + '<span class="flb6-k">au style, la photo montre ce que ta stout attend</span>' + lentille() + '</div>'
    + '<div class="flb6-big">' + radar(h, { taille: 362, rayon: 70, petit: true }) + '</div>'
    + gout(h) + '</section>';
}

const CSS = `
.flb6 .flb-cadre { background:#d9dadd; }
.flb6-top { display:flex; align-items:center; gap:8px; }
.flb6-top .flb-sel { flex:1; }
.flb6-top .flb-sel button { height:26px; font-size:12px; padding:0 8px; }
.flb6-carte { border:2px solid var(--encre); border-radius:8px; overflow:hidden; background:#fbfaf7; display:flex; flex-direction:column; }
.flb6-band { display:flex; justify-content:space-between; background:var(--encre); color:#fff; font-size:12px; font-weight:700; letter-spacing:.08em; padding:5px 10px; }
.flb6-id { display:grid; grid-template-columns:136px 1fr; gap:10px; padding:10px 10px 6px; }
.flb6-photo { border:1.5px solid var(--encre); border-radius:4px; background:#fff; display:flex; flex-direction:column; align-items:center; }
.flb6-pl { font-size:11px; color:var(--gris); padding-bottom:3px; }
.flb6-ident { display:flex; flex-direction:column; gap:6px; justify-content:center; }
.flb6-nom { font-size:25px; font-weight:800; line-height:1; }
.flb6-al .flb-al-a b { font-size:20px; }
.flb6-us { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
.flb6-ch { display:flex; flex-direction:column; gap:1px; padding:5px 10px; border-top:1px dashed #c9cbd1; }
.flb6-k { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--gris); }
.flb6-v { font-size:14px; display:flex; flex-wrap:wrap; align-items:baseline; gap:2px 10px; }
.flb6-sp .flb6-v b { font-size:22px; font-weight:800; line-height:1.1; }
.flb6-sp .flb6-v .num { font-size:12px; color:var(--gris); margin-left:-6px; }
.flb6-g { color:var(--gris); font-size:13px; }
.flb6-2 { display:grid; grid-template-columns:1fr 1fr; }
.flb6-2 .flb6-ch + .flb6-ch { border-left:1px dashed #c9cbd1; }
.flb6-h { font-weight:700; text-decoration:underline dotted; text-underline-offset:3px; user-select:none; -webkit-user-select:none; }
.flb6-fa { display:inline-flex; align-items:center; gap:3px; font-size:13px; }
.flb6-mrz { font-size:12px; letter-spacing:.06em; background:#eceae3; color:var(--encre); padding:5px 10px; white-space:nowrap; overflow:hidden; }
.flb6-o { display:flex; align-items:center; gap:8px; }
.flb6-o .flb6-k { flex:1; text-transform:none; letter-spacing:0; font-weight:400; font-size:12px; }
.flb6-big { display:flex; justify-content:center; }
`;

ecrire(ici, page({ id: 'flb6', nom: 'la carte d\'identité du houblon', css: CSS, debut: 'Nelson Sauvin', feuille, cadre: (s) => fond(40) + s,
  fiches: [...PACK] }));
console.log('flb6 écrit');
