// p7-s1 (D220, D221) : la recherche sous le champ. Au repos, les sacs habituels de la base, tels quels. Le champ touché, ils deviennent
// des tuiles sur deux colonnes : l'ouverture, le stock de la famille (épinglés en tête, ce qui est déjà dans la recette écarté : il est
// juste au-dessus). Chaque tuile : l'étoile si épinglé, le nom (les lettres tapées surlignées), la teinte en EBC dans sa couleur (ce qui
// sépare deux malts proches), « 12,5 kg en stock » ou « stock épuisé ». En tapant : la pertinence prime, une ligne déjà là prend toute
// la largeur (« déjà 5,0 kg »), Entrée est dessinée sur la tuile qu'elle prendra, « Créer « … » (stock à zéro) » si rien.
// Usage : node patch.mjs (écrit etat.html depuis v6/p6-b2/etat.html).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lireBase, socle, remplacer, fonction, ecrire, ENTREE_AV, CSS_COMMUN } from './commun-p7.mjs';
const ICI = path.dirname(fileURLToPath(import.meta.url));
let src = socle(lireBase(), 'p7-s1 — Malts/sucres 2/7 · la recherche sous le champ (D220, D221, 31.10)', 'p7-s1');

const PUCES = `function recherche(){puces();}
function puces(){
  var s=lire(),t=s.nom,pu=q('[data-role="puces"]'),ent='<i class="p7s1-ent" aria-hidden="true">'+IC.ent+'</i>',on=OUVERT||!!t,h='';
  document.body.classList.toggle('p7s1-on',on);
  if(!on)h=habituels().slice(0,5).map(function(n){return '<button class="r4b-pu" data-pu="'+n+'" data-role="resultat" data-nom="'+n+'">'+sacDe(n)+n+'</button>'}).join('');
  else{
    var A=t?chercher(t).slice(0,6):ouverture(true).slice(0,6).map(function(n){return {nom:n,deja:-1}});
    h=A.map(function(o,k){var pr=t.length>=2&&k===0,fin=pr?ent:'',et=epingle(o.nom)?ETOILE:'';
      if(o.deja>=0){var f=st.r[o.deja];return '<button class="p7s1-tu p7s1-large'+(pr?' p7s1-prem':'')+'" data-role="resultat" data-nom="'+f.nom+'" data-deja="'+o.deja+'" aria-label="'+f.nom+' : déjà '+kgTxt(f.kg)+' kg dans la recette, '+stockTxt(f.nom)+'"><span class="p7s1-l1">'+et+'<span class="p7s1-nm">'+marque(f.nom,t)+'</span></span><span class="p7s1-l2"><b>déjà '+kgTxt(f.kg)+' kg</b> · '+stockTxt(f.nom)+'</span>'+fin+'</button>';}
      var e=ebcDe(o.nom),F=FIX[o.nom];
      return '<button class="p7s1-tu'+(pr?' p7s1-prem':'')+(epuise(o.nom)?' p7s1-vide':'')+'" data-role="resultat" data-nom="'+o.nom+'" data-pu="'+o.nom+'" aria-label="Ajouter '+o.nom+' : '+detailTxt(o.nom)+'"><span class="p7s1-l1">'+et+'<span class="p7s1-nm">'+marque(o.nom,t)+'</span>'+(e?'<i class="p7s1-ebc" style="background:'+teinte(F.ebc)+';color:'+(F.ebc>=18?'#fff':'#111')+'">'+e+'</i>':'')+'</span><span class="p7s1-l2">'+stockTxt(o.nom)+'</span>'+fin+'</button>';}).join('');
    if(t.length>=2&&!A.length)h+='<button class="p7s1-tu p7s1-large p7s1-cree p7s1-prem" data-role="creer" data-cree="1"><span class="p7s1-l1">'+IC.plus+'<span class="p7s1-nm">Créer « '+s.nom+' » (stock à zéro)</span></span><span class="p7s1-l2">'+FAM[st.fam].l.toLowerCase()+' : '+QUAND[FAM[st.fam].m]+'</span>'+ent+'</button>';
    if(!h)h='<p class="p7s1-rien">Rien en stock pour '+FAM[st.fam].l.toLowerCase()+'</p>';
  }
  pu.innerHTML=h;
  var R=t.length>=2?chercher(t):[],ap=q('[data-role="apercu"]'),cree=t.length>=2&&!R.length,nom=t.length>=2?(R.length?R[0].nom:s.nom):'';
  ap.classList.toggle('r4b-vu',!!nom);ap.innerHTML=nom?(cree?IC.plus:'')+nom.split(' ')[0]+(s.kg!=null?' <b>'+kgTxt(s.kg)+'</b> kg':'')+IC.ent:'';
}`;
src = fonction(src, 'function puces(){', "+IC.ent:'';\n}", PUCES, 'puces');
src = remplacer(src, ENTREE_AV,
  "if(e.key==='Enter'){e.preventDefault();var s=lire();if(!s.nom)return;var R=s.nom.length>=2?chercher(s.nom):[];ajouter(R.length?R[0].nom:s.nom,s.kg);}\n" +
  "    else if(e.key==='Escape'){if(t.value)t.value='';else OUVERT=false;puces();}", 'entrée');
src = remplacer(src, '<div class="r4b-puces" data-role="puces" data-booster="sacs-habituels"></div>',
  '<div class="r4b-puces" data-role="puces" data-booster="sacs-habituels" data-p7garde></div>', 'garde');
const CSS = `/* p7-s1 (D220, D221) : la recherche sous le champ, en tuiles sur deux colonnes ; aucun résultat caché hors du bord. */
${CSS_COMMUN}.p7s1-on .r4b-puces{display:grid;grid-template-columns:1fr 1fr;gap:6px;overflow:visible}
.p7s1-tu{position:relative;display:flex;flex-direction:column;justify-content:center;gap:1px;min-width:0;min-height:46px;padding:4px 8px;border:1px solid var(--bordm);border-radius:10px;background:#fff;text-align:left}
.p7s1-tu:active{transform:scale(.97)}
.p7s1-large{grid-column:1/-1}
.p7s1-l1{display:flex;align-items:center;gap:5px;min-width:0}
.p7s1-nm{min-width:0;font-size:14px;font-weight:600;color:var(--t0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.p7s1-nm b{font-weight:600;background:#F2DDA6;border-radius:3px;box-shadow:0 0 0 1px #F2DDA6}
.p7s1-ebc{margin-left:auto;flex-shrink:0;height:18px;padding:0 5px;border-radius:6px;border:1px solid rgba(0,0,0,.18);font-style:normal;font-family:var(--mono);font-size:12px;font-weight:600;line-height:16px}
.p7s1-l2{font-size:12px;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:26px}
.p7s1-l2 b{font-weight:600;color:var(--t0)}
.p7s1-vide .p7s1-l2{color:var(--attt);font-weight:600}
.p7s1-tu.p7s1-prem{border:1.5px solid var(--t0)}
.p7s1-tu.p7s1-cree,.p7s1-tu.p7s1-cree.p7s1-prem{border-style:dashed}
.p7s1-ent{position:absolute;right:6px;bottom:5px;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:6px;border:1.5px solid var(--t0);color:var(--t0)}
.p7s1-rien{grid-column:1/-1;font-size:14px;color:var(--t2);padding:4px}
</style></head>`;
src = remplacer(src, '</style></head>', CSS, 'style');
ecrire(path.join(ICI, 'etat.html'), src);
