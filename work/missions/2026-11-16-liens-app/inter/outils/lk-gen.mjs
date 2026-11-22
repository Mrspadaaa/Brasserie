// Mini maquettes d'interaction L1, L29, L14 (16.11 soir). Chaque vue = la base choisie copiée telle quelle
// + une surcouche préfixée lk- (CSS, sprite, script) insérée avant le dernier </body> (indices, sans remplacement).
// node work/missions/2026-11-16-liens-app/inter/outils/lk-gen.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const INTER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const M = path.resolve(INTER, '../..');
const BASES = {
  gd1: path.join(M, '2026-11-16-calendrier/paliers/g-d1.html'),
  lot: path.join(M, '2026-11-16-choix-ouverts/lot/v1/proto.html'),
  four: path.join(M, '2026-11-16-choix-ouverts/fournisseur/v1/proto.html'),
  stk: path.join(M, '2026-11-16-choix-ouverts/seuil/v3/proto.html'),
  carnet: path.join(M, '2026-11-16-carnet-decision/r3/c5/proto.html'),
};

const CSS = `
:root{--lki:#8a5d00}html[data-theme=cave]{--lki:#e8b84a}
.lk-ic{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}
.lk-doigt{position:fixed;z-index:9990;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(20,20,20,.22);border:2px solid rgba(20,20,20,.6);box-shadow:0 0 0 8px rgba(20,20,20,.08);pointer-events:none}
html[data-theme=cave] .lk-doigt{background:rgba(255,255,255,.28);border-color:rgba(255,255,255,.85);box-shadow:0 0 0 8px rgba(255,255,255,.1)}
.lk-doigt.long::after{content:'';position:absolute;inset:-11px;border-radius:50%;background:conic-gradient(var(--lki) 0 74%,transparent 0);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 4px),#000 calc(100% - 3.5px));mask:radial-gradient(farthest-side,transparent calc(100% - 4px),#000 calc(100% - 3.5px))}
.lk-tip{position:fixed;z-index:60;display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 14px 0 10px;border-radius:999px;background:var(--sheet,var(--bg));border:1.5px solid var(--line2);color:var(--ink);font-size:15px;font-weight:700;white-space:nowrap;box-shadow:0 8px 20px rgba(0,0,0,.22)}
.lk-tip .lk-ic{color:var(--lki)}
.lk-pop{position:fixed;z-index:60;width:296px;background:var(--sheet,var(--bg));border:1.5px solid var(--line2);border-radius:16px;box-shadow:0 14px 30px rgba(0,0,0,.28);padding:12px 14px 12px}
.lk-pop::before{content:'';position:absolute;top:-8.5px;left:var(--ax,50%);width:14px;height:14px;background:var(--sheet,var(--bg));border-left:1.5px solid var(--line2);border-top:1.5px solid var(--line2);transform:translateX(-50%) rotate(45deg)}
.lk-pk{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:700;color:var(--lki)}.lk-pk .lk-ic{width:18px;height:18px}
.lk-pt{display:block;font-size:19px;font-weight:700;margin:4px 0 2px;color:var(--ink);line-height:1.25}
.lk-pm{display:block;font-size:15px;color:var(--mut);line-height:1.35}
.lk-pa{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}
.lk-b1{display:inline-flex;align-items:center;gap:6px;height:44px;padding:0 16px;border-radius:12px;background:var(--act);color:var(--onact);font-weight:700;font-size:16px;white-space:nowrap}
.lk-b2{display:inline-flex;align-items:center;gap:6px;height:44px;padding:0 14px;border-radius:12px;border:1.5px solid var(--line2);color:var(--ink);font-weight:600;font-size:16px;white-space:nowrap;background:none}
.lk-b1 .lk-ic,.lk-b2 .lk-ic{width:18px;height:18px}
.lk-pr{display:flex;align-items:center;gap:10px;min-height:52px;border-top:1px solid var(--line);font-size:17px;color:var(--ink)}
.lk-pr:first-of-type{border-top:0}.lk-pr span{flex:1;min-width:0}.lk-pr small{display:block;font-size:14px;color:var(--mut)}.lk-pr .lk-ic{color:var(--mut)}.lk-pr .lk-ic.i{color:var(--lki)}
.lk-pr.neuf b{color:var(--ink)}.lk-pr.neuf small{color:var(--lki);font-weight:600}
.lk-halo{border-radius:50%;box-shadow:0 0 0 3px color-mix(in srgb,var(--lki) 30%,transparent);background:color-mix(in srgb,var(--lki) 16%,transparent)}
.lk-n{position:absolute;top:-15px;right:-9px;min-width:18px;height:18px;border-radius:9px;background:var(--lki);color:var(--bg);font-size:14px;font-weight:800;line-height:18px;text-align:center;padding:0 4px;font-style:normal}
/* feuille de dictée (vocabulaire k13 de la base) */
.lk-f .k13-said{flex:1;min-width:0}.lk-f .k13-said small{display:block;font-size:14px;color:var(--mut);font-style:normal;margin-top:2px}
.lk-wk{display:grid!important;grid-template-columns:repeat(6,1fr);gap:6px;overflow:visible!important}.lk-wk .k13-v{min-width:0;padding:0;height:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05;font-size:16px}.lk-wk .k13-v small{font-size:14px;font-weight:400;opacity:.8}
.lk-act{display:flex;gap:8px;margin-top:10px}.lk-act .lk-b2{flex:none}.lk-act .lk-b1{flex:1;justify-content:center}
.lk-car{display:inline-block;width:2px;height:20px;background:var(--ink);vertical-align:-4px;margin-left:2px}
/* bulle d'appui long (l1-b) */
.lk-bul{position:fixed;z-index:60;left:12px;right:12px;background:var(--sheet,var(--bg));border:1.5px solid var(--line2);border-radius:18px;box-shadow:0 16px 34px rgba(0,0,0,.3);padding:10px 12px 12px}
.lk-bul::before{content:'';position:absolute;top:-8.5px;left:var(--ax,50%);width:14px;height:14px;background:var(--sheet,var(--bg));border-left:1.5px solid var(--line2);border-top:1.5px solid var(--line2);transform:translateX(-50%) rotate(45deg)}
.lk-bh{display:flex;align-items:center;gap:6px;font-size:15px;font-weight:700;color:var(--lki);min-height:28px}.lk-bh .lk-ic{width:18px;height:18px}.lk-bh span{margin-left:auto;color:var(--mut);font-weight:400;font-size:14px}
.lk-bd{display:flex;align-items:center;gap:12px;padding:6px 0 4px}
.lk-mic{width:52px;height:52px;border-radius:50%;background:var(--bad);color:#fff;display:grid;place-items:center;flex:none;box-shadow:0 0 0 8px color-mix(in srgb,var(--bad) 20%,transparent)}
.lk-mic .lk-ic{width:24px;height:24px}
.lk-said{margin:0;font-size:18px;line-height:1.3;color:var(--ink);flex:1;min-width:0}
.lk-bf{display:flex;align-items:center;gap:8px;margin-top:6px}.lk-bf .lk-b1{margin-left:auto}
/* glisser le + (l1-c) */
.lk-ghost{position:fixed;z-index:34;width:56px;height:56px;border-radius:50%;border:2px dashed var(--line2);background:color-mix(in srgb,var(--bg) 60%,transparent)}
.lk-drag{position:fixed;z-index:61;width:58px;height:58px;margin:-29px 0 0 -29px;border-radius:50%;background:var(--act);color:var(--onact);display:grid;place-items:center;box-shadow:0 14px 28px rgba(0,0,0,.35);transform:scale(1.06)}
.lk-drag .lk-ic{width:28px;height:28px;stroke-width:2.2}
.lk-trail{position:fixed;left:0;top:0;width:390px;height:844px;z-index:33;opacity:.85;pointer-events:none}
/* « lié à » (L29) */
.lk-lies{display:flex;gap:6px;margin:10px 12px 0;flex-wrap:nowrap;align-items:center}
.lk-chip{display:inline-flex;align-items:center;gap:5px;height:42px;padding:0 11px 0 9px;border-radius:999px;border:1.5px solid color-mix(in srgb,var(--c) 50%,var(--line));background:color-mix(in srgb,var(--c) 10%,var(--bg));font-size:15px;font-weight:600;color:var(--ink);white-space:nowrap}
.lk-chip .lk-ic{width:18px;height:18px;color:var(--c)}
.lk-chip.n{padding:0 13px;color:var(--mut);border-color:var(--line2);background:none}
.lk-meta{margin:6px 12px 0;font-size:16px;color:var(--mut);line-height:1.55}
.lk-ln{color:var(--ink);font-weight:600;text-decoration:underline;text-decoration-color:var(--c);text-decoration-thickness:2px;text-underline-offset:4px;padding:10px 0;white-space:nowrap}
.lk-ln .lk-ic{width:16px;height:16px;color:var(--c);vertical-align:-2px;margin-right:3px}
.lk-ici{background:color-mix(in srgb,var(--prod) 11%,var(--bg))!important;border-radius:10px}
.lk-tag{display:inline-flex!important;align-items:center;gap:4px;margin-top:3px;font-style:normal!important;font-size:14px!important;font-weight:700;color:var(--prod)!important}
/* Courses (L14) */
.lk-gr{display:flex;align-items:center;gap:10px;min-height:62px;padding:8px 8px 8px 14px;background:var(--s1);border-top:1px solid var(--line)}
.lk-gr:first-child{border-top:0}
.lk-gn{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}.lk-gn b{font-size:17px;color:var(--ink)}
.lk-gn i{font-style:normal;font-size:14px;color:var(--mut);display:flex;align-items:center;gap:5px;white-space:nowrap}.lk-gn i .lk-ic{width:16px;height:16px;color:var(--ok)}
.lk-gn i.ok{color:var(--ok);font-weight:600}
.lk-cmd{flex:none;height:44px;padding:0 14px;border-radius:12px;border:1.5px solid var(--fin);color:var(--fin);font-weight:700;font-size:16px;display:inline-flex;align-items:center;gap:6px;background:var(--bg)}
.lk-cmd.on{background:var(--okbg);border-color:var(--ok);color:var(--ok)}.lk-cmd .lk-ic{width:18px;height:18px}
.lk-route{opacity:.5}
.lk-toast{position:fixed;left:12px;right:84px;z-index:50;background:var(--ink);color:var(--bg);border-radius:14px;min-height:52px;display:flex;align-items:center;gap:8px;padding:6px 6px 6px 14px;font-size:15px;font-weight:600;line-height:1.25;box-shadow:0 6px 18px rgba(0,0,0,.3)}
.lk-toast span{flex:1;min-width:0}.lk-toast button{flex:none;height:40px;padding:0 10px;border-radius:10px;font-weight:800;font-size:15px;color:var(--bg);text-decoration:underline;text-underline-offset:3px;background:none;border:0}
.lk-cc{margin:12px 12px 0;border:1.5px solid color-mix(in srgb,var(--fin) 55%,var(--line));border-radius:14px;background:var(--finbg);padding:12px 12px 12px 14px}
.lk-cc.ok{border-color:color-mix(in srgb,var(--ok) 60%,var(--line));background:var(--okbg)}
.lk-cch{display:flex;align-items:center;gap:8px}.lk-cch .lk-ic{color:var(--fin)}.lk-cc.ok .lk-cch .lk-ic{color:var(--ok)}
.lk-cch b{font-size:18px;color:var(--ink)}.lk-cch em{margin-left:auto;font-style:normal;font-size:20px;font-weight:800;color:var(--ink);font-variant-numeric:tabular-nums}
.lk-ccl{font-size:15px;color:var(--mut);margin-top:4px;line-height:1.35}
.lk-ccf{display:flex;align-items:center;gap:10px;margin-top:10px}.lk-ccf .lk-cmd{margin-left:auto}
.lk-ccf small{font-size:14px;color:var(--mut)}
.lk-attl{display:flex;align-items:flex-start;gap:6px;margin:6px 0 0;font-size:15px;font-weight:600;color:var(--ok);line-height:1.3}.lk-attl .lk-ic{width:18px;height:18px;margin-top:1px}.lk-att{position:absolute;top:-30px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;font-size:14px;font-weight:700;color:var(--ok);white-space:nowrap;pointer-events:none}
.lk-att i{display:block;width:30px;height:30px;border-radius:50%;border:2.5px dashed var(--ok);margin-top:3px;background:var(--bg)}
.lk-hl{display:flex;align-items:center;gap:10px;margin:10px 12px 0;padding:8px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.lk-hl>.lk-ic{color:var(--fin);width:22px;height:22px}.lk-hl.ok>.lk-ic{color:var(--ok)}
.lk-hlt{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}.lk-hlt b{font-size:17px;color:var(--ink)}.lk-hlt small{font-size:14px;color:var(--mut);line-height:1.3}
.lk-hl.ok .lk-hlt small{color:var(--ok);font-weight:600}
.lk-cmd.lk-ann{border-color:var(--line2);color:var(--ink)}
.lk-dim{position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:70}html[data-theme=cave] .lk-dim{background:rgba(0,0,0,.55)}
.lk-sh{position:fixed;left:0;right:0;bottom:0;z-index:71;background:var(--sheet,var(--bg));border-radius:20px 20px 0 0;padding:6px 14px 18px;box-shadow:0 -10px 30px rgba(0,0,0,.25);color:var(--ink)}
.lk-sh::before{content:'';display:block;width:40px;height:5px;border-radius:3px;background:var(--line2);margin:0 auto 8px}
.lk-shh{display:flex;align-items:center;gap:8px}.lk-shh b{flex:1;font-size:20px}
.lk-x{width:44px;height:44px;border-radius:12px;border:1.5px solid var(--line2);display:grid;place-items:center;background:none;color:var(--ink)}
.lk-grp{border:1.5px solid var(--line);border-radius:14px;padding:2px 12px 10px;margin-top:10px}
.lk-gh{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:8px 0 6px}.lk-gh b{font-size:17px}.lk-gh span{font-size:14px;color:var(--mut);white-space:nowrap}
.lk-gl{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:46px;border-top:1px solid var(--line);font-size:16px}.lk-gl small{display:block;font-size:14px;color:var(--mut)}.lk-gl .mono{font-size:15px;white-space:nowrap}
.lk-gf{display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid var(--line);padding-top:8px}.lk-gf b{font-size:17px}.lk-gf small{display:block;font-size:14px;color:var(--mut)}
.lk-voile{position:fixed;left:0;right:0;bottom:56px;z-index:58;pointer-events:none;background:color-mix(in srgb,var(--bg) 58%,transparent)}
`;

const ICONS = {
  'lk-idee': '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/>',
  'lk-micro': '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  'lk-clavier': '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h1M10 10h1M14 10h1M18 10h.01M7 14h10"/>',
  'lk-check': '<path d="M5 12.5l4.5 4.5L19 7"/>',
  'lk-x': '<path d="M6 6l12 12M18 6L6 18"/>',
  'lk-camion': '<path d="M2.5 6.5h11v9.5h-11zM13.5 10h4l3 3.2V16h-7"/><circle cx="7" cy="17.8" r="1.8"/><circle cx="17" cy="17.8" r="1.8"/>',
  'lk-chev': '<path d="M9 6l6 6-6 6"/>',
  'lk-biere': '<path d="M6 8h10v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zM16 11h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2M6 8a3 3 0 0 1 5-2.2A3 3 0 0 1 16 8M10 12v5M13 12v5"/>',
  'lk-four': '<path d="M3 21V10l5 3V10l5 3V7l8 4v10zM3 21h18M7 17h2M12 17h2M17 17h1"/>',
  'lk-cal': '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  'lk-fut': '<rect x="6" y="3" width="12" height="18" rx="3"/><path d="M6 8h12M6 16h12"/>',
  'lk-chariot': '<path d="M3 4h2l2.4 11h10.2L20 7H6.2"/><circle cx="9" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>',
  'lk-retour': '<path d="M15 6l-6 6 6 6"/>',
  'lk-doc': '<path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5"/>',
};
const SPRITE = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
  Object.entries(ICONS).map(([k, v]) => `<symbol id="${k}" viewBox="0 0 24 24">${v}</symbol>`).join('') + '</defs></svg>';

// aides communes, dans la page
const VERIF_SRC = fs.readFileSync(path.join(INTER, 'outils/verif-recouvre.js'), 'utf8').replace(/^\/\*[\s\S]*?\*\/\s*/, '').trim();
const AIDES = `
const verif=()=>${VERIF_SRC};
const caser=(de,a,pas=2)=>{for(let y=de;y<=a;y+=pas){window.scrollTo(0,y);const v=verif();if(!v.sousPlus.length&&!v.tranche.length)return y}window.scrollTo(0,de);document.title='LKERR caser '+de+'-'+a;return -1};
const voileFrise=()=>{const y=Math.max(...$$('[data-libre-sem]').map(e=>R(e).bottom))+2;add('<div class="lk-voile" style="top:'+y+'px"></div>')};
const Q=new URLSearchParams(location.search);if(Q.get('theme')==='cave')document.documentElement.dataset.theme='cave';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const ic=(id,c='')=>'<svg class="lk-ic '+c+'" viewBox="0 0 24 24"><use href="#'+id+'"/></svg>';
const R=e=>e.getBoundingClientRect();
const add=(h,par=document.body)=>{const t=document.createElement('div');t.innerHTML=h.trim();const e=t.firstElementChild;par.appendChild(e);return e};
const doigt=(x,y,c='')=>add('<div class="lk-doigt '+c+'" style="left:'+x+'px;top:'+y+'px"></div>');
const doigtSur=(e,c='',dx=0,dy=0)=>{const r=R(e);return doigt(r.left+r.width/2+dx,r.top+r.height/2+dy,c)};
const sousSoldes=(pop,cible)=>{const y=Math.max(...$$('[data-libre-sem]').map(e=>R(e).bottom))+12,r=R(cible),w=pop.offsetWidth,cx=r.left+r.width/2;let l=Math.max(12,Math.min(390-12-w,cx-w/2));pop.style.left=l+'px';pop.style.top=y+'px';pop.style.setProperty('--ax',(cx-l)+'px')};
const sousPlus=()=>{const f=$$('#fab,.fab,.s-fab').find(e=>{const r=R(e);return r.width>0&&getComputedStyle(e).visibility!=='hidden'});if(!f)return 0;const fr=R(f);let n=0;const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let t;while((t=tw.nextNode())){if(!t.textContent.trim())continue;const e=t.parentElement;if(!e||f.contains(e)||e.closest('.lk-toast,#s-toast,#toast,nav,.lk-doigt'))continue;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.display==='none')continue;const rg=document.createRange();rg.selectNodeContents(t);for(const r of rg.getClientRects()){if(r.width<2)continue;if(Math.min(r.right,fr.right)-Math.max(r.left,fr.left)>2&&Math.min(r.bottom,fr.bottom)-Math.max(r.top,fr.top)>2)n++}}return n};
const caserPlus=(de,a,pas=4)=>{for(let y=de;y<=a;y+=pas){window.scrollTo(0,y);if(!sousPlus())return y}window.scrollTo(0,de);return -1};
const sous=(pop,cible,dy=12)=>{const r=R(cible),w=pop.offsetWidth,cx=r.left+r.width/2;let l=Math.max(12,Math.min(390-12-w,cx-w/2));pop.style.left=l+'px';pop.style.top=(r.bottom+dy)+'px';pop.style.setProperty('--ax',(cx-l)+'px')};
`;

const IDEE_S50 = 'Bière au sapin';
const DIT = 'regarder un frigo pour la garde';
const TITRE = 'Frigo pour la garde';

// ---------- g-d1 : morceaux communs ----------
const ampoule = (sem) => `(()=>{const b=$('.wk[data-sem="${sem}"] b');const i=add('<i class="k13-id lk-neuf" role="button" aria-label="Idée du carnet : ${TITRE}">'+ic('lk-idee')+'</i>',b);return i})()`;
const toastGd1 = (txt) => `(()=>{const t=$('#toast');t.hidden=false;t.style.right='104px';t.style.bottom='64px';t.style.height='auto';t.style.minHeight='44px';t.style.borderRadius='14px';t.style.padding='6px 4px 6px 14px';t.innerHTML='<span>${txt}</span><button type="button">Annuler</button>'})()`;

const MENU = `
document.body.classList.add('plus-ouvert');
add('<div class="scrim" id="scrim"></div>');
const bi=id=>'<svg class="ico"><use href="#'+id+'"/></svg>';const pc=(c,i,t)=>'<button type="button" class="pc" style="--c:'+c+'"><span>'+t+'</span><i>'+bi(i)+'</i></button>';
const pp=(c,i,t,sm,cl)=>'<button type="button" class="pp '+(cl||'')+'" style="--c:'+c+'"><span>'+t+'<small>'+sm+'</small></span><i>'+bi(i)+'</i></button>';
const d=add('<div class="dial" id="dial" role="menu"></div>');
d.innerHTML='<span class="dh">Partout</span><div class="dg">'+pc('var(--fin)','i-ecr','Nouvelle écriture')+pc('var(--fin)','i-doc','Facture')+pc('var(--ok)','i-vente','Encaisser')+pc('var(--prod)','i-epi','Créer une recette')+pc('var(--prod)','i-beer','Lancer un brassin')+pc('var(--mut)','i-bulle','Compagnon')+'</div>'+'<span class="dh">Sur Calendrier</span><div class="dg">'+pp('var(--ok)','i-barre','Et si…','barre une chose')+pp('var(--fin)','i-ici','Aujourd’hui','revenir en S47')+'</div>'
 +'<span class="dh">Poser en S47 · 16 nov.</span>'+pp('var(--k13i)','i-idee','Idée','au carnet, datée de la semaine','lk-idee-pp')+pp('var(--e-activite)','i-jour','Activité sans budget','des jours, pas d’argent')+pp('var(--e-achat)','i-wallet','Achat ou travaux','payé d’un coup ou mis de côté')+pp('var(--e-evenement)','i-fete','Fête ou vente','marché, fête, café')+pp('var(--e-brassage)','i-beer','Brassin','cuve et jours de brassage','noir');
$('#fab').setAttribute('aria-expanded','true');
`;

const feuille = ({ titre, quand, semaines, dit, ecoute }) => `
add('<div class="scrim" id="scrim" style="bottom:56px"></div>');
const f=add('<div class="k13-f lk-f" role="dialog"></div>');
f.innerHTML='<div class="k13-h"><i class="k13-sw" style="--c:var(--k13i)"></i><b>${titre}</b><span class="k13-q">${quand}</span><button type="button" class="k13-x" aria-label="Fermer">'+ic('lk-x')+'</button></div>'
 +'<div class="k13-dire"><span class="k13-mic" style="animation:none;box-shadow:0 0 0 9px color-mix(in srgb,var(--bad) 22%,transparent)">'+ic('lk-micro')+'</span><p class="k13-said">« ${dit} »${ecoute ? '<i class="lk-car"></i>' : ''}<small>${ecoute ? 'j’écoute… parle, je note' : 'dit à l’instant'}</small></p></div>'
 ${semaines ? `+'<div class="k13-row lk-wk">'+[['47','16 nov.'],['48','23 nov.'],['49','30 nov.'],['50','7 déc.'],['51','14 déc.'],['52','21 déc.']].map(([s,j])=>'<button type="button" class="k13-v'+(s==='${semaines}'?' on':'')+'">S'+s+'<small>'+j.split(' ')[0]+'</small></button>').join('')+'</div>'` : ''}
 +'<div class="lk-act"><button type="button" class="lk-b2">'+ic('lk-clavier')+'Écrire</button><button type="button" class="lk-b1">'+ic('lk-check')+'Garder au carnet</button></div>';
$('#fab').style.visibility='hidden';
`;

const CARNET = `const all=$$('body *');const t=all.find(e=>e.children.length===0&&/^\\s*Évier inox\\s*$/.test(e.textContent));let card=t;while(card.parentElement&&!(R(card).height>90&&R(card).width>300))card=card.parentElement;
const c=card.cloneNode(true);const par=card.parentElement;const first=[...par.children].find(e=>R(e).height>90&&R(e).width>300);par.insertBefore(c,first);
const w=document.createTreeWalker(c,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){const v=n.textContent;if(/Évier inox/.test(v))n.textContent=v.replace('Évier inox','Frigo pour la garde');else if(/évier inox/.test(v))n.textContent=v.replace(/«.*»/,'« regarder un frigo pour la garde »');else if(/rien de rangé encore/.test(v)){const e=n.parentElement;e.innerHTML=ic('lk-cal')+' <b style="color:var(--ink)">S49 · 30 nov.</b> · retour au calendrier';e.style.display='flex';e.style.alignItems='center';e.style.gap='6px';e.style.color='var(--fin)';break}}
c.style.boxShadow='0 0 0 3px color-mix(in srgb,var(--lki) 50%,transparent)';
for(const e of all)if(e.children.length===0&&/idées et besoins/.test(e.textContent))e.textContent=e.textContent.replace(/\\d+ idées/,m=>(parseInt(m)+1)+' idées');
const demo=all.find(e=>e.children.length===0&&/^Démo/.test(e.textContent));if(demo)demo.style.visibility='hidden';
add('<style>nav a,nav a *{font-size:14px!important}</style>');
for(const e of $$('nav *'))if(e.children.length===0&&e.textContent.trim()==='24')e.textContent='3';`;

// ---------- vues ----------
const V = [];
const vue = (v, f, base, js, legende, opts = {}) => V.push({ v, f, base, js, legende, ...opts });

// L1-a : + volant → « Idée » → dictée et semaine en puces → ampoule sur l'en-tête → bulle
vue('l1-a', '1-menu', 'gd1', MENU + `doigtSur($('.lk-idee-pp i'));`,
  'Le + volant, ouvert sur le calendrier : « Idée » en tête de « Poser en S47 ». Le doigt touche Idée.');
vue('l1-a', '2-dire', 'gd1', feuille({ titre: 'Idée · au carnet', quand: 'S49 · 30 nov.', semaines: '49', dit: DIT, ecoute: true }) +
  `$('.col[data-col="49"]').classList.add('foc');doigtSur($$('.lk-wk .k13-v')[2]);`,
  'La dictée écoute déjà, sans clavier. La semaine se change d’un toucher (S47 par défaut) : le doigt prend S49.');
vue('l1-a', '3-pose', 'gd1', `const i=${ampoule(49)};i.classList.add('lk-halo');${toastGd1('Idée au carnet · S49')};`,
  'Gardée : une ampoule sur l’en-tête de S49, comme « Bière au sapin » en S50. Rien d’autre ne bouge. Bandeau Annuler.');
vue('l1-a', '4-ouvre', 'gd1', `const i=${ampoule(49)};
const p=add('<div class="lk-pop" role="dialog"><span class="lk-pk">'+ic('lk-idee')+'Idée · S49 · 30 nov.</span><b class="lk-pt">${TITRE}</b><span class="lk-pm">dite le 16 nov.</span><div class="lk-pa"><button type="button" class="lk-b1">Ouvrir au carnet'+ic('lk-chev')+'</button></div></div>');
voileFrise();sousSoldes(p,i);doigtSur(i);`,
  'Un toucher sur l’ampoule : une bulle sous les soldes, le temps de lire. « Ouvrir au carnet » mène à l’idée.');

// L1-b : appui long sur une semaine → bulle de dictée accrochée à la semaine → ampoule → carnet
vue('l1-b', '1-appui', 'gd1', `$('.col[data-col="49"]').classList.add('foc');const w=$('.wk[data-sem="49"]');
voileFrise();const t=add('<div class="lk-tip">'+ic('lk-idee')+'Idée en S49 · 30 nov.</div>');sousSoldes(t,w);
doigtSur(w,'long');`,
  'Appui long sur la semaine S49 (son en-tête) : la colonne s’éclaire, l’anneau se remplit, « Idée en S49 » s’annonce.');
vue('l1-b', '2-dire', 'gd1', `$('.col[data-col="49"]').classList.add('foc');const w=$('.wk[data-sem="49"]');
const b=add('<div class="lk-bul" role="dialog"><div class="lk-bh">'+ic('lk-idee')+'Idée · S49 · 30 nov.<span>au carnet</span></div><div class="lk-bd"><span class="lk-mic">'+ic('lk-micro')+'</span><p class="lk-said">« ${DIT} »<i class="lk-car"></i></p></div><div class="lk-bf"><button type="button" class="lk-b2" aria-label="Écrire au clavier">'+ic('lk-clavier')+'</button><button type="button" class="lk-b2">'+ic('lk-x')+'Laisser</button><button type="button" class="lk-b1">'+ic('lk-check')+'Garder</button></div></div>');
voileFrise();sousSoldes(b,w);b.style.left='12px';b.style.setProperty('--ax',(R(w).left+R(w).width/2-12)+'px');`,
  'Doigt levé : la bulle reste accrochée à S49 et écoute déjà. Il parle, « Garder ». Le clavier reste possible, jamais imposé.');
vue('l1-b', '3-pose', 'gd1', `const i=${ampoule(49)};i.classList.add('lk-halo');${toastGd1('Idée au carnet · S49')};`,
  'Même trace discrète : l’ampoule de S49. Pas de rangée, pas de case : la frise garde ses 7 rangées.');
vue('l1-b', '4-ouvre', 'carnet', CARNET,
  'Un toucher sur l’ampoule ouvre directement l’idée dans Carnets (Stocks › Matériel), datée « S49 · 30 nov. », avec le retour au calendrier.',
  { delai: 1600 });

// L1-c : glisser le + sur une semaine → dictée → ampoule avec compte → liste de la semaine
vue('l1-c', '1-glisse', 'gd1', `$('.col[data-col="50"]').classList.add('tgt');const fb=$('#fab'),fr=R(fb);fb.style.visibility='hidden';
add('<div class="lk-ghost" style="left:'+fr.left+'px;top:'+fr.top+'px"></div>');
const c=R($('.col[data-col="50"]')),x=c.left+c.width/2,y=R($('.lane[data-voie="renovation"]')).top+14;
add('<svg class="lk-trail" viewBox="0 0 390 844"><path d="M'+(fr.left+28)+' '+(fr.top+28)+' C '+(fr.left-10)+' '+(fr.top-60)+', '+(x+40)+' '+(y+60)+', '+x+' '+(y+30)+'" fill="none" stroke="var(--k13i)" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/></svg>');
add('<div class="lk-drag" style="left:'+x+'px;top:'+y+'px">'+ic('lk-idee')+'</div>');
const t=add('<div class="lk-tip">'+ic('lk-idee')+'Lâcher : idée en S50</div>');t.style.left=Math.min(390-12-t.offsetWidth,Math.max(12,x-t.offsetWidth/2))+'px';t.style.top=(y-80)+'px';
doigt(x+6,y+18);`,
  'On tire le + volant sur une semaine : la colonne S50 s’allume en cible, « Lâcher : idée en S50 » s’annonce.');
vue('l1-c', '2-dire', 'gd1', feuille({ titre: 'Idée · au carnet', quand: 'S50 · 7 déc.', semaines: '', dit: DIT, ecoute: true }) +
  `$('.col[data-col="50"]').classList.add('foc');`,
  'Lâché : la dictée écoute, la semaine vient du lâcher (pas de puces à choisir). « Garder au carnet ».');
vue('l1-c', '3-pose', 'gd1', `const i=$('.wk[data-sem="50"] .k13-id');i.classList.add('lk-halo');add('<i class="lk-n">2</i>',i);${toastGd1(`Au carnet : « ${TITRE} », S50`)};`,
  'S50 avait déjà « Bière au sapin » : son ampoule porte maintenant « 2 ». Toujours un seul signe par semaine.');
vue('l1-c', '4-ouvre', 'gd1', `const i=$('.wk[data-sem="50"] .k13-id');add('<i class="lk-n">2</i>',i);
const p=add('<div class="lk-pop" role="dialog"><span class="lk-pk">'+ic('lk-idee')+'2 idées · S50 · 7 déc.</span>'
 +'<button type="button" class="lk-pr">'+ic('lk-idee','i')+'<span><b>${IDEE_S50}</b><small>au carnet</small></span>'+ic('lk-chev')+'</button>'
 +'<button type="button" class="lk-pr neuf">'+ic('lk-idee','i')+'<span><b>${TITRE}</b><small>dite à l’instant</small></span>'+ic('lk-chev')+'</button></div>');
voileFrise();sousSoldes(p,i);doigtSur(i);`,
  'Un toucher sur l’ampoule : les idées de la semaine, une ligne chacune ; une ligne ouvre l’idée au carnet.');

// L29-a : pastilles « lié à » sous le titre du lot → toucher Brouwland → sa fiche, à l'endroit lié
const LIES_LOT = `const p=$('.v1t');add('<div class="lk-lies" aria-label="Lié à">'
 +'<button type="button" class="lk-chip" style="--c:var(--prod)">'+ic('lk-biere')+'Recette</button>'
 +'<button type="button" class="lk-chip lk-brou" style="--c:var(--fin)">'+ic('lk-four')+'Brouwland</button>'
 +'<button type="button" class="lk-chip lk-l-idee" style="--c:var(--lki)">'+ic('lk-idee')+'Idée</button>'
 +'<button type="button" class="lk-chip n" aria-label="2 liens de plus">+2</button></div>',p);`;
vue('l29-a', '1-lot', 'lot', LIES_LOT + `doigtSur($('.lk-brou'));`,
  'Fiche du lot 41 : trois pastilles « lié à » sous le titre (recette, fournisseur des malts, idée), « +2 » pour le reste. Les clients, déjà dans l’arbre, ne sont pas répétés.');
vue('l29-a', '2-brouwland', 'four', `const top=$('.s-top');top.style.cssText+=';position:sticky;top:0;z-index:20;background:var(--bg);border-bottom:1px solid var(--line);padding-bottom:6px';const bk=$('.s-back');bk.innerHTML=ic('lk-retour')+'Lot 41';bk.style.color='var(--prod)';const tt=add('<b style="font-size:18px;margin-right:auto;margin-left:6px">Brouwland</b>',top);top.insertBefore(tt,top.children[1]);
for(const a of $$('.p1-art')){const n=a.querySelector('.p1-an b').textContent;if(/Pilsner/.test(n)){a.classList.add('lk-ici');add('<i class="lk-tag">'+ic('lk-biere')+'dans le lot 41</i>',a.querySelector('.p1-an'))}}
const y0=Math.round(scrollY+R($('.p1-h2')).top-250);caser(y0-60,y0+80);`,
  'Le toucher ouvre la fiche Brouwland, au bon endroit : le Pilsner du lot 41 marqué, « ‹ Lot 41 » pour revenir. Le retour reste collé en haut pendant qu’on lit.',
  { delai: 500 });

// L29-b : mêmes pastilles ; un toucher montre la chose sur place (aperçu), « Ouvrir » pour y aller
vue('l29-b', '1-lot', 'lot', LIES_LOT + `doigtSur($('.lk-l-idee'));`,
  'Mêmes pastilles sous le titre du lot 41. Le doigt touche « Idée ».');
vue('l29-b', '2-apercu', 'lot', LIES_LOT + `const l=$('.lk-l-idee');
const q=add('<div class="lk-pop" role="dialog"><span class="lk-pk">'+ic('lk-idee')+'Idée · du Marché du samedi</span><b class="lk-pt">Un peu sucrée : finir plus sec</b><span class="lk-pm">viser 1,010 au lieu de 1,014 au lot 43</span><div class="lk-pa"><button type="button" class="lk-b1">Ouvrir au carnet'+ic('lk-chev')+'</button></div></div>');
const nv=$$('nav').find(e=>R(e).height>0);add('<div class="lk-voile" style="top:'+(R($('.lk-lies')).bottom+6)+'px;bottom:'+(nv?Math.round(innerHeight-R(nv).top):56)+'px"></div>');sous(q,l,8);`,
  'Le toucher montre l’idée sur place, sans quitter le lot ; « Ouvrir au carnet » pour aller plus loin. Le reste de la fiche ne bouge pas.');

// L14 : une seule vérité, celle de g-d1 et de L4 : Porter d’hiver brassé S51 (14.12), manques Munich 4 kg et Fuggles 200 g,
// à commander avant 7.12 chez Brouwland (souvent 6 j, jusqu’à 9 : commandé le 16.11, attendu ≈ 22.11, au plus tard le 25).
// Munich au sac de 25 kg (41,20 au 27 août, fiche Brouwland) + Fuggles 200 g ≈ 14 : ≈ 55 CHF sans le port. Soude : Droguerie du Bourg ≈ 24.
// Pastille Stocks : 3 (soude du 16.11 + les deux du Porter), 1 une fois Brouwland commandé.

// L14-a : Stocks C tel quel (liste par semaine) ; le fournisseur devient une étiquette sur la ligne ; le regroupement vit dans la feuille « Commander ces 3 »
const C14 = (apres) => `const A2=[{n:'Soude caustique',q:'1 bidon',sem:48,pour:'nettoyage',f:'Droguerie du Bourg'},{n:'Munich',q:'4 kg',sem:51,pour:'Porter d’hiver',f:'Brouwland'},{n:'Fuggles',q:'200 g',sem:51,pour:'Porter d’hiver',f:'Brouwland'}];
const ap=${apres ? 'true' : 'false'};const reste=ap?A2.filter(a=>a.f!=='Brouwland'):A2;const N=reste.length;
const W=[47,48,49,50,51,52,99],cnt=W.map(w=>w===99?13:w===52?1:reste.filter(a=>a.sem===w).length),m=Math.max(1,...cnt);
$('#big').textContent=N;$('#v3mp').textContent=N;$('#v3t').innerHTML='à commander<b>avant S51'+(ap?'':' · Porter d’hiver')+'</b>';
$('#seg button').innerHTML='<b>S51</b>prochain brassin';
$('#his').innerHTML=W.map((w,i)=>'<div style="--c:'+(w<=51?'var(--fin)':'var(--line2)')+'"><span>'+(cnt[i]||'')+'</span><i style="height:'+(cnt[i]?Math.max(6,cnt[i]/m*70):0)+'px"></i></div>').join('')+'<b class="v3br" id="br"></b>';
$('#br').style.width='calc('+(5/7*100)+'% + 4px)';
$('#v3lt').textContent='Avant S51, par semaine';
$('#v3l').innerHTML=A2.map(a=>{const route=ap&&a.f==='Brouwland';return '<button class="row'+(route?' lk-route':'')+'" style="--c:var(--fin)" data-booster="article"><i class="dot"></i><span class="tx"><span class="nm">'+a.n+'</span><span class="sb">'+(route?'<em>en route</em> · attendu 22 nov. · ':'<em>S'+a.sem+'</em> · '+a.pour+' · ')+a.f+'</span></span><span class="q mono">'+a.q+'</span></button>'}).join('');
$('#cta').lastChild.textContent=ap?'Commander la soude':'Commander ces 3';
const pas=$('#pas');pas.hidden=false;pas.textContent=N;window.scrollTo(0,0);`;
const FEUILLE14 = `add('<div class="lk-dim"></div>');add('<div class="lk-sh" role="dialog"><div class="lk-shh"><b>Commander ces 3</b><button type="button" class="lk-x" aria-label="Fermer">'+ic('lk-x')+'</button></div>'
+'<div class="lk-grp"><div class="lk-gh"><b>Brouwland</b><span>souvent 6 j · ≈ 22 nov.</span></div>'
+'<div class="lk-gl"><span>Munich<small>il en manque 4 kg</small></span><span class="mono">1 sac 25 kg</span></div>'
+'<div class="lk-gl"><span>Fuggles</span><span class="mono">200 g</span></div>'
+'<div class="lk-gf"><span><b>≈ 55 CHF</b><small>sans le port</small></span><button type="button" class="lk-cmd lk-c1">Commandé</button></div></div>'
+'<div class="lk-grp"><div class="lk-gh"><b>Droguerie du Bourg</b><span>sur place</span></div>'
+'<div class="lk-gl"><span>Soude caustique</span><span class="mono">1 bidon</span></div>'
+'<div class="lk-gf"><span><b>≈ 24 CHF</b></span><button type="button" class="lk-cmd">Commandé</button></div></div></div>');
doigtSur($('.lk-c1'),'',44,12);`;
vue('l14-a', '1-courses', 'stk', C14(false) + `doigtSur($('#cta'),'',112,12);`,
  'Stocks, à commander (base C telle quelle, liste par semaine) : chaque ligne porte son fournisseur. Le doigt touche « Commander ces 3 ».',
  { delai: 400 });
vue('l14-a', '2-feuille', 'stk', C14(false) + FEUILLE14,
  '« Commander ces 3 » : la feuille range par fournisseur, avec la dépense prévue et le délai appris. Le doigt touche « Commandé » chez Brouwland.',
  { delai: 400 });
vue('l14-a', '3-commande', 'stk', C14(true) + `add('<div class="lk-toast" role="status" style="bottom:92px"><span>Brouwland commandé : −55 prévu le 22 nov., au calendrier</span><button type="button">Annuler</button></div>');`,
  'Munich et Fuggles passent « en route · attendu 22 nov. » (souvent 6 j). Pastille 3 → 1 : la soude reste. Bandeau Annuler.',
  { delai: 400 });

// L14-b : sur la fiche du fournisseur, une ligne dans l’en-tête (pas de carte) ; la livraison attendue sous son délai appris
const LIGNE = (fait) => `const hl=add('<div class="lk-hl${fait ? ' ok' : ''}">'+ic('${fait ? 'lk-camion' : 'lk-chariot'}')+'<span class="lk-hlt"><b>${fait ? 'Commandé le 16 nov.' : '2 à commander ici'}</b><small>${fait ? 'attendu ≈ 22 nov. · −55 au calendrier' : 'Munich, Fuggles · ≈ 55 CHF · avant 7.12'}</small></span><button type="button" class="lk-cmd${fait ? ' lk-ann' : ''} lk-c1">${fait ? 'Annuler' : 'Commandé'}</button></div>',$('#p1'));
$('#p1').insertBefore(hl,$('.p1-fus'));
const top=$('.s-top');top.style.cssText+=';position:sticky;top:0;z-index:20;background:var(--bg);border-bottom:1px solid var(--line);padding-bottom:6px';const tt=add('<b style="font-size:18px;margin-right:auto;margin-left:6px">Brouwland</b>',top);top.insertBefore(tt,top.children[1]);
hl.style.cssText+=';position:sticky;top:'+Math.round(R(top).height)+'px;z-index:19;background:var(--bg);margin-top:0;padding-left:12px;padding-right:12px;margin-left:0;margin-right:0';
const maxS=()=>Math.max(0,document.documentElement.scrollHeight-innerHeight);
const libre=(m)=>{const fb=$('.s-fab');if(!fb)return true;const fr=R(fb);const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let t;while((t=tw.nextNode())){if(!t.textContent.trim())continue;const e=t.parentElement;if(!e||fb.contains(e)||e.closest('nav,.lk-doigt'))continue;const rg=document.createRange();rg.selectNodeContents(t);for(const r of rg.getClientRects()){if(r.width<2)continue;if(r.right>fr.left-m&&r.left<fr.right+m&&r.bottom>fr.top-m&&r.top<fr.bottom+m)return false}}return true};
const coupeHaut=()=>{const h=$('.lk-hl');if(!h)return false;const hb=R(h).bottom;for(const e of document.querySelectorAll('body *')){if(e.childElementCount||!e.textContent.trim()||h.contains(e)||e.closest('.s-top'))continue;const r=R(e);if(r.width<2||r.height<4)continue;if(r.top<hb-1&&r.bottom>hb+1)return true}return false};
const caserLibre=()=>{const dc=$('.p1-dcap'),h=$('.lk-hl');const y0=dc&&h&&$('.lk-attl')?Math.max(0,Math.round(R(dc.parentElement).top+scrollY-R(h).bottom-6)):0;for(let y=y0;y<=maxS();y+=2){window.scrollTo(0,y);const v=verif();if(!v.sousPlus.length&&!v.tranche.length&&libre(14)&&!coupeHaut())return y}return caser(0,maxS())};`;
vue('l14-b', '1-fiche', 'four', LIGNE(false) + `caserLibre();doigtSur($('.lk-c1'),'',46,16);`,
  'Fiche Brouwland : une ligne d’en-tête dit ce qui est à commander chez lui (Munich, Fuggles du Porter), dépense prévue comprise. Un toucher sur « Commandé », facultatif.',
  { delai: 500 });
vue('l14-b', '2-commande', 'four', LIGNE(true) + `add('<p class="lk-attl">'+ic('lk-camion')+'Ta commande du 16 nov. : attendue ≈ 22 nov., au plus tard le 25</p>',$('.p1-dcap').parentElement);
caserLibre();`,
  'La ligne passe au vert : attendu ≈ 22 nov., −55 posé au calendrier, Annuler sur place. Sous son délai appris (souvent 6 j), la livraison attendue : une date, pas un compteur.',
  { delai: 500 });

// ---------- carnet (l1-b, 4) : la liste Carnets avec l'idée nouvelle en tête ----------
const CARNET_JS = `
const card=$$('main *, body *').find(e=>/Embouteillage/.test(e.textContent||'')&&e.children.length>2&&R(e).height>120&&R(e).height<520);
`;

let n = 0;
for (const x of V) {
  const src = fs.readFileSync(BASES[x.base], 'utf8');
  if (/\s(src|href)="(?!#|data:|https?:)[^"]+"/.test(src.replace(/<a [^>]*>/g, ''))) console.log('ATTENTION ressource relative dans', x.base);
  const run = (x.base === 'gd1' ? `{const bd=$('.bot .badge');if(bd)bd.textContent='3';}` : '') + (x.base === 'carnet' ? `window.LK_CARNET=true;` + (x.js || '') : x.js);
  const over = `<style id="lk-css">${CSS}</style>${SPRITE}<script>(()=>{${AIDES}
const go=()=>{try{${run}}catch(e){document.title='LKERR '+e.message;console.error(e)}};
const d=${x.delai || 120};if(document.readyState==='complete')setTimeout(go,d);else addEventListener('load',()=>setTimeout(go,d));})()</script>`;
  const i = src.lastIndexOf('</body>');
  const out = i >= 0 ? src.slice(0, i) + over + src.slice(i) : src + over;
  const dir = path.join(INTER, x.v);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, x.f + '.html'), out);
  n++;
}
fs.writeFileSync(path.join(INTER, 'outils', 'lk-vues.json'), JSON.stringify(V.map(({ v, f, base, legende }) => ({ v, f, base, legende })), null, 1));
console.log('vues écrites :', n);
