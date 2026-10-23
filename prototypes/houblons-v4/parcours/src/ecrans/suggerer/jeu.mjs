// Gestes et attentes de Suggérer (q2b), rejoués par outils/jouer-parcours.mjs --etape=suggerer sur suggerer/etat.html.
// verifier(p) se joue DANS la page, avec p = window.__parcours ; il rend true ou un message. Fonctions sérialisées :
// aucune variable du module dedans (chaque vérification recalcule ce qu'il lui faut avec p.moteur et p.regles).
//
// Ce qui est vérifié en direct, contre le moteur (et non contre un cas figé) :
// - D80 : chaque famille qu'un candidat fait bouger d'au moins 0,5 point montre son intensité (data-famille,
//   data-crans) à 0,6 cran au plus de l'écart du moteur divisé par le cran du style ; l'usage (data-usage,
//   data-source) est celui de hopRole ;
// - D76 : les extras montrés (data-role="extra") sont exactement les familles hors objectifs qui bougent ;
// - D87 : l'α de chaque voie est celui du moteur (hopAlpha) ;
// - le « + » ajoute à la comparaison, « Comparer les N » ouvre Comparer avec les choisis.
export default {
  page: 'etat.html',
  gestes: [
    {
      nom: 'départ : une voie par houblon du stock, dans l’ordre du moteur, trois proposés',
      faire: 'attendre',
      verifier: (p) => {
        const cs = p.moteur.suggerer(p.etat.recette, 'floral');
        const voies = [...document.querySelectorAll('[data-ecran="suggerer"] [data-voie]')];
        if (voies.length !== cs.length) return `${voies.length} voies pour ${cs.length} candidats du moteur`;
        for (let i = 0; i < cs.length; i++) if (voies[i].dataset.candidat !== cs[i].cle) return `voie ${i + 1} : ${voies[i].dataset.candidat} au lieu de ${cs[i].cle}`;
        const choisis = voies.filter((v) => v.querySelector('[data-role="ajouter"]').getAttribute('aria-pressed') === 'true');
        if (choisis.length !== 3) return `${choisis.length} proposés au départ (3 attendus)`;
        if (!choisis.some((v) => v.dataset.candidat === 'beermaverick-idaho-7')) return 'Idaho 7, meilleur sur le floral, n’est pas proposé';
        const pont = document.querySelector('[data-ecran="suggerer"] [data-role="pont-comparer"], [data-role="pont-comparer"]');
        if (!pont || pont.disabled || !/Comparer les 3/.test(pont.textContent)) return `pont : ${pont && pont.textContent}`;
        return true;
      },
    },
    {
      nom: 'D80 et D76 en direct : intensité en crans, usage, extras, α',
      faire: 'attendre',
      verifier: (p) => {
        const r = p.etat.recette, sc = p.moteur.style(r.styleCode), b = p.moteur.lireBiere(r);
        const objectifs = new Set(['floral', ...Object.keys(b.profil).filter((f) => b.profil[f].horsStyle === 'au-dessus')]);
        const cs = p.moteur.suggerer(r, 'floral');
        const fautes = [];
        let familles = 0;
        for (const [i, c] of cs.entries()) {
          const v = document.querySelector(`[data-ecran="suggerer"] [data-voie="${i + 1}"]`);
          const muet = v.hasAttribute('data-muet');
          const bougent = Object.entries(c.lu.ecart).filter(([, e]) => e && Math.abs(e.centre) >= 0.5);
          if (muet && bougent.length) fautes.push(`${c.houblon.nom} marqué muet alors que le moteur le fait bouger`);
          for (const [f, e] of bougent) {
            familles++;
            const attendu = e.centre / sc.families[f].cran;
            const vus = [...v.querySelectorAll(`[data-famille="${f}"][data-crans]`)].map((x) => parseFloat(x.dataset.crans));
            if (!vus.length) fautes.push(`${c.houblon.nom} : intensité de ${f} absente (${attendu.toFixed(2)} cran)`);
            else if (!vus.some((x) => Math.abs(x - attendu) <= 0.6)) fautes.push(`${c.houblon.nom} : ${f} à ${vus.join('/')} cran, le moteur dit ${attendu.toFixed(2)}`);
          }
          const extrasAttendus = bougent.map(([f]) => f).filter((f) => !objectifs.has(f)).sort().join(',');
          const extrasVus = [...v.querySelectorAll('[data-role="extra"][data-famille]')].map((x) => x.dataset.famille).sort().join(',');
          if (extrasAttendus !== extrasVus) fautes.push(`${c.houblon.nom} : extras ${extrasVus || '∅'}, le moteur ${extrasAttendus || '∅'}`);
          const role = p.regles.hopRole(c.cle);
          const u = v.querySelector('[data-role="usage"]');
          const src = /^fournisseur/.test(role.source) ? 'fournisseur' : 'règle';
          if (!u || u.dataset.usage !== (role.value ?? 'inconnu') || u.dataset.source !== src) fautes.push(`${c.houblon.nom} : usage ${u && u.dataset.usage}/${u && u.dataset.source}, hopRole ${role.value}/${src}`);
          const a = p.regles.hopAlpha(c.cle);
          const al = v.querySelector('[data-role="alpha"]');
          const lu = al ? parseFloat(al.textContent.replace(',', '.')) : NaN;
          if (a && Math.abs(lu - a.value) > 0.05) fautes.push(`${c.houblon.nom} : α ${lu}, moteur ${a.value}`);
        }
        if (!familles) return 'aucune famille ne bouge : vérification vide';
        return fautes.length ? fautes.slice(0, 6).join(' ; ') : true;
      },
    },
    {
      nom: '« + » sur Galaxy : ajouté à la comparaison',
      faire: 'toucher',
      cible: '[data-voie][data-candidat="beermaverick-galaxy"] [data-role="ajouter"]',
      verifier: (p) => {
        const b = document.querySelector('[data-voie][data-candidat="beermaverick-galaxy"] [data-role="ajouter"]');
        if (b.getAttribute('aria-pressed') !== 'true') return 'Galaxy non ajouté';
        const pont = document.querySelector('[data-role="pont-comparer"]');
        if (!/Comparer les 4/.test(pont.textContent)) return `pont : ${pont.textContent}`;
        const marque = document.querySelector('[data-objectif="floral"] [data-marque="beermaverick-galaxy"]');
        if (!marque) return 'Galaxy ne se marque pas sur la piste de l’objectif';
        return p.etat.recette.additions.some((a) => a.hopKey === 'beermaverick-galaxy') ? 'Suggérer a changé la recette' : true;
      },
    },
    {
      nom: '« ✓ » sur Target : retiré',
      faire: 'toucher',
      cible: '[data-voie][data-candidat="beermaverick-target"] [data-role="ajouter"]',
      verifier: () => {
        const b = document.querySelector('[data-voie][data-candidat="beermaverick-target"] [data-role="ajouter"]');
        const pont = document.querySelector('[data-role="pont-comparer"]');
        return b.getAttribute('aria-pressed') === 'false' && /Comparer les 3/.test(pont.textContent) ? true : `Target ${b.getAttribute('aria-pressed')}, pont ${pont.textContent}`;
      },
    },
    {
      nom: 'lentille absolu : l’écart en points du moteur',
      faire: 'toucher',
      cible: '[data-ecran="suggerer"] [data-e="absolu"]',
      verifier: (p) => {
        const cs = p.moteur.suggerer(p.etat.recette, 'floral');
        const g = document.querySelector('[data-voie="1"] [data-role="gain"] [data-unite="points"]');
        if (!g) return 'gain sans unité « points » en absolu';
        const lu = parseFloat(g.textContent.replace('~', '').replace('−', '-').replace(',', '.'));
        return Math.abs(lu - Math.round(cs[0].visee.centre)) <= 0.5 ? true : `gain ${g.textContent}, moteur ${cs[0].visee.centre}`;
      },
    },
    {
      nom: 'retour au style',
      faire: 'toucher',
      cible: '[data-ecran="suggerer"] [data-e="style"]',
      verifier: () => { return document.querySelector('[data-voie="1"] [data-role="gain"] [data-unite="crans"]') ? true : 'gain pas en crans au style'; },
    },
    {
      nom: 'appui long sur Cascade : sa fiche, Suggérer dessous',
      faire: 'appui-long',
      cible: '[data-voie][data-candidat="beermaverick-cascade"] [data-role="ouvrir-fiche"]',
      attendre: '[role="dialog"]',
      verifier: () => {
        const d = [...document.querySelectorAll('[role="dialog"]')].find((x) => x.getBoundingClientRect().height > 20);
        if (!d || !/Cascade/.test(d.textContent)) return 'la fiche de Cascade ne s’ouvre pas';
        return location.hash === '#/suggerer' ? true : `route ${location.hash}`;
      },
    },
    {
      nom: 'retour du téléphone : la fiche se ferme, les choix restent',
      faire: 'retour',
      verifier: () => {
        if ([...document.querySelectorAll('[role="dialog"]')].some((x) => x.getBoundingClientRect().height > 20)) return 'fiche encore ouverte';
        if (!document.querySelector('[data-ecran="suggerer"]')) return 'Suggérer fermé par le retour';
        const choisis = [...document.querySelectorAll('[data-voie] [data-role="ajouter"][aria-pressed="true"]')].map((b) => b.closest('[data-voie]').dataset.candidat);
        return choisis.join(',') === 'beermaverick-idaho-7,beermaverick-cascade,beermaverick-galaxy' ? true : `choisis : ${choisis.join(',')}`;
      },
    },
    {
      nom: 'Comparer les 3 : Comparer avec Idaho 7, Cascade, Galaxy',
      faire: 'toucher',
      cible: '[data-role="pont-comparer"]',
      attendre: '[data-ecran="comparer"]',
      verifier: (p) => {
        const h = location.hash;
        const m = h.match(/^#\/comparer\?h=(.*)$/);
        if (!m) return `route ${h}`;
        const l = m[1].split(',');
        return l.length === 3 && ['idaho-7', 'cascade', 'galaxy'].every((x) => l.includes(x)) && p.etat.brouillon === null ? true : `Comparer avec ${l.join(', ')}`;
      },
    },
  ],
};
