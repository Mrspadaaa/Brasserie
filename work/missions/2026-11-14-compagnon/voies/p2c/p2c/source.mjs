// p2c — passe 2 de s2d : la conversation posée sur la frise du brassin. Chaque question, chaque geste et chaque
// contrôle prennent leur jour ; la marge avant le prochain geste dit si l'attente compte. 12 cadres, clair et cave.
import { icone as I, FOND_FIN } from '../outils/commun.mjs';

const J = 12; // frise J+0 à J+12
const X = (j) => `${((j / J) * 100).toFixed(2)}%`;
const H = (g) => Math.round((g / 85) * 54); // 85 g = 54 px
// Mesure : le nombre en mono, l'unité collée par une espace insécable, jamais coupés.
const v = (n, u) => `<span class="§-v"><span class="§-mono">${n}</span>&nbsp;${u}</span>`;

const css = `
.§-v{white-space:nowrap}
.§-tete{display:flex;align-items:center;gap:6px;height:36px;padding:0 6px 0 12px;flex:none}
.§-tete b{font-size:16px;color:var(--t0);white-space:nowrap}
.§-tete span{flex:1;font-size:12px;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.§-tete .§-fin{flex:none;height:22px;display:inline-flex;align-items:center;gap:4px;padding:0 8px;border-radius:11px;background:var(--finbg);color:var(--fintx);font-weight:600}
.§-tete .§-fin+span{flex:1}
.§-bi{width:32px;height:32px;display:grid;place-items:center;border-radius:6px;color:var(--t1);flex:none}
.§-bi.§-g{margin-left:-6px}
/* Frise du brassin */
.§-frise{flex:none;position:relative;height:122px;margin:2px 16px 0 14px;border-bottom:1px solid var(--bd)}
.§-passe{position:absolute;left:0;top:10px;bottom:22px;background:var(--pn);border-radius:4px 0 0 0}
.§-axe{position:absolute;left:0;right:0;bottom:22px;height:1px;background:var(--bdm)}
.§-marge{position:absolute;bottom:21px;height:3px;border-radius:2px;background:var(--t0)}
.§-j{position:absolute;bottom:3px;transform:translateX(-50%);font:12px/16px var(--mono);color:var(--t2)}
.§-j.§-fort{color:var(--t0);font-weight:600}
.§-dh{position:absolute;bottom:22px;width:14px;transform:translateX(-50%);border-radius:3px 3px 0 0;background:var(--hop)}
.§-dh.§-fait{background:var(--passe)}
.§-dh.§-manque{background:none;border:1.5px dashed var(--t2);border-bottom:0}
.§-dh.§-fantome{background:none;border:1.5px dashed var(--bdm);border-bottom:0}
.§-dh-l{position:absolute;transform:translateX(-50%);font:600 12px/16px var(--mono);color:var(--t0);white-space:nowrap}
.§-dh-l.§-lf{color:var(--t2);font-weight:400}
.§-contact{position:absolute;bottom:24px;height:4px;border-radius:2px;background:var(--hop);opacity:.5}
.§-contact.§-fait{background:var(--passe);opacity:.8}
.§-contact.§-coupe{opacity:1;background:none;height:0;bottom:25px;border-top:2px dashed var(--att)}
.§-auj{position:absolute;top:12px;bottom:18px;width:2px;background:var(--t0);transform:translateX(-1px)}
.§-auj-p{position:absolute;top:4px;width:12px;height:12px;border-radius:6px;background:var(--t0);transform:translateX(-50%)}
.§-auj-l{position:absolute;top:1px;transform:translateX(16px);font-size:12px;line-height:18px;font-weight:700;color:var(--t0);white-space:nowrap}
.§-auj-l.§-gauche{transform:translateX(calc(-100% - 16px))}
.§-pin{position:absolute;transform:translateX(-50%);width:24px;height:24px;border-radius:12px;display:grid;place-items:center;background:var(--act);color:var(--acttx)}
.§-pin.§-auj-pin{top:0}
.§-pin.§-file{background:var(--pg);color:var(--t1);border:1.5px dashed var(--t2)}
.§-pin.§-ctrl{background:var(--eau);color:#fff}
.§-pin.§-hors{background:var(--pg);color:var(--t0);border:1.5px solid var(--t0)}
.§-pin.§-urg{background:var(--al);color:#fff}
.§-alerte .§-auj{background:var(--al);width:3px}
.§-alerte .§-auj-l{color:var(--altx)}
.§-cal .§-passe{background:var(--finbg)}
.§-cal .§-auj{background:var(--fintx)}
.§-cal .§-pin{background:var(--finbg);color:var(--fintx)}
.§-cal .§-pin.§-auj-pin{background:var(--fintx);color:var(--pg)}
.§-cal .§-auj-l{color:var(--fintx)}
.§-cal .§-mois{position:absolute;top:44px;font-size:12px;color:var(--t2);transform:translateX(-50%)}
.§-cal .§-tick{position:absolute;bottom:22px;height:8px;width:1px;background:var(--bdm)}
/* Fil et pied */
.§-fil{flex:1;min-height:0;overflow:hidden;padding:10px 12px 8px;display:flex;flex-direction:column;gap:10px}
.§-pied{flex:none;padding:8px 10px 10px;border-top:1px solid var(--bd);display:flex;flex-direction:column;gap:6px}
.§-pied-r{display:flex;gap:6px;align-items:center}
.§-champ{flex:1;min-height:40px;display:flex;align-items:center;gap:6px;border:1px solid var(--bdm);border-radius:8px;background:var(--pn);padding:0 4px 0 10px}
.§-champ span{flex:1;font-size:16px;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.§-champ.§-plein{align-items:flex-end;padding:8px 4px 4px 10px;border-color:var(--fin)}
.§-champ.§-plein span{white-space:normal;color:var(--t0);line-height:1.35}
.§-mode{height:28px;padding:0 8px;border-radius:6px;border:1px solid var(--bd);background:var(--pg);font-size:12px;color:var(--t1);display:inline-flex;align-items:center;gap:3px;white-space:nowrap;flex:none}
.§-env{width:40px;height:40px;border-radius:8px;background:var(--su);color:var(--t2);display:grid;place-items:center;flex:none}
.§-env.§-on{background:var(--act);color:var(--acttx)}
.§-amorces{display:flex;gap:6px;overflow:hidden}
.§-amorce{height:28px;padding:0 10px;border-radius:14px;border:1px solid var(--bd);font-size:13px;color:var(--t1);white-space:nowrap;flex:none}
.§-lim{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--t2);padding:0 2px}
.§-lim i{flex:none;width:28px;height:4px;border-radius:2px;background:var(--su);position:relative;overflow:hidden}
.§-lim i b{position:absolute;inset:0 auto 0 0;background:var(--t2)}
/* Lecture */
.§-grand{font-size:18px;font-weight:700;color:var(--t0);line-height:1.25;margin:0}
.§-sous{font-size:14px;color:var(--t2);margin:-6px 0 0}
.§-geste{font-size:16px;font-weight:600;color:var(--t0);line-height:1.3;margin:-4px 0 0}
.§-q{font-size:14px;color:var(--t1);background:var(--su);border-radius:8px;padding:6px 10px;line-height:1.35}
.§-ancres{display:flex;flex-direction:column}
.§-ancre{display:grid;grid-template-columns:44px 1fr auto;gap:8px;align-items:center;min-height:38px;border-bottom:1px solid var(--bd);font-size:14px;color:var(--t0);text-align:left}
.§-ancre em{font-style:normal;font-size:12px;color:var(--t2)}
.§-tag{font:600 12px var(--mono);color:var(--t1);background:var(--pn);border:1px solid var(--bd);border-radius:4px;padding:2px 0;text-align:center;white-space:nowrap}
.§-tag.§-now{background:var(--act);color:var(--acttx);border-color:var(--act)}
.§-tag.§-ft{font-family:var(--sans);background:var(--finbg);color:var(--fintx);border-color:transparent}
.§-prog{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--t1)}
.§-prog .§-mono{font-size:16px;font-weight:600;color:var(--t0)}
.§-prog span.§-f{flex:1}
.§-barre{height:6px;border-radius:3px;background:var(--su);position:relative}
.§-barre i{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:var(--hop)}
.§-barre u{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--t2)}
.§-pts{display:flex;justify-content:space-between;font-size:12px;color:var(--t2);margin-top:-4px}
.§-pts span{display:inline-flex;align-items:center;gap:3px}
.§-pts .§-ok{color:var(--hoptx)}
.§-pts .§-c{color:var(--t0);font-weight:600}
.§-deja{border:1px solid var(--bd);border-radius:8px;padding:6px 10px;display:flex;flex-direction:column;gap:4px}
.§-deja p{margin:0;font-size:12px;font-weight:600;color:var(--t2)}
.§-deja div{display:flex;align-items:center;gap:6px;font-size:14px;color:var(--t0)}
.§-deja .§-ic{color:var(--hoptx)}
.§-ligne{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--t1);min-height:32px}
.§-ligne>span{flex:1;min-width:0}
.§-ligne small{display:block;font-size:12px;color:var(--t2)}
.§-ligne>.§-ic{color:var(--t2)}
.§-ligne>.§-int,.§-geste-r>.§-int,.§-geste-r>.§-cb{flex:none}
.§-cb{flex:none}
.§-int{width:36px;height:22px;border-radius:11px;background:var(--hop);position:relative;flex:none}
.§-int::after{content:"";position:absolute;top:3px;left:17px;width:16px;height:16px;border-radius:8px;background:var(--pg)}
.§-int.§-off{background:var(--bdm)}
.§-int.§-off::after{left:3px}
.§-niv{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 8px;border-radius:11px;background:var(--attbg);color:var(--atttx);font-weight:700;font-size:12px;align-self:flex-start}
.§-mod{display:grid;grid-template-columns:24px 44px 1fr auto;gap:8px;align-items:center;min-height:36px;border-bottom:1px solid var(--bd);font-size:14px;color:var(--t0)}
.§-mod>span:last-child{text-align:right;white-space:nowrap}
.§-mod s{color:var(--t2)}
.§-mod small{display:block;font-size:12px;color:var(--t2)}
.§-mod.§-opt{color:var(--t1)}
.§-cb{width:20px;height:20px;border-radius:4px;background:var(--act);color:var(--acttx);display:grid;place-items:center}
.§-cb.§-vide{background:var(--pg);border:1.5px solid var(--t2)}
.§-act{display:flex;justify-content:flex-end;align-items:center;gap:6px}
.§-act.§-gch{justify-content:flex-start}
.§-act small{font-size:12px;color:var(--t2)}
.§-bt2{height:32px;padding:0 10px;border:1px solid var(--bdm);border-radius:6px;font-size:13px;color:var(--t1);display:inline-flex;align-items:center;gap:5px;white-space:nowrap;flex:none}
.§-prim{height:32px;padding:0 12px;border-radius:6px;background:var(--act);color:var(--acttx);font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;flex:none}
.§-danger{height:32px;padding:0 12px;border-radius:6px;border:1px solid var(--al);color:var(--altx);font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.§-ctrl{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 10px;border-radius:8px;background:var(--eaubg);font-size:14px;color:var(--t0)}
.§-ctrl>span{flex:1;min-width:0}
.§-ctrl small{display:block;font-size:12px;color:var(--t2)}
.§-ctrl>.§-ic{color:var(--eautx)}
.§-plis{display:flex;flex-direction:column}
.§-pli{display:flex;align-items:center;gap:6px;min-height:32px;font-size:14px;color:var(--t1);text-align:left;border-top:1px solid var(--bd)}
.§-pli span{flex:1}
.§-pli .§-ic{color:var(--t2)}
/* Hors ligne et serveur */
.§-coupe{display:flex;align-items:center;gap:6px;color:var(--t1)}
.§-coupe i{flex:1;height:0;border-top:2px dashed var(--bdm);position:relative}
.§-coupe i b{position:absolute;left:50%;top:-9px;transform:translateX(-50%);width:16px;height:16px;border-radius:8px;background:var(--pg);color:var(--t0);display:grid;place-items:center}
.§-coupe .§-txt{flex:none;width:58%;font-size:14px;color:var(--t0)}
.§-coupe .§-txt small{display:block;font-size:12px;color:var(--t2)}
.§-serv{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 10px;border:1px solid var(--al);border-radius:8px;background:var(--albg);font-size:14px;color:var(--t0)}
.§-serv>span{flex:1;min-width:0}
.§-serv small{display:block;font-size:12px;color:var(--t2)}
.§-serv>.§-ic{color:var(--altx)}
.§-sep{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--t2)}
.§-sep::before,.§-sep::after{content:"";flex:1;height:1px;background:var(--bd)}
/* Finances */
.§-portee{display:flex;flex-wrap:wrap;gap:6px}
.§-chip{height:30px;padding:0 10px 0 8px;border-radius:15px;border:1px solid var(--fin);background:var(--finbg);color:var(--fintx);font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
/* Conversations */
.§-stat{display:flex;gap:10px;font-size:12px;color:var(--t2);padding:0 12px 6px;flex:none}
.§-stat span{display:inline-flex;align-items:center;gap:4px}
.§-pt{width:8px;height:8px;border-radius:4px;display:inline-block}
.§-conv{display:grid;grid-template-columns:20px minmax(0,1fr) auto 32px;gap:8px;align-items:center;min-height:64px;border-bottom:1px solid var(--bd);font-size:14px;color:var(--t0)}
.§-conv b{font-weight:600}
.§-conv small{display:block;font-size:12px;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.§-conv .§-st{font-size:12px;color:var(--t2);white-space:nowrap;text-align:right}
.§-conv .§-st.§-pret{color:var(--hoptx);font-weight:600}
.§-conv .§-st.§-ko{color:var(--altx);font-weight:600}
.§-conv.§-ouvert{border-bottom:0}
.§-conv.§-vieux{color:var(--t1)}
.§-grp{margin:12px 0 0;font-size:12px;font-weight:700;color:var(--t2)}
.§-hist{display:grid;grid-template-columns:44px 1fr auto;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--bd);font-size:14px;color:var(--t1)}
.§-hist small{display:block;font-size:12px;color:var(--t2)}
.§-deplie{margin:0;font-size:14px;line-height:1.4;color:var(--t1);padding:0 0 4px}
.§-seg.§-deux{height:46px}
.§-seg.§-deux button{display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.2}
.§-seg.§-deux small{font-size:12px;opacity:.8;font-weight:400}
.§-menu{display:flex;align-items:center;justify-content:flex-end;gap:6px;padding:4px 0 8px;border-bottom:1px solid var(--bd)}
.§-menu span{flex:1;font-size:12px;color:var(--t2)}
.§-tetes{display:flex;gap:6px}
/* Plafond, limites */
.§-jauge{display:flex;flex-direction:column;gap:5px}
.§-jauge-l{display:flex;align-items:baseline;gap:8px;font-size:14px;color:var(--t0)}
.§-jauge-l span{flex:1}
.§-jauge .§-barre i{background:var(--t1)}
.§-jauge .§-barre.§-plein i{background:var(--att)}
.§-jauge .§-barre em{position:absolute;top:0;bottom:0;border-top:2px dashed var(--t2);height:0;margin-top:2px}
.§-jauge small{font-size:12px;color:var(--t2)}
.§-reg{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--t1)}
.§-reg span{flex:1}
.§-in{width:84px;height:32px;border:1px solid var(--bdm);border-radius:6px;background:var(--pg);color:var(--t0);font:16px var(--mono);text-align:right;padding:0 8px}
.§-seg{display:grid;grid-template-columns:repeat(3,1fr);height:32px;border:1px solid var(--bdm);border-radius:6px;overflow:hidden}
.§-seg button{font-size:13px;color:var(--t1);border-left:1px solid var(--bd)}
.§-seg button:first-child{border-left:0}
.§-seg button.§-sel{background:var(--act);color:var(--acttx);font-weight:600}
.§-bloc{display:flex;flex-direction:column;gap:8px;padding-bottom:12px;border-bottom:1px solid var(--bd)}
.§-bloc>p{margin:0;font-size:12px;font-weight:600;color:var(--t2)}
.§-rep{display:flex;height:8px;border-radius:4px;overflow:hidden;gap:2px}
.§-rep i{display:block;height:100%}
.§-leg{display:flex;gap:12px;font-size:12px;color:var(--t2)}
.§-leg span{display:inline-flex;align-items:center;gap:4px}
/* Urgent : bande pleine, lisible à 2 m */
.§-urg{flex:none;margin:4px 0 0;background:var(--al);color:#fff;padding:10px 14px 12px}
.§-urg-h{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;letter-spacing:.02em}
.§-urg-h span{flex:1}
.§-urg-h .§-mono{flex:none;font-size:22px}
.§-urg p{margin:6px 0 0;font-size:26px;line-height:1.15;font-weight:800}
.§-urg-a{font-size:18px;font-weight:700;color:var(--t0);line-height:1.3;margin:0}
.§-geste-r{display:flex;align-items:center;gap:8px;min-height:40px;border-bottom:1px solid var(--bd);font-size:16px;color:var(--t0)}
.§-geste-r>span{flex:1}
.§-geste-r small{display:block;font-size:12px;color:var(--t2)}
.§-geste-r>.§-ic{color:var(--t1)}
/* Fournisseurs */
.§-four{display:grid;grid-template-columns:20px 1fr auto;gap:8px;align-items:center;min-height:48px;border-bottom:1px solid var(--bd);font-size:14px;color:var(--t0)}
.§-four small{display:block;font-size:12px;color:var(--t2)}
.§-four>span:last-child{text-align:right}
.§-four .§-ic{color:var(--t2)}
.§-four .§-ok{color:var(--hoptx)}
.§-four .§-non{color:var(--t2);text-decoration:line-through}
.§-four.§-ind{color:var(--t1)}
.§-hon{font-size:12px;color:var(--t2);margin:-4px 0 0}
/* Zéro */
.§-zc{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.§-zc>div{border:1px solid var(--bd);border-radius:8px;padding:6px 10px;display:flex;flex-direction:column;gap:4px;font-size:14px;color:var(--t0)}
.§-zc p{margin:0 0 2px;display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:var(--t2)}
.§-zc .§-eff{border-color:var(--al)}
.§-zc .§-eff p{color:var(--altx)}
.§-zc .§-eff div{text-decoration:line-through;text-decoration-color:var(--altx)}
.§-apercu{display:flex;flex-direction:column;gap:6px;opacity:.45;filter:grayscale(1)}
.§-info{font-size:16px;font-weight:700;color:var(--t0);margin:0}
/* Bureau */
.§-b{display:flex;height:100%;background:var(--pg)}
.§-b-app{flex:1;min-width:0;display:flex;flex-direction:column;background:var(--pg)}
.§-b-nav{height:44px;display:flex;align-items:center;gap:18px;padding:0 20px;border-bottom:1px solid var(--bd);font-size:14px;color:var(--t1)}
.§-b-nav b{font-size:16px;color:var(--t0);margin-right:12px}
.§-b-nav .§-sel{color:var(--t0);font-weight:700;box-shadow:inset 0 -2px 0 var(--hop);height:44px;display:inline-flex;align-items:center}
.§-b-page{padding:14px 20px;display:flex;flex-direction:column;gap:12px;overflow:hidden}
.§-b-titre{display:flex;align-items:baseline;gap:10px}
.§-b-titre b{font-size:20px;color:var(--t0)}
.§-b-titre span{font-size:14px;color:var(--t2)}
.§-b-page .§-frise{margin:4px 0 0;height:132px}
.§-b-h{margin:4px 0 0;font-size:12px;font-weight:700;color:var(--t2)}
.§-b-tab{display:flex;flex-direction:column}
.§-b-row{display:grid;grid-template-columns:52px 1fr 90px 1fr;gap:12px;align-items:center;min-height:36px;border-bottom:1px solid var(--bd);font-size:14px;color:var(--t0);padding:0 8px}
.§-b-row small{font-size:12px;color:var(--t2)}
.§-b-row.§-vise{background:var(--attbg);border-radius:6px;border-bottom-color:transparent}
.§-b-row.§-vise em{font-style:normal;font-weight:600;color:var(--atttx)}
.§-b-pan{width:440px;flex:none;border-left:1px solid var(--bd);display:flex;flex-direction:column;background:var(--pg);box-shadow:-12px 0 32px -24px rgba(0,0,0,.4)}
.§-b-pan .§-fil{gap:10px;padding:10px 16px}
.§-b-j{display:grid;grid-template-columns:52px 1fr;gap:12px;font-size:14px;color:var(--t1);padding:4px 8px}
`;

// En-tête compact : ni mode ni explication ; conversations et menu à un toucher.
const tete = (s, o = {}) => `<header class="§-tete">${o.retour ? `<button class="§-bi §-g" aria-label="Retour au compagnon">${I('left', 18)}</button>` : ''}<b>${o.titre || 'Compagnon'}</b>${o.chip || ''}<span>${s}</span>${o.nu ? '' : `<button class="§-bi" aria-label="Mes conversations">${I('convs', 18)}</button><button class="§-bi" aria-label="Plus : limites, repartir à zéro">${I('more', 18)}</button>`}</header>`;
// Pied : le mode n'apparaît que pour écrire (jamais pendant la lecture d'une réponse).
const pied = (t, m, o = {}) => `<footer class="§-pied">${o.avant || ''}<div class="§-pied-r"><div class="§-champ${o.plein ? ' §-plein' : ''}"><span>${t}</span>${m ? `<button class="§-mode" aria-label="Mode : ${m}">${m}${I('down', 12)}</button>` : ''}</div><button class="§-env${o.on ? ' §-on' : ''}"${o.on ? '' : ' disabled'} aria-label="Envoyer">${I('send', 18)}</button></div>${o.apres || ''}</footer>`;

// Frise du brassin : passé, apports en barres, contacts, aujourd'hui, épingles. Chaque marque porte data-m (contrôle de chevauchement).
function frise(o) {
  const { auj, aujl, jours = [0, 2, 4, 6, 9, 12], barres = [], contacts = [], marge, pins = [], tete: t = 'point', teteCls = '', alerte = false, gauche = false, cls = '' } = o;
  let h = `<div class="§-frise ${cls}${alerte ? ' §-alerte' : ''}" data-booster="frise-brassin" aria-label="Frise du brassin 31, J+0 à J+12">`;
  h += `<span class="§-passe" style="width:${X(auj)}"></span><span class="§-axe"></span>`;
  if (marge) h += `<span class="§-marge" style="left:${X(marge[0])};width:${X(marge[1] - marge[0])}"></span>`;
  h += jours.map((j) => `<span class="§-j${Math.floor(auj) === j ? ' §-fort' : ''}" data-m="J+${j}" style="left:${X(j)}">J+${j}</span>`).join('');
  for (const c of contacts) h += `<span class="§-contact${c.e ? ' §-' + c.e : ''}" style="left:${X(c.de)};width:${X(c.a - c.de)}"></span>`;
  for (const b of barres) {
    if (b.avant) h += `<span class="§-dh §-fantome" style="left:${X(b.j)};height:${H(b.avant)}px"></span>`;
    h += `<span class="§-dh${b.e ? ' §-' + b.e : ''}" style="left:${X(b.j)};height:${H(b.g)}px"></span>`;
    h += `<span class="§-dh-l${b.e === 'fait' ? ' §-lf' : ''}" data-m="${b.g}@J+${b.j}" style="left:${X(b.j)};bottom:${H(Math.max(b.g, b.avant || 0)) + 26}px">${b.lab ?? b.g}</span>`;
  }
  h += `<span class="§-auj" style="left:${X(auj)}"></span>`;
  h += t === 'point' ? `<span class="§-auj-p" data-m="tete" style="left:${X(auj)}"></span>` : `<span class="§-pin §-auj-pin ${teteCls}" data-m="tete" style="left:${X(auj)}">${I(t, 13)}</span>`;
  h += `<span class="§-auj-l${gauche ? ' §-gauche' : ''}" data-m="aujourd'hui" style="left:${X(auj)}">${aujl}</span>`;
  for (const p of pins) h += `<span class="§-pin ${p.cls || ''}" data-m="épingle J+${p.j}" style="left:${X(p.j)};bottom:${p.b}px" aria-label="${p.titre}">${I(p.ic, 13)}</span>`;
  return h + '</div>';
}

// Le brassin 31 à J+1 (36 h) : Citra demain, Galaxy J+6, Mosaic J+9, contacts de 3 jours.
const DH = [{ j: 2, g: 85 }, { j: 6, g: 43 }, { j: 9, g: 43 }];
const CT = [{ de: 2, a: 5 }, { de: 6, a: 9 }, { de: 9, a: 12 }];
const fJ1 = (o = {}) => frise({ auj: 1.5, aujl: o.aujl || 'auj. J+1 · 19 °C', jours: [0, 2, 4, 6, 9, 12], barres: DH, contacts: CT, marge: [1.5, 2], ...o });

const ancre = (j, q, m, now) => `<button class="§-ancre"><span class="§-tag${now ? ' §-now' : ''}">${j}</span><span>${q}</span><em>${m}</em></button>`;

// ——— accueil ———
const accueil = `${tete('Brassin 31 · New England IPA')}${fJ1()}
<div class="§-fil" data-fil>
<p class="§-grand">Prochain geste demain : Citra ${v('85', 'g')} à J+2.</p>
<p class="§-sous">${v('36', 'h')} à ${v('19', '°C')} · dry hop ${v('171', 'g')}, ${v('9,0', 'g/L')}</p>
<div class="§-ancres" data-booster="questions-ancrees">
${ancre('J+1', 'La pression monte : je purge ?', 'Rapide', true)}
${ancre('J+4', 'Densité à J+4 : la levure a fini ?', 'Auto')}
${ancre('J+6', 'Galaxy : je garde 43 g ?', 'Auto')}
${ancre('J+12', 'Combien de jours de garde ?', 'Approfondi')}
</div>
<div class="§-ctrl" data-booster="rappel-date">${I('bell', 18)}<span>Demain 09:00 · Citra ${v('85', 'g')}<small>rappel au téléphone · J+2</small></span><button class="§-bt2">Déplacer</button></div>
<div class="§-ligne">${I('bell', 18)}<span>Me notifier à la réponse<small>tu peux fermer pendant que je cherche</small></span><span class="§-int" role="switch" aria-checked="true" aria-label="Me notifier à la réponse"></span></div>
</div>${pied('Ce que tu observes à J+1…', 'Auto', {
  avant: `<div class="§-amorces" data-booster="amorces"><button class="§-amorce">La pression monte…</button><button class="§-amorce">Ça sent…</button><button class="§-amorce">La densité est à…</button></div>`,
  apres: `<div class="§-lim" data-booster="limites-compactes">${I('clock', 12)}${v('15', 'à')} ${v('30', 's')}<span style="flex:1"></span><i><b style="width:3%"></b></i>${v('4', '/ 120')} auj.<i><b style="width:14%"></b></i>${v('2,10', '/ 15 CHF')}</div>`,
})}`;

// ——— attente ———
const attente = `${tete('Brassin 31 · New England IPA')}${fJ1({ tete: 'msg', pins: [{ j: 12, b: 32, ic: 'clock', cls: '§-file', titre: 'Question en file, posée sur J+12' }] })}
<div class="§-fil" data-fil>
<p class="§-grand">Citra demain, rien avant : la réponse a le temps.</p>
<div class="§-q">La fermentation est à 19 °C depuis 36 h et la pression monte doucement : que faire ?</div>
<div class="§-prog">${I('hourglass', 16)}<span class="§-mono">2:29</span><span class="§-f">Approfondi · ${v('1', 'à')} ${v('3', 'min')}, au plus <span class="§-mono">3:40</span></span></div>
<div class="§-barre" data-booster="jauge-duree"><i style="width:68%"></i><u style="left:27%"></u><u style="left:82%"></u></div>
<div class="§-pts"><span class="§-ok">${I('check', 12)}brassin lu</span><span class="§-ok">${I('check', 12)}calculé</span><span class="§-c">sources · 2</span><span>rédiger</span><span>relire</span></div>
<div class="§-deja" data-booster="deja-calcule"><p>Déjà lu et calculé</p>
<div>${I('check', 14)}<span>${v('36', 'h')} à ${v('19', '°C')}, pression en hausse douce</span></div>
<div>${I('check', 14)}<span>Dry hop ${v('171', 'g')} · ${v('9,0', 'g/L')}, Citra ${v('85', 'g')} demain</span></div></div>
<div class="§-ligne">${I('clock', 18)}<span>Et combien de jours de garde ensuite ?<small>en file · posée sur J+12</small></span><button class="§-bi" aria-label="Retirer de la file">${I('x', 16)}</button></div>
<div class="§-ligne">${I('notebook', 18)}<span>Pendant ce temps : la pression au journal ?<small>elle servira à la réponse</small></span><button class="§-bt2">Noter</button></div>
<div class="§-act §-gch"><button class="§-prim">${I('bell', 14)}Fermer · me notifier</button><small>la réponse reste dans ce fil</small></div>
</div>${pied('Ajoute une question…', 'Approfondi')}`;

// ——— réponse attention (J+8) ———
const fJ8 = (o = {}) => frise({
  auj: 8, aujl: 'auj. J+8 · purge ce soir', gauche: true, jours: [0, 2, 4, 6, 8, 10, 12],
  barres: [{ j: 2, g: 85, e: 'fait' }, { j: 6, g: 43, e: 'fait' }, { j: 9, g: 43 }],
  contacts: [{ de: 2, a: 5, e: 'fait' }, { de: 6, a: 8, e: 'fait' }, { de: 8, a: 9, e: 'coupe' }, { de: 9, a: 11 }, { de: 11, a: 12, e: 'coupe' }],
  pins: [{ j: 10, b: 32, ic: 'flag', cls: '§-ctrl', titre: 'Goût à J+10' }], ...o,
});
const corpsReponse = (large) => `<span class="§-niv">${I('alert', 12)}Attention</span>
<p class="§-grand">Herbacé : écourte le contact du dry hop.</p>
<p class="§-geste">Purge les pellets du Galaxy ce soir ; pour le Mosaic J+9, ${v('2', 'jours')} de contact au lieu de 3.</p>
<div data-booster="proposition-frise">
<div class="§-mod"><span class="§-cb" role="checkbox" aria-checked="true">${I('check', 14)}</span><span class="§-tag">J+9</span><span>Contact du Mosaic</span><span><s class="§-mono">3</s> → ${v('2', 'j')}</span></div>
<div class="§-mod"><span class="§-cb" role="checkbox" aria-checked="true">${I('check', 14)}</span><span class="§-tag">J+8</span><span>Température du dry hop</span><span><s class="§-mono">19</s> → ${v('17', '°C')}</span></div>
<div class="§-mod §-opt"><span class="§-cb §-vide" role="checkbox" aria-checked="false"></span><span class="§-tag">J+9</span><span>Mosaic · facultatif<small>dose totale ${v('9,0', 'g/L')} → ${v('8,6', 'g/L')}</small></span><span><s class="§-mono">43</s> → ${v('35', 'g')}</span></div>
</div>
<div class="§-act"><button class="§-bt2">Écarter</button><button class="§-prim">${I('check', 14)}Valider 2 modifications</button></div>
<div class="§-ctrl" data-booster="prochain-controle">${I('flag', 18)}<span>J+10 · goût, avant la garde<small>l'herbacé doit reculer · rappel lun. 16.11, 09:00</small></span><button class="§-bt2">${I('notebook', 14)}Au journal</button></div>
<div class="§-plis">${large ? `<button class="§-pli" aria-expanded="true"><span>Pourquoi</span>${I('up', 16)}</button><p class="§-deplie">Contact long à ${v('19', '°C')} : l'herbacé sort après 2 à 3 jours. ${v('9,0', 'g/L')} reste une dose usuelle de NEIPA : ce n'est pas la dose.</p>` : `<button class="§-pli"><span>Pourquoi : contact long à ${v('19', '°C')}, pas la dose</span>${I('down', 16)}</button>`}
<button class="§-pli">${I('shield', 14)}<span>relu deux fois · calculs refaits · 3 sources</span>${I('down', 16)}</button></div>`;
const reponse = `${tete('Brassin 31 · J+8')}${fJ8()}
<div class="§-fil" data-fil>${corpsReponse(false)}</div>${pied('Réponds ou demande autre chose…')}`;

// ——— erreur : hors ligne (et, dessous, l'erreur serveur, distincte) ———
const erreur = `${tete('Brassin 31 · hors ligne')}${fJ1({ tete: 'wifiOff', teteCls: '§-hors', aujl: 'auj. J+1 · hors ligne', pins: [{ j: 12, b: 32, ic: 'clock', cls: '§-file', titre: 'Question gardée, posée sur J+12' }] })}
<div class="§-fil" data-fil>
<p class="§-grand">Pas de réseau. Citra demain : ta question peut attendre.</p>
<div class="§-q">Et combien de jours de garde ensuite ?</div>
<div class="§-coupe" data-booster="chemin-coupe">${I('phone', 18)}<i><b>${I('x', 12)}</b></i>${I('sparkles', 18)}<span class="§-txt">Gardée sur ce téléphone · 22:51<small>rien n'est parti, rien n'est compté</small></span></div>
<div class="§-act §-gch" data-booster="envoi-a-confirmer"><button class="§-prim">${I('send', 14)}Envoyer au retour du réseau</button><button class="§-bt2">${I('pen', 14)}Reformuler</button></div>
<div class="§-ligne">${I('calc', 18)}<span>Calculé ici, sans relecture<small>dry hop ${v('9,0', 'g/L')} · Citra ${v('85', 'g')} à J+2</small></span></div>
<div class="§-ligne">${I('bell', 18)}<span>Me notifier quand elle part<small>puis à la réponse</small></span><span class="§-int" role="switch" aria-checked="true" aria-label="Me notifier quand elle part"></span></div>
<p class="§-sep">autre cas : le serveur ne répond pas</p>
<div class="§-serv" data-booster="erreur-serveur">${I('cloudOff', 18)}<span>Réponse interrompue à 3:40<small>question gardée · rien d'appliqué</small></span><button class="§-bt2">${I('refresh', 14)}Relancer</button></div>
</div>${pied('Ajoute une question…', 'Auto')}`;

// ——— finances : ouvert depuis « Vérifier mes opérations » ———
const D = 61; // 1.11 → 31.12
const XC = (d) => `${((d / D) * 100).toFixed(2)}%`;
const friseCal = `<div class="§-frise §-cal" style="height:96px" data-booster="frise-calendrier" aria-label="Calendrier, novembre et décembre">
<span class="§-passe" style="width:${XC(13)}"></span><span class="§-axe"></span>
<span class="§-tick" style="left:${XC(29)}"></span><span class="§-tick" style="left:${XC(60)}"></span>
<span class="§-j" data-m="1.11" style="left:${XC(0)}">1.11</span><span class="§-j" data-m="30.11" style="left:${XC(29)}">30.11</span><span class="§-j" data-m="31.12" style="left:${XC(57)}">31.12</span>
<span class="§-mois" data-m="déc." style="left:${XC(45)}">décembre</span>
<span class="§-auj" style="left:${XC(13)}"></span><span class="§-pin §-auj-pin" data-m="tete" style="left:${XC(13)}">${I('wallet', 13)}</span><span class="§-auj-l" data-m="aujourd'hui" style="left:${XC(13)}">auj. 14.11</span>
<span class="§-pin" data-m="épingle passé" style="left:${XC(5)};bottom:30px" aria-label="Comprendre mes dépenses">${I('receipt', 13)}</span>
<span class="§-pin" data-m="épingle déc" style="left:${XC(38)};bottom:30px" aria-label="Prochains paiements">${I('calendar', 13)}</span>
<span class="§-pin" data-m="épingle 31.12" style="left:${XC(58)};bottom:30px" aria-label="Préparer l'année 2026">${I('flag', 13)}</span>
</div>`;
const fq = (j, q, m) => `<button class="§-ancre"><span class="§-tag §-ft">${j}</span><span>${q}</span><em>${m}</em></button>`;
const finances = `${tete('', { chip: `<span class="§-fin">${I('wallet', 12)}Finances · Opérations</span>` })}${friseCal}
<div class="§-fil" data-fil>
<p class="§-grand">Je relis tes opérations ; rien n'est modifié sans toi.</p>
<div class="§-portee" data-booster="portee-verification" aria-label="Ce que je vérifie">
<button class="§-chip">${I('check', 14)}Doublons possibles</button><button class="§-chip">${I('check', 14)}Paiements</button><button class="§-chip">${I('check', 14)}Classement du matériel</button><button class="§-chip">${I('check', 14)}Pièces à compléter</button></div>
<div class="§-ancres" data-booster="questions-ancrees">
${fq('passé', 'Comprendre mes dépenses', 'Auto')}
${fq('auj.', 'Préparer un achat de matériel', 'Approfondi')}
${fq('déc.', 'Prévoir mes prochains paiements', 'Auto')}
${fq('31.12', 'Préparer l\'année 2026', 'Approfondi')}
</div>
<div class="§-ligne">${I('shield', 18)}<span>Finances : relu deux fois<small>tu valides chaque correction</small></span></div>
</div>${pied('Vérifie les incohérences de mes opérations enregistrées : doublons possibles, paiements, classement du matériel et pièces à compléter.', 'Approfondi', { plein: true, on: true })}`;

// ——— mes conversations ———
const conv = (ic, col, t, q, st, stc, extra = '') => `<div class="§-conv${extra ? ' §-ouvert' : ''}"><span style="color:${col}">${I(ic, 18)}</span><span><b>${t}</b><small>${q}</small></span><span class="§-st ${stc}">${st}</span><button class="§-bi" aria-label="Plus : supprimer">${I('more', 18)}</button></div>${extra}`;
const conversations = `${tete('', { titre: 'Mes conversations', retour: true, nu: true })}
<div class="§-stat" data-booster="statuts"><span><i class="§-pt" style="background:var(--hop)"></i>2 prêtes</span><span><i class="§-pt" style="background:var(--t1)"></i>1 en cours</span><span><i class="§-pt" style="background:var(--al)"></i>1 échec</span></div>
<div class="§-fil" data-fil style="gap:0">
<div class="§-tetes" style="padding-bottom:6px"><button class="§-prim">${I('plus', 14)}Nouvelle question</button><button class="§-bt2">${I('eraser', 14)}Repartir à zéro</button></div>
${conv('circleCheck', 'var(--hoptx)', 'New England IPA', 'Galaxy introuvable chez moi, je le remplace ?', 'réponse prête', '§-pret')}
${conv('loader', 'var(--t1)', 'Brassin 30 · Blonde de garde', 'Quelle température de garde ?', 'en cours <span class="§-mono">0:40</span>', '')}
${conv('circleX', 'var(--altx)', 'Brassin 29 · Stout', 'Le lactose ajouté est-il dosé juste ?', `<button class="§-bt2">${I('refresh', 14)}Relancer</button>`, '§-ko')}
${conv('circleCheck', 'var(--hoptx)', 'Mes finances', 'Vérifie les incohérences de mes opérations…', 'réponse prête', '§-pret',
  `<div class="§-menu"><span>Un toucher de plus :</span><button class="§-bt2">Annuler</button><button class="§-danger">${I('trash', 14)}Supprimer</button></div>`)}
<p class="§-grp">Plus anciennes</p>
${conv('circleCheck', 'var(--t2)', 'Brassin 28 · Saison', 'Quand embouteiller ? · lue le 2.11', 'lue', '').replace('§-conv', '§-conv §-vieux')}
<div class="§-ligne" style="margin-top:8px">${I('bell', 18)}<span>Chacune continue quand tu fermes<small>notifiée à la réponse</small></span><span class="§-int" role="switch" aria-checked="true" aria-label="Me notifier"></span></div>
</div>${pied('Nouvelle question…', 'Auto')}`;

// ——— plafond ———
const plafond = `${tete('Brassin 31 · New England IPA')}${fJ1({ tete: 'pause', teteCls: '§-hors' })}
<div class="§-fil" data-fil>
<p class="§-grand">Budget IA du mois atteint.</p>
<div class="§-jauge" data-booster="jauge-budget"><div class="§-jauge-l"><span>Ce mois</span>${v('15,00', 'sur 15 CHF')}</div><div class="§-barre §-plein"><i style="width:100%"></i></div><small>repart à zéro le 1.12 · ou monte le plafond</small></div>
<div class="§-q">Et combien de jours de garde ensuite ?</div>
<div class="§-ligne">${I('phone', 18)}<span>Ta question est gardée · Citra demain, rien ne presse<small>rien n'est parti, rien n'est compté</small></span></div>
<div class="§-act §-gch"><button class="§-prim">${I('sliders', 14)}Régler les limites</button><button class="§-bt2">${I('calendar', 14)}Envoyer le 1.12</button></div>
<div class="§-ligne">${I('notebook', 18)}<span>Sans IA, tout reste là<small>frise, journal et calculs du brassin</small></span></div>
<div class="§-ctrl">${I('bell', 18)}<span>Demain 09:00 · Citra ${v('85', 'g')}<small>les rappels sonnent quand même</small></span></div>
<div class="§-ligne">${I('bell', 18)}<span>Me notifier quand elle part<small>le 1.12, ou dès que tu montes le plafond</small></span><span class="§-int" role="switch" aria-checked="true" aria-label="Me notifier quand elle part"></span></div>
</div>${pied('Ajoute une question…', 'Auto')}`;

// ——— urgent ———
const urgent = `${tete('Brassin 31 · J+1')}
<div class="§-urg" role="alert" data-booster="niveau-urgent"><div class="§-urg-h">${I('thermo', 20)}<span>URGENT · visée 19 °C</span><span class="§-mono">&gt;&nbsp;24&nbsp;°C</span></div>
<p>La cuve dépasse 24 °C : refroidis maintenant.</p></div>
${fJ1({ auj: 1.15, alerte: true, tete: 'thermo', teteCls: '§-urg', aujl: 'auj. J+1 · plus de 24 °C', marge: null })}
<div class="§-fil" data-fil>
<p class="§-urg-a">Ouvre la circulation de glycol et contrôle la température toutes les 30 min.</p>
<div data-booster="gestes-urgents">
<div class="§-geste-r"><span class="§-cb §-vide" role="checkbox" aria-checked="false"></span>${I('snow', 18)}<span>Glycol ouvert</span><button class="§-bt2">Fait</button></div>
<div class="§-geste-r"><span class="§-cb §-vide" role="checkbox" aria-checked="false"></span>${I('timer', 18)}<span>Rappel toutes les 30 min<small>sonne même compagnon fermé</small></span><span class="§-int" role="switch" aria-checked="true" aria-label="Rappel toutes les 30 min"></span></div>
<div class="§-geste-r"><span class="§-cb §-vide" role="checkbox" aria-checked="false"></span>${I('thermo', 18)}<span>Noter la température au journal</span><button class="§-bt2">${I('notebook', 14)}Noter</button></div>
</div>
<div class="§-ctrl">${I('timer', 18)}<span>Prochaine mesure 23:20<small>la visée reste ${v('19', '°C')}, puis toutes les 30 min</small></span></div>
<button class="§-pli"><span>Pourquoi : au-delà de 24 °C, la levure fait des fusels</span>${I('down', 16)}</button>
</div>${pied('Ce que tu observes…')}`;

// ——— fournisseurs (J+4) ———
const fJ4 = frise({
  auj: 4, aujl: 'auj. J+4', jours: [0, 2, 4, 6, 9, 12],
  barres: [{ j: 2, g: 85, e: 'fait' }, { j: 6, g: 43, e: 'manque', lab: 'Citra 43' }, { j: 9, g: 43 }],
  contacts: [{ de: 2, a: 4, e: 'fait' }, { de: 4, a: 5 }, { de: 9, a: 12 }], marge: [4, 6],
});
const fournisseurs = `${tete('Brassin 31 · J+4')}${fJ4}
<div class="§-fil" data-fil>
<div class="§-q">Galaxy introuvable chez moi, je le remplace ?</div>
<p class="§-grand">Oui : Citra, même dose, ${v('43', 'g')} à J+6.</p>
<p class="§-sous">À recevoir avant J+6 : il te reste ${v('2', 'jours')}.</p>
<div data-booster="fournisseurs">
<div class="§-four">${I('pkg', 18)}<span>Citra T90 pellets ${v('100', 'g')}<small>Houblons Suisses SA</small></span><span>${v('9,50', 'CHF')}<small class="§-ok">annoncé en stock</small></span></div>
<div class="§-four §-ind">${I('pkg', 18)}<span>Galaxy T90 pellets ${v('100', 'g')}<small>Brasserie Service Romand</small></span><span>${v('11,20', 'CHF')}<small>indisponible</small></span></div>
</div>
<p class="§-hon">Stock annoncé par le vendeur, jamais confirmé ; tu commandes toi-même.</p>
<div class="§-mod"><span class="§-cb" role="checkbox" aria-checked="true">${I('check', 14)}</span><span class="§-tag">J+6</span><span>Galaxy → Citra</span><span>${v('43', 'g')}</span></div>
<div class="§-act"><button class="§-bt2">Écarter</button><button class="§-prim">${I('check', 14)}Valider 1 modification</button></div>
<button class="§-pli">${I('shield', 14)}<span>relu deux fois · prix lus le 14.11 · 2 sources</span>${I('down', 16)}</button>
</div>${pied('Réponds ou demande autre chose…')}`;

// ——— limites ———
const limites = `${tete('Compagnon', { titre: 'Limites', retour: true, nu: true })}
<div class="§-fil" data-fil>
<div class="§-bloc" data-booster="jauge-limites">
<div class="§-jauge"><div class="§-jauge-l"><span>Questions aujourd'hui</span>${v('4', 'sur 120')}</div><div class="§-barre"><i style="width:3.3%"></i></div></div>
<div class="§-reg"><span>Plafond par jour</span><input class="§-in" type="text" inputmode="numeric" value="120" aria-label="Plafond de questions par jour"></div>
</div>
<div class="§-bloc">
<div class="§-jauge"><div class="§-jauge-l"><span>Budget IA du mois</span>${v('2,10', 'sur 15 CHF')}</div><div class="§-barre"><i style="width:14%"></i><em style="left:14%;width:16%"></em></div><small>au rythme actuel, environ ${v('4,50', 'CHF')} au 30.11 (estimé)</small></div>
<div class="§-reg"><span>Plafond du mois, CHF</span><input class="§-in" type="text" inputmode="decimal" value="15,00" aria-label="Plafond du mois en CHF"></div>
</div>
<div class="§-bloc" data-booster="repartition-modes"><p>Ce mois · <span class="§-mono">54</span> questions</p><div class="§-rep" aria-label="Par mode : Rapide 38, Auto 12, Approfondi 4"><i style="flex:38;background:var(--bdm)"></i><i style="flex:12;background:var(--t2)"></i><i style="flex:4;background:var(--t0)"></i></div><div class="§-leg"><span><i class="§-pt" style="background:var(--bdm)"></i>Rapide <span class="§-mono">38</span></span><span><i class="§-pt" style="background:var(--t2)"></i>Auto <span class="§-mono">12</span></span><span><i class="§-pt" style="background:var(--t0)"></i>Approfondi <span class="§-mono">4</span></span></div></div>
<div class="§-bloc"><p>Mode par défaut</p><div class="§-seg §-deux" role="radiogroup"><button role="radio" aria-checked="false">Rapide<small>${v('5', 's')} env.</small></button><button class="§-sel" role="radio" aria-checked="true">Auto<small>${v('15', 'à')} ${v('30', 's')}</small></button><button role="radio" aria-checked="false">Approfondi<small>${v('1', 'à')} ${v('3', 'min')}</small></button></div>
<small style="font-size:12px;color:var(--t2)">Auto cherche des sources si besoin et relit ; le mode se change à chaque question</small></div>
<div class="§-ligne">${I('alert', 18)}<span>Prévenir à 80 % du budget<small>à ${v('12,00', 'CHF')}</small></span><span class="§-int" role="switch" aria-checked="true" aria-label="Prévenir à 80 % du budget"></span></div>
<div class="§-ligne">${I('pause', 18)}<span>Suspendre l'IA<small>frise, journal et calculs restent</small></span><span class="§-int §-off" role="switch" aria-checked="false" aria-label="Suspendre l'IA"></span></div>
<div class="§-ligne">${I('bell', 18)}<span>Me notifier à la réponse<small>et quand une question en file part</small></span><span class="§-int" role="switch" aria-checked="true" aria-label="Me notifier à la réponse"></span></div>
<div class="§-act" style="justify-content:space-between;margin-top:auto;padding-top:10px;border-top:1px solid var(--bd)"><button class="§-bt2">${I('eraser', 14)}Repartir à zéro…</button><button class="§-prim">${I('check', 14)}Enregistrer</button></div>
</div>`;

// ——— repartir à zéro ———
const zero = `${tete('Brassin 31 · New England IPA')}${fJ1({ pins: [{ j: 4, b: 32, ic: 'flag', cls: '§-ctrl', titre: 'Densité à J+4, au journal' }] })}
<div class="§-fil" data-fil>
<div role="alertdialog" aria-label="Repartir à zéro" style="display:flex;flex-direction:column;gap:10px">
<p class="§-grand">Repartir à zéro ?</p>
<div class="§-zc" data-booster="efface-reste">
<div class="§-eff"><p>${I('eraser', 14)}S'efface</p><div>les échanges de ce fil</div><div>la question en file</div></div>
<div><p>${I('check', 14)}Reste</p><span>la recette</span><span>le brassin 31 et sa frise</span><span>les notes du journal</span></div>
</div>
<div class="§-act"><button class="§-bt2">Annuler</button><button class="§-danger">${I('eraser', 14)}Effacer les échanges</button></div>
</div>
<div class="§-apercu" aria-hidden="true">
<div class="§-q">La fermentation est à 19 °C depuis 36 h et la pression monte doucement : que faire ?</div>
<p class="§-info">Fermentation normale : laisse monter.</p>
<p class="§-geste" style="margin:0;font-size:14px">Garde 19 °C ; le Citra de J+2 se fait pendant cette activité.</p>
<div class="§-ctrl" style="opacity:1">${I('flag', 18)}<span>Densité à J+4 : vers 1,020<small>passe à 20 °C pour finir · gardé au journal</small></span></div>
<div class="§-ligne">${I('clock', 18)}<span>Et combien de jours de garde ensuite ?<small>en file · posée sur J+12</small></span></div>
</div>
</div>${pied('Ajoute une question…', 'Auto')}`;

// ——— bureau, 1280 × 760 : la page du brassin éclairée à gauche, le compagnon en panneau à droite ———
const bureau = `<div class="§-b"><div class="§-b-app">
<nav class="§-b-nav"><b>L'Affinée</b><span>Recettes</span><span class="§-sel">Brassins</span><span>Stocks</span><span>Finances</span></nav>
<div class="§-b-page">
<div class="§-b-titre"><b>Brassin 31 · New England IPA</b><span>${v('19', 'L')} · fermentation J+8 · ${v('19', '°C')}</span></div>
${fJ8({ cls: '' })}
<p class="§-b-h">Dry hop · ${v('171', 'g')}, ${v('9,0', 'g/L')}</p>
<div class="§-b-tab" data-booster="lignes-visees">
<div class="§-b-row"><span class="§-tag">J+2</span><span>Citra</span><span>${v('85', 'g')}</span><small>ajouté · 3 jours de contact</small></div>
<div class="§-b-row §-vise"><span class="§-tag">J+6</span><span>Galaxy</span><span>${v('43', 'g')}</span><em>en contact depuis 2 jours → purger ce soir</em></div>
<div class="§-b-row §-vise"><span class="§-tag">J+9</span><span>Mosaic</span><span>${v('43', 'g')}</span><em>contact 3 → 2 jours</em></div>
<div class="§-b-row §-vise"><span class="§-tag">J+8</span><span>Température du dry hop</span><span>${v('19', '°C')}</span><em>→ 17 °C</em></div>
</div>
<p class="§-b-h">Journal</p>
<div class="§-b-j"><span class="§-tag">J+8</span><span>Dégustation : ça sent l'herbe coupée.</span></div>
<div class="§-b-j"><span class="§-tag">J+6</span><span>DF <span class="§-mono">1,012</span> relevée ; retour à ${v('19', '°C')}, Galaxy ${v('43', 'g')} ajouté.</span></div>
<div class="§-b-j"><span class="§-tag">J+4</span><span>Densité <span class="§-mono">1,020</span> ; passé à ${v('20', '°C')} pour finir.</span></div>
<div class="§-b-j"><span class="§-tag">J+2</span><span>Citra ${v('85', 'g')} ajouté.</span></div>
<div class="§-b-j"><span class="§-tag">J+0</span><span>Brassage, ${v('19', 'L')} en cuve à ${v('19', '°C')}.</span></div>
</div></div>
<aside class="§-b-pan" aria-label="Compagnon brasseur">${tete('Brassin 31 · J+8')}
<div class="§-fil" data-fil><div class="§-hist"><span class="§-tag">J+1</span><span>La pression monte doucement : que faire ?<small>Fermentation normale : laisse monter.</small></span>${I('down', 16)}</div><div class="§-q">Dégustation J+8 : ça sent l'herbe coupée, que faire ?</div>${corpsReponse(true)}</div>${pied('Réponds ou demande autre chose…')}</aside></div>`;

export default {
  titre: 'la conversation sur la frise du brassin, passe 2 (14.11)',
  sous: 'Douze cadres statiques · chaque question, geste et contrôle prend son jour sur la frise ; la marge avant le prochain geste dit si l\'attente compte',
  css,
  cadres: [
    { cadre: 'accueil', lib: 'Accueil', aide: 'jour de brassage, J+1 · questions posées sur leur jour', html: accueil },
    { cadre: 'attente', lib: 'Attente', aide: '2:29 en Approfondi, 2e question en file sur J+12', html: attente },
    { cadre: 'reponse', lib: 'Réponse attention', aide: 'J+8, la proposition se lit sur la frise', html: reponse },
    { cadre: 'erreur', lib: 'Hors ligne', aide: 'envoi à confirmer ; dessous, le serveur', html: erreur },
    { cadre: 'urgent', lib: 'Urgent', aide: 'bande pleine, lisible à 2 m', html: urgent },
    { cadre: 'fournisseurs', lib: 'Fournisseurs', aide: 'Galaxy manque à J+6', html: fournisseurs },
    { cadre: 'finances', lib: 'Finances', aide: 'ouvert depuis Vérifier mes opérations', html: finances, fond: FOND_FIN },
    { cadre: 'conversations', lib: 'Mes conversations', aide: 'statuts, supprimer à un toucher de plus', html: conversations },
    { cadre: 'plafond', lib: 'Plafond', aide: 'budget du mois atteint, question gardée', html: plafond },
    { cadre: 'limites', lib: 'Limites', aide: 'réglages ouverts', html: limites },
    { cadre: 'zero', lib: 'Repartir à zéro', aide: 'les échanges s\'effacent, le brassin reste', html: zero },
    { cadre: 'bureau', lib: 'Bureau 1280', aide: 'la page du brassin éclairée, le compagnon en panneau', html: bureau, large: true },
  ],
};
