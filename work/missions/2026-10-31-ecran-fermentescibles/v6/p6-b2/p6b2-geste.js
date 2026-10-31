// La barre tirée (toutes les lignes) : le doigt pose la position ; grain, la part (0 à 95 %) et la masse suit au cran ; sucre et
// fruit, la masse sur sa plage, au cran. Le total, la part, la teinte, l'OG et le plateau suivent ; les autres masses restent.
// Un toucher sans glisser ne change rien ; un défilement vertical (pointercancel) rend la masse d'avant.
var tire=null;
function ligneTiree(i,on){var li=q('[data-sel="'+i+'"]');if(li)li.classList.toggle('r4e-tire',on);}
document.addEventListener('pointerdown',function(e){var w=e.target.closest&&e.target.closest('.r4e-bw');if(!w)return;var i=+w.dataset.bw,f=st.r[i];if(!f)return;
  tire={i:i,id:e.pointerId,r:w.getBoundingClientRect(),x0:e.clientX,av:f.kg,bouge:false,part:enPart(f,i),M:echelle(f)};try{w.setPointerCapture(e.pointerId);}catch(_){}});
document.addEventListener('pointermove',function(e){if(!tire||e.pointerId!==tire.id)return;if(!tire.bouge&&Math.abs(e.clientX-tire.x0)<4)return;
  if(!tire.bouge){tire.bouge=true;ligneTiree(tire.i,true);}
  var x=Math.max(0,Math.min(1,(e.clientX-tire.r.left)/tire.r.width)),kg=tire.part?kgPourPart(tire.i,Math.round(Math.min(.95,x)*100)):x*tire.M;
  if(kg!=null){st.r[tire.i].kg=cran(kg);maj();}});
document.addEventListener('pointerup',function(e){if(!tire||e.pointerId!==tire.id)return;var i=tire.i;tire=null;ligneTiree(i,false);});
document.addEventListener('pointercancel',function(e){if(!tire||e.pointerId!==tire.id)return;var t=tire;tire=null;st.r[t.i].kg=t.av;ligneTiree(t.i,false);maj();});
