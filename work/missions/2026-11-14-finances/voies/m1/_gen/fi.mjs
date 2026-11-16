// m1fi — Filtres, panneau ouvert. Contenu du code (TransactionJournal, ops-panneau) : périmètre Courantes / Tout ; « Toutes » du mois ;
// suivi « toutes les dates » (À payer, En retard, À encaisser, À compléter, Sans justificatif ; Sans date, À confirmer, Doublons si non vides) ;
// catégorie ; « Écritures annulées uniquement » ; « Retirer les filtres » ; « Gérer les archives ». Données v6a : 7 lignes, à payer 2 = 460,00.
import { head, tabs, band, g, LIGNES, foot, nav, derriere, sq, CAT, ICONES } from './commun.mjs';

const HAT = '<i class="~-hat" style="display:inline-block;width:12px;height:12px;border-radius:3px"></i>';
const RED = '<i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#D6453D"></i>';

// ---------- a, tiède : le panneau du code, rangé dans le langage de v6a ----------
const a = {
  id: 'm1fi-a', titre: 'Filtres, panneau rangé (tiède)',
  css: `
.~-res{display:grid;grid-template-columns:22px 1fr auto;gap:6px;align-items:center;padding:8px 10px 1px}
.~-res b{font-size:13px}
.~-pan{margin:0 10px;border-radius:16px;background:#FAF8F3;border:1px solid #E4E0D6;padding:8px}
.~-lab{font-size:12px;color:#555;line-height:14px;margin:8px 0 4px}
.~-cs{display:flex;flex-wrap:wrap;gap:4px}
.~-scr{display:flex;gap:4px;overflow:hidden;margin-right:-8px;-webkit-mask:linear-gradient(90deg,#000 85%,transparent)}
.~-scr>*{flex:none}
.~-top2{display:flex;justify-content:space-between;align-items:center}
.~-ch{display:inline-flex;align-items:center;gap:5px;min-height:28px;padding:0 9px;border-radius:14px;background:#fff;border:1px solid #DDD8CC;font-size:13px;color:#222}
.~-ch .~-m{font-size:12px;color:#444}
.~-ch.~-on{background:#111;color:#fff;border-color:#111}.~-ch.~-on .~-m{color:#fff}
.~-ch.~-urg{color:#8E2A23}.~-ch.~-urg .~-m{color:#8E2A23}
.~-ch.~-vide{color:#8A8A8A;border-style:dashed}.~-ch.~-vide .~-m{color:#8A8A8A}
.~-seg{display:inline-flex;border-radius:14px;background:#fff;border:1px solid #DDD8CC;padding:2px}
.~-seg button{min-height:24px;padding:0 10px;border-radius:12px;font-size:13px}
.~-seg .~-on{background:#111;color:#fff;font-weight:600}
.~-sw{display:inline-flex;align-items:center;gap:8px;font-size:13px;min-height:28px}
.~-sw i{width:34px;height:20px;border-radius:10px;background:#D7D2C6;position:relative}
.~-sw i::after{content:"";position:absolute;left:2px;top:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.3)}
.~-cat{display:inline-flex;align-items:center;gap:5px;min-height:28px;padding:0 8px 0 3px;border-radius:14px;background:#fff;border:1px solid #DDD8CC;font-size:13px}
.~-cat .~-sq{width:22px!important;height:22px!important}
.~-fin{display:flex;justify-content:space-between;align-items:center;padding-top:6px}
`,
  corps: () => head() + tabs() + band() + `
 <div class="~-res">${'<span style="width:22px;height:22px;border-radius:10px;display:block" class="~-hat"></span>'}<b>À payer · toutes les dates</b><span class="~-m" style="font-size:13px">460,00</span></div>
 ${LIGNES.loyer()}${LIGNES.solde()}
 ${foot({ on: 'filtres', nf: 1 })}
 <section class="~-pan" aria-label="Filtres du journal" data-booster="panneau-filtres">
  <div class="~-top2"><span class="~-seg"><button class="~-on">Courantes</button><button>Tout</button></span><span class="~-sw"><i></i>Annulées seulement</span></div>
  <p class="~-lab">à suivre · toutes les dates</p><div class="~-cs">
   <button class="~-ch">Tout le mois <span class="~-m">7</span></button>
   <button class="~-ch ~-on">${HAT}À payer <span class="~-m">2</span></button>
   <button class="~-ch ~-urg">${RED}En retard <span class="~-m">1</span></button>
   <button class="~-ch">À compléter <span class="~-m">4</span></button>
   <button class="~-ch"><span style="color:#7A5500;display:inline-flex">${ICONES.DOC_NO}</span>Sans justificatif <span class="~-m">4</span></button>
   <button class="~-ch ~-vide">À encaisser <span class="~-m">0</span></button>
  </div>
  <p class="~-lab">catégorie</p><div class="~-scr">
   <button class="~-ch ~-on" style="padding:0 10px">Toutes</button>
   ${[['fixes', 'Fixes'], ['ventes', 'Ventes'], ['brassage', 'Brassage'], ['nettoyage', 'Nettoyage'], ['materiel', 'Matériel'], ['local', 'Local'], ['autres', 'Autres'], ['apports', 'Apports']].map(([k, n]) => `<button class="~-cat">${sq(k)}${n}</button>`).join('')}
  </div>
  <div class="~-fin"><span></span><button class="~-lien">Retirer les filtres</button></div>
 </section>
 ${nav()}`,
  note: `# m1fi-a — Filtres, panneau rangé
**Genre** : a, tiède. **Booster** : panneau-filtres (puces comptées, la puce choisie filtre la liste au-dessus).
**Change** : le panneau (sous le pied, comme le code) devient un bloc sable de v6a : Courantes / Tout et Annulées en tête, puis à suivre, puis catégorie.
La liste déroulante de catégorie devient une rangée de puces qui défile, avec le carré de couleur de v6a ; « Écritures annulées uniquement » devient une bascule.
**Gardé** : chaque filtre du code, ses comptes (Tout le mois 7, À payer 2, En retard 1, À compléter 4, Sans justificatif 4, À encaisser 0 en pointillé),
Retirer les filtres ; v6a derrière sans retouche. « Gérer les archives » quitte le panneau : une seule porte, le bouton « Archives » du pied (vue m1ar).
**Passe 2 : défauts corrigés** : 1 trois portes vers les archives → une (pied) ; 2 panneau de 2 écrans → 4 rangées, catégories sur une ligne ; 3 « En retard » sans fond rose.
**État montré** : « À payer » posé → la liste montre ses 2 lignes (460,00), « Filtres 1 ».
**Au port** : « Sans date », « Paiements à confirmer », « Doublons possibles » paraissent seulement non vides (règle du code, rien d'inventé ici).
`,
};

// ---------- b, froide : quatre lectures au premier plan, le reste à un toucher ----------
const b = {
  id: 'm1fi-b', titre: 'Filtres, quatre lectures (froide)',
  css: `
.~-zone{position:relative}
.~-scrim{position:absolute;inset:0;background:rgba(255,255,255,.62)}
.~-pop{position:relative;margin:4px 10px 0;z-index:3;background:#fff;border-radius:16px;box-shadow:0 12px 36px rgba(0,0,0,.28),0 0 0 1px #E4E0D6;padding:4px 0;overflow:hidden}
.~-pop::after{content:"";position:absolute}
.~-li{position:relative;z-index:1;background:#fff;display:grid;grid-template-columns:26px 1fr auto 22px;align-items:center;gap:8px;min-height:44px;padding:0 12px;border-bottom:1px solid #F0F0F0;font-size:15px}
.~-li .~-m{font-size:14px}
.~-li small{font-size:12px;color:#666;margin-left:6px;font-weight:400}
.~-li.~-sel{background:#F6F3EC;font-weight:600}
.~-li.~-dim{color:#8A8A8A}
.~-ck{color:#111;font-weight:700;text-align:right}
.~-plus{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;width:100%;min-height:48px;padding:4px 12px;font-size:14px;color:#2F6EA8;font-weight:600;text-align:left}
.~-plus span{color:#666;font-weight:400;font-size:12px}
.~-tip{position:absolute;top:-7px;left:108px;width:14px;height:14px;background:#fff;transform:rotate(45deg);box-shadow:-1px -1px 0 #E4E0D6}
.~-res{display:grid;grid-template-columns:22px 1fr auto;gap:6px;align-items:center;padding:8px 10px 1px}
.~-res b{font-size:13px}
.~-cats{display:flex;justify-content:space-between;padding:0 8px;border-bottom:1px solid #F0F0F0}
.~-cats button{width:40px;height:48px;display:grid;place-items:center}
`,
  corps: () => head() + tabs() + `
 <div class="~-zone">
  <div>${band()}
   <div class="~-res"><span style="width:22px;height:22px;border-radius:10px;display:block" class="~-hat"></span><b>À payer · toutes les dates</b><span class="~-m" style="font-size:13px">460,00</span></div>
   ${LIGNES.loyer()}${LIGNES.solde()}</div>
  <div class="~-scrim"></div>
  ${foot({ on: 'filtres', nf: 1, ia: false })}
  <div class="~-pop" role="menu" aria-label="Filtres du journal" data-booster="quatre-lectures">
   <div class="~-li"><span></span><span>Tout le mois</span><span class="~-m">7</span><span></span></div>
   <div class="~-li ~-sel"><i class="~-hat" style="width:16px;height:16px;border-radius:4px"></i><span>À payer<small class="~-m">460,00</small></span><span class="~-m">2</span><span class="~-ck">✓</span></div>
   <div class="~-li" style="color:#8E2A23"><i style="width:10px;height:10px;border-radius:50%;background:#D6453D;margin-left:3px"></i><span>dont en retard<small class="~-m">60,00</small></span><span class="~-m">1</span><span></span></div>
   <div class="~-li"><span style="color:#7A5500;display:inline-flex">${ICONES.DOC_NO}</span><span>À compléter</span><span class="~-m">4</span><span></span></div>
   <div class="~-li"><span style="color:#7A5500;display:inline-flex">${ICONES.DOC_NO}</span><span>Sans justificatif</span><span class="~-m">4</span><span></span></div>
   <div class="~-li ~-dim"><i style="width:14px;height:14px;border-radius:4px;border:1.5px dashed #9BBF9E"></i><span>À encaisser</span><span class="~-m">0</span><span></span></div>
   <div class="~-cats" aria-label="Catégorie">${['fixes', 'ventes', 'brassage', 'nettoyage', 'materiel', 'local', 'autres', 'apports'].map(k => `<button aria-label="${CAT[k].nom}">${sq(k, 36, 18)}</button>`).join('')}</div>
   <button class="~-plus">Plus de filtres ›<span>courantes ou tout · annulées · sans date, à confirmer, doublons</span></button>
   <span class="~-tip"></span>
  </div>
 </div>
 ${nav()}`,
  note: `# m1fi-b — Filtres, quatre lectures
**Genre** : b, froide. **Booster** : quatre-lectures (un menu ancré sur « Filtres », une rangée de 44 px par lecture, montant à droite).
**Change** : au premier plan, les lectures du quotidien, une rangée de 44 px chacune, le compte toujours à droite (le montant en petit après le nom) :
Tout le mois, À payer, dont en retard, À compléter, Sans justificatif, À encaisser, puis les 8 carrés de catégorie. Une coche, pas de puce enfoncée.
**Gardé** : les comptes du code, la règle « En retard est une aggravation de À payer » (ligne « dont »), v6a derrière, voilée en blanc et déjà filtrée (2 lignes).
**Sous « Plus de filtres › »** (un toucher) : Courantes / Tout, Annulées, Sans date / À confirmer / Doublons, Retirer ; Gérer les archives par « Archives » du pied.
**Passe 2 : défauts corrigés** : 1 comptes seuls dans la colonne de droite ; 2 liste derrière filtrée sur À payer ; 3 catégories et Sans justificatif au premier plan.
**Au port** : dessiner l'écran « Plus » (la liste a de m1fi-a convient) ; montant de « À payer » = somme du suivi toutes dates.
`,
};

// ---------- c, chaude : la barre de ce qui attend, les carrés de catégorie, l'aperçu ----------
const c = {
  id: 'm1fi-c', titre: 'Filtres, barre de ce qui attend (chaude)',
  css: `
.~-h3{font-size:12px;color:#555;margin:10px 0 4px;display:flex;justify-content:space-between}
.~-wait{display:flex;gap:3px;height:52px}
.~-seg2{position:relative;border-radius:10px;display:flex;flex-direction:column;justify-content:center;padding:0 8px;font-size:13px;line-height:15px}
.~-seg2 b{font-size:14px}
.~-seg2.~-sel{box-shadow:0 0 0 2px #111,inset 0 0 0 1px #C99A3A}
.~-late2{position:absolute;right:0;bottom:0;height:9px;width:13%;border-radius:0 0 10px 0;background:#D6453D}
.~-cmp{border:1.5px dashed #C9A54A;background:#FFFDF7;color:#6E500F}
.~-zero{border:1.5px dashed #BBB;color:#888;background:#fff;align-items:center}
.~-wk{display:flex;gap:10px;font-size:12px;color:#555;margin-top:4px}
.~-tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.~-tile{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 2px 5px;border-radius:12px;border:1px solid #E6E6E6;font-size:12px;line-height:14px;min-height:64px}
.~-tile .~-m{font-size:12px;color:#444}
.~-tile.~-off{opacity:.55}
.~-tile.~-sel{border-color:#111;box-shadow:inset 0 0 0 1px #111}
.~-prev{margin-top:10px;border-radius:14px;background:#FAF8F3;padding:8px}
.~-prev p{display:flex;align-items:center;gap:8px;font-size:13px}
.~-arrow{font-size:16px;color:#888}
.~-gh{display:grid;grid-template-columns:4px 1fr auto;gap:8px;align-items:center;margin-top:5px;font-size:13px}
.~-gh i{height:18px;border-radius:2px}
.~-row{display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap}
.~-sg{display:inline-flex;border-radius:14px;background:#F2F2F2;padding:2px}
.~-sg button{min-height:28px;padding:0 10px;border-radius:12px;font-size:13px}
.~-sg .~-on{background:#111;color:#fff;font-weight:600}
.~-tgl{display:inline-flex;align-items:center;gap:6px;font-size:13px}
.~-tgl i{width:34px;height:20px;border-radius:10px;background:#D5D5D5;position:relative}
.~-tgl i::after{content:"";position:absolute;left:2px;top:2px;width:16px;height:16px;border-radius:50%;background:#fff}
`,
  corps: () => derriere(head() + tabs() + band(), 110) + `
 <section class="~-sheet" aria-label="Filtrer le journal">
  <div class="~-grab"></div>
  <div class="~-shd"><h2>Filtrer</h2><button class="~-lien">Retirer</button><button class="~-x" aria-label="Fermer">×</button></div>
  <div class="~-h3"><span>Ce qui attend · toutes les dates</span></div>
  <div class="~-wait" data-booster="barre-attente">
   <button class="~-seg2 ~-hat ~-sel" style="flex:2.6;color:#4D3808;text-shadow:0 0 3px #FFF7E6,0 0 3px #FFF7E6"><b>À payer 2</b><span class="~-m" style="font-size:12px">460,00</span><span class="~-late2"></span></button>
   <button class="~-seg2 ~-cmp" style="flex:3.2"><b>À compléter 4</b><span style="display:inline-flex;align-items:center;gap:3px">${ICONES.DOC_NO}4 sans pièce</span></button>
   <button class="~-seg2 ~-zero" style="flex:1.5;padding:0 4px"><b class="~-m">0</b><span style="font-size:12px">à encaisser</span></button>
  </div>
  <div class="~-wk"><span><i style="display:inline-block;width:14px;height:6px;background:#D6453D;border-radius:2px;vertical-align:middle"></i> dont en retard 60,00</span><span>· sans date, à confirmer, doublons : aucun</span></div>
  <div class="~-h3"><span>Catégorie · novembre</span></div>
  <div class="~-tiles" data-booster="carres-categorie">
   ${[['fixes', '468,00', 'Fixes'], ['ventes', '+720,00', 'Ventes'], ['brassage', '186,80', 'Brassage'], ['nettoyage', '42,00', 'Nettoyage'], ['materiel', '28,60', 'Matériel'], ['local', '0,00', 'Local'], ['autres', '0,00', 'Autres'], ['apports', '0,00', 'Apports']]
    .map(([k, m, n]) => `<button class="~-tile${m === '0,00' ? ' ~-off' : ''}">${sq(k, 28, 16)}<span>${n}</span><span class="~-m">${m}</span></button>`).join('')}
  </div>
  <div class="~-prev" data-booster="apercu-filtre">
   <p><b>Les 2 lignes</b><b class="~-m" style="margin-left:auto">460,00</b></p>
   <div class="~-gh"><i class="~-hat"></i><span>Loyer de l'atelier · 25 nov.</span><span class="~-m">400,00</span></div>
   <div class="~-gh"><i style="background:#D6453D"></i><span>Solde atelier · depuis 20 déc. 2025</span><span class="~-m">60,00</span></div>
  </div>
  <div class="~-row"><span class="~-sg"><button class="~-on">Courantes</button><button>Tout</button></span><span class="~-tgl"><i></i>Annulées seulement</span></div>
  <div class="~-row" style="margin-bottom:10px"><button class="~-lien">${ICONES.boite('#2F6EA8', 15)}Gérer les archives</button></div>
  <button class="~-cta">Voir les 2 lignes</button>
 </section>`,
  note: `# m1fi-c — Filtres, barre de ce qui attend
**Genre** : c, chaude. **Boosters** : barre-attente (une barre de parts, largeur au nombre ; la hachure = à payer, la pointe rouge = en retard,
le pointillé = sans pièce), carres-categorie (les carrés de v6a avec le montant du mois), apercu-filtre (les 2 lignes trouvées et leur somme).
**Change** : feuille au lieu du panneau sous le pied ; on voit l'effet avant de valider (« Voir les 2 lignes », 44 px).
**Gardé** : chaque filtre du code ; « Sans justificatif » est la part « 4 sans pièce » d'À compléter ; Sans date, À confirmer, Doublons dits « aucun »
(ils deviennent une part quand non vides) ; Courantes / Tout, Annulées, Gérer les archives, Retirer ; v6a voilée derrière.
**Au port** : une part de largeur nulle reste touchable (À encaisser 0 a une largeur plancher) ; catégorie unique comme le code.
**Passe 2 : défauts corrigés** : 1 aperçu sans « 7 → 2 », titré « Les 2 lignes · 460,00 » ; 2 modes d'emploi retirés (« touche une part », « une seule à la fois »).
`,
};

// ---------- d, libre : les pastilles des lignes sont les filtres ----------
const d = {
  id: 'm1fi-d', titre: 'Filtres, les pastilles filtrent (libre)',
  css: `
.~-pal{margin:8px 10px 0;border-radius:16px;background:#FAF8F3;border:1px solid #E4E0D6;color:#111;padding:8px}
.~-on1{display:flex;align-items:center;gap:6px;font-size:13px}
.~-on1 .~-tg{font-size:13px;line-height:22px;padding:0 8px;background:#FFF7E6;color:#7A5500;box-shadow:inset 0 0 0 1.5px #E3C27E}
.~-on1 .~-m{font-size:13px}
.~-cl{margin-left:auto;width:32px;height:32px;border-radius:16px;background:#fff;border:1px solid #DDD8CC;color:#444;font-size:18px}
.~-pals{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}
.~-pals .~-tg{line-height:24px;font-size:12px;padding:0 8px}
.~-pals .~-pcx{display:inline-flex;align-items:center;gap:3px;line-height:24px;font-size:12px;padding:0 8px;border-radius:999px;background:#fff;color:#333;box-shadow:inset 0 0 0 1px #DDD8CC}
.~-pals .~-sel{box-shadow:0 0 0 2px #111;background:#FFF7E6;color:#7A5500}
.~-sqs{display:flex;gap:5px;margin-top:6px;align-items:center;font-size:12px;color:#555}
.~-sqs .~-sq{opacity:.95}
.~-hint{font-size:12px;color:#BDBDBD;margin-top:6px}
.~-hi{box-shadow:0 0 0 1.5px #111;border-radius:999px;padding:0 5px 0 3px;background:#FFF7E6}
.~-more{display:flex;flex-wrap:wrap;gap:0 12px;margin-top:6px;padding-top:2px;border-top:1px solid #EEE9DD;font-size:13px}
.~-more button{min-height:28px;color:#2F6EA8;font-weight:600}
.~-more .~-on{color:#111;text-decoration:underline;text-underline-offset:3px}
`,
  corps: () => head() + tabs() + band() + `
 <section class="~-pal" aria-label="Filtre actif" data-booster="pastilles-filtrent">
  <div class="~-on1">Filtré :<span class="~-tg">${ICONES.DOC_NO} sans pièce</span><b class="~-m">4</b> lignes · toutes dates<button class="~-cl" aria-label="Retirer le filtre">×</button></div>
  <div class="~-pals">
   <span class="~-tg ~-pay">à payer <b class="~-m">2</b></span>
   <span class="~-tg ~-late">en retard <b class="~-m">1</b></span>
   <span class="~-pcx ~-sel">${ICONES.DOC_NO}sans pièce <b class="~-m">4</b></span>
   <span class="~-pcx">à compléter <b class="~-m">4</b></span>
   <span class="~-pcx" style="opacity:.6">à encaisser <b class="~-m">0</b></span>
  </div>
  <div class="~-sqs">${['fixes', 'ventes', 'brassage', 'nettoyage', 'materiel'].map(k => sq(k, 26, 15)).join('')}<span>+3 catégories</span></div>
  <div class="~-more"><button class="~-on">Courantes</button><button>Tout</button><button>Annulées seulement</button><button>${ICONES.boite('#2F6EA8', 14)} Gérer les archives</button></div>
 </section>
 ${g('fixes', 'Charges fixes', '460,00')}${LIGNES.loyer(undefined, { pcCls: '~-hi' })}${LIGNES.solde(undefined, { pcCls: '~-hi' })}
 ${g('nettoyage', 'Nettoyage', '42,00')}${LIGNES.nett(undefined, { pcCls: '~-hi' })}
 <div class="~-part"></div>${g('materiel', 'Matériel · à part', '28,60')}${LIGNES.joints(undefined, { pcCls: '~-hi' })}
 ${foot({ on: 'filtres', nf: 1 })}
 ${nav()}`,
  note: `# m1fi-d — Filtres, les pastilles filtrent
**Genre** : d, libre. **Booster** : pastilles-filtrent (la même pastille sert à lire une ligne et à filtrer la liste ; appui long sur une ligne = même filtre).
**Idée** : pas de vocabulaire neuf. Les filtres reprennent les pastilles des lignes de v6a (hachure à payer, rouge en retard, pièce en pointillé),
et les carrés de catégorie. Le filtre posé reste en haut, dans un bandeau sable, avec son compte (4 lignes) et sa croix (= Retirer) ; les pièces trouvées sont cerclées.
**Gardé** : À payer, En retard, Sans justificatif (« sans pièce »), À compléter, À encaisser 0 grisé, catégories, Courantes / Tout,
Annulées seulement, Gérer les archives (dernière rangée du bandeau) ; v6a (bande, lignes, pied) sans retouche ; lignes groupées par catégorie seulement.
**Passe 2 : défauts corrigés** : 1 bandeau sable au lieu du bloc noir, phrase d'aide retirée ; 2 une seule commande (la rangée du bas entre dans le bandeau) ; 3 Solde 60,00 sous Charges fixes.
**Au port** : appui long sur une pastille = filtre (B9 : équivalent au toucher dans la barre noire) ; Sans date / À confirmer / Doublons
paraissent dans la barre seulement non vides.
`,
};

export default [a, b, c, d];
