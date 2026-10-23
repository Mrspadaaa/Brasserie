// Gestes et attentes de l'écran « substituer » (la porte), rejoués par outils/jouer-parcours.mjs --etape=substituer
// sur substituer/etat.html. Format : ARCHITECTURE.md, « Contrat d'un écran ». verifier(p) se joue DANS la page.
export default {
  page: 'etat.html',
  gestes: [
    { nom: 'Nugget epingle, remplacants du moteur', faire: 'attendre', attendre: '[data-role="epingle"]',
      verifier: (p) => {
        window.__ibu0 = p.biere().ibu.valeur;
        const ep = document.querySelector('[data-ecran="substituer"] [data-role="epingle"]');
        if (!ep || !/Nugget/.test(ep.textContent)) return 'Nugget non épinglé en colonne 1';
        const montre = [...document.querySelectorAll('[data-ecran="substituer"] [data-remplacant]')].map((e) => e.dataset.remplacant);
        const moteur = p.moteur.remplacants(p.etat.brouillon.recette, 'a1', 6).map((r) => r.cle);
        return JSON.stringify(montre) === JSON.stringify(moteur) || `ordre ${montre.join(',')} ≠ moteur ${moteur.join(',')}`;
      } },
    { nom: 'dose a IBU egal', faire: 'attendre',
      verifier: (p) => {
        const r = p.etat.brouillon.recette, a = r.additions.find((x) => x.id === 'a1');
        const i0 = p.moteur.ibuAjout(a, r).ibu.valeur;
        for (const e of document.querySelectorAll('[data-ecran="substituer"] [data-col] [data-role="dose-remplacant"]')) {
          const cle = e.closest('[data-col]').dataset.col;
          if (cle === 'beermaverick-nugget') continue;
          const g = Number(e.dataset.grammes);
          const i = p.moteur.ibuAjout({ ...a, hopKey: cle, grams: g }, r).ibu?.valeur;
          if (i == null || Math.abs(i - i0) > 0.5) return `${cle} : ${g} g donne ${i} IBU, Nugget ${i0}`;
        }
        return true;
      } },
    { nom: 'perd et gagne', faire: 'attendre',
      verifier: (p) => {
        const r = p.moteur.remplacants(p.etat.brouillon.recette, 'a1', 6)[0];
        const fams = [...document.querySelectorAll(`[data-ecran="substituer"] [data-col="${r.cle}"]`)].flatMap((c) => [...c.querySelectorAll('[data-famille]')].map((x) => x.dataset.famille));
        const manque = [...r.familles.perd, ...r.familles.gagne].filter((f) => !fams.includes(f));
        return !manque.length || `${r.cle} : familles perdues ou gagnées absentes (${manque.join(', ')})`;
      } },
    { nom: 'choisir le dernier', faire: 'toucher', cible: '[data-ecran="substituer"] [data-remplacant]',
      verifier: () => {
        const t = [...document.querySelectorAll('[data-ecran="substituer"] [data-remplacant]')].at(-1);
        const nom = t.querySelector('[data-houblon]').textContent;
        const b = document.querySelector('[data-role="choix-dock"]')?.textContent ?? '';
        return (t.getAttribute('aria-checked') === 'true' && b.includes(nom)) || `choix non pris (${nom} / ${b})`;
      } },
    { nom: 'abandon', faire: 'fermer', attendre: '[data-ecran="ma-biere"]',
      verifier: (p) => (p.etat.brouillon === null && p.etat.recette.additions.find((a) => a.id === 'a1').hopKey === 'beermaverick-nugget') || '« ‹ » a changé la recette' },
    { nom: 'rouvrir', faire: 'toucher', cible: '[data-role="pont-substituer"][data-houblon="beermaverick-nugget"]', attendre: '[data-ecran="substituer"]' },
    // D120 : « Annuler », à côté de « Remplacer », jette le brouillon sans toucher la recette et ramène à l'étape Houblons.
    { nom: 'choisir avant Annuler', faire: 'toucher', cible: '[data-ecran="substituer"] [data-remplacant]', verifier: (p) => { window.__pqSubAvant = JSON.stringify(p.etat.recette); return true; } },
    { nom: 'Annuler', faire: 'toucher', cible: '[data-role="annuler"]', attendre: '[data-ecran="ma-biere"]',
      verifier: (p) => (p.etat.brouillon === null && JSON.stringify(p.etat.recette) === window.__pqSubAvant && location.hash === '#/ma-biere') || '« Annuler » : brouillon ' + (p.etat.brouillon ? 'ouvert' : 'nul') + ', route ' + location.hash + (JSON.stringify(p.etat.recette) === window.__pqSubAvant ? '' : ', recette changée') },
    { nom: 'rouvrir', faire: 'toucher', cible: '[data-role="pont-substituer"][data-houblon="beermaverick-nugget"]', attendre: '[data-ecran="substituer"]' },
    { nom: 'Remplacer', faire: 'toucher', cible: '[data-role="pont-remplacer"]', attendre: '[data-ecran="ma-biere"]',
      verifier: (p) => {
        const a = p.etat.recette.additions.find((x) => x.id === 'a1');
        if (!a || a.hopKey === 'beermaverick-nugget') return 'Nugget non remplacé';
        if (p.etat.brouillon !== null) return 'brouillon resté ouvert';
        const d = Math.abs(p.biere().ibu.valeur - window.__ibu0);
        if (d > 0.5) return `remplacement hors IBU égal : ${window.__ibu0.toFixed(2)} → ${p.biere().ibu.valeur.toFixed(2)}`;
        const lu = Number(document.querySelector('[data-ecran="ma-biere"] [data-role="ibu"]').dataset.valeur);
        if (Math.abs(lu - p.biere().ibu.valeur) > 0.01) return 'IBU affiché ≠ moteur';
        const rep = document.querySelector('[data-ecran="ma-biere"] [data-voie="a1"] [data-role="vient-de-changer"]');
        return (rep && /Nugget/.test(rep.textContent)) || 'pas de repère « à la place de Nugget »';
      } },
  ],
};
