// s1a (froide) : la base telle quelle, compactée. Chrome en une rangée, mode dans le champ,
// réponse ordonnée verdict → geste → prochain contrôle, pastille de niveau.
export default (p, ico) => {
  const n = (t) => `<span class="${p}-n">${t}</span>`;
  const entete = (badge = true) => `
    <div class="${p}-poignee"></div>
    <header class="${p}-entete">
      <span class="${p}-titre">New England IPA</span>
      <span class="${p}-ctx">${ico('thermo', 14)}${n('J+4 · 19 °C')}</span>
      <span class="${p}-esp"></span>
      <button class="${p}-ib" aria-label="Mes conversations, 2 réponses prêtes" data-booster="conversations">${ico('fils', 18)}${badge ? `<i class="${p}-badge"></i>` : ''}</button>
      <button class="${p}-ib" aria-label="Réglages : notifier, limites, repartir à zéro">${ico('menu', 18)}</button>
      <button class="${p}-ib" aria-label="Fermer">${ico('x', 18)}</button>
    </header>`;
  const pied = ({ mode = 'Auto', icm = 'auto', plein = false, bandeau = '' } = {}) => `
    <footer class="${p}-pied">${bandeau}
      <div class="${p}-champ">
        <button class="${p}-mode" data-booster="mode" aria-label="Mode : ${mode}. Changer">${ico(icm, 14)}${mode}${ico('chev', 14)}</button>
        <textarea class="${p}-saisie" rows="1" aria-label="Ta question" placeholder="Décris ce que tu observes…"></textarea>
        <button class="${p}-env${plein ? '' : ` ${p}-env-off`}" aria-label="Envoyer">${ico('envoyer', 18)}</button>
      </div>
    </footer>`;
  const question = (t, meta) => `<div class="${p}-q"><p class="${p}-bulle">${t}</p><span class="${p}-meta">${meta}</span></div>`;

  const css = `
.${p}-feuille{position:absolute;left:0;right:0;top:40px;bottom:0;background:var(--c900);border-radius:24px 24px 0 0;box-shadow:var(--ombre);display:flex;flex-direction:column;font-size:15px;line-height:1.4}
.${p}-poignee{width:32px;height:4px;border-radius:2px;background:var(--c700);margin:6px auto 0;flex:none}
.${p}-entete{display:flex;align-items:center;gap:6px;height:38px;padding:0 4px 0 12px;border-bottom:1px solid var(--c800);flex:none}
.${p}-titre{font-weight:600;color:var(--c50);white-space:nowrap}
.${p}-ctx{display:inline-flex;align-items:center;gap:3px;font-size:13px;color:var(--c400);white-space:nowrap}
.${p}-esp{flex:1}
.${p}-ib{width:32px;height:32px;display:grid;place-items:center;border-radius:10px;color:var(--c400);position:relative}
.${p}-badge{position:absolute;top:5px;right:4px;width:8px;height:8px;border-radius:50%;background:var(--hop);border:2px solid var(--c900)}
.${p}-fil{flex:1;min-height:0;overflow:hidden;padding:12px;display:flex;flex-direction:column;gap:12px}
.${p}-bas{justify-content:flex-end}
.${p}-pied{flex:none;padding:8px;border-top:1px solid var(--c800)}
.${p}-champ{display:flex;align-items:center;gap:6px;min-height:44px;padding:4px;background:var(--c950);border:1px solid var(--c700);border-radius:10px}
.${p}-mode{display:inline-flex;align-items:center;gap:4px;height:32px;padding:0 4px 0 8px;border-radius:10px;background:var(--c850)!important;font-size:13px!important;font-weight:600!important;color:var(--c200)}
.${p}-saisie{flex:1;min-width:0;resize:none;border:0;background:none;outline:0;font:16px/1.3 var(--sans);color:var(--c50);padding:6px 2px}
.${p}-saisie::placeholder{color:var(--c400)}
.${p}-env{width:36px;height:36px;border-radius:10px;background:var(--act)!important;color:var(--sur-act)!important;display:grid;place-items:center}
.${p}-env-off{background:var(--c850)!important;color:var(--c400)!important}
.${p}-bande{display:flex;align-items:center;gap:6px;min-height:28px;padding:0 4px 6px;font-size:13px;color:var(--c200)}
.${p}-bande svg{color:var(--at-t)}
.${p}-salut{display:flex;flex-direction:column;gap:4px}
.${p}-h{font-size:17px;font-weight:600;color:var(--c50);margin:0;line-height:1.3}
.${p}-sous{font-size:13px;color:var(--c400);margin:0}
.${p}-lus{display:flex;flex-wrap:wrap;gap:4px}
.${p}-lu{display:inline-flex;align-items:center;height:24px;padding:0 6px;border-radius:10px;background:var(--c850);font-size:13px;color:var(--c200)}
.${p}-lu .${p}-n{font-size:13px}
.${p}-groupe{display:flex;flex-direction:column}
.${p}-gt{font-size:13px;color:var(--c400);margin:0 0 4px}
.${p}-sugg{display:flex;align-items:center;gap:8px;min-height:40px;padding:0 8px 0 10px;background:var(--c950);border:1px solid var(--c800);border-bottom-width:0;text-align:left;color:var(--c50)!important}
.${p}-sugg:first-of-type{border-radius:10px 10px 0 0}
.${p}-sugg:last-child{border-radius:0 0 10px 10px;border-bottom-width:1px}
.${p}-sugg span{flex:1}
.${p}-sugg svg{color:var(--c400)}
.${p}-rep{text-align:left;width:100%;display:flex;align-items:center;gap:8px;min-height:36px;font-size:13px;color:var(--c200);border-top:1px solid var(--c800)}
.${p}-rep:first-of-type{border-top:0}
.${p}-rep b{font-weight:600;color:var(--c50)}
.${p}-rep span{flex:1}
.${p}-etat{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 6px;border-radius:10px;font-size:13px;font-weight:600}
.${p}-e-ok{background:var(--hop-f);color:var(--hop-t)}
.${p}-e-err{background:var(--al-f);color:var(--al-t)}
.${p}-garde{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--c400);margin-top:auto}
.${p}-q{align-self:flex-end;max-width:86%;display:flex;flex-direction:column;align-items:flex-end;gap:2px}
.${p}-bulle{margin:0;padding:8px 10px;background:var(--c850);border-radius:16px 16px 4px 16px;color:var(--c50)}
.${p}-meta{font-size:13px;color:var(--c400)}
.${p}-meta .${p}-n{font-size:13px}
.${p}-travail{background:var(--c950);border:1px solid var(--c800);border-radius:16px;padding:8px 10px;display:flex;flex-direction:column;gap:6px}
.${p}-tl{display:flex;align-items:center;gap:8px;font-weight:600;color:var(--c50)}
.${p}-tl span{flex:1}
.${p}-tl .${p}-n{font-size:15px;color:var(--c200)}
.${p}-tourne{color:var(--hop);animation:${p}-rot 1s linear infinite}
@keyframes ${p}-rot{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.${p}-tourne{animation:none}}
.${p}-etapes{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px;font-size:13px}
.${p}-etapes li{display:flex;align-items:center;gap:6px;min-height:22px;color:var(--c400)}
.${p}-etapes li span{flex:1}
.${p}-etapes li .${p}-n{font-size:13px}
.${p}-etapes .${p}-fait svg{color:var(--hop)}
.${p}-etapes .${p}-encours{color:var(--c50);font-weight:600}
.${p}-etapes .${p}-encours svg{color:var(--hop)}
.${p}-duree{display:flex;flex-direction:column;gap:4px;padding-top:6px;border-top:1px solid var(--c800);font-size:13px;color:var(--c400)}
.${p}-piste{position:relative;height:6px;border-radius:3px;background:var(--c850)}
.${p}-zone{position:absolute;top:0;bottom:0;left:27%;right:18%;background:var(--hop-f);border-radius:3px}
.${p}-rempli{position:absolute;top:0;bottom:0;left:0;width:68%;background:var(--hop);border-radius:3px}
.${p}-bornes{display:flex;justify-content:space-between}
.${p}-bornes .${p}-n{font-size:13px}
.${p}-notif{display:flex;align-items:center;gap:8px;min-height:32px;font-size:13px;color:var(--c200);border-top:1px solid var(--c800);padding-top:4px}
.${p}-notif span{flex:1}
.${p}-bascule{width:36px;height:22px;border-radius:11px;background:var(--hop);position:relative}
.${p}-bascule::after{content:"";position:absolute;top:3px;right:3px;width:16px;height:16px;border-radius:50%;background:#fff}
.${p}-enfile{align-self:flex-end;display:flex;flex-direction:column;align-items:flex-end;gap:2px;max-width:86%}
.${p}-enfile .${p}-bulle{background:none;border:1px dashed var(--c700);color:var(--c200)}
.${p}-rep-carte{display:flex;flex-direction:column;gap:8px}
.${p}-ligne1{display:flex;align-items:center;gap:8px}
.${p}-niv{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 8px 0 6px;border-radius:10px;font-size:13px;font-weight:600}
.${p}-niv-at{background:var(--at-f);color:var(--at-t)}
.${p}-niv-info{background:var(--c850);color:var(--c200)}
.${p}-geste{display:flex;gap:8px;align-items:flex-start;padding:8px 10px;background:var(--c950);border:1px solid var(--c800);border-radius:10px;color:var(--c50)}
.${p}-geste svg{margin-top:2px;color:var(--c50)}
.${p}-geste b{font-weight:600}
.${p}-ctrl{display:flex;gap:8px;align-items:center}
.${p}-ctrl svg{color:var(--c400)}
.${p}-ctrl p{margin:0;flex:1}
.${p}-ctrl .${p}-n{color:var(--c50)}
.${p}-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:32px;padding:0 10px;border-radius:10px;font-size:13px!important;font-weight:600!important;white-space:nowrap}
.${p}-btn-s{border:1px solid var(--c700)!important;color:var(--c200)!important;background:var(--c950)!important}
.${p}-btn-p{background:var(--act)!important;color:var(--sur-act)!important}
.${p}-pli{display:flex;align-items:center;gap:6px;min-height:32px;font-size:13px;color:var(--c400);width:100%;text-align:left;border-top:1px solid var(--c800)!important}
.${p}-pli span{flex:1}
.${p}-pli b{color:var(--c200);font-weight:600}
.${p}-prop{background:var(--c950);border:1px solid var(--c800);border-radius:16px;padding:8px 10px;display:flex;flex-direction:column;gap:2px}
.${p}-pt{font-size:13px;color:var(--c400);margin:0 0 2px}
.${p}-mod{display:flex;align-items:center;gap:8px;min-height:32px;color:var(--c50)}
.${p}-mod span{flex:1}
.${p}-case{width:18px;height:18px;border-radius:4px;background:var(--act);color:var(--sur-act);display:grid;place-items:center}
.${p}-avap{font-family:var(--mono);font-variant-numeric:tabular-nums;letter-spacing:-.02em;word-spacing:-.3em}
.${p}-avap s{color:var(--c400)}
.${p}-total{font-size:13px;color:var(--c400);padding:4px 0 6px;border-top:1px solid var(--c800);margin-top:2px}
.${p}-total .${p}-n{font-size:13px;color:var(--c200)}
.${p}-actions{display:flex;justify-content:flex-end;gap:8px}
.${p}-suite{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 10px;border-radius:10px;border:1px solid var(--c700)!important;font-size:13px!important;color:var(--c200)}
.${p}-ancien{display:flex;flex-direction:column;gap:4px;padding:8px 10px;border:1px solid var(--c800);border-radius:16px;background:var(--c950)}
.${p}-ancien .${p}-h{font-size:15px}
.${p}-ancien p{margin:0}
.${p}-statut{display:inline-flex;align-items:center;gap:4px;font-size:13px;color:var(--at-t);font-weight:600}
.${p}-err{background:var(--c950);border:1px solid var(--at);border-radius:16px;padding:10px;display:flex;flex-direction:column;gap:8px}
.${p}-err .${p}-tl svg{color:var(--at-t)}
.${p}-err p{margin:0}
.${p}-err .${p}-actions{justify-content:flex-start}
.${p}-dispo{font-size:13px;color:var(--c400);display:flex;gap:6px;align-items:center;margin:0}
`;

  const accueil = `<div class="${p}-feuille">${entete()}
    <div class="${p}-fil">
      <div class="${p}-salut">
        <h3 class="${p}-h">On regarde ça ensemble.</h3>
        <p class="${p}-sous">Je relis le brassin 31 et son journal à chaque question.</p>
      </div>
      <div class="${p}-lus" data-booster="contexte-lu">
        <span class="${p}-lu">Fermentation ${n('&nbsp;J+4')}</span><span class="${p}-lu">${n('19 °C')}</span><span class="${p}-lu">DF ${n('&nbsp;1,012')}</span><span class="${p}-lu">Dry hop ${n('&nbsp;171 g · 9,0 g/L')}</span><span class="${p}-lu">pH visé ${n('&nbsp;5,3')}</span>
      </div>
      <div class="${p}-groupe">
        <p class="${p}-gt">Pour la fermentation, J+4</p>
        <button class="${p}-sugg" data-booster="suggestion"><span>La pression monte doucement : que faire ?</span>${ico('fleche', 16)}</button>
        <button class="${p}-sugg"><span>Galaxy J+6 : 43 g, c'est assez ?</span>${ico('fleche', 16)}</button>
        <button class="${p}-sugg"><span>Ma DF à 1,012 est-elle atteinte ?</span>${ico('fleche', 16)}</button>
        <button class="${p}-sugg"><span>Combien de jours de garde à 18 °C ?</span>${ico('fleche', 16)}</button>
        <button class="${p}-sugg"><span>Je manque d'eau osmosée</span>${ico('fleche', 16)}</button>
      </div>
      <div class="${p}-groupe">
        <p class="${p}-gt">Reprendre</p>
        <button class="${p}-rep"><span><b>Mes finances</b> · Vérifie mes opérations</span><i class="${p}-etat ${p}-e-ok">${ico('ok', 14)}Prête</i></button>
        <button class="${p}-rep"><span><b>New England IPA</b> · La densité finale est-elle bonne ?</span><i class="${p}-etat ${p}-e-ok">${ico('ok', 14)}Prête</i></button>
        <button class="${p}-rep"><span><b>Brassin 29 · Stout</b> · Le lactose est-il dosé juste ?</span><i class="${p}-etat ${p}-e-err">${ico('relancer', 14)}À relancer</i></button>
      </div>
      <p class="${p}-garde">${ico('bouclier', 14)}Rien ne s'applique sans ta validation.</p>
    </div>${pied()}</div>`;

  const attente = `<div class="${p}-feuille">${entete()}
    <div class="${p}-fil">
      ${question('La fermentation est à 19 °C depuis 36 h et la pression monte doucement : que faire ?', `Approfondi · ${n('22:14')}`)}
      <section class="${p}-travail" data-booster="frise-etapes">
        <div class="${p}-tl">${ico('tourne', 16).replace('<svg', `<svg class="${p}-tourne"`)}<span>Je relis ma proposition</span>${n('2:29')}</div>
        <ol class="${p}-etapes">
          <li class="${p}-fait">${ico('ok', 14)}<span>Lu : brassin 31, journal J+4</span>${n('0:06')}</li>
          <li class="${p}-fait">${ico('ok', 14)}<span>Calculé : dry hop 9,0 g/L, IBU, pH 5,3</span>${n('0:24')}</li>
          <li class="${p}-fait">${ico('ok', 14)}<span>Sources : 3 lues</span>${n('1:10')}</li>
          <li class="${p}-fait">${ico('ok', 14)}<span>Rédigé</span>${n('1:52')}</li>
          <li class="${p}-encours">${ico('relu', 14)}<span>Relu deux fois : 2 sur 2</span></li>
        </ol>
        <div class="${p}-duree" data-booster="jauge-duree">
          <div class="${p}-piste"><i class="${p}-zone"></i><i class="${p}-rempli"></i></div>
          <div class="${p}-bornes"><span>Approfondi : 1 à 3 min</span><span>au plus ${n('3:40')}</span></div>
        </div>
        <div class="${p}-notif">${ico('cloche', 16)}<span>Tu peux continuer ailleurs ; me notifier</span><i class="${p}-bascule" role="switch" aria-checked="true" aria-label="Me notifier à la réponse"></i></div>
      </section>
      <div class="${p}-enfile"><p class="${p}-bulle">Et combien de jours de garde à 18 °C ?</p><span class="${p}-meta">${ico('file', 12)} En file : partira après la réponse</span></div>
    </div>${pied({ mode: 'Approfondi', icm: 'approfondi' })}</div>`;

  const reponse = `<div class="${p}-feuille">${entete(false)}
    <div class="${p}-fil">
      ${question('La fermentation est à 19 °C depuis 36 h et la pression monte doucement : que faire ?', `Approfondi · ${n('22:14')}`)}
      <article class="${p}-rep-carte">
        <div class="${p}-ligne1"><span class="${p}-niv ${p}-niv-at" data-booster="pastille-niveau">${ico('attention', 14)}Attention</span><span class="${p}-meta">${n('22:17')} · relu deux fois</span></div>
        <h3 class="${p}-h">Dry hop chargé : réduis le dernier apport.</h3>
        <div class="${p}-geste">${ico('geste', 16)}<span>Passe <b>Mosaic J+9</b> de ${n('43 g')} à ${n('21 g')}.</span></div>
        <div class="${p}-ctrl">${ico('horloge', 16)}<p>${n('J+9')} : goûte et sens à la purge, note si l'herbacé apparaît.</p><button class="${p}-btn ${p}-btn-s" data-booster="garder-journal">${ico('journal', 14)}Au journal</button></div>
        <button class="${p}-pli"><span><b>Pourquoi</b> · ${n('9,0 g/L')}, au-dessus de ${n('6 à 8 g/L')}</span>${ico('chev', 16)}</button>
      </article>
      <section class="${p}-prop" data-booster="proposition">
        <p class="${p}-pt">Pour la recette · prochain brassin</p>
        <div class="${p}-mod"><i class="${p}-case">${ico('ok', 14)}</i><span>Citra J+2</span><span class="${p}-avap"><s>85</s> → 70 g</span></div>
        <div class="${p}-mod"><i class="${p}-case">${ico('ok', 14)}</i><span>Mosaic J+9</span><span class="${p}-avap"><s>43</s> → 21 g</span></div>
        <div class="${p}-mod"><i class="${p}-case">${ico('ok', 14)}</i><span>Durée du dry hop</span><span class="${p}-avap"><s>2</s> → 3 j</span></div>
        <div class="${p}-total">Dry hop ${n('171 → 134 g')} · ${n('9,0 → 7,1 g/L')}</div>
        <div class="${p}-actions"><button class="${p}-btn ${p}-btn-s">Écarter</button><button class="${p}-btn ${p}-btn-p">Valider 3 modifications</button></div>
      </section>
      <button class="${p}-pli">${ico('relu', 16)}<span>Relu deux fois · calculs refaits · 3 sources</span>${ico('chev', 16)}</button>
    </div>${pied()}</div>`;

  const erreur = `<div class="${p}-feuille">${entete(false)}
    <div class="${p}-fil ${p}-bas">
      ${question('La fermentation est à 19 °C depuis 36 h et la pression monte doucement : que faire ?', `Approfondi · ${n('22:14')}`)}
      <article class="${p}-ancien">
        <div class="${p}-ligne1"><span class="${p}-niv ${p}-niv-at">${ico('attention', 14)}Attention</span><span class="${p}-meta">${n('22:17')} · relu deux fois</span></div>
        <h3 class="${p}-h">Dry hop chargé : réduis le dernier apport.</h3>
        <p>Passe Mosaic J+9 de ${n('43 g')} à ${n('21 g')}.</p>
        <button class="${p}-pli"><span><b>Proposition</b> · 3 modifications à valider</span>${ico('chev', 16)}</button>
      </article>
      ${question('Et combien de jours de garde à 18 °C ?', `${n('22:31')} · gardée sur l'appareil`)}
      <section class="${p}-err" data-booster="envoi-a-confirmer">
        <div class="${p}-tl">${ico('horsligne', 16)}<span>Pas de réseau : envoi à confirmer</span></div>
        <p>Ta question reste sur l'appareil. Elle ne partira qu'une fois, même si tu réessaies.</p>
        <div class="${p}-actions"><button class="${p}-btn ${p}-btn-p">${ico('relancer', 14)}Réessayer l'envoi</button><button class="${p}-btn ${p}-btn-s">${ico('crayon', 14)}Reformuler</button></div>
      </section>
      <p class="${p}-dispo">${ico('appareil', 14)}Le fil et les réponses reçues restent lisibles hors ligne.</p>
    </div>${pied({ bandeau: `<div class="${p}-bande" data-booster="bandeau-hors-ligne">${ico('horsligne', 14)}Hors ligne : ta prochaine question attendra le réseau.</div>` })}</div>`;

  return {
    titre: 'Compacte : la base en une rangée',
    chaleur: 'froide',
    idee: 'La base telle quelle, compactée : en-tête d\'une seule rangée (contexte, conversations, réglages dans un menu), mode dans le champ, réponse ordonnée verdict → geste → prochain contrôle, pastille de niveau.',
    css,
    cadres: [
      { cadre: 'accueil', nom: 'Accueil · jour de brassage, J+4', html: accueil },
      { cadre: 'attente', nom: 'Attente · 2:29, une question en file', html: attente },
      { cadre: 'reponse', nom: 'Réponse · attention, proposition', html: reponse },
      { cadre: 'erreur', nom: 'Erreur · hors ligne, envoi à confirmer', html: erreur },
    ],
  };
};
