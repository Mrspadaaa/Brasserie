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
        const a = document.querySelector('[data-role="fiche"] [data-role="alpha"]');
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
        if (document.querySelectorAll('[data-role="fiche"] svg[data-radar][data-objet="fiche"] text').length !== 12) return 'radar sans ses 12 axes nommés';
        const au = document.querySelector('[data-role="fiche"] [data-role="autres"]');
        if (h.partSansFamille > 0 && (!au || Math.abs(parseFloat(au.dataset.part) - h.partSansFamille) > 0.01)) return 'part « autres » absente ou fausse';
        return true;
      } },
    { nom: 'gout j aime', faire: 'toucher', cible: '[data-role="gout"] [data-gout="aime"]',
      verifier: () => document.querySelector('[data-role="gout"] [data-gout="aime"]').getAttribute('aria-pressed') === 'true' || 'goût non retenu' },
    // Le pied de g1 (D124, p21a) : Sources dit d'où vient chaque α ; Substituts sort du même calcul que Substituer.
    { nom: 'sources depliees', faire: 'toucher', cible: '[data-etat="etat-fiche-sources"]',
      verifier: () => {
        const t = document.querySelector('[data-role="fiche"]').innerText;
        return (/Hopsteiner 2025/.test(t) && /Beer Maverick 2023/.test(t) && /mon lot/.test(t)) || 'Sources sans ses fiches datées ni mon lot';
      } },
    { nom: 'substituts du meme calcul', faire: 'toucher', cible: '[data-etat="etat-fiche-substituts"]',
      verifier: (p) => {
        const r = p.etat?.recette ?? p.recette;
        const a = r.additions.find((x) => x.hopKey === 'beermaverick-nugget');
        const attendu = p.moteur.remplacants(r, a.id, 8).map((x) => x.cle);
        const u4 = p.moteur.remplacants(r, a.id, 6).map((x) => x.cle);
        const vus = [...document.querySelectorAll('[data-role="fiche-remplacants"] [data-houblon-cle]')].map((e) => e.dataset.houblonCle);
        if (vus.join() !== attendu.join()) return `remplaçants ${vus.join(', ')} ; moteur ${attendu.join(', ')}`;
        return vus.slice(0, u4.length).join() === u4.join() || 'la fiche classe autrement que Substituer';
      } },
    // Une seule croix (D109, g1) : ronde, 44 px, en haut à droite ; le « ‹ » n'existe plus.
    { nom: 'une seule croix', faire: 'attendre', verifier: () => {
      const f = document.querySelector('[data-role="fiche"]');
      const croix = [...f.querySelectorAll('[data-role="retour"]')];
      if (croix.length !== 1) return croix.length + ' croix dans la fiche';
      const r = croix[0].getBoundingClientRect(), fr = f.getBoundingClientRect();
      if (r.width < 43.5 || r.height < 43.5) return 'croix de ' + r.width + ' × ' + r.height + ' px';
      if (r.right < fr.right - 24 || r.top > fr.top + 40) return 'croix hors du coin haut droit';
      const autres = [...f.querySelectorAll('button')].filter((b) => /retour|fermer|‹/i.test((b.getAttribute('aria-label') || '') + b.textContent) && b !== croix[0]);
      return !autres.length || 'deuxième bouton de fermeture : ' + autres.map((b) => b.getAttribute('aria-label') || b.textContent).join(', ');
    } },
    { nom: 'croix ferme (fermer-fiche)', faire: 'toucher', cible: '[data-role="fermer-fiche"]', attendre: '[data-ecran="ma-biere"]',
      verifier: (p) => (p.route === '#/ma-biere' && !document.querySelector('[data-role="fiche"]')) || `× : ${p.route}` },
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
