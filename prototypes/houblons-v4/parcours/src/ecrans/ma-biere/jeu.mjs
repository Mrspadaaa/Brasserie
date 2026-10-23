// Gestes et attentes de l'écran « ma-biere », rejoués par outils/jouer-parcours.mjs --etape=ma-biere sur ma-biere/etat.html.
// Format : ARCHITECTURE.md, « Contrat d'un écran ». verifier(p) se joue DANS la page, avec p = window.__parcours ;
// il rend true ou un message. Sérialisé : aucune variable du module dedans.
const ibuCoherent = (p) => {
  const lu = Number(document.querySelector('[data-ecran="ma-biere"] [data-role="ibu"]').dataset.valeur);
  const b = p.biere();
  if (Math.abs(lu - b.ibu.valeur) > 0.01) return `IBU affiché ${lu} ≠ moteur ${b.ibu.valeur}`;
  for (const a of p.etat.recette.additions) {
    const o = document.querySelector(`[data-ecran="ma-biere"] [data-voie="${a.id}"] [data-role="ibu-ajout"]`);
    const m = b.ibuParAjout[a.id].ibu;
    if (m && (!o || Math.abs(Number(o.dataset.valeur) - m.valeur) > 0.01)) return `IBU de ${a.id} : ${o?.dataset.valeur} ≠ moteur ${m.valeur}`;
    if (!m && !document.querySelector(`[data-ecran="ma-biere"] [data-voie="${a.id}"] [data-inconnu]`)) return `IBU inconnu de ${a.id} écrit comme un nombre`;
  }
  return true;
};
// D80 en direct : chaque famille qu'un ajout fait bouger d'au moins 0,5 point montre son intensité (data-crans à
// 0,6 cran au plus du moteur) ; chaque houblon son usage (comme hopRole) et son α (lot ou fiches).
const d80 = (p) => {
  const r = p.etat.recette, b = p.biere(), fautes = [];
  for (const a of r.additions) {
    const v = document.querySelector(`[data-ecran="ma-biere"] [data-voie="${a.id}"]`);
    if (!v) { fautes.push(`voie ${a.id} absente`); continue; }
    const sans = p.moteur.lireBiere({ ...r, additions: r.additions.filter((x) => x.id !== a.id) });
    let n = 0;
    for (const f of Object.keys(b.profil)) {
      const x = b.profil[f].valeur, y = sans.profil[f].valeur, c = b.profil[f].crans;
      if (!x || !y || c == null || Math.abs(x.centre - y.centre) < 0.5) continue;
      n += 1;
      const el = v.querySelector(`[data-famille="${f}"][data-crans]`);
      if (!el) fautes.push(`${a.id} : intensité de ${f} absente`);
      else if (Math.abs(parseFloat(el.dataset.crans) - c) > 0.6) fautes.push(`${a.id} : ${f} à ${el.dataset.crans} cran, le moteur dit ${c}`);
    }
    const u = v.querySelector('[data-role="usage"]'), role = p.regles.hopRole(a.hopKey);
    if (!u || u.dataset.usage !== (role.value ?? 'inconnu') || u.dataset.source !== (/^fournisseur/.test(role.source) ? "fournisseur" : "règle")) fautes.push(`${a.id} : usage ${u?.dataset.usage} ≠ ${role.value}`);
    const al = v.querySelector('[data-role="alpha"]');
    if (!al || !/\d\s*%/.test(al.textContent) || !/^(lot|fiches)$/.test(al.dataset.source)) fautes.push(`${a.id} : α sans valeur ou sans source`);
    if (p.biere().nonSimules.some((s) => s.ajoutId === a.id) && !v.querySelector('[data-inconnu]')) fautes.push(`${a.id} : arôme non simulé sans « ? »`);
    window.__d80 = (window.__d80 ?? 0) + n;
  }
  return fautes.length ? fautes.join(' ; ') : true;
};

export default {
  page: 'etat.html',
  gestes: [
    { nom: 'lectures au moteur', faire: 'attendre', verifier: ibuCoherent },
    { nom: 'intensite et usage (D80)', faire: 'attendre', verifier: d80 },
    { nom: 'glisser le moment de Nugget', faire: 'attendre',
      // Le doigt glisse le repère du moment de haut en bas (frise verticale) : événements de pointeur joués dans la page,
      // car jouer-parcours ne glisse qu'à l'horizontale. 14 px par cran.
      verifier: (p) => new Promise((ok) => {
        const b = document.querySelector('[data-ajout-repere="a1"]');
        const r = b.getBoundingClientRect(), x = r.x + r.width / 2, y0 = r.y + r.height / 2;
        const ev = (t, y) => b.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, button: 0, buttons: t === 'pointerup' ? 0 : 1 }));
        ev('pointerdown', y0);
        let i = 0;
        const pas = () => {
          i += 1; ev('pointermove', y0 + (84 * i) / 12);
          if (i < 12) { setTimeout(pas, 16); return; }
          const loupe = !!document.querySelector('[data-role="loupe"]');
          ev('pointerup', y0 + 84);
          setTimeout(() => {
            const a = window.__parcours.etat.recette.additions.find((z) => z.id === 'a1');
            const pouce = document.querySelector('[data-ajout-repere="a1"] [data-role="moment-pouce"]')?.textContent;
            if (!loupe) return ok('pas de loupe doigt posé');
            if (a.minutes !== 30) return ok(`moment ${a.moment} ${a.minutes}′ (attendu 30′)`);
            ok(pouce === `${a.minutes}′` || `repère « ${pouce} » ≠ ${a.minutes}′`);
          }, 120);
        };
        setTimeout(pas, 16);
      }) },
    { nom: 'IBU recalcules', faire: 'attendre', verifier: (p) => p.biere().ibu.valeur < 59 || 'IBU total non recalculé' },
    { nom: 'IBU au moteur', faire: 'attendre', verifier: ibuCoherent },
    { nom: 'arome hors simulateur marque', faire: 'attendre', verifier: d80 },
    { nom: 'retour a 60', faire: 'attendre',
      // Le doigt glisse le repère du moment de haut en bas (frise verticale) : événements de pointeur joués dans la page,
      // car jouer-parcours ne glisse qu'à l'horizontale. 14 px par cran.
      verifier: (p) => new Promise((ok) => {
        const b = document.querySelector('[data-ajout-repere="a1"]');
        const r = b.getBoundingClientRect(), x = r.x + r.width / 2, y0 = r.y + r.height / 2;
        const ev = (t, y) => b.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, button: 0, buttons: t === 'pointerup' ? 0 : 1 }));
        ev('pointerdown', y0);
        let i = 0;
        const pas = () => {
          i += 1; ev('pointermove', y0 + (-84 * i) / 12);
          if (i < 12) { setTimeout(pas, 16); return; }
          const loupe = !!document.querySelector('[data-role="loupe"]');
          ev('pointerup', y0 + -84);
          setTimeout(() => {
            const a = window.__parcours.etat.recette.additions.find((z) => z.id === 'a1');
            const pouce = document.querySelector('[data-ajout-repere="a1"] [data-role="moment-pouce"]')?.textContent;
            if (!loupe) return ok('pas de loupe doigt posé');
            if (a.minutes !== 60) return ok(`moment ${a.moment} ${a.minutes}′ (attendu 60′)`);
            ok(pouce === `${a.minutes}′` || `repère « ${pouce} » ≠ ${a.minutes}′`);
          }, 120);
        };
        setTimeout(pas, 16);
      }) },
    { nom: 'dose plus', faire: 'toucher', cible: '[data-voie="a1"] [data-role="dose-plus"]',
      verifier: (p) => {
        const a = p.etat.recette.additions.find((x) => x.id === 'a1');
        const ibu = p.biere().ibu.valeur;
        window.__ibu47 = ibu;
        return (a.grams === 47 && ibu > 60.5) || `dose ${a.grams} g, ${ibu} IBU`;
      } },
    { nom: 'dose moins', faire: 'toucher', cible: '[data-voie="a1"] [data-role="dose-moins"]',
      verifier: (p) => p.etat.recette.additions.find((x) => x.id === 'a1').grams === 46 || 'dose non revenue à 46 g' },
    { nom: 'IBU apres dose', faire: 'attendre', verifier: ibuCoherent },
    { nom: 'appui long sur Nugget', faire: 'appui-long', cible: '[data-role="ouvrir-fiche"][data-houblon="beermaverick-nugget"]', attendre: '[data-role="fiche"]',
      verifier: (p) => (p.route === '#/fiche/nugget' && /Nugget/.test(document.querySelector('[data-role="fiche"]').textContent)) || `fiche : ${p.route}` },
    { nom: 'retour du telephone', faire: 'retour', attendre: '[data-ecran="ma-biere"]',
      verifier: (p) => (p.route === '#/ma-biere' && !document.querySelector('[data-role="fiche"]')) || `après retour : ${p.route}` },
    { nom: 'absolu', faire: 'toucher', cible: '[data-e="absolu"]',
      verifier: () => document.querySelector('[data-barre="resin"]').dataset.echelle === 'absolu' || 'barres restées au style' },
    { nom: 'style', faire: 'toucher', cible: '[data-e="style"]',
      verifier: () => document.querySelector('[data-barre="resin"]').dataset.echelle === 'style' || 'barres restées en absolu' },
    { nom: 'ajout rapide', faire: 'toucher', cible: '[data-role="ajout-rapide-plus"]',
      verifier: (p) => {
        const n = p.etat.recette.additions.filter((a) => a.id !== 'a1');
        if (n.length !== 1 || n[0].minutes !== 10 || n[0].grams !== 10) return `ajout rapide : ${JSON.stringify(n)}`;
        return !!document.querySelector(`[data-ecran="ma-biere"] [data-voie="${n[0].id}"]`) || 'ajout absent de la frise';
      } },
    { nom: 'IBU apres ajout', faire: 'attendre', verifier: ibuCoherent },
    { nom: 'retirer l ajout', faire: 'toucher', cible: '[data-role="ligne-houblon"]:not([data-voie="a1"]) [data-role="retirer"]',
      verifier: (p) => p.etat.recette.additions.length === 1 || 'ajout non retiré' },
    { nom: 'onglet Ma biere', faire: 'toucher', cible: '[data-role="pont-biere"]', attendre: '[data-ecran="biere"]',
      verifier: (p) => p.route === '#/biere' || `route ${p.route}` },
    { nom: 'retour a l etape', faire: 'retour', attendre: '[data-ecran="ma-biere"]' },
    { nom: 'Je n ai pas Nugget', faire: 'toucher', cible: '[data-role="pont-substituer"][data-houblon="beermaverick-nugget"]', attendre: '[data-ecran="substituer"]',
      verifier: (p) => (p.route === '#/substituer/nugget' && p.etat.brouillon?.outil === 'substituer') || `substituer : ${p.route}` },
    { nom: 'abandon', faire: 'fermer', attendre: '[data-ecran="ma-biere"]',
      verifier: (p) => (p.route === '#/ma-biere' && p.etat.brouillon === null && p.etat.recette.additions[0].hopKey === 'beermaverick-nugget') || 'abandon : recette ou brouillon changés' },
    { nom: 'ligne vers Dryhopper', faire: 'toucher', cible: '[data-voie="a1"] [data-role="ibu-ajout"]',
      verifier: (p) => (p.route === '#/dryhopper/a1' && p.etat.brouillon?.ajoutId === 'a1') || `Dryhopper : ${p.route}` },
    { nom: 'retour de Dryhopper', faire: 'retour', attendre: '[data-ecran="ma-biere"]',
      verifier: (p) => (p.route === '#/ma-biere' && p.etat.brouillon === null) || `retour : ${p.route}` },
  ],
};
