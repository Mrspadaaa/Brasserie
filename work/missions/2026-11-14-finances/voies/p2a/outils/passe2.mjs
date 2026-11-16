// Voie p2a : construit s2bp2, s1bp2, s2ap2 depuis les v0 (s2b, s1b, s2a), classes renommées, défauts du critique corrigés.
// Rejouable : repart toujours des v0. Remplacements par split/join (L26), jamais de regex avec $ dans le remplacement.
// Usage : node work/missions/2026-11-14-finances/voies/p2a/outils/passe2.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const P2A = join(dirname(fileURLToPath(import.meta.url)), '..');
const VOIES = join(P2A, '..');
const lire = (src, id) => readFileSync(join(VOIES, src, 'etat.html'), 'utf8').split(`${id}-`).join(`${id}p2-`);
const ecrire = (id, h) => { mkdirSync(join(P2A, id), { recursive: true }); writeFileSync(join(P2A, id, 'etat.html'), h); };
function rempl(h, a, b, n = 1) {
  const parts = h.split(a);
  if (n !== 'tous' && parts.length - 1 !== n) throw new Error(`« ${a.slice(0, 70)} » trouvé ${parts.length - 1} fois, attendu ${n}`);
  return parts.join(b);
}
const css = (h, id, bloc) => rempl(h, '</style>', bloc + '\n</style>', 'tous');
// Découpe par figure (s2) : [avant, fig1, fig2, ...]
const figs = (h, id) => h.split(`<figure class="${id}-shot`);
const joinFigs = (parts, id) => parts.join(`<figure class="${id}-shot`);
const CAL = (c) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2"><rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>`;
const ER = '1<sup>er</sup>';

// ───────────────────────── s2bp2 : calendrier en feuille ─────────────────────────
{
  const id = 's2bp2';
  let h = lire('s2/s2b', 's2b');
  h = css(h, id, `
/* passe 2 */
.${id}-frame.${id}-long{height:auto;min-height:844px;padding-bottom:64px}
.${id}-rg{gap:0;min-height:30px;padding:0 1px;background:#E6EFF8;border:1px solid #A9C9E8;color:#111}
.${id}-rg>button{position:relative;width:28px;height:28px;border-radius:50%;color:#1F4F7A;font-size:17px}
.${id}-rg>button:active{background:#CFE0F0}
.${id}-rgl{display:flex;align-items:center;gap:5px;height:28px;padding:0 4px;font-size:15px;font-weight:700;color:#111!important;width:auto!important;border-radius:14px!important}
.${id}-rgl sup{font-size:10px;line-height:0}
.${id}-rg>.${id}-rgx{width:30px;border-left:1px solid #A9C9E8;border-radius:0 14px 14px 0;color:#444}
.${id}-rac{display:flex;gap:6px;margin:2px 0 4px}
.${id}-rac button{min-height:32px;padding:0 12px;border-radius:16px;background:#F5F5F5;font-size:13px;color:#333}
.${id}-rac .${id}-rac-on{background:#E6EFF8;box-shadow:inset 0 0 0 1px #A9C9E8;color:#1F4F7A;font-weight:600}
.${id}-pre{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;margin-top:6px;font-size:12px;color:#555}
.${id}-pre span{display:flex;align-items:center;gap:4px}
.${id}-pre b{font-size:13px;color:#111;font-weight:500}
.${id}-pre i{width:14px;height:10px;border-radius:2px}
.${id}-pre .${id}-hp{font-size:12px}`);
  const f = figs(h, id); // f[1] repos, f[2] feuille, f[3] apres
  f[1] = rempl(f[1], `<div class="${id}-frame">`, `<div class="${id}-frame ${id}-long">`);
  f[1] = rempl(f[1], 'Repos : novembre ; le calendrier à côté du mois', 'Repos : v6a, novembre ; seul ajout, le calendrier à côté du mois (page entière)');
  // Feuille : raccourcis (D262b) et aperçu de l'effet avant « Voir » (greffe s1a).
  f[2] = rempl(f[2], '<div class="s2bp2-wk">', `<div class="${id}-rac" data-booster="raccourcis-plage"><button class="${id}-rac-on">1<sup>er</sup> – 15</button><button>16 – 30</button><button>mois passé</button></div>\n   <div class="s2bp2-wk">`);
  f[2] = rempl(f[2], `<small>15 jours · le loyer du 25 reste dehors</small>`, `<small><b class="${id}-m">15</b> jours · <b class="${id}-m">5</b> opérations</small>`);
  f[2] = rempl(f[2], `<button class="${id}-go">Voir</button></div>`, `<button class="${id}-go">Voir</button></div>
   <div class="${id}-pre" data-booster="apercu-effet"><span><i class="${id}-hat"></i>à payer <b class="${id}-m">0,00</b></span><span>dépensé <b class="${id}-m">296,80</b></span><span><span class="${id}-hp">hors plage</span>loyer du 25 · <b class="${id}-m" style="color:#8A8A8A">400,00</b></span></div>`);
  f[2] = rempl(f[2], 'Le calendrier : toucher le 1er, puis le 15', 'Le calendrier : un raccourci (1er – 15) ou toucher le 1er puis le 15 ; le pied dit l’effet avant « Voir »');
  // Après : pilule de plage teintée, ‹ › glissent la plage de 15 j, × revient au mois.
  const vieux = f[3].slice(f[3].indexOf(`<span class="${id}-rg"`), f[3].indexOf(`<button class="${id}-due"`));
  f[3] = rempl(f[3], vieux, `<span class="${id}-rg" data-booster="pastille-plage"><button aria-label="15 jours plus tôt : 17 → 31 oct.">‹</button><button class="${id}-rgl" aria-label="Changer les jours">${CAL('#2F6EA8')}<b>${ER} → 15 nov.</b></button><button aria-label="15 jours plus tard : 16 → 30 nov.">›</button><button class="${id}-rgx" aria-label="Revenir à novembre">×</button></span>`);
  f[3] = rempl(f[3], `<div class="${id}-frame">`, `<div class="${id}-frame ${id}-long">`);
  f[3] = rempl(f[3], '✦ Pourquoi les charges fixes pèsent autant ?', '✦ Pourquoi le brassage pèse autant ?');
  f[3] = rempl(f[3], 'Après « Voir » : la pilule devient la plage, × revient au mois', 'Après « Voir » : la pilule devient la plage ; ‹ › la font glisser de 15 jours, × revient à novembre (page entière)');
  ecrire(id, joinFigs(f, id));
}

// ───────────────────────── s1bp2 : pilule étirée sur place ─────────────────────────
{
  const id = 's1bp2';
  let h = lire('s1/s1b', 's1b');
  h = css(h, id, `
/* passe 2 */
.${id}-pill.${id}-on{height:36px;padding:1px 2px;border-radius:18px}
.${id}-on>button{position:relative}
.${id}-on>button::after,.${id}-bo::after{content:"";position:absolute;left:-2px;right:-2px;top:50%;height:44px;transform:translateY(-50%)}
.${id}-bo{height:32px;min-width:36px;border-radius:16px;padding:0 9px}
.${id}-bo sup{font-size:10px;line-height:0}
.${id}-ligne2{display:flex;align-items:center;gap:8px;margin-top:6px;min-height:28px}
.${id}-duree{display:flex;align-items:center;gap:4px;font-size:12px;color:#555}
.${id}-duree b{font-size:13px;color:#1F4F7A;font-weight:600}
.${id}-ligne2 .${id}-due{margin-left:auto}
.${id}-bulle{position:absolute;z-index:3;left:44px;top:78px;background:#111;color:#fff;font-size:12px;line-height:16px;padding:5px 9px;border-radius:8px;white-space:nowrap}
.${id}-bulle::before{content:"";position:absolute;left:18px;top:-5px;border:5px solid transparent;border-top:0;border-bottom-color:#111}
.${id}-band{position:relative}
.${id}-bin{position:relative;left:auto;top:auto;margin-left:20px}
.${id}-bin::before{left:22px}
.${id}-presse{background:#CFE0F0!important}
.${id}-hors2{display:grid;grid-template-columns:auto 1fr auto;gap:6px;align-items:center;min-height:26px;padding:2px 10px 2px 22px;border-bottom:1px solid #F0F0F0;font-size:12px;color:#666}
.${id}-hors2 b{font-size:13px;color:#8A8A8A;font-weight:500}
.${id}-hp{border:1px dashed #BDBDBD;border-radius:999px;padding:0 6px;line-height:16px;color:#555}`);
  const sec = h.split(`<section class="${id}-ecran`); // [avant, repos, geste, apres + fin]
  if (sec.length !== 4) throw new Error('s1b : 3 sections attendues');
  const DUE = `<button class="${id}-due" data-booster="pastille-retard"><i></i>en retard <b class="${id}-m">60,00</b></button>`;
  const ligne2 = (j, n) => `<div class="${id}-ligne2"><span class="${id}-duree" data-booster="duree-plage"><b class="${id}-m">${j}</b> j${n ? ` · <b class="${id}-m">${n}</b> opérations` : ''}</span>${DUE}</div>`;
  const HORS = `<div class="${id}-hors2"><span class="${id}-hp">hors plage</span><span>Loyer de l'atelier · à payer 25 nov.</span><b class="${id}-m">400,00</b></div>`;
  // Geste : « 1er », bornes 32 px, durée et retard à la ligne 2, bulle « du … au ».
  let g = sec[2];
  g = rempl(g, `<span>1</span><input type="date" value="2026-11-01" aria-label="du">`, `<span>${ER}</span><input type="date" value="2026-11-01" aria-label="du">`);
  g = rempl(g, `<button class="${id}-x" aria-label="Revenir à tout novembre">×</button>${DUE}</div>`, `<button class="${id}-x" aria-label="Revenir à tout novembre">×</button></div><div class="${id}-ligne2"><span class="${id}-bulle ${id}-bin">du … au : touche une date</span>${DUE}</div>`);
  sec[2] = g;
  // Après : idem, plus la ligne « hors plage » sous Charges fixes, la pastille du bas retirée.
  let a = sec[3];
  a = rempl(a, `<span>1</span><input type="date" value="2026-11-01" aria-label="du">`, `<span>${ER}</span><input type="date" value="2026-11-01" aria-label="du">`);
  a = rempl(a, `<button class="${id}-x" aria-label="Revenir à tout novembre">×</button>${DUE}</div><div class="${id}-glis" data-booster="glisser-plage"><span>‹ 17 → 31 oct.</span><span>16 → 30 nov. ›</span></div>`, `<button class="${id}-x" aria-label="Revenir à tout novembre">×</button></div>${ligne2(15, 5)}`);
  a = rempl(a, `  <p class="${id}-hors"><span class="${id}-tg ${id}-pay">hors plage : loyer de l'atelier · 25 nov. · 400,00</span></p>\n`, '');
  const finElec = a.indexOf('</div>', a.indexOf('Électricité')) + 6;
  a = a.slice(0, finElec) + '\n  ' + HORS + a.slice(finElec);
  // Appui sur ‹ (aperçu de la plage voisine) : copie de l'après, ‹ enfoncé, bulle.
  const finApres = a.lastIndexOf('</section>') + 10;
  let ap = a.slice(0, finApres);
  ap = rempl(ap, 'id="apres" data-etat="apres"', 'id="appui" data-etat="appui"');
  ap = rempl(ap, `<button aria-label="Décaler la plage en arrière">‹</button>`, `<button class="${id}-presse" aria-label="Décaler la plage en arrière">‹</button>`);
  ap = rempl(ap, `</div>${ligne2(15, 5)}`, `</div>${ligne2(15, 5)}<span class="${id}-bulle" style="left:4px;top:42px">lâcher : ‹ 17 → 31 oct.</span>`);
  sec[3] = a.slice(0, finApres) + `\n<p class="${id}-cap"><b>Appui sur ‹</b> · l’aperçu dit où mène la flèche ; au lâcher, la plage recule de 15 jours (17 → 31 oct.).</p>\n<section class="${id}-ecran ${id}-court` + ap.slice(ap.indexOf('"')) + a.slice(finApres);
  h = sec.join(`<section class="${id}-ecran`);
  h = rempl(h, '<b>Geste</b> · la pilule s’étire du 1 au 30 nov. ; toucher « 30 nov. » ouvre le sélecteur de date du téléphone.', '<b>Geste</b> · toucher « novembre » étire la pilule du 1er au 30 nov. (bulle « du … au » au premier toucher) ; toucher « 30 nov. » ouvre le sélecteur de date du téléphone.');
  h = rempl(h, '<b>Après</b> · « ‹ 1 — 15 nov. › » ; les flèches font glisser les 15 jours entiers (écrit dessous), × revient au mois.', '<b>Après</b> · « ‹ 1er — 15 nov. › », 15 j dessous ; ‹ › font glisser les 15 jours entiers, × revient au mois ; le loyer reste à sa place, « hors plage ».');
  ecrire(id, h);
}

// ───────────────────────── s2ap2 : frise à poignées ─────────────────────────
{
  const id = 's2ap2';
  let h = lire('s2/s2a', 's2a');
  h = css(h, id, `
/* passe 2 */
.${id}-frame.${id}-long{height:auto;min-height:844px;padding-bottom:64px}
.${id}-mo{display:flex;align-items:center;gap:4px;height:28px;padding:0 6px 0 4px;border-radius:14px;width:auto!important}
.${id}-mo b{padding:0!important}
.${id}-pill.${id}-on{background:#E6EFF8;border-color:#A9C9E8}
.${id}-pill.${id}-on b{color:#111}
.${id}-pill.${id}-on b sup{font-size:10px;line-height:0}
.${id}-pill.${id}-on>button{color:#1F4F7A}
.${id}-d{position:relative}
.${id}-v{position:absolute;bottom:-4px;left:50%;margin:0 0 0 -4px!important;width:8px!important;height:8px!important;border:1.5px solid #fff;z-index:2}
.${id}-gp{left:10px!important;top:10px!important;width:24px!important;height:24px!important;border-radius:50%!important;border:3px solid #1F4F7A!important;background:#fff}
.${id}-gp svg{display:none}
.${id}-h::before{background:#1F4F7A!important}
.${id}-tenue .${id}-gp{transform:scale(1.15);box-shadow:0 0 0 6px rgba(47,110,168,.18)}
.${id}-bu{position:absolute;z-index:4;top:-30px;transform:translateX(-50%);background:#111;color:#fff;font-size:12px;line-height:16px;padding:4px 8px;border-radius:8px;white-space:nowrap}
.${id}-bu::after{content:"";position:absolute;left:50%;bottom:-5px;margin-left:-5px;border:5px solid transparent;border-bottom:0;border-top-color:#111}
.${id}-lu{position:absolute;bottom:-5px;width:1.5px;height:5px;background:#111;margin-left:-.75px}
.${id}-inc{background:rgba(250,248,243,.6)}
.${id}-mois{position:absolute;top:-4px;bottom:0;width:0;border-left:1.5px dashed #8A8A8A}
.${id}-ax sup{line-height:0;font-size:9px}
.${id}-mq{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:12px;color:#555}
.${id}-mq i{width:14px;height:10px;border-radius:2px;background:#ECF2F9;box-shadow:inset 0 0 0 1px #A9C9E8}
.${id}-ax span.${id}-nx{color:#888}`);
  const NOV = { premier: 6 }; // 1er nov. 2026 = dimanche
  const B9 = `<span class="${id}-bk" style="height:28px"><i style="flex:68;background:#9856D2"></i><i style="flex:186.8;background:#D2B356"></i><i style="flex:42;background:#56C1D2"></i><i style="flex:28.6;background:#567BD2"></i></span>`;
  const B25 = `<span class="${id}-bk" style="height:34px"><i class="${id}-hat" style="flex:400"></i></span>`;
  // jours : tableau de {j, mois:'oct'|'nov'} ; plage [a,b] inclus (indices) ou null.
  function frise({ jours, plage, axe, lundis, tete, bulle, tenue, bande }) {
    const n = jours.length, pct = (x) => (x / n * 100).toFixed(3) + '%';
    const cells = jours.map((d, i) => {
      const dim = plage && (i < plage[0] || i > plage[1]) ? ` ${id}-dim` : '';
      if (d.mois === 'oct') return `<span class="${id}-d ${id}-inc${dim}"></span>`; // aucune donnée saisie : ni point ni barre
      if (d.j === 9) return `<span class="${id}-d${dim}"><i class="${id}-v"></i>${B9}</span>`;
      if (d.j === 25) return `<span class="${id}-d${dim}">${B25}</span>`;
      return `<span class="${id}-d${dim}"><i class="${id}-z"></i></span>`;
    }).join('');
    const [a, b] = plage ?? [0, n - 1];
    const poignee = (x, lab, val, t) => `<span class="${id}-h${t ? ` ${id}-tenue` : ''}" style="left:${pct(x)}" role="slider" aria-label="${lab}" aria-valuetext="${val}"><i class="${id}-gp"></i></span>`;
    const lu = lundis.map((i) => `<span class="${id}-lu" style="left:${((i + 0.5) / n * 100).toFixed(3)}%"></span>`).join('');
    const axeH = axe.map(([i, t, c]) => `<span style="grid-column:${i + 1}"${c ? ` class="${id}-${c}"` : ''}>${t}</span>`).join('');
    return `<div class="${id}-fr" data-booster="frise-poignees">
    <div class="${id}-rd">${tete}</div>
    <div class="${id}-tr">
     ${plage ? `<span class="${id}-sel" style="left:${pct(a)};width:${pct(b - a + 1)}"></span>` : ''}
     <div class="${id}-days">${cells}</div>${lu}${jours.some((d) => d.mois === 'oct') ? `<span class="${id}-mois" style="left:${pct(jours.findIndex((d) => d.mois === 'nov'))}"></span>` : ''}
     ${poignee(a, 'Début', jours[a].j + ' ' + jours[a].mois + '.')}
     ${poignee(b + 1, 'Fin', jours[b].j + ' ' + jours[b].mois + '.', tenue)}
     ${bulle ? `<span class="${id}-bu" style="left:${pct(b + 1)}">${bulle}</span>` : ''}
    </div>
    <div class="${id}-ax">${axeH}</div>${bande ? `\n    <div class="${id}-mq"><i></i>${bande}</div>` : ''}
   </div>\n   `;
  }
  const nov = Array.from({ length: 30 }, (_, i) => ({ j: i + 1, mois: 'nov' }));
  const fen = [...Array.from({ length: 17 }, (_, i) => ({ j: i + 15, mois: 'oct' })), ...Array.from({ length: 13 }, (_, i) => ({ j: i + 1, mois: 'nov' }))];
  const X = `<button class="${id}-x" aria-label="Revenir au mois entier">× mois entier</button>`;
  const tete = (j, n) => `<span class="${id}-nb"><b class="${id}-m" style="font-size:13px">${j}</b> jours · <b class="${id}-m" style="font-size:13px">${n}</b> opérations</span>${X}`;
  const fNov = (o) => frise({ jours: nov, lundis: [1, 8, 15, 22, 29], axe: [[0, ER, 'sb'], [8, 'auj. 9', 'auj'], [14, '15', 'sb'], [24, '25'], [29, '30']], ...o });
  const fApres = fNov({ plage: [0, 14], tete: tete(15, 5) });
  const fGlisser = fNov({ plage: [0, 14], tete: tete(15, 5), bulle: `${ER} → 15 nov.`, tenue: true });
  const fCheval = frise({ jours: fen, plage: [0, 26], lundis: [4, 11, 18, 25], tete: tete(27, 5), axe: [[0, '15 oct.', 'sb'], [17, `${ER} nov.`, 'nx'], [26, '10', 'sb']], bande: 'du 15 au 31 oct. · aucune opération saisie' });
  const ICF = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2F6EA8" stroke-width="2.4" stroke-linecap="round"><path d="M3 19h18M8 19v-6M12 19v-10M16 19v-4"/><circle cx="4" cy="19" r="2.4" fill="#fff"/><circle cx="20" cy="19" r="2.4" fill="#fff"/></svg>`;
  const PILL0 = `<span class="${id}-pill"><button aria-label="Mois précédent">‹</button><b>novembre</b><button aria-label="Mois suivant">›</button></span>`;
  const pillPlage = (t, av, ap) => `<span class="${id}-pill ${id}-on" data-booster="glisser-plage"><button aria-label="${av}">‹</button><b>${t}</b><button aria-label="${ap}">›</button></span>`;
  const f = figs(h, id); // f[1] repos, f[2] apres, f[3] réf
  const cut = (s) => [s.indexOf(`<div class="${id}-fr"`), s.indexOf(`<div class="${id}-key"`)];
  // Repos : frise repliée ; la pilule v6a reçoit une icône de 14 px à côté de « novembre ».
  let r = f[1];
  let [i0, i1] = cut(r);
  r = r.slice(0, i0) + r.slice(i1);
  r = rempl(r, PILL0, `<span class="${id}-pill"><button aria-label="Mois précédent">‹</button><button class="${id}-mo" data-booster="frise-poignees" aria-label="Déplier les jours de novembre"><b>novembre</b>${ICF}</button><button aria-label="Mois suivant">›</button></span>`);
  r = rempl(r, `<div class="${id}-frame">`, `<div class="${id}-frame ${id}-long">`);
  r = rempl(r, 'Repos : novembre, les poignées aux deux bouts de la frise', 'Repos : v6a, novembre ; la frise est repliée, l’icône à côté du mois la déplie (page entière)');
  f[1] = r;
  // Après (base de glisser et à cheval).
  let a = f[2];
  a = rempl(a, PILL0, pillPlage(`${ER} → 15 nov.`, '15 jours plus tôt : 17 → 31 oct.', '15 jours plus tard : 16 → 30 nov.'));
  a = rempl(a, '✦ Pourquoi les charges fixes pèsent autant ?', '✦ Pourquoi le brassage pèse autant ?');
  [i0, i1] = cut(a);
  const avec = (fr) => a.slice(0, i0) + fr + a.slice(i1);
  let apres = rempl(avec(fApres), `<div class="${id}-frame">`, `<div class="${id}-frame ${id}-long">`);
  apres = rempl(apres, 'Après : poignée de droite glissée au 15', 'Après : 1er → 15 nov. ; ‹ › font glisser les 15 jours, × revient au mois (page entière)');
  let gl = rempl(avec(fGlisser), 'data-shot="apres"', 'data-shot="glisser"');
  gl = rempl(gl, 'Après : poignée de droite glissée au 15', 'Pendant : la poignée de droite tenue au 15, la bulle dit la plage ; piles et montants suivent');
  let ch = avec(fCheval);
  ch = rempl(ch, 'data-shot="apres"', 'data-shot="acheval"');
  ch = rempl(ch, pillPlage(`${ER} → 15 nov.`, '15 jours plus tôt : 17 → 31 oct.', '15 jours plus tard : 16 → 30 nov.'), pillPlage('15 oct. → 10 nov.', '27 jours plus tôt', '27 jours plus tard'));
  ch = rempl(ch, 'Après : poignée de droite glissée au 15', 'À cheval : la poignée de gauche poussée contre le bord, la frise glisse sur octobre ; du 15 oct. au 10 nov.');
  f[2] = gl + '<figure class="' + id + '-shot' + apres + '<figure class="' + id + '-shot' + ch;
  ecrire(id, joinFigs(f, id));
}
console.log('PASSE2 écrit : s2bp2, s1bp2, s2ap2');
