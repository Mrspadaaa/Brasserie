// p6-b1 (D219) : « je pensais plutôt à un mini slider ou bouton+ /- facil ». − et + font un cran de la piste du plateau
// (50 g sous 1 kg, 100 g au-dessus) et posent la masse sur sa grille ; à 0 kg, − ne descend plus.
var ICM='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"/></svg>';
var ICP='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 6v12M6 12h12"/></svg>';
function pasG(x,dir){return dir>0?(x<1-1e-9?50:100):(x<=1+1e-9?50:100);}
function cranPas(x,dir){var v=dir>0?(x<1-1e-9?Math.floor(x*20+1e-6)/20+0.05:Math.floor(x*10+1e-6)/10+0.1):(x<=1+1e-9?Math.ceil(x*20-1e-6)/20-0.05:Math.ceil(x*10-1e-6)/10-0.1);return Math.max(0,Math.round(v*1000)/1000);}
function pmLab(f,dir){return (dir>0?'Ajouter ':'Retirer ')+pasG(f.kg,dir)+' g de '+f.nom;}
function pmHtml(f,i,dir){return '<button class="p6b1-pm" data-role="'+(dir>0?'masse-plus':'masse-moins')+'" data-pm="'+i+'" data-dir="'+dir+'" data-booster="masse-plus-moins" aria-label="'+pmLab(f,dir)+'"'+(dir<0&&!f.kg?' aria-disabled="true"':'')+'>'+(dir>0?ICP:ICM)+'</button>';}
function majPm(i){var f=st.r[i];if(!f)return;[1,-1].forEach(function(d){var b=q('[data-pm="'+i+'"][data-dir="'+d+'"]');if(!b)return;b.setAttribute('aria-label',pmLab(f,d));if(d<0){if(f.kg)b.removeAttribute('aria-disabled');else b.setAttribute('aria-disabled','true');}});}
function pousser(i,dir){var f=st.r[i];if(!f||(dir<0&&!f.kg))return false;f.kg=cranPas(f.kg,dir);maj();return true;}
