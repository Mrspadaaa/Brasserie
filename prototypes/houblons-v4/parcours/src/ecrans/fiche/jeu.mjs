// Gestes et attentes de l'écran « fiche », rejoués par outils/jouer-parcours.mjs --etape=fiche sur fiche/etat.html
// (la page démarre sur la fiche de Nugget, posée sur Ma bière). Format : ARCHITECTURE.md, « Contrat d'un écran ».
// verifier(p) se joue DANS la page, avec p = window.__parcours ; il rend true (ou une promesse de true) ou un message.
export default {
  page: 'etat.html',
  gestes: [
    { nom: 'fiche de Nugget', faire: 'attendre', attendre: '[data-role="fiche"]',
      verifier: (p) => {
        const f = [...document.querySelectorAll('[data-role="fiche"]')].find((e) => e.getBoundingClientRect().height > 20);
        return (f && /Nugget/.test(f.textContent) && p.route === '#/fiche/nugget') || `fiche : ${p.route}`;
      } },
    { nom: 'alpha du lot d abord', faire: 'attendre',
      verifier: (p) => {
        const h = p.moteur.houblon('beermaverick-nugget');
        const a = document.querySelector('[data-role="fiche"] [data-role="fiche-alpha"] [data-role="alpha"]');
        const src = /^plage/.test(h.alpha.source) ? 'fiches' : 'lot';
        const v = h.alpha.valeur.toLocaleString('fr-CH', { maximumFractionDigits: 1 });
        return (a && a.dataset.source === src && a.textContent.includes(v)) || `α de la fiche : ${a?.dataset.source} « ${a?.textContent} », moteur ${src} ${v}`;
      } },
    { nom: 'aromes et sources', faire: 'attendre',
      verifier: (p) => {
        const h = p.moteur.houblon('beermaverick-nugget');
        const cites = Object.keys(h.familles).filter((f) => h.familles[f].niveau !== 'non décrit');
        const li = [...document.querySelectorAll('[data-role="fiche"] [data-role="fiche-arome"] li[data-famille]')];
        if (li.length !== cites.length) return `${li.length} familles montrées, ${cites.length} décrites`;
        for (const e of li) {
          const x = h.familles[e.dataset.famille];
          if (!e.textContent.includes(`${x.fiches}/${x.sur}`)) return `${e.dataset.famille} : « ${x.fiches}/${x.sur} » absent`;
          if (!e.querySelector(`svg[data-famille="${e.dataset.famille}"] use`)) return `${e.dataset.famille} sans picto`;
        }
        return true;
      } },
    { nom: 'silhouette et autres', faire: 'attendre',
      verifier: (p) => {
        const h = p.moteur.houblon('beermaverick-nugget');
        if (document.querySelectorAll('[data-role="fiche"] svg[data-radar][data-objet="fiche"] use').length !== 12) return 'silhouette sans ses 12 axes';
        const au = document.querySelector('[data-role="fiche"] [data-role="autres"]');
        if (h.partSansFamille > 0 && (!au || Math.abs(parseFloat(au.dataset.part) - h.partSansFamille) > 0.01)) return 'part « autres » absente ou fausse';
        return true;
      } },
    { nom: 'gout j aime', faire: 'toucher', cible: '[data-role="gout"] [data-gout="aime"]',
      verifier: () => document.querySelector('[data-role="gout"] [data-gout="aime"]').getAttribute('aria-pressed') === 'true' || 'goût non retenu' },
    { nom: 'chevron ferme', faire: 'toucher', cible: '[data-role="fermer-fiche"]', attendre: '[data-ecran="ma-biere"]',
      verifier: (p) => (p.route === '#/ma-biere' && !document.querySelector('[data-role="fiche"]')) || `‹ : ${p.route}` },
    { nom: 'appui long rouvre', faire: 'appui-long', cible: '[data-role="ouvrir-fiche"][data-houblon="beermaverick-nugget"]', attendre: '[data-role="fiche"]',
      verifier: () => document.querySelector('[data-role="gout"] [data-gout="aime"]')?.getAttribute('aria-pressed') === 'true' || 'le goût est perdu' },
    { nom: 'Echap ferme', faire: 'attendre',
      verifier: (p) => new Promise((ok) => {
        (document.activeElement ?? document.body).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }));
        setTimeout(() => ok((window.location.hash === '#/ma-biere' && !document.querySelector('[data-role="fiche"]')) || `Échap : ${p.route}`), 500);
      }) },
    { nom: 'appui long sur la carte', faire: 'appui-long', cible: '[data-voie="a1"] [data-role="ibu-ajout"]', attendre: '[data-role="fiche"]' },
    { nom: 'croix ferme', faire: 'toucher', cible: '[data-role="fiche"] button[aria-label="Fermer"]', attendre: '[data-ecran="ma-biere"]',
      verifier: (p) => (p.route === '#/ma-biere' && !document.querySelector('[data-role="fiche"]')) || `× : ${p.route}` },
  ],
};
