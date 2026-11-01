// p6-b2 (D219) : « je pensais plutôt à un mini slider ou bouton+ /- facil ». La barre de la ligne est le curseur de sa masse.
// Grain : sa longueur est la part du grain (0 à 100 % de sa largeur), comme dans la base ; tirée, elle pose la part et la masse suit au
// cran. Sucre, fruit, lactose, extrait (pas de part du grain) : sa longueur est la masse sur la plage de la piste du plateau (0–2 kg
// sous 1 kg, sinon la graduation ronde au-dessus d'une fois et demie la masse) ; la plage reste fixe tant que la masse y tient.
function echelle(f){if(!f.M||f.kg>f.M)f.M=pmax(f.kg);return f.M;}
function enPart(f,i){return f.fam==='grain'&&autres(i)>0;}
function longueur(f,i){if(enPart(f,i))return grainKg()?f.kg/grainKg()*100:0;return Math.min(100,f.kg/echelle(f)*100);}
function maxCur(f,i){return enPart(f,i)?kgPourPart(i,95):echelle(f);}
function curAria(f,i){return ' aria-valuemin="0" aria-valuemax="'+maxCur(f,i)+'" aria-valuenow="'+f.kg+'" aria-valuetext="'+kgTxt(f.kg)+' kg"';}
function barreHtml(f,i){
  var w=longueur(f,i),g=f.fam==='grain',cl=g?(f.ebc==null?'r4b-inc':''):'p6b2-pt',fond=g&&f.ebc!=null?';background:'+teinte(f.ebc):'';
  return '<span class="r4e-bw"'+(g?' data-role="part-ligne" data-pl="'+i+'"':'')+' data-bw="'+i+'" data-booster="masse-barre-tiree">'+
    '<span class="p6b2-cur" data-role="masse-curseur" data-mk="'+i+'" role="slider" tabindex="0" aria-label="Masse de '+f.nom+'"'+curAria(f,i)+'>'+
    '<i class="r4b-barre" aria-hidden="true"><i data-bar="'+i+'" class="'+cl+'" style="width:'+w+'%'+fond+'"></i></i><b class="r4e-pouce" data-po="'+i+'" style="left:'+w+'%"></b></span></span>';
}
function majCur(i){var f=st.r[i];if(!f)return;var w=longueur(f,i),br=q('[data-bar="'+i+'"]'),po=q('[data-po="'+i+'"]'),c=q('[data-mk="'+i+'"]');
  if(br)br.style.width=w+'%';if(po)po.style.left=w+'%';
  if(c){c.setAttribute('aria-valuenow',f.kg);c.setAttribute('aria-valuetext',kgTxt(f.kg)+' kg');c.setAttribute('aria-valuemax',maxCur(f,i));}}
// Un cran de la piste (50 g sous 1 kg, 100 g au-dessus), posé sur la grille ; jamais sous 0.
function cranPas(x,dir){var v=dir>0?(x<1-1e-9?Math.floor(x*20+1e-6)/20+0.05:Math.floor(x*10+1e-6)/10+0.1):(x<=1+1e-9?Math.ceil(x*20-1e-6)/20-0.05:Math.ceil(x*10-1e-6)/10-0.1);return Math.max(0,Math.round(v*1000)/1000);}
