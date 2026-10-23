// Gestes et attentes de l'écran « comparer », rejoués par outils/jouer-parcours.mjs --etape=comparer sur comparer/etat.html.
// Format : ARCHITECTURE.md, « Contrat d'un écran ». verifier(p) se joue DANS la page, avec p = window.__parcours ;
// il rend true ou un message. Sérialisé : aucune variable du module dedans.
// Ce qui est prouvé : la fiche à l'appui long et son retour ; retenir une colonne réécrit la réponse avec l'écart
// que le moteur calcule à l'instant ; « Égaler » cherche la dose par le moteur ; le « + » ajoute une 4ᵉ colonne
// simulée en direct ; « Placer » ouvre Dryhopper avec le houblon retenu en brouillon.
export default {
  page: 'etat.html',
  gestes: [
    { nom: 'Fiche de Galaxy', faire: 'appui-long', cible: '[data-ecran="comparer"] [data-houblon="Galaxy"]', attendre: '[data-ecran="fiche"]',
      verifier: () => document.querySelector('[data-ecran="fiche"]')?.getAttribute('data-houblon-ouvert') === 'beermaverick-galaxy' || 'la fiche ouverte n’est pas celle de Galaxy' },
    { nom: 'Retour ferme la fiche', faire: 'retour', attendre: '[data-ecran="comparer"]',
      verifier: (p) => (!document.querySelector('[data-ecran="fiche"]') && p.route.startsWith('#/comparer')) || `fiche encore ouverte ou route ${p.route}` },
    { nom: 'Retenir Cascade', faire: 'toucher', cible: '[role="radio"][data-col="beermaverick-cascade"]',
      verifier: (p) => {
        const b = document.querySelector('[role="radio"][data-col="beermaverick-cascade"]');
        if (b?.getAttribute('aria-checked') !== 'true') return 'Cascade non retenue';
        const rep = document.querySelector('[data-role="reponse"]')?.textContent ?? '';
        if (!/Cascade/.test(rep) || !/contre/.test(rep)) return `réponse non réécrite : ${rep}`;
        // L'écart affiché = celui du moteur, maintenant : (Cascade − ★ Idaho 7) en crans de floral.
        const r = p.etat.recette, sc = p.moteur.style(r.styleCode);
        const [c, i] = p.moteur.comparer(r, ['beermaverick-cascade', 'beermaverick-idaho-7']);
        const d = (x) => (x.lu.apres.profil.floral.valeur.centre - x.lu.avant.profil.floral.valeur.centre) / sc.families.floral.cran;
        const attendu = Math.round((d(c) - d(i)) * 10) / 10;
        const lu = Number((document.querySelector('[data-role="reponse"] [data-nature="simule"]')?.textContent ?? '').replace('~', '').replace('−', '-').replace(',', '.'));
        return Math.abs(lu - attendu) < 0.051 || `réponse ${lu} ≠ moteur ${attendu}`;
      } },
    { nom: 'Egaler', faire: 'toucher', cible: '[aria-controls="pq-comparer-egaler"]', attendre: '#pq-comparer-egaler:not([hidden]) [data-nature="simule"]',
      verifier: () => {
        const v = [...document.querySelectorAll('#pq-comparer-egaler [data-nature="simule"]')].map((e) => e.textContent.trim());
        return (v.length >= 3 && v.every((t) => t.startsWith('~'))) || `égaler : ${v.join(' | ')}`;
      } },
    { nom: 'Ouvrir le plus', faire: 'toucher', cible: '[data-role="ajouter-colonne"]', attendre: '[data-ajouter="beermaverick-nelson-sauvin"]' },
    { nom: 'Ajouter Nelson Sauvin', faire: 'toucher', cible: '[data-ajouter="beermaverick-nelson-sauvin"]', attendre: '[role="radio"][data-col="beermaverick-nelson-sauvin"]',
      verifier: (p) => {
        const n = document.querySelectorAll('[data-ecran="comparer"] [role="radio"][data-col]').length;
        if (n !== 4) return `${n} colonnes au lieu de 4`;
        if (document.querySelectorAll('[data-ecran="comparer"] svg[data-radar] [data-serie]').length !== 4) return 'le radar n’a pas 4 séries';
        if (!document.querySelector('[data-role="autres"][data-houblon="Nelson Sauvin"]')) return 'Nelson Sauvin sans sa part « autres » (D100)';
        const r = p.etat.recette;
        const [c] = p.moteur.comparer(r, ['beermaverick-nelson-sauvin']);
        const centre = c.lu.apres.profil.floral.valeur.centre;
        const g = document.querySelector('[data-radar] [data-serie="Nelson Sauvin"]')?.getAttribute('data-valeurs') ?? '';
        const axes = document.querySelector('[data-radar]').getAttribute('data-axes').split(',');
        const v = Number(g.split(',')[axes.indexOf('floral')]);
        return Math.abs(v - centre) < 0.06 || `floral de Nelson Sauvin ${v} ≠ moteur ${centre}`;
      } },
    { nom: 'Placer Nelson Sauvin', faire: 'toucher', cible: '[data-role="pont-placer"]', attendre: '[data-ecran="dryhopper"]',
      verifier: (p) => {
        const b = p.etat.brouillon;
        if (!b || b.outil !== 'dryhopper') return 'pas de brouillon Dryhopper';
        const a = b.recette.additions.find((x) => x.id === b.ajoutId);
        return (a && a.hopKey === 'beermaverick-nelson-sauvin') || `brouillon sur ${a?.hopKey}`;
      } },
  ],
};
