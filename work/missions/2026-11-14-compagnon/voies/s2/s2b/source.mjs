// s2b (tiède) — la réponse devient une liste de gestes à cocher (geste, dose, moment) ; le prochain contrôle devient un
// rappel daté ; la proposition se valide case par case.
import { icone as I } from '../outils/commun.mjs';

const css = `
.§-tete{display:flex;align-items:center;gap:10px;padding:6px 6px 6px 12px;flex:none;border-bottom:1px solid var(--bd)}
.§-jour{display:flex;flex-direction:column;align-items:center;justify-content:center;width:52px;height:40px;border-radius:6px;background:var(--hopbg);color:var(--hoptx);line-height:1.05}
.§-jour b{font:700 16px var(--mono)}
.§-jour span{font-size:12px}
.§-tete-tx{flex:1;min-width:0;line-height:1.2}
.§-tete-tx b{display:block;font-size:16px;color:var(--t0)}
.§-tete-tx span{font-size:12px;color:var(--t2)}
.§-bi{width:32px;height:32px;display:grid;place-items:center;border-radius:6px;color:var(--t1)}
.§-fil{flex:1;min-height:0;overflow:hidden;padding:10px 12px;display:flex;flex-direction:column;gap:10px}
.§-pied{flex:none;border-top:1px solid var(--bd);padding:8px 10px 10px;display:flex;gap:6px;align-items:center}
.§-champ{flex:1;display:flex;align-items:center;gap:6px;min-height:40px;border:1px solid var(--bdm);border-radius:20px;background:var(--pn);padding:0 4px 0 12px}
.§-champ span{flex:1;font-size:16px;color:var(--t2)}
.§-mode{display:inline-flex;align-items:center;gap:3px;height:28px;padding:0 8px;border-radius:14px;background:var(--pg);border:1px solid var(--bd);font-size:12px;color:var(--t1);white-space:nowrap}
.§-env{width:40px;height:40px;border-radius:20px;background:var(--act);color:var(--acttx);display:grid;place-items:center}
.§-env[disabled]{background:var(--su);color:var(--t2)}
.§-h{font-size:12px;color:var(--t2);display:flex;justify-content:space-between;align-items:baseline;margin:0}
.§-h b{font-size:14px;color:var(--t0)}
.§-liste{display:flex;flex-direction:column;border-top:1px solid var(--bd)}
.§-g{display:grid;grid-template-columns:44px 24px 1fr auto;gap:8px;align-items:center;min-height:44px;border-bottom:1px solid var(--bd);padding:4px 0}
.§-d{font:12px/1.15 var(--mono);color:var(--t2);text-align:left}
.§-d b{display:block;font-size:13px;color:var(--t0)}
.§-g.§-auj .§-d b{color:var(--hoptx)}
.§-cb{width:22px;height:22px;border-radius:5px;border:2px solid var(--bdm);display:grid;place-items:center;color:transparent;background:var(--pg)}
.§-cb.§-oui{background:var(--act);border-color:var(--act);color:var(--acttx)}
.§-cb.§-fait{background:var(--hop);border-color:var(--hop);color:#fff}
.§-gt{font-size:14px;color:var(--t0);line-height:1.25;min-width:0}
.§-gt small{display:block;font-size:12px;color:var(--t2)}
.§-g.§-passe .§-gt{color:var(--t2)}
.§-dem{height:28px;padding:0 8px;border-radius:14px;border:1px solid var(--hop);color:var(--hoptx);font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
.§-sw{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--t1);min-height:36px}
.§-sw span{flex:1}
.§-sw small{display:block;font-size:12px;color:var(--t2)}
.§-int{width:36px;height:22px;border-radius:11px;background:var(--bdm);position:relative;flex:none}
.§-int::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:8px;background:var(--pg)}
.§-int.§-on{background:var(--hop)}
.§-int.§-on::after{left:17px}
.§-q{align-self:flex-end;max-width:84%;background:var(--su);color:var(--t0);border-radius:10px 10px 2px 10px;padding:7px 10px;font-size:14px;line-height:1.35}
.§-q.§-court{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.§-prep{display:flex;flex-direction:column;gap:6px}
.§-prep-h{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--t0);font-weight:600}
.§-prep-h span{flex:1}
.§-prep-h .§-mono{font-size:16px}
.§-barre{height:4px;border-radius:2px;background:var(--su);position:relative;overflow:hidden}
.§-barre i{position:absolute;left:0;top:0;bottom:0;background:var(--hop)}
.§-etapes{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:12px;color:var(--t2)}
.§-etapes span{display:inline-flex;align-items:center;gap:3px}
.§-etapes .§-ok{color:var(--hoptx)}
.§-etapes .§-cours{color:var(--t0);font-weight:600}
.§-sq{display:block;height:10px;border-radius:5px;background:var(--su)}
.§-g.§-squel .§-cb{border-style:dashed}
.§-file{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--t1);border:1px dashed var(--bdm);border-radius:8px;padding:6px 6px 6px 10px}
.§-file span{flex:1}
.§-file small{display:block;font-size:12px;color:var(--t2)}
.§-verdict{display:flex;flex-direction:column;gap:4px}
.§-niv{align-self:flex-start;display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 8px;border-radius:11px;background:var(--attbg);color:var(--atttx);font-weight:700;font-size:12px}
.§-verdict h2{font-size:18px;line-height:1.25;color:var(--t0);margin:0}
.§-dose{font:13px var(--mono);color:var(--t0);text-align:right;white-space:nowrap}
.§-dose s{color:var(--t2)}
.§-g.§-princ{background:var(--attbg);margin:0 -12px;padding:4px 12px;border-bottom-color:transparent}
.§-g.§-princ .§-gt{font-weight:700}
.§-note{font-size:12px;color:var(--atttx)}
.§-rappel{display:grid;grid-template-columns:44px 1fr auto;gap:8px;align-items:center;border:1px solid var(--eau);border-radius:8px;padding:8px 10px 8px 6px;background:var(--eaubg)}
.§-rappel-d{display:flex;flex-direction:column;align-items:center;color:var(--eautx);line-height:1.1}
.§-rappel-d b{font:700 18px var(--mono)}
.§-rappel-d span{font-size:12px}
.§-rappel-t{font-size:14px;color:var(--t0);line-height:1.3}
.§-rappel-t small{display:block;font-size:12px;color:var(--eautx);font-weight:600}
.§-pli{display:flex;align-items:center;gap:6px;min-height:28px;font-size:14px;color:var(--t1);text-align:left;border-bottom:1px solid var(--bd)}
.§-pli span{flex:1}
.§-pli b{color:var(--t0)}
.§-barre-act{display:flex;gap:6px;align-items:center}
.§-barre-act span{flex:1;font-size:12px;color:var(--t2)}
.§-bt2{height:32px;padding:0 10px;border:1px solid var(--bdm);border-radius:6px;font-size:13px;color:var(--t1);display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.§-prim{height:32px;padding:0 12px;border-radius:6px;background:var(--act);color:var(--acttx);font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.§-hors{display:flex;align-items:center;gap:8px;background:var(--pn);border-radius:8px;padding:8px 10px;font-size:14px;color:var(--t0)}
.§-hors small{display:block;font-size:12px;color:var(--t2)}
.§-att{border:1px solid var(--bdm);border-radius:8px;padding:8px 10px;display:flex;flex-direction:column;gap:6px}
.§-att p{margin:0;font-size:14px;color:var(--t1)}
.§-att .§-q{align-self:stretch;max-width:none;border-radius:8px}
.§-sw .§-int,.§-ligne .§-int{flex:none;width:36px}
`;

const tete = (sous = 'Brassin 31 · New England IPA · 19 °C') => `<header class="§-tete"><div class="§-jour"><b>J+4</b><span>sam.</span></div>
<div class="§-tete-tx"><b>Compagnon</b><span>${sous}</span></div>
<button class="§-bi" aria-label="Mes conversations">${I('convs', 18)}</button><button class="§-bi" aria-label="Plus : limites, repartir à zéro">${I('more', 18)}</button></header>`;

const pied = (txt = 'Décris ce que tu observes…', mode = 'Auto') => `<footer class="§-pied"><div class="§-champ"><span>${txt}</span>
<button class="§-mode" aria-label="Mode : ${mode}">${mode}${I('down', 12)}</button></div><button class="§-env" disabled aria-label="Envoyer">${I('send', 18)}</button></footer>`;

const cb = (etat = '') => `<span class="§-cb ${etat}" role="checkbox" aria-checked="${etat ? 'true' : 'false'}">${I('check', 14)}</span>`;

const accueil = `${tete()}<div class="§-fil">
<p class="§-h"><b>Gestes du brassin 31</b><span>demande sur un geste</span></p>
<div class="§-liste" data-booster="liste-gestes">
<div class="§-g §-passe"><span class="§-d"><b>J+2</b>jeu. 12</span>${cb('§-fait')}<span class="§-gt">Dry hop Citra <span class="§-mono">85 g</span><small>fait</small></span><span></span></div>
<div class="§-g §-passe"><span class="§-d"><b>J+4</b>auj.</span>${cb('§-fait')}<span class="§-gt">Relever la densité<small>DF <span class="§-mono">1,012</span> notée</small></span><button class="§-dem">${I('msg', 12)}Fini ?</button></div>
<div class="§-g §-auj"><span class="§-d"><b>J+4</b>auj.</span>${cb()}<span class="§-gt">Contrôler la pression<small>elle monte doucement</small></span><button class="§-dem">${I('msg', 12)}Je purge ?</button></div>
<div class="§-g"><span class="§-d"><b>J+6</b>lun. 16</span>${cb()}<span class="§-gt">Dry hop Galaxy <span class="§-mono">43 g</span></span><button class="§-dem">${I('msg', 12)}La dose ?</button></div>
<div class="§-g"><span class="§-d"><b>J+9</b>jeu. 19</span>${cb()}<span class="§-gt">Dry hop Mosaic <span class="§-mono">43 g</span><small>total <span class="§-mono">171 g · 9,0 g/L</span></small></span><button class="§-dem">${I('msg', 12)}La dose ?</button></div>
</div>
<div class="§-sw" data-booster="rappel">${I('calClock', 18)}<span>Rappel la veille de chaque dry hop<small>dim. 15.11 et mer. 18.11 à 08:00</small></span><span class="§-int §-on" role="switch" aria-checked="true"></span></div>
<div class="§-sw">${I('bell', 18)}<span>Me notifier à la réponse<small>tu peux fermer pendant que je cherche</small></span><span class="§-int §-on" role="switch" aria-checked="true"></span></div>
</div>${pied()}`;

const attente = `${tete()}<div class="§-fil">
<div class="§-q">La fermentation est à 19 °C depuis 36 h et la pression monte doucement : que faire ?</div>
<div class="§-prep">
<div class="§-prep-h">${I('listChecks', 18)}<span>Je prépare tes gestes</span><span class="§-mono">2:29</span></div>
<div class="§-barre"><i style="width:68%"></i></div>
<div class="§-etapes"><span class="§-ok">${I('check', 12)}brassin lu</span><span class="§-ok">${I('check', 12)}calculs faits</span><span class="§-cours">${I('search', 12)}sources : 2 lues</span><span>rédiger</span><span>relire deux fois</span></div>
<p class="§-h"><span>Approfondi · <span class="§-mono">1 à 3 min</span> d'habitude, au plus <span class="§-mono">3:40</span></span></p>
</div>
<div class="§-liste" aria-label="Gestes en préparation">
<div class="§-g §-squel"><span class="§-d"><span class="§-sq" style="width:30px"></span></span>${cb()}<span class="§-gt"><span class="§-sq" style="width:80%"></span></span><span class="§-sq" style="width:52px"></span></div>
<div class="§-g §-squel"><span class="§-d"><span class="§-sq" style="width:30px"></span></span>${cb()}<span class="§-gt"><span class="§-sq" style="width:64%"></span></span><span class="§-sq" style="width:52px"></span></div>
<div class="§-g §-squel"><span class="§-d"><span class="§-sq" style="width:30px"></span></span>${cb()}<span class="§-gt"><span class="§-sq" style="width:72%"></span></span><span class="§-sq" style="width:52px"></span></div>
</div>
<div class="§-rappel" style="opacity:.55"><span class="§-rappel-d">${I('calClock', 20)}</span><span class="§-rappel-t"><small>Rappel daté</small>Le prochain contrôle arrivera ici, avec sa date.</span><span></span></div>
<div class="§-file">${I('clock', 16)}<span>Et combien de jours de garde à 18 °C ?<small>En file · partira après celle-ci</small></span><button class="§-bi" aria-label="Retirer">${I('x', 16)}</button></div>
<div class="§-sw">${I('bell', 18)}<span>Tu peux continuer ailleurs<small>je te notifie, la réponse reste dans ce fil</small></span><span class="§-int §-on" role="switch" aria-checked="true"></span></div>
</div>${pied('Ajoute une question…', 'Approfondi')}`;

const reponse = `${tete()}<div class="§-fil">
<div class="§-q §-court">La fermentation est à 19 °C depuis 36 h et la pression…</div>
<div class="§-verdict"><span class="§-niv">${I('alert', 12)}Attention</span><h2>Dry hop chargé : réduis le dernier apport.</h2></div>
<p class="§-h"><b>3 gestes · coche ce que tu fais</b><span><span class="§-mono">2</span> sur <span class="§-mono">3</span></span></p>
<div class="§-liste" data-booster="gestes-a-cocher">
<div class="§-g §-princ"><span class="§-d"><b>J+9</b>jeu. 19</span>${cb('§-oui')}<span class="§-gt">Réduis Mosaic</span><span class="§-dose"><s>43</s> → 21 g</span></div>
<div class="§-g"><span class="§-d"><b>J+9</b>→ J+12</span>${cb('§-oui')}<span class="§-gt">Laisse le dry hop 3 jours</span><span class="§-dose"><s>2</s> → 3 j</span></div>
<div class="§-g §-passe"><span class="§-d"><b>J+2</b>passé</span>${cb()}<span class="§-gt">Citra, pour la recette<small class="§-note">déjà ajouté sur ce brassin</small></span><span class="§-dose"><s>85</s> → 70 g</span></div>
</div>
<div class="§-rappel" data-booster="rappel-date"><span class="§-rappel-d"><b>19</b><span>nov. · jeu.</span></span><span class="§-rappel-t"><small>Rappel · 09:00 · à la purge</small>Goût et odeur : note si l'herbacé apparaît.</span><span class="§-int §-on" role="switch" aria-checked="true" aria-label="Rappel actif"></span></div>
<button class="§-pli"><span><b>Pourquoi</b> · <span class="§-mono">171 g</span> pour <span class="§-mono">19 L</span> = <span class="§-mono">9,0 g/L</span></span>${I('down', 16)}</button>
<button class="§-pli"><span>Conseil relu deux fois · calculs refaits</span>${I('down', 16)}</button>
<div class="§-barre-act"><span>Rien ne change sans ta validation.</span><button class="§-bt2">Écarter</button><button class="§-prim">${I('check', 14)}Valider 2 gestes</button></div>
</div>${pied()}`;

const erreur = `${tete()}<div class="§-fil">
<div class="§-hors">${I('wifiOff', 18)}<span>Hors ligne<small>tes gestes et ton rappel restent sur ce téléphone</small></span></div>
<p class="§-h"><b>Gestes validés · 22:07</b><span>toujours là</span></p>
<div class="§-liste">
<div class="§-g"><span class="§-d"><b>J+9</b>jeu. 19</span>${cb('§-oui')}<span class="§-gt">Réduis Mosaic</span><span class="§-dose">21 g</span></div>
<div class="§-g"><span class="§-d"><b>J+9</b>→ J+12</span>${cb('§-oui')}<span class="§-gt">Dry hop 3 jours</span><span class="§-dose">3 j</span></div>
</div>
<div class="§-rappel"><span class="§-rappel-d"><b>19</b><span>nov. · jeu.</span></span><span class="§-rappel-t"><small>Rappel · 09:00 · gardé sur l'appareil</small>Goût et odeur à la purge.</span><span class="§-int §-on" role="switch" aria-checked="true" aria-label="Rappel actif"></span></div>
<div class="§-att" data-booster="envoi-a-confirmer">
<div class="§-q">Et combien de jours de garde à 18 °C ?</div>
<p><b>Pas envoyée : pas de réseau.</b> Elle partira une seule fois, quand tu confirmes.</p>
<div class="§-barre-act"><span></span><button class="§-bt2">${I('pen', 14)}Reformuler</button><button class="§-prim">${I('send', 14)}Envoyer au retour du réseau</button></div>
</div>
</div>${pied('Ajoute une question…')}`;

export default {
  titre: 'la réponse en gestes à cocher (tiède)',
  sous: 'Série s2 « le geste et le temps » · chaque conseil devient un geste daté, une dose, une case ; le prochain contrôle devient un rappel',
  css,
  cadres: [
    { cadre: 'accueil', lib: 'Accueil', aide: 'les gestes du brassin, J+4', html: accueil },
    { cadre: 'attente', lib: 'Attente', aide: '2:29, la liste se prépare', html: attente },
    { cadre: 'reponse', lib: 'Réponse', aide: 'gestes cochés, rappel daté', html: reponse },
    { cadre: 'erreur', lib: 'Erreur', aide: 'hors ligne, envoi à confirmer', html: erreur },
  ],
};
