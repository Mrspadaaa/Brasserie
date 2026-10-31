  // Le curseur de masse au clavier : ← → (ou ↓ ↑) d'un cran de la piste, Maj d'un kilo à peu près (10 crans) ; Échap pendant le
  // glisser rend la masse d'avant.
  if(t.dataset.mk!=null){
    var ip=+t.dataset.mk,fp=st.r[ip];if(!fp)return;
    if(e.key==='Escape'&&tire&&tire.i===ip){e.preventDefault();fp.kg=tire.av;var ti=tire.i;tire=null;ligneTiree(ti,false);maj();return;}
    var dk={ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1}[e.key];
    if(dk){e.preventDefault();for(var n=0;n<(e.shiftKey?10:1);n++)fp.kg=cranPas(fp.kg,dk);maj();}
    return;
  }
