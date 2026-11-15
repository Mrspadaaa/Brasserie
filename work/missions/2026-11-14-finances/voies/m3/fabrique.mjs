// fabrique.mjs — voie m3 (14.11) : écrit les 12 mini maquettes statiques (etat.html, NOTE.md) puis les capture à 390 px, échelle 2.
// Usage : node work/missions/2026-11-14-finances/voies/m3/fabrique.mjs [ids,…]   (sans argument : les 12)
// Classes préfixées par l'id (L26) : le gabarit écrit « X- », remplacé par split/join, jamais par une expression de remplacement.
import { mkdirSync, writeFileSync } from 'node:fs';
import { ouvrir } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
const DIR = new URL('./', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');

// ---------- outils ----------
const chf = (v, signe = false) => { const n = Math.abs(v), [e, c] = n.toFixed(2).split('.'); const s = e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + c; return (v < 0 ? '−' : signe && v > 0 ? '+' : '') + s; };
const I = {
  x: '<svg class="X-i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  ch: '<svg class="X-i" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  bas: '<svg class="X-i" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  cal: '<svg class="X-i" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
  ok: '<svg class="X-i" viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
  plus: '<svg class="X-i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  rep: '<svg class="X-i" viewBox="0 0 24 24"><path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/></svg>',
  fleche: '<svg class="X-i" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  arch: '<svg class="X-i" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10h14V9M10 13h4"/></svg>',
  cle: '<svg class="X-i" viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/></svg>',
  vente: '<svg class="X-i" viewBox="0 0 24 24"><path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
};

const BASE = `:root{--page:#FFFFFF;--panel:#F5F5F5;--bord:#DDDDDD;--bordm:#BFBFBF;--t2:#666666;--t1:#333333;--t0:#111111;
--fin:#1F64A3;--finc:#86B9E6;--fint:#E6EFF8;--alerte:#C8382F;--alertet:#A8291F;--alertef:#FBE9E7;--vert:#2A7347;--vertf:#E4F1E8;
--brassin:#9A4F1E;--brassint:#FBEDE3;--frigo:#176878;--frigot:#E2F2F5;
--sans:"Source Sans 3","Segoe UI",system-ui,sans-serif;--mono:"IBM Plex Mono",Consolas,ui-monospace,monospace}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#fff;font-family:var(--sans);font-size:14px;line-height:1.3;color:var(--t1);-webkit-font-smoothing:antialiased}
button,input{font:inherit;color:inherit}
.X-f{position:relative;width:390px;min-height:844px;background:#4a4a4a;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end}
.X-f::before{content:"";flex:0 0 52px}
.X-bg{position:absolute;top:0;left:0;width:390px;height:844px;display:block}
.X-voile{position:absolute;inset:0;background:rgba(17,17,17,.48)}
.X-sh{margin-top:0!important;min-height:0!important;position:relative;background:var(--page);border-radius:16px 16px 0 0;box-shadow:0 -10px 30px -14px rgba(0,0,0,.55);display:flex;flex-direction:column}
.X-poi{width:36px;height:4px;border-radius:2px;background:var(--bordm);margin:6px auto 0}
.X-m{font-family:var(--mono);font-variant-numeric:tabular-nums}
svg.X-i{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
.X-x{width:32px;height:32px;border:0;background:none;color:var(--t2);display:flex;align-items:center;justify-content:center;border-radius:10px;flex-shrink:0}
.X-pied{display:flex;gap:8px;padding:8px 10px 12px;border-top:1px solid var(--bord);background:var(--page)}
.X-btn{height:44px;border-radius:10px;font-weight:600;font-size:15px;border:1px solid var(--bordm);background:var(--page);color:var(--t0);padding:0 16px;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.X-btn.X-pri{flex:1;background:var(--t0);border-color:var(--t0);color:#fff}
.X-lab{font-size:12px;color:var(--t2);display:block;margin-bottom:3px}
.X-in{display:flex;align-items:center;gap:6px;width:100%;height:36px;border:1px solid var(--bordm);border-radius:10px;padding:0 10px;font-size:16px;color:var(--t0);background:var(--page)}
.X-in::placeholder{color:#8a8a8a}
.X-muet{font-size:12px;color:var(--t2)}`;

const page = (id, titre, css, corps) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${id} — ${titre}</title>
<style>
${(BASE + '\n' + css).split('X-').join(id + '-')}
</style></head><body>
${corps.split('X-').join(id + '-')}
</body></html>`;
const fond = (ref) => `<img class="X-bg" src="../../../ref/${ref}" alt=""><div class="X-voile"></div>`;
const P5B = 'p5b/p5b-haut.png', G6 = 'g6/g6-4-materiel.png';

// ---------- escalier des 90 jours (p5b) : 14.11 → 31.01 ----------
const DEPART = 4181.60, JOURS = 78;
const SORTIES = [[0, -60], [1, -3000], [6, -57.42], [11, -400], [34, -6.84], [41, -400], [72, -400], [77, -750]];
function marches(ev, W, H, ymin, ymax, x0 = 0) {
  const X = d => x0 + (d / JOURS) * (W - x0), Y = v => ((ymax - v) / (ymax - ymin)) * H;
  const tri = [...ev].sort((a, b) => a[0] - b[0]); let v = DEPART, d = `M${X(0).toFixed(1)},${Y(v).toFixed(1)}`;
  for (const [j, m] of tri) { d += ` H${X(j).toFixed(1)}`; v += m; d += ` V${Y(v).toFixed(1)}`; }
  return { d: d + ` H${X(JOURS).toFixed(1)}`, fin: v, X, Y };
}

// ---------- les 12 variantes ----------
const V = {};

/* ===== m3pr-a : tiède — le contenu actuel, rangé dans le langage de v6a ===== */
V['m3pr-a'] = {
  titre: 'Ajouter une prévision : le contenu actuel, rangé (tiède)',
  css: `.X-sh{margin-top:84px;min-height:760px}
.X-tete{display:flex;align-items:center;gap:6px;padding:4px 6px 4px 12px}
.X-tete h2{flex:1;font-size:17px;font-weight:600;color:var(--t0)}
.X-corps{padding:2px 12px 10px;display:flex;flex-direction:column;gap:10px}
.X-seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;border:1px solid var(--bordm);border-radius:10px;overflow:hidden;height:32px}
.X-seg button{border:0;background:var(--page);font-size:13px;color:var(--t2);border-right:1px solid var(--bordm)}
.X-seg button:last-child{border-right:0}
.X-seg button[aria-pressed=true]{background:var(--t0);color:#fff;font-weight:600}
.X-sens{height:36px}.X-sens button{font-size:14px}
.X-sens button[aria-pressed=true]{background:var(--t0);color:#fff;font-weight:600}
.X-g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.X-puces{display:flex;flex-wrap:wrap;gap:4px}
.X-puces button{height:28px;padding:0 9px;border:1px solid var(--bordm);border-radius:10px;background:var(--page);font-size:13px;color:var(--t1)}
.X-puces button[aria-pressed=true]{background:var(--t0);border-color:var(--t0);color:#fff;font-weight:600}
.X-puces button.X-hors{color:#9a9a9a;background:var(--panel);border-color:var(--bord)}
.X-suite{display:flex;align-items:center;gap:8px;margin-top:6px;font-size:13px;color:var(--t2)}
.X-suite .X-in{height:32px;font-size:14px;width:auto;flex:1;color:var(--t2)}
.X-radios{display:flex;flex-direction:column;border:1px solid var(--bord);border-radius:10px;overflow:hidden}
.X-radios label{display:flex;align-items:center;gap:8px;min-height:34px;padding:0 10px;font-size:13px;color:var(--t1);border-bottom:1px solid var(--bord)}
.X-radios label:last-child{border-bottom:0}
.X-radios i{width:16px;height:16px;border-radius:50%;border:1.5px solid var(--bordm);flex-shrink:0}
.X-radios label.X-on{background:var(--panel);font-weight:600;color:var(--t0)}
.X-radios label.X-on i{border:5px solid var(--t0)}
.X-radios small{color:var(--t2);font-weight:400}
.X-pli{display:flex;align-items:center;justify-content:space-between;height:36px;border:1px solid var(--bord);border-radius:10px;padding:0 10px;font-size:14px;color:var(--t1)}
.X-pli span{color:var(--t2);font-size:12px;margin-left:auto;margin-right:4px}`,
  corps: `<div class="X-f">${fond(P5B)}<div class="X-sh">
<div class="X-poi"></div>
<header class="X-tete"><h2>Prévoir une dépense</h2><button class="X-x" aria-label="Fermer">${I.x}</button></header>
<div class="X-corps">
 <div class="X-seg X-sens" role="group" aria-label="Mouvement" data-booster="sens"><button aria-pressed="true">À payer</button><button aria-pressed="false">À recevoir</button></div>
 <label><span class="X-lab">Libellé</span><input class="X-in" value="Électricité" placeholder="Loyer, commande de malt, vente prévue…"></label>
 <div class="X-g2">
  <label><span class="X-lab">Montant CHF</span><input class="X-in X-m" inputmode="decimal" value="68,00"></label>
  <label><span class="X-lab">Paiement prévu le</span><span class="X-in">${I.cal}<span class="X-m">09.12.2026</span></span></label>
 </div>
 <div><span class="X-lab">Catégorie</span><div class="X-puces" data-booster="categorie">
  <button aria-pressed="false">Brassage</button><button aria-pressed="false">Matériel</button><button aria-pressed="false">Nettoyage</button><button aria-pressed="true">Charges fixes</button><button aria-pressed="false">Local et travaux</button><button aria-pressed="false">Autres frais</button><button class="X-hors" aria-pressed="false">Ventes</button><button class="X-hors" aria-pressed="false">Apports privés</button></div></div>
 <div><span class="X-lab">Répétition</span>
  <div class="X-seg" role="group" aria-label="Répétition" data-booster="repetition"><button aria-pressed="false">Une fois</button><button aria-pressed="true">Chaque mois</button><button aria-pressed="false">Trimestre</button><button aria-pressed="false">Année</button></div>
  <div class="X-suite">${I.rep}<span>jusqu'au</span><span class="X-in">sans fin</span></div></div>
 <div><span class="X-lab">Dans le coût des brassins</span><div class="X-radios" data-booster="cout-brassin">
  <label class="X-on"><i></i>À confirmer dans le budget du brassin</label>
  <label><i></i>Charge fixe à répartir <small>loyer, assurance…</small></label>
  <label><i></i>Déjà estimée par brassin <small>eau, énergie…</small></label></div></div>
 <div class="X-g2"><label><span class="X-lab">Fournisseur ou client</span><input class="X-in" placeholder="facultatif"></label>
  <div><span class="X-lab">Note</span><div class="X-pli">Ajouter${I.ch}</div></div></div>
 <p class="X-muet">Rien n'est compté avant la facture, qui s'y reliera.</p>
</div>
<footer class="X-pied"><button class="X-btn">Annuler</button><button class="X-btn X-pri">Enregistrer</button></footer>
</div></div>`,
  note: `# m3pr-a — Ajouter une prévision, rangée (tiède)
- Genre a, tiède : le contenu de \`PlanSheet\` tel quel, en langage v6a (p5b derrière). Exemple : l'électricité de v6a (68,00, payée le 9 nov.), prévue chaque mois.
- Change : « Mouvement » devient une bascule À payer / À recevoir en tête ; Catégorie en 8 puces (Ventes, Apports grisées en « à payer ») ; Répétition en segment de 4 ; « Coût de revient » en 3 lignes radio ; Note repliée.
- Gardé : libellé, montant (texte, \`inputmode=decimal\`), date, fin de répétition (vide = sans fin), fournisseur, la phrase « aucune écriture » dite en mots de brasseur.
- Boosters : sens (bascule), categorie (puces), repetition (segment), cout-brassin (radios).
- Au port : « État » (brouillon, à venir, terminée, annulée) n'existe qu'en modification : à placer sous la note ; jamais \`type="number"\`.
- passe 2 : défauts corrigés — « À payer » en noir (rouge = en retard) ; Ventes / Apports grisés en trait plein (pointillé = sans pièce) ; phrase de pied en une ligne.`,
};

/* ===== m3pr-b : froide — trois champs au-dessus du clavier ===== */
V['m3pr-b'] = {
  titre: 'Ajouter une prévision : trois champs au-dessus du clavier (froide)',
  css: `.X-sh{position:absolute;left:0;right:0;bottom:222px}
.X-hd{display:flex;align-items:center;padding:2px 6px 0 12px;font-size:13px;color:var(--t2);font-weight:600}
.X-hd span{flex:1}
.X-nom{border:0;outline:0;font-size:22px;font-weight:600;color:var(--t0);padding:0 12px;width:100%;height:34px;background:none}
.X-ligne{display:flex;align-items:baseline;gap:10px;padding:2px 12px 0}
.X-mt{display:flex;align-items:baseline;gap:6px;flex:1;border-bottom:2px solid var(--t0);padding-bottom:2px}
.X-mt input{border:0;outline:0;font-family:var(--mono);font-size:34px;font-weight:600;color:var(--t0);width:100%;background:none;font-variant-numeric:tabular-nums}
.X-mt small{font-size:13px;color:var(--t2)}
.X-curseur{display:inline-block;width:2px;height:30px;background:var(--fin);vertical-align:-4px;margin-left:-6px}
.X-date{display:inline-flex;align-items:center;gap:5px;height:32px;padding:0 10px;border:1px solid var(--bordm);border-radius:10px;font-size:14px;color:var(--t0);white-space:nowrap}
.X-regl{display:flex;gap:6px;padding:10px 12px 8px;flex-wrap:wrap}
.X-regl button{display:inline-flex;align-items:center;gap:3px;height:28px;padding:0 6px 0 10px;border:1px solid var(--bord);background:var(--panel);border-radius:10px;font-size:13px;color:var(--t1)}
.X-regl button svg{width:14px;height:14px;color:var(--t2)}
.X-regl b{font-weight:600}
.X-plus{display:flex;align-items:center;gap:6px;margin:0 12px 8px;height:32px;font-size:13px;color:var(--fin);font-weight:600}
.X-plus span{color:var(--t2);font-weight:400;flex:1}
.X-pied{border-top:0;padding-top:4px}
.X-clav{position:absolute;left:0;right:0;bottom:0;height:222px;background:#D2D5DB;padding:6px 5px 8px;display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:46px;gap:6px}
.X-clav span{background:#fff;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:22px;color:#000;box-shadow:0 1px 0 #898A8D}
.X-clav span small{font-size:9px;letter-spacing:1.5px;color:#333}
.X-clav span.X-k{background:#ADB3BC}`,
  corps: `<div class="X-f">${fond(P5B)}<div class="X-sh">
<div class="X-poi"></div>
<div class="X-hd"><span>Prévoir une dépense</span><button class="X-x" aria-label="Fermer">${I.x}</button></div>
<input class="X-nom" value="Électricité" aria-label="Libellé">
<div class="X-ligne">
 <label class="X-mt"><input inputmode="decimal" value="68,00" aria-label="Montant"><small>CHF</small></label>
 <span class="X-date" data-booster="date">${I.cal}<span>9 déc.</span></span>
</div>
<div class="X-regl" data-booster="reglages">
 <button><b>À payer</b>${I.bas}</button><button>Charges fixes${I.bas}</button><button>${'chaque mois'}${I.bas}</button>
</div>
<div class="X-plus">${I.plus}Fournisseur, note, coût des brassins<span>à confirmer</span></div>
<footer class="X-pied"><button class="X-btn X-pri">Enregistrer</button></footer>
</div>
<div class="X-clav" aria-hidden="true">
 <span>1</span><span>2<small>ABC</small></span><span>3<small>DEF</small></span>
 <span>4<small>GHI</small></span><span>5<small>JKL</small></span><span>6<small>MNO</small></span>
 <span>7<small>PQRS</small></span><span>8<small>TUV</small></span><span>9<small>WXYZ</small></span>
 <span class="X-k">,</span><span>0</span><span class="X-k">⌫</span>
</div></div>`,
  note: `# m3pr-b — Ajouter une prévision : trois champs au-dessus du clavier (froide)
- Genre b, froide : au premier plan, le nom, le montant (gros, mono) et la date ; le clavier décimal ouvert, Enregistrer juste au-dessus (p5b visible derrière).
- Change : Mouvement, Catégorie et Répétition deviennent trois pastilles à valeur (« À payer ⌄ », « Charges fixes ⌄ », « chaque mois ⌄ ») qui gardent les défauts ; fournisseur, note, coût des brassins et fin de répétition à un toucher (« à confirmer » dit, jamais un zéro).
- Gardé : tout le contenu de \`PlanSheet\`, aucun champ retiré ; le montant reste un texte \`inputmode=decimal\`.
- Boosters : date (pastille calendrier), reglages (trois pastilles).
- Au port : la phrase « aucune écriture… relie la facture » passe dans le pli ; « État » en modification seulement ; \`useKeyboardInset\` pour tenir Enregistrer au-dessus du clavier.`,
};

/* ===== m3pr-c : chaude — l'effet sur la fin janvier, en marches ===== */
{
  const W = 346, H = 150, HT = 168, ymin = -1300, ymax = 4400, X0 = 40;
  const avant = marches(SORTIES, W, H, ymin, ymax, X0);
  const apres = marches([...SORTIES, [25, -68], [56, -68]], W, H, ymin, ymax, X0);
  const echelle = [4000, 2000, 0, -1000].map(v => `<line class="X-gr" x1="${X0}" x2="${W}" y1="${apres.Y(v).toFixed(1)}" y2="${apres.Y(v).toFixed(1)}"/><text class="X-ech" x="${X0 - 4}" y="${(apres.Y(v) + 4).toFixed(1)}" text-anchor="end">${chf(v).replace(/,00$/, '')}</text>`).join('');
  const z = avant.Y(0).toFixed(1);
  const frise = (() => { // 14.11 → 31.03 : 137 jours ; l'horizon des prévisions s'arrête au 31.01 (78 j)
    const T = 137, X = d => 6 + d / T * 334; const mois = [['nov.', 0], ['déc.', 17], ['janv.', 48], ['févr.', 79], ['mars', 107]];
    let s = `<rect x="${X(78)}" y="0" width="${340 - X(78)}" height="56" rx="6" fill="#E4E4E4"/><text x="${X(78) + 4}" y="12" class="X-hz">après les 90 jours</text>`;
    s += `<line x1="6" y1="34" x2="340" y2="34" class="X-ax"/>`;
    for (const [m, d] of mois) s += `<line x1="${X(d)}" y1="30" x2="${X(d)}" y2="38" class="X-ax"/><text x="${X(d) + 3}" y="52" class="X-mo">${m}</text>`;
    for (const [d, dans] of [[25, 1], [56, 1], [87, 0], [115, 0]]) s += `<circle cx="${X(d)}" cy="34" r="${dans ? 6 : 5}" class="${dans ? 'X-oc' : 'X-oc X-oh'}"/>` + (dans ? `<text x="${X(d)}" y="22" text-anchor="middle" class="X-ol">9.${d === 25 ? '12' : '01'}</text>` : '');
    s += `<line x1="${X(0)}" y1="26" x2="${X(0)}" y2="42" class="X-auj"/>`;
    return s;
  })();
  V['m3pr-c'] = {
    titre: 'Ajouter une prévision : l\'effet sur la fin janvier, en marches (chaude)',
    css: `.X-sh{margin-top:70px;min-height:774px}
.X-tete{display:flex;align-items:center;padding:2px 6px 0 12px}
.X-tete h2{flex:1;font-size:17px;font-weight:600;color:var(--t0)}
.X-c{padding:4px 12px 10px;display:flex;flex-direction:column;gap:8px}
.X-r{display:grid;grid-template-columns:1fr 112px;gap:8px}
.X-pills{display:flex;gap:4px;flex-wrap:wrap}
.X-pills button{display:inline-flex;align-items:center;gap:2px;height:28px;padding:0 5px 0 9px;border:1px solid var(--bordm);border-radius:10px;background:var(--page);font-size:13px}
.X-pills button svg{width:14px;height:14px;color:var(--t2)}
.X-pills .X-pay{border-color:var(--t0);color:var(--t0);font-weight:600}
.X-pan{background:var(--panel);border-radius:16px;padding:8px;display:flex;flex-direction:column;gap:6px}
.X-seg{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--bordm);border-radius:10px;overflow:hidden;height:30px;background:var(--page)}
.X-seg button{border:0;border-right:1px solid var(--bordm);background:none;font-size:13px;color:var(--t2)}
.X-seg button:last-child{border-right:0}.X-seg button[aria-pressed=true]{background:var(--t0);color:#fff;font-weight:600}
.X-pan svg.X-g{display:block;width:100%;overflow:visible}
.X-ax{stroke:var(--bordm);stroke-width:1}.X-mo{font-size:12px;fill:var(--t2);font-weight:600}
.X-hz{font-size:12px;fill:var(--t2)}
.X-oc{fill:var(--t0);stroke:#fff;stroke-width:2}.X-oc.X-oh{fill:#fff;stroke:#9a9a9a;stroke-width:1.5}
.X-ol{font-family:var(--mono);font-size:12px;font-weight:600;fill:var(--t0)}
.X-gr{stroke:#E2E2E2;stroke-width:1}.X-ech{font-family:var(--mono);font-size:12px;fill:var(--t2)}
.X-auj{stroke:var(--t0);stroke-width:2}
.X-fin{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--t2);height:22px}
.X-fin .X-fl{width:30px;height:2px;background:var(--t0)}
.X-avant{fill:none;stroke:#B0B0B0;stroke-width:1.6}
.X-apres{fill:none;stroke:var(--t0);stroke-width:2.4;stroke-linejoin:round}
.X-sous{fill:var(--t1);opacity:.14}.X-aire{fill:var(--frigo);opacity:.14}
.X-zero{stroke:var(--t1);stroke-width:1}
.X-pt{font-family:var(--mono);font-size:12px;font-weight:700;fill:var(--t0);paint-order:stroke;stroke:var(--panel);stroke-width:3px}
.X-eff{display:flex;align-items:baseline;gap:8px;padding:6px 4px 0;border-top:1px solid var(--bord)}
.X-eff span{font-size:13px;color:var(--t1);font-weight:600}
.X-eff s{font-family:var(--mono);color:var(--t2);font-size:14px}
.X-eff b{font-family:var(--mono);font-size:20px;color:var(--t0);margin-left:auto}
.X-eff small{display:block;font-size:12px;color:var(--t2);font-weight:400}
.X-row{display:flex;align-items:center;gap:6px;height:36px;border-bottom:1px solid var(--bord);font-size:14px}
.X-row span{flex:1}.X-row em{font-style:normal;color:var(--t2);font-size:13px}`,
    corps: `<div class="X-f">${fond(P5B)}<div class="X-sh">
<div class="X-poi"></div>
<header class="X-tete"><h2>Prévoir une dépense</h2><button class="X-x" aria-label="Fermer">${I.x}</button></header>
<div class="X-c">
 <div class="X-r"><label><span class="X-lab">Libellé</span><input class="X-in" value="Électricité"></label><label><span class="X-lab">CHF</span><input class="X-in X-m" inputmode="decimal" value="68,00"></label></div>
 <div class="X-pills"><button class="X-pay">À payer${I.bas}</button><button>Charges fixes${I.bas}</button><button>${I.cal}&nbsp;9 déc.${I.bas}</button></div>
 <div class="X-pan">
  <div class="X-seg" role="group" aria-label="Répétition" data-booster="repetition"><button aria-pressed="false">Une fois</button><button aria-pressed="true">Chaque mois</button><button aria-pressed="false">Trimestre</button><button aria-pressed="false">Année</button></div>
  <svg class="X-g" viewBox="0 0 346 56" height="56" data-booster="frise-repetition">${frise}</svg>
  <svg class="X-g" viewBox="0 0 ${W} ${HT}" height="${HT}" data-booster="marches-fin-janvier">
   ${echelle}
   <defs><clipPath id="X-cH"><rect x="0" y="0" width="${W}" height="${z}"/></clipPath><clipPath id="X-cB"><rect x="0" y="${z}" width="${W}" height="${H}"/></clipPath></defs><path class="X-aire" clip-path="url(#X-cH)" d="${apres.d} V${z} H${X0} Z"/><path class="X-sous" clip-path="url(#X-cB)" d="${apres.d} V${z} H${X0} Z"/>
   <line class="X-zero" x1="${X0}" x2="${W}" y1="${z}" y2="${z}"/>
   <path class="X-avant" d="${avant.d}"/><path class="X-apres" d="${apres.d}"/>
   <text class="X-pt" x="${apres.X(25) + 3}" y="${(apres.Y(664.18) - 6).toFixed(0)}">−68</text>
   <text class="X-pt" x="${apres.X(56) + 3}" y="${(apres.Y(257.34) - 6).toFixed(0)}">−68</text>
   <text class="X-mo" x="${X0}" y="${HT - 2}">aujourd'hui</text><text class="X-mo" x="${W}" y="${HT - 2}" text-anchor="end">31 janv.</text>
  </svg>
  <div class="X-fin"><i class="X-fl"></i>avec l'électricité<i class="X-fl" style="background:#B0B0B0;height:1.6px"></i>sans</div>
  <div class="X-eff"><span>Fin janvier<small>2 × 68,00 dans les 90 jours</small></span><s>${chf(-892.66)}</s><b>${chf(apres.fin)}</b></div>
 </div>
 <div class="X-row" data-booster="cout-brassin"><span>Compte dans mon litre ?</span><em>à décider</em>${I.bas}</div>
 <div class="X-row"><span>Fournisseur, note, fin de la répétition</span>${I.ch}</div>
</div>
<footer class="X-pied" style="margin-top:auto"><button class="X-btn">Annuler</button><button class="X-btn X-pri">Enregistrer</button></footer>
</div></div>`,
    note: `# m3pr-c — Ajouter une prévision : l'effet sur la fin janvier (chaude)
- Genre c, chaude : la répétition se lit sur une frise (9.12 et 9.01 dans les 90 jours, 9.02 et 9.03 au-delà, ronds vides) et son effet sur les marches de p5b, avec leur échelle (4 000 à −1 000) : fin janvier ${chf(-892.66)} → ${chf(apres.fin)} (2 × 68,00), calculé sur les sorties de p5b.
- Change : le formulaire tient en une ligne de champs et trois pastilles (À payer, Charges fixes, 9 déc.) ; la décision se prend sur le panneau gris.
- Gardé : libellé, montant (texte décimal), date, mouvement, catégorie, répétition, coût des brassins (« à confirmer »), fournisseur, note, fin de répétition (repliés).
- Boosters : repetition (segment), frise-repetition, marches-fin-janvier (avant en gris clair, après en trait noir), cout-brassin (« Compte dans mon litre ? »).
- Au port : l'escalier vient de \`previsions/escalier.ts\` ; la phrase « aucune écriture » passe dans le pli ; « État » en modification seulement.
- passe 2 : défauts corrigés — les « −68 » posés au-dessus des marches ; « 31 janv. » sous l'escalier ; échelle à gauche ; rouge retiré (À payer, dates, fin janvier) ; pointillés retirés (« sans », mois après 90 jours).`,
  };
}

/* ===== m3pr-d : libre — prévoir à partir d'un paiement déjà fait ===== */
V['m3pr-d'] = {
  titre: 'Ajouter une prévision : recopier un paiement déjà fait (libre)',
  css: `.X-sh{margin-top:64px;min-height:780px}
.X-t{padding:4px 6px 2px 12px;display:flex;align-items:flex-start}
.X-t div{flex:1}.X-t h2{font-size:17px;font-weight:600;color:var(--t0)}.X-t p{font-size:12px;color:var(--t2)}
.X-cat{font-size:12px;font-weight:600;color:var(--t2);padding:8px 12px 2px;display:flex;justify-content:space-between}
.X-op{display:grid;grid-template-columns:1fr auto;column-gap:8px;padding:3px 12px 4px;border-bottom:1px solid var(--bord);min-height:44px;align-items:center}
.X-op b{font-weight:600;color:var(--t0);font-size:14px;line-height:16px}
.X-op b em{font-style:normal;font-weight:400;color:var(--t2)}
.X-op .X-mt{font-family:var(--mono);font-variant-numeric:tabular-nums;font-weight:600;color:var(--t0);text-align:right}
.X-op .X-mt.X-in2{color:var(--vert)}
.X-et{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--t2);height:18px}
.X-pa{height:16px;padding:0 6px;border-radius:10px;background:var(--vertf);color:var(--vert);font-weight:600;display:inline-flex;align-items:center}
.X-rep{grid-row:span 2;align-self:center;display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 8px;border:1px solid var(--bordm);border-radius:10px;font-size:13px;color:var(--t1);background:var(--page)}
.X-rep svg{width:15px;height:15px}
.X-deja{color:var(--t2);font-size:12px;display:inline-flex;align-items:center;gap:3px}
.X-deja svg{width:14px;height:14px;color:var(--vert)}
.X-op.X-sel{background:var(--fint);border-bottom:0}
.X-op.X-sel .X-rep{background:var(--fin);border-color:var(--fin);color:#fff;font-weight:600}
.X-tk{margin:0 8px 6px;background:var(--page);border:2px solid var(--fin);border-radius:16px;padding:8px;display:flex;flex-direction:column;gap:8px;position:relative}
.X-tk::before{content:"";position:absolute;top:-9px;left:24px;width:14px;height:14px;background:var(--page);border-left:2px solid var(--fin);border-top:2px solid var(--fin);transform:rotate(45deg)}
.X-tkh{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--fin);font-weight:600}
.X-g3{display:grid;grid-template-columns:96px 1fr;gap:6px}
.X-in{height:32px;font-size:15px}
.X-seg{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--bordm);border-radius:10px;overflow:hidden;height:30px}
.X-seg button{border:0;border-right:1px solid var(--bordm);background:var(--page);font-size:13px;color:var(--t2)}
.X-seg button:last-child{border-right:0}.X-seg button[aria-pressed=true]{background:var(--t0);color:#fff;font-weight:600}
.X-dates{display:flex;gap:4px;align-items:center;font-size:12px;color:var(--t2)}
.X-dates span{font-family:var(--mono);font-size:12px;height:22px;padding:0 6px;border-radius:10px;display:inline-flex;align-items:center;border:1px solid var(--finc);color:var(--fin)}
.X-dates span.X-1{background:var(--fin);color:#fff;border-style:solid;font-weight:600}
.X-pc{display:flex;gap:4px;flex-wrap:wrap}
.X-pc span{display:inline-flex;align-items:center;gap:2px;height:26px;padding:0 4px 0 8px;border:1px solid var(--bord);border-radius:10px;font-size:12px;background:var(--panel);color:var(--t1)}
.X-pc svg{width:13px;height:13px;color:var(--t2)}
.X-vierge{display:flex;align-items:center;gap:6px;height:40px;padding:0 12px;color:var(--fin);font-weight:600;font-size:14px}
.X-op.X-pris{opacity:.62}`,
  corps: `<div class="X-f">${fond(P5B)}<div class="X-sh">
<div class="X-poi"></div>
<div class="X-t"><div><h2>Prévoir à nouveau</h2></div><button class="X-x" aria-label="Fermer">${I.x}</button></div>
<div class="X-cat"><span>Payé en novembre</span><span>‹ novembre ›</span></div>
<div class="X-op X-sel" data-booster="recopier"><b>Électricité <em>· Énergie</em></b><span class="X-mt">68,00</span><span class="X-et"><span class="X-pa">✓ payé 9 nov.</span>Charges fixes</span><span class="X-rep" style="grid-row:auto;justify-self:end">${I.rep}Prévoir</span></div>
<div class="X-tk">
 <div class="X-tkh">${I.rep}Électricité, à payer</div>
 <div class="X-g3"><input class="X-in X-m" inputmode="decimal" value="68,00" aria-label="Montant CHF"><div class="X-seg" role="group" aria-label="Répétition" data-booster="repetition"><button aria-pressed="false">1 fois</button><button aria-pressed="true">Mois</button><button aria-pressed="false">Trim.</button><button aria-pressed="false">Année</button></div></div>
 <div class="X-dates" data-booster="prochaines">le 9 : <span class="X-1">9.12</span><span>9.01</span><span>9.02</span>… sans fin</div>
 <div class="X-pc"><span>Charges fixes${I.bas}</span><span>compte dans mon litre ?${I.bas}</span><span>note${I.plus}</span></div>
</div>
<div class="X-op"><b>Malt et houblons <em>· Pale Ale · Comptoir du brasseur</em></b><span class="X-mt">186,80</span><span class="X-et"><span class="X-pa">✓ payé 9 nov.</span>Brassage</span><span class="X-rep" style="grid-row:auto;justify-self:end">${I.rep}Prévoir</span></div>
<div class="X-op"><b>Nettoyant alcalin <em>· Comptoir du brasseur</em></b><span class="X-mt">42,00</span><span class="X-et"><span class="X-pa">✓ payé 9 nov.</span>Nettoyage</span><span class="X-rep" style="grid-row:auto;justify-self:end">${I.rep}Prévoir</span></div>
<div class="X-op"><b>Joints de la cuve <em>· Inox &amp; Co</em></b><span class="X-mt">28,60</span><span class="X-et"><span class="X-pa">✓ payé 9 nov.</span>Matériel</span><span class="X-rep" style="grid-row:auto;justify-self:end">${I.rep}Prévoir</span></div>
<div class="X-op"><b>Vente au marché <em>· Marché du village</em></b><span class="X-mt X-in2">+720,00</span><span class="X-et"><span class="X-pa">✓ encaissé 9 nov.</span>Ventes</span><span class="X-rep" style="grid-row:auto;justify-self:end">${I.rep}Prévoir</span></div>
<div class="X-op X-pris"><b>Loyer de l'atelier <em>· Atelier</em></b><span class="X-mt">400,00</span><span class="X-et">à payer · 25 nov.</span><span class="X-deja" style="justify-self:end">${I.ok}déjà prévu, chaque mois</span></div>
<div class="X-vierge">${I.plus}Une prévision vierge</div>
<footer class="X-pied" style="margin-top:auto"><button class="X-btn">Annuler</button><button class="X-btn X-pri">Prévoir l'électricité</button></footer>
</div></div>`,
  note: `# m3pr-d — Ajouter une prévision : recopier un paiement déjà fait (libre)
- Genre d, libre : une prévision naît le plus souvent d'un paiement qui revient. La feuille liste les opérations du mois (rangées v6a, mêmes chiffres), « Prévoir » sur l'électricité ouvre son ticket : montant, rythme, prochaines dates (9.12, 9.01, 9.02…).
- Le loyer, déjà prévu chaque mois, est grisé (pas de doublon) ; la vente au marché propose « à recevoir ».
- Gardé : libellé, montant (texte décimal), date (le jour du paiement copié), mouvement, catégorie (reprise de l'opération), répétition, coût des brassins (« à confirmer »), note ; « Une prévision vierge » ouvre le formulaire complet (fournisseur, fin de répétition).
- Boosters : recopier (rangée → ticket), repetition (segment), prochaines (dates posées).
- Au port : lire les opérations du mois courant (\`‹ novembre ›\` change de mois) ; repérer « déjà prévu » par libellé et fournisseur ; « État » en modification seulement.
- passe 2 : défauts corrigés — la vente encaissée dit sa catégorie (Ventes), plus « à recevoir » ; prochaines dates en trait plein (pointillé = sans pièce) ; « coût des brassins : à confirmer » devient « compte dans mon litre ? » ; sous-titre mode d'emploi retiré.`,
};

/* ===== m3pm : le frigo de p5b derrière (3 000,00, payé le 15.11 : 2 800,00 + livraison 200,00, pose ?, usure 5 ans = 600,00 par an).
   Soldes fin de mois (sorties de p5b) : avec nov. 664,18, déc. 257,34, janv. −892,66 ; sans 3 664,18, 3 257,34, 2 107,34. ===== */
const FRIGO = 3000, FINS = [['nov.', 664.18], ['déc.', 257.34], ['janv.', -892.66]];

/* ===== m3pm-a : tiède — le projet tel qu'aujourd'hui, rangé ===== */
V['m3pm-a'] = {
  titre: 'Projet matériel : le contenu actuel, rangé (tiède)',
  css: `.X-tete{display:flex;align-items:center;padding:2px 6px 2px 12px}
.X-tete div{flex:1}.X-tete h2{font-size:17px;font-weight:600;color:var(--t0)}.X-tete p{font-size:12px;color:var(--t2)}
.X-c{padding:4px 12px 8px;display:flex;flex-direction:column;gap:9px}
.X-ta{height:auto;min-height:36px;padding:7px 10px;font-size:15px;line-height:20px;color:var(--t1);align-items:flex-start}
.X-seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;border:1px solid var(--bordm);border-radius:10px;overflow:hidden;height:32px}
.X-seg button{border:0;border-right:1px solid var(--bordm);background:var(--page);font-size:13px;color:var(--t2)}
.X-seg button:last-child{border-right:0}.X-seg button[aria-pressed=true]{background:var(--t0);color:#fff;font-weight:600}
.X-g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.X-tot{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--panel);border-radius:10px}
.X-tot span{flex:1;font-size:13px;color:var(--t1)}.X-tot small{display:block;font-size:12px;color:var(--t2)}
.X-tot b{font-family:var(--mono);font-size:20px;color:var(--t0)}
.X-inc{display:flex;align-items:center;gap:10px;padding:6px 10px;border:2px solid var(--fin);border-radius:10px;background:var(--fint)}
.X-inc div{flex:1;font-size:14px;font-weight:600;color:var(--fin)}.X-inc small{display:block;font-weight:400;font-size:12px;color:var(--t1)}
.X-sw{width:44px;height:26px;border-radius:13px;background:var(--fin);position:relative;flex-shrink:0}
.X-sw::after{content:"";position:absolute;right:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff}
.X-plis{border-top:1px solid var(--bord)}
.X-pl{display:flex;align-items:center;gap:6px;min-height:40px;border-bottom:1px solid var(--bord);font-size:14px;color:var(--t0)}
.X-pl span{flex:1}.X-pl em{font-style:normal;font-size:12px;color:var(--t2);text-align:right}
.X-liens{display:flex;gap:16px;padding:2px 0}
.X-liens button{border:0;background:none;display:inline-flex;align-items:center;gap:4px;height:32px;color:var(--t2);font-size:13px;font-weight:600}`,
  corps: `<div class="X-f">${fond(P5B)}<div class="X-sh">
<div class="X-poi"></div>
<header class="X-tete"><div><h2>Mon projet de matériel</h2><p>Du besoin à l'achat</p></div><button class="X-x" aria-label="Fermer">${I.x}</button></header>
<div class="X-c">
 <label><span class="X-lab">Matériel ou aménagement</span><input class="X-in" value="Frigo"></label>
 <label><span class="X-lab">À quoi va-t-il servir ?</span><span class="X-in X-ta">Garder fûts et bouteilles au froid jusqu'à la vente.</span></label>
 <div><span class="X-lab">Quand devient-il utile ?</span><div class="X-seg" data-booster="echeance"><button aria-pressed="true">Bientôt</button><button aria-pressed="false">Ensuite</button><button aria-pressed="false">Plus tard</button></div></div>
 <div class="X-g2"><label><span class="X-lab">Prix estimé TTC</span><input class="X-in X-m" inputmode="decimal" value="2 800,00"></label><label><span class="X-lab">Paiement prévu en</span><span class="X-in">${I.cal}nov. 2026</span></label></div>
 <div class="X-plis">
  <div class="X-pl"><span>Livraison, pose, devis</span><em><span class="X-m">200,00</span> · pose ? · estimation</em>${I.ch}</div>
 </div>
 <div class="X-tot"><span>Budget total TTC<small>la pose laissée vide n'est pas chiffrée</small></span><b>${chf(FRIGO)}</b></div>
 <div class="X-inc" data-booster="inclure"><div>Dans mes prévisions<small>Compté dans les sorties du 15.11.</small></div><i class="X-sw" role="switch" aria-checked="true"></i></div>
 <div class="X-plis">
  <div class="X-pl"><span>Usure et mise en service</span><em>5 ans · <span class="X-m">600,00</span> par an</em>${I.ch}</div>
  <div class="X-pl"><span>Avancement et notes</span><em>Prêt à acheter</em>${I.ch}</div>
  <div class="X-pl"><span>Achats liés</span><em>aucun pour l'instant</em></div>
 </div>
 <div class="X-liens"><button>${I.ok}Marquer comme réalisé</button><button>${I.arch}Archiver</button></div>
</div>
<footer class="X-pied" style="margin-top:auto"><button class="X-btn">Annuler</button><button class="X-btn X-pri">Enregistrer le projet</button></footer>
</div></div>`,
  note: `# m3pm-a — Projet matériel, rangé (tiède)
- Genre a, tiède : \`UpgradeSheet\` tel qu'aujourd'hui, sur le frigo de p5b derrière (2 800,00 + livraison 200,00 = 3 000,00, payé le 15.11, « Bientôt », « Prêt à acheter », usure 5 ans = 600,00 par an comme la fiche de p5b).
- Change : « Inclure dans mes prévisions » devient un interrupteur bleu qui dit où le budget compte (« sorties du 15.11 ») ; les trois plis portent leur résumé à droite (pose ?, usure, avancement) ; Réalisé / Archiver en liens sous le dernier pli.
- Gardé : nom, besoin, échéance (3), prix, mois, livraison / installation / source du prix / fournisseur / devis (pli), budget total, usure (catégorie, durée, mise en service), avancement (4), notes, achats liés.
- Boosters : echeance (segment), inclure (interrupteur).
- Au port : le conseil « pense à la pose… » vit dans le pli ; la phrase sur le début du mois devient « compté dans les sorties du 15.11 » (mois en cours : le lendemain).
- passe 2 : défauts corrigés — le projet est le frigo 3 000,00 du 15.11 de p5b (plus le fermenteur 750,00, incohérent) ; plus de rouge (« à préciser » était rouge).`,
};

/* ===== m3pm-b : froide — nom, budget, mois, interrupteur ===== */
V['m3pm-b'] = {
  titre: 'Projet matériel : le minimum, le reste à un toucher (froide)',
  css: `.X-h{display:flex;align-items:flex-start;padding:4px 6px 0 12px}
.X-h h2{flex:1;font-size:21px;font-weight:600;color:var(--t0);line-height:26px}
.X-et{display:flex;gap:4px;padding:2px 12px 0}
.X-et span{height:22px;padding:0 8px;border-radius:10px;font-size:12px;display:inline-flex;align-items:center;background:var(--panel);color:var(--t1);border:1px solid var(--bord)}
.X-et span.X-st{background:var(--fint);color:var(--fin);border-color:var(--finc);font-weight:600}
.X-chiffre{display:flex;align-items:baseline;gap:10px;padding:10px 12px 4px}
.X-chiffre b{font-family:var(--mono);font-size:32px;font-weight:600;color:var(--t0);letter-spacing:-.5px}
.X-chiffre span{font-size:14px;color:var(--t1)}
.X-chiffre em{margin-left:auto;font-style:normal;display:inline-flex;align-items:center;gap:4px;height:32px;padding:0 10px;border:1px solid var(--bordm);border-radius:10px;font-size:14px;color:var(--t0)}
.X-inc{display:flex;align-items:center;gap:10px;margin:6px 12px;padding:0 10px;height:48px;border-radius:10px;background:var(--fint)}
.X-inc span{flex:1;font-size:15px;font-weight:600;color:var(--fin)}
.X-inc small{font-size:12px;font-weight:400;color:var(--t1)}
.X-sw{width:44px;height:26px;border-radius:13px;background:var(--fin);position:relative}
.X-sw::after{content:"";position:absolute;right:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff}
.X-tout{display:flex;align-items:center;gap:6px;margin:2px 12px 8px;height:40px;border-top:1px solid var(--bord);font-size:14px;color:var(--t0)}
.X-tout span{flex:1}.X-tout em{font-style:normal;font-size:12px;color:var(--t2)}`,
  corps: `<div class="X-f">${fond(P5B)}<div class="X-sh">
<div class="X-poi"></div>
<div class="X-h"><h2>Frigo</h2><button class="X-x" aria-label="Fermer">${I.x}</button></div>
<div class="X-et"><span class="X-st">Prêt à acheter</span><span>Bientôt</span></div>
<div class="X-chiffre"><b>${chf(FRIGO)}</b><span>CHF</span><em data-booster="mois">${I.cal}nov. 2026</em></div>
<div class="X-inc" data-booster="inclure"><span>Dans mes prévisions <small>· le 15.11</small></span><i class="X-sw" role="switch" aria-checked="true"></i></div>
<div class="X-tout"><span>Besoin, prix détaillé, usure, notes</span><em>pose ? · usure 5 ans</em>${I.ch}</div>
<footer class="X-pied" style="margin-top:auto"><button class="X-btn">Annuler</button><button class="X-btn X-pri">Enregistrer</button></footer>
</div></div>`,
  note: `# m3pm-b — Projet matériel : le minimum (froide)
- Genre b, froide : une demi-feuille sur p5b, qui reste lisible au-dessus (l'étiquette « frigo −3 000, 15.11 » y est : c'est ce projet). Premier plan : le nom, l'avancement et l'échéance en pastilles, le budget 3 000,00, le mois, l'interrupteur « Dans mes prévisions · le 15.11 ».
- Change : tout le reste (besoin, prix 2 800,00 / livraison 200,00 / pose / devis, usure 5 ans, notes, achats liés, Réalisé, Archiver) passe derrière une seule rangée qui dit ce qui manque (« pose ? »).
- Gardé : chaque champ de \`UpgradeSheet\`, à un toucher ; « À estimer » si le budget est inconnu, jamais 0,00.
- Boosters : mois (pastille), inclure (interrupteur).
- Au port : si budget ou mois manquent, l'interrupteur reste éteint et dit « budget à estimer » à sa place (règle \`upgradeReadiness\`).
- passe 2 : défauts corrigés — le projet est le frigo 3 000,00 du 15.11 de p5b (plus « Fermenteur 750,00 » au-dessus de « frigo −3 000 »).`,
};

/* ===== m3pm-c : chaude — le budget en barre, le mois sur une frise, la fin de mois avec / sans ===== */
{
  const SANS = FINS.map(([m, v]) => [m, Math.round((v + FRIGO) * 100) / 100]); // 3 664,18 · 3 257,34 · 2 107,34
  const W = 346, H = 188, z = 126, k = 108 / 3700; // 0 à y=126 ; 3 700 CHF = 108 px
  let barres = `<line x1="0" x2="${W}" y1="${z}" y2="${z}" class="X-zero"/>`;
  [...FINS, ['févr.', null], ['mars', null]].forEach(([m, avec], i) => {
    const x = 8 + i * 68, w = 48, c = x + w / 2;
    if (avec == null) { barres += `<rect x="${x}" y="${z - 44}" width="${w}" height="44" rx="6" class="X-hors"/><text x="${c}" y="${z - 17}" text-anchor="middle" class="X-q">?</text>`; }
    else {
      const sans = SANS[i][1], hs = sans * k, ha = Math.abs(avec) * k, ya = avec >= 0 ? z - ha : z;
      barres += `<rect x="${x}" y="${(z - hs).toFixed(1)}" width="${w}" height="${hs.toFixed(1)}" rx="5" class="X-sans"/>`;
      barres += `<text x="${c}" y="${(z - hs - 5).toFixed(0)}" text-anchor="middle" class="X-vs">${chf(sans)}</text>`;
      barres += `<rect x="${x + 9}" y="${ya.toFixed(1)}" width="${w - 18}" height="${ha.toFixed(1)}" rx="3" class="X-avec"/>`;
      barres += `<text x="${c}" y="${avec >= 0 ? (ya - 5).toFixed(0) : (z + ha + 14).toFixed(0)}" text-anchor="middle" class="X-va">${chf(avec)}</text>`;
    }
    barres += `<text x="${c}" y="${H - 2}" text-anchor="middle" class="X-mo">${m}</text>`;
  });
  V['m3pm-c'] = {
    titre: 'Projet matériel : le budget en barre et son mois sur la frise (chaude)',
    css: `.X-h{display:flex;align-items:center;padding:2px 6px 0 12px;gap:6px}
.X-h h2{flex:1;font-size:18px;font-weight:600;color:var(--t0)}
.X-st{height:22px;padding:0 8px;border-radius:10px;font-size:12px;display:inline-flex;align-items:center;background:var(--fint);color:var(--fin);font-weight:600}
.X-c{padding:4px 12px 8px;display:flex;flex-direction:column;gap:8px}
.X-bud{display:flex;flex-direction:column;gap:4px}
.X-bt{display:flex;align-items:baseline;justify-content:space-between}
.X-bt span{font-size:13px;color:var(--t1);font-weight:600}.X-bt b{font-family:var(--mono);font-size:22px;color:var(--t0)}
.X-bar{display:flex;height:34px;gap:2px}
.X-bar div{border-radius:6px;display:flex;flex-direction:column;justify-content:center;padding:0 7px;font-size:12px;line-height:14px;color:#fff;overflow:hidden;white-space:nowrap}
.X-bar .X-b1{flex:1;background:var(--frigo)}.X-bar .X-b2{flex:0 0 64px;background:#4E9AA8}
.X-bar .X-b3{flex:0 0 50px;background:var(--panel);border:1px solid var(--bordm);color:var(--t2)}
.X-bar b{font-family:var(--mono);font-weight:600}
.X-pan{background:var(--panel);border-radius:16px;padding:8px;display:flex;flex-direction:column;gap:6px}
.X-pt{display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:600;color:var(--t1)}
.X-pt em{font-style:normal;font-weight:400;color:var(--t2);font-size:12px}
.X-fr{position:relative;height:44px;display:grid;grid-template-columns:repeat(5,1fr);gap:2px}
.X-fr span{background:var(--page);border:1px solid var(--bord);border-radius:10px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:3px;font-size:12px;color:var(--t2)}
.X-fr span.X-hz{background:#E9E9E9;border-color:#E9E9E9;color:#8a8a8a}
.X-chip{position:absolute;top:3px;left:2px;width:calc(20% - 4px);height:22px;border-radius:10px;background:var(--frigo);color:#fff;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:2px;box-shadow:0 4px 10px -6px rgba(0,0,0,.6)}
.X-lg{display:flex;gap:12px;font-size:12px;color:var(--t2);align-items:center}
.X-lg i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:4px;vertical-align:-2px}
svg.X-g{display:block;width:100%}
.X-zero{stroke:var(--t1);stroke-width:1}
.X-sans{fill:var(--page);stroke:var(--bordm);stroke-width:1}.X-avec{fill:var(--frigo)}
.X-hors{fill:#E9E9E9}
.X-vs{font-family:var(--mono);font-size:12px;fill:var(--t2)}
.X-va{font-family:var(--mono);font-size:12px;font-weight:700;fill:var(--t0);paint-order:stroke;stroke:var(--page);stroke-width:3px}
.X-q{font-family:var(--mono);font-size:14px;fill:var(--t2);font-weight:600}.X-mo{font-size:12px;fill:var(--t2);font-weight:600}
.X-sw2{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--bordm);border-radius:10px;overflow:hidden;height:44px;background:var(--page)}
.X-sw2 button{border:0;background:none;display:flex;align-items:center;justify-content:space-between;padding:0 8px;font-size:12px;color:var(--t2);text-align:left}
.X-sw2 button+button{border-left:1px solid var(--bordm)}
.X-sw2 button small{display:block;font-size:12px;font-weight:400;color:var(--t2)}
.X-sw2 button b{font-family:var(--mono);font-size:16px;color:var(--t0)}
.X-sw2 button[aria-pressed=true]{background:var(--frigot);color:var(--frigo);font-weight:600;box-shadow:inset 0 0 0 2px var(--frigo)}
.X-sw2 button.X-vt b{color:var(--vert)}
.X-seg{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--bordm);border-radius:10px;overflow:hidden;height:30px}
.X-seg button{border:0;border-right:1px solid var(--bordm);background:var(--page);font-size:13px;color:var(--t2)}
.X-seg button:last-child{border-right:0}.X-seg button[aria-pressed=true]{background:var(--t0);color:#fff;font-weight:600}
.X-row{display:flex;align-items:center;gap:6px;min-height:36px;border-bottom:1px solid var(--bord);font-size:14px}
.X-row span{flex:1}.X-row em{font-style:normal;font-size:12px;color:var(--t2)}`,
    corps: `<div class="X-f">${fond(P5B)}<div class="X-sh">
<div class="X-poi"></div>
<div class="X-h"><h2>Frigo</h2><span class="X-st">Prêt à acheter</span><button class="X-x" aria-label="Fermer">${I.x}</button></div>
<div class="X-c">
 <div class="X-bud" data-booster="budget-barre"><div class="X-bt"><span>Budget TTC · mon estimation</span><b>${chf(FRIGO)}</b></div>
  <div class="X-bar"><div class="X-b1">frigo<b>2 800,00</b></div><div class="X-b2">livr.<b>200,00</b></div><div class="X-b3">pose<b>?</b></div></div></div>
 <div class="X-pan">
  <div class="X-pt">Payé en<em>glisse-le d'un mois</em></div>
  <div class="X-fr" data-booster="frise-mois"><span>nov.</span><span>déc.</span><span>janv.</span><span class="X-hz">févr.</span><span class="X-hz">mars</span><i class="X-chip">‹ −3 000 ›</i></div>
  <div class="X-pt">Ce qu'il reste à la fin du mois<em>févr., mars : hors des 90 jours</em></div>
  <div class="X-lg"><span><i style="background:var(--frigo)"></i>avec le frigo</span><span><i style="background:var(--page);border:1px solid var(--bordm)"></i>sans</span></div>
  <svg class="X-g" viewBox="0 0 ${W} ${H}" height="${H}" data-booster="fin-de-mois">${barres}</svg>
  <div class="X-sw2" role="group" aria-label="Dans mes prévisions" data-booster="avec-sans"><button aria-pressed="true"><span>Avec frigo<small>fin janv.</small></span><b>${chf(FINS[2][1])}</b></button><button class="X-vt" aria-pressed="false"><span>Sans frigo<small>fin janv.</small></span><b>${chf(SANS[2][1])}</b></button></div>
 </div>
 <div><span class="X-lab">Quand devient-il utile ?</span><div class="X-seg"><button aria-pressed="true">Bientôt</button><button aria-pressed="false">Ensuite</button><button aria-pressed="false">Plus tard</button></div></div>
 <div class="X-row"><span>Besoin, devis, fournisseur</span><em>mon estimation</em>${I.ch}</div>
 <div class="X-row"><span>Usure et mise en service</span><em>5 ans · 600,00 par an</em>${I.ch}</div>
 <div class="X-row"><span>Notes, achats liés, réalisé, archiver</span>${I.ch}</div>
</div>
<footer class="X-pied" style="margin-top:auto"><button class="X-btn">Annuler</button><button class="X-btn X-pri">Enregistrer le projet</button></footer>
</div></div>`,
    note: `# m3pm-c — Projet matériel : le budget en barre, le mois sur la frise (chaude)
- Genre c, chaude : trois boosters portent la décision « je l'inclus, et quand ? » : le budget en barre (frigo 2 800,00 + livraison 200,00 + pose « ? », jamais 0) ; le mois posé sur une frise (‹ −3 000 › en nov., glisse) ; ce qu'il reste à chaque fin de mois, avec le frigo (teinte de p5b) et sans lui (cadre clair).
- Chiffres (sorties de p5b, frigo le 15.11) : avec nov. 664,18, déc. 257,34, janv. ${chf(FINS[2][1])} ; sans ${chf(SANS[0][1])}, ${chf(SANS[1][1])}, ${chf(SANS[2][1])} ; févr. et mars « ? », hors des 90 jours. La bascule Avec / Sans reprend celle de p5b (mêmes ${chf(FINS[2][1])} / ${chf(SANS[2][1])}) et vaut « Inclure dans mes prévisions ».
- Gardé : nom, avancement, échéance (3), prix, livraison, pose, source du prix ; besoin, devis, fournisseur, usure (5 ans, 600,00 par an), notes, achats liés, Réalisé / Archiver en rangées.
- Au port : la fin de mois vient de \`previsions/escalier.ts\` ; un mois hors horizon reste « ? ».
- passe 2 : défauts corrigés — projet = frigo de p5b, soldes avec / sans recalculés (plus −892,66 attribué au fermenteur ni « Sans −142,66 ») ; ni rouge (solde sous zéro en noir) ni pointillé (pose, « sans », mois hors horizon : traits pleins).`,
  };
}

/* ===== m3pm-d : libre — la piste du projet, de l'idée à la mise en service ===== */
V['m3pm-d'] = {
  titre: 'Projet matériel : la piste, de l\'idée à la mise en service (libre)',
  css: `.X-h{display:flex;align-items:center;padding:2px 6px 4px 12px;gap:8px}
.X-h h2{flex:1;font-size:18px;font-weight:600;color:var(--t0);line-height:22px}
.X-h b{font-family:var(--mono);font-size:20px;color:var(--t0)}
.X-p{padding:2px 12px 6px}
.X-s{display:grid;grid-template-columns:28px 1fr;column-gap:8px;position:relative;padding-bottom:8px}
.X-s::before{content:"";position:absolute;left:13px;top:24px;bottom:-2px;width:2px;background:var(--bord)}
.X-s:last-child::before{display:none}
.X-s.X-fait::before{background:var(--fin)}
.X-o{width:28px;height:28px;border-radius:50%;border:2px solid var(--bordm);background:var(--page);display:flex;align-items:center;justify-content:center;color:#fff;position:relative;z-index:1}
.X-o svg{width:15px;height:15px}
.X-fait .X-o{background:var(--fin);border-color:var(--fin)}
.X-ici .X-o{border:3px solid var(--fin);box-shadow:0 0 0 4px var(--fint)}
.X-n{min-height:28px;display:flex;flex-direction:column;justify-content:center}
.X-hl{display:flex;align-items:center;gap:6px;min-height:28px}
.X-n h3{font-size:14px;font-weight:600;color:var(--t0);display:flex;align-items:center;gap:6px}
.X-n h3 em{font-style:normal;font-size:12px;font-weight:400;color:var(--t2)}
.X-n p{font-size:13px;color:var(--t1);line-height:17px}
.X-ici .X-carte{margin-top:4px;background:var(--fint);border-radius:10px;padding:8px;display:flex;flex-direction:column;gap:6px}
.X-l{display:flex;align-items:center;gap:8px;font-size:13px;min-height:32px}
.X-l span{flex:1;color:var(--t1)}.X-l b{font-family:var(--mono);font-weight:600;color:var(--t0)}
.X-l small{display:block;font-size:12px;color:var(--t2)}
.X-mois{display:inline-flex;align-items:center;gap:4px;height:32px;padding:0 10px;border:1px solid var(--bordm);border-radius:10px;background:var(--page);font-size:14px;color:var(--t0)}
.X-a{display:inline-flex;align-items:center;gap:4px;height:30px;padding:0 10px;border-radius:10px;border:1px solid var(--bordm);background:var(--page);font-size:13px;font-weight:600;color:var(--t0);margin-left:auto}
.X-a svg{width:15px;height:15px}
.X-sw{width:44px;height:26px;border-radius:13px;background:var(--fin);position:relative;flex-shrink:0}
.X-sw::after{content:"";position:absolute;right:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff}
.X-pas .X-n h3{color:var(--t1)}
.X-pas .X-n p{color:var(--t2)}
.X-pied .X-btn:first-child{color:var(--t2)}`,
  corps: `<div class="X-f">${fond(P5B)}<div class="X-sh">
<div class="X-poi"></div>
<div class="X-h"><h2>Frigo</h2><b>${chf(FRIGO)}</b><button class="X-x" aria-label="Fermer">${I.x}</button></div>
<div class="X-p" data-booster="piste-projet">
 <div class="X-s X-fait"><span class="X-o">${I.ok}</span><div class="X-n"><h3>Idée <em>· Bientôt</em></h3><p>Garder fûts et bouteilles au froid jusqu'à la vente.</p></div></div>
 <div class="X-s X-fait"><span class="X-o">${I.ok}</span><div class="X-n"><h3>À étudier <em>· mon estimation</em></h3><p><span class="X-m">2 800,00</span> + livraison <span class="X-m">200,00</span> · pose ?</p></div></div>
 <div class="X-s X-fait"><span class="X-o">${I.ok}</span><div class="X-n"><div class="X-hl"><h3>Devis <em>· aucun noté</em></h3><span class="X-a">${I.plus}Noter un devis</span></div></div></div>
 <div class="X-s X-ici"><span class="X-o"></span><div class="X-n"><h3>Prêt à acheter <em>· tu en es là</em></h3>
  <div class="X-carte">
   <div class="X-l"><span>Payé en</span><span class="X-mois">${I.cal}nov. 2026</span></div>
   <div class="X-l"><span style="color:var(--fin);font-weight:600">Dans mes prévisions<small>compté dans les sorties du 15.11</small></span><i class="X-sw" role="switch" aria-checked="true" data-booster="inclure"></i></div>
  </div></div></div>
 <div class="X-s X-pas"><span class="X-o"></span><div class="X-n"><div class="X-hl"><h3>Acheté <em>· achats liés : aucun</em></h3><span class="X-a">Noter l'achat${I.fleche}</span></div></div></div>
 <div class="X-s X-pas"><span class="X-o"></span><div class="X-n"><h3>En service <em>· son usure</em></h3><p>5 ans · <span class="X-m">600,00</span> par an · mise en service ?</p></div></div>
</div>
<footer class="X-pied" style="margin-top:auto"><button class="X-btn">${I.arch}Archiver</button><button class="X-btn X-pri">Enregistrer le projet</button></footer>
</div></div>`,
  note: `# m3pm-d — Projet matériel : la piste du projet (libre)
- Genre d, libre : l'« Avancement » (Idée, À étudier, Devis, Prêt à acheter) devient une piste verticale prolongée par Acheté et En service ; chaque station porte ses champs, la station en cours est ouverte, les stations passées tiennent en une ligne.
- Le frigo de p5b derrière : 2 800,00 + livraison 200,00 = 3 000,00, pose ?, payé en nov. 2026 (le 15.11), dans mes prévisions, achats liés : aucun, usure 5 ans = 600,00 par an.
- Gardé : chaque champ de \`UpgradeSheet\` est rangé à sa station (besoin et échéance à « Idée » ; prix, livraison, pose, source à « À étudier » ; devis et fournisseur à « Devis » ; mois et inclusion à « Prêt » ; Noter l'achat et achats liés à « Acheté » ; usure à « En service ») ; Archiver au pied ; « Marquer comme réalisé » = la station Acheté cochée.
- Boosters : piste-projet (station touchée = ouverte), inclure (interrupteur).
- Au port : les stations Acheté et En service sont déduites des factures liées et de \`inServiceMonth\`, sans nouveau champ ; notes sous la piste (non dessinées).
- passe 2 : défauts corrigés — le projet est le frigo 3 000,00 du 15.11 de p5b ; la piste tient sur un écran (stations passées en une ligne, boutons en bout de ligne) ; plus de rouge (« à préciser »).`,
};

/* ===== m3im : la cuve de fermentation (fixture : 1 800,00, févr. 2025, cuves 20 % dégressif, départ 2026 1 440,00 confirmé) ===== */
const DEG = [[2025, 1440], [2026, 1152], [2027, 921.6], [2028, 737.28], [2029, 589.82], [2030, 471.86]];
const LIN = [[2025, 1620], [2026, 1440], [2027, 1260], [2028, 1080], [2029, 900], [2030, 720]];

V['m3im-a'] = {
  titre: 'Immobilisation : le contenu actuel, rangé (tiède)',
  css: `.X-sh{margin-top:40px;min-height:804px}
.X-h{display:flex;align-items:center;padding:2px 6px 2px 12px}
.X-h div{flex:1}.X-h h2{font-size:17px;font-weight:600;color:var(--t0)}.X-h p{font-size:12px;color:var(--t2)}
.X-c{padding:4px 12px 8px;display:flex;flex-direction:column;gap:9px}
.X-g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.X-g3{display:grid;grid-template-columns:1.2fr .8fr .8fr;gap:8px}
.X-sel{justify-content:space-between;color:var(--t0);font-size:14px;white-space:nowrap;overflow:hidden}.X-sel svg{color:var(--t2)}
.X-sel small{font-size:12px;color:var(--fin);font-weight:600}
.X-puces{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.X-puces button{height:32px;padding:0 8px;border:1px solid var(--bordm);border-radius:10px;background:var(--page);font-size:13px;display:flex;align-items:center;justify-content:space-between;text-align:left;color:var(--t1)}
.X-puces button b{font-family:var(--mono);font-weight:600;font-size:13px}
.X-puces button[aria-pressed=true]{background:var(--t0);border-color:var(--t0);color:#fff}
.X-seg{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--bordm);border-radius:10px;overflow:hidden;height:36px}
.X-seg button{border:0;background:var(--page);font-size:13px;color:var(--t2);white-space:nowrap;padding:0 4px}
.X-seg button+button{border-left:1px solid var(--bordm)}.X-seg button[aria-pressed=true]{background:var(--t0);color:#fff;font-weight:600}
.X-dep{background:var(--panel);border-radius:10px;padding:8px;display:flex;flex-direction:column;gap:6px}
.X-dep h3{font-size:13px;font-weight:600;color:var(--t1)}
.X-ok{display:flex;align-items:flex-start;gap:8px;font-size:13px;color:var(--t1);line-height:17px}
.X-ok i{width:20px;height:20px;border-radius:6px;background:var(--vert);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.X-ok i svg{width:14px;height:14px}
.X-pl{display:flex;align-items:center;gap:6px;min-height:40px;border-top:1px solid var(--bord);border-bottom:1px solid var(--bord);font-size:14px;color:var(--t0)}
.X-pl span{flex:1}.X-pl em{font-style:normal;font-size:12px;color:var(--t2)}`,
  corps: `<div class="X-f">${fond(G6)}<div class="X-sh">
<div class="X-poi"></div>
<header class="X-h"><div><h2>L'usure de ta cuve</h2><p>terme : amortissement</p></div><button class="X-x" aria-label="Fermer">${I.x}</button></header>
<div class="X-c">
 <div class="X-g2">
  <div><span class="X-lab">Matériel du stock</span><span class="X-in X-sel">Cuve de fermentation${I.bas}</span></div>
  <label><span class="X-lab">Nom</span><input class="X-in" value="Cuve de fermentation"></label>
 </div>
 <div><span class="X-lab">Achat lié</span><span class="X-in X-sel"><span style="color:var(--t2)">achat ancien ou à relier</span>${I.bas}</span></div>
 <div class="X-g3">
  <label><span class="X-lab">Prix d'achat TTC</span><input class="X-in X-m" inputmode="decimal" value="1 800,00"></label>
  <div><span class="X-lab">Achetée le</span><span class="X-in X-m" style="font-size:14px">01.02.25</span></div>
  <div><span class="X-lab">En service le</span><span class="X-in X-m" style="font-size:14px">01.02.25</span></div>
 </div>
 <div><span class="X-lab">Catégorie, taux de l'AFC · à confirmer</span><div class="X-puces" data-booster="categorie-taux">
  <button aria-pressed="true">Cuves et conteneurs<b>20 %</b></button><button aria-pressed="false">Installations, mobilier<b>25 %</b></button>
  <button aria-pressed="false">Machines<b>30 %</b></button><button aria-pressed="false">Informatique, mesure<b>40 %</b></button>
  <button aria-pressed="false">Outillage<b>45 %</b></button><button aria-pressed="false">Taux à moi<b>…</b></button></div></div>
 <div class="X-g3" style="grid-template-columns:2fr 1fr">
  <div><span class="X-lab">Elle perd chaque année</span><div class="X-seg" data-booster="methode"><button aria-pressed="true">20 % du reste</button><button aria-pressed="false">10 % du prix</button></div></div>
  <label><span class="X-lab">Part pro %</span><input class="X-in X-m" inputmode="decimal" value="100"></label>
 </div>
 <div class="X-dep"><h3>Ton départ dans l'app</h3>
  <div class="X-g3"><label><span class="X-lab">Année</span><input class="X-in X-m" inputmode="numeric" value="2026"></label><label><span class="X-lab">Valeur 1er janv.</span><input class="X-in X-m" inputmode="decimal" value="1 440,00"></label><label><span class="X-lab">Comptée</span><span class="X-in" style="font-size:14px">entière${I.bas}</span></label></div>
  <div class="X-ok"><i>${I.ok}</i>Je confirme la catégorie, l'année et la valeur de départ. Les années d'avant ne sont pas recalculées.</div>
 </div>
 <div class="X-pl">${I.vente}<span>Vendue ou mise au rebut</span><em>non</em>${I.ch}</div>
</div>
<footer class="X-pied" style="margin-top:auto"><button class="X-btn">Annuler</button><button class="X-btn X-pri">Enregistrer</button></footer>
</div></div>`,
  note: `# m3im-a — Immobilisation, rangée (tiède)
- Genre a, tiède : \`AssetSheet\` tel qu'aujourd'hui, sur la cuve de la fixture (1 800,00, 01.02.2025, cuves 20 %, dégressive, départ 2026 à 1 440,00 confirmé, part pro 100 %) ; g6 étape 4 derrière.
- Change : titre « L'usure de ta cuve » (« terme : amortissement » au second plan, comme g6) ; les 6 catégories AFC en puces avec leur taux ; « Méthode » dite par son effet (« 20 % du reste » / « 10 % du prix ») ; le départ (année, valeur, première année) groupé avec sa case confirmée ; la cession en un pli « Vendue ou mise au rebut ».
- Gardé : matériel du stock, nom, achat lié (+ ligne de l'achat, avoirs s'il y en a : non dessinés, aucun dans la fixture), prix TTC, dates d'achat et de service, taux, part pro, première année, valeur d'ouverture, fraction, confirmation.
- Boosters : categorie-taux (puces), methode (segment).
- passe 2 : défauts corrigés — départ en « Année · Valeur 1er janv. · Comptée (entière) », plus « Première année » à côté de « 1re année » ni « Valeur au 1.1 » ; le taux dit une seule fois (puce de catégorie, « Taux à moi » pour un autre ; la case « Taux % » retirée).
- Au port : la fraction de la première année devient « entière / partielle ⌄ » (partielle ouvre le nombre) ; champs en \`inputmode\`, jamais \`type="number"\`.`,
};

V['m3im-b'] = {
  titre: 'Immobilisation : ce qu\'elle perd cette année, le reste à un toucher (froide)',
  css: `.X-sh{margin-top:470px;min-height:374px}
.X-h{display:flex;align-items:center;padding:2px 6px 0 12px}
.X-h h2{flex:1;font-size:18px;font-weight:600;color:var(--t0)}
.X-big{display:flex;align-items:center;gap:12px;padding:6px 12px 2px}
.X-big div{display:flex;flex-direction:column}
.X-big span{font-size:12px;color:var(--t2)}
.X-big b{font-family:var(--mono);font-size:30px;font-weight:600;color:var(--t0)}
.X-big p{margin-left:auto;font-family:var(--mono);font-size:14px;color:var(--t1);text-align:right;line-height:18px}
.X-big p em{font-style:normal;font-family:var(--sans);font-size:12px;color:var(--t2);display:block}
.X-faits{display:grid;grid-template-columns:auto auto 1fr;gap:4px;padding:8px 12px 4px}
.X-faits span{height:28px;padding:0 9px;border-radius:10px;border:1px solid var(--bord);background:var(--panel);display:inline-flex;align-items:center;font-size:13px;color:var(--t1);white-space:nowrap}
.X-faits span b{font-family:var(--mono);font-weight:600;margin-right:4px}
.X-conf{display:flex;align-items:center;gap:6px;margin:4px 12px;font-size:13px;color:var(--vert);font-weight:600}
.X-conf svg{width:16px;height:16px}
.X-tout{display:flex;align-items:center;gap:6px;margin:4px 12px 6px;height:40px;border-top:1px solid var(--bord);font-size:14px;color:var(--t0)}
.X-tout span{flex:1}.X-tout em{font-style:normal;font-size:12px;color:var(--t2)}`,
  corps: `<div class="X-f">${fond(G6)}<div class="X-sh">
<div class="X-poi"></div>
<div class="X-h"><h2>Cuve de fermentation</h2><button class="X-x" aria-label="Fermer">${I.x}</button></div>
<div class="X-big" data-booster="perte-annee"><div><span>Elle perd en 2026</span><b>${chf(-288)}</b></div><p>1 440,00 → 1 152,00<em>1er janv. → 31 déc.</em></p></div>
<div class="X-faits" data-booster="faits"><span><b>1 800,00</b>févr. 2025</span><span>Cuves · 20 % du reste</span></div>
<div class="X-conf">${I.ok}Départ 2026 confirmé</div>
<div class="X-tout"><span>Achat lié, dates, part pro, vente</span><em>tout à 100 %</em>${I.ch}</div>
<footer class="X-pied" style="margin-top:auto"><button class="X-btn">Annuler</button><button class="X-btn X-pri">Enregistrer</button></footer>
</div></div>`,
  note: `# m3im-b — Immobilisation : ce qu'elle perd cette année (froide)
- Genre b, froide : une demi-feuille sous l'escalier de g6 (qui reste visible) ; premier plan : la perte de l'année (−288,00), le passage 1 440,00 → 1 152,00, le prix et le mois d'achat, la catégorie dite par son effet, « Départ 2026 confirmé ».
- Change : tous les réglages (matériel du stock, nom, achat lié et ligne, avoirs, dates d'achat et de service, catégorie, méthode, taux, part pro, première année, valeur de départ, fraction, cession) passent derrière une rangée.
- Gardé : chaque champ de \`AssetSheet\`, à un toucher ; sans confirmation, la ligne verte devient « départ à confirmer » (orange), jamais un chiffre supposé.
- Boosters : perte-annee (chiffre et passage), faits (pastilles).
- Au port : « tout à 100 % » résume la part pro ; si elle change, la pastille le dit.`,
};

{
  const W = 346, H = 168, base = 140, k = 118 / 1800;
  let s = `<line x1="0" x2="${W}" y1="${base}" y2="${base}" class="X-zero"/>`;
  const cols = [['achat', 1800, null], ...DEG.map(([a, v], i) => [String(a), v, LIN[i][1]])];
  cols.forEach(([lab, v, lin], i) => {
    const x = 4 + i * 49, w = 40, h = v * k, y = base - h, cur = lab === '2026';

    s += `<rect x="${x}" y="${y.toFixed(1)}" width="${w}" height="${h.toFixed(1)}" rx="4" class="${lab === 'achat' ? 'X-b0' : cur ? 'X-bc' : +lab < 2026 ? 'X-bp' : 'X-bf'}"/>`;
    s += `<text x="${x + w / 2}" y="${(y - 4).toFixed(0)}" text-anchor="middle" class="${cur ? 'X-vc' : 'X-v'}">${chf(v).replace(/,\d\d$/, '')}</text>`;
    s += `<text x="${x + w / 2}" y="${H - 12}" text-anchor="middle" class="${cur ? 'X-ac' : 'X-a'}">${lab}</text>`;
  });
  s += `<text x="${4 + 2 * 49 + 20}" y="${H - 1}" text-anchor="middle" class="X-pe">−288</text>`;
  V['m3im-c'] = {
    titre: 'Immobilisation : la cuve année par année, le taux sous le doigt (chaude)',
    css: `.X-sh{margin-top:46px;min-height:798px}
.X-h{display:flex;align-items:center;padding:2px 6px 0 12px}
.X-h div{flex:1}.X-h h2{font-size:17px;font-weight:600;color:var(--t0)}.X-h p{font-size:12px;color:var(--t2)}
.X-c{padding:4px 12px 8px;display:flex;flex-direction:column;gap:8px}
.X-pan{background:var(--panel);border-radius:16px;padding:8px;display:flex;flex-direction:column;gap:6px}
.X-seg{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--bordm);border-radius:10px;overflow:hidden;height:44px;background:var(--page)}
.X-seg button{border:0;background:none;font-size:13px;color:var(--t2);line-height:15px}
.X-seg button b{display:block;font-size:14px;color:var(--t0)}
.X-seg button+button{border-left:1px solid var(--bordm)}
.X-seg button[aria-pressed=true]{background:var(--t0);color:#ddd}.X-seg button[aria-pressed=true] b{color:#fff}
svg.X-g{display:block;width:100%}
.X-zero{stroke:var(--t1)}
.X-b0{fill:#C9D9F0}.X-bp{fill:#7FA3DA}.X-bc{fill:var(--fin)}.X-bf{fill:#EEF3FA;stroke:#7FA3DA;stroke-width:1}
.X-v{font-family:var(--mono);font-size:12px;fill:var(--t1)}.X-vc{font-family:var(--mono);font-size:13px;font-weight:700;fill:var(--fin)}
.X-a{font-size:12px;fill:var(--t2)}.X-ac{font-size:12px;fill:var(--t0);font-weight:700}
.X-pe{font-family:var(--mono);font-size:12px;font-weight:700;fill:var(--t0)}
.X-lg{display:flex;gap:12px;font-size:12px;color:var(--t2);align-items:center}
.X-lg i{display:inline-block;width:14px;height:10px;border-radius:2px;margin-right:4px;vertical-align:-1px}
.X-res{display:flex;align-items:baseline;gap:6px;border-top:1px solid var(--bord);padding-top:6px}
.X-res span{font-size:13px;font-weight:600;color:var(--t1);flex:1}
.X-res b{font-family:var(--mono);font-size:20px;color:var(--t0)}
.X-cur{display:flex;align-items:center;gap:8px}
.X-cur span{font-size:13px;color:var(--t1);width:70px}
.X-tr{flex:1;height:4px;border-radius:2px;background:var(--fin);position:relative}
.X-tr::after{content:"";position:absolute;right:-2px;top:-10px;width:24px;height:24px;border-radius:50%;background:#fff;border:2px solid var(--fin);box-shadow:0 2px 6px -2px rgba(0,0,0,.4)}
.X-cur b{font-family:var(--mono);font-size:14px;width:48px;text-align:right;color:var(--t0)}
.X-g3{display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:6px}
.X-cell{border:1px solid var(--bord);border-radius:10px;padding:4px 8px;min-height:44px}
.X-cell span{display:block;font-size:12px;color:var(--t2)}.X-cell b{font-family:var(--mono);font-size:14px;color:var(--t0);font-weight:600}
.X-conf{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--vert);font-weight:600}
.X-row{display:flex;align-items:center;gap:6px;min-height:36px;border-bottom:1px solid var(--bord);font-size:14px}
.X-row span{flex:1}.X-row em{font-style:normal;font-size:12px;color:var(--t2)}`,
    corps: `<div class="X-f">${fond(G6)}<div class="X-sh">
<div class="X-poi"></div>
<header class="X-h"><div><h2>Cuve de fermentation</h2><p>son usure · terme : amortissement</p></div><button class="X-x" aria-label="Fermer">${I.x}</button></header>
<div class="X-c">
 <div class="X-pan">
  <div class="X-seg" role="group" aria-label="Comment elle s'use" data-booster="methode"><button aria-pressed="true"><b>20 % du reste</b>dégressive · AFC cuves</button><button aria-pressed="false"><b>10 % du prix</b>linéaire</button></div>
  <svg class="X-g" viewBox="0 0 ${W} ${H}" height="${H}" data-booster="annees">${s}</svg>
  <div class="X-lg"><span><i style="background:var(--fin)"></i>2026</span><span><i style="background:#EEF3FA;border:1px solid #7FA3DA"></i>prévu</span><span style="margin-left:auto">si 10 % du prix : <b class="X-m" style="color:var(--t0)">${chf(-180)}</b> en 2026</span></div>
  <div class="X-res"><span>Usure à garder en 2026</span><b>288,00</b></div>
 </div>
 <div class="X-cur" data-booster="part-pro"><span>Part pro</span><i class="X-tr"></i><b>100 %</b></div>
 <div class="X-g3"><div class="X-cell"><span>Prix d'achat</span><b>1 800,00</b></div><div class="X-cell"><span>Achetée</span><b>01.02.25</b></div><div class="X-cell"><span>En service</span><b>01.02.25</b></div></div>
 <div class="X-g3"><div class="X-cell"><span>Départ</span><b>2026</b></div><div class="X-cell"><span>Valeur 1er janv.</span><b>1 440,00</b></div><div class="X-cell"><span>1re année</span><b style="font-family:var(--sans)">entière</b></div></div>
 <div class="X-conf">${I.ok}Catégorie et départ confirmés</div>
 <div class="X-row"><span>Matériel du stock, achat lié, catégorie</span><em>Cuves 20 %</em>${I.ch}</div>
 <div class="X-row"><span>Vendue ou mise au rebut</span><em>non</em>${I.ch}</div>
</div>
<footer class="X-pied" style="margin-top:auto"><button class="X-btn">Annuler</button><button class="X-btn X-pri">Enregistrer</button></footer>
</div></div>`,
    note: `# m3im-c — Immobilisation : la cuve année par année (chaude)
- Genre c, chaude : un seul facteur libre sous le doigt, la manière dont elle s'use (« 20 % du reste », dégressive, ou « 10 % du prix », linéaire) ; les barres de g6 (achat 1 800, 1 440, 1 152 en 2026, puis 922, 737, 590, 472 prévues, en clair) et, en un chiffre, ce que donnerait 10 % du prix (−180,00 en 2026). Usure à garder en 2026 : 288,00.
- La part pro devient un curseur (100 %) ; prix, dates, départ et première année en cases ; la confirmation en ligne verte.
- Gardé : matériel du stock, nom, achat lié (+ ligne, avoirs), catégorie AFC, taux (pli « catégorie »), cession (pli) ; chiffres de la fixture et de g6, calculés (20 % du reste chaque année).
- Boosters : methode (segment), annees (barres), part-pro (curseur).
- Au port : le calcul vient de \`domain/finance/annual\` ; aucune hachure (elle veut dire « à payer »).
- passe 2 : défauts corrigés — les cadres « si 10 % » retirés : un seul chiffre sous les barres (−180,00 en 2026) ; « 1 440 » dégagé ; « Valeur 1er janv. » au lieu de « Valeur au 1.1 » ; années prévues en clair, trait plein ; −288 en noir.`,
  };
}

V['m3im-d'] = {
  titre: 'Immobilisation : la plaque de la cuve et ses années (libre)',
  css: `.X-sh{margin-top:96px;min-height:748px}
.X-h{display:flex;justify-content:flex-end;padding:0 6px}
.X-pl{margin:0 12px;border-radius:10px;background:linear-gradient(180deg,#EDEEF0,#D9DCE1);border:1px solid #B9BDC4;padding:10px 14px;position:relative;box-shadow:inset 0 1px 0 #fff,0 2px 6px -3px rgba(0,0,0,.35)}
.X-pl::before,.X-pl::after{content:"";position:absolute;top:8px;width:8px;height:8px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,#8E949C)}
.X-pl::before{left:6px}.X-pl::after{right:6px}
.X-pl h2{font-size:18px;font-weight:700;color:var(--t0);letter-spacing:.2px;padding-left:4px}
.X-pl dl{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:2px 8px;margin-top:6px;padding-left:4px;font-size:12px}
.X-pl dt{color:#555}.X-pl dd{font-family:var(--mono);color:var(--t0);font-weight:600;font-size:13px}
.X-pl dd.X-t{font-family:var(--sans)}
.X-ti{display:flex;justify-content:space-between;align-items:baseline;padding:12px 12px 4px}
.X-ti h3{font-size:14px;font-weight:600;color:var(--t0)}.X-ti span{font-size:12px;color:var(--t2)}
.X-ans{display:flex;gap:4px;padding:0 12px;overflow:hidden}
.X-an{flex:1 1 0;min-width:0;border:1px solid var(--bord);border-radius:10px;padding:6px 6px 5px;display:flex;flex-direction:column;gap:2px;background:var(--page);position:relative}
.X-an span{font-size:12px;color:var(--t2);font-weight:600}
.X-an b{font-family:var(--mono);font-size:13px;color:var(--t0);font-weight:600}
.X-an i{font-style:normal;font-family:var(--mono);font-size:12px;color:var(--t1)}
.X-an.X-av{background:var(--panel);border-style:solid}
.X-an.X-av b{color:var(--t2)}
.X-an.X-cu{flex:1.8 1 0;border:2px solid var(--fin);background:var(--fint)}
.X-an.X-cu span{color:var(--fin)}
.X-an.X-cu b{font-size:16px}
.X-an.X-fu{border-color:var(--bord);background:#FAFAFA}
.X-an.X-fu b{color:var(--t2)}
.X-trou{position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:#fff;border:1.5px solid var(--bordm)}
.X-av .X-trou,.X-cu .X-trou{background:var(--t1);border-color:var(--t1)}
.X-lien{display:flex;align-items:center;gap:6px;padding:6px 12px;font-size:13px;color:var(--fin);font-weight:600;height:36px}
.X-bl{margin:6px 12px 0;border-top:1px solid var(--bord)}
.X-r{display:flex;align-items:center;gap:8px;min-height:44px;border-bottom:1px solid var(--bord);font-size:14px;color:var(--t0)}
.X-r span{flex:1}.X-r em{font-style:normal;font-size:12px;color:var(--t2)}
.X-r b{font-family:var(--mono);font-weight:600}
.X-pp{display:inline-grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--bordm);border-radius:10px;overflow:hidden;height:28px}
.X-pp button{border:0;border-right:1px solid var(--bordm);background:var(--page);font-family:var(--mono);font-size:12px;padding:0 6px;color:var(--t2)}
.X-pp button:last-child{border-right:0}.X-pp button[aria-pressed=true]{background:var(--t0);color:#fff;font-weight:600}
.X-fin{margin:8px 12px 0;border:1px solid var(--bordm);border-radius:10px;padding:8px 10px;display:flex;align-items:center;gap:8px}
.X-fin div{flex:1;font-size:14px;font-weight:600;color:var(--t0)}.X-fin div small{display:block;font-size:12px;color:var(--t2);font-weight:400}
.X-fin button{height:32px;padding:0 10px;border-radius:10px;border:1px solid var(--bordm);background:var(--page);font-size:13px;font-weight:600}`,
  corps: `<div class="X-f">${fond(G6)}<div class="X-sh">
<div class="X-poi"></div>
<div class="X-h"><button class="X-x" aria-label="Fermer">${I.x}</button></div>
<div class="X-pl" data-booster="plaque"><h2>Cuve de fermentation</h2>
 <dl><dt>achetée</dt><dd>01.02.2025</dd><dt>prix</dt><dd>1 800,00</dd><dt>catégorie</dt><dd class="X-t">Cuves</dd><dt>s'use</dt><dd class="X-t">20 % du reste</dd></dl></div>
<div class="X-ti"><h3>Ses années</h3><span>2027 et 2028 : prévues</span></div>
<div class="X-ans" data-booster="annees-poinconnees">
 <div class="X-an X-av"><i class="X-trou"></i><span>2025</span><b>${chf(-360)}</b><i>1 440</i></div>
 <div class="X-an X-cu"><i class="X-trou"></i><span>2026 · en cours</span><b>${chf(-288)}</b><i>reste 1 152</i></div>
 <div class="X-an X-fu"><i class="X-trou"></i><span>2027</span><b>${chf(-230.4)}</b><i>922</i></div>
 <div class="X-an X-fu"><i class="X-trou"></i><span>2028</span><b>${chf(-184.32)}</b><i>737</i></div>
</div>
<div class="X-lien">Voir l'étape 4 de la clôture 2026${I.ch}</div>
<div class="X-bl">
 <div class="X-r"><span>Départ dans l'app</span><b>2026 · 1 440,00</b><em style="color:var(--vert);font-weight:600">confirmé</em></div>
 <div class="X-r" data-booster="part-pro"><span>Part pro</span><div class="X-pp"><button aria-pressed="false">25</button><button aria-pressed="false">50</button><button aria-pressed="false">75</button><button aria-pressed="true">100 %</button></div></div>
 <div class="X-r"><span>Achat lié, matériel du stock</span><em>à relier</em>${I.ch}</div>
</div>
<div class="X-fin" data-booster="fin-de-vie"><div>Vendue ou mise au rebut ?<small>Sa valeur restante sort alors du dossier.</small></div><button>Noter la vente</button></div>
<footer class="X-pied" style="margin-top:auto"><button class="X-btn">Annuler</button><button class="X-btn X-pri">Enregistrer</button></footer>
</div></div>`,
  note: `# m3im-d — Immobilisation : la plaque de la cuve et ses années (libre)
- Genre d, libre : le bien se lit comme la plaque rivée sur la cuve (date, prix, catégorie, « s'use 20 % du reste »), puis ses années comme des tickets poinçonnés : 2025 (−360,00, compté avant l'app, grisé), 2026 en cours (−288,00, reste 1 152,00), 2027 et 2028 prévues (−230,40, −184,32), en clair.
- La fin de vie (cession : date, prix, vente liée) devient une case visible, « Vendue ou mise au rebut ? » ; la part pro un segment 25 / 50 / 75 / 100 % (un autre taux s'écrit dans le pli).
- Gardé : départ (année, valeur 1 440,00, confirmé), achat lié et matériel du stock (pli), nom, dates, catégorie, méthode, taux, première année (sous la plaque, à un toucher) ; lien vers l'étape 4 de g6.
- Boosters : plaque, annees-poinconnees, part-pro (segment), fin-de-vie.
- Au port : 2025 « comptée avant l'app » = années d'avant non recalculées ; aucune hachure (elle veut dire « à payer »).
- passe 2 : défauts corrigés — les quatre tickets remplissent la largeur (plus de 2028 à moitié vide) ; « poinçonnée = comptée » devient « 2027 et 2028 : prévues » ; plus de rouge (montants en noir) ni de pointillé (tickets prévus et case de fin de vie en trait plein).`,
};

const P2 = {
  "m3pr-b": "- passe 2 : défauts corrigés — le montant en noir (rouge = en retard seulement).",
  "m3im-b": "- passe 2 : défauts corrigés — aucun relevé par le critique ; inchangée.",
};
for (const [id, l] of Object.entries(P2)) V[id].note = V[id].note.trimEnd() + "\n" + l;

// ---------- écrire, puis capturer ----------
const voulus = process.argv[2] ? process.argv[2].split(',') : Object.keys(V);
for (const id of voulus) {
  const v = V[id]; mkdirSync(DIR + id, { recursive: true });
  writeFileSync(DIR + id + '/etat.html', page(id, v.titre, v.css, v.corps));
  writeFileSync(DIR + id + '/NOTE.md', v.note.trim() + '\n');
}
const { browser, page: pg, journal } = await ouvrir({ largeur: 390, hauteur: 844, mobile: true, echelle: 2 });
for (const id of voulus) {
  await pg.goto('file:///' + (DIR + id + '/etat.html').replace(/\\/g, '/'));
  await pg.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 150));
  await pg.screenshot({ path: DIR + id + '/' + id + '.png', fullPage: true });
  const h = await pg.evaluate(() => document.documentElement.scrollHeight);
  console.log(id, 'capturé', h, 'px');
}
if (journal.erreurs.length || journal.bloquees.length) console.log('journal', JSON.stringify({ e: journal.erreurs, b: journal.bloquees, r: journal.echecsReseau }));
await browser.close();
