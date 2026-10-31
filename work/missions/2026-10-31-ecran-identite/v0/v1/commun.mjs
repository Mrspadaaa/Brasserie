// Série v (lot v0 Identité) : les éléments communs aux 7 étapes, montrés tels qu'à l'écran (J12, hors périmètre) :
// en-tête « ‹ Identité 1/7 · Abandonner · import · thème », fil des 7 étapes, bandeau Grain · OG · IBU · EBC,
// lanceur + et pied « Retour · Suivant ». Repris de BrewWizard.tsx (l. 2121–2310), WizardStepBar.tsx et
// recipe-wizard.css, thème clair de DESIGN.md. Chaque page préfixe ses classes par son id (L26).
// Usage : import { page } from '../v1/commun.mjs' ; page({ p, titre, css, corps, js }) rend le HTML complet.

export const C = {
  page: '#FFFFFF', panneau: '#F5F5F5', surface: '#EBEBEB', bord: '#DDDDDD', bordM: '#BFBFBF', trait: '#9E9E9E',
  t2: '#666666', t1: '#333333', t0: '#111111', hop: '#567F45', hopT: '#3F6B2E', eau: '#4F7E9B', eauT: '#2F5F7D',
  alerte: '#C8382F', alerteT: '#A8291F', att: '#9C7020', attT: '#7F5B10', paille: '#F2C14E', or: '#E0A02E',
};

// Les données de démonstration : sa recette « neipa v3 » (brief) et le style 22A du catalogue
// (src/data/brewingStylesBootstrap.json, BJCP 2021). FG et alcool dépendent de la levure (étape 4) : inconnus ici.
export const RECETTE = { nom: 'neipa v3', style: 'Double IPA', volume: 24, ebu: 60, og: 1.080, ibu: 93, ebc: 9.5, grain: 8.6,
  cuve: 'Royal Catering · cuve 45 L', fermenteur: 30 };
export const STYLES = {
  '22A': { nom: 'Double IPA', og: [1.065, 1.085], fg: [1.008, 1.018], abv: [7.5, 10], ibu: [60, 100], srm: [6, 14] },
  '21C': { nom: 'Hazy IPA', og: [1.060, 1.085], fg: [1.010, 1.015], abv: [6, 9], ibu: [25, 60], srm: [3, 7] },
  '21A': { nom: 'American IPA', og: [1.056, 1.070], fg: [1.008, 1.014], abv: [5.5, 7.5], ibu: [40, 70], srm: [6, 14] },
  '22B': { nom: 'American Strong Ale', og: [1.062, 1.090], fg: [1.014, 1.024], abv: [6.3, 10], ibu: [50, 100], srm: [7, 18] },
  '22C': { nom: 'American Barleywine', og: [1.080, 1.120], fg: [1.016, 1.030], abv: [8, 12], ibu: [50, 100], srm: [9, 18] },
  '18B': { nom: 'American Pale Ale', og: [1.045, 1.060], fg: [1.010, 1.015], abv: [4.5, 6.2], ibu: [30, 50], srm: [5, 10] },
  '12C': { nom: 'English IPA', og: [1.050, 1.070], fg: [1.010, 1.015], abv: [5, 7.5], ibu: [40, 60], srm: [6, 14] },
};
// SRM → EBC (× 1,97), arrondi à l'unité : conversion d'affichage, le catalogue reste en SRM.
export const ebc = (srm) => Math.round(srm * 1.97);
export const sg = (x) => x.toFixed(3).replace('.', ',');
export const fr = (x, d = 1) => x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

const svg = (d, w = 16) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICO = {
  gauche: svg('<path d="m15 18-6-6 6-6"/>'),
  coller: svg('<path d="M15 2H9a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1Z"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2"/><path d="M16 4h2a2 2 0 0 1 2 2v2"/><path d="M11 14h10"/><path d="m17 10 4 4-4 4"/>', 15),
  lune: svg('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
  plus: svg('<path d="M5 12h14"/><path d="M12 5v14"/>', 24),
  chevron: svg('<path d="m6 9 6 6 6-6"/>', 16),
  crayon: svg('<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>', 13),
};

const ETAPES = ['Identité', 'Malts/sucres', 'Houblons', 'Levure', 'Paliers', 'Eau', 'Récap.'];

function cssCommun(p) {
  return `
  *{box-sizing:border-box} [hidden]{display:none!important} html,body{margin:0;background:${C.page}}
  body{font-family:'Source Sans 3',system-ui,sans-serif;color:${C.t0};font-size:14px;line-height:1.35;-webkit-font-smoothing:antialiased}
  .${p}{max-width:390px;margin:0 auto;min-height:844px;position:relative;padding-bottom:72px}
  .${p} button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
  .${p} .${p}-mono{font-family:'IBM Plex Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
  .${p}-hd{padding:0 8px;background:${C.page}}
  .${p}-tb{display:flex;align-items:center;gap:6px;min-height:36px;padding-block:2px}
  .${p} .${p}-ic{width:28px;height:28px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:${C.t2};flex:none}
  .${p}-tt{flex:1;min-width:0;display:flex;align-items:baseline;gap:6px;margin:0}
  .${p}-tt b{font-size:16px;font-weight:600;color:${C.t0}} .${p}-tt span{font-family:'IBM Plex Mono',monospace;font-size:14px;color:${C.t2}}
  .${p} .${p}-ab{height:28px;padding:0 6px;font-size:12px;color:${C.t1};text-decoration:underline;text-underline-offset:2px;flex:none}
  .${p}-rail{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none}
  .${p} .${p}-rail button{display:flex;flex-direction:column;justify-content:center;gap:4px;min-height:28px;padding:0 4px;flex:none}
  .${p}-rail span{font-size:12px;color:${C.t2};white-space:nowrap}
  .${p}-rail i{display:block;height:6px;border-radius:9px;background:${C.bord}}
  .${p}-rail [aria-current] span{color:${C.t0};font-weight:600} .${p}-rail [aria-current] i{background:${C.t0}}
  .${p}-bd{margin:6px 8px 0;display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:5px 10px;border:1px solid ${C.bord};background:${C.panneau};border-radius:16px}
  .${p}-bd>div{display:flex;align-items:baseline;gap:4px}
  .${p}-bd .${p}-bl{font-size:13px;color:${C.t2}} .${p}-bd .${p}-bv{font-family:'IBM Plex Mono',monospace;font-variant-numeric:tabular-nums;font-weight:600;font-size:14px;white-space:nowrap}
  .${p}-bp{position:relative;align-self:center;width:48px;height:8px;border-radius:9px;background:${C.bord}}
  .${p}-bp i{position:absolute;top:0;bottom:0;border-radius:9px;background:${C.trait}} .${p}-bp b{position:absolute;top:-4px;bottom:-4px;width:2px;border-radius:1px;background:${C.t0}}
  .${p}-pt{width:10px;height:10px;border-radius:50%;border:1px solid ${C.bordM};background:${C.or};align-self:center}
  .${p} .${p}-fab{position:fixed;right:max(12px,calc(50% - 183px));bottom:16px;width:48px;height:48px;border-radius:50%;background:${C.t0};color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px -12px rgba(0,0,0,.5);z-index:5}
  .${p}-pied{display:flex;gap:8px;padding:8px 68px 8px 0;margin-top:auto}
  .${p} .${p}-pied button{height:32px;padding:0 10px;border-radius:10px;font-size:13px}
  .${p} .${p}-pied .${p}-ret{border:1px solid ${C.bord};color:${C.t2}} .${p} .${p}-pied .${p}-sui{background:${C.t0};color:#fff;font-weight:600}
  .${p}-ds2{display:flex;align-items:center;gap:6px;font-size:12px;color:${C.t2}}
  .${p} .${p}-ds2 button{height:28px;padding:0 10px;border:1.5px dashed ${C.trait};border-radius:999px;font-size:13px;color:${C.t1}}
  .${p} .${p}-ds2 button::after{content:" ›";color:${C.t2}}
  .${p} .${p}-ds2 button:active{background:${C.surface}}
  .${p} .${p}-lgb{width:24px;height:24px;border-radius:50%;border:1px solid ${C.bordM};font-size:13px;font-weight:600;color:${C.t1};flex:none;display:inline-flex;align-items:center;justify-content:center}
  .${p}-lg{background:${C.page};border:1px solid ${C.bord};border-radius:10px;padding:6px 8px;font-size:13px;color:${C.t1}} .${p}-lg p{margin:2px 0}
  .${p} :focus-visible{outline:2px solid ${C.eau};outline-offset:2px}
  @media (prefers-reduced-motion:reduce){.${p} *{transition:none!important;animation:none!important}}`;
}

export function tete(p, { abandonner = true, bandeau = true } = {}) {
  const rail = ETAPES.map((e, i) => `<button type="button"${i === 0 ? ' aria-current="step"' : ''} aria-label="${e}"><span>${e}</span><i></i></button>`).join('');
  const bd = bandeau ? `<div class="${p}-bd" data-commun="bandeau" aria-label="Mesures de la recette">
    <div><span class="${p}-bl">Grain</span><span class="${p}-bv">8,6 kg</span></div>
    <div><span class="${p}-bl">OG</span><span class="${p}-bv">1,080</span></div>
    <div><span class="${p}-bl">IBU</span><span class="${p}-bv">~93</span><span class="${p}-bp" role="img" aria-label="style 60–100 IBU"><i style="left:42.9%;width:28.6%"></i><b style="left:66.4%"></b></span></div>
    <div><span class="${p}-bl">EBC</span><span class="${p}-pt"></span><span class="${p}-bv">9,5</span></div>
  </div>` : '';
  return `<header class="${p}-hd" data-commun="en-tete">
    <div class="${p}-tb">
      <button type="button" class="${p}-ic" aria-label="Fermer">${ICO.gauche}</button>
      <p class="${p}-tt"><b>Identité</b><span>1/7</span></p>
      ${abandonner ? `<button type="button" class="${p}-ab">Abandonner</button>` : ''}
      <button type="button" class="${p}-ic" aria-label="Coller une recette">${ICO.coller}</button>
      <button type="button" class="${p}-ic" aria-label="Thème">${ICO.lune}</button>
    </div>
    <nav class="${p}-rail" aria-label="Étapes" data-commun="fil">${rail}</nav>
  </header>${bd}`;
}

// Les deux propositions tirées du style (BrewingStyleDetails : « Proposer l’empâtage… », « Proposer la conduite… ») :
// ici, un toucher ouvre l’aperçu ; rien n’est écrasé sans le voir.
export function duStyle(p) {
  return `<div class="${p}-ds2" data-booster="du-style"><span>Du style</span><button type="button">Empâtage</button><button type="button">Fermentation</button></div>`;
}

// La légende derrière un petit « ? » (D89) : fermée au repos, ouverte sur place (pas de superposition), Échap la referme.
export const LEGENDE = [
  'Bande : la plage du style 22A, BJCP 2021.',
  'Trait ou point : ta recette.',
  'Hachuré : inconnu ; la FG et l’alcool viennent de la levure, étape 4.',
  'Tireté : un conseil, pas une limite.',
  '~ : estimé ou simulé, jamais mesuré.',
];
export function boutonLegende(p) {
  return `<button type="button" class="${p}-lgb" data-role="legende-bouton" aria-expanded="false" aria-controls="${p}-lg" aria-label="Légende">?</button>`;
}
export function legende(p, lignes = LEGENDE) {
  return `<div id="${p}-lg" class="${p}-lg" data-role="legende" hidden>${lignes.map((l) => `<p>${l}</p>`).join('')}</div>`;
}

export function pied(p) {
  return `<footer class="${p}-pied" data-commun="pied"><button type="button" class="${p}-ret" disabled>Retour</button><button type="button" class="${p}-sui">Suivant — Malts/sucres</button></footer>
  <button type="button" class="${p}-fab" aria-label="Actions rapides" data-commun="lanceur">${ICO.plus}</button>`;
}

export function page({ p, titre, css, corps, js = '' }) {
  return `<!doctype html>
<html lang="fr" data-theme="clair">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<!-- Lot v0 Identité · série v · ${p} · page statique, fabriquée par fabrique.mjs (données : neipa v3, style 22A BJCP 2021). -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Source+Sans+3:wght@400;600;700&display=swap">
<style>${cssCommun(p)}
${css}
</style>
</head>
<body>
<div class="${p}" data-variante="${p}">
${corps}
</div>
<script>(function(){${js}
  var lb=document.querySelector('.${p}-lgb'),lg=document.getElementById('${p}-lg');
  if(lb&&lg){lb.addEventListener('click',function(){lg.hidden=!lg.hidden;lb.setAttribute('aria-expanded',String(!lg.hidden));});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!lg.hidden){lg.hidden=true;lb.setAttribute('aria-expanded','false');lb.focus();}});}
})();</script>
</body>
</html>
`;
}
