// s2a (froide) — la base, l'attente en frise d'étapes avec la durée attendue, l'erreur qui montre où elle s'arrête.
import { icone as I } from '../outils/commun.mjs';

const css = `
.§-tete{display:flex;align-items:center;gap:8px;padding:6px 8px 6px 12px;border-bottom:1px solid var(--bd);flex:none}
.§-tete-tx{flex:1;min-width:0;line-height:1.2}
.§-tete-tx b{display:block;font-size:16px;color:var(--t0)}
.§-tete-tx span{font-size:12px;color:var(--t2)}
.§-tete .§-ico{color:var(--hoptx)}
.§-bt-ic{width:32px;height:32px;display:grid;place-items:center;border-radius:6px;color:var(--t1);position:relative}
.§-bt-ic.§-on{color:var(--hoptx);background:var(--hopbg)}
.§-pastille-n{position:absolute;top:3px;right:3px;min-width:14px;height:14px;border-radius:7px;background:var(--hop);color:#fff;font:600 10px/14px var(--mono);text-align:center;padding:0 3px}
.§-fil{flex:1;min-height:0;overflow:hidden;padding:10px 12px 8px;display:flex;flex-direction:column;gap:10px}
.§-pied{flex:none;border-top:1px solid var(--bd);padding:6px 10px 10px;display:flex;flex-direction:column;gap:6px;background:var(--pg)}
.§-seg{display:flex;height:28px;border:1px solid var(--bd);border-radius:6px;overflow:hidden}
.§-seg button{flex:1;font-size:12px;color:var(--t1);display:flex;align-items:center;justify-content:center;gap:4px;border-right:1px solid var(--bd)}
.§-seg button:last-child{border-right:0}
.§-seg button .§-mono{font-size:12px;color:var(--t2)}
.§-seg button[aria-pressed=true]{background:var(--act);color:var(--acttx)}
.§-seg button[aria-pressed=true] .§-mono{color:var(--acttx);opacity:.8}
.§-saisie{display:flex;gap:6px;align-items:flex-end}
.§-champ{flex:1;min-height:40px;border:1px solid var(--bdm);border-radius:6px;background:var(--pn);font:16px var(--sans);color:var(--t2);padding:9px 10px;line-height:1.3}
.§-champ.§-plein{color:var(--t0)}
.§-envoi{width:40px;height:40px;border-radius:6px;background:var(--act);color:var(--acttx);display:grid;place-items:center}
.§-envoi[disabled]{background:var(--su);color:var(--t2)}
.§-salut{font-size:18px;font-weight:700;color:var(--t0);margin:4px 0 0}
.§-salut-s{font-size:14px;color:var(--t2);margin:2px 0 0}
.§-lu{background:var(--pn);border-radius:8px;padding:8px 10px}
.§-lu-t{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--t2);margin-bottom:4px}
.§-lu-t .§-ic{color:var(--hoptx)}
.§-lu-r{display:flex;justify-content:space-between;gap:8px;font-size:14px;padding:4px 0;border-top:1px solid var(--bd)}
.§-lu-r:first-of-type{border-top:0}
.§-lu-r span:first-child{color:var(--t2)}
.§-lu-r .§-mono{color:var(--t0);font-size:13px;text-align:right}
.§-dh{display:flex;height:6px;border-radius:3px;overflow:hidden;gap:2px;margin:2px 0 0}
.§-dh i{display:block;background:var(--hop)}
.§-dh i:nth-child(2){opacity:.7}.§-dh i:nth-child(3){opacity:.45}
.§-sugg-t{font-size:12px;color:var(--t2);margin:2px 0 -4px}
.§-sugg{display:flex;flex-direction:column}
.§-sugg button{display:flex;align-items:center;gap:8px;min-height:36px;text-align:left;font-size:14px;color:var(--hoptx);border-bottom:1px solid var(--bd);padding:0 2px}
.§-sugg button span{flex:1}
.§-q{align-self:flex-end;max-width:84%;background:var(--su);color:var(--t0);border-radius:10px 10px 2px 10px;padding:7px 10px;font-size:14px;line-height:1.35}
.§-q-m{align-self:flex-end;font-size:12px;color:var(--t2);margin-top:-6px}
.§-att{border:1px solid var(--bd);border-radius:8px;padding:8px 10px;display:flex;flex-direction:column;gap:6px}
.§-att-h{display:flex;align-items:baseline;justify-content:space-between}
.§-att-h b{font-size:14px;color:var(--t0)}
.§-chrono{font:600 28px var(--mono);color:var(--t0);line-height:1}
.§-frise{list-style:none;margin:0;padding:0;position:relative}
.§-frise li{display:grid;grid-template-columns:22px 1fr auto;gap:8px;align-items:center;min-height:38px;position:relative;font-size:14px;color:var(--t1)}
.§-frise li::before{content:"";position:absolute;left:10px;top:24px;bottom:-14px;width:2px;background:var(--bd)}
.§-frise li:last-child::before{display:none}
.§-frise li.§-fait::before{background:var(--hop)}
.§-pt{width:22px;height:22px;border-radius:11px;display:grid;place-items:center;border:2px solid var(--bdm);background:var(--pg);position:relative;z-index:1;color:var(--t2)}
.§-fait .§-pt{background:var(--hop);border-color:var(--hop);color:#fff}
.§-encours .§-pt{border-color:var(--hop);color:var(--hoptx)}
.§-encours{font-weight:600;color:var(--t0)}
.§-avenir{color:var(--t2)}
.§-frise small{display:block;font-size:12px;color:var(--t2);font-weight:400}
.§-frise .§-mono{font-size:12px;color:var(--t2)}
.§-casse .§-pt{border-color:var(--al);color:var(--altx)}
.§-casse{color:var(--altx);font-weight:600}
.§-duree{margin-top:2px}
.§-piste{position:relative;height:8px;border-radius:4px;background:var(--su)}
.§-zone{position:absolute;top:0;bottom:0;border-radius:4px;background:var(--hopbg);border:1px solid var(--hop)}
.§-rempli{position:absolute;left:0;top:0;bottom:0;border-radius:4px 0 0 4px;background:var(--hop)}
.§-aig{position:absolute;top:-4px;width:2px;height:16px;background:var(--t0)}
.§-echelle{display:flex;justify-content:space-between;font:12px var(--mono);color:var(--t2);margin-top:3px}
.§-duree-l{font-size:12px;color:var(--t2);margin-top:2px}
.§-duree-l b{color:var(--t0);font-weight:600}
.§-file{display:flex;align-items:center;gap:8px;border:1px dashed var(--bdm);border-radius:8px;padding:6px 6px 6px 10px;font-size:14px;color:var(--t1)}
.§-file span{flex:1}
.§-file small{display:block;font-size:12px;color:var(--t2)}
.§-ailleurs{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--t2)}
.§-ailleurs span{flex:1}
.§-bascule{display:flex;align-items:center;gap:6px;height:28px;padding:0 10px;border-radius:14px;background:var(--hopbg);color:var(--hoptx);font-size:13px;font-weight:600}
.§-rep{display:flex;flex-direction:column;gap:8px}
.§-rep-h{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--t2)}
.§-niv{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 8px;border-radius:11px;background:var(--attbg);color:var(--atttx);font-weight:700;font-size:12px}
.§-rep-t{font-size:18px;font-weight:700;color:var(--t0);line-height:1.25;margin:0}
.§-geste{background:var(--attbg);border-radius:8px;padding:8px 10px;font-size:16px;color:var(--t0);font-weight:600;display:flex;gap:8px;align-items:center}
.§-geste .§-ic{color:var(--atttx)}
.§-geste .§-mono{font-size:15px}
.§-pli{text-align:left;display:flex;align-items:center;gap:6px;min-height:28px;font-size:14px;color:var(--t1);border-bottom:1px solid var(--bd)}
.§-pli span{flex:1;min-width:0}
.§-pli b{color:var(--t0)}
.§-pli .§-ic:last-child{color:var(--t2)}
.§-ctrl{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--t0)}
.§-ctrl span{flex:1}
.§-ctrl small{display:block;font-size:12px;color:var(--t2)}
.§-bt2{height:28px;padding:0 10px;border:1px solid var(--bdm);border-radius:6px;font-size:13px;color:var(--t1);display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.§-prop{border:1px solid var(--bd);border-radius:8px;padding:6px 10px 8px}
.§-prop-t{font-size:12px;color:var(--t2);display:flex;justify-content:space-between;margin-bottom:2px}
.§-mod{display:grid;grid-template-columns:24px 1fr 104px;gap:6px;align-items:center;min-height:34px;border-bottom:1px solid var(--bd)}
.§-mod:last-of-type{border-bottom:0}
.§-case{width:20px;height:20px;border-radius:4px;background:var(--act);color:var(--acttx);display:grid;place-items:center}
.§-mod-n{font-size:14px;color:var(--t0);line-height:1.2}
.§-mod-n small{display:block;font-size:12px;color:var(--t2)}
.§-av{font:13px var(--mono);color:var(--t0);text-align:right}
.§-av s{color:var(--t2)}
.§-barres{display:flex;flex-direction:column;gap:2px;margin-top:2px}
.§-barres i{display:block;height:3px;border-radius:2px;margin-left:auto}
.§-barres i:first-child{background:var(--bdm)}
.§-barres i:last-child{background:var(--hop)}
.§-tot{display:flex;justify-content:space-between;font-size:12px;color:var(--t2);padding-top:4px}
.§-tot .§-mono{color:var(--t0)}
.§-actions{display:flex;justify-content:flex-end;gap:6px;margin-top:6px}
.§-prim{height:32px;padding:0 12px;border-radius:6px;background:var(--act);color:var(--acttx);font-weight:600;font-size:13px;display:inline-flex;align-items:center;gap:6px}
.§-hl{display:flex;align-items:center;gap:8px;background:var(--pn);border-radius:8px;padding:6px 10px;font-size:13px;color:var(--t1)}
.§-hl .§-ic{color:var(--t2)}
.§-old{display:flex;flex-direction:column;gap:4px;font-size:13px;color:var(--t2);border-bottom:1px solid var(--bd);padding-bottom:8px}
.§-old-h{display:flex;align-items:center;gap:6px;font-size:12px}
.§-old b{color:var(--t0);font-size:16px}
.§-old-r{display:flex;align-items:center;gap:6px}
.§-ail{display:flex;flex-direction:column}
.§-ail-r{display:flex;align-items:center;gap:8px;min-height:32px;font-size:14px;color:var(--t1);text-align:left}
.§-ail-r span:nth-child(2){flex:1}
.§-ail-r .§-mono{font-size:13px;color:var(--t2)}
.§-ail-pt{width:8px;height:8px;border-radius:4px;background:var(--hop)}
.§-ail-cours{background:none;border:2px solid var(--hop)}
.§-ail-ok{font-size:12px;color:var(--hoptx);font-weight:600}
.§-err{border:1px solid var(--bdm);border-radius:8px;padding:8px 10px;display:flex;flex-direction:column;gap:6px}
.§-err-h{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:700;color:var(--t0)}
.§-err-p{font-size:14px;color:var(--t1);margin:0}
.§-err .§-actions{justify-content:flex-start;margin-top:2px}
.§-pied.§-hors .§-champ{border-style:dashed}
.§-pied-ban{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--t2)}
`;

const tete = (cloche = false) => `<header class="§-tete">${I('sparkles', 16, '§-ico')}<div class="§-tete-tx"><b>Compagnon</b><span>Brassin 31 · New England IPA · J+4 · <span class="§-mono">19 °C</span></span></div>
<button class="§-bt-ic" aria-label="Mes conversations, 1 réponse prête">${I('convs', 18)}<span class="§-pastille-n">1</span></button>
<button class="§-bt-ic${cloche ? ' §-on' : ''}" aria-label="Me notifier à la réponse" aria-pressed="${cloche}">${I('bell', 18)}</button>
<button class="§-bt-ic" aria-label="Plus : limites, repartir à zéro">${I('more', 18)}</button></header>`;

const pied = ({ mode = 'auto', texte = 'Décris ce que tu observes…', plein = false, envoi = false, hors = false } = {}) => `<footer class="§-pied${hors ? ' §-hors' : ''}">
${hors ? `<div class="§-pied-ban">${I('wifiOff', 14)}Hors ligne : ce que tu écris reste sur ce téléphone.</div>` : ''}
<div class="§-seg" role="group" aria-label="Mode" data-booster="mode-duree">
<button aria-pressed="${mode === 'rapide'}">Rapide</button>
<button aria-pressed="${mode === 'auto'}">Auto <span class="§-mono">15–30 s</span></button>
<button aria-pressed="${mode === 'appro'}">Approfondi <span class="§-mono">1–3 min</span></button></div>
<div class="§-saisie"><div class="§-champ${plein ? ' §-plein' : ''}" role="textbox" aria-label="Ta question">${texte}</div>
<button class="§-envoi" ${envoi ? '' : 'disabled'} aria-label="Envoyer">${I('send', 18)}</button></div></footer>`;

const accueil = `${tete()}<div class="§-fil">
<p class="§-salut">On regarde ça ensemble.</p>
<p class="§-salut-s">Je relis le brassin avant chaque réponse.</p>
<div class="§-lu" data-booster="lu-avant">
<div class="§-lu-t">${I('book', 14)}Ce que je lis du brassin 31</div>
<div class="§-lu-r"><span>Fermentation</span><span class="§-mono">J+4 · 19 °C · 36 h</span></div>
<div class="§-lu-r"><span>Dry hop<div class="§-dh" style="width:150px"><i style="flex:85"></i><i style="flex:43"></i><i style="flex:43"></i></div></span><span class="§-mono">Citra J+2 85 g<br>Galaxy J+6 43 g<br>Mosaic J+9 43 g</span></div>
<div class="§-lu-r"><span>Total</span><span class="§-mono">171 g · 9,0 g/L</span></div>
<div class="§-lu-r"><span>pH de maische visé</span><span class="§-mono">5,3</span></div>
<div class="§-lu-r"><span>DF relevée</span><span class="§-mono">1,012</span></div>
</div>
<p class="§-sugg-t">En fermentation, on me demande souvent</p>
<div class="§-sugg">
<button>${I('upRight', 14)}<span>La pression monte : je purge ?</span></button>
<button>${I('upRight', 14)}<span>Galaxy à J+6 : je garde 43 g ?</span></button>
<button>${I('upRight', 14)}<span>DF 1,012 à J+4 : la levure a fini ?</span></button>
</div>
<div class="§-ail" data-booster="fil-statuts"><p class="§-sugg-t">Tourne ailleurs</p>
<button class="§-ail-r"><span class="§-ail-pt §-ail-cours"></span><span>Brassin 31 · Blonde de garde</span><span class="§-mono">0:40</span></button>
<button class="§-ail-r"><span class="§-ail-pt"></span><span>Mes finances</span><span class="§-ail-ok">réponse prête</span></button></div></div>${pied()}`;

const attente = `${tete(true)}<div class="§-fil">
<div class="§-q">La fermentation est à 19 °C depuis 36 h et la pression monte doucement : que faire ?</div>
<div class="§-q-m">Approfondi · 22:04</div>
<div class="§-att" data-booster="frise-etapes">
<div class="§-att-h"><b>Je prépare ta réponse</b><span class="§-chrono">2:29</span></div>
<ol class="§-frise">
<li class="§-fait"><span class="§-pt">${I('check', 12)}</span><span>Lire le brassin et le journal</span><span class="§-mono">0:04</span></li>
<li class="§-fait"><span class="§-pt">${I('check', 12)}</span><span>Calculer<small>recette, IBU, dry hop, pH</small></span><span class="§-mono">0:41</span></li>
<li class="§-encours"><span class="§-pt">${I('search', 12)}</span><span>Chercher des sources<small>2 lues · en cours</small></span><span class="§-mono">1:48</span></li>
<li class="§-avenir"><span class="§-pt">${I('pen', 12)}</span><span>Rédiger</span><span></span></li>
<li class="§-avenir"><span class="§-pt">${I('shield', 12)}</span><span>Relire deux fois<small>dose de dry hop : geste sensible</small></span><span></span></li>
</ol>
<div class="§-duree" data-booster="jauge-duree">
<div class="§-piste"><span class="§-zone" style="left:27.3%;width:54.5%"></span><span class="§-rempli" style="width:67.7%;opacity:.35"></span><span class="§-aig" style="left:67.7%"></span></div>
<div class="§-echelle"><span>0</span><span>1:00</span><span>3:00</span><span>3:40</span></div>
<div class="§-duree-l">Approfondi : <b>1 à 3 min</b> d'habitude · au plus 3:40</div>
</div></div>
<div class="§-file">${I('clock', 16)}<span>Et combien de jours de garde à 18 °C ?<small>En file · partira après celle-ci</small></span><button class="§-bt-ic" aria-label="Retirer de la file">${I('x', 16)}</button></div>
<div class="§-ailleurs"><span>Tu peux continuer ailleurs : la réponse reste dans ce fil.</span><button class="§-bascule" aria-pressed="true">${I('bell', 14)}Notifié</button></div>
</div>${pied({ mode: 'appro', texte: 'Ajoute une question…' })}`;

const reponse = `${tete()}<div class="§-fil">
<div class="§-q">La fermentation est à 19 °C depuis 36 h et la pression…</div>
<article class="§-rep">
<div class="§-rep-h"><span class="§-niv">${I('alert', 12)}Attention</span><span>Relu deux fois · calculs refaits · <span class="§-mono">2:41</span></span></div>
<h2 class="§-rep-t">Dry hop chargé : réduis le dernier apport.</h2>
<div class="§-geste">${I('leaf', 18)}<span>Passe Mosaic J+9 de <span class="§-mono">43 g</span> à <span class="§-mono">21 g</span>.</span></div>
<button class="§-pli"><span><b>Pourquoi</b> · <span class="§-mono">9,0 g/L</span> : l'herbacé risque de ressortir à la garde</span>${I('down', 16)}</button>
<div class="§-ctrl">${I('flag', 16)}<span>Goût et odeur à la purge, J+9<small>Note si l'herbacé apparaît.</small></span><button class="§-bt2">${I('notebook', 14)}Au journal</button></div>
<div class="§-prop" data-booster="avant-apres">
<div class="§-prop-t"><span>Proposition pour le brouillon</span><span>coche, puis valide</span></div>
<div class="§-mod"><span class="§-case" role="checkbox" aria-checked="true">${I('check', 14)}</span><span class="§-mod-n">Citra · dry hop J+2</span><span class="§-av"><s>85</s> → 70 g<span class="§-barres"><i style="width:85%"></i><i style="width:70%"></i></span></span></div>
<div class="§-mod"><span class="§-case" role="checkbox" aria-checked="true">${I('check', 14)}</span><span class="§-mod-n">Mosaic · dry hop J+9</span><span class="§-av"><s>43</s> → 21 g<span class="§-barres"><i style="width:43%"></i><i style="width:21%"></i></span></span></div>
<div class="§-mod"><span class="§-case" role="checkbox" aria-checked="true">${I('check', 14)}</span><span class="§-mod-n">Durée du dry hop</span><span class="§-av"><s>2</s> → 3 j<span class="§-barres"><i style="width:66%"></i><i style="width:100%"></i></span></span></div>
<div class="§-tot"><span>Dry hop total</span><span class="§-mono">171 → 134 g · 9,0 → 7,1 g/L</span></div>
<div class="§-actions"><button class="§-bt2">Écarter</button><button class="§-prim">${I('check', 14)}Valider 3 modifications</button></div>
</div>
<button class="§-pli"><span>Conseil relu · calculs et sources</span>${I('down', 16)}</button>
</article></div>${pied()}`;

const erreur = `${tete()}<div class="§-fil">
<div class="§-old"><div class="§-old-h"><span class="§-niv">${I('alert', 12)}Attention</span><span>22:07 · 3 modifications validées</span></div><b>Dry hop chargé : réduis le dernier apport.</b><span class="§-old-r">${I('flag', 14)}J+9 · goût et odeur à la purge · au journal</span></div>
<div class="§-q">Et combien de jours de garde à 18 °C ?</div>
<div class="§-q-m">Gardée sur ce téléphone · 22:51</div>
<div class="§-err" data-booster="frise-cause">
<div class="§-err-h">${I('wifiOff', 16)}Pas encore envoyée : pas de réseau</div>
<ol class="§-frise">
<li class="§-fait"><span class="§-pt">${I('check', 12)}</span><span>Garder la question<small>sur ce téléphone</small></span><span class="§-mono">22:51</span></li>
<li class="§-casse"><span class="§-pt">${I('x', 12)}</span><span>Envoyer<small>pas de réseau · rien n'est parti</small></span><span></span></li>
<li class="§-avenir"><span class="§-pt">${I('book', 12)}</span><span>Lire le brassin et calculer</span><span></span></li>
<li class="§-avenir"><span class="§-pt">${I('pen', 12)}</span><span>Rédiger et relire</span><span></span></li>
</ol>
<p class="§-err-p">Rien n'est compté sur le budget. La même question ne partira pas deux fois.</p>
<div class="§-actions"><button class="§-prim">${I('send', 14)}Envoyer au retour du réseau</button><button class="§-bt2">${I('pen', 14)}Reformuler</button></div>
</div>
</div>${pied({ hors: true, texte: 'Ajoute une question…' })}`;

export default {
  titre: 'la base, l\'attente en frise d\'étapes (froide)',
  sous: 'Série s2 « le geste et le temps » · New England IPA, brassin 31, fermentation J+4 · 390 × 760',
  css,
  cadres: [
    { cadre: 'accueil', lib: 'Accueil', aide: 'depuis le jour de brassage, J+4', html: accueil },
    { cadre: 'attente', lib: 'Attente', aide: '2:29, une question en file', html: attente },
    { cadre: 'reponse', lib: 'Réponse', aide: 'attention, proposition à valider', html: reponse },
    { cadre: 'erreur', lib: 'Erreur', aide: 'hors ligne, la frise montre où ça s\'arrête', html: erreur },
  ],
};
