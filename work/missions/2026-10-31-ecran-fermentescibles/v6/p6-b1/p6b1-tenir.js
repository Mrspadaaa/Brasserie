// L'appui tenu sur − ou + fait défiler la masse, un cran tous les 100 ms après 450 ms ; il s'arrête au relâcher. Le toucher qui
// suit un défilement ne compte pas un cran de plus.
var tenu=null;st.avaler=0;
document.addEventListener('pointerdown',function(e){var b=e.target.closest&&e.target.closest('[data-pm]');if(!b)return;var i=+b.dataset.pm,d=+b.dataset.dir;
  tenu={b:b,n:0,iv:0,t:setTimeout(function(){if(!tenu)return;tenu.iv=setInterval(function(){if(!tenu)return;if(pousser(i,d)){tenu.n++;b.classList.add('p6b1-tenu');}},100);},450)};});
function lacher(){if(!tenu)return;clearTimeout(tenu.t);clearInterval(tenu.iv);tenu.b.classList.remove('p6b1-tenu');if(tenu.n)st.avaler=Date.now();tenu=null;}
document.addEventListener('pointerup',lacher);document.addEventListener('pointercancel',lacher);
document.addEventListener('contextmenu',function(e){if(e.target.closest&&e.target.closest('[data-pm]'))e.preventDefault();});
