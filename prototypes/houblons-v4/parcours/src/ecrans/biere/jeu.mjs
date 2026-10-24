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
    // D108 : la visée de la base, posée sur la piste (losange relié au point), d'un palier ; « × » la retire.
    { nom: 'toucher Tropicaux', faire: 'toucher', cible: '[data-famille-ligne="tropical"] > button',
      verifier: () => !document.querySelector('[data-famille-ligne="tropical"] [data-visee-marque]') || 'losange au repos' },
    { nom: 'plus tropicaux : losange à droite, faible', faire: 'toucher', cible: '#pq-biere-visee-tropical [data-visee="plus"]',
      verifier: (p) => {
        const l = document.querySelector('[data-famille-ligne="tropical"]');
        const m = l.querySelector('[data-visee-marque]'), pt = l.querySelector('[data-biere-point]'), lien = l.querySelector('[data-visee-lien]');
        if (!m || !pt || !lien) return 'losange, point ou trait absent';
        const c = (e) => { const r = e.getBoundingClientRect(); return r.left + r.width / 2; };
        if (!(c(m) > c(pt) + 2)) return 'losange pas à droite du point';
        const r = lien.getBoundingClientRect();
        if (Math.abs(r.left - c(pt)) > 4 || Math.abs(r.right - c(m)) > 4) return 'le trait ne relie pas le point au losange';
        if (p.etat.visee.tropical !== 0.5 || m.dataset.niveau !== '0.5') return `visée ${p.etat.visee.tropical}, niveau ${m.dataset.niveau}`;
        return l.querySelector('[data-palier]').textContent === 'faible' || 'palier non nommé';
      } },
    { nom: 'plus tropicaux encore : moyen', faire: 'toucher', cible: '#pq-biere-visee-tropical [data-visee="plus"]',
      verifier: (p) => (p.etat.visee.tropical === 1.5 && document.querySelector('#pq-biere-visee-tropical [data-palier]').textContent === 'moyen') || `visée ${p.etat.visee.tropical}` },
    { nom: 'la puce suit la visée', faire: 'attendre',
      verifier: () => /^\+ tropicaux/.test(document.querySelector('[data-role="pont-objectif-tropical"]')?.textContent ?? '') || 'puce « + tropicaux » absente' },
    { nom: 'retirer la visée', faire: 'toucher', cible: '#pq-biere-visee-tropical [data-visee="retirer"]',
      verifier: (p) => (!('tropical' in p.etat.visee) && !document.querySelector('[data-famille-ligne="tropical"] [data-visee-marque]') && !document.querySelector('[data-role="pont-objectif-tropical"]')) || 'visée restée' },
    { nom: 'toucher Floral', faire: 'toucher', cible: '[data-famille-ligne="floral"] > button',
      verifier: () => document.querySelector('[data-famille-ligne="floral"] > button').getAttribute('aria-expanded') === 'true' || 'Floral ne s’ouvre pas' },
    { nom: 'bannir floral', faire: 'toucher', cible: '#pq-biere-visee-floral [data-visee="bannir"]',
      verifier: () => (window.__parcours.etat.visee.floral === 0 && document.querySelector('[data-famille-ligne="floral"][data-bannie]') && !document.querySelector('[data-role="pont-floral"]') && /bannir floral/.test(document.querySelector('[data-element~="biere-objectifs"]').textContent)) || 'visée « bannir » non posée ou objectif absent' },
    { nom: 'plus floral', faire: 'toucher', cible: '#pq-biere-visee-floral [data-visee="plus"]',
      verifier: () => window.__parcours.etat.visee.floral === 0.5 && document.querySelector('#pq-biere-visee-floral [data-palier]')?.textContent === 'faible' && /\+ floral/.test(document.querySelector('[data-role="pont-objectif-floral"]')?.textContent ?? '') && /^Plus floral : /.test(document.querySelector('[data-role="pont-floral"]')?.textContent ?? '') || 'objectif « + floral » ou ligne « Plus floral : … voies › » absent' },
    { nom: 'radar', faire: 'toucher', cible: '[data-vue="radar"]', attendre: 'svg[data-radar][data-objet="biere"]' },
    // Le radar m4 de sa base : ma dégustation (résineux marqué) face à la zone du style, la grille dessous (D124).
    { nom: 'radar : grille de dégustation', faire: 'attendre', attendre: '[data-role="degustation"]',
      verifier: () => {
        const g = document.querySelector('[data-role="degustation"]');
        if (!['pas senti', 'faible', 'moyen', 'marqué'].every((m) => g.textContent.includes(m))) return 'en-têtes de la grille absents';
        const coche = g.querySelector('[data-famille="resin"] [aria-checked="true"]');
        return (coche && coche.className.includes('pq-biere-deg-trop')) || 'résineux non noté marqué (orangé)';
      } },
    { nom: 'radar : toucher le sommet de Résineux', faire: 'toucher', cible: '[data-cible-sommet="resin"]',
      verifier: () => /Résineux : marqué, au-dessus du style/.test(document.querySelector('[data-role="bulle-radar"]')?.textContent ?? '') || 'bulle absente' },
    { nom: 'radar : noter le floral moyen', faire: 'toucher', cible: '[data-famille="floral"] [aria-label="Floral : moyen"]',
      verifier: () => !!document.querySelector('[data-cible-sommet="floral"]') || 'le floral noté ne fait pas de sommet' },
    { nom: 'radar : le retoucher, pas goûté', faire: 'toucher', cible: '[data-famille="floral"] [aria-checked="true"]',
      verifier: () => !document.querySelector('[data-cible-sommet="floral"]') || 'le floral reste noté' },
    { nom: 'barres', faire: 'toucher', cible: '[data-vue="barres"]', attendre: '[data-barre="resin"]' },
    { nom: 'plus floral vers Suggestions', faire: 'toucher', cible: '[data-role="pont-floral"]', attendre: '[data-ecran="suggerer"]',
      verifier: (p) => p.route === '#/suggerer' || `route ${p.route}` },
  ],
};
