// s2c (chaude) — l'attente occupée : le temps se choisit avant, se lit sur une jauge pendant, et les calculs déjà faits
// remplissent l'attente ; « Fermer, me notifier » est une action, pas une phrase.
import { icone as I } from '../outils/commun.mjs';

// Échelle de temps : racine carrée, pour que 15 s et 3:40 tiennent sur la même règle. Largeur utile 100 %.
const MAX = 220;
const x = (s) => (Math.sqrt(s / MAX) * 100).toFixed(1);

const css = `
.§-tete{display:flex;align-items:center;gap:8px;height:40px;padding:0 6px 0 12px;flex:none}
.§-tete b{font-size:16px;color:var(--t0)}
.§-tete span{flex:1;font-size:12px;color:var(--t2);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.§-bi{width:32px;height:32px;display:grid;place-items:center;border-radius:6px;color:var(--t1)}
.§-fil{flex:1;min-height:0;overflow:hidden;padding:4px 12px 10px;display:flex;flex-direction:column;gap:10px}
.§-pied{flex:none;padding:8px 10px 10px;border-top:1px solid var(--bd);display:flex;gap:6px;align-items:flex-end}
.§-champ{flex:1;min-height:40px;border:1px solid var(--bdm);border-radius:8px;background:var(--pn);padding:8px 10px;font-size:16px;color:var(--t2)}
.§-env{width:40px;height:40px;border-radius:8px;background:var(--su);color:var(--t2);display:grid;place-items:center}
.§-titre{font-size:18px;font-weight:700;color:var(--t0);margin:4px 0 0}
.§-tuiles{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.§-tuile{border:1px solid var(--bd);border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:2px;text-align:left;min-height:84px}
.§-tuile b{font-size:14px;color:var(--t0)}
.§-tuile .§-mono{font-size:16px;color:var(--t0);font-weight:600}
.§-tuile small{font-size:12px;color:var(--t2);line-height:1.25}
.§-tuile[aria-pressed=true]{border:2px solid var(--act);padding:7px;background:var(--pn)}
.§-tuile .§-ic{color:var(--t2)}
.§-regle{position:relative;height:40px;margin:0 4px}
.§-regle-p{position:absolute;left:0;right:0;top:12px;height:8px;border-radius:4px;background:var(--su)}
.§-bande{position:absolute;top:12px;height:8px;border-radius:4px}
.§-bande.§-auto{background:var(--hop)}
.§-bande.§-appro{background:var(--hop);opacity:.45}
.§-tick{position:absolute;top:24px;transform:translateX(-50%);font:12px var(--mono);color:var(--t2);white-space:nowrap}
.§-tick:first-of-type{transform:none}
.§-aig{position:absolute;top:2px;width:2px;height:28px;background:var(--t0);transform:translateX(-1px)}
.§-aig-l{position:absolute;top:-16px;transform:translateX(-50%);font:600 12px var(--mono);color:var(--t0)}
.§-sw{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--t1);min-height:36px;background:var(--pn);border-radius:8px;padding:4px 10px}
.§-sw span{flex:1}
.§-sw small{display:block;font-size:12px;color:var(--t2)}
.§-int{width:36px;height:22px;border-radius:11px;background:var(--bdm);position:relative;flex:none}
.§-int::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:8px;background:var(--pg)}
.§-int.§-on{background:var(--hop)}.§-int.§-on::after{left:17px}
.§-sugg{display:flex;flex-direction:column}
.§-sugg button{display:flex;align-items:center;gap:8px;min-height:36px;font-size:14px;color:var(--hoptx);text-align:left;border-bottom:1px solid var(--bd)}
.§-sugg button span{flex:1}
.§-sugg .§-mono{font-size:12px;color:var(--t2)}
.§-p{font-size:12px;color:var(--t2);margin:0}
.§-q{font-size:14px;color:var(--t1);background:var(--su);border-radius:8px;padding:6px 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.§-temps{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;margin-top:10px}
.§-temps .§-gros{font:600 28px/1 var(--mono);color:var(--t0)}
.§-temps small{display:block;font-size:12px;color:var(--t2);margin-top:2px}
.§-temps-d{text-align:right;font-size:14px;color:var(--t0)}
.§-fermer{display:flex;align-items:center;justify-content:center;gap:8px;height:40px;border-radius:8px;background:var(--act);color:var(--acttx);font-size:14px;font-weight:600}
.§-calc-h{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:700;color:var(--t0);margin:2px 0 -4px}
.§-calc-h span{flex:1}
.§-calc-h small{font-weight:400;font-size:12px;color:var(--t2)}
.§-calc{display:flex;flex-direction:column}
.§-c{display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:30px;border-bottom:1px solid var(--bd);font-size:14px;color:var(--t2)}
.§-c .§-mono{color:var(--t0);font-size:14px}
.§-c.§-neuf{animation:none}
.§-pile{display:flex;height:14px;border-radius:3px;overflow:hidden;gap:2px;margin:4px 0}
.§-pile i{display:flex;align-items:center;justify-content:center;font:600 10px var(--mono);color:#fff;font-style:normal}
.§-pile i:nth-child(1){background:var(--hop)}
.§-pile i:nth-child(2){background:var(--eau)}
.§-pile i:nth-child(3){background:var(--att)}
.§-pile-l{display:flex;gap:10px;font-size:12px;color:var(--t2)}
.§-pile-l span::before{content:"";display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px;vertical-align:0}
.§-pile-l span:nth-child(1)::before{background:var(--hop)}
.§-pile-l span:nth-child(2)::before{background:var(--eau)}
.§-pile-l span:nth-child(3)::before{background:var(--att)}
.§-encours{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--t1)}
.§-file{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--t2)}
.§-file b{color:var(--t1);font-weight:600}
.§-pret{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--hoptx);font-weight:600}
.§-pret .§-mono{font-weight:600}
.§-niv{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 8px;border-radius:11px;background:var(--attbg);color:var(--atttx);font-weight:700;font-size:12px}
.§-h2{font-size:18px;line-height:1.25;color:var(--t0);margin:0}
.§-geste{font-size:16px;font-weight:600;color:var(--t0)}
.§-impact{display:grid;grid-template-columns:44px 1fr 92px;gap:4px 8px;align-items:center;font-size:12px;color:var(--t2)}
.§-impact .§-mono{font-size:13px;color:var(--t0);text-align:right}
.§-impact .§-pile{margin:0}
.§-mod{display:grid;grid-template-columns:24px 1fr auto;gap:8px;align-items:center;min-height:32px;border-bottom:1px solid var(--bd);font-size:14px;color:var(--t0)}
.§-mod .§-mono{font-size:13px}
.§-mod s{color:var(--t2)}
.§-cb{width:20px;height:20px;border-radius:4px;background:var(--act);color:var(--acttx);display:grid;place-items:center}
.§-act{display:flex;justify-content:flex-end;gap:6px}
.§-bt2{height:32px;padding:0 10px;border:1px solid var(--bdm);border-radius:6px;font-size:13px;color:var(--t1);display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.§-prim{height:32px;padding:0 12px;border-radius:6px;background:var(--act);color:var(--acttx);font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.§-ctrl{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--t0)}
.§-ctrl span{flex:1}
.§-pli{display:flex;align-items:center;gap:6px;min-height:28px;font-size:14px;color:var(--t1);text-align:left}
.§-pli span{flex:1}
.§-arret{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:700;color:var(--t0);margin-top:6px}
.§-regle.§-vide .§-regle-p{background:none;border:1px dashed var(--bdm)}
.§-sw .§-int,.§-ligne .§-int{flex:none;width:36px}
`;

const tete = (sous) => `<header class="§-tete"><b>Compagnon</b><span>${sous}</span>
<button class="§-bi" aria-label="Mes conversations">${I('convs', 18)}</button><button class="§-bi" aria-label="Plus : limites, repartir à zéro">${I('more', 18)}</button></header>`;
const pied = (t = 'Décris ce que tu observes…') => `<footer class="§-pied"><div class="§-champ" role="textbox">${t}</div><button class="§-env" disabled aria-label="Envoyer">${I('send', 18)}</button></footer>`;

const regle = ({ aiguille = null, vide = false } = {}) => `<div class="§-regle${vide ? ' §-vide' : ''}" data-booster="jauge-temps"><span class="§-regle-p"></span>
${vide ? '' : `<span class="§-bande §-auto" style="left:${x(15)}%;width:${(x(30) - x(15)).toFixed(1)}%"></span><span class="§-bande §-appro" style="left:${x(60)}%;width:${(x(180) - x(60)).toFixed(1)}%"></span>`}
<span class="§-tick" style="left:0">0</span><span class="§-tick" style="left:${x(15)}%">15 s</span><span class="§-tick" style="left:${x(60)}%">1 min</span><span class="§-tick" style="left:auto;right:0;transform:none">3:40</span>
${aiguille !== null ? `<span class="§-aig" style="left:${x(aiguille)}%"></span>` : ''}</div>`;

const pile = (a, b, c) => `<div class="§-pile"><i style="flex:${a}">${a}</i><i style="flex:${b}">${b}</i><i style="flex:${c}">${c}</i></div>`;

const accueil = `${tete('Brassin 31 · fermentation J+4 · 19 °C')}<div class="§-fil">
<p class="§-titre">Combien de temps as-tu ?</p>
<div class="§-tuiles" role="group" aria-label="Mode" data-booster="mode-temps">
<button class="§-tuile" aria-pressed="false">${I('timer', 16)}<b>Rapide</b><span class="§-mono">le + court</span><small>lit et répond</small></button>
<button class="§-tuile" aria-pressed="true">${I('timer', 16)}<b>Auto</b><span class="§-mono">15–30 s</span><small>calcule, cherche si besoin</small></button>
<button class="§-tuile" aria-pressed="false">${I('timer', 16)}<b>Approfondi</b><span class="§-mono">1–3 min</span><small>sources, relu deux fois</small></button>
</div>
${regle()}
<div class="§-sw">${I('bell', 18)}<span>Je ferme et tu me préviens<small>la réponse reste dans ce fil</small></span><span class="§-int §-on" role="switch" aria-checked="true"></span></div>
<p class="§-p">À J+4, en fermentation</p>
<div class="§-sugg">
<button>${I('upRight', 14)}<span>La pression monte : je purge ?</span><span class="§-mono">Auto</span></button>
<button>${I('upRight', 14)}<span>Mon dry hop est-il trop chargé ?</span><span class="§-mono">Approfondi</span></button>
<button>${I('upRight', 14)}<span>DF 1,012 à J+4 : c'est fini ?</span><span class="§-mono">Rapide</span></button>
</div>
<div class="§-file">${I('convs', 14)}<span><b>Mes finances</b> · réponse prête · <b>Blonde de garde</b> · en cours <span class="§-mono">0:40</span></span></div>
</div>${pied()}`;

const attente = `${tete('Brassin 31 · New England IPA')}<div class="§-fil">
<div class="§-q">La fermentation est à 19 °C depuis 36 h et la pression monte…</div>
<div class="§-temps"><div><span class="§-gros">2:29</span><small>Approfondi · lancé à 22:04</small></div><div class="§-temps-d">fin attendue avant <span class="§-mono">3:00</span><small>au plus <span class="§-mono">3:40</span></small></div></div>
${regle({ aiguille: 149 })}
<button class="§-fermer">${I('bell', 18)}Fermer · me notifier à la réponse</button>
<div class="§-calc-h">${I('calc', 16)}<span>Déjà calculé</span><small>pendant que tu attends</small></div>
<div class="§-calc" data-booster="calculs-faits">
<div class="§-c"><span>Dry hop total</span><span class="§-mono">171 g · 19 L · 9,0 g/L</span></div>
<div>${pile(85, 43, 43)}<div class="§-pile-l"><span>Citra J+2</span><span>Galaxy J+6</span><span>Mosaic J+9</span></div></div>
<div class="§-c"><span>Fermentation</span><span class="§-mono">19 °C · 36 h · J+4</span></div>
<div class="§-c"><span>DF relevée</span><span class="§-mono">1,012</span></div>
<div class="§-c"><span>pH de maische visé</span><span class="§-mono">5,3</span></div>
</div>
<div class="§-encours">${I('loader', 14)}Je lis les sources : 2 lues, puis rédiger et relire deux fois.</div>
<div class="§-file">${I('clock', 14)}<span>En file : <b>Et combien de jours de garde à 18 °C ?</b></span></div>
</div>${pied('Ajoute une question…')}`;

const reponse = `${tete('Brassin 31 · New England IPA')}<div class="§-fil">
<div class="§-pret">${I('bell', 14)}Prête en <span class="§-mono">2:41</span> · relue deux fois · calculs refaits</div>
<div><span class="§-niv">${I('alert', 12)}Attention</span></div>
<h2 class="§-h2">Dry hop chargé : réduis le dernier apport.</h2>
<p class="§-geste">Passe Mosaic J+9 de <span class="§-mono">43 g</span> à <span class="§-mono">21 g</span>.</p>
<div class="§-impact" data-booster="avant-apres-pile">
<span>Avant</span>${pile(85, 43, 43)}<span class="§-mono">171 g · 9,0</span>
<span>Après</span>${pile(70, 43, 21)}<span class="§-mono">134 g · 7,1</span>
<span></span><span class="§-pile-l"><span>Citra</span><span>Galaxy</span><span>Mosaic</span></span><span class="§-mono" style="font-size:12px;color:var(--t2)">g/L</span>
</div>
<div>
<div class="§-mod"><span class="§-cb" role="checkbox" aria-checked="true">${I('check', 14)}</span><span>Citra · dry hop J+2</span><span class="§-mono"><s>85</s> → 70 g</span></div>
<div class="§-mod"><span class="§-cb" role="checkbox" aria-checked="true">${I('check', 14)}</span><span>Mosaic · dry hop J+9</span><span class="§-mono"><s>43</s> → 21 g</span></div>
<div class="§-mod"><span class="§-cb" role="checkbox" aria-checked="true">${I('check', 14)}</span><span>Durée du dry hop</span><span class="§-mono"><s>2</s> → 3 j</span></div>
</div>
<div class="§-act"><button class="§-bt2">Écarter</button><button class="§-prim">${I('check', 14)}Valider 3 modifications</button></div>
<div class="§-ctrl">${I('flag', 16)}<span>J+9 : goût et odeur à la purge, note si l'herbacé apparaît.</span><button class="§-bt2">Au journal</button></div>
<button class="§-pli"><span>Pourquoi, calculs et sources</span>${I('down', 16)}</button>
</div>${pied()}`;

const erreur = `${tete('Brassin 31 · New England IPA')}<div class="§-fil">
<div class="§-q">Et combien de jours de garde à 18 °C ?</div>
<div class="§-arret">${I('wifiOff', 20)}Pas de réseau : ta question attend ici.</div>
${regle({ vide: true })}
<p class="§-p">Le temps ne compte pas encore. Rien n'est parti, rien n'est compté sur le budget.</p>
<div class="§-act" style="justify-content:flex-start"><button class="§-prim" data-booster="envoi-a-confirmer">${I('send', 14)}Envoyer au retour du réseau</button><button class="§-bt2">${I('pen', 14)}Reformuler</button></div>
<div class="§-calc-h">${I('phone', 16)}<span>Calculé sur ce téléphone</span><small>sans relecture</small></div>
<div class="§-calc">
<div class="§-c"><span>Fermentation</span><span class="§-mono">19 °C · J+4</span></div>
<div class="§-c"><span>Dry hop après tes changements</span><span class="§-mono">134 g · 7,1 g/L</span></div>
<div>${pile(70, 43, 21)}<div class="§-pile-l"><span>Citra J+2</span><span>Galaxy J+6</span><span>Mosaic J+9</span></div></div>
<div class="§-c"><span>Prochain geste</span><span class="§-mono">Galaxy 43 g · lun. 16.11</span></div>
</div>
<div class="§-sw">${I('bell', 18)}<span>Me notifier quand elle part<small>puis à la réponse</small></span><span class="§-int §-on" role="switch" aria-checked="true"></span></div>
</div>${pied('Ajoute une question…')}`;

export default {
  titre: 'l\'attente occupée (chaude)',
  sous: 'Série s2 « le geste et le temps » · le temps se choisit, se lit sur une jauge, et l\'attente montre ce qui est déjà calculé',
  css,
  cadres: [
    { cadre: 'accueil', lib: 'Accueil', aide: 'choisir son temps, J+4', html: accueil },
    { cadre: 'attente', lib: 'Attente', aide: '2:29 sur la jauge, calculs déjà faits', html: attente },
    { cadre: 'reponse', lib: 'Réponse', aide: 'les calculs vus deviennent l\'impact', html: reponse },
    { cadre: 'erreur', lib: 'Erreur', aide: 'hors ligne, envoi à confirmer', html: erreur },
  ],
};
