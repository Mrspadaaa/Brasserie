/* Correction 2 (nuit du 25.11) : complète enrichi.js pour v2, v6 et v7, sans rien inventer. Chargé après enrichi.js et local-reel.js.
   - date : le J-n se met à côté de ce qu'il date ; une tâche sans date propre porte l'échéance qui la motive, nommée (« Brassage IPA · J-1 ») ;
     une seule fois par échéance ; urgence graduée (≤ 2 j rouge, ≤ 7 j orange, au-delà calme) ; « dans une semaine » devient sa date (2 déc.) ;
   - fait : une option du brasseur déjà faite (titre fini par un participe, « Raccord changé ») sort des solutions et se range en ✓ ;
   - comparaison : vide (aucune valeur connue) → ni table ni hachuré ;
   - trouvé : « n/m trouvé » dès une piste trouvée ;
   - ✦ conseillé : se retire au repos (✕), l'option reste ;
   - hachuré : sa légende, « prix inconnu », là où il apparaît ;
   - IA absente : la lecture RÉELLE de l'app (local-reel.js, produit par analyseLocale.ts et tacheDatee.ts) ; le héros est la ligne qu'elle lit
     « à faire » (datée d'abord), avec la date qu'elle lit (le lundi de la semaine, comme l'app la range). Rien d'autre. */
(function(){
const AUJ=new Date(2026,10,25);
const MC=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
const dateDans=j=>{const d=new Date(AUJ);d.setDate(d.getDate()+j);return d.getDate()+' '+MC[d.getMonth()];};
const isoCourt=iso=>{const p=iso.split('-').map(Number);return p[2]+' '+MC[p[1]-1];};
const niv=j=>j==null?'':j<=2?'urg':j<=7?'proche':'loin';
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
window.SANS_CONSEIL=new Set();

const avant=window.ENRICHIR;
window.ENRICHIR=function(D0,cas){const D=avant(D0,cas);if(!D)return D;
  /* « dans une semaine », « avant le 15 » : la date calculée (2 déc., 15 déc.) ; un jour ou un mois déjà dits restent ses mots */
  const fix=d=>{if(!d)return d;if(d.j!=null&&(/^dans /.test(d.txt)||(/\d/.test(d.txt)&&!/(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|demain|aujourd|\dh)/i.test(d.txt))))d.txt=dateDans(d.j);d.niv=niv(d.j);d.urg=d.niv==='urg';return d;};
  if(D.tache&&D.tache.date)fix(D.tache.date);if(D.ech&&D.ech.date)fix(D.ech.date);
  const propre=!!(D.tache&&D.tache.date&&D.tache.date.j!=null);
  D.date=propre?D.tache.date:D.ech&&D.ech.date&&D.ech.date.j!=null?D.ech.date:null;
  /* l'objet du J-n : nommé quand il ne date pas la chose affichée (tâche sans date propre, ou réglé) */
  D.dateObjet=!propre&&D.ech&&D.date&&(D.tache||D.regle)?(D.ech.quoi||''):'';
  D.dateIc=/brass/i.test(D.dateObjet)?'🍺':'⏳';
  /* une seconde échéance ne s'affiche que si elle est distincte de celle du héros */
  D.echRow=!!(propre&&D.ech&&D.ech.date&&D.ech.date.j!=null&&D.ech.date.j!==D.tache.date.j);
  /* fait accompli : sort des solutions */
  D.faits=[];
  D.options=D.options.filter(o=>{const w=String(o.mot).trim().split(/\s+/).pop();const l=o.ligne?D.lignes[o.ligne-1]:'';
    if(!o.ia&&/(é|ée|és|ées)$/i.test(w)&&!/\?/.test(l)){o.fait=true;D.faits.push(o);return false;}return true;});
  const connus=D.options.filter(o=>!o.inconnu).length;D.options.forEach(o=>{o.hach=o.inconnu&&connus>0;});
  if(D.comp)D.comp.vide=D.comp.arts.every(a=>a.vals.every(v=>v==='?'));
  const ok=D.pistes.filter(p=>p.ok==='trouve').length;D.trouve=ok?{ok,n:D.pistes.length}:null;
  D.localR=(window.LOCAL_REEL||{})[cas]||[];
  return D;};

/* --- communs v2, v6, v7 --- */
window.COMPTE_HTML=function(d,objet,ic){if(!d||!d.compte)return '';
  return '<span class="c2-cd '+(d.niv||'loin')+'">'+(objet?'<i>'+(ic||'⏳')+' '+esc(objet)+'</i>':'')+'<b class="mono">'+esc(d.compte)+'</b><small>'+esc(d.txt)+'</small></span>';};
window.TAG_CONSEIL_X=k=>window.SANS_CONSEIL.has(k)?'':'<span class="c2-cons"><span class="c1-tag">✦ conseillé</span><span role="button" tabindex="0" class="c2-x" data-sansconseil="'+k+'" aria-label="Retirer la marque conseillé de l’IA">✕</span></span>';
window.HACH_LEG='<span class="c2-leg"><span class="c2-sw"></span>prix inconnu</span>';window.HACH_LEG1='<span class="c2-leg"><span class="c2-sw"></span>inconnu</span>';
document.addEventListener('click',e=>{const b=e.target.closest('[data-sansconseil]');if(!b)return;e.stopPropagation();e.preventDefault();
  window.SANS_CONSEIL.add(b.dataset.sansconseil);const c=b.closest('.c2-cons');if(c)c.remove();
  document.querySelectorAll('.c1-toast,.v7-toast').forEach(x=>x.remove());const t=document.createElement('div');t.className='c1-toast';
  t.innerHTML='<span>✕ Marque ✦ retirée</span><button class="c1-btn" onclick="location.reload()">↶ Annuler</button>';document.body.append(t);},true);

/* un refus qui retire le dernier hachuré retire aussi sa légende */
document.addEventListener('click',e=>{if(!e.target.closest('[data-refus],[data-ecarte]'))return;setTimeout(()=>{if(!document.querySelector('.c1-h,.v7-o .h,.v7-cmp .u,.v7-cmp .jh,.v2-hatch'))document.querySelectorAll('.c2-leg').forEach(x=>x.remove());},0);},true);
const GIC={'a-acheter':'🛒','a-faire':'☐','question':'❓','conseil':'💡','note':'📝'};
/* IA absente : ce que l'app lit seule (analyseLocale.ts, tacheDatee.ts), rien d'autre */
window.SANS_IA=function(D){const L=D.localR;const af=L.filter(l=>l.genre==='a-faire');
  const h=af.filter(l=>l.echeance).sort((a,b)=>a.echeance<b.echeance?-1:1)[0]||af[0]||null;
  const sem=l=>l.echeance?'<span class="c2-chip">📅 sem. '+esc(isoCourt(l.echeance))+'</span>':'';
  let s='<section class="c2-off"'+(h?'':' data-utile')+'><span style="font-size:20px;color:var(--mut)">✦</span><b>IA absente</b><button class="c1-btn" data-reessai>⟳ Réessayer</button></section>';
  if(h)s+='<section class="c2-hero" data-utile data-booster="heros-local"><div class="c2-k"><span>☐ À faire</span><small>lu par l’app</small></div>'+
    '<div class="c2-b"><span class="c2-act">'+esc(h.forme)+'</span>'+(h.echeance?'<span class="c2-cd loin"><small>semaine du</small><b class="mono" style="font-size:20px">'+esc(isoCourt(h.echeance))+'</b></span>':'')+'</div>'+
    '<div class="c2-do"><button class="c2-fait" aria-label="Fait">✓</button><button class="c2-tard" aria-label="Plus tard">⏭<small>plus tard</small></button><button class="c2-src" data-n="'+h.n+'">📝 <span class="mono">'+h.n+'</span> ↩</button></div></section>';
  s+='<section class="c2-lc">'+L.filter(l=>l!==h).map(l=>'<button class="c2-li" data-n="'+l.n+'"><span class="c2-ln mono">'+l.n+'</span><span class="c2-g">'+GIC[l.genre]+'</span><span class="c2-o">'+
    (l.url.length?'🔗 '+esc(l.url[0]):esc(l.forme))+'</span><span class="c2-chips">'+l.prix.concat(l.qte).map(p=>'<span class="c2-chip mono">'+esc(p)+'</span>').join('')+sem(l)+'</span></button>').join('')+'</section>';
  return s;};

const st=document.createElement('style');st.textContent=
 '.c2-cd{flex:none;display:inline-flex;flex-direction:column;align-items:center;gap:1px;min-width:74px;padding:6px 8px;border-radius:16px;background:rgba(0,0,0,.35);text-align:center;font-family:"Source Sans 3",system-ui,sans-serif}'+
 '.c2-cd b{font-size:28px;font-weight:800;line-height:1;color:var(--cdc)}.c2-cd small{font-size:13px;font-weight:700;color:var(--ink);white-space:nowrap}.c2-cd i{font-style:normal;font-size:12px;font-weight:800;line-height:1.15;color:var(--cdc);max-width:110px;margin-bottom:2px}'+
 '.c2-cd.urg{--cdc:var(--bad);background:color-mix(in srgb,var(--bad) 20%,transparent)}.c2-cd.proche{--cdc:#ffad5c;background:color-mix(in srgb,#ffad5c 14%,transparent)}.c2-cd.loin{--cdc:var(--mut)}'+
 '.c2-cons{flex:none;display:inline-flex;align-items:center;gap:2px}.c2-x{flex:none;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:12px;color:var(--ia);background:rgba(0,0,0,.35);border:0}'+
 '.c2-leg{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--mut);white-space:nowrap}.c2-sw{width:22px;height:12px;border-radius:6px;background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--ia) 60%,transparent) 0 3px,transparent 3px 7px)}'+
 '.c2-off{margin:2px 10px 0;display:flex;align-items:center;gap:10px;min-height:48px;padding:4px 6px 4px 14px;border-radius:16px;background:#141417;border:1.5px dashed var(--line)}.c2-off b{flex:1;font-size:16px}'+
 '.c2-hero{margin:8px 10px 0;border-radius:22px;padding:10px 14px 12px;background:linear-gradient(160deg,color-mix(in srgb,var(--att) 22%,#1c1c1f),#151518 70%);border:1px dashed color-mix(in srgb,var(--att) 45%,transparent)}'+
 '.c2-k{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:800;color:var(--att)}.c2-k small{margin-left:auto;font-size:12px;color:var(--mut);font-weight:700}'+
 '.c2-b{display:flex;align-items:center;gap:10px;margin:8px 0 10px}.c2-act{flex:1;min-width:0;font-size:22px;line-height:1.15;font-weight:900;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}'+
 '.c2-do{display:flex;align-items:center;gap:10px}.c2-fait{width:56px;height:56px;border-radius:50%;background:var(--ok);color:#000;font-size:28px;font-weight:900;display:grid;place-items:center;border:0}'+
 '.c2-tard{display:flex;flex-direction:column;align-items:center;width:56px;font-size:20px;color:var(--mut);background:none;border:0}.c2-tard small{font-size:12px;font-weight:700}'+
 '.c2-src{margin-left:auto;display:flex;align-items:center;gap:6px;height:40px;padding:0 12px;border-radius:20px;background:rgba(255,255,255,.08);font-size:14px;color:var(--mut);font-weight:700;border:0}'+
 '.c2-lc{display:flex;flex-direction:column;gap:6px;padding:8px 10px 120px}.c2-li{display:flex;align-items:center;gap:8px;min-height:48px;padding:6px 8px;border-radius:14px;background:var(--card);text-align:left;font-weight:600;font-size:15px;color:var(--ink);border:0;width:100%}'+
 '.c2-ln{display:inline-grid;place-items:center;min-width:26px;height:26px;border-radius:8px;background:var(--s2);color:var(--mut);font-size:13px;flex:none}.c2-g{font-size:18px;width:24px;text-align:center;flex:none}'+
 '.c2-o{flex:1;min-width:0;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.c2-chips{display:flex;flex-direction:column;gap:4px;align-items:flex-end;flex:none}'+
 '.c2-chip{flex:none;height:24px;padding:0 8px;border-radius:12px;background:color-mix(in srgb,var(--fin) 14%,var(--card));color:var(--fin);font-size:13px;font-weight:800;display:inline-flex;align-items:center;white-space:nowrap}';
document.head.append(st);
})();
