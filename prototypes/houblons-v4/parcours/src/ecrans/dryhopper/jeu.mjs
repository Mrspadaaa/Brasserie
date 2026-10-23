// Gestes et attentes de Dryhopper (a1, y1b affiné), rejoués par outils/jouer-parcours.mjs --etape=dryhopper sur
// Le dock (rail, jours) vit dans le pied de PageShell, hors de [data-ecran] : la page de l’outil se vise par .pq-outil-<écran>.
// dryhopper/etat.html. Format : ARCHITECTURE.md, « Contrat d'un écran ». verifier(p) et mesurer(p) se jouent DANS la
// page, avec p = window.__parcours ; ils rendent true ou un message. Sérialisés : aucune variable du module dedans.
// Entre deux gestes, l'état de la vérification passe par window.__pqDry.
export default {
  page: 'etat.html',
  gestes: [
    { nom: 'au repos, aucune graduation', faire: 'attendre', verifier: () => {
      const ec = document.querySelector('.pq-outil-dryhopper');
      const r = ec.querySelector('[role="slider"]');
      if (ec.querySelectorAll('[data-cran]').length) return 'des graduations au repos (D47)';
      if (r.getAttribute('aria-valuetext') !== 'actif · 3 j') return 'moment de départ : ' + r.getAttribute('aria-valuetext');
      const m = ec.querySelector('[data-acquis="valeurs"] [data-nature="mesure"]');
      if (!m || !m.textContent.includes('38 µg/L') || !/Idaho/.test(m.dataset.source)) return 'vraie valeur d’Idaho 7 absente : ' + (m ? m.textContent + ' / ' + m.dataset.source : 'aucune');
      window.__pqDry = {};
      return true;
    } },
    { nom: 'appui long sur Idaho 7, la fiche', faire: 'appui-long', cible: '[data-ecran="dryhopper"] [data-role="ouvrir-fiche"]', attendre: '[data-ecran="fiche"]',
      verifier: (p) => (p.etat.brouillon && p.etat.brouillon.outil === 'dryhopper') || 'la fiche a fait perdre le brouillon' },
    { nom: 'retour du téléphone, la fiche se ferme', faire: 'retour', verifier: (p) => {
      if (document.querySelector('[data-ecran="fiche"]')) return 'fiche encore ouverte';
      if (!document.querySelector('.pq-outil-dryhopper')) return 'Dryhopper perdu';
      const a = p.etat.brouillon && p.etat.brouillon.recette.additions.find((x) => x.id === p.etat.brouillon.ajoutId);
      return (a && a.moment === 'dryActive' && a.jours === 3) || 'moment perdu après la fiche';
    } },
    { nom: 'loupe sous le doigt', faire: 'maintenir', cible: '.pq-outil-dryhopper [data-role="frise"]', de: 0.62, a: 0.3, pas: 10,
      // L12 et D47 : doigt posé, l'écart entre deux crans voisins sous le doigt vaut au moins trois fois l'écart au loin.
      mesurer: () => {
        const ec = document.querySelector('.pq-outil-dryhopper');
        const i = Number(ec.querySelector('[role="slider"]').getAttribute('aria-valuenow'));
        const xs = [...ec.querySelectorAll('[data-cran]')].map((e) => { const b = e.getBoundingClientRect(); return { k: Number(e.dataset.cran), x: b.left + b.width / 2 }; }).sort((a, b) => a.k - b.k);
        if (xs.length < 5) return 'graduations absentes sous le doigt (' + xs.length + ')';
        const g = (k) => Math.abs(xs[k + 1].x - xs[k].x);
        const pres = Math.min(i > 0 ? g(i - 1) : Infinity, i < xs.length - 1 ? g(i) : Infinity);
        const loin = i < xs.length / 2 ? g(xs.length - 2) : g(0);
        const ratio = pres / loin;
        window.__pqDry.loupe = { i, pres, loin, ratio };
        return ratio >= 3 || ('loupe ×' + ratio.toFixed(2) + ' (sous le doigt ' + pres.toFixed(1) + ' px, au loin ' + loin.toFixed(1) + ' px)');
      } },
    { nom: 'doigt levé, plus de graduation', faire: 'attendre', verifier: () => document.querySelectorAll('.pq-outil-dryhopper [data-cran]').length === 0 || 'graduations restées au repos' },
    { nom: 'glisser à 60 minutes', faire: 'glisser', cible: '.pq-outil-dryhopper [data-role="frise"]', de: 0.3, a: 0.0, pas: 12, verifier: (p) => {
      const b = p.etat.brouillon;
      const a = b.recette.additions.find((x) => x.id === b.ajoutId);
      if (a.moment !== 'b60' || a.minutes !== 60) return 'moment ' + a.moment + ' ' + a.minutes + '′ (60′ attendu)';
      const ec = document.querySelector('.pq-outil-dryhopper');
      const ibu = Number(ec.querySelector('[data-role="ibu-dry"]').getAttribute('data-valeur'));
      const m = p.brouillonLu().ibu.valeur;
      if (Math.abs(ibu - m) > 0.01) return 'IBU affichée ' + ibu + ' ≠ moteur ' + m;
      const fl = Number(ec.querySelector('[data-ligne="floral"] [data-nature="simule"]').getAttribute('data-valeur'));
      window.__pqDry.a60 = { ibu, fl };
      return true;
    } },
    { nom: 'glisser au dry hop actif', faire: 'glisser', cible: '.pq-outil-dryhopper [data-role="frise"]', de: 0.02, a: 0.6, pas: 12, verifier: (p) => {
      const b = p.etat.brouillon;
      const a = b.recette.additions.find((x) => x.id === b.ajoutId);
      if (a.moment !== 'dryActive') return 'moment ' + a.moment + ' (dry hop actif attendu)';
      const ec = document.querySelector('.pq-outil-dryhopper');
      const ibu = Number(ec.querySelector('[data-role="ibu-dry"]').getAttribute('data-valeur'));
      const fl = Number(ec.querySelector('[data-ligne="floral"] [data-nature="simule"]').getAttribute('data-valeur'));
      const a60 = window.__pqDry.a60;
      if (!(ibu < a60.ibu)) return 'IBU sans chute : ' + a60.ibu + ' → ' + ibu;
      if (!(fl > a60.fl)) return 'floral sans hausse : ' + a60.fl + ' → ' + fl;
      window.__pqDry.chute = { ibu60: a60.ibu, ibu, fl60: a60.fl, fl };
      return true;
    } },
    { nom: '2 jours de contact', faire: 'toucher', cible: '.pq-outil-dryhopper [data-jour="2"]', verifier: () => {
      const ec = document.querySelector('.pq-outil-dryhopper');
      if (ec.querySelector('[role="slider"]').getAttribute('aria-valuetext') !== 'actif · 2 j') return 'pas à actif · 2 j';
      window.__pqDry.j2 = [...ec.querySelectorAll('[data-role="simulation"] [data-nature="simule"], [data-role="ibu-dry"]')].map((e) => e.textContent).join('|');
      return true;
    } },
    { nom: 'au-delà de 2 jours, rien ne bouge', faire: 'toucher', cible: '.pq-outil-dryhopper [data-jour="7"]', verifier: (p) => {
      const ec = document.querySelector('.pq-outil-dryhopper');
      const a = p.etat.brouillon.recette.additions.find((x) => x.id === p.etat.brouillon.ajoutId);
      if (a.jours !== 7) return 'jours ' + a.jours + ' (7 attendus)';
      const j7 = [...ec.querySelectorAll('[data-role="simulation"] [data-nature="simule"], [data-role="ibu-dry"]')].map((e) => e.textContent).join('|');
      return j7 === window.__pqDry.j2 || ('7 j ≠ 2 j : ' + window.__pqDry.j2 + ' / ' + j7);
    } },
    { nom: 'Puis la levure', faire: 'toucher', cible: '[data-role="pont-levure"]', attendre: '[data-ecran="levure"]', verifier: (p) => {
      const b = p.etat.brouillon;
      const a = b && b.recette.additions.find((x) => x.id === b.ajoutId);
      return (a && a.moment === 'dryActive' && a.jours === 7) || 'le moment retenu ne suit pas vers Levure';
    } },
    // L14 (23.10, vu par Comparer) : la vraie valeur est celle du houblon en brouillon, jamais celle d'Idaho 7.
    { nom: 'un autre houblon : Nelson Sauvin', faire: 'attendre', verifier: () => { location.hash = '#/dryhopper/nelson-sauvin-1'; return true; } },
    { nom: 'Nelson Sauvin : sa propre mesure', faire: 'attendre', attendre: '.pq-outil-dryhopper [data-role="ouvrir-fiche"][data-houblon="beermaverick-nelson-sauvin"]', verifier: () => {
      const m = document.querySelector('.pq-outil-dryhopper [data-acquis="valeurs"] [data-nature="mesure"]');
      if (!m) return 'Nelson Sauvin : aucune vraie valeur alors que E06 en publie';
      if (/38 µg/.test(m.textContent) || !/Nelson/.test(m.dataset.source)) return 'valeur d’un autre houblon : ' + m.textContent + ' / ' + m.dataset.source;
      return true;
    } },
    { nom: 'un houblon sans mesure : Galaxy', faire: 'attendre', verifier: () => { location.hash = '#/dryhopper/galaxy-1'; return true; } },
    { nom: 'Galaxy : « ? », jamais une autre valeur', faire: 'attendre', attendre: '.pq-outil-dryhopper [data-role="ouvrir-fiche"][data-houblon="beermaverick-galaxy"]', verifier: () => {
      const ec = document.querySelector('.pq-outil-dryhopper');
      if (ec.querySelector('[data-acquis="valeurs"] [data-nature="mesure"]')) return 'Galaxy affiche une mesure : ' + ec.querySelector('[data-acquis="valeurs"] [data-nature="mesure"]').textContent;
      return !!ec.querySelector('[data-role="mesure-absente"] [data-inconnu]') || 'Galaxy : pas de « ? » à la place de la mesure';
    } },
  ],
};
