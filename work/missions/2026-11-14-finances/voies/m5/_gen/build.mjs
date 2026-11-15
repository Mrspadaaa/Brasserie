// Voie m5 (15.11) : ses trois retours greffés sur les bases choisies, reprises telles quelles (règle n° 1).
// Bases : copie de voies/m2/build.mjs (m2base.mjs) et de voies/m1/_gen (m1/). Assemblage par split/join et indices (L26).
// Usage : node work/missions/2026-11-14-finances/voies/m5/_gen/build.mjs   (écrit etat.html, NOTE.md, puis capture <id>.png)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { V, page, ic, sq, LIGNES } from './m2base.mjs';
import ap from './m1/ap.mjs';
import { page as pageM1 } from './m1/commun.mjs';
import { ouvrir } from '../../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';

const VOIE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Une greffe exige un repère unique : sinon on s'arrête (pas de remplacement silencieux).
const un = (s, m) => { const n = s.split(m).length - 1; if (n !== 1) throw new Error(`repère ×${n} : ${m.slice(0, 60)}`); };
const avant = (s, m, x) => { un(s, m); return s.split(m).join(x + m); };
const apres = (s, m, x) => { un(s, m); return s.split(m).join(m + x); };
const entre = (s, debut, fin, x) => { un(s, debut); const i = s.indexOf(debut); const j = s.indexOf(fin, i); if (j < 0) throw new Error('fin absente'); return s.slice(0, i) + x + s.slice(j + fin.length); };
const sorties = [];
const rendre = (id, titre, html, note) => sorties.push({ id, titre, html, note });

/* ───────── m5mo : m2mo-a telle quelle, montant en champ, quatre façons de traiter le paiement déjà noté ───────── */
const MO = {
  'm5mo-a': {
    titre: 'Modifier, tiède : le paiement suit le montant et le dit',
    css: (p) => `
.${p}-suit{margin-top:6px;border-radius:12px;background:#F2F8F3;border:1px solid #D5E8DA;padding:6px 10px}
.${p}-suit div{display:flex;align-items:center;gap:8px;min-height:32px;font-size:14px}
.${p}-suit div .${p}-tx{flex:1;color:#333}
.${p}-suit p{font-size:12px;color:#3D5A45;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.${p}-suit p a{color:#2F6EA8;font-weight:600;min-height:28px;display:inline-flex;align-items:center}`,
    bloc: (p) => `<div class="${p}-suit" data-booster="paiement-suit" data-etat="montant-modifie"><div><span class="${p}-tg ${p}-ok">✓ payé</span><span class="${p}-tx">9 nov. · banque ${ic.bas(13)}</span><b class="${p}-m">45,50</b></div><p>Le paiement suit le montant · <a href="#">garder 42,00 payé</a></p></div>`,
    note: `# m5mo-a — Modifier, tiède : le paiement suit
**Genre** : a, tiède. **Base** : m2mo-a telle quelle (pièce en tête, champs, Drive, Annuler / Enregistrer).
**Change** : le montant devient un champ (texte, inputmode décimal, plus de cadenas) ; état montré : 42,00 → 45,50.
Le paiement déjà noté suit tout seul et le dit, sur une ligne verte : « ✓ payé 9 nov. · banque 45,50 » ; sa date et son moyen s'ouvrent au ⌄.
Sortie : « garder 42,00 payé » (la différence passe alors à payer). « Déjà payé : avoir ou annuler » disparaît.
**Boosters** : paiement-suit (suivre). **Au port** : retirer \`moneyLocked\` (EditTransactionModal) et mettre à jour le paiement unique ; plusieurs paiements : variante b.`,
  },
  'm5mo-b': {
    titre: 'Modifier, froide : le paiement reste, la différence passe à payer',
    css: (p) => `
.${p}-dif{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px;font-size:13px}
.${p}-dif .${p}-tg{line-height:24px;font-size:13px;padding:0 8px}
.${p}-dif button{margin-left:auto;min-height:32px;padding:0 10px;border-radius:10px;border:1px solid #DADADA;background:#fff;font-size:13px;font-weight:600;color:#222}`,
    bloc: (p) => `<div class="${p}-dif" data-booster="reste-a-payer" data-etat="montant-modifie"><span class="${p}-tg ${p}-ok">✓ payé <b class="${p}-m">42,00</b></span><span class="${p}-tg ${p}-pay">reste <b class="${p}-m">3,50</b> à payer</span><button>Payer 3,50</button></div>`,
    note: `# m5mo-b — Modifier, froide : la différence passe à payer
**Genre** : b, froide. **Base** : m2mo-a telle quelle.
**Change** : montant en champ (inputmode décimal, plus de cadenas) ; état montré : 42,00 → 45,50.
Le paiement noté ne bouge pas ; deux pastilles sous le champ : « ✓ payé 42,00 » et, hachurée, « reste 3,50 à payer », avec « Payer 3,50 ».
Montant baissé (ex. 40,00) : la pastille devient « trop payé 2,00 » et propose l'avoir.
**Boosters** : reste-a-payer (lire). **Au port** : retirer \`moneyLocked\` ; le reste vient de l'état de paiement existant (remainingCents).`,
  },
  'm5mo-c': {
    titre: 'Modifier, chaude : un choix, et l\'aperçu de la rangée avant / après',
    css: (p) => `
.${p}-ch{display:grid;grid-template-columns:1fr 1fr;border:1px solid #DADADA;border-radius:12px;overflow:hidden;margin-top:8px}
.${p}-ch button{min-height:44px;font-size:14px;color:#333;border-left:1px solid #DADADA;line-height:16px;padding:4px 6px}
.${p}-ch button:first-child{border-left:0}
.${p}-ch .${p}-on{background:#111;color:#fff;font-weight:600}
.${p}-ch small{display:block;font-size:12px;font-weight:400;opacity:.85}
.${p}-ap{margin-top:8px;border-radius:14px;background:#FAF8F3;padding:6px 10px 8px}
.${p}-ap h4{font-size:12px;color:#555;font-weight:600;margin-bottom:2px}
.${p}-rw{display:grid;grid-template-columns:4px 1fr auto;gap:2px 8px;align-items:center;padding:5px 0}
.${p}-rw i{grid-row:1/3;align-self:stretch;border-radius:2px;background:#56C1D2}
.${p}-rw b{font-size:14px}
.${p}-rw .${p}-m{font-size:15px;text-align:right}
.${p}-rw .${p}-meta{grid-column:2/4;display:flex;gap:5px;align-items:center;font-size:12px}
.${p}-old{opacity:.5;border-bottom:1px dashed #D6CFBD}
.${p}-old .${p}-m{text-decoration:line-through}`,
    bloc: (p) => `<div class="${p}-ch" data-booster="choix-paiement" role="radiogroup" aria-label="Le paiement déjà noté"><button role="radio" aria-checked="false">Le paiement suit<small>payé 45,50</small></button><button role="radio" aria-checked="true" class="${p}-on">Reste à payer<small>payé 42,00 · reste 3,50</small></button></div>
 <div class="${p}-ap" data-booster="apercu-rangee" data-etat="montant-modifie"><h4>Dans Opérations</h4>
  <div class="${p}-rw ${p}-old"><i></i><b>Nettoyant alcalin</b><span class="${p}-m">42,00</span><span class="${p}-meta"><span class="${p}-tg ${p}-ok">✓ payé 9 nov.</span><span class="${p}-pc ${p}-no">${ic.doc(false, 13)}sans pièce</span><span class="${p}-mu" style="margin-left:auto">avant</span></span></div>
  <div class="${p}-rw"><i></i><b>Nettoyant alcalin</b><span class="${p}-m">45,50</span><span class="${p}-meta"><span class="${p}-tg ${p}-ok">✓ payé 42,00</span><span class="${p}-tg ${p}-pay">reste 3,50</span><span class="${p}-pc ${p}-no">${ic.doc(false, 13)}sans pièce</span><span class="${p}-mu" style="margin-left:auto">après</span></span></div>
 </div>`,
    note: `# m5mo-c — Modifier, chaude : choix et aperçu avant / après
**Genre** : c, chaude. **Base** : m2mo-a telle quelle.
**Change** : montant en champ (inputmode décimal, plus de cadenas) ; état montré : 42,00 → 45,50.
Sous le champ, un segment « Le paiement suit · payé 45,50 » / « Reste à payer · payé 42,00 · reste 3,50 », puis la rangée v6a
telle qu'elle sera dans Opérations, avant (barrée, pâle) et après (hachure « reste 3,50 »). Toucher le segment change l'aperçu.
**Boosters** : choix-paiement (choisir), apercu-rangee (lire l'effet). **Au port** : retirer \`moneyLocked\` ; l'aperçu réutilise la rangée v6a.`,
  },
  'm5mo-d': {
    titre: 'Modifier, libre : les lignes de la pièce refont le total, chacune payée ou à payer',
    css: (p) => `
.${p}-lg{margin-top:8px;border:1px solid #EBEBEB;border-radius:14px;padding:2px 10px}
.${p}-l{display:grid;grid-template-columns:1fr 92px 30px;gap:8px;align-items:center;min-height:50px;border-bottom:1px solid #F0F0F0}
.${p}-l input{font:inherit;border:1px solid #DADADA;border-radius:10px;height:40px;padding:0 10px;font-size:16px;width:100%;background:#fff;color:#111;min-width:0}
.${p}-l input.${p}-a{font-family:"IBM Plex Mono",monospace;font-weight:600;text-align:right}
.${p}-l .${p}-st{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-size:14px;font-weight:700}
.${p}-l .${p}-st.${p}-ok{background:#E8F5EC;color:#22663A}
.${p}-l .${p}-st.${p}-pay{box-shadow:inset 0 0 0 1px #C99A3A}
.${p}-l.${p}-new input{border-color:#2F6EA8}
.${p}-add{display:flex;align-items:center;justify-content:space-between;min-height:44px;font-size:14px}
.${p}-add a{color:#2F6EA8;font-weight:600}
.${p}-add span{font-size:13px;color:#555}
.${p}-lh{font-size:12px;color:#555;font-weight:600;padding-top:6px}`,
    bloc: (p) => `<div class="${p}-lg" data-booster="lignes-refont-total" data-etat="montant-modifie">
  <p class="${p}-lh">Lignes de la pièce · le montant en fait le total</p>
  <div class="${p}-l"><input type="text" value="Nettoyant alcalin 5 L" aria-label="Ligne 1"><input class="${p}-a" type="text" inputmode="decimal" value="42,00" aria-label="Montant ligne 1"><span class="${p}-st ${p}-ok" title="payé 9 nov.">✓</span></div>
  <div class="${p}-l ${p}-new"><input type="text" value="Gants nitrile" aria-label="Ligne 2"><input class="${p}-a" type="text" inputmode="decimal" value="3,50" aria-label="Montant ligne 2"><span class="${p}-st ${p}-hat" title="à payer"></span></div>
  <div class="${p}-add"><a href="#">+ ligne</a><span><span class="${p}-tg ${p}-ok">✓ 42,00</span> <span class="${p}-tg ${p}-pay">à payer 3,50</span></span></div>
 </div>`,
    total: true,
    note: `# m5mo-d — Modifier, libre : les lignes refont le total
**Genre** : d, libre. **Base** : m2mo-a telle quelle.
**Change** : le montant est un champ (inputmode décimal) et le total des lignes de la pièce, éditables sous lui ;
ajouter « Gants nitrile 3,50 » fait 42,00 → 45,50. Chaque ligne porte son état : ✓ payé, ou hachure = à payer (la nouvelle).
**Boosters** : lignes-refont-total (ajuster). **Au port** : retirer \`moneyLocked\` ; lignes = \`items\` existants de la pièce (sinon une ligne) ;
un paiement par ligne n'existe pas : il couvre les premières lignes jusqu'à son montant (règle à écrire).`,
  },
};

for (const [id, v] of Object.entries(MO)) {
  const b = V['m2mo-a'](id);
  const ren = s => s.split(`${id}-lock`).join(`${id}-mt`);
  const champ = `<div class="${id}-f"><span>Montant <s class="${id}-mu ${id}-m" style="font-weight:500">42,00</s></span><span class="${id}-mt ${id}-ed"><span class="${id}-mu" style="font-size:13px">sans TVA</span><input type="text" inputmode="decimal" value="45,50" aria-label="Montant (CHF)"${v.total ? ' title="total des lignes"' : ''}></span></div>`;
  let corps = entre(b.corps, `<div class="${id}-f"><span>Montant</span>`, '</div></div>', champ + '</div>');
  corps = entre(corps, `<p class="${id}-why">`, '</p>', v.bloc(id));
  const css = ren(b.css) + `
.${id}-mt.${id}-ed{background:#fff;border:1px solid #2F6EA8;box-shadow:0 0 0 1px #2F6EA8}
.${id}-mt input{font:inherit;font-family:"IBM Plex Mono",monospace;font-weight:600;font-size:18px;text-align:right;border:0;outline:0;background:none;min-width:0;width:100%;color:#111}
.${id}-f>span s{font-size:12px;margin-left:4px}
.${id}-mt>.${id}-mu{white-space:nowrap;flex:none}` + v.css(id);
  rendre(id, v.titre, page(id, v.titre, css, ren(corps)), v.note);
}

/* ───────── m5pa : m2pa-a…d, chacune avec sa place pour le justificatif ───────── */
const PA = {
  'm5pa-a': {
    base: 'm2pa-a',
    css: (p) => `
.${p}-js{border:2px dashed #C9B98A;border-radius:14px;background:#FDFAF1;padding:6px;display:grid;grid-template-columns:1fr 1fr;gap:6px}
.${p}-js button{min-height:44px}`,
    greffe: (p, s) => avant(s, `<div class="${p}-ft">`, `<div class="${p}-lb"><span>Justificatif</span><span class="${p}-mu" style="font-weight:400">avis de débit, quittance</span></div>
 <div class="${p}-js" data-booster="justificatif"><button class="${p}-b2">${ic.cam(18, '#222')}Photo</button><button class="${p}-b2">${ic.fichier(18)}Fichier ou PDF</button></div>
 `),
    note: `# m5pa-a — Payer, tiède, avec justificatif
**Genre** : a, tiède. **Base** : m2pa-a telle quelle (montant, reste 150,00, Payé le, Avec, ✓ Payer 250,00).
**Ajout** : une rangée « Justificatif » (avis de débit, quittance) entre « Avec » et le bouton : cadre pointillé (= sans pièce),
« Photo » et « Fichier ou PDF ». Facultatif : payer sans justificatif reste possible ; la rangée de l'opération garde alors son pointillé.
**Au port** : le paiement n'a pas de pièce jointe dans le code (PaymentSheet) : champ neuf, rangé dans le même Drive que la pièce.`,
  },
  'm5pa-b': {
    base: 'm2pa-b',
    css: (p) => `
.${p}-chips .${p}-jt{border-style:dashed;border-color:#C9B98A;background:#FDFAF1;display:inline-flex;align-items:center;gap:5px;color:#6E500F}`,
    greffe: (p, s) => avant(s, `<button class="${p}-go" style="min-height:52px`, `<div class="${p}-ln"><label>Preuve</label><span class="${p}-chips" data-booster="justificatif"><button class="${p}-jt">${ic.cam(15, '#6E500F')}photo du justificatif</button><button class="${p}-jt">${ic.fichier(15, '#6E500F')}fichier</button></span></div>
 `),
    note: `# m5pa-b — Payer, froide, avec justificatif
**Genre** : b, froide. **Base** : m2pa-b telle quelle (« ✓ Tout payé » en un geste, le reste à un toucher).
**Ajout** : une ligne « Preuve » dans le volet ouvert, sous Montant / Le / Avec : deux pastilles pointillées « photo du justificatif » et « fichier ».
Le geste unique reste sans justificatif ; il se joint ensuite depuis la fiche.
**Au port** : pièce jointe du paiement, champ neuf (PaymentSheet n'en a pas).`,
  },
  'm5pa-c': {
    base: 'm2pa-c',
    css: (p) => `
.${p}-jf{display:flex;align-items:center;gap:10px;margin-top:10px;padding:6px 8px;border-radius:14px;border:1px solid #D5E8DA;background:#F2F8F3}
.${p}-th{width:36px;height:46px;border-radius:4px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.2);padding:5px 4px;display:flex;flex-direction:column;gap:3px;transform:rotate(-4deg);flex:none}
.${p}-th i{display:block;height:3px;border-radius:2px;background:#C9C9C9}
.${p}-th i.${p}-v{background:#9856D2;width:70%;margin-left:auto}
.${p}-jf .${p}-jt{flex:1;font-size:14px;line-height:18px}
.${p}-jf small{display:block;font-size:12px;color:#3D5A45}
.${p}-jf button{min-height:36px;padding:0 10px;border-radius:10px;border:1px solid #DADADA;background:#fff;font-size:13px}`,
    greffe: (p, s) => avant(s, `<div class="${p}-eff"`, `<div class="${p}-jf" data-booster="justificatif" data-etat="justificatif-joint"><span class="${p}-th" aria-hidden="true"><i></i><i style="width:60%"></i><i></i><i class="${p}-v"></i></span><span class="${p}-jt"><b>Justificatif</b> · avis de débit<small>✓ joint · 9 nov. · <span class="${p}-m">250,00</span></small></span><button>Changer</button></div>
 `),
    note: `# m5pa-c — Payer, chaude, avec justificatif
**Genre** : c, chaude. **Base** : m2pa-c telle quelle (barre à tirer, payé / reste, effet sur novembre).
**Ajout** : sous « Le · avec », la vignette du justificatif (avis de débit) déjà joint : « ✓ joint · 9 nov. · 250,00 », « Changer ».
Vide, la vignette est un cadre pointillé « + justificatif » (photo ou fichier). Le montant lu n'est pas comparé : affiché seulement.
**Au port** : pièce jointe du paiement, champ neuf ; la vignette reprend l'aperçu de pièce existant.`,
  },
  'm5pa-d': {
    base: 'm2pa-d',
    css: (p) => `
.${p}-jv{display:flex;align-items:center;gap:8px;min-height:52px;margin-top:10px;padding:0 6px 0 10px;border:2px dashed #C9B98A;border-radius:12px;background:#FDFAF1;font-size:14px;color:#6E500F}
.${p}-jv .${p}-jx{flex:1;line-height:17px}
.${p}-jv b{font-weight:600}
.${p}-jv small{display:block;color:#7A6A44;font-size:12px}
.${p}-jv button{min-height:36px;padding:0 10px;border-radius:10px;background:#fff;border:1px solid #DADADA;display:inline-flex;align-items:center;gap:4px;color:#222;font-size:13px}`,
    greffe: (p, s) => avant(s, `<div class="${p}-row2"`, `<div class="${p}-jv" data-booster="justificatif">${ic.doc(false, 16)}<span class="${p}-jx"><b>Justificatif du virement</b><small>sera joint aux 2 pièces</small></span><button>${ic.cam(15, '#222')}Photo</button><button aria-label="Fichier ou PDF">${ic.fichier(15)}</button></div>
 `),
    note: `# m5pa-d — Payer, libre, avec justificatif
**Genre** : d, libre. **Base** : m2pa-d telle quelle (un virement à l'Atelier solde le retard d'abord).
**Ajout** : sous les deux pièces, un seul justificatif du virement (photo ou fichier), joint aux deux pièces qu'il paie ;
cadre pointillé tant qu'il manque.
**Au port** : un justificatif partagé par deux paiements : une pièce jointe, deux liens (champ neuf).`,
  },
};
for (const [id, v] of Object.entries(PA)) {
  const b = V[v.base](id);
  rendre(id, b.titre + ', avec justificatif', page(id, b.titre, b.css + v.css(id), v.greffe(id, b.corps)), v.note);
}

/* ───────── m5ap-a : m1ap-c telle quelle, avec un justificatif ───────── */
{
  const c = ap.find(x => x.id === 'm1ap-c');
  const css = c.css + `
.~-js{display:flex;gap:6px}
.~-js button{flex:1;min-height:44px;border-radius:12px;border:2px dashed #C9B98A;background:#FDFAF1;color:#6E500F;font-size:14px;display:flex;align-items:center;justify-content:center;gap:6px}`;
  const corps = avant(c.corps(), '<button class="~-cta"', `<div class="~-f"><span>Justificatif · relevé ou quittance</span><div class="~-js" data-booster="justificatif"><button>${ic.cam(17, '#6E500F')}Photo</button><button>${ic.fichier(17, '#6E500F')}Fichier ou PDF</button></div></div>
  `);
  const t = 'Apport ou prélèvement, les deux poches, avec justificatif';
  rendre('m5ap-a', t, pageM1('m5ap-a', t, css, corps), `# m5ap-a — Apport, les deux poches, avec justificatif
**Genre** : m1ap-c (chaude, choisie) telle quelle : Ta poche → La brasserie, 500,00, effet sur le mois, Quand, compte, Motif.
**Ajout** : sous le motif, « Justificatif · relevé ou quittance » : « Photo » et « Fichier ou PDF », cadre pointillé tant qu'il manque.
En prélèvement, même place (quittance du retrait).
**Au port** : MovementSheet n'a pas de pièce jointe : champ neuf, rangé dans le Drive du mois.`);
}

/* ───────── m5fo-a : m2fo-a telle quelle, la facture en barre de m2fo-c sous « Dans la facture » ───────── */
{
  const id = 'm5fo-a', b = V['m2fo-a'](id), tot = LIGNES.reduce((s, l) => s + l.c, 0);
  let x = 0;
  const seg = LIGNES.map(l => { const w = l.c / tot * 100; const s = `<button class="${id}-fseg" style="left:${x.toFixed(2)}%;width:${w.toFixed(2)}%;background:${l.col}" aria-label="${l.n} ${l.a}, voir la ligne"></button>`; x += w; return s; }).join('');
  const css = b.css + `
.${id}-fbar{position:relative;height:30px;border-radius:10px;overflow:hidden;background:#eee;margin:6px 0 4px}
.${id}-fseg{position:absolute;top:0;bottom:0;border-right:2px solid #fff}`;
  const corps = apres(b.corps, '<small>4 lignes · au stock</small></h3>', `\n <div class="${id}-fbar" data-booster="barre-lignes">${seg}</div>`);
  rendre(id, 'Fiche, tiède, avec la facture en barre', page(id, 'Fiche rangée, facture en barre', css, corps), `# m5fo-a — Fiche rangée, avec la facture en barre
**Base** : m2fo-a (tiède, choisie) telle quelle : en-tête, 186,80 payé, facture jointe, 4 lignes au stock, Recette, Modifier, Avoir, échéance, paiements.
**Greffe** : la barre de m2fo-c (chaude, choisie), sous « Dans la facture » : un segment par ligne, à sa part du total
(malt 72,50 + 38,40, houblon 48,90 + 27,00 = 186,80). Les rangées dessous, à la même couleur, en sont la légende ;
la légende à deux colonnes de m2fo-c n'est pas reprise (doublon). Toucher un segment = toucher sa rangée.
**Boosters** : barre-lignes (lire, comparer). **Au port** : barre depuis les \`items\` de la pièce ; aucune ligne : pas de barre.`);
}

/* ───────── Écriture et captures (390, échelle 2, clair, page entière) ───────── */
const seul = process.argv[2]?.split(',');
const { browser, page: pg, journal } = await ouvrir({ largeur: 390, hauteur: 844, echelle: 2 });
for (const s of sorties.filter(s => !seul || seul.includes(s.id))) {
  const dir = join(VOIE, s.id); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'etat.html'), s.html);
  writeFileSync(join(dir, 'NOTE.md'), s.note.trim() + '\n');
  await pg.goto(pathToFileURL(join(dir, 'etat.html')).href, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  const h = await pg.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
  await pg.screenshot({ path: join(dir, `${s.id}.png`), fullPage: true });
  console.log(`${s.id} ${h}px`);
}
console.log('bloquees', journal.bloquees.length, 'erreurs', journal.erreurs.join(' | ') || 0);
await browser.close();
