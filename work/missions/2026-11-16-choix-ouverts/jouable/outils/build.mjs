// Construit la version jouable des cinq choix du 16.11 depuis les protos choisis.
// Assemblage par split/join (L26) : chaque remplacement doit trouver son texte une seule fois.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const J = path.resolve(ici, '..');
const M = path.resolve(J, '..');

function rep(s, a, b, n = 1) {
  const p = s.split(a);
  if (p.length - 1 !== n) throw new Error(`attendu ${n}× : ${a.slice(0, 90)} (trouvé ${p.length - 1})`);
  return p.join(b);
}

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Source+Sans+3:wght@400;500;600;700;800&display=swap" rel="stylesheet">';

const JXCSS = `<style>
.jx-bar{display:flex;align-items:center;gap:6px;min-height:46px;padding:0 8px 0 2px;background:var(--s1);border-bottom:1px solid var(--line);font-size:15px;font-family:"Source Sans 3","Segoe UI",system-ui,sans-serif}
.jx-bar a{display:inline-flex;align-items:center;min-height:44px;padding:0 10px;color:var(--fin);font-weight:700;text-decoration:none;font-size:16px}
.jx-nom{flex:1;min-width:0;color:var(--mut)}
.jx-th{min-height:36px;padding:0 12px;border-radius:999px;border:1.5px solid var(--line2);font-size:14px;font-weight:600;color:var(--ink);background:none}
.jx-toast{position:fixed;left:12px;right:84px;bottom:var(--jx-tb,76px);z-index:60;display:flex;align-items:center;gap:8px;min-height:52px;padding:6px 6px 6px 14px;border-radius:14px;background:var(--ink);color:var(--bg);font-size:16px;line-height:1.25;box-shadow:0 6px 18px rgba(0,0,0,.3);font-family:"Source Sans 3","Segoe UI",system-ui,sans-serif}
.jx-toast[hidden]{display:none!important}
.jx-toast button{margin-left:auto;flex:none;min-height:44px;padding:0 12px;border-radius:10px;font:inherit;font-weight:700;color:var(--bg);background:none;border:0;text-decoration:underline;text-underline-offset:3px}
.jx-pas{position:absolute;top:2px;left:calc(50% + 4px);min-width:28px;height:26px;padding:0 6px;border-radius:13px;font-size:15px;line-height:22px;font-weight:800;text-align:center;color:#fff;background:var(--fin);border:2px solid var(--bg);font-variant-numeric:tabular-nums;font-style:normal}
html[data-theme=cave] .jx-pas{color:#12100e}
</style>`;
// Choix C : la pastille de Stocks suit l'horizon S49 → 5, la même sur chaque barre d'onglets.
const PAS = '<b class="jx-pas num" aria-label="5 à commander avant S49">5</b>';

function strip(nom) {
  return `<div class="jx-bar"><a class="jx-ret" href="../index.html">← les choix</a><span class="jx-nom">${nom}</span><button class="jx-th" type="button">Cave</button></div>
<script>(function(){var d=document.documentElement,q=new URLSearchParams(location.search);
function maj(){var c=d.getAttribute('data-theme')==='cave';document.querySelector('.jx-ret').href='../index.html'+(c?'?theme=cave':'');document.querySelector('.jx-th').textContent=c?'Clair':'Cave'}
document.querySelector('.jx-th').addEventListener('click',function(){if(d.getAttribute('data-theme')==='cave')d.removeAttribute('data-theme');else d.setAttribute('data-theme','cave');try{var u=new URL(location.href);if(d.getAttribute('data-theme'))u.searchParams.set('theme','cave');else u.searchParams.delete('theme');history.replaceState(null,'',u)}catch(e){}maj()});
if(q.get('theme')==='cave')d.setAttribute('data-theme','cave');maj();
window.jxDit=function(m,annuler){var t=document.getElementById('jx-toast');if(!t){t=document.createElement('div');t.id='jx-toast';t.className='jx-toast';t.setAttribute('role','status');document.body.appendChild(t)}t.innerHTML='';var s=document.createElement('span');s.textContent=m;t.appendChild(s);if(annuler){var b=document.createElement('button');b.type='button';b.textContent='Annuler';b.addEventListener('click',function(e){e.stopPropagation();t.hidden=true;annuler()});t.appendChild(b)}t.hidden=false;clearTimeout(window.jxT);window.jxT=setTimeout(function(){t.hidden=true},annuler?5000:3000)};
window.jxEfface=function(){['jx-toast','toast','s-toast'].forEach(function(i){var t=document.getElementById(i);if(t)t.hidden=true})};
window.jxGlisse=function(el,fermer){var y0=null,dy=0;el.style.overscrollBehavior='contain';
el.addEventListener('touchstart',function(e){if(el.scrollTop>0){y0=null;return}y0=e.touches[0].clientY;dy=0;el.style.transition='none'},{passive:true});
el.addEventListener('touchmove',function(e){if(y0==null)return;dy=Math.max(0,e.touches[0].clientY-y0);el.style.transform=dy?'translateY('+dy+'px)':''},{passive:true});
el.addEventListener('touchend',function(){if(y0==null)return;el.style.transition='';el.style.transform='';if(dy>70)fermer();y0=null;dy=0})};
})();</script>`;
}

// Le + volant ne couvre jamais rien : une bande de la couleur de la page, du haut des onglets à 8 px au-dessus du +,
// borne la zone de lecture. Le + y flotte, les messages s'y posent à sa gauche ; la marge sous chaque liste
// (padding-bottom) laisse remonter la dernière ligne au-dessus de la bande.
// Le haut de la bande se fond sur 28 px : la ligne qui passe dessous s'efface au lieu d'être coupée net.
function habiller(src, nom, tb, dock, css = '') {
  let s = rep(src, '<head>', '<head>' + FONTS);
  const dk = `<style>:root{--jx-tb:${tb}px}.jx-dock{position:fixed;left:0;right:0;bottom:${dock.bar}px;height:${dock.h}px;background:var(--bg);z-index:${dock.z};pointer-events:none}.jx-dock::before{content:'';position:absolute;left:0;right:0;top:-28px;height:28px;background:linear-gradient(to bottom,color-mix(in srgb,var(--bg) 0%,transparent),var(--bg))}${css}</style>`;
  s = rep(s, '</head>', JXCSS + dk + '</head>');
  s = rep(s, '<body>', '<body>' + strip(nom) + '<div class="jx-dock" aria-hidden="true"></div>');
  return s;
}

function lire(rel) { return fs.readFileSync(path.join(M, rel), 'utf8'); }
function ecrire(sujet, html) {
  const d = path.join(J, sujet);
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, 'index.html'), html);
  console.log('écrit', sujet, html.length);
}

// ───────────── 1. Onglet v1 ─────────────
{
  let s = lire('onglet/v1/proto.html');
  // Se corrige : le + couvrait la dernière barre de la frise → marge sous la frise, au-dessus du +.
  s = rep(s, 'body{padding-bottom:150px}', 'body{padding-bottom:164px}');
  // Le message se pose dans la bande, à gauche du + « S49 » élargi, sans le toucher.
  s = rep(s, '.toast{position:fixed;left:12px;right:84px;bottom:76px;', '.toast{position:fixed;left:12px;right:132px;bottom:68px;');
  // Le + du Calendrier pose vraiment ce qu'il propose, dans la semaine choisie.
  s = rep(s, "else if(d.a){S.plus=false;toast(d.a+' (exemple)')}",
    "else if(d.a){S.plus=false;var nv=null,wn=W[S.w][0];if(cal()){if(/^Poser un brassin/.test(d.a))nv={l:'bra',n:'Nouveau brassin',d:'posé en '+wn+' · exemple',m:-150,dit:'Nouveau brassin posé en '+wn};else if(/^Poser une fête/.test(d.a))nv={l:'fete',n:'Nouvelle fête',d:'posée en '+wn+' · exemple',m:500,dit:'Nouvelle fête posée en '+wn};else if(/^Prévoir une dépense/.test(d.a))nv={l:'achat',n:'Nouvelle dépense',d:'prévue en '+wn+' · exemple',m:-200,dit:'Nouvelle dépense prévue en '+wn}}if(nv){nv.a=nv.b=S.w;EV.push(nv);toast(nv.dit+' · exemple')}else toast(d.a+' (exemple)')}");
  // Critique 1 (bloquant 2) : la pastille de Stocks suit l'horizon S49 (choix C) → 5, au style de C.
  s = rep(s, '<span class="badge num">24</span>', PAS);
  s = rep(s, '.bot .badge{', '.bot .jx-x{');
  // Critique 1 (bloquant 3) : ce qui est en cuve cette semaine est B-031 IPA Nelson, comme « En cuve » ; la Blonde est conditionnée (Lot).
  s = rep(s, "{l:'bra',n:'Blonde d’automne',a:0,b:1,d:'en cuve · J+4',m:-148}", "{l:'bra',n:'IPA Nelson',a:0,b:1,d:'B-031 en cuve · J+4',m:-148}");
  s = rep(s, '<span>Blonde d’automne en cuve</span>', '<span>B-031 IPA Nelson en cuve · J+4</span>');
  // Les lignes « En cuve » mènent à Brassins.
  s = rep(s, `<div class="card"><div class="row"><span class="dot" style="background:#e0a030"></span><span class="t"><b>B-031 IPA Nelson</b><span>fermentation J+4</span></span><span class="v num">1,018</span></div><div class="row"><span class="dot" style="background:#c8702a"></span><span class="t"><b>B-030 Triple d’automne</b><span>garde J+12</span></span><span class="v num">1,010</span></div></div>`,
    `<div class="card"><button class="row" data-go="bra"><span class="dot" style="background:#e0a030"></span><span class="t"><b>B-031 IPA Nelson</b><span>fermentation J+4</span></span><span class="v num">1,018</span><span class="chev">›</span></button><button class="row" data-go="bra"><span class="dot" style="background:#c8702a"></span><span class="t"><b>B-030 Triple d’automne</b><span>garde J+12</span></span><span class="v num">1,010</span><span class="chev">›</span></button></div>`);
  // Mêmes données d'un écran à l'autre : le client du Pont s'appelle Café du Pont partout ; Stocks reprend les 5 articles de la pastille.
  s = rep(s, 'Bar du Pont', 'Café du Pont', 3);
  s = rep(s, "['Commander le froment','5 à commander · Stocks']", "['Commander pour le Porter','5 articles avant S49 · Stocks']");
  s = rep(s, "liste([['Froment malté','à commander','2 kg','var(--bad)'],['Nelson Sauvin','à commander','150 g','var(--bad)'],['Bouteilles 33 cl','à commander','40','var(--bad)'],['Pilsner','ok','25 kg','var(--stk)'],['Capsules','ok','600','var(--stk)']],",
    "liste([['Soude caustique','à commander · S48','1 bidon','var(--fin)'],['Fuggle','à commander · S49 Porter','0,4 kg','var(--fin)'],['Malt chocolat','à commander · S49 Porter','1,2 kg','var(--fin)'],['Munich','à commander · S49 Porter','6 kg','var(--fin)'],['US-05','à commander · S49 Porter','2 sachets','var(--fin)'],['Pale ale','ok','25 kg','var(--stk)'],['Nelson Sauvin','ok','450 g','var(--stk)']],");
  s = rep(s, "['B-029 Blanche au yuzu','58 bouteilles de 33 cl','09.11','#ecd27a']]", "['B-029 Blanche au yuzu','58 bouteilles de 33 cl','09.11','#ecd27a'],['B-028 Blonde d’automne','conditionnée · 6 fûts, 48 btl','02.11','#e8c35a']]");
  // Doute du critique : 259 CHF à côté d'une caisse à 3 872, sans explication → la soustraction est dite.
  s = rep(s, '<span class="l">CHF à te permettre<br><b>au plus serré : S49</b></span></div></div>',
    '<span class="l">CHF à te permettre<br><b>au plus serré : S49</b></span></div><p class="jx-exp">S49 : <b class="num">3 872</b> en caisse, moins <b class="num">3 613</b> déjà promis (loyer, TVA, impôt bière)</p></div>');
  // Critique 6 : un message ne survit pas à un changement d'écran ou d'onglet.
  s = rep(s, ' if(d.tab){S.tab=d.tab;S.plus=false;', ' if(d.tab||d.go||d.sous||d.sec)jxEfface();\n if(d.tab){S.tab=d.tab;S.plus=false;');
  ecrire('onglet', habiller(s, 'Onglet · v1', 74, { bar: 60, h: 80, z: 29 }, '.bot button{position:relative}.jx-exp{margin:8px 0 0;font-size:15px;line-height:1.3;color:var(--mut)}.jx-exp b{color:var(--ink)}'));
}

// ───────────── 2. Fournisseur v1 ─────────────
{
  let s = lire('fournisseur/v1/proto.html');
  s = rep(s, 'S._tt=setTimeout(function(){t.hidden=true},7000)', 'S._tt=setTimeout(function(){t.hidden=true},4000)');
  s = rep(s, '.p1-act{', `.p1-okb{display:flex;align-items:center;gap:8px;margin:10px 12px 0;padding:4px 4px 4px 12px;border-radius:14px;background:var(--okbg);color:var(--ok);font-weight:600;font-size:16px;line-height:1.25}.p1-okb .ico{flex:none}.p1-okb span{flex:1;min-width:0}.p1-okb button{flex:none;min-height:44px;padding:0 10px;border-radius:10px;font-weight:700;color:var(--ink);text-decoration:underline;text-underline-offset:3px}
.p1-lh{margin:0;padding:4px 12px 6px;font-size:34px;font-weight:800;letter-spacing:-.5px}
.p1-fo{display:flex;align-items:center;gap:10px;width:calc(100% - 24px);margin:0 12px;min-height:66px;padding:8px 0;border-top:1px solid var(--line)}.p1-fo:last-child{border-bottom:1px solid var(--line)}
.p1-fo .t{flex:1;min-width:0}.p1-fo b{display:block;font-size:18px}.p1-fo i{display:block;font-style:normal;font-size:15px;color:var(--mut)}.p1-fo .d{font-size:16px;color:var(--fin);font-weight:700;white-space:nowrap}
.p1-act{`);
  // Se corrige : après la réunion, le message cachait un prix 6 s → la confirmation se pose dans la page, en haut.
  s = rep(s, "S.close();render();S.toast((k2+1)+' noms réunis sous Brouwland',function(){st.pris=av;render()})};",
    "S.close();st.fait={n:k2+1,av:av};render()};");
  s = rep(s, ' var sd=st.sel>=0?DEL[st.sel]:null;',
    " if(st.fait)h+='<div class=\"p1-okb\" role=\"status\"><svg class=\"ico\"><use href=\"#i-check\"/></svg><span>'+st.fait.n+' noms réunis sous Brouwland</span><button data-x=\"annul\">Annuler</button><button data-x=\"okf\" aria-label=\"Fermer le message\"><svg class=\"ico\"><use href=\"#i-x\"/></svg></button></div>';\n var sd=st.sel>=0?DEL[st.sel]:null;");
  s = rep(s, "if(ETAT==='apres')S.toast('4 noms réunis sous Brouwland',function(){st.pris={Brouwland:true};render()});",
    "if(ETAT==='apres'){st.fait={n:4,av:{Brouwland:true}};render()}");
  s = rep(s, "else if(x==='scan')", "else if(x==='annul'){st.pris=st.fait.av;st.fait=null;render()}else if(x==='okf'){st.fait=null;render()}else if(x==='scan')");
  // Le retour « Fournisseurs » mène à une vraie liste, d'où l'on rouvre Brouwland ou la fiche vide.
  s = rep(s, "var st={pris:{Brouwland:true},tard:false,ouv:-1,fac:false,sel:-1,vide:ETAT==='vide',r:{}};",
    "var st={pris:{Brouwland:true},tard:false,ouv:-1,fac:false,sel:-1,vide:ETAT==='vide',r:{},liste:ETAT==='liste',fait:null};");
  s = rep(s, "function render(){\n var h='';",
    `function render(){
 var h='';S.$('.s-back').style.visibility=st.liste?'hidden':'';
 if(st.liste){S.volant(null);var nr=reste().length;h+='<h1 class="p1-lh">Fournisseurs</h1>'+[['brouwland','Brouwland','Belgique · '+FAC.filter(function(f){return ici(f[2])}).length+' factures'+(nr?' · '+(nr+1)+' noms':''),'6 j'],['lac','Malterie du Lac','Suisse · aucune facture encore','? j'],['hop','Hopsteiner','Allemagne · 3 factures','8 j']].map(function(r){return '<button class="p1-fo s-press" data-fo="'+r[0]+'"><span class="t"><b>'+r[1]+'</b><i>'+r[2]+'</i></span><span class="d num">'+r[3]+'</span></button>'}).join('');M.innerHTML=h;
  S.$$('[data-fo]',M).forEach(function(b){b.onclick=function(){var f=b.dataset.fo;if(f==='hop'){S.toast('exemple : la fiche Hopsteiner n’est pas jouée ici');return}st.liste=false;st.vide=f==='lac';S.volant(st.vide?'Malterie du Lac':'Brouwland');render();scrollTo(0,0)}});return}`);
  s = rep(s, "S.volant(st.vide?'Malterie du Lac':'Brouwland');\nrender();",
    `S.$('.s-back').onclick=function(){st.liste=true;st.fac=false;st.ouv=-1;render();scrollTo(0,0)};
S.$$('.s-bot a').forEach(function(a){a.onclick=function(e){e.preventDefault();if(a.classList.contains('on'))return;S.toast('exemple : l’onglet '+a.textContent.trim()+' s’ouvrirait ici')}});
S.volant(st.vide?'Malterie du Lac':'Brouwland');
render();`);
  s = rep(s, "S.$('#s-dim').addEventListener('click',S.close);",
    `S.$('#s-dim').addEventListener('click',S.close);jxGlisse(S.$('#s-sheet'),S.close);
(function(){var vo=S.volant;S.volant=function(nom){if(nom)return vo(nom);var v=S.$('#s-vol');v.innerHTML='<span class="lab">Partout</span><div class="gr">'+[['Nouvelle écriture','i-ecr'],['Encaisser','i-vente'],['Lancer un brassin','i-beer'],['Compagnon','i-bulle']].map(function(a){return '<button class="pi s-press" data-act="'+a[0]+'">'+a[0]+'<span class="ic"><svg class="ico"><use href="#'+a[1]+'"/></svg></span></button>'}).join('')+'</div><span class="lab">Fournisseurs</span><button class="pi big s-press main" data-act="Nouveau fournisseur"><span>Nouveau fournisseur<i>nom, pays, site</i></span><span class="ic"><svg class="ico"><use href="#i-plus"/></svg></span></button>';S.$$('[data-act]',v).forEach(function(b){b.onclick=function(){S.close();S.toast('exemple : ouvrirait « '+b.dataset.act+' »')}})}})();`);
  // Critique 6 : quitter la fiche ou en ouvrir une efface le message en cours.
  s = rep(s, "S.$('.s-back').onclick=function(){st.liste=true;", "S.$('.s-back').onclick=function(){jxEfface();st.liste=true;");
  s = rep(s, "st.liste=false;st.vide=f==='lac';", "jxEfface();st.liste=false;st.vide=f==='lac';");
  // Critique 8 : l'icône du bouton principal du + (« Pourquoi lui ») bien contrastée.
  s = rep(s, '.pi.main i{color:inherit;opacity:.8}', '.pi.main i{color:inherit;opacity:.8}.pi.main .ic{background:var(--onact);color:var(--act)}.pi.main .ic .ico{stroke-width:2.4}');
  s = rep(s, 'Stocks</a>', PAS + 'Stocks</a>');
  ecrire('fournisseur', habiller(s, 'Fournisseur · v1', 74, { bar: 60, h: 80, z: 29 }));
}

// ───────────── 3. Suppression v2 ─────────────
{
  let s = lire('suppression/v2/proto.html');
  // Se corrige (pour les trois) : le client coupé « chez Café du … » s'écrit en entier.
  s = rep(s, '.row .tx b{display:block;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}', '.row .tx b{display:block;font-size:17px;line-height:1.2}');
  s = rep(s, '.row .tx span{display:block;font-size:15px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}', '.row .tx span{display:block;font-size:15px;color:var(--mut);line-height:1.25}');
  s = rep(s, '.v2-foot{margin-top:14px}', `.v2-foot{margin-top:14px}
.jm-top{display:flex;align-items:center;justify-content:space-between}.jm-ret{display:inline-flex;align-items:center;gap:2px;min-height:44px;padding:0 10px 0 0;color:var(--fin);font-weight:700;font-size:17px}
.jm-h{margin:4px 0 2px;font-size:24px;font-weight:800}.jm-s{margin:0 0 12px;color:var(--mut);font-size:15px}
.jm-c{border:1.5px solid var(--line);border-radius:14px;overflow:hidden;margin-bottom:14px}.jm-c div{display:flex;justify-content:space-between;gap:10px;padding:11px 12px;border-top:1px solid var(--line);font-size:16px}.jm-c div:first-child{border-top:0}.jm-c span{color:var(--mut)}.jm-c b{text-align:right}
.jm-q{margin:0 0 8px;font-size:17px;font-weight:700}.jm-m{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.jm-m button{min-height:46px;padding:0 16px;border-radius:999px;border:1.5px solid var(--line2);font-size:16px}.jm-m button[aria-pressed=true]{background:var(--act);color:var(--onact);border-color:var(--act);font-weight:700}`);
  // Onglet v1 choisi : Calendrier entre Finances et Brassins, partout.
  s = rep(s, 'Finances</a><a data-n="bra"', 'Finances</a><a data-n="cal" href="#"><svg class="ico" style="color:var(--prod)"><use href="#i-cal"/></svg>Calendrier</a><a data-n="bra"');
  // Se corrige : « Vidé » ouvre l'écran du mouvement de stock, au lieu d'écrire un mouvement juste pour supprimer.
  s = rep(s, "$$('[data-f]',r).forEach(function(b){b.onclick=function(){it.l[+b.dataset.f].ok=true;redraw();render()}});",
    "$$('[data-f]',r).forEach(function(b){b.onclick=function(){var x=it.l[+b.dataset.f];if(x.fix==='Vidé'){mouvement(it,x);return}x.ok=true;redraw();render()}});");
  s = rep(s, '\nvar V={html:', `
function mouvement(it,x){var sh=$('#sh'),fut=S.k==='fut'?it.n:x.n,lot=S.k==='fut'?x.n:it.n,m=(x.n+' '+x.d).match(/(\\d+) L/),q=m?m[1]:'',motif=null;
 function draw(){sh.innerHTML='<div class="grip"></div><div class="jm-top"><button class="jm-ret" data-jm="ret">'+ic('i-chev','transform:rotate(90deg)')+'Liens de '+it.c+'</button><span class="ex">exemple</span></div><h2 class="jm-h">Mouvement de stock</h2><p class="jm-s">Sortie · aujourd’hui 16.11 · l’écran habituel de Stocks</p>'+
  '<div class="jm-c"><div><span>Fût</span><b>'+fut+'</b></div><div><span>Bière</span><b>'+lot+'</b></div><div><span>Quantité</span><b class="num">'+q+' L</b></div></div>'+
  '<p class="jm-q">Où sont partis ces '+q+' L ?</p><div class="jm-m">'+['Vendus','Perdus, versés','Transvasés'].map(function(t){return '<button data-mo="'+t+'" aria-pressed="'+(motif===t)+'">'+t+'</button>'}).join('')+'</div>'+
  '<button class="btn pri" data-jm="ok"'+(motif?'':' disabled')+'>'+ic('i-check')+'Enregistrer la sortie</button><button class="btn sec" data-jm="ret">Retour aux liens</button>';
  $$('[data-mo]',sh).forEach(function(b){b.onclick=function(){motif=b.dataset.mo;draw()}});
  $$('[data-jm=ret]',sh).forEach(function(b){b.onclick=function(){redraw()}});
  $('[data-jm=ok]',sh).onclick=function(){if(!motif)return;x.ok=true;x.fait='sortie de '+q+' L enregistrée · '+motif.toLowerCase();redraw();render()}}
 draw();sh.scrollTop=0}
var V={html:`);
  s = rep(s, "libre:function(){S.k='fut';render();$('[data-del=\"F-07\"]').click();$('#sh [data-f=\"0\"]').click();$('#sh [data-f=\"1\"]').click();$('#sh [data-f=\"2\"]').click()}}};",
    "libre:function(){S.k='fut';render();$('[data-del=\"F-07\"]').click();$('#sh [data-f=\"0\"]').click();$('#sh [data-f=\"1\"]').click();$('#sh [data-mo=\"Vendus\"]').click();$('#sh [data-jm=\"ok\"]').click();$('#sh [data-f=\"2\"]').click()},\n  mouvement:function(){S.k='fut';render();$('[data-del=\"F-07\"]').click();$('#sh [data-f=\"1\"]').click()}}};");
  s = rep(s, "$('#dim').onclick=closeSheet;",
    "$('#dim').onclick=closeSheet;jxGlisse($('#sh'),closeSheet);\n$$('.bot a').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();if(a.classList.contains('on'))return;jxDit('exemple : l’onglet '+a.textContent.trim()+' s’ouvrirait ici')})});");
  // Critique 1 (bloquant 1) : le + est une pilule (« + Brassin », « + Fût ») : le message se pose AU-DESSUS du +,
  // 10 px plus haut que lui, sur toute la largeur ; il ne le touche plus (le proto le posait déjà là, bottom 138).
  s = rep(s, 'Stocks</a>', PAS + 'Stocks</a>');
  // Doute : toucher une ligne (fût, client…) ne restait sans effet que sur la corbeille.
  s = rep(s, "$('#dim').onclick=closeSheet;jxGlisse", "$('#list').addEventListener('click',function(e){var r=e.target.closest('.row');if(!r||e.target.closest('button'))return;var b=r.querySelector('.tx b');jxDit('exemple : ouvrirait la fiche '+(b?b.textContent:''))});\n$('#dim').onclick=closeSheet;jxGlisse");
  ecrire('suppression', habiller(s, 'Suppression · v2', 138, { bar: 58, h: 76, z: 29 }, '.jx-toast{right:12px}.bot a{position:relative}#list .row{cursor:pointer}'));
}

// ───────────── 4. Lot v1 ─────────────
{
  let s = lire('lot/v1/proto.html');
  // Se corrige : le + proposait « Mesure de densité » sur un lot en fûts ; retirée, remplacée par « Rentrer un fût ».
  s = rep(s, '<button data-dial-action="densite"><span>Mesure de densité<small>pavé, valeur proposée</small></span><svg class="ico"><use href="#i-densite"/></svg></button>',
    '<button data-dial-action="rentrer"><span>Rentrer un fût<small>vide, retour en cave</small></span><svg class="ico"><use href="#i-fut"/></svg></button>');
  s = rep(s, 'function set(o){fab.setAttribute', "function set(o){var jt=document.getElementById('jx-toast');if(o&&jt)jt.hidden=true;fab.setAttribute");
  s = rep(s, "$$('[data-dial-action]').forEach(function(b){b.addEventListener('click',function(){set(false);if(b.dataset.dialAction==='lot'&&window.surLot)window.surLot()})});",
    "$$('[data-dial-action]').forEach(function(b){b.addEventListener('click',function(){set(false);var a=b.dataset.dialAction;if(a==='lot'&&window.surLot)window.surLot();else if(window.jxAction)window.jxAction(a)})});");
  s = rep(s, '.v1leg{', `.sheet{max-height:86vh;overflow:auto}
.jxs-h{margin:0 0 4px;font-size:22px;font-weight:800}.jxs-p{margin:0 0 10px;color:var(--mut);font-size:16px;line-height:1.3}
.jxs-b{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:60px;padding:8px 4px;border-top:1px solid var(--line);font-size:17px;text-align:left}
.jxs-b span{flex:1;min-width:0}.jxs-b small{display:block;font-size:15px;color:var(--mut)}
.jxs-b em{flex:none;font-style:normal;font-size:14px;font-weight:700;color:var(--ok);border:1.5px solid var(--ok);border-radius:999px;padding:2px 8px;white-space:nowrap}
.jxs-f{display:block;margin-top:12px;width:100%;min-height:50px;border-radius:14px;background:var(--s2);font-weight:700;font-size:17px;text-align:center}
.jxbra{display:none}body.jx-liste .jxbra{display:block}
body.jx-liste .lots,body.jx-liste .v1h,body.jx-liste .v1t,body.jx-liste #recu,body.jx-liste .v1lead,body.jx-liste .v1leg,body.jx-liste .v1arbre{display:none!important}
.jxbra h1{margin:0;padding:10px 12px 6px;font-size:30px;font-weight:800}
.jxbra button{display:flex;align-items:center;gap:10px;width:calc(100% - 24px);margin:0 12px;min-height:66px;padding:8px 0;border-top:1px solid var(--line);text-align:left}
.jxbra button span{flex:1;min-width:0}.jxbra b{display:block;font-size:18px}.jxbra small{display:block;font-size:15px;color:var(--mut)}
.v1leg{`);
  s = rep(s, '<div class="v1h"><a href="#">', '<div class="jxbra" id="jxBra"></div>\n<div class="v1h"><a href="#" data-jxret>');
  s = rep(s, '<div class="voile" data-voile hidden></div>', '<div class="voile" data-voile hidden></div><div class="voile" data-jxv hidden></div><div class="sheet" data-jxs role="dialog" hidden></div>');
  s = rep(s, "window.surLot=function(){$('#recu').scrollIntoView({behavior:'smooth'})};",
    `window.surLot=function(){$('#recu').scrollIntoView({behavior:'smooth'})};
var SH=$('[data-jxs]'),SV=$('[data-jxv]');function fermer(){SH.hidden=true;SV.hidden=true}SV.addEventListener('click',fermer);jxGlisse(SH,fermer);
function feuille(h){var jt=document.getElementById('jx-toast');if(jt)jt.hidden=true;SH.innerHTML=h+'<button class="jxs-f" data-jxf>Fermer</button>';SH.hidden=false;SV.hidden=false;SH.scrollTop=0;$('[data-jxf]',SH).onclick=fermer}
function livrer(){var L=LOTS[cur];if(!L.cave||!L.cave.futs.length){feuille('<h3 class="jxs-h">Rien à livrer</h3><p class="jxs-p">'+(L.cond?'Plus aucun fût du lot '+L.lot+' en cave.':'Le lot '+L.lot+' est encore en cuve.')+'</p>');return}
 var f=L.cave.futs[0],pro=L.clients.filter(function(c){return c.futs.some(function(x){return x.etat==='entamé'})})[0]||L.clients[0],cl=[pro].concat(L.clients.filter(function(c){return c!==pro}));
 feuille('<h3 class="jxs-h">Livrer '+f+'</h3><p class="jxs-p">'+L.biere+' · lot '+L.lot+' · à qui ?</p>'+cl.map(function(c){return '<button class="jxs-b" data-liv="'+c.id+'"><span>'+c.nom+'<small>'+(chez(c).length?chez(c).length+' fût'+(chez(c).length>1?'s':'')+' chez lui':'tout est rentré')+'</small></span>'+(c===pro?'<em>proposé</em>':'')+'</button>'}).join(''));
 $$('[data-liv]',SH).forEach(function(b){b.onclick=function(){var c=L.clients.filter(function(x){return x.id===b.dataset.liv})[0],x={f:f,liv:AUJ,ret:null,etat:'plein'};c.futs.push(x);L.cave.futs.splice(L.cave.futs.indexOf(f),1);fermer();ouvert=c.id;rend();jxDit(f+' livré à '+c.nom+' · exemple',function(){c.futs.splice(c.futs.indexOf(x),1);L.cave.futs.unshift(f);rend()})}})}
function rentrer(){var L=LOTS[cur],dh=[];L.clients.forEach(function(c){chez(c).forEach(function(x){dh.push([c,x])})});
 if(!dh.length){feuille('<h3 class="jxs-h">Rien à rentrer</h3><p class="jxs-p">'+(L.clients.length?'Tous les fûts du lot '+L.lot+' sont rentrés.':'Aucun fût du lot '+L.lot+' n’est sorti.')+'</p>');return}
 feuille('<h3 class="jxs-h">Rentrer un fût</h3><p class="jxs-p">'+L.biere+' · lot '+L.lot+' · lequel revient ?</p>'+dh.map(function(p,i){return '<button class="jxs-b" data-ren="'+i+'"><span><b class="num">'+p[1].f+'</b> · '+p[0].nom+'<small>livré le '+p[1].liv+' nov. · '+p[1].etat+'</small></span></button>'}).join(''));
 $$('[data-ren]',SH).forEach(function(b){b.onclick=function(){var p=dh[+b.dataset.ren],x=p[1],av=x.etat;x.ret=AUJ;x.etat='rentré';fermer();ouvert=p[0].id;rend();jxDit(x.f+' rentré de chez '+p[0].nom+' · exemple',function(){x.ret=null;x.etat=av;rend()})}})}
window.jxAction=function(a){if(a==='livrer')livrer();else if(a==='rentrer')rentrer();else jxDit('exemple : ouvrirait « '+(a==='ecriture'?'Nouvelle écriture':'Facture')+' »')};
document.addEventListener('click',function(e){var t=e.target.closest('[data-tel]');if(!t)return;var c=LOTS[cur].clients.filter(function(x){return x.id===t.closest('[data-client]').dataset.client})[0];jxDit('exemple : appellerait '+c.qui+' au '+c.tel.replace(/ /g,' '))});
function liste(){document.body.classList.add('jx-liste');scrollTo(0,0);$('#jxBra').innerHTML='<h1>Brassins</h1>'+[41,42].map(function(k){var L=LOTS[k];return '<button data-jxlot="'+k+'"><span><b>'+L.biere+'</b><small>lot '+L.lot+' · brassé '+L.brasse+(L.cond?' · conditionné '+L.cond:' · en cuve')+'</small></span><svg class="ico" style="transform:rotate(-90deg);color:var(--mut)"><use href="#i-chev"/></svg></button>'}).join('');
 $$('[data-jxlot]').forEach(function(b){b.onclick=function(){cur=+b.dataset.jxlot;ouvert=null;document.body.classList.remove('jx-liste');rend();scrollTo(0,0)}})}
$('[data-jxret]').addEventListener('click',function(e){e.preventDefault();liste()});
$$('.bot a').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();if(a.classList.contains('on')){if(document.body.classList.contains('jx-liste'))return;liste();return}jxDit('exemple : l’onglet '+a.textContent.trim()+' s’ouvrirait ici')})});`);
  s = rep(s, "rend();if(Q.get('etat')==='plus')ouvrirDial();",
    "rend();if(Q.get('etat')==='plus')ouvrirDial();if(Q.get('etat')==='livrer')livrer();if(Q.get('etat')==='rentrer')rentrer();if(Q.get('etat')==='liste')liste();");
  s = rep(s, 'body{min-height:100vh;padding-bottom:150px}', 'body{min-height:100vh;padding-bottom:162px}');
  // Critique 4 et 5 : la liste Brassins porte « exemple », et chaque lot un « › » (toucher l'ouvre).
  s = rep(s, "$('#jxBra').innerHTML='<h1>Brassins</h1>'", "jxEfface();$('#jxBra').innerHTML='<div class=\"jxbra-h\"><h1>Brassins</h1><span class=\"ex\">exemple</span></div>'");
  s = rep(s, `<svg class="ico" style="transform:rotate(-90deg);color:var(--mut)"><use href="#i-chev"/></svg></button>'`, `<span class="jxbra-c" aria-hidden="true">›</span></button>'`);
  s = rep(s, "cur=+b.dataset.jxlot;ouvert=null;", "jxEfface();cur=+b.dataset.jxlot;ouvert=null;");
  // Doute : « Qui a reçu ce lot » dans le + de l'écran qui le montre déjà → retiré.
  s = rep(s, '<button data-dial-action="lot" class=""><span>Qui a reçu ce lot<small>4 clients</small></span><svg class="ico"><use href="#i-users"/></svg></button>\n', '');
  // Mêmes données d'un écran à l'autre : le 2e lot est l'IPA Nelson B-031 en cuve (Bord), pas le Porter (brassé en S50) ;
  // la Blonde est le B-028 ; les fûts ne reprennent pas les numéros de Suppression (F-03 à F-21).
  s = rep(s, '<button data-lot="41" aria-pressed="true">Blonde · lot 41</button><button data-lot="42" aria-pressed="false">Porter · lot 42</button>',
    '<button data-lot="41" aria-pressed="true">Blonde · lot 28</button><button data-lot="42" aria-pressed="false">IPA Nelson · lot 31</button>');
  s = rep(s, `41:{biere:"Blonde d'automne",lot:41,`, `41:{biere:"Blonde d'automne",lot:28,`);
  s = rep(s, `42:{biere:"Porter d'hiver",lot:42,brasse:"9 nov."`, `42:{biere:"IPA Nelson",lot:31,brasse:"12 nov."`);
  for (const [a, b] of [['F12', 'F-22'], ['F07', 'F-23'], ['F03', 'F-24'], ['F09', 'F-25'], ['F15', 'F-26'], ['F21', 'F-27']]) s = rep(s, `"${a}"`, `"${b}"`);
  // Doute : « Encore en cave » ouvre « Livrer F-27 » ; le marché sans nom dit pourquoi il n'a pas de fiche.
  s = rep(s, `<span class="num">'+L.cave.btl+'</span> btl</span></span></div></div>';`, `<span class="num">'+L.cave.btl+'</span> btl</span></span><span class="pill jx-liv">Livrer ›</span></div></div>';`);
  s = rep(s, "window.jxAction=function(a){", `document.addEventListener('click',function(e){if(e.target.closest('.v1cave')){livrer();return}var m=e.target.closest('.v1anon');if(m){var L=LOTS[cur];jxDit('exemple : '+L.marche.btl+' btl vendues au '+L.marche.nom+', sans nom de client')}});
window.jxAction=function(a){`);
  s = rep(s, "$$('.bot a').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();if(a.classList.contains('on')){if(document.body.classList.contains('jx-liste'))return;liste();return}",
    "$$('.bot a').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();if(a.classList.contains('on')){if(document.body.classList.contains('jx-liste'))return;liste();return}jxEfface();");
  s = rep(s, 'Stocks</a>', PAS + 'Stocks</a>');
  ecrire('lot', habiller(s, 'Lot · v1', 76, { bar: 62, h: 82, z: 29 }, '.bot a{position:relative}.jxbra-h{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-right:12px}.jxbra button .jxbra-c{flex:none;font-size:28px;line-height:1;color:var(--mut);padding:0 4px}.v1cave,.v1anon{cursor:pointer}.jx-liv{flex:none;margin-left:auto;font-weight:700;color:var(--ink)}'));
}

// ───────────── 5. Pastille (seuil v3, C) ─────────────
{
  let s = lire('seuil/v3/proto.html');
  // Les cinq rubriques de Stocks tiennent sur la largeur : aucune coupée au bord.
  s = rep(s, '.tabs button{flex:none;height:38px;padding:0 13px;border-radius:10px;font-size:16px;color:var(--mut)}', '.tabs button{flex:1 1 auto;height:38px;padding:0 6px;border-radius:10px;font-size:15px;color:var(--mut)}');
  // Se corrige : en mode Tout, le + couvrait une quantité → marge sous la liste, au-dessus du +.
  s = rep(s, 'body{min-height:100vh;padding-bottom:170px}', 'body{min-height:100vh;padding-bottom:176px}');
  s = rep(s, '.fab .ico{width:28px;height:28px;stroke-width:2.5}', `.fab .ico{width:28px;height:28px;stroke-width:2.5;transition:transform .15s}.fab[aria-expanded=true] .ico{transform:rotate(45deg)}.fab{z-index:8}
.jxv{position:fixed;inset:0;z-index:6;background:color-mix(in srgb,var(--bg) 70%,transparent);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}
.jxd{position:fixed;left:14px;right:12px;bottom:162px;z-index:7;display:flex;flex-direction:column;gap:8px}
.jxd h4{align-self:flex-end;margin:4px 0 0;font-size:16px;background:var(--bg);border:1px solid var(--line);border-radius:999px;padding:6px 14px}
.jxd{pointer-events:none}.jxd button{pointer-events:auto;display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:58px;padding:8px 10px 8px 18px;border-radius:29px;background:var(--s1);border:1px solid var(--line);font-size:18px;text-align:left}
.jxd button small{display:block;font-size:15px;color:var(--mut)}.jxd button.fort{background:var(--act);color:var(--onact);border-color:var(--act)}.jxd button.fort small{color:inherit;opacity:.8}
.jxd .ico{width:40px;height:40px;padding:9px;border-radius:20px;background:var(--bg);color:var(--ink)}`);
  s = rep(s, '<button class="fab" aria-label="Ajouter">', `<div class="jxv" data-jxv hidden></div><div class="jxd" data-jxd hidden><h4>Partout</h4><button data-jxa="Nouvelle écriture">Nouvelle écriture<svg class="ico" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button><h4>Sur Stocks</h4><button data-jxa="Inventaire"><span>Inventaire<small>compter ce qui reste</small></span><svg class="ico" viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg></button><button data-jxa="Entrée de stock" class="fort"><span>Entrée de stock<small>une livraison arrive</small></span><svg class="ico" viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><circle cx="16" cy="15" r="4"/><circle cx="12" cy="8" r="4"/></svg></button></div>
<button class="fab" aria-label="Ajouter" aria-expanded="false">`);
  s = rep(s, "rendre();if(Q.get('etat')==='geste')geste();",
    `const fab=$('.fab'),dv=$('[data-jxd]'),vv=$('[data-jxv]');function menu(o){fab.setAttribute('aria-expanded',o);dv.hidden=!o;vv.hidden=!o}
fab.onclick=()=>menu(fab.getAttribute('aria-expanded')!=='true');vv.onclick=()=>menu(false);
for(const b of $$('[data-jxa]'))b.onclick=()=>{menu(false);jxDit('exemple : ouvrirait « '+b.dataset.jxa+' »')};
for(const b of $$('.tabs button'))b.onclick=()=>{if(!b.classList.contains('on'))jxDit('exemple : ce choix se joue sur Articles')};
$('#v3l').addEventListener('click',e=>{const r=e.target.closest('.row');if(!r)return;jxDit('exemple : fiche '+r.querySelector('.nm').textContent+' · '+r.querySelector('.q').textContent+' · '+r.querySelector('.sb').textContent)});
$('#cta').onclick=()=>jxDit('exemple : ouvrirait la commande de '+$('#big').textContent+' articles');
$('.hbtn').onclick=()=>jxDit('exemple : la liste en plein écran');
for(const a of $$('.nav a'))a.onclick=e=>{e.preventDefault();if(!a.classList.contains('on'))jxDit('exemple : l’onglet '+a.textContent.replace(/\\d+/g,'').trim()+' s’ouvrirait ici')};
rendre();if(Q.get('etat')==='geste')geste();if(Q.get('etat')==='six'){H=52;rendre()}if(Q.get('etat')==='plus')menu(true);`);
  // Critique 7 : « Avant S49, par semaine » se trie par semaine (Soude S48 en tête).
  s = rep(s, 'X=L.filter(a=>(a.sem||99)<=H);', 'X=L.filter(a=>(a.sem||99)<=H).sort((a,b)=>(a.sem||99)-(b.sem||99));');
  // Doute : Citra dans un Porter, rare → Fuggle, houblon anglais du style.
  s = rep(s, "{n:'Citra',q:'0,4 kg',sem:49,pour:'Porter'}", "{n:'Fuggle',q:'0,4 kg',sem:49,pour:'Porter'}");
  // Critique 6 : changer d'horizon efface le message en cours.
  s = rep(s, 'for(const b of $$(\'#seg button\'))b.onclick=()=>{H=+b.dataset.h;rendre()};', 'for(const b of $$(\'#seg button\'))b.onclick=()=>{jxEfface();H=+b.dataset.h;rendre()};');
  // Critique 9 : la barre du bas est celle d'Onglet v1 (six onglets, icônes en couleur, onglet actif marqué pareil, 60 px),
  // avec la pastille C (#pas) sur Stocks. Le + et sa bande descendent de 18 px avec elle.
  const og = lire('onglet/v1/proto.html');
  const sym = (id) => { const m = og.match(new RegExp(`<symbol id="${id}"[\\s\\S]*?</symbol>`)); if (!m) throw new Error('symbole ' + id); return m[0]; };
  const SPR = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' + ['i-bord', 'i-wallet', 'i-cal', 'i-beer', 'i-boxes', 'i-users'].map(sym).join('') + '</svg>';
  const it = (ic, col, nom, on, extra = '') => `<a${on ? ' class="on" aria-current="page"' : ''}><svg class="ico"${col ? ` style="color:${col}"` : ''}><use href="#${ic}"/></svg>${nom}${extra}</a>`;
  const NAV = SPR + '<nav class="nav jx-nav">' + it('i-bord', '', 'Bord') + it('i-wallet', 'var(--fin)', 'Finances') + it('i-cal', 'var(--prod)', 'Calendrier') + it('i-beer', 'var(--prod)', 'Brassins') + it('i-boxes', 'var(--stk)', 'Stocks', true, '<b class="pas" id="pas"></b>') + it('i-users', '', 'Clients') + '</nav>';
  const nv = s.match(/<nav class="nav">[\s\S]*?<\/nav>/g);
  if (!nv || nv.length !== 1) throw new Error('nav pastille');
  s = rep(s, nv[0], NAV);
  s = rep(s, '.fab{position:fixed;right:12px;bottom:92px;', '.fab{position:fixed;right:12px;bottom:74px;');
  s = rep(s, '.jxd{position:fixed;left:14px;right:12px;bottom:162px;', '.jxd{position:fixed;left:14px;right:12px;bottom:144px;');
  s = rep(s, 'body{min-height:100vh;padding-bottom:176px}', 'body{min-height:100vh;padding-bottom:158px}');
  ecrire('pastille', habiller(s, 'Pastille · C', 74, { bar: 60, h: 80, z: 4 }, `:root{--prod:#9a4f1e}html[data-theme=cave]{--prod:#e7a070}
.nav.jx-nav{height:60px;display:flex;background:var(--s1);border-top:1px solid var(--line)}
.nav.jx-nav a{flex:1;gap:2px;font-size:14px;min-width:0;letter-spacing:-.15px;white-space:nowrap;color:var(--ink)}
.nav.jx-nav a.on{background:var(--botOn);font-weight:700;box-shadow:inset 0 3px 0 var(--prod)}
.nav.jx-nav a.on::before{display:none}.nav.jx-nav a .ico{width:22px;height:22px}`));
}
