// m1do — Doublons. Contenu du code : filtre `doublon` (suivi toutes dates), groupes de ledgerDuplicates (raison : même facture n° chez le même
// fournisseur, même référence QR, même commande), « Rien n'est supprimé », annuler l'écriture en trop (depuis la ligne), « Ce n'est pas un doublon »
// (écarte l'avertissement sur cet appareil, aucune écriture modifiée ; plus aucun groupe → le filtre se referme).
// Données : v6a + une paire d'octobre (houblons Citra, Hopfen & Co, même référence QR), hors du mois : novembre de v6a reste juste.
import { head, tabs, band, g, op, foot, nav, derriere, sq, ICONES } from './commun.mjs';

const citra = (src, x = {}) => op({ bar: '#D2B356', nom: 'Houblons Citra 1 kg', sub: 'Hopfen &amp; Co', montant: '94,50', tag: '✓ payé 16 oct. · banque', pc: `facture · ${src}`, ...x });
const QR = '…0447 1';

// ---------- a, tiède ----------
const a = {
  id: 'm1do-a', titre: 'Doublons, la paire dans la liste (tiède)',
  css: `
.~-avis{margin:8px 10px 0;border-radius:16px;background:#FAF8F3;padding:8px 10px;display:grid;grid-template-columns:28px 1fr;gap:8px;align-items:start}
.~-avis b{font-size:15px}
.~-avis p{font-size:13px;color:#444}
.~-two{width:28px;height:28px;border-radius:10px;background:#FDF1F0;box-shadow:inset 0 0 0 1px #F1C9C5;color:#8E2A23;display:grid;place-items:center;font-weight:700;font-size:13px}
.~-grp{margin:8px 10px 0;border:1px solid #E6E6E6;border-radius:16px;overflow:hidden}
.~-why{display:flex;align-items:center;gap:6px;padding:6px 10px;background:#FFF;font-size:13px;color:#333;border-bottom:1px solid #F0F0F0}
.~-why b{font-weight:600}
.~-grp .~-op{padding-left:10px}
.~-gf{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#FAFAFA}
.~-grp .~-act,.~-annex .~-act{white-space:nowrap}
.~-gf span{font-size:12px;color:#555}
.~-out{min-height:32px;padding:0 12px;border-radius:12px;border:1px solid #CFCFCF;background:#fff;font-size:13px;font-weight:600}
.~-annex{margin:16px 10px 0;border:1px solid #DADADA;border-radius:16px;padding:8px 0 4px;background:#fff}
.~-annex h2{font-size:13px;font-weight:600;color:#2F6EA8;padding:0 10px 6px}
.~-void .~-q,.~-void .~-a{text-decoration:line-through;color:#8A8A8A}
.~-gris{background:#F0F0F0;color:#555}
.~-eff{display:flex;gap:10px;padding:6px 10px 4px;font-size:12px;color:#444;flex-wrap:wrap}
.~-eff b{font-size:13px;color:#111}
`,
  corps: () => head() + tabs() + band() + `
 <div class="~-avis" role="note"><span class="~-two">×2</span><div><b>2 pièces peut-être en double</b><p>Rien n'est supprimé. Annule celle en trop, ou écarte l'avertissement.</p></div></div>
 <section class="~-grp" data-booster="paire-doublon">
  <div class="~-why">${sq('brassage')}<b>Même référence QR</b><span style="margin-left:auto">finit par <b class="~-m" style="font-size:13px">04471</b></span></div>
  ${citra('photo', { act: '<button class="~-mini ~-act">Annuler celle-ci</button>' })}
  ${citra('courriel', { act: '<button class="~-mini ~-act">Annuler celle-ci</button>' })}
  <div class="~-gf"><span>saisies le 14 et le 15 oct.</span><button class="~-out" data-booster="ecarter">Ce n'est pas un doublon</button></div>
 </section>
 ${foot({ on: 'doublons', nd: 2 })}
 <section class="~-annex" aria-label="État : la seconde annulée">
  <h2>Après « Annuler celle-ci » sur la pièce du courriel</h2>
  ${citra('photo')}
  ${citra('courriel', { cls: '~-void', etat: 'ok', tgCls: '~-gris', tag: 'annulée le 9 nov.', act: '<button class="~-mini ~-act">Rétablir</button>' })}
  <div class="~-eff"><span>octobre, brassage <b class="~-m">−94,50</b></span><span>Doublons : plus rien, le filtre se referme</span></div>
 </section>
 ${nav()}`,
  note: `# m1do-a — Doublons, la paire dans la liste
**Genre** : a, tiède. **Boosters** : paire-doublon (les deux pièces en lignes v6a dans un même cadre), ecarter.
**Change** : le paragraphe et la liste à puces du code deviennent un avis court (×2) et un cadre par groupe : la raison en tête
(« Même référence QR », Hopfen &amp; Co), les deux lignes complètes, « Annuler celle-ci » sur chaque ligne (le code renvoie à la ligne pour annuler).
**Gardé** : « Rien n'est supprimé », « Ce n'est pas un doublon » par groupe, le compte sur « Doublons 2 », le filtre qui se referme quand c'est vide.
**État montré** (cadre bleu) : la seconde annulée, barrée, « Rétablir » ; octobre brassage −94,50.
**Données** : une paire d'octobre ajoutée (hors du mois) ; la bande et novembre de v6a restent justes.
**Au port** : « Annuler celle-ci » = l'annulation existante de la ligne (pas de suppression) ; la raison vient de ledgerDuplicates.
**Passe 2 : défauts corrigés** : 1 « Annuler celle-ci » sur une ligne ; 2 référence lisible (« finit par 04471 » ; Hopfen &amp; Co reste dans chaque ligne).
`,
};

// ---------- b, froide ----------
const b = {
  id: 'm1do-b', titre: 'Doublons, une question (froide)',
  css: `
.~-q1{font-size:20px;line-height:24px;font-weight:700;margin:4px 0 2px}
.~-who{font-size:14px;color:#444;display:flex;align-items:center;gap:6px}
.~-pair{display:flex;flex-direction:column;gap:4px;margin:12px 0}
.~-pc1{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;min-height:44px;padding:0 12px;border-radius:12px;background:#F7F7F7}
.~-pc1 .~-m{font-size:15px}
.~-pc1 span{font-size:13px;color:#555}
.~-btns{display:grid;gap:8px}
.~-small{display:flex;justify-content:space-between;margin-top:10px;font-size:12px;color:#666}
.~-why{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:13px;color:#111}
.~-why i{font-style:normal;width:22px;height:22px;border-radius:11px;background:#E8F5EC;color:#22663A;display:grid;place-items:center;font-weight:700}
`,
  corps: () => derriere(head() + tabs() + band() + g('fixes', 'Charges fixes', '468,00'), 60) + `
 <section class="~-sheet" aria-label="Doublon possible" data-booster="question-doublon">
  <div class="~-grab"></div>
  <div class="~-shd"><span style="font-size:13px;color:#555;font-weight:600;flex:1">1 sur 1</span><button class="~-x" aria-label="Fermer">×</button></div>
  <p class="~-q1">Deux fois la même facture ?</p>
  <p class="~-who">${sq('brassage')}Houblons Citra 1 kg · Hopfen &amp; Co</p>
  <p class="~-why"><i>=</i>Même référence QR, même montant, même facture du 14 oct.</p>
  <div class="~-pair">
   <div class="~-pc1"><span style="color:#22663A">${ICONES.DOC_OK}</span><span>photo · payé 16 oct.</span><b class="~-m">94,50</b></div>
   <div class="~-pc1"><span style="color:#22663A">${ICONES.DOC_OK}</span><span>courriel · payé 16 oct.</span><b class="~-m">94,50</b></div>
  </div>
  <div class="~-btns"><button class="~-cta">Annuler celle du courriel</button><button class="~-sec">Ce n'est pas un doublon</button></div>
  <div class="~-small"><span>Rien n'est supprimé.</span><button class="~-lien" style="min-height:0">Voir les deux pièces ›</button></div>
 </section>`,
  note: `# m1do-b — Doublons, une question
**Genre** : b, froide. **Booster** : question-doublon (une paire à la fois, deux réponses de 44 px).
**Change** : au lieu d'un filtre de liste, une feuille pose la question « Deux fois la même facture ? » : deux pièces en une ligne chacune,
deux réponses. La plus récente est proposée à l'annulation ; « 1 sur 1 » dit combien de paires restent.
**Gardé** : « Rien n'est supprimé », « Ce n'est pas un doublon » (écarter), l'annulation (pas de suppression), v6a derrière.
**Retiré du premier plan** : le détail des lignes, sous « Voir les deux pièces › ».
**Passe 2 : défauts corrigés** : 1 « 1 sur 1 » en gris ; 2 la raison dite sous le nom (« = Même référence QR, même montant, même facture du 14 oct. »).
**Au port** : ordre de proposition (la saisie la plus récente) à confirmer ; au-delà d'une paire, « Suivante » après chaque réponse.
`,
};

// ---------- c, chaude : les deux pièces superposées, champ par champ ----------
const rows = [['Fournisseur', 'Hopfen &amp; Co', 'Hopfen &amp; Co', 1], ['Référence QR', '…0447 1', '…0447 1', 1], ['Montant', '94,50', '94,50', 1, 1],
  ['Facture du', '14 oct.', '14 oct.', 1], ['Payé', '16 oct. · banque', '16 oct. · banque', 1], ['Lignes', 'Citra 1 kg', 'Citra 1 kg', 1], ['Pièce', 'photo', 'courriel', 0]];
const c = {
  id: 'm1do-c', titre: 'Doublons, champ par champ (chaude)',
  css: `
.~-hdr{display:grid;grid-template-columns:96px 1fr 26px 1fr;gap:4px;align-items:end;font-size:12px;color:#555;padding:0 0 4px}
.~-hdr b{font-size:13px;color:#111}
.~-cmp{border-radius:14px;border:1px solid #E6E6E6;overflow:hidden}
.~-l{display:grid;grid-template-columns:96px 1fr 26px 1fr;gap:4px;align-items:center;min-height:30px;padding:0 8px;font-size:13px;border-bottom:1px solid #F2F2F2}
.~-l:last-child{border-bottom:0}
.~-l>span:first-child{font-size:12px;color:#555}
.~-eq{width:22px;height:22px;border-radius:11px;display:grid;place-items:center;font-weight:700;font-size:13px}
.~-same .~-eq{background:#E8F5EC;color:#22663A}
.~-diff{background:#FFF8EC}.~-diff .~-eq{background:#FBE3B8;color:#7A5500}
.~-jg{display:flex;align-items:center;gap:10px;margin:10px 0}
.~-ring{width:56px;height:56px;border-radius:50%;background:conic-gradient(#3C9A5A 0 85.7%,#EAEAEA 85.7%);display:grid;place-items:center}
.~-ring b{width:44px;height:44px;border-radius:50%;background:#fff;display:grid;place-items:center;font-size:14px}
.~-jg p{font-size:14px;line-height:18px}
.~-jg small{display:block;font-size:12px;color:#555}
.~-eff{border-radius:14px;background:#FAF8F3;padding:8px;margin-bottom:10px}
.~-eff p{font-size:12px;color:#444;display:flex;justify-content:space-between}
.~-trk{position:relative;height:18px;border-radius:5px;background:#D2B356;margin:5px 0 3px}
.~-ghost{position:absolute;right:0;top:0;bottom:0;width:13.8%;border-radius:0 5px 5px 0;background:#fff;box-shadow:inset 0 0 0 1.5px #D6453D;background:#FDECEA}
.~-two{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.~-two .~-sec{padding:0 8px;font-size:14px}
`,
  corps: () => derriere(head() + tabs() + band(), 150) + `
 <section class="~-sheet" aria-label="Doublon possible">
  <div class="~-grab"></div>
  <div class="~-shd"><h2>Doublon possible</h2><button class="~-x" aria-label="Fermer">×</button></div>
  <div class="~-jg" data-booster="jauge-ressemblance"><span class="~-ring"><b class="~-m">6/7</b></span><p><b>Six champs sur sept sont pareils.</b><small>Seule la façon de l'avoir reçue change : photo, puis courriel.</small></p></div>
  <div class="~-hdr"><span></span><b>saisie du 14 oct.</b><span></span><b>saisie du 15 oct.</b></div>
  <div class="~-cmp" data-booster="champ-par-champ">
   ${rows.map(([k, x, y, s, m]) => `<div class="~-l ${s ? '~-same' : '~-diff'}"><span>${k}</span><span${m ? ' class="~-m"' : ''}>${x}</span><span class="~-eq">${s ? '=' : '≠'}</span><span${m ? ' class="~-m"' : ''}>${y}</span></div>`).join('')}
  </div>
  <div class="~-eff" style="margin-top:10px" data-booster="effet-mois">
   <p><span>Brassage, octobre</span><span><b class="~-m">683,60</b> → <b class="~-m">589,10</b></span></p>
   <div class="~-trk"><span class="~-ghost"></span></div>
   <p><span>la part rouge est comptée deux fois</span><span class="~-m">94,50</span></p>
  </div>
  <div class="~-two"><button class="~-sec">Pas un doublon</button><button class="~-cta">Annuler la seconde</button></div>
  <p style="font-size:12px;color:#666;margin-top:8px;text-align:center">Rien n'est supprimé : l'annulée reste visible, barrée.</p>
 </section>`,
  note: `# m1do-c — Doublons, champ par champ
**Genre** : c, chaude. **Boosters** : jauge-ressemblance (6/7), champ-par-champ (= vert, ≠ ambré), effet-mois (la barre Brassage d'octobre
avec la part comptée deux fois, 683,60 → 589,10).
**Change** : on décide en voyant pourquoi c'est un doublon et ce que ça coûte, pas sur une phrase. Feuille au lieu de la note dans la liste.
**Gardé** : la raison du code (ici la référence QR, ligne 2), « Ce n'est pas un doublon » (« Pas un doublon »), l'annulation, « Rien n'est supprimé ».
**Données** : paire d'octobre ajoutée, Brassage d'octobre 683,60 posé pour l'exemple (hors v6a, qui ne montre que novembre).
**Au port** : comparer les champs de la pièce (fournisseur, n°, référence, montant, dates, lignes, source) ; un champ inconnu s'écrit « ? », jamais « = ».
**Passe 2 : défauts corrigés** : 1 part en double en aplat rouge pâle, sans rayure (la hachure reste « à payer ») ; 2 « 1 paire » retiré (pas de greffe « 1 sur n »).
`,
};

// ---------- d, libre : deux tickets agrafés ----------
const ticket = (src, date, rot, top) => `<div class="~-tk" style="transform:rotate(${rot}deg);top:${top}px">
  <div class="~-tkh"><b>HOPFEN &amp; CO</b><span>Facture · ${date}</span></div>
  <div class="~-tkl"><span>Citra T90, 1 kg</span><span class="~-m">94,50</span></div>
  <div class="~-tkl"><span>Réf. QR</span><span class="~-m">…0447 1</span></div>
  <div class="~-tkl ~-tot"><span>Total CHF</span><span class="~-m">94,50</span></div>
  <div class="~-src">${src}</div>
 </div>`;
const d = {
  id: 'm1do-d', titre: 'Doublons, tickets agrafés (libre)',
  css: `
.~-zone{background:#F1EEE6;padding:10px 10px 14px;margin-top:8px}
.~-ti{display:flex;justify-content:space-between;align-items:baseline}
.~-ti b{font-size:18px}
.~-ti span{font-size:13px;color:#555}
.~-stack{position:relative;height:156px;margin:14px 0 0}
.~-tk{position:absolute;width:49%;background:#fff;padding:10px 12px 14px;box-shadow:0 2px 6px rgba(0,0,0,.18);font-size:13px;
 -webkit-mask:linear-gradient(#000,#000) top/100% calc(100% - 8px) no-repeat,conic-gradient(from 135deg at top,#0000,#000 1deg 89deg,#0000 90deg) bottom/12px 8px repeat-x}
.~-tkh{display:flex;flex-direction:column;border-bottom:1px dashed #CCC;padding-bottom:4px;margin-bottom:4px}
.~-tkh b{letter-spacing:.06em}
.~-tkh span{font-size:12px;color:#555}
.~-tkl{display:flex;justify-content:space-between;line-height:20px}
.~-tot{border-top:1px solid #111;margin-top:3px;font-weight:700}
.~-src{display:inline-block;margin-top:4px;font-size:12px;color:#7A5500;background:#FFF3D9;border-radius:6px;padding:0 6px}
.~-staple{position:absolute;left:50%;top:2px;width:42px;height:10px;margin-left:-21px;border:3px solid #9A9A9A;border-bottom:0;border-radius:3px 3px 0 0;z-index:4}
.~-sw{display:flex;justify-content:space-between;margin:6px 0 8px;font-size:13px;font-weight:600}
.~-sw span:first-child{color:#2F6EA8}.~-sw span:last-child{color:#8E2A23}
.~-two{display:grid;grid-template-columns:.85fr 1.15fr;gap:8px;margin-top:12px}
.~-two .~-sec{background:#fff;border:1px solid #D9D9D9;font-size:14px;padding:0 6px}
.~-two .~-cta{font-size:14px}
.~-done{margin:12px 10px 0;border-radius:14px;border:1px solid #E6E6E6;padding:8px 10px;position:relative;overflow:hidden}
.~-done p{font-size:13px;color:#444;padding-right:92px}.~-done>b{display:block;padding-right:92px}
.~-done b{font-size:14px;color:#111}
.~-stamp{position:absolute;right:10px;top:12px;transform:rotate(-8deg);border:2px solid #2A7240;color:#2A7240;border-radius:6px;padding:0 6px;font-weight:700;font-size:13px;letter-spacing:.04em}
`,
  corps: () => head() + tabs() + `
 <section class="~-zone" aria-label="Doublons">
  <div class="~-ti"><b>Agrafées par erreur ?</b><span>1 paire à trier · rien n'est supprimé</span></div>
  <div class="~-stack" data-booster="tickets-agrafes">${ticket('reçue par photo', '14.10.2026', -2.5, 4).replace('top:4px', 'top:4px;left:0')}${ticket('reçue par courriel', '14.10.2026', 2.5, 10).replace('top:10px', 'top:10px;right:0')}<span class="~-staple"></span></div>
  <div class="~-two"><button class="~-sec">← Pas un doublon</button><button class="~-cta">Annuler celle du courriel →</button></div>
 </section>
 <div class="~-done" data-booster="tampon-ecarte"><span class="~-stamp">ÉCARTÉ</span><b>Comptoir du brasseur · Cmd 5512</b>
  <p>Le bon de commande 5512 et la facture qui le reprend.</p><p style="margin-top:2px">Tu as dit : pas un doublon. <button class="~-lien" style="min-height:0">Revoir</button></p></div>
 ${foot({ on: 'doublons', nd: 2 })}
 ${nav()}`,
  note: `# m1do-d — Doublons, tickets agrafés
**Genre** : d, libre. **Boosters** : tickets-agrafes (les deux pièces dessinées comme des tickets, agrafés ; glisser à gauche = deux achats,
à droite = une en trop, avec les deux boutons équivalents), tampon-ecarte (le groupe déjà trié garde un tampon et « Revoir »).
**Idée** : un brasseur reconnaît une facture à son allure, pas à une phrase ; les deux papiers se lisent côte à côte en un coup d'œil.
**Gardé** : raison (même référence QR, et ici un 2e genre : « même commande 5512 », bon de commande et facture), écarter, annuler, « Rien n'est supprimé » (en titre).
**Passe 2 : défauts corrigés** : 1 un seul mode d'emploi (les flèches des boutons disent le glisser) ; 2 « bon de commande 5512 » ; 3 tickets côte à côte, lisibles tous deux.
**Change** : la liste filtrée est remplacée par la pile ; la bande de v6a n'est pas montrée dans cette vue (le pied reste).
**Données** : paire d'octobre + groupe Cmd 5512 (écarté) ajoutés, hors novembre. **Au port** : vraie miniature de la pièce si elle existe, sinon ce ticket redessiné.
`,
};

export default [a, b, c, d];
