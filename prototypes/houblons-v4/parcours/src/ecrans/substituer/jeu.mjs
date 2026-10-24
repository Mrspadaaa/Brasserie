// Gestes et attentes de l'écran « substituer » (u4, voie r6), rejoués par outils/jouer-parcours.mjs --etape=substituer
// sur substituer/etat.html. Format : ARCHITECTURE.md, « Contrat d'un écran ». verifier(p) se joue DANS la page.
export default {
  page: 'etat.html',
  gestes: [
    { nom: 'echelle de u4, pire cas d abord', faire: 'attendre', attendre: '[data-remplacant]',
      verifier: (p) => {
        window.__ibu0 = p.biere().ibu.valeur;
        const rangs = [...document.querySelectorAll('[data-ecran="substituer"] [data-remplacant]')];
        if (rangs.length < 4) return `${rangs.length} remplaçants seulement`;
        const mins = rangs.map((e) => Number(e.dataset.min));
        for (let i = 1; i < mins.length; i++) if (mins[i] > mins[i - 1]) return `pas rangé par le pire cas (${mins.join(',')})`;
        // Une plage n'existe que si une composante est inconnue ; sinon le score du moteur, en un point.
        const moteur = Object.fromEntries(p.moteur.remplacants(p.etat.brouillon.recette, 'a1', 400).map((r) => [r.cle, r]));
        for (const e of rangs) {
          const r = moteur[e.dataset.remplacant];
          if (!r) continue;
          const inconnue = Object.values(r.composantes).some((v) => v === null);
          if (!inconnue && (Number(e.dataset.min) !== r.score || Number(e.dataset.max) !== r.score)) return `${r.cle} : ${e.dataset.min}–${e.dataset.max} ≠ moteur ${r.score}`;
          if (inconnue && !(Number(e.dataset.min) < Number(e.dataset.max) && Number(e.dataset.max) >= r.score - 1)) return `${r.cle} : plage ${e.dataset.min}–${e.dataset.max} pour une composante inconnue (moteur ${r.score})`;
        }
        return !!document.querySelector('[data-ecran="substituer"] [data-role="epingle"]') || 'Nugget absent du face à face';
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
    { nom: 'perd et gagne au tableau des aromes', faire: 'attendre',
      verifier: (p) => {
        const moteur = p.moteur.remplacants(p.etat.brouillon.recette, 'a1', 400);
        for (const b of document.querySelectorAll('[data-ecran="substituer"] [role="radio"][data-col]')) {
          const r = moteur.find((x) => x.cle === b.dataset.col);
          if (!r) return `${b.dataset.col} absent du moteur`;
          const cases = [...document.querySelectorAll(`[data-ecran="substituer"] [data-role="arome"][data-col="${r.cle}"]`)].map((x) => x.dataset.familleFiche);
          const manque = [...r.familles.perd, ...r.familles.gagne].filter((f) => !cases.includes(f));
          if (manque.length) return `${r.cle} : familles perdues ou gagnées absentes du tableau (${manque.join(', ')})`;
        }
        return true;
      } },
    { nom: 'toucher le dernier de l echelle', faire: 'toucher', cible: '[data-ecran="substituer"] [data-remplacant]',
      verifier: () => {
        const t = [...document.querySelectorAll('[data-ecran="substituer"] [data-remplacant]')].at(-1);
        const nom = t.dataset.houblonRang;
        const bande = document.querySelector(`[data-ecran="substituer"] [role="radio"][data-col="${t.dataset.remplacant}"]`);
        const dock = document.querySelector('[data-role="choix-dock"]')?.textContent ?? '';
        return (t.getAttribute('aria-pressed') === 'true' && bande?.getAttribute('aria-checked') === 'true' && dock.includes(nom)) || `choix non pris (${nom} / ${dock})`;
      } },
    { nom: 'abandon', faire: 'fermer', attendre: '[data-ecran="ma-biere"]',
      verifier: (p) => (p.etat.brouillon === null && p.etat.recette.additions.find((a) => a.id === 'a1').hopKey === 'beermaverick-nugget') || '« ✕ » a changé la recette' },
    { nom: 'rouvrir', faire: 'toucher', cible: '[data-role="pont-substituer"][data-houblon="beermaverick-nugget"]', attendre: '[data-ecran="substituer"]' },
    // D120 : « Annuler », à côté de « Remplacer », jette le brouillon sans toucher la recette et ramène à l'étape Houblons.
    { nom: 'choisir avant Annuler', faire: 'toucher', cible: '[data-ecran="substituer"] [data-remplacant]', verifier: (p) => { window.__pqSubAvant = JSON.stringify(p.etat.recette); return true; } },
    { nom: 'Annuler', faire: 'toucher', cible: '[data-role="annuler"]', attendre: '[data-ecran="ma-biere"]',
      verifier: (p) => (p.etat.brouillon === null && JSON.stringify(p.etat.recette) === window.__pqSubAvant && location.hash === '#/ma-biere') || '« Annuler » : brouillon ' + (p.etat.brouillon ? 'ouvert' : 'nul') + ', route ' + location.hash + (JSON.stringify(p.etat.recette) === window.__pqSubAvant ? '' : ', recette changée') },
    { nom: 'rouvrir', faire: 'toucher', cible: '[data-role="pont-substituer"][data-houblon="beermaverick-nugget"]', attendre: '[data-ecran="substituer"]' },
    // D127 : la puce de moment (un toucher) relit les remplaçants au dry hop, dans le moteur ; « + » envoie à Comparer.
    { nom: 'puce dry hop', faire: 'toucher', cible: '[data-ecran="substituer"] [data-moment="dryhop"]',
      verifier: (p) => {
        const a = p.etat.brouillon?.recette.additions.find((x) => x.id === 'a1');
        if (!a || a.moment !== 'dryActive') return `moment du brouillon : ${a && a.moment}`;
        if (p.etat.recette.additions.find((x) => x.id === 'a1').moment !== 'b60') return 'la recette inscrite a bougé';
        const moteur = p.moteur.remplacants(p.etat.brouillon.recette, 'a1', 400).map((r) => r.cle);
        const rangs = [...document.querySelectorAll('[data-ecran="substituer"] [data-remplacant]')].map((e) => e.dataset.remplacant);
        if (!rangs.length || rangs.some((k) => !moteur.includes(k))) return 'remplaçants hors du moteur au dry hop';
        if (!/au dry hop/.test(document.querySelector('[data-role="contexte"]')?.textContent ?? '')) return 'tête sans « au dry hop »';
        return /au dry hop/.test(document.querySelector('[data-role="choix-dock"]')?.textContent ?? '') || 'le pied ne dit pas « au dry hop »';
      } },
    { nom: '+ Comparer', faire: 'toucher', cible: '[data-ecran="substituer"] [data-role="ajout-comparer"]',
      verifier: (p) => {
        // Le jeu touche la dernière cible visible (jouer-parcours, cible()).
        const k = [...document.querySelectorAll('[data-ecran="substituer"] [data-role="ajout-comparer"]')].at(-1).dataset.houblonComparer;
        if (!p.etat.aComparer.includes(k)) return `${k} absent de la liste de comparaison`;
        const pont = document.querySelector('[data-role="pont-comparer-substituer"]');
        return (pont && !pont.disabled && /Comparer \(2\)/.test(pont.textContent)) || `pont : ${pont && pont.textContent}`;
      } },
    { nom: 'puce 60', faire: 'toucher', cible: '[data-ecran="substituer"] [data-moment="chaud"]',
      verifier: (p) => { const a = p.etat.brouillon.recette.additions.find((x) => x.id === 'a1'); return (a.moment === 'b60' && a.minutes === 60) || `retour à 60′ : ${a.moment} ${a.minutes}`; } },
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
