// s1c (tiède) : trois lignes fixes « Fais · Pourquoi · Ensuite », une phrase chacune, chacune dépliable ;
// « relu » en une ligne de ce qui a été contrôlé. La même grammaire sert l'accueil, l'attente et l'erreur.
export default (p, ico) => {
  const n = (t) => `<span class="${p}-n">${t}</span>`;
  const entete = (onglet = 0) => `
    <div class="${p}-poignee"></div>
    <header class="${p}-entete">
      <div class="${p}-onglets" role="tablist" data-booster="onglets-vue">
        <button role="tab" aria-selected="${onglet === 0}" class="${p}-ong${onglet === 0 ? ` ${p}-ong-on` : ''}">Ce brassin</button>
        <button role="tab" aria-selected="${onglet === 1}" class="${p}-ong${onglet === 1 ? ` ${p}-ong-on` : ''}">Mes conversations <i class="${p}-compte">2</i></button>
      </div>
      <button class="${p}-ib" aria-label="Réglages : notifier, limites, repartir à zéro">${ico('menu', 18)}</button>
      <button class="${p}-ib" aria-label="Fermer">${ico('x', 18)}</button>
    </header>`;
  const pied = ({ mode = 'Auto', bandeau = '' } = {}) => `
    <footer class="${p}-pied">${bandeau}
      <div class="${p}-champ">
        <textarea class="${p}-saisie" rows="1" aria-label="Ta question" placeholder="Décris ce que tu observes…"></textarea>
        <div class="${p}-envoi" data-booster="envoi-mode"><button class="${p}-envmode" aria-label="Mode ${mode}, changer">${mode}${ico('chev', 14)}</button><button class="${p}-env" aria-label="Envoyer">${ico('envoyer', 18)}</button></div>
      </div>
    </footer>`;
  const ligne = (lab, txt, { cls = '', fin = ico('chev', 16), booster = '' } = {}) =>
    `<div class="${p}-l ${cls}"${booster ? ` data-booster="${booster}"` : ''}><span class="${p}-lab">${lab}</span><span class="${p}-txt">${txt}</span>${fin}</div>`;
  const bulle = (t, meta) => `<div class="${p}-q"><p class="${p}-bulle">${t}</p>${meta ? `<span class="${p}-meta">${meta}</span>` : ''}</div>`;

  const css = `
.${p}-feuille{position:absolute;left:0;right:0;top:44px;bottom:0;background:var(--c900);border-radius:24px 24px 0 0;box-shadow:var(--ombre);display:flex;flex-direction:column;font-size:15px;line-height:1.4}
.${p}-poignee{width:32px;height:4px;border-radius:2px;background:var(--c700);margin:6px auto 0;flex:none}
.${p}-entete{display:flex;align-items:center;gap:4px;height:40px;padding:0 4px 0 8px;flex:none}
.${p}-onglets{flex:1;display:flex;gap:2px;padding:2px;border-radius:10px;background:var(--c850);min-width:0}
.${p}-ong{flex:1;height:28px;border-radius:8px;font-size:13px;font-weight:600;color:var(--c400);text-align:center!important;white-space:nowrap}
.${p}-ong-on{background:var(--c950)!important;color:var(--c50)!important;box-shadow:0 1px 2px rgba(0,0,0,.12)}
.${p}-compte{display:inline-grid;place-items:center;min-width:18px;height:18px;margin-left:2px;border-radius:9px;background:var(--hop);color:#fff;font:600 13px/1 var(--sans);font-style:normal;padding:0 4px}
.${p}-ib{width:32px;height:32px;display:grid;place-items:center;border-radius:10px;color:var(--c400)}
.${p}-fil{flex:1;min-height:0;overflow:hidden;padding:8px 12px 12px;display:flex;flex-direction:column;gap:12px}
.${p}-bas{justify-content:flex-end}
.${p}-pied{flex:none;padding:8px;border-top:1px solid var(--c800)}
.${p}-champ{display:flex;align-items:center;gap:6px;min-height:44px;padding:4px 4px 4px 8px;background:var(--c950);border:1px solid var(--c700);border-radius:10px}
.${p}-saisie{flex:1;min-width:0;resize:none;border:0;background:none;outline:0;font:16px/1.3 var(--sans);color:var(--c50);padding:6px 0}
.${p}-saisie::placeholder{color:var(--c400)}
.${p}-envoi{display:flex;height:36px;border-radius:10px;background:var(--c850);overflow:hidden}
.${p}-envmode{display:flex;align-items:center;gap:2px;padding:0 6px 0 10px;font-size:13px;font-weight:600;color:var(--c200);border-right:1px solid var(--c700)!important}
.${p}-env{width:36px;display:grid;place-items:center;color:var(--c400)}
.${p}-bandeau{display:flex;align-items:center;gap:6px;min-height:28px;padding:0 2px 6px;font-size:13px;color:var(--c200)}
.${p}-bandeau svg{color:var(--at-t)}
.${p}-h{margin:0;font-size:17px;font-weight:600;color:var(--c50);line-height:1.3}
.${p}-sous{margin:0;font-size:13px;color:var(--c400)}
.${p}-entl{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--c400)}
.${p}-niv{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 8px 0 6px;border-radius:10px;font-size:13px;font-weight:600}
.${p}-niv-at{background:var(--at-f);color:var(--at-t)}
.${p}-niv-info{background:var(--hop-f);color:var(--hop-t)}
.${p}-niv-n{background:var(--c850);color:var(--c200)}
.${p}-bloc{display:flex;flex-direction:column;gap:6px}
.${p}-lignes{background:var(--c950);border:1px solid var(--c800);border-radius:16px;overflow:hidden}
.${p}-l{display:grid;grid-template-columns:76px 1fr 16px;align-items:center;gap:8px;min-height:44px;padding:6px 10px;border-top:1px solid var(--c800)}
.${p}-l:first-child{border-top:0}
.${p}-l svg{color:var(--c400)}
.${p}-lab{font-size:13px;font-weight:600;color:var(--c400)}
.${p}-txt{color:var(--c200);min-width:0}
.${p}-fais .${p}-lab{color:var(--at-t)}
.${p}-fais .${p}-txt{color:var(--c50);font-weight:600}
.${p}-fais-info .${p}-lab{color:var(--hop-t)}
.${p}-fais-info .${p}-txt{color:var(--c50);font-weight:600}
.${p}-intent .${p}-txt{color:var(--c50)}
.${p}-intent .${p}-lab{color:var(--c200)}
.${p}-relu{display:flex;align-items:center;gap:6px;min-height:28px;width:100%;font-size:13px;color:var(--c400)}
.${p}-relu span{flex:1}
.${p}-relu b{font-weight:600;color:var(--c200)}
.${p}-q{align-self:flex-end;max-width:86%;display:flex;flex-direction:column;align-items:flex-end;gap:2px}
.${p}-bulle{margin:0;padding:8px 10px;background:var(--c850);border-radius:16px 16px 4px 16px;color:var(--c50)}
.${p}-meta{font-size:13px;color:var(--c400)}
.${p}-enfile .${p}-bulle{background:none;border:1px dashed var(--c700);color:var(--c200)}
.${p}-squel{display:block;height:10px;border-radius:5px;background:var(--c850);margin:5px 0}
.${p}-squel+.${p}-squel{width:62%}
.${p}-attente .${p}-txt small{display:block;font-size:13px;color:var(--c400)}
.${p}-ok{color:var(--hop)!important}
.${p}-tourne{color:var(--hop)!important;animation:${p}-rot 1s linear infinite}
@keyframes ${p}-rot{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.${p}-tourne{animation:none}}
.${p}-pied-att{display:flex;align-items:center;gap:8px;min-height:40px;padding:4px 10px;border-top:1px solid var(--c800);font-size:13px;color:var(--c400)}
.${p}-pied-att span{flex:1}
.${p}-bascule{width:36px;height:22px;border-radius:11px;background:var(--hop);position:relative;flex:none}
.${p}-bascule::after{content:"";position:absolute;top:3px;right:3px;width:16px;height:16px;border-radius:50%;background:#fff}
.${p}-prop{background:var(--c950);border:1px solid var(--c800);border-radius:16px;padding:6px 10px 10px}
.${p}-mod{display:grid;grid-template-columns:20px 1fr auto;align-items:center;gap:8px;min-height:34px;color:var(--c50)}
.${p}-case{width:20px;height:20px;border-radius:4px;background:var(--act);color:var(--sur-act);display:grid;place-items:center}
.${p}-av{font-family:var(--mono);font-variant-numeric:tabular-nums;letter-spacing:-.02em;word-spacing:-.3em}
.${p}-av s{color:var(--c400)}
.${p}-actions{display:flex;justify-content:flex-end;gap:8px;padding-top:6px}
.${p}-btn{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:10px;font-size:13px;font-weight:600;white-space:nowrap}
.${p}-btn-s{border:1px solid var(--c700)!important;color:var(--c200);background:var(--c950)}
.${p}-btn-p{background:var(--act)!important;color:var(--sur-act)!important}
.${p}-jrn{width:32px;height:32px;display:grid;place-items:center;border-radius:10px;border:1px solid var(--c700)!important;color:var(--c200)}
.${p}-l .${p}-jrn svg{color:var(--c200)}
.${p}-l-btns{grid-template-columns:76px 1fr}
.${p}-l-btns .${p}-txt{display:flex;gap:8px;flex-wrap:wrap}
`;

  const accueil = `<div class="${p}-feuille">${entete(0)}
    <div class="${p}-fil">
      <div class="${p}-bloc">
        <h3 class="${p}-h">On regarde ça ensemble.</h3>
        <p class="${p}-sous">Brassin 31 · ${n('J+4 · 19 °C · DF 1,012 · dry hop 9,0 g/L')}</p>
      </div>
      <div class="${p}-lignes" data-booster="trois-intentions">
        ${ligne('Agir ?', 'La pression monte doucement : que faire ?', { cls: `${p}-intent`, fin: ico('fleche', 16) })}
        ${ligne('Mesurer ?', 'Que goûter avant le dry hop Galaxy J+6 ?', { cls: `${p}-intent`, fin: ico('fleche', 16) })}
        ${ligne('Attendre ?', 'DF à 1,012 : je laisse finir à 19 °C ?', { cls: `${p}-intent`, fin: ico('fleche', 16) })}
        ${ligne('Autre', 'Combien de jours de garde à 18 °C ?', { cls: `${p}-intent`, fin: ico('fleche', 16) })}
      </div>
      <div class="${p}-bloc">
        <div class="${p}-entl"><span class="${p}-niv ${p}-niv-info">${ico('info', 14)}Info</span><span>Dernier conseil · hier ${n('22:00')}</span></div>
        <div class="${p}-lignes">
          ${ligne('Fais', 'Rien à changer : passe au dry hop prévu.', { cls: `${p}-fais-info` })}
          ${ligne('Pourquoi', `DF relevée ${n('1,012')} = DF visée.`)}
          ${ligne('Ensuite', `${n('J+6')} : dry hop Galaxy ${n('43 g')}.`, { fin: ico('ok', 16).replace('<svg', `<svg class="${p}-ok"`) })}
        </div>
      </div>
      <p class="${p}-sous" style="margin-top:auto">Rien ne s'applique sans ta validation.</p>
    </div>${pied()}</div>`;

  const attente = `<div class="${p}-feuille">${entete(0)}
    <div class="${p}-fil">
      ${bulle('La fermentation est à 19 °C depuis 36 h et la pression monte doucement : que faire ?', `Approfondi · ${n('22:14')}`)}
      <div class="${p}-bloc">
        <div class="${p}-entl">${ico('tourne', 16).replace('<svg', `<svg class="${p}-tourne"`)}<span style="flex:1">Je relis ma proposition, deuxième fois</span>${n('2:29')}</div>
        <div class="${p}-lignes ${p}-attente" data-booster="trois-lignes-en-cours">
          ${ligne('Fais', `<i class="${p}-squel"></i><small>rédigé, en relecture</small>`, { fin: ico('relu', 16) })}
          ${ligne('Pourquoi', `Calculs faits : ${n('9,0 g/L')}, IBU, pH ${n('5,3')}.<small>3 sources lues</small>`, { fin: ico('ok', 16).replace('<svg', `<svg class="${p}-ok"`) })}
          ${ligne('Ensuite', `<i class="${p}-squel"></i><i class="${p}-squel"></i>`, { fin: ico('relu', 16) })}
          <div class="${p}-pied-att" data-booster="notifier">${ico('cloche', 16)}<span>Approfondi : ${n('1 à 3 min')}, au plus ${n('3:40')}. Me notifier</span><i class="${p}-bascule" role="switch" aria-checked="true" aria-label="Me notifier à la réponse"></i></div>
        </div>
        <button class="${p}-relu">${ico('lire', 16)}<span>Lu : brassin 31, journal ${n('J+4')}, recette · tu peux continuer ailleurs</span></button>
      </div>
      <div class="${p}-q ${p}-enfile"><p class="${p}-bulle">Et combien de jours de garde à 18 °C ?</p><span class="${p}-meta">En file : partira après la réponse</span></div>
    </div>${pied({ mode: 'Approfondi' })}</div>`;

  const reponse = `<div class="${p}-feuille">${entete(0)}
    <div class="${p}-fil ${p}-bas">
      ${bulle('La fermentation est à 19 °C depuis 36 h et la pression monte doucement : que faire ?', '')}
      <div class="${p}-bloc">
        <div class="${p}-entl"><span class="${p}-niv ${p}-niv-at" data-booster="pastille-niveau">${ico('attention', 14)}Attention</span><span>${n('22:17')}</span></div>
        <h3 class="${p}-h">Dry hop chargé : réduis le dernier apport.</h3>
        <div class="${p}-lignes" data-booster="trois-lignes">
          ${ligne('Fais', `Passe Mosaic J+9 de ${n('43 g')} à ${n('21 g')}.`, { cls: `${p}-fais` })}
          ${ligne('Pourquoi', `${n('9,0 g/L')} : l'herbacé guette en fin de garde.`)}
          ${ligne('Ensuite', `${n('J+9')}, à la purge : goûte, note l'herbacé.`, { fin: `<button class="${p}-jrn" aria-label="Garder au journal" data-booster="garder-journal">${ico('journal', 16)}</button>` })}
        </div>
        <button class="${p}-relu" data-booster="relu">${ico('relu', 16)}<span><b>Relu deux fois</b> · calculs refaits · 3 sources lues</span>${ico('chev', 16)}</button>
      </div>
      <section class="${p}-prop" data-booster="proposition">
        <p class="${p}-sous" style="margin:0 0 2px">À la recette, pour le prochain brassin</p>
        <div class="${p}-mod"><i class="${p}-case">${ico('ok', 14)}</i><span>Citra J+2</span><span class="${p}-av"><s>85</s> → 70 g</span></div>
        <div class="${p}-mod"><i class="${p}-case">${ico('ok', 14)}</i><span>Mosaic J+9</span><span class="${p}-av"><s>43</s> → 21 g</span></div>
        <div class="${p}-mod"><i class="${p}-case">${ico('ok', 14)}</i><span>Durée du dry hop</span><span class="${p}-av"><s>2</s> → 3 j</span></div>
        <div class="${p}-actions"><button class="${p}-btn ${p}-btn-s">Écarter</button><button class="${p}-btn ${p}-btn-p">Valider 3 modifications</button></div>
      </section>
    </div>${pied()}</div>`;

  const erreur = `<div class="${p}-feuille">${entete(0)}
    <div class="${p}-fil ${p}-bas">
      <div class="${p}-bloc">
        <div class="${p}-entl"><span class="${p}-niv ${p}-niv-at">${ico('attention', 14)}Attention</span><span>${n('22:17')} · Dry hop chargé</span></div>
        <div class="${p}-lignes">
          ${ligne('Fais', `Passe Mosaic J+9 de ${n('43 g')} à ${n('21 g')}.`, { cls: `${p}-fais` })}
          ${ligne('Ensuite', `${n('J+9')}, à la purge : goûte, note l'herbacé.`, { fin: ico('ok', 16).replace('<svg', `<svg class="${p}-ok"`) })}
        </div>
      </div>
      ${bulle('Et combien de jours de garde à 18 °C ?', `${n('22:31')}`)}
      <div class="${p}-bloc">
        <div class="${p}-entl"><span class="${p}-niv ${p}-niv-n">${ico('horsligne', 14)}Envoi à confirmer</span><span>pas de réseau</span></div>
        <div class="${p}-lignes" data-booster="erreur-trois-lignes">
          ${ligne('Problème', 'Réception non confirmée : pas de réseau.', { fin: '' }).replace(`${p}-l"`, `${p}-l ${p}-l-btns"`)}
          ${ligne('Question', 'Gardée sur l\'appareil, envoyée une seule fois.', { fin: '' }).replace(`${p}-l"`, `${p}-l ${p}-l-btns"`)}
          <div class="${p}-l ${p}-l-btns"><span class="${p}-lab">Ensuite</span><span class="${p}-txt"><button class="${p}-btn ${p}-btn-p">${ico('relancer', 14)}Réessayer l'envoi</button><button class="${p}-btn ${p}-btn-s">${ico('crayon', 14)}Reformuler</button></span></div>
        </div>
      </div>
    </div>${pied({ bandeau: `<div class="${p}-bandeau" data-booster="bandeau-hors-ligne">${ico('horsligne', 14)}Hors ligne : le fil reste lisible, l'envoi attendra.</div>` })}</div>`;

  return {
    titre: 'Fais · Pourquoi · Ensuite',
    chaleur: 'tiède',
    idee: 'Trois lignes fixes, une phrase chacune, chacune dépliable ; une ligne dit ce qui a été relu. La même grammaire range l\'accueil (agir, mesurer, attendre), l\'attente et l\'erreur.',
    css,
    cadres: [
      { cadre: 'accueil', nom: 'Accueil · jour de brassage, J+4', html: accueil },
      { cadre: 'attente', nom: 'Attente · 2:29, une question en file', html: attente },
      { cadre: 'reponse', nom: 'Réponse · attention, proposition', html: reponse },
      { cadre: 'erreur', nom: 'Erreur · hors ligne, envoi à confirmer', html: erreur },
    ],
  };
};
