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
    // D130 : la liste sous le radar est la matrice de flb5b : « Lui seul : … » (hors-16d), ses mots en lignes (picto de leur
    // famille), lui puis ses quatre premiers remplaçants de u4 en colonnes, du même calcul que Substituer.
    { nom: 'matrice de flb5b', faire: 'attendre',
      verifier: (p) => {
        const f = document.querySelector('[data-role="fiche"] [data-role="fiche-arome"]');
        if (!f) return 'pas de matrice (data-role="fiche-arome")';
        const lignes = [...f.querySelectorAll('[data-mot]')];
        if (lignes.length < 3) return lignes.length + ' mots en lignes';
        for (const e of lignes.filter((x) => x.dataset.famille)) if (!e.querySelector('svg[data-famille="' + e.dataset.famille + '"] use')) return e.dataset.mot + ' sans picto';
        const seul = f.querySelector('[data-role="hors-16d"][data-houblon="beermaverick-nugget"]');
        if (!seul) return 'pas de bandeau « Lui seul » pour Nugget';
        for (const e of lignes.filter((x) => x.dataset.seul)) {
          if (!seul.textContent.includes(e.dataset.mot)) return e.dataset.mot + ' seul, absent du bandeau';
          if (e.querySelector('.pq-fiche-mx-o')) return e.dataset.mot + ' seul, mais un remplaçant le dit';
        }
        const r = p.etat?.recette ?? p.recette;
        const a = r.additions.find((x) => x.hopKey === 'beermaverick-nugget');
        const moteur = new Set(p.moteur.remplacants(r, a.id, 400).map((x) => x.cle));
        const cols = [...f.querySelectorAll('[data-houblon-cle]')].map((e) => ({ cle: e.dataset.houblonCle, min: Number(e.dataset.min) }));
        if (cols.length !== 4 || cols.some((x) => !moteur.has(x.cle))) return 'colonnes ' + cols.map((x) => x.cle).join(', ');
        return cols.every((x, i) => i === 0 || x.min <= cols[i - 1].min) || 'colonnes hors de l’ordre de Substituer (pire cas)';
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
        // D40 point 3 : le calcul de u4 (Substituer) : tous tirés du moteur, rangés par le pire cas (data-min).
        const moteur = new Set(p.moteur.remplacants(r, a.id, 400).map((x) => x.cle));
        const vus = [...document.querySelectorAll('[data-role="fiche-remplacants"] [data-houblon-cle]')].map((e) => ({ cle: e.dataset.houblonCle, min: Number(e.dataset.min) }));
        if (vus.length < 4 || vus.some((x) => !moteur.has(x.cle))) return `remplaçants ${vus.map((x) => x.cle).join(', ')}`;
        return vus.every((x, i) => i === 0 || x.min <= vus[i - 1].min) || 'la fiche ne range pas par le pire cas, comme Substituer';
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
