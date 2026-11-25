/* Correction 1 (nuit du 25.11) : complète le modèle D d'adapt.js, sans rien inventer.
   Tout vient de reponses/<cas>.json ou d'un calcul de l'app sur ses lignes (dates, totaux), écrit ici.
   - regle : le carnet est réglé (etat « resolu » ou reponse.resolu) ;
   - date : la date de la tâche (ses mots) ou l'échéance, et les jours restants depuis le 25 nov. 2026 (date des maquettes) ;
   - options : coût inconnu marqué (hachuré seulement si une autre option a un coût) ;
   - anneau : trouvé / à vérifier / pas trouvé, pour un problème ;
   - comparaison : ✦ conseillé de l'IA par article, coût total pour le besoin (titre « 600 bouteilles »), ⚠ quantité qui ne couvre pas ;
   - chiffres : un chiffre déjà dit ailleurs (coût, liste, article, réglé) n'est pas répété ; deux chiffres de même unité font une paire ;
   - aide : propositions de l'IA (critère inconnu, conseil), une à la fois ;
   - local : ce que l'app lit seule quand l'IA est absente (règles reprises de src/domain/carnets/analyseLocale.ts, simplifiées) ;
   - bar : la ligne « Il demande un prix pro » manquait à la réponse écrite à la main (juge critique C6) : ajoutée à la liste, citée. */
(function(){
const AUJ=new Date(2026,10,25);
const MOIS={janv:0,janvier:0,'févr':1,'février':1,mars:2,avr:3,avril:3,mai:4,juin:5,juil:6,juillet:6,'août':7,sept:8,septembre:8,oct:9,octobre:9,nov:10,novembre:10,'déc':11,'décembre':11};
const JOURS=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const diff=d=>Math.round((d-AUJ)/864e5);
function jours(q){const s=String(q||'').toLowerCase();if(!s)return null;
  if(/aujourd/.test(s))return 0;if(/demain/.test(s))return 1;
  let m=s.match(/dans (une|\d+) semaines?/);if(m)return 7*(m[1]==='une'?1:+m[1]);
  m=s.match(/dans (\d+) jours?/);if(m)return +m[1];
  m=s.match(/(\d{1,2})\s+(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)/);if(m){const d=new Date(2026,MOIS[m[2]],+m[1]);if(d<AUJ)d.setFullYear(2027);return diff(d);}
  m=s.match(/le (\d{1,2}) du mois/);if(m){let d=new Date(2026,AUJ.getMonth(),+m[1]);if(d<AUJ)d=new Date(2026,AUJ.getMonth()+1,+m[1]);return diff(d);}
  m=s.match(/(?:avant|en|début|fin) (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/);if(m){const d=new Date(2026,MOIS[m[1]],1);if(d<AUJ)d.setFullYear(2027);return diff(d);}
  for(let i=0;i<7;i++)if(new RegExp('(^|\\s)'+JOURS[i]+'(\\s|$)').test(s)){return (i-AUJ.getDay()+7)%7||7;}
  return null;}
const num=s=>{const m=String(s).replace(/(\d)[ ’'](?=\d{3})/g,'$1').match(/\d+(?:[.,]\d+)?/);return m?parseFloat(m[0].replace(',','.')):NaN;};
function emo(s){const m=String(s||'').match(/^(\S+)\s+(.*)$/);return m&&!/[A-Za-z0-9]/.test(m[1])?[m[1],m[2]]:['',String(s||'')];}
/* ses mots, 3 au plus : « samedi 6 déc. au matin » → « samedi 6 déc. » */
const court=s=>String(s||'').split(/\s+/).slice(0,3).join(' ');
window.JOURS_AVANT=jours;

/* --- lecture locale (analyseLocale.ts, simplifiée) --- */
const PAS=new Set(['pour','entre','notre','votre','autre','contre','leur','premier','dernier','hier','fournisseur','centre','chiffre','litre','filtre']);
const norm=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[^a-z0-9 ?]/g,' ').replace(/\s+/g,' ').trim();
function urls(l){return [...l.matchAll(/https?:\/\/([^\/\s]+)\S*/g)].map(m=>m[1].replace(/^www\./,''));}
function prix(l){return [...l.matchAll(/(\d+(?:[ ’']\d{3})*(?:[.,]\d+)?)\s?(CHF|€|EUR)/g)].map(m=>m[0]);}
function qtes(l){const s=l.replace(/https?:\/\/\S+/g,'').replace(/(\d+(?:[ ’']\d{3})*(?:[.,]\d+)?)\s?(CHF|€|EUR)/g,'');return [...s.matchAll(/(\d+(?:[.,]\d+)?)\s?(kg|g|L|cl|ml|hl|bar|%|°C|min)(?![\p{L}])/gu)].map(m=>m[0]);}
function genre(l){const n=norm(l);const lab=(l.match(/^([^:]{2,30}?)\s*:\s*\S/)||[])[1];
  if(lab){const nl=norm(lab);if(/^(a faire|todo|faire)$/.test(nl))return 'a-faire';if(/^(ajoute|ajouter|acheter|achats?|courses|commander)$/.test(nl))return 'a-acheter';if(/^questions?$/.test(nl))return 'question';}
  if(/\?\s*$/.test(l.trim()))return 'question';
  if(prix(l).length||urls(l).length||/\b(acheter|achat|commander|commande|devis|prix|budget)\b/.test(n))return 'a-acheter';
  if(/^(penser a|pense a|attention|eviter|ne pas)\b/.test(n))return 'conseil';
  const p=n.split(' ')[0]||'';if(p.length>3&&/(er|ir|re)$/.test(p)&&!PAS.has(p))return 'a-faire';
  return 'note';}
function objet(l){let t=l.trim();if(/^https?:/.test(t))return urls(t)[0]||t;
  const lab=t.match(/^([^:]{2,40}?)\s*:\s*\S/);const g=lab&&/^(a faire|todo|faire|ajoute|acheter|achats?|courses|commander|questions?|pistes?|liste|idees?)$/.test(norm(lab[1]));
  let o=lab&&!g?lab[1]:lab?t.slice(lab[0].length-1):t.split(/[,;?!(]/)[0];
  o=o.trim().replace(/^(?:l['’]\s*|les\s+|le\s+|la\s+|une?\s+|des\s+|du\s+)/i,'');
  const av=o.split(/\s+(?=[\dØ])/)[0].trim();if(av.length>=3)o=av;o=o.replace(/[\s.:·\-–—]+$/,'').replace(/(?:\s+(?:pour|le|la|les|de|du|des|à|au|aux|en|et|avec|sur|par))+$/i,'');
  if(o.length>26)o=o.slice(0,26).replace(/\s+\S*$/,'')+'…';return o.charAt(0).toUpperCase()+o.slice(1);}
const GIC={'a-acheter':'🛒','a-faire':'☐','question':'❓','conseil':'💡','note':'📝'};

window.ENRICHIR=function(D,cas){if(!D)return D;const x=(window.REPONSES||{})[cas];const r=x.reponse;
  const evt=r.genre==='planning';
  /* bar : la ligne perdue, citée telle quelle */
  if(cas==='bar'){D.lignes.forEach((l,i)=>{const m=l.match(/prix pro/);if(m){const o={k:'l'+D.liste.length,ic:'💶',mot:'Prix pro',ligne:i+1,cit:m[0],corr:1};D.liste.push(o);D.it[o.k]=o;}});}
  /* réglé */
  if(x.etat==='resolu'||r.resolu){const q=(r.resolu&&r.resolu.question)||r.resume;const w=q.split(/[\s,]+/);let n=0,cit='';
    D.lignes.forEach((l,i)=>{for(let k=w.length;k>0;k--){const c=w.slice(0,k).join(' ');if(l.includes(c)){if(c.length>cit.length){cit=c;n=i+1;}break;}}});
    D.regle={k:'regle',ic:'✅',mot:q,ligne:n||null,cit};D.it.regle=D.regle;}
  /* dates */
  const date=(txt,quoi)=>{const j=jours(txt);return {txt:court(txt),plein:txt,j,compte:j==null?'':'J-'+j,quoi:quoi||'',urg:j!=null&&j<=2,evt};};
  if(D.tache&&D.tache.quand)D.tache.date=date(D.tache.quand);
  if(D.ech)D.ech.date=date(D.ech.mot,D.ech.quoi);
  D.date=D.tache&&D.tache.date?D.tache.date:D.ech?D.ech.date:null;
  /* options */
  const connus=D.options.filter(o=>o.cout&&o.cout!=='?').length;
  D.options.forEach(o=>{o.inconnu=!o.cout||o.cout==='?';o.hach=o.inconnu&&connus>0;});
  /* anneau d'un problème */
  if(r.genre==='probleme')D.anneau={ok:D.pistes.filter(p=>p.ok==='trouve').length,q:D.pistes.filter(p=>p.ok==='verif').length,non:D.pistes.filter(p=>p.ok==='non').length};
  /* comparaison */
  if(D.comp){const A=D.comp.arts;
    A.forEach(a=>{const o=r.options.find(o=>o.ligne===a.ligne);a.conseil=!!(o&&o.conseille);if(!a.ic&&o)a.ic=o.emoji;});
    const C=D.comp.crit;const ip=C.findIndex(c=>/prix/i.test(c.nom)),iq=C.findIndex(c=>/quantit/i.test(c.nom)),il=C.findIndex(c=>/livraison/i.test(c.nom));
    const bes=(D.titre.match(/(\d+)\s+\p{L}/u)||[])[1];
    if(bes&&ip>=0&&iq>=0){const B=+bes;
      A.forEach(a=>{const p=num(a.vals[ip]),qv=a.vals[iq],qn=num(qv);let q=B,manque=false;
        if(/min/.test(qv)&&qn>q)q=qn;if(/seulement|max/.test(qv)&&qn<q){q=qn;manque=true;}
        const lv=il>=0?a.vals[il]:'?';const ln=/CHF/.test(lv)?num(lv):null;
        a.total={chf:Math.round(p*q+(ln||0)),q,manque,livInconnue:ln==null};a.manque=manque;});
      const ok=A.filter(a=>!a.total.manque);const best=ok.reduce((m,a)=>!m||a.total.chf<m.total.chf?a:m,null);
      D.comp.besoin=B;D.comp.iq=iq;D.comp.totalG=best&&ok.every(a=>a===best||a.total.chf>best.total.chf)?A.indexOf(best):null;}
  }
  /* chiffres : pas de doublon, paire de même unité */
  const dit=[...D.options.map(o=>o.cout),...D.liste.map(l=>l.mot),D.regle&&D.regle.mot,...(D.comp?D.comp.arts.flatMap(a=>a.vals):[])].filter(Boolean);
  D.chiffres=D.chiffres.filter(c=>!dit.some(t=>String(t).includes(c.mot)));
  D.paire=null;
  if(D.chiffres.length===2){const [a,b]=D.chiffres;const u=s=>s.replace(/[\d,.\s]/g,'');if(u(a.mot)&&u(a.mot)===u(b.mot)){D.paire={a,b,baisse:num(b.mot)<num(a.mot)};if(a.ic==='📈'&&D.paire.baisse)a.ic='🫧';}}
  /* aide : propositions de l'IA, une à la fois */
  D.aide=[];
  if(D.comp){const C=D.comp.crit;const j=C.findIndex((c,j)=>j>0&&c.g==null&&D.comp.arts.some(a=>a.vals[j]==='?'));
    if(j>0){const qui=D.comp.arts.filter(a=>a.vals[j]==='?').map(a=>a.nom);D.aide.push({t:'check',ic:C[j].ic||'✓',mot:C[j].nom+' '+(qui.length===D.comp.arts.length?'':qui[0]+' ')+'?'});}}
  if(r.conseil){const [ic,mot]=emo(r.conseil);D.aide.push({t:'sugg',ic:ic||'💡',mot});}
  D.aide.forEach((a,i)=>{a.k='a'+i;});
  /* IA absente : ses lignes et ce que l'app y lit seule */
  D.local=D.lignes.map((l,i)=>{const g=genre(l);return {n:i+1,genre:g,gic:GIC[g],objet:objet(l),prix:prix(l),url:urls(l),qte:qtes(l)};});
  D.evt=evt;
  D.meta=D.meta.replace('rangé (réponse écrite à la main)','rangé par l’IA (réponse écrite à la main)');
  return D;};

/* --- communs des variantes v1, v2, v3, v6 (correction 1) --- */
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
window.TAG_IA='<span class="c1-tag">✦ IA</span>';window.TAG_CONSEIL='<span class="c1-tag">✦ conseillé</span>';
window.HACH='<span class="c1-h" aria-label="coût inconnu"></span>';
/* IA absente : ses lignes, ce que l'app lit seule, rien d'autre */
window.SANS_IA=function(D){return '<section class="c1-off" data-utile><span style="font-size:22px;color:var(--mut)">✦</span><b style="flex:1;font-size:17px">IA absente</b><button class="c1-btn">⟳ Réessayer</button></section><section class="c1-lc">'+
  D.local.map(l=>'<div class="c1-li"><span class="c1-ln mono">'+l.n+'</span><span style="font-size:19px;width:26px;text-align:center">'+l.gic+'</span><span class="c1-o">'+esc(l.objet)+'</span>'+l.prix.concat(l.qte).map(p=>'<span class="c1-chip mono">'+esc(p)+'</span>').join('')+l.url.map(()=>'<span class="c1-chip">🔗</span>').join('')+'</div>').join('')+'</section>';};
/* refuser une proposition de l'IA, au repos ou depuis sa ligne */
document.addEventListener('click',e=>{const b=e.target.closest('[data-refus]');if(!b)return;e.stopPropagation();e.preventDefault();const k=b.dataset.refus;
  document.querySelectorAll('[data-k="'+k+'"]').forEach(x=>x.remove());document.querySelectorAll('.c-voile,.c-sheet,.v3-bub').forEach(x=>x.remove());
  document.querySelectorAll('.c1-toast').forEach(x=>x.remove());const t=document.createElement('div');t.className='c1-toast';t.innerHTML='<span>✕ Proposition retirée</span><button class="c1-btn" onclick="location.reload()">↶ Annuler</button>';document.body.append(t);},true);
const st=document.createElement('style');st.textContent=
 '.c1-tag{flex:none;display:inline-flex;align-items:center;height:22px;padding:0 7px;border-radius:11px;font-size:12px;font-weight:800;color:var(--ia);border:1px dashed var(--ia);white-space:nowrap;font-family:"Source Sans 3",system-ui,sans-serif;letter-spacing:0}'+
 '.c1-h{flex:none;display:inline-block;width:40px;height:16px;border-radius:8px;background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--ia) 55%,transparent) 0 3px,transparent 3px 8px)}'+
 '.c1-x{flex:none;display:inline-grid;place-items:center;width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.4);color:var(--mut);font-size:14px}'+
 '.c1-cd{display:inline-flex;align-items:baseline;gap:6px;padding:4px 10px;border-radius:12px;background:rgba(0,0,0,.35);font-weight:800;color:var(--att);white-space:nowrap}.c1-cd b{font-size:24px}.c1-cd.urg{color:var(--bad)}.c1-cd small{font-size:13px;color:var(--ink)}'+
 '.c1-off{margin:2px 10px 0;display:flex;align-items:center;gap:10px;min-height:56px;padding:6px 8px 6px 14px;border-radius:18px;background:#141417;border:1.5px dashed var(--line)}'+
 '.c1-lc{display:flex;flex-direction:column;gap:6px;padding:8px 10px 120px}.c1-li{display:flex;align-items:center;gap:8px;min-height:48px;padding:4px 8px;border-radius:14px;background:var(--card);font-weight:700}'+
 '.c1-o{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.c1-ln{display:inline-grid;place-items:center;min-width:28px;height:28px;border-radius:8px;background:var(--s2);color:var(--mut);font-size:14px}'+
 '.c1-chip{flex:none;height:28px;padding:0 9px;border-radius:14px;background:color-mix(in srgb,var(--fin) 14%,var(--card));color:var(--fin);font-size:14px;font-weight:800;display:inline-flex;align-items:center}'+
 '.c1-btn{height:40px;padding:0 14px;border-radius:20px;border:1px solid var(--line);font-weight:800;font-size:15px}'+
 '.c1-toast{position:fixed;left:0;right:0;bottom:78px;margin:0 auto;width:max-content;display:flex;gap:12px;align-items:center;height:44px;padding:0 8px 0 16px;border-radius:22px;background:#2c2c31;font-weight:700;z-index:30}';
document.head.append(st);
window.IA_ABSENTE=new URLSearchParams(location.search).get('ia')==='0';
window.COMPTE_HTML=d=>d&&d.compte?'<span class="c1-cd'+(d.urg?' urg':'')+'"><b class="mono">'+esc(d.compte)+'</b>'+(/^dans /.test(d.txt)?'':'<small>'+esc(d.txt)+'</small>')+'</span>':'';
})();
