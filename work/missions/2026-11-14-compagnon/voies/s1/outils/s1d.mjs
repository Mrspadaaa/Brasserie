// s1d (chaude) : la réponse est une phrase, et ses nombres sont les commandes. La proposition vit dans la phrase :
// chaque valeur changée est une pastille cochée qu'on touche pour la garder ou l'écarter.
export default (p, ico) => {
  const n = (t) => `<span class="${p}-n">${t}</span>`;
  const v = (t, on = true) => `<button class="${p}-val${on ? ` ${p}-val-on` : ''}" role="checkbox" aria-checked="${on}">${on ? ico('ok', 14) : ''}<span class="${p}-n">${t}</span></button>`;
  const haut = (gauche) => `
    <div class="${p}-poignee"></div>
    <header class="${p}-haut">${gauche}<span class="${p}-esp"></span>
      <button class="${p}-ib" aria-label="Mes conversations">${ico('fils', 18)}</button>
      <button class="${p}-ib" aria-label="Réglages : notifier, limites, repartir à zéro">${ico('menu', 18)}</button>
      <button class="${p}-ib" aria-label="Fermer">${ico('x', 18)}</button>
    </header>`;
  const pied = (mode = 1, bandeau = '') => `
    <footer class="${p}-pied">${bandeau}
      <div class="${p}-modes" role="radiogroup" aria-label="Mode" data-booster="modes">${['Rapide', 'Auto', 'Approfondi'].map((m, i) => `<button role="radio" aria-checked="${i === mode}" class="${p}-m${i === mode ? ` ${p}-m-on` : ''}">${m}</button>`).join('')}</div>
      <div class="${p}-champ"><textarea class="${p}-saisie" rows="1" aria-label="Ta question" placeholder="Décris ce que tu observes…"></textarea><button class="${p}-env" aria-label="Envoyer">${ico('envoyer', 18)}</button></div>
    </footer>`;

  const css = `
.${p}-feuille{position:absolute;left:0;right:0;top:32px;bottom:0;background:var(--c950);border-radius:24px 24px 0 0;box-shadow:var(--ombre);display:flex;flex-direction:column;font-size:18px;line-height:1.35;color:var(--c200)}
.${p}-poignee{width:32px;height:4px;border-radius:2px;background:var(--c700);margin:6px auto 0;flex:none}
.${p}-haut{display:flex;align-items:center;gap:4px;height:36px;padding:0 4px 0 14px;flex:none;font-size:13px;color:var(--c400)}
.${p}-esp{flex:1}
.${p}-ib{width:32px;height:32px;display:grid;place-items:center;border-radius:10px;color:var(--c400)}
.${p}-niv{display:inline-flex;align-items:center;gap:6px;font-weight:600}
.${p}-niv-at{color:var(--at-t)}
.${p}-fil{flex:1;min-height:0;overflow:hidden;padding:4px 14px 12px;display:flex;flex-direction:column;gap:12px}
.${p}-cite{margin:0;font-size:13px;color:var(--c400);display:flex;gap:6px}
.${p}-cite>span{display:block;max-height:2.8em;overflow:hidden}
.${p}-titre{margin:0;font-size:18px;font-weight:600;color:var(--c50);line-height:1.25}
.${p}-phrase{margin:0;font-size:22px;line-height:1.5;color:var(--c50);font-weight:400}
.${p}-phrase .${p}-n{letter-spacing:-.03em;word-spacing:-.3em}
.${p}-old{color:var(--c400);text-decoration:line-through;text-decoration-thickness:2px}
.${p}-val{display:inline-flex;align-items:center;gap:4px;height:34px;padding:0 8px 0 6px;margin:0 1px;border-radius:10px;border:1px dashed var(--c700)!important;color:var(--c400);vertical-align:baseline;font-size:22px!important}
.${p}-val-on{background:var(--at-f)!important;border:1px solid var(--at)!important;color:var(--c50)!important}
.${p}-val-on svg{color:var(--at-t)}
.${p}-suite{margin:0;font-size:18px;line-height:1.45;color:var(--c200)}
.${p}-suite b{font-weight:600;color:var(--c50)}
.${p}-sep{height:1px;background:var(--c800);flex:none}
.${p}-act{display:flex;align-items:center;gap:8px}
.${p}-act .${p}-quoi{flex:1;font-size:13px;color:var(--c400)}
.${p}-btn{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:10px;font-size:13px;font-weight:600;white-space:nowrap}
.${p}-btn-s{border:1px solid var(--c700)!important;color:var(--c200)}
.${p}-btn-p{background:var(--act)!important;color:var(--sur-act)!important}
.${p}-plis{display:flex;flex-direction:column}
.${p}-pli{display:flex;align-items:center;gap:8px;min-height:36px;width:100%;font-size:13px;color:var(--c400);border-top:1px solid var(--c800)!important}
.${p}-pli span{flex:1}
.${p}-pli b{font-weight:600;color:var(--c200)}
.${p}-pied{flex:none;padding:6px 8px 8px;border-top:1px solid var(--c800);background:var(--c900)}
.${p}-modes{display:flex;gap:2px;margin:0 0 6px;padding:2px;border-radius:10px;background:var(--c850);width:max-content}
.${p}-m{height:28px;padding:0 10px;border-radius:8px;font-size:13px;font-weight:600;color:var(--c400)}
.${p}-m-on{background:var(--c950)!important;color:var(--c50)!important;box-shadow:0 1px 2px rgba(0,0,0,.12)}
.${p}-champ{display:flex;align-items:center;gap:4px;min-height:44px;padding:4px 4px 4px 10px;background:var(--c950);border:1px solid var(--c700);border-radius:10px}
.${p}-saisie{flex:1;min-width:0;resize:none;border:0;background:none;outline:0;font:16px/1.3 var(--sans);color:var(--c50);padding:6px 0}
.${p}-saisie::placeholder{color:var(--c400)}
.${p}-env{width:36px;height:36px;border-radius:10px;background:var(--c850);color:var(--c400);display:grid;place-items:center}
.${p}-amorces{display:flex;flex-wrap:wrap;gap:6px}
.${p}-amorce{display:inline-flex;align-items:center;gap:4px;height:36px;padding:0 12px;border-radius:10px;border:1px solid var(--c700)!important;font-size:18px!important;color:var(--c50)}
.${p}-amorce i{font-style:normal;color:var(--c400)}
.${p}-fait{color:var(--c400)}
.${p}-cur{color:var(--c50);font-weight:600}
.${p}-cur::after{content:"";display:inline-block;width:2px;height:1em;margin-left:3px;vertical-align:-2px;background:var(--hop);animation:${p}-cl 1s steps(1) infinite}
@keyframes ${p}-cl{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){.${p}-cur::after{animation:none}}
.${p}-chrono{font:600 22px/1 var(--mono);font-variant-numeric:tabular-nums;color:var(--c50)}
.${p}-bascule{width:36px;height:22px;border-radius:11px;background:var(--hop);position:relative;flex:none}
.${p}-bascule::after{content:"";position:absolute;top:3px;right:3px;width:16px;height:16px;border-radius:50%;background:#fff}
.${p}-file{display:flex;align-items:center;gap:8px;min-height:36px;padding:0 10px;border:1px dashed var(--c700);border-radius:10px;font-size:13px;color:var(--c400)}
.${p}-file b{flex:1;font-weight:400;color:var(--c200)}
.${p}-bandeau{display:flex;align-items:center;gap:6px;min-height:24px;margin:0 0 6px;font-size:13px;color:var(--c200)}
.${p}-bandeau svg{color:var(--at-t)}
.${p}-q{margin:0;padding:8px 12px;border-radius:16px;background:var(--c850);color:var(--c50);font-size:18px}
`;

  const accueil = `<div class="${p}-feuille">${haut(`<span>Compagnon · New England IPA</span>`)}
    <div class="${p}-fil">
      <p class="${p}-phrase" data-booster="phrase-contexte">Brassin 31, ${n('J+4')}, à ${n('19 °C')}. DF ${n('1,012')}, la cible est atteinte. Prochain geste : <b>Galaxy ${n('43 g')}</b> à ${n('J+6')}.</p>
      <div class="${p}-sep"></div>
      <h3 class="${p}-titre">Qu'est-ce que tu observes ?</h3>
      <div class="${p}-amorces" data-booster="amorces">
        <button class="${p}-amorce">La pression monte<i>…</i></button>
        <button class="${p}-amorce">Ça sent<i>…</i></button>
        <button class="${p}-amorce">La densité est à<i>…</i></button>
        <button class="${p}-amorce">Le goût est<i>…</i></button>
        <button class="${p}-amorce">La mousse<i>…</i></button>
      </div>
      <p class="${p}-suite">Commence la phrase, je la lis avec ta recette et ton journal.</p>
      <div class="${p}-plis" style="margin-top:auto">
        <button class="${p}-pli">${ico('fils', 16)}<span><b>Mes conversations</b> · 2 réponses prêtes</span>${ico('droite', 16)}</button>
        <button class="${p}-pli">${ico('bouclier', 16)}<span>Rien ne s'applique sans ta validation</span></button>
      </div>
    </div>${pied(1)}</div>`;

  const attente = `<div class="${p}-feuille">${haut(`<span class="${p}-chrono">2:29</span><span>&nbsp;· Approfondi, ${n('1 à 3 min')}</span>`)}
    <div class="${p}-fil">
      <p class="${p}-cite">${ico('fils', 14)}<span>La fermentation est à 19 °C depuis 36 h et la pression monte doucement : que faire ?</span></p>
      <p class="${p}-phrase" data-booster="phrase-en-cours"><span class="${p}-fait">J'ai lu le brassin 31 et son journal. J'ai calculé ${n('9,0 g/L')} de dry hop, l'IBU et le pH. J'ai lu 3 sources.</span> <span class="${p}-cur">Je relis ma proposition, deuxième fois</span></p>
      <div class="${p}-sep"></div>
      <div class="${p}-act">${ico('cloche', 18)}<span class="${p}-quoi">Tu peux continuer ailleurs. Me notifier à la réponse.</span><i class="${p}-bascule" role="switch" aria-checked="true" aria-label="Me notifier à la réponse"></i></div>
      <div class="${p}-file">${ico('file', 16)}<b>Et combien de jours de garde à 18 °C ?</b>en file</div>
      <p class="${p}-cite" style="margin-top:auto">${ico('horloge', 14)}<span>Au plus ${n('3:40')} ; au-delà, je te dis ce qui bloque.</span></p>
    </div>${pied(2)}</div>`;

  const reponse = `<div class="${p}-feuille">${haut(`<span class="${p}-niv ${p}-niv-at" data-booster="niveau">${ico('attention', 16)}Attention</span><span>&nbsp;· relu deux fois</span>`)}
    <div class="${p}-fil">
      <p class="${p}-cite">${ico('fils', 14)}<span>La fermentation est à 19 °C depuis 36 h et la pression monte doucement : que faire ?</span></p>
      <h3 class="${p}-titre">Dry hop chargé : réduis le dernier apport.</h3>
      <p class="${p}-phrase" data-booster="valeurs-dans-la-phrase">Passe Mosaic J+9 de <span class="${p}-old ${p}-n">43 g</span> à ${v('21 g')}. Pour la recette, Citra J+2 à ${v('70 g')} et un dry hop de ${v('3 j')}.</p>
      <p class="${p}-suite">Puis à <b>${n('J+9')}</b>, à la purge : goûte et sens, note si l'herbacé apparaît.</p>
      <div class="${p}-act"><span class="${p}-quoi">Touche une valeur pour l'écarter.</span><button class="${p}-btn ${p}-btn-s">Écarter</button><button class="${p}-btn ${p}-btn-p">Valider 3 modifications</button></div>
      <div class="${p}-plis">
        <button class="${p}-pli" data-booster="garder-journal">${ico('journal', 16)}<span><b>Garder « J+9, goûter à la purge »</b> au journal</span></button>
        <button class="${p}-pli">${ico('calcul', 16)}<span><b>Pourquoi</b> · ${n('9,0 → 7,1 g/L')}, herbacé en fin de garde</span>${ico('chev', 16)}</button>
        <button class="${p}-pli">${ico('relu', 16)}<span><b>Relu deux fois</b> · calculs refaits · 3 sources</span>${ico('chev', 16)}</button>
      </div>
    </div>${pied(1)}</div>`;

  const erreur = `<div class="${p}-feuille">${haut(`<span class="${p}-niv">${ico('horsligne', 16)}Hors ligne</span>`)}
    <div class="${p}-fil">
      <p class="${p}-cite">${ico('attention', 14)}<span>Dernier conseil, ${n('22:17')} : passe Mosaic J+9 de ${n('43 g')} à ${n('21 g')}.</span></p>
      <p class="${p}-q">Et combien de jours de garde à 18 °C ?</p>
      <p class="${p}-phrase" data-booster="phrase-erreur">Pas de réseau : envoi à confirmer. Ta question reste ici, et ne partira <b>qu'une fois</b>.</p>
      <div class="${p}-act"><span class="${p}-quoi">${n('22:31')} · gardée sur l'appareil</span><button class="${p}-btn ${p}-btn-s">${ico('crayon', 14)}Reformuler</button><button class="${p}-btn ${p}-btn-p">${ico('relancer', 14)}Réessayer</button></div>
      <div class="${p}-plis" style="margin-top:auto">
        <button class="${p}-pli">${ico('appareil', 16)}<span>Le fil et les réponses reçues restent lisibles.</span></button>
      </div>
    </div>${pied(1, `<div class="${p}-bandeau" data-booster="bandeau-hors-ligne">${ico('horsligne', 14)}Hors ligne : la prochaine question attendra le réseau.</div>`)}</div>`;

  return {
    titre: 'La phrase qui agit',
    chaleur: 'chaude',
    idee: 'La réponse est une phrase en gros, et ses nombres sont les commandes : chaque valeur proposée est une pastille cochée dans la phrase, qu\'on touche pour l\'écarter. L\'accueil se lit aussi en phrase, et la question s\'amorce par une observation.',
    css,
    cadres: [
      { cadre: 'accueil', nom: 'Accueil · jour de brassage, J+4', html: accueil },
      { cadre: 'attente', nom: 'Attente · 2:29, une question en file', html: attente },
      { cadre: 'reponse', nom: 'Réponse · attention, proposition', html: reponse },
      { cadre: 'erreur', nom: 'Erreur · hors ligne, envoi à confirmer', html: erreur },
    ],
  };
};
