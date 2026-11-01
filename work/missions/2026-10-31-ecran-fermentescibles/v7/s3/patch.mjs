// p7-s3 (D220, D221 : « Celles de la vrai app était pas trop mal ») : le menu ancré, d'abord la liste de l'app telle quelle
// (src/ui/Combobox.tsx, IngredientPicker.tsx) : le champ touché (ou « Ouvrir la liste ») ouvre tout le stock de la famille, épinglés en
// tête (étoile) ; une rangée par article, le nom, puis « 12,5 kg en stock » ou « stock épuisé » · EBC · fournisseur ; en tapant, la
// pertinence prime, sans accents, une faute tolérée ; « N résultats · précise le nom pour affiner » au-delà ; « Créer « … » (stock à
// zéro) » en dernier, sous un trait ; la liste remonte au-dessus du clavier quand il occupe le bas, et sa hauteur tient dans ce qui se
// voit ; ↓ ↑ et Entrée. Puis enrichie : le sac à la teinte du malt, les lettres tapées en gras, « déjà 5,0 kg » sur ce qui est déjà
// dans la recette (Entrée y mène, aucune ligne de plus), la touche Entrée dessinée sur la rangée active, l'aperçu dans le champ.
// Usage : node patch.mjs (écrit etat.html depuis v6/p6-b2/etat.html).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lireBase, socle, remplacer, fonction, ecrire, ENTREE_AV, INPUT_AV, CSS_COMMUN } from '../s1/commun-p7.mjs';
const ICI = path.dirname(fileURLToPath(import.meta.url));
let src = socle(lireBase(), 'p7-s3 — Malts/sucres 2/7 · la recherche en menu ancré (D220, D221, 31.10)', 'p7-s3');

const LISTE = `
// p7-s3 : les rangées du menu. Ouverture : tout le stock de la famille, épinglés en tête (l'app). Frappe : la pertinence prime, six au
// plus ; rien trouvé : « Créer ».
var CHOIX=0,MAX7=6,ENT7='<i class="p7s3-ent" aria-hidden="true">'+IC.ent+'</i>';
function tous7(){var s=lire(),t=s.nom;if(!t){if(!OUVERT)return [];return ouverture(false).map(function(n){var i=st.r.findIndex(function(f){return f.fam===st.fam&&f.nom===n});return {nom:n,deja:i}});}return chercher(t);}
function liste7(){var s=lire(),A=tous7().slice(0,lire().nom?MAX7:99);if(s.nom.length>=2&&!A.length)A.push({creer:true,nom:s.nom});return A;}
function choix7(A){return lire().nom.length>=2&&A.length?Math.min(CHOIX,A.length-1):-1;}
function rangee(o,k,c,t){var act=k===c,cl='p7s3-ro'+(act?' p7s3-act':''),id=' id="p7s3-o'+k+'" role="option" aria-selected="'+act+'"';
  if(o.creer)return '<button class="'+cl+' p7s3-cr"'+id+' data-role="creer" data-cree="1">'+IC.plus+'<span class="p7s3-tx"><span class="p7s3-l1">Créer « '+o.nom+' » (stock à zéro)</span><span class="p7s3-l2">'+FAM[st.fam].l.toLowerCase()+' : '+QUAND[FAM[st.fam].m]+'</span></span>'+(act?ENT7:'')+'</button>';
  var f=o.deja>=0?st.r[o.deja]:null,d=detailTxt(o.nom),s=stockTxt(o.nom),l2=(epuise(o.nom)?'<span class="p7s3-vide">'+s+'</span>':s)+d.slice(s.length);
  return '<button class="'+cl+'"'+id+' data-role="resultat" data-nom="'+o.nom+'"'+(f?' data-deja="'+o.deja+'"':'')+' aria-label="'+(f?o.nom+' : déjà '+kgTxt(f.kg)+' kg dans la recette, ':'Ajouter '+o.nom+' : ')+d+'">'+
    '<span class="p7s3-et">'+(epingle(o.nom)?ETOILE:'')+'</span>'+sacDe(o.nom)+'<span class="p7s3-tx"><span class="p7s3-l1"><span>'+marque(o.nom,t)+'</span>'+(f?'<span class="p7s3-deja">déjà '+kgTxt(f.kg)+' kg</span>':'')+'</span><span class="p7s3-l2">'+l2+'</span></span>'+
    (act?ENT7:'')+'</button>';}
// La place du menu : dessous, au-dessus du clavier (300 px du bas au doigt ; le vrai clavier, s'il réduit la vue), sa hauteur plafonnée
// à cet espace et le reste qui défile dedans ; les lignes du ticket restent visibles (D212). Au-dessus seulement s'il ne reste pas une
// rangée dessous (critique v6).
function placer7(m){var c=q('.r4b-champ').getBoundingClientRect(),aj=q('.r4b-aj').getBoundingClientRect(),hd=q('.r4b-hd').getBoundingClientRect().bottom;
  var vv=window.visualViewport,doigt=matchMedia('(pointer:coarse)').matches,bas=vv&&vv.height<innerHeight-100?vv.offsetTop+vv.height:innerHeight-(doigt?300:0);
  var dessous=bas-c.bottom-8,dessus=c.top-hd-8,haut=dessous<54&&dessus>dessous;
  m.classList.toggle('p7s3-haut',haut);m.style.maxHeight=Math.max(54,haut?dessus:dessous)+'px';
  if(haut){m.style.top='';m.style.bottom=(aj.bottom-c.top+4)+'px';}else{m.style.bottom='';m.style.top=(c.bottom-aj.top+4)+'px';}}
function recherche(){var s=lire(),t=s.nom,m=q('[data-role="menu"]'),aj=q('[data-role="ajout"]'),A=liste7(),c=choix7(A),tous=tous7(),h='';
  document.body.classList.toggle('p7s3-on',OUVERT||!!t);
  var on=(OUVERT||!!t)&&(A.length||t);
  if(on){if(t&&tous.length>A.length)h+='<p class="p7s3-n">'+tous.length+' résultats · précise le nom pour affiner</p>';
    h+=A.map(function(o,k){return rangee(o,k,c,t)}).join('');
    if(!A.length)h+='<p class="p7s3-n">Rien ne correspond à « '+t+' »</p>';}
  m.innerHTML=h;m.hidden=!on;aj.setAttribute('aria-expanded',on?'true':'false');
  if(c>=0)aj.setAttribute('aria-activedescendant','p7s3-o'+c);else aj.removeAttribute('aria-activedescendant');
  var ou=q('[data-role="ouvrir"]');ou.setAttribute('aria-expanded',on?'true':'false');ou.setAttribute('aria-label',on?'Fermer la liste':'Ouvrir la liste');ou.classList.toggle('p7s3-ouvert',!!on);
  puces();if(on){placer7(m);var a=m.querySelector('.p7s3-act');if(a)a.scrollIntoView({block:'nearest'});}}`;
src = remplacer(src, "function candidats(t){", LISTE.trim() + "\nfunction candidats(t){", 'liste');
const PUCES = `function puces(){
  var s=lire(),t=s.nom,on=OUVERT||!!t,pu=q('[data-role="puces"]'),hab=habituels();
  // Ouvert, les sacs habituels se replient (pas de pavé vide sous le champ) ; le menu passe sur ce qui suit.
  pu.innerHTML=on?'':hab.slice(0,5).map(function(n){return '<button class="r4b-pu" data-pu="'+n+'">'+sacDe(n)+n+'</button>'}).join('');
  var A=liste7(),c=choix7(A),o=c>=0?A[c]:null,ap=q('[data-role="apercu"]'),nom=o?o.nom:'';
  ap.classList.toggle('r4b-vu',!!nom);ap.innerHTML=nom?(o.creer?IC.plus:'')+nom.split(' ')[0]+(s.kg!=null?' <b>'+kgTxt(s.kg)+'</b> kg':'')+IC.ent:'';
}`;
src = fonction(src, 'function puces(){', "+IC.ent:'';\n}", PUCES, 'puces');
// Le menu, collé au champ ; « Ouvrir la liste » au bout du champ (l'app).
src = remplacer(src, '<span class="r4b-ap" data-role="apercu" aria-live="polite"></span></label>',
  '<span class="r4b-ap" data-role="apercu" aria-live="polite"></span><button class="p7s3-ouv" data-role="ouvrir" aria-label="Ouvrir la liste" aria-expanded="false" aria-controls="p7s3-liste" data-p7garde><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button></label>', 'ouvrir');
src = remplacer(src, '<div class="r4b-puces" data-role="puces" data-booster="sacs-habituels"></div>',
  '<div class="r4b-puces" data-role="puces" data-booster="sacs-habituels"></div>\n    <div class="p7s3-menu" data-role="menu" id="p7s3-liste" role="listbox" aria-label="Stock" data-p7garde hidden></div>', 'menu');
src = remplacer(src, 'aria-label="Nom du malt ou du sucre à ajouter, et sa masse si tu veux">',
  'aria-label="Nom du malt ou du sucre à ajouter, et sa masse si tu veux" role="combobox" aria-autocomplete="list" aria-controls="p7s3-liste" aria-expanded="false">', 'combobox');
src = remplacer(src, ENTREE_AV,
  "if(e.key==='Enter'){e.preventDefault();var s=lire();if(!s.nom)return;var A=liste7(),o=A[choix7(A)];ajouter(o&&!o.creer?o.nom:s.nom,s.kg);}\n" +
  "    else if(e.key==='ArrowDown'||e.key==='ArrowUp'){var A2=liste7();if(A2.length>1&&lire().nom.length>=2){e.preventDefault();CHOIX=(Math.min(CHOIX,A2.length-1)+(e.key==='ArrowDown'?1:-1)+A2.length)%A2.length;recherche();}}\n" +
  "    else if(e.key==='Escape'){if(t.value)t.value='';else OUVERT=false;CHOIX=0;recherche();}", 'entrée');
src = remplacer(src, INPUT_AV, "if(t.dataset.role==='ajout'){CHOIX=0;recherche();}", 'frappe');
src = remplacer(src, "  else if(b.dataset.deja!=null){ajouter(st.r[+b.dataset.deja].nom,lire().kg);}",
  "  else if(b.dataset.role==='ouvrir'){e.preventDefault();var aj7=q('[data-role=\"ajout\"]');if(document.activeElement!==aj7)aj7.focus();else{OUVERT=!OUVERT;recherche();}}\n" +
  "  else if(b.dataset.deja!=null){ajouter(st.r[+b.dataset.deja].nom,lire().kg);}\n  else if(b.dataset.role==='resultat'&&b.dataset.nom){ajouter(b.dataset.nom,lire().kg);}", 'toucher');
// Un rendu (masse, moment, retrait…) garde le menu à sa place.
src = remplacer(src, "q('[data-role=\"fam\"]').firstChild.nodeValue=FAM[st.fam].l+' ';puces();maj();",
  "q('[data-role=\"fam\"]').firstChild.nodeValue=FAM[st.fam].l+' ';recherche();maj();", 'rendu');
src = remplacer(src, "window.addEventListener('resize',function(){regle();piste();});",
  "window.addEventListener('resize',function(){regle();piste();var m7=q('[data-role=\"menu\"]');if(!m7.hidden)placer7(m7);});", 'place');
const CSS = `/* p7-s3 (D220, D221) : la liste de l'app, collée au champ, puis enrichie. */
${CSS_COMMUN}.r4b-aj{position:relative}
.p7s3-ouv{display:flex;align-items:center;justify-content:center;width:28px;height:28px;flex-shrink:0;border-radius:8px;color:var(--t2)}
.p7s3-ouv svg{transition:transform .15s}.p7s3-ouv.p7s3-ouvert svg{transform:rotate(180deg)}
.p7s3-menu{position:absolute;left:8px;right:8px;z-index:5;overflow-y:auto;overscroll-behavior:contain;padding:4px 0;background:#fff;border:1px solid var(--bordm);border-radius:10px;box-shadow:0 14px 32px -14px rgba(0,0,0,.45)}
.p7s3-menu.p7s3-haut{box-shadow:0 -14px 32px -14px rgba(0,0,0,.45)}
.p7s3-ro{width:100%;display:flex;align-items:center;gap:8px;min-height:44px;padding:4px 10px 4px 4px;text-align:left}
.p7s3-ro.p7s3-act{background:var(--haut)}
.p7s3-ro:active{background:var(--haut)}
.p7s3-et{width:14px;flex-shrink:0;display:flex}
.p7s3-tx{flex:1;min-width:0;display:flex;flex-direction:column}
.p7s3-l1{display:flex;align-items:center;flex-wrap:wrap;gap:2px 8px;font-size:16px;color:var(--t0);line-height:20px}
.p7s3-l1 b{font-weight:700}
.p7s3-l2{font-size:14px;color:var(--t2);line-height:18px}
.p7s3-vide{color:var(--attt);font-weight:600}
.p7s3-deja{flex-shrink:0;height:20px;display:flex;align-items:center;padding:0 7px;border-radius:8px;background:#FCF1D8;border:1px solid var(--att);font-family:var(--mono);font-size:12px;font-weight:600;color:var(--attt);white-space:nowrap}
.p7s3-cr{border-top:1px solid var(--bord);padding-left:10px;color:var(--attt)}
.p7s3-cr .p7s3-l1{color:var(--attt)}
.p7s3-ent{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;flex-shrink:0;border-radius:6px;border:1.5px solid var(--t0);color:var(--t0)}
.p7s3-n{padding:6px 12px;font-size:14px;color:var(--t2)}
</style></head>`;
src = remplacer(src, '</style></head>', CSS, 'style');
ecrire(path.join(ICI, 'etat.html'), src);
