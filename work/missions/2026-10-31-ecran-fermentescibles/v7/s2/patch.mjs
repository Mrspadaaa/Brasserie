// p7-s2 (D220 : « Dans la liste ? » ; D221 : « l'ouverture de la recherche avec les stocks ») : la recherche dans le ticket. Le champ
// touché, le stock de la famille s'ouvre en lignes fantômes, à la place où la ligne viendra (après la dernière), épinglés en tête, trois
// au plus et le compte des autres. En tapant, les fantômes suivent la frappe. Une ligne fantôme est à peine marquée (trait tireté, nom
// gris, lettres tapées en noir) ; sous le nom, ce que l'app écrit : « 12,5 kg en stock » ou « stock épuisé », l'EBC, le fournisseur.
// Un toucher en fait une vraie ligne. Un nom déjà dans la recette éclaire sa ligne existante (« déjà 5,0 kg » à la place de sa part)
// au lieu d'en proposer une seconde. « Créer « … » (stock à zéro) » est la dernière ligne fantôme. Le champ suit la liste
// (la compenser cachait les premières lignes sous l'en-tête). ↓ ↑ changent la ligne qu'Entrée prendra. Au repos, rien ne change.
// Usage : node patch.mjs (écrit etat.html depuis v6/p6-b2/etat.html).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lireBase, socle, remplacer, fonction, ecrire, ENTREE_AV, INPUT_AV, CSS_COMMUN } from '../s1/commun-p7.mjs';
const ICI = path.dirname(fileURLToPath(import.meta.url));
let src = socle(lireBase(), 'p7-s2 — Malts/sucres 2/7 · la recherche dans la liste (D220, D221, 31.10)', 'p7-s2');

const LISTE = `
// p7-s2 : ce que la recherche propose, dans l'ordre. Ouverture : trois articles du stock (épinglés en tête, hors recette). Frappe :
// les lignes déjà là, et trois articles du stock au plus ; rien trouvé : « Créer ».
var CHOIX=0,ENT7='<i class="p7s2-ent" aria-hidden="true">'+IC.ent+'</i>';
function liste7(){var s=lire(),t=s.nom;if(!t)return OUVERT?ouverture(true).slice(0,3).map(function(n){return {nom:n,deja:-1}}):[];var A=[],n=0;
  chercher(t).forEach(function(o){if(o.deja>=0)A.push(o);else if(n<3){A.push(o);n++;}});
  if(t.length>=2&&!A.length)A.push({creer:true,nom:s.nom});return A;}
function choix7(A){return lire().nom.length>=2&&A.length?Math.min(CHOIX,A.length-1):-1;}
function dejaTag(f,i,pr){return '<button class="p7s2-deja'+(pr?' p7s2-prem':'')+'" data-p7garde data-role="resultat" data-nom="'+f.nom+'" data-deja="'+i+'" aria-label="'+f.nom+' : déjà '+kgTxt(f.kg)+' kg, sa masse">déjà '+kgTxt(f.kg)+' kg'+(pr?ENT7:'')+'</button>';}
function detail7(n){var d=detailTxt(n),s=stockTxt(n);return (epuise(n)?'<span class="p7s2-vide">'+s+'</span>':s)+d.slice(s.length);}
function fantomes(A,c){var s=lire(),t=s.nom,h=A.map(function(o,k){if(o.deja>=0)return '';var pr=k===c;
  if(o.creer)return '<li class="p7s2-fa p7s2-cr'+(pr?' p7s2-prem':'')+'" data-p7garde><button class="p7s2-fb" data-role="creer" data-cree="1"><span class="p7s2-plus" aria-hidden="true">'+IC.plus+'</span><span class="p7s2-nm">Créer « '+s.nom+' » <small>(stock à zéro)</small></span><span class="p7s2-dr">'+(pr?ENT7:'')+'</span><span class="p7s2-l2">'+FAM[st.fam].l.toLowerCase()+' : '+QUAND[FAM[st.fam].m]+'</span></button></li>';
  return '<li class="p7s2-fa'+(pr?' p7s2-prem':'')+'" data-p7garde><button class="p7s2-fb" data-role="resultat" data-nom="'+o.nom+'" aria-label="Ajouter '+o.nom+' : '+detailTxt(o.nom)+'">'+sacDe(o.nom)+'<span class="p7s2-nm">'+(epingle(o.nom)?ETOILE:'')+'<span class="p7s2-tx">'+marque(o.nom,t)+'</span></span><span class="p7s2-dr">'+(pr?ENT7:IC.plus)+'</span><span class="p7s2-l2">'+detail7(o.nom)+'</span></button></li>';}).join('');
  if(!t&&OUVERT){var reste=ouverture(true).length-3;if(reste>0)h+='<li class="p7s2-reste" aria-hidden="true">+ '+reste+' au stock · tape pour affiner</li>';}
  return h;}
// La frappe : le ticket se refait avec ses lignes fantômes ; le champ descend d'autant (une page qui défilerait cacherait les premières lignes sous l'en-tête).
function recherche(){var c=q('.r4b-champ'),y0=c.getBoundingClientRect().top,ac=document.activeElement;if(ac&&ac.dataset&&ac.dataset.role==='ajout'){ticket();puces();}else rendre();}`;
src = remplacer(src, "function candidats(t){", LISTE.trim() + "\nfunction candidats(t){", 'liste');
src = remplacer(src, "function ticket(neuf){\n  var li=st.r.map(function(f,i){",
  "function ticket(neuf){\n  var A7=liste7(),c7=choix7(A7),DJ={};A7.forEach(function(o,k){if(o.deja>=0)DJ[o.deja]=k===c7;});\n  var li=st.r.map(function(f,i){", 'ticket');
src = remplacer(src, "return '<li class=\"r4b-li'+(neuf===i?' r4b-neuf':'')", "return '<li class=\"r4b-li'+(neuf===i?' r4b-neuf':'')+(i in DJ?' p7s2-ec':'')", 'éclairée');
src = remplacer(src, "'<span class=\"r4c-l2\">'+moHtml(f,i)+pcHtml(f,i)+", "'<span class=\"r4c-l2\">'+moHtml(f,i)+(i in DJ?dejaTag(f,i,DJ[i]):pcHtml(f,i))+", 'part');
src = remplacer(src, "q('[data-role=\"ticket\"]').innerHTML=li.length?li.join(''):'<li class=\"r4b-vide\">Rien encore.</li>';",
  "var fa=fantomes(A7,c7);q('[data-role=\"ticket\"]').innerHTML=li.length||fa?li.join('')+fa:'<li class=\"r4b-vide\">Rien encore.</li>';", 'fantômes');

const PUCES = `function puces(){
  var s=lire(),t=s.nom;document.body.classList.toggle('p7s2-on',!!t||OUVERT);
  q('[data-role="puces"]').innerHTML=t||OUVERT?'':habituels().slice(0,5).map(function(n){return '<button class="r4b-pu" data-pu="'+n+'">'+sacDe(n)+n+'</button>'}).join('');
  var A=liste7(),c=choix7(A),o=c>=0?A[c]:null,ap=q('[data-role="apercu"]'),nom=o?o.nom:'';
  ap.classList.toggle('r4b-vu',!!nom);ap.innerHTML=nom?(o.creer?IC.plus:'')+nom.split(' ')[0]+(s.kg!=null?' <b>'+kgTxt(s.kg)+'</b> kg':'')+IC.ent:'';
}`;
src = fonction(src, 'function puces(){', "+IC.ent:'';\n}", PUCES, 'puces');
src = remplacer(src, ENTREE_AV,
  "if(e.key==='Enter'){e.preventDefault();var s=lire();if(!s.nom)return;var A=liste7(),o=A[choix7(A)];ajouter(o&&!o.creer?o.nom:s.nom,s.kg);}\n" +
  "    else if(e.key==='ArrowDown'||e.key==='ArrowUp'){var A2=liste7();if(A2.length>1&&lire().nom.length>=2){e.preventDefault();CHOIX=(Math.min(CHOIX,A2.length-1)+(e.key==='ArrowDown'?1:-1)+A2.length)%A2.length;recherche();}}\n" +
  "    else if(e.key==='Escape'){if(t.value)t.value='';else OUVERT=false;CHOIX=0;recherche();}", 'entrée');
src = remplacer(src, INPUT_AV, "if(t.dataset.role==='ajout'){CHOIX=0;recherche();}", 'frappe');
src = remplacer(src, "  else if(b.dataset.deja!=null){ajouter(st.r[+b.dataset.deja].nom,lire().kg);}",
  "  else if(b.dataset.deja!=null){ajouter(st.r[+b.dataset.deja].nom,lire().kg);}\n  else if(b.dataset.role==='resultat'&&b.dataset.nom){ajouter(b.dataset.nom,lire().kg);}", 'toucher');
const CSS = `/* p7-s2 (D220, D221) : les lignes fantômes du ticket. Même grille qu'une ligne ; trait tireté, nom gris. */
${CSS_COMMUN}.p7s2-on .r4b-puces{display:none}
.p7s2-fa{list-style:none;margin-top:2px}
.p7s2-fb{width:100%;display:grid;grid-template-columns:24px 1fr 28px;grid-template-rows:auto auto;column-gap:8px;align-items:center;min-height:44px;padding:3px 6px 3px 8px;border:1.5px dashed var(--bordm);border-radius:10px;text-align:left;cursor:pointer}
.p7s2-fb>.r4b-sac,.p7s2-plus{grid-row:1/3;justify-self:center}
.p7s2-plus{display:flex;align-items:center;justify-content:center;width:24px;height:24px;color:var(--t2)}
.p7s2-nm{grid-column:2;display:flex;align-items:center;gap:4px;min-width:0;font-size:16px;font-weight:600;color:var(--t2);white-space:nowrap;overflow:hidden;line-height:20px}
.p7s2-tx{overflow:hidden;text-overflow:ellipsis}
.p7s2-nm b{font-weight:600;color:var(--t0)}
.p7s2-nm small{font-size:12px;font-weight:400;color:var(--t2)}
.p7s2-l2{grid-column:2;font-size:12px;color:var(--t2);line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.p7s2-vide{color:var(--attt);font-weight:600}
.p7s2-dr{grid-row:1/3;grid-column:3;display:flex;align-items:center;justify-content:center;width:28px;height:28px;color:var(--t2)}
.p7s2-fb:active{background:var(--panel)}
.p7s2-prem .p7s2-fb{border-color:var(--t0)}
.p7s2-cr .p7s2-nm{color:var(--t1)}
.p7s2-reste{list-style:none;padding:4px 8px 0 40px;font-size:12px;color:var(--t2)}
.p7s2-ent{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;border:1.5px solid var(--t0);color:var(--t0);flex-shrink:0}
/* La ligne déjà là s'éclaire : fond de grain, trait d'or ; « déjà 5,0 kg » à la place de sa part. */
.r4b-li.p7s2-ec{background:#FCF1D8;box-shadow:inset 0 0 0 2px var(--or)}
.p7s2-deja{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;height:24px;padding:0 2px 0 8px;border-radius:8px;background:#fff;border:1px solid var(--att);font-family:var(--mono);font-size:12px;font-weight:600;color:var(--attt);white-space:nowrap}
.p7s2-deja:not(.p7s2-prem){padding-right:8px}
.p7s2-deja .p7s2-ent{width:20px;height:20px;border-color:var(--attt);color:var(--attt)}
</style></head>`;
src = remplacer(src, '</style></head>', CSS, 'style');
ecrire(path.join(ICI, 'etat.html'), src);
