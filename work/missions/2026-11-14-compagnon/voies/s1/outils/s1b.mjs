// s1b (tiède) : la carte verdict. Bandeau de niveau coloré en tête, le geste en gros avec ses nombres,
// « Prochain contrôle » en puce gardée au journal en un geste, le pourquoi replié.
export default (p, ico) => {
  const n = (t) => `<span class="${p}-n">${t}</span>`;
  const entete = () => `
    <div class="${p}-poignee"></div>
    <header class="${p}-entete">
      <i class="${p}-verre" aria-hidden="true"></i>
      <div class="${p}-nom"><b>New England IPA</b><span>Brassin 31 · fermentation ${n('J+4')}</span></div>
      <button class="${p}-ib" aria-label="Mes conversations">${ico('fils', 18)}</button>
      <button class="${p}-ib" aria-label="Réglages : notifier, limites, repartir à zéro">${ico('menu', 18)}</button>
      <button class="${p}-ib" aria-label="Fermer">${ico('x', 18)}</button>
    </header>`;
  const pied = ({ mode = 'Auto', icm = 'auto', bandeau = '' } = {}) => `
    <footer class="${p}-pied">${bandeau}
      <div class="${p}-saisir">
        <button class="${p}-mode" data-booster="mode-cycle" aria-label="Mode ${mode}, toucher pour changer">${ico(icm, 16)}<span>${mode}</span></button>
        <div class="${p}-champ"><textarea class="${p}-saisie" rows="1" aria-label="Ta question" placeholder="Décris ce que tu observes…"></textarea><button class="${p}-env" aria-label="Envoyer">${ico('envoyer', 18)}</button></div>
      </div>
    </footer>`;
  const bulle = (t, meta) => `<div class="${p}-q"><p class="${p}-bulle">${t}</p><span class="${p}-meta">${meta}</span></div>`;

  const css = `
.${p}-feuille{position:absolute;left:0;right:0;top:36px;bottom:0;background:var(--c900);border-radius:24px 24px 0 0;box-shadow:var(--ombre);display:flex;flex-direction:column;font-size:16px;line-height:1.35}
.${p}-poignee{width:32px;height:4px;border-radius:2px;background:var(--c700);margin:6px auto 0;flex:none}
.${p}-entete{display:flex;align-items:center;gap:8px;height:44px;padding:0 4px 0 12px;flex:none}
.${p}-verre{width:14px;height:20px;border-radius:2px 2px 4px 4px;background:linear-gradient(#F6E3A4,#E8B84E);border:1px solid var(--c700);flex:none}
.${p}-nom{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}
.${p}-nom b{color:var(--c50);font-weight:600}
.${p}-nom span{font-size:13px;color:var(--c400)}
.${p}-ib{width:32px;height:32px;display:grid;place-items:center;border-radius:10px;color:var(--c400)}
.${p}-fil{flex:1;min-height:0;overflow:hidden;padding:4px 12px 12px;display:flex;flex-direction:column;gap:12px}
.${p}-bas{justify-content:flex-end}
.${p}-pied{flex:none;padding:8px;background:var(--c900);border-top:1px solid var(--c800)}
.${p}-saisir{display:flex;gap:6px;align-items:stretch}
.${p}-mode{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;width:76px;border-radius:10px;border:1px solid var(--c700);background:var(--c950);font-size:13px;font-weight:600;color:var(--c200);text-align:center}
.${p}-champ{flex:1;min-width:0;display:flex;align-items:center;gap:4px;min-height:44px;padding:4px;background:var(--c950);border:1px solid var(--c700);border-radius:10px}
.${p}-saisie{flex:1;min-width:0;resize:none;border:0;background:none;outline:0;font:16px/1.3 var(--sans);color:var(--c50);padding:6px 4px}
.${p}-saisie::placeholder{color:var(--c400)}
.${p}-env{width:36px;height:36px;border-radius:10px;background:var(--c850);color:var(--c400);display:grid;place-items:center}
.${p}-ligne-hl{display:flex;align-items:center;gap:6px;min-height:28px;padding:0 2px 6px;font-size:13px;color:var(--c200)}
.${p}-ligne-hl svg{color:var(--at-t)}
.${p}-q{align-self:flex-end;max-width:86%;display:flex;flex-direction:column;align-items:flex-end;gap:2px}
.${p}-bulle{margin:0;padding:8px 10px;background:var(--c850);border-radius:16px 16px 4px 16px;color:var(--c50)}
.${p}-meta{font-size:13px;color:var(--c400)}
.${p}-carte{background:var(--c950);border:1px solid var(--c800);border-radius:16px;overflow:hidden;display:flex;flex-direction:column}
.${p}-band{display:flex;align-items:center;gap:6px;height:32px;padding:0 10px;font-size:13px;font-weight:600}
.${p}-band span{flex:1}
.${p}-band i{font-style:normal;font-weight:400}
.${p}-b-at{background:var(--at-f);color:var(--at-t)}
.${p}-b-info{background:var(--hop-f);color:var(--hop-t)}
.${p}-b-neutre{background:var(--c850);color:var(--c200)}
.${p}-corps{padding:8px 10px 10px;display:flex;flex-direction:column;gap:8px}
.${p}-titre{margin:0;font-size:16px;font-weight:600;color:var(--c50)}
.${p}-geste{display:flex;flex-direction:column;gap:2px}
.${p}-quoi{color:var(--c200)}
.${p}-gros{font:600 26px/1.15 var(--mono);font-variant-numeric:tabular-nums;color:var(--c50);letter-spacing:-.02em;display:flex;align-items:baseline;gap:8px}
.${p}-gros s{color:var(--c400);font-weight:400;text-decoration-thickness:2px}
.${p}-gros svg{align-self:center;color:var(--c400)}
.${p}-gros-at{color:var(--at-t)}
.${p}-effet{font-size:13px;color:var(--c400)}
.${p}-puce{display:flex;align-items:center;min-height:36px;border-radius:10px;background:var(--c850);font-size:13px;color:var(--c200)}
.${p}-puce>span{flex:1;display:flex;align-items:center;gap:6px;padding:0 8px;min-width:0}
.${p}-puce b{font-weight:600;color:var(--c50)}
.${p}-garder{display:flex;align-items:center;gap:4px;align-self:stretch;padding:0 10px;border-left:1px solid var(--c700)!important;font-weight:600;color:var(--c50)}
.${p}-garde{color:var(--hop-t)}
.${p}-pli{display:flex;align-items:center;gap:6px;min-height:28px;width:100%;font-size:13px;color:var(--c400)}
.${p}-pli span{flex:1}
.${p}-pli b{color:var(--c200);font-weight:600}
.${p}-prop{background:var(--c950);border:1px solid var(--c800);border-radius:16px;padding:8px 10px;display:flex;flex-direction:column}
.${p}-pt{font-size:13px;color:var(--c400);margin:0 0 2px}
.${p}-mod{display:flex;align-items:center;gap:8px;min-height:34px;color:var(--c50);border-bottom:1px solid var(--c800)}
.${p}-mod span{flex:1}
.${p}-case{width:20px;height:20px;border-radius:4px;background:var(--act);color:var(--sur-act);display:grid;place-items:center}
.${p}-av{font-family:var(--mono);font-variant-numeric:tabular-nums;letter-spacing:-.02em;word-spacing:-.3em}
.${p}-av s{color:var(--c400)}
.${p}-actions{display:flex;justify-content:flex-end;gap:8px;padding-top:8px}
.${p}-btn{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:10px;font-size:13px;font-weight:600;white-space:nowrap}
.${p}-btn-s{border:1px solid var(--c700)!important;color:var(--c200);background:var(--c950)}
.${p}-btn-p{background:var(--act)!important;color:var(--sur-act)!important}
.${p}-sous{margin:0;font-size:13px;color:var(--c400)}
.${p}-h{margin:0;font-size:16px;font-weight:600;color:var(--c50)}
.${p}-liste{display:flex;flex-direction:column;border:1px solid var(--c800);border-radius:16px;background:var(--c950);overflow:hidden}
.${p}-sugg{display:flex;align-items:center;gap:8px;min-height:40px;padding:0 10px;color:var(--c50);border-top:1px solid var(--c800)!important}
.${p}-sugg:first-child{border-top:0!important}
.${p}-sugg span{flex:1}
.${p}-sugg svg{color:var(--c400)}
.${p}-limites{display:flex;align-items:center;gap:8px;min-height:32px;font-size:13px;color:var(--c400);margin-top:auto}
.${p}-limites span{flex:1}
.${p}-jauge{display:inline-block;width:40px;height:6px;border-radius:3px;background:var(--c850);position:relative;vertical-align:middle;margin-right:4px}
.${p}-jauge i{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:var(--hop)}
.${p}-chrono{display:flex;align-items:baseline;gap:8px}
.${p}-seg{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
.${p}-seg i{height:6px;border-radius:3px;background:var(--c850)}
.${p}-seg .${p}-f{background:var(--hop)}
.${p}-seg .${p}-c{background:linear-gradient(90deg,var(--hop) 50%,var(--c850) 50%)}
.${p}-segl{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;font-size:13px;color:var(--c400)}
.${p}-segl .${p}-cur{color:var(--c50);font-weight:600}
.${p}-piste{position:relative;height:16px}
.${p}-piste::before{content:"";position:absolute;left:0;right:0;top:6px;height:4px;border-radius:2px;background:var(--c850)}
.${p}-zone{position:absolute;top:6px;height:4px;left:27%;right:18%;background:var(--hop-f);border-radius:2px}
.${p}-marq{position:absolute;top:0;left:68%;width:2px;height:16px;background:var(--c50);border-radius:1px}
.${p}-bornes{display:flex;justify-content:space-between;font-size:13px;color:var(--c400)}
.${p}-notif{display:flex;align-items:center;gap:8px;min-height:32px;font-size:13px;color:var(--c200);border-top:1px solid var(--c800);padding-top:6px}
.${p}-notif span{flex:1}
.${p}-bascule{width:36px;height:22px;border-radius:11px;background:var(--hop);position:relative;flex:none}
.${p}-bascule::after{content:"";position:absolute;top:3px;right:3px;width:16px;height:16px;border-radius:50%;background:#fff}
.${p}-file{display:flex;align-items:center;gap:8px;min-height:36px;padding:0 10px;border:1px dashed var(--c700);border-radius:10px;font-size:13px;color:var(--c400)}
.${p}-file b{font-weight:400;color:var(--c200);flex:1;font-size:16px}
.${p}-tourne{animation:${p}-rot 1s linear infinite}
@keyframes ${p}-rot{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.${p}-tourne{animation:none}}
.${p}-cite{margin:0;padding:8px 10px;border-radius:10px;background:var(--c850);color:var(--c50)}
`;

  const accueil = `<div class="${p}-feuille">${entete()}
    <div class="${p}-fil">
      <article class="${p}-carte" data-booster="carte-verdict">
        <div class="${p}-band ${p}-b-info">${ico('info', 16)}<span>Info · dernier conseil</span><i>hier ${n('22:00')}</i></div>
        <div class="${p}-corps">
          <h3 class="${p}-titre">Densité finale dans la cible.</h3>
          <div class="${p}-geste"><span class="${p}-quoi">DF relevée = DF visée</span><span class="${p}-gros">1,012</span></div>
          <div class="${p}-puce">${'<span>'}${ico('horloge', 16)}<b>${n('J+6')}</b> dry hop Galaxy ${n('43 g')}</span><button class="${p}-garder ${p}-garde">${ico('ok', 14)}Au journal</button></div>
        </div>
      </article>
      <h3 class="${p}-h">On regarde ça ensemble.</h3>
      <div class="${p}-liste">
        <button class="${p}-sugg" data-booster="suggestion"><span>La pression monte doucement : que faire ?</span>${ico('fleche', 16)}</button>
        <button class="${p}-sugg"><span>Galaxy J+6 : 43 g, c'est assez ?</span>${ico('fleche', 16)}</button>
        <button class="${p}-sugg"><span>Combien de jours de garde à 18 °C ?</span>${ico('fleche', 16)}</button>
        <button class="${p}-sugg"><span>Le pH de maische visé 5,3 était-il bon ?</span>${ico('fleche', 16)}</button>
      </div>
      <p class="${p}-sous">${'Je relis le brassin et son journal à chaque question ; rien ne s\'applique sans ta validation.'}</p>
      <button class="${p}-limites" data-booster="jauge-limites">${ico('bouclier', 16)}<span><i class="${p}-jauge"><i style="width:14%"></i></i>${n('2,10 / 15 CHF')} ce mois · ${n('4 / 120')} questions</span>${ico('chev', 16)}</button>
    </div>${pied()}</div>`;

  const attente = `<div class="${p}-feuille">${entete()}
    <div class="${p}-fil ${p}-bas">
      <article class="${p}-carte">
        <div class="${p}-band ${p}-b-info">${ico('info', 16)}<span>Info · dernier conseil</span><i>hier ${n('22:00')}</i></div>
        <div class="${p}-corps">
          <h3 class="${p}-titre">Densité finale dans la cible.</h3>
          <div class="${p}-geste"><span class="${p}-quoi">DF relevée = DF visée</span><span class="${p}-gros">1,012</span></div>
          <div class="${p}-puce">${'<span>'}${ico('horloge', 16)}<b>${n('J+6')}</b> dry hop Galaxy ${n('43 g')}</span><button class="${p}-garder ${p}-garde">${ico('ok', 14)}Au journal</button></div>
        </div>
      </article>
      ${bulle('La fermentation est à 19 °C depuis 36 h et la pression monte doucement : que faire ?', `${n('22:14')}`)}
      <article class="${p}-carte" data-booster="carte-attente">
        <div class="${p}-band ${p}-b-neutre">${ico('tourne', 16).replace('<svg', `<svg class="${p}-tourne"`)}<span>En cours · Approfondi</span><i>relecture double prévue</i></div>
        <div class="${p}-corps">
          <div class="${p}-chrono"><span class="${p}-gros">2:29</span><span class="${p}-quoi">je relis ma proposition</span></div>
          <div data-booster="jauge-duree"><div class="${p}-piste"><i class="${p}-zone"></i><i class="${p}-marq"></i></div>
          <div class="${p}-bornes"><span>${n('0')}</span><span>habituel ${n('1 à 3 min')}</span><span>${n('3:40')}</span></div></div>
          <div class="${p}-seg" data-booster="frise-etapes"><i class="${p}-f"></i><i class="${p}-f"></i><i class="${p}-f"></i><i class="${p}-f"></i><i class="${p}-c"></i></div>
          <div class="${p}-segl"><span>Lire</span><span>Calculer</span><span>Sources</span><span>Rédiger</span><span class="${p}-cur">Relire</span></div>
          <div class="${p}-notif">${ico('cloche', 16)}<span>Me notifier ; tu peux continuer ailleurs</span><i class="${p}-bascule" role="switch" aria-checked="true" aria-label="Me notifier à la réponse"></i></div>
        </div>
      </article>
      <div class="${p}-file">${ico('file', 16)}<b>Et combien de jours de garde à 18 °C ?</b>en file</div>
    </div>${pied({ mode: 'Approfondi', icm: 'approfondi' })}</div>`;

  const reponse = `<div class="${p}-feuille">${entete()}
    <div class="${p}-fil ${p}-bas">
      ${bulle('La fermentation est à 19 °C depuis 36 h et la pression monte doucement : que faire ?', `${n('22:14')}`)}
      <article class="${p}-carte" data-booster="carte-verdict">
        <div class="${p}-band ${p}-b-at">${ico('attention', 16)}<span>Attention</span><i>relu deux fois · ${n('22:17')}</i></div>
        <div class="${p}-corps">
          <h3 class="${p}-titre">Dry hop chargé : réduis le dernier apport.</h3>
          <div class="${p}-geste"><span class="${p}-quoi">Mosaic J+9</span><span class="${p}-gros"><s>43 g</s>${ico('geste', 20)}<span class="${p}-gros-at">21 g</span></span><span class="${p}-effet">dry hop ${n('9,0 → 7,8 g/L')}</span></div>
          <div class="${p}-puce" data-booster="puce-prochain-controle"><span>${ico('horloge', 16)}<b>${n('J+9')}</b> goût et odeur à la purge</span><button class="${p}-garder">${ico('journal', 14)}Garder</button></div>
          <button class="${p}-pli"><span><b>Pourquoi</b> · ${n('9,0 g/L')}, herbacé possible en fin de garde</span>${ico('chev', 16)}</button>
        </div>
      </article>
      <section class="${p}-prop" data-booster="proposition">
        <p class="${p}-pt">Aussi pour la recette · prochain brassin</p>
        <div class="${p}-mod"><i class="${p}-case">${ico('ok', 14)}</i><span>Citra J+2</span><span class="${p}-av"><s>85</s> → 70 g</span></div>
        <div class="${p}-mod"><i class="${p}-case">${ico('ok', 14)}</i><span>Mosaic J+9</span><span class="${p}-av"><s>43</s> → 21 g</span></div>
        <div class="${p}-mod"><i class="${p}-case">${ico('ok', 14)}</i><span>Durée du dry hop</span><span class="${p}-av"><s>2</s> → 3 j</span></div>
        <div class="${p}-actions"><button class="${p}-btn ${p}-btn-s">Écarter</button><button class="${p}-btn ${p}-btn-p">Valider 3 modifications</button></div>
      </section>
      <button class="${p}-pli">${ico('relu', 16)}<span>Relu deux fois · calculs refaits · 3 sources lues</span>${ico('chev', 16)}</button>
    </div>${pied()}</div>`;

  const erreur = `<div class="${p}-feuille">${entete()}
    <div class="${p}-fil ${p}-bas">
      <article class="${p}-carte">
        <div class="${p}-band ${p}-b-at">${ico('attention', 16)}<span>Attention</span><i>${n('22:17')}</i></div>
        <div class="${p}-corps">
          <h3 class="${p}-titre">Dry hop chargé : réduis le dernier apport.</h3>
          <div class="${p}-geste"><span class="${p}-quoi">Mosaic J+9</span><span class="${p}-gros"><s>43 g</s>${ico('geste', 20)}<span class="${p}-gros-at">21 g</span></span></div>
          <div class="${p}-puce"><span>${ico('horloge', 16)}<b>${n('J+9')}</b> goût et odeur à la purge</span><button class="${p}-garder ${p}-garde">${ico('ok', 14)}Au journal</button></div>
        </div>
      </article>
      <article class="${p}-carte" data-booster="carte-envoi">
        <div class="${p}-band ${p}-b-neutre">${ico('horsligne', 16)}<span>Hors ligne · envoi à confirmer</span><i>${n('22:31')}</i></div>
        <div class="${p}-corps">
          <h3 class="${p}-titre">Ta question attend le réseau.</h3>
          <p class="${p}-cite">Et combien de jours de garde à 18 °C ?</p>
          <p class="${p}-sous">${'Gardée sur l\'appareil ; elle ne partira qu\'une fois.'}</p>
          <div class="${p}-actions" style="justify-content:flex-start;padding-top:0"><button class="${p}-btn ${p}-btn-p">${ico('relancer', 14)}Réessayer l'envoi</button><button class="${p}-btn ${p}-btn-s">${ico('crayon', 14)}Reformuler</button></div>
        </div>
      </article>
    </div>${pied({ bandeau: `<div class="${p}-ligne-hl" data-booster="bandeau-hors-ligne">${ico('horsligne', 14)}Hors ligne : le fil reste lisible, l'envoi attendra.</div>` })}</div>`;

  return {
    titre: 'Carte verdict',
    chaleur: 'tiède',
    idee: 'Chaque réponse est une carte : bandeau de niveau coloré en tête (info, attention, urgent), le geste en gros avec ses nombres, le prochain contrôle en puce qu\'on garde au journal d\'un geste, le pourquoi replié.',
    css,
    cadres: [
      { cadre: 'accueil', nom: 'Accueil · jour de brassage, J+4', html: accueil },
      { cadre: 'attente', nom: 'Attente · 2:29, une question en file', html: attente },
      { cadre: 'reponse', nom: 'Réponse · attention, proposition', html: reponse },
      { cadre: 'erreur', nom: 'Erreur · hors ligne, envoi à confirmer', html: erreur },
    ],
  };
};
