// m1ap — Apport ou prélèvement privé (MovementSheet, sans pièce liée). Contenu du code : Mouvement (j'apporte / je reprends), « change la
// trésorerie sans modifier le résultat », Montant CHF (MoneyInput, jamais type=number), Date (≤ aujourd'hui), Motif (obligatoire), Moyen
// (Banque, Espèces, TWINT, Autre), « Enregistrer ce mouvement ». Le mode avoir / remboursement s'ouvre depuis une ligne (hors de cette vue).
import { head, tabs, band, foot, nav, derriere, sq, ICONES } from './commun.mjs';

const champ = `.~-f{display:flex;flex-direction:column;gap:3px;margin-top:10px}
.~-f>span{font-size:12px;color:#555}
.~-in{display:flex;align-items:center;gap:6px;min-height:44px;border:1px solid #CFCFCF;border-radius:12px;padding:0 12px;background:#fff}
.~-in input{border:0;outline:0;flex:1;min-width:0;font-size:16px;background:none}
.~-chips{display:flex;gap:5px;flex-wrap:wrap}
.~-c{min-height:32px;padding:0 11px;border-radius:16px;border:1px solid #D9D9D9;font-size:13px;background:#fff}
.~-c.~-on{background:#111;color:#fff;border-color:#111;font-weight:600}`;
const PERSO = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';
const BRAS = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F2C14E" stroke-width="2.2"><path d="M6 5h10v15H6z"/><path d="M16 9h3v6h-3"/></svg>';
const fond = (n) => derriere(head() + tabs() + band(), n);

const a = {
  id: 'm1ap-a', titre: 'Apport ou prélèvement, feuille rangée (tiède)',
  css: champ + `
.~-dir{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.~-d{min-height:52px;border-radius:14px;border:1px solid #D9D9D9;display:flex;align-items:center;gap:8px;padding:0 10px;font-size:14px;text-align:left;line-height:16px}
.~-d.~-on{border:2px solid #111;background:#F6FBF7}
.~-d i{font-style:normal;font-size:20px;width:26px;text-align:center}
.~-amt input{font-family:"IBM Plex Mono",monospace;font-weight:600;font-size:22px}
.~-amt b{font-size:14px;color:#555}
.~-info{margin-top:10px;font-size:12px;color:#555;display:flex;gap:6px;align-items:center}
`,
  corps: () => fond(80) + `
 <section class="~-sheet" aria-label="Apport ou prélèvement privé">
  <div class="~-grab"></div>
  <div class="~-shd"><h2>Apport ou prélèvement privé</h2><button class="~-x" aria-label="Fermer">×</button></div>
  <div class="~-dir" data-booster="sens-argent"><button class="~-d ~-on"><i style="color:#2A7240">↘</i>J'apporte de l'argent à la brasserie</button><button class="~-d"><i style="color:#8E2A23">↗</i>Je reprends de l'argent pour moi</button></div>
  <label class="~-f"><span>Montant</span><span class="~-in ~-amt"><input inputmode="decimal" value="500,00" aria-label="Montant en CHF"><b>CHF</b></span></label>
  <div class="~-f"><span>Date</span><div class="~-chips"><button class="~-c ~-on">aujourd'hui · 9 nov.</button><button class="~-c">hier</button><button class="~-c">autre date…</button></div></div>
  <label class="~-f"><span>Motif</span><span class="~-in"><input value="Apport pour le malt de décembre" aria-label="Motif" style="font-weight:600;color:#111"><button aria-label="Effacer le motif" style="width:28px;height:28px;border-radius:14px;background:#EEE;color:#555;font-size:16px">×</button></span></label>
  <div class="~-chips" style="margin-top:5px;align-items:center"><span style="font-size:12px;color:#555">ou</span><button class="~-c">Apport de départ</button><button class="~-c">Apport pour un achat</button></div>
  <div class="~-f"><span>Sur</span><div class="~-chips"><button class="~-c ~-on">Banque</button><button class="~-c">Espèces</button><button class="~-c">TWINT</button><button class="~-c">Autre</button></div></div>
  <p class="~-info">ⓘ Change la caisse de la brasserie, pas son résultat.</p>
  <button class="~-cta" style="margin-top:10px">Enregistrer l'apport · <span class="~-m">500,00</span></button>
 </section>`,
  note: `# m1ap-a — Apport ou prélèvement, feuille rangée
**Genre** : a, tiède. **Booster** : sens-argent (deux grosses cartes ↘ / ↗ au lieu de la liste déroulante « Mouvement »).
**Change** : la date devient des puces (aujourd'hui · 9 nov., hier, autre…), le moyen de paiement aussi ; le motif a deux suggestions
(les exemples du code) ; le bouton reprend le sens et le montant (« Enregistrer l'apport · 500,00 »).
**Gardé** : tous les champs du code (sens, montant CHF en inputmode décimal, date ≤ aujourd'hui, motif obligatoire, Banque / Espèces / TWINT / Autre),
la phrase « change la trésorerie, pas le résultat » (dite « la caisse »), v6a voilée derrière.
**Au port** : le mode « Avoir ou remboursement » (ouvert depuis une ligne) garde sa feuille ; « autre date… » ouvre le sélecteur, borné à aujourd'hui.
**Passe 2 : défauts corrigés** : 1 suggestions du même sens que l'apport (« Apport pour un achat ») ; 2 motif écrit en noir gras avec ×, suggestions après « ou ».
`,
};

const b = {
  id: 'm1ap-b', titre: 'Apport ou prélèvement, un montant signé (froide)',
  css: `
.~-big{display:flex;align-items:center;gap:10px;margin:8px 0 2px}
.~-sign{width:52px;height:52px;border-radius:16px;background:#E8F5EC;color:#22663A;font-size:28px;font-weight:700;box-shadow:inset 0 0 0 1.5px #9FD3AE}
.~-val{flex:1;display:flex;align-items:baseline;gap:6px;border-bottom:2px solid #111;padding-bottom:2px}
.~-val input{border:0;outline:0;width:100%;font-family:"IBM Plex Mono",monospace;font-weight:600;font-size:34px;line-height:42px;background:none;color:#111}
.~-val b{font-size:14px;color:#555}
.~-sens{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0 0}
.~-sens button{min-height:44px;border-radius:12px;background:#F3F3F3;font-size:14px}
.~-sens .~-on{background:#E8F5EC;color:#22663A;font-weight:700;box-shadow:inset 0 0 0 1.5px #9FD3AE}
.~-sum{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:10px 0 6px;font-size:13px}
.~-sum button{min-height:44px;padding:0 12px;border-radius:22px;background:#F3F3F3}
.~-info{font-size:12px;color:#555;margin:0 0 8px}
.~-kb{background:#D3D6DC;padding:6px 4px 10px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:12px -12px -16px}
.~-kb span{height:44px;border-radius:6px;background:#fff;display:grid;place-items:center;font-size:22px;box-shadow:0 1px 0 #8E9097}
.~-kb .~-k2{background:transparent;box-shadow:none}
`,
  corps: () => fond(40) + `
 <section class="~-sheet" aria-label="Apport ou prélèvement privé">
  <div class="~-grab"></div>
  <div class="~-shd"><h2 style="font-size:16px">Argent privé</h2><button class="~-x" aria-label="Fermer">×</button></div>
  <div class="~-big" data-booster="signe"><button class="~-sign" aria-label="Changer le sens : apport ou prélèvement">+</button><label class="~-val"><input inputmode="decimal" value="500,00" aria-label="Montant en CHF"><b>CHF</b></label></div>
  <div class="~-sens"><button class="~-on">+ J'apporte</button><button>− Je reprends</button></div>
  <div class="~-sum"><button>aujourd'hui</button><button>banque</button><button>« Apport privé » ✎</button></div>
  <p class="~-info">Change la caisse, pas le résultat.</p>
  <button class="~-cta">Enregistrer</button>
  <div class="~-kb" aria-hidden="true">${['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'].map(k => `<span class="${k === ',' || k === '⌫' ? '~-k2' : ''}">${k}</span>`).join('')}</div>
 </section>`,
  note: `# m1ap-b — Apport ou prélèvement, un montant signé
**Genre** : b, froide. **Booster** : signe (le + / − devant le montant choisit le sens ; la phrase dessous le dit en mots).
**Change** : un seul champ au premier plan, clavier décimal ouvert, « Enregistrer » juste au-dessus. Date, moyen et motif sont des résumés
préremplis (aujourd'hui, banque, « Apport privé ») qu'un toucher modifie.
**Gardé** : sens, montant CHF (inputmode décimal, jamais type=number), date, motif obligatoire (prérempli, donc jamais vide), moyen de paiement.
**Retiré du premier plan** : les puces Espèces / TWINT / Autre (sous « banque »).
**Passe 2 : défauts corrigés** : 1 « − pour reprendre » → deux boutons + J'apporte / − Je reprends (44 px) ; 2 résumés à 44 px ; 3 « change la caisse, pas le résultat » remis.
**Au port** : motif par défaut « Apport privé » / « Prélèvement privé » selon le signe ; le clavier dessiné ici est celui du téléphone.
`,
};

const c = {
  id: 'm1ap-c', titre: 'Apport ou prélèvement, les deux poches (chaude)',
  css: champ + `
.~-flow{display:grid;grid-template-columns:72px 1fr 72px;align-items:center;gap:6px;margin:6px 0 2px}
.~-who{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12px;color:#444;text-align:center}
.~-who span{width:56px;height:56px;border-radius:18px;display:grid;place-items:center}
.~-me{background:#EEF2F7;color:#33415C}
.~-br{background:#111}
.~-arrow{position:relative;height:56px;display:flex;align-items:center;justify-content:center}
.~-arrow::before{content:"";position:absolute;left:0;right:10px;top:50%;height:6px;margin-top:-3px;border-radius:3px;background:#56D27B}
.~-arrow::after{content:"";position:absolute;right:0;top:50%;margin-top:-11px;border:11px solid transparent;border-left:14px solid #56D27B;border-right:0}
.~-arrow input{position:relative;z-index:1;width:124px;text-align:center;border:2px solid #111;border-radius:14px;background:#fff;font-family:"IBM Plex Mono",monospace;font-weight:600;font-size:20px;min-height:44px}
.~-flip{display:flex;justify-content:center;margin-bottom:6px}
.~-eff{border-radius:14px;background:#FAF8F3;padding:8px;margin-top:8px}
.~-ln{display:grid;grid-template-columns:96px 1fr auto;gap:8px;align-items:center;min-height:28px;font-size:13px}
.~-tr{height:14px;border-radius:4px;background:#E4E0D6;position:relative;overflow:hidden}
.~-tr i{position:absolute;top:0;bottom:0;border-radius:4px}
.~-res{font-size:12px;color:#444;margin-top:2px}
`,
  corps: () => fond(70) + `
 <section class="~-sheet" aria-label="Apport ou prélèvement privé">
  <div class="~-grab"></div>
  <div class="~-shd"><h2>De ta poche à la brasserie</h2><button class="~-x" aria-label="Fermer">×</button></div>
  <div class="~-flow" data-booster="deux-poches"><div class="~-who"><span class="~-me">${PERSO}</span>Ta poche</div><div class="~-arrow"><input inputmode="decimal" value="500,00" aria-label="Montant en CHF"></div><div class="~-who"><span class="~-br">${BRAS}</span>La brasserie</div></div>
  <div class="~-flip"><button class="~-lien">⇄ Dans l'autre sens : je reprends</button></div>
  <div class="~-eff" data-booster="effet-mois">
   <div class="~-ln"><span>Caisse</span><span class="~-tr"><i style="left:0;width:58%;background:#BFC6D3"></i><i style="left:58%;width:30%;background:#56D27B"></i></span><b class="~-m" style="color:#2A7240">+500,00</b></div>
   <div class="~-ln"><span>Ventes − dépenses</span><span class="~-tr"><i style="left:0;width:3%;background:#111"></i></span><b class="~-m">+23,20</b></div>
   <p class="~-res" style="white-space:nowrap">inchangé : un apport n'est pas une vente</p>
  </div>
  <div class="~-f"><span>Quand</span><div class="~-chips"><button class="~-c ~-on">aujourd'hui · 9 nov.</button><button class="~-c">autre date…</button></div></div>
  <div class="~-f"><span>Sur quel compte</span><div class="~-chips"><button class="~-c ~-on">Banque</button><button class="~-c">Espèces</button><button class="~-c">TWINT</button><button class="~-c">Autre</button></div></div>
  <label class="~-f"><span>Motif</span><span class="~-in"><input value="Apport pour le malt de décembre" aria-label="Motif"></span></label>
  <button class="~-cta" style="margin-top:12px">Enregistrer l'apport</button>
 </section>`,
  note: `# m1ap-c — Apport ou prélèvement, les deux poches
**Genre** : c, chaude. **Boosters** : deux-poches (Ta poche → La brasserie, la flèche porte le montant ; « ⇄ » retourne le sens),
effet-mois (la caisse grandit de 500,00 ; ventes − dépenses de novembre reste +23,20 = 720,00 − 696,80 de v6a).
**Change** : la phrase du code « change la trésorerie sans modifier le résultat » devient une image : une barre bouge, l'autre pas.
La barre « Caisse » n'a pas de chiffre de départ (inconnu ici) : seule la part ajoutée est chiffrée.
**Gardé** : sens, montant CHF (inputmode décimal), date ≤ aujourd'hui, Banque / Espèces / TWINT / Autre, motif obligatoire, v6a voilée derrière.
**Au port** : solde de caisse réel s'il existe, sinon barre sans échelle comme ici ; en prélèvement, flèche rouge vers la poche.
**Passe 2 : défauts corrigés** : 1 date et compte sur deux rangées (« Quand », « Sur quel compte ») ; 2 phrase sous les barres en une ligne.
`,
};

const exp = [['Joints de la cuve', 'Inox &amp; Co · 9 nov.', '28,60', 1, '#567BD2'], ['Nettoyant alcalin', 'Comptoir du brasseur · 9 nov.', '42,00', 1, '#56C1D2'],
  ['Malt et houblons · Pale Ale', 'Comptoir du brasseur · banque', '186,80', -1, '#D2B356'], ['Électricité', 'Énergie · banque', '68,00', -1, '#9856D2']];
const d = {
  id: 'm1ap-d', titre: 'Apport ou prélèvement, payé de ma poche (libre)',
  css: `
.~-sg{display:grid;grid-template-columns:1.3fr 1fr 1fr;background:#F2F2F2;border-radius:14px;padding:3px;gap:3px}
.~-sg button{min-height:36px;border-radius:11px;font-size:13px;line-height:15px}
.~-sg .~-on{background:#111;color:#fff;font-weight:600}
.~-ask{font-size:16px;font-weight:700;margin:12px 0 4px}
.~-sub{font-size:13px;color:#555;margin-bottom:6px}
.~-e{display:grid;grid-template-columns:4px 1fr auto 32px;gap:8px;align-items:center;min-height:48px;border-bottom:1px solid #F0F0F0}
.~-e i{align-self:stretch;margin:6px 0;border-radius:2px}
.~-e b{font-size:14px;display:block}
.~-e small{font-size:12px;color:#555}
.~-e .~-m{font-size:14px}
.~-box{width:28px;height:28px;border-radius:8px;border:2px solid #BDBDBD;display:grid;place-items:center;font-weight:700}
.~-box.~-on{background:#111;border-color:#111;color:#fff}
.~-e.~-off{opacity:.45}
.~-tot{margin-top:10px;border-radius:14px;background:#F6FBF7;box-shadow:inset 0 0 0 1px #CFE8D6;padding:8px 10px;display:flex;align-items:center;gap:8px}
.~-tot p{flex:1;font-size:13px;line-height:17px}
.~-tot .~-m{font-size:20px;color:#2A7240}
`,
  corps: () => fond(60) + `
 <section class="~-sheet" aria-label="Apport ou prélèvement privé">
  <div class="~-grab"></div>
  <div class="~-shd"><h2>Argent privé</h2><button class="~-x" aria-label="Fermer">×</button></div>
  <div class="~-sg"><button class="~-on">Payé de ma poche</button><button>J'apporte</button><button>Je reprends</button></div>
  <p class="~-ask">Quels achats as-tu payés avec ton argent ?</p>
  <p class="~-sub">Ceux de novembre payés sans compte de la brasserie.</p>
  <div data-booster="cocher-achats">${exp.map(([n, s, m, on, c]) => `<div class="~-e${on < 0 ? ' ~-off' : ''}"><i style="background:${c}"></i><span><b>${n}</b><small>${s}</small></span><span class="~-m">${m}</span><span class="~-box${on > 0 ? ' ~-on' : ''}">${on > 0 ? '✓' : ''}</span></div>`).join('')}</div>
  <div class="~-tot" data-booster="apport-calcule"><p><b>Apport privé</b><br>Joints + nettoyant, payés de ta poche le 9 nov.</p><span class="~-m">70,60</span></div>
  <button class="~-cta" style="margin-top:10px">Enregistrer l'apport · <span class="~-m">70,60</span></button>
  <p style="font-size:12px;color:#666;margin-top:8px;text-align:center">Change la caisse, pas le résultat.</p>
 </section>`,
  note: `# m1ap-d — Apport ou prélèvement, payé de ma poche
**Genre** : d, libre. **Boosters** : cocher-achats (les achats du mois, cochés « payé avec mon argent »), apport-calcule (la somme devient l'apport : 70,60).
**Idée** : le cas le plus fréquent d'un brasseur seul : il paie un achat de la brasserie avec sa carte. Il coche l'achat, l'apport se calcule et
se motive tout seul (« Joints + nettoyant… »). Les deux autres onglets gardent la saisie libre du code (J'apporte, Je reprends).
**Gardé** : montant, date (celle des achats), motif (rédigé), sens, « change la caisse, pas le résultat » ; un achat déjà payé par la banque est grisé.
**Au port** : demande de relier l'apport aux achats (moyen de paiement « privé » sur le paiement) : à décider au modèle de données ; sans lien,
c'est un apport ordinaire au montant coché. Données v6a (joints 28,60, nettoyant 42,00 « payé 9 nov. » sans compte).
**Passe 2 : défauts corrigés** : 1 Malt et houblons 186,80 payé par la banque (comme m2fo), grisé avec l'électricité ; seuls joints et nettoyant restent à cocher.
`,
};

export default [a, b, c, d];
