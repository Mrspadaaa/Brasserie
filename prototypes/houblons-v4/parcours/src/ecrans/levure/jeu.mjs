// Gestes et attentes de l'étape Levure, rejoués par outils/jouer-parcours.mjs --etape=levure sur levure/etat.html.
// Format : ARCHITECTURE.md, « Contrat d'un écran ». verifier(p) se joue DANS la page (p = window.__parcours) et rend
// true ou un message ; sérialisé : aucune variable du module dedans. L'état passe par window.__pqLev.
export default {
  page: 'etat.html',
  gestes: [
    { nom: 'départ US-05, biotransformation visible', faire: 'attendre', verifier: () => {
      const ec = document.querySelector('.pq-outil-levure');
      const us = ec.querySelector('[data-levure="fermentis-us05"]');
      if (us.getAttribute('aria-checked') !== 'true') return 'US-05 non cochée au départ';
      if (!ec.querySelector('[data-role="biotransformation"]')) return 'biotransformation absente';
      if (!ec.querySelector('[data-role="ajout"] [data-houblon="beermaverick-nugget"]') || !ec.querySelector('[data-role="ajout"] [data-houblon="beermaverick-idaho-7"]')) return 'ajout cumulé sans Nugget et Idaho 7';
      window.__pqLev = { us05: [...ec.querySelectorAll('[data-role="simulation"] [data-nature="simule"]')].map((e) => e.textContent).join('|') };
      return true;
    } },
    { nom: 'Pomona fait bouger le simulé', faire: 'toucher', cible: '[data-ecran="levure"] [data-levure="lalbrew-pomona"]', verifier: (p) => {
      if (p.etat.brouillon.recette.yeastId !== 'lalbrew-pomona') return 'Pomona non choisie dans le brouillon';
      if (p.etat.recette.yeastId === 'lalbrew-pomona') return 'la recette a changé avant « Ajouter à ma bière »';
      const ec = document.querySelector('.pq-outil-levure');
      const s = [...ec.querySelectorAll('[data-role="simulation"] [data-nature="simule"]')].map((e) => e.textContent).join('|');
      if (s === window.__pqLev.us05) return 'aucune valeur simulée ne bouge avec Pomona';
      const bio = ec.querySelector('[data-role="biotransformation"]').textContent;
      return /50\s*%/.test(bio) || ('biotransformation de Pomona non chiffrée : ' + bio);
    } },
    { nom: 'Verdant : non documenté, jamais 0', faire: 'toucher', cible: '[data-ecran="levure"] [data-levure="lalbrew-verdant-ipa"]', verifier: () => {
      const ec = document.querySelector('.pq-outil-levure');
      return !!ec.querySelector('[data-role="biotransformation"] [data-inconnu]') || 'Verdant : biotransformation sans « ? »';
    } },
    { nom: 'retour à Pomona', faire: 'toucher', cible: '[data-ecran="levure"] [data-levure="lalbrew-pomona"]', verifier: (p) => p.etat.brouillon.recette.yeastId === 'lalbrew-pomona' || 'Pomona non rechoisie' },
    { nom: 'Ajouter à ma bière', faire: 'toucher', cible: '[data-role="pont-ajouter"]', attendre: '[data-ecran="ma-biere"]', verifier: (p) => {
      if (p.etat.brouillon !== null) return 'brouillon resté ouvert';
      if (location.hash !== '#/ma-biere') return 'route ' + location.hash;
      const a = p.etat.recette.additions.find((x) => x.hopKey === 'beermaverick-idaho-7');
      if (!a) return 'Idaho 7 non inscrit';
      if (a.moment !== 'dryActive' || a.jours !== 3) return 'Idaho 7 au mauvais moment : ' + a.moment + ' ' + a.jours + ' j';
      if (a.grams !== 80) return 'dose ' + a.grams + ' g (80 g attendus)';
      return p.etat.recette.yeastId === 'lalbrew-pomona' || ('levure de la recette : ' + p.etat.recette.yeastId);
    } },
  ],
};
