// Gestes et attentes de l'onglet « biere » (Ma bière, base v4.10), rejoués par outils/jouer-parcours.mjs --etape=biere
// sur biere/etat.html. Format : ARCHITECTURE.md, « Contrat d'un écran ». verifier(p) se joue DANS la page.
export default {
  page: 'etat.html',
  gestes: [
    { nom: 'onglet et bandeau au moteur', faire: 'attendre', attendre: '[data-ecran="biere"]',
      verifier: (p) => {
        const lu = Number(document.querySelector('[data-ecran="biere"] [data-role="ibu"]').dataset.valeur);
        if (Math.abs(lu - p.biere().ibu.valeur) > 0.01) return `IBU ${lu} ≠ moteur ${p.biere().ibu.valeur}`;
        const t = document.querySelector('[role="tab"][aria-selected="true"]');
        return (t && t.dataset.onglet === 'biere') || 'onglet Ma bière non actif';
      } },
    { nom: 'decompte au moteur', faire: 'attendre',
      verifier: (p) => {
        const b = p.biere(), fs = Object.keys(b.profil);
        const au = fs.filter((f) => b.profil[f].valeur && !b.profil[f].horsStyle).length, non = fs.filter((f) => !b.profil[f].valeur).length;
        const t = document.querySelector('[data-element~="biere-decompte"]').textContent;
        return t.startsWith(`${au} au style · ${non} non située`) || `décompte « ${t} », moteur ${au} et ${non}`;
      } },
    { nom: 'hors style ouverte, facteur', faire: 'attendre',
      verifier: (p) => {
        const b = p.biere().profil.resin;
        const f = (b.valeur.centre / b.bande[1]).toLocaleString('fr-CH', { maximumFractionDigits: 1 });
        const ligne = document.querySelector('[data-famille-ligne="resin"]');
        if (!ligne.querySelector('[data-element~="biere-bannir"]') || ligne.querySelector('[hidden]')) return 'résineux non ouvert';
        return ligne.textContent.includes(`×${f}`) || `facteur ×${f} absent`;
      } },
    { nom: 'toucher Floral', faire: 'toucher', cible: '[data-famille-ligne="floral"] > button',
      verifier: () => document.querySelector('[data-famille-ligne="floral"] > button').getAttribute('aria-expanded') === 'true' || 'Floral ne s’ouvre pas' },
    { nom: 'bannir floral', faire: 'toucher', cible: '#pq-biere-visee-floral [data-visee="bannir"]',
      verifier: () => (!document.querySelector('[data-role="pont-floral"]') && /bannir floral/.test(document.querySelector('[data-element~="biere-objectifs"]').textContent)) || 'objectif « bannir floral » absent' },
    { nom: 'plus floral', faire: 'toucher', cible: '#pq-biere-visee-floral [data-visee="plus"]',
      verifier: () => /\+ floral/.test(document.querySelector('[data-role="pont-floral"]')?.textContent ?? '') || 'objectif « + floral » absent' },
    { nom: 'radar', faire: 'toucher', cible: '[data-vue="radar"]', attendre: 'svg[data-radar][data-objet="biere"]' },
    { nom: 'barres', faire: 'toucher', cible: '[data-vue="barres"]', attendre: '[data-barre="resin"]' },
    { nom: 'plus floral vers Suggestions', faire: 'toucher', cible: '[data-role="pont-floral"]', attendre: '[data-ecran="suggerer"]',
      verifier: (p) => p.route === '#/suggerer' || `route ${p.route}` },
  ],
};
