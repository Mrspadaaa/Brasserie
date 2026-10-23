// Gestes et attentes de Suggérer (q2b, reprise D105), rejoués par outils/jouer-parcours.mjs --etape=suggerer.
// verifier(p) se joue DANS la page, avec p = window.__parcours ; il rend true ou un message. Fonctions sérialisées :
// aucune variable du module dedans (chaque vérification recalcule ce qu'il lui faut avec p.moteur et p.regles).
//
// Vérifié en direct, contre le moteur (pas contre un cas figé) :
// - les voies : celles de proposer(recette, direction) (ajouter, assembler, remplacer à IBU égal) et le dry hop du
//   stock (suggerer) ; une ligne chacune ;
// - D80 : chaque famille qu'une voie fait bouger d'au moins 0,5 point montre son intensité (data-famille, data-crans)
//   à 0,6 cran au plus de l'effet du moteur divisé par le cran du style ; l'usage de chaque houblon est celui de hopRole ;
// - D76 : les extras montrés (data-role="extra") sont exactement les familles hors objectifs qui bougent ;
// - D78 : le « + » ajoute à la liste de comparaison du socle (etat.aComparer), le ✓ l'en retire ; « Comparer (n) »
//   ouvre Comparer avec cette liste.
export default {
  page: 'etat.html',
  gestes: [
    {
      nom: 'départ : les voies du moteur, groupées, et deux proposées',
      faire: 'attendre',
      verifier: (p) => {
        const r = p.etat.recette;
        // La visée commune de l'état (onglet Ma bière) : crans par famille ; « banni » exclut les houblons qui la citent.
        const dir = Object.fromEntries(Object.entries(p.etat.visee).filter(([, v]) => typeof v === 'number' && v !== 0));
        const bannis = Object.entries(p.etat.visee).filter(([, v]) => v === 'banni').map(([f]) => f);
        const cite = (cle) => bannis.some((f) => p.moteur.houblon(cle).familles[f].niveau !== 'non décrit');
        const vs = p.moteur.proposer(r, dir).voies.filter((v) => ['ajouter', 'assemblage', 'remplacer à IBU égal'].includes(v.type) && !v.actions.some((a) => cite(a.hopKey)));
        const manque = vs.filter((v) => !document.querySelector(`[data-ecran="suggerer"] [data-voie][data-id="${v.id}"]`)).map((v) => v.label);
        if (manque.length) return `voies du moteur absentes : ${manque.join(' ; ')}`;
        if (!document.querySelector('[data-groupe="meme-0"]')) return 'pas de groupe « même effet »';
        if (!document.querySelector('[data-voie][data-id^="dryhop-beermaverick-idaho-7"]')) return 'Idaho 7 absent du geste Dry hop';
        const a = p.etat.aComparer;
        if (!a.includes('beermaverick-idaho-7')) return `proposés : ${a.join(', ')}`;
        const pont = document.querySelector('[data-role="pont-comparer"]');
        if (!pont || pont.disabled || pont.textContent.indexOf(`Comparer (${a.length})`) < 0) return `pont : ${pont && pont.textContent}`;
        return true;
      },
    },
    {
      nom: 'D80 et D76 en direct : intensité en crans, extras, usage, α',
      faire: 'attendre',
      verifier: (p) => {
        const r = p.etat.recette, sc = p.moteur.style(r.styleCode);
        // La visée commune de l'état (onglet Ma bière) : crans par famille ; « banni » exclut les houblons qui la citent.
        const dir = Object.fromEntries(Object.entries(p.etat.visee).filter(([, v]) => typeof v === 'number' && v !== 0));
        const bannis = Object.entries(p.etat.visee).filter(([, v]) => v === 'banni').map(([f]) => f);
        const cite = (cle) => bannis.some((f) => p.moteur.houblon(cle).familles[f].niveau !== 'non décrit');
        const vs = p.moteur.proposer(r, dir).voies, cs = p.moteur.suggerer(r, 'floral');
        const fautes = [];
        let familles = 0;
        for (const ligne of document.querySelectorAll('[data-ecran="suggerer"] [data-voie]')) {
          const id = ligne.dataset.id;
          let effets, cles;
          if (id.startsWith('dryhop-')) {
            const c = cs.find((x) => `dryhop-${x.cle}` === id);
            if (!c) { fautes.push(`${id} inconnu du moteur`); continue; }
            effets = Object.fromEntries(Object.entries(c.lu.ecart).map(([f, e]) => [f, e ? e.centre : null])); cles = [c.cle];
          } else {
            const v = vs.find((x) => x.id === id);
            if (!v) { fautes.push(`${id} inconnu du moteur`); continue; }
            effets = Object.fromEntries(Object.entries(v.effect).map(([f, e]) => [f, e.established && e.central != null ? e.central : null]));
            cles = [...new Set(v.actions.map((a) => a.hopKey))];
          }
          const bougent = Object.entries(effets).filter(([, e]) => e != null && Math.abs(e) >= 0.5);
          for (const [f, e] of bougent) {
            familles++;
            const attendu = e / sc.families[f].cran;
            const vus = [...ligne.querySelectorAll(`[data-famille="${f}"][data-crans]`)].map((x) => parseFloat(x.dataset.crans));
            if (!vus.length) fautes.push(`${id} : intensité de ${f} absente (${attendu.toFixed(2)} cran)`);
            else if (!vus.some((x) => Math.abs(x - attendu) <= 0.6)) fautes.push(`${id} : ${f} à ${vus.join('/')} cran, le moteur dit ${attendu.toFixed(2)}`);
          }
          const extrasAttendus = bougent.map(([f]) => f).filter((f) => !(f in dir)).sort().join(',');
          if (cles.some(cite)) fautes.push(`${id} : un houblon cite une famille bannie`);
          const extrasVus = [...ligne.querySelectorAll('[data-role="extra"][data-famille]')].map((x) => x.dataset.famille).sort().join(',');
          if (extrasAttendus !== extrasVus) fautes.push(`${id} : extras ${extrasVus || '∅'}, le moteur ${extrasAttendus || '∅'}`);
          for (const cle of cles) {
            const role = p.regles.hopRole(cle), src = /^fournisseur/.test(role.source) ? 'fournisseur' : 'règle';
            const u = ligne.querySelector(`[data-role="usage"][data-pour="${cle}"]`);
            if (!u || u.dataset.usage !== (role.value ?? 'inconnu') || u.dataset.source !== src) fautes.push(`${id} : usage de ${cle} ${u && u.dataset.usage}/${u && u.dataset.source}, hopRole ${role.value}/${src}`);
            const al = p.regles.hopAlpha(cle);
            const el = ligne.querySelector(`[data-houblon="${cle}"]`)?.parentElement?.querySelector('[data-role="alpha"]');
            const lu = el ? parseFloat(el.textContent.replace(',', '.')) : NaN;
            if (al && Math.abs(lu - al.value) > 0.05) fautes.push(`${id} : α de ${cle} ${lu}, moteur ${al.value}`);
          }
        }
        if (!familles) return 'aucune famille ne bouge : vérification vide';
        return fautes.length ? fautes.slice(0, 6).join(' ; ') : true;
      },
    },
    {
      nom: '« + » sur Golding (à acheter) : ajouté à la comparaison',
      faire: 'toucher',
      cible: '[data-voie][data-id$="golding"] [data-role="ajouter"], [data-voie] [data-role="ajouter"][aria-label="Ajouter Golding à la comparaison"]',
      verifier: (p) => {
        const a = p.etat.aComparer;
        if (!a.includes('beermaverick-golding')) return `Golding absent de la comparaison : ${a.join(', ')}`;
        const pont = document.querySelector('[data-role="pont-comparer"]');
        return pont.textContent.indexOf(`Comparer (${a.length})`) >= 0 ? true : `pont : ${pont.textContent}`;
      },
    },
    {
      nom: '« ✓ » sur Golding : retiré',
      faire: 'toucher',
      cible: '[data-voie] [data-role="ajouter"][aria-label="Retirer Golding de la comparaison"]',
      verifier: (p) => (p.etat.aComparer.includes('beermaverick-golding') ? 'Golding encore dans la comparaison' : true),
    },
    {
      nom: '« + » sur l’assemblage Motueka + Nelson Sauvin : les deux houblons',
      faire: 'toucher',
      cible: '[data-groupe="assembler"] [data-role="ajouter"]',
      verifier: (p) => {
        const a = p.etat.aComparer;
        return a.includes('beermaverick-motueka') && a.includes('beermaverick-nelson-sauvin') ? true : `comparaison : ${a.join(', ')}`;
      },
    },
    {
      nom: 'Hors houblon › : les pistes hors modèle du résineux',
      faire: 'toucher',
      cible: '[data-role="hors-houblon"]',
      attendre: '[data-role="pistes-hors-houblon"]',
      verifier: () => (document.querySelectorAll('[data-role="pistes-hors-houblon"] li').length >= 3 ? true : 'moins de trois pistes'),
    },
    {
      nom: 'fermer les pistes',
      faire: 'toucher',
      cible: '[role="dialog"] button[aria-label="Fermer"]',
      verifier: () => (document.querySelector('[data-ecran="suggerer"]') && ![...document.querySelectorAll('[data-role="pistes-hors-houblon"]')].some((x) => x.getBoundingClientRect().height > 0) ? true : 'pistes encore ouvertes'),
    },
    {
      nom: 'lentille absolu : l’effet du groupe en points',
      faire: 'toucher',
      cible: '[data-ecran="suggerer"] [data-e="absolu"]',
      verifier: () => (/~\+\d+$/.test((document.querySelector('[data-groupe="meme-0"] .font-mono')?.textContent || '').trim()) ? true : 'effet du groupe pas en points'),
    },
    {
      nom: 'vue Radar : ma bière et les voies retenues',
      faire: 'toucher',
      cible: '[data-ecran="suggerer"] [data-e="radar"]',
      attendre: 'svg[data-radar][data-objet="suggerer"]',
      verifier: (p) => {
        const n = document.querySelectorAll('svg[data-radar] [data-serie]').length;
        return n >= 2 ? true : `radar : ${n} série(s)`;
      },
    },
    {
      nom: 'retour aux barres',
      faire: 'toucher',
      cible: '[data-ecran="suggerer"] [data-e="barres"]',
      verifier: () => (document.querySelector('[data-objectif] [data-role="piste"]') && !document.querySelector('svg[data-radar][data-objet="suggerer"]') ? true : 'pistes absentes ou radar resté'),
    },
    {
      // L'action de l'état commun, comme l'onglet Ma bière : le crochet de test du socle (window.__parcours.envoyer).
      nom: 'bannir l’épicé dans l’état commun (fixerVisee)',
      faire: 'attendre',
      verifier: (p) => { p.envoyer({ type: 'visee/fixer', famille: 'spice', valeur: 'banni' }); return true; },
    },
    {
      nom: 'les voies citant l’épicé sont écartées, la carte « Sans épicé » le dit',
      faire: 'attendre',
      attendre: '[data-ecran="suggerer"] [data-banni="spice"]',
      verifier: (p) => {
        const cite = (cle) => p.moteur.houblon(cle).familles.spice.niveau !== 'non décrit';
        const lignes = [...document.querySelectorAll('[data-ecran="suggerer"] [data-voie]')];
        const fautif = lignes.filter((l) => [...l.querySelectorAll('[data-role="ouvrir-fiche"]')].some((h) => cite(h.dataset.houblon)));
        if (fautif.length) return `voies citant l’épicé encore là : ${fautif.map((l) => l.dataset.id).join(', ')}`;
        const tous = p.moteur.proposer(p.etat.recette, { floral: 1, resin: -1 }).voies.filter((v) => ['ajouter', 'assemblage', 'remplacer à IBU égal'].includes(v.type));
        const ecartees = tous.filter((v) => v.actions.some((a) => cite(a.hopKey))).length;
        if (!ecartees) return 'le bannissement n’écarte aucune voie : geste sans effet';
        const n = parseInt(document.querySelector('[data-banni="spice"] [data-role="ecartees"]').textContent, 10);
        if (p.etat.visee.spice !== 'banni') return 'la visée commune n’a pas l’épicé banni';
        return n >= ecartees ? true : `carte : ${n} écartées, le moteur en écarte au moins ${ecartees}`;
      },
    },
    {
      nom: 'lever le bannissement',
      faire: 'attendre',
      verifier: (p) => { p.envoyer({ type: 'visee/fixer', famille: 'spice', valeur: null }); return true; },
    },
    {
      nom: 'les voies reviennent (Golding, Aurum)',
      faire: 'attendre',
      attendre: '[data-ecran="suggerer"] [data-voie] [data-houblon="beermaverick-golding"]',
      verifier: (p) => (!document.querySelector('[data-banni]') && !('spice' in p.etat.visee) ? true : 'bannissement resté'),
    },
    {
      nom: 'appui long sur Motueka : sa fiche, Suggérer dessous',
      faire: 'appui-long',
      cible: '[data-voie] [data-role="ouvrir-fiche"][data-houblon="beermaverick-motueka"]',
      attendre: '[role="dialog"]',
      verifier: () => {
        const d = [...document.querySelectorAll('[role="dialog"]')].find((x) => x.getBoundingClientRect().height > 20);
        if (!d || !/Motueka/.test(d.textContent)) return 'la fiche de Motueka ne s’ouvre pas';
        return location.hash === '#/suggerer' ? true : `route ${location.hash}`;
      },
    },
    {
      nom: 'retour du téléphone : la fiche se ferme, la comparaison reste',
      faire: 'retour',
      verifier: (p) => {
        if ([...document.querySelectorAll('[role="dialog"]')].some((x) => x.getBoundingClientRect().height > 20)) return 'fiche encore ouverte';
        if (!document.querySelector('[data-ecran="suggerer"]')) return 'Suggérer fermé par le retour';
        return p.etat.aComparer.includes('beermaverick-nelson-sauvin') ? true : `comparaison : ${p.etat.aComparer.join(', ')}`;
      },
    },
    {
      nom: 'Comparer (n) : Comparer avec la liste',
      faire: 'toucher',
      cible: '[data-role="pont-comparer"]',
      attendre: '[data-ecran="comparer"]',
      verifier: (p) => {
        const m = location.hash.match(/^#\/comparer\?h=([^&]*)/);
        if (!m) return `route ${location.hash}`;
        const l = m[1].split(',').map((x) => 'beermaverick-' + x).sort().join(',');
        return l === [...p.etat.aComparer].sort().join(',') && p.etat.brouillon === null ? true : `Comparer avec ${m[1]}, liste ${p.etat.aComparer.join(',')}`;
      },
    },
  ],
};
