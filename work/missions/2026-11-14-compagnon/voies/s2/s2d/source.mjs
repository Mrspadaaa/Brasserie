// s2d (chaude, forme libre) — la conversation posée sur la frise du brassin : chaque question, chaque geste et le prochain
// contrôle prennent leur jour ; les doses sont des barres, la proposition se lit sur la frise avant d'être validée.
import { icone as I } from '../outils/commun.mjs';

const J = 12; // frise J+0 à J+12
const X = (j) => `${((j / J) * 100).toFixed(2)}%`;
const H = (g) => Math.round((g / 85) * 54); // 85 g = 54 px

const css = `
.§-tete{display:flex;align-items:center;gap:8px;height:36px;padding:0 6px 0 12px;flex:none}
.§-tete b{font-size:16px;color:var(--t0)}
.§-tete span{flex:1;font-size:12px;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.§-bi{width:32px;height:32px;display:grid;place-items:center;border-radius:6px;color:var(--t1)}
.§-frise{flex:none;position:relative;height:128px;margin:0 16px 0 14px;border-bottom:1px solid var(--bd)}
.§-passe{position:absolute;left:0;top:8px;bottom:22px;background:var(--pn);border-radius:4px}
.§-axe{position:absolute;left:0;right:0;bottom:22px;height:1px;background:var(--bdm)}
.§-j{position:absolute;bottom:4px;transform:translateX(-50%);font:12px var(--mono);color:var(--t2)}
.§-j.§-fort{color:var(--t0);font-weight:600}
.§-dh{position:absolute;bottom:22px;width:14px;transform:translateX(-50%);border-radius:3px 3px 0 0;background:var(--hop)}
.§-dh.§-fantome{background:none;border:1.5px dashed var(--hop);border-bottom:0}
.§-dh.§-gris{background:var(--bdm)}
.§-dh-l{position:absolute;transform:translateX(-50%);font:600 12px var(--mono);color:var(--t0);white-space:nowrap}
.§-dh-n{position:absolute;transform:translateX(-50%);font-size:12px;color:var(--t2);white-space:nowrap}
.§-contact{position:absolute;bottom:25px;height:4px;border-radius:2px;background:var(--hop);opacity:.4}
.§-contact.§-plus{opacity:1;background:none;border-top:2px dashed var(--att);height:0}
.§-auj{position:absolute;top:2px;bottom:18px;width:2px;background:var(--t0);transform:translateX(-1px)}
.§-auj-l{position:absolute;top:0;transform:translateX(6px);font-size:12px;font-weight:700;color:var(--t0);white-space:nowrap}
.§-pin{position:absolute;transform:translate(-50%,0);width:24px;height:24px;border-radius:12px;display:grid;place-items:center;background:var(--act);color:var(--acttx)}
.§-pin.§-file{background:var(--pg);color:var(--t1);border:1.5px dashed var(--bdm)}
.§-pin.§-ctrl{background:var(--eau);color:#fff}
.§-pin.§-hors{background:var(--pg);color:var(--t0);border:1.5px solid var(--t0)}
.§-fen{position:absolute;bottom:40px;height:22px;border:1.5px solid var(--hop);border-bottom:0;border-radius:6px 6px 0 0}
.§-fen-l{position:absolute;bottom:44px;transform:translateX(-50%);font-size:12px;font-weight:600;color:var(--hoptx);white-space:nowrap}
.§-fil{flex:1;min-height:0;overflow:hidden;padding:10px 12px;display:flex;flex-direction:column;gap:10px}
.§-pied{flex:none;padding:8px 10px 10px;border-top:1px solid var(--bd);display:flex;gap:6px;align-items:center}
.§-champ{flex:1;min-height:40px;display:flex;align-items:center;gap:6px;border:1px solid var(--bdm);border-radius:8px;background:var(--pn);padding:0 4px 0 10px}
.§-champ span{flex:1;font-size:16px;color:var(--t2)}
.§-mode{height:28px;padding:0 8px;border-radius:6px;border:1px solid var(--bd);background:var(--pg);font-size:12px;color:var(--t1);display:inline-flex;align-items:center;gap:3px;white-space:nowrap}
.§-env{width:40px;height:40px;border-radius:8px;background:var(--su);color:var(--t2);display:grid;place-items:center}
.§-grand{font-size:18px;font-weight:700;color:var(--t0);line-height:1.25;margin:0}
.§-grand .§-mono{font-size:17px}
.§-sous{font-size:14px;color:var(--t2);margin:-6px 0 0}
.§-ancres{display:flex;flex-direction:column}
.§-ancre{display:grid;grid-template-columns:42px 1fr 16px;gap:8px;align-items:center;min-height:38px;border-bottom:1px solid var(--bd);font-size:14px;color:var(--t0);text-align:left}
.§-tag{font:600 12px var(--mono);color:var(--t1);background:var(--pn);border-radius:4px;padding:2px 0;text-align:center}
.§-tag.§-now{background:var(--act);color:var(--acttx)}
.§-ancre .§-ic{color:var(--t2)}
.§-q{font-size:14px;color:var(--t1);background:var(--su);border-radius:8px;padding:6px 10px}
.§-prog{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--t1)}
.§-prog .§-mono{font-size:16px;font-weight:600;color:var(--t0)}
.§-prog span.§-f{flex:1}
.§-barre{height:4px;border-radius:2px;background:var(--su);position:relative}
.§-barre i{position:absolute;left:0;top:0;bottom:0;border-radius:2px;background:var(--hop)}
.§-pts{display:flex;justify-content:space-between;font-size:12px;color:var(--t2)}
.§-pts .§-ok{color:var(--hoptx)}
.§-pts .§-c{color:var(--t0);font-weight:600}
.§-ligne{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--t1);min-height:32px}
.§-ligne span{flex:1}
.§-ligne small{display:block;font-size:12px;color:var(--t2)}
.§-int{width:36px;height:22px;border-radius:11px;background:var(--hop);position:relative;flex:none}
.§-int::after{content:"";position:absolute;top:3px;left:17px;width:16px;height:16px;border-radius:8px;background:var(--pg)}
.§-niv{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 8px;border-radius:11px;background:var(--attbg);color:var(--atttx);font-weight:700;font-size:12px;align-self:flex-start}
.§-mod{display:grid;grid-template-columns:24px 42px 1fr auto;gap:8px;align-items:center;min-height:34px;border-bottom:1px solid var(--bd);font-size:14px;color:var(--t0)}
.§-mod .§-mono{font-size:13px}
.§-mod s{color:var(--t2)}
.§-mod small{display:block;font-size:12px;color:var(--t2)}
.§-cb{width:20px;height:20px;border-radius:4px;background:var(--act);color:var(--acttx);display:grid;place-items:center}
.§-act{display:flex;justify-content:flex-end;gap:6px}
.§-bt2{height:32px;padding:0 10px;border:1px solid var(--bdm);border-radius:6px;font-size:13px;color:var(--t1);display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.§-prim{height:32px;padding:0 12px;border-radius:6px;background:var(--act);color:var(--acttx);font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.§-pli{display:flex;align-items:center;gap:6px;min-height:28px;font-size:14px;color:var(--t1);text-align:left}
.§-pli span{flex:1}
.§-sw .§-int,.§-ligne .§-int{flex:none;width:36px}
`;

const tete = (s) => `<header class="§-tete"><b>Compagnon</b><span>${s}</span><button class="§-bi" aria-label="Mes conversations">${I('convs', 18)}</button><button class="§-bi" aria-label="Plus : limites, repartir à zéro">${I('more', 18)}</button></header>`;
const pied = (t = 'Ce que tu observes à J+4…', m = 'Auto') => `<footer class="§-pied"><div class="§-champ"><span>${t}</span><button class="§-mode">${m}${I('down', 12)}</button></div><button class="§-env" disabled aria-label="Envoyer">${I('send', 18)}</button></footer>`;

const barre = (j, g, nom, cls = '', label = true) => `<span class="§-dh ${cls}" style="left:${X(j)};height:${H(g)}px"></span>${label ? `<span class="§-dh-l" style="left:${X(j)};bottom:${H(g) + 24}px">${g}</span>` : ''}`;
const jours = (forts = []) => [0, 2, 4, 6, 9, 12].map((j) => `<span class="§-j${forts.includes(j) ? ' §-fort' : ''}" style="left:${X(j)}">J+${j}</span>`).join('');

// Frise de base : passé grisé, trois apports, aujourd'hui.
const frise = (extra = '', opts = {}) => `<div class="§-frise" data-booster="frise-brassin" aria-label="Frise du brassin 31, J+0 à J+12">
<span class="§-passe" style="width:${X(4)}"></span><span class="§-axe"></span>${jours([4])}
${opts.citra ?? barre(2, 85, 'Citra', '§-gris')}<span class="§-contact" style="left:${X(2)};width:${X(2)}"></span>
${barre(6, 43, 'Galaxy')}<span class="§-contact" style="left:${X(6)};width:${X(2)}"></span>
${opts.mosaic ?? barre(9, 43, 'Mosaic')}${opts.contact9 ?? `<span class="§-contact" style="left:${X(9)};width:${X(2)}"></span>`}
<span class="§-auj" style="left:${X(4)}"></span><span class="§-auj-l" style="left:${X(4)}">auj. · 19 °C</span>${extra}</div>`;

const accueil = `${tete('Brassin 31 · New England IPA')}${frise(`<span class="§-dh-n" style="left:${X(2)};bottom:2px;display:none"></span>`)}
<div class="§-fil">
<p class="§-grand">Prochain geste dans <span class="§-mono">2 j</span> : Galaxy <span class="§-mono">43 g</span>.</p>
<p class="§-sous">Dry hop <span class="§-mono">171 g</span> en trois apports · <span class="§-mono">9,0 g/L</span></p>
<div class="§-ancres" data-booster="questions-ancrees">
<button class="§-ancre"><span class="§-tag §-now">J+4</span><span>La pression monte : je purge ?</span>${I('upRight', 14)}</button>
<button class="§-ancre"><span class="§-tag">J+4</span><span>DF 1,012 : la levure a fini ?</span>${I('upRight', 14)}</button>
<button class="§-ancre"><span class="§-tag">J+6</span><span>Galaxy : je garde 43 g ?</span>${I('upRight', 14)}</button>
<button class="§-ancre"><span class="§-tag">J+9</span><span>Mosaic : quelle dose pour finir ?</span>${I('upRight', 14)}</button>
<button class="§-ancre"><span class="§-tag">J+12</span><span>Combien de jours de garde ?</span>${I('upRight', 14)}</button>
</div>
<div class="§-ligne">${I('bell', 18)}<span>Me notifier à la réponse<small>tu peux fermer pendant que je cherche</small></span><span class="§-int" role="switch" aria-checked="true"></span></div>
</div>${pied()}`;

const attente = `${tete('Brassin 31 · New England IPA')}${frise(`<span class="§-fen" style="left:${X(4)};width:${X(2)}"></span><span class="§-fen-l" style="left:${X(5)}">2 j de marge</span>
<span class="§-pin" style="left:${X(4)};bottom:86px">${I('msg', 13)}</span><span class="§-pin §-file" style="left:${X(12)};bottom:30px">${I('clock', 13)}</span>`)}
<div class="§-fil">
<p class="§-grand">Rien à faire avant J+6 : la réponse a le temps.</p>
<div class="§-q">La fermentation est à 19 °C depuis 36 h et la pression monte doucement : que faire ?</div>
<div class="§-prog">${I('hourglass', 16)}<span class="§-mono">2:29</span><span class="§-f">Approfondi · <span class="§-mono">1 à 3 min</span>, au plus <span class="§-mono">3:40</span></span></div>
<div class="§-barre" data-booster="jauge-duree"><i style="width:68%"></i></div>
<div class="§-pts"><span class="§-ok">brassin lu</span><span class="§-ok">calculé</span><span class="§-c">sources · 2</span><span>rédiger</span><span>relire ×2</span></div>
<div class="§-ligne">${I('clock', 18)}<span>Et combien de jours de garde à 18 °C ?<small>en file · posée sur J+12</small></span><button class="§-bi" aria-label="Retirer">${I('x', 16)}</button></div>
<div class="§-ligne">${I('bell', 18)}<span>Tu peux continuer ailleurs<small>notifié à la réponse, elle reste dans ce fil</small></span><span class="§-int" role="switch" aria-checked="true"></span></div>
</div>${pied('Ajoute une question…', 'Approfondi')}`;

const fant = (j, g) => `<span class="§-dh §-fantome" style="left:${X(j)};height:${H(g)}px"></span>`;
const reponse = `${tete('Brassin 31 · relu deux fois · 2:41')}${frise(`<span class="§-pin §-ctrl" style="left:${X(9)};bottom:84px">${I('flag', 13)}</span>`, {
  citra: `${fant(2, 85)}${barre(2, 70, 'Citra', '§-gris')}`,
  mosaic: `${fant(9, 43)}<span class="§-dh" style="left:${X(9)};height:${H(21)}px;background:var(--att)"></span><span class="§-dh-l" style="left:${X(9)};bottom:${H(43) + 24}px">43→21</span>`,
  contact9: `<span class="§-contact" style="left:${X(9)};width:${X(2)}"></span><span class="§-contact §-plus" style="left:${X(11)};width:${X(1)}"></span>`,
})}
<div class="§-fil">
<span class="§-niv">${I('alert', 12)}Attention</span>
<p class="§-grand">Dry hop chargé : réduis le dernier apport.</p>
<p class="§-sous" style="margin:-4px 0 0;color:var(--t0);font-size:16px;font-weight:600">Passe Mosaic J+9 de <span class="§-mono">43 g</span> à <span class="§-mono">21 g</span>.</p>
<div data-booster="proposition-frise">
<div class="§-mod"><span class="§-cb" role="checkbox" aria-checked="true">${I('check', 14)}</span><span class="§-tag">J+9</span><span>Mosaic</span><span class="§-mono"><s>43</s> → 21 g</span></div>
<div class="§-mod"><span class="§-cb" role="checkbox" aria-checked="true">${I('check', 14)}</span><span class="§-tag">J+9</span><span>Contact du dry hop</span><span class="§-mono"><s>2</s> → 3 j</span></div>
<div class="§-mod"><span class="§-cb" role="checkbox" aria-checked="true">${I('check', 14)}</span><span class="§-tag">J+2</span><span>Citra<small>pour la recette : déjà ajouté ici</small></span><span class="§-mono"><s>85</s> → 70 g</span></div>
</div>
<div class="§-act"><button class="§-bt2">Écarter</button><button class="§-prim">${I('check', 14)}Valider 3 modifications</button></div>
<div class="§-ligne">${I('flag', 18)}<span>J+9 · goût et odeur à la purge<small>note si l'herbacé apparaît</small></span><button class="§-bt2">Au journal</button></div>
<button class="§-pli"><span>Pourquoi · <span class="§-mono">9,0 → 7,1 g/L</span>, calculs et sources</span>${I('down', 16)}</button>
</div>${pied()}`;

const erreur = `${tete('Brassin 31 · hors ligne')}${frise(`<span class="§-fen" style="left:${X(4)};width:${X(2)}"></span><span class="§-fen-l" style="left:${X(5)}">2 j de marge</span><span class="§-pin §-hors" style="left:${X(4)};bottom:86px">${I('wifiOff', 13)}</span>`)}
<div class="§-fil">
<p class="§-grand">Pas de réseau. Rien d'urgent avant J+6 : ta question peut attendre.</p>
<div class="§-q">Et combien de jours de garde à 18 °C ?</div>
<div class="§-ligne">${I('phone', 18)}<span>Gardée sur ce téléphone · 22:51<small>rien n'est parti, rien n'est compté</small></span></div>
<div class="§-act" style="justify-content:flex-start" data-booster="envoi-a-confirmer"><button class="§-prim">${I('send', 14)}Envoyer au retour du réseau</button><button class="§-bt2">${I('pen', 14)}Reformuler</button></div>
<div class="§-ligne">${I('bell', 18)}<span>Me notifier quand elle part<small>puis à la réponse</small></span><span class="§-int" role="switch" aria-checked="true"></span></div>
<div class="§-ligne">${I('flag', 18)}<span>Toujours prévu : J+9, goût et odeur à la purge<small>dans le journal, lisible hors ligne</small></span></div>
</div>${pied('Ajoute une question…')}`;

export default {
  titre: 'la conversation sur la frise du brassin (chaude)',
  sous: 'Série s2 « le geste et le temps » · questions, doses et contrôles prennent leur jour ; la marge avant le prochain geste dit si l\'attente compte',
  css,
  cadres: [
    { cadre: 'accueil', lib: 'Accueil', aide: 'la frise J+0 à J+12, questions ancrées', html: accueil },
    { cadre: 'attente', lib: 'Attente', aide: '2:29, 2 j de marge avant Galaxy', html: attente },
    { cadre: 'reponse', lib: 'Réponse', aide: 'la proposition dessinée sur la frise', html: reponse },
    { cadre: 'erreur', lib: 'Erreur', aide: 'hors ligne, envoi à confirmer', html: erreur },
  ],
};
