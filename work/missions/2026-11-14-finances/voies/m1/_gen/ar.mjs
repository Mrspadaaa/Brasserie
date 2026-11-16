// m1ar — Archives (portée `archives` du journal) et « Gérer les archives » (ArchiveManagerSheet). Contenu du code : par année, pièces,
// « à suivre », rapport annuel figé, Archivée / En cours / Dans le journal, « Classée le », Consulter, Archiver, Réintégrer, « Classer les
// nouvelles pièces », confirmation (pièces rangées, factures ouvertes qui restent au suivi, règlements à confirmer), pièces sans date,
// « Archiver ne supprime rien et ne marque aucune facture comme payée », cache de l'appareil. Année archivée choisie dans le journal.
// Données : 2024 archivée (268 pièces, classée le 12.02.2025), 2025 finie, dans le journal (241 pièces, 1 à suivre : Solde atelier 60,00,
// rapport figé), 2026 en cours (208 pièces). Le retard 60,00 est celui de v6a.
import { head, tabs, band, g, op, foot, nav, derriere, sq, ICONES } from './commun.mjs';

const BOITE = (c, s) => ICONES.boite(c, s);

// ---------- a, tiède : la feuille du code, allégée ----------
const a = {
  id: 'm1ar-a', titre: 'Gérer les archives, feuille allégée (tiède)',
  css: `
.~-lead{font-size:13px;color:#444;display:flex;gap:6px;align-items:center;white-space:nowrap}
.~-more{font-size:13px;color:#2F6EA8;font-weight:600;min-height:28px;margin-left:auto}
.~-yr{border:1px solid #E6E6E6;border-radius:16px;padding:8px 10px;margin-top:8px}
.~-yh{display:flex;align-items:center;gap:8px}
.~-yh b{font-size:18px;font-family:"IBM Plex Mono",monospace;font-weight:600}
.~-ss{font-size:12px;border-radius:999px;padding:0 7px;line-height:18px}
.~-arc{background:#EDEFF3;color:#33415C}
.~-cur{background:#E8F5EC;color:#22663A}
.~-jr{background:#FAF8F3;color:#6B5B3A;box-shadow:inset 0 0 0 1px #E4E0D6}
.~-yl{font-size:13px;color:#444;margin-top:2px;display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.~-yl .~-tg{font-size:12px}
.~-ya{display:flex;gap:6px;margin-top:6px;align-items:center}
.~-bt{min-height:32px;padding:0 12px;border-radius:12px;border:1px solid #CFCFCF;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;background:#fff}
.~-sel{border:2px solid #111;padding:7px 9px}
.~-conf{margin-top:8px;border-radius:12px;background:#F5F7FA;padding:8px}
.~-conf p{font-size:13px;line-height:18px;display:flex;gap:6px;align-items:center}
.~-conf .~-two{display:grid;grid-template-columns:1fr 1.6fr;gap:8px;margin-top:8px}
.~-num{font-family:"IBM Plex Mono",monospace;font-weight:600}
`,
  corps: () => derriere(head() + tabs() + band({ mois: 'Archives 2024', due: '', avant: BOITE('#33415C', 15), v: ['+21 480,00', 88], f: ['5 616,00', 23], b: ['6 942,40', 28], n: ['498,00', 3], m: ['1 312,00', 6], paye: '14 368,40', apayer: '0,00', depense: '13 056,40' }), 120) + `
 <section class="~-sheet" aria-label="Les archives de la brasserie">
  <div class="~-grab"></div>
  <div class="~-shd">${BOITE('#111', 22)}<h2>Les archives</h2><button class="~-x" aria-label="Fermer">×</button></div>
  <div class="~-lead"><span>Rien n'est supprimé ni marqué payé.</span><button class="~-more">Comment ça marche ⌄</button></div>
  <div class="~-yr"><div class="~-yh"><b>2026</b><span class="~-ss ~-cur">en cours</span></div><p class="~-yl"><span class="~-num">208</span> pièces · <span class="~-tg ~-pay">1 à payer</span></p>
   <div class="~-ya"><button class="~-lien">Consulter 2026 ›</button></div></div>
  <div class="~-yr ~-sel" data-booster="annee-a-ranger"><div class="~-yh"><b>2025</b><span class="~-ss ~-jr">finie · dans le journal</span></div>
   <p class="~-yl"><span class="~-num">241</span> pièces · <span class="~-tg ~-late">1 à suivre</span> · rapport annuel figé</p>
   <div class="~-conf" aria-label="Vérifier le classement de l'année">
    <p>${BOITE('#33415C', 16)}<b>Archiver 2025 ?</b></p>
    <p><span class="~-num">241</span> pièces seront rangées.</p>
    <p><span class="~-tg ~-late">Solde atelier <span class="~-m">60,00</span></span> reste dans le suivi du jour.</p>
    <div class="~-two"><button class="~-sec">Retour</button><button class="~-cta">Confirmer l'archivage</button></div>
   </div></div>
  <div class="~-yr"><div class="~-yh"><b>2024</b><span class="~-ss ~-arc">${BOITE('#33415C', 12)} archivée</span></div><p class="~-yl"><span class="~-num">268</span> pièces · classée le 12.02.2025</p>
   <div class="~-ya"><button class="~-lien">Consulter 2024 ›</button><span style="flex:1"></span><button class="~-bt">Réintégrer 2024</button></div></div>
 </section>`,
  note: `# m1ar-a — Gérer les archives, feuille allégée
**Genre** : a, tiède. **Booster** : annee-a-ranger (l'année finie est cerclée, sa confirmation s'ouvre dans sa carte).
**Change** : trois paragraphes du code → une ligne (« Rien n'est supprimé ni marqué payé ») + « Comment ça marche ⌄ » (le cache
de l'appareil, la synchro, « une nouvelle pièce d'une année rangée reste courante »). Les statuts deviennent des pastilles ; la facture ouverte est nommée.
**Gardé** : par année : pièces, à suivre, rapport figé, statut, « classée le », Consulter, Archiver, Réintégrer, la confirmation (pièces rangées, ce qui reste
au suivi) ; on ferme par le ×. Derrière : le journal en portée Archives 2024 (pièces de la bande v6a, données 2024, dépensé hors Matériel 13 056,40).
**Passe 2 : défauts corrigés** : 1 intro d'une ligne ; 2 bouton « Fermer » retiré (doublait le ×) ; dépensé 2024 hors Matériel comme m1ar-b.
**État montré** : « Archiver 2025 » touché → confirmation dans la carte.
**Au port** : « pièces sans date » (avis) et « Classer les nouvelles pièces de 2024 » paraissent seulement s'il y en a (aucune ici) ; règlements à confirmer idem.
`,
};

// ---------- b, froide : la portée Archives du journal, et une seule ligne pour ranger ----------
const cat2024 = [['ventes', 'Ventes', '+21 480,00', '#2A7240', 96], ['fixes', 'Charges fixes', '5 616,00', '', 12], ['brassage', 'Brassage', '6 942,40', '', 71], ['nettoyage', 'Nettoyage', '498,00', '', 14], ['materiel', 'Matériel · à part', '1 312,00', '', 9], ['apports', 'Apports privés', '+2 000,00', '#2A7240', 2]];
const b = {
  id: 'm1ar-b', titre: 'Archives, le journal rangé (froide)',
  css: `
.~-yp{display:flex;align-items:center;gap:8px;margin:8px 10px 0}
.~-yp .~-pill b{display:inline-flex;align-items:center;gap:6px}
.~-yp small{font-size:12px;color:#555}
.~-cl{display:grid;grid-template-columns:22px 1fr auto auto 14px;gap:8px;align-items:center;min-height:40px;padding:0 10px;border-bottom:1px solid #F0F0F0;font-size:14px}
.~-cl small{font-size:12px;color:#555}
.~-cl .~-m{font-size:14px}
.~-chev{color:#999}
.~-tot{display:flex;justify-content:space-between;padding:8px 10px;font-size:13px;color:#444}
.~-tot b{color:#111}
.~-nudge{margin:10px 10px 0;border-radius:14px;border:1px dashed #BFC6D3;padding:8px 10px;display:flex;align-items:center;gap:10px}
.~-nudge p{flex:1;font-size:13px;line-height:17px}
.~-nudge b{font-size:14px}
.~-rg{min-height:44px;padding:0 14px;border-radius:14px;background:#111;color:#fff;font-weight:700;font-size:14px}
`,
  corps: () => head() + tabs() + `
 <div class="~-yp"><span class="~-pill" data-booster="annee-pilule"><button>‹</button><b>${BOITE('#33415C', 16)}2024</b><button>›</button></span><small>rangée le 12.02.2025 · <span class="~-m">268</span> pièces</small></div>
 ${band({ mois: '2024', due: '', v: ['+21 480,00', 88], f: ['5 616,00', 23], b: ['6 942,40', 28], n: ['498,00', 3], m: ['1 312,00', 6], paye: '14 368,40', apayer: '0,00', depense: '13 056,40' }).replace('<div class="~-top">', '<div class="~-top" style="display:none">')}
 <div style="margin-top:6px">${cat2024.map(([k, n, m, c, nb]) => `<div class="~-cl">${sq(k)}<span>${n}</span><small><span class="~-m" style="font-size:12px;font-weight:500">${nb}</span> pièces</small><span class="~-m"${c ? ` style="color:${c}"` : ''}>${m}</span><span class="~-chev">›</span></div>`).join('')}</div>
 <div class="~-tot"><span>Toutes payées en 2024 · rien à suivre</span><b class="~-m">dépensé 13 056,40</b></div>
 <div class="~-nudge" data-booster="ranger-une-ligne"><p><b>2025 est finie.</b><br>Pas encore rangée · 241 pièces · Solde atelier 60,00 restera au suivi.</p><button class="~-rg">Ranger</button></div>
 <div style="padding:6px 10px 0"><button class="~-lien">Toutes les années et réintégrer ›</button></div>
 ${foot({ on: 'archives', apport: false, ia: false })}
 ${nav()}`,
  note: `# m1ar-b — Archives, le journal rangé
**Genre** : b, froide. **Boosters** : annee-pilule (‹ 2024 › remplace « novembre » : on feuillette les années rangées), ranger-une-ligne.
**Change** : en portée Archives, la liste ne déplie plus chaque pièce : une ligne par catégorie (pièces, total, ›). Le gestionnaire se réduit
à une seule proposition (« 2025 est finie… Ranger ») ; le reste (réintégrer, toutes les années, explications) est à un toucher.
**Gardé** : choix de l'année archivée, piles de la bande v6a (données 2024), « Apport ou prélèvement privé » absent en Archives (comme le code),
ce qui reste au suivi dit avant de ranger. Un toucher sur une catégorie déplie ses pièces (lignes v6a).
**Données** : 2024 posée pour l'exemple ; apports 2024 +2 000,00 hors des piles (pas une vente).
**Au port** : « Ranger » ouvre la même confirmation que m1ar-a ; plus d'une année finie → une ligne chacune.
**Passe 2 : défauts corrigés** : dépensé 2024 hors Matériel, 13 056,40 (5 616,00 + 6 942,40 + 498,00), comme v6a ; payé 14 368,40 garde le Matériel 1 312,00.
`,
};

// ---------- c, chaude : la frise des années et la poignée « rangé jusqu'à » ----------
const mois = { 2024: [21, 19, 24, 22, 25, 23, 18, 17, 26, 24, 22, 27], 2025: [18, 17, 22, 20, 23, 21, 16, 15, 23, 21, 20, 25], 2026: [17, 16, 21, 19, 22, 20, 17, 15, 22, 21, 18] };
const frise = () => Object.entries(mois).map(([y, l]) => `<div class="~-yrz ~-y${y}"><div class="~-bars">${l.map((n, i) => `<i style="height:${n * 2}px"${y === '2025' && i === 11 ? ' class="~-red"' : ''}></i>`).join('')}</div><span class="~-yl">${y}<small class="~-m">${l.reduce((s, n) => s + n, 0)}</small></span></div>`).join('');
const c = {
  id: 'm1ar-c', titre: 'Archives, frise des années (chaude)',
  css: `
.~-fr{position:relative;margin:10px 0 0;padding:0 2px}
.~-row{display:grid;grid-template-columns:12fr 12fr 11fr;gap:6px;align-items:end}
.~-bars{display:flex;gap:2px;align-items:flex-end;height:60px;padding:0 3px}
.~-bars i{flex:1;background:#BFC6D3;border-radius:2px 2px 0 0}
.~-y2026 .~-bars i{background:#2F6EA8}
.~-y2025 .~-bars i{background:#7E8CA6}
.~-bars i.~-red{background:#D6453D}
.~-yl{display:flex;justify-content:space-between;font-size:13px;font-weight:600;border-top:2px solid #111;padding:3px 3px 0}
.~-yl small{font-size:12px;color:#555}
.~-rang{position:absolute;left:0;top:-6px;height:66px;border-radius:8px;background:repeating-linear-gradient(0deg,rgba(51,65,92,.10) 0 3px,rgba(51,65,92,.04) 3px 6px);box-shadow:inset 0 0 0 1.5px #33415C}
.~-old{position:absolute;top:-10px;height:70px;border-left:2px dashed #9AA3B5}
.~-hdl{position:absolute;top:-16px;height:76px;width:0;border-left:3px solid #111}
.~-knob{position:absolute;left:-22px;top:-14px;width:44px;height:28px;border-radius:14px;background:#111;color:#fff;display:grid;place-items:center;font-size:13px;font-weight:700}
.~-out{position:absolute;top:-62px;font-size:12px;white-space:nowrap}
.~-out .~-tg{line-height:18px}
.~-rd{margin-top:14px;display:flex;justify-content:space-between;align-items:baseline}
.~-rd b{font-size:16px}
.~-jr{display:flex;align-items:center;gap:8px;margin-top:6px;border-radius:12px;background:#F5F7FA;padding:8px}
.~-jr p{flex:1;font-size:13px}
.~-jr .~-m{font-size:16px}
.~-yrs{margin-top:10px;border-top:1px solid #EEE}
.~-yi{display:grid;grid-template-columns:52px 1fr auto;gap:8px;align-items:center;min-height:40px;border-bottom:1px solid #F2F2F2;font-size:13px}
.~-yi b{font-size:14px}
.~-two{display:grid;grid-template-columns:1fr 1.7fr;gap:8px;margin-top:10px}
`,
  corps: () => derriere(head() + tabs() + band(), 70) + `
 <section class="~-sheet" aria-label="Les archives">
  <div class="~-grab"></div>
  <div class="~-shd">${BOITE('#111', 22)}<h2>Les archives</h2><button class="~-x" aria-label="Fermer">×</button></div>
  <div class="~-fr" data-booster="frise-poignee" style="margin-top:72px">
   <div class="~-row">${frise()}</div>
   <span class="~-rang" style="width:calc(66.2% - 2px)"></span>
   <span class="~-old" style="left:calc(33.4%)"></span>
   <span class="~-hdl" style="left:calc(66.2% + 1px)"><span class="~-knob">‹›</span></span>
   <span class="~-out" style="left:calc(66.2% - 104px)"><span class="~-tg ~-late">60,00 reste au suivi ↓</span></span>
  </div>
  <div class="~-rd"><span style="font-size:13px;color:#555">rangé jusqu'à <b style="color:#111">fin 2025</b></span><span style="font-size:12px;color:#555">rien n'est supprimé</span></div>
  <div class="~-jr" data-booster="effet-journal"><p>Le journal de tous les jours garde</p><span class="~-m">449</span><span>→</span><b class="~-m">208</b><span style="font-size:13px">pièces</span></div>
  <div class="~-yrs">
   <div class="~-yi"><b class="~-m">2024</b><span>${BOITE('#33415C', 13)} rangée le 12.02.2025 · <span class="~-m">268</span></span><button class="~-lien">Consulter ›</button></div>
   <div class="~-yi"><b class="~-m">2025</b><span><span class="~-m">241</span> · 1 à suivre · rapport figé</span><button class="~-lien">Consulter ›</button></div>
   <div class="~-yi"><b class="~-m">2026</b><span>en cours · <span class="~-m">208</span></span><span></span></div>
  </div>
  <div class="~-two"><button class="~-sec">Remettre</button><button class="~-cta">Ranger 2025</button></div>
 </section>`,
  note: `# m1ar-c — Archives, frise des années
**Genre** : c, chaude. **Boosters** : frise-poignee (pièces par mois de 2024 à nov. 2026, zone rangée encadrée ; la poignée passe de fin 2024,
pointillé, à fin 2025), effet-journal (449 → 208 pièces au quotidien).
**Change** : archiver et réintégrer deviennent un seul geste : poser la limite. La facture ouverte de déc. 2025 dépasse en rouge (« 60,00 reste au suivi »).
**Gardé** : Consulter par année, statut, pièces, à suivre, rapport figé, « classée le », confirmation (bouton « Ranger 2025 » après le glisser),
« Rien n'est supprimé » ; « Remettre » = réintégrer (ramener la poignée). La zone rangée n'est pas hachurée : la hachure reste « à payer ».
**Au port** : la poignée saute d'une fin d'année à l'autre (pas de mois) ; équivalent au toucher : toucher une année. Une année en cours ne se range pas.
**Passe 2 : défauts corrigés** : 1 poignée arrêtée au-dessus de l'axe, « 241 » lisible ; 2 mode d'emploi retiré (« rien n'est supprimé » sous la frise).
`,
};

// ---------- d, libre : l'étagère et les cartons ----------
const carton = (y, etat, x) => `<div class="~-ct ~-${etat}" style="left:${x}px">
  ${etat === 'ouvert' ? '<span class="~-flap ~-fl"></span><span class="~-flap ~-fr2"></span><span class="~-pap" style="left:16px"></span><span class="~-pap" style="left:34px;transform:rotate(6deg)"></span><span class="~-pap" style="left:52px;transform:rotate(-4deg)"></span>' : '<span class="~-lid"></span>'}
  <span class="~-body"><span class="~-lab"><b class="~-m">${y}</b></span></span></div>`;
const d = {
  id: 'm1ar-d', titre: 'Archives, l\'étagère (libre)',
  css: `
.~-wall{margin:8px 10px 0;border-radius:16px;background:linear-gradient(#F4EFE4,#EFE7D6);padding:10px 10px 0;position:relative}
.~-wall h2{font-size:18px}
.~-wall p{font-size:13px;color:#5A4E36}
.~-shelf{position:relative;height:150px;margin-top:8px}
.~-plank{position:absolute;left:-10px;right:-10px;bottom:0;height:12px;background:#B88B5A;box-shadow:0 4px 0 #8C6438}
.~-ct{position:absolute;bottom:12px;width:100px;height:82px}
.~-body{position:absolute;inset:0;background:#C9A46E;border-radius:3px;box-shadow:inset 0 -8px 0 rgba(0,0,0,.06)}
.~-lid{position:absolute;left:-4px;right:-4px;top:-10px;height:12px;background:#B48F5A;border-radius:3px;z-index:2}
.~-lab{position:absolute;left:14px;right:14px;top:22px;height:30px;background:#FFFDF6;border-radius:3px;display:grid;place-items:center;box-shadow:0 0 0 1px #E3D8BF}
.~-lab b{font-size:16px}
.~-flap{position:absolute;top:-18px;width:52px;height:18px;background:#B48F5A;z-index:0}
.~-fl{left:-6px;transform:skewX(-25deg)}.~-fr2{right:-6px;transform:skewX(25deg)}
.~-pap{position:absolute;top:-26px;width:30px;height:34px;background:#fff;box-shadow:0 0 0 1px #DDD;border-radius:2px}
.~-ouvert{box-shadow:0 0 0 3px #111;border-radius:4px}
.~-tag{position:absolute;bottom:58px;right:-36px;transform:rotate(8deg);z-index:3}
.~-tag .~-tg{line-height:20px;font-size:12px}
.~-desk{position:absolute;right:0;bottom:12px;width:78px;height:60px}
.~-desk i{position:absolute;left:0;right:0;height:8px;background:#fff;border:1px solid #D8D8D8;border-radius:2px}
.~-cap{position:absolute;bottom:-26px;font-size:12px;color:#5A4E36;text-align:center;width:100px}
.~-pan{margin:34px 10px 0;border-radius:16px;border:2px solid #111;padding:10px}
.~-pan h3{font-size:16px;display:flex;align-items:center;gap:8px}
.~-pan p{font-size:13px;color:#444;margin-top:4px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.~-two{display:grid;grid-template-columns:1fr 1.5fr;gap:8px;margin-top:10px}
.~-old{margin:10px 10px 0;display:flex;align-items:center;gap:8px;font-size:13px;color:#444;border-radius:12px;background:#F7F7F7;padding:6px 10px}
`,
  corps: () => head() + tabs() + band() + `
 <section class="~-wall" aria-label="Les archives">
  <h2>L'étagère</h2>
  <div class="~-shelf" data-booster="cartons">
   ${carton('2024', 'ferme', 0)}<span class="~-cap" style="left:0">rangé · <span class="~-m">268</span></span>
   ${carton('2025', 'ouvert', 128)}<span class="~-cap" style="left:128px">ouvert · <span class="~-m">241</span></span>
   <span class="~-tag" style="right:118px;bottom:84px"><span class="~-tg ~-late">60,00 dehors</span></span>
   <div class="~-desk">${[0, 1, 2, 3, 4, 5].map(i => `<i style="bottom:${i * 8}px;transform:rotate(${(i % 2 ? 2 : -2)}deg)"></i>`).join('')}</div><span class="~-cap" style="right:-11px;width:100px">2026 sur le bureau</span>
   <span class="~-plank"></span>
  </div>
 </section>
 <section class="~-pan" aria-label="Le carton 2025" data-booster="fermer-carton">
  <h3>${BOITE('#111', 20)}Carton 2025</h3>
  <p><span class="~-m">241</span> pièces · rapport annuel figé · rien n'est jeté ni marqué payé</p>
  <p>Reste dehors, au suivi du jour : <span class="~-tg ~-late">Solde atelier <span class="~-m">60,00</span></span></p>
  <div class="~-two"><button class="~-sec">Consulter 2025</button><button class="~-cta">Fermer le carton</button></div>
 </section>
 <div class="~-old">${BOITE('#33415C', 18)}<span style="flex:1">Carton 2024 · classé le 12.02.2025</span><button class="~-lien">Rouvrir</button></div>
 ${foot({ on: 'archives', apport: false })}
 ${nav()}`,
  note: `# m1ar-d — Archives, l'étagère
**Genre** : d, libre. **Boosters** : cartons (un carton par année : fermé = archivée, ouvert = finie pas rangée, le bureau = l'année en cours),
fermer-carton (le carton touché ouvre son panneau ; la facture ouverte pend dehors, rouge).
**Idée** : l'image d'un vrai rangement d'atelier ; « archiver » devient « fermer le carton », « réintégrer » « rouvrir ».
**Gardé** : pièces, rapport figé, « classé le », Consulter, Archiver (Fermer), Réintégrer (Rouvrir), ce qui reste au suivi, « ne marque aucune facture
payée », « une pièce ajoutée plus tard reste courante » (le bureau). Le pied v6a en portée Archives (sans Apport).
**Passe 2 : défauts corrigés** : 1 les deux phrases retirées (« rien n'est jeté ni marqué payé » tient dans le panneau du carton) ; 2 bande v6a remise en tête.
**Au port** : au-delà de 3 cartons, l'étagère défile ; le dessin reste en CSS (pas d'image).
`,
};

export default [a, b, c, d];
